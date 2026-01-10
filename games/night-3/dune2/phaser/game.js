// Dune 2 Clone - Phaser 3 Implementation
const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#000000',
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 32;
const MAP_HEIGHT = 32;
const VIEWPORT_WIDTH = 640;
const VIEWPORT_HEIGHT = 480;
const UI_WIDTH = 160;

// Colors
const COLORS = {
    SAND: 0xd4a574, ROCK: 0x8b7355, SPICE_LIGHT: 0xe8a040, SPICE_HEAVY: 0xd47020,
    MOUNTAIN: 0x4a4a4a, CONCRETE: 0xa0a0a0, ATREIDES: 0x2255aa, HARKONNEN: 0xaa2222,
    UI_BG: 0x2a1a0a, UI_BORDER: 0xd4a574
};

// Game state
const state = {
    camera: { x: 0, y: 0 },
    credits: 1500,
    power: { produced: 0, consumed: 0 },
    buildings: [],
    units: [],
    enemies: [],
    enemyBuildings: [],
    projectiles: [],
    selection: [],
    buildingMode: null,
    productionQueue: [],
    productionProgress: 0,
    spiceFields: [],
    tick: 0,
    gameState: 'playing'
};

// Building/Unit definitions
const BUILDINGS = {
    CONSTRUCTION_YARD: { cost: 0, hp: 1000, power: -60, width: 2, height: 2, prereq: null },
    WIND_TRAP: { cost: 300, hp: 400, power: 100, width: 2, height: 2, prereq: null },
    REFINERY: { cost: 400, hp: 600, power: -40, width: 3, height: 2, prereq: 'WIND_TRAP', spawnsHarvester: true },
    BARRACKS: { cost: 300, hp: 500, power: -20, width: 2, height: 2, prereq: 'REFINERY' },
    LIGHT_FACTORY: { cost: 400, hp: 600, power: -30, width: 2, height: 2, prereq: 'BARRACKS' },
    HEAVY_FACTORY: { cost: 600, hp: 800, power: -50, width: 3, height: 2, prereq: 'LIGHT_FACTORY' },
    GUN_TURRET: { cost: 125, hp: 300, power: -10, width: 1, height: 1, prereq: 'BARRACKS', isDefense: true, range: 5, damage: 15 }
};

const UNITS = {
    INFANTRY: { cost: 60, hp: 50, damage: 8, speed: 1.5, range: 2, buildTime: 60, builtAt: 'BARRACKS' },
    TROOPER: { cost: 100, hp: 80, damage: 20, speed: 1.2, range: 4, buildTime: 90, builtAt: 'BARRACKS' },
    TRIKE: { cost: 150, hp: 100, damage: 12, speed: 4.0, range: 3, buildTime: 75, builtAt: 'LIGHT_FACTORY' },
    TANK: { cost: 300, hp: 300, damage: 30, speed: 2.0, range: 4, buildTime: 150, builtAt: 'HEAVY_FACTORY' },
    HARVESTER: { cost: 300, hp: 250, damage: 0, speed: 1.5, range: 0, buildTime: 120, builtAt: 'HEAVY_FACTORY', capacity: 500 }
};

const TERRAIN = { SAND: 0, ROCK: 1, SPICE_LIGHT: 2, SPICE_HEAVY: 3, DUNES: 4, MOUNTAIN: 5, CONCRETE: 6 };

let map = [];
let scene;
let graphics;
let textObjects = {};

function preload() {}

function create() {
    scene = this;
    graphics = scene.add.graphics();

    generateMap();
    initGame();

    scene.input.on('pointerdown', handlePointerDown);
    scene.input.on('pointermove', handlePointerMove);
    scene.input.on('pointerup', handlePointerUp);
    scene.input.keyboard.on('keydown', handleKeyDown);

    window.gameState = state;
    Object.defineProperty(window, 'units', { get: () => state.units });
    Object.defineProperty(window, 'buildings', { get: () => state.buildings });
}

