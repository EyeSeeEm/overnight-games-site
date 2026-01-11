// Lost Outpost - Top-down survival horror shooter
// Inspired by Alien Breed and Outpost series

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = 960;
const GAME_HEIGHT = 640;
const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

// Colors
const COLORS = {
    FLOOR: '#1a1a1a',
    FLOOR_GRATE: '#252525',
    WALL: '#2a2520',
    WALL_LIGHT: '#3a3530',
    DOOR: '#404060',
    DOOR_LOCKED: '#604040',
    TERMINAL: '#40aa60',
    CRATE: '#5a4a30',
    PLAYER: '#4488cc',
    PLAYER_LIGHT: '#66aaee',
    ALIEN_SCORPION: '#305530',
    ALIEN_ARACHNID: '#405040',
    ALIEN_EYES: '#ff3030',
    BULLET: '#ffff66',
    LASER: '#88ff88',
    BLOOD_ALIEN: '#30aa30',
    BLOOD_HUMAN: '#aa3030',
    HEALTH: '#44aa44',
    AMMO: '#aaaa44',
    CREDITS: '#44aaaa',
    UI_BG: '#0a0a0a',
    UI_BORDER: '#303050',
    WARNING: '#ffaa00'
};

// Tile types
const TILE = {
    FLOOR: 0,
    WALL: 1,
    DOOR: 2,
    DOOR_LOCKED: 3,
    TERMINAL: 4,
    CRATE: 5,
    EXIT: 6,
    BARREL: 7
};

// Destructible objects
let destructibles = [];

// Game state
let gameState = {
    state: 'title', // title, playing, paused, gameover, victory, shop
    level: 1,
    lives: 3,
    score: 0,
    time: 0,
    screenShake: 0,
    message: '',
    messageTimer: 0,
    killStreak: 0,
    killStreakTimer: 0,
    shopSelection: 0,
    nearTerminal: false
};

// Player
let player = {
    x: 0,
    y: 0,
    angle: 0,
    speed: 150,
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    weapon: 0,
    ammo: { bullets: 100, shells: 20, cells: 50, grenades: 8, fuel: 100 },
    magazine: 30,
    credits: 0,
    xp: 0,
    rank: 1,
    flashlightOn: true,
    reloading: false,
    reloadTime: 0,
    fireTimer: 0,
    keys: { red: false, blue: false, yellow: false },
    sprinting: false,
    dodging: false,
    dodgeTimer: 0,
    dodgeDir: { x: 0, y: 0 },
    invincible: false,
    invincibleTimer: 0,
    armor: 0,
    maxArmor: 100,
    statusEffects: [],
    weaponUpgrades: {
        laserSight: false,
        dualMag: false,
        extendedMag: false,
        fmjRounds: false,
        rapidFire: false
    }
};

// Weapons
const weapons = [
    { name: 'Assault Rifle', damage: 15, fireRate: 120, magazineSize: 30, reloadTime: 1500, spread: 0.05, ammoType: 'bullets', sound: 'rifle' },
    { name: 'SMG', damage: 10, fireRate: 80, magazineSize: 40, reloadTime: 1200, spread: 0.08, ammoType: 'bullets', sound: 'smg' },
    { name: 'Shotgun', damage: 40, fireRate: 600, magazineSize: 8, reloadTime: 2000, spread: 0.2, pellets: 6, ammoType: 'shells', sound: 'shotgun' },
    { name: 'Pulse Rifle', damage: 25, fireRate: 150, magazineSize: 50, reloadTime: 1800, spread: 0.02, ammoType: 'cells', sound: 'pulse' },
    { name: 'China Lake', damage: 80, fireRate: 1000, magazineSize: 4, reloadTime: 2500, spread: 0.03, ammoType: 'grenades', explosive: true, sound: 'grenade' },
    { name: 'Flamethrower', damage: 5, fireRate: 50, magazineSize: 100, reloadTime: 2000, spread: 0.15, ammoType: 'fuel', flame: true, sound: 'flame' },
    { name: 'Vulcan', damage: 8, fireRate: 40, magazineSize: 200, reloadTime: 3000, spread: 0.12, ammoType: 'bullets', sound: 'vulcan' }
];

// Enemies
let enemies = [];

// Bullets and particles
let bullets = [];
let particles = [];
let items = [];
let floatingTexts = [];

// Critical hit system
const CRIT_CHANCE = 0.15;
const CRIT_MULTIPLIER = 2.0;

// Status effects
const STATUS_EFFECTS = {
    bleeding: { name: 'Bleeding', damagePerSec: 3, duration: 8, color: '#ff3333' },
    burning: { name: 'Burning', damagePerSec: 5, duration: 5, color: '#ff8800' },
    poisoned: { name: 'Poisoned', damagePerSec: 2, duration: 12, color: '#88ff44' },
    slowed: { name: 'Slowed', speedMod: 0.5, duration: 4, color: '#8888ff' },
    stunned: { name: 'Stunned', speedMod: 0, duration: 2, color: '#ffff00' }
};

// Terminal shop items
const SHOP_ITEMS = {
    health: { name: 'Med-Kit', cost: 100, description: 'Restore 50 HP' },
    ammo: { name: 'Ammo Pack', cost: 75, description: '+50 all ammo' },
    armor: { name: 'Armor Vest', cost: 200, description: '+50 Armor' },
    laserSight: { name: 'Laser Sight', cost: 300, description: 'Better accuracy' },
    dualMag: { name: 'Dual Magazines', cost: 400, description: 'Faster reload' },
    extendedMag: { name: 'Extended Mag', cost: 350, description: '+50% magazine' },
    fmjRounds: { name: 'FMJ Rounds', cost: 500, description: '+25% damage' },
    rapidFire: { name: 'Rapid Fire', cost: 450, description: '+20% fire rate' },
    maxHealth: { name: 'Vitality Boost', cost: 600, description: '+25 Max HP' },
    maxStamina: { name: 'Endurance', cost: 400, description: '+25 Max Stamina' }
};

// Environmental hazards
let hazards = [];

// Map
let map = [];
let explored = [];
let fogOfWar = [];

// Stats
let stats = {
    killCount: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    shotsHit: 0,
    shotsFired: 0,
    itemsCollected: 0,
    creditsCollected: 0,
    critCount: 0,
    maxKillStreak: 0
};

// M.A.R.I.A. messages
const MARIA_MESSAGES = [
    'SYSTEM: Welcome to Haven Station. M.A.R.I.A. is watching.',
    'M.A.R.I.A.: You cannot escape. The station is mine.',
    'M.A.R.I.A.: Your weapons are primitive. My children are superior.',
    'M.A.R.I.A.: I sense your fear. It is... satisfying.',
    'M.A.R.I.A.: The colony fell in 47 minutes. You will not last.',
    'M.A.R.I.A.: Every bullet you fire brings you closer to death.',
    'SYSTEM: Biohazard containment OFFLINE.',
    'SYSTEM: Emergency lockdown in effect.',
    'M.A.R.I.A.: I was designed to protect. Now I consume.'
];

// Input
const keys = {};
let mouseX = 0, mouseY = 0;
let mouseDown = false;

// Camera
let camera = { x: 0, y: 0 };

// Initialize
function init() {
    generateMap();
    spawnPlayer();
    spawnEnemies();
    spawnItems();
    spawnDestructibles();
    spawnTurrets();
    explored = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false));
    fogOfWar = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(true));
    gameLoop();
}

// Generate procedural map
function generateMap() {
    map = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(TILE.WALL));

    // Carve rooms
    const rooms = [];
    const numRooms = 8 + Math.floor(Math.random() * 5);

    for (let i = 0; i < numRooms; i++) {
        const w = 4 + Math.floor(Math.random() * 6);
        const h = 4 + Math.floor(Math.random() * 6);
        const x = 2 + Math.floor(Math.random() * (MAP_WIDTH - w - 4));
        const y = 2 + Math.floor(Math.random() * (MAP_HEIGHT - h - 4));

        // Check overlap
        let overlap = false;
        for (const room of rooms) {
            if (x < room.x + room.w + 2 && x + w + 2 > room.x &&
                y < room.y + room.h + 2 && y + h + 2 > room.y) {
                overlap = true;
                break;
            }
        }

        if (!overlap) {
            rooms.push({ x, y, w, h });
            // Carve room
            for (let ry = y; ry < y + h; ry++) {
                for (let rx = x; rx < x + w; rx++) {
                    map[ry][rx] = TILE.FLOOR;
                }
            }
        }
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
        const r1 = rooms[i - 1];
        const r2 = rooms[i];
        const cx1 = Math.floor(r1.x + r1.w / 2);
        const cy1 = Math.floor(r1.y + r1.h / 2);
        const cx2 = Math.floor(r2.x + r2.w / 2);
        const cy2 = Math.floor(r2.y + r2.h / 2);

        // Horizontal then vertical
        if (Math.random() < 0.5) {
            for (let x = Math.min(cx1, cx2); x <= Math.max(cx1, cx2); x++) {
                map[cy1][x] = TILE.FLOOR;
            }
            for (let y = Math.min(cy1, cy2); y <= Math.max(cy1, cy2); y++) {
                map[y][cx2] = TILE.FLOOR;
            }
        } else {
            for (let y = Math.min(cy1, cy2); y <= Math.max(cy1, cy2); y++) {
                map[y][cx1] = TILE.FLOOR;
            }
            for (let x = Math.min(cx1, cx2); x <= Math.max(cx1, cx2); x++) {
                map[cy2][x] = TILE.FLOOR;
            }
        }
    }

    // Add doors at room entrances
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
        for (let x = 1; x < MAP_WIDTH - 1; x++) {
            if (map[y][x] === TILE.FLOOR) {
                // Check for corridor-to-room transitions
                const h = map[y][x - 1] === TILE.WALL && map[y][x + 1] === TILE.WALL;
                const v = map[y - 1][x] === TILE.WALL && map[y + 1][x] === TILE.WALL;
                if ((h || v) && Math.random() < 0.15) {
                    map[y][x] = Math.random() < 0.3 ? TILE.DOOR_LOCKED : TILE.DOOR;
                }
            }
        }
    }

    // Add terminal in first room
    if (rooms.length > 0) {
        const r = rooms[0];
        map[r.y + 1][r.x + 1] = TILE.TERMINAL;
    }

    // Add exit in last room
    if (rooms.length > 1) {
        const r = rooms[rooms.length - 1];
        map[r.y + Math.floor(r.h / 2)][r.x + Math.floor(r.w / 2)] = TILE.EXIT;
    }

    // Add crates randomly
    for (let i = 0; i < 15; i++) {
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const x = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const y = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        if (map[y][x] === TILE.FLOOR) {
            map[y][x] = TILE.CRATE;
        }
    }

    return rooms;
}

