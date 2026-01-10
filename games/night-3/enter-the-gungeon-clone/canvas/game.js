// Bullet Dungeon - Enter the Gungeon Clone
// Canvas 2D Implementation

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Colors matching Gungeon style
const COLORS = {
    floor: '#3A3540',
    floorLight: '#454050',
    floorGrid: '#2A252F',
    wall: '#252030',
    wallDetail: '#3A3540',
    door: '#5A4A40',
    doorOpen: '#2A2520',
    player: '#DDAA66',
    playerOutline: '#AA7744',
    bulletKin: '#AA8866',
    bulletKinEye: '#FFFFFF',
    bulletKinPupil: '#111111',
    shotgunKin: '#7777AA',
    playerBullet: '#FFFF88',
    enemyBullet: '#FF6644',
    enemyBulletGlow: '#FF4422',
    heart: '#CC3333',
    heartEmpty: '#441111',
    ammo: '#4488CC',
    shell: '#FFCC33',
    key: '#FFDD44',
    blank: '#88DDFF',
    muzzleFlash: '#FFFF88'
};

// Game state
let gameState = 'title';
let player = null;
let enemies = [];
let playerBullets = [];
let enemyBullets = [];
let pickups = [];
let particles = [];
let damageNumbers = [];

// Room and dungeon
let currentRoom = null;
let dungeon = [];
let currentRoomIndex = 0;
let floor = 1;

// Input tracking
const keys = {};
const mouse = { x: 400, y: 300, down: false };

// Input handlers
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (gameState === 'title' && e.code === 'Space') {
        initGame();
    }
    if (gameState === 'gameover' && e.code === 'Space') {
        initGame();
    }
});

document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => mouse.down = true);
canvas.addEventListener('mouseup', () => mouse.down = false);

// Player class
class Player {
    constructor() {
        this.x = 400;
        this.y = 300;
        this.width = 20;
        this.height = 24;
        this.speed = 200;
        this.hp = 6; // 3 full hearts
        this.maxHp = 6;
        this.armor = 0;
        this.keys = 1;
        this.blanks = 2;
        this.shells = 0;

        // Weapons
        this.weapons = [
            { name: 'Pistol', damage: 5, fireRate: 4, magazineSize: 12, ammo: 12, maxAmmo: Infinity, spread: 3, bulletSpeed: 600, type: 'semi' }
        ];
        this.currentWeapon = 0;
        this.fireTimer = 0;
        this.reloading = false;
        this.reloadTimer = 0;

        // Dodge roll
        this.isRolling = false;
        this.rollTimer = 0;
        this.rollDuration = 0.5;
        this.rollSpeed = 450;
        this.rollCooldown = 0;
        this.rollDirX = 0;
        this.rollDirY = 0;
        this.invulnerable = false;
        this.invulnTimer = 0;

        // Animation
        this.angle = 0;
        this.gunAngle = 0;
        this.muzzleFlash = 0;
    }

    get weapon() {
        return this.weapons[this.currentWeapon];
    }

