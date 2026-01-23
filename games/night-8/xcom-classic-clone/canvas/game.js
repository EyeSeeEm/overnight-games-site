// X-COM Tactical Clone
// Canvas Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = 800;
const HEIGHT = 600;

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const MAP_OFFSET_X = 160;
const MAP_OFFSET_Y = 40;

// Colors
const COLORS = {
    bg: '#0a0a1a',
    grass: '#2a4a2a',
    grassDark: '#1a3a1a',
    dirt: '#4a3a2a',
    wall: '#3a3a4a',
    floor: '#4a4a5a',
    road: '#3a3a3a',
    ufo: '#3a4a5a',
    fog: '#0a0a1a',
    fogPartial: 'rgba(10, 10, 26, 0.7)',
    soldier: '#4488cc',
    soldierSelected: '#66aaff',
    alien: '#cc4444',
    alienSectoid: '#88aa88',
    alienFloater: '#aa8888',
    alienSnakeman: '#88aa44',
    ui: '#1a1a2a',
    uiBorder: '#445566',
    tuBar: '#44aa44',
    healthBar: '#cc4444',
    staminaBar: '#4488cc',
    text: '#cccccc',
    textDim: '#888899',
    highlight: '#ffff44',
    moveTile: 'rgba(68, 136, 204, 0.3)',
    attackTile: 'rgba(204, 68, 68, 0.3)'
};

// Game state
let gameState = 'menu'; // menu, playing, enemyTurn, victory, defeat
let turn = 'player'; // player, enemy
let turnNumber = 1;
let showDebug = false;

// Map
let map = [];
let visibilityMap = [];

// Units
let soldiers = [];
let aliens = [];
let selectedUnit = null;
let actionMode = 'move'; // move, snap, aimed, grenade

// Animation
let animations = [];
let messages = [];

// Action costs
const TU_COSTS = {
    walkFlat: 4,
    walkDifficult: 6,
    turn: 1,
    kneel: 4,
    stand: 8,
    openDoor: 4,
    pickup: 4,
    prime: 4
};

// Weapons
const WEAPONS = {
    rifle: { name: 'Rifle', damage: 30, snap: { tu: 25, acc: 60 }, aimed: { tu: 80, acc: 110 }, auto: { tu: 35, acc: 35, shots: 3 }, ammo: 20 },
    pistol: { name: 'Pistol', damage: 26, snap: { tu: 18, acc: 30 }, aimed: { tu: 30, acc: 78 }, ammo: 12 },
    grenade: { name: 'Grenade', damage: 50, range: 8, radius: 2 }
};

// Alien types
const ALIEN_TYPES = {
    sectoid: { name: 'Sectoid', hp: 30, tu: 54, reactions: 63, armor: 4, damage: 25, acc: 50, color: COLORS.alienSectoid },
    floater: { name: 'Floater', hp: 40, tu: 60, reactions: 50, armor: 8, damage: 30, acc: 45, color: COLORS.alienFloater },
    snakeman: { name: 'Snakeman', hp: 50, tu: 70, reactions: 55, armor: 12, damage: 35, acc: 55, color: COLORS.alienSnakeman }
};

// Initialize
function init() {
    generateMap();
    setupInput();
    gameLoop();
}

function generateMap() {
    map = [];
    visibilityMap = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        visibilityMap[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            let tile = { type: 'grass', walkable: true, cover: 0 };

            // UFO crash site in center-right
            if (x >= 12 && x <= 17 && y >= 5 && y <= 10) {
                if (x === 12 || x === 17 || y === 5 || y === 10) {
                    tile = { type: 'ufo_wall', walkable: false, cover: 100 };
                } else {
                    tile = { type: 'ufo_floor', walkable: true, cover: 0 };
                }
            }
            // Road
            else if ((x >= 8 && x <= 10 && y >= 0 && y <= 4) || (y === 4 && x >= 5 && x <= 10)) {
                tile = { type: 'road', walkable: true, cover: 0 };
            }
            // Buildings
            else if ((x >= 1 && x <= 4 && y >= 8 && y <= 12)) {
                if (x === 1 || x === 4 || y === 8 || y === 12) {
                    tile = { type: 'wall', walkable: false, cover: 100 };
                } else if (x === 2 && y === 12) {
                    tile = { type: 'door', walkable: true, cover: 0 };
                } else {
                    tile = { type: 'floor', walkable: true, cover: 0 };
                }
            }
            // Bushes for cover
            else if (Math.random() < 0.08) {
                tile = { type: 'bush', walkable: true, cover: 40 };
            }
            // Dirt patches
            else if (Math.random() < 0.15) {
                tile = { type: 'dirt', walkable: true, cover: 0 };
            }

            map[y][x] = tile;
            visibilityMap[y][x] = 0; // 0 = hidden, 1 = partial, 2 = visible
        }
    }
}

