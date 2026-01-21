// Zero Sievert Clone - Extraction Shooter
// MVP: Forest zone, 4 weapons, health+bleeding, 5 enemy types, extraction

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game constants
const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 40;
const VIEW_RANGE = 250;
const VISION_CONE_ANGLE = Math.PI / 2; // 90 degrees

// Game state
let gameState = 'menu'; // menu, playing, dead, extracted
let camera = { x: 0, y: 0 };
let keys = {};
let mouse = { x: 400, y: 300, down: false };
let score = 0;
let kills = 0;

// Weapons data
const WEAPONS = {
    pistol: { name: 'PM Pistol', damage: 18, fireRate: 300, magSize: 8, spread: 8, range: 150, pellets: 1 },
    smg: { name: 'Skorpion', damage: 14, fireRate: 100, magSize: 20, spread: 12, range: 120, pellets: 1 },
    shotgun: { name: 'Pump Shotgun', damage: 8, fireRate: 1000, magSize: 6, spread: 25, range: 80, pellets: 8 },
    rifle: { name: 'AK-74', damage: 28, fireRate: 133, magSize: 30, spread: 6, range: 200, pellets: 1 }
};

// Player
let player = {
    x: 0, y: 0,
    hp: 100, maxHp: 100,
    angle: 0,
    speed: 3,
    sprintSpeed: 5,
    weapon: 'pistol',
    ammo: 8,
    maxAmmo: 8,
    reloading: false,
    reloadTime: 0,
    lastShot: 0,
    bleeding: false,
    bleedTimer: 0,
    inventory: [],
    lootValue: 0
};

// Game objects
let enemies = [];
let bullets = [];
let lootContainers = [];
let buildings = [];
let trees = [];
let extractionPoint = { x: 0, y: 0 };
let map = [];

// Enemy types
const ENEMY_TYPES = {
    wolf: { hp: 40, damage: 15, speed: 3.5, range: 30, melee: true, color: '#666', size: 12 },
    boar: { hp: 80, damage: 20, speed: 2.5, range: 35, melee: true, color: '#654321', size: 16, charge: true },
    banditMelee: { hp: 60, damage: 12, speed: 2, range: 30, melee: true, color: '#8B4513', size: 14 },
    banditPistol: { hp: 60, damage: 15, speed: 1.5, range: 150, melee: false, color: '#556B2F', size: 14, fireRate: 800 },
    banditRifle: { hp: 80, damage: 25, speed: 1.2, range: 200, melee: false, color: '#2F4F4F', size: 14, fireRate: 500 }
};

// Loot types (2:1 healing to weapons ratio)
const LOOT_TYPES = [
    { type: 'bandage', name: 'Bandage', value: 50, heal: 20, stopBleed: true },
    { type: 'medkit', name: 'Medkit', value: 150, heal: 50, stopBleed: true },
    { type: 'bandage', name: 'Bandage', value: 50, heal: 20, stopBleed: true },
    { type: 'ration', name: 'Ration', value: 30 },
    { type: 'ammo', name: 'Ammo Box', value: 80, ammo: 30 },
    { type: 'rubles', name: 'Rubles', value: 200 },
    { type: 'medkit', name: 'Medkit', value: 150, heal: 50, stopBleed: true },
    { type: 'scrap', name: 'Scrap Metal', value: 100 },
    { type: 'bandage', name: 'Bandage', value: 50, heal: 20, stopBleed: true },
    { type: 'weapon_pistol', name: 'PM Pistol', value: 500, weapon: 'pistol' },
    { type: 'weapon_smg', name: 'Skorpion', value: 1200, weapon: 'smg' },
    { type: 'weapon_shotgun', name: 'Pump Shotgun', value: 1800, weapon: 'shotgun' },
    { type: 'weapon_rifle', name: 'AK-74', value: 3500, weapon: 'rifle' }
];

// Initialize game
function init() {
    generateMap();
    spawnPlayer();
    spawnEnemies();
    spawnLoot();
    placeExtraction();
    gameLoop();
}

