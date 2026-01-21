// Star of Providence Clone - Bullet Hell Roguelike
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'title'; // title, playing, shop, paused, gameover, victory
let currentFloor = 1;
let currentRoom = null;
let roomsCleared = 0;
let bossDefeated = false;

// Player ship
const player = {
    x: 400, y: 450,
    width: 24, height: 24,
    speed: 4, focusSpeed: 1.5,
    hp: 4, maxHp: 4,
    shields: 0, maxShields: 2,
    bombs: 2, maxBombs: 6,
    bombCooldown: 0,
    dashCooldown: 0, dashing: false, dashDir: {x: 0, y: 0}, dashTimer: 0,
    invincible: 0,
    focused: false,
    debris: 0,
    multiplier: 1.0,
    multiplierTimer: 0,
    damageMod: 1.0,
    weapons: [],
    currentWeapon: 0,
    fireTimer: 0
};

// Weapons
const weaponData = {
    peashooter: { name: 'Peashooter', damage: 5, fireRate: 6, velocity: 12, ammo: Infinity, color: '#8f8' },
    vulcan: { name: 'Vulcan', damage: 15, fireRate: 8, velocity: 10, ammo: 500, color: '#ff8' },
    laser: { name: 'Laser', damage: 115, fireRate: 40, velocity: 50, ammo: 100, color: '#f8f', pierce: true },
    fireball: { name: 'Fireball', damage: 80, fireRate: 50, velocity: 6, ammo: 90, color: '#f84', aoe: true },
    revolver: { name: 'Revolver', damage: 28, fireRate: 8, velocity: 9, ammo: 250, color: '#fff' },
    sword: { name: 'Sword', damage: 70, fireRate: 32, velocity: 0, ammo: 125, color: '#8ff', melee: true }
};

const keywords = {
    homing: { name: 'Homing', damageMod: 1.0, ammoMod: 1.0 },
    triple: { name: 'Triple', damageMod: 0.5, ammoMod: 1.5 },
    highCaliber: { name: 'High-Caliber', damageMod: 3.5, ammoMod: 0.56 }
};

// Enemies
let enemies = [];
let bullets = [];
let enemyBullets = [];
let particles = [];
let pickups = [];

// Room/floor data
let rooms = [];
let mapSize = 5;

// Input
const keys = {};
let mouse = { x: 0, y: 0, down: false };

// Initialize
function init() {
    // Start with peashooter
    player.weapons = [{ ...weaponData.peashooter, keyword: null, currentAmmo: Infinity }];

    document.addEventListener('keydown', e => {
        keys[e.key.toLowerCase()] = true;
        if (e.key === ' ' && gameState === 'title') {
            startGame();
        } else if (e.key === ' ' && (gameState === 'gameover' || gameState === 'victory')) {
            location.reload();
        } else if (e.key === 'x' && gameState === 'playing') {
            useBomb();
        } else if (e.key === 'z' || e.key === 'q') {
            startDash();
        } else if (e.key === 'e') {
            switchWeapon();
        }
    });
    document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mousedown', e => {
        mouse.down = true;
        if (e.button === 2) player.focused = true;
    });
    canvas.addEventListener('mouseup', e => {
        mouse.down = false;
        if (e.button === 2) player.focused = false;
    });
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameState = 'playing';
    currentFloor = 1;
    roomsCleared = 0;
    bossDefeated = false;
    player.hp = player.maxHp;
    player.bombs = 2;
    player.debris = 0;
    player.multiplier = 1.0;
    player.weapons = [{ ...weaponData.peashooter, keyword: null, currentAmmo: Infinity }];
    generateFloor();
    enterRoom(Math.floor(mapSize / 2), mapSize - 1); // Start at bottom center
}

function generateFloor() {
    rooms = [];
    mapSize = 4 + currentFloor;

    for (let y = 0; y < mapSize; y++) {
        rooms[y] = [];
        for (let x = 0; x < mapSize; x++) {
            const isBoss = (y === 0 && x === Math.floor(mapSize / 2));
            const isStart = (y === mapSize - 1 && x === Math.floor(mapSize / 2));
            const isShop = (y === Math.floor(mapSize / 2) && x === 0 && Math.random() < 0.5);

            rooms[y][x] = {
                x, y,
                type: isBoss ? 'boss' : isStart ? 'start' : isShop ? 'shop' : 'normal',
                cleared: isStart,
                visited: isStart,
                enemies: []
            };
        }
    }
}