function spawnUnits() {
    soldiers = [];
    aliens = [];

    // Spawn 4 soldiers on left side
    const soldierNames = ['John Smith', 'Maria Garcia', 'Hans Mueller', 'Yuki Tanaka'];
    const startPositions = [[1, 1], [2, 1], [1, 3], [2, 3]];

    for (let i = 0; i < 4; i++) {
        soldiers.push({
            id: i,
            name: soldierNames[i],
            x: startPositions[i][0],
            y: startPositions[i][1],
            hp: 40 + Math.floor(Math.random() * 20),
            maxHp: 40 + Math.floor(Math.random() * 20),
            tu: 55 + Math.floor(Math.random() * 15),
            maxTu: 55 + Math.floor(Math.random() * 15),
            stamina: 50 + Math.floor(Math.random() * 20),
            maxStamina: 50 + Math.floor(Math.random() * 20),
            reactions: 40 + Math.floor(Math.random() * 30),
            firingAcc: 50 + Math.floor(Math.random() * 30),
            bravery: 30 + Math.floor(Math.random() * 40),
            morale: 100,
            kneeling: false,
            facing: 2, // 0-7 directions, 2 = right
            weapon: { ...WEAPONS.rifle, currentAmmo: 20 },
            grenades: 2,
            alive: true,
            panicked: false
        });
    }

    // Spawn aliens in UFO
    const alienPositions = [[14, 7], [15, 8], [13, 9], [16, 7], [15, 6]];
    const alienTypes = ['sectoid', 'sectoid', 'floater', 'sectoid', 'snakeman'];

    for (let i = 0; i < alienPositions.length; i++) {
        const type = ALIEN_TYPES[alienTypes[i]];
        aliens.push({
            id: i,
            type: alienTypes[i],
            name: type.name,
            x: alienPositions[i][0],
            y: alienPositions[i][1],
            hp: type.hp,
            maxHp: type.hp,
            tu: type.tu,
            maxTu: type.tu,
            reactions: type.reactions,
            armor: type.armor,
            damage: type.damage,
            acc: type.acc,
            color: type.color,
            facing: 6, // facing left
            alive: true,
            spotted: false
        });
    }

    selectedUnit = soldiers[0];
    updateVisibility();
}

// Input handling
function setupInput() {
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (selectedUnit && gameState === 'playing' && turn === 'player') {
            actionMode = 'move';
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === ' ' && gameState === 'menu') {
            startGame();
        }
        if (e.key === 'q' || e.key === 'Q') {
            showDebug = !showDebug;
        }
        if (gameState === 'playing' && turn === 'player') {
            if (e.key === '1') actionMode = 'move';
            if (e.key === '2') actionMode = 'snap';
            if (e.key === '3') actionMode = 'aimed';
            if (e.key === '4') actionMode = 'grenade';
            if (e.key === 'Tab') {
                e.preventDefault();
                selectNextSoldier();
            }
            if (e.key === 'Enter') {
                endPlayerTurn();
            }
            if (e.key === 'k' || e.key === 'K') {
                if (selectedUnit) {
                    toggleKneel(selectedUnit);
                }
            }
        }
        if (e.key === 'r' && (gameState === 'victory' || gameState === 'defeat')) {
            gameState = 'menu';
        }
    });
}

function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (gameState === 'menu') {
        startGame();
        return;
    }

    if (gameState !== 'playing' || turn !== 'player') return;

    // Check if clicking on map
    const tileX = Math.floor((mx - MAP_OFFSET_X) / TILE_SIZE);
    const tileY = Math.floor((my - MAP_OFFSET_Y) / TILE_SIZE);

    if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
        // Check if clicking on a soldier to select
        const clickedSoldier = soldiers.find(s => s.alive && s.x === tileX && s.y === tileY);
        if (clickedSoldier) {
            selectedUnit = clickedSoldier;
            actionMode = 'move';
            return;
        }

        // Check if clicking on alien to attack
        const clickedAlien = aliens.find(a => a.alive && a.spotted && a.x === tileX && a.y === tileY);

        if (selectedUnit && selectedUnit.alive) {
            if (actionMode === 'move' && !clickedAlien) {
                moveUnit(selectedUnit, tileX, tileY);
            } else if ((actionMode === 'snap' || actionMode === 'aimed') && clickedAlien) {
                fireWeapon(selectedUnit, clickedAlien, actionMode);
            } else if (actionMode === 'grenade' && selectedUnit.grenades > 0) {
                throwGrenade(selectedUnit, tileX, tileY);
            }
        }
    }

    // Check UI clicks
    checkUIClick(mx, my);
}

function checkUIClick(mx, my) {
    // Soldier list (left panel)
    for (let i = 0; i < soldiers.length; i++) {
        const sy = 60 + i * 70;
        if (mx >= 5 && mx <= 150 && my >= sy && my <= sy + 60 && soldiers[i].alive) {
            selectedUnit = soldiers[i];
            actionMode = 'move';
        }
    }

    // Action buttons (bottom)
    const buttonY = 560;
    const buttonW = 80;
    const buttons = ['Move', 'Snap', 'Aimed', 'Grenade'];
    for (let i = 0; i < buttons.length; i++) {
        const bx = MAP_OFFSET_X + i * (buttonW + 10);
        if (mx >= bx && mx <= bx + buttonW && my >= buttonY && my <= buttonY + 30) {
            actionMode = buttons[i].toLowerCase();
        }
    }

    // End turn button
    if (mx >= 700 && mx <= 790 && my >= buttonY && my <= buttonY + 30) {
        endPlayerTurn();
    }
}

function startGame() {
    gameState = 'playing';
    turn = 'player';
    turnNumber = 1;
    generateMap();
    spawnUnits();
    addMessage('Mission Start: Eliminate all aliens');
}

