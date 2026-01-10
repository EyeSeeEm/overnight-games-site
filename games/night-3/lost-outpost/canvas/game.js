// Lost Outpost - Survival Horror Shooter
// Top-down sci-fi shooter inspired by Alien Breed

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;
const MAP_WIDTH = 30;
const MAP_HEIGHT = 25;

// Colors - Dark sci-fi palette
const COLORS = {
    // Environment
    FLOOR: '#1a1a1a',
    FLOOR_HEX: '#1f1f1f',
    FLOOR_GRATE: '#252525',
    WALL: '#333333',
    WALL_HIGHLIGHT: '#444444',
    WALL_SHADOW: '#1a1a1a',
    HAZARD_YELLOW: '#ccaa00',
    HAZARD_BLACK: '#111111',
    DOOR: '#444455',
    DOOR_LOCKED: '#553333',

    // UI
    UI_BG: '#0a1a1a',
    UI_BORDER: '#0a4a4a',
    UI_TEXT: '#00cccc',
    UI_TEXT_DIM: '#006666',
    HEALTH_BG: '#330000',
    HEALTH: '#cc0000',
    AMMO: '#00cc00',

    // Entities
    PLAYER: '#446688',
    ALIEN: '#44aa44',
    ALIEN_EYES: '#ff0000',
    BULLET: '#ffff00',
    MUZZLE_FLASH: '#ffaa00',

    // Effects
    FLASHLIGHT: 'rgba(200, 200, 150, 0.15)',
    BLOOD: '#448844',
    EXPLOSION: '#ff6600'
};

// Terrain types
const TERRAIN = {
    FLOOR: 0, WALL: 1, DOOR: 2, TERMINAL: 3, VENT: 4,
    HAZARD_FLOOR: 5, CRATE: 6, BARREL: 7
};

// Game state
const game = {
    state: 'playing',
    level: 1,
    tick: 0,
    camera: { x: 0, y: 0 },
    screenShake: 0
};

// Player
const player = {
    x: 400, y: 380,
    width: 20, height: 20,
    speed: 120,
    angle: 0,
    hp: 100, maxHp: 100,
    lives: 3,
    credits: 0,
    rank: 1, xp: 0, xpToNext: 1000,
    weapon: {
        name: 'Assault Rifle',
        damage: 10,
        fireRate: 8,
        ammo: 68,
        maxAmmo: 300,
        clipSize: 30,
        clip: 30,
        reloading: false,
        reloadTime: 0
    },
    cooldown: 0,
    flashlightOn: true,
    invincible: 0
};

// Arrays
let map = [];
let enemies = [];
let bullets = [];
let items = [];
let particles = [];

// Input
const keys = {};
let mouseX = 320, mouseY = 240;
let mouseDown = false;

