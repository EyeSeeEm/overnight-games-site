// X-COM: Tactical Assault - Turn-Based Tactics Clone
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'title'; // title, player_turn, enemy_turn, action, gameover, victory
let selectedUnit = null;
let actionMode = 'move'; // move, snap, aimed, grenade
let targetTile = null;
let animating = false;
let message = '';
let messageTimer = 0;

// Map
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const TILE_SIZE = 32;
const MAP_OFFSET_X = 80;
const MAP_OFFSET_Y = 80;

let map = [];
let fogOfWar = [];

// Units
let soldiers = [];
let aliens = [];

// Turn system
let turnNumber = 1;

// Weapons data
const weapons = {
    rifle: { name: 'Rifle', damage: 30, snapTU: 25, snapAcc: 60, aimedTU: 80, aimedAcc: 110, ammo: 20, maxAmmo: 20 },
    pistol: { name: 'Pistol', damage: 26, snapTU: 18, snapAcc: 30, aimedTU: 30, aimedAcc: 78, ammo: 12, maxAmmo: 12 },
    grenade: { name: 'Grenade', damage: 50, radius: 2 }
};

// Initialize
function init() {
    document.addEventListener('keydown', e => {
        if (gameState === 'title' && e.key === ' ') {
            startMission();
        } else if ((gameState === 'gameover' || gameState === 'victory') && e.key === ' ') {
            location.reload();
        } else if (gameState === 'player_turn') {
            if (e.key === '1') actionMode = 'move';
            if (e.key === '2') actionMode = 'snap';
            if (e.key === '3') actionMode = 'aimed';
            if (e.key === '4') actionMode = 'grenade';
            if (e.key === 'Tab') {
                e.preventDefault();
                selectNextUnit();
            }
            if (e.key === 'Enter') {
                endPlayerTurn();
            }
        }
    });

    canvas.addEventListener('click', e => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        handleClick(mx, my);
    });

    canvas.addEventListener('contextmenu', e => {
        e.preventDefault();
        actionMode = 'move';
    });

    requestAnimationFrame(gameLoop);
}

function startMission() {
    // Generate map
    generateMap();

    // Create soldiers
    soldiers = [
        createSoldier('Sgt. Miller', 3, 12, { tu: 60, health: 35, accuracy: 55, reactions: 45 }),
        createSoldier('Cpl. Chen', 4, 12, { tu: 55, health: 30, accuracy: 60, reactions: 40 }),
        createSoldier('Pvt. Garcia', 3, 13, { tu: 50, health: 28, accuracy: 50, reactions: 50 }),
        createSoldier('Pvt. Johnson', 4, 13, { tu: 52, health: 32, accuracy: 45, reactions: 55 })
    ];

    // Create aliens
    aliens = [
        createAlien('sectoid', 15, 3),
        createAlien('sectoid', 16, 4),
        createAlien('floater', 14, 2),
        createAlien('floater', 17, 5),
        createAlien('snakeman', 15, 6)
    ];

    selectedUnit = soldiers[0];
    gameState = 'player_turn';
    updateFogOfWar();
    showMessage('Mission Start - UFO Crash Recovery');
}

function generateMap() {
    map = [];
    fogOfWar = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        fogOfWar[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Base terrain
            let tile = { type: 'ground', cover: 0, blocked: false };

            // Add some variety
            if (Math.random() < 0.15) {
                tile = { type: 'bush', cover: 1, blocked: false, tuCost: 6 };
            }

            map[y][x] = tile;
            fogOfWar[y][x] = false;
        }
    }

    // Add walls/structures
    // UFO crash site
    for (let x = 13; x <= 17; x++) {
        map[1][x] = { type: 'ufo', cover: 2, blocked: true };
        map[7][x] = { type: 'ufo', cover: 2, blocked: true };
    }
    for (let y = 2; y <= 6; y++) {
        map[y][13] = { type: 'ufo', cover: 2, blocked: true };
        map[y][17] = { type: 'ufo', cover: 2, blocked: true };
    }
    // UFO entrance
    map[4][13] = { type: 'door', cover: 0, blocked: false };

    // Some cover objects
    map[10][5] = { type: 'rock', cover: 2, blocked: true };
    map[10][6] = { type: 'rock', cover: 2, blocked: true };
    map[8][10] = { type: 'crate', cover: 1, blocked: true };
    map[9][10] = { type: 'crate', cover: 1, blocked: true };
    map[6][8] = { type: 'tree', cover: 1, blocked: true };
    map[7][9] = { type: 'tree', cover: 1, blocked: true };
}

