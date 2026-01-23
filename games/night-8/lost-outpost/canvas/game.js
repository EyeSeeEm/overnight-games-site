// Lost Outpost - Top-down Survival Horror Shooter
// Canvas 2D Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ==================== GAME CONSTANTS ====================
const TILE_SIZE = 32;
const PLAYER_SPEED = 3;
const BULLET_SPEED = 12;
const ENEMY_SPEED = 1.5;

// Colors matching reference
const COLORS = {
    background: '#0a0a0a',
    floor: '#1a1a1a',
    floorAlt: '#141414',
    wall: '#2a2a2a',
    wallHighlight: '#3a3a3a',
    hazardYellow: '#d4a017',
    hazardBlack: '#1a1a0a',
    uiBlue: '#00d4ff',
    uiDarkBlue: '#0a2a3a',
    uiBorder: '#1a5a7a',
    healthGreen: '#00ff44',
    healthRed: '#ff2222',
    enemyGreen: '#44aa22',
    enemyEyes: '#ff0000',
    alienBlood: '#33ff33',
    laserRed: '#ff3333',
    muzzleFlash: '#ffaa00',
    flashlight: 'rgba(255, 245, 220, 0.15)',
    darkness: 'rgba(0, 0, 0, 0.95)',
    terminal: '#00ffaa',
    keycard: '#ffdd00'
};

// ==================== GAME STATE ====================
const game = {
    state: 'menu', // menu, playing, paused, gameover, levelcomplete, victory
    level: 1,
    lives: 3,
    score: 0,
    credits: 500,
    xp: 0,
    rank: 1,
    debugMode: false,
    screenShake: 0,
    screenShakeIntensity: 0,
    damageFlash: 0,
    warningLightPhase: 0,
    activeTab: 'mission' // inventory, map, mission
};

// ==================== INPUT ====================
const keys = {};
const mouse = { x: 400, y: 300, down: false };

document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'q') game.debugMode = !game.debugMode;
    if (e.key === ' ' && game.state === 'menu') startGame();
    if (e.key === ' ' && game.state === 'gameover') restartGame();
    if (e.key === ' ' && game.state === 'levelcomplete') nextLevel();
    if (e.key === ' ' && game.state === 'victory') restartGame();
    if (e.key.toLowerCase() === 'p' && game.state === 'playing') game.state = 'paused';
    else if (e.key.toLowerCase() === 'p' && game.state === 'paused') game.state = 'playing';
    if (e.key.toLowerCase() === 'r' && game.state === 'playing') reloadWeapon();
    if (e.key === 'Escape') game.state = game.state === 'paused' ? 'playing' : 'paused';
});

document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', e => {
    mouse.down = true;
    if (game.state === 'menu') startGame();
    if (game.state === 'playing') shoot();
});

canvas.addEventListener('mouseup', () => mouse.down = false);
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ==================== PLAYER ====================
const player = {
    x: 400, y: 300,
    width: 24, height: 24,
    angle: 0,
    health: 100,
    maxHealth: 100,
    weapon: 0,
    ammo: [300, 0, 0, 0],
    maxAmmo: [300, 400, 50, 200],
    magazineSize: [30, 40, 8, 50],
    magazine: [30, 40, 8, 50],
    reloading: false,
    reloadTime: 0,
    fireRate: [100, 50, 400, 50],
    lastShot: 0,
    damage: [15, 10, 40, 8],
    keycards: [],
    flashlightOn: true,
    invincible: 0
};

const weapons = [
    { name: 'Assault Rifle', color: '#888888', found: true },
    { name: 'SMG', color: '#666699', found: false },
    { name: 'Shotgun', color: '#996633', found: false },
    { name: 'Flamethrower', color: '#ff6600', found: false }
];

// ==================== ENTITIES ====================
let bullets = [];
let enemies = [];
let particles = [];
let pickups = [];
let doors = [];
let terminals = [];
let projectiles = []; // Enemy projectiles
let barrels = []; // Explosive barrels
let logs = []; // Story logs
let shellCasings = []; // Spent ammunition
let steamVents = []; // Steam/smoke effects
let ambientParticles = []; // Background particles

// ==================== LEVEL DATA ====================
const LEVELS = [
    // Level 1: Tutorial - Docking Bay
    {
        name: "DOCKING BAY ALPHA",
        width: 20, height: 15,
        playerStart: { x: 2, y: 7 },
        exit: { x: 18, y: 7 },
        enemies: [
            { type: 'scorpion', x: 8, y: 5 },
            { type: 'scorpion', x: 10, y: 10 },
            { type: 'scorpion_small', x: 14, y: 7 }
        ],
        pickups: [
            { type: 'health', x: 6, y: 3 },
            { type: 'ammo', x: 12, y: 12 }
        ],
        doors: [
            { x: 10, y: 7, keycard: null, vertical: false }
        ],
        keycards: [],
        map: null
    },
    // Level 2: Engineering
    {
        name: "ENGINEERING DECK",
        width: 25, height: 20,
        playerStart: { x: 2, y: 10 },
        exit: { x: 23, y: 10 },
        enemies: [
            { type: 'scorpion', x: 6, y: 5 },
            { type: 'scorpion', x: 8, y: 15 },
            { type: 'scorpion', x: 12, y: 8 },
            { type: 'scorpion', x: 14, y: 12 },
            { type: 'scorpion_laser', x: 18, y: 6 },
            { type: 'scorpion_laser', x: 20, y: 14 }
        ],
        pickups: [
            { type: 'health', x: 10, y: 5 },
            { type: 'ammo', x: 16, y: 15 },
            { type: 'weapon_smg', x: 22, y: 3 }
        ],
        doors: [
            { x: 12, y: 10, keycard: 'blue', vertical: false }
        ],
        keycards: [{ color: 'blue', x: 8, y: 3 }],
        map: null
    },
    // Level 3: Medical Bay
    {
        name: "MEDICAL BAY",
        width: 30, height: 20,
        playerStart: { x: 2, y: 10 },
        exit: { x: 28, y: 10 },
        enemies: [
            { type: 'scorpion', x: 6, y: 5 },
            { type: 'scorpion', x: 8, y: 15 },
            { type: 'arachnid', x: 14, y: 10 },
            { type: 'arachnid', x: 18, y: 8 },
            { type: 'scorpion_laser', x: 22, y: 5 },
            { type: 'scorpion_laser', x: 24, y: 15 }
        ],
        pickups: [
            { type: 'health', x: 10, y: 3 },
            { type: 'health', x: 20, y: 17 },
            { type: 'ammo', x: 15, y: 10 },
            { type: 'weapon_shotgun', x: 26, y: 5 }
        ],
        doors: [
            { x: 12, y: 10, keycard: 'red', vertical: false },
            { x: 20, y: 10, keycard: null, vertical: false }
        ],
        keycards: [{ color: 'red', x: 6, y: 17 }],
        map: null
    },
    // Level 4: Cargo Hold
    {
        name: "CARGO HOLD",
        width: 35, height: 25,
        playerStart: { x: 2, y: 12 },
        exit: { x: 33, y: 12 },
        enemies: [
            { type: 'scorpion', x: 8, y: 6 },
            { type: 'scorpion', x: 10, y: 18 },
            { type: 'scorpion', x: 14, y: 10 },
            { type: 'scorpion', x: 16, y: 14 },
            { type: 'arachnid', x: 20, y: 8 },
            { type: 'arachnid', x: 22, y: 16 },
            { type: 'scorpion_laser', x: 26, y: 6 },
            { type: 'scorpion_laser', x: 28, y: 18 }
        ],
        pickups: [
            { type: 'health', x: 12, y: 4 },
            { type: 'health', x: 24, y: 20 },
            { type: 'ammo', x: 18, y: 12 },
            { type: 'ammo', x: 30, y: 8 },
            { type: 'weapon_flamethrower', x: 32, y: 20 }
        ],
        doors: [
            { x: 15, y: 12, keycard: 'yellow', vertical: false },
            { x: 25, y: 12, keycard: null, vertical: false }
        ],
        keycards: [{ color: 'yellow', x: 10, y: 22 }],
        map: null
    },
    // Level 5: Planet Surface - Boss Level
    {
        name: "CRASH SITE",
        width: 40, height: 35,
        playerStart: { x: 20, y: 30 },
        exit: { x: 20, y: 3 },
        enemies: [
            { type: 'scorpion', x: 10, y: 25 },
            { type: 'scorpion', x: 30, y: 25 },
            { type: 'scorpion', x: 15, y: 20 },
            { type: 'scorpion', x: 25, y: 20 },
            { type: 'arachnid', x: 10, y: 15 },
            { type: 'arachnid', x: 30, y: 15 },
            { type: 'scorpion_laser', x: 15, y: 10 },
            { type: 'scorpion_laser', x: 25, y: 10 }
        ],
        pickups: [
            { type: 'health', x: 5, y: 28 },
            { type: 'health', x: 35, y: 28 },
            { type: 'ammo', x: 8, y: 18 },
            { type: 'ammo', x: 32, y: 18 }
        ],
        boss: { type: 'hive_commander', x: 20, y: 8 },
        doors: [],
        keycards: [],
        outdoor: true,
        map: null
    }
];

