// CITADEL - System Shock Metroidvania
// Canvas 2D Implementation

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1280;
const HEIGHT = 720;

// Constants
const TILE_SIZE = 32;
const ROOM_WIDTH = 40; // Wider for 1280px
const ROOM_HEIGHT = 22; // Taller for 720px

// Colors (dark sci-fi palette)
const COLORS = {
    bg: '#0a0a12',
    wall: '#2a2a3a',
    wallLight: '#3a3a4a',
    wallDark: '#1a1a2a',
    floor: '#252535',
    metal: '#4a4a5a',
    metalLight: '#6a6a7a',
    accent: '#8844aa',
    accentGlow: '#aa66cc',
    healthBar: '#cc4444',
    energyBar: '#4488cc',
    player: '#cc8844',
    playerLight: '#ddaa66',
    enemy: '#884466',
    enemyGlow: '#aa6688',
    bullet: '#ffdd44',
    laser: '#44ff88',
    danger: '#ff4466'
};

// Game state
let gameState = 'title';
let currentRoom = { x: 0, y: 0 };

// Player
const player = {
    x: 100,
    y: 400,
    vx: 0,
    vy: 0,
    width: 24,
    height: 40,
    hp: 100,
    maxHp: 100,
    energy: 100,
    maxEnergy: 100,
    speed: 280,
    jumpVel: -480,
    gravity: 1200,
    grounded: false,
    facing: 1,
    canDoubleJump: false,
    hasDoubleJump: true,
    canWallJump: false,
    hasWallJump: true,
    onWall: 0,
    dashCooldown: 0,
    hasDash: false,
    invincible: 0,
    attacking: false,
    attackTimer: 0,
    weapon: 'pipe',
    shooting: false,
    shootCooldown: 0,
    ammo: { standard: 50, magnum: 20 }
};

// Enemies
let enemies = [];

// Bullets
let bullets = [];

// Room map data
let roomMap = [];

// Room templates
const ROOM_TEMPLATES = [
    // Room 0: Starting room
    `
.........................
.........................
.........................
.........................
.........................
..#####################..
..#.....................#
..#.....................#
..#...#####.....#####...#
..#.....................#
..#.....................#
..#.........S...........#
..#.....................#
..#########.....########.
..#.......#.....#........
..#.......#.....#........
..#.......#.....#........
.########################
`,
    // Room 1: Vertical shaft
    `
.........................
...####.........####.....
...#................#....
...#...##########...#....
...#...#........#...#....
...#...#........#...#....
...#...####..####...#....
...#................#....
...#....########....#....
...#....#......#....#....
...#....#......#....#....
...####.#......#.####....
........#......#.........
...####.#......#.####....
...#....#......#....#....
...#....########....#....
...#................#....
.########################
`,
    // Room 2: Combat room
    `
.........................
.........................
..#####################..
..#...................#..
..#..E...........E....#..
..#...###########.....#..
..#...................#..
..#...........E.......#..
..#.....#########.....#..
..#...................#..
..#.E.................#..
..#...###########.....#..
..#...................#..
..#.....#####.........#..
..#...................#..
..#...................#..
..#...................#..
.########################
`
];

// Weapons data
const WEAPONS = {
    pipe: { damage: 15, range: 48, speed: 0.4, melee: true },
    minipistol: { damage: 12, fireRate: 0.25, melee: false, ammoType: 'standard' },
    magnum: { damage: 35, fireRate: 0.6, melee: false, ammoType: 'magnum' }
};

// Input handling
const keys = {};
let lastKeys = {};

document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
    }
});

document.addEventListener('keyup', e => {
    keys[e.code] = false;
});

// Parse room template
function parseRoom(template) {
    const lines = template.trim().split('\n');
    const tiles = [];
    for (let y = 0; y < ROOM_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < ROOM_WIDTH; x++) {
            const char = lines[y] ? lines[y][x] || '.' : '.';
            row.push(char);
        }
        tiles.push(row);
    }
    return tiles;
}

// Load room
function loadRoom(roomIndex) {
    const template = ROOM_TEMPLATES[roomIndex % ROOM_TEMPLATES.length];
    roomMap = parseRoom(template);
    enemies = [];

    // Spawn enemies and find spawn point
    for (let y = 0; y < ROOM_HEIGHT; y++) {
        for (let x = 0; x < ROOM_WIDTH; x++) {
            const tile = roomMap[y][x];
            if (tile === 'E') {
                enemies.push(createEnemy(x * TILE_SIZE + 16, y * TILE_SIZE + 16, 'shambler'));
                roomMap[y][x] = '.';
            } else if (tile === 'S') {
                player.x = x * TILE_SIZE + 16;
                player.y = y * TILE_SIZE + 20;
                roomMap[y][x] = '.';
            }
        }
    }
}

