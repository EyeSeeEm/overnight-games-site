// ============= DOME KEEPER CLONE =============
// Mining + Tower Defense Roguelike

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 800;
const HEIGHT = 600;

// ============= CONSTANTS =============
const TILE_SIZE = 16;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 35;
const DOME_Y = 80;
const SURFACE_Y = DOME_Y + 48;
const MINING_PHASE_DURATION = 75;

// ============= COLORS =============
const COLORS = {
    sky: '#1a1a2e',
    ground: '#2d1f14',
    dirtLight: '#8B7355',
    dirtMed: '#6B5344',
    dirtHard: '#4A3728',
    rock: '#5A5A5A',
    iron: '#B87333',
    water: '#4A90D9',
    cobalt: '#8B5CF6',
    dome: '#87CEEB',
    domeMetal: '#4A5568',
    laser: '#FF6B6B',
    laserGlow: '#FFE66D',
    enemy: '#E53E3E',
    keeper: '#48BB78',
    ui: '#1A202C',
    text: '#F7FAFC'
};

// ============= SAVE DATA =============
const SaveData = {
    highWave: 0,
    totalIron: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    achievements: {},

    save() {
        localStorage.setItem('dome_keeper_clone', JSON.stringify({
            highWave: this.highWave,
            totalIron: this.totalIron,
            gamesPlayed: this.gamesPlayed,
            gamesWon: this.gamesWon,
            achievements: this.achievements
        }));
    },

    load() {
        const data = localStorage.getItem('dome_keeper_clone');
        if (data) Object.assign(this, JSON.parse(data));
    }
};

// ============= ACHIEVEMENTS =============
const ACHIEVEMENTS = {
    first_wave: { name: 'First Defense', desc: 'Survive your first wave', icon: '🛡️' },
    miner: { name: 'Miner', desc: 'Mine 100 iron total', icon: '⛏️' },
    wave_10: { name: 'Veteran', desc: 'Reach wave 10', icon: '🎖️' },
    winner: { name: 'Victor', desc: 'Win the game', icon: '👑' },
    upgrades: { name: 'Engineer', desc: 'Buy 5 upgrades in one run', icon: '🔧' }
};

// ============= TILE TYPES =============
const TILES = {
    empty: { hp: 0, color: '#1a0a0a' },
    softDirt: { hp: 4, color: COLORS.dirtLight },
    medDirt: { hp: 8, color: COLORS.dirtMed },
    hardRock: { hp: 16, color: COLORS.dirtHard },
    veryHard: { hp: 32, color: COLORS.rock },
    iron: { hp: 12, color: COLORS.iron, resource: 'iron', yield: [1, 4] },
    water: { hp: 10, color: COLORS.water, resource: 'water', yield: [1, 3] },
    cobalt: { hp: 14, color: COLORS.cobalt, resource: 'cobalt', yield: [1, 3] },
    bedrock: { hp: 9999, color: '#111' },
    relic: { hp: 24, color: '#FFD700', isRelic: true }
};

// ============= ENEMY TYPES =============
const ENEMY_TYPES = {
    walker: { hp: 40, damage: 12, speed: 60, weight: 20, color: '#E53E3E', size: 12 },
    flyer: { hp: 20, damage: 15, speed: 100, weight: 25, color: '#FC8181', size: 10, flying: true },
    hornet: { hp: 100, damage: 45, speed: 50, weight: 80, color: '#C53030', size: 16 },
    tick: { hp: 5, damage: 15, speed: 80, weight: 30, color: '#FEB2B2', size: 6, suicide: true },
    diver: { hp: 30, damage: 100, speed: 300, weight: 70, color: '#9B2C2C', size: 14, diver: true },
    boss: { hp: 500, damage: 30, speed: 25, weight: 300, color: '#742A2A', size: 24, boss: true }
};

// ============= UPGRADES =============
const UPGRADES = {
    drillPower: { name: 'Drill Power', cost: [4, 8, 14, 22], values: [2, 7, 18, 46, 102] },
    moveSpeed: { name: 'Jetpack', cost: [4, 8, 12, 18], values: [56, 74, 94, 116, 140] },
    carryCapacity: { name: 'Cargo Suit', cost: [4, 8, 12, 20], values: [3, 7, 12, 17, 30] },
    laserDamage: { name: 'Laser Power', cost: [6, 12, 20, 32], values: [15, 30, 55, 110, 210] },
    laserSpeed: { name: 'Laser Speed', cost: [6, 10, 20], values: [0.02, 0.03, 0.045, 0.065] },
    domeHealth: { name: 'Dome Armor', cost: [5, 10, 16], values: [800, 1100, 1400, 1800] },
    shieldMax: { name: 'Shield', cost: [6, 12, 20], values: [40, 80, 140, 220] }
};

