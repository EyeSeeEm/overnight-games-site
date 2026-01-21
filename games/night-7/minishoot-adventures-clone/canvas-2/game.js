// Minishoot Adventures Clone - Canvas Implementation
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const WORLD_WIDTH = 50;
const WORLD_HEIGHT = 50;

// Game state
const game = {
    state: 'menu', // menu, playing, dungeon, boss, gameover, victory
    keys: Object.create(null),
    mouse: { x: 400, y: 300 },
    mouseDown: false,
    currentZone: 'village',
    inDungeon: false,
    dungeonLevel: 0,
    bossesDefeated: 0
};

// Player (spaceship)
const player = {
    x: 400, y: 400,
    vx: 0, vy: 0,
    width: 24, height: 24,
    speed: 200,
    hp: 3, maxHp: 3,
    energy: 4, maxEnergy: 4,
    xp: 0, level: 1,
    skillPoints: 0,
    stats: { damage: 1, fireRate: 1, speed: 1 },
    crystals: 0,
    heartPieces: 0,
    energyBatteries: 0,
    hasDash: false,
    hasSupershot: false,
    shootCooldown: 0,
    dashCooldown: 0,
    dashing: false,
    dashTime: 0,
    dashDir: { x: 0, y: 0 },
    invincible: false,
    invincibleTime: 0,
    angle: 0
};

// Camera
const camera = { x: 0, y: 0 };

// Entities
let enemies = [];
let bullets = [];
let items = [];
let npcs = [];
let particles = [];

// Current room
let currentRoom = null;

// Zones and their biome colors
const ZONES = {
    village: { bg: '#3a5a40', floor: '#4a7a50', name: 'Central Village' },
    forest: { bg: '#2a4a3a', floor: '#3a6a4a', name: 'Blue Forest' },
    caves: { bg: '#2a2a4a', floor: '#3a3a6a', name: 'Crystal Caves' }
};

// Enemy types
const ENEMY_TYPES = {
    scout: { hp: 2, speed: 100, damage: 1, xp: 1, size: 16, color: '#e74c3c', fireRate: 2 },
    grasshopper: { hp: 3, speed: 150, damage: 1, xp: 2, size: 18, color: '#27ae60', fireRate: 3 },
    turret: { hp: 5, speed: 0, damage: 1, xp: 3, size: 22, color: '#9b59b6', fireRate: 1.5 },
    treeMimic: { hp: 4, speed: 80, damage: 1, xp: 3, size: 20, color: '#228b22', fireRate: 2 },
    burrower: { hp: 6, speed: 120, damage: 1, xp: 4, size: 20, color: '#8b4513', fireRate: 2.5 },
    heavy: { hp: 10, speed: 60, damage: 2, xp: 5, size: 28, color: '#7f8c8d', fireRate: 1 }
};

// Bosses
const BOSSES = {
    forestGuardian: { hp: 100, name: 'Forest Guardian', color: '#2ecc71' },
    crystalGolem: { hp: 150, name: 'Crystal Golem', color: '#9b59b6' }
};

let boss = null;
let bossPhase = 0;
let bossAttackTimer = 0;

// World map - simple grid-based
let worldMap = [];