function createSoldier(name, x, y, stats) {
    return {
        type: 'soldier',
        name,
        x, y,
        tu: stats.tu,
        maxTu: stats.tu,
        health: stats.health,
        maxHealth: stats.health,
        accuracy: stats.accuracy,
        reactions: stats.reactions,
        morale: 100,
        kneeling: false,
        weapon: { ...weapons.rifle },
        grenades: 2,
        facing: 0, // 0 = up, 1 = right, 2 = down, 3 = left
        alive: true,
        visible: true
    };
}

function createAlien(type, x, y) {
    const templates = {
        sectoid: { name: 'Sectoid', health: 30, tu: 54, reactions: 63, accuracy: 50, damage: 35, color: '#8a8' },
        floater: { name: 'Floater', health: 40, tu: 60, reactions: 55, accuracy: 45, damage: 40, color: '#a88' },
        snakeman: { name: 'Snakeman', health: 50, tu: 50, reactions: 40, accuracy: 55, damage: 45, color: '#8a4' }
    };

    const t = templates[type];
    return {
        type: 'alien',
        alienType: type,
        name: t.name,
        x, y,
        tu: t.tu,
        maxTu: t.tu,
        health: t.health,
        maxHealth: t.health,
        accuracy: t.accuracy,
        reactions: t.reactions,
        damage: t.damage,
        color: t.color,
        facing: 2,
        alive: true,
        visible: false,
        alerted: false
    };
}

function updateFogOfWar() {
    // Reset fog
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            fogOfWar[y][x] = false;
        }
    }

    // Each soldier reveals tiles
    for (const soldier of soldiers) {
        if (!soldier.alive) continue;
        revealTiles(soldier.x, soldier.y, 8);
    }

    // Update alien visibility
    for (const alien of aliens) {
        alien.visible = fogOfWar[alien.y]?.[alien.x] || false;
    }
}