// ============= GAME STATE =============
let state = {
    screen: 'menu',
    phase: 'mining',
    phaseTimer: MINING_PHASE_DURATION,
    wave: 0,

    // Resources
    iron: 0,
    water: 0,
    cobalt: 0,

    // Dome
    domeHp: 800,
    domeMaxHp: 800,
    shieldHp: 40,
    shieldMaxHp: 40,

    // Laser
    laserAngle: -Math.PI / 2,
    laserTargetAngle: -Math.PI / 2,
    laserFiring: false,
    laserDamage: 15,
    laserSpeed: 0.02,

    // Keeper
    keeper: { x: WIDTH / 2, y: SURFACE_Y + 50, vx: 0, vy: 0, drilling: false, drillTarget: null },
    drillPower: 2,
    moveSpeed: 56,
    carryCapacity: 3,
    carrying: [],

    // Upgrades
    upgradeLevels: {},

    // Map
    tiles: [],
    relicFound: false,
    relicCollected: false,

    // Enemies
    enemies: [],

    // Stats
    tilesCleared: 0,
    upgradesBought: 0
};

// ============= INPUT =============
const keys = {};
let mouse = { x: 0, y: 0, down: false };

document.addEventListener('keydown', e => { keys[e.code] = true; });
document.addEventListener('keyup', e => { keys[e.code] = false; });
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', () => { mouse.down = true; });
canvas.addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('click', handleClick);

// ============= BUTTONS =============
let buttons = [];

function addButton(id, x, y, w, h, label, callback) {
    buttons.push({ id, x, y, w, h, label, callback });
}

function clearButtons() {
    buttons = [];
}

function handleClick() {
    for (const btn of buttons) {
        if (mouse.x >= btn.x && mouse.x <= btn.x + btn.w &&
            mouse.y >= btn.y && mouse.y <= btn.y + btn.h) {
            btn.callback();
            return;
        }
    }
}

function isButtonHovered(btn) {
    return mouse.x >= btn.x && mouse.x <= btn.x + btn.w &&
           mouse.y >= btn.y && mouse.y <= btn.y + btn.h;
}

// ============= MAP GENERATION =============
function generateMap() {
    state.tiles = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
        state.tiles[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            state.tiles[y][x] = generateTile(x, y);
        }
    }

    // Place resource clusters
    placeResourceClusters('iron', 0.12, 5);
    placeResourceClusters('water', 0.06, 8);
    placeResourceClusters('cobalt', 0.04, 15);

    // Place relic at bottom
    const relicX = Math.floor(MAP_WIDTH / 2) + Math.floor(Math.random() * 10) - 5;
    const relicY = MAP_HEIGHT - 3;
    state.tiles[relicY][relicX] = { ...TILES.relic, hp: TILES.relic.hp };

    // Clear starting area below dome
    const startX = Math.floor(MAP_WIDTH / 2);
    for (let dy = 0; dy < 3; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (state.tiles[dy] && state.tiles[dy][startX + dx]) {
                state.tiles[dy][startX + dx] = { ...TILES.empty, hp: 0 };
            }
        }
    }
}

function generateTile(x, y) {
    // Bedrock boundaries
    if (x === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
        return { ...TILES.bedrock, hp: TILES.bedrock.hp };
    }

    const depthPercent = y / MAP_HEIGHT;
    const roll = Math.random();

    if (depthPercent > 0.8 && roll < 0.3) return { ...TILES.veryHard, hp: TILES.veryHard.hp };
    if (depthPercent > 0.6 && roll < 0.4) return { ...TILES.hardRock, hp: TILES.hardRock.hp };
    if (depthPercent > 0.3 && roll < 0.5) return { ...TILES.medDirt, hp: TILES.medDirt.hp };
    return { ...TILES.softDirt, hp: TILES.softDirt.hp };
}

function placeResourceClusters(type, density, minDepth) {
    const clusterCount = Math.floor(MAP_WIDTH * MAP_HEIGHT * density / 20);

    for (let i = 0; i < clusterCount; i++) {
        const cx = 2 + Math.floor(Math.random() * (MAP_WIDTH - 4));
        const cy = minDepth + Math.floor(Math.random() * (MAP_HEIGHT - minDepth - 2));
        const size = 2 + Math.floor(Math.random() * 4);

        growCluster(cx, cy, type, size);
    }
}

