// Pirateers - Top-Down Naval Combat
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;
const DAY_DURATION = 120; // seconds
const TILE_SIZE = 32;

// Game state
let gameState = 'menu'; // menu, sailing, port, gameover, victory
let dayTimer = DAY_DURATION;
let dayNumber = 1;
let gold = 100;
let debugOverlay = false;
let camera = { x: 0, y: 0, zoom: 1.5 };

// Cargo items
const CARGO_TYPES = {
    rum: { name: 'Rum', value: 15, rarity: 'common', color: '#8B4513' },
    grain: { name: 'Grain', value: 12, rarity: 'common', color: '#DAA520' },
    fish: { name: 'Fish', value: 10, rarity: 'common', color: '#87CEEB' },
    wood: { name: 'Wood', value: 8, rarity: 'common', color: '#8B4513' },
    spices: { name: 'Spices', value: 35, rarity: 'uncommon', color: '#FF6347' },
    silk: { name: 'Silk', value: 45, rarity: 'uncommon', color: '#DDA0DD' },
    sugar: { name: 'Sugar', value: 30, rarity: 'uncommon', color: '#FFFAFA' },
    cotton: { name: 'Cotton', value: 25, rarity: 'uncommon', color: '#F5F5DC' },
    goldBars: { name: 'Gold Bars', value: 80, rarity: 'rare', color: '#FFD700' },
    gems: { name: 'Gems', value: 120, rarity: 'rare', color: '#00CED1' },
    artifacts: { name: 'Artifacts', value: 150, rarity: 'rare', color: '#9400D3' }
};

// Enemy types
const ENEMY_TYPES = {
    merchant: {
        name: 'Merchant Ship',
        hp: 50, speed: 60, damage: 5, fireRate: 3,
        goldDrop: [20, 40], cargoDrop: [2, 4],
        cargoPool: ['rum', 'grain', 'fish', 'wood', 'spices', 'silk'],
        color: '#8B4513', size: 30, aggressive: false
    },
    navySloop: {
        name: 'Navy Sloop',
        hp: 80, speed: 100, damage: 12, fireRate: 2,
        goldDrop: [30, 50], cargoDrop: [1, 2],
        cargoPool: ['wood', 'cotton', 'sugar'],
        color: '#4169E1', size: 35, aggressive: true
    },
    pirateRaider: {
        name: 'Pirate Raider',
        hp: 100, speed: 120, damage: 15, fireRate: 1.8,
        goldDrop: [40, 70], cargoDrop: [2, 3],
        cargoPool: ['rum', 'spices', 'silk', 'goldBars'],
        color: '#2F4F4F', size: 35, aggressive: true
    },
    pirateCaptain: {
        name: 'Pirate Captain',
        hp: 250, speed: 90, damage: 25, fireRate: 1.5,
        goldDrop: [100, 150], cargoDrop: [4, 6],
        cargoPool: ['goldBars', 'gems', 'artifacts', 'silk', 'spices'],
        color: '#8B0000', size: 45, aggressive: true, boss: true
    }
};

// Player ship
let player = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    angle: -Math.PI / 2,
    velocity: 0,
    targetVelocity: 0,
    hp: 100,
    maxHp: 100,
    stats: {
        armor: 1,      // Level 1-10
        speed: 1,      // Level 1-10
        reload: 1,     // Level 1-10
        firepower: 1   // Level 1-10
    },
    cargo: [],
    cargoCapacity: 15,
    reloadTimer: 0
};

// Game arrays
let enemies = [];
let cannonballs = [];
let drops = [];
let particles = [];
let islands = [];
let ports = [];
let fogOfWar = [];

// Input
let keys = {};
let mouse = { x: 0, y: 0, down: false };

// Initialize fog of war
function initFogOfWar() {
    const fogWidth = Math.ceil(WORLD_WIDTH / TILE_SIZE);
    const fogHeight = Math.ceil(WORLD_HEIGHT / TILE_SIZE);
    fogOfWar = [];
    for (let y = 0; y < fogHeight; y++) {
        fogOfWar[y] = [];
        for (let x = 0; x < fogWidth; x++) {
            fogOfWar[y][x] = false;
        }
    }
}

// Initialize islands and ports
function initWorld() {
    islands = [];
    ports = [];

    // Create islands with ports
    const islandData = [
        { x: WORLD_WIDTH * 0.2, y: WORLD_HEIGHT * 0.2, size: 120, hasPort: true, portName: 'Tortuga' },
        { x: WORLD_WIDTH * 0.8, y: WORLD_HEIGHT * 0.2, size: 100, hasPort: true, portName: 'Port Royal' },
        { x: WORLD_WIDTH * 0.15, y: WORLD_HEIGHT * 0.7, size: 90, hasPort: true, portName: 'Nassau' },
        { x: WORLD_WIDTH * 0.75, y: WORLD_HEIGHT * 0.75, size: 110, hasPort: true, portName: 'Havana' },
        { x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.3, size: 70, hasPort: false },
        { x: WORLD_WIDTH * 0.35, y: WORLD_HEIGHT * 0.55, size: 80, hasPort: false },
        { x: WORLD_WIDTH * 0.65, y: WORLD_HEIGHT * 0.5, size: 60, hasPort: false },
        { x: WORLD_WIDTH * 0.4, y: WORLD_HEIGHT * 0.85, size: 75, hasPort: true, portName: 'Kingston' }
    ];

    islandData.forEach(data => {
        islands.push({
            x: data.x,
            y: data.y,
            size: data.size,
            hasPort: data.hasPort,
            portName: data.portName || null
        });

        if (data.hasPort) {
            ports.push({
                x: data.x,
                y: data.y + data.size * 0.6,
                name: data.portName,
                prices: generatePortPrices()
            });
        }
    });
}