function generateMap() {
    map = [];
    state.spiceFields = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            let terrain = TERRAIN.SAND;

            if (x >= 2 && x <= 10 && y >= 22 && y <= 30) terrain = TERRAIN.ROCK;
            else if (x >= 22 && x <= 30 && y >= 2 && y <= 10) terrain = TERRAIN.ROCK;
            else if ((x === 15 && y >= 10 && y <= 22) || (y === 16 && x >= 8 && x <= 22)) {
                if (Math.random() < 0.7) terrain = TERRAIN.MOUNTAIN;
            }
            else if (x >= 12 && x <= 20 && y >= 12 && y <= 20) {
                terrain = Math.random() < 0.3 ? TERRAIN.SPICE_HEAVY :
                         Math.random() < 0.6 ? TERRAIN.SPICE_LIGHT : TERRAIN.SAND;
                if (terrain === TERRAIN.SPICE_LIGHT || terrain === TERRAIN.SPICE_HEAVY) {
                    state.spiceFields.push({ x, y, amount: terrain === TERRAIN.SPICE_HEAVY ? 150 : 80, type: terrain });
                }
            }
            else if (Math.random() < 0.1) terrain = TERRAIN.DUNES;

            map[y][x] = terrain;
        }
    }
}

function initGame() {
    state.buildings = [];
    state.units = [];
    state.enemies = [];
    state.enemyBuildings = [];
    state.credits = 1500;
    state.selection = [];
    state.gameState = 'playing';

    addBuilding('CONSTRUCTION_YARD', 4, 26, 'player');
    addUnit('HARVESTER', 7, 26, 'player');

    addBuilding('CONSTRUCTION_YARD', 24, 4, 'enemy');
    addBuilding('WIND_TRAP', 26, 4, 'enemy');
    addBuilding('REFINERY', 24, 6, 'enemy');

    addUnit('TANK', 26, 8, 'enemy');
    addUnit('TRIKE', 28, 8, 'enemy');
    addUnit('INFANTRY', 25, 9, 'enemy');

    state.camera.x = 4 * TILE_SIZE - VIEWPORT_WIDTH / 2 + 64;
    state.camera.y = 26 * TILE_SIZE - VIEWPORT_HEIGHT / 2 + 64;

    updatePower();
}

function addBuilding(type, x, y, owner) {
    const def = BUILDINGS[type];
    const building = {
        type, x, y, hp: def.hp, maxHp: def.hp, owner,
        width: def.width, height: def.height,
        rallyPoint: { x: x + def.width, y: y + def.height }
    };

    if (owner === 'player') state.buildings.push(building);
    else state.enemyBuildings.push(building);

    for (let dy = 0; dy < def.height; dy++) {
        for (let dx = 0; dx < def.width; dx++) {
            map[y + dy][x + dx] = TERRAIN.CONCRETE;
        }
    }

    if (def.spawnsHarvester && owner === 'player') {
        addUnit('HARVESTER', x + def.width, y + def.height - 1, owner);
    }

    updatePower();
    return building;
}

function addUnit(type, x, y, owner) {
    const def = UNITS[type];
    const unit = {
        type, x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2,
        tileX: x, tileY: y, hp: def.hp, maxHp: def.hp, owner,
        target: null, path: [], attackTarget: null, attackCooldown: 0, facing: 0,
        load: 0, state: 'idle'
    };

    if (owner === 'player') state.units.push(unit);
    else state.enemies.push(unit);

    return unit;
}

function updatePower() {
    let produced = 0, consumed = 0;
    for (const b of state.buildings) {
        const def = BUILDINGS[b.type];
        if (def.power > 0) produced += def.power * (b.hp / b.maxHp);
        else consumed += Math.abs(def.power);
    }
    state.power.produced = Math.floor(produced);
    state.power.consumed = consumed;
}

