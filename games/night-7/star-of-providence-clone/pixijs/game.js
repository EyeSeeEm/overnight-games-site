// Star of Providence Clone - PixiJS
// Bullet-hell roguelike shooter with procedural floors

const APP_WIDTH = 800;
const APP_HEIGHT = 600;
const ROOM_WIDTH = 600;
const ROOM_HEIGHT = 450;

const app = new PIXI.Application({
    width: APP_WIDTH,
    height: APP_HEIGHT,
    backgroundColor: 0x0a0a15
});
document.body.appendChild(app.view);

// Game State
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    BOSS: 'boss',
    TRANSITION: 'transition',
    REWARD: 'reward',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// Weapons
const WEAPONS = {
    peashooter: { name: 'Peashooter', damage: 5, ammo: Infinity, fireRate: 6, velocity: 12, color: 0xffff00 },
    vulcan: { name: 'Vulcan', damage: 15, ammo: 500, fireRate: 8, velocity: 10, color: 0xff4444 },
    laser: { name: 'Laser', damage: 115, ammo: 100, fireRate: 40, velocity: 50, piercing: true, color: 0x44ffff },
    fireball: { name: 'Fireball', damage: 80, ammo: 90, fireRate: 50, velocity: 6, aoe: 40, color: 0xff8800 },
    revolver: { name: 'Revolver', damage: 28, ammo: 250, fireRate: 8, velocity: 9, color: 0xaaaaaa },
    sword: { name: 'Sword', damage: 70, ammo: 125, fireRate: 32, velocity: 0, melee: true, range: 50, color: 0x44ff44 }
};

// Keywords
const KEYWORDS = {
    homing: { name: 'Homing', dmgMod: 1.0, ammoMod: 1.0 },
    triple: { name: 'Triple', dmgMod: 0.5, ammoMod: 1.5 },
    high_caliber: { name: 'High-Caliber', dmgMod: 3.5, ammoMod: 0.56 }
};

// Enemies
const ENEMY_TYPES = {
    ghost: { name: 'Ghost', hp: 50, speed: 40, behavior: 'chase', color: 0x666699, attack: 'revenge' },
    drone: { name: 'Drone', hp: 70, speed: 80, behavior: 'dash', color: 0x446688, attack: 'spread' },
    turret: { name: 'Turret', hp: 90, speed: 0, behavior: 'stationary', color: 0x888844, attack: 'burst' },
    seeker: { name: 'Seeker', hp: 120, speed: 50, behavior: 'wander', color: 0x884488, attack: 'spread' },
    swarmer: { name: 'Swarmer', hp: 12, speed: 120, behavior: 'chase', color: 0xff4444, attack: 'contact' },
    blob: { name: 'Blob', hp: 150, speed: 35, behavior: 'bounce', color: 0x44aa44, attack: 'split' },
    pyromancer: { name: 'Pyromancer', hp: 110, speed: 30, behavior: 'wander', color: 0xff6600, attack: 'fireball' },
    hermit: { name: 'Hermit', hp: 125, speed: 15, behavior: 'stationary', color: 0x445566, attack: 'spawn' },
    bumper: { name: 'Bumper', hp: 120, speed: 70, behavior: 'bounce', color: 0x884444, attack: 'ring' }
};

// Boss definitions
const BOSSES = {
    chamberlord: { name: 'Chamberlord', hp: 1500, color: 0xaa8844 },
    wraithking: { name: 'Wraithking', hp: 2000, color: 0x6644aa },
    core_guardian: { name: 'Core Guardian', hp: 2500, color: 0x446688 }
};

// Containers
const gameContainer = new PIXI.Container();
const roomContainer = new PIXI.Container();
const entityContainer = new PIXI.Container();
const bulletContainer = new PIXI.Container();
const effectsContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();
const menuContainer = new PIXI.Container();

gameContainer.addChild(roomContainer);
gameContainer.addChild(bulletContainer);
gameContainer.addChild(entityContainer);
gameContainer.addChild(effectsContainer);
app.stage.addChild(gameContainer);
app.stage.addChild(uiContainer);
app.stage.addChild(menuContainer);