// Initialize
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', e => { if (e.button === 0) mouseDown = true; });
canvas.addEventListener('mouseup', e => { if (e.button === 0) mouseDown = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Generate level
function generateLevel() {
    map = [];

    // Fill with floor
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            const pattern = (x + y) % 2;
            map[y][x] = { terrain: TERRAIN.FLOOR, variant: pattern };
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

    // Create corridor structure
    // Horizontal corridor
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
        for (let dy = 0; dy < 5; dy++) {
            map[10 + dy][x] = { terrain: TERRAIN.FLOOR, variant: (x + dy) % 2 };
        }
        // Hazard stripes
        if (x % 6 < 3) {
            map[10][x] = { terrain: TERRAIN.HAZARD_FLOOR, variant: 0 };
            map[14][x] = { terrain: TERRAIN.HAZARD_FLOOR, variant: 0 };
        }
    }

    // Vertical corridors
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
        for (let dx = 0; dx < 4; dx++) {
            map[y][8 + dx] = { terrain: TERRAIN.FLOOR, variant: (y + dx) % 2 };
            map[y][20 + dx] = { terrain: TERRAIN.FLOOR, variant: (y + dx) % 2 };
        }
    }

    // Rooms
    const rooms = [
        { x: 2, y: 2, w: 5, h: 5 },
        { x: 23, y: 2, w: 5, h: 5 },
        { x: 2, y: 18, w: 5, h: 5 },
        { x: 23, y: 18, w: 5, h: 5 },
        { x: 12, y: 2, w: 6, h: 5 },
        { x: 12, y: 18, w: 6, h: 5 }
    ];

    for (const room of rooms) {
        for (let dy = 0; dy < room.h; dy++) {
            for (let dx = 0; dx < room.w; dx++) {
                map[room.y + dy][room.x + dx] = {
                    terrain: TERRAIN.FLOOR,
                    variant: (room.x + dx + room.y + dy) % 2
                };
            }
        }
    }

    // Add walls around corridors
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
        for (let x = 1; x < MAP_WIDTH - 1; x++) {
            if (map[y][x].terrain === TERRAIN.FLOOR) {
                // Check if adjacent to empty
                const neighbors = [
                    map[y - 1]?.[x], map[y + 1]?.[x],
                    map[y]?.[x - 1], map[y]?.[x + 1]
                ];
                // Already good
            } else if (map[y][x].terrain !== TERRAIN.WALL) {
                // Check if should be wall
                const hasFloorNeighbor = [
                    map[y - 1]?.[x]?.terrain === TERRAIN.FLOOR,
                    map[y + 1]?.[x]?.terrain === TERRAIN.FLOOR,
                    map[y]?.[x - 1]?.terrain === TERRAIN.FLOOR,
                    map[y]?.[x + 1]?.terrain === TERRAIN.FLOOR
                ].some(v => v);
                if (!hasFloorNeighbor && Math.random() < 0.3) {
                    map[y][x] = { terrain: TERRAIN.WALL, variant: Math.floor(Math.random() * 2) };
                }
            }
        }
    }

    // Add doors
    map[12][1] = { terrain: TERRAIN.DOOR, variant: 0, locked: false };
    map[12][MAP_WIDTH - 2] = { terrain: TERRAIN.DOOR, variant: 0, locked: true };
    map[6][10] = { terrain: TERRAIN.DOOR, variant: 1, locked: false };
    map[18][10] = { terrain: TERRAIN.DOOR, variant: 1, locked: false };

    // Add vents (enemy spawn points)
    map[3][3] = { terrain: TERRAIN.VENT, variant: 0 };
    map[3][26] = { terrain: TERRAIN.VENT, variant: 0 };
    map[21][3] = { terrain: TERRAIN.VENT, variant: 0 };
    map[21][26] = { terrain: TERRAIN.VENT, variant: 0 };

    // Add terminal
    map[4][14] = { terrain: TERRAIN.TERMINAL, variant: 0 };

    // Add crates and barrels
    const cratePositions = [
        { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 25, y: 4 },
        { x: 4, y: 20 }, { x: 25, y: 20 }, { x: 26, y: 20 }
    ];
    for (const pos of cratePositions) {
        map[pos.y][pos.x] = { terrain: TERRAIN.CRATE, variant: Math.floor(Math.random() * 2) };
    }

    const barrelPositions = [
        { x: 13, y: 4 }, { x: 16, y: 4 }, { x: 14, y: 20 }
    ];
    for (const pos of barrelPositions) {
        map[pos.y][pos.x] = { terrain: TERRAIN.BARREL, variant: 0 };
    }

    // Spawn enemies
    enemies = [];
    const enemySpawns = [
        { x: 4, y: 4, type: 'scorpion' },
        { x: 25, y: 4, type: 'scorpion' },
        { x: 4, y: 20, type: 'scorpion' },
        { x: 25, y: 20, type: 'scorpion' },
        { x: 15, y: 3, type: 'scorpion_small' },
        { x: 15, y: 21, type: 'scorpion_small' },
        { x: 15, y: 12, type: 'arachnid' }
    ];

    const enemyStats = {
        scorpion: { hp: 30, speed: 60, damage: 15, xp: 50, color: COLORS.ALIEN },
        scorpion_small: { hp: 15, speed: 80, damage: 8, xp: 25, color: '#338833' },
        arachnid: { hp: 80, speed: 40, damage: 25, xp: 100, color: '#226622' }
    };

    for (const spawn of enemySpawns) {
        const stats = enemyStats[spawn.type];
        enemies.push({
            x: spawn.x * TILE_SIZE + TILE_SIZE / 2,
            y: spawn.y * TILE_SIZE + TILE_SIZE / 2,
            type: spawn.type,
            hp: stats.hp, maxHp: stats.hp,
            speed: stats.speed,
            damage: stats.damage,
            xp: stats.xp,
            color: stats.color,
            state: 'patrol',
            attackCooldown: 0,
            angle: Math.random() * Math.PI * 2
        });
    }

    // Spawn items
    items = [];
    items.push({ x: 100, y: 100, type: 'ammo', amount: 30 });
    items.push({ x: 200, y: 400, type: 'health', amount: 25 });
    items.push({ x: 600, y: 200, type: 'credits', amount: 500 });
    items.push({ x: 800, y: 600, type: 'ammo', amount: 50 });
    items.push({ x: 500, y: 300, type: 'keycard', color: 'yellow' });

    bullets = [];
    particles = [];

    // Reset player position
    player.x = 320;
    player.y = 400;
}

