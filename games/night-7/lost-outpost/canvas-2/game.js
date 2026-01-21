// Lost Outpost - Canvas Implementation
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 19;

// Game state
const game = {
    state: 'menu', // menu, playing, levelComplete, gameover, victory
    level: 1,
    lives: 3,
    credits: 500,
    keys: Object.create(null),
    mouse: { x: 400, y: 300 },
    mouseDown: false
};

// Player
const player = {
    x: 400, y: 500,
    vx: 0, vy: 0,
    width: 24, height: 24,
    speed: 150,
    hp: 100, maxHp: 100,
    weapons: ['rifle'],
    currentWeapon: 0,
    ammo: { rifle: 300, smg: 0, shotgun: 0, flamethrower: 0 },
    maxAmmo: { rifle: 300, smg: 500, shotgun: 50, flamethrower: 200 },
    reloading: false,
    reloadTime: 0,
    shootCooldown: 0,
    angle: 0,
    invincible: false,
    invincibleTime: 0
};

// Weapons
const WEAPONS = {
    rifle: { name: 'Assault Rifle', damage: 15, fireRate: 6, spread: 0.05, bulletSpeed: 500 },
    smg: { name: 'SMG', damage: 8, fireRate: 15, spread: 0.15, bulletSpeed: 450 },
    shotgun: { name: 'Shotgun', damage: 8, fireRate: 1.5, spread: 0.3, pellets: 8, bulletSpeed: 400 },
    flamethrower: { name: 'Flamethrower', damage: 3, fireRate: 20, spread: 0.2, bulletSpeed: 200, flame: true }
};

// Enemies
let enemies = [];
let bullets = [];
let items = [];
let particles = [];

// Enemy types
const ENEMY_TYPES = {
    scorpion: { hp: 30, speed: 80, damage: 10, size: 20, color: '#2ecc71', attackRange: 30 },
    scorpionLaser: { hp: 40, speed: 60, damage: 15, size: 22, color: '#27ae60', attackRange: 200, ranged: true },
    arachnid: { hp: 80, speed: 50, damage: 20, size: 30, color: '#1abc9c', attackRange: 40 }
};

// Boss
let boss = null;

// Level data
let currentMap = [];
let keycardCollected = false;
let exitOpen = false;
let objectiveCount = 0;
let objectiveTarget = 0;

// Camera
const camera = { x: 0, y: 0 };

// Level definitions
const LEVELS = [
    { // Level 1 - Tutorial
        name: 'ARRIVAL',
        objective: 'Find keycard, reach elevator',
        enemies: [
            { type: 'scorpion', x: 300, y: 200 },
            { type: 'scorpion', x: 500, y: 250 },
            { type: 'scorpion', x: 400, y: 350 }
        ],
        keycard: { x: 600, y: 150 },
        exit: { x: 700, y: 500 },
        weapon: null
    },
    { // Level 2 - Engineering
        name: 'ENGINEERING DECK',
        objective: 'Restore auxiliary power',
        enemies: [
            { type: 'scorpion', x: 200, y: 200 },
            { type: 'scorpion', x: 400, y: 200 },
            { type: 'scorpion', x: 300, y: 300 },
            { type: 'scorpion', x: 500, y: 300 },
            { type: 'scorpionLaser', x: 350, y: 400 },
            { type: 'scorpionLaser', x: 450, y: 400 }
        ],
        keycard: { x: 150, y: 400 },
        exit: { x: 700, y: 100 },
        weapon: 'smg'
    },
    { // Level 3 - Medical Bay
        name: 'MEDICAL BAY',
        objective: 'Find research data',
        enemies: [
            { type: 'scorpion', x: 200, y: 150 },
            { type: 'scorpion', x: 400, y: 150 },
            { type: 'arachnid', x: 300, y: 250 },
            { type: 'arachnid', x: 500, y: 250 },
            { type: 'scorpionLaser', x: 350, y: 350 },
            { type: 'scorpionLaser', x: 450, y: 350 }
        ],
        keycard: { x: 700, y: 200 },
        exit: { x: 100, y: 500 },
        weapon: 'shotgun'
    },
    { // Level 4 - Cargo Hold
        name: 'CARGO HOLD',
        objective: 'Open blast doors',
        enemies: [
            { type: 'scorpion', x: 200, y: 200 },
            { type: 'scorpion', x: 300, y: 200 },
            { type: 'scorpion', x: 400, y: 200 },
            { type: 'arachnid', x: 250, y: 350 },
            { type: 'arachnid', x: 450, y: 350 },
            { type: 'scorpionLaser', x: 350, y: 450 }
        ],
        keycard: { x: 600, y: 350 },
        exit: { x: 400, y: 50 },
        weapon: 'flamethrower'
    },
    { // Level 5 - Boss
        name: 'HIVE CHAMBER',
        objective: 'Destroy the Hive Commander',
        enemies: [],
        keycard: null,
        exit: { x: 400, y: 50 },
        weapon: null,
        boss: { type: 'hiveCommander', x: 400, y: 200 }
    }
];

