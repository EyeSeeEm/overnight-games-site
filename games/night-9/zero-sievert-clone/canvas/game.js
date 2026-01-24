// Radiated Zone - Zero Sievert Clone - Canvas Implementation
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Map constants
const TILE_SIZE = 32;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 50;

// Colors - Post-apocalyptic palette
const COLORS = {
    bg: '#1a1a12',
    grass: '#2a3020',
    grassDark: '#222818',
    dirt: '#3a3020',
    dirtDark: '#2a2015',
    tree: '#1a2a10',
    treeTrunk: '#3a2a18',
    building: '#3a3a38',
    buildingDark: '#2a2a28',
    buildingRoof: '#4a4a45',
    door: '#5a4a30',
    doorOpen: '#2a2015',
    wall: '#4a4a40',
    player: '#556644',
    playerGear: '#404835',
    visionCone: 'rgba(200,200,150,0.08)',
    fog: 'rgba(20,20,15,0.95)',
    fogExplored: 'rgba(20,20,15,0.6)',
    health: '#cc3333',
    healthBg: '#331111',
    stamina: '#33aa33',
    bullet: '#ffff88',
    bulletTrail: 'rgba(255,255,136,0.3)',
    muzzleFlash: '#ffff44',
    blood: '#551515',
    bloodFresh: '#882020',
    wolf: '#5a5a50',
    boar: '#5a4030',
    banditMelee: '#4a4030',
    banditPistol: '#504030',
    banditRifle: '#454035',
    loot: '#88aa44',
    lootGlow: 'rgba(136,170,68,0.3)',
    extraction: '#44ff88',
    extractionGlow: 'rgba(68,255,136,0.2)',
    ui: '#aaa888',
    uiDark: '#555540',
    ammo: '#ffcc44',
    medkit: '#ff4444'
};

// Game state
const gameState = {
    screen: 'menu',
    paused: false,
    debugOverlay: false,
    gameTime: 0,
    raidTime: 0,
    extracting: false,
    extractTimer: 0,
    score: 0,
    lootValue: 0,
    kills: 0,
    won: false,
    lost: false,
    lostReason: ''
};

// Player
const player = {
    x: 400, y: 300,
    vx: 0, vy: 0,
    angle: 0,
    speed: 120,
    sprintSpeed: 180,
    sprinting: false,
    health: 100, maxHealth: 100,
    stamina: 100, maxStamina: 100,
    bleeding: false,
    bleedTimer: 0,
    weapon: 0, // Index into weapons array
    ammo: { pistol: 24, smg: 60, shotgun: 16, rifle: 30 },
    inventory: [],
    medkits: 2,
    bandages: 3,
    size: 10,
    attackCooldown: 0,
    reloading: false,
    reloadTimer: 0,
    iframes: 0
};

// Weapons
const weapons = [
    { name: 'PM Pistol', damage: 18, fireRate: 0.3, magSize: 8, mag: 8, spread: 0.12, range: 250, ammoType: 'pistol', reloadTime: 1.5, auto: false },
    { name: 'Skorpion', damage: 14, fireRate: 0.08, magSize: 20, mag: 20, spread: 0.18, range: 180, ammoType: 'smg', reloadTime: 2.0, auto: true },
    { name: 'Pump Shotgun', damage: 8, fireRate: 0.8, magSize: 6, mag: 6, spread: 0.35, range: 120, ammoType: 'shotgun', pellets: 8, reloadTime: 2.5, auto: false },
    { name: 'AK-74', damage: 28, fireRate: 0.12, magSize: 30, mag: 30, spread: 0.1, range: 280, ammoType: 'rifle', reloadTime: 2.2, auto: true }
];

// Input
const keys = {};
const mouse = { x: 400, y: 300, down: false, rightDown: false };

// Entities
let enemies = [];
let bullets = [];
let loot = [];
let buildings = [];
let trees = [];
let containers = [];
let particles = [];
let floatingTexts = [];
let bloodPools = [];

// Map
let currentMap = [];
let explored = [];
let visible = [];

// Extraction
let extractionPoint = { x: 0, y: 0 };

// Camera
const camera = { x: 0, y: 0 };

