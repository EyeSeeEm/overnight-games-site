// Minishoot Adventures Clone - Twin-Stick Shooter Adventure
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const WORLD_WIDTH = 100;
const WORLD_HEIGHT = 100;

// Game state
const GameState = { MENU: 0, PLAYING: 1, PAUSED: 2, MAP: 3, SHOP: 4, BOSS: 5, VICTORY: 6, GAME_OVER: 7 };
let state = GameState.MENU;
let lastTime = 0;
let deltaTime = 0;

// Camera
const camera = { x: 0, y: 0 };

// World data
let worldMap = [];
let currentBiome = 'village';
let discoveredAreas = new Set(['village']);

// Biome colors
const biomeColors = {
    village: { ground: '#6a9', floor: '#8bc', wall: '#456', accent: '#fd8' },
    forest: { ground: '#4a7', floor: '#6b9', wall: '#253', accent: '#8f4' },
    caves: { ground: '#446', floor: '#557', wall: '#223', accent: '#a6f' }
};

// Player
const player = {
    x: 1600, y: 1600,
    width: 24, height: 24,
    angle: 0,
    speed: 200,
    hp: 3, maxHp: 3,
    energy: 4, maxEnergy: 4,
    xp: 0, level: 1,
    skillPoints: 0,
    stats: { damage: 1, fireRate: 1, speed: 1, range: 1 },
    fireTimer: 0,
    fireRate: 3,
    damage: 1,
    abilities: { dash: false, supershot: false },
    dashCooldown: 0,
    crystals: 0,
    heartPieces: 0,
    energyBatteries: 0
};

// XP for level up
function xpForLevel(level) {
    return level * 50;
}

// Enemies
const enemyTypes = {
    scout: { hp: 3, speed: 80, damage: 1, color: '#f84', size: 18, xp: 2, fireRate: 1, pattern: 'single' },
    grasshopper: { hp: 5, speed: 100, damage: 1, color: '#8f4', size: 16, xp: 3, fireRate: 0.8, pattern: 'burst', hops: true },
    turret: { hp: 8, speed: 0, damage: 1, color: '#888', size: 24, xp: 5, fireRate: 2, pattern: 'spray' },
    mimic: { hp: 6, speed: 60, damage: 1, color: '#4a4', size: 20, xp: 4, fireRate: 0.5, pattern: 'spread', hidden: true },
    heavy: { hp: 15, speed: 40, damage: 2, color: '#a44', size: 28, xp: 8, fireRate: 0.6, pattern: 'spread' }
};

// Entities
let enemies = [];
let bullets = [];
let enemyBullets = [];
let pickups = [];
let npcs = [];
let particles = [];

// Rooms
let rooms = [];
let currentRoom = null;

// Boss
let boss = null;
let bossDefeated = { forest: false, caves: false };

// Initialize
function init() {
    setupInput();
    generateWorld();
}

function generateWorld() {
    worldMap = [];

    // Initialize with walls
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        worldMap[y] = [];
        for (let x = 0; x < WORLD_WIDTH; x++) {
            worldMap[y][x] = { type: 'wall', biome: 'village' };
        }
    }

    // Generate biome regions
    generateBiome('village', 45, 45, 15, 15);
    generateBiome('forest', 20, 50, 25, 30);
    generateBiome('caves', 60, 20, 30, 25);

    // Connect regions with paths
    carvePathH(45, 50, 30);
    carvePathV(50, 45, 20);
    carvePathH(70, 30, 20);

    // Place NPCs in village
    npcs = [
        { type: 'mechanic', x: 48 * TILE_SIZE, y: 48 * TILE_SIZE, rescued: true },
        { type: 'healer', x: 52 * TILE_SIZE, y: 48 * TILE_SIZE, rescued: false },
        { type: 'shopkeeper', x: 50 * TILE_SIZE, y: 52 * TILE_SIZE, rescued: false },
        { type: 'elder', x: 50 * TILE_SIZE, y: 45 * TILE_SIZE, rescued: true }
    ];

    // Place collectibles
    placeCollectibles();

    // Spawn initial enemies
    spawnEnemiesInBiome('forest', 20);
    spawnEnemiesInBiome('caves', 25);

    // Place dungeon entrances
    worldMap[55][25] = { type: 'dungeon', biome: 'forest', dungeon: 'forest_temple' };
    worldMap[30][75] = { type: 'dungeon', biome: 'caves', dungeon: 'caves_temple' };

    // Place dash ability requirement marker
    worldMap[52][35] = { type: 'gap', biome: 'forest' };

    player.x = 50 * TILE_SIZE;
    player.y = 50 * TILE_SIZE;
}

