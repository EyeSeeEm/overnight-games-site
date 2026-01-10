// Lost Outpost - Survival Horror Shooter (EXPANDED VERSION)
// Top-down sci-fi shooter inspired by Alien Breed
// 20 Expand Passes + 20 Polish Passes

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Fullscreen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 35;

// Colors - Dark sci-fi palette
const COLORS = {
    FLOOR: '#1a1a1a', FLOOR_HEX: '#1f1f1f', FLOOR_GRATE: '#252525',
    WALL: '#333333', WALL_HIGHLIGHT: '#444444', WALL_SHADOW: '#1a1a1a',
    HAZARD_YELLOW: '#ccaa00', HAZARD_BLACK: '#111111',
    DOOR: '#444455', DOOR_LOCKED: '#553333',
    UI_BG: '#0a1a1a', UI_BORDER: '#0a4a4a', UI_TEXT: '#00cccc', UI_TEXT_DIM: '#006666',
    HEALTH_BG: '#330000', HEALTH: '#cc0000', ARMOR: '#0066cc', AMMO: '#00cc00',
    PLAYER: '#446688', ALIEN: '#44aa44', ALIEN_EYES: '#ff0000',
    BULLET: '#ffff00', PLASMA: '#00ffff', FIRE: '#ff6600', MUZZLE_FLASH: '#ffaa00',
    ACID: '#88ff00', EXPLOSION: '#ff4400', BLOOD: '#448844'
};

// Terrain types (EXPAND: Added more terrain types)
const TERRAIN = {
    FLOOR: 0, WALL: 1, DOOR: 2, TERMINAL: 3, VENT: 4,
    HAZARD_FLOOR: 5, CRATE: 6, BARREL: 7, EXPLOSIVE_BARREL: 8,
    ACID_POOL: 9, CONVEYOR: 10, TELEPORTER: 11, SHOP: 12
};

// EXPAND: Multiple weapon types
const WEAPONS = {
    assault_rifle: { name: 'Assault Rifle', damage: 10, fireRate: 8, spread: 0.05, projectiles: 1, speed: 500, clipSize: 30, reloadTime: 1.5, color: COLORS.BULLET },
    shotgun: { name: 'Shotgun', damage: 8, fireRate: 1.5, spread: 0.3, projectiles: 6, speed: 400, clipSize: 8, reloadTime: 2.0, color: COLORS.BULLET },
    plasma_rifle: { name: 'Plasma Rifle', damage: 25, fireRate: 3, spread: 0.02, projectiles: 1, speed: 600, clipSize: 20, reloadTime: 2.5, color: COLORS.PLASMA },
    smg: { name: 'SMG', damage: 6, fireRate: 15, spread: 0.1, projectiles: 1, speed: 450, clipSize: 45, reloadTime: 1.2, color: COLORS.BULLET },
    flamethrower: { name: 'Flamethrower', damage: 3, fireRate: 30, spread: 0.2, projectiles: 1, speed: 300, clipSize: 100, reloadTime: 3.0, color: COLORS.FIRE, piercing: true }
};

// EXPAND: More enemy types
const ENEMY_TYPES = {
    scorpion: { hp: 30, speed: 60, damage: 15, xp: 50, color: '#44aa44', size: 10 },
    scorpion_small: { hp: 15, speed: 80, damage: 8, xp: 25, color: '#338833', size: 8 },
    arachnid: { hp: 80, speed: 40, damage: 25, xp: 100, color: '#226622', size: 16 },
    facehugger: { hp: 10, speed: 120, damage: 20, xp: 30, color: '#556655', size: 6 },
    spitter: { hp: 40, speed: 50, damage: 0, xp: 75, color: '#448844', size: 12, ranged: true },
    brute: { hp: 150, speed: 30, damage: 40, xp: 150, color: '#225522', size: 20 },
    queen: { hp: 500, speed: 20, damage: 50, xp: 500, color: '#115511', size: 30, boss: true }
};

// Game state
const game = {
    state: 'playing',
    level: 1,
    wave: 1,
    tick: 0,
    camera: { x: 0, y: 0, zoom: 1, targetZoom: 1 },
    screenShake: 0,
    screenFlash: 0,
    combo: 0,
    comboTimer: 0,
    killCount: 0,
    objectiveMarkers: [],
    ambientFlicker: 0
};

// Player (EXPAND: More stats)
const player = {
    x: 400, y: 380,
    width: 20, height: 20,
    speed: 120, baseSpeed: 120,
    angle: 0,
    hp: 100, maxHp: 100,
    armor: 0, maxArmor: 50,
    lives: 3,
    credits: 0,
    rank: 1, xp: 0, xpToNext: 1000,
    currentWeapon: 'assault_rifle',
    weapons: {
        assault_rifle: { ammo: 90, clip: 30 }
    },
    cooldown: 0,
    reloading: false, reloadTime: 0,
    flashlightOn: true,
    invincible: 0,
    speedBoost: 0,
    damageBoost: 0,
    recoil: 0
};

// Arrays
let map = [];
let enemies = [];
let bullets = [];
let items = [];
let particles = [];
let decals = [];  // POLISH: Persistent blood decals
let floatingTexts = [];  // POLISH: Damage numbers
let teleporters = [];

// Input
const keys = {};
let mouseX = 320, mouseY = 240;
let mouseDown = false;

