// DERELICT: EXPANDED EDITION
// Survival Horror with Fog of War, Vision Cone, O2 Management
// Features: Save/Load, Achievements, Upgrades, 8 Sectors, More Enemies

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const WIDTH = 800;
const HEIGHT = 600;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Color palette
const PALETTE = {
    bg: '#0f0f1b',
    bgDark: '#070710',
    wall: '#1a1a2e',
    wallLight: '#2d2d44',
    floor: '#16161c',
    player: '#4ecdc4',
    playerGlow: '#7ee8e2',
    enemy: '#ff6b6b',
    enemyGlow: '#ff9999',
    flashlight: '#fffae6',
    o2: '#5dade2',
    hp: '#e74c3c',
    integrity: '#f39c12',
    text: '#ecf0f1',
    textDim: '#7f8c8d',
    particle: '#ffcc00',
    blood: '#8b0000',
    spark: '#fff68f',
    poison: '#44ff44',
    ice: '#88ddff'
};

// ============= SAVE DATA =============
const SaveData = {
    bestSector: 1,
    totalKills: 0,
    totalDeaths: 0,
    gamesWon: 0,
    achievements: {},
    upgrades: {
        maxO2: 0,
        maxHp: 0,
        flashlightDuration: 0,
        moveSpeed: 0,
        attackDamage: 0
    },
    credits: 0,
    settings: {
        screenShake: true,
        particles: true,
        showTutorial: true
    },

    save() {
        localStorage.setItem('derelict_expanded', JSON.stringify({
            bestSector: this.bestSector,
            totalKills: this.totalKills,
            totalDeaths: this.totalDeaths,
            gamesWon: this.gamesWon,
            achievements: this.achievements,
            upgrades: this.upgrades,
            credits: this.credits,
            settings: this.settings
        }));
    },

    load() {
        const data = localStorage.getItem('derelict_expanded');
        if (data) {
            const parsed = JSON.parse(data);
            Object.assign(this, parsed);
        }
    }
};

// Load saved data
SaveData.load();

// ============= ACHIEVEMENTS =============
const ACHIEVEMENTS = {
    first_kill: { name: 'First Blood', desc: 'Kill your first creature' },
    sector_2: { name: 'Going Deeper', desc: 'Reach Sector 2' },
    sector_5: { name: 'Halfway There', desc: 'Reach Sector 5' },
    escape: { name: 'Survivor', desc: 'Escape the ship' },
    no_damage: { name: 'Untouchable', desc: 'Clear a sector without taking damage' },
    speed_run: { name: 'Speed Demon', desc: 'Escape in under 10 minutes' },
    kill_50: { name: 'Exterminator', desc: 'Kill 50 creatures total' },
    collect_all: { name: 'Scavenger', desc: 'Collect all items in a sector' }
};

// ============= ENEMY TYPES =============
const ENEMY_TYPES = {
    stalker: { hp: 30, damage: 15, speed: 1.5, size: 12, color: PALETTE.enemy, glowColor: PALETTE.enemyGlow, xp: 10 },
    crawler: { hp: 15, damage: 8, speed: 2.5, size: 8, color: '#88ff88', glowColor: '#44aa44', xp: 5 },
    brute: { hp: 80, damage: 30, speed: 0.8, size: 20, color: '#884444', glowColor: '#662222', xp: 25 },
    spitter: { hp: 25, damage: 12, speed: 1.0, size: 14, color: '#44ff44', glowColor: '#228822', ranged: true, xp: 15 },
    phantom: { hp: 40, damage: 20, speed: 1.8, size: 14, color: '#8844ff', glowColor: '#6622aa', teleport: true, xp: 20 },
    hive: { hp: 60, damage: 10, speed: 0.5, size: 18, color: '#ffaa44', glowColor: '#aa6622', spawner: true, xp: 30 },
    queen: { hp: 200, damage: 40, speed: 0.6, size: 32, color: '#ff0000', glowColor: '#aa0000', boss: true, xp: 100 }
};

// ============= GAME STATE =============
let gameState = 'menu';
let menuState = 'main'; // main, upgrades, achievements, settings, tutorial
let player = null;
let enemies = [];
let particles = [];
let decals = [];
let items = [];
let projectiles = [];
let room = [];
let lights = [];

let screenShake = { x: 0, y: 0, intensity: 0 };
let ambientPulse = 0;
let time = 0;
let runTime = 0;
let sectorDamage = false;
let sectorItems = 0;
let sectorItemsCollected = 0;

const ROOM_W = 25;
const ROOM_H = 19;
const TILE = 32;

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false };
window.addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'Escape') togglePause(); });
window.addEventListener('keyup', e => { keys[e.code] = false; });
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', () => mouse.down = true);
canvas.addEventListener('mouseup', () => mouse.down = false);
canvas.addEventListener('click', handleClick);

// Expose for testing
window.getGameState = () => ({
    screen: gameState,
    sector: player ? player.sector : 0,
    hp: player ? player.hp : 0,
    o2: player ? player.o2 : 0,
    enemies: enemies.length
});

