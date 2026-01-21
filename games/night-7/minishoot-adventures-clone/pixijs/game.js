// Minishoot Adventures Clone - PixiJS
// Twin-stick shooter adventure

const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x3a5a3a,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
});
document.body.appendChild(app.view);

// Game constants
const TILE_SIZE = 32;
const ROOM_WIDTH = 25;
const ROOM_HEIGHT = 19;
const WORLD_SIZE = 5; // 5x5 rooms

// Biomes
const BIOMES = {
    VILLAGE: { color: 0x4a6a4a, name: 'Central Village' },
    FOREST: { color: 0x3a5a5a, name: 'Blue Forest' },
    CAVES: { color: 0x4a3a5a, name: 'Crystal Caves' }
};

// Game state
const gameState = {
    phase: 'menu', // menu, playing, boss, gameover, victory
    currentRoom: { x: 2, y: 2 }, // Start at center
    biome: 'VILLAGE',
    crystals: 0,
    level: 1,
    xp: 0,
    xpToLevel: 100,
    skillPoints: 0,
    skills: { damage: 0, fireRate: 0, speed: 0 },
    abilities: { dash: false, supershot: false },
    heartPieces: 0,
    energyBatteries: 0,
    bossesDefeated: { forest: false, caves: false }
};

// Player state
const player = {
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    radius: 16,
    baseSpeed: 200,
    health: 3,
    maxHealth: 3,
    energy: 4,
    maxEnergy: 4,
    fireTimer: 0,
    dashTimer: 0,
    dashCooldown: 0,
    dashing: false,
    invincible: 0
};

// World rooms
const worldRooms = {};

// Current room data
let currentEnemies = [];
let currentBullets = [];
let currentPickups = [];

// Containers
const worldContainer = new PIXI.Container();
const roomContainer = new PIXI.Container();
const entityContainer = new PIXI.Container();
const bulletContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();
const menuContainer = new PIXI.Container();

worldContainer.addChild(roomContainer);
worldContainer.addChild(entityContainer);
worldContainer.addChild(bulletContainer);
app.stage.addChild(worldContainer);
app.stage.addChild(uiContainer);
app.stage.addChild(menuContainer);

// Player sprite - cute spaceship
const playerSprite = new PIXI.Graphics();
function drawPlayer() {
    playerSprite.clear();
    const alpha = player.invincible > 0 ? 0.5 : 1;

    // Body - rounded cute shape
    playerSprite.beginFill(0x60C0FF, alpha);
    playerSprite.drawEllipse(0, 0, 16, 12);
    playerSprite.endFill();

    // Cockpit
    playerSprite.beginFill(0xFFFFFF, alpha * 0.8);
    playerSprite.drawEllipse(4, 0, 6, 5);
    playerSprite.endFill();

    // Wings
    playerSprite.beginFill(0x4090C0, alpha);
    playerSprite.moveTo(-8, -10);
    playerSprite.lineTo(-14, -14);
    playerSprite.lineTo(-10, -8);
    playerSprite.closePath();
    playerSprite.moveTo(-8, 10);
    playerSprite.lineTo(-14, 14);
    playerSprite.lineTo(-10, 8);
    playerSprite.closePath();
    playerSprite.endFill();

    // Engine glow
    playerSprite.beginFill(0xFFAA00, alpha * 0.7);
    playerSprite.drawCircle(-14, 0, 4);
    playerSprite.endFill();
}
drawPlayer();
entityContainer.addChild(playerSprite);

// Enemy types
const ENEMY_TYPES = {
    SCOUT: { hp: 4, speed: 100, damage: 1, fireRate: 1, color: 0xFF6060, size: 12, xp: 2, pattern: 'single' },
    GRASSHOPPER: { hp: 6, speed: 150, damage: 1, fireRate: 0.8, color: 0x60FF60, size: 14, xp: 3, pattern: 'burst' },
    TURRET: { hp: 10, speed: 0, damage: 1, fireRate: 1.5, color: 0x808080, size: 16, xp: 5, pattern: 'spray' },
    HEAVY: { hp: 20, speed: 60, damage: 2, fireRate: 0.5, color: 0x8060C0, size: 22, xp: 8, pattern: 'spread' },
    BURROWER: { hp: 12, speed: 120, damage: 1, fireRate: 0.6, color: 0xC08040, size: 14, xp: 6, pattern: 'homing' }
};

// Input
const keys = {};
let mouseX = 400, mouseY = 300;
let mouseDown = false;
let rightMouseDown = false;

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && gameState.phase === 'playing' && gameState.abilities.dash) {
        startDash();
    }
    if (e.code === 'Tab' && gameState.phase === 'playing') {
        e.preventDefault();
        openSkillMenu();
    }
});
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('mousemove', e => {
    const rect = app.view.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});