function generatePortPrices() {
    const prices = {};
    Object.keys(CARGO_TYPES).forEach(type => {
        const baseValue = CARGO_TYPES[type].value;
        // Random price variation between 70% and 130%
        prices[type] = {
            buy: Math.floor(baseValue * (0.9 + Math.random() * 0.4)),
            sell: Math.floor(baseValue * (0.7 + Math.random() * 0.4))
        };
    });
    return prices;
}

// Spawn enemies
function spawnEnemies() {
    enemies = [];

    // Spawn merchants (most common)
    for (let i = 0; i < 8; i++) {
        spawnEnemy('merchant');
    }

    // Spawn navy ships
    for (let i = 0; i < 4; i++) {
        spawnEnemy('navySloop');
    }

    // Spawn pirates
    for (let i = 0; i < 3; i++) {
        spawnEnemy('pirateRaider');
    }

    // Spawn one pirate captain (boss)
    spawnEnemy('pirateCaptain');
}

function spawnEnemy(type) {
    const data = ENEMY_TYPES[type];
    let x, y;

    // Find valid spawn position (not too close to player or islands)
    do {
        x = 200 + Math.random() * (WORLD_WIDTH - 400);
        y = 200 + Math.random() * (WORLD_HEIGHT - 400);
    } while (distTo(x, y, player.x, player.y) < 500 || isOnIsland(x, y));

    enemies.push({
        x, y,
        type,
        angle: Math.random() * Math.PI * 2,
        velocity: data.speed * 0.5,
        hp: data.hp,
        maxHp: data.hp,
        reloadTimer: 0,
        aiState: 'patrol',
        patrolTarget: { x: x + (Math.random() - 0.5) * 400, y: y + (Math.random() - 0.5) * 400 }
    });
}

function isOnIsland(x, y) {
    for (const island of islands) {
        if (distTo(x, y, island.x, island.y) < island.size + 50) {
            return true;
        }
    }
    return false;
}

// Get player stats with upgrades
function getPlayerMaxSpeed() {
    return 150 + player.stats.speed * 20;
}

function getPlayerReloadTime() {
    return 2.0 - player.stats.reload * 0.12;
}

function getPlayerDamage() {
    return 10 + player.stats.firepower * 5;
}

function getPlayerMaxHp() {
    return 100 + player.stats.armor * 50;
}

// Update player
function updatePlayer(dt) {
    if (gameState !== 'sailing') return;

    // Turning
    const turnSpeed = 2.5;
    if (keys['a'] || keys['arrowleft']) {
        player.angle -= turnSpeed * dt;
    }
    if (keys['d'] || keys['arrowright']) {
        player.angle += turnSpeed * dt;
    }

    // Speed control
    const maxSpeed = getPlayerMaxSpeed();
    const accel = 200; // Quick acceleration
    const decel = 300; // Quick deceleration

    if (keys['w'] || keys['arrowup']) {
        player.targetVelocity = maxSpeed;
    } else if (keys['s'] || keys['arrowdown']) {
        player.targetVelocity = -maxSpeed * 0.3;
    } else {
        player.targetVelocity = 0;
    }

    // Apply acceleration/deceleration
    if (player.velocity < player.targetVelocity) {
        player.velocity = Math.min(player.velocity + accel * dt, player.targetVelocity);
    } else if (player.velocity > player.targetVelocity) {
        player.velocity = Math.max(player.velocity - decel * dt, player.targetVelocity);
    }

    // Movement
    const newX = player.x + Math.cos(player.angle) * player.velocity * dt;
    const newY = player.y + Math.sin(player.angle) * player.velocity * dt;

    // Collision with islands
    let canMove = true;
    for (const island of islands) {
        if (distTo(newX, newY, island.x, island.y) < island.size + 20) {
            canMove = false;
            player.velocity *= 0.5;
            break;
        }
    }

    if (canMove) {
        player.x = Math.max(50, Math.min(WORLD_WIDTH - 50, newX));
        player.y = Math.max(50, Math.min(WORLD_HEIGHT - 50, newY));
    }

    // Reload timer
    if (player.reloadTimer > 0) {
        player.reloadTimer -= dt;
    }

    // Firing cannons
    if ((keys[' '] || mouse.down) && player.reloadTimer <= 0) {
        fireCannons(player);
        player.reloadTimer = getPlayerReloadTime();
    }

    // Reveal fog of war
    revealFog(player.x, player.y, 200);

    // Check for port interaction
    checkPortInteraction();

    // Collect drops
    collectDrops();
}

