// X-COM Classic Clone - Phaser 3 Implementation
// Turn-based tactical strategy game

const config = {
    type: Phaser.CANVAS, // Canvas for headless testing
    width: 640,
    height: 480,
    parent: 'game-container',
    backgroundColor: '#080808',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Constants
const TILE_WIDTH = 32;
const TILE_HEIGHT = 16;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 20;
const UI_HEIGHT = 160;
const GAME_HEIGHT = 480 - UI_HEIGHT;

// Colors
const COLORS = {
    GRASS_LIGHT: 0x3a5a2a,
    GRASS_DARK: 0x2a4a1a,
    DIRT: 0x6b5433,
    ROAD: 0x3a3a3a,
    WALL_BRICK: 0x6b5555,
    FENCE: 0xb89a72,
    BUSH_LIGHT: 0x2a5a24,
    BUSH_DARK: 0x1a3a14,
    UI_BG: 0x1a1a3a,
    UI_PANEL: 0x555566,
    SOLDIER_ARMOR: 0x4477aa,
    SOLDIER_ARMOR_LIGHT: 0x6699cc,
    SECTOID_SKIN: 0x888899,
    PLASMA_GREEN: 0x00ff44,
    LASER_YELLOW: 0xffff00
};

// Game state
let gameState = {
    state: 'playing',
    turn: 'player',
    turnNumber: 1,
    selectedUnit: null,
    hoveredTile: null,
    message: 'Select a soldier',
    messageTimer: 0
};

// Terrain types
const TERRAIN = {
    GRASS: { id: 0, tu: 4, cover: 'none', walkable: true, type: 'grass', color: COLORS.GRASS_LIGHT },
    GRASS_DARK: { id: 1, tu: 4, cover: 'none', walkable: true, type: 'grass_dark', color: COLORS.GRASS_DARK },
    DIRT: { id: 2, tu: 4, cover: 'none', walkable: true, type: 'dirt', color: COLORS.DIRT },
    ROAD: { id: 3, tu: 3, cover: 'none', walkable: true, type: 'road', color: COLORS.ROAD },
    WALL_BRICK: { id: 4, tu: 99, cover: 'full', walkable: false, type: 'wall_brick', color: COLORS.WALL_BRICK },
    FENCE: { id: 5, tu: 6, cover: 'partial', walkable: true, type: 'fence', color: COLORS.FENCE },
    BUSH: { id: 6, tu: 6, cover: 'partial', walkable: true, type: 'bush', color: COLORS.BUSH_DARK },
    FLOWERS: { id: 7, tu: 4, cover: 'none', walkable: true, type: 'flowers', color: COLORS.GRASS_LIGHT }
};

// Weapons
const WEAPONS = {
    RIFLE: {
        name: 'Rifle', damage: 30,
        snapShot: { accuracy: 60, tuPercent: 25 },
        aimedShot: { accuracy: 110, tuPercent: 80 },
        autoShot: { accuracy: 35, tuPercent: 35, rounds: 3 },
        ammo: 20
    },
    PLASMA_PISTOL: {
        name: 'Plasma Pistol', damage: 52,
        snapShot: { accuracy: 65, tuPercent: 30 },
        aimedShot: { accuracy: 85, tuPercent: 60 },
        autoShot: null,
        ammo: 26
    }
};

// Global arrays
let map = [];
let soldiers = [];
let aliens = [];
let projectiles = [];
let scene;

function preload() {
    // Generate textures dynamically
}

function create() {
    scene = this;

    // Generate procedural textures
    createTextures();

    // Initialize game
    generateMap();
    createUnits();

    // Input handling
    this.input.on('pointerdown', handleClick);
    this.input.keyboard.on('keydown', handleKeyDown);

    // Initial visibility update
    updateVisibility();
    gameState.selectedUnit = soldiers[0];

    // Create UI graphics
    createUI();

    // Expose for testing
    window.gameState = gameState;
    Object.defineProperty(window, 'soldiers', { get: () => soldiers });
    Object.defineProperty(window, 'aliens', { get: () => aliens });
}

function createTextures() {
    // Soldier texture
    let gfx = scene.make.graphics({ add: false });
    gfx.fillStyle(COLORS.SOLDIER_ARMOR);
    gfx.fillRect(2, 8, 12, 16);
    gfx.fillStyle(0x334455);
    gfx.fillCircle(8, 6, 5);
    gfx.fillStyle(0xaaccff);
    gfx.fillRect(5, 4, 6, 3);
    gfx.generateTexture('soldier', 16, 28);

    // Selected soldier
    gfx.clear();
    gfx.fillStyle(COLORS.SOLDIER_ARMOR_LIGHT);
    gfx.fillRect(2, 8, 12, 16);
    gfx.fillStyle(0x334455);
    gfx.fillCircle(8, 6, 5);
    gfx.fillStyle(0xaaccff);
    gfx.fillRect(5, 4, 6, 3);
    gfx.generateTexture('soldier_selected', 16, 28);

    // Sectoid texture
    gfx.clear();
    gfx.fillStyle(COLORS.SECTOID_SKIN);
    gfx.fillEllipse(8, 8, 14, 18);
    gfx.fillStyle(0x000000);
    gfx.fillEllipse(5, 6, 6, 8);
    gfx.fillEllipse(11, 6, 6, 8);
    gfx.fillStyle(0x666677);
    gfx.fillRect(4, 18, 8, 10);
    gfx.generateTexture('sectoid', 16, 28);

    // Selection arrow
    gfx.clear();
    gfx.fillStyle(0xffff00);
    gfx.fillTriangle(8, 0, 0, 10, 16, 10);
    gfx.generateTexture('arrow', 16, 12);

    gfx.destroy();
}

function generateMap() {
    map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            let terrain = Math.random() < 0.5 ? TERRAIN.GRASS : TERRAIN.GRASS_DARK;

            if (x >= 9 && x <= 11) terrain = TERRAIN.ROAD;
            else if (x >= 1 && x <= 6 && y >= 1 && y <= 6) terrain = TERRAIN.DIRT;
            else if ((x === 14 && y >= 8 && y <= 14) ||
                     (x === 18 && y >= 8 && y <= 14) ||
                     (y === 8 && x >= 14 && x <= 18) ||
                     (y === 14 && x >= 14 && x <= 18)) terrain = TERRAIN.WALL_BRICK;
            else if (x > 14 && x < 18 && y > 8 && y < 14) terrain = TERRAIN.ROAD;
            else if (Math.random() < 0.12 && terrain.type.includes('grass')) terrain = TERRAIN.BUSH;
            else if (Math.random() < 0.08 && terrain.type.includes('grass')) terrain = TERRAIN.FLOWERS;
            else if (y === 12 && x >= 2 && x <= 7) terrain = TERRAIN.FENCE;

            map[y][x] = {
                terrain: terrain,
                visible: false,
                explored: false,
                unit: null
            };
        }
    }
}