function findPath(startX, startY, endX, endY) {
    const start = { x: Math.floor(startX / TILE_SIZE), y: Math.floor(startY / TILE_SIZE) };
    const end = { x: Math.floor(endX / TILE_SIZE), y: Math.floor(endY / TILE_SIZE) };

    if (end.x < 0 || end.x >= MAP_WIDTH || end.y < 0 || end.y >= MAP_HEIGHT) return [];
    if (map[end.y][end.x] === TERRAIN.MOUNTAIN) return [];

    const openSet = [{ ...start, g: 0, f: 0, parent: null }];
    const closedSet = new Set();

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();

        if (current.x === end.x && current.y === end.y) {
            const path = [];
            let node = current;
            while (node) {
                path.unshift({ x: node.x * TILE_SIZE + TILE_SIZE / 2, y: node.y * TILE_SIZE + TILE_SIZE / 2 });
                node = node.parent;
            }
            return path;
        }

        closedSet.add(`${current.x},${current.y}`);

        const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]];
        for (const [dx, dy] of dirs) {
            const nx = current.x + dx;
            const ny = current.y + dy;

            if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
            if (closedSet.has(`${nx},${ny}`)) continue;
            if (map[ny][nx] === TERRAIN.MOUNTAIN) continue;

            const g = current.g + (dx && dy ? 1.4 : 1);
            const h = Math.abs(nx - end.x) + Math.abs(ny - end.y);
            const f = g + h;

            const existing = openSet.find(n => n.x === nx && n.y === ny);
            if (existing) {
                if (g < existing.g) { existing.g = g; existing.f = f; existing.parent = current; }
            } else {
                openSet.push({ x: nx, y: ny, g, f, parent: current });
            }
        }
    }
    return [];
}

function updateUnit(unit) {
    const def = UNITS[unit.type];

    if (unit.type === 'HARVESTER' && unit.owner === 'player') {
        updateHarvester(unit);
        return;
    }

    if (unit.path.length > 0) {
        const target = unit.path[0];
        const dx = target.x - unit.x;
        const dy = target.y - unit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 4) {
            unit.path.shift();
        } else {
            const speed = def.speed * TILE_SIZE / 30;
            unit.x += (dx / dist) * speed;
            unit.y += (dy / dist) * speed;
            unit.facing = Math.floor((Math.atan2(dy, dx) + Math.PI) / (Math.PI / 4)) % 8;
        }
    }

    if (unit.attackTarget && unit.attackTarget.hp > 0) {
        const targetX = unit.attackTarget.x || unit.attackTarget.x * TILE_SIZE;
        const targetY = unit.attackTarget.y || unit.attackTarget.y * TILE_SIZE;
        const dist = Math.sqrt((targetX - unit.x) ** 2 + (targetY - unit.y) ** 2);

        if (dist <= def.range * TILE_SIZE) {
            unit.attackCooldown--;
            if (unit.attackCooldown <= 0) {
                state.projectiles.push({
                    x: unit.x, y: unit.y, targetX, targetY,
                    damage: def.damage, target: unit.attackTarget, owner: unit.owner, progress: 0
                });
                unit.attackCooldown = 30;
            }
        }
    }

    unit.tileX = Math.floor(unit.x / TILE_SIZE);
    unit.tileY = Math.floor(unit.y / TILE_SIZE);
}

function updateHarvester(harvester) {
    const def = UNITS.HARVESTER;

    switch (harvester.state) {
        case 'idle':
            const spice = state.spiceFields.find(f => f.amount > 0);
            if (spice) {
                harvester.path = findPath(harvester.x, harvester.y, spice.x * TILE_SIZE, spice.y * TILE_SIZE);
                harvester.state = 'moving_to_spice';
                harvester.targetSpice = spice;
            }
            break;

        case 'moving_to_spice':
            if (harvester.path.length === 0) harvester.state = 'harvesting';
            else moveAlongPath(harvester, def.speed);
            break;

        case 'harvesting':
            const field = state.spiceFields.find(f => f.x === harvester.tileX && f.y === harvester.tileY);
            if (field && field.amount > 0 && harvester.load < def.capacity) {
                const harvestAmount = Math.min(10, field.amount, def.capacity - harvester.load);
                harvester.load += harvestAmount;
                field.amount -= harvestAmount;
                if (field.amount <= 0) {
                    map[field.y][field.x] = TERRAIN.SAND;
                    state.spiceFields = state.spiceFields.filter(f => f !== field);
                }
            } else if (harvester.load >= def.capacity * 0.8 || !field || field.amount <= 0) {
                const refinery = state.buildings.find(b => b.type === 'REFINERY');
                if (refinery) {
                    harvester.path = findPath(harvester.x, harvester.y, (refinery.x + 1) * TILE_SIZE, (refinery.y + refinery.height) * TILE_SIZE);
                    harvester.state = 'returning';
                }
            }
            break;

        case 'returning':
            if (harvester.path.length === 0) harvester.state = 'unloading';
            else moveAlongPath(harvester, def.speed);
            break;

        case 'unloading':
            if (harvester.load > 0) {
                const unloadAmount = Math.min(15, harvester.load);
                harvester.load -= unloadAmount;
                state.credits = Math.min(state.credits + unloadAmount, 32000);
            } else {
                harvester.state = 'idle';
            }
            break;
    }

    harvester.tileX = Math.floor(harvester.x / TILE_SIZE);
    harvester.tileY = Math.floor(harvester.y / TILE_SIZE);
}

