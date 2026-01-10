// Station Breach - Alien Breed Style Twin-Stick Shooter
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game constants
const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 18;
canvas.width = 800;
canvas.height = 600;

// Colors matching Alien Breed palette - darker industrial
const COLORS = {
    floor: '#4A3A2A',
    floorDark: '#2A1A0A',
    floorDetail: '#3A2A1A',
    wall: '#5A5A5A',
    wallLight: '#7A7A7A',
    wallDark: '#3A3A3A',
    wallPanel: '#4A4A4A',
    void: '#000000',
    hudBg: '#0A0A0A',
    hudText: '#CCCCCC',
    hudYellow: '#FFCC00',
    player: '#3A5A2A',
    playerLight: '#4A6A3A',
    playerDark: '#2A4A1A',
    alien: '#1A1A1A',
    alienBody: '#0A0A0A',
    alienLight: '#2A2A2A',
    alienLegs: '#050505',
    alienEye: '#880000',
    bullet: '#FFAA00',
    muzzleFlash: '#FFFF44',
    health: '#CC2222',
    shield: '#3366CC',
    keyGreen: '#00CC00',
    keyBlue: '#0066CC',
    keyYellow: '#CCCC00',
    keyRed: '#CC0000',
    bloodAlien: '#00AA66'
};

// Game state
let gameState = 'title';
let player = null;
let enemies = [];
let bullets = [];
let particles = [];
let pickups = [];
let doors = [];
let terminals = [];

// Input handling
const keys = {};
let mouseX = 0, mouseY = 0;
let mouseDown = false;

// Camera
let cameraX = 0, cameraY = 0;

