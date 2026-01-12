/**
 * Basement Tears - Binding of Isaac Clone
 * Night 6 Implementation with Test Harness
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 720;
const TILE_SIZE = 48;
const ROOM_TILES_X = 13;
const ROOM_TILES_Y = 7;
const ROOM_WIDTH = ROOM_TILES_X * TILE_SIZE;  // 624
const ROOM_HEIGHT = ROOM_TILES_Y * TILE_SIZE; // 336
const ROOM_OFFSET_X = (CANVAS_WIDTH - ROOM_WIDTH) / 2;   // 168
const ROOM_OFFSET_Y = (CANVAS_HEIGHT - ROOM_HEIGHT) / 2; // 192

const DOOR_SPAWN_OFFSET = 24;
const PLAYER_SIZE = 32;
const TEAR_SIZE = 12;
const ENEMY_WAKE_DELAY = 500;
const SPAWN_ANIMATION_DURATION = 500;

// Colors
const COLORS = {
    background: '#1a1a1a',
    floor: '#3d2b1f',
    floorAlt: '#4a3728',
    wall: '#2a2a2a',
    wallBorder: '#1a1a1a',
    player: '#f5deb3',
    playerOutline: '#000',
    tear: '#87ceeb',
    tearOutline: '#5f9ea0',
    rock: '#666',
    rockDark: '#444',
    poop: '#8b4513',
    poopDark: '#654321',
    door: '#8b7355',
    doorOpen: '#5c4a3d',
    heart: '#ff3333',
    heartEmpty: '#333',
    soulHeart: '#4169e1',
    blackHeart: '#1a1a1a',
    coin: '#ffd700',
    bomb: '#333',
    key: '#ffd700'
};

// Enemy definitions
const ENEMY_DATA = {
    fly: { health: 4, speed: 2, damage: 1, width: 24, height: 24, flying: true, behavior: 'wander' },
    redFly: { health: 6, speed: 2.5, damage: 1, width: 24, height: 24, flying: true, behavior: 'chase' },
    gaper: { health: 12, speed: 1.5, damage: 1, width: 32, height: 32, flying: false, behavior: 'chase' },
    frowningGaper: { health: 15, speed: 1.8, damage: 1, width: 32, height: 32, flying: false, behavior: 'chase' },
    spider: { health: 6, speed: 3, damage: 1, width: 20, height: 20, flying: false, behavior: 'erratic' },
    bigSpider: { health: 10, speed: 2.5, damage: 1, width: 28, height: 28, flying: false, behavior: 'erratic' },
    hopper: { health: 10, speed: 2, damage: 1, width: 28, height: 28, flying: false, behavior: 'hop' },
    charger: { health: 15, speed: 1, damage: 1, width: 36, height: 24, flying: false, behavior: 'charge' },
    clotty: { health: 10, speed: 1, damage: 1, width: 28, height: 28, flying: false, behavior: 'shoot4' },
    pooter: { health: 8, speed: 1, damage: 1, width: 28, height: 28, flying: true, behavior: 'shootChase' },
    host: { health: 10, speed: 0, damage: 1, width: 32, height: 32, flying: false, behavior: 'host' },
    boss_monstro: { health: 250, speed: 2, damage: 1, width: 80, height: 80, flying: false, behavior: 'boss_monstro', isBoss: true }
};

// Item definitions
const ITEM_DATA = {
    sadOnion: { name: 'Sad Onion', desc: 'Tears up', effect: { tears: 0.7 }, pool: 'treasure' },
    innerEye: { name: 'The Inner Eye', desc: 'Triple shot', effect: { multishot: 3, tears: -3 }, pool: 'treasure' },
    spoonBender: { name: 'Spoon Bender', desc: 'Homing tears', effect: { homing: true }, pool: 'treasure' },
    magicMushroom: { name: 'Magic Mushroom', desc: 'All stats up!', effect: { damage: 1, health: 2, speed: 0.3, range: 1.5 }, pool: 'treasure' },
    cricketHead: { name: "Cricket's Head", desc: 'DMG up', effect: { damage: 1, damageMult: 0.5 }, pool: 'treasure' },
    steroidS: { name: 'Steroids', desc: 'Speed + Range up', effect: { speed: 0.3, range: 2 }, pool: 'treasure' },
    lunchBox: { name: 'Lunch', desc: 'HP up', effect: { health: 2 }, pool: 'boss' },
    dinner: { name: 'Dinner', desc: 'HP up', effect: { health: 2 }, pool: 'boss' },
    dessert: { name: 'Dessert', desc: 'HP up', effect: { health: 2 }, pool: 'boss' },
    breakfast: { name: 'Breakfast', desc: 'HP up', effect: { health: 2 }, pool: 'boss' },
    pentagram: { name: 'Pentagram', desc: 'DMG up', effect: { damage: 1 }, pool: 'devil' },
    theMarkItem: { name: 'The Mark', desc: 'DMG + Speed up', effect: { damage: 1, speed: 0.2 }, pool: 'devil' },
    cupidsArrow: { name: "Cupid's Arrow", desc: 'Piercing tears', effect: { piercing: true }, pool: 'treasure' },
    myReflection: { name: 'My Reflection', desc: 'Boomerang tears', effect: { boomerang: true }, pool: 'treasure' },
    numberOfOne: { name: 'Number One', desc: 'Tears way up', effect: { tears: 1.5, range: -1 }, pool: 'treasure' },
    bloodOfMartyr: { name: 'Blood of the Martyr', desc: 'DMG up', effect: { damage: 1 }, pool: 'angel' },
    sacredHeart: { name: 'Sacred Heart', desc: 'Homing + DMG up', effect: { damage: 2, damageMult: 1.0, homing: true }, pool: 'angel' },
    theHalo: { name: 'The Halo', desc: 'All stats up', effect: { damage: 0.3, health: 2, speed: 0.2, tears: 0.2, range: 0.5 }, pool: 'angel' },
    wire: { name: 'Wire Coat Hanger', desc: 'Tears up', effect: { tears: 0.7 }, pool: 'treasure' },
    toothPicks: { name: 'Toothpicks', desc: 'Tears + Shot speed up', effect: { tears: 0.7, shotSpeed: 0.16 }, pool: 'treasure' },
    stigmata: { name: 'Stigmata', desc: 'DMG + HP up', effect: { damage: 0.3, health: 2 }, pool: 'treasure' },
    polyphemus: { name: 'Polyphemus', desc: 'Mega tears', effect: { damage: 4, tears: -2, tearSize: 2 }, pool: 'treasure' },
    rubberCement: { name: 'Rubber Cement', desc: 'Bouncing tears', effect: { bouncing: true }, pool: 'treasure' },
    deadCat: { name: 'Dead Cat', desc: '9 lives', effect: { lives: 9, maxHealth: -4 }, pool: 'devil' },
    cricketBody: { name: "Cricket's Body", desc: 'Splash tears', effect: { splash: true, tears: 0.5 }, pool: 'treasure' },
    lumpOfCoal: { name: 'Lump of Coal', desc: 'Damage up over distance', effect: { coalDamage: true }, pool: 'treasure' },
    holyMantle: { name: 'Holy Mantle', desc: 'Shield per room', effect: { shield: true }, pool: 'angel' },
    godhead: { name: 'Godhead', desc: 'Homing + Aura', effect: { homing: true, aura: true, damage: 0.5 }, pool: 'angel' },
    ipecac: { name: 'Ipecac', desc: 'Explosive tears', effect: { explosive: true, damage: 40, tears: -2 }, pool: 'treasure' }
};

// ═══════════════════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════════════════

let canvas, ctx;
let gameState = 'title'; // 'title', 'playing', 'paused', 'gameover', 'win'
let keys = {};
let player = null;
let tears = [];
let enemies = [];
let pickups = [];
let obstacles = [];
let doors = [];
let items = [];
let bombs = [];
let explosions = [];
let trapdoor = null;

// Floor state
let floorNum = 1;
let floorMap = [];
let currentRoom = { x: 4, y: 3 };
let visitedRooms = new Set();
let roomStates = {};
let bossDefeated = false;
let totalKills = 0;

// Timing
let lastTime = 0;
let deltaTime = 0;
let roomTransitionTimer = 0;
let roomEntryPauseTimer = 0;

// Screen shake
let screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };

// Particles
let particles = [];

function triggerScreenShake(intensity, duration) {
    screenShake.intensity = intensity;
    screenShake.duration = duration;
}

function updateScreenShake(dt) {
    if (screenShake.duration > 0) {
        screenShake.duration -= dt;
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
        screenShake.intensity = 0;
    }
}

function spawnTearSplash(x, y, color = COLORS.tear) {
    const numParticles = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numParticles; i++) {
        const angle = (Math.PI * 2 / numParticles) * i + Math.random() * 0.5;
        const speed = 50 + Math.random() * 100;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3 + Math.random() * 3,
            color: color,
            life: 0.3 + Math.random() * 0.2,
            maxLife: 0.5
        });
    }
}

function spawnBloodSplash(x, y) {
    const numParticles = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 30 + Math.random() * 80;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 4,
            color: '#8b0000',
            life: 0.4 + Math.random() * 0.3,
            maxLife: 0.7
        });
    }
}

function spawnDustParticle(x, y) {
    if (Math.random() > 0.15) return; // Only spawn occasionally
    particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + 10,
        vx: (Math.random() - 0.5) * 20,
        vy: -10 - Math.random() * 20,
        size: 2 + Math.random() * 2,
        color: '#8b7355',
        life: 0.2 + Math.random() * 0.2,
        maxLife: 0.4
    });
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt; // Gravity
        p.life -= dt;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles(ctx) {
    for (const p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYER CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = PLAYER_SIZE;
        this.height = PLAYER_SIZE;
        this.speed = 3;
        this.health = 6;
        this.maxHealth = 6;
        this.soulHearts = 0;
        this.blackHearts = 0;
        this.damage = 3.5;
        this.damageMult = 1;
        this.tempDamageBonus = 0;
        this.tearDelay = 10;
        this.tearTimer = 0;
        this.range = 23.75;
        this.shotSpeed = 1;
        this.coins = 0;
        this.bombs = 1;
        this.keys = 1;
        this.invulnTimer = 0;
        this.homing = false;
        this.piercing = false;
        this.bouncing = false;
        this.boomerang = false;
        this.multishot = 1;
        this.tearSize = 1;
        this.explosiveTears = false;
        this.splashTears = false;
        this.coalDamage = false;
        this.hasShield = false;
        this.shieldActive = false;
        this.activeItem = null;
        this.activeCharges = 0;
        this.maxCharges = 0;
        this.collectedItems = [];
        this.lives = 0;
        this.canMove = true;
        this.facingDir = 'down';
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update(dt) {
        if (!this.canMove) return;

        // Movement
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup'] && !keys['arrowdown'] && !keys['arrowleft'] && !keys['arrowright']) {
            if (keys['w']) dy = -1;
        }
        if (keys['s']) dy = 1;
        if (keys['a']) dx = -1;
        if (keys['d']) dx = 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        const moveSpeed = this.speed * 60 * dt;
        const newX = this.x + dx * moveSpeed;
        const newY = this.y + dy * moveSpeed;

        // Collision check
        if (this.canMoveTo(newX, this.y)) this.x = newX;
        if (this.canMoveTo(this.x, newY)) this.y = newY;

        // Update facing direction
        if (dx > 0) this.facingDir = 'right';
        else if (dx < 0) this.facingDir = 'left';
        else if (dy > 0) this.facingDir = 'down';
        else if (dy < 0) this.facingDir = 'up';

        // Animation
        if (dx !== 0 || dy !== 0) {
            this.animTimer += dt;
            if (this.animTimer > 0.1) {
                this.animFrame = (this.animFrame + 1) % 4;
                this.animTimer = 0;
            }
            // Dust particles
            spawnDustParticle(this.x, this.y);
        }

        // Shooting (Arrow keys)
        this.tearTimer -= dt;
        let shootDir = null;
        if (keys['arrowup']) shootDir = { x: 0, y: -1 };
        else if (keys['arrowdown']) shootDir = { x: 0, y: 1 };
        else if (keys['arrowleft']) shootDir = { x: -1, y: 0 };
        else if (keys['arrowright']) shootDir = { x: 1, y: 0 };

        if (shootDir && this.tearTimer <= 0) {
            this.shoot(shootDir);
            this.tearTimer = (this.tearDelay + 1) / 30;
        }

        // Invulnerability timer
        if (this.invulnTimer > 0) {
            this.invulnTimer -= dt;
        }

        // Clamp to room bounds
        const minX = ROOM_OFFSET_X + TILE_SIZE + this.width / 2;
        const maxX = ROOM_OFFSET_X + ROOM_WIDTH - TILE_SIZE - this.width / 2;
        const minY = ROOM_OFFSET_Y + TILE_SIZE + this.height / 2;
        const maxY = ROOM_OFFSET_Y + ROOM_HEIGHT - TILE_SIZE - this.height / 2;
        this.x = Math.max(minX, Math.min(maxX, this.x));
        this.y = Math.max(minY, Math.min(maxY, this.y));
    }

    canMoveTo(x, y) {
        const halfW = this.width / 2 - 4;
        const halfH = this.height / 2 - 4;

        // Check obstacles
        for (const obs of obstacles) {
            if (this.rectCollide(x, y, halfW, halfH, obs.x, obs.y, obs.width / 2, obs.height / 2)) {
                return false;
            }
        }
        return true;
    }

    rectCollide(x1, y1, hw1, hh1, x2, y2, hw2, hh2) {
        return Math.abs(x1 - x2) < hw1 + hw2 && Math.abs(y1 - y2) < hh1 + hh2;
    }

    shoot(dir) {
        const tearSpeed = this.shotSpeed * 7.5;
        const numTears = this.multishot;

        for (let i = 0; i < numTears; i++) {
            let angle = Math.atan2(dir.y, dir.x);
            if (numTears > 1) {
                const spread = 0.3;
                angle += (i - (numTears - 1) / 2) * spread;
            }

            const tear = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * tearSpeed * 60,
                vy: Math.sin(angle) * tearSpeed * 60,
                damage: (this.damage + this.tempDamageBonus) * this.damageMult,
                range: this.range * 10,
                traveled: 0,
                homing: this.homing,
                piercing: this.piercing,
                bouncing: this.bouncing,
                boomerang: this.boomerang,
                hitEnemies: new Set(),
                returning: false,
                tearSize: this.tearSize,
                explosive: this.explosiveTears,
                coalDamage: this.coalDamage
            };
            tears.push(tear);
        }
    }

    takeDamage(amount) {
        if (this.invulnTimer > 0) return false;

        // Damage priority: Soul hearts first, then red hearts
        if (this.soulHearts > 0) {
            this.soulHearts -= amount * 2;
            if (this.soulHearts < 0) {
                const overflow = -this.soulHearts / 2;
                this.soulHearts = 0;
                this.health -= overflow;
            }
        } else {
            this.health -= amount * 2;
        }

        this.invulnTimer = 1.0;

        // Screen shake on damage
        triggerScreenShake(8, 0.2);

        if (this.health <= 0 && this.soulHearts <= 0) {
            if (this.lives > 0) {
                this.lives--;
                this.health = 2;
                this.invulnTimer = 2.0;
            } else {
                gameState = 'gameover';
                triggerScreenShake(15, 0.5);
            }
        }

        return true;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    addItem(itemId) {
        const item = ITEM_DATA[itemId];
        if (!item) return;

        this.collectedItems.push(itemId);
        const eff = item.effect;

        if (eff.damage) this.damage += eff.damage;
        if (eff.damageMult) this.damageMult += eff.damageMult;
        if (eff.health) {
            this.maxHealth += eff.health;
            this.health += eff.health;
        }
        if (eff.speed) this.speed += eff.speed;
        if (eff.tears) this.tearDelay = Math.max(1, this.tearDelay - eff.tears * 2);
        if (eff.range) this.range += eff.range;
        if (eff.shotSpeed) this.shotSpeed += eff.shotSpeed;
        if (eff.homing) this.homing = true;
        if (eff.piercing) this.piercing = true;
        if (eff.bouncing) this.bouncing = true;
        if (eff.boomerang) this.boomerang = true;
        if (eff.multishot) this.multishot = Math.max(this.multishot, eff.multishot);
        if (eff.tearSize) this.tearSize = (this.tearSize || 1) * eff.tearSize;
        if (eff.lives) this.lives += eff.lives;
        if (eff.shield) this.hasShield = true;
        if (eff.explosive) this.explosiveTears = true;
        if (eff.splash) this.splashTears = true;
        if (eff.coalDamage) this.coalDamage = true;
        if (eff.maxHealth && eff.maxHealth < 0) {
            this.maxHealth = Math.max(2, this.maxHealth + eff.maxHealth);
            this.health = Math.min(this.health, this.maxHealth);
        }
    }

    draw(ctx) {
        const blinkRate = 0.1;
        if (this.invulnTimer > 0 && Math.floor(this.invulnTimer / blinkRate) % 2 === 0) {
            return; // Blink effect
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        // Body
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.ellipse(0, 4, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.playerOutline;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Head
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.arc(0, -8, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eyes
        const eyeOffsetX = 5;
        const eyeY = -10;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(-eyeOffsetX, eyeY, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeOffsetX, eyeY, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tear (crying effect)
        if (Math.random() > 0.7) {
            ctx.fillStyle = COLORS.tear;
            ctx.beginPath();
            ctx.ellipse(eyeOffsetX + 2, eyeY + 8, 2, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENEMY CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Enemy {
    constructor(type, x, y) {
        const data = ENEMY_DATA[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.health = data.health;
        this.maxHealth = data.health;
        this.speed = data.speed;
        this.damage = data.damage;
        this.width = data.width;
        this.height = data.height;
        this.flying = data.flying || false;
        this.behavior = data.behavior;
        this.isBoss = data.isBoss || false;

        // Champion variant (10% chance for non-bosses)
        this.championType = null;
        if (!data.isBoss && Math.random() < 0.1) {
            const champions = ['red', 'yellow', 'blue', 'green'];
            this.championType = champions[Math.floor(Math.random() * champions.length)];
            // Apply champion modifiers
            switch (this.championType) {
                case 'red': // Double health
                    this.health *= 2;
                    this.maxHealth *= 2;
                    break;
                case 'yellow': // Faster
                    this.speed *= 1.5;
                    break;
                case 'blue': // Shoots more
                    // Handled in behavior
                    break;
                case 'green': // Splits on death
                    // Handled in death
                    break;
            }
        }

        // State
        this.state = 'spawning';
        this.canMove = false;
        this.canFire = false;
        this.invulnerable = true;
        this.stunned = false;
        this.stunTimer = 0;
        this.spawnTimer = SPAWN_ANIMATION_DURATION / 1000;

        // AI state
        this.direction = { x: Math.random() - 0.5, y: Math.random() - 0.5 };
        this.moveTimer = 0;
        this.attackTimer = 0;
        this.charging = false;
        this.chargeDir = { x: 0, y: 0 };
        this.hopTimer = 0;
        this.isHopping = false;
        this.hostHidden = true;
        this.hostTimer = 2;

        // Boss state
        this.bossPhase = 0;
        this.bossTimer = 0;
        this.bossJumping = false;
        this.targetPos = null;

        // Animation
        this.animFrame = 0;
        this.animTimer = 0;
        this.hitFlash = 0;
    }

    update(dt) {
        // Spawn animation
        if (this.state === 'spawning') {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                this.state = 'active';
                this.canMove = true;
                this.canFire = true;
                this.invulnerable = false;
            }
            return;
        }

        // Stunned
        if (this.stunned) {
            this.stunTimer -= dt;
            if (this.stunTimer <= 0) {
                this.stunned = false;
                this.canMove = true;
                this.canFire = true;
            }
            return;
        }

        if (!this.canMove) return;

        // Hit flash
        if (this.hitFlash > 0) this.hitFlash -= dt;

        // Behavior
        switch (this.behavior) {
            case 'wander': this.behaviorWander(dt); break;
            case 'chase': this.behaviorChase(dt); break;
            case 'erratic': this.behaviorErratic(dt); break;
            case 'hop': this.behaviorHop(dt); break;
            case 'charge': this.behaviorCharge(dt); break;
            case 'shoot4': this.behaviorShoot4(dt); break;
            case 'shootChase': this.behaviorShootChase(dt); break;
            case 'host': this.behaviorHost(dt); break;
            case 'boss_monstro': this.behaviorMonstro(dt); break;
        }

        // Animation
        this.animTimer += dt;
        if (this.animTimer > 0.15) {
            this.animFrame = (this.animFrame + 1) % 4;
            this.animTimer = 0;
        }
    }

    behaviorWander(dt) {
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            this.direction = { x: Math.random() - 0.5, y: Math.random() - 0.5 };
            this.moveTimer = 1 + Math.random() * 2;
        }
        this.move(this.direction, dt);
    }

    behaviorChase(dt) {
        if (!player) return;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            this.direction = { x: dx / dist, y: dy / dist };
        }
        this.move(this.direction, dt);
    }

    behaviorErratic(dt) {
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            // Sometimes chase, sometimes random
            if (Math.random() > 0.5 && player) {
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    this.direction = { x: dx / dist, y: dy / dist };
                }
            } else {
                this.direction = { x: Math.random() - 0.5, y: Math.random() - 0.5 };
            }
            this.moveTimer = 0.2 + Math.random() * 0.5;
        }
        this.move(this.direction, dt, 1.5);
    }

    behaviorHop(dt) {
        this.hopTimer -= dt;
        if (!this.isHopping && this.hopTimer <= 0) {
            this.isHopping = true;
            if (player) {
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    this.direction = { x: dx / dist, y: dy / dist };
                }
            }
            this.hopTimer = 0.3;
        }

        if (this.isHopping) {
            this.move(this.direction, dt, 3);
            if (this.hopTimer <= 0) {
                this.isHopping = false;
                this.hopTimer = 0.8 + Math.random() * 0.5;
            }
        }
    }

    behaviorCharge(dt) {
        if (this.charging) {
            this.move(this.chargeDir, dt, 5);
            // Check if hit wall
            if (this.x <= ROOM_OFFSET_X + TILE_SIZE + this.width / 2 ||
                this.x >= ROOM_OFFSET_X + ROOM_WIDTH - TILE_SIZE - this.width / 2 ||
                this.y <= ROOM_OFFSET_Y + TILE_SIZE + this.height / 2 ||
                this.y >= ROOM_OFFSET_Y + ROOM_HEIGHT - TILE_SIZE - this.height / 2) {
                this.charging = false;
                this.stunned = true;
                this.stunTimer = 0.5;
                this.canMove = false;
            }
        } else {
            this.behaviorWander(dt);
            // Check if player in line
            if (player) {
                const dx = Math.abs(player.x - this.x);
                const dy = Math.abs(player.y - this.y);
                if ((dx < 20 || dy < 20) && (dx < 200 && dy < 200)) {
                    this.charging = true;
                    const pdx = player.x - this.x;
                    const pdy = player.y - this.y;
                    if (dx < dy) {
                        this.chargeDir = { x: 0, y: pdy > 0 ? 1 : -1 };
                    } else {
                        this.chargeDir = { x: pdx > 0 ? 1 : -1, y: 0 };
                    }
                }
            }
        }
    }

    behaviorShoot4(dt) {
        this.behaviorWander(dt);
        this.attackTimer -= dt;
        if (this.attackTimer <= 0 && this.canFire) {
            this.shoot4Dir();
            this.attackTimer = 2 + Math.random();
        }
    }

    behaviorShootChase(dt) {
        this.behaviorChase(dt);
        this.attackTimer -= dt;
        if (this.attackTimer <= 0 && this.canFire && player) {
            this.shootAtPlayer();
            this.attackTimer = 1.5 + Math.random();
        }
    }

    behaviorHost(dt) {
        this.hostTimer -= dt;
        if (this.hostHidden) {
            this.invulnerable = true;
            if (this.hostTimer <= 0) {
                this.hostHidden = false;
                this.hostTimer = 1 + Math.random();
                this.invulnerable = false;
            }
        } else {
            if (this.attackTimer <= 0 && player) {
                this.shootAtPlayer();
                this.attackTimer = 0.3;
            }
            this.attackTimer -= dt;
            if (this.hostTimer <= 0) {
                this.hostHidden = true;
                this.hostTimer = 2 + Math.random();
                this.invulnerable = true;
            }
        }
    }

    behaviorMonstro(dt) {
        this.bossTimer -= dt;

        if (this.bossJumping) {
            // Landing
            if (this.bossTimer <= 0) {
                this.bossJumping = false;
                this.x = this.targetPos.x;
                this.y = this.targetPos.y;
                this.invulnerable = false;
                // Radial burst
                for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
                    this.spawnProjectile(Math.cos(angle), Math.sin(angle));
                }
                this.bossTimer = 1.5;
                this.bossPhase = 0;
            }
            return;
        }

        if (this.bossTimer <= 0) {
            this.bossPhase = (this.bossPhase + 1) % 3;

            switch (this.bossPhase) {
                case 0: // Hop toward player
                    if (player) {
                        const dx = player.x - this.x;
                        const dy = player.y - this.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > 0) {
                            this.x += (dx / dist) * 50;
                            this.y += (dy / dist) * 50;
                        }
                    }
                    this.bossTimer = 0.8;
                    break;
                case 1: // Spit blood
                    if (player) {
                        const angle = Math.atan2(player.y - this.y, player.x - this.x);
                        for (let i = -3; i <= 3; i++) {
                            this.spawnProjectile(
                                Math.cos(angle + i * 0.2),
                                Math.sin(angle + i * 0.2)
                            );
                        }
                    }
                    this.bossTimer = 1.2;
                    break;
                case 2: // Jump
                    if (player) {
                        this.bossJumping = true;
                        this.invulnerable = true;
                        this.targetPos = { x: player.x, y: player.y };
                        this.bossTimer = 1.5;
                    } else {
                        this.bossTimer = 1;
                    }
                    break;
            }
        }

        // Clamp boss position
        this.x = Math.max(ROOM_OFFSET_X + TILE_SIZE + this.width / 2,
                  Math.min(ROOM_OFFSET_X + ROOM_WIDTH - TILE_SIZE - this.width / 2, this.x));
        this.y = Math.max(ROOM_OFFSET_Y + TILE_SIZE + this.height / 2,
                  Math.min(ROOM_OFFSET_Y + ROOM_HEIGHT - TILE_SIZE - this.height / 2, this.y));
    }

    shoot4Dir() {
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dx, dy] of dirs) {
            this.spawnProjectile(dx, dy);
        }
    }

    shootAtPlayer() {
        if (!player) return;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            this.spawnProjectile(dx / dist, dy / dist);
        }
    }

    spawnProjectile(dx, dy) {
        const proj = {
            x: this.x,
            y: this.y,
            vx: dx * 150,
            vy: dy * 150,
            damage: this.damage,
            enemy: true,
            size: 8
        };
        tears.push(proj);
    }

    move(dir, dt, speedMult = 1) {
        if (!this.canMove) return;

        const moveSpeed = this.speed * speedMult * 60 * dt;
        let newX = this.x + dir.x * moveSpeed;
        let newY = this.y + dir.y * moveSpeed;

        // Non-flying enemies collide with obstacles
        if (!this.flying) {
            for (const obs of obstacles) {
                const hw = this.width / 2;
                const hh = this.height / 2;
                const ohw = obs.width / 2;
                const ohh = obs.height / 2;

                if (Math.abs(newX - obs.x) < hw + ohw && Math.abs(newY - obs.y) < hh + ohh) {
                    // Try to slide around
                    if (Math.abs(this.x - obs.x) >= hw + ohw) {
                        newX = this.x;
                    }
                    if (Math.abs(this.y - obs.y) >= hh + ohh) {
                        newY = this.y;
                    }
                }
            }
        }

        // Room bounds
        newX = Math.max(ROOM_OFFSET_X + TILE_SIZE + this.width / 2,
                Math.min(ROOM_OFFSET_X + ROOM_WIDTH - TILE_SIZE - this.width / 2, newX));
        newY = Math.max(ROOM_OFFSET_Y + TILE_SIZE + this.height / 2,
                Math.min(ROOM_OFFSET_Y + ROOM_HEIGHT - TILE_SIZE - this.height / 2, newY));

        this.x = newX;
        this.y = newY;
    }

    takeDamage(amount) {
        if (this.invulnerable) return false;
        this.health -= amount;
        this.hitFlash = 0.1;

        if (this.health <= 0) {
            return true; // Dead
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Spawn animation
        if (this.state === 'spawning') {
            const progress = 1 - (this.spawnTimer / (SPAWN_ANIMATION_DURATION / 1000));
            ctx.globalAlpha = progress;
            ctx.scale(progress, progress);
        }

        // Hit flash
        if (this.hitFlash > 0) {
            ctx.fillStyle = '#fff';
        } else {
            ctx.fillStyle = this.getColor();
        }

        // Draw based on type
        this.drawType(ctx);

        ctx.restore();

        // Boss health bar
        if (this.isBoss && this.state !== 'spawning') {
            this.drawBossHealthBar(ctx);
        }
    }

    getColor() {
        // Champion colors override base color
        if (this.championType) {
            switch (this.championType) {
                case 'red': return '#ff4444';
                case 'yellow': return '#ffff44';
                case 'blue': return '#4444ff';
                case 'green': return '#44ff44';
            }
        }

        switch (this.type) {
            case 'fly': return '#444';
            case 'redFly': return '#aa3333';
            case 'gaper': return '#d4a574';
            case 'frowningGaper': return '#c49464';
            case 'spider': return '#333';
            case 'bigSpider': return '#222';
            case 'hopper': return '#8b4513';
            case 'charger': return '#666';
            case 'clotty': return '#8b0000';
            case 'pooter': return '#a0522d';
            case 'host': return this.hostHidden ? '#666' : '#8b4513';
            case 'boss_monstro': return '#c4a484';
            default: return '#888';
        }
    }

    drawType(ctx) {
        const hw = this.width / 2;
        const hh = this.height / 2;

        if (this.type === 'fly' || this.type === 'redFly') {
            // Fly body
            ctx.beginPath();
            ctx.ellipse(0, 0, hw * 0.7, hh * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            // Wings
            ctx.fillStyle = 'rgba(200,200,200,0.5)';
            const wingOffset = Math.sin(this.animTimer * 30) * 3;
            ctx.beginPath();
            ctx.ellipse(-hw * 0.5, -hh * 0.3 + wingOffset, hw * 0.4, hh * 0.6, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(hw * 0.5, -hh * 0.3 - wingOffset, hw * 0.4, hh * 0.6, 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'spider' || this.type === 'bigSpider') {
            // Spider body
            ctx.beginPath();
            ctx.ellipse(0, 0, hw * 0.6, hh * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            // Legs
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI - Math.PI / 2;
                const legX = Math.cos(angle) * hw;
                const legY = Math.sin(angle) * hh * 0.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(legX, legY);
                ctx.lineTo(legX * 1.3, legY + hh * 0.5);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-legX, legY);
                ctx.lineTo(-legX * 1.3, legY + hh * 0.5);
                ctx.stroke();
            }
        } else if (this.type === 'boss_monstro') {
            // Monstro body
            if (this.bossJumping) {
                ctx.globalAlpha = 0.3;
            }
            ctx.beginPath();
            ctx.ellipse(0, hh * 0.2, hw, hh * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            // Face
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-hw * 0.3, -hh * 0.2, hw * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(hw * 0.3, -hh * 0.2, hw * 0.15, 0, Math.PI * 2);
            ctx.fill();
            // Mouth
            ctx.beginPath();
            ctx.arc(0, hh * 0.2, hw * 0.5, 0, Math.PI);
            ctx.fill();
        } else {
            // Generic humanoid (gaper, etc)
            // Body
            ctx.beginPath();
            ctx.ellipse(0, hh * 0.3, hw * 0.7, hh * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            // Head
            ctx.beginPath();
            ctx.arc(0, -hh * 0.3, hw * 0.6, 0, Math.PI * 2);
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-hw * 0.2, -hh * 0.35, hw * 0.12, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(hw * 0.2, -hh * 0.35, hw * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawBossHealthBar(ctx) {
        const barWidth = 200;
        const barHeight = 16;
        const barX = CANVAS_WIDTH / 2 - barWidth / 2;
        const barY = CANVAS_HEIGHT - 50;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

        const healthPct = this.health / this.maxHealth;
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(barX, barY, barWidth * healthPct, barHeight);

        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.type.toUpperCase(), CANVAS_WIDTH / 2, barY - 5);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOM GENERATION
// ═══════════════════════════════════════════════════════════════════════════

function generateFloor(floorNumber) {
    const targetRoomCount = Math.floor(Math.random() * 2) + 5 + Math.floor(floorNumber * 2.6);
    const grid = [];
    for (let y = 0; y < 8; y++) {
        grid[y] = [];
        for (let x = 0; x < 9; x++) {
            grid[y][x] = null;
        }
    }

    // Start room at center
    const startX = 4, startY = 3;
    grid[startY][startX] = { type: 'start', enemies: [], obstacles: [], pickups: [], items: [] };

    const queue = [{ x: startX, y: startY }];
    const allRooms = [{ x: startX, y: startY }];
    const deadEnds = [];

    // Breadth-first expansion
    while (queue.length > 0 && allRooms.length < targetRoomCount) {
        const current = queue.shift();
        let expandedAny = false;

        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];

        // Shuffle directions
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }

        for (const dir of directions) {
            const newX = current.x + dir.dx;
            const newY = current.y + dir.dy;

            if (newX < 0 || newX > 8 || newY < 0 || newY > 7) continue;
            if (grid[newY][newX]) continue;

            // Check neighbor count (prevent loops)
            let neighborCount = 0;
            if (newY > 0 && grid[newY - 1][newX]) neighborCount++;
            if (newY < 7 && grid[newY + 1][newX]) neighborCount++;
            if (newX > 0 && grid[newY][newX - 1]) neighborCount++;
            if (newX < 8 && grid[newY][newX + 1]) neighborCount++;

            if (neighborCount >= 2) continue;
            if (allRooms.length >= targetRoomCount) continue;
            if (Math.random() < 0.4) continue;

            grid[newY][newX] = { type: 'normal', enemies: [], obstacles: [], pickups: [], items: [] };
            const newRoom = { x: newX, y: newY };
            queue.push(newRoom);
            allRooms.push(newRoom);
            expandedAny = true;
        }

        if (!expandedAny && (current.x !== startX || current.y !== startY)) {
            deadEnds.push(current);
        }
    }

    // Place special rooms
    placeBossRoom(grid, deadEnds, startX, startY);
    placeTreasureRoom(grid, deadEnds);
    placeShopRoom(grid, allRooms);

    return grid;
}

function placeBossRoom(grid, deadEnds, startX, startY) {
    let furthest = deadEnds[0];
    let maxDist = 0;
    for (const room of deadEnds) {
        const dist = Math.abs(room.x - startX) + Math.abs(room.y - startY);
        if (dist > maxDist) {
            maxDist = dist;
            furthest = room;
        }
    }
    if (furthest && grid[furthest.y][furthest.x]) {
        grid[furthest.y][furthest.x].type = 'boss';
        deadEnds.splice(deadEnds.indexOf(furthest), 1);
    }
}

function placeTreasureRoom(grid, deadEnds) {
    if (deadEnds.length > 0) {
        const idx = Math.floor(Math.random() * deadEnds.length);
        const room = deadEnds[idx];
        if (grid[room.y][room.x]) {
            grid[room.y][room.x].type = 'treasure';
            deadEnds.splice(idx, 1);
        }
    }
}

function placeShopRoom(grid, allRooms) {
    // Find an empty adjacent spot
    for (const room of allRooms) {
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        for (const [dx, dy] of dirs) {
            const nx = room.x + dx;
            const ny = room.y + dy;
            if (nx >= 0 && nx < 9 && ny >= 0 && ny < 8 && !grid[ny][nx]) {
                grid[ny][nx] = { type: 'shop', enemies: [], obstacles: [], pickups: [], items: [] };
                return;
            }
        }
    }
}

function generateRoomContent(room, roomType, floorNum) {
    room.obstacles = [];
    room.enemies = [];
    room.pickups = [];
    room.items = [];

    if (roomType === 'start') return;

    // Generate obstacles
    const numObstacles = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < numObstacles; i++) {
        const gx = 1 + Math.floor(Math.random() * (ROOM_TILES_X - 2));
        const gy = 1 + Math.floor(Math.random() * (ROOM_TILES_Y - 2));
        const type = Math.random() > 0.6 ? 'poop' : 'rock';
        room.obstacles.push({
            type: type,
            gridX: gx,
            gridY: gy,
            x: ROOM_OFFSET_X + (gx + 0.5) * TILE_SIZE,
            y: ROOM_OFFSET_Y + (gy + 0.5) * TILE_SIZE,
            width: TILE_SIZE - 8,
            height: TILE_SIZE - 8,
            health: type === 'poop' ? 3 : 999,
            maxHealth: type === 'poop' ? 3 : 999,
            destructible: type === 'poop'
        });
    }

    // Generate enemies
    if (roomType === 'normal') {
        const numEnemies = Math.floor(Math.random() * 3) + 2 + Math.floor(floorNum / 2);
        const enemyTypes = ['fly', 'redFly', 'gaper', 'frowningGaper', 'spider', 'bigSpider', 'hopper', 'charger', 'clotty', 'pooter', 'host'];
        for (let i = 0; i < numEnemies; i++) {
            const gx = 1 + Math.floor(Math.random() * (ROOM_TILES_X - 2));
            const gy = 1 + Math.floor(Math.random() * (ROOM_TILES_Y - 2));
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            room.enemies.push({
                type: type,
                x: ROOM_OFFSET_X + (gx + 0.5) * TILE_SIZE,
                y: ROOM_OFFSET_Y + (gy + 0.5) * TILE_SIZE
            });
        }
    } else if (roomType === 'boss') {
        room.enemies.push({
            type: 'boss_monstro',
            x: ROOM_OFFSET_X + ROOM_WIDTH / 2,
            y: ROOM_OFFSET_Y + ROOM_HEIGHT / 2
        });
    } else if (roomType === 'treasure') {
        // Item pedestal
        const itemKeys = Object.keys(ITEM_DATA).filter(k => ITEM_DATA[k].pool === 'treasure');
        const itemId = itemKeys[Math.floor(Math.random() * itemKeys.length)];
        room.items.push({
            id: itemId,
            name: ITEM_DATA[itemId].name,
            desc: ITEM_DATA[itemId].desc,
            x: ROOM_OFFSET_X + ROOM_WIDTH / 2,
            y: ROOM_OFFSET_Y + ROOM_HEIGHT / 2
        });
    } else if (roomType === 'shop') {
        // Shop items
        const shopItems = Object.keys(ITEM_DATA).filter(k => ['treasure', 'boss'].includes(ITEM_DATA[k].pool));
        for (let i = 0; i < 3; i++) {
            const itemId = shopItems[Math.floor(Math.random() * shopItems.length)];
            room.items.push({
                id: itemId,
                name: ITEM_DATA[itemId].name,
                desc: ITEM_DATA[itemId].desc,
                x: ROOM_OFFSET_X + (3 + i * 3.5) * TILE_SIZE,
                y: ROOM_OFFSET_Y + ROOM_HEIGHT / 2,
                price: 15 + Math.floor(Math.random() * 10)
            });
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOM MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

function loadRoom(roomX, roomY, entryDir) {
    const roomKey = `${roomX},${roomY}`;
    const roomData = floorMap[roomY]?.[roomX];
    if (!roomData) return;

    // Save current room state
    saveRoomState();

    // Load or generate room content
    if (roomStates[roomKey]) {
        // Restore saved state
        const state = roomStates[roomKey];
        obstacles = state.obstacles.map(o => ({ ...o }));
        enemies = state.enemies.map(e => new Enemy(e.type, e.x, e.y));
        pickups = state.pickups.map(p => ({ ...p }));
        items = state.items.map(i => ({ ...i }));
    } else {
        // Generate new room
        if (!roomData.generated) {
            generateRoomContent(roomData, roomData.type, floorNum);
            roomData.generated = true;
        }
        obstacles = roomData.obstacles.map(o => ({ ...o }));
        enemies = roomData.enemies.map(e => new Enemy(e.type, e.x, e.y));
        pickups = roomData.pickups.map(p => ({ ...p }));
        items = roomData.items.map(i => ({ ...i }));
    }

    // Update current room
    currentRoom = { x: roomX, y: roomY };
    visitedRooms.add(roomKey);

    // Spawn player at entry door
    spawnPlayerAtDoor(entryDir);

    // Setup doors
    setupDoors();

    // Clear tears, projectiles, and particles
    tears = [];
    bombs = [];
    explosions = [];
    particles = [];

    // Trapdoor in boss room after boss defeated
    trapdoor = null;
    if (roomData.type === 'boss' && bossDefeated) {
        trapdoor = {
            x: ROOM_OFFSET_X + ROOM_WIDTH / 2,
            y: ROOM_OFFSET_Y + ROOM_HEIGHT / 2 + 50
        };
    }

    // Movement pause on entry
    if (player) {
        player.canMove = false;
        roomEntryPauseTimer = 0.1;
    }
}

function saveRoomState() {
    if (!currentRoom) return;
    const roomKey = `${currentRoom.x},${currentRoom.y}`;
    roomStates[roomKey] = {
        obstacles: obstacles.map(o => ({ ...o })),
        enemies: enemies.map(e => ({ type: e.type, x: e.x, y: e.y, health: e.health })),
        pickups: pickups.map(p => ({ ...p })),
        items: items.map(i => ({ ...i }))
    };
}

function spawnPlayerAtDoor(entryDir) {
    if (!player) return;

    const centerX = ROOM_OFFSET_X + ROOM_WIDTH / 2;
    const centerY = ROOM_OFFSET_Y + ROOM_HEIGHT / 2;

    switch (entryDir) {
        case 'north':
            player.x = centerX;
            player.y = ROOM_OFFSET_Y + TILE_SIZE + DOOR_SPAWN_OFFSET;
            break;
        case 'south':
            player.x = centerX;
            player.y = ROOM_OFFSET_Y + ROOM_HEIGHT - TILE_SIZE - DOOR_SPAWN_OFFSET;
            break;
        case 'east':
            player.x = ROOM_OFFSET_X + ROOM_WIDTH - TILE_SIZE - DOOR_SPAWN_OFFSET;
            player.y = centerY;
            break;
        case 'west':
            player.x = ROOM_OFFSET_X + TILE_SIZE + DOOR_SPAWN_OFFSET;
            player.y = centerY;
            break;
        default:
            player.x = centerX;
            player.y = centerY;
    }
}

function setupDoors() {
    doors = [];
    const roomData = floorMap[currentRoom.y]?.[currentRoom.x];
    if (!roomData) return;

    const checkDirs = [
        { dir: 'north', dx: 0, dy: -1, x: ROOM_OFFSET_X + ROOM_WIDTH / 2, y: ROOM_OFFSET_Y + TILE_SIZE / 2 },
        { dir: 'south', dx: 0, dy: 1, x: ROOM_OFFSET_X + ROOM_WIDTH / 2, y: ROOM_OFFSET_Y + ROOM_HEIGHT - TILE_SIZE / 2 },
        { dir: 'west', dx: -1, dy: 0, x: ROOM_OFFSET_X + TILE_SIZE / 2, y: ROOM_OFFSET_Y + ROOM_HEIGHT / 2 },
        { dir: 'east', dx: 1, dy: 0, x: ROOM_OFFSET_X + ROOM_WIDTH - TILE_SIZE / 2, y: ROOM_OFFSET_Y + ROOM_HEIGHT / 2 }
    ];

    for (const d of checkDirs) {
        const nx = currentRoom.x + d.dx;
        const ny = currentRoom.y + d.dy;
        if (floorMap[ny]?.[nx]) {
            const targetRoom = floorMap[ny][nx];
            const door = {
                dir: d.dir,
                x: d.x,
                y: d.y,
                targetX: nx,
                targetY: ny,
                open: enemies.length === 0,
                type: targetRoom.type === 'boss' ? 'boss' : (targetRoom.type === 'treasure' ? 'treasure' : 'normal'),
                locked: targetRoom.type === 'treasure' && floorNum > 1
            };
            doors.push(door);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME UPDATE
// ═══════════════════════════════════════════════════════════════════════════

function update(dt) {
    if (gameState !== 'playing') return;

    // Update screen shake
    updateScreenShake(dt);

    // Update particles
    updateParticles(dt);

    // Room entry pause
    if (roomEntryPauseTimer > 0) {
        roomEntryPauseTimer -= dt;
        if (roomEntryPauseTimer <= 0 && player) {
            player.canMove = true;
        }
        return;
    }

    // Update player
    if (player) {
        player.update(dt);
    }

    // Update enemies
    for (const enemy of enemies) {
        enemy.update(dt);
    }

    // Update tears
    updateTears(dt);

    // Update bombs
    updateBombs(dt);

    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].timer -= dt;
        if (explosions[i].timer <= 0) {
            explosions.splice(i, 1);
        }
    }

    // Check collisions
    checkCollisions();

    // Check door transitions
    checkDoorTransitions();

    // Check trapdoor
    checkTrapdoor();

    // Check pickups
    checkPickups();

    // Check item pedestals
    checkItemPickup();

    // Update doors (open when enemies cleared)
    if (enemies.length === 0) {
        for (const door of doors) {
            if (!door.locked) door.open = true;
        }

        // Spawn trapdoor in boss room when boss killed
        const roomData = floorMap[currentRoom.y]?.[currentRoom.x];
        if (roomData?.type === 'boss' && !bossDefeated) {
            bossDefeated = true;
            trapdoor = {
                x: ROOM_OFFSET_X + ROOM_WIDTH / 2,
                y: ROOM_OFFSET_Y + ROOM_HEIGHT / 2 + 50
            };
            // Drop boss item
            const bossItems = Object.keys(ITEM_DATA).filter(k => ITEM_DATA[k].pool === 'boss');
            const itemId = bossItems[Math.floor(Math.random() * bossItems.length)];
            items.push({
                id: itemId,
                name: ITEM_DATA[itemId].name,
                desc: ITEM_DATA[itemId].desc,
                x: ROOM_OFFSET_X + ROOM_WIDTH / 2,
                y: ROOM_OFFSET_Y + ROOM_HEIGHT / 2
            });
        }
    }
}

function updateTears(dt) {
    for (let i = tears.length - 1; i >= 0; i--) {
        const tear = tears[i];

        // Move
        tear.x += tear.vx * dt;
        tear.y += tear.vy * dt;
        tear.traveled = (tear.traveled || 0) + Math.sqrt(tear.vx * tear.vx + tear.vy * tear.vy) * dt;

        // Homing
        if (tear.homing && !tear.enemy) {
            let closest = null;
            let closestDist = 200;
            for (const enemy of enemies) {
                const dist = Math.sqrt(Math.pow(enemy.x - tear.x, 2) + Math.pow(enemy.y - tear.y, 2));
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = enemy;
                }
            }
            if (closest) {
                const dx = closest.x - tear.x;
                const dy = closest.y - tear.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    const speed = Math.sqrt(tear.vx * tear.vx + tear.vy * tear.vy);
                    tear.vx = tear.vx * 0.9 + (dx / dist) * speed * 0.1;
                    tear.vy = tear.vy * 0.9 + (dy / dist) * speed * 0.1;
                }
            }
        }

        // Boomerang
        if (tear.boomerang && !tear.returning && tear.traveled > 150) {
            tear.returning = true;
        }
        if (tear.returning && player) {
            const dx = player.x - tear.x;
            const dy = player.y - tear.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                const speed = Math.sqrt(tear.vx * tear.vx + tear.vy * tear.vy) * 1.2;
                tear.vx = (dx / dist) * speed;
                tear.vy = (dy / dist) * speed;
            }
            if (dist < 20) {
                tears.splice(i, 1);
                continue;
            }
        }

        // Check range / bounds
        const outOfBounds = tear.x < ROOM_OFFSET_X || tear.x > ROOM_OFFSET_X + ROOM_WIDTH ||
                           tear.y < ROOM_OFFSET_Y || tear.y > ROOM_OFFSET_Y + ROOM_HEIGHT;
        const outOfRange = tear.range && tear.traveled > tear.range;

        if (outOfBounds || outOfRange) {
            if (tear.bouncing && outOfBounds) {
                // Bounce off walls
                if (tear.x < ROOM_OFFSET_X || tear.x > ROOM_OFFSET_X + ROOM_WIDTH) {
                    tear.vx = -tear.vx;
                    tear.x = Math.max(ROOM_OFFSET_X, Math.min(ROOM_OFFSET_X + ROOM_WIDTH, tear.x));
                }
                if (tear.y < ROOM_OFFSET_Y || tear.y > ROOM_OFFSET_Y + ROOM_HEIGHT) {
                    tear.vy = -tear.vy;
                    tear.y = Math.max(ROOM_OFFSET_Y, Math.min(ROOM_OFFSET_Y + ROOM_HEIGHT, tear.y));
                }
            } else {
                tears.splice(i, 1);
            }
        }
    }
}

function updateBombs(dt) {
    for (let i = bombs.length - 1; i >= 0; i--) {
        bombs[i].timer -= dt;
        if (bombs[i].timer <= 0) {
            // Explode
            const bomb = bombs[i];
            bombs.splice(i, 1);

            explosions.push({
                x: bomb.x,
                y: bomb.y,
                radius: 60,
                timer: 0.3
            });

            // Damage in radius
            const radius = 60;

            // Enemies
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                const dist = Math.sqrt(Math.pow(enemy.x - bomb.x, 2) + Math.pow(enemy.y - bomb.y, 2));
                if (dist < radius + enemy.width / 2) {
                    if (enemy.takeDamage(60)) {
                        enemies.splice(j, 1);
                        totalKills++;
                        spawnPickupDrop(enemy.x, enemy.y);
                    }
                }
            }

            // Player
            if (player) {
                const dist = Math.sqrt(Math.pow(player.x - bomb.x, 2) + Math.pow(player.y - bomb.y, 2));
                if (dist < radius + player.width / 2) {
                    player.takeDamage(1);
                }
            }

            // Obstacles
            for (let j = obstacles.length - 1; j >= 0; j--) {
                const obs = obstacles[j];
                const dist = Math.sqrt(Math.pow(obs.x - bomb.x, 2) + Math.pow(obs.y - bomb.y, 2));
                if (dist < radius + obs.width / 2) {
                    if (obs.destructible || obs.type === 'rock') {
                        obstacles.splice(j, 1);
                    }
                }
            }
        }
    }
}

function checkCollisions() {
    // Player tears vs enemies
    for (let i = tears.length - 1; i >= 0; i--) {
        const tear = tears[i];
        if (tear.enemy) continue;

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (tear.hitEnemies?.has(j)) continue;

            const dist = Math.sqrt(Math.pow(tear.x - enemy.x, 2) + Math.pow(tear.y - enemy.y, 2));
            if (dist < TEAR_SIZE / 2 + enemy.width / 2) {
                // Spawn tear splash
                spawnTearSplash(tear.x, tear.y);

                if (enemy.takeDamage(tear.damage)) {
                    enemies.splice(j, 1);
                    totalKills++;
                    spawnBloodSplash(enemy.x, enemy.y);
                    spawnPickupDrop(enemy.x, enemy.y);
                }

                if (tear.piercing) {
                    if (!tear.hitEnemies) tear.hitEnemies = new Set();
                    tear.hitEnemies.add(j);
                } else {
                    tears.splice(i, 1);
                    break;
                }
            }
        }
    }

    // Enemy tears vs player
    if (player) {
        for (let i = tears.length - 1; i >= 0; i--) {
            const tear = tears[i];
            if (!tear.enemy) continue;

            const dist = Math.sqrt(Math.pow(tear.x - player.x, 2) + Math.pow(tear.y - player.y, 2));
            if (dist < (tear.size || TEAR_SIZE) / 2 + player.width / 2) {
                player.takeDamage(tear.damage);
                tears.splice(i, 1);
            }
        }

        // Enemy contact damage
        for (const enemy of enemies) {
            if (enemy.state === 'spawning') continue;
            const dist = Math.sqrt(Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2));
            if (dist < enemy.width / 2 + player.width / 2) {
                player.takeDamage(enemy.damage);
            }
        }
    }

    // Tears vs obstacles (poops)
    for (let i = tears.length - 1; i >= 0; i--) {
        const tear = tears[i];
        if (tear.enemy) continue;

        for (let j = obstacles.length - 1; j >= 0; j--) {
            const obs = obstacles[j];
            if (!obs.destructible) continue;

            const dist = Math.sqrt(Math.pow(tear.x - obs.x, 2) + Math.pow(tear.y - obs.y, 2));
            if (dist < TEAR_SIZE / 2 + obs.width / 2) {
                obs.health -= tear.damage;
                if (obs.health <= 0) {
                    obstacles.splice(j, 1);
                    // Maybe spawn pickup
                    if (Math.random() > 0.7) {
                        pickups.push({
                            type: Math.random() > 0.5 ? 'coin' : 'heart',
                            x: obs.x,
                            y: obs.y
                        });
                    }
                }
                if (!tear.piercing) {
                    tears.splice(i, 1);
                    break;
                }
            }
        }
    }
}

function spawnPickupDrop(x, y) {
    if (Math.random() > 0.33) return;

    const types = ['heart', 'halfHeart', 'coin', 'bomb', 'key'];
    const weights = [15, 20, 25, 10, 10];
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let type = types[0];
    for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) {
            type = types[i];
            break;
        }
    }

    pickups.push({ type: type, x: x, y: y });
}

function checkDoorTransitions() {
    if (!player) return;

    for (const door of doors) {
        if (!door.open) continue;

        const dist = Math.sqrt(Math.pow(player.x - door.x, 2) + Math.pow(player.y - door.y, 2));
        if (dist < TILE_SIZE) {
            // Transition to new room
            const entryDir = { north: 'south', south: 'north', east: 'west', west: 'east' }[door.dir];
            loadRoom(door.targetX, door.targetY, entryDir);
            return;
        }
    }
}

function checkTrapdoor() {
    if (!trapdoor || !player) return;

    const dist = Math.sqrt(Math.pow(player.x - trapdoor.x, 2) + Math.pow(player.y - trapdoor.y, 2));
    if (dist < TILE_SIZE) {
        // Next floor
        floorNum++;
        if (floorNum > 6) {
            gameState = 'win';
        } else {
            bossDefeated = false;
            roomStates = {};
            visitedRooms.clear();
            floorMap = generateFloor(floorNum);
            currentRoom = { x: 4, y: 3 };
            loadRoom(4, 3, null);
        }
    }
}

function checkPickups() {
    if (!player) return;

    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        const dist = Math.sqrt(Math.pow(player.x - pickup.x, 2) + Math.pow(player.y - pickup.y, 2));

        if (dist < TILE_SIZE) {
            switch (pickup.type) {
                case 'heart':
                    if (player.health < player.maxHealth) {
                        player.heal(2);
                        pickups.splice(i, 1);
                    }
                    break;
                case 'halfHeart':
                    if (player.health < player.maxHealth) {
                        player.heal(1);
                        pickups.splice(i, 1);
                    }
                    break;
                case 'soulHeart':
                    player.soulHearts += 2;
                    pickups.splice(i, 1);
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

function checkItemPickup() {
    if (!player || items.length === 0) return;

    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dist = Math.sqrt(Math.pow(player.x - item.x, 2) + Math.pow(player.y - item.y, 2));

        if (dist < TILE_SIZE * 2.5) {
            // Show tooltip from further away
            item.showTooltip = true;

            if (dist < TILE_SIZE * 0.8) {
                // Pick up item
                if (item.price) {
                    if (player.coins >= item.price) {
                        player.coins -= item.price;
                        player.addItem(item.id);
                        items.splice(i, 1);
                    }
                } else {
                    player.addItem(item.id);
                    items.splice(i, 1);
                }
            }
        } else {
            item.showTooltip = false;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════════════════

function draw() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gameState === 'title') {
        drawTitle();
        return;
    }

    if (gameState === 'gameover') {
        drawGameOver();
        return;
    }

    if (gameState === 'win') {
        drawWin();
        return;
    }

    if (gameState === 'paused') {
        // Draw game in background (no shake), then pause overlay
        drawRoom();
        for (const obs of obstacles) drawObstacle(obs);
        for (const pickup of pickups) drawPickup(pickup);
        for (const item of items) drawItem(item);
        if (trapdoor) drawTrapdoor();
        for (const tear of tears) drawTear(tear);
        for (const enemy of enemies) enemy.draw(ctx);
        if (player) player.draw(ctx);
        for (const door of doors) drawDoor(door);
        drawUI();
        drawMinimap();
        drawPaused();
        return;
    }

    // Apply screen shake
    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);

    // Draw room
    drawRoom();

    // Draw obstacles
    for (const obs of obstacles) {
        drawObstacle(obs);
    }

    // Draw pickups
    for (const pickup of pickups) {
        drawPickup(pickup);
    }

    // Draw items
    for (const item of items) {
        drawItem(item);
    }

    // Draw trapdoor
    if (trapdoor) {
        drawTrapdoor();
    }

    // Draw tears
    for (const tear of tears) {
        drawTear(tear);
    }

    // Draw particles
    drawParticles(ctx);

    // Draw enemies
    for (const enemy of enemies) {
        enemy.draw(ctx);
    }

    // Draw player
    if (player) {
        player.draw(ctx);
    }

    // Draw bombs
    for (const bomb of bombs) {
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(bomb.x, bomb.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(bomb.x, bomb.y - 10, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw explosions
    for (const exp of explosions) {
        const alpha = exp.timer / 0.3;
        ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius * (1 - alpha * 0.5), 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw doors
    for (const door of doors) {
        drawDoor(door);
    }

    // Restore from screen shake before UI
    ctx.restore();

    // Draw UI
    drawUI();

    // Draw minimap
    drawMinimap();
}

function drawRoom() {
    // Floor
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(ROOM_OFFSET_X + TILE_SIZE, ROOM_OFFSET_Y + TILE_SIZE,
                 ROOM_WIDTH - TILE_SIZE * 2, ROOM_HEIGHT - TILE_SIZE * 2);

    // Floor pattern
    ctx.fillStyle = COLORS.floorAlt;
    for (let x = 1; x < ROOM_TILES_X - 1; x++) {
        for (let y = 1; y < ROOM_TILES_Y - 1; y++) {
            if ((x + y) % 2 === 0) {
                ctx.fillRect(ROOM_OFFSET_X + x * TILE_SIZE + 2,
                            ROOM_OFFSET_Y + y * TILE_SIZE + 2,
                            TILE_SIZE - 4, TILE_SIZE - 4);
            }
        }
    }

    // Walls
    ctx.fillStyle = COLORS.wall;
    // Top wall
    ctx.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH, TILE_SIZE);
    // Bottom wall
    ctx.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y + ROOM_HEIGHT - TILE_SIZE, ROOM_WIDTH, TILE_SIZE);
    // Left wall
    ctx.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, TILE_SIZE, ROOM_HEIGHT);
    // Right wall
    ctx.fillRect(ROOM_OFFSET_X + ROOM_WIDTH - TILE_SIZE, ROOM_OFFSET_Y, TILE_SIZE, ROOM_HEIGHT);

    // Wall border
    ctx.strokeStyle = COLORS.wallBorder;
    ctx.lineWidth = 4;
    ctx.strokeRect(ROOM_OFFSET_X + TILE_SIZE, ROOM_OFFSET_Y + TILE_SIZE,
                   ROOM_WIDTH - TILE_SIZE * 2, ROOM_HEIGHT - TILE_SIZE * 2);
}

function drawObstacle(obs) {
    ctx.save();
    ctx.translate(obs.x, obs.y);

    if (obs.type === 'rock') {
        ctx.fillStyle = COLORS.rock;
        ctx.beginPath();
        ctx.moveTo(-obs.width / 2, obs.height / 4);
        ctx.lineTo(-obs.width / 3, -obs.height / 2);
        ctx.lineTo(obs.width / 3, -obs.height / 2);
        ctx.lineTo(obs.width / 2, obs.height / 4);
        ctx.lineTo(0, obs.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = COLORS.rockDark;
        ctx.beginPath();
        ctx.moveTo(0, obs.height / 2);
        ctx.lineTo(obs.width / 2, obs.height / 4);
        ctx.lineTo(obs.width / 3, -obs.height / 2);
        ctx.lineTo(0, -obs.height / 4);
        ctx.closePath();
        ctx.fill();
    } else if (obs.type === 'poop') {
        const healthPct = obs.health / obs.maxHealth;
        ctx.fillStyle = COLORS.poop;
        if (healthPct < 0.3) ctx.fillStyle = '#5a3010';
        else if (healthPct < 0.6) ctx.fillStyle = '#6b3815';

        // Poop pile
        ctx.beginPath();
        ctx.arc(0, obs.height / 4, obs.width / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-obs.width / 5, 0, obs.width / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(obs.width / 5, 0, obs.width / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -obs.height / 4, obs.width / 5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawPickup(pickup) {
    ctx.save();
    ctx.translate(pickup.x, pickup.y);

    // Floating animation
    const float = Math.sin(Date.now() / 200) * 3;
    ctx.translate(0, float);

    switch (pickup.type) {
        case 'heart':
        case 'halfHeart':
            ctx.fillStyle = COLORS.heart;
            drawHeart(ctx, 0, 0, 12);
            if (pickup.type === 'halfHeart') {
                ctx.fillStyle = COLORS.heartEmpty;
                ctx.beginPath();
                ctx.rect(0, -10, 15, 20);
                ctx.fill();
            }
            break;
        case 'soulHeart':
            ctx.fillStyle = COLORS.soulHeart;
            drawHeart(ctx, 0, 0, 12);
            break;
        case 'coin':
            ctx.fillStyle = COLORS.coin;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#b8860b';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 0);
            break;
        case 'bomb':
            ctx.fillStyle = COLORS.bomb;
            ctx.beginPath();
            ctx.arc(0, 2, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(0, -14);
            ctx.stroke();
            break;
        case 'key':
            ctx.fillStyle = COLORS.key;
            ctx.beginPath();
            ctx.arc(0, -5, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-2, 0, 4, 12);
            ctx.fillRect(-4, 8, 3, 4);
            ctx.fillRect(1, 5, 3, 4);
            break;
    }

    ctx.restore();
}

function drawItem(item) {
    ctx.save();
    ctx.translate(item.x, item.y);

    // Pedestal
    ctx.fillStyle = '#555';
    ctx.fillRect(-20, 10, 40, 20);
    ctx.fillStyle = '#666';
    ctx.fillRect(-18, 8, 36, 4);

    // Item glow
    const glow = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 255, 200, ${glow * 0.3})`;
    ctx.beginPath();
    ctx.arc(0, -5, 25, 0, Math.PI * 2);
    ctx.fill();

    // Item (simple representation)
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(0, -5, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, -5);

    // Price
    if (item.price) {
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText(`$${item.price}`, 0, 35);
    }

    // Tooltip
    if (item.showTooltip) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(-80, -80, 160, 50);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(item.name, 0, -65);
        ctx.font = '10px monospace';
        ctx.fillStyle = '#aaa';
        ctx.fillText(item.desc, 0, -45);
    }

    ctx.restore();
}

function drawTrapdoor() {
    ctx.save();
    ctx.translate(trapdoor.x, trapdoor.y);

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
}

function drawTear(tear) {
    ctx.save();
    ctx.translate(tear.x, tear.y);

    if (tear.enemy) {
        ctx.fillStyle = '#8b0000';
    } else if (tear.explosive) {
        ctx.fillStyle = '#90EE90';
    } else {
        ctx.fillStyle = COLORS.tear;
    }

    const baseSize = tear.size || TEAR_SIZE;
    const size = baseSize * (tear.tearSize || 1);
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = tear.enemy ? '#660000' : (tear.explosive ? '#228B22' : COLORS.tearOutline);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

function drawDoor(door) {
    ctx.save();
    ctx.translate(door.x, door.y);

    // Rotate based on direction
    if (door.dir === 'east') ctx.rotate(Math.PI / 2);
    else if (door.dir === 'south') ctx.rotate(Math.PI);
    else if (door.dir === 'west') ctx.rotate(-Math.PI / 2);

    // Door frame
    ctx.fillStyle = door.type === 'boss' ? '#660000' :
                   (door.type === 'treasure' ? '#ffd700' : COLORS.door);
    ctx.fillRect(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE / 2);

    // Door opening
    if (door.open) {
        ctx.fillStyle = '#111';
    } else {
        ctx.fillStyle = door.locked ? '#444' : COLORS.doorOpen;
    }
    ctx.fillRect(-TILE_SIZE / 3, -TILE_SIZE / 2 + 5, TILE_SIZE * 2 / 3, TILE_SIZE / 2 - 10);

    // Lock icon
    if (door.locked) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, -TILE_SIZE / 4, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawHeart(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.bezierCurveTo(-size, 0, -size, -size, 0, -size / 2);
    ctx.bezierCurveTo(size, -size, size, 0, 0, size / 2);
    ctx.fill();
    ctx.restore();
}

function drawUI() {
    if (!player) return;

    // Health
    let heartX = 50;
    const heartY = 50;
    const heartSize = 12;
    const heartSpacing = 28;

    // Red hearts
    const maxHearts = Math.ceil(player.maxHealth / 2);
    for (let i = 0; i < maxHearts; i++) {
        const health = player.health - i * 2;
        if (health >= 2) {
            ctx.fillStyle = COLORS.heart;
            drawHeart(ctx, heartX, heartY, heartSize);
        } else if (health === 1) {
            ctx.fillStyle = COLORS.heartEmpty;
            drawHeart(ctx, heartX, heartY, heartSize);
            ctx.save();
            ctx.beginPath();
            ctx.rect(heartX - heartSize, heartY - heartSize, heartSize, heartSize * 2);
            ctx.clip();
            ctx.fillStyle = COLORS.heart;
            drawHeart(ctx, heartX, heartY, heartSize);
            ctx.restore();
        } else {
            ctx.fillStyle = COLORS.heartEmpty;
            drawHeart(ctx, heartX, heartY, heartSize);
        }
        heartX += heartSpacing;
    }

    // Soul hearts
    const soulHearts = Math.ceil(player.soulHearts / 2);
    for (let i = 0; i < soulHearts; i++) {
        ctx.fillStyle = COLORS.soulHeart;
        drawHeart(ctx, heartX, heartY, heartSize);
        heartX += heartSpacing;
    }

    // Pickups (left side)
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';

    // Keys
    ctx.fillStyle = COLORS.key;
    ctx.fillText('K', 30, 100);
    ctx.fillStyle = '#fff';
    ctx.fillText(`: ${player.keys}`, 45, 100);

    // Bombs
    ctx.fillStyle = '#666';
    ctx.fillText('B', 30, 125);
    ctx.fillStyle = '#fff';
    ctx.fillText(`: ${player.bombs}`, 45, 125);

    // Coins
    ctx.fillStyle = COLORS.coin;
    ctx.fillText('$', 30, 150);
    ctx.fillStyle = '#fff';
    ctx.fillText(`: ${player.coins}`, 45, 150);

    // Stats
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText(`DMG: ${(player.damage * player.damageMult).toFixed(1)}`, 30, 180);
    ctx.fillText(`SPD: ${player.speed.toFixed(1)}`, 30, 195);

    // Floor info
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Floor ${floorNum}`, CANVAS_WIDTH / 2, 30);
}

function drawMinimap() {
    const mapX = CANVAS_WIDTH - 120;
    const mapY = 30;
    const cellSize = 12;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX - 10, mapY - 10, 110, 110);

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 9; x++) {
            const room = floorMap[y]?.[x];
            if (!room) continue;

            const roomKey = `${x},${y}`;
            const visited = visitedRooms.has(roomKey);
            const isCurrent = currentRoom.x === x && currentRoom.y === y;

            if (!visited && !isCurrent) {
                // Check if adjacent to visited
                let adjacent = false;
                if (visitedRooms.has(`${x - 1},${y}`) || visitedRooms.has(`${x + 1},${y}`) ||
                    visitedRooms.has(`${x},${y - 1}`) || visitedRooms.has(`${x},${y + 1}`)) {
                    adjacent = true;
                }
                if (!adjacent) continue;
                ctx.fillStyle = '#444';
            } else if (isCurrent) {
                ctx.fillStyle = '#fff';
            } else {
                switch (room.type) {
                    case 'boss': ctx.fillStyle = '#ff3333'; break;
                    case 'treasure': ctx.fillStyle = '#ffd700'; break;
                    case 'shop': ctx.fillStyle = '#00ffff'; break;
                    case 'start': ctx.fillStyle = '#00ff00'; break;
                    default: ctx.fillStyle = '#8b7355';
                }
            }

            const rx = mapX + (x - 2) * cellSize;
            const ry = mapY + (y - 1) * cellSize;
            ctx.fillRect(rx, ry, cellSize - 2, cellSize - 2);
        }
    }
}

function drawTitle() {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BASEMENT TEARS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

    ctx.font = '20px monospace';
    ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('WASD - Move | Arrows - Shoot | E - Bomb', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`Floor ${floorNum} | Kills: ${totalKills}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.fillText('Press SPACE to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

function drawWin() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`Kills: ${totalKills}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.fillText('Press SPACE to play again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

function drawPaused() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

    // Show stats
    if (player) {
        ctx.font = '16px monospace';
        ctx.fillText(`Floor: ${floorNum} | Kills: ${totalKills}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.fillText(`DMG: ${(player.damage * player.damageMult).toFixed(1)} | SPD: ${player.speed.toFixed(1)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
        ctx.fillText(`Items: ${player.collectedItems.length}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }

    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText('Press P or ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
}

// ═══════════════════════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════════════════════

function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    keys[key] = true;

    if (key === ' ' || key === 'space') {
        if (gameState === 'title' || gameState === 'gameover' || gameState === 'win') {
            startGame();
        }
    }

    if (key === 'e' && gameState === 'playing' && player && player.bombs > 0) {
        player.bombs--;
        bombs.push({
            x: player.x,
            y: player.y,
            timer: 2
        });
    }

    // Pause
    if ((key === 'p' || key === 'escape') && (gameState === 'playing' || gameState === 'paused')) {
        gameState = gameState === 'playing' ? 'paused' : 'playing';
    }

    // Prevent scrolling
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        e.preventDefault();
    }
}

function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    keys[key] = false;
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME LOOP
// ═══════════════════════════════════════════════════════════════════════════

function startGame() {
    gameState = 'playing';
    floorNum = 1;
    bossDefeated = false;
    totalKills = 0;
    roomStates = {};
    visitedRooms.clear();

    // Generate floor
    floorMap = generateFloor(floorNum);
    currentRoom = { x: 4, y: 3 };

    // Create player
    player = new Player(ROOM_OFFSET_X + ROOM_WIDTH / 2, ROOM_OFFSET_Y + ROOM_HEIGHT / 2);

    // Load starting room
    loadRoom(4, 3, null);
}

function gameLoop(timestamp) {
    deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════════════════════════════════════════
// DEBUG COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

window.debugCommands = {
    godMode: function(enabled) {
        if (player) {
            player.invulnTimer = enabled ? 999999 : 0;
        }
    },
    setHealth: function(amount) {
        if (player) player.health = Math.min(player.maxHealth, amount);
    },
    setMaxHealth: function(amount) {
        if (player) {
            player.maxHealth = amount;
            player.health = Math.min(player.health, amount);
        }
    },
    giveCoins: function(amount) {
        if (player) player.coins += amount;
    },
    giveBombs: function(amount) {
        if (player) player.bombs += amount;
    },
    giveKeys: function(amount) {
        if (player) player.keys += amount;
    },
    giveAllItems: function() {
        if (player) {
            Object.keys(ITEM_DATA).forEach(id => player.addItem(id));
        }
    },
    giveItem: function(itemId) {
        if (player && ITEM_DATA[itemId]) {
            player.addItem(itemId);
        }
    },
    skipToLevel: function(level) {
        floorNum = level;
        bossDefeated = false;
        roomStates = {};
        visitedRooms.clear();
        floorMap = generateFloor(floorNum);
        loadRoom(4, 3, null);
    },
    clearRoom: function() {
        enemies = [];
        for (const door of doors) door.open = true;
    },
    spawnEnemy: function(type, x, y) {
        if (ENEMY_DATA[type]) {
            const ex = x || player?.x || ROOM_OFFSET_X + ROOM_WIDTH / 2;
            const ey = y || player?.y || ROOM_OFFSET_Y + ROOM_HEIGHT / 2;
            enemies.push(new Enemy(type, ex + 50, ey));
        }
    },
    spawnBoss: function() {
        enemies.push(new Enemy('boss_monstro', ROOM_OFFSET_X + ROOM_WIDTH / 2, ROOM_OFFSET_Y + ROOM_HEIGHT / 2));
    },
    showHitboxes: function(enabled) {
        window.showHitboxes = enabled;
    },
    slowMotion: function(factor) {
        window.timeScale = factor || 1;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPOSED GETTERS FOR TEST HARNESS
// ═══════════════════════════════════════════════════════════════════════════

window.getPlayer = () => player;
window.getEnemies = () => enemies;
window.getPickups = () => pickups;
window.getObstacles = () => obstacles;
window.getDoors = () => doors;
window.getItems = () => items;
window.getTears = () => tears;
window.getCurrentRoom = () => currentRoom;
window.getFloorMap = () => floorMap;
window.getFloorNum = () => floorNum;
window.getKeys = () => keys;
window.gameState = () => ({
    state: gameState,
    bossDefeated: bossDefeated,
    kills: totalKills
});
window.startGame = startGame;

// Expose constants
window.ROOM_OFFSET_X = ROOM_OFFSET_X;
window.ROOM_OFFSET_Y = ROOM_OFFSET_Y;
window.ROOM_WIDTH = ROOM_TILES_X;
window.ROOM_HEIGHT = ROOM_TILES_Y;
window.TILE_SIZE = TILE_SIZE;
window.ENEMY_DATA = ENEMY_DATA;

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

window.addEventListener('load', function() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
});
