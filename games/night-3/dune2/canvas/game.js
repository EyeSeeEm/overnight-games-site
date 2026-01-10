// Dune 2 Clone - Canvas 2D Implementation
// Real-Time Strategy game inspired by Dune II: The Building of a Dynasty

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 32;
const MAP_HEIGHT = 32;
const VIEWPORT_WIDTH = 640;
const VIEWPORT_HEIGHT = 480;
const UI_WIDTH = 160;
const TICK_RATE = 30;

// Colors - Authentic Dune 2 palette
const COLORS = {
    SAND: '#d4a574',
    SAND_DARK: '#c4955a',
    ROCK: '#8b7355',
    ROCK_DARK: '#6b5a45',
    SPICE_LIGHT: '#e8a040',
    SPICE_HEAVY: '#d47020',
    MOUNTAIN: '#4a4a4a',
    CONCRETE: '#a0a0a0',
    BUILDING: '#8b7355',
    BUILDING_ATREIDES: '#2255aa',
    BUILDING_HARKONNEN: '#aa2222',
    SELECTION: '#00ff00',
    HEALTH_BG: '#440000',
    HEALTH_FG: '#00cc00',
    UI_BG: '#2a1a0a',
    UI_BORDER: '#d4a574',
    UI_PANEL: '#3a2a1a'
};

// Terrain types
const TERRAIN = {
    SAND: 0,
    ROCK: 1,
    SPICE_LIGHT: 2,
    SPICE_HEAVY: 3,
    DUNES: 4,
    MOUNTAIN: 5,
    CONCRETE: 6
};

// Building definitions
const BUILDINGS = {
    CONSTRUCTION_YARD: { name: 'Construction Yard', cost: 0, hp: 1000, power: -60, width: 2, height: 2, prereq: null, color: '#666' },
    WIND_TRAP: { name: 'Wind Trap', cost: 300, hp: 400, power: 100, width: 2, height: 2, prereq: null, color: '#4488aa' },
    REFINERY: { name: 'Refinery', cost: 400, hp: 600, power: -40, width: 3, height: 2, prereq: 'WIND_TRAP', color: '#aa6644', spawnsHarvester: true },
    BARRACKS: { name: 'Barracks', cost: 300, hp: 500, power: -20, width: 2, height: 2, prereq: 'REFINERY', color: '#888866' },
    LIGHT_FACTORY: { name: 'Light Factory', cost: 400, hp: 600, power: -30, width: 2, height: 2, prereq: 'BARRACKS', color: '#668866' },
    HEAVY_FACTORY: { name: 'Heavy Factory', cost: 600, hp: 800, power: -50, width: 3, height: 2, prereq: 'LIGHT_FACTORY', color: '#886666' },
    GUN_TURRET: { name: 'Gun Turret', cost: 125, hp: 300, power: -10, width: 1, height: 1, prereq: 'BARRACKS', color: '#555555', isDefense: true, range: 5, damage: 15 },
    SILO: { name: 'Silo', cost: 150, hp: 300, power: -10, width: 1, height: 1, prereq: 'REFINERY', color: '#aa8844' }
};

// Unit definitions
const UNITS = {
    INFANTRY: { name: 'Infantry', cost: 60, hp: 50, damage: 8, speed: 1.5, range: 2, buildTime: 60, builtAt: 'BARRACKS' },
    TROOPER: { name: 'Trooper', cost: 100, hp: 80, damage: 20, speed: 1.2, range: 4, buildTime: 90, builtAt: 'BARRACKS' },
    TRIKE: { name: 'Trike', cost: 150, hp: 100, damage: 12, speed: 4.0, range: 3, buildTime: 75, builtAt: 'LIGHT_FACTORY' },
    QUAD: { name: 'Quad', cost: 200, hp: 150, damage: 18, speed: 3.0, range: 3, buildTime: 90, builtAt: 'LIGHT_FACTORY' },
    HARVESTER: { name: 'Harvester', cost: 300, hp: 250, damage: 0, speed: 1.5, range: 0, buildTime: 120, builtAt: 'HEAVY_FACTORY', capacity: 500 },
    TANK: { name: 'Combat Tank', cost: 300, hp: 300, damage: 30, speed: 2.0, range: 4, buildTime: 150, builtAt: 'HEAVY_FACTORY' },
    SIEGE_TANK: { name: 'Siege Tank', cost: 600, hp: 400, damage: 50, speed: 1.5, range: 5, buildTime: 210, builtAt: 'HEAVY_FACTORY' }
};

// Game state
const game = {
    state: 'playing',
    camera: { x: 0, y: 0 },
    selection: [],
    credits: 1500,
    power: { produced: 0, consumed: 0 },
    buildings: [],
    units: [],
    enemies: [],
    enemyBuildings: [],
    projectiles: [],
    tick: 0,
    buildingMode: null,
    buildPreviewPos: null,
    productionQueue: [],
    productionProgress: 0,
    spiceFields: []
};

// Map data
let map = [];

