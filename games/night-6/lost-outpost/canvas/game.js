// Lost Outpost - Top-down Survival Horror Shooter
// Canvas Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = 800;
const HEIGHT = 600;
const TILE_SIZE = 32;

// Game state
let gameState = 'menu'; // menu, playing, gameover, victory, paused
let gamePaused = true;
let lastTime = 0;

// Player
let player = null;
let bullets = [];
let enemies = [];
let pickups = [];
let particles = [];
let terminals = [];
let doors = [];

// Level
let level = null;
let currentLevel = 1;
let camera = { x: 0, y: 0 };

// Input
let keys = {};
let mouse = { x: WIDTH / 2, y: HEIGHT / 2, down: false };

// Weapons data
const WEAPONS = {
    assault_rifle: { name: 'Assault Rifle', damage: 15, fireRate: 150, ammo: 30, maxAmmo: 300, reloadTime: 2000, spread: 0.05, rank: 0, cost: 0 },
    smg: { name: 'SMG', damage: 8, fireRate: 80, ammo: 45, maxAmmo: 400, reloadTime: 1500, spread: 0.1, rank: 5, cost: 7000 },
    shotgun: { name: 'Shotgun', damage: 40, fireRate: 600, ammo: 8, maxAmmo: 64, reloadTime: 2500, spread: 0.2, pellets: 5, rank: 11, cost: 9000 },
    pulse_rifle: { name: 'Pulse Rifle', damage: 25, fireRate: 200, ammo: 40, maxAmmo: 200, reloadTime: 2000, spread: 0.02, rank: 16, cost: 11000 },
    china_lake: { name: 'China Lake', damage: 80, fireRate: 1000, ammo: 6, maxAmmo: 30, reloadTime: 3000, spread: 0, explosive: true, rank: 20, cost: 13000 },
    flamethrower: { name: 'Flamethrower', damage: 5, fireRate: 50, ammo: 100, maxAmmo: 500, reloadTime: 3000, spread: 0.15, flame: true, rank: 23, cost: 16000 },
    vulcan: { name: 'Vulcan', damage: 12, fireRate: 50, ammo: 200, maxAmmo: 1000, reloadTime: 4000, spread: 0.08, rank: 26, cost: 20000 }
};