// Generate procedural forest zone
function generateZone() {
    // Initialize map (0 = grass, 1 = tree, 2 = building floor, 3 = building wall)
    for (let y = 0; y < MAP_HEIGHT; y++) {
        currentMap[y] = [];
        explored[y] = [];
        visible[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            currentMap[y][x] = Math.random() < 0.02 ? 1 : 0; // Sparse trees
            explored[y][x] = false;
            visible[y][x] = false;
        }
    }

    // Clear spawn area
    for (let y = 2; y < 6; y++) {
        for (let x = 2; x < 6; x++) {
            currentMap[y][x] = 0;
        }
    }

    // Add tree clusters
    trees = [];
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * MAP_WIDTH * TILE_SIZE;
        const y = Math.random() * MAP_HEIGHT * TILE_SIZE;
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);
        if (tileX > 6 || tileY > 6) { // Not in spawn
            trees.push({ x, y, size: 15 + Math.random() * 10 });
            if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
                currentMap[tileY][tileX] = 1;
            }
        }
    }

    // Generate buildings (POIs)
    buildings = [];
    const buildingPositions = [
        { x: 15, y: 15, w: 6, h: 5, name: 'Shack' },
        { x: 30, y: 10, w: 8, h: 6, name: 'House' },
        { x: 40, y: 25, w: 5, h: 5, name: 'Cabin' },
        { x: 20, y: 35, w: 7, h: 5, name: 'Store' },
        { x: 10, y: 40, w: 6, h: 6, name: 'Warehouse' },
        { x: 35, y: 40, w: 5, h: 4, name: 'Outpost' }
    ];

    for (const b of buildingPositions) {
        // Carve out building area
        for (let y = b.y; y < b.y + b.h && y < MAP_HEIGHT; y++) {
            for (let x = b.x; x < b.x + b.w && x < MAP_WIDTH; x++) {
                if (x === b.x || x === b.x + b.w - 1 || y === b.y || y === b.y + b.h - 1) {
                    currentMap[y][x] = 3; // Wall
                } else {
                    currentMap[y][x] = 2; // Floor
                }
            }
        }

        // Add door
        const doorX = b.x + Math.floor(b.w / 2);
        const doorY = b.y + b.h - 1;
        if (doorY < MAP_HEIGHT) {
            currentMap[doorY][doorX] = 2; // Door opening
        }

        buildings.push({
            x: b.x * TILE_SIZE,
            y: b.y * TILE_SIZE,
            w: b.w * TILE_SIZE,
            h: b.h * TILE_SIZE,
            name: b.name,
            doorX: doorX * TILE_SIZE,
            doorY: doorY * TILE_SIZE
        });
    }

    // Place extraction point (far corner)
    extractionPoint = {
        x: (MAP_WIDTH - 5) * TILE_SIZE,
        y: (MAP_HEIGHT - 5) * TILE_SIZE,
        radius: 60
    };

    // Clear extraction area
    for (let y = MAP_HEIGHT - 7; y < MAP_HEIGHT - 2; y++) {
        for (let x = MAP_WIDTH - 7; x < MAP_WIDTH - 2; x++) {
            if (y >= 0 && x >= 0) {
                currentMap[y][x] = 0;
            }
        }
    }

    // Generate loot containers
    containers = [];
    for (const b of buildings) {
        // Place 1-3 containers per building
        const count = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            containers.push({
                x: b.x + 40 + Math.random() * (b.w - 80),
                y: b.y + 40 + Math.random() * (b.h - 80),
                searched: false,
                type: Math.random() < 0.4 ? 'medical' : (Math.random() < 0.5 ? 'weapon' : 'supplies')
            });
        }
    }

    // Add outdoor containers
    for (let i = 0; i < 10; i++) {
        containers.push({
            x: 200 + Math.random() * (MAP_WIDTH * TILE_SIZE - 400),
            y: 200 + Math.random() * (MAP_HEIGHT * TILE_SIZE - 400),
            searched: false,
            type: Math.random() < 0.5 ? 'medical' : 'supplies'
        });
    }

    // Spawn enemies
    enemies = [];

    // Wildlife - wolves and boars
    for (let i = 0; i < 8; i++) {
        spawnEnemy(
            200 + Math.random() * (MAP_WIDTH * TILE_SIZE - 400),
            200 + Math.random() * (MAP_HEIGHT * TILE_SIZE - 400),
            Math.random() < 0.5 ? 'wolf' : 'boar'
        );
    }

    // Bandits near buildings
    for (const b of buildings) {
        const banditCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < banditCount; i++) {
            const type = ['banditMelee', 'banditPistol', 'banditRifle'][Math.floor(Math.random() * 3)];
            spawnEnemy(
                b.x + b.w / 2 + (Math.random() - 0.5) * 150,
                b.y + b.h / 2 + (Math.random() - 0.5) * 150,
                type
            );
        }
    }

    // Roaming bandits
    for (let i = 0; i < 5; i++) {
        const type = ['banditMelee', 'banditPistol', 'banditRifle'][Math.floor(Math.random() * 3)];
        spawnEnemy(
            300 + Math.random() * (MAP_WIDTH * TILE_SIZE - 600),
            300 + Math.random() * (MAP_HEIGHT * TILE_SIZE - 600),
            type
        );
    }
}

