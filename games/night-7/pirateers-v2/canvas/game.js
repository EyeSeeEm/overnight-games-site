// Pirateers - Canvas Implementation
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game constants
const WORLD_SIZE = 3000;
const DAY_DURATION = 120; // seconds
const TILE_SIZE = 32;

// Game state
let state = 'menu'; // menu, base, sailing, port, gameover, victory
let dayNumber = 1;
let dayTimer = DAY_DURATION;
let gold = 100;
let cargo = [];
const CARGO_CAPACITY = 15;

// Camera
let camera = { x: 0, y: 0, zoom: 1.5 };

// Player ship
const player = {
    x: WORLD_SIZE / 2,
    y: WORLD_SIZE / 2,
    angle: -Math.PI / 2,
    speed: 0,
    targetSpeed: 0,
    maxSpeed: 150,
    turnRate: 2.5,
    armor: 100,
    maxArmor: 100,
    firepower: 10,
    reloadTime: 2.0,
    reloadCooldown: 0,
    // Stats levels (1-4, 3 upgrades each)
    armorLevel: 1,
    speedLevel: 1,
    reloadLevel: 1,
    firepowerLevel: 1
};

// Upgrade costs
const UPGRADE_COSTS = [100, 250, 500];

// Islands and ports
const islands = [];
const ports = [];

// Enemies
const enemies = [];
const MAX_ENEMIES = 12;

// Projectiles
const projectiles = [];

// Loot drops
const lootDrops = [];

// Fog of war - revealed areas
const revealedAreas = new Set();
const FOG_CELL_SIZE = 100;

// Cargo types
const CARGO_TYPES = {
    common: ['Rum', 'Grain', 'Fish', 'Wood'],
    uncommon: ['Spices', 'Silk', 'Sugar', 'Cotton'],
    rare: ['Gold Bars', 'Gems', 'Artifacts']
};

const CARGO_VALUES = {
    'Rum': 15, 'Grain': 10, 'Fish': 12, 'Wood': 8,
    'Spices': 35, 'Silk': 45, 'Sugar': 30, 'Cotton': 25,
    'Gold Bars': 80, 'Gems': 120, 'Artifacts': 150
};

// Input state
const keys = {};
let mouseX = 0, mouseY = 0;
let mouseDown = false;

// Current port for interaction
let currentPort = null;
let portMenuOpen = false;
let selectedPortOption = 0;

// Generate world
function generateWorld() {
    islands.length = 0;
    ports.length = 0;
    enemies.length = 0;

    // Generate islands
    for (let i = 0; i < 15; i++) {
        const angle = (i / 15) * Math.PI * 2;
        const dist = 400 + Math.random() * 1000;
        const island = {
            x: WORLD_SIZE / 2 + Math.cos(angle) * dist,
            y: WORLD_SIZE / 2 + Math.sin(angle) * dist,
            radius: 80 + Math.random() * 60,
            hasPort: Math.random() < 0.7
        };
        islands.push(island);

        if (island.hasPort) {
            ports.push({
                x: island.x,
                y: island.y - island.radius - 30,
                island: island,
                name: getPortName(ports.length),
                priceModifier: 0.8 + Math.random() * 0.4
            });
        }
    }

    // Spawn initial enemies
    spawnEnemies();
}

function getPortName(index) {
    const names = ['Port Royal', 'Tortuga', 'Nassau', 'Havana', 'Kingston',
                   'Santiago', 'Barbados', 'Trinidad', 'Curacao', 'Cartagena'];
    return names[index % names.length];
}

function spawnEnemies() {
    while (enemies.length < MAX_ENEMIES) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 300 + Math.random() * 1200;
        const x = WORLD_SIZE / 2 + Math.cos(angle) * dist;
        const y = WORLD_SIZE / 2 + Math.sin(angle) * dist;

        // Check not too close to islands
        let valid = true;
        for (const island of islands) {
            const dx = x - island.x;
            const dy = y - island.y;
            if (Math.sqrt(dx*dx + dy*dy) < island.radius + 100) {
                valid = false;
                break;
            }
        }
        if (!valid) continue;

        // Determine enemy type
        const roll = Math.random();
        let type, hp, speed, damage, goldDrop;

        if (roll < 0.4) {
            type = 'merchant';
            hp = 50;
            speed = 60;
            damage = 5;
            goldDrop = [20, 40];
        } else if (roll < 0.7) {
            type = 'navy';
            hp = 80;
            speed = 100;
            damage = 12;
            goldDrop = [30, 50];
        } else if (roll < 0.95) {
            type = 'raider';
            hp = 100;
            speed = 120;
            damage = 15;
            goldDrop = [40, 70];
        } else {
            type = 'captain';
            hp = 250;
            speed = 90;
            damage = 25;
            goldDrop = [100, 150];
        }

        enemies.push({
            x, y,
            angle: Math.random() * Math.PI * 2,
            speed: speed * 0.5,
            maxSpeed: speed,
            hp, maxHp: hp,
            damage,
            goldDrop,
            type,
            reloadCooldown: 0,
            reloadTime: type === 'captain' ? 1.5 : 2.5,
            state: 'patrol',
            targetX: x + (Math.random() - 0.5) * 400,
            targetY: y + (Math.random() - 0.5) * 400
        });
    }
}

