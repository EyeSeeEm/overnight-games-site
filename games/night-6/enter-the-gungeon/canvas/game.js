// Enter the Gungeon Clone - Bullet-hell Roguelike
// Canvas Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = 800;
const HEIGHT = 600;
const TILE_SIZE = 16; // Smaller tiles per feedback

// Game state
let gameState = 'menu';
let gamePaused = new URLSearchParams(location.search).has('test');
let lastTime = 0;

// Player
let player = null;
let bullets = [];
let enemyBullets = [];
let enemies = [];
let pickups = [];
let particles = [];
let objects = []; // Cover objects
let chests = [];

// Floor/Room system
let currentFloor = 1;
let currentRoom = null;
let rooms = [];
let roomMap = [];
let camera = { x: 0, y: 0 };

// Input
let keys = {};
let mouse = { x: WIDTH / 2, y: HEIGHT / 2, down: false };

// Weapons
const WEAPONS = {
    starter_pistol: { name: 'Starter Pistol', damage: 5, fireRate: 300, ammo: Infinity, magazineSize: Infinity, reloadTime: 0, spread: 0.05, speed: 500, quality: 'D' },
    m1911: { name: 'M1911', damage: 8, fireRate: 200, ammo: 100, magazineSize: 10, reloadTime: 1200, spread: 0.03, speed: 550, quality: 'C' },
    shotgun: { name: 'Shotgun', damage: 4, fireRate: 600, ammo: 64, magazineSize: 8, reloadTime: 2000, spread: 0.25, pellets: 6, speed: 400, quality: 'C' },
    machinegun: { name: 'Machine Gun', damage: 4, fireRate: 80, ammo: 300, magazineSize: 30, reloadTime: 1500, spread: 0.1, speed: 500, quality: 'B' },
    laser_rifle: { name: 'Laser Rifle', damage: 12, fireRate: 150, ammo: 150, magazineSize: 20, reloadTime: 1800, spread: 0.01, speed: 800, quality: 'B' }
};

// Enemy types with bullet patterns
const ENEMY_TYPES = {
    bullet_kin: { hp: 15, speed: 60, damage: 1, size: 12, color: '#c90', pattern: 'single', fireRate: 1500 },
    bandana_kin: { hp: 15, speed: 70, damage: 1, size: 12, color: '#c55', pattern: 'spread3', fireRate: 2000 },
    shotgun_kin: { hp: 25, speed: 50, damage: 1, size: 14, color: '#55c', pattern: 'spread6', fireRate: 2500 },
    veteran_kin: { hp: 20, speed: 80, damage: 1, size: 12, color: '#c50', pattern: 'single', fireRate: 1000 },
    cardinal: { hp: 15, speed: 40, damage: 1, size: 14, color: '#f55', pattern: 'cardinal', fireRate: 1800 }
};