function generateMap() {
    map = [];
    buildings = [];
    trees = [];

    // Create base terrain (forest)
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x] = { type: 'grass', walkable: true };
        }
    }

    // Add trees (dense forest)
    for (let i = 0; i < 150; i++) {
        const x = Math.floor(Math.random() * MAP_WIDTH);
        const y = Math.floor(Math.random() * MAP_HEIGHT);
        if (map[y][x].type === 'grass') {
            map[y][x] = { type: 'tree', walkable: false };
            trees.push({ x: x * TILE_SIZE + TILE_SIZE/2, y: y * TILE_SIZE + TILE_SIZE/2 });
        }
    }

    // Add buildings (4-6 buildings with interiors)
    const numBuildings = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numBuildings; i++) {
        const bw = 3 + Math.floor(Math.random() * 3);
        const bh = 3 + Math.floor(Math.random() * 3);
        const bx = 2 + Math.floor(Math.random() * (MAP_WIDTH - bw - 4));
        const by = 2 + Math.floor(Math.random() * (MAP_HEIGHT - bh - 4));

        // Clear area for building
        let canPlace = true;
        for (let dy = -1; dy <= bh; dy++) {
            for (let dx = -1; dx <= bw; dx++) {
                if (by + dy >= 0 && by + dy < MAP_HEIGHT && bx + dx >= 0 && bx + dx < MAP_WIDTH) {
                    if (map[by + dy][bx + dx].type === 'wall' || map[by + dy][bx + dx].type === 'floor') {
                        canPlace = false;
                    }
                }
            }
        }

        if (!canPlace) continue;

        // Create building
        const building = {
            x: bx * TILE_SIZE,
            y: by * TILE_SIZE,
            width: bw * TILE_SIZE,
            height: bh * TILE_SIZE,
            entered: false,
            doorX: bx + Math.floor(bw / 2),
            doorY: by + bh - 1
        };
        buildings.push(building);

        // Place walls and floor
        for (let dy = 0; dy < bh; dy++) {
            for (let dx = 0; dx < bw; dx++) {
                const tx = bx + dx;
                const ty = by + dy;
                if (dy === 0 || dy === bh - 1 || dx === 0 || dx === bw - 1) {
                    // Wall
                    map[ty][tx] = { type: 'wall', walkable: false };
                } else {
                    // Floor (interior)
                    map[ty][tx] = { type: 'floor', walkable: true, interior: true };
                }
            }
        }

        // Add door
        map[building.doorY][building.doorX] = { type: 'door', walkable: true, building: buildings.length - 1 };

        // Remove trees near building
        trees = trees.filter(t => {
            const dx = t.x - (building.x + building.width/2);
            const dy = t.y - (building.y + building.height/2);
            return Math.sqrt(dx*dx + dy*dy) > building.width;
        });
    }

    // Add paths between areas
    for (let i = 0; i < 5; i++) {
        const startX = Math.floor(Math.random() * MAP_WIDTH);
        const startY = Math.floor(Math.random() * MAP_HEIGHT);
        const endX = Math.floor(Math.random() * MAP_WIDTH);
        const endY = Math.floor(Math.random() * MAP_HEIGHT);

        let x = startX, y = startY;
        while (x !== endX || y !== endY) {
            if (map[y][x].type === 'tree' || map[y][x].type === 'grass') {
                map[y][x] = { type: 'path', walkable: true };
            }
            if (Math.random() < 0.5 && x !== endX) {
                x += x < endX ? 1 : -1;
            } else if (y !== endY) {
                y += y < endY ? 1 : -1;
            }
        }
    }
}

function spawnPlayer() {
    // Find a clear spawn point
    let spawned = false;
    while (!spawned) {
        const x = 2 + Math.floor(Math.random() * 5);
        const y = 2 + Math.floor(Math.random() * 5);
        if (map[y][x].walkable) {
            player.x = x * TILE_SIZE + TILE_SIZE / 2;
            player.y = y * TILE_SIZE + TILE_SIZE / 2;
            spawned = true;
        }
    }

    // Reset player stats
    player.hp = 100;
    player.weapon = 'pistol';
    player.ammo = WEAPONS.pistol.magSize;
    player.maxAmmo = WEAPONS.pistol.magSize;
    player.inventory = [];
    player.lootValue = 0;
    player.bleeding = false;
}

