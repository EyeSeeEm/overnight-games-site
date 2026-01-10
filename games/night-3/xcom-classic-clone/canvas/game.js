// X-COM Classic Clone - Canvas 2D Implementation
// Turn-based tactical strategy game - Authentic X-COM Style

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants - Match classic X-COM dimensions
const TILE_WIDTH = 32;
const TILE_HEIGHT = 16;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 20;
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
    actionMode: 'move'
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
        ammo: 20
    },
    PISTOL: {
        name: 'Pistol',
        damage: 26,
        snapShot: { accuracy: 30, tuPercent: 18 },
        aimedShot: { accuracy: 78, tuPercent: 30 },
        autoShot: null,
        ammo: 12
    },
    PLASMA_PISTOL: {
        name: 'Plasma Pistol',
        damage: 52,
        snapShot: { accuracy: 65, tuPercent: 30 },
        aimedShot: { accuracy: 85, tuPercent: 60 },
        autoShot: null,
        ammo: 26
    }
};

// Generate map - more authentic X-COM terrain
let map = [];
function generateMap() {
    map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            let terrain = Math.random() < 0.5 ? TERRAIN.GRASS : TERRAIN.GRASS_DARK;

            // Road through middle
            if (x >= 9 && x <= 11) {
                terrain = TERRAIN.ROAD;
            }
            // Dirt landing zone
            else if (x >= 1 && x <= 6 && y >= 1 && y <= 6) {
                terrain = TERRAIN.DIRT;
            }
            // Building 1 (brick)
            else if ((x === 14 && y >= 8 && y <= 14) ||
                     (x === 18 && y >= 8 && y <= 14) ||
                     (y === 8 && x >= 14 && x <= 18) ||
                     (y === 14 && x >= 14 && x <= 18)) {
                terrain = TERRAIN.WALL_BRICK;
            }
            // Building interior floor
            else if (x > 14 && x < 18 && y > 8 && y < 14) {
                terrain = TERRAIN.ROAD;
            }
            // Bushes around map
            else if (Math.random() < 0.12 && terrain.type.includes('grass')) {
                terrain = TERRAIN.BUSH;
            }
            // Flowers (orange)
            else if (Math.random() < 0.08 && terrain.type.includes('grass')) {
                terrain = TERRAIN.FLOWERS;
            }
            // Fence along property
            else if (y === 12 && x >= 2 && x <= 7) {
                terrain = TERRAIN.FENCE;
            }

            map[y][x] = {
                terrain: terrain,
                visible: false,
                explored: false,
                unit: null
            };
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
        isAlive: true,
        reserveTU: 0
    };
}

function createAlien(x, y, type = 'sectoid') {
    return {
        type: 'alien',
        alienType: type,
        name: type.charAt(0).toUpperCase() + type.slice(1),
        x: x,
        y: y,
        facing: 6,
        stance: 'standing',
        tu: { base: 54, current: 54 },
        health: { base: type === 'sectoid' ? 30 : 45, current: type === 'sectoid' ? 30 : 45 },
        reactions: 50 + Math.floor(Math.random() * 20),
        firingAccuracy: 50 + Math.floor(Math.random() * 30),
        weapon: { ...WEAPONS.PLASMA_PISTOL, currentAmmo: WEAPONS.PLASMA_PISTOL.ammo },
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
    const alienPositions = [[15, 10], [16, 11], [17, 9], [13, 16], [18, 15]];
    for (let pos of alienPositions) {
        const a = createAlien(pos[0], pos[1], Math.random() < 0.7 ? 'sectoid' : 'floater');
        aliens.push(a);
        map[a.y][a.x].unit = a;
    }

    game.selectedUnit = soldiers[0];
    game.turn = 'player';
    game.turnNumber = 1;
    game.state = 'playing';
    updateVisibility();
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
            if (map[y] && map[y][x] && (map[y][x].terrain === TERRAIN.WALL || map[y][x].terrain === TERRAIN.WALL_BRICK)) {
                return false;
            }
        }
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
    }
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

function createProjectile(from, to, hit) {
    const fromPos = toIso(from.x, from.y);
    const toPos = toIso(to.x, to.y);
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

            if (target.health.current <= 0) {
                target.isAlive = false;
                map[target.y][target.x].unit = null;
                setMessage(`${target.name} killed!`);
            }
        } else {
            setMessage('Missed!');
        }
    }

    shooter.facing = getFacing(shooter.x, shooter.y, target.x, target.y);
    return true;
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

