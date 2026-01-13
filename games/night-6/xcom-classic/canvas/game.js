// X-COM Classic Clone - Turn-Based Tactical Combat
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 15;

// TU costs
const TU_WALK = 4;
const TU_WALK_DIAGONAL = 6;
const TU_TURN = 1;
const TU_KNEEL = 4;
const TU_STAND = 8;
const TU_RELOAD = 15;

// Game state
let gameState = 'menu'; // menu, playing, gameover, victory
let gamePaused = true;
let turnNumber = 1;
let currentPhase = 'player'; // player, alien
let selectedSoldier = null;
let selectedFireMode = 'snap';
let hoveredTile = null;

// Units
let soldiers = [];
let aliens = [];
let deadUnits = [];

// Map
let map = [];
let visibleTiles = [];

// Stats
let stats = {
    aliensKilled: 0,
    soldiersLost: 0,
    shotsFired: 0,
    shotsHit: 0
};

// Messages
let messages = [];

// Camera
let cameraX = 0, cameraY = 0;

// Weapon definitions
const WEAPONS = {
    rifle: {
        name: 'Rifle',
        damage: 30,
        snap: { accuracy: 60, tuPercent: 25 },
        aimed: { accuracy: 110, tuPercent: 80 },
        auto: { accuracy: 35, tuPercent: 35, shots: 3 },
        ammo: 20,
        maxAmmo: 20
    },
    pistol: {
        name: 'Pistol',
        damage: 26,
        snap: { accuracy: 30, tuPercent: 18 },
        aimed: { accuracy: 78, tuPercent: 30 },
        auto: null,
        ammo: 12,
        maxAmmo: 12
    },
    plasmaRifle: {
        name: 'Plasma Rifle',
        damage: 80,
        snap: { accuracy: 86, tuPercent: 30 },
        aimed: { accuracy: 100, tuPercent: 60 },
        auto: { accuracy: 55, tuPercent: 36, shots: 3 },
        ammo: 28,
        maxAmmo: 28
    }
};

// Alien types
const ALIEN_TYPES = {
    sectoid: {
        name: 'Sectoid',
        hp: 30,
        tu: 54,
        reactions: 63,
        accuracy: 50,
        damage: 52,
        color: '#8a8',
        size: 24
    },
    floater: {
        name: 'Floater',
        hp: 40,
        tu: 60,
        reactions: 55,
        accuracy: 45,
        damage: 80,
        color: '#a66',
        size: 28
    },
    muton: {
        name: 'Muton',
        hp: 125,
        tu: 60,
        reactions: 68,
        accuracy: 60,
        damage: 115,
        color: '#6a6',
        size: 32
    }
};

// Generate map
function generateMap() {
    map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Create varied terrain
            let terrain = 'ground';
            const rand = Math.random();

            // Walls and buildings
            if (rand < 0.08) {
                terrain = 'wall';
            } else if (rand < 0.15) {
                terrain = 'cover'; // crates, rocks
            } else if (rand < 0.2) {
                terrain = 'bush';
            }

            // Ensure edges have some walls
            if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                if (Math.random() < 0.3) terrain = 'wall';
            }

            map[y][x] = {
                terrain,
                visible: false,
                explored: false,
                unit: null
            };
        }
    }

    // Clear spawn areas
    for (let y = MAP_HEIGHT - 4; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < 6; x++) {
            if (map[y][x].terrain === 'wall') map[y][x].terrain = 'ground';
        }
    }
    for (let y = 0; y < 4; y++) {
        for (let x = MAP_WIDTH - 6; x < MAP_WIDTH; x++) {
            if (map[y][x].terrain === 'wall') map[y][x].terrain = 'ground';
        }
    }
}