// Create enemy
function createEnemy(x, y, type) {
    if (type === 'shambler') {
        return {
            x, y, vx: 0, vy: 0,
            width: 28, height: 36,
            hp: 25, maxHp: 25,
            damage: 10, speed: 80,
            type: 'shambler',
            state: 'idle',
            alertRange: 200,
            dir: Math.random() < 0.5 ? -1 : 1,
            animTimer: 0
        };
    } else if (type === 'drone') {
        return {
            x, y, vx: 0, vy: 0,
            width: 24, height: 24,
            hp: 40, maxHp: 40,
            damage: 8, speed: 100,
            type: 'drone',
            state: 'patrol',
            patrolTimer: 0,
            shootTimer: 0,
            flying: true,
            dir: 1,
            animTimer: 0
        };
    }
}

// Collision helpers
function isSolid(x, y) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    if (tx < 0 || tx >= ROOM_WIDTH || ty < 0 || ty >= ROOM_HEIGHT) return true;
    return roomMap[ty][tx] === '#';
}

function rectCollide(a, b) {
    return a.x - a.width/2 < b.x + b.width/2 &&
           a.x + a.width/2 > b.x - b.width/2 &&
           a.y - a.height/2 < b.y + b.height/2 &&
           a.y + a.height/2 > b.y - b.height/2;
}