    update(dt) {
        // Update angle toward mouse
        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        this.gunAngle = this.angle;

        // Rolling
        if (this.isRolling) {
            this.rollTimer -= dt;
            this.x += this.rollDirX * this.rollSpeed * dt;
            this.y += this.rollDirY * this.rollSpeed * dt;

            // Invulnerable for first half of roll
            this.invulnerable = this.rollTimer > this.rollDuration * 0.4;

            if (this.rollTimer <= 0) {
                this.isRolling = false;
                this.invulnerable = false;
            }
        } else {
            // Normal movement
            let vx = 0, vy = 0;
            if (keys['w'] || keys['arrowup']) vy = -1;
            if (keys['s'] || keys['arrowdown']) vy = 1;
            if (keys['a'] || keys['arrowleft']) vx = -1;
            if (keys['d'] || keys['arrowright']) vx = 1;

            if (vx && vy) {
                vx *= 0.707;
                vy *= 0.707;
            }

            this.x += vx * this.speed * dt;
            this.y += vy * this.speed * dt;

            // Dodge roll initiation
            this.rollCooldown -= dt;
            if ((keys[' '] || keys['shift']) && this.rollCooldown <= 0 && (vx || vy)) {
                this.isRolling = true;
                this.rollTimer = this.rollDuration;
                this.rollCooldown = 0.1;
                const mag = Math.sqrt(vx * vx + vy * vy);
                this.rollDirX = vx / mag;
                this.rollDirY = vy / mag;
            }
        }

        // Clamp to room bounds - allow reaching doors when room is cleared
        const roomBounds = currentRoom.getBounds();
        const edgeBuffer = currentRoom.cleared ? 10 : 30; // Can get closer to doors when room cleared
        this.x = Math.max(roomBounds.x + edgeBuffer, Math.min(roomBounds.x + roomBounds.w - edgeBuffer, this.x));
        this.y = Math.max(roomBounds.y + edgeBuffer, Math.min(roomBounds.y + roomBounds.h - edgeBuffer, this.y));

        // Shooting
        this.fireTimer -= dt;
        this.muzzleFlash -= dt;

        if (mouse.down && this.fireTimer <= 0 && !this.reloading && !this.isRolling) {
            this.fire();
        }

        // Reloading
        if (this.reloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.weapon.ammo = this.weapon.magazineSize;
                this.reloading = false;
            }
        }

        // Manual reload
        if (keys['r'] && !this.reloading && this.weapon.ammo < this.weapon.magazineSize) {
            this.startReload();
        }