function spawnEnemies() {
    enemies = [];

    // Spawn wolves (5-8)
    for (let i = 0; i < 5 + Math.floor(Math.random() * 4); i++) {
        spawnEnemy('wolf');
    }

    // Spawn boars (3-5)
    for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
        spawnEnemy('boar');
    }

    // Spawn bandits (8-12)
    for (let i = 0; i < 8 + Math.floor(Math.random() * 5); i++) {
        const types = ['banditMelee', 'banditPistol', 'banditRifle'];
        spawnEnemy(types[Math.floor(Math.random() * types.length)]);
    }
}

function spawnEnemy(type) {
    let spawned = false;
    let attempts = 0;
    while (!spawned && attempts < 100) {
        const x = Math.floor(Math.random() * MAP_WIDTH);
        const y = Math.floor(Math.random() * MAP_HEIGHT);
        const dist = Math.sqrt(Math.pow(x * TILE_SIZE - player.x, 2) + Math.pow(y * TILE_SIZE - player.y, 2));

        if (map[y][x].walkable && !map[y][x].interior && dist > 200) {
            const data = ENEMY_TYPES[type];
            enemies.push({
                x: x * TILE_SIZE + TILE_SIZE / 2,
                y: y * TILE_SIZE + TILE_SIZE / 2,
                type: type,
                hp: data.hp,
                maxHp: data.hp,
                angle: Math.random() * Math.PI * 2,
                state: 'patrol',
                patrolTarget: null,
                lastShot: 0,
                chargeTimer: 0,
                visible: false
            });
            spawned = true;
        }
        attempts++;
    }
}

function spawnLoot() {
    lootContainers = [];

    // Spawn loot in buildings
    buildings.forEach((building, idx) => {
        const numLoot = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numLoot; i++) {
            const lx = building.x + TILE_SIZE + Math.random() * (building.width - TILE_SIZE * 2);
            const ly = building.y + TILE_SIZE + Math.random() * (building.height - TILE_SIZE * 2);
            const loot = LOOT_TYPES[Math.floor(Math.random() * LOOT_TYPES.length)];
            lootContainers.push({
                x: lx, y: ly,
                loot: { ...loot },
                opened: false,
                interior: true
            });
        }
    });

    // Spawn loot outdoors (crates, bodies)
    for (let i = 0; i < 15; i++) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 50) {
            const x = Math.floor(Math.random() * MAP_WIDTH);
            const y = Math.floor(Math.random() * MAP_HEIGHT);
            if (map[y][x].walkable && !map[y][x].interior) {
                const loot = LOOT_TYPES[Math.floor(Math.random() * LOOT_TYPES.length)];
                lootContainers.push({
                    x: x * TILE_SIZE + TILE_SIZE / 2,
                    y: y * TILE_SIZE + TILE_SIZE / 2,
                    loot: { ...loot },
                    opened: false,
                    interior: false
                });
                placed = true;
            }
            attempts++;
        }
    }
}

function placeExtraction() {
    // Place extraction point far from spawn
    let placed = false;
    while (!placed) {
        const x = MAP_WIDTH - 5 + Math.floor(Math.random() * 4);
        const y = MAP_HEIGHT - 5 + Math.floor(Math.random() * 4);
        if (map[y][x].walkable && !map[y][x].interior) {
            extractionPoint.x = x * TILE_SIZE + TILE_SIZE / 2;
            extractionPoint.y = y * TILE_SIZE + TILE_SIZE / 2;
            placed = true;
        }
    }
}

// Input handling
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'r' && gameState === 'playing') {
        startReload();
    }
    if (e.key.toLowerCase() === 'e' && gameState === 'playing') {
        interact();
    }
    if (e.key === ' ' && (gameState === 'menu' || gameState === 'dead' || gameState === 'extracted')) {
        startGame();
    }
    // Weapon switching with number keys
    if (gameState === 'playing') {
        if (e.key === '1') switchWeapon('pistol');
        if (e.key === '2') switchWeapon('smg');
        if (e.key === '3') switchWeapon('shotgun');
        if (e.key === '4') switchWeapon('rifle');
    }
});

document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', e => {
    if (e.button === 0) mouse.down = true;
});

canvas.addEventListener('mouseup', e => {
    if (e.button === 0) mouse.down = false;
});

function switchWeapon(weapon) {
    // Check if player has this weapon
    if (weapon === 'pistol' || player.inventory.some(i => i.weapon === weapon)) {
        player.weapon = weapon;
        player.maxAmmo = WEAPONS[weapon].magSize;
        player.ammo = Math.min(player.ammo, player.maxAmmo);
        player.reloading = false;
    }
}

