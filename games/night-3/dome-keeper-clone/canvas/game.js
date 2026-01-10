// Dome Keeper Clone - Canvas 2D
// Mining + Tower Defense Roguelike

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1280;
const HEIGHT = 720;

// Constants
const TILE_SIZE = 16;
const MAP_WIDTH = 80; // Wider for 1280px
const MAP_HEIGHT = 50; // Taller for 720px
const SURFACE_Y = 6; // tiles from top where surface is
const DOME_X = MAP_WIDTH / 2;

// Colors
const COLORS = {
    sky: '#3d1f47',
    skyGradient: '#5c3366',
    dirtLight: '#4a3728',
    dirtMedium: '#3a2a1f',
    dirtDark: '#2a1f15',
    rockLight: '#5a5a5a',
    rockDark: '#3a3a3a',
    empty: '#1a0a15',
    iron: '#cd853f',
    ironGlow: '#daa06d',
    water: '#4a90d9',
    waterGlow: '#7ab8f5',
    cobalt: '#8b5cf6',
    cobaltGlow: '#a78bfa',
    dome: '#4a5568',
    domeGlass: '#87ceeb',
    laser: '#ffdd44',
    laserGlow: '#ffffff',
    keeper: '#d4a574',
    enemyWalker: '#2d3748',
    enemyGlow: '#fc8181'
};

// Game state
let gameState = 'title'; // title, mining, defense, upgrade, gameover, victory
let wave = 0;
let phaseTimer = 60;
let score = 0;

// Resources
const resources = { iron: 0, water: 0, cobalt: 0 };

// Tile types
const TILE = {
    EMPTY: 0, DIRT_SOFT: 1, DIRT_MEDIUM: 2, ROCK_HARD: 3,
    IRON: 10, WATER: 11, COBALT: 12
};

// Map
let map = [];

// Dome
const dome = {
    x: WIDTH / 2,
    y: (SURFACE_Y - 1) * TILE_SIZE,
    hp: 800, maxHp: 800,
    shield: 40, maxShield: 40,
    laserAngle: -Math.PI / 2,
    laserDamage: 15,
    laserSpeed: 2,
    isFiring: false
};

// Keeper
const keeper = {
    x: WIDTH / 2,
    y: SURFACE_Y * TILE_SIZE + 20,
    vx: 0, vy: 0,
    speed: 56,
    drillStrength: 2,
    carryCapacity: 3,
    cargo: [],
    drilling: false,
    drillTarget: null,
    drillProgress: 0,
    inDome: false
};

// Enemies
let enemies = [];

// Camera for underground view
let cameraY = 0;

// Visual effects
let floatingTexts = [];
let particles = [];
let screenShake = 0;

// Combo system
let miningCombo = 0;
let comboTimer = 0;
const COMBO_DURATION = 2.0;
const MAX_COMBO_MULTIPLIER = 3.0;

// Achievements
const achievements = {
    firstIron: false,
    firstCobalt: false,
    wave5: false,
    wave10: false,
    noDamageWave: false,
    megaCombo: false
};
let waveDamageTaken = 0;

// Input
const keys = {};
let mouseX = WIDTH / 2;
let mouseY = HEIGHT / 2;
let mouseDown = false;

// Tile health
const TILE_HP = {
    [TILE.DIRT_SOFT]: 4,
    [TILE.DIRT_MEDIUM]: 8,
    [TILE.ROCK_HARD]: 16,
    [TILE.IRON]: 12,
    [TILE.WATER]: 10,
    [TILE.COBALT]: 14
};

// Helper: spawn floating text
function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({
        x, y, text, color,
        life: 1.5, maxLife: 1.5,
        vy: -40
    });
}

// Helper: spawn particles
function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100 - 30,
            color,
            life: 0.5 + Math.random() * 0.5
        });
    }
}

// Get combo multiplier
function getComboMultiplier() {
    if (miningCombo <= 0) return 1;
    return Math.min(1 + miningCombo * 0.2, MAX_COMBO_MULTIPLIER);
}