window.addEventListener('mousedown', e => {
    if (e.button === 0) mouseDown = true;
    if (e.button === 2) rightMouseDown = true;
});
window.addEventListener('mouseup', e => {
    if (e.button === 0) mouseDown = false;
    if (e.button === 2) rightMouseDown = false;
});
window.addEventListener('contextmenu', e => e.preventDefault());

// Dash ability
function startDash() {
    if (player.dashCooldown > 0 || player.dashing) return;

    const dx = mouseX - player.x;
    const dy = mouseY - player.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
        player.vx = (dx / len) * 500;
        player.vy = (dy / len) * 500;
        player.dashing = true;
        player.dashTimer = 0.15;
        player.invincible = 0.15;
    }
}

// Generate room
function generateRoom(rx, ry) {
    const key = `${rx},${ry}`;
    if (worldRooms[key]) return worldRooms[key];

    // Determine biome
    let biome = 'VILLAGE';
    if (ry < 2) biome = 'FOREST';
    else if (ry > 2 || rx < 1 || rx > 3) biome = 'CAVES';
    if (rx === 2 && ry === 2) biome = 'VILLAGE';

    const room = {
        biome,
        tiles: [],
        enemies: [],
        pickups: [],
        exits: { north: ry > 0, south: ry < WORLD_SIZE - 1, east: rx < WORLD_SIZE - 1, west: rx > 0 },
        cleared: rx === 2 && ry === 2, // Village starts cleared
        boss: null
    };

    // Generate tiles
    const biomeData = BIOMES[biome];
    for (let y = 0; y < ROOM_HEIGHT; y++) {
        room.tiles[y] = [];
        for (let x = 0; x < ROOM_WIDTH; x++) {
            // Walls on edges (except exits)
            const isWall = (x === 0 || x === ROOM_WIDTH - 1 || y === 0 || y === ROOM_HEIGHT - 1);
            const isExit = (room.exits.north && y === 0 && x >= 11 && x <= 13) ||
                          (room.exits.south && y === ROOM_HEIGHT - 1 && x >= 11 && x <= 13) ||
                          (room.exits.east && x === ROOM_WIDTH - 1 && y >= 8 && y <= 10) ||
                          (room.exits.west && x === 0 && y >= 8 && y <= 10);

            if (isWall && !isExit) {
                room.tiles[y][x] = 1;
            } else if (!isWall && Math.random() < 0.05) {
                room.tiles[y][x] = 1; // Random obstacles
            } else {
                room.tiles[y][x] = 0;
            }
        }
    }

    // Add enemies (except village)
    if (biome !== 'VILLAGE') {
        const enemyCount = 3 + Math.floor(Math.random() * 4);
        const types = Object.keys(ENEMY_TYPES);

        for (let i = 0; i < enemyCount; i++) {
            let ex, ey;
            do {
                ex = 3 + Math.floor(Math.random() * (ROOM_WIDTH - 6));
                ey = 3 + Math.floor(Math.random() * (ROOM_HEIGHT - 6));
            } while (room.tiles[ey][ex] !== 0);

            room.enemies.push({
                type: types[Math.floor(Math.random() * types.length)],
                x: ex * TILE_SIZE + TILE_SIZE / 2,
                y: ey * TILE_SIZE + TILE_SIZE / 2
            });
        }
    }

    // Add pickups
    if (Math.random() < 0.3 && biome !== 'VILLAGE') {
        room.pickups.push({
            type: Math.random() < 0.5 ? 'crystal' : 'heart',
            x: (5 + Math.floor(Math.random() * 15)) * TILE_SIZE,
            y: (4 + Math.floor(Math.random() * 10)) * TILE_SIZE
        });
    }

    // Boss rooms
    if (rx === 2 && ry === 0 && !gameState.bossesDefeated.forest) {
        room.boss = 'FOREST_GUARDIAN';
        room.cleared = false;
    }
    if (rx === 0 && ry === 4 && !gameState.bossesDefeated.caves) {
        room.boss = 'CRYSTAL_GOLEM';
        room.cleared = false;
    }

    worldRooms[key] = room;
    return room;
}

