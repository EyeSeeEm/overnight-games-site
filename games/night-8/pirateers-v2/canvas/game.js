// Pirateers - Top-Down Naval Combat
// Canvas 2D Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ==================== CONSTANTS ====================
const COLORS = {
    ocean: '#2a4a6a',
    oceanLight: '#3a6a8a',
    oceanDark: '#1a3a5a',
    sand: '#d4b896',
    grass: '#5a8a5a',
    wood: '#8a6a4a',
    ship: '#c4a060',
    enemy: '#aa4444',
    merchant: '#4a8a4a',
    navy: '#4a4aaa',
    gold: '#ffcc00',
    health: '#44aa44',
    healthLow: '#aa4444',
    white: '#ffffff',
    black: '#000000',
    fog: '#1a2a3a'
};

const MAP_SIZE = 3000;
const TILE_SIZE = 64;

// Islands with ports
const ISLANDS = [
    { x: 1500, y: 1500, radius: 0, name: 'Start', hasPort: true, portType: 'home' },
    { x: 800, y: 600, radius: 120, name: 'Tortuga', hasPort: true, portType: 'trade' },
    { x: 2200, y: 500, radius: 100, name: 'Port Royal', hasPort: true, portType: 'trade' },
    { x: 2400, y: 1800, radius: 90, name: 'Nassau', hasPort: true, portType: 'trade' },
    { x: 600, y: 2000, radius: 110, name: 'Havana', hasPort: true, portType: 'trade' },
    { x: 1800, y: 2400, radius: 80, name: 'Skull Isle', hasPort: false },
    { x: 400, y: 1200, radius: 60, name: 'Reef Island', hasPort: false },
    { x: 2600, y: 1200, radius: 70, name: 'Dead Man\'s', hasPort: false }
];

// Cargo types
const CARGO_TYPES = [
    { name: 'Rum', value: 15, rarity: 'common' },
    { name: 'Grain', value: 10, rarity: 'common' },
    { name: 'Fish', value: 8, rarity: 'common' },
    { name: 'Wood', value: 12, rarity: 'common' },
    { name: 'Spices', value: 30, rarity: 'uncommon' },
    { name: 'Silk', value: 45, rarity: 'uncommon' },
    { name: 'Sugar', value: 25, rarity: 'uncommon' },
    { name: 'Gold Bars', value: 80, rarity: 'rare' },
    { name: 'Gems', value: 120, rarity: 'rare' }
];

// ==================== GAME STATE ====================
const game = {
    state: 'menu', // menu, sailing, port, paused, gameover, victory
    day: 1,
    dayTimer: 120,
    gold: 200,
    debugMode: false,
    cameraX: 0,
    cameraY: 0,
    zoom: 1.5 // Zoomed in per feedback
};

// ==================== PLAYER ====================
const player = {
    x: 1500,
    y: 1500,
    angle: 0,
    speed: 0,
    maxSpeed: 150, // Reduced top speed per feedback
    turnRate: 2,
    acceleration: 80, // Increased per feedback
    deceleration: 100, // Increased per feedback

    // Stats
    armor: 100,
    maxArmor: 100,
    firepower: 10,
    reloadTime: 2,
    lastShot: 0,

    // Upgrades (levels 1-3)
    armorLevel: 1,
    speedLevel: 1,
    reloadLevel: 1,
    firepowerLevel: 1,

    // Cargo
    cargo: [],
    cargoCapacity: 15
};

// ==================== ENTITIES ====================
let enemies = [];
let cannonballs = [];
let lootDrops = [];
let particles = [];
let fogRevealed = new Set();

// ==================== INPUT ====================
const keys = {};
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'q' || e.key === 'Q') game.debugMode = !game.debugMode;
    if (e.key === ' ' && game.state === 'menu') startGame();
    if (e.key === 'Escape' && game.state === 'sailing') returnToPort();
    if (e.key === 'e' && game.state === 'sailing') checkPortInteraction();
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener('click', e => {
    if (game.state === 'menu') startGame();
    if (game.state === 'port') handlePortClick(e);
});