function revealTiles(cx, cy, range) {
    for (let y = Math.max(0, cy - range); y <= Math.min(MAP_HEIGHT - 1, cy + range); y++) {
        for (let x = Math.max(0, cx - range); x <= Math.min(MAP_WIDTH - 1, cx + range); x++) {
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (dist <= range && hasLineOfSight(cx, cy, x, y)) {
                fogOfWar[y][x] = true;
            }
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
    while (x !== x2 || y !== y2) {
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }

        if (x === x2 && y === y2) break;
        if (map[y]?.[x]?.blocked) return false;
    }
    return true;
}

function handleClick(mx, my) {
    if (gameState !== 'player_turn' || animating) return;

    // Convert to tile coords
    const tx = Math.floor((mx - MAP_OFFSET_X) / TILE_SIZE);
    const ty = Math.floor((my - MAP_OFFSET_Y) / TILE_SIZE);

    // Check if clicking on unit list
    if (mx < 80) {
        const idx = Math.floor((my - 100) / 50);
        if (idx >= 0 && idx < soldiers.length && soldiers[idx].alive) {
            selectedUnit = soldiers[idx];
            actionMode = 'move';
        }
        return;
    }

    if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return;

    // Check if clicking on own soldier to select
    for (const soldier of soldiers) {
        if (soldier.alive && soldier.x === tx && soldier.y === ty) {
            selectedUnit = soldier;
            actionMode = 'move';
            return;
        }
    }

    if (!selectedUnit || !selectedUnit.alive) return;

    if (actionMode === 'move') {
        // Move action
        const path = findPath(selectedUnit.x, selectedUnit.y, tx, ty);
        if (path && path.length > 0) {
            const tuCost = calculatePathTU(path);
            if (selectedUnit.tu >= tuCost) {
                moveUnit(selectedUnit, path, tuCost);
            } else {
                showMessage('Not enough TU!');
            }
        }
    } else if (actionMode === 'snap' || actionMode === 'aimed') {
        // Shooting
        const target = getUnitAt(tx, ty);
        if (target && target.type === 'alien' && target.visible && target.alive) {
            const tuCost = actionMode === 'snap' ? selectedUnit.weapon.snapTU : selectedUnit.weapon.aimedTU;
            if (selectedUnit.tu >= tuCost && selectedUnit.weapon.ammo > 0) {
                shoot(selectedUnit, target, actionMode);
            } else if (selectedUnit.weapon.ammo <= 0) {
                showMessage('Out of ammo!');
            } else {
                showMessage('Not enough TU!');
            }
        }
    } else if (actionMode === 'grenade') {
        if (selectedUnit.grenades > 0 && selectedUnit.tu >= 25) {
            throwGrenade(selectedUnit, tx, ty);
        } else if (selectedUnit.grenades <= 0) {
            showMessage('No grenades!');
        } else {
            showMessage('Not enough TU!');
        }
    }
}

function findPath(x1, y1, x2, y2) {
    if (map[y2]?.[x1]?.blocked) return null;
    if (getUnitAt(x2, y2)) return null;

    // Simple A* pathfinding
    const open = [{ x: x1, y: y1, g: 0, h: 0, f: 0, parent: null }];
    const closed = new Set();

    while (open.length > 0) {
        open.sort((a, b) => a.f - b.f);
        const current = open.shift();

        if (current.x === x2 && current.y === y2) {
            const path = [];
            let node = current;
            while (node.parent) {
                path.unshift({ x: node.x, y: node.y });
                node = node.parent;
            }
            return path;
        }

        closed.add(`${current.x},${current.y}`);

        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
            const nx = current.x + dx;
            const ny = current.y + dy;

            if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
            if (map[ny][nx].blocked) continue;
            if (getUnitAt(nx, ny) && !(nx === x2 && ny === y2)) continue;
            if (closed.has(`${nx},${ny}`)) continue;

            const g = current.g + (map[ny][nx].tuCost || 4);
            const h = Math.abs(x2 - nx) + Math.abs(y2 - ny);
            const f = g + h;

            const existing = open.find(n => n.x === nx && n.y === ny);
            if (!existing) {
                open.push({ x: nx, y: ny, g, h, f, parent: current });
            } else if (g < existing.g) {
                existing.g = g;
                existing.f = f;
                existing.parent = current;
            }
        }
    }

    return null;
}

function calculatePathTU(path) {
    let tu = 0;
    for (const step of path) {
        tu += map[step.y][step.x].tuCost || 4;
    }
    return tu;
}

function moveUnit(unit, path, tuCost) {
    animating = true;
    unit.tu -= tuCost;

    let i = 0;
    const moveStep = () => {
        if (i < path.length) {
            unit.x = path[i].x;
            unit.y = path[i].y;
            i++;
            updateFogOfWar();
            checkReactionFire(unit);
            setTimeout(moveStep, 100);
        } else {
            animating = false;
        }
    };
    moveStep();
}

function checkReactionFire(movingUnit) {
    const enemies = movingUnit.type === 'soldier' ? aliens : soldiers;

    for (const enemy of enemies) {
        if (!enemy.alive || enemy.tu < 25) continue;
        if (!hasLineOfSight(enemy.x, enemy.y, movingUnit.x, movingUnit.y)) continue;

        const dist = Math.sqrt((enemy.x - movingUnit.x) ** 2 + (enemy.y - movingUnit.y) ** 2);
        if (dist > 10) continue;

        // Reaction check
        const reactionChance = (enemy.reactions * enemy.tu) / (movingUnit.reactions * 50);
        if (Math.random() < reactionChance * 0.3) {
            // Reaction fire!
            showMessage(`${enemy.name} reaction fire!`);
            const damage = enemy.type === 'soldier' ? 30 : enemy.damage;
            const hitChance = enemy.accuracy * 0.5 * (1 - dist * 0.05);

            if (Math.random() * 100 < hitChance) {
                const actualDamage = Math.floor(damage * (0.5 + Math.random()));
                movingUnit.health -= actualDamage;
                showMessage(`${movingUnit.name} hit for ${actualDamage} damage!`);

                if (movingUnit.health <= 0) {
                    movingUnit.alive = false;
                    showMessage(`${movingUnit.name} is down!`);
                }
            } else {
                showMessage('Reaction shot missed!');
            }

            enemy.tu -= 25;
        }
    }
}