// Generate procedural map
function generateMap() {
    currentMap = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        currentMap[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Border walls
            if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
                currentMap[y][x] = 1;
            }
            // Random internal walls
            else if (Math.random() < 0.1) {
                currentMap[y][x] = 1;
            }
            // Floor
            else {
                currentMap[y][x] = 0;
            }
        }
    }

    // Clear player spawn area
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const tx = Math.floor(player.x / TILE_SIZE) + dx;
            const ty = Math.floor(player.y / TILE_SIZE) + dy;
            if (tx > 0 && tx < MAP_WIDTH - 1 && ty > 0 && ty < MAP_HEIGHT - 1) {
                currentMap[ty][tx] = 0;
            }
        }
    }
}

// Load level
function loadLevel(levelNum) {
    game.level = levelNum;
    game.lives = 3;
    keycardCollected = false;
    exitOpen = false;
    enemies = [];
    bullets = [];
    items = [];
    particles = [];
    boss = null;

    generateMap();

    const level = LEVELS[levelNum - 1];

    // Spawn enemies
    for (const e of level.enemies) {
        const data = ENEMY_TYPES[e.type];
        enemies.push({
            type: e.type,
            x: e.x, y: e.y,
            ...data,
            currentHp: data.hp * (1 + (levelNum - 1) * 0.1),
            maxHp: data.hp * (1 + (levelNum - 1) * 0.1),
            shootTimer: 0,
            angle: 0
        });
    }

    // Keycard
    if (level.keycard) {
        items.push({ type: 'keycard', x: level.keycard.x, y: level.keycard.y });
    } else {
        keycardCollected = true;
    }

    // Weapon pickup
    if (level.weapon) {
        items.push({ type: 'weapon', weapon: level.weapon, x: 400, y: 300 });
    }

    // Spawn health/ammo
    for (let i = 0; i < 5; i++) {
        items.push({
            type: Math.random() < 0.5 ? 'health' : 'ammo',
            x: 100 + Math.random() * 600,
            y: 100 + Math.random() * 400
        });
    }

    // Boss level
    if (level.boss) {
        boss = {
            type: level.boss.type,
            x: level.boss.x,
            y: level.boss.y,
            hp: 500,
            maxHp: 500,
            phase: 1,
            attackTimer: 3,
            spawnTimer: 0,
            angle: 0
        };
    }

    // Reset player position
    player.x = 400;
    player.y = 500;
    player.hp = player.maxHp;
}

// Update
function update(dt) {
    if (game.state !== 'playing') return;

    updatePlayer(dt);
    updateEnemies(dt);
    updateBoss(dt);
    updateBullets(dt);
    updateParticles(dt);
    checkItems();
    checkWinCondition();
}