function setMessage(msg) {
    game.message = msg;
    game.messageTimer = 180;
}

function endTurn() {
    if (game.turn === 'player') {
        game.turn = 'enemy';
        setMessage('Alien Activity...');
        for (let a of aliens) {
            if (a.isAlive) a.tu.current = a.tu.base;
        }
        setTimeout(runAlienTurn, 500);
    } else {
        game.turn = 'player';
        game.turnNumber++;
        setMessage('Your Turn - Turn ' + game.turnNumber);
        for (let s of soldiers) {
            if (s.isAlive) s.tu.current = s.tu.base;
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
            if (nearestDist <= 10 && alien.tu.current >= 15) {
                fireWeapon(alien, nearestSoldier, 'snap');
            } else {
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

function drawUnit(unit) {
    if (!unit.isAlive) return;
    if (unit.type === 'alien' && !unit.spotted) return;

    const pos = toIso(unit.x, unit.y);
    const px = pos.x + game.cameraX;
    const py = pos.y + game.cameraY;
    const isSelected = game.selectedUnit === unit;
    const bodyHeight = unit.stance === 'kneeling' ? 14 : 22;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(px, py + 2, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (unit.type === 'soldier') {
        // X-COM style soldier with blue armor
        const armorColor = isSelected ? COLORS.SOLDIER_ARMOR_LIGHT : COLORS.SOLDIER_ARMOR;

        // Legs
        ctx.fillStyle = '#333344';
        ctx.fillRect(px - 4, py - 8, 3, 8);
        ctx.fillRect(px + 1, py - 8, 3, 8);

        // Body/Torso armor
        ctx.fillStyle = armorColor;
        ctx.beginPath();
        ctx.moveTo(px - 7, py - 8);
        ctx.lineTo(px + 7, py - 8);
        ctx.lineTo(px + 6, py - bodyHeight);
        ctx.lineTo(px - 6, py - bodyHeight);
        ctx.closePath();
        ctx.fill();

        // Armor highlights
        ctx.fillStyle = shadeColor(armorColor, 20);
        ctx.fillRect(px - 5, py - bodyHeight + 2, 3, bodyHeight - 10);

        // Helmet
        ctx.fillStyle = COLORS.SOLDIER_HELMET;
        ctx.beginPath();
        ctx.arc(px, py - bodyHeight - 4, 6, 0, Math.PI * 2);
        ctx.fill();

        // Visor (blue glow)
        ctx.fillStyle = COLORS.SOLDIER_VISOR;
        ctx.fillRect(px - 4, py - bodyHeight - 6, 8, 4);

        // Weapon
        ctx.fillStyle = '#444';
        ctx.fillRect(px + 5, py - bodyHeight + 4, 8, 3);
        ctx.fillRect(px + 10, py - bodyHeight, 3, 8);

    } else {
        // Alien (Sectoid or Floater)
        const skinColor = unit.alienType === 'sectoid' ? COLORS.SECTOID_SKIN : COLORS.FLOATER_SKIN;
        const darkColor = unit.alienType === 'sectoid' ? COLORS.SECTOID_DARK : COLORS.FLOATER_DARK;

        // Body
        ctx.fillStyle = darkColor;
        ctx.fillRect(px - 5, py - 12, 10, 12);

        // Big alien head
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.ellipse(px, py - 18, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Large black eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(px - 4, py - 20, 4, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(px + 4, py - 20, 4, 5, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(px - 5, py - 21, 1, 2, 0, 0, Math.PI * 2);
        ctx.ellipse(px + 3, py - 21, 1, 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Selection arrow (yellow)
    if (isSelected) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(px, py - bodyHeight - 18);
        ctx.lineTo(px - 6, py - bodyHeight - 12);
        ctx.lineTo(px + 6, py - bodyHeight - 12);
        ctx.closePath();
        ctx.fill();
    }

    // Health bar for damaged units
    if (unit.health.current < unit.health.base) {
        const healthPct = unit.health.current / unit.health.base;
        ctx.fillStyle = '#400';
        ctx.fillRect(px - 10, py - bodyHeight - 26, 20, 4);
        ctx.fillStyle = healthPct > 0.5 ? '#0c0' : healthPct > 0.25 ? '#cc0' : '#c00';
        ctx.fillRect(px - 10, py - bodyHeight - 26, 20 * healthPct, 4);
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

    // Draw units
    const allUnits = [...soldiers, ...aliens].filter(u => u.isAlive).sort((a, b) => (a.x + a.y) - (b.x + b.y));
    for (let unit of allUnits) {
        drawUnit(unit);
    }
}

function drawProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.progress += 0.15;

        if (p.progress >= 1) {
            projectiles.splice(i, 1);
            continue;
        }

        const x = p.x + (p.targetX - p.x) * p.progress;
        const y = p.y + (p.targetY - p.y) * p.progress;

        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Trail
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
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

        // Name panel
        drawPanel(268, GAME_HEIGHT + 8, 140, 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = '13px monospace';
        ctx.fillText(unit.name, 278, GAME_HEIGHT + 24);

        // Stats bars
        const barX = 268;
        let barY = GAME_HEIGHT + 40;

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

        // Ammo/Weapon info
        ctx.fillStyle = '#888888';
        ctx.font = '11px monospace';
        ctx.fillText(`Ammo: ${unit.weapon.currentAmmo}/${unit.weapon.ammo}`, 268, GAME_HEIGHT + 105);
        ctx.fillText(`${unit.weapon.name}`, 268, GAME_HEIGHT + 120);
    }

    // Right panel - Weapon display
    drawPanel(canvas.width - 88, GAME_HEIGHT + 8, 80, 75);
    if (game.selectedUnit) {
        ctx.fillStyle = '#555';
        ctx.fillRect(canvas.width - 80, GAME_HEIGHT + 20, 64, 50);
        ctx.fillStyle = '#777';
        ctx.font = '10px monospace';
        ctx.fillText(game.selectedUnit.weapon.name, canvas.width - 78, GAME_HEIGHT + 55);
    }

    // Turn indicator
    ctx.fillStyle = game.turn === 'player' ? '#44ff44' : '#ff4444';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(game.turn === 'player' ? 'YOUR TURN' : 'ALIEN TURN', 420, GAME_HEIGHT + 25);
    ctx.fillStyle = '#888888';
    ctx.font = '12px monospace';
    ctx.fillText(`Turn ${game.turnNumber}`, 420, GAME_HEIGHT + 42);

    // Unit counts
    const livingSoldiers = soldiers.filter(s => s.isAlive).length;
    const livingAliens = aliens.filter(a => a.isAlive && a.spotted).length;
    ctx.fillStyle = '#5588ff';
    ctx.fillText(`Soldiers: ${livingSoldiers}`, 420, GAME_HEIGHT + 60);
    ctx.fillStyle = '#ff5555';
    ctx.fillText(`Known Aliens: ${livingAliens}`, 420, GAME_HEIGHT + 77);

    // Message
    if (game.messageTimer > 0) {
        ctx.fillStyle = '#ffff00';
        ctx.font = '12px monospace';
        ctx.fillText(game.message, 12, GAME_HEIGHT + 100);
    }

    // Controls
    ctx.fillStyle = '#555555';
    ctx.font = '10px monospace';
    ctx.fillText('Click: Select/Move | S: Snap | A: Aimed | F: Auto | K: Kneel | E: End Turn', 12, GAME_HEIGHT + 130);
    ctx.fillText('1-6: Select Soldier | Space: Cycle | R: Reload', 12, GAME_HEIGHT + 145);
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
    } else {
        game.hoveredTile = null;
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

    if (key === 'e') endTurn();

    if (key === 'r') {
        if (game.selectedUnit.tu.current >= 15) {
            game.selectedUnit.tu.current -= 15;
            game.selectedUnit.weapon.currentAmmo = game.selectedUnit.weapon.ammo;
            setMessage('Reloaded!');
        } else setMessage('Not enough TU to reload!');
    }
}

// GAME LOOP
function gameLoop() {
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawMap();
    drawProjectiles();
    drawUI();

    if (game.messageTimer > 0) game.messageTimer--;

    if (game.state !== 'playing') {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = game.state === 'victory' ? '#44ff44' : '#ff4444';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(game.state === 'victory' ? 'MISSION COMPLETE!' : 'MISSION FAILED', canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 20);
        ctx.textAlign = 'left';
    }

    requestAnimationFrame(gameLoop);
}

// Expose for testing (use getters for live data)
window.gameState = game;
Object.defineProperty(window, 'soldiers', { get: () => soldiers });
Object.defineProperty(window, 'aliens', { get: () => aliens });

initGame();
gameLoop();
