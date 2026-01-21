// Lost Outpost - Survival Horror Shooter
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

// Game state
const GameState = { MENU: 0, PLAYING: 1, PAUSED: 2, LEVEL_COMPLETE: 3, GAME_OVER: 4, VICTORY: 5 };
let state = GameState.MENU;
let lastTime = 0;
let deltaTime = 0;

// Level
let currentLevel = 1;
const MAX_LEVELS = 5;
let map = [];
let keycards = [];
let spawnPoints = [];

// Camera
const camera = { x: 0, y: 0 };

// Player
const player = {
    x: 200, y: 200,
    width: 24, height: 24,
    angle: 0,
    speed: 120,
    hp: 100, maxHp: 100,
    lives: 3,
    credits: 500,
    weapons: ['rifle'],
    currentWeapon: 0,
    ammo: { rifle: 300, smg: 0, shotgun: 0, flamethrower: 0 },
    maxAmmo: { rifle: 300, smg: 500, shotgun: 50, flamethrower: 200 },
    reloading: false,
    reloadTimer: 0,
    mag: { rifle: 30, smg: 50, shotgun: 8, flamethrower: 100 },
    magSize: { rifle: 30, smg: 50, shotgun: 8, flamethrower: 100 },
    fireTimer: 0,
    hasKeycard: false
};

// Weapons
const weaponData = {
    rifle: { name: 'Assault Rifle', damage: 15, fireRate: 8, magSize: 30, reloadTime: 2, spread: 0.05, bulletSpeed: 500 },
    smg: { name: 'SMG', damage: 8, fireRate: 15, magSize: 50, reloadTime: 1.5, spread: 0.1, bulletSpeed: 450 },
    shotgun: { name: 'Shotgun', damage: 12, fireRate: 1.5, magSize: 8, reloadTime: 2.5, spread: 0.3, pellets: 6, bulletSpeed: 400 },
    flamethrower: { name: 'Flamethrower', damage: 5, fireRate: 20, magSize: 100, reloadTime: 3, spread: 0.2, bulletSpeed: 200, fire: true }
};

// Enemies
const enemyTypes = {
    scorpion: { hp: 30, speed: 80, damage: 10, color: '#4a8', width: 20, height: 20, attackRange: 30, ranged: false },
    scorpionLaser: { hp: 25, speed: 60, damage: 15, color: '#4a4', width: 20, height: 20, attackRange: 200, ranged: true, fireRate: 1 },
    arachnid: { hp: 60, speed: 50, damage: 20, color: '#8a4', width: 28, height: 28, attackRange: 35, ranged: false },
    boss: { hp: 500, speed: 40, damage: 30, color: '#a44', width: 48, height: 48, attackRange: 50, ranged: false, isBoss: true }
};

// Entities
let enemies = [];
let bullets = [];
let enemyBullets = [];
let pickups = [];
let particles = [];

// Spawn system
let spawnTimer = 0;
let totalKills = 0;
let levelObjective = '';
let objectiveComplete = false;

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false };

// Tile types
const TileType = {
    FLOOR: 0,
    WALL: 1,
    DOOR: 2,
    DOOR_LOCKED: 3,
    EXIT: 4,
    TERMINAL: 5
};

function init() {
    setupInput();
}

function setupInput() {
    window.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = true;

        if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
            if (state === GameState.PLAYING) state = GameState.PAUSED;
            else if (state === GameState.PAUSED) state = GameState.PLAYING;
        }

        if (e.key.toLowerCase() === 'r' && !player.reloading) {
            startReload();
        }

        // Weapon switch
        if (e.key >= '1' && e.key <= '4') {
            const idx = parseInt(e.key) - 1;
            if (idx < player.weapons.length) {
                player.currentWeapon = idx;
            }
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

    canvas.addEventListener('mousedown', () => {
        mouse.down = true;
        if (state === GameState.MENU) {
            startGame();
        } else if (state === GameState.LEVEL_COMPLETE) {
            nextLevel();
        } else if (state === GameState.GAME_OVER || state === GameState.VICTORY) {
            state = GameState.MENU;
        }
    });

    canvas.addEventListener('mouseup', () => {
        mouse.down = false;
    });
}