function generateBiome(biome, startX, startY, width, height) {
    for (let y = startY; y < startY + height && y < WORLD_HEIGHT; y++) {
        for (let x = startX; x < startX + width && x < WORLD_WIDTH; x++) {
            // Create rooms and corridors
            if (Math.random() < 0.7) {
                worldMap[y][x] = { type: 'floor', biome };
            }
        }
    }

    // Carve room interiors
    for (let i = 0; i < 5 + Math.floor(Math.random() * 5); i++) {
        const rx = startX + 2 + Math.floor(Math.random() * (width - 6));
        const ry = startY + 2 + Math.floor(Math.random() * (height - 6));
        const rw = 3 + Math.floor(Math.random() * 5);
        const rh = 3 + Math.floor(Math.random() * 4);

        for (let y = ry; y < ry + rh && y < WORLD_HEIGHT; y++) {
            for (let x = rx; x < rx + rw && x < WORLD_WIDTH; x++) {
                worldMap[y][x] = { type: 'floor', biome };
            }
        }

        rooms.push({ x: rx * TILE_SIZE, y: ry * TILE_SIZE, w: rw * TILE_SIZE, h: rh * TILE_SIZE, biome });
    }
}

function carvePathH(y, startX, length) {
    for (let x = startX; x < startX + length && x < WORLD_WIDTH; x++) {
        if (y > 0 && y < WORLD_HEIGHT) {
            worldMap[y][x] = { type: 'floor', biome: worldMap[y][x].biome || 'village' };
            worldMap[y-1][x] = { type: 'floor', biome: worldMap[y-1][x].biome || 'village' };
        }
    }
}

function carvePathV(x, startY, length) {
    for (let y = startY; y < startY + length && y < WORLD_HEIGHT; y++) {
        if (x > 0 && x < WORLD_WIDTH) {
            worldMap[y][x] = { type: 'floor', biome: worldMap[y][x].biome || 'village' };
            worldMap[y][x-1] = { type: 'floor', biome: worldMap[y][x-1].biome || 'village' };
        }
    }
}

function placeCollectibles() {
    // Heart pieces
    for (let i = 0; i < 10; i++) {
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        pickups.push({
            type: 'heart_piece',
            x: room.x + room.w / 2 + (Math.random() - 0.5) * 50,
            y: room.y + room.h / 2 + (Math.random() - 0.5) * 50
        });
    }

    // Energy batteries
    for (let i = 0; i < 4; i++) {
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        pickups.push({
            type: 'energy_battery',
            x: room.x + room.w / 2 + (Math.random() - 0.5) * 50,
            y: room.y + room.h / 2 + (Math.random() - 0.5) * 50
        });
    }
}

function spawnEnemiesInBiome(biome, count) {
    const biomeRooms = rooms.filter(r => r.biome === biome);
    if (biomeRooms.length === 0) return;

    const types = biome === 'forest'
        ? ['scout', 'grasshopper', 'mimic']
        : ['scout', 'turret', 'heavy'];

    for (let i = 0; i < count; i++) {
        const room = biomeRooms[Math.floor(Math.random() * biomeRooms.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        spawnEnemy(type, room.x + Math.random() * room.w, room.y + Math.random() * room.h);
    }
}

function spawnEnemy(type, x, y) {
    const data = enemyTypes[type];
    enemies.push({
        type, x, y,
        ...data,
        maxHp: data.hp,
        fireTimer: Math.random() * 2,
        revealed: !data.hidden,
        hopTimer: 0
    });
}

function setupInput() {
    window.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = true;

        if (e.key === 'Escape') {
            if (state === GameState.PLAYING) state = GameState.PAUSED;
            else if (state === GameState.PAUSED) state = GameState.PLAYING;
        }

        if (e.key === 'Tab' && state === GameState.PLAYING) {
            e.preventDefault();
            state = GameState.MAP;
        }

        // Dash ability
        if (e.key === ' ' && player.abilities.dash && player.dashCooldown <= 0) {
            performDash();
        }
    });

    window.addEventListener('keyup', e => {
        keys[e.key.toLowerCase()] = false;

        if (e.key === 'Tab' && state === GameState.MAP) {
            state = GameState.PLAYING;
        }
    });

    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mousedown', e => {
        mouse.down = true;
        mouse.button = e.button;

        if (state === GameState.MENU) {
            startGame();
        } else if (state === GameState.VICTORY || state === GameState.GAME_OVER) {
            state = GameState.MENU;
        }
    });

    canvas.addEventListener('mouseup', () => {
        mouse.down = false;
    });

    canvas.addEventListener('contextmenu', e => e.preventDefault());
}