function moveAlongPath(unit, speed) {
    if (unit.path.length === 0) return;
    const target = unit.path[0];
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 4) unit.path.shift();
    else {
        const moveSpeed = speed * TILE_SIZE / 30;
        unit.x += (dx / dist) * moveSpeed;
        unit.y += (dy / dist) * moveSpeed;
    }
}

function updateProjectiles() {
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];
        p.progress += 0.15;

        if (p.progress >= 1) {
            if (p.target && p.target.hp > 0) {
                p.target.hp -= p.damage;
                if (p.target.hp <= 0) {
                    state.units = state.units.filter(u => u !== p.target);
                    state.enemies = state.enemies.filter(u => u !== p.target);
                    state.buildings = state.buildings.filter(b => b !== p.target);
                    state.enemyBuildings = state.enemyBuildings.filter(b => b !== p.target);
                }
            }
            state.projectiles.splice(i, 1);
        }
    }
}

function updateEnemyAI() {
    if (state.tick % 60 !== 0) return;

    for (const enemy of state.enemies) {
        if (enemy.attackTarget && enemy.attackTarget.hp > 0) continue;

        let nearest = null, minDist = Infinity;

        for (const unit of state.units) {
            const dist = Math.sqrt((unit.x - enemy.x) ** 2 + (unit.y - enemy.y) ** 2);
            if (dist < minDist) { minDist = dist; nearest = unit; }
        }

        if (nearest && minDist < 15 * TILE_SIZE) {
            enemy.attackTarget = nearest;
            enemy.path = findPath(enemy.x, enemy.y, nearest.x, nearest.y);
        }
    }
}

function updateProduction() {
    if (state.productionQueue.length === 0) return;

    const item = state.productionQueue[0];
    const def = UNITS[item];
    if (!def) return;

    const powerRatio = state.power.consumed > 0 ? Math.min(1, state.power.produced / state.power.consumed) : 1;
    state.productionProgress += powerRatio;

    if (state.productionProgress >= def.buildTime) {
        const factory = state.buildings.find(b => b.type === def.builtAt);
        if (factory) addUnit(item, factory.rallyPoint.x, factory.rallyPoint.y, 'player');
        state.productionQueue.shift();
        state.productionProgress = 0;
    }
}

function checkGameEnd() {
    if (state.buildings.length === 0) state.gameState = 'defeat';
    else if (state.enemyBuildings.length === 0) state.gameState = 'victory';
}

function update() {
    if (state.gameState === 'playing') {
        state.tick++;

        for (const unit of state.units) updateUnit(unit);
        for (const enemy of state.enemies) updateUnit(enemy);

        updateEnemyAI();
        updateProjectiles();
        updateProduction();
        checkGameEnd();
    }

    draw();
}