// Game variables
let state = GameState.MENU;
let player = null;
let enemies = [];
let playerBullets = [];
let enemyBullets = [];
let effects = [];
let pickups = [];
let floor = 1;
let currentRoom = null;
let floorMap = [];
let playerRoomX = 0;
let playerRoomY = 0;
let clearedRooms = new Set();
let multiplier = 1.0;
let debris = 0;

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false };
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; e.preventDefault(); });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
app.view.addEventListener('mousemove', (e) => {
    const rect = app.view.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
app.view.addEventListener('mousedown', () => { mouse.down = true; });
app.view.addEventListener('mouseup', () => { mouse.down = false; });

// Room offset (center the room)
const ROOM_OFFSET_X = (APP_WIDTH - ROOM_WIDTH) / 2;
const ROOM_OFFSET_Y = 50;

// Player Class
class Player {
    constructor() {
        this.x = ROOM_WIDTH / 2;
        this.y = ROOM_HEIGHT / 2;
        this.speed = 250;
        this.focusSpeed = 100;

        this.hp = 4;
        this.maxHp = 4;
        this.shields = 0;
        this.bombs = 2;
        this.maxBombs = 6;

        this.weapons = [
            { ...WEAPONS.peashooter, keyword: null, currentAmmo: Infinity },
            null
        ];
        this.currentWeapon = 0;
        this.fireCooldown = 0;
        this.damage = 1.0;

        this.dashCooldown = 0;
        this.dashDistance = 120;
        this.invincible = 0;
        this.focusing = false;

        this.sprite = new PIXI.Graphics();
        this.updateSprite();
        entityContainer.addChild(this.sprite);
    }

    updateSprite() {
        this.sprite.clear();
        // Ship body
        this.sprite.beginFill(0x44aaff);
        this.sprite.moveTo(0, -12);
        this.sprite.lineTo(10, 12);
        this.sprite.lineTo(-10, 12);
        this.sprite.closePath();
        this.sprite.endFill();

        // Focus hitbox indicator
        if (this.focusing) {
            this.sprite.beginFill(0xff4444);
            this.sprite.drawCircle(0, 0, 4);
            this.sprite.endFill();
        }
    }

    getWeapon() {
        return this.weapons[this.currentWeapon];
    }

    update(delta) {
        const dt = delta / 60;

        // Cooldowns
        if (this.fireCooldown > 0) this.fireCooldown -= delta;
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.invincible > 0) this.invincible -= dt;

        // Focus mode
        this.focusing = keys['shift'] || mouse.down && keys['control'];
        const currentSpeed = this.focusing ? this.focusSpeed : this.speed;

        // Movement
        let vx = 0, vy = 0;
        if (keys['w'] || keys['arrowup']) vy = -1;
        if (keys['s'] || keys['arrowdown']) vy = 1;
        if (keys['a'] || keys['arrowleft']) vx = -1;
        if (keys['d'] || keys['arrowright']) vx = 1;

        const len = Math.sqrt(vx * vx + vy * vy);
        if (len > 0) {
            vx /= len;
            vy /= len;
        }

        this.x += vx * currentSpeed * dt;
        this.y += vy * currentSpeed * dt;

        // Room bounds
        this.x = Math.max(15, Math.min(ROOM_WIDTH - 15, this.x));
        this.y = Math.max(15, Math.min(ROOM_HEIGHT - 15, this.y));

        // Dash
        if ((keys['z'] || keys['q']) && this.dashCooldown <= 0) {
            this.dash(vx || 0, vy || -1);
        }

        // Bomb
        if (keys['x'] && this.bombs > 0) {
            this.useBomb();
            keys['x'] = false;
        }

        // Fire
        if ((keys[' '] || mouse.down) && this.fireCooldown <= 0) {
            this.fire();
        }

        // Weapon switch
        if (keys['1']) this.currentWeapon = 0;
        if (keys['2'] && this.weapons[1]) this.currentWeapon = 1;

        // Update sprite
        this.sprite.x = this.x + ROOM_OFFSET_X;
        this.sprite.y = this.y + ROOM_OFFSET_Y;
        this.sprite.alpha = this.invincible > 0 ? 0.5 : 1;
        this.updateSprite();
    }

    fire() {
        const weapon = this.getWeapon();
        if (!weapon) return;
        if (weapon.currentAmmo <= 0) return;

        this.fireCooldown = weapon.fireRate;
        if (weapon.ammo !== Infinity) weapon.currentAmmo--;

        const keyword = weapon.keyword;
        let dmgMod = 1.0;
        let count = 1;
        let homing = false;

        if (keyword === 'homing') homing = true;
        if (keyword === 'triple') { count = 3; dmgMod = 0.5; }
        if (keyword === 'high_caliber') dmgMod = 3.5;

        const damage = weapon.damage * dmgMod * this.damage;

        if (weapon.melee) {
            // Sword attack
            createMeleeAttack(this.x, this.y - 20, damage, weapon.range);
        } else {
            // Projectile attack
            for (let i = 0; i < count; i++) {
                let angle = -Math.PI / 2; // Up
                if (count === 3) {
                    angle += (i - 1) * 0.2;
                }

                const bullet = new PlayerBullet(
                    this.x,
                    this.y - 10,
                    Math.cos(angle) * weapon.velocity,
                    Math.sin(angle) * weapon.velocity,
                    damage,
                    weapon.color,
                    weapon.piercing,
                    weapon.aoe,
                    homing
                );
                playerBullets.push(bullet);
            }
        }
    }

    dash(vx, vy) {
        this.dashCooldown = 0.5;
        this.invincible = 0.15;

        const len = Math.sqrt(vx * vx + vy * vy) || 1;
        const nx = this.x + (vx / len) * this.dashDistance;
        const ny = this.y + (vy / len) * this.dashDistance;

        this.x = Math.max(15, Math.min(ROOM_WIDTH - 15, nx));
        this.y = Math.max(15, Math.min(ROOM_HEIGHT - 15, ny));

        createDashEffect(this.x, this.y);
    }

    useBomb() {
        this.bombs--;
        this.invincible = 0.5;

        // Clear enemy bullets
        for (const b of enemyBullets) {
            bulletContainer.removeChild(b.sprite);
        }
        enemyBullets = [];

        // Damage all enemies
        for (const enemy of enemies) {
            enemy.takeDamage(50);
        }

        createBombEffect(this.x, this.y);
    }

    takeDamage() {
        if (this.invincible > 0) return;

        if (this.shields > 0) {
            this.shields--;
        } else {
            this.hp--;
        }

        this.invincible = 1.0;
        multiplier = Math.max(1.0, multiplier - 0.5);

        if (this.hp <= 0) {
            gameOver();
        }
    }

    pickupWeapon(weapon) {
        if (!this.weapons[1]) {
            this.weapons[1] = weapon;
        } else {
            // Replace current weapon
            this.weapons[this.currentWeapon] = weapon;
        }
    }
}

// Bullet classes
class PlayerBullet {
    constructor(x, y, vx, vy, damage, color, piercing = false, aoe = 0, homing = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.piercing = piercing;
        this.aoe = aoe;
        this.homing = homing;
        this.hit = [];

        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(color);
        this.sprite.drawCircle(0, 0, 4);
        this.sprite.endFill();
        bulletContainer.addChild(this.sprite);
    }

    update(delta) {
        const dt = delta / 60;

        // Homing
        if (this.homing && enemies.length > 0) {
            let closest = null;
            let closestDist = Infinity;
            for (const e of enemies) {
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = e;
                }
            }
            if (closest) {
                const dx = closest.x - this.x;
                const dy = closest.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    this.vx += (dx / dist) * 0.5;
                    this.vy += (dy / dist) * 0.5;
                    const newLen = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    this.vx = (this.vx / newLen) * speed;
                    this.vy = (this.vy / newLen) * speed;
                }
            }
        }

        this.x += this.vx * delta;
        this.y += this.vy * delta;

        this.sprite.x = this.x + ROOM_OFFSET_X;
        this.sprite.y = this.y + ROOM_OFFSET_Y;

        // Check enemy collision
        for (const enemy of enemies) {
            if (this.hit.includes(enemy)) continue;
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 20) {
                enemy.takeDamage(this.damage);
                this.hit.push(enemy);

                if (this.aoe > 0) {
                    createExplosion(this.x, this.y, this.aoe, this.damage * 0.5);
                }

                if (!this.piercing) {
                    return true; // Remove bullet
                }
            }
        }

        // Out of bounds
        if (this.x < -10 || this.x > ROOM_WIDTH + 10 || this.y < -10 || this.y > ROOM_HEIGHT + 10) {
            return true;
        }

        return false;
    }
}