const keys = {};
const mouse = { x: 0, y: 0, down: false, button: 0 };

function startGame() {
    generateWorld();
    player.hp = player.maxHp;
    player.energy = player.maxEnergy;
    player.xp = 0;
    player.level = 1;
    player.crystals = 0;
    player.abilities = { dash: false, supershot: false };
    bossDefeated = { forest: false, caves: false };
    state = GameState.PLAYING;
}

function performDash() {
    const dx = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
    const dy = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);

    if (dx !== 0 || dy !== 0) {
        const angle = Math.atan2(dy, dx);
        const dashDist = 100;

        player.x += Math.cos(angle) * dashDist;
        player.y += Math.sin(angle) * dashDist;
        player.dashCooldown = 0.5;

        // Dash particles
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: player.x - Math.cos(angle) * 50,
                y: player.y - Math.sin(angle) * 50,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 0.3,
                color: '#8cf',
                size: 5
            });
        }
    }
}

function update(dt) {
    if (state !== GameState.PLAYING && state !== GameState.BOSS) return;

    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updatePickups();
    updateParticles(dt);

    if (boss) updateBoss(dt);

    // Check for dungeon entrances
    checkDungeonEntrance();

    // Check victory
    if (bossDefeated.forest && bossDefeated.caves) {
        state = GameState.VICTORY;
    }
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

    const speed = player.speed + player.stats.speed * 20;
    const newX = player.x + dx * speed * dt;
    const newY = player.y + dy * speed * dt;

    // Collision
    if (!collidesWithWall(newX, player.y)) player.x = newX;
    if (!collidesWithWall(player.x, newY)) player.y = newY;

    // Bounds
    player.x = Math.max(TILE_SIZE, Math.min((WORLD_WIDTH - 1) * TILE_SIZE, player.x));
    player.y = Math.max(TILE_SIZE, Math.min((WORLD_HEIGHT - 1) * TILE_SIZE, player.y));

    // Camera follow
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
    camera.x = Math.max(0, Math.min(WORLD_WIDTH * TILE_SIZE - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT * TILE_SIZE - canvas.height, camera.y));

    // Update current biome
    const tileX = Math.floor(player.x / TILE_SIZE);
    const tileY = Math.floor(player.y / TILE_SIZE);
    if (worldMap[tileY] && worldMap[tileY][tileX]) {
        currentBiome = worldMap[tileY][tileX].biome;
        discoveredAreas.add(currentBiome);
    }

    // Dash cooldown
    if (player.dashCooldown > 0) player.dashCooldown -= dt;

    // Shoot
    player.fireTimer -= dt;
    const fireRate = player.fireRate + player.stats.fireRate * 0.5;

    if (mouse.down && player.fireTimer <= 0) {
        if (mouse.button === 0) {
            // Normal shot
            firePlayerBullet(false);
            player.fireTimer = 1 / fireRate;
        } else if (mouse.button === 2 && player.abilities.supershot && player.energy > 0) {
            // Supershot
            firePlayerBullet(true);
            player.energy--;
            player.fireTimer = 1 / (fireRate * 0.5);
        }
    }

    // Level up check
    while (player.xp >= xpForLevel(player.level)) {
        player.xp -= xpForLevel(player.level);
        player.level++;
        player.skillPoints++;

        // Auto-allocate skill point for now
        const stats = ['damage', 'fireRate', 'speed', 'range'];
        const stat = stats[Math.floor(Math.random() * stats.length)];
        player.stats[stat]++;

        // Level up particles
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            particles.push({
                x: player.x, y: player.y,
                vx: Math.cos(angle) * 100,
                vy: Math.sin(angle) * 100,
                life: 0.5,
                color: '#fd0',
                size: 6
            });
        }
    }
}

