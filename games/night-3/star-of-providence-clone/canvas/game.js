// Star of Providence Clone - Canvas Version
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Color palette - dark sci-fi pixel art
const COLORS = {
    background: '#0a0a15',
    floorDark: '#2a1a0a',
    floorLight: '#3a2810',
    wallDark: '#483018',
    wallLight: '#584020',
    wallHighlight: '#685028',
    uiGreen: '#00ff88',
    uiGreenDark: '#00aa55',
    uiRed: '#ff4444',
    uiOrange: '#ff8800',
    player: '#00ffaa',
    playerGlow: '#00ff88',
    bulletPlayer: '#ffff00',
    bulletEnemy: '#ff4444',
    bulletEnemyOrange: '#ff6600',
    debris: '#ffcc00',
    ghost: '#4488aa',
    drone: '#888899',
    turret: '#aa6644',
    fireball: '#ff4400',
    heart: '#00ff66'
};

// Game state
const game = {
    state: 'playing',
    floor: 1,
    room: 0,
    roomsCleared: 0,
    debris: 0,
    multiplier: 1.0,
    time: 0
};

// Player
const player = {
    x: 400,
    y: 450,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    speed: 250,
    focusSpeed: 100,
    hp: 4,
    maxHp: 4,
    bombs: 2,
    maxBombs: 3,
    damage: 1,
    fireRate: 10,
    fireCooldown: 0,
    ammo: 100,
    maxAmmo: 100,
    dashCooldown: 0,
    dashDuration: 0,
    invincible: 0,
    isFocused: false,
    weapon: 'PEASHOOTER'
};

// Input
const keys = {};
const mouse = { x: 400, y: 300, down: false };

// Entity arrays
let playerBullets = [];
let enemyBullets = [];
let enemies = [];
let pickups = [];
let particles = [];

// Room layout
const TILE_SIZE = 32;
const ROOM_WIDTH = 20;
const ROOM_HEIGHT = 14;
let roomTiles = [];

// Generate room
function generateRoom() {
    roomTiles = [];
    for (let y = 0; y < ROOM_HEIGHT; y++) {
        roomTiles[y] = [];
        for (let x = 0; x < ROOM_WIDTH; x++) {
            // Walls on edges
            if (x === 0 || x === ROOM_WIDTH - 1 || y === 0 || y === ROOM_HEIGHT - 1) {
                roomTiles[y][x] = 1; // wall
            } else {
                roomTiles[y][x] = 0; // floor
            }
        }
    }

    // Add doors (center of each wall)
    roomTiles[0][10] = 2; // top door
    roomTiles[ROOM_HEIGHT - 1][10] = 2; // bottom door
    roomTiles[7][0] = 2; // left door
    roomTiles[7][ROOM_WIDTH - 1] = 2; // right door

    // Add some pillars/obstacles
    const pillarCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < pillarCount; i++) {
        const px = 3 + Math.floor(Math.random() * (ROOM_WIDTH - 6));
        const py = 3 + Math.floor(Math.random() * (ROOM_HEIGHT - 6));
        roomTiles[py][px] = 1;
        if (Math.random() > 0.5 && px + 1 < ROOM_WIDTH - 1) roomTiles[py][px + 1] = 1;
        if (Math.random() > 0.5 && py + 1 < ROOM_HEIGHT - 1) roomTiles[py + 1][px] = 1;
    }

    // Reset player position
    player.x = 400;
    player.y = 450;

    // Spawn enemies
    spawnEnemies();
}

function spawnEnemies() {
    enemies = [];
    const count = 3 + game.floor + Math.floor(game.roomsCleared / 2);

    for (let i = 0; i < count; i++) {
        const types = ['ghost', 'drone', 'turret'];
        const weights = [0.5, 0.3, 0.2];
        const rand = Math.random();
        let type = 'ghost';
        if (rand > weights[0]) type = 'drone';
        if (rand > weights[0] + weights[1]) type = 'turret';

        let x, y;
        let valid = false;
        while (!valid) {
            x = 80 + Math.random() * 560;
            y = 80 + Math.random() * 280;
            if (Math.hypot(x - player.x, y - player.y) > 150) {
                valid = true;
            }
        }

        enemies.push(createEnemy(type, x, y));
    }
}

