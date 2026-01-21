// Dome Keeper Clone - PixiJS
// Mining + Tower Defense hybrid

const app = new PIXI.Application({
    width: 1024,
    height: 768,
    backgroundColor: 0x1a0a0a,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
});
document.body.appendChild(app.view);

// Game constants
const TILE_SIZE = 32;
const GRID_WIDTH = 40;
const GRID_HEIGHT = 30;
const SURFACE_Y = 5; // Surface level (dome sits here)
const DOME_X = GRID_WIDTH / 2;

// Game state
const gameState = {
    phase: 'menu', // menu, mining, defense, upgrade, gameover, victory
    wave: 0,
    maxWaves: 10,
    domeHealth: 100,
    maxDomeHealth: 100,
    resources: { iron: 0, water: 0 },
    upgrades: {
        drillSpeed: 1,
        carryCapacity: 1,
        laserDamage: 1
    },
    waveTimer: 0,
    waveWarning: false,
    waveWarningTime: 10,
    enemiesRemaining: 0
};

// Player state
const player = {
    x: DOME_X * TILE_SIZE,
    y: (SURFACE_Y + 1) * TILE_SIZE,
    vx: 0,
    vy: 0,
    width: 24,
    height: 28,
    speed: 150,
    onGround: false,
    drilling: false,
    drillDir: null,
    drillProgress: 0,
    carrying: { iron: 0, water: 0 },
    inDome: false
};

// Grid types
const TILE = {
    EMPTY: 0,
    DIRT: 1,
    IRON: 2,
    WATER: 3,
    BEDROCK: 4
};

// Generate grid
let grid = [];
function generateGrid() {
    grid = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (y < SURFACE_Y) {
                grid[y][x] = TILE.EMPTY;
            } else if (y === GRID_HEIGHT - 1 || x === 0 || x === GRID_WIDTH - 1) {
                grid[y][x] = TILE.BEDROCK;
            } else if (y === SURFACE_Y && Math.abs(x - DOME_X) <= 2) {
                // Clear area under dome
                grid[y][x] = TILE.EMPTY;
            } else {
                // Random terrain
                const rand = Math.random();
                if (rand < 0.12) {
                    grid[y][x] = TILE.IRON;
                } else if (rand < 0.18) {
                    grid[y][x] = TILE.WATER;
                } else {
                    grid[y][x] = TILE.DIRT;
                }
            }
        }
    }
    // Make starting area under dome empty
    for (let dy = 0; dy < 3; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const y = SURFACE_Y + dy;
            const x = DOME_X + dx;
            if (y < GRID_HEIGHT && x > 0 && x < GRID_WIDTH - 1) {
                grid[y][x] = TILE.EMPTY;
            }
        }
    }
}

// Containers
const worldContainer = new PIXI.Container();
const gridContainer = new PIXI.Container();
const entityContainer = new PIXI.Container();
const domeContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();
const menuContainer = new PIXI.Container();
const upgradeContainer = new PIXI.Container();

worldContainer.addChild(gridContainer);
worldContainer.addChild(entityContainer);
worldContainer.addChild(domeContainer);
app.stage.addChild(worldContainer);
app.stage.addChild(uiContainer);
app.stage.addChild(menuContainer);
app.stage.addChild(upgradeContainer);

// Tile graphics cache
const tileGraphics = [];

// Draw grid
function drawGrid() {
    gridContainer.removeChildren();
    tileGraphics.length = 0;

    for (let y = 0; y < GRID_HEIGHT; y++) {
        tileGraphics[y] = [];
        for (let x = 0; x < GRID_WIDTH; x++) {
            const tile = grid[y][x];
            if (tile === TILE.EMPTY) {
                tileGraphics[y][x] = null;
                continue;
            }

            const g = new PIXI.Graphics();
            g.x = x * TILE_SIZE;
            g.y = y * TILE_SIZE;

            let color;
            switch (tile) {
                case TILE.DIRT: color = 0x8B4513; break;
                case TILE.IRON: color = 0x708090; break;
                case TILE.WATER: color = 0x4169E1; break;
                case TILE.BEDROCK: color = 0x2F2F2F; break;
            }

            g.beginFill(color);
            g.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
            g.endFill();

            // Add texture detail
            g.lineStyle(1, 0x000000, 0.2);
            g.drawRect(0, 0, TILE_SIZE, TILE_SIZE);

            if (tile === TILE.IRON) {
                g.beginFill(0xC0C0C0, 0.6);
                g.drawCircle(8, 8, 4);
                g.drawCircle(20, 16, 5);
                g.drawCircle(12, 24, 3);
                g.endFill();
            } else if (tile === TILE.WATER) {
                g.beginFill(0x6495ED, 0.5);
                g.drawEllipse(16, 12, 10, 6);
                g.drawEllipse(10, 22, 6, 4);
                g.endFill();
            }

            gridContainer.addChild(g);
            tileGraphics[y][x] = g;
        }
    }

    // Draw sky background
    const sky = new PIXI.Graphics();
    sky.beginFill(0x1a1a2e);
    sky.drawRect(0, 0, GRID_WIDTH * TILE_SIZE, SURFACE_Y * TILE_SIZE);
    sky.endFill();
    gridContainer.addChildAt(sky, 0);
}