function updatePlayer(dt) {
    // Invincibility
    if (player.invincibleTime > 0) {
        player.invincibleTime -= dt;
        if (player.invincibleTime <= 0) player.invincible = false;
    }

    // Cooldowns
    if (player.shootCooldown > 0) player.shootCooldown -= dt;
    if (player.reloading) {
        player.reloadTime -= dt;
        if (player.reloadTime <= 0) player.reloading = false;
    }

    // Movement
    let dx = 0, dy = 0;
    if (game.keys['KeyW'] || game.keys['ArrowUp']) dy = -1;
    if (game.keys['KeyS'] || game.keys['ArrowDown']) dy = 1;
    if (game.keys['KeyA'] || game.keys['ArrowLeft']) dx = -1;
    if (game.keys['KeyD'] || game.keys['ArrowRight']) dx = 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;

        const newX = player.x + dx * player.speed * dt;
        const newY = player.y + dy * player.speed * dt;

        // Collision check
        if (!checkWallCollision(newX, player.y, player.width)) {
            player.x = newX;
        }
        if (!checkWallCollision(player.x, newY, player.height)) {
            player.y = newY;
        }
    }

    // Aim angle
    player.angle = Math.atan2(game.mouse.y - player.y, game.mouse.x - player.x);

    // Shooting
    if (game.mouseDown && player.shootCooldown <= 0 && !player.reloading) {
        shoot();
    }

    // Camera
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
    camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - canvas.height, camera.y));
}

function checkWallCollision(x, y, size) {
    const left = Math.floor((x - size / 2) / TILE_SIZE);
    const right = Math.floor((x + size / 2) / TILE_SIZE);
    const top = Math.floor((y - size / 2) / TILE_SIZE);
    const bottom = Math.floor((y + size / 2) / TILE_SIZE);

    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
                if (currentMap[ty][tx] === 1) return true;
            }
        }
    }
    return false;
}

function shoot() {
    const weaponName = player.weapons[player.currentWeapon];
    const weapon = WEAPONS[weaponName];

    if (player.ammo[weaponName] <= 0) return;

    const pellets = weapon.pellets || 1;
    for (let i = 0; i < pellets; i++) {
        const spread = (Math.random() - 0.5) * weapon.spread * 2;
        const angle = player.angle + spread;

        bullets.push({
            x: player.x + Math.cos(player.angle) * 15,
            y: player.y + Math.sin(player.angle) * 15,
            vx: Math.cos(angle) * weapon.bulletSpeed,
            vy: Math.sin(angle) * weapon.bulletSpeed,
            damage: weapon.damage,
            enemy: false,
            flame: weapon.flame,
            life: weapon.flame ? 0.3 : 2
        });
    }

    player.ammo[weaponName]--;
    player.shootCooldown = 1 / weapon.fireRate;

    // Muzzle flash particle
    particles.push({
        x: player.x + Math.cos(player.angle) * 20,
        y: player.y + Math.sin(player.angle) * 20,
        size: 10,
        color: weapon.flame ? '#ff6600' : '#ffff00',
        life: 0.1
    });
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        enemy.angle = Math.atan2(dy, dx);

        // Movement
        if (dist > enemy.attackRange) {
            const moveX = (dx / dist) * enemy.speed * dt;
            const moveY = (dy / dist) * enemy.speed * dt;

            if (!checkWallCollision(enemy.x + moveX, enemy.y, enemy.size)) {
                enemy.x += moveX;
            }
            if (!checkWallCollision(enemy.x, enemy.y + moveY, enemy.size)) {
                enemy.y += moveY;
            }
        }

        // Attack
        if (dist < enemy.attackRange + 10) {
            if (enemy.ranged) {
                enemy.shootTimer -= dt;
                if (enemy.shootTimer <= 0) {
                    // Shoot laser
                    bullets.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: (dx / dist) * 300,
                        vy: (dy / dist) * 300,
                        damage: enemy.damage,
                        enemy: true,
                        color: '#00ff00',
                        life: 2
                    });
                    enemy.shootTimer = 2;
                }
            } else if (dist < enemy.attackRange && !player.invincible) {
                // Melee attack
                playerTakeDamage(enemy.damage);
            }
        }
    }
}