function startGame() {
    currentLevel = 1;
    player.lives = 3;
    player.credits = 500;
    player.weapons = ['rifle'];
    player.ammo = { rifle: 300, smg: 0, shotgun: 0, flamethrower: 0 };
    loadLevel(currentLevel);
    state = GameState.PLAYING;
}

function loadLevel(level) {
    enemies = [];
    bullets = [];
    enemyBullets = [];
    pickups = [];
    particles = [];
    keycards = [];
    player.hp = player.maxHp;
    player.hasKeycard = false;
    objectiveComplete = false;
    totalKills = 0;
    spawnTimer = 0;

    // Generate level
    generateLevel(level);

    // Set objective
    switch (level) {
        case 1:
            levelObjective = 'Find keycard and reach exit';
            break;
        case 2:
            levelObjective = 'Clear engineering deck';
            if (!player.weapons.includes('smg')) {
                player.weapons.push('smg');
                player.ammo.smg = 200;
            }
            break;
        case 3:
            levelObjective = 'Find research data';
            if (!player.weapons.includes('shotgun')) {
                player.weapons.push('shotgun');
                player.ammo.shotgun = 30;
            }
            break;
        case 4:
            levelObjective = 'Survive the ambush';
            if (!player.weapons.includes('flamethrower')) {
                player.weapons.push('flamethrower');
                player.ammo.flamethrower = 100;
            }
            break;
        case 5:
            levelObjective = 'Defeat the Hive Commander';
            break;
    }
}

function generateLevel(level) {
    map = [];

    // Initialize with walls
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x] = TileType.WALL;
        }
    }

    // Generate rooms and corridors
    const rooms = [];
    const roomCount = 5 + level * 2;

    for (let i = 0; i < roomCount; i++) {
        const w = 5 + Math.floor(Math.random() * 6);
        const h = 4 + Math.floor(Math.random() * 5);
        const x = 1 + Math.floor(Math.random() * (MAP_WIDTH - w - 2));
        const y = 1 + Math.floor(Math.random() * (MAP_HEIGHT - h - 2));

        // Carve room
        for (let ry = y; ry < y + h; ry++) {
            for (let rx = x; rx < x + w; rx++) {
                map[ry][rx] = TileType.FLOOR;
            }
        }

        rooms.push({ x, y, w, h, cx: x + Math.floor(w / 2), cy: y + Math.floor(h / 2) });
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
        const r1 = rooms[i - 1];
        const r2 = rooms[i];

        // Horizontal then vertical
        for (let x = Math.min(r1.cx, r2.cx); x <= Math.max(r1.cx, r2.cx); x++) {
            if (map[r1.cy][x] !== undefined) map[r1.cy][x] = TileType.FLOOR;
        }
        for (let y = Math.min(r1.cy, r2.cy); y <= Math.max(r1.cy, r2.cy); y++) {
            if (map[y] && map[y][r2.cx] !== undefined) map[y][r2.cx] = TileType.FLOOR;
        }
    }

    // Place player in first room
    player.x = rooms[0].cx * TILE_SIZE;
    player.y = rooms[0].cy * TILE_SIZE;

    // Place exit in last room
    const lastRoom = rooms[rooms.length - 1];
    map[lastRoom.cy][lastRoom.cx] = TileType.EXIT;

    // Place locked door if level has keycard
    if (level <= 3) {
        const midRoom = rooms[Math.floor(rooms.length / 2)];
        map[midRoom.cy][midRoom.cx - 1] = TileType.DOOR_LOCKED;

        // Place keycard
        const keycardRoom = rooms[Math.floor(rooms.length / 3)];
        keycards.push({
            x: keycardRoom.cx * TILE_SIZE,
            y: keycardRoom.cy * TILE_SIZE
        });
    }

    // Spawn enemies
    const enemyCount = 5 + level * 3;
    for (let i = 0; i < enemyCount; i++) {
        const room = rooms[1 + Math.floor(Math.random() * (rooms.length - 2))];
        const type = level < 2 ? 'scorpion' :
                     level < 4 ? (Math.random() < 0.7 ? 'scorpion' : Math.random() < 0.5 ? 'scorpionLaser' : 'arachnid') :
                     (Math.random() < 0.4 ? 'scorpion' : Math.random() < 0.6 ? 'scorpionLaser' : 'arachnid');

        spawnEnemy(type, room.cx * TILE_SIZE + (Math.random() - 0.5) * 50, room.cy * TILE_SIZE + (Math.random() - 0.5) * 50);
    }

    // Level 5 boss
    if (level === 5) {
        const bossRoom = rooms[rooms.length - 2];
        spawnEnemy('boss', bossRoom.cx * TILE_SIZE, bossRoom.cy * TILE_SIZE);
    }

    // Place pickups
    for (let i = 0; i < 3 + level; i++) {
        const room = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
        const type = Math.random() < 0.5 ? 'health' : Math.random() < 0.7 ? 'ammo' : 'credits';
        pickups.push({
            type,
            x: room.cx * TILE_SIZE + (Math.random() - 0.5) * 30,
            y: room.cy * TILE_SIZE + (Math.random() - 0.5) * 30
        });
    }

    // Spawn points for endless levels
    if (level >= 4) {
        for (let i = 1; i < rooms.length - 1; i++) {
            spawnPoints.push({ x: rooms[i].cx * TILE_SIZE, y: rooms[i].cy * TILE_SIZE });
        }
    }
}