// Boss definitions
const BOSSES = {
    bullet_king: {
        name: 'Bullet King',
        hp: 600,
        size: 40,
        color: '#fc0',
        patterns: ['throne_spin', 'spread_volley', 'bullet_ring'],
        phaseThresholds: [1.0, 0.6, 0.3]
    }
};

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.speed = 200;
        this.hp = 6;
        this.maxHp = 6;
        this.armor = 0;
        this.blanks = 2;
        this.keys = 1;
        this.shells = 0;
        this.angle = 0;

        this.weapons = [{ ...WEAPONS.starter_pistol, currentAmmo: Infinity, reserveAmmo: Infinity }];
        this.currentWeaponIndex = 0;
        this.lastShot = 0;
        this.reloading = false;
        this.reloadStart = 0;

        this.rolling = false;
        this.rollStart = 0;
        this.rollDir = { x: 0, y: 0 };
        this.invincible = false;
        this.invincibleTime = 0;
    }

    get currentWeapon() {
        return this.weapons[this.currentWeaponIndex];
    }

    update(dt) {
        // Handle dodge roll
        if (this.rolling) {
            const rollProgress = (Date.now() - this.rollStart) / 700;
            if (rollProgress >= 1) {
                this.rolling = false;
            } else {
                // I-frames for first half of roll
                this.invincible = rollProgress < 0.5;
                // Move during roll
                const rollSpeed = 400;
                const newX = this.x + this.rollDir.x * rollSpeed * dt;
                const newY = this.y + this.rollDir.y * rollSpeed * dt;
                if (!checkCollision(newX, this.y, this.width, this.height)) this.x = newX;
                if (!checkCollision(this.x, newY, this.width, this.height)) this.y = newY;
            }
        } else {
            // Normal movement
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
                if (!checkCollision(newX, this.y, this.width, this.height)) this.x = newX;
                if (!checkCollision(this.x, newY, this.width, this.height)) this.y = newY;
            }
        }

        // Aim at mouse
        const worldMouseX = mouse.x + camera.x;
        const worldMouseY = mouse.y + camera.y;
        this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

        // Shooting
        if (mouse.down && !this.reloading && !this.rolling) {
            this.shoot();
        }

        // Reload
        if (keys['r'] && !this.reloading && this.currentWeapon.currentAmmo < this.currentWeapon.magazineSize) {
            this.startReload();
        }

        if (this.reloading) {
            if (Date.now() - this.reloadStart >= this.currentWeapon.reloadTime) {
                this.finishReload();
            }
        }

        // Invincibility timer (from damage)
        if (this.invincible && !this.rolling && Date.now() - this.invincibleTime > 1000) {
            this.invincible = false;
        }

        // Clamp to room bounds
        if (currentRoom) {
            const roomLeft = currentRoom.x * TILE_SIZE;
            const roomTop = currentRoom.y * TILE_SIZE;
            const roomRight = (currentRoom.x + currentRoom.width) * TILE_SIZE;
            const roomBottom = (currentRoom.y + currentRoom.height) * TILE_SIZE;
            this.x = Math.max(roomLeft + this.width, Math.min(this.x, roomRight - this.width));
            this.y = Math.max(roomTop + this.height, Math.min(this.y, roomBottom - this.height));
        }

        // Update camera
        camera.x = this.x - WIDTH / 2;
        camera.y = this.y - HEIGHT / 2;
    }

    shoot() {
        const now = Date.now();
        const weapon = this.currentWeapon;

        if (now - this.lastShot < weapon.fireRate) return;
        if (weapon.currentAmmo <= 0) {
            this.startReload();
            return;
        }

        this.lastShot = now;
        if (weapon.currentAmmo !== Infinity) weapon.currentAmmo--;

        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const spread = (Math.random() - 0.5) * weapon.spread * 2;
            const angle = this.angle + spread;

            bullets.push({
                x: this.x + Math.cos(this.angle) * 15,
                y: this.y + Math.sin(this.angle) * 15,
                vx: Math.cos(angle) * weapon.speed,
                vy: Math.sin(angle) * weapon.speed,
                damage: weapon.damage,
                life: 2000
            });
        }

        // Muzzle flash
        for (let i = 0; i < 3; i++) {
            particles.push({
                x: this.x + Math.cos(this.angle) * 18,
                y: this.y + Math.sin(this.angle) * 18,
                vx: Math.cos(this.angle + (Math.random() - 0.5) * 0.5) * 80,
                vy: Math.sin(this.angle + (Math.random() - 0.5) * 0.5) * 80,
                life: 80,
                color: '#ff8'
            });
        }
    }

    startReload() {
        if (this.currentWeapon.reserveAmmo <= 0 || this.currentWeapon.magazineSize === Infinity) return;
        this.reloading = true;
        this.reloadStart = Date.now();
    }

    finishReload() {
        const weapon = this.currentWeapon;
        const needed = weapon.magazineSize - weapon.currentAmmo;
        const available = Math.min(needed, weapon.reserveAmmo);
        weapon.currentAmmo += available;
        if (weapon.reserveAmmo !== Infinity) weapon.reserveAmmo -= available;
        this.reloading = false;
    }

    dodgeRoll() {
        if (this.rolling) return;

        let dx = 0, dy = 0;
        if (keys['w'] || keys['ArrowUp']) dy -= 1;
        if (keys['s'] || keys['ArrowDown']) dy += 1;
        if (keys['a'] || keys['ArrowLeft']) dx -= 1;
        if (keys['d'] || keys['ArrowRight']) dx += 1;

        // Roll toward movement direction, or aim direction if not moving
        if (dx === 0 && dy === 0) {
            dx = Math.cos(this.angle);
            dy = Math.sin(this.angle);
        }

        const len = Math.sqrt(dx * dx + dy * dy);
        this.rollDir = { x: dx / len, y: dy / len };
        this.rolling = true;
        this.rollStart = Date.now();
        this.invincible = true;
    }

    useBlank() {
        if (this.blanks <= 0) return;
        this.blanks--;

        // Clear all enemy bullets
        enemyBullets = [];

        // Knockback enemies
        for (const e of enemies) {
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                e.stunned = 500;
                e.x += (dx / dist) * 50;
                e.y += (dy / dist) * 50;
            }
        }

        // Visual effect
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 300,
                vy: Math.sin(angle) * 300,
                life: 300,
                color: '#aaf'
            });
        }

        // Brief invincibility
        this.invincible = true;
        this.invincibleTime = Date.now();
    }

    takeDamage(amount) {
        if (this.invincible) return;

        // Armor absorbs first
        if (this.armor > 0) {
            this.armor--;
            this.invincible = true;
            this.invincibleTime = Date.now();
            return;
        }

        this.hp -= amount;
        this.invincible = true;
        this.invincibleTime = Date.now();

        // Blood particles
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 400,
                color: '#f00'
            });
        }

        if (this.hp <= 0) {
            gameState = 'gameover';
        }
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);

        // Draw body (rolling effect)
        if (this.rolling) {
            const rollProgress = (Date.now() - this.rollStart) / 700;
            ctx.rotate(rollProgress * Math.PI * 4);
            ctx.globalAlpha = 0.7;
        } else {
            ctx.rotate(this.angle);
        }

        // Body - bullet-themed player
        const alpha = this.invincible && !this.rolling ? 0.5 + Math.sin(Date.now() * 0.02) * 0.3 : 1;
        ctx.globalAlpha = alpha;

        ctx.fillStyle = '#e8b04b'; // Brass color
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2 - 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gun
        ctx.fillStyle = '#444';
        ctx.fillRect(5, -3, 15, 6);

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
        this.pattern = data.pattern;
        this.fireRate = data.fireRate;
        this.lastShot = 0;
        this.stunned = 0;
        this.strafeDir = Math.random() < 0.5 ? 1 : -1;
        this.strafeTimer = 0;
    }

    update(dt) {
        if (this.stunned > 0) {
            this.stunned -= dt * 1000;
            return;
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Move behavior
        if (dist > 120) {
            // Move toward player
            const newX = this.x + (dx / dist) * this.speed * dt;
            const newY = this.y + (dy / dist) * this.speed * dt;
            if (!checkCollision(newX, this.y, this.size, this.size)) this.x = newX;
            if (!checkCollision(this.x, newY, this.size, this.size)) this.y = newY;
        } else if (dist > 60) {
            // Strafe
            this.strafeTimer += dt;
            if (this.strafeTimer > 1.5) {
                this.strafeTimer = 0;
                this.strafeDir *= -1;
            }
            const perpX = -dy / dist * this.strafeDir;
            const perpY = dx / dist * this.strafeDir;
            const newX = this.x + perpX * this.speed * dt;
            const newY = this.y + perpY * this.speed * dt;
            if (!checkCollision(newX, this.y, this.size, this.size)) this.x = newX;
            if (!checkCollision(this.x, newY, this.size, this.size)) this.y = newY;
        }

        // Shooting
        if (Date.now() - this.lastShot > this.fireRate && dist < 300) {
            this.lastShot = Date.now();
            this.firePattern(angle);
        }
    }

    firePattern(angle) {
        switch (this.pattern) {
            case 'single':
                this.spawnBullet(angle);
                break;
            case 'spread3':
                this.spawnBullet(angle - 0.2);
                this.spawnBullet(angle);
                this.spawnBullet(angle + 0.2);
                break;
            case 'spread6':
                for (let i = -2.5; i <= 2.5; i++) {
                    this.spawnBullet(angle + i * 0.15);
                }
                break;
            case 'cardinal':
                for (let i = 0; i < 4; i++) {
                    this.spawnBullet(i * Math.PI / 2);
                }
                break;
        }
    }

    spawnBullet(angle) {
        enemyBullets.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * 150,
            vy: Math.sin(angle) * 150,
            damage: this.damage,
            life: 3000,
            size: 5
        });
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.stunned = 50;

        for (let i = 0; i < 4; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 300,
                color: '#fc0'
            });
        }

        return this.hp <= 0;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Bullet-shaped body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(screenX, screenY, this.size, this.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Primer cap (top)
        ctx.fillStyle = '#c66';
        ctx.beginPath();
        ctx.arc(screenX, screenY - this.size * 0.4, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Angry eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(screenX - 3, screenY - 2, 2, 0, Math.PI * 2);
        ctx.arc(screenX + 3, screenY - 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        if (this.hp < this.maxHp) {
            ctx.fillStyle = '#300';
            ctx.fillRect(screenX - 15, screenY - this.size - 8, 30, 4);
            ctx.fillStyle = '#f00';
            ctx.fillRect(screenX - 15, screenY - this.size - 8, 30 * (this.hp / this.maxHp), 4);
        }
    }
}

// Boss class
class Boss {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        const data = BOSSES[type];
        this.name = data.name;
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.size = data.size;
        this.color = data.color;
        this.patterns = data.patterns;
        this.phase = 0;
        this.attackTimer = 0;
        this.currentPattern = 0;
        this.patternAngle = 0;
        this.stunned = 0;
    }

    update(dt) {
        if (this.stunned > 0) {
            this.stunned -= dt * 1000;
            return;
        }

        // Update phase based on HP
        const hpPercent = this.hp / this.maxHp;
        if (hpPercent <= 0.3) this.phase = 2;
        else if (hpPercent <= 0.6) this.phase = 1;

        this.attackTimer += dt;

        // Execute attack patterns
        if (this.attackTimer > 0.8) {
            this.attackTimer = 0;
            this.executePattern();
        }

        // Slowly move around
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 150) {
            this.x += (dx / dist) * 30 * dt;
            this.y += (dy / dist) * 30 * dt;
        }
    }

    executePattern() {
        const pattern = this.patterns[this.currentPattern % this.patterns.length];
        this.currentPattern++;

        switch (pattern) {
            case 'throne_spin':
                this.patternAngle += 0.3;
                for (let i = 0; i < 12; i++) {
                    const angle = this.patternAngle + (i / 12) * Math.PI * 2;
                    enemyBullets.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(angle) * 120,
                        vy: Math.sin(angle) * 120,
                        damage: 1, life: 4000, size: 6
                    });
                }
                break;

            case 'spread_volley':
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                for (let i = -3; i <= 3; i++) {
                    enemyBullets.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(angle + i * 0.15) * 180,
                        vy: Math.sin(angle + i * 0.15) * 180,
                        damage: 1, life: 3000, size: 5
                    });
                }
                break;

            case 'bullet_ring':
                for (let i = 0; i < 20; i++) {
                    const angle = (i / 20) * Math.PI * 2;
                    enemyBullets.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(angle) * 100,
                        vy: Math.sin(angle) * 100,
                        damage: 1, life: 4000, size: 5
                    });
                }
                break;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.stunned = 30;

        for (let i = 0; i < 6; i++) {
            particles.push({
                x: this.x, y: this.y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 400,
                color: '#fc0'
            });
        }

        return this.hp <= 0;
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        // Large bullet body with crown
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(screenX, screenY, this.size, this.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crown
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.moveTo(screenX - 25, screenY - this.size);
        ctx.lineTo(screenX - 20, screenY - this.size - 15);
        ctx.lineTo(screenX - 10, screenY - this.size - 5);
        ctx.lineTo(screenX, screenY - this.size - 20);
        ctx.lineTo(screenX + 10, screenY - this.size - 5);
        ctx.lineTo(screenX + 20, screenY - this.size - 15);
        ctx.lineTo(screenX + 25, screenY - this.size);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(screenX - 10, screenY - 5, 5, 0, Math.PI * 2);
        ctx.arc(screenX + 10, screenY - 5, 5, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        ctx.fillStyle = '#300';
        ctx.fillRect(screenX - 50, screenY + this.size + 10, 100, 8);
        ctx.fillStyle = '#f00';
        ctx.fillRect(screenX - 50, screenY + this.size + 10, 100 * (this.hp / this.maxHp), 8);

        // Name
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, screenX, screenY + this.size + 30);
    }
}