function enterRoom(rx, ry) {
    if (rx < 0 || rx >= mapSize || ry < 0 || ry >= mapSize) return;

    currentRoom = rooms[ry][rx];
    currentRoom.visited = true;

    // Reset player position
    player.x = 400;
    player.y = 450;

    enemies = [];
    bullets = [];
    enemyBullets = [];
    pickups = [];

    if (!currentRoom.cleared) {
        if (currentRoom.type === 'boss') {
            spawnBoss();
        } else if (currentRoom.type === 'normal') {
            spawnEnemies();
        } else if (currentRoom.type === 'shop') {
            spawnShop();
        }
    }
}

function spawnEnemies() {
    const count = 4 + currentFloor * 2 + Math.floor(Math.random() * 3);
    const types = getEnemyTypes();

    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        enemies.push(createEnemy(type, 100 + Math.random() * 600, 100 + Math.random() * 250));
    }
}

function getEnemyTypes() {
    if (currentFloor === 1) return ['ghost', 'drone', 'swarmer'];
    if (currentFloor === 2) return ['ghost', 'crazyGhost', 'drone', 'turret', 'seeker'];
    return ['turret', 'seeker', 'blob', 'pyromancer', 'bumper'];
}

function createEnemy(type, x, y) {
    const templates = {
        ghost: { name: 'Ghost', hp: 50, speed: 1.5, size: 20, color: '#88f', behavior: 'chase', fireRate: 90, bulletSpeed: 4 },
        crazyGhost: { name: 'Crazy Ghost', hp: 100, speed: 4, size: 22, color: '#a4f', behavior: 'dash', fireRate: 60, bulletSpeed: 0 },
        drone: { name: 'Drone', hp: 70, speed: 3, size: 18, color: '#4f8', behavior: 'chase', fireRate: 50, bulletSpeed: 5, spread: 3 },
        turret: { name: 'Turret', hp: 90, speed: 0, size: 24, color: '#f84', behavior: 'stationary', fireRate: 40, bulletSpeed: 6 },
        seeker: { name: 'Seeker', hp: 120, speed: 2, size: 22, color: '#f4f', behavior: 'wander', fireRate: 70, bulletSpeed: 4, spread: 5 },
        swarmer: { name: 'Swarmer', hp: 12, speed: 5, size: 12, color: '#ff4', behavior: 'chase', fireRate: 0 },
        blob: { name: 'Blob', hp: 150, speed: 1, size: 30, color: '#4f4', behavior: 'bounce', fireRate: 0, splits: true },
        pyromancer: { name: 'Pyromancer', hp: 110, speed: 1.2, size: 24, color: '#f40', behavior: 'wander', fireRate: 80, bulletSpeed: 3, bulletSize: 12 },
        bumper: { name: 'Bumper', hp: 120, speed: 3.5, size: 26, color: '#48f', behavior: 'bounce', fireRate: 0, deathRing: true },
        hermit: { name: 'Hermit', hp: 125, speed: 0.5, size: 28, color: '#446', behavior: 'wander', fireRate: 100, spawnsGhosts: true }
    };

    const t = templates[type];
    return {
        x, y, vx: (Math.random() - 0.5) * t.speed * 2, vy: (Math.random() - 0.5) * t.speed * 2,
        width: t.size, height: t.size,
        type, ...t,
        maxHp: t.hp,
        fireTimer: Math.random() * t.fireRate,
        hitFlash: 0,
        dashTimer: 0
    };
}

function spawnBoss() {
    const bossData = {
        1: { name: 'Chamberlord', hp: 1500, size: 60, color: '#f84', phases: 3 },
        2: { name: 'Wraithking', hp: 2000, size: 70, color: '#84f', phases: 3 },
        3: { name: 'Core Guardian', hp: 2500, size: 80, color: '#4ff', phases: 4 }
    };

    const boss = bossData[currentFloor];
    enemies.push({
        x: 400, y: 150,
        width: boss.size, height: boss.size,
        name: boss.name,
        hp: boss.hp, maxHp: boss.hp,
        speed: 1, color: boss.color,
        isBoss: true,
        phase: 1, maxPhases: boss.phases,
        fireTimer: 0, patternTimer: 0,
        attackPattern: 0,
        hitFlash: 0
    });
}

