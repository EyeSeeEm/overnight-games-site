// X-COM Classic Clone - Canvas 2D Implementation
// Turn-based tactical strategy game - Authentic X-COM Style

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants - Match classic X-COM dimensions
const TILE_WIDTH = 32;
const TILE_HEIGHT = 16;
const MAP_WIDTH = 30;
const MAP_HEIGHT = 30;
const UI_HEIGHT = 160;
const GAME_HEIGHT = canvas.height - UI_HEIGHT;

// Classic X-COM Color Palette
const COLORS = {
    // Terrain
    GRASS_LIGHT: '#3a5a2a',
    GRASS_DARK: '#2a4a1a',
    DIRT: '#6b5433',
    DIRT_DARK: '#4a3a22',
    ROAD: '#3a3a3a',
    ROAD_LIGHT: '#4a4a4a',
    WALL_LIGHT: '#667788',
    WALL_DARK: '#445566',
    WALL_BRICK: '#6b5555',
    FENCE: '#b89a72',
    BUSH_LIGHT: '#2a5a24',
    BUSH_DARK: '#1a3a14',
    WATER: '#1a2a4a',

    // UI
    UI_BG: '#1a1a3a',
    UI_PANEL: '#555566',
    UI_HIGHLIGHT: '#777788',
    UI_SHADOW: '#333344',
    UI_BORDER: '#4444aa',

    // Units
    SOLDIER_ARMOR: '#4477aa',
    SOLDIER_ARMOR_LIGHT: '#6699cc',
    SOLDIER_HELMET: '#334455',
    SOLDIER_VISOR: '#aaccff',

    SECTOID_SKIN: '#888899',
    SECTOID_DARK: '#666677',
    FLOATER_SKIN: '#886644',
    FLOATER_DARK: '#664422',

    // Effects
    PLASMA_GREEN: '#00ff44',
    LASER_YELLOW: '#ffff00',
    EXPLOSION: '#ff6600',
    FIRE: '#ff4400'
};

// Isometric conversion
function toIso(x, y) {
    return {
        x: (x - y) * (TILE_WIDTH / 2) + canvas.width / 2,
        y: (x + y) * (TILE_HEIGHT / 2) + 50
    };
}

function fromIso(screenX, screenY) {
    const adjustedX = screenX - canvas.width / 2;
    const adjustedY = screenY - 50;
    const x = (adjustedX / (TILE_WIDTH / 2) + adjustedY / (TILE_HEIGHT / 2)) / 2;
    const y = (adjustedY / (TILE_HEIGHT / 2) - adjustedX / (TILE_WIDTH / 2)) / 2;
    return { x: Math.floor(x), y: Math.floor(y) };
}

// Game state
const game = {
    state: 'playing',
    turn: 'player',
    turnNumber: 1,
    selectedUnit: null,
    hoveredTile: null,
    cameraX: 0,
    cameraY: 0,
    message: 'Select a soldier',
    messageTimer: 0,
    actionMode: 'move',
    debugMode: false,
    previewPath: null,  // For path preview
    previewTUCost: 0,   // TU cost for preview path
    targetedAlien: null, // For hit chance preview
    screenShake: 0,      // Screen shake intensity
    shakeX: 0,
    shakeY: 0,
    turnFlash: 0,        // Turn change flash effect
    turnFlashColor: null,
    kills: { soldiers: 0, aliens: 0 },
    combatLog: [],
    smoke: [],  // Smoke grenades - {x, y, density, turnsLeft}
    showHelp: false,  // Help screen toggle
    endTurnConfirm: false,  // End turn confirmation state
    showTitle: true  // Show title screen at start
};

// Terrain types with X-COM colors
const TERRAIN = {
    GRASS: { id: 0, tu: 4, cover: 'none', walkable: true, type: 'grass' },
    GRASS_DARK: { id: 1, tu: 4, cover: 'none', walkable: true, type: 'grass_dark' },
    DIRT: { id: 2, tu: 4, cover: 'none', walkable: true, type: 'dirt' },
    ROAD: { id: 3, tu: 3, cover: 'none', walkable: true, type: 'road' },
    WALL: { id: 4, tu: 99, cover: 'full', walkable: false, type: 'wall' },
    WALL_BRICK: { id: 5, tu: 99, cover: 'full', walkable: false, type: 'wall_brick' },
    FENCE: { id: 6, tu: 6, cover: 'partial', walkable: true, type: 'fence' },
    BUSH: { id: 7, tu: 6, cover: 'partial', walkable: true, type: 'bush' },
    WATER: { id: 8, tu: 99, cover: 'none', walkable: false, type: 'water' },
    FLOWERS: { id: 9, tu: 4, cover: 'none', walkable: true, type: 'flowers' }
};

// Weapons
const WEAPONS = {
    RIFLE: {
        name: 'Rifle',
        damage: 30,
        snapShot: { accuracy: 60, tuPercent: 25 },
        aimedShot: { accuracy: 110, tuPercent: 80 },
        autoShot: { accuracy: 35, tuPercent: 35, rounds: 3 },
        ammo: 20,
        snapTU: 15
    },
    PISTOL: {
        name: 'Pistol',
        damage: 26,
        snapShot: { accuracy: 30, tuPercent: 18 },
        aimedShot: { accuracy: 78, tuPercent: 30 },
        autoShot: null,
        ammo: 12,
        snapTU: 12
    },
    PLASMA_PISTOL: {
        name: 'Plasma Pistol',
        damage: 52,
        snapShot: { accuracy: 65, tuPercent: 30 },
        aimedShot: { accuracy: 85, tuPercent: 60 },
        autoShot: null,
        ammo: 26,
        snapTU: 18
    },
    PLASMA_RIFLE: {
        name: 'Plasma Rifle',
        damage: 80,
        snapShot: { accuracy: 55, tuPercent: 35 },
        aimedShot: { accuracy: 100, tuPercent: 70 },
        autoShot: { accuracy: 35, tuPercent: 50, rounds: 3 },
        ammo: 28,
        snapTU: 20
    },
    HEAVY_PLASMA: {
        name: 'Heavy Plasma',
        damage: 115,
        snapShot: { accuracy: 50, tuPercent: 35 },
        aimedShot: { accuracy: 90, tuPercent: 80 },
        autoShot: { accuracy: 30, tuPercent: 55, rounds: 3 },
        ammo: 35,
        snapTU: 25
    }
};

// Decorations (lamp posts, crates, debris)
let decorations = [];

// Generate map - more authentic X-COM terrain
let map = [];
function generateMap() {
    map = [];
    decorations = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            let terrain = Math.random() < 0.5 ? TERRAIN.GRASS : TERRAIN.GRASS_DARK;

            // Road through middle (now wider map)
            if (x >= 13 && x <= 16) {
                terrain = TERRAIN.ROAD;
            }
            // Dirt landing zone (player spawn area)
            else if (x >= 1 && x <= 6 && y >= 1 && y <= 6) {
                terrain = TERRAIN.DIRT;
            }

            map[y][x] = {
                terrain: terrain,
                visible: false,
                explored: false,
                unit: null
            };
        }
    }

    // Generate random buildings
    const numBuildings = 2 + Math.floor(Math.random() * 3); // 2-4 buildings
    for (let b = 0; b < numBuildings; b++) {
        // Random building position (away from spawn)
        const bx = 12 + Math.floor(Math.random() * 14); // x: 12-25
        const by = 5 + Math.floor(Math.random() * 20);  // y: 5-24
        const bw = 4 + Math.floor(Math.random() * 3);   // width: 4-6
        const bh = 4 + Math.floor(Math.random() * 3);   // height: 4-6

        // Check bounds
        if (bx + bw >= MAP_WIDTH || by + bh >= MAP_HEIGHT) continue;

        // Draw building walls and interior
        for (let dy = 0; dy <= bh; dy++) {
            for (let dx = 0; dx <= bw; dx++) {
                const tx = bx + dx;
                const ty = by + dy;
                if (ty >= MAP_HEIGHT || tx >= MAP_WIDTH) continue;

                // Walls on edges
                if (dx === 0 || dx === bw || dy === 0 || dy === bh) {
                    map[ty][tx].terrain = TERRAIN.WALL_BRICK;
                }
                // Interior floor
                else {
                    map[ty][tx].terrain = TERRAIN.ROAD;
                }
            }
        }
        // Add door opening
        const doorSide = Math.floor(Math.random() * 4);
        if (doorSide === 0 && bx > 0) map[by + Math.floor(bh/2)][bx].terrain = TERRAIN.ROAD;
        else if (doorSide === 1 && bx + bw < MAP_WIDTH) map[by + Math.floor(bh/2)][bx + bw].terrain = TERRAIN.ROAD;
        else if (doorSide === 2 && by > 0) map[by][bx + Math.floor(bw/2)].terrain = TERRAIN.ROAD;
        else if (doorSide === 3 && by + bh < MAP_HEIGHT) map[by + bh][bx + Math.floor(bw/2)].terrain = TERRAIN.ROAD;
    }

    // Add random bushes
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (map[y][x].terrain.type && map[y][x].terrain.type.includes('grass')) {
                if (Math.random() < 0.1) map[y][x].terrain = TERRAIN.BUSH;
                else if (Math.random() < 0.06) map[y][x].terrain = TERRAIN.FLOWERS;
            }
        }
    }

    // Add fence sections
    const fenceY = 10 + Math.floor(Math.random() * 5);
    for (let x = 2; x <= 8; x++) {
        if (map[fenceY][x].terrain.type && map[fenceY][x].terrain.type.includes('grass')) {
            map[fenceY][x].terrain = TERRAIN.FENCE;
        }
    }

    // Add lamp posts along the road
    for (let y = 3; y < MAP_HEIGHT - 3; y += 6) {
        decorations.push({ type: 'lamppost', x: 14, y: y });
    }

    // Add random crates and debris
    for (let i = 0; i < 6; i++) {
        const dx = 10 + Math.floor(Math.random() * 15);
        const dy = 5 + Math.floor(Math.random() * 20);
        if (map[dy][dx].terrain.walkable) {
            decorations.push({ type: Math.random() < 0.5 ? 'crate' : 'debris', x: dx, y: dy });
        }
    }
}

// Units arrays
let soldiers = [];
let aliens = [];

function createSoldier(x, y, name) {
    const baseTU = 50 + Math.floor(Math.random() * 20);
    return {
        type: 'soldier',
        name: name,
        x: x,
        y: y,
        facing: 2,
        stance: 'standing',
        tu: { base: baseTU, current: baseTU },
        health: { base: 35, current: 35 },
        stamina: { base: 60, current: 60 },
        reactions: 30 + Math.floor(Math.random() * 30),
        firingAccuracy: 40 + Math.floor(Math.random() * 30),
        bravery: 30 + Math.floor(Math.random() * 40),
        morale: 100,
        weapon: { ...WEAPONS.RIFLE, currentAmmo: WEAPONS.RIFLE.ammo },
        secondaryWeapon: { ...WEAPONS.PISTOL, currentAmmo: WEAPONS.PISTOL.ammo },
        isAlive: true,
        reserveTU: 0,
        overwatch: false,  // Overwatch mode - will fire on enemy movement
        kills: 0,          // Kill count for rank
        missions: 1        // Missions participated
    };
}

// Get soldier rank based on kills
function getSoldierRank(soldier) {
    const k = soldier.kills;
    if (k >= 20) return { name: 'Commander', color: '#ffaa00' };
    if (k >= 15) return { name: 'Colonel', color: '#ff8800' };
    if (k >= 10) return { name: 'Captain', color: '#aa88ff' };
    if (k >= 6) return { name: 'Sergeant', color: '#88ff88' };
    if (k >= 3) return { name: 'Squaddie', color: '#88aaff' };
    return { name: 'Rookie', color: '#aaaaaa' };
}

function createAlien(x, y, type = 'sectoid') {
    // Different stats based on alien type
    const alienStats = {
        sectoid: {
            health: 30,
            tu: 54,
            reactions: 50 + Math.floor(Math.random() * 20),
            accuracy: 50 + Math.floor(Math.random() * 30),
            weapon: WEAPONS.PLASMA_PISTOL
        },
        floater: {
            health: 45,
            tu: 60,  // Faster than sectoids
            reactions: 40 + Math.floor(Math.random() * 30),
            accuracy: 40 + Math.floor(Math.random() * 25),
            weapon: WEAPONS.PLASMA_RIFLE
        },
        cyberdisc: {
            health: 80,
            tu: 40,  // Slow but tough
            reactions: 30 + Math.floor(Math.random() * 20),
            accuracy: 60 + Math.floor(Math.random() * 20),
            weapon: WEAPONS.HEAVY_PLASMA
        }
    };

    const stats = alienStats[type] || alienStats.sectoid;

    return {
        type: 'alien',
        alienType: type,
        name: type.charAt(0).toUpperCase() + type.slice(1),
        x: x,
        y: y,
        facing: 6,
        stance: 'standing',
        tu: { base: stats.tu, current: stats.tu },
        health: { base: stats.health, current: stats.health },
        reactions: stats.reactions,
        firingAccuracy: stats.accuracy,
        weapon: { ...stats.weapon, currentAmmo: stats.weapon.ammo },
        isAlive: true,
        spotted: false,
        lastKnownX: -1,
        lastKnownY: -1
    };
}

