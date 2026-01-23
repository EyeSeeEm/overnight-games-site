// Zero Sievert Clone - Canvas Implementation
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 40;
const VIEW_RANGE = 250;
const VISION_CONE_ANGLE = Math.PI / 2; // 90 degrees

// Weapon definitions
const WEAPONS = {
    pistol: { name: 'PM Pistol', damage: 18, fireRate: 300, range: 150, spread: 8, magSize: 8, reloadTime: 1500 },
    smg: { name: 'Skorpion', damage: 14, fireRate: 100, range: 120, spread: 12, magSize: 20, reloadTime: 2000 },
    shotgun: { name: 'Pump Shotgun', damage: 8, fireRate: 1000, range: 80, spread: 25, pellets: 8, magSize: 6, reloadTime: 3000 },
    rifle: { name: 'AK-74', damage: 28, fireRate: 150, range: 200, spread: 6, magSize: 30, reloadTime: 2500 }
};

// Enemy types
const ENEMY_TYPES = {
    wolf: { name: 'Wolf', hp: 40, damage: 15, speed: 2.5, color: '#666688', type: 'melee', aggro: 150 },
    boar: { name: 'Boar', hp: 80, damage: 20, speed: 1.8, color: '#886644', type: 'charge', aggro: 100 },
    banditMelee: { name: 'Bandit', hp: 60, damage: 12, speed: 1.5, color: '#aa6644', type: 'melee', aggro: 200 },
    banditPistol: { name: 'Bandit (Pistol)', hp: 60, damage: 15, speed: 1.2, color: '#cc8866', type: 'ranged', fireRate: 800, aggro: 250 },
    banditRifle: { name: 'Bandit (Rifle)', hp: 80, damage: 25, speed: 1.0, color: '#aa8844', type: 'ranged', fireRate: 400, aggro: 300 }
};

// Game state
let gameState = 'menu';
let map = [];
let player = null;
let enemies = [];
let bullets = [];
let lootContainers = [];
let bloodSplatters = [];
let particles = [];
let extractionPoint = null;
let camera = { x: 0, y: 0 };
let mouseX = 0, mouseY = 0;
let keys = {};
let score = 0;
let kills = 0;
let lootCollected = 0;
let showDebug = false;
let lastFireTime = 0;
let gameTime = 0;

// Initialize game
function init() {
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) keys.mouse = true;
    });

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) keys.mouse = false;
    });

    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        if (e.key === 'q') showDebug = !showDebug;
        if (gameState === 'menu' && e.key === ' ') startGame();
        if (gameState === 'gameover' && e.key === 'r') startGame();
        if (gameState === 'extracted' && e.key === 'r') startGame();
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameState = 'playing';
    score = 0;
    kills = 0;
    lootCollected = 0;
    gameTime = 0;

    generateMap();
    spawnPlayer();
    spawnEnemies();
    spawnLoot();
    placeExtraction();
}

function generateMap() {
    map = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Base terrain
            let tile = { type: 'grass', walkable: true, color: '#2a4a2a' };

            // Random variation
            if (Math.random() < 0.3) {
                tile.color = (x + y) % 2 === 0 ? '#2a4a2a' : '#1a3a1a';
            }

            // Dirt paths
            if ((x >= 18 && x <= 22) || (y >= 18 && y <= 22)) {
                tile = { type: 'dirt', walkable: true, color: '#4a3a2a' };
            }

            map[y][x] = tile;
        }
    }

    // Add buildings
    addBuilding(5, 5, 6, 5);
    addBuilding(25, 8, 5, 4);
    addBuilding(10, 25, 7, 5);
    addBuilding(30, 28, 5, 6);
    addBuilding(3, 32, 4, 4);

    // Add trees
    for (let i = 0; i < 80; i++) {
        const x = Math.floor(Math.random() * MAP_WIDTH);
        const y = Math.floor(Math.random() * MAP_HEIGHT);
        if (map[y][x].walkable && map[y][x].type !== 'floor') {
            map[y][x] = { type: 'tree', walkable: false, color: '#1a3a1a' };
        }
    }

    // Add bushes (cover)
    for (let i = 0; i < 40; i++) {
        const x = Math.floor(Math.random() * MAP_WIDTH);
        const y = Math.floor(Math.random() * MAP_HEIGHT);
        if (map[y][x].walkable && map[y][x].type === 'grass') {
            map[y][x] = { type: 'bush', walkable: true, color: '#3a5a3a', cover: 30 };
        }
    }
}

