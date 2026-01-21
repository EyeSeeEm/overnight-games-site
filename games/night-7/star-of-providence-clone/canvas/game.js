// Star of Providence Clone - Bullet Hell Roguelike
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const ROOM_W = 800;
const ROOM_H = 500;
const HUD_H = 100;

// Game state
let state = 'menu'; // menu, playing, boss, gameover, victory
let floor = 1;
let roomsCleared = 0;
let multiplier = 1.0;
let debris = 0;
let paused = false;

// Player
const player = {
    x: 400, y: 400,
    hp: 4, maxHp: 4,
    shields: 0, maxShields: 2,
    speed: 250,
    focusSpeed: 100,
    isFocused: false,
    dashCooldown: 0,
    dashDuration: 0,
    invincible: 0,
    bombs: 2, maxBombs: 6,
    bombCooldown: 0,
    currentWeapon: 0,
    weapons: [],
    fireTimer: 0
};

// Weapons data
const WEAPONS = [
    { name: 'Peashooter', damage: 5, fireRate: 0.1, speed: 600, ammo: Infinity, maxAmmo: Infinity, color: '#8af' },
    { name: 'Vulcan', damage: 15, fireRate: 0.13, speed: 500, ammo: 500, maxAmmo: 500, color: '#fa0' },
    { name: 'Laser', damage: 115, fireRate: 0.67, speed: 2000, ammo: 100, maxAmmo: 100, color: '#f0f', piercing: true },
    { name: 'Fireball', damage: 80, fireRate: 0.83, speed: 300, ammo: 90, maxAmmo: 90, color: '#f60', explosive: true },
    { name: 'Revolver', damage: 28, fireRate: 0.13, speed: 450, ammo: 250, maxAmmo: 250, color: '#fff' },
    { name: 'Sword', damage: 70, fireRate: 0.53, speed: 0, ammo: 125, maxAmmo: 125, color: '#4ff', melee: true }
];

// Keyword modifiers
const KEYWORDS = {
    homing: { name: 'Homing', damageMod: 1.0, ammoMod: 1.0 },
    triple: { name: 'Triple', damageMod: 0.5, ammoMod: 1.5 },
    highCaliber: { name: 'High-Caliber', damageMod: 3.5, ammoMod: 0.56 }
};

// Projectiles
let playerBullets = [];
let enemyBullets = [];

// Enemies
let enemies = [];

// Enemy types
const ENEMY_TYPES = {
    ghost: { hp: 50, speed: 80, color: '#8a8aff', damage: 1, points: 50, behavior: 'chase' },
    crazyGhost: { hp: 100, speed: 180, color: '#ff8aff', damage: 1, points: 100, behavior: 'dash' },
    drone: { hp: 70, speed: 150, color: '#8affff', damage: 1, points: 70, behavior: 'strafe' },
    turret: { hp: 90, speed: 0, color: '#ffaa00', damage: 1, points: 90, behavior: 'stationary' },
    seeker: { hp: 120, speed: 100, color: '#ff8a8a', damage: 1, points: 120, behavior: 'wander' },
    swarmer: { hp: 12, speed: 250, color: '#aaffaa', damage: 1, points: 12, behavior: 'swarm' },
    blob: { hp: 150, speed: 60, color: '#88ff88', damage: 1, points: 150, behavior: 'bounce', splits: true }
};

// Boss data
let boss = null;
const BOSSES = [
    { name: 'Chamberlord', hp: 1500, color: '#8a4aff', floor: 1 },
    { name: 'Wraithking', hp: 2000, color: '#4a8aff', floor: 2 },
    { name: 'Core Guardian', hp: 2500, color: '#ff4a4a', floor: 3 }
];

// Room state
let currentRoom = { x: 2, y: 2 };
let roomMap = [];
let roomsOnFloor = 0;
let roomEnemiesCleared = true;
let bossRoomReached = false;

// Input
const keys = {};
let mouseX = 400, mouseY = 300;
let mouseDown = false;