function startReload() {
    if (!player.reloading && player.ammo < player.maxAmmo) {
        player.reloading = true;
        player.reloadTime = 60; // 1 second at 60fps
    }
}

function interact() {
    // Check for loot containers
    for (let container of lootContainers) {
        if (container.opened) continue;
        const dist = Math.sqrt(Math.pow(player.x - container.x, 2) + Math.pow(player.y - container.y, 2));
        if (dist < 40) {
            container.opened = true;
            const loot = container.loot;

            // Apply loot effects
            if (loot.heal) {
                player.hp = Math.min(player.maxHp, player.hp + loot.heal);
            }
            if (loot.stopBleed) {
                player.bleeding = false;
            }
            if (loot.ammo) {
                player.ammo = Math.min(player.maxAmmo, player.ammo + loot.ammo);
            }
            if (loot.weapon) {
                if (!player.inventory.some(i => i.weapon === loot.weapon)) {
                    player.inventory.push({ weapon: loot.weapon, name: loot.name });
                }
            }

            player.lootValue += loot.value;
            return;
        }
    }

    // Check for extraction
    const distToExtract = Math.sqrt(Math.pow(player.x - extractionPoint.x, 2) + Math.pow(player.y - extractionPoint.y, 2));
    if (distToExtract < 50) {
        extract();
    }
}

function extract() {
    score = player.lootValue + kills * 100;
    gameState = 'extracted';
}

function startGame() {
    gameState = 'playing';
    score = 0;
    kills = 0;
    generateMap();
    spawnPlayer();
    spawnEnemies();
    spawnLoot();
    placeExtraction();
}

// Update functions
function update() {
    if (gameState !== 'playing') return;

    updatePlayer();
    updateEnemies();
    updateBullets();
    updateCamera();
    checkExtraction();
}

function updatePlayer() {
    // Calculate angle to mouse
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Movement
    let dx = 0, dy = 0;
    if (keys['w']) dy = -1;
    if (keys['s']) dy = 1;
    if (keys['a']) dx = -1;
    if (keys['d']) dx = 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;

        const speed = keys['shift'] ? player.sprintSpeed : player.speed;
        const newX = player.x + dx * speed;
        const newY = player.y + dy * speed;

        // Collision check
        if (canMoveTo(newX, player.y)) player.x = newX;
        if (canMoveTo(player.x, newY)) player.y = newY;
    }

    // Shooting
    if (mouse.down && !player.reloading) {
        const weapon = WEAPONS[player.weapon];
        const now = Date.now();
        if (now - player.lastShot > weapon.fireRate && player.ammo > 0) {
            shoot();
            player.lastShot = now;
            player.ammo--;

            if (player.ammo <= 0) {
                startReload();
            }
        }
    }

    // Reloading
    if (player.reloading) {
        player.reloadTime--;
        if (player.reloadTime <= 0) {
            player.ammo = player.maxAmmo;
            player.reloading = false;
        }
    }

    // Bleeding
    if (player.bleeding) {
        player.bleedTimer++;
        if (player.bleedTimer >= 30) { // 2 HP per second
            player.hp -= 2;
            player.bleedTimer = 0;
        }
    }

    // Death check
    if (player.hp <= 0) {
        gameState = 'dead';
        score = Math.floor(player.lootValue * 0.5); // Lose half loot value on death
    }
}

function canMoveTo(x, y) {
    // Check map bounds
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
        return false;
    }

    // Check tile walkability
    if (!map[tileY][tileX].walkable) {
        return false;
    }

    return true;
}

function shoot() {
    const weapon = WEAPONS[player.weapon];

    for (let i = 0; i < weapon.pellets; i++) {
        const spreadRad = (weapon.spread * Math.PI / 180) * (Math.random() - 0.5);
        const angle = player.angle + spreadRad;

        bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * 12,
            vy: Math.sin(angle) * 12,
            damage: weapon.damage,
            range: weapon.range,
            traveled: 0,
            fromPlayer: true
        });
    }
}