function selectNextSoldier() {
    if (!selectedUnit) {
        selectedUnit = soldiers.find(s => s.alive);
        return;
    }

    const currentIndex = soldiers.findIndex(s => s === selectedUnit);
    for (let i = 1; i <= soldiers.length; i++) {
        const nextIndex = (currentIndex + i) % soldiers.length;
        if (soldiers[nextIndex].alive && soldiers[nextIndex].tu > 0) {
            selectedUnit = soldiers[nextIndex];
            return;
        }
    }
}

function moveUnit(unit, targetX, targetY) {
    if (!map[targetY] || !map[targetY][targetX] || !map[targetY][targetX].walkable) return;

    // Check if occupied
    if (soldiers.some(s => s.alive && s.x === targetX && s.y === targetY) ||
        aliens.some(a => a.alive && a.x === targetX && a.y === targetY)) return;

    const path = findPath(unit.x, unit.y, targetX, targetY);
    if (!path || path.length === 0) return;

    // Calculate TU cost
    let tuCost = 0;
    for (const step of path) {
        const tile = map[step.y][step.x];
        tuCost += tile.type === 'bush' ? TU_COSTS.walkDifficult : TU_COSTS.walkFlat;
    }

    if (unit.tu < tuCost) {
        addMessage('Not enough TU!');
        return;
    }

    // Move unit
    unit.tu -= tuCost;
    unit.x = targetX;
    unit.y = targetY;

    // Update facing
    if (path.length > 0) {
        const lastStep = path[path.length - 1];
        const prevStep = path.length > 1 ? path[path.length - 2] : { x: unit.x, y: unit.y };
        unit.facing = getFacing(prevStep.x, prevStep.y, lastStep.x, lastStep.y);
    }

    updateVisibility();

    // Check for reaction fire
    checkReactionFire(unit);
}

function findPath(startX, startY, endX, endY) {
    // Simple A* pathfinding
    const openSet = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
    const closedSet = new Set();

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();

        if (current.x === endX && current.y === endY) {
            const path = [];
            let node = current;
            while (node.parent) {
                path.unshift({ x: node.x, y: node.y });
                node = node.parent;
            }
            return path;
        }

        closedSet.add(`${current.x},${current.y}`);

        const neighbors = [
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y },
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 }
        ];

        for (const neighbor of neighbors) {
            if (neighbor.x < 0 || neighbor.x >= MAP_WIDTH || neighbor.y < 0 || neighbor.y >= MAP_HEIGHT) continue;
            if (!map[neighbor.y][neighbor.x].walkable) continue;
            if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;
            if (soldiers.some(s => s.alive && s.x === neighbor.x && s.y === neighbor.y && !(s === selectedUnit))) continue;
            if (aliens.some(a => a.alive && a.x === neighbor.x && a.y === neighbor.y)) continue;

            const g = current.g + 1;
            const h = Math.abs(neighbor.x - endX) + Math.abs(neighbor.y - endY);
            const f = g + h;

            const existing = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
            if (!existing || g < existing.g) {
                if (existing) {
                    existing.g = g;
                    existing.f = f;
                    existing.parent = current;
                } else {
                    openSet.push({ x: neighbor.x, y: neighbor.y, g, h, f, parent: current });
                }
            }
        }
    }

    return null;
}

function getFacing(fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    if (dx > 0 && dy === 0) return 2;
    if (dx < 0 && dy === 0) return 6;
    if (dx === 0 && dy > 0) return 4;
    if (dx === 0 && dy < 0) return 0;
    if (dx > 0 && dy < 0) return 1;
    if (dx > 0 && dy > 0) return 3;
    if (dx < 0 && dy > 0) return 5;
    if (dx < 0 && dy < 0) return 7;
    return 0;
}

function fireWeapon(unit, target, mode) {
    const weapon = unit.weapon;
    const shotData = mode === 'snap' ? weapon.snap : weapon.aimed;

    if (!shotData) {
        addMessage('Cannot use that shot type!');
        return;
    }

    const tuCost = Math.floor(unit.maxTu * shotData.tu / 100);
    if (unit.tu < tuCost) {
        addMessage('Not enough TU!');
        return;
    }

    if (weapon.currentAmmo <= 0) {
        addMessage('Out of ammo!');
        return;
    }

    unit.tu -= tuCost;
    weapon.currentAmmo--;

    // Calculate hit chance
    let hitChance = (unit.firingAcc * shotData.acc / 100);
    if (unit.kneeling) hitChance *= 1.15;

    const distance = Math.abs(unit.x - target.x) + Math.abs(unit.y - target.y);
    hitChance -= distance * 2;
    hitChance = Math.max(5, Math.min(95, hitChance));

    // Face target
    unit.facing = getFacing(unit.x, unit.y, target.x, target.y);

    // Roll to hit
    const roll = Math.random() * 100;
    if (roll < hitChance) {
        // Hit!
        const damage = Math.floor(weapon.damage * (0.5 + Math.random() * 1.5));
        const finalDamage = Math.max(1, damage - target.armor);
        target.hp -= finalDamage;

        addAnimation('shot', unit.x, unit.y, target.x, target.y, '#ffff00');
        addAnimation('hit', target.x, target.y, null, null, '#ff4444');
        addMessage(`${unit.name} hits ${target.name} for ${finalDamage} damage!`);

        if (target.hp <= 0) {
            target.alive = false;
            addMessage(`${target.name} eliminated!`);
            checkVictory();
        }
    } else {
        addAnimation('shot', unit.x, unit.y, target.x + (Math.random() - 0.5) * 2, target.y + (Math.random() - 0.5) * 2, '#ffff00');
        addMessage(`${unit.name} misses!`);
    }
}