function spawnEnemy(type, x, y) {
    const data = enemyTypes[type];
    enemies.push({
        type,
        x, y,
        ...data,
        maxHp: data.hp,
        fireTimer: Math.random() * 2,
        stunTimer: 0
    });
}

function startReload() {
    const weapon = player.weapons[player.currentWeapon];
    const data = weaponData[weapon];

    if (player.mag[weapon] < data.magSize && player.ammo[weapon] > 0) {
        player.reloading = true;
        player.reloadTimer = data.reloadTime;
    }
}

function update(dt) {
    if (state !== GameState.PLAYING) return;

    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updatePickups();
    updateParticles(dt);
    updateSpawns(dt);
    checkObjective();
}

function updatePlayer(dt) {
    // Aim at mouse
    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;
    player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

    // Movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy = -1;
    if (keys['s'] || keys['arrowdown']) dy = 1;
    if (keys['a'] || keys['arrowleft']) dx = -1;
    if (keys['d'] || keys['arrowright']) dx = 1;

    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    const newX = player.x + dx * player.speed * dt;
    const newY = player.y + dy * player.speed * dt;

    if (!collidesWithWall(newX, player.y, player.width, player.height)) {
        player.x = newX;
    }
    if (!collidesWithWall(player.x, newY, player.width, player.height)) {
        player.y = newY;
    }

    // Camera follow
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
    camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - canvas.height, camera.y));

    // Reload
    if (player.reloading) {
        player.reloadTimer -= dt;
        if (player.reloadTimer <= 0) {
            player.reloading = false;
            const weapon = player.weapons[player.currentWeapon];
            const data = weaponData[weapon];
            const needed = data.magSize - player.mag[weapon];
            const available = Math.min(needed, player.ammo[weapon]);
            player.mag[weapon] += available;
            player.ammo[weapon] -= available;
        }
    }

    // Shoot
    player.fireTimer -= dt;
    if (mouse.down && !player.reloading && player.fireTimer <= 0) {
        const weapon = player.weapons[player.currentWeapon];
        const data = weaponData[weapon];

        if (player.mag[weapon] > 0) {
            fireWeapon(weapon, data);
            player.fireTimer = 1 / data.fireRate;
        } else if (player.ammo[weapon] > 0) {
            startReload();
        }
    }

    // Interact
    if (keys[' ']) {
        keys[' '] = false;

        // Check keycards
        keycards = keycards.filter(k => {
            const dx = k.x - player.x;
            const dy = k.y - player.y;
            if (Math.sqrt(dx * dx + dy * dy) < 40) {
                player.hasKeycard = true;
                return false;
            }
            return true;
        });

        // Check locked doors
        const tileX = Math.floor(player.x / TILE_SIZE);
        const tileY = Math.floor(player.y / TILE_SIZE);

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = tileX + dx;
                const ty = tileY + dy;
                if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
                    if (map[ty][tx] === TileType.DOOR_LOCKED && player.hasKeycard) {
                        map[ty][tx] = TileType.FLOOR;
                        player.hasKeycard = false;
                    }
                }
            }
        }

        // Check exit
        const exitTileX = Math.floor(player.x / TILE_SIZE);
        const exitTileY = Math.floor(player.y / TILE_SIZE);
        if (map[exitTileY] && map[exitTileY][exitTileX] === TileType.EXIT && objectiveComplete) {
            completeLevel();
        }
    }
}