function spawnEnemy(x, y, type) {
    const stats = {
        wolf: { hp: 40, damage: 15, speed: 140, size: 12, ranged: false, color: COLORS.wolf, loot: 50 },
        boar: { hp: 80, damage: 20, speed: 100, size: 16, ranged: false, color: COLORS.boar, loot: 80 },
        banditMelee: { hp: 60, damage: 18, speed: 90, size: 14, ranged: false, color: COLORS.banditMelee, loot: 150 },
        banditPistol: { hp: 60, damage: 12, speed: 80, size: 14, ranged: true, range: 200, fireRate: 0.5, color: COLORS.banditPistol, loot: 200 },
        banditRifle: { hp: 50, damage: 20, speed: 70, size: 14, ranged: true, range: 280, fireRate: 0.8, color: COLORS.banditRifle, loot: 300 }
    };

    const s = stats[type];
    enemies.push({
        x, y, type,
        health: s.hp,
        maxHealth: s.hp,
        damage: s.damage,
        speed: s.speed,
        size: s.size,
        ranged: s.ranged,
        range: s.range || 40,
        fireRate: s.fireRate || 1,
        color: s.color,
        loot: s.loot,
        angle: Math.random() * Math.PI * 2,
        state: 'patrol',
        patrolTarget: { x: x + (Math.random() - 0.5) * 200, y: y + (Math.random() - 0.5) * 200 },
        alertTimer: 0,
        attackCooldown: 0,
        visionAngle: Math.PI / 2 // 90 degree vision cone
    });
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

    if (key === 'q') gameState.debugOverlay = !gameState.debugOverlay;
    if (key === 'e') interact();
    if (key === 'r') reload();
    if (key === '1') { if (player.medkits > 0) useMedkit(); }
    if (key === '2') { if (player.bandages > 0) useBandage(); }
    if (key === 'tab') { e.preventDefault(); }

    // Weapon switching
    if (key >= '3' && key <= '6') {
        const weaponIndex = parseInt(key) - 3;
        if (weaponIndex < weapons.length) {
            player.weapon = weaponIndex;
            player.reloading = false;
        }
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
    gameState.gameTime = 0;
    gameState.raidTime = 0;
    gameState.score = 0;
    gameState.lootValue = 0;
    gameState.kills = 0;
    gameState.extracting = false;
    gameState.extractTimer = 0;
    gameState.won = false;
    gameState.lost = false;

    player.x = 4 * TILE_SIZE;
    player.y = 4 * TILE_SIZE;
    player.health = player.maxHealth;
    player.stamina = player.maxStamina;
    player.bleeding = false;
    player.bleedTimer = 0;
    player.weapon = 0;
    player.ammo = { pistol: 24, smg: 60, shotgun: 16, rifle: 30 };
    player.medkits = 2;
    player.bandages = 3;
    player.inventory = [];

    // Reset weapon mags
    for (const w of weapons) {
        w.mag = w.magSize;
    }

    loot = [];
    bullets = [];
    particles = [];
    floatingTexts = [];
    bloodPools = [];

    generateZone();
}

function interact() {
    const interactRange = 50;

    // Check containers
    for (const container of containers) {
        if (container.searched) continue;
        const dx = container.x - player.x;
        const dy = container.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) < interactRange) {
            container.searched = true;

            // Generate loot based on type (2:1 healing to weapons ratio)
            if (container.type === 'medical') {
                // Always healing
                if (Math.random() < 0.6) {
                    player.medkits++;
                    addFloatingText(container.x, container.y - 20, '+MEDKIT', COLORS.medkit);
                } else {
                    player.bandages += 2;
                    addFloatingText(container.x, container.y - 20, '+2 BANDAGE', '#ffaaaa');
                }
                gameState.lootValue += 100;
            } else if (container.type === 'weapon') {
                // Ammo
                const ammoTypes = ['pistol', 'smg', 'shotgun', 'rifle'];
                const type = ammoTypes[Math.floor(Math.random() * ammoTypes.length)];
                const amount = type === 'shotgun' ? 8 : (type === 'pistol' ? 16 : 30);
                player.ammo[type] += amount;
                addFloatingText(container.x, container.y - 20, `+${amount} ${type.toUpperCase()}`, COLORS.ammo);
                gameState.lootValue += 150;
            } else {
                // Supplies - mix of healing and ammo
                if (Math.random() < 0.5) {
                    player.bandages++;
                    addFloatingText(container.x, container.y - 20, '+BANDAGE', '#ffaaaa');
                } else {
                    const ammoTypes = ['pistol', 'smg', 'shotgun', 'rifle'];
                    const type = ammoTypes[Math.floor(Math.random() * ammoTypes.length)];
                    const amount = type === 'shotgun' ? 4 : (type === 'pistol' ? 8 : 15);
                    player.ammo[type] += amount;
                    addFloatingText(container.x, container.y - 20, `+${amount} ${type.toUpperCase()}`, COLORS.ammo);
                }
                gameState.lootValue += 75;
            }
            return;
        }
    }

    // Check extraction
    const dx = extractionPoint.x - player.x;
    const dy = extractionPoint.y - player.y;
    if (Math.sqrt(dx * dx + dy * dy) < extractionPoint.radius) {
        gameState.extracting = true;
        addFloatingText(player.x, player.y - 30, 'EXTRACTING...', COLORS.extraction);
    }
}

function reload() {
    const weapon = weapons[player.weapon];
    if (weapon.mag === weapon.magSize) return;
    if (player.ammo[weapon.ammoType] <= 0) {
        addFloatingText(player.x, player.y - 30, 'NO AMMO', '#ff4444');
        return;
    }
    if (player.reloading) return;

    player.reloading = true;
    player.reloadTimer = weapon.reloadTime;
}

function useMedkit() {
    if (player.medkits <= 0) return;
    if (player.health >= player.maxHealth) return;

    player.medkits--;
    player.health = Math.min(player.maxHealth, player.health + 50);
    player.bleeding = false;
    addFloatingText(player.x, player.y - 30, '+50 HP', '#44ff44');
}

function useBandage() {
    if (player.bandages <= 0) return;

    player.bandages--;
    if (player.bleeding) {
        player.bleeding = false;
        addFloatingText(player.x, player.y - 30, 'BLEEDING STOPPED', '#ffaaaa');
    } else {
        player.health = Math.min(player.maxHealth, player.health + 15);
        addFloatingText(player.x, player.y - 30, '+15 HP', '#44ff44');
    }
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 1.5, vy: -40 });
}

// Update
function update(dt) {
    if (gameState.screen !== 'playing') return;

    gameState.gameTime += dt;
    gameState.raidTime += dt;

    // Extraction timer
    if (gameState.extracting) {
        gameState.extractTimer += dt;
        if (gameState.extractTimer >= 3) {
            // Successfully extracted
            gameState.won = true;
            gameState.score = gameState.lootValue + gameState.kills * 100;
            gameState.screen = 'win';
            return;
        }

        // Check if still in extraction zone
        const dx = extractionPoint.x - player.x;
        const dy = extractionPoint.y - player.y;
        if (Math.sqrt(dx * dx + dy * dy) > extractionPoint.radius) {
            gameState.extracting = false;
            gameState.extractTimer = 0;
            addFloatingText(player.x, player.y - 30, 'EXTRACTION CANCELLED', '#ff4444');
        }
    }

    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    updateFloatingTexts(dt);
    updateCamera();
    updateVisibility();

    checkWinLose();
}