// Generate map
function generateMap() {
    map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (y < SURFACE_Y) {
                row.push(TILE.EMPTY);
            } else if (y === SURFACE_Y && x >= DOME_X - 2 && x <= DOME_X + 1) {
                row.push(TILE.EMPTY); // Space under dome
            } else {
                // Underground
                const depth = y - SURFACE_Y;
                const roll = Math.random();

                // Resource chance increases with depth
                if (depth > 2 && roll < 0.12) {
                    const resourceRoll = Math.random();
                    if (resourceRoll < 0.5) row.push(TILE.IRON);
                    else if (resourceRoll < 0.8 && depth > 5) row.push(TILE.WATER);
                    else if (depth > 10) row.push(TILE.COBALT);
                    else row.push(TILE.IRON);
                } else if (roll < 0.25 && depth > 5) {
                    row.push(TILE.ROCK_HARD);
                } else if (roll < 0.5) {
                    row.push(TILE.DIRT_MEDIUM);
                } else {
                    row.push(TILE.DIRT_SOFT);
                }
            }
        }
        map.push(row);
    }

    // Clear starting shaft under dome
    for (let y = SURFACE_Y; y < SURFACE_Y + 3; y++) {
        for (let x = DOME_X - 1; x <= DOME_X; x++) {
            if (x >= 0 && x < MAP_WIDTH) map[y][x] = TILE.EMPTY;
        }
    }
}

// Get tile at world position
function getTileAt(worldX, worldY) {
    const tx = Math.floor(worldX / TILE_SIZE);
    const ty = Math.floor(worldY / TILE_SIZE);
    if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return TILE.ROCK_HARD;
    return map[ty][tx];
}

function setTileAt(worldX, worldY, tile) {
    const tx = Math.floor(worldX / TILE_SIZE);
    const ty = Math.floor(worldY / TILE_SIZE);
    if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
        map[ty][tx] = tile;
    }
}

// Spawn enemies for wave
function spawnWave() {
    const baseWeight = 20 + wave * 15;
    let remaining = baseWeight;

    while (remaining > 0) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = dome.x + side * (300 + Math.random() * 200);
        const y = dome.y - 20 + Math.random() * 40;

        if (wave >= 3 && Math.random() < 0.3 && remaining >= 80) {
            // Hornet (strong)
            enemies.push({
                x, y, hp: 100, maxHp: 100, damage: 45, speed: 65,
                type: 'hornet', attackTimer: 0, attackRate: 1.5
            });
            remaining -= 80;
        } else if (wave >= 2 && Math.random() < 0.3 && remaining >= 25) {
            // Flyer (ranged)
            enemies.push({
                x, y: y - 100, hp: 20, maxHp: 20, damage: 15, speed: 120,
                type: 'flyer', attackTimer: 0, attackRate: 0.9, projectiles: []
            });
            remaining -= 25;
        } else {
            // Walker (basic)
            enemies.push({
                x, y, hp: 40, maxHp: 40, damage: 12, speed: 90,
                type: 'walker', attackTimer: 0, attackRate: 0.77
            });
            remaining -= 20;
        }
    }
}