function fireWeapon(weapon, data) {
    player.mag[weapon]--;

    const pellets = data.pellets || 1;
    for (let i = 0; i < pellets; i++) {
        const spread = (Math.random() - 0.5) * data.spread;
        const angle = player.angle + spread;

        bullets.push({
            x: player.x + Math.cos(player.angle) * 20,
            y: player.y + Math.sin(player.angle) * 20,
            vx: Math.cos(angle) * data.bulletSpeed,
            vy: Math.sin(angle) * data.bulletSpeed,
            damage: data.damage,
            fire: data.fire || false
        });

        // Muzzle flash
        for (let j = 0; j < 3; j++) {
            particles.push({
                x: player.x + Math.cos(player.angle) * 25,
                y: player.y + Math.sin(player.angle) * 25,
                vx: Math.cos(angle + (Math.random() - 0.5)) * 100,
                vy: Math.sin(angle + (Math.random() - 0.5)) * 100,
                life: 0.1,
                color: data.fire ? '#f80' : '#ff0',
                size: 3
            });
        }
    }
}

function collidesWithWall(x, y, w, h) {
    const left = Math.floor((x - w / 2) / TILE_SIZE);
    const right = Math.floor((x + w / 2) / TILE_SIZE);
    const top = Math.floor((y - h / 2) / TILE_SIZE);
    const bottom = Math.floor((y + h / 2) / TILE_SIZE);

    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
                const tile = map[ty][tx];
                if (tile === TileType.WALL || tile === TileType.DOOR_LOCKED) {
                    return true;
                }
            }
        }
    }
    return false;
}