function fireCannons(ship, isEnemy = false) {
    const damage = isEnemy ? ENEMY_TYPES[ship.type].damage : getPlayerDamage();
    const speed = 400;
    const numBalls = 3 + Math.floor((isEnemy ? 0 : player.stats.firepower) / 3);
    const spreadAngle = Math.PI / 6;

    // Fire from both sides (port and starboard)
    [-1, 1].forEach(side => {
        const baseAngle = ship.angle + (Math.PI / 2 * side);

        for (let i = 0; i < numBalls; i++) {
            const angleOffset = (i - (numBalls - 1) / 2) * (spreadAngle / numBalls);
            const angle = baseAngle + angleOffset;

            cannonballs.push({
                x: ship.x + Math.cos(baseAngle) * 20,
                y: ship.y + Math.sin(baseAngle) * 20,
                vx: Math.cos(angle) * speed + (isEnemy ? 0 : Math.cos(ship.angle) * Math.abs(player.velocity) * 0.3),
                vy: Math.sin(angle) * speed + (isEnemy ? 0 : Math.sin(ship.angle) * Math.abs(player.velocity) * 0.3),
                damage,
                isEnemy,
                lifetime: 1.5
            });
        }
    });

    // Muzzle flash particles
    for (let i = 0; i < 6; i++) {
        particles.push({
            x: ship.x,
            y: ship.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 0.3,
            color: '#FFA500',
            size: 5
        });
    }
}

function checkPortInteraction() {
    for (const port of ports) {
        const dist = distTo(player.x, player.y, port.x, port.y);
        port.playerNearby = dist < 80;

        if (port.playerNearby && keys['e'] && Math.abs(player.velocity) < 30) {
            enterPort(port);
        }
    }
}

let currentPort = null;
let portMenuSelection = 0;
let tradeMenuOpen = false;
let tradeSelection = 0;

function enterPort(port) {
    gameState = 'port';
    currentPort = port;
    portMenuSelection = 0;
    tradeMenuOpen = false;
    player.velocity = 0;

    // Repair ship for free
    player.hp = getPlayerMaxHp();
}

function updateEnemy(enemy, dt) {
    const data = ENEMY_TYPES[enemy.type];

    // Reload timer
    if (enemy.reloadTimer > 0) {
        enemy.reloadTimer -= dt;
    }

    const distToPlayer = distTo(enemy.x, enemy.y, player.x, player.y);

    // AI behavior
    if (data.aggressive && distToPlayer < 400) {
        // Chase and attack player
        enemy.aiState = 'attack';
        const targetAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x);

        // Turn towards player
        let angleDiff = targetAngle - enemy.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        enemy.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 1.5 * dt);

        // Approach to broadside distance
        if (distToPlayer > 150) {
            enemy.velocity = data.speed;
        } else {
            enemy.velocity = data.speed * 0.3;
            // Fire when in range
            if (enemy.reloadTimer <= 0) {
                fireCannons(enemy, true);
                enemy.reloadTimer = data.fireRate;
            }
        }
    } else {
        // Patrol
        enemy.aiState = 'patrol';
        const distToTarget = distTo(enemy.x, enemy.y, enemy.patrolTarget.x, enemy.patrolTarget.y);

        if (distToTarget < 50 || isOnIsland(enemy.patrolTarget.x, enemy.patrolTarget.y)) {
            // Pick new patrol target
            enemy.patrolTarget = {
                x: enemy.x + (Math.random() - 0.5) * 600,
                y: enemy.y + (Math.random() - 0.5) * 600
            };
            enemy.patrolTarget.x = Math.max(100, Math.min(WORLD_WIDTH - 100, enemy.patrolTarget.x));
            enemy.patrolTarget.y = Math.max(100, Math.min(WORLD_HEIGHT - 100, enemy.patrolTarget.y));
        }

        const targetAngle = Math.atan2(enemy.patrolTarget.y - enemy.y, enemy.patrolTarget.x - enemy.x);
        let angleDiff = targetAngle - enemy.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        enemy.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 1.0 * dt);
        enemy.velocity = data.speed * 0.5;
    }

    // Movement
    const newX = enemy.x + Math.cos(enemy.angle) * enemy.velocity * dt;
    const newY = enemy.y + Math.sin(enemy.angle) * enemy.velocity * dt;

    // Collision with islands
    let canMove = true;
    for (const island of islands) {
        if (distTo(newX, newY, island.x, island.y) < island.size + 30) {
            canMove = false;
            enemy.velocity *= 0.3;
            enemy.patrolTarget = {
                x: enemy.x + (Math.random() - 0.5) * 400,
                y: enemy.y + (Math.random() - 0.5) * 400
            };
            break;
        }
    }

    if (canMove) {
        enemy.x = Math.max(50, Math.min(WORLD_WIDTH - 50, newX));
        enemy.y = Math.max(50, Math.min(WORLD_HEIGHT - 50, newY));
    }
}

function updateCannonballs(dt) {
    for (let i = cannonballs.length - 1; i >= 0; i--) {
        const ball = cannonballs[i];
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        ball.lifetime -= dt;

        // Check collisions
        if (ball.isEnemy) {
            // Hit player
            if (distTo(ball.x, ball.y, player.x, player.y) < 25) {
                player.hp -= ball.damage;
                spawnHitParticles(ball.x, ball.y);
                cannonballs.splice(i, 1);

                if (player.hp <= 0) {
                    endDay(true);
                }
                continue;
            }
        } else {
            // Hit enemies
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                const data = ENEMY_TYPES[enemy.type];

                if (distTo(ball.x, ball.y, enemy.x, enemy.y) < data.size) {
                    enemy.hp -= ball.damage;
                    spawnHitParticles(ball.x, ball.y);
                    cannonballs.splice(i, 1);

                    if (enemy.hp <= 0) {
                        destroyEnemy(enemy, j);
                    }
                    break;
                }
            }
        }

        // Check island collisions
        for (const island of islands) {
            if (distTo(ball.x, ball.y, island.x, island.y) < island.size) {
                spawnHitParticles(ball.x, ball.y);
                cannonballs.splice(i, 1);
                break;
            }
        }

        // Remove expired
        if (ball.lifetime <= 0) {
            cannonballs.splice(i, 1);
        }
    }
}