// ==================== LEVEL GENERATION ====================
function generateMap(levelData) {
    const map = [];
    const { width, height } = levelData;

    for (let y = 0; y < height; y++) {
        map[y] = [];
        for (let x = 0; x < width; x++) {
            // Border walls
            if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
                map[y][x] = 1; // Wall
            } else if (levelData.outdoor) {
                // Outdoor level - rocks and open space
                if (Math.random() < 0.08) {
                    map[y][x] = 2; // Rock
                } else {
                    map[y][x] = 0; // Ground
                }
            } else {
                // Indoor corridors
                map[y][x] = generateIndoorTile(x, y, width, height, levelData);
            }
        }
    }

    // Ensure path from start to exit
    carvePath(map, levelData.playerStart, levelData.exit, levelData);

    return map;
}

function generateIndoorTile(x, y, width, height, levelData) {
    // Create corridor-like structure
    const corridorY = Math.floor(height / 2);
    const corridorWidth = 3;

    // Main horizontal corridor
    if (Math.abs(y - corridorY) <= corridorWidth / 2) {
        return 0; // Floor
    }

    // Vertical corridors every few tiles
    if (x % 8 < 2 && y > 2 && y < height - 3) {
        return 0;
    }

    // Rooms
    if ((x > 3 && x < width - 4) && (y > 2 && y < height - 3)) {
        if (Math.random() < 0.6) return 0;
    }

    return Math.random() < 0.3 ? 1 : 0;
}

function carvePath(map, start, end, levelData) {
    let x = start.x;
    let y = start.y;

    while (x !== end.x || y !== end.y) {
        map[y][x] = 0;
        // Carve wider path
        if (y > 0) map[y-1][x] = 0;
        if (y < map.length - 1) map[y+1][x] = 0;

        if (x < end.x) x++;
        else if (x > end.x) x--;
        else if (y < end.y) y++;
        else if (y > end.y) y--;
    }
    map[end.y][end.x] = 0;
}

// ==================== ENEMY TYPES ====================
const ENEMY_TYPES = {
    scorpion_small: {
        width: 16, height: 16,
        health: 30, damage: 5, speed: 2,
        color: '#2a6622', behavior: 'chase'
    },
    scorpion: {
        width: 24, height: 24,
        health: 50, damage: 10, speed: 1.5,
        color: '#44aa22', behavior: 'chase'
    },
    scorpion_laser: {
        width: 24, height: 24,
        health: 60, damage: 15, speed: 1,
        color: '#44aa22', behavior: 'ranged', shootRate: 2000
    },
    arachnid: {
        width: 32, height: 32,
        health: 100, damage: 20, speed: 1.2,
        color: '#669933', behavior: 'chase'
    },
    hive_commander: {
        width: 64, height: 64,
        health: 400, damage: 30, speed: 0.8,
        color: '#448822', behavior: 'boss', shootRate: 3000
    }
};

// ==================== GAME FUNCTIONS ====================
function startGame() {
    game.state = 'playing';
    game.level = 1;
    game.lives = 3;
    game.credits = 500;
    game.xp = 0;
    player.health = player.maxHealth;
    player.weapon = 0;
    player.ammo = [300, 0, 0, 0];
    player.magazine = [...player.magazineSize];
    player.keycards = [];
    weapons[0].found = true;
    weapons[1].found = false;
    weapons[2].found = false;
    weapons[3].found = false;
    loadLevel(1);
}

function restartGame() {
    startGame();
}

function loadLevel(levelNum) {
    const levelData = LEVELS[levelNum - 1];
    if (!levelData) {
        game.state = 'victory';
        return;
    }

    // Generate map if not exists
    levelData.map = generateMap(levelData);

    // Reset player position
    player.x = levelData.playerStart.x * TILE_SIZE + TILE_SIZE / 2;
    player.y = levelData.playerStart.y * TILE_SIZE + TILE_SIZE / 2;
    player.health = player.maxHealth;
    player.invincible = 60;

    // Clear entities
    bullets = [];
    enemies = [];
    particles = [];
    pickups = [];
    doors = [];
    terminals = [];
    projectiles = [];

    // Spawn enemies
    levelData.enemies.forEach(e => spawnEnemy(e.type, e.x * TILE_SIZE, e.y * TILE_SIZE));

    // Spawn boss if exists
    if (levelData.boss) {
        spawnEnemy(levelData.boss.type, levelData.boss.x * TILE_SIZE, levelData.boss.y * TILE_SIZE);
    }

    // Spawn pickups
    levelData.pickups.forEach(p => {
        pickups.push({
            type: p.type,
            x: p.x * TILE_SIZE + TILE_SIZE / 2,
            y: p.y * TILE_SIZE + TILE_SIZE / 2,
            width: 16, height: 16
        });
    });

    // Spawn keycards
    levelData.keycards.forEach(k => {
        pickups.push({
            type: 'keycard',
            color: k.color,
            x: k.x * TILE_SIZE + TILE_SIZE / 2,
            y: k.y * TILE_SIZE + TILE_SIZE / 2,
            width: 16, height: 16
        });
    });

    // Spawn doors
    levelData.doors.forEach(d => {
        doors.push({
            x: d.x * TILE_SIZE,
            y: d.y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            keycard: d.keycard,
            open: false,
            vertical: d.vertical
        });
    });
}