// Update keeper
function updateKeeper(dt) {
    if (keeper.drilling) {
        keeper.drillProgress += keeper.drillStrength * dt;
        const tile = getTileAt(keeper.drillTarget.x, keeper.drillTarget.y);
        const hp = TILE_HP[tile] || 4;

        if (keeper.drillProgress >= hp) {
            // Tile destroyed - spawn particles
            const tx = keeper.drillTarget.x;
            const ty = keeper.drillTarget.y;
            spawnParticles(tx, ty - cameraY, 8, COLORS.dirtMedium);

            // Mining combo
            miningCombo++;
            comboTimer = COMBO_DURATION;
            const multiplier = getComboMultiplier();

            if (tile === TILE.IRON) {
                const amount = 1 + Math.floor(Math.random() * 3);
                for (let i = 0; i < amount && keeper.cargo.length < keeper.carryCapacity; i++) {
                    keeper.cargo.push('iron');
                }
                spawnParticles(tx, ty - cameraY, 5, COLORS.iron);
                spawnFloatingText(tx, ty - cameraY, '+Iron', COLORS.iron);
                if (!achievements.firstIron) {
                    achievements.firstIron = true;
                    spawnFloatingText(tx, ty - cameraY - 20, 'First Iron!', '#ffd700');
                    score += 100;
                }
            } else if (tile === TILE.WATER) {
                const amount = 1 + Math.floor(Math.random() * 2);
                for (let i = 0; i < amount && keeper.cargo.length < keeper.carryCapacity; i++) {
                    keeper.cargo.push('water');
                }
                spawnParticles(tx, ty - cameraY, 5, COLORS.water);
                spawnFloatingText(tx, ty - cameraY, '+Water', COLORS.water);
            } else if (tile === TILE.COBALT) {
                const amount = 1 + Math.floor(Math.random() * 2);
                for (let i = 0; i < amount && keeper.cargo.length < keeper.carryCapacity; i++) {
                    keeper.cargo.push('cobalt');
                }
                spawnParticles(tx, ty - cameraY, 5, COLORS.cobalt);
                spawnFloatingText(tx, ty - cameraY, '+Cobalt', COLORS.cobalt);
                if (!achievements.firstCobalt) {
                    achievements.firstCobalt = true;
                    spawnFloatingText(tx, ty - cameraY - 20, 'First Cobalt!', '#ffd700');
                    score += 500;
                }
            }

            // Mega combo achievement
            if (miningCombo >= 10 && !achievements.megaCombo) {
                achievements.megaCombo = true;
                spawnFloatingText(tx, ty - cameraY - 40, 'MEGA COMBO!', '#ffd700');
                score += 1000;
            }

            setTileAt(keeper.drillTarget.x, keeper.drillTarget.y, TILE.EMPTY);
            keeper.drilling = false;
            keeper.drillTarget = null;
            keeper.drillProgress = 0;
        }
        return;
    }

    // Movement
    let moveX = 0, moveY = 0;
    if (keys['a'] || keys['arrowleft']) moveX = -1;
    if (keys['d'] || keys['arrowright']) moveX = 1;
    if (keys['w'] || keys['arrowup']) moveY = -1;
    if (keys['s'] || keys['arrowdown']) moveY = 1;

    // Slow down based on cargo
    const speedMod = 1 - (keeper.cargo.length * 0.1);
    const speed = keeper.speed * speedMod;

    if (moveX !== 0 || moveY !== 0) {
        const len = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= len;
        moveY /= len;

        const newX = keeper.x + moveX * speed * dt;
        const newY = keeper.y + moveY * speed * dt;

        // Check collisions
        const halfW = 6, halfH = 8;
        let canMoveX = true, canMoveY = true;

        // Horizontal
        const checkX = moveX > 0 ? newX + halfW : newX - halfW;
        if (getTileAt(checkX, keeper.y - halfH) !== TILE.EMPTY ||
            getTileAt(checkX, keeper.y + halfH) !== TILE.EMPTY) {
            canMoveX = false;
        }

        // Vertical
        const checkY = moveY > 0 ? newY + halfH : newY - halfH;
        if (getTileAt(keeper.x - halfW, checkY) !== TILE.EMPTY ||
            getTileAt(keeper.x + halfW, checkY) !== TILE.EMPTY) {
            canMoveY = false;
        }

        if (canMoveX) keeper.x = newX;
        if (canMoveY) keeper.y = newY;

        // Start drilling if pressing into a tile
        if (!canMoveX || !canMoveY) {
            const drillX = keeper.x + moveX * TILE_SIZE;
            const drillY = keeper.y + moveY * TILE_SIZE;
            const tile = getTileAt(drillX, drillY);
            if (tile !== TILE.EMPTY) {
                keeper.drilling = true;
                keeper.drillTarget = { x: drillX, y: drillY };
                keeper.drillProgress = 0;
            }
        }
    }

    // Bounds
    keeper.x = Math.max(TILE_SIZE, Math.min(MAP_WIDTH * TILE_SIZE - TILE_SIZE, keeper.x));
    keeper.y = Math.max(TILE_SIZE, Math.min(MAP_HEIGHT * TILE_SIZE - TILE_SIZE, keeper.y));

    // Check if in dome (drop off resources)
    keeper.inDome = Math.abs(keeper.x - dome.x) < 30 && Math.abs(keeper.y - dome.y) < 30;
    if (keeper.inDome && keeper.cargo.length > 0) {
        // Deposit resources
        for (const r of keeper.cargo) {
            resources[r]++;
            score += r === 'cobalt' ? 30 : (r === 'water' ? 20 : 10);
        }
        keeper.cargo = [];
    }
}