function createUnits() {
    const names = ['Johnson', 'Williams', 'Martinez', 'Lee', 'Thompson', 'Garcia'];
    const positions = [[3, 3], [4, 3], [5, 3], [3, 4], [4, 4], [5, 4]];

    soldiers = [];
    for (let i = 0; i < 6; i++) {
        const baseTU = 50 + Math.floor(Math.random() * 20);
        const s = {
            type: 'soldier',
            name: names[i],
            x: positions[i][0],
            y: positions[i][1],
            facing: 2,
            stance: 'standing',
            tu: { base: baseTU, current: baseTU },
            health: { base: 35, current: 35 },
            reactions: 30 + Math.floor(Math.random() * 30),
            firingAccuracy: 40 + Math.floor(Math.random() * 30),
            morale: 100,
            weapon: { ...WEAPONS.RIFLE, currentAmmo: WEAPONS.RIFLE.ammo },
            isAlive: true,
            sprite: null,
            arrow: null
        };
        soldiers.push(s);
        map[s.y][s.x].unit = s;
    }

    const alienPositions = [[15, 10], [16, 11], [17, 9], [13, 16], [18, 15]];
    aliens = [];
    for (let pos of alienPositions) {
        const a = {
            type: 'alien',
            alienType: 'sectoid',
            name: 'Sectoid',
            x: pos[0],
            y: pos[1],
            facing: 6,
            stance: 'standing',
            tu: { base: 54, current: 54 },
            health: { base: 30, current: 30 },
            reactions: 50 + Math.floor(Math.random() * 20),
            firingAccuracy: 50 + Math.floor(Math.random() * 30),
            weapon: { ...WEAPONS.PLASMA_PISTOL, currentAmmo: WEAPONS.PLASMA_PISTOL.ammo },
            isAlive: true,
            spotted: false,
            sprite: null
        };
        aliens.push(a);
        map[a.y][a.x].unit = a;
    }
}

