// X-COM Classic Clone - UFO Defense
// Turn-based tactical combat

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const UI_HEIGHT = 160;

// Game states
const STATES = {
    MENU: 'menu',
    PLAYER_TURN: 'player_turn',
    ALIEN_TURN: 'alien_turn',
    MOVING: 'moving',
    SHOOTING: 'shooting',
    THROWING: 'throwing',
    VICTORY: 'victory',
    DEFEAT: 'defeat'
};

// Tile types
const TILES = {
    GROUND: 0,
    GRASS: 1,
    WALL: 2,
    BUSH: 3,
    RUBBLE: 4,
    UFO_FLOOR: 5,
    UFO_WALL: 6,
    ROAD: 7
};

// Weapon definitions
const WEAPONS = {
    pistol: {
        name: 'Pistol',
        damage: 26,
        snapAcc: 30,
        snapTU: 18,
        aimedAcc: 78,
        aimedTU: 30,
        autoAcc: 0,
        autoTU: 0,
        ammo: 12,
        maxAmmo: 12,
        range: 15
    },
    rifle: {
        name: 'Rifle',
        damage: 30,
        snapAcc: 60,
        snapTU: 25,
        aimedAcc: 110,
        aimedTU: 80,
        autoAcc: 35,
        autoTU: 35,
        ammo: 20,
        maxAmmo: 20,
        range: 25
    },
    grenade: {
        name: 'Grenade',
        damage: 50,
        radius: 3,
        throwTU: 25
    }
};

// Game state
let game = {
    state: STATES.MENU,
    turn: 1,
    map: [],
    soldiers: [],
    aliens: [],
    selectedUnit: null,
    projectiles: [],
    explosions: [],
    movePath: [],
    shootTarget: null,
    actionMode: 'move', // 'move', 'snap', 'aimed', 'auto', 'grenade'
    messages: [],
    camera: { x: 0, y: 0 },
    hoveredTile: null,
    visibleTiles: []
};

// Names for soldiers
const SOLDIER_NAMES = [
    'Cpt. Williams', 'Sgt. Rodriguez', 'Pvt. Chen', 'Pvt. Murphy',
    'Lt. Nakamura', 'Sgt. O\'Brien', 'Pvt. Santos', 'Pvt. Kim'
];

// Unit class
class Unit {
    constructor(x, y, isAlien = false, type = 'soldier') {
        this.x = x;
        this.y = y;
        this.isAlien = isAlien;
        this.type = type;
        this.alive = true;
        this.facing = isAlien ? 4 : 0; // 0-7, 8 directions
        this.kneeling = false;

        if (isAlien) {
            this.initAlien(type);
        } else {
            this.initSoldier();
        }
    }

    initSoldier() {
        this.name = SOLDIER_NAMES[Math.floor(Math.random() * SOLDIER_NAMES.length)];
        this.maxTU = 50 + Math.floor(Math.random() * 20);
        this.tu = this.maxTU;
        this.maxHealth = 30 + Math.floor(Math.random() * 15);
        this.health = this.maxHealth;
        this.reactions = 30 + Math.floor(Math.random() * 40);
        this.accuracy = 40 + Math.floor(Math.random() * 40);
        this.bravery = 30 + Math.floor(Math.random() * 50);
        this.morale = 100;
        this.weapon = JSON.parse(JSON.stringify(Math.random() < 0.5 ? WEAPONS.rifle : WEAPONS.pistol));
        this.grenades = 2;
        this.color = '#4a4';
    }

    initAlien(type) {
        switch (type) {
            case 'sectoid':
                this.name = 'Sectoid';
                this.maxTU = 54;
                this.maxHealth = 30;
                this.reactions = 63;
                this.accuracy = 55;
                this.armor = 4;
                this.color = '#888';
                this.damage = 35; // Plasma pistol
                break;
            case 'floater':
                this.name = 'Floater';
                this.maxTU = 60;
                this.maxHealth = 40;
                this.reactions = 50;
                this.accuracy = 45;
                this.armor = 8;
                this.color = '#866';
                this.damage = 40; // Plasma rifle
                this.canFly = true;
                break;
            case 'snakeman':
                this.name = 'Snakeman';
                this.maxTU = 50;
                this.maxHealth = 50;
                this.reactions = 55;
                this.accuracy = 60;
                this.armor = 10;
                this.color = '#484';
                this.damage = 40;
                break;
            default:
                this.name = 'Alien';
                this.maxTU = 50;
                this.maxHealth = 30;
                this.reactions = 50;
                this.accuracy = 50;
                this.armor = 5;
                this.color = '#666';
                this.damage = 30;
        }
        this.tu = this.maxTU;
        this.health = this.maxHealth;
        this.morale = 100;
    }

    getTUCost(action) {
        switch (action) {
            case 'move': return 4;
            case 'moveBush': return 6;
            case 'turn': return 1;
            case 'kneel': return this.kneeling ? 8 : 4;
            case 'snap': return Math.floor(this.maxTU * (this.weapon?.snapTU || 25) / 100);
            case 'aimed': return Math.floor(this.maxTU * (this.weapon?.aimedTU || 50) / 100);
            case 'auto': return Math.floor(this.maxTU * (this.weapon?.autoTU || 35) / 100);
            case 'grenade': return Math.floor(this.maxTU * 0.25);
            default: return 4;
        }
    }

