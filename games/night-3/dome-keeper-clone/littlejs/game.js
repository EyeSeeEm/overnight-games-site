// Dome Keeper Clone - LittleJS
// Mining + Tower Defense Roguelike

'use strict';

// Constants
const TILE_SIZE = 1;
const MAP_WIDTH = 80;
const MAP_HEIGHT = 50;
const SURFACE_Y = 6;
const DOME_X = MAP_WIDTH / 2;

// Colors
const COLORS = {
    sky: new Color(0.24, 0.12, 0.28),
    skyGradient: new Color(0.36, 0.2, 0.4),
    dirtLight: new Color(0.29, 0.22, 0.16),
    dirtMedium: new Color(0.23, 0.16, 0.12),
    dirtDark: new Color(0.16, 0.12, 0.08),
    rockLight: new Color(0.35, 0.35, 0.35),
    rockDark: new Color(0.23, 0.23, 0.23),
    empty: new Color(0.1, 0.04, 0.08),
    iron: new Color(0.8, 0.52, 0.25),
    ironGlow: new Color(0.85, 0.63, 0.43),
    water: new Color(0.29, 0.56, 0.85),
    waterGlow: new Color(0.48, 0.72, 0.96),
    cobalt: new Color(0.55, 0.36, 0.96),
    cobaltGlow: new Color(0.65, 0.55, 0.98),
    dome: new Color(0.29, 0.33, 0.41),
    domeGlass: new Color(0.53, 0.81, 0.92),
    laser: new Color(1, 0.87, 0.27),
    laserGlow: new Color(1, 1, 1),
    keeper: new Color(0.83, 0.65, 0.45),
    enemyWalker: new Color(0.18, 0.22, 0.28),
    enemyGlow: new Color(0.99, 0.51, 0.51)
};

// Tile types
const TILE = {
    EMPTY: 0, DIRT_SOFT: 1, DIRT_MEDIUM: 2, ROCK_HARD: 3,
    IRON: 10, WATER: 11, COBALT: 12
};

// Tile health
const TILE_HP = {
    [TILE.DIRT_SOFT]: 4,
    [TILE.DIRT_MEDIUM]: 8,
    [TILE.ROCK_HARD]: 16,
    [TILE.IRON]: 12,
    [TILE.WATER]: 10,
    [TILE.COBALT]: 14
};

// Game state
let gameState = 'title';
let currentWave = 0;
let phaseTimer = 60;
let score = 0;

// Debug overlay
let debugMode = false;

// Resources
const resources = { iron: 0, water: 0, cobalt: 0 };

// Map
let map = [];

// Dome
const dome = {
    x: DOME_X,
    y: SURFACE_Y + 1,
    hp: 800, maxHp: 800,
    shield: 40, maxShield: 40,
    laserAngle: Math.PI / 2, // Pointing up in LittleJS coords
    laserDamage: 15,
    laserSpeed: 2,
    isFiring: false
};

// Keeper
const keeper = {
    x: DOME_X,
    y: SURFACE_Y - 0.5,
    vx: 0, vy: 0,
    speed: 3.5,
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

// Mouse state
let mouseWorldPos = vec2(DOME_X, SURFACE_Y + 10);
let mouseDown = false;

// Visual effects
let floatingTexts = [];
let particles = [];
let screenShakeAmount = 0;

// Combo system
let miningCombo = 0;
let comboTimer = 0;
const COMBO_DURATION = 2.0;
const MAX_COMBO_MULT = 3.0;

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

// Helper functions
function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({
        x, y, text, color,
        life: 1.5, maxLife: 1.5
    });
}

function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: Math.random() * 4 + 2,
            color,
            life: 0.5 + Math.random() * 0.5
        });
    }
}

function getComboMultiplier() {
    if (miningCombo <= 0) return 1;
    return Math.min(1 + miningCombo * 0.2, MAX_COMBO_MULT);
}

// Generate map
function generateMap() {
    map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // LittleJS Y increases upward, so y=0 is at bottom
            // Surface is at SURFACE_Y from top, so in world coords it's at MAP_HEIGHT - SURFACE_Y
            const worldY = MAP_HEIGHT - y - 1;

            if (worldY < SURFACE_Y) {
                row.push(TILE.EMPTY); // Sky
            } else if (worldY === SURFACE_Y && x >= DOME_X - 2 && x <= DOME_X + 1) {
                row.push(TILE.EMPTY); // Under dome
            } else {
                const depth = worldY - SURFACE_Y;
                const roll = Math.random();

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
    for (let depth = 0; depth < 3; depth++) {
        const y = MAP_HEIGHT - SURFACE_Y - depth - 1;
        for (let x = DOME_X - 1; x <= DOME_X; x++) {
            if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                map[y][x] = TILE.EMPTY;
            }
        }
    }
}

