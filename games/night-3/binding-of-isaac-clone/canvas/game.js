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

// Champion types and modifiers
const CHAMPION_TYPES = {
    none: { hpMult: 1, speedMult: 1, dmgMult: 1, color: null },
    red: { hpMult: 2, speedMult: 1, dmgMult: 1, color: '#FF4444' },
    yellow: { hpMult: 1, speedMult: 1.5, dmgMult: 1, color: '#FFFF44' },
    blue: { hpMult: 1.2, speedMult: 1, dmgMult: 1, color: '#4444FF', extraShots: true },
    green: { hpMult: 1, speedMult: 1, dmgMult: 1, color: '#44FF44', spawnFlyOnDeath: true },
    black: { hpMult: 1.5, speedMult: 1, dmgMult: 2, color: '#222222' }
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
    inner_eye: { name: 'Inner Eye', stat: 'multishot', value: 3, desc: 'Triple shot' },
    spoon_bender: { name: 'Spoon Bender', stat: 'homing', value: true, desc: 'Homing tears' },
    cupids_arrow: { name: "Cupid's Arrow", stat: 'piercing', value: true, desc: 'Piercing tears' },
    rubber_cement: { name: 'Rubber Cement', stat: 'bouncing', value: true, desc: 'Bouncing tears' },
    black_heart: { name: 'Black Heart', stat: 'blackHearts', value: 2, desc: 'Black hearts' },
    dead_cat: { name: 'Dead Cat', stat: 'lives', value: 9, desc: '9 Lives' },
    crickets_head: { name: "Cricket's Head", stat: 'damageMult', value: 1.5, desc: 'Damage x1.5' },
    polyphemus: { name: 'Polyphemus', stat: 'damage', value: 4, desc: 'HUGE damage up' },
    steven: { name: 'Steven', stat: 'damage', value: 1, desc: 'Damage up' },
    stigmata: { name: 'Stigmata', stat: 'damage', value: 0.3, desc: 'HP + Damage up' }
};

