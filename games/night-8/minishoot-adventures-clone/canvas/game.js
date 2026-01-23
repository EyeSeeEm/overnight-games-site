// Minishoot Adventures Clone - Twin-Stick Shooter Adventure
// Canvas 2D Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ==================== GAME CONSTANTS ====================
const TILE_SIZE = 32;
const PLAYER_SPEED = 200;
const BULLET_SPEED = 400;

// Vibrant cartoon colors
const COLORS = {
    // UI
    heartRed: '#ff6688',
    heartEmpty: '#442233',
    energyCyan: '#00ddff',
    energyEmpty: '#224466',
    crystalRed: '#ff4444',
    uiGold: '#ffdd44',

    // Forest biome
    forestGrass: '#3a8a5a',
    forestGrassDark: '#2a6a4a',
    forestPath: '#d4a060',
    forestCliff: '#6a5040',

    // Autumn biome
    autumnGrass: '#5a9a6a',
    autumnTree: '#ff8844',
    autumnTreeDark: '#cc6622',

    // Cave biome
    cavePurple: '#8844aa',
    caveFloor: '#332244',
    crystal: '#aa66ff',

    // Player
    playerBody: '#ffffff',
    playerAccent: '#00ccff',
    playerGlow: '#44eeff',

    // Enemies
    enemyGreen: '#66aa44',
    enemyOrange: '#ff8800',
    enemyPurple: '#aa44aa',
    enemyBullet: '#ffaa44'
};

// ==================== GAME STATE ====================
const game = {
    state: 'menu', // menu, playing, paused, levelup, gameover, victory
    time: 0,
    debugMode: false,
    screenShake: 0,
    biome: 'forest' // forest, autumn, cave
};

// ==================== PLAYER DATA ====================
const player = {
    x: 400, y: 300,
    vx: 0, vy: 0,
    angle: 0,
    width: 24, height: 24,
    speed: 200,
    health: 3, maxHealth: 3,
    energy: 4, maxEnergy: 4,
    crystals: 0,
    xp: 0, level: 1,
    xpToLevel: 10,

    // Combat stats
    damage: 1,
    fireRate: 3, // shots per second
    range: 300,
    lastShot: 0,

    // Abilities
    hasDash: false,
    hasSupershot: false,
    dashCooldown: 0,
    invincible: 0
};

// ==================== INPUT ====================
const keys = {};
const mouse = { x: 400, y: 300, down: false };

document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'q') game.debugMode = !game.debugMode;
    if (e.key === ' ' && game.state === 'menu') startGame();
    if (e.key === ' ' && game.state === 'gameover') startGame();
    if (e.key.toLowerCase() === 'p' && game.state === 'playing') game.state = 'paused';
    else if (e.key.toLowerCase() === 'p' && game.state === 'paused') game.state = 'playing';
});

document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', e => {
    mouse.down = true;
    if (game.state === 'menu') startGame();
});

canvas.addEventListener('mouseup', () => mouse.down = false);
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ==================== ENTITIES ====================
let bullets = [];
let enemies = [];
let enemyBullets = [];
let particles = [];
let pickups = [];
let walls = [];

// ==================== ENEMY TYPES ====================
const ENEMY_TYPES = {
    scout: {
        width: 20, height: 20,
        health: 2, damage: 1, speed: 100,
        color: COLORS.enemyGreen,
        xp: 1, behavior: 'chase', shootRate: 2000
    },
    grasshopper: {
        width: 24, height: 24,
        health: 3, damage: 1, speed: 150,
        color: COLORS.enemyOrange,
        xp: 2, behavior: 'hop', shootRate: 1500
    },
    turret: {
        width: 28, height: 28,
        health: 5, damage: 1, speed: 0,
        color: COLORS.enemyGreen,
        xp: 3, behavior: 'turret', shootRate: 800
    },
    heavy: {
        width: 32, height: 32,
        health: 10, damage: 2, speed: 60,
        color: COLORS.enemyPurple,
        xp: 5, behavior: 'chase', shootRate: 1200
    }
};