// Get tile at world position
function getTileAt(worldX, worldY) {
    const tx = Math.floor(worldX);
    const ty = Math.floor(worldY);
    // Convert to array index (y=0 is bottom of map in world, top in array)
    const ay = MAP_HEIGHT - ty - 1;
    if (tx < 0 || tx >= MAP_WIDTH || ay < 0 || ay >= MAP_HEIGHT) return TILE.ROCK_HARD;
    return map[ay][tx];
}

function setTileAt(worldX, worldY, tile) {
    const tx = Math.floor(worldX);
    const ty = Math.floor(worldY);
    const ay = MAP_HEIGHT - ty - 1;
    if (tx >= 0 && tx < MAP_WIDTH && ay >= 0 && ay < MAP_HEIGHT) {
        map[ay][tx] = tile;
    }
}

// World Y to array Y
function worldToArrayY(worldY) {
    return MAP_HEIGHT - Math.floor(worldY) - 1;
}

// Array Y to world Y
function arrayToWorldY(arrayY) {
    return MAP_HEIGHT - arrayY - 1;
}

// Spawn enemies
function spawnWave() {
    const baseWeight = 20 + currentWave * 15;
    let remaining = baseWeight;

    while (remaining > 0) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = dome.x + side * (18 + Math.random() * 12);
        const y = dome.y + Math.random() * 2;

        if (currentWave >= 3 && Math.random() < 0.3 && remaining >= 80) {
            enemies.push({
                x, y, hp: 100, maxHp: 100, damage: 45, speed: 4,
                type: 'hornet', attackTimer: 0, attackRate: 1.5
            });
            remaining -= 80;
        } else if (currentWave >= 2 && Math.random() < 0.3 && remaining >= 25) {
            enemies.push({
                x, y: y + 5, hp: 20, maxHp: 20, damage: 15, speed: 7,
                type: 'flyer', attackTimer: 0, attackRate: 0.9, projectiles: []
            });
            remaining -= 25;
        } else {
            enemies.push({
                x, y, hp: 40, maxHp: 40, damage: 12, speed: 5,
                type: 'walker', attackTimer: 0, attackRate: 0.77
            });
            remaining -= 20;
        }
    }
}

// LittleJS engine initialization
function gameInit() {
    canvasFixedSize = vec2(1280, 720);
    cameraScale = 16;
    generateMap();
}

// Game update
function gameUpdate() {
    const dt = timeDelta;

    // Toggle debug mode with Q
    if (keyWasPressed('KeyQ')) {
        debugMode = !debugMode;
    }

    if (gameState === 'title') {
        if (keyWasPressed('Space') || mouseWasPressed(0)) {
            resetGame();
        }
        return;
    }

    if (gameState === 'gameover') {
        if (keyWasPressed('Space') || mouseWasPressed(0)) {
            resetGame();
        }
        return;
    }

    // Get mouse position in world coords
    mouseWorldPos = screenToWorld(mousePos);
    mouseDown = mouseIsDown(0);

    if (gameState === 'mining') {
        updateKeeper(dt);
    } else if (gameState === 'defense') {
        updateLaser(dt);
        updateEnemies(dt);
    }

    // Update combo timer
    if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) miningCombo = 0;
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.life -= dt;
        ft.y += 2 * dt; // Rise upward in LittleJS coords
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy -= 10 * dt; // Gravity (downward in LittleJS)
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Update screen shake
    if (screenShakeAmount > 0) {
        screenShakeAmount -= 2 * dt;
        if (screenShakeAmount < 0) screenShakeAmount = 0;
    }

    // Phase timer
    phaseTimer -= dt;
    if (phaseTimer <= 0) {
        if (gameState === 'mining') {
            gameState = 'defense';
            currentWave++;
            waveDamageTaken = 0;
            spawnWave();
            phaseTimer = 999;
            keeper.x = dome.x;
            keeper.y = dome.y - 2;

            // Wave achievements
            if (currentWave >= 5 && !achievements.wave5) {
                achievements.wave5 = true;
                spawnFloatingText(dome.x, dome.y + 5, 'Wave 5!', new Color(1, 0.84, 0));
                score += 2000;
            }
            if (currentWave >= 10 && !achievements.wave10) {
                achievements.wave10 = true;
                spawnFloatingText(dome.x, dome.y + 5, 'Wave 10!', new Color(1, 0.84, 0));
                score += 10000;
            }
        }
    }

    // Check wave clear
    if (gameState === 'defense' && enemies.length === 0) {
        // Flawless achievement
        if (waveDamageTaken === 0 && !achievements.noDamageWave && currentWave >= 2) {
            achievements.noDamageWave = true;
            spawnFloatingText(dome.x, dome.y + 4, 'FLAWLESS!', new Color(1, 0.84, 0));
            score += 3000;
        }
        dome.shield = dome.maxShield;
        gameState = 'mining';
        phaseTimer = 60 + currentWave * 5;
    }

    // Check game over
    if (dome.hp <= 0) {
        gameState = 'gameover';
    }
}