function destroyEnemy(enemy, index) {
    const data = ENEMY_TYPES[enemy.type];

    // Drop gold
    const goldAmount = data.goldDrop[0] + Math.floor(Math.random() * (data.goldDrop[1] - data.goldDrop[0]));
    gold += goldAmount;

    // Drop cargo
    const numDrops = data.cargoDrop[0] + Math.floor(Math.random() * (data.cargoDrop[1] - data.cargoDrop[0]));
    for (let i = 0; i < numDrops; i++) {
        const cargoType = data.cargoPool[Math.floor(Math.random() * data.cargoPool.length)];
        drops.push({
            x: enemy.x + (Math.random() - 0.5) * 40,
            y: enemy.y + (Math.random() - 0.5) * 40,
            type: cargoType,
            lifetime: 30,
            bobOffset: Math.random() * Math.PI * 2
        });
    }

    // Death particles
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: enemy.x,
            y: enemy.y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 1 + Math.random(),
            color: Math.random() > 0.5 ? '#8B4513' : '#FFA500',
            size: 4 + Math.random() * 6
        });
    }

    // Show gold popup
    particles.push({
        x: enemy.x,
        y: enemy.y - 30,
        vx: 0,
        vy: -30,
        life: 2,
        text: `+${goldAmount}g`,
        color: '#FFD700',
        size: 14
    });

    // Check for boss kill
    if (data.boss) {
        gameState = 'victory';
    }

    enemies.splice(index, 1);

    // Respawn non-boss enemies
    if (!data.boss) {
        setTimeout(() => {
            if (gameState === 'sailing') {
                spawnEnemy(enemy.type);
            }
        }, 10000);
    }
}

function collectDrops() {
    for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i];

        if (distTo(player.x, player.y, drop.x, drop.y) < 40) {
            if (player.cargo.length < player.cargoCapacity) {
                player.cargo.push(drop.type);
                particles.push({
                    x: drop.x,
                    y: drop.y - 20,
                    vx: 0,
                    vy: -20,
                    life: 1.5,
                    text: `+${CARGO_TYPES[drop.type].name}`,
                    color: CARGO_TYPES[drop.type].color,
                    size: 12
                });
                drops.splice(i, 1);
            }
        } else {
            drop.lifetime -= 1/60;
            if (drop.lifetime <= 0) {
                drops.splice(i, 1);
            }
        }
    }
}

function spawnHitParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 150,
            vy: (Math.random() - 0.5) * 150,
            life: 0.5,
            color: Math.random() > 0.5 ? '#8B4513' : '#FFD700',
            size: 3 + Math.random() * 4
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += (p.vx || 0) * dt;
        p.y += (p.vy || 0) * dt;
        p.life -= dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function revealFog(x, y, radius) {
    const startX = Math.max(0, Math.floor((x - radius) / TILE_SIZE));
    const endX = Math.min(fogOfWar[0].length - 1, Math.ceil((x + radius) / TILE_SIZE));
    const startY = Math.max(0, Math.floor((y - radius) / TILE_SIZE));
    const endY = Math.min(fogOfWar.length - 1, Math.ceil((y + radius) / TILE_SIZE));

    for (let ty = startY; ty <= endY; ty++) {
        for (let tx = startX; tx <= endX; tx++) {
            const tileX = tx * TILE_SIZE + TILE_SIZE / 2;
            const tileY = ty * TILE_SIZE + TILE_SIZE / 2;
            if (distTo(x, y, tileX, tileY) < radius) {
                fogOfWar[ty][tx] = true;
            }
        }
    }
}

function endDay(shipDestroyed = false) {
    if (shipDestroyed) {
        // Lose 25% of cargo
        const toRemove = Math.ceil(player.cargo.length * 0.25);
        for (let i = 0; i < toRemove; i++) {
            if (player.cargo.length > 0) {
                player.cargo.splice(Math.floor(Math.random() * player.cargo.length), 1);
            }
        }
    }

    // Return to base (center)
    player.x = WORLD_WIDTH / 2;
    player.y = WORLD_HEIGHT / 2;
    player.hp = getPlayerMaxHp();
    player.velocity = 0;
    dayNumber++;
    dayTimer = DAY_DURATION;
}

// Drawing functions
function draw() {
    ctx.fillStyle = '#1a3a5c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'menu') {
        drawMenu();
    } else if (gameState === 'sailing') {
        drawSailing();
    } else if (gameState === 'port') {
        drawPort();
    } else if (gameState === 'gameover') {
        drawGameOver();
    } else if (gameState === 'victory') {
        drawVictory();
    }

    if (debugOverlay && gameState === 'sailing') {
        drawDebug();
    }
}