// Enemy types
const ENEMY_TYPES = {
    scorpion: { hp: 30, speed: 80, damage: 10, size: 16, color: '#4a4', xp: 20 },
    scorpion_small: { hp: 15, speed: 120, damage: 5, size: 10, color: '#6b6', xp: 10 },
    scorpion_laser: { hp: 40, speed: 60, damage: 15, size: 18, color: '#4a8', ranged: true, xp: 35 },
    arachnid: { hp: 60, speed: 50, damage: 20, size: 24, color: '#484', xp: 50 },
    arachnid_small: { hp: 20, speed: 140, damage: 8, size: 12, color: '#6a6', xp: 15 },
    boss: { hp: 400, speed: 40, damage: 30, size: 48, color: '#f44', xp: 500 }
};

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.speed = 200;
        this.hp = 100;
        this.maxHp = 100;
        this.lives = 3;
        this.credits = 500;
        this.xp = 0;
        this.rank = 0;
        this.angle = 0;
        this.weapons = ['assault_rifle'];
        this.currentWeapon = 'assault_rifle';
        this.ammo = { ...WEAPONS.assault_rifle };
        this.ammo.current = WEAPONS.assault_rifle.ammo;
        this.ammo.reserve = WEAPONS.assault_rifle.maxAmmo;
        this.lastShot = 0;
        this.reloading = false;
        this.reloadStart = 0;
        this.invincible = false;
        this.invincibleTime = 0;
        this.flashlightOn = true;
    }

    update(dt) {
        // Movement
        let dx = 0, dy = 0;
        if (keys['w'] || keys['ArrowUp']) dy -= 1;
        if (keys['s'] || keys['ArrowDown']) dy += 1;
        if (keys['a'] || keys['ArrowLeft']) dx -= 1;
        if (keys['d'] || keys['ArrowRight']) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;

            const newX = this.x + dx * this.speed * dt;
            const newY = this.y + dy * this.speed * dt;

            if (!checkWallCollision(newX, this.y, this.width, this.height)) {
                this.x = newX;
            }
            if (!checkWallCollision(this.x, newY, this.width, this.height)) {
                this.y = newY;
            }
        }

        // Aim at mouse (world coordinates)
        const worldMouseX = mouse.x + camera.x;
        const worldMouseY = mouse.y + camera.y;
        this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

        // Shooting
        if (mouse.down && !this.reloading) {
            this.shoot();
        }

        // Reload
        if (keys['r'] && !this.reloading && this.ammo.current < WEAPONS[this.currentWeapon].ammo) {
            this.startReload();
        }

        if (this.reloading) {
            if (Date.now() - this.reloadStart >= WEAPONS[this.currentWeapon].reloadTime) {
                this.finishReload();
            }
        }

        // Invincibility timer
        if (this.invincible && Date.now() - this.invincibleTime > 1500) {
            this.invincible = false;
        }

        // Update camera
        camera.x = this.x - WIDTH / 2;
        camera.y = this.y - HEIGHT / 2;

        // Clamp camera
        if (level) {
            camera.x = Math.max(0, Math.min(camera.x, level.width * TILE_SIZE - WIDTH));
            camera.y = Math.max(0, Math.min(camera.y, level.height * TILE_SIZE - HEIGHT));
        }
    }

    shoot() {
        const now = Date.now();
        const weapon = WEAPONS[this.currentWeapon];

        if (now - this.lastShot < weapon.fireRate) return;
        if (this.ammo.current <= 0) {
            this.startReload();
            return;
        }

        this.lastShot = now;
        this.ammo.current--;

        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const spread = (Math.random() - 0.5) * weapon.spread;
            const angle = this.angle + spread;

            bullets.push({
                x: this.x + Math.cos(this.angle) * 20,
                y: this.y + Math.sin(this.angle) * 20,
                vx: Math.cos(angle) * 600,
                vy: Math.sin(angle) * 600,
                damage: weapon.damage,
                isPlayer: true,
                explosive: weapon.explosive,
                flame: weapon.flame,
                life: weapon.flame ? 300 : 1500
            });
        }

        // Muzzle flash particle
        for (let i = 0; i < 3; i++) {
            particles.push({
                x: this.x + Math.cos(this.angle) * 25,
                y: this.y + Math.sin(this.angle) * 25,
                vx: Math.cos(this.angle + (Math.random() - 0.5)) * 100,
                vy: Math.sin(this.angle + (Math.random() - 0.5)) * 100,
                life: 100,
                color: '#ff8'
            });
        }
    }

    startReload() {
        if (this.ammo.reserve <= 0) return;
        this.reloading = true;
        this.reloadStart = Date.now();
    }

    finishReload() {
        const weapon = WEAPONS[this.currentWeapon];
        const needed = weapon.ammo - this.ammo.current;
        const available = Math.min(needed, this.ammo.reserve);
        this.ammo.current += available;
        this.ammo.reserve -= available;
        this.reloading = false;
    }

    takeDamage(amount) {
        if (this.invincible) return;

        this.hp -= amount;
        this.invincible = true;
        this.invincibleTime = Date.now();

        // Blood particles
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 500,
                color: '#f00'
            });
        }

        if (this.hp <= 0) {
            this.lives--;
            if (this.lives > 0) {
                this.hp = this.maxHp;
                this.invincible = true;
                this.invincibleTime = Date.now();
            } else {
                gameState = 'gameover';
            }
        }
    }

    addXP(amount) {
        this.xp += amount;
        // Simple rank up: every 1000 XP
        const newRank = Math.floor(this.xp / 1000);
        if (newRank > this.rank) {
            this.rank = newRank;
            showFloatingText(this.x, this.y - 30, `RANK UP! ${this.rank}`, '#ff0');
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);

        // Body
        const alpha = this.invincible ? 0.5 + Math.sin(Date.now() * 0.02) * 0.3 : 1;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#4af';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Gun
        ctx.fillStyle = '#666';
        ctx.fillRect(this.width / 2 - 5, -4, 20, 8);

        // Flashlight cone
        if (this.flashlightOn) {
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = '#ffa';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 300, -0.4, 0.4);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        const data = ENEMY_TYPES[type];
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.speed = data.speed;
        this.damage = data.damage;
        this.size = data.size;
        this.color = data.color;
        this.xp = data.xp;
        this.ranged = data.ranged || false;
        this.lastShot = 0;
        this.stunned = 0;
    }

    update(dt) {
        if (this.stunned > 0) {
            this.stunned -= dt * 1000;
            return;
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (this.ranged && dist < 400 && dist > 150) {
            // Ranged enemy - shoot
            if (Date.now() - this.lastShot > 2000) {
                this.lastShot = Date.now();
                const angle = Math.atan2(dy, dx);
                bullets.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * 300,
                    vy: Math.sin(angle) * 300,
                    damage: this.damage,
                    isPlayer: false,
                    life: 2000,
                    color: '#0f0'
                });
            }
        }

        // Move toward player
        if (dist > 30) {
            const speed = this.speed * dt;
            const newX = this.x + (dx / dist) * speed;
            const newY = this.y + (dy / dist) * speed;

            if (!checkWallCollision(newX, this.y, this.size, this.size)) {
                this.x = newX;
            }
            if (!checkWallCollision(this.x, newY, this.size, this.size)) {
                this.y = newY;
            }
        }

        // Damage player on contact
        if (dist < this.size + player.width / 2) {
            player.takeDamage(this.damage);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.stunned = 100;

        // Green blood particles
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 400,
                color: '#0f0'
            });
        }

        if (this.hp <= 0) {
            return true;
        }
        return false;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Only draw if visible (in flashlight or close)
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angleToEnemy = Math.atan2(dy, dx);
        const angleDiff = Math.abs(normalizeAngle(angleToEnemy - player.angle));

        let visible = dist < 100; // Always visible if very close
        if (!visible && player.flashlightOn && dist < 350 && angleDiff < 0.6) {
            visible = true;
        }

        if (!visible) {
            // Draw as dim red eyes
            ctx.fillStyle = '#f00';
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(screenX - 4, screenY - 2, 2, 0, Math.PI * 2);
            ctx.arc(screenX + 4, screenY - 2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            return;
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#f00';
        const eyeAngle = Math.atan2(player.y - this.y, player.x - this.x);
        ctx.beginPath();
        ctx.arc(screenX + Math.cos(eyeAngle - 0.3) * this.size * 0.5, screenY + Math.sin(eyeAngle - 0.3) * this.size * 0.5, 3, 0, Math.PI * 2);
        ctx.arc(screenX + Math.cos(eyeAngle + 0.3) * this.size * 0.5, screenY + Math.sin(eyeAngle + 0.3) * this.size * 0.5, 3, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        if (this.hp < this.maxHp) {
            ctx.fillStyle = '#300';
            ctx.fillRect(screenX - 20, screenY - this.size - 10, 40, 5);
            ctx.fillStyle = '#f00';
            ctx.fillRect(screenX - 20, screenY - this.size - 10, 40 * (this.hp / this.maxHp), 5);
        }
    }
}

// Level generation
function generateLevel(levelNum) {
    const width = 25 + levelNum * 5;
    const height = 20 + levelNum * 4;

    level = {
        width,
        height,
        tiles: []
    };

    // Initialize with walls
    for (let y = 0; y < height; y++) {
        level.tiles[y] = [];
        for (let x = 0; x < width; x++) {
            level.tiles[y][x] = 1; // Wall
        }
    }

    // Generate rooms using BSP
    const rooms = [];
    const minRoomSize = 4;
    const maxRoomSize = 8;

    function carveRoom(x, y, w, h) {
        for (let ry = y; ry < y + h && ry < height - 1; ry++) {
            for (let rx = x; rx < x + w && rx < width - 1; rx++) {
                if (rx > 0 && ry > 0) {
                    level.tiles[ry][rx] = 0;
                }
            }
        }
        rooms.push({ x: x + w / 2, y: y + h / 2, w, h });
    }

    // Create rooms
    const numRooms = 5 + levelNum * 2;
    for (let i = 0; i < numRooms; i++) {
        const roomW = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize));
        const roomH = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize));
        const roomX = 1 + Math.floor(Math.random() * (width - roomW - 2));
        const roomY = 1 + Math.floor(Math.random() * (height - roomH - 2));
        carveRoom(roomX, roomY, roomW, roomH);
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
        const r1 = rooms[i - 1];
        const r2 = rooms[i];
        let x = Math.floor(r1.x);
        let y = Math.floor(r1.y);
        const x2 = Math.floor(r2.x);
        const y2 = Math.floor(r2.y);

        while (x !== x2) {
            if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
                level.tiles[y][x] = 0;
                if (y > 1) level.tiles[y - 1][x] = 0;
                if (y < height - 2) level.tiles[y + 1][x] = 0;
            }
            x += x < x2 ? 1 : -1;
        }
        while (y !== y2) {
            if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
                level.tiles[y][x] = 0;
                if (x > 1) level.tiles[y][x - 1] = 0;
                if (x < width - 2) level.tiles[y][x + 1] = 0;
            }
            y += y < y2 ? 1 : -1;
        }
    }

    // Clear arrays
    enemies = [];
    pickups = [];
    terminals = [];
    doors = [];
    bullets = [];
    particles = [];

    // Place player in first room
    const startRoom = rooms[0];
    player = new Player(startRoom.x * TILE_SIZE, startRoom.y * TILE_SIZE);

    // Place exit in last room
    const exitRoom = rooms[rooms.length - 1];
    doors.push({
        x: exitRoom.x * TILE_SIZE,
        y: exitRoom.y * TILE_SIZE,
        type: 'exit',
        locked: true
    });

    // Place terminal
    if (rooms.length > 2) {
        const termRoom = rooms[Math.floor(rooms.length / 2)];
        terminals.push({
            x: termRoom.x * TILE_SIZE,
            y: termRoom.y * TILE_SIZE
        });
    }

    // Spawn enemies
    const enemyTypes = ['scorpion', 'scorpion_small'];
    if (levelNum >= 2) enemyTypes.push('scorpion_laser');
    if (levelNum >= 3) enemyTypes.push('arachnid');
    if (levelNum >= 4) enemyTypes.push('arachnid_small');

    const numEnemies = 3 + levelNum * 3;
    for (let i = 0; i < numEnemies; i++) {
        const room = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const ex = (room.x + (Math.random() - 0.5) * room.w) * TILE_SIZE;
        const ey = (room.y + (Math.random() - 0.5) * room.h) * TILE_SIZE;
        enemies.push(new Enemy(ex, ey, type));
    }

    // Spawn enemies in corridors too
    for (let i = 1; i < rooms.length; i++) {
        if (Math.random() < 0.5) {
            const r1 = rooms[i - 1];
            const r2 = rooms[i];
            const midX = ((r1.x + r2.x) / 2) * TILE_SIZE;
            const midY = ((r1.y + r2.y) / 2) * TILE_SIZE;
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            enemies.push(new Enemy(midX, midY, type));
        }
    }

    // Place pickups
    for (let i = 0; i < 5 + levelNum; i++) {
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        pickups.push({
            x: (room.x + (Math.random() - 0.5) * room.w * 0.8) * TILE_SIZE,
            y: (room.y + (Math.random() - 0.5) * room.h * 0.8) * TILE_SIZE,
            type: Math.random() < 0.4 ? 'health' : (Math.random() < 0.5 ? 'ammo' : 'credits')
        });
    }

    // Boss on level 4, 7, 10
    if (levelNum === 4 || levelNum === 7 || levelNum === 10) {
        const bossRoom = rooms[rooms.length - 2];
        enemies.push(new Enemy(bossRoom.x * TILE_SIZE, bossRoom.y * TILE_SIZE, 'boss'));
    }
}