// Initialize game
function initGame() {
    player.hp = player.maxHp;
    player.shields = 0;
    player.bombs = 2;
    player.weapons = [{ ...WEAPONS[0], keyword: null }];
    player.currentWeapon = 0;
    floor = 1;
    debris = 0;
    multiplier = 1.0;
    roomsCleared = 0;
    generateFloor();
}

function generateFloor() {
    roomMap = [];
    for (let y = 0; y < 5; y++) {
        roomMap[y] = [];
        for (let x = 0; x < 5; x++) {
            roomMap[y][x] = null;
        }
    }

    // Place rooms
    currentRoom = { x: 2, y: 2 };
    roomMap[2][2] = { type: 'start', cleared: true };

    // Add combat rooms
    const roomCount = 5 + floor * 2;
    roomsOnFloor = roomCount;
    let placed = 0;
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];

    while (placed < roomCount) {
        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                if (roomMap[y][x] && !roomMap[y][x].type?.includes('boss')) {
                    for (const [dx, dy] of directions) {
                        const nx = x + dx, ny = y + dy;
                        if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5 && !roomMap[ny][nx] && Math.random() < 0.3) {
                            if (placed < roomCount - 1) {
                                roomMap[ny][nx] = { type: 'combat', cleared: false };
                                placed++;
                            }
                        }
                    }
                }
            }
        }
    }

    // Place boss room
    let bossPlaced = false;
    for (let y = 0; y < 5 && !bossPlaced; y++) {
        for (let x = 0; x < 5 && !bossPlaced; x++) {
            if (roomMap[y][x] && roomMap[y][x].type === 'combat') {
                for (const [dx, dy] of directions) {
                    const nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5 && !roomMap[ny][nx]) {
                        roomMap[ny][nx] = { type: 'boss', cleared: false };
                        bossPlaced = true;
                        break;
                    }
                }
            }
        }
    }

    // Place shop
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            if (roomMap[y][x] && roomMap[y][x].type === 'combat') {
                for (const [dx, dy] of directions) {
                    const nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < 5 && ny >= 0 && ny < 5 && !roomMap[ny][nx]) {
                        roomMap[ny][nx] = { type: 'shop', cleared: true };
                        return;
                    }
                }
            }
        }
    }
}

function enterRoom(x, y) {
    currentRoom = { x, y };
    const room = roomMap[y][x];

    playerBullets = [];
    enemyBullets = [];
    enemies = [];
    boss = null;

    if (room.type === 'combat' && !room.cleared) {
        spawnEnemies();
        roomEnemiesCleared = false;
    } else if (room.type === 'boss' && !room.cleared) {
        spawnBoss();
        roomEnemiesCleared = false;
        state = 'boss';
    } else {
        roomEnemiesCleared = true;
    }

    player.x = ROOM_W / 2;
    player.y = ROOM_H / 2 + 50;
}

function spawnEnemies() {
    const count = 4 + floor * 2 + Math.floor(Math.random() * 3);
    const types = Object.keys(ENEMY_TYPES);

    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * Math.min(types.length, 3 + floor))];
        const data = ENEMY_TYPES[type];
        enemies.push({
            x: 100 + Math.random() * (ROOM_W - 200),
            y: 50 + Math.random() * (ROOM_H - 200),
            type,
            hp: data.hp * (1 + floor * 0.2),
            maxHp: data.hp * (1 + floor * 0.2),
            speed: data.speed,
            color: data.color,
            points: data.points,
            behavior: data.behavior,
            splits: data.splits,
            shootTimer: Math.random() * 2,
            vx: (Math.random() - 0.5) * data.speed,
            vy: (Math.random() - 0.5) * data.speed
        });
    }
}

function spawnBoss() {
    const bossData = BOSSES[floor - 1];
    boss = {
        x: ROOM_W / 2,
        y: 150,
        hp: bossData.hp,
        maxHp: bossData.hp,
        name: bossData.name,
        color: bossData.color,
        phase: 1,
        attackTimer: 0,
        moveTimer: 0,
        pattern: 0
    };
}