// Generate world
function generateWorld() {
    worldMap = [];
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        worldMap[y] = [];
        for (let x = 0; x < WORLD_WIDTH; x++) {
            // Determine zone based on position
            let zone = 'village';
            if (y < 20) zone = 'forest';
            else if (x > 30) zone = 'caves';
            else if (y > 35) zone = 'caves';

            // Simple terrain
            if (Math.random() < 0.1) {
                worldMap[y][x] = { type: 'wall', zone };
            } else {
                worldMap[y][x] = { type: 'floor', zone };
            }
        }
    }

    // Clear spawn area
    for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
            const ty = 25 + dy;
            const tx = 25 + dx;
            if (ty >= 0 && ty < WORLD_HEIGHT && tx >= 0 && tx < WORLD_WIDTH) {
                worldMap[ty][tx] = { type: 'floor', zone: 'village' };
            }
        }
    }

    // Add dungeon entrances
    worldMap[10][25] = { type: 'dungeon', zone: 'forest', dungeon: 1 }; // Forest Temple
    worldMap[40][40] = { type: 'dungeon', zone: 'caves', dungeon: 2 }; // Cave Temple

    // Add NPCs
    npcs = [
        { type: 'elder', x: 25 * TILE_SIZE + 16, y: 26 * TILE_SIZE + 16, name: 'Elder', service: 'lore' },
        { type: 'mechanic', x: 23 * TILE_SIZE + 16, y: 25 * TILE_SIZE + 16, name: 'Mechanic', service: 'respec' },
        { type: 'healer', x: 27 * TILE_SIZE + 16, y: 25 * TILE_SIZE + 16, name: 'Healer', service: 'heal' },
        { type: 'shopkeeper', x: 24 * TILE_SIZE + 16, y: 24 * TILE_SIZE + 16, name: 'Shopkeeper', service: 'shop' },
        { type: 'cartographer', x: 26 * TILE_SIZE + 16, y: 24 * TILE_SIZE + 16, name: 'Cartographer', service: 'map' }
    ];

    // Add items
    items = [
        { type: 'heart', x: 15 * TILE_SIZE, y: 15 * TILE_SIZE },
        { type: 'heart', x: 35 * TILE_SIZE, y: 20 * TILE_SIZE },
        { type: 'heart', x: 20 * TILE_SIZE, y: 40 * TILE_SIZE },
        { type: 'energy', x: 30 * TILE_SIZE, y: 15 * TILE_SIZE },
        { type: 'energy', x: 45 * TILE_SIZE, y: 35 * TILE_SIZE }
    ];
}

// Spawn enemies in area
function spawnEnemies() {
    enemies = [];

    // Get current zone based on player position
    const zone = getZoneAt(player.x, player.y);

    // Spawn appropriate enemies
    const types = zone === 'forest' ? ['scout', 'grasshopper', 'treeMimic'] :
                  zone === 'caves' ? ['turret', 'burrower', 'heavy'] :
                  ['scout'];

    // Spawn 5-10 enemies nearby
    const count = 5 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const data = ENEMY_TYPES[type];

        // Random position within view but not too close
        let ex, ey;
        do {
            ex = player.x + (Math.random() - 0.5) * 600;
            ey = player.y + (Math.random() - 0.5) * 600;
        } while (Math.sqrt((ex - player.x) ** 2 + (ey - player.y) ** 2) < 150);

        enemies.push({
            type,
            x: ex, y: ey,
            ...data,
            currentHp: data.hp,
            maxHp: data.hp,
            shootTimer: Math.random() * 2,
            angle: 0,
            active: true
        });
    }
}

function getZoneAt(x, y) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    if (ty >= 0 && ty < WORLD_HEIGHT && tx >= 0 && tx < WORLD_WIDTH) {
        return worldMap[ty][tx].zone;
    }
    return 'village';
}

// Update
function update(dt) {
    if (game.state !== 'playing' && game.state !== 'boss') return;

    updatePlayer(dt);
    updateEnemies(dt);
    updateBoss(dt);
    updateBullets(dt);
    updateParticles(dt);
    checkItems();
    checkNPCs();
    checkDungeonEntrance();

    // Spawn new enemies if all cleared
    if (enemies.length === 0 && !boss && !game.inDungeon) {
        spawnEnemies();
    }
}

function updatePlayer(dt) {
    // Invincibility
    if (player.invincibleTime > 0) {
        player.invincibleTime -= dt;
        if (player.invincibleTime <= 0) player.invincible = false;
    }

    // Dash
    if (player.dashing) {
        player.dashTime -= dt;
        player.x += player.dashDir.x * 600 * dt;
        player.y += player.dashDir.y * 600 * dt;

        if (player.dashTime <= 0) {
            player.dashing = false;
            player.dashCooldown = 0.5;
        }
        return;
    }

    // Cooldowns
    if (player.shootCooldown > 0) player.shootCooldown -= dt;
    if (player.dashCooldown > 0) player.dashCooldown -= dt;

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

        const speed = player.speed + player.stats.speed * 20;
        const newX = player.x + dx * speed * dt;
        const newY = player.y + dy * speed * dt;

        // Collision check
        if (!checkWallCollision(newX, player.y)) {
            player.x = newX;
        }
        if (!checkWallCollision(player.x, newY)) {
            player.y = newY;
        }
    }

    // Aim
    player.angle = Math.atan2(game.mouse.y + camera.y - player.y, game.mouse.x + camera.x - player.x);

    // Shooting
    if (game.mouseDown && player.shootCooldown <= 0) {
        shoot(false);
    }

    // Camera
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
    camera.x = Math.max(0, Math.min(WORLD_WIDTH * TILE_SIZE - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT * TILE_SIZE - canvas.height, camera.y));
}