function shoot(shooter, target, mode) {
    const weapon = shooter.weapon;
    const tuCost = mode === 'snap' ? weapon.snapTU : weapon.aimedTU;
    const baseAcc = mode === 'snap' ? weapon.snapAcc : weapon.aimedAcc;

    shooter.tu -= tuCost;
    weapon.ammo--;

    const dist = Math.sqrt((target.x - shooter.x) ** 2 + (target.y - shooter.y) ** 2);
    let hitChance = (shooter.accuracy * baseAcc / 100) * (1 - dist * 0.02);
    if (shooter.kneeling) hitChance *= 1.15;

    animating = true;

    if (Math.random() * 100 < hitChance) {
        const damage = Math.floor(weapon.damage * (0.5 + Math.random() * 1.5));
        target.health -= damage;
        showMessage(`${shooter.name} hits ${target.name} for ${damage} damage!`);

        if (target.health <= 0) {
            target.alive = false;
            showMessage(`${target.name} eliminated!`);
            checkVictory();
        }
    } else {
        showMessage(`${shooter.name} misses!`);
    }

    setTimeout(() => {
        animating = false;
    }, 500);
}

function throwGrenade(thrower, tx, ty) {
    thrower.tu -= 25;
    thrower.grenades--;

    showMessage(`${thrower.name} throws grenade!`);

    animating = true;
    setTimeout(() => {
        // Explosion
        const radius = 2;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const ex = tx + dx;
                const ey = ty + dy;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= radius) {
                    const damage = Math.floor(50 * (1 - dist / radius) * (0.5 + Math.random()));

                    // Check units
                    const unit = getUnitAt(ex, ey);
                    if (unit && unit.alive) {
                        unit.health -= damage;
                        showMessage(`${unit.name} takes ${damage} explosion damage!`);
                        if (unit.health <= 0) {
                            unit.alive = false;
                            showMessage(`${unit.name} eliminated!`);
                        }
                    }

                    // Destroy cover
                    if (map[ey]?.[ex]?.type === 'bush' || map[ey]?.[ex]?.type === 'crate') {
                        map[ey][ex] = { type: 'rubble', cover: 0, blocked: false, tuCost: 6 };
                    }
                }
            }
        }

        checkVictory();
        animating = false;
    }, 600);
}

function getUnitAt(x, y) {
    for (const s of soldiers) {
        if (s.alive && s.x === x && s.y === y) return s;
    }
    for (const a of aliens) {
        if (a.alive && a.x === x && a.y === y) return a;
    }
    return null;
}

function selectNextUnit() {
    const aliveUnits = soldiers.filter(s => s.alive && s.tu > 0);
    if (aliveUnits.length === 0) return;

    const idx = aliveUnits.indexOf(selectedUnit);
    selectedUnit = aliveUnits[(idx + 1) % aliveUnits.length];
}

function endPlayerTurn() {
    gameState = 'enemy_turn';
    showMessage('Enemy Turn');

    setTimeout(() => {
        processEnemyTurn();
    }, 500);
}