// Player sprite
const playerSprite = new PIXI.Graphics();
function drawPlayer() {
    playerSprite.clear();
    // Body
    playerSprite.beginFill(0xE07020);
    playerSprite.drawRoundedRect(-12, -14, 24, 28, 4);
    playerSprite.endFill();
    // Visor
    playerSprite.beginFill(0x40E0E0);
    playerSprite.drawRoundedRect(-8, -12, 16, 8, 2);
    playerSprite.endFill();
    // Drill arm
    playerSprite.beginFill(0x606060);
    if (player.drillDir === 'left') {
        playerSprite.drawRect(-20, -2, 10, 6);
    } else if (player.drillDir === 'right') {
        playerSprite.drawRect(10, -2, 10, 6);
    } else if (player.drillDir === 'down') {
        playerSprite.drawRect(-3, 12, 6, 10);
    } else if (player.drillDir === 'up') {
        playerSprite.drawRect(-3, -22, 6, 10);
    } else {
        playerSprite.drawRect(10, -2, 8, 6);
    }
    playerSprite.endFill();
}
drawPlayer();
entityContainer.addChild(playerSprite);

// Dome
const domeSprite = new PIXI.Graphics();
function drawDome() {
    domeSprite.clear();
    const healthPercent = gameState.domeHealth / gameState.maxDomeHealth;
    const domeColor = healthPercent > 0.5 ? 0x4080C0 : healthPercent > 0.25 ? 0xC08040 : 0xC04040;

    // Dome structure
    domeSprite.beginFill(domeColor);
    domeSprite.moveTo(-60, 0);
    domeSprite.lineTo(-60, -20);
    domeSprite.bezierCurveTo(-60, -70, 60, -70, 60, -20);
    domeSprite.lineTo(60, 0);
    domeSprite.lineTo(-60, 0);
    domeSprite.endFill();

    // Windows
    domeSprite.beginFill(0x80C0E0, 0.6);
    domeSprite.drawEllipse(-25, -35, 12, 15);
    domeSprite.drawEllipse(25, -35, 12, 15);
    domeSprite.endFill();

    // Base
    domeSprite.beginFill(0x505050);
    domeSprite.drawRect(-70, -5, 140, 10);
    domeSprite.endFill();

    domeSprite.x = DOME_X * TILE_SIZE;
    domeSprite.y = SURFACE_Y * TILE_SIZE;
}
drawDome();
domeContainer.addChild(domeSprite);

// Laser weapon
const laserSprite = new PIXI.Graphics();
let laserAngle = -Math.PI / 2;
let laserTarget = null;
let laserFiring = false;
let laserBeam = new PIXI.Graphics();

function drawLaser() {
    laserSprite.clear();
    // Turret base
    laserSprite.beginFill(0x404040);
    laserSprite.drawCircle(0, 0, 15);
    laserSprite.endFill();
    // Barrel
    laserSprite.beginFill(0x606060);
    laserSprite.drawRect(-4, -30, 8, 25);
    laserSprite.endFill();
    laserSprite.beginFill(0xFF4040);
    laserSprite.drawCircle(0, -32, 4);
    laserSprite.endFill();

    laserSprite.x = DOME_X * TILE_SIZE;
    laserSprite.y = (SURFACE_Y - 1) * TILE_SIZE - 20;
    laserSprite.rotation = laserAngle + Math.PI / 2;
}
drawLaser();
domeContainer.addChild(laserSprite);
domeContainer.addChild(laserBeam);