    canAct(action) {
        return this.tu >= this.getTUCost(action);
    }

    spendTU(amount) {
        this.tu = Math.max(0, this.tu - amount);
    }

    resetTU() {
        this.tu = this.maxTU;
    }

    takeDamage(amount) {
        const armor = this.armor || 0;
        const actualDamage = Math.max(1, amount - armor);
        this.health -= actualDamage;

        if (this.health <= 0) {
            this.alive = false;
            addMessage(`${this.name} was killed!`);
        } else {
            addMessage(`${this.name} took ${actualDamage} damage!`);
        }

        // Morale hit for allies seeing death
        if (!this.isAlien) {
            for (const soldier of game.soldiers) {
                if (soldier !== this && soldier.alive) {
                    soldier.morale = Math.max(0, soldier.morale - 10);
                }
            }
        }

        return this.health <= 0;
    }

    getAccuracy(mode) {
        let baseAcc = this.accuracy;

        if (this.weapon) {
            switch (mode) {
                case 'snap': baseAcc = baseAcc * (this.weapon.snapAcc / 100); break;
                case 'aimed': baseAcc = baseAcc * (this.weapon.aimedAcc / 100); break;
                case 'auto': baseAcc = baseAcc * (this.weapon.autoAcc / 100); break;
            }
        } else {
            baseAcc = this.accuracy * 0.6;
        }

        // Modifiers
        if (this.kneeling) baseAcc *= 1.15;
        if (this.health < this.maxHealth * 0.5) baseAcc *= 0.9;

        return Math.min(95, Math.max(5, baseAcc));
    }