// Isometric conversion
function toIso(x, y) {
    return {
        x: (x - y) * (TILE_WIDTH / 2) + 320,
        y: (x + y) * (TILE_HEIGHT / 2) + 50
    };
}

function fromIso(screenX, screenY) {
    const adjustedX = screenX - 320;
    const adjustedY = screenY - 50;
    const x = (adjustedX / (TILE_WIDTH / 2) + adjustedY / (TILE_HEIGHT / 2)) / 2;
    const y = (adjustedY / (TILE_HEIGHT / 2) - adjustedX / (TILE_WIDTH / 2)) / 2;
    return { x: Math.floor(x), y: Math.floor(y) };
}

function updateVisibility() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[y][x].visible = false;
        }
    }

    for (let s of soldiers) {
        if (!s.isAlive) continue;
        const range = 20;
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
            if (map[y] && map[y][x] && map[y][x].terrain === TERRAIN.WALL_BRICK) {
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
            if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;
            const tile = map[ny][nx];
            if (!tile.terrain.walkable || tile.unit) continue;

            const cost = tile.terrain.tu;
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

function moveUnit(unit, path) {
    if (!path || path.length < 2) return false;

    let totalCost = 0;
    for (let i = 1; i < path.length; i++) {
        totalCost += map[path[i].y][path[i].x].terrain.tu;
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

    updateVisibility();
    if (unit.type === 'soldier') checkReactionFire(unit, totalCost);
    return true;
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

    return Math.max(5, Math.min(95, Math.floor(chance)));
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
            const damage = Math.floor(weapon.damage * (0.5 + Math.random() * 1.5));
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
    return true;
}

function createProjectile(from, to, hit) {
    const fromPos = toIso(from.x, from.y);
    const toPos = toIso(to.x, to.y);
    projectiles.push({
        x: fromPos.x,
        y: fromPos.y - 16,
        targetX: toPos.x,
        targetY: toPos.y - 16,
        progress: 0,
        hit: hit,
        color: from.type === 'alien' ? COLORS.PLASMA_GREEN : COLORS.LASER_YELLOW
    });
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
    gameState.message = msg;
    gameState.messageTimer = 180;
}

function endTurn() {
    if (gameState.turn === 'player') {
        gameState.turn = 'enemy';
        setMessage('Alien Activity...');
        for (let a of aliens) {
            if (a.isAlive) a.tu.current = a.tu.base;
        }
        scene.time.delayedCall(500, runAlienTurn);
    } else {
        gameState.turn = 'player';
        gameState.turnNumber++;
        setMessage('Your Turn - Turn ' + gameState.turnNumber);
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
                    if (maxMove > 0) moveUnit(alien, path.slice(0, maxMove + 1));
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
        scene.time.delayedCall(300, processNextAlien);
    }

    processNextAlien();
}

function checkGameEnd() {
    const livingSoldiers = soldiers.filter(s => s.isAlive);
    const livingAliens = aliens.filter(a => a.isAlive);

    if (livingSoldiers.length === 0) {
        gameState.state = 'gameover';
        setMessage('MISSION FAILED!');
    } else if (livingAliens.length === 0) {
        gameState.state = 'victory';
        setMessage('MISSION COMPLETE!');
    }
}

// Input handlers
function handleClick(pointer) {
    if (gameState.turn !== 'player' || gameState.state !== 'playing') return;

    if (pointer.y < GAME_HEIGHT) {
        const tile = fromIso(pointer.x, pointer.y);

        if (tile.x >= 0 && tile.x < MAP_WIDTH && tile.y >= 0 && tile.y < MAP_HEIGHT) {
            const clickedSoldier = soldiers.find(s => s.isAlive && s.x === tile.x && s.y === tile.y);
            if (clickedSoldier) {
                gameState.selectedUnit = clickedSoldier;
                setMessage(`Selected ${clickedSoldier.name}`);
                return;
            }

            const clickedAlien = aliens.find(a => a.isAlive && a.spotted && a.x === tile.x && a.y === tile.y);
            if (clickedAlien && gameState.selectedUnit) {
                if (hasLineOfSight(gameState.selectedUnit.x, gameState.selectedUnit.y, clickedAlien.x, clickedAlien.y)) {
                    fireWeapon(gameState.selectedUnit, clickedAlien, 'snap');
                    checkGameEnd();
                } else {
                    setMessage('No line of sight!');
                }
                return;
            }

            if (gameState.selectedUnit && gameState.selectedUnit.type === 'soldier') {
                const path = findPath(gameState.selectedUnit.x, gameState.selectedUnit.y, tile.x, tile.y);
                if (path) {
                    moveUnit(gameState.selectedUnit, path);
                    checkGameEnd();
                } else {
                    setMessage('Cannot move there!');
                }
            }
        }
    }
}

function handleKeyDown(event) {
    const key = event.key.toLowerCase();

    if (gameState.state !== 'playing') {
        if (key === 'r') {
            generateMap();
            createUnits();
            updateVisibility();
            gameState.selectedUnit = soldiers[0];
            gameState.turn = 'player';
            gameState.turnNumber = 1;
            gameState.state = 'playing';
        }
        return;
    }

    if (gameState.turn !== 'player') return;

    if (key >= '1' && key <= '6') {
        const idx = parseInt(key) - 1;
        if (soldiers[idx] && soldiers[idx].isAlive) {
            gameState.selectedUnit = soldiers[idx];
            setMessage(`Selected ${soldiers[idx].name}`);
        }
    }

    if (key === ' ') {
        const livingSoldiers = soldiers.filter(s => s.isAlive);
        if (livingSoldiers.length > 0) {
            const currentIdx = livingSoldiers.indexOf(gameState.selectedUnit);
            gameState.selectedUnit = livingSoldiers[(currentIdx + 1) % livingSoldiers.length];
            setMessage(`Selected ${gameState.selectedUnit.name}`);
        }
    }

    if (!gameState.selectedUnit) return;

    const shootAtNearest = (shotType) => {
        const visibleAliens = aliens.filter(a => a.isAlive && a.spotted &&
            hasLineOfSight(gameState.selectedUnit.x, gameState.selectedUnit.y, a.x, a.y));
        if (visibleAliens.length > 0) {
            const nearest = visibleAliens.reduce((a, b) =>
                distance(gameState.selectedUnit.x, gameState.selectedUnit.y, a.x, a.y) <
                distance(gameState.selectedUnit.x, gameState.selectedUnit.y, b.x, b.y) ? a : b);
            fireWeapon(gameState.selectedUnit, nearest, shotType);
            checkGameEnd();
        } else {
            setMessage('No visible targets!');
        }
    };

    if (key === 's') shootAtNearest('snap');
    if (key === 'a') shootAtNearest('aimed');
    if (key === 'f') {
        if (gameState.selectedUnit.weapon.autoShot) {
            shootAtNearest('auto');
        } else {
            setMessage('Weapon has no auto fire!');
        }
    }

    if (key === 'k') {
        if (gameState.selectedUnit.stance === 'standing') {
            if (gameState.selectedUnit.tu.current >= 4) {
                gameState.selectedUnit.tu.current -= 4;
                gameState.selectedUnit.stance = 'kneeling';
                setMessage('Kneeling (+15% accuracy)');
            } else setMessage('Not enough TU!');
        } else {
            if (gameState.selectedUnit.tu.current >= 8) {
                gameState.selectedUnit.tu.current -= 8;
                gameState.selectedUnit.stance = 'standing';
                setMessage('Standing up');
            } else setMessage('Not enough TU!');
        }
    }

    if (key === 'e') endTurn();

    if (key === 'r') {
        if (gameState.selectedUnit.tu.current >= 15) {
            gameState.selectedUnit.tu.current -= 15;
            gameState.selectedUnit.weapon.currentAmmo = gameState.selectedUnit.weapon.ammo;
            setMessage('Reloaded!');
        } else setMessage('Not enough TU to reload!');
    }
}

// UI Graphics object
let uiGraphics;

function createUI() {
    uiGraphics = scene.add.graphics();
}

function update() {
    // Clear and redraw everything
    uiGraphics.clear();

    // Draw map
    drawMap();

    // Draw projectiles
    updateProjectiles();

    // Draw UI
    drawUI();

    // Update message timer
    if (gameState.messageTimer > 0) gameState.messageTimer--;

    // Game over overlay
    if (gameState.state !== 'playing') {
        drawGameOverScreen();
    }
}

function drawMap() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map[y][x];
            const pos = toIso(x, y);

            let color = tile.terrain.color;
            if (!tile.explored) {
                color = 0x0a0a0a;
            } else if (!tile.visible) {
                color = darkenColor(tile.terrain.color, 0.5);
            }

            // Draw tile
            uiGraphics.fillStyle(color);
            uiGraphics.beginPath();
            uiGraphics.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
            uiGraphics.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
            uiGraphics.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
            uiGraphics.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
            uiGraphics.closePath();
            uiGraphics.fill();

            // Draw walls with height
            if (tile.terrain === TERRAIN.WALL_BRICK && tile.explored) {
                const wallColor = tile.visible ? COLORS.WALL_BRICK : darkenColor(COLORS.WALL_BRICK, 0.5);

                uiGraphics.fillStyle(wallColor);
                uiGraphics.beginPath();
                uiGraphics.moveTo(pos.x - TILE_WIDTH/2, pos.y);
                uiGraphics.lineTo(pos.x, pos.y + TILE_HEIGHT/2);
                uiGraphics.lineTo(pos.x, pos.y - 18);
                uiGraphics.lineTo(pos.x - TILE_WIDTH/2, pos.y - 18 - TILE_HEIGHT/2);
                uiGraphics.closePath();
                uiGraphics.fill();

                uiGraphics.fillStyle(darkenColor(wallColor, 0.8));
                uiGraphics.beginPath();
                uiGraphics.moveTo(pos.x, pos.y + TILE_HEIGHT/2);
                uiGraphics.lineTo(pos.x + TILE_WIDTH/2, pos.y);
                uiGraphics.lineTo(pos.x + TILE_WIDTH/2, pos.y - 18);
                uiGraphics.lineTo(pos.x, pos.y - 18 + TILE_HEIGHT/2);
                uiGraphics.closePath();
                uiGraphics.fill();
            }

            // Draw bushes
            if (tile.terrain === TERRAIN.BUSH && tile.visible) {
                uiGraphics.fillStyle(COLORS.BUSH_LIGHT);
                uiGraphics.fillCircle(pos.x, pos.y - 8, 7);
                uiGraphics.fillCircle(pos.x - 5, pos.y - 5, 5);
                uiGraphics.fillCircle(pos.x + 5, pos.y - 5, 5);
            }

            // Draw flowers
            if (tile.terrain === TERRAIN.FLOWERS && tile.visible) {
                uiGraphics.fillStyle(0xff8844);
                for (let i = 0; i < 4; i++) {
                    const fx = pos.x + (Math.random() - 0.5) * 12;
                    const fy = pos.y - 2 + (Math.random() - 0.5) * 4;
                    uiGraphics.fillCircle(fx, fy, 2);
                }
            }

            // Draw fence
            if (tile.terrain === TERRAIN.FENCE && tile.visible) {
                uiGraphics.fillStyle(COLORS.FENCE);
                uiGraphics.fillRect(pos.x - 6, pos.y - 14, 2, 14);
                uiGraphics.fillRect(pos.x + 4, pos.y - 14, 2, 14);
                uiGraphics.fillStyle(0xe8d4b2);
                uiGraphics.fillRect(pos.x - 6, pos.y - 12, 12, 2);
                uiGraphics.fillRect(pos.x - 6, pos.y - 6, 12, 2);
            }
        }
    }

    // Draw units
    const allUnits = [...soldiers, ...aliens].filter(u => u.isAlive).sort((a, b) => (a.x + a.y) - (b.x + b.y));
    for (let unit of allUnits) {
        if (unit.type === 'alien' && !unit.spotted) continue;

        const pos = toIso(unit.x, unit.y);
        const isSelected = gameState.selectedUnit === unit;
        const bodyHeight = unit.stance === 'kneeling' ? 14 : 22;

        // Shadow
        uiGraphics.fillStyle(0x000000, 0.5);
        uiGraphics.fillEllipse(pos.x, pos.y + 2, 10, 5);

        if (unit.type === 'soldier') {
            const armorColor = isSelected ? COLORS.SOLDIER_ARMOR_LIGHT : COLORS.SOLDIER_ARMOR;

            // Legs
            uiGraphics.fillStyle(0x333344);
            uiGraphics.fillRect(pos.x - 4, pos.y - 8, 3, 8);
            uiGraphics.fillRect(pos.x + 1, pos.y - 8, 3, 8);

            // Body
            uiGraphics.fillStyle(armorColor);
            uiGraphics.beginPath();
            uiGraphics.moveTo(pos.x - 7, pos.y - 8);
            uiGraphics.lineTo(pos.x + 7, pos.y - 8);
            uiGraphics.lineTo(pos.x + 6, pos.y - bodyHeight);
            uiGraphics.lineTo(pos.x - 6, pos.y - bodyHeight);
            uiGraphics.closePath();
            uiGraphics.fill();

            // Helmet
            uiGraphics.fillStyle(0x334455);
            uiGraphics.fillCircle(pos.x, pos.y - bodyHeight - 4, 6);

            // Visor
            uiGraphics.fillStyle(0xaaccff);
            uiGraphics.fillRect(pos.x - 4, pos.y - bodyHeight - 6, 8, 4);

            // Weapon
            uiGraphics.fillStyle(0x444444);
            uiGraphics.fillRect(pos.x + 5, pos.y - bodyHeight + 4, 8, 3);

        } else {
            // Sectoid
            uiGraphics.fillStyle(0x666677);
            uiGraphics.fillRect(pos.x - 5, pos.y - 12, 10, 12);

            uiGraphics.fillStyle(COLORS.SECTOID_SKIN);
            uiGraphics.fillEllipse(pos.x, pos.y - 18, 8, 10);

            uiGraphics.fillStyle(0x000000);
            uiGraphics.fillEllipse(pos.x - 4, pos.y - 20, 4, 5);
            uiGraphics.fillEllipse(pos.x + 4, pos.y - 20, 4, 5);
        }

        // Selection arrow
        if (isSelected) {
            uiGraphics.fillStyle(0xffff00);
            uiGraphics.fillTriangle(
                pos.x, pos.y - bodyHeight - 20,
                pos.x - 6, pos.y - bodyHeight - 12,
                pos.x + 6, pos.y - bodyHeight - 12
            );
        }

        // Health bar
        if (unit.health.current < unit.health.base) {
            const healthPct = unit.health.current / unit.health.base;
            uiGraphics.fillStyle(0x440000);
            uiGraphics.fillRect(pos.x - 10, pos.y - bodyHeight - 28, 20, 4);
            uiGraphics.fillStyle(healthPct > 0.5 ? 0x00cc00 : healthPct > 0.25 ? 0xcccc00 : 0xcc0000);
            uiGraphics.fillRect(pos.x - 10, pos.y - bodyHeight - 28, 20 * healthPct, 4);
        }
    }
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.progress += 0.15;

        if (p.progress >= 1) {
            projectiles.splice(i, 1);
            continue;
        }

        const x = p.x + (p.targetX - p.x) * p.progress;
        const y = p.y + (p.targetY - p.y) * p.progress;

        uiGraphics.fillStyle(p.color);
        uiGraphics.fillCircle(x, y, 4);

        uiGraphics.lineStyle(2, p.color, 0.4);
        uiGraphics.lineBetween(p.x, p.y, x, y);
    }
}