function drawMenu() {
    ctx.fillStyle = '#0a2a4a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 60px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('PIRATEERS', canvas.width / 2, 180);

    ctx.fillStyle = '#aaa';
    ctx.font = '24px Georgia';
    ctx.fillText('Top-Down Naval Combat', canvas.width / 2, 220);

    // Controls
    ctx.fillStyle = '#ddd';
    ctx.font = '18px monospace';
    const controls = [
        'A/D - Turn Ship',
        'W/S - Speed Control',
        'SPACE - Fire Cannons',
        'E - Dock at Port (when nearby)',
        'Q - Debug overlay',
        '',
        'Defeat the Pirate Captain to win!'
    ];
    controls.forEach((text, i) => {
        ctx.fillText(text, canvas.width / 2, 300 + i * 30);
    });

    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 24px Georgia';
    ctx.fillText('Press SPACE to Start', canvas.width / 2, 540);
}

function drawSailing() {
    ctx.save();

    // Camera follows player
    camera.x = player.x - canvas.width / 2 / camera.zoom;
    camera.y = player.y - canvas.height / 2 / camera.zoom;

    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Draw water
    drawWater();

    // Draw islands
    drawIslands();

    // Draw ports
    drawPorts();

    // Draw drops
    drawDrops();

    // Draw enemies
    enemies.forEach(enemy => drawShip(enemy, true));

    // Draw cannonballs
    drawCannonballs();

    // Draw player
    drawShip(player, false);

    // Draw particles
    drawParticles();

    // Draw fog of war
    drawFogOfWar();

    ctx.restore();

    // Draw HUD (not affected by camera)
    drawHUD();

    // Draw minimap
    drawMinimap();
}

function drawWater() {
    // Water gradient
    const gradient = ctx.createRadialGradient(
        player.x, player.y, 0,
        player.x, player.y, 500
    );
    gradient.addColorStop(0, '#1a4a6e');
    gradient.addColorStop(1, '#0a2a4a');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Wave pattern
    const time = Date.now() / 1000;
    ctx.strokeStyle = 'rgba(100, 150, 200, 0.1)';
    ctx.lineWidth = 1;

    for (let y = 0; y < WORLD_HEIGHT; y += 40) {
        ctx.beginPath();
        for (let x = 0; x < WORLD_WIDTH; x += 10) {
            const waveY = y + Math.sin(x / 50 + time) * 5;
            if (x === 0) {
                ctx.moveTo(x, waveY);
            } else {
                ctx.lineTo(x, waveY);
            }
        }
        ctx.stroke();
    }
}