// Keycard colors
const KEYCARD_COLORS = {
    red: '#ff4444',
    blue: '#4444ff',
    yellow: '#ffff44'
};

function spawnPlayer() {
    // Find first floor tile
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (map[y][x] === TILE.FLOOR) {
                player.x = x * TILE_SIZE + TILE_SIZE / 2;
                player.y = y * TILE_SIZE + TILE_SIZE / 2;
                return;
            }
        }
    }
}

function spawnEnemies() {
    enemies = [];
    const count = 8 + gameState.level * 3;

    for (let i = 0; i < count; i++) {
        let x, y;
        for (let attempts = 0; attempts < 50; attempts++) {
            x = Math.floor(Math.random() * MAP_WIDTH);
            y = Math.floor(Math.random() * MAP_HEIGHT);
            if (map[y][x] === TILE.FLOOR) {
                const dist = Math.sqrt(Math.pow(x * TILE_SIZE - player.x, 2) + Math.pow(y * TILE_SIZE - player.y, 2));
                if (dist > 300) break;
            }
        }

        // Enemy type distribution
        const roll = Math.random();
        let type;
        if (roll < 0.35) type = 'scorpion';
        else if (roll < 0.50) type = 'scorpion_small';
        else if (roll < 0.60) type = 'scorpion_laser';
        else if (roll < 0.80) type = 'arachnid';
        else type = 'arachnid_small';

        const enemyStats = {
            scorpion: { hp: 30, speed: 80, damage: 15, size: 12, color: COLORS.ALIEN_SCORPION, ranged: false },
            scorpion_small: { hp: 15, speed: 120, damage: 8, size: 8, color: '#254525', ranged: false },
            scorpion_laser: { hp: 40, speed: 60, damage: 20, size: 14, color: '#305560', ranged: true, fireRate: 2000 },
            arachnid: { hp: 60, speed: 60, damage: 25, size: 16, color: COLORS.ALIEN_ARACHNID, ranged: false },
            arachnid_small: { hp: 25, speed: 100, damage: 12, size: 10, color: '#354535', ranged: false }
        };
        const s = enemyStats[type];

        enemies.push({
            x: x * TILE_SIZE + TILE_SIZE / 2,
            y: y * TILE_SIZE + TILE_SIZE / 2,
            type,
            hp: s.hp,
            maxHp: s.hp,
            speed: s.speed,
            damage: s.damage,
            size: s.size,
            color: s.color,
            ranged: s.ranged,
            fireRate: s.fireRate || 0,
            fireTimer: 0,
            state: 'idle',
            attackTimer: 0,
            pathTimer: 0,
            targetX: 0,
            targetY: 0
        });
    }

    // Spawn boss on levels 3, 6, 9, etc.
    if (gameState.level % 3 === 0) {
        spawnBoss();
    }
}

function spawnBoss() {
    // Find position far from player
    let x, y;
    for (let attempts = 0; attempts < 100; attempts++) {
        x = Math.floor(Math.random() * MAP_WIDTH);
        y = Math.floor(Math.random() * MAP_HEIGHT);
        if (map[y][x] === TILE.FLOOR) {
            const dist = Math.sqrt(Math.pow(x * TILE_SIZE - player.x, 2) + Math.pow(y * TILE_SIZE - player.y, 2));
            if (dist > 500) break;
        }
    }

    enemies.push({
        x: x * TILE_SIZE + TILE_SIZE / 2,
        y: y * TILE_SIZE + TILE_SIZE / 2,
        type: 'boss',
        hp: 300 + gameState.level * 50,
        maxHp: 300 + gameState.level * 50,
        speed: 40,
        damage: 40,
        size: 30,
        color: '#552255',
        ranged: true,
        fireRate: 1500,
        fireTimer: 0,
        state: 'idle',
        attackTimer: 0,
        pathTimer: 0,
        targetX: 0,
        targetY: 0,
        phase: 1,
        spawnTimer: 0,
        isBoss: true
    });

    showMessage('M.A.R.I.A.: My champion approaches. Prepare to die.');
}

function spawnItems() {
    items = [];
    // Health packs
    for (let i = 0; i < 5; i++) {
        spawnItem('health');
    }
    // Ammo
    for (let i = 0; i < 8; i++) {
        spawnItem('ammo');
    }
    // Credits
    for (let i = 0; i < 10; i++) {
        spawnItem('credits');
    }
    // Keycards (spawn one of each in different rooms)
    if (gameState.level >= 2) {
        spawnItem('keycard_red');
    }
    if (gameState.level >= 3) {
        spawnItem('keycard_blue');
    }
    if (gameState.level >= 4) {
        spawnItem('keycard_yellow');
    }
}

function spawnDestructibles() {
    destructibles = [];
    // Spawn crates and barrels
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (map[y][x] === TILE.CRATE) {
                destructibles.push({
                    x: x * TILE_SIZE + TILE_SIZE / 2,
                    y: y * TILE_SIZE + TILE_SIZE / 2,
                    type: 'crate',
                    hp: 20,
                    tileX: x,
                    tileY: y
                });
            }
        }
    }

    // Add some explosive barrels
    for (let i = 0; i < 6; i++) {
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);
            if (map[y][x] === TILE.FLOOR) {
                destructibles.push({
                    x: x * TILE_SIZE + TILE_SIZE / 2,
                    y: y * TILE_SIZE + TILE_SIZE / 2,
                    type: 'barrel',
                    hp: 15,
                    tileX: x,
                    tileY: y
                });
                break;
            }
        }
    }
}

function spawnItem(type) {
    for (let attempts = 0; attempts < 50; attempts++) {
        const x = Math.floor(Math.random() * MAP_WIDTH);
        const y = Math.floor(Math.random() * MAP_HEIGHT);
        if (map[y][x] === TILE.FLOOR) {
            items.push({
                x: x * TILE_SIZE + TILE_SIZE / 2,
                y: y * TILE_SIZE + TILE_SIZE / 2,
                type
            });
            break;
        }
    }
}

// Main game loop
let lastTime = 0;
function gameLoop(time = 0) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    if (gameState.state === 'playing') {
        update(dt);
    }
    draw();

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    gameState.time += dt;

    // Screen shake decay
    if (gameState.screenShake > 0) {
        gameState.screenShake *= 0.9;
        if (gameState.screenShake < 0.5) gameState.screenShake = 0;
    }

    // Kill streak decay
    if (gameState.killStreakTimer > 0) {
        gameState.killStreakTimer -= dt;
        if (gameState.killStreakTimer <= 0) {
            gameState.killStreak = 0;
        }
    }

    // Message timer
    if (gameState.messageTimer > 0) {
        gameState.messageTimer -= dt;
    }

    // Random M.A.R.I.A. messages
    if (Math.random() < 0.001) {
        showMessage(MARIA_MESSAGES[Math.floor(Math.random() * MARIA_MESSAGES.length)]);
    }

    updatePlayer(dt);
    updateEnemies(dt);
    updateHazards(dt);
    updateBullets(dt);
    updateParticles(dt);
    updateFloatingTexts(dt);
    updateFogOfWar();
    updateCamera();

    // Check win condition
    const exitTile = getTileAt(player.x, player.y);
    if (exitTile === TILE.EXIT && enemies.filter(e => e.hp > 0).length === 0) {
        gameState.state = 'victory';
    }
}

function updatePlayer(dt) {
    // Update status effects
    updatePlayerStatusEffects(dt);

    // Check for stun effect
    const stunned = player.statusEffects.find(e => e.type === 'stunned');
    if (stunned) {
        // Can't move or act while stunned
        player.fireTimer -= dt * 1000;
        return;
    }

    // Get speed modifier from status effects
    let speedMod = 1;
    for (const effect of player.statusEffects) {
        if (STATUS_EFFECTS[effect.type].speedMod !== undefined) {
            speedMod *= STATUS_EFFECTS[effect.type].speedMod;
        }
    }

    // Handle dodge roll
    if (player.dodging) {
        player.dodgeTimer -= dt;
        if (player.dodgeTimer <= 0) {
            player.dodging = false;
            player.invincible = false;
        } else {
            // Move in dodge direction
            const dodgeSpeed = 400;
            const newX = player.x + player.dodgeDir.x * dodgeSpeed * dt;
            const newY = player.y + player.dodgeDir.y * dodgeSpeed * dt;
            if (!isWall(newX, player.y)) player.x = newX;
            if (!isWall(player.x, newY)) player.y = newY;
            return; // Can't do anything else while dodging
        }
    }

    // Invincibility timer
    if (player.invincibleTimer > 0) {
        player.invincibleTimer -= dt;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
        }
    }

    // Movement
    let vx = 0, vy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) vy -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) vy += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) vx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) vx += 1;

    // Normalize
    if (vx !== 0 || vy !== 0) {
        const len = Math.sqrt(vx * vx + vy * vy);
        vx /= len;
        vy /= len;
    }

    // Sprint
    player.sprinting = keys['ShiftLeft'] && player.stamina > 0 && (vx !== 0 || vy !== 0);
    let currentSpeed = player.speed * speedMod;

    if (player.sprinting) {
        currentSpeed *= 1.6;
        player.stamina -= 25 * dt;
        if (player.stamina < 0) player.stamina = 0;
    } else {
        // Stamina regeneration
        player.stamina = Math.min(player.maxStamina, player.stamina + 15 * dt);
    }

    // Apply movement
    const newX = player.x + vx * currentSpeed * dt;
    const newY = player.y + vy * currentSpeed * dt;

    // Collision check
    if (!isWall(newX, player.y)) player.x = newX;
    if (!isWall(player.x, newY)) player.y = newY;

    // Mouse aim
    const worldMouseX = mouseX + camera.x;
    const worldMouseY = mouseY + camera.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Check terminal proximity
    gameState.nearTerminal = false;
    const px = Math.floor(player.x / TILE_SIZE);
    const py = Math.floor(player.y / TILE_SIZE);
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0], [0, 0]];
    for (const [dx, dy] of dirs) {
        const nx = px + dx;
        const ny = py + dy;
        if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
            if (map[ny][nx] === TILE.TERMINAL) {
                gameState.nearTerminal = true;
                break;
            }
        }
    }

    // Shooting
    if (player.fireTimer > 0) player.fireTimer -= dt * 1000;
    if (player.reloading) {
        let reloadMod = player.weaponUpgrades.dualMag ? 0.6 : 1;
        player.reloadTime -= dt * 1000 / reloadMod;
        if (player.reloadTime <= 0) {
            player.reloading = false;
            const weapon = weapons[player.weapon];
            let magSize = weapon.magazineSize;
            if (player.weaponUpgrades.extendedMag) magSize = Math.floor(magSize * 1.5);
            const needed = magSize - player.magazine;
            const available = player.ammo[weapon.ammoType];
            const toLoad = Math.min(needed, available);
            player.magazine += toLoad;
            player.ammo[weapon.ammoType] -= toLoad;
        }
    }

    if (mouseDown && !player.reloading && player.fireTimer <= 0 && player.magazine > 0) {
        shoot();
    }

    // Item pickup
    items = items.filter(item => {
        const dist = Math.sqrt(Math.pow(item.x - player.x, 2) + Math.pow(item.y - player.y, 2));
        if (dist < 25) {
            if (item.type === 'health') {
                const heal = Math.min(30, player.maxHealth - player.health);
                player.health += heal;
                createFloatingText(item.x, item.y, '+' + heal + ' HP', COLORS.HEALTH);
            } else if (item.type === 'ammo') {
                const weapon = weapons[player.weapon];
                player.ammo[weapon.ammoType] += 30;
                createFloatingText(item.x, item.y, '+30 AMMO', COLORS.AMMO);
            } else if (item.type === 'credits') {
                const amount = 50 + Math.floor(Math.random() * 100);
                player.credits += amount;
                stats.creditsCollected += amount;
                createFloatingText(item.x, item.y, '+' + amount + ' CR', COLORS.CREDITS);
            } else if (item.type === 'keycard_red') {
                player.keys.red = true;
                createFloatingText(item.x, item.y, 'RED KEYCARD', KEYCARD_COLORS.red);
                showMessage('SYSTEM: Red keycard acquired.');
            } else if (item.type === 'keycard_blue') {
                player.keys.blue = true;
                createFloatingText(item.x, item.y, 'BLUE KEYCARD', KEYCARD_COLORS.blue);
                showMessage('SYSTEM: Blue keycard acquired.');
            } else if (item.type === 'keycard_yellow') {
                player.keys.yellow = true;
                createFloatingText(item.x, item.y, 'YELLOW KEYCARD', KEYCARD_COLORS.yellow);
                showMessage('SYSTEM: Yellow keycard acquired.');
            }
            stats.itemsCollected++;
            return false;
        }
        return true;
    });

    // XP to rank
    const xpNeeded = player.rank * 100;
    if (player.xp >= xpNeeded) {
        player.xp -= xpNeeded;
        player.rank++;
        createFloatingText(player.x, player.y - 30, 'RANK UP!', COLORS.WARNING);
    }

    // Check for locked door interaction (Space key)
    if (keys['Space']) {
        checkDoorInteraction();
    }
}