// Update functions
function update(dt) {
    if (game.state !== 'playing') return;

    game.tick++;

    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);

    // Screen shake decay
    if (game.screenShake > 0) game.screenShake *= 0.9;

    // Check lose condition
    if (player.hp <= 0) {
        player.lives--;
        if (player.lives <= 0) {
            game.state = 'gameover';
        } else {
            // Respawn
            player.hp = player.maxHp;
            player.x = 320;
            player.y = 400;
            player.invincible = 2;
        }
    }
}

function updatePlayer(dt) {
    let dx = 0, dy = 0;

    if (keys['w'] || keys['arrowup']) dy = -1;
    if (keys['s'] || keys['arrowdown']) dy = 1;
    if (keys['a'] || keys['arrowleft']) dx = -1;
    if (keys['d'] || keys['arrowright']) dx = 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len; dy /= len;

        const newX = player.x + dx * player.speed * dt;
        const newY = player.y + dy * player.speed * dt;

        if (canMove(newX, player.y, player.width, player.height)) player.x = newX;
        if (canMove(player.x, newY, player.width, player.height)) player.y = newY;
    }

    // Aim at mouse (screen coordinates)
    player.angle = Math.atan2(mouseY - canvas.height / 2, mouseX - canvas.width / 2);

    // Shooting
    if (mouseDown && player.cooldown <= 0 && !player.weapon.reloading) {
        if (player.weapon.clip > 0) {
            shoot();
            player.cooldown = 1 / player.weapon.fireRate;
            player.weapon.clip--;

            if (player.weapon.clip === 0 && player.weapon.ammo > 0) {
                startReload();
            }
        } else if (player.weapon.ammo > 0) {
            startReload();
        }
    }

    if (player.cooldown > 0) player.cooldown -= dt;

    // Reload
    if (keys['r'] && !player.weapon.reloading && player.weapon.clip < player.weapon.clipSize && player.weapon.ammo > 0) {
        startReload();
    }

    if (player.weapon.reloading) {
        player.weapon.reloadTime -= dt;
        if (player.weapon.reloadTime <= 0) {
            const needed = player.weapon.clipSize - player.weapon.clip;
            const reload = Math.min(needed, player.weapon.ammo);
            player.weapon.clip += reload;
            player.weapon.ammo -= reload;
            player.weapon.reloading = false;
        }
    }

    // Interact with items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dist = distance(player.x, player.y, item.x, item.y);
        if (dist < 24) {
            pickupItem(item);
            items.splice(i, 1);
        }
    }

    // Invincibility frames
    if (player.invincible > 0) player.invincible -= dt;

    // Update camera to follow player
    game.camera.x = player.x - canvas.width / 2;
    game.camera.y = player.y - canvas.height / 2;
    game.camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - canvas.width, game.camera.x));
    game.camera.y = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - canvas.height, game.camera.y));
}

function startReload() {
    player.weapon.reloading = true;
    player.weapon.reloadTime = 1.5;
}

