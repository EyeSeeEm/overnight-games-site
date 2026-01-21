// Dome Defender - A Dome Keeper Clone
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 16;
const MAP_WIDTH = 80;
const MAP_HEIGHT = 100;
const CAMERA_WIDTH = 50;
const CAMERA_HEIGHT = 37;

// Game state
const GameState = {
    MENU: 'menu',
    MINING: 'mining',
    WAVE_WARNING: 'wave_warning',
    DEFENSE: 'defense',
    UPGRADE: 'upgrade',
    PAUSED: 'paused',
    VICTORY: 'victory',
    GAME_OVER: 'game_over'
};

let state = GameState.MENU;
let lastTime = 0;
let deltaTime = 0;

// Camera
const camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0
};

// Resources
const resources = {
    iron: 0,
    water: 0
};

// Map tiles
const TileType = {
    AIR: 0,
    DIRT: 1,
    SOFT_STONE: 2,
    HARD_STONE: 3,
    DENSE_ROCK: 4,
    CRYSTAL_ROCK: 5,
    OBSIDIAN: 6,
    IRON_ORE: 7,
    WATER_ORE: 8,
    SURFACE: 9,
    DOME_ZONE: 10
};

const tileData = {
    [TileType.AIR]: { hp: 0, color: '#1a1a2a' },
    [TileType.DIRT]: { hp: 4, color: '#5c4033' },
    [TileType.SOFT_STONE]: { hp: 8, color: '#6b5344' },
    [TileType.HARD_STONE]: { hp: 16, color: '#5a5a6a' },
    [TileType.DENSE_ROCK]: { hp: 24, color: '#4a4a5a' },
    [TileType.CRYSTAL_ROCK]: { hp: 32, color: '#3a5a7a' },
    [TileType.OBSIDIAN]: { hp: 48, color: '#2a2a4a' },
    [TileType.IRON_ORE]: { hp: 12, color: '#8b6914' },
    [TileType.WATER_ORE]: { hp: 10, color: '#1e90ff' },
    [TileType.SURFACE]: { hp: 0, color: '#2a2a3a' },
    [TileType.DOME_ZONE]: { hp: 0, color: '#1a1a2a' }
};

// Map data
let map = [];
let mapHp = [];

// Player
const player = {
    x: MAP_WIDTH * TILE_SIZE / 2,
    y: 5 * TILE_SIZE,
    width: 20,
    height: 24,
    speed: 80,
    vx: 0,
    vy: 0,
    carrying: [],
    maxCarry: 3,
    drillPower: 2,
    drillSpeed: 1,
    drilling: false,
    drillDir: null,
    drillProgress: 0,
    atDome: false
};

// Dome
const dome = {
    x: MAP_WIDTH * TILE_SIZE / 2,
    y: 3 * TILE_SIZE,
    width: 64,
    height: 48,
    hp: 800,
    maxHp: 800,
    laserAngle: -Math.PI / 2,
    laserDamage: 15,
    laserSpeed: 0.03,
    firing: false
};

// Enemies
let enemies = [];
const EnemyType = {
    WALKER: { hp: 40, damage: 12, speed: 45, color: '#aa4444', width: 20, height: 20, ground: true },
    FLYER: { hp: 20, damage: 15, speed: 60, color: '#44aa44', width: 16, height: 16, ground: false },
    HORNET: { hp: 100, damage: 45, speed: 32, color: '#aaaa44', width: 24, height: 24, ground: true },
    TICK: { hp: 5, damage: 15, speed: 70, color: '#aa44aa', width: 10, height: 10, ground: true },
    DIVER: { hp: 30, damage: 100, speed: 200, color: '#44aaaa', width: 18, height: 18, ground: false, dive: true }
};

// Wave system
let currentWave = 0;
const MAX_WAVES = 10;
let waveTimer = 0;
let miningTime = 75;
let warningTime = 0;
const WARNING_DURATION = 10;