function updatePlayer(dt) {
    // Cooldowns
    if (player.attackCooldown > 0) player.attackCooldown -= dt;
    if (player.iframes > 0) player.iframes -= dt;

    // Reloading
    if (player.reloading) {
        player.reloadTimer -= dt;
        if (player.reloadTimer <= 0) {
            const weapon = weapons[player.weapon];
            const needed = weapon.magSize - weapon.mag;
            const available = Math.min(needed, player.ammo[weapon.ammoType]);
            weapon.mag += available;
            player.ammo[weapon.ammoType] -= available;
            player.reloading = false;
            addFloatingText(player.x, player.y - 30, 'RELOADED', '#88ff88');
        }
    }

    // Bleeding
    if (player.bleeding) {
        player.bleedTimer -= dt;
        if (player.bleedTimer <= 0) {
            player.health -= 2;
            player.bleedTimer = 1;
            addFloatingText(player.x + (Math.random() - 0.5) * 20, player.y - 20, '-2', COLORS.bloodFresh);
        }
    }

    // Stamina regen
    if (!player.sprinting) {
        player.stamina = Math.min(player.maxStamina, player.stamina + 10 * dt);
    }

    // Aim at mouse
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Movement
    let moveX = 0, moveY = 0;
    if (keys['w']) moveY -= 1;
    if (keys['s']) moveY += 1;
    if (keys['a']) moveX -= 1;
    if (keys['d']) moveX += 1;

    if (moveX !== 0 || moveY !== 0) {
        const len = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= len;
        moveY /= len;

        player.sprinting = keys['shift'] && player.stamina > 0;
        let speed = player.speed;
        if (player.sprinting) {
            speed = player.sprintSpeed;
            player.stamina -= 20 * dt;
        }

        const newX = player.x + moveX * speed * dt;
        const newY = player.y + moveY * speed * dt;

        if (!checkCollision(newX, player.y, player.size)) {
            player.x = newX;
        }
        if (!checkCollision(player.x, newY, player.size)) {
            player.y = newY;
        }
    }

    // Shooting
    const weapon = weapons[player.weapon];
    if (mouse.down && player.attackCooldown <= 0 && !player.reloading) {
        if (weapon.mag > 0) {
            shoot();
            if (!weapon.auto) {
                mouse.down = false; // Require re-click for semi-auto
            }
        } else {
            // Auto reload
            reload();
        }
    }
}

function shoot() {
    const weapon = weapons[player.weapon];
    weapon.mag--;
    player.attackCooldown = weapon.fireRate;

    const pellets = weapon.pellets || 1;

    // Muzzle flash
    particles.push({
        x: player.x + Math.cos(player.angle) * 20,
        y: player.y + Math.sin(player.angle) * 20,
        vx: 0, vy: 0,
        life: 0.05,
        size: 15,
        color: COLORS.muzzleFlash
    });

    for (let i = 0; i < pellets; i++) {
        const spread = (Math.random() - 0.5) * weapon.spread;
        const angle = player.angle + spread;

        bullets.push({
            x: player.x + Math.cos(angle) * 20,
            y: player.y + Math.sin(angle) * 20,
            vx: Math.cos(angle) * 500,
            vy: Math.sin(angle) * 500,
            damage: weapon.damage,
            range: weapon.range,
            traveled: 0,
            friendly: true
        });
    }
}

function checkCollision(x, y, size) {
    // Map bounds
    if (x < size || x > MAP_WIDTH * TILE_SIZE - size || y < size || y > MAP_HEIGHT * TILE_SIZE - size) {
        return true;
    }

    // Check tiles
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const checkX = tileX + dx;
            const checkY = tileY + dy;

            if (checkX < 0 || checkX >= MAP_WIDTH || checkY < 0 || checkY >= MAP_HEIGHT) continue;

            const tile = currentMap[checkY][checkX];
            if (tile === 1 || tile === 3) { // Tree or wall
                const tileLeft = checkX * TILE_SIZE;
                const tileRight = tileLeft + TILE_SIZE;
                const tileTop = checkY * TILE_SIZE;
                const tileBottom = tileTop + TILE_SIZE;

                if (x + size > tileLeft && x - size < tileRight &&
                    y + size > tileTop && y - size < tileBottom) {
                    return true;
                }
            }
        }
    }

    // Check trees (circular collision)
    for (const tree of trees) {
        const dx = x - tree.x;
        const dy = y - tree.y;
        if (Math.sqrt(dx * dx + dy * dy) < size + 10) {
            return true;
        }
    }

    return false;
}