function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.traveled += Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);

        // Check range
        if (bullet.traveled > bullet.range * 3) return false;

        // Check wall collision
        const tileX = Math.floor(bullet.x / TILE_SIZE);
        const tileY = Math.floor(bullet.y / TILE_SIZE);
        if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return false;
        if (!map[tileY][tileX].walkable) return false;

        // Check enemy collision (player bullets)
        if (bullet.fromPlayer) {
            for (let enemy of enemies) {
                const dist = Math.sqrt(Math.pow(bullet.x - enemy.x, 2) + Math.pow(bullet.y - enemy.y, 2));
                const size = ENEMY_TYPES[enemy.type].size;
                if (dist < size) {
                    enemy.hp -= bullet.damage;
                    enemy.state = 'chase'; // Alert enemy

                    if (enemy.hp <= 0) {
                        enemies = enemies.filter(e => e !== enemy);
                        kills++;
                        player.lootValue += 50; // Bounty
                    }
                    return false;
                }
            }
        } else {
            // Enemy bullet hitting player
            const dist = Math.sqrt(Math.pow(bullet.x - player.x, 2) + Math.pow(bullet.y - player.y, 2));
            if (dist < 15) {
                player.hp -= bullet.damage;
                if (Math.random() < 0.3) player.bleeding = true;
                return false;
            }
        }

        return true;
    });
}

function updateEnemies() {
    const now = Date.now();

    enemies.forEach(enemy => {
        const data = ENEMY_TYPES[enemy.type];
        const distToPlayer = Math.sqrt(Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2));
        const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);

        // Check if enemy can see player (within their vision cone)
        let angleDiff = Math.abs(normalizeAngle(angleToPlayer - enemy.angle));
        const canSeePlayer = angleDiff < Math.PI / 3 && distToPlayer < 200; // 60 degree cone, 200px range

        // Update enemy visibility (for player's vision cone)
        const playerAngleToEnemy = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        const playerAngleDiff = Math.abs(normalizeAngle(playerAngleToEnemy - player.angle));
        enemy.visible = playerAngleDiff < VISION_CONE_ANGLE / 2 && distToPlayer < VIEW_RANGE;

        // State machine
        if (enemy.state === 'patrol') {
            // Patrol behavior
            if (!enemy.patrolTarget || Math.random() < 0.01) {
                const angle = Math.random() * Math.PI * 2;
                enemy.patrolTarget = {
                    x: enemy.x + Math.cos(angle) * 100,
                    y: enemy.y + Math.sin(angle) * 100
                };
            }

            // Move toward patrol target
            const dx = enemy.patrolTarget.x - enemy.x;
            const dy = enemy.patrolTarget.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                enemy.angle = Math.atan2(dy, dx);
                const newX = enemy.x + (dx / dist) * data.speed * 0.5;
                const newY = enemy.y + (dy / dist) * data.speed * 0.5;
                if (canMoveTo(newX, enemy.y)) enemy.x = newX;
                if (canMoveTo(enemy.x, newY)) enemy.y = newY;
            }

            // Switch to chase if player spotted
            if (canSeePlayer || distToPlayer < 50) {
                enemy.state = 'chase';
            }
        } else if (enemy.state === 'chase') {
            // Face and move toward player
            enemy.angle = angleToPlayer;

            if (data.melee) {
                // Melee enemies chase directly
                if (distToPlayer > data.range) {
                    const speed = data.charge && distToPlayer < 150 ? data.speed * 2 : data.speed;
                    const newX = enemy.x + Math.cos(angleToPlayer) * speed;
                    const newY = enemy.y + Math.sin(angleToPlayer) * speed;
                    if (canMoveTo(newX, enemy.y)) enemy.x = newX;
                    if (canMoveTo(enemy.x, newY)) enemy.y = newY;
                } else {
                    // Attack
                    if (now - enemy.lastShot > 500) {
                        player.hp -= data.damage;
                        if (Math.random() < 0.3) player.bleeding = true;
                        enemy.lastShot = now;
                    }
                }
            } else {
                // Ranged enemies keep distance
                if (distToPlayer > data.range * 0.8) {
                    const newX = enemy.x + Math.cos(angleToPlayer) * data.speed;
                    const newY = enemy.y + Math.sin(angleToPlayer) * data.speed;
                    if (canMoveTo(newX, enemy.y)) enemy.x = newX;
                    if (canMoveTo(enemy.x, newY)) enemy.y = newY;
                } else if (distToPlayer < data.range * 0.5) {
                    // Back up
                    const newX = enemy.x - Math.cos(angleToPlayer) * data.speed;
                    const newY = enemy.y - Math.sin(angleToPlayer) * data.speed;
                    if (canMoveTo(newX, enemy.y)) enemy.x = newX;
                    if (canMoveTo(enemy.x, newY)) enemy.y = newY;
                }

                // Shoot
                if (now - enemy.lastShot > data.fireRate && canSeePlayer) {
                    const spread = 10 * Math.PI / 180;
                    bullets.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: Math.cos(angleToPlayer + (Math.random() - 0.5) * spread) * 8,
                        vy: Math.sin(angleToPlayer + (Math.random() - 0.5) * spread) * 8,
                        damage: data.damage,
                        range: data.range,
                        traveled: 0,
                        fromPlayer: false
                    });
                    enemy.lastShot = now;
                }
            }

            // Lose interest if far away
            if (distToPlayer > 400 && !canSeePlayer) {
                enemy.state = 'patrol';
            }
        }
    });
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function updateCamera() {
    // Center camera on player
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    // Clamp to map bounds
    camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - canvas.height, camera.y));
}

