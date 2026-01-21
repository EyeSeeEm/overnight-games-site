// Pirateers v2 - Canvas Implementation
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const WORLD_SIZE = 3000;
const DAY_DURATION = 120; // seconds

// Game state
const game = {
    state: 'menu', // menu, base, sailing, gameover, victory
    keys: Object.create(null),
    dayTimer: DAY_DURATION,
    gold: 100,
    cargo: [],
    cargoCapacity: 15,
    bossDefeated: false
};

// Player ship
const player = {
    x: WORLD_SIZE / 2,
    y: WORLD_SIZE / 2,
    angle: 0,
    speed: 0,
    maxSpeed: 100,
    turnRate: 90,
    armor: 100,
    maxArmor: 100,
    firepower: 10,
    reloadTime: 2,
    currentReload: 0,
    stats: { armor: 1, speed: 1, reload: 1, firepower: 1 }
};

// Camera
const camera = { x: 0, y: 0 };

// Entities
let enemies = [];
let cannonballs = [];
let loot = [];
let particles = [];

// Fog of war
let explored = [];
const FOG_GRID_SIZE = 100;

// Enemy types
const ENEMY_TYPES = {
    merchant: { hp: 50, speed: 60, damage: 5, gold: 30, color: '#8b4513', size: 30 },
    navySloop: { hp: 80, speed: 100, damage: 12, gold: 40, color: '#1e90ff', size: 35 },
    pirateRaider: { hp: 100, speed: 120, damage: 15, gold: 55, color: '#dc143c', size: 35 },
    pirateCaptain: { hp: 200, speed: 90, damage: 25, gold: 125, color: '#8b0000', size: 50, boss: true }
};

// Initialize fog grid
function initFog() {
    explored = [];
    const gridSize = Math.ceil(WORLD_SIZE / FOG_GRID_SIZE);
    for (let y = 0; y < gridSize; y++) {
        explored[y] = [];
        for (let x = 0; x < gridSize; x++) {
            explored[y][x] = false;
        }
    }
}

// Reveal fog around position
function revealFog(x, y, radius) {
    const gridX = Math.floor(x / FOG_GRID_SIZE);
    const gridY = Math.floor(y / FOG_GRID_SIZE);
    const gridRadius = Math.ceil(radius / FOG_GRID_SIZE);

    for (let dy = -gridRadius; dy <= gridRadius; dy++) {
        for (let dx = -gridRadius; dx <= gridRadius; dx++) {
            const gx = gridX + dx;
            const gy = gridY + dy;
            if (gy >= 0 && gy < explored.length && gx >= 0 && gx < explored[0].length) {
                if (dx * dx + dy * dy <= gridRadius * gridRadius) {
                    explored[gy][gx] = true;
                }
            }
        }
    }
}

// Spawn enemies
function spawnEnemies() {
    enemies = [];

    // Spawn merchants near center
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 300 + Math.random() * 600;
        enemies.push(createEnemy('merchant', WORLD_SIZE / 2 + Math.cos(angle) * dist, WORLD_SIZE / 2 + Math.sin(angle) * dist));
    }

    // Spawn navy in mid range
    for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 700 + Math.random() * 500;
        enemies.push(createEnemy('navySloop', WORLD_SIZE / 2 + Math.cos(angle) * dist, WORLD_SIZE / 2 + Math.sin(angle) * dist));
    }

    // Spawn pirates further out
    for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 1000 + Math.random() * 400;
        enemies.push(createEnemy('pirateRaider', WORLD_SIZE / 2 + Math.cos(angle) * dist, WORLD_SIZE / 2 + Math.sin(angle) * dist));
    }

    // Spawn boss far away
    const bossAngle = Math.random() * Math.PI * 2;
    enemies.push(createEnemy('pirateCaptain', WORLD_SIZE / 2 + Math.cos(bossAngle) * 1300, WORLD_SIZE / 2 + Math.sin(bossAngle) * 1300));
}

function createEnemy(type, x, y) {
    const data = ENEMY_TYPES[type];
    return {
        type,
        x, y,
        angle: Math.random() * Math.PI * 2,
        speed: data.speed * (0.8 + Math.random() * 0.4),
        hp: data.hp,
        maxHp: data.hp,
        damage: data.damage,
        gold: data.gold,
        color: data.color,
        size: data.size,
        reloadTimer: 0,
        boss: data.boss || false,
        active: true
    };
}