// Generate map
function generateMap() {
    map = [];
    game.spiceFields = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            let terrain = TERRAIN.SAND;

            // Rock areas for building (player base)
            if (x >= 2 && x <= 10 && y >= 22 && y <= 30) {
                terrain = TERRAIN.ROCK;
            }
            // Rock areas (enemy base)
            else if (x >= 22 && x <= 30 && y >= 2 && y <= 10) {
                terrain = TERRAIN.ROCK;
            }
            // Mountains as barriers
            else if ((x === 15 && y >= 10 && y <= 22) ||
                     (y === 16 && x >= 8 && x <= 22)) {
                if (Math.random() < 0.7) terrain = TERRAIN.MOUNTAIN;
            }
            // Spice fields
            else if (x >= 12 && x <= 20 && y >= 12 && y <= 20) {
                terrain = Math.random() < 0.3 ? TERRAIN.SPICE_HEAVY :
                         Math.random() < 0.6 ? TERRAIN.SPICE_LIGHT : TERRAIN.SAND;
                if (terrain === TERRAIN.SPICE_LIGHT || terrain === TERRAIN.SPICE_HEAVY) {
                    game.spiceFields.push({
                        x: x, y: y,
                        amount: terrain === TERRAIN.SPICE_HEAVY ? 150 : 80,
                        type: terrain
                    });
                }
            }
            // Dunes scattered
            else if (Math.random() < 0.1) {
                terrain = TERRAIN.DUNES;
            }

            map[y][x] = terrain;
        }
    }
}

// Initialize game
function initGame() {
    generateMap();

    // Player starting buildings
    game.buildings = [];
    game.units = [];

    // Construction Yard
    addBuilding('CONSTRUCTION_YARD', 4, 26, 'player');

    // Starting harvester
    addUnit('HARVESTER', 7, 26, 'player');

    // Enemy base
    game.enemies = [];
    game.enemyBuildings = [];

    addBuilding('CONSTRUCTION_YARD', 24, 4, 'enemy');
    addBuilding('WIND_TRAP', 26, 4, 'enemy');
    addBuilding('REFINERY', 24, 6, 'enemy');
    addBuilding('BARRACKS', 27, 6, 'enemy');

    // Enemy units
    addUnit('TANK', 26, 8, 'enemy');
    addUnit('TRIKE', 28, 8, 'enemy');
    addUnit('INFANTRY', 25, 9, 'enemy');
    addUnit('INFANTRY', 27, 9, 'enemy');

    game.credits = 1500;
    game.selection = [];
    game.state = 'playing';
    game.tick = 0;

    // Center camera on player base
    game.camera.x = 4 * TILE_SIZE - VIEWPORT_WIDTH / 2 + 64;
    game.camera.y = 26 * TILE_SIZE - VIEWPORT_HEIGHT / 2 + 64;

    updatePower();
}

function addBuilding(type, x, y, owner) {
    const def = BUILDINGS[type];
    const building = {
        type: type,
        x: x,
        y: y,
        hp: def.hp,
        maxHp: def.hp,
        owner: owner,
        width: def.width,
        height: def.height,
        rallyPoint: { x: x + def.width, y: y + def.height },
        attackCooldown: 0
    };

    if (owner === 'player') {
        game.buildings.push(building);
    } else {
        game.enemyBuildings.push(building);
    }

    // Place concrete underneath
    for (let dy = 0; dy < def.height; dy++) {
        for (let dx = 0; dx < def.width; dx++) {
            map[y + dy][x + dx] = TERRAIN.CONCRETE;
        }
    }

    // Refinery spawns harvester
    if (def.spawnsHarvester && owner === 'player') {
        addUnit('HARVESTER', x + def.width, y + def.height - 1, owner);
    }

    updatePower();
    return building;
}

function addUnit(type, x, y, owner) {
    const def = UNITS[type];
    const unit = {
        type: type,
        x: x * TILE_SIZE + TILE_SIZE / 2,
        y: y * TILE_SIZE + TILE_SIZE / 2,
        tileX: x,
        tileY: y,
        hp: def.hp,
        maxHp: def.hp,
        owner: owner,
        target: null,
        path: [],
        attackTarget: null,
        attackCooldown: 0,
        facing: owner === 'player' ? 0 : 4,
        load: 0, // For harvesters
        state: 'idle',
        targetRefinery: null
    };

    if (owner === 'player') {
        game.units.push(unit);
    } else {
        game.enemies.push(unit);
    }

    return unit;
}

function updatePower() {
    let produced = 0;
    let consumed = 0;

    for (const b of game.buildings) {
        const def = BUILDINGS[b.type];
        if (def.power > 0) {
            produced += def.power * (b.hp / b.maxHp);
        } else {
            consumed += Math.abs(def.power);
        }
    }

    game.power.produced = Math.floor(produced);
    game.power.consumed = consumed;
}

// Pathfinding (simple A*)
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
                if (g < existing.g) {
                    existing.g = g;
                    existing.f = f;
                    existing.parent = current;
                }
            } else {
                openSet.push({ x: nx, y: ny, g, f, parent: current });
            }
        }
    }

    return [];
}