document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    // EXPAND: Weapon switching
    if (e.key >= '1' && e.key <= '5') {
        const weaponKeys = Object.keys(player.weapons);
        const idx = parseInt(e.key) - 1;
        if (idx < weaponKeys.length) {
            player.currentWeapon = weaponKeys[idx];
            player.reloading = false;
        }
    }
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', e => { if (e.button === 0) mouseDown = true; });
canvas.addEventListener('mouseup', e => { if (e.button === 0) mouseDown = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Generate level (EXPAND: Larger, more complex maps)
function generateLevel() {
    map = [];
    teleporters = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x] = { terrain: TERRAIN.FLOOR, variant: (x + y) % 2 };
        }
    }

    // Border walls
    for (let x = 0; x < MAP_WIDTH; x++) {
        map[0][x] = { terrain: TERRAIN.WALL, variant: 0 };
        map[MAP_HEIGHT - 1][x] = { terrain: TERRAIN.WALL, variant: 0 };
    }
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y][0] = { terrain: TERRAIN.WALL, variant: 0 };
        map[y][MAP_WIDTH - 1] = { terrain: TERRAIN.WALL, variant: 0 };
    }

    // Main corridors
    const corridors = [
        { x1: 1, y1: 15, x2: MAP_WIDTH - 2, y2: 19 },
        { x1: 10, y1: 1, x2: 14, y2: MAP_HEIGHT - 2 },
        { x1: 25, y1: 1, x2: 29, y2: MAP_HEIGHT - 2 }
    ];

    for (const c of corridors) {
        for (let y = c.y1; y <= c.y2; y++) {
            for (let x = c.x1; x <= c.x2; x++) {
                if (map[y] && map[y][x]) {
                    map[y][x] = { terrain: TERRAIN.FLOOR, variant: (x + y) % 2 };
                }
            }
        }
    }

    // Rooms
    const rooms = [
        { x: 2, y: 2, w: 7, h: 7 },
        { x: 31, y: 2, w: 7, h: 7 },
        { x: 2, y: 26, w: 7, h: 7 },
        { x: 31, y: 26, w: 7, h: 7 },
        { x: 16, y: 2, w: 8, h: 6 },
        { x: 16, y: 27, w: 8, h: 6 },
        { x: 16, y: 12, w: 8, h: 10 }  // Central hub
    ];

    for (const room of rooms) {
        for (let dy = 0; dy < room.h; dy++) {
            for (let dx = 0; dx < room.w; dx++) {
                const y = room.y + dy;
                const x = room.x + dx;
                if (map[y] && map[y][x]) {
                    map[y][x] = { terrain: TERRAIN.FLOOR, variant: (x + y) % 2 };
                }
            }
        }
    }

    // Hazard floor stripes
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
        if (x % 5 < 2) {
            if (map[15]) map[15][x] = { terrain: TERRAIN.HAZARD_FLOOR, variant: 0 };
            if (map[19]) map[19][x] = { terrain: TERRAIN.HAZARD_FLOOR, variant: 0 };
        }
    }

    // EXPAND: Add acid pools
    const acidPositions = [
        { x: 4, y: 5 }, { x: 34, y: 5 }, { x: 4, y: 29 }, { x: 34, y: 29 }
    ];
    for (const pos of acidPositions) {
        if (map[pos.y] && map[pos.y][pos.x]) {
            map[pos.y][pos.x] = { terrain: TERRAIN.ACID_POOL, variant: 0 };
        }
    }

    // EXPAND: Add explosive barrels
    const barrelPositions = [
        { x: 18, y: 4 }, { x: 22, y: 4 }, { x: 18, y: 30 }, { x: 22, y: 30 },
        { x: 5, y: 17 }, { x: 34, y: 17 }
    ];
    for (const pos of barrelPositions) {
        if (map[pos.y] && map[pos.y][pos.x]) {
            map[pos.y][pos.x] = { terrain: TERRAIN.EXPLOSIVE_BARREL, variant: 0 };
        }
    }

    // EXPAND: Add teleporters
    teleporters = [
        { x: 5, y: 5, targetX: 34, targetY: 29 },
        { x: 34, y: 5, targetX: 5, targetY: 29 },
        { x: 5, y: 29, targetX: 34, targetY: 5 },
        { x: 34, y: 29, targetX: 5, targetY: 5 }
    ];
    for (const tp of teleporters) {
        if (map[tp.y] && map[tp.y][tp.x]) {
            map[tp.y][tp.x] = { terrain: TERRAIN.TELEPORTER, variant: 0 };
        }
    }

    // EXPAND: Add shop terminal
    map[17][20] = { terrain: TERRAIN.SHOP, variant: 0 };

    // Add doors
    map[17][9] = { terrain: TERRAIN.DOOR, variant: 1, locked: false };
    map[17][30] = { terrain: TERRAIN.DOOR, variant: 1, locked: true };
    map[8][12] = { terrain: TERRAIN.DOOR, variant: 0, locked: false };
    map[26][12] = { terrain: TERRAIN.DOOR, variant: 0, locked: false };

    // Add vents
    const ventPositions = [
        { x: 3, y: 3 }, { x: 36, y: 3 }, { x: 3, y: 31 }, { x: 36, y: 31 },
        { x: 20, y: 3 }, { x: 20, y: 31 }
    ];
    for (const pos of ventPositions) {
        if (map[pos.y] && map[pos.y][pos.x]) {
            map[pos.y][pos.x] = { terrain: TERRAIN.VENT, variant: 0 };
        }
    }

    // Crates
    const cratePositions = [
        { x: 6, y: 4 }, { x: 33, y: 4 }, { x: 6, y: 28 }, { x: 33, y: 28 },
        { x: 12, y: 17 }, { x: 27, y: 17 }
    ];
    for (const pos of cratePositions) {
        if (map[pos.y] && map[pos.y][pos.x]) {
            map[pos.y][pos.x] = { terrain: TERRAIN.CRATE, variant: 0 };
        }
    }

    // Spawn enemies based on wave
    spawnWave();

    // Spawn items
    items = [];
    items.push({ x: 150, y: 150, type: 'ammo', amount: 30 });
    items.push({ x: 600, y: 150, type: 'health', amount: 25 });
    items.push({ x: 150, y: 600, type: 'credits', amount: 500 });
    items.push({ x: 600, y: 600, type: 'armor', amount: 20 });
    items.push({ x: 400, y: 300, type: 'keycard', color: 'yellow' });
    // EXPAND: Weapon pickups
    items.push({ x: 550, y: 170, type: 'weapon', weapon: 'shotgun' });
    items.push({ x: 700, y: 550, type: 'weapon', weapon: 'plasma_rifle' });
    // EXPAND: Power-ups
    items.push({ x: 300, y: 500, type: 'speedboost' });
    items.push({ x: 500, y: 200, type: 'damageboost' });

    bullets = [];
    particles = [];
    decals = [];
    floatingTexts = [];

    player.x = 640;
    player.y = 544;
}

// EXPAND: Wave spawning system
function spawnWave() {
    enemies = [];
    const waveConfig = getWaveConfig(game.wave);

    for (const spawn of waveConfig) {
        for (let i = 0; i < spawn.count; i++) {
            const spawnPoints = [
                { x: 4, y: 4 }, { x: 35, y: 4 }, { x: 4, y: 30 }, { x: 35, y: 30 },
                { x: 20, y: 4 }, { x: 20, y: 30 }
            ];
            const sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            const stats = ENEMY_TYPES[spawn.type];

            enemies.push({
                x: sp.x * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 50,
                y: sp.y * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 50,
                type: spawn.type,
                hp: stats.hp,
                maxHp: stats.hp,
                speed: stats.speed,
                damage: stats.damage,
                xp: stats.xp,
                color: stats.color,
                size: stats.size,
                state: 'patrol',
                attackCooldown: 0,
                angle: Math.random() * Math.PI * 2,
                ranged: stats.ranged || false,
                boss: stats.boss || false,
                hitFlash: 0  // POLISH: Hit flash
            });

            // POLISH: Spawn particles from vents
            for (let j = 0; j < 10; j++) {
                particles.push({
                    x: sp.x * TILE_SIZE + TILE_SIZE / 2,
                    y: sp.y * TILE_SIZE + TILE_SIZE / 2,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    type: 'spawn',
                    life: 0.5
                });
            }
        }
    }
}

function getWaveConfig(wave) {
    const configs = [
        [{ type: 'scorpion', count: 3 }],
        [{ type: 'scorpion', count: 4 }, { type: 'scorpion_small', count: 2 }],
        [{ type: 'scorpion', count: 3 }, { type: 'facehugger', count: 4 }],
        [{ type: 'arachnid', count: 2 }, { type: 'scorpion', count: 3 }],
        [{ type: 'spitter', count: 2 }, { type: 'scorpion', count: 4 }],
        [{ type: 'brute', count: 1 }, { type: 'scorpion', count: 5 }],
        [{ type: 'scorpion', count: 6 }, { type: 'facehugger', count: 6 }],
        [{ type: 'arachnid', count: 3 }, { type: 'spitter', count: 2 }],
        [{ type: 'brute', count: 2 }, { type: 'arachnid', count: 2 }],
        [{ type: 'queen', count: 1 }, { type: 'scorpion', count: 4 }]  // BOSS WAVE
    ];
    return configs[Math.min(wave - 1, configs.length - 1)];
}