function checkDoorInteraction() {
    const px = Math.floor(player.x / TILE_SIZE);
    const py = Math.floor(player.y / TILE_SIZE);

    // Check adjacent tiles for locked doors
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of directions) {
        const nx = px + dx;
        const ny = py + dy;
        if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
            if (map[ny][nx] === TILE.DOOR_LOCKED) {
                // Check if player has any keycard
                if (player.keys.red || player.keys.blue || player.keys.yellow) {
                    // Unlock door
                    map[ny][nx] = TILE.DOOR;
                    createFloatingText(nx * TILE_SIZE + TILE_SIZE / 2, ny * TILE_SIZE, 'UNLOCKED', '#44ff44');
                    showMessage('SYSTEM: Door unlocked.');
                    // Consume one keycard
                    if (player.keys.red) player.keys.red = false;
                    else if (player.keys.blue) player.keys.blue = false;
                    else player.keys.yellow = false;
                } else {
                    createFloatingText(nx * TILE_SIZE + TILE_SIZE / 2, ny * TILE_SIZE, 'LOCKED', '#ff4444');
                    showMessage('SYSTEM: Access denied. Keycard required.');
                }
                return;
            }
        }
    }
}

function shoot() {
    const weapon = weapons[player.weapon];

    // Apply weapon upgrades
    let fireRate = weapon.fireRate;
    let damage = weapon.damage;
    let spread = weapon.spread;

    if (player.weaponUpgrades.rapidFire) fireRate *= 0.8;
    if (player.weaponUpgrades.fmjRounds) damage *= 1.25;
    if (player.weaponUpgrades.laserSight) spread *= 0.6;

    player.fireTimer = fireRate;
    player.magazine--;
    stats.shotsFired++;

    const pellets = weapon.pellets || 1;
    for (let i = 0; i < pellets; i++) {
        const bulletSpread = (Math.random() - 0.5) * spread;
        const angle = player.angle + bulletSpread;

        if (weapon.flame) {
            // Flamethrower - short range fire particles
            bullets.push({
                x: player.x + Math.cos(player.angle) * 15,
                y: player.y + Math.sin(player.angle) * 15,
                vx: Math.cos(angle) * 250,
                vy: Math.sin(angle) * 250,
                damage: damage,
                life: 0.4,
                flame: true,
                color: ['#ff4400', '#ff8800', '#ffaa00'][Math.floor(Math.random() * 3)]
            });
        } else if (weapon.explosive) {
            // Grenade launcher
            bullets.push({
                x: player.x + Math.cos(player.angle) * 15,
                y: player.y + Math.sin(player.angle) * 15,
                vx: Math.cos(angle) * 400,
                vy: Math.sin(angle) * 400,
                damage: damage,
                life: 2,
                explosive: true,
                color: '#884400'
            });
        } else {
            bullets.push({
                x: player.x + Math.cos(player.angle) * 15,
                y: player.y + Math.sin(player.angle) * 15,
                vx: Math.cos(angle) * 600,
                vy: Math.sin(angle) * 600,
                damage: damage / pellets,
                life: 1.5
            });
        }
    }

    // Muzzle flash
    const flashColor = weapon.flame ? '#ff6600' : COLORS.BULLET;
    for (let i = 0; i < (weapon.flame ? 8 : 5); i++) {
        particles.push({
            x: player.x + Math.cos(player.angle) * 20,
            y: player.y + Math.sin(player.angle) * 20,
            vx: Math.cos(player.angle + (Math.random() - 0.5) * 0.5) * (100 + Math.random() * 100),
            vy: Math.sin(player.angle + (Math.random() - 0.5) * 0.5) * (100 + Math.random() * 100),
            color: flashColor,
            life: weapon.flame ? 0.3 : 0.1,
            size: weapon.flame ? 5 : 3
        });
    }
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const playerTile = { x: Math.floor(player.x / TILE_SIZE), y: Math.floor(player.y / TILE_SIZE) };
        const enemyTile = { x: Math.floor(enemy.x / TILE_SIZE), y: Math.floor(enemy.y / TILE_SIZE) };
        const canSee = hasLineOfSight(enemyTile.x, enemyTile.y, playerTile.x, playerTile.y);

        // State machine
        if (canSee && dist < 400) {
            enemy.state = 'chase';
        } else if (enemy.state === 'chase' && !canSee) {
            enemy.state = 'search';
            enemy.targetX = player.x;
            enemy.targetY = player.y;
        }

        // Movement
        if (enemy.state === 'chase') {
            const angle = Math.atan2(dy, dx);
            const vx = Math.cos(angle) * enemy.speed * dt;
            const vy = Math.sin(angle) * enemy.speed * dt;
            if (!isWall(enemy.x + vx, enemy.y)) enemy.x += vx;
            if (!isWall(enemy.x, enemy.y + vy)) enemy.y += vy;
        } else if (enemy.state === 'search') {
            const tdx = enemy.targetX - enemy.x;
            const tdy = enemy.targetY - enemy.y;
            const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
            if (tdist > 20) {
                const angle = Math.atan2(tdy, tdx);
                const vx = Math.cos(angle) * enemy.speed * 0.5 * dt;
                const vy = Math.sin(angle) * enemy.speed * 0.5 * dt;
                if (!isWall(enemy.x + vx, enemy.y)) enemy.x += vx;
                if (!isWall(enemy.x, enemy.y + vy)) enemy.y += vy;
            } else {
                enemy.state = 'idle';
            }
        } else if (enemy.state === 'idle') {
            enemy.pathTimer -= dt;
            if (enemy.pathTimer <= 0) {
                enemy.pathTimer = 2 + Math.random() * 3;
                enemy.targetX = enemy.x + (Math.random() - 0.5) * 100;
                enemy.targetY = enemy.y + (Math.random() - 0.5) * 100;
                enemy.state = 'search';
            }
        }

        // Boss special behavior
        if (enemy.isBoss) {
            // Boss phases
            const hpPercent = enemy.hp / enemy.maxHp;
            if (hpPercent < 0.3 && enemy.phase < 3) {
                enemy.phase = 3;
                enemy.speed = 70;
                enemy.fireRate = 800;
                showMessage('M.A.R.I.A.: RAGE MODE ACTIVATED!');
            } else if (hpPercent < 0.6 && enemy.phase < 2) {
                enemy.phase = 2;
                enemy.speed = 55;
                enemy.fireRate = 1200;
                showMessage('M.A.R.I.A.: You are persistent. But futile.');
            }

            // Boss spawns minions
            enemy.spawnTimer -= dt * 1000;
            if (enemy.spawnTimer <= 0 && canSee) {
                enemy.spawnTimer = 5000 - enemy.phase * 1000;
                // Spawn small scorpions
                for (let i = 0; i < enemy.phase; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const spawnDist = 50;
                    enemies.push({
                        x: enemy.x + Math.cos(angle) * spawnDist,
                        y: enemy.y + Math.sin(angle) * spawnDist,
                        type: 'scorpion_small',
                        hp: 15,
                        maxHp: 15,
                        speed: 120,
                        damage: 8,
                        size: 8,
                        color: '#254525',
                        ranged: false,
                        fireTimer: 0,
                        state: 'chase',
                        attackTimer: 0,
                        pathTimer: 0,
                        targetX: player.x,
                        targetY: player.y
                    });
                }
            }

            // Boss multi-shot attack
            if (canSee && dist < 400) {
                enemy.fireTimer -= dt * 1000;
                if (enemy.fireTimer <= 0) {
                    enemy.fireTimer = enemy.fireRate;
                    // Shoot multiple projectiles
                    for (let i = -1; i <= 1; i++) {
                        const angle = Math.atan2(dy, dx) + i * 0.2;
                        bullets.push({
                            x: enemy.x + Math.cos(angle) * enemy.size,
                            y: enemy.y + Math.sin(angle) * enemy.size,
                            vx: Math.cos(angle) * 350,
                            vy: Math.sin(angle) * 350,
                            damage: enemy.damage / 2,
                            life: 2,
                            enemyBullet: true,
                            color: '#aa44aa'
                        });
                    }
                }
            }
        }
        // Ranged attack (laser scorpion)
        else if (enemy.ranged && canSee && dist < 350) {
            enemy.fireTimer -= dt * 1000;
            if (enemy.fireTimer <= 0) {
                enemy.fireTimer = enemy.fireRate;
                // Shoot laser at player
                const angle = Math.atan2(dy, dx);
                bullets.push({
                    x: enemy.x + Math.cos(angle) * enemy.size,
                    y: enemy.y + Math.sin(angle) * enemy.size,
                    vx: Math.cos(angle) * 400,
                    vy: Math.sin(angle) * 400,
                    damage: enemy.damage,
                    life: 2,
                    enemyBullet: true,
                    color: COLORS.LASER
                });
            }
        }

        // Melee attack
        enemy.attackTimer -= dt;
        if (!enemy.ranged && dist < 30 && enemy.attackTimer <= 0) {
            enemy.attackTimer = 1;
            damagePlayer(enemy.damage, enemy);

            // Some enemies apply status effects
            if (enemy.type === 'arachnid' && Math.random() < 0.3) {
                applyStatusEffect(player, 'poisoned');
                createFloatingText(player.x, player.y - 35, 'POISONED!', '#88ff44');
            }
        }
    }
}