class EnemyBullet {
    constructor(x, y, vx, vy, size = 6) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;

        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(0xff4444);
        this.sprite.drawCircle(0, 0, size);
        this.sprite.endFill();
        bulletContainer.addChild(this.sprite);
    }

    update(delta) {
        this.x += this.vx * delta;
        this.y += this.vy * delta;

        this.sprite.x = this.x + ROOM_OFFSET_X;
        this.sprite.y = this.y + ROOM_OFFSET_Y;

        // Player collision
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < (player.focusing ? 4 : 12) + this.size) {
            player.takeDamage();
            return true;
        }

        // Out of bounds
        if (this.x < -10 || this.x > ROOM_WIDTH + 10 || this.y < -10 || this.y > ROOM_HEIGHT + 10) {
            return true;
        }

        return false;
    }
}

// Enemy Class
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        const def = ENEMY_TYPES[type];

        this.name = def.name;
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.speed = def.speed;
        this.behavior = def.behavior;
        this.attack = def.attack;

        this.attackCooldown = 60 + Math.random() * 60;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;

        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(def.color);
        this.sprite.drawRect(-10, -10, 20, 20);
        this.sprite.endFill();
        entityContainer.addChild(this.sprite);
    }

    update(delta) {
        const dt = delta / 60;

        // Behavior
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        switch (this.behavior) {
            case 'chase':
                if (dist > 20) {
                    this.x += (dx / dist) * this.speed * dt;
                    this.y += (dy / dist) * this.speed * dt;
                }
                break;
            case 'wander':
                this.x += this.vx * this.speed * dt * 0.5;
                this.y += this.vy * this.speed * dt * 0.5;
                if (Math.random() < 0.02) {
                    this.vx = (Math.random() - 0.5) * 2;
                    this.vy = (Math.random() - 0.5) * 2;
                }
                break;
            case 'bounce':
                this.x += this.vx * this.speed * dt;
                this.y += this.vy * this.speed * dt;
                if (this.x < 20 || this.x > ROOM_WIDTH - 20) this.vx *= -1;
                if (this.y < 20 || this.y > ROOM_HEIGHT - 20) this.vy *= -1;
                break;
            case 'dash':
                if (Math.random() < 0.01) {
                    this.x += (dx / dist) * 100;
                    this.y += (dy / dist) * 100;
                }
                break;
        }

        // Stay in bounds
        this.x = Math.max(20, Math.min(ROOM_WIDTH - 20, this.x));
        this.y = Math.max(20, Math.min(ROOM_HEIGHT - 20, this.y));

        // Attack
        this.attackCooldown -= delta;
        if (this.attackCooldown <= 0) {
            this.doAttack();
            this.attackCooldown = 90 + Math.random() * 60;
        }

        // Contact damage (swarmer)
        if (this.attack === 'contact' && dist < 20) {
            player.takeDamage();
        }

        this.sprite.x = this.x + ROOM_OFFSET_X;
        this.sprite.y = this.y + ROOM_OFFSET_Y;
    }

    doAttack() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        switch (this.attack) {
            case 'spread':
                for (let i = -1; i <= 1; i++) {
                    const angle = Math.atan2(dy, dx) + i * 0.3;
                    enemyBullets.push(new EnemyBullet(this.x, this.y, Math.cos(angle) * 3, Math.sin(angle) * 3));
                }
                break;
            case 'burst':
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        if (enemies.includes(this)) {
                            const angle = Math.atan2(player.y - this.y, player.x - this.x);
                            enemyBullets.push(new EnemyBullet(this.x, this.y, Math.cos(angle) * 4, Math.sin(angle) * 4));
                        }
                    }, i * 100);
                }
                break;
            case 'fireball':
                enemyBullets.push(new EnemyBullet(this.x, this.y, (dx / dist) * 2, (dy / dist) * 2, 10));
                break;
            case 'ring':
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    enemyBullets.push(new EnemyBullet(this.x, this.y, Math.cos(angle) * 2, Math.sin(angle) * 2));
                }
                break;
            case 'spawn':
                if (enemies.length < 15) {
                    enemies.push(new Enemy(this.x + (Math.random() - 0.5) * 40, this.y + (Math.random() - 0.5) * 40, 'ghost'));
                }
                break;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        // Revenge attack (ghost)
        if (this.attack === 'revenge') {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            enemyBullets.push(new EnemyBullet(this.x, this.y, Math.cos(angle) * 3, Math.sin(angle) * 3));
        }

        // Ring on death (bumper)
        if (this.attack === 'ring') {
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                enemyBullets.push(new EnemyBullet(this.x, this.y, Math.cos(angle) * 2.5, Math.sin(angle) * 2.5));
            }
        }

        // Split (blob)
        if (this.type === 'blob' && this.maxHp > 50) {
            for (let i = 0; i < 2; i++) {
                const child = new Enemy(this.x + (Math.random() - 0.5) * 30, this.y + (Math.random() - 0.5) * 30, 'blob');
                child.hp = 50;
                child.maxHp = 50;
                enemies.push(child);
            }
        }

        // Multiplier and debris
        multiplier = Math.min(10, multiplier + 0.1);
        debris += Math.floor(10 * multiplier);

        // Pickup chance
        if (Math.random() < 0.1) {
            spawnPickup(this.x, this.y);
        }

        entityContainer.removeChild(this.sprite);
        enemies = enemies.filter(e => e !== this);
    }
}