// Enemies
const enemies = [];

const ENEMY_TYPES = {
    WALKER: { health: 30, speed: 40, damage: 5, color: 0x804040, size: 20, ground: true },
    FLYER: { health: 20, speed: 60, damage: 3, color: 0x608040, size: 16, ground: false },
    HORNET: { health: 15, speed: 90, damage: 2, color: 0xC0C040, size: 12, ground: false },
    WORM: { health: 50, speed: 30, damage: 8, color: 0x6040A0, size: 24, ground: true },
    DIVER: { health: 40, speed: 50, damage: 6, color: 0x40A0A0, size: 18, ground: false, dives: true }
};

function spawnEnemy(type) {
    const template = ENEMY_TYPES[type];
    const side = Math.random() < 0.5 ? -1 : 1;
    const enemy = {
        type,
        x: side < 0 ? -50 : GRID_WIDTH * TILE_SIZE + 50,
        y: template.ground ? (SURFACE_Y - 1) * TILE_SIZE : (SURFACE_Y - 3) * TILE_SIZE + Math.random() * 60,
        health: template.health * (1 + gameState.wave * 0.1),
        maxHealth: template.health * (1 + gameState.wave * 0.1),
        speed: template.speed,
        damage: template.damage,
        color: template.color,
        size: template.size,
        ground: template.ground,
        dives: template.dives,
        sprite: new PIXI.Graphics()
    };

    // Draw enemy
    enemy.sprite.beginFill(enemy.color);
    if (type === 'WORM') {
        enemy.sprite.drawEllipse(0, 0, enemy.size, enemy.size / 2);
    } else if (type === 'FLYER' || type === 'HORNET') {
        enemy.sprite.moveTo(0, -enemy.size / 2);
        enemy.sprite.lineTo(enemy.size / 2, enemy.size / 2);
        enemy.sprite.lineTo(-enemy.size / 2, enemy.size / 2);
        enemy.sprite.closePath();
    } else {
        enemy.sprite.drawCircle(0, 0, enemy.size / 2);
    }
    enemy.sprite.endFill();

    // Eyes
    enemy.sprite.beginFill(0xFF0000);
    enemy.sprite.drawCircle(-4, -2, 3);
    enemy.sprite.drawCircle(4, -2, 3);
    enemy.sprite.endFill();

    entityContainer.addChild(enemy.sprite);
    enemies.push(enemy);
    gameState.enemiesRemaining++;
}

function spawnWave() {
    const waveNum = gameState.wave;
    const baseCount = 3 + waveNum * 2;

    const types = ['WALKER'];
    if (waveNum >= 2) types.push('FLYER');
    if (waveNum >= 4) types.push('HORNET');
    if (waveNum >= 6) types.push('WORM');
    if (waveNum >= 8) types.push('DIVER');

    for (let i = 0; i < baseCount; i++) {
        setTimeout(() => {
            if (gameState.phase === 'defense') {
                const type = types[Math.floor(Math.random() * types.length)];
                spawnEnemy(type);
            }
        }, i * 500);
    }
}

// Input handling
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && gameState.phase === 'mining' && player.inDome) {
        openUpgradeMenu();
    }
    if (e.code === 'Escape') {
        if (gameState.phase === 'upgrade') {
            closeUpgradeMenu();
        }
    }
});
window.addEventListener('keyup', e => keys[e.code] = false);