function growCluster(cx, cy, type, size) {
    const queue = [{ x: cx, y: cy }];
    let placed = 0;

    while (queue.length > 0 && placed < size) {
        const pos = queue.shift();
        const { x, y } = pos;

        if (x < 1 || x >= MAP_WIDTH - 1 || y < 0 || y >= MAP_HEIGHT - 1) continue;
        if (!state.tiles[y] || !state.tiles[y][x]) continue;

        const tile = state.tiles[y][x];
        if (tile.resource || tile === TILES.bedrock || tile === TILES.relic) continue;

        state.tiles[y][x] = { ...TILES[type], hp: TILES[type].hp };
        placed++;

        if (Math.random() < 0.6) queue.push({ x: x + 1, y });
        if (Math.random() < 0.6) queue.push({ x: x - 1, y });
        if (Math.random() < 0.6) queue.push({ x, y: y + 1 });
        if (Math.random() < 0.6) queue.push({ x, y: y - 1 });
    }
}

// ============= GAME LOGIC =============
function startGame() {
    SaveData.gamesPlayed++;
    SaveData.save();

    state = {
        screen: 'game',
        phase: 'mining',
        phaseTimer: MINING_PHASE_DURATION,
        wave: 0,
        iron: 0,
        water: 0,
        cobalt: 0,
        domeHp: 800,
        domeMaxHp: 800,
        shieldHp: 40,
        shieldMaxHp: 40,
        laserAngle: -Math.PI / 2,
        laserTargetAngle: -Math.PI / 2,
        laserFiring: false,
        laserDamage: 15,
        laserSpeed: 0.02,
        keeper: { x: WIDTH / 2, y: SURFACE_Y + 50, vx: 0, vy: 0, drilling: false, drillTarget: null },
        drillPower: 2,
        moveSpeed: 56,
        carryCapacity: 3,
        carrying: [],
        upgradeLevels: {},
        tiles: [],
        relicFound: false,
        relicCollected: false,
        enemies: [],
        tilesCleared: 0,
        upgradesBought: 0
    };

    generateMap();
}

function updateGame(dt) {
    if (state.phase === 'mining') {
        updateMiningPhase(dt);
        state.phaseTimer -= dt;

        if (state.phaseTimer <= 0) {
            startDefensePhase();
        }
    } else {
        updateDefensePhase(dt);
    }

    // Check win condition
    if (state.relicCollected && state.enemies.length === 0 && state.phase === 'defense') {
        SaveData.gamesWon++;
        SaveData.achievements.winner = true;
        SaveData.save();
        state.screen = 'victory';
    }

    // Check lose condition
    if (state.domeHp <= 0) {
        state.screen = 'gameover';
    }
}

function updateMiningPhase(dt) {
    const k = state.keeper;

    // Input
    let dx = 0, dy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    // Calculate speed based on carrying
    const speedPenalty = state.carrying.length * 5.7;
    const currentSpeed = Math.max(20, state.moveSpeed - speedPenalty);

    k.vx = dx * currentSpeed;
    k.vy = dy * currentSpeed;

    // Apply movement
    k.x += k.vx * dt;
    k.y += k.vy * dt;

    // Bounds
    const mapLeft = (WIDTH - MAP_WIDTH * TILE_SIZE) / 2;
    const mapRight = mapLeft + MAP_WIDTH * TILE_SIZE;
    const mapTop = SURFACE_Y;
    const mapBottom = mapTop + MAP_HEIGHT * TILE_SIZE;

    k.x = Math.max(mapLeft + 8, Math.min(mapRight - 8, k.x));
    k.y = Math.max(DOME_Y, Math.min(mapBottom - 8, k.y));

    // Drilling
    if (k.y > SURFACE_Y) {
        const tileX = Math.floor((k.x - mapLeft) / TILE_SIZE);
        const tileY = Math.floor((k.y - SURFACE_Y) / TILE_SIZE);

        // Find adjacent tile in movement direction
        let targetX = tileX, targetY = tileY;
        if (dx > 0) targetX = tileX + 1;
        if (dx < 0) targetX = tileX - 1;
        if (dy > 0) targetY = tileY + 1;
        if (dy < 0) targetY = tileY - 1;

        if (targetY >= 0 && targetY < MAP_HEIGHT && targetX >= 0 && targetX < MAP_WIDTH) {
            const tile = state.tiles[targetY][targetX];

            if (tile && tile.hp > 0 && (dx !== 0 || dy !== 0)) {
                tile.hp -= state.drillPower * dt * 3;

                if (tile.hp <= 0) {
                    if (tile.resource) {
                        const yield_ = tile.yield[0] + Math.floor(Math.random() * (tile.yield[1] - tile.yield[0] + 1));
                        for (let i = 0; i < yield_ && state.carrying.length < state.carryCapacity; i++) {
                            state.carrying.push(tile.resource);
                        }
                    }
                    if (tile.isRelic) {
                        state.relicFound = true;
                        state.carrying.push('relic');
                    }
                    state.tiles[targetY][targetX] = { ...TILES.empty, hp: 0 };
                    state.tilesCleared++;
                }
            }
        }
    }

    // Deposit resources at dome
    if (k.y <= DOME_Y + 30 && state.carrying.length > 0) {
        for (const res of state.carrying) {
            if (res === 'iron') { state.iron++; SaveData.totalIron++; }
            else if (res === 'water') state.water++;
            else if (res === 'cobalt') state.cobalt++;
            else if (res === 'relic') state.relicCollected = true;
        }
        state.carrying = [];
        SaveData.save();

        checkAchievement('miner', SaveData.totalIron >= 100);
    }

    // Drop resources with Q
    if (keys['KeyQ'] && state.carrying.length > 0) {
        state.carrying.pop();
    }
}