// ============= PLAYER CLASS =============
class Player {
    constructor() {
        this.x = 400;
        this.y = 500;
        this.angle = -Math.PI / 2;
        this.vx = 0;
        this.vy = 0;
        this.sector = 1;

        // Stats with upgrades
        this.maxHp = 100 + SaveData.upgrades.maxHp * 25;
        this.hp = this.maxHp;
        this.maxO2 = 100 + SaveData.upgrades.maxO2 * 20;
        this.o2 = this.maxO2;
        this.maxBattery = 100 + SaveData.upgrades.flashlightDuration * 30;
        this.battery = this.maxBattery;
        this.flashlightOn = true;
        this.speed = 3 + SaveData.upgrades.moveSpeed * 0.5;
        this.damage = 20 + SaveData.upgrades.attackDamage * 5;

        this.attackCooldown = 0;
        this.invincible = 0;
        this.kills = 0;
        this.credits = 0;
    }
}

// ============= GAME FUNCTIONS =============
function startGame() {
    player = new Player();
    enemies = [];
    particles = [];
    decals = [];
    items = [];
    projectiles = [];
    runTime = 0;
    sectorDamage = false;
    generateRoom(1);
    gameState = 'playing';
}

function generateRoom(sector) {
    room = [];
    enemies = [];
    items = [];
    projectiles = [];
    lights = [];
    sectorItems = 0;
    sectorItemsCollected = 0;
    sectorDamage = false;
    player.sector = sector;

    // Generate room layout
    for (let y = 0; y < ROOM_H; y++) {
        const row = [];
        for (let x = 0; x < ROOM_W; x++) {
            if (x === 0 || x === ROOM_W - 1 || y === 0 || y === ROOM_H - 1) {
                row.push(1); // Wall
            } else {
                row.push(0); // Floor
            }
        }
        room.push(row);
    }

    // Add internal walls based on sector
    addSectorLayout(sector);

    // Spawn enemies based on sector
    spawnEnemies(sector);

    // Spawn items
    spawnItems(sector);

    // Add lights
    addLights(sector);

    // Position player
    player.x = 400;
    player.y = 500;
    player.o2 = Math.min(player.maxO2, player.o2 + 30);
}

function addSectorLayout(sector) {
    const layouts = {
        1: () => {
            // Simple corridors
            for (let x = 5; x < 10; x++) room[5][x] = 1;
            for (let x = 15; x < 20; x++) room[5][x] = 1;
            for (let x = 5; x < 10; x++) room[13][x] = 1;
            for (let x = 15; x < 20; x++) room[13][x] = 1;
        },
        2: () => {
            // L-shaped walls
            for (let y = 3; y < 10; y++) room[y][8] = 1;
            for (let x = 8; x < 15; x++) room[9][x] = 1;
            for (let y = 9; y < 16; y++) room[y][16] = 1;
        },
        3: () => {
            // Central room
            for (let x = 8; x < 17; x++) { room[5][x] = 1; room[13][x] = 1; }
            for (let y = 5; y < 14; y++) { room[y][8] = 1; room[y][16] = 1; }
            room[9][8] = 0; room[9][16] = 0; // Doors
        },
        4: () => {
            // Maze-like
            for (let x = 3; x < 8; x++) room[4][x] = 1;
            for (let x = 10; x < 15; x++) room[7][x] = 1;
            for (let x = 17; x < 22; x++) room[4][x] = 1;
            for (let y = 10; y < 15; y++) room[y][6] = 1;
            for (let y = 10; y < 15; y++) room[y][18] = 1;
        },
        5: () => {
            // Cross pattern
            for (let y = 4; y < 15; y++) { if (y !== 9) room[y][12] = 1; }
            for (let x = 5; x < 20; x++) { if (x !== 12) room[9][x] = 1; }
        },
        6: () => {
            // Scattered pillars
            const pillars = [[5,4], [5,14], [10,7], [10,11], [15,4], [15,14], [19,9]];
            pillars.forEach(([y, x]) => {
                for (let dy = 0; dy < 2; dy++)
                    for (let dx = 0; dx < 2; dx++)
                        if (room[y+dy] && room[y+dy][x+dx] !== undefined) room[y+dy][x+dx] = 1;
            });
        },
        7: () => {
            // Narrow passages
            for (let y = 3; y < 16; y++) {
                if (y !== 9) { room[y][6] = 1; room[y][12] = 1; room[y][18] = 1; }
            }
        },
        8: () => {
            // Boss arena - mostly open
            for (let x = 10; x < 15; x++) { room[4][x] = 1; room[14][x] = 1; }
        }
    };

    (layouts[sector] || layouts[1])();

    // Add exit door
    if (sector < 8) {
        room[1][12] = 2; // Exit door
    } else {
        room[1][12] = 3; // Escape pod
    }
}