// Level map (0 = void, 1 = floor, 2 = wall)
const levelMap = [];

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.speed = 180;
        this.sprintSpeed = 270;
        this.angle = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.shield = 0;
        this.maxShield = 50;
        this.ammo = 60;
        this.maxAmmo = 120;
        this.fireTimer = 0;
        this.fireRate = 0.25; // 4 shots per second
        this.muzzleFlashTimer = 0;
        this.stamina = 100;
        this.maxStamina = 100;
        this.lives = 3;
        this.keys = { green: false, blue: false, yellow: false, red: false };
        this.credits = 0;
        this.weaponIndex = 0;
        this.weapons = ['pistol'];
        this.invulnTimer = 0;
    }

    update(dt) {
        // Movement
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;

        // Normalize diagonal movement
        if (dx && dy) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Sprint
        let currentSpeed = this.speed;
        if (keys['shift'] && this.stamina > 0 && (dx || dy)) {
            currentSpeed = this.sprintSpeed;
            this.stamina -= 25 * dt;
            if (this.stamina < 0) this.stamina = 0;
        } else if (this.stamina < this.maxStamina) {
            this.stamina += 20 * dt;
            if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
        }

        // Apply movement with collision
        const newX = this.x + dx * currentSpeed * dt;
        const newY = this.y + dy * currentSpeed * dt;

        if (!isColliding(newX, this.y, this.width, this.height)) {
            this.x = newX;
        }
        if (!isColliding(this.x, newY, this.width, this.height)) {
            this.y = newY;
        }

        // Aim towards mouse (screen space to world space)
        const worldMouseX = mouseX + cameraX;
        const worldMouseY = mouseY + cameraY;
        this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

        // Shooting
        this.fireTimer -= dt;
        if (mouseDown && this.fireTimer <= 0 && this.ammo > 0) {
            this.shoot();
        }

        // Muzzle flash decay
        if (this.muzzleFlashTimer > 0) {
            this.muzzleFlashTimer -= dt;
        }

        // Invulnerability timer
        if (this.invulnTimer > 0) {
            this.invulnTimer -= dt;
        }
    }

    shoot() {
        const bulletSpeed = 800;
        const spread = (Math.random() - 0.5) * 0.05; // Small spread
        const angle = this.angle + spread;

        bullets.push({
            x: this.x + Math.cos(this.angle) * 20,
            y: this.y + Math.sin(this.angle) * 20,
            vx: Math.cos(angle) * bulletSpeed,
            vy: Math.sin(angle) * bulletSpeed,
            damage: 15,
            life: 0.8,
            fromPlayer: true
        });

        this.ammo--;
        this.fireTimer = this.fireRate;
        this.muzzleFlashTimer = 0.05;

        // Screen shake
        screenShake(2, 0.05);

        // Muzzle flash particles
        for (let i = 0; i < 3; i++) {
            particles.push({
                x: this.x + Math.cos(this.angle) * 22,
                y: this.y + Math.sin(this.angle) * 22,
                vx: Math.cos(this.angle + (Math.random() - 0.5) * 0.5) * 200,
                vy: Math.sin(this.angle + (Math.random() - 0.5) * 0.5) * 200,
                life: 0.1,
                maxLife: 0.1,
                color: COLORS.muzzleFlash,
                size: 4
            });
        }
    }

    takeDamage(amount) {
        if (this.invulnTimer > 0) return;

        // Shield absorbs damage first
        if (this.shield > 0) {
            if (this.shield >= amount) {
                this.shield -= amount;
                amount = 0;
            } else {
                amount -= this.shield;
                this.shield = 0;
            }
        }

        this.health -= amount;
        this.invulnTimer = 0.5;

        // Damage particles
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 0.3,
                maxLife: 0.3,
                color: COLORS.health,
                size: 3
            });
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.lives--;
        if (this.lives > 0) {
            this.health = this.maxHealth;
            this.respawn();
        } else {
            gameState = 'gameover';
        }
    }

    respawn() {
        // Find spawn point
        this.x = spawnPoint.x;
        this.y = spawnPoint.y;
        this.invulnTimer = 2;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - cameraX, this.y - cameraY);
        ctx.rotate(this.angle);

        // Flash when invulnerable
        if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-10, 2, 20, 12);

        // Body armor (darker base)
        ctx.fillStyle = COLORS.playerDark;
        ctx.fillRect(-11, -9, 22, 18);

        // Body main
        ctx.fillStyle = COLORS.player;
        ctx.fillRect(-10, -8, 20, 16);

        // Lighter chest plate
        ctx.fillStyle = COLORS.playerLight;
        ctx.fillRect(-8, -6, 16, 8);

        // Helmet
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.arc(-2, -2, 6, 0, Math.PI * 2);
        ctx.fill();

        // Visor
        ctx.fillStyle = '#224466';
        ctx.fillRect(-4, -4, 6, 3);

        // Gun arm
        ctx.fillStyle = COLORS.playerDark;
        ctx.fillRect(6, -4, 6, 8);

        // Gun
        ctx.fillStyle = '#2A2A2A';
        ctx.fillRect(10, -3, 14, 6);
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(18, -2, 6, 4);

        // Muzzle flash
        if (this.muzzleFlashTimer > 0) {
            ctx.fillStyle = COLORS.muzzleFlash;
            ctx.shadowBlur = 15;
            ctx.shadowColor = COLORS.muzzleFlash;
            ctx.beginPath();
            ctx.arc(26, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            // Inner bright
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(26, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type = 'drone') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 24;
        this.height = 24;
        this.angle = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;

        // Stats based on type
        switch (type) {
            case 'drone':
                this.health = 20;
                this.maxHealth = 20;
                this.speed = 120;
                this.damage = 10;
                this.attackCooldown = 1.0;
                this.detectionRange = 300;
                this.credits = 5;
                break;
            case 'spitter':
                this.health = 30;
                this.maxHealth = 30;
                this.speed = 80;
                this.damage = 15;
                this.attackCooldown = 2.0;
                this.detectionRange = 400;
                this.preferredDistance = 200;
                this.credits = 10;
                break;
            case 'brute':
                this.health = 100;
                this.maxHealth = 100;
                this.speed = 60;
                this.damage = 30;
                this.attackCooldown = 1.5;
                this.detectionRange = 250;
                this.credits = 30;
                this.width = 40;
                this.height = 40;
                break;
            default:
                this.health = 20;
                this.maxHealth = 20;
                this.speed = 100;
                this.damage = 10;
                this.attackCooldown = 1.0;
                this.detectionRange = 300;
                this.credits = 5;
        }

        this.attackTimer = this.attackCooldown;
        this.hitFlashTimer = 0;
        this.legPhase = Math.random() * Math.PI * 2;
    }

    update(dt) {
        if (!player) return true;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Apply knockback
        if (this.knockbackX || this.knockbackY) {
            this.x += this.knockbackX * dt;
            this.y += this.knockbackY * dt;
            this.knockbackX *= 0.9;
            this.knockbackY *= 0.9;
            if (Math.abs(this.knockbackX) < 1) this.knockbackX = 0;
            if (Math.abs(this.knockbackY) < 1) this.knockbackY = 0;
        }

        // Detection and movement
        if (dist < this.detectionRange) {
            this.angle = Math.atan2(dy, dx);

            // Move towards player (or keep distance for spitters)
            let moveTowards = true;
            if (this.type === 'spitter' && dist < this.preferredDistance) {
                moveTowards = false;
            }

            if (moveTowards && dist > 30) {
                const moveX = (dx / dist) * this.speed * dt;
                const moveY = (dy / dist) * this.speed * dt;

                if (!isColliding(this.x + moveX, this.y, this.width, this.height)) {
                    this.x += moveX;
                }
                if (!isColliding(this.x, this.y + moveY, this.width, this.height)) {
                    this.y += moveY;
                }
            }

            // Attack
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                if (this.type === 'spitter') {
                    this.shootAcid();
                } else if (dist < 40) {
                    this.meleeAttack();
                }
                this.attackTimer = this.attackCooldown;
            }
        }

        // Leg animation
        this.legPhase += dt * 10;

        // Hit flash decay
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }

        return this.health > 0;
    }

    meleeAttack() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 50) {
            player.takeDamage(this.damage);
        }
    }

    shootAcid() {
        const bulletSpeed = 300;
        bullets.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(this.angle) * bulletSpeed,
            vy: Math.sin(this.angle) * bulletSpeed,
            damage: this.damage,
            life: 1.5,
            fromPlayer: false,
            color: '#88FF88'
        });
    }

    takeDamage(amount, knockbackAngle) {
        this.health -= amount;
        this.hitFlashTimer = 0.1;

        // Knockback
        if (this.type !== 'brute') {
            const knockbackForce = amount * 5;
            this.knockbackX = Math.cos(knockbackAngle) * knockbackForce;
            this.knockbackY = Math.sin(knockbackAngle) * knockbackForce;
        }

        // Blood particles - alien green
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(knockbackAngle + (Math.random() - 0.5)) * 150,
                vy: Math.sin(knockbackAngle + (Math.random() - 0.5)) * 150,
                life: 0.5,
                maxLife: 0.5,
                color: COLORS.bloodAlien,
                size: 4
            });
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        // Drop credits
        player.credits += this.credits;

        // Death particles - alien blood splatter
        for (let i = 0; i < 12; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 250,
                vy: (Math.random() - 0.5) * 250,
                life: 0.8,
                maxLife: 0.8,
                color: COLORS.bloodAlien,
                size: 6
            });
        }

        // Chance to drop ammo or health
        if (Math.random() < 0.2) {
            pickups.push({
                x: this.x,
                y: this.y,
                type: Math.random() < 0.5 ? 'ammo' : 'health'
            });
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - cameraX, this.y - cameraY);

        // Draw spider-like alien - darker, more menacing
        const size = this.type === 'brute' ? 22 : 14;
        const legLength = this.type === 'brute' ? 18 : 12;

        // Legs (8 spider legs with joints)
        ctx.strokeStyle = this.hitFlashTimer > 0 ? '#FFFFFF' : COLORS.alienLegs;
        ctx.lineWidth = this.type === 'brute' ? 3 : 2;
        for (let i = 0; i < 8; i++) {
            const baseAngle = (i / 8) * Math.PI * 2;
            const legOffset = Math.sin(this.legPhase + i * 0.8) * 4;
            const midX = Math.cos(baseAngle) * (size * 0.9);
            const midY = Math.sin(baseAngle) * (size * 0.9);
            const endX = Math.cos(baseAngle) * (size + legLength) + legOffset;
            const endY = Math.sin(baseAngle) * (size + legLength) + legOffset;

            // First segment
            ctx.beginPath();
            ctx.moveTo(Math.cos(baseAngle) * size * 0.5, Math.sin(baseAngle) * size * 0.5);
            ctx.lineTo(midX, midY);
            ctx.stroke();

            // Second segment (bent)
            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        // Shadow/base
        ctx.fillStyle = this.hitFlashTimer > 0 ? '#FFFFFF' : '#000000';
        ctx.beginPath();
        ctx.ellipse(2, 2, size, size * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main body - very dark
        ctx.fillStyle = this.hitFlashTimer > 0 ? '#FFFFFF' : COLORS.alienBody;
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();

        // Segmented carapace
        ctx.strokeStyle = this.hitFlashTimer > 0 ? '#FFFFFF' : COLORS.alienLight;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.7, size * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Slight highlight
        ctx.fillStyle = this.hitFlashTimer > 0 ? '#FFFFFF' : COLORS.alien;
        ctx.beginPath();
        ctx.ellipse(-3, -3, size * 0.35, size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing red eyes
        ctx.fillStyle = this.hitFlashTimer > 0 ? '#FFFFFF' : COLORS.alienEye;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#FF0000';
        const eyeOffset = size * 0.3;
        ctx.beginPath();
        ctx.arc(
            Math.cos(this.angle) * eyeOffset - 3,
            Math.sin(this.angle) * eyeOffset,
            this.type === 'brute' ? 3 : 2, 0, Math.PI * 2
        );
        ctx.arc(
            Math.cos(this.angle) * eyeOffset + 3,
            Math.sin(this.angle) * eyeOffset,
            this.type === 'brute' ? 3 : 2, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}

// Spawn point
let spawnPoint = { x: 400, y: 400 };

// Screen shake
let shakeAmount = 0;
let shakeDuration = 0;

function screenShake(amount, duration) {
    shakeAmount = amount;
    shakeDuration = duration;
}

// Collision detection
function isColliding(x, y, w, h) {
    const left = Math.floor((x - w/2) / TILE_SIZE);
    const right = Math.floor((x + w/2) / TILE_SIZE);
    const top = Math.floor((y - h/2) / TILE_SIZE);
    const bottom = Math.floor((y + h/2) / TILE_SIZE);

    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return true;
            if (levelMap[ty] && levelMap[ty][tx] === 2) return true;
            if (levelMap[ty] && levelMap[ty][tx] === 0) return true;
        }
    }
    return false;
}

// Generate level
function generateLevel() {
    // Initialize with void
    for (let y = 0; y < MAP_HEIGHT; y++) {
        levelMap[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            levelMap[y][x] = 0;
        }
    }

    // Create rooms
    const rooms = [];

    // Starting room (center-bottom)
    rooms.push({ x: 10, y: 12, w: 6, h: 5, name: 'start' });

    // Security office (left)
    rooms.push({ x: 2, y: 6, w: 5, h: 5, name: 'security' });

    // Cargo bay (center)
    rooms.push({ x: 9, y: 5, w: 7, h: 6, name: 'cargo' });

    // Armory (right)
    rooms.push({ x: 18, y: 6, w: 5, h: 5, name: 'armory' });

    // Medical bay (top)
    rooms.push({ x: 9, y: 1, w: 6, h: 4, name: 'medical' });

    // Carve out rooms
    rooms.forEach(room => {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                    levelMap[y][x] = 1;
                }
            }
        }
        // Add walls around room
        for (let y = room.y - 1; y <= room.y + room.h; y++) {
            for (let x = room.x - 1; x <= room.x + room.w; x++) {
                if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                    if (levelMap[y][x] === 0) {
                        levelMap[y][x] = 2;
                    }
                }
            }
        }
    });

    // Create corridors between rooms
    // Start to cargo
    createCorridor(13, 12, 13, 11);
    // Cargo to security
    createCorridor(9, 8, 7, 8);
    // Cargo to armory
    createCorridor(16, 8, 18, 8);
    // Cargo to medical
    createCorridor(12, 5, 12, 4);

    // Set spawn point
    spawnPoint = { x: rooms[0].x * TILE_SIZE + rooms[0].w * TILE_SIZE / 2, y: rooms[0].y * TILE_SIZE + rooms[0].h * TILE_SIZE / 2 };
}