// Floor/Room generation
function generateFloor(floorNum) {
    rooms = [];
    const numRooms = 6 + floorNum * 2;

    // Create rooms in a grid pattern
    const gridSize = 4;
    roomMap = [];
    for (let y = 0; y < gridSize; y++) {
        roomMap[y] = [];
        for (let x = 0; x < gridSize; x++) {
            roomMap[y][x] = null;
        }
    }

    // Place entrance
    const startX = 1;
    const startY = Math.floor(gridSize / 2);
    const entrance = createRoom(startX, startY, 'entrance');
    rooms.push(entrance);
    roomMap[startY][startX] = entrance;

    // Place other rooms
    let placed = 1;
    let attempts = 0;
    while (placed < numRooms && attempts < 100) {
        attempts++;
        const existingRoom = rooms[Math.floor(Math.random() * rooms.length)];
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const newGX = existingRoom.gridX + dir[0];
        const newGY = existingRoom.gridY + dir[1];

        if (newGX >= 0 && newGX < gridSize && newGY >= 0 && newGY < gridSize && !roomMap[newGY][newGX]) {
            let type = 'combat';
            if (placed === numRooms - 1) type = 'boss';
            else if (placed === Math.floor(numRooms / 2)) type = 'treasure';
            else if (placed === Math.floor(numRooms / 3)) type = 'shop';

            const room = createRoom(newGX, newGY, type);
            rooms.push(room);
            roomMap[newGY][newGX] = room;

            // Connect rooms
            existingRoom.connections.push(room);
            room.connections.push(existingRoom);
            placed++;
        }
    }

    // Set initial room
    currentRoom = entrance;
    setupRoom(entrance);
}