// Reveal fog at position
function revealFog(x, y, radius) {
    const cellX = Math.floor(x / FOG_CELL_SIZE);
    const cellY = Math.floor(y / FOG_CELL_SIZE);
    const cellRadius = Math.ceil(radius / FOG_CELL_SIZE);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
        for (let dy = -cellRadius; dy <= cellRadius; dy++) {
            if (dx*dx + dy*dy <= cellRadius*cellRadius) {
                revealedAreas.add(`${cellX + dx},${cellY + dy}`);
            }
        }
    }
}

function isRevealed(x, y) {
    const cellX = Math.floor(x / FOG_CELL_SIZE);
    const cellY = Math.floor(y / FOG_CELL_SIZE);
    return revealedAreas.has(`${cellX},${cellY}`);
}

// Update functions
function updatePlayer(dt) {
    // Turn
    if (keys['a'] || keys['arrowleft']) {
        player.angle -= player.turnRate * dt;
    }
    if (keys['d'] || keys['arrowright']) {
        player.angle += player.turnRate * dt;
    }

    // Speed control
    const maxSpd = player.maxSpeed * (1 + 0.15 * (player.speedLevel - 1));
    if (keys['w'] || keys['arrowup']) {
        player.targetSpeed = Math.min(player.targetSpeed + 200 * dt, maxSpd);
    }
    if (keys['s'] || keys['arrowdown']) {
        player.targetSpeed = Math.max(player.targetSpeed - 200 * dt, 0);
    }

    // Apply acceleration/deceleration
    const accel = 150;
    if (player.speed < player.targetSpeed) {
        player.speed = Math.min(player.speed + accel * dt, player.targetSpeed);
    } else {
        player.speed = Math.max(player.speed - accel * dt, player.targetSpeed);
    }

    // Move
    player.x += Math.cos(player.angle) * player.speed * dt;
    player.y += Math.sin(player.angle) * player.speed * dt;

    // Clamp to world
    player.x = Math.max(50, Math.min(WORLD_SIZE - 50, player.x));
    player.y = Math.max(50, Math.min(WORLD_SIZE - 50, player.y));

    // Check island collision
    for (const island of islands) {
        const dx = player.x - island.x;
        const dy = player.y - island.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < island.radius + 20) {
            const pushDist = island.radius + 20 - dist;
            player.x += (dx / dist) * pushDist;
            player.y += (dy / dist) * pushDist;
            player.speed *= 0.5;
        }
    }

    // Reveal fog
    revealFog(player.x, player.y, 350);

    // Reload cooldown
    player.reloadCooldown = Math.max(0, player.reloadCooldown - dt);

    // Fire cannons
    if ((keys[' '] || mouseDown) && player.reloadCooldown <= 0) {
        fireCannons(player);
        const reload = player.reloadTime - 0.15 * (player.reloadLevel - 1);
        player.reloadCooldown = Math.max(0.5, reload);
    }

    // Check port proximity
    currentPort = null;
    for (const port of ports) {
        const dx = player.x - port.x;
        const dy = player.y - port.y;
        if (Math.sqrt(dx*dx + dy*dy) < 60) {
            currentPort = port;
            break;
        }
    }
}