// Update functions
function update(dt) {
    if (game.state !== 'playing') return;

    game.tick++;
    game.ambientFlicker = Math.sin(game.tick * 0.1) * 0.05;  // POLISH: Ambient flicker

    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    updateFloatingTexts(dt);

    // EXPAND: Combo system
    if (game.comboTimer > 0) {
        game.comboTimer -= dt;
        if (game.comboTimer <= 0) {
            game.combo = 0;
        }
    }

    // Screen effects decay
    if (game.screenShake > 0) game.screenShake *= 0.9;
    if (game.screenFlash > 0) game.screenFlash -= dt * 5;
    if (player.recoil > 0) player.recoil *= 0.8;  // POLISH: Recoil decay

    // Camera zoom lerp
    game.camera.zoom += (game.camera.targetZoom - game.camera.zoom) * 0.1;

    // EXPAND: Check wave completion
    if (enemies.length === 0 && game.state === 'playing') {
        game.wave++;
        if (game.wave > 10) {
            game.state = 'victory';
        } else {
            spawnWave();
            // POLISH: Wave announcement
            floatingTexts.push({
                x: player.x, y: player.y - 50,
                text: `WAVE ${game.wave}`,
                color: '#00ffff',
                size: 24,
                life: 2
            });
        }
    }

    // Check lose condition
    if (player.hp <= 0) {
        player.lives--;
        if (player.lives <= 0) {
            game.state = 'gameover';
        } else {
            player.hp = player.maxHp;
            player.x = 640;
            player.y = 544;
            player.invincible = 2;
            game.screenFlash = 1;
        }
    }
}

function updatePlayer(dt) {
    let dx = 0, dy = 0;

    if (keys['w'] || keys['arrowup']) dy = -1;
    if (keys['s'] || keys['arrowdown']) dy = 1;
    if (keys['a'] || keys['arrowleft']) dx = -1;
    if (keys['d'] || keys['arrowright']) dx = 1;

    // EXPAND: Speed boost effect
    const speed = player.baseSpeed * (player.speedBoost > 0 ? 1.5 : 1);
    if (player.speedBoost > 0) player.speedBoost -= dt;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len; dy /= len;

        const newX = player.x + dx * speed * dt;
        const newY = player.y + dy * speed * dt;

        if (canMove(newX, player.y, player.width, player.height)) player.x = newX;
        if (canMove(player.x, newY, player.width, player.height)) player.y = newY;

        // POLISH: Footstep particles
        if (game.tick % 10 === 0) {
            particles.push({
                x: player.x,
                y: player.y + 10,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                type: 'dust',
                life: 0.3
            });
        }
    }

    // Aim at mouse
    player.angle = Math.atan2(mouseY - canvas.height / 2, mouseX - canvas.width / 2);

    // Check tile interactions
    const tileX = Math.floor(player.x / TILE_SIZE);
    const tileY = Math.floor(player.y / TILE_SIZE);
    const tile = map[tileY]?.[tileX];

    // EXPAND: Acid damage
    if (tile?.terrain === TERRAIN.ACID_POOL && player.invincible <= 0) {
        player.hp -= 10 * dt;
        if (game.tick % 5 === 0) {
            particles.push({
                x: player.x, y: player.y,
                vx: (Math.random() - 0.5) * 50,
                vy: -Math.random() * 50,
                type: 'acid',
                life: 0.3
            });
        }
    }

    // EXPAND: Teleporter
    if (tile?.terrain === TERRAIN.TELEPORTER) {
        for (const tp of teleporters) {
            if (Math.floor(tp.x) === tileX && Math.floor(tp.y) === tileY) {
                player.x = tp.targetX * TILE_SIZE + TILE_SIZE / 2;
                player.y = tp.targetY * TILE_SIZE + TILE_SIZE / 2;
                game.screenFlash = 0.5;
                // Teleport particles
                for (let i = 0; i < 20; i++) {
                    particles.push({
                        x: player.x, y: player.y,
                        vx: (Math.random() - 0.5) * 200,
                        vy: (Math.random() - 0.5) * 200,
                        type: 'teleport',
                        life: 0.5
                    });
                }
                break;
            }
        }
    }

    // Shooting
    const weapon = WEAPONS[player.currentWeapon];
    const weaponData = player.weapons[player.currentWeapon];

    if (mouseDown && player.cooldown <= 0 && !player.reloading) {
        if (weaponData && weaponData.clip > 0) {
            shoot();
            player.cooldown = 1 / weapon.fireRate;
            weaponData.clip--;
            player.recoil = 5;  // POLISH: Recoil

            if (weaponData.clip === 0 && weaponData.ammo > 0) {
                startReload();
            }
        } else if (weaponData && weaponData.ammo > 0) {
            startReload();
        }
    }

    if (player.cooldown > 0) player.cooldown -= dt;

    // Reload
    if (keys['r'] && !player.reloading && weaponData) {
        if (weaponData.clip < weapon.clipSize && weaponData.ammo > 0) {
            startReload();
        }
    }

    if (player.reloading) {
        player.reloadTime -= dt;
        if (player.reloadTime <= 0) {
            const needed = weapon.clipSize - weaponData.clip;
            const reload = Math.min(needed, weaponData.ammo);
            weaponData.clip += reload;
            weaponData.ammo -= reload;
            player.reloading = false;
        }
    }

    // EXPAND: Damage boost decay
    if (player.damageBoost > 0) player.damageBoost -= dt;

    // Interact with items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dist = distance(player.x, player.y, item.x, item.y);
        if (dist < 24) {
            pickupItem(item);
            items.splice(i, 1);
        }
    }

    if (player.invincible > 0) player.invincible -= dt;

    // Update camera
    game.camera.x = player.x - canvas.width / 2;
    game.camera.y = player.y - canvas.height / 2;
    game.camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - canvas.width, game.camera.x));
    game.camera.y = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - canvas.height, game.camera.y));
}

function startReload() {
    const weapon = WEAPONS[player.currentWeapon];
    player.reloading = true;
    player.reloadTime = weapon.reloadTime;
}