function addBuilding(startX, startY, width, height) {
    for (let y = startY; y < startY + height && y < MAP_HEIGHT; y++) {
        for (let x = startX; x < startX + width && x < MAP_WIDTH; x++) {
            if (x === startX || x === startX + width - 1 || y === startY || y === startY + height - 1) {
                // Door in the middle of bottom wall
                if (y === startY + height - 1 && x === startX + Math.floor(width / 2)) {
                    map[y][x] = { type: 'door', walkable: true, color: '#5a4a3a' };
                } else {
                    map[y][x] = { type: 'wall', walkable: false, color: '#4a4a5a' };
                }
            } else {
                map[y][x] = { type: 'floor', walkable: true, color: '#5a5a6a' };
            }
        }
    }
}

function spawnPlayer() {
    player = {
        x: 2 * TILE_SIZE + TILE_SIZE / 2,
        y: 2 * TILE_SIZE + TILE_SIZE / 2,
        speed: 3,
        hp: 100,
        maxHp: 100,
        stamina: 100,
        maxStamina: 100,
        angle: 0,
        weapon: { ...WEAPONS.pistol, currentAmmo: 8 },
        inventory: [
            { type: 'weapon', weapon: { ...WEAPONS.pistol, currentAmmo: 8 } },
            { type: 'weapon', weapon: { ...WEAPONS.smg, currentAmmo: 20 } }
        ],
        currentWeaponIndex: 0,
        bleeding: 0,
        reloading: false,
        reloadStart: 0
    };

    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
}

function spawnEnemies() {
    enemies = [];

    // Wolves (pack near trees)
    for (let i = 0; i < 5; i++) {
        spawnEnemy('wolf', 8 + Math.random() * 10, 8 + Math.random() * 10);
    }

    // Boars
    for (let i = 0; i < 3; i++) {
        spawnEnemy('boar', 30 + Math.random() * 8, 5 + Math.random() * 8);
    }

    // Bandits around buildings
    spawnEnemy('banditMelee', 8, 12);
    spawnEnemy('banditPistol', 27, 10);
    spawnEnemy('banditRifle', 12, 28);
    spawnEnemy('banditPistol', 32, 30);
    spawnEnemy('banditMelee', 5, 34);

    // More bandits patrolling
    for (let i = 0; i < 4; i++) {
        const types = ['banditMelee', 'banditPistol', 'banditRifle'];
        spawnEnemy(types[Math.floor(Math.random() * types.length)],
            5 + Math.random() * 30, 5 + Math.random() * 30);
    }
}

function spawnEnemy(type, tileX, tileY) {
    const def = ENEMY_TYPES[type];
    enemies.push({
        x: tileX * TILE_SIZE + TILE_SIZE / 2,
        y: tileY * TILE_SIZE + TILE_SIZE / 2,
        type: type,
        hp: def.hp,
        maxHp: def.hp,
        speed: def.speed,
        damage: def.damage,
        color: def.color,
        behavior: def.type,
        fireRate: def.fireRate || 0,
        lastFire: 0,
        aggro: def.aggro,
        angle: Math.random() * Math.PI * 2,
        state: 'idle',
        alertTimer: 0
    });
}