    draw(offsetX, offsetY) {
        const screenX = this.x * TILE_SIZE + offsetX;
        const screenY = this.y * TILE_SIZE + offsetY;

        if (!this.alive) return;

        // Check if visible
        if (this.isAlien && !isTileVisible(this.x, this.y)) return;

        ctx.save();
        ctx.translate(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);

        // Body
        const size = this.kneeling ? TILE_SIZE * 0.35 : TILE_SIZE * 0.4;
        ctx.fillStyle = this.color;

        if (this.isAlien) {
            if (this.type === 'sectoid') {
                // Big head alien
                ctx.beginPath();
                ctx.ellipse(0, 2, size * 0.7, size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(0, -size * 0.3, size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                // Eyes
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.ellipse(-4, -size * 0.3, 3, 5, 0, 0, Math.PI * 2);
                ctx.ellipse(4, -size * 0.3, 3, 5, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'floater') {
                // Floating body
                ctx.beginPath();
                ctx.ellipse(0, Math.sin(Date.now() / 200) * 3, size * 0.8, size * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                // Jetpack
                ctx.fillStyle = '#555';
                ctx.fillRect(-8, 4, 16, 8);
            } else if (this.type === 'snakeman') {
                // Snake-like body
                ctx.beginPath();
                ctx.moveTo(-size * 0.3, size);
                ctx.quadraticCurveTo(-size * 0.5, 0, 0, -size * 0.5);
                ctx.quadraticCurveTo(size * 0.5, 0, size * 0.3, size);
                ctx.fill();
                // Head
                ctx.beginPath();
                ctx.arc(0, -size * 0.4, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Human soldier
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fill();

            // Facing direction indicator
            const facingAngle = (this.facing / 8) * Math.PI * 2 - Math.PI / 2;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(facingAngle) * size, Math.sin(facingAngle) * size);
            ctx.stroke();
        }

        ctx.restore();

        // Health bar
        const barWidth = TILE_SIZE - 4;
        const barHeight = 4;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = '#400';
        ctx.fillRect(screenX + 2, screenY - 6, barWidth, barHeight);
        ctx.fillStyle = healthPercent > 0.5 ? '#4a4' : healthPercent > 0.25 ? '#aa4' : '#a44';
        ctx.fillRect(screenX + 2, screenY - 6, barWidth * healthPercent, barHeight);

        // TU indicator (for soldiers)
        if (!this.isAlien) {
            const tuPercent = this.tu / this.maxTU;
            ctx.fillStyle = '#004';
            ctx.fillRect(screenX + 2, screenY + TILE_SIZE + 2, barWidth, 3);
            ctx.fillStyle = '#44a';
            ctx.fillRect(screenX + 2, screenY + TILE_SIZE + 2, barWidth * tuPercent, 3);
        }

        // Selection indicator
        if (game.selectedUnit === this) {
            ctx.strokeStyle = '#ff0';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX + 1, screenY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        }
    }
}

// Initialize map
function generateMap() {
    game.map = [];

    // Create base terrain
    for (let y = 0; y < MAP_HEIGHT; y++) {
        game.map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (Math.random() < 0.15) {
                game.map[y][x] = TILES.BUSH;
            } else if (Math.random() < 0.08) {
                game.map[y][x] = TILES.RUBBLE;
            } else {
                game.map[y][x] = Math.random() < 0.4 ? TILES.GRASS : TILES.GROUND;
            }
        }
    }

    // Add some walls/cover
    for (let i = 0; i < 8; i++) {
        const wx = 3 + Math.floor(Math.random() * (MAP_WIDTH - 6));
        const wy = 3 + Math.floor(Math.random() * (MAP_HEIGHT - 6));
        const horizontal = Math.random() < 0.5;
        const len = 2 + Math.floor(Math.random() * 3);

        for (let j = 0; j < len; j++) {
            const tx = horizontal ? wx + j : wx;
            const ty = horizontal ? wy : wy + j;
            if (tx < MAP_WIDTH && ty < MAP_HEIGHT) {
                game.map[ty][tx] = TILES.WALL;
            }
        }
    }

    // Add UFO crash site in upper-right area
    const ufoX = MAP_WIDTH - 6;
    const ufoY = 2;
    for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 5; dx++) {
            if (ufoX + dx < MAP_WIDTH && ufoY + dy < MAP_HEIGHT) {
                if (dx === 0 || dx === 4 || dy === 0 || dy === 3) {
                    game.map[ufoY + dy][ufoX + dx] = TILES.UFO_WALL;
                } else {
                    game.map[ufoY + dy][ufoX + dx] = TILES.UFO_FLOOR;
                }
            }
        }
    }
    // Add entrance
    game.map[ufoY + 1][ufoX] = TILES.UFO_FLOOR;
    game.map[ufoY + 2][ufoX] = TILES.UFO_FLOOR;

    // Add road at bottom
    for (let x = 0; x < MAP_WIDTH; x++) {
        game.map[MAP_HEIGHT - 2][x] = TILES.ROAD;
    }
}

// Initialize units
function initUnits() {
    game.soldiers = [];
    game.aliens = [];

    // Place 4 soldiers at bottom of map
    const startY = MAP_HEIGHT - 3;
    for (let i = 0; i < 4; i++) {
        const soldier = new Unit(2 + i * 3, startY, false, 'soldier');
        game.soldiers.push(soldier);
    }

    // Place aliens near UFO
    const alienTypes = ['sectoid', 'sectoid', 'floater', 'snakeman'];
    for (let i = 0; i < 4; i++) {
        const ax = MAP_WIDTH - 5 + Math.floor(Math.random() * 3);
        const ay = 3 + Math.floor(Math.random() * 3);
        const alien = new Unit(ax, ay, true, alienTypes[i]);
        game.aliens.push(alien);
    }

    // Select first soldier
    game.selectedUnit = game.soldiers[0];
}

// Visibility calculation
function updateVisibility() {
    game.visibleTiles = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
        game.visibleTiles[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            game.visibleTiles[y][x] = false;
        }
    }

    // Each soldier reveals tiles in their vision
    for (const soldier of game.soldiers) {
        if (!soldier.alive) continue;

        const visionRange = 12;
        for (let dy = -visionRange; dy <= visionRange; dy++) {
            for (let dx = -visionRange; dx <= visionRange; dx++) {
                const tx = soldier.x + dx;
                const ty = soldier.y + dy;

                if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) continue;

                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > visionRange) continue;

                // Check line of sight
                if (hasLineOfSight(soldier.x, soldier.y, tx, ty)) {
                    game.visibleTiles[ty][tx] = true;
                }
            }
        }
    }
}

function hasLineOfSight(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    if (steps === 0) return true;

    for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const tx = Math.round(x1 + dx * t);
        const ty = Math.round(y1 + dy * t);

        if (game.map[ty][tx] === TILES.WALL || game.map[ty][tx] === TILES.UFO_WALL) {
            return false;
        }
    }

    return true;
}

function isTileVisible(x, y) {
    if (y < 0 || y >= MAP_HEIGHT || x < 0 || x >= MAP_WIDTH) return false;
    return game.visibleTiles[y][x];
}

// Pathfinding
function findPath(startX, startY, endX, endY) {
    const openSet = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
    const closedSet = [];

    while (openSet.length > 0) {
        // Find lowest f score
        let lowestIndex = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < openSet[lowestIndex].f) {
                lowestIndex = i;
            }
        }

        const current = openSet[lowestIndex];

        // Check if reached goal
        if (current.x === endX && current.y === endY) {
            const path = [];
            let node = current;
            while (node) {
                path.unshift({ x: node.x, y: node.y });
                node = node.parent;
            }
            return path;
        }

        openSet.splice(lowestIndex, 1);
        closedSet.push(current);

        // Check neighbors
        const neighbors = [
            { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
        ];

        for (const dir of neighbors) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;

            if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
            if (!isWalkable(nx, ny)) continue;
            if (closedSet.some(n => n.x === nx && n.y === ny)) continue;

            const g = current.g + getTileCost(nx, ny);
            const h = Math.abs(nx - endX) + Math.abs(ny - endY);
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

        if (openSet.length > 500) break; // Safety limit
    }

    return null;
}