// Create soldier
function createSoldier(x, y, name) {
    const baseTU = 50 + Math.floor(Math.random() * 15);
    return {
        type: 'soldier',
        name,
        x, y,
        facing: 0, // 0-7 (8 directions)
        hp: 30 + Math.floor(Math.random() * 10),
        maxHp: 30 + Math.floor(Math.random() * 10),
        tu: baseTU,
        maxTu: baseTU,
        reactions: 40 + Math.floor(Math.random() * 20),
        firingAccuracy: 50 + Math.floor(Math.random() * 20),
        stance: 'standing', // standing, kneeling
        weapon: { ...WEAPONS.rifle },
        morale: 100,
        alive: true
    };
}

// Create alien
function createAlien(x, y, type) {
    const def = ALIEN_TYPES[type];
    return {
        type: 'alien',
        alienType: type,
        name: def.name,
        x, y,
        facing: Math.floor(Math.random() * 8),
        hp: def.hp,
        maxHp: def.hp,
        tu: def.tu,
        maxTu: def.tu,
        reactions: def.reactions,
        firingAccuracy: def.accuracy,
        damage: def.damage,
        color: def.color,
        size: def.size,
        stance: 'standing',
        alive: true,
        state: 'patrol', // patrol, hunt, attack
        patrolTarget: null
    };
}

// Initialize game
function initGame() {
    generateMap();
    soldiers = [];
    aliens = [];
    deadUnits = [];
    stats = { aliensKilled: 0, soldiersLost: 0, shotsFired: 0, shotsHit: 0 };
    turnNumber = 1;
    currentPhase = 'player';

    // Spawn soldiers
    const soldierNames = ['Rookie Adams', 'Squaddie Brown', 'Sgt. Chen', 'Cpl. Davis'];
    for (let i = 0; i < 4; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * 5);
            y = MAP_HEIGHT - 3 + Math.floor(Math.random() * 2);
        } while (map[y][x].terrain === 'wall' || map[y][x].unit);

        const soldier = createSoldier(x, y, soldierNames[i]);
        soldiers.push(soldier);
        map[y][x].unit = soldier;
    }

    // Spawn aliens
    const alienCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < alienCount; i++) {
        let x, y;
        do {
            x = MAP_WIDTH - 6 + Math.floor(Math.random() * 5);
            y = 1 + Math.floor(Math.random() * 4);
        } while (map[y][x].terrain === 'wall' || map[y][x].unit);

        const types = ['sectoid', 'sectoid', 'floater'];
        const alien = createAlien(x, y, types[Math.floor(Math.random() * types.length)]);
        aliens.push(alien);
        map[y][x].unit = alien;
    }

    selectedSoldier = soldiers[0];
    updateVisibility();
    messages = [];
    showMessage('Mission started. Eliminate all alien hostiles.');
}

// Update fog of war
function updateVisibility() {
    // Reset visibility
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x].visible = false;
        }
    }

    // Calculate visibility for each soldier
    for (const soldier of soldiers) {
        if (!soldier.alive) continue;

        const range = 12;
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const tx = soldier.x + dx;
                const ty = soldier.y + dy;

                if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) continue;
                if (Math.abs(dx) + Math.abs(dy) > range) continue;

                // Simple LOS check
                if (hasLineOfSight(soldier.x, soldier.y, tx, ty)) {
                    map[ty][tx].visible = true;
                    map[ty][tx].explored = true;
                }
            }
        }
    }
}

// Line of sight check
function hasLineOfSight(x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0, y = y0;
    while (x !== x1 || y !== y1) {
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }

        if (x === x1 && y === y1) break;
        if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
        if (map[y][x].terrain === 'wall') return false;
    }
    return true;
}

// Calculate TU cost for movement
function getMoveCost(fromX, fromY, toX, toY) {
    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);

    if (dx > 1 || dy > 1) return -1; // Can only move 1 tile
    if (dx === 0 && dy === 0) return 0;

    const diagonal = dx === 1 && dy === 1;
    const baseCost = diagonal ? TU_WALK_DIAGONAL : TU_WALK;

    // Terrain modifiers
    const terrain = map[toY][toX].terrain;
    if (terrain === 'wall') return -1;
    if (terrain === 'bush') return baseCost + 2;
    if (terrain === 'cover') return baseCost + 1;

    return baseCost;
}