function spawnLoot() {
    lootContainers = [];
    bloodSplatters = [];
    bullets = [];
    particles = [];

    // Loot in buildings (healing prioritized)
    const lootPositions = [
        { x: 7, y: 7, items: ['medkit', 'bandage', 'bandage'] },
        { x: 26, y: 9, items: ['bandage', 'ammo', 'medkit'] },
        { x: 12, y: 27, items: ['weapon_smg', 'ammo', 'bandage'] },
        { x: 31, y: 30, items: ['medkit', 'bandage', 'ammo'] },
        { x: 4, y: 33, items: ['weapon_rifle', 'ammo', 'bandage'] }
    ];

    for (const pos of lootPositions) {
        lootContainers.push({
            x: pos.x * TILE_SIZE + TILE_SIZE / 2,
            y: pos.y * TILE_SIZE + TILE_SIZE / 2,
            items: pos.items,
            opened: false
        });
    }

    // Random outdoor loot
    for (let i = 0; i < 10; i++) {
        const x = Math.floor(Math.random() * MAP_WIDTH);
        const y = Math.floor(Math.random() * MAP_HEIGHT);
        if (map[y][x].walkable) {
            const items = Math.random() < 0.6 ?
                ['bandage', 'bandage'] :
                ['ammo', 'bandage'];
            lootContainers.push({
                x: x * TILE_SIZE + TILE_SIZE / 2,
                y: y * TILE_SIZE + TILE_SIZE / 2,
                items: items,
                opened: false
            });
        }
    }
}

function placeExtraction() {
    // Extraction at opposite corner from player
    extractionPoint = {
        x: (MAP_WIDTH - 3) * TILE_SIZE,
        y: (MAP_HEIGHT - 3) * TILE_SIZE,
        radius: 40,
        timer: 0,
        extracting: false
    };
}

function update(dt) {
    if (gameState !== 'playing') return;

    gameTime += dt;

    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    updateCamera();
    checkExtraction(dt);

    // Bleeding damage
    if (player.bleeding > 0) {
        player.hp -= player.bleeding * dt / 1000;
        player.bleeding -= dt / 5000; // Bleeding slowly stops
        if (player.bleeding < 0) player.bleeding = 0;
    }

    // Check death
    if (player.hp <= 0) {
        gameState = 'gameover';
    }
}

function updatePlayer(dt) {
    // Calculate angle to mouse
    const worldMouseX = mouseX + camera.x;
    const worldMouseY = mouseY + camera.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Movement
    let dx = 0, dy = 0;
    let speed = player.speed;

    if (keys['shift'] && player.stamina > 0) {
        speed *= 1.5;
        player.stamina -= dt / 20;
    } else if (player.stamina < player.maxStamina) {
        player.stamina += dt / 50;
    }

    if (keys['w']) dy -= speed;
    if (keys['s']) dy += speed;
    if (keys['a']) dx -= speed;
    if (keys['d']) dx += speed;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Apply movement with collision
    const newX = player.x + dx;
    const newY = player.y + dy;

    if (canMoveTo(newX, player.y)) player.x = newX;
    if (canMoveTo(player.x, newY)) player.y = newY;

    // Reload
    if (keys['r'] && !player.reloading && player.weapon.currentAmmo < player.weapon.magSize) {
        player.reloading = true;
        player.reloadStart = Date.now();
    }

    if (player.reloading && Date.now() - player.reloadStart >= player.weapon.reloadTime) {
        player.weapon.currentAmmo = player.weapon.magSize;
        player.reloading = false;
    }

    // Shooting
    if (keys.mouse && !player.reloading) {
        const now = Date.now();
        if (now - lastFireTime >= player.weapon.fireRate && player.weapon.currentAmmo > 0) {
            fireWeapon();
            lastFireTime = now;
        }
    }

    // Interact with loot
    if (keys['e']) {
        keys['e'] = false; // Prevent continuous trigger
        interactWithLoot();
    }

    // Switch weapons (1-4)
    if (keys['1']) switchWeapon('pistol');
    if (keys['2']) switchWeapon('smg');
    if (keys['3']) switchWeapon('shotgun');
    if (keys['4']) switchWeapon('rifle');
}

function canMoveTo(x, y) {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    // Check bounds
    if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return false;

    // Check tile
    return map[tileY][tileX].walkable;
}