function shoot() {
    const weapon = WEAPONS[player.currentWeapon];
    const damageMultiplier = player.damageBoost > 0 ? 2 : 1;

    for (let i = 0; i < weapon.projectiles; i++) {
        const spread = weapon.spread;
        const angle = player.angle + (Math.random() - 0.5) * spread;

        bullets.push({
            x: player.x + Math.cos(player.angle) * 15,
            y: player.y + Math.sin(player.angle) * 15,
            vx: Math.cos(angle) * weapon.speed,
            vy: Math.sin(angle) * weapon.speed,
            damage: weapon.damage * damageMultiplier,
            owner: 'player',
            life: 2,
            color: weapon.color,
            piercing: weapon.piercing || false
        });
    }

    // Muzzle flash
    particles.push({
        x: player.x + Math.cos(player.angle) * 20,
        y: player.y + Math.sin(player.angle) * 20,
        type: 'muzzle',
        life: 0.1,
        size: weapon.projectiles > 1 ? 12 : 8
    });

    // POLISH: Shell casing
    if (!weapon.piercing) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(player.angle + Math.PI / 2) * 50 + (Math.random() - 0.5) * 20,
            vy: Math.sin(player.angle + Math.PI / 2) * 50 - 30,
            type: 'shell',
            life: 0.5
        });
    }

    game.screenShake = Math.max(game.screenShake, weapon.projectiles > 1 ? 4 : 2);
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        const dist = distance(player.x, player.y, enemy.x, enemy.y);

        // POLISH: Hit flash decay
        if (enemy.hitFlash > 0) enemy.hitFlash -= dt * 5;

        if (enemy.state === 'patrol') {
            enemy.x += Math.cos(enemy.angle) * enemy.speed * 0.3 * dt;
            enemy.y += Math.sin(enemy.angle) * enemy.speed * 0.3 * dt;

            if (Math.random() < 0.01) {
                enemy.angle += (Math.random() - 0.5) * Math.PI;
            }

            if (dist < (enemy.boss ? 300 : 150)) {
                enemy.state = 'chase';
                // POLISH: Detection visual
                particles.push({
                    x: enemy.x, y: enemy.y - 20,
                    type: 'alert',
                    life: 0.5
                });
            }
        } else if (enemy.state === 'chase') {
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            enemy.angle = angle;

            // EXPAND: Ranged enemies
            if (enemy.ranged && dist > 100 && dist < 250 && enemy.attackCooldown <= 0) {
                // Spit acid
                bullets.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angle) * 200,
                    vy: Math.sin(angle) * 200,
                    damage: 15,
                    owner: 'enemy',
                    life: 2,
                    color: COLORS.ACID
                });
                enemy.attackCooldown = 2;
            } else if (!enemy.ranged || dist < 100) {
                const newX = enemy.x + Math.cos(angle) * enemy.speed * dt;
                const newY = enemy.y + Math.sin(angle) * enemy.speed * dt;

                if (canMove(newX, enemy.y, enemy.size * 2, enemy.size * 2)) enemy.x = newX;
                if (canMove(enemy.x, newY, enemy.size * 2, enemy.size * 2)) enemy.y = newY;
            }

            // Melee attack
            if (dist < enemy.size + 15 && enemy.attackCooldown <= 0 && player.invincible <= 0 && !enemy.ranged) {
                // EXPAND: Armor system
                let damage = enemy.damage;
                if (player.armor > 0) {
                    const armorAbsorb = Math.min(player.armor, damage * 0.5);
                    player.armor -= armorAbsorb;
                    damage -= armorAbsorb;
                }
                player.hp -= damage;
                enemy.attackCooldown = 1;
                game.screenShake = 8;
                game.screenFlash = 0.3;

                // Blood particles
                for (let i = 0; i < 8; i++) {
                    particles.push({
                        x: player.x,
                        y: player.y,
                        vx: (Math.random() - 0.5) * 150,
                        vy: (Math.random() - 0.5) * 150,
                        type: 'blood',
                        life: 0.5
                    });
                }
            }

            if (dist > (enemy.boss ? 500 : 300)) {
                enemy.state = 'patrol';
            }
        }

        if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;

        // Keep in bounds
        const tileX = Math.floor(enemy.x / TILE_SIZE);
        const tileY = Math.floor(enemy.y / TILE_SIZE);
        if (tileX < 1 || tileX >= MAP_WIDTH - 1 || tileY < 1 || tileY >= MAP_HEIGHT - 1) {
            enemy.angle += Math.PI;
        }
    }
}

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.life -= dt;

        // POLISH: Smoke trail for fire bullets
        if (bullet.color === COLORS.FIRE && game.tick % 2 === 0) {
            particles.push({
                x: bullet.x,
                y: bullet.y,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                type: 'smoke',
                life: 0.3
            });
        }

        const tileX = Math.floor(bullet.x / TILE_SIZE);
        const tileY = Math.floor(bullet.y / TILE_SIZE);
        if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
            bullets.splice(i, 1);
            continue;
        }

        const tile = map[tileY]?.[tileX];

        // EXPAND: Explosive barrels
        if (tile?.terrain === TERRAIN.EXPLOSIVE_BARREL) {
            explodeBarrel(tileX, tileY);
            bullets.splice(i, 1);
            continue;
        }

        if (tile && (tile.terrain === TERRAIN.WALL || tile.terrain === TERRAIN.CRATE)) {
            particles.push({ x: bullet.x, y: bullet.y, type: 'spark', life: 0.2 });
            bullets.splice(i, 1);
            continue;
        }

        // Player bullet hitting enemy
        if (bullet.owner === 'player') {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                if (distance(bullet.x, bullet.y, enemy.x, enemy.y) < enemy.size + 5) {
                    enemy.hp -= bullet.damage;
                    enemy.state = 'chase';
                    enemy.hitFlash = 1;  // POLISH: Hit flash

                    // POLISH: Damage numbers
                    floatingTexts.push({
                        x: enemy.x + (Math.random() - 0.5) * 20,
                        y: enemy.y - 20,
                        text: Math.floor(bullet.damage).toString(),
                        color: '#ffff00',
                        size: bullet.damage > 20 ? 16 : 12,
                        life: 0.8,
                        vy: -50
                    });

                    // Alien blood
                    for (let k = 0; k < 4; k++) {
                        particles.push({
                            x: enemy.x, y: enemy.y,
                            vx: (Math.random() - 0.5) * 100,
                            vy: (Math.random() - 0.5) * 100,
                            type: 'alienblood',
                            life: 0.4
                        });
                    }

                    // POLISH: Blood decal
                    decals.push({
                        x: enemy.x + (Math.random() - 0.5) * 10,
                        y: enemy.y + (Math.random() - 0.5) * 10,
                        size: 5 + Math.random() * 5,
                        color: COLORS.BLOOD,
                        alpha: 0.6
                    });

                    if (enemy.hp <= 0) {
                        // EXPAND: Combo system
                        game.combo++;
                        game.comboTimer = 3;
                        const xpGain = enemy.xp * (1 + game.combo * 0.1);
                        player.xp += xpGain;
                        player.credits += Math.floor(Math.random() * 50) + 10;
                        game.killCount++;

                        // POLISH: Rank up effect
                        if (player.xp >= player.xpToNext) {
                            player.rank++;
                            player.xp -= player.xpToNext;
                            player.xpToNext = Math.floor(player.xpToNext * 1.5);
                            game.screenFlash = 0.5;
                            floatingTexts.push({
                                x: player.x, y: player.y - 40,
                                text: 'RANK UP!',
                                color: '#00ffff',
                                size: 20,
                                life: 1.5
                            });
                        }

                        // POLISH: Death explosion
                        for (let k = 0; k < (enemy.boss ? 30 : 10); k++) {
                            particles.push({
                                x: enemy.x, y: enemy.y,
                                vx: (Math.random() - 0.5) * 200,
                                vy: (Math.random() - 0.5) * 200,
                                type: enemy.boss ? 'explosion' : 'alienblood',
                                life: enemy.boss ? 0.8 : 0.5
                            });
                        }

                        // POLISH: Camera zoom on boss kill
                        if (enemy.boss) {
                            game.camera.targetZoom = 1.2;
                            setTimeout(() => game.camera.targetZoom = 1, 500);
                        }

                        // Item drop
                        if (Math.random() < 0.3) {
                            items.push({
                                x: enemy.x, y: enemy.y,
                                type: Math.random() < 0.5 ? 'ammo' : 'health',
                                amount: Math.random() < 0.5 ? 15 : 10
                            });
                        }

                        enemies.splice(j, 1);
                    }

                    if (!bullet.piercing) {
                        bullets.splice(i, 1);
                    }
                    break;
                }
            }
        }

        // Enemy bullet hitting player
        if (bullet.owner === 'enemy') {
            if (distance(bullet.x, bullet.y, player.x, player.y) < 15 && player.invincible <= 0) {
                let damage = bullet.damage;
                if (player.armor > 0) {
                    const armorAbsorb = Math.min(player.armor, damage * 0.5);
                    player.armor -= armorAbsorb;
                    damage -= armorAbsorb;
                }
                player.hp -= damage;
                game.screenShake = 5;
                game.screenFlash = 0.3;
                bullets.splice(i, 1);
                continue;
            }
        }

        if (bullet.life <= 0) {
            bullets.splice(i, 1);
        }
    }
}