function createRoom(gridX, gridY, type) {
    const roomWidth = 25;
    const roomHeight = 18;

    return {
        gridX,
        gridY,
        x: gridX * (roomWidth + 5) * TILE_SIZE / TILE_SIZE,
        y: gridY * (roomHeight + 5) * TILE_SIZE / TILE_SIZE,
        width: roomWidth,
        height: roomHeight,
        type,
        cleared: type === 'entrance' || type === 'shop' || type === 'treasure',
        connections: [],
        enemies: [],
        objects: [],
        chests: []
    };
}

function setupRoom(room) {
    enemies = [];
    objects = [];
    chests = [];
    bullets = [];
    enemyBullets = [];

    // Center player in room
    player.x = (room.x + room.width / 2) * TILE_SIZE;
    player.y = (room.y + room.height / 2) * TILE_SIZE;

    if (room.type === 'combat' && !room.cleared) {
        // Spawn enemies
        const enemyTypes = Object.keys(ENEMY_TYPES);
        const numEnemies = 3 + currentFloor * 2;
        for (let i = 0; i < numEnemies; i++) {
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const ex = (room.x + 3 + Math.random() * (room.width - 6)) * TILE_SIZE;
            const ey = (room.y + 3 + Math.random() * (room.height - 6)) * TILE_SIZE;
            enemies.push(new Enemy(ex, ey, type));
        }
    } else if (room.type === 'boss' && !room.cleared) {
        // Spawn boss
        const bx = (room.x + room.width / 2) * TILE_SIZE;
        const by = (room.y + room.height / 3) * TILE_SIZE;
        enemies.push(new Boss(bx, by, 'bullet_king'));
    } else if (room.type === 'treasure' && !room.cleared) {
        // Spawn chest
        chests.push({
            x: (room.x + room.width / 2) * TILE_SIZE,
            y: (room.y + room.height / 2) * TILE_SIZE,
            quality: ['C', 'B'][Math.floor(Math.random() * 2)],
            opened: false,
            locked: true
        });
    }

    // Add cover objects
    const numObjects = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numObjects; i++) {
        const ox = (room.x + 2 + Math.random() * (room.width - 4)) * TILE_SIZE;
        const oy = (room.y + 2 + Math.random() * (room.height - 4)) * TILE_SIZE;
        objects.push({
            x: ox, y: oy,
            width: 24, height: 24,
            type: Math.random() < 0.3 ? 'barrel' : 'crate',
            hp: Math.random() < 0.3 ? 15 : 30,
            flipped: false
        });
    }

    currentRoom = room;
}