const waveConfig = [
    { weight: 40, enemies: ['WALKER'], time: 75 },
    { weight: 60, enemies: ['WALKER', 'FLYER'], time: 75 },
    { weight: 90, enemies: ['WALKER', 'FLYER', 'TICK'], time: 70 },
    { weight: 130, enemies: ['WALKER', 'FLYER', 'TICK'], time: 70 },
    { weight: 180, enemies: ['WALKER', 'FLYER', 'TICK', 'HORNET'], time: 65 },
    { weight: 240, enemies: ['WALKER', 'FLYER', 'TICK', 'HORNET'], time: 65 },
    { weight: 310, enemies: ['WALKER', 'FLYER', 'TICK', 'HORNET', 'DIVER'], time: 60 },
    { weight: 390, enemies: ['WALKER', 'FLYER', 'TICK', 'HORNET', 'DIVER'], time: 60 },
    { weight: 480, enemies: ['WALKER', 'FLYER', 'TICK', 'HORNET', 'DIVER'], time: 55 },
    { weight: 580, enemies: ['WALKER', 'FLYER', 'TICK', 'HORNET', 'DIVER'], time: 55 }
];

// Upgrades
const upgrades = {
    drillSpeed: { level: 0, maxLevel: 3, costs: [5, 15, 30], effect: 0.25 },
    carryCapacity: { level: 0, maxLevel: 3, costs: [10, 20, 35], effect: 2 },
    laserDamage: { level: 0, maxLevel: 3, costs: [{ iron: 10, water: 5 }, { iron: 20, water: 10 }, { iron: 35, water: 15 }] },
    domeHp: { level: 0, maxLevel: 2, costs: [15, 30] }
};

let upgradeMenuTab = 0;

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false };

// Initialize
function init() {
    generateMap();
    setupInput();
    resetGame();
}

function resetGame() {
    player.x = dome.x;
    player.y = 5 * TILE_SIZE;
    player.carrying = [];
    player.drillPower = 2;
    player.drillSpeed = 1;
    player.maxCarry = 3;

    dome.hp = 800;
    dome.maxHp = 800;
    dome.laserDamage = 15;

    resources.iron = 0;
    resources.water = 0;

    currentWave = 0;
    enemies = [];

    Object.keys(upgrades).forEach(key => {
        upgrades[key].level = 0;
    });

    generateMap();
    state = GameState.MINING;
    waveTimer = waveConfig[0].time;
    miningTime = waveConfig[0].time;
}

function generateMap() {
    map = [];
    mapHp = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        mapHp[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            let tile = TileType.AIR;

            // Surface area
            if (y < 5) {
                tile = TileType.SURFACE;
            }
            // Dome zone
            else if (y < 8 && x > MAP_WIDTH/2 - 5 && x < MAP_WIDTH/2 + 5) {
                tile = TileType.DOME_ZONE;
            }
            // Underground
            else if (y >= 5) {
                // Depth-based rock type
                if (y < 25) {
                    tile = Math.random() < 0.7 ? TileType.DIRT : TileType.SOFT_STONE;
                } else if (y < 50) {
                    tile = Math.random() < 0.5 ? TileType.SOFT_STONE : TileType.HARD_STONE;
                } else if (y < 75) {
                    tile = Math.random() < 0.4 ? TileType.HARD_STONE : TileType.DENSE_ROCK;
                } else {
                    tile = Math.random() < 0.5 ? TileType.CRYSTAL_ROCK : TileType.OBSIDIAN;
                }

                // Resource generation
                const rand = Math.random();
                if (y > 10 && rand < 0.08) {
                    tile = TileType.IRON_ORE;
                } else if (y > 30 && rand < 0.04) {
                    tile = TileType.WATER_ORE;
                }
            }

            map[y][x] = tile;
            mapHp[y][x] = tileData[tile].hp;
        }
    }

    // Create starting shaft
    const centerX = Math.floor(MAP_WIDTH / 2);
    for (let y = 5; y < 12; y++) {
        for (let x = centerX - 1; x <= centerX + 1; x++) {
            map[y][x] = TileType.AIR;
            mapHp[y][x] = 0;
        }
    }
}