// Collision detection
function checkWallCollision(x, y, w, h) {
    const left = Math.floor((x - w / 2) / TILE_SIZE);
    const right = Math.floor((x + w / 2) / TILE_SIZE);
    const top = Math.floor((y - h / 2) / TILE_SIZE);
    const bottom = Math.floor((y + h / 2) / TILE_SIZE);

    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            if (ty < 0 || ty >= level.height || tx < 0 || tx >= level.width) return true;
            if (level.tiles[ty][tx] === 1) return true;
        }
    }
    return false;
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

// Floating text
function showFloatingText(x, y, text, color) {
    const container = document.getElementById('floatingTexts');
    const elem = document.createElement('div');
    elem.className = 'floating-text';
    elem.style.left = (x - camera.x) + 'px';
    elem.style.top = (y - camera.y) + 'px';
    elem.style.color = color;
    elem.textContent = text;
    container.appendChild(elem);
    setTimeout(() => elem.remove(), 800);
}

// Update
function update(dt) {
    if (gameState !== 'playing') return;

    player.update(dt);

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update(dt);
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt * 1000;

        // Check wall collision
        const tileX = Math.floor(b.x / TILE_SIZE);
        const tileY = Math.floor(b.y / TILE_SIZE);
        if (tileX < 0 || tileX >= level.width || tileY < 0 || tileY >= level.height ||
            level.tiles[tileY][tileX] === 1 || b.life <= 0) {

            if (b.explosive) {
                // Explosion
                for (let j = 0; j < 20; j++) {
                    particles.push({
                        x: b.x,
                        y: b.y,
                        vx: (Math.random() - 0.5) * 300,
                        vy: (Math.random() - 0.5) * 300,
                        life: 500,
                        color: Math.random() < 0.5 ? '#f80' : '#ff0'
                    });
                }
                // Damage nearby enemies
                for (const e of enemies) {
                    const dist = Math.sqrt((e.x - b.x) ** 2 + (e.y - b.y) ** 2);
                    if (dist < 80) {
                        if (e.takeDamage(b.damage * (1 - dist / 80))) {
                            player.addXP(e.xp);
                            player.credits += 10;
                            enemies.splice(enemies.indexOf(e), 1);
                        }
                    }
                }
            }

            bullets.splice(i, 1);
            continue;
        }

        // Check enemy collision (player bullets)
        if (b.isPlayer) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                const dist = Math.sqrt((e.x - b.x) ** 2 + (e.y - b.y) ** 2);
                if (dist < e.size) {
                    if (e.takeDamage(b.damage)) {
                        player.addXP(e.xp);
                        player.credits += Math.floor(e.xp / 2);
                        showFloatingText(e.x, e.y, `+${e.xp} XP`, '#ff0');
                        enemies.splice(j, 1);
                    }
                    if (!b.flame) {
                        bullets.splice(i, 1);
                    }
                    break;
                }
            }
        } else {
            // Enemy bullets hit player
            const dist = Math.sqrt((player.x - b.x) ** 2 + (player.y - b.y) ** 2);
            if (dist < player.width / 2 + 5) {
                player.takeDamage(b.damage);
                bullets.splice(i, 1);
            }
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 1000;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Check pickup collection
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dist = Math.sqrt((player.x - p.x) ** 2 + (player.y - p.y) ** 2);
        if (dist < 30) {
            if (p.type === 'health') {
                player.hp = Math.min(player.maxHp, player.hp + 30);
                showFloatingText(p.x, p.y, '+30 HP', '#0f0');
            } else if (p.type === 'ammo') {
                player.ammo.reserve += 50;
                showFloatingText(p.x, p.y, '+50 AMMO', '#ff0');
            } else if (p.type === 'credits') {
                const amt = 50 + Math.floor(Math.random() * 100);
                player.credits += amt;
                showFloatingText(p.x, p.y, `+${amt}`, '#0ff');
            }
            pickups.splice(i, 1);
        }
    }

    // Check terminal interaction
    if (keys[' ']) {
        for (const t of terminals) {
            const dist = Math.sqrt((player.x - t.x) ** 2 + (player.y - t.y) ** 2);
            if (dist < 40) {
                // Simple: refill ammo for credits
                if (player.credits >= 100) {
                    player.credits -= 100;
                    player.ammo.reserve += 100;
                    showFloatingText(t.x, t.y, 'AMMO PURCHASED', '#0ff');
                }
            }
        }
        keys[' '] = false;
    }

    // Check exit
    if (enemies.length === 0) {
        for (const d of doors) {
            if (d.type === 'exit') {
                d.locked = false;
                const dist = Math.sqrt((player.x - d.x) ** 2 + (player.y - d.y) ** 2);
                if (dist < 40) {
                    if (currentLevel >= 10) {
                        gameState = 'victory';
                    } else {
                        currentLevel++;
                        generateLevel(currentLevel);
                    }
                }
            }
        }
    }
}