// Mouse for laser aiming
let mouseX = 0, mouseY = 0;
app.view.addEventListener('mousemove', e => {
    const rect = app.view.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// Collision detection
function getTileAt(px, py) {
    const tx = Math.floor(px / TILE_SIZE);
    const ty = Math.floor(py / TILE_SIZE);
    if (tx < 0 || tx >= GRID_WIDTH || ty < 0 || ty >= GRID_HEIGHT) return TILE.BEDROCK;
    return grid[ty][tx];
}

function isSolid(px, py) {
    const tile = getTileAt(px, py);
    return tile !== TILE.EMPTY;
}

function destroyTile(tx, ty) {
    if (tx < 0 || tx >= GRID_WIDTH || ty < 0 || ty >= GRID_HEIGHT) return null;
    const tile = grid[ty][tx];
    if (tile === TILE.BEDROCK) return null;
    if (tile === TILE.EMPTY) return null;

    grid[ty][tx] = TILE.EMPTY;
    if (tileGraphics[ty] && tileGraphics[ty][tx]) {
        gridContainer.removeChild(tileGraphics[ty][tx]);
        tileGraphics[ty][tx] = null;
    }
    return tile;
}

// Update player
function updatePlayer(delta) {
    const dt = delta / 60;

    // Check if in dome area
    const domeLeft = (DOME_X - 2) * TILE_SIZE;
    const domeRight = (DOME_X + 2) * TILE_SIZE;
    const domeTop = (SURFACE_Y - 2) * TILE_SIZE;
    const domeBottom = (SURFACE_Y + 1) * TILE_SIZE;
    player.inDome = player.x > domeLeft && player.x < domeRight &&
                   player.y > domeTop && player.y < domeBottom;

    // Movement input
    let moveX = 0;
    let moveY = 0;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX = -1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX = 1;

    // Drilling
    player.drilling = false;
    player.drillDir = null;

    const drillSpeed = 0.5 + gameState.upgrades.drillSpeed * 0.3;

    if (keys['KeyA'] || keys['ArrowLeft']) {
        const targetX = Math.floor((player.x - 20) / TILE_SIZE);
        const targetY = Math.floor(player.y / TILE_SIZE);
        if (isSolid(player.x - 20, player.y)) {
            player.drilling = true;
            player.drillDir = 'left';
            player.drillProgress += drillSpeed * dt;
            if (player.drillProgress >= 1) {
                const resource = destroyTile(targetX, targetY);
                collectResource(resource);
                player.drillProgress = 0;
            }
            moveX = 0;
        }
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        const targetX = Math.floor((player.x + 20) / TILE_SIZE);
        const targetY = Math.floor(player.y / TILE_SIZE);
        if (isSolid(player.x + 20, player.y)) {
            player.drilling = true;
            player.drillDir = 'right';
            player.drillProgress += drillSpeed * dt;
            if (player.drillProgress >= 1) {
                const resource = destroyTile(targetX, targetY);
                collectResource(resource);
                player.drillProgress = 0;
            }
            moveX = 0;
        }
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
        const targetX = Math.floor(player.x / TILE_SIZE);
        const targetY = Math.floor((player.y + 20) / TILE_SIZE);
        if (isSolid(player.x, player.y + 20)) {
            player.drilling = true;
            player.drillDir = 'down';
            player.drillProgress += drillSpeed * dt;
            if (player.drillProgress >= 1) {
                const resource = destroyTile(targetX, targetY);
                collectResource(resource);
                player.drillProgress = 0;
            }
        }
    }
    if (keys['KeyW'] || keys['ArrowUp']) {
        const targetX = Math.floor(player.x / TILE_SIZE);
        const targetY = Math.floor((player.y - 20) / TILE_SIZE);
        if (isSolid(player.x, player.y - 20)) {
            player.drilling = true;
            player.drillDir = 'up';
            player.drillProgress += drillSpeed * dt;
            if (player.drillProgress >= 1) {
                const resource = destroyTile(targetX, targetY);
                collectResource(resource);
                player.drillProgress = 0;
            }
        }
    }

    // Horizontal movement
    player.vx = moveX * player.speed;

    // Gravity
    player.vy += 600 * dt;
    if (player.vy > 400) player.vy = 400;

    // Jump
    if ((keys['KeyW'] || keys['ArrowUp'] || keys['Space']) && player.onGround && !player.drilling) {
        player.vy = -280;
        player.onGround = false;
    }

    // Apply movement with collision
    const newX = player.x + player.vx * dt;
    const newY = player.y + player.vy * dt;

    // Horizontal collision
    if (!isSolid(newX - 12, player.y - 10) && !isSolid(newX + 12, player.y - 10) &&
        !isSolid(newX - 12, player.y + 10) && !isSolid(newX + 12, player.y + 10)) {
        player.x = newX;
    }

    // Vertical collision
    player.onGround = false;
    if (player.vy > 0) {
        if (isSolid(player.x - 10, newY + 14) || isSolid(player.x + 10, newY + 14)) {
            player.y = Math.floor((newY + 14) / TILE_SIZE) * TILE_SIZE - 14;
            player.vy = 0;
            player.onGround = true;
        } else {
            player.y = newY;
        }
    } else {
        if (isSolid(player.x - 10, newY - 14) || isSolid(player.x + 10, newY - 14)) {
            player.y = Math.ceil((newY - 14) / TILE_SIZE) * TILE_SIZE + 14;
            player.vy = 0;
        } else {
            player.y = newY;
        }
    }

    // Clamp to world
    player.x = Math.max(20, Math.min(GRID_WIDTH * TILE_SIZE - 20, player.x));
    player.y = Math.max(20, Math.min(GRID_HEIGHT * TILE_SIZE - 20, player.y));

    // Update sprite
    playerSprite.x = player.x;
    playerSprite.y = player.y;
    drawPlayer();

    // Deposit resources in dome
    if (player.inDome && (player.carrying.iron > 0 || player.carrying.water > 0)) {
        gameState.resources.iron += player.carrying.iron;
        gameState.resources.water += player.carrying.water;
        player.carrying.iron = 0;
        player.carrying.water = 0;
    }
}

function collectResource(tile) {
    const capacity = 3 + gameState.upgrades.carryCapacity * 2;
    const total = player.carrying.iron + player.carrying.water;
    if (total >= capacity) return;

    if (tile === TILE.IRON) player.carrying.iron++;
    else if (tile === TILE.WATER) player.carrying.water++;
}

// Update enemies
function updateEnemies(delta) {
    const dt = delta / 60;
    const domeX = DOME_X * TILE_SIZE;
    const domeY = SURFACE_Y * TILE_SIZE - 30;

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Move toward dome
        const dx = domeX - enemy.x;
        const dy = domeY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10) {
            enemy.x += (dx / dist) * enemy.speed * dt;
            if (!enemy.ground) {
                enemy.y += (dy / dist) * enemy.speed * dt;
            }
        }

        // Attack dome
        if (dist < 70) {
            gameState.domeHealth -= enemy.damage * dt * 0.3;
            drawDome();

            // Flash enemy
            enemy.sprite.alpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.5;
        } else {
            enemy.sprite.alpha = 1;
        }

        // Update sprite position
        enemy.sprite.x = enemy.x;
        enemy.sprite.y = enemy.y;

        // Check death
        if (enemy.health <= 0) {
            entityContainer.removeChild(enemy.sprite);
            enemies.splice(i, 1);
            gameState.enemiesRemaining--;
        }
    }
}