        // Invulnerability timer
        if (this.invulnTimer > 0) {
            this.invulnTimer -= dt;
            this.invulnerable = true;
        } else if (!this.isRolling) {
            this.invulnerable = false;
        }
    }

    fire() {
        if (this.weapon.ammo <= 0) {
            this.startReload();
            return;
        }

        const spread = (Math.random() - 0.5) * this.weapon.spread * Math.PI / 180;
        const angle = this.gunAngle + spread;

        playerBullets.push({
            x: this.x + Math.cos(this.gunAngle) * 20,
            y: this.y + Math.sin(this.gunAngle) * 20,
            vx: Math.cos(angle) * this.weapon.bulletSpeed,
            vy: Math.sin(angle) * this.weapon.bulletSpeed,
            damage: this.weapon.damage,
            life: 1.0
        });

        this.weapon.ammo--;
        this.fireTimer = 1 / this.weapon.fireRate;
        this.muzzleFlash = 0.05;

        // Auto-reload when empty
        if (this.weapon.ammo <= 0 && this.weapon.maxAmmo !== Infinity) {
            this.startReload();
        }
    }

    startReload() {
        this.reloading = true;
        this.reloadTimer = 1.0;
    }

    takeDamage(amount) {
        if (this.invulnerable) return;

        if (this.armor > 0) {
            this.armor--;
        } else {
            this.hp -= amount;
        }

        this.invulnTimer = 1.0;

        // Screen shake
        screenShake(5, 0.2);

        if (this.hp <= 0) {
            gameState = 'gameover';
        }
    }

    useBlank() {
        if (this.blanks <= 0) return;
        this.blanks--;

        // Clear all enemy bullets
        enemyBullets = [];

        // Knockback and stun enemies
        for (let enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
                enemy.stunTimer = 1.0;
                enemy.x += (dx / dist) * 50;
                enemy.y += (dy / dist) * 50;
            }
        }

        // Visual effect
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 300,
                vy: Math.sin(angle) * 300,
                life: 0.3,
                maxLife: 0.3,
                color: COLORS.blank,
                size: 8
            });
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Flash when invulnerable
        if (this.invulnerable && Math.floor(Date.now() / 50) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Body
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.ellipse(0, 2, 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.playerOutline;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Head
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.arc(0, -6, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eyes
        const eyeOffset = Math.cos(this.angle) * 2;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-3 + eyeOffset * 0.3, -7, 2.5, 0, Math.PI * 2);
        ctx.arc(3 + eyeOffset * 0.3, -7, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(-3 + eyeOffset, -7, 1.2, 0, Math.PI * 2);
        ctx.arc(3 + eyeOffset, -7, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Gun (drawn separately to rotate)
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.gunAngle);

        // Gun body
        ctx.fillStyle = '#666666';
        ctx.fillRect(8, -4, 18, 8);
        ctx.fillStyle = '#888888';
        ctx.fillRect(10, -3, 14, 6);

        // Muzzle flash
        if (this.muzzleFlash > 0) {
            ctx.fillStyle = COLORS.muzzleFlash;
            ctx.beginPath();
            ctx.arc(30, 0, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Enemy base class
class Enemy {
    constructor(x, y, type = 'bulletKin') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.stunTimer = 0;
        this.hitFlash = 0;

        switch (type) {
            case 'bulletKin':
                this.hp = 15;
                this.maxHp = 15;
                this.speed = 60;
                this.damage = 1;
                this.fireRate = 1.5;
                this.width = 18;
                this.height = 24;
                break;
            case 'shotgunKin':
                this.hp = 25;
                this.maxHp = 25;
                this.speed = 50;
                this.damage = 1;
                this.fireRate = 1.0;
                this.width = 22;
                this.height = 28;
                break;
            case 'veteran':
                this.hp = 20;
                this.maxHp = 20;
                this.speed = 80;
                this.damage = 1;
                this.fireRate = 2.5;
                this.width = 18;
                this.height = 24;
                break;
        }

        this.fireTimer = Math.random() * (1 / this.fireRate);
        this.moveTimer = 0;
        this.moveDir = { x: 0, y: 0 };
    }

    update(dt) {
        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
            return;
        }

        this.hitFlash -= dt;

        // Move toward player with some randomness
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 150) {
                // Move toward player
                this.moveDir.x = dx / dist + (Math.random() - 0.5) * 0.5;
                this.moveDir.y = dy / dist + (Math.random() - 0.5) * 0.5;
            } else {
                // Strafe
                this.moveDir.x = -dy / dist + (Math.random() - 0.5) * 0.5;
                this.moveDir.y = dx / dist + (Math.random() - 0.5) * 0.5;
            }

            this.moveTimer = 0.5 + Math.random() * 0.5;
        }

        this.x += this.moveDir.x * this.speed * dt;
        this.y += this.moveDir.y * this.speed * dt;

        // Clamp to room
        const roomBounds = currentRoom.getBounds();
        this.x = Math.max(roomBounds.x + 30, Math.min(roomBounds.x + roomBounds.w - 30, this.x));
        this.y = Math.max(roomBounds.y + 30, Math.min(roomBounds.y + roomBounds.h - 30, this.y));

        // Shooting
        this.fireTimer -= dt;
        if (this.fireTimer <= 0) {
            this.fire();
            this.fireTimer = 1 / this.fireRate;
        }
    }

    fire() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const angle = Math.atan2(dy, dx);

        if (this.type === 'bulletKin' || this.type === 'veteran') {
            // Single aimed shot
            enemyBullets.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 200,
                vy: Math.sin(angle) * 200,
                damage: this.damage
            });
        } else if (this.type === 'shotgunKin') {
            // Spread shot
            for (let i = -2; i <= 2; i++) {
                const spread = i * 0.15;
                enemyBullets.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle + spread) * 180,
                    vy: Math.sin(angle + spread) * 180,
                    damage: this.damage
                });
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.hitFlash = 0.1;

        damageNumbers.push({
            x: this.x,
            y: this.y - 20,
            value: amount,
            life: 0.5,
            vy: -50
        });

        if (this.hp <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    die() {
        // Shell drops
        const shellCount = this.type === 'shotgunKin' ? 3 : 1;
        for (let i = 0; i < shellCount; i++) {
            pickups.push({
                x: this.x + (Math.random() - 0.5) * 20,
                y: this.y + (Math.random() - 0.5) * 20,
                type: 'shell',
                value: 1
            });
        }

        // Death particles
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 0.3,
                maxLife: 0.3,
                color: this.type === 'shotgunKin' ? COLORS.shotgunKin : COLORS.bulletKin,
                size: 6
            });
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Hit flash
        if (this.hitFlash > 0) {
            ctx.fillStyle = '#FFFFFF';
        } else {
            ctx.fillStyle = this.type === 'shotgunKin' ? COLORS.shotgunKin : COLORS.bulletKin;
        }

        // Bullet-shaped body
        ctx.beginPath();
        ctx.ellipse(0, 4, this.width / 2, this.height / 2 - 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bullet tip (head)
        ctx.beginPath();
        ctx.arc(0, -this.height / 2 + 8, this.width / 2 - 2, Math.PI, 0);
        ctx.fill();

        // Eyes
        const eyeDir = Math.atan2(player.y - this.y, player.x - this.x);
        const eyeX = Math.cos(eyeDir) * 2;
        const eyeY = Math.sin(eyeDir) * 1;

        ctx.fillStyle = COLORS.bulletKinEye;
        ctx.beginPath();
        ctx.ellipse(-4, -2, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(4, -2, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.bulletKinPupil;
        ctx.beginPath();
        ctx.arc(-4 + eyeX, -2 + eyeY, 2, 0, Math.PI * 2);
        ctx.arc(4 + eyeX, -2 + eyeY, 2, 0, Math.PI * 2);
        ctx.fill();

        // Bandana for shotgun kin
        if (this.type === 'shotgunKin') {
            ctx.fillStyle = '#CC4444';
            ctx.beginPath();
            ctx.ellipse(0, -this.height / 2 + 10, this.width / 2 + 2, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Room class
class Room {
    constructor(type = 'combat', x = 0, y = 0) {
        this.type = type;
        this.gridX = x;
        this.gridY = y;
        this.width = 400;
        this.height = 300;
        this.cleared = type !== 'combat';
        this.doors = { north: null, south: null, east: null, west: null };
        this.enemies = [];
        this.screenX = 200;
        this.screenY = 150;
    }

    getBounds() {
        return {
            x: this.screenX,
            y: this.screenY,
            w: this.width,
            h: this.height
        };
    }

    spawnEnemies() {
        if (this.type !== 'combat') return;

        const count = 3 + Math.floor(floor * 1.5);
        for (let i = 0; i < count; i++) {
            const x = this.screenX + 50 + Math.random() * (this.width - 100);
            const y = this.screenY + 50 + Math.random() * (this.height - 100);

            let type = 'bulletKin';
            if (floor >= 2 && Math.random() < 0.3) type = 'shotgunKin';
            if (floor >= 2 && Math.random() < 0.2) type = 'veteran';

            this.enemies.push(new Enemy(x, y, type));
        }
    }

    draw() {
        const bounds = this.getBounds();

        // Floor
        ctx.fillStyle = COLORS.floor;
        ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);

        // Floor grid pattern
        ctx.strokeStyle = COLORS.floorGrid;
        ctx.lineWidth = 1;
        for (let x = bounds.x; x <= bounds.x + bounds.w; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, bounds.y);
            ctx.lineTo(x, bounds.y + bounds.h);
            ctx.stroke();
        }
        for (let y = bounds.y; y <= bounds.y + bounds.h; y += 32) {
            ctx.beginPath();
            ctx.moveTo(bounds.x, y);
            ctx.lineTo(bounds.x + bounds.w, y);
            ctx.stroke();
        }

        // Walls
        ctx.fillStyle = COLORS.wall;
        // Top wall
        ctx.fillRect(bounds.x - 20, bounds.y - 20, bounds.w + 40, 20);
        // Bottom wall
        ctx.fillRect(bounds.x - 20, bounds.y + bounds.h, bounds.w + 40, 20);
        // Left wall
        ctx.fillRect(bounds.x - 20, bounds.y, 20, bounds.h);
        // Right wall
        ctx.fillRect(bounds.x + bounds.w, bounds.y, 20, bounds.h);

        // Wall details
        ctx.fillStyle = COLORS.wallDetail;
        for (let x = bounds.x; x < bounds.x + bounds.w; x += 32) {
            ctx.fillRect(x, bounds.y - 18, 28, 3);
            ctx.fillRect(x, bounds.y + bounds.h + 15, 28, 3);
        }

        // Doors
        this.drawDoors(bounds);
    }

    drawDoors(bounds) {
        const doorWidth = 40;
        const doorDepth = 20;

        // North door
        if (this.doors.north !== null) {
            ctx.fillStyle = this.cleared || this.doors.north.cleared ? COLORS.doorOpen : COLORS.door;
            ctx.fillRect(bounds.x + bounds.w / 2 - doorWidth / 2, bounds.y - doorDepth, doorWidth, doorDepth);
        }

        // South door
        if (this.doors.south !== null) {
            ctx.fillStyle = this.cleared || this.doors.south.cleared ? COLORS.doorOpen : COLORS.door;
            ctx.fillRect(bounds.x + bounds.w / 2 - doorWidth / 2, bounds.y + bounds.h, doorWidth, doorDepth);
        }

        // East door
        if (this.doors.east !== null) {
            ctx.fillStyle = this.cleared || this.doors.east.cleared ? COLORS.doorOpen : COLORS.door;
            ctx.fillRect(bounds.x + bounds.w, bounds.y + bounds.h / 2 - doorWidth / 2, doorDepth, doorWidth);
        }

        // West door
        if (this.doors.west !== null) {
            ctx.fillStyle = this.cleared || this.doors.west.cleared ? COLORS.doorOpen : COLORS.door;
            ctx.fillRect(bounds.x - doorDepth, bounds.y + bounds.h / 2 - doorWidth / 2, doorDepth, doorWidth);
        }
    }
}

// Screen shake
let shakeIntensity = 0;
let shakeDuration = 0;
function screenShake(intensity, duration) {
    shakeIntensity = intensity;
    shakeDuration = duration;
}

function applyScreenShake(dt) {
    if (shakeDuration > 0) {
        shakeDuration -= dt;
        const offsetX = (Math.random() - 0.5) * shakeIntensity * 2;
        const offsetY = (Math.random() - 0.5) * shakeIntensity * 2;
        ctx.translate(offsetX, offsetY);
    }
}

// Generate dungeon
function generateDungeon() {
    dungeon = [];

    // Create rooms
    const roomCount = 5 + floor * 2;
    const grid = {};

    // Start room
    const startRoom = new Room('start', 0, 0);
    startRoom.cleared = true;
    dungeon.push(startRoom);
    grid['0,0'] = startRoom;

    // Generate connected rooms
    const directions = [
        { dx: 0, dy: -1, door: 'north', opposite: 'south' },
        { dx: 0, dy: 1, door: 'south', opposite: 'north' },
        { dx: 1, dy: 0, door: 'east', opposite: 'west' },
        { dx: -1, dy: 0, door: 'west', opposite: 'east' }
    ];

    let frontier = [{ x: 0, y: 0 }];

    while (dungeon.length < roomCount && frontier.length > 0) {
        const idx = Math.floor(Math.random() * frontier.length);
        const pos = frontier[idx];
        const currentRoom = grid[`${pos.x},${pos.y}`];

        // Try random direction
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const newX = pos.x + dir.dx;
        const newY = pos.y + dir.dy;
        const key = `${newX},${newY}`;

        if (!grid[key]) {
            const type = dungeon.length === roomCount - 1 ? 'boss' : 'combat';
            const newRoom = new Room(type, newX, newY);
            dungeon.push(newRoom);
            grid[key] = newRoom;

            // Connect doors
            currentRoom.doors[dir.door] = newRoom;
            newRoom.doors[dir.opposite] = currentRoom;

            frontier.push({ x: newX, y: newY });
        }

        // Remove from frontier if no more options
        let hasOptions = false;
        for (let d of directions) {
            if (!grid[`${pos.x + d.dx},${pos.y + d.dy}`]) {
                hasOptions = true;
                break;
            }
        }
        if (!hasOptions) {
            frontier.splice(idx, 1);
        }
    }

    return dungeon[0];
}

// Initialize game
function initGame() {
    gameState = 'playing';
    floor = 1;
    player = new Player();
    enemies = [];
    playerBullets = [];
    enemyBullets = [];
    pickups = [];
    particles = [];
    damageNumbers = [];

    currentRoom = generateDungeon();
    currentRoom.spawnEnemies();
    enemies = [...currentRoom.enemies];

    // Position player
    const bounds = currentRoom.getBounds();
    player.x = bounds.x + bounds.w / 2;
    player.y = bounds.y + bounds.h / 2;
}

// Update functions
function updateBullets(dt) {
    // Player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const b = playerBullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;

        // Check enemy collision
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (Math.abs(b.x - e.x) < e.width / 2 && Math.abs(b.y - e.y) < e.height / 2) {
                if (e.takeDamage(b.damage)) {
                    enemies.splice(j, 1);
                }
                playerBullets.splice(i, 1);
                break;
            }
        }

        // Check wall collision
        const bounds = currentRoom.getBounds();
        if (b.life <= 0 || b.x < bounds.x || b.x > bounds.x + bounds.w || b.y < bounds.y || b.y > bounds.y + bounds.h) {
            playerBullets.splice(i, 1);
        }
    }

    // Enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Check player collision
        if (!player.invulnerable && Math.abs(b.x - player.x) < 12 && Math.abs(b.y - player.y) < 14) {
            player.takeDamage(b.damage);
            enemyBullets.splice(i, 1);
            continue;
        }

        // Check wall collision
        const bounds = currentRoom.getBounds();
        if (b.x < bounds.x || b.x > bounds.x + bounds.w || b.y < bounds.y || b.y > bounds.y + bounds.h) {
            enemyBullets.splice(i, 1);
        }
    }
}

