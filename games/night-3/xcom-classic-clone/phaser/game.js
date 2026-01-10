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
    messageTimer: 0,
    debugMode: false,
    screenShake: 0,
    shakeOffsetX: 0,
    shakeOffsetY: 0,
    turnAnnouncement: null,
    showHelp: false,
    endTurnConfirm: false,
    showTitle: true,
    deploymentPhase: false, // New deployment phase
    deploymentPositions: []  // Valid spawn positions
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
let floatingTexts = [];
let pathPreview = [];
let muzzleFlashes = [];
let hitParticles = [];
let explosions = [];
let footstepDust = [];
let deathEffects = [];
let scorchMarks = [];
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
    this.input.on('pointermove', handlePointerMove);
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
    let gfx = scene.make.graphics({ add: false });

    // Enhanced soldier texture
    // Boots
    gfx.fillStyle(0x222233);
    gfx.fillRect(2, 24, 5, 4);
    gfx.fillRect(9, 24, 5, 4);
    // Legs with armor
    gfx.fillStyle(0x335588);
    gfx.fillRect(3, 16, 4, 8);
    gfx.fillRect(9, 16, 4, 8);
    // Knee pads
    gfx.fillStyle(0x6699cc);
    gfx.fillRect(3, 19, 4, 2);
    gfx.fillRect(9, 19, 4, 2);
    // Body armor
    gfx.fillStyle(COLORS.SOLDIER_ARMOR);
    gfx.fillRect(1, 8, 14, 9);
    // Chest highlight
    gfx.fillStyle(0x6699cc);
    gfx.fillRect(2, 9, 5, 5);
    // Belt
    gfx.fillStyle(0x333333);
    gfx.fillRect(1, 15, 14, 2);
    // Shoulder pads
    gfx.fillStyle(COLORS.SOLDIER_ARMOR);
    gfx.fillCircle(1, 10, 3);
    gfx.fillCircle(15, 10, 3);
    // Neck
    gfx.fillStyle(0x445566);
    gfx.fillRect(5, 5, 6, 3);
    // Helmet
    gfx.fillStyle(0x334455);
    gfx.fillCircle(8, 4, 5);
    // Visor glow
    gfx.fillStyle(0xaaccff);
    gfx.fillRect(4, 2, 8, 3);
    // Weapon
    gfx.fillStyle(0x444444);
    gfx.fillRect(14, 11, 8, 2);
    gfx.generateTexture('soldier', 22, 28);

    // Selected soldier (brighter)
    gfx.clear();
    gfx.fillStyle(0x222233);
    gfx.fillRect(2, 24, 5, 4);
    gfx.fillRect(9, 24, 5, 4);
    gfx.fillStyle(0x4477aa);
    gfx.fillRect(3, 16, 4, 8);
    gfx.fillRect(9, 16, 4, 8);
    gfx.fillStyle(0x88bbdd);
    gfx.fillRect(3, 19, 4, 2);
    gfx.fillRect(9, 19, 4, 2);
    gfx.fillStyle(COLORS.SOLDIER_ARMOR_LIGHT);
    gfx.fillRect(1, 8, 14, 9);
    gfx.fillStyle(0x88bbdd);
    gfx.fillRect(2, 9, 5, 5);
    gfx.fillStyle(0x333333);
    gfx.fillRect(1, 15, 14, 2);
    gfx.fillStyle(COLORS.SOLDIER_ARMOR_LIGHT);
    gfx.fillCircle(1, 10, 3);
    gfx.fillCircle(15, 10, 3);
    gfx.fillStyle(0x445566);
    gfx.fillRect(5, 5, 6, 3);
    gfx.fillStyle(0x445566);
    gfx.fillCircle(8, 4, 5);
    gfx.fillStyle(0xccddff);
    gfx.fillRect(4, 2, 8, 3);
    gfx.fillStyle(0x444444);
    gfx.fillRect(14, 11, 8, 2);
    gfx.generateTexture('soldier_selected', 22, 28);

    // Enhanced Sectoid texture - big head alien
    gfx.clear();
    // Thin body
    gfx.fillStyle(0x666677);
    gfx.fillRect(5, 18, 6, 10);
    // Arms
    gfx.fillStyle(COLORS.SECTOID_SKIN);
    gfx.fillRect(1, 16, 3, 8);
    gfx.fillRect(12, 16, 3, 8);
    // Huge head
    gfx.fillStyle(COLORS.SECTOID_SKIN);
    gfx.fillEllipse(8, 8, 16, 18);
    // Head highlight
    gfx.fillStyle(0x9999aa);
    gfx.fillEllipse(5, 5, 8, 10);
    // Large black almond eyes
    gfx.fillStyle(0x000000);
    gfx.fillEllipse(4, 8, 6, 8);
    gfx.fillEllipse(12, 8, 6, 8);
    // Eye shine
    gfx.fillStyle(0x333355);
    gfx.fillEllipse(3, 6, 2, 3);
    gfx.fillEllipse(11, 6, 2, 3);
    // Plasma pistol
    gfx.fillStyle(0x336633);
    gfx.fillRect(13, 20, 5, 2);
    gfx.generateTexture('sectoid', 18, 28);

    // Selection arrow
    gfx.clear();
    gfx.fillStyle(0xffff00);
    gfx.fillTriangle(8, 0, 0, 10, 16, 10);
    gfx.generateTexture('arrow', 16, 12);

    // Lamp post texture
    gfx.clear();
    gfx.fillStyle(0x444455);
    gfx.fillRect(6, 10, 4, 40);
    gfx.fillRect(6, 10, 12, 3);
    gfx.fillStyle(0x666677);
    gfx.fillRect(14, 6, 8, 6);
    gfx.fillStyle(0xffffcc);
    gfx.fillRect(15, 11, 6, 3);
    gfx.generateTexture('lamppost', 24, 50);

    gfx.destroy();
}