function updateBoss(dt) {
    if (!boss) return;

    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    boss.angle = Math.atan2(dy, dx);

    // Movement
    if (dist > 100) {
        boss.x += (dx / dist) * 40 * dt;
        boss.y += (dy / dist) * 40 * dt;
    }

    // Attacks
    boss.attackTimer -= dt;
    if (boss.attackTimer <= 0) {
        // Ring attack
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            bullets.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle) * 200,
                vy: Math.sin(angle) * 200,
                damage: 15,
                enemy: true,
                color: '#ff00ff',
                life: 3
            });
        }
        boss.attackTimer = 3 - (boss.hp < boss.maxHp / 2 ? 1 : 0);
    }

    // Spawn minions
    boss.spawnTimer -= dt;
    if (boss.spawnTimer <= 0 && enemies.length < 8) {
        const angle = Math.random() * Math.PI * 2;
        enemies.push({
            type: 'scorpion',
            x: boss.x + Math.cos(angle) * 50,
            y: boss.y + Math.sin(angle) * 50,
            ...ENEMY_TYPES.scorpion,
            currentHp: ENEMY_TYPES.scorpion.hp,
            maxHp: ENEMY_TYPES.scorpion.hp,
            shootTimer: 0,
            angle: 0
        });
        boss.spawnTimer = 8;
    }

    // Phase 2
    if (boss.hp < boss.maxHp / 2 && boss.phase === 1) {
        boss.phase = 2;
        // Spawn burst
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            enemies.push({
                type: 'scorpion',
                x: boss.x + Math.cos(angle) * 60,
                y: boss.y + Math.sin(angle) * 60,
                ...ENEMY_TYPES.scorpion,
                currentHp: ENEMY_TYPES.scorpion.hp,
                maxHp: ENEMY_TYPES.scorpion.hp,
                shootTimer: 0,
                angle: 0
            });
        }
    }
}

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.life -= dt;

        // Wall collision
        if (checkWallCollision(bullet.x, bullet.y, 4)) {
            bullets.splice(i, 1);
            continue;
        }

        // Life expired
        if (bullet.life <= 0) {
            bullets.splice(i, 1);
            continue;
        }

        // Player bullet hitting enemies
        if (!bullet.enemy) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                const d = Math.sqrt((enemy.x - bullet.x) ** 2 + (enemy.y - bullet.y) ** 2);
                if (d < enemy.size) {
                    enemy.currentHp -= bullet.damage;
                    bullets.splice(i, 1);

                    // Blood particle
                    particles.push({
                        x: bullet.x,
                        y: bullet.y,
                        size: 8,
                        color: '#00ff00',
                        life: 0.3
                    });

                    if (enemy.currentHp <= 0) {
                        // Death particles
                        for (let k = 0; k < 5; k++) {
                            particles.push({
                                x: enemy.x + (Math.random() - 0.5) * 20,
                                y: enemy.y + (Math.random() - 0.5) * 20,
                                size: 6,
                                color: '#00ff00',
                                life: 0.5
                            });
                        }
                        // Drop loot
                        if (Math.random() < 0.3) {
                            items.push({
                                type: Math.random() < 0.5 ? 'health' : 'ammo',
                                x: enemy.x,
                                y: enemy.y
                            });
                        }
                        game.credits += 50;
                        enemies.splice(j, 1);
                    }
                    break;
                }
            }

            // Hit boss
            if (boss) {
                const d = Math.sqrt((boss.x - bullet.x) ** 2 + (boss.y - bullet.y) ** 2);
                if (d < 40) {
                    boss.hp -= bullet.damage;
                    bullets.splice(i, 1);

                    particles.push({
                        x: bullet.x,
                        y: bullet.y,
                        size: 10,
                        color: '#ff00ff',
                        life: 0.3
                    });

                    if (boss.hp <= 0) {
                        boss = null;
                        game.state = 'victory';
                    }
                }
            }
        }

        // Enemy bullet hitting player
        if (bullet.enemy && !player.invincible) {
            const d = Math.sqrt((player.x - bullet.x) ** 2 + (player.y - bullet.y) ** 2);
            if (d < player.width / 2) {
                playerTakeDamage(bullet.damage);
                bullets.splice(i, 1);
            }
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].life -= dt;
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function playerTakeDamage(amount) {
    if (player.invincible) return;

    player.hp -= amount;
    player.invincible = true;
    player.invincibleTime = 0.5;

    // Screen shake effect via particles
    particles.push({
        x: player.x,
        y: player.y,
        size: 15,
        color: '#ff0000',
        life: 0.2
    });

    if (player.hp <= 0) {
        game.lives--;
        if (game.lives <= 0) {
            game.state = 'gameover';
        } else {
            // Respawn
            player.hp = player.maxHp;
            player.x = 400;
            player.y = 500;
        }
    }
}