// Start sailing day
function startDay() {
    game.state = 'sailing';
    game.dayTimer = DAY_DURATION;
    player.x = WORLD_SIZE / 2;
    player.y = WORLD_SIZE / 2;
    player.angle = 0;
    player.speed = 0;
    player.armor = player.maxArmor;
    player.currentReload = 0;
    cannonballs = [];
    loot = [];
    particles = [];

    initFog();
    spawnEnemies();
}

// Return to base
function returnToBase() {
    game.state = 'base';

    // Sell cargo
    for (const item of game.cargo) {
        game.gold += item.value;
    }
    game.cargo = [];
}

// Update
function update(dt) {
    if (game.state === 'sailing') {
        updateSailing(dt);
    }
}

function updateSailing(dt) {
    // Day timer
    game.dayTimer -= dt;
    if (game.dayTimer <= 0) {
        returnToBase();
        return;
    }

    // Player controls
    if (game.keys['KeyA'] || game.keys['ArrowLeft']) {
        player.angle -= player.turnRate * dt * Math.PI / 180;
    }
    if (game.keys['KeyD'] || game.keys['ArrowRight']) {
        player.angle += player.turnRate * dt * Math.PI / 180;
    }
    if (game.keys['KeyW'] || game.keys['ArrowUp']) {
        player.speed = Math.min(player.speed + 100 * dt, player.maxSpeed + player.stats.speed * 15);
    }
    if (game.keys['KeyS'] || game.keys['ArrowDown']) {
        player.speed = Math.max(player.speed - 100 * dt, 0);
    }

    // Movement
    player.x += Math.cos(player.angle) * player.speed * dt;
    player.y += Math.sin(player.angle) * player.speed * dt;

    // Bounds
    player.x = Math.max(50, Math.min(WORLD_SIZE - 50, player.x));
    player.y = Math.max(50, Math.min(WORLD_SIZE - 50, player.y));

    // Reveal fog
    revealFog(player.x, player.y, 300);

    // Reload
    if (player.currentReload > 0) {
        player.currentReload -= dt;
    }

    // Fire cannons
    if ((game.keys['Space'] || game.mouseDown) && player.currentReload <= 0) {
        fireCannons();
    }

    // Camera
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    // Update enemies
    updateEnemies(dt);

    // Update cannonballs
    updateCannonballs(dt);

    // Update loot
    updateLoot(dt);

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].life -= dt;
        particles[i].x += particles[i].vx * dt;
        particles[i].y += particles[i].vy * dt;
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Check player death
    if (player.armor <= 0) {
        game.cargo = game.cargo.slice(0, Math.floor(game.cargo.length * 0.75));
        returnToBase();
    }

    // Check victory
    if (game.bossDefeated) {
        game.state = 'victory';
    }
}