function spawnEnemies(sector) {
    const spawns = {
        1: { stalker: 3, crawler: 2 },
        2: { stalker: 4, crawler: 4, brute: 1 },
        3: { stalker: 3, crawler: 3, spitter: 2, brute: 1 },
        4: { stalker: 5, crawler: 5, spitter: 3, phantom: 2 },
        5: { stalker: 4, spitter: 4, phantom: 3, hive: 1, brute: 2 },
        6: { stalker: 6, spitter: 4, phantom: 4, hive: 2, brute: 2 },
        7: { stalker: 8, spitter: 5, phantom: 5, hive: 2, brute: 3 },
        8: { queen: 1, stalker: 4, crawler: 6, phantom: 2 }
    };

    const spawn = spawns[sector] || spawns[1];

    Object.entries(spawn).forEach(([type, count]) => {
        for (let i = 0; i < count; i++) {
            let x, y, attempts = 0;
            do {
                x = Math.floor(Math.random() * (ROOM_W - 4)) + 2;
                y = Math.floor(Math.random() * (ROOM_H - 6)) + 2;
                attempts++;
            } while ((room[y][x] !== 0 || Math.hypot(x * TILE - player.x, y * TILE - player.y) < 200) && attempts < 50);

            if (attempts < 50) {
                const def = ENEMY_TYPES[type];
                enemies.push({
                    x: x * TILE + TILE / 2,
                    y: y * TILE + TILE / 2,
                    type,
                    ...def,
                    maxHp: def.hp,
                    lastAttack: 0,
                    spawnTimer: 0,
                    alertLevel: 0
                });
            }
        }
    });
}

function spawnItems(sector) {
    // O2 canisters
    const o2Count = 3 + Math.floor(sector / 2);
    for (let i = 0; i < o2Count; i++) {
        placeItem('o2', 30);
    }

    // Health kits
    const hpCount = 2 + Math.floor(sector / 3);
    for (let i = 0; i < hpCount; i++) {
        placeItem('health', 25);
    }

    // Battery
    for (let i = 0; i < 2; i++) {
        placeItem('battery', 40);
    }

    // Credits
    const creditCount = 4 + sector;
    for (let i = 0; i < creditCount; i++) {
        placeItem('credit', 10 + Math.floor(Math.random() * 20));
    }

    sectorItems = items.length;
}

function placeItem(type, value) {
    let x, y, attempts = 0;
    do {
        x = Math.floor(Math.random() * (ROOM_W - 4)) + 2;
        y = Math.floor(Math.random() * (ROOM_H - 4)) + 2;
        attempts++;
    } while (room[y][x] !== 0 && attempts < 30);

    if (attempts < 30) {
        items.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, type, value, pulse: Math.random() * Math.PI * 2 });
    }
}

function addLights(sector) {
    // Emergency lights
    const lightCount = 5 - Math.floor(sector / 2);
    for (let i = 0; i < Math.max(1, lightCount); i++) {
        let x = Math.floor(Math.random() * (ROOM_W - 4)) + 2;
        let y = Math.floor(Math.random() * (ROOM_H - 4)) + 2;
        lights.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, radius: 80, color: '#ff4444', flicker: Math.random() });
    }
}

// ============= UPDATE FUNCTIONS =============
function update(dt) {
    if (gameState !== 'playing') return;

    runTime += dt;
    time += dt;
    ambientPulse = Math.sin(time * 2) * 0.1;

    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateScreenShake(dt);

    // O2 drain
    player.o2 -= dt * (0.5 + player.sector * 0.1);
    if (player.o2 <= 0) {
        player.o2 = 0;
        player.hp -= dt * 10;
    }

    // Flashlight drain
    if (player.flashlightOn) {
        player.battery -= dt * 0.8;
        if (player.battery <= 0) {
            player.battery = 0;
            player.flashlightOn = false;
        }
    }

    // Invincibility
    if (player.invincible > 0) player.invincible -= dt;

    // Attack cooldown
    if (player.attackCooldown > 0) player.attackCooldown -= dt;

    // Check death
    if (player.hp <= 0) {
        gameOver();
    }
}

function updatePlayer(dt) {
    let moveX = 0, moveY = 0;

    if (keys['KeyW'] || keys['ArrowUp']) moveY = -1;
    if (keys['KeyS'] || keys['ArrowDown']) moveY = 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX = -1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX = 1;

    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.707;
        moveY *= 0.707;
    }

    player.vx = moveX * player.speed * 60;
    player.vy = moveY * player.speed * 60;

    // Apply velocity with collision
    const newX = player.x + player.vx * dt;
    const newY = player.y + player.vy * dt;

    if (!isWall(newX, player.y)) player.x = newX;
    if (!isWall(player.x, newY)) player.y = newY;

    // Clamp to room
    player.x = Math.max(TILE, Math.min(WIDTH - TILE, player.x));
    player.y = Math.max(TILE, Math.min(HEIGHT - TILE, player.y));

    // Aim towards mouse
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Toggle flashlight
    if (keys['KeyF'] && !keys['KeyF_prev'] && player.battery > 0) {
        player.flashlightOn = !player.flashlightOn;
    }
    keys['KeyF_prev'] = keys['KeyF'];

    // Collect items
    items = items.filter(item => {
        const dist = Math.hypot(item.x - player.x, item.y - player.y);
        if (dist < 25) {
            collectItem(item);
            return false;
        }
        return true;
    });

    // Check exit
    const tx = Math.floor(player.x / TILE);
    const ty = Math.floor(player.y / TILE);
    if (room[ty] && room[ty][tx] === 2 && enemies.length === 0) {
        // Next sector
        if (!sectorDamage) {
            unlockAchievement('no_damage');
        }
        if (sectorItemsCollected >= sectorItems) {
            unlockAchievement('collect_all');
        }
        generateRoom(player.sector + 1);
        if (player.sector > SaveData.bestSector) {
            SaveData.bestSector = player.sector;
            SaveData.save();
        }
        if (player.sector >= 2) unlockAchievement('sector_2');
        if (player.sector >= 5) unlockAchievement('sector_5');
    } else if (room[ty] && room[ty][tx] === 3 && enemies.length === 0) {
        victory();
    }
}