function nextLevel() {
    game.level++;
    game.credits += 500 * game.level;
    game.xp += 1000 * game.level;
    loadLevel(game.level);
    game.state = 'playing';
}

function spawnEnemy(type, x, y) {
    const template = ENEMY_TYPES[type];
    enemies.push({
        type,
        x, y,
        width: template.width,
        height: template.height,
        health: template.health * (1 + (game.level - 1) * 0.1),
        maxHealth: template.health * (1 + (game.level - 1) * 0.1),
        damage: template.damage * (1 + (game.level - 1) * 0.1),
        speed: template.speed,
        color: template.color,
        behavior: template.behavior,
        shootRate: template.shootRate || 0,
        lastShot: 0,
        angle: 0,
        flash: 0,
        phase: 1 // For boss
    });
}

// ==================== SHOOTING ====================
function shoot() {
    if (game.state !== 'playing') return;
    if (player.reloading) return;
    if (Date.now() - player.lastShot < player.fireRate[player.weapon]) return;
    if (player.magazine[player.weapon] <= 0) {
        reloadWeapon();
        return;
    }

    player.lastShot = Date.now();
    player.magazine[player.weapon]--;

    const angle = player.angle;

    if (player.weapon === 2) { // Shotgun - spread
        for (let i = -2; i <= 2; i++) {
            const spread = i * 0.15;
            createBullet(angle + spread);
        }
        game.screenShake = 8;
    } else if (player.weapon === 3) { // Flamethrower
        for (let i = 0; i < 3; i++) {
            createBullet(angle + (Math.random() - 0.5) * 0.3, true);
        }
    } else {
        createBullet(angle);
    }

    // Muzzle flash particle
    createParticle(
        player.x + Math.cos(angle) * 20,
        player.y + Math.sin(angle) * 20,
        COLORS.muzzleFlash, 8, 5
    );

    // Eject shell casing (except flamethrower)
    if (player.weapon !== 3) {
        createShellCasing(player.x, player.y, angle);
    }

    game.screenShake = player.weapon === 2 ? 6 : 2;
}

function createBullet(angle, isFlame = false) {
    bullets.push({
        x: player.x + Math.cos(angle) * 20,
        y: player.y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * BULLET_SPEED,
        vy: Math.sin(angle) * BULLET_SPEED,
        damage: player.damage[player.weapon],
        isFlame,
        life: isFlame ? 20 : 100
    });
}

function reloadWeapon() {
    if (player.reloading) return;
    if (player.ammo[player.weapon] <= 0) return;
    if (player.magazine[player.weapon] >= player.magazineSize[player.weapon]) return;

    player.reloading = true;
    player.reloadTime = 60; // 1 second reload
}

// ==================== PARTICLES ====================
function createParticle(x, y, color, size, life) {
    particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color, size, life, maxLife: life
    });
}

function createBloodSplatter(x, y) {
    for (let i = 0; i < 8; i++) {
        createParticle(x, y, COLORS.alienBlood, 4 + Math.random() * 4, 30);
    }
}

// ==================== COLLISION ====================
function rectCollision(a, b) {
    return a.x - a.width/2 < b.x + b.width/2 &&
           a.x + a.width/2 > b.x - b.width/2 &&
           a.y - a.height/2 < b.y + b.height/2 &&
           a.y + a.height/2 > b.y - b.height/2;
}

function tileAt(x, y) {
    const levelData = LEVELS[game.level - 1];
    if (!levelData || !levelData.map) return 1;
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    if (tx < 0 || ty < 0 || tx >= levelData.width || ty >= levelData.height) return 1;
    return levelData.map[ty][tx];
}

function canMoveTo(x, y, width, height) {
    const halfW = width / 2;
    const halfH = height / 2;

    // Check corners
    if (tileAt(x - halfW, y - halfH) !== 0) return false;
    if (tileAt(x + halfW, y - halfH) !== 0) return false;
    if (tileAt(x - halfW, y + halfH) !== 0) return false;
    if (tileAt(x + halfW, y + halfH) !== 0) return false;

    // Check doors
    for (const door of doors) {
        if (!door.open) {
            const doorRect = { x: door.x + TILE_SIZE/2, y: door.y + TILE_SIZE/2, width: TILE_SIZE, height: TILE_SIZE };
            const playerRect = { x, y, width, height };
            if (rectCollision(playerRect, doorRect)) return false;
        }
    }

    return true;
}

// ==================== UPDATE ====================
function update() {
    if (game.state !== 'playing') return;

    updatePlayer();
    updateBullets();
    updateEnemies();
    updateParticles();
    updatePickups();
    updateProjectiles();
    updateShellCasings();
    updateAmbientParticles();
    checkLevelComplete();

    // Update visual effects
    if (game.screenShake > 0) game.screenShake--;
    game.warningLightPhase = (game.warningLightPhase + 0.05) % (Math.PI * 2);
}

function updatePlayer() {
    // Movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    const newX = player.x + dx * PLAYER_SPEED;
    const newY = player.y + dy * PLAYER_SPEED;

    if (canMoveTo(newX, player.y, player.width, player.height)) {
        player.x = newX;
    }
    if (canMoveTo(player.x, newY, player.width, player.height)) {
        player.y = newY;
    }

    // Aim at mouse (accounting for camera)
    const camX = player.x - canvas.width / 2;
    const camY = player.y - canvas.height / 2;
    player.angle = Math.atan2(mouse.y + camY - player.y, mouse.x + camX - player.x);

    // Reload
    if (player.reloading) {
        player.reloadTime--;
        if (player.reloadTime <= 0) {
            const needed = player.magazineSize[player.weapon] - player.magazine[player.weapon];
            const available = Math.min(needed, player.ammo[player.weapon]);
            player.magazine[player.weapon] += available;
            player.ammo[player.weapon] -= available;
            player.reloading = false;
        }
    }

    // Auto-fire for flamethrower
    if (mouse.down && player.weapon === 3) {
        shoot();
    }

    // Invincibility frames
    if (player.invincible > 0) player.invincible--;
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;

        // Wall collision
        if (tileAt(b.x, b.y) !== 0 || b.life <= 0) {
            if (b.isFlame) {
                createParticle(b.x, b.y, '#ff6600', 6, 10);
            }
            bullets.splice(i, 1);
            continue;
        }

        // Enemy collision
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dx = b.x - e.x;
            const dy = b.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < e.width / 2 + 5) {
                e.health -= b.damage;
                e.flash = 5;
                createBloodSplatter(b.x, b.y);

                if (e.health <= 0) {
                    // Enemy death
                    game.xp += e.type === 'hive_commander' ? 500 : 50;
                    game.credits += e.type === 'hive_commander' ? 200 : 20;

                    // Death particles
                    for (let k = 0; k < 15; k++) {
                        createParticle(e.x, e.y, e.color, 6, 40);
                    }

                    enemies.splice(j, 1);
                }

                bullets.splice(i, 1);
                break;
            }
        }
    }
}