// Update keeper
function updateKeeper(dt) {
    if (keeper.drilling) {
        keeper.drillProgress += keeper.drillStrength * dt;
        const tile = getTileAt(keeper.drillTarget.x, keeper.drillTarget.y);
        const hp = TILE_HP[tile] || 4;

        if (keeper.drillProgress >= hp) {
            const tx = keeper.drillTarget.x;
            const ty = keeper.drillTarget.y;

            // Spawn dirt particles
            spawnParticles(tx, ty, 8, COLORS.dirtMedium);

            // Mining combo
            miningCombo++;
            comboTimer = COMBO_DURATION;

            if (tile === TILE.IRON) {
                const amount = 1 + Math.floor(Math.random() * 3);
                for (let i = 0; i < amount && keeper.cargo.length < keeper.carryCapacity; i++) {
                    keeper.cargo.push('iron');
                }
                spawnParticles(tx, ty, 5, COLORS.iron);
                spawnFloatingText(tx, ty, '+Iron', COLORS.iron);
                if (!achievements.firstIron) {
                    achievements.firstIron = true;
                    spawnFloatingText(tx, ty + 1, 'First Iron!', new Color(1, 0.84, 0));
                    score += 100;
                }
            } else if (tile === TILE.WATER) {
                const amount = 1 + Math.floor(Math.random() * 2);
                for (let i = 0; i < amount && keeper.cargo.length < keeper.carryCapacity; i++) {
                    keeper.cargo.push('water');
                }
                spawnParticles(tx, ty, 5, COLORS.water);
                spawnFloatingText(tx, ty, '+Water', COLORS.water);
            } else if (tile === TILE.COBALT) {
                const amount = 1 + Math.floor(Math.random() * 2);
                for (let i = 0; i < amount && keeper.cargo.length < keeper.carryCapacity; i++) {
                    keeper.cargo.push('cobalt');
                }
                spawnParticles(tx, ty, 5, COLORS.cobalt);
                spawnFloatingText(tx, ty, '+Cobalt', COLORS.cobalt);
                if (!achievements.firstCobalt) {
                    achievements.firstCobalt = true;
                    spawnFloatingText(tx, ty + 1, 'First Cobalt!', new Color(1, 0.84, 0));
                    score += 500;
                }
            }

            // Mega combo achievement
            if (miningCombo >= 10 && !achievements.megaCombo) {
                achievements.megaCombo = true;
                spawnFloatingText(tx, ty + 2, 'MEGA COMBO!', new Color(1, 0.84, 0));
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
    if (keyIsDown('KeyA') || keyIsDown('ArrowLeft')) moveX = -1;
    if (keyIsDown('KeyD') || keyIsDown('ArrowRight')) moveX = 1;
    if (keyIsDown('KeyW') || keyIsDown('ArrowUp')) moveY = 1; // Up in LittleJS
    if (keyIsDown('KeyS') || keyIsDown('ArrowDown')) moveY = -1; // Down in LittleJS

    const speedMod = 1 - (keeper.cargo.length * 0.1);
    const speed = keeper.speed * speedMod;

    if (moveX !== 0 || moveY !== 0) {
        const len = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= len;
        moveY /= len;

        const newX = keeper.x + moveX * speed * dt;
        const newY = keeper.y + moveY * speed * dt;

        const halfW = 0.3, halfH = 0.4;
        let canMoveX = true, canMoveY = true;

        // Horizontal check
        const checkX = moveX > 0 ? newX + halfW : newX - halfW;
        if (getTileAt(checkX, keeper.y - halfH) !== TILE.EMPTY ||
            getTileAt(checkX, keeper.y + halfH) !== TILE.EMPTY) {
            canMoveX = false;
        }

        // Vertical check
        const checkY = moveY > 0 ? newY + halfH : newY - halfH;
        if (getTileAt(keeper.x - halfW, checkY) !== TILE.EMPTY ||
            getTileAt(keeper.x + halfW, checkY) !== TILE.EMPTY) {
            canMoveY = false;
        }

        if (canMoveX) keeper.x = newX;
        if (canMoveY) keeper.y = newY;

        // Start drilling
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
    keeper.x = Math.max(1, Math.min(MAP_WIDTH - 1, keeper.x));
    keeper.y = Math.max(1, Math.min(MAP_HEIGHT - 1, keeper.y));

    // Check if in dome
    keeper.inDome = Math.abs(keeper.x - dome.x) < 2 && Math.abs(keeper.y - dome.y) < 2;
    if (keeper.inDome && keeper.cargo.length > 0) {
        for (const r of keeper.cargo) {
            resources[r]++;
            score += r === 'cobalt' ? 30 : (r === 'water' ? 20 : 10);
        }
        keeper.cargo = [];
    }
}

// Update laser
function updateLaser(dt) {
    const targetAngle = Math.atan2(mouseWorldPos.y - dome.y, mouseWorldPos.x - dome.x);

    // Clamp to upper hemisphere (positive Y in LittleJS)
    let clampedTarget = targetAngle;
    if (clampedTarget < 0) clampedTarget = Math.max(-Math.PI, Math.min(0, clampedTarget));
    if (clampedTarget < 0) clampedTarget = 0.01;
    if (clampedTarget > Math.PI) clampedTarget = Math.PI - 0.01;

    const rotSpeed = mouseDown ? dome.laserSpeed * 0.6 : dome.laserSpeed;
    let angleDiff = clampedTarget - dome.laserAngle;
    dome.laserAngle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), rotSpeed * dt);

    dome.isFiring = mouseDown;
    if (dome.isFiring) {
        const laserStart = { x: dome.x, y: dome.y + 2 };
        const laserDir = { x: Math.cos(dome.laserAngle), y: Math.sin(dome.laserAngle) };

        for (const enemy of enemies) {
            const dx = enemy.x - laserStart.x;
            const dy = enemy.y - laserStart.y;
            const proj = dx * laserDir.x + dy * laserDir.y;

            if (proj > 0) {
                const closestX = laserStart.x + laserDir.x * proj;
                const closestY = laserStart.y + laserDir.y * proj;
                const dist = Math.sqrt((closestX - enemy.x) ** 2 + (closestY - enemy.y) ** 2);

                if (dist < 1.2) {
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

        const dx = dome.x - e.x;
        const dy = dome.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 2.5) {
            e.x += (dx / dist) * e.speed * dt;
            e.y += (dy / dist) * e.speed * dt;
        } else {
            e.attackTimer += dt;
            if (e.attackTimer >= 1 / e.attackRate) {
                e.attackTimer = 0;

                let damage = e.damage;
                if (dome.shield > 0) {
                    const absorbed = Math.min(dome.shield, damage);
                    dome.shield -= absorbed;
                    damage -= absorbed;
                }
                dome.hp -= damage;
                waveDamageTaken += e.damage;
                screenShakeAmount = Math.min(screenShakeAmount + 0.3, 1);
                spawnFloatingText(dome.x, dome.y + 3, '-' + e.damage, new Color(1, 0.3, 0.3));
            }
        }

        // Flyer projectiles
        if (e.type === 'flyer' && dist < 18 && dist > 3) {
            e.attackTimer += dt;
            if (e.attackTimer >= 1 / e.attackRate) {
                e.attackTimer = 0;
                e.projectiles = e.projectiles || [];
                const angle = Math.atan2(dy, dx);
                e.projectiles.push({
                    x: e.x, y: e.y,
                    vx: Math.cos(angle) * 12,
                    vy: Math.sin(angle) * 12
                });
            }
        }

        if (e.projectiles) {
            for (let j = e.projectiles.length - 1; j >= 0; j--) {
                const p = e.projectiles[j];
                p.x += p.vx * dt;
                p.y += p.vy * dt;

                if (Math.abs(p.x - dome.x) < 2.5 && Math.abs(p.y - dome.y) < 2.5) {
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

        if (e.hp <= 0) {
            const pts = e.type === 'hornet' ? 100 : (e.type === 'flyer' ? 50 : 25);
            score += pts;
            spawnParticles(e.x, e.y, 12, COLORS.enemyGlow);
            spawnFloatingText(e.x, e.y, '+' + pts, new Color(1, 0.84, 0));
            enemies.splice(i, 1);
        }
    }
}

// Reset game
function resetGame() {
    generateMap();

    dome.hp = dome.maxHp;
    dome.shield = dome.maxShield;
    dome.laserAngle = Math.PI / 2;

    keeper.x = dome.x;
    keeper.y = dome.y - 3;
    keeper.cargo = [];
    keeper.drilling = false;

    resources.iron = 0;
    resources.water = 0;
    resources.cobalt = 0;

    enemies = [];
    currentWave = 0;
    phaseTimer = 60;
    score = 0;

    // Clear visual effects
    floatingTexts = [];
    particles = [];
    screenShakeAmount = 0;

    // Clear combo
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

// Post update - camera
function gameUpdatePost() {
    if (gameState === 'mining') {
        cameraPos = vec2(MAP_WIDTH / 2, keeper.y);
    } else {
        cameraPos = vec2(MAP_WIDTH / 2, dome.y);
    }
}

// Render
function gameRender() {
    // Draw sky gradient
    const skyBottom = arrayToWorldY(SURFACE_Y);
    const gradient = mainContext.createLinearGradient(0, 0, 0, mainCanvasSize.y * 0.4);
    gradient.addColorStop(0, '#5c3366');
    gradient.addColorStop(1, '#3d1f47');
    mainContext.fillStyle = gradient;
    mainContext.fillRect(0, 0, mainCanvasSize.x, mainCanvasSize.y * 0.6);
}

// Render Post - UI and game objects
function gameRenderPost() {
    if (gameState === 'title') {
        drawTitle();
        return;
    }

    if (gameState === 'gameover') {
        drawGameOver();
        return;
    }

    // Apply screen shake
    if (screenShakeAmount > 0) {
        mainContext.save();
        const shakeX = (Math.random() - 0.5) * screenShakeAmount * 10;
        const shakeY = (Math.random() - 0.5) * screenShakeAmount * 10;
        mainContext.translate(shakeX, shakeY);
    }

    // Draw map
    drawMap();

    // Draw dome
    drawDome();

    // Draw keeper (mining phase only)
    if (gameState === 'mining') {
        drawKeeper();
    }

    // Draw enemies (defense phase only)
    if (gameState === 'defense') {
        drawEnemies();
    }

    // Draw particles
    drawParticles();

    // Restore screen shake before UI
    if (screenShakeAmount > 0) {
        mainContext.restore();
    }

    // Draw floating texts (after shake restore)
    drawFloatingTexts();

    // Draw HUD
    drawHUD();

    // Debug overlay
    if (debugMode) {
        mainContext.fillStyle = 'rgba(0, 0, 0, 0.85)';
        mainContext.fillRect(10, 60, 280, 320);

        mainContext.fillStyle = '#0f0';
        mainContext.font = '14px monospace';
        let y = 80;
        const line = (text) => { mainContext.fillText(text, 20, y); y += 18; };

        line('=== DEBUG (Q to close) ===');
        line(`Keeper Pos: (${keeper.x.toFixed(1)}, ${keeper.y.toFixed(1)})`);
        line(`Keeper Vel: (${(keeper.vx || 0).toFixed(1)}, ${(keeper.vy || 0).toFixed(1)})`);
        line(`Dome HP: ${Math.ceil(dome.hp)}/${dome.maxHp}`);
        line(`Dome Shield: ${Math.ceil(dome.shield)}/${dome.maxShield}`);
        line(`Resources: I:${resources.iron} W:${resources.water} C:${resources.cobalt}`);
        line(`Keeper Cargo: ${keeper.cargo?.length || 0}/${keeper.carryCapacity}`);
        line(`Mining Combo: ${miningCombo}x`);
        line(`Wave: ${currentWave}`);
        line(`Phase: ${gameState}`);
        line(`Timer: ${phaseTimer.toFixed(1)}s`);
        line(`Score: ${score}`);
        line(`Enemies: ${enemies.length}`);
        line(`Drilling: ${keeper.drilling}`);
        line(`Camera Y: ${cameraPos.y.toFixed(1)}`);
        line(`Particles: ${particles.length}`);
    }
}

// Draw map
function drawMap() {
    // Calculate visible area
    const viewHeight = mainCanvasSize.y / cameraScale;
    const viewWidth = mainCanvasSize.x / cameraScale;
    const startY = Math.max(0, Math.floor(cameraPos.y - viewHeight / 2) - 1);
    const endY = Math.min(MAP_HEIGHT, Math.ceil(cameraPos.y + viewHeight / 2) + 1);
    const startX = Math.max(0, Math.floor(cameraPos.x - viewWidth / 2) - 1);
    const endX = Math.min(MAP_WIDTH, Math.ceil(cameraPos.x + viewWidth / 2) + 1);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const ay = MAP_HEIGHT - y - 1;
            if (ay < 0 || ay >= MAP_HEIGHT) continue;

            const tile = map[ay][x];
            const pos = vec2(x + 0.5, y + 0.5);
            const size = vec2(1, 1);

            if (tile === TILE.EMPTY) {
                if (y > arrayToWorldY(SURFACE_Y)) {
                    drawRect(pos, size, COLORS.empty);
                }
            } else if (tile === TILE.DIRT_SOFT) {
                drawRect(pos, size, COLORS.dirtLight);
                drawRect(pos.add(vec2(-0.2, -0.2)), vec2(0.2, 0.2), COLORS.dirtMedium);
            } else if (tile === TILE.DIRT_MEDIUM) {
                drawRect(pos, size, COLORS.dirtMedium);
                drawRect(pos.add(vec2(0.1, 0.1)), vec2(0.25, 0.25), COLORS.dirtDark);
            } else if (tile === TILE.ROCK_HARD) {
                drawRect(pos, size, COLORS.rockDark);
                drawRect(pos.add(vec2(-0.2, 0.2)), vec2(0.3, 0.3), COLORS.rockLight);
            } else if (tile === TILE.IRON) {
                drawRect(pos, size, COLORS.dirtMedium);
                drawRect(pos, vec2(0.6, 0.6), COLORS.iron);
                drawRect(pos.add(vec2(-0.1, 0.1)), vec2(0.2, 0.2), COLORS.ironGlow);
            } else if (tile === TILE.WATER) {
                drawRect(pos, size, COLORS.dirtMedium);
                drawRect(pos, vec2(0.5, 0.5), COLORS.water);
                drawRect(pos.add(vec2(-0.1, 0.1)), vec2(0.2, 0.2), COLORS.waterGlow);
            } else if (tile === TILE.COBALT) {
                drawRect(pos, size, COLORS.dirtDark);
                drawRect(pos, vec2(0.7, 0.7), COLORS.cobalt);
                drawRect(pos.add(vec2(-0.1, 0.1)), vec2(0.25, 0.25), COLORS.cobaltGlow);
            }
        }
    }
}

// Draw dome
function drawDome() {
    const pos = vec2(dome.x, dome.y);

    // Base
    drawRect(pos.add(vec2(0, -0.5)), vec2(4.5, 1.5), COLORS.dome);

    // Glass dome
    drawRect(pos.add(vec2(0, 1)), vec2(4, 2.5), COLORS.domeGlass.scale(1, 0.4));

    // Dome outline
    drawRect(pos.add(vec2(-2, 0.5)), vec2(0.2, 2), COLORS.dome);
    drawRect(pos.add(vec2(2, 0.5)), vec2(0.2, 2), COLORS.dome);
    drawRect(pos.add(vec2(0, 2)), vec2(4, 0.2), COLORS.dome);

    // Turret
    const turretPos = pos.add(vec2(0, 1.8));
    const turretLen = 1.5;
    const turretEnd = turretPos.add(vec2(
        Math.cos(dome.laserAngle) * turretLen,
        Math.sin(dome.laserAngle) * turretLen
    ));
    drawLine(turretPos, turretEnd, 0.3, new Color(0.4, 0.4, 0.4));

    // Laser beam
    if (dome.isFiring) {
        const laserLen = 30;
        const laserEnd = turretPos.add(vec2(
            Math.cos(dome.laserAngle) * laserLen,
            Math.sin(dome.laserAngle) * laserLen
        ));
        drawLine(turretPos, laserEnd, 0.15, COLORS.laserGlow.scale(1, 0.5));
        drawLine(turretPos, laserEnd, 0.08, COLORS.laser);
    }

    // Health bar
    const hpBarPos = pos.add(vec2(0, -2.5));
    drawRect(hpBarPos, vec2(4, 0.3), new Color(0.2, 0.2, 0.2));
    const hpWidth = 4 * (dome.hp / dome.maxHp);
    const hpColor = dome.hp < dome.maxHp * 0.25 ? new Color(1, 0.3, 0.3) : new Color(0.3, 1, 0.3);
    drawRect(hpBarPos.add(vec2((hpWidth - 4) / 2, 0)), vec2(hpWidth, 0.3), hpColor);

    // Shield bar
    const shieldBarPos = pos.add(vec2(0, -3));
    drawRect(shieldBarPos, vec2(4, 0.15), new Color(0.2, 0.2, 0.2));
    const shieldWidth = 4 * (dome.shield / dome.maxShield);
    drawRect(shieldBarPos.add(vec2((shieldWidth - 4) / 2, 0)), vec2(shieldWidth, 0.15), new Color(0.3, 0.5, 1));
}

// Draw keeper
function drawKeeper() {
    const pos = vec2(keeper.x, keeper.y);

    // Body
    drawRect(pos, vec2(0.75, 1), COLORS.keeper);

    // Head
    drawRect(pos.add(vec2(0, 0.6)), vec2(0.5, 0.4), new Color(0.91, 0.79, 0.66));

    // Drill
    if (keeper.drilling && keeper.drillTarget) {
        const drillDir = vec2(keeper.drillTarget.x - keeper.x, keeper.drillTarget.y - keeper.y).normalize();
        const drillEnd = pos.add(drillDir.scale(0.8));
        drawLine(pos, drillEnd, 0.2, new Color(0.5, 0.5, 0.5));

        // Sparks
        const sparkPos = drillEnd.add(vec2((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3));
        drawRect(sparkPos, vec2(0.15, 0.15), new Color(1, 0.5, 0));
    }

    // Cargo indicator
    for (let i = 0; i < keeper.cargo.length; i++) {
        const c = keeper.cargo[i];
        const cargoColor = c === 'iron' ? COLORS.iron : (c === 'water' ? COLORS.water : COLORS.cobalt);
        drawRect(pos.add(vec2(-0.4 + i * 0.35, -0.7)), vec2(0.3, 0.3), cargoColor);
    }
}

// Draw enemies
function drawEnemies() {
    for (const e of enemies) {
        const pos = vec2(e.x, e.y);

        if (e.type === 'walker') {
            drawRect(pos, vec2(1.2, 1.5), COLORS.enemyWalker);
            drawRect(pos.add(vec2(0, 0.3)), vec2(0.4, 0.25), COLORS.enemyGlow);
        } else if (e.type === 'flyer') {
            drawRect(pos, vec2(1.2, 0.8), COLORS.enemyWalker);
            drawRect(pos.add(vec2(-0.6, 0)), vec2(0.4, 0.4), COLORS.enemyWalker);
            drawRect(pos.add(vec2(0.6, 0)), vec2(0.4, 0.4), COLORS.enemyWalker);
            drawRect(pos.add(vec2(0, 0.15)), vec2(0.4, 0.2), COLORS.enemyGlow);

            // Projectiles
            if (e.projectiles) {
                for (const p of e.projectiles) {
                    drawRect(vec2(p.x, p.y), vec2(0.3, 0.3), new Color(1, 0.4, 0.4));
                }
            }
        } else if (e.type === 'hornet') {
            drawRect(pos, vec2(1.8, 1.8), new Color(0.29, 0.19, 0.13));
            drawRect(pos.add(vec2(0, 0.4)), vec2(0.6, 0.35), COLORS.enemyGlow);
        }

        // Health bar
        if (e.hp < e.maxHp) {
            const hpBarPos = pos.add(vec2(0, 1.2));
            drawRect(hpBarPos, vec2(1.8, 0.2), new Color(0.2, 0.2, 0.2));
            const hpWidth = 1.8 * (e.hp / e.maxHp);
            drawRect(hpBarPos.add(vec2((hpWidth - 1.8) / 2, 0)), vec2(hpWidth, 0.2), new Color(1, 0.3, 0.3));
        }
    }
}

// Draw HUD
function drawHUD() {
    // Top bar background
    mainContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
    mainContext.fillRect(0, 0, mainCanvasSize.x, 45);

    mainContext.font = 'bold 16px Arial';

    // Phase indicator
    mainContext.fillStyle = gameState === 'mining' ? '#44ff44' : '#ff4444';
    mainContext.fillText(gameState === 'mining' ? 'MINING PHASE' : 'DEFENSE PHASE', 20, 25);

    // Timer
    mainContext.fillStyle = '#fff';
    mainContext.fillText(`Time: ${Math.ceil(phaseTimer)}s`, 180, 25);

    // Wave
    mainContext.fillText(`Wave: ${currentWave}`, 300, 25);

    // Resources
    mainContext.fillStyle = '#cd853f';
    mainContext.fillText(`Iron: ${resources.iron}`, 400, 20);
    mainContext.fillStyle = '#4a90d9';
    mainContext.fillText(`Water: ${resources.water}`, 500, 20);
    mainContext.fillStyle = '#8b5cf6';
    mainContext.fillText(`Cobalt: ${resources.cobalt}`, 610, 20);

    mainContext.fillStyle = '#fff';
    mainContext.font = '14px Arial';
    mainContext.fillText(`Score: ${score}`, 720, 38);

    // Dome HP
    mainContext.fillText(`Dome HP: ${Math.ceil(dome.hp)}/${dome.maxHp}`, 20, 38);

    // Combo display during mining
    if (gameState === 'mining' && miningCombo > 0) {
        const mult = getComboMultiplier().toFixed(1);
        mainContext.fillStyle = '#ffdd44';
        mainContext.font = 'bold 18px Arial';
        mainContext.fillText(`Combo: ${miningCombo}x (${mult}x)`, mainCanvasSize.x - 180, 30);
    }

    // Controls
    mainContext.fillStyle = '#888';
    mainContext.font = '12px Arial';
    if (gameState === 'mining') {
        mainContext.fillText('WASD: Move/Drill | Return to dome before timer ends!', 20, mainCanvasSize.y - 20);
    } else {
        mainContext.fillText('Mouse: Aim | Click: Fire Laser | Defend the dome!', 20, mainCanvasSize.y - 20);
    }
}

// Draw particles
function drawParticles() {
    for (const p of particles) {
        const alpha = p.life / 1.0;
        const screenPos = worldToScreen(vec2(p.x, p.y));
        const size = 4 * cameraScale / 16;
        const r = Math.floor(p.color.r * 255);
        const g = Math.floor(p.color.g * 255);
        const b = Math.floor(p.color.b * 255);
        mainContext.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        mainContext.fillRect(screenPos.x - size/2, screenPos.y - size/2, size, size);
    }
}

// Draw floating texts
function drawFloatingTexts() {
    for (const ft of floatingTexts) {
        const alpha = ft.life / ft.maxLife;
        const screenPos = worldToScreen(vec2(ft.x, ft.y));
        const r = Math.floor(ft.color.r * 255);
        const g = Math.floor(ft.color.g * 255);
        const b = Math.floor(ft.color.b * 255);

        mainContext.font = 'bold 14px Arial';
        mainContext.textAlign = 'center';

        // Drop shadow
        mainContext.fillStyle = `rgba(0,0,0,${alpha * 0.5})`;
        mainContext.fillText(ft.text, screenPos.x + 1, screenPos.y + 1);

        // Main text
        mainContext.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        mainContext.fillText(ft.text, screenPos.x, screenPos.y);
        mainContext.textAlign = 'left';
    }
}

// Draw title screen
function drawTitle() {
    mainContext.fillStyle = '#1a0a20';
    mainContext.fillRect(0, 0, mainCanvasSize.x, mainCanvasSize.y);

    const gradient = mainContext.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, '#5c3366');
    gradient.addColorStop(1, '#3d1f47');
    mainContext.fillStyle = gradient;
    mainContext.fillRect(0, 0, mainCanvasSize.x, 300);

    mainContext.fillStyle = '#ffdd44';
    mainContext.font = 'bold 48px Arial';
    mainContext.textAlign = 'center';
    mainContext.fillText('DOME KEEPER', mainCanvasSize.x / 2, 180);

    mainContext.fillStyle = '#87ceeb';
    mainContext.font = '20px Arial';
    mainContext.fillText('Mining & Tower Defense', mainCanvasSize.x / 2, 230);

    mainContext.fillStyle = '#fff';
    mainContext.font = '18px Arial';
    mainContext.fillText('Press SPACE or Click to Start', mainCanvasSize.x / 2, 350);

    mainContext.fillStyle = '#aaa';
    mainContext.font = '14px Arial';
    mainContext.fillText('Mine underground for resources during mining phase', mainCanvasSize.x / 2, 430);
    mainContext.fillText('Return to dome and defend against enemy waves', mainCanvasSize.x / 2, 455);
    mainContext.fillText('WASD to move | Mouse to aim | Click to fire', mainCanvasSize.x / 2, 480);

    mainContext.textAlign = 'left';
}

// Draw game over
function drawGameOver() {
    mainContext.fillStyle = 'rgba(0, 0, 0, 0.9)';
    mainContext.fillRect(0, 0, mainCanvasSize.x, mainCanvasSize.y);

    mainContext.fillStyle = '#ff4444';
    mainContext.font = 'bold 48px Arial';
    mainContext.textAlign = 'center';
    mainContext.fillText('DOME DESTROYED', mainCanvasSize.x / 2, 200);

    mainContext.fillStyle = '#fff';
    mainContext.font = '24px Arial';
    mainContext.fillText(`Final Score: ${score}`, mainCanvasSize.x / 2, 280);
    mainContext.fillText(`Waves Survived: ${currentWave}`, mainCanvasSize.x / 2, 320);

    mainContext.font = '18px Arial';
    mainContext.fillText('Press SPACE to Restart', mainCanvasSize.x / 2, 420);
    mainContext.textAlign = 'left';
}

// Expose for testing
window.gameState = {
    get state() { return gameState; },
    get score() { return score; },
    get currentWave() { return currentWave; },
    get domeHp() { return dome.hp; },
    get resources() { return resources; },
    get enemies() { return enemies.length; }
};

window.startGame = () => {
    if (gameState === 'title' || gameState === 'gameover') {
        resetGame();
    }
};

// Start LittleJS engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