function startDefensePhase() {
    state.phase = 'defense';
    state.wave++;
    SaveData.highWave = Math.max(SaveData.highWave, state.wave);
    SaveData.save();

    checkAchievement('first_wave', true);
    checkAchievement('wave_10', state.wave >= 10);

    spawnWave();
}

function spawnWave() {
    let waveWeight = 10 + state.wave * 15 + state.iron * 0.6 + state.water * 1.2 + state.cobalt * 2.2;

    if (state.relicCollected) {
        waveWeight *= 4.5; // Final wave
    }

    const enemyPool = [
        { type: 'walker', minWave: 1 },
        { type: 'flyer', minWave: 2 },
        { type: 'tick', minWave: 3 },
        { type: 'hornet', minWave: 5 },
        { type: 'diver', minWave: 7 },
        { type: 'boss', minWave: 10 }
    ];

    while (waveWeight > 0) {
        const valid = enemyPool.filter(e =>
            ENEMY_TYPES[e.type].weight <= waveWeight && e.minWave <= state.wave
        );
        if (valid.length === 0) break;

        const selected = valid[Math.floor(Math.random() * valid.length)];
        const type = ENEMY_TYPES[selected.type];

        // Spawn from sides
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = side < 0 ? -20 : WIDTH + 20;
        const y = type.flying ? DOME_Y - 20 + Math.random() * 40 : SURFACE_Y - 10;

        state.enemies.push({
            type: selected.type,
            x,
            y,
            hp: type.hp,
            maxHp: type.hp,
            damage: type.damage,
            speed: type.speed,
            color: type.color,
            size: type.size,
            flying: type.flying || false,
            suicide: type.suicide || false,
            diver: type.diver || false,
            boss: type.boss || false,
            attackTimer: 0,
            diveCooldown: 0
        });

        waveWeight -= type.weight;
    }
}

function updateDefensePhase(dt) {
    // Update laser angle toward mouse
    const domeX = WIDTH / 2;
    const domeY = DOME_Y + 24;

    state.laserTargetAngle = Math.atan2(mouse.y - domeY, mouse.x - domeX);

    // Clamp to upper hemisphere
    if (state.laserTargetAngle > 0) {
        state.laserTargetAngle = state.laserTargetAngle < Math.PI / 2 ? 0 : Math.PI;
    }

    // Rotate toward target
    const angleDiff = state.laserTargetAngle - state.laserAngle;
    const rotateSpeed = state.laserFiring ? state.laserSpeed * 0.6 : state.laserSpeed;
    state.laserAngle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), rotateSpeed);

    state.laserFiring = mouse.down;

    // Update enemies
    for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];
        const targetX = domeX;
        const targetY = enemy.flying ? domeY : SURFACE_Y - enemy.size / 2;

        const dx = targetX - enemy.x;
        const dy = targetY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > enemy.size) {
            enemy.x += (dx / dist) * enemy.speed * dt;
            enemy.y += (dy / dist) * enemy.speed * dt;
        } else {
            // Attack dome
            enemy.attackTimer += dt;
            if (enemy.attackTimer >= 1.3) {
                enemy.attackTimer = 0;

                let damage = enemy.damage;
                if (enemy.suicide) {
                    damage = enemy.damage;
                    enemy.hp = 0;
                }

                // Shield absorbs damage first
                if (state.shieldHp > 0) {
                    const absorbed = Math.min(damage, state.shieldHp);
                    state.shieldHp -= absorbed;
                    damage -= absorbed;
                }
                state.domeHp -= damage;
            }
        }

        // Laser damage
        if (state.laserFiring) {
            const laserEndX = domeX + Math.cos(state.laserAngle) * 1000;
            const laserEndY = domeY + Math.sin(state.laserAngle) * 1000;

            if (lineCircleIntersect(domeX, domeY, laserEndX, laserEndY, enemy.x, enemy.y, enemy.size)) {
                enemy.hp -= state.laserDamage * dt;
            }
        }

        // Remove dead enemies
        if (enemy.hp <= 0) {
            state.enemies.splice(i, 1);
        }
    }

    // Wave complete
    if (state.enemies.length === 0) {
        state.phase = 'mining';
        state.phaseTimer = MINING_PHASE_DURATION;
        state.shieldHp = state.shieldMaxHp; // Recharge shield
    }
}