// Path finding (simple BFS)
function findPath(startX, startY, endX, endY) {
    const queue = [{ x: startX, y: startY, path: [], cost: 0 }];
    const visited = new Set();
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
        const current = queue.shift();

        if (current.x === endX && current.y === endY) {
            return { path: current.path, cost: current.cost };
        }

        // Check all 8 directions
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;

                const nx = current.x + dx;
                const ny = current.y + dy;
                const key = `${nx},${ny}`;

                if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
                if (visited.has(key)) continue;

                const moveCost = getMoveCost(current.x, current.y, nx, ny);
                if (moveCost < 0) continue;
                if (map[ny][nx].unit && !(nx === endX && ny === endY)) continue;

                visited.add(key);
                queue.push({
                    x: nx,
                    y: ny,
                    path: [...current.path, { x: nx, y: ny }],
                    cost: current.cost + moveCost
                });
            }
        }
    }

    return null;
}

// Move unit
function moveUnit(unit, toX, toY) {
    if (!unit.alive) return false;

    const pathResult = findPath(unit.x, unit.y, toX, toY);
    if (!pathResult) return false;

    if (pathResult.cost > unit.tu) {
        showMessage('Not enough TU');
        return false;
    }

    // Check if destination is blocked
    if (map[toY][toX].unit && map[toY][toX].unit !== unit) {
        return false;
    }

    // Move along path (simplified - instant move for now)
    map[unit.y][unit.x].unit = null;
    unit.x = toX;
    unit.y = toY;
    unit.tu -= pathResult.cost;
    map[toY][toX].unit = unit;

    // Check for reaction fire from aliens
    if (unit.type === 'soldier') {
        checkReactionFire(unit, pathResult.cost);
    }

    updateVisibility();
    return true;
}

// Check for reaction fire
function checkReactionFire(movingUnit, tuSpent) {
    const reactors = movingUnit.type === 'soldier' ? aliens : soldiers;

    for (const reactor of reactors) {
        if (!reactor.alive) continue;
        if (reactor.tu < reactor.maxTu * 0.25) continue; // Need 25% TU for snap shot

        // Check LOS
        if (!hasLineOfSight(reactor.x, reactor.y, movingUnit.x, movingUnit.y)) continue;

        // Reaction check
        const reactorScore = reactor.reactions * reactor.tu;
        const moverScore = movingUnit.reactions * tuSpent;

        if (reactorScore > moverScore) {
            showMessage(`${reactor.name} reaction fire!`);
            fireWeapon(reactor, movingUnit, 'snap');
        }
    }
}

// Fire weapon
function fireWeapon(shooter, target, mode) {
    if (!shooter.alive || !target.alive) return false;

    const weapon = shooter.weapon || { damage: shooter.damage, snap: { accuracy: 60, tuPercent: 25 } };
    const fireMode = weapon[mode];
    if (!fireMode) return false;

    const tuCost = Math.floor(shooter.maxTu * fireMode.tuPercent / 100);
    if (shooter.tu < tuCost) {
        showMessage('Not enough TU');
        return false;
    }

    // Check ammo
    if (weapon.ammo !== undefined && weapon.ammo <= 0) {
        showMessage('Out of ammo!');
        return false;
    }

    shooter.tu -= tuCost;
    stats.shotsFired++;

    const shots = fireMode.shots || 1;
    let hitsLanded = 0;

    for (let i = 0; i < shots; i++) {
        if (weapon.ammo !== undefined) weapon.ammo--;
        if (!target.alive) break;

        // Calculate hit chance
        let accuracy = shooter.firingAccuracy * (fireMode.accuracy / 100);

        // Modifiers
        if (shooter.stance === 'kneeling') accuracy *= 1.15;
        const distance = Math.abs(target.x - shooter.x) + Math.abs(target.y - shooter.y);
        accuracy -= distance * 2; // Range penalty

        // Roll to hit
        const roll = Math.random() * 100;
        if (roll < accuracy) {
            // Hit!
            stats.shotsHit++;
            hitsLanded++;

            const damage = Math.floor(weapon.damage * (0.5 + Math.random() * 1.5));
            target.hp -= damage;

            showMessage(`${shooter.name} hits ${target.name} for ${damage} damage!`);

            if (target.hp <= 0) {
                target.alive = false;
                map[target.y][target.x].unit = null;
                deadUnits.push(target);

                if (target.type === 'alien') {
                    stats.aliensKilled++;
                    showMessage(`${target.name} eliminated!`);
                } else {
                    stats.soldiersLost++;
                    showMessage(`${target.name} KIA!`);
                }
            }
        } else {
            showMessage(`${shooter.name} misses!`);
        }
    }

    return true;
}