function fireWeapon() {
    player.weapon.currentAmmo--;

    const pellets = player.weapon.pellets || 1;

    for (let i = 0; i < pellets; i++) {
        const spreadRad = (player.weapon.spread * Math.PI / 180) * (Math.random() - 0.5);
        const angle = player.angle + spreadRad;

        bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * 15,
            vy: Math.sin(angle) * 15,
            damage: player.weapon.damage,
            range: player.weapon.range,
            traveled: 0,
            fromPlayer: true
        });
    }

    // Muzzle flash particle
    particles.push({
        x: player.x + Math.cos(player.angle) * 15,
        y: player.y + Math.sin(player.angle) * 15,
        type: 'muzzleFlash',
        life: 50
    });
}

function switchWeapon(type) {
    if (WEAPONS[type]) {
        const found = player.inventory.find(item =>
            item.type === 'weapon' && item.weapon.name === WEAPONS[type].name);
        if (found) {
            player.weapon = found.weapon;
            player.reloading = false;
        }
    }
}

function interactWithLoot() {
    for (const container of lootContainers) {
        if (container.opened) continue;

        const dist = distance(player.x, player.y, container.x, container.y);
        if (dist < 40) {
            container.opened = true;

            for (const item of container.items) {
                if (item === 'medkit') {
                    player.hp = Math.min(player.maxHp, player.hp + 50);
                    player.bleeding = 0;
                    score += 100;
                } else if (item === 'bandage') {
                    player.hp = Math.min(player.maxHp, player.hp + 20);
                    player.bleeding = Math.max(0, player.bleeding - 1);
                    score += 50;
                } else if (item === 'ammo') {
                    player.weapon.currentAmmo = player.weapon.magSize;
                    score += 30;
                } else if (item === 'weapon_smg') {
                    player.inventory.push({ type: 'weapon', weapon: { ...WEAPONS.smg, currentAmmo: 20 } });
                    score += 200;
                } else if (item === 'weapon_shotgun') {
                    player.inventory.push({ type: 'weapon', weapon: { ...WEAPONS.shotgun, currentAmmo: 6 } });
                    score += 300;
                } else if (item === 'weapon_rifle') {
                    player.inventory.push({ type: 'weapon', weapon: { ...WEAPONS.rifle, currentAmmo: 30 } });
                    score += 500;
                }
            }

            lootCollected++;
            break;
        }
    }
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        const dist = distance(enemy.x, enemy.y, player.x, player.y);
        const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);

        // Check if enemy can see player (within their vision cone)
        const angleDiff = normalizeAngle(angleToPlayer - enemy.angle);
        const canSeePlayer = dist < enemy.aggro && Math.abs(angleDiff) < VISION_CONE_ANGLE / 2;

        if (canSeePlayer) {
            enemy.state = 'alert';
            enemy.alertTimer = 3000; // Stay alert for 3 seconds
            enemy.angle = angleToPlayer;

            if (enemy.behavior === 'melee' || enemy.behavior === 'charge') {
                // Move toward player
                if (dist > 30) {
                    enemy.x += Math.cos(angleToPlayer) * enemy.speed;
                    enemy.y += Math.sin(angleToPlayer) * enemy.speed;
                } else {
                    // Attack
                    player.hp -= enemy.damage * dt / 1000;
                    if (Math.random() < 0.3) player.bleeding += 0.5;
                }
            } else if (enemy.behavior === 'ranged') {
                // Move to comfortable range
                if (dist > 150) {
                    enemy.x += Math.cos(angleToPlayer) * enemy.speed;
                    enemy.y += Math.sin(angleToPlayer) * enemy.speed;
                } else if (dist < 80) {
                    enemy.x -= Math.cos(angleToPlayer) * enemy.speed;
                    enemy.y -= Math.sin(angleToPlayer) * enemy.speed;
                }

                // Shoot
                const now = Date.now();
                if (now - enemy.lastFire >= enemy.fireRate) {
                    enemyFire(enemy);
                    enemy.lastFire = now;
                }
            }
        } else if (enemy.alertTimer > 0) {
            enemy.alertTimer -= dt;
            // Last known position movement
            enemy.x += Math.cos(enemy.angle) * enemy.speed * 0.5;
            enemy.y += Math.sin(enemy.angle) * enemy.speed * 0.5;
        } else {
            enemy.state = 'idle';
            // Random patrol
            if (Math.random() < 0.01) {
                enemy.angle = Math.random() * Math.PI * 2;
            }
            enemy.x += Math.cos(enemy.angle) * enemy.speed * 0.3;
            enemy.y += Math.sin(enemy.angle) * enemy.speed * 0.3;
        }

        // Keep in bounds
        enemy.x = Math.max(TILE_SIZE, Math.min((MAP_WIDTH - 1) * TILE_SIZE, enemy.x));
        enemy.y = Math.max(TILE_SIZE, Math.min((MAP_HEIGHT - 1) * TILE_SIZE, enemy.y));
    }
}