// ==================== LEVEL GENERATION ====================
function generateLevel() {
    walls = [];
    enemies = [];
    pickups = [];

    // Create border
    const mapWidth = 50;
    const mapHeight = 40;

    for (let x = 0; x < mapWidth; x++) {
        for (let y = 0; y < mapHeight; y++) {
            // Border walls
            if (x === 0 || y === 0 || x === mapWidth - 1 || y === mapHeight - 1) {
                walls.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE });
            }
            // Random cliff/rock obstacles
            else if (Math.random() < 0.05 && Math.abs(x - 25) > 3 && Math.abs(y - 20) > 3) {
                walls.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, type: 'rock' });
            }
        }
    }

    // Spawn enemies
    const enemyCount = 10 + player.level * 3;
    for (let i = 0; i < enemyCount; i++) {
        spawnEnemy();
    }

    // Spawn pickups
    for (let i = 0; i < 5; i++) {
        spawnPickup('crystal');
    }
    spawnPickup('heart');
    spawnPickup('energy');
}

function spawnEnemy() {
    const types = Object.keys(ENEMY_TYPES);
    const type = types[Math.floor(Math.random() * Math.min(types.length, 2 + Math.floor(player.level / 2)))];
    const template = ENEMY_TYPES[type];

    let x, y;
    do {
        x = 100 + Math.random() * 1400;
        y = 100 + Math.random() * 1100;
    } while (Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2) < 200);

    enemies.push({
        type,
        x, y,
        ...template,
        maxHealth: template.health,
        lastShot: 0,
        hopTimer: 0,
        flash: 0
    });
}

function spawnPickup(type) {
    pickups.push({
        type,
        x: 100 + Math.random() * 1400,
        y: 100 + Math.random() * 1100,
        width: 16, height: 16,
        bob: Math.random() * Math.PI * 2
    });
}

// ==================== GAME FUNCTIONS ====================
function startGame() {
    game.state = 'playing';
    game.time = 0;
    game.biome = 'forest';

    // Reset player
    player.x = 800;
    player.y = 640;
    player.health = 3;
    player.maxHealth = 3;
    player.energy = 4;
    player.maxEnergy = 4;
    player.crystals = 0;
    player.xp = 0;
    player.level = 1;
    player.xpToLevel = 10;
    player.damage = 1;
    player.fireRate = 3;
    player.invincible = 60;

    // Clear entities
    bullets = [];
    enemies = [];
    enemyBullets = [];
    particles = [];
    pickups = [];

    generateLevel();
}

// ==================== SHOOTING ====================
function shoot() {
    if (game.state !== 'playing') return;
    const now = Date.now();
    if (now - player.lastShot < 1000 / player.fireRate) return;

    player.lastShot = now;

    const angle = Math.atan2(mouse.y - player.y + (player.y - canvas.height / 2), mouse.x - player.x + (player.x - canvas.width / 2));

    bullets.push({
        x: player.x + Math.cos(angle) * 15,
        y: player.y + Math.sin(angle) * 15,
        vx: Math.cos(angle) * BULLET_SPEED,
        vy: Math.sin(angle) * BULLET_SPEED,
        damage: player.damage,
        life: player.range / BULLET_SPEED * 60
    });

    // Muzzle flash
    createParticle(player.x + Math.cos(angle) * 20, player.y + Math.sin(angle) * 20, COLORS.playerGlow, 6, 8);
}

// ==================== PARTICLES ====================
function createParticle(x, y, color, size, life) {
    particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color, size, life, maxLife: life
    });
}

function createDeathParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        particles.push({
            x, y,
            vx: Math.cos(angle) * (2 + Math.random() * 3),
            vy: Math.sin(angle) * (2 + Math.random() * 3),
            color, size: 5 + Math.random() * 5, life: 30, maxLife: 30
        });
    }
}

// ==================== UPDATE ====================
function update(dt) {
    if (game.state !== 'playing') return;

    game.time += dt;
    if (game.screenShake > 0) game.screenShake--;

    updatePlayer(dt);
    updateBullets(dt);
    updateEnemies(dt);
    updateEnemyBullets(dt);
    updateParticles();
    updatePickups();

    // Auto-fire while holding mouse
    if (mouse.down) shoot();

    // Check level complete
    if (enemies.length === 0) {
        player.level++;
        player.xpToLevel = 10 + player.level * 5;
        generateLevel();
    }
}