function createEnemy(type, x, y) {
    const configs = {
        ghost: { hp: 3, speed: 80, fireRate: 2000, size: 16, debris: 10, color: COLORS.ghost },
        drone: { hp: 5, speed: 120, fireRate: 1500, size: 14, debris: 30, color: COLORS.drone },
        turret: { hp: 8, speed: 0, fireRate: 1000, size: 18, debris: 25, color: COLORS.turret }
    };
    const cfg = configs[type];
    return {
        type, x, y,
        vx: (Math.random() - 0.5) * cfg.speed,
        vy: (Math.random() - 0.5) * cfg.speed,
        hp: cfg.hp, maxHp: cfg.hp,
        speed: cfg.speed,
        fireRate: cfg.fireRate,
        lastFire: Math.random() * 1000,
        size: cfg.size,
        color: cfg.color,
        debris: cfg.debris,
        hitFlash: 0,
        angle: Math.random() * Math.PI * 2
    };
}

// Drawing
function drawRoom() {
    const offsetX = (canvas.width - ROOM_WIDTH * TILE_SIZE) / 2;
    const offsetY = 80;

    for (let y = 0; y < ROOM_HEIGHT; y++) {
        for (let x = 0; x < ROOM_WIDTH; x++) {
            const tile = roomTiles[y][x];
            const tx = offsetX + x * TILE_SIZE;
            const ty = offsetY + y * TILE_SIZE;

            if (tile === 0) {
                // Floor - checkered pattern
                const isLight = (x + y) % 2 === 0;
                ctx.fillStyle = isLight ? COLORS.floorLight : COLORS.floorDark;
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

                // Floor detail
                if (Math.random() > 0.95) {
                    ctx.fillStyle = COLORS.floorDark;
                    ctx.fillRect(tx + 4, ty + 4, 4, 4);
                }
            } else if (tile === 1) {
                // Wall - pixelated brick pattern
                ctx.fillStyle = COLORS.wallDark;
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

                // Brick pattern
                ctx.fillStyle = COLORS.wallLight;
                ctx.fillRect(tx + 2, ty + 2, 12, 10);
                ctx.fillRect(tx + 18, ty + 2, 12, 10);
                ctx.fillRect(tx + 8, ty + 16, 16, 10);

                // Highlight
                ctx.fillStyle = COLORS.wallHighlight;
                ctx.fillRect(tx + 2, ty + 2, 12, 3);
            } else if (tile === 2) {
                // Door
                ctx.fillStyle = COLORS.floorDark;
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#444444';
                ctx.fillRect(tx + 8, ty + 4, 16, 24);
            }
        }
    }

    // Room border glow
    ctx.strokeStyle = COLORS.uiGreenDark;
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, offsetY, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);
}

function drawPlayer() {
    const { x, y, angle, invincible, isFocused, dashDuration } = player;

    if (invincible > 0 && Math.floor(invincible * 10) % 2 === 0) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);

    // Dash effect
    if (dashDuration > 0) {
        ctx.shadowColor = COLORS.playerGlow;
        ctx.shadowBlur = 20;
    }

    // Engine glow
    ctx.fillStyle = isFocused ? '#ff4488' : COLORS.playerGlow;
    ctx.fillRect(-4, 8, 8, 6);

    // Ship body (pixel art style triangle)
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-8, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(8, 8);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -4, 4, 4);

    // Focus hitbox indicator
    if (isFocused) {
        ctx.strokeStyle = '#ff4488';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

function drawEnemy(enemy) {
    const { x, y, type, size, color, hp, maxHp, hitFlash, angle } = enemy;

    ctx.save();
    ctx.translate(x, y);

    // Hit flash
    const drawColor = hitFlash > 0 ? '#ffffff' : color;

    if (type === 'ghost') {
        // Ghost - round with trailing effect
        ctx.fillStyle = drawColor;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(-6, -4, 4, 4);
        ctx.fillRect(2, -4, 4, 4);

        // Wavy bottom
        ctx.fillStyle = drawColor;
        for (let i = -2; i <= 2; i++) {
            ctx.fillRect(i * 6 - 2, size - 4 + Math.sin(game.time * 5 + i) * 2, 4, 6);
        }
    } else if (type === 'drone') {
        // Drone - angular ship
        ctx.rotate(angle);
        ctx.fillStyle = drawColor;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size * 0.7, size * 0.7);
        ctx.lineTo(0, size * 0.3);
        ctx.lineTo(size * 0.7, size * 0.7);
        ctx.closePath();
        ctx.fill();

        // Red eye
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-2, -4, 4, 4);
    } else if (type === 'turret') {
        // Turret - square with rotating gun
        ctx.fillStyle = drawColor;
        ctx.fillRect(-size, -size, size * 2, size * 2);

        // Gun barrel
        ctx.rotate(angle);
        ctx.fillStyle = '#666666';
        ctx.fillRect(-3, -size - 8, 6, 12);

        // Core
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    // HP bar
    if (hp < maxHp) {
        const barWidth = size * 2;
        ctx.fillStyle = '#400000';
        ctx.fillRect(x - barWidth / 2, y - size - 10, barWidth, 4);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(x - barWidth / 2, y - size - 10, barWidth * (hp / maxHp), 4);
    }
}