function generateMap() {
    map = [];
    gameState.deploymentPositions = [];

    // First pass: base terrain
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            let terrain = Math.random() < 0.5 ? TERRAIN.GRASS : TERRAIN.GRASS_DARK;
            map[y][x] = {
                terrain: terrain,
                visible: false,
                explored: false,
                unit: null
            };
        }
    }

    // Generate procedural road (vertical or horizontal)
    const roadType = Math.random();
    if (roadType < 0.5) {
        // Vertical road
        const roadX = 8 + Math.floor(Math.random() * 4);
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let rx = -1; rx <= 1; rx++) {
                if (roadX + rx >= 0 && roadX + rx < MAP_WIDTH) {
                    map[y][roadX + rx].terrain = TERRAIN.ROAD;
                }
            }
        }
    } else {
        // Horizontal road
        const roadY = 8 + Math.floor(Math.random() * 4);
        for (let x = 0; x < MAP_WIDTH; x++) {
            for (let ry = -1; ry <= 1; ry++) {
                if (roadY + ry >= 0 && roadY + ry < MAP_HEIGHT) {
                    map[roadY + ry][x].terrain = TERRAIN.ROAD;
                }
            }
        }
    }

    // Generate 1-3 buildings at random positions
    const numBuildings = 1 + Math.floor(Math.random() * 3);
    for (let b = 0; b < numBuildings; b++) {
        const bw = 3 + Math.floor(Math.random() * 3);
        const bh = 3 + Math.floor(Math.random() * 3);
        const bx = 8 + Math.floor(Math.random() * (MAP_WIDTH - bw - 10));
        const by = 5 + Math.floor(Math.random() * (MAP_HEIGHT - bh - 8));

        // Draw walls
        for (let y = by; y <= by + bh; y++) {
            for (let x = bx; x <= bx + bw; x++) {
                if (x === bx || x === bx + bw || y === by || y === by + bh) {
                    map[y][x].terrain = TERRAIN.WALL_BRICK;
                } else {
                    map[y][x].terrain = TERRAIN.ROAD; // Floor inside
                }
            }
        }

        // Add door
        const doorSide = Math.floor(Math.random() * 4);
        if (doorSide === 0 && by > 0) map[by][bx + Math.floor(bw / 2)].terrain = TERRAIN.ROAD;
        else if (doorSide === 1 && by + bh < MAP_HEIGHT - 1) map[by + bh][bx + Math.floor(bw / 2)].terrain = TERRAIN.ROAD;
        else if (doorSide === 2 && bx > 0) map[by + Math.floor(bh / 2)][bx].terrain = TERRAIN.ROAD;
        else if (bx + bw < MAP_WIDTH - 1) map[by + Math.floor(bh / 2)][bx + bw].terrain = TERRAIN.ROAD;
    }

    // Add deployment zone (left side dirt area)
    const deploySize = 5;
    for (let y = 1; y < deploySize + 1; y++) {
        for (let x = 1; x < deploySize + 1; x++) {
            map[y][x].terrain = TERRAIN.DIRT;
            if (map[y][x].terrain.walkable && !map[y][x].unit) {
                gameState.deploymentPositions.push({ x, y });
            }
        }
    }

    // Add random bushes and flowers in grass
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (map[y][x].terrain.type && map[y][x].terrain.type.includes('grass')) {
                if (Math.random() < 0.12) map[y][x].terrain = TERRAIN.BUSH;
                else if (Math.random() < 0.08) map[y][x].terrain = TERRAIN.FLOWERS;
            }
        }
    }

    // Add fence line
    const fenceY = 10 + Math.floor(Math.random() * 5);
    const fenceStartX = 1 + Math.floor(Math.random() * 3);
    const fenceEndX = fenceStartX + 4 + Math.floor(Math.random() * 3);
    for (let x = fenceStartX; x <= fenceEndX; x++) {
        if (x < MAP_WIDTH && map[fenceY][x].terrain.type && map[fenceY][x].terrain.type.includes('grass')) {
            map[fenceY][x].terrain = TERRAIN.FENCE;
        }
    }
}

function createUnits() {
    const names = ['Johnson', 'Williams', 'Martinez', 'Lee', 'Thompson', 'Garcia'];
    const positions = [[2, 2], [3, 2], [4, 2], [2, 3], [3, 3], [4, 3]];

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
            secondaryWeapon: { name: 'Pistol', damage: 26, snapShot: { accuracy: 65, tuPercent: 18 }, aimedShot: { accuracy: 85, tuPercent: 40 }, autoShot: null, ammo: 12, currentAmmo: 12 },
            usingPrimary: true,
            isAlive: true,
            overwatch: false,
            kills: 0,
            grenades: 2,
            sprite: null,
            arrow: null,
            deployed: false // Track if deployed during deployment phase
        };
        soldiers.push(s);
        map[s.y][s.x].unit = s;
    }

    // Generate alien positions randomly across the right side of map
    const alienCount = 7 + Math.floor(Math.random() * 4); // 7-10 aliens
    aliens = [];

    for (let i = 0; i < alienCount; i++) {
        let ax, ay, attempts = 0;
        do {
            ax = 10 + Math.floor(Math.random() * (MAP_WIDTH - 12));
            ay = Math.floor(Math.random() * MAP_HEIGHT);
            attempts++;
        } while (attempts < 50 && (!map[ay] || !map[ay][ax] || !map[ay][ax].terrain.walkable || map[ay][ax].unit));

        if (attempts >= 50) continue;

        const isFloater = i >= alienCount - 3; // Last 3 aliens are Floaters
        const a = {
            type: 'alien',
            alienType: isFloater ? 'floater' : 'sectoid',
            name: isFloater ? 'Floater' : 'Sectoid',
            x: ax,
            y: ay,
            facing: 6,
            stance: 'standing',
            tu: { base: isFloater ? 60 : 54, current: isFloater ? 60 : 54 },
            health: { base: isFloater ? 45 : 30, current: isFloater ? 45 : 30 },
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
        x: (x - y) * (TILE_WIDTH / 2) + 320 + gameState.shakeOffsetX,
        y: (x + y) * (TILE_HEIGHT / 2) + 50 + gameState.shakeOffsetY
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
        const wasSpotted = a.spotted;
        a.spotted = map[a.y][a.x].visible;
        // Alien spotted alert
        if (!wasSpotted && a.spotted) {
            createFloatingText(a.x, a.y, 'SPOTTED!', 0xff4444);
            setMessage(`${a.name} spotted!`);
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
    // Create footstep dust at old position
    createFootstepDust(unit.x, unit.y);
    unit.tu.current -= totalCost;
    unit.x = path[path.length - 1].x;
    unit.y = path[path.length - 1].y;
    map[unit.y][unit.x].unit = unit;

    // Cancel overwatch when moving
    if (unit.type === 'soldier' && unit.overwatch) {
        unit.overwatch = false;
    }

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
            let damage = Math.floor(weapon.damage * (0.5 + Math.random() * 1.5));
            // Critical hit system - 15% chance for 2x damage
            let isCritical = Math.random() < 0.15;
            if (isCritical) {
                damage = Math.floor(damage * 2);
            }
            target.health.current -= damage;
            if (isCritical) {
                createFloatingText(target.x, target.y, `CRIT! -${damage}`, 0xff0000);
                gameState.screenShake = Math.min(20, 8 + damage / 5);
            } else {
                createFloatingText(target.x, target.y, `-${damage}`, shooter.type === 'alien' ? 0x00ff44 : 0xff8800);
                gameState.screenShake = Math.min(12, 4 + damage / 10);
            }
            createHitParticles(target.x, target.y, true);
            setMessage(isCritical ? `CRITICAL HIT! ${damage} damage to ${target.name}!` : `Hit! ${damage} damage to ${target.name}`);

            if (target.health.current <= 0) {
                target.isAlive = false;
                map[target.y][target.x].unit = null;
                // Create death effect
                createDeathEffect(target.x, target.y, target.type === 'alien');
                // Morale effect when soldier dies
                if (target.type === 'soldier') {
                    for (let s of soldiers) {
                        if (s.isAlive && s !== target) {
                            s.morale = Math.max(0, s.morale - 15);
                            if (s.morale < 30) {
                                createFloatingText(s.x, s.y, 'PANIC!', 0xffff00);
                            }
                        }
                    }
                }
                // Award kill to shooter
                if (shooter.type === 'soldier' && target.type === 'alien') {
                    shooter.kills++;
                    // Boost morale on kill
                    shooter.morale = Math.min(100, shooter.morale + 10);
                    const newRank = getSoldierRank(shooter.kills);
                    const oldRank = getSoldierRank(shooter.kills - 1);
                    if (newRank.name !== oldRank.name) {
                        createFloatingText(shooter.x, shooter.y, `${newRank.name}!`, newRank.color);
                    }
                }
                setMessage(`${target.name} killed!`);
            }
        } else {
            createFloatingText(target.x, target.y, 'MISS', 0x888888);
            createHitParticles(target.x, target.y, false);
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
    // Create muzzle flash
    createMuzzleFlash(from.x, from.y, from.type === 'alien' ? 0x00ff44 : 0xffff00);
}

function createMuzzleFlash(tileX, tileY, color) {
    const pos = toIso(tileX, tileY);
    muzzleFlashes.push({
        x: pos.x + 8,
        y: pos.y - 18,
        radius: 12,
        color: color,
        life: 8
    });
}

function updateMuzzleFlashes() {
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
        const mf = muzzleFlashes[i];
        mf.life--;
        mf.radius *= 0.85;
        if (mf.life <= 0) {
            muzzleFlashes.splice(i, 1);
            continue;
        }
        const alpha = mf.life / 8;
        uiGraphics.fillStyle(mf.color, alpha);
        uiGraphics.fillCircle(mf.x, mf.y, mf.radius);
        uiGraphics.fillStyle(0xffffff, alpha * 0.5);
        uiGraphics.fillCircle(mf.x, mf.y, mf.radius * 0.5);
    }
}

function createHitParticles(tileX, tileY, isHit) {
    const pos = toIso(tileX, tileY);
    const color = isHit ? 0xff6600 : 0x888888;
    const count = isHit ? 8 : 4;
    for (let i = 0; i < count; i++) {
        hitParticles.push({
            x: pos.x + (Math.random() - 0.5) * 10,
            y: pos.y - 15 + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 4,
            vy: -2 + Math.random() * -3,
            color: color,
            life: 20 + Math.random() * 10
        });
    }
}

function updateHitParticles() {
    for (let i = hitParticles.length - 1; i >= 0; i--) {
        const p = hitParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // gravity
        p.life--;
        if (p.life <= 0) {
            hitParticles.splice(i, 1);
            continue;
        }
        const alpha = p.life / 30;
        uiGraphics.fillStyle(p.color, alpha);
        uiGraphics.fillCircle(p.x, p.y, 2);
    }
}

function checkReactionFire(movingUnit, tuSpent) {
    const enemies = movingUnit.type === 'soldier' ? aliens : soldiers;
    for (let enemy of enemies) {
        if (!enemy.isAlive || (enemy.type === 'alien' && !enemy.spotted)) continue;
        if (!hasLineOfSight(enemy.x, enemy.y, movingUnit.x, movingUnit.y)) continue;

        let reactionScore = enemy.reactions * enemy.tu.current;
        // Overwatch doubles reaction score for soldiers
        if (enemy.type === 'soldier' && enemy.overwatch) {
            reactionScore *= 2;
        }
        const targetScore = movingUnit.reactions * tuSpent;

        if (reactionScore > targetScore && enemy.tu.current >= 15 && enemy.weapon.currentAmmo > 0) {
            if (enemy.overwatch) {
                setMessage(`${enemy.name} OVERWATCH fire!`);
            } else {
                setMessage(`${enemy.name} reaction fire!`);
            }
            fireWeapon(enemy, movingUnit, 'snap');
            if (enemy.type === 'soldier') enemy.overwatch = false; // Cancel after firing
        }
    }
}

function setMessage(msg) {
    gameState.message = msg;
    gameState.messageTimer = 180;
}

function getSoldierRank(kills) {
    if (kills >= 10) return { name: 'Colonel', color: 0xffd700 };
    if (kills >= 7) return { name: 'Captain', color: 0xc0c0c0 };
    if (kills >= 5) return { name: 'Sergeant', color: 0xcd7f32 };
    if (kills >= 3) return { name: 'Corporal', color: 0x888888 };
    if (kills >= 1) return { name: 'Private', color: 0x555555 };
    return { name: 'Rookie', color: 0x444444 };
}

function getCoverStatus(unit) {
    // Check adjacent tiles for cover
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let hasFull = false;
    let hasPartial = false;
    for (let [dx, dy] of dirs) {
        const nx = unit.x + dx;
        const ny = unit.y + dy;
        if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
            const terrain = map[ny][nx].terrain;
            if (terrain.cover === 'full') hasFull = true;
            if (terrain.cover === 'partial') hasPartial = true;
        }
    }
    if (hasFull) return { type: 'FULL', color: '#44ff44' };
    if (hasPartial) return { type: 'PARTIAL', color: '#ffff44' };
    return { type: 'NONE', color: '#ff4444' };
}