// Boss Class
class Boss {
    constructor(type) {
        const def = BOSSES[type];
        this.type = type;
        this.name = def.name;
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.x = ROOM_WIDTH / 2;
        this.y = 100;
        this.phase = 1;
        this.attackCooldown = 120;
        this.invulnerable = 60;

        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(def.color);
        this.sprite.drawRect(-30, -30, 60, 60);
        this.sprite.endFill();
        entityContainer.addChild(this.sprite);
    }

    update(delta) {
        if (this.invulnerable > 0) {
            this.invulnerable -= delta;
            this.sprite.alpha = 0.5;
        } else {
            this.sprite.alpha = 1;
        }

        // Movement patterns by type
        switch (this.type) {
            case 'chamberlord':
                // Teleport to corners
                if (Math.random() < 0.005) {
                    const corners = [[100, 100], [ROOM_WIDTH - 100, 100], [100, 200], [ROOM_WIDTH - 100, 200]];
                    const corner = corners[Math.floor(Math.random() * corners.length)];
                    this.x = corner[0];
                    this.y = corner[1];
                }
                break;
            case 'wraithking':
                // Horizontal movement
                this.x += Math.sin(Date.now() / 1000) * 2;
                break;
            case 'core_guardian':
                // Stationary with rotation
                break;
        }

        // Attacks
        this.attackCooldown -= delta;
        if (this.attackCooldown <= 0 && this.invulnerable <= 0) {
            this.doAttack();
            this.attackCooldown = 60 + Math.random() * 60;
        }

        // Phase transitions
        if (this.hp < this.maxHp * 0.66 && this.phase === 1) {
            this.phase = 2;
            this.invulnerable = 60;
        }
        if (this.hp < this.maxHp * 0.33 && this.phase === 2) {
            this.phase = 3;
            this.invulnerable = 60;
        }

        this.sprite.x = this.x + ROOM_OFFSET_X;
        this.sprite.y = this.y + ROOM_OFFSET_Y;
    }

    doAttack() {
        const attackCount = this.phase;

        switch (this.type) {
            case 'chamberlord':
                // Spread shots
                for (let i = 0; i < 5 + this.phase * 2; i++) {
                    const angle = (i / (5 + this.phase * 2)) * Math.PI * 2;
                    enemyBullets.push(new EnemyBullet(this.x, this.y, Math.cos(angle) * 3, Math.sin(angle) * 3));
                }
                break;
            case 'wraithking':
                // Laser sweep (spawns line of bullets)
                for (let i = 0; i < ROOM_WIDTH; i += 30) {
                    enemyBullets.push(new EnemyBullet(i, this.y + 30, 0, 2));
                }
                // Spawn ghosts
                if (this.phase >= 2 && enemies.length < 5) {
                    enemies.push(new Enemy(this.x + 50, this.y, 'ghost'));
                    enemies.push(new Enemy(this.x - 50, this.y, 'ghost'));
                }
                break;
            case 'core_guardian':
                // Multi-phase bullet hell
                for (let i = 0; i < 8 * this.phase; i++) {
                    const angle = (i / (8 * this.phase)) * Math.PI * 2 + Date.now() / 500;
                    enemyBullets.push(new EnemyBullet(this.x, this.y, Math.cos(angle) * 2.5, Math.sin(angle) * 2.5));
                }
                break;
        }
    }

    takeDamage(amount) {
        if (this.invulnerable > 0) return;

        this.hp -= amount;

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        entityContainer.removeChild(this.sprite);
        showReward();
    }
}

let currentBoss = null;

// Effects
function createDashEffect(x, y) {
    const effect = new PIXI.Graphics();
    effect.beginFill(0x44aaff, 0.5);
    effect.drawCircle(0, 0, 20);
    effect.endFill();
    effect.x = x + ROOM_OFFSET_X;
    effect.y = y + ROOM_OFFSET_Y;
    effect.life = 0.2;
    effectsContainer.addChild(effect);
    effects.push(effect);
}