function createCorridor(x1, y1, x2, y2) {
    const dx = x2 > x1 ? 1 : x2 < x1 ? -1 : 0;
    const dy = y2 > y1 ? 1 : y2 < y1 ? -1 : 0;

    let x = x1, y = y1;
    while (x !== x2 || y !== y2) {
        // Carve corridor (2 wide)
        for (let ox = -1; ox <= 0; ox++) {
            for (let oy = -1; oy <= 0; oy++) {
                const tx = x + ox;
                const ty = y + oy;
                if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
                    if (levelMap[ty][tx] !== 1) {
                        levelMap[ty][tx] = 1;
                    }
                }
            }
        }
        // Add walls around corridor
        for (let ox = -2; ox <= 1; ox++) {
            for (let oy = -2; oy <= 1; oy++) {
                const tx = x + ox;
                const ty = y + oy;
                if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
                    if (levelMap[ty][tx] === 0) {
                        levelMap[ty][tx] = 2;
                    }
                }
            }
        }

        if (x !== x2) x += dx;
        else if (y !== y2) y += dy;
    }
}

// Spawn enemies
function spawnEnemies() {
    enemies = [];

    // Drones in cargo area
    for (let i = 0; i < 5; i++) {
        const ex = 9 * TILE_SIZE + Math.random() * 6 * TILE_SIZE;
        const ey = 5 * TILE_SIZE + Math.random() * 5 * TILE_SIZE;
        enemies.push(new Enemy(ex, ey, 'drone'));
    }

    // Spitter in security
    enemies.push(new Enemy(4 * TILE_SIZE, 8 * TILE_SIZE, 'spitter'));

    // Drones near armory
    enemies.push(new Enemy(19 * TILE_SIZE, 7 * TILE_SIZE, 'drone'));
    enemies.push(new Enemy(20 * TILE_SIZE, 9 * TILE_SIZE, 'drone'));

    // Brute in medical
    enemies.push(new Enemy(11 * TILE_SIZE, 2 * TILE_SIZE, 'brute'));
}

