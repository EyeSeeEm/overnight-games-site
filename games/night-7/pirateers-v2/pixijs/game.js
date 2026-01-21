// Pirateers - PixiJS
// Top-down pirate naval combat

const app = new PIXI.Application({
    width: 960,
    height: 640,
    backgroundColor: 0x1a3050,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
});
document.body.appendChild(app.view);

// Game constants
const MAP_SIZE = 3000;
const TILE_SIZE = 64;

// Enemy types
const ENEMY_TYPES = {
    MERCHANT: { hp: 50, speed: 50, damage: 5, gold: [20, 40], cargo: [2, 4], color: 0x60A040, name: 'Merchant' },
    NAVY: { hp: 80, speed: 80, damage: 12, gold: [30, 50], cargo: [1, 2], color: 0x4060C0, name: 'Navy Sloop' },
    RAIDER: { hp: 100, speed: 100, damage: 15, gold: [40, 70], cargo: [2, 3], color: 0x804040, name: 'Pirate Raider' },
    CAPTAIN: { hp: 250, speed: 70, damage: 25, gold: [100, 150], cargo: [4, 6], color: 0xC02020, name: 'Pirate Captain', isBoss: true }
};

// Cargo items
const CARGO_ITEMS = [
    { name: 'Rum', value: 15, rarity: 'common' },
    { name: 'Fish', value: 10, rarity: 'common' },
    { name: 'Wood', value: 12, rarity: 'common' },
    { name: 'Spices', value: 25, rarity: 'uncommon' },
    { name: 'Silk', value: 40, rarity: 'uncommon' },
    { name: 'Gold Bar', value: 75, rarity: 'rare' },
    { name: 'Gems', value: 120, rarity: 'rare' }
];

// Game state
const gameState = {
    phase: 'menu', // menu, base, sailing, gameover, victory
    day: 1,
    dayTimer: 120,
    gold: 100,
    cargo: [],
    cargoCapacity: 15,
    upgrades: { armor: 1, speed: 1, reload: 1, firepower: 1 },
    explored: new Set()
};

// Player ship
const player = {
    x: MAP_SIZE / 2,
    y: MAP_SIZE / 2,
    angle: 0,
    speed: 0,
    maxSpeed: 100,
    targetSpeed: 0,
    turnRate: 2,
    armor: 100,
    maxArmor: 100,
    reloadTime: 2,
    fireTimer: 0,
    firepower: 10
};

// Enemies, bullets, pickups
let enemies = [];
let bullets = [];
let pickups = [];
let islands = [];

// Containers
const worldContainer = new PIXI.Container();
const oceanContainer = new PIXI.Container();
const entityContainer = new PIXI.Container();
const bulletContainer = new PIXI.Container();
const pickupContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();
const minimapContainer = new PIXI.Container();
const menuContainer = new PIXI.Container();

worldContainer.addChild(oceanContainer);
worldContainer.addChild(entityContainer);
worldContainer.addChild(bulletContainer);
worldContainer.addChild(pickupContainer);
app.stage.addChild(worldContainer);
app.stage.addChild(uiContainer);
app.stage.addChild(minimapContainer);
app.stage.addChild(menuContainer);