function createBombEffect(x, y) {
    const effect = new PIXI.Graphics();
    effect.beginFill(0xffff00, 0.5);
    effect.drawCircle(0, 0, 200);
    effect.endFill();
    effect.x = x + ROOM_OFFSET_X;
    effect.y = y + ROOM_OFFSET_Y;
    effect.life = 0.5;
    effectsContainer.addChild(effect);
    effects.push(effect);
}

function createMeleeAttack(x, y, damage, range) {
    const effect = new PIXI.Graphics();
    effect.beginFill(0x44ff44, 0.7);
    effect.arc(0, 0, range, -Math.PI * 0.6, Math.PI * 0.6);
    effect.lineTo(0, 0);
    effect.endFill();
    effect.x = x + ROOM_OFFSET_X;
    effect.y = y + ROOM_OFFSET_Y;
    effect.rotation = -Math.PI / 2;
    effect.life = 0.15;
    effectsContainer.addChild(effect);
    effects.push(effect);

    // Damage enemies in range
    for (const enemy of enemies) {
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < range && dy < 0) {
            enemy.takeDamage(damage);
        }
    }
}

function createExplosion(x, y, radius, damage) {
    const effect = new PIXI.Graphics();
    effect.beginFill(0xff8800, 0.7);
    effect.drawCircle(0, 0, radius);
    effect.endFill();
    effect.x = x + ROOM_OFFSET_X;
    effect.y = y + ROOM_OFFSET_Y;
    effect.life = 0.3;
    effectsContainer.addChild(effect);
    effects.push(effect);

    for (const enemy of enemies) {
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius) {
            enemy.takeDamage(damage);
        }
    }
}

function updateEffects(delta) {
    const dt = delta / 60;
    for (let i = effects.length - 1; i >= 0; i--) {
        effects[i].life -= dt;
        effects[i].alpha = effects[i].life * 2;
        if (effects[i].life <= 0) {
            effectsContainer.removeChild(effects[i]);
            effects.splice(i, 1);
        }
    }
}

// Pickups
function spawnPickup(x, y) {
    const types = ['health', 'ammo', 'weapon'];
    const type = types[Math.floor(Math.random() * types.length)];

    const pickup = {
        x, y, type,
        sprite: new PIXI.Graphics()
    };

    if (type === 'health') {
        pickup.sprite.beginFill(0xff4444);
        pickup.sprite.drawRect(-6, -6, 12, 12);
    } else if (type === 'ammo') {
        pickup.sprite.beginFill(0xffff44);
        pickup.sprite.drawRect(-5, -8, 10, 16);
    } else {
        pickup.sprite.beginFill(0x44ffff);
        pickup.sprite.drawPolygon([0, -10, 10, 10, -10, 10]);
    }
    pickup.sprite.endFill();
    pickup.sprite.x = x + ROOM_OFFSET_X;
    pickup.sprite.y = y + ROOM_OFFSET_Y;

    entityContainer.addChild(pickup.sprite);
    pickups.push(pickup);
}

function checkPickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 20) {
            if (p.type === 'health' && player.hp < player.maxHp) {
                player.hp++;
            } else if (p.type === 'ammo') {
                const w = player.getWeapon();
                if (w && w.ammo !== Infinity) {
                    w.currentAmmo = Math.min(w.ammo, w.currentAmmo + Math.floor(w.ammo * 0.25));
                }
            } else if (p.type === 'weapon') {
                const weaponKeys = Object.keys(WEAPONS).filter(k => k !== 'peashooter');
                const randomWeapon = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
                const keywords = Object.keys(KEYWORDS);
                const keyword = Math.random() < 0.5 ? keywords[Math.floor(Math.random() * keywords.length)] : null;

                player.pickupWeapon({
                    ...WEAPONS[randomWeapon],
                    keyword,
                    currentAmmo: WEAPONS[randomWeapon].ammo
                });
            }

            entityContainer.removeChild(p.sprite);
            pickups.splice(i, 1);
        }
    }
}

// Floor/Room Generation
function generateFloor() {
    floorMap = [];
    const size = 3 + floor;
    clearedRooms.clear();

    for (let y = 0; y < size; y++) {
        floorMap[y] = [];
        for (let x = 0; x < size; x++) {
            if (Math.random() < 0.7 || (x === Math.floor(size / 2) && y === Math.floor(size / 2))) {
                floorMap[y][x] = { type: 'normal', cleared: false };
            } else {
                floorMap[y][x] = null;
            }
        }
    }

    // Start room
    playerRoomX = Math.floor(size / 2);
    playerRoomY = Math.floor(size / 2);
    floorMap[playerRoomY][playerRoomX] = { type: 'start', cleared: true };
    clearedRooms.add(`${playerRoomX},${playerRoomY}`);

    // Boss room (far corner)
    let bossX = size - 1, bossY = size - 1;
    while (!floorMap[bossY] || !floorMap[bossY][bossX]) {
        bossX--;
        if (bossX < 0) { bossX = size - 1; bossY--; }
    }
    floorMap[bossY][bossX] = { type: 'boss', cleared: false };

    loadRoom(playerRoomX, playerRoomY);
}