function updateEnemies() {
    const levelData = LEVELS[game.level - 1];

    enemies.forEach(e => {
        // Flash effect
        if (e.flash > 0) e.flash--;

        // Calculate direction to player
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        e.angle = Math.atan2(dy, dx);

        // Behavior
        if (e.behavior === 'chase' || e.behavior === 'boss') {
            // Move toward player
            if (dist > e.width) {
                const moveX = (dx / dist) * e.speed;
                const moveY = (dy / dist) * e.speed;

                if (canMoveTo(e.x + moveX, e.y, e.width, e.height)) {
                    e.x += moveX;
                }
                if (canMoveTo(e.x, e.y + moveY, e.width, e.height)) {
                    e.y += moveY;
                }
            }

            // Boss behavior
            if (e.behavior === 'boss') {
                // Phase 2 at 50% health
                if (e.health < e.maxHealth * 0.5) {
                    e.phase = 2;
                    e.speed = 1.2;
                }

                // Boss shoots
                if (Date.now() - e.lastShot > e.shootRate) {
                    e.lastShot = Date.now();
                    // Acid spit
                    projectiles.push({
                        x: e.x, y: e.y,
                        vx: (dx / dist) * 5,
                        vy: (dy / dist) * 5,
                        damage: 20,
                        color: '#33ff33'
                    });
                }
            }
        } else if (e.behavior === 'ranged') {
            // Stay at distance and shoot
            if (dist < 150) {
                const moveX = -(dx / dist) * e.speed;
                const moveY = -(dy / dist) * e.speed;
                if (canMoveTo(e.x + moveX, e.y, e.width, e.height)) e.x += moveX;
                if (canMoveTo(e.x, e.y + moveY, e.width, e.height)) e.y += moveY;
            } else if (dist > 250) {
                const moveX = (dx / dist) * e.speed;
                const moveY = (dy / dist) * e.speed;
                if (canMoveTo(e.x + moveX, e.y, e.width, e.height)) e.x += moveX;
                if (canMoveTo(e.x, e.y + moveY, e.width, e.height)) e.y += moveY;
            }

            // Shoot laser
            if (Date.now() - e.lastShot > e.shootRate && dist < 300) {
                e.lastShot = Date.now();
                projectiles.push({
                    x: e.x, y: e.y,
                    vx: (dx / dist) * 6,
                    vy: (dy / dist) * 6,
                    damage: e.damage,
                    color: '#33ff00'
                });
            }
        }

        // Collision with player
        if (player.invincible <= 0 && dist < (e.width + player.width) / 2) {
            damagePlayer(e.damage);
        }
    });
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wall collision
        if (tileAt(p.x, p.y) !== 0) {
            projectiles.splice(i, 1);
            continue;
        }

        // Player collision
        const dx = p.x - player.x;
        const dy = p.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.width / 2 + 5 && player.invincible <= 0) {
            damagePlayer(p.damage);
            projectiles.splice(i, 1);
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life--;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updatePickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dx = p.x - player.x;
        const dy = p.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 30) {
            // Collect pickup
            switch (p.type) {
                case 'health':
                    player.health = Math.min(player.maxHealth, player.health + 25);
                    break;
                case 'ammo':
                    player.ammo[player.weapon] = Math.min(
                        player.maxAmmo[player.weapon],
                        player.ammo[player.weapon] + 50
                    );
                    break;
                case 'keycard':
                    player.keycards.push(p.color);
                    break;
                case 'weapon_smg':
                    weapons[1].found = true;
                    player.ammo[1] = 200;
                    break;
                case 'weapon_shotgun':
                    weapons[2].found = true;
                    player.ammo[2] = 25;
                    break;
                case 'weapon_flamethrower':
                    weapons[3].found = true;
                    player.ammo[3] = 100;
                    break;
            }

            // Pickup particles
            for (let j = 0; j < 8; j++) {
                createParticle(p.x, p.y, COLORS.uiBlue, 4, 20);
            }

            pickups.splice(i, 1);
        }
    }

    // Check door interactions
    if (keys[' ']) {
        doors.forEach(door => {
            if (door.open) return;
            const dx = (door.x + TILE_SIZE/2) - player.x;
            const dy = (door.y + TILE_SIZE/2) - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 60) {
                if (!door.keycard || player.keycards.includes(door.keycard)) {
                    door.open = true;
                }
            }
        });
    }
}

function damagePlayer(amount) {
    player.health -= amount;
    player.invincible = 30;
    game.screenShake = 10;
    game.damageFlash = 20; // Red screen flash

    // Blood particles
    for (let i = 0; i < 8; i++) {
        createParticle(player.x, player.y, '#ff0000', 4 + Math.random() * 4, 25);
    }

    if (player.health <= 0) {
        game.lives--;
        if (game.lives <= 0) {
            game.state = 'gameover';
        } else {
            // Respawn
            const levelData = LEVELS[game.level - 1];
            player.x = levelData.playerStart.x * TILE_SIZE + TILE_SIZE / 2;
            player.y = levelData.playerStart.y * TILE_SIZE + TILE_SIZE / 2;
            player.health = player.maxHealth;
            player.invincible = 120;
        }
    }
}

// Shell casing system
function createShellCasing(x, y, angle) {
    const perpAngle = angle + Math.PI / 2;
    shellCasings.push({
        x: x + Math.cos(perpAngle) * 8,
        y: y + Math.sin(perpAngle) * 8,
        vx: Math.cos(perpAngle) * (2 + Math.random() * 2),
        vy: Math.sin(perpAngle) * (2 + Math.random() * 2) - 2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.5,
        life: 60
    });
}