function checkExtraction() {
    const dist = Math.sqrt(Math.pow(player.x - extractionPoint.x, 2) + Math.pow(player.y - extractionPoint.y, 2));
    if (dist < 50) {
        // Show extract prompt in render
    }
}

// Render functions
function render() {
    // Clear
    ctx.fillStyle = '#1a2618';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'menu') {
        renderMenu();
        return;
    }

    if (gameState === 'dead') {
        renderDeath();
        return;
    }

    if (gameState === 'extracted') {
        renderExtracted();
        return;
    }

    // Render game world
    renderMap();
    renderLoot();
    renderExtraction();
    renderEnemies();
    renderPlayer();
    renderBullets();
    renderFogOfWar();
    renderHUD();
}

function renderMap() {
    const startX = Math.floor(camera.x / TILE_SIZE);
    const startY = Math.floor(camera.y / TILE_SIZE);
    const endX = Math.min(MAP_WIDTH, startX + Math.ceil(canvas.width / TILE_SIZE) + 2);
    const endY = Math.min(MAP_HEIGHT, startY + Math.ceil(canvas.height / TILE_SIZE) + 2);

    for (let y = Math.max(0, startY); y < endY; y++) {
        for (let x = Math.max(0, startX); x < endX; x++) {
            const tile = map[y][x];
            const screenX = x * TILE_SIZE - camera.x;
            const screenY = y * TILE_SIZE - camera.y;

            // Draw tile
            switch (tile.type) {
                case 'grass':
                    ctx.fillStyle = '#2d4a1c';
                    break;
                case 'path':
                    ctx.fillStyle = '#5a4a3a';
                    break;
                case 'tree':
                    ctx.fillStyle = '#1a3510';
                    break;
                case 'wall':
                    ctx.fillStyle = '#555';
                    break;
                case 'floor':
                    ctx.fillStyle = '#6a5a4a';
                    break;
                case 'door':
                    ctx.fillStyle = '#8b4513';
                    break;
                default:
                    ctx.fillStyle = '#333';
            }
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Draw tree tops
            if (tile.type === 'tree') {
                ctx.fillStyle = '#0a2808';
                ctx.beginPath();
                ctx.arc(screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, TILE_SIZE/2 + 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw door indicator
            if (tile.type === 'door') {
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 2;
                ctx.strokeRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            }
        }
    }
}

function renderLoot() {
    lootContainers.forEach(container => {
        if (container.opened) return;

        const screenX = container.x - camera.x;
        const screenY = container.y - camera.y;

        // Check if in vision
        const dist = Math.sqrt(Math.pow(container.x - player.x, 2) + Math.pow(container.y - player.y, 2));
        const angle = Math.atan2(container.y - player.y, container.x - player.x);
        const angleDiff = Math.abs(normalizeAngle(angle - player.angle));

        if (angleDiff > VISION_CONE_ANGLE / 2 || dist > VIEW_RANGE) return;

        // Draw crate
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(screenX - 10, screenY - 10, 20, 20);
        ctx.strokeStyle = '#654321';
        ctx.strokeRect(screenX - 10, screenY - 10, 20, 20);

        // Interaction indicator
        if (dist < 40) {
            ctx.fillStyle = '#ffd700';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('[E] ' + container.loot.name, screenX, screenY - 20);
        }
    });
}

function renderExtraction() {
    const screenX = extractionPoint.x - camera.x;
    const screenY = extractionPoint.y - camera.y;

    // Pulsing green circle
    const pulse = Math.sin(Date.now() / 200) * 5 + 40;

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(screenX, screenY, pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(screenX, screenY, 40, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = '#00ff00';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRACTION', screenX, screenY - 50);

    // Distance indicator
    const dist = Math.sqrt(Math.pow(player.x - extractionPoint.x, 2) + Math.pow(player.y - extractionPoint.y, 2));
    if (dist < 50) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText('[E] to Extract', screenX, screenY + 60);
    }
}

function renderEnemies() {
    enemies.forEach(enemy => {
        if (!enemy.visible) return;

        const screenX = enemy.x - camera.x;
        const screenY = enemy.y - camera.y;
        const data = ENEMY_TYPES[enemy.type];

        // Body
        ctx.fillStyle = data.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, data.size, 0, Math.PI * 2);
        ctx.fill();

        // Direction indicator
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(screenX + Math.cos(enemy.angle) * data.size, screenY + Math.sin(enemy.angle) * data.size);
        ctx.stroke();

        // HP bar
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX - 15, screenY - data.size - 10, 30, 4);
        ctx.fillStyle = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
        ctx.fillRect(screenX - 15, screenY - data.size - 10, 30 * hpPercent, 4);
    });
}

function renderPlayer() {
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;

    // Body
    ctx.fillStyle = '#4a7c4e';
    ctx.beginPath();
    ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Direction indicator (gun)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(screenX + Math.cos(player.angle) * 20, screenY + Math.sin(player.angle) * 20);
    ctx.stroke();

    // Bleeding indicator
    if (player.bleeding) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
        ctx.fill();
    }
}