function firePlayerBullet(supershot) {
    const damage = (player.damage + player.stats.damage * 0.5) * (supershot ? 3 : 1);
    const range = 300 + player.stats.range * 30;

    bullets.push({
        x: player.x + Math.cos(player.angle) * 15,
        y: player.y + Math.sin(player.angle) * 15,
        vx: Math.cos(player.angle) * 400,
        vy: Math.sin(player.angle) * 400,
        damage,
        range,
        traveled: 0,
        supershot
    });

    // Muzzle flash
    for (let i = 0; i < 3; i++) {
        particles.push({
            x: player.x + Math.cos(player.angle) * 20,
            y: player.y + Math.sin(player.angle) * 20,
            vx: Math.cos(player.angle + (Math.random() - 0.5)) * 80,
            vy: Math.sin(player.angle + (Math.random() - 0.5)) * 80,
            life: 0.15,
            color: supershot ? '#4af' : '#ff0',
            size: 4
        });
    }
}

function collidesWithWall(x, y) {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    if (tileY < 0 || tileY >= WORLD_HEIGHT || tileX < 0 || tileX >= WORLD_WIDTH) return true;

    const tile = worldMap[tileY][tileX];
    if (tile.type === 'wall') return true;
    if (tile.type === 'gap' && !player.abilities.dash) return true;

    return false;
}

function updateEnemies(dt) {
    enemies.forEach(enemy => {
        if (!enemy.revealed) {
            // Check if player is close to reveal mimic
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            if (Math.sqrt(dx * dx + dy * dy) < 80) {
                enemy.revealed = true;
            }
            return;
        }

        // Movement
        if (enemy.speed > 0) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (enemy.hops) {
                enemy.hopTimer -= dt;
                if (enemy.hopTimer <= 0) {
                    enemy.hopTimer = 0.8;
                    enemy.x += (dx / dist) * 50;
                    enemy.y += (dy / dist) * 50;
                }
            } else if (dist > 50) {
                enemy.x += (dx / dist) * enemy.speed * dt;
                enemy.y += (dy / dist) * enemy.speed * dt;
            }
        }

        // Shooting
        enemy.fireTimer -= dt;
        if (enemy.fireTimer <= 0) {
            enemy.fireTimer = 1 / enemy.fireRate;
            fireEnemyBullet(enemy);
        }
    });

    // Remove dead enemies
    enemies = enemies.filter(e => e.hp > 0);
}

function fireEnemyBullet(enemy) {
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    const speed = 150;

    switch (enemy.pattern) {
        case 'single':
            enemyBullets.push({ x: enemy.x, y: enemy.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage: enemy.damage });
            break;
        case 'burst':
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (enemy.hp > 0) {
                        enemyBullets.push({ x: enemy.x, y: enemy.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage: enemy.damage });
                    }
                }, i * 100);
            }
            break;
        case 'spray':
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI * 2 / 8) * i;
                enemyBullets.push({ x: enemy.x, y: enemy.y, vx: Math.cos(a) * speed * 0.7, vy: Math.sin(a) * speed * 0.7, damage: enemy.damage });
            }
            break;
        case 'spread':
            for (let i = -1; i <= 1; i++) {
                const a = angle + i * 0.2;
                enemyBullets.push({ x: enemy.x, y: enemy.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, damage: enemy.damage });
            }
            break;
    }
}