function checkWallCollision(x, y) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);

    if (tx < 0 || tx >= WORLD_WIDTH || ty < 0 || ty >= WORLD_HEIGHT) return true;
    return worldMap[ty][tx].type === 'wall';
}

function shoot(supershot) {
    if (supershot && player.energy <= 0) return;

    const fireRate = 3 + player.stats.fireRate;
    const damage = player.stats.damage + 1;

    bullets.push({
        x: player.x + Math.cos(player.angle) * 15,
        y: player.y + Math.sin(player.angle) * 15,
        vx: Math.cos(player.angle) * 400,
        vy: Math.sin(player.angle) * 400,
        damage: supershot ? damage * 3 : damage,
        enemy: false,
        supershot
    });

    player.shootCooldown = 1 / fireRate;

    if (supershot) player.energy--;

    // Particle
    particles.push({
        x: player.x + Math.cos(player.angle) * 20,
        y: player.y + Math.sin(player.angle) * 20,
        size: supershot ? 12 : 8,
        color: supershot ? '#3498db' : '#f1c40f',
        life: 0.15
    });
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        if (!enemy.active) continue;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        enemy.angle = Math.atan2(dy, dx);

        // Movement
        if (enemy.speed > 0 && dist > 50) {
            enemy.x += (dx / dist) * enemy.speed * dt;
            enemy.y += (dy / dist) * enemy.speed * dt;
        }

        // Shooting
        if (dist < 400) {
            enemy.shootTimer -= dt;
            if (enemy.shootTimer <= 0) {
                bullets.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: (dx / dist) * 150,
                    vy: (dy / dist) * 150,
                    damage: enemy.damage,
                    enemy: true
                });
                enemy.shootTimer = 1 / enemy.fireRate;
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
    if (dist > 150) {
        boss.x += (dx / dist) * 50 * dt;
        boss.y += (dy / dist) * 50 * dt;
    }

    // Attacks
    bossAttackTimer -= dt;
    if (bossAttackTimer <= 0) {
        performBossAttack();
        bossAttackTimer = 2 - (boss.currentHp < boss.maxHp / 2 ? 0.5 : 0);
    }
}

