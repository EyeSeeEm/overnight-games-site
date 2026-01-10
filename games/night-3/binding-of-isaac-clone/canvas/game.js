// Basement Tears - Binding of Isaac Style Roguelike
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Room dimensions (tile-based)
const TILE_SIZE = 40;
const ROOM_WIDTH = 13;
const ROOM_HEIGHT = 7;
const ROOM_OFFSET_X = (canvas.width - ROOM_WIDTH * TILE_SIZE) / 2;
const ROOM_OFFSET_Y = 60; // Space for HUD at top

// Colors matching Binding of Isaac palette
const COLORS = {
    floor: '#2A2018',
    floorAlt: '#231A12',
    wall: '#3A3A3A',
    wallDark: '#252525',
    wallLight: '#4A4A4A',
    door: '#4A3A2A',
    doorFrame: '#1A1A1A',
    player: '#EECCBB',
    playerOutline: '#AA8877',
    tear: '#6688CC',
    tearHighlight: '#99BBEE',
    blood: '#CC3333',
    rock: '#5A5A5A',
    rockDark: '#3A3A3A',
    poop: '#6A4A2A',
    poopDark: '#4A3A1A',
    heart: '#CC2222',
    heartEmpty: '#222222',
    coin: '#FFDD44',
    bomb: '#444444',
    key: '#FFCC22',
    fly: '#3A3A3A',
    gaper: '#DDAA88',
    spider: '#3A3020'
};

// Game state
let gameState = 'title';
let player = null;
let tears = [];
let enemies = [];
let pickups = [];
let obstacles = [];
let particles = [];
let doors = [];

// Room data
let currentRoom = { x: 4, y: 4 };
let floorMap = [];
let visitedRooms = new Set();