function updateEnemies(dt) {
    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        // Check if in flashlight cone
        const angleToEnemy = Math.atan2(dy, dx);
        const angleDiff = Math.abs(normalizeAngle(angleToEnemy - player.angle));
        const inCone = player.flashlightOn && angleDiff < Math.PI / 4 && dist < 250;

        // Alert level
        if (inCone || dist < 80) {
            enemy.alertLevel = Math.min(1, enemy.alertLevel + dt * 2);
        } else {
            enemy.alertLevel = Math.max(0, enemy.alertLevel - dt * 0.5);
        }

        // Movement
        if (enemy.alertLevel > 0.5 || dist < 100) {
            const angle = Math.atan2(dy, dx);
            const speed = enemy.speed * (60 + enemy.alertLevel * 30);
            const newX = enemy.x + Math.cos(angle) * speed * dt;
            const newY = enemy.y + Math.sin(angle) * speed * dt;

            if (!isWall(newX, enemy.y)) enemy.x = newX;
            if (!isWall(enemy.x, newY)) enemy.y = newY;
        }

        // Teleport for phantoms
        if (enemy.teleport && enemy.alertLevel > 0.8 && Math.random() < 0.01) {
            const teleportDist = 100;
            const angle = Math.random() * Math.PI * 2;
            const tx = player.x + Math.cos(angle) * teleportDist;
            const ty = player.y + Math.sin(angle) * teleportDist;
            if (!isWall(tx, ty)) {
                addParticles(enemy.x, enemy.y, enemy.glowColor, 10);
                enemy.x = tx;
                enemy.y = ty;
                addParticles(tx, ty, enemy.glowColor, 10);
            }
        }

        // Ranged attack
        if (enemy.ranged && dist < 300 && dist > 100 && time - enemy.lastAttack > 2) {
            enemy.lastAttack = time;
            const angle = Math.atan2(dy, dx);
            projectiles.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * 200,
                vy: Math.sin(angle) * 200,
                damage: enemy.damage * 0.5,
                color: PALETTE.poison
            });
        }

        // Spawning
        if (enemy.spawner && enemy.alertLevel > 0.5 && time - enemy.spawnTimer > 5) {
            enemy.spawnTimer = time;
            if (enemies.length < 20) {
                const def = ENEMY_TYPES.crawler;
                enemies.push({
                    x: enemy.x + (Math.random() - 0.5) * 50,
                    y: enemy.y + (Math.random() - 0.5) * 50,
                    type: 'crawler',
                    ...def,
                    maxHp: def.hp,
                    lastAttack: 0,
                    spawnTimer: 0,
                    alertLevel: 1
                });
            }
        }

        // Melee attack
        if (dist < enemy.size + 16) {
            if (player.invincible <= 0) {
                takeDamage(enemy.damage);
            }
        }
    });
}

function updateProjectiles(dt) {
    projectiles = projectiles.filter(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Hit player
        if (Math.hypot(p.x - player.x, p.y - player.y) < 16) {
            if (player.invincible <= 0) {
                takeDamage(p.damage);
            }
            return false;
        }

        // Hit wall
        if (isWall(p.x, p.y)) return false;

        // Out of bounds
        if (p.x < 0 || p.x > WIDTH || p.y < 0 || p.y > HEIGHT) return false;

        return true;
    });
}

function updateParticles(dt) {
    particles = particles.filter(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.vy += 50 * dt; // Gravity
        return p.life > 0;
    });
}

function updateScreenShake(dt) {
    if (screenShake.intensity > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity;
        screenShake.intensity *= 0.9;
        if (screenShake.intensity < 0.5) screenShake.intensity = 0;
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
    }
}

function attack() {
    if (gameState !== 'playing' || player.attackCooldown > 0) return;

    player.attackCooldown = 0.3;
    addScreenShake(5);

    // Attack in front of player
    const attackRange = 50;
    const attackAngle = 0.6;

    enemies = enemies.filter(enemy => {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const angleDiff = Math.abs(normalizeAngle(angle - player.angle));

        if (dist < attackRange && angleDiff < attackAngle) {
            enemy.hp -= player.damage;
            addParticles(enemy.x, enemy.y, PALETTE.blood, 8);
            addScreenShake(3);

            if (enemy.hp <= 0) {
                // Enemy killed
                addParticles(enemy.x, enemy.y, PALETTE.blood, 15);
                decals.push({ x: enemy.x, y: enemy.y, size: enemy.size, alpha: 0.8 });
                player.kills++;
                player.credits += Math.floor(enemy.xp / 2);
                SaveData.totalKills++;
                if (SaveData.totalKills === 1) unlockAchievement('first_kill');
                if (SaveData.totalKills >= 50) unlockAchievement('kill_50');
                return false;
            }
        }
        return true;
    });

    // Attack particles
    addParticles(
        player.x + Math.cos(player.angle) * 30,
        player.y + Math.sin(player.angle) * 30,
        PALETTE.spark, 5
    );
}