function setupInput() {
    window.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = true;
        if (e.key === 'Escape') {
            if (state === GameState.UPGRADE) {
                state = GameState.MINING;
            } else if (state === GameState.MINING || state === GameState.DEFENSE) {
                state = state === GameState.PAUSED ? GameState.MINING : GameState.PAUSED;
            }
        }
        if (e.key.toLowerCase() === 'e' && state === GameState.MINING && player.atDome) {
            state = GameState.UPGRADE;
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

    canvas.addEventListener('mousedown', e => {
        mouse.down = true;
        if (state === GameState.MENU) {
            resetGame();
        } else if (state === GameState.VICTORY || state === GameState.GAME_OVER) {
            state = GameState.MENU;
        }
    });

    canvas.addEventListener('mouseup', () => {
        mouse.down = false;
    });
}

function update(dt) {
    if (state === GameState.MENU || state === GameState.PAUSED ||
        state === GameState.VICTORY || state === GameState.GAME_OVER) {
        return;
    }

    if (state === GameState.UPGRADE) {
        updateUpgradeMenu();
        return;
    }

    updatePlayer(dt);
    updateCamera(dt);

    if (state === GameState.MINING) {
        waveTimer -= dt;
        if (waveTimer <= WARNING_DURATION && waveTimer > 0) {
            state = GameState.WAVE_WARNING;
            warningTime = waveTimer;
        } else if (waveTimer <= 0) {
            startWave();
        }
    }

    if (state === GameState.WAVE_WARNING) {
        warningTime -= dt;
        if (warningTime <= 0) {
            startWave();
        }
    }

    if (state === GameState.DEFENSE) {
        updateDome(dt);
        updateEnemies(dt);

        if (enemies.length === 0) {
            endWave();
        }

        if (dome.hp <= 0) {
            state = GameState.GAME_OVER;
        }
    }
}

function updatePlayer(dt) {
    // Movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy = -1;
    if (keys['s'] || keys['arrowdown']) dy = 1;
    if (keys['a'] || keys['arrowleft']) dx = -1;
    if (keys['d'] || keys['arrowright']) dx = 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Speed penalty for carrying resources
    const speedPenalty = player.carrying.length * 5;
    const currentSpeed = Math.max(30, player.speed - speedPenalty);

    const newX = player.x + dx * currentSpeed * dt;
    const newY = player.y + dy * currentSpeed * dt;

    // Collision with tiles
    if (!collidesWithTile(newX, player.y, player.width, player.height)) {
        player.x = newX;
    }
    if (!collidesWithTile(player.x, newY, player.width, player.height)) {
        player.y = newY;
    }

    // Bounds
    player.x = Math.max(TILE_SIZE, Math.min((MAP_WIDTH - 1) * TILE_SIZE - player.width, player.x));
    player.y = Math.max(0, Math.min((MAP_HEIGHT - 1) * TILE_SIZE - player.height, player.y));

    // Check if at dome
    const domeX = dome.x - dome.width / 2;
    const domeY = dome.y - dome.height / 2;
    player.atDome = player.x > domeX - 30 && player.x < domeX + dome.width + 30 &&
                    player.y < domeY + dome.height + 30;

    // Deposit resources at dome
    if (player.atDome && player.carrying.length > 0) {
        player.carrying.forEach(res => {
            resources[res]++;
        });
        player.carrying = [];
    }

    // Drilling
    if (keys[' '] || keys['space']) {
        tryDrill(dx, dy);
    } else {
        player.drilling = false;
        player.drillProgress = 0;
    }

    // Drop resources
    if (keys['q']) {
        if (player.carrying.length > 0) {
            player.carrying.pop();
        }
    }
}

function tryDrill(dx, dy) {
    // Determine drill direction
    let drillX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
    let drillY = Math.floor((player.y + player.height / 2) / TILE_SIZE);

    if (Math.abs(dx) > Math.abs(dy)) {
        drillX += dx > 0 ? 1 : -1;
    } else if (dy !== 0) {
        drillY += dy > 0 ? 1 : -1;
    } else {
        // Default: drill down
        drillY += 1;
    }

    // Bounds check
    if (drillX < 0 || drillX >= MAP_WIDTH || drillY < 0 || drillY >= MAP_HEIGHT) {
        return;
    }

    const tile = map[drillY][drillX];
    if (tile === TileType.AIR || tile === TileType.SURFACE || tile === TileType.DOME_ZONE) {
        return;
    }

    player.drilling = true;
    player.drillDir = { x: drillX, y: drillY };

    // Apply drill damage
    const drillDamage = player.drillPower * player.drillSpeed * deltaTime;
    mapHp[drillY][drillX] -= drillDamage;

    if (mapHp[drillY][drillX] <= 0) {
        // Tile destroyed
        const wasOre = map[drillY][drillX];
        map[drillY][drillX] = TileType.AIR;

        // Drop resource
        if (wasOre === TileType.IRON_ORE && player.carrying.length < player.maxCarry) {
            const amount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < amount && player.carrying.length < player.maxCarry; i++) {
                player.carrying.push('iron');
            }
        } else if (wasOre === TileType.WATER_ORE && player.carrying.length < player.maxCarry) {
            const amount = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < amount && player.carrying.length < player.maxCarry; i++) {
                player.carrying.push('water');
            }
        }

        player.drilling = false;
    }
}