// ==================== GAME FUNCTIONS ====================
function startGame() {
    game.state = 'sailing';
    game.day = 1;
    game.dayTimer = 120;
    game.gold = 200;

    player.x = 1500;
    player.y = 1500;
    player.angle = 0;
    player.speed = 0;
    player.armor = 100;
    player.cargo = [];
    player.armorLevel = 1;
    player.speedLevel = 1;
    player.reloadLevel = 1;
    player.firepowerLevel = 1;

    enemies = [];
    cannonballs = [];
    lootDrops = [];
    particles = [];
    fogRevealed = new Set();

    spawnEnemies();
}

function spawnEnemies() {
    enemies = [];

    // Spawn various enemy types
    for (let i = 0; i < 15; i++) {
        spawnEnemy('merchant');
    }
    for (let i = 0; i < 8; i++) {
        spawnEnemy('navy');
    }
    for (let i = 0; i < 6; i++) {
        spawnEnemy('raider');
    }
    // Spawn one captain (boss)
    spawnEnemy('captain');
}

function spawnEnemy(type) {
    const configs = {
        merchant: { hp: 50, speed: 60, damage: 5, gold: [20, 40], cargo: [2, 4], color: COLORS.merchant },
        navy: { hp: 80, speed: 100, damage: 12, gold: [30, 50], cargo: [1, 2], color: COLORS.navy },
        raider: { hp: 100, speed: 120, damage: 15, gold: [40, 70], cargo: [2, 3], color: COLORS.enemy },
        captain: { hp: 250, speed: 90, damage: 25, gold: [100, 150], cargo: [4, 6], color: '#880088' }
    };

    const config = configs[type];
    let x, y;

    // Spawn away from player start and islands
    do {
        x = 200 + Math.random() * (MAP_SIZE - 400);
        y = 200 + Math.random() * (MAP_SIZE - 400);
    } while (Math.sqrt((x - 1500) ** 2 + (y - 1500) ** 2) < 400 || isNearIsland(x, y, 150));

    enemies.push({
        type,
        x, y,
        angle: Math.random() * Math.PI * 2,
        speed: config.speed * 0.5,
        hp: config.hp,
        maxHp: config.hp,
        damage: config.damage,
        goldDrop: config.gold,
        cargoDrop: config.cargo,
        color: config.color,
        lastShot: 0,
        ai: 'patrol',
        patrolAngle: Math.random() * Math.PI * 2
    });
}

function isNearIsland(x, y, dist) {
    return ISLANDS.some(island => {
        const d = Math.sqrt((x - island.x) ** 2 + (y - island.y) ** 2);
        return d < island.radius + dist;
    });
}

function checkPortInteraction() {
    for (const island of ISLANDS) {
        if (!island.hasPort) continue;
        const dist = Math.sqrt((player.x - island.x) ** 2 + (player.y - island.y) ** 2);
        if (dist < island.radius + 80) {
            game.state = 'port';
            game.currentPort = island;
            return;
        }
    }
}

function returnToPort() {
    // Return to home port
    player.x = 1500;
    player.y = 1500;
    player.armor = player.maxArmor;
    game.day++;
    game.dayTimer = 120;
    game.state = 'port';
    game.currentPort = ISLANDS[0];
}

function handlePortClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check button clicks in port menu
    // Trade button
    if (mx >= 100 && mx <= 300 && my >= 200 && my <= 250) {
        sellCargo();
    }
    // Repair button
    if (mx >= 100 && mx <= 300 && my >= 270 && my <= 320) {
        repairShip();
    }
    // Upgrade buttons
    if (mx >= 100 && mx <= 300 && my >= 340 && my <= 390) upgradeArmor();
    if (mx >= 100 && mx <= 300 && my >= 410 && my <= 460) upgradeSpeed();
    if (mx >= 100 && mx <= 300 && my >= 480 && my <= 530) upgradeFirepower();
    // Set sail button
    if (mx >= 600 && mx <= 860 && my >= 550 && my <= 610) {
        game.state = 'sailing';
    }
}