// Update
function update(dt) {
    if (state !== 'playing' && state !== 'boss') return;
    if (paused) return;

    updatePlayer(dt);
    updateBullets(dt);
    updateEnemies(dt);
    if (boss) updateBoss(dt);
    checkCollisions();

    // Multiplier decay
    multiplier = Math.max(1.0, multiplier - 0.05 * dt);
}

function updatePlayer(dt) {
    // Focus mode
    player.isFocused = keys['shift'] || keys['control'];
    const speed = player.isFocused ? player.focusSpeed : player.speed;

    // Movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // Dash
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    player.dashDuration = Math.max(0, player.dashDuration - dt);
    player.invincible = Math.max(0, player.invincible - dt);
    player.bombCooldown = Math.max(0, player.bombCooldown - dt);

    if ((keys['z'] || keys['q']) && player.dashCooldown <= 0 && (dx !== 0 || dy !== 0)) {
        player.dashCooldown = 0.5;
        player.dashDuration = 0.15;
        player.invincible = 0.15;
    }

    const dashMult = player.dashDuration > 0 ? 3 : 1;
    player.x += dx * speed * dashMult * dt;
    player.y += dy * speed * dashMult * dt;

    // Clamp to room
    player.x = Math.max(20, Math.min(ROOM_W - 20, player.x));
    player.y = Math.max(20, Math.min(ROOM_H - 20, player.y));

    // Bomb
    if ((keys['x'] || keys['e']) && player.bombs > 0 && player.bombCooldown <= 0) {
        useBomb();
        keys['x'] = false;
        keys['e'] = false;
    }

    // Fire
    player.fireTimer = Math.max(0, player.fireTimer - dt);
    if ((mouseDown || keys[' ']) && player.fireTimer <= 0) {
        fireWeapon();
    }

    // Check room transitions
    if (roomEnemiesCleared) {
        checkRoomTransition();
    }
}

function fireWeapon() {
    const weapon = player.weapons[player.currentWeapon];
    if (weapon.ammo <= 0) return;

    player.fireTimer = weapon.fireRate;
    if (weapon.ammo !== Infinity) weapon.ammo--;

    const angle = Math.atan2(mouseY - player.y - HUD_H, mouseX - player.x);
    const dmg = weapon.damage * (weapon.keyword?.damageMod || 1);

    if (weapon.keyword?.name === 'Triple') {
        for (let i = -1; i <= 1; i++) {
            const a = angle + i * 0.2;
            playerBullets.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(a) * weapon.speed,
                vy: Math.sin(a) * weapon.speed,
                damage: dmg,
                color: weapon.color,
                piercing: weapon.piercing,
                explosive: weapon.explosive,
                homing: weapon.keyword?.name === 'Homing'
            });
        }
    } else {
        playerBullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * weapon.speed,
            vy: Math.sin(angle) * weapon.speed,
            damage: dmg,
            color: weapon.color,
            piercing: weapon.piercing,
            explosive: weapon.explosive,
            homing: weapon.keyword?.name === 'Homing'
        });
    }
}

function useBomb() {
    player.bombs--;
    player.bombCooldown = 0.5;
    player.invincible = 1;

    // Clear enemy bullets
    enemyBullets = [];

    // Damage all enemies
    for (const enemy of enemies) {
        enemy.hp -= 100;
    }
    if (boss) boss.hp -= 200;

    enemies = enemies.filter(e => e.hp > 0);
}