function throwFragGrenade(soldier, targetX, targetY) {
    if (soldier.grenades <= 0) {
        setMessage('No grenades!');
        return false;
    }
    if (soldier.tu.current < 25) {
        setMessage('Need 25 TU to throw grenade!');
        return false;
    }

    soldier.grenades--;
    soldier.tu.current -= 25;

    // Create explosion
    const pos = toIso(targetX, targetY);
    explosions.push({
        x: pos.x,
        y: pos.y - 10,
        radius: 0,
        maxRadius: 30,
        life: 25
    });

    gameState.screenShake = 15;

    // Create scorch marks
    scorchMarks.push({ x: targetX, y: targetY, alpha: 0.8 });
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (Math.random() < 0.5) {
                scorchMarks.push({ x: targetX + dx, y: targetY + dy, alpha: 0.4 + Math.random() * 0.3 });
            }
        }
    }

    // Area damage (3x3 area)
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const tx = targetX + dx;
            const ty = targetY + dy;
            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) continue;
            const unit = map[ty][tx].unit;
            if (unit && unit.isAlive) {
                const dist = Math.abs(dx) + Math.abs(dy);
                const damage = Math.floor((dist === 0 ? 50 : 30) * (0.5 + Math.random()));
                unit.health.current -= damage;
                createFloatingText(tx, ty, `-${damage}`, 0xff6600);
                createHitParticles(tx, ty, true);
                if (unit.health.current <= 0) {
                    unit.isAlive = false;
                    map[ty][tx].unit = null;
                    if (unit.type === 'alien') {
                        soldier.kills++;
                    }
                }
            }
        }
    }
    setMessage('Grenade thrown!');
    return true;
}

function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const e = explosions[i];
        e.life--;
        e.radius = e.maxRadius * (1 - e.life / 25);
        if (e.life <= 0) {
            explosions.splice(i, 1);
            continue;
        }
        const alpha = e.life / 25;
        uiGraphics.fillStyle(0xff6600, alpha * 0.5);
        uiGraphics.fillCircle(e.x, e.y, e.radius);
        uiGraphics.fillStyle(0xffff00, alpha * 0.3);
        uiGraphics.fillCircle(e.x, e.y, e.radius * 0.6);
    }
}

function createFootstepDust(tileX, tileY) {
    const pos = toIso(tileX, tileY);
    for (let i = 0; i < 4; i++) {
        footstepDust.push({
            x: pos.x + (Math.random() - 0.5) * 8,
            y: pos.y + (Math.random() - 0.5) * 4,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -0.5 - Math.random(),
            life: 15 + Math.random() * 10
        });
    }
}

function createDeathEffect(tileX, tileY, isAlien) {
    const pos = toIso(tileX, tileY);
    // Blood splatter particles
    const color = isAlien ? 0x00ff44 : 0xcc0000;
    for (let i = 0; i < 12; i++) {
        deathEffects.push({
            type: 'blood',
            x: pos.x + (Math.random() - 0.5) * 15,
            y: pos.y - 10 + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 4,
            vy: -2 + Math.random() * -3,
            color: color,
            size: 2 + Math.random() * 3,
            life: 30 + Math.random() * 20
        });
    }
    // Skull indicator briefly
    deathEffects.push({
        type: 'skull',
        x: pos.x,
        y: pos.y - 25,
        life: 45
    });
}