function processEnemyTurn() {
    // Reset alien TU
    for (const alien of aliens) {
        if (alien.alive) {
            alien.tu = alien.maxTu;
        }
    }

    let alienIndex = 0;
    const processNextAlien = () => {
        while (alienIndex < aliens.length && !aliens[alienIndex].alive) {
            alienIndex++;
        }

        if (alienIndex >= aliens.length) {
            // End enemy turn
            startPlayerTurn();
            return;
        }

        const alien = aliens[alienIndex];
        alienIndex++;

        // Simple AI: find nearest visible soldier and move toward/shoot
        let nearestSoldier = null;
        let nearestDist = Infinity;

        for (const soldier of soldiers) {
            if (!soldier.alive) continue;
            const dist = Math.sqrt((soldier.x - alien.x) ** 2 + (soldier.y - alien.y) ** 2);
            if (dist < nearestDist && hasLineOfSight(alien.x, alien.y, soldier.x, soldier.y)) {
                nearestSoldier = soldier;
                nearestDist = dist;
            }
        }

        if (nearestSoldier) {
            alien.alerted = true;

            if (nearestDist <= 8) {
                // Shoot
                const hitChance = alien.accuracy * 0.6 * (1 - nearestDist * 0.03);
                if (Math.random() * 100 < hitChance) {
                    const damage = Math.floor(alien.damage * (0.5 + Math.random()));
                    nearestSoldier.health -= damage;
                    showMessage(`${alien.name} hits ${nearestSoldier.name} for ${damage}!`);

                    if (nearestSoldier.health <= 0) {
                        nearestSoldier.alive = false;
                        showMessage(`${nearestSoldier.name} is KIA!`);
                        checkGameOver();
                    }
                } else {
                    showMessage(`${alien.name} misses!`);
                }
                alien.tu -= 25;
            } else {
                // Move toward soldier
                const dx = nearestSoldier.x > alien.x ? 1 : (nearestSoldier.x < alien.x ? -1 : 0);
                const dy = nearestSoldier.y > alien.y ? 1 : (nearestSoldier.y < alien.y ? -1 : 0);

                let moved = false;
                if (!map[alien.y + dy]?.[alien.x + dx]?.blocked && !getUnitAt(alien.x + dx, alien.y + dy)) {
                    alien.x += dx;
                    alien.y += dy;
                    alien.tu -= 4;
                    moved = true;
                } else if (!map[alien.y]?.[alien.x + dx]?.blocked && !getUnitAt(alien.x + dx, alien.y)) {
                    alien.x += dx;
                    alien.tu -= 4;
                    moved = true;
                } else if (!map[alien.y + dy]?.[alien.x]?.blocked && !getUnitAt(alien.x, alien.y + dy)) {
                    alien.y += dy;
                    alien.tu -= 4;
                    moved = true;
                }

                if (moved) {
                    updateFogOfWar();
                    checkReactionFire(alien);
                }
            }
        }

        setTimeout(processNextAlien, 400);
    };

    processNextAlien();
}

function startPlayerTurn() {
    turnNumber++;
    gameState = 'player_turn';

    // Reset TU
    for (const soldier of soldiers) {
        if (soldier.alive) {
            soldier.tu = soldier.maxTu;
        }
    }

    // Select first alive soldier
    selectedUnit = soldiers.find(s => s.alive) || null;
    updateFogOfWar();
    showMessage(`Turn ${turnNumber} - Your Move`);
}

function checkVictory() {
    const aliensAlive = aliens.filter(a => a.alive).length;
    if (aliensAlive === 0) {
        gameState = 'victory';
    }
}

function checkGameOver() {
    const soldiersAlive = soldiers.filter(s => s.alive).length;
    if (soldiersAlive === 0) {
        gameState = 'gameover';
    }
}

function showMessage(msg) {
    message = msg;
    messageTimer = 180;
}