// Draw ocean
function drawOcean() {
    // Water background
    const water = new PIXI.Graphics();
    water.beginFill(0x1a3050);
    water.drawRect(0, 0, MAP_SIZE, MAP_SIZE);
    water.endFill();

    // Wave patterns
    for (let y = 0; y < MAP_SIZE; y += 200) {
        for (let x = 0; x < MAP_SIZE; x += 200) {
            water.beginFill(0x1a3560, 0.3);
            water.drawEllipse(x + Math.random() * 100, y + Math.random() * 100, 40, 20);
            water.endFill();
        }
    }

    oceanContainer.addChild(water);

    // Generate islands
    const islandCount = 8;
    for (let i = 0; i < islandCount; i++) {
        const ix = 300 + Math.random() * (MAP_SIZE - 600);
        const iy = 300 + Math.random() * (MAP_SIZE - 600);
        const size = 60 + Math.random() * 80;

        const island = new PIXI.Graphics();
        // Sandy beach
        island.beginFill(0xD4B896);
        island.drawEllipse(ix, iy, size * 1.2, size);
        island.endFill();
        // Green center
        island.beginFill(0x408040);
        island.drawEllipse(ix, iy - 5, size * 0.8, size * 0.6);
        island.endFill();
        // Palm tree
        island.beginFill(0x6B4423);
        island.drawRect(ix - 3, iy - 30, 6, 25);
        island.endFill();
        island.beginFill(0x228B22);
        island.drawCircle(ix, iy - 35, 15);
        island.endFill();

        oceanContainer.addChild(island);
        islands.push({ x: ix, y: iy, size, hasPort: Math.random() < 0.5 });
    }

    // Draw ports on some islands
    islands.forEach(island => {
        if (island.hasPort) {
            const port = new PIXI.Graphics();
            port.beginFill(0x8B4513);
            port.drawRect(island.x - 20, island.y + island.size - 10, 40, 15);
            port.endFill();
            oceanContainer.addChild(port);
        }
    });
}

// Player ship sprite
const playerShip = new PIXI.Graphics();
function drawPlayerShip() {
    playerShip.clear();
    // Hull
    playerShip.beginFill(0x8B4513);
    playerShip.moveTo(20, 0);
    playerShip.lineTo(-15, -12);
    playerShip.lineTo(-15, 12);
    playerShip.closePath();
    playerShip.endFill();
    // Deck
    playerShip.beginFill(0xA0522D);
    playerShip.drawRect(-10, -8, 20, 16);
    playerShip.endFill();
    // Mast
    playerShip.beginFill(0x4a3020);
    playerShip.drawRect(-2, -3, 4, 6);
    playerShip.endFill();
    // Sail
    playerShip.beginFill(0xF5F5DC);
    playerShip.moveTo(2, -15);
    playerShip.lineTo(15, 0);
    playerShip.lineTo(2, 15);
    playerShip.closePath();
    playerShip.endFill();
}
drawPlayerShip();
entityContainer.addChild(playerShip);

// Input
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && gameState.phase === 'sailing') {
        fireCannons();
    }
    if (e.code === 'KeyE' && gameState.phase === 'sailing') {
        checkPortInteraction();
    }
});
window.addEventListener('keyup', e => keys[e.code] = false);

// Fire cannons (broadside)
function fireCannons() {
    if (player.fireTimer > 0) return;

    const damage = player.firepower * (1 + (gameState.upgrades.firepower - 1) * 0.2);
    const speed = 400;
    const range = 300;
    const spread = 0.3;

    // Fire from both sides
    for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 3; i++) {
            const angle = player.angle + (Math.PI / 2) * side + (i - 1) * spread;
            const bullet = {
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                damage,
                range,
                traveled: 0,
                owner: 'player',
                sprite: new PIXI.Graphics()
            };

            bullet.sprite.beginFill(0x000000);
            bullet.sprite.drawCircle(0, 0, 4);
            bullet.sprite.endFill();
            bullet.sprite.x = bullet.x;
            bullet.sprite.y = bullet.y;

            bulletContainer.addChild(bullet.sprite);
            bullets.push(bullet);
        }
    }

    player.fireTimer = player.reloadTime * (1 - (gameState.upgrades.reload - 1) * 0.1);
}

// Check port interaction
function checkPortInteraction() {
    for (const island of islands) {
        if (!island.hasPort) continue;
        const dx = player.x - island.x;
        const dy = player.y - island.y;
        if (dx * dx + dy * dy < (island.size + 50) ** 2) {
            // Enter port
            openPortMenu(island);
            return;
        }
    }
}