function spawnShop() {
    // Add weapon pickups
    const availableWeapons = ['vulcan', 'laser', 'fireball', 'revolver', 'sword'];
    const weapon = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
    const kw = Math.random() < 0.3 ? Object.keys(keywords)[Math.floor(Math.random() * 3)] : null;

    pickups.push({
        x: 300, y: 200, type: 'weapon', weapon, keyword: kw,
        cost: 100 + currentFloor * 50
    });

    pickups.push({
        x: 500, y: 200, type: 'hp', cost: 150
    });

    pickups.push({
        x: 400, y: 300, type: 'bomb', cost: 75
    });
}

// Player actions
function startDash() {
    if (player.dashCooldown > 0 || player.dashing) return;

    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy = -1;
    if (keys['s'] || keys['arrowdown']) dy = 1;
    if (keys['a'] || keys['arrowleft']) dx = -1;
    if (keys['d'] || keys['arrowright']) dx = 1;

    if (dx === 0 && dy === 0) {
        dx = (mouse.x - player.x) > 0 ? 1 : -1;
    }

    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    player.dashDir = { x: dx / len, y: dy / len };
    player.dashing = true;
    player.dashTimer = 10;
    player.invincible = 15;
    player.dashCooldown = 30;
}

function useBomb() {
    if (player.bombs <= 0 || player.bombCooldown > 0) return;

    player.bombs--;
    player.bombCooldown = 60;

    // Clear all enemy bullets
    enemyBullets = [];

    // Damage all enemies
    for (const enemy of enemies) {
        enemy.hp -= 50;
        enemy.hitFlash = 15;
    }

    // Visual effect
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: player.x, y: player.y,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            life: 40, color: '#ff8', size: 8
        });
    }
}

function switchWeapon() {
    if (player.weapons.length > 1) {
        player.currentWeapon = (player.currentWeapon + 1) % player.weapons.length;
    }
}

function fireWeapon() {
    const weapon = player.weapons[player.currentWeapon];
    if (player.fireTimer > 0) return;
    if (weapon.currentAmmo !== Infinity && weapon.currentAmmo <= 0) return;

    player.fireTimer = weapon.fireRate;
    if (weapon.currentAmmo !== Infinity) weapon.currentAmmo--;

    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    let damage = weapon.damage * player.damageMod;
    let shots = 1;

    if (weapon.keyword === 'triple') {
        shots = 3;
        damage *= 0.5;
    }
    if (weapon.keyword === 'highCaliber') {
        damage *= 3.5;
    }

    for (let i = 0; i < shots; i++) {
        let angle = Math.atan2(ny, nx);
        if (shots > 1) {
            angle += (i - 1) * 0.2;
        }

        const bullet = {
            x: player.x, y: player.y,
            vx: Math.cos(angle) * weapon.velocity,
            vy: Math.sin(angle) * weapon.velocity,
            damage,
            color: weapon.color,
            size: weapon.keyword === 'highCaliber' ? 8 : 4,
            pierce: weapon.pierce,
            aoe: weapon.aoe,
            homing: weapon.keyword === 'homing',
            melee: weapon.melee,
            life: weapon.melee ? 15 : 200
        };
        bullets.push(bullet);
    }
}