function updateBullets(dt) {
    // Player bullets
    bullets = bullets.filter(b => {
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.traveled += speed * dt;

        // Range limit
        if (b.traveled > b.range) return false;

        // Wall collision
        if (collidesWithWall(b.x, b.y)) {
            // Can destroy walls with supershot
            if (b.supershot) {
                const tx = Math.floor(b.x / TILE_SIZE);
                const ty = Math.floor(b.y / TILE_SIZE);
                if (worldMap[ty] && worldMap[ty][tx] && worldMap[ty][tx].type === 'wall') {
                    worldMap[ty][tx] = { type: 'floor', biome: worldMap[ty][tx].biome };
                }
            }
            return false;
        }

        // Enemy collision
        for (const enemy of enemies) {
            if (!enemy.revealed) continue;
            const dx = enemy.x - b.x;
            const dy = enemy.y - b.y;
            if (Math.abs(dx) < enemy.size && Math.abs(dy) < enemy.size) {
                enemy.hp -= b.damage;

                // Hit particles
                for (let i = 0; i < 5; i++) {
                    particles.push({
                        x: enemy.x, y: enemy.y,
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        life: 0.3,
                        color: enemy.color,
                        size: 4
                    });
                }

                if (enemy.hp <= 0) {
                    player.xp += enemy.xp;
                    player.crystals += Math.floor(Math.random() * 3) + 1;

                    // Death particles
                    for (let i = 0; i < 15; i++) {
                        particles.push({
                            x: enemy.x, y: enemy.y,
                            vx: (Math.random() - 0.5) * 150,
                            vy: (Math.random() - 0.5) * 150,
                            life: 0.5,
                            color: enemy.color,
                            size: 6
                        });
                    }
                }

                return false;
            }
        }

        // Boss collision
        if (boss) {
            const dx = boss.x - b.x;
            const dy = boss.y - b.y;
            if (Math.abs(dx) < boss.size && Math.abs(dy) < boss.size) {
                boss.hp -= b.damage;
                return false;
            }
        }

        return true;
    });

    // Enemy bullets
    enemyBullets = enemyBullets.filter(b => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Wall collision
        if (collidesWithWall(b.x, b.y)) return false;

        // Player collision
        const dx = player.x - b.x;
        const dy = player.y - b.y;
        if (Math.abs(dx) < player.width / 2 && Math.abs(dy) < player.height / 2) {
            damagePlayer(b.damage);
            return false;
        }

        return b.x > 0 && b.x < WORLD_WIDTH * TILE_SIZE && b.y > 0 && b.y < WORLD_HEIGHT * TILE_SIZE;
    });
}

function damagePlayer(damage) {
    player.hp -= damage;

    // Screen flash
    particles.push({
        x: 0, y: 0,
        vx: 0, vy: 0,
        life: 0.2,
        color: 'rgba(255,0,0,0.3)',
        size: canvas.width,
        screenEffect: true
    });

    if (player.hp <= 0) {
        state = GameState.GAME_OVER;
    }
}

function updatePickups() {
    pickups = pickups.filter(p => {
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
            if (p.type === 'heart_piece') {
                player.heartPieces++;
                if (player.heartPieces >= 4) {
                    player.heartPieces -= 4;
                    player.maxHp++;
                    player.hp = player.maxHp;
                }
            } else if (p.type === 'energy_battery') {
                player.energyBatteries++;
                player.maxEnergy++;
                player.energy = player.maxEnergy;
            } else if (p.type === 'crystal') {
                player.crystals += p.amount || 5;
            } else if (p.type === 'ability') {
                player.abilities[p.ability] = true;
            }

            // Pickup particles
            for (let i = 0; i < 10; i++) {
                particles.push({
                    x: p.x, y: p.y,
                    vx: (Math.random() - 0.5) * 80,
                    vy: (Math.random() - 0.5) * 80,
                    life: 0.4,
                    color: p.type === 'heart_piece' ? '#f44' : p.type === 'energy_battery' ? '#4af' : '#fd0',
                    size: 5
                });
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

function checkDungeonEntrance() {
    const tileX = Math.floor(player.x / TILE_SIZE);
    const tileY = Math.floor(player.y / TILE_SIZE);

    if (worldMap[tileY] && worldMap[tileY][tileX] && worldMap[tileY][tileX].type === 'dungeon') {
        const dungeon = worldMap[tileY][tileX].dungeon;

        if (dungeon === 'forest_temple' && !bossDefeated.forest) {
            startBoss('forest');
        } else if (dungeon === 'caves_temple' && !bossDefeated.caves && player.abilities.supershot) {
            startBoss('caves');
        }
    }
}

function startBoss(type) {
    state = GameState.BOSS;

    if (type === 'forest') {
        boss = {
            type: 'forest_guardian',
            name: 'Forest Guardian',
            x: player.x, y: player.y - 150,
            hp: 150, maxHp: 150,
            size: 40,
            color: '#4a8',
            phase: 0,
            attackTimer: 0,
            pattern: 0
        };
    } else {
        boss = {
            type: 'crystal_golem',
            name: 'Crystal Golem',
            x: player.x, y: player.y - 150,
            hp: 250, maxHp: 250,
            size: 50,
            color: '#a6f',
            phase: 0,
            attackTimer: 0,
            pattern: 0
        };
    }
}

function updateBoss(dt) {
    if (!boss) return;

    // Move toward player
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 100) {
        boss.x += (dx / dist) * 50 * dt;
        boss.y += (dy / dist) * 50 * dt;
    }

    // Attack patterns
    boss.attackTimer -= dt;
    if (boss.attackTimer <= 0) {
        boss.attackTimer = 2;
        boss.pattern = (boss.pattern + 1) % 3;

        const angle = Math.atan2(dy, dx);
        const speed = 180;

        switch (boss.pattern) {
            case 0: // Ring
                for (let i = 0; i < 12; i++) {
                    const a = (Math.PI * 2 / 12) * i;
                    enemyBullets.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, damage: 1 });
                }
                break;
            case 1: // Spread
                for (let i = -3; i <= 3; i++) {
                    const a = angle + i * 0.15;
                    enemyBullets.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * speed * 1.2, vy: Math.sin(a) * speed * 1.2, damage: 1 });
                }
                break;
            case 2: // Spiral
                for (let i = 0; i < 6; i++) {
                    const a = (Math.PI * 2 / 6) * i + Date.now() / 500;
                    enemyBullets.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * speed * 0.8, vy: Math.sin(a) * speed * 0.8, damage: 1 });
                }
                break;
        }
    }

    // Boss defeated
    if (boss.hp <= 0) {
        if (boss.type === 'forest_guardian') {
            bossDefeated.forest = true;
            player.abilities.dash = true;
            pickups.push({ type: 'ability', ability: 'dash', x: boss.x, y: boss.y });
        } else {
            bossDefeated.caves = true;
            player.abilities.supershot = true;
            pickups.push({ type: 'ability', ability: 'supershot', x: boss.x, y: boss.y });
        }

        // Death explosion
        for (let i = 0; i < 30; i++) {
            particles.push({
                x: boss.x, y: boss.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 1,
                color: boss.color,
                size: 10
            });
        }

        player.crystals += 100;
        boss = null;
        state = GameState.PLAYING;
    }
}