// Unit movement and AI
function updateUnit(unit, dt) {
    const def = UNITS[unit.type];

    // Harvester AI
    if (unit.type === 'HARVESTER' && unit.owner === 'player') {
        updateHarvester(unit);
        return;
    }

    // Combat
    if (unit.attackTarget && unit.attackTarget.hp > 0) {
        const dist = distance(unit.x, unit.y, unit.attackTarget.x || unit.attackTarget.x * TILE_SIZE,
                             unit.y, unit.attackTarget.y || unit.attackTarget.y * TILE_SIZE);
        if (dist <= def.range * TILE_SIZE) {
            unit.attackCooldown--;
            if (unit.attackCooldown <= 0) {
                attack(unit, unit.attackTarget);
                unit.attackCooldown = 30;
            }
        } else {
            // Move to target
            unit.target = {
                x: unit.attackTarget.x || unit.attackTarget.x * TILE_SIZE,
                y: unit.attackTarget.y || unit.attackTarget.y * TILE_SIZE
            };
        }
    }

    // Movement
    if (unit.path.length > 0) {
        const target = unit.path[0];
        const dx = target.x - unit.x;
        const dy = target.y - unit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 4) {
            unit.path.shift();
        } else {
            const speed = def.speed * TILE_SIZE / TICK_RATE;
            unit.x += (dx / dist) * speed;
            unit.y += (dy / dist) * speed;
            unit.facing = Math.floor((Math.atan2(dy, dx) + Math.PI) / (Math.PI / 4)) % 8;
        }
    }

    unit.tileX = Math.floor(unit.x / TILE_SIZE);
    unit.tileY = Math.floor(unit.y / TILE_SIZE);
}