function updateBullets(dt) {
    // Player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const b = playerBullets[i];

        // Homing
        if (b.homing) {
            let closest = null;
            let closestDist = Infinity;
            const targets = boss ? [boss] : enemies;
            for (const e of targets) {
                const d = Math.hypot(e.x - b.x, e.y - b.y);
                if (d < closestDist) {
                    closestDist = d;
                    closest = e;
                }
            }
            if (closest) {
                const angle = Math.atan2(closest.y - b.y, closest.x - b.x);
                const speed = Math.hypot(b.vx, b.vy);
                b.vx += Math.cos(angle) * 500 * dt;
                b.vy += Math.sin(angle) * 500 * dt;
                const newSpeed = Math.hypot(b.vx, b.vy);
                b.vx = (b.vx / newSpeed) * speed;
                b.vy = (b.vy / newSpeed) * speed;
            }
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (b.x < 0 || b.x > ROOM_W || b.y < 0 || b.y > ROOM_H) {
            playerBullets.splice(i, 1);
        }
    }

    // Enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (b.x < -20 || b.x > ROOM_W + 20 || b.y < -20 || b.y > ROOM_H + 20) {
            enemyBullets.splice(i, 1);
        }
    }
}

function updateEnemies(dt) {
    for (const enemy of enemies) {
        enemy.shootTimer -= dt;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        switch (enemy.behavior) {
            case 'chase':
                enemy.x += (dx / dist) * enemy.speed * dt;
                enemy.y += (dy / dist) * enemy.speed * dt;
                break;
            case 'dash':
                if (Math.random() < 0.01) {
                    enemy.vx = (dx / dist) * enemy.speed * 2;
                    enemy.vy = (dy / dist) * enemy.speed * 2;
                }
                enemy.x += enemy.vx * dt;
                enemy.y += enemy.vy * dt;
                enemy.vx *= 0.98;
                enemy.vy *= 0.98;
                break;
            case 'strafe':
                enemy.x += Math.cos(Date.now() / 500) * enemy.speed * dt;
                enemy.y += Math.sin(Date.now() / 700) * enemy.speed * 0.5 * dt;
                break;
            case 'wander':
                enemy.x += enemy.vx * dt;
                enemy.y += enemy.vy * dt;
                if (enemy.x < 50 || enemy.x > ROOM_W - 50) enemy.vx *= -1;
                if (enemy.y < 50 || enemy.y > ROOM_H - 50) enemy.vy *= -1;
                break;
            case 'bounce':
                enemy.x += enemy.vx * dt;
                enemy.y += enemy.vy * dt;
                if (enemy.x < 20 || enemy.x > ROOM_W - 20) enemy.vx *= -1;
                if (enemy.y < 20 || enemy.y > ROOM_H - 20) enemy.vy *= -1;
                break;
            case 'swarm':
                enemy.x += (dx / dist) * enemy.speed * dt;
                enemy.y += (dy / dist) * enemy.speed * dt;
                break;
        }

        // Clamp
        enemy.x = Math.max(20, Math.min(ROOM_W - 20, enemy.x));
        enemy.y = Math.max(20, Math.min(ROOM_H - 20, enemy.y));

        // Shoot
        if (enemy.shootTimer <= 0 && enemy.behavior !== 'swarm') {
            enemy.shootTimer = 1.5 + Math.random();
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);

            if (enemy.behavior === 'strafe') {
                for (let i = -1; i <= 1; i++) {
                    enemyBullets.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: Math.cos(angle + i * 0.3) * 200,
                        vy: Math.sin(angle + i * 0.3) * 200,
                        color: '#f88'
                    });
                }
            } else {
                enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angle) * 180,
                    vy: Math.sin(angle) * 180,
                    color: '#f88'
                });
            }
        }
    }
}