function fireCannons(ship) {
    const isPlayer = ship === player;
    const damage = isPlayer ?
        player.firepower * (1 + 0.1 * (player.firepowerLevel - 1)) :
        ship.damage;

    // Fire from both sides
    const perpAngle = ship.angle + Math.PI / 2;
    const spreadAngle = Math.PI / 6; // 30 degrees

    for (let side = -1; side <= 1; side += 2) {
        const baseAngle = ship.angle + side * Math.PI / 2;
        const numBalls = 3;

        for (let i = 0; i < numBalls; i++) {
            const angleOffset = ((i - (numBalls-1)/2) / numBalls) * spreadAngle;
            const angle = baseAngle + angleOffset;

            projectiles.push({
                x: ship.x + Math.cos(perpAngle) * side * 15,
                y: ship.y + Math.sin(perpAngle) * side * 15,
                vx: Math.cos(angle) * 400,
                vy: Math.sin(angle) * 400,
                damage,
                fromPlayer: isPlayer,
                life: 0.75
            });
        }
    }
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        // AI behavior
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distToPlayer = Math.sqrt(dx*dx + dy*dy);

        // Update reload
        enemy.reloadCooldown = Math.max(0, enemy.reloadCooldown - dt);

        if (distToPlayer < 400) {
            enemy.state = 'combat';

            // Turn to face player broadside
            const targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
            let angleDiff = targetAngle - enemy.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            enemy.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 1.5 * dt);

            // Move to optimal range
            if (distToPlayer > 250) {
                enemy.speed = Math.min(enemy.speed + 80 * dt, enemy.maxSpeed);
            } else if (distToPlayer < 150) {
                enemy.speed = Math.max(enemy.speed - 80 * dt, 0);
            }

            // Fire if in range and broadside
            if (distToPlayer < 350 && enemy.reloadCooldown <= 0) {
                fireCannons(enemy);
                enemy.reloadCooldown = enemy.reloadTime;
            }
        } else {
            enemy.state = 'patrol';

            // Move to patrol target
            const tdx = enemy.targetX - enemy.x;
            const tdy = enemy.targetY - enemy.y;
            const targetDist = Math.sqrt(tdx*tdx + tdy*tdy);

            if (targetDist < 50) {
                enemy.targetX = enemy.x + (Math.random() - 0.5) * 400;
                enemy.targetY = enemy.y + (Math.random() - 0.5) * 400;
            } else {
                const targetAngle = Math.atan2(tdy, tdx);
                let angleDiff = targetAngle - enemy.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                enemy.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 1.0 * dt);
            }

            enemy.speed = enemy.maxSpeed * 0.5;
        }

        // Move
        enemy.x += Math.cos(enemy.angle) * enemy.speed * dt;
        enemy.y += Math.sin(enemy.angle) * enemy.speed * dt;

        // Clamp to world
        enemy.x = Math.max(100, Math.min(WORLD_SIZE - 100, enemy.x));
        enemy.y = Math.max(100, Math.min(WORLD_SIZE - 100, enemy.y));

        // Island collision
        for (const island of islands) {
            const idx = enemy.x - island.x;
            const idy = enemy.y - island.y;
            const dist = Math.sqrt(idx*idx + idy*idy);
            if (dist < island.radius + 30) {
                const pushDist = island.radius + 30 - dist;
                enemy.x += (idx / dist) * pushDist;
                enemy.y += (idy / dist) * pushDist;
            }
        }
    }
}

function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        if (p.life <= 0) {
            projectiles.splice(i, 1);
            continue;
        }

        // Check hits
        if (p.fromPlayer) {
            for (const enemy of enemies) {
                const dx = p.x - enemy.x;
                const dy = p.y - enemy.y;
                if (Math.sqrt(dx*dx + dy*dy) < 25) {
                    enemy.hp -= p.damage;
                    projectiles.splice(i, 1);

                    if (enemy.hp <= 0) {
                        destroyEnemy(enemy);
                    }
                    break;
                }
            }
        } else {
            const dx = p.x - player.x;
            const dy = p.y - player.y;
            if (Math.sqrt(dx*dx + dy*dy) < 20) {
                player.armor -= p.damage;
                projectiles.splice(i, 1);

                if (player.armor <= 0) {
                    endDay(true);
                }
            }
        }
    }
}

function destroyEnemy(enemy) {
    // Drop gold
    const goldAmount = enemy.goldDrop[0] + Math.floor(Math.random() * (enemy.goldDrop[1] - enemy.goldDrop[0] + 1));

    // Drop cargo
    let numDrops;
    if (enemy.type === 'merchant') numDrops = 2 + Math.floor(Math.random() * 3);
    else if (enemy.type === 'navy') numDrops = 1 + Math.floor(Math.random() * 2);
    else if (enemy.type === 'raider') numDrops = 2 + Math.floor(Math.random() * 2);
    else numDrops = 4 + Math.floor(Math.random() * 3); // captain

    for (let i = 0; i < numDrops; i++) {
        const roll = Math.random();
        let type;
        if (roll < 0.6) {
            type = CARGO_TYPES.common[Math.floor(Math.random() * CARGO_TYPES.common.length)];
        } else if (roll < 0.9) {
            type = CARGO_TYPES.uncommon[Math.floor(Math.random() * CARGO_TYPES.uncommon.length)];
        } else {
            type = CARGO_TYPES.rare[Math.floor(Math.random() * CARGO_TYPES.rare.length)];
        }

        lootDrops.push({
            x: enemy.x + (Math.random() - 0.5) * 40,
            y: enemy.y + (Math.random() - 0.5) * 40,
            type,
            gold: Math.floor(goldAmount / numDrops),
            life: 15
        });
    }

    // Check victory
    if (enemy.type === 'captain') {
        state = 'victory';
    }

    // Remove enemy and spawn new one
    const idx = enemies.indexOf(enemy);
    if (idx >= 0) enemies.splice(idx, 1);

    setTimeout(spawnEnemies, 3000);
}

function updateLoot(dt) {
    for (let i = lootDrops.length - 1; i >= 0; i--) {
        const loot = lootDrops[i];
        loot.life -= dt;

        if (loot.life <= 0) {
            lootDrops.splice(i, 1);
            continue;
        }

        // Check collection
        const dx = loot.x - player.x;
        const dy = loot.y - player.y;
        if (Math.sqrt(dx*dx + dy*dy) < 40) {
            gold += loot.gold;
            if (cargo.length < CARGO_CAPACITY) {
                cargo.push(loot.type);
            }
            lootDrops.splice(i, 1);
        }
    }
}