function drawUI() {
    // UI Background
    uiGraphics.fillStyle(COLORS.UI_BG);
    uiGraphics.fillRect(0, GAME_HEIGHT, 640, UI_HEIGHT);

    // Border
    uiGraphics.lineStyle(3, 0x4444aa);
    uiGraphics.lineBetween(0, GAME_HEIGHT, 640, GAME_HEIGHT);

    // Left panel
    drawPanel(8, GAME_HEIGHT + 8, 78, 75);

    // R label
    scene.add.text ? null : null; // Text handled below
    uiGraphics.fillStyle(0xaa4444);
    // R text drawn via separate text object if needed

    // Reserve TU boxes
    const reserveColors = [0x44aa44, 0x4444aa, 0xaa8844, 0xaa44aa];
    for (let i = 0; i < 4; i++) {
        const bx = 38 + (i % 2) * 22;
        const by = GAME_HEIGHT + 15 + Math.floor(i / 2) * 28;
        uiGraphics.fillStyle(reserveColors[i]);
        uiGraphics.fillRect(bx, by, 18, 18);
    }

    // Action buttons
    for (let i = 0; i < 8; i++) {
        const bx = 95 + (i % 4) * 40;
        const by = GAME_HEIGHT + 10 + Math.floor(i / 2) * 38;
        drawPanel(bx, by, 36, 32);
    }

    // Selected unit panel
    if (gameState.selectedUnit) {
        const unit = gameState.selectedUnit;

        // Name panel
        drawPanel(268, GAME_HEIGHT + 8, 140, 24);

        // Stats bars
        const barX = 268;
        let barY = GAME_HEIGHT + 40;

        // TU Bar
        uiGraphics.fillStyle(0x446688);
        uiGraphics.fillRect(barX, barY, 100, 14);
        uiGraphics.fillStyle(0x5599cc);
        uiGraphics.fillRect(barX, barY, 100 * (unit.tu.current / unit.tu.base), 14);

        // HP Bar
        barY += 18;
        uiGraphics.fillStyle(0x446644);
        uiGraphics.fillRect(barX, barY, 100, 14);
        uiGraphics.fillStyle(0x55aa55);
        uiGraphics.fillRect(barX, barY, 100 * (unit.health.current / unit.health.base), 14);

        // Morale Bar
        barY += 18;
        uiGraphics.fillStyle(0x664422);
        uiGraphics.fillRect(barX, barY, 100, 14);
        uiGraphics.fillStyle(0xaa8844);
        uiGraphics.fillRect(barX, barY, 100 * (unit.morale / 100), 14);
    }

    // Right panel
    drawPanel(552, GAME_HEIGHT + 8, 80, 75);

    // Turn indicator background
    uiGraphics.fillStyle(gameState.turn === 'player' ? 0x224422 : 0x442222);
    uiGraphics.fillRect(420, GAME_HEIGHT + 10, 120, 80);

    // Add text elements (Phaser text)
    drawTextElements();
}