function isWalkable(x, y) {
    const tile = game.map[y][x];
    if (tile === TILES.WALL || tile === TILES.UFO_WALL) return false;

    // Check for units
    for (const soldier of game.soldiers) {
        if (soldier.alive && soldier.x === x && soldier.y === y) return false;
    }
    for (const alien of game.aliens) {
        if (alien.alive && alien.x === x && alien.y === y) return false;
    }

    return true;
}

function getTileCost(x, y) {
    const tile = game.map[y][x];
    switch (tile) {
        case TILES.BUSH: return 6;
        case TILES.RUBBLE: return 6;
        default: return 4;
    }
}

// Combat
function attemptShot(shooter, target, mode) {
    const accuracy = shooter.getAccuracy(mode);
    const roll = Math.random() * 100;

    addMessage(`${shooter.name} fires ${mode} shot (${Math.floor(accuracy)}% to hit)...`);

    if (roll < accuracy) {
        // Hit!
        const baseDamage = shooter.weapon ? shooter.weapon.damage : shooter.damage;
        const damage = Math.floor(baseDamage * (0.5 + Math.random() * 1.5));
        target.takeDamage(damage);

        // Create hit effect
        createExplosion(target.x, target.y, 1, '#f80');
    } else {
        addMessage('Miss!');
        // Create miss effect near target
        createExplosion(target.x + (Math.random() - 0.5), target.y + (Math.random() - 0.5), 0.5, '#888');
    }

    // Spend ammo
    if (shooter.weapon && shooter.weapon.ammo > 0) {
        shooter.weapon.ammo--;
    }
}

function throwGrenade(thrower, targetX, targetY) {
    const damage = WEAPONS.grenade.damage;
    const radius = WEAPONS.grenade.radius;

    addMessage(`${thrower.name} throws a grenade!`);
    thrower.grenades--;

    // Create explosion
    createExplosion(targetX, targetY, radius, '#f80');

    // Damage units in radius
    const allUnits = [...game.soldiers, ...game.aliens];
    for (const unit of allUnits) {
        if (!unit.alive) continue;

        const dist = Math.sqrt(Math.pow(unit.x - targetX, 2) + Math.pow(unit.y - targetY, 2));
        if (dist <= radius) {
            const falloff = 1 - (dist / radius) * 0.5;
            const actualDamage = Math.floor(damage * falloff * (0.5 + Math.random()));
            unit.takeDamage(actualDamage);
        }
    }

    // Destroy cover
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const tx = targetX + dx;
            const ty = targetY + dy;
            if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= radius && Math.random() < 0.5) {
                    if (game.map[ty][tx] === TILES.BUSH || game.map[ty][tx] === TILES.WALL) {
                        game.map[ty][tx] = TILES.RUBBLE;
                    }
                }
            }
        }
    }
}

function createExplosion(x, y, radius, color) {
    game.explosions.push({
        x: x,
        y: y,
        radius: radius * TILE_SIZE,
        maxRadius: radius * TILE_SIZE,
        color: color,
        life: 0.5
    });
}

// Reaction fire check
function checkReactionFire(movingUnit, tuSpent) {
    const enemies = movingUnit.isAlien ? game.soldiers : game.aliens;

    for (const enemy of enemies) {
        if (!enemy.alive) continue;
        if (!hasLineOfSight(enemy.x, enemy.y, movingUnit.x, movingUnit.y)) continue;
        if (!isTileVisible(movingUnit.x, movingUnit.y) && !movingUnit.isAlien) continue;

        const snapTU = enemy.getTUCost('snap');
        if (enemy.tu < snapTU) continue;

        // Reaction check
        const reactionScore = enemy.reactions * enemy.tu;
        const targetScore = movingUnit.reactions * tuSpent;

        if (reactionScore > targetScore && Math.random() < 0.3) {
            addMessage(`${enemy.name} takes a reaction shot!`);
            enemy.spendTU(snapTU);
            attemptShot(enemy, movingUnit, 'snap');

            if (!movingUnit.alive) return true;
        }
    }

    return false;
}

// AI turn
function executeAlienTurn() {
    game.state = STATES.ALIEN_TURN;

    let alienIndex = 0;

    function processNextAlien() {
        while (alienIndex < game.aliens.length && !game.aliens[alienIndex].alive) {
            alienIndex++;
        }

        if (alienIndex >= game.aliens.length) {
            endAlienTurn();
            return;
        }

        const alien = game.aliens[alienIndex];
        executeAlienAI(alien, () => {
            alienIndex++;
            setTimeout(processNextAlien, 300);
        });
    }

    setTimeout(processNextAlien, 500);
}