// Update laser
function updateLaser(delta) {
    const dt = delta / 60;

    // Auto-aim at nearest enemy
    laserTarget = null;
    let nearestDist = Infinity;

    for (const enemy of enemies) {
        const dx = enemy.x - laserSprite.x;
        const dy = enemy.y - laserSprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Only target enemies above ground and in range
        if (dist < 400 && enemy.y < SURFACE_Y * TILE_SIZE && dist < nearestDist) {
            nearestDist = dist;
            laserTarget = enemy;
        }
    }

    // Aim at target
    if (laserTarget) {
        const targetAngle = Math.atan2(laserTarget.y - laserSprite.y, laserTarget.x - laserSprite.x);
        let angleDiff = targetAngle - laserAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        laserAngle += angleDiff * 5 * dt;

        // Fire!
        laserFiring = true;
        const damage = (5 + gameState.upgrades.laserDamage * 3) * dt;
        laserTarget.health -= damage;
    } else {
        laserFiring = false;
        // Return to neutral
        laserAngle += (-Math.PI / 2 - laserAngle) * 2 * dt;
    }

    // Draw laser beam
    laserBeam.clear();
    if (laserFiring && laserTarget) {
        laserBeam.lineStyle(4, 0xFF4040, 0.8);
        laserBeam.moveTo(laserSprite.x, laserSprite.y);
        laserBeam.lineTo(laserTarget.x, laserTarget.y);

        // Impact effect
        laserBeam.beginFill(0xFF8080, 0.6);
        laserBeam.drawCircle(laserTarget.x, laserTarget.y, 10 + Math.random() * 5);
        laserBeam.endFill();
    }

    laserSprite.rotation = laserAngle + Math.PI / 2;
}

// Camera
function updateCamera() {
    if (gameState.phase === 'mining') {
        // Follow player with zoom
        const targetX = -player.x + app.screen.width / 2;
        const targetY = -player.y + app.screen.height / 2;
        worldContainer.x += (targetX - worldContainer.x) * 0.1;
        worldContainer.y += (targetY - worldContainer.y) * 0.1;
    } else {
        // Center on dome
        const targetX = -DOME_X * TILE_SIZE + app.screen.width / 2;
        const targetY = -SURFACE_Y * TILE_SIZE + app.screen.height / 2 + 100;
        worldContainer.x += (targetX - worldContainer.x) * 0.05;
        worldContainer.y += (targetY - worldContainer.y) * 0.05;
    }
}