function collidesWithTile(x, y, w, h) {
    const left = Math.floor(x / TILE_SIZE);
    const right = Math.floor((x + w) / TILE_SIZE);
    const top = Math.floor(y / TILE_SIZE);
    const bottom = Math.floor((y + h) / TILE_SIZE);

    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
                const tile = map[ty][tx];
                if (tile !== TileType.AIR && tile !== TileType.SURFACE && tile !== TileType.DOME_ZONE) {
                    return true;
                }
            }
        }
    }
    return false;
}

function updateCamera(dt) {
    camera.targetX = player.x - canvas.width / 2;
    camera.targetY = player.y - canvas.height / 2;

    // Smooth camera follow
    camera.x += (camera.targetX - camera.x) * 5 * dt;
    camera.y += (camera.targetY - camera.y) * 5 * dt;

    // Clamp camera
    camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - canvas.width, camera.x));
    camera.y = Math.max(-100, Math.min(MAP_HEIGHT * TILE_SIZE - canvas.height, camera.y));
}

function updateDome(dt) {
    // Aim laser with mouse
    const screenDomeX = dome.x - camera.x;
    const screenDomeY = dome.y - camera.y;
    const targetAngle = Math.atan2(mouse.y - screenDomeY, mouse.x - screenDomeX);

    // Smooth rotation
    let angleDiff = targetAngle - dome.laserAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    dome.laserAngle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), dome.laserSpeed * 60 * dt);

    // Fire laser
    dome.firing = mouse.down;

    if (dome.firing) {
        // Check for enemy hits
        const laserEndX = dome.x + Math.cos(dome.laserAngle) * 400;
        const laserEndY = dome.y + Math.sin(dome.laserAngle) * 400;

        enemies.forEach(enemy => {
            if (lineIntersectsRect(dome.x, dome.y, laserEndX, laserEndY,
                enemy.x - enemy.width/2, enemy.y - enemy.height/2, enemy.width, enemy.height)) {
                enemy.hp -= dome.laserDamage * dt;
            }
        });
    }
}

function lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
    // Simple check: is the line near the rectangle center?
    const cx = rx + rw / 2;
    const cy = ry + rh / 2;

    // Distance from point to line
    const A = y2 - y1;
    const B = x1 - x2;
    const C = x2 * y1 - x1 * y2;
    const dist = Math.abs(A * cx + B * cy + C) / Math.sqrt(A * A + B * B);

    return dist < (rw + rh) / 2;
}

function updateEnemies(dt) {
    enemies = enemies.filter(enemy => enemy.hp > 0);

    enemies.forEach(enemy => {
        // Move toward dome
        const dx = dome.x - enemy.x;
        const dy = dome.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 30) {
            enemy.x += (dx / dist) * enemy.speed * dt;
            enemy.y += (dy / dist) * enemy.speed * dt;

            // Ground enemies stay above surface
            if (enemy.ground && enemy.y > 2 * TILE_SIZE) {
                enemy.y = 2 * TILE_SIZE;
            }
        } else {
            // Attack dome
            dome.hp -= enemy.damage * dt;
        }

        // Diver behavior
        if (enemy.dive && dist < 200 && !enemy.diving) {
            enemy.diving = true;
            enemy.speed *= 3;
        }
    });
}

function startWave() {
    state = GameState.DEFENSE;
    currentWave++;

    const config = waveConfig[Math.min(currentWave - 1, waveConfig.length - 1)];
    let weightRemaining = config.weight;

    // Spawn enemies
    while (weightRemaining > 0) {
        const typeKey = config.enemies[Math.floor(Math.random() * config.enemies.length)];
        const type = EnemyType[typeKey];

        // Check if we can afford this enemy
        const weight = type.hp;
        if (weight > weightRemaining && weightRemaining < 20) break;

        const side = Math.random() < 0.5 ? -1 : 1;
        const enemy = {
            x: dome.x + side * (400 + Math.random() * 100),
            y: type.ground ? 2 * TILE_SIZE : -50 - Math.random() * 50,
            width: type.width,
            height: type.height,
            hp: type.hp,
            maxHp: type.hp,
            damage: type.damage,
            speed: type.speed,
            color: type.color,
            ground: type.ground,
            dive: type.dive || false,
            diving: false
        };

        enemies.push(enemy);
        weightRemaining -= weight;
    }
}

function endWave() {
    if (currentWave >= MAX_WAVES) {
        state = GameState.VICTORY;
        return;
    }

    state = GameState.MINING;
    const config = waveConfig[Math.min(currentWave, waveConfig.length - 1)];
    miningTime = config.time;
    waveTimer = miningTime;
}

function updateUpgradeMenu() {
    // Tab navigation
    if (keys['1']) upgradeMenuTab = 0;
    if (keys['2']) upgradeMenuTab = 1;
    if (keys['3']) upgradeMenuTab = 2;
}

function purchaseUpgrade(type) {
    const upgrade = upgrades[type];
    if (upgrade.level >= upgrade.maxLevel) return false;

    const cost = upgrade.costs[upgrade.level];

    // Check cost
    if (typeof cost === 'object') {
        if (resources.iron < cost.iron || resources.water < cost.water) return false;
        resources.iron -= cost.iron;
        resources.water -= cost.water;
    } else {
        if (resources.iron < cost) return false;
        resources.iron -= cost;
    }

    // Apply upgrade
    upgrade.level++;

    switch (type) {
        case 'drillSpeed':
            player.drillSpeed = 1 + upgrade.level * upgrade.effect;
            break;
        case 'carryCapacity':
            player.maxCarry = 3 + upgrade.level * upgrade.effect;
            break;
        case 'laserDamage':
            dome.laserDamage = 15 * (1 + upgrade.level * 0.5);
            break;
        case 'domeHp':
            dome.maxHp = 800 + upgrade.level * 300;
            dome.hp = dome.maxHp;
            break;
    }

    return true;
}