function drawBullet(bullet, isEnemy) {
    ctx.save();
    ctx.translate(bullet.x, bullet.y);

    if (isEnemy) {
        // Enemy bullet - red/orange
        ctx.fillStyle = bullet.color || COLORS.bulletEnemy;
        ctx.beginPath();
        ctx.arc(0, 0, bullet.size, 0, Math.PI * 2);
        ctx.fill();

        // Dark center
        ctx.fillStyle = '#800000';
        ctx.beginPath();
        ctx.arc(0, 0, bullet.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Player bullet - yellow
        const angle = Math.atan2(bullet.vy, bullet.vx);
        ctx.rotate(angle);

        ctx.fillStyle = COLORS.bulletPlayer;
        ctx.fillRect(-bullet.size * 1.5, -bullet.size / 2, bullet.size * 3, bullet.size);

        // Bright core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bullet.size * 0.5, -1, bullet.size, 2);
    }

    ctx.restore();
}

function drawPickup(pickup) {
    const { x, y, type, value } = pickup;
    const bob = Math.sin(game.time * 5 + x) * 3;

    ctx.save();
    ctx.translate(x, y + bob);

    if (type === 'debris') {
        // Yellow debris/currency
        ctx.fillStyle = COLORS.debris;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const r = 6 + value;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    } else if (type === 'health') {
        // Green heart
        ctx.fillStyle = COLORS.heart;
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.bezierCurveTo(-8, -4, -8, -8, 0, -4);
        ctx.bezierCurveTo(8, -8, 8, -4, 0, 4);
        ctx.fill();
    }

    ctx.restore();
}

function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size * p.life, p.size * p.life);
    ctx.restore();
}