function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];

        // Check player collision
        if (Math.abs(p.x - player.x) < 20 && Math.abs(p.y - player.y) < 20) {
            switch (p.type) {
                case 'shell':
                    player.shells += p.value;
                    break;
                case 'heart':
                    player.hp = Math.min(player.hp + 2, player.maxHp);
                    break;
                case 'key':
                    player.keys++;
                    break;
                case 'blank':
                    player.blanks++;
                    break;
                case 'ammo':
                    player.weapon.ammo = Math.min(player.weapon.ammo + 6, player.weapon.magazineSize);
                    break;
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
        p.life -= dt;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updateDamageNumbers(dt) {
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const d = damageNumbers[i];
        d.y += d.vy * dt;
        d.life -= dt;
        if (d.life <= 0) {
            damageNumbers.splice(i, 1);
        }
    }
}

function checkRoomClear() {
    if (!currentRoom.cleared && enemies.length === 0) {
        currentRoom.cleared = true;

        // Bonus drops
        if (Math.random() < 0.3) {
            pickups.push({
                x: player.x + (Math.random() - 0.5) * 50,
                y: player.y + (Math.random() - 0.5) * 50,
                type: Math.random() < 0.5 ? 'heart' : 'ammo'
            });
        }
    }
}

function checkDoorTransition() {
    if (!currentRoom.cleared) return;

    const bounds = currentRoom.getBounds();
    const doorWidth = 50; // Increased from 40 for easier door hitting
    const doorZone = 25;  // How close to edge to trigger transition

    // North door
    if (currentRoom.doors.north && player.y < bounds.y + doorZone) {
        if (Math.abs(player.x - (bounds.x + bounds.w / 2)) < doorWidth / 2) {
            transitionToRoom(currentRoom.doors.north, 'south');
        }
    }

    // South door
    if (currentRoom.doors.south && player.y > bounds.y + bounds.h - doorZone) {
        if (Math.abs(player.x - (bounds.x + bounds.w / 2)) < doorWidth / 2) {
            transitionToRoom(currentRoom.doors.south, 'north');
        }
    }

    // East door
    if (currentRoom.doors.east && player.x > bounds.x + bounds.w - doorZone) {
        if (Math.abs(player.y - (bounds.y + bounds.h / 2)) < doorWidth / 2) {
            transitionToRoom(currentRoom.doors.east, 'west');
        }
    }

    // West door
    if (currentRoom.doors.west && player.x < bounds.x + doorZone) {
        if (Math.abs(player.y - (bounds.y + bounds.h / 2)) < doorWidth / 2) {
            transitionToRoom(currentRoom.doors.west, 'east');
        }
    }
}

function transitionToRoom(newRoom, entryDirection) {
    currentRoom = newRoom;

    // Clear bullets
    playerBullets = [];
    enemyBullets = [];

    // Spawn enemies if not cleared
    if (!currentRoom.cleared && currentRoom.enemies.length === 0) {
        currentRoom.spawnEnemies();
    }
    enemies = [...currentRoom.enemies];

    // Position player at entry
    const bounds = currentRoom.getBounds();
    switch (entryDirection) {
        case 'north':
            player.x = bounds.x + bounds.w / 2;
            player.y = bounds.y + 40;
            break;
        case 'south':
            player.x = bounds.x + bounds.w / 2;
            player.y = bounds.y + bounds.h - 40;
            break;
        case 'east':
            player.x = bounds.x + bounds.w - 40;
            player.y = bounds.y + bounds.h / 2;
            break;
        case 'west':
            player.x = bounds.x + 40;
            player.y = bounds.y + bounds.h / 2;
            break;
    }
}

// Draw functions
function drawBullets() {
    // Player bullets
    ctx.fillStyle = COLORS.playerBullet;
    for (let b of playerBullets) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.fillRect(-8, -2, 16, 4);
        ctx.restore();
    }

    // Enemy bullets
    for (let b of enemyBullets) {
        // Glow
        ctx.fillStyle = COLORS.enemyBulletGlow;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = COLORS.enemyBullet;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPickups() {
    for (let p of pickups) {
        ctx.save();
        ctx.translate(p.x, p.y);

        switch (p.type) {
            case 'shell':
                ctx.fillStyle = COLORS.shell;
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#AA8822';
                ctx.fillRect(-2, -4, 4, 8);
                break;
            case 'heart':
                ctx.fillStyle = COLORS.heart;
                ctx.beginPath();
                ctx.arc(-3, -2, 5, 0, Math.PI * 2);
                ctx.arc(3, -2, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-8, 0);
                ctx.lineTo(0, 10);
                ctx.lineTo(8, 0);
                ctx.fill();
                break;
            case 'key':
                ctx.fillStyle = COLORS.key;
                ctx.beginPath();
                ctx.arc(0, -4, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(-2, 0, 4, 10);
                ctx.fillRect(0, 6, 4, 3);
                break;
            case 'blank':
                ctx.fillStyle = COLORS.blank;
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'ammo':
                ctx.fillStyle = COLORS.ammo;
                ctx.fillRect(-6, -8, 12, 16);
                ctx.fillStyle = '#66AADD';
                ctx.fillRect(-4, -6, 8, 12);
                break;
        }

        ctx.restore();
    }
}

function drawParticles() {
    for (let p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawDamageNumbers() {
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    for (let d of damageNumbers) {
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = d.life / 0.5;
        ctx.fillText(d.value, d.x, d.y);
    }
    ctx.globalAlpha = 1;
}

function drawHUD() {
    // Hearts
    const heartSize = 18;
    for (let i = 0; i < player.maxHp / 2; i++) {
        const x = 20 + i * (heartSize + 4);
        const y = 20;

        // Background
        ctx.fillStyle = COLORS.heartEmpty;
        ctx.beginPath();
        ctx.arc(x - 4, y, 6, 0, Math.PI * 2);
        ctx.arc(x + 4, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - 10, y + 2);
        ctx.lineTo(x, y + 14);
        ctx.lineTo(x + 10, y + 2);
        ctx.fill();

        // Full or half heart
        const hp = player.hp - i * 2;
        if (hp >= 2) {
            ctx.fillStyle = COLORS.heart;
            ctx.beginPath();
            ctx.arc(x - 4, y, 5, 0, Math.PI * 2);
            ctx.arc(x + 4, y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x - 9, y + 2);
            ctx.lineTo(x, y + 13);
            ctx.lineTo(x + 9, y + 2);
            ctx.fill();
        } else if (hp === 1) {
            ctx.fillStyle = COLORS.heart;
            ctx.save();
            ctx.beginPath();
            ctx.rect(x - 10, y - 10, 10, 30);
            ctx.clip();
            ctx.beginPath();
            ctx.arc(x - 4, y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x - 9, y + 2);
            ctx.lineTo(x, y + 13);
            ctx.lineTo(x, y);
            ctx.fill();
            ctx.restore();
        }
    }

    // Second row: blanks, keys, shells
    ctx.fillStyle = COLORS.blank;
    ctx.beginPath();
    ctx.arc(25, 50, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(player.blanks, 45, 55);

    ctx.fillStyle = COLORS.key;
    ctx.beginPath();
    ctx.arc(75, 48, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(73, 52, 4, 8);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(player.keys, 95, 55);

    ctx.fillStyle = COLORS.shell;
    ctx.beginPath();
    ctx.arc(125, 50, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(player.shells, 145, 55);

    // Ammo display (bottom right)
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`${player.weapon.ammo}/${player.weapon.magazineSize}`, 780, 580);

    // Gun icon
    ctx.fillStyle = '#666666';
    ctx.fillRect(700, 560, 40, 15);
    ctx.fillStyle = '#888888';
    ctx.fillRect(705, 563, 30, 9);

    // Minimap
    drawMinimap();

    // Floor indicator
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Floor ${floor}`, 780, 30);

    // Reload indicator
    if (player.reloading) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFF88';
        ctx.fillText('RELOADING...', 400, 550);
    }
}

function drawMinimap() {
    const mapX = 700;
    const mapY = 40;
    const roomSize = 12;
    const spacing = 2;

    for (let room of dungeon) {
        const rx = mapX + room.gridX * (roomSize + spacing);
        const ry = mapY + room.gridY * (roomSize + spacing);

        if (room === currentRoom) {
            ctx.fillStyle = '#FFFFFF';
        } else if (room.cleared) {
            ctx.fillStyle = '#666666';
        } else {
            ctx.fillStyle = '#444444';
        }

        ctx.fillRect(rx, ry, roomSize, roomSize);

        // Door indicators
        ctx.fillStyle = '#333333';
        if (room.doors.north) ctx.fillRect(rx + 4, ry - 2, 4, 2);
        if (room.doors.south) ctx.fillRect(rx + 4, ry + roomSize, 4, 2);
        if (room.doors.east) ctx.fillRect(rx + roomSize, ry + 4, 2, 4);
        if (room.doors.west) ctx.fillRect(rx - 2, ry + 4, 2, 4);
    }
}

function drawTitle() {
    ctx.fillStyle = '#1A1A20';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BULLET DUNGEON', 400, 180);

    ctx.font = '20px monospace';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('A Bullet Hell Roguelike', 400, 220);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('WASD - Move', 400, 300);
    ctx.fillText('Mouse - Aim', 400, 330);
    ctx.fillText('Left Click - Shoot', 400, 360);
    ctx.fillText('Space/Shift - Dodge Roll', 400, 390);
    ctx.fillText('Q - Use Blank', 400, 420);
    ctx.fillText('R - Reload', 400, 450);

    ctx.fillStyle = '#33CC33';
    ctx.font = 'bold 24px monospace';
    if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.fillText('Press SPACE to Start', 400, 530);
    }
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#CC3333';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', 400, 250);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px monospace';
    ctx.fillText(`Reached Floor ${floor}`, 400, 310);
    ctx.fillText(`Shells Collected: ${player.shells}`, 400, 340);

    ctx.fillStyle = '#33CC33';
    ctx.font = 'bold 20px monospace';
    if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.fillText('Press SPACE to Restart', 400, 450);
    }
}

// Main game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 800, 600);

    if (gameState === 'title') {
        drawTitle();
    } else if (gameState === 'playing') {
        ctx.save();
        applyScreenShake(dt);

        // Update
        player.update(dt);
        enemies.forEach(e => e.update(dt));
        updateBullets(dt);
        updatePickups(dt);
        updateParticles(dt);
        updateDamageNumbers(dt);
        checkRoomClear();
        checkDoorTransition();

        // Use blank
        if (keys['q']) {
            player.useBlank();
            keys['q'] = false;
        }

        // Draw
        currentRoom.draw();
        drawPickups();
        enemies.forEach(e => e.draw());
        player.draw();
        drawBullets();
        drawParticles();
        drawDamageNumbers();

        ctx.restore();

        drawHUD();
    } else if (gameState === 'gameover') {
        drawGameOver();
    }

    requestAnimationFrame(gameLoop);
}

// Start
requestAnimationFrame(gameLoop);