function checkItems() {
    const level = LEVELS[game.level - 1];

    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const d = Math.sqrt((player.x - item.x) ** 2 + (player.y - item.y) ** 2);

        if (d < 30) {
            if (item.type === 'keycard') {
                keycardCollected = true;
                items.splice(i, 1);
            } else if (item.type === 'health') {
                player.hp = Math.min(player.maxHp, player.hp + 25);
                items.splice(i, 1);
            } else if (item.type === 'ammo') {
                const weaponName = player.weapons[player.currentWeapon];
                player.ammo[weaponName] = Math.min(player.maxAmmo[weaponName], player.ammo[weaponName] + 50);
                items.splice(i, 1);
            } else if (item.type === 'weapon') {
                if (!player.weapons.includes(item.weapon)) {
                    player.weapons.push(item.weapon);
                    player.ammo[item.weapon] = player.maxAmmo[item.weapon];
                }
                items.splice(i, 1);
            }
        }
    }

    // Check exit
    if (keycardCollected && enemies.length === 0 && !boss) {
        const exitX = level.exit.x;
        const exitY = level.exit.y;
        const d = Math.sqrt((player.x - exitX) ** 2 + (player.y - exitY) ** 2);
        if (d < 40) {
            game.state = 'levelComplete';
        }
    }
}

function checkWinCondition() {
    // Handled in checkItems and boss defeat
}

// Drawing
function draw() {
    // Clear with darkness
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === 'menu') {
        drawMenu();
    } else if (game.state === 'playing' || game.state === 'levelComplete' || game.state === 'gameover' || game.state === 'victory') {
        drawGame();

        if (game.state === 'levelComplete') drawLevelComplete();
        if (game.state === 'gameover') drawGameOver();
        if (game.state === 'victory') drawVictory();
    }
}

