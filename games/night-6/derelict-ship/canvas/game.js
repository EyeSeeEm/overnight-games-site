// DERELICT - Survival Horror Game
// Canvas Implementation with Test Harness

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════
const TILE_SIZE = 32;
const PLAYER_SIZE = 28;
const VIEW_WIDTH = 1280;
const VIEW_HEIGHT = 720;

const VISION_CONE_ANGLE = Math.PI / 2; // 90 degrees
const VISION_RANGE_LIT = 400;
const VISION_RANGE_DARK = 200;
const VISION_RANGE_NO_LIGHT = 80;

const O2_DRAIN_IDLE = 0.5; // per second
const O2_DRAIN_WALK = 0.67;
const O2_DRAIN_RUN = 1.33;
const O2_DRAIN_COMBAT = 2;

const INTEGRITY_DECAY = 1 / 45; // per second

const SECTORS = [
    { name: 'CREW QUARTERS', rooms: 5, enemies: ['crawler', 'crawler', 'crawler'] },
    { name: 'MEDICAL BAY', rooms: 6, enemies: ['shambler', 'shambler', 'shambler', 'shambler'], boss: 'warden' },
    { name: 'ENGINEERING', rooms: 7, enemies: ['stalker', 'stalker', 'crawler', 'crawler', 'crawler'] },
    { name: 'CARGO HOLD', rooms: 6, enemies: ['bloater', 'bloater', 'shambler', 'shambler'], boss: 'cargomaster' },
    { name: 'RESEARCH LAB', rooms: 7, enemies: ['hunter', 'hunter', 'stalker', 'stalker'] },
    { name: 'COMMAND BRIDGE', rooms: 5, enemies: ['mimic', 'mimic'], boss: 'gestalt' }
];

const ENEMY_STATS = {
    crawler: { hp: 25, damage: 10, speed: 70, size: 24, color: '#4a2', detectRange: 200 },
    shambler: { hp: 50, damage: 18, speed: 45, size: 28, color: '#642', detectRange: 180 },
    stalker: { hp: 40, damage: 15, speed: 130, size: 24, color: '#224', detectRange: 300 },
    bloater: { hp: 80, damage: 8, speed: 35, size: 36, color: '#452', detectRange: 150, explodes: true },
    hunter: { hp: 70, damage: 25, speed: 160, size: 32, color: '#622', detectRange: 400 },
    mimic: { hp: 45, damage: 22, speed: 90, size: 28, color: '#444', detectRange: 80, disguised: true },
    warden: { hp: 100, damage: 22, speed: 90, size: 40, color: '#446', detectRange: 280, isBoss: true },
    cargomaster: { hp: 130, damage: 28, speed: 55, size: 48, color: '#664', detectRange: 200, isBoss: true },
    gestalt: { hp: 250, damage: 40, speed: 55, size: 64, color: '#633', detectRange: 500, isBoss: true }
};

// ═══════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════
let gameState = 'menu'; // menu, playing, gameover, victory, spaceship
let gamePaused = true;
let lastTime = 0;
let deltaTime = 0;

// Player
let player = null;

// World
let currentSector = 0;
let currentRoom = 0;
let rooms = [];
let enemies = [];
let items = [];
let projectiles = [];
let particles = [];

// Ship systems
let powerAvailable = 4;
let powerMax = 8;
let powerAllocation = {
    lights: 1,
    doors: 1,
    scanners: 0,
    lifeSupport: 2,
    security: 0,
    engines: 0
};

let structuralIntegrity = 100;
let keycards = { blue: false, red: false, gold: false };

// Input
let keys = {};
let mouseX = 0;
let mouseY = 0;
let mouseDown = false;
let activeHarnessKeys = new Set();

// Camera
let cameraX = 0;
let cameraY = 0;

// Stats tracking
let stats = {
    enemiesKilled: 0,
    roomsExplored: 0,
    itemsUsed: 0,
    damageTaken: 0,
    timeSurvived: 0,
    o2Used: 0
};