function performBossAttack() {
    const angle = boss.angle;

    if (boss.type === 'forestGuardian') {
        // Ring of leaves
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            bullets.push({
                x: boss.x, y: boss.y,
                vx: Math.cos(a) * 180,
                vy: Math.sin(a) * 180,
                damage: 1, enemy: true
            });
        }
    } else if (boss.type === 'crystalGolem') {
        // Triple shot + ring
        for (let i = -1; i <= 1; i++) {
            bullets.push({
                x: boss.x, y: boss.y,
                vx: Math.cos(angle + i * 0.3) * 200,
                vy: Math.sin(angle + i * 0.3) * 200,
                damage: 2, enemy: true
            });
        }

        if (boss.currentHp < boss.maxHp / 2) {
            // Phase 2: add crystal shards
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * Math.PI * 2;
                bullets.push({
                    x: boss.x, y: boss.y,
                    vx: Math.cos(a) * 120,
                    vy: Math.sin(a) * 120,
                    damage: 1, enemy: true
                });
            }
        }
    }
}

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;

        // Bounds/wall check
        if (checkWallCollision(bullet.x, bullet.y) ||
            bullet.x < camera.x - 50 || bullet.x > camera.x + canvas.width + 50 ||
            bullet.y < camera.y - 50 || bullet.y > camera.y + canvas.height + 50) {
            bullets.splice(i, 1);
            continue;
        }

        // Player bullet hitting enemies
        if (!bullet.enemy) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                if (!enemy.active) continue;

                const d = Math.sqrt((enemy.x - bullet.x) ** 2 + (enemy.y - bullet.y) ** 2);
                if (d < enemy.size) {
                    enemy.currentHp -= bullet.damage;
                    bullets.splice(i, 1);

                    particles.push({
                        x: bullet.x, y: bullet.y,
                        size: 6, color: '#ff6b6b', life: 0.2
                    });

                    if (enemy.currentHp <= 0) {
                        // Drop crystals
                        player.crystals += enemy.xp;
                        player.xp += enemy.xp;

                        // Check level up
                        checkLevelUp();

                        // Death particles
                        for (let k = 0; k < 5; k++) {
                            particles.push({
                                x: enemy.x + (Math.random() - 0.5) * 20,
                                y: enemy.y + (Math.random() - 0.5) * 20,
                                size: 5, color: enemy.color, life: 0.4
                            });
                        }

                        enemies.splice(j, 1);
                    }
                    break;
                }
            }

            // Hit boss
            if (boss) {
                const d = Math.sqrt((boss.x - bullet.x) ** 2 + (boss.y - bullet.y) ** 2);
                if (d < 50) {
                    boss.currentHp -= bullet.damage;
                    bullets.splice(i, 1);

                    particles.push({
                        x: bullet.x, y: bullet.y,
                        size: 10, color: '#fff', life: 0.2
                    });

                    if (boss.currentHp <= 0) {
                        // Boss defeated
                        game.bossesDefeated++;
                        player.crystals += 50;

                        // Grant ability
                        if (boss.type === 'forestGuardian') {
                            player.hasDash = true;
                        } else if (boss.type === 'crystalGolem') {
                            player.hasSupershot = true;
                        }

                        boss = null;
                        game.state = game.bossesDefeated >= 2 ? 'victory' : 'playing';
                        game.inDungeon = false;

                        // Teleport back to village
                        player.x = 25 * TILE_SIZE;
                        player.y = 25 * TILE_SIZE;
                    }
                }
            }
        }

        // Enemy bullet hitting player
        if (bullet.enemy && !player.invincible && !player.dashing) {
            const d = Math.sqrt((player.x - bullet.x) ** 2 + (player.y - bullet.y) ** 2);
            if (d < player.width / 2) {
                playerTakeDamage(bullet.damage);
                bullets.splice(i, 1);
            }
        }
    }
}

function playerTakeDamage(amount) {
    if (player.invincible || player.dashing) return;

    player.hp -= amount;
    player.invincible = true;
    player.invincibleTime = 1;

    particles.push({
        x: player.x, y: player.y,
        size: 20, color: '#e74c3c', life: 0.3
    });

    if (player.hp <= 0) {
        game.state = 'gameover';
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

function checkLevelUp() {
    const xpNeeded = player.level * 10;
    if (player.xp >= xpNeeded) {
        player.xp -= xpNeeded;
        player.level++;
        player.skillPoints++;

        particles.push({
            x: player.x, y: player.y - 30,
            size: 30, color: '#f1c40f', life: 0.5
        });
    }
}

function checkItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const d = Math.sqrt((player.x - item.x) ** 2 + (player.y - item.y) ** 2);

        if (d < 30) {
            if (item.type === 'heart') {
                player.heartPieces++;
                if (player.heartPieces >= 4) {
                    player.heartPieces = 0;
                    player.maxHp++;
                    player.hp = player.maxHp;
                }
            } else if (item.type === 'energy') {
                player.energyBatteries++;
                player.maxEnergy++;
                player.energy = player.maxEnergy;
            } else if (item.type === 'crystal') {
                player.crystals += 10;
            }
            items.splice(i, 1);
        }
    }
}

function checkNPCs() {
    for (const npc of npcs) {
        const d = Math.sqrt((player.x - npc.x) ** 2 + (player.y - npc.y) ** 2);

        if (d < 40 && game.keys['KeyE']) {
            // Interact
            if (npc.service === 'heal') {
                player.hp = player.maxHp;
                player.energy = player.maxEnergy;
            } else if (npc.service === 'respec') {
                player.skillPoints += player.stats.damage + player.stats.fireRate + player.stats.speed;
                player.stats = { damage: 1, fireRate: 1, speed: 1 };
            }
            game.keys['KeyE'] = false;
        }
    }
}

function checkDungeonEntrance() {
    const tx = Math.floor(player.x / TILE_SIZE);
    const ty = Math.floor(player.y / TILE_SIZE);

    if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
        const tile = worldMap[ty][tx];
        if (tile.type === 'dungeon' && game.keys['KeyE']) {
            enterDungeon(tile.dungeon);
            game.keys['KeyE'] = false;
        }
    }
}