// Update player
function updatePlayer(dt) {
    // Cooldowns
    if (player.invincible > 0) player.invincible -= dt;
    if (player.dashCooldown > 0) player.dashCooldown -= dt;
    if (player.attackTimer > 0) player.attackTimer -= dt;
    if (player.shootCooldown > 0) player.shootCooldown -= dt;

    // Energy regeneration
    if (player.energy < player.maxEnergy) {
        player.energy = Math.min(player.maxEnergy, player.energy + 5 * dt);
    }

    // Horizontal movement
    let moveX = 0;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX = -1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX = 1;

    if (moveX !== 0) {
        player.facing = moveX;
        player.vx = moveX * player.speed;
    } else {
        // Friction
        player.vx *= Math.pow(0.01, dt);
    }

    // Jumping
    const jumpPressed = keys['Space'] || keys['KeyW'] || keys['ArrowUp'];
    const jumpJustPressed = jumpPressed && !lastKeys.jump;

    if (jumpJustPressed) {
        if (player.grounded) {
            player.vy = player.jumpVel;
            player.grounded = false;
        } else if (player.hasWallJump && player.onWall !== 0) {
            player.vy = player.jumpVel * 0.9;
            player.vx = -player.onWall * 320;
            player.onWall = 0;
        } else if (player.hasDoubleJump && player.canDoubleJump) {
            player.vy = player.jumpVel * 0.85;
            player.canDoubleJump = false;
        }
    }

    lastKeys.jump = jumpPressed;

    // Variable jump height
    if (!jumpPressed && player.vy < 0) {
        player.vy *= 0.5;
    }

    // Gravity
    player.vy += player.gravity * dt;
    if (player.vy > 720) player.vy = 720;

    // Wall slide
    player.onWall = 0;
    if (!player.grounded && player.hasWallJump) {
        const wallCheckL = isSolid(player.x - player.width/2 - 2, player.y);
        const wallCheckR = isSolid(player.x + player.width/2 + 2, player.y);
        if (wallCheckL && moveX < 0) {
            player.onWall = -1;
            if (player.vy > 120) player.vy = 120;
        } else if (wallCheckR && moveX > 0) {
            player.onWall = 1;
            if (player.vy > 120) player.vy = 120;
        }
    }

    // Apply velocity with collision
    // Horizontal
    const newX = player.x + player.vx * dt;
    const halfW = player.width / 2;
    const halfH = player.height / 2;

    let canMoveX = true;
    for (let cy = -halfH + 2; cy <= halfH - 2; cy += halfH) {
        if (isSolid(newX + halfW * Math.sign(player.vx), player.y + cy)) {
            canMoveX = false;
            break;
        }
    }
    if (canMoveX) {
        player.x = newX;
    } else {
        player.vx = 0;
    }

    // Vertical
    const newY = player.y + player.vy * dt;
    let canMoveY = true;
    player.grounded = false;

    for (let cx = -halfW + 2; cx <= halfW - 2; cx += halfW) {
        if (isSolid(player.x + cx, newY + halfH * Math.sign(player.vy))) {
            canMoveY = false;
            if (player.vy > 0) {
                player.grounded = true;
                player.canDoubleJump = true;
            }
            break;
        }
    }
    if (canMoveY) {
        player.y = newY;
    } else {
        player.vy = 0;
    }

    // Bounds
    player.x = Math.max(halfW, Math.min(ROOM_WIDTH * TILE_SIZE - halfW, player.x));
    player.y = Math.max(halfH, Math.min(ROOM_HEIGHT * TILE_SIZE - halfH, player.y));

    // Melee attack
    if ((keys['KeyJ'] || keys['KeyZ']) && player.attackTimer <= 0 && WEAPONS[player.weapon].melee) {
        player.attacking = true;
        player.attackTimer = WEAPONS[player.weapon].speed;

        // Check enemy hits
        const weapon = WEAPONS[player.weapon];
        for (const enemy of enemies) {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < weapon.range && Math.sign(dx) === player.facing) {
                enemy.hp -= weapon.damage;
            }
        }
    } else if (player.attackTimer <= 0) {
        player.attacking = false;
    }

    // Shooting
    if ((keys['KeyK'] || keys['KeyX']) && player.shootCooldown <= 0 && !WEAPONS[player.weapon].melee) {
        const weapon = WEAPONS[player.weapon];
        if (player.ammo[weapon.ammoType] > 0) {
            player.ammo[weapon.ammoType]--;
            player.shootCooldown = weapon.fireRate;
            player.shooting = true;

            bullets.push({
                x: player.x + player.facing * 20,
                y: player.y - 5,
                vx: player.facing * 600,
                vy: 0,
                damage: weapon.damage,
                friendly: true,
                life: 2
            });
        }
    } else {
        player.shooting = false;
    }

    // Weapon cycling
    if (keys['KeyQ'] && !lastKeys.cycleWeapon) {
        const weapons = ['pipe', 'minipistol', 'magnum'];
        const idx = weapons.indexOf(player.weapon);
        player.weapon = weapons[(idx + 1) % weapons.length];
    }
    lastKeys.cycleWeapon = keys['KeyQ'];

    // Check enemy collisions
    for (const enemy of enemies) {
        if (player.invincible <= 0 && rectCollide(player, enemy)) {
            player.hp -= enemy.damage;
            player.invincible = 1.0;
            player.vx = -player.facing * 200;
            player.vy = -150;
        }
    }

    // Death check
    if (player.hp <= 0) {
        gameState = 'gameover';
    }
}

// Update enemies
function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        if (e.type === 'shambler') {
            // Simple walking enemy
            const dx = player.x - e.x;
            const dy = player.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < e.alertRange) {
                e.state = 'chase';
                e.dir = Math.sign(dx);
            } else {
                e.state = 'patrol';
            }

            if (e.state === 'chase') {
                e.vx = e.dir * e.speed;
            } else {
                e.vx = e.dir * e.speed * 0.5;
            }

            // Gravity
            e.vy += 1200 * dt;
            if (e.vy > 720) e.vy = 720;

            // Movement with collision
            const newX = e.x + e.vx * dt;
            const newY = e.y + e.vy * dt;
            const eHalfW = e.width / 2;
            const eHalfH = e.height / 2;

            // Horizontal
            let canMoveX = true;
            if (isSolid(newX + eHalfW * e.dir, e.y) ||
                isSolid(newX + eHalfW * e.dir, e.y + eHalfH)) {
                canMoveX = false;
                e.dir *= -1;
            }
            // Check for ledges
            if (!isSolid(newX + eHalfW * e.dir, e.y + eHalfH + 10)) {
                e.dir *= -1;
            }
            if (canMoveX) e.x = newX;

            // Vertical
            let grounded = false;
            if (isSolid(e.x, newY + eHalfH)) {
                grounded = true;
                e.vy = 0;
            } else {
                e.y = newY;
            }

            e.animTimer += dt;
        } else if (e.type === 'drone') {
            // Flying enemy
            const dx = player.x - e.x;
            const dy = player.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 300) {
                // Move toward optimal range
                if (dist > 150) {
                    e.x += (dx / dist) * e.speed * dt;
                    e.y += (dy / dist) * e.speed * dt;
                }

                // Shoot
                e.shootTimer += dt;
                if (e.shootTimer > 1.5) {
                    e.shootTimer = 0;
                    const angle = Math.atan2(dy, dx);
                    bullets.push({
                        x: e.x,
                        y: e.y,
                        vx: Math.cos(angle) * 300,
                        vy: Math.sin(angle) * 300,
                        damage: e.damage,
                        friendly: false,
                        life: 3
                    });
                }
            } else {
                // Patrol
                e.patrolTimer += dt;
                e.y += Math.sin(e.patrolTimer * 2) * 30 * dt;
            }

            e.animTimer += dt;
        }

        // Death
        if (e.hp <= 0) {
            enemies.splice(i, 1);
        }
    }
}

