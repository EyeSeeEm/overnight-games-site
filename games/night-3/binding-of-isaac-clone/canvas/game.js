// Basement Tears - Binding of Isaac Style Roguelike
// 20 Expand + 20 Polish passes

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = 960;
canvas.height = 720;

const TILE_SIZE = 48;
const ROOM_WIDTH = 13;
const ROOM_HEIGHT = 7;
const ROOM_OFFSET_X = (canvas.width - ROOM_WIDTH * TILE_SIZE) / 2;
const ROOM_OFFSET_Y = 100;

// Colors
const COLORS = {
    floor: '#2A2018',
    floorAlt: '#231A12',
    wall: '#4A4A4A',
    wallDark: '#2A2A2A',
    wallLight: '#5A5A5A',
    door: '#4A3A2A',
    doorFrame: '#1A1A1A',
    player: '#EECCBB',
    playerOutline: '#AA8877',
    tear: '#6688CC',
    tearRed: '#CC4444',
    tearHighlight: '#99BBEE',
    blood: '#AA2222',
    bloodDark: '#661111',
    rock: '#6A6A6A',
    rockDark: '#4A4A4A',
    poop: '#6A4A2A',
    poopDark: '#4A3A1A',
    heart: '#CC2222',
    heartEmpty: '#222222',
    heartSoul: '#4466AA',
    coin: '#FFDD44',
    bomb: '#444444',
    key: '#FFCC22',
    fly: '#3A3A3A',
    gaper: '#DDAA88',
    spider: '#3A3020',
    fire: '#FF6622',
    spike: '#666666'
};

// Enemy data
const ENEMY_DATA = {
    fly: { health: 4, speed: 70, damage: 1, width: 18, height: 18 },
    redFly: { health: 6, speed: 80, damage: 1, width: 18, height: 18 },
    gaper: { health: 12, speed: 45, damage: 1, width: 30, height: 30 },
    frowningGaper: { health: 18, speed: 55, damage: 1, width: 30, height: 30 },
    spider: { health: 6, speed: 90, damage: 1, width: 22, height: 22 },
    bigSpider: { health: 15, speed: 60, damage: 1, width: 36, height: 36 },
    hopper: { health: 8, speed: 0, damage: 1, width: 24, height: 24, jumps: true },
    host: { health: 20, speed: 0, damage: 1, width: 28, height: 28, hides: true },
    leaper: { health: 14, speed: 50, damage: 1, width: 26, height: 26, leaps: true },
    charger: { health: 10, speed: 150, damage: 1, width: 26, height: 26, charges: true },
    globin: { health: 22, speed: 40, damage: 1, width: 28, height: 28, regenerates: true },
    bony: { health: 8, speed: 35, damage: 1, width: 24, height: 24, shoots: true },
    boss_monstro: { health: 200, speed: 30, damage: 2, width: 80, height: 80, isBoss: true }
};

// Item data
const ITEMS = {
    sad_onion: { name: 'Sad Onion', stat: 'tearDelay', value: -0.08, desc: 'Tears up' },
    spinach: { name: 'Spinach', stat: 'damage', value: 1.2, desc: 'Damage up' },
    growth_hormones: { name: 'Growth Hormones', stat: 'damage', value: 0.8, desc: 'Damage + Speed up' },
    cat_o_nine: { name: "Cat-o-nine-tails", stat: 'range', value: 50, desc: 'Range up' },
    jesus_juice: { name: 'Jesus Juice', stat: 'damage', value: 0.5, desc: 'Damage up' },
    magic_mushroom: { name: 'Magic Mushroom', stat: 'damage', value: 1.5, desc: 'All stats up!' },
    pentagram: { name: 'Pentagram', stat: 'damage', value: 1, desc: 'Damage up' },
    mark: { name: 'The Mark', stat: 'damage', value: 1, desc: 'Damage + Speed up' },
    wire_coat_hanger: { name: 'Wire Coat Hanger', stat: 'tearDelay', value: -0.05, desc: 'Tears up' },
    inner_eye: { name: 'Inner Eye', stat: 'multishot', value: 3, desc: 'Triple shot' }
};

// Game state
let gameState = 'title';
let player = null;
let tears = [];
let enemies = [];
let pickups = [];
let obstacles = [];
let particles = [];
let bloodStains = [];
let doors = [];
let items = [];

// Floor state
let currentRoom = { x: 4, y: 4 };
let floorMap = [];
let visitedRooms = new Set();
let floorNum = 1;
let totalKills = 0;