function throwGrenade(unit, targetX, targetY) {
    const distance = Math.abs(unit.x - targetX) + Math.abs(unit.y - targetY);
    if (distance > WEAPONS.grenade.range) {
        addMessage('Target too far!');
        return;
    }

    const tuCost = Math.floor(unit.maxTu * 0.25) + TU_COSTS.prime;
    if (unit.tu < tuCost) {
        addMessage('Not enough TU!');
        return;
    }

    unit.tu -= tuCost;
    unit.grenades--;

    addAnimation('grenade', unit.x, unit.y, targetX, targetY, '#44aa44');

    // Damage in radius
    setTimeout(() => {
        const radius = WEAPONS.grenade.radius;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const tx = targetX + dx;
                const ty = targetY + dy;
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist > radius) continue;

                const damage = Math.floor(WEAPONS.grenade.damage * (1 - dist / (radius + 1)));

                // Damage aliens
                for (const alien of aliens) {
                    if (alien.alive && alien.x === tx && alien.y === ty) {
                        const finalDamage = Math.max(1, damage - alien.armor);
                        alien.hp -= finalDamage;
                        addMessage(`Grenade hits ${alien.name} for ${finalDamage}!`);
                        if (alien.hp <= 0) {
                            alien.alive = false;
                            addMessage(`${alien.name} eliminated!`);
                        }
                    }
                }

                // Damage soldiers (friendly fire!)
                for (const soldier of soldiers) {
                    if (soldier.alive && soldier.x === tx && soldier.y === ty) {
                        soldier.hp -= damage;
                        addMessage(`Grenade hits ${soldier.name} for ${damage}!`);
                        if (soldier.hp <= 0) {
                            soldier.alive = false;
                            addMessage(`${soldier.name} KIA!`);
                        }
                    }
                }
            }
        }
        addAnimation('explosion', targetX, targetY, null, null, '#ff8844');
        checkVictory();
        checkDefeat();
    }, 500);
}

function toggleKneel(unit) {
    const cost = unit.kneeling ? TU_COSTS.stand : TU_COSTS.kneel;
    if (unit.tu < cost) {
        addMessage('Not enough TU!');
        return;
    }
    unit.tu -= cost;
    unit.kneeling = !unit.kneeling;
    addMessage(unit.kneeling ? `${unit.name} kneels` : `${unit.name} stands`);
}

function checkReactionFire(movingUnit) {
    for (const alien of aliens) {
        if (!alien.alive || alien.tu < 20) continue;

        // Check if alien can see moving unit
        if (!hasLineOfSight(alien.x, alien.y, movingUnit.x, movingUnit.y)) continue;

        // Reaction check
        const alienReaction = alien.reactions * alien.tu;
        const unitReaction = movingUnit.reactions * movingUnit.tu;

        if (alienReaction > unitReaction * 0.5) {
            // Reaction fire!
            const hitChance = Math.max(10, alien.acc - 20);
            const roll = Math.random() * 100;

            if (roll < hitChance) {
                const damage = Math.floor(alien.damage * (0.5 + Math.random() * 1.0));
                movingUnit.hp -= damage;
                addMessage(`Reaction fire! ${alien.name} hits ${movingUnit.name} for ${damage}!`);
                addAnimation('shot', alien.x, alien.y, movingUnit.x, movingUnit.y, '#ff4444');

                if (movingUnit.hp <= 0) {
                    movingUnit.alive = false;
                    addMessage(`${movingUnit.name} KIA!`);
                    checkDefeat();
                }
            } else {
                addMessage(`Reaction fire! ${alien.name} misses ${movingUnit.name}!`);
                addAnimation('shot', alien.x, alien.y, movingUnit.x + 1, movingUnit.y + 1, '#ff4444');
            }

            alien.tu -= 20;
            break; // Only one reaction per move
        }
    }
}

function hasLineOfSight(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let cx = x1, cy = y1;
    while (cx !== x2 || cy !== y2) {
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; cx += sx; }
        if (e2 < dx) { err += dx; cy += sy; }

        if (cx === x2 && cy === y2) break;
        if (map[cy] && map[cy][cx] && !map[cy][cx].walkable) return false;
    }
    return true;
}

function updateVisibility() {
    // Reset visibility
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            visibilityMap[y][x] = 0;
        }
    }

    // Calculate visibility from each soldier
    for (const soldier of soldiers) {
        if (!soldier.alive) continue;

        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const distance = Math.abs(x - soldier.x) + Math.abs(y - soldier.y);
                if (distance <= 12 && hasLineOfSight(soldier.x, soldier.y, x, y)) {
                    visibilityMap[y][x] = 2;
                } else if (distance <= 15) {
                    visibilityMap[y][x] = Math.max(visibilityMap[y][x], 1);
                }
            }
        }
    }

    // Update alien spotted status
    for (const alien of aliens) {
        alien.spotted = visibilityMap[alien.y][alien.x] === 2;
    }
}

function endPlayerTurn() {
    turn = 'enemy';
    addMessage('--- Enemy Turn ---');

    // Reset soldier TU
    for (const soldier of soldiers) {
        if (soldier.alive) {
            soldier.tu = soldier.maxTu;
        }
    }

    // Run enemy AI
    setTimeout(enemyTurn, 500);
}