function updateBoss(dt) {
    boss.attackTimer -= dt;
    boss.moveTimer -= dt;

    // Movement
    if (boss.moveTimer <= 0) {
        boss.moveTimer = 2 + Math.random() * 2;
        boss.targetX = 100 + Math.random() * (ROOM_W - 200);
        boss.targetY = 80 + Math.random() * 150;
    }

    if (boss.targetX !== undefined) {
        boss.x += (boss.targetX - boss.x) * 2 * dt;
        boss.y += (boss.targetY - boss.y) * 2 * dt;
    }

    // Attack patterns
    if (boss.attackTimer <= 0) {
        boss.attackTimer = 1 + Math.random();
        boss.pattern = (boss.pattern + 1) % 3;

        const angle = Math.atan2(player.y - boss.y, player.x - boss.x);

        if (boss.pattern === 0) {
            // Spread shot
            for (let i = -3; i <= 3; i++) {
                enemyBullets.push({
                    x: boss.x,
                    y: boss.y,
                    vx: Math.cos(angle + i * 0.2) * 150,
                    vy: Math.sin(angle + i * 0.2) * 150,
                    color: boss.color
                });
            }
        } else if (boss.pattern === 1) {
            // Ring
            for (let i = 0; i < 16; i++) {
                const a = (i / 16) * Math.PI * 2;
                enemyBullets.push({
                    x: boss.x,
                    y: boss.y,
                    vx: Math.cos(a) * 120,
                    vy: Math.sin(a) * 120,
                    color: boss.color
                });
            }
        } else {
            // Aimed burst
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    if (boss) {
                        const a = Math.atan2(player.y - boss.y, player.x - boss.x);
                        enemyBullets.push({
                            x: boss.x,
                            y: boss.y,
                            vx: Math.cos(a) * 200,
                            vy: Math.sin(a) * 200,
                            color: boss.color
                        });
                    }
                }, i * 100);
            }
        }
    }

    // Phase changes
    if (boss.hp < boss.maxHp * 0.66 && boss.phase === 1) {
        boss.phase = 2;
    }
    if (boss.hp < boss.maxHp * 0.33 && boss.phase === 2) {
        boss.phase = 3;
    }
}

function checkCollisions() {
    // Player bullets vs enemies
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const b = playerBullets[i];

        // Check boss
        if (boss) {
            const dist = Math.hypot(b.x - boss.x, b.y - boss.y);
            if (dist < 40) {
                boss.hp -= b.damage;
                if (!b.piercing) playerBullets.splice(i, 1);

                if (boss.hp <= 0) {
                    defeatBoss();
                }
                continue;
            }
        }

        // Check enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
            if (dist < 20) {
                enemy.hp -= b.damage;
                if (!b.piercing) playerBullets.splice(i, 1);

                if (b.explosive) {
                    // AoE damage
                    for (const other of enemies) {
                        const d = Math.hypot(other.x - b.x, other.y - b.y);
                        if (d < 60) other.hp -= b.damage * 0.5;
                    }
                }

                if (enemy.hp <= 0) {
                    killEnemy(enemy, j);
                }
                break;
            }
        }
    }

    // Enemy bullets vs player
    if (player.invincible <= 0) {
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];
            const dist = Math.hypot(b.x - player.x, b.y - player.y);
            const hitbox = player.isFocused ? 4 : 10;

            if (dist < hitbox) {
                damagePlayer();
                enemyBullets.splice(i, 1);
            }
        }
    }

    // Enemy contact vs player
    if (player.invincible <= 0) {
        for (const enemy of enemies) {
            const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
            if (dist < 25) {
                damagePlayer();
            }
        }
    }

    // Check room cleared
    if (enemies.length === 0 && !roomEnemiesCleared && !boss) {
        roomCleared();
    }
}

function killEnemy(enemy, index) {
    enemies.splice(index, 1);
    debris += Math.floor(enemy.points * multiplier);
    multiplier = Math.min(5, multiplier + 0.1);

    // Blob splits
    if (enemy.splits && enemy.hp <= 0) {
        for (let i = 0; i < 2; i++) {
            enemies.push({
                x: enemy.x + (Math.random() - 0.5) * 30,
                y: enemy.y + (Math.random() - 0.5) * 30,
                type: 'swarmer',
                hp: 12,
                maxHp: 12,
                speed: 250,
                color: '#aaffaa',
                points: 12,
                behavior: 'swarm',
                shootTimer: 10,
                vx: 0, vy: 0
            });
        }
    }
}

function damagePlayer() {
    if (player.shields > 0) {
        player.shields--;
    } else {
        player.hp--;
    }
    player.invincible = 1;
    multiplier = 1;

    if (player.hp <= 0) {
        state = 'gameover';
    }
}