function enterDungeon(dungeonNum) {
    game.inDungeon = true;
    game.dungeonLevel = dungeonNum;
    enemies = [];
    bullets = [];

    // Create boss
    if (dungeonNum === 1) {
        boss = {
            type: 'forestGuardian',
            ...BOSSES.forestGuardian,
            x: player.x,
            y: player.y - 200,
            currentHp: BOSSES.forestGuardian.hp,
            maxHp: BOSSES.forestGuardian.hp,
            angle: 0
        };
    } else {
        boss = {
            type: 'crystalGolem',
            ...BOSSES.crystalGolem,
            x: player.x,
            y: player.y - 200,
            currentHp: BOSSES.crystalGolem.hp,
            maxHp: BOSSES.crystalGolem.hp,
            angle: 0
        };
    }

    game.state = 'boss';
    bossAttackTimer = 2;
}

// Drawing
function draw() {
    // Clear
    ctx.fillStyle = '#1a3a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === 'menu') {
        drawMenu();
    } else if (game.state === 'playing' || game.state === 'boss') {
        drawGame();
        drawHUD();
    } else if (game.state === 'gameover') {
        drawGame();
        drawGameOver();
    } else if (game.state === 'victory') {
        drawGame();
        drawVictory();
    }
}

function drawGame() {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw world
    const startX = Math.floor(camera.x / TILE_SIZE);
    const startY = Math.floor(camera.y / TILE_SIZE);
    const endX = Math.min(WORLD_WIDTH, startX + Math.ceil(canvas.width / TILE_SIZE) + 2);
    const endY = Math.min(WORLD_HEIGHT, startY + Math.ceil(canvas.height / TILE_SIZE) + 2);

    for (let y = Math.max(0, startY); y < endY; y++) {
        for (let x = Math.max(0, startX); x < endX; x++) {
            const tile = worldMap[y][x];
            const zone = ZONES[tile.zone];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            if (tile.type === 'floor') {
                ctx.fillStyle = zone.floor;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Grass detail
                if (tile.zone === 'forest' || tile.zone === 'village') {
                    ctx.fillStyle = '#5a9a6a';
                    for (let i = 0; i < 3; i++) {
                        const gx = px + 5 + i * 10;
                        const gy = py + 10 + (i % 2) * 10;
                        ctx.fillRect(gx, gy, 2, 6);
                    }
                }
            } else if (tile.type === 'wall') {
                ctx.fillStyle = zone.bg;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                // Tree/rock
                if (tile.zone === 'forest' || tile.zone === 'village') {
                    ctx.fillStyle = '#2d5a3a';
                    ctx.beginPath();
                    ctx.arc(px + 16, py + 20, 14, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#8b4513';
                    ctx.fillRect(px + 13, py + 24, 6, 8);
                } else {
                    ctx.fillStyle = '#5a5a7a';
                    ctx.fillRect(px + 4, py + 4, 24, 24);
                }
            } else if (tile.type === 'dungeon') {
                ctx.fillStyle = '#4a2a2a';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#2a1a1a';
                ctx.fillRect(px + 8, py + 4, 16, 24);
                ctx.fillStyle = '#f1c40f';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('D' + tile.dungeon, px + 16, py + 20);
            }
        }
    }

    // Items
    for (const item of items) {
        if (item.type === 'heart') {
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('+', item.x, item.y + 4);
        } else if (item.type === 'energy') {
            ctx.fillStyle = '#3498db';
            ctx.fillRect(item.x - 6, item.y - 10, 12, 20);
            ctx.fillStyle = '#fff';
            ctx.fillRect(item.x - 3, item.y - 7, 6, 14);
        }
    }

    // NPCs
    for (const npc of npcs) {
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(npc.x, npc.y, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, npc.x, npc.y - 20);

        // Interaction hint
        const d = Math.sqrt((player.x - npc.x) ** 2 + (player.y - npc.y) ** 2);
        if (d < 50) {
            ctx.fillStyle = '#fff';
            ctx.fillText('[E]', npc.x, npc.y + 30);
        }
    }

    // Enemies
    for (const enemy of enemies) {
        if (!enemy.active) continue;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);

        // Body (cute spaceship style)
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(enemy.size / 4, -3, 3, 0, Math.PI * 2);
        ctx.arc(enemy.size / 4, 3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // HP bar
        if (enemy.currentHp < enemy.maxHp) {
            ctx.fillStyle = '#333';
            ctx.fillRect(enemy.x - enemy.size / 2, enemy.y - enemy.size / 2 - 8, enemy.size, 4);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(enemy.x - enemy.size / 2, enemy.y - enemy.size / 2 - 8, enemy.size * (enemy.currentHp / enemy.maxHp), 4);
        }
    }

    // Boss
    if (boss) {
        ctx.save();
        ctx.translate(boss.x, boss.y);

        // Body
        ctx.fillStyle = boss.color;
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        const pulse = Math.sin(Date.now() * 0.005) * 5;
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, 30 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Eyes
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(-15, -10, 8, 0, Math.PI * 2);
        ctx.arc(15, -10, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // HP bar
        ctx.fillStyle = '#333';
        ctx.fillRect(boss.x - 60, boss.y - 70, 120, 10);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(boss.x - 60, boss.y - 70, 120 * (boss.currentHp / boss.maxHp), 10);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(boss.name, boss.x, boss.y - 80);
    }

    // Bullets
    for (const bullet of bullets) {
        ctx.fillStyle = bullet.enemy ? '#ff6b6b' : (bullet.supershot ? '#3498db' : '#f1c40f');
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.supershot ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Particles
    for (const p of particles) {
        ctx.globalAlpha = p.life * 2;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life * 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Player
    drawPlayer();

    ctx.restore();
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    // Invincibility flash
    if (player.invincible) {
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
    }

    // Body (cute spaceship)
    ctx.fillStyle = '#5dade2';
    ctx.beginPath();
    ctx.ellipse(0, 0, player.width / 2, player.height / 2 - 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#85c1e9';
    ctx.beginPath();
    ctx.ellipse(4, 0, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thruster
    if (player.dashing) {
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.moveTo(-player.width / 2, -4);
        ctx.lineTo(-player.width / 2 - 15, 0);
        ctx.lineTo(-player.width / 2, 4);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

function drawHUD() {
    // Health
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, 10, 150, 30);
    for (let i = 0; i < player.maxHp; i++) {
        ctx.fillStyle = i < player.hp ? '#e74c3c' : '#333';
        ctx.beginPath();
        ctx.arc(25 + i * 20, 25, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Energy
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, 45, 120, 20);
    for (let i = 0; i < player.maxEnergy; i++) {
        ctx.fillStyle = i < player.energy ? '#3498db' : '#333';
        ctx.fillRect(15 + i * 25, 50, 20, 10);
    }

    // Level/XP
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Lv.${player.level} XP:${player.xp}/${player.level * 10}`, 10, 85);

    // Crystals
    ctx.fillStyle = '#e74c3c';
    ctx.fillText(`Crystals: ${player.crystals}`, 10, 105);

    // Skill points
    if (player.skillPoints > 0) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`Skill Points: ${player.skillPoints} (1-2-3 to spend)`, 10, 125);
    }

    // Stats
    ctx.fillStyle = '#aaa';
    ctx.font = '12px sans-serif';
    ctx.fillText(`DMG:${player.stats.damage} RATE:${player.stats.fireRate} SPD:${player.stats.speed}`, 10, 145);

    // Abilities
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    if (player.hasDash) ctx.fillText('DASH [Space]', canvas.width - 10, 20);
    if (player.hasSupershot) ctx.fillText('SUPERSHOT [RMB]', canvas.width - 10, 40);

    // Zone
    const zone = getZoneAt(player.x, player.y);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ZONES[zone].name, canvas.width / 2, 25);

    // Bosses defeated
    ctx.fillStyle = '#f1c40f';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Bosses: ${game.bossesDefeated}/2`, canvas.width / 2, 45);
}

function drawMenu() {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#2a5a4a');
    gradient.addColorStop(1, '#1a3a2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#5dade2';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MINISHOOT', canvas.width / 2, 180);
    ctx.fillStyle = '#85c1e9';
    ctx.font = '24px sans-serif';
    ctx.fillText('ADVENTURES', canvas.width / 2, 220);

    // Cute ship
    ctx.save();
    ctx.translate(canvas.width / 2, 320);

    ctx.fillStyle = '#5dade2';
    ctx.beginPath();
    ctx.ellipse(0, 0, 40, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#85c1e9';
    ctx.beginPath();
    ctx.ellipse(10, 0, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Click to Start', canvas.width / 2, 430);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('WASD - Move | Mouse - Aim | Click - Shoot', canvas.width / 2, 480);
    ctx.fillText('Space - Dash | RMB - Supershot | E - Interact', canvas.width / 2, 505);
    ctx.fillText('1/2/3 - Spend Skill Points', canvas.width / 2, 530);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, 250);

    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Level: ${player.level} | Crystals: ${player.crystals}`, canvas.width / 2, 320);
    ctx.fillText(`Bosses Defeated: ${game.bossesDefeated}/2`, canvas.width / 2, 360);

    ctx.fillText('Click to restart', canvas.width / 2, 440);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, 200);

    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('You defeated both dungeon bosses!', canvas.width / 2, 280);
    ctx.fillText(`Final Level: ${player.level}`, canvas.width / 2, 330);
    ctx.fillText(`Crystals Collected: ${player.crystals}`, canvas.width / 2, 370);

    ctx.fillStyle = '#aaa';
    ctx.font = '16px sans-serif';
    ctx.fillText('The world is saved. Peace returns to the land.', canvas.width / 2, 430);

    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Click to play again', canvas.width / 2, 500);
}

// Input
document.addEventListener('keydown', e => {
    game.keys[e.code] = true;

    if (game.state === 'playing' || game.state === 'boss') {
        // Dash
        if (e.code === 'Space' && player.hasDash && player.dashCooldown <= 0 && !player.dashing) {
            let dx = 0, dy = 0;
            if (game.keys['KeyW']) dy = -1;
            if (game.keys['KeyS']) dy = 1;
            if (game.keys['KeyA']) dx = -1;
            if (game.keys['KeyD']) dx = 1;

            if (dx === 0 && dy === 0) {
                dx = Math.cos(player.angle);
                dy = Math.sin(player.angle);
            }

            const len = Math.sqrt(dx * dx + dy * dy);
            player.dashDir = { x: dx / len, y: dy / len };
            player.dashing = true;
            player.dashTime = 0.2;
            player.invincible = true;
        }

        // Skill points
        if (player.skillPoints > 0) {
            if (e.code === 'Digit1') {
                player.stats.damage++;
                player.skillPoints--;
            } else if (e.code === 'Digit2') {
                player.stats.fireRate++;
                player.skillPoints--;
            } else if (e.code === 'Digit3') {
                player.stats.speed++;
                player.skillPoints--;
            }
        }
    }
});

document.addEventListener('keyup', e => {
    game.keys[e.code] = false;
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    game.mouse.x = e.clientX - rect.left;
    game.mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', e => {
    if (e.button === 0) game.mouseDown = true;

    if (game.state === 'menu') {
        game.state = 'playing';
        generateWorld();
        player.x = 25 * TILE_SIZE;
        player.y = 25 * TILE_SIZE;
        spawnEnemies();
    }

    if (game.state === 'gameover' || game.state === 'victory') {
        // Reset
        game.state = 'playing';
        game.bossesDefeated = 0;
        game.inDungeon = false;
        player.hp = 3;
        player.maxHp = 3;
        player.energy = 4;
        player.maxEnergy = 4;
        player.xp = 0;
        player.level = 1;
        player.skillPoints = 0;
        player.stats = { damage: 1, fireRate: 1, speed: 1 };
        player.crystals = 0;
        player.heartPieces = 0;
        player.energyBatteries = 0;
        player.hasDash = false;
        player.hasSupershot = false;
        boss = null;
        bullets = [];
        particles = [];
        generateWorld();
        player.x = 25 * TILE_SIZE;
        player.y = 25 * TILE_SIZE;
        spawnEnemies();
    }

    // Supershot
    if ((game.state === 'playing' || game.state === 'boss') && e.button === 2 && player.hasSupershot) {
        shoot(true);
    }
});

canvas.addEventListener('mouseup', e => {
    if (e.button === 0) game.mouseDown = false;
});

canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
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