// Update
function update() {
    if (gameState !== 'playing') return;

    // Timers
    if (player.fireTimer > 0) player.fireTimer--;
    if (player.dashCooldown > 0) player.dashCooldown--;
    if (player.bombCooldown > 0) player.bombCooldown--;
    if (player.invincible > 0) player.invincible--;
    if (player.multiplierTimer > 0) {
        player.multiplierTimer--;
        if (player.multiplierTimer <= 0) player.multiplier = Math.max(1, player.multiplier - 0.5);
    }

    // Player movement
    if (player.dashing) {
        player.x += player.dashDir.x * 12;
        player.y += player.dashDir.y * 12;
        player.dashTimer--;
        if (player.dashTimer <= 0) player.dashing = false;
    } else {
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy = -1;
        if (keys['s'] || keys['arrowdown']) dy = 1;
        if (keys['a'] || keys['arrowleft']) dx = -1;
        if (keys['d'] || keys['arrowright']) dx = 1;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        player.focused = keys['shift'] || keys['control'];
        const speed = player.focused ? player.focusSpeed : player.speed;
        player.x += dx * speed;
        player.y += dy * speed;
    }

    // Bounds
    player.x = Math.max(20, Math.min(780, player.x));
    player.y = Math.max(80, Math.min(560, player.y));

    // Fire weapon
    if (mouse.down || keys[' ']) {
        fireWeapon();
    }

    // Update bullets
    for (const bullet of bullets) {
        if (bullet.homing && enemies.length > 0) {
            let closest = null, closestDist = Infinity;
            for (const e of enemies) {
                if (e.hp <= 0) continue;
                const d = Math.hypot(e.x - bullet.x, e.y - bullet.y);
                if (d < closestDist) { closest = e; closestDist = d; }
            }
            if (closest) {
                const angle = Math.atan2(closest.y - bullet.y, closest.x - bullet.x);
                const speed = Math.hypot(bullet.vx, bullet.vy);
                bullet.vx += Math.cos(angle) * 0.5;
                bullet.vy += Math.sin(angle) * 0.5;
                const newSpeed = Math.hypot(bullet.vx, bullet.vy);
                bullet.vx = (bullet.vx / newSpeed) * speed;
                bullet.vy = (bullet.vy / newSpeed) * speed;
            }
        }

        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life--;

        // Check enemy collision
        for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;
            if (Math.abs(bullet.x - enemy.x) < enemy.width / 2 + bullet.size &&
                Math.abs(bullet.y - enemy.y) < enemy.height / 2 + bullet.size) {

                enemy.hp -= bullet.damage;
                enemy.hitFlash = 10;

                // AoE
                if (bullet.aoe) {
                    for (const e2 of enemies) {
                        if (e2 !== enemy && Math.hypot(e2.x - bullet.x, e2.y - bullet.y) < 50) {
                            e2.hp -= bullet.damage * 0.5;
                            e2.hitFlash = 10;
                        }
                    }
                    // Explosion particles
                    for (let i = 0; i < 10; i++) {
                        particles.push({
                            x: bullet.x, y: bullet.y,
                            vx: (Math.random() - 0.5) * 8,
                            vy: (Math.random() - 0.5) * 8,
                            life: 20, color: '#f84', size: 6
                        });
                    }
                }

                if (!bullet.pierce) bullet.life = 0;

                // Check kill
                if (enemy.hp <= 0) {
                    onEnemyKill(enemy);
                }
            }
        }
    }
    bullets = bullets.filter(b => b.life > 0 && b.x > 0 && b.x < 800 && b.y > 0 && b.y < 600);

    // Update enemies
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        if (enemy.hitFlash > 0) enemy.hitFlash--;

        updateEnemy(enemy);
    }
    enemies = enemies.filter(e => e.hp > 0);

    // Update enemy bullets
    for (const bullet of enemyBullets) {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life--;

        // Player collision
        if (player.invincible <= 0 && !player.dashing) {
            const dist = Math.hypot(bullet.x - player.x, bullet.y - player.y);
            if (dist < bullet.size + 8) {
                playerHit();
                bullet.life = 0;
            }
        }
    }
    enemyBullets = enemyBullets.filter(b => b.life > 0 && b.x > 0 && b.x < 800 && b.y > 0 && b.y < 600);

    // Update particles
    for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life--;
    }
    particles = particles.filter(p => p.life > 0);

    // Check room clear
    if (!currentRoom.cleared && currentRoom.type !== 'shop' && enemies.length === 0) {
        currentRoom.cleared = true;
        roomsCleared++;

        if (currentRoom.type === 'boss') {
            bossDefeated = true;
            // Floor reward
            if (Math.random() < 0.5) {
                player.maxHp += 2;
                player.hp = Math.min(player.hp + 2, player.maxHp);
            } else {
                player.damageMod += 0.05;
            }

            if (currentFloor >= 3) {
                gameState = 'victory';
            } else {
                // Drop to next floor after delay
                setTimeout(() => {
                    currentFloor++;
                    bossDefeated = false;
                    generateFloor();
                    enterRoom(Math.floor(mapSize / 2), mapSize - 1);
                }, 2000);
            }
        }
    }

    // Check room transitions
    if (currentRoom.cleared || currentRoom.type === 'start' || currentRoom.type === 'shop') {
        if (player.y < 85) enterRoom(currentRoom.x, currentRoom.y - 1);
        if (player.y > 555) enterRoom(currentRoom.x, currentRoom.y + 1);
        if (player.x < 25) enterRoom(currentRoom.x - 1, currentRoom.y);
        if (player.x > 775) enterRoom(currentRoom.x + 1, currentRoom.y);
    }

    // Shop interaction
    if (currentRoom.type === 'shop') {
        for (let i = pickups.length - 1; i >= 0; i--) {
            const p = pickups[i];
            if (keys['e'] && Math.hypot(player.x - p.x, player.y - p.y) < 40) {
                if (player.debris >= p.cost) {
                    player.debris -= p.cost;
                    if (p.type === 'weapon') {
                        const newWeapon = { ...weaponData[p.weapon], keyword: p.keyword, currentAmmo: weaponData[p.weapon].ammo };
                        player.weapons.push(newWeapon);
                    } else if (p.type === 'hp') {
                        player.maxHp += 1;
                        player.hp = player.maxHp;
                    } else if (p.type === 'bomb') {
                        player.bombs = Math.min(player.maxBombs, player.bombs + 2);
                    }
                    pickups.splice(i, 1);
                }
                keys['e'] = false;
            }
        }
    }
}