// Draw
function draw() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (!level) return;

    // Draw level
    for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
            const screenX = x * TILE_SIZE - camera.x;
            const screenY = y * TILE_SIZE - camera.y;

            if (screenX < -TILE_SIZE || screenX > WIDTH || screenY < -TILE_SIZE || screenY > HEIGHT) continue;

            if (level.tiles[y][x] === 1) {
                ctx.fillStyle = '#333';
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#444';
                ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Draw pickups
    for (const p of pickups) {
        const screenX = p.x - camera.x;
        const screenY = p.y - camera.y;
        if (screenX < -20 || screenX > WIDTH + 20 || screenY < -20 || screenY > HEIGHT + 20) continue;

        ctx.fillStyle = p.type === 'health' ? '#0f0' : (p.type === 'ammo' ? '#ff0' : '#0ff');
        ctx.beginPath();
        ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw terminals
    for (const t of terminals) {
        const screenX = t.x - camera.x;
        const screenY = t.y - camera.y;
        ctx.fillStyle = '#08f';
        ctx.fillRect(screenX - 15, screenY - 20, 30, 25);
        ctx.fillStyle = '#0af';
        ctx.fillRect(screenX - 12, screenY - 17, 24, 15);
    }

    // Draw doors
    for (const d of doors) {
        const screenX = d.x - camera.x;
        const screenY = d.y - camera.y;
        ctx.fillStyle = d.locked ? '#800' : '#080';
        ctx.fillRect(screenX - 20, screenY - 20, 40, 40);
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(d.locked ? 'LOCKED' : 'EXIT', screenX, screenY + 4);
    }

    // Draw enemies
    for (const e of enemies) {
        e.draw();
    }

    // Draw player
    if (player) {
        player.draw();
    }

    // Draw bullets
    for (const b of bullets) {
        const screenX = b.x - camera.x;
        const screenY = b.y - camera.y;
        ctx.fillStyle = b.isPlayer ? (b.flame ? '#f80' : '#ff0') : (b.color || '#0f0');
        ctx.beginPath();
        ctx.arc(screenX, screenY, b.flame ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw particles
    for (const p of particles) {
        const screenX = p.x - camera.x;
        const screenY = p.y - camera.y;
        ctx.globalAlpha = p.life / 500;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw HUD
    drawHUD();

    // Draw menu/gameover screens
    if (gameState === 'menu') {
        drawMenu();
    } else if (gameState === 'gameover') {
        drawGameOver();
    } else if (gameState === 'victory') {
        drawVictory();
    }
}

function drawHUD() {
    if (!player) return;

    // Health bar
    ctx.fillStyle = '#300';
    ctx.fillRect(20, HEIGHT - 40, 200, 20);
    ctx.fillStyle = '#f00';
    ctx.fillRect(20, HEIGHT - 40, 200 * (player.hp / player.maxHp), 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(20, HEIGHT - 40, 200, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, 120, HEIGHT - 25);

    // XP/Rank
    ctx.textAlign = 'left';
    ctx.fillText(`RANK: ${player.rank} | XP: ${player.xp}`, 20, 25);

    // Lives
    ctx.fillText(`LIVES: ${player.lives}`, 20, 45);

    // Credits
    ctx.fillText(`CREDITS: ${player.credits}`, 20, 65);

    // Ammo
    ctx.textAlign = 'right';
    const weapon = WEAPONS[player.currentWeapon];
    ctx.fillText(`${weapon.name}`, WIDTH - 20, HEIGHT - 45);
    ctx.fillText(`${player.ammo.current} / ${player.ammo.reserve}`, WIDTH - 20, HEIGHT - 25);

    if (player.reloading) {
        const progress = (Date.now() - player.reloadStart) / weapon.reloadTime;
        ctx.fillStyle = '#ff0';
        ctx.fillText(`RELOADING... ${Math.floor(progress * 100)}%`, WIDTH - 20, HEIGHT - 65);
    }

    // Level
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0ff';
    ctx.fillText(`LEVEL ${currentLevel}`, WIDTH / 2, 25);

    // Enemies remaining
    ctx.fillText(`ENEMIES: ${enemies.length}`, WIDTH / 2, 45);
}

function drawMenu() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#0ff';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LOST OUTPOST', WIDTH / 2, HEIGHT / 2 - 60);

    ctx.font = '20px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('WASD - Move    Mouse - Aim    Click - Shoot', WIDTH / 2, HEIGHT / 2);
    ctx.fillText('R - Reload    Space - Interact', WIDTH / 2, HEIGHT / 2 + 30);

    ctx.fillStyle = '#ff0';
    ctx.fillText('Click to Start', WIDTH / 2, HEIGHT / 2 + 80);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#f00';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 30);

    ctx.font = '20px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Level: ${currentLevel} | Rank: ${player ? player.rank : 0}`, WIDTH / 2, HEIGHT / 2 + 20);

    ctx.fillStyle = '#ff0';
    ctx.fillText('Click to Restart', WIDTH / 2, HEIGHT / 2 + 60);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#0f0';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', WIDTH / 2, HEIGHT / 2 - 30);

    ctx.font = '20px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Final Rank: ${player ? player.rank : 0} | Credits: ${player ? player.credits : 0}`, WIDTH / 2, HEIGHT / 2 + 20);

    ctx.fillStyle = '#ff0';
    ctx.fillText('Click to Play Again', WIDTH / 2, HEIGHT / 2 + 60);
}

// Game loop
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    if (!gamePaused) {
        update(dt);
    }
    draw();

    requestAnimationFrame(gameLoop);
}

// Input handlers
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        mouse.down = true;

        if (gameState === 'menu') {
            startGame();
        } else if (gameState === 'gameover' || gameState === 'victory') {
            currentLevel = 1;
            startGame();
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
});

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.key] = false;
});