// Port menu
let portMenuOpen = false;
const portMenu = new PIXI.Container();

function openPortMenu(island) {
    portMenuOpen = true;
    gameState.phase = 'port';

    portMenu.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x1a1a1a, 0.95);
    bg.drawRoundedRect(200, 100, 560, 440, 10);
    bg.endFill();
    portMenu.addChild(bg);

    const title = new PIXI.Text('PORT', { fontSize: 32, fill: 0xD4A060, fontWeight: 'bold' });
    title.x = 430;
    title.y = 120;
    portMenu.addChild(title);

    // Sell cargo button
    let cargoValue = 0;
    gameState.cargo.forEach(item => cargoValue += item.value);

    const sellBtn = createButton(`Sell Cargo (+${cargoValue} gold)`, 300, 200, () => {
        gameState.gold += cargoValue;
        gameState.cargo = [];
        closePortMenu();
    });
    portMenu.addChild(sellBtn);

    // Repair button
    const repairCost = Math.floor((player.maxArmor - player.armor) * 0.5);
    const repairBtn = createButton(`Repair Ship (-${repairCost} gold)`, 300, 260, () => {
        if (gameState.gold >= repairCost) {
            gameState.gold -= repairCost;
            player.armor = player.maxArmor;
        }
        closePortMenu();
    });
    portMenu.addChild(repairBtn);

    // Upgrade buttons
    const stats = ['armor', 'speed', 'reload', 'firepower'];
    stats.forEach((stat, i) => {
        const level = gameState.upgrades[stat];
        if (level < 4) {
            const cost = level * 100;
            const btn = createButton(`Upgrade ${stat} (Lv${level}) - ${cost}g`, 300, 320 + i * 50, () => {
                if (gameState.gold >= cost) {
                    gameState.gold -= cost;
                    gameState.upgrades[stat]++;
                    applyUpgrades();
                }
                closePortMenu();
            });
            portMenu.addChild(btn);
        }
    });

    // Leave button
    const leaveBtn = createButton('Leave Port', 300, 500, closePortMenu);
    portMenu.addChild(leaveBtn);

    uiContainer.addChild(portMenu);
}

function closePortMenu() {
    portMenuOpen = false;
    gameState.phase = 'sailing';
    uiContainer.removeChild(portMenu);
}

function createButton(text, x, y, onClick) {
    const btn = new PIXI.Container();
    const bg = new PIXI.Graphics();
    bg.beginFill(0x4a3a2a);
    bg.drawRoundedRect(0, 0, 360, 40, 5);
    bg.endFill();
    btn.addChild(bg);

    const label = new PIXI.Text(text, { fontSize: 18, fill: 0xFFFFFF });
    label.x = 180 - label.width / 2;
    label.y = 10;
    btn.addChild(label);

    btn.x = x;
    btn.y = y;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', onClick);

    return btn;
}

// Apply upgrades
function applyUpgrades() {
    player.maxArmor = 100 + (gameState.upgrades.armor - 1) * 50;
    player.maxSpeed = 100 + (gameState.upgrades.speed - 1) * 20;
    player.reloadTime = 2 - (gameState.upgrades.reload - 1) * 0.2;
    player.firepower = 10 + (gameState.upgrades.firepower - 1) * 5;
}

// Spawn enemy
function spawnEnemy(type, x, y) {
    const template = ENEMY_TYPES[type];
    const enemy = {
        type,
        x, y,
        angle: Math.random() * Math.PI * 2,
        speed: template.speed * 0.8,
        health: template.hp,
        maxHealth: template.hp,
        damage: template.damage,
        gold: template.gold,
        cargo: template.cargo,
        color: template.color,
        isBoss: template.isBoss,
        fireTimer: Math.random() * 2,
        sprite: new PIXI.Graphics()
    };

    drawEnemyShip(enemy);
    entityContainer.addChild(enemy.sprite);
    enemies.push(enemy);
}