// Collision detection
function checkCollision(x, y, w, h) {
    if (!currentRoom) return false;

    // Room bounds
    const roomLeft = currentRoom.x * TILE_SIZE + TILE_SIZE;
    const roomTop = currentRoom.y * TILE_SIZE + TILE_SIZE;
    const roomRight = (currentRoom.x + currentRoom.width - 1) * TILE_SIZE;
    const roomBottom = (currentRoom.y + currentRoom.height - 1) * TILE_SIZE;

    if (x - w / 2 < roomLeft || x + w / 2 > roomRight ||
        y - h / 2 < roomTop || y + h / 2 > roomBottom) {
        return true;
    }

    // Object collision
    for (const obj of objects) {
        if (x + w / 2 > obj.x - obj.width / 2 && x - w / 2 < obj.x + obj.width / 2 &&
            y + h / 2 > obj.y - obj.height / 2 && y - h / 2 < obj.y + obj.height / 2) {
            return true;
        }
    }

    return false;
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
    setTimeout(() => elem.remove(), 600);
}

// Update
function update(dt) {
    if (gameState !== 'playing') return;

    player.update(dt);

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update(dt);
    }

    // Update player bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt * 1000;

        if (b.life <= 0) {
            bullets.splice(i, 1);
            continue;
        }

        // Check enemy collision
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dist = Math.sqrt((e.x - b.x) ** 2 + (e.y - b.y) ** 2);
            if (dist < e.size) {
                if (e.takeDamage(b.damage)) {
                    // Enemy died
                    player.shells += 5 + Math.floor(Math.random() * 5);
                    showFloatingText(e.x, e.y, `+${5}`, '#ff0');

                    // Drop pickup
                    if (Math.random() < 0.3) {
                        pickups.push({
                            x: e.x, y: e.y,
                            type: Math.random() < 0.5 ? 'shell' : 'ammo'
                        });
                    }

                    enemies.splice(j, 1);
                }
                bullets.splice(i, 1);
                break;
            }
        }

        // Check object collision
        for (let j = objects.length - 1; j >= 0; j--) {
            const obj = objects[j];
            if (b.x > obj.x - obj.width / 2 && b.x < obj.x + obj.width / 2 &&
                b.y > obj.y - obj.height / 2 && b.y < obj.y + obj.height / 2) {
                obj.hp -= b.damage;
                if (obj.hp <= 0) {
                    // Barrel explosion
                    if (obj.type === 'barrel') {
                        for (let k = 0; k < 15; k++) {
                            particles.push({
                                x: obj.x, y: obj.y,
                                vx: (Math.random() - 0.5) * 200,
                                vy: (Math.random() - 0.5) * 200,
                                life: 400,
                                color: Math.random() < 0.5 ? '#f80' : '#ff0'
                            });
                        }
                        // Damage nearby enemies
                        for (const e of enemies) {
                            const dist = Math.sqrt((e.x - obj.x) ** 2 + (e.y - obj.y) ** 2);
                            if (dist < 60) {
                                e.takeDamage(20);
                            }
                        }
                    }
                    objects.splice(j, 1);
                }
                bullets.splice(i, 1);
                break;
            }
        }
    }

    // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt * 1000;

        if (b.life <= 0) {
            enemyBullets.splice(i, 1);
            continue;
        }

        // Check player collision
        const dist = Math.sqrt((player.x - b.x) ** 2 + (player.y - b.y) ** 2);
        if (dist < player.width / 2 + b.size / 2) {
            player.takeDamage(b.damage);
            enemyBullets.splice(i, 1);
        }

        // Check object collision (cover)
        for (const obj of objects) {
            if (b.x > obj.x - obj.width / 2 && b.x < obj.x + obj.width / 2 &&
                b.y > obj.y - obj.height / 2 && b.y < obj.y + obj.height / 2) {
                enemyBullets.splice(i, 1);
                break;
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

    // Check pickups
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dist = Math.sqrt((player.x - p.x) ** 2 + (player.y - p.y) ** 2);
        if (dist < 25) {
            if (p.type === 'shell') {
                player.shells += 5;
                showFloatingText(p.x, p.y, '+5', '#ff0');
            } else if (p.type === 'ammo') {
                const weapon = player.currentWeapon;
                if (weapon.reserveAmmo !== Infinity) {
                    weapon.reserveAmmo += 20;
                }
                showFloatingText(p.x, p.y, '+AMMO', '#0ff');
            } else if (p.type === 'heart') {
                player.hp = Math.min(player.maxHp, player.hp + 2);
                showFloatingText(p.x, p.y, '+HP', '#f55');
            }
            pickups.splice(i, 1);
        }
    }

    // Check chests
    if (keys['e']) {
        for (const chest of chests) {
            if (!chest.opened) {
                const dist = Math.sqrt((player.x - chest.x) ** 2 + (player.y - chest.y) ** 2);
                if (dist < 40) {
                    if (chest.locked && player.keys > 0) {
                        player.keys--;
                        chest.locked = false;
                    }
                    if (!chest.locked) {
                        chest.opened = true;
                        // Drop weapon
                        const weapons = ['m1911', 'shotgun', 'machinegun', 'laser_rifle'];
                        const weaponKey = weapons[Math.floor(Math.random() * weapons.length)];
                        const newWeapon = { ...WEAPONS[weaponKey], currentAmmo: WEAPONS[weaponKey].magazineSize, reserveAmmo: WEAPONS[weaponKey].ammo };
                        player.weapons.push(newWeapon);
                        showFloatingText(chest.x, chest.y, newWeapon.name, '#0f0');
                    }
                }
            }
        }
        keys['e'] = false;
    }

    // Check room cleared
    if (currentRoom && !currentRoom.cleared && enemies.length === 0) {
        currentRoom.cleared = true;
        showFloatingText(player.x, player.y - 30, 'ROOM CLEARED!', '#0f0');

        // Drop rewards
        pickups.push({
            x: player.x + (Math.random() - 0.5) * 50,
            y: player.y + (Math.random() - 0.5) * 50,
            type: 'shell'
        });

        if (currentRoom.type === 'boss') {
            // Boss defeated - next floor or victory
            if (currentFloor >= 5) {
                gameState = 'victory';
            } else {
                // Drop heart and go to next floor
                pickups.push({ x: player.x, y: player.y - 30, type: 'heart' });
            }
        }
    }

    // Room transitions (check doors)
    if (currentRoom && currentRoom.cleared) {
        for (const connected of currentRoom.connections) {
            // Calculate door position based on direction
            const dx = connected.gridX - currentRoom.gridX;
            const dy = connected.gridY - currentRoom.gridY;
            let doorX, doorY;

            const roomCenterX = (currentRoom.x + currentRoom.width / 2) * TILE_SIZE;
            const roomCenterY = (currentRoom.y + currentRoom.height / 2) * TILE_SIZE;

            if (dx > 0) { // Door on right
                doorX = (currentRoom.x + currentRoom.width) * TILE_SIZE - TILE_SIZE;
                doorY = roomCenterY;
            } else if (dx < 0) { // Door on left
                doorX = currentRoom.x * TILE_SIZE + TILE_SIZE;
                doorY = roomCenterY;
            } else if (dy > 0) { // Door on bottom
                doorX = roomCenterX;
                doorY = (currentRoom.y + currentRoom.height) * TILE_SIZE - TILE_SIZE;
            } else { // Door on top
                doorX = roomCenterX;
                doorY = currentRoom.y * TILE_SIZE + TILE_SIZE;
            }

            const dist = Math.sqrt((player.x - doorX) ** 2 + (player.y - doorY) ** 2);
            if (dist < 40) {
                setupRoom(connected);
                break;
            }
        }
    }
}