function enemyFire(enemy) {
    const angle = enemy.angle + (Math.random() - 0.5) * 0.3;
    bullets.push({
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * 10,
        vy: Math.sin(angle) * 10,
        damage: enemy.damage,
        range: 200,
        traveled: 0,
        fromPlayer: false
    });
}

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.traveled += Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);

        // Check range
        if (bullet.traveled > bullet.range) {
            bullets.splice(i, 1);
            continue;
        }

        // Check wall collision
        const tileX = Math.floor(bullet.x / TILE_SIZE);
        const tileY = Math.floor(bullet.y / TILE_SIZE);
        if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT ||
            !map[tileY][tileX].walkable) {
            bullets.splice(i, 1);
            continue;
        }

        // Check enemy collision (player bullets)
        if (bullet.fromPlayer) {
            for (const enemy of enemies) {
                if (enemy.hp <= 0) continue;
                if (distance(bullet.x, bullet.y, enemy.x, enemy.y) < 15) {
                    enemy.hp -= bullet.damage;

                    // Blood splatter
                    bloodSplatters.push({
                        x: bullet.x,
                        y: bullet.y,
                        size: 5 + Math.random() * 10
                    });

                    if (enemy.hp <= 0) {
                        kills++;
                        score += 150;

                        // More blood on death
                        for (let j = 0; j < 5; j++) {
                            bloodSplatters.push({
                                x: enemy.x + (Math.random() - 0.5) * 20,
                                y: enemy.y + (Math.random() - 0.5) * 20,
                                size: 8 + Math.random() * 15
                            });
                        }
                    }

                    bullets.splice(i, 1);
                    break;
                }
            }
        } else {
            // Check player collision (enemy bullets)
            if (distance(bullet.x, bullet.y, player.x, player.y) < 12) {
                player.hp -= bullet.damage;
                if (Math.random() < 0.4) player.bleeding += 1;

                bloodSplatters.push({
                    x: bullet.x,
                    y: bullet.y,
                    size: 5 + Math.random() * 8
                });

                bullets.splice(i, 1);
            }
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].life -= dt;
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updateCamera() {
    const targetX = player.x - canvas.width / 2;
    const targetY = player.y - canvas.height / 2;

    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;

    // Clamp to map bounds
    camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - canvas.height, camera.y));
}

function checkExtraction(dt) {
    const dist = distance(player.x, player.y,
        extractionPoint.x + TILE_SIZE / 2,
        extractionPoint.y + TILE_SIZE / 2);

    if (dist < extractionPoint.radius) {
        extractionPoint.extracting = true;
        extractionPoint.timer += dt;

        if (extractionPoint.timer >= 3000) {
            gameState = 'extracted';
            score += 500; // Extraction bonus
        }
    } else {
        extractionPoint.extracting = false;
        extractionPoint.timer = 0;
    }
}