function updateEnemy(enemy) {
    if (enemy.isBoss) {
        updateBoss(enemy);
        return;
    }

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    // Movement
    if (enemy.behavior === 'chase') {
        if (dist > 30) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }
    } else if (enemy.behavior === 'wander') {
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        if (enemy.x < 50 || enemy.x > 750) enemy.vx *= -1;
        if (enemy.y < 100 || enemy.y > 400) enemy.vy *= -1;
    } else if (enemy.behavior === 'bounce') {
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        if (enemy.x < 30 || enemy.x > 770) enemy.vx *= -1;
        if (enemy.y < 90 || enemy.y > 550) enemy.vy *= -1;
    } else if (enemy.behavior === 'dash') {
        if (enemy.dashTimer <= 0 && dist < 200) {
            enemy.vx = (dx / dist) * 8;
            enemy.vy = (dy / dist) * 8;
            enemy.dashTimer = 60;
        }
        if (enemy.dashTimer > 0) {
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
            enemy.vx *= 0.95;
            enemy.vy *= 0.95;
            enemy.dashTimer--;
        }
    }

    // Firing
    if (enemy.fireRate > 0) {
        enemy.fireTimer--;
        if (enemy.fireTimer <= 0 && dist < 400) {
            enemy.fireTimer = enemy.fireRate;
            fireEnemyBullet(enemy, dx / dist, dy / dist);
        }
    }

    // Contact damage
    if (dist < (enemy.width / 2 + 12) && player.invincible <= 0 && !player.dashing) {
        playerHit();
    }
}

function fireEnemyBullet(enemy, nx, ny) {
    const spread = enemy.spread || 1;
    const bulletSpeed = enemy.bulletSpeed || 4;
    const bulletSize = enemy.bulletSize || 6;

    for (let i = 0; i < spread; i++) {
        let angle = Math.atan2(ny, nx);
        if (spread > 1) {
            angle += (i - (spread - 1) / 2) * 0.3;
        }

        enemyBullets.push({
            x: enemy.x, y: enemy.y,
            vx: Math.cos(angle) * bulletSpeed,
            vy: Math.sin(angle) * bulletSpeed,
            size: bulletSize,
            color: enemy.color,
            life: 200
        });
    }
}