function drawIslands() {
    islands.forEach(island => {
        // Sand/ground
        const gradient = ctx.createRadialGradient(
            island.x, island.y, 0,
            island.x, island.y, island.size
        );
        gradient.addColorStop(0, '#3a7d44');
        gradient.addColorStop(0.6, '#2d5a2d');
        gradient.addColorStop(0.8, '#c2b280');
        gradient.addColorStop(1, '#a08c50');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(island.x, island.y, island.size, 0, Math.PI * 2);
        ctx.fill();

        // Trees
        ctx.fillStyle = '#1a4a1a';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const dist = island.size * 0.5;
            const tx = island.x + Math.cos(angle) * dist;
            const ty = island.y + Math.sin(angle) * dist;

            ctx.beginPath();
            ctx.arc(tx, ty, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawPorts() {
    ports.forEach(port => {
        // Dock
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(port.x - 30, port.y - 10, 60, 20);

        // Port name
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(port.name, port.x, port.y - 20);

        // Interaction prompt
        if (port.playerNearby) {
            ctx.fillStyle = '#0f0';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('Press E to Dock', port.x, port.y + 40);
        }
    });
}

function drawDrops() {
    const time = Date.now() / 1000;

    drops.forEach(drop => {
        const bob = Math.sin(time * 2 + drop.bobOffset) * 3;
        const data = CARGO_TYPES[drop.type];

        // Crate
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(drop.x - 8, drop.y - 8 + bob, 16, 16);

        // Color indicator
        ctx.fillStyle = data.color;
        ctx.fillRect(drop.x - 5, drop.y - 5 + bob, 10, 10);

        // Sparkle
        ctx.fillStyle = 'rgba(255, 255, 200, ' + (0.5 + Math.sin(time * 5 + drop.bobOffset) * 0.5) + ')';
        ctx.beginPath();
        ctx.arc(drop.x, drop.y - 12 + bob, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawShip(ship, isEnemy) {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    const data = isEnemy ? ENEMY_TYPES[ship.type] : null;
    const size = isEnemy ? data.size : 30;
    const color = isEnemy ? data.color : '#8B4513';

    // Hull
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, -size * 0.4);
    ctx.lineTo(-size * 0.7, size * 0.4);
    ctx.closePath();
    ctx.fill();

    // Deck
    ctx.fillStyle = isEnemy ? (data.boss ? '#4a0000' : '#333') : '#654321';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.5, size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sails
    ctx.fillStyle = isEnemy ? (data.boss ? '#300' : '#ddd') : '#f5f5dc';
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, 0);
    ctx.lineTo(size * 0.3, -size * 0.5);
    ctx.lineTo(size * 0.3, size * 0.5);
    ctx.closePath();
    ctx.fill();

    // Cannon ports
    ctx.fillStyle = '#222';
    [-1, 1].forEach(side => {
        for (let i = 0; i < 3; i++) {
            const cx = -size * 0.3 + i * size * 0.25;
            const cy = side * size * 0.35;
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Boss crown
    if (isEnemy && data.boss) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(-5, -size * 0.6);
        ctx.lineTo(-10, -size * 0.4);
        ctx.lineTo(10, -size * 0.4);
        ctx.lineTo(5, -size * 0.6);
        ctx.lineTo(0, -size * 0.5);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();

    // Health bar for enemies
    if (isEnemy) {
        const barWidth = size * 1.5;
        const barHeight = 6;
        const hpPercent = ship.hp / ship.maxHp;

        ctx.fillStyle = '#300';
        ctx.fillRect(ship.x - barWidth / 2, ship.y - size - 15, barWidth, barHeight);
        ctx.fillStyle = hpPercent > 0.5 ? '#0a0' : (hpPercent > 0.25 ? '#aa0' : '#a00');
        ctx.fillRect(ship.x - barWidth / 2, ship.y - size - 15, barWidth * hpPercent, barHeight);

        // Name
        ctx.fillStyle = data.boss ? '#ff0' : '#fff';
        ctx.font = (data.boss ? 'bold ' : '') + '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(data.name, ship.x, ship.y - size - 20);
    }
}

function drawCannonballs() {
    cannonballs.forEach(ball => {
        ctx.fillStyle = ball.isEnemy ? '#ff4444' : '#222';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.fillStyle = ball.isEnemy ? 'rgba(255, 100, 100, 0.5)' : 'rgba(100, 100, 100, 0.5)';
        ctx.beginPath();
        ctx.arc(ball.x - ball.vx * 0.02, ball.y - ball.vy * 0.02, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawParticles() {
    particles.forEach(p => {
        if (p.text) {
            ctx.fillStyle = p.color;
            ctx.font = `bold ${p.size}px monospace`;
            ctx.textAlign = 'center';
            ctx.globalAlpha = Math.min(1, p.life);
            ctx.fillText(p.text, p.x, p.y);
            ctx.globalAlpha = 1;
        } else {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.min(1, p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * Math.min(1, p.life), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    });
}

function drawFogOfWar() {
    const viewLeft = camera.x - 100;
    const viewRight = camera.x + canvas.width / camera.zoom + 100;
    const viewTop = camera.y - 100;
    const viewBottom = camera.y + canvas.height / camera.zoom + 100;

    ctx.fillStyle = 'rgba(0, 10, 30, 0.9)';

    for (let ty = 0; ty < fogOfWar.length; ty++) {
        for (let tx = 0; tx < fogOfWar[ty].length; tx++) {
            const x = tx * TILE_SIZE;
            const y = ty * TILE_SIZE;

            // Only draw fog tiles in view
            if (x < viewLeft - TILE_SIZE || x > viewRight || y < viewTop - TILE_SIZE || y > viewBottom) {
                continue;
            }

            if (!fogOfWar[ty][tx]) {
                ctx.fillRect(x, y, TILE_SIZE + 1, TILE_SIZE + 1);
            }
        }
    }
}

function drawHUD() {
    // Top bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, 60);

    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 10, 200, 20);
    const hpPercent = player.hp / getPlayerMaxHp();
    ctx.fillStyle = hpPercent > 0.5 ? '#0a0' : (hpPercent > 0.25 ? '#aa0' : '#a00');
    ctx.fillRect(10, 10, 200 * hpPercent, 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 200, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${Math.ceil(player.hp)}/${getPlayerMaxHp()}`, 110, 25);

    // Speed indicator
    const speedPercent = Math.abs(player.velocity) / getPlayerMaxSpeed();
    let speedLabel = 'STOP';
    if (speedPercent > 0.75) speedLabel = 'FULL';
    else if (speedPercent > 0.4) speedLabel = 'HALF';
    else if (speedPercent > 0.1) speedLabel = 'SLOW';

    ctx.fillStyle = '#333';
    ctx.fillRect(10, 35, 120, 15);
    ctx.fillStyle = '#4af';
    ctx.fillRect(10, 35, 120 * speedPercent, 15);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(speedLabel, 70, 47);

    // Gold
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Gold: ${gold}`, 250, 28);

    // Cargo
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(`Cargo: ${player.cargo.length}/${player.cargoCapacity}`, 250, 48);

    // Day and timer
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`Day ${dayNumber}`, canvas.width - 10, 25);

    const minutes = Math.floor(dayTimer / 60);
    const seconds = Math.floor(dayTimer % 60);
    ctx.fillStyle = dayTimer < 30 ? '#f44' : '#fff';
    ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, canvas.width - 10, 45);

    // Bottom bar - cargo preview
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Cargo:', 10, canvas.height - 30);

    // Show cargo items
    const cargoCounts = {};
    player.cargo.forEach(item => {
        cargoCounts[item] = (cargoCounts[item] || 0) + 1;
    });

    let cargoX = 70;
    Object.entries(cargoCounts).forEach(([type, count]) => {
        const data = CARGO_TYPES[type];
        ctx.fillStyle = data.color;
        ctx.fillRect(cargoX, canvas.height - 40, 20, 20);
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText(`x${count}`, cargoX + 22, canvas.height - 25);
        cargoX += 50;
    });

    // Weapon info
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText('Cannons Ready', canvas.width - 10, canvas.height - 30);

    if (player.reloadTimer > 0) {
        ctx.fillStyle = '#f44';
        ctx.fillText(`Reloading: ${player.reloadTimer.toFixed(1)}s`, canvas.width - 10, canvas.height - 12);
    } else {
        ctx.fillStyle = '#0f0';
        ctx.fillText('FIRE!', canvas.width - 10, canvas.height - 12);
    }
}

function drawMinimap() {
    const mapSize = 150;
    const mapX = canvas.width - mapSize - 10;
    const mapY = 70;

    // Background
    ctx.fillStyle = 'rgba(0, 30, 60, 0.8)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    ctx.strokeStyle = '#4af';
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    const scale = mapSize / WORLD_WIDTH;

    // Islands
    islands.forEach(island => {
        ctx.fillStyle = '#3a7d44';
        ctx.beginPath();
        ctx.arc(mapX + island.x * scale, mapY + island.y * scale, island.size * scale, 0, Math.PI * 2);
        ctx.fill();
    });

    // Ports
    ports.forEach(port => {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(mapX + port.x * scale - 2, mapY + port.y * scale - 2, 4, 4);
    });

    // Enemies (only in revealed areas)
    enemies.forEach(enemy => {
        const tx = Math.floor(enemy.x / TILE_SIZE);
        const ty = Math.floor(enemy.y / TILE_SIZE);
        if (fogOfWar[ty] && fogOfWar[ty][tx]) {
            const data = ENEMY_TYPES[enemy.type];
            ctx.fillStyle = data.boss ? '#f00' : '#f44';
            ctx.beginPath();
            ctx.arc(mapX + enemy.x * scale, mapY + enemy.y * scale, data.boss ? 4 : 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Player
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(mapX + player.x * scale, mapY + player.y * scale, 4, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MINIMAP', mapX + mapSize / 2, mapY - 5);
}

function drawPort() {
    // Draw sailing scene in background (dimmed)
    drawSailing();

    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Port menu
    const menuWidth = 500;
    const menuHeight = 400;
    const menuX = (canvas.width - menuWidth) / 2;
    const menuY = (canvas.height - menuHeight) / 2;

    // Background
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

    // Title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 28px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(currentPort.name, canvas.width / 2, menuY + 40);

    if (!tradeMenuOpen) {
        // Main menu options
        const options = ['Trade Goods', 'Upgrade Ship', 'Set Sail'];

        options.forEach((opt, i) => {
            const y = menuY + 100 + i * 60;
            const selected = i === portMenuSelection;

            ctx.fillStyle = selected ? '#4a3a2a' : '#3a2a1a';
            ctx.fillRect(menuX + 50, y, menuWidth - 100, 45);

            ctx.fillStyle = selected ? '#FFD700' : '#ddd';
            ctx.font = '20px Georgia';
            ctx.fillText(opt, canvas.width / 2, y + 30);
        });

        // Stats
        ctx.fillStyle = '#aaa';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Gold: ${gold}`, menuX + 50, menuY + 320);
        ctx.fillText(`Cargo: ${player.cargo.length}/${player.cargoCapacity}`, menuX + 50, menuY + 340);
        ctx.fillText(`Ship HP: ${Math.ceil(player.hp)}/${getPlayerMaxHp()} (Repaired!)`, menuX + 50, menuY + 360);

        ctx.fillStyle = '#888';
        ctx.textAlign = 'center';
        ctx.fillText('W/S to select, SPACE to confirm', canvas.width / 2, menuY + menuHeight - 15);
    } else {
        drawTradeMenu(menuX, menuY, menuWidth, menuHeight);
    }
}

function drawTradeMenu(menuX, menuY, menuWidth, menuHeight) {
    ctx.fillStyle = '#ddd';
    ctx.font = '18px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('Trade Goods', canvas.width / 2, menuY + 70);

    // Your cargo
    ctx.fillStyle = '#aaa';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Your Cargo (sell):', menuX + 30, menuY + 100);

    const cargoCounts = {};
    player.cargo.forEach(item => {
        cargoCounts[item] = (cargoCounts[item] || 0) + 1;
    });

    let y = menuY + 120;
    const cargoKeys = Object.keys(cargoCounts);

    cargoKeys.forEach((type, i) => {
        const data = CARGO_TYPES[type];
        const price = currentPort.prices[type].sell;
        const selected = i === tradeSelection;

        if (selected) {
            ctx.fillStyle = '#4a3a2a';
            ctx.fillRect(menuX + 20, y - 12, menuWidth - 40, 20);
        }

        ctx.fillStyle = data.color;
        ctx.fillRect(menuX + 30, y - 10, 15, 15);

        ctx.fillStyle = selected ? '#FFD700' : '#ddd';
        ctx.fillText(`${data.name} x${cargoCounts[type]} - Sell: ${price}g each`, menuX + 55, y);
        y += 25;
    });

    if (cargoKeys.length === 0) {
        ctx.fillStyle = '#888';
        ctx.fillText('No cargo to sell', menuX + 30, y);
    }

    // Total value
    let totalValue = 0;
    Object.entries(cargoCounts).forEach(([type, count]) => {
        totalValue += currentPort.prices[type].sell * count;
    });

    ctx.fillStyle = '#FFD700';
    ctx.fillText(`Total cargo value: ${totalValue}g`, menuX + 30, menuY + 320);

    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('W/S select, SPACE sell one, A sell all, ESC back', canvas.width / 2, menuY + menuHeight - 15);
}

function drawDebug() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(5, 230, 200, 200);

    ctx.fillStyle = '#0f0';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const lines = [
        '=== DEBUG (Q toggle) ===',
        `Player: ${Math.floor(player.x)}, ${Math.floor(player.y)}`,
        `Velocity: ${Math.floor(player.velocity)}`,
        `Angle: ${(player.angle * 180 / Math.PI).toFixed(1)}`,
        `HP: ${Math.ceil(player.hp)}/${getPlayerMaxHp()}`,
        `Gold: ${gold}`,
        `Cargo: ${player.cargo.length}/${player.cargoCapacity}`,
        `Enemies: ${enemies.length}`,
        `Cannonballs: ${cannonballs.length}`,
        `Drops: ${drops.length}`,
        `Day: ${dayNumber}`,
        `Timer: ${dayTimer.toFixed(1)}s`,
        `Camera: ${Math.floor(camera.x)}, ${Math.floor(camera.y)}`,
        `Zoom: ${camera.zoom}`
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, 10, 245 + i * 14);
    });
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f44';
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = '#ddd';
    ctx.font = '24px Georgia';
    ctx.fillText('Your ship was destroyed!', canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Days Survived: ${dayNumber}`, canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText(`Gold Earned: ${gold}`, canvas.width / 2, canvas.height / 2 + 70);

    ctx.fillStyle = '#0f0';
    ctx.fillText('Press SPACE to try again', canvas.width / 2, canvas.height / 2 + 130);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 30, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = '#ddd';
    ctx.font = '24px Georgia';
    ctx.fillText('You defeated the Pirate Captain!', canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Days Taken: ${dayNumber}`, canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText(`Final Gold: ${gold}`, canvas.width / 2, canvas.height / 2 + 70);

    ctx.fillStyle = '#0f0';
    ctx.fillText('Press SPACE to play again', canvas.width / 2, canvas.height / 2 + 130);
}

// Utility
function distTo(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (gameState === 'sailing') {
        updatePlayer(dt);
        enemies.forEach(enemy => updateEnemy(enemy, dt));
        updateCannonballs(dt);
        updateParticles(dt);

        // Day timer
        dayTimer -= dt;
        if (dayTimer <= 0) {
            endDay(false);
        }
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// Input handlers
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;

    if (gameState === 'menu') {
        if (e.key === ' ') {
            startGame();
        }
    } else if (gameState === 'sailing') {
        if (e.key.toLowerCase() === 'q') {
            debugOverlay = !debugOverlay;
        }
    } else if (gameState === 'port') {
        handlePortInput(e.key.toLowerCase());
    } else if (gameState === 'gameover' || gameState === 'victory') {
        if (e.key === ' ') {
            startGame();
        }
    }
});

document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => {
    mouse.down = true;
});

canvas.addEventListener('mouseup', () => {
    mouse.down = false;
});

function handlePortInput(key) {
    if (!tradeMenuOpen) {
        if (key === 'w' || key === 'arrowup') {
            portMenuSelection = Math.max(0, portMenuSelection - 1);
        } else if (key === 's' || key === 'arrowdown') {
            portMenuSelection = Math.min(2, portMenuSelection + 1);
        } else if (key === ' ') {
            if (portMenuSelection === 0) {
                tradeMenuOpen = true;
                tradeSelection = 0;
            } else if (portMenuSelection === 1) {
                // Upgrade menu (simplified - just upgrade firepower for now)
                const cost = 100 * player.stats.firepower;
                if (gold >= cost && player.stats.firepower < 10) {
                    gold -= cost;
                    player.stats.firepower++;
                }
            } else if (portMenuSelection === 2) {
                gameState = 'sailing';
                currentPort = null;
            }
        } else if (key === 'escape') {
            gameState = 'sailing';
            currentPort = null;
        }
    } else {
        // Trade menu
        const cargoKeys = Object.keys(player.cargo.reduce((acc, item) => {
            acc[item] = true;
            return acc;
        }, {}));

        if (key === 'w' || key === 'arrowup') {
            tradeSelection = Math.max(0, tradeSelection - 1);
        } else if (key === 's' || key === 'arrowdown') {
            tradeSelection = Math.min(cargoKeys.length - 1, tradeSelection);
        } else if (key === ' ' && cargoKeys.length > 0) {
            // Sell one
            const type = cargoKeys[tradeSelection];
            const idx = player.cargo.indexOf(type);
            if (idx !== -1) {
                player.cargo.splice(idx, 1);
                gold += currentPort.prices[type].sell;
            }
        } else if (key === 'a' && cargoKeys.length > 0) {
            // Sell all of selected type
            const type = cargoKeys[tradeSelection];
            while (player.cargo.includes(type)) {
                const idx = player.cargo.indexOf(type);
                player.cargo.splice(idx, 1);
                gold += currentPort.prices[type].sell;
            }
        } else if (key === 'escape') {
            tradeMenuOpen = false;
        }
    }
}

function startGame() {
    gameState = 'sailing';
    dayTimer = DAY_DURATION;
    dayNumber = 1;
    gold = 100;

    player = {
        x: WORLD_WIDTH / 2,
        y: WORLD_HEIGHT / 2,
        angle: -Math.PI / 2,
        velocity: 0,
        targetVelocity: 0,
        hp: 100,
        maxHp: 100,
        stats: {
            armor: 1,
            speed: 1,
            reload: 1,
            firepower: 1
        },
        cargo: [],
        cargoCapacity: 15,
        reloadTimer: 0
    };

    enemies = [];
    cannonballs = [];
    drops = [];
    particles = [];

    initFogOfWar();
    initWorld();
    spawnEnemies();
}

// Initialize and start
initFogOfWar();
initWorld();
requestAnimationFrame(gameLoop);