// Load room
function loadRoom(rx, ry) {
    gameState.currentRoom = { x: rx, y: ry };
    const room = generateRoom(rx, ry);
    gameState.biome = room.biome;

    // Clear containers
    roomContainer.removeChildren();
    entityContainer.removeChildren();
    bulletContainer.removeChildren();
    currentEnemies = [];
    currentBullets = [];
    currentPickups = [];

    // Re-add player
    entityContainer.addChild(playerSprite);

    // Draw floor
    const biomeData = BIOMES[room.biome];
    for (let y = 0; y < ROOM_HEIGHT; y++) {
        for (let x = 0; x < ROOM_WIDTH; x++) {
            const tile = new PIXI.Graphics();
            tile.x = x * TILE_SIZE;
            tile.y = y * TILE_SIZE;

            if (room.tiles[y][x] === 1) {
                // Wall
                tile.beginFill(biomeData.color - 0x202020);
                tile.drawRoundedRect(0, 0, TILE_SIZE, TILE_SIZE, 4);
                tile.endFill();
            } else {
                // Floor with subtle pattern
                tile.beginFill(biomeData.color);
                tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
                tile.endFill();
                if ((x + y) % 2 === 0) {
                    tile.beginFill(biomeData.color + 0x080808, 0.5);
                    tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
                    tile.endFill();
                }
            }
            roomContainer.addChild(tile);
        }
    }

    // Draw exits
    const exitColor = 0x606060;
    if (room.exits.north) {
        const exit = new PIXI.Graphics();
        exit.beginFill(exitColor);
        exit.drawRect(11 * TILE_SIZE, 0, 3 * TILE_SIZE, 4);
        exit.endFill();
        roomContainer.addChild(exit);
    }
    if (room.exits.south) {
        const exit = new PIXI.Graphics();
        exit.beginFill(exitColor);
        exit.drawRect(11 * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE - 4, 3 * TILE_SIZE, 4);
        exit.endFill();
        roomContainer.addChild(exit);
    }
    if (room.exits.east) {
        const exit = new PIXI.Graphics();
        exit.beginFill(exitColor);
        exit.drawRect(ROOM_WIDTH * TILE_SIZE - 4, 8 * TILE_SIZE, 4, 3 * TILE_SIZE);
        exit.endFill();
        roomContainer.addChild(exit);
    }
    if (room.exits.west) {
        const exit = new PIXI.Graphics();
        exit.beginFill(exitColor);
        exit.drawRect(0, 8 * TILE_SIZE, 4, 3 * TILE_SIZE);
        exit.endFill();
        roomContainer.addChild(exit);
    }

    // Spawn enemies
    if (!room.cleared) {
        for (const enemyData of room.enemies) {
            spawnEnemy(enemyData.type, enemyData.x, enemyData.y);
        }

        // Spawn boss
        if (room.boss) {
            spawnBoss(room.boss);
        }
    }

    // Spawn pickups
    for (const pickup of room.pickups) {
        spawnPickup(pickup.type, pickup.x, pickup.y);
    }
}

// Spawn enemy
function spawnEnemy(type, x, y) {
    const template = ENEMY_TYPES[type];
    const enemy = {
        type,
        x, y,
        vx: 0, vy: 0,
        health: template.hp * (1 + gameState.level * 0.05),
        maxHealth: template.hp * (1 + gameState.level * 0.05),
        speed: template.speed,
        damage: template.damage,
        size: template.size,
        color: template.color,
        fireRate: template.fireRate,
        fireTimer: Math.random() * 2,
        pattern: template.pattern,
        xp: template.xp,
        sprite: new PIXI.Graphics()
    };

    drawEnemy(enemy);
    entityContainer.addChild(enemy.sprite);
    currentEnemies.push(enemy);
}

function drawEnemy(enemy) {
    enemy.sprite.clear();
    const s = enemy.size;

    // Cute enemy spaceship
    enemy.sprite.beginFill(enemy.color);
    enemy.sprite.drawCircle(0, 0, s);
    enemy.sprite.endFill();

    // Face
    enemy.sprite.beginFill(0xFFFFFF, 0.8);
    enemy.sprite.drawCircle(s * 0.3, -s * 0.2, s * 0.25);
    enemy.sprite.drawCircle(s * 0.3, s * 0.2, s * 0.25);
    enemy.sprite.endFill();

    // Eyes
    enemy.sprite.beginFill(0x000000);
    enemy.sprite.drawCircle(s * 0.35, -s * 0.2, s * 0.12);
    enemy.sprite.drawCircle(s * 0.35, s * 0.2, s * 0.12);
    enemy.sprite.endFill();

    enemy.sprite.x = enemy.x;
    enemy.sprite.y = enemy.y;
}