function sellCargo() {
    let total = 0;
    player.cargo.forEach(item => {
        total += item.value;
    });
    game.gold += total;
    player.cargo = [];
    showNotification(`Sold cargo for ${total} gold!`);
}

function repairShip() {
    const cost = Math.ceil((player.maxArmor - player.armor) * 0.5);
    if (game.gold >= cost && player.armor < player.maxArmor) {
        game.gold -= cost;
        player.armor = player.maxArmor;
        showNotification('Ship repaired!');
    }
}

function upgradeArmor() {
    if (player.armorLevel >= 3) return;
    const cost = player.armorLevel * 150;
    if (game.gold >= cost) {
        game.gold -= cost;
        player.armorLevel++;
        player.maxArmor = 100 + player.armorLevel * 50;
        player.armor = player.maxArmor;
        showNotification('Armor upgraded!');
    }
}

function upgradeSpeed() {
    if (player.speedLevel >= 3) return;
    const cost = player.speedLevel * 150;
    if (game.gold >= cost) {
        game.gold -= cost;
        player.speedLevel++;
        player.maxSpeed = 150 + player.speedLevel * 20;
        showNotification('Speed upgraded!');
    }
}

function upgradeFirepower() {
    if (player.firepowerLevel >= 3) return;
    const cost = player.firepowerLevel * 150;
    if (game.gold >= cost) {
        game.gold -= cost;
        player.firepowerLevel++;
        player.firepower = 10 + player.firepowerLevel * 5;
        showNotification('Firepower upgraded!');
    }
}

// Notifications
let notifications = [];
function showNotification(text) {
    notifications.push({ text, timer: 3 });
}

// ==================== UPDATE ====================
function update(dt) {
    if (game.state === 'sailing') {
        game.dayTimer -= dt;
        if (game.dayTimer <= 0) {
            returnToPort();
            return;
        }

        updatePlayer(dt);
        updateEnemies(dt);
        updateCannonballs(dt);
        updateLoot(dt);
        updateParticles(dt);
        updateFog();
        updateCamera();

        // Auto-fire
        if (keys[' ']) playerShoot();
    }

    // Update notifications
    for (let i = notifications.length - 1; i >= 0; i--) {
        notifications[i].timer -= dt;
        if (notifications[i].timer <= 0) notifications.splice(i, 1);
    }
}

function updatePlayer(dt) {
    // Turning
    if (keys['a'] || keys['arrowleft']) player.angle -= player.turnRate * dt;
    if (keys['d'] || keys['arrowright']) player.angle += player.turnRate * dt;

    // Acceleration/deceleration per feedback
    if (keys['w'] || keys['arrowup']) {
        player.speed += player.acceleration * dt;
    } else if (keys['s'] || keys['arrowdown']) {
        player.speed -= player.deceleration * dt;
    } else {
        // Natural deceleration
        if (player.speed > 0) player.speed -= player.deceleration * 0.5 * dt;
        if (player.speed < 0) player.speed = 0;
    }

    player.speed = Math.max(0, Math.min(player.maxSpeed, player.speed));

    // Movement
    const newX = player.x + Math.cos(player.angle) * player.speed * dt;
    const newY = player.y + Math.sin(player.angle) * player.speed * dt;

    // Boundary and island collision
    if (!isNearIsland(newX, newY, 30) && newX > 50 && newX < MAP_SIZE - 50) {
        player.x = newX;
    }
    if (!isNearIsland(player.x, newY, 30) && newY > 50 && newY < MAP_SIZE - 50) {
        player.y = newY;
    }

    // Check game over
    if (player.armor <= 0) {
        game.state = 'gameover';
    }
}