function shoot() {
    const spread = 0.05;
    const angle = player.angle + (Math.random() - 0.5) * spread;

    bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 500,
        vy: Math.sin(angle) * 500,
        damage: player.weapon.damage,
        owner: 'player',
        life: 2
    });

    // Muzzle flash particle
    particles.push({
        x: player.x + Math.cos(player.angle) * 15,
        y: player.y + Math.sin(player.angle) * 15,
        type: 'muzzle',
        life: 0.1
    });

    game.screenShake = Math.max(game.screenShake, 2);
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        const dist = distance(player.x, player.y, enemy.x, enemy.y);

        // State machine
        if (enemy.state === 'patrol') {
            // Move in current direction
            enemy.x += Math.cos(enemy.angle) * enemy.speed * 0.3 * dt;
            enemy.y += Math.sin(enemy.angle) * enemy.speed * 0.3 * dt;

            // Random direction change
            if (Math.random() < 0.01) {
                enemy.angle += (Math.random() - 0.5) * Math.PI;
            }

            // Detect player
            if (dist < 150) {
                enemy.state = 'chase';
            }
        } else if (enemy.state === 'chase') {
            // Move toward player
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            enemy.angle = angle;

            const newX = enemy.x + Math.cos(angle) * enemy.speed * dt;
            const newY = enemy.y + Math.sin(angle) * enemy.speed * dt;

            if (canMove(newX, enemy.y, 16, 16)) enemy.x = newX;
            if (canMove(enemy.x, newY, 16, 16)) enemy.y = newY;

            // Attack if close
            if (dist < 25 && enemy.attackCooldown <= 0 && player.invincible <= 0) {
                player.hp -= enemy.damage;
                enemy.attackCooldown = 1;
                game.screenShake = 5;

                // Blood particles
                for (let i = 0; i < 5; i++) {
                    particles.push({
                        x: player.x,
                        y: player.y,
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        type: 'blood',
                        life: 0.5
                    });
                }
            }

            // Lose interest if too far
            if (dist > 300) {
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

        // Check wall collision
        const tileX = Math.floor(bullet.x / TILE_SIZE);
        const tileY = Math.floor(bullet.y / TILE_SIZE);
        if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
            bullets.splice(i, 1);
            continue;
        }

        const tile = map[tileY]?.[tileX];
        if (tile && (tile.terrain === TERRAIN.WALL || tile.terrain === TERRAIN.CRATE)) {
            // Spark particle
            particles.push({
                x: bullet.x,
                y: bullet.y,
                type: 'spark',
                life: 0.2
            });
            bullets.splice(i, 1);
            continue;
        }

        // Check enemy collision
        if (bullet.owner === 'player') {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                if (distance(bullet.x, bullet.y, enemy.x, enemy.y) < 16) {
                    enemy.hp -= bullet.damage;
                    enemy.state = 'chase'; // Alert

                    // Blood particles
                    for (let k = 0; k < 3; k++) {
                        particles.push({
                            x: enemy.x,
                            y: enemy.y,
                            vx: (Math.random() - 0.5) * 80,
                            vy: (Math.random() - 0.5) * 80,
                            type: 'alienblood',
                            life: 0.4
                        });
                    }

                    if (enemy.hp <= 0) {
                        player.xp += enemy.xp;
                        player.credits += Math.floor(Math.random() * 50) + 10;

                        // Check level up
                        if (player.xp >= player.xpToNext) {
                            player.rank++;
                            player.xp -= player.xpToNext;
                            player.xpToNext = Math.floor(player.xpToNext * 1.5);
                        }

                        // Drop items occasionally
                        if (Math.random() < 0.3) {
                            items.push({
                                x: enemy.x,
                                y: enemy.y,
                                type: Math.random() < 0.5 ? 'ammo' : 'health',
                                amount: Math.random() < 0.5 ? 15 : 10
                            });
                        }

                        enemies.splice(j, 1);
                    }

                    bullets.splice(i, 1);
                    break;
                }
            }
        }

        if (bullet.life <= 0) {
            bullets.splice(i, 1);
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
        }

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function pickupItem(item) {
    switch (item.type) {
        case 'ammo':
            player.weapon.ammo = Math.min(player.weapon.maxAmmo, player.weapon.ammo + item.amount);
            break;
        case 'health':
            player.hp = Math.min(player.maxHp, player.hp + item.amount);
            break;
        case 'credits':
            player.credits += item.amount;
            break;
        case 'keycard':
            // Unlock doors
            for (let y = 0; y < MAP_HEIGHT; y++) {
                for (let x = 0; x < MAP_WIDTH; x++) {
                    if (map[y][x].terrain === TERRAIN.DOOR && map[y][x].locked) {
                        map[y][x].locked = false;
                    }
                }
            }
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
            t.terrain === TERRAIN.BARREL || (t.terrain === TERRAIN.DOOR && t.locked)) {
            return false;
        }
    }
    return true;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Draw functions