function render() {
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state === GameState.MENU) {
        renderMenu();
        return;
    }

    if (state === GameState.UPGRADE) {
        renderUpgradeMenu();
        return;
    }

    // Render map
    renderMap();

    // Render dome
    renderDome();

    // Render player
    renderPlayer();

    // Render enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(
            enemy.x - enemy.width/2 - camera.x,
            enemy.y - enemy.height/2 - camera.y,
            enemy.width,
            enemy.height
        );

        // Health bar
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.x - 15 - camera.x, enemy.y - enemy.height/2 - 8 - camera.y, 30, 4);
        ctx.fillStyle = '#f44';
        ctx.fillRect(enemy.x - 15 - camera.x, enemy.y - enemy.height/2 - 8 - camera.y, 30 * hpPercent, 4);
    });

    // Render laser
    if (dome.firing && state === GameState.DEFENSE) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0';
        ctx.beginPath();
        ctx.moveTo(dome.x - camera.x, dome.y - camera.y);
        ctx.lineTo(
            dome.x + Math.cos(dome.laserAngle) * 400 - camera.x,
            dome.y + Math.sin(dome.laserAngle) * 400 - camera.y
        );
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // HUD
    renderHUD();

    // Wave warning
    if (state === GameState.WAVE_WARNING) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('WAVE INCOMING!', canvas.width/2, canvas.height/2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText(`${Math.ceil(warningTime)} seconds`, canvas.width/2, canvas.height/2);
        ctx.textAlign = 'left';
    }

    // Victory / Game Over
    if (state === GameState.VICTORY) {
        ctx.fillStyle = 'rgba(0, 100, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', canvas.width/2, canvas.height/2 - 30);
        ctx.font = '24px Arial';
        ctx.fillText('You survived all 10 waves!', canvas.width/2, canvas.height/2 + 20);
        ctx.fillText('Click to return to menu', canvas.width/2, canvas.height/2 + 60);
        ctx.textAlign = 'left';
    }

    if (state === GameState.GAME_OVER) {
        ctx.fillStyle = 'rgba(100, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DOME DESTROYED', canvas.width/2, canvas.height/2 - 30);
        ctx.font = '24px Arial';
        ctx.fillText(`Survived ${currentWave - 1} waves`, canvas.width/2, canvas.height/2 + 20);
        ctx.fillText('Click to return to menu', canvas.width/2, canvas.height/2 + 60);
        ctx.textAlign = 'left';
    }
}

function renderMenu() {
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#4af';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DOME DEFENDER', canvas.width/2, 150);

    // Dome icon
    ctx.fillStyle = '#4af';
    ctx.beginPath();
    ctx.arc(canvas.width/2, 280, 60, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(canvas.width/2 - 60, 280, 120, 30);

    // Instructions
    ctx.fillStyle = '#aaa';
    ctx.font = '20px Arial';
    ctx.fillText('WASD - Move', canvas.width/2, 380);
    ctx.fillText('SPACE - Drill in movement direction', canvas.width/2, 410);
    ctx.fillText('E - Upgrades (at dome)', canvas.width/2, 440);
    ctx.fillText('MOUSE - Aim & Fire laser (during waves)', canvas.width/2, 470);

    ctx.fillStyle = '#4f4';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Click to Start', canvas.width/2, 540);

    ctx.textAlign = 'left';
}

function renderMap() {
    const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const endX = Math.min(MAP_WIDTH, Math.ceil((camera.x + canvas.width) / TILE_SIZE) + 1);
    const endY = Math.min(MAP_HEIGHT, Math.ceil((camera.y + canvas.height) / TILE_SIZE) + 1);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = map[y][x];
            if (tile === TileType.AIR) continue;

            const screenX = x * TILE_SIZE - camera.x;
            const screenY = y * TILE_SIZE - camera.y;

            ctx.fillStyle = tileData[tile].color;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Ore sparkle
            if (tile === TileType.IRON_ORE || tile === TileType.WATER_ORE) {
                ctx.fillStyle = tile === TileType.IRON_ORE ? '#ffd700' : '#87ceeb';
                const sparkleX = screenX + 4 + Math.sin(Date.now() / 200 + x) * 3;
                const sparkleY = screenY + 4 + Math.cos(Date.now() / 200 + y) * 3;
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Tile damage visualization
            if (mapHp[y][x] < tileData[tile].hp && mapHp[y][x] > 0) {
                const damagePercent = 1 - mapHp[y][x] / tileData[tile].hp;
                ctx.fillStyle = `rgba(0, 0, 0, ${damagePercent * 0.5})`;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                // Cracks
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.beginPath();
                if (damagePercent > 0.3) {
                    ctx.moveTo(screenX + 4, screenY + 4);
                    ctx.lineTo(screenX + 10, screenY + 8);
                }
                if (damagePercent > 0.6) {
                    ctx.moveTo(screenX + 12, screenY + 3);
                    ctx.lineTo(screenX + 8, screenY + 12);
                }
                ctx.stroke();
            }
        }
    }
}