function executeAlienAI(alien, callback) {
    // Find nearest visible soldier
    let nearestSoldier = null;
    let nearestDist = Infinity;

    for (const soldier of game.soldiers) {
        if (!soldier.alive) continue;

        const dist = Math.abs(soldier.x - alien.x) + Math.abs(soldier.y - alien.y);
        if (dist < nearestDist && hasLineOfSight(alien.x, alien.y, soldier.x, soldier.y)) {
            nearestDist = dist;
            nearestSoldier = soldier;
        }
    }

    if (nearestSoldier && nearestDist <= 15) {
        // Try to shoot
        const snapTU = Math.floor(alien.maxTU * 0.3);
        if (alien.tu >= snapTU) {
            alien.spendTU(snapTU);
            setTimeout(() => {
                attemptShot(alien, nearestSoldier, 'snap');
                checkVictoryConditions();
                callback();
            }, 200);
            return;
        }
    }

    // Move toward nearest soldier
    if (nearestSoldier) {
        const path = findPath(alien.x, alien.y, nearestSoldier.x, nearestSoldier.y);
        if (path && path.length > 1) {
            const moveCost = getTileCost(path[1].x, path[1].y);
            if (alien.tu >= moveCost) {
                alien.x = path[1].x;
                alien.y = path[1].y;
                alien.spendTU(moveCost);
            }
        }
    }

    callback();
}

function endAlienTurn() {
    // Reset alien TUs
    for (const alien of game.aliens) {
        if (alien.alive) alien.resetTU();
    }

    game.turn++;
    game.state = STATES.PLAYER_TURN;
    addMessage(`Turn ${game.turn} - Your turn`);
    updateVisibility();
}

// Victory/defeat check
function checkVictoryConditions() {
    const aliensAlive = game.aliens.filter(a => a.alive).length;
    const soldiersAlive = game.soldiers.filter(s => s.alive).length;

    if (aliensAlive === 0) {
        game.state = STATES.VICTORY;
        addMessage('VICTORY! All aliens eliminated!');
    } else if (soldiersAlive === 0) {
        game.state = STATES.DEFEAT;
        addMessage('DEFEAT! All soldiers killed!');
    }
}

// Message system
function addMessage(text) {
    game.messages.unshift(text);
    if (game.messages.length > 8) game.messages.pop();
}

// Input handling
let mouseX = 0, mouseY = 0;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    // Calculate hovered tile
    const tileX = Math.floor((mouseX - game.camera.x) / TILE_SIZE);
    const tileY = Math.floor((mouseY - game.camera.y) / TILE_SIZE);

    if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
        game.hoveredTile = { x: tileX, y: tileY };

        // Calculate path if in move mode
        if (game.state === STATES.PLAYER_TURN && game.selectedUnit && game.actionMode === 'move') {
            game.movePath = findPath(game.selectedUnit.x, game.selectedUnit.y, tileX, tileY);
        }
    } else {
        game.hoveredTile = null;
        game.movePath = null;
    }
});

canvas.addEventListener('click', (e) => {
    if (game.state === STATES.MENU) {
        startGame();
        return;
    }

    if (game.state === STATES.VICTORY || game.state === STATES.DEFEAT) {
        game.state = STATES.MENU;
        return;
    }

    if (game.state !== STATES.PLAYER_TURN) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check UI clicks
    if (clickY > canvas.height - UI_HEIGHT) {
        handleUIClick(clickX, clickY);
        return;
    }

    // Map clicks
    const tileX = Math.floor((clickX - game.camera.x) / TILE_SIZE);
    const tileY = Math.floor((clickY - game.camera.y) / TILE_SIZE);

    if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) return;

    // Check if clicking on a soldier to select
    for (const soldier of game.soldiers) {
        if (soldier.alive && soldier.x === tileX && soldier.y === tileY) {
            game.selectedUnit = soldier;
            game.actionMode = 'move';
            return;
        }
    }

    // Check if clicking on visible alien to shoot
    if (['snap', 'aimed', 'auto'].includes(game.actionMode)) {
        for (const alien of game.aliens) {
            if (alien.alive && alien.x === tileX && alien.y === tileY && isTileVisible(tileX, tileY)) {
                if (game.selectedUnit && game.selectedUnit.canAct(game.actionMode)) {
                    const shots = game.actionMode === 'auto' ? 3 : 1;
                    for (let i = 0; i < shots && alien.alive; i++) {
                        game.selectedUnit.spendTU(game.selectedUnit.getTUCost(game.actionMode));
                        attemptShot(game.selectedUnit, alien, game.actionMode);
                    }
                    checkVictoryConditions();
                    updateVisibility();
                }
                return;
            }
        }
    }

    // Grenade throw
    if (game.actionMode === 'grenade' && game.selectedUnit && game.selectedUnit.grenades > 0) {
        if (game.selectedUnit.canAct('grenade')) {
            game.selectedUnit.spendTU(game.selectedUnit.getTUCost('grenade'));
            throwGrenade(game.selectedUnit, tileX, tileY);
            checkVictoryConditions();
            updateVisibility();
        }
        return;
    }

    // Move
    if (game.actionMode === 'move' && game.selectedUnit && game.movePath) {
        executeMoveAlongPath();
    }
});