// Update bullets
function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;

        // Wall collision
        if (isSolid(b.x, b.y)) {
            bullets.splice(i, 1);
            continue;
        }

        // Hit detection
        if (b.friendly) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                const dx = b.x - e.x;
                const dy = b.y - e.y;
                if (Math.abs(dx) < e.width/2 && Math.abs(dy) < e.height/2) {
                    e.hp -= b.damage;
                    bullets.splice(i, 1);
                    break;
                }
            }
        } else {
            if (player.invincible <= 0) {
                const dx = b.x - player.x;
                const dy = b.y - player.y;
                if (Math.abs(dx) < player.width/2 && Math.abs(dy) < player.height/2) {
                    player.hp -= b.damage;
                    player.invincible = 1.0;
                    bullets.splice(i, 1);
                    continue;
                }
            }
        }

        // Lifetime
        if (b.life <= 0) {
            bullets.splice(i, 1);
        }
    }
}

// Draw functions
function drawTile(x, y, type) {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;

    if (type === '#') {
        // Wall tile with detail
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Add metallic texture
        ctx.fillStyle = COLORS.wallLight;
        ctx.fillRect(px + 2, py + 2, 4, 4);
        ctx.fillRect(px + TILE_SIZE - 6, py + TILE_SIZE - 6, 4, 4);

        ctx.fillStyle = COLORS.wallDark;
        ctx.fillRect(px + 10, py + 10, 6, 6);

        // Edge highlight
        ctx.fillStyle = COLORS.metalLight;
        ctx.fillRect(px, py, TILE_SIZE, 2);
        ctx.fillRect(px, py, 2, TILE_SIZE);
    } else {
        // Background
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Subtle grid pattern
        ctx.fillStyle = '#0f0f1a';
        ctx.fillRect(px, py, TILE_SIZE, 1);
        ctx.fillRect(px, py, 1, TILE_SIZE);
    }
}

function drawRoom() {
    for (let y = 0; y < ROOM_HEIGHT; y++) {
        for (let x = 0; x < ROOM_WIDTH; x++) {
            drawTile(x, y, roomMap[y][x]);
        }
    }
}

function drawPlayer() {
    const px = player.x;
    const py = player.y;

    // Flash when invincible
    if (player.invincible > 0 && Math.floor(player.invincible * 10) % 2 === 0) {
        return;
    }

    // Body
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(px - 12, py - 20, 24, 40);

    // Lighter chest area
    ctx.fillStyle = COLORS.playerLight;
    ctx.fillRect(px - 8, py - 15, 16, 20);

    // Head
    ctx.fillStyle = '#ddbb99';
    ctx.fillRect(px - 6, py - 28, 12, 10);

    // Eyes (visor)
    ctx.fillStyle = '#44ffaa';
    ctx.fillRect(px - 4 + (player.facing > 0 ? 2 : 0), py - 26, 6, 4);

    // Arm with weapon
    if (player.attacking) {
        // Melee swing
        ctx.fillStyle = '#888';
        ctx.save();
        ctx.translate(px, py - 5);
        ctx.rotate(player.facing * -0.5);
        ctx.fillRect(0, -3, player.facing * 40, 6);
        ctx.restore();
    } else if (WEAPONS[player.weapon].melee) {
        ctx.fillStyle = '#888';
        ctx.fillRect(px + player.facing * 10, py - 8, player.facing * 20, 4);
    } else {
        // Gun
        ctx.fillStyle = '#666';
        ctx.fillRect(px + player.facing * 8, py - 10, player.facing * 18, 6);
    }

    // Legs
    ctx.fillStyle = '#553322';
    ctx.fillRect(px - 8, py + 10, 6, 10);
    ctx.fillRect(px + 2, py + 10, 6, 10);
}