// Text objects cache
let textCache = {};

function drawTextElements() {
    const texts = [
        { key: 'r_label', x: 18, y: GAME_HEIGHT + 30, text: 'R', style: { font: 'bold 16px monospace', fill: '#aa4444' } },
        { key: 'turn', x: 425, y: GAME_HEIGHT + 15, text: gameState.turn === 'player' ? 'YOUR TURN' : 'ALIEN TURN',
          style: { font: 'bold 14px monospace', fill: gameState.turn === 'player' ? '#44ff44' : '#ff4444' } },
        { key: 'turn_num', x: 425, y: GAME_HEIGHT + 35, text: `Turn ${gameState.turnNumber}`,
          style: { font: '12px monospace', fill: '#888888' } },
        { key: 'soldiers', x: 425, y: GAME_HEIGHT + 55, text: `Soldiers: ${soldiers.filter(s => s.isAlive).length}`,
          style: { font: '12px monospace', fill: '#5588ff' } },
        { key: 'aliens', x: 425, y: GAME_HEIGHT + 72, text: `Known Aliens: ${aliens.filter(a => a.isAlive && a.spotted).length}`,
          style: { font: '12px monospace', fill: '#ff5555' } },
        { key: 'controls1', x: 12, y: GAME_HEIGHT + 115, text: 'Click: Select/Move | S: Snap | A: Aimed | K: Kneel | E: End Turn',
          style: { font: '10px monospace', fill: '#555555' } },
        { key: 'controls2', x: 12, y: GAME_HEIGHT + 130, text: '1-6: Select Soldier | Space: Cycle | R: Reload',
          style: { font: '10px monospace', fill: '#555555' } }
    ];

    // Add selected unit info
    if (gameState.selectedUnit) {
        const unit = gameState.selectedUnit;
        texts.push(
            { key: 'name', x: 278, y: GAME_HEIGHT + 14, text: unit.name, style: { font: '13px monospace', fill: '#ffffff' } },
            { key: 'tu', x: 272, y: GAME_HEIGHT + 42, text: `${unit.tu.current}`, style: { font: '10px monospace', fill: '#ffffff' } },
            { key: 'hp', x: 272, y: GAME_HEIGHT + 60, text: `${unit.health.current}`, style: { font: '10px monospace', fill: '#ffffff' } },
            { key: 'mor', x: 272, y: GAME_HEIGHT + 78, text: `${unit.morale}`, style: { font: '10px monospace', fill: '#ffffff' } },
            { key: 'ammo', x: 268, y: GAME_HEIGHT + 100, text: `Ammo: ${unit.weapon.currentAmmo}/${unit.weapon.ammo}`,
              style: { font: '11px monospace', fill: '#888888' } },
            { key: 'weapon', x: 560, y: GAME_HEIGHT + 50, text: unit.weapon.name, style: { font: '10px monospace', fill: '#777777' } }
        );
    }

    // Add message
    if (gameState.messageTimer > 0) {
        texts.push({ key: 'message', x: 12, y: GAME_HEIGHT + 95, text: gameState.message,
                     style: { font: '12px monospace', fill: '#ffff00' } });
    }

    // Create/update text objects
    for (let t of texts) {
        if (!textCache[t.key]) {
            textCache[t.key] = scene.add.text(t.x, t.y, t.text, t.style);
        } else {
            textCache[t.key].setPosition(t.x, t.y);
            textCache[t.key].setText(t.text);
            textCache[t.key].setStyle(t.style);
        }
        textCache[t.key].setVisible(true);
    }

    // Hide unused texts
    const usedKeys = texts.map(t => t.key);
    for (let key in textCache) {
        if (!usedKeys.includes(key)) {
            textCache[key].setVisible(false);
        }
    }
}