// UI
const uiTexts = {};

function createUI() {
    // Background bar
    const bar = new PIXI.Graphics();
    bar.beginFill(0x000000, 0.7);
    bar.drawRect(0, 0, 1024, 50);
    bar.endFill();
    uiContainer.addChild(bar);

    // Dome health
    uiTexts.health = new PIXI.Text('Dome: 100%', { fontSize: 18, fill: 0xFFFFFF });
    uiTexts.health.x = 20;
    uiTexts.health.y = 15;
    uiContainer.addChild(uiTexts.health);

    // Resources
    uiTexts.resources = new PIXI.Text('Iron: 0 | Water: 0', { fontSize: 18, fill: 0xFFFFFF });
    uiTexts.resources.x = 200;
    uiTexts.resources.y = 15;
    uiContainer.addChild(uiTexts.resources);

    // Carrying
    uiTexts.carrying = new PIXI.Text('Carrying: 0/5', { fontSize: 18, fill: 0xFFFFFF });
    uiTexts.carrying.x = 420;
    uiTexts.carrying.y = 15;
    uiContainer.addChild(uiTexts.carrying);

    // Wave
    uiTexts.wave = new PIXI.Text('Wave: 0/10', { fontSize: 18, fill: 0xFFFFFF });
    uiTexts.wave.x = 600;
    uiTexts.wave.y = 15;
    uiContainer.addChild(uiTexts.wave);

    // Phase/Warning
    uiTexts.phase = new PIXI.Text('Mining', { fontSize: 18, fill: 0x40FF40 });
    uiTexts.phase.x = 800;
    uiTexts.phase.y = 15;
    uiContainer.addChild(uiTexts.phase);

    // Dome prompt
    uiTexts.domePrompt = new PIXI.Text('[SPACE] Upgrades', { fontSize: 16, fill: 0xFFFF80 });
    uiTexts.domePrompt.x = app.screen.width / 2 - 60;
    uiTexts.domePrompt.y = 60;
    uiTexts.domePrompt.visible = false;
    uiContainer.addChild(uiTexts.domePrompt);
}

function updateUI() {
    const healthPercent = Math.max(0, Math.round(gameState.domeHealth / gameState.maxDomeHealth * 100));
    uiTexts.health.text = `Dome: ${healthPercent}%`;
    uiTexts.health.style.fill = healthPercent > 50 ? 0x40FF40 : healthPercent > 25 ? 0xFFFF40 : 0xFF4040;

    uiTexts.resources.text = `Iron: ${gameState.resources.iron} | Water: ${gameState.resources.water}`;

    const capacity = 3 + gameState.upgrades.carryCapacity * 2;
    const carrying = player.carrying.iron + player.carrying.water;
    uiTexts.carrying.text = `Carrying: ${carrying}/${capacity}`;

    uiTexts.wave.text = `Wave: ${gameState.wave}/${gameState.maxWaves}`;

    if (gameState.phase === 'mining') {
        if (gameState.waveWarning) {
            uiTexts.phase.text = `WARNING: ${Math.ceil(gameState.waveTimer)}s`;
            uiTexts.phase.style.fill = 0xFF4040;
        } else {
            uiTexts.phase.text = 'Mining';
            uiTexts.phase.style.fill = 0x40FF40;
        }
    } else if (gameState.phase === 'defense') {
        uiTexts.phase.text = `Defense (${gameState.enemiesRemaining} left)`;
        uiTexts.phase.style.fill = 0xFF8040;
    }

    uiTexts.domePrompt.visible = player.inDome && gameState.phase === 'mining';
}