function lineCircleIntersect(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const fx = x1 - cx;
    const fy = y1 - cy;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return false;

    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

function buyUpgrade(upgradeId) {
    const upgrade = UPGRADES[upgradeId];
    const level = state.upgradeLevels[upgradeId] || 0;

    if (level >= upgrade.cost.length) return false;

    const cost = upgrade.cost[level];
    if (state.iron < cost) return false;

    state.iron -= cost;
    state.upgradeLevels[upgradeId] = level + 1;
    state.upgradesBought++;

    // Apply upgrade
    const newValue = upgrade.values[level + 1];
    switch (upgradeId) {
        case 'drillPower': state.drillPower = newValue; break;
        case 'moveSpeed': state.moveSpeed = newValue; break;
        case 'carryCapacity': state.carryCapacity = newValue; break;
        case 'laserDamage': state.laserDamage = newValue; break;
        case 'laserSpeed': state.laserSpeed = newValue; break;
        case 'domeHealth':
            state.domeMaxHp = newValue;
            state.domeHp = Math.min(state.domeHp + 300, state.domeMaxHp);
            break;
        case 'shieldMax':
            state.shieldMaxHp = newValue;
            state.shieldHp = state.shieldMaxHp;
            break;
    }

    checkAchievement('upgrades', state.upgradesBought >= 5);
    return true;
}

function repairDome() {
    if (state.cobalt < 1 || state.domeHp >= state.domeMaxHp) return false;

    state.cobalt--;
    state.domeHp = Math.min(state.domeMaxHp, state.domeHp + 80 + state.domeMaxHp * 0.15);
    return true;
}

function checkAchievement(id, condition) {
    if (condition && !SaveData.achievements[id]) {
        SaveData.achievements[id] = true;
        SaveData.save();
    }
}

// ============= DRAWING =============
function draw() {
    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    switch (state.screen) {
        case 'menu': drawMenu(); break;
        case 'game': drawGame(); break;
        case 'upgrades': drawUpgradeScreen(); break;
        case 'gameover': drawGameOver(); break;
        case 'victory': drawVictory(); break;
    }
}

function drawMenu() {
    clearButtons();

    // Title
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 36px Share Tech Mono';
    ctx.textAlign = 'center';
    ctx.fillText('DOME KEEPER', WIDTH / 2, 120);

    ctx.font = '18px Share Tech Mono';
    ctx.fillStyle = '#48BB78';
    ctx.fillText('Mining + Tower Defense', WIDTH / 2, 155);

    // Stats
    ctx.fillStyle = '#888';
    ctx.font = '14px Share Tech Mono';
    ctx.fillText(`High Wave: ${SaveData.highWave} | Games Won: ${SaveData.gamesWon}`, WIDTH / 2, 200);

    // Buttons
    addButton('start', WIDTH / 2 - 100, 260, 200, 50, 'START GAME', startGame);
    addButton('achievements', WIDTH / 2 - 100, 330, 200, 45, 'ACHIEVEMENTS', () => { state.screen = 'achievementsMenu'; });

    for (const btn of buttons) {
        const hovered = isButtonHovered(btn);
        ctx.fillStyle = hovered ? '#48BB78' : '#2D3748';
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        ctx.strokeStyle = '#48BB78';
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

        ctx.fillStyle = hovered ? '#1A202C' : COLORS.text;
        ctx.font = '16px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
    }

    // Instructions
    ctx.fillStyle = '#666';
    ctx.font = '12px Share Tech Mono';
    ctx.fillText('WASD to move | Mine resources underground', WIDTH / 2, 450);
    ctx.fillText('Mouse to aim laser | Click to fire during defense', WIDTH / 2, 470);
    ctx.fillText('E for upgrades | Q to drop resources', WIDTH / 2, 490);
}

function drawGame() {
    clearButtons();

    // Draw underground
    const mapLeft = (WIDTH - MAP_WIDTH * TILE_SIZE) / 2;

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = state.tiles[y][x];
            if (tile && tile.hp > 0) {
                ctx.fillStyle = tile.color;
                ctx.fillRect(mapLeft + x * TILE_SIZE, SURFACE_Y + y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

                // Damage indicator
                if (tile.hp < TILES[tile.resource || 'softDirt']?.hp * 0.5) {
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fillRect(mapLeft + x * TILE_SIZE, SURFACE_Y + y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            } else if (tile) {
                ctx.fillStyle = TILES.empty.color;
                ctx.fillRect(mapLeft + x * TILE_SIZE, SURFACE_Y + y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Ground surface
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, SURFACE_Y - 10, WIDTH, 15);

    // Draw dome
    const domeX = WIDTH / 2;
    const domeY = DOME_Y + 24;

    // Dome body
    ctx.beginPath();
    ctx.arc(domeX, domeY + 10, 40, Math.PI, 0);
    ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
    ctx.fill();
    ctx.strokeStyle = COLORS.domeMetal;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Dome base
    ctx.fillStyle = COLORS.domeMetal;
    ctx.fillRect(domeX - 45, domeY + 10, 90, 15);

    // Laser cannon
    ctx.save();
    ctx.translate(domeX, domeY);
    ctx.rotate(state.laserAngle);

    ctx.fillStyle = COLORS.domeMetal;
    ctx.fillRect(0, -4, 30, 8);

    // Laser beam
    if (state.laserFiring && state.phase === 'defense') {
        ctx.fillStyle = COLORS.laserGlow;
        ctx.fillRect(30, -3, 400, 6);
        ctx.fillStyle = COLORS.laser;
        ctx.fillRect(30, -2, 400, 4);
    }

    ctx.restore();

    // Draw enemies
    for (const enemy of state.enemies) {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        if (enemy.hp < enemy.maxHp) {
            const barWidth = enemy.size * 2;
            ctx.fillStyle = '#333';
            ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size - 8, barWidth, 4);
            ctx.fillStyle = '#E53E3E';
            ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size - 8, barWidth * (enemy.hp / enemy.maxHp), 4);
        }
    }

    // Draw keeper (only in mining phase or underground)
    if (state.keeper.y > DOME_Y) {
        const k = state.keeper;
        ctx.fillStyle = COLORS.keeper;
        ctx.beginPath();
        ctx.arc(k.x, k.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Jetpack flame
        if (k.vy < 0) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(k.x - 5, k.y + 10);
            ctx.lineTo(k.x, k.y + 20);
            ctx.lineTo(k.x + 5, k.y + 10);
            ctx.fill();
        }

        // Cargo indicator
        if (state.carrying.length > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '10px Share Tech Mono';
            ctx.textAlign = 'center';
            ctx.fillText(`${state.carrying.length}/${state.carryCapacity}`, k.x, k.y - 15);
        }
    }

    // UI
    drawUI();
}

function drawUI() {
    // Top bar
    ctx.fillStyle = 'rgba(26, 32, 44, 0.9)';
    ctx.fillRect(0, 0, WIDTH, 40);

    ctx.fillStyle = COLORS.text;
    ctx.font = '14px Share Tech Mono';
    ctx.textAlign = 'left';

    // Phase indicator
    if (state.phase === 'mining') {
        ctx.fillStyle = '#48BB78';
        ctx.fillText(`MINING - ${Math.ceil(state.phaseTimer)}s`, 15, 26);
    } else {
        ctx.fillStyle = '#E53E3E';
        ctx.fillText(`DEFENSE - Wave ${state.wave}`, 15, 26);
    }

    // Resources
    ctx.fillStyle = COLORS.iron;
    ctx.fillText(`Iron: ${state.iron}`, 200, 26);
    ctx.fillStyle = COLORS.water;
    ctx.fillText(`Water: ${state.water}`, 300, 26);
    ctx.fillStyle = COLORS.cobalt;
    ctx.fillText(`Cobalt: ${state.cobalt}`, 400, 26);

    // Dome health
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'right';
    ctx.fillText(`Dome: ${Math.ceil(state.domeHp)}/${state.domeMaxHp}`, WIDTH - 15, 26);

    // Health bar
    const hpBarWidth = 150;
    ctx.fillStyle = '#333';
    ctx.fillRect(WIDTH - 170 - hpBarWidth, 12, hpBarWidth, 16);
    ctx.fillStyle = state.domeHp / state.domeMaxHp > 0.3 ? '#48BB78' : '#E53E3E';
    ctx.fillRect(WIDTH - 170 - hpBarWidth, 12, hpBarWidth * (state.domeHp / state.domeMaxHp), 16);

    // Shield
    if (state.shieldHp > 0) {
        ctx.fillStyle = '#4A90D9';
        ctx.fillRect(WIDTH - 170 - hpBarWidth, 10, hpBarWidth * (state.shieldHp / state.shieldMaxHp), 4);
    }

    // Relic indicator
    if (state.relicCollected) {
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('RELIC COLLECTED!', WIDTH / 2, 26);
    }

    // Bottom bar - upgrade button
    if (state.phase === 'mining' && state.keeper.y <= DOME_Y + 30) {
        addButton('upgrades', WIDTH / 2 - 60, HEIGHT - 45, 120, 35, 'UPGRADES [E]', () => {
            state.screen = 'upgrades';
        });

        for (const btn of buttons) {
            const hovered = isButtonHovered(btn);
            ctx.fillStyle = hovered ? '#48BB78' : '#2D3748';
            ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
            ctx.strokeStyle = '#48BB78';
            ctx.lineWidth = 1;
            ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
            ctx.fillStyle = COLORS.text;
            ctx.font = '12px Share Tech Mono';
            ctx.textAlign = 'center';
            ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 4);
        }
    }
}

function drawUpgradeScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 24px Share Tech Mono';
    ctx.textAlign = 'center';
    ctx.fillText('UPGRADES', WIDTH / 2, 50);

    ctx.font = '14px Share Tech Mono';
    ctx.fillStyle = COLORS.iron;
    ctx.fillText(`Iron: ${state.iron}`, WIDTH / 2, 80);
    ctx.fillStyle = COLORS.cobalt;
    ctx.fillText(`Cobalt: ${state.cobalt} (for repairs)`, WIDTH / 2, 100);

    clearButtons();

    let y = 140;
    const categories = [
        ['drillPower', 'moveSpeed', 'carryCapacity'],
        ['laserDamage', 'laserSpeed'],
        ['domeHealth', 'shieldMax']
    ];

    const categoryNames = ['KEEPER', 'LASER', 'DOME'];

    categories.forEach((cat, catIndex) => {
        ctx.fillStyle = '#666';
        ctx.font = '12px Share Tech Mono';
        ctx.textAlign = 'left';
        ctx.fillText(categoryNames[catIndex], 80, y);
        y += 5;

        cat.forEach(upgradeId => {
            const upgrade = UPGRADES[upgradeId];
            const level = state.upgradeLevels[upgradeId] || 0;
            const maxed = level >= upgrade.cost.length;
            const cost = maxed ? 0 : upgrade.cost[level];
            const canBuy = !maxed && state.iron >= cost;

            ctx.fillStyle = COLORS.text;
            ctx.font = '14px Share Tech Mono';
            ctx.textAlign = 'left';
            ctx.fillText(upgrade.name, 100, y + 20);

            ctx.fillStyle = '#888';
            ctx.font = '12px Share Tech Mono';
            ctx.fillText(`Level ${level}/${upgrade.cost.length}`, 250, y + 20);
            ctx.fillText(`Value: ${upgrade.values[level]}`, 350, y + 20);

            if (!maxed) {
                const btnColor = canBuy ? '#48BB78' : '#4A5568';
                addButton(`buy_${upgradeId}`, 500, y + 5, 100, 25, `${cost} Iron`, () => {
                    buyUpgrade(upgradeId);
                });

                ctx.fillStyle = isButtonHovered(buttons[buttons.length - 1]) && canBuy ? '#68D391' : btnColor;
                ctx.fillRect(500, y + 5, 100, 25);
                ctx.fillStyle = COLORS.text;
                ctx.font = '12px Share Tech Mono';
                ctx.textAlign = 'center';
                ctx.fillText(`${cost} Iron`, 550, y + 22);
            } else {
                ctx.fillStyle = '#48BB78';
                ctx.font = '12px Share Tech Mono';
                ctx.textAlign = 'center';
                ctx.fillText('MAXED', 550, y + 22);
            }

            y += 35;
        });

        y += 15;
    });

    // Repair button
    if (state.domeHp < state.domeMaxHp && state.cobalt > 0) {
        addButton('repair', WIDTH / 2 - 75, y + 10, 150, 30, 'REPAIR (1 Cobalt)', repairDome);

        ctx.fillStyle = isButtonHovered(buttons[buttons.length - 1]) ? '#8B5CF6' : '#6B46C1';
        ctx.fillRect(WIDTH / 2 - 75, y + 10, 150, 30);
        ctx.fillStyle = COLORS.text;
        ctx.font = '12px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.fillText('REPAIR (1 Cobalt)', WIDTH / 2, y + 30);
    }

    // Close button
    addButton('close', WIDTH / 2 - 50, HEIGHT - 60, 100, 35, 'CLOSE [E]', () => {
        state.screen = 'game';
    });

    ctx.fillStyle = isButtonHovered(buttons[buttons.length - 1]) ? '#E53E3E' : '#C53030';
    ctx.fillRect(WIDTH / 2 - 50, HEIGHT - 60, 100, 35);
    ctx.fillStyle = COLORS.text;
    ctx.font = '14px Share Tech Mono';
    ctx.textAlign = 'center';
    ctx.fillText('CLOSE [E]', WIDTH / 2, HEIGHT - 38);
}

function drawGameOver() {
    clearButtons();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#E53E3E';
    ctx.font = 'bold 36px Share Tech Mono';
    ctx.textAlign = 'center';
    ctx.fillText('DOME DESTROYED', WIDTH / 2, 150);

    ctx.fillStyle = COLORS.text;
    ctx.font = '18px Share Tech Mono';
    ctx.fillText(`Reached Wave: ${state.wave}`, WIDTH / 2, 220);
    ctx.fillText(`Tiles Cleared: ${state.tilesCleared}`, WIDTH / 2, 250);
    ctx.fillText(`Upgrades Bought: ${state.upgradesBought}`, WIDTH / 2, 280);

    addButton('retry', WIDTH / 2 - 80, 350, 160, 45, 'TRY AGAIN', startGame);
    addButton('menu', WIDTH / 2 - 80, 410, 160, 45, 'MAIN MENU', () => { state.screen = 'menu'; });

    for (const btn of buttons) {
        const hovered = isButtonHovered(btn);
        ctx.fillStyle = hovered ? '#48BB78' : '#2D3748';
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        ctx.strokeStyle = '#48BB78';
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        ctx.fillStyle = COLORS.text;
        ctx.font = '14px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
    }
}

function drawVictory() {
    clearButtons();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 42px Share Tech Mono';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', WIDTH / 2, 120);

    ctx.fillStyle = '#48BB78';
    ctx.font = '20px Share Tech Mono';
    ctx.fillText('Relic Retrieved!', WIDTH / 2, 170);

    ctx.fillStyle = COLORS.text;
    ctx.font = '16px Share Tech Mono';
    ctx.fillText(`Final Wave: ${state.wave}`, WIDTH / 2, 230);
    ctx.fillText(`Dome Health: ${Math.ceil(state.domeHp)}/${state.domeMaxHp}`, WIDTH / 2, 260);
    ctx.fillText(`Total Iron Mined: ${SaveData.totalIron}`, WIDTH / 2, 290);

    addButton('retry', WIDTH / 2 - 80, 350, 160, 45, 'PLAY AGAIN', startGame);
    addButton('menu', WIDTH / 2 - 80, 410, 160, 45, 'MAIN MENU', () => { state.screen = 'menu'; });

    for (const btn of buttons) {
        const hovered = isButtonHovered(btn);
        ctx.fillStyle = hovered ? '#FFD700' : '#2D3748';
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        ctx.fillStyle = hovered ? '#1A202C' : COLORS.text;
        ctx.font = '14px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
    }
}

// ============= GAME LOOP =============
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    // Handle E key for upgrades
    if (keys['KeyE'] && state.screen === 'game' && state.phase === 'mining' && state.keeper.y <= DOME_Y + 30) {
        state.screen = 'upgrades';
        keys['KeyE'] = false;
    } else if (keys['KeyE'] && state.screen === 'upgrades') {
        state.screen = 'game';
        keys['KeyE'] = false;
    }

    if (state.screen === 'game') {
        updateGame(dt);
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// ============= EXPOSE FOR TESTING =============
window.getGameState = () => ({
    screen: state.screen,
    phase: state.phase,
    wave: state.wave,
    domeHp: state.domeHp,
    iron: state.iron
});

// ============= START =============
SaveData.load();
requestAnimationFrame(gameLoop);