function loadRoom(roomX, roomY) {
    // Clear entities
    for (const e of enemies) entityContainer.removeChild(e.sprite);
    for (const b of playerBullets) bulletContainer.removeChild(b.sprite);
    for (const b of enemyBullets) bulletContainer.removeChild(b.sprite);
    for (const p of pickups) entityContainer.removeChild(p.sprite);

    enemies = [];
    playerBullets = [];
    enemyBullets = [];
    pickups = [];

    currentRoom = floorMap[roomY][roomX];
    playerRoomX = roomX;
    playerRoomY = roomY;

    // Draw room
    roomContainer.removeChildren();

    const roomBg = new PIXI.Graphics();
    roomBg.beginFill(0x1a1a25);
    roomBg.drawRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH, ROOM_HEIGHT);
    roomBg.endFill();
    roomBg.lineStyle(2, 0x333344);
    roomBg.drawRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH, ROOM_HEIGHT);
    roomContainer.addChild(roomBg);

    // Draw doors
    const checkRoom = (x, y) => floorMap[y] && floorMap[y][x];
    if (checkRoom(roomX, roomY - 1)) drawDoor('north');
    if (checkRoom(roomX, roomY + 1)) drawDoor('south');
    if (checkRoom(roomX - 1, roomY)) drawDoor('west');
    if (checkRoom(roomX + 1, roomY)) drawDoor('east');

    // Spawn enemies if not cleared and not start
    if (!currentRoom.cleared && currentRoom.type !== 'start') {
        if (currentRoom.type === 'boss') {
            state = GameState.BOSS;
            const bossTypes = ['chamberlord', 'wraithking', 'core_guardian'];
            currentBoss = new Boss(bossTypes[floor - 1]);
        } else {
            const enemyTypes = Object.keys(ENEMY_TYPES);
            const count = 3 + floor * 2;
            for (let i = 0; i < count; i++) {
                const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
                const ex = 50 + Math.random() * (ROOM_WIDTH - 100);
                const ey = 50 + Math.random() * (ROOM_HEIGHT - 100);
                enemies.push(new Enemy(ex, ey, type));
            }
        }
    }
}

function drawDoor(direction) {
    const door = new PIXI.Graphics();
    door.beginFill(0x444466);

    switch (direction) {
        case 'north':
            door.drawRect(ROOM_OFFSET_X + ROOM_WIDTH / 2 - 20, ROOM_OFFSET_Y - 5, 40, 10);
            break;
        case 'south':
            door.drawRect(ROOM_OFFSET_X + ROOM_WIDTH / 2 - 20, ROOM_OFFSET_Y + ROOM_HEIGHT - 5, 40, 10);
            break;
        case 'west':
            door.drawRect(ROOM_OFFSET_X - 5, ROOM_OFFSET_Y + ROOM_HEIGHT / 2 - 20, 10, 40);
            break;
        case 'east':
            door.drawRect(ROOM_OFFSET_X + ROOM_WIDTH - 5, ROOM_OFFSET_Y + ROOM_HEIGHT / 2 - 20, 10, 40);
            break;
    }
    door.endFill();
    roomContainer.addChild(door);
}

function checkRoomTransition() {
    if (enemies.length > 0 || (state === GameState.BOSS && currentBoss)) return;

    // Mark room cleared
    if (!currentRoom.cleared) {
        currentRoom.cleared = true;
        clearedRooms.add(`${playerRoomX},${playerRoomY}`);
    }

    const checkRoom = (x, y) => floorMap[y] && floorMap[y][x];

    // North
    if (player.y < 20 && checkRoom(playerRoomX, playerRoomY - 1)) {
        loadRoom(playerRoomX, playerRoomY - 1);
        player.y = ROOM_HEIGHT - 30;
    }
    // South
    if (player.y > ROOM_HEIGHT - 20 && checkRoom(playerRoomX, playerRoomY + 1)) {
        loadRoom(playerRoomX, playerRoomY + 1);
        player.y = 30;
    }
    // West
    if (player.x < 20 && checkRoom(playerRoomX - 1, playerRoomY)) {
        loadRoom(playerRoomX - 1, playerRoomY);
        player.x = ROOM_WIDTH - 30;
    }
    // East
    if (player.x > ROOM_WIDTH - 20 && checkRoom(playerRoomX + 1, playerRoomY)) {
        loadRoom(playerRoomX + 1, playerRoomY);
        player.x = 30;
    }
}

// Reward screen
function showReward() {
    state = GameState.REWARD;

    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.7);
    overlay.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
    overlay.endFill();
    uiContainer.addChild(overlay);

    const title = new PIXI.Text(`FLOOR ${floor} CLEAR!`, { fontSize: 28, fill: 0x44ff44 });
    title.anchor.set(0.5);
    title.x = APP_WIDTH / 2;
    title.y = 200;
    uiContainer.addChild(title);

    const choice1 = new PIXI.Text('[1] +2 Max HP', { fontSize: 18, fill: 0xff4444 });
    choice1.x = 250;
    choice1.y = 300;
    uiContainer.addChild(choice1);

    const choice2 = new PIXI.Text('[2] +10% Damage', { fontSize: 18, fill: 0xffff44 });
    choice2.x = 450;
    choice2.y = 300;
    uiContainer.addChild(choice2);

    const cont = new PIXI.Text('Press 1 or 2 to choose', { fontSize: 14, fill: 0x888888 });
    cont.anchor.set(0.5);
    cont.x = APP_WIDTH / 2;
    cont.y = 400;
    uiContainer.addChild(cont);
}