function render() {
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'menu') {
        renderMenu();
        return;
    }

    if (gameState === 'gameover') {
        renderGameOver();
        return;
    }

    if (gameState === 'extracted') {
        renderExtracted();
        return;
    }

    // Save context for camera transform
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    renderMap();
    renderBlood();
    renderLoot();
    renderExtraction();
    renderEnemies();
    renderPlayer();
    renderBullets();
    renderParticles();

    ctx.restore();

    renderHUD();
    if (showDebug) renderDebug();
}

function renderMap() {
    const startX = Math.floor(camera.x / TILE_SIZE);
    const startY = Math.floor(camera.y / TILE_SIZE);
    const endX = Math.min(MAP_WIDTH, startX + Math.ceil(canvas.width / TILE_SIZE) + 2);
    const endY = Math.min(MAP_HEIGHT, startY + Math.ceil(canvas.height / TILE_SIZE) + 2);

    for (let y = Math.max(0, startY); y < endY; y++) {
        for (let x = Math.max(0, startX); x < endX; x++) {
            const tile = map[y][x];
            const screenX = x * TILE_SIZE;
            const screenY = y * TILE_SIZE;

            // Check if in player's vision cone
            const tileCenter = { x: screenX + TILE_SIZE / 2, y: screenY + TILE_SIZE / 2 };
            const dist = distance(player.x, player.y, tileCenter.x, tileCenter.y);
            const angleToTile = Math.atan2(tileCenter.y - player.y, tileCenter.x - player.x);
            const angleDiff = normalizeAngle(angleToTile - player.angle);
            const inVisionCone = Math.abs(angleDiff) < VISION_CONE_ANGLE / 2;
            const inRange = dist < VIEW_RANGE;

            let visibility = 0;
            if (inRange) {
                if (inVisionCone) {
                    visibility = 1 - (dist / VIEW_RANGE) * 0.3;
                } else {
                    visibility = 0.3 - (dist / VIEW_RANGE) * 0.2;
                }
            }

            // Draw tile
            ctx.fillStyle = tile.color;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Tree details
            if (tile.type === 'tree') {
                ctx.fillStyle = '#0a2a0a';
                ctx.beginPath();
                ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 12, 0, Math.PI * 2);
                ctx.fill();
            }

            // Bush details
            if (tile.type === 'bush') {
                ctx.fillStyle = '#4a6a4a';
                ctx.beginPath();
                ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 8, 0, Math.PI * 2);
                ctx.fill();
            }

            // Fog of war
            if (visibility < 1) {
                ctx.fillStyle = `rgba(10, 10, 20, ${1 - visibility})`;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

function renderBlood() {
    for (const blood of bloodSplatters) {
        ctx.fillStyle = '#882222';
        ctx.beginPath();
        ctx.arc(blood.x, blood.y, blood.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function renderLoot() {
    for (const container of lootContainers) {
        if (!isVisible(container.x, container.y)) continue;

        ctx.fillStyle = container.opened ? '#3a3a3a' : '#8a6a4a';
        ctx.fillRect(container.x - 10, container.y - 10, 20, 20);

        if (!container.opened) {
            ctx.strokeStyle = '#aa8a5a';
            ctx.lineWidth = 2;
            ctx.strokeRect(container.x - 10, container.y - 10, 20, 20);
        }
    }
}

function renderExtraction() {
    const ex = extractionPoint.x + TILE_SIZE / 2;
    const ey = extractionPoint.y + TILE_SIZE / 2;

    // Pulsing green circle
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    ctx.strokeStyle = `rgba(68, 255, 68, ${pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ex, ey, extractionPoint.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Progress bar when extracting
    if (extractionPoint.extracting) {
        const progress = extractionPoint.timer / 3000;
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(ex - 25, ey - 50, 50 * progress, 8);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(ex - 25, ey - 50, 50, 8);
    }

    // Label
    ctx.fillStyle = '#44ff44';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRACT', ex, ey + extractionPoint.radius + 15);
}

function renderEnemies() {
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        if (!isVisible(enemy.x, enemy.y)) continue;

        // Body
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2);
        ctx.fill();

        // Direction indicator
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y);
        ctx.lineTo(enemy.x + Math.cos(enemy.angle) * 15,
                   enemy.y + Math.sin(enemy.angle) * 15);
        ctx.stroke();

        // HP bar
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#222222';
        ctx.fillRect(enemy.x - 15, enemy.y - 22, 30, 4);
        ctx.fillStyle = hpPercent > 0.5 ? '#44aa44' : (hpPercent > 0.25 ? '#aaaa44' : '#aa4444');
        ctx.fillRect(enemy.x - 15, enemy.y - 22, 30 * hpPercent, 4);

        // Alert indicator
        if (enemy.state === 'alert') {
            ctx.fillStyle = '#ff4444';
            ctx.font = '12px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('!', enemy.x, enemy.y - 28);
        }
    }
}

function renderPlayer() {
    // Body
    ctx.fillStyle = '#4488cc';
    ctx.beginPath();
    ctx.arc(player.x, player.y, 12, 0, Math.PI * 2);
    ctx.fill();

    // Direction/gun
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.angle) * 20,
               player.y + Math.sin(player.angle) * 20);
    ctx.stroke();

    // Vision cone (subtle)
    ctx.fillStyle = 'rgba(255, 255, 200, 0.05)';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.arc(player.x, player.y, VIEW_RANGE,
            player.angle - VISION_CONE_ANGLE / 2,
            player.angle + VISION_CONE_ANGLE / 2);
    ctx.closePath();
    ctx.fill();
}

function renderBullets() {
    for (const bullet of bullets) {
        ctx.fillStyle = bullet.fromPlayer ? '#ffff44' : '#ff4444';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Tracer line
        ctx.strokeStyle = bullet.fromPlayer ? 'rgba(255, 255, 68, 0.5)' : 'rgba(255, 68, 68, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bullet.x, bullet.y);
        ctx.lineTo(bullet.x - bullet.vx * 2, bullet.y - bullet.vy * 2);
        ctx.stroke();
    }
}

function renderParticles() {
    for (const particle of particles) {
        if (particle.type === 'muzzleFlash') {
            const alpha = particle.life / 50;
            ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function renderHUD() {
    // HP bar
    ctx.fillStyle = '#222222';
    ctx.fillRect(10, 10, 150, 20);
    const hpPercent = player.hp / player.maxHp;
    ctx.fillStyle = hpPercent > 0.5 ? '#cc4444' : (hpPercent > 0.25 ? '#aaaa44' : '#aa4444');
    ctx.fillRect(10, 10, 150 * hpPercent, 20);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 150, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`, 15, 25);

    // Stamina bar
    ctx.fillStyle = '#222222';
    ctx.fillRect(10, 35, 150, 10);
    ctx.fillStyle = '#44aa44';
    ctx.fillRect(10, 35, 150 * (player.stamina / player.maxStamina), 10);

    // Bleeding indicator
    if (player.bleeding > 0) {
        ctx.fillStyle = '#ff4444';
        ctx.font = '14px Courier New';
        ctx.fillText('BLEEDING', 170, 25);
    }

    // Weapon info
    ctx.fillStyle = '#aabbcc';
    ctx.font = '14px Courier New';
    ctx.fillText(`${player.weapon.name}`, 10, 65);
    ctx.fillText(`${player.weapon.currentAmmo}/${player.weapon.magSize}`, 10, 82);
    if (player.reloading) {
        ctx.fillStyle = '#ffaa44';
        ctx.fillText('RELOADING...', 100, 82);
    }

    // Score and kills
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Courier New';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${score}`, canvas.width - 10, 25);
    ctx.fillText(`Kills: ${kills}`, canvas.width - 10, 45);
    ctx.fillText(`Loot: ${lootCollected}`, canvas.width - 10, 65);

    // Extraction distance
    const extractDist = Math.floor(distance(player.x, player.y,
        extractionPoint.x + TILE_SIZE / 2, extractionPoint.y + TILE_SIZE / 2));
    ctx.fillStyle = '#44ff44';
    ctx.fillText(`Extract: ${extractDist}px SE`, canvas.width - 10, 90);

    // Controls hint
    ctx.fillStyle = '#667788';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText('WASD:Move LMB:Fire R:Reload E:Loot 1-4:Weapons Q:Debug', 10, canvas.height - 10);
}

function renderDebug() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 100, 200, 180);

    ctx.fillStyle = '#00ff00';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'left';

    const lines = [
        'DEBUG OVERLAY',
        `Player: ${Math.floor(player.x)}, ${Math.floor(player.y)}`,
        `Angle: ${(player.angle * 180 / Math.PI).toFixed(1)}°`,
        `HP: ${player.hp.toFixed(1)} Bleed: ${player.bleeding.toFixed(2)}`,
        `Stamina: ${player.stamina.toFixed(1)}`,
        `Weapon: ${player.weapon.name}`,
        `Enemies: ${enemies.filter(e => e.hp > 0).length}`,
        `Bullets: ${bullets.length}`,
        `Camera: ${Math.floor(camera.x)}, ${Math.floor(camera.y)}`,
        `Game Time: ${(gameTime / 1000).toFixed(1)}s`,
        `Score: ${score}`
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, 15, 115 + i * 15);
    });
}