function renderDome() {
    const screenX = dome.x - camera.x;
    const screenY = dome.y - camera.y;

    // Dome base
    ctx.fillStyle = '#445';
    ctx.fillRect(screenX - 40, screenY + 10, 80, 20);

    // Dome glass
    ctx.fillStyle = 'rgba(100, 180, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(screenX, screenY, 35, Math.PI, 0);
    ctx.fill();

    ctx.strokeStyle = '#4af';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 35, Math.PI, 0);
    ctx.stroke();

    // Laser turret
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.arc(screenX, screenY - 10, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#888';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - 10);
    ctx.lineTo(
        screenX + Math.cos(dome.laserAngle) * 20,
        screenY - 10 + Math.sin(dome.laserAngle) * 20
    );
    ctx.stroke();

    // Dome HP bar
    const hpPercent = dome.hp / dome.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(screenX - 35, screenY + 35, 70, 8);
    ctx.fillStyle = hpPercent > 0.5 ? '#4f4' : hpPercent > 0.25 ? '#ff4' : '#f44';
    ctx.fillRect(screenX - 35, screenY + 35, 70 * hpPercent, 8);
}

function renderPlayer() {
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;

    // Body
    ctx.fillStyle = '#4af';
    ctx.fillRect(screenX, screenY, player.width, player.height);

    // Helmet
    ctx.fillStyle = '#6cf';
    ctx.fillRect(screenX + 4, screenY + 2, 12, 10);

    // Visor
    ctx.fillStyle = '#2a2';
    ctx.fillRect(screenX + 6, screenY + 4, 8, 5);

    // Jetpack
    ctx.fillStyle = '#666';
    ctx.fillRect(screenX - 3, screenY + 8, 4, 12);
    ctx.fillRect(screenX + player.width - 1, screenY + 8, 4, 12);

    // Drill
    if (player.drilling) {
        ctx.fillStyle = '#888';
        const drillX = screenX + player.width / 2;
        const drillY = screenY + player.height;
        ctx.beginPath();
        ctx.moveTo(drillX - 4, drillY);
        ctx.lineTo(drillX + 4, drillY);
        ctx.lineTo(drillX, drillY + 8 + Math.sin(Date.now() / 50) * 2);
        ctx.fill();
    }

    // Carrying indicator
    if (player.carrying.length > 0) {
        ctx.fillStyle = '#333';
        ctx.fillRect(screenX - 2, screenY - 12, player.width + 4, 10);

        player.carrying.forEach((res, i) => {
            ctx.fillStyle = res === 'iron' ? '#ffd700' : '#4af';
            ctx.fillRect(screenX + i * 7, screenY - 10, 5, 6);
        });
    }
}