function playerShoot() {
    const now = Date.now();
    if (now - player.lastShot < player.reloadTime * 1000) return;
    player.lastShot = now;

    // Broadside - both sides
    const spread = 0.3;
    for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 3; i++) {
            const angleOffset = (i - 1) * spread;
            const fireAngle = player.angle + Math.PI / 2 * side + angleOffset;

            cannonballs.push({
                x: player.x + Math.cos(fireAngle) * 20,
                y: player.y + Math.sin(fireAngle) * 20,
                vx: Math.cos(fireAngle) * 400,
                vy: Math.sin(fireAngle) * 400,
                damage: player.firepower,
                isPlayer: true,
                life: 1
            });
        }
    }

    createParticle(player.x, player.y, '#ffaa00', 8, 10);
}

function updateEnemies(dt) {
    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angleToPlayer = Math.atan2(dy, dx);

        // AI behavior
        if (dist < 400 && enemy.type !== 'merchant') {
            // Chase and attack
            enemy.ai = 'attack';
            const angleDiff = angleToPlayer - enemy.angle;
            enemy.angle += Math.sign(Math.sin(angleDiff)) * 1.5 * dt;
            enemy.speed = enemy.type === 'captain' ? 90 : 80;

            // Shoot
            const now = Date.now();
            if (now - enemy.lastShot > 2000 && dist < 300) {
                enemy.lastShot = now;
                const fireAngle = angleToPlayer + (Math.random() - 0.5) * 0.3;
                cannonballs.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(fireAngle) * 300,
                    vy: Math.sin(fireAngle) * 300,
                    damage: enemy.damage,
                    isPlayer: false,
                    life: 1.5
                });
            }
        } else {
            // Patrol
            enemy.ai = 'patrol';
            enemy.patrolAngle += (Math.random() - 0.5) * 0.5 * dt;
            enemy.angle += (enemy.patrolAngle - enemy.angle) * 0.5 * dt;
            enemy.speed = 30;
        }

        // Move
        enemy.x += Math.cos(enemy.angle) * enemy.speed * dt;
        enemy.y += Math.sin(enemy.angle) * enemy.speed * dt;

        // Boundary
        enemy.x = Math.max(100, Math.min(MAP_SIZE - 100, enemy.x));
        enemy.y = Math.max(100, Math.min(MAP_SIZE - 100, enemy.y));

        // Avoid islands
        if (isNearIsland(enemy.x, enemy.y, 80)) {
            enemy.angle += Math.PI;
        }
    });
}

function updateCannonballs(dt) {
    for (let i = cannonballs.length - 1; i >= 0; i--) {
        const ball = cannonballs[i];
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        ball.life -= dt;

        if (ball.life <= 0) {
            cannonballs.splice(i, 1);
            continue;
        }

        // Player projectile hitting enemies
        if (ball.isPlayer) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                const dist = Math.sqrt((ball.x - enemy.x) ** 2 + (ball.y - enemy.y) ** 2);

                if (dist < 25) {
                    enemy.hp -= ball.damage;
                    createParticle(ball.x, ball.y, '#ff8800', 6, 15);
                    cannonballs.splice(i, 1);

                    if (enemy.hp <= 0) {
                        // Drop loot
                        dropLoot(enemy);

                        // Check victory
                        if (enemy.type === 'captain') {
                            game.state = 'victory';
                        }

                        createDeathParticles(enemy.x, enemy.y, enemy.color);
                        enemies.splice(j, 1);
                    }
                    break;
                }
            }
        } else {
            // Enemy projectile hitting player
            const dist = Math.sqrt((ball.x - player.x) ** 2 + (ball.y - player.y) ** 2);
            if (dist < 20) {
                player.armor -= ball.damage;
                createParticle(ball.x, ball.y, '#ff0000', 6, 15);
                cannonballs.splice(i, 1);
            }
        }
    }
}