// Update laser
function updateLaser(dt) {
    // Rotate towards mouse
    const targetAngle = Math.atan2(mouseY - dome.y, mouseX - dome.x);

    // Clamp to upper hemisphere
    let clampedTarget = targetAngle;
    if (clampedTarget > 0) clampedTarget = Math.max(0, Math.min(Math.PI, clampedTarget));
    else clampedTarget = Math.max(-Math.PI, Math.min(0, clampedTarget));

    // Only upper half
    if (clampedTarget > 0) clampedTarget = -0.01;
    if (clampedTarget < -Math.PI) clampedTarget = -Math.PI + 0.01;

    // Rotate
    let angleDiff = clampedTarget - dome.laserAngle;
    const rotSpeed = mouseDown ? dome.laserSpeed * 0.6 : dome.laserSpeed;
    dome.laserAngle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), rotSpeed * dt);

    // Fire laser
    dome.isFiring = mouseDown;
    if (dome.isFiring) {
        // Check enemy hits
        const laserStart = { x: dome.x, y: dome.y - 30 };
        const laserDir = { x: Math.cos(dome.laserAngle), y: Math.sin(dome.laserAngle) };

        for (const enemy of enemies) {
            // Line-circle intersection
            const dx = enemy.x - laserStart.x;
            const dy = enemy.y - laserStart.y;
            const proj = dx * laserDir.x + dy * laserDir.y;

            if (proj > 0) {
                const closestX = laserStart.x + laserDir.x * proj;
                const closestY = laserStart.y + laserDir.y * proj;
                const dist = Math.sqrt((closestX - enemy.x) ** 2 + (closestY - enemy.y) ** 2);

                if (dist < 20) {
                    enemy.hp -= dome.laserDamage * dt;
                }
            }
        }
    }
}

// Update enemies
function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        // Move towards dome
        const dx = dome.x - e.x;
        const dy = dome.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 40) {
            e.x += (dx / dist) * e.speed * dt;
            e.y += (dy / dist) * e.speed * dt;
        } else {
            // Attack dome
            e.attackTimer += dt;
            if (e.attackTimer >= 1 / e.attackRate) {
                e.attackTimer = 0;

                // Damage shield first
                let damage = e.damage;
                if (dome.shield > 0) {
                    const absorbed = Math.min(dome.shield, damage);
                    dome.shield -= absorbed;
                    damage -= absorbed;
                }
                dome.hp -= damage;
                waveDamageTaken += e.damage;
                screenShake = Math.min(screenShake + 5, 15);
                spawnFloatingText(dome.x, dome.y - 50, '-' + e.damage, '#ff4444');
            }
        }

        // Flyer projectiles
        if (e.type === 'flyer' && dist < 300 && dist > 50) {
            e.attackTimer += dt;
            if (e.attackTimer >= 1 / e.attackRate) {
                e.attackTimer = 0;
                // Fire projectile
                e.projectiles = e.projectiles || [];
                const angle = Math.atan2(dy, dx);
                e.projectiles.push({
                    x: e.x, y: e.y,
                    vx: Math.cos(angle) * 200,
                    vy: Math.sin(angle) * 200
                });
            }
        }

        // Update projectiles
        if (e.projectiles) {
            for (let j = e.projectiles.length - 1; j >= 0; j--) {
                const p = e.projectiles[j];
                p.x += p.vx * dt;
                p.y += p.vy * dt;

                // Hit dome
                if (Math.abs(p.x - dome.x) < 40 && Math.abs(p.y - dome.y) < 40) {
                    let damage = e.damage;
                    if (dome.shield > 0) {
                        const absorbed = Math.min(dome.shield, damage);
                        dome.shield -= absorbed;
                        damage -= absorbed;
                    }
                    dome.hp -= damage;
                    e.projectiles.splice(j, 1);
                }
            }
        }

        // Dead
        if (e.hp <= 0) {
            const pts = e.type === 'hornet' ? 100 : (e.type === 'flyer' ? 50 : 25);
            score += pts;
            spawnParticles(e.x, e.y - cameraY, 12, COLORS.enemyGlow);
            spawnFloatingText(e.x, e.y - cameraY, '+' + pts, '#ffd700');
            enemies.splice(i, 1);
        }
    }
}