function renderHUD() {
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, 40);

    // Wave info
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Wave: ${currentWave}/${MAX_WAVES}`, 10, 26);

    // Timer
    if (state === GameState.MINING || state === GameState.WAVE_WARNING) {
        ctx.fillStyle = waveTimer <= WARNING_DURATION ? '#f44' : '#fff';
        ctx.fillText(`Next Wave: ${Math.ceil(waveTimer)}s`, 130, 26);
    } else if (state === GameState.DEFENSE) {
        ctx.fillStyle = '#f44';
        ctx.fillText(`Enemies: ${enemies.length}`, 130, 26);
    }

    // Resources
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Iron: ${resources.iron}`, 320, 26);
    ctx.fillStyle = '#4af';
    ctx.fillText(`Water: ${resources.water}`, 420, 26);

    // Carry status
    ctx.fillStyle = '#aaa';
    ctx.fillText(`Carrying: ${player.carrying.length}/${player.maxCarry}`, 530, 26);

    // Dome HP
    ctx.fillStyle = '#4f4';
    ctx.fillText(`Dome: ${Math.ceil(dome.hp)}/${dome.maxHp}`, 680, 26);

    // Upgrade prompt
    if (player.atDome && state === GameState.MINING) {
        ctx.fillStyle = '#4f4';
        ctx.font = '14px Arial';
        ctx.fillText('Press E for upgrades', canvas.width/2 - 60, 60);
    }
}

function renderUpgradeMenu() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#4af';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DOME UPGRADES', canvas.width/2, 50);

    // Tabs
    const tabs = ['DRILL', 'DEFENSE', 'DOME'];
    tabs.forEach((tab, i) => {
        ctx.fillStyle = upgradeMenuTab === i ? '#4af' : '#666';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`[${i + 1}] ${tab}`, 200 + i * 200, 100);
    });

    // Content
    ctx.textAlign = 'left';
    ctx.font = '16px Arial';
    let y = 150;

    const upgradeList = [
        ['drillSpeed', 'carryCapacity'],
        ['laserDamage'],
        ['domeHp']
    ][upgradeMenuTab];

    upgradeList.forEach((key, i) => {
        const up = upgrades[key];
        const cost = up.costs[up.level];
        const canAfford = typeof cost === 'object'
            ? resources.iron >= cost.iron && resources.water >= cost.water
            : resources.iron >= cost;
        const maxed = up.level >= up.maxLevel;

        ctx.fillStyle = maxed ? '#666' : canAfford ? '#4f4' : '#f44';

        const names = {
            drillSpeed: 'Drill Speed',
            carryCapacity: 'Carry Capacity',
            laserDamage: 'Laser Damage',
            domeHp: 'Dome Health'
        };

        ctx.fillText(`${names[key]} Lv.${up.level}/${up.maxLevel}`, 200, y);

        if (!maxed) {
            const costText = typeof cost === 'object'
                ? `Cost: ${cost.iron} Iron, ${cost.water} Water`
                : `Cost: ${cost} Iron`;
            ctx.fillText(costText, 200, y + 25);

            // Buy button
            ctx.fillStyle = canAfford ? '#4f4' : '#666';
            ctx.fillRect(500, y - 15, 100, 40);
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.fillText(canAfford ? 'BUY' : 'LOCKED', 550, y + 10);
            ctx.textAlign = 'left';

            // Check for click
            if (mouse.down && canAfford &&
                mouse.x > 500 && mouse.x < 600 &&
                mouse.y > y - 15 && mouse.y < y + 25) {
                purchaseUpgrade(key);
                mouse.down = false;
            }
        } else {
            ctx.fillText('MAXED', 200, y + 25);
        }

        y += 80;
    });

    // Resources
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Iron: ${resources.iron}`, 200, 500);
    ctx.fillStyle = '#4af';
    ctx.fillText(`Water: ${resources.water}`, 350, 500);

    // Close hint
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'center';
    ctx.fillText('Press ESC to close', canvas.width/2, 550);
    ctx.textAlign = 'left';
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