function initGame() {
    generateMap();

    const names = ['Johnson', 'Williams', 'Martinez', 'Lee', 'Thompson', 'Garcia'];
    const positions = [[3, 3], [4, 3], [5, 3], [3, 4], [4, 4], [5, 4]];
    soldiers = [];
    for (let i = 0; i < 6; i++) {
        const s = createSoldier(positions[i][0], positions[i][1], names[i]);
        soldiers.push(s);
        map[s.y][s.x].unit = s;
    }

    aliens = [];
    // Aliens start farther from soldiers across the larger map
    const alienPositions = [
        [20, 15], [22, 16], [21, 18],  // Far side of road
        [25, 10], [26, 12],            // Far right
        [18, 22], [20, 25],            // Bottom area
        [24, 20], [27, 15],            // More distant
        [15, 26], [22, 28]             // Very far
    ];
    for (let pos of alienPositions) {
        // Ensure position is valid and walkable
        if (pos[0] < MAP_WIDTH && pos[1] < MAP_HEIGHT &&
            map[pos[1]][pos[0]].terrain.walkable && !map[pos[1]][pos[0]].unit) {
            const a = createAlien(pos[0], pos[1], Math.random() < 0.7 ? 'sectoid' : 'floater');
            aliens.push(a);
            map[a.y][a.x].unit = a;
        }
    }

    game.selectedUnit = soldiers[0];
    game.turn = 'player';
    game.turnNumber = 1;
    game.state = 'playing';
    game.kills = { soldiers: 0, aliens: 0 };
    game.combatLog = [];
    game.smoke = [];  // Clear any smoke from previous game
    updateVisibility();

    // Show initial instructions
    setMessage('MISSION START! Click soldiers to select, click tiles to move, click enemies to shoot. Press E to end turn.');
    createFloatingText(canvas.width / 2, GAME_HEIGHT / 2, 'YOUR TURN', '#44ff44');
}

function updateVisibility() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x].visible = false;
        }
    }

    for (let s of soldiers) {
        if (!s.isAlive) continue;
        const range = s.stance === 'kneeling' ? 15 : 20;

        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const tx = s.x + dx;
                const ty = s.y + dy;
                if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) continue;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= range && hasLineOfSight(s.x, s.y, tx, ty)) {
                    map[ty][tx].visible = true;
                    map[ty][tx].explored = true;
                }
            }
        }
    }

    for (let a of aliens) {
        if (!a.isAlive) continue;
        a.spotted = map[a.y][a.x].visible;
        if (a.spotted) {
            a.lastKnownX = a.x;
            a.lastKnownY = a.y;
        }
    }
}

function hasLineOfSight(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    let x = x1, y = y1;

    while (true) {
        if (x === x2 && y === y2) return true;
        if (x !== x1 || y !== y1) {
            // Check walls
            if (map[y] && map[y][x] && (map[y][x].terrain === TERRAIN.WALL || map[y][x].terrain === TERRAIN.WALL_BRICK)) {
                return false;
            }
            // Check smoke - blocks LOS if density is high enough
            const smokeCloud = game.smoke.find(s => s.x === x && s.y === y && s.density >= 3);
            if (smokeCloud) {
                return false;
            }
        }
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
    }
}

// Throw smoke grenade at target location
function throwSmokeGrenade(soldier, targetX, targetY) {
    const dist = distance(soldier.x, soldier.y, targetX, targetY);
    const maxRange = 12;
    const smokeCost = 25;  // TU cost to throw smoke

    if (dist > maxRange) {
        setMessage('Target too far for smoke grenade!');
        return false;
    }

    if (soldier.tu.current < smokeCost) {
        setMessage('Not enough TU for smoke!');
        return false;
    }

    soldier.tu.current -= smokeCost;

    // Create smoke cloud (3x3 area centered on target)
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const sx = targetX + dx;
            const sy = targetY + dy;
            if (sx < 0 || sx >= MAP_WIDTH || sy < 0 || sy >= MAP_HEIGHT) continue;

            // Check if smoke already exists at this tile
            const existing = game.smoke.find(s => s.x === sx && s.y === sy);
            if (existing) {
                existing.density = Math.min(5, existing.density + 3);
                existing.turnsLeft = 3;
            } else {
                const centerDist = Math.abs(dx) + Math.abs(dy);
                const density = centerDist === 0 ? 5 : (centerDist === 1 ? 4 : 3);
                game.smoke.push({ x: sx, y: sy, density: density, turnsLeft: 3 });
            }
        }
    }

    setMessage(soldier.name + ' threw smoke grenade!');
    createFloatingText(
        toIso(targetX, targetY).x,
        toIso(targetX, targetY).y - 10,
        'SMOKE!', '#888888'
    );

    updateVisibility();
    return true;
}

// Throw frag grenade - area damage
function throwFragGrenade(soldier, targetX, targetY) {
    const dist = distance(soldier.x, soldier.y, targetX, targetY);
    const maxRange = 10;
    const grenadeCost = 30;  // TU cost to throw grenade

    if (dist > maxRange) {
        setMessage('Target too far for grenade!');
        return false;
    }

    if (soldier.tu.current < grenadeCost) {
        setMessage('Not enough TU for grenade!');
        return false;
    }

    soldier.tu.current -= grenadeCost;

    // Create explosion effect
    const pos = toIso(targetX, targetY);
    explosions.push({
        x: pos.x,
        y: pos.y,
        life: 1,
        radius: 30
    });

    triggerScreenShake(20);

    // Deal damage in 3x3 area
    const damage = 60 + Math.floor(Math.random() * 40);
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const tx = targetX + dx;
            const ty = targetY + dy;
            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) continue;

            // Damage falloff from center
            const centerDist = Math.abs(dx) + Math.abs(dy);
            const actualDamage = Math.floor(damage * (centerDist === 0 ? 1 : (centerDist === 1 ? 0.7 : 0.4)));

            // Check for units at this tile
            const hitAlien = aliens.find(a => a.isAlive && a.x === tx && a.y === ty);
            const hitSoldier = soldiers.find(s => s.isAlive && s.x === tx && s.y === ty);

            if (hitAlien) {
                hitAlien.health.current -= actualDamage;
                createFloatingText(
                    toIso(tx, ty).x, toIso(tx, ty).y - 20,
                    `-${actualDamage}`, '#ff8844'
                );
                if (hitAlien.health.current <= 0) {
                    hitAlien.isAlive = false;
                    map[hitAlien.y][hitAlien.x].unit = null;
                    soldier.kills++;
                    game.kills.aliens++;
                    addCombatLog(`Grenade killed ${hitAlien.name}!`, '#ff8844');
                }
            }

            if (hitSoldier && hitSoldier !== soldier) {
                hitSoldier.health.current -= actualDamage;
                createFloatingText(
                    toIso(tx, ty).x, toIso(tx, ty).y - 20,
                    `-${actualDamage}`, '#ff4444'
                );
                if (hitSoldier.health.current <= 0) {
                    hitSoldier.isAlive = false;
                    map[hitSoldier.y][hitSoldier.x].unit = null;
                    game.kills.soldiers++;
                    addCombatLog(`FRIENDLY FIRE: ${hitSoldier.name} killed!`, '#ff4444');
                }
            }
        }
    }

    setMessage(soldier.name + ' threw frag grenade!');
    addCombatLog(`${soldier.name} threw grenade`, '#ff8844');
    checkGameEnd();
    return true;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function getMovementCost(fromX, fromY, toX, toY) {
    if (toX < 0 || toX >= MAP_WIDTH || toY < 0 || toY >= MAP_HEIGHT) return 999;
    const tile = map[toY][toX];
    if (!tile.terrain.walkable || tile.unit) return 999;
    return tile.terrain.tu;
}

function findPath(startX, startY, endX, endY) {
    if (endX < 0 || endX >= MAP_WIDTH || endY < 0 || endY >= MAP_HEIGHT) return null;
    if (!map[endY][endX].terrain.walkable || map[endY][endX].unit) return null;

    const openSet = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
    const closedSet = new Set();

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();

        if (current.x === endX && current.y === endY) {
            const path = [];
            let node = current;
            while (node) {
                path.unshift({ x: node.x, y: node.y });
                node = node.parent;
            }
            return path;
        }

        closedSet.add(`${current.x},${current.y}`);

        const dirs = [[-1,-1], [0,-1], [1,-1], [-1,0], [1,0], [-1,1], [0,1], [1,1]];
        for (let [dx, dy] of dirs) {
            const nx = current.x + dx;
            const ny = current.y + dy;
            if (closedSet.has(`${nx},${ny}`)) continue;

            const cost = getMovementCost(current.x, current.y, nx, ny);
            if (cost >= 999) continue;

            const moveCost = (dx !== 0 && dy !== 0) ? cost * 1.4 : cost;
            const g = current.g + moveCost;
            const h = distance(nx, ny, endX, endY) * 4;
            const f = g + h;

            const existing = openSet.find(n => n.x === nx && n.y === ny);
            if (existing) {
                if (g < existing.g) {
                    existing.g = g;
                    existing.f = f;
                    existing.parent = current;
                }
            } else {
                openSet.push({ x: nx, y: ny, g, h, f, parent: current });
            }
        }
    }
    return null;
}

function calculateHitChance(shooter, target, shotType) {
    const weapon = shooter.weapon;
    const shot = shotType === 'snap' ? weapon.snapShot :
                 shotType === 'aimed' ? weapon.aimedShot : weapon.autoShot;
    if (!shot) return 0;

    let chance = (shooter.firingAccuracy * shot.accuracy / 100);
    const dist = distance(shooter.x, shooter.y, target.x, target.y);
    chance -= dist * 2;
    if (shooter.stance === 'kneeling') chance *= 1.15;
    const targetTile = map[target.y][target.x];
    if (targetTile.terrain.cover === 'partial') chance *= 0.7;
    if (targetTile.terrain.cover === 'full') chance *= 0.3;

    return Math.max(5, Math.min(95, Math.floor(chance)));
}

let projectiles = [];
let hitEffects = [];
let floatingTexts = [];
let deathAnimations = [];
let footstepDust = [];  // Dust particles from movement
let muzzleFlashes = []; // Muzzle flash effects when firing
let explosions = [];    // Explosion visual effects

function createProjectile(from, to, hit) {
    const fromPos = toIso(from.x, from.y);
    const toPos = toIso(to.x, to.y);

    // Calculate direction for muzzle flash
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const angle = Math.atan2(dy, dx);

    // Create muzzle flash at shooter position
    const flashColor = from.type === 'alien' ? '#00ff88' : '#ffff44';
    muzzleFlashes.push({
        x: fromPos.x,
        y: fromPos.y - 16,
        angle: angle,
        life: 1,
        color: flashColor,
        size: 12 + Math.random() * 4,
        isPlasma: from.type === 'alien'
    });

    projectiles.push({
        x: fromPos.x + game.cameraX,
        y: fromPos.y + game.cameraY - 16,
        targetX: toPos.x + game.cameraX,
        targetY: toPos.y + game.cameraY - 16,
        progress: 0,
        hit: hit,
        color: from.type === 'alien' ? COLORS.PLASMA_GREEN : COLORS.LASER_YELLOW
    });
}

function createHitEffect(x, y, isHit, isPlasma) {
    const particles = [];
    const count = isHit ? 12 : 6;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
        const speed = isHit ? 3 + Math.random() * 4 : 2 + Math.random() * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - (isHit ? 2 : 1),
            life: 1,
            size: isHit ? 3 + Math.random() * 3 : 2 + Math.random() * 2,
            color: isHit ? (isPlasma ? '#00ff44' : '#ffaa00') : '#888888'
        });
    }
    hitEffects.push({ particles, age: 0 });

    // Trigger screen shake on hit
    if (isHit) {
        triggerScreenShake(8);
    }
}

function triggerScreenShake(intensity) {
    game.screenShake = Math.max(game.screenShake, intensity);
}

function updateScreenShake() {
    if (game.screenShake > 0) {
        game.shakeX = (Math.random() - 0.5) * game.screenShake * 2;
        game.shakeY = (Math.random() - 0.5) * game.screenShake * 2;
        game.screenShake *= 0.85; // Decay
        if (game.screenShake < 0.5) {
            game.screenShake = 0;
            game.shakeX = 0;
            game.shakeY = 0;
        }
    }
}