// Active items
const ACTIVE_ITEMS = {
    yum_heart: { name: 'Yum Heart', charges: 4, desc: 'Heal 1 heart' },
    book_of_belial: { name: 'Book of Belial', charges: 3, desc: '+2 damage this room' },
    the_poop: { name: 'The Poop', charges: 1, desc: 'Spawn poop' },
    lemon_mishap: { name: 'Lemon Mishap', charges: 2, desc: 'Create creep' },
    shoop_da_whoop: { name: 'Shoop Da Whoop', charges: 4, desc: 'Fire beam' }
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
let roomStates = {}; // Stores persistent state for visited rooms
let roomEntryPause = 0; // Brief pause when entering a room
let floorNum = 1;
let totalKills = 0;
let trapdoor = null; // Trapdoor to next floor
let bossDefeated = false;
let creepPools = []; // Lemon mishap damaging creep

// Input
const keys = {};
let lastFireDir = { x: 0, y: 1 };
let screenShakeAmount = 0;
let screenShakeDuration = 0;
let flashAlpha = 0;
let floatingTexts = [];
let isPaused = false;

// Helper functions
function addFloatingText(x, y, text, color, scale = 1) {
    floatingTexts.push({
        x, y, text, color, scale,
        life: 1.0, maxLife: 1.0,
        vy: -80
    });
}

function screenShake(amount, duration) {
    screenShakeAmount = Math.max(screenShakeAmount, amount);
    screenShakeDuration = Math.max(screenShakeDuration, duration);
}

// Debug mode
let debugMode = false;
let fps = 60;
let frameCount = 0;
let fpsTimer = 0;

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
        this.blackHearts = 0;
        this.coins = 0;
        this.bombs = 1;
        this.keys = 1;
        this.damage = 3.5;
        this.damageMult = 1;
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
        // Tear modifiers
        this.homing = false;
        this.piercing = false;
        this.bouncing = false;
        // Active items
        this.activeItem = null;
        this.activeCharges = 0;
        this.maxCharges = 0;
        // Temp bonuses
        this.tempDamageBonus = 0;
        this.tempDamageTimer = 0;
        // Extra lives
        this.lives = 0;
    }

    update(dt) {
        // Brief pause on room entry - player can't move but can still look around
        if (roomEntryPause > 0) {
            roomEntryPause -= dt;
            return; // Skip movement during pause
        }

        // Movement: WASD only
        let dx = 0, dy = 0;
        if (keys['w']) dy = -1;
        if (keys['s']) dy = 1;
        if (keys['a']) dx = -1;
        if (keys['d']) dx = 1;

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

        // Shooting: Arrow keys
        let fireX = 0, fireY = 0;
        if (keys['arrowup']) fireY = -1;
        if (keys['arrowdown']) fireY = 1;
        if (keys['arrowleft']) fireX = -1;
        if (keys['arrowright']) fireX = 1;

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

        // Use active item
        if (keys['q'] && this.activeItem && this.activeCharges >= this.maxCharges && !this.activeCooldown) {
            this.useActiveItem();
            this.activeCooldown = true;
        }
        if (!keys['q']) this.activeCooldown = false;

        if (this.invulnTimer > 0) this.invulnTimer -= dt;

        // Update temp damage bonus
        if (this.tempDamageTimer > 0) {
            this.tempDamageTimer -= dt;
            if (this.tempDamageTimer <= 0) {
                this.tempDamageBonus = 0;
            }
        }

        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) this.blinkTimer = 3 + Math.random() * 2;

        this.checkDoors();
        this.checkSpikes(dt);
        this.checkTrapdoor();
    }

    useActiveItem() {
        if (!this.activeItem) return;

        screenShake(5, 0.1);
        this.activeCharges = 0;

        switch (this.activeItem) {
            case 'yum_heart':
                if (this.health < this.maxHealth) {
                    this.health = Math.min(this.health + 2, this.maxHealth);
                    addFloatingText(this.x, this.y - 30, '+1 HP', '#FF4444', 1.2);
                }
                break;
            case 'book_of_belial':
                this.tempDamageBonus = 2;
                this.tempDamageTimer = 30; // Whole room
                addFloatingText(this.x, this.y - 30, 'DMG UP!', '#FF0000', 1.5);
                break;
            case 'the_poop':
                obstacles.push({
                    x: this.x,
                    y: this.y + 30,
                    width: 32,
                    height: 32,
                    type: 'poop',
                    health: 3,
                    maxHealth: 3
                });
                break;
            case 'lemon_mishap':
                creepPools.push({
                    x: this.x,
                    y: this.y,
                    radius: 50,
                    damage: 1,
                    timer: 3.0
                });
                break;
            case 'shoop_da_whoop':
                // Fire a beam in the last fire direction
                for (let i = 0; i < 10; i++) {
                    const bx = this.x + lastFireDir.x * 50 * i;
                    const by = this.y + lastFireDir.y * 50 * i;
                    particles.push({
                        x: bx, y: by,
                        vx: 0, vy: 0,
                        life: 0.3, maxLife: 0.3,
                        color: '#FFFF00', size: 20
                    });
                    // Damage enemies in path
                    for (let e of enemies) {
                        const dist = Math.sqrt(Math.pow(e.x - bx, 2) + Math.pow(e.y - by, 2));
                        if (dist < 40) {
                            e.takeDamage(this.damage * 2, lastFireDir.x * 100, lastFireDir.y * 100);
                        }
                    }
                }
                break;
        }
    }

    checkTrapdoor() {
        if (!trapdoor) return;
        const dist = Math.sqrt(Math.pow(this.x - trapdoor.x, 2) + Math.pow(this.y - trapdoor.y, 2));
        if (dist < 30) {
            // Go to next floor
            floorNum++;
            trapdoor = null;
            bossDefeated = false;
            roomStates = {};
            generateFloor();
            generateRoom(floorMap[currentRoom.y][currentRoom.x]);
            this.x = ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2;
            this.y = ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2;
            addFloatingText(this.x, this.y - 30, 'FLOOR ' + floorNum, '#FFFFFF', 2);
            screenShake(10, 0.3);
        }
    }

    shoot(dx, dy) {
        const spread = this.multishot > 1 ? 0.15 : 0;
        const totalDamage = (this.damage + this.tempDamageBonus) * this.damageMult;
        for (let i = 0; i < this.multishot; i++) {
            const angle = Math.atan2(dy, dx) + (i - (this.multishot - 1) / 2) * spread;
            const vx = Math.cos(angle) * this.shotSpeed;
            const vy = Math.sin(angle) * this.shotSpeed;
            const tear = new Tear(this.x, this.y - 10, vx, vy, totalDamage, this.range, this.tearColor);
            tear.homing = this.homing;
            tear.piercing = this.piercing;
            tear.bouncing = this.bouncing;
            tears.push(tear);
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

        // Black hearts take damage first and damage nearby enemies
        if (this.blackHearts > 0) {
            this.blackHearts -= amount;
            // Damage all enemies in room when black heart is lost
            for (let e of enemies) {
                e.takeDamage(40, 0, 0);
            }
            // Black heart explosion effect
            for (let i = 0; i < 20; i++) {
                particles.push({
                    x: this.x, y: this.y,
                    vx: (Math.random() - 0.5) * 400,
                    vy: (Math.random() - 0.5) * 400,
                    life: 0.8, maxLife: 0.8,
                    color: '#222222', size: 8
                });
            }
            screenShake(15, 0.3);
            if (this.blackHearts < 0) {
                amount = -this.blackHearts;
                this.blackHearts = 0;
            } else {
                amount = 0;
            }
        }

        // Soul hearts take damage next
        if (this.soulHearts > 0 && amount > 0) {
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
        screenShake(10, 0.15);
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
            // Check for extra lives
            if (this.lives > 0) {
                this.lives--;
                this.health = 2; // Revive with 1 heart
                addFloatingText(this.x, this.y - 30, 'REVIVED!', '#FFFF00', 1.5);
                screenShake(10, 0.3);
            } else {
                gameState = 'gameover';
            }
        }
    }

    checkDoors() {
        // Don't check doors during room entry pause
        if (roomEntryPause > 0) return;

        doors.forEach(door => {
            if (!door.open) return;
            const dist = Math.sqrt(Math.pow(this.x - door.x, 2) + Math.pow(this.y - door.y, 2));
            if (dist < 60) transitionRoom(door.direction);
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
        // Tear modifiers (set by player)
        this.homing = false;
        this.piercing = false;
        this.bouncing = false;
        this.hitEnemies = new Set(); // Track hit enemies for piercing
        this.bounceCount = 0;
    }

    update(dt) {
        // Full homing (Spoon Bender) - stronger than auto-aim
        if (this.homing && enemies.length > 0) {
            let nearest = null;
            let nearestDist = 200;  // Longer range for full homing
            for (const e of enemies) {
                if (this.hitEnemies.has(e)) continue; // Don't home to already-hit enemies
                const dist = Math.sqrt(Math.pow(this.x - e.x, 2) + Math.pow(this.y - e.y, 2));
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = e;
                }
            }
            if (nearest) {
                const targetAngle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
                const tearAngle = Math.atan2(this.vy, this.vx);
                let angleDiff = targetAngle - tearAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                // Full homing - curves strongly toward any enemy
                const homeStrength = 5.0 * dt;
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                const newAngle = tearAngle + angleDiff * homeStrength;
                this.vx = Math.cos(newAngle) * speed;
                this.vy = Math.sin(newAngle) * speed;
            }
        }
        // Auto-aim assist (gentle homing for non-homing tears)
        else if (enemies.length > 0) {
            let nearest = null;
            let nearestDist = 120;  // Max homing range
            for (const e of enemies) {
                const dist = Math.sqrt(Math.pow(this.x - e.x, 2) + Math.pow(this.y - e.y, 2));
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = e;
                }
            }
            if (nearest) {
                const targetAngle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
                const tearAngle = Math.atan2(this.vy, this.vx);
                let angleDiff = targetAngle - tearAngle;
                // Normalize
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                // Only curve if within 30 degrees
                if (Math.abs(angleDiff) < Math.PI / 6) {
                    const homeStrength = 2.0 * dt;
                    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    const newAngle = tearAngle + angleDiff * homeStrength;
                    this.vx = Math.cos(newAngle) * speed;
                    this.vy = Math.sin(newAngle) * speed;
                }
            }
        }

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

        // Wall collision with bouncing
        const hitWall = this.x < ROOM_OFFSET_X + TILE_SIZE ||
            this.x > ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE ||
            this.y < ROOM_OFFSET_Y + TILE_SIZE ||
            this.y > ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE;

        if (hitWall) {
            if (this.bouncing && this.bounceCount < 3) {
                // Bounce off walls
                if (this.x < ROOM_OFFSET_X + TILE_SIZE || this.x > ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE) {
                    this.vx = -this.vx;
                    this.x = Math.max(ROOM_OFFSET_X + TILE_SIZE + 5, Math.min(ROOM_OFFSET_X + (ROOM_WIDTH - 1) * TILE_SIZE - 5, this.x));
                }
                if (this.y < ROOM_OFFSET_Y + TILE_SIZE || this.y > ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE) {
                    this.vy = -this.vy;
                    this.y = Math.max(ROOM_OFFSET_Y + TILE_SIZE + 5, Math.min(ROOM_OFFSET_Y + (ROOM_HEIGHT - 1) * TILE_SIZE - 5, this.y));
                }
                this.bounceCount++;
            } else {
                this.splash();
                return false;
            }
        }

        // Check for poop collision first (destructible)
        if (checkAndDamagePoop(this.x, this.y, 4, 4, 1)) {
            if (!this.piercing) {
                this.splash();
                return false;
            }
        }

        // Check other obstacles (rocks, etc.)
        if (checkObstacleCollision(this.x, this.y, 4, 4)) {
            if (this.bouncing && this.bounceCount < 3) {
                this.vx = -this.vx;
                this.vy = -this.vy;
                this.bounceCount++;
            } else {
                this.splash();
                return false;
            }
        }

        // Enemy collision
        for (let e of enemies) {
            if (this.hitEnemies.has(e)) continue; // Skip already-hit enemies (piercing)
            const dist = Math.sqrt(Math.pow(this.x - e.x, 2) + Math.pow(this.y - e.y, 2));
            if (dist < e.width / 2 + this.size) {
                // Critical hit chance (10%)
                const isCrit = Math.random() < 0.1;
                const finalDamage = isCrit ? this.damage * 2 : this.damage;

                if (isCrit) {
                    addFloatingText(e.x, e.y - 30, 'CRITICAL!', '#FF4400', 1.5);
                    screenShake(5, 0.08);
                }

                e.takeDamage(finalDamage, this.vx, this.vy);

                if (this.piercing) {
                    this.hitEnemies.add(e);
                    // Continue through
                } else {
                    this.splash();
                    return false;
                }
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
    constructor(x, y, type, championType = 'none') {
        this.x = x;
        this.y = y;
        this.type = type;
        const data = ENEMY_DATA[type] || ENEMY_DATA.fly;

        // Champion modifiers
        this.champion = championType;
        const champMod = CHAMPION_TYPES[championType] || CHAMPION_TYPES.none;

        this.width = data.width || 24;
        this.height = data.height || 24;
        this.speed = (data.speed || 50) * champMod.speedMult;
        this.health = Math.floor((data.health || 10) * champMod.hpMult);
        this.maxHealth = this.health;
        this.damage = (data.damage || 1) * champMod.dmgMult;
        this.isBoss = data.isBoss || false;
        this.championColor = champMod.color;
        this.extraShots = champMod.extraShots || false;
        this.spawnFlyOnDeath = champMod.spawnFlyOnDeath || false;

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
        this.spawnAnim = 0.6; // Increased wake-up delay (was 0.5)
        this.alive = true; // Track alive state to prevent errors
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

        if (this.health <= 0) this.die();
    }

    die() {
        if (!this.alive) return; // Prevent double death
        this.alive = false;
        totalKills++;

        // Screen shake on kill
        screenShake(this.isBoss ? 15 : 5, this.isBoss ? 0.3 : 0.1);

        // Blood splatter
        const bloodColor = this.championColor || COLORS.blood;
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: this.x, y: this.y,
                vx: (Math.random() - 0.5) * 250,
                vy: (Math.random() - 0.5) * 250,
                life: 0.6, maxLife: 0.6,
                color: bloodColor, size: 6
            });
        }

        // Blood stain
        bloodStains.push({ x: this.x, y: this.y, size: 15 + Math.random() * 15, color: bloodColor });

        // Champion effect: spawn fly on death
        if (this.spawnFlyOnDeath && !this.isBoss) {
            enemies.push(new Enemy(this.x + 20, this.y, 'fly'));
        }

        // Boss death: spawn trapdoor and give charges
        if (this.isBoss) {
            bossDefeated = true;
            trapdoor = {
                x: this.x,
                y: this.y,
                pulsePhase: 0
            };
            // Give player charges on boss kill
            if (player && player.activeItem) {
                player.activeCharges = Math.min(player.activeCharges + 2, player.maxCharges);
            }
            addFloatingText(this.x, this.y - 50, 'BOSS DEFEATED!', '#FFFF00', 2);
        }

        // Drop chance - don't drop items in normal rooms, only pickups
        // Champions have better drop rates
        const dropChance = this.isBoss ? 1.0 : (this.champion !== 'none' ? 0.5 : 0.25);
        if (Math.random() < dropChance) {
            const types = this.isBoss ? ['heart', 'heart', 'soulHeart'] : ['heart', 'coin', 'coin', 'bomb', 'key'];
            // Champions can drop soul hearts
            if (this.champion !== 'none' && Math.random() < 0.2) {
                pickups.push({ x: this.x, y: this.y, type: 'soulHeart', bobPhase: 0 });
            } else {
                const type = types[Math.floor(Math.random() * types.length)];
                pickups.push({ x: this.x, y: this.y, type: type, bobPhase: 0 });
            }
        }
    }

    draw() {
        // Draw spawn shadow effect first
        if (this.spawnAnim > 0) {
            const progress = 1 - this.spawnAnim / 0.6;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.ellipse(0, 8, this.width / 2 * progress, 4 * progress, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            ctx.globalAlpha = progress;
        }

        ctx.save();
        ctx.translate(this.x, this.y - (this.jumpHeight || 0));

        // Scale effect during spawn - enemy grows from small
        if (this.spawnAnim > 0) {
            const progress = 1 - this.spawnAnim / 0.6;
            ctx.scale(0.5 + progress * 0.5, 0.5 + progress * 0.5);
        }

        // Champion glow effect
        if (this.championColor && !this.hitFlash) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.championColor;
        }

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

// Check for poop collision and damage it - returns the poop if hit, null otherwise
function checkAndDamagePoop(x, y, w, h, damage) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (obs.type !== 'poop') continue;
        if (x - w / 2 < obs.x + obs.width / 2 &&
            x + w / 2 > obs.x - obs.width / 2 &&
            y - h / 2 < obs.y + obs.height / 2 &&
            y + h / 2 > obs.y - obs.height / 2) {
            // Damage the poop
            obs.health -= damage;
            // Spawn brown particles
            for (let j = 0; j < 4; j++) {
                particles.push({
                    x: obs.x, y: obs.y,
                    vx: (Math.random() - 0.5) * 80,
                    vy: (Math.random() - 0.5) * 80,
                    life: 0.3, maxLife: 0.3,
                    color: COLORS.poop, size: 5
                });
            }
            // Destroy poop if health depleted
            if (obs.health <= 0) {
                // Spawn more particles on destruction
                for (let j = 0; j < 10; j++) {
                    particles.push({
                        x: obs.x, y: obs.y,
                        vx: (Math.random() - 0.5) * 150,
                        vy: (Math.random() - 0.5) * 150,
                        life: 0.5, maxLife: 0.5,
                        color: COLORS.poopDark, size: 6
                    });
                }
                // Maybe drop a pickup
                if (Math.random() < 0.3) {
                    const dropTypes = ['coin', 'coin', 'heart', 'bomb'];
                    pickups.push({
                        x: obs.x,
                        y: obs.y,
                        type: dropTypes[Math.floor(Math.random() * dropTypes.length)]
                    });
                }
                obstacles.splice(i, 1);
            }
            return obs;
        }
    }
    return null;
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
    roomStates = {}; // Clear saved room states for new floor
}