function roomCleared() {
    roomEnemiesCleared = true;
    roomMap[currentRoom.y][currentRoom.x].cleared = true;
    roomsCleared++;

    // Bomb recharge
    if (roomsCleared % 3 === 0 && player.bombs < player.maxBombs) {
        player.bombs++;
    }

    // Drop weapon sometimes
    if (Math.random() < 0.3 && player.weapons.length < 4) {
        const idx = 1 + Math.floor(Math.random() * (WEAPONS.length - 1));
        const keywordRoll = Math.random();
        let keyword = null;
        if (keywordRoll < 0.2) keyword = KEYWORDS.homing;
        else if (keywordRoll < 0.35) keyword = KEYWORDS.triple;
        else if (keywordRoll < 0.45) keyword = KEYWORDS.highCaliber;

        player.weapons.push({ ...WEAPONS[idx], keyword });
    }
}

function defeatBoss() {
    boss = null;
    roomMap[currentRoom.y][currentRoom.x].cleared = true;
    state = 'playing';

    // Reward
    player.maxHp += 2;
    player.hp = Math.min(player.maxHp, player.hp + 2);
    debris += 1000 * floor;

    // Next floor or victory
    if (floor >= 3) {
        state = 'victory';
    } else {
        floor++;
        generateFloor();
        enterRoom(2, 2);
    }
}

function checkRoomTransition() {
    const margin = 30;
    let newX = currentRoom.x;
    let newY = currentRoom.y;

    if (player.x < margin) newX--;
    else if (player.x > ROOM_W - margin) newX++;
    else if (player.y < margin) newY--;
    else if (player.y > ROOM_H - margin) newY++;

    if ((newX !== currentRoom.x || newY !== currentRoom.y) &&
        newX >= 0 && newX < 5 && newY >= 0 && newY < 5 &&
        roomMap[newY][newX]) {
        // Move player to opposite side
        if (newX < currentRoom.x) player.x = ROOM_W - margin - 10;
        else if (newX > currentRoom.x) player.x = margin + 10;
        if (newY < currentRoom.y) player.y = ROOM_H - margin - 10;
        else if (newY > currentRoom.y) player.y = margin + 10;

        enterRoom(newX, newY);
    }
}

// Render
function render() {
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state === 'menu') {
        renderMenu();
    } else if (state === 'gameover') {
        renderGameOver();
    } else if (state === 'victory') {
        renderVictory();
    } else {
        renderGame();
    }
}

function renderMenu() {
    ctx.fillStyle = '#4a8aff';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('STAR OF PROVIDENCE', canvas.width / 2, 150);

    ctx.fillStyle = '#888';
    ctx.font = '18px Arial';
    ctx.fillText('Bullet Hell Roguelike', canvas.width / 2, 190);

    ctx.fillStyle = '#ffd700';
    ctx.font = '24px Arial';
    ctx.fillText('Press ENTER to Begin', canvas.width / 2, 350);

    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.fillText('WASD: Move | SHIFT: Focus | Z: Dash | X: Bomb | CLICK: Shoot', canvas.width / 2, 450);
    ctx.fillText('1-4: Switch Weapon | Clear 3 floors to win!', canvas.width / 2, 475);
}