// Toggle kneel
function toggleKneel(unit) {
    if (!unit.alive) return false;

    if (unit.stance === 'standing') {
        if (unit.tu < TU_KNEEL) {
            showMessage('Not enough TU');
            return false;
        }
        unit.tu -= TU_KNEEL;
        unit.stance = 'kneeling';
        showMessage(`${unit.name} kneels`);
    } else {
        if (unit.tu < TU_STAND) {
            showMessage('Not enough TU');
            return false;
        }
        unit.tu -= TU_STAND;
        unit.stance = 'standing';
        showMessage(`${unit.name} stands`);
    }
    return true;
}

// Reload weapon
function reloadWeapon(unit) {
    if (!unit.weapon) return false;
    if (unit.tu < TU_RELOAD) {
        showMessage('Not enough TU');
        return false;
    }
    if (unit.weapon.ammo === unit.weapon.maxAmmo) {
        showMessage('Already fully loaded');
        return false;
    }

    unit.tu -= TU_RELOAD;
    unit.weapon.ammo = unit.weapon.maxAmmo;
    showMessage(`${unit.name} reloads`);
    return true;
}

// AI turn
async function runAlienTurn() {
    currentPhase = 'alien';
    document.getElementById('phase-display').textContent = 'ALIEN TURN';
    document.getElementById('phase-display').style.color = '#f44';

    for (const alien of aliens) {
        if (!alien.alive) continue;

        // Reset TU
        alien.tu = alien.maxTu;

        // Find closest visible soldier
        let closestSoldier = null;
        let closestDist = Infinity;

        for (const soldier of soldiers) {
            if (!soldier.alive) continue;
            if (!hasLineOfSight(alien.x, alien.y, soldier.x, soldier.y)) continue;

            const dist = Math.abs(soldier.x - alien.x) + Math.abs(soldier.y - alien.y);
            if (dist < closestDist) {
                closestDist = dist;
                closestSoldier = soldier;
            }
        }

        if (closestSoldier) {
            // Try to shoot
            if (closestDist <= 15 && alien.tu >= alien.maxTu * 0.25) {
                fireWeapon(alien, closestSoldier, 'snap');
                await sleep(300);
            }

            // Move toward soldier if far
            if (closestDist > 5 && alien.tu >= TU_WALK) {
                const dx = Math.sign(closestSoldier.x - alien.x);
                const dy = Math.sign(closestSoldier.y - alien.y);
                const newX = alien.x + dx;
                const newY = alien.y + dy;

                if (newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT) {
                    if (!map[newY][newX].unit && map[newY][newX].terrain !== 'wall') {
                        map[alien.y][alien.x].unit = null;
                        alien.x = newX;
                        alien.y = newY;
                        alien.tu -= TU_WALK;
                        map[newY][newX].unit = alien;
                    }
                }
                await sleep(200);
            }

            // Try another shot if TU remaining
            if (alien.tu >= alien.maxTu * 0.25 && closestSoldier.alive) {
                fireWeapon(alien, closestSoldier, 'snap');
                await sleep(300);
            }
        } else {
            // Patrol randomly
            if (alien.tu >= TU_WALK) {
                const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                const dir = dirs[Math.floor(Math.random() * dirs.length)];
                const newX = alien.x + dir[0];
                const newY = alien.y + dir[1];

                if (newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT) {
                    if (!map[newY][newX].unit && map[newY][newX].terrain !== 'wall') {
                        map[alien.y][alien.x].unit = null;
                        alien.x = newX;
                        alien.y = newY;
                        alien.tu -= TU_WALK;
                        map[newY][newX].unit = alien;
                    }
                }
            }
        }
    }

    // End alien turn
    await sleep(500);
    startPlayerTurn();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Start player turn
function startPlayerTurn() {
    turnNumber++;
    currentPhase = 'player';
    document.getElementById('phase-display').textContent = 'YOUR TURN';
    document.getElementById('phase-display').style.color = '#0af';

    // Restore TU
    for (const soldier of soldiers) {
        if (soldier.alive) {
            soldier.tu = soldier.maxTu;
        }
    }

    // Select first alive soldier
    selectedSoldier = soldiers.find(s => s.alive) || null;
    updateVisibility();
    checkWinConditions();
}

// End player turn
function endPlayerTurn() {
    if (currentPhase !== 'player') return;
    showMessage('Ending turn...');
    runAlienTurn();
}

// Select next soldier
function selectNextSoldier() {
    const aliveSoldiers = soldiers.filter(s => s.alive);
    if (aliveSoldiers.length === 0) return;

    const currentIndex = aliveSoldiers.indexOf(selectedSoldier);
    const nextIndex = (currentIndex + 1) % aliveSoldiers.length;
    selectedSoldier = aliveSoldiers[nextIndex];
}

// Check win/lose conditions
function checkWinConditions() {
    const aliensAlive = aliens.filter(a => a.alive).length;
    const soldiersAlive = soldiers.filter(s => s.alive).length;

    if (aliensAlive === 0) {
        victory();
    } else if (soldiersAlive === 0) {
        gameOver();
    }
}

function victory() {
    gameState = 'victory';
    gamePaused = true;
    document.getElementById('victory-stats').innerHTML = `
        Turns: ${turnNumber}<br>
        Aliens Killed: ${stats.aliensKilled}<br>
        Soldiers Lost: ${stats.soldiersLost}<br>
        Accuracy: ${stats.shotsFired > 0 ? Math.floor(stats.shotsHit / stats.shotsFired * 100) : 0}%
    `;
    document.getElementById('victory-overlay').classList.remove('hidden');
}

function gameOver() {
    gameState = 'gameover';
    gamePaused = true;
    document.getElementById('fail-stats').innerHTML = `
        Turns: ${turnNumber}<br>
        Aliens Killed: ${stats.aliensKilled}<br>
        Soldiers Lost: ${stats.soldiersLost}
    `;
    document.getElementById('gameover-overlay').classList.remove('hidden');
}

// Show message
function showMessage(text) {
    messages.unshift({ text, time: 3000 });
    if (messages.length > 5) messages.pop();
    updateMessages();
}

function updateMessages() {
    const el = document.getElementById('messages');
    el.innerHTML = messages.map(m => `<div class="message">${m.text}</div>`).join('');
}

// Update HUD
function updateHUD() {
    const soldier = selectedSoldier;

    if (soldier && soldier.alive) {
        document.getElementById('soldier-name').textContent = soldier.name;
        document.getElementById('stat-tu').textContent = `${soldier.tu}/${soldier.maxTu}`;
        document.getElementById('stat-hp').textContent = `${soldier.hp}/${soldier.maxHp}`;
        document.getElementById('stat-acc').textContent = soldier.firingAccuracy;
        document.getElementById('tu-fill').style.width = `${(soldier.tu / soldier.maxTu) * 100}%`;

        if (soldier.weapon) {
            document.getElementById('stat-weapon').textContent = soldier.weapon.name;
            document.getElementById('stat-ammo').textContent = soldier.weapon.ammo !== undefined ? soldier.weapon.ammo : 'Inf';
        }

        document.getElementById('btn-kneel').querySelector('span:nth-child(2)').textContent =
            soldier.stance === 'standing' ? 'KNEEL' : 'STAND';
    } else {
        document.getElementById('soldier-name').textContent = 'No soldier selected';
        document.getElementById('stat-tu').textContent = '0/0';
        document.getElementById('stat-hp').textContent = '0/0';
        document.getElementById('stat-acc').textContent = '0';
        document.getElementById('tu-fill').style.width = '0%';
    }

    document.getElementById('turn-number').textContent = turnNumber;
    document.getElementById('alien-count').textContent = aliens.filter(a => a.alive).length;
}

// Input handling
let mouseX = 0, mouseY = 0;

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    // Calculate hovered tile
    const tileX = Math.floor((mouseX + cameraX) / TILE_SIZE);
    const tileY = Math.floor((mouseY + cameraY) / TILE_SIZE);

    if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
        hoveredTile = { x: tileX, y: tileY };
    } else {
        hoveredTile = null;
    }
});