// EXPAND: Explosive barrel function
function explodeBarrel(tileX, tileY) {
    const cx = tileX * TILE_SIZE + TILE_SIZE / 2;
    const cy = tileY * TILE_SIZE + TILE_SIZE / 2;

    map[tileY][tileX] = { terrain: TERRAIN.FLOOR, variant: 0 };

    // Explosion particles
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: cx, y: cy,
            vx: (Math.random() - 0.5) * 300,
            vy: (Math.random() - 0.5) * 300,
            type: 'explosion',
            life: 0.6
        });
    }

    game.screenShake = 15;
    game.camera.targetZoom = 1.1;
    setTimeout(() => game.camera.targetZoom = 1, 300);

    // Damage nearby enemies
    for (const enemy of enemies) {
        const dist = distance(cx, cy, enemy.x, enemy.y);
        if (dist < 100) {
            enemy.hp -= 50 * (1 - dist / 100);
            enemy.hitFlash = 1;
        }
    }

    // Damage player
    const playerDist = distance(cx, cy, player.x, player.y);
    if (playerDist < 100 && player.invincible <= 0) {
        player.hp -= 30 * (1 - playerDist / 100);
        game.screenFlash = 0.5;
    }

    // Chain reaction
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = tileX + dx;
            const ny = tileY + dy;
            if (map[ny]?.[nx]?.terrain === TERRAIN.EXPLOSIVE_BARREL) {
                setTimeout(() => explodeBarrel(nx, ny), 100);
            }
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;

        if (p.vx !== undefined) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.95;
            p.vy *= 0.95;
            if (p.type === 'shell') p.vy += 200 * dt;  // Gravity for shells
        }

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Limit decals
    if (decals.length > 100) {
        decals.splice(0, 10);
    }
}

// POLISH: Floating text update
function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.life -= dt;
        if (ft.vy) ft.y += ft.vy * dt;

        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function pickupItem(item) {
    const weapon = WEAPONS[player.currentWeapon];
    const weaponData = player.weapons[player.currentWeapon];

    // POLISH: Pickup glow
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: item.x, y: item.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            type: 'pickup',
            life: 0.3
        });
    }

    switch (item.type) {
        case 'ammo':
            if (weaponData) weaponData.ammo = Math.min(300, weaponData.ammo + item.amount);
            break;
        case 'health':
            player.hp = Math.min(player.maxHp, player.hp + item.amount);
            break;
        case 'armor':
            player.armor = Math.min(player.maxArmor, player.armor + item.amount);
            break;
        case 'credits':
            player.credits += item.amount;
            break;
        case 'keycard':
            for (let y = 0; y < MAP_HEIGHT; y++) {
                for (let x = 0; x < MAP_WIDTH; x++) {
                    if (map[y][x].terrain === TERRAIN.DOOR && map[y][x].locked) {
                        map[y][x].locked = false;
                    }
                }
            }
            floatingTexts.push({
                x: player.x, y: player.y - 30,
                text: 'DOORS UNLOCKED',
                color: '#ffff00',
                size: 14,
                life: 1.5
            });
            break;
        case 'weapon':
            if (!player.weapons[item.weapon]) {
                player.weapons[item.weapon] = {
                    ammo: WEAPONS[item.weapon].clipSize * 3,
                    clip: WEAPONS[item.weapon].clipSize
                };
                floatingTexts.push({
                    x: player.x, y: player.y - 30,
                    text: `GOT ${WEAPONS[item.weapon].name.toUpperCase()}`,
                    color: '#00ff00',
                    size: 14,
                    life: 1.5
                });
            }
            break;
        case 'speedboost':
            player.speedBoost = 10;
            floatingTexts.push({
                x: player.x, y: player.y - 30,
                text: 'SPEED BOOST!',
                color: '#00ffff',
                size: 14,
                life: 1
            });
            break;
        case 'damageboost':
            player.damageBoost = 10;
            floatingTexts.push({
                x: player.x, y: player.y - 30,
                text: 'DAMAGE BOOST!',
                color: '#ff0000',
                size: 14,
                life: 1
            });
            break;
    }
}