function render() {
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state === GameState.MENU) {
        renderMenu();
        return;
    }

    if (state === GameState.MAP) {
        renderWorldMap();
        return;
    }

    // Draw world
    renderWorld();
    renderPickups();
    renderNPCs();
    renderEnemies();
    renderBullets();
    renderPlayer();
    if (boss) renderBoss();
    renderParticles();

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

    if (state === GameState.VICTORY) {
        ctx.fillStyle = 'rgba(0,50,0,0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#4f4';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText('Both dungeon bosses defeated!', canvas.width / 2, canvas.height / 2 + 10);
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
        ctx.fillText(`Level ${player.level} | Crystals: ${player.crystals}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Click to return to menu', canvas.width / 2, canvas.height / 2 + 60);
    }
}

function renderMenu() {
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#2a4a6a');
    gradient.addColorStop(1, '#1a2a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#8cf';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MINISHOOT', canvas.width / 2, 120);
    ctx.fillStyle = '#fd8';
    ctx.fillText('ADVENTURES', canvas.width / 2, 170);

    // Cute ship
    ctx.fillStyle = '#4af';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 280, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(canvas.width / 2 - 8, 275, 6, 0, Math.PI * 2);
    ctx.arc(canvas.width / 2 + 8, 275, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(canvas.width / 2 - 8, 275, 3, 0, Math.PI * 2);
    ctx.arc(canvas.width / 2 + 8, 275, 3, 0, Math.PI * 2);
    ctx.fill();

    // Instructions
    ctx.fillStyle = '#aaa';
    ctx.font = '16px Arial';
    ctx.fillText('WASD - Move | Mouse - Aim & Shoot', canvas.width / 2, 380);
    ctx.fillText('Space - Dash (after unlock) | Right Click - Supershot', canvas.width / 2, 410);
    ctx.fillText('Tab - World Map', canvas.width / 2, 440);

    ctx.fillStyle = '#4f4';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Click to Start', canvas.width / 2, 520);
}

function renderWorld() {
    const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
    const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
    const endX = Math.min(WORLD_WIDTH, Math.ceil((camera.x + canvas.width) / TILE_SIZE) + 1);
    const endY = Math.min(WORLD_HEIGHT, Math.ceil((camera.y + canvas.height) / TILE_SIZE) + 1);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = worldMap[y][x];
            const screenX = x * TILE_SIZE - camera.x;
            const screenY = y * TILE_SIZE - camera.y;
            const colors = biomeColors[tile.biome] || biomeColors.village;

            if (tile.type === 'wall') {
                ctx.fillStyle = colors.wall;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            } else if (tile.type === 'floor') {
                ctx.fillStyle = colors.ground;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                // Subtle pattern
                if ((x + y) % 2 === 0) {
                    ctx.fillStyle = colors.floor;
                    ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }
            } else if (tile.type === 'dungeon') {
                ctx.fillStyle = colors.accent;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 8, 0, Math.PI * 2);
                ctx.fill();
            } else if (tile.type === 'gap') {
                ctx.fillStyle = '#000';
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

function renderPickups() {
    pickups.forEach(p => {
        const screenX = p.x - camera.x;
        const screenY = p.y - camera.y;

        if (screenX < -50 || screenX > canvas.width + 50 || screenY < -50 || screenY > canvas.height + 50) return;

        if (p.type === 'heart_piece') {
            ctx.fillStyle = '#f44';
            ctx.beginPath();
            ctx.arc(screenX - 4, screenY - 2, 5, 0, Math.PI * 2);
            ctx.arc(screenX + 4, screenY - 2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(screenX - 9, screenY);
            ctx.lineTo(screenX, screenY + 10);
            ctx.lineTo(screenX + 9, screenY);
            ctx.fill();
        } else if (p.type === 'energy_battery') {
            ctx.fillStyle = '#4af';
            ctx.fillRect(screenX - 5, screenY - 8, 10, 16);
            ctx.fillStyle = '#8cf';
            ctx.fillRect(screenX - 3, screenY - 6, 6, 12);
        } else if (p.type === 'ability') {
            ctx.fillStyle = '#fd0';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', screenX, screenY + 4);
        }
    });
}

function renderNPCs() {
    npcs.forEach(npc => {
        if (!npc.rescued) return;

        const screenX = npc.x - camera.x;
        const screenY = npc.y - camera.y;

        if (screenX < -50 || screenX > canvas.width + 50 || screenY < -50 || screenY > canvas.height + 50) return;

        // NPC body
        ctx.fillStyle = npc.type === 'mechanic' ? '#888' :
                       npc.type === 'healer' ? '#f88' :
                       npc.type === 'shopkeeper' ? '#8f8' : '#88f';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(screenX - 4, screenY - 3, 4, 0, Math.PI * 2);
        ctx.arc(screenX + 4, screenY - 3, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

function renderEnemies() {
    enemies.forEach(enemy => {
        if (!enemy.revealed) return;

        const screenX = enemy.x - camera.x;
        const screenY = enemy.y - camera.y;

        if (screenX < -50 || screenX > canvas.width + 50 || screenY < -50 || screenY > canvas.height + 50) return;

        // Body
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, enemy.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#f00';
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        ctx.beginPath();
        ctx.arc(screenX + Math.cos(angle) * enemy.size * 0.2, screenY + Math.sin(angle) * enemy.size * 0.2, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function renderBullets() {
    // Player bullets
    bullets.forEach(b => {
        const screenX = b.x - camera.x;
        const screenY = b.y - camera.y;

        ctx.fillStyle = b.supershot ? '#4af' : '#ff0';
        ctx.beginPath();
        ctx.arc(screenX, screenY, b.supershot ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Enemy bullets
    ctx.fillStyle = '#f84';
    enemyBullets.forEach(b => {
        const screenX = b.x - camera.x;
        const screenY = b.y - camera.y;

        ctx.beginPath();
        ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

function renderPlayer() {
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;

    // Body
    ctx.fillStyle = '#4af';
    ctx.beginPath();
    ctx.arc(screenX, screenY, player.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Gun direction
    ctx.fillStyle = '#888';
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(player.angle);
    ctx.fillRect(8, -3, 12, 6);
    ctx.restore();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(screenX - 4, screenY - 3, 5, 0, Math.PI * 2);
    ctx.arc(screenX + 4, screenY - 3, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(screenX - 4 + Math.cos(player.angle) * 2, screenY - 3 + Math.sin(player.angle) * 2, 2, 0, Math.PI * 2);
    ctx.arc(screenX + 4 + Math.cos(player.angle) * 2, screenY - 3 + Math.sin(player.angle) * 2, 2, 0, Math.PI * 2);
    ctx.fill();
}

function renderBoss() {
    const screenX = boss.x - camera.x;
    const screenY = boss.y - camera.y;

    // Body
    ctx.fillStyle = boss.color;
    ctx.beginPath();
    ctx.arc(screenX, screenY, boss.size, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyes
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.arc(screenX - 15, screenY - 10, 8, 0, Math.PI * 2);
    ctx.arc(screenX + 15, screenY - 10, 8, 0, Math.PI * 2);
    ctx.fill();

    // HP bar
    const hpPercent = boss.hp / boss.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(canvas.width / 2 - 150, 20, 300, 20);
    ctx.fillStyle = '#f44';
    ctx.fillRect(canvas.width / 2 - 150, 20, 300 * hpPercent, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(boss.name, canvas.width / 2, 35);
}

function renderParticles() {
    particles.forEach(p => {
        if (p.screenEffect) {
            ctx.fillStyle = p.color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            const screenX = p.x - camera.x;
            const screenY = p.y - camera.y;

            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(screenX, screenY, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    });
}

function renderHUD() {
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, 45);

    // Health hearts
    ctx.fillStyle = '#f44';
    for (let i = 0; i < player.maxHp; i++) {
        const x = 15 + i * 25;
        if (i < player.hp) {
            ctx.beginPath();
            ctx.arc(x - 4, 18, 5, 0, Math.PI * 2);
            ctx.arc(x + 4, 18, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x - 9, 20);
            ctx.lineTo(x, 30);
            ctx.lineTo(x + 9, 20);
            ctx.fill();
        } else {
            ctx.strokeStyle = '#f44';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x - 4, 18, 5, 0, Math.PI * 2);
            ctx.arc(x + 4, 18, 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // Energy bars
    ctx.fillStyle = '#4af';
    for (let i = 0; i < player.maxEnergy; i++) {
        const x = 180 + i * 20;
        ctx.fillStyle = i < player.energy ? '#4af' : '#446';
        ctx.fillRect(x, 15, 15, 20);
    }

    // Level & XP
    ctx.fillStyle = '#fd0';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Lv.${player.level}`, 350, 28);

    // XP bar
    ctx.fillStyle = '#333';
    ctx.fillRect(390, 18, 100, 12);
    ctx.fillStyle = '#fd0';
    ctx.fillRect(390, 18, 100 * (player.xp / xpForLevel(player.level)), 12);

    // Crystals
    ctx.fillStyle = '#f44';
    ctx.fillText(`Crystals: ${player.crystals}`, 510, 28);

    // Abilities
    ctx.fillStyle = '#aaa';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    let abilityText = '';
    if (player.abilities.dash) abilityText += '[DASH] ';
    if (player.abilities.supershot) abilityText += '[SUPERSHOT]';
    ctx.fillText(abilityText, canvas.width - 10, 28);

    // Current biome
    ctx.fillStyle = '#888';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(currentBiome.toUpperCase(), canvas.width / 2, canvas.height - 10);
}