canvas.addEventListener('click', e => {
    if (gameState !== 'playing' || currentPhase !== 'player') return;
    if (!hoveredTile) return;

    const tile = map[hoveredTile.y][hoveredTile.x];

    // Check if clicking on alien
    if (tile.unit && tile.unit.type === 'alien' && tile.visible && selectedSoldier) {
        fireWeapon(selectedSoldier, tile.unit, selectedFireMode);
        checkWinConditions();
        return;
    }

    // Check if clicking on own soldier
    if (tile.unit && tile.unit.type === 'soldier') {
        selectedSoldier = tile.unit;
        return;
    }

    // Move selected soldier
    if (selectedSoldier && !tile.unit && tile.terrain !== 'wall') {
        moveUnit(selectedSoldier, hoveredTile.x, hoveredTile.y);
    }
});

// Keyboard input
document.addEventListener('keydown', e => {
    if (gameState !== 'playing') return;

    switch (e.key.toLowerCase()) {
        case 'tab':
            e.preventDefault();
            selectNextSoldier();
            break;
        case 'enter':
            if (currentPhase === 'player') endPlayerTurn();
            break;
        case 'k':
            if (selectedSoldier) toggleKneel(selectedSoldier);
            break;
        case '1':
            selectedFireMode = 'snap';
            updateFireModeUI();
            break;
        case '2':
            selectedFireMode = 'aimed';
            updateFireModeUI();
            break;
        case '3':
            selectedFireMode = 'auto';
            updateFireModeUI();
            break;
        case 'r':
            if (selectedSoldier) reloadWeapon(selectedSoldier);
            break;
    }
});