function renderGame() {
    // Room background
    const room = roomMap[currentRoom.y][currentRoom.x];
    ctx.fillStyle = room?.type === 'boss' ? '#1a0a1a' : (room?.type === 'shop' ? '#0a1a0a' : '#0a0a1a');
    ctx.fillRect(0, HUD_H, ROOM_W, ROOM_H);

    // Grid
    ctx.strokeStyle = '#1a1a2a';
    for (let x = 0; x < ROOM_W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, HUD_H);
        ctx.lineTo(x, HUD_H + ROOM_H);
        ctx.stroke();
    }
    for (let y = 0; y < ROOM_H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, HUD_H + y);
        ctx.lineTo(ROOM_W, HUD_H + y);
        ctx.stroke();
    }

    // Door indicators when room cleared
    if (roomEnemiesCleared) {
        ctx.fillStyle = '#4a4';
        // Check adjacent rooms
        if (currentRoom.y > 0 && roomMap[currentRoom.y - 1][currentRoom.x]) {
            ctx.fillRect(ROOM_W / 2 - 20, HUD_H, 40, 10);
        }
        if (currentRoom.y < 4 && roomMap[currentRoom.y + 1][currentRoom.x]) {
            ctx.fillRect(ROOM_W / 2 - 20, HUD_H + ROOM_H - 10, 40, 10);
        }
        if (currentRoom.x > 0 && roomMap[currentRoom.y][currentRoom.x - 1]) {
            ctx.fillRect(0, HUD_H + ROOM_H / 2 - 20, 10, 40);
        }
        if (currentRoom.x < 4 && roomMap[currentRoom.y][currentRoom.x + 1]) {
            ctx.fillRect(ROOM_W - 10, HUD_H + ROOM_H / 2 - 20, 10, 40);
        }
    }

    // Shop items
    if (room?.type === 'shop') {
        ctx.fillStyle = '#ffd700';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SHOP - Walk over items to buy', ROOM_W / 2, HUD_H + 50);

        ctx.fillStyle = '#8af';
        ctx.fillText('Health (+2 HP): 100 debris', ROOM_W / 2, HUD_H + 200);
        ctx.fillText('Shield: 150 debris', ROOM_W / 2, HUD_H + 250);
    }

    // Draw enemy bullets
    ctx.fillStyle = '#f44';
    for (const b of enemyBullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y + HUD_H, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw enemies
    for (const enemy of enemies) {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x - 15, enemy.y + HUD_H - 15, 30, 30);

        // HP bar
        ctx.fillStyle = '#400';
        ctx.fillRect(enemy.x - 15, enemy.y + HUD_H - 22, 30, 4);
        ctx.fillStyle = '#4a4';
        ctx.fillRect(enemy.x - 15, enemy.y + HUD_H - 22, 30 * (enemy.hp / enemy.maxHp), 4);
    }

    // Draw boss
    if (boss) {
        ctx.fillStyle = boss.color;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y + HUD_H, 40, 0, Math.PI * 2);
        ctx.fill();

        // Boss HP bar
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(100, HUD_H + 10, 600, 25);
        ctx.fillStyle = '#a44';
        ctx.fillRect(100, HUD_H + 10, 600 * (boss.hp / boss.maxHp), 25);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${boss.name} - Phase ${boss.phase}`, ROOM_W / 2, HUD_H + 27);
    }

    // Draw player bullets
    for (const b of playerBullets) {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y + HUD_H, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw player
    ctx.fillStyle = player.invincible > 0 && Math.floor(player.invincible * 10) % 2 ? '#888' : '#4af';
    ctx.beginPath();
    ctx.arc(player.x, player.y + HUD_H, 12, 0, Math.PI * 2);
    ctx.fill();

    // Focus hitbox
    if (player.isFocused) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(player.x, player.y + HUD_H, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Dash indicator
    if (player.dashDuration > 0) {
        ctx.strokeStyle = '#8ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y + HUD_H, 20, 0, Math.PI * 2);
        ctx.stroke();
    }

    // HUD
    renderHUD();
}

function renderHUD() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, HUD_H);

    // HP
    ctx.fillStyle = '#888';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('HP:', 10, 25);

    for (let i = 0; i < player.maxHp; i++) {
        ctx.fillStyle = i < player.hp ? '#f44' : '#422';
        ctx.fillRect(40 + i * 22, 12, 18, 18);
    }

    // Shields
    ctx.fillStyle = '#888';
    ctx.fillText('SHIELD:', 10, 50);
    for (let i = 0; i < player.maxShields; i++) {
        ctx.fillStyle = i < player.shields ? '#4af' : '#244';
        ctx.fillRect(70 + i * 22, 37, 18, 18);
    }

    // Bombs
    ctx.fillStyle = '#888';
    ctx.fillText('BOMBS:', 10, 75);
    for (let i = 0; i < player.maxBombs; i++) {
        ctx.fillStyle = i < player.bombs ? '#fa0' : '#442';
        ctx.beginPath();
        ctx.arc(75 + i * 18, 70, 7, 0, Math.PI * 2);
        ctx.fill();
    }

    // Weapon
    const weapon = player.weapons[player.currentWeapon];
    ctx.fillStyle = weapon.color;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    const keywordText = weapon.keyword ? ` (${weapon.keyword.name})` : '';
    ctx.fillText(`${weapon.name}${keywordText}`, 400, 25);

    // Ammo bar
    if (weapon.ammo !== Infinity) {
        ctx.fillStyle = '#333';
        ctx.fillRect(300, 35, 200, 12);
        ctx.fillStyle = weapon.color;
        ctx.fillRect(300, 35, 200 * (weapon.ammo / weapon.maxAmmo), 12);
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText(`${weapon.ammo}/${weapon.maxAmmo}`, 400, 45);
    } else {
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.fillText('INFINITE AMMO', 400, 47);
    }

    // Weapon slots
    ctx.font = '10px Arial';
    for (let i = 0; i < player.weapons.length; i++) {
        ctx.fillStyle = i === player.currentWeapon ? '#fff' : '#666';
        ctx.fillText(`[${i + 1}]`, 300 + i * 50, 70);
    }

    // Floor & debris
    ctx.fillStyle = '#ffd700';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Floor ${floor}`, canvas.width - 20, 25);
    ctx.fillText(`Debris: ${debris}`, canvas.width - 20, 45);
    ctx.fillText(`x${multiplier.toFixed(2)}`, canvas.width - 20, 65);

    // Minimap
    const mapX = canvas.width - 80;
    const mapY = 75;
    const cellSize = 12;

    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            const room = roomMap[y][x];
            if (room) {
                if (x === currentRoom.x && y === currentRoom.y) {
                    ctx.fillStyle = '#4af';
                } else if (room.type === 'boss') {
                    ctx.fillStyle = room.cleared ? '#484' : '#844';
                } else if (room.type === 'shop') {
                    ctx.fillStyle = '#884';
                } else {
                    ctx.fillStyle = room.cleared ? '#484' : '#444';
                }
                ctx.fillRect(mapX + x * cellSize, mapY + y * cellSize, cellSize - 2, cellSize - 2);
            }
        }
    }
}