function fireCannons() {
    const reloadTime = player.reloadTime - player.stats.reload * 0.15;
    player.currentReload = reloadTime;

    const damage = player.firepower + player.stats.firepower * 5;
    const numBalls = 3 + Math.floor(player.stats.firepower / 3);

    // Fire from both sides
    for (let side = -1; side <= 1; side += 2) {
        const perpAngle = player.angle + side * Math.PI / 2;

        for (let i = 0; i < numBalls; i++) {
            const spread = ((i - (numBalls - 1) / 2) / numBalls) * 0.5;
            const angle = perpAngle + spread;

            cannonballs.push({
                x: player.x + Math.cos(perpAngle) * 15,
                y: player.y + Math.sin(perpAngle) * 15,
                vx: Math.cos(angle) * 400,
                vy: Math.sin(angle) * 400,
                damage,
                enemy: false,
                life: 0.75
            });
        }
    }

    // Muzzle flash
    for (let side = -1; side <= 1; side += 2) {
        const perpAngle = player.angle + side * Math.PI / 2;
        particles.push({
            x: player.x + Math.cos(perpAngle) * 20,
            y: player.y + Math.sin(perpAngle) * 20,
            vx: 0, vy: 0,
            color: '#ff6600',
            size: 15,
            life: 0.2
        });
    }
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        if (!enemy.active) continue;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // AI behavior
        if (dist < 500) {
            // Turn toward player
            const targetAngle = Math.atan2(dy, dx);
            let angleDiff = targetAngle - enemy.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            enemy.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 60 * dt * Math.PI / 180);

            // Fire at player
            enemy.reloadTimer -= dt;
            if (enemy.reloadTimer <= 0 && dist < 350) {
                // Fire broadside
                const perpAngle = enemy.angle + (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;

                cannonballs.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(perpAngle) * 300,
                    vy: Math.sin(perpAngle) * 300,
                    damage: enemy.damage,
                    enemy: true,
                    life: 0.8
                });

                enemy.reloadTimer = 2 + Math.random();
            }
        }

        // Move
        enemy.x += Math.cos(enemy.angle) * enemy.speed * dt;
        enemy.y += Math.sin(enemy.angle) * enemy.speed * dt;

        // Bounds
        enemy.x = Math.max(50, Math.min(WORLD_SIZE - 50, enemy.x));
        enemy.y = Math.max(50, Math.min(WORLD_SIZE - 50, enemy.y));
    }
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

        // Player cannonball hitting enemy
        if (!ball.enemy) {
            for (const enemy of enemies) {
                if (!enemy.active) continue;

                const d = Math.sqrt((enemy.x - ball.x) ** 2 + (enemy.y - ball.y) ** 2);
                if (d < enemy.size) {
                    enemy.hp -= ball.damage;
                    cannonballs.splice(i, 1);

                    // Hit particles
                    for (let j = 0; j < 5; j++) {
                        particles.push({
                            x: ball.x,
                            y: ball.y,
                            vx: (Math.random() - 0.5) * 100,
                            vy: (Math.random() - 0.5) * 100,
                            color: '#ff6600',
                            size: 5,
                            life: 0.3
                        });
                    }

                    if (enemy.hp <= 0) {
                        // Death
                        enemy.active = false;

                        // Spawn loot
                        loot.push({
                            type: 'gold',
                            x: enemy.x,
                            y: enemy.y,
                            value: enemy.gold + Math.floor(Math.random() * 20),
                            life: 15
                        });

                        if (Math.random() < 0.5) {
                            loot.push({
                                type: 'cargo',
                                x: enemy.x + (Math.random() - 0.5) * 30,
                                y: enemy.y + (Math.random() - 0.5) * 30,
                                value: 20 + Math.floor(Math.random() * 30),
                                life: 15
                            });
                        }

                        // Death explosion
                        for (let j = 0; j < 20; j++) {
                            particles.push({
                                x: enemy.x + (Math.random() - 0.5) * enemy.size,
                                y: enemy.y + (Math.random() - 0.5) * enemy.size,
                                vx: (Math.random() - 0.5) * 150,
                                vy: (Math.random() - 0.5) * 150,
                                color: Math.random() < 0.5 ? '#ff6600' : '#8b4513',
                                size: 8,
                                life: 0.5
                            });
                        }

                        // Check boss defeat
                        if (enemy.boss) {
                            game.bossDefeated = true;
                        }
                    }
                    break;
                }
            }
        }

        // Enemy cannonball hitting player
        if (ball.enemy) {
            const d = Math.sqrt((player.x - ball.x) ** 2 + (player.y - ball.y) ** 2);
            if (d < 25) {
                player.armor -= ball.damage;
                cannonballs.splice(i, 1);

                particles.push({
                    x: ball.x,
                    y: ball.y,
                    vx: 0, vy: 0,
                    color: '#ff0000',
                    size: 20,
                    life: 0.3
                });
            }
        }
    }
}

function updateLoot(dt) {
    for (let i = loot.length - 1; i >= 0; i--) {
        const item = loot[i];
        item.life -= dt;

        if (item.life <= 0) {
            loot.splice(i, 1);
            continue;
        }

        // Collect loot
        const d = Math.sqrt((player.x - item.x) ** 2 + (player.y - item.y) ** 2);
        if (d < 40) {
            if (item.type === 'gold') {
                game.gold += item.value;
            } else if (item.type === 'cargo' && game.cargo.length < game.cargoCapacity) {
                game.cargo.push({ value: item.value });
            }
            loot.splice(i, 1);

            particles.push({
                x: item.x,
                y: item.y,
                vx: 0, vy: -50,
                color: '#ffd700',
                size: 10,
                life: 0.5
            });
        }
    }
}

// Drawing
function draw() {
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === 'menu') {
        drawMenu();
    } else if (game.state === 'base') {
        drawBase();
    } else if (game.state === 'sailing') {
        drawSailing();
    } else if (game.state === 'victory') {
        drawVictory();
    }
}