// Spawn boss
function spawnBoss(type) {
    const bosses = {
        FOREST_GUARDIAN: { hp: 150, speed: 80, damage: 2, size: 40, color: 0x40A040, name: 'Forest Guardian' },
        CRYSTAL_GOLEM: { hp: 200, speed: 50, damage: 3, size: 50, color: 0x8040C0, name: 'Crystal Golem' }
    };

    const template = bosses[type];
    const boss = {
        type,
        isBoss: true,
        x: ROOM_WIDTH * TILE_SIZE / 2,
        y: ROOM_HEIGHT * TILE_SIZE / 3,
        vx: 0, vy: 0,
        health: template.hp,
        maxHealth: template.hp,
        speed: template.speed,
        damage: template.damage,
        size: template.size,
        color: template.color,
        name: template.name,
        phase: 1,
        attackTimer: 2,
        sprite: new PIXI.Graphics()
    };

    drawBoss(boss);
    entityContainer.addChild(boss.sprite);
    currentEnemies.push(boss);
}

function drawBoss(boss) {
    boss.sprite.clear();
    const s = boss.size;

    // Large body
    boss.sprite.beginFill(boss.color);
    boss.sprite.drawCircle(0, 0, s);
    boss.sprite.endFill();

    // Armor plates
    boss.sprite.beginFill(boss.color - 0x202020);
    boss.sprite.drawEllipse(-s * 0.5, 0, s * 0.4, s * 0.6);
    boss.sprite.drawEllipse(s * 0.5, 0, s * 0.4, s * 0.6);
    boss.sprite.endFill();

    // Eyes
    boss.sprite.beginFill(0xFF0000);
    boss.sprite.drawCircle(s * 0.3, -s * 0.3, s * 0.15);
    boss.sprite.drawCircle(s * 0.3, s * 0.3, s * 0.15);
    boss.sprite.endFill();

    boss.sprite.x = boss.x;
    boss.sprite.y = boss.y;
}

// Spawn pickup
function spawnPickup(type, x, y) {
    const pickup = {
        type,
        x, y,
        sprite: new PIXI.Graphics()
    };

    pickup.sprite.x = x;
    pickup.sprite.y = y;

    if (type === 'crystal') {
        pickup.sprite.beginFill(0xFF4040);
        pickup.sprite.moveTo(0, -10);
        pickup.sprite.lineTo(8, 0);
        pickup.sprite.lineTo(0, 10);
        pickup.sprite.lineTo(-8, 0);
        pickup.sprite.closePath();
        pickup.sprite.endFill();
    } else if (type === 'heart') {
        pickup.sprite.beginFill(0xFF6080);
        pickup.sprite.moveTo(0, -5);
        pickup.sprite.bezierCurveTo(8, -12, 12, 0, 0, 10);
        pickup.sprite.bezierCurveTo(-12, 0, -8, -12, 0, -5);
        pickup.sprite.endFill();
    } else if (type === 'energy') {
        pickup.sprite.beginFill(0x60C0FF);
        pickup.sprite.drawRect(-4, -10, 8, 20);
        pickup.sprite.endFill();
    }

    entityContainer.addChild(pickup.sprite);
    currentPickups.push(pickup);
}

// Fire player bullet
function firePlayerBullet(supershot = false) {
    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    const damage = 1 + gameState.skills.damage * 0.5;
    const speed = 400;

    if (supershot && player.energy > 0) {
        player.energy--;
        // Triple damage supershot
        const bullet = createBullet(player.x, player.y, angle, speed, damage * 3, 'player', 0x40C0FF, true);
        currentBullets.push(bullet);
    } else {
        const bullet = createBullet(player.x, player.y, angle, speed, damage, 'player', 0xFFFF00, false);
        currentBullets.push(bullet);
    }
}

function createBullet(x, y, angle, speed, damage, owner, color, isSuper) {
    const bullet = {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage,
        owner,
        isSuper,
        sprite: new PIXI.Graphics()
    };

    bullet.sprite.beginFill(color);
    bullet.sprite.drawCircle(0, 0, isSuper ? 6 : 4);
    bullet.sprite.endFill();

    if (isSuper) {
        bullet.sprite.beginFill(0xFFFFFF, 0.5);
        bullet.sprite.drawCircle(0, 0, 8);
        bullet.sprite.endFill();
    }

    bullet.sprite.x = x;
    bullet.sprite.y = y;
    bulletContainer.addChild(bullet.sprite);

    return bullet;
}

// Fire enemy bullet
function fireEnemyBullet(enemy, angle, speed = 150) {
    const bullet = {
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: enemy.damage,
        owner: 'enemy',
        sprite: new PIXI.Graphics()
    };

    bullet.sprite.beginFill(0xFF8040);
    bullet.sprite.drawCircle(0, 0, 5);
    bullet.sprite.endFill();

    bullet.sprite.x = bullet.x;
    bullet.sprite.y = bullet.y;
    bulletContainer.addChild(bullet.sprite);
    currentBullets.push(bullet);
}