// Draw
function draw() {
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, 800, 600);

    if (gameState === 'title') {
        drawTitle();
        return;
    }

    // Draw map
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map[y][x];
            const px = MAP_OFFSET_X + x * TILE_SIZE;
            const py = MAP_OFFSET_Y + y * TILE_SIZE;

            // Fog of war
            if (!fogOfWar[y][x]) {
                ctx.fillStyle = '#111';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                continue;
            }

            // Tile colors
            const colors = {
                ground: '#2a3a2a',
                bush: '#1a4a1a',
                rock: '#444',
                crate: '#543',
                tree: '#1a3a1a',
                ufo: '#445',
                door: '#334',
                rubble: '#333'
            };

            ctx.fillStyle = colors[tile.type] || '#2a3a2a';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

            // Cover indicator
            if (tile.cover > 0) {
                ctx.fillStyle = tile.cover === 2 ? '#555' : '#444';
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            }

            // Grid
            ctx.strokeStyle = '#1a1a2a';
            ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        }
    }

    // Highlight movement range for selected unit
    if (selectedUnit && selectedUnit.alive && actionMode === 'move') {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (fogOfWar[y][x] && !map[y][x].blocked && !getUnitAt(x, y)) {
                    const path = findPath(selectedUnit.x, selectedUnit.y, x, y);
                    if (path) {
                        const tuCost = calculatePathTU(path);
                        if (tuCost <= selectedUnit.tu) {
                            ctx.fillStyle = 'rgba(0, 100, 200, 0.2)';
                            ctx.fillRect(MAP_OFFSET_X + x * TILE_SIZE, MAP_OFFSET_Y + y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        }
                    }
                }
            }
        }
    }

    // Draw aliens
    for (const alien of aliens) {
        if (!alien.alive || !alien.visible) continue;

        const px = MAP_OFFSET_X + alien.x * TILE_SIZE + TILE_SIZE / 2;
        const py = MAP_OFFSET_Y + alien.y * TILE_SIZE + TILE_SIZE / 2;

        ctx.fillStyle = alien.color;
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#f00';
        ctx.fillRect(px - 5, py - 3, 4, 4);
        ctx.fillRect(px + 1, py - 3, 4, 4);

        // Health bar
        ctx.fillStyle = '#400';
        ctx.fillRect(px - 12, py - 18, 24, 4);
        ctx.fillStyle = '#f44';
        ctx.fillRect(px - 12, py - 18, 24 * (alien.health / alien.maxHealth), 4);
    }

    // Draw soldiers
    for (const soldier of soldiers) {
        if (!soldier.alive) continue;

        const px = MAP_OFFSET_X + soldier.x * TILE_SIZE + TILE_SIZE / 2;
        const py = MAP_OFFSET_Y + soldier.y * TILE_SIZE + TILE_SIZE / 2;

        // Selection highlight
        if (soldier === selectedUnit) {
            ctx.strokeStyle = '#ff0';
            ctx.lineWidth = 2;
            ctx.strokeRect(MAP_OFFSET_X + soldier.x * TILE_SIZE + 2, MAP_OFFSET_Y + soldier.y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.lineWidth = 1;
        }

        ctx.fillStyle = '#48a';
        ctx.fillRect(px - 10, py - 10, 20, 20);

        // Helmet
        ctx.fillStyle = '#246';
        ctx.fillRect(px - 6, py - 10, 12, 8);

        // Health bar
        ctx.fillStyle = '#040';
        ctx.fillRect(px - 12, py - 18, 24, 4);
        ctx.fillStyle = '#4f4';
        ctx.fillRect(px - 12, py - 18, 24 * (soldier.health / soldier.maxHealth), 4);
    }

    // Draw targeting line
    if (selectedUnit && (actionMode === 'snap' || actionMode === 'aimed' || actionMode === 'grenade')) {
        const mx = mouse.x;
        const my = mouse.y;
        const tx = Math.floor((mx - MAP_OFFSET_X) / TILE_SIZE);
        const ty = Math.floor((my - MAP_OFFSET_Y) / TILE_SIZE);

        if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
            ctx.strokeStyle = actionMode === 'grenade' ? '#f84' : '#f44';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(MAP_OFFSET_X + selectedUnit.x * TILE_SIZE + TILE_SIZE / 2, MAP_OFFSET_Y + selectedUnit.y * TILE_SIZE + TILE_SIZE / 2);
            ctx.lineTo(MAP_OFFSET_X + tx * TILE_SIZE + TILE_SIZE / 2, MAP_OFFSET_Y + ty * TILE_SIZE + TILE_SIZE / 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Grenade radius
            if (actionMode === 'grenade') {
                ctx.strokeStyle = 'rgba(255, 136, 68, 0.5)';
                ctx.beginPath();
                ctx.arc(MAP_OFFSET_X + tx * TILE_SIZE + TILE_SIZE / 2, MAP_OFFSET_Y + ty * TILE_SIZE + TILE_SIZE / 2, 2.5 * TILE_SIZE, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    // HUD - Unit list
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 80, 75, 280);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('SQUAD', 5, 95);

    for (let i = 0; i < soldiers.length; i++) {
        const s = soldiers[i];
        const y = 100 + i * 50;

        ctx.fillStyle = !s.alive ? '#400' : (s === selectedUnit ? '#248' : '#222');
        ctx.fillRect(5, y, 65, 45);

        ctx.fillStyle = s.alive ? '#fff' : '#888';
        ctx.font = '9px Arial';
        ctx.fillText(s.name.split(' ')[1], 8, y + 12);

        if (s.alive) {
            // HP bar
            ctx.fillStyle = '#040';
            ctx.fillRect(8, y + 16, 55, 6);
            ctx.fillStyle = '#4f4';
            ctx.fillRect(8, y + 16, 55 * (s.health / s.maxHealth), 6);

            // TU bar
            ctx.fillStyle = '#024';
            ctx.fillRect(8, y + 24, 55, 6);
            ctx.fillStyle = '#48f';
            ctx.fillRect(8, y + 24, 55 * (s.tu / s.maxTu), 6);

            ctx.fillStyle = '#888';
            ctx.font = '8px Arial';
            ctx.fillText(`TU:${s.tu}`, 8, y + 40);
        } else {
            ctx.fillStyle = '#f44';
            ctx.fillText('KIA', 8, y + 30);
        }
    }

    // Top HUD
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 800, 75);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Turn ${turnNumber}`, 10, 20);

    ctx.fillStyle = gameState === 'player_turn' ? '#4f4' : '#f84';
    ctx.fillText(gameState === 'player_turn' ? 'YOUR TURN' : 'ENEMY TURN', 10, 40);

    // Action mode
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText(`Mode: ${actionMode.toUpperCase()}`, 10, 60);

    // Selected unit info
    if (selectedUnit && selectedUnit.alive) {
        ctx.fillStyle = '#8cf';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(selectedUnit.name, 150, 20);

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(`HP: ${selectedUnit.health}/${selectedUnit.maxHealth}  TU: ${selectedUnit.tu}/${selectedUnit.maxTu}`, 150, 40);
        ctx.fillText(`Weapon: ${selectedUnit.weapon.name} (${selectedUnit.weapon.ammo}/${selectedUnit.weapon.maxAmmo})  Grenades: ${selectedUnit.grenades}`, 150, 58);
    }

    // Controls
    ctx.fillStyle = '#888';
    ctx.textAlign = 'right';
    ctx.fillText('[1] Move  [2] Snap  [3] Aimed  [4] Grenade  [Tab] Next  [Enter] End Turn', 790, 20);
    ctx.fillText('Click to select/move/shoot', 790, 40);
    ctx.textAlign = 'left';

    // Alien count
    const aliensAlive = aliens.filter(a => a.alive).length;
    ctx.fillStyle = '#f44';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`Hostiles: ${aliensAlive}`, 700, 60);

    // Message
    if (messageTimer > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(200, 550, 400, 30);
        ctx.fillStyle = '#ff8';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, 400, 570);
        ctx.textAlign = 'left';
        messageTimer--;
    }

    // Game over / victory
    if (gameState === 'gameover') {
        drawGameOver();
    } else if (gameState === 'victory') {
        drawVictory();
    }
}

function drawTitle() {
    ctx.fillStyle = '#28a';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('X-COM', 400, 180);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('TACTICAL ASSAULT', 400, 220);

    ctx.fillStyle = '#888';
    ctx.font = '16px Arial';
    ctx.fillText('Turn-Based Tactics', 400, 260);

    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText('Mission: UFO Crash Recovery', 400, 320);
    ctx.fillText('Eliminate all hostile units', 400, 345);

    ctx.fillStyle = '#8cf';
    ctx.fillText('Controls:', 400, 400);
    ctx.fillStyle = '#fff';
    ctx.fillText('[1] Move  [2] Snap Shot  [3] Aimed Shot  [4] Grenade', 400, 425);
    ctx.fillText('[Tab] Next Unit  [Enter] End Turn  Click to act', 400, 450);

    ctx.fillStyle = '#ff0';
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to Begin', 400, 520);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(50, 0, 0, 0.9)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#f44';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION FAILED', 400, 250);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('All soldiers KIA', 400, 310);

    ctx.fillStyle = '#888';
    ctx.fillText('Press SPACE to try again', 400, 400);
    ctx.textAlign = 'left';
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 30, 50, 0.9)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#4ff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION COMPLETE', 400, 200);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('All hostiles eliminated', 400, 260);

    const survivors = soldiers.filter(s => s.alive);
    ctx.fillStyle = '#8cf';
    ctx.fillText(`Survivors: ${survivors.length}/${soldiers.length}`, 400, 320);

    for (let i = 0; i < survivors.length; i++) {
        ctx.fillStyle = '#4f4';
        ctx.font = '16px Arial';
        ctx.fillText(`${survivors[i].name} - Survived`, 400, 360 + i * 25);
    }

    ctx.fillStyle = '#888';
    ctx.fillText('Press SPACE to play again', 400, 480);
    ctx.textAlign = 'left';
}

// Mouse position tracking
let mouse = { x: 0, y: 0 };
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

// Game loop
function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

init();