function generateRoom(roomData) {
    enemies = [];
    obstacles = [];
    pickups = [];
    doors = [];
    items = [];
    bloodStains = [];

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

    // Check if we have saved state for this room
    const roomKey = `${currentRoom.x},${currentRoom.y}`;
    if (roomStates[roomKey]) {
        // Restore saved state
        obstacles = roomStates[roomKey].obstacles.map(o => ({ ...o }));
        pickups = roomStates[roomKey].pickups.map(p => ({ ...p }));
        items = roomStates[roomKey].items.map(i => ({ ...i }));
        bloodStains = roomStates[roomKey].bloodStains.map(b => ({ ...b }));
        return; // Don't regenerate, use saved state
    }

    if (roomData.cleared || roomData.type === 'start') return;

    // Spawn obstacles
    const obstacleCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < obstacleCount; i++) {
        const ox = ROOM_OFFSET_X + (2 + Math.random() * (ROOM_WIDTH - 4)) * TILE_SIZE;
        const oy = ROOM_OFFSET_Y + (2 + Math.random() * (ROOM_HEIGHT - 4)) * TILE_SIZE;
        const types = ['rock', 'rock', 'poop', 'spike'];
        const obsType = types[Math.floor(Math.random() * types.length)];
        const obs = {
            x: ox, y: oy,
            width: TILE_SIZE - 8, height: TILE_SIZE - 8,
            type: obsType
        };
        // Poops are destructible with 3 HP
        if (obsType === 'poop') {
            obs.health = 3;
            obs.maxHealth = 3;
        }
        obstacles.push(obs);
    }

    // Spawn enemies
    if (roomData.type === 'normal') {
        const enemyCount = 2 + Math.floor(Math.random() * 3) + floorNum;
        const types = ['fly', 'redFly', 'gaper', 'frowningGaper', 'spider', 'bigSpider', 'hopper', 'charger', 'leaper', 'bony'];
        const championTypes = ['none', 'red', 'yellow', 'blue', 'green', 'black'];
        // Champion chance increases with floor number
        const championChance = Math.min(0.1 + floorNum * 0.05, 0.5);
        for (let i = 0; i < enemyCount; i++) {
            const ex = ROOM_OFFSET_X + (2 + Math.random() * (ROOM_WIDTH - 4)) * TILE_SIZE;
            const ey = ROOM_OFFSET_Y + (2 + Math.random() * (ROOM_HEIGHT - 4)) * TILE_SIZE;
            const enemyType = types[Math.floor(Math.random() * types.length)];
            // Determine if this enemy is a champion
            let champion = 'none';
            if (Math.random() < championChance) {
                champion = championTypes[1 + Math.floor(Math.random() * (championTypes.length - 1))];
            }
            enemies.push(new Enemy(ex, ey, enemyType, champion));
        }
    } else if (roomData.type === 'boss') {
        const bx = ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2;
        const by = ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2;
        enemies.push(new Enemy(bx, by, 'boss_monstro', 'none'));
    } else if (roomData.type === 'treasure') {
        // 20% chance for active item, 80% for passive
        const isActiveItem = Math.random() < 0.2;
        if (isActiveItem) {
            const activeKeys = Object.keys(ACTIVE_ITEMS);
            const randomActive = activeKeys[Math.floor(Math.random() * activeKeys.length)];
            items.push({
                x: ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2,
                y: ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2 - 20,
                id: randomActive,
                stat: 'active',
                ...ACTIVE_ITEMS[randomActive]
            });
        } else {
            const itemKeys = Object.keys(ITEMS);
            const randomItem = itemKeys[Math.floor(Math.random() * itemKeys.length)];
            items.push({
                x: ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE / 2,
                y: ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE / 2 - 20,
                id: randomItem,
                ...ITEMS[randomItem]
            });
        }
        roomData.cleared = true;
        doors.forEach(d => d.open = true);
    } else if (roomData.type === 'shop') {
        pickups.push({ x: ROOM_OFFSET_X + 5 * TILE_SIZE, y: ROOM_OFFSET_Y + 3 * TILE_SIZE, type: 'heart', price: 3 });
        pickups.push({ x: ROOM_OFFSET_X + 7 * TILE_SIZE, y: ROOM_OFFSET_Y + 3 * TILE_SIZE, type: 'bomb', price: 5 });
        pickups.push({ x: ROOM_OFFSET_X + 9 * TILE_SIZE, y: ROOM_OFFSET_Y + 3 * TILE_SIZE, type: 'key', price: 5 });
    }
}