function fireWeapon(shooter, target, shotType) {
    const weapon = shooter.weapon;
    const shot = shotType === 'snap' ? weapon.snapShot :
                 shotType === 'aimed' ? weapon.aimedShot : weapon.autoShot;
    if (!shot) return false;

    const tuCost = Math.floor(shooter.tu.base * shot.tuPercent / 100);
    if (shooter.tu.current < tuCost) {
        setMessage('Not enough TU!');
        return false;
    }
    if (weapon.currentAmmo <= 0) {
        setMessage('Out of ammo!');
        return false;
    }

    shooter.tu.current -= tuCost;
    const rounds = shot.rounds || 1;

    for (let i = 0; i < rounds; i++) {
        if (weapon.currentAmmo <= 0) break;
        weapon.currentAmmo--;

        const hitChance = calculateHitChance(shooter, target, shotType);
        const roll = Math.random() * 100;
        createProjectile(shooter, target, roll < hitChance);

        if (roll < hitChance) {
            const damageRoll = weapon.damage * (0.5 + Math.random() * 1.5);
            const damage = Math.floor(damageRoll);
            target.health.current -= damage;
            setMessage(`Hit! ${damage} damage to ${target.name}`);

            // Floating damage number
            const targetPos = toIso(target.x, target.y);
            createFloatingText(targetPos.x + game.cameraX, targetPos.y + game.cameraY - 20, `-${damage}`, '#ff4444');

            if (target.health.current <= 0) {
                target.isAlive = false;
                map[target.y][target.x].unit = null;
                setMessage(`${target.name} killed!`);
                triggerScreenShake(15); // Big shake on death

                // Create death animation
                const pos = toIso(target.x, target.y);
                deathAnimations.push({
                    x: pos.x + game.cameraX,
                    y: pos.y + game.cameraY,
                    type: target.type,
                    life: 1,
                    rotation: (Math.random() - 0.5) * 0.5
                });

                // Track kills and add to combat log
                if (target.type === 'alien') {
                    game.kills.aliens++;
                    // Credit the kill to the shooter if they're a soldier
                    if (shooter.type === 'soldier') {
                        shooter.kills++;
                        const rank = getSoldierRank(shooter);
                        createFloatingText(
                            toIso(shooter.x, shooter.y).x,
                            toIso(shooter.x, shooter.y).y - 40,
                            '+1 KILL', '#ffff44'
                        );
                        // Check for rank up
                        const oldKills = shooter.kills - 1;
                        const oldRank = getSoldierRank({ kills: oldKills }).name;
                        if (rank.name !== oldRank) {
                            createFloatingText(
                                toIso(shooter.x, shooter.y).x,
                                toIso(shooter.x, shooter.y).y - 55,
                                'PROMOTED: ' + rank.name, rank.color
                            );
                        }
                    }
                    addCombatLog(`${shooter.name} killed ${target.name}!`, '#88ff88');
                    // Morale boost for soldiers when alien killed
                    for (let s of soldiers) {
                        if (s.isAlive) s.morale = Math.min(100, s.morale + 5);
                    }
                } else {
                    game.kills.soldiers++;
                    addCombatLog(`${shooter.name} killed ${target.name}!`, '#ff8888');
                    // Morale drop for soldiers when ally killed
                    for (let s of soldiers) {
                        if (s.isAlive) s.morale = Math.max(10, s.morale - 15);
                    }
                }
            } else {
                addCombatLog(`${shooter.name} hit ${target.name} for ${damage}`, '#ffff88');
            }
        } else {
            setMessage('Missed!');
            addCombatLog(`${shooter.name} missed ${target.name}`, '#888888');
            // Floating miss text
            const targetPos = toIso(target.x, target.y);
            createFloatingText(targetPos.x + game.cameraX, targetPos.y + game.cameraY - 20, 'MISS', '#888888');

            // Miss splash particles (bullet hit terrain)
            createMissEffect(targetPos.x + game.cameraX + (Math.random()-0.5)*20,
                            targetPos.y + game.cameraY + (Math.random()-0.5)*10);
        }
    }

    shooter.facing = getFacing(shooter.x, shooter.y, target.x, target.y);
    return true;
}

function addCombatLog(message, color) {
    game.combatLog.unshift({ text: message, color: color, age: 0 });
    if (game.combatLog.length > 8) game.combatLog.pop();
}

function createFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y,
        text: text,
        color: color,
        life: 1,
        vy: -2
    });
}

// Create dust particles for footsteps
function createFootstepDust(tileX, tileY, isSoldier) {
    const pos = toIso(tileX, tileY);
    const dustColor = isSoldier ? '#8b7355' : '#555566';  // Brown for soldiers, gray for aliens

    for (let i = 0; i < 3; i++) {
        footstepDust.push({
            x: pos.x + (Math.random() - 0.5) * 10,
            y: pos.y + (Math.random() - 0.5) * 5,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -Math.random() * 0.8 - 0.3,
            size: 2 + Math.random() * 2,
            life: 0.8 + Math.random() * 0.4,
            color: dustColor
        });
    }
}

function createMissEffect(x, y) {
    // Dirt/debris particles for missed shots
    const particles = [];
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 0.6 + Math.random() * 0.4,
            size: 1 + Math.random() * 2,
            color: ['#6b5433', '#444', '#553'][Math.floor(Math.random() * 3)]
        });
    }
    hitEffects.push({ particles, age: 0 });
}

function getFacing(fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    return Math.round((angle + Math.PI) / (Math.PI / 4)) % 8;
}

function moveUnit(unit, path) {
    if (!path || path.length < 2) return false;

    let totalCost = 0;
    for (let i = 1; i < path.length; i++) {
        totalCost += getMovementCost(path[i-1].x, path[i-1].y, path[i].x, path[i].y);
    }

    if (totalCost > unit.tu.current) {
        setMessage('Not enough TU!');
        return false;
    }

    // Create footstep dust along the path
    const isSoldier = unit.type === 'soldier';
    for (let i = 0; i < path.length; i++) {
        // Delay dust creation for animation feel
        setTimeout(() => {
            createFootstepDust(path[i].x, path[i].y, isSoldier);
        }, i * 50);  // 50ms between each step
    }

    map[unit.y][unit.x].unit = null;
    unit.tu.current -= totalCost;
    unit.x = path[path.length - 1].x;
    unit.y = path[path.length - 1].y;
    map[unit.y][unit.x].unit = unit;

    if (path.length >= 2) {
        unit.facing = getFacing(path[path.length - 2].x, path[path.length - 2].y, unit.x, unit.y);
    }

    updateVisibility();
    if (unit.type === 'soldier') checkReactionFire(unit, totalCost);
    // Overwatch fire when aliens move
    if (unit.type === 'alien') checkOverwatchFire(unit);
    return true;
}

function checkReactionFire(movingUnit, tuSpent) {
    const enemies = movingUnit.type === 'soldier' ? aliens : soldiers;
    for (let enemy of enemies) {
        if (!enemy.isAlive || (enemy.type === 'alien' && !enemy.spotted)) continue;
        if (!hasLineOfSight(enemy.x, enemy.y, movingUnit.x, movingUnit.y)) continue;

        const reactionScore = enemy.reactions * enemy.tu.current;
        const targetScore = movingUnit.reactions * tuSpent;

        if (reactionScore > targetScore && enemy.tu.current >= 15 && enemy.weapon.currentAmmo > 0) {
            setMessage(`${enemy.name} reaction fire!`);
            fireWeapon(enemy, movingUnit, 'snap');
        }
    }
}

// Overwatch fire - soldiers on overwatch fire at moving aliens
function checkOverwatchFire(movingAlien) {
    if (!movingAlien.isAlive) return;

    for (let soldier of soldiers) {
        if (!soldier.isAlive || !soldier.overwatch) continue;
        if (!hasLineOfSight(soldier.x, soldier.y, movingAlien.x, movingAlien.y)) continue;
        if (soldier.weapon.currentAmmo <= 0) continue;

        // Overwatch uses reserved TU for a snap shot
        const snapCost = soldier.weapon.snapTU;
        if (soldier.tu.current >= snapCost) {
            setMessage(`${soldier.name} OVERWATCH FIRE!`);
            createFloatingText(
                toIso(soldier.x, soldier.y).x,
                toIso(soldier.x, soldier.y).y - 30,
                'OVERWATCH!', '#ffaa00'
            );
            fireWeapon(soldier, movingAlien, 'snap');
            // Cancel overwatch after firing (one shot per overwatch)
            soldier.overwatch = false;
            // Check if alien is killed
            if (!movingAlien.isAlive) {
                checkGameEnd();
                return;
            }
        }
    }
}

function setMessage(msg) {
    game.message = msg;
    game.messageTimer = 180;
}

function endTurn() {
    // Decay smoke at the end of each full turn
    if (game.turn === 'enemy') {
        for (let smoke of game.smoke) {
            smoke.density -= 1;
            smoke.turnsLeft--;
        }
        // Remove dissipated smoke
        game.smoke = game.smoke.filter(s => s.density > 0 && s.turnsLeft > 0);
    }

    if (game.turn === 'player') {
        game.turn = 'enemy';
        game.turnFlash = 1;
        game.turnFlashColor = '#ff2222'; // Red flash for alien turn
        setMessage('Alien Activity...');
        // Big floating turn announcement
        createFloatingText(canvas.width / 2, GAME_HEIGHT / 2, 'ALIEN TURN', '#ff4444');
        for (let a of aliens) {
            if (a.isAlive) a.tu.current = a.tu.base;
        }
        setTimeout(runAlienTurn, 500);
    } else {
        game.turn = 'player';
        game.turnNumber++;
        game.turnFlash = 1;
        game.turnFlashColor = '#22ff22'; // Green flash for player turn
        setMessage('Your Turn - Turn ' + game.turnNumber);
        // Big floating turn announcement
        createFloatingText(canvas.width / 2, GAME_HEIGHT / 2, 'YOUR TURN ' + game.turnNumber, '#44ff44');
        for (let s of soldiers) {
            if (s.isAlive) {
                s.tu.current = s.tu.base;
                s.overwatch = false;  // Reset overwatch each turn
            }
        }
        updateVisibility();
    }
}

function runAlienTurn() {
    const livingAliens = aliens.filter(a => a.isAlive);
    let alienIndex = 0;

    function processNextAlien() {
        if (alienIndex >= livingAliens.length) {
            endTurn();
            return;
        }

        const alien = livingAliens[alienIndex];
        let nearestSoldier = null;
        let nearestDist = Infinity;

        for (let s of soldiers) {
            if (!s.isAlive) continue;
            if (hasLineOfSight(alien.x, alien.y, s.x, s.y)) {
                const d = distance(alien.x, alien.y, s.x, s.y);
                if (d < nearestDist) {
                    nearestDist = d;
                    nearestSoldier = s;
                }
            }
        }

        if (nearestSoldier) {
            // If damaged, try to find cover first
            const healthPercent = alien.health.current / alien.health.base;
            if (healthPercent < 0.6 && alien.tu.current >= 8) {
                // Find nearby tile with cover
                let bestCover = null;
                let bestCoverDist = Infinity;
                for (let dy = -3; dy <= 3; dy++) {
                    for (let dx = -3; dx <= 3; dx++) {
                        const nx = alien.x + dx, ny = alien.y + dy;
                        if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
                        const tile = map[ny][nx];
                        if (tile.terrain.cover !== 'none' && tile.terrain.walkable && !tile.unit) {
                            const d = Math.abs(dx) + Math.abs(dy);
                            if (d < bestCoverDist) {
                                bestCoverDist = d;
                                bestCover = { x: nx, y: ny };
                            }
                        }
                    }
                }
                if (bestCover) {
                    const coverPath = findPath(alien.x, alien.y, bestCover.x, bestCover.y);
                    if (coverPath && coverPath.length > 1) {
                        const maxMove = Math.min(coverPath.length - 1, Math.floor(alien.tu.current / 4));
                        if (maxMove > 0) moveUnit(alien, coverPath.slice(0, maxMove + 1));
                    }
                }
            }

            if (nearestDist <= 10 && alien.tu.current >= 15) {
                fireWeapon(alien, nearestSoldier, 'snap');
            } else if (alien.tu.current >= 4) {
                const path = findPath(alien.x, alien.y, nearestSoldier.x, nearestSoldier.y);
                if (path && path.length > 1) {
                    const maxMove = Math.min(path.length - 1, Math.floor(alien.tu.current / 4));
                    if (maxMove > 0) {
                        moveUnit(alien, path.slice(0, maxMove + 1));
                    }
                }
                if (hasLineOfSight(alien.x, alien.y, nearestSoldier.x, nearestSoldier.y) &&
                    distance(alien.x, alien.y, nearestSoldier.x, nearestSoldier.y) <= 12 &&
                    alien.tu.current >= 15) {
                    fireWeapon(alien, nearestSoldier, 'snap');
                }
            }
        } else {
            const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            const path = findPath(alien.x, alien.y, alien.x + dir[0] * 2, alien.y + dir[1] * 2);
            if (path) moveUnit(alien, path);
        }

        alienIndex++;
        setTimeout(processNextAlien, 300);
    }

    processNextAlien();
}

function checkGameEnd() {
    const livingSoldiers = soldiers.filter(s => s.isAlive);
    const livingAliens = aliens.filter(a => a.isAlive);

    if (livingSoldiers.length === 0) {
        game.state = 'gameover';
        setMessage('MISSION FAILED - All soldiers killed!');
    } else if (livingAliens.length === 0) {
        game.state = 'victory';
        setMessage('MISSION COMPLETE - Area secured!');
    }
}

// DRAWING FUNCTIONS - X-COM Authentic Style

function getTileColor(terrain, visible) {
    const dark = visible ? 0 : -40;
    switch(terrain.type) {
        case 'grass': return shadeColor(COLORS.GRASS_LIGHT, dark);
        case 'grass_dark': return shadeColor(COLORS.GRASS_DARK, dark);
        case 'dirt': return shadeColor(COLORS.DIRT, dark);
        case 'road': return shadeColor(COLORS.ROAD, dark);
        case 'wall': return shadeColor(COLORS.WALL_LIGHT, dark);
        case 'wall_brick': return shadeColor(COLORS.WALL_BRICK, dark);
        case 'fence': return shadeColor(COLORS.FENCE, dark);
        case 'bush': return shadeColor(COLORS.GRASS_DARK, dark);
        case 'water': return shadeColor(COLORS.WATER, dark);
        case 'flowers': return shadeColor(COLORS.GRASS_LIGHT, dark);
        default: return shadeColor(COLORS.GRASS_LIGHT, dark);
    }
}