function updateShellCasings() {
    for (let i = shellCasings.length - 1; i >= 0; i--) {
        const s = shellCasings[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.2; // gravity
        s.vx *= 0.95;
        s.vy *= 0.95;
        s.rotation += s.rotSpeed;
        s.life--;

        if (s.life <= 0) {
            shellCasings.splice(i, 1);
        }
    }
}

function renderShellCasings() {
    ctx.fillStyle = '#aa8833';
    shellCasings.forEach(s => {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.globalAlpha = Math.min(1, s.life / 20);
        ctx.fillRect(-3, -1, 6, 2);
        ctx.restore();
    });
    ctx.globalAlpha = 1;
}

// Ambient particle system (dust, sparks, steam)
function spawnAmbientParticle() {
    const levelData = LEVELS[game.level - 1];
    if (!levelData) return;

    // Spawn near player with some randomness
    const angle = Math.random() * Math.PI * 2;
    const dist = 100 + Math.random() * 200;

    ambientParticles.push({
        x: player.x + Math.cos(angle) * dist,
        y: player.y + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.5 - Math.random() * 0.5,
        size: 1 + Math.random() * 2,
        life: 60 + Math.random() * 60,
        maxLife: 60 + Math.random() * 60,
        type: Math.random() < 0.7 ? 'dust' : (Math.random() < 0.5 ? 'spark' : 'steam')
    });
}

function updateAmbientParticles() {
    // Spawn new particles occasionally
    if (Math.random() < 0.1) spawnAmbientParticle();

    for (let i = ambientParticles.length - 1; i >= 0; i--) {
        const p = ambientParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.type === 'steam') {
            p.vy *= 0.98;
            p.size += 0.05;
        }

        if (p.life <= 0) {
            ambientParticles.splice(i, 1);
        }
    }

    // Keep particle count reasonable
    while (ambientParticles.length > 50) {
        ambientParticles.shift();
    }
}