function drawEnemyShip(enemy) {
    enemy.sprite.clear();
    const scale = enemy.isBoss ? 1.5 : 1;
    // Hull
    enemy.sprite.beginFill(enemy.color);
    enemy.sprite.moveTo(15 * scale, 0);
    enemy.sprite.lineTo(-12 * scale, -10 * scale);
    enemy.sprite.lineTo(-12 * scale, 10 * scale);
    enemy.sprite.closePath();
    enemy.sprite.endFill();
    // Sail
    enemy.sprite.beginFill(0xFFFFFF, 0.8);
    enemy.sprite.moveTo(0, -12 * scale);
    enemy.sprite.lineTo(10 * scale, 0);
    enemy.sprite.lineTo(0, 12 * scale);
    enemy.sprite.closePath();
    enemy.sprite.endFill();

    enemy.sprite.x = enemy.x;
    enemy.sprite.y = enemy.y;
    enemy.sprite.rotation = enemy.angle;
}

// Spawn pickup (loot drop)
function spawnPickup(x, y, type, value = 0, item = null) {
    const pickup = {
        x, y,
        type, // 'gold' or 'cargo'
        value,
        item,
        timer: 15,
        sprite: new PIXI.Graphics()
    };

    pickup.sprite.x = x;
    pickup.sprite.y = y;

    if (type === 'gold') {
        pickup.sprite.beginFill(0xFFD700);
        pickup.sprite.drawCircle(0, 0, 8);
        pickup.sprite.endFill();
    } else {
        pickup.sprite.beginFill(0x8B4513);
        pickup.sprite.drawRect(-10, -6, 20, 12);
        pickup.sprite.endFill();
        pickup.sprite.beginFill(0xD2691E);
        pickup.sprite.drawRect(-8, -4, 16, 8);
        pickup.sprite.endFill();
    }

    pickupContainer.addChild(pickup.sprite);
    pickups.push(pickup);
}

// Update player
function updatePlayer(delta) {
    const dt = delta / 60;

    // Fire timer
    if (player.fireTimer > 0) player.fireTimer -= dt;

    // Turn
    if (keys['KeyA'] || keys['ArrowLeft']) player.angle -= player.turnRate * dt;
    if (keys['KeyD'] || keys['ArrowRight']) player.angle += player.turnRate * dt;

    // Speed control
    if (keys['KeyW'] || keys['ArrowUp']) player.targetSpeed = player.maxSpeed;
    else if (keys['KeyS'] || keys['ArrowDown']) player.targetSpeed = 0;

    // Smooth acceleration/deceleration
    const accel = 80;
    if (player.speed < player.targetSpeed) {
        player.speed = Math.min(player.targetSpeed, player.speed + accel * dt);
    } else if (player.speed > player.targetSpeed) {
        player.speed = Math.max(player.targetSpeed, player.speed - accel * 1.5 * dt);
    }

    // Move
    player.x += Math.cos(player.angle) * player.speed * dt;
    player.y += Math.sin(player.angle) * player.speed * dt;

    // Clamp to map
    player.x = Math.max(50, Math.min(MAP_SIZE - 50, player.x));
    player.y = Math.max(50, Math.min(MAP_SIZE - 50, player.y));

    // Update sprite
    playerShip.x = player.x;
    playerShip.y = player.y;
    playerShip.rotation = player.angle;

    // Mark explored area
    const ex = Math.floor(player.x / 200);
    const ey = Math.floor(player.y / 200);
    gameState.explored.add(`${ex},${ey}`);
}