function draw() {
    graphics.clear();

    // Draw map
    const startX = Math.floor(state.camera.x / TILE_SIZE);
    const startY = Math.floor(state.camera.y / TILE_SIZE);
    const endX = Math.min(MAP_WIDTH, startX + Math.ceil(VIEWPORT_WIDTH / TILE_SIZE) + 1);
    const endY = Math.min(MAP_HEIGHT, startY + Math.ceil(VIEWPORT_HEIGHT / TILE_SIZE) + 1);

    for (let y = Math.max(0, startY); y < endY; y++) {
        for (let x = Math.max(0, startX); x < endX; x++) {
            const terrain = map[y][x];
            let color;
            switch (terrain) {
                case TERRAIN.SAND: color = COLORS.SAND; break;
                case TERRAIN.ROCK: color = COLORS.ROCK; break;
                case TERRAIN.SPICE_LIGHT: color = COLORS.SPICE_LIGHT; break;
                case TERRAIN.SPICE_HEAVY: color = COLORS.SPICE_HEAVY; break;
                case TERRAIN.DUNES: color = 0xc4955a; break;
                case TERRAIN.MOUNTAIN: color = COLORS.MOUNTAIN; break;
                case TERRAIN.CONCRETE: color = COLORS.CONCRETE; break;
                default: color = COLORS.SAND;
            }

            const screenX = x * TILE_SIZE - state.camera.x;
            const screenY = y * TILE_SIZE - state.camera.y;

            graphics.fillStyle(color);
            graphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
    }

    // Draw buildings
    for (const building of [...state.buildings, ...state.enemyBuildings]) {
        const def = BUILDINGS[building.type];
        const screenX = building.x * TILE_SIZE - state.camera.x;
        const screenY = building.y * TILE_SIZE - state.camera.y;
        const width = def.width * TILE_SIZE;
        const height = def.height * TILE_SIZE;

        const color = building.owner === 'player' ? COLORS.ATREIDES : COLORS.HARKONNEN;
        graphics.fillStyle(color);
        graphics.fillRect(screenX + 2, screenY + 2, width - 4, height - 4);

        graphics.lineStyle(2, 0x000000);
        graphics.strokeRect(screenX + 2, screenY + 2, width - 4, height - 4);

        if (state.selection.includes(building)) {
            graphics.lineStyle(2, 0x00ff00);
            graphics.strokeRect(screenX - 2, screenY - 2, width + 4, height + 4);
        }
    }

    // Draw units
    for (const unit of [...state.units, ...state.enemies]) {
        const screenX = unit.x - state.camera.x;
        const screenY = unit.y - state.camera.y;
        const color = unit.owner === 'player' ? COLORS.ATREIDES : COLORS.HARKONNEN;
        const size = unit.type === 'INFANTRY' || unit.type === 'TROOPER' ? 8 : 14;

        graphics.fillStyle(color);
        if (unit.type === 'HARVESTER') {
            graphics.fillRect(screenX - 12, screenY - 8, 24, 16);
            graphics.fillStyle(COLORS.SPICE_LIGHT);
            const loadWidth = (unit.load / UNITS.HARVESTER.capacity) * 20;
            graphics.fillRect(screenX - 10, screenY - 4, loadWidth, 8);
        } else if (unit.type === 'TANK') {
            graphics.fillRect(screenX - size, screenY - size / 2, size * 2, size);
            graphics.fillCircle(screenX, screenY, size / 2);
        } else {
            graphics.fillCircle(screenX, screenY, size);
        }

        if (state.selection.includes(unit)) {
            graphics.lineStyle(1, 0x00ff00);
            graphics.strokeCircle(screenX, screenY, size + 4);
        }
    }

    // Draw projectiles
    for (const p of state.projectiles) {
        const x = p.x + (p.targetX - p.x) * p.progress - state.camera.x;
        const y = p.y + (p.targetY - p.y) * p.progress - state.camera.y;
        graphics.fillStyle(p.owner === 'player' ? 0xffff00 : 0xff4400);
        graphics.fillCircle(x, y, 3);
    }

    // Draw UI
    graphics.fillStyle(COLORS.UI_BG);
    graphics.fillRect(VIEWPORT_WIDTH, 0, UI_WIDTH, 600);

    // Yellow/black stripe
    for (let i = 0; i < 600; i += 16) {
        graphics.fillStyle(i % 32 === 0 ? 0xd4a000 : 0x222222);
        graphics.fillRect(VIEWPORT_WIDTH + 2, i, 8, 8);
    }

    // Minimap
    const minimapX = VIEWPORT_WIDTH + 20, minimapY = 110, scale = 3;
    graphics.fillStyle(0x000000);
    graphics.fillRect(minimapX, minimapY, MAP_WIDTH * scale, MAP_HEIGHT * scale);

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            let color = map[y][x] === TERRAIN.ROCK ? COLORS.ROCK :
                       (map[y][x] === TERRAIN.SPICE_LIGHT || map[y][x] === TERRAIN.SPICE_HEAVY) ? COLORS.SPICE_HEAVY :
                       map[y][x] === TERRAIN.MOUNTAIN ? COLORS.MOUNTAIN : 0xc4955a;
            graphics.fillStyle(color);
            graphics.fillRect(minimapX + x * scale, minimapY + y * scale, scale, scale);
        }
    }

    for (const b of state.buildings) {
        graphics.fillStyle(0x0000ff);
        graphics.fillRect(minimapX + b.x * scale, minimapY + b.y * scale, BUILDINGS[b.type].width * scale, BUILDINGS[b.type].height * scale);
    }
    for (const b of state.enemyBuildings) {
        graphics.fillStyle(0xff0000);
        graphics.fillRect(minimapX + b.x * scale, minimapY + b.y * scale, BUILDINGS[b.type].width * scale, BUILDINGS[b.type].height * scale);
    }

    // Text UI
    drawText('credits', 'CREDITS', VIEWPORT_WIDTH + 20, 25, '#ffffff', 'bold 14px monospace');
    drawText('creditsVal', `${state.credits}`, VIEWPORT_WIDTH + 20, 48, '#ffcc00', 'bold 18px monospace');
    drawText('power', 'POWER', VIEWPORT_WIDTH + 20, 75, '#ffffff', '12px monospace');
    const powerColor = state.power.produced >= state.power.consumed ? '#00ff00' : '#ff0000';
    drawText('powerVal', `${state.power.produced}/${state.power.consumed}`, VIEWPORT_WIDTH + 20, 92, powerColor, '12px monospace');

    // Build buttons info
    drawText('build', 'BUILD: 1-7', VIEWPORT_WIDTH + 20, 220, '#ffffff', '10px monospace');
    drawText('units', 'UNITS: Q,W,E,T', VIEWPORT_WIDTH + 20, 240, '#ffffff', '10px monospace');

    // Production progress
    if (state.productionQueue.length > 0) {
        const item = state.productionQueue[0];
        const def = UNITS[item];
        const pct = state.productionProgress / def.buildTime;
        graphics.fillStyle(0x333333);
        graphics.fillRect(VIEWPORT_WIDTH + 20, 500, 120, 16);
        graphics.fillStyle(0x00aa00);
        graphics.fillRect(VIEWPORT_WIDTH + 20, 500, 120 * pct, 16);
        drawText('prod', def.name || item, VIEWPORT_WIDTH + 25, 512, '#ffffff', '10px monospace');
    }

    // Game over
    if (state.gameState !== 'playing') {
        graphics.fillStyle(0x000000, 0.8);
        graphics.fillRect(0, 0, VIEWPORT_WIDTH, 600);
        drawText('gameOver', state.gameState === 'victory' ? 'VICTORY!' : 'DEFEAT',
                 VIEWPORT_WIDTH / 2 - 80, 280, state.gameState === 'victory' ? '#44ff44' : '#ff4444', 'bold 32px monospace');
        drawText('restart', 'Press R to restart', VIEWPORT_WIDTH / 2 - 90, 320, '#ffffff', '16px monospace');
    }
}