function draw() {
    // Clear with dark background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Apply screen shake
    if (game.screenShake > 0.1) {
        ctx.translate(
            (Math.random() - 0.5) * game.screenShake,
            (Math.random() - 0.5) * game.screenShake
        );
    }

    // Camera transform
    ctx.translate(-game.camera.x, -game.camera.y);

    drawMap();
    drawItems();
    drawBullets();
    drawEnemies();
    drawPlayer();
    drawParticles();
    drawFlashlight();

    ctx.restore();

    drawUI();

    if (game.state === 'gameover') drawGameOver();
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
    switch (tile.terrain) {
        case TERRAIN.FLOOR:
            // Hexagonal floor pattern
            ctx.fillStyle = tile.variant === 0 ? COLORS.FLOOR : COLORS.FLOOR_HEX;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Grate detail
            ctx.fillStyle = COLORS.FLOOR_GRATE;
            ctx.fillRect(screenX + 4, screenY + 4, 8, 1);
            ctx.fillRect(screenX + 20, screenY + 20, 8, 1);
            ctx.fillRect(screenX + 4, screenY + 26, 8, 1);
            break;

        case TERRAIN.HAZARD_FLOOR:
            // Hazard stripes
            ctx.fillStyle = COLORS.FLOOR;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.HAZARD_YELLOW;
            for (let i = 0; i < 8; i++) {
                ctx.fillRect(screenX + i * 8, screenY + 2, 4, TILE_SIZE - 4);
            }
            ctx.fillStyle = COLORS.HAZARD_BLACK;
            for (let i = 0; i < 8; i++) {
                ctx.fillRect(screenX + i * 8 + 4, screenY + 2, 4, TILE_SIZE - 4);
            }
            break;

        case TERRAIN.WALL:
            // Metal wall with panel detail
            ctx.fillStyle = COLORS.WALL;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = COLORS.WALL_HIGHLIGHT;
            ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, 2);
            ctx.fillRect(screenX + 2, screenY + 2, 2, TILE_SIZE - 4);
            ctx.fillStyle = COLORS.WALL_SHADOW;
            ctx.fillRect(screenX + 2, screenY + TILE_SIZE - 4, TILE_SIZE - 4, 2);
            ctx.fillRect(screenX + TILE_SIZE - 4, screenY + 2, 2, TILE_SIZE - 4);
            // Vent detail
            if ((tileX + tileY) % 3 === 0) {
                ctx.fillStyle = COLORS.FLOOR_GRATE;
                ctx.fillRect(screenX + 8, screenY + 12, 16, 8);
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(screenX + 10, screenY + 14, 3, 4);
                ctx.fillRect(screenX + 15, screenY + 14, 3, 4);
                ctx.fillRect(screenX + 20, screenY + 14, 3, 4);
            }
            break;

        case TERRAIN.DOOR:
            ctx.fillStyle = COLORS.FLOOR;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = tile.locked ? COLORS.DOOR_LOCKED : COLORS.DOOR;
            if (tile.variant === 0) {
                // Horizontal door
                ctx.fillRect(screenX, screenY + 10, TILE_SIZE, 12);
                ctx.fillStyle = tile.locked ? '#ff0000' : '#00ff00';
                ctx.fillRect(screenX + 14, screenY + 14, 4, 4);
            } else {
                // Vertical door
                ctx.fillRect(screenX + 10, screenY, 12, TILE_SIZE);
                ctx.fillStyle = tile.locked ? '#ff0000' : '#00ff00';
                ctx.fillRect(screenX + 14, screenY + 14, 4, 4);
            }
            break;

        case TERRAIN.VENT:
            ctx.fillStyle = COLORS.FLOOR;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            // Grate bars
            ctx.fillStyle = '#333';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(screenX + 6 + i * 6, screenY + 4, 2, TILE_SIZE - 8);
            }
            break;

        case TERRAIN.TERMINAL:
            ctx.fillStyle = COLORS.FLOOR;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Terminal base
            ctx.fillStyle = '#333340';
            ctx.fillRect(screenX + 4, screenY + 8, TILE_SIZE - 8, TILE_SIZE - 12);
            // Screen
            ctx.fillStyle = '#003344';
            ctx.fillRect(screenX + 6, screenY + 10, TILE_SIZE - 12, 12);
            // Screen glow
            ctx.fillStyle = '#00cccc';
            ctx.fillRect(screenX + 8, screenY + 12, TILE_SIZE - 16, 2);
            ctx.fillRect(screenX + 8, screenY + 16, TILE_SIZE - 16, 2);
            break;

        case TERRAIN.CRATE:
            ctx.fillStyle = COLORS.FLOOR;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Crate
            ctx.fillStyle = '#5a4a30';
            ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.fillStyle = '#4a3a20';
            ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, 2);
            ctx.fillRect(screenX + 4, screenY + TILE_SIZE - 8, TILE_SIZE - 8, 2);
            ctx.fillRect(screenX + 4, screenY + 14, TILE_SIZE - 8, 2);
            break;

        case TERRAIN.BARREL:
            ctx.fillStyle = COLORS.FLOOR;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Barrel
            ctx.fillStyle = '#334455';
            ctx.beginPath();
            ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#223344';
            ctx.beginPath();
            ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 8, 0, Math.PI * 2);
            ctx.fill();
            // Hazard symbol
            ctx.fillStyle = COLORS.HAZARD_YELLOW;
            ctx.fillRect(screenX + 12, screenY + 12, 8, 8);
            break;
    }
}