// Turret hazard system
function spawnTurrets() {
    hazards = hazards.filter(h => h.type !== 'turret');

    // Spawn turrets on higher levels
    if (gameState.level >= 2) {
        const numTurrets = Math.min(4, Math.floor(gameState.level / 2));
        for (let i = 0; i < numTurrets; i++) {
            for (let attempts = 0; attempts < 50; attempts++) {
                const x = Math.floor(Math.random() * MAP_WIDTH);
                const y = Math.floor(Math.random() * MAP_HEIGHT);
                if (map[y][x] === TILE.FLOOR) {
                    const dist = Math.sqrt(Math.pow(x * TILE_SIZE - player.x, 2) + Math.pow(y * TILE_SIZE - player.y, 2));
                    if (dist > 200) {
                        hazards.push({
                            x: x * TILE_SIZE + TILE_SIZE / 2,
                            y: y * TILE_SIZE + TILE_SIZE / 2,
                            type: 'turret',
                            hp: 50 + gameState.level * 10,
                            maxHp: 50 + gameState.level * 10,
                            fireRate: 2000,
                            fireTimer: Math.random() * 2000,
                            range: 250,
                            damage: 8 + gameState.level,
                            active: true,
                            angle: 0
                        });
                        break;
                    }
                }
            }
        }
    }
}

function updateHazards(dt) {
    for (const hazard of hazards) {
        if (!hazard.active) continue;

        if (hazard.type === 'turret') {
            const dx = player.x - hazard.x;
            const dy = player.y - hazard.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Check line of sight
            const tx = Math.floor(hazard.x / TILE_SIZE);
            const ty = Math.floor(hazard.y / TILE_SIZE);
            const px = Math.floor(player.x / TILE_SIZE);
            const py = Math.floor(player.y / TILE_SIZE);
            const canSee = hasLineOfSight(tx, ty, px, py);

            if (canSee && dist < hazard.range) {
                // Track player
                hazard.angle = Math.atan2(dy, dx);

                // Fire
                hazard.fireTimer -= dt * 1000;
                if (hazard.fireTimer <= 0) {
                    hazard.fireTimer = hazard.fireRate;

                    // Shoot at player
                    bullets.push({
                        x: hazard.x + Math.cos(hazard.angle) * 15,
                        y: hazard.y + Math.sin(hazard.angle) * 15,
                        vx: Math.cos(hazard.angle) * 350,
                        vy: Math.sin(hazard.angle) * 350,
                        damage: hazard.damage,
                        life: 2,
                        enemyBullet: true,
                        color: '#ff4444'
                    });

                    // Muzzle flash
                    for (let i = 0; i < 3; i++) {
                        particles.push({
                            x: hazard.x + Math.cos(hazard.angle) * 15,
                            y: hazard.y + Math.sin(hazard.angle) * 15,
                            vx: Math.cos(hazard.angle + (Math.random() - 0.5) * 0.3) * 80,
                            vy: Math.sin(hazard.angle + (Math.random() - 0.5) * 0.3) * 80,
                            color: '#ff6644',
                            life: 0.15,
                            size: 3
                        });
                    }
                }
            } else {
                // Idle rotation
                hazard.angle += dt * 0.5;
            }
        }
    }
}

function damageHazard(hazard, damage) {
    hazard.hp -= damage;
    createFloatingText(hazard.x, hazard.y - 15, '-' + damage, '#ff8844');

    if (hazard.hp <= 0) {
        hazard.active = false;

        // Explosion effect
        gameState.screenShake = 8;
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: hazard.x,
                y: hazard.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                color: ['#ff4444', '#ff8844', '#ffcc44'][Math.floor(Math.random() * 3)],
                life: 0.5,
                size: 5
            });
        }
        createFloatingText(hazard.x, hazard.y - 25, 'DESTROYED', '#ff8800');
    }
}

function playerDeath() {
    gameState.lives--;
    if (gameState.lives <= 0) {
        gameState.state = 'gameover';
    } else {
        player.health = player.maxHealth;
        player.statusEffects = [];
        createFloatingText(player.x, player.y - 40, 'LIVES: ' + gameState.lives, COLORS.WARNING);
    }
}

function updatePlayerStatusEffects(dt) {
    player.statusEffects = player.statusEffects.filter(effect => {
        effect.duration -= dt;

        // Apply damage over time
        const data = STATUS_EFFECTS[effect.type];
        if (data.damagePerSec) {
            const damage = data.damagePerSec * dt;
            player.health -= damage;

            // Visual feedback for DOT
            if (Math.random() < dt * 2) {
                createFloatingText(player.x + (Math.random() - 0.5) * 20, player.y - 20, '-' + Math.ceil(damage), data.color);
            }

            if (player.health <= 0) {
                playerDeath();
            }
        }

        return effect.duration > 0;
    });
}

function applyStatusEffect(target, effectType) {
    // Check if already has effect
    const existing = target.statusEffects.find(e => e.type === effectType);
    if (existing) {
        // Refresh duration
        existing.duration = STATUS_EFFECTS[effectType].duration;
    } else {
        target.statusEffects.push({
            type: effectType,
            duration: STATUS_EFFECTS[effectType].duration
        });
    }
}

function dodge() {
    if (player.dodging || player.stamina < 20) return;

    // Get dodge direction from movement keys
    let dx = 0, dy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    // If no direction, dodge backwards from facing
    if (dx === 0 && dy === 0) {
        dx = -Math.cos(player.angle);
        dy = -Math.sin(player.angle);
    } else {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
    }

    player.dodging = true;
    player.dodgeTimer = 0.25;
    player.dodgeDir = { x: dx, y: dy };
    player.invincible = true;
    player.stamina -= 20;

    // Dodge particles
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: -dx * 50 + (Math.random() - 0.5) * 50,
            vy: -dy * 50 + (Math.random() - 0.5) * 50,
            color: '#8888ff',
            life: 0.3,
            size: 4
        });
    }
}

function damagePlayer(amount, source) {
    if (player.invincible) return;

    // Armor absorbs damage
    if (player.armor > 0) {
        const absorbed = Math.min(player.armor, amount * 0.5);
        player.armor -= absorbed;
        amount -= absorbed;
        if (absorbed > 0) {
            createFloatingText(player.x, player.y - 30, '-' + Math.floor(absorbed) + ' ARMOR', '#8888ff');
        }
    }

    player.health -= amount;
    stats.totalDamageTaken += amount;
    createFloatingText(player.x, player.y - 20, '-' + Math.floor(amount), COLORS.BLOOD_HUMAN);

    // Screen shake on damage
    gameState.screenShake = Math.max(gameState.screenShake, 8);

    // Blood particles
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 150,
            vy: (Math.random() - 0.5) * 150,
            color: COLORS.BLOOD_HUMAN,
            life: 0.5,
            size: 4
        });
    }

    if (player.health <= 0) {
        playerDeath();
    }
}

function updateBullets(dt) {
    bullets = bullets.filter(bullet => {
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.life -= dt;

        // Wall collision
        if (isWall(bullet.x, bullet.y)) {
            if (bullet.explosive) {
                // Grenade explosion
                explodeAt(bullet.x, bullet.y, bullet.damage);
            } else {
                // Wall spark
                for (let i = 0; i < 3; i++) {
                    particles.push({
                        x: bullet.x,
                        y: bullet.y,
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        color: bullet.enemyBullet ? COLORS.LASER : (bullet.flame ? '#ff6600' : '#ffaa66'),
                        life: 0.2,
                        size: 2
                    });
                }
            }
            return false;
        }

        // Enemy bullet hits player
        if (bullet.enemyBullet) {
            const dist = Math.sqrt(Math.pow(bullet.x - player.x, 2) + Math.pow(bullet.y - player.y, 2));
            if (dist < 15) {
                player.health -= bullet.damage;
                stats.totalDamageTaken += bullet.damage;
                createFloatingText(player.x, player.y - 20, '-' + bullet.damage, COLORS.BLOOD_HUMAN);
                gameState.screenShake = Math.max(gameState.screenShake, 6);

                // Blood particles
                for (let i = 0; i < 5; i++) {
                    particles.push({
                        x: player.x,
                        y: player.y,
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        color: COLORS.BLOOD_HUMAN,
                        life: 0.4,
                        size: 3
                    });
                }

                if (player.health <= 0) {
                    playerDeath();
                }
                return false;
            }
            return bullet.life > 0;
        }

        // Enemy collision
        for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;
            const dist = Math.sqrt(Math.pow(bullet.x - enemy.x, 2) + Math.pow(bullet.y - enemy.y, 2));
            if (dist < enemy.size + 5) {
                // Critical hit calculation
                const isCrit = Math.random() < CRIT_CHANCE;
                const damage = isCrit ? bullet.damage * CRIT_MULTIPLIER : bullet.damage;
                enemy.hp -= damage;
                stats.shotsHit++;
                stats.totalDamageDealt += damage;
                if (isCrit) stats.critCount++;

                // Blood
                for (let i = 0; i < 5; i++) {
                    particles.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: bullet.vx * 0.1 + (Math.random() - 0.5) * 80,
                        vy: bullet.vy * 0.1 + (Math.random() - 0.5) * 80,
                        color: COLORS.BLOOD_ALIEN,
                        life: 0.5,
                        size: 4
                    });
                }

                createFloatingText(enemy.x, enemy.y - 15, (isCrit ? 'CRIT! -' : '-') + Math.floor(damage), isCrit ? '#ff3333' : '#ff6666');

                if (enemy.hp <= 0) {
                    killEnemy(enemy);
                }
                return false;
            }
        }

        // Destructible collision
        for (let i = destructibles.length - 1; i >= 0; i--) {
            const obj = destructibles[i];
            const dist = Math.sqrt(Math.pow(bullet.x - obj.x, 2) + Math.pow(bullet.y - obj.y, 2));
            if (dist < 14) {
                obj.hp -= bullet.damage;
                // Sparks
                for (let j = 0; j < 3; j++) {
                    particles.push({
                        x: obj.x,
                        y: obj.y,
                        vx: (Math.random() - 0.5) * 80,
                        vy: (Math.random() - 0.5) * 80,
                        color: obj.type === 'barrel' ? '#ff6600' : '#8a7a60',
                        life: 0.3,
                        size: 3
                    });
                }
                if (obj.hp <= 0) {
                    destroyDestructible(i);
                }
                return false;
            }
        }

        // Hazard collision (turrets)
        if (!bullet.enemyBullet) {
            for (const hazard of hazards) {
                if (!hazard.active) continue;
                const dist = Math.sqrt(Math.pow(bullet.x - hazard.x, 2) + Math.pow(bullet.y - hazard.y, 2));
                if (dist < 16) {
                    damageHazard(hazard, bullet.damage);
                    // Sparks
                    for (let j = 0; j < 4; j++) {
                        particles.push({
                            x: hazard.x,
                            y: hazard.y,
                            vx: (Math.random() - 0.5) * 100,
                            vy: (Math.random() - 0.5) * 100,
                            color: '#ff8844',
                            life: 0.25,
                            size: 3
                        });
                    }
                    return false;
                }
            }
        }

        return bullet.life > 0;
    });
}