function drawPanel(x, y, w, h) {
    uiGraphics.fillStyle(COLORS.UI_PANEL);
    uiGraphics.fillRect(x, y, w, h);

    uiGraphics.fillStyle(0x777788);
    uiGraphics.fillRect(x + 2, y + 2, w - 4, 2);
    uiGraphics.fillRect(x + 2, y + 2, 2, h - 4);

    uiGraphics.fillStyle(0x333344);
    uiGraphics.fillRect(x + 2, y + h - 4, w - 4, 2);
    uiGraphics.fillRect(x + w - 4, y + 2, 2, h - 4);
}

function drawGameOverScreen() {
    uiGraphics.fillStyle(0x000000, 0.75);
    uiGraphics.fillRect(0, 0, 640, 480);

    const titleKey = 'gameover_title';
    const subtitleKey = 'gameover_subtitle';

    if (!textCache[titleKey]) {
        textCache[titleKey] = scene.add.text(320, 220, '', {
            font: 'bold 28px monospace'
        }).setOrigin(0.5);
    }
    if (!textCache[subtitleKey]) {
        textCache[subtitleKey] = scene.add.text(320, 260, 'Press R to restart', {
            font: '14px monospace', fill: '#ffffff'
        }).setOrigin(0.5);
    }

    textCache[titleKey].setText(gameState.state === 'victory' ? 'MISSION COMPLETE!' : 'MISSION FAILED');
    textCache[titleKey].setColor(gameState.state === 'victory' ? '#44ff44' : '#ff4444');
    textCache[titleKey].setVisible(true);
    textCache[subtitleKey].setVisible(true);
}

function darkenColor(color, factor) {
    const r = ((color >> 16) & 0xff) * factor;
    const g = ((color >> 8) & 0xff) * factor;
    const b = (color & 0xff) * factor;
    return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}