function renderAmbientParticles() {
    ambientParticles.forEach(p => {
        const alpha = p.life / p.maxLife;

        if (p.type === 'dust') {
            ctx.fillStyle = `rgba(100, 100, 100, ${alpha * 0.3})`;
        } else if (p.type === 'spark') {
            ctx.fillStyle = `rgba(255, 200, 100, ${alpha * 0.6})`;
        } else { // steam
            ctx.fillStyle = `rgba(150, 150, 150, ${alpha * 0.2})`;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function checkLevelComplete() {
    const levelData = LEVELS[game.level - 1];
    if (!levelData) return;

    // Check if player reached exit
    const dx = player.x - (levelData.exit.x * TILE_SIZE + TILE_SIZE / 2);
    const dy = player.y - (levelData.exit.y * TILE_SIZE + TILE_SIZE / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Must kill all enemies first (especially boss)
    const hasEnemies = enemies.length > 0;

    if (dist < 40 && !hasEnemies) {
        if (game.level >= 5) {
            game.state = 'victory';
        } else {
            game.state = 'levelcomplete';
        }
    }
}

// ==================== RENDER ====================
function render() {
    // Clear
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === 'menu') {
        renderMenu();
        return;
    }

    // Camera with screen shake
    const shakeX = game.screenShake > 0 ? (Math.random() - 0.5) * game.screenShake : 0;
    const shakeY = game.screenShake > 0 ? (Math.random() - 0.5) * game.screenShake : 0;

    ctx.save();
    const camX = player.x - canvas.width / 2 + shakeX;
    const camY = player.y - canvas.height / 2 + shakeY;
    ctx.translate(-camX, -camY);

    renderMap();
    renderPickups();
    renderDoors();
    renderShellCasings();
    renderAmbientParticles();
    renderEnemies();
    renderPlayer();
    renderBullets();
    renderProjectiles();
    renderParticles();
    renderLighting(camX, camY);
    renderExit();

    ctx.restore();

    renderHUD();

    if (game.debugMode) renderDebug();

    if (game.state === 'paused') renderPaused();
    if (game.state === 'gameover') renderGameOver();
    if (game.state === 'levelcomplete') renderLevelComplete();
    if (game.state === 'victory') renderVictory();
}

function renderMenu() {
    // Background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
        const x = (i * 73) % canvas.width;
        const y = (i * 47) % canvas.height;
        const size = (i % 3) + 1;
        ctx.fillRect(x, y, size, size);
    }

    // Planet
    ctx.fillStyle = '#1a3a5a';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height + 100, 200, 0, Math.PI * 2);
    ctx.fill();

    // Atmosphere glow
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height + 100, 150,
        canvas.width / 2, canvas.height + 100, 250
    );
    gradient.addColorStop(0, 'rgba(0, 100, 200, 0.3)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LOST', canvas.width / 2 - 80, 150);

    ctx.fillStyle = COLORS.uiBlue;
    ctx.fillText('OUTPOST', canvas.width / 2 + 60, 150);

    // Subtitle
    ctx.fillStyle = '#888888';
    ctx.font = '16px Arial';
    ctx.fillText('A Survival Horror Shooter', canvas.width / 2, 190);

    // Start prompt
    ctx.fillStyle = COLORS.uiBlue;
    ctx.font = '24px Arial';
    const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText('CLICK OR PRESS SPACE TO START', canvas.width / 2, 400);
    ctx.globalAlpha = 1;

    // Controls
    ctx.fillStyle = '#666666';
    ctx.font = '14px Arial';
    ctx.fillText('WASD - Move | Mouse - Aim | Click - Shoot | R - Reload | P - Pause | Q - Debug', canvas.width / 2, 550);
}

function renderMap() {
    const levelData = LEVELS[game.level - 1];
    if (!levelData || !levelData.map) return;

    const startX = Math.max(0, Math.floor((player.x - canvas.width) / TILE_SIZE));
    const endX = Math.min(levelData.width, Math.ceil((player.x + canvas.width) / TILE_SIZE));
    const startY = Math.max(0, Math.floor((player.y - canvas.height) / TILE_SIZE));
    const endY = Math.min(levelData.height, Math.ceil((player.y + canvas.height) / TILE_SIZE));

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = levelData.map[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            if (tile === 0) {
                // Floor
                if (levelData.outdoor) {
                    // Rocky ground with lava cracks
                    ctx.fillStyle = '#2a2018';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    // Texture variation
                    ctx.fillStyle = '#1a1810';
                    ctx.fillRect(px + 4, py + 4, 8, 8);
                    ctx.fillRect(px + 20, py + 18, 6, 6);
                    // Occasional lava glow
                    if ((x * 7 + y * 13) % 17 === 0) {
                        ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
                        ctx.fillRect(px + 8, py + 8, 16, 16);
                    }
                } else {
                    // Metal grated floor with hexagonal pattern
                    ctx.fillStyle = (x + y) % 2 === 0 ? '#181818' : '#141414';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                    // Better hexagonal grate pattern
                    ctx.fillStyle = '#0a0a0a';
                    for (let i = 0; i < 4; i++) {
                        for (let j = 0; j < 4; j++) {
                            const hx = px + 2 + i * 8;
                            const hy = py + 2 + j * 8 + (i % 2) * 4;
                            ctx.beginPath();
                            ctx.moveTo(hx + 3, hy);
                            ctx.lineTo(hx + 6, hy + 2);
                            ctx.lineTo(hx + 6, hy + 5);
                            ctx.lineTo(hx + 3, hy + 7);
                            ctx.lineTo(hx, hy + 5);
                            ctx.lineTo(hx, hy + 2);
                            ctx.closePath();
                            ctx.fill();
                        }
                    }

                    // Occasional floor details (bolts, vents)
                    if ((x * 3 + y * 7) % 11 === 0) {
                        ctx.fillStyle = '#333';
                        ctx.beginPath();
                        ctx.arc(px + 8, py + 8, 2, 0, Math.PI * 2);
                        ctx.arc(px + 24, py + 24, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            } else if (tile === 1) {
                // Wall with more detail
                ctx.fillStyle = COLORS.wall;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Wall highlight/bevel
                ctx.fillStyle = COLORS.wallHighlight;
                ctx.fillRect(px, py, TILE_SIZE, 3);
                ctx.fillRect(px, py, 3, TILE_SIZE);
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(px + TILE_SIZE - 3, py, 3, TILE_SIZE);
                ctx.fillRect(px, py + TILE_SIZE - 3, TILE_SIZE, 3);

                // Hazard stripes
                if ((x + y) % 5 === 0) {
                    for (let i = 0; i < 4; i++) {
                        ctx.fillStyle = i % 2 === 0 ? COLORS.hazardYellow : '#1a1a0a';
                        ctx.fillRect(px + 3, py + 3 + i * 7, TILE_SIZE - 6, 6);
                    }
                }
                // Pipes on some walls
                else if ((x * 5 + y * 3) % 7 === 0) {
                    ctx.fillStyle = '#444';
                    ctx.fillRect(px + 6, py + 4, 6, TILE_SIZE - 8);
                    ctx.fillRect(px + 20, py + 4, 6, TILE_SIZE - 8);
                    ctx.fillStyle = '#555';
                    ctx.fillRect(px + 7, py + 4, 2, TILE_SIZE - 8);
                    ctx.fillRect(px + 21, py + 4, 2, TILE_SIZE - 8);
                }
                // Emergency lights
                else if ((x * 11 + y * 13) % 23 === 0) {
                    const lightIntensity = Math.sin(game.warningLightPhase) * 0.5 + 0.5;
                    ctx.fillStyle = `rgba(255, 50, 50, ${lightIntensity * 0.8})`;
                    ctx.beginPath();
                    ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = `rgba(255, 100, 100, ${lightIntensity * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 12, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (tile === 2) {
                // Rock (outdoor)
                ctx.fillStyle = '#3a3028';
                ctx.beginPath();
                ctx.moveTo(px + TILE_SIZE/2, py);
                ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE * 0.7);
                ctx.lineTo(px + TILE_SIZE * 0.8, py + TILE_SIZE);
                ctx.lineTo(px + TILE_SIZE * 0.2, py + TILE_SIZE);
                ctx.lineTo(px, py + TILE_SIZE * 0.6);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#4a4038';
                ctx.beginPath();
                ctx.moveTo(px + TILE_SIZE/2, py);
                ctx.lineTo(px + TILE_SIZE * 0.7, py + TILE_SIZE * 0.4);
                ctx.lineTo(px + TILE_SIZE * 0.3, py + TILE_SIZE * 0.3);
                ctx.closePath();
                ctx.fill();
            }
        }
    }
}

function renderLaserSight() {
    // Draw laser sight from weapon
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(player.x + Math.cos(player.angle) * 25, player.y + Math.sin(player.angle) * 25);

    // Ray cast to find wall or max distance
    let laserDist = 400;
    for (let d = 30; d < 400; d += 8) {
        const checkX = player.x + Math.cos(player.angle) * d;
        const checkY = player.y + Math.sin(player.angle) * d;
        if (tileAt(checkX, checkY) !== 0) {
            laserDist = d;
            break;
        }
    }

    ctx.lineTo(
        player.x + Math.cos(player.angle) * laserDist,
        player.y + Math.sin(player.angle) * laserDist
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // Laser dot at end
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(
        player.x + Math.cos(player.angle) * laserDist,
        player.y + Math.sin(player.angle) * laserDist,
        3, 0, Math.PI * 2
    );
    ctx.fill();
}

function renderPlayer() {
    // Laser sight first (behind player)
    renderLaserSight();

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Invincibility flash
    if (player.invincible > 0 && player.invincible % 6 < 3) {
        ctx.globalAlpha = 0.5;
    }

    // Body (armored suit)
    ctx.fillStyle = '#446688';
    ctx.fillRect(-12, -10, 24, 20);

    // Armor details
    ctx.fillStyle = '#334455';
    ctx.fillRect(-10, -8, 20, 16);

    // Shoulder pads
    ctx.fillStyle = '#3a5570';
    ctx.fillRect(-14, -8, 4, 16);
    ctx.fillRect(10, -8, 4, 16);

    // Helmet
    ctx.fillStyle = '#557799';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Visor (glowing blue)
    ctx.fillStyle = '#00aaff';
    ctx.shadowColor = '#00aaff';
    ctx.shadowBlur = 5;
    ctx.fillRect(2, -4, 6, 8);
    ctx.shadowBlur = 0;

    // Weapon with details
    ctx.fillStyle = weapons[player.weapon].color;
    ctx.fillRect(8, -3, 18, 6);
    ctx.fillStyle = '#222';
    ctx.fillRect(14, -2, 4, 4);

    // Flashlight beam origin
    ctx.fillStyle = '#ffff88';
    ctx.shadowColor = '#ffff88';
    ctx.shadowBlur = 8;
    ctx.fillRect(24, -2, 4, 4);
    ctx.shadowBlur = 0;

    ctx.restore();
}

function renderEnemies() {
    enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);

        // Flash white when hit
        if (e.flash > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = e.color;
        }

        if (e.type === 'hive_commander') {
            // Boss - larger and more detailed
            ctx.rotate(e.angle);

            // Body
            ctx.beginPath();
            ctx.ellipse(0, 0, e.width/2, e.height/3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Mandibles
            ctx.fillStyle = e.flash > 0 ? '#ffffff' : '#225511';
            ctx.fillRect(e.width/3, -8, 12, 6);
            ctx.fillRect(e.width/3, 2, 12, 6);

            // Eyes
            ctx.fillStyle = e.phase === 2 ? '#ff0000' : '#ff4400';
            ctx.beginPath();
            ctx.arc(e.width/4, -6, 4, 0, Math.PI * 2);
            ctx.arc(e.width/4, 6, 4, 0, Math.PI * 2);
            ctx.fill();

            // Legs
            ctx.strokeStyle = e.color;
            ctx.lineWidth = 3;
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.moveTo(i * 8, -e.height/3);
                ctx.lineTo(i * 12, -e.height/2 - 10);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(i * 8, e.height/3);
                ctx.lineTo(i * 12, e.height/2 + 10);
                ctx.stroke();
            }

            // Health bar
            ctx.rotate(-e.angle);
            const healthPercent = e.health / e.maxHealth;
            ctx.fillStyle = '#000000';
            ctx.fillRect(-30, -e.height/2 - 15, 60, 8);
            ctx.fillStyle = healthPercent > 0.5 ? COLORS.healthGreen : COLORS.healthRed;
            ctx.fillRect(-29, -e.height/2 - 14, 58 * healthPercent, 6);
        } else {
            // Regular enemies
            ctx.rotate(e.angle);

            // Body
            ctx.beginPath();
            ctx.ellipse(0, 0, e.width/2, e.height/3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Head/front
            ctx.fillStyle = e.flash > 0 ? '#ffffff' : '#336622';
            ctx.beginPath();
            ctx.arc(e.width/3, 0, e.height/4, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = COLORS.enemyEyes;
            ctx.beginPath();
            ctx.arc(e.width/3 + 2, -3, 2, 0, Math.PI * 2);
            ctx.arc(e.width/3 + 2, 3, 2, 0, Math.PI * 2);
            ctx.fill();

            // Legs
            ctx.strokeStyle = e.color;
            ctx.lineWidth = 2;
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.moveTo(i * 6, -e.height/3);
                ctx.lineTo(i * 10, -e.height/2 - 5);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(i * 6, e.height/3);
                ctx.lineTo(i * 10, e.height/2 + 5);
                ctx.stroke();
            }

            // Laser indicator for ranged enemies
            if (e.behavior === 'ranged') {
                ctx.fillStyle = '#33ff33';
                ctx.beginPath();
                ctx.arc(e.width/2 + 5, 0, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    });
}

function renderBullets() {
    bullets.forEach(b => {
        if (b.isFlame) {
            ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, ${b.life / 20})`;
            ctx.beginPath();
            ctx.arc(b.x, b.y, 6 + Math.random() * 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Tracer
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x - b.vx * 2, b.y - b.vy * 2);
            ctx.stroke();
        }
    });
}

function renderProjectiles() {
    projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.fillStyle = `${p.color}44`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fill();
    });
}

function renderParticles() {
    particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function renderPickups() {
    pickups.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);

        // Bob animation
        const bob = Math.sin(Date.now() / 300 + p.x) * 3;
        ctx.translate(0, bob);

        // Glow
        ctx.fillStyle = 'rgba(0, 200, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        if (p.type === 'health') {
            // Health pack - red cross
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-8, -8, 16, 16);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-6, -2, 12, 4);
            ctx.fillRect(-2, -6, 4, 12);
        } else if (p.type === 'ammo') {
            // Ammo box
            ctx.fillStyle = '#888844';
            ctx.fillRect(-8, -6, 16, 12);
            ctx.fillStyle = '#aaaa66';
            ctx.fillRect(-6, -4, 12, 8);
            ctx.fillStyle = '#666633';
            ctx.fillRect(-4, -2, 8, 4);
        } else if (p.type === 'keycard') {
            // Keycard
            ctx.fillStyle = p.color === 'blue' ? '#0066ff' :
                           p.color === 'red' ? '#ff0000' : '#ffdd00';
            ctx.fillRect(-10, -6, 20, 12);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-8, -4, 6, 8);
            ctx.fillStyle = '#333333';
            ctx.fillRect(2, -2, 6, 4);
        } else if (p.type.startsWith('weapon_')) {
            // Weapon pickup
            ctx.fillStyle = '#666666';
            ctx.fillRect(-12, -4, 24, 8);
            ctx.fillStyle = COLORS.uiBlue;
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('NEW', 0, 3);
        }

        ctx.restore();
    });
}