function drawHUD() {
    const offsetX = (canvas.width - ROOM_WIDTH * TILE_SIZE) / 2;

    // Weapon panel (left)
    ctx.strokeStyle = COLORS.uiGreen;
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, 15, 120, 50);
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(offsetX + 2, 17, 116, 46);

    // Weapon icon
    ctx.fillStyle = COLORS.uiGreen;
    ctx.fillRect(offsetX + 10, 25, 30, 20);
    ctx.fillStyle = '#000000';
    ctx.fillRect(offsetX + 12, 27, 26, 16);
    ctx.fillStyle = COLORS.bulletPlayer;
    ctx.fillRect(offsetX + 15, 32, 20, 6);

    // Ammo indicator
    ctx.fillStyle = COLORS.uiGreen;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    if (player.weapon === 'PEASHOOTER') {
        ctx.fillText('∞', offsetX + 50, 40);
    } else {
        ctx.fillText(Math.floor(player.ammo).toString(), offsetX + 50, 40);
    }

    // Bombs
    ctx.fillStyle = COLORS.uiOrange;
    for (let i = 0; i < player.maxBombs; i++) {
        if (i < player.bombs) {
            ctx.fillRect(offsetX + 10 + i * 12, 52, 8, 8);
        } else {
            ctx.strokeStyle = COLORS.uiOrange;
            ctx.lineWidth = 1;
            ctx.strokeRect(offsetX + 10 + i * 12, 52, 8, 8);
        }
    }

    // HP hearts (center)
    const hpStartX = 330;
    ctx.fillStyle = COLORS.heart;
    for (let i = 0; i < player.maxHp; i++) {
        const hx = hpStartX + i * 24;
        if (i < player.hp) {
            // Filled heart
            ctx.beginPath();
            ctx.moveTo(hx, 38);
            ctx.bezierCurveTo(hx - 10, 20, hx - 10, 14, hx, 24);
            ctx.bezierCurveTo(hx + 10, 14, hx + 10, 20, hx, 38);
            ctx.fill();
        } else {
            // Empty heart outline
            ctx.strokeStyle = COLORS.uiGreenDark;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(hx, 38);
            ctx.bezierCurveTo(hx - 10, 20, hx - 10, 14, hx, 24);
            ctx.bezierCurveTo(hx + 10, 14, hx + 10, 20, hx, 38);
            ctx.stroke();
        }
    }

    // Multiplier & debris panel (right)
    const rightX = offsetX + ROOM_WIDTH * TILE_SIZE - 120;
    ctx.strokeStyle = COLORS.uiGreen;
    ctx.lineWidth = 2;
    ctx.strokeRect(rightX, 15, 120, 50);
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(rightX + 2, 17, 116, 46);

    // Multiplier
    ctx.fillStyle = COLORS.uiGreen;
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`x${game.multiplier.toFixed(1)}`, rightX + 110, 38);

    // Debris
    ctx.fillStyle = COLORS.debris;
    ctx.fillText(`${game.debris}G`, rightX + 110, 55);

    // Floor indicator
    ctx.fillStyle = COLORS.uiGreen;
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`FLOOR ${game.floor} - ROOM ${game.roomsCleared + 1}`, canvas.width / 2, canvas.height - 20);

    // Enemy count
    ctx.textAlign = 'right';
    ctx.fillText(`ENEMIES: ${enemies.length}`, canvas.width - 20, canvas.height - 20);

    // Dash cooldown indicator
    if (player.dashCooldown > 0) {
        ctx.fillStyle = '#444444';
        ctx.fillRect(canvas.width / 2 - 30, canvas.height - 45, 60, 6);
        ctx.fillStyle = COLORS.uiGreen;
        ctx.fillRect(canvas.width / 2 - 30, canvas.height - 45, 60 * (1 - player.dashCooldown / 0.5), 6);
    }
}

// Update functions
function updatePlayer(dt) {
    // Movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    // Normalize diagonal
    if (dx && dy) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Focus mode
    player.isFocused = keys['shift'] || mouse.rightDown;
    const speed = player.isFocused ? player.focusSpeed : player.speed;

    // Dash
    if (player.dashDuration > 0) {
        player.dashDuration -= dt;
    } else {
        player.vx = dx * speed;
        player.vy = dy * speed;
    }

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Room bounds
    const offsetX = (canvas.width - ROOM_WIDTH * TILE_SIZE) / 2;
    const offsetY = 80;
    player.x = Math.max(offsetX + 20, Math.min(offsetX + ROOM_WIDTH * TILE_SIZE - 20, player.x));
    player.y = Math.max(offsetY + 20, Math.min(offsetY + ROOM_HEIGHT * TILE_SIZE - 20, player.y));

    // Aim toward mouse
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Shooting
    player.fireCooldown -= dt;
    if ((mouse.down || keys[' ']) && player.fireCooldown <= 0) {
        firePlayerBullet();
        player.fireCooldown = 1 / player.fireRate;
    }

    // Dash cooldown
    player.dashCooldown -= dt;
    if (player.dashCooldown < 0) player.dashCooldown = 0;

    // Invincibility
    if (player.invincible > 0) {
        player.invincible -= dt;
    }
}

function dash() {
    if (player.dashCooldown > 0) return;

    const dashDist = 120;
    const dashSpeed = dashDist / 0.1; // 0.1s dash

    player.vx = Math.cos(player.angle) * dashSpeed;
    player.vy = Math.sin(player.angle) * dashSpeed;
    player.dashDuration = 0.1;
    player.dashCooldown = 0.5;
    player.invincible = 0.15;

    // Dash particles
    for (let i = 0; i < 6; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 1,
            decay: 3,
            size: 4,
            color: COLORS.playerGlow
        });
    }
}

function firePlayerBullet() {
    const spread = player.isFocused ? 0 : 0.05;
    const angle = player.angle + (Math.random() - 0.5) * spread;
    const speed = 600;

    playerBullets.push({
        x: player.x + Math.cos(angle) * 15,
        y: player.y + Math.sin(angle) * 15,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: player.damage,
        size: 4
    });
}