function updateEnemies(dt) {
    enemies.forEach(enemy => {
        if (enemy.stunTimer > 0) {
            enemy.stunTimer -= dt;
            return;
        }

        // Move toward player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > enemy.attackRange) {
            // Path toward player avoiding walls
            const moveX = (dx / dist) * enemy.speed * dt;
            const moveY = (dy / dist) * enemy.speed * dt;

            if (!collidesWithWall(enemy.x + moveX, enemy.y, enemy.width, enemy.height)) {
                enemy.x += moveX;
            }
            if (!collidesWithWall(enemy.x, enemy.y + moveY, enemy.width, enemy.height)) {
                enemy.y += moveY;
            }
        }

        // Attack
        if (enemy.ranged) {
            enemy.fireTimer -= dt;
            if (enemy.fireTimer <= 0 && dist < 300) {
                enemy.fireTimer = 1 / (enemy.fireRate || 1);
                const angle = Math.atan2(dy, dx);
                enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angle) * 200,
                    vy: Math.sin(angle) * 200,
                    damage: enemy.damage
                });
            }
        } else if (dist < enemy.attackRange) {
            enemy.fireTimer -= dt;
            if (enemy.fireTimer <= 0) {
                enemy.fireTimer = 1;
                damagePlayer(enemy.damage);
            }
        }

        // Boss spawns adds
        if (enemy.isBoss && enemy.hp < enemy.maxHp * 0.5) {
            enemy.spawnTimer = (enemy.spawnTimer || 0) - dt;
            if (enemy.spawnTimer <= 0) {
                enemy.spawnTimer = 10;
                spawnEnemy('scorpion', enemy.x + 50, enemy.y);
                spawnEnemy('scorpion', enemy.x - 50, enemy.y);
            }
        }
    });

    // Remove dead enemies
    enemies = enemies.filter(e => e.hp > 0);
}

function updateBullets(dt) {
    // Player bullets
    bullets = bullets.filter(b => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Wall collision
        const tx = Math.floor(b.x / TILE_SIZE);
        const ty = Math.floor(b.y / TILE_SIZE);
        if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
            if (map[ty][tx] === TileType.WALL) {
                // Impact particles
                for (let i = 0; i < 3; i++) {
                    particles.push({
                        x: b.x, y: b.y,
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        life: 0.3,
                        color: '#888',
                        size: 2
                    });
                }
                return false;
            }
        }

        // Enemy collision
        for (const enemy of enemies) {
            const dx = enemy.x - b.x;
            const dy = enemy.y - b.y;
            if (Math.abs(dx) < enemy.width / 2 && Math.abs(dy) < enemy.height / 2) {
                enemy.hp -= b.damage;
                enemy.stunTimer = 0.1;

                // Blood particles
                for (let i = 0; i < 5; i++) {
                    particles.push({
                        x: enemy.x, y: enemy.y,
                        vx: (Math.random() - 0.5) * 150,
                        vy: (Math.random() - 0.5) * 150,
                        life: 0.5,
                        color: '#4a8',
                        size: 4
                    });
                }

                if (enemy.hp <= 0) {
                    totalKills++;
                    player.credits += enemy.isBoss ? 500 : 50;

                    // Death particles
                    for (let i = 0; i < 15; i++) {
                        particles.push({
                            x: enemy.x, y: enemy.y,
                            vx: (Math.random() - 0.5) * 200,
                            vy: (Math.random() - 0.5) * 200,
                            life: 1,
                            color: '#4a8',
                            size: 5
                        });
                    }

                    // Drop ammo
                    if (Math.random() < 0.3) {
                        pickups.push({ type: 'ammo', x: enemy.x, y: enemy.y });
                    }
                }

                return false;
            }
        }

        // Bounds
        return b.x > 0 && b.x < MAP_WIDTH * TILE_SIZE && b.y > 0 && b.y < MAP_HEIGHT * TILE_SIZE;
    });

    // Enemy bullets
    enemyBullets = enemyBullets.filter(b => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Player collision
        const dx = player.x - b.x;
        const dy = player.y - b.y;
        if (Math.abs(dx) < player.width / 2 && Math.abs(dy) < player.height / 2) {
            damagePlayer(b.damage);
            return false;
        }

        // Wall collision
        const tx = Math.floor(b.x / TILE_SIZE);
        const ty = Math.floor(b.y / TILE_SIZE);
        if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
            if (map[ty][tx] === TileType.WALL) {
                return false;
            }
        }

        return b.x > 0 && b.x < MAP_WIDTH * TILE_SIZE && b.y > 0 && b.y < MAP_HEIGHT * TILE_SIZE;
    });
}