function dropLoot(enemy) {
    // Gold
    const gold = enemy.goldDrop[0] + Math.floor(Math.random() * (enemy.goldDrop[1] - enemy.goldDrop[0]));
    game.gold += gold;
    showNotification(`+${gold} gold!`);

    // Cargo drops
    const cargoCount = enemy.cargoDrop[0] + Math.floor(Math.random() * (enemy.cargoDrop[1] - enemy.cargoDrop[0] + 1));
    for (let i = 0; i < cargoCount; i++) {
        const rarity = Math.random();
        let pool;
        if (rarity < 0.6) pool = CARGO_TYPES.filter(c => c.rarity === 'common');
        else if (rarity < 0.9) pool = CARGO_TYPES.filter(c => c.rarity === 'uncommon');
        else pool = CARGO_TYPES.filter(c => c.rarity === 'rare');

        const item = pool[Math.floor(Math.random() * pool.length)];

        lootDrops.push({
            x: enemy.x + (Math.random() - 0.5) * 50,
            y: enemy.y + (Math.random() - 0.5) * 50,
            item: { ...item },
            timer: 15
        });
    }
}

function updateLoot(dt) {
    for (let i = lootDrops.length - 1; i >= 0; i--) {
        const loot = lootDrops[i];
        loot.timer -= dt;

        if (loot.timer <= 0) {
            lootDrops.splice(i, 1);
            continue;
        }

        // Collect
        const dist = Math.sqrt((loot.x - player.x) ** 2 + (loot.y - player.y) ** 2);
        if (dist < 40 && player.cargo.length < player.cargoCapacity) {
            player.cargo.push(loot.item);
            showNotification(`Picked up ${loot.item.name}!`);
            createParticle(loot.x, loot.y, '#ffcc00', 5, 15);
            lootDrops.splice(i, 1);
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 60;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function createParticle(x, y, color, size, life) {
    particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 100,
        vy: (Math.random() - 0.5) * 100,
        color, size, life, maxLife: life
    });
}

function createDeathParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        const angle = (i / 15) * Math.PI * 2;
        particles.push({
            x, y,
            vx: Math.cos(angle) * 150,
            vy: Math.sin(angle) * 150,
            color, size: 6, life: 30, maxLife: 30
        });
    }
}

function updateFog() {
    // Reveal fog around player
    const gridX = Math.floor(player.x / 100);
    const gridY = Math.floor(player.y / 100);
    const revealRadius = 4;

    for (let dx = -revealRadius; dx <= revealRadius; dx++) {
        for (let dy = -revealRadius; dy <= revealRadius; dy++) {
            fogRevealed.add(`${gridX + dx},${gridY + dy}`);
        }
    }
}

function updateCamera() {
    // Smooth camera follow
    const targetX = player.x - canvas.width / (2 * game.zoom);
    const targetY = player.y - canvas.height / (2 * game.zoom);
    game.cameraX += (targetX - game.cameraX) * 0.1;
    game.cameraY += (targetY - game.cameraY) * 0.1;
}

// ==================== RENDER ====================
function render() {
    // Clear
    ctx.fillStyle = COLORS.ocean;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === 'menu') {
        renderMenu();
        return;
    }

    if (game.state === 'port') {
        renderPort();
        return;
    }

    if (game.state === 'gameover') {
        renderGameOver();
        return;
    }

    if (game.state === 'victory') {
        renderVictory();
        return;
    }

    // Apply camera and zoom
    ctx.save();
    ctx.scale(game.zoom, game.zoom);
    ctx.translate(-game.cameraX, -game.cameraY);

    renderOcean();
    renderIslands();
    renderLoot();
    renderEnemies();
    renderPlayer();
    renderCannonballs();
    renderParticles();
    renderFog();

    ctx.restore();

    renderHUD();
    if (game.debugMode) renderDebug();
}