function drawText(key, text, x, y, color, font) {
    if (!textObjects[key]) {
        textObjects[key] = scene.add.text(x, y, text, { font, fill: color });
    } else {
        textObjects[key].setPosition(x, y);
        textObjects[key].setText(text);
        textObjects[key].setStyle({ font, fill: color });
    }
}

// Input handlers
let isDragging = false, dragStart = { x: 0, y: 0 };

function handlePointerDown(pointer) {
    if (pointer.x < VIEWPORT_WIDTH) {
        if (state.buildingMode) {
            const tileX = Math.floor((pointer.x + state.camera.x) / TILE_SIZE);
            const tileY = Math.floor((pointer.y + state.camera.y) / TILE_SIZE);
            if (canPlaceBuilding(state.buildingMode, tileX, tileY)) {
                state.credits -= BUILDINGS[state.buildingMode].cost;
                addBuilding(state.buildingMode, tileX, tileY, 'player');
                state.buildingMode = null;
            }
        } else {
            isDragging = true;
            dragStart = { x: pointer.x + state.camera.x, y: pointer.y + state.camera.y };
        }
    }
}

function handlePointerMove(pointer) {
    const edgeSize = 20;
    if (pointer.x < edgeSize) state.camera.x = Math.max(0, state.camera.x - 8);
    if (pointer.x > VIEWPORT_WIDTH - edgeSize) state.camera.x = Math.min(MAP_WIDTH * TILE_SIZE - VIEWPORT_WIDTH, state.camera.x + 8);
    if (pointer.y < edgeSize) state.camera.y = Math.max(0, state.camera.y - 8);
    if (pointer.y > 600 - edgeSize) state.camera.y = Math.min(MAP_HEIGHT * TILE_SIZE - 600, state.camera.y + 8);
}