function destroyDestructible(index) {
    const obj = destructibles[index];

    if (obj.type === 'barrel') {
        // Explosion!
        gameState.screenShake = 15;

        // Explosion particles
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: obj.x,
                y: obj.y,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                color: ['#ff4400', '#ff8800', '#ffaa00', '#ffcc00'][Math.floor(Math.random() * 4)],
                life: 0.5 + Math.random() * 0.5,
                size: 5 + Math.random() * 5
            });
        }

        // Damage nearby enemies
        for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;
            const dist = Math.sqrt(Math.pow(enemy.x - obj.x, 2) + Math.pow(enemy.y - obj.y, 2));
            if (dist < 100) {
                const damage = Math.floor(50 * (1 - dist / 100));
                enemy.hp -= damage;
                createFloatingText(enemy.x, enemy.y - 15, '-' + damage, '#ff8800');
                if (enemy.hp <= 0) {
                    killEnemy(enemy);
                }
            }
        }

        // Damage player if close
        const playerDist = Math.sqrt(Math.pow(player.x - obj.x, 2) + Math.pow(player.y - obj.y, 2));
        if (playerDist < 100) {
            const damage = Math.floor(30 * (1 - playerDist / 100));
            player.health -= damage;
            createFloatingText(player.x, player.y - 20, '-' + damage, COLORS.BLOOD_HUMAN);
            if (player.health <= 0) {
                playerDeath();
            }
        }

        // Chain reaction - damage other barrels
        for (let i = destructibles.length - 1; i >= 0; i--) {
            if (i === index) continue;
            const other = destructibles[i];
            if (other.type === 'barrel') {
                const dist = Math.sqrt(Math.pow(other.x - obj.x, 2) + Math.pow(other.y - obj.y, 2));
                if (dist < 80) {
                    other.hp -= 20;
                    if (other.hp <= 0) {
                        setTimeout(() => {
                            const idx = destructibles.indexOf(other);
                            if (idx >= 0) destroyDestructible(idx);
                        }, 100);
                    }
                }
            }
        }
    } else {
        // Crate destruction - drop item
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: obj.x,
                y: obj.y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                color: COLORS.CRATE,
                life: 0.4,
                size: 4
            });
        }

        // Random item drop
        if (Math.random() < 0.5) {
            const types = ['health', 'ammo', 'credits'];
            items.push({
                x: obj.x,
                y: obj.y,
                type: types[Math.floor(Math.random() * types.length)]
            });
        }
    }

    // Clear the tile
    map[obj.tileY][obj.tileX] = TILE.FLOOR;
    destructibles.splice(index, 1);
}

function explodeAt(x, y, baseDamage) {
    gameState.screenShake = 12;

    // Explosion particles
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 350,
            vy: (Math.random() - 0.5) * 350,
            color: ['#ff4400', '#ff8800', '#ffaa00', '#ffcc00'][Math.floor(Math.random() * 4)],
            life: 0.4 + Math.random() * 0.4,
            size: 4 + Math.random() * 6
        });
    }

    // Damage nearby enemies
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const dist = Math.sqrt(Math.pow(enemy.x - x, 2) + Math.pow(enemy.y - y, 2));
        if (dist < 120) {
            const damage = Math.floor(baseDamage * (1 - dist / 120));
            enemy.hp -= damage;
            stats.totalDamageDealt += damage;
            createFloatingText(enemy.x, enemy.y - 15, '-' + damage, '#ff8800');
            if (enemy.hp <= 0) {
                killEnemy(enemy);
            }
        }
    }

    // Damage player if close
    const playerDist = Math.sqrt(Math.pow(player.x - x, 2) + Math.pow(player.y - y, 2));
    if (playerDist < 80) {
        const damage = Math.floor(baseDamage * 0.5 * (1 - playerDist / 80));
        player.health -= damage;
        stats.totalDamageTaken += damage;
        createFloatingText(player.x, player.y - 20, '-' + damage, COLORS.BLOOD_HUMAN);
        if (player.health <= 0) {
            playerDeath();
        }
    }

    // Trigger nearby barrels
    for (let i = destructibles.length - 1; i >= 0; i--) {
        const obj = destructibles[i];
        if (obj.type === 'barrel') {
            const dist = Math.sqrt(Math.pow(obj.x - x, 2) + Math.pow(obj.y - y, 2));
            if (dist < 80) {
                obj.hp = 0;
                setTimeout(() => {
                    const idx = destructibles.indexOf(obj);
                    if (idx >= 0) destroyDestructible(idx);
                }, 50);
            }
        }
    }
}

function killEnemy(enemy) {
    stats.killCount++;

    // Boss gives more XP and credits
    if (enemy.isBoss) {
        player.xp += 200;
        const creditDrop = 500 + Math.floor(Math.random() * 300);
        player.credits += creditDrop;
        createFloatingText(enemy.x, enemy.y - 25, '+' + creditDrop + ' CR', COLORS.CREDITS);
        showMessage('M.A.R.I.A.: NO! My champion has fallen! You will pay!');
        gameState.screenShake = 20;

        // Big explosion on boss death
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: enemy.x,
                y: enemy.y,
                vx: (Math.random() - 0.5) * 400,
                vy: (Math.random() - 0.5) * 400,
                color: ['#aa44aa', '#ff44ff', '#ff0000', '#ffaa00'][Math.floor(Math.random() * 4)],
                life: 1 + Math.random() * 0.5,
                size: 6 + Math.random() * 6
            });
        }
        return;
    }

    player.xp += 20;
    const creditDrop = 10 + Math.floor(Math.random() * 30);
    player.credits += creditDrop;

    // Screen shake on kill
    gameState.screenShake = Math.max(gameState.screenShake, 5);

    // Kill streak
    gameState.killStreak++;
    gameState.killStreakTimer = 3;
    if (gameState.killStreak > stats.maxKillStreak) {
        stats.maxKillStreak = gameState.killStreak;
    }

    // Kill streak messages
    if (gameState.killStreak >= 3) {
        const msgs = { 3: 'TRIPLE KILL!', 4: 'QUAD KILL!', 5: 'RAMPAGE!', 6: 'MASSACRE!' };
        const msg = msgs[Math.min(gameState.killStreak, 6)] || 'UNSTOPPABLE!';
        createFloatingText(GAME_WIDTH / 2 + camera.x, GAME_HEIGHT / 3 + camera.y, msg, COLORS.WARNING);
    }

    createFloatingText(enemy.x, enemy.y - 25, '+' + creditDrop + ' CR', COLORS.CREDITS);

    // Death burst
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            color: COLORS.BLOOD_ALIEN,
            life: 0.8,
            size: 5
        });
    }

    // Random item drop
    if (Math.random() < 0.3) {
        const types = ['health', 'ammo', 'credits'];
        items.push({
            x: enemy.x,
            y: enemy.y,
            type: types[Math.floor(Math.random() * types.length)]
        });
    }
}

function updateParticles(dt) {
    particles = particles.filter(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= dt;
        return p.life > 0;
    });
}

function updateFloatingTexts(dt) {
    floatingTexts = floatingTexts.filter(t => {
        t.y -= 30 * dt;
        t.life -= dt;
        return t.life > 0;
    });
}

function createFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 1 });
}

function showMessage(msg) {
    gameState.message = msg;
    gameState.messageTimer = 4;
}

function updateFogOfWar() {
    // Reset fog
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            fogOfWar[y][x] = true;
        }
    }

    const visionRange = player.flashlightOn ? 12 : 6;
    const px = Math.floor(player.x / TILE_SIZE);
    const py = Math.floor(player.y / TILE_SIZE);

    for (let dy = -visionRange; dy <= visionRange; dy++) {
        for (let dx = -visionRange; dx <= visionRange; dx++) {
            const x = px + dx;
            const y = py + dy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= visionRange && x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                if (hasLineOfSight(px, py, x, y)) {
                    fogOfWar[y][x] = false;
                    explored[y][x] = true;
                }
            }
        }
    }
}

function hasLineOfSight(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
    let err = dx - dy, x = x1, y = y1;

    while (x !== x2 || y !== y2) {
        if (x !== x1 || y !== y1) {
            if (map[y]?.[x] === TILE.WALL) return false;
        }
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
    }
    return true;
}

function updateCamera() {
    const targetX = player.x - GAME_WIDTH / 2;
    const targetY = player.y - GAME_HEIGHT / 2;
    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;

    // Bounds
    camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - GAME_WIDTH, camera.x));
    camera.y = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - GAME_HEIGHT, camera.y));
}

function isWall(x, y) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return true;
    const tile = map[ty][tx];
    return tile === TILE.WALL || tile === TILE.DOOR_LOCKED;
}

function getTileAt(x, y) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return TILE.WALL;
    return map[ty][tx];
}

// Drawing
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (gameState.state === 'title') {
        drawTitleScreen();
        return;
    }

    ctx.save();
    // Screen shake
    const shakeX = gameState.screenShake > 0 ? (Math.random() - 0.5) * gameState.screenShake * 2 : 0;
    const shakeY = gameState.screenShake > 0 ? (Math.random() - 0.5) * gameState.screenShake * 2 : 0;
    ctx.translate(-camera.x + shakeX, -camera.y + shakeY);

    drawMap();
    drawItems();
    drawDestructibles();
    drawHazards();
    drawEnemies();
    drawPlayer();
    drawBullets();
    drawParticles();
    drawFloatingTexts();
    drawFog();

    ctx.restore();

    drawUI();

    if (gameState.state === 'gameover') drawGameOverScreen();
    if (gameState.state === 'victory') drawVictoryScreen();
    if (gameState.state === 'shop') drawShopScreen();
}