function renderMenu() {
    // Background gradient
    ctx.fillStyle = COLORS.oceanDark;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 64px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('PIRATEERS', canvas.width / 2, 180);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '24px Georgia';
    ctx.fillText('Naval Combat Adventure', canvas.width / 2, 230);

    // Ship preview
    ctx.save();
    ctx.translate(canvas.width / 2, 350);
    ctx.fillStyle = COLORS.ship;
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(-30, -20);
    ctx.lineTo(-30, 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.wood;
    ctx.fillRect(-35, -8, 10, 16);
    ctx.restore();

    // Instructions
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Georgia';
    const lines = [
        'WASD / Arrows - Sail',
        'SPACE - Fire Cannons',
        'E - Enter Port',
        'ESC - Return to Port'
    ];
    lines.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, 450 + i * 25);
    });

    // Start prompt
    ctx.font = '28px Georgia';
    ctx.fillStyle = COLORS.gold;
    const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText('Click or Press SPACE to Set Sail', canvas.width / 2, 560);
    ctx.globalAlpha = 1;

    ctx.font = '14px Georgia';
    ctx.fillStyle = '#888888';
    ctx.fillText('Q - Debug Mode', canvas.width / 2, 600);
}

function renderOcean() {
    // Wave effect
    const time = Date.now() / 2000;
    for (let x = 0; x < MAP_SIZE; x += 100) {
        for (let y = 0; y < MAP_SIZE; y += 100) {
            const wave = Math.sin(x / 200 + time) * Math.cos(y / 200 + time);
            ctx.fillStyle = wave > 0 ? COLORS.oceanLight : COLORS.oceanDark;
            ctx.fillRect(x, y, 100, 100);
        }
    }
}

function renderIslands() {
    ISLANDS.forEach(island => {
        if (island.radius === 0) return; // Skip home (no island)

        // Sand
        ctx.fillStyle = COLORS.sand;
        ctx.beginPath();
        ctx.arc(island.x, island.y, island.radius, 0, Math.PI * 2);
        ctx.fill();

        // Grass center
        ctx.fillStyle = COLORS.grass;
        ctx.beginPath();
        ctx.arc(island.x, island.y, island.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Name
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(island.name, island.x, island.y - island.radius - 10);

        // Port indicator
        if (island.hasPort) {
            ctx.fillStyle = COLORS.wood;
            ctx.fillRect(island.x - 15, island.y + island.radius - 20, 30, 20);
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Georgia';
            ctx.fillText('PORT', island.x, island.y + island.radius - 5);
        }
    });

    // Home port indicator
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 12px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('⚓ HOME PORT', 1500, 1520);
}

function renderPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Ship body
    ctx.fillStyle = COLORS.ship;
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(-20, -12);
    ctx.lineTo(-20, 12);
    ctx.closePath();
    ctx.fill();

    // Mast
    ctx.fillStyle = COLORS.wood;
    ctx.fillRect(-8, -4, 6, 8);

    // Sail
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.quadraticCurveTo(5, -15, -5, -20);
    ctx.lineTo(-5, 0);
    ctx.fill();

    ctx.restore();
}

function renderEnemies() {
    enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);

        // Ship body
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-15, -10);
        ctx.lineTo(-15, 10);
        ctx.closePath();
        ctx.fill();

        // Mast
        ctx.fillStyle = COLORS.wood;
        ctx.fillRect(-6, -3, 5, 6);

        ctx.restore();

        // HP bar
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#333333';
        ctx.fillRect(enemy.x - 15, enemy.y - 30, 30, 5);
        ctx.fillStyle = hpPercent > 0.3 ? COLORS.health : COLORS.healthLow;
        ctx.fillRect(enemy.x - 15, enemy.y - 30, 30 * hpPercent, 5);

        // Type label
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.type.toUpperCase(), enemy.x, enemy.y - 35);
    });
}