function updateFireModeUI() {
    document.querySelectorAll('.fire-mode').forEach(el => {
        el.classList.toggle('selected', el.dataset.mode === selectedFireMode);
    });
}

// UI button handlers
document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('menu-overlay').classList.add('hidden');
    gameState = 'playing';
    gamePaused = false;
    initGame();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('gameover-overlay').classList.add('hidden');
    gameState = 'playing';
    gamePaused = false;
    initGame();
});

document.getElementById('victory-restart-btn').addEventListener('click', () => {
    document.getElementById('victory-overlay').classList.add('hidden');
    gameState = 'playing';
    gamePaused = false;
    initGame();
});

document.getElementById('btn-kneel').addEventListener('click', () => {
    if (selectedSoldier) toggleKneel(selectedSoldier);
});

document.getElementById('btn-reload').addEventListener('click', () => {
    if (selectedSoldier) reloadWeapon(selectedSoldier);
});

document.getElementById('btn-next').addEventListener('click', selectNextSoldier);
document.getElementById('btn-end').addEventListener('click', endPlayerTurn);

document.querySelectorAll('.fire-mode').forEach(el => {
    el.addEventListener('click', () => {
        selectedFireMode = el.dataset.mode;
        updateFireModeUI();
    });
});

// Rendering
function render() {
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'menu') return;

    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    // Draw tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            // Base terrain
            if (tile.visible || tile.explored) {
                switch (tile.terrain) {
                    case 'ground':
                        ctx.fillStyle = tile.visible ? '#1a2a1a' : '#0a150a';
                        break;
                    case 'wall':
                        ctx.fillStyle = tile.visible ? '#444' : '#222';
                        break;
                    case 'cover':
                        ctx.fillStyle = tile.visible ? '#3a2a1a' : '#1a150a';
                        break;
                    case 'bush':
                        ctx.fillStyle = tile.visible ? '#2a3a2a' : '#151a15';
                        break;
                }
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Grid lines
                ctx.strokeStyle = tile.visible ? '#333' : '#1a1a1a';
                ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
            } else {
                // Fog of war
                ctx.fillStyle = '#000';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Draw movement range for selected soldier
    if (selectedSoldier && currentPhase === 'player') {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (map[y][x].terrain === 'wall') continue;
                if (map[y][x].unit) continue;

                const pathResult = findPath(selectedSoldier.x, selectedSoldier.y, x, y);
                if (pathResult && pathResult.cost <= selectedSoldier.tu) {
                    ctx.fillStyle = 'rgba(0, 170, 255, 0.15)';
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    // Draw hovered tile
    if (hoveredTile) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 2;
        ctx.strokeRect(hoveredTile.x * TILE_SIZE, hoveredTile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.lineWidth = 1;

        // Show path cost
        if (selectedSoldier && currentPhase === 'player') {
            const tile = map[hoveredTile.y][hoveredTile.x];
            if (!tile.unit && tile.terrain !== 'wall') {
                const pathResult = findPath(selectedSoldier.x, selectedSoldier.y, hoveredTile.x, hoveredTile.y);
                if (pathResult) {
                    ctx.fillStyle = pathResult.cost <= selectedSoldier.tu ? '#0f0' : '#f00';
                    ctx.font = '10px monospace';
                    ctx.fillText(`${pathResult.cost} TU`, hoveredTile.x * TILE_SIZE + 2, hoveredTile.y * TILE_SIZE + 12);
                }
            }
        }
    }

    // Draw dead units (blood stains)
    for (const unit of deadUnits) {
        ctx.fillStyle = unit.type === 'alien' ? '#040' : '#400';
        ctx.beginPath();
        ctx.arc(unit.x * TILE_SIZE + TILE_SIZE / 2, unit.y * TILE_SIZE + TILE_SIZE / 2, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw soldiers
    for (const soldier of soldiers) {
        if (!soldier.alive) continue;

        const px = soldier.x * TILE_SIZE + TILE_SIZE / 2;
        const py = soldier.y * TILE_SIZE + TILE_SIZE / 2;
        const size = soldier.stance === 'kneeling' ? 10 : 12;

        // Selection ring
        if (soldier === selectedSoldier) {
            ctx.strokeStyle = '#0af';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py, size + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 1;
        }

        // Soldier body
        ctx.fillStyle = '#08f';
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();

        // Facing indicator
        const angle = soldier.facing * Math.PI / 4;
        ctx.strokeStyle = '#0cf';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(angle) * (size + 5), py + Math.sin(angle) * (size + 5));
        ctx.stroke();

        // HP bar
        const hpPercent = soldier.hp / soldier.maxHp;
        ctx.fillStyle = '#222';
        ctx.fillRect(px - 12, py - size - 8, 24, 4);
        ctx.fillStyle = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
        ctx.fillRect(px - 12, py - size - 8, 24 * hpPercent, 4);
    }

    // Draw aliens (only if visible)
    for (const alien of aliens) {
        if (!alien.alive) continue;
        if (!map[alien.y][alien.x].visible) continue;

        const px = alien.x * TILE_SIZE + TILE_SIZE / 2;
        const py = alien.y * TILE_SIZE + TILE_SIZE / 2;
        const size = alien.size / 2;

        // Alien body
        ctx.fillStyle = alien.color;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(px - 4, py - 2, 3, 0, Math.PI * 2);
        ctx.arc(px + 4, py - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        const hpPercent = alien.hp / alien.maxHp;
        ctx.fillStyle = '#222';
        ctx.fillRect(px - 12, py - size - 8, 24, 4);
        ctx.fillStyle = '#f00';
        ctx.fillRect(px - 12, py - size - 8, 24 * hpPercent, 4);
    }

    ctx.restore();

    updateHUD();
}

// Game loop
function gameLoop() {
    // Update message timers
    messages = messages.filter(m => {
        m.time -= 16;
        return m.time > 0;
    });
    if (messages.length > 0) updateMessages();

    render();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// Harness interface for playtesting
window.harness = {
    pause: () => { gamePaused = true; },
    resume: () => { gamePaused = false; },
    isPaused: () => gamePaused,

    execute: async (action, durationMs) => {
        gamePaused = false;

        if (action.click) {
            const tileX = Math.floor(action.click.x / TILE_SIZE);
            const tileY = Math.floor(action.click.y / TILE_SIZE);

            if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
                hoveredTile = { x: tileX, y: tileY };
                const tile = map[tileY][tileX];

                if (tile.unit && tile.unit.type === 'alien' && tile.visible && selectedSoldier) {
                    fireWeapon(selectedSoldier, tile.unit, selectedFireMode);
                    checkWinConditions();
                } else if (tile.unit && tile.unit.type === 'soldier') {
                    selectedSoldier = tile.unit;
                } else if (selectedSoldier && !tile.unit && tile.terrain !== 'wall') {
                    moveUnit(selectedSoldier, tileX, tileY);
                }
            }
        }

        if (action.keys) {
            for (const key of action.keys) {
                switch (key.toLowerCase()) {
                    case 'tab':
                        selectNextSoldier();
                        break;
                    case 'enter':
                        if (currentPhase === 'player') {
                            await runAlienTurn();
                        }
                        break;
                    case 'k':
                        if (selectedSoldier) toggleKneel(selectedSoldier);
                        break;
                    case '1': selectedFireMode = 'snap'; break;
                    case '2': selectedFireMode = 'aimed'; break;
                    case '3': selectedFireMode = 'auto'; break;
                }
            }
        }

        await new Promise(r => setTimeout(r, durationMs));
        gamePaused = true;
    },

    getState: () => ({
        gameState,
        turnNumber,
        currentPhase,
        selectedSoldier: selectedSoldier ? {
            name: selectedSoldier.name,
            x: selectedSoldier.x,
            y: selectedSoldier.y,
            hp: selectedSoldier.hp,
            tu: selectedSoldier.tu,
            maxTu: selectedSoldier.maxTu,
            stance: selectedSoldier.stance
        } : null,
        soldiers: soldiers.filter(s => s.alive).map(s => ({
            name: s.name,
            x: s.x, y: s.y,
            hp: s.hp, tu: s.tu
        })),
        aliens: aliens.filter(a => a.alive && map[a.y][a.x].visible).map(a => ({
            type: a.alienType,
            x: a.x, y: a.y,
            hp: a.hp
        })),
        aliensAlive: aliens.filter(a => a.alive).length,
        soldiersAlive: soldiers.filter(s => s.alive).length,
        stats,
        camera: { x: cameraX, y: cameraY }
    }),

    getPhase: () => gameState,

    debug: {
        setHealth: (hp) => { if (selectedSoldier) selectedSoldier.hp = hp; },
        forceStart: () => {
            document.getElementById('menu-overlay').classList.add('hidden');
            document.getElementById('gameover-overlay').classList.add('hidden');
            document.getElementById('victory-overlay').classList.add('hidden');
            gameState = 'playing';
            gamePaused = false;
            initGame();
        },
        clearEnemies: () => {
            aliens.forEach(a => {
                a.alive = false;
                if (map[a.y][a.x].unit === a) map[a.y][a.x].unit = null;
            });
        },
        endTurn: async () => {
            if (currentPhase === 'player') await runAlienTurn();
        }
    }
};