function updateBoss(boss) {
    boss.fireTimer--;
    boss.patternTimer++;

    const phase = Math.ceil((1 - boss.hp / boss.maxHp) * boss.maxPhases);
    if (phase > boss.phase) {
        boss.phase = phase;
        boss.attackPattern = 0;
        // Phase transition invincibility
        boss.invincible = 60;
    }

    if (boss.invincible > 0) {
        boss.invincible--;
        return;
    }

    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.hypot(dx, dy);

    // Movement
    boss.x += Math.sin(boss.patternTimer * 0.02) * 2;

    // Attack patterns
    if (boss.fireTimer <= 0) {
        boss.attackPattern = (boss.attackPattern + 1) % 4;
        boss.fireTimer = 60 - boss.phase * 10;

        if (boss.attackPattern === 0) {
            // Spread shot
            for (let i = 0; i < 8 + boss.phase * 2; i++) {
                const angle = (Math.PI * 2 * i) / (8 + boss.phase * 2);
                enemyBullets.push({
                    x: boss.x, y: boss.y,
                    vx: Math.cos(angle) * 4,
                    vy: Math.sin(angle) * 4,
                    size: 8, color: boss.color, life: 150
                });
            }
        } else if (boss.attackPattern === 1) {
            // Aimed burst
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    if (boss.hp <= 0) return;
                    const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
                    enemyBullets.push({
                        x: boss.x, y: boss.y,
                        vx: Math.cos(angle) * 6,
                        vy: Math.sin(angle) * 6,
                        size: 10, color: '#fff', life: 150
                    });
                }, i * 100);
            }
        } else if (boss.attackPattern === 2) {
            // Spiral
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    if (boss.hp <= 0) return;
                    const angle = boss.patternTimer * 0.1 + i * 0.3;
                    enemyBullets.push({
                        x: boss.x, y: boss.y,
                        vx: Math.cos(angle) * 3,
                        vy: Math.sin(angle) * 3,
                        size: 6, color: '#f8f', life: 200
                    });
                }, i * 50);
            }
        } else {
            // Wall
            for (let i = 0; i < 15; i++) {
                enemyBullets.push({
                    x: 50 + i * 50, y: 100,
                    vx: 0, vy: 3 + boss.phase,
                    size: 8, color: '#ff4', life: 200
                });
            }
        }
    }
}

function onEnemyKill(enemy) {
    // Increase multiplier
    player.multiplier = Math.min(10, player.multiplier + 0.1);
    player.multiplierTimer = 180;

    // Drop debris
    const debrisAmount = Math.floor((10 + Math.random() * 20) * player.multiplier);
    player.debris += debrisAmount;

    // Death effects
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: enemy.x, y: enemy.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 25, color: enemy.color, size: 5
        });
    }

    // Special death effects
    if (enemy.splits) {
        for (let i = 0; i < 2; i++) {
            const e = createEnemy('swarmer', enemy.x + (i - 0.5) * 30, enemy.y);
            enemies.push(e);
        }
    }
    if (enemy.deathRing) {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            enemyBullets.push({
                x: enemy.x, y: enemy.y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: 6, color: '#48f', life: 100
            });
        }
    }
}

function playerHit() {
    if (player.shields > 0) {
        player.shields--;
    } else {
        player.hp--;
    }
    player.invincible = 60;
    player.multiplier = Math.max(1, player.multiplier - 1);

    // Screen shake effect
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: player.x, y: player.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 20, color: '#f44', size: 4
        });
    }

    if (player.hp <= 0) {
        gameState = 'gameover';
    }
}