function damagePlayer(damage) {
    player.hp -= damage;

    // Screen flash
    particles.push({
        x: canvas.width / 2, y: canvas.height / 2,
        vx: 0, vy: 0,
        life: 0.2,
        color: 'rgba(255,0,0,0.3)',
        size: canvas.width,
        screenEffect: true
    });

    if (player.hp <= 0) {
        player.lives--;
        if (player.lives <= 0) {
            state = GameState.GAME_OVER;
        } else {
            player.hp = player.maxHp;
            // Respawn at start
            player.x = 100;
            player.y = 100;
        }
    }
}

function updatePickups() {
    pickups = pickups.filter(p => {
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
            if (p.type === 'health') {
                player.hp = Math.min(player.maxHp, player.hp + 30);
            } else if (p.type === 'ammo') {
                const weapon = player.weapons[player.currentWeapon];
                player.ammo[weapon] = Math.min(player.maxAmmo[weapon], player.ammo[weapon] + 50);
            } else if (p.type === 'credits') {
                player.credits += 100;
            }
            return false;
        }
        return true;
    });
}

function updateParticles(dt) {
    particles = particles.filter(p => {
        p.life -= dt;
        if (!p.screenEffect) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.95;
            p.vy *= 0.95;
        }
        return p.life > 0;
    });
}

function updateSpawns(dt) {
    if (currentLevel >= 4 && !objectiveComplete && spawnPoints.length > 0) {
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
            spawnTimer = 5 - currentLevel * 0.5;
            const point = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            spawnEnemy('scorpion', point.x, point.y);
        }
    }
}

function checkObjective() {
    // Level-specific objectives
    if (currentLevel <= 3) {
        // Find keycard and reach exit
        objectiveComplete = keycards.length === 0 || player.hasKeycard;
    } else if (currentLevel === 4) {
        // Survive ambush (kill count)
        objectiveComplete = totalKills >= 20;
    } else if (currentLevel === 5) {
        // Kill boss
        objectiveComplete = !enemies.some(e => e.isBoss);
    }
}

function completeLevel() {
    if (currentLevel >= MAX_LEVELS) {
        state = GameState.VICTORY;
    } else {
        state = GameState.LEVEL_COMPLETE;
    }
}

function nextLevel() {
    currentLevel++;
    loadLevel(currentLevel);
    state = GameState.PLAYING;
}

function render() {
    // Clear with darkness
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state === GameState.MENU) {
        renderMenu();
        return;
    }

    // Create lighting mask
    ctx.save();

    // Draw world
    renderMap();
    renderKeycards();
    renderPickups();
    renderEnemies();
    renderBullets();
    renderPlayer();
    renderParticles();

    // Apply fog of war (darkness outside flashlight)
    renderFogOfWar();

    ctx.restore();

    // HUD
    renderHUD();

    // Overlays
    if (state === GameState.PAUSED) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }

    if (state === GameState.LEVEL_COMPLETE) {
        ctx.fillStyle = 'rgba(0,50,0,0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#4f4';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE', canvas.width / 2, canvas.height / 2 - 30);
        ctx.font = '20px Arial';
        ctx.fillText(`Credits: +${500 * currentLevel}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Click to continue', canvas.width / 2, canvas.height / 2 + 60);
    }

    if (state === GameState.VICTORY) {
        ctx.fillStyle = 'rgba(0,50,0,0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#4f4';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION COMPLETE', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText('You defeated the Hive Commander!', canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText('Click to return to menu', canvas.width / 2, canvas.height / 2 + 60);
    }

    if (state === GameState.GAME_OVER) {
        ctx.fillStyle = 'rgba(50,0,0,0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f44';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
        ctx.font = '20px Arial';
        ctx.fillText(`Reached Level ${currentLevel}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Click to return to menu', canvas.width / 2, canvas.height / 2 + 60);
    }
}