// Wall collision
function isWall(x, y) {
    const room = worldRooms[`${gameState.currentRoom.x},${gameState.currentRoom.y}`];
    if (!room) return true;

    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    if (tx < 0 || tx >= ROOM_WIDTH || ty < 0 || ty >= ROOM_HEIGHT) return true;
    return room.tiles[ty][tx] === 1;
}

// Update player
function updatePlayer(delta) {
    const dt = delta / 60;

    // Timers
    if (player.invincible > 0) player.invincible -= dt;
    if (player.fireTimer > 0) player.fireTimer -= dt;
    if (player.dashCooldown > 0) player.dashCooldown -= dt;

    // Dashing
    if (player.dashing) {
        player.dashTimer -= dt;
        if (player.dashTimer <= 0) {
            player.dashing = false;
            player.dashCooldown = 0.5;
            player.vx = 0;
            player.vy = 0;
        }
    } else {
        // Normal movement
        let dx = 0, dy = 0;
        if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
        if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
        if (keys['KeyD'] || keys['ArrowRight']) dx = 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        const speed = player.baseSpeed + gameState.skills.speed * 20;
        player.vx = dx * speed;
        player.vy = dy * speed;
    }

    // Apply movement
    const newX = player.x + player.vx * dt;
    const newY = player.y + player.vy * dt;

    if (!isWall(newX - 12, player.y) && !isWall(newX + 12, player.y)) {
        player.x = newX;
    }
    if (!isWall(player.x, newY - 12) && !isWall(player.x, newY + 12)) {
        player.y = newY;
    }

    // Shooting
    if (mouseDown && player.fireTimer <= 0) {
        firePlayerBullet(false);
        player.fireTimer = 1 / (3 + gameState.skills.fireRate * 0.5);
    }
    if (rightMouseDown && player.fireTimer <= 0 && gameState.abilities.supershot && player.energy > 0) {
        firePlayerBullet(true);
        player.fireTimer = 0.5;
    }

    // Update sprite
    playerSprite.x = player.x;
    playerSprite.y = player.y;
    playerSprite.rotation = Math.atan2(mouseY - player.y, mouseX - player.x);
    drawPlayer();

    // Room transitions
    checkRoomTransition();

    // Pickup collection
    for (let i = currentPickups.length - 1; i >= 0; i--) {
        const p = currentPickups[i];
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        if (dx * dx + dy * dy < 400) {
            collectPickup(p);
            entityContainer.removeChild(p.sprite);
            currentPickups.splice(i, 1);
        }
    }
}

function checkRoomTransition() {
    const room = worldRooms[`${gameState.currentRoom.x},${gameState.currentRoom.y}`];
    if (!room) return;

    // Can only transition if room is cleared
    if (!room.cleared) return;

    let newRoom = null;
    let newX = player.x;
    let newY = player.y;

    if (player.y < 20 && room.exits.north) {
        newRoom = { x: gameState.currentRoom.x, y: gameState.currentRoom.y - 1 };
        newY = ROOM_HEIGHT * TILE_SIZE - 40;
    } else if (player.y > ROOM_HEIGHT * TILE_SIZE - 20 && room.exits.south) {
        newRoom = { x: gameState.currentRoom.x, y: gameState.currentRoom.y + 1 };
        newY = 40;
    } else if (player.x > ROOM_WIDTH * TILE_SIZE - 20 && room.exits.east) {
        newRoom = { x: gameState.currentRoom.x + 1, y: gameState.currentRoom.y };
        newX = 40;
    } else if (player.x < 20 && room.exits.west) {
        newRoom = { x: gameState.currentRoom.x - 1, y: gameState.currentRoom.y };
        newX = ROOM_WIDTH * TILE_SIZE - 40;
    }

    if (newRoom) {
        loadRoom(newRoom.x, newRoom.y);
        player.x = newX;
        player.y = newY;
    }
}

function collectPickup(pickup) {
    if (pickup.type === 'crystal') {
        gameState.crystals += 5 + Math.floor(Math.random() * 5);
    } else if (pickup.type === 'heart') {
        player.health = Math.min(player.maxHealth, player.health + 1);
    } else if (pickup.type === 'energy') {
        player.energy = Math.min(player.maxEnergy, player.energy + 1);
    }
}