// Camera
function updateCamera() {
    const targetY = Math.max(0, keeper.y - HEIGHT * 0.4);
    cameraY = targetY;
}

// Draw sky
function drawSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, SURFACE_Y * TILE_SIZE);
    gradient.addColorStop(0, COLORS.skyGradient);
    gradient.addColorStop(1, COLORS.sky);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, Math.max(0, SURFACE_Y * TILE_SIZE - cameraY));
}

// Draw map
function drawMap() {
    const startY = Math.max(0, Math.floor(cameraY / TILE_SIZE));
    const endY = Math.min(MAP_HEIGHT, startY + Math.ceil(HEIGHT / TILE_SIZE) + 2);
    const startX = 0;
    const endX = MAP_WIDTH;

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = map[y][x];
            const screenX = x * TILE_SIZE;
            const screenY = y * TILE_SIZE - cameraY;

            if (tile === TILE.EMPTY) {
                ctx.fillStyle = y < SURFACE_Y ? 'transparent' : COLORS.empty;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            } else if (tile === TILE.DIRT_SOFT) {
                ctx.fillStyle = COLORS.dirtLight;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                // Texture
                ctx.fillStyle = COLORS.dirtMedium;
                ctx.fillRect(screenX + 2, screenY + 2, 3, 3);
                ctx.fillRect(screenX + 9, screenY + 8, 4, 4);
            } else if (tile === TILE.DIRT_MEDIUM) {
                ctx.fillStyle = COLORS.dirtMedium;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.dirtDark;
                ctx.fillRect(screenX + 3, screenY + 3, 4, 4);
                ctx.fillRect(screenX + 10, screenY + 10, 3, 3);
            } else if (tile === TILE.ROCK_HARD) {
                ctx.fillStyle = COLORS.rockDark;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.rockLight;
                ctx.fillRect(screenX + 2, screenY + 2, 5, 5);
            } else if (tile === TILE.IRON) {
                ctx.fillStyle = COLORS.dirtMedium;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.iron;
                ctx.beginPath();
                ctx.arc(screenX + 8, screenY + 8, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = COLORS.ironGlow;
                ctx.fillRect(screenX + 5, screenY + 5, 3, 3);
            } else if (tile === TILE.WATER) {
                ctx.fillStyle = COLORS.dirtMedium;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.water;
                ctx.beginPath();
                ctx.moveTo(screenX + 8, screenY + 2);
                ctx.lineTo(screenX + 14, screenY + 14);
                ctx.lineTo(screenX + 2, screenY + 14);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = COLORS.waterGlow;
                ctx.fillRect(screenX + 6, screenY + 6, 3, 3);
            } else if (tile === TILE.COBALT) {
                ctx.fillStyle = COLORS.dirtDark;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.cobalt;
                ctx.beginPath();
                ctx.arc(screenX + 8, screenY + 8, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = COLORS.cobaltGlow;
                ctx.fillRect(screenX + 5, screenY + 5, 4, 4);
            }
        }
    }
}