// Draw functions
function drawTile(x, y, type) {
    const screenX = x * TILE_SIZE - cameraX;
    const screenY = y * TILE_SIZE - cameraY;

    // Culling
    if (screenX < -TILE_SIZE || screenX > canvas.width ||
        screenY < -TILE_SIZE || screenY > canvas.height) return;

    // Seeded random for consistent tile variations
    const seed = x * 1000 + y;
    const rand = (n) => ((seed * 9301 + 49297) % 233280) / 233280 * n;

    switch (type) {
        case 0: // Void
            ctx.fillStyle = COLORS.void;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            break;
        case 1: // Floor - industrial metal grating
            // Base floor color
            ctx.fillStyle = COLORS.floor;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Grid pattern
            ctx.fillStyle = COLORS.floorDark;
            ctx.fillRect(screenX, screenY, 2, TILE_SIZE);
            ctx.fillRect(screenX, screenY, TILE_SIZE, 2);
            ctx.fillRect(screenX + 15, screenY, 2, TILE_SIZE);
            ctx.fillRect(screenX, screenY + 15, TILE_SIZE, 2);

            // Occasional floor details
            const floorVariant = (x + y * 7) % 6;
            if (floorVariant === 0) {
                // Grate pattern
                ctx.fillStyle = COLORS.floorDark;
                for (let i = 4; i < 28; i += 4) {
                    ctx.fillRect(screenX + i, screenY + 4, 1, 24);
                }
            } else if (floorVariant === 1) {
                // Worn center
                ctx.fillStyle = COLORS.floorDetail;
                ctx.fillRect(screenX + 6, screenY + 6, 20, 20);
            } else if (floorVariant === 2) {
                // Drain
                ctx.fillStyle = COLORS.floorDark;
                ctx.beginPath();
                ctx.arc(screenX + 16, screenY + 16, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#1A1A1A';
                ctx.beginPath();
                ctx.arc(screenX + 16, screenY + 16, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
        case 2: // Wall - industrial metal panels
            // Base wall - darker
            ctx.fillStyle = COLORS.wall;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // 3D bevel effect
            ctx.fillStyle = COLORS.wallLight;
            ctx.fillRect(screenX, screenY, TILE_SIZE, 3);
            ctx.fillRect(screenX, screenY, 3, TILE_SIZE);

            ctx.fillStyle = COLORS.wallDark;
            ctx.fillRect(screenX, screenY + TILE_SIZE - 3, TILE_SIZE, 3);
            ctx.fillRect(screenX + TILE_SIZE - 3, screenY, 3, TILE_SIZE);

            // Inner panel
            ctx.fillStyle = COLORS.wallPanel;
            ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);

            // Panel border
            ctx.strokeStyle = COLORS.wallDark;
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX + 5, screenY + 5, TILE_SIZE - 10, TILE_SIZE - 10);

            // Rivets in corners
            ctx.fillStyle = COLORS.wallLight;
            ctx.beginPath();
            ctx.arc(screenX + 6, screenY + 6, 2, 0, Math.PI * 2);
            ctx.arc(screenX + TILE_SIZE - 6, screenY + 6, 2, 0, Math.PI * 2);
            ctx.arc(screenX + 6, screenY + TILE_SIZE - 6, 2, 0, Math.PI * 2);
            ctx.arc(screenX + TILE_SIZE - 6, screenY + TILE_SIZE - 6, 2, 0, Math.PI * 2);
            ctx.fill();

            // Some walls have warning stripes
            if ((x + y) % 8 === 0) {
                ctx.fillStyle = '#AA6600';
                ctx.fillRect(screenX + 8, screenY + 12, 16, 4);
                ctx.fillRect(screenX + 8, screenY + 18, 16, 4);
            }
            break;
    }
}

function drawLevel() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            drawTile(x, y, levelMap[y][x]);
        }
    }
}