function selectReward(choice) {
    if (choice === 1) {
        player.maxHp += 2;
        player.hp = player.maxHp;
    } else {
        player.damage += 0.1;
    }

    uiContainer.removeChildren();
    createUI();

    floor++;
    if (floor > 3) {
        victory();
    } else {
        state = GameState.PLAYING;
        currentBoss = null;
        generateFloor();
        player.x = ROOM_WIDTH / 2;
        player.y = ROOM_HEIGHT / 2;
    }
}

// UI
function createUI() {
    uiContainer.removeChildren();

    // Top bar background
    const topBar = new PIXI.Graphics();
    topBar.beginFill(0x111122);
    topBar.drawRect(0, 0, APP_WIDTH, 45);
    topBar.endFill();
    uiContainer.addChild(topBar);

    // Bottom bar
    const bottomBar = new PIXI.Graphics();
    bottomBar.beginFill(0x111122);
    bottomBar.drawRect(0, APP_HEIGHT - 50, APP_WIDTH, 50);
    bottomBar.endFill();
    uiContainer.addChild(bottomBar);
}

function updateUI() {
    // Redraw dynamic elements
    const graphics = uiContainer.children.find(c => c.isDynamic);
    if (graphics) uiContainer.removeChild(graphics);

    const dynamic = new PIXI.Graphics();
    dynamic.isDynamic = true;

    // HP hearts
    for (let i = 0; i < player.maxHp; i++) {
        dynamic.beginFill(i < player.hp ? 0xff4444 : 0x442222);
        dynamic.drawRect(15 + i * 22, 10, 18, 18);
        dynamic.endFill();
    }

    // Shields
    for (let i = 0; i < player.shields; i++) {
        dynamic.beginFill(0x4444ff);
        dynamic.drawRect(15 + (player.maxHp + i) * 22, 10, 18, 18);
        dynamic.endFill();
    }

    // Bombs
    for (let i = 0; i < player.maxBombs; i++) {
        dynamic.beginFill(i < player.bombs ? 0xffff44 : 0x444422);
        dynamic.drawCircle(APP_WIDTH - 30 - i * 22, 22, 8);
        dynamic.endFill();
    }

    uiContainer.addChild(dynamic);

    // Text elements (recreate each frame for simplicity)
    while (uiContainer.children.length > 3) {
        uiContainer.removeChildAt(3);
    }
    uiContainer.addChild(dynamic);

    const weapon = player.getWeapon();
    const weaponText = new PIXI.Text(
        `${weapon.name}${weapon.keyword ? ' (' + KEYWORDS[weapon.keyword].name + ')' : ''} - ${weapon.currentAmmo === Infinity ? 'INF' : weapon.currentAmmo}`,
        { fontSize: 12, fill: 0xaaaaaa }
    );
    weaponText.x = 15;
    weaponText.y = 30;
    uiContainer.addChild(weaponText);

    const floorText = new PIXI.Text(`Floor ${floor}`, { fontSize: 12, fill: 0x888888 });
    floorText.x = 15;
    floorText.y = APP_HEIGHT - 35;
    uiContainer.addChild(floorText);

    const debrisText = new PIXI.Text(`Debris: ${debris}`, { fontSize: 12, fill: 0xffff44 });
    debrisText.x = 120;
    debrisText.y = APP_HEIGHT - 35;
    uiContainer.addChild(debrisText);

    const multText = new PIXI.Text(`x${multiplier.toFixed(1)}`, { fontSize: 14, fill: 0x44ff44 });
    multText.x = 250;
    multText.y = APP_HEIGHT - 35;
    uiContainer.addChild(multText);

    // Boss HP bar
    if (state === GameState.BOSS && currentBoss) {
        const bossBar = new PIXI.Graphics();
        bossBar.beginFill(0x440000);
        bossBar.drawRect(100, APP_HEIGHT - 20, 600, 12);
        bossBar.endFill();
        bossBar.beginFill(0xff4444);
        bossBar.drawRect(100, APP_HEIGHT - 20, 600 * (currentBoss.hp / currentBoss.maxHp), 12);
        bossBar.endFill();
        uiContainer.addChild(bossBar);

        const bossName = new PIXI.Text(currentBoss.name, { fontSize: 12, fill: 0xffffff });
        bossName.x = 350;
        bossName.y = APP_HEIGHT - 20;
        uiContainer.addChild(bossName);
    }

    // Minimap
    drawMinimap();
}

function drawMinimap() {
    const minimap = new PIXI.Graphics();
    const mapX = APP_WIDTH - 100;
    const mapY = APP_HEIGHT - 45;
    const cellSize = 10;

    for (let y = 0; y < floorMap.length; y++) {
        for (let x = 0; x < floorMap[y].length; x++) {
            const room = floorMap[y][x];
            if (room) {
                let color = 0x333344;
                if (room.type === 'boss') color = 0xff4444;
                if (room.type === 'start') color = 0x44ff44;
                if (x === playerRoomX && y === playerRoomY) color = 0x44aaff;
                if (room.cleared && x !== playerRoomX && y !== playerRoomY) color = 0x222233;

                minimap.beginFill(color);
                minimap.drawRect(mapX + x * cellSize, mapY + y * cellSize, cellSize - 1, cellSize - 1);
                minimap.endFill();
            }
        }
    }
    uiContainer.addChild(minimap);
}