// Menu
function createMenu() {
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.9);
    bg.drawRect(0, 0, 1024, 768);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('DOME KEEPER', { fontSize: 64, fill: 0x4080C0, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = 512;
    title.y = 200;
    menuContainer.addChild(title);

    const subtitle = new PIXI.Text('Mine resources. Defend the dome. Survive.', { fontSize: 24, fill: 0x808080 });
    subtitle.anchor.set(0.5);
    subtitle.x = 512;
    subtitle.y = 280;
    menuContainer.addChild(subtitle);

    const controls = new PIXI.Text(
        'WASD / Arrows - Move & Dig\n' +
        'SPACE - Jump / Open Upgrades (in dome)\n' +
        'ESC - Close menus\n\n' +
        'Dig for Iron and Water, return to dome to deposit.\n' +
        'Defend against 10 waves of enemies!',
        { fontSize: 18, fill: 0xA0A0A0, align: 'center' }
    );
    controls.anchor.set(0.5);
    controls.x = 512;
    controls.y = 420;
    menuContainer.addChild(controls);

    const start = new PIXI.Text('[ Click to Start ]', { fontSize: 32, fill: 0x40FF40 });
    start.anchor.set(0.5);
    start.x = 512;
    start.y = 580;
    start.eventMode = 'static';
    start.cursor = 'pointer';
    start.on('pointerdown', startGame);
    menuContainer.addChild(start);
}

function startGame() {
    gameState.phase = 'mining';
    gameState.wave = 0;
    gameState.domeHealth = 100;
    gameState.resources = { iron: 0, water: 0 };
    gameState.upgrades = { drillSpeed: 1, carryCapacity: 1, laserDamage: 1 };
    gameState.waveTimer = 30; // First wave in 30 seconds
    gameState.waveWarning = false;

    player.x = DOME_X * TILE_SIZE;
    player.y = (SURFACE_Y + 1) * TILE_SIZE;
    player.carrying = { iron: 0, water: 0 };

    generateGrid();
    drawGrid();
    drawDome();

    menuContainer.visible = false;
}

// Upgrade menu
function createUpgradeMenu() {
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.9);
    bg.drawRect(0, 0, 1024, 768);
    bg.endFill();
    upgradeContainer.addChild(bg);

    const title = new PIXI.Text('UPGRADES', { fontSize: 48, fill: 0x4080C0, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = 512;
    title.y = 100;
    upgradeContainer.addChild(title);

    upgradeContainer.visible = false;
}

const upgradeButtons = [];

function openUpgradeMenu() {
    gameState.phase = 'upgrade';
    upgradeContainer.visible = true;

    // Clear old buttons
    upgradeButtons.forEach(b => upgradeContainer.removeChild(b));
    upgradeButtons.length = 0;

    const upgrades = [
        { key: 'drillSpeed', name: 'Drill Speed', cost: 5, costType: 'iron', desc: 'Dig faster' },
        { key: 'carryCapacity', name: 'Carry Capacity', cost: 5, costType: 'iron', desc: 'Carry more resources' },
        { key: 'laserDamage', name: 'Laser Damage', cost: 8, costType: 'water', desc: 'More damage to enemies' }
    ];

    upgrades.forEach((upg, i) => {
        const level = gameState.upgrades[upg.key];
        const cost = upg.cost * level;
        const canAfford = gameState.resources[upg.costType] >= cost;

        const btn = new PIXI.Container();
        btn.x = 512;
        btn.y = 220 + i * 120;

        const bg = new PIXI.Graphics();
        bg.beginFill(canAfford ? 0x404060 : 0x303030);
        bg.drawRoundedRect(-200, -40, 400, 80, 10);
        bg.endFill();
        btn.addChild(bg);

        const text = new PIXI.Text(`${upg.name} (Lv ${level})`, { fontSize: 24, fill: 0xFFFFFF });
        text.anchor.set(0.5);
        text.y = -12;
        btn.addChild(text);

        const costText = new PIXI.Text(`Cost: ${cost} ${upg.costType}`, { fontSize: 16, fill: canAfford ? 0x80FF80 : 0xFF8080 });
        costText.anchor.set(0.5);
        costText.y = 15;
        btn.addChild(costText);

        if (canAfford) {
            btn.eventMode = 'static';
            btn.cursor = 'pointer';
            btn.on('pointerdown', () => {
                gameState.resources[upg.costType] -= cost;
                gameState.upgrades[upg.key]++;
                openUpgradeMenu(); // Refresh
            });
        }

        upgradeContainer.addChild(btn);
        upgradeButtons.push(btn);
    });

    // Resource display
    const resText = new PIXI.Text(`Iron: ${gameState.resources.iron} | Water: ${gameState.resources.water}`,
        { fontSize: 20, fill: 0xFFFFFF });
    resText.anchor.set(0.5);
    resText.x = 512;
    resText.y = 560;
    upgradeContainer.addChild(resText);
    upgradeButtons.push(resText);

    // Close button
    const closeBtn = new PIXI.Text('[ESC] Close', { fontSize: 20, fill: 0x808080 });
    closeBtn.anchor.set(0.5);
    closeBtn.x = 512;
    closeBtn.y = 620;
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.on('pointerdown', closeUpgradeMenu);
    upgradeContainer.addChild(closeBtn);
    upgradeButtons.push(closeBtn);
}

function closeUpgradeMenu() {
    gameState.phase = 'mining';
    upgradeContainer.visible = false;
}

// Game over / Victory screens
function showGameOver() {
    gameState.phase = 'gameover';
    menuContainer.visible = true;
    menuContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x200000, 0.95);
    bg.drawRect(0, 0, 1024, 768);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('DOME DESTROYED', { fontSize: 64, fill: 0xFF4040, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = 512;
    title.y = 300;
    menuContainer.addChild(title);

    const stats = new PIXI.Text(`Survived ${gameState.wave} waves`, { fontSize: 32, fill: 0xFFFFFF });
    stats.anchor.set(0.5);
    stats.x = 512;
    stats.y = 400;
    menuContainer.addChild(stats);

    const restart = new PIXI.Text('[ Click to Restart ]', { fontSize: 28, fill: 0xFF8080 });
    restart.anchor.set(0.5);
    restart.x = 512;
    restart.y = 500;
    restart.eventMode = 'static';
    restart.cursor = 'pointer';
    restart.on('pointerdown', () => {
        menuContainer.removeChildren();
        createMenu();
        menuContainer.visible = true;
    });
    menuContainer.addChild(restart);
}

function showVictory() {
    gameState.phase = 'victory';
    menuContainer.visible = true;
    menuContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x002000, 0.95);
    bg.drawRect(0, 0, 1024, 768);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('VICTORY!', { fontSize: 72, fill: 0x40FF40, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = 512;
    title.y = 300;
    menuContainer.addChild(title);

    const stats = new PIXI.Text(`Dome integrity: ${Math.round(gameState.domeHealth)}%`, { fontSize: 32, fill: 0xFFFFFF });
    stats.anchor.set(0.5);
    stats.x = 512;
    stats.y = 400;
    menuContainer.addChild(stats);

    const restart = new PIXI.Text('[ Click to Play Again ]', { fontSize: 28, fill: 0x80FF80 });
    restart.anchor.set(0.5);
    restart.x = 512;
    restart.y = 500;
    restart.eventMode = 'static';
    restart.cursor = 'pointer';
    restart.on('pointerdown', () => {
        menuContainer.removeChildren();
        createMenu();
        menuContainer.visible = true;
    });
    menuContainer.addChild(restart);
}

// Wave management
function updateWaves(delta) {
    const dt = delta / 60;

    if (gameState.phase === 'mining') {
        gameState.waveTimer -= dt;

        // Warning
        if (gameState.waveTimer <= gameState.waveWarningTime && !gameState.waveWarning) {
            gameState.waveWarning = true;
        }

        // Start wave
        if (gameState.waveTimer <= 0) {
            gameState.wave++;
            gameState.phase = 'defense';
            gameState.waveWarning = false;
            gameState.enemiesRemaining = 0;
            spawnWave();
        }
    } else if (gameState.phase === 'defense') {
        // Check wave end
        if (enemies.length === 0 && gameState.enemiesRemaining <= 0) {
            if (gameState.wave >= gameState.maxWaves) {
                showVictory();
            } else {
                gameState.phase = 'mining';
                gameState.waveTimer = 30 + gameState.wave * 5; // More time for later waves
            }
        }

        // Check dome death
        if (gameState.domeHealth <= 0) {
            showGameOver();
        }
    }
}

// Initialize
createUI();
createMenu();
createUpgradeMenu();
generateGrid();
drawGrid();

// Main game loop
app.ticker.add((delta) => {
    if (gameState.phase === 'menu' || gameState.phase === 'gameover' || gameState.phase === 'victory') {
        return;
    }

    if (gameState.phase === 'upgrade') {
        updateCamera();
        return;
    }

    updatePlayer(delta);
    updateWaves(delta);

    if (gameState.phase === 'defense') {
        updateEnemies(delta);
        updateLaser(delta);
    }

    updateCamera();
    updateUI();
});

console.log('Dome Keeper Clone loaded!');