function drawGame() {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw visibility (flashlight effect)
    drawVisibility();

    // Draw map
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = currentMap[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            // Check if in light
            const dx = px + TILE_SIZE / 2 - player.x;
            const dy = py + TILE_SIZE / 2 - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const lightRadius = 250;

            if (dist < lightRadius) {
                const brightness = 1 - dist / lightRadius;

                if (tile === 0) {
                    // Floor
                    const shade = Math.floor(40 * brightness);
                    ctx.fillStyle = `rgb(${shade}, ${shade + 5}, ${shade + 10})`;
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                    // Grid lines
                    ctx.strokeStyle = `rgba(50, 60, 70, ${brightness * 0.5})`;
                    ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
                } else {
                    // Wall
                    const shade = Math.floor(60 * brightness);
                    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 10})`;
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                    // Wall highlight
                    ctx.fillStyle = `rgba(80, 80, 90, ${brightness * 0.5})`;
                    ctx.fillRect(px, py, TILE_SIZE, 4);
                }
            }
        }
    }

    // Draw items
    const level = LEVELS[game.level - 1];
    for (const item of items) {
        if (item.type === 'keycard') {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(item.x - 10, item.y - 6, 20, 12);
        } else if (item.type === 'health') {
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillRect(item.x - 4, item.y - 1, 8, 2);
            ctx.fillRect(item.x - 1, item.y - 4, 2, 8);
        } else if (item.type === 'ammo') {
            ctx.fillStyle = '#f39c12';
            ctx.fillRect(item.x - 4, item.y - 8, 8, 16);
        } else if (item.type === 'weapon') {
            ctx.fillStyle = '#3498db';
            ctx.fillRect(item.x - 15, item.y - 5, 30, 10);
        }
    }

    // Draw exit
    if (keycardCollected && enemies.length === 0 && !boss) {
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(level.exit.x - 20, level.exit.y - 20, 40, 40);
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('EXIT', level.exit.x, level.exit.y + 4);
    }

    // Draw enemies
    for (const enemy of enemies) {
        drawEnemy(enemy);
    }

    // Draw boss
    if (boss) {
        drawBoss();
    }

    // Draw bullets
    for (const bullet of bullets) {
        ctx.fillStyle = bullet.flame ? '#ff6600' : bullet.color || '#ffff00';
        const size = bullet.flame ? 8 : 4;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw particles
    for (const p of particles) {
        ctx.globalAlpha = p.life * 2;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life * 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw player
    drawPlayer();

    ctx.restore();

    // Draw HUD
    drawHUD();
}

function drawVisibility() {
    // Draw flashlight cone
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    const gradient = ctx.createRadialGradient(100, 0, 0, 100, 0, 200);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 300, -0.4, 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Laser sight
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.angle) * 300, player.y + Math.sin(player.angle) * 300);
    ctx.stroke();
    ctx.globalAlpha = 1;
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Body
    if (player.invincible) {
        ctx.globalAlpha = 0.5;
    }
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(0, 0, player.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Gun
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(8, -4, 18, 8);

    // Flashlight glow
    ctx.fillStyle = '#ffffaa';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(26, -2, 4, 4);

    ctx.restore();
}

function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle);

    // Body
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (red glow)
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(enemy.size / 4, -3, 3, 0, Math.PI * 2);
    ctx.arc(enemy.size / 4, 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // HP bar
    ctx.fillStyle = '#333';
    ctx.fillRect(-enemy.size / 2, -enemy.size / 2 - 8, enemy.size, 4);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(-enemy.size / 2, -enemy.size / 2 - 8, enemy.size * (enemy.currentHp / enemy.maxHp), 4);

    ctx.restore();
}

function drawBoss() {
    ctx.save();
    ctx.translate(boss.x, boss.y);

    // Body
    ctx.fillStyle = '#8e44ad';
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing inner
    const pulse = Math.sin(Date.now() * 0.005) * 5;
    ctx.fillStyle = '#9b59b6';
    ctx.beginPath();
    ctx.arc(0, 0, 25 + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ff00ff';
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + Date.now() * 0.002;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * 20, Math.sin(angle) * 20, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    // HP bar
    ctx.fillStyle = '#333';
    ctx.fillRect(boss.x - 50, boss.y - 60, 100, 8);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(boss.x - 50, boss.y - 60, 100 * (boss.hp / boss.maxHp), 8);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HIVE COMMANDER', boss.x, boss.y - 65);
}

function drawHUD() {
    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, 50);

    // Lives
    ctx.fillStyle = '#e74c3c';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`LIVES: ${game.lives}`, 20, 30);

    // Level/objective
    const level = LEVELS[game.level - 1];
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${game.level}: ${level.name}`, canvas.width / 2, 20);
    ctx.font = '12px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText(level.objective, canvas.width / 2, 40);

    // Credits
    ctx.fillStyle = '#f1c40f';
    ctx.font = '16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`CREDITS: ${game.credits}`, canvas.width - 20, 30);

    // Bottom bar
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(20, canvas.height - 45, 200, 20);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(20, canvas.height - 45, 200 * (player.hp / player.maxHp), 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, 120, canvas.height - 30);

    // Weapon/ammo
    const weaponName = player.weapons[player.currentWeapon];
    const weapon = WEAPONS[weaponName];
    ctx.fillStyle = '#3498db';
    ctx.fillRect(canvas.width - 220, canvas.height - 50, 200, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(weapon.name, canvas.width - 30, canvas.height - 32);
    ctx.fillText(`AMMO: ${player.ammo[weaponName]}`, canvas.width - 30, canvas.height - 15);

    // Keycard indicator
    if (!keycardCollected) {
        ctx.fillStyle = '#f1c40f';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FIND KEYCARD', canvas.width / 2, canvas.height - 25);
    } else if (enemies.length > 0 || boss) {
        ctx.fillStyle = '#e74c3c';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`ENEMIES: ${enemies.length + (boss ? 1 : 0)}`, canvas.width / 2, canvas.height - 25);
    } else {
        ctx.fillStyle = '#27ae60';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('REACH EXIT', canvas.width / 2, canvas.height - 25);
    }
}