function enemyTurn() {
    // Simple AI: each alien tries to move toward nearest soldier and shoot
    for (const alien of aliens) {
        if (!alien.alive) continue;

        alien.tu = alien.maxTu;

        // Find nearest visible soldier
        let nearestSoldier = null;
        let nearestDist = Infinity;

        for (const soldier of soldiers) {
            if (!soldier.alive) continue;
            if (!hasLineOfSight(alien.x, alien.y, soldier.x, soldier.y)) continue;

            const dist = Math.abs(alien.x - soldier.x) + Math.abs(alien.y - soldier.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestSoldier = soldier;
            }
        }

        if (nearestSoldier) {
            // Try to shoot if in range
            if (nearestDist <= 10 && alien.tu >= 25) {
                // Fire!
                const hitChance = Math.max(10, alien.acc - nearestDist * 2);
                const roll = Math.random() * 100;

                if (roll < hitChance) {
                    const damage = Math.floor(alien.damage * (0.5 + Math.random() * 1.0));
                    nearestSoldier.hp -= damage;
                    addMessage(`${alien.name} hits ${nearestSoldier.name} for ${damage}!`);
                    addAnimation('shot', alien.x, alien.y, nearestSoldier.x, nearestSoldier.y, '#ff4444');

                    if (nearestSoldier.hp <= 0) {
                        nearestSoldier.alive = false;
                        addMessage(`${nearestSoldier.name} KIA!`);
                    }
                } else {
                    addMessage(`${alien.name} misses ${nearestSoldier.name}!`);
                    addAnimation('shot', alien.x, alien.y, nearestSoldier.x + Math.random() - 0.5, nearestSoldier.y + Math.random() - 0.5, '#ff4444');
                }

                alien.tu -= 25;
            } else {
                // Move toward soldier
                const dx = nearestSoldier.x - alien.x;
                const dy = nearestSoldier.y - alien.y;
                let moveX = alien.x + Math.sign(dx);
                let moveY = alien.y + Math.sign(dy);

                // Prefer moving in one direction
                if (Math.abs(dx) > Math.abs(dy)) {
                    moveY = alien.y;
                } else {
                    moveX = alien.x;
                }

                if (map[moveY] && map[moveY][moveX] && map[moveY][moveX].walkable &&
                    !soldiers.some(s => s.alive && s.x === moveX && s.y === moveY) &&
                    !aliens.some(a => a.alive && a !== alien && a.x === moveX && a.y === moveY)) {

                    alien.x = moveX;
                    alien.y = moveY;
                    alien.tu -= TU_COSTS.walkFlat;
                }
            }
        }
    }

    checkDefeat();

    // End enemy turn
    setTimeout(() => {
        turn = 'player';
        turnNumber++;
        addMessage(`--- Turn ${turnNumber} ---`);
        updateVisibility();
    }, 1000);
}

function checkVictory() {
    if (aliens.every(a => !a.alive)) {
        gameState = 'victory';
        addMessage('MISSION COMPLETE! All aliens eliminated!');
    }
}

function checkDefeat() {
    if (soldiers.every(s => !s.alive)) {
        gameState = 'defeat';
        addMessage('MISSION FAILED! All soldiers KIA!');
    }
}

function addAnimation(type, x1, y1, x2, y2, color) {
    animations.push({
        type,
        x1: x1 * TILE_SIZE + MAP_OFFSET_X + TILE_SIZE/2,
        y1: y1 * TILE_SIZE + MAP_OFFSET_Y + TILE_SIZE/2,
        x2: x2 !== null ? x2 * TILE_SIZE + MAP_OFFSET_X + TILE_SIZE/2 : null,
        y2: y2 !== null ? y2 * TILE_SIZE + MAP_OFFSET_Y + TILE_SIZE/2 : null,
        color,
        time: type === 'explosion' ? 30 : 20,
        maxTime: type === 'explosion' ? 30 : 20
    });
}

function addMessage(text) {
    messages.push({ text, time: 300 });
    if (messages.length > 6) messages.shift();
}

// Game loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Update animations
    for (let i = animations.length - 1; i >= 0; i--) {
        animations[i].time--;
        if (animations[i].time <= 0) {
            animations.splice(i, 1);
        }
    }

    // Update messages
    messages = messages.filter(m => {
        m.time--;
        return m.time > 0;
    });
}

function render() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (gameState === 'menu') {
        renderMenu();
    } else {
        renderMap();
        renderUnits();
        renderAnimations();
        renderUI();
        if (showDebug) renderDebug();
        if (gameState === 'victory') renderVictory();
        if (gameState === 'defeat') renderDefeat();
    }
}

function renderMenu() {
    ctx.fillStyle = '#cccccc';
    ctx.font = 'bold 36px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('X-COM TACTICAL', WIDTH/2, 150);

    ctx.font = '18px "Courier New"';
    ctx.fillStyle = '#888899';
    ctx.fillText('UFO Crash Recovery Mission', WIDTH/2, 190);

    ctx.fillStyle = '#aabbcc';
    ctx.font = '16px "Courier New"';
    ctx.fillText('Press SPACE or Click to Start', WIDTH/2, 280);

    ctx.font = '14px "Courier New"';
    ctx.fillStyle = '#667788';
    ctx.fillText('Controls:', WIDTH/2, 350);
    ctx.fillText('Click - Select/Move/Attack', WIDTH/2, 375);
    ctx.fillText('1-4 - Select Action (Move/Snap/Aimed/Grenade)', WIDTH/2, 395);
    ctx.fillText('Tab - Next Soldier | K - Kneel | Enter - End Turn', WIDTH/2, 415);
    ctx.fillText('Q - Debug Overlay', WIDTH/2, 435);

    ctx.fillStyle = '#aabbcc';
    ctx.fillText('Objective: Eliminate all aliens', WIDTH/2, 500);
}