function renderDoors() {
    doors.forEach(door => {
        if (door.open) return;

        ctx.fillStyle = '#444444';
        ctx.fillRect(door.x, door.y, door.width, door.height);

        // Door frame
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.strokeRect(door.x + 2, door.y + 2, door.width - 4, door.height - 4);

        // Keycard indicator
        if (door.keycard) {
            ctx.fillStyle = door.keycard === 'blue' ? '#0066ff' :
                           door.keycard === 'red' ? '#ff0000' : '#ffdd00';
            ctx.beginPath();
            ctx.arc(door.x + door.width/2, door.y + door.height/2, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function renderExit() {
    const levelData = LEVELS[game.level - 1];
    if (!levelData) return;

    const ex = levelData.exit.x * TILE_SIZE + TILE_SIZE / 2;
    const ey = levelData.exit.y * TILE_SIZE + TILE_SIZE / 2;

    // Exit marker
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(0, 255, 100, ${pulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(ex, ey, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLORS.terminal;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ex, ey, 15, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = COLORS.terminal;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', ex, ey + 4);
}

function renderLighting(camX, camY) {
    const levelData = LEVELS[game.level - 1];
    if (levelData && levelData.outdoor) {
        // Outdoor - less darkness
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(camX, camY, canvas.width, canvas.height);
        return;
    }

    // Create darkness overlay
    ctx.fillStyle = COLORS.darkness;
    ctx.fillRect(camX, camY, canvas.width, canvas.height);

    // Flashlight cone
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    // Main flashlight
    const gradient = ctx.createRadialGradient(
        player.x, player.y, 0,
        player.x, player.y, 200
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.arc(player.x, player.y, 200, player.angle - 0.5, player.angle + 0.5);
    ctx.closePath();
    ctx.fill();

    // Ambient light around player
    const ambientGradient = ctx.createRadialGradient(
        player.x, player.y, 0,
        player.x, player.y, 80
    );
    ambientGradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
    ambientGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = ambientGradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function renderHUD() {
    // Top-left: Lives and Rank/XP
    ctx.fillStyle = COLORS.uiDarkBlue;
    ctx.fillRect(10, 10, 150, 50);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 150, 50);

    ctx.fillStyle = COLORS.uiBlue;
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`RANK/XP  ${game.rank}/${game.xp}`, 20, 30);
    ctx.fillText(`LIVES    ${game.lives}`, 20, 50);

    // Top-center: Level name
    ctx.fillStyle = COLORS.uiDarkBlue;
    ctx.fillRect(canvas.width/2 - 100, 10, 200, 30);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(canvas.width/2 - 100, 10, 200, 30);

    const levelData = LEVELS[game.level - 1];
    ctx.fillStyle = COLORS.uiBlue;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(levelData ? levelData.name : 'UNKNOWN', canvas.width/2, 30);

    // Bottom: Health bar, Credits, Weapon, Ammo
    const bottomY = canvas.height - 60;

    // Health bar background
    ctx.fillStyle = COLORS.uiDarkBlue;
    ctx.fillRect(10, bottomY, 200, 50);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(10, bottomY, 200, 50);

    // Health bar
    const healthPercent = player.health / player.maxHealth;
    ctx.fillStyle = '#333333';
    ctx.fillRect(20, bottomY + 10, 180, 20);
    ctx.fillStyle = healthPercent > 0.3 ? COLORS.healthGreen : COLORS.healthRed;
    ctx.fillRect(20, bottomY + 10, 180 * healthPercent, 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(player.health)}/${player.maxHealth}`, 110, bottomY + 25);

    // Credits
    ctx.fillStyle = COLORS.uiBlue;
    ctx.textAlign = 'left';
    ctx.fillText(`CREDITS: ${game.credits}`, 20, bottomY + 45);

    // Weapon display
    ctx.fillStyle = COLORS.uiDarkBlue;
    ctx.fillRect(canvas.width - 210, bottomY, 200, 50);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(canvas.width - 210, bottomY, 200, 50);

    // Weapon icon
    ctx.fillStyle = weapons[player.weapon].color;
    ctx.fillRect(canvas.width - 200, bottomY + 15, 40, 20);

    // Weapon name
    ctx.fillStyle = COLORS.uiBlue;
    ctx.font = '12px Arial';
    ctx.fillText(weapons[player.weapon].name, canvas.width - 150, bottomY + 20);

    // Ammo counter
    ctx.font = '16px Arial';
    const ammoText = player.reloading ? 'RELOADING' :
        `${player.magazine[player.weapon]} | ${player.ammo[player.weapon]}`;
    ctx.fillText(ammoText, canvas.width - 150, bottomY + 42);

    // Keycards
    if (player.keycards.length > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.fillText('KEYCARDS:', 220, bottomY + 15);
        player.keycards.forEach((k, i) => {
            ctx.fillStyle = k === 'blue' ? '#0066ff' : k === 'red' ? '#ff0000' : '#ffdd00';
            ctx.fillRect(220 + i * 20, bottomY + 20, 15, 20);
        });
    }

    // Weapon slots
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    for (let i = 0; i < 4; i++) {
        if (weapons[i].found) {
            ctx.fillStyle = i === player.weapon ? COLORS.uiBlue : '#666666';
            ctx.fillRect(canvas.width/2 - 80 + i * 40, bottomY + 30, 35, 20);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${i + 1}`, canvas.width/2 - 62 + i * 40, bottomY + 44);
        }
    }

    // Motion Tracker (bottom-right corner)
    renderMotionTracker();

    // Damage flash overlay
    if (game.damageFlash > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${game.damageFlash / 30})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        game.damageFlash--;
    }
}

function renderMotionTracker() {
    const trackerX = canvas.width - 90;
    const trackerY = canvas.height - 150;
    const trackerRadius = 50;

    // Background
    ctx.fillStyle = 'rgba(0, 20, 10, 0.9)';
    ctx.beginPath();
    ctx.arc(trackerX, trackerY, trackerRadius + 5, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(trackerX, trackerY, trackerRadius + 5, 0, Math.PI * 2);
    ctx.stroke();

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 100, 50, 0.3)';
    ctx.lineWidth = 1;
    for (let r = 15; r <= trackerRadius; r += 15) {
        ctx.beginPath();
        ctx.arc(trackerX, trackerY, r, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(trackerX - trackerRadius, trackerY);
    ctx.lineTo(trackerX + trackerRadius, trackerY);
    ctx.moveTo(trackerX, trackerY - trackerRadius);
    ctx.lineTo(trackerX, trackerY + trackerRadius);
    ctx.stroke();

    // Sweep line
    const sweepAngle = (Date.now() / 1000) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 100, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trackerX, trackerY);
    ctx.lineTo(
        trackerX + Math.cos(sweepAngle) * trackerRadius,
        trackerY + Math.sin(sweepAngle) * trackerRadius
    );
    ctx.stroke();

    // Player dot (center)
    ctx.fillStyle = COLORS.uiBlue;
    ctx.beginPath();
    ctx.arc(trackerX, trackerY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Enemy dots
    enemies.forEach(e => {
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxRange = 300;

        if (dist < maxRange) {
            const relX = (dx / maxRange) * trackerRadius * 0.8;
            const relY = (dy / maxRange) * trackerRadius * 0.8;

            // Blip intensity based on distance
            const intensity = 1 - (dist / maxRange);
            ctx.fillStyle = `rgba(255, ${50 + intensity * 100}, 0, ${0.5 + intensity * 0.5})`;
            ctx.beginPath();
            ctx.arc(trackerX + relX, trackerY + relY, 3 + intensity * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Label
    ctx.fillStyle = COLORS.uiBlue;
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MOTION', trackerX, trackerY + trackerRadius + 15);
}

function renderDebug() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(canvas.width - 200, 70, 190, 180);
    ctx.strokeStyle = COLORS.uiBlue;
    ctx.strokeRect(canvas.width - 200, 70, 190, 180);

    ctx.fillStyle = COLORS.uiBlue;
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const debugInfo = [
        `DEBUG MODE (Q to toggle)`,
        `-------------------`,
        `Player X: ${Math.round(player.x)}`,
        `Player Y: ${Math.round(player.y)}`,
        `Health: ${Math.ceil(player.health)}`,
        `Ammo: ${player.magazine[player.weapon]}/${player.ammo[player.weapon]}`,
        `Enemy Count: ${enemies.length}`,
        `Level: ${game.level}`,
        `Game State: ${game.state}`,
        `Score: ${game.score}`,
        `FPS: ${Math.round(fps)}`
    ];

    debugInfo.forEach((line, i) => {
        ctx.fillText(line, canvas.width - 190, 90 + i * 15);
    });
}

function renderPaused() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.uiBlue;
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);

    ctx.font = '20px Arial';
    ctx.fillText('Press P or ESC to resume', canvas.width / 2, canvas.height / 2 + 50);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff0000';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = COLORS.uiBlue;
    ctx.font = '24px Arial';
    ctx.fillText(`Level: ${game.level} | Score: ${game.score} | XP: ${game.xp}`, canvas.width / 2, canvas.height / 2 + 20);

    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 60);
}

function renderLevelComplete() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.terminal;
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL COMPLETE', canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = COLORS.uiBlue;
    ctx.font = '24px Arial';
    ctx.fillText(`Credits: +${500 * game.level} | XP: +${1000 * game.level}`, canvas.width / 2, canvas.height / 2 + 20);

    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE for next level', canvas.width / 2, canvas.height / 2 + 60);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffdd00';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = COLORS.uiBlue;
    ctx.font = '24px Arial';
    ctx.fillText('You defeated the Hive Commander!', canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Final Score: ${game.score} | Total XP: ${game.xp}`, canvas.width / 2, canvas.height / 2 + 40);

    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to play again', canvas.width / 2, canvas.height / 2 + 90);
}

// ==================== GAME LOOP ====================
let lastTime = 0;
let fps = 60;

function gameLoop(timestamp) {
    // FPS calculation
    const deltaTime = timestamp - lastTime;
    fps = 1000 / deltaTime;
    lastTime = timestamp;

    update();
    render();

    requestAnimationFrame(gameLoop);
}

// Weapon switching with number keys
document.addEventListener('keydown', e => {
    const num = parseInt(e.key);
    if (num >= 1 && num <= 4 && weapons[num - 1].found) {
        player.weapon = num - 1;
    }
});

// Start game loop
requestAnimationFrame(gameLoop);