// Input
const keys = {};
let lastFireDir = { x: 0, y: 1 };
let screenShake = 0;
let flashAlpha = 0;

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.speed = 160;
        this.health = 6;
        this.maxHealth = 6;
        this.soulHearts = 0;
        this.coins = 0;
        this.bombs = 1;
        this.keys = 1;
        this.damage = 3.5;
        this.tearDelay = 0.35;
        this.fireTimer = 0;
        this.range = 220;
        this.shotSpeed = 320;
        this.invulnTimer = 0;
        this.headAngle = 0;
        this.bodyBob = 0;
        this.blinkTimer = 0;
        this.multishot = 1;
        this.tearColor = COLORS.tear;
        this.collectedItems = [];
    }

    update(dt) {
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy = -1;
        if (keys['s'] || keys['arrowdown']) dy = 1;
        if (keys['a'] || keys['arrowleft']) dx = -1;
        if (keys['d'] || keys['arrowright']) dx = 1;

        if (dx && dy) { dx *= 0.707; dy *= 0.707; }

        if (dx || dy) this.bodyBob += dt * 15;

        const newX = this.x + dx * this.speed * dt;
        const newY = this.y + dy * this.speed * dt;

        const minX = ROOM_OFFSET_X + TILE_SIZE + this.width / 2;
        const maxX = ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE - this.width / 2;
        const minY = ROOM_OFFSET_Y + TILE_SIZE + this.height / 2;
        const maxY = ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE - this.height / 2;

        let canMoveX = !checkObstacleCollision(newX, this.y, this.width * 0.6, this.height * 0.6);
        let canMoveY = !checkObstacleCollision(this.x, newY, this.width * 0.6, this.height * 0.6);

        if (canMoveX && newX > minX && newX < maxX) this.x = newX;
        if (canMoveY && newY > minY && newY < maxY) this.y = newY;

        // Shooting (IJKL or arrow keys)
        let fireX = 0, fireY = 0;
        if (keys['i']) fireY = -1;
        if (keys['k']) fireY = 1;
        if (keys['j']) fireX = -1;
        if (keys['l']) fireX = 1;

        // Cardinal direction only
        if (Math.abs(fireX) > 0 && Math.abs(fireY) > 0) {
            if (Math.random() > 0.5) fireY = 0;
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

        // Place bomb
        if (keys['e'] && this.bombs > 0 && !this.bombCooldown) {
            this.placeBomb();
            this.bombCooldown = true;
        }
        if (!keys['e']) this.bombCooldown = false;

        if (this.invulnTimer > 0) this.invulnTimer -= dt;

        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) this.blinkTimer = 3 + Math.random() * 2;

        this.checkDoors();
        this.checkSpikes(dt);
    }

    shoot(dx, dy) {
        const spread = this.multishot > 1 ? 0.15 : 0;
        for (let i = 0; i < this.multishot; i++) {
            const angle = Math.atan2(dy, dx) + (i - (this.multishot - 1) / 2) * spread;
            const vx = Math.cos(angle) * this.shotSpeed;
            const vy = Math.sin(angle) * this.shotSpeed;
            tears.push(new Tear(this.x, this.y - 10, vx, vy, this.damage, this.range, this.tearColor));
        }
        this.fireTimer = this.tearDelay;
        this.blinkTimer = 0.1;
    }

    placeBomb() {
        this.bombs--;
        obstacles.push({
            x: this.x,
            y: this.y,
            width: 32,
            height: 32,
            type: 'bomb',
            timer: 2.0
        });
    }

    takeDamage(amount) {
        if (this.invulnTimer > 0) return;

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
        screenShake = 10;
        flashAlpha = 0.4;

        for (let i = 0; i < 12; i++) {
            particles.push({
                x: this.x, y: this.y,
                vx: (Math.random() - 0.5) * 250,
                vy: (Math.random() - 0.5) * 250,
                life: 0.6, maxLife: 0.6,
                color: COLORS.blood, size: 5
            });
        }

        if (this.health <= 0) {
            gameState = 'gameover';
        }
    }

    checkDoors() {
        doors.forEach(door => {
            if (!door.open) return;
            const dist = Math.sqrt(Math.pow(this.x - door.x, 2) + Math.pow(this.y - door.y, 2));
            if (dist < 35) transitionRoom(door.direction);
        });
    }

    checkSpikes(dt) {
        for (let obs of obstacles) {
            if (obs.type !== 'spike') continue;
            const dist = Math.sqrt(Math.pow(this.x - obs.x, 2) + Math.pow(this.y - obs.y, 2));
            if (dist < 25) {
                this.takeDamage(1);
            }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Low health pulse
        if (this.health <= 2) {
            const pulse = Math.sin(Date.now() / 150) * 0.2 + 0.8;
            ctx.globalAlpha *= pulse;
        }

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const bobOffset = Math.sin(this.bodyBob) * 2;
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.ellipse(0, 6 + bobOffset, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.arc(0, -8, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = COLORS.playerOutline;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes
        const eyeOffset = 5;
        const blinking = this.blinkTimer < 0.1;

        ctx.fillStyle = '#000';
        if (blinking) {
            ctx.fillRect(-eyeOffset - 3, -10, 6, 2);
            ctx.fillRect(eyeOffset - 3, -10, 6, 2);
        } else {
            ctx.beginPath();
            ctx.ellipse(-eyeOffset, -9, 4, 6, 0, 0, Math.PI * 2);
            ctx.ellipse(eyeOffset, -9, 4, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(-eyeOffset + lastFireDir.x * 1.5, -9 + lastFireDir.y * 1.5, 2.5, 0, Math.PI * 2);
            ctx.arc(eyeOffset + lastFireDir.x * 1.5, -9 + lastFireDir.y * 1.5, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Tears streaming when shooting
        if (this.fireTimer > this.tearDelay - 0.15) {
            ctx.fillStyle = this.tearColor;
            ctx.beginPath();
            ctx.ellipse(-eyeOffset, 0, 2.5, 8, 0, 0, Math.PI * 2);
            ctx.ellipse(eyeOffset, 0, 2.5, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mouth (sad)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0.2, Math.PI - 0.2);
        ctx.stroke();

        ctx.restore();
    }
}

// Tear class
class Tear {
    constructor(x, y, vx, vy, damage, range, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.range = range;
        this.color = color || COLORS.tear;
        this.distanceTraveled = 0;
        this.size = 10;
        this.height = 0;
    }

    update(dt) {
        const dx = this.vx * dt;
        const dy = this.vy * dt;

        this.x += dx;
        this.y += dy;
        this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);

        const progress = this.distanceTraveled / this.range;
        this.height = Math.sin(progress * Math.PI) * 18;

        if (progress > 0.7) {
            this.size = 10 * (1 - (progress - 0.7) / 0.3);
        }

        if (this.x < ROOM_OFFSET_X + TILE_SIZE ||
            this.x > ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE ||
            this.y < ROOM_OFFSET_Y + TILE_SIZE ||
            this.y > ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE) {
            this.splash();
            return false;
        }

        if (checkObstacleCollision(this.x, this.y, 4, 4)) {
            this.splash();
            return false;
        }

        for (let e of enemies) {
            const dist = Math.sqrt(Math.pow(this.x - e.x, 2) + Math.pow(this.y - e.y, 2));
            if (dist < e.width / 2 + this.size) {
                e.takeDamage(this.damage, this.vx, this.vy);
                this.splash();
                return false;
            }
        }

        return this.distanceTraveled < this.range;
    }

    splash() {
        for (let i = 0; i < 6; i++) {
            particles.push({
                x: this.x, y: this.y - this.height,
                vx: (Math.random() - 0.5) * 120,
                vy: (Math.random() - 0.5) * 120,
                life: 0.35, maxLife: 0.35,
                color: this.color, size: 4
            });
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y - this.height);

        // Glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(-this.size * 0.3, -this.size * 0.3, this.size * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        const data = ENEMY_DATA[type] || ENEMY_DATA.fly;
        this.width = data.width;
        this.height = data.height;
        this.speed = data.speed;
        this.health = data.health;
        this.maxHealth = data.health;
        this.damage = data.damage;
        this.isBoss = data.isBoss || false;
        this.hitFlash = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.floatPhase = Math.random() * Math.PI * 2;
        this.moveTimer = 0;
        this.moveDir = { x: 0, y: 0 };
        this.state = 'idle';
        this.stateTimer = 0;
        this.fireTimer = 0;
        this.hideTimer = 0;
        this.jumping = false;
        this.jumpHeight = 0;
        this.spawnAnim = 0.5;
    }

    update(dt) {
        // Spawn animation
        if (this.spawnAnim > 0) {
            this.spawnAnim -= dt;
            return true;
        }

        this.x += this.knockbackX * dt;
        this.y += this.knockbackY * dt;
        this.knockbackX *= 0.9;
        this.knockbackY *= 0.9;

        if (this.hitFlash > 0) this.hitFlash -= dt;

        this.updateBehavior(dt);

        // Keep in bounds
        const minX = ROOM_OFFSET_X + TILE_SIZE + this.width / 2;
        const maxX = ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE - this.width / 2;
        const minY = ROOM_OFFSET_Y + TILE_SIZE + this.height / 2;
        const maxY = ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE - this.height / 2;

        this.x = Math.max(minX, Math.min(maxX, this.x));
        this.y = Math.max(minY, Math.min(maxY, this.y));

        // Player collision (not while jumping)
        if (player && !this.jumping && this.spawnAnim <= 0) {
            const dist = Math.sqrt(Math.pow(this.x - player.x, 2) + Math.pow(this.y - player.y, 2));
            if (dist < (this.width + player.width) / 2) {
                player.takeDamage(this.damage);
            }
        }

        return this.health > 0;
    }

    updateBehavior(dt) {
        switch (this.type) {
            case 'fly':
            case 'redFly':
                this.updateFly(dt);
                break;
            case 'gaper':
            case 'frowningGaper':
                this.updateGaper(dt);
                break;
            case 'spider':
            case 'bigSpider':
                this.updateSpider(dt);
                break;
            case 'hopper':
                this.updateHopper(dt);
                break;
            case 'host':
                this.updateHost(dt);
                break;
            case 'leaper':
                this.updateLeaper(dt);
                break;
            case 'charger':
                this.updateCharger(dt);
                break;
            case 'bony':
                this.updateBony(dt);
                break;
            case 'boss_monstro':
                this.updateMonstro(dt);
                break;
            default:
                this.updateGaper(dt);
        }
    }

    updateFly(dt) {
        this.floatPhase += dt * 5;
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.x += (dx / dist) * this.speed * dt + (Math.random() - 0.5) * 30 * dt;
                this.y += (dy / dist) * this.speed * dt + (Math.random() - 0.5) * 30 * dt;
            }
        }
    }

    updateGaper(dt) {
        if (player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                const newX = this.x + (dx / dist) * this.speed * dt;
                const newY = this.y + (dy / dist) * this.speed * dt;
                if (!checkObstacleCollision(newX, this.y, this.width * 0.7, this.height * 0.7)) this.x = newX;
                if (!checkObstacleCollision(this.x, newY, this.width * 0.7, this.height * 0.7)) this.y = newY;
            }
        }
    }

    updateSpider(dt) {
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            this.moveTimer = 0.3 + Math.random() * 0.4;
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
        if (!checkObstacleCollision(newX, this.y, this.width * 0.7, this.height * 0.7)) this.x = newX;
        if (!checkObstacleCollision(this.x, newY, this.width * 0.7, this.height * 0.7)) this.y = newY;
    }

    updateHopper(dt) {
        this.stateTimer -= dt;
        if (this.state === 'idle' && this.stateTimer <= 0) {
            this.state = 'jump';
            this.stateTimer = 0.5;
            this.jumping = true;
            if (player) {
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                this.moveDir = { x: dx / dist, y: dy / dist };
            }
        } else if (this.state === 'jump') {
            const progress = 1 - this.stateTimer / 0.5;
            this.jumpHeight = Math.sin(progress * Math.PI) * 40;
            this.x += this.moveDir.x * 150 * dt;
            this.y += this.moveDir.y * 150 * dt;
            if (this.stateTimer <= 0) {
                this.state = 'idle';
                this.stateTimer = 1 + Math.random();
                this.jumping = false;
                this.jumpHeight = 0;
            }
        }
    }

    updateHost(dt) {
        this.stateTimer -= dt;
        if (this.state === 'hidden') {
            if (player) {
                const dist = Math.sqrt(Math.pow(this.x - player.x, 2) + Math.pow(this.y - player.y, 2));
                if (dist < 150 && this.stateTimer <= 0) {
                    this.state = 'attack';
                    this.stateTimer = 1.5;
                }
            }
        } else if (this.state === 'attack') {
            this.fireTimer -= dt;
            if (this.fireTimer <= 0 && player) {
                this.fireTimer = 0.4;
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                tears.push(new EnemyTear(this.x, this.y, Math.cos(angle) * 200, Math.sin(angle) * 200));
            }
            if (this.stateTimer <= 0) {
                this.state = 'hidden';
                this.stateTimer = 2;
            }
        }
    }

    updateLeaper(dt) {
        this.stateTimer -= dt;
        if (this.state === 'idle' && this.stateTimer <= 0 && player) {
            const dist = Math.sqrt(Math.pow(this.x - player.x, 2) + Math.pow(this.y - player.y, 2));
            if (dist < 200) {
                this.state = 'leap';
                this.stateTimer = 0.4;
                this.jumping = true;
                this.moveDir = { x: (player.x - this.x) / dist, y: (player.y - this.y) / dist };
            }
        } else if (this.state === 'leap') {
            const progress = 1 - this.stateTimer / 0.4;
            this.jumpHeight = Math.sin(progress * Math.PI) * 50;
            this.x += this.moveDir.x * 200 * dt;
            this.y += this.moveDir.y * 200 * dt;
            if (this.stateTimer <= 0) {
                this.state = 'idle';
                this.stateTimer = 1.5;
                this.jumping = false;
                this.jumpHeight = 0;
            }
        }
    }

    updateCharger(dt) {
        this.stateTimer -= dt;
        if (this.state === 'idle' && this.stateTimer <= 0 && player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            if (Math.abs(dx) < 30 || Math.abs(dy) < 30) {
                this.state = 'charge';
                this.stateTimer = 0.8;
                this.moveDir = { x: Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : 0, y: Math.abs(dy) >= Math.abs(dx) ? Math.sign(dy) : 0 };
            }
        } else if (this.state === 'charge') {
            const newX = this.x + this.moveDir.x * this.speed * dt;
            const newY = this.y + this.moveDir.y * this.speed * dt;
            if (checkObstacleCollision(newX, newY, this.width, this.height)) {
                this.state = 'idle';
                this.stateTimer = 1;
                screenShake = 5;
            } else {
                this.x = newX;
                this.y = newY;
            }
            if (this.stateTimer <= 0) {
                this.state = 'idle';
                this.stateTimer = 1;
            }
        }
    }

    updateBony(dt) {
        this.updateGaper(dt);
        this.fireTimer -= dt;
        if (this.fireTimer <= 0 && player) {
            const dist = Math.sqrt(Math.pow(this.x - player.x, 2) + Math.pow(this.y - player.y, 2));
            if (dist < 250) {
                this.fireTimer = 2;
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                tears.push(new EnemyTear(this.x, this.y, Math.cos(angle) * 180, Math.sin(angle) * 180));
            }
        }
    }

    updateMonstro(dt) {
        this.stateTimer -= dt;
        if (this.state === 'idle' && this.stateTimer <= 0) {
            const attacks = ['jump', 'spit'];
            this.state = attacks[Math.floor(Math.random() * attacks.length)];
            this.stateTimer = this.state === 'jump' ? 1.0 : 0.8;
            if (this.state === 'jump' && player) {
                this.moveDir = { x: player.x - this.x, y: player.y - this.y };
            }
        } else if (this.state === 'jump') {
            const progress = 1 - this.stateTimer / 1.0;
            this.jumpHeight = Math.sin(progress * Math.PI) * 100;
            this.x += this.moveDir.x * dt;
            this.y += this.moveDir.y * dt;
            if (this.stateTimer <= 0) {
                this.state = 'idle';
                this.stateTimer = 1.5;
                this.jumpHeight = 0;
                screenShake = 15;
                // Spawn tears on landing
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    tears.push(new EnemyTear(this.x, this.y, Math.cos(angle) * 150, Math.sin(angle) * 150));
                }
            }
        } else if (this.state === 'spit') {
            if (this.stateTimer <= 0.3 && this.stateTimer > 0.2 && player) {
                for (let i = 0; i < 5; i++) {
                    const spread = (Math.random() - 0.5) * 0.8;
                    const angle = Math.atan2(player.y - this.y, player.x - this.x) + spread;
                    tears.push(new EnemyTear(this.x, this.y - 20, Math.cos(angle) * 220, Math.sin(angle) * 220));
                }
                this.stateTimer = 0.2;
            }
            if (this.stateTimer <= 0) {
                this.state = 'idle';
                this.stateTimer = 2;
            }
        }
    }

    takeDamage(amount, knockX, knockY) {
        if (this.state === 'hidden') return; // Host is invulnerable when hidden

        this.health -= amount;
        this.hitFlash = 0.15;
        screenShake = 3;

        const knockForce = this.isBoss ? 50 : 180;
        const knockLen = Math.sqrt(knockX * knockX + knockY * knockY);
        if (knockLen > 0) {
            this.knockbackX = (knockX / knockLen) * knockForce;
            this.knockbackY = (knockY / knockLen) * knockForce;
        }

        // Floating damage number
        particles.push({
            x: this.x, y: this.y - 20,
            vx: (Math.random() - 0.5) * 30,
            vy: -60,
            life: 0.7, maxLife: 0.7,
            text: Math.round(amount).toString(),
            isText: true
        });

        if (this.health <= 0) this.die();
    }

    die() {
        totalKills++;

        // Blood splatter
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: this.x, y: this.y,
                vx: (Math.random() - 0.5) * 250,
                vy: (Math.random() - 0.5) * 250,
                life: 0.6, maxLife: 0.6,
                color: COLORS.blood, size: 6
            });
        }

        // Blood stain
        bloodStains.push({ x: this.x, y: this.y, size: 15 + Math.random() * 15 });

        // Drop chance
        if (Math.random() < (this.isBoss ? 1.0 : 0.25)) {
            const types = this.isBoss ? ['heart', 'heart', 'item'] : ['heart', 'coin', 'coin', 'bomb', 'key'];
            const type = types[Math.floor(Math.random() * types.length)];
            pickups.push({ x: this.x, y: this.y, type: type, bobPhase: 0 });
        }
    }

    draw() {
        if (this.spawnAnim > 0) {
            ctx.globalAlpha = 1 - this.spawnAnim / 0.5;
        }

        ctx.save();
        ctx.translate(this.x, this.y - (this.jumpHeight || 0));

        if (this.hitFlash > 0) ctx.fillStyle = '#FFFFFF';

        switch (this.type) {
            case 'fly':
            case 'redFly':
                this.drawFly();
                break;
            case 'gaper':
            case 'frowningGaper':
                this.drawGaper();
                break;
            case 'spider':
            case 'bigSpider':
                this.drawSpider();
                break;
            case 'hopper':
                this.drawHopper();
                break;
            case 'host':
                this.drawHost();
                break;
            case 'leaper':
                this.drawLeaper();
                break;
            case 'charger':
                this.drawCharger();
                break;
            case 'bony':
                this.drawBony();
                break;
            case 'boss_monstro':
                this.drawMonstro();
                break;
            default:
                this.drawGaper();
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }

    drawFly() {
        const bobY = Math.sin(this.floatPhase) * 4;
        const isRed = this.type === 'redFly';

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 10 - bobY / 2, 7, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.fillStyle = this.hitFlash > 0 ? '#FFF' : '#555';
        const wingPhase = Date.now() / 25;
        ctx.beginPath();
        ctx.ellipse(-7 + Math.sin(wingPhase) * 2, bobY - 2, 5, 7, -0.3, 0, Math.PI * 2);
        ctx.ellipse(7 - Math.sin(wingPhase) * 2, bobY - 2, 5, 7, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.hitFlash > 0 ? '#FFF' : (isRed ? '#882222' : COLORS.fly);
        ctx.beginPath();
        ctx.arc(0, bobY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isRed ? '#FF4444' : '#FF0000';
        ctx.beginPath();
        ctx.arc(-2, bobY - 2, 2.5, 0, Math.PI * 2);
        ctx.arc(2, bobY - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawGaper() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.hitFlash > 0 ? '#FFF' : COLORS.gaper;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#8A6A4A';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(-5, -3, 5, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(5, -3, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.type === 'frowningGaper' ? '#661111' : '#4A2A1A';
        ctx.beginPath();
        ctx.ellipse(0, 8, 7, 6, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSpider() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 10, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.hitFlash > 0 ? '#FFF' : COLORS.spider;
        ctx.lineWidth = this.type === 'bigSpider' ? 3 : 2;
        const legPhase = Date.now() / 80;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI - Math.PI / 2;
            const legMove = Math.sin(legPhase + i) * 3;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * 6, Math.sin(angle) * 4);
            ctx.lineTo(Math.cos(angle) * 14 + legMove, Math.sin(angle) * 8 + 3);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-Math.cos(angle) * 6, Math.sin(angle) * 4);
            ctx.lineTo(-Math.cos(angle) * 14 - legMove, Math.sin(angle) * 8 + 3);
            ctx.stroke();
        }

        ctx.fillStyle = this.hitFlash > 0 ? '#FFF' : COLORS.spider;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2 - 2, this.height / 2 - 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(-3, -2, 2, 0, Math.PI * 2);
        ctx.arc(3, -2, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHopper() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.hitFlash > 0 ? '#FFF' : '#556644';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(0, -2, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHost() {
        if (this.state === 'hidden') {
            ctx.fillStyle = this.hitFlash > 0 ? '#FFF' : '#AA8866';
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#886644';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = this.hitFlash > 0 ? '#FFF' : '#DDAA88';
            ctx.beginPath();
            ctx.arc(0, -5, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(-4, -6, 3, 4, 0, 0, Math.PI * 2);
            ctx.ellipse(4, -6, 3, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#662222';
            ctx.beginPath();
            ctx.ellipse(0, 3, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawLeaper() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.hitFlash > 0 ? '#FFF' : '#AA6644';
        ctx.beginPath();
        ctx.ellipse(0, 0, 13, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(-4, -2, 3, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(4, -2, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCharger() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.hitFlash > 0 ? '#FFF' : '#664422';
        ctx.beginPath();
        ctx.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF4400';
        ctx.beginPath();
        ctx.arc(-4, -2, 3, 0, Math.PI * 2);
        ctx.arc(4, -2, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBony() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.hitFlash > 0 ? '#FFF' : '#DDDDCC';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(-4, -2, 3, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(4, -2, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawMonstro() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 35, 35, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.hitFlash > 0 ? '#FFF' : '#DDAA88';
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#AA7755';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(-12, -8, 8, 12, 0, 0, Math.PI * 2);
        ctx.ellipse(12, -8, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#662222';
        ctx.beginPath();
        ctx.ellipse(0, 18, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Teeth
        ctx.fillStyle = '#EEEECC';
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 4 - 2, 12);
            ctx.lineTo(i * 4 + 2, 12);
            ctx.lineTo(i * 4, 20);
            ctx.fill();
        }
    }
}

// Enemy tear
class EnemyTear {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = 2;
        this.size = 8;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;

        if (this.x < ROOM_OFFSET_X + TILE_SIZE ||
            this.x > ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE ||
            this.y < ROOM_OFFSET_Y + TILE_SIZE ||
            this.y > ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE) {
            return false;
        }

        if (player) {
            const dist = Math.sqrt(Math.pow(this.x - player.x, 2) + Math.pow(this.y - player.y, 2));
            if (dist < player.width / 2 + this.size) {
                player.takeDamage(1);
                return false;
            }
        }

        return this.life > 0;
    }

    draw() {
        ctx.fillStyle = COLORS.bloodDark;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.blood;
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 2, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Utility
function checkObstacleCollision(x, y, w, h) {
    for (let obs of obstacles) {
        if (obs.type === 'bomb' || obs.type === 'spike') continue;
        if (x - w / 2 < obs.x + obs.width / 2 &&
            x + w / 2 > obs.x - obs.width / 2 &&
            y - h / 2 < obs.y + obs.height / 2 &&
            y + h / 2 > obs.y - obs.height / 2) {
            return true;
        }
    }
    return false;
}

function weightedRandom(items, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
        if (r < weights[i]) return items[i];
        r -= weights[i];
    }
    return items[0];
}

// Floor generation
function generateFloor() {
    floorMap = [];
    for (let y = 0; y < 9; y++) {
        floorMap[y] = [];
        for (let x = 0; x < 9; x++) {
            floorMap[y][x] = null;
        }
    }

    floorMap[4][4] = { type: 'start', cleared: true };

    const roomCount = 8 + floorNum * 2;
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

    // Boss room
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

    // Treasure room
    for (let pos of roomPositions) {
        if (floorMap[pos.y][pos.x].type === 'normal') {
            floorMap[pos.y][pos.x] = { type: 'treasure', cleared: false };
            break;
        }
    }

    // Shop room
    for (let pos of roomPositions) {
        if (floorMap[pos.y][pos.x].type === 'normal') {
            floorMap[pos.y][pos.x] = { type: 'shop', cleared: true };
            break;
        }
    }

    currentRoom = { x: 4, y: 4 };
    visitedRooms.clear();
    visitedRooms.add('4,4');
}

function generateRoom(roomData) {
    enemies = [];
    obstacles = [];
    pickups = [];
    doors = [];
    items = [];

    // Enemy tears from previous room
    tears = tears.filter(t => !(t instanceof EnemyTear));

    if (!roomData) return;

    // Generate doors
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
            const adjRoom = floorMap[adjY][adjX];
            doors.push({
                x: dir.doorX,
                y: dir.doorY,
                direction: dir,
                open: roomData.cleared,
                locked: adjRoom.type === 'treasure' || adjRoom.type === 'shop'
            });
        }
    }

    if (roomData.cleared || roomData.type === 'start') return;

    // Spawn obstacles
    const obstacleCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < obstacleCount; i++) {
        const ox = ROOM_OFFSET_X + (2 + Math.random() * (ROOM_WIDTH - 4)) * TILE_SIZE;
        const oy = ROOM_OFFSET_Y + (2 + Math.random() * (ROOM_HEIGHT - 4)) * TILE_SIZE;
        const types = ['rock', 'rock', 'poop', 'spike'];
        obstacles.push({
            x: ox, y: oy,
            width: TILE_SIZE - 8, height: TILE_SIZE - 8,
            type: types[Math.floor(Math.random() * types.length)]
        });
    }

    // Spawn enemies
    if (roomData.type === 'normal') {
        const enemyCount = 2 + Math.floor(Math.random() * 3) + floorNum;
        const types = ['fly', 'redFly', 'gaper', 'frowningGaper', 'spider', 'bigSpider', 'hopper', 'charger', 'leaper', 'bony'];
        for (let i = 0; i < enemyCount; i++) {
            const ex = ROOM_OFFSET_X + (2 + Math.random() * (ROOM_WIDTH - 4)) * TILE_SIZE;
            const ey = ROOM_OFFSET_Y + (2 + Math.random() * (ROOM_HEIGHT - 4)) * TILE_SIZE;
            enemies.push(new Enemy(ex, ey, types[Math.floor(Math.random() * types.length)]));
        }
    } else if (roomData.type === 'boss') {
        const bx = ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2;
        const by = ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2;
        enemies.push(new Enemy(bx, by, 'boss_monstro'));
    } else if (roomData.type === 'treasure') {
        const itemKeys = Object.keys(ITEMS);
        const randomItem = itemKeys[Math.floor(Math.random() * itemKeys.length)];
        items.push({
            x: ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2,
            y: ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2 - 20,
            id: randomItem,
            ...ITEMS[randomItem]
        });
        roomData.cleared = true;
        doors.forEach(d => d.open = true);
    } else if (roomData.type === 'shop') {
        pickups.push({ x: ROOM_OFFSET_X + 5 * TILE_SIZE, y: ROOM_OFFSET_Y + 3 * TILE_SIZE, type: 'heart', price: 3 });
        pickups.push({ x: ROOM_OFFSET_X + 7 * TILE_SIZE, y: ROOM_OFFSET_Y + 3 * TILE_SIZE, type: 'bomb', price: 5 });
        pickups.push({ x: ROOM_OFFSET_X + 9 * TILE_SIZE, y: ROOM_OFFSET_Y + 3 * TILE_SIZE, type: 'key', price: 5 });
    }
}

function transitionRoom(dir) {
    currentRoom.x += dir.x;
    currentRoom.y += dir.y;
    visitedRooms.add(`${currentRoom.x},${currentRoom.y}`);

    generateRoom(floorMap[currentRoom.y][currentRoom.x]);

    if (dir.x > 0) player.x = ROOM_OFFSET_X + 2 * TILE_SIZE;
    if (dir.x < 0) player.x = ROOM_OFFSET_X + (ROOM_WIDTH - 2) * TILE_SIZE;
    if (dir.y > 0) player.y = ROOM_OFFSET_Y + 2 * TILE_SIZE;
    if (dir.y < 0) player.y = ROOM_OFFSET_Y + (ROOM_HEIGHT - 2) * TILE_SIZE;
}

// Drawing
function drawRoom() {
    // Blood stains
    ctx.fillStyle = COLORS.bloodDark;
    for (let stain of bloodStains) {
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(stain.x, stain.y, stain.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Floor
    for (let y = 1; y < ROOM_HEIGHT - 1; y++) {
        for (let x = 1; x < ROOM_WIDTH - 1; x++) {
            const px = ROOM_OFFSET_X + x * TILE_SIZE;
            const py = ROOM_OFFSET_Y + y * TILE_SIZE;
            ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

            // Floor detail
            if (Math.random() < 0.03) {
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.beginPath();
                ctx.arc(px + Math.random() * TILE_SIZE, py + Math.random() * TILE_SIZE, 3 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Walls
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH * TILE_SIZE, TILE_SIZE);
    ctx.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE, ROOM_WIDTH * TILE_SIZE, TILE_SIZE);
    ctx.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);
    ctx.fillRect(ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE, ROOM_OFFSET_Y, TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);

    // Wall texture
    ctx.fillStyle = COLORS.wallDark;
    for (let i = 0; i < ROOM_WIDTH; i++) {
        ctx.fillRect(ROOM_OFFSET_X + i * TILE_SIZE + 3, ROOM_OFFSET_Y + 3, TILE_SIZE - 6, 12);
        ctx.fillRect(ROOM_OFFSET_X + i * TILE_SIZE + 6, ROOM_OFFSET_Y + 18, TILE_SIZE - 12, 12);
        ctx.fillRect(ROOM_OFFSET_X + i * TILE_SIZE + 3, ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE + 3, TILE_SIZE - 6, 12);
    }
    for (let i = 0; i < ROOM_HEIGHT; i++) {
        ctx.fillRect(ROOM_OFFSET_X + 3, ROOM_OFFSET_Y + i * TILE_SIZE + 3, 12, TILE_SIZE - 6);
        ctx.fillRect(ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE + 3, ROOM_OFFSET_Y + i * TILE_SIZE + 3, 12, TILE_SIZE - 6);
    }

    // Doors
    doors.forEach(door => {
        ctx.fillStyle = COLORS.doorFrame;
        const isVertical = door.direction.y !== 0;

        if (isVertical) {
            ctx.fillRect(door.x - 30, door.y - 6, 60, 12);
        } else {
            ctx.fillRect(door.x - 6, door.y - 30, 12, 60);
        }

        ctx.fillStyle = door.open ? COLORS.floor : (door.locked ? COLORS.key : COLORS.door);
        if (isVertical) {
            ctx.fillRect(door.x - 24, door.y - 4, 48, 8);
        } else {
            ctx.fillRect(door.x - 4, door.y - 24, 8, 48);
        }
    });

    // Obstacles
    obstacles.forEach(obs => {
        ctx.save();
        ctx.translate(obs.x, obs.y);

        if (obs.type === 'rock') {
            ctx.fillStyle = COLORS.rock;
            ctx.beginPath();
            ctx.moveTo(-16, 10);
            ctx.lineTo(-10, -14);
            ctx.lineTo(10, -14);
            ctx.lineTo(16, 10);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = COLORS.rockDark;
            ctx.beginPath();
            ctx.moveTo(-12, 10);
            ctx.lineTo(-6, -8);
            ctx.lineTo(6, -8);
            ctx.lineTo(12, 10);
            ctx.closePath();
            ctx.fill();
        } else if (obs.type === 'poop') {
            ctx.fillStyle = COLORS.poop;
            ctx.beginPath();
            ctx.arc(0, 5, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(-5, -4, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(5, -2, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, -12, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = COLORS.poopDark;
            ctx.beginPath();
            ctx.arc(-2, 7, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (obs.type === 'spike') {
            ctx.fillStyle = COLORS.spike;
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * 4, Math.sin(angle) * 4);
                ctx.lineTo(Math.cos(angle + 0.3) * 16, Math.sin(angle + 0.3) * 16);
                ctx.lineTo(Math.cos(angle - 0.3) * 16, Math.sin(angle - 0.3) * 16);
                ctx.fill();
            }
        } else if (obs.type === 'bomb') {
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#AA6622';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -14);
            ctx.quadraticCurveTo(6, -20, 4, -26);
            ctx.stroke();
            // Flash
            if (obs.timer < 0.5 && Math.floor(obs.timer * 10) % 2 === 0) {
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    });

    // Items on pedestals
    items.forEach(item => {
        ctx.save();
        ctx.translate(item.x, item.y);

        // Pedestal
        ctx.fillStyle = '#555555';
        ctx.fillRect(-20, 20, 40, 20);
        ctx.fillStyle = '#666666';
        ctx.fillRect(-18, 22, 36, 16);

        // Glow
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FFDD44';
        ctx.globalAlpha = pulse;

        // Item icon
        ctx.fillStyle = '#FFDD44';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Item name
        if (Math.sqrt(Math.pow(item.x - player.x, 2) + Math.pow(item.y - player.y, 2)) < 60) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(item.name, item.x, item.y - 40);
            ctx.font = '12px monospace';
            ctx.fillStyle = '#AAAAAA';
            ctx.fillText(item.desc, item.x, item.y - 25);
            ctx.textAlign = 'left';
        }
    });

    // Pickups
    pickups.forEach(pickup => {
        ctx.save();
        pickup.bobPhase = (pickup.bobPhase || 0) + 0.05;
        const bobY = Math.sin(pickup.bobPhase) * 3;
        ctx.translate(pickup.x, pickup.y + bobY);

        ctx.shadowBlur = 12;
        ctx.shadowColor = pickup.type === 'heart' ? COLORS.heart :
                          pickup.type === 'coin' ? COLORS.coin :
                          pickup.type === 'bomb' ? '#666' : COLORS.key;

        switch (pickup.type) {
            case 'heart':
                ctx.fillStyle = COLORS.heart;
                ctx.beginPath();
                ctx.moveTo(0, 5);
                ctx.bezierCurveTo(-10, -5, -10, -12, 0, -7);
                ctx.bezierCurveTo(10, -12, 10, -5, 0, 5);
                ctx.fill();
                break;
            case 'coin':
                ctx.fillStyle = COLORS.coin;
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#AA9922';
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'bomb':
                ctx.fillStyle = COLORS.bomb;
                ctx.beginPath();
                ctx.arc(0, 3, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#AA6622';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -7);
                ctx.quadraticCurveTo(5, -12, 3, -16);
                ctx.stroke();
                break;
            case 'key':
                ctx.fillStyle = COLORS.key;
                ctx.beginPath();
                ctx.arc(0, -7, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(-2.5, -2, 5, 14);
                ctx.fillRect(0, 7, 5, 2.5);
                ctx.fillRect(0, 3, 5, 2.5);
                break;
        }

        // Price tag
        if (pickup.price) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('$' + pickup.price, 0, 25);
            ctx.textAlign = 'left';
        }

        ctx.restore();
    });
}

function drawHUD() {
    // Top HUD
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, canvas.width, 95);

    // Hearts
    const heartSize = 24;
    for (let i = 0; i < Math.ceil(player.maxHealth / 2); i++) {
        const hx = 25 + i * (heartSize + 5);
        const fullHearts = Math.floor(player.health / 2);
        const halfHeart = player.health % 2;

        if (i < fullHearts) {
            drawHeart(hx, 20, heartSize, COLORS.heart);
        } else if (i === fullHearts && halfHeart) {
            drawHeart(hx, 20, heartSize, COLORS.heart, true);
        } else {
            drawHeart(hx, 20, heartSize, COLORS.heartEmpty);
        }
    }

    // Soul hearts
    for (let i = 0; i < Math.ceil(player.soulHearts / 2); i++) {
        const hx = 25 + (Math.ceil(player.maxHealth / 2) + i) * (heartSize + 5);
        drawHeart(hx, 20, heartSize, COLORS.heartSoul);
    }

    // Pickups
    ctx.font = 'bold 16px monospace';

    ctx.fillStyle = COLORS.coin;
    ctx.beginPath();
    ctx.arc(30, 55, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(player.coins.toString().padStart(2, '0'), 48, 60);

    ctx.fillStyle = COLORS.bomb;
    ctx.beginPath();
    ctx.arc(100, 55, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(player.bombs.toString().padStart(2, '0'), 118, 60);

    ctx.fillStyle = COLORS.key;
    ctx.beginPath();
    ctx.arc(170, 51, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(168, 55, 4, 12);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(player.keys.toString().padStart(2, '0'), 188, 60);

    // Floor info
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px monospace';
    ctx.fillText('Basement ' + floorNum, 25, 85);

    // Minimap
    drawMinimap();

    // Boss health bar
    const boss = enemies.find(e => e.isBoss);
    if (boss) {
        const barWidth = 300;
        const barX = (canvas.width - barWidth) / 2;
        ctx.fillStyle = '#222';
        ctx.fillRect(barX, 70, barWidth, 16);
        ctx.fillStyle = COLORS.heart;
        ctx.fillRect(barX + 2, 72, (barWidth - 4) * (boss.health / boss.maxHealth), 12);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MONSTRO', canvas.width / 2, 84);
        ctx.textAlign = 'left';
    }
}

function drawHeart(x, y, size, color, isHalf = false) {
    ctx.save();
    ctx.translate(x, y);

    if (isHalf) {
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
    const mapX = canvas.width - 110;
    const mapY = 15;
    const cellSize = 11;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(mapX - 8, mapY - 8, 105, 105);

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
                    case 'shop': ctx.fillStyle = '#44CC44'; break;
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

        if (p.isText) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#FFFF44';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(p.text, p.x, p.y);
        } else {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
}

function drawTitle() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#DDCCBB';
    ctx.font = 'bold 56px serif';
    ctx.textAlign = 'center';
    ctx.fillText('BASEMENT TEARS', canvas.width / 2, 200);

    ctx.font = '22px serif';
    ctx.fillStyle = '#AA9988';
    ctx.fillText('A Roguelike Dungeon Crawler', canvas.width / 2, 260);

    ctx.font = '18px monospace';
    ctx.fillStyle = '#DDCCBB';
    ctx.fillText('WASD - Move', canvas.width / 2, 380);
    ctx.fillText('IJKL - Shoot', canvas.width / 2, 410);
    ctx.fillText('E - Place Bomb', canvas.width / 2, 440);

    ctx.fillStyle = Math.sin(Date.now() / 300) > 0 ? '#FFCC44' : '#AA9944';
    ctx.font = 'bold 28px serif';
    ctx.fillText('Press SPACE to Start', canvas.width / 2, 550);

    ctx.textAlign = 'left';
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.blood;
    ctx.font = 'bold 56px serif';
    ctx.textAlign = 'center';
    ctx.fillText('YOU DIED', canvas.width / 2, 280);

    ctx.fillStyle = '#DDCCBB';
    ctx.font = '22px monospace';
    ctx.fillText('Rooms Explored: ' + visitedRooms.size, canvas.width / 2, 360);
    ctx.fillText('Enemies Killed: ' + totalKills, canvas.width / 2, 395);

    ctx.fillStyle = Math.sin(Date.now() / 300) > 0 ? '#FFCC44' : '#AA9944';
    ctx.font = 'bold 24px serif';
    ctx.fillText('Press SPACE to Restart', canvas.width / 2, 500);

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
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function updatePickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dist = Math.sqrt(Math.pow(p.x - player.x, 2) + Math.pow(p.y - player.y, 2));

        if (dist < 30) {
            if (p.price) {
                if (player.coins >= p.price) {
                    player.coins -= p.price;
                } else {
                    continue;
                }
            }

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

    // Items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dist = Math.sqrt(Math.pow(item.x - player.x, 2) + Math.pow(item.y - player.y, 2));
        if (dist < 35) {
            if (item.stat === 'multishot') {
                player.multishot = item.value;
            } else {
                player[item.stat] = (player[item.stat] || 0) + item.value;
            }
            player.collectedItems.push(item.id);
            items.splice(i, 1);

            // Pickup text
            particles.push({
                x: player.x, y: player.y - 50,
                vx: 0, vy: -30,
                life: 1.5, maxLife: 1.5,
                text: item.name + '!',
                isText: true
            });
        }
    }
}

function updateObstacles(dt) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (obs.type === 'bomb') {
            obs.timer -= dt;
            if (obs.timer <= 0) {
                // Explode
                screenShake = 15;
                for (let j = 0; j < 20; j++) {
                    particles.push({
                        x: obs.x, y: obs.y,
                        vx: (Math.random() - 0.5) * 300,
                        vy: (Math.random() - 0.5) * 300,
                        life: 0.5, maxLife: 0.5,
                        color: COLORS.fire, size: 8
                    });
                }

                // Damage enemies
                for (let e of enemies) {
                    const dist = Math.sqrt(Math.pow(e.x - obs.x, 2) + Math.pow(e.y - obs.y, 2));
                    if (dist < 100) {
                        e.takeDamage(60, e.x - obs.x, e.y - obs.y);
                    }
                }

                // Damage player
                const playerDist = Math.sqrt(Math.pow(player.x - obs.x, 2) + Math.pow(player.y - obs.y, 2));
                if (playerDist < 80) {
                    player.takeDamage(1);
                }

                // Destroy nearby obstacles
                for (let j = obstacles.length - 1; j >= 0; j--) {
                    if (i === j) continue;
                    const other = obstacles[j];
                    const dist = Math.sqrt(Math.pow(other.x - obs.x, 2) + Math.pow(other.y - obs.y, 2));
                    if (dist < 80 && other.type !== 'spike') {
                        obstacles.splice(j, 1);
                        if (j < i) i--;
                    }
                }

                obstacles.splice(i, 1);
            }
        }
    }
}

function checkRoomCleared() {
    const roomData = floorMap[currentRoom.y][currentRoom.x];
    if (!roomData.cleared && enemies.length === 0) {
        roomData.cleared = true;
        doors.forEach(door => door.open = true);
    }
}

// Initialize
function initGame() {
    floorNum = 1;
    totalKills = 0;
    bloodStains = [];
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

    // Screen shake
    let shakeX = 0, shakeY = 0;
    if (screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake;
        shakeY = (Math.random() - 0.5) * screenShake;
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    ctx.fillStyle = '#000';
    ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20);

    if (gameState === 'title') {
        drawTitle();
    } else if (gameState === 'playing') {
        player.update(dt);

        for (let i = tears.length - 1; i >= 0; i--) {
            if (!tears[i].update(dt)) tears.splice(i, 1);
        }

        for (let i = enemies.length - 1; i >= 0; i--) {
            if (!enemies[i].update(dt)) enemies.splice(i, 1);
        }

        updateObstacles(dt);
        updateParticles(dt);
        updatePickups();
        checkRoomCleared();

        if (flashAlpha > 0) flashAlpha -= dt * 3;

        drawRoom();
        enemies.forEach(e => e.draw());
        tears.forEach(t => t.draw());
        player.draw();
        drawParticles();
        drawHUD();

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

    ctx.restore();
    requestAnimationFrame(gameLoop);
}

// Input
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (gameState === 'title' && e.key === ' ') initGame();
    else if (gameState === 'gameover' && e.key === ' ') initGame();
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
    visited: visitedRooms.size,
    kills: totalKills
});
window.startGame = initGame;

requestAnimationFrame(gameLoop);