function renderMap() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map[y][x];
            const screenX = MAP_OFFSET_X + x * TILE_SIZE;
            const screenY = MAP_OFFSET_Y + y * TILE_SIZE;

            // Base tile
            let color = COLORS.grass;
            switch (tile.type) {
                case 'grass': color = (x + y) % 2 === 0 ? COLORS.grass : COLORS.grassDark; break;
                case 'dirt': color = COLORS.dirt; break;
                case 'road': color = COLORS.road; break;
                case 'wall': color = COLORS.wall; break;
                case 'floor': color = COLORS.floor; break;
                case 'door': color = '#5a5a3a'; break;
                case 'bush': color = '#3a5a3a'; break;
                case 'ufo_wall': color = '#2a3a4a'; break;
                case 'ufo_floor': color = '#3a4a5a'; break;
            }

            ctx.fillStyle = color;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Bush detail
            if (tile.type === 'bush') {
                ctx.fillStyle = '#4a6a4a';
                ctx.beginPath();
                ctx.arc(screenX + 16, screenY + 16, 10, 0, Math.PI * 2);
                ctx.fill();
            }

            // Grid lines
            ctx.strokeStyle = 'rgba(50, 60, 70, 0.5)';
            ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Fog of war
            if (visibilityMap[y][x] === 0) {
                ctx.fillStyle = COLORS.fog;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            } else if (visibilityMap[y][x] === 1) {
                ctx.fillStyle = COLORS.fogPartial;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Highlight valid moves/targets
    if (selectedUnit && gameState === 'playing' && turn === 'player') {
        if (actionMode === 'move') {
            // Highlight tiles within movement range
            const maxRange = Math.floor(selectedUnit.tu / TU_COSTS.walkFlat);
            for (let y = 0; y < MAP_HEIGHT; y++) {
                for (let x = 0; x < MAP_WIDTH; x++) {
                    const dist = Math.abs(x - selectedUnit.x) + Math.abs(y - selectedUnit.y);
                    if (dist <= maxRange && map[y][x].walkable && visibilityMap[y][x] > 0) {
                        ctx.fillStyle = COLORS.moveTile;
                        ctx.fillRect(MAP_OFFSET_X + x * TILE_SIZE, MAP_OFFSET_Y + y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    }
                }
            }
        } else if (actionMode === 'snap' || actionMode === 'aimed') {
            // Highlight spotted aliens
            for (const alien of aliens) {
                if (alien.alive && alien.spotted) {
                    ctx.fillStyle = COLORS.attackTile;
                    ctx.fillRect(MAP_OFFSET_X + alien.x * TILE_SIZE, MAP_OFFSET_Y + alien.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
}

function renderUnits() {
    // Render soldiers
    for (const soldier of soldiers) {
        if (!soldier.alive) continue;

        const screenX = MAP_OFFSET_X + soldier.x * TILE_SIZE;
        const screenY = MAP_OFFSET_Y + soldier.y * TILE_SIZE;

        // Selection highlight
        if (soldier === selectedUnit) {
            ctx.strokeStyle = COLORS.highlight;
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        }

        // Body
        ctx.fillStyle = soldier === selectedUnit ? COLORS.soldierSelected : COLORS.soldier;
        if (soldier.kneeling) {
            ctx.fillRect(screenX + 6, screenY + 12, 20, 16);
        } else {
            ctx.fillRect(screenX + 8, screenY + 4, 16, 24);
        }

        // Head
        ctx.fillStyle = '#ddccaa';
        ctx.beginPath();
        ctx.arc(screenX + 16, screenY + 8, 5, 0, Math.PI * 2);
        ctx.fill();

        // Facing indicator
        const facingAngles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];
        const angle = facingAngles[soldier.facing] - Math.PI/2;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX + 16, screenY + 16);
        ctx.lineTo(screenX + 16 + Math.cos(angle) * 10, screenY + 16 + Math.sin(angle) * 10);
        ctx.stroke();
    }

    // Render aliens
    for (const alien of aliens) {
        if (!alien.alive || !alien.spotted) continue;

        const screenX = MAP_OFFSET_X + alien.x * TILE_SIZE;
        const screenY = MAP_OFFSET_Y + alien.y * TILE_SIZE;

        // Body
        ctx.fillStyle = alien.color;
        if (alien.type === 'sectoid') {
            // Small grey alien
            ctx.beginPath();
            ctx.ellipse(screenX + 16, screenY + 20, 8, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            // Big head
            ctx.fillStyle = '#aabbaa';
            ctx.beginPath();
            ctx.ellipse(screenX + 16, screenY + 10, 10, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#111111';
            ctx.beginPath();
            ctx.ellipse(screenX + 12, screenY + 10, 3, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(screenX + 20, screenY + 10, 3, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (alien.type === 'floater') {
            // Floating cyborg
            ctx.fillRect(screenX + 8, screenY + 8, 16, 20);
            ctx.fillStyle = '#666666';
            ctx.fillRect(screenX + 10, screenY + 20, 12, 8);
            // Head
            ctx.fillStyle = '#998888';
            ctx.beginPath();
            ctx.arc(screenX + 16, screenY + 10, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (alien.type === 'snakeman') {
            // Snake-like alien
            ctx.fillRect(screenX + 10, screenY + 4, 12, 24);
            // Scales pattern
            ctx.fillStyle = '#99bb55';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(screenX + 12, screenY + 6 + i * 6, 8, 3);
            }
            // Head
            ctx.fillStyle = '#aabb66';
            ctx.beginPath();
            ctx.arc(screenX + 16, screenY + 8, 7, 0, Math.PI * 2);
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(screenX + 12, screenY + 6, 3, 2);
            ctx.fillRect(screenX + 17, screenY + 6, 3, 2);
        }

        // HP bar
        const hpPercent = alien.hp / alien.maxHp;
        ctx.fillStyle = '#222';
        ctx.fillRect(screenX, screenY - 4, TILE_SIZE, 3);
        ctx.fillStyle = hpPercent > 0.5 ? '#44aa44' : (hpPercent > 0.25 ? '#aaaa44' : '#aa4444');
        ctx.fillRect(screenX, screenY - 4, TILE_SIZE * hpPercent, 3);
    }
}

function renderAnimations() {
    for (const anim of animations) {
        const progress = 1 - anim.time / anim.maxTime;

        if (anim.type === 'shot') {
            ctx.strokeStyle = anim.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(anim.x1, anim.y1);
            ctx.lineTo(
                anim.x1 + (anim.x2 - anim.x1) * progress,
                anim.y1 + (anim.y2 - anim.y1) * progress
            );
            ctx.stroke();
        } else if (anim.type === 'hit') {
            ctx.fillStyle = anim.color;
            ctx.globalAlpha = 1 - progress;
            ctx.beginPath();
            ctx.arc(anim.x1, anim.y1, 10 + progress * 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else if (anim.type === 'explosion') {
            const size = 20 + progress * 40;
            ctx.fillStyle = `rgba(255, ${100 + Math.floor((1-progress) * 100)}, 0, ${1 - progress})`;
            ctx.beginPath();
            ctx.arc(anim.x1, anim.y1, size, 0, Math.PI * 2);
            ctx.fill();
        } else if (anim.type === 'grenade') {
            const x = anim.x1 + (anim.x2 - anim.x1) * progress;
            const y = anim.y1 + (anim.y2 - anim.y1) * progress - Math.sin(progress * Math.PI) * 30;
            ctx.fillStyle = anim.color;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function renderUI() {
    // Left panel - soldier list
    ctx.fillStyle = COLORS.ui;
    ctx.fillRect(0, 0, 155, HEIGHT);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(0, 0, 155, HEIGHT);

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 14px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText('SOLDIERS', 10, 25);

    ctx.font = '11px "Courier New"';
    for (let i = 0; i < soldiers.length; i++) {
        const soldier = soldiers[i];
        const sy = 45 + i * 70;

        // Selection background
        if (soldier === selectedUnit) {
            ctx.fillStyle = '#2a3a4a';
            ctx.fillRect(5, sy - 5, 145, 65);
        }

        // Status
        ctx.fillStyle = soldier.alive ? COLORS.text : '#aa4444';
        ctx.fillText(soldier.name.split(' ')[0], 10, sy + 12);

        if (soldier.alive) {
            // HP bar
            ctx.fillStyle = '#333';
            ctx.fillRect(10, sy + 18, 80, 8);
            ctx.fillStyle = COLORS.healthBar;
            ctx.fillRect(10, sy + 18, 80 * (soldier.hp / soldier.maxHp), 8);

            // TU bar
            ctx.fillStyle = '#333';
            ctx.fillRect(10, sy + 30, 80, 8);
            ctx.fillStyle = COLORS.tuBar;
            ctx.fillRect(10, sy + 30, 80 * (soldier.tu / soldier.maxTu), 8);

            // Stats text
            ctx.fillStyle = COLORS.textDim;
            ctx.font = '10px "Courier New"';
            ctx.fillText(`HP:${soldier.hp}/${soldier.maxHp}`, 95, sy + 25);
            ctx.fillText(`TU:${soldier.tu}/${soldier.maxTu}`, 95, sy + 37);
            ctx.font = '11px "Courier New"';
        } else {
            ctx.fillStyle = '#aa4444';
            ctx.fillText('KIA', 10, sy + 30);
        }
    }

    // Turn indicator
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(0, 400, 155, 60);
    ctx.fillStyle = turn === 'player' ? '#44aa44' : '#aa4444';
    ctx.font = 'bold 14px "Courier New"';
    ctx.fillText(turn === 'player' ? 'YOUR TURN' : 'ENEMY TURN', 10, 425);
    ctx.fillStyle = COLORS.text;
    ctx.font = '12px "Courier New"';
    ctx.fillText(`Turn ${turnNumber}`, 10, 445);

    // Bottom panel - actions and info
    ctx.fillStyle = COLORS.ui;
    ctx.fillRect(MAP_OFFSET_X, HEIGHT - 80, WIDTH - MAP_OFFSET_X, 80);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(MAP_OFFSET_X, HEIGHT - 80, WIDTH - MAP_OFFSET_X, 80);

    // Action buttons
    const buttonY = 535;
    const buttonW = 70;
    const buttons = [
        { name: 'Move', mode: 'move', key: '1' },
        { name: 'Snap', mode: 'snap', key: '2' },
        { name: 'Aimed', mode: 'aimed', key: '3' },
        { name: 'Grenade', mode: 'grenade', key: '4' }
    ];

    for (let i = 0; i < buttons.length; i++) {
        const bx = MAP_OFFSET_X + 10 + i * (buttonW + 10);
        ctx.fillStyle = actionMode === buttons[i].mode ? '#3a5a6a' : '#2a3a4a';
        ctx.fillRect(bx, buttonY, buttonW, 25);
        ctx.strokeStyle = COLORS.uiBorder;
        ctx.strokeRect(bx, buttonY, buttonW, 25);

        ctx.fillStyle = COLORS.text;
        ctx.font = '11px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(`${buttons[i].key}:${buttons[i].name}`, bx + buttonW/2, buttonY + 17);
    }

    // End turn button
    ctx.fillStyle = '#4a3a3a';
    ctx.fillRect(700, buttonY, 90, 25);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(700, buttonY, 90, 25);
    ctx.fillStyle = COLORS.text;
    ctx.fillText('END TURN', 745, buttonY + 17);

    ctx.textAlign = 'left';

    // Selected unit info
    if (selectedUnit && selectedUnit.alive) {
        ctx.fillStyle = COLORS.text;
        ctx.font = '12px "Courier New"';
        ctx.fillText(`Selected: ${selectedUnit.name}`, MAP_OFFSET_X + 10, HEIGHT - 65);
        ctx.fillText(`Weapon: ${selectedUnit.weapon.name} (${selectedUnit.weapon.currentAmmo}/${selectedUnit.weapon.ammo})`, MAP_OFFSET_X + 10, HEIGHT - 50);
        ctx.fillText(`Grenades: ${selectedUnit.grenades}`, MAP_OFFSET_X + 10, HEIGHT - 35);
        ctx.fillText(`Accuracy: ${selectedUnit.firingAcc}%`, MAP_OFFSET_X + 250, HEIGHT - 65);
        ctx.fillText(`Reactions: ${selectedUnit.reactions}`, MAP_OFFSET_X + 250, HEIGHT - 50);
        ctx.fillText(selectedUnit.kneeling ? '[Kneeling]' : '[Standing]', MAP_OFFSET_X + 250, HEIGHT - 35);
    }

    // Messages
    ctx.fillStyle = COLORS.ui;
    ctx.fillRect(MAP_OFFSET_X, HEIGHT - 180, WIDTH - MAP_OFFSET_X, 95);

    ctx.font = '11px "Courier New"';
    for (let i = 0; i < messages.length; i++) {
        const alpha = Math.min(1, messages[i].time / 60);
        ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
        ctx.fillText(messages[i].text, MAP_OFFSET_X + 5, HEIGHT - 170 + i * 14);
    }
}

function renderDebug() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(MAP_OFFSET_X + 5, MAP_OFFSET_Y + 5, 200, 160);

    ctx.fillStyle = '#44ff44';
    ctx.font = '10px "Courier New"';
    ctx.textAlign = 'left';

    const lines = [
        `State: ${gameState}`,
        `Turn: ${turn} #${turnNumber}`,
        `Action: ${actionMode}`,
        `Soldiers: ${soldiers.filter(s => s.alive).length}/${soldiers.length}`,
        `Aliens: ${aliens.filter(a => a.alive).length}/${aliens.length}`,
        `Spotted: ${aliens.filter(a => a.alive && a.spotted).length}`,
        selectedUnit ? `Selected: ${selectedUnit.name}` : 'Selected: None',
        selectedUnit ? `TU: ${selectedUnit.tu}/${selectedUnit.maxTu}` : '',
        selectedUnit ? `HP: ${selectedUnit.hp}/${selectedUnit.maxHp}` : '',
        selectedUnit ? `Pos: ${selectedUnit.x},${selectedUnit.y}` : '',
        `Animations: ${animations.length}`,
        `Messages: ${messages.length}`
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, MAP_OFFSET_X + 10, MAP_OFFSET_Y + 20 + i * 12);
    });
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 50, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 36px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION COMPLETE', WIDTH/2, HEIGHT/2 - 40);

    ctx.font = '18px "Courier New"';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('All aliens eliminated!', WIDTH/2, HEIGHT/2);

    const survivors = soldiers.filter(s => s.alive).length;
    ctx.fillText(`Soldiers survived: ${survivors}/4`, WIDTH/2, HEIGHT/2 + 30);

    ctx.font = '14px "Courier New"';
    ctx.fillStyle = '#888899';
    ctx.fillText('Press R to return to menu', WIDTH/2, HEIGHT/2 + 80);
}

function renderDefeat() {
    ctx.fillStyle = 'rgba(50, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 36px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION FAILED', WIDTH/2, HEIGHT/2 - 40);

    ctx.font = '18px "Courier New"';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('All soldiers KIA', WIDTH/2, HEIGHT/2);

    const aliensLeft = aliens.filter(a => a.alive).length;
    ctx.fillText(`Aliens remaining: ${aliensLeft}`, WIDTH/2, HEIGHT/2 + 30);

    ctx.font = '14px "Courier New"';
    ctx.fillStyle = '#888899';
    ctx.fillText('Press R to return to menu', WIDTH/2, HEIGHT/2 + 80);
}

// Start
init();