function transitionRoom(dir) {
    const newX = currentRoom.x + dir.x;
    const newY = currentRoom.y + dir.y;

    // Safety checks - validate new room exists
    if (newY < 0 || newY >= 9 || newX < 0 || newX >= 9) {
        console.warn('Attempted transition to out-of-bounds room:', newX, newY);
        return;
    }
    if (!floorMap[newY] || !floorMap[newY][newX]) {
        console.warn('Attempted transition to non-existent room:', newX, newY);
        return;
    }

    // Save current room state before leaving
    const oldRoomKey = `${currentRoom.x},${currentRoom.y}`;
    roomStates[oldRoomKey] = {
        obstacles: obstacles.map(o => ({ ...o })), // Deep copy obstacles
        pickups: pickups.map(p => ({ ...p })),     // Deep copy pickups
        items: items.map(i => ({ ...i })),         // Deep copy items
        bloodStains: bloodStains.map(b => ({ ...b })) // Deep copy blood stains
    };

    currentRoom.x = newX;
    currentRoom.y = newY;
    visitedRooms.add(`${currentRoom.x},${currentRoom.y}`);

    generateRoom(floorMap[currentRoom.y][currentRoom.x]);

    // Spawn player far enough from door to not immediately trigger it again
    // Door transition distance is 60px, spawn at 2.0 tiles from edge (~80px from door)
    if (dir.x > 0) player.x = ROOM_OFFSET_X + 2.0 * TILE_SIZE + player.width / 2;
    if (dir.x < 0) player.x = ROOM_OFFSET_X + (ROOM_WIDTH - 2.0) * TILE_SIZE - player.width / 2;
    if (dir.y > 0) player.y = ROOM_OFFSET_Y + 2.0 * TILE_SIZE + player.height / 2;
    if (dir.y < 0) player.y = ROOM_OFFSET_Y + (ROOM_HEIGHT - 2.0) * TILE_SIZE - player.height / 2;

    // Brief movement pause on room entry (0.25 seconds)
    roomEntryPause = 0.25;
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
            // Visual damage states based on health
            const healthRatio = (obs.health || 3) / (obs.maxHealth || 3);
            const scale = 0.5 + healthRatio * 0.5;  // Shrinks as damaged
            ctx.scale(scale, scale);

            // Darker color when damaged
            const damageLevel = 1 - healthRatio;
            const r = parseInt(COLORS.poop.slice(1,3), 16);
            const g = parseInt(COLORS.poop.slice(3,5), 16);
            const b = parseInt(COLORS.poop.slice(5,7), 16);
            const dr = Math.floor(r * (1 - damageLevel * 0.4));
            const dg = Math.floor(g * (1 - damageLevel * 0.4));
            const db = Math.floor(b * (1 - damageLevel * 0.4));
            ctx.fillStyle = `rgb(${dr},${dg},${db})`;

            // Full poop at health 3, missing top at 2, crumbling at 1
            ctx.beginPath();
            ctx.arc(0, 5, 14, 0, Math.PI * 2);
            ctx.fill();

            if (healthRatio > 0.33) {
                ctx.beginPath();
                ctx.arc(-5, -4, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(5, -2, 8, 0, Math.PI * 2);
                ctx.fill();
            }

            if (healthRatio > 0.66) {
                ctx.beginPath();
                ctx.arc(0, -12, 5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Dark highlight
            const ddr = Math.floor(parseInt(COLORS.poopDark.slice(1,3), 16) * (1 - damageLevel * 0.4));
            const ddg = Math.floor(parseInt(COLORS.poopDark.slice(3,5), 16) * (1 - damageLevel * 0.4));
            const ddb = Math.floor(parseInt(COLORS.poopDark.slice(5,7), 16) * (1 - damageLevel * 0.4));
            ctx.fillStyle = `rgb(${ddr},${ddg},${ddb})`;
            ctx.beginPath();
            ctx.arc(-2, 7, 5, 0, Math.PI * 2);
            ctx.fill();

            // Cracks for damaged state
            if (healthRatio <= 0.66) {
                ctx.strokeStyle = '#2A1A0A';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-8, 2);
                ctx.lineTo(-2, 8);
                ctx.stroke();
            }
            if (healthRatio <= 0.33) {
                ctx.beginPath();
                ctx.moveTo(5, 0);
                ctx.lineTo(10, 8);
                ctx.stroke();
            }
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

    // Draw trapdoor
    if (trapdoor) {
        ctx.save();
        ctx.translate(trapdoor.x, trapdoor.y);

        // Pulse animation
        trapdoor.pulsePhase = (trapdoor.pulsePhase || 0) + 0.05;
        const pulse = Math.sin(trapdoor.pulsePhase) * 0.3 + 0.7;

        // Glow effect
        ctx.shadowBlur = 30 * pulse;
        ctx.shadowColor = '#000000';

        // Dark hole
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(0, 0, 30, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stone border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Stairs hint
        ctx.fillStyle = '#333';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-15 + i * 5, -5 + i * 5, 30 - i * 10, 3);
        }

        // "Next Floor" text when close
        const playerDist = player ? Math.sqrt(Math.pow(player.x - trapdoor.x, 2) + Math.pow(player.y - trapdoor.y, 2)) : 999;
        if (playerDist < 60) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('NEXT FLOOR', 0, -35);
            ctx.textAlign = 'left';
        }

        ctx.restore();
    }

    // Draw creep pools
    for (const creep of creepPools) {
        ctx.save();
        ctx.translate(creep.x, creep.y);
        ctx.globalAlpha = 0.6 * (creep.timer / 3.0);
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.ellipse(0, 0, creep.radius, creep.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
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
    let extraHeartOffset = Math.ceil(player.maxHealth / 2);
    for (let i = 0; i < Math.ceil(player.soulHearts / 2); i++) {
        const hx = 25 + (extraHeartOffset + i) * (heartSize + 5);
        drawHeart(hx, 20, heartSize, COLORS.heartSoul);
    }
    extraHeartOffset += Math.ceil(player.soulHearts / 2);

    // Black hearts
    for (let i = 0; i < Math.ceil(player.blackHearts / 2); i++) {
        const hx = 25 + (extraHeartOffset + i) * (heartSize + 5);
        drawHeart(hx, 20, heartSize, '#222222');
    }

    // Active item display
    if (player.activeItem) {
        const activeItemData = ACTIVE_ITEMS[player.activeItem];
        if (activeItemData) {
            // Draw active item box
            ctx.fillStyle = '#333';
            ctx.fillRect(canvas.width - 120, 10, 100, 50);
            ctx.strokeStyle = player.activeCharges >= player.maxCharges ? '#FFFF00' : '#666';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width - 120, 10, 100, 50);

            // Item name
            ctx.fillStyle = '#FFF';
            ctx.font = '10px monospace';
            ctx.fillText(activeItemData.name, canvas.width - 115, 25);

            // Charge bar
            const chargeWidth = 80 * (player.activeCharges / player.maxCharges);
            ctx.fillStyle = '#444';
            ctx.fillRect(canvas.width - 115, 32, 80, 10);
            ctx.fillStyle = player.activeCharges >= player.maxCharges ? '#FFFF00' : '#888';
            ctx.fillRect(canvas.width - 115, 32, chargeWidth, 10);

            // Q to use
            ctx.fillStyle = '#AAA';
            ctx.fillText('[Q] to use', canvas.width - 115, 55);
        }
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

    // Player stats (shown on left side of HUD)
    ctx.font = '11px monospace';
    ctx.fillStyle = '#AAAAAA';
    const statsX = 250;
    ctx.fillText(`DMG: ${player.damage.toFixed(1)}`, statsX, 25);
    ctx.fillText(`SPD: ${(player.speed / 160).toFixed(1)}`, statsX, 40);
    ctx.fillText(`TEARS: ${(1 / player.tearDelay).toFixed(1)}/s`, statsX + 80, 25);
    ctx.fillText(`RANGE: ${(player.range / 220).toFixed(1)}`, statsX + 80, 40);

    // Show collected items count
    if (player.collectedItems && player.collectedItems.length > 0) {
        ctx.fillStyle = '#FFCC44';
        ctx.fillText(`Items: ${player.collectedItems.length}`, statsX, 55);
    }

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

    // Helper to check if room is adjacent to any visited room
    function isAdjacentToVisited(x, y) {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            if (visitedRooms.has(`${x + dx},${y + dy}`)) return true;
        }
        return false;
    }

    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            const room = floorMap[y]?.[x];
            if (!room) continue;

            const px = mapX + x * cellSize;
            const py = mapY + y * cellSize;
            const isVisited = visitedRooms.has(`${x},${y}`);
            const isCurrent = x === currentRoom.x && y === currentRoom.y;
            const isAdjacent = isAdjacentToVisited(x, y);

            // Only show visited rooms and rooms adjacent to visited ones (fog of war)
            if (!isVisited && !isAdjacent) continue;

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
                // Adjacent but not visited - show as dim outline
                ctx.fillStyle = '#222222';
                ctx.fillRect(px, py, cellSize - 1, cellSize - 1);
                // Show special room type icons for adjacent rooms
                if (room.type === 'boss') {
                    ctx.fillStyle = '#662222';
                } else if (room.type === 'treasure') {
                    ctx.fillStyle = '#666622';
                } else if (room.type === 'shop') {
                    ctx.fillStyle = '#226622';
                } else {
                    ctx.fillStyle = '#333333';
                }
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
    ctx.fillText('WASD - Move', canvas.width / 2, 340);
    ctx.fillText('Arrow Keys - Shoot', canvas.width / 2, 370);
    ctx.fillText('E - Place Bomb', canvas.width / 2, 400);
    ctx.fillText('Q - Use Active Item', canvas.width / 2, 430);
    ctx.fillText('ESC - Pause', canvas.width / 2, 460);

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
            // Handle different stat types
            switch (item.stat) {
                case 'multishot':
                    player.multishot = item.value;
                    break;
                case 'homing':
                    player.homing = item.value;
                    player.tearColor = '#FF88FF'; // Pink homing tears
                    break;
                case 'piercing':
                    player.piercing = item.value;
                    player.tearColor = '#FFFFFF'; // White piercing tears
                    break;
                case 'bouncing':
                    player.bouncing = item.value;
                    player.tearColor = '#88FF88'; // Green bouncing tears
                    break;
                case 'blackHearts':
                    player.blackHearts += item.value;
                    break;
                case 'lives':
                    player.lives = item.value;
                    break;
                case 'damageMult':
                    player.damageMult *= item.value;
                    break;
                case 'active':
                    // Active item pickup
                    player.activeItem = item.id;
                    player.maxCharges = ACTIVE_ITEMS[item.id].charges;
                    player.activeCharges = 0;
                    break;
                default:
                    player[item.stat] = (player[item.stat] || 0) + item.value;
            }

            player.collectedItems.push(item.id);
            items.splice(i, 1);

            // Screen shake and visual feedback
            screenShake(5, 0.1);

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

// Isaac-style vignette/spotlight effect
function drawVignette() {
    // Get room center for the spotlight
    const roomCenterX = ROOM_OFFSET_X + (ROOM_WIDTH * TILE_SIZE) / 2;
    const roomCenterY = ROOM_OFFSET_Y + (ROOM_HEIGHT * TILE_SIZE) / 2;

    // Create radial gradient for spotlight effect
    const gradient = ctx.createRadialGradient(
        roomCenterX, roomCenterY, 100,
        roomCenterX, roomCenterY, 400
    );

    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.25)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');

    ctx.fillStyle = gradient;
    ctx.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);

    // Additional corner darkening for Isaac-style atmosphere
    const corners = [
        [ROOM_OFFSET_X, ROOM_OFFSET_Y],
        [ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE, ROOM_OFFSET_Y],
        [ROOM_OFFSET_X, ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE],
        [ROOM_OFFSET_X + ROOM_WIDTH * TILE_SIZE, ROOM_OFFSET_Y + ROOM_HEIGHT * TILE_SIZE]
    ];

    corners.forEach(([cx, cy]) => {
        const cornerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
        cornerGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        cornerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cornerGrad;
        ctx.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH * TILE_SIZE, ROOM_HEIGHT * TILE_SIZE);
    });
}