function renderBullets() {
    ctx.fillStyle = '#ff0';
    bullets.forEach(bullet => {
        const screenX = bullet.x - camera.x;
        const screenY = bullet.y - camera.y;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function renderFogOfWar() {
    // Create fog gradient outside vision cone
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;

    ctx.save();

    // Draw full fog
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cut out vision cone
    ctx.globalCompositeOperation = 'destination-out';

    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    const startAngle = player.angle - VISION_CONE_ANGLE / 2;
    const endAngle = player.angle + VISION_CONE_ANGLE / 2;
    ctx.arc(screenX, screenY, VIEW_RANGE, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();

    // Add gradient for smooth edge
    const gradient = ctx.createRadialGradient(screenX, screenY, VIEW_RANGE - 50, screenX, screenY, VIEW_RANGE);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, VIEW_RANGE, startAngle, endAngle);
    ctx.lineTo(screenX, screenY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function renderHUD() {
    // Top bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, 40);

    // Health
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 10, 150, 20);
    const hpPercent = player.hp / player.maxHp;
    ctx.fillStyle = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
    ctx.fillRect(10, 10, 150 * hpPercent, 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 150, 20);

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, 15, 25);

    // Bleeding indicator
    if (player.bleeding) {
        ctx.fillStyle = '#f00';
        ctx.fillText('BLEEDING', 170, 25);
    }

    // Weapon & ammo
    const weapon = WEAPONS[player.weapon];
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(`${weapon.name}: ${player.ammo}/${player.maxAmmo}`, canvas.width - 10, 25);

    if (player.reloading) {
        ctx.fillStyle = '#ff0';
        ctx.fillText('RELOADING...', canvas.width - 10, 38);
    }

    // Bottom bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // Loot value
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'left';
    ctx.fillText(`Loot: ${player.lootValue} rubles`, 10, canvas.height - 30);

    // Kills
    ctx.fillStyle = '#f00';
    ctx.fillText(`Kills: ${kills}`, 10, canvas.height - 10);

    // Extraction distance
    const dist = Math.floor(Math.sqrt(Math.pow(player.x - extractionPoint.x, 2) + Math.pow(player.y - extractionPoint.y, 2)));
    ctx.fillStyle = '#0f0';
    ctx.textAlign = 'right';
    ctx.fillText(`Extract: ${dist}m`, canvas.width - 10, canvas.height - 30);

    // Extraction direction arrow
    const angle = Math.atan2(extractionPoint.y - player.y, extractionPoint.x - player.x);
    const arrowX = canvas.width - 50;
    const arrowY = canvas.height - 25;
    ctx.save();
    ctx.translate(arrowX, arrowY);
    ctx.rotate(angle);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-5, -8);
    ctx.lineTo(-5, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Weapon slots
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '10px monospace';
    const weapons = ['pistol', 'smg', 'shotgun', 'rifle'];
    weapons.forEach((w, i) => {
        const hasWeapon = w === 'pistol' || player.inventory.some(item => item.weapon === w);
        ctx.fillStyle = hasWeapon ? (w === player.weapon ? '#0f0' : '#888') : '#333';
        ctx.fillText(`[${i + 1}]${WEAPONS[w].name.substring(0, 3)}`, 200 + i * 70, canvas.height - 15);
    });

    // Controls reminder
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WASD:Move | Mouse:Aim | LMB:Shoot | R:Reload | E:Interact | Shift:Sprint', canvas.width / 2, canvas.height - 38);
}

function renderMenu() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#c0c0c0';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ZERO SIEVERT', canvas.width / 2, 150);

    ctx.fillStyle = '#666';
    ctx.font = '20px monospace';
    ctx.fillText('Extraction Zone', canvas.width / 2, 190);

    // Instructions
    ctx.fillStyle = '#888';
    ctx.font = '16px monospace';
    const instructions = [
        'WASD - Move',
        'Mouse - Aim',
        'Left Click - Shoot',
        'R - Reload',
        'E - Interact / Loot / Extract',
        'Shift - Sprint',
        '1-4 - Switch Weapons',
        '',
        'Explore the forest zone',
        'Loot containers for supplies',
        'Kill enemies for bounties',
        'Reach the extraction point to win!'
    ];

    instructions.forEach((text, i) => {
        ctx.fillText(text, canvas.width / 2, 250 + i * 25);
    });

    // Start prompt
    ctx.fillStyle = '#0f0';
    ctx.font = '24px monospace';
    const pulse = Math.sin(Date.now() / 300) > 0;
    if (pulse) {
        ctx.fillText('Press SPACE to Deploy', canvas.width / 2, 550);
    }
}

function renderDeath() {
    ctx.fillStyle = 'rgba(80, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('KIA', canvas.width / 2, 200);

    ctx.fillStyle = '#888';
    ctx.font = '20px monospace';
    ctx.fillText('You died in the zone', canvas.width / 2, 260);

    ctx.fillStyle = '#ffd700';
    ctx.font = '24px monospace';
    ctx.fillText(`Loot Lost: ${player.lootValue} rubles`, canvas.width / 2, 320);
    ctx.fillText(`Kills: ${kills}`, canvas.width / 2, 360);
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, 420);

    ctx.fillStyle = '#0f0';
    ctx.font = '20px monospace';
    const pulse = Math.sin(Date.now() / 300) > 0;
    if (pulse) {
        ctx.fillText('Press SPACE to Try Again', canvas.width / 2, 520);
    }
}

function renderExtracted() {
    ctx.fillStyle = 'rgba(0, 50, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRACTED', canvas.width / 2, 200);

    ctx.fillStyle = '#888';
    ctx.font = '20px monospace';
    ctx.fillText('Mission Successful', canvas.width / 2, 260);

    ctx.fillStyle = '#ffd700';
    ctx.font = '24px monospace';
    ctx.fillText(`Loot Value: ${player.lootValue} rubles`, canvas.width / 2, 320);
    ctx.fillText(`Kills: ${kills} (+${kills * 100} bonus)`, canvas.width / 2, 360);
    ctx.fillText(`Total Score: ${score}`, canvas.width / 2, 420);

    // Show inventory
    ctx.fillStyle = '#888';
    ctx.font = '16px monospace';
    ctx.fillText('Weapons Collected:', canvas.width / 2, 470);
    const weaponsFound = player.inventory.filter(i => i.weapon).map(i => i.name);
    ctx.fillText(weaponsFound.length > 0 ? weaponsFound.join(', ') : 'None', canvas.width / 2, 495);

    ctx.fillStyle = '#0f0';
    ctx.font = '20px monospace';
    const pulse = Math.sin(Date.now() / 300) > 0;
    if (pulse) {
        ctx.fillText('Press SPACE for Next Raid', canvas.width / 2, 560);
    }
}

// Game loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Start
init();