// Draw
function draw() {
    // Background
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, 800, 600);

    // Room grid
    ctx.strokeStyle = '#1a1a2a';
    for (let x = 0; x < 800; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 70);
        ctx.lineTo(x, 600);
        ctx.stroke();
    }
    for (let y = 70; y < 600; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
    }

    // Door indicators
    if (currentRoom && (currentRoom.cleared || currentRoom.type === 'start' || currentRoom.type === 'shop')) {
        ctx.fillStyle = '#4f4';
        if (currentRoom.y > 0) ctx.fillRect(380, 70, 40, 10);
        if (currentRoom.y < mapSize - 1) ctx.fillRect(380, 555, 40, 10);
        if (currentRoom.x > 0) ctx.fillRect(10, 300, 10, 40);
        if (currentRoom.x < mapSize - 1) ctx.fillRect(780, 300, 10, 40);
    }

    // Pickups (shop items)
    for (const p of pickups) {
        ctx.fillStyle = p.type === 'weapon' ? '#ff8' : p.type === 'hp' ? '#f44' : '#4ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        if (p.type === 'weapon') {
            const kw = p.keyword ? keywords[p.keyword].name + ' ' : '';
            ctx.fillText(kw + weaponData[p.weapon].name, p.x, p.y - 30);
        } else if (p.type === 'hp') {
            ctx.fillText('+1 Max HP', p.x, p.y - 30);
        } else {
            ctx.fillText('+2 Bombs', p.x, p.y - 30);
        }
        ctx.fillStyle = '#ff8';
        ctx.fillText(`${p.cost} Debris`, p.x, p.y + 40);

        if (Math.hypot(player.x - p.x, player.y - p.y) < 50) {
            ctx.fillStyle = '#8f8';
            ctx.fillText('[E] Buy', p.x, p.y + 55);
        }
    }

    // Enemy bullets
    for (const bullet of enemyBullets) {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Enemies
    for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;

        ctx.fillStyle = enemy.hitFlash > 0 ? '#fff' : enemy.color;

        if (enemy.isBoss) {
            // Boss shape
            ctx.beginPath();
            ctx.moveTo(enemy.x, enemy.y - enemy.height / 2);
            ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            ctx.lineTo(enemy.x - enemy.width / 2, enemy.y + enemy.height / 2);
            ctx.closePath();
            ctx.fill();

            // Boss HP bar (top of screen)
            ctx.fillStyle = '#400';
            ctx.fillRect(100, 25, 600, 20);
            ctx.fillStyle = enemy.color;
            ctx.fillRect(100, 25, 600 * (enemy.hp / enemy.maxHp), 20);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(100, 25, 600, 20);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${enemy.name} - Phase ${enemy.phase}/${enemy.maxPhases}`, 400, 40);
        } else {
            ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height);

            // Health bar
            if (enemy.hp < enemy.maxHp) {
                ctx.fillStyle = '#400';
                ctx.fillRect(enemy.x - 15, enemy.y - enemy.height / 2 - 8, 30, 4);
                ctx.fillStyle = '#f44';
                ctx.fillRect(enemy.x - 15, enemy.y - enemy.height / 2 - 8, 30 * (enemy.hp / enemy.maxHp), 4);
            }
        }
    }

    // Player bullets
    for (const bullet of bullets) {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 40;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Player
    if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    // Ship body
    ctx.fillStyle = player.dashing ? '#88f' : '#4af';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 12);
    ctx.lineTo(player.x + 12, player.y + 12);
    ctx.lineTo(player.x, player.y + 6);
    ctx.lineTo(player.x - 12, player.y + 12);
    ctx.closePath();
    ctx.fill();

    // Focus hitbox indicator
    if (player.focused) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 6, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // HUD
    drawHUD();

    // Minimap
    drawMinimap();

    // State screens
    if (gameState === 'title') drawTitle();
    else if (gameState === 'gameover') drawGameOver();
    else if (gameState === 'victory') drawVictory();
}

function drawHUD() {
    // HP
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('HP:', 20, 20);
    for (let i = 0; i < player.maxHp; i++) {
        ctx.fillStyle = i < player.hp ? '#f44' : '#400';
        ctx.fillRect(50 + i * 18, 8, 15, 15);
    }

    // Shields
    ctx.fillText('SH:', 20, 40);
    for (let i = 0; i < player.maxShields; i++) {
        ctx.fillStyle = i < player.shields ? '#48f' : '#024';
        ctx.fillRect(50 + i * 18, 28, 15, 15);
    }

    // Bombs
    ctx.fillStyle = '#fff';
    ctx.fillText('BOMB:', 20, 60);
    for (let i = 0; i < player.maxBombs; i++) {
        ctx.fillStyle = i < player.bombs ? '#ff8' : '#440';
        ctx.beginPath();
        ctx.arc(68 + i * 16, 54, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    // Weapon
    const weapon = player.weapons[player.currentWeapon];
    ctx.fillStyle = weapon.color;
    ctx.font = 'bold 14px Arial';
    const kwName = weapon.keyword ? keywords[weapon.keyword]?.name + ' ' : '';
    ctx.fillText(kwName + weapon.name, 200, 20);

    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    const ammoText = weapon.currentAmmo === Infinity ? '∞' : weapon.currentAmmo;
    ctx.fillText(`Ammo: ${ammoText}`, 200, 40);

    if (player.weapons.length > 1) {
        ctx.fillStyle = '#888';
        ctx.fillText('[E] Switch', 200, 55);
    }

    // Debris & Multiplier
    ctx.fillStyle = '#ff8';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Debris: ${player.debris}`, 780, 20);
    ctx.fillStyle = player.multiplier > 1 ? '#f84' : '#888';
    ctx.fillText(`x${player.multiplier.toFixed(1)}`, 780, 40);

    // Floor
    ctx.fillStyle = '#8cf';
    ctx.fillText(`Floor ${currentFloor}`, 780, 60);
}