function handleUIClick(x, y) {
    const buttonY = canvas.height - UI_HEIGHT + 10;
    const buttonWidth = 80;
    const buttonHeight = 30;

    // Action buttons
    const buttons = [
        { x: 10, mode: 'move', label: 'Move' },
        { x: 100, mode: 'snap', label: 'Snap' },
        { x: 190, mode: 'aimed', label: 'Aimed' },
        { x: 280, mode: 'auto', label: 'Auto' },
        { x: 370, mode: 'grenade', label: 'Grenade' },
        { x: 460, mode: 'kneel', label: 'Kneel' },
        { x: 550, mode: 'endturn', label: 'End Turn' }
    ];

    for (const btn of buttons) {
        if (x >= btn.x && x <= btn.x + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
            if (btn.mode === 'endturn') {
                endPlayerTurn();
            } else if (btn.mode === 'kneel' && game.selectedUnit) {
                if (game.selectedUnit.canAct('kneel')) {
                    game.selectedUnit.spendTU(game.selectedUnit.getTUCost('kneel'));
                    game.selectedUnit.kneeling = !game.selectedUnit.kneeling;
                }
            } else {
                game.actionMode = btn.mode;
            }
            return;
        }
    }

    // Soldier selection buttons at bottom
    const soldierButtonY = canvas.height - 50;
    for (let i = 0; i < game.soldiers.length; i++) {
        const btnX = 10 + i * 100;
        if (x >= btnX && x <= btnX + 90 && y >= soldierButtonY && y <= soldierButtonY + 40) {
            if (game.soldiers[i].alive) {
                game.selectedUnit = game.soldiers[i];
                game.actionMode = 'move';
            }
            return;
        }
    }
}

function executeMoveAlongPath() {
    if (!game.movePath || game.movePath.length < 2) return;

    const unit = game.selectedUnit;
    let pathIndex = 1;

    game.state = STATES.MOVING;

    function moveStep() {
        if (pathIndex >= game.movePath.length || !unit.alive) {
            game.state = STATES.PLAYER_TURN;
            updateVisibility();
            return;
        }

        const nextTile = game.movePath[pathIndex];
        const cost = getTileCost(nextTile.x, nextTile.y);

        if (unit.tu < cost) {
            game.state = STATES.PLAYER_TURN;
            addMessage('Not enough TU!');
            return;
        }

        unit.x = nextTile.x;
        unit.y = nextTile.y;
        unit.spendTU(cost);

        // Check reaction fire
        if (checkReactionFire(unit, cost)) {
            game.state = STATES.PLAYER_TURN;
            checkVictoryConditions();
            return;
        }

        pathIndex++;
        updateVisibility();
        setTimeout(moveStep, 100);
    }

    moveStep();
}

function endPlayerTurn() {
    // Reset soldier TUs
    for (const soldier of game.soldiers) {
        if (soldier.alive) soldier.resetTU();
    }

    addMessage('Alien turn...');
    executeAlienTurn();
}

// Keyboard input
document.addEventListener('keydown', (e) => {
    if (game.state === STATES.MENU) {
        startGame();
        return;
    }

    if (game.state !== STATES.PLAYER_TURN) return;

    switch (e.key) {
        case '1': game.actionMode = 'move'; break;
        case '2': game.actionMode = 'snap'; break;
        case '3': game.actionMode = 'aimed'; break;
        case '4': game.actionMode = 'auto'; break;
        case '5': game.actionMode = 'grenade'; break;
        case 'Tab':
            e.preventDefault();
            // Cycle through soldiers
            const currentIndex = game.soldiers.indexOf(game.selectedUnit);
            for (let i = 1; i <= game.soldiers.length; i++) {
                const nextIndex = (currentIndex + i) % game.soldiers.length;
                if (game.soldiers[nextIndex].alive) {
                    game.selectedUnit = game.soldiers[nextIndex];
                    break;
                }
            }
            break;
        case 'Enter':
        case ' ':
            endPlayerTurn();
            break;
    }
});

// Game start
function startGame() {
    generateMap();
    initUnits();
    updateVisibility();
    game.state = STATES.PLAYER_TURN;
    game.turn = 1;
    game.messages = [];
    game.actionMode = 'move';
    addMessage('Mission: UFO Crash Recovery');
    addMessage('Kill all aliens!');
    addMessage(`Turn ${game.turn} - Your turn`);
}