function takeDamage(amount) {
    player.hp -= amount;
    player.invincible = 1;
    sectorDamage = true;
    addScreenShake(10);
    addParticles(player.x, player.y, PALETTE.blood, 5);
}

function collectItem(item) {
    sectorItemsCollected++;

    switch (item.type) {
        case 'o2':
            player.o2 = Math.min(player.maxO2, player.o2 + item.value);
            break;
        case 'health':
            player.hp = Math.min(player.maxHp, player.hp + item.value);
            break;
        case 'battery':
            player.battery = Math.min(player.maxBattery, player.battery + item.value);
            break;
        case 'credit':
            player.credits += item.value;
            SaveData.credits += item.value;
            break;
    }

    addParticles(item.x, item.y, PALETTE.particle, 5);
}

function gameOver() {
    gameState = 'gameover';
    SaveData.totalDeaths++;
    SaveData.credits += player.credits;
    SaveData.save();
}

function victory() {
    gameState = 'victory';
    SaveData.gamesWon++;
    SaveData.credits += player.credits + 500;
    unlockAchievement('escape');
    if (runTime < 600) unlockAchievement('speed_run');
    SaveData.save();
}

function unlockAchievement(key) {
    if (!SaveData.achievements[key]) {
        SaveData.achievements[key] = true;
        SaveData.save();
        // Could show notification here
    }
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
    } else if (gameState === 'paused') {
        gameState = 'playing';
    }
}

function handleClick() {
    if (gameState === 'menu') {
        // Menu navigation handled separately
    } else if (gameState === 'playing') {
        attack();
    } else if (gameState === 'gameover' || gameState === 'victory') {
        gameState = 'menu';
        menuState = 'main';
    }
}

// ============= HELPER FUNCTIONS =============
function isWall(x, y) {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (ty < 0 || ty >= ROOM_H || tx < 0 || tx >= ROOM_W) return true;
    return room[ty][tx] === 1;
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function addParticles(x, y, color, count) {
    if (!SaveData.settings.particles) return;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 100;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.5 + Math.random() * 0.5,
            color,
            size: 2 + Math.random() * 3
        });
    }
}

function addScreenShake(intensity) {
    if (SaveData.settings.screenShake) {
        screenShake.intensity = Math.max(screenShake.intensity, intensity);
    }
}

// ============= DRAW FUNCTIONS =============
function draw() {
    ctx.save();

    // Apply screen shake
    ctx.translate(screenShake.x, screenShake.y);

    // Background
    ctx.fillStyle = PALETTE.bgDark;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (gameState === 'menu') {
        drawMenu();
    } else if (gameState === 'playing' || gameState === 'paused') {
        drawGame();
        if (gameState === 'paused') drawPauseOverlay();
    } else if (gameState === 'gameover') {
        drawGame();
        drawGameOver();
    } else if (gameState === 'victory') {
        drawGame();
        drawVictory();
    }

    ctx.restore();
}