function renderMenu() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#cccccc';
    ctx.font = '36px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('ZERO SIEVERT', canvas.width / 2, 150);

    ctx.fillStyle = '#888899';
    ctx.font = '18px Courier New';
    ctx.fillText('Extraction Shooter Clone', canvas.width / 2, 190);

    ctx.fillStyle = '#aabbcc';
    ctx.font = '16px Courier New';
    ctx.fillText('Press SPACE to Start', canvas.width / 2, 280);

    ctx.fillStyle = '#667788';
    ctx.font = '14px Courier New';
    const controls = [
        'Controls:',
        'WASD - Move',
        'Mouse - Aim',
        'LMB - Fire',
        'R - Reload',
        'E - Interact/Loot',
        '1-4 - Switch Weapons',
        'Shift - Sprint',
        'Q - Debug Overlay'
    ];
    controls.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, 340 + i * 22);
    });

    ctx.fillStyle = '#44ff44';
    ctx.font = '14px Courier New';
    ctx.fillText('Objective: Reach extraction point alive!', canvas.width / 2, 560);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = '36px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('YOU DIED', canvas.width / 2, 200);

    ctx.fillStyle = '#cccccc';
    ctx.font = '18px Courier New';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, 280);
    ctx.fillText(`Kills: ${kills}`, canvas.width / 2, 310);
    ctx.fillText(`Loot Collected: ${lootCollected}`, canvas.width / 2, 340);
    ctx.fillText(`Survived: ${(gameTime / 1000).toFixed(1)}s`, canvas.width / 2, 370);

    ctx.fillStyle = '#aabbcc';
    ctx.font = '16px Courier New';
    ctx.fillText('Press R to Restart', canvas.width / 2, 450);
}

function renderExtracted() {
    ctx.fillStyle = 'rgba(0, 50, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#44ff44';
    ctx.font = '36px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRACTED!', canvas.width / 2, 200);

    ctx.fillStyle = '#cccccc';
    ctx.font = '18px Courier New';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, 280);
    ctx.fillText(`Kills: ${kills}`, canvas.width / 2, 310);
    ctx.fillText(`Loot Collected: ${lootCollected}`, canvas.width / 2, 340);
    ctx.fillText(`Raid Time: ${(gameTime / 1000).toFixed(1)}s`, canvas.width / 2, 370);

    ctx.fillStyle = '#aabbcc';
    ctx.font = '16px Courier New';
    ctx.fillText('Press R to Start New Raid', canvas.width / 2, 450);
}

// Utility functions
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function isVisible(x, y) {
    const dist = distance(player.x, player.y, x, y);
    if (dist > VIEW_RANGE) return false;

    const angleToTarget = Math.atan2(y - player.y, x - player.x);
    const angleDiff = normalizeAngle(angleToTarget - player.angle);
    return Math.abs(angleDiff) < VISION_CONE_ANGLE / 2;
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// Start
init();