function updateDeathEffects() {
    for (let i = deathEffects.length - 1; i >= 0; i--) {
        const e = deathEffects[i];
        e.life--;
        if (e.life <= 0) {
            deathEffects.splice(i, 1);
            continue;
        }
        if (e.type === 'blood') {
            e.x += e.vx;
            e.y += e.vy;
            e.vy += 0.15;
            e.vx *= 0.98;
            const alpha = e.life / 50;
            uiGraphics.fillStyle(e.color, alpha);
            uiGraphics.fillCircle(e.x, e.y, e.size);
        } else if (e.type === 'skull') {
            const alpha = e.life / 45;
            uiGraphics.fillStyle(0xffffff, alpha);
            // Simple skull shape
            uiGraphics.fillCircle(e.x, e.y, 6);
            uiGraphics.fillStyle(0x000000, alpha);
            uiGraphics.fillCircle(e.x - 2, e.y - 1, 2);
            uiGraphics.fillCircle(e.x + 2, e.y - 1, 2);
            uiGraphics.fillRect(e.x - 2, e.y + 2, 4, 2);
        }
    }
}

function updateFootstepDust() {
    for (let i = footstepDust.length - 1; i >= 0; i--) {
        const p = footstepDust[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) {
            footstepDust.splice(i, 1);
            continue;
        }
        const alpha = p.life / 25;
        uiGraphics.fillStyle(0x888866, alpha);
        uiGraphics.fillCircle(p.x, p.y, 2);
    }
}

function createFloatingText(tileX, tileY, text, color) {
    const pos = toIso(tileX, tileY);
    floatingTexts.push({
        x: pos.x,
        y: pos.y - 30,
        text: text,
        color: color,
        life: 60,
        vy: -1.5
    });
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.life--;
        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
            continue;
        }
        const alpha = ft.life / 60;
        const colorStr = '#' + ft.color.toString(16).padStart(6, '0');
        if (!ft.textObj) {
            ft.textObj = scene.add.text(ft.x, ft.y, ft.text, {
                font: 'bold 14px monospace',
                fill: colorStr
            }).setOrigin(0.5);
        }
        ft.textObj.setPosition(ft.x, ft.y);
        ft.textObj.setAlpha(alpha);
        if (ft.life <= 0) {
            ft.textObj.destroy();
        }
    }
    // Clean up destroyed text objects
    for (let ft of floatingTexts) {
        if (ft.life <= 0 && ft.textObj) {
            ft.textObj.destroy();
        }
    }
}

function showTurnAnnouncement(text, color) {
    gameState.turnAnnouncement = {
        text: text,
        color: color,
        y: 160,
        alpha: 1,
        life: 90
    };
}