function canMove(x, y, w, h) {
    const margin = 2;
    const tiles = [
        { x: Math.floor((x - w / 2 + margin) / TILE_SIZE), y: Math.floor((y - h / 2 + margin) / TILE_SIZE) },
        { x: Math.floor((x + w / 2 - margin) / TILE_SIZE), y: Math.floor((y - h / 2 + margin) / TILE_SIZE) },
        { x: Math.floor((x - w / 2 + margin) / TILE_SIZE), y: Math.floor((y + h / 2 - margin) / TILE_SIZE) },
        { x: Math.floor((x + w / 2 - margin) / TILE_SIZE), y: Math.floor((y + h / 2 - margin) / TILE_SIZE) }
    ];

    for (const tile of tiles) {
        if (tile.x < 0 || tile.x >= MAP_WIDTH || tile.y < 0 || tile.y >= MAP_HEIGHT) return false;
        const t = map[tile.y][tile.x];
        if (t.terrain === TERRAIN.WALL || t.terrain === TERRAIN.CRATE ||
            t.terrain === TERRAIN.EXPLOSIVE_BARREL || (t.terrain === TERRAIN.DOOR && t.locked)) {
            return false;
        }
    }
    return true;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// DRAWING FUNCTIONS
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Screen shake
    if (game.screenShake > 0.1) {
        ctx.translate(
            (Math.random() - 0.5) * game.screenShake,
            (Math.random() - 0.5) * game.screenShake
        );
    }

    // Camera zoom
    if (game.camera.zoom !== 1) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(game.camera.zoom, game.camera.zoom);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    ctx.translate(-game.camera.x, -game.camera.y);

    drawMap();
    drawDecals();
    drawItems();
    drawBullets();
    drawEnemies();
    drawPlayer();
    drawParticles();
    drawFlashlight();

    ctx.restore();

    // POLISH: Screen flash
    if (game.screenFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${game.screenFlash * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawUI();
    drawFloatingTexts();
    drawMinimap();

    if (game.state === 'gameover') drawGameOver();
    if (game.state === 'victory') drawVictory();
}

function drawMap() {
    const startX = Math.floor(game.camera.x / TILE_SIZE);
    const startY = Math.floor(game.camera.y / TILE_SIZE);
    const endX = Math.min(MAP_WIDTH, startX + Math.ceil(canvas.width / TILE_SIZE) + 2);
    const endY = Math.min(MAP_HEIGHT, startY + Math.ceil(canvas.height / TILE_SIZE) + 2);

    for (let y = Math.max(0, startY); y < endY; y++) {
        for (let x = Math.max(0, startX); x < endX; x++) {
            const tile = map[y][x];
            const screenX = x * TILE_SIZE;
            const screenY = y * TILE_SIZE;
            drawTile(tile, screenX, screenY, x, y);
        }
    }
}

function drawTile(tile, screenX, screenY, tileX, tileY) {
    // POLISH: Ambient flicker on some tiles
    const flicker = 1 + game.ambientFlicker * ((tileX + tileY) % 3 === 0 ? 1 : 0);

    switch (tile.terrain) {
        case TERRAIN.FLOOR:
            ctx.fillStyle = tile.variant === 0 ? COLORS.FLOOR : COLORS.FLOOR_HEX;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.FLOOR_GRATE;
            ctx.fillRect(screenX + 4, screenY + 4, 8, 1);
            ctx.fillRect(screenX + 20, screenY + 20, 8, 1);
            break;

        case TERRAIN.HAZARD_FLOOR:
            ctx.fillStyle = COLORS.FLOOR;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            for (let i = 0; i < 8; i++) {
                ctx.fillStyle = COLORS.HAZARD_YELLOW;
                ctx.fillRect(screenX + i * 8, screenY + 2, 4, TILE_SIZE - 4);
                ctx.fillStyle = COLORS.HAZARD_BLACK;
                ctx.fillRect(screenX + i * 8 + 4, screenY + 2, 4, TILE_SIZE - 4);
            }
            break;

        case TERRAIN.WALL:
            ctx.fillStyle = COLORS.WALL;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.WALL_HIGHLIGHT;
            ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, 2);
            ctx.fillRect(screenX + 2, screenY + 2, 2, TILE_SIZE - 4);
            ctx.fillStyle = COLORS.WALL_SHADOW;
            ctx.fillRect(screenX + 2, screenY + TILE_SIZE - 4, TILE_SIZE - 4, 2);
            ctx.fillRect(screenX + TILE_SIZE - 4, screenY + 2, 2, TILE_SIZE - 4);
            if ((tileX + tileY) % 3 === 0) {
                ctx.fillStyle = COLORS.FLOOR_GRATE;
                ctx.fillRect(screenX + 8, screenY + 12, 16, 8);
            }
            break;

        case TERRAIN.DOOR:
            ctx.fillStyle = COLORS.FLOOR;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = tile.locked ? COLORS.DOOR_LOCKED : COLORS.DOOR;
            if (tile.variant === 0) {
                ctx.fillRect(screenX, screenY + 10, TILE_SIZE, 12);
            } else {
                ctx.fillRect(screenX + 10, screenY, 12, TILE_SIZE);
            }
            ctx.fillStyle = tile.locked ? '#ff0000' : '#00ff00';
            ctx.fillRect(screenX + 14, screenY + 14, 4, 4);
            break;

        case TERRAIN.VENT:
            ctx.fillStyle = COLORS.FLOOR;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            ctx.fillStyle = '#333';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(screenX + 6 + i * 6, screenY + 4, 2, TILE_SIZE - 8);
            }
            break;

        case TERRAIN.TERMINAL:
            ctx.fillStyle = COLORS.FLOOR;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#333340';
            ctx.fillRect(screenX + 4, screenY + 8, TILE_SIZE - 8, TILE_SIZE - 12);
            ctx.fillStyle = '#003344';
            ctx.fillRect(screenX + 6, screenY + 10, TILE_SIZE - 12, 12);
            ctx.fillStyle = `rgba(0, 204, 204, ${0.8 + game.ambientFlicker})`;
            ctx.fillRect(screenX + 8, screenY + 12, TILE_SIZE - 16, 2);
            ctx.fillRect(screenX + 8, screenY + 16, TILE_SIZE - 16, 2);
            break;

        case TERRAIN.CRATE:
            ctx.fillStyle = COLORS.FLOOR;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#5a4a30';
            ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.fillStyle = '#4a3a20';
            ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, 2);
            ctx.fillRect(screenX + 4, screenY + TILE_SIZE - 8, TILE_SIZE - 8, 2);
            break;

        case TERRAIN.EXPLOSIVE_BARREL:
            ctx.fillStyle = COLORS.FLOOR;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#cc3333';
            ctx.beginPath();
            ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = COLORS.HAZARD_YELLOW;
            ctx.fillRect(screenX + 10, screenY + 10, 12, 12);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('!', screenX + 14, screenY + 20);
            break;

        case TERRAIN.ACID_POOL:
            ctx.fillStyle = COLORS.FLOOR;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = `rgba(136, 255, 0, ${0.7 + Math.sin(game.tick * 0.1) * 0.2})`;
            ctx.beginPath();
            ctx.ellipse(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 14, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            // Bubbles
            ctx.fillStyle = '#aaffaa';
            ctx.beginPath();
            ctx.arc(screenX + 10 + Math.sin(game.tick * 0.05) * 3, screenY + 12, 2, 0, Math.PI * 2);
            ctx.arc(screenX + 22 + Math.cos(game.tick * 0.07) * 3, screenY + 18, 2, 0, Math.PI * 2);
            ctx.fill();
            break;

        case TERRAIN.TELEPORTER:
            ctx.fillStyle = COLORS.FLOOR;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = `rgba(0, 255, 255, ${0.3 + Math.sin(game.tick * 0.1) * 0.2})`;
            ctx.beginPath();
            ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 10, game.tick * 0.05, game.tick * 0.05 + Math.PI);
            ctx.stroke();
            break;

        case TERRAIN.SHOP:
            ctx.fillStyle = COLORS.FLOOR;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#444466';
            ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            ctx.fillStyle = '#00cc00';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('$', screenX + 12, screenY + 22);
            break;
    }
}