function drawMinimap() {
    const mapX = 700;
    const mapY = 500;
    const cellSize = 12;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(mapX - 5, mapY - 5, mapSize * cellSize + 10, mapSize * cellSize + 10);

    for (let y = 0; y < mapSize; y++) {
        for (let x = 0; x < mapSize; x++) {
            const room = rooms[y]?.[x];
            if (!room || !room.visited) {
                ctx.fillStyle = '#222';
            } else if (room === currentRoom) {
                ctx.fillStyle = '#4f4';
            } else if (room.type === 'boss') {
                ctx.fillStyle = room.cleared ? '#484' : '#f44';
            } else if (room.type === 'shop') {
                ctx.fillStyle = '#ff8';
            } else {
                ctx.fillStyle = room.cleared ? '#446' : '#88f';
            }
            ctx.fillRect(mapX + x * cellSize, mapY + y * cellSize, cellSize - 1, cellSize - 1);
        }
    }
}

function drawTitle() {
    ctx.fillStyle = 'rgba(0, 0, 20, 0.9)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#4af';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('STAR OF PROVIDENCE', 400, 180);

    ctx.fillStyle = '#888';
    ctx.font = '18px Arial';
    ctx.fillText('Bullet Hell Roguelike', 400, 220);

    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText('WASD/Arrows: Move | Click/Space: Fire | Shift: Focus', 400, 300);
    ctx.fillText('Z/Q: Dash | X: Bomb | E: Switch Weapon', 400, 325);

    ctx.fillStyle = '#f84';
    ctx.fillText('Clear all 3 floors to win!', 400, 380);
    ctx.fillText('Floor 1: Chamberlord | Floor 2: Wraithking | Floor 3: Core Guardian', 400, 405);

    ctx.fillStyle = '#ff0';
    ctx.font = '24px Arial';
    ctx.fillText('Press SPACE to Start', 400, 500);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(40, 0, 0, 0.9)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#f44';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SHIP DESTROYED', 400, 250);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Floor ${currentFloor} - Rooms Cleared: ${roomsCleared}`, 400, 320);
    ctx.fillText(`Debris Collected: ${player.debris}`, 400, 350);

    ctx.fillStyle = '#888';
    ctx.font = '16px Arial';
    ctx.fillText('Press SPACE to try again', 400, 420);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#4ff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', 400, 200);

    ctx.fillStyle = '#ff8';
    ctx.font = '24px Arial';
    ctx.fillText('Core Guardian Defeated!', 400, 260);

    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.fillText('You have conquered the facility!', 400, 320);
    ctx.fillText(`Rooms Cleared: ${roomsCleared}`, 400, 360);
    ctx.fillText(`Final Debris: ${player.debris}`, 400, 390);
    ctx.fillText(`Damage Bonus: +${Math.round((player.damageMod - 1) * 100)}%`, 400, 420);

    ctx.fillStyle = '#888';
    ctx.font = '16px Arial';
    ctx.fillText('Press SPACE to play again', 400, 500);
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

init();