function drawEnemies() {
    for (const e of enemies) {
        if (e.type === 'shambler') {
            // Mutant shambler
            ctx.fillStyle = COLORS.enemy;
            ctx.fillRect(e.x - 14, e.y - 18, 28, 36);

            // Glow eyes
            ctx.fillStyle = COLORS.enemyGlow;
            ctx.fillRect(e.x - 8 + (e.dir > 0 ? 4 : 0), e.y - 14, 4, 4);
            ctx.fillRect(e.x + (e.dir > 0 ? 4 : 0), e.y - 14, 4, 4);

            // Shambling arms
            const armOffset = Math.sin(e.animTimer * 5) * 3;
            ctx.fillStyle = COLORS.enemy;
            ctx.fillRect(e.x - 20, e.y - 5 + armOffset, 8, 16);
            ctx.fillRect(e.x + 12, e.y - 5 - armOffset, 8, 16);

            // Health bar if damaged
            if (e.hp < e.maxHp) {
                ctx.fillStyle = '#333';
                ctx.fillRect(e.x - 14, e.y - 28, 28, 4);
                ctx.fillStyle = COLORS.danger;
                ctx.fillRect(e.x - 14, e.y - 28, 28 * (e.hp / e.maxHp), 4);
            }
        } else if (e.type === 'drone') {
            // Maintenance drone
            ctx.fillStyle = '#556677';
            ctx.beginPath();
            ctx.arc(e.x, e.y, 12, 0, Math.PI * 2);
            ctx.fill();

            // Eye
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(e.x + e.dir * 4, e.y - 2, 4, 0, Math.PI * 2);
            ctx.fill();

            // Health bar
            if (e.hp < e.maxHp) {
                ctx.fillStyle = '#333';
                ctx.fillRect(e.x - 12, e.y - 22, 24, 4);
                ctx.fillStyle = COLORS.danger;
                ctx.fillRect(e.x - 12, e.y - 22, 24 * (e.hp / e.maxHp), 4);
            }
        }
    }
}