// Update enemies
function updateEnemies(delta) {
    const dt = delta / 60;

    for (let i = currentEnemies.length - 1; i >= 0; i--) {
        const enemy = currentEnemies[i];

        // Move toward player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 50 && enemy.speed > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            const newX = enemy.x + nx * enemy.speed * dt;
            const newY = enemy.y + ny * enemy.speed * dt;

            if (!isWall(newX, enemy.y)) enemy.x = newX;
            if (!isWall(enemy.x, newY)) enemy.y = newY;
        }

        // Fire at player
        enemy.fireTimer -= dt;
        if (enemy.fireTimer <= 0 && dist < 300) {
            const angle = Math.atan2(dy, dx);

            switch (enemy.pattern) {
                case 'single':
                    fireEnemyBullet(enemy, angle);
                    break;
                case 'burst':
                    for (let j = 0; j < 3; j++) {
                        setTimeout(() => fireEnemyBullet(enemy, angle + (Math.random() - 0.5) * 0.2), j * 100);
                    }
                    break;
                case 'spray':
                    for (let j = 0; j < 8; j++) {
                        fireEnemyBullet(enemy, (j / 8) * Math.PI * 2, 100);
                    }
                    break;
                case 'spread':
                    for (let j = -2; j <= 2; j++) {
                        fireEnemyBullet(enemy, angle + j * 0.2);
                    }
                    break;
                case 'homing':
                    fireEnemyBullet(enemy, angle, 100);
                    break;
            }

            enemy.fireTimer = 1 / enemy.fireRate + Math.random() * 0.5;
        }

        // Boss attacks
        if (enemy.isBoss) {
            enemy.attackTimer -= dt;
            if (enemy.attackTimer <= 0) {
                bossAttack(enemy);
                enemy.attackTimer = 2 + Math.random();
            }
        }

        // Check death
        if (enemy.health <= 0) {
            entityContainer.removeChild(enemy.sprite);
            currentEnemies.splice(i, 1);

            // XP and crystals
            if (!enemy.isBoss) {
                gainXP(enemy.xp);
                gameState.crystals += 1 + Math.floor(Math.random() * 3);
            } else {
                // Boss killed
                gainXP(50);
                gameState.crystals += 50;

                if (enemy.type === 'FOREST_GUARDIAN') {
                    gameState.abilities.dash = true;
                    gameState.bossesDefeated.forest = true;
                } else if (enemy.type === 'CRYSTAL_GOLEM') {
                    gameState.abilities.supershot = true;
                    gameState.bossesDefeated.caves = true;
                }

                // Check victory
                if (gameState.bossesDefeated.forest && gameState.bossesDefeated.caves) {
                    showVictory();
                }
            }

            // Check room cleared
            if (currentEnemies.length === 0) {
                const room = worldRooms[`${gameState.currentRoom.x},${gameState.currentRoom.y}`];
                if (room) room.cleared = true;
            }
            continue;
        }

        enemy.sprite.x = enemy.x;
        enemy.sprite.y = enemy.y;
    }
}

function bossAttack(boss) {
    const angle = Math.atan2(player.y - boss.y, player.x - boss.x);

    // Pattern based on phase
    if (boss.health > boss.maxHealth * 0.5) {
        // Phase 1 - spread shots
        for (let i = 0; i < 12; i++) {
            fireEnemyBullet(boss, (i / 12) * Math.PI * 2, 120);
        }
    } else {
        // Phase 2 - more aggressive
        for (let i = 0; i < 16; i++) {
            fireEnemyBullet(boss, (i / 16) * Math.PI * 2 + Date.now() * 0.001, 150);
        }
        // Aimed burst
        for (let i = -2; i <= 2; i++) {
            fireEnemyBullet(boss, angle + i * 0.15, 200);
        }
    }
}

// Update bullets
function updateBullets(delta) {
    const dt = delta / 60;

    for (let i = currentBullets.length - 1; i >= 0; i--) {
        const bullet = currentBullets[i];

        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.sprite.x = bullet.x;
        bullet.sprite.y = bullet.y;

        // Wall collision
        if (isWall(bullet.x, bullet.y)) {
            bulletContainer.removeChild(bullet.sprite);
            currentBullets.splice(i, 1);
            continue;
        }

        // Hit detection
        if (bullet.owner === 'player') {
            for (const enemy of currentEnemies) {
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                if (dx * dx + dy * dy < enemy.size * enemy.size) {
                    enemy.health -= bullet.damage;
                    bulletContainer.removeChild(bullet.sprite);
                    currentBullets.splice(i, 1);
                    break;
                }
            }
        } else if (bullet.owner === 'enemy') {
            const dx = bullet.x - player.x;
            const dy = bullet.y - player.y;
            if (dx * dx + dy * dy < 256 && player.invincible <= 0) {
                player.health -= bullet.damage;
                player.invincible = 1;
                bulletContainer.removeChild(bullet.sprite);
                currentBullets.splice(i, 1);
                if (player.health <= 0) {
                    showGameOver();
                }
                continue;
            }
        }

        // Out of bounds
        if (bullet.x < 0 || bullet.x > ROOM_WIDTH * TILE_SIZE ||
            bullet.y < 0 || bullet.y > ROOM_HEIGHT * TILE_SIZE) {
            bulletContainer.removeChild(bullet.sprite);
            currentBullets.splice(i, 1);
        }
    }
}