function drawMenu() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ambient glow
    const gradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 400);
    gradient.addColorStop(0, 'rgba(46, 204, 113, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LOST OUTPOST', canvas.width / 2, 180);

    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('A Sci-Fi Survival Horror Shooter', canvas.width / 2, 230);

    // Alien silhouette
    ctx.fillStyle = '#1a5c31';
    ctx.beginPath();
    ctx.arc(400, 350, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(385, 345, 5, 0, Math.PI * 2);
    ctx.arc(415, 345, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Click to Start', canvas.width / 2, 480);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('WASD - Move | Mouse - Aim | Click - Shoot | R - Reload | Q - Switch Weapon', canvas.width / 2, 530);
}

function drawLevelComplete() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL COMPLETE', canvas.width / 2, 250);

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`Credits earned: ${game.credits}`, canvas.width / 2, 320);

    ctx.fillText('Click to continue', canvas.width / 2, 400);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, 250);

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`You reached Level ${game.level}`, canvas.width / 2, 320);

    ctx.fillText('Click to restart', canvas.width / 2, 400);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, 200);

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('You destroyed the Hive Commander!', canvas.width / 2, 280);
    ctx.fillText(`Final Credits: ${game.credits}`, canvas.width / 2, 330);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Haven Station has been cleansed.', canvas.width / 2, 400);
    ctx.fillText('The alien threat has been eliminated.', canvas.width / 2, 430);

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Click to play again', canvas.width / 2, 500);
}

// Input
document.addEventListener('keydown', e => {
    game.keys[e.code] = true;

    if (game.state === 'playing') {
        // Weapon switch
        if (e.code === 'KeyQ') {
            player.currentWeapon = (player.currentWeapon + 1) % player.weapons.length;
        }

        // Reload
        if (e.code === 'KeyR' && !player.reloading) {
            player.reloading = true;
            player.reloadTime = 1;
        }
    }
});

document.addEventListener('keyup', e => {
    game.keys[e.code] = false;
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    game.mouse.x = e.clientX - rect.left + camera.x;
    game.mouse.y = e.clientY - rect.top + camera.y;
});

canvas.addEventListener('mousedown', () => {
    game.mouseDown = true;

    if (game.state === 'menu') {
        game.state = 'playing';
        loadLevel(1);
    } else if (game.state === 'levelComplete') {
        if (game.level < LEVELS.length) {
            loadLevel(game.level + 1);
            game.state = 'playing';
        } else {
            game.state = 'victory';
        }
    } else if (game.state === 'gameover' || game.state === 'victory') {
        game.state = 'playing';
        player.weapons = ['rifle'];
        player.ammo = { rifle: 300, smg: 0, shotgun: 0, flamethrower: 0 };
        game.credits = 500;
        loadLevel(1);
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