function updateHarvester(harvester) {
    const def = UNITS.HARVESTER;

    switch (harvester.state) {
        case 'idle':
            // Find spice
            const spice = findNearestSpice(harvester.tileX, harvester.tileY);
            if (spice) {
                harvester.path = findPath(harvester.x, harvester.y, spice.x * TILE_SIZE, spice.y * TILE_SIZE);
                harvester.state = 'moving_to_spice';
                harvester.targetSpice = spice;
            }
            break;

        case 'moving_to_spice':
            if (harvester.path.length === 0) {
                harvester.state = 'harvesting';
            } else {
                moveAlongPath(harvester, def.speed);
            }
            break;

        case 'harvesting':
            const field = game.spiceFields.find(f => f.x === harvester.tileX && f.y === harvester.tileY);
            if (field && field.amount > 0 && harvester.load < def.capacity) {
                const harvestAmount = Math.min(10, field.amount, def.capacity - harvester.load);
                harvester.load += harvestAmount;
                field.amount -= harvestAmount;

                if (field.amount <= 0) {
                    map[field.y][field.x] = TERRAIN.SAND;
                    game.spiceFields = game.spiceFields.filter(f => f !== field);
                }
            } else if (harvester.load >= def.capacity * 0.8 || !field || field.amount <= 0) {
                // Return to refinery
                const refinery = game.buildings.find(b => b.type === 'REFINERY');
                if (refinery) {
                    harvester.path = findPath(harvester.x, harvester.y,
                        (refinery.x + 1) * TILE_SIZE, (refinery.y + refinery.height) * TILE_SIZE);
                    harvester.state = 'returning';
                    harvester.targetRefinery = refinery;
                }
            }
            break;

        case 'returning':
            if (harvester.path.length === 0) {
                harvester.state = 'unloading';
            } else {
                moveAlongPath(harvester, def.speed);
            }
            break;

        case 'unloading':
            if (harvester.load > 0) {
                const unloadAmount = Math.min(15, harvester.load);
                harvester.load -= unloadAmount;
                game.credits = Math.min(game.credits + unloadAmount, 32000);
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

    if (dist < 4) {
        unit.path.shift();
    } else {
        const moveSpeed = speed * TILE_SIZE / TICK_RATE;
        unit.x += (dx / dist) * moveSpeed;
        unit.y += (dy / dist) * moveSpeed;
        unit.facing = Math.floor((Math.atan2(dy, dx) + Math.PI) / (Math.PI / 4)) % 8;
    }
}

function findNearestSpice(tileX, tileY) {
    let nearest = null;
    let minDist = Infinity;

    for (const field of game.spiceFields) {
        if (field.amount <= 0) continue;
        const dist = Math.abs(field.x - tileX) + Math.abs(field.y - tileY);
        if (dist < minDist) {
            minDist = dist;
            nearest = field;
        }
    }

    return nearest;
}

function attack(attacker, target) {
    const def = UNITS[attacker.type];
    if (!def || def.damage === 0) return;

    // Create projectile
    game.projectiles.push({
        x: attacker.x,
        y: attacker.y,
        targetX: target.x || (target.x * TILE_SIZE + TILE_SIZE / 2),
        targetY: target.y || (target.y * TILE_SIZE + TILE_SIZE / 2),
        damage: def.damage,
        target: target,
        owner: attacker.owner,
        progress: 0
    });
}

function updateProjectiles() {
    for (let i = game.projectiles.length - 1; i >= 0; i--) {
        const p = game.projectiles[i];
        p.progress += 0.15;

        if (p.progress >= 1) {
            // Hit
            if (p.target && p.target.hp > 0) {
                p.target.hp -= p.damage;
                if (p.target.hp <= 0) {
                    // Remove dead unit/building
                    if (p.target.type && UNITS[p.target.type]) {
                        game.units = game.units.filter(u => u !== p.target);
                        game.enemies = game.enemies.filter(u => u !== p.target);
                    } else {
                        game.buildings = game.buildings.filter(b => b !== p.target);
                        game.enemyBuildings = game.enemyBuildings.filter(b => b !== p.target);
                    }
                }
            }
            game.projectiles.splice(i, 1);
        }
    }
}

// Enemy AI
function updateEnemyAI() {
    if (game.tick % 60 !== 0) return; // Update every 2 seconds

    for (const enemy of game.enemies) {
        if (enemy.attackTarget && enemy.attackTarget.hp > 0) continue;

        // Find nearest player unit or building
        let nearest = null;
        let minDist = Infinity;

        for (const unit of game.units) {
            const dist = distance(enemy.x, enemy.y, unit.x, unit.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = unit;
            }
        }

        for (const building of game.buildings) {
            const bx = (building.x + building.width / 2) * TILE_SIZE;
            const by = (building.y + building.height / 2) * TILE_SIZE;
            const dist = distance(enemy.x, enemy.y, bx, by);
            if (dist < minDist) {
                minDist = dist;
                nearest = building;
            }
        }

        if (nearest && minDist < 15 * TILE_SIZE) {
            enemy.attackTarget = nearest;
            const tx = nearest.x || (nearest.x * TILE_SIZE);
            const ty = nearest.y || (nearest.y * TILE_SIZE);
            enemy.path = findPath(enemy.x, enemy.y, tx, ty);
        }
    }

    // Turret attacks
    for (const building of game.enemyBuildings) {
        if (!BUILDINGS[building.type].isDefense) continue;

        const def = BUILDINGS[building.type];
        let nearest = null;
        let minDist = Infinity;

        for (const unit of game.units) {
            const dist = distance(building.x * TILE_SIZE, building.y * TILE_SIZE, unit.x, unit.y);
            if (dist < def.range * TILE_SIZE && dist < minDist) {
                minDist = dist;
                nearest = unit;
            }
        }

        if (nearest) {
            building.attackCooldown--;
            if (building.attackCooldown <= 0) {
                game.projectiles.push({
                    x: building.x * TILE_SIZE + TILE_SIZE / 2,
                    y: building.y * TILE_SIZE + TILE_SIZE / 2,
                    targetX: nearest.x,
                    targetY: nearest.y,
                    damage: def.damage,
                    target: nearest,
                    owner: 'enemy',
                    progress: 0
                });
                building.attackCooldown = 45;
            }
        }
    }
}

// Production
function updateProduction() {
    if (game.productionQueue.length === 0) return;

    const item = game.productionQueue[0];
    const def = UNITS[item] || BUILDINGS[item];
    if (!def) return;

    const powerRatio = game.power.consumed > 0 ? Math.min(1, game.power.produced / game.power.consumed) : 1;
    game.productionProgress += powerRatio;

    if (game.productionProgress >= def.buildTime) {
        // Complete production
        if (UNITS[item]) {
            // Find factory
            const factory = game.buildings.find(b => b.type === def.builtAt);
            if (factory) {
                addUnit(item, factory.rallyPoint.x, factory.rallyPoint.y, 'player');
            }
        }
        game.productionQueue.shift();
        game.productionProgress = 0;
    }
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Check win/lose
function checkGameEnd() {
    const playerBuildingsAlive = game.buildings.length > 0;
    const enemyBuildingsAlive = game.enemyBuildings.length > 0;

    if (!playerBuildingsAlive) {
        game.state = 'defeat';
    } else if (!enemyBuildingsAlive) {
        game.state = 'victory';
    }
}

// Drawing functions
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw map
    drawMap();

    // Draw buildings
    drawBuildings();

    // Draw units
    drawUnits();

    // Draw projectiles
    drawProjectiles();

    // Draw selection box
    if (game.selectionBox) {
        ctx.strokeStyle = COLORS.SELECTION;
        ctx.lineWidth = 1;
        ctx.strokeRect(
            game.selectionBox.startX - game.camera.x,
            game.selectionBox.startY - game.camera.y,
            game.selectionBox.endX - game.selectionBox.startX,
            game.selectionBox.endY - game.selectionBox.startY
        );
    }

    // Draw building preview
    if (game.buildingMode && game.buildPreviewPos) {
        drawBuildingPreview();
    }

    // Draw UI
    drawUI();

    // Draw game over
    if (game.state !== 'playing') {
        drawGameOver();
    }
}

function drawMap() {
    const startTileX = Math.floor(game.camera.x / TILE_SIZE);
    const startTileY = Math.floor(game.camera.y / TILE_SIZE);
    const endTileX = Math.min(MAP_WIDTH, startTileX + Math.ceil(VIEWPORT_WIDTH / TILE_SIZE) + 1);
    const endTileY = Math.min(MAP_HEIGHT, startTileY + Math.ceil(VIEWPORT_HEIGHT / TILE_SIZE) + 1);

    for (let y = Math.max(0, startTileY); y < endTileY; y++) {
        for (let x = Math.max(0, startTileX); x < endTileX; x++) {
            const terrain = map[y][x];
            let color;

            switch (terrain) {
                case TERRAIN.SAND: color = COLORS.SAND; break;
                case TERRAIN.ROCK: color = COLORS.ROCK; break;
                case TERRAIN.SPICE_LIGHT: color = COLORS.SPICE_LIGHT; break;
                case TERRAIN.SPICE_HEAVY: color = COLORS.SPICE_HEAVY; break;
                case TERRAIN.DUNES: color = COLORS.SAND_DARK; break;
                case TERRAIN.MOUNTAIN: color = COLORS.MOUNTAIN; break;
                case TERRAIN.CONCRETE: color = COLORS.CONCRETE; break;
                default: color = COLORS.SAND;
            }

            const screenX = x * TILE_SIZE - game.camera.x;
            const screenY = y * TILE_SIZE - game.camera.y;

            ctx.fillStyle = color;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Grid lines
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }
    }
}

function drawBuildings() {
    const allBuildings = [...game.buildings, ...game.enemyBuildings];

    for (const building of allBuildings) {
        const def = BUILDINGS[building.type];
        const screenX = building.x * TILE_SIZE - game.camera.x;
        const screenY = building.y * TILE_SIZE - game.camera.y;
        const width = def.width * TILE_SIZE;
        const height = def.height * TILE_SIZE;

        // Building color based on owner
        let color = def.color;
        if (building.owner === 'player') {
            color = COLORS.BUILDING_ATREIDES;
        } else if (building.owner === 'enemy') {
            color = COLORS.BUILDING_HARKONNEN;
        }

        // Main building
        ctx.fillStyle = color;
        ctx.fillRect(screenX + 2, screenY + 2, width - 4, height - 4);

        // Building border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX + 2, screenY + 2, width - 4, height - 4);

        // Building details
        ctx.fillStyle = shadeColor(color, -30);
        ctx.fillRect(screenX + 6, screenY + 6, width - 12, 4);

        // Health bar
        if (building.hp < building.maxHp) {
            const healthPct = building.hp / building.maxHp;
            ctx.fillStyle = COLORS.HEALTH_BG;
            ctx.fillRect(screenX, screenY - 6, width, 4);
            ctx.fillStyle = healthPct > 0.5 ? COLORS.HEALTH_FG : '#cc0';
            ctx.fillRect(screenX, screenY - 6, width * healthPct, 4);
        }

        // Selection indicator
        if (game.selection.includes(building)) {
            ctx.strokeStyle = COLORS.SELECTION;
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX - 2, screenY - 2, width + 4, height + 4);
        }
    }
}

function drawUnits() {
    const allUnits = [...game.units, ...game.enemies];

    for (const unit of allUnits) {
        const def = UNITS[unit.type];
        const screenX = unit.x - game.camera.x;
        const screenY = unit.y - game.camera.y;

        // Unit color
        let color = unit.owner === 'player' ? COLORS.BUILDING_ATREIDES : COLORS.BUILDING_HARKONNEN;

        // Unit body
        const size = unit.type === 'INFANTRY' || unit.type === 'TROOPER' ? 8 : 14;

        ctx.fillStyle = color;
        if (unit.type === 'HARVESTER') {
            // Harvester is larger
            ctx.fillRect(screenX - 12, screenY - 8, 24, 16);
            // Load indicator
            ctx.fillStyle = '#e8a040';
            const loadWidth = (unit.load / def.capacity) * 20;
            ctx.fillRect(screenX - 10, screenY - 4, loadWidth, 8);
        } else if (unit.type === 'TANK' || unit.type === 'SIEGE_TANK') {
            // Tank body
            ctx.fillRect(screenX - size, screenY - size / 2, size * 2, size);
            // Turret
            ctx.fillStyle = shadeColor(color, -20);
            ctx.beginPath();
            ctx.arc(screenX, screenY, size / 2, 0, Math.PI * 2);
            ctx.fill();
            // Gun barrel
            const angle = unit.facing * Math.PI / 4;
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(screenX + Math.cos(angle) * 12, screenY + Math.sin(angle) * 12);
            ctx.stroke();
        } else if (unit.type === 'TRIKE' || unit.type === 'QUAD') {
            ctx.beginPath();
            ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Infantry
            ctx.beginPath();
            ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Health bar
        if (unit.hp < unit.maxHp) {
            const healthPct = unit.hp / unit.maxHp;
            ctx.fillStyle = COLORS.HEALTH_BG;
            ctx.fillRect(screenX - 10, screenY - 18, 20, 3);
            ctx.fillStyle = healthPct > 0.5 ? COLORS.HEALTH_FG : '#cc0';
            ctx.fillRect(screenX - 10, screenY - 18, 20 * healthPct, 3);
        }

        // Selection
        if (game.selection.includes(unit)) {
            ctx.strokeStyle = COLORS.SELECTION;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(screenX, screenY, size + 4, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

function drawProjectiles() {
    for (const p of game.projectiles) {
        const x = p.x + (p.targetX - p.x) * p.progress - game.camera.x;
        const y = p.y + (p.targetY - p.y) * p.progress - game.camera.y;

        ctx.fillStyle = p.owner === 'player' ? '#ffff00' : '#ff4400';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawBuildingPreview() {
    const def = BUILDINGS[game.buildingMode];
    const screenX = game.buildPreviewPos.x * TILE_SIZE - game.camera.x;
    const screenY = game.buildPreviewPos.y * TILE_SIZE - game.camera.y;
    const width = def.width * TILE_SIZE;
    const height = def.height * TILE_SIZE;

    const canPlace = canPlaceBuilding(game.buildingMode, game.buildPreviewPos.x, game.buildPreviewPos.y);

    ctx.fillStyle = canPlace ? 'rgba(0, 255, 0, 0.4)' : 'rgba(255, 0, 0, 0.4)';
    ctx.fillRect(screenX, screenY, width, height);
    ctx.strokeStyle = canPlace ? '#0f0' : '#f00';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, screenY, width, height);
}

function canPlaceBuilding(type, x, y) {
    const def = BUILDINGS[type];

    // Check terrain
    for (let dy = 0; dy < def.height; dy++) {
        for (let dx = 0; dx < def.width; dx++) {
            const tx = x + dx;
            const ty = y + dy;
            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return false;
            const terrain = map[ty][tx];
            if (terrain !== TERRAIN.ROCK && terrain !== TERRAIN.CONCRETE) return false;

            // Check for existing buildings
            for (const b of game.buildings) {
                if (tx >= b.x && tx < b.x + BUILDINGS[b.type].width &&
                    ty >= b.y && ty < b.y + BUILDINGS[b.type].height) {
                    return false;
                }
            }
        }
    }

    // Check adjacency to existing buildings (except first)
    if (game.buildings.length > 0) {
        let adjacent = false;
        for (const b of game.buildings) {
            const bDef = BUILDINGS[b.type];
            for (let dy = -1; dy <= def.height; dy++) {
                for (let dx = -1; dx <= def.width; dx++) {
                    const tx = x + dx;
                    const ty = y + dy;
                    if (tx >= b.x && tx < b.x + bDef.width &&
                        ty >= b.y && ty < b.y + bDef.height) {
                        adjacent = true;
                        break;
                    }
                }
            }
        }
        if (!adjacent) return false;
    }

    // Check cost
    if (game.credits < def.cost) return false;

    // Check prerequisite
    if (def.prereq && !game.buildings.some(b => b.type === def.prereq)) return false;

    return true;
}

function drawUI() {
    // UI Panel background
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(VIEWPORT_WIDTH, 0, UI_WIDTH, canvas.height);

    // Border
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(VIEWPORT_WIDTH, 0);
    ctx.lineTo(VIEWPORT_WIDTH, canvas.height);
    ctx.stroke();

    // Yellow/black construction stripe
    for (let i = 0; i < canvas.height; i += 16) {
        ctx.fillStyle = i % 32 === 0 ? '#d4a000' : '#222';
        ctx.fillRect(VIEWPORT_WIDTH + 2, i, 8, 8);
    }

    // Credits
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('CREDITS', VIEWPORT_WIDTH + 20, 25);
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`${game.credits}`, VIEWPORT_WIDTH + 20, 48);

    // Power
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText('POWER', VIEWPORT_WIDTH + 20, 75);
    const powerColor = game.power.produced >= game.power.consumed ? '#0f0' : '#f00';
    ctx.fillStyle = powerColor;
    ctx.fillText(`${game.power.produced}/${game.power.consumed}`, VIEWPORT_WIDTH + 20, 92);

    // Minimap
    drawMinimap();

    // Build buttons
    drawBuildButtons();

    // Production progress
    if (game.productionQueue.length > 0) {
        const item = game.productionQueue[0];
        const def = UNITS[item] || BUILDINGS[item];
        const pct = game.productionProgress / def.buildTime;

        ctx.fillStyle = '#333';
        ctx.fillRect(VIEWPORT_WIDTH + 20, 500, 120, 16);
        ctx.fillStyle = '#0a0';
        ctx.fillRect(VIEWPORT_WIDTH + 20, 500, 120 * pct, 16);
        ctx.strokeStyle = '#666';
        ctx.strokeRect(VIEWPORT_WIDTH + 20, 500, 120, 16);

        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText(def.name, VIEWPORT_WIDTH + 25, 512);
    }

    // Selected unit info
    if (game.selection.length > 0) {
        const selected = game.selection[0];
        const def = UNITS[selected.type] || BUILDINGS[selected.type];

        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText(def.name, VIEWPORT_WIDTH + 20, 545);
        ctx.fillText(`HP: ${selected.hp}/${selected.maxHp}`, VIEWPORT_WIDTH + 20, 560);

        if (selected.load !== undefined) {
            ctx.fillText(`Load: ${selected.load}`, VIEWPORT_WIDTH + 20, 575);
        }
    }

    // Controls hint
    ctx.fillStyle = '#888';
    ctx.font = '9px monospace';
    ctx.fillText('Click: Select/Move', VIEWPORT_WIDTH + 15, 590);
}

function drawMinimap() {
    const minimapX = VIEWPORT_WIDTH + 20;
    const minimapY = 110;
    const minimapScale = 3;

    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(minimapX, minimapY, MAP_WIDTH * minimapScale, MAP_HEIGHT * minimapScale);

    // Terrain (simplified)
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            let color;
            switch (map[y][x]) {
                case TERRAIN.ROCK: color = COLORS.ROCK; break;
                case TERRAIN.SPICE_LIGHT:
                case TERRAIN.SPICE_HEAVY: color = COLORS.SPICE_HEAVY; break;
                case TERRAIN.MOUNTAIN: color = COLORS.MOUNTAIN; break;
                default: color = COLORS.SAND_DARK;
            }
            ctx.fillStyle = color;
            ctx.fillRect(minimapX + x * minimapScale, minimapY + y * minimapScale, minimapScale, minimapScale);
        }
    }

    // Buildings
    for (const b of game.buildings) {
        ctx.fillStyle = '#00f';
        ctx.fillRect(minimapX + b.x * minimapScale, minimapY + b.y * minimapScale,
                    BUILDINGS[b.type].width * minimapScale, BUILDINGS[b.type].height * minimapScale);
    }
    for (const b of game.enemyBuildings) {
        ctx.fillStyle = '#f00';
        ctx.fillRect(minimapX + b.x * minimapScale, minimapY + b.y * minimapScale,
                    BUILDINGS[b.type].width * minimapScale, BUILDINGS[b.type].height * minimapScale);
    }

    // Units
    for (const u of game.units) {
        ctx.fillStyle = '#0ff';
        ctx.fillRect(minimapX + u.tileX * minimapScale, minimapY + u.tileY * minimapScale, 2, 2);
    }
    for (const u of game.enemies) {
        ctx.fillStyle = '#f00';
        ctx.fillRect(minimapX + u.tileX * minimapScale, minimapY + u.tileY * minimapScale, 2, 2);
    }

    // Viewport indicator
    const viewX = minimapX + (game.camera.x / TILE_SIZE) * minimapScale;
    const viewY = minimapY + (game.camera.y / TILE_SIZE) * minimapScale;
    const viewW = (VIEWPORT_WIDTH / TILE_SIZE) * minimapScale;
    const viewH = (VIEWPORT_HEIGHT / TILE_SIZE) * minimapScale;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(viewX, viewY, viewW, viewH);
}

function drawBuildButtons() {
    const buttonY = 220;
    const buttonSize = 36;
    const buttonSpacing = 4;

    const buildOptions = [
        { type: 'WIND_TRAP', key: '1' },
        { type: 'REFINERY', key: '2' },
        { type: 'BARRACKS', key: '3' },
        { type: 'LIGHT_FACTORY', key: '4' },
        { type: 'HEAVY_FACTORY', key: '5' },
        { type: 'GUN_TURRET', key: '6' },
        { type: 'SILO', key: '7' }
    ];

    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText('BUILD:', VIEWPORT_WIDTH + 20, buttonY - 5);

    for (let i = 0; i < buildOptions.length; i++) {
        const opt = buildOptions[i];
        const def = BUILDINGS[opt.type];
        const x = VIEWPORT_WIDTH + 20 + (i % 3) * (buttonSize + buttonSpacing);
        const y = buttonY + Math.floor(i / 3) * (buttonSize + buttonSpacing);

        const available = (!def.prereq || game.buildings.some(b => b.type === def.prereq)) &&
                         game.credits >= def.cost;

        ctx.fillStyle = available ? '#444' : '#222';
        ctx.fillRect(x, y, buttonSize, buttonSize);

        ctx.fillStyle = available ? def.color : '#333';
        ctx.fillRect(x + 4, y + 4, buttonSize - 8, buttonSize - 8);

        // Cost
        ctx.fillStyle = available ? '#fff' : '#666';
        ctx.font = '8px monospace';
        ctx.fillText(`$${def.cost}`, x + 2, y + buttonSize - 3);

        // Key hint
        ctx.fillText(opt.key, x + buttonSize - 8, y + 10);

        // Selection highlight
        if (game.buildingMode === opt.type) {
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, buttonSize, buttonSize);
        }
    }

    // Unit buttons
    const unitY = buttonY + 110;
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText('UNITS:', VIEWPORT_WIDTH + 20, unitY - 5);

    const unitOptions = [
        { type: 'INFANTRY', key: 'Q' },
        { type: 'TROOPER', key: 'W' },
        { type: 'TRIKE', key: 'E' },
        { type: 'QUAD', key: 'R' },
        { type: 'TANK', key: 'T' },
        { type: 'HARVESTER', key: 'Y' }
    ];

    for (let i = 0; i < unitOptions.length; i++) {
        const opt = unitOptions[i];
        const def = UNITS[opt.type];
        const x = VIEWPORT_WIDTH + 20 + (i % 3) * (buttonSize + buttonSpacing);
        const y = unitY + Math.floor(i / 3) * (buttonSize + buttonSpacing);

        const hasFactory = game.buildings.some(b => b.type === def.builtAt);
        const available = hasFactory && game.credits >= def.cost;

        ctx.fillStyle = available ? '#444' : '#222';
        ctx.fillRect(x, y, buttonSize, buttonSize);

        ctx.fillStyle = available ? COLORS.BUILDING_ATREIDES : '#333';
        ctx.beginPath();
        ctx.arc(x + buttonSize/2, y + buttonSize/2, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = available ? '#fff' : '#666';
        ctx.font = '8px monospace';
        ctx.fillText(`$${def.cost}`, x + 2, y + buttonSize - 3);
        ctx.fillText(opt.key, x + buttonSize - 8, y + 10);
    }
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, canvas.height);

    ctx.fillStyle = game.state === 'victory' ? '#44ff44' : '#ff4444';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(game.state === 'victory' ? 'VICTORY!' : 'DEFEAT', VIEWPORT_WIDTH / 2, canvas.height / 2 - 20);

    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Press R to restart', VIEWPORT_WIDTH / 2, canvas.height / 2 + 20);
    ctx.textAlign = 'left';
}

function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// Input handling
let mouseX = 0, mouseY = 0;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < VIEWPORT_WIDTH) {
        if (game.buildingMode) {
            // Place building
            const tileX = Math.floor((x + game.camera.x) / TILE_SIZE);
            const tileY = Math.floor((y + game.camera.y) / TILE_SIZE);

            if (canPlaceBuilding(game.buildingMode, tileX, tileY)) {
                const def = BUILDINGS[game.buildingMode];
                game.credits -= def.cost;
                addBuilding(game.buildingMode, tileX, tileY, 'player');
                game.buildingMode = null;
            }
        } else {
            isDragging = true;
            dragStartX = x + game.camera.x;
            dragStartY = y + game.camera.y;
            game.selectionBox = { startX: dragStartX, startY: dragStartY, endX: dragStartX, endY: dragStartY };
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    if (game.buildingMode && mouseX < VIEWPORT_WIDTH) {
        game.buildPreviewPos = {
            x: Math.floor((mouseX + game.camera.x) / TILE_SIZE),
            y: Math.floor((mouseY + game.camera.y) / TILE_SIZE)
        };
    }

    if (isDragging) {
        game.selectionBox.endX = mouseX + game.camera.x;
        game.selectionBox.endY = mouseY + game.camera.y;
    }

    // Scroll camera when mouse at edge
    const edgeSize = 20;
    if (mouseX < edgeSize) game.camera.x = Math.max(0, game.camera.x - 8);
    if (mouseX > VIEWPORT_WIDTH - edgeSize) game.camera.x = Math.min(MAP_WIDTH * TILE_SIZE - VIEWPORT_WIDTH, game.camera.x + 8);
    if (mouseY < edgeSize) game.camera.y = Math.max(0, game.camera.y - 8);
    if (mouseY > canvas.height - edgeSize) game.camera.y = Math.min(MAP_HEIGHT * TILE_SIZE - canvas.height, game.camera.y + 8);
});

canvas.addEventListener('mouseup', (e) => {
    if (isDragging) {
        isDragging = false;

        // Select units in box
        const box = game.selectionBox;
        const minX = Math.min(box.startX, box.endX);
        const maxX = Math.max(box.startX, box.endX);
        const minY = Math.min(box.startY, box.endY);
        const maxY = Math.max(box.startY, box.endY);

        if (maxX - minX < 5 && maxY - minY < 5) {
            // Click selection
            const worldX = mouseX + game.camera.x;
            const worldY = mouseY + game.camera.y;

            // Check units
            let selected = null;
            for (const unit of game.units) {
                if (Math.abs(unit.x - worldX) < 16 && Math.abs(unit.y - worldY) < 16) {
                    selected = unit;
                    break;
                }
            }

            // Check buildings
            if (!selected) {
                for (const building of game.buildings) {
                    const def = BUILDINGS[building.type];
                    if (worldX >= building.x * TILE_SIZE && worldX < (building.x + def.width) * TILE_SIZE &&
                        worldY >= building.y * TILE_SIZE && worldY < (building.y + def.height) * TILE_SIZE) {
                        selected = building;
                        break;
                    }
                }
            }

            if (selected) {
                game.selection = [selected];
            } else {
                game.selection = [];
            }
        } else {
            // Box selection
            game.selection = [];
            for (const unit of game.units) {
                if (unit.x >= minX && unit.x <= maxX && unit.y >= minY && unit.y <= maxY) {
                    game.selection.push(unit);
                }
            }
        }

        game.selectionBox = null;
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();

    if (game.buildingMode) {
        game.buildingMode = null;
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + game.camera.x;
    const y = e.clientY - rect.top + game.camera.y;

    // Move or attack command
    for (const unit of game.selection) {
        if (!UNITS[unit.type]) continue; // Skip buildings

        // Check for attack target
        let target = null;
        for (const enemy of game.enemies) {
            if (Math.abs(enemy.x - x) < 16 && Math.abs(enemy.y - y) < 16) {
                target = enemy;
                break;
            }
        }
        for (const building of game.enemyBuildings) {
            const def = BUILDINGS[building.type];
            if (x >= building.x * TILE_SIZE && x < (building.x + def.width) * TILE_SIZE &&
                y >= building.y * TILE_SIZE && y < (building.y + def.height) * TILE_SIZE) {
                target = building;
                break;
            }
        }

        if (target) {
            unit.attackTarget = target;
        }

        unit.path = findPath(unit.x, unit.y, x, y);
    }
});

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    if (game.state !== 'playing') {
        if (key === 'r') initGame();
        return;
    }

    // Building hotkeys
    const buildKeys = { '1': 'WIND_TRAP', '2': 'REFINERY', '3': 'BARRACKS', '4': 'LIGHT_FACTORY',
                        '5': 'HEAVY_FACTORY', '6': 'GUN_TURRET', '7': 'SILO' };

    if (buildKeys[key]) {
        const type = buildKeys[key];
        const def = BUILDINGS[type];
        if ((!def.prereq || game.buildings.some(b => b.type === def.prereq)) && game.credits >= def.cost) {
            game.buildingMode = type;
        }
    }

    // Unit production hotkeys
    const unitKeys = { 'q': 'INFANTRY', 'w': 'TROOPER', 'e': 'TRIKE', 'r': 'QUAD', 't': 'TANK', 'y': 'HARVESTER' };

    if (unitKeys[key]) {
        const type = unitKeys[key];
        const def = UNITS[type];
        if (game.buildings.some(b => b.type === def.builtAt) && game.credits >= def.cost) {
            game.credits -= def.cost;
            game.productionQueue.push(type);
        }
    }

    // Cancel building mode
    if (key === 'escape') {
        game.buildingMode = null;
    }
});

// Game loop
function gameLoop() {
    if (game.state === 'playing') {
        game.tick++;

        // Update units
        for (const unit of game.units) {
            updateUnit(unit, 1);
        }
        for (const enemy of game.enemies) {
            updateUnit(enemy, 1);
        }

        // Update AI
        updateEnemyAI();

        // Update projectiles
        updateProjectiles();

        // Update production
        updateProduction();

        // Check game end
        checkGameEnd();
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// Expose for testing
window.gameState = game;
Object.defineProperty(window, 'units', { get: () => game.units });
Object.defineProperty(window, 'buildings', { get: () => game.buildings });

// Start game
initGame();
gameLoop();