function handlePointerUp(pointer) {
    if (isDragging) {
        isDragging = false;
        const worldX = pointer.x + state.camera.x;
        const worldY = pointer.y + state.camera.y;

        let selected = null;
        for (const unit of state.units) {
            if (Math.abs(unit.x - worldX) < 16 && Math.abs(unit.y - worldY) < 16) {
                selected = unit;
                break;
            }
        }

        if (!selected) {
            for (const building of state.buildings) {
                const def = BUILDINGS[building.type];
                if (worldX >= building.x * TILE_SIZE && worldX < (building.x + def.width) * TILE_SIZE &&
                    worldY >= building.y * TILE_SIZE && worldY < (building.y + def.height) * TILE_SIZE) {
                    selected = building;
                    break;
                }
            }
        }

        state.selection = selected ? [selected] : [];
    }
}

function canPlaceBuilding(type, x, y) {
    const def = BUILDINGS[type];
    for (let dy = 0; dy < def.height; dy++) {
        for (let dx = 0; dx < def.width; dx++) {
            const tx = x + dx, ty = y + dy;
            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return false;
            if (map[ty][tx] !== TERRAIN.ROCK && map[ty][tx] !== TERRAIN.CONCRETE) return false;
            for (const b of state.buildings) {
                if (tx >= b.x && tx < b.x + BUILDINGS[b.type].width &&
                    ty >= b.y && ty < b.y + BUILDINGS[b.type].height) return false;
            }
        }
    }
    if (state.credits < def.cost) return false;
    if (def.prereq && !state.buildings.some(b => b.type === def.prereq)) return false;
    return true;
}

function handleKeyDown(event) {
    const key = event.key.toLowerCase();

    if (state.gameState !== 'playing') {
        if (key === 'r') initGame();
        return;
    }

    const buildKeys = { '1': 'WIND_TRAP', '2': 'REFINERY', '3': 'BARRACKS', '4': 'LIGHT_FACTORY', '5': 'HEAVY_FACTORY', '6': 'GUN_TURRET' };
    if (buildKeys[key]) {
        const type = buildKeys[key];
        const def = BUILDINGS[type];
        if ((!def.prereq || state.buildings.some(b => b.type === def.prereq)) && state.credits >= def.cost) {
            state.buildingMode = type;
        }
    }

    const unitKeys = { 'q': 'INFANTRY', 'w': 'TROOPER', 'e': 'TRIKE', 't': 'TANK' };
    if (unitKeys[key]) {
        const type = unitKeys[key];
        const def = UNITS[type];
        if (state.buildings.some(b => b.type === def.builtAt) && state.credits >= def.cost) {
            state.credits -= def.cost;
            state.productionQueue.push(type);
        }
    }

    if (key === 'escape') state.buildingMode = null;
}