// Gain XP
function gainXP(amount) {
    gameState.xp += amount;
    while (gameState.xp >= gameState.xpToLevel) {
        gameState.xp -= gameState.xpToLevel;
        gameState.level++;
        gameState.skillPoints++;
        gameState.xpToLevel = Math.floor(gameState.xpToLevel * 1.3);
    }
}

// Skill menu
function openSkillMenu() {
    // Simple inline allocation
    if (gameState.skillPoints > 0) {
        // Auto-allocate for now
        const skills = ['damage', 'fireRate', 'speed'];
        const skill = skills[Math.floor(Math.random() * skills.length)];
        gameState.skills[skill]++;
        gameState.skillPoints--;
    }
}

// UI
const uiElements = {};

function createUI() {
    // Health
    uiElements.health = new PIXI.Graphics();
    uiElements.health.x = 20;
    uiElements.health.y = 20;
    uiContainer.addChild(uiElements.health);

    // Energy
    uiElements.energy = new PIXI.Graphics();
    uiElements.energy.x = 20;
    uiElements.energy.y = 45;
    uiContainer.addChild(uiElements.energy);

    // Level & XP
    uiElements.level = new PIXI.Text('Lv 1', { fontSize: 16, fill: 0xFFFFFF });
    uiElements.level.x = 20;
    uiElements.level.y = 70;
    uiContainer.addChild(uiElements.level);

    // Crystals
    uiElements.crystals = new PIXI.Text('Crystals: 0', { fontSize: 14, fill: 0xFF6060 });
    uiElements.crystals.x = 20;
    uiElements.crystals.y = 95;
    uiContainer.addChild(uiElements.crystals);

    // Room indicator
    uiElements.room = new PIXI.Text('Village', { fontSize: 14, fill: 0xFFFF80 });
    uiElements.room.x = 650;
    uiElements.room.y = 20;
    uiContainer.addChild(uiElements.room);

    // Abilities
    uiElements.abilities = new PIXI.Text('', { fontSize: 12, fill: 0x80C0FF });
    uiElements.abilities.x = 650;
    uiElements.abilities.y = 45;
    uiContainer.addChild(uiElements.abilities);

    // Controls hint
    uiElements.controls = new PIXI.Text('[WASD] Move | [Click] Shoot | [Space] Dash | [Tab] Skills', {
        fontSize: 11, fill: 0x808080
    });
    uiElements.controls.x = 200;
    uiElements.controls.y = 580;
    uiContainer.addChild(uiElements.controls);
}

function updateUI() {
    // Health hearts
    uiElements.health.clear();
    for (let i = 0; i < player.maxHealth; i++) {
        uiElements.health.beginFill(i < player.health ? 0xFF6080 : 0x404040);
        uiElements.health.drawCircle(i * 22, 0, 8);
        uiElements.health.endFill();
    }

    // Energy bars
    uiElements.energy.clear();
    for (let i = 0; i < player.maxEnergy; i++) {
        uiElements.energy.beginFill(i < player.energy ? 0x60C0FF : 0x404040);
        uiElements.energy.drawRect(i * 18, 0, 14, 8);
        uiElements.energy.endFill();
    }

    uiElements.level.text = `Lv ${gameState.level} (${gameState.xp}/${gameState.xpToLevel}) SP:${gameState.skillPoints}`;
    uiElements.crystals.text = `Crystals: ${gameState.crystals}`;
    uiElements.room.text = BIOMES[gameState.biome].name;

    let abilities = [];
    if (gameState.abilities.dash) abilities.push('Dash');
    if (gameState.abilities.supershot) abilities.push('Supershot');
    uiElements.abilities.text = abilities.length > 0 ? abilities.join(' | ') : 'No abilities';
}