function drawDebugOverlay() {
    if (!debugMode || !player) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 100, 240, 200);

    ctx.fillStyle = '#0f0';
    ctx.font = '12px monospace';
    let y = 118;
    const line = (text) => { ctx.fillText(text, 20, y); y += 16; };

    line('=== DEBUG (` to close) ===');
    line(`Room: (${currentRoom.x}, ${currentRoom.y})`);
    line(`Player: (${Math.round(player.x)}, ${Math.round(player.y)})`);
    line(`HP: ${player.health}/${player.maxHealth}`);
    line(`Damage: ${player.damage.toFixed(1)}`);
    line(`Tear Delay: ${player.tearDelay.toFixed(2)}`);
    line(`Enemies: ${enemies.length}`);
    line(`Tears: ${tears.length}`);
    line(`Floor: ${floorNum}`);
    line(`Total Kills: ${totalKills}`);
    line(`FPS: ${Math.round(fps)}`);

    ctx.restore();
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    // FPS tracking
    frameCount++;
    fpsTimer += dt;
    if (fpsTimer >= 1) {
        fps = frameCount / fpsTimer;
        frameCount = 0;
        fpsTimer = 0;
    }

    // Screen shake
    let shakeX = 0, shakeY = 0;
    if (screenShakeDuration > 0) {
        shakeX = (Math.random() - 0.5) * screenShakeAmount;
        shakeY = (Math.random() - 0.5) * screenShakeAmount;
        screenShakeDuration -= dt;
        if (screenShakeDuration <= 0) {
            screenShakeAmount = 0;
            screenShakeDuration = 0;
        }
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    ctx.fillStyle = '#000';
    ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20);

    if (gameState === 'title') {
        drawTitle();
    } else if (gameState === 'playing') {
        // Pause handling
        if (isPaused) {
            // Draw game state but don't update
            drawRoom();
            enemies.forEach(e => e.draw());
            tears.forEach(t => t.draw());
            player.draw();
            drawParticles();
            drawVignette();
            drawHUD();

            // Pause overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
            ctx.font = '20px monospace';
            ctx.fillText('Press ESC to resume', canvas.width / 2, canvas.height / 2 + 40);
            ctx.textAlign = 'left';
        } else {
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

            // Update creep pools
            for (let i = creepPools.length - 1; i >= 0; i--) {
                const creep = creepPools[i];
                creep.timer -= dt;
                // Damage enemies in creep
                for (let e of enemies) {
                    const dist = Math.sqrt(Math.pow(e.x - creep.x, 2) + Math.pow(e.y - creep.y, 2));
                    if (dist < creep.radius) {
                        e.takeDamage(creep.damage * dt * 3, 0, 0);
                    }
                }
                if (creep.timer <= 0) {
                    creepPools.splice(i, 1);
                }
            }

            // Update floating texts
            for (let i = floatingTexts.length - 1; i >= 0; i--) {
                const ft = floatingTexts[i];
                ft.y += ft.vy * dt;
                ft.life -= dt;
                if (ft.life <= 0) floatingTexts.splice(i, 1);
            }

            if (flashAlpha > 0) flashAlpha -= dt * 3;

            drawRoom();
            enemies.forEach(e => e.draw());
            tears.forEach(t => t.draw());
            player.draw();
            drawParticles();

            // Draw floating texts
            floatingTexts.forEach(ft => {
                const alpha = ft.life / ft.maxLife;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.font = `bold ${Math.floor(14 * ft.scale)}px Arial`;
                ctx.fillStyle = '#000';
                ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
                ctx.fillStyle = ft.color;
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            });

            // Isaac-style vignette spotlight effect
            drawVignette();

            drawHUD();

            if (flashAlpha > 0) {
                ctx.fillStyle = `rgba(255, 0, 0, ${flashAlpha})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            drawDebugOverlay();
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
    if (e.key === '`') debugMode = !debugMode;
    // Pause toggle
    if (e.key === 'Escape' && gameState === 'playing') {
        isPaused = !isPaused;
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
    visited: visitedRooms.size,
    kills: totalKills
});
window.startGame = initGame;

requestAnimationFrame(gameLoop);