// Update enemies
function updateEnemies(delta) {
    const dt = delta / 60;

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // AI - move toward player if in range
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 400) {
            // Face player
            const targetAngle = Math.atan2(dy, dx);
            let angleDiff = targetAngle - enemy.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            enemy.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 1.5 * dt);

            // Fire
            enemy.fireTimer -= dt;
            if (enemy.fireTimer <= 0 && dist < 250) {
                fireEnemyCannon(enemy);
                enemy.fireTimer = 2 + Math.random();
            }
        }

        // Move forward
        enemy.x += Math.cos(enemy.angle) * enemy.speed * dt;
        enemy.y += Math.sin(enemy.angle) * enemy.speed * dt;

        // Clamp
        enemy.x = Math.max(50, Math.min(MAP_SIZE - 50, enemy.x));
        enemy.y = Math.max(50, Math.min(MAP_SIZE - 50, enemy.y));

        // Check death
        if (enemy.health <= 0) {
            // Drop loot
            const goldDrop = enemy.gold[0] + Math.floor(Math.random() * (enemy.gold[1] - enemy.gold[0]));
            spawnPickup(enemy.x, enemy.y, 'gold', goldDrop);

            const cargoCount = enemy.cargo[0] + Math.floor(Math.random() * (enemy.cargo[1] - enemy.cargo[0]));
            for (let j = 0; j < cargoCount; j++) {
                const item = CARGO_ITEMS[Math.floor(Math.random() * CARGO_ITEMS.length)];
                spawnPickup(
                    enemy.x + (Math.random() - 0.5) * 50,
                    enemy.y + (Math.random() - 0.5) * 50,
                    'cargo', 0, item
                );
            }

            // Boss killed = victory
            if (enemy.isBoss) {
                showVictory();
            }

            entityContainer.removeChild(enemy.sprite);
            enemies.splice(i, 1);
            continue;
        }

        enemy.sprite.x = enemy.x;
        enemy.sprite.y = enemy.y;
        enemy.sprite.rotation = enemy.angle;
    }

    // Spawn enemies if needed
    if (enemies.length < 5 + gameState.day) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 600 + Math.random() * 400;
        const ex = player.x + Math.cos(angle) * dist;
        const ey = player.y + Math.sin(angle) * dist;

        if (ex > 100 && ex < MAP_SIZE - 100 && ey > 100 && ey < MAP_SIZE - 100) {
            const types = ['MERCHANT', 'MERCHANT', 'NAVY', 'RAIDER'];
            if (gameState.day > 5 && Math.random() < 0.1) types.push('CAPTAIN');
            const type = types[Math.floor(Math.random() * types.length)];
            spawnEnemy(type, ex, ey);
        }
    }
}

// Fire enemy cannon
function fireEnemyCannon(enemy) {
    const angle = enemy.angle + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
    const bullet = {
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * 300,
        vy: Math.sin(angle) * 300,
        damage: enemy.damage,
        range: 250,
        traveled: 0,
        owner: 'enemy',
        sprite: new PIXI.Graphics()
    };

    bullet.sprite.beginFill(0xFF4040);
    bullet.sprite.drawCircle(0, 0, 3);
    bullet.sprite.endFill();
    bullet.sprite.x = bullet.x;
    bullet.sprite.y = bullet.y;

    bulletContainer.addChild(bullet.sprite);
    bullets.push(bullet);
}

// Update bullets
function updateBullets(delta) {
    const dt = delta / 60;

    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        const moveX = bullet.vx * dt;
        const moveY = bullet.vy * dt;
        bullet.x += moveX;
        bullet.y += moveY;
        bullet.traveled += Math.sqrt(moveX * moveX + moveY * moveY);
        bullet.sprite.x = bullet.x;
        bullet.sprite.y = bullet.y;

        // Check range
        if (bullet.traveled > bullet.range) {
            bulletContainer.removeChild(bullet.sprite);
            bullets.splice(i, 1);
            continue;
        }

        // Hit detection
        if (bullet.owner === 'player') {
            for (const enemy of enemies) {
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                if (dx * dx + dy * dy < 400) {
                    enemy.health -= bullet.damage;
                    bulletContainer.removeChild(bullet.sprite);
                    bullets.splice(i, 1);
                    break;
                }
            }
        } else if (bullet.owner === 'enemy') {
            const dx = bullet.x - player.x;
            const dy = bullet.y - player.y;
            if (dx * dx + dy * dy < 400) {
                player.armor -= bullet.damage;
                bulletContainer.removeChild(bullet.sprite);
                bullets.splice(i, 1);
                if (player.armor <= 0) {
                    endDay(true);
                }
            }
        }
    }
}