function updatePlayer(dt) {
    // Movement input
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy = -1;
    if (keys['s'] || keys['arrowdown']) dy = 1;
    if (keys['a'] || keys['arrowleft']) dx = -1;
    if (keys['d'] || keys['arrowright']) dx = 1;

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Apply movement
    const newX = player.x + dx * player.speed * dt;
    const newY = player.y + dy * player.speed * dt;

    // Wall collision
    if (!collidesWithWalls(newX, player.y, player.width, player.height)) {
        player.x = newX;
    }
    if (!collidesWithWalls(player.x, newY, player.width, player.height)) {
        player.y = newY;
    }

    // Aim toward mouse (world space)
    const camX = player.x - canvas.width / 2;
    const camY = player.y - canvas.height / 2;
    player.angle = Math.atan2(mouse.y + camY - player.y, mouse.x + camX - player.x);

    // Invincibility
    if (player.invincible > 0) player.invincible--;

    // Dash ability
    if (player.hasDash && player.dashCooldown > 0) player.dashCooldown--;
    if (player.hasDash && keys[' '] && player.dashCooldown === 0) {
        // Dash in movement direction
        const dashDist = 100;
        player.x += dx * dashDist;
        player.y += dy * dashDist;
        player.dashCooldown = 30;
        player.invincible = 15;

        // Dash particles
        for (let i = 0; i < 8; i++) {
            createParticle(player.x, player.y, COLORS.playerGlow, 4, 15);
        }
    }
}

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life--;

        // Wall collision
        if (collidesWithWalls(b.x, b.y, 4, 4) || b.life <= 0) {
            createParticle(b.x, b.y, COLORS.playerGlow, 4, 10);
            bullets.splice(i, 1);
            continue;
        }

        // Enemy collision
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dist = Math.sqrt((b.x - e.x) ** 2 + (b.y - e.y) ** 2);

            if (dist < e.width / 2 + 5) {
                e.health -= b.damage;
                e.flash = 5;
                createParticle(b.x, b.y, e.color, 4, 15);

                if (e.health <= 0) {
                    // Enemy death
                    player.xp += e.xp;
                    createDeathParticles(e.x, e.y, e.color);

                    // Drop crystals
                    for (let k = 0; k < e.xp; k++) {
                        pickups.push({
                            type: 'crystal',
                            x: e.x + (Math.random() - 0.5) * 30,
                            y: e.y + (Math.random() - 0.5) * 30,
                            width: 12, height: 12,
                            bob: Math.random() * Math.PI * 2
                        });
                    }

                    enemies.splice(j, 1);

                    // Level up check
                    if (player.xp >= player.xpToLevel) {
                        player.xp -= player.xpToLevel;
                        player.level++;
                        player.xpToLevel = 10 + player.level * 5;

                        // Stat increase
                        player.damage += 0.2;
                        player.fireRate += 0.1;
                    }
                }

                bullets.splice(i, 1);
                break;
            }
        }
    }
}

function updateEnemies(dt) {
    enemies.forEach(e => {
        if (e.flash > 0) e.flash--;

        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Movement AI
        if (e.behavior === 'chase' && dist > 50) {
            e.x += Math.cos(angle) * e.speed * dt;
            e.y += Math.sin(angle) * e.speed * dt;
        } else if (e.behavior === 'hop') {
            e.hopTimer++;
            if (e.hopTimer > 60) {
                e.x += Math.cos(angle) * 80;
                e.y += Math.sin(angle) * 80;
                e.hopTimer = 0;
            }
        }

        // Wall collision for enemies
        if (collidesWithWalls(e.x, e.y, e.width, e.height)) {
            e.x -= Math.cos(angle) * e.speed * dt * 2;
            e.y -= Math.sin(angle) * e.speed * dt * 2;
        }

        // Shooting
        const now = Date.now();
        if (now - e.lastShot > e.shootRate && dist < 400) {
            e.lastShot = now;

            if (e.behavior === 'turret') {
                // 8-way spread
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2;
                    enemyBullets.push({
                        x: e.x, y: e.y,
                        vx: Math.cos(a) * 150,
                        vy: Math.sin(a) * 150,
                        damage: e.damage
                    });
                }
            } else {
                // Aimed shot
                enemyBullets.push({
                    x: e.x, y: e.y,
                    vx: Math.cos(angle) * 180,
                    vy: Math.sin(angle) * 180,
                    damage: e.damage
                });
            }
        }

        // Player collision
        if (player.invincible <= 0 && dist < (e.width + player.width) / 2) {
            damagePlayer(e.damage);
        }
    });
}

function updateEnemyBullets(dt) {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Wall collision
        if (collidesWithWalls(b.x, b.y, 6, 6)) {
            enemyBullets.splice(i, 1);
            continue;
        }

        // Player collision
        const dist = Math.sqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
        if (dist < player.width / 2 + 5 && player.invincible <= 0) {
            damagePlayer(b.damage);
            enemyBullets.splice(i, 1);
        }

        // Out of bounds
        if (b.x < -50 || b.x > 1700 || b.y < -50 || b.y > 1400) {
            enemyBullets.splice(i, 1);
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life--;

        if (p.life <= 0) particles.splice(i, 1);
    }
}

function updatePickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        p.bob += 0.1;

        const dist = Math.sqrt((p.x - player.x) ** 2 + (p.y - player.y) ** 2);
        if (dist < 30) {
            // Collect
            if (p.type === 'crystal') {
                player.crystals++;
            } else if (p.type === 'heart') {
                player.health = Math.min(player.maxHealth, player.health + 1);
            } else if (p.type === 'energy') {
                player.energy = Math.min(player.maxEnergy, player.energy + 1);
            }

            // Collection particles
            for (let j = 0; j < 5; j++) {
                const color = p.type === 'crystal' ? COLORS.crystalRed :
                    p.type === 'heart' ? COLORS.heartRed : COLORS.energyCyan;
                createParticle(p.x, p.y, color, 3, 15);
            }

            pickups.splice(i, 1);
        }
    }
}

function damagePlayer(amount) {
    player.health -= amount;
    player.invincible = 60;
    game.screenShake = 10;

    for (let i = 0; i < 5; i++) {
        createParticle(player.x, player.y, COLORS.heartRed, 4, 20);
    }

    if (player.health <= 0) {
        game.state = 'gameover';
    }
}

function collidesWithWalls(x, y, w, h) {
    for (const wall of walls) {
        if (x - w / 2 < wall.x + wall.width &&
            x + w / 2 > wall.x &&
            y - h / 2 < wall.y + wall.height &&
            y + h / 2 > wall.y) {
            return true;
        }
    }
    return false;
}

// ==================== RENDER ====================
function render() {
    // Clear with biome background
    ctx.fillStyle = game.biome === 'forest' ? COLORS.forestGrassDark :
        game.biome === 'autumn' ? '#3a5a3a' : COLORS.caveFloor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === 'menu') {
        renderMenu();
        return;
    }

    // Camera
    const shakeX = game.screenShake > 0 ? (Math.random() - 0.5) * game.screenShake : 0;
    const shakeY = game.screenShake > 0 ? (Math.random() - 0.5) * game.screenShake : 0;

    ctx.save();
    const camX = player.x - canvas.width / 2 + shakeX;
    const camY = player.y - canvas.height / 2 + shakeY;
    ctx.translate(-camX, -camY);

    renderWorld();
    renderPickups();
    renderEnemies();
    renderBullets();
    renderPlayer();
    renderParticles();

    ctx.restore();

    renderHUD();
    if (game.debugMode) renderDebug();
    if (game.state === 'paused') renderPaused();
    if (game.state === 'gameover') renderGameOver();
}

function renderMenu() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#2a4a3a');
    grad.addColorStop(1, '#1a2a1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative shapes
    ctx.fillStyle = '#3a6a4a';
    for (let i = 0; i < 20; i++) {
        const x = (i * 97) % canvas.width;
        const y = (i * 73) % canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 30 + (i % 3) * 10, 0, Math.PI * 2);
        ctx.fill();
    }

    // Title
    ctx.fillStyle = '#ffdd88';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MINISHOOT', canvas.width / 2, 180);

    ctx.fillStyle = '#88ddff';
    ctx.font = 'bold 36px Arial';
    ctx.fillText('ADVENTURES', canvas.width / 2, 230);

    // Player ship preview
    ctx.save();
    ctx.translate(canvas.width / 2, 350);
    renderShipShape(0, 0, 0, 2);
    ctx.restore();

    // Start prompt
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText('CLICK OR PRESS SPACE TO START', canvas.width / 2, 480);
    ctx.globalAlpha = 1;

    // Controls
    ctx.fillStyle = '#88aa88';
    ctx.font = '14px Arial';
    ctx.fillText('WASD - Move | Mouse - Aim | Click - Shoot | Q - Debug', canvas.width / 2, 550);
}