// ═══════════════════════════════════════════════════════════
// PLAYER CLASS
// ═══════════════════════════════════════════════════════════
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.oxygen = 100;
        this.maxOxygen = 100;
        this.speed = 120;
        this.runSpeed = 200;
        this.angle = 0;
        this.isRunning = false;
        this.flashlightOn = true;
        this.flashlightBattery = 60;
        this.maxFlashlightBattery = 60;
        this.attackCooldown = 0;
        this.attackRate = 0.6;
        this.damage = 25;
        this.invincibleTime = 0;
        this.inventory = [];
        this.maxInventory = 6;
        this.weapon = { name: 'Pipe', damage: 25, range: 70, type: 'melee' };
    }

    update(dt) {
        // Movement
        let moveX = 0, moveY = 0;
        const effectiveKeys = { ...keys };
        activeHarnessKeys.forEach(k => effectiveKeys[k.toLowerCase()] = true);

        if (effectiveKeys['w'] || effectiveKeys['arrowup']) moveY -= 1;
        if (effectiveKeys['s'] || effectiveKeys['arrowdown']) moveY += 1;
        if (effectiveKeys['a'] || effectiveKeys['arrowleft']) moveX -= 1;
        if (effectiveKeys['d'] || effectiveKeys['arrowright']) moveX += 1;

        this.isRunning = effectiveKeys['shift'];
        const speed = this.isRunning ? this.runSpeed : this.speed;

        if (moveX !== 0 || moveY !== 0) {
            const len = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= len;
            moveY /= len;
            this.vx = moveX * speed;
            this.vy = moveY * speed;
        } else {
            this.vx *= 0.8;
            this.vy *= 0.8;
        }

        // Apply movement with collision
        const newX = this.x + this.vx * dt;
        const newY = this.y + this.vy * dt;

        if (!this.collidesWithWall(newX, this.y)) this.x = newX;
        if (!this.collidesWithWall(this.x, newY)) this.y = newY;

        // Face mouse
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        this.angle = Math.atan2(mouseY - screenY, mouseX - screenX);

        // O2 drain
        let o2Drain = O2_DRAIN_IDLE;
        if (Math.abs(this.vx) > 10 || Math.abs(this.vy) > 10) {
            o2Drain = this.isRunning ? O2_DRAIN_RUN : O2_DRAIN_WALK;
        }

        // Life support reduces drain
        if (powerAllocation.lifeSupport >= 2) {
            o2Drain *= 0.7;
        }

        this.oxygen -= o2Drain * dt;
        stats.o2Used += o2Drain * dt;

        // Flashlight drain/recharge
        if (this.flashlightOn) {
            this.flashlightBattery -= dt;
            if (this.flashlightBattery <= 0) {
                this.flashlightBattery = 0;
                this.flashlightOn = false;
            }
        } else {
            this.flashlightBattery = Math.min(this.maxFlashlightBattery, this.flashlightBattery + dt * 0.5);
        }

        // Cooldowns
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.invincibleTime > 0) this.invincibleTime -= dt;

        // Check death
        if (this.oxygen <= 0) {
            this.die('suffocation');
        }
        if (this.health <= 0) {
            this.die('death');
        }
    }

    collidesWithWall(x, y) {
        const room = rooms[currentRoom];
        if (!room) return false;

        const halfSize = PLAYER_SIZE / 2;
        const corners = [
            { x: x - halfSize, y: y - halfSize },
            { x: x + halfSize, y: y - halfSize },
            { x: x - halfSize, y: y + halfSize },
            { x: x + halfSize, y: y + halfSize }
        ];

        for (const corner of corners) {
            const tileX = Math.floor(corner.x / TILE_SIZE);
            const tileY = Math.floor(corner.y / TILE_SIZE);
            if (room.getTile(tileX, tileY) === 1) return true;
        }
        return false;
    }

    attack() {
        if (this.attackCooldown > 0) return;

        this.attackCooldown = this.attackRate;
        this.oxygen -= O2_DRAIN_COMBAT;

        if (this.weapon.type === 'melee') {
            // Melee attack - check enemies in range and general direction
            const attackDist = this.weapon.range;
            let hitSomething = false;

            for (const enemy of enemies) {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);

                // Hit if within weapon range + enemy size
                if (dist < attackDist + enemy.size / 2 + 20) {
                    // Calculate angle to enemy
                    const angleToEnemy = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                    let angleDiff = angleToEnemy - this.angle;

                    // Normalize angle difference to -PI to PI
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                    // Hit if enemy is within 90 degrees of facing direction (wide arc)
                    if (Math.abs(angleDiff) < Math.PI / 2) {
                        enemy.takeDamage(this.weapon.damage);
                        spawnParticles(enemy.x, enemy.y, '#f00', 8);
                        hitSomething = true;
                        console.log(`[COMBAT] Hit ${enemy.type} for ${this.weapon.damage}, remaining HP: ${enemy.hp}`);
                    }
                }
            }

            // Visual feedback
            const attackX = this.x + Math.cos(this.angle) * attackDist;
            const attackY = this.y + Math.sin(this.angle) * attackDist;
            spawnParticles(attackX, attackY, hitSomething ? '#f80' : '#ff0', 5);
        } else {
            // Ranged attack
            projectiles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(this.angle) * 400,
                vy: Math.sin(this.angle) * 400,
                damage: this.weapon.damage,
                friendly: true
            });
        }
    }

    takeDamage(amount) {
        if (this.invincibleTime > 0) return;

        this.health -= amount;
        this.invincibleTime = 1;
        stats.damageTaken += amount;
        spawnParticles(this.x, this.y, '#f00', 8);

        if (this.health <= 0) {
            this.die('death');
        }
    }

    die(cause) {
        gameState = 'gameover';
        const messages = {
            suffocation: 'Your lungs burned for oxygen that never came.',
            death: 'Your body joins the ship\'s other victims.',
            ship: 'The ship tears itself apart around you.'
        };
        document.getElementById('deathMessage').textContent = messages[cause] || 'You died.';
        document.getElementById('gameoverScreen').classList.remove('hidden');
    }

    useItem(slot) {
        if (slot >= this.inventory.length) return;
        const item = this.inventory[slot];
        if (!item) return;

        switch (item.type) {
            case 'o2_small':
                this.oxygen = Math.min(this.maxOxygen, this.oxygen + 25);
                break;
            case 'o2_large':
                this.oxygen = Math.min(this.maxOxygen, this.oxygen + 50);
                break;
            case 'medkit_small':
                this.health = Math.min(this.maxHealth, this.health + 30);
                break;
            case 'medkit_large':
                this.health = Math.min(this.maxHealth, this.health + 60);
                break;
        }

        this.inventory.splice(slot, 1);
        stats.itemsUsed++;
    }

    addItem(item) {
        if (this.inventory.length < this.maxInventory) {
            this.inventory.push(item);
            return true;
        }
        return false;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - cameraX, this.y - cameraY);
        ctx.rotate(this.angle);

        // Body
        if (this.invincibleTime > 0 && Math.floor(this.invincibleTime * 10) % 2) {
            ctx.globalAlpha = 0.5;
        }

        ctx.fillStyle = '#0af';
        ctx.fillRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);

        // Direction indicator
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, -4, PLAYER_SIZE / 2 + 5, 8);

        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════