// Draw dome
function drawDome() {
    const screenY = dome.y - cameraY;

    // Base
    ctx.fillStyle = COLORS.dome;
    ctx.fillRect(dome.x - 35, screenY + 10, 70, 25);

    // Glass dome
    ctx.fillStyle = COLORS.domeGlass;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(dome.x, screenY, 35, Math.PI, 0);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Dome outline
    ctx.strokeStyle = COLORS.dome;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(dome.x, screenY, 35, Math.PI, 0);
    ctx.stroke();

    // Turret
    ctx.fillStyle = '#666';
    ctx.save();
    ctx.translate(dome.x, screenY - 30);
    ctx.rotate(dome.laserAngle);
    ctx.fillRect(0, -4, 25, 8);
    ctx.restore();

    // Laser beam
    if (dome.isFiring) {
        const laserLen = 500;
        ctx.strokeStyle = COLORS.laserGlow;
        ctx.lineWidth = 6;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(dome.x, screenY - 30);
        ctx.lineTo(
            dome.x + Math.cos(dome.laserAngle) * laserLen,
            screenY - 30 + Math.sin(dome.laserAngle) * laserLen
        );
        ctx.stroke();

        ctx.strokeStyle = COLORS.laser;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(dome.x, screenY - 30);
        ctx.lineTo(
            dome.x + Math.cos(dome.laserAngle) * laserLen,
            screenY - 30 + Math.sin(dome.laserAngle) * laserLen
        );
        ctx.stroke();
    }

    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(dome.x - 30, screenY + 45, 60, 8);
    ctx.fillStyle = dome.hp < dome.maxHp * 0.25 ? '#ff4444' : '#44ff44';
    ctx.fillRect(dome.x - 30, screenY + 45, 60 * (dome.hp / dome.maxHp), 8);

    // Shield bar
    ctx.fillStyle = '#333';
    ctx.fillRect(dome.x - 30, screenY + 55, 60, 4);
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(dome.x - 30, screenY + 55, 60 * (dome.shield / dome.maxShield), 4);
}

// Draw keeper
function drawKeeper() {
    const screenY = keeper.y - cameraY;

    // Body
    ctx.fillStyle = COLORS.keeper;
    ctx.fillRect(keeper.x - 6, screenY - 8, 12, 16);

    // Head
    ctx.fillStyle = '#e8c9a8';
    ctx.fillRect(keeper.x - 4, screenY - 12, 8, 6);

    // Drill (if drilling)
    if (keeper.drilling) {
        ctx.fillStyle = '#888';
        const dx = keeper.drillTarget.x - keeper.x;
        const dy = keeper.drillTarget.y - keeper.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            ctx.save();
            ctx.translate(keeper.x, screenY);
            ctx.rotate(Math.atan2(dy, dx));
            ctx.fillRect(0, -3, 12, 6);
            // Sparks
            ctx.fillStyle = '#ff8800';
            ctx.fillRect(10 + Math.random() * 5, -4 + Math.random() * 8, 3, 3);
            ctx.restore();
        }
    }

    // Cargo indicator
    for (let i = 0; i < keeper.cargo.length; i++) {
        const c = keeper.cargo[i];
        ctx.fillStyle = c === 'iron' ? COLORS.iron : (c === 'water' ? COLORS.water : COLORS.cobalt);
        ctx.fillRect(keeper.x - 8 + i * 6, screenY + 10, 5, 5);
    }
}