function drawDecals() {
    for (const decal of decals) {
        ctx.globalAlpha = decal.alpha;
        ctx.fillStyle = decal.color;
        ctx.beginPath();
        ctx.arc(decal.x, decal.y, decal.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawItems() {
    for (const item of items) {
        const pulse = Math.sin(game.tick * 0.1) * 0.3 + 0.7;

        switch (item.type) {
            case 'ammo':
                ctx.fillStyle = `rgba(0, 200, 0, ${pulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(item.x, item.y, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = COLORS.AMMO;
                ctx.fillRect(item.x - 6, item.y - 4, 12, 8);
                break;

            case 'health':
                ctx.fillStyle = `rgba(200, 0, 0, ${pulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(item.x, item.y, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#cc0000';
                ctx.fillRect(item.x - 6, item.y - 2, 12, 4);
                ctx.fillRect(item.x - 2, item.y - 6, 4, 12);
                break;

            case 'armor':
                ctx.fillStyle = `rgba(0, 100, 200, ${pulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(item.x, item.y, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = COLORS.ARMOR;
                ctx.beginPath();
                ctx.moveTo(item.x, item.y - 8);
                ctx.lineTo(item.x + 6, item.y);
                ctx.lineTo(item.x, item.y + 8);
                ctx.lineTo(item.x - 6, item.y);
                ctx.closePath();
                ctx.fill();
                break;

            case 'credits':
                ctx.fillStyle = `rgba(200, 200, 0, ${pulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(item.x, item.y, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#cccc00';
                ctx.beginPath();
                ctx.arc(item.x, item.y, 6, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'keycard':
                ctx.fillStyle = `rgba(200, 200, 0, ${pulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(item.x, item.y, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ccaa00';
                ctx.fillRect(item.x - 8, item.y - 5, 16, 10);
                break;

            case 'weapon':
                ctx.fillStyle = `rgba(100, 100, 255, ${pulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(item.x, item.y, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#666688';
                ctx.fillRect(item.x - 10, item.y - 3, 20, 6);
                break;

            case 'speedboost':
                ctx.fillStyle = `rgba(0, 255, 255, ${pulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(item.x, item.y, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#00ffff';
                ctx.beginPath();
                ctx.moveTo(item.x - 4, item.y - 6);
                ctx.lineTo(item.x + 6, item.y);
                ctx.lineTo(item.x - 4, item.y + 6);
                ctx.closePath();
                ctx.fill();
                break;

            case 'damageboost':
                ctx.fillStyle = `rgba(255, 0, 0, ${pulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(item.x, item.y, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff4400';
                ctx.font = 'bold 14px Arial';
                ctx.fillText('x2', item.x - 8, item.y + 5);
                break;
        }
    }
}

function drawBullets() {
    for (const bullet of bullets) {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.color === COLORS.PLASMA ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.fillStyle = bullet.color + '80';
        ctx.beginPath();
        ctx.arc(bullet.x - bullet.vx * 0.02, bullet.y - bullet.vy * 0.02, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawEnemies() {
    for (const enemy of enemies) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(enemy.x, enemy.y + enemy.size, enemy.size, enemy.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // POLISH: Hit flash effect
        const flashColor = enemy.hitFlash > 0 ? '#ffffff' : enemy.color;

        ctx.fillStyle = flashColor;

        if (enemy.boss) {
            // Boss - large body
            ctx.beginPath();
            ctx.ellipse(enemy.x, enemy.y, enemy.size, enemy.size * 0.8, enemy.angle, 0, Math.PI * 2);
            ctx.fill();
            // Crown
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.moveTo(enemy.x - 15, enemy.y - enemy.size);
            ctx.lineTo(enemy.x - 10, enemy.y - enemy.size - 10);
            ctx.lineTo(enemy.x, enemy.y - enemy.size);
            ctx.lineTo(enemy.x + 10, enemy.y - enemy.size - 10);
            ctx.lineTo(enemy.x + 15, enemy.y - enemy.size);
            ctx.closePath();
            ctx.fill();
        } else if (enemy.type === 'arachnid' || enemy.type === 'brute') {
            ctx.beginPath();
            ctx.ellipse(enemy.x, enemy.y, enemy.size, enemy.size * 0.8, enemy.angle, 0, Math.PI * 2);
            ctx.fill();
            // Legs
            ctx.strokeStyle = flashColor;
            ctx.lineWidth = enemy.type === 'brute' ? 4 : 2;
            for (let i = 0; i < 4; i++) {
                const legAngle = enemy.angle + (i * Math.PI / 2) - Math.PI / 4;
                ctx.beginPath();
                ctx.moveTo(enemy.x, enemy.y);
                ctx.lineTo(enemy.x + Math.cos(legAngle) * enemy.size * 1.2, enemy.y + Math.sin(legAngle) * enemy.size * 1.2);
                ctx.stroke();
            }
        } else if (enemy.type === 'spitter') {
            // Spitter - with visible acid sac
            ctx.beginPath();
            ctx.ellipse(enemy.x, enemy.y, enemy.size, enemy.size * 0.7, enemy.angle, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = COLORS.ACID;
            ctx.beginPath();
            ctx.arc(enemy.x - Math.cos(enemy.angle) * 5, enemy.y - Math.sin(enemy.angle) * 5, 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Regular scorpion
            ctx.beginPath();
            ctx.ellipse(enemy.x, enemy.y, enemy.size, enemy.size * 0.8, enemy.angle, 0, Math.PI * 2);
            ctx.fill();
            // Tail
            ctx.strokeStyle = flashColor;
            ctx.lineWidth = enemy.size * 0.3;
            ctx.beginPath();
            ctx.moveTo(enemy.x, enemy.y);
            const tailX = enemy.x - Math.cos(enemy.angle) * enemy.size;
            const tailY = enemy.y - Math.sin(enemy.angle) * enemy.size;
            ctx.lineTo(tailX, tailY);
            ctx.lineTo(tailX - Math.cos(enemy.angle) * 5, tailY - Math.sin(enemy.angle) * 5 - 6);
            ctx.stroke();
        }

        // Eyes
        ctx.fillStyle = COLORS.ALIEN_EYES;
        const eyeOffset = enemy.size * 0.5;
        ctx.beginPath();
        ctx.arc(enemy.x + Math.cos(enemy.angle) * eyeOffset - 2, enemy.y + Math.sin(enemy.angle) * eyeOffset - 2, enemy.boss ? 4 : 2, 0, Math.PI * 2);
        ctx.arc(enemy.x + Math.cos(enemy.angle) * eyeOffset + 2, enemy.y + Math.sin(enemy.angle) * eyeOffset + 2, enemy.boss ? 4 : 2, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        if (enemy.hp < enemy.maxHp) {
            const barWidth = enemy.size * 2.4;
            ctx.fillStyle = '#330000';
            ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size - 8, barWidth, 4);
            ctx.fillStyle = enemy.boss ? '#ff8800' : '#cc0000';
            ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size - 8, barWidth * (enemy.hp / enemy.maxHp), 4);
        }
    }
}

function drawPlayer() {
    if (player.invincible > 0 && Math.floor(player.invincible * 10) % 2 === 0) {
        return;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 8, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // POLISH: Recoil effect
    ctx.translate(-player.recoil, 0);

    // Armor
    ctx.fillStyle = player.damageBoost > 0 ? '#ff6666' : (player.speedBoost > 0 ? '#66ffff' : COLORS.PLAYER);
    ctx.fillRect(-8, -10, 16, 20);

    // Weapon (changes by type)
    const weapon = WEAPONS[player.currentWeapon];
    ctx.fillStyle = '#555555';
    if (player.currentWeapon === 'shotgun') {
        ctx.fillRect(5, -4, 18, 8);
    } else if (player.currentWeapon === 'flamethrower') {
        ctx.fillRect(5, -5, 20, 10);
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(22, -3, 6, 6);
    } else {
        ctx.fillRect(5, -3, 15, 6);
    }
    ctx.fillStyle = '#333333';
    ctx.fillRect(15, -2, 5, 4);

    // Visor
    ctx.fillStyle = '#00aaaa';
    ctx.fillRect(-6, -8, 8, 4);

    ctx.restore();

    // Laser sight
    if (player.flashlightOn) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(
            player.x + Math.cos(player.angle) * 200,
            player.y + Math.sin(player.angle) * 200
        );
        ctx.stroke();
    }
}

function drawFlashlight() {
    if (player.flashlightOn) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        const gradient = ctx.createRadialGradient(
            player.x, player.y, 10,
            player.x + Math.cos(player.angle) * 150, player.y + Math.sin(player.angle) * 150, 100
        );
        gradient.addColorStop(0, 'rgba(200, 200, 150, 0.15)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.arc(player.x, player.y, 200, player.angle - 0.4, player.angle + 0.4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

function drawParticles() {
    for (const p of particles) {
        switch (p.type) {
            case 'muzzle':
                ctx.fillStyle = `rgba(255, 170, 0, ${p.life * 10})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size || 6, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'blood':
                ctx.fillStyle = `rgba(200, 0, 0, ${p.life * 2})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'alienblood':
                ctx.fillStyle = `rgba(68, 136, 68, ${p.life * 2.5})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'spark':
                ctx.fillStyle = `rgba(255, 200, 100, ${p.life * 5})`;
                ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
                break;

            case 'shell':
                ctx.fillStyle = `rgba(200, 180, 100, ${p.life * 2})`;
                ctx.fillRect(p.x - 2, p.y - 1, 4, 2);
                break;

            case 'smoke':
                ctx.fillStyle = `rgba(100, 100, 100, ${p.life})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'explosion':
                ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, ${p.life})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5 + (1 - p.life) * 10, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'spawn':
                ctx.fillStyle = `rgba(100, 255, 100, ${p.life * 2})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'acid':
                ctx.fillStyle = `rgba(136, 255, 0, ${p.life * 3})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'teleport':
                ctx.fillStyle = `rgba(0, 255, 255, ${p.life * 2})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'dust':
                ctx.fillStyle = `rgba(100, 100, 80, ${p.life * 2})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'pickup':
                ctx.fillStyle = `rgba(255, 255, 255, ${p.life * 3})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'alert':
                ctx.fillStyle = `rgba(255, 0, 0, ${p.life * 2})`;
                ctx.font = 'bold 16px Arial';
                ctx.fillText('!', p.x - 4, p.y);
                break;
        }
    }
}

function drawFloatingTexts() {
    for (const ft of floatingTexts) {
        ctx.globalAlpha = Math.min(1, ft.life * 2);
        ctx.fillStyle = ft.color;
        ctx.font = `bold ${ft.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x - game.camera.x, ft.y - game.camera.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
}

// POLISH: Minimap
function drawMinimap() {
    const mapSize = 120;
    const mapX = canvas.width - mapSize - 10;
    const mapY = 10;
    const scale = mapSize / (MAP_WIDTH * TILE_SIZE);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize * (MAP_HEIGHT / MAP_WIDTH));

    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize * (MAP_HEIGHT / MAP_WIDTH));

    // Walls
    ctx.fillStyle = '#444';
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (map[y][x].terrain === TERRAIN.WALL) {
                ctx.fillRect(mapX + x * scale * TILE_SIZE, mapY + y * scale * TILE_SIZE, 2, 2);
            }
        }
    }

    // Enemies
    ctx.fillStyle = '#ff0000';
    for (const enemy of enemies) {
        ctx.fillRect(mapX + enemy.x * scale - 1, mapY + enemy.y * scale - 1, enemy.boss ? 4 : 2, enemy.boss ? 4 : 2);
    }

    // Player
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(mapX + player.x * scale - 2, mapY + player.y * scale - 2, 4, 4);
}

function drawUI() {
    // Top-left: Rank/XP, Lives, Combo
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(10, 10, 140, 70);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 140, 70);

    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.font = 'bold 11px Arial';
    ctx.fillText(`RANK ${player.rank}`, 18, 26);
    ctx.fillStyle = COLORS.UI_TEXT_DIM;
    ctx.fillText(`XP: ${player.xp}/${player.xpToNext}`, 18, 40);

    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.fillText(`WAVE ${game.wave}`, 18, 55);

    // Combo display
    if (game.combo > 0) {
        ctx.fillStyle = '#ffff00';
        ctx.fillText(`COMBO x${game.combo}`, 18, 70);
    }

    // Lives
    ctx.fillStyle = '#cc0000';
    for (let i = 0; i < player.lives; i++) {
        ctx.fillText('\u2665', 100 + i * 12, 26);
    }

    // Bottom-center: Health, Armor, Credits
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(200, canvas.height - 60, 260, 50);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(200, canvas.height - 60, 260, 50);

    // Health bar
    ctx.fillStyle = COLORS.HEALTH_BG;
    ctx.fillRect(210, canvas.height - 52, 150, 12);
    ctx.fillStyle = COLORS.HEALTH;
    ctx.fillRect(210, canvas.height - 52, 150 * (player.hp / player.maxHp), 12);

    // Armor bar
    ctx.fillStyle = '#001133';
    ctx.fillRect(210, canvas.height - 38, 150, 8);
    ctx.fillStyle = COLORS.ARMOR;
    ctx.fillRect(210, canvas.height - 38, 150 * (player.armor / player.maxArmor), 8);

    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`$${player.credits}`, 380, canvas.height - 35);

    // Bottom-right: Weapon and Ammo
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(canvas.width - 160, canvas.height - 70, 150, 60);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(canvas.width - 160, canvas.height - 70, 150, 60);

    const weapon = WEAPONS[player.currentWeapon];
    const weaponData = player.weapons[player.currentWeapon];

    ctx.fillStyle = player.reloading ? '#ff8800' : COLORS.AMMO;
    ctx.font = 'bold 16px Arial';
    const ammoText = player.reloading ? 'RELOAD' : `${weaponData?.clip || 0} | ${weaponData?.ammo || 0}`;
    ctx.fillText(ammoText, canvas.width - 150, canvas.height - 45);

    ctx.fillStyle = COLORS.UI_TEXT_DIM;
    ctx.font = '10px Arial';
    ctx.fillText(weapon?.name || 'No Weapon', canvas.width - 150, canvas.height - 25);

    // Weapon slots
    ctx.font = '9px Arial';
    const weaponKeys = Object.keys(player.weapons);
    for (let i = 0; i < weaponKeys.length && i < 5; i++) {
        ctx.fillStyle = weaponKeys[i] === player.currentWeapon ? '#00ffff' : '#666666';
        ctx.fillText(`${i + 1}`, canvas.width - 150 + i * 15, canvas.height - 58);
    }

    // Reload progress
    if (player.reloading) {
        const progress = 1 - (player.reloadTime / weapon.reloadTime);
        ctx.fillStyle = 'rgba(255, 136, 0, 0.5)';
        ctx.fillRect(210, canvas.height - 28, 150 * progress, 4);
    }

    // Power-up indicators
    if (player.speedBoost > 0) {
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`SPEED: ${Math.ceil(player.speedBoost)}s`, 10, canvas.height - 30);
    }
    if (player.damageBoost > 0) {
        ctx.fillStyle = '#ff4400';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`DMG x2: ${Math.ceil(player.damageBoost)}s`, 10, canvas.height - 15);
    }
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#cc0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.font = '18px Arial';
    ctx.fillText(`Wave Reached: ${game.wave}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Kills: ${game.killCount} | Rank: ${player.rank} | Credits: ${player.credits}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 70);
    ctx.textAlign = 'left';
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.font = '18px Arial';
    ctx.fillText(`All Waves Cleared!`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Kills: ${game.killCount} | Rank: ${player.rank} | Credits: ${player.credits}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('Press R to Play Again', canvas.width / 2, canvas.height / 2 + 70);
    ctx.textAlign = 'left';
}

// Game loop
let lastTime = 0;
function gameLoop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
    lastTime = currentTime;

    // Restart
    if ((game.state === 'gameover' || game.state === 'victory') && keys['r']) {
        game.state = 'playing';
        game.wave = 1;
        game.killCount = 0;
        game.combo = 0;
        player.hp = player.maxHp;
        player.armor = 0;
        player.lives = 3;
        player.credits = 0;
        player.rank = 1;
        player.xp = 0;
        player.weapons = { assault_rifle: { ammo: 90, clip: 30 } };
        player.currentWeapon = 'assault_rifle';
        generateLevel();
    }

    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize and start
generateLevel();
requestAnimationFrame(gameLoop);

// Expose for testing
window.player = player;
window.gameState = game;
Object.defineProperty(window, 'enemies', { get: () => enemies });
Object.defineProperty(window, 'items', { get: () => items });