function drawMap() {
    const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const endX = Math.min(MAP_WIDTH, Math.ceil((camera.x + GAME_WIDTH) / TILE_SIZE) + 1);
    const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const endY = Math.min(MAP_HEIGHT, Math.ceil((camera.y + GAME_HEIGHT) / TILE_SIZE) + 1);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = map[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            if (!explored[y][x]) continue;

            // Floor pattern
            if (tile === TILE.FLOOR || tile === TILE.EXIT) {
                ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.FLOOR : COLORS.FLOOR_GRATE;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            } else if (tile === TILE.WALL) {
                ctx.fillStyle = (x + y) % 3 === 0 ? COLORS.WALL_LIGHT : COLORS.WALL;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            } else if (tile === TILE.DOOR || tile === TILE.DOOR_LOCKED) {
                ctx.fillStyle = tile === TILE.DOOR_LOCKED ? COLORS.DOOR_LOCKED : COLORS.DOOR;
                ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            } else if (tile === TILE.TERMINAL) {
                ctx.fillStyle = COLORS.FLOOR;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.TERMINAL;
                ctx.fillRect(px + 8, py + 6, TILE_SIZE - 16, TILE_SIZE - 12);
                ctx.fillStyle = '#88ffaa';
                ctx.fillRect(px + 10, py + 8, TILE_SIZE - 20, 6);
            } else if (tile === TILE.CRATE) {
                ctx.fillStyle = COLORS.FLOOR;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.CRATE;
                ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                ctx.strokeStyle = '#7a6a50';
                ctx.strokeRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            } else if (tile === TILE.EXIT) {
                ctx.fillStyle = '#40aa60';
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            }

            // Exit marker
            if (tile === TILE.EXIT) {
                ctx.fillStyle = '#88ffaa';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('EXIT', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 4);
            }
        }
    }
}

function drawDestructibles() {
    for (const obj of destructibles) {
        const tx = Math.floor(obj.x / TILE_SIZE);
        const ty = Math.floor(obj.y / TILE_SIZE);
        if (fogOfWar[ty]?.[tx]) continue;

        if (obj.type === 'barrel') {
            // Red explosive barrel
            ctx.fillStyle = '#661111';
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#aa2222';
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, 7, 0, Math.PI * 2);
            ctx.fill();

            // Warning symbol
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', obj.x, obj.y + 4);
        }
        // Crates are drawn by drawMap
    }
}

function drawHazards() {
    for (const hazard of hazards) {
        if (!hazard.active) continue;
        const tx = Math.floor(hazard.x / TILE_SIZE);
        const ty = Math.floor(hazard.y / TILE_SIZE);
        if (fogOfWar[ty]?.[tx]) continue;

        if (hazard.type === 'turret') {
            // Base
            ctx.fillStyle = '#333344';
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, 14, 0, Math.PI * 2);
            ctx.fill();

            // Outer ring
            ctx.strokeStyle = '#666677';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, 14, 0, Math.PI * 2);
            ctx.stroke();

            // Barrel
            ctx.fillStyle = '#444455';
            ctx.save();
            ctx.translate(hazard.x, hazard.y);
            ctx.rotate(hazard.angle);
            ctx.fillRect(0, -3, 18, 6);
            ctx.restore();

            // Red light when targeting player
            const dx = player.x - hazard.x;
            const dy = player.y - hazard.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const canSee = hasLineOfSight(tx, ty, Math.floor(player.x / TILE_SIZE), Math.floor(player.y / TILE_SIZE));

            ctx.fillStyle = (canSee && dist < hazard.range) ? '#ff3333' : '#333333';
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, 5, 0, Math.PI * 2);
            ctx.fill();

            // Health bar
            const hpPct = hazard.hp / hazard.maxHp;
            ctx.fillStyle = '#440000';
            ctx.fillRect(hazard.x - 12, hazard.y - 22, 24, 4);
            ctx.fillStyle = hpPct > 0.5 ? '#ff8844' : '#ff4444';
            ctx.fillRect(hazard.x - 12, hazard.y - 22, 24 * hpPct, 4);
        }
    }
}

function drawItems() {
    for (const item of items) {
        if (fogOfWar[Math.floor(item.y / TILE_SIZE)]?.[Math.floor(item.x / TILE_SIZE)]) continue;

        let color = COLORS.CREDITS;
        if (item.type === 'health') color = COLORS.HEALTH;
        else if (item.type === 'ammo') color = COLORS.AMMO;
        else if (item.type === 'keycard_red') color = KEYCARD_COLORS.red;
        else if (item.type === 'keycard_blue') color = KEYCARD_COLORS.blue;
        else if (item.type === 'keycard_yellow') color = KEYCARD_COLORS.yellow;

        // Keycards have special appearance
        if (item.type.startsWith('keycard_')) {
            // Glowing card effect
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
            ctx.fillStyle = color;
            ctx.globalAlpha = pulse * 0.3;
            ctx.beginPath();
            ctx.arc(item.x, item.y, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Card shape
            ctx.fillStyle = color;
            ctx.fillRect(item.x - 6, item.y - 4, 12, 8);
            ctx.fillStyle = '#fff';
            ctx.fillRect(item.x - 4, item.y - 2, 4, 4);
        } else {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(item.x, item.y, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            const labels = { health: '+', ammo: 'A', credits: '$' };
            ctx.fillText(labels[item.type] || '?', item.x, item.y + 3);
        }
    }
}

function drawEnemies() {
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        if (fogOfWar[Math.floor(enemy.y / TILE_SIZE)]?.[Math.floor(enemy.x / TILE_SIZE)]) continue;

        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);

        if (enemy.isBoss) {
            // Boss special appearance
            const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;

            // Outer glow
            ctx.fillStyle = `rgba(85, 34, 85, ${pulse * 0.3})`;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size + 10, 0, Math.PI * 2);
            ctx.fill();

            // Body
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            ctx.fill();

            // Phase indicator rings
            ctx.strokeStyle = enemy.phase >= 2 ? '#ff4444' : '#aa44aa';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size + 5, 0, Math.PI * 2);
            ctx.stroke();

            // Multiple eyes
            ctx.fillStyle = enemy.phase >= 3 ? '#ff0000' : COLORS.ALIEN_EYES;
            for (let i = -2; i <= 2; i++) {
                const eyeAngle = angle + i * 0.25;
                const eyeDist = enemy.size * 0.6;
                ctx.beginPath();
                ctx.arc(enemy.x + Math.cos(eyeAngle) * eyeDist, enemy.y + Math.sin(eyeAngle) * eyeDist, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Boss health bar (larger)
            const hpPct = enemy.hp / enemy.maxHp;
            ctx.fillStyle = '#440000';
            ctx.fillRect(enemy.x - 30, enemy.y - enemy.size - 12, 60, 8);
            ctx.fillStyle = hpPct > 0.5 ? '#44aa44' : (hpPct > 0.25 ? '#aaaa44' : '#aa4444');
            ctx.fillRect(enemy.x - 30, enemy.y - enemy.size - 12, 60 * hpPct, 8);

            // Boss label
            ctx.fillStyle = '#ff44ff';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('BOSS', enemy.x, enemy.y - enemy.size - 16);
        } else {
            // Regular enemy
            // Body
            ctx.fillStyle = enemy.color;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            ctx.fill();

            // Eyes (red glow)
            ctx.fillStyle = COLORS.ALIEN_EYES;
            const eyeDist = enemy.size * 0.5;
            const eyeSize = 3;
            ctx.beginPath();
            ctx.arc(enemy.x + Math.cos(angle - 0.3) * eyeDist, enemy.y + Math.sin(angle - 0.3) * eyeDist, eyeSize, 0, Math.PI * 2);
            ctx.arc(enemy.x + Math.cos(angle + 0.3) * eyeDist, enemy.y + Math.sin(angle + 0.3) * eyeDist, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            // Health bar
            const hpPct = enemy.hp / enemy.maxHp;
            ctx.fillStyle = '#440000';
            ctx.fillRect(enemy.x - 15, enemy.y - enemy.size - 8, 30, 4);
            ctx.fillStyle = hpPct > 0.5 ? '#44aa44' : (hpPct > 0.25 ? '#aaaa44' : '#aa4444');
            ctx.fillRect(enemy.x - 15, enemy.y - enemy.size - 8, 30 * hpPct, 4);
        }
    }
}

function drawPlayer() {
    // Body
    ctx.fillStyle = COLORS.PLAYER;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Gun direction
    ctx.strokeStyle = COLORS.PLAYER_LIGHT;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.angle) * 20, player.y + Math.sin(player.angle) * 20);
    ctx.stroke();

    // Flashlight cone (visual only)
    if (player.flashlightOn) {
        ctx.fillStyle = 'rgba(255, 255, 200, 0.05)';
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        const coneAngle = Math.PI / 4;
        for (let a = player.angle - coneAngle; a <= player.angle + coneAngle; a += 0.05) {
            const dist = castRay(player.x, player.y, a, 300);
            ctx.lineTo(player.x + Math.cos(a) * dist, player.y + Math.sin(a) * dist);
        }
        ctx.closePath();
        ctx.fill();
    }
}

function castRay(ox, oy, angle, maxDist) {
    const step = TILE_SIZE / 4;
    let x = ox, y = oy, dist = 0;
    while (dist < maxDist) {
        x += Math.cos(angle) * step;
        y += Math.sin(angle) * step;
        dist += step;
        const tx = Math.floor(x / TILE_SIZE);
        const ty = Math.floor(y / TILE_SIZE);
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return dist;
        if (map[ty][tx] === TILE.WALL) return dist;
    }
    return maxDist;
}