// Input
const keys = {};
let lastFireDir = { x: 0, y: 1 };

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 28;
        this.height = 28;
        this.speed = 150;
        this.health = 6; // Half hearts (3 full hearts)
        this.maxHealth = 6;
        this.soulHearts = 0;
        this.coins = 0;
        this.bombs = 1;
        this.keys = 1;
        this.damage = 3.5;
        this.tearDelay = 0.35; // Seconds between shots
        this.fireTimer = 0;
        this.range = 200;
        this.shotSpeed = 300;
        this.invulnTimer = 0;
        this.headAngle = 0;
        this.bodyBob = 0;
        this.blinkTimer = 0;
    }

    update(dt) {
        // Movement
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy = -1;
        if (keys['s'] || keys['arrowdown']) dy = 1;
        if (keys['a'] || keys['arrowleft']) dx = -1;
        if (keys['d'] || keys['arrowright']) dx = 1;

        if (dx && dy) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Body bob while moving
        if (dx || dy) {
            this.bodyBob += dt * 15;
        }

        const newX = this.x + dx * this.speed * dt;
        const newY = this.y + dy * this.speed * dt;

        // Collision with room bounds
        const minX = ROOM_OFFSET_X + TILE_SIZE + this.width / 2;
        const maxX = ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE - this.width / 2;
        const minY = ROOM_OFFSET_Y + TILE_SIZE + this.height / 2;
        const maxY = ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE - this.height / 2;

        // Check obstacle collisions
        let canMoveX = !checkObstacleCollision(newX, this.y, this.width, this.height);
        let canMoveY = !checkObstacleCollision(this.x, newY, this.width, this.height);

        if (canMoveX && newX > minX && newX < maxX) {
            this.x = newX;
        }
        if (canMoveY && newY > minY && newY < maxY) {
            this.y = newY;
        }

        // Shooting (arrow keys or IJKL)
        let fireX = 0, fireY = 0;
        if (keys['arrowup'] || keys['i']) fireY = -1;
        if (keys['arrowdown'] || keys['k']) fireY = 1;
        if (keys['arrowleft'] || keys['j']) fireX = -1;
        if (keys['arrowright'] || keys['l']) fireX = 1;

        // Cardinal direction only
        if (fireX && fireY) {
            if (Math.abs(fireX) > Math.abs(fireY)) fireY = 0;
            else fireX = 0;
        }

        if (fireX || fireY) {
            lastFireDir = { x: fireX, y: fireY };
            this.headAngle = Math.atan2(fireY, fireX);
        }

        this.fireTimer -= dt;
        if ((fireX || fireY) && this.fireTimer <= 0) {
            this.shoot(fireX, fireY);
        }

        // Invulnerability
        if (this.invulnTimer > 0) {
            this.invulnTimer -= dt;
        }

        // Blinking
        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) {
            this.blinkTimer = 3 + Math.random() * 2;
        }

        // Check door collisions
        this.checkDoors();
    }

    shoot(dx, dy) {
        tears.push(new Tear(
            this.x,
            this.y - 10,
            dx * this.shotSpeed,
            dy * this.shotSpeed,
            this.damage,
            this.range
        ));
        this.fireTimer = this.tearDelay;

        // Crying animation
        this.blinkTimer = 0.1;
    }

    takeDamage(amount) {
        if (this.invulnTimer > 0) return;

        // Soul hearts first
        if (this.soulHearts > 0) {
            this.soulHearts -= amount;
            if (this.soulHearts < 0) {
                amount = -this.soulHearts;
                this.soulHearts = 0;
            } else {
                amount = 0;
            }
        }

        this.health -= amount;
        this.invulnTimer = 1.5;

        // Screen flash
        screenFlash(0.2);

        // Blood particles
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 0.5,
                maxLife: 0.5,
                color: COLORS.blood,
                size: 4
            });
        }

        if (this.health <= 0) {
            gameState = 'gameover';
        }
    }

    checkDoors() {
        doors.forEach(door => {
            if (!door.open) return;

            const dist = Math.sqrt(
                Math.pow(this.x - door.x, 2) +
                Math.pow(this.y - door.y, 2)
            );

            if (dist < 30) {
                // Transition to next room
                transitionRoom(door.direction);
            }
        });
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Flash when invulnerable
        if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (nude baby torso)
        const bobOffset = Math.sin(this.bodyBob) * 1.5;
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.ellipse(0, 4 + bobOffset, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.arc(0, -8, 14, 0, Math.PI * 2);
        ctx.fill();

        // Head outline
        ctx.strokeStyle = COLORS.playerOutline;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -8, 14, 0, Math.PI * 2);
        ctx.stroke();

        // Eyes
        const eyeOffset = 4;
        const blinking = this.blinkTimer < 0.1;

        // Left eye
        ctx.fillStyle = '#000';
        if (blinking) {
            ctx.fillRect(-eyeOffset - 3, -10, 6, 2);
        } else {
            ctx.beginPath();
            ctx.ellipse(-eyeOffset, -9, 4, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Pupil
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(-eyeOffset + lastFireDir.x * 1.5, -9 + lastFireDir.y * 1.5, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Right eye
        ctx.fillStyle = '#000';
        if (blinking) {
            ctx.fillRect(eyeOffset - 3, -10, 6, 2);
        } else {
            ctx.beginPath();
            ctx.ellipse(eyeOffset, -9, 4, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(eyeOffset + lastFireDir.x * 1.5, -9 + lastFireDir.y * 1.5, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Tears streaming (when shooting)
        if (this.fireTimer > this.tearDelay - 0.1) {
            ctx.fillStyle = COLORS.tear;
            ctx.beginPath();
            ctx.ellipse(-eyeOffset, -2, 2, 6, 0, 0, Math.PI * 2);
            ctx.ellipse(eyeOffset, -2, 2, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mouth (sad)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -2, 4, 0.2, Math.PI - 0.2);
        ctx.stroke();

        ctx.restore();
    }
}

// Tear class
class Tear {
    constructor(x, y, vx, vy, damage, range) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.range = range;
        this.distanceTraveled = 0;
        this.size = 8;
        this.height = 0; // Arc effect
        this.arcSpeed = 2;
    }

    update(dt) {
        const dx = this.vx * dt;
        const dy = this.vy * dt;

        this.x += dx;
        this.y += dy;
        this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);

        // Arc effect (parabola)
        const progress = this.distanceTraveled / this.range;
        this.height = Math.sin(progress * Math.PI) * 15;

        // Size shrinks near end
        if (progress > 0.7) {
            this.size = 8 * (1 - (progress - 0.7) / 0.3);
        }

        // Check wall collision
        if (this.x < ROOM_OFFSET_X + TILE_SIZE ||
            this.x > ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE ||
            this.y < ROOM_OFFSET_Y + TILE_SIZE ||
            this.y > ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE) {
            return false;
        }

        // Check obstacle collision
        if (checkObstacleCollision(this.x, this.y, 4, 4)) {
            // Splash particles
            for (let i = 0; i < 4; i++) {
                particles.push({
                    x: this.x,
                    y: this.y,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    life: 0.3,
                    maxLife: 0.3,
                    color: COLORS.tear,
                    size: 3
                });
            }
            return false;
        }

        // Check enemy collision
        for (let e of enemies) {
            const dist = Math.sqrt(
                Math.pow(this.x - e.x, 2) +
                Math.pow(this.y - e.y, 2)
            );
            if (dist < e.width / 2 + this.size) {
                e.takeDamage(this.damage, this.vx, this.vy);
                // Splash
                for (let i = 0; i < 4; i++) {
                    particles.push({
                        x: this.x,
                        y: this.y,
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        life: 0.3,
                        maxLife: 0.3,
                        color: COLORS.tear,
                        size: 3
                    });
                }
                return false;
            }
        }

        return this.distanceTraveled < this.range;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y - this.height);

        // Tear (teardrop shape)
        ctx.fillStyle = COLORS.tear;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = COLORS.tearHighlight;
        ctx.beginPath();
        ctx.arc(-this.size * 0.3, -this.size * 0.3, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Enemy base class
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 24;
        this.height = 24;
        this.speed = 50;
        this.health = 10;
        this.damage = 1;
        this.hitFlash = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;

        switch (type) {
            case 'fly':
                this.health = 4;
                this.speed = 60;
                this.width = 16;
                this.height = 16;
                this.floatPhase = Math.random() * Math.PI * 2;
                break;
            case 'gaper':
                this.health = 12;
                this.speed = 40;
                this.width = 28;
                this.height = 28;
                break;
            case 'spider':
                this.health = 6;
                this.speed = 80;
                this.width = 20;
                this.height = 20;
                this.moveTimer = 0;
                this.moveDir = { x: 0, y: 0 };
                break;
        }
    }

    update(dt) {
        // Apply knockback
        this.x += this.knockbackX * dt;
        this.y += this.knockbackY * dt;
        this.knockbackX *= 0.9;
        this.knockbackY *= 0.9;

        // Hit flash
        if (this.hitFlash > 0) {
            this.hitFlash -= dt;
        }

        // Type-specific behavior
        switch (this.type) {
            case 'fly':
                this.updateFly(dt);
                break;
            case 'gaper':
                this.updateGaper(dt);
                break;
            case 'spider':
                this.updateSpider(dt);
                break;
        }

        // Keep in bounds
        const minX = ROOM_OFFSET_X + TILE_SIZE + this.width / 2;
        const maxX = ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE - this.width / 2;
        const minY = ROOM_OFFSET_Y + TILE_SIZE + this.height / 2;
        const maxY = ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE - this.height / 2;

        this.x = Math.max(minX, Math.min(maxX, this.x));
        this.y = Math.max(minY, Math.min(maxY, this.y));

        // Check player collision
        if (player) {
            const dist = Math.sqrt(
                Math.pow(this.x - player.x, 2) +
                Math.pow(this.y - player.y, 2)
            );
            if (dist < (this.width + player.width) / 2) {
                player.takeDamage(this.damage);
            }
        }

        return this.health > 0;
    }

    updateFly(dt) {
        // Float up and down
        this.floatPhase += dt * 5;

        // Move randomly toward player
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.x += (dx / dist) * this.speed * dt + (Math.random() - 0.5) * 20 * dt;
                this.y += (dy / dist) * this.speed * dt + (Math.random() - 0.5) * 20 * dt;
            }
        }
    }

    updateGaper(dt) {
        // Walk toward player
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                const newX = this.x + (dx / dist) * this.speed * dt;
                const newY = this.y + (dy / dist) * this.speed * dt;

                if (!checkObstacleCollision(newX, this.y, this.width, this.height)) {
                    this.x = newX;
                }
                if (!checkObstacleCollision(this.x, newY, this.width, this.height)) {
                    this.y = newY;
                }
            }
        }
    }

    updateSpider(dt) {
        // Erratic movement
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            this.moveTimer = 0.3 + Math.random() * 0.5;
            if (player && Math.random() < 0.7) {
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                this.moveDir = { x: dx / dist, y: dy / dist };
            } else {
                const angle = Math.random() * Math.PI * 2;
                this.moveDir = { x: Math.cos(angle), y: Math.sin(angle) };
            }
        }

        const newX = this.x + this.moveDir.x * this.speed * dt;
        const newY = this.y + this.moveDir.y * this.speed * dt;

        if (!checkObstacleCollision(newX, this.y, this.width, this.height)) {
            this.x = newX;
        }
        if (!checkObstacleCollision(this.x, newY, this.width, this.height)) {
            this.y = newY;
        }
    }

    takeDamage(amount, knockX, knockY) {
        this.health -= amount;
        this.hitFlash = 0.1;

        // Knockback
        const knockForce = 150;
        const knockLen = Math.sqrt(knockX * knockX + knockY * knockY);
        if (knockLen > 0) {
            this.knockbackX = (knockX / knockLen) * knockForce;
            this.knockbackY = (knockY / knockLen) * knockForce;
        }

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        // Blood splatter
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 0.5,
                maxLife: 0.5,
                color: COLORS.blood,
                size: 5
            });
        }

        // Chance to drop pickup
        if (Math.random() < 0.3) {
            const types = ['heart', 'coin', 'bomb', 'key'];
            const weights = [30, 40, 15, 15];
            const type = weightedRandom(types, weights);
            pickups.push({
                x: this.x,
                y: this.y,
                type: type
            });
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.hitFlash > 0) {
            ctx.fillStyle = '#FFFFFF';
        }

        switch (this.type) {
            case 'fly':
                this.drawFly();
                break;
            case 'gaper':
                this.drawGaper();
                break;
            case 'spider':
                this.drawSpider();
                break;
        }

        ctx.restore();
    }

    drawFly() {
        const bobY = Math.sin(this.floatPhase) * 3;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 8 - bobY / 2, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : '#555555';
        const wingPhase = Date.now() / 30;
        ctx.beginPath();
        ctx.ellipse(-6 + Math.sin(wingPhase) * 2, bobY - 2, 4, 6, -0.3, 0, Math.PI * 2);
        ctx.ellipse(6 - Math.sin(wingPhase) * 2, bobY - 2, 4, 6, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : COLORS.fly;
        ctx.beginPath();
        ctx.arc(0, bobY, 7, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(-2, bobY - 2, 2, 0, Math.PI * 2);
        ctx.arc(2, bobY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawGaper() {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 14, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : COLORS.gaper;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Dark outline
        ctx.strokeStyle = '#8A6A4A';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes (sunken)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(-5, -3, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(5, -3, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mouth (gaping)
        ctx.fillStyle = '#4A2A1A';
        ctx.beginPath();
        ctx.ellipse(0, 6, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSpider() {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 8, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.strokeStyle = this.hitFlash > 0 ? '#FFFFFF' : COLORS.spider;
        ctx.lineWidth = 2;
        const legPhase = Date.now() / 100;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI - Math.PI / 2;
            const legMove = Math.sin(legPhase + i) * 2;
            // Left side
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * 5, Math.sin(angle) * 3);
            ctx.lineTo(Math.cos(angle) * 12 + legMove, Math.sin(angle) * 6 + 2);
            ctx.stroke();
            // Right side
            ctx.beginPath();
            ctx.moveTo(-Math.cos(angle) * 5, Math.sin(angle) * 3);
            ctx.lineTo(-Math.cos(angle) * 12 - legMove, Math.sin(angle) * 6 + 2);
            ctx.stroke();
        }

        // Body
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : COLORS.spider;
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(-2, -2, 1.5, 0, Math.PI * 2);
        ctx.arc(2, -2, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Utility functions
function weightedRandom(items, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
        if (random < weights[i]) return items[i];
        random -= weights[i];
    }
    return items[0];
}

function checkObstacleCollision(x, y, w, h) {
    for (let obs of obstacles) {
        if (x - w / 2 < obs.x + obs.width / 2 &&
            x + w / 2 > obs.x - obs.width / 2 &&
            y - h / 2 < obs.y + obs.height / 2 &&
            y + h / 2 > obs.y - obs.height / 2) {
            return true;
        }
    }
    return false;
}

let flashAlpha = 0;
function screenFlash(duration) {
    flashAlpha = 0.3;
}

// Generate floor map
function generateFloor() {
    floorMap = [];
    for (let y = 0; y < 9; y++) {
        floorMap[y] = [];
        for (let x = 0; x < 9; x++) {
            floorMap[y][x] = null;
        }
    }

    // Start room
    floorMap[4][4] = { type: 'start', cleared: false };

    // Generate rooms using random walk
    const roomCount = 7 + Math.floor(Math.random() * 3);
    const roomPositions = [{ x: 4, y: 4 }];

    while (roomPositions.length < roomCount) {
        const room = roomPositions[Math.floor(Math.random() * roomPositions.length)];
        const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const newX = room.x + dir.x;
        const newY = room.y + dir.y;

        if (newX >= 0 && newX < 9 && newY >= 0 && newY < 9 && !floorMap[newY][newX]) {
            floorMap[newY][newX] = { type: 'normal', cleared: false };
            roomPositions.push({ x: newX, y: newY });
        }
    }

    // Find farthest room for boss
    let farthest = { x: 4, y: 4 };
    let maxDist = 0;
    for (let pos of roomPositions) {
        const dist = Math.abs(pos.x - 4) + Math.abs(pos.y - 4);
        if (dist > maxDist && !(pos.x === 4 && pos.y === 4)) {
            maxDist = dist;
            farthest = pos;
        }
    }
    floorMap[farthest.y][farthest.x] = { type: 'boss', cleared: false };

    // Add treasure room
    for (let pos of roomPositions) {
        if (floorMap[pos.y][pos.x].type === 'normal') {
            floorMap[pos.y][pos.x] = { type: 'treasure', cleared: false };
            break;
        }
    }

    currentRoom = { x: 4, y: 4 };
    visitedRooms.clear();
    visitedRooms.add('4,4');
}

// Generate room content
function generateRoom(roomData) {
    enemies = [];
    obstacles = [];
    pickups = [];
    doors = [];

    if (!roomData) return;

    // Generate doors based on adjacent rooms
    const dirs = [
        { x: 0, y: -1, doorX: ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2, doorY: ROOM_OFFSET_Y + TILE_SIZE / 2 },
        { x: 0, y: 1, doorX: ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2, doorY: ROOM_OFFSET_Y + (ROOM_HEIGHT - 0.5) * TILE_SIZE },
        { x: -1, y: 0, doorX: ROOM_OFFSET_X + TILE_SIZE / 2, doorY: ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2 },
        { x: 1, y: 0, doorX: ROOM_OFFSET_X + (ROOM_WIDTH - 0.5) * TILE_SIZE, doorY: ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2 }
    ];

    for (let dir of dirs) {
        const adjX = currentRoom.x + dir.x;
        const adjY = currentRoom.y + dir.y;
        if (adjX >= 0 && adjX < 9 && adjY >= 0 && adjY < 9 && floorMap[adjY][adjX]) {
            doors.push({
                x: dir.doorX,
                y: dir.doorY,
                direction: dir,
                open: roomData.cleared
            });
        }
    }

    // Don't spawn enemies in cleared rooms or start room
    if (roomData.cleared || roomData.type === 'start') return;

    // Spawn obstacles
    const obstacleCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < obstacleCount; i++) {
        const ox = ROOM_OFFSET_X + (2 + Math.random() * (ROOM_WIDTH - 4)) * TILE_SIZE;
        const oy = ROOM_OFFSET_Y + (2 + Math.random() * (ROOM_HEIGHT - 4)) * TILE_SIZE;
        obstacles.push({
            x: ox,
            y: oy,
            width: TILE_SIZE - 8,
            height: TILE_SIZE - 8,
            type: Math.random() < 0.5 ? 'rock' : 'poop'
        });
    }

    // Spawn enemies based on room type
    if (roomData.type === 'normal' || roomData.type === 'start') {
        const enemyCount = 2 + Math.floor(Math.random() * 3);
        const types = ['fly', 'gaper', 'spider'];
        for (let i = 0; i < enemyCount; i++) {
            const ex = ROOM_OFFSET_X + (2 + Math.random() * (ROOM_WIDTH - 4)) * TILE_SIZE;
            const ey = ROOM_OFFSET_Y + (2 + Math.random() * (ROOM_HEIGHT - 4)) * TILE_SIZE;
            enemies.push(new Enemy(ex, ey, types[Math.floor(Math.random() * types.length)]));
        }
    } else if (roomData.type === 'boss') {
        // Boss room - spawn multiple gapers
        for (let i = 0; i < 4; i++) {
            const ex = ROOM_OFFSET_X + (3 + i * 2) * TILE_SIZE;
            const ey = ROOM_OFFSET_Y + 3 * TILE_SIZE;
            enemies.push(new Enemy(ex, ey, 'gaper'));
        }
    } else if (roomData.type === 'treasure') {
        // Item pedestal (just a heart pickup for now)
        pickups.push({
            x: ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2,
            y: ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2,
            type: 'heart'
        });
    }
}

function transitionRoom(dir) {
    currentRoom.x += dir.x;
    currentRoom.y += dir.y;
    visitedRooms.add(`${currentRoom.x},${currentRoom.y}`);

    const roomData = floorMap[currentRoom.y][currentRoom.x];
    generateRoom(roomData);

    // Position player at opposite door
    if (dir.x > 0) player.x = ROOM_OFFSET_X + 2 * TILE_SIZE;
    if (dir.x < 0) player.x = ROOM_OFFSET_X + (ROOM_WIDTH - 2) * TILE_SIZE;
    if (dir.y > 0) player.y = ROOM_OFFSET_Y + 2 * TILE_SIZE;
    if (dir.y < 0) player.y = ROOM_OFFSET_Y + (ROOM_HEIGHT - 2) * TILE_SIZE;

    tears = [];
}

// Drawing functions
function drawRoom() {
    const roomData = floorMap[currentRoom.y]?.[currentRoom.x];

    // Floor
    for (let y = 1; y < ROOM_HEIGHT - 1; y++) {
        for (let x = 1; x < ROOM_WIDTH - 1; x++) {
            const px = ROOM_OFFSET_X + x * TILE_SIZE;
            const py = ROOM_OFFSET_Y + y * TILE_SIZE;
            ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
    }

    // Walls
    ctx.fillStyle = COLORS.wall;
    // Top wall
    ctx.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH * TILE_SIZE, TILE_SIZE);
    // Bottom wall
    ctx.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE, ROOM_WIDTH * TILE_SIZE, TILE_SIZE);
    // Left wall
    ctx.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);
    // Right wall
    ctx.fillRect(ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE, ROOM_OFFSET_Y, TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);

    // Wall texture
    ctx.fillStyle = COLORS.wallDark;
    for (let i = 0; i < ROOM_WIDTH; i++) {
        // Top stones
        ctx.fillRect(ROOM_OFFSET_X + i * TILE_SIZE + 2, ROOM_OFFSET_Y + 2, TILE_SIZE - 4, 8);
        ctx.fillRect(ROOM_OFFSET_X + i * TILE_SIZE + 4, ROOM_OFFSET_Y + 14, TILE_SIZE - 8, 8);
        // Bottom stones
        ctx.fillRect(ROOM_OFFSET_X + i * TILE_SIZE + 2, ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE + 2, TILE_SIZE - 4, 8);
    }
    for (let i = 0; i < ROOM_HEIGHT; i++) {
        // Left stones
        ctx.fillRect(ROOM_OFFSET_X + 2, ROOM_OFFSET_Y + i * TILE_SIZE + 2, 8, TILE_SIZE - 4);
        // Right stones
        ctx.fillRect(ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE + 2, ROOM_OFFSET_Y + i * TILE_SIZE + 2, 8, TILE_SIZE - 4);
    }

    // Doors
    doors.forEach(door => {
        // Door frame
        ctx.fillStyle = COLORS.doorFrame;
        const isVertical = door.direction.y !== 0;

        if (isVertical) {
            ctx.fillRect(door.x - 25, door.y - 5, 50, 10);
        } else {
            ctx.fillRect(door.x - 5, door.y - 25, 10, 50);
        }

        // Door itself
        ctx.fillStyle = door.open ? COLORS.floor : COLORS.door;
        if (isVertical) {
            ctx.fillRect(door.x - 20, door.y - 3, 40, 6);
        } else {
            ctx.fillRect(door.x - 3, door.y - 20, 6, 40);
        }
    });

    // Obstacles
    obstacles.forEach(obs => {
        ctx.save();
        ctx.translate(obs.x, obs.y);

        if (obs.type === 'rock') {
            // Rock
            ctx.fillStyle = COLORS.rock;
            ctx.beginPath();
            ctx.moveTo(-14, 8);
            ctx.lineTo(-8, -12);
            ctx.lineTo(8, -12);
            ctx.lineTo(14, 8);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = COLORS.rockDark;
            ctx.beginPath();
            ctx.moveTo(-10, 8);
            ctx.lineTo(-6, -6);
            ctx.lineTo(6, -6);
            ctx.lineTo(10, 8);
            ctx.closePath();
            ctx.fill();
        } else {
            // Poop
            ctx.fillStyle = COLORS.poop;
            ctx.beginPath();
            ctx.arc(0, 4, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(-4, -4, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(4, -2, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, -10, 4, 0, Math.PI * 2);
            ctx.fill();

            // Dark spots
            ctx.fillStyle = COLORS.poopDark;
            ctx.beginPath();
            ctx.arc(-2, 6, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });

    // Pickups
    pickups.forEach(pickup => {
        ctx.save();
        ctx.translate(pickup.x, pickup.y);

        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = pickup.type === 'heart' ? COLORS.heart :
                          pickup.type === 'coin' ? COLORS.coin :
                          pickup.type === 'bomb' ? '#888' : COLORS.key;

        switch (pickup.type) {
            case 'heart':
                ctx.fillStyle = COLORS.heart;
                // Heart shape
                ctx.beginPath();
                ctx.moveTo(0, 4);
                ctx.bezierCurveTo(-8, -4, -8, -10, 0, -6);
                ctx.bezierCurveTo(8, -10, 8, -4, 0, 4);
                ctx.fill();
                break;
            case 'coin':
                ctx.fillStyle = COLORS.coin;
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#AA9922';
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'bomb':
                ctx.fillStyle = COLORS.bomb;
                ctx.beginPath();
                ctx.arc(0, 2, 8, 0, Math.PI * 2);
                ctx.fill();
                // Fuse
                ctx.strokeStyle = '#AA6622';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -6);
                ctx.quadraticCurveTo(4, -10, 2, -14);
                ctx.stroke();
                break;
            case 'key':
                ctx.fillStyle = COLORS.key;
                ctx.beginPath();
                ctx.arc(0, -6, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(-2, -2, 4, 12);
                ctx.fillRect(0, 6, 4, 2);
                ctx.fillRect(0, 2, 4, 2);
                break;
        }

        ctx.restore();
    });
}

function drawHUD() {
    // Top HUD background
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, canvas.width, 55);

    // Hearts
    const heartSize = 20;
    const heartY = 15;
    for (let i = 0; i < Math.ceil(player.maxHealth / 2); i++) {
        const hx = 20 + i * (heartSize + 4);
        const fullHearts = Math.floor(player.health / 2);
        const halfHeart = player.health % 2;

        if (i < fullHearts) {
            // Full heart
            drawHeart(hx, heartY, heartSize, COLORS.heart);
        } else if (i === fullHearts && halfHeart) {
            // Half heart
            drawHeart(hx, heartY, heartSize, COLORS.heart, true);
        } else {
            // Empty heart
            drawHeart(hx, heartY, heartSize, COLORS.heartEmpty);
        }
    }

    // Soul hearts
    for (let i = 0; i < Math.ceil(player.soulHearts / 2); i++) {
        const hx = 20 + (Math.ceil(player.maxHealth / 2) + i) * (heartSize + 4);
        drawHeart(hx, heartY, heartSize, '#4466AA');
    }

    // Pickups (left side, below hearts)
    ctx.fillStyle = COLORS.coin;
    ctx.font = 'bold 14px monospace';

    // Coins
    ctx.fillStyle = COLORS.coin;
    ctx.beginPath();
    ctx.arc(25, 42, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(player.coins.toString().padStart(2, '0'), 38, 46);

    // Bombs
    ctx.fillStyle = COLORS.bomb;
    ctx.beginPath();
    ctx.arc(85, 42, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(player.bombs.toString().padStart(2, '0'), 98, 46);

    // Keys
    ctx.fillStyle = COLORS.key;
    ctx.beginPath();
    ctx.arc(145, 38, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(143, 40, 4, 10);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(player.keys.toString().padStart(2, '0'), 158, 46);

    // Minimap (top right)
    drawMinimap();
}

function drawHeart(x, y, size, color, isHalf = false) {
    ctx.save();
    ctx.translate(x, y);

    if (isHalf) {
        // Draw half heart
        ctx.beginPath();
        ctx.rect(-size / 2, -size / 2, size / 2, size);
        ctx.clip();
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    const s = size / 2;
    ctx.moveTo(0, s * 0.6);
    ctx.bezierCurveTo(-s, -s * 0.3, -s, -s, 0, -s * 0.4);
    ctx.bezierCurveTo(s, -s, s, -s * 0.3, 0, s * 0.6);
    ctx.fill();

    ctx.restore();

    if (isHalf) {
        // Draw empty half
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.rect(0, -size / 2, size / 2, size);
        ctx.clip();
        ctx.fillStyle = COLORS.heartEmpty;
        ctx.beginPath();
        const s2 = size / 2;
        ctx.moveTo(0, s2 * 0.6);
        ctx.bezierCurveTo(-s2, -s2 * 0.3, -s2, -s2, 0, -s2 * 0.4);
        ctx.bezierCurveTo(s2, -s2, s2, -s2 * 0.3, 0, s2 * 0.6);
        ctx.fill();
        ctx.restore();
    }
}

function drawMinimap() {
    const mapX = canvas.width - 100;
    const mapY = 10;
    const cellSize = 10;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(mapX - 5, mapY - 5, 95, 95);

    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            const room = floorMap[y]?.[x];
            if (!room) continue;

            const px = mapX + x * cellSize;
            const py = mapY + y * cellSize;
            const isVisited = visitedRooms.has(`${x},${y}`);
            const isCurrent = x === currentRoom.x && y === currentRoom.y;

            if (isCurrent) {
                ctx.fillStyle = '#FFFFFF';
            } else if (isVisited) {
                switch (room.type) {
                    case 'boss': ctx.fillStyle = '#CC4444'; break;
                    case 'treasure': ctx.fillStyle = '#CCCC44'; break;
                    default: ctx.fillStyle = '#666666';
                }
            } else {
                ctx.fillStyle = '#333333';
            }

            ctx.fillRect(px, py, cellSize - 1, cellSize - 1);
        }
    }
}

function drawParticles() {
    for (let p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawTitle() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#DDCCBB';
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('BASEMENT TEARS', canvas.width / 2, 200);

    ctx.font = '20px serif';
    ctx.fillStyle = '#AA9988';
    ctx.fillText('A Roguelike Dungeon Crawler', canvas.width / 2, 250);

    ctx.font = '16px monospace';
    ctx.fillStyle = '#DDCCBB';
    ctx.fillText('WASD - Move', canvas.width / 2, 350);
    ctx.fillText('Arrow Keys or IJKL - Shoot', canvas.width / 2, 380);

    ctx.fillStyle = Math.sin(Date.now() / 300) > 0 ? '#FFCC44' : '#AA9944';
    ctx.font = 'bold 24px serif';
    ctx.fillText('Press SPACE to Start', canvas.width / 2, 480);

    ctx.textAlign = 'left';
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.blood;
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('YOU DIED', canvas.width / 2, 250);

    ctx.fillStyle = '#DDCCBB';
    ctx.font = '20px monospace';
    ctx.fillText('Rooms Explored: ' + visitedRooms.size, canvas.width / 2, 320);

    ctx.fillStyle = Math.sin(Date.now() / 300) > 0 ? '#FFCC44' : '#AA9944';
    ctx.font = 'bold 20px serif';
    ctx.fillText('Press SPACE to Restart', canvas.width / 2, 420);

    ctx.textAlign = 'left';
}

// Update functions
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

function updatePickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dist = Math.sqrt(
            Math.pow(p.x - player.x, 2) +
            Math.pow(p.y - player.y, 2)
        );

        if (dist < 25) {
            switch (p.type) {
                case 'heart':
                    if (player.health < player.maxHealth) {
                        player.health = Math.min(player.health + 2, player.maxHealth);
                        pickups.splice(i, 1);
                    }
                    break;
                case 'coin':
                    player.coins++;
                    pickups.splice(i, 1);
                    break;
                case 'bomb':
                    player.bombs++;
                    pickups.splice(i, 1);
                    break;
                case 'key':
                    player.keys++;
                    pickups.splice(i, 1);
                    break;
            }
        }
    }
}

function checkRoomCleared() {
    const roomData = floorMap[currentRoom.y][currentRoom.x];
    if (!roomData.cleared && enemies.length === 0) {
        roomData.cleared = true;
        // Open doors
        doors.forEach(door => door.open = true);
    }
}

// Initialize game
function initGame() {
    generateFloor();
    player = new Player(
        ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2,
        ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2
    );
    generateRoom(floorMap[4][4]);
    tears = [];
    particles = [];
    gameState = 'playing';
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'title') {
        drawTitle();
    } else if (gameState === 'playing') {
        // Update
        player.update(dt);

        for (let i = tears.length - 1; i >= 0; i--) {
            if (!tears[i].update(dt)) {
                tears.splice(i, 1);
            }
        }

        for (let i = enemies.length - 1; i >= 0; i--) {
            if (!enemies[i].update(dt)) {
                enemies.splice(i, 1);
            }
        }

        updateParticles(dt);
        updatePickups();
        checkRoomCleared();

        // Flash effect
        if (flashAlpha > 0) {
            flashAlpha -= dt * 2;
        }

        // Draw
        drawRoom();
        pickups.forEach(() => {}); // Already drawn in drawRoom
        enemies.forEach(e => e.draw());
        tears.forEach(t => t.draw());
        player.draw();
        drawParticles();
        drawHUD();

        // Screen flash
        if (flashAlpha > 0) {
            ctx.fillStyle = `rgba(255, 0, 0, ${flashAlpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    } else if (gameState === 'gameover') {
        drawRoom();
        enemies.forEach(e => e.draw());
        drawHUD();
        drawGameOver();
    }

    requestAnimationFrame(gameLoop);
}

// Input handlers
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;

    if (gameState === 'title' && e.key === ' ') {
        initGame();
    } else if (gameState === 'gameover' && e.key === ' ') {
        initGame();
    }
});

document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

// Expose for testing
window.gameState = () => ({
    state: gameState,
    playerHealth: player ? player.health : 0,
    enemies: enemies.length,
    room: currentRoom,
    visited: visitedRooms.size
});
window.startGame = initGame;

// Start
requestAnimationFrame(gameLoop);