// Draw enemies
function drawEnemies() {
    for (const e of enemies) {
        const screenY = e.y - cameraY;

        if (e.type === 'walker') {
            ctx.fillStyle = COLORS.enemyWalker;
            ctx.fillRect(e.x - 10, screenY - 12, 20, 24);
            ctx.fillStyle = COLORS.enemyGlow;
            ctx.fillRect(e.x - 3, screenY - 8, 6, 4);
        } else if (e.type === 'flyer') {
            ctx.fillStyle = COLORS.enemyWalker;
            ctx.beginPath();
            ctx.moveTo(e.x, screenY - 10);
            ctx.lineTo(e.x + 15, screenY + 5);
            ctx.lineTo(e.x - 15, screenY + 5);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = COLORS.enemyGlow;
            ctx.fillRect(e.x - 3, screenY - 5, 6, 4);

            // Projectiles
            if (e.projectiles) {
                for (const p of e.projectiles) {
                    ctx.fillStyle = '#ff6666';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y - cameraY, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else if (e.type === 'hornet') {
            ctx.fillStyle = '#4a3020';
            ctx.fillRect(e.x - 15, screenY - 15, 30, 30);
            ctx.fillStyle = COLORS.enemyGlow;
            ctx.fillRect(e.x - 5, screenY - 10, 10, 6);
        }

        // Health bar
        if (e.hp < e.maxHp) {
            ctx.fillStyle = '#333';
            ctx.fillRect(e.x - 15, screenY - 20, 30, 4);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(e.x - 15, screenY - 20, 30 * (e.hp / e.maxHp), 4);
        }
    }
}

// Draw HUD
function drawHUD() {
    // Top bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, 45);

    // Phase indicator
    ctx.fillStyle = gameState === 'mining' ? '#44ff44' : '#ff4444';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(gameState === 'mining' ? 'MINING PHASE' : 'DEFENSE PHASE', 20, 25);

    // Timer
    ctx.fillStyle = '#fff';
    ctx.fillText(`Time: ${Math.ceil(phaseTimer)}s`, 180, 25);

    // Wave
    ctx.fillText(`Wave: ${wave}`, 300, 25);

    // Resources
    ctx.fillStyle = COLORS.iron;
    ctx.fillText(`Iron: ${resources.iron}`, 400, 20);
    ctx.fillStyle = COLORS.water;
    ctx.fillText(`Water: ${resources.water}`, 500, 20);
    ctx.fillStyle = COLORS.cobalt;
    ctx.fillText(`Cobalt: ${resources.cobalt}`, 610, 20);

    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`Score: ${score}`, 720, 38);

    // Controls
    ctx.fillStyle = '#888';
    ctx.font = '12px Arial';
    if (gameState === 'mining') {
        ctx.fillText('WASD: Move/Drill | Return to dome before timer ends!', 20, 580);
    } else {
        ctx.fillText('Mouse: Aim | Click: Fire Laser | Defend the dome!', 20, 580);
    }

    // Dome HP
    ctx.fillStyle = '#fff';
    ctx.fillText(`Dome HP: ${Math.ceil(dome.hp)}/${dome.maxHp}`, 20, 38);
}

// Draw title screen
function drawTitle() {
    ctx.fillStyle = '#1a0a20';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, '#5c3366');
    gradient.addColorStop(1, '#3d1f47');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, 300);

    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DOME KEEPER', WIDTH / 2, 180);

    ctx.fillStyle = '#87ceeb';
    ctx.font = '20px Arial';
    ctx.fillText('Mining & Tower Defense', WIDTH / 2, 230);

    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE to Start', WIDTH / 2, 350);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px Arial';
    ctx.fillText('Mine underground for resources during mining phase', WIDTH / 2, 430);
    ctx.fillText('Return to dome and defend against enemy waves', WIDTH / 2, 455);
    ctx.fillText('WASD to move | Mouse to aim | Click to fire', WIDTH / 2, 480);

    ctx.textAlign = 'left';
}