// Menu
function createMenu() {
    const bg = new PIXI.Graphics();
    bg.beginFill(0x1a2a1a, 0.95);
    bg.drawRect(0, 0, 800, 600);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('MINISHOOT ADVENTURES', {
        fontSize: 48, fill: 0x60C0FF, fontWeight: 'bold'
    });
    title.anchor.set(0.5);
    title.x = 400;
    title.y = 150;
    menuContainer.addChild(title);

    const subtitle = new PIXI.Text('Twin-Stick Shooter Adventure', {
        fontSize: 24, fill: 0x80A0FF
    });
    subtitle.anchor.set(0.5);
    subtitle.x = 400;
    subtitle.y = 210;
    menuContainer.addChild(subtitle);

    const controls = new PIXI.Text(
        'WASD - Move\n' +
        'Mouse - Aim\n' +
        'Left Click - Shoot\n' +
        'Right Click - Supershot (after unlock)\n' +
        'Space - Dash (after unlock)\n' +
        'Tab - Allocate Skill Points\n\n' +
        'Explore the world! Defeat 2 dungeon bosses to win!\n' +
        'Collect crystals, level up, and unlock abilities!',
        { fontSize: 16, fill: 0xA0A0A0, align: 'center', lineHeight: 22 }
    );
    controls.anchor.set(0.5);
    controls.x = 400;
    controls.y = 380;
    menuContainer.addChild(controls);

    const start = new PIXI.Text('[ Click to Start Adventure ]', { fontSize: 28, fill: 0x60FF60 });
    start.anchor.set(0.5);
    start.x = 400;
    start.y = 530;
    start.eventMode = 'static';
    start.cursor = 'pointer';
    start.on('pointerdown', startGame);
    menuContainer.addChild(start);
}

function startGame() {
    gameState.phase = 'playing';
    gameState.level = 1;
    gameState.xp = 0;
    gameState.xpToLevel = 100;
    gameState.crystals = 0;
    gameState.skillPoints = 0;
    gameState.skills = { damage: 0, fireRate: 0, speed: 0 };
    gameState.abilities = { dash: false, supershot: false };
    gameState.bossesDefeated = { forest: false, caves: false };

    player.health = player.maxHealth;
    player.energy = player.maxEnergy;

    loadRoom(2, 2);
    player.x = ROOM_WIDTH * TILE_SIZE / 2;
    player.y = ROOM_HEIGHT * TILE_SIZE / 2;

    menuContainer.visible = false;
}

function showGameOver() {
    gameState.phase = 'gameover';
    menuContainer.visible = true;
    menuContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x2a1a1a, 0.95);
    bg.drawRect(0, 0, 800, 600);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('SHIP DESTROYED', { fontSize: 56, fill: 0xFF4040, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = 400;
    title.y = 250;
    menuContainer.addChild(title);

    const stats = new PIXI.Text(`Level: ${gameState.level}\nCrystals: ${gameState.crystals}`, {
        fontSize: 24, fill: 0xFFFFFF, align: 'center'
    });
    stats.anchor.set(0.5);
    stats.x = 400;
    stats.y = 350;
    menuContainer.addChild(stats);

    const restart = new PIXI.Text('[ Click to Try Again ]', { fontSize: 28, fill: 0xFF8080 });
    restart.anchor.set(0.5);
    restart.x = 400;
    restart.y = 450;
    restart.eventMode = 'static';
    restart.cursor = 'pointer';
    restart.on('pointerdown', () => {
        menuContainer.removeChildren();
        createMenu();
        menuContainer.visible = true;
    });
    menuContainer.addChild(restart);
}

function showVictory() {
    gameState.phase = 'victory';
    menuContainer.visible = true;
    menuContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x1a2a1a, 0.95);
    bg.drawRect(0, 0, 800, 600);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('ADVENTURE COMPLETE!', { fontSize: 48, fill: 0x60FF60, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = 400;
    title.y = 200;
    menuContainer.addChild(title);

    const subtitle = new PIXI.Text('Both dungeon bosses defeated!', { fontSize: 24, fill: 0x80FF80 });
    subtitle.anchor.set(0.5);
    subtitle.x = 400;
    subtitle.y = 270;
    menuContainer.addChild(subtitle);

    const stats = new PIXI.Text(
        `Level: ${gameState.level}\n` +
        `Crystals Collected: ${gameState.crystals}\n` +
        `Skills: DMG+${gameState.skills.damage} FR+${gameState.skills.fireRate} SPD+${gameState.skills.speed}`,
        { fontSize: 20, fill: 0xFFFFFF, align: 'center', lineHeight: 26 }
    );
    stats.anchor.set(0.5);
    stats.x = 400;
    stats.y = 370;
    menuContainer.addChild(stats);

    const restart = new PIXI.Text('[ Click to Play Again ]', { fontSize: 28, fill: 0x80FF80 });
    restart.anchor.set(0.5);
    restart.x = 400;
    restart.y = 480;
    restart.eventMode = 'static';
    restart.cursor = 'pointer';
    restart.on('pointerdown', () => {
        menuContainer.removeChildren();
        createMenu();
        menuContainer.visible = true;
    });
    menuContainer.addChild(restart);
}

// Initialize
createUI();
createMenu();

// Game loop
app.ticker.add((delta) => {
    if (gameState.phase !== 'playing') return;

    updatePlayer(delta);
    updateEnemies(delta);
    updateBullets(delta);
    updateUI();
});

console.log('Minishoot Adventures Clone loaded!');