function drawMenu() {
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Waves pattern
    ctx.fillStyle = '#0a2844';
    for (let i = 0; i < 10; i++) {
        const y = 200 + i * 50 + Math.sin(Date.now() * 0.001 + i) * 10;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= canvas.width; x += 20) {
            ctx.lineTo(x, y + Math.sin(x * 0.02 + Date.now() * 0.002) * 15);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();
    }

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 56px serif';
    ctx.textAlign = 'center';
    ctx.fillText('PIRATEERS', canvas.width / 2, 150);

    ctx.fillStyle = '#fff';
    ctx.font = '18px serif';
    ctx.fillText('Sail the seas, defeat the Pirate Captain!', canvas.width / 2, 200);

    // Ship icon
    ctx.fillStyle = '#8b4513';
    ctx.save();
    ctx.translate(canvas.width / 2, 350);
    ctx.beginPath();
    ctx.moveTo(-40, 20);
    ctx.lineTo(40, 20);
    ctx.lineTo(30, -10);
    ctx.lineTo(-30, -10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.fillRect(-5, -60, 10, 50);
    ctx.beginPath();
    ctx.moveTo(5, -55);
    ctx.lineTo(35, -30);
    ctx.lineTo(5, -20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = '24px serif';
    ctx.fillText('Click to Begin', canvas.width / 2, 480);

    ctx.font = '14px serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('WASD - Steer | Space - Fire Cannons', canvas.width / 2, 530);
}

function drawBase() {
    ctx.fillStyle = '#2d4a3e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Harbor
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(0, canvas.height - 150, canvas.width, 150);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 36px serif';
    ctx.textAlign = 'center';
    ctx.fillText('PORT HAVEN', canvas.width / 2, 60);

    ctx.fillStyle = '#fff';
    ctx.font = '18px serif';
    ctx.fillText(`Gold: ${game.gold}`, canvas.width / 2, 100);
    ctx.fillText(`Cargo: ${game.cargo.length}/${game.cargoCapacity}`, canvas.width / 2, 125);

    // Ship stats
    ctx.font = '16px serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Armor: Lv.${player.stats.armor} (${player.maxArmor} HP)`, 50, 180);
    ctx.fillText(`Speed: Lv.${player.stats.speed} (+${player.stats.speed * 15} speed)`, 50, 210);
    ctx.fillText(`Reload: Lv.${player.stats.reload} (${(player.reloadTime - player.stats.reload * 0.15).toFixed(2)}s)`, 50, 240);
    ctx.fillText(`Firepower: Lv.${player.stats.firepower} (+${player.stats.firepower * 5} dmg)`, 50, 270);

    // Upgrade buttons
    const upgrades = ['armor', 'speed', 'reload', 'firepower'];
    const costs = [100, 200, 350, 500];

    ctx.textAlign = 'right';
    for (let i = 0; i < upgrades.length; i++) {
        const stat = upgrades[i];
        const level = player.stats[stat];
        if (level < 4) {
            const cost = costs[level - 1] || 500;
            ctx.fillStyle = game.gold >= cost ? '#27ae60' : '#666';
            ctx.fillRect(canvas.width - 150, 165 + i * 30, 100, 25);
            ctx.fillStyle = '#fff';
            ctx.font = '12px serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Upgrade (${cost}g)`, canvas.width - 100, 182 + i * 30);
        }
    }

    // Set sail button
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(canvas.width / 2 - 80, 350, 160, 50);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px serif';
    ctx.textAlign = 'center';
    ctx.fillText('SET SAIL!', canvas.width / 2, 382);

    ctx.font = '14px serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Click upgrades or Set Sail to continue', canvas.width / 2, 450);
    ctx.fillText(`Day duration: ${DAY_DURATION} seconds | Defeat the Pirate Captain to win!`, canvas.width / 2, 480);
}

function drawSailing() {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Water
    ctx.fillStyle = '#0a2844';
    ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // Water pattern
    ctx.fillStyle = '#0c3050';
    for (let y = 0; y < WORLD_SIZE; y += 100) {
        for (let x = 0; x < WORLD_SIZE; x += 100) {
            const wave = Math.sin((x + y) * 0.01 + Date.now() * 0.001) * 10;
            ctx.beginPath();
            ctx.arc(x + 50 + wave, y + 50, 30, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Fog of war
    const gridSize = FOG_GRID_SIZE;
    ctx.fillStyle = 'rgba(10, 22, 40, 0.9)';
    for (let gy = 0; gy < explored.length; gy++) {
        for (let gx = 0; gx < explored[0].length; gx++) {
            if (!explored[gy][gx]) {
                ctx.fillRect(gx * gridSize, gy * gridSize, gridSize, gridSize);
            }
        }
    }

    // Loot
    for (const item of loot) {
        if (item.type === 'gold') {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(item.x - 10, item.y - 10, 20, 20);
        }
    }

    // Enemies
    for (const enemy of enemies) {
        if (!enemy.active) continue;

        // Check if in explored area
        const gx = Math.floor(enemy.x / FOG_GRID_SIZE);
        const gy = Math.floor(enemy.y / FOG_GRID_SIZE);
        if (gy >= 0 && gy < explored.length && gx >= 0 && gx < explored[0].length && !explored[gy][gx]) {
            continue;
        }

        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);

        // Hull
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.moveTo(-enemy.size / 2, -enemy.size / 4);
        ctx.lineTo(enemy.size / 2, 0);
        ctx.lineTo(-enemy.size / 2, enemy.size / 4);
        ctx.closePath();
        ctx.fill();

        // Mast
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-3, -enemy.size / 3, 6, enemy.size / 1.5);

        // Sail
        ctx.fillStyle = enemy.boss ? '#ff0000' : '#f5f5dc';
        ctx.beginPath();
        ctx.moveTo(3, -enemy.size / 4);
        ctx.lineTo(enemy.size / 3, 0);
        ctx.lineTo(3, enemy.size / 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // HP bar
        if (enemy.hp < enemy.maxHp) {
            ctx.fillStyle = '#333';
            ctx.fillRect(enemy.x - 20, enemy.y - enemy.size / 2 - 10, 40, 5);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(enemy.x - 20, enemy.y - enemy.size / 2 - 10, 40 * (enemy.hp / enemy.maxHp), 5);
        }

        // Boss label
        if (enemy.boss) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 12px serif';
            ctx.textAlign = 'center';
            ctx.fillText('PIRATE CAPTAIN', enemy.x, enemy.y - enemy.size / 2 - 20);
        }
    }

    // Cannonballs
    for (const ball of cannonballs) {
        ctx.fillStyle = ball.enemy ? '#ff6b6b' : '#333';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Particles
    for (const p of particles) {
        ctx.globalAlpha = p.life * 2;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Player ship
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Hull
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.moveTo(-20, -10);
    ctx.lineTo(25, 0);
    ctx.lineTo(-20, 10);
    ctx.closePath();
    ctx.fill();

    // Deck
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(-15, -6, 25, 12);

    // Mast
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(-2, -25, 4, 50);

    // Sail
    ctx.fillStyle = '#f5f5dc';
    ctx.beginPath();
    ctx.moveTo(2, -20);
    ctx.lineTo(20 + player.speed / 10, 0);
    ctx.lineTo(2, 20);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    ctx.restore();

    // HUD
    drawHUD();
}

function drawHUD() {
    // Day timer
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(canvas.width - 120, 10, 110, 30);
    ctx.fillStyle = '#ffd700';
    ctx.font = '16px serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Day: ${Math.ceil(game.dayTimer)}s`, canvas.width - 20, 32);

    // Health bar
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, 10, 150, 25);
    ctx.fillStyle = '#333';
    ctx.fillRect(15, 15, 140, 15);
    ctx.fillStyle = player.armor > player.maxArmor * 0.3 ? '#27ae60' : '#e74c3c';
    ctx.fillRect(15, 15, 140 * (player.armor / player.maxArmor), 15);
    ctx.fillStyle = '#fff';
    ctx.font = '12px serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(player.armor)}/${player.maxArmor}`, 85, 27);

    // Gold and cargo
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, 40, 120, 25);
    ctx.fillStyle = '#ffd700';
    ctx.font = '14px serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Gold: ${game.gold}`, 20, 57);

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, 70, 120, 25);
    ctx.fillStyle = '#fff';
    ctx.fillText(`Cargo: ${game.cargo.length}/${game.cargoCapacity}`, 20, 87);

    // Reload indicator
    if (player.currentReload > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(canvas.width / 2 - 50, canvas.height - 40, 100, 20);
        ctx.fillStyle = '#3498db';
        const reloadTime = player.reloadTime - player.stats.reload * 0.15;
        ctx.fillRect(canvas.width / 2 - 48, canvas.height - 38, 96 * (1 - player.currentReload / reloadTime), 16);
        ctx.fillStyle = '#fff';
        ctx.font = '12px serif';
        ctx.textAlign = 'center';
        ctx.fillText('RELOADING', canvas.width / 2, canvas.height - 26);
    }

    // Minimap
    const mapSize = 120;
    const mapX = canvas.width - mapSize - 10;
    const mapY = canvas.height - mapSize - 10;

    ctx.fillStyle = 'rgba(10, 40, 68, 0.8)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Player on minimap
    const px = mapX + (player.x / WORLD_SIZE) * mapSize;
    const py = mapY + (player.y / WORLD_SIZE) * mapSize;
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();

    // Enemies on minimap (if in explored area)
    for (const enemy of enemies) {
        if (!enemy.active) continue;
        const gx = Math.floor(enemy.x / FOG_GRID_SIZE);
        const gy = Math.floor(enemy.y / FOG_GRID_SIZE);
        if (gy >= 0 && gy < explored.length && gx >= 0 && gx < explored[0].length && explored[gy][gx]) {
            const ex = mapX + (enemy.x / WORLD_SIZE) * mapSize;
            const ey = mapY + (enemy.y / WORLD_SIZE) * mapSize;
            ctx.fillStyle = enemy.boss ? '#ff0000' : enemy.color;
            ctx.beginPath();
            ctx.arc(ex, ey, enemy.boss ? 4 : 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Instructions
    ctx.fillStyle = '#aaa';
    ctx.font = '12px serif';
    ctx.textAlign = 'left';
    ctx.fillText('ESC to return to port', 10, canvas.height - 10);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, 180);

    ctx.fillStyle = '#fff';
    ctx.font = '24px serif';
    ctx.fillText('You defeated the Pirate Captain!', canvas.width / 2, 250);

    ctx.font = '20px serif';
    ctx.fillText(`Final Gold: ${game.gold}`, canvas.width / 2, 320);

    ctx.fillStyle = '#aaa';
    ctx.font = '16px serif';
    ctx.fillText('The seas are now safe for honest merchants.', canvas.width / 2, 390);
    ctx.fillText('Your legend will be sung in taverns for generations.', canvas.width / 2, 420);

    ctx.fillStyle = '#fff';
    ctx.font = '20px serif';
    ctx.fillText('Click to play again', canvas.width / 2, 500);
}

// Input
document.addEventListener('keydown', e => {
    game.keys[e.code] = true;

    if (e.code === 'Escape' && game.state === 'sailing') {
        returnToBase();
    }
});

document.addEventListener('keyup', e => {
    game.keys[e.code] = false;
});

canvas.addEventListener('mousedown', e => {
    game.mouseDown = true;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (game.state === 'menu') {
        game.state = 'base';
    } else if (game.state === 'base') {
        // Check upgrade buttons
        const upgrades = ['armor', 'speed', 'reload', 'firepower'];
        const costs = [100, 200, 350, 500];

        for (let i = 0; i < upgrades.length; i++) {
            const stat = upgrades[i];
            const level = player.stats[stat];
            if (level < 4) {
                const cost = costs[level - 1] || 500;
                if (mx >= canvas.width - 150 && mx <= canvas.width - 50 &&
                    my >= 165 + i * 30 && my <= 190 + i * 30) {
                    if (game.gold >= cost) {
                        game.gold -= cost;
                        player.stats[stat]++;

                        // Apply upgrade
                        if (stat === 'armor') {
                            player.maxArmor = 100 + (player.stats.armor - 1) * 50;
                        }
                    }
                }
            }
        }

        // Check set sail button
        if (mx >= canvas.width / 2 - 80 && mx <= canvas.width / 2 + 80 &&
            my >= 350 && my <= 400) {
            startDay();
        }
    } else if (game.state === 'victory') {
        // Reset
        game.state = 'base';
        game.gold = 100;
        game.cargo = [];
        game.bossDefeated = false;
        player.stats = { armor: 1, speed: 1, reload: 1, firepower: 1 };
        player.maxArmor = 100;
    }
});

canvas.addEventListener('mouseup', () => {
    game.mouseDown = false;
});

// Game loop
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