// Draw
function draw() {
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (!currentRoom) return;

    // Draw room floor
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(
        currentRoom.x * TILE_SIZE - camera.x,
        currentRoom.y * TILE_SIZE - camera.y,
        currentRoom.width * TILE_SIZE,
        currentRoom.height * TILE_SIZE
    );

    // Draw room walls
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(
        currentRoom.x * TILE_SIZE - camera.x,
        currentRoom.y * TILE_SIZE - camera.y,
        currentRoom.width * TILE_SIZE,
        currentRoom.height * TILE_SIZE
    );

    // Draw floor tiles
    for (let y = 0; y < currentRoom.height; y++) {
        for (let x = 0; x < currentRoom.width; x++) {
            const tileX = (currentRoom.x + x) * TILE_SIZE - camera.x;
            const tileY = (currentRoom.y + y) * TILE_SIZE - camera.y;
            if ((x + y) % 2 === 0) {
                ctx.fillStyle = '#1e1e35';
                ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Draw doors to connected rooms
    if (currentRoom.cleared) {
        for (const connected of currentRoom.connections) {
            // Calculate door position
            const dx = connected.gridX - currentRoom.gridX;
            const dy = connected.gridY - currentRoom.gridY;
            let doorX, doorY;

            if (dx > 0) {
                doorX = (currentRoom.x + currentRoom.width) * TILE_SIZE - camera.x - 5;
                doorY = (currentRoom.y + currentRoom.height / 2) * TILE_SIZE - camera.y;
            } else if (dx < 0) {
                doorX = currentRoom.x * TILE_SIZE - camera.x + 5;
                doorY = (currentRoom.y + currentRoom.height / 2) * TILE_SIZE - camera.y;
            } else if (dy > 0) {
                doorX = (currentRoom.x + currentRoom.width / 2) * TILE_SIZE - camera.x;
                doorY = (currentRoom.y + currentRoom.height) * TILE_SIZE - camera.y - 5;
            } else {
                doorX = (currentRoom.x + currentRoom.width / 2) * TILE_SIZE - camera.x;
                doorY = currentRoom.y * TILE_SIZE - camera.y + 5;
            }

            ctx.fillStyle = connected.cleared ? '#4a4' : '#666';
            ctx.fillRect(doorX - 15, doorY - 15, 30, 30);
        }
    }

    // Draw objects
    for (const obj of objects) {
        const screenX = obj.x - camera.x;
        const screenY = obj.y - camera.y;

        if (obj.type === 'barrel') {
            ctx.fillStyle = '#844';
            ctx.beginPath();
            ctx.ellipse(screenX, screenY, obj.width / 2, obj.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#633';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            ctx.fillStyle = '#654';
            ctx.fillRect(screenX - obj.width / 2, screenY - obj.height / 2, obj.width, obj.height);
            ctx.strokeStyle = '#543';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX - obj.width / 2, screenY - obj.height / 2, obj.width, obj.height);
        }
    }

    // Draw chests
    for (const chest of chests) {
        const screenX = chest.x - camera.x;
        const screenY = chest.y - camera.y;

        const colors = { D: '#864', C: '#46a', B: '#4a4', A: '#a44', S: '#222' };
        ctx.fillStyle = chest.opened ? '#444' : colors[chest.quality];
        ctx.fillRect(screenX - 15, screenY - 10, 30, 20);

        if (chest.locked && !chest.opened) {
            ctx.fillStyle = '#fc0';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw pickups
    for (const p of pickups) {
        const screenX = p.x - camera.x;
        const screenY = p.y - camera.y;
        const colors = { shell: '#fc0', ammo: '#0cf', heart: '#f55' };
        ctx.fillStyle = colors[p.type];
        ctx.beginPath();
        ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw enemies
    for (const e of enemies) {
        e.draw();
    }

    // Draw player
    if (player) {
        player.draw();
    }

    // Draw player bullets
    for (const b of bullets) {
        const screenX = b.x - camera.x;
        const screenY = b.y - camera.y;
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw enemy bullets
    for (const b of enemyBullets) {
        const screenX = b.x - camera.x;
        const screenY = b.y - camera.y;
        ctx.fillStyle = '#f55';
        ctx.beginPath();
        ctx.arc(screenX, screenY, b.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw particles
    for (const p of particles) {
        const screenX = p.x - camera.x;
        const screenY = p.y - camera.y;
        ctx.globalAlpha = p.life / 400;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw HUD
    drawHUD();

    // Draw screens
    if (gameState === 'menu') drawMenu();
    else if (gameState === 'gameover') drawGameOver();
    else if (gameState === 'victory') drawVictory();
}

function drawHUD() {
    if (!player) return;

    // Hearts
    for (let i = 0; i < player.maxHp / 2; i++) {
        const x = 20 + i * 22;
        const y = HEIGHT - 35;

        if (i * 2 + 2 <= player.hp) {
            ctx.fillStyle = '#f44';
        } else if (i * 2 + 1 <= player.hp) {
            ctx.fillStyle = '#844';
        } else {
            ctx.fillStyle = '#333';
        }
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Blanks
    ctx.fillStyle = '#aaf';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`BLANK: ${player.blanks}`, 20, HEIGHT - 55);

    // Keys
    ctx.fillStyle = '#fc0';
    ctx.fillText(`KEY: ${player.keys}`, 100, HEIGHT - 55);

    // Shells
    ctx.fillStyle = '#fc0';
    ctx.fillText(`SHELLS: ${player.shells}`, 180, HEIGHT - 55);

    // Weapon
    const weapon = player.currentWeapon;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.fillText(weapon.name, WIDTH - 20, HEIGHT - 55);
    ctx.fillText(`${weapon.currentAmmo === Infinity ? '∞' : weapon.currentAmmo} / ${weapon.reserveAmmo === Infinity ? '∞' : weapon.reserveAmmo}`, WIDTH - 20, HEIGHT - 35);

    if (player.reloading) {
        const progress = (Date.now() - player.reloadStart) / weapon.reloadTime;
        ctx.fillStyle = '#ff0';
        ctx.fillText(`RELOADING ${Math.floor(progress * 100)}%`, WIDTH - 20, HEIGHT - 15);
    }

    // Floor
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0ff';
    ctx.fillText(`FLOOR ${currentFloor}`, WIDTH / 2, 25);

    // Room indicator
    if (currentRoom) {
        ctx.fillStyle = '#888';
        ctx.fillText(currentRoom.type.toUpperCase(), WIDTH / 2, 45);
    }

    // Minimap
    drawMinimap();
}

function drawMinimap() {
    const mapX = WIDTH - 90;
    const mapY = 20;
    const cellSize = 15;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(mapX - 5, mapY - 5, 80, 80);

    for (const room of rooms) {
        const rx = mapX + room.gridX * cellSize;
        const ry = mapY + room.gridY * cellSize;

        if (room === currentRoom) {
            ctx.fillStyle = '#0ff';
        } else if (room.cleared) {
            ctx.fillStyle = '#484';
        } else {
            ctx.fillStyle = '#444';
        }

        ctx.fillRect(rx, ry, cellSize - 2, cellSize - 2);

        // Boss indicator
        if (room.type === 'boss') {
            ctx.fillStyle = '#f00';
            ctx.beginPath();
            ctx.arc(rx + cellSize / 2 - 1, ry + cellSize / 2 - 1, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawMenu() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#fc0';
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ENTER THE GUNGEON', WIDTH / 2, HEIGHT / 2 - 80);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('WASD - Move    Mouse - Aim    Click - Shoot', WIDTH / 2, HEIGHT / 2 - 20);
    ctx.fillText('Space - Dodge Roll    Q - Blank    R - Reload    E - Interact', WIDTH / 2, HEIGHT / 2 + 10);

    ctx.fillStyle = '#ff0';
    ctx.fillText('Click to Start', WIDTH / 2, HEIGHT / 2 + 60);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#f44';
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 30);

    ctx.font = '18px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Floor ${currentFloor}`, WIDTH / 2, HEIGHT / 2 + 10);

    ctx.fillStyle = '#ff0';
    ctx.fillText('Click to Restart', WIDTH / 2, HEIGHT / 2 + 50);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#4f4';
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', WIDTH / 2, HEIGHT / 2 - 30);

    ctx.font = '18px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Cleared Floor ${currentFloor}`, WIDTH / 2, HEIGHT / 2 + 10);

    ctx.fillStyle = '#ff0';
    ctx.fillText('Click to Play Again', WIDTH / 2, HEIGHT / 2 + 50);
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

        // AUTO-START: Skip menu and start game directly
        setTimeout(() => startGame(), 100);
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
            currentFloor = 1;
            startGame();
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
});

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;
    keys[e.key] = true;

    // Dodge roll on space
    if (key === ' ' && gameState === 'playing' && player) {
        e.preventDefault();
        player.dodgeRoll();
    }

    // Blank on Q
    if (key === 'q' && gameState === 'playing' && player) {
        player.useBlank();
    }

    // Weapon switch on number keys
    if (key >= '1' && key <= '9' && player) {
        const index = parseInt(key) - 1;
        if (index < player.weapons.length) {
            player.currentWeaponIndex = index;
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.key] = false;
});

// Start game
function startGame() {
    player = new Player(400, 300);
    generateFloor(currentFloor);
    gameState = 'playing';
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
            if (action.keys) {
                for (const k of action.keys) {
                    keys[k.toLowerCase()] = true;
                    keys[k] = true;
                    // Handle dodge roll
                    if (k.toLowerCase() === ' ' && player) {
                        player.dodgeRoll();
                    }
                    if (k.toLowerCase() === 'q' && player) {
                        player.useBlank();
                    }
                }
            }

            if (action.mouse) {
                mouse.x = action.mouse.x || mouse.x;
                mouse.y = action.mouse.y || mouse.y;
                mouse.down = action.mouse.down !== undefined ? action.mouse.down : mouse.down;
            }

            gamePaused = false;

            setTimeout(() => {
                if (action.keys) {
                    for (const k of action.keys) {
                        keys[k.toLowerCase()] = false;
                        keys[k] = false;
                    }
                }
                if (action.mouse) {
                    mouse.down = false;
                }
                gamePaused = true;
                resolve();
            }, durationMs);
        });
    },

    getState: () => {
        // Calculate door positions for navigation
        const doors = [];
        if (currentRoom && currentRoom.cleared) {
            for (const connected of currentRoom.connections) {
                const dx = connected.gridX - currentRoom.gridX;
                const dy = connected.gridY - currentRoom.gridY;
                const roomCenterX = (currentRoom.x + currentRoom.width / 2) * TILE_SIZE;
                const roomCenterY = (currentRoom.y + currentRoom.height / 2) * TILE_SIZE;
                let doorX, doorY;
                if (dx > 0) {
                    doorX = (currentRoom.x + currentRoom.width) * TILE_SIZE - TILE_SIZE;
                    doorY = roomCenterY;
                } else if (dx < 0) {
                    doorX = currentRoom.x * TILE_SIZE + TILE_SIZE;
                    doorY = roomCenterY;
                } else if (dy > 0) {
                    doorX = roomCenterX;
                    doorY = (currentRoom.y + currentRoom.height) * TILE_SIZE - TILE_SIZE;
                } else {
                    doorX = roomCenterX;
                    doorY = currentRoom.y * TILE_SIZE + TILE_SIZE;
                }
                doors.push({ x: doorX, y: doorY, toRoom: connected.type });
            }
        }

        return {
            gameState,
            floor: currentFloor,
            room: currentRoom ? currentRoom.type : null,
            roomCleared: currentRoom ? currentRoom.cleared : false,
            doors,
            player: player ? {
                x: player.x,
                y: player.y,
                hp: player.hp,
                maxHp: player.maxHp,
                blanks: player.blanks,
                keys: player.keys,
                shells: player.shells,
                rolling: player.rolling,
                weapon: player.currentWeapon.name,
                ammo: player.currentWeapon.currentAmmo
            } : null,
            enemies: enemies.map(e => ({
                x: e.x, y: e.y, type: e.type || 'boss', hp: e.hp
            })),
            enemyBullets: enemyBullets.length,
            pickups: pickups.length,
            camera: { ...camera }
        };
    },

    getPhase: () => {
        if (gameState === 'menu') return 'menu';
        if (gameState === 'gameover') return 'gameover';
        if (gameState === 'victory') return 'victory';
        return 'playing';
    },

    debug: {
        setHealth: (hp) => { if (player) player.hp = hp; },
        addBlanks: (n) => { if (player) player.blanks += n; },
        addKeys: (n) => { if (player) player.keys += n; },
        clearEnemies: () => { enemies = []; },
        clearBullets: () => { enemyBullets = []; },
        forceStart: () => {
            currentFloor = 1;
            player = new Player(400, 300);
            generateFloor(currentFloor);
            gameState = 'playing';
            gamePaused = true;
        },
        nextFloor: () => {
            currentFloor++;
            generateFloor(currentFloor);
        }
    }
};