// Start game
function startGame() {
    gameState = 'playing';
    generateLevel(currentLevel);
    gamePaused = false;
}

// Initialize
lastTime = performance.now();
requestAnimationFrame(gameLoop);

// Harness interface
window.harness = {
    pause: () => { gamePaused = true; },
    resume: () => { gamePaused = false; },
    isPaused: () => gamePaused,

    execute: async (action, durationMs) => {
        return new Promise((resolve) => {
            // Set keys
            if (action.keys) {
                for (const k of action.keys) {
                    const key = k.toLowerCase();
                    keys[key] = true;
                    keys[k] = true;
                }
            }

            // Set mouse
            if (action.mouse) {
                mouse.x = action.mouse.x || mouse.x;
                mouse.y = action.mouse.y || mouse.y;
                mouse.down = action.mouse.down !== undefined ? action.mouse.down : mouse.down;
            }

            // Resume game
            gamePaused = false;

            setTimeout(() => {
                // Release keys
                if (action.keys) {
                    for (const k of action.keys) {
                        const key = k.toLowerCase();
                        keys[key] = false;
                        keys[k] = false;
                    }
                }
                if (action.mouse) {
                    mouse.down = false;
                }

                // Pause game
                gamePaused = true;
                resolve();
            }, durationMs);
        });
    },

    getState: () => ({
        gameState,
        level: currentLevel,
        player: player ? {
            x: player.x,
            y: player.y,
            hp: player.hp,
            maxHp: player.maxHp,
            lives: player.lives,
            credits: player.credits,
            xp: player.xp,
            rank: player.rank,
            ammo: player.ammo.current,
            ammoReserve: player.ammo.reserve,
            weapon: player.currentWeapon
        } : null,
        enemies: enemies.map(e => ({
            x: e.x,
            y: e.y,
            type: e.type,
            hp: e.hp
        })),
        pickups: pickups.length,
        bullets: bullets.length,
        camera: { ...camera }
    }),

    getPhase: () => {
        if (gameState === 'menu') return 'menu';
        if (gameState === 'gameover') return 'gameover';
        if (gameState === 'victory') return 'victory';
        return 'playing';
    },

    debug: {
        setHealth: (hp) => { if (player) player.hp = hp; },
        setLives: (lives) => { if (player) player.lives = lives; },
        addCredits: (amt) => { if (player) player.credits += amt; },
        addXP: (amt) => { if (player) player.addXP(amt); },
        clearEnemies: () => { enemies = []; },
        spawnEnemy: (type) => {
            if (player) {
                const angle = Math.random() * Math.PI * 2;
                enemies.push(new Enemy(
                    player.x + Math.cos(angle) * 200,
                    player.y + Math.sin(angle) * 200,
                    type || 'scorpion'
                ));
            }
        },
        forceStart: () => {
            currentLevel = 1;
            gameState = 'playing';
            generateLevel(currentLevel);
            gamePaused = true;
        },
        nextLevel: () => {
            if (currentLevel < 10) {
                currentLevel++;
                generateLevel(currentLevel);
            }
        }
    }
};