function renderWorldMap() {
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WORLD MAP', canvas.width / 2, 50);

    // Mini world view
    const scale = 6;
    const offsetX = (canvas.width - WORLD_WIDTH * scale) / 2;
    const offsetY = 80;

    // Draw discovered areas
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            const tile = worldMap[y][x];
            if (discoveredAreas.has(tile.biome)) {
                const colors = biomeColors[tile.biome];
                ctx.fillStyle = tile.type === 'wall' ? colors.wall : colors.ground;
                ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
            }
        }
    }

    // Player position
    ctx.fillStyle = '#4af';
    ctx.beginPath();
    ctx.arc(offsetX + (player.x / TILE_SIZE) * scale, offsetY + (player.y / TILE_SIZE) * scale, 5, 0, Math.PI * 2);
    ctx.fill();

    // Legend
    ctx.fillStyle = '#aaa';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Release Tab to close', 10, canvas.height - 20);

    // Boss status
    ctx.textAlign = 'right';
    ctx.fillText(`Forest Boss: ${bossDefeated.forest ? 'Defeated' : 'Active'}`, canvas.width - 10, canvas.height - 40);
    ctx.fillText(`Cave Boss: ${bossDefeated.caves ? 'Defeated' : 'Active'}`, canvas.width - 10, canvas.height - 20);
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