function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        if (enemy.health <= 0) {
            // Drop loot
            gameState.kills++;
            gameState.lootValue += enemy.loot;
            bloodPools.push({ x: enemy.x, y: enemy.y, size: 15 + Math.random() * 10 });

            // Random item drop
            if (Math.random() < 0.3) {
                if (Math.random() < 0.6) { // More healing than ammo
                    player.bandages++;
                    addFloatingText(enemy.x, enemy.y - 20, '+BANDAGE', '#ffaaaa');
                } else {
                    const ammoTypes = ['pistol', 'smg', 'shotgun', 'rifle'];
                    const type = ammoTypes[Math.floor(Math.random() * ammoTypes.length)];
                    player.ammo[type] += 10;
                    addFloatingText(enemy.x, enemy.y - 20, `+10 ${type.toUpperCase()}`, COLORS.ammo);
                }
            }

            enemies.splice(i, 1);
            continue;
        }

        if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;
        if (enemy.alertTimer > 0) enemy.alertTimer -= dt;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angleToPlayer = Math.atan2(dy, dx);

        // Check if player is in enemy's vision cone
        let angleDiff = angleToPlayer - enemy.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const inVisionCone = Math.abs(angleDiff) < enemy.visionAngle / 2;
        const canSee = dist < 250 && inVisionCone && hasLineOfSight(enemy.x, enemy.y, player.x, player.y);

        if (canSee || enemy.alertTimer > 0) {
            enemy.state = 'combat';
            if (canSee) enemy.alertTimer = 5;
        } else if (enemy.state === 'combat' && enemy.alertTimer <= 0) {
            enemy.state = 'patrol';
        }

        if (enemy.state === 'combat') {
            // Turn toward player
            enemy.angle = angleToPlayer;

            if (enemy.ranged) {
                // Ranged enemy - keep distance and shoot
                if (dist < enemy.range * 0.5) {
                    // Too close, back up
                    const moveX = -dx / dist * enemy.speed * 0.5 * dt;
                    const moveY = -dy / dist * enemy.speed * 0.5 * dt;
                    if (!checkCollision(enemy.x + moveX, enemy.y, enemy.size)) enemy.x += moveX;
                    if (!checkCollision(enemy.x, enemy.y + moveY, enemy.size)) enemy.y += moveY;
                } else if (dist > enemy.range * 0.8) {
                    // Too far, move closer
                    const moveX = dx / dist * enemy.speed * dt;
                    const moveY = dy / dist * enemy.speed * dt;
                    if (!checkCollision(enemy.x + moveX, enemy.y, enemy.size)) enemy.x += moveX;
                    if (!checkCollision(enemy.x, enemy.y + moveY, enemy.size)) enemy.y += moveY;
                }

                // Shoot
                if (enemy.attackCooldown <= 0 && canSee && dist < enemy.range) {
                    const spread = 0.15;
                    const angle = angleToPlayer + (Math.random() - 0.5) * spread;
                    bullets.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: Math.cos(angle) * 350,
                        vy: Math.sin(angle) * 350,
                        damage: enemy.damage,
                        range: enemy.range,
                        traveled: 0,
                        friendly: false,
                        color: '#ff6644'
                    });
                    enemy.attackCooldown = enemy.fireRate;
                }
            } else {
                // Melee enemy - charge
                if (dist > 30) {
                    const moveX = dx / dist * enemy.speed * dt;
                    const moveY = dy / dist * enemy.speed * dt;
                    if (!checkCollision(enemy.x + moveX, enemy.y, enemy.size)) enemy.x += moveX;
                    if (!checkCollision(enemy.x, enemy.y + moveY, enemy.size)) enemy.y += moveY;
                }

                // Melee attack
                if (dist < 40 && enemy.attackCooldown <= 0) {
                    if (player.iframes <= 0) {
                        player.health -= enemy.damage;
                        player.iframes = 0.5;
                        if (Math.random() < 0.3) {
                            player.bleeding = true;
                            player.bleedTimer = 1;
                            addFloatingText(player.x, player.y - 30, 'BLEEDING!', COLORS.bloodFresh);
                        }
                        addFloatingText(player.x, player.y - 30, `-${enemy.damage}`, '#ff4444');
                        screenShake(5);
                    }
                    enemy.attackCooldown = 1;
                }
            }
        } else {
            // Patrol
            const pdx = enemy.patrolTarget.x - enemy.x;
            const pdy = enemy.patrolTarget.y - enemy.y;
            const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

            if (pdist < 20) {
                enemy.patrolTarget = {
                    x: enemy.x + (Math.random() - 0.5) * 300,
                    y: enemy.y + (Math.random() - 0.5) * 300
                };
            } else {
                const moveX = pdx / pdist * enemy.speed * 0.3 * dt;
                const moveY = pdy / pdist * enemy.speed * 0.3 * dt;
                if (!checkCollision(enemy.x + moveX, enemy.y, enemy.size)) enemy.x += moveX;
                if (!checkCollision(enemy.x, enemy.y + moveY, enemy.size)) enemy.y += moveY;
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

        const tile = currentMap[tileY][tileX];
        if (tile === 1 || tile === 3) return false;
    }

    return true;
}

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        const moveX = bullet.vx * dt;
        const moveY = bullet.vy * dt;
        bullet.x += moveX;
        bullet.y += moveY;
        bullet.traveled += Math.sqrt(moveX * moveX + moveY * moveY);

        // Range check
        if (bullet.traveled > bullet.range) {
            bullets.splice(i, 1);
            continue;
        }

        // Wall collision
        const tileX = Math.floor(bullet.x / TILE_SIZE);
        const tileY = Math.floor(bullet.y / TILE_SIZE);
        if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
            bullets.splice(i, 1);
            continue;
        }
        const tile = currentMap[tileY][tileX];
        if (tile === 1 || tile === 3) {
            bullets.splice(i, 1);
            continue;
        }

        // Hit detection
        if (bullet.friendly) {
            for (const enemy of enemies) {
                const dx = enemy.x - bullet.x;
                const dy = enemy.y - bullet.y;
                if (Math.sqrt(dx * dx + dy * dy) < enemy.size + 4) {
                    enemy.health -= bullet.damage;
                    enemy.state = 'combat';
                    enemy.alertTimer = 5;
                    addFloatingText(enemy.x, enemy.y - 20, bullet.damage.toString(), '#ffff44');

                    // Blood
                    for (let j = 0; j < 3; j++) {
                        particles.push({
                            x: enemy.x,
                            y: enemy.y,
                            vx: (Math.random() - 0.5) * 80,
                            vy: (Math.random() - 0.5) * 80,
                            life: 0.3,
                            size: 4,
                            color: COLORS.bloodFresh
                        });
                    }

                    bullets.splice(i, 1);
                    break;
                }
            }
        } else {
            // Enemy bullet hits player
            const dx = player.x - bullet.x;
            const dy = player.y - bullet.y;
            if (Math.sqrt(dx * dx + dy * dy) < player.size + 4 && player.iframes <= 0) {
                player.health -= bullet.damage;
                player.iframes = 0.3;
                if (Math.random() < 0.2) {
                    player.bleeding = true;
                    player.bleedTimer = 1;
                    addFloatingText(player.x, player.y - 30, 'BLEEDING!', COLORS.bloodFresh);
                }
                addFloatingText(player.x, player.y - 30, `-${bullet.damage}`, '#ff4444');
                screenShake(3);
                bullets.splice(i, 1);
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
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.life -= dt;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
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

function updateVisibility() {
    // Reset visibility
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            visible[y][x] = false;
        }
    }

    // Cast rays in vision cone
    const playerTileX = Math.floor(player.x / TILE_SIZE);
    const playerTileY = Math.floor(player.y / TILE_SIZE);
    const visionRange = 10;
    const coneAngle = Math.PI / 2; // 90 degrees

    for (let angle = player.angle - coneAngle / 2; angle < player.angle + coneAngle / 2; angle += 0.05) {
        for (let r = 0; r < visionRange; r++) {
            const checkX = playerTileX + Math.round(Math.cos(angle) * r);
            const checkY = playerTileY + Math.round(Math.sin(angle) * r);

            if (checkX < 0 || checkX >= MAP_WIDTH || checkY < 0 || checkY >= MAP_HEIGHT) break;

            visible[checkY][checkX] = true;
            explored[checkY][checkX] = true;

            // Stop at walls
            if (currentMap[checkY][checkX] === 1 || currentMap[checkY][checkX] === 3) break;
        }
    }

    // Also reveal immediate area around player
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const tx = playerTileX + dx;
            const ty = playerTileY + dy;
            if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
                visible[ty][tx] = true;
                explored[ty][tx] = true;
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

    // Render blood pools
    for (const pool of bloodPools) {
        ctx.fillStyle = COLORS.blood;
        ctx.beginPath();
        ctx.ellipse(pool.x, pool.y, pool.size, pool.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Render containers
    for (const container of containers) {
        if (!isVisible(container.x, container.y)) continue;

        ctx.fillStyle = container.searched ? '#333328' : '#4a4a38';
        ctx.fillRect(container.x - 12, container.y - 8, 24, 16);
        if (!container.searched) {
            ctx.fillStyle = container.type === 'medical' ? COLORS.medkit : (container.type === 'weapon' ? COLORS.ammo : COLORS.loot);
            ctx.fillRect(container.x - 8, container.y - 4, 16, 8);
        }
    }

    // Render extraction point
    const extractDist = Math.sqrt((player.x - extractionPoint.x) ** 2 + (player.y - extractionPoint.y) ** 2);
    if (extractDist < 400 || explored[Math.floor(extractionPoint.y / TILE_SIZE)][Math.floor(extractionPoint.x / TILE_SIZE)]) {
        ctx.fillStyle = COLORS.extractionGlow;
        ctx.beginPath();
        ctx.arc(extractionPoint.x, extractionPoint.y, extractionPoint.radius + 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = COLORS.extraction;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(extractionPoint.x, extractionPoint.y, extractionPoint.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = COLORS.extraction;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('EXTRACTION', extractionPoint.x, extractionPoint.y - extractionPoint.radius - 10);

        if (gameState.extracting) {
            ctx.fillText(`${(3 - gameState.extractTimer).toFixed(1)}s`, extractionPoint.x, extractionPoint.y);
        }
    }

    // Render enemies
    for (const enemy of enemies) {
        if (!isVisible(enemy.x, enemy.y) && !gameState.debugOverlay) continue;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);

        // Enemy vision cone (debug)
        if (gameState.debugOverlay) {
            ctx.fillStyle = 'rgba(255,0,0,0.1)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 100, -enemy.visionAngle / 2, enemy.visionAngle / 2);
            ctx.closePath();
            ctx.fill();
        }

        // Body
        ctx.fillStyle = enemy.color;
        if (enemy.type === 'wolf') {
            ctx.beginPath();
            ctx.ellipse(0, 0, enemy.size, enemy.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            // Head
            ctx.fillRect(enemy.size * 0.5, -4, 8, 8);
        } else if (enemy.type === 'boar') {
            ctx.beginPath();
            ctx.ellipse(0, 0, enemy.size, enemy.size * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            // Tusks
            ctx.fillStyle = '#ddd';
            ctx.fillRect(enemy.size * 0.5, -6, 6, 3);
            ctx.fillRect(enemy.size * 0.5, 3, 6, 3);
        } else {
            // Bandit
            ctx.fillRect(-enemy.size, -enemy.size / 2, enemy.size * 2, enemy.size);
            // Head
            ctx.beginPath();
            ctx.arc(0, 0, enemy.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            // Weapon
            if (enemy.ranged) {
                ctx.fillStyle = '#333';
                ctx.fillRect(enemy.size * 0.3, -2, enemy.size, 4);
            }
        }

        ctx.restore();

        // Health bar
        if (enemy.health < enemy.maxHealth) {
            ctx.fillStyle = '#333';
            ctx.fillRect(enemy.x - 15, enemy.y - enemy.size - 8, 30, 4);
            ctx.fillStyle = COLORS.health;
            ctx.fillRect(enemy.x - 15, enemy.y - enemy.size - 8, 30 * (enemy.health / enemy.maxHealth), 4);
        }
    }

    // Render bullets
    for (const bullet of bullets) {
        ctx.fillStyle = bullet.color || COLORS.bullet;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
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

    // Vision cone
    ctx.fillStyle = COLORS.visionCone;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 300, player.angle - Math.PI / 4, player.angle + Math.PI / 4);
    ctx.closePath();
    ctx.fill();

    ctx.rotate(player.angle);

    // Player flicker when invulnerable
    if (player.iframes > 0 && Math.floor(player.iframes * 10) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Player body
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(-player.size, -player.size / 2, player.size * 2, player.size);

    // Gear
    ctx.fillStyle = COLORS.playerGear;
    ctx.fillRect(-player.size + 2, -player.size / 2 + 2, player.size - 4, player.size - 4);

    // Weapon
    ctx.fillStyle = '#333';
    ctx.fillRect(player.size * 0.3, -2, player.size, 4);

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

    // Fog of war
    renderFog();

    ctx.restore();

    // UI
    renderUI();

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
            const tile = currentMap[y][x];

            if (tile === 0) {
                // Grass
                ctx.fillStyle = ((x + y) % 2 === 0) ? COLORS.grass : COLORS.grassDark;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            } else if (tile === 1) {
                // Tree base (drawn differently)
                ctx.fillStyle = COLORS.grass;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            } else if (tile === 2) {
                // Building floor
                ctx.fillStyle = ((x + y) % 2 === 0) ? COLORS.dirt : COLORS.dirtDark;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            } else if (tile === 3) {
                // Building wall
                ctx.fillStyle = COLORS.building;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                // 3D effect
                ctx.fillStyle = COLORS.buildingRoof;
                ctx.fillRect(screenX, screenY, TILE_SIZE, 4);
                ctx.fillStyle = COLORS.buildingDark;
                ctx.fillRect(screenX, screenY + TILE_SIZE - 4, TILE_SIZE, 4);
            }
        }
    }

    // Render trees
    for (const tree of trees) {
        if (tree.x < camera.x - 50 || tree.x > camera.x + canvas.width + 50 ||
            tree.y < camera.y - 50 || tree.y > camera.y + canvas.height + 50) continue;

        // Trunk
        ctx.fillStyle = COLORS.treeTrunk;
        ctx.fillRect(tree.x - 4, tree.y - 4, 8, 12);

        // Foliage
        ctx.fillStyle = COLORS.tree;
        ctx.beginPath();
        ctx.arc(tree.x, tree.y - 8, tree.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Building labels
    for (const b of buildings) {
        const dist = Math.sqrt((player.x - (b.x + b.w / 2)) ** 2 + (player.y - (b.y + b.h / 2)) ** 2);
        if (dist < 200) {
            ctx.fillStyle = `rgba(150,150,130,${Math.max(0, 1 - dist / 200)})`;
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(b.name, b.x + b.w / 2, b.y - 5);
        }
    }
}

function renderFog() {
    const startX = Math.floor(camera.x / TILE_SIZE);
    const startY = Math.floor(camera.y / TILE_SIZE);
    const endX = Math.min(MAP_WIDTH, startX + Math.ceil(canvas.width / TILE_SIZE) + 2);
    const endY = Math.min(MAP_HEIGHT, startY + Math.ceil(canvas.height / TILE_SIZE) + 2);

    for (let y = Math.max(0, startY); y < endY; y++) {
        for (let x = Math.max(0, startX); x < endX; x++) {
            const screenX = x * TILE_SIZE;
            const screenY = y * TILE_SIZE;

            if (!visible[y][x]) {
                ctx.fillStyle = explored[y][x] ? COLORS.fogExplored : COLORS.fog;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

function isVisible(x, y) {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return false;
    return visible[tileY][tileX];
}

function renderUI() {
    const weapon = weapons[player.weapon];

    // Health bar
    ctx.fillStyle = COLORS.healthBg;
    ctx.fillRect(10, 10, 200, 20);
    ctx.fillStyle = player.bleeding ? '#cc6633' : COLORS.health;
    ctx.fillRect(10, 10, 200 * (player.health / player.maxHealth), 20);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 200, 20);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.floor(player.health)}/${player.maxHealth}${player.bleeding ? ' [BLEEDING]' : ''}`, 15, 25);

    // Stamina bar
    ctx.fillStyle = '#112211';
    ctx.fillRect(10, 35, 200, 10);
    ctx.fillStyle = COLORS.stamina;
    ctx.fillRect(10, 35, 200 * (player.stamina / player.maxStamina), 10);
    ctx.strokeStyle = '#555';
    ctx.strokeRect(10, 35, 200, 10);

    // Weapon info
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(`[${weapon.name}]`, 10, 65);
    ctx.fillText(`${weapon.mag}/${weapon.magSize}  (${player.ammo[weapon.ammoType]})`, 10, 82);
    if (player.reloading) {
        ctx.fillStyle = '#ffaa44';
        ctx.fillText('RELOADING...', 10, 99);
    }

    // Quick slots
    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.fillText(`[1] Medkit: ${player.medkits}  [2] Bandage: ${player.bandages}`, 10, 120);
    ctx.fillText(`[3-6] Switch Weapons`, 10, 135);

    // Extraction direction
    const dx = extractionPoint.x - player.x;
    const dy = extractionPoint.y - player.y;
    const extractDist = Math.sqrt(dx * dx + dy * dy);
    const extractAngle = Math.atan2(dy, dx);

    ctx.fillStyle = COLORS.extraction;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`EXTRACT: ${Math.floor(extractDist / TILE_SIZE)}m`, canvas.width - 10, 20);

    // Arrow pointing to extraction
    const arrowX = canvas.width - 60;
    const arrowY = 40;
    ctx.save();
    ctx.translate(arrowX, arrowY);
    ctx.rotate(extractAngle);
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-5, -8);
    ctx.lineTo(-5, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Raid time
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    const minutes = Math.floor(gameState.raidTime / 60);
    const seconds = Math.floor(gameState.raidTime % 60);
    ctx.fillText(`TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`, canvas.width - 10, 60);

    // Score
    ctx.fillText(`LOOT: $${gameState.lootValue}`, canvas.width - 10, 80);
    ctx.fillText(`KILLS: ${gameState.kills}`, canvas.width - 10, 100);

    // Mini-map
    renderMiniMap();

    // Control hints
    ctx.fillStyle = '#555';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WASD:Move | Mouse:Aim | LMB:Fire | R:Reload | E:Interact | Shift:Sprint | Q:Debug', canvas.width / 2, canvas.height - 10);
}

function renderMiniMap() {
    const mapSize = 100;
    const mapX = canvas.width - mapSize - 10;
    const mapY = canvas.height - mapSize - 25;
    const scale = mapSize / (MAP_WIDTH * TILE_SIZE) * TILE_SIZE;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);

    // Draw explored
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (explored[y][x]) {
                const tile = currentMap[y][x];
                ctx.fillStyle = (tile === 2 || tile === 3) ? '#554' : '#332';
                ctx.fillRect(mapX + x * scale, mapY + y * scale, scale, scale);
            }
        }
    }

    // Extraction
    ctx.fillStyle = COLORS.extraction;
    ctx.fillRect(mapX + (extractionPoint.x / TILE_SIZE) * scale - 2, mapY + (extractionPoint.y / TILE_SIZE) * scale - 2, 5, 5);

    // Enemies
    for (const enemy of enemies) {
        if (isVisible(enemy.x, enemy.y)) {
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(mapX + (enemy.x / TILE_SIZE) * scale - 1, mapY + (enemy.y / TILE_SIZE) * scale - 1, 3, 3);
        }
    }

    // Player
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(mapX + (player.x / TILE_SIZE) * scale - 2, mapY + (player.y / TILE_SIZE) * scale - 2, 4, 4);

    ctx.strokeStyle = '#555';
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);
}

function renderDebug() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(10, 150, 180, 180);

    ctx.fillStyle = '#44ff44';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';

    const lines = [
        'DEBUG OVERLAY',
        '-------------',
        `Player: ${Math.floor(player.x)}, ${Math.floor(player.y)}`,
        `Health: ${player.health}/${player.maxHealth}`,
        `Bleeding: ${player.bleeding}`,
        `Stamina: ${Math.floor(player.stamina)}`,
        `Weapon: ${weapons[player.weapon].name}`,
        `Mag: ${weapons[player.weapon].mag}`,
        `Enemies: ${enemies.length}`,
        `Bullets: ${bullets.length}`,
        `Containers: ${containers.filter(c => !c.searched).length}`,
        `Extracting: ${gameState.extracting}`,
        `FPS: ${Math.round(1000 / 16)}`
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, 15, 165 + i * 13);
    });
}

function renderMenu() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.loot;
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RADIATED ZONE', canvas.width / 2, 150);

    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText('Extraction Shooter', canvas.width / 2, 180);

    ctx.fillStyle = COLORS.extraction;
    ctx.font = '18px monospace';
    ctx.fillText('PRESS SPACE TO START RAID', canvas.width / 2, 280);

    ctx.fillStyle = '#666';
    ctx.font = '11px monospace';
    const instructions = [
        'WASD - Move',
        'Mouse - Aim',
        'Left Click - Fire',
        'R - Reload',
        'E - Interact / Loot',
        'Shift - Sprint',
        '1 - Use Medkit',
        '2 - Use Bandage',
        '3-6 - Switch Weapons',
        'Q - Debug Overlay'
    ];

    instructions.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, 340 + i * 18);
    });

    ctx.fillStyle = '#555';
    ctx.fillText('Reach the extraction point to win!', canvas.width / 2, 560);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(20,10,10,0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RAID FAILED', canvas.width / 2, 200);

    ctx.fillStyle = '#888';
    ctx.font = '18px monospace';
    ctx.fillText(gameState.lostReason, canvas.width / 2, 260);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText(`Kills: ${gameState.kills}`, canvas.width / 2, 320);
    ctx.fillText(`Loot Value: $${gameState.lootValue}`, canvas.width / 2, 345);
    ctx.fillText(`Time Survived: ${Math.floor(gameState.raidTime / 60)}:${Math.floor(gameState.raidTime % 60).toString().padStart(2, '0')}`, canvas.width / 2, 370);

    ctx.fillStyle = COLORS.extraction;
    ctx.fillText('PRESS SPACE TO RETURN TO MENU', canvas.width / 2, 450);
}

function renderWin() {
    ctx.fillStyle = 'rgba(10,20,15,0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.extraction;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRACTED!', canvas.width / 2, 180);

    ctx.fillStyle = '#aaa';
    ctx.font = '16px monospace';
    ctx.fillText('You made it out alive.', canvas.width / 2, 230);

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`FINAL SCORE: ${gameState.score}`, canvas.width / 2, 300);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText(`Kills: ${gameState.kills}`, canvas.width / 2, 350);
    ctx.fillText(`Loot Value: $${gameState.lootValue}`, canvas.width / 2, 375);
    ctx.fillText(`Raid Time: ${Math.floor(gameState.raidTime / 60)}:${Math.floor(gameState.raidTime % 60).toString().padStart(2, '0')}`, canvas.width / 2, 400);

    ctx.fillStyle = COLORS.extraction;
    ctx.font = '14px monospace';
    ctx.fillText('PRESS SPACE TO RETURN TO MENU', canvas.width / 2, 480);
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