function endDay(shipDestroyed) {
    if (shipDestroyed) {
        // Lose 25% of cargo
        const toLose = Math.floor(cargo.length * 0.25);
        for (let i = 0; i < toLose; i++) {
            cargo.splice(Math.floor(Math.random() * cargo.length), 1);
        }
    }

    // Full repair
    player.armor = player.maxArmor;

    state = 'base';
    dayNumber++;
}

// Render functions
function render() {
    ctx.fillStyle = '#0a2a4a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state === 'menu') {
        renderMenu();
    } else if (state === 'base') {
        renderBase();
    } else if (state === 'sailing') {
        renderSailing();
    } else if (state === 'port') {
        renderPortMenu();
    } else if (state === 'gameover') {
        renderGameOver();
    } else if (state === 'victory') {
        renderVictory();
    }
}

function renderMenu() {
    ctx.fillStyle = '#d4a06a';
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('PIRATEERS', canvas.width/2, 200);

    ctx.font = '24px Georgia';
    ctx.fillStyle = '#8bc';
    ctx.fillText('Sail the seas, plunder ships, defeat the Pirate Captain!', canvas.width/2, 260);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px Georgia';
    ctx.fillText('Press ENTER to Start', canvas.width/2, 400);

    ctx.font = '18px Georgia';
    ctx.fillStyle = '#8bc';
    ctx.fillText('WASD/Arrows - Sail | SPACE/Click - Fire Cannons | E - Enter Port', canvas.width/2, 500);
}