function drawBullets() {
    for (const b of bullets) {
        if (b.friendly) {
            ctx.fillStyle = COLORS.bullet;
            ctx.beginPath();
            ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
            ctx.fill();

            // Trail
            ctx.fillStyle = '#ffff88';
            ctx.fillRect(b.x - b.vx * 0.02, b.y - 1, -b.vx * 0.02, 2);
        } else {
            ctx.fillStyle = COLORS.danger;
            ctx.beginPath();
            ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawHUD() {
    // Top bar background
    ctx.fillStyle = 'rgba(10, 10, 20, 0.9)';
    ctx.fillRect(0, 0, WIDTH, 50);

    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(15, 12, 150, 12);
    ctx.fillStyle = COLORS.healthBar;
    ctx.fillRect(15, 12, 150 * (player.hp / player.maxHp), 12);
    ctx.strokeStyle = '#666';
    ctx.strokeRect(15, 12, 150, 12);

    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.fillText(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`, 20, 21);

    // Energy bar
    ctx.fillStyle = '#333';
    ctx.fillRect(15, 28, 150, 8);
    ctx.fillStyle = COLORS.energyBar;
    ctx.fillRect(15, 28, 150 * (player.energy / player.maxEnergy), 8);
    ctx.strokeStyle = '#666';
    ctx.strokeRect(15, 28, 150, 8);

    ctx.fillStyle = '#aaa';
    ctx.font = '8px Arial';
    ctx.fillText(`ENERGY: ${Math.ceil(player.energy)}`, 20, 35);

    // Weapon display (right side)
    ctx.fillStyle = 'rgba(50, 50, 80, 0.8)';
    ctx.fillRect(WIDTH - 180, 8, 170, 35);
    ctx.strokeStyle = COLORS.accent;
    ctx.strokeRect(WIDTH - 180, 8, 170, 35);

    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText(player.weapon.toUpperCase(), WIDTH - 170, 24);

    if (!WEAPONS[player.weapon].melee) {
        const ammoType = WEAPONS[player.weapon].ammoType;
        ctx.fillStyle = '#aaa';
        ctx.font = '10px Arial';
        ctx.fillText(`AMMO: ${player.ammo[ammoType]}`, WIDTH - 170, 38);
    } else {
        ctx.fillStyle = '#aaa';
        ctx.font = '10px Arial';
        ctx.fillText('MELEE', WIDTH - 170, 38);
    }

    // Bottom controls help
    ctx.fillStyle = 'rgba(10, 10, 20, 0.7)';
    ctx.fillRect(0, HEIGHT - 25, WIDTH, 25);
    ctx.fillStyle = '#666';
    ctx.font = '11px Arial';
    ctx.fillText('WASD/Arrows: Move | SPACE: Jump | J/Z: Melee | K/X: Shoot | Q: Cycle Weapon', 15, HEIGHT - 9);

    // Room indicator
    ctx.fillStyle = '#555';
    ctx.font = '10px Arial';
    ctx.fillText(`MEDICAL DECK - ROOM ${currentRoom.x + currentRoom.y * 3 + 1}`, WIDTH - 180, HEIGHT - 9);
}

function drawTitle() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Decorative grid
    ctx.strokeStyle = '#1a1a2a';
    for (let x = 0; x < WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);
        ctx.stroke();
    }

    // Title
    ctx.fillStyle = COLORS.accentGlow;
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CITADEL', WIDTH / 2, 180);

    ctx.fillStyle = '#888';
    ctx.font = '20px Arial';
    ctx.fillText('A System Shock Metroidvania', WIDTH / 2, 230);

    // SHODAN message
    ctx.fillStyle = COLORS.accent;
    ctx.font = '16px Arial';
    ctx.fillText('"LOOK AT YOU, HACKER..."', WIDTH / 2, 320);

    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE to Begin', WIDTH / 2, 420);

    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.fillText('WASD/Arrows: Move | Space: Jump | J/Z: Attack | K/X: Shoot', WIDTH / 2, 500);

    ctx.textAlign = 'left';
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(20, 0, 0, 0.95)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SYSTEM FAILURE', WIDTH / 2, 200);

    ctx.fillStyle = COLORS.accent;
    ctx.font = '18px Arial';
    ctx.fillText('"PATHETIC. I EXPECTED MORE FROM YOU."', WIDTH / 2, 280);
    ctx.fillText('- SHODAN', WIDTH / 2, 310);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Press SPACE to Continue', WIDTH / 2, 420);

    ctx.textAlign = 'left';
}

// Reset game
function resetGame() {
    player.hp = player.maxHp;
    player.energy = player.maxEnergy;
    player.x = 100;
    player.y = 400;
    player.vx = 0;
    player.vy = 0;
    player.invincible = 0;
    player.weapon = 'pipe';
    player.ammo = { standard: 50, magnum: 20 };
    bullets = [];
    currentRoom = { x: 0, y: 0 };
    loadRoom(0);
    gameState = 'playing';
}

// Main game loop
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    if (gameState === 'title') {
        drawTitle();
        if (keys['Space']) {
            resetGame();
        }
    } else if (gameState === 'playing') {
        updatePlayer(dt);
        updateEnemies(dt);
        updateBullets(dt);

        // Check room transitions
        if (player.x < 10) {
            currentRoom.x--;
            loadRoom(currentRoom.x + currentRoom.y * 3);
            player.x = ROOM_WIDTH * TILE_SIZE - 30;
        } else if (player.x > ROOM_WIDTH * TILE_SIZE - 10) {
            currentRoom.x++;
            loadRoom(currentRoom.x + currentRoom.y * 3);
            player.x = 30;
        }

        drawRoom();
        drawBullets();
        drawEnemies();
        drawPlayer();
        drawHUD();
    } else if (gameState === 'gameover') {
        drawGameOver();
        if (keys['Space'] && !lastKeys.gameoverContinue) {
            resetGame();
        }
        lastKeys.gameoverContinue = keys['Space'];
    }

    requestAnimationFrame(gameLoop);
}

// Expose for testing
window.gameState = {
    get state() { return gameState; },
    get hp() { return player.hp; },
    get energy() { return player.energy; },
    get weapon() { return player.weapon; },
    get enemies() { return enemies.length; },
    get room() { return currentRoom; }
};

window.startGame = () => {
    if (gameState === 'title' || gameState === 'gameover') {
        resetGame();
    }
};

// Initialize
loadRoom(0);
requestAnimationFrame(gameLoop);