// Draw game over
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DOME DESTROYED', WIDTH / 2, 200);

    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score}`, WIDTH / 2, 280);
    ctx.fillText(`Waves Survived: ${wave}`, WIDTH / 2, 320);

    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE to Restart', WIDTH / 2, 420);
    ctx.textAlign = 'left';
}

// Reset game
function resetGame() {
    generateMap();

    dome.hp = dome.maxHp;
    dome.shield = dome.maxShield;
    dome.laserAngle = -Math.PI / 2;

    keeper.x = dome.x;
    keeper.y = dome.y + 50;
    keeper.cargo = [];
    keeper.drilling = false;

    resources.iron = 0;
    resources.water = 0;
    resources.cobalt = 0;

    enemies = [];
    wave = 0;
    phaseTimer = 60;
    score = 0;
    cameraY = 0;

    // Reset visual effects
    floatingTexts = [];
    particles = [];
    screenShake = 0;
    miningCombo = 0;
    comboTimer = 0;
    waveDamageTaken = 0;

    // Reset achievements
    achievements.firstIron = false;
    achievements.firstCobalt = false;
    achievements.wave5 = false;
    achievements.wave10 = false;
    achievements.noDamageWave = false;
    achievements.megaCombo = false;

    gameState = 'mining';
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    ctx.fillStyle = '#1a0a20';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (gameState === 'title') {
        drawTitle();
    } else if (gameState === 'gameover') {
        drawGameOver();
    } else if (gameState === 'mining' || gameState === 'defense') {
        // Update
        if (gameState === 'mining') {
            updateKeeper(dt);
            updateCamera();
        } else {
            updateLaser(dt);
            updateEnemies(dt);
            cameraY = 0; // Keep camera at surface during defense
        }

        // Update combo timer
        if (comboTimer > 0) {
            comboTimer -= dt;
            if (comboTimer <= 0) {
                miningCombo = 0;
            }
        }

        // Update floating texts
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];
            ft.life -= dt;
            ft.y += ft.vy * dt;
            if (ft.life <= 0) floatingTexts.splice(i, 1);
        }

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 150 * dt; // Gravity
            if (p.life <= 0) particles.splice(i, 1);
        }

        // Update screen shake
        if (screenShake > 0) {
            screenShake -= 30 * dt;
            if (screenShake < 0) screenShake = 0;
        }

        // Phase timer
        phaseTimer -= dt;
        if (phaseTimer <= 0) {
            if (gameState === 'mining') {
                // Start defense phase
                gameState = 'defense';
                wave++;
                waveDamageTaken = 0; // Reset damage tracking
                spawnWave();
                phaseTimer = 999; // Until all enemies dead

                // Return keeper to dome
                keeper.x = dome.x;
                keeper.y = dome.y + 20;

                // Wave achievements
                if (wave >= 5 && !achievements.wave5) {
                    achievements.wave5 = true;
                    spawnFloatingText(dome.x, dome.y - 100, 'Wave 5!', '#ffd700');
                    score += 2000;
                }
                if (wave >= 10 && !achievements.wave10) {
                    achievements.wave10 = true;
                    spawnFloatingText(dome.x, dome.y - 100, 'Wave 10!', '#ffd700');
                    score += 10000;
                }
            }
        }

        // Check wave clear
        if (gameState === 'defense' && enemies.length === 0) {
            // No damage achievement
            if (waveDamageTaken === 0 && !achievements.noDamageWave && wave >= 2) {
                achievements.noDamageWave = true;
                spawnFloatingText(dome.x, dome.y - 80, 'FLAWLESS!', '#ffd700');
                score += 3000;
            }
            // Recharge shield
            dome.shield = dome.maxShield;
            gameState = 'mining';
            phaseTimer = 60 + wave * 5; // More time for later waves
        }

        // Check game over
        if (dome.hp <= 0) {
            gameState = 'gameover';
        }

        // Apply screen shake
        ctx.save();
        if (screenShake > 0) {
            ctx.translate(
                (Math.random() - 0.5) * screenShake,
                (Math.random() - 0.5) * screenShake
            );
        }

        // Draw
        drawSky();
        drawMap();
        drawDome();
        if (gameState === 'mining') drawKeeper();
        if (gameState === 'defense') drawEnemies();

        // Draw particles
        for (const p of particles) {
            const alpha = p.life / 0.5;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        }
        ctx.globalAlpha = 1;

        ctx.restore();

        // Draw floating texts (after shake restore)
        for (const ft of floatingTexts) {
            const alpha = ft.life / ft.maxLife;
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#000';
            ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.globalAlpha = 1;

        // Draw combo display (during mining)
        if (gameState === 'mining' && miningCombo > 0) {
            const mult = getComboMultiplier();
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffa500';
            ctx.fillText('COMBO x' + mult.toFixed(1), WIDTH / 2, 100);
        }

        drawHUD();
    }

    requestAnimationFrame(gameLoop);
}

// Input
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (e.code === 'Space') {
        if (gameState === 'title') {
            resetGame();
        } else if (gameState === 'gameover') {
            resetGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top + cameraY;
});

canvas.addEventListener('mousedown', () => { mouseDown = true; });
canvas.addEventListener('mouseup', () => { mouseDown = false; });

// Expose for testing
window.gameState = {
    get state() { return gameState; },
    get score() { return score; },
    get wave() { return wave; },
    get domeHp() { return dome.hp; },
    get resources() { return resources; },
    get enemies() { return enemies.length; }
};

window.startGame = () => {
    if (gameState === 'title' || gameState === 'gameover') {
        resetGame();
    }
};

// Start
gameState = 'title';
requestAnimationFrame(gameLoop);