function endTurn() {
    if (gameState.turn === 'player') {
        gameState.turn = 'enemy';
        showTurnAnnouncement('ALIEN ACTIVITY', 0xff4444);
        setMessage('Alien Activity...');
        for (let a of aliens) {
            if (a.isAlive) a.tu.current = a.tu.base;
        }
        scene.time.delayedCall(500, runAlienTurn);
    } else {
        gameState.turn = 'player';
        gameState.turnNumber++;
        showTurnAnnouncement('YOUR TURN', 0x44ff44);
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
    // Deployment phase - allow repositioning soldiers
    if (gameState.deploymentPhase) {
        if (pointer.y < GAME_HEIGHT) {
            const tile = fromIso(pointer.x, pointer.y);
            if (tile.x >= 0 && tile.x < MAP_WIDTH && tile.y >= 0 && tile.y < MAP_HEIGHT) {
                // Click on soldier to select
                const clickedSoldier = soldiers.find(s => s.isAlive && s.x === tile.x && s.y === tile.y);
                if (clickedSoldier) {
                    gameState.selectedUnit = clickedSoldier;
                    setMessage(`Selected ${clickedSoldier.name} - click deployment zone to reposition`);
                    return;
                }

                // Click on deployment zone to move selected soldier
                const isDeployZone = gameState.deploymentPositions.some(p => p.x === tile.x && p.y === tile.y);
                if (isDeployZone && gameState.selectedUnit && !map[tile.y][tile.x].unit) {
                    map[gameState.selectedUnit.y][gameState.selectedUnit.x].unit = null;
                    gameState.selectedUnit.x = tile.x;
                    gameState.selectedUnit.y = tile.y;
                    map[tile.y][tile.x].unit = gameState.selectedUnit;
                    setMessage(`${gameState.selectedUnit.name} deployed! SPACE to start mission.`);
                    return;
                } else if (isDeployZone && map[tile.y][tile.x].unit) {
                    setMessage('Position occupied!');
                }
            }
        }
        return;
    }

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

let targetingInfo = null;
let targetingHitText = null;
let pathCostText = null;

function handlePointerMove(pointer) {
    pathPreview = [];
    targetingInfo = null;
    if (gameState.turn !== 'player' || gameState.state !== 'playing') return;
    if (!gameState.selectedUnit || gameState.selectedUnit.type !== 'soldier') return;
    if (pointer.y >= GAME_HEIGHT) return;

    const tile = fromIso(pointer.x, pointer.y);
    if (tile.x >= 0 && tile.x < MAP_WIDTH && tile.y >= 0 && tile.y < MAP_HEIGHT) {
        const targetTile = map[tile.y][tile.x];
        // Check if hovering over an alien
        const alien = aliens.find(a => a.isAlive && a.spotted && a.x === tile.x && a.y === tile.y);
        if (alien && hasLineOfSight(gameState.selectedUnit.x, gameState.selectedUnit.y, alien.x, alien.y)) {
            const hitChance = calculateHitChance(gameState.selectedUnit, alien, 'snap');
            targetingInfo = {
                targetX: alien.x,
                targetY: alien.y,
                hitChance: hitChance
            };
        } else if (targetTile.terrain.walkable && !targetTile.unit) {
            pathPreview = findPath(gameState.selectedUnit.x, gameState.selectedUnit.y, tile.x, tile.y) || [];
        }
    }
}

function handleKeyDown(event) {
    const key = event.key.toLowerCase();

    // Title screen
    if (gameState.showTitle) {
        if (key === ' ') {
            gameState.showTitle = false;
            gameState.deploymentPhase = true;
            setMessage('DEPLOYMENT: Click soldiers then click deployment zone to position them. Press SPACE when ready.');
        }
        return;
    }

    // Deployment phase
    if (gameState.deploymentPhase) {
        if (key === ' ') {
            // End deployment and start combat
            gameState.deploymentPhase = false;
            for (let s of soldiers) s.deployed = true;
            updateVisibility();
            setMessage('Mission begins! Select a soldier (1-6) and move out.');
            showTurnAnnouncement('YOUR TURN', 0x44ff44);
        }
        return;
    }

    // Debug toggle works always
    if (key === 'q') {
        gameState.debugMode = !gameState.debugMode;
        return;
    }

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

    if (key === 'e') {
        // Check if any soldiers have significant TU remaining
        const soldiersWithTU = soldiers.filter(s => s.isAlive && s.tu.current > 20);
        if (soldiersWithTU.length > 0 && !gameState.endTurnConfirm) {
            gameState.endTurnConfirm = true;
            setMessage(`${soldiersWithTU.length} soldiers have TU! Press E again to confirm.`);
            return;
        }
        gameState.endTurnConfirm = false;
        endTurn();
    }

    if (key === 'r') {
        if (gameState.selectedUnit.tu.current >= 15) {
            gameState.selectedUnit.tu.current -= 15;
            gameState.selectedUnit.weapon.currentAmmo = gameState.selectedUnit.weapon.ammo;
            setMessage('Reloaded!');
        } else setMessage('Not enough TU to reload!');
    }

    if (key === 'o') {
        if (gameState.selectedUnit.type === 'soldier') {
            gameState.selectedUnit.overwatch = !gameState.selectedUnit.overwatch;
            if (gameState.selectedUnit.overwatch) {
                setMessage(`${gameState.selectedUnit.name} on OVERWATCH`);
            } else {
                setMessage(`${gameState.selectedUnit.name} overwatch cancelled`);
            }
        }
    }

    if (key === 'h') {
        gameState.showHelp = !gameState.showHelp;
    }

    if (key === 'w') {
        // Switch weapons
        if (gameState.selectedUnit.secondaryWeapon) {
            const primary = gameState.selectedUnit.weapon;
            const secondary = gameState.selectedUnit.secondaryWeapon;
            gameState.selectedUnit.weapon = secondary;
            gameState.selectedUnit.secondaryWeapon = primary;
            gameState.selectedUnit.usingPrimary = !gameState.selectedUnit.usingPrimary;
            setMessage(`Switched to ${gameState.selectedUnit.weapon.name}`);
        }
    }

    if (key === 't') {
        // Throw grenade at nearest visible alien
        const visibleAliens = aliens.filter(a => a.isAlive && a.spotted);
        if (visibleAliens.length > 0 && gameState.selectedUnit.grenades > 0) {
            const nearest = visibleAliens.reduce((a, b) =>
                distance(gameState.selectedUnit.x, gameState.selectedUnit.y, a.x, a.y) <
                distance(gameState.selectedUnit.x, gameState.selectedUnit.y, b.x, b.y) ? a : b);
            throwFragGrenade(gameState.selectedUnit, nearest.x, nearest.y);
            checkGameEnd();
        } else if (gameState.selectedUnit.grenades <= 0) {
            setMessage('No grenades remaining!');
        } else {
            setMessage('No visible targets for grenade!');
        }
    }
}

// UI Graphics object
let uiGraphics;

function createUI() {
    uiGraphics = scene.add.graphics();
}

function update() {
    // Update screen shake
    if (gameState.screenShake > 0) {
        gameState.shakeOffsetX = (Math.random() - 0.5) * gameState.screenShake * 2;
        gameState.shakeOffsetY = (Math.random() - 0.5) * gameState.screenShake * 2;
        gameState.screenShake *= 0.85;
        if (gameState.screenShake < 0.5) {
            gameState.screenShake = 0;
            gameState.shakeOffsetX = 0;
            gameState.shakeOffsetY = 0;
        }
    }

    // Clear and redraw everything
    uiGraphics.clear();

    // Draw map
    drawMap();

    // Draw projectiles
    updateProjectiles();

    // Draw muzzle flashes
    updateMuzzleFlashes();

    // Update hit particles
    updateHitParticles();

    // Update explosions
    updateExplosions();

    // Update footstep dust
    updateFootstepDust();

    // Update death effects
    updateDeathEffects();

    // Update floating texts
    updateFloatingTexts();

    // Draw turn announcement
    drawTurnAnnouncement();

    // Draw UI
    drawUI();

    // Draw help screen (overlay)
    drawHelpScreen();

    // Draw title screen
    drawTitleScreen();

    // Update message timer
    if (gameState.messageTimer > 0) gameState.messageTimer--;

    // Game over overlay
    if (gameState.state !== 'playing') {
        drawGameOverScreen();
    }
}

let turnAnnouncementText = null;

function drawTurnAnnouncement() {
    if (!gameState.turnAnnouncement) {
        if (turnAnnouncementText) turnAnnouncementText.setVisible(false);
        return;
    }

    const ann = gameState.turnAnnouncement;
    ann.life--;
    ann.y -= 0.5;
    ann.alpha = ann.life / 90;

    if (ann.life <= 0) {
        gameState.turnAnnouncement = null;
        if (turnAnnouncementText) turnAnnouncementText.setVisible(false);
        return;
    }

    if (!turnAnnouncementText) {
        turnAnnouncementText = scene.add.text(320, ann.y, ann.text, {
            font: 'bold 32px monospace',
            fill: '#' + ann.color.toString(16).padStart(6, '0')
        }).setOrigin(0.5);
    }
    turnAnnouncementText.setPosition(320, ann.y);
    turnAnnouncementText.setText(ann.text);
    turnAnnouncementText.setAlpha(ann.alpha);
    turnAnnouncementText.setStyle({ font: 'bold 32px monospace', fill: '#' + ann.color.toString(16).padStart(6, '0') });
    turnAnnouncementText.setVisible(true);
}

let helpTexts = [];
function drawHelpScreen() {
    if (!gameState.showHelp) {
        for (let t of helpTexts) t.setVisible(false);
        return;
    }

    uiGraphics.fillStyle(0x000000, 0.9);
    uiGraphics.fillRect(80, 40, 480, 280);
    uiGraphics.lineStyle(2, 0x4477aa);
    uiGraphics.strokeRect(80, 40, 480, 280);

    const lines = [
        '=== X-COM CONTROLS ===',
        '',
        '1-6: Select soldier    SPACE: Cycle soldiers',
        'Click: Select/Move     E: End turn',
        'S: Snap shot           A: Aimed shot',
        'F: Auto fire           R: Reload',
        'K: Kneel/Stand         O: Overwatch mode',
        'Q: Debug panel         H: Toggle help',
        '',
        '=== COMBAT ===',
        'Snap shot: Quick, low accuracy, low TU',
        'Aimed shot: Slow, high accuracy, high TU',
        'Auto fire: 3 rounds, reduced accuracy',
        'Kneeling: +15% accuracy bonus'
    ];

    for (let i = 0; i < lines.length; i++) {
        if (!helpTexts[i]) {
            helpTexts[i] = scene.add.text(320, 55 + i * 18, lines[i], {
                font: '12px monospace',
                fill: i === 0 || i === 9 ? '#44ff44' : '#ffffff'
            }).setOrigin(0.5, 0);
        }
        helpTexts[i].setText(lines[i]);
        helpTexts[i].setVisible(true);
    }
}

let titleTexts = [];
function drawTitleScreen() {
    if (!gameState.showTitle) {
        for (let t of titleTexts) t.setVisible(false);
        return;
    }

    // Dark background
    uiGraphics.fillStyle(0x000000);
    uiGraphics.fillRect(0, 0, 640, 480);

    // Animated stars
    for (let i = 0; i < 50; i++) {
        const x = (Date.now() / 20 + i * 47) % 640;
        const y = (i * 31) % 320;
        const brightness = Math.sin(Date.now() / 300 + i) * 0.3 + 0.7;
        uiGraphics.fillStyle(0xffffff, brightness);
        uiGraphics.fillCircle(x, y, 1);
    }

    const titleLines = [
        { text: 'X-COM', y: 140, font: 'bold 48px monospace', fill: '#4488ff' },
        { text: 'ENEMY UNKNOWN', y: 190, font: 'bold 24px monospace', fill: '#ff8844' },
        { text: 'TACTICAL CLONE', y: 220, font: '14px monospace', fill: '#888888' },
        { text: 'Press SPACE to begin mission', y: 300, font: '14px monospace', fill: '#44ff44' },
        { text: 'H for Help', y: 340, font: '12px monospace', fill: '#666666' }
    ];

    for (let i = 0; i < titleLines.length; i++) {
        const line = titleLines[i];
        if (!titleTexts[i]) {
            titleTexts[i] = scene.add.text(320, line.y, line.text, {
                font: line.font,
                fill: line.fill
            }).setOrigin(0.5);
        }
        titleTexts[i].setText(line.text);
        titleTexts[i].setStyle({ font: line.font, fill: line.fill });
        titleTexts[i].setVisible(true);
        // Pulse the start prompt
        if (i === 3) {
            titleTexts[i].setAlpha(Math.sin(Date.now() / 300) * 0.3 + 0.7);
        }
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

            // Draw scorch marks
            const scorch = scorchMarks.find(s => s.x === x && s.y === y);
            if (scorch && tile.visible) {
                uiGraphics.fillStyle(0x111111, scorch.alpha);
                uiGraphics.fillCircle(pos.x, pos.y, 8);
                uiGraphics.fillStyle(0x222211, scorch.alpha * 0.7);
                uiGraphics.fillCircle(pos.x + 3, pos.y + 2, 4);
            }

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

            // Draw lamp posts along road
            if (tile.terrain === TERRAIN.ROAD && tile.visible && (x === 9 || x === 11) && y % 4 === 0) {
                uiGraphics.fillStyle(0x444455);
                uiGraphics.fillRect(pos.x - 2, pos.y - 35, 4, 35);
                uiGraphics.fillRect(pos.x - 8, pos.y - 35, 16, 4);
                uiGraphics.fillStyle(0xffffcc, 0.8);
                uiGraphics.fillCircle(pos.x - 4, pos.y - 30, 4);
            }

            // Draw crates near building
            if (tile.visible && x >= 13 && x <= 14 && y >= 15 && y <= 16 && tile.terrain.walkable) {
                uiGraphics.fillStyle(0x8b4513);
                uiGraphics.fillRect(pos.x - 6, pos.y - 10, 12, 8);
                uiGraphics.fillStyle(0xa0522d);
                uiGraphics.fillRect(pos.x - 5, pos.y - 9, 10, 6);
            }
        }
    }

    // Draw deployment zone during deployment phase
    if (gameState.deploymentPhase) {
        for (let pos of gameState.deploymentPositions) {
            const isoPos = toIso(pos.x, pos.y);
            const isOccupied = map[pos.y][pos.x].unit !== null;
            const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.5;
            uiGraphics.fillStyle(isOccupied ? 0x444444 : 0x00ff00, pulse);
            uiGraphics.beginPath();
            uiGraphics.moveTo(isoPos.x, isoPos.y - TILE_HEIGHT / 2);
            uiGraphics.lineTo(isoPos.x + TILE_WIDTH / 2, isoPos.y);
            uiGraphics.lineTo(isoPos.x, isoPos.y + TILE_HEIGHT / 2);
            uiGraphics.lineTo(isoPos.x - TILE_WIDTH / 2, isoPos.y);
            uiGraphics.closePath();
            uiGraphics.fill();
        }
    }

    // Draw path preview
    if (pathPreview.length > 1) {
        let totalCost = 0;
        for (let i = 1; i < pathPreview.length; i++) {
            totalCost += map[pathPreview[i].y][pathPreview[i].x].terrain.tu;
            const pos = toIso(pathPreview[i].x, pathPreview[i].y);
            const canAfford = totalCost <= gameState.selectedUnit.tu.current;
            uiGraphics.fillStyle(canAfford ? 0x44ff44 : 0xff4444, 0.5);
            uiGraphics.beginPath();
            uiGraphics.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
            uiGraphics.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
            uiGraphics.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
            uiGraphics.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
            uiGraphics.closePath();
            uiGraphics.fill();
        }
        // Show TU cost at end of path with background
        if (pathPreview.length > 0) {
            const endPos = toIso(pathPreview[pathPreview.length - 1].x, pathPreview[pathPreview.length - 1].y);
            const canAfford = totalCost <= gameState.selectedUnit.tu.current;
            const remaining = gameState.selectedUnit.tu.current - totalCost;

            // Draw background box for better visibility
            uiGraphics.fillStyle(0x000000, 0.8);
            uiGraphics.fillRoundedRect(endPos.x - 35, endPos.y - 40, 70, 32, 4);
            uiGraphics.lineStyle(2, canAfford ? 0x44ff44 : 0xff4444);
            uiGraphics.strokeRoundedRect(endPos.x - 35, endPos.y - 40, 70, 32, 4);

            if (!pathCostText) {
                pathCostText = scene.add.text(0, 0, '', { font: 'bold 12px monospace', fill: '#ffffff' }).setOrigin(0.5);
            }
            pathCostText.setPosition(endPos.x, endPos.y - 30);
            pathCostText.setText(`${totalCost} TU\n${canAfford ? remaining + ' left' : 'TOO FAR'}`);
            pathCostText.setStyle({ font: 'bold 12px monospace', fill: canAfford ? '#44ff44' : '#ff4444', align: 'center' });
            pathCostText.setVisible(true);
        }
    } else {
        if (pathCostText) pathCostText.setVisible(false);
    }

    // Draw targeting line and crosshair with hit chance
    if (targetingInfo && gameState.selectedUnit) {
        const fromPos = toIso(gameState.selectedUnit.x, gameState.selectedUnit.y);
        const toPos = toIso(targetingInfo.targetX, targetingInfo.targetY);
        const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
        uiGraphics.lineStyle(2, 0xff0000, pulse);
        uiGraphics.lineBetween(fromPos.x, fromPos.y - 15, toPos.x, toPos.y - 15);
        // Crosshair
        uiGraphics.strokeCircle(toPos.x, toPos.y - 15, 12);
        uiGraphics.lineBetween(toPos.x - 18, toPos.y - 15, toPos.x - 8, toPos.y - 15);
        uiGraphics.lineBetween(toPos.x + 8, toPos.y - 15, toPos.x + 18, toPos.y - 15);
        uiGraphics.lineBetween(toPos.x, toPos.y - 33, toPos.x, toPos.y - 23);
        uiGraphics.lineBetween(toPos.x, toPos.y - 7, toPos.x, toPos.y + 3);
        // Hit chance display
        if (!targetingHitText) {
            targetingHitText = scene.add.text(0, 0, '', { font: 'bold 12px monospace', fill: '#ff0000' }).setOrigin(0.5);
        }
        targetingHitText.setPosition(toPos.x, toPos.y - 40);
        targetingHitText.setText(`${targetingInfo.hitChance}%`);
        targetingHitText.setVisible(true);
    } else {
        if (targetingHitText) targetingHitText.setVisible(false);
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
            if (unit.alienType === 'floater') {
                // Floater - brown mechanical alien
                uiGraphics.fillStyle(0x8b4513);
                uiGraphics.fillRect(pos.x - 5, pos.y - 10, 10, 10);
                // Jet pack
                uiGraphics.fillStyle(0x555555);
                uiGraphics.fillRect(pos.x - 8, pos.y - 6, 4, 8);
                uiGraphics.fillRect(pos.x + 4, pos.y - 6, 4, 8);
                // Flames
                uiGraphics.fillStyle(0xff6600, 0.8);
                uiGraphics.fillTriangle(pos.x - 6, pos.y + 2, pos.x - 8, pos.y + 8, pos.x - 4, pos.y + 8);
                uiGraphics.fillTriangle(pos.x + 6, pos.y + 2, pos.x + 4, pos.y + 8, pos.x + 8, pos.y + 8);
                // Head with mask
                uiGraphics.fillStyle(0x666666);
                uiGraphics.fillEllipse(pos.x, pos.y - 16, 8, 8);
                uiGraphics.fillStyle(0xff0000, 0.7);
                uiGraphics.fillRect(pos.x - 4, pos.y - 18, 8, 3);
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
        }

        // Selection arrow (pulsing)
        if (isSelected) {
            const pulse = Math.sin(Date.now() / 150) * 3;
            uiGraphics.fillStyle(0xffff00, 0.7 + Math.sin(Date.now() / 200) * 0.3);
            uiGraphics.fillTriangle(
                pos.x, pos.y - bodyHeight - 20 + pulse,
                pos.x - 6, pos.y - bodyHeight - 12 + pulse,
                pos.x + 6, pos.y - bodyHeight - 12 + pulse
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

        // Overwatch indicator
        if (unit.type === 'soldier' && unit.overwatch) {
            uiGraphics.lineStyle(2, 0xff0000);
            uiGraphics.strokeCircle(pos.x, pos.y - bodyHeight / 2, 12);
        }

        // Low morale indicator - yellow exclamation
        if (unit.type === 'soldier' && unit.morale < 50) {
            const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
            uiGraphics.fillStyle(0xffff00, pulse);
            // Exclamation mark
            uiGraphics.fillRect(pos.x + 10, pos.y - bodyHeight - 20, 3, 8);
            uiGraphics.fillCircle(pos.x + 11.5, pos.y - bodyHeight - 8, 2);
        }

        // Danger indicator - check if soldier is in alien LOS
        if (unit.type === 'soldier') {
            let inDanger = false;
            for (let alien of aliens) {
                if (!alien.isAlive) continue;
                if (hasLineOfSight(alien.x, alien.y, unit.x, unit.y) && distance(alien.x, alien.y, unit.x, unit.y) <= 12) {
                    inDanger = true;
                    break;
                }
            }
            if (inDanger) {
                const pulse = Math.sin(Date.now() / 150) * 0.4 + 0.4;
                uiGraphics.lineStyle(2, 0xff4400, pulse);
                uiGraphics.strokeCircle(pos.x, pos.y - bodyHeight / 2, 18);
            }
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

        // Ammo Bar
        barY += 18;
        const ammoPct = unit.weapon.currentAmmo / unit.weapon.ammo;
        uiGraphics.fillStyle(0x333333);
        uiGraphics.fillRect(barX, barY, 100, 14);
        const ammoColor = ammoPct > 0.3 ? 0x888844 : (ammoPct > 0 ? 0xaa4444 : 0x440000);
        uiGraphics.fillStyle(ammoColor);
        uiGraphics.fillRect(barX, barY, 100 * ammoPct, 14);
        // Bullet indicators
        const bulletWidth = 100 / unit.weapon.ammo;
        for (let i = 0; i < unit.weapon.currentAmmo; i++) {
            uiGraphics.fillStyle(0xcccc88);
            uiGraphics.fillRect(barX + i * bulletWidth + 1, barY + 2, Math.max(1, bulletWidth - 2), 10);
        }
    }

    // Soldier roster (quick select with number)
    for (let i = 0; i < soldiers.length; i++) {
        const s = soldiers[i];
        const rx = 380 + (i % 3) * 14;
        const ry = GAME_HEIGHT + 10 + Math.floor(i / 3) * 14;
        if (!s.isAlive) {
            uiGraphics.fillStyle(0x440000);
        } else if (s === gameState.selectedUnit) {
            uiGraphics.fillStyle(0x44ff44);
        } else if (s.overwatch) {
            uiGraphics.fillStyle(0xaa4444);
        } else {
            const healthPct = s.health.current / s.health.base;
            uiGraphics.fillStyle(healthPct > 0.5 ? 0x4477aa : 0xaaaa44);
        }
        uiGraphics.fillRect(rx, ry, 12, 12);
        uiGraphics.lineStyle(1, 0x666666);
        uiGraphics.strokeRect(rx, ry, 12, 12);
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
        { key: 'soldiers', x: 425, y: GAME_HEIGHT + 55, text: `Soldiers: ${soldiers.filter(s => s.isAlive).length}/6`,
          style: { font: '12px monospace', fill: '#5588ff' } },
        { key: 'mission_obj', x: 560, y: GAME_HEIGHT + 15, text: 'MISSION',
          style: { font: 'bold 10px monospace', fill: '#888888' } },
        { key: 'mission_prog', x: 560, y: GAME_HEIGHT + 28, text: `Eliminate`,
          style: { font: '9px monospace', fill: '#666666' } },
        { key: 'kill_count', x: 560, y: GAME_HEIGHT + 40, text: `${aliens.length - aliens.filter(a => a.isAlive).length}/${aliens.length}`,
          style: { font: 'bold 14px monospace', fill: '#ff6644' } },
        { key: 'aliens', x: 425, y: GAME_HEIGHT + 72, text: `Known Aliens: ${aliens.filter(a => a.isAlive && a.spotted).length}`,
          style: { font: '12px monospace', fill: '#ff5555' } },
        { key: 'grenades', x: 380, y: GAME_HEIGHT + 42, text: `G:${gameState.selectedUnit ? gameState.selectedUnit.grenades : 0}`,
          style: { font: '10px monospace', fill: '#ff8844' } },
        { key: 'kills', x: 380, y: GAME_HEIGHT + 55, text: `K:${gameState.selectedUnit ? gameState.selectedUnit.kills || 0 : 0}`,
          style: { font: '10px monospace', fill: '#ff4444' } },
        { key: 'rank', x: 380, y: GAME_HEIGHT + 68, text: gameState.selectedUnit ? getSoldierRank(gameState.selectedUnit.kills || 0).name : '',
          style: { font: '9px monospace', fill: '#888888' } },
        { key: 'stance', x: 380, y: GAME_HEIGHT + 80, text: gameState.selectedUnit ? (gameState.selectedUnit.stance === 'kneeling' ? '[KNEEL]' : '') : '',
          style: { font: '9px monospace', fill: '#44ff44' } },
        { key: 'overwatch_ind', x: 380, y: GAME_HEIGHT + 90, text: gameState.selectedUnit && gameState.selectedUnit.overwatch ? '[OVERWT]' : '',
          style: { font: '9px monospace', fill: '#ff4444' } },
        { key: 'cover_status', x: 380, y: GAME_HEIGHT + 100, text: gameState.selectedUnit ? `[${getCoverStatus(gameState.selectedUnit).type}]` : '',
          style: { font: '9px monospace', fill: gameState.selectedUnit ? getCoverStatus(gameState.selectedUnit).color : '#888888' } },
        { key: 'weapon_info', x: 555, y: GAME_HEIGHT + 55, text: gameState.selectedUnit ? gameState.selectedUnit.weapon.name : '',
          style: { font: '11px monospace', fill: '#aaaaff' } },
        { key: 'sec_weapon', x: 555, y: GAME_HEIGHT + 68, text: gameState.selectedUnit && gameState.selectedUnit.secondaryWeapon ? '2nd:' + gameState.selectedUnit.secondaryWeapon.name.substring(0,3) : '',
          style: { font: '9px monospace', fill: '#666666' } },
        { key: 'controls1', x: 12, y: GAME_HEIGHT + 115, text: 'Click: Select/Move | S: Snap | A: Aimed | T: Grenade | E: End Turn',
          style: { font: '10px monospace', fill: '#555555' } },
        { key: 'controls2', x: 12, y: GAME_HEIGHT + 130, text: '1-6: Select | Space: Cycle | R: Reload | W: Switch | O: Overwatch | H: Help',
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

    // Draw debug overlay if enabled
    drawDebugOverlay();

    // Draw minimap
    drawMinimap();
}

function drawDebugOverlay() {
    // Manage debug overlay visibility
    const debugKeys = ['debug_bg', 'debug_1', 'debug_2', 'debug_3', 'debug_4', 'debug_5', 'debug_6', 'debug_7', 'debug_8', 'debug_9'];

    if (!gameState.debugMode) {
        // Hide debug elements if they exist
        for (let key of debugKeys) {
            if (textCache[key]) textCache[key].setVisible(false);
        }
        if (debugGraphics) debugGraphics.clear();
        return;
    }

    // Draw debug background
    if (!debugGraphics) {
        debugGraphics = scene.add.graphics();
    }
    debugGraphics.clear();
    debugGraphics.fillStyle(0x000000, 0.85);
    debugGraphics.fillRect(10, 10, 250, 200);
    debugGraphics.setDepth(1000);

    // Debug text lines
    const debugTexts = [
        { key: 'debug_1', x: 20, y: 25, text: '=== DEBUG (Q to close) ===' },
        { key: 'debug_2', x: 20, y: 45, text: `State: ${gameState.state}` },
        { key: 'debug_3', x: 20, y: 63, text: `Turn: ${gameState.turn} #${gameState.turnNumber}` },
        { key: 'debug_4', x: 20, y: 81, text: `Soldiers: ${soldiers.filter(s => s.isAlive).length}/${soldiers.length}` },
        { key: 'debug_5', x: 20, y: 99, text: `Aliens: ${aliens.filter(a => a.isAlive).length}/${aliens.length}` },
        { key: 'debug_6', x: 20, y: 117, text: `Spotted: ${aliens.filter(a => a.isAlive && a.spotted).length}` }
    ];

    if (gameState.selectedUnit) {
        const u = gameState.selectedUnit;
        debugTexts.push(
            { key: 'debug_7', x: 20, y: 140, text: `--- ${u.name} ---` },
            { key: 'debug_8', x: 20, y: 158, text: `Pos: (${u.x}, ${u.y})` },
            { key: 'debug_9', x: 20, y: 176, text: `TU: ${u.tu.current}/${u.tu.base} HP: ${u.health.current}` }
        );
    }

    const debugStyle = { font: '13px monospace', fill: '#00ff00' };
    for (let t of debugTexts) {
        if (!textCache[t.key]) {
            textCache[t.key] = scene.add.text(t.x, t.y, t.text, debugStyle);
            textCache[t.key].setDepth(1001);
        } else {
            textCache[t.key].setText(t.text);
            textCache[t.key].setVisible(true);
        }
    }
}

let debugGraphics = null;

function drawMinimap() {
    const mmX = 556;
    const mmY = 5;
    const mmW = 80;
    const mmH = 60;
    const cellW = mmW / MAP_WIDTH;
    const cellH = mmH / MAP_HEIGHT;

    // Background
    uiGraphics.fillStyle(0x000000, 0.7);
    uiGraphics.fillRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);
    uiGraphics.lineStyle(1, 0x444488);
    uiGraphics.strokeRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);

    // Terrain
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map[y][x];
            if (!tile.explored) continue;
            let color = 0x222222;
            if (tile.visible) {
                if (tile.terrain === TERRAIN.ROAD) color = 0x333333;
                else if (tile.terrain === TERRAIN.WALL_BRICK) color = 0x886666;
                else if (tile.terrain === TERRAIN.BUSH) color = 0x226622;
                else color = 0x224422;
            }
            uiGraphics.fillStyle(color);
            uiGraphics.fillRect(mmX + x * cellW, mmY + y * cellH, cellW, cellH);
        }
    }

    // Soldiers (blue dots)
    for (let s of soldiers) {
        if (!s.isAlive) continue;
        uiGraphics.fillStyle(0x4488ff);
        uiGraphics.fillCircle(mmX + s.x * cellW + cellW/2, mmY + s.y * cellH + cellH/2, 2);
        // Highlight selected
        if (s === gameState.selectedUnit) {
            uiGraphics.lineStyle(1, 0xffff00);
            uiGraphics.strokeCircle(mmX + s.x * cellW + cellW/2, mmY + s.y * cellH + cellH/2, 3);
        }
    }

    // Spotted aliens (red dots)
    for (let a of aliens) {
        if (!a.isAlive || !a.spotted) continue;
        uiGraphics.fillStyle(0xff4444);
        uiGraphics.fillCircle(mmX + a.x * cellW + cellW/2, mmY + a.y * cellH + cellH/2, 2);
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
    uiGraphics.fillStyle(0x000000, 0.85);
    uiGraphics.fillRect(0, 0, 640, 480);

    // Stats calculation
    const livingSoldiers = soldiers.filter(s => s.isAlive).length;
    const totalKills = soldiers.reduce((sum, s) => sum + (s.kills || 0), 0);
    const aliensKilled = aliens.length - aliens.filter(a => a.isAlive).length;

    const titleKey = 'gameover_title';
    const subtitleKey = 'gameover_subtitle';
    const statsKeys = ['stat1', 'stat2', 'stat3', 'stat4', 'stat5'];

    if (!textCache[titleKey]) {
        textCache[titleKey] = scene.add.text(320, 140, '', {
            font: 'bold 32px monospace'
        }).setOrigin(0.5);
    }
    if (!textCache[subtitleKey]) {
        textCache[subtitleKey] = scene.add.text(320, 320, 'Press R to restart', {
            font: '14px monospace', fill: '#ffffff'
        }).setOrigin(0.5);
    }

    // Stats texts
    const statsData = [
        { text: '=== MISSION STATISTICS ===', color: '#888888' },
        { text: `Turns: ${gameState.turnNumber}`, color: '#aaaaff' },
        { text: `Soldiers Survived: ${livingSoldiers}/6`, color: livingSoldiers > 3 ? '#44ff44' : '#ffff44' },
        { text: `Aliens Eliminated: ${aliensKilled}/${aliens.length}`, color: '#ff8844' },
        { text: `Total Kills: ${totalKills}`, color: '#ff4444' }
    ];

    for (let i = 0; i < statsData.length; i++) {
        const key = statsKeys[i];
        if (!textCache[key]) {
            textCache[key] = scene.add.text(320, 190 + i * 22, statsData[i].text, {
                font: '14px monospace', fill: statsData[i].color
            }).setOrigin(0.5);
        } else {
            textCache[key].setText(statsData[i].text);
            textCache[key].setStyle({ font: '14px monospace', fill: statsData[i].color });
            textCache[key].setPosition(320, 190 + i * 22);
        }
        textCache[key].setVisible(true);
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