function renderWorld() {
    // Grass texture
    const startX = Math.floor((player.x - canvas.width) / TILE_SIZE) * TILE_SIZE;
    const endX = Math.ceil((player.x + canvas.width) / TILE_SIZE) * TILE_SIZE;
    const startY = Math.floor((player.y - canvas.height) / TILE_SIZE) * TILE_SIZE;
    const endY = Math.ceil((player.y + canvas.height) / TILE_SIZE) * TILE_SIZE;

    for (let x = startX; x < endX; x += TILE_SIZE) {
        for (let y = startY; y < endY; y += TILE_SIZE) {
            // Grass variation
            const variation = ((x / TILE_SIZE + y / TILE_SIZE) % 2);
            ctx.fillStyle = variation ? COLORS.forestGrass : COLORS.forestGrassDark;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            // Grass blades
            if (Math.random() < 0.3) {
                ctx.fillStyle = '#2a7a4a';
                ctx.fillRect(x + 8 + Math.random() * 16, y + 8 + Math.random() * 16, 2, 6);
            }
        }
    }

    // Walls
    walls.forEach(wall => {
        if (wall.type === 'rock') {
            // Rock formation
            ctx.fillStyle = COLORS.forestCliff;
            ctx.beginPath();
            ctx.moveTo(wall.x + TILE_SIZE / 2, wall.y);
            ctx.lineTo(wall.x + TILE_SIZE, wall.y + TILE_SIZE * 0.7);
            ctx.lineTo(wall.x + TILE_SIZE * 0.8, wall.y + TILE_SIZE);
            ctx.lineTo(wall.x + TILE_SIZE * 0.2, wall.y + TILE_SIZE);
            ctx.lineTo(wall.x, wall.y + TILE_SIZE * 0.6);
            ctx.closePath();
            ctx.fill();

            // Highlight
            ctx.fillStyle = '#8a7060';
            ctx.beginPath();
            ctx.moveTo(wall.x + TILE_SIZE / 2, wall.y);
            ctx.lineTo(wall.x + TILE_SIZE * 0.6, wall.y + TILE_SIZE * 0.3);
            ctx.lineTo(wall.x + TILE_SIZE * 0.3, wall.y + TILE_SIZE * 0.2);
            ctx.closePath();
            ctx.fill();
        } else {
            // Cliff edge
            ctx.fillStyle = COLORS.forestCliff;
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            ctx.fillStyle = '#5a4030';
            ctx.fillRect(wall.x, wall.y + wall.height - 4, wall.width, 4);
        }
    });

    // Path decorations
    ctx.fillStyle = COLORS.forestPath;
    ctx.fillRect(700, 500, 200, 300);
    ctx.fillRect(600, 700, 400, 100);
}

function renderPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Invincibility flash
    if (player.invincible > 0 && player.invincible % 6 < 3) {
        ctx.globalAlpha = 0.5;
    }

    renderShipShape(0, 0, player.angle, 1);

    ctx.restore();
}

function renderShipShape(x, y, angle, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Glow
    ctx.fillStyle = 'rgba(68, 238, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Body (cute spaceship shape)
    ctx.fillStyle = COLORS.playerBody;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-8, -10);
    ctx.lineTo(-8, 10);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = COLORS.playerAccent;
    ctx.beginPath();
    ctx.ellipse(2, 0, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(-5, -8);
    ctx.lineTo(-12, -12);
    ctx.lineTo(-8, -6);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-5, 8);
    ctx.lineTo(-12, 12);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();

    // Thruster glow
    ctx.fillStyle = '#ff8844';
    ctx.beginPath();
    ctx.ellipse(-10, 0, 4 + Math.random() * 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function renderEnemies() {
    enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);

        // Flash white when hit
        const color = e.flash > 0 ? '#ffffff' : e.color;

        // Body based on type
        if (e.behavior === 'turret') {
            // Turret - stationary cannon
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(0, 0, e.width / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#333';
            ctx.fillRect(-4, -e.width / 2 - 5, 8, 10);

            // Eye
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Flying enemy
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.ellipse(0, 0, e.width / 2, e.height / 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#ff4444';
            const angle = Math.atan2(player.y - e.y, player.x - e.x);
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * 5, Math.sin(angle) * 3 - 2, 3, 0, Math.PI * 2);
            ctx.arc(Math.cos(angle) * 5, Math.sin(angle) * 3 + 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });
}

function renderBullets() {
    // Player bullets (cyan)
    ctx.fillStyle = COLORS.playerAccent;
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.fillStyle = 'rgba(0, 200, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(b.x - b.vx * 0.02, b.y - b.vy * 0.02, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.playerAccent;
    });

    // Enemy bullets (orange)
    ctx.fillStyle = COLORS.enemyBullet;
    enemyBullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.fillStyle = 'rgba(255, 170, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.enemyBullet;
    });
}