function drawItems() {
    for (const item of items) {
        const screenX = item.x;
        const screenY = item.y;

        // Glow effect
        const pulse = Math.sin(game.tick * 0.1) * 0.3 + 0.7;

        switch (item.type) {
            case 'ammo':
                ctx.fillStyle = `rgba(0, 200, 0, ${pulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = COLORS.AMMO;
                ctx.fillRect(screenX - 6, screenY - 4, 12, 8);
                ctx.fillStyle = '#005500';
                ctx.fillRect(screenX - 4, screenY - 2, 3, 4);
                ctx.fillRect(screenX + 1, screenY - 2, 3, 4);
                break;

            case 'health':
                ctx.fillStyle = `rgba(200, 0, 0, ${pulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#cc0000';
                ctx.fillRect(screenX - 6, screenY - 2, 12, 4);
                ctx.fillRect(screenX - 2, screenY - 6, 4, 12);
                break;

            case 'credits':
                ctx.fillStyle = `rgba(200, 200, 0, ${pulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#cccc00';
                ctx.beginPath();
                ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#888800';
                ctx.fillText('$', screenX - 3, screenY + 3);
                break;

            case 'keycard':
                ctx.fillStyle = `rgba(200, 200, 0, ${pulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ccaa00';
                ctx.fillRect(screenX - 8, screenY - 5, 16, 10);
                ctx.fillStyle = '#886600';
                ctx.fillRect(screenX - 6, screenY - 3, 4, 6);
                break;
        }
    }
}

function drawBullets() {
    for (const bullet of bullets) {
        ctx.fillStyle = COLORS.BULLET;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.fillStyle = 'rgba(255, 200, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(bullet.x - bullet.vx * 0.02, bullet.y - bullet.vy * 0.02, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawEnemies() {
    for (const enemy of enemies) {
        const screenX = enemy.x;
        const screenY = enemy.y;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + 10, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = enemy.color;
        if (enemy.type === 'arachnid') {
            // Larger body
            ctx.beginPath();
            ctx.ellipse(screenX, screenY, 16, 12, enemy.angle, 0, Math.PI * 2);
            ctx.fill();
            // Legs
            ctx.strokeStyle = enemy.color;
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const legAngle = enemy.angle + (i * Math.PI / 2) - Math.PI / 4;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX + Math.cos(legAngle) * 18, screenY + Math.sin(legAngle) * 18);
                ctx.stroke();
            }
        } else {
            // Scorpion body
            ctx.beginPath();
            ctx.ellipse(screenX, screenY, enemy.type === 'scorpion_small' ? 8 : 10, enemy.type === 'scorpion_small' ? 6 : 8, enemy.angle, 0, Math.PI * 2);
            ctx.fill();
            // Tail
            ctx.strokeStyle = enemy.color;
            ctx.lineWidth = enemy.type === 'scorpion_small' ? 2 : 3;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            const tailX = screenX - Math.cos(enemy.angle) * 12;
            const tailY = screenY - Math.sin(enemy.angle) * 12;
            ctx.lineTo(tailX, tailY);
            ctx.lineTo(tailX - Math.cos(enemy.angle) * 5, tailY - Math.sin(enemy.angle) * 5 - 6);
            ctx.stroke();
        }

        // Eyes (red glow)
        ctx.fillStyle = COLORS.ALIEN_EYES;
        const eyeOffset = enemy.type === 'arachnid' ? 6 : 4;
        ctx.beginPath();
        ctx.arc(screenX + Math.cos(enemy.angle) * eyeOffset - 2, screenY + Math.sin(enemy.angle) * eyeOffset - 2, 2, 0, Math.PI * 2);
        ctx.arc(screenX + Math.cos(enemy.angle) * eyeOffset + 2, screenY + Math.sin(enemy.angle) * eyeOffset + 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        if (enemy.hp < enemy.maxHp) {
            ctx.fillStyle = '#330000';
            ctx.fillRect(screenX - 12, screenY - 18, 24, 4);
            ctx.fillStyle = '#cc0000';
            ctx.fillRect(screenX - 12, screenY - 18, 24 * (enemy.hp / enemy.maxHp), 4);
        }
    }
}

function drawPlayer() {
    const screenX = player.x;
    const screenY = player.y;

    // Invincibility flash
    if (player.invincible > 0 && Math.floor(player.invincible * 10) % 2 === 0) {
        return; // Skip drawing for flash effect
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + 8, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(player.angle);

    // Armor
    ctx.fillStyle = COLORS.PLAYER;
    ctx.fillRect(-8, -10, 16, 20);

    // Weapon
    ctx.fillStyle = '#555555';
    ctx.fillRect(5, -3, 15, 6);
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
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(
            screenX + Math.cos(player.angle) * 200,
            screenY + Math.sin(player.angle) * 200
        );
        ctx.stroke();
    }
}

function drawFlashlight() {
    // Flashlight cone
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
                ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'blood':
                ctx.fillStyle = `rgba(200, 0, 0, ${p.life * 2})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'alienblood':
                ctx.fillStyle = `rgba(0, 200, 0, ${p.life * 2.5})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'spark':
                ctx.fillStyle = `rgba(255, 200, 100, ${p.life * 5})`;
                ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
                break;
        }
    }
}

function drawUI() {
    // Top-left: Rank/XP and Lives
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(10, 10, 120, 50);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 120, 50);

    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.font = 'bold 11px Arial';
    ctx.fillText(`RANK/XP`, 18, 26);
    ctx.fillStyle = COLORS.UI_TEXT_DIM;
    ctx.fillText(`${player.rank}/${player.xp}`, 80, 26);

    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.fillText(`LIVES`, 18, 48);
    ctx.fillStyle = '#cc0000';
    for (let i = 0; i < player.lives; i++) {
        ctx.fillText('♥', 70 + i * 15, 48);
    }

    // Bottom-center: Health and Credits
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(200, canvas.height - 50, 240, 40);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(200, canvas.height - 50, 240, 40);

    // Health bar
    ctx.fillStyle = COLORS.HEALTH_BG;
    ctx.fillRect(210, canvas.height - 42, 150, 12);
    ctx.fillStyle = COLORS.HEALTH;
    ctx.fillRect(210, canvas.height - 42, 150 * (player.hp / player.maxHp), 12);
    ctx.strokeStyle = '#440000';
    ctx.strokeRect(210, canvas.height - 42, 150, 12);

    // Credits
    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`$${player.credits}`, 370, canvas.height - 22);

    // Bottom-right: Weapon and Ammo
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(canvas.width - 140, canvas.height - 60, 130, 50);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.strokeRect(canvas.width - 140, canvas.height - 60, 130, 50);

    // Weapon icon
    ctx.fillStyle = '#555555';
    ctx.fillRect(canvas.width - 130, canvas.height - 50, 30, 12);

    // Ammo
    ctx.fillStyle = player.weapon.reloading ? '#ff8800' : COLORS.AMMO;
    ctx.font = 'bold 14px Arial';
    const ammoText = player.weapon.reloading ? 'RELOAD' : `${player.weapon.clip} | ${player.weapon.ammo}`;
    ctx.fillText(ammoText, canvas.width - 90, canvas.height - 38);

    // Weapon name
    ctx.fillStyle = COLORS.UI_TEXT_DIM;
    ctx.font = '10px Arial';
    ctx.fillText(player.weapon.name, canvas.width - 130, canvas.height - 20);

    // Reloading indicator
    if (player.weapon.reloading) {
        ctx.fillStyle = 'rgba(255, 136, 0, 0.5)';
        const reloadProgress = 1 - (player.weapon.reloadTime / 1.5);
        ctx.fillRect(210, canvas.height - 28, 150 * reloadProgress, 4);
    }
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#cc0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = COLORS.UI_TEXT;
    ctx.font = '18px Arial';
    ctx.fillText(`Final Rank: ${player.rank} | Credits: ${player.credits}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 50);
    ctx.textAlign = 'left';
}

// Game loop
let lastTime = 0;
function gameLoop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
    lastTime = currentTime;

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