function drawGame() {
    // Draw room
    for (let y = 0; y < ROOM_H; y++) {
        for (let x = 0; x < ROOM_W; x++) {
            const px = x * TILE;
            const py = y * TILE;

            if (room[y][x] === 1) {
                ctx.fillStyle = PALETTE.wall;
                ctx.fillRect(px, py, TILE, TILE);
                ctx.fillStyle = PALETTE.wallLight;
                ctx.fillRect(px + 2, py + 2, TILE - 4, 4);
            } else if (room[y][x] === 2) {
                // Exit door
                ctx.fillStyle = enemies.length === 0 ? '#44ff44' : '#444444';
                ctx.fillRect(px, py, TILE, TILE);
                ctx.fillStyle = '#ffffff';
                ctx.fillText('EXIT', px + 4, py + 20);
            } else if (room[y][x] === 3) {
                // Escape pod
                ctx.fillStyle = enemies.length === 0 ? '#4444ff' : '#444444';
                ctx.fillRect(px, py, TILE, TILE);
            } else {
                ctx.fillStyle = PALETTE.floor;
                ctx.fillRect(px, py, TILE, TILE);
            }
        }
    }

    // Blood decals
    decals.forEach(d => {
        ctx.globalAlpha = d.alpha;
        ctx.fillStyle = PALETTE.blood;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    // Items
    items.forEach(item => {
        item.pulse += 0.05;
        const scale = 1 + Math.sin(item.pulse) * 0.1;

        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.scale(scale, scale);

        switch (item.type) {
            case 'o2':
                ctx.fillStyle = PALETTE.o2;
                ctx.fillRect(-8, -8, 16, 16);
                ctx.fillStyle = '#fff';
                ctx.fillText('O2', -8, 4);
                break;
            case 'health':
                ctx.fillStyle = PALETTE.hp;
                ctx.fillRect(-6, -2, 12, 4);
                ctx.fillRect(-2, -6, 4, 12);
                break;
            case 'battery':
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(-6, -8, 12, 16);
                ctx.fillStyle = '#888';
                ctx.fillRect(-4, -10, 8, 4);
                break;
            case 'credit':
                ctx.fillStyle = '#ffdd00';
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.fillText('$', -4, 4);
                break;
        }
        ctx.restore();
    });

    // Projectiles
    projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Enemies
    enemies.forEach(enemy => {
        // Glow
        ctx.fillStyle = enemy.glowColor;
        ctx.globalAlpha = 0.3 + enemy.alertLevel * 0.4;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Body
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        const eyeAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        ctx.beginPath();
        ctx.arc(enemy.x + Math.cos(eyeAngle) * enemy.size * 0.4, enemy.y + Math.sin(eyeAngle) * enemy.size * 0.4, enemy.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(enemy.x + Math.cos(eyeAngle) * enemy.size * 0.4, enemy.y + Math.sin(eyeAngle) * enemy.size * 0.4, enemy.size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // HP bar for bosses
        if (enemy.boss) {
            ctx.fillStyle = '#333';
            ctx.fillRect(enemy.x - 30, enemy.y - enemy.size - 15, 60, 8);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(enemy.x - 29, enemy.y - enemy.size - 14, (enemy.hp / enemy.maxHp) * 58, 6);
        }
    });

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    // Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Glow
    ctx.fillStyle = PALETTE.playerGlow;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Body
    ctx.fillStyle = player.invincible > 0 ? '#ffffff' : PALETTE.player;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // Direction indicator
    ctx.fillStyle = '#fff';
    ctx.fillRect(10, -3, 8, 6);

    ctx.restore();

    // Flashlight cone
    if (player.flashlightOn) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.arc(player.x, player.y, 250, player.angle - Math.PI / 4, player.angle + Math.PI / 4);
        ctx.closePath();
        const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 250);
        gradient.addColorStop(0, 'rgba(255, 250, 230, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 250, 230, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
    }

    // Fog of war
    drawFogOfWar();

    // HUD
    drawHUD();
}

function drawFogOfWar() {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';

    // Dark overlay
    ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.globalCompositeOperation = 'destination-out';

    // Vision around player
    const visionRadius = player.flashlightOn ? 100 : 60;
    const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, visionRadius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, visionRadius, 0, Math.PI * 2);
    ctx.fill();

    // Flashlight cone
    if (player.flashlightOn) {
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.arc(player.x, player.y, 250, player.angle - Math.PI / 4, player.angle + Math.PI / 4);
        ctx.closePath();
        const coneGradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 250);
        coneGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        coneGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = coneGradient;
        ctx.fill();
    }

    // Emergency lights
    lights.forEach(light => {
        const flicker = 0.8 + Math.sin(time * 10 + light.flicker * 100) * 0.2;
        const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius * flicker);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(light.x, light.y, light.radius * flicker, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.restore();
}

function drawHUD() {
    // Background bars
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 80);

    // HP bar
    ctx.fillStyle = '#333';
    ctx.fillRect(15, 15, 150, 16);
    ctx.fillStyle = PALETTE.hp;
    ctx.fillRect(15, 15, (player.hp / player.maxHp) * 150, 16);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Share Tech Mono';
    ctx.fillText('HP: ' + Math.floor(player.hp), 170, 27);

    // O2 bar
    ctx.fillStyle = '#333';
    ctx.fillRect(15, 35, 150, 16);
    ctx.fillStyle = PALETTE.o2;
    ctx.fillRect(15, 35, (player.o2 / player.maxO2) * 150, 16);
    ctx.fillStyle = '#fff';
    ctx.fillText('O2: ' + Math.floor(player.o2), 170, 47);

    // Battery bar
    ctx.fillStyle = '#333';
    ctx.fillRect(15, 55, 150, 16);
    ctx.fillStyle = player.flashlightOn ? '#ffff00' : '#888';
    ctx.fillRect(15, 55, (player.battery / player.maxBattery) * 150, 16);
    ctx.fillStyle = '#fff';
    ctx.fillText('BAT: ' + Math.floor(player.battery), 170, 67);

    // Sector
    ctx.fillStyle = PALETTE.text;
    ctx.font = '16px Creepster';
    ctx.fillText('SECTOR ' + player.sector + '/8', 15, 90);

    // Enemies remaining
    ctx.fillStyle = PALETTE.enemy;
    ctx.fillText('HOSTILES: ' + enemies.length, 120, 90);

    // Credits
    ctx.fillStyle = '#ffdd00';
    ctx.fillText('$' + player.credits, WIDTH - 80, 25);

    // Kills
    ctx.fillStyle = '#ff4444';
    ctx.fillText('KILLS: ' + player.kills, WIDTH - 80, 45);

    // Time
    const mins = Math.floor(runTime / 60);
    const secs = Math.floor(runTime % 60);
    ctx.fillStyle = '#888';
    ctx.fillText(mins + ':' + secs.toString().padStart(2, '0'), WIDTH - 80, 65);

    // Controls hint
    ctx.fillStyle = '#555';
    ctx.font = '11px Share Tech Mono';
    ctx.fillText('[WASD] Move  [Mouse] Aim  [Click] Attack  [F] Flashlight  [ESC] Pause', 10, HEIGHT - 10);
}

function drawMenu() {
    // Title
    ctx.fillStyle = '#ff3333';
    ctx.font = '48px Creepster';
    ctx.fillText('DERELICT', WIDTH / 2 - 100, 100);
    ctx.fillStyle = '#ff6666';
    ctx.font = '20px Share Tech Mono';
    ctx.fillText('EXPANDED EDITION', WIDTH / 2 - 80, 130);

    // Stats
    ctx.fillStyle = '#888';
    ctx.font = '14px Share Tech Mono';
    ctx.fillText('Best Sector: ' + SaveData.bestSector + ' | Kills: ' + SaveData.totalKills + ' | Escapes: ' + SaveData.gamesWon, WIDTH / 2 - 150, 170);
    ctx.fillText('Credits: $' + SaveData.credits, WIDTH / 2 - 50, 190);

    // Menu buttons
    const buttons = [
        { text: 'START GAME', y: 250, action: () => startGame() },
        { text: 'UPGRADES', y: 300, action: () => menuState = 'upgrades' },
        { text: 'ACHIEVEMENTS', y: 350, action: () => menuState = 'achievements' },
        { text: 'SETTINGS', y: 400, action: () => menuState = 'settings' },
        { text: 'TUTORIAL', y: 450, action: () => menuState = 'tutorial' }
    ];

    if (menuState === 'main') {
        buttons.forEach(btn => {
            const hover = mouse.x > WIDTH / 2 - 100 && mouse.x < WIDTH / 2 + 100 && mouse.y > btn.y - 15 && mouse.y < btn.y + 15;
            ctx.fillStyle = hover ? '#ff4444' : '#333';
            ctx.fillRect(WIDTH / 2 - 100, btn.y - 15, 200, 30);
            ctx.fillStyle = hover ? '#fff' : '#aaa';
            ctx.font = '18px Share Tech Mono';
            ctx.fillText(btn.text, WIDTH / 2 - ctx.measureText(btn.text).width / 2, btn.y + 6);

            if (hover && mouse.down) {
                mouse.down = false;
                btn.action();
            }
        });
    } else if (menuState === 'upgrades') {
        drawUpgradesMenu();
    } else if (menuState === 'achievements') {
        drawAchievementsMenu();
    } else if (menuState === 'settings') {
        drawSettingsMenu();
    } else if (menuState === 'tutorial') {
        drawTutorialMenu();
    }
}

function drawUpgradesMenu() {
    ctx.fillStyle = '#fff';
    ctx.font = '24px Creepster';
    ctx.fillText('UPGRADES', WIDTH / 2 - 60, 220);
    ctx.fillStyle = '#ffdd00';
    ctx.font = '16px Share Tech Mono';
    ctx.fillText('Credits: $' + SaveData.credits, WIDTH / 2 - 50, 250);

    const upgrades = [
        { key: 'maxO2', name: 'O2 Capacity', cost: 100, max: 5 },
        { key: 'maxHp', name: 'Max Health', cost: 150, max: 5 },
        { key: 'flashlightDuration', name: 'Battery Life', cost: 120, max: 5 },
        { key: 'moveSpeed', name: 'Move Speed', cost: 200, max: 3 },
        { key: 'attackDamage', name: 'Attack Power', cost: 250, max: 5 }
    ];

    upgrades.forEach((upg, i) => {
        const y = 290 + i * 45;
        const level = SaveData.upgrades[upg.key];
        const cost = upg.cost * (level + 1);
        const canBuy = level < upg.max && SaveData.credits >= cost;

        ctx.fillStyle = '#aaa';
        ctx.font = '14px Share Tech Mono';
        ctx.fillText(upg.name, 200, y);

        // Level indicators
        for (let j = 0; j < upg.max; j++) {
            ctx.fillStyle = j < level ? '#44ff44' : '#333';
            ctx.fillRect(350 + j * 20, y - 10, 15, 15);
        }

        if (level < upg.max) {
            const hover = mouse.x > 500 && mouse.x < 600 && mouse.y > y - 15 && mouse.y < y + 5;
            ctx.fillStyle = canBuy ? (hover ? '#44ff44' : '#228822') : '#444';
            ctx.fillRect(500, y - 12, 80, 22);
            ctx.fillStyle = canBuy ? '#fff' : '#666';
            ctx.fillText('$' + cost, 520, y + 4);

            if (hover && mouse.down && canBuy) {
                mouse.down = false;
                SaveData.credits -= cost;
                SaveData.upgrades[upg.key]++;
                SaveData.save();
            }
        } else {
            ctx.fillStyle = '#ffaa00';
            ctx.fillText('MAX', 520, y + 4);
        }
    });

    drawBackButton();
}

function drawAchievementsMenu() {
    ctx.fillStyle = '#fff';
    ctx.font = '24px Creepster';
    ctx.fillText('ACHIEVEMENTS', WIDTH / 2 - 80, 220);

    let y = 260;
    Object.entries(ACHIEVEMENTS).forEach(([key, ach]) => {
        const earned = SaveData.achievements[key];
        ctx.fillStyle = earned ? '#44ff44' : '#666';
        ctx.font = '14px Share Tech Mono';
        ctx.fillText((earned ? '✓ ' : '○ ') + ach.name, 200, y);
        ctx.fillStyle = earned ? '#88aa88' : '#444';
        ctx.font = '12px Share Tech Mono';
        ctx.fillText(ach.desc, 200, y + 15);
        y += 40;
    });

    drawBackButton();
}

function drawSettingsMenu() {
    ctx.fillStyle = '#fff';
    ctx.font = '24px Creepster';
    ctx.fillText('SETTINGS', WIDTH / 2 - 50, 250);

    const settings = [
        { key: 'screenShake', name: 'Screen Shake' },
        { key: 'particles', name: 'Particles' },
        { key: 'showTutorial', name: 'Show Tutorial' }
    ];

    settings.forEach((s, i) => {
        const y = 300 + i * 45;
        const enabled = SaveData.settings[s.key];
        const hover = mouse.x > 400 && mouse.x < 500 && mouse.y > y - 15 && mouse.y < y + 15;

        ctx.fillStyle = '#aaa';
        ctx.font = '16px Share Tech Mono';
        ctx.fillText(s.name, 200, y);

        ctx.fillStyle = enabled ? '#44ff44' : '#ff4444';
        ctx.fillRect(400, y - 12, 80, 24);
        ctx.fillStyle = '#fff';
        ctx.fillText(enabled ? 'ON' : 'OFF', 425, y + 5);

        if (hover && mouse.down) {
            mouse.down = false;
            SaveData.settings[s.key] = !SaveData.settings[s.key];
            SaveData.save();
        }
    });

    // Reset button
    const resetHover = mouse.x > 300 && mouse.x < 500 && mouse.y > 460 && mouse.y < 490;
    ctx.fillStyle = resetHover ? '#ff4444' : '#441111';
    ctx.fillRect(300, 460, 200, 30);
    ctx.fillStyle = '#fff';
    ctx.fillText('RESET ALL PROGRESS', 310, 480);
    if (resetHover && mouse.down) {
        mouse.down = false;
        localStorage.removeItem('derelict_expanded');
        location.reload();
    }

    drawBackButton();
}

function drawTutorialMenu() {
    ctx.fillStyle = '#fff';
    ctx.font = '24px Creepster';
    ctx.fillText('HOW TO PLAY', WIDTH / 2 - 70, 200);

    const lines = [
        '[WASD] - Move your character',
        '[Mouse] - Aim your flashlight',
        '[Click] - Attack enemies in front of you',
        '[F] - Toggle flashlight on/off',
        '[ESC] - Pause game',
        '',
        'Find the EXIT to proceed to the next sector.',
        'Kill all enemies to unlock the exit.',
        'Manage your O2, health, and battery carefully!',
        'Collect items to survive longer.',
        'Reach Sector 8 and escape the ship!'
    ];

    ctx.fillStyle = '#aaa';
    ctx.font = '14px Share Tech Mono';
    lines.forEach((line, i) => {
        ctx.fillText(line, 200, 240 + i * 25);
    });

    drawBackButton();
}

function drawBackButton() {
    const hover = mouse.x > WIDTH / 2 - 50 && mouse.x < WIDTH / 2 + 50 && mouse.y > 530 && mouse.y < 560;
    ctx.fillStyle = hover ? '#444' : '#222';
    ctx.fillRect(WIDTH / 2 - 50, 530, 100, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Share Tech Mono';
    ctx.fillText('BACK', WIDTH / 2 - 20, 550);

    if (hover && mouse.down) {
        mouse.down = false;
        menuState = 'main';
    }
}

function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '36px Creepster';
    ctx.fillText('PAUSED', WIDTH / 2 - 60, HEIGHT / 2 - 30);
    ctx.font = '16px Share Tech Mono';
    ctx.fillText('Press ESC to resume', WIDTH / 2 - 80, HEIGHT / 2 + 10);
    ctx.fillText('Click to quit to menu', WIDTH / 2 - 90, HEIGHT / 2 + 40);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#ff3333';
    ctx.font = '48px Creepster';
    ctx.fillText('GAME OVER', WIDTH / 2 - 120, HEIGHT / 2 - 50);
    ctx.fillStyle = '#fff';
    ctx.font = '18px Share Tech Mono';
    ctx.fillText('Sector: ' + player.sector + ' | Kills: ' + player.kills + ' | Credits: $' + player.credits, WIDTH / 2 - 150, HEIGHT / 2);
    ctx.fillStyle = '#aaa';
    ctx.fillText('Click to return to menu', WIDTH / 2 - 90, HEIGHT / 2 + 50);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#44ff44';
    ctx.font = '48px Creepster';
    ctx.fillText('ESCAPED!', WIDTH / 2 - 100, HEIGHT / 2 - 50);
    ctx.fillStyle = '#fff';
    ctx.font = '18px Share Tech Mono';
    ctx.fillText('You survived the Derelict!', WIDTH / 2 - 100, HEIGHT / 2);
    ctx.fillText('Kills: ' + player.kills + ' | Time: ' + Math.floor(runTime / 60) + ':' + Math.floor(runTime % 60).toString().padStart(2, '0'), WIDTH / 2 - 100, HEIGHT / 2 + 30);
    ctx.fillText('Credits earned: $' + (player.credits + 500), WIDTH / 2 - 80, HEIGHT / 2 + 60);
    ctx.fillStyle = '#aaa';
    ctx.fillText('Click to return to menu', WIDTH / 2 - 90, HEIGHT / 2 + 100);
}

// ============= GAME LOOP =============
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

// Start game loop
requestAnimationFrame(gameLoop);