function renderCannonballs() {
    ctx.fillStyle = '#333333';
    cannonballs.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

function renderLoot() {
    lootDrops.forEach(loot => {
        // Floating crate
        const bob = Math.sin(Date.now() / 300 + loot.x) * 3;
        ctx.fillStyle = COLORS.wood;
        ctx.fillRect(loot.x - 8, loot.y - 8 + bob, 16, 16);

        // Sparkle
        ctx.fillStyle = COLORS.gold;
        ctx.globalAlpha = Math.abs(Math.sin(Date.now() / 200));
        ctx.beginPath();
        ctx.arc(loot.x, loot.y - 5 + bob, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

function renderParticles() {
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function renderFog() {
    ctx.fillStyle = COLORS.fog;
    for (let x = 0; x < MAP_SIZE / 100; x++) {
        for (let y = 0; y < MAP_SIZE / 100; y++) {
            if (!fogRevealed.has(`${x},${y}`)) {
                ctx.fillRect(x * 100, y * 100, 100, 100);
            }
        }
    }
}

function renderHUD() {
    // Health bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 220, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('ARMOR', 20, 30);

    ctx.fillStyle = '#333333';
    ctx.fillRect(20, 35, 190, 15);
    const hpPercent = player.armor / player.maxArmor;
    ctx.fillStyle = hpPercent > 0.3 ? COLORS.health : COLORS.healthLow;
    ctx.fillRect(20, 35, 190 * hpPercent, 15);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${Math.ceil(player.armor)}/${player.maxArmor}`, 90, 47);

    ctx.fillText(`SPEED: ${Math.round(player.speed)}/${player.maxSpeed}`, 20, 70);
    ctx.fillText(`GOLD: ${game.gold}`, 20, 85);

    // Cargo display
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 100, 220, 60);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`CARGO: ${player.cargo.length}/${player.cargoCapacity}`, 20, 120);

    // Cargo icons
    const cargoStr = player.cargo.slice(0, 5).map(c => c.name.substring(0, 3)).join(' ');
    ctx.font = '12px Georgia';
    ctx.fillText(cargoStr + (player.cargo.length > 5 ? '...' : ''), 20, 145);

    // Day timer
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(canvas.width - 160, 10, 150, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Georgia';
    ctx.textAlign = 'right';
    ctx.fillText(`Day ${game.day}`, canvas.width - 20, 30);
    ctx.fillText(`Time: ${Math.ceil(game.dayTimer)}s`, canvas.width - 20, 50);

    // Port proximity hint
    for (const island of ISLANDS) {
        if (!island.hasPort) continue;
        const dist = Math.sqrt((player.x - island.x) ** 2 + (player.y - island.y) ** 2);
        if (dist < island.radius + 100) {
            ctx.fillStyle = COLORS.gold;
            ctx.font = '20px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText('Press E to enter ' + island.name, canvas.width / 2, canvas.height - 30);
        }
    }

    // Mini-map
    const mmX = canvas.width - 160;
    const mmY = canvas.height - 160;
    const mmSize = 150;
    const mmScale = mmSize / MAP_SIZE;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mmX, mmY, mmSize, mmSize);

    // Islands on minimap
    ctx.fillStyle = COLORS.sand;
    ISLANDS.forEach(island => {
        if (island.radius > 0) {
            ctx.beginPath();
            ctx.arc(mmX + island.x * mmScale, mmY + island.y * mmScale, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Player on minimap
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(mmX + player.x * mmScale, mmY + player.y * mmScale, 3, 0, Math.PI * 2);
    ctx.fill();

    // Enemies on minimap
    ctx.fillStyle = COLORS.enemy;
    enemies.forEach(e => {
        ctx.beginPath();
        ctx.arc(mmX + e.x * mmScale, mmY + e.y * mmScale, 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Notifications
    ctx.textAlign = 'center';
    notifications.forEach((n, i) => {
        ctx.fillStyle = COLORS.gold;
        ctx.globalAlpha = Math.min(1, n.timer);
        ctx.font = '18px Georgia';
        ctx.fillText(n.text, canvas.width / 2, 200 + i * 30);
    });
    ctx.globalAlpha = 1;
}

function renderPort() {
    ctx.fillStyle = COLORS.oceanDark;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 36px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(game.currentPort ? game.currentPort.name : 'PORT', canvas.width / 2, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Georgia';
    ctx.fillText(`Gold: ${game.gold}`, canvas.width / 2, 130);
    ctx.fillText(`Day ${game.day}`, canvas.width / 2, 160);

    // Buttons
    ctx.textAlign = 'left';
    drawPortButton(100, 200, 200, 50, 'SELL CARGO', `+${player.cargo.reduce((a, c) => a + c.value, 0)} gold`);
    drawPortButton(100, 270, 200, 50, 'REPAIR SHIP', `Cost: ${Math.ceil((player.maxArmor - player.armor) * 0.5)}`);

    // Upgrades
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px Georgia';
    ctx.fillText('UPGRADES:', 100, 330);

    const armorCost = player.armorLevel < 3 ? player.armorLevel * 150 : 'MAX';
    const speedCost = player.speedLevel < 3 ? player.speedLevel * 150 : 'MAX';
    const fireCost = player.firepowerLevel < 3 ? player.firepowerLevel * 150 : 'MAX';

    drawPortButton(100, 340, 200, 50, `ARMOR Lv${player.armorLevel}`, armorCost);
    drawPortButton(100, 410, 200, 50, `SPEED Lv${player.speedLevel}`, speedCost);
    drawPortButton(100, 480, 200, 50, `FIREPOWER Lv${player.firepowerLevel}`, fireCost);

    // Cargo list
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('CARGO:', 400, 200);

    ctx.font = '14px Georgia';
    player.cargo.forEach((item, i) => {
        ctx.fillText(`${item.name} - ${item.value}g`, 400, 230 + i * 20);
    });
    if (player.cargo.length === 0) {
        ctx.fillStyle = '#888888';
        ctx.fillText('(Empty)', 400, 230);
    }

    // Set sail button
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(600, 550, 260, 60);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('SET SAIL', 730, 590);
}

function drawPortButton(x, y, w, h, text, subtext) {
    ctx.fillStyle = '#4a4a6a';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#8a8aaa';
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(text, x + 10, y + 22);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px Georgia';
    ctx.fillText(subtext, x + 10, y + 40);
}

function renderDebug() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(240, 10, 200, 140);

    ctx.fillStyle = '#00ff88';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const info = [
        'DEBUG (Q)',
        `X: ${Math.round(player.x)} Y: ${Math.round(player.y)}`,
        `Angle: ${(player.angle * 180 / Math.PI).toFixed(1)}°`,
        `Speed: ${player.speed.toFixed(1)}`,
        `Armor: ${player.armor}`,
        `Enemies: ${enemies.length}`,
        `Cargo: ${player.cargo.length}/${player.cargoCapacity}`,
        `Loot drops: ${lootDrops.length}`
    ];

    info.forEach((line, i) => {
        ctx.fillText(line, 250, 25 + i * 15);
    });
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.healthLow;
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('SHIP SUNK!', canvas.width / 2, 250);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Georgia';
    ctx.fillText(`Days survived: ${game.day}`, canvas.width / 2, 320);
    ctx.fillText(`Gold earned: ${game.gold}`, canvas.width / 2, 360);

    ctx.font = '20px Georgia';
    ctx.fillText('Press SPACE to try again', canvas.width / 2, 450);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, 200);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Georgia';
    ctx.fillText('You defeated the Pirate Captain!', canvas.width / 2, 280);
    ctx.fillText(`Days: ${game.day}`, canvas.width / 2, 340);
    ctx.fillText(`Final Gold: ${game.gold}`, canvas.width / 2, 380);

    ctx.font = '20px Georgia';
    ctx.fillText('Press SPACE to play again', canvas.width / 2, 480);
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