function renderGameOver() {
    ctx.fillStyle = '#200';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f44';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, 200);

    ctx.fillStyle = '#888';
    ctx.font = '20px Arial';
    ctx.fillText(`Reached Floor ${floor}`, canvas.width / 2, 280);
    ctx.fillText(`Debris Collected: ${debris}`, canvas.width / 2, 320);

    ctx.fillStyle = '#ffd700';
    ctx.font = '24px Arial';
    ctx.fillText('Press ENTER to try again', canvas.width / 2, 420);
}

function renderVictory() {
    ctx.fillStyle = '#021';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4f4';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, 200);

    ctx.fillStyle = '#888';
    ctx.font = '20px Arial';
    ctx.fillText('You defeated all 3 bosses!', canvas.width / 2, 280);
    ctx.fillText(`Final Debris: ${debris}`, canvas.width / 2, 320);

    ctx.fillStyle = '#ffd700';
    ctx.font = '24px Arial';
    ctx.fillText('Press ENTER to play again', canvas.width / 2, 420);
}

// Input
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (state === 'menu' && e.key === 'Enter') {
        initGame();
        enterRoom(2, 2);
        state = 'playing';
    } else if ((state === 'gameover' || state === 'victory') && e.key === 'Enter') {
        initGame();
        enterRoom(2, 2);
        state = 'playing';
    } else if (state === 'playing' || state === 'boss') {
        // Weapon switch
        if (e.key >= '1' && e.key <= '4') {
            const idx = parseInt(e.key) - 1;
            if (idx < player.weapons.length) {
                player.currentWeapon = idx;
            }
        }
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

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