function drawHUD() {
    // Top HUD bar - very dark like reference
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, 28);
    // Top edge highlight
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(0, 27, canvas.width, 1);

    // Bottom HUD bar
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(0, canvas.height - 28, canvas.width, 1);

    // 1UP label
    ctx.fillStyle = COLORS.hudYellow;
    ctx.font = 'bold 12px monospace';
    ctx.fillText('1UP', 8, 18);

    // Lives - small bars
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText('LIVES', 60, 18);
    for (let i = 0; i < player.lives; i++) {
        ctx.fillStyle = COLORS.health;
        ctx.fillRect(120 + i * 18, 8, 14, 10);
        // Highlight
        ctx.fillStyle = '#FF6666';
        ctx.fillRect(120 + i * 18, 8, 14, 3);
    }

    // Ammo section
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText('AMMO', 220, 18);
    // Ammo bar background
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(280, 8, 100, 12);
    // Ammo bar border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(280, 8, 100, 12);
    // Ammo fill
    ctx.fillStyle = COLORS.hudYellow;
    const ammoWidth = (player.ammo / player.maxAmmo) * 98;
    ctx.fillRect(281, 9, ammoWidth, 10);
    // Ammo number
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText(player.ammo.toString(), 390, 18);

    // Keys section
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText('KEYS', 500, 18);
    // Key slots - styled like keycards
    const keyColors = [
        { key: 'green', color: COLORS.keyGreen, dark: '#006600' },
        { key: 'blue', color: COLORS.keyBlue, dark: '#003366' },
        { key: 'yellow', color: COLORS.keyYellow, dark: '#666600' },
        { key: 'red', color: COLORS.keyRed, dark: '#660000' }
    ];
    keyColors.forEach((k, i) => {
        const kx = 560 + i * 24;
        ctx.fillStyle = player.keys[k.key] ? k.dark : '#1A1A1A';
        ctx.fillRect(kx, 6, 20, 16);
        if (player.keys[k.key]) {
            ctx.fillStyle = k.color;
            ctx.fillRect(kx + 2, 8, 16, 8);
        }
        ctx.strokeStyle = '#333';
        ctx.strokeRect(kx, 6, 20, 16);
    });

    // Bottom HUD - Health
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText('HEALTH', 8, canvas.height - 10);
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(80, canvas.height - 20, 140, 12);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(80, canvas.height - 20, 140, 12);
    ctx.fillStyle = COLORS.health;
    const healthWidth = (player.health / player.maxHealth) * 138;
    ctx.fillRect(81, canvas.height - 19, healthWidth, 10);
    // Health glow when low
    if (player.health < 30) {
        ctx.fillStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(Date.now() / 100) * 0.2})`;
        ctx.fillRect(81, canvas.height - 19, healthWidth, 10);
    }

    // Shield bar
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText('SHIELD', 240, canvas.height - 10);
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(310, canvas.height - 20, 100, 12);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(310, canvas.height - 20, 100, 12);
    ctx.fillStyle = COLORS.shield;
    const shieldWidth = (player.shield / player.maxShield) * 98;
    ctx.fillRect(311, canvas.height - 19, shieldWidth, 10);

    // Stamina (small bar)
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '10px monospace';
    ctx.fillText('STAM', 430, canvas.height - 10);
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(470, canvas.height - 18, 60, 8);
    ctx.fillStyle = '#44AA44';
    const staminaWidth = (player.stamina / player.maxStamina) * 58;
    ctx.fillRect(471, canvas.height - 17, staminaWidth, 6);

    // Credits
    ctx.fillStyle = COLORS.hudYellow;
    ctx.font = 'bold 12px monospace';
    ctx.fillText('$' + player.credits, canvas.width - 80, canvas.height - 10);
}

function drawBullets() {
    bullets.forEach(b => {
        ctx.save();
        ctx.translate(b.x - cameraX, b.y - cameraY);
        ctx.rotate(Math.atan2(b.vy, b.vx));

        if (b.fromPlayer) {
            // Player bullets - orange/yellow
            ctx.fillStyle = COLORS.bullet;
            ctx.fillRect(-8, -2, 16, 4);
            // Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = COLORS.bullet;
            ctx.fillRect(-6, -1, 12, 2);
        } else {
            // Enemy bullets - green acid
            ctx.fillStyle = b.color || '#88FF88';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });
}

function drawParticles() {
    particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - cameraX, p.y - cameraY, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawPickups() {
    pickups.forEach(p => {
        ctx.save();
        ctx.translate(p.x - cameraX, p.y - cameraY);

        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.type === 'health' ? COLORS.health : COLORS.hudYellow;

        if (p.type === 'health') {
            ctx.fillStyle = COLORS.health;
            ctx.fillRect(-8, -3, 16, 6);
            ctx.fillRect(-3, -8, 6, 16);
        } else if (p.type === 'ammo') {
            ctx.fillStyle = COLORS.hudYellow;
            ctx.fillRect(-6, -8, 12, 16);
            ctx.fillStyle = '#AA8800';
            ctx.fillRect(-4, -6, 8, 12);
        }

        ctx.restore();
    });
}

function drawTitle() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STATION BREACH', canvas.width / 2, 200);

    // Subtitle
    ctx.font = '20px monospace';
    ctx.fillStyle = COLORS.hudYellow;
    ctx.fillText('A Top-Down Twin-Stick Shooter', canvas.width / 2, 250);

    // Instructions
    ctx.font = '16px monospace';
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText('WASD - Move', canvas.width / 2, 350);
    ctx.fillText('Mouse - Aim', canvas.width / 2, 380);
    ctx.fillText('Click - Shoot', canvas.width / 2, 410);
    ctx.fillText('Shift - Sprint', canvas.width / 2, 440);

    // Start prompt
    ctx.fillStyle = Math.sin(Date.now() / 300) > 0 ? COLORS.hudYellow : COLORS.hudText;
    ctx.font = 'bold 24px monospace';
    ctx.fillText('CLICK TO START', canvas.width / 2, 520);

    ctx.textAlign = 'left';
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.health;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION FAILED', canvas.width / 2, 250);

    ctx.fillStyle = COLORS.hudText;
    ctx.font = '20px monospace';
    ctx.fillText('Enemies Killed: ' + (10 - enemies.length), canvas.width / 2, 320);
    ctx.fillText('Credits Earned: $' + player.credits, canvas.width / 2, 350);

    ctx.fillStyle = Math.sin(Date.now() / 300) > 0 ? COLORS.hudYellow : COLORS.hudText;
    ctx.font = 'bold 20px monospace';
    ctx.fillText('CLICK TO RESTART', canvas.width / 2, 450);

    ctx.textAlign = 'left';
}

// Update functions
function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;

        // Wall collision
        if (isColliding(b.x, b.y, 4, 4)) {
            // Spark particles
            for (let j = 0; j < 5; j++) {
                particles.push({
                    x: b.x,
                    y: b.y,
                    vx: (Math.random() - 0.5) * 150,
                    vy: (Math.random() - 0.5) * 150,
                    life: 0.2,
                    maxLife: 0.2,
                    color: b.fromPlayer ? COLORS.hudYellow : '#88FF88',
                    size: 3
                });
            }
            bullets.splice(i, 1);
            continue;
        }

        // Hit detection
        if (b.fromPlayer) {
            // Check enemy hits
            for (let e of enemies) {
                const dx = b.x - e.x;
                const dy = b.y - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < e.width / 2 + 4) {
                    e.takeDamage(b.damage, Math.atan2(b.vy, b.vx));
                    bullets.splice(i, 1);
                    break;
                }
            }
        } else {
            // Check player hit
            const dx = b.x - player.x;
            const dy = b.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 20) {
                player.takeDamage(b.damage);
                bullets.splice(i, 1);
                continue;
            }
        }

        if (b.life <= 0) {
            bullets.splice(i, 1);
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= dt;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dx = p.x - player.x;
        const dy = p.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 32) {
            if (p.type === 'health' && player.health < player.maxHealth) {
                player.health = Math.min(player.health + 25, player.maxHealth);
                pickups.splice(i, 1);
            } else if (p.type === 'ammo' && player.ammo < player.maxAmmo) {
                player.ammo = Math.min(player.ammo + 30, player.maxAmmo);
                pickups.splice(i, 1);
            }
        }
    }
}

function updateCamera() {
    // Follow player smoothly
    const targetX = player.x - canvas.width / 2;
    const targetY = player.y - canvas.height / 2;

    cameraX += (targetX - cameraX) * 0.1;
    cameraY += (targetY - cameraY) * 0.1;

    // Clamp to level bounds
    cameraX = Math.max(0, Math.min(cameraX, MAP_WIDTH * TILE_SIZE - canvas.width));
    cameraY = Math.max(0, Math.min(cameraY, MAP_HEIGHT * TILE_SIZE - canvas.height));

    // Screen shake
    if (shakeDuration > 0) {
        cameraX += (Math.random() - 0.5) * shakeAmount * 2;
        cameraY += (Math.random() - 0.5) * shakeAmount * 2;
        shakeDuration -= 1/60;
    }
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'title') {
        drawTitle();
    } else if (gameState === 'playing') {
        // Update
        player.update(dt);

        for (let i = enemies.length - 1; i >= 0; i--) {
            if (!enemies[i].update(dt)) {
                enemies.splice(i, 1);
            }
        }

        updateBullets(dt);
        updateParticles(dt);
        updatePickups(dt);
        updateCamera();

        // Draw
        drawLevel();
        drawPickups();
        enemies.forEach(e => e.draw());
        player.draw();
        drawBullets();
        drawParticles();
        drawHUD();

        // Check win condition
        if (enemies.length === 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 36px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('AREA CLEARED!', canvas.width / 2, canvas.height / 2);
            ctx.textAlign = 'left';
        }
    } else if (gameState === 'gameover') {
        drawLevel();
        enemies.forEach(e => e.draw());
        drawBullets();
        drawParticles();
        drawHUD();
        drawGameOver();
    }

    requestAnimationFrame(gameLoop);
}

// Initialize game
function initGame() {
    generateLevel();
    player = new Player(spawnPoint.x, spawnPoint.y);
    spawnEnemies();
    bullets = [];
    particles = [];
    pickups = [];
    gameState = 'playing';
}

// Input event listeners
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;

    // Reload
    if (e.key.toLowerCase() === 'r' && gameState === 'playing') {
        player.ammo = player.maxAmmo;
    }
});

document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', e => {
    mouseDown = true;

    if (gameState === 'title') {
        initGame();
    } else if (gameState === 'gameover') {
        initGame();
    }
});

canvas.addEventListener('mouseup', () => {
    mouseDown = false;
});

// Prevent context menu on right click
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Expose game state for testing
window.gameState = () => ({
    state: gameState,
    playerHealth: player ? player.health : 0,
    playerAmmo: player ? player.ammo : 0,
    enemies: enemies.length,
    bullets: bullets.length
});
window.startGame = initGame;

// Start
requestAnimationFrame(gameLoop);