function renderBase() {
    ctx.fillStyle = '#1a3a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#d4a06a';
    ctx.font = 'bold 36px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('Home Port', canvas.width/2, 60);

    ctx.font = '20px Georgia';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Gold: ${gold}  |  Day: ${dayNumber}`, canvas.width/2, 100);

    // Ship display
    ctx.fillStyle = '#4a2a1a';
    ctx.fillRect(canvas.width/2 - 100, 130, 200, 120);
    ctx.strokeStyle = '#8b7355';
    ctx.strokeRect(canvas.width/2 - 100, 130, 200, 120);

    ctx.fillStyle = '#d4a06a';
    ctx.font = '16px Georgia';
    ctx.fillText('YOUR SHIP', canvas.width/2, 155);
    ctx.fillText(`Armor: ${player.maxArmor} (Lv.${player.armorLevel})`, canvas.width/2, 180);
    ctx.fillText(`Speed: ${Math.floor(player.maxSpeed * (1 + 0.15 * (player.speedLevel - 1)))} (Lv.${player.speedLevel})`, canvas.width/2, 200);
    ctx.fillText(`Reload: ${(player.reloadTime - 0.15 * (player.reloadLevel - 1)).toFixed(1)}s (Lv.${player.reloadLevel})`, canvas.width/2, 220);
    ctx.fillText(`Firepower: ${Math.floor(player.firepower * (1 + 0.1 * (player.firepowerLevel - 1)))} (Lv.${player.firepowerLevel})`, canvas.width/2, 240);

    // Upgrade buttons
    const stats = ['armor', 'speed', 'reload', 'firepower'];
    const statLevels = [player.armorLevel, player.speedLevel, player.reloadLevel, player.firepowerLevel];

    ctx.font = '16px Georgia';
    for (let i = 0; i < 4; i++) {
        const y = 280 + i * 45;
        const level = statLevels[i];
        const canUpgrade = level < 4;
        const cost = canUpgrade ? UPGRADE_COSTS[level - 1] : 0;
        const canAfford = gold >= cost;

        ctx.fillStyle = canUpgrade && canAfford ? '#2a5a3a' : '#3a3a3a';
        ctx.fillRect(canvas.width/2 - 150, y, 300, 35);
        ctx.strokeStyle = '#8b7355';
        ctx.strokeRect(canvas.width/2 - 150, y, 300, 35);

        ctx.fillStyle = canUpgrade ? (canAfford ? '#8f8' : '#888') : '#666';
        ctx.textAlign = 'center';
        const text = canUpgrade ?
            `Upgrade ${stats[i].charAt(0).toUpperCase() + stats[i].slice(1)} (${cost} gold) [${i+1}]` :
            `${stats[i].charAt(0).toUpperCase() + stats[i].slice(1)} MAXED`;
        ctx.fillText(text, canvas.width/2, y + 23);
    }

    // Cargo display
    ctx.fillStyle = '#d4a06a';
    ctx.font = '18px Georgia';
    ctx.fillText(`Cargo: ${cargo.length}/${CARGO_CAPACITY}`, canvas.width/2, 480);

    if (cargo.length > 0) {
        const cargoSummary = {};
        cargo.forEach(c => cargoSummary[c] = (cargoSummary[c] || 0) + 1);
        const cargoText = Object.entries(cargoSummary).map(([k,v]) => `${k} x${v}`).join(', ');
        ctx.font = '14px Georgia';
        ctx.fillText(cargoText.slice(0, 60), canvas.width/2, 505);
    }

    // Sell cargo
    if (cargo.length > 0) {
        const totalValue = cargo.reduce((sum, c) => sum + CARGO_VALUES[c], 0);
        ctx.fillStyle = '#4a6a4a';
        ctx.fillRect(canvas.width/2 - 100, 525, 200, 35);
        ctx.strokeStyle = '#8f8';
        ctx.strokeRect(canvas.width/2 - 100, 525, 200, 35);
        ctx.fillStyle = '#8f8';
        ctx.font = '16px Georgia';
        ctx.fillText(`Sell All Cargo (${totalValue} gold) [S]`, canvas.width/2, 548);
    }

    // Set sail button
    ctx.fillStyle = '#4a5a8a';
    ctx.fillRect(canvas.width/2 - 100, 580, 200, 40);
    ctx.strokeStyle = '#8bc';
    ctx.strokeRect(canvas.width/2 - 100, 580, 200, 40);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Georgia';
    ctx.fillText('SET SAIL [ENTER]', canvas.width/2, 607);
}

function renderSailing() {
    // Update camera
    camera.x = player.x - canvas.width / (2 * camera.zoom);
    camera.y = player.y - canvas.height / (2 * camera.zoom);

    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Draw water grid
    ctx.strokeStyle = '#0a3a6a';
    ctx.lineWidth = 1;
    const gridSize = 100;
    const startX = Math.floor(camera.x / gridSize) * gridSize;
    const startY = Math.floor(camera.y / gridSize) * gridSize;
    for (let x = startX; x < camera.x + canvas.width/camera.zoom + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, camera.y);
        ctx.lineTo(x, camera.y + canvas.height/camera.zoom);
        ctx.stroke();
    }
    for (let y = startY; y < camera.y + canvas.height/camera.zoom + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(camera.x, y);
        ctx.lineTo(camera.x + canvas.width/camera.zoom, y);
        ctx.stroke();
    }

    // Draw islands
    for (const island of islands) {
        if (!isRevealed(island.x, island.y)) continue;

        ctx.fillStyle = '#5a4a2a';
        ctx.beginPath();
        ctx.arc(island.x, island.y, island.radius, 0, Math.PI * 2);
        ctx.fill();

        // Beach ring
        ctx.strokeStyle = '#c4a060';
        ctx.lineWidth = 8;
        ctx.stroke();

        // Trees (simple circles)
        ctx.fillStyle = '#2a5a2a';
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const r = island.radius * 0.5;
            ctx.beginPath();
            ctx.arc(island.x + Math.cos(a) * r, island.y + Math.sin(a) * r, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw ports
    for (const port of ports) {
        if (!isRevealed(port.x, port.y)) continue;

        ctx.fillStyle = '#8b7355';
        ctx.fillRect(port.x - 25, port.y - 15, 50, 30);
        ctx.strokeStyle = '#4a3a2a';
        ctx.lineWidth = 2;
        ctx.strokeRect(port.x - 25, port.y - 15, 50, 30);

        // Flag
        ctx.fillStyle = '#c44';
        ctx.fillRect(port.x + 20, port.y - 35, 15, 10);
        ctx.strokeStyle = '#4a3a2a';
        ctx.beginPath();
        ctx.moveTo(port.x + 20, port.y - 35);
        ctx.lineTo(port.x + 20, port.y - 10);
        ctx.stroke();
    }

    // Draw loot
    for (const loot of lootDrops) {
        ctx.fillStyle = loot.life < 3 ? (Math.floor(loot.life * 4) % 2 ? '#a85' : '#fc0') : '#a85';
        ctx.fillRect(loot.x - 8, loot.y - 8, 16, 16);
        ctx.strokeStyle = '#fc0';
        ctx.lineWidth = 2;
        ctx.strokeRect(loot.x - 8, loot.y - 8, 16, 16);
    }

    // Draw enemies
    for (const enemy of enemies) {
        if (!isRevealed(enemy.x, enemy.y)) continue;

        const colors = {
            merchant: '#6a8a6a',
            navy: '#4a6a9a',
            raider: '#8a4a4a',
            captain: '#8a6a2a'
        };

        drawShip(enemy.x, enemy.y, enemy.angle, colors[enemy.type], enemy.type === 'captain' ? 1.3 : 1);

        // HP bar
        const hpPct = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#400';
        ctx.fillRect(enemy.x - 20, enemy.y - 35, 40, 6);
        ctx.fillStyle = hpPct > 0.5 ? '#4a4' : (hpPct > 0.25 ? '#aa4' : '#a44');
        ctx.fillRect(enemy.x - 20, enemy.y - 35, 40 * hpPct, 6);
    }

    // Draw player
    drawShip(player.x, player.y, player.angle, '#c4a060', 1);

    // Draw projectiles
    ctx.fillStyle = '#222';
    for (const p of projectiles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw fog of war
    ctx.fillStyle = 'rgba(0, 10, 30, 0.85)';
    for (let x = Math.floor(camera.x / FOG_CELL_SIZE) - 1; x <= Math.ceil((camera.x + canvas.width/camera.zoom) / FOG_CELL_SIZE) + 1; x++) {
        for (let y = Math.floor(camera.y / FOG_CELL_SIZE) - 1; y <= Math.ceil((camera.y + canvas.height/camera.zoom) / FOG_CELL_SIZE) + 1; y++) {
            if (!revealedAreas.has(`${x},${y}`)) {
                ctx.fillRect(x * FOG_CELL_SIZE, y * FOG_CELL_SIZE, FOG_CELL_SIZE, FOG_CELL_SIZE);
            }
        }
    }

    ctx.restore();

    // Draw HUD
    renderHUD();

    // Port prompt
    if (currentPort && !portMenuOpen) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(canvas.width/2 - 120, canvas.height - 80, 240, 40);
        ctx.strokeStyle = '#fc0';
        ctx.strokeRect(canvas.width/2 - 120, canvas.height - 80, 240, 40);
        ctx.fillStyle = '#fc0';
        ctx.font = 'bold 16px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(`Press E to enter ${currentPort.name}`, canvas.width/2, canvas.height - 55);
    }

    // Port menu overlay
    if (portMenuOpen && currentPort) {
        renderPortOverlay();
    }
}

function drawShip(x, y, angle, color, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Hull
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(-15, -12);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-15, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Mast
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(-5, -2, 4, 4);

    // Sail
    ctx.fillStyle = '#f5f5dc';
    ctx.beginPath();
    ctx.moveTo(-3, -18);
    ctx.lineTo(-3, 18);
    ctx.lineTo(8, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function renderHUD() {
    // Health bar (top-left)
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(10, 10, 200, 50);
    ctx.strokeStyle = '#8b7355';
    ctx.strokeRect(10, 10, 200, 50);

    ctx.fillStyle = '#d4a06a';
    ctx.font = '14px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('HP:', 20, 30);

    const hpPct = player.armor / player.maxArmor;
    ctx.fillStyle = '#400';
    ctx.fillRect(50, 18, 150, 16);
    ctx.fillStyle = hpPct > 0.5 ? '#4a4' : (hpPct > 0.25 ? '#aa4' : '#a44');
    ctx.fillRect(50, 18, 150 * hpPct, 16);
    ctx.strokeStyle = '#666';
    ctx.strokeRect(50, 18, 150, 16);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${Math.ceil(player.armor)}/${player.maxArmor}`, 55, 31);

    // Speed
    ctx.fillStyle = '#d4a06a';
    ctx.fillText('Speed:', 20, 52);
    const maxSpd = player.maxSpeed * (1 + 0.15 * (player.speedLevel - 1));
    const spdPct = player.speed / maxSpd;
    ctx.fillStyle = '#234';
    ctx.fillRect(70, 40, 130, 14);
    ctx.fillStyle = '#48c';
    ctx.fillRect(70, 40, 130 * spdPct, 14);
    ctx.strokeStyle = '#666';
    ctx.strokeRect(70, 40, 130, 14);

    // Day timer (top-right)
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(canvas.width - 130, 10, 120, 50);
    ctx.strokeStyle = '#8b7355';
    ctx.strokeRect(canvas.width - 130, 10, 120, 50);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`Day ${dayNumber}`, canvas.width - 70, 32);

    const mins = Math.floor(dayTimer / 60);
    const secs = Math.floor(dayTimer % 60);
    ctx.fillStyle = dayTimer < 30 ? '#f44' : '#8bc';
    ctx.font = '20px Georgia';
    ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, canvas.width - 70, 54);

    // Gold and cargo (bottom)
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(10, canvas.height - 70, 300, 60);
    ctx.strokeStyle = '#8b7355';
    ctx.strokeRect(10, canvas.height - 70, 300, 60);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`Gold: ${gold}`, 20, canvas.height - 45);

    ctx.fillStyle = '#d4a06a';
    ctx.fillText(`Cargo: ${cargo.length}/${CARGO_CAPACITY}`, 150, canvas.height - 45);

    // Cargo preview
    if (cargo.length > 0) {
        const cargoSummary = {};
        cargo.forEach(c => cargoSummary[c] = (cargoSummary[c] || 0) + 1);
        const cargoText = Object.entries(cargoSummary).slice(0, 4).map(([k,v]) => `${k.slice(0,6)}:${v}`).join(' ');
        ctx.font = '12px Georgia';
        ctx.fillStyle = '#8bc';
        ctx.fillText(cargoText, 20, canvas.height - 20);
    }

    // Mini-map (bottom-right)
    const mapSize = 120;
    const mapX = canvas.width - mapSize - 15;
    const mapY = canvas.height - mapSize - 15;

    ctx.fillStyle = 'rgba(0,20,40,0.8)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    ctx.strokeStyle = '#8b7355';
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    const mapScale = mapSize / WORLD_SIZE;

    // Islands on minimap
    ctx.fillStyle = '#5a4a2a';
    for (const island of islands) {
        if (isRevealed(island.x, island.y)) {
            ctx.beginPath();
            ctx.arc(mapX + island.x * mapScale, mapY + island.y * mapScale, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Enemies on minimap
    for (const enemy of enemies) {
        if (isRevealed(enemy.x, enemy.y)) {
            ctx.fillStyle = enemy.type === 'captain' ? '#fc0' : '#f44';
            ctx.fillRect(mapX + enemy.x * mapScale - 1, mapY + enemy.y * mapScale - 1, 3, 3);
        }
    }

    // Player on minimap
    ctx.fillStyle = '#4f4';
    ctx.beginPath();
    ctx.arc(mapX + player.x * mapScale, mapY + player.y * mapScale, 3, 0, Math.PI * 2);
    ctx.fill();
}

function renderPortOverlay() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#d4a06a';
    ctx.font = 'bold 32px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(currentPort.name, canvas.width/2, 80);

    const options = ['Trade', 'Repair', 'Upgrades', 'Leave Port'];
    for (let i = 0; i < options.length; i++) {
        const y = 150 + i * 60;
        ctx.fillStyle = selectedPortOption === i ? '#4a6a4a' : '#2a3a2a';
        ctx.fillRect(canvas.width/2 - 120, y, 240, 45);
        ctx.strokeStyle = selectedPortOption === i ? '#8f8' : '#666';
        ctx.strokeRect(canvas.width/2 - 120, y, 240, 45);

        ctx.fillStyle = selectedPortOption === i ? '#fff' : '#aaa';
        ctx.font = '20px Georgia';
        ctx.fillText(options[i], canvas.width/2, y + 30);
    }

    ctx.font = '14px Georgia';
    ctx.fillStyle = '#888';
    ctx.fillText('W/S to select, ENTER to confirm', canvas.width/2, 420);
}

function renderPortMenu() {
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#d4a06a';
    ctx.font = 'bold 32px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentPort.name} - Trading Post`, canvas.width/2, 50);

    ctx.font = '18px Georgia';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Gold: ${gold}`, canvas.width/2, 85);

    // Sell section
    ctx.fillStyle = '#d4a06a';
    ctx.font = 'bold 20px Georgia';
    ctx.fillText('SELL CARGO', canvas.width/2, 130);

    if (cargo.length > 0) {
        const cargoSummary = {};
        cargo.forEach(c => cargoSummary[c] = (cargoSummary[c] || 0) + 1);

        let y = 160;
        ctx.font = '16px Georgia';
        for (const [item, count] of Object.entries(cargoSummary)) {
            const value = Math.floor(CARGO_VALUES[item] * currentPort.priceModifier);
            ctx.fillStyle = '#8bc';
            ctx.fillText(`${item} x${count} - ${value * count} gold (${value} each)`, canvas.width/2, y);
            y += 25;
        }

        const totalValue = cargo.reduce((sum, c) => sum + Math.floor(CARGO_VALUES[c] * currentPort.priceModifier), 0);
        ctx.fillStyle = '#4a6a4a';
        ctx.fillRect(canvas.width/2 - 100, y + 10, 200, 40);
        ctx.strokeStyle = '#8f8';
        ctx.strokeRect(canvas.width/2 - 100, y + 10, 200, 40);
        ctx.fillStyle = '#8f8';
        ctx.font = 'bold 18px Georgia';
        ctx.fillText(`SELL ALL (${totalValue} gold) [S]`, canvas.width/2, y + 37);
    } else {
        ctx.fillStyle = '#666';
        ctx.font = '16px Georgia';
        ctx.fillText('No cargo to sell', canvas.width/2, 170);
    }

    // Repair option
    if (player.armor < player.maxArmor) {
        const repairCost = Math.ceil((player.maxArmor - player.armor) * 0.5);
        ctx.fillStyle = '#4a5a6a';
        ctx.fillRect(canvas.width/2 - 100, 350, 200, 40);
        ctx.strokeStyle = gold >= repairCost ? '#8bc' : '#666';
        ctx.strokeRect(canvas.width/2 - 100, 350, 200, 40);
        ctx.fillStyle = gold >= repairCost ? '#8bc' : '#666';
        ctx.font = '16px Georgia';
        ctx.fillText(`Repair (${repairCost} gold) [R]`, canvas.width/2, 377);
    }

    // Leave
    ctx.fillStyle = '#5a4a4a';
    ctx.fillRect(canvas.width/2 - 100, 450, 200, 40);
    ctx.strokeStyle = '#c88';
    ctx.strokeRect(canvas.width/2 - 100, 450, 200, 40);
    ctx.fillStyle = '#c88';
    ctx.font = 'bold 18px Georgia';
    ctx.fillText('LEAVE PORT [ESC]', canvas.width/2, 477);
}

function renderGameOver() {
    ctx.fillStyle = '#200';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#c44';
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, 250);

    ctx.fillStyle = '#888';
    ctx.font = '24px Georgia';
    ctx.fillText(`You survived ${dayNumber} days`, canvas.width/2, 320);
    ctx.fillText(`Total gold earned: ${gold}`, canvas.width/2, 360);

    ctx.fillStyle = '#ffd700';
    ctx.font = '20px Georgia';
    ctx.fillText('Press ENTER to try again', canvas.width/2, 450);
}

function renderVictory() {
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width/2, 200);

    ctx.fillStyle = '#8f8';
    ctx.font = '28px Georgia';
    ctx.fillText('You defeated the Pirate Captain!', canvas.width/2, 270);

    ctx.fillStyle = '#d4a06a';
    ctx.font = '22px Georgia';
    ctx.fillText(`Completed in ${dayNumber} days`, canvas.width/2, 330);
    ctx.fillText(`Final gold: ${gold}`, canvas.width/2, 370);

    ctx.fillStyle = '#ffd700';
    ctx.font = '20px Georgia';
    ctx.fillText('Press ENTER to play again', canvas.width/2, 450);
}

// Input handling
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (state === 'menu' && e.key === 'Enter') {
        generateWorld();
        state = 'base';
    } else if (state === 'base') {
        if (e.key === 'Enter') {
            player.x = WORLD_SIZE / 2;
            player.y = WORLD_SIZE / 2;
            player.speed = 0;
            player.targetSpeed = 0;
            dayTimer = DAY_DURATION;
            state = 'sailing';
        } else if (e.key >= '1' && e.key <= '4') {
            const idx = parseInt(e.key) - 1;
            const stats = ['armor', 'speed', 'reload', 'firepower'];
            const levels = [player.armorLevel, player.speedLevel, player.reloadLevel, player.firepowerLevel];
            if (levels[idx] < 4) {
                const cost = UPGRADE_COSTS[levels[idx] - 1];
                if (gold >= cost) {
                    gold -= cost;
                    if (idx === 0) { player.armorLevel++; player.maxArmor += 50; player.armor = player.maxArmor; }
                    else if (idx === 1) player.speedLevel++;
                    else if (idx === 2) player.reloadLevel++;
                    else player.firepowerLevel++;
                }
            }
        } else if (e.key.toLowerCase() === 's' && cargo.length > 0) {
            const totalValue = cargo.reduce((sum, c) => sum + CARGO_VALUES[c], 0);
            gold += totalValue;
            cargo = [];
        }
    } else if (state === 'sailing') {
        if (e.key.toLowerCase() === 'e' && currentPort && !portMenuOpen) {
            portMenuOpen = true;
            selectedPortOption = 0;
        } else if (portMenuOpen) {
            if (e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') {
                selectedPortOption = (selectedPortOption - 1 + 4) % 4;
            } else if (e.key.toLowerCase() === 's' || e.key === 'ArrowDown') {
                selectedPortOption = (selectedPortOption + 1) % 4;
            } else if (e.key === 'Enter') {
                if (selectedPortOption === 0) {
                    state = 'port';
                    portMenuOpen = false;
                } else if (selectedPortOption === 1) {
                    // Repair
                    const repairCost = Math.ceil((player.maxArmor - player.armor) * 0.5);
                    if (gold >= repairCost && player.armor < player.maxArmor) {
                        gold -= repairCost;
                        player.armor = player.maxArmor;
                    }
                } else if (selectedPortOption === 2) {
                    // Go to base for upgrades
                    state = 'base';
                    portMenuOpen = false;
                } else {
                    portMenuOpen = false;
                }
            } else if (e.key === 'Escape') {
                portMenuOpen = false;
            }
        } else if (e.key === 'Escape') {
            endDay(false);
        }
    } else if (state === 'port') {
        if (e.key === 'Escape') {
            state = 'sailing';
        } else if (e.key.toLowerCase() === 's' && cargo.length > 0) {
            const totalValue = cargo.reduce((sum, c) => sum + Math.floor(CARGO_VALUES[c] * currentPort.priceModifier), 0);
            gold += totalValue;
            cargo = [];
        } else if (e.key.toLowerCase() === 'r') {
            const repairCost = Math.ceil((player.maxArmor - player.armor) * 0.5);
            if (gold >= repairCost && player.armor < player.maxArmor) {
                gold -= repairCost;
                player.armor = player.maxArmor;
            }
        }
    } else if ((state === 'gameover' || state === 'victory') && e.key === 'Enter') {
        // Reset game
        player.x = WORLD_SIZE / 2;
        player.y = WORLD_SIZE / 2;
        player.armor = 100;
        player.maxArmor = 100;
        player.armorLevel = 1;
        player.speedLevel = 1;
        player.reloadLevel = 1;
        player.firepowerLevel = 1;
        gold = 100;
        cargo = [];
        dayNumber = 1;
        revealedAreas.clear();
        projectiles.length = 0;
        lootDrops.length = 0;
        generateWorld();
        state = 'base';
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => mouseDown = true);
canvas.addEventListener('mouseup', () => mouseDown = false);

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    if (state === 'sailing' && !portMenuOpen) {
        updatePlayer(dt);
        updateEnemies(dt);
        updateProjectiles(dt);
        updateLoot(dt);

        dayTimer -= dt;
        if (dayTimer <= 0) {
            endDay(false);
        }
    }

    render();
    requestAnimationFrame(gameLoop);
}

// Start
requestAnimationFrame(gameLoop);