function renderPickups() {
    pickups.forEach(p => {
        const bob = Math.sin(p.bob) * 3;

        ctx.save();
        ctx.translate(p.x, p.y + bob);

        if (p.type === 'crystal') {
            // Red crystal
            ctx.fillStyle = COLORS.crystalRed;
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(6, 0);
            ctx.lineTo(0, 8);
            ctx.lineTo(-6, 0);
            ctx.closePath();
            ctx.fill();

            // Shine
            ctx.fillStyle = '#ff8888';
            ctx.beginPath();
            ctx.moveTo(-2, -4);
            ctx.lineTo(0, -6);
            ctx.lineTo(2, -2);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
        } else if (p.type === 'heart') {
            // Heart shape
            ctx.fillStyle = COLORS.heartRed;
            ctx.beginPath();
            ctx.moveTo(0, 3);
            ctx.bezierCurveTo(-8, -3, -8, -8, 0, -8);
            ctx.bezierCurveTo(8, -8, 8, -3, 0, 3);
            ctx.fill();
        } else if (p.type === 'energy') {
            // Diamond/energy
            ctx.fillStyle = COLORS.energyCyan;
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(8, 0);
            ctx.lineTo(0, 10);
            ctx.lineTo(-8, 0);
            ctx.closePath();
            ctx.fill();

            // Shine
            ctx.fillStyle = '#88ffff';
            ctx.beginPath();
            ctx.moveTo(-3, -5);
            ctx.lineTo(0, -8);
            ctx.lineTo(3, -3);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    });
}

function renderParticles() {
    particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function renderHUD() {
    // Hearts (top-left)
    for (let i = 0; i < player.maxHealth; i++) {
        const x = 20 + i * 25;
        const y = 25;
        ctx.fillStyle = i < player.health ? COLORS.heartRed : COLORS.heartEmpty;

        // Heart shape
        ctx.beginPath();
        ctx.moveTo(x, y + 5);
        ctx.bezierCurveTo(x - 10, y - 5, x - 10, y - 10, x, y - 8);
        ctx.bezierCurveTo(x + 10, y - 10, x + 10, y - 5, x, y + 5);
        ctx.fill();
    }

    // Energy diamonds (below hearts)
    for (let i = 0; i < player.maxEnergy; i++) {
        const x = 20 + i * 20;
        const y = 55;
        ctx.fillStyle = i < player.energy ? COLORS.energyCyan : COLORS.energyEmpty;

        ctx.beginPath();
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x + 6, y);
        ctx.lineTo(x, y + 8);
        ctx.lineTo(x - 6, y);
        ctx.closePath();
        ctx.fill();
    }

    // Crystals (below energy)
    ctx.fillStyle = COLORS.crystalRed;
    ctx.beginPath();
    ctx.moveTo(25, 80);
    ctx.lineTo(31, 88);
    ctx.lineTo(25, 96);
    ctx.lineTo(19, 88);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(player.crystals.toString(), 40, 93);

    // Level/XP bar (top-right)
    ctx.fillStyle = '#333';
    ctx.fillRect(canvas.width - 150, 15, 130, 20);
    const xpPercent = player.xp / player.xpToLevel;
    ctx.fillStyle = COLORS.uiGold;
    ctx.fillRect(canvas.width - 148, 17, 126 * xpPercent, 16);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`LV ${player.level}`, canvas.width - 20, 50);

    // Enemy count
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px Arial';
    ctx.fillText(`Enemies: ${enemies.length}`, canvas.width - 20, 70);
}

function renderDebug() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(canvas.width - 200, 90, 190, 150);

    ctx.fillStyle = '#00ff88';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const info = [
        `DEBUG MODE (Q)`,
        `---`,
        `Player X: ${Math.round(player.x)}`,
        `Player Y: ${Math.round(player.y)}`,
        `Health: ${player.health}/${player.maxHealth}`,
        `Crystals: ${player.crystals}`,
        `Level: ${player.level}`,
        `XP: ${player.xp}/${player.xpToLevel}`,
        `Enemies: ${enemies.length}`,
        `Bullets: ${bullets.length}`
    ];

    info.forEach((line, i) => {
        ctx.fillText(line, canvas.width - 190, 105 + i * 14);
    });
}

function renderPaused() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);

    ctx.font = '20px Arial';
    ctx.fillText('Press P to resume', canvas.width / 2, canvas.height / 2 + 50);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`Level: ${player.level} | Crystals: ${player.crystals}`, canvas.width / 2, canvas.height / 2 + 20);

    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 70);
}

// ==================== GAME LOOP ====================
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