// ENEMY CLASS
// ═══════════════════════════════════════════════════════════
class Enemy {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        const stats = ENEMY_STATS[type];
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.damage = stats.damage;
        this.speed = stats.speed;
        this.size = stats.size;
        this.color = stats.color;
        this.detectRange = stats.detectRange;
        this.isBoss = stats.isBoss || false;
        this.explodes = stats.explodes || false;
        this.disguised = stats.disguised || false;

        this.state = 'idle'; // idle, patrol, chase, attack
        this.targetX = x;
        this.targetY = y;
        this.attackCooldown = 0;
        this.stateTimer = 0;
        this.alertLevel = 0;
        this.revealed = !this.disguised;
    }

    update(dt) {
        if (!player) return;

        const distToPlayer = Math.hypot(this.x - player.x, this.y - player.y);

        // Mimic reveal
        if (this.disguised && !this.revealed && distToPlayer < 80) {
            this.revealed = true;
            this.state = 'chase';
        }

        if (!this.revealed) return;

        // State machine
        switch (this.state) {
            case 'idle':
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    this.state = 'patrol';
                    this.pickPatrolTarget();
                }
                if (distToPlayer < this.detectRange && this.canSeePlayer()) {
                    this.state = 'chase';
                    this.alertLevel = 100;
                }
                break;

            case 'patrol':
                this.moveToward(this.targetX, this.targetY, dt, 0.5);
                if (Math.hypot(this.x - this.targetX, this.y - this.targetY) < 20) {
                    this.state = 'idle';
                    this.stateTimer = 2 + Math.random() * 3;
                }
                if (distToPlayer < this.detectRange && this.canSeePlayer()) {
                    this.state = 'chase';
                    this.alertLevel = 100;
                }
                break;

            case 'chase':
                this.moveToward(player.x, player.y, dt, 1);
                if (distToPlayer < this.size + PLAYER_SIZE / 2 + 10) {
                    this.state = 'attack';
                }
                if (distToPlayer > this.detectRange * 1.5) {
                    this.alertLevel -= dt * 20;
                    if (this.alertLevel <= 0) {
                        this.state = 'patrol';
                        this.pickPatrolTarget();
                    }
                }
                break;

            case 'attack':
                if (this.attackCooldown <= 0) {
                    this.attackPlayer();
                    this.attackCooldown = 1 + Math.random() * 0.5;
                }
                this.attackCooldown -= dt;
                if (distToPlayer > this.size + PLAYER_SIZE / 2 + 30) {
                    this.state = 'chase';
                }
                break;
        }
    }

    canSeePlayer() {
        // Simple LOS check
        return true; // Simplified for now
    }

    pickPatrolTarget() {
        const room = rooms[currentRoom];
        if (!room) return;

        this.targetX = this.x + (Math.random() - 0.5) * 200;
        this.targetY = this.y + (Math.random() - 0.5) * 200;

        // Clamp to room bounds
        this.targetX = Math.max(100, Math.min(room.width * TILE_SIZE - 100, this.targetX));
        this.targetY = Math.max(100, Math.min(room.height * TILE_SIZE - 100, this.targetY));
    }

    moveToward(tx, ty, dt, speedMult) {
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
            this.x += (dx / dist) * this.speed * speedMult * dt;
            this.y += (dy / dist) * this.speed * speedMult * dt;
        }
    }

    attackPlayer() {
        const dist = Math.hypot(this.x - player.x, this.y - player.y);
        if (dist < this.size + PLAYER_SIZE / 2 + 20) {
            player.takeDamage(this.damage);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.state = 'chase';
        this.alertLevel = 100;

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        const idx = enemies.indexOf(this);
        if (idx >= 0) enemies.splice(idx, 1);
        stats.enemiesKilled++;
        spawnParticles(this.x, this.y, this.color, 15);

        // Explode if bloater
        if (this.explodes) {
            const explosionDist = Math.hypot(this.x - player.x, this.y - player.y);
            if (explosionDist < 100) {
                player.takeDamage(40);
            }
            spawnParticles(this.x, this.y, '#fa0', 30);
        }

        // Drop items
        if (Math.random() < 0.3) {
            items.push(createItem(this.x, this.y));
        }

        // Boss drops keycard
        if (this.isBoss) {
            if (currentSector === 1) keycards.blue = true;
            if (currentSector === 3) keycards.red = true;
            if (currentSector === 5) keycards.gold = true;
        }
    }

    draw() {
        if (!this.revealed) {
            // Draw as crate if disguised
            ctx.fillStyle = '#543';
            ctx.fillRect(this.x - cameraX - 16, this.y - cameraY - 16, 32, 32);
            ctx.strokeStyle = '#321';
            ctx.strokeRect(this.x - cameraX - 16, this.y - cameraY - 16, 32, 32);
            return;
        }

        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#f00';
        const eyeAngle = Math.atan2(player.y - this.y, player.x - this.x);
        ctx.beginPath();
        ctx.arc(screenX + Math.cos(eyeAngle) * 8, screenY + Math.sin(eyeAngle) * 8 - 3, 4, 0, Math.PI * 2);
        ctx.arc(screenX + Math.cos(eyeAngle) * 8, screenY + Math.sin(eyeAngle) * 8 + 3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Health bar for bosses
        if (this.isBoss) {
            ctx.fillStyle = '#400';
            ctx.fillRect(screenX - 30, screenY - this.size / 2 - 15, 60, 8);
            ctx.fillStyle = '#f00';
            ctx.fillRect(screenX - 30, screenY - this.size / 2 - 15, 60 * (this.hp / this.maxHp), 8);
        }
    }
}

// ═══════════════════════════════════════════════════════════
// ROOM CLASS
// ═══════════════════════════════════════════════════════════
class Room {
    constructor(width, height, type) {
        this.width = width;
        this.height = height;
        this.type = type;
        this.tiles = [];
        this.explored = false;
        this.lit = false;
        this.doors = [];

        this.generate();
    }

    generate() {
        // Fill with floor
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Walls on edges
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    this.tiles[y][x] = 1; // Wall
                } else {
                    this.tiles[y][x] = 0; // Floor
                }
            }
        }

        // Add some internal walls/obstacles
        const numObstacles = Math.floor(Math.random() * 5) + 2;
        for (let i = 0; i < numObstacles; i++) {
            const ox = Math.floor(Math.random() * (this.width - 6)) + 3;
            const oy = Math.floor(Math.random() * (this.height - 6)) + 3;
            const ow = Math.floor(Math.random() * 3) + 1;
            const oh = Math.floor(Math.random() * 3) + 1;

            for (let dy = 0; dy < oh; dy++) {
                for (let dx = 0; dx < ow; dx++) {
                    if (this.tiles[oy + dy] && this.tiles[oy + dy][ox + dx] !== undefined) {
                        this.tiles[oy + dy][ox + dx] = 1;
                    }
                }
            }
        }

        // Add doors
        this.doors.push({ x: Math.floor(this.width / 2), y: 0, dir: 'north', locked: false });
        this.doors.push({ x: Math.floor(this.width / 2), y: this.height - 1, dir: 'south', locked: false });
        this.doors.push({ x: 0, y: Math.floor(this.height / 2), dir: 'west', locked: false });
        this.doors.push({ x: this.width - 1, y: Math.floor(this.height / 2), dir: 'east', locked: false });

        // Clear door tiles
        for (const door of this.doors) {
            this.tiles[door.y][door.x] = 2; // Door
        }
    }

    getTile(x, y) {
        if (y < 0 || y >= this.height || x < 0 || x >= this.width) return 1;
        return this.tiles[y][x];
    }

    draw() {
        const isLit = powerAllocation.lights > 0 || player.flashlightOn;
        const ambientLight = 0.3; // Base ambient so it's not completely dark

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const screenX = x * TILE_SIZE - cameraX;
                const screenY = y * TILE_SIZE - cameraY;

                // Skip if off screen
                if (screenX < -TILE_SIZE || screenX > VIEW_WIDTH ||
                    screenY < -TILE_SIZE || screenY > VIEW_HEIGHT) continue;

                const tile = this.tiles[y][x];

                switch (tile) {
                    case 0: // Floor
                        ctx.fillStyle = '#1a1a2e';
                        break;
                    case 1: // Wall
                        ctx.fillStyle = '#2d2d44';
                        break;
                    case 2: // Door
                        ctx.fillStyle = powerAllocation.doors > 0 ? '#0a4' : '#440';
                        break;
                }

                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                // Grid lines
                ctx.strokeStyle = '#111';
                ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════
// VISION CONE RENDERING
// ═══════════════════════════════════════════════════════════
function drawVisionCone() {
    if (!player) return;

    const screenX = player.x - cameraX;
    const screenY = player.y - cameraY;

    // Determine vision range
    let visionRange = VISION_RANGE_NO_LIGHT;
    if (powerAllocation.lights > 0) {
        visionRange = VISION_RANGE_LIT;
    } else if (player.flashlightOn) {
        visionRange = VISION_RANGE_DARK;
    }

    // Create darkness overlay
    ctx.save();

    // Fill entire screen with darkness
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    // Cut out vision cone using composite operation
    ctx.globalCompositeOperation = 'destination-out';

    // Draw vision cone
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);

    const startAngle = player.angle - VISION_CONE_ANGLE / 2;
    const endAngle = player.angle + VISION_CONE_ANGLE / 2;

    // Draw arc segments
    const segments = 30;
    for (let i = 0; i <= segments; i++) {
        const a = startAngle + (endAngle - startAngle) * (i / segments);
        const rayX = screenX + Math.cos(a) * visionRange;
        const rayY = screenY + Math.sin(a) * visionRange;
        ctx.lineTo(rayX, rayY);
    }

    ctx.closePath();
    ctx.fill();

    // Add small ambient circle around player
    ctx.beginPath();
    ctx.arc(screenX, screenY, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function isInVisionCone(x, y) {
    if (!player) return false;

    const dx = x - player.x;
    const dy = y - player.y;
    const dist = Math.hypot(dx, dy);

    let visionRange = VISION_RANGE_NO_LIGHT;
    if (powerAllocation.lights > 0) {
        visionRange = VISION_RANGE_LIT;
    } else if (player.flashlightOn) {
        visionRange = VISION_RANGE_DARK;
    }

    if (dist > visionRange) return false;

    const angleToTarget = Math.atan2(dy, dx);
    let angleDiff = angleToTarget - player.angle;

    // Normalize angle
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    return Math.abs(angleDiff) <= VISION_CONE_ANGLE / 2;
}

// ═══════════════════════════════════════════════════════════
// ITEMS
// ═══════════════════════════════════════════════════════════
function createItem(x, y, type) {
    const types = ['o2_small', 'o2_large', 'medkit_small', 'medkit_large'];
    const weights = [0.4, 0.2, 0.3, 0.1];

    if (!type) {
        const r = Math.random();
        let sum = 0;
        for (let i = 0; i < types.length; i++) {
            sum += weights[i];
            if (r < sum) {
                type = types[i];
                break;
            }
        }
    }

    const colors = {
        o2_small: '#0af',
        o2_large: '#06f',
        medkit_small: '#f44',
        medkit_large: '#a00'
    };

    const names = {
        o2_small: 'O2 (S)',
        o2_large: 'O2 (L)',
        medkit_small: 'Med (S)',
        medkit_large: 'Med (L)'
    };

    return {
        x, y,
        type,
        color: colors[type],
        name: names[type]
    };
}

function drawItems() {
    for (const item of items) {
        if (!isInVisionCone(item.x, item.y)) continue;

        const screenX = item.x - cameraX;
        const screenY = item.y - cameraY;

        ctx.fillStyle = item.color;
        ctx.fillRect(screenX - 10, screenY - 10, 20, 20);

        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.name, screenX, screenY + 25);
    }
}

function checkItemPickup() {
    if (!player) return;

    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dist = Math.hypot(item.x - player.x, item.y - player.y);

        if (dist < 30) {
            if (player.addItem(item)) {
                items.splice(i, 1);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════
// PARTICLES
// ═══════════════════════════════════════════════════════════
function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            color,
            life: 0.5 + Math.random() * 0.5
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x - cameraX - 2, p.y - cameraY - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════
// PROJECTILES
// ═══════════════════════════════════════════════════════════
function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Check wall collision
        const room = rooms[currentRoom];
        if (room) {
            const tileX = Math.floor(p.x / TILE_SIZE);
            const tileY = Math.floor(p.y / TILE_SIZE);
            if (room.getTile(tileX, tileY) === 1) {
                projectiles.splice(i, 1);
                continue;
            }
        }

        // Check enemy collision
        if (p.friendly) {
            for (const enemy of enemies) {
                const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
                if (dist < enemy.size / 2 + 5) {
                    enemy.takeDamage(p.damage);
                    projectiles.splice(i, 1);
                    break;
                }
            }
        }
    }
}

function drawProjectiles() {
    for (const p of projectiles) {
        ctx.fillStyle = p.friendly ? '#ff0' : '#f00';
        ctx.beginPath();
        ctx.arc(p.x - cameraX, p.y - cameraY, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ═══════════════════════════════════════════════════════════
// GAME SETUP
// ═══════════════════════════════════════════════════════════
function generateSector(sectorIdx) {
    rooms = [];
    enemies = [];
    items = [];

    const sector = SECTORS[sectorIdx];

    // Generate rooms for this sector
    for (let i = 0; i < sector.rooms; i++) {
        const width = 15 + Math.floor(Math.random() * 10);
        const height = 12 + Math.floor(Math.random() * 8);
        rooms.push(new Room(width, height, 'normal'));
    }

    // Spawn enemies
    for (const enemyType of sector.enemies) {
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const x = (2 + Math.random() * (room.width - 4)) * TILE_SIZE;
        const y = (2 + Math.random() * (room.height - 4)) * TILE_SIZE;
        enemies.push(new Enemy(enemyType, x, y));
    }

    // Add boss if present
    if (sector.boss) {
        const bossRoom = rooms[rooms.length - 1];
        enemies.push(new Enemy(sector.boss, bossRoom.width * TILE_SIZE / 2, bossRoom.height * TILE_SIZE / 2));
    }

    // Spawn items
    for (const room of rooms) {
        const numItems = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numItems; i++) {
            const x = (2 + Math.random() * (room.width - 4)) * TILE_SIZE;
            const y = (2 + Math.random() * (room.height - 4)) * TILE_SIZE;
            items.push(createItem(x, y));
        }
    }
}

function startGame() {
    gameState = 'playing';
    gamePaused = true;

    // Hide menus
    document.getElementById('menuScreen').classList.add('hidden');
    document.getElementById('gameoverScreen').classList.add('hidden');
    document.getElementById('victoryScreen').classList.add('hidden');

    // Reset stats
    stats = {
        enemiesKilled: 0,
        roomsExplored: 0,
        itemsUsed: 0,
        damageTaken: 0,
        timeSurvived: 0,
        o2Used: 0
    };

    // Reset ship
    currentSector = 0;
    currentRoom = 0;
    structuralIntegrity = 100;
    powerAvailable = 4;
    powerAllocation = { lights: 1, doors: 1, scanners: 0, lifeSupport: 2, security: 0, engines: 0 };
    keycards = { blue: false, red: false, gold: false };

    // Generate first sector
    generateSector(0);

    // Create player
    const startRoom = rooms[0];
    player = new Player(startRoom.width * TILE_SIZE / 2, startRoom.height * TILE_SIZE / 2);

    // Start items
    player.addItem(createItem(0, 0, 'o2_small'));
    player.addItem(createItem(0, 0, 'o2_small'));

    projectiles = [];
    particles = [];

    updateUI();
}

function progressToNextSector() {
    currentSector++;
    if (currentSector >= SECTORS.length) {
        // Victory!
        gameState = 'victory';
        document.getElementById('victoryScreen').classList.remove('hidden');
        document.getElementById('victoryStats').innerHTML = `
            Time: ${Math.floor(stats.timeSurvived)}s<br>
            Enemies: ${stats.enemiesKilled}<br>
            Damage: ${stats.damageTaken}
        `;
        return;
    }

    generateSector(currentSector);
    currentRoom = 0;

    const startRoom = rooms[0];
    player.x = startRoom.width * TILE_SIZE / 2;
    player.y = startRoom.height * TILE_SIZE / 2;
}

function enterSpaceshipPhase() {
    gameState = 'spaceship';
    document.getElementById('victoryScreen').classList.add('hidden');
    document.getElementById('spaceshipPhase').style.display = 'block';

    // Initialize spaceship phase
    initSpaceshipPhase();
}

// ═══════════════════════════════════════════════════════════
// SPACESHIP PHASE
// ═══════════════════════════════════════════════════════════
let spaceshipCanvas, spaceshipCtx;
let spaceship = null;
let derelicts = [];
let spaceStars = [];

function initSpaceshipPhase() {
    spaceshipCanvas = document.getElementById('spaceshipPhase');
    spaceshipCanvas.width = 1280;
    spaceshipCanvas.height = 720;
    spaceshipCtx = spaceshipCanvas.getContext('2d');

    spaceship = {
        x: 640,
        y: 360,
        angle: 0,
        speed: 0,
        maxSpeed: 200,
        fuel: 100
    };

    // Generate stars
    spaceStars = [];
    for (let i = 0; i < 200; i++) {
        spaceStars.push({
            x: Math.random() * 3000 - 500,
            y: Math.random() * 2000 - 500,
            size: Math.random() * 2 + 1,
            brightness: Math.random()
        });
    }

    // Generate derelict ships to explore
    derelicts = [];
    for (let i = 0; i < 5; i++) {
        derelicts.push({
            x: Math.random() * 2000 - 200,
            y: Math.random() * 1500 - 200,
            size: 40 + Math.random() * 30,
            explored: false,
            name: `Derelict ${String.fromCharCode(65 + i)}-${Math.floor(Math.random() * 999)}`
        });
    }
}

function updateSpaceshipPhase(dt) {
    if (!spaceship) return;

    const effectiveKeys = { ...keys };
    activeHarnessKeys.forEach(k => effectiveKeys[k.toLowerCase()] = true);

    // Rotation
    if (effectiveKeys['a'] || effectiveKeys['arrowleft']) spaceship.angle -= 3 * dt;
    if (effectiveKeys['d'] || effectiveKeys['arrowright']) spaceship.angle += 3 * dt;

    // Thrust
    if (effectiveKeys['w'] || effectiveKeys['arrowup']) {
        spaceship.speed = Math.min(spaceship.maxSpeed, spaceship.speed + 150 * dt);
        spaceship.fuel -= 5 * dt;
    } else {
        spaceship.speed *= 0.98;
    }

    // Apply velocity
    spaceship.x += Math.cos(spaceship.angle) * spaceship.speed * dt;
    spaceship.y += Math.sin(spaceship.angle) * spaceship.speed * dt;

    // Check derelict interaction
    if (effectiveKeys['e']) {
        for (const d of derelicts) {
            const dist = Math.hypot(spaceship.x - d.x, spaceship.y - d.y);
            if (dist < d.size + 30 && !d.explored) {
                // Enter derelict - restart game with new sector
                d.explored = true;
                document.getElementById('spaceshipPhase').style.display = 'none';
                startGame();
                return;
            }
        }
    }
}

function drawSpaceshipPhase() {
    if (!spaceshipCtx) return;

    spaceshipCtx.fillStyle = '#000';
    spaceshipCtx.fillRect(0, 0, 1280, 720);

    // Camera follows ship
    const camX = spaceship.x - 640;
    const camY = spaceship.y - 360;

    // Draw stars
    for (const star of spaceStars) {
        const sx = star.x - camX * 0.3;
        const sy = star.y - camY * 0.3;
        spaceshipCtx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        spaceshipCtx.fillRect(sx, sy, star.size, star.size);
    }

    // Draw derelicts
    for (const d of derelicts) {
        const dx = d.x - camX;
        const dy = d.y - camY;

        spaceshipCtx.fillStyle = d.explored ? '#333' : '#554';
        spaceshipCtx.beginPath();
        spaceshipCtx.ellipse(dx, dy, d.size, d.size * 0.6, Math.random() * 0.1, 0, Math.PI * 2);
        spaceshipCtx.fill();

        spaceshipCtx.fillStyle = '#0f0';
        spaceshipCtx.font = '12px monospace';
        spaceshipCtx.textAlign = 'center';
        spaceshipCtx.fillText(d.name, dx, dy + d.size + 15);

        if (!d.explored) {
            const dist = Math.hypot(spaceship.x - d.x, spaceship.y - d.y);
            if (dist < d.size + 50) {
                spaceshipCtx.fillText('[E] to Board', dx, dy + d.size + 30);
            }
        }
    }

    // Draw spaceship
    const sx = spaceship.x - camX;
    const sy = spaceship.y - camY;

    spaceshipCtx.save();
    spaceshipCtx.translate(sx, sy);
    spaceshipCtx.rotate(spaceship.angle);

    spaceshipCtx.fillStyle = '#0af';
    spaceshipCtx.beginPath();
    spaceshipCtx.moveTo(20, 0);
    spaceshipCtx.lineTo(-15, -12);
    spaceshipCtx.lineTo(-10, 0);
    spaceshipCtx.lineTo(-15, 12);
    spaceshipCtx.closePath();
    spaceshipCtx.fill();

    // Thruster
    if (keys['w'] || activeHarnessKeys.has('w')) {
        spaceshipCtx.fillStyle = '#fa0';
        spaceshipCtx.beginPath();
        spaceshipCtx.moveTo(-10, -5);
        spaceshipCtx.lineTo(-25 - Math.random() * 10, 0);
        spaceshipCtx.lineTo(-10, 5);
        spaceshipCtx.closePath();
        spaceshipCtx.fill();
    }

    spaceshipCtx.restore();

    // UI
    spaceshipCtx.fillStyle = '#0f0';
    spaceshipCtx.font = '14px monospace';
    spaceshipCtx.textAlign = 'left';
    spaceshipCtx.fillText(`FUEL: ${Math.floor(spaceship.fuel)}%`, 20, 30);
    spaceshipCtx.fillText('WASD to fly | E to board derelicts', 20, 50);
}

// ═══════════════════════════════════════════════════════════
// UI UPDATE
// ═══════════════════════════════════════════════════════════
function updateUI() {
    if (!player) return;

    // O2
    const o2Percent = (player.oxygen / player.maxOxygen) * 100;
    document.getElementById('o2Bar').style.width = o2Percent + '%';
    document.getElementById('o2Text').textContent = Math.floor(player.oxygen);

    // HP
    const hpPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('hpBar').style.width = hpPercent + '%';
    document.getElementById('hpText').textContent = Math.floor(player.health);

    // Integrity
    document.getElementById('integrityBar').style.width = structuralIntegrity + '%';
    document.getElementById('integrityText').textContent = Math.floor(structuralIntegrity) + '%';

    // Flashlight
    const flashPercent = (player.flashlightBattery / player.maxFlashlightBattery) * 100;
    document.getElementById('flashlightBar').style.width = flashPercent + '%';

    // Sector
    document.getElementById('sectorDisplay').textContent = `SECTOR ${currentSector + 1} - ${SECTORS[currentSector]?.name || ''}`;

    // Quick slots
    const slotsDiv = document.getElementById('quickSlots');
    slotsDiv.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        if (player.inventory[i]) {
            slot.textContent = player.inventory[i].name;
        } else {
            slot.textContent = i + 1;
        }
        slotsDiv.appendChild(slot);
    }

    // Warning effects
    if (player.oxygen < 20) {
        document.body.style.boxShadow = 'inset 0 0 100px rgba(255, 0, 0, 0.5)';
    } else {
        document.body.style.boxShadow = 'none';
    }
}

// ═══════════════════════════════════════════════════════════
// MAIN GAME LOOP
// ═══════════════════════════════════════════════════════════
function update(dt) {
    if (gameState === 'spaceship') {
        updateSpaceshipPhase(dt);
        return;
    }

    if (gameState !== 'playing') return;

    stats.timeSurvived += dt;

    // Structural integrity decay
    structuralIntegrity -= INTEGRITY_DECAY * dt;
    if (structuralIntegrity <= 0) {
        player.die('ship');
        return;
    }

    // Update player
    player.update(dt);

    // Update camera
    cameraX = player.x - VIEW_WIDTH / 2;
    cameraY = player.y - VIEW_HEIGHT / 2;

    // Clamp camera to room
    const room = rooms[currentRoom];
    if (room) {
        cameraX = Math.max(0, Math.min(room.width * TILE_SIZE - VIEW_WIDTH, cameraX));
        cameraY = Math.max(0, Math.min(room.height * TILE_SIZE - VIEW_HEIGHT, cameraY));
    }

    // Update enemies
    for (const enemy of enemies) {
        enemy.update(dt);
    }

    // Update projectiles
    updateProjectiles(dt);

    // Update particles
    updateParticles(dt);

    // Item pickup
    checkItemPickup();

    // Check room transition (simplified)
    checkRoomTransition();

    // Update UI
    updateUI();
}

function checkRoomTransition() {
    const room = rooms[currentRoom];
    if (!room) return;

    for (const door of room.doors) {
        const doorX = door.x * TILE_SIZE + TILE_SIZE / 2;
        const doorY = door.y * TILE_SIZE + TILE_SIZE / 2;
        const dist = Math.hypot(player.x - doorX, player.y - doorY);

        if (dist < 40 && (keys['e'] || activeHarnessKeys.has('e'))) {
            // Check if this is sector transition
            if (currentRoom === rooms.length - 1 && door.dir === 'east') {
                // Need keycard for next sector
                if (currentSector === 1 && !keycards.blue) return;
                if (currentSector === 3 && !keycards.red) return;
                if (currentSector === 5 && !keycards.gold) return;

                progressToNextSector();
                return;
            }

            // Move to next room in sector
            if (door.dir === 'east' || door.dir === 'south') {
                if (currentRoom < rooms.length - 1) {
                    currentRoom++;
                    const newRoom = rooms[currentRoom];
                    player.x = 100;
                    player.y = newRoom.height * TILE_SIZE / 2;
                    stats.roomsExplored++;
                }
            } else if (door.dir === 'west' || door.dir === 'north') {
                if (currentRoom > 0) {
                    currentRoom--;
                    const newRoom = rooms[currentRoom];
                    player.x = newRoom.width * TILE_SIZE - 100;
                    player.y = newRoom.height * TILE_SIZE / 2;
                }
            }
        }
    }
}

function render() {
    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    if (gameState === 'spaceship') {
        drawSpaceshipPhase();
        return;
    }

    if (gameState !== 'playing') return;

    // Draw room
    const room = rooms[currentRoom];
    if (room) room.draw();

    // Draw items (only in vision)
    drawItems();

    // Draw enemies (only in vision cone)
    for (const enemy of enemies) {
        if (isInVisionCone(enemy.x, enemy.y) || enemy.isBoss) {
            enemy.draw();
        }
    }

    // Draw projectiles
    drawProjectiles();

    // Draw player
    player.draw();

    // Draw particles
    drawParticles();

    // Draw vision cone overlay (darkness)
    drawVisionCone();

    // Draw flashlight beam effect
    if (player.flashlightOn) {
        const screenX = player.x - cameraX;
        const screenY = player.y - cameraY;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const gradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX + Math.cos(player.angle) * 150, screenY + Math.sin(player.angle) * 150, 200
        );
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.arc(screenX, screenY, 250, player.angle - 0.3, player.angle + 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

function gameLoop(timestamp) {
    deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (!gamePaused) {
        update(deltaTime);
        render();
    } else {
        render(); // Still render when paused
    }

    requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════════════════════════
// INPUT HANDLING
// ═══════════════════════════════════════════════════════════
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    // Item slots
    if (gameState === 'playing' && player) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 6) {
            player.useItem(num - 1);
        }

        if (e.key.toLowerCase() === 'f') {
            player.flashlightOn = !player.flashlightOn;
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

canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
    if (gameState === 'playing' && player) {
        player.attack();
    }
});

canvas.addEventListener('mouseup', () => {
    mouseDown = false;
});

// ═══════════════════════════════════════════════════════════
// TEST HARNESS
// ═══════════════════════════════════════════════════════════
(function() {
    function simulateKeyDown(key) {
        activeHarnessKeys.add(key.toLowerCase());
    }

    function simulateKeyUp(key) {
        activeHarnessKeys.delete(key.toLowerCase());
    }

    function releaseAllKeys() {
        activeHarnessKeys.clear();
    }

    window.harness = {
        pause: () => {
            gamePaused = true;
            releaseAllKeys();
        },

        resume: () => {
            gamePaused = false;
        },

        isPaused: () => gamePaused,

        execute: (action, durationMs) => {
            return new Promise((resolve) => {
                if (action.keys) {
                    for (const key of action.keys) {
                        simulateKeyDown(key);
                    }
                }

                // Handle click attack
                let attackInterval = null;
                if (action.click) {
                    mouseX = action.click.x;
                    mouseY = action.click.y;
                    if (gameState === 'playing' && player) {
                        // Convert screen click to world position for accurate angle
                        const worldTargetX = mouseX + cameraX;
                        const worldTargetY = mouseY + cameraY;

                        // Update player angle to face world target
                        player.angle = Math.atan2(worldTargetY - player.y, worldTargetX - player.x);
                        player.attack();

                        // Keep attacking during duration
                        attackInterval = setInterval(() => {
                            if (player && gameState === 'playing') {
                                // Recalculate world position with updated camera
                                const wtX = mouseX + cameraX;
                                const wtY = mouseY + cameraY;
                                player.angle = Math.atan2(wtY - player.y, wtX - player.x);
                                player.attack();
                            }
                        }, 100);
                    }
                }

                gamePaused = false;

                setTimeout(() => {
                    if (attackInterval) clearInterval(attackInterval);
                    releaseAllKeys();
                    gamePaused = true;
                    resolve();
                }, durationMs);
            });
        },

        getState: () => {
            return {
                gameState: gameState,
                camera: { x: cameraX, y: cameraY },
                player: player ? {
                    x: player.x,
                    y: player.y,
                    screenX: player.x - cameraX,
                    screenY: player.y - cameraY,
                    angle: player.angle,
                    health: player.health,
                    maxHealth: player.maxHealth,
                    oxygen: player.oxygen,
                    maxOxygen: player.maxOxygen,
                    flashlightOn: player.flashlightOn,
                    flashlightBattery: player.flashlightBattery,
                    inventory: player.inventory.map(i => i?.type),
                    weapon: player.weapon.name
                } : null,
                enemies: enemies.map(e => ({
                    x: e.x,
                    y: e.y,
                    type: e.type,
                    health: e.hp,
                    maxHealth: e.maxHp,
                    state: e.state,
                    isBoss: e.isBoss,
                    revealed: e.revealed
                })),
                items: items.map(i => ({
                    x: i.x,
                    y: i.y,
                    type: i.type
                })),
                sector: currentSector,
                sectorName: SECTORS[currentSector]?.name,
                room: currentRoom,
                totalRooms: rooms.length,
                structuralIntegrity: structuralIntegrity,
                power: {
                    available: powerAvailable,
                    max: powerMax,
                    allocation: { ...powerAllocation }
                },
                keycards: { ...keycards },
                stats: { ...stats }
            };
        },

        getPhase: () => {
            if (gameState === 'menu') return 'menu';
            if (gameState === 'playing') return 'playing';
            if (gameState === 'gameover') return 'gameover';
            if (gameState === 'victory') return 'victory';
            if (gameState === 'spaceship') return 'spaceship';
            return gameState;
        },

        debug: {
            setHealth: (hp) => { if (player) player.health = hp; },
            setOxygen: (o2) => { if (player) player.oxygen = o2; },
            setPosition: (x, y) => { if (player) { player.x = x; player.y = y; } },
            setGodMode: (enabled) => { if (player) player.invincibleTime = enabled ? 99999 : 0; },
            skipToSector: (idx) => { currentSector = idx; generateSector(idx); },
            spawnEnemy: (type, x, y) => { enemies.push(new Enemy(type, x, y)); },
            clearEnemies: () => { enemies.length = 0; },
            giveItem: (type) => { if (player) player.addItem(createItem(0, 0, type)); },
            giveKeycard: (color) => { keycards[color] = true; },
            setPower: (system, bars) => { powerAllocation[system] = bars; },
            setIntegrity: (val) => { structuralIntegrity = val; },
            forceStart: () => { startGame(); gamePaused = false; },
            forceGameOver: () => { gameState = 'gameover'; },
            forceVictory: () => {
                gameState = 'victory';
                document.getElementById('victoryScreen').classList.remove('hidden');
            },
            log: (msg) => { console.log('[HARNESS]', msg); },
        },

        version: '1.0',

        gameInfo: {
            name: 'Derelict',
            type: 'survival_horror',
            controls: {
                movement: ['w', 'a', 's', 'd'],
                actions: {
                    flashlight: 'f',
                    interact: 'e',
                    run: 'Shift',
                    attack: 'click'
                }
            }
        }
    };

    console.log('[HARNESS] Test harness initialized, game paused');
})();

// Start game loop
requestAnimationFrame(gameLoop);