function renderMenu() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#4a8';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LOST OUTPOST', canvas.width / 2, 120);

    ctx.fillStyle = '#888';
    ctx.font = '18px Arial';
    ctx.fillText('Survival Horror Shooter', canvas.width / 2, 160);

    // Instructions
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.fillText('WASD - Move', canvas.width / 2, 280);
    ctx.fillText('Mouse - Aim & Shoot', canvas.width / 2, 310);
    ctx.fillText('R - Reload | 1-4 Switch Weapons', canvas.width / 2, 340);
    ctx.fillText('Space - Interact | P - Pause', canvas.width / 2, 370);

    ctx.fillStyle = '#4f4';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Click to Start', canvas.width / 2, 480);
}

function renderMap() {
    const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
    const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
    const endX = Math.min(MAP_WIDTH, Math.ceil((camera.x + canvas.width) / TILE_SIZE) + 1);
    const endY = Math.min(MAP_HEIGHT, Math.ceil((camera.y + canvas.height) / TILE_SIZE) + 1);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = map[y][x];
            const screenX = x * TILE_SIZE - camera.x;
            const screenY = y * TILE_SIZE - camera.y;

            switch (tile) {
                case TileType.WALL:
                    ctx.fillStyle = '#333';
                    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = '#444';
                    ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                    break;
                case TileType.FLOOR:
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                    // Grid pattern
                    ctx.strokeStyle = '#222';
                    ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                    break;
                case TileType.DOOR_LOCKED:
                    ctx.fillStyle = '#822';
                    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#f00';
                    ctx.fillRect(screenX + TILE_SIZE / 2 - 3, screenY + TILE_SIZE / 2 - 3, 6, 6);
                    break;
                case TileType.EXIT:
                    ctx.fillStyle = objectiveComplete ? '#282' : '#222';
                    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = objectiveComplete ? '#4f4' : '#444';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                    ctx.lineWidth = 1;
                    break;
            }
        }
    }
}

function renderKeycards() {
    keycards.forEach(k => {
        const screenX = k.x - camera.x;
        const screenY = k.y - camera.y;

        ctx.fillStyle = '#fd0';
        ctx.fillRect(screenX - 8, screenY - 5, 16, 10);
        ctx.fillStyle = '#000';
        ctx.fillRect(screenX + 3, screenY - 3, 4, 6);
    });
}