function updateEnemies(dt) {
    enemies.forEach(enemy => {
        enemy.hitFlash -= dt * 5;
        if (enemy.hitFlash < 0) enemy.hitFlash = 0;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        enemy.angle = Math.atan2(dy, dx);

        // Movement AI
        if (enemy.type === 'ghost') {
            // Chase player
            if (dist > 50) {
                enemy.x += (dx / dist) * enemy.speed * dt;
                enemy.y += (dy / dist) * enemy.speed * dt;
            }
        } else if (enemy.type === 'drone') {
            // Dash toward then orbit
            if (dist > 200) {
                enemy.x += (dx / dist) * enemy.speed * dt;
                enemy.y += (dy / dist) * enemy.speed * dt;
            } else {
                // Strafe
                enemy.x += enemy.vx * dt;
                enemy.y += enemy.vy * dt;

                // Bounce off bounds
                const offsetX = (canvas.width - ROOM_WIDTH * TILE_SIZE) / 2;
                const offsetY = 80;
                if (enemy.x < offsetX + 30 || enemy.x > offsetX + ROOM_WIDTH * TILE_SIZE - 30) {
                    enemy.vx *= -1;
                }
                if (enemy.y < offsetY + 30 || enemy.y > offsetY + ROOM_HEIGHT * TILE_SIZE - 30) {
                    enemy.vy *= -1;
                }
            }
        }
        // Turrets don't move

        // Firing
        enemy.lastFire -= dt * 1000;
        if (enemy.lastFire <= 0 && dist < 500) {
            fireEnemyBullet(enemy);
            enemy.lastFire = enemy.fireRate;
        }

        // Keep in bounds
        const offsetX = (canvas.width - ROOM_WIDTH * TILE_SIZE) / 2;
        const offsetY = 80;
        enemy.x = Math.max(offsetX + 30, Math.min(offsetX + ROOM_WIDTH * TILE_SIZE - 30, enemy.x));
        enemy.y = Math.max(offsetY + 30, Math.min(offsetY + ROOM_HEIGHT * TILE_SIZE - 30, enemy.y));
    });
}

function fireEnemyBullet(enemy) {
    const speed = 150;

    if (enemy.type === 'turret') {
        // Ring of bullets
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            enemyBullets.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 6,
                color: COLORS.bulletEnemyOrange
            });
        }
    } else if (enemy.type === 'drone') {
        // Spread of 3
        for (let i = -1; i <= 1; i++) {
            const angle = enemy.angle + i * 0.3;
            enemyBullets.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 5,
                color: COLORS.bulletEnemy
            });
        }
    } else {
        // Single aimed shot
        enemyBullets.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(enemy.angle) * speed,
            vy: Math.sin(enemy.angle) * speed,
            size: 5,
            color: COLORS.bulletEnemy
        });
    }
}

function updateBullets(dt) {
    const offsetX = (canvas.width - ROOM_WIDTH * TILE_SIZE) / 2;
    const offsetY = 80;
    const minX = offsetX;
    const maxX = offsetX + ROOM_WIDTH * TILE_SIZE;
    const minY = offsetY;
    const maxY = offsetY + ROOM_HEIGHT * TILE_SIZE;

    // Player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const b = playerBullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Out of bounds
        if (b.x < minX || b.x > maxX || b.y < minY || b.y > maxY) {
            playerBullets.splice(i, 1);
            continue;
        }

        // Hit enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.size + b.size) {
                e.hp -= b.damage;
                e.hitFlash = 1;
                playerBullets.splice(i, 1);

                // Hit particles
                for (let k = 0; k < 4; k++) {
                    particles.push({
                        x: b.x,
                        y: b.y,
                        vx: (Math.random() - 0.5) * 80,
                        vy: (Math.random() - 0.5) * 80,
                        life: 1,
                        decay: 4,
                        size: 3,
                        color: COLORS.bulletPlayer
                    });
                }

                if (e.hp <= 0) {
                    killEnemy(j);
                }
                break;
            }
        }
    }

    // Enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Out of bounds
        if (b.x < minX - 20 || b.x > maxX + 20 || b.y < minY - 20 || b.y > maxY + 20) {
            enemyBullets.splice(i, 1);
            continue;
        }

        // Hit player
        if (player.invincible <= 0 && Math.hypot(b.x - player.x, b.y - player.y) < 8 + b.size) {
            playerHit();
            enemyBullets.splice(i, 1);
        }
    }
}