function drawIsometricTile(x, y, color, outlined = false) {
    const pos = toIso(x, y);
    const px = pos.x + game.cameraX;
    const py = pos.y + game.cameraY;

    ctx.beginPath();
    ctx.moveTo(px, py - TILE_HEIGHT / 2);
    ctx.lineTo(px + TILE_WIDTH / 2, py);
    ctx.lineTo(px, py + TILE_HEIGHT / 2);
    ctx.lineTo(px - TILE_WIDTH / 2, py);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    if (outlined) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.stroke();
    } else {
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// For pulsing effect
let pulseTime = 0;
setInterval(() => { pulseTime = (pulseTime + 0.1) % (Math.PI * 2); }, 50);

function drawUnit(unit) {
    if (!unit.isAlive) return;
    if (unit.type === 'alien' && !unit.spotted) return;

    const pos = toIso(unit.x, unit.y);
    let px = pos.x + game.cameraX;
    let py = pos.y + game.cameraY;
    const isSelected = game.selectedUnit === unit;
    const bodyHeight = unit.stance === 'kneeling' ? 14 : 22;

    // Low morale shaking effect
    if (unit.type === 'soldier' && unit.morale < 40) {
        const shakeIntensity = (40 - unit.morale) / 40 * 3;
        px += (Math.random() - 0.5) * shakeIntensity;
        py += (Math.random() - 0.5) * shakeIntensity;
    }

    // Pulsing selection ring for selected unit
    if (isSelected) {
        const pulse = 0.5 + Math.sin(pulseTime * 3) * 0.5;
        ctx.strokeStyle = `rgba(255, 255, 100, ${0.4 + pulse * 0.6})`;
        ctx.lineWidth = 2 + pulse;
        ctx.beginPath();
        ctx.ellipse(px, py - 5, 16 + pulse * 3, 10 + pulse * 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
    }

    // Reserve TU indicator (eye icon when has enough for reaction)
    if (unit.type === 'soldier' && unit.tu.current >= 25) {
        ctx.fillStyle = 'rgba(255, 255, 100, 0.7)';
        ctx.beginPath();
        ctx.ellipse(px + 12, py - bodyHeight - 3, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(px + 12, py - bodyHeight - 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Kneeling indicator (down arrow)
    if (unit.type === 'soldier' && unit.stance === 'kneeling') {
        ctx.fillStyle = '#88ff88';
        ctx.beginPath();
        ctx.moveTo(px - 12, py - bodyHeight - 8);
        ctx.lineTo(px - 8, py - bodyHeight - 8);
        ctx.lineTo(px - 10, py - bodyHeight - 3);
        ctx.closePath();
        ctx.fill();
    }

    // Overwatch indicator (crosshairs icon)
    if (unit.type === 'soldier' && unit.overwatch) {
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        // Pulsing effect for overwatch
        const owPulse = 0.6 + Math.sin(pulseTime * 4) * 0.4;
        ctx.globalAlpha = owPulse;
        // Crosshairs
        const owX = px;
        const owY = py - bodyHeight - 15;
        const owSize = 8;
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(owX - owSize, owY);
        ctx.lineTo(owX + owSize, owY);
        ctx.stroke();
        // Vertical line
        ctx.beginPath();
        ctx.moveTo(owX, owY - owSize);
        ctx.lineTo(owX, owY + owSize);
        ctx.stroke();
        // Circle
        ctx.beginPath();
        ctx.arc(owX, owY, owSize - 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
    }

    // Health bar above unit (only if damaged)
    const healthPercent = unit.health.current / unit.health.base;
    if (healthPercent < 1) {
        const barWidth = 20;
        const barHeight = 3;
        const barY = py - bodyHeight - 8;

        // Background
        ctx.fillStyle = '#441111';
        ctx.fillRect(px - barWidth/2, barY, barWidth, barHeight);

        // Health
        const healthColor = healthPercent > 0.5 ? '#44cc44' : (healthPercent > 0.25 ? '#cccc44' : '#cc4444');
        ctx.fillStyle = healthColor;
        ctx.fillRect(px - barWidth/2, barY, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.strokeRect(px - barWidth/2, barY, barWidth, barHeight);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(px, py + 2, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (unit.type === 'soldier') {
        // Enhanced X-COM style soldier with detailed power armor
        const woundedRatio = unit.health.current / unit.health.base;
        let armorColor = isSelected ? COLORS.SOLDIER_ARMOR_LIGHT : COLORS.SOLDIER_ARMOR;

        // Wounded soldiers have darker, redder armor
        if (woundedRatio < 0.5) {
            armorColor = '#884444'; // Critical - red tint
        } else if (woundedRatio < 0.75) {
            armorColor = '#557766'; // Wounded - greenish
        }
        const armorDark = shadeColor(armorColor, -25);
        const armorLight = shadeColor(armorColor, 25);

        // Boots
        ctx.fillStyle = '#222233';
        ctx.fillRect(px - 6, py - 3, 5, 4);
        ctx.fillRect(px + 1, py - 3, 5, 4);

        // Legs with armor plating
        ctx.fillStyle = armorDark;
        ctx.fillRect(px - 5, py - 10, 4, 8);
        ctx.fillRect(px + 1, py - 10, 4, 8);
        // Knee pads
        ctx.fillStyle = armorLight;
        ctx.fillRect(px - 5, py - 7, 4, 2);
        ctx.fillRect(px + 1, py - 7, 4, 2);

        // Body/Torso armor with segments
        ctx.fillStyle = armorColor;
        ctx.beginPath();
        ctx.moveTo(px - 8, py - 10);
        ctx.lineTo(px + 8, py - 10);
        ctx.lineTo(px + 7, py - bodyHeight);
        ctx.lineTo(px - 7, py - bodyHeight);
        ctx.closePath();
        ctx.fill();

        // Chest plate highlight
        ctx.fillStyle = armorLight;
        ctx.fillRect(px - 6, py - bodyHeight + 2, 5, 6);
        // Armor shadow
        ctx.fillStyle = armorDark;
        ctx.fillRect(px + 1, py - bodyHeight + 2, 5, 6);

        // Belt/waist
        ctx.fillStyle = '#333';
        ctx.fillRect(px - 7, py - 11, 14, 2);

        // Shoulder pads
        ctx.fillStyle = armorColor;
        ctx.beginPath();
        ctx.arc(px - 9, py - bodyHeight + 3, 4, 0, Math.PI * 2);
        ctx.arc(px + 9, py - bodyHeight + 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = armorLight;
        ctx.beginPath();
        ctx.arc(px - 9, py - bodyHeight + 2, 2, 0, Math.PI * 2);
        ctx.arc(px + 9, py - bodyHeight + 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Neck
        ctx.fillStyle = '#445566';
        ctx.fillRect(px - 3, py - bodyHeight - 2, 6, 3);

        // Helmet (more detailed)
        ctx.fillStyle = COLORS.SOLDIER_HELMET;
        ctx.beginPath();
        ctx.arc(px, py - bodyHeight - 6, 7, 0, Math.PI * 2);
        ctx.fill();
        // Helmet rim
        ctx.fillStyle = '#222233';
        ctx.beginPath();
        ctx.arc(px, py - bodyHeight - 6, 7, 0.3, Math.PI - 0.3);
        ctx.fill();

        // Visor (blue glow with shine)
        ctx.fillStyle = COLORS.SOLDIER_VISOR;
        ctx.fillRect(px - 5, py - bodyHeight - 8, 10, 4);
        ctx.fillStyle = '#ddeeff';
        ctx.fillRect(px - 4, py - bodyHeight - 7, 3, 2);

        // Weapon (detailed rifle)
        ctx.fillStyle = '#333';
        ctx.fillRect(px + 6, py - bodyHeight + 5, 12, 3);
        ctx.fillStyle = '#555';
        ctx.fillRect(px + 14, py - bodyHeight + 1, 3, 10);
        ctx.fillStyle = '#666';
        ctx.fillRect(px + 6, py - bodyHeight + 3, 4, 2);

        // Backpack
        ctx.fillStyle = armorDark;
        ctx.fillRect(px - 2, py - bodyHeight + 1, 4, 6);

    } else {
        // Enhanced Alien (Sectoid or Floater)
        const skinColor = unit.alienType === 'sectoid' ? COLORS.SECTOID_SKIN : COLORS.FLOATER_SKIN;
        const darkColor = unit.alienType === 'sectoid' ? COLORS.SECTOID_DARK : COLORS.FLOATER_DARK;
        const lightColor = shadeColor(skinColor, 20);

        if (unit.alienType === 'sectoid') {
            // Sectoid - grey humanoid with huge head
            // Thin body
            ctx.fillStyle = darkColor;
            ctx.fillRect(px - 4, py - 10, 8, 10);
            // Body highlight
            ctx.fillStyle = skinColor;
            ctx.fillRect(px - 3, py - 9, 3, 8);

            // Thin arms
            ctx.fillStyle = skinColor;
            ctx.fillRect(px - 8, py - 12, 3, 8);
            ctx.fillRect(px + 5, py - 12, 3, 8);

            // Huge alien head (oversized)
            ctx.fillStyle = skinColor;
            ctx.beginPath();
            ctx.ellipse(px, py - 20, 10, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            // Head highlight
            ctx.fillStyle = lightColor;
            ctx.beginPath();
            ctx.ellipse(px - 3, py - 24, 5, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Large black almond eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(px - 5, py - 20, 5, 6, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(px + 5, py - 20, 5, 6, 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Eye shine
            ctx.fillStyle = '#333355';
            ctx.beginPath();
            ctx.ellipse(px - 6, py - 22, 2, 2, 0, 0, Math.PI * 2);
            ctx.ellipse(px + 4, py - 22, 2, 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Small mouth slit
            ctx.fillStyle = darkColor;
            ctx.fillRect(px - 2, py - 13, 4, 1);

            // Plasma pistol
            ctx.fillStyle = '#336633';
            ctx.fillRect(px + 6, py - 14, 6, 3);
            ctx.fillStyle = COLORS.PLASMA_GREEN;
            ctx.fillRect(px + 10, py - 13, 2, 1);

        } else {
            // Floater - brown cyborg alien
            // Mechanical lower body
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.ellipse(px, py - 4, 8, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Jets/thrusters
            ctx.fillStyle = '#666';
            ctx.fillRect(px - 6, py - 2, 4, 4);
            ctx.fillRect(px + 2, py - 2, 4, 4);
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(px - 5, py + 1, 2, 2);
            ctx.fillRect(px + 3, py + 1, 2, 2);

            // Organic torso
            ctx.fillStyle = skinColor;
            ctx.beginPath();
            ctx.ellipse(px, py - 12, 6, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Arms with armor
            ctx.fillStyle = darkColor;
            ctx.fillRect(px - 10, py - 16, 4, 10);
            ctx.fillRect(px + 6, py - 16, 4, 10);

            // Head
            ctx.fillStyle = skinColor;
            ctx.beginPath();
            ctx.ellipse(px, py - 22, 6, 7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Face mask/implant
            ctx.fillStyle = '#555';
            ctx.fillRect(px - 5, py - 22, 10, 4);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(px - 3, py - 21, 2, 2);
            ctx.fillRect(px + 1, py - 21, 2, 2);
        }
    }

    // Selection arrow (yellow pulsing)
    if (isSelected) {
        const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(255, 255, 0, ${pulse})`;
        ctx.beginPath();
        ctx.moveTo(px, py - bodyHeight - 20);
        ctx.lineTo(px - 7, py - bodyHeight - 13);
        ctx.lineTo(px + 7, py - bodyHeight - 13);
        ctx.closePath();
        ctx.fill();
        // Arrow outline
        ctx.strokeStyle = '#aa8800';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Health bar for damaged units
    if (unit.health.current < unit.health.base) {
        const healthPct = unit.health.current / unit.health.base;
        ctx.fillStyle = '#400';
        ctx.fillRect(px - 12, py - bodyHeight - 28, 24, 5);
        const healthColor = healthPct > 0.5 ? '#0c0' : healthPct > 0.25 ? '#cc0' : '#c00';
        ctx.fillStyle = healthColor;
        ctx.fillRect(px - 12, py - bodyHeight - 28, 24 * healthPct, 5);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(px - 12, py - bodyHeight - 28, 24, 5);
    }
}

function drawMap() {
    // Draw tiles back to front
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map[y][x];

            if (!tile.explored) {
                drawIsometricTile(x, y, '#0a0a0a');
                continue;
            }

            const color = getTileColor(tile.terrain, tile.visible);
            const isHovered = game.hoveredTile && game.hoveredTile.x === x && game.hoveredTile.y === y;
            drawIsometricTile(x, y, color, isHovered);

            const pos = toIso(x, y);
            const px = pos.x + game.cameraX;
            const py = pos.y + game.cameraY;

            // Draw walls with height
            if (tile.terrain === TERRAIN.WALL || tile.terrain === TERRAIN.WALL_BRICK) {
                const wallColor = tile.visible ?
                    (tile.terrain === TERRAIN.WALL_BRICK ? COLORS.WALL_BRICK : COLORS.WALL_LIGHT) :
                    shadeColor(tile.terrain === TERRAIN.WALL_BRICK ? COLORS.WALL_BRICK : COLORS.WALL_LIGHT, -40);

                // Wall front
                ctx.fillStyle = wallColor;
                ctx.beginPath();
                ctx.moveTo(px - TILE_WIDTH/2, py);
                ctx.lineTo(px, py + TILE_HEIGHT/2);
                ctx.lineTo(px, py - 18);
                ctx.lineTo(px - TILE_WIDTH/2, py - 18 - TILE_HEIGHT/2);
                ctx.closePath();
                ctx.fill();

                // Wall side
                ctx.fillStyle = shadeColor(wallColor, -20);
                ctx.beginPath();
                ctx.moveTo(px, py + TILE_HEIGHT/2);
                ctx.lineTo(px + TILE_WIDTH/2, py);
                ctx.lineTo(px + TILE_WIDTH/2, py - 18);
                ctx.lineTo(px, py - 18 + TILE_HEIGHT/2);
                ctx.closePath();
                ctx.fill();

                // Wall top
                ctx.fillStyle = shadeColor(wallColor, 10);
                ctx.beginPath();
                ctx.moveTo(px, py - 18 - TILE_HEIGHT/2);
                ctx.lineTo(px + TILE_WIDTH/2, py - 18);
                ctx.lineTo(px, py - 18 + TILE_HEIGHT/2);
                ctx.lineTo(px - TILE_WIDTH/2, py - 18);
                ctx.closePath();
                ctx.fill();
            }

            // Draw cover indicator on tiles with cover
            if (tile.visible && tile.terrain.cover !== 'none' &&
                tile.terrain !== TERRAIN.WALL && tile.terrain !== TERRAIN.WALL_BRICK) {
                const coverColor = tile.terrain.cover === 'full' ? '#4488ff' : '#88aaff';
                ctx.fillStyle = coverColor;
                ctx.globalAlpha = 0.6;
                // Small shield icon
                ctx.beginPath();
                ctx.moveTo(px - 5, py - 3);
                ctx.lineTo(px + 5, py - 3);
                ctx.lineTo(px + 5, py + 2);
                ctx.lineTo(px, py + 6);
                ctx.lineTo(px - 5, py + 2);
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // Draw bushes
            if (tile.terrain === TERRAIN.BUSH && tile.visible) {
                ctx.fillStyle = COLORS.BUSH_LIGHT;
                ctx.beginPath();
                ctx.arc(px, py - 8, 7, 0, Math.PI * 2);
                ctx.arc(px - 5, py - 5, 5, 0, Math.PI * 2);
                ctx.arc(px + 5, py - 5, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = COLORS.BUSH_DARK;
                ctx.beginPath();
                ctx.arc(px - 2, py - 6, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw flowers (orange like in reference)
            if (tile.terrain === TERRAIN.FLOWERS && tile.visible) {
                ctx.fillStyle = '#ff8844';
                for (let i = 0; i < 4; i++) {
                    const fx = px + (Math.random() - 0.5) * 12;
                    const fy = py - 2 + (Math.random() - 0.5) * 4;
                    ctx.beginPath();
                    ctx.arc(fx, fy, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Draw fence
            if (tile.terrain === TERRAIN.FENCE && tile.visible) {
                ctx.fillStyle = COLORS.FENCE;
                // Posts
                ctx.fillRect(px - 6, py - 14, 2, 14);
                ctx.fillRect(px + 4, py - 14, 2, 14);
                // Rails
                ctx.fillStyle = '#e8d4b2';
                ctx.fillRect(px - 6, py - 12, 12, 2);
                ctx.fillRect(px - 6, py - 6, 12, 2);
            }
        }
    }

    // Draw decorations (lamp posts, crates, debris)
    for (let dec of decorations) {
        if (!map[dec.y] || !map[dec.y][dec.x] || !map[dec.y][dec.x].visible) continue;

        const pos = toIso(dec.x, dec.y);
        const px = pos.x + game.cameraX;
        const py = pos.y + game.cameraY;

        if (dec.type === 'lamppost') {
            // Lamp post pole
            ctx.fillStyle = '#444455';
            ctx.fillRect(px - 2, py - 45, 4, 45);
            // Lamp arm
            ctx.fillRect(px - 2, py - 45, 12, 3);
            // Lamp head
            ctx.fillStyle = '#666677';
            ctx.fillRect(px + 6, py - 48, 8, 6);

            // Flickering light effect
            const flicker = 0.7 + Math.sin(pulseTime * 5 + dec.x * 10) * 0.3;
            const glowSize = 15 + Math.sin(pulseTime * 7 + dec.y * 5) * 3;

            // Light glow (flickering)
            ctx.fillStyle = `rgba(255,255,200,${0.2 + flicker * 0.15})`;
            ctx.beginPath();
            ctx.arc(px + 10, py - 42, glowSize, 0, Math.PI * 2);
            ctx.fill();
            // Actual lamp light
            ctx.fillStyle = `rgba(255,255,${180 + flicker * 75},${0.8 + flicker * 0.2})`;
            ctx.fillRect(px + 7, py - 42, 6, 3);
        }

        if (dec.type === 'crate') {
            // Wooden crate
            ctx.fillStyle = '#8b6914';
            ctx.fillRect(px - 8, py - 16, 16, 16);
            // Crate top (lighter)
            ctx.fillStyle = '#a07818';
            ctx.beginPath();
            ctx.moveTo(px - 8, py - 16);
            ctx.lineTo(px, py - 20);
            ctx.lineTo(px + 12, py - 16);
            ctx.lineTo(px + 4, py - 12);
            ctx.closePath();
            ctx.fill();
            // Side panel
            ctx.fillStyle = '#735a10';
            ctx.fillRect(px + 4, py - 12, 4, 12);
            // Metal bands
            ctx.fillStyle = '#555';
            ctx.fillRect(px - 8, py - 14, 16, 2);
            ctx.fillRect(px - 8, py - 6, 16, 2);
        }

        if (dec.type === 'debris') {
            // Scattered rubble/debris
            ctx.fillStyle = '#555';
            ctx.fillRect(px - 6, py - 4, 8, 4);
            ctx.fillStyle = '#666';
            ctx.fillRect(px + 2, py - 6, 6, 6);
            ctx.fillStyle = '#444';
            ctx.fillRect(px - 8, py - 2, 5, 3);
            // Some brown dirt
            ctx.fillStyle = '#5a4a2a';
            ctx.beginPath();
            ctx.arc(px - 2, py - 1, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw path preview
    if (game.previewPath && game.previewPath.length > 1) {
        const canAfford = game.selectedUnit && game.previewTUCost <= game.selectedUnit.stats.tu.current;
        const pathColor = canAfford ? 'rgba(100, 200, 100, 0.4)' : 'rgba(200, 100, 100, 0.4)';

        for (let i = 1; i < game.previewPath.length; i++) {
            const node = game.previewPath[i];
            const pos = toIso(node.x, node.y);
            const px = pos.x + game.cameraX;
            const py = pos.y + game.cameraY;

            // Draw path highlight
            ctx.fillStyle = pathColor;
            ctx.beginPath();
            ctx.moveTo(px, py - TILE_HEIGHT / 2);
            ctx.lineTo(px + TILE_WIDTH / 2, py);
            ctx.lineTo(px, py + TILE_HEIGHT / 2);
            ctx.lineTo(px - TILE_WIDTH / 2, py);
            ctx.closePath();
            ctx.fill();
        }

        // Draw TU cost at destination
        if (game.hoveredTile) {
            const destPos = toIso(game.hoveredTile.x, game.hoveredTile.y);
            const dpx = destPos.x + game.cameraX;
            const dpy = destPos.y + game.cameraY;
            ctx.fillStyle = canAfford ? '#88ff88' : '#ff8888';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${game.previewTUCost} TU`, dpx, dpy - 20);
            ctx.textAlign = 'left';
        }
    }

    // Draw smoke clouds
    for (let smoke of game.smoke) {
        const pos = toIso(smoke.x, smoke.y);
        const px = pos.x + game.cameraX;
        const py = pos.y + game.cameraY;

        // Animated smoke effect
        const smokeAnim = Math.sin(pulseTime * 2 + smoke.x + smoke.y) * 3;

        // Multiple smoke particles for volume effect
        for (let i = 0; i < smoke.density; i++) {
            const offsetX = (Math.sin(pulseTime * (i + 1) + smoke.x) * 5);
            const offsetY = (Math.cos(pulseTime * (i + 1) + smoke.y) * 3) - i * 2;
            const size = 8 + Math.sin(pulseTime + i) * 2;
            const alpha = (smoke.density / 5) * 0.3 * (1 - i * 0.15);

            ctx.fillStyle = `rgba(180, 180, 180, ${alpha})`;
            ctx.beginPath();
            ctx.arc(px + offsetX, py - 5 + offsetY + smokeAnim, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw smoke density indicator on tile
        ctx.fillStyle = `rgba(100, 100, 100, ${smoke.density * 0.1})`;
        ctx.beginPath();
        ctx.moveTo(px, py - 8);
        ctx.lineTo(px + TILE_WIDTH / 2, py);
        ctx.lineTo(px, py + 8);
        ctx.lineTo(px - TILE_WIDTH / 2, py);
        ctx.closePath();
        ctx.fill();
    }

    // Draw units
    const allUnits = [...soldiers, ...aliens].filter(u => u.isAlive).sort((a, b) => (a.x + a.y) - (b.x + b.y));
    for (let unit of allUnits) {
        drawUnit(unit);
    }

    // Draw hit chance display over targeted alien
    if (game.targetedAlien && game.selectedUnit) {
        const alien = game.targetedAlien;
        const pos = toIso(alien.x, alien.y);
        const px = pos.x + game.cameraX;
        const py = pos.y + game.cameraY;

        const hasLOS = hasLineOfSight(game.selectedUnit.x, game.selectedUnit.y, alien.x, alien.y);
        if (hasLOS) {
            // Draw targeting line from soldier to alien
            const soldierPos = toIso(game.selectedUnit.x, game.selectedUnit.y);
            const spx = soldierPos.x + game.cameraX;
            const spy = soldierPos.y + game.cameraY - 16;

            // Pulsing targeting line
            const targetPulse = 0.5 + Math.sin(pulseTime * 6) * 0.3;
            ctx.strokeStyle = `rgba(255, 100, 100, ${targetPulse})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(spx, spy);
            ctx.lineTo(px, py - 16);
            ctx.stroke();
            ctx.setLineDash([]);  // Reset line dash

            // Small crosshair at target
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px - 8, py - 16);
            ctx.lineTo(px + 8, py - 16);
            ctx.moveTo(px, py - 24);
            ctx.lineTo(px, py - 8);
            ctx.stroke();

            const snapChance = calculateHitChance(game.selectedUnit, alien, 'snap');
            const aimedChance = calculateHitChance(game.selectedUnit, alien, 'aimed');

            // Draw hit chance box
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(px - 45, py - 55, 90, 45);
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 2;
            ctx.strokeRect(px - 45, py - 55, 90, 45);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('HIT CHANCE', px, py - 42);
            ctx.fillStyle = snapChance >= 50 ? '#88ff88' : (snapChance >= 25 ? '#ffff88' : '#ff8888');
            ctx.fillText(`Snap: ${snapChance}%`, px, py - 28);
            ctx.fillStyle = aimedChance >= 50 ? '#88ff88' : (aimedChance >= 25 ? '#ffff88' : '#ff8888');
            ctx.fillText(`Aimed: ${aimedChance}%`, px, py - 14);
            ctx.textAlign = 'left';
        } else {
            // No line of sight indicator
            const noLOSPos = toIso(alien.x, alien.y);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(px - 35, py - 35, 70, 22);
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('NO LOS', px, py - 20);
            ctx.textAlign = 'left';
        }
    }
}

function drawProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.progress += 0.18; // Faster projectile

        if (p.progress >= 1) {
            // Create hit effect when projectile lands
            createHitEffect(p.targetX, p.targetY, p.hit, p.color === COLORS.PLASMA_GREEN);
            projectiles.splice(i, 1);
            continue;
        }

        const x = p.x + (p.targetX - p.x) * p.progress;
        const y = p.y + (p.targetY - p.y) * p.progress;

        // Enhanced trail with segments
        const trailSegments = 7; // Longer trail for more impact
        for (let s = 0; s < trailSegments; s++) {
            const segProgress = Math.max(0, p.progress - s * 0.04);
            const segX = p.x + (p.targetX - p.x) * segProgress;
            const segY = p.y + (p.targetY - p.y) * segProgress;
            const alpha = (1 - s / trailSegments) * 0.6;
            const size = 4 - s * 0.6;

            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(segX, segY, Math.max(1, size), 0, Math.PI * 2);
            ctx.fill();
        }

        // Main projectile with glow
        ctx.globalAlpha = 1;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Bright center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function drawHitEffects() {
    for (let i = hitEffects.length - 1; i >= 0; i--) {
        const effect = hitEffects[i];
        effect.age += 0.05;

        if (effect.age >= 1) {
            hitEffects.splice(i, 1);
            continue;
        }

        for (let p of effect.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3; // gravity
            p.life -= 0.05;

            if (p.life > 0) {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();

                // Glow effect
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
        ctx.globalAlpha = 1;
    }
}

function drawDeathAnimations() {
    for (let i = deathAnimations.length - 1; i >= 0; i--) {
        const d = deathAnimations[i];
        d.life -= 0.015;
        d.y += 0.5; // Slowly fall
        d.rotation += 0.02;

        if (d.life <= 0) {
            deathAnimations.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rotation * (1 - d.life) * 2);
        ctx.globalAlpha = d.life;

        // Draw simplified corpse
        const color = d.type === 'soldier' ? '#446688' : '#888899';
        ctx.fillStyle = color;
        ctx.fillRect(-8, -5, 16, 8);
        ctx.fillStyle = d.type === 'soldier' ? '#ddccaa' : '#555566';
        ctx.beginPath();
        ctx.arc(0, -8, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
    ctx.globalAlpha = 1;
}

function drawExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        exp.life -= 0.05;

        if (exp.life <= 0) {
            explosions.splice(i, 1);
            continue;
        }

        const px = exp.x + game.cameraX;
        const py = exp.y + game.cameraY;
        const size = exp.radius * (1 + (1 - exp.life) * 0.5);

        // Multiple layers for fireball effect
        for (let layer = 3; layer >= 0; layer--) {
            const layerSize = size * (1 - layer * 0.2);
            const alpha = exp.life * (0.3 + layer * 0.2);

            // Color gradient from white -> yellow -> orange -> red
            const colors = ['#ffffff', '#ffff44', '#ff8800', '#ff4400'];
            ctx.fillStyle = colors[layer];
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(px, py - 10, layerSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Debris particles
        for (let j = 0; j < 8; j++) {
            const angle = (j / 8) * Math.PI * 2 + exp.life * 2;
            const dist = size * (1 - exp.life) * 1.5;
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist;
            ctx.fillStyle = '#444';
            ctx.globalAlpha = exp.life * 0.5;
            ctx.fillRect(px + dx - 2, py + dy - 12, 4, 4);
        }

        ctx.globalAlpha = 1;
    }
}

function drawMuzzleFlashes() {
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
        const flash = muzzleFlashes[i];
        flash.life -= 0.15;  // Fast decay

        if (flash.life <= 0) {
            muzzleFlashes.splice(i, 1);
            continue;
        }

        const px = flash.x + game.cameraX;
        const py = flash.y + game.cameraY;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(flash.angle);

        // Draw muzzle flash (cone shape pointing toward target)
        const size = flash.size * flash.life;
        ctx.globalAlpha = flash.life;

        // Outer glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
        gradient.addColorStop(0, flash.isPlasma ? 'rgba(0, 255, 136, 0.8)' : 'rgba(255, 255, 100, 0.8)');
        gradient.addColorStop(0.5, flash.isPlasma ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 200, 50, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Core flash (cone)
        ctx.fillStyle = flash.isPlasma ? '#88ffaa' : '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.3);
        ctx.lineTo(size, 0);
        ctx.lineTo(0, size * 0.3);
        ctx.closePath();
        ctx.fill();

        // Inner bright core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
    ctx.globalAlpha = 1;
}

function drawFootstepDust() {
    for (let i = footstepDust.length - 1; i >= 0; i--) {
        const dust = footstepDust[i];

        // Update position
        dust.x += dust.vx + game.cameraX * 0.01;  // Slight camera follow
        dust.y += dust.vy + game.cameraY * 0.01;
        dust.vy += 0.02;  // Very slow gravity
        dust.life -= 0.03;
        dust.size *= 0.98;  // Shrink over time

        if (dust.life <= 0 || dust.size < 0.5) {
            footstepDust.splice(i, 1);
            continue;
        }

        // Draw dust particle
        ctx.globalAlpha = dust.life * 0.6;
        ctx.fillStyle = dust.color;
        ctx.beginPath();
        ctx.arc(dust.x + game.cameraX, dust.y + game.cameraY, dust.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.vy *= 0.95;
        ft.life -= 0.02;

        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
            continue;
        }

        ctx.globalAlpha = ft.life;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.textAlign = 'left';
    }
    ctx.globalAlpha = 1;
}

function drawUI() {
    // Main UI background - dark blue like X-COM
    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(0, GAME_HEIGHT, canvas.width, UI_HEIGHT);

    // Top border
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT);
    ctx.lineTo(canvas.width, GAME_HEIGHT);
    ctx.stroke();

    // Left panel - Reserve TU indicator
    drawPanel(8, GAME_HEIGHT + 8, 78, 75);

    // R button
    ctx.fillStyle = '#aa4444';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('R', 18, GAME_HEIGHT + 40);

    // TU Reserve colored boxes
    const reserveColors = ['#44aa44', '#4444aa', '#aa8844', '#aa44aa'];
    for (let i = 0; i < 4; i++) {
        const bx = 38 + (i % 2) * 22;
        const by = GAME_HEIGHT + 15 + Math.floor(i / 2) * 28;
        ctx.fillStyle = reserveColors[i];
        ctx.fillRect(bx, by, 18, 18);
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, 18, 18);
    }

    // Action buttons - 4x2 grid like X-COM
    const buttonLabels = ['↑', '⊞', '⚡', '◔', '↓', '↻', '⬆', '■'];
    for (let i = 0; i < 8; i++) {
        const bx = 95 + (i % 4) * 40;
        const by = GAME_HEIGHT + 10 + Math.floor(i / 2) * 38;
        drawButton(bx, by, 36, 32, buttonLabels[i]);
    }

    // Selected unit panel
    if (game.selectedUnit) {
        const unit = game.selectedUnit;

        // Portrait panel with soldier face
        drawPanel(268, GAME_HEIGHT + 8, 55, 55);

        // Draw simple pixel art face based on soldier name hash
        const nameHash = unit.name.charCodeAt(0) + unit.name.charCodeAt(unit.name.length - 1);
        const px = 275;
        const py = GAME_HEIGHT + 15;

        // Helmet
        ctx.fillStyle = '#334455';
        ctx.fillRect(px, py, 40, 35);

        // Visor
        ctx.fillStyle = '#aaccff';
        ctx.fillRect(px + 5, py + 8, 30, 8);

        // Face features based on name hash
        const skinColor = nameHash % 3 === 0 ? '#c4a484' : (nameHash % 3 === 1 ? '#8d5524' : '#e6c8a6');
        ctx.fillStyle = skinColor;
        ctx.fillRect(px + 8, py + 18, 24, 14);

        // Eyes
        ctx.fillStyle = '#333';
        ctx.fillRect(px + 12, py + 21, 4, 4);
        ctx.fillRect(px + 24, py + 21, 4, 4);

        // Health indicator on portrait border
        const healthPercent = unit.health.current / unit.health.base;
        ctx.strokeStyle = healthPercent > 0.5 ? '#44ff44' : (healthPercent > 0.25 ? '#ffaa44' : '#ff4444');
        ctx.lineWidth = 2;
        ctx.strokeRect(271, GAME_HEIGHT + 12, 49, 49);

        // Status icons next to portrait
        let statusY = GAME_HEIGHT + 12;
        if (unit.overwatch) {
            ctx.fillStyle = '#ffaa00';
            ctx.font = '10px monospace';
            ctx.fillText('OW', 322, statusY + 10);
            statusY += 12;
        }
        if (unit.stance === 'kneeling') {
            ctx.fillStyle = '#88ff88';
            ctx.fillText('KN', 322, statusY + 10);
            statusY += 12;
        }
        if (unit.morale < 40) {
            ctx.fillStyle = '#ff4444';
            ctx.fillText('!', 322, statusY + 10);
        }

        // Name panel (moved right) with rank
        drawPanel(340, GAME_HEIGHT + 8, 68, 35);
        const rank = getSoldierRank(unit);
        ctx.fillStyle = rank.color;
        ctx.font = '8px monospace';
        ctx.fillText(rank.name, 345, GAME_HEIGHT + 17);
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px monospace';
        ctx.fillText(unit.name.substring(0, 8), 345, GAME_HEIGHT + 30);

        // Kill count
        ctx.fillStyle = '#ffff88';
        ctx.font = '8px monospace';
        ctx.fillText(`Kills: ${unit.kills}`, 345, GAME_HEIGHT + 40);

        // Stats bars (adjusted position)
        const barX = 340;
        let barY = GAME_HEIGHT + 48;

        // TU Bar (blue)
        drawStatBar(barX, barY, 100, unit.tu.current, unit.tu.base, '#446688', '#5599cc', `${unit.tu.current}`);
        drawStatBar(barX + 52, barY, 48, unit.tu.current, unit.tu.base, '#446688', '#5599cc', `${unit.tu.base}`);

        // Health Bar (green)
        barY += 18;
        drawStatBar(barX, barY, 100, unit.health.current, unit.health.base, '#446644', '#55aa55', `${unit.health.current}`);
        drawStatBar(barX + 52, barY, 48, unit.health.current, unit.health.base, '#446644', '#55aa55', `${unit.health.base}`);

        // Morale Bar (orange)
        barY += 18;
        drawStatBar(barX, barY, 100, unit.morale, 100, '#664422', '#aa8844', `${unit.morale}`);
        drawStatBar(barX + 52, barY, 48, 100, 100, '#664422', '#aa8844', '100');

        // Ammo/Weapon info with visual bar
        const ammoPercent = unit.weapon.currentAmmo / unit.weapon.ammo;
        const ammoBarWidth = 65;
        const ammoBarHeight = 10;
        const ammoBarX = 268;
        const ammoBarY = GAME_HEIGHT + 70;

        // Ammo bar background
        ctx.fillStyle = '#333';
        ctx.fillRect(ammoBarX, ammoBarY, ammoBarWidth, ammoBarHeight);

        // Ammo bar fill - color changes based on ammo level
        let ammoColor = '#88aaff';  // Blue when full
        if (ammoPercent <= 0.25) {
            ammoColor = '#ff4444';  // Red when low
        } else if (ammoPercent <= 0.5) {
            ammoColor = '#ffaa44';  // Orange when half
        }
        ctx.fillStyle = ammoColor;
        ctx.fillRect(ammoBarX, ammoBarY, ammoBarWidth * ammoPercent, ammoBarHeight);

        // Ammo bar border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(ammoBarX, ammoBarY, ammoBarWidth, ammoBarHeight);

        // Draw individual bullet indicators
        for (let i = 0; i < unit.weapon.ammo; i++) {
            const bulletX = ammoBarX + (i * (ammoBarWidth / unit.weapon.ammo)) + 2;
            if (i < unit.weapon.currentAmmo) {
                ctx.fillStyle = '#fff';
            } else {
                ctx.fillStyle = '#444';
            }
            ctx.fillRect(bulletX, ammoBarY + 2, 2, ammoBarHeight - 4);
        }

        // Ammo text
        ctx.fillStyle = '#888888';
        ctx.font = '10px monospace';
        ctx.fillText(`${unit.weapon.currentAmmo}/${unit.weapon.ammo}`, ammoBarX + ammoBarWidth + 5, ammoBarY + 8);

        // Flashing RELOAD warning when empty or low
        if (unit.weapon.currentAmmo === 0) {
            const flash = Math.sin(pulseTime * 6) > 0;
            if (flash) {
                ctx.fillStyle = '#ff0000';
                ctx.font = 'bold 12px monospace';
                ctx.fillText('RELOAD! (R)', ammoBarX, ammoBarY + 24);
            }
        } else if (ammoPercent <= 0.25) {
            ctx.fillStyle = '#ffaa00';
            ctx.font = '10px monospace';
            ctx.fillText('Low ammo', ammoBarX, ammoBarY + 24);
        }

        // Weapon name
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '11px monospace';
        ctx.fillText(`${unit.weapon.name}`, 268, GAME_HEIGHT + 138);
    }

    // Right panel - Minimap
    drawPanel(canvas.width - 88, GAME_HEIGHT + 8, 80, 75);
    // Draw minimap
    const mmX = canvas.width - 85;
    const mmY = GAME_HEIGHT + 12;
    const mmScale = 3.5;

    ctx.fillStyle = '#111';
    ctx.fillRect(mmX, mmY, MAP_WIDTH * mmScale, MAP_HEIGHT * mmScale);

    // Draw terrain
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (!map[y][x].explored) continue;
            const t = map[y][x].terrain;
            if (t === TERRAIN.WALL || t === TERRAIN.WALL_BRICK) {
                ctx.fillStyle = '#555';
            } else if (t === TERRAIN.ROAD || t === TERRAIN.DIRT) {
                ctx.fillStyle = '#333';
            } else {
                ctx.fillStyle = '#243';
            }
            ctx.fillRect(mmX + x * mmScale, mmY + y * mmScale, mmScale, mmScale);
        }
    }

    // Draw soldiers (blue dots)
    for (let s of soldiers) {
        if (!s.isAlive) continue;
        ctx.fillStyle = s === game.selectedUnit ? '#88ffff' : '#4477ff';
        ctx.fillRect(mmX + s.x * mmScale, mmY + s.y * mmScale, mmScale + 1, mmScale + 1);
    }

    // Draw aliens (red dots)
    for (let a of aliens) {
        if (!a.isAlive || !a.spotted) continue;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(mmX + a.x * mmScale, mmY + a.y * mmScale, mmScale + 1, mmScale + 1);
    }

    // Turn indicator with mission objective
    ctx.fillStyle = game.turn === 'player' ? '#44ff44' : '#ff4444';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(game.turn === 'player' ? 'YOUR TURN' : 'ALIEN TURN', 420, GAME_HEIGHT + 18);

    // Mission objective
    ctx.fillStyle = '#ffaa44';
    ctx.font = '10px monospace';
    const totalAliens = aliens.length;
    const killedAliens = totalAliens - aliens.filter(a => a.isAlive).length;
    ctx.fillText(`OBJECTIVE: Eliminate all hostiles`, 420, GAME_HEIGHT + 32);
    ctx.fillStyle = killedAliens === totalAliens ? '#44ff44' : '#aaaaaa';
    ctx.fillText(`Progress: ${killedAliens}/${totalAliens} eliminated`, 420, GAME_HEIGHT + 44);

    ctx.fillStyle = '#888888';
    ctx.font = '10px monospace';
    ctx.fillText(`Turn ${game.turnNumber}`, 520, GAME_HEIGHT + 18);

    // Unit counts
    const livingSoldiers = soldiers.filter(s => s.isAlive).length;
    const livingAliens = aliens.filter(a => a.isAlive && a.spotted).length;
    ctx.fillStyle = '#5588ff';
    ctx.fillText(`Soldiers: ${livingSoldiers}`, 420, GAME_HEIGHT + 60);
    ctx.fillStyle = '#ff5555';
    ctx.fillText(`Known Aliens: ${livingAliens}`, 420, GAME_HEIGHT + 77);

    // Kill counter
    ctx.fillStyle = '#88ff88';
    ctx.fillText(`Kills: ${game.kills.aliens}`, 520, GAME_HEIGHT + 60);
    ctx.fillStyle = '#ff8888';
    ctx.fillText(`Losses: ${game.kills.soldiers}`, 520, GAME_HEIGHT + 77);

    // Combat log (bottom right corner of game area)
    if (game.combatLog.length > 0) {
        let logY = GAME_HEIGHT - 10;
        ctx.font = '10px monospace';
        for (let i = 0; i < Math.min(5, game.combatLog.length); i++) {
            const log = game.combatLog[i];
            const alpha = Math.max(0.3, 1 - i * 0.15);
            ctx.fillStyle = log.color;
            ctx.globalAlpha = alpha;
            ctx.fillText(log.text, 10, logY);
            logY -= 12;
        }
        ctx.globalAlpha = 1;
    }

    // Soldier roster (bottom row quick-select)
    const rosterY = GAME_HEIGHT + 95;
    const rosterWidth = 90;
    ctx.font = '9px monospace';

    for (let i = 0; i < soldiers.length; i++) {
        const s = soldiers[i];
        const rx = 420 + i * rosterWidth;

        // Background panel
        ctx.fillStyle = s === game.selectedUnit ? '#335566' : '#222233';
        ctx.fillRect(rx, rosterY, rosterWidth - 4, 50);

        // Selection indicator
        if (s === game.selectedUnit) {
            ctx.strokeStyle = '#88aaff';
            ctx.lineWidth = 2;
            ctx.strokeRect(rx, rosterY, rosterWidth - 4, 50);
        }

        // Number key
        ctx.fillStyle = s.isAlive ? '#ffff88' : '#666666';
        ctx.font = 'bold 11px monospace';
        ctx.fillText((i + 1).toString(), rx + 3, rosterY + 12);

        // Name
        ctx.font = '9px monospace';
        ctx.fillStyle = s.isAlive ? '#ffffff' : '#666666';
        ctx.fillText(s.name.substring(0, 7), rx + 14, rosterY + 12);

        if (s.isAlive) {
            // Health bar
            const hpPercent = s.health.current / s.health.base;
            ctx.fillStyle = '#333';
            ctx.fillRect(rx + 3, rosterY + 18, rosterWidth - 10, 6);
            ctx.fillStyle = hpPercent > 0.5 ? '#44aa44' : (hpPercent > 0.25 ? '#aaaa44' : '#aa4444');
            ctx.fillRect(rx + 3, rosterY + 18, (rosterWidth - 10) * hpPercent, 6);

            // TU bar
            const tuPercent = s.tu.current / s.tu.base;
            ctx.fillStyle = '#333';
            ctx.fillRect(rx + 3, rosterY + 26, rosterWidth - 10, 6);
            ctx.fillStyle = '#4466aa';
            ctx.fillRect(rx + 3, rosterY + 26, (rosterWidth - 10) * tuPercent, 6);

            // Status icons
            let iconX = rx + 3;
            ctx.font = '8px monospace';
            if (s.overwatch) {
                ctx.fillStyle = '#ffaa00';
                ctx.fillText('OW', iconX, rosterY + 42);
                iconX += 16;
            }
            if (s.stance === 'kneeling') {
                ctx.fillStyle = '#88ff88';
                ctx.fillText('KN', iconX, rosterY + 42);
                iconX += 16;
            }
            if (s.morale < 40) {
                ctx.fillStyle = '#ff4444';
                ctx.fillText('PANIC', iconX, rosterY + 42);
            }
        } else {
            // KIA marker
            ctx.fillStyle = '#aa4444';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('KIA', rx + 30, rosterY + 35);
        }
    }

    // Message
    if (game.messageTimer > 0) {
        ctx.fillStyle = '#ffff00';
        ctx.font = '12px monospace';
        ctx.fillText(game.message, 12, GAME_HEIGHT + 100);
    }

    // Controls with TU costs
    ctx.font = '10px monospace';
    if (game.selectedUnit && game.selectedUnit.type === 'soldier') {
        const w = game.selectedUnit.weapon;
        const snapTU = Math.floor(game.selectedUnit.tu.base * w.snapShot.tuPercent / 100);
        const aimedTU = Math.floor(game.selectedUnit.tu.base * w.aimedShot.tuPercent / 100);
        const autoTU = w.autoShot ? Math.floor(game.selectedUnit.tu.base * w.autoShot.tuPercent / 100) : 0;

        const canSnap = game.selectedUnit.tu.current >= snapTU;
        const canAimed = game.selectedUnit.tu.current >= aimedTU;
        const canAuto = autoTU > 0 && game.selectedUnit.tu.current >= autoTU;

        ctx.fillStyle = canSnap ? '#88ff88' : '#ff5555';
        ctx.fillText(`[S] Snap: ${snapTU} TU`, 12, GAME_HEIGHT + 115);
        ctx.fillStyle = canAimed ? '#88ff88' : '#ff5555';
        ctx.fillText(`[A] Aimed: ${aimedTU} TU`, 100, GAME_HEIGHT + 115);
        ctx.fillStyle = canAuto ? '#88ff88' : '#ff5555';
        ctx.fillText(`[F] Auto: ${autoTU || '--'} TU`, 200, GAME_HEIGHT + 115);
    }

    ctx.fillStyle = '#555555';
    ctx.fillText('Click: Select/Move | K: Kneel | E: End Turn | R: Reload', 12, GAME_HEIGHT + 130);
    ctx.fillText('1-6: Select Soldier | Space: Cycle', 12, GAME_HEIGHT + 145);
}

function drawPanel(x, y, w, h) {
    ctx.fillStyle = COLORS.UI_PANEL;
    ctx.fillRect(x, y, w, h);

    // Highlight (top-left)
    ctx.fillStyle = COLORS.UI_HIGHLIGHT;
    ctx.fillRect(x + 2, y + 2, w - 4, 2);
    ctx.fillRect(x + 2, y + 2, 2, h - 4);

    // Shadow (bottom-right)
    ctx.fillStyle = COLORS.UI_SHADOW;
    ctx.fillRect(x + 2, y + h - 4, w - 4, 2);
    ctx.fillRect(x + w - 4, y + 2, 2, h - 4);
}

function drawButton(x, y, w, h, label) {
    drawPanel(x, y, w, h);
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w/2, y + h/2 + 5);
    ctx.textAlign = 'left';
}

function drawStatBar(x, y, w, current, max, bgColor, fgColor, label) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, 14);
    ctx.fillStyle = fgColor;
    ctx.fillRect(x, y, w * (current / max), 14);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillText(label, x + 4, y + 11);
}

function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// INPUT HANDLING
let keys = {};
canvas.addEventListener('click', handleClick);
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    handleKeyPress(e.key.toLowerCase());
});
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('mousemove', handleMouseMove);

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - game.cameraX;
    const mouseY = e.clientY - rect.top - game.cameraY;
    if (mouseY < GAME_HEIGHT) {
        game.hoveredTile = fromIso(mouseX, mouseY);

        // Calculate path preview if we have a selected soldier
        if (game.selectedUnit && game.selectedUnit.type === 'soldier' &&
            game.hoveredTile.x >= 0 && game.hoveredTile.x < MAP_WIDTH &&
            game.hoveredTile.y >= 0 && game.hoveredTile.y < MAP_HEIGHT &&
            game.turn === 'player' && game.state === 'playing') {

            const path = findPath(game.selectedUnit.x, game.selectedUnit.y, game.hoveredTile.x, game.hoveredTile.y);
            if (path && path.length > 0) {
                // Calculate TU cost
                let tuCost = 0;
                for (let i = 1; i < path.length; i++) {
                    const tile = map[path[i].y][path[i].x];
                    tuCost += tile.terrain.tu;
                }
                game.previewPath = path;
                game.previewTUCost = tuCost;
            } else {
                game.previewPath = null;
                game.previewTUCost = 0;
            }
        } else {
            game.previewPath = null;
            game.previewTUCost = 0;
        }

        // Check if hovering over an alien for hit chance preview
        if (game.selectedUnit && game.selectedUnit.type === 'soldier') {
            const hoveredAlien = aliens.find(a => a.isAlive && a.spotted &&
                a.x === game.hoveredTile.x && a.y === game.hoveredTile.y);
            game.targetedAlien = hoveredAlien || null;
        }
    } else {
        game.hoveredTile = null;
        game.previewPath = null;
        game.previewTUCost = 0;
        game.targetedAlien = null;
    }
}

function handleClick(e) {
    if (game.turn !== 'player' || game.state !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - game.cameraX;
    const mouseY = e.clientY - rect.top - game.cameraY;

    if (mouseY < GAME_HEIGHT - game.cameraY) {
        const tile = fromIso(mouseX, mouseY);

        if (tile.x >= 0 && tile.x < MAP_WIDTH && tile.y >= 0 && tile.y < MAP_HEIGHT) {
            const clickedSoldier = soldiers.find(s => s.isAlive && s.x === tile.x && s.y === tile.y);
            if (clickedSoldier) {
                game.selectedUnit = clickedSoldier;
                setMessage(`Selected ${clickedSoldier.name}`);
                return;
            }

            const clickedAlien = aliens.find(a => a.isAlive && a.spotted && a.x === tile.x && a.y === tile.y);
            if (clickedAlien && game.selectedUnit) {
                if (hasLineOfSight(game.selectedUnit.x, game.selectedUnit.y, clickedAlien.x, clickedAlien.y)) {
                    fireWeapon(game.selectedUnit, clickedAlien, 'snap');
                    checkGameEnd();
                } else {
                    setMessage('No line of sight!');
                }
                return;
            }

            if (game.selectedUnit && game.selectedUnit.type === 'soldier') {
                const path = findPath(game.selectedUnit.x, game.selectedUnit.y, tile.x, tile.y);
                if (path) {
                    moveUnit(game.selectedUnit, path);
                    checkGameEnd();
                } else {
                    setMessage('Cannot move there!');
                }
            }
        }
    }
}

function handleKeyPress(key) {
    // Debug toggle works always
    if (key === 'q') {
        game.debugMode = !game.debugMode;
        return;
    }

    // Help screen toggle works always
    if (key === 'h') {
        game.showHelp = !game.showHelp;
        return;
    }

    // If help is showing, any other key closes it
    if (game.showHelp) {
        game.showHelp = false;
        return;
    }

    // Title screen - press space to start
    if (game.showTitle) {
        if (key === ' ') {
            game.showTitle = false;
            setMessage('Mission begins! Select a soldier (1-6) and move out.');
        }
        return;
    }

    if (game.state !== 'playing') {
        if (key === 'r') initGame();
        return;
    }
    if (game.turn !== 'player') return;

    if (key >= '1' && key <= '6') {
        const idx = parseInt(key) - 1;
        if (soldiers[idx] && soldiers[idx].isAlive) {
            game.selectedUnit = soldiers[idx];
            setMessage(`Selected ${soldiers[idx].name}`);
        }
    }

    if (key === ' ') {
        const livingSoldiers = soldiers.filter(s => s.isAlive);
        if (livingSoldiers.length > 0) {
            const currentIdx = livingSoldiers.indexOf(game.selectedUnit);
            game.selectedUnit = livingSoldiers[(currentIdx + 1) % livingSoldiers.length];
            setMessage(`Selected ${game.selectedUnit.name}`);
        }
    }

    if (!game.selectedUnit) return;

    const shootAtNearest = (shotType) => {
        const visibleAliens = aliens.filter(a => a.isAlive && a.spotted &&
            hasLineOfSight(game.selectedUnit.x, game.selectedUnit.y, a.x, a.y));
        if (visibleAliens.length > 0) {
            const nearest = visibleAliens.reduce((a, b) =>
                distance(game.selectedUnit.x, game.selectedUnit.y, a.x, a.y) <
                distance(game.selectedUnit.x, game.selectedUnit.y, b.x, b.y) ? a : b);
            fireWeapon(game.selectedUnit, nearest, shotType);
            checkGameEnd();
        } else {
            setMessage('No visible targets!');
        }
    };

    if (key === 's') shootAtNearest('snap');
    if (key === 'a') shootAtNearest('aimed');
    if (key === 'f') {
        if (game.selectedUnit.weapon.autoShot) {
            shootAtNearest('auto');
        } else {
            setMessage('Weapon has no auto fire!');
        }
    }

    if (key === 'k') {
        if (game.selectedUnit.stance === 'standing') {
            if (game.selectedUnit.tu.current >= 4) {
                game.selectedUnit.tu.current -= 4;
                game.selectedUnit.stance = 'kneeling';
                setMessage('Kneeling (+15% accuracy)');
            } else setMessage('Not enough TU!');
        } else {
            if (game.selectedUnit.tu.current >= 8) {
                game.selectedUnit.tu.current -= 8;
                game.selectedUnit.stance = 'standing';
                setMessage('Standing up');
            } else setMessage('Not enough TU!');
        }
    }

    // End turn with confirmation if soldiers have TU remaining
    if (key === 'e') {
        const soldiersWithTU = soldiers.filter(s => s.isAlive && s.tu.current >= 20);
        if (soldiersWithTU.length > 0 && !game.endTurnConfirm) {
            game.endTurnConfirm = true;
            setMessage(`${soldiersWithTU.length} soldiers have TU! Press E again to confirm end turn.`);
            setTimeout(() => { game.endTurnConfirm = false; }, 3000);  // Reset after 3 sec
        } else {
            game.endTurnConfirm = false;
            endTurn();
        }
    }

    // Overwatch mode toggle (O key)
    if (key === 'o') {
        const overwatchCost = 20;  // TU cost to enter overwatch
        if (!game.selectedUnit.overwatch) {
            if (game.selectedUnit.tu.current >= overwatchCost) {
                game.selectedUnit.overwatch = true;
                game.selectedUnit.tu.current -= overwatchCost;
                setMessage(game.selectedUnit.name + ' is now on OVERWATCH!');
                createFloatingText(
                    toIso(game.selectedUnit.x, game.selectedUnit.y).x,
                    toIso(game.selectedUnit.x, game.selectedUnit.y).y - 20,
                    'OVERWATCH', '#ffaa00'
                );
            } else {
                setMessage('Need ' + overwatchCost + ' TU for Overwatch!');
            }
        } else {
            game.selectedUnit.overwatch = false;
            setMessage(game.selectedUnit.name + ' cancelled overwatch');
        }
    }

    // Camera controls (arrow keys)
    const camSpeed = 20;
    if (key === 'arrowup') game.cameraY += camSpeed;
    if (key === 'arrowdown') game.cameraY -= camSpeed;
    if (key === 'arrowleft') game.cameraX += camSpeed;
    if (key === 'arrowright') game.cameraX -= camSpeed;

    // Center camera on selected unit (C key)
    if (key === 'c' && game.selectedUnit) {
        const pos = toIso(game.selectedUnit.x, game.selectedUnit.y);
        game.cameraX = canvas.width / 2 - pos.x;
        game.cameraY = GAME_HEIGHT / 2 - pos.y;
        setMessage('Centered on ' + game.selectedUnit.name);
    }

    if (key === 'r') {
        if (game.selectedUnit.tu.current >= 15) {
            game.selectedUnit.tu.current -= 15;
            game.selectedUnit.weapon.currentAmmo = game.selectedUnit.weapon.ammo;
            setMessage('Reloaded!');
        } else setMessage('Not enough TU to reload!');
    }

    // Weapon switch (W key)
    if (key === 'w') {
        if (game.selectedUnit.secondaryWeapon && game.selectedUnit.tu.current >= 10) {
            game.selectedUnit.tu.current -= 10;
            // Swap weapons
            const temp = game.selectedUnit.weapon;
            game.selectedUnit.weapon = game.selectedUnit.secondaryWeapon;
            game.selectedUnit.secondaryWeapon = temp;
            setMessage(`Switched to ${game.selectedUnit.weapon.name}`);
            createFloatingText(
                toIso(game.selectedUnit.x, game.selectedUnit.y).x,
                toIso(game.selectedUnit.x, game.selectedUnit.y).y - 25,
                game.selectedUnit.weapon.name, '#88aaff'
            );
        } else if (!game.selectedUnit.secondaryWeapon) {
            setMessage('No secondary weapon!');
        } else {
            setMessage('Not enough TU to switch weapons!');
        }
    }

    // Smoke grenade (G key) - throw at hovered tile
    if (key === 'g') {
        if (game.hoveredTile && game.hoveredTile.x >= 0 && game.hoveredTile.x < MAP_WIDTH &&
            game.hoveredTile.y >= 0 && game.hoveredTile.y < MAP_HEIGHT) {
            throwSmokeGrenade(game.selectedUnit, game.hoveredTile.x, game.hoveredTile.y);
        } else {
            setMessage('Hover over target tile for smoke!');
        }
    }

    // Frag grenade (T key) - throw explosive at hovered tile
    if (key === 't') {
        if (game.hoveredTile && game.hoveredTile.x >= 0 && game.hoveredTile.x < MAP_WIDTH &&
            game.hoveredTile.y >= 0 && game.hoveredTile.y < MAP_HEIGHT) {
            throwFragGrenade(game.selectedUnit, game.hoveredTile.x, game.hoveredTile.y);
        } else {
            setMessage('Hover over target tile for grenade!');
        }
    }
}

// TITLE SCREEN
function drawTitleScreen() {
    if (!game.showTitle) return;

    // Dark overlay
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Animated background stars
    for (let i = 0; i < 50; i++) {
        const x = (i * 137 + pulseTime * 10) % canvas.width;
        const y = (i * 71) % canvas.height;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(pulseTime + i) * 0.2})`;
        ctx.fillRect(x, y, 2, 2);
    }

    // Title with glow effect
    ctx.textAlign = 'center';
    ctx.font = 'bold 48px monospace';

    // Glow
    ctx.fillStyle = '#224488';
    ctx.fillText('X-COM', canvas.width / 2 + 2, canvas.height / 3 + 2);
    ctx.fillStyle = '#4488ff';
    ctx.fillText('X-COM', canvas.width / 2, canvas.height / 3);

    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#88aaff';
    ctx.fillText('ENEMY UNKNOWN', canvas.width / 2, canvas.height / 3 + 40);

    // Subtitle
    ctx.font = '14px monospace';
    ctx.fillStyle = '#888888';
    ctx.fillText('Canvas 2D Clone', canvas.width / 2, canvas.height / 3 + 70);

    // Instructions
    ctx.font = '16px monospace';
    ctx.fillStyle = '#44ff44';
    const pulse = 0.6 + Math.sin(pulseTime * 3) * 0.4;
    ctx.globalAlpha = pulse;
    ctx.fillText('Press SPACE to begin mission', canvas.width / 2, canvas.height / 2 + 40);
    ctx.globalAlpha = 1;

    // Controls hint
    ctx.font = '12px monospace';
    ctx.fillStyle = '#666666';
    ctx.fillText('Press H for controls during gameplay', canvas.width / 2, canvas.height / 2 + 80);

    // Credits
    ctx.fillStyle = '#444444';
    ctx.font = '10px monospace';
    ctx.fillText('Inspired by MicroProse UFO: Enemy Unknown (1994)', canvas.width / 2, canvas.height - 40);

    ctx.textAlign = 'left';
}

// HELP SCREEN
function drawHelpScreen() {
    if (!game.showHelp) return;

    ctx.save();

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Help box
    const boxWidth = 500;
    const boxHeight = 420;
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = (canvas.height - boxHeight) / 2;

    // Box background
    ctx.fillStyle = '#1a1a3a';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = '#4444aa';
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Title
    ctx.fillStyle = '#88aaff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('X-COM CONTROLS', canvas.width / 2, boxY + 40);

    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#aaaaaa';

    let y = boxY + 75;
    const lineHeight = 22;
    const col1 = boxX + 30;
    const col2 = boxX + 160;

    const controls = [
        ['1-6', 'Select soldier by number'],
        ['SPACE', 'Cycle through soldiers'],
        ['CLICK', 'Move / Select unit'],
        ['', ''],
        ['S', 'Snap shot (quick fire)'],
        ['A', 'Aimed shot (accurate)'],
        ['F', 'Auto fire (if available)'],
        ['R', 'Reload weapon (15 TU)'],
        ['', ''],
        ['K', 'Kneel / Stand toggle'],
        ['O', 'Overwatch mode (20 TU)'],
        ['G', 'Throw smoke grenade (25 TU)'],
        ['E', 'End turn'],
        ['', ''],
        ['ARROWS', 'Move camera'],
        ['C', 'Center camera on unit'],
        ['', ''],
        ['Q', 'Toggle debug overlay'],
        ['H', 'Show/hide this help']
    ];

    for (let control of controls) {
        if (control[0] === '') {
            y += 5;
            continue;
        }
        ctx.fillStyle = '#ffff88';
        ctx.fillText(control[0], col1, y);
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(control[1], col2, y);
        y += lineHeight;
    }

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#666666';
    ctx.fillText('Press any key to close', canvas.width / 2, boxY + boxHeight - 20);

    ctx.restore();
}

// DEBUG OVERLAY
function drawDebugOverlay() {
    if (!game.debugMode) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 260, 220);

    ctx.fillStyle = '#00ff00';
    ctx.font = '14px monospace';
    let y = 30;
    const line = (text) => { ctx.fillText(text, 20, y); y += 18; };

    line('=== DEBUG (Q to close) ===');
    line(`State: ${game.state}`);
    line(`Turn: ${game.turn} #${game.turnNumber}`);
    line(`Soldiers: ${soldiers.filter(s => s.isAlive).length}/${soldiers.length}`);
    line(`Aliens: ${aliens.filter(a => a.isAlive).length}/${aliens.length}`);
    line(`Spotted: ${aliens.filter(a => a.isAlive && a.spotted).length}`);

    if (game.selectedUnit) {
        line(`--- Selected: ${game.selectedUnit.name} ---`);
        line(`Pos: (${game.selectedUnit.x}, ${game.selectedUnit.y})`);
        line(`TU: ${game.selectedUnit.stats.tu.current}/${game.selectedUnit.stats.tu.base}`);
        line(`HP: ${game.selectedUnit.stats.health.current}/${game.selectedUnit.stats.health.base}`);
        line(`Stance: ${game.selectedUnit.stance}`);
    }

    ctx.restore();
}

// GAME LOOP
function gameLoop() {
    // Update screen shake
    updateScreenShake();

    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply screen shake offset
    ctx.save();
    ctx.translate(game.shakeX, game.shakeY);

    drawMap();
    drawFootstepDust();
    drawExplosions();
    drawMuzzleFlashes();
    drawDeathAnimations();
    drawProjectiles();
    drawHitEffects();
    drawFloatingTexts();

    ctx.restore(); // Remove shake for UI

    drawUI();
    drawDebugOverlay();
    drawHelpScreen();
    drawTitleScreen();

    // Draw turn change flash
    if (game.turnFlash > 0) {
        ctx.fillStyle = game.turnFlashColor;
        ctx.globalAlpha = game.turnFlash * 0.3;
        ctx.fillRect(0, 0, canvas.width, GAME_HEIGHT);
        ctx.globalAlpha = 1;
        game.turnFlash -= 0.03;
    }

    if (game.messageTimer > 0) game.messageTimer--;

    if (game.state !== 'playing') {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const isVictory = game.state === 'victory';
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Border box
        ctx.strokeStyle = isVictory ? '#44ff44' : '#ff4444';
        ctx.lineWidth = 3;
        ctx.strokeRect(centerX - 180, centerY - 100, 360, 200);

        // Title
        ctx.fillStyle = isVictory ? '#44ff44' : '#ff4444';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isVictory ? 'MISSION COMPLETE!' : 'MISSION FAILED', centerX, centerY - 60);

        // Stats
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '14px monospace';
        ctx.fillText(`Aliens Eliminated: ${game.kills.aliens}`, centerX, centerY - 20);
        ctx.fillText(`Soldiers Lost: ${game.kills.soldiers}`, centerX, centerY);
        ctx.fillText(`Turns Taken: ${game.turnNumber}`, centerX, centerY + 20);

        // Restart prompt
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('Press R to restart', centerX, centerY + 70);
        ctx.textAlign = 'left';
        ctx.lineWidth = 1;
    }

    requestAnimationFrame(gameLoop);
}

// Expose for testing (use getters for live data)
window.gameState = game;
Object.defineProperty(window, 'soldiers', { get: () => soldiers });
Object.defineProperty(window, 'aliens', { get: () => aliens });

initGame();
gameLoop();