function renderPickups() {
    pickups.forEach(p => {
        const screenX = p.x - camera.x;
        const screenY = p.y - camera.y;

        if (p.type === 'health') {
            ctx.fillStyle = '#f44';
            ctx.fillRect(screenX - 6, screenY - 2, 12, 4);
            ctx.fillRect(screenX - 2, screenY - 6, 4, 12);
        } else if (p.type === 'ammo') {
            ctx.fillStyle = '#fa0';
            ctx.fillRect(screenX - 4, screenY - 6, 8, 12);
            ctx.fillStyle = '#840';
            ctx.fillRect(screenX - 3, screenY - 4, 6, 3);
        } else if (p.type === 'credits') {
            ctx.fillStyle = '#fd0';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function renderEnemies() {
    enemies.forEach(enemy => {
        const screenX = enemy.x - camera.x;
        const screenY = enemy.y - camera.y;

        // Body
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, enemy.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#f00';
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        ctx.beginPath();
        ctx.arc(screenX + Math.cos(angle) * enemy.width * 0.25, screenY + Math.sin(angle) * enemy.width * 0.25, 3, 0, Math.PI * 2);
        ctx.fill();

        // Boss indicator
        if (enemy.isBoss) {
            ctx.strokeStyle = '#f44';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, enemy.width / 2 + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 1;

            // Boss HP bar
            const hpPercent = enemy.hp / enemy.maxHp;
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX - 30, screenY - enemy.height / 2 - 15, 60, 8);
            ctx.fillStyle = '#f44';
            ctx.fillRect(screenX - 30, screenY - enemy.height / 2 - 15, 60 * hpPercent, 8);
        }
    });
}

function renderBullets() {
    // Player bullets
    ctx.fillStyle = '#ff0';
    bullets.forEach(b => {
        const screenX = b.x - camera.x;
        const screenY = b.y - camera.y;
        ctx.beginPath();
        ctx.arc(screenX, screenY, b.fire ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Enemy bullets
    ctx.fillStyle = '#4f4';
    enemyBullets.forEach(b => {
        const screenX = b.x - camera.x;
        const screenY = b.y - camera.y;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

function renderPlayer() {
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;

    // Flashlight cone
    ctx.fillStyle = 'rgba(255,255,200,0.1)';
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.arc(screenX, screenY, 200, player.angle - 0.4, player.angle + 0.4);
    ctx.lineTo(screenX, screenY);
    ctx.fill();

    // Laser sight
    ctx.strokeStyle = 'rgba(255,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenX + Math.cos(player.angle) * 20, screenY + Math.sin(player.angle) * 20);
    ctx.lineTo(screenX + Math.cos(player.angle) * 300, screenY + Math.sin(player.angle) * 300);
    ctx.stroke();

    // Body
    ctx.fillStyle = '#48f';
    ctx.beginPath();
    ctx.arc(screenX, screenY, player.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Gun
    ctx.fillStyle = '#666';
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(player.angle);
    ctx.fillRect(5, -3, 20, 6);
    ctx.restore();
}

function renderParticles() {
    particles.forEach(p => {
        if (p.screenEffect) {
            ctx.fillStyle = p.color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x - camera.x, p.y - camera.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    });
}

function renderFogOfWar() {
    // Create radial gradient for fog
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;

    const gradient = ctx.createRadialGradient(screenX, screenY, 50, screenX, screenY, 250);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, 'rgba(0,0,0,0.5)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.9)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderHUD() {
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, 40);
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // Lives
    ctx.fillStyle = '#f44';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    for (let i = 0; i < player.lives; i++) {
        ctx.fillText('\u2665', 10 + i * 25, 28);
    }

    // Level
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`Level ${currentLevel}: ${levelObjective}`, canvas.width / 2, 26);

    // Credits
    ctx.fillStyle = '#fd0';
    ctx.textAlign = 'right';
    ctx.fillText(`Credits: ${player.credits}`, canvas.width - 10, 28);

    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, canvas.height - 40, 200, 20);
    const hpPercent = player.hp / player.maxHp;
    ctx.fillStyle = hpPercent > 0.5 ? '#4f4' : hpPercent > 0.25 ? '#ff4' : '#f44';
    ctx.fillRect(10, canvas.height - 40, 200 * hpPercent, 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, canvas.height - 40, 200, 20);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(player.hp)}/${player.maxHp}`, 110, canvas.height - 25);

    // Weapon & Ammo
    const weapon = player.weapons[player.currentWeapon];
    const data = weaponData[weapon];
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(data.name, canvas.width - 10, canvas.height - 30);

    ctx.fillStyle = player.reloading ? '#f84' : '#4f4';
    const ammoText = player.reloading ? 'RELOADING...' : `${player.mag[weapon]} | ${player.ammo[weapon]}`;
    ctx.fillText(ammoText, canvas.width - 10, canvas.height - 12);

    // Keycard indicator
    if (player.hasKeycard) {
        ctx.fillStyle = '#fd0';
        ctx.textAlign = 'left';
        ctx.fillText('KEYCARD', 220, canvas.height - 25);
    }

    // Objective complete indicator
    if (objectiveComplete) {
        ctx.fillStyle = '#4f4';
        ctx.textAlign = 'center';
        ctx.fillText('OBJECTIVE COMPLETE - REACH EXIT', canvas.width / 2, canvas.height - 25);
    }
}

function gameLoop(time) {
    deltaTime = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    update(deltaTime);
    render();

    requestAnimationFrame(gameLoop);
}

// Start
init();
requestAnimationFrame(gameLoop);