function killEnemy(index) {
    const e = enemies[index];

    // Particles
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: e.x,
            y: e.y,
            vx: (Math.random() - 0.5) * 150,
            vy: (Math.random() - 0.5) * 150,
            life: 1,
            decay: 2,
            size: 5,
            color: e.color
        });
    }

    // Drop debris
    const debrisValue = Math.floor(e.debris * game.multiplier);
    pickups.push({
        x: e.x,
        y: e.y,
        type: 'debris',
        value: Math.min(10, Math.ceil(debrisValue / 10))
    });

    // Increase multiplier
    game.multiplier = Math.min(3.0, game.multiplier + 0.05);

    enemies.splice(index, 1);

    // Room clear check
    if (enemies.length === 0) {
        roomCleared();
    }
}

function playerHit() {
    player.hp--;
    player.invincible = 1.0;
    game.multiplier = Math.max(1.0, game.multiplier - 1.0);

    // Hit particles
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 150,
            vy: (Math.random() - 0.5) * 150,
            life: 1,
            decay: 2,
            size: 4,
            color: COLORS.uiRed
        });
    }

    if (player.hp <= 0) {
        game.state = 'gameover';
    }
}

function roomCleared() {
    game.roomsCleared++;

    // Health drop chance
    if (Math.random() < 0.2 && player.hp < player.maxHp) {
        pickups.push({
            x: 400,
            y: 300,
            type: 'health',
            value: 1
        });
    }

    // Generate next room after delay
    setTimeout(() => {
        if (game.state === 'playing') {
            generateRoom();
        }
    }, 1500);
}

function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dist = Math.hypot(p.x - player.x, p.y - player.y);

        // Magnet effect
        if (dist < 80) {
            const angle = Math.atan2(player.y - p.y, player.x - p.x);
            const pull = (80 - dist) / 80 * 200;
            p.x += Math.cos(angle) * pull * dt;
            p.y += Math.sin(angle) * pull * dt;
        }

        // Collect
        if (dist < 20) {
            if (p.type === 'debris') {
                game.debris += p.value * 10;
            } else if (p.type === 'health') {
                player.hp = Math.min(player.maxHp, player.hp + 1);
            }
            pickups.splice(i, 1);
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Main loop
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    game.time += dt;

    // Clear
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === 'playing') {
        updatePlayer(dt);
        updateEnemies(dt);
        updateBullets(dt);
        updatePickups(dt);
        updateParticles(dt);
    }

    // Draw
    drawRoom();

    pickups.forEach(drawPickup);
    enemies.forEach(drawEnemy);
    drawPlayer();
    playerBullets.forEach(b => drawBullet(b, false));
    enemyBullets.forEach(b => drawBullet(b, true));
    particles.forEach(drawParticle);

    drawHUD();

    // Game over
    if (game.state === 'gameover') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 40px monospace';
        ctx.fillStyle = COLORS.uiRed;
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

        ctx.font = '20px monospace';
        ctx.fillStyle = COLORS.uiGreen;
        ctx.fillText(`DEBRIS: ${game.debris}G`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText(`ROOMS CLEARED: ${game.roomsCleared}`, canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 80);
    }

    requestAnimationFrame(gameLoop);
}

// Input
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    // Dash
    if ((e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'q') && game.state === 'playing') {
        dash();
    }

    // Restart
    if (e.key === ' ' && game.state === 'gameover') {
        resetGame();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) mouse.down = true;
    if (e.button === 2) mouse.rightDown = true;
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rightDown = false;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function resetGame() {
    game.state = 'playing';
    game.floor = 1;
    game.roomsCleared = 0;
    game.debris = 0;
    game.multiplier = 1.0;

    player.hp = player.maxHp;
    player.bombs = 2;
    player.invincible = 0;
    player.dashCooldown = 0;

    playerBullets = [];
    enemyBullets = [];
    pickups = [];
    particles = [];

    generateRoom();
}

// Expose for testing
window.gameState = game;
window.player = player;
window.enemies = enemies;

// Initialize
generateRoom();
requestAnimationFrame(gameLoop);