// Drawing
function drawTile(x, y, tile) {
    const screenX = x * TILE_SIZE + game.camera.x;
    const screenY = y * TILE_SIZE + game.camera.y;

    const visible = isTileVisible(x, y);

    // Base tile
    switch (tile) {
        case TILES.GROUND:
            ctx.fillStyle = visible ? '#3a3a2a' : '#1a1a15';
            break;
        case TILES.GRASS:
            ctx.fillStyle = visible ? '#2a3a2a' : '#151a15';
            break;
        case TILES.WALL:
            ctx.fillStyle = visible ? '#555' : '#2a2a2a';
            break;
        case TILES.BUSH:
            ctx.fillStyle = visible ? '#2a4a2a' : '#152515';
            break;
        case TILES.RUBBLE:
            ctx.fillStyle = visible ? '#4a4a3a' : '#25251d';
            break;
        case TILES.UFO_FLOOR:
            ctx.fillStyle = visible ? '#446' : '#223';
            break;
        case TILES.UFO_WALL:
            ctx.fillStyle = visible ? '#668' : '#334';
            break;
        case TILES.ROAD:
            ctx.fillStyle = visible ? '#444' : '#222';
            break;
        default:
            ctx.fillStyle = '#333';
    }

    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

    // Grid lines
    ctx.strokeStyle = visible ? '#333' : '#222';
    ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

    // Bush decoration
    if (tile === TILES.BUSH && visible) {
        ctx.fillStyle = '#3a5a3a';
        ctx.beginPath();
        ctx.arc(screenX + 8, screenY + 8, 6, 0, Math.PI * 2);
        ctx.arc(screenX + 20, screenY + 12, 7, 0, Math.PI * 2);
        ctx.arc(screenX + 14, screenY + 22, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function draw() {
    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === STATES.MENU) {
        drawMenu();
        return;
    }

    // Draw map
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            drawTile(x, y, game.map[y][x]);
        }
    }

    // Draw movement path
    if (game.movePath && game.actionMode === 'move') {
        let totalCost = 0;
        ctx.strokeStyle = '#4f4';
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < game.movePath.length; i++) {
            const point = game.movePath[i];
            const screenX = point.x * TILE_SIZE + TILE_SIZE / 2 + game.camera.x;
            const screenY = point.y * TILE_SIZE + TILE_SIZE / 2 + game.camera.y;

            if (i === 0) {
                ctx.moveTo(screenX, screenY);
            } else {
                totalCost += getTileCost(point.x, point.y);
                ctx.strokeStyle = totalCost <= (game.selectedUnit?.tu || 0) ? '#4f4' : '#f44';
                ctx.lineTo(screenX, screenY);
            }
        }
        ctx.stroke();
    }

    // Draw hovered tile highlight
    if (game.hoveredTile) {
        const screenX = game.hoveredTile.x * TILE_SIZE + game.camera.x;
        const screenY = game.hoveredTile.y * TILE_SIZE + game.camera.y;
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    }

    // Draw units
    for (const alien of game.aliens) {
        alien.draw(game.camera.x, game.camera.y);
    }
    for (const soldier of game.soldiers) {
        soldier.draw(game.camera.x, game.camera.y);
    }

    // Draw explosions
    for (let i = game.explosions.length - 1; i >= 0; i--) {
        const exp = game.explosions[i];
        const alpha = exp.life * 2;
        ctx.fillStyle = exp.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(
            exp.x * TILE_SIZE + TILE_SIZE / 2 + game.camera.x,
            exp.y * TILE_SIZE + TILE_SIZE / 2 + game.camera.y,
            exp.radius * (1 - exp.life / 0.5),
            0, Math.PI * 2
        );
        ctx.fill();
        ctx.globalAlpha = 1;

        exp.life -= 0.016;
        if (exp.life <= 0) game.explosions.splice(i, 1);
    }

    // Draw UI
    drawUI();

    // Draw victory/defeat
    if (game.state === STATES.VICTORY) {
        ctx.fillStyle = 'rgba(0, 50, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#4f4';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION COMPLETE', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '24px monospace';
        ctx.fillText('All aliens eliminated!', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = '#888';
        ctx.font = '18px monospace';
        ctx.fillText('Click to continue', canvas.width / 2, canvas.height / 2 + 60);
    }

    if (game.state === STATES.DEFEAT) {
        ctx.fillStyle = 'rgba(50, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f44';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION FAILED', canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '24px monospace';
        ctx.fillText('All soldiers killed!', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = '#888';
        ctx.font = '18px monospace';
        ctx.fillText('Click to continue', canvas.width / 2, canvas.height / 2 + 60);
    }
}

function drawUI() {
    const uiY = canvas.height - UI_HEIGHT;

    // UI background
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(0, uiY, canvas.width, UI_HEIGHT);
    ctx.strokeStyle = '#3a3a4a';
    ctx.strokeRect(0, uiY, canvas.width, UI_HEIGHT);

    // Action buttons
    const buttonY = uiY + 10;
    const buttonWidth = 80;
    const buttonHeight = 30;

    const buttons = [
        { x: 10, mode: 'move', label: 'Move [1]' },
        { x: 100, mode: 'snap', label: 'Snap [2]' },
        { x: 190, mode: 'aimed', label: 'Aimed [3]' },
        { x: 280, mode: 'auto', label: 'Auto [4]' },
        { x: 370, mode: 'grenade', label: 'Nade [5]' },
        { x: 460, mode: 'kneel', label: 'Kneel' },
        { x: 550, mode: 'endturn', label: 'End [Spc]' }
    ];

    for (const btn of buttons) {
        const active = game.actionMode === btn.mode;
        ctx.fillStyle = active ? '#446' : '#333';
        ctx.fillRect(btn.x, buttonY, buttonWidth, buttonHeight);
        ctx.strokeStyle = active ? '#88f' : '#555';
        ctx.strokeRect(btn.x, buttonY, buttonWidth, buttonHeight);

        ctx.fillStyle = active ? '#fff' : '#aaa';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(btn.label, btn.x + buttonWidth / 2, buttonY + 20);
    }

    // Selected unit info
    if (game.selectedUnit) {
        const unit = game.selectedUnit;
        const infoX = 650;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(unit.name, infoX, uiY + 25);

        ctx.font = '12px monospace';
        ctx.fillStyle = '#4f4';
        ctx.fillText(`HP: ${unit.health}/${unit.maxHealth}`, infoX, uiY + 45);
        ctx.fillStyle = '#44f';
        ctx.fillText(`TU: ${unit.tu}/${unit.maxTU}`, infoX, uiY + 60);

        if (unit.weapon) {
            ctx.fillStyle = '#ff0';
            ctx.fillText(`${unit.weapon.name}: ${unit.weapon.ammo}/${unit.weapon.maxAmmo}`, infoX, uiY + 75);
        }
        ctx.fillStyle = '#f80';
        ctx.fillText(`Grenades: ${unit.grenades}`, infoX, uiY + 90);
        ctx.fillStyle = '#aaa';
        ctx.fillText(`Acc: ${Math.floor(unit.accuracy)}%`, infoX + 100, uiY + 45);
        ctx.fillText(`React: ${unit.reactions}`, infoX + 100, uiY + 60);

        // TU costs
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';
        const costs = [
            `Snap: ${unit.getTUCost('snap')}`,
            `Aimed: ${unit.getTUCost('aimed')}`,
            `Move: 4/tile`
        ];
        ctx.fillText(costs.join(' | '), infoX, uiY + 110);
    }

    // Soldier selection tabs
    const tabY = uiY + 120;
    for (let i = 0; i < game.soldiers.length; i++) {
        const soldier = game.soldiers[i];
        const tabX = 10 + i * 100;

        ctx.fillStyle = soldier.alive ?
            (soldier === game.selectedUnit ? '#446' : '#333') : '#422';
        ctx.fillRect(tabX, tabY, 90, 35);
        ctx.strokeStyle = soldier === game.selectedUnit ? '#88f' : '#555';
        ctx.strokeRect(tabX, tabY, 90, 35);

        ctx.fillStyle = soldier.alive ? '#fff' : '#888';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(soldier.name.split(' ')[1] || soldier.name, tabX + 45, tabY + 14);

        if (soldier.alive) {
            // Mini health bar
            ctx.fillStyle = '#400';
            ctx.fillRect(tabX + 5, tabY + 20, 80, 6);
            ctx.fillStyle = '#4a4';
            ctx.fillRect(tabX + 5, tabY + 20, 80 * (soldier.health / soldier.maxHealth), 6);

            // Mini TU bar
            ctx.fillStyle = '#004';
            ctx.fillRect(tabX + 5, tabY + 28, 80, 4);
            ctx.fillStyle = '#44a';
            ctx.fillRect(tabX + 5, tabY + 28, 80 * (soldier.tu / soldier.maxTU), 4);
        }
    }

    // Messages
    ctx.textAlign = 'left';
    ctx.font = '11px monospace';
    for (let i = 0; i < Math.min(game.messages.length, 4); i++) {
        ctx.fillStyle = i === 0 ? '#fff' : `rgba(255,255,255,${0.7 - i * 0.15})`;
        ctx.fillText(game.messages[i], 420, tabY + 12 + i * 14);
    }

    // Turn indicator
    ctx.fillStyle = game.state === STATES.PLAYER_TURN ? '#4f4' : '#f44';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(game.state === STATES.PLAYER_TURN ? 'YOUR TURN' : 'ALIEN TURN', canvas.width - 10, uiY + 25);
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText(`Turn ${game.turn}`, canvas.width - 10, uiY + 42);

    // Aliens remaining
    const aliensLeft = game.aliens.filter(a => a.alive).length;
    ctx.fillStyle = '#f44';
    ctx.fillText(`Aliens: ${aliensLeft}`, canvas.width - 10, uiY + 58);
}

function drawMenu() {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#88f';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('X-COM CLASSIC', canvas.width / 2, 150);

    ctx.fillStyle = '#668';
    ctx.font = '24px monospace';
    ctx.fillText('UFO DEFENSE', canvas.width / 2, 190);

    // Mission briefing
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText('MISSION: UFO Crash Recovery', canvas.width / 2, 280);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.fillText('A UFO has crashed in the area.', canvas.width / 2, 320);
    ctx.fillText('Eliminate all alien threats.', canvas.width / 2, 345);

    // Instructions
    ctx.fillStyle = '#4f4';
    ctx.font = '20px monospace';
    ctx.fillText('Click to Start Mission', canvas.width / 2, 420);

    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText('Controls:', canvas.width / 2, 480);
    ctx.fillText('Click: Select/Move/Shoot | 1-5: Action modes', canvas.width / 2, 500);
    ctx.fillText('Tab: Next soldier | Space: End turn', canvas.width / 2, 520);
}

// Game loop
function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

// Start
requestAnimationFrame(gameLoop);