// Update pickups
function updatePickups(delta) {
    const dt = delta / 60;

    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        pickup.timer -= dt;

        // Collect if close
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        if (dx * dx + dy * dy < 900) {
            if (pickup.type === 'gold') {
                gameState.gold += pickup.value;
            } else if (gameState.cargo.length < gameState.cargoCapacity) {
                gameState.cargo.push(pickup.item);
            }
            pickupContainer.removeChild(pickup.sprite);
            pickups.splice(i, 1);
            continue;
        }

        // Expire
        if (pickup.timer <= 0) {
            pickupContainer.removeChild(pickup.sprite);
            pickups.splice(i, 1);
            continue;
        }

        // Blink when about to expire
        pickup.sprite.alpha = pickup.timer < 3 ? 0.5 + Math.sin(pickup.timer * 10) * 0.5 : 1;
    }
}

// Update camera
function updateCamera() {
    worldContainer.x = app.screen.width / 2 - player.x;
    worldContainer.y = app.screen.height / 2 - player.y;
}

// Update minimap
function updateMinimap() {
    minimapContainer.removeChildren();

    const mapSize = 120;
    const mapX = app.screen.width - mapSize - 20;
    const mapY = app.screen.height - mapSize - 20;

    // Background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x0a1520, 0.8);
    bg.drawRect(mapX, mapY, mapSize, mapSize);
    bg.endFill();
    minimapContainer.addChild(bg);

    // Explored areas
    const scale = mapSize / MAP_SIZE;
    for (const key of gameState.explored) {
        const [ex, ey] = key.split(',').map(Number);
        const explored = new PIXI.Graphics();
        explored.beginFill(0x2a4060, 0.5);
        explored.drawRect(mapX + ex * 200 * scale, mapY + ey * 200 * scale, 200 * scale, 200 * scale);
        explored.endFill();
        minimapContainer.addChild(explored);
    }

    // Islands
    for (const island of islands) {
        const dot = new PIXI.Graphics();
        dot.beginFill(0x408040);
        dot.drawCircle(mapX + island.x * scale, mapY + island.y * scale, 3);
        dot.endFill();
        minimapContainer.addChild(dot);
    }

    // Player
    const playerDot = new PIXI.Graphics();
    playerDot.beginFill(0x00FF00);
    playerDot.drawCircle(mapX + player.x * scale, mapY + player.y * scale, 4);
    playerDot.endFill();
    minimapContainer.addChild(playerDot);

    // Enemies
    for (const enemy of enemies) {
        const enemyDot = new PIXI.Graphics();
        enemyDot.beginFill(enemy.isBoss ? 0xFF0000 : 0xFF6060);
        enemyDot.drawCircle(mapX + enemy.x * scale, mapY + enemy.y * scale, enemy.isBoss ? 4 : 2);
        enemyDot.endFill();
        minimapContainer.addChild(enemyDot);
    }
}

// UI
const uiElements = {};