// Game Over / Victory
function gameOver() {
    state = GameState.GAME_OVER;

    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.8);
    overlay.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
    overlay.endFill();
    uiContainer.addChild(overlay);

    const text = new PIXI.Text('GAME OVER', { fontSize: 48, fill: 0xff4444 });
    text.anchor.set(0.5);
    text.x = APP_WIDTH / 2;
    text.y = APP_HEIGHT / 2 - 50;
    uiContainer.addChild(text);

    const score = new PIXI.Text(`Final Score: ${debris}`, { fontSize: 20, fill: 0xffffff });
    score.anchor.set(0.5);
    score.x = APP_WIDTH / 2;
    score.y = APP_HEIGHT / 2 + 20;
    uiContainer.addChild(score);

    const restart = new PIXI.Text('Press SPACE to restart', { fontSize: 16, fill: 0x888888 });
    restart.anchor.set(0.5);
    restart.x = APP_WIDTH / 2;
    restart.y = APP_HEIGHT / 2 + 80;
    uiContainer.addChild(restart);
}

function victory() {
    state = GameState.VICTORY;

    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.8);
    overlay.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
    overlay.endFill();
    uiContainer.addChild(overlay);

    const text = new PIXI.Text('VICTORY!', { fontSize: 48, fill: 0x44ff44 });
    text.anchor.set(0.5);
    text.x = APP_WIDTH / 2;
    text.y = APP_HEIGHT / 2 - 50;
    uiContainer.addChild(text);

    const sub = new PIXI.Text('You have conquered the facility!', { fontSize: 18, fill: 0xffffff });
    sub.anchor.set(0.5);
    sub.x = APP_WIDTH / 2;
    sub.y = APP_HEIGHT / 2;
    uiContainer.addChild(sub);

    const score = new PIXI.Text(`Final Score: ${debris}`, { fontSize: 20, fill: 0xffff44 });
    score.anchor.set(0.5);
    score.x = APP_WIDTH / 2;
    score.y = APP_HEIGHT / 2 + 50;
    uiContainer.addChild(score);

    const restart = new PIXI.Text('Press SPACE to play again', { fontSize: 16, fill: 0x888888 });
    restart.anchor.set(0.5);
    restart.x = APP_WIDTH / 2;
    restart.y = APP_HEIGHT / 2 + 100;
    uiContainer.addChild(restart);
}

// Menu
function createMenu() {
    menuContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x0a0a15);
    bg.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('STAR OF PROVIDENCE', { fontSize: 36, fill: 0x44aaff, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = APP_WIDTH / 2;
    title.y = 120;
    menuContainer.addChild(title);

    const sub = new PIXI.Text('Bullet Hell Roguelike', { fontSize: 18, fill: 0x668899 });
    sub.anchor.set(0.5);
    sub.x = APP_WIDTH / 2;
    sub.y = 160;
    menuContainer.addChild(sub);

    const instructions = [
        "WASD / Arrows - Move",
        "SHIFT - Focus Mode (precise dodging)",
        "SPACE / Click - Fire",
        "Z / Q - Dash (i-frames)",
        "X - Bomb (clears bullets)",
        "1 / 2 - Switch weapons",
        "",
        "Clear all rooms to unlock the boss.",
        "Defeat 3 floor bosses to win!"
    ];

    instructions.forEach((line, idx) => {
        const text = new PIXI.Text(line, { fontSize: 14, fill: 0xaaaaaa });
        text.anchor.set(0.5);
        text.x = APP_WIDTH / 2;
        text.y = 230 + idx * 24;
        menuContainer.addChild(text);
    });

    const start = new PIXI.Text('Press SPACE to start', { fontSize: 20, fill: 0x44ff44 });
    start.anchor.set(0.5);
    start.x = APP_WIDTH / 2;
    start.y = 520;
    menuContainer.addChild(start);
}

function startGame() {
    menuContainer.visible = false;
    state = GameState.PLAYING;
    floor = 1;
    debris = 0;
    multiplier = 1.0;

    player = new Player();
    generateFloor();
    createUI();
}

// Main loop
app.ticker.add((delta) => {
    if (state === GameState.MENU) {
        if (keys[' ']) {
            startGame();
        }
        return;
    }

    if (state === GameState.GAME_OVER || state === GameState.VICTORY) {
        if (keys[' ']) {
            location.reload();
        }
        return;
    }

    if (state === GameState.REWARD) {
        if (keys['1']) selectReward(1);
        if (keys['2']) selectReward(2);
        return;
    }

    if (state === GameState.PLAYING || state === GameState.BOSS) {
        player.update(delta);

        // Update enemies
        for (const enemy of enemies) {
            enemy.update(delta);
        }

        // Update boss
        if (currentBoss) {
            currentBoss.update(delta);

            // Check player bullets hitting boss
            for (let i = playerBullets.length - 1; i >= 0; i--) {
                const b = playerBullets[i];
                const dx = currentBoss.x - b.x;
                const dy = currentBoss.y - b.y;
                if (Math.sqrt(dx * dx + dy * dy) < 40) {
                    currentBoss.takeDamage(b.damage);
                    bulletContainer.removeChild(b.sprite);
                    playerBullets.splice(i, 1);
                }
            }
        }

        // Update player bullets
        for (let i = playerBullets.length - 1; i >= 0; i--) {
            if (playerBullets[i].update(delta)) {
                bulletContainer.removeChild(playerBullets[i].sprite);
                playerBullets.splice(i, 1);
            }
        }

        // Update enemy bullets
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            if (enemyBullets[i].update(delta)) {
                bulletContainer.removeChild(enemyBullets[i].sprite);
                enemyBullets.splice(i, 1);
            }
        }

        updateEffects(delta);
        checkPickups();
        checkRoomTransition();
        updateUI();

        // Multiplier decay
        multiplier = Math.max(1.0, multiplier - 0.001 * delta);
    }
});

// Initialize
createMenu();