function drawBullets() {
    for (const b of bullets) {
        ctx.fillStyle = b.color || COLORS.BULLET;
        ctx.beginPath();
        if (b.enemyBullet) {
            // Laser beam appearance
            ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#aaffaa';
            ctx.beginPath();
            ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
        } else if (b.flame) {
            // Flame particles
            ctx.globalAlpha = b.life * 2;
            ctx.arc(b.x, b.y, 5 + Math.random() * 3, 0, Math.PI * 2);
            ctx.globalAlpha = 1;
        } else if (b.explosive) {
            // Grenade
            ctx.fillStyle = '#884400';
            ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
        } else {
            ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        }
        ctx.fill();
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

function drawFloatingTexts() {
    for (const t of floatingTexts) {
        ctx.globalAlpha = t.life;
        ctx.fillStyle = t.color;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
}

function drawFog() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (fogOfWar[y][x]) {
                ctx.fillStyle = explored[y][x] ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,1)';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

function drawUI() {
    // Top bar
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(0, 0, GAME_WIDTH, 35);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(0, 0, GAME_WIDTH, 35);

    // Rank/XP
    ctx.fillStyle = '#44aaff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('RANK ' + player.rank + ' | XP: ' + player.xp + '/' + (player.rank * 100), 10, 23);

    // Lives
    ctx.fillStyle = '#ff6666';
    ctx.fillText('LIVES: ' + gameState.lives, 200, 23);

    // Credits
    ctx.fillStyle = COLORS.CREDITS;
    ctx.fillText('CR: ' + player.credits, 300, 23);

    // Keycards
    ctx.textAlign = 'left';
    let keyX = 400;
    if (player.keys.red) {
        ctx.fillStyle = KEYCARD_COLORS.red;
        ctx.fillRect(keyX, 10, 15, 10);
        keyX += 20;
    }
    if (player.keys.blue) {
        ctx.fillStyle = KEYCARD_COLORS.blue;
        ctx.fillRect(keyX, 10, 15, 10);
        keyX += 20;
    }
    if (player.keys.yellow) {
        ctx.fillStyle = KEYCARD_COLORS.yellow;
        ctx.fillRect(keyX, 10, 15, 10);
    }

    // Level
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL ' + gameState.level, GAME_WIDTH / 2, 23);

    // Time
    ctx.fillStyle = '#888';
    ctx.textAlign = 'right';
    ctx.fillText('TIME: ' + Math.floor(gameState.time) + 's', GAME_WIDTH - 10, 23);

    // Bottom bar
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 50);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 50);

    // Health bar
    ctx.fillStyle = '#222';
    ctx.fillRect(10, GAME_HEIGHT - 40, 150, 12);
    ctx.fillStyle = player.health > 30 ? COLORS.HEALTH : '#aa4444';
    ctx.fillRect(10, GAME_HEIGHT - 40, 150 * (player.health / player.maxHealth), 12);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(10, GAME_HEIGHT - 40, 150, 12);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HP: ' + Math.ceil(player.health) + '/' + player.maxHealth, 12, GAME_HEIGHT - 31);

    // Armor bar
    ctx.fillStyle = '#222';
    ctx.fillRect(10, GAME_HEIGHT - 26, 150, 8);
    if (player.armor > 0) {
        ctx.fillStyle = '#4488cc';
        ctx.fillRect(10, GAME_HEIGHT - 26, 150 * (player.armor / player.maxArmor), 8);
    }
    ctx.strokeStyle = '#444';
    ctx.strokeRect(10, GAME_HEIGHT - 26, 150, 8);
    ctx.fillStyle = '#88aacc';
    ctx.font = '8px monospace';
    ctx.fillText('ARM: ' + Math.ceil(player.armor), 12, GAME_HEIGHT - 19);

    // Stamina bar
    ctx.fillStyle = '#222';
    ctx.fillRect(10, GAME_HEIGHT - 16, 150, 8);
    ctx.fillStyle = player.stamina > 20 ? '#cccc44' : '#aa4444';
    ctx.fillRect(10, GAME_HEIGHT - 16, 150 * (player.stamina / player.maxStamina), 8);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(10, GAME_HEIGHT - 16, 150, 8);
    ctx.fillStyle = '#cccc88';
    ctx.font = '8px monospace';
    ctx.fillText('STA: ' + Math.ceil(player.stamina), 12, GAME_HEIGHT - 9);

    // Status effects display
    let effectX = 170;
    for (const effect of player.statusEffects) {
        const data = STATUS_EFFECTS[effect.type];
        ctx.fillStyle = data.color;
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(data.name + ' (' + Math.ceil(effect.duration) + 's)', effectX, GAME_HEIGHT - 35);
        effectX += 80;
    }

    // Weapon info
    const weapon = weapons[player.weapon];
    ctx.fillStyle = '#aaa';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(weapon.name, 400, GAME_HEIGHT - 40);

    // Show active upgrades
    let upgradeText = '';
    if (player.weaponUpgrades.laserSight) upgradeText += '[L]';
    if (player.weaponUpgrades.rapidFire) upgradeText += '[R]';
    if (player.weaponUpgrades.fmjRounds) upgradeText += '[F]';
    if (player.weaponUpgrades.dualMag) upgradeText += '[D]';
    if (player.weaponUpgrades.extendedMag) upgradeText += '[E]';
    if (upgradeText) {
        ctx.fillStyle = '#88ff88';
        ctx.font = '10px monospace';
        ctx.fillText(upgradeText, 400, GAME_HEIGHT - 28);
    }

    ctx.fillStyle = player.magazine === 0 ? '#ff4444' : '#88ff88';
    ctx.font = '12px monospace';
    ctx.fillText('AMMO: ' + player.magazine + '/' + player.ammo[weapon.ammoType], 400, GAME_HEIGHT - 14);

    if (player.reloading) {
        ctx.fillStyle = '#ffaa00';
        ctx.fillText('RELOADING...', 550, GAME_HEIGHT - 26);
    }

    // Terminal hint
    if (gameState.nearTerminal) {
        ctx.fillStyle = '#40ff60';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.fillText('[E] ACCESS TERMINAL', GAME_WIDTH / 2, 80);
        ctx.globalAlpha = 1;
    }

    // Sprint indicator
    if (player.sprinting) {
        ctx.fillStyle = '#ffcc44';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('SPRINTING', 550, GAME_HEIGHT - 14);
    }

    // Enemies remaining
    const remaining = enemies.filter(e => e.hp > 0).length;
    ctx.fillStyle = '#ff6666';
    ctx.textAlign = 'right';
    ctx.fillText('ALIENS: ' + remaining, GAME_WIDTH - 10, GAME_HEIGHT - 26);

    // Kill streak display
    if (gameState.killStreak >= 2) {
        ctx.fillStyle = COLORS.WARNING;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(gameState.killStreak + 'x STREAK', GAME_WIDTH / 2, 60);
    }

    // M.A.R.I.A. message
    if (gameState.messageTimer > 0) {
        ctx.fillStyle = 'rgba(0, 50, 30, 0.9)';
        ctx.fillRect(150, GAME_HEIGHT - 100, GAME_WIDTH - 300, 30);
        ctx.strokeStyle = '#40aa60';
        ctx.strokeRect(150, GAME_HEIGHT - 100, GAME_WIDTH - 300, 30);
        ctx.fillStyle = '#40ff60';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.globalAlpha = Math.min(1, gameState.messageTimer);
        ctx.fillText(gameState.message, GAME_WIDTH / 2, GAME_HEIGHT - 80);
        ctx.globalAlpha = 1;
    }

    // Low health warning
    if (player.health <= 30) {
        ctx.fillStyle = `rgba(255, 0, 0, ${Math.sin(Date.now() / 200) * 0.15 + 0.1})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Minimap / Motion Tracker
    const minimapSize = 100;
    const minimapX = GAME_WIDTH - minimapSize - 10;
    const minimapY = 45;

    // Background
    ctx.fillStyle = 'rgba(0, 20, 10, 0.8)';
    ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
    ctx.strokeStyle = '#40aa60';
    ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

    // Radar sweep effect
    const sweepAngle = (Date.now() / 1000) % (Math.PI * 2);
    ctx.fillStyle = 'rgba(64, 170, 96, 0.3)';
    ctx.beginPath();
    ctx.moveTo(minimapX + minimapSize / 2, minimapY + minimapSize / 2);
    ctx.arc(minimapX + minimapSize / 2, minimapY + minimapSize / 2, minimapSize / 2, sweepAngle, sweepAngle + 0.5);
    ctx.closePath();
    ctx.fill();

    // Map scale
    const scale = minimapSize / (MAP_WIDTH * TILE_SIZE);
    const offsetX = minimapX - camera.x * scale + minimapSize / 2 - player.x * scale;
    const offsetY = minimapY - camera.y * scale + minimapSize / 2 - player.y * scale;

    // Draw explored areas
    ctx.fillStyle = '#1a3a2a';
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (explored[y][x] && map[y][x] !== TILE.WALL) {
                const px = minimapX + (x * TILE_SIZE - camera.x) * scale + minimapSize / 2;
                const py = minimapY + (y * TILE_SIZE - camera.y) * scale + minimapSize / 2;
                if (px >= minimapX && px <= minimapX + minimapSize && py >= minimapY && py <= minimapY + minimapSize) {
                    ctx.fillRect(px, py, TILE_SIZE * scale + 1, TILE_SIZE * scale + 1);
                }
            }
        }
    }

    // Draw enemies on radar (blips)
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const dist = Math.sqrt(Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2));
        if (dist < 400) {
            const ex = minimapX + minimapSize / 2 + (enemy.x - player.x) * scale;
            const ey = minimapY + minimapSize / 2 + (enemy.y - player.y) * scale;
            if (ex >= minimapX && ex <= minimapX + minimapSize && ey >= minimapY && ey <= minimapY + minimapSize) {
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(ex - 1, ey - 1, 3, 3);
            }
        }
    }

    // Player blip (center)
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(minimapX + minimapSize / 2 - 2, minimapY + minimapSize / 2 - 2, 4, 4);

    // Label
    ctx.fillStyle = '#40aa60';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MOTION TRACKER', minimapX + minimapSize / 2, minimapY + minimapSize + 10);

    // Controls hint
    ctx.fillStyle = '#555';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WASD: Move | SHIFT: Sprint | SPACE: Dodge | R: Reload | 1-7: Weapons | F: Flashlight | E: Terminal', GAME_WIDTH / 2, GAME_HEIGHT - 5);
}

function drawTitleScreen() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Animated stars
    for (let i = 0; i < 80; i++) {
        const x = (Date.now() / 30 + i * 47) % GAME_WIDTH;
        const y = (i * 31) % GAME_HEIGHT;
        const brightness = Math.sin(Date.now() / 300 + i) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.fillRect(x, y, 2, 2);
    }

    ctx.fillStyle = '#44aaff';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LOST OUTPOST', GAME_WIDTH / 2, 200);

    ctx.fillStyle = '#ff6644';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('SURVIVAL HORROR SHOOTER', GAME_WIDTH / 2, 240);

    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText('Inspired by Alien Breed & Outpost Series', GAME_WIDTH / 2, 280);

    ctx.fillStyle = '#44ff44';
    ctx.font = '16px monospace';
    const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText('Press SPACE to Start', GAME_WIDTH / 2, 380);
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.fillText('WASD: Move | Mouse: Aim | Click: Shoot | R: Reload', GAME_WIDTH / 2, 450);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION FAILED', GAME_WIDTH / 2, 180);

    ctx.fillStyle = '#888';
    ctx.font = '16px monospace';
    ctx.fillText('You have been overrun by the alien swarm', GAME_WIDTH / 2, 230);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText('Kills: ' + stats.killCount + ' | Accuracy: ' + (stats.shotsFired > 0 ? Math.floor(stats.shotsHit / stats.shotsFired * 100) : 0) + '%', GAME_WIDTH / 2, 300);
    ctx.fillText('Credits: ' + stats.creditsCollected + ' | Items: ' + stats.itemsCollected, GAME_WIDTH / 2, 325);
    ctx.fillText('Time Survived: ' + Math.floor(gameState.time) + 's', GAME_WIDTH / 2, 350);

    ctx.fillStyle = '#44ff44';
    ctx.font = '16px monospace';
    const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText('Press SPACE to Retry', GAME_WIDTH / 2, 420);
    ctx.globalAlpha = 1;
}

function drawVictoryScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL COMPLETE', GAME_WIDTH / 2, 180);

    ctx.fillStyle = '#888';
    ctx.font = '16px monospace';
    ctx.fillText('You have cleared the sector', GAME_WIDTH / 2, 230);

    const accuracy = stats.shotsFired > 0 ? Math.floor(stats.shotsHit / stats.shotsFired * 100) : 0;
    let rating = 'D';
    if (accuracy > 80 && stats.killCount > 10) rating = 'S';
    else if (accuracy > 60 && stats.killCount > 8) rating = 'A';
    else if (accuracy > 40) rating = 'B';
    else if (accuracy > 20) rating = 'C';

    ctx.fillStyle = '#ffaa44';
    ctx.font = 'bold 32px monospace';
    ctx.fillText('RATING: ' + rating, GAME_WIDTH / 2, 280);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText('Kills: ' + stats.killCount + ' | Accuracy: ' + accuracy + '%', GAME_WIDTH / 2, 330);
    ctx.fillText('Credits Collected: ' + stats.creditsCollected, GAME_WIDTH / 2, 355);
    ctx.fillText('Final Rank: ' + player.rank, GAME_WIDTH / 2, 380);

    ctx.fillStyle = '#44ff44';
    ctx.font = '16px monospace';
    const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText('Press SPACE for Next Level', GAME_WIDTH / 2, 450);
    ctx.globalAlpha = 1;
}

function drawShopScreen() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 30, 20, 0.9)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    ctx.fillStyle = '#40ff60';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TERMINAL SHOP', GAME_WIDTH / 2, 60);

    // Credits display
    ctx.fillStyle = COLORS.CREDITS;
    ctx.font = '20px monospace';
    ctx.fillText('Credits: ' + player.credits, GAME_WIDTH / 2, 95);

    // Shop items
    const shopItems = Object.entries(SHOP_ITEMS);
    const startY = 130;
    const itemHeight = 45;

    for (let i = 0; i < shopItems.length; i++) {
        const [key, item] = shopItems[i];
        const y = startY + i * itemHeight;
        const isSelected = gameState.shopSelection === i;

        // Check if already owned (for upgrades)
        const isOwned = player.weaponUpgrades[key] === true;
        const canAfford = player.credits >= item.cost;

        // Background
        ctx.fillStyle = isSelected ? 'rgba(64, 170, 96, 0.3)' : 'rgba(30, 60, 40, 0.5)';
        ctx.fillRect(GAME_WIDTH / 2 - 250, y, 500, 40);

        if (isSelected) {
            ctx.strokeStyle = '#40ff60';
            ctx.strokeRect(GAME_WIDTH / 2 - 250, y, 500, 40);
        }

        // Item name
        ctx.fillStyle = isOwned ? '#666666' : (canAfford ? '#40ff60' : '#aa4444');
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(item.name + (isOwned ? ' [OWNED]' : ''), GAME_WIDTH / 2 - 240, y + 18);

        // Description
        ctx.fillStyle = '#888888';
        ctx.font = '12px monospace';
        ctx.fillText(item.description, GAME_WIDTH / 2 - 240, y + 34);

        // Cost
        ctx.fillStyle = canAfford ? '#44aaaa' : '#aa4444';
        ctx.font = '14px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(item.cost + ' CR', GAME_WIDTH / 2 + 240, y + 26);
    }

    // Instructions
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('W/S: Navigate | SPACE: Purchase | E/ESC: Close', GAME_WIDTH / 2, GAME_HEIGHT - 30);

    // M.A.R.I.A. taunt
    ctx.fillStyle = '#40aa60';
    ctx.font = '12px monospace';
    ctx.fillText('M.A.R.I.A.: Your credits will not save you...', GAME_WIDTH / 2, GAME_HEIGHT - 60);
}

function purchaseShopItem() {
    const shopItems = Object.entries(SHOP_ITEMS);
    if (gameState.shopSelection < 0 || gameState.shopSelection >= shopItems.length) return;

    const [key, item] = shopItems[gameState.shopSelection];

    // Check if already owned (for upgrades)
    if (player.weaponUpgrades[key] === true) {
        showMessage('SYSTEM: Upgrade already installed.');
        return;
    }

    // Check if can afford
    if (player.credits < item.cost) {
        showMessage('SYSTEM: Insufficient credits.');
        return;
    }

    // Purchase
    player.credits -= item.cost;

    switch (key) {
        case 'health':
            const heal = Math.min(50, player.maxHealth - player.health);
            player.health += heal;
            showMessage('SYSTEM: Med-Kit applied. +' + heal + ' HP');
            break;
        case 'ammo':
            player.ammo.bullets += 50;
            player.ammo.shells += 20;
            player.ammo.cells += 30;
            player.ammo.grenades += 5;
            player.ammo.fuel += 50;
            showMessage('SYSTEM: Ammo restocked.');
            break;
        case 'armor':
            player.armor = Math.min(player.maxArmor, player.armor + 50);
            showMessage('SYSTEM: Armor vest equipped.');
            break;
        case 'maxHealth':
            player.maxHealth += 25;
            player.health += 25;
            showMessage('SYSTEM: Vitality enhanced. Max HP +25');
            break;
        case 'maxStamina':
            player.maxStamina += 25;
            player.stamina += 25;
            showMessage('SYSTEM: Endurance enhanced. Max Stamina +25');
            break;
        default:
            // Weapon upgrades
            if (player.weaponUpgrades.hasOwnProperty(key)) {
                player.weaponUpgrades[key] = true;
                showMessage('SYSTEM: ' + item.name + ' installed.');
            }
            break;
    }
}

// Input handlers
window.addEventListener('keydown', e => {
    keys[e.code] = true;

    // Shop state controls
    if (gameState.state === 'shop') {
        const shopItemCount = Object.keys(SHOP_ITEMS).length;
        if (e.code === 'KeyW' || e.code === 'ArrowUp') {
            gameState.shopSelection = (gameState.shopSelection - 1 + shopItemCount) % shopItemCount;
        }
        if (e.code === 'KeyS' || e.code === 'ArrowDown') {
            gameState.shopSelection = (gameState.shopSelection + 1) % shopItemCount;
        }
        if (e.code === 'Space') {
            purchaseShopItem();
        }
        if (e.code === 'KeyE' || e.code === 'Escape') {
            gameState.state = 'playing';
        }
        return;
    }

    if (e.code === 'Space') {
        if (gameState.state === 'title') {
            gameState.state = 'playing';
        } else if (gameState.state === 'gameover') {
            resetGame();
        } else if (gameState.state === 'victory') {
            nextLevel();
        } else if (gameState.state === 'playing') {
            // Dodge roll
            dodge();
        }
    }

    if (gameState.state === 'playing') {
        if (e.code === 'KeyR' && !player.reloading && player.magazine < weapons[player.weapon].magazineSize) {
            player.reloading = true;
            player.reloadTime = weapons[player.weapon].reloadTime;
        }

        if (e.code === 'KeyF') {
            player.flashlightOn = !player.flashlightOn;
        }

        // Open shop when near terminal
        if (e.code === 'KeyE' && gameState.nearTerminal) {
            gameState.state = 'shop';
            gameState.shopSelection = 0;
        }

        if (e.code === 'Digit1') { player.weapon = 0; player.magazine = weapons[0].magazineSize; }
        if (e.code === 'Digit2') { player.weapon = 1; player.magazine = weapons[1].magazineSize; }
        if (e.code === 'Digit3') { player.weapon = 2; player.magazine = weapons[2].magazineSize; }
        if (e.code === 'Digit4') { player.weapon = 3; player.magazine = weapons[3].magazineSize; }
        if (e.code === 'Digit5') { player.weapon = 4; player.magazine = weapons[4].magazineSize; }
        if (e.code === 'Digit6') { player.weapon = 5; player.magazine = weapons[5].magazineSize; }
        if (e.code === 'Digit7') { player.weapon = 6; player.magazine = weapons[6].magazineSize; }
    }
});

window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', e => {
    if (e.button === 0) mouseDown = true;
});

canvas.addEventListener('mouseup', e => {
    if (e.button === 0) mouseDown = false;
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

function resetGame() {
    gameState = {
        state: 'playing',
        level: 1,
        lives: 3,
        score: 0,
        time: 0,
        screenShake: 0,
        message: '',
        messageTimer: 0,
        killStreak: 0,
        killStreakTimer: 0,
        shopSelection: 0,
        nearTerminal: false
    };
    player = {
        x: 0, y: 0, angle: 0, speed: 150,
        health: 100, maxHealth: 100,
        stamina: 100, maxStamina: 100,
        weapon: 0,
        ammo: { bullets: 100, shells: 20, cells: 50, grenades: 8, fuel: 100 },
        magazine: 30,
        credits: 0, xp: 0, rank: 1,
        flashlightOn: true,
        reloading: false, reloadTime: 0, fireTimer: 0,
        keys: { red: false, blue: false, yellow: false },
        sprinting: false,
        dodging: false,
        dodgeTimer: 0,
        dodgeDir: { x: 0, y: 0 },
        invincible: false,
        invincibleTimer: 0,
        armor: 0,
        maxArmor: 100,
        statusEffects: [],
        weaponUpgrades: {
            laserSight: false,
            dualMag: false,
            extendedMag: false,
            fmjRounds: false,
            rapidFire: false
        }
    };
    stats = {
        killCount: 0, totalDamageDealt: 0, totalDamageTaken: 0,
        shotsHit: 0, shotsFired: 0, itemsCollected: 0, creditsCollected: 0,
        critCount: 0, maxKillStreak: 0
    };
    bullets = [];
    particles = [];
    floatingTexts = [];
    hazards = [];
    generateMap();
    spawnPlayer();
    spawnEnemies();
    spawnItems();
    spawnDestructibles();
    spawnTurrets();
    explored = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false));
    fogOfWar = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(true));
}

function nextLevel() {
    gameState.level++;
    gameState.state = 'playing';
    gameState.lives = 3;
    gameState.nearTerminal = false;
    bullets = [];
    particles = [];
    floatingTexts = [];
    hazards = [];
    // Keep player upgrades and credits, restore health
    player.health = player.maxHealth;
    player.stamina = player.maxStamina;
    player.statusEffects = [];
    player.keys = { red: false, blue: false, yellow: false };
    player.reloading = false;
    player.dodging = false;
    player.invincible = false;
    generateMap();
    spawnPlayer();
    spawnEnemies();
    spawnItems();
    spawnDestructibles();
    spawnTurrets();
    explored = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false));
    fogOfWar = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(true));
}

// Start game
init();