function createUI() {
    // Top bar
    const topBar = new PIXI.Graphics();
    topBar.beginFill(0x000000, 0.7);
    topBar.drawRect(0, 0, 960, 50);
    topBar.endFill();
    uiContainer.addChild(topBar);

    // Health bar
    uiElements.healthBg = new PIXI.Graphics();
    uiElements.healthBg.x = 20;
    uiElements.healthBg.y = 15;
    uiContainer.addChild(uiElements.healthBg);

    uiElements.health = new PIXI.Text('Armor: 100', { fontSize: 14, fill: 0xFFFFFF });
    uiElements.health.x = 20;
    uiElements.health.y = 32;
    uiContainer.addChild(uiElements.health);

    // Speed indicator
    uiElements.speed = new PIXI.Text('Speed: STOP', { fontSize: 14, fill: 0x80C0FF });
    uiElements.speed.x = 200;
    uiElements.speed.y = 15;
    uiContainer.addChild(uiElements.speed);

    // Day timer
    uiElements.day = new PIXI.Text('Day 1 - 2:00', { fontSize: 18, fill: 0xFFD700 });
    uiElements.day.x = 400;
    uiElements.day.y = 15;
    uiContainer.addChild(uiElements.day);

    // Gold
    uiElements.gold = new PIXI.Text('Gold: 100', { fontSize: 16, fill: 0xFFD700 });
    uiElements.gold.x = 600;
    uiElements.gold.y = 15;
    uiContainer.addChild(uiElements.gold);

    // Cargo
    uiElements.cargo = new PIXI.Text('Cargo: 0/15', { fontSize: 14, fill: 0xC0A080 });
    uiElements.cargo.x = 750;
    uiElements.cargo.y = 15;
    uiContainer.addChild(uiElements.cargo);

    // Bottom bar - controls
    const bottomBar = new PIXI.Graphics();
    bottomBar.beginFill(0x000000, 0.6);
    bottomBar.drawRect(0, 590, 960, 50);
    bottomBar.endFill();
    uiContainer.addChild(bottomBar);

    uiElements.controls = new PIXI.Text('[WASD] Sail | [Space] Fire | [E] Enter Port', {
        fontSize: 14, fill: 0x808080
    });
    uiElements.controls.x = 320;
    uiElements.controls.y = 605;
    uiContainer.addChild(uiElements.controls);
}

function updateUI() {
    // Health bar
    uiElements.healthBg.clear();
    uiElements.healthBg.beginFill(0x400000);
    uiElements.healthBg.drawRect(0, 0, 150, 12);
    uiElements.healthBg.endFill();
    uiElements.healthBg.beginFill(0x40C040);
    uiElements.healthBg.drawRect(0, 0, (player.armor / player.maxArmor) * 150, 12);
    uiElements.healthBg.endFill();

    uiElements.health.text = `Armor: ${Math.ceil(player.armor)}/${player.maxArmor}`;

    // Speed
    const speedPercent = Math.floor((player.speed / player.maxSpeed) * 100);
    const speedText = speedPercent === 0 ? 'STOP' : speedPercent < 50 ? 'SLOW' : speedPercent < 100 ? 'HALF' : 'FULL';
    uiElements.speed.text = `Speed: ${speedText}`;

    // Day timer
    const mins = Math.floor(gameState.dayTimer / 60);
    const secs = Math.floor(gameState.dayTimer % 60);
    uiElements.day.text = `Day ${gameState.day} - ${mins}:${secs.toString().padStart(2, '0')}`;

    // Gold
    uiElements.gold.text = `Gold: ${gameState.gold}`;

    // Cargo
    uiElements.cargo.text = `Cargo: ${gameState.cargo.length}/${gameState.cargoCapacity}`;
}

// Day system
function updateDay(delta) {
    const dt = delta / 60;
    gameState.dayTimer -= dt;

    if (gameState.dayTimer <= 0) {
        endDay(false);
    }
}

function endDay(destroyed) {
    if (destroyed) {
        // Lost some cargo
        const lostCount = Math.floor(gameState.cargo.length * 0.25);
        for (let i = 0; i < lostCount; i++) {
            if (gameState.cargo.length > 0) {
                gameState.cargo.splice(Math.floor(Math.random() * gameState.cargo.length), 1);
            }
        }
    }

    // Start new day
    gameState.day++;
    gameState.dayTimer = 120;
    player.armor = player.maxArmor;
    player.x = MAP_SIZE / 2;
    player.y = MAP_SIZE / 2;
    player.speed = 0;
    player.targetSpeed = 0;

    // Clear enemies for fresh spawns
    enemies.forEach(e => entityContainer.removeChild(e.sprite));
    enemies = [];
}

// Menu
function createMenu() {
    const bg = new PIXI.Graphics();
    bg.beginFill(0x0a1a2a, 0.95);
    bg.drawRect(0, 0, 960, 640);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('PIRATEERS', { fontSize: 64, fill: 0xD4A060, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = 480;
    title.y = 150;
    menuContainer.addChild(title);

    const subtitle = new PIXI.Text('Naval Combat Adventure', { fontSize: 24, fill: 0x8090A0 });
    subtitle.anchor.set(0.5);
    subtitle.x = 480;
    subtitle.y = 220;
    menuContainer.addChild(subtitle);

    const controls = new PIXI.Text(
        'WASD - Sail (W/S speed, A/D turn)\n' +
        'Space - Fire Cannons (broadside)\n' +
        'E - Enter Port (near island)\n\n' +
        'Sink enemy ships for gold and cargo!\n' +
        'Visit ports to sell, repair, and upgrade.\n' +
        'Defeat the Pirate Captain to win!',
        { fontSize: 16, fill: 0xA0A0A0, align: 'center', lineHeight: 24 }
    );
    controls.anchor.set(0.5);
    controls.x = 480;
    controls.y = 380;
    menuContainer.addChild(controls);

    const start = new PIXI.Text('[ Click to Set Sail ]', { fontSize: 28, fill: 0xD4A060 });
    start.anchor.set(0.5);
    start.x = 480;
    start.y = 540;
    start.eventMode = 'static';
    start.cursor = 'pointer';
    start.on('pointerdown', startGame);
    menuContainer.addChild(start);
}

function startGame() {
    gameState.phase = 'sailing';
    gameState.day = 1;
    gameState.dayTimer = 120;
    gameState.gold = 100;
    gameState.cargo = [];
    gameState.upgrades = { armor: 1, speed: 1, reload: 1, firepower: 1 };
    gameState.explored = new Set();

    player.x = MAP_SIZE / 2;
    player.y = MAP_SIZE / 2;
    player.angle = 0;
    player.speed = 0;
    player.armor = 100;
    applyUpgrades();

    enemies = [];
    bullets = [];
    pickups = [];

    menuContainer.visible = false;
}

function showVictory() {
    gameState.phase = 'victory';
    menuContainer.visible = true;
    menuContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x1a2a1a, 0.95);
    bg.drawRect(0, 0, 960, 640);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('VICTORY!', { fontSize: 64, fill: 0xD4A060, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = 480;
    title.y = 200;
    menuContainer.addChild(title);

    const subtitle = new PIXI.Text('The Pirate Captain is defeated!', { fontSize: 28, fill: 0x80FF80 });
    subtitle.anchor.set(0.5);
    subtitle.x = 480;
    subtitle.y = 280;
    menuContainer.addChild(subtitle);

    const stats = new PIXI.Text(`Days: ${gameState.day}\nGold: ${gameState.gold}`, {
        fontSize: 24, fill: 0xFFFFFF, align: 'center'
    });
    stats.anchor.set(0.5);
    stats.x = 480;
    stats.y = 380;
    menuContainer.addChild(stats);

    const restart = new PIXI.Text('[ Click to Play Again ]', { fontSize: 28, fill: 0xD4A060 });
    restart.anchor.set(0.5);
    restart.x = 480;
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

// Initialize
drawOcean();
createUI();
createMenu();

// Game loop
app.ticker.add((delta) => {
    if (gameState.phase !== 'sailing') return;

    updatePlayer(delta);
    updateEnemies(delta);
    updateBullets(delta);
    updatePickups(delta);
    updateCamera();
    updateMinimap();
    updateUI();
    updateDay(delta);
});

console.log('Pirateers loaded!');
