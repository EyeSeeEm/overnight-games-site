// Star of Providence Clone - Bullet Hell Roguelike
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 16;
const ROOM_WIDTH = 15;
const ROOM_HEIGHT = 11;
const ROOM_PIXEL_WIDTH = ROOM_WIDTH * TILE_SIZE * 2;
const ROOM_PIXEL_HEIGHT = ROOM_HEIGHT * TILE_SIZE * 2;
const UI_HEIGHT = 60;
const PLAY_AREA_Y = UI_HEIGHT;

// Colors (from reference)
const COLORS = {
    bg: '#0d0d15',
    bgDark: '#08080c',
    wall: '#5a4a3a',
    wallDark: '#3d3228',
    wallLight: '#7a6a5a',
    floor: '#1a1520',
    floorPattern: '#251a25',
    ui: '#00ff00',
    uiDark: '#008800',
    uiBorder: '#00cc00',
    health: '#00ff88',
    healthEmpty: '#333333',
    shield: '#00ccff',
    bomb: '#ffaa00',
    player: '#ffffff',
    playerGlow: '#aaccff',
    bullet: '#ffff00',
    bulletEnemy: '#ff4444',
    bulletHoming: '#44ff44',
    enemyGhost: '#8866aa',
    enemyDrone: '#888888',
    enemyTurret: '#666666',
    enemySeeker: '#aa8844',
    enemySwarmer: '#ff6666',
    enemyBlob: '#66aa66',
    enemyPyro: '#ff8844',
    enemyHermit: '#665588',
    enemyBumper: '#cc8844',
    fireball: '#ff6622',
    fireballCore: '#ffcc44',
    debris: '#88ff88',
    door: '#448844',
    doorLocked: '#884444',
    bossHealth: '#ff4444',
    multiplier: '#ffff00',
    currency: '#88ff88'
};

// Game state
let gameState = 'menu';
let player = null;
let enemies = [];
let bullets = [];
let pickups = [];
let particles = [];
let floatingTexts = [];
let currentFloor = 1;
let currentRoom = { x: 2, y: 2 };
let floorMap = [];
let rooms = {};
let debris = 0;
let multiplier = 1.0;
let multiplierTimer = 0;
let roomsCleared = 0;
let bossDefeated = false;
let debugMode = false;
let frameCount = 0;
let lastTime = performance.now();
let fps = 60;
let screenShake = 0;
let salvageSelection = null;
let killCount = 0;
let totalKills = 0;
let roomStartTime = 0;

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false };

// Weapon definitions
const WEAPONS = {
    peashooter: {
        name: 'Peashooter', damage: 5, ammo: Infinity, fireRate: 6,
        velocity: 12, color: '#ffff44', size: 3, sound: 'pew'
    },
    vulcan: {
        name: 'Vulcan', damage: 15, ammo: 500, fireRate: 4,
        velocity: 10, color: '#ff8844', size: 2, spread: 5, sound: 'ratata'
    },
    laser: {
        name: 'Laser', damage: 115, ammo: 100, fireRate: 40,
        velocity: Infinity, color: '#ff0044', size: 4, pierce: true, sound: 'zap'
    },
    fireball: {
        name: 'Fireball', damage: 80, ammo: 90, fireRate: 50,
        velocity: 6, color: '#ff6622', size: 8, aoe: 40, sound: 'fwoosh'
    },
    revolver: {
        name: 'Revolver', damage: 28, ammo: 250, fireRate: 8,
        velocity: 9, color: '#ffffff', size: 4, clipSize: 6, reloadTime: 45, sound: 'bang'
    },
    sword: {
        name: 'Sword', damage: 70, ammo: 125, fireRate: 32,
        velocity: 0, color: '#aaaaff', size: 24, melee: true, sound: 'slash'
    }
};

// Keyword modifiers
const KEYWORDS = {
    homing: { damageMultiplier: 1.0, ammoMultiplier: 1.0, effect: 'homing' },
    triple: { damageMultiplier: 0.5, ammoMultiplier: 1.5, effect: 'triple' },
    highCaliber: { damageMultiplier: 3.5, ammoMultiplier: 0.56, fireRateMultiplier: 3.25, effect: 'highCaliber' }
};

// Enemy definitions
const ENEMY_TYPES = {
    ghost: { hp: 50, speed: 1, color: COLORS.enemyGhost, size: 12, behavior: 'chase', reward: 10 },
    crazyGhost: { hp: 100, speed: 3, color: '#aa88cc', size: 14, behavior: 'dash', reward: 25 },
    drone: { hp: 70, speed: 2.5, color: COLORS.enemyDrone, size: 10, behavior: 'dash', shoots: true, reward: 20 },
    turret: { hp: 90, speed: 0, color: COLORS.enemyTurret, size: 16, behavior: 'stationary', shoots: true, reward: 15 },
    seeker: { hp: 120, speed: 1.5, color: COLORS.enemySeeker, size: 14, behavior: 'wander', shoots: true, reward: 30 },
    swarmer: { hp: 12, speed: 4, color: COLORS.enemySwarmer, size: 6, behavior: 'chase', contact: true, reward: 5 },
    blob: { hp: 150, speed: 0.8, color: COLORS.enemyBlob, size: 20, behavior: 'bounce', splits: true, reward: 35 },
    pyromancer: { hp: 110, speed: 0.8, color: COLORS.enemyPyro, size: 14, behavior: 'wander', shootsFireball: true, reward: 40 },
    hermit: { hp: 125, speed: 0.3, color: COLORS.enemyHermit, size: 18, behavior: 'wander', spawnsGhosts: true, reward: 50 },
    bumper: { hp: 120, speed: 2, color: COLORS.enemyBumper, size: 16, behavior: 'bounce', ringOnDeath: true, reward: 30 }
};

// Boss definitions
const BOSSES = {
    chamberlord: {
        name: 'Chamberlord', hp: 1500, size: 48, color: '#aa6644',
        floor: 1, phases: 3, reward: { hp: 2, damage: 5 }
    },
    wraithking: {
        name: 'Wraithking', hp: 2000, size: 56, color: '#6644aa',
        floor: 2, phases: 3, reward: { hp: 2, damage: 5 }
    },
    coreGuardian: {
        name: 'Core Guardian', hp: 2500, size: 64, color: '#446688',
        floor: 3, phases: 4, reward: { hp: 2, damage: 5 }
    }
};

// Player class
class Player {
    constructor() {
        this.x = 400;
        this.y = 350;
        this.size = 12;
        this.speed = 250;
        this.focusSpeed = 100;
        this.maxHp = 4;
        this.hp = 4;
        this.shields = 0;
        this.maxShields = 0;
        this.bombs = 2;
        this.maxBombs = 6;
        this.weapon = 'peashooter';
        this.weaponKeyword = null;
        this.ammo = {};
        this.damageBonus = 0;
        this.fireTimer = 0;
        this.dashCooldown = 0;
        this.dashTimer = 0;
        this.dashing = false;
        this.dashDirX = 0;
        this.dashDirY = 0;
        this.invincible = 0;
        this.clipAmmo = 6;
        this.reloading = 0;
        this.angle = -Math.PI / 2;

        // Initialize ammo for all weapons
        Object.keys(WEAPONS).forEach(w => {
            this.ammo[w] = WEAPONS[w].ammo;
        });
    }

    update(dt) {
        if (this.fireTimer > 0) this.fireTimer -= dt * 60;
        if (this.dashCooldown > 0) this.dashCooldown -= dt * 60;
        if (this.invincible > 0) this.invincible -= dt * 60;
        if (this.reloading > 0) this.reloading -= dt * 60;

        // Handle dashing
        if (this.dashing) {
            this.dashTimer -= dt * 60;
            this.x += this.dashDirX * 8;
            this.y += this.dashDirY * 8;
            if (this.dashTimer <= 0) {
                this.dashing = false;
            }
            return;
        }

        // Movement
        let dx = 0, dy = 0;
        if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
        if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
        if (keys['KeyD'] || keys['ArrowRight']) dx = 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;

            const focusing = keys['ShiftLeft'] || keys['ShiftRight'] || mouse.right;
            const speed = focusing ? this.focusSpeed : this.speed;

            this.x += dx * speed * dt;
            this.y += dy * speed * dt;

            if (dx !== 0 || dy !== 0) {
                this.angle = Math.atan2(dy, dx);
            }
        }

        // Clamp to play area (allow reaching edges for room transitions)
        const margin = this.size;
        this.x = Math.max(margin, Math.min(canvas.width - margin, this.x));
        this.y = Math.max(PLAY_AREA_Y + margin, Math.min(canvas.height - margin, this.y));

        // Aim at mouse
        const aimDx = mouse.x - this.x;
        const aimDy = mouse.y - this.y;
        if (aimDx !== 0 || aimDy !== 0) {
            this.angle = Math.atan2(aimDy, aimDx);
        }

        // Dash
        if ((keys['KeyZ'] || keys['KeyQ']) && this.dashCooldown <= 0) {
            this.dash(dx || Math.cos(this.angle), dy || Math.sin(this.angle));
        }

        // Shoot
        if ((keys['Space'] || mouse.down) && this.fireTimer <= 0 && this.reloading <= 0) {
            this.shoot();
        }

        // Bomb
        if (keys['KeyX'] && this.bombs > 0) {
            this.useBomb();
            keys['KeyX'] = false;
        }
    }

    dash(dx, dy) {
        if (dx === 0 && dy === 0) {
            dx = Math.cos(this.angle);
            dy = Math.sin(this.angle);
        }
        const len = Math.sqrt(dx * dx + dy * dy);
        this.dashDirX = dx / len;
        this.dashDirY = dy / len;
        this.dashing = true;
        this.dashTimer = 15;
        this.dashCooldown = 30;
        this.invincible = Math.max(this.invincible, 9);

        // Dash particles
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: this.x, y: this.y,
                vx: -this.dashDirX * 2 + (Math.random() - 0.5),
                vy: -this.dashDirY * 2 + (Math.random() - 0.5),
                life: 20, maxLife: 20,
                color: COLORS.playerGlow, size: 4
            });
        }
    }

    shoot() {
        const weapon = WEAPONS[this.weapon];
        const keyword = this.weaponKeyword ? KEYWORDS[this.weaponKeyword] : null;

        // Check ammo
        if (weapon.ammo !== Infinity) {
            if (this.ammo[this.weapon] <= 0) return;
            this.ammo[this.weapon]--;
        }

        // Revolver clip
        if (this.weapon === 'revolver') {
            this.clipAmmo--;
            if (this.clipAmmo <= 0) {
                this.reloading = weapon.reloadTime;
                this.clipAmmo = weapon.clipSize;
            }
        }

        let fireRate = weapon.fireRate;
        if (keyword && keyword.fireRateMultiplier) {
            fireRate *= keyword.fireRateMultiplier;
        }
        this.fireTimer = fireRate;

        let damage = weapon.damage * (1 + this.damageBonus / 100);
        if (keyword) damage *= keyword.damageMultiplier;

        const bulletCount = keyword && keyword.effect === 'triple' ? 3 : 1;
        const spreadAngle = keyword && keyword.effect === 'triple' ? 0.2 : 0;

        // Weapon spread
        const baseSpread = weapon.spread ? (Math.random() - 0.5) * weapon.spread * Math.PI / 180 : 0;

        for (let i = 0; i < bulletCount; i++) {
            let angle = this.angle + baseSpread;
            if (bulletCount > 1) {
                angle += (i - 1) * spreadAngle;
            }

            if (weapon.melee) {
                // Sword - melee cone attack
                for (let e of enemies) {
                    const dx = e.x - this.x;
                    const dy = e.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const enemyAngle = Math.atan2(dy, dx);
                    let angleDiff = Math.abs(enemyAngle - this.angle);
                    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

                    if (dist < weapon.size * 2 && angleDiff < Math.PI / 3) {
                        damageEnemy(e, damage);
                    }
                }
                // Sword swing visual
                for (let j = 0; j < 8; j++) {
                    const swingAngle = this.angle - Math.PI / 4 + j * Math.PI / 16;
                    particles.push({
                        x: this.x + Math.cos(swingAngle) * weapon.size,
                        y: this.y + Math.sin(swingAngle) * weapon.size,
                        vx: Math.cos(swingAngle) * 2,
                        vy: Math.sin(swingAngle) * 2,
                        life: 10, maxLife: 10,
                        color: weapon.color, size: 3
                    });
                }
            } else if (weapon.velocity === Infinity) {
                // Laser - instant hit
                const endX = this.x + Math.cos(angle) * 800;
                const endY = this.y + Math.sin(angle) * 800;

                for (let e of enemies) {
                    const dist = pointToLineDistance(e.x, e.y, this.x, this.y, endX, endY);
                    if (dist < e.size) {
                        damageEnemy(e, damage);
                        if (!weapon.pierce) break;
                    }
                }

                // Laser visual
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle), vy: Math.sin(angle),
                    damage: 0, size: weapon.size, color: weapon.color,
                    friendly: true, laser: true, life: 5
                });
            } else {
                // Normal bullet
                const bullet = {
                    x: this.x + Math.cos(angle) * this.size,
                    y: this.y + Math.sin(angle) * this.size,
                    vx: Math.cos(angle) * weapon.velocity,
                    vy: Math.sin(angle) * weapon.velocity,
                    damage: damage,
                    size: weapon.size,
                    color: weapon.color,
                    friendly: true,
                    homing: keyword && keyword.effect === 'homing',
                    aoe: weapon.aoe || 0,
                    pierce: weapon.pierce || false,
                    life: 120
                };

                if (this.weapon === 'fireball') {
                    bullet.fireball = true;
                    bullet.trail = true;
                }

                bullets.push(bullet);
            }
        }
    }

    useBomb() {
        this.bombs--;
        screenShake = 15;

        // Clear all enemy bullets
        bullets = bullets.filter(b => b.friendly);

        // Damage all enemies
        for (let e of enemies) {
            damageEnemy(e, 50);
        }

        // Bomb visual
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            particles.push({
                x: this.x, y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 40, maxLife: 40,
                color: COLORS.bomb, size: 6
            });
        }
    }

    takeDamage(amount) {
        if (this.invincible > 0 || this.dashing) return;

        // Shields first
        if (this.shields > 0) {
            this.shields--;
            this.invincible = 60;
            screenShake = 5;
            return;
        }

        this.hp -= amount;
        this.invincible = 60;
        screenShake = 10;
        multiplier = Math.max(1, multiplier - 0.5);

        // Damage flash
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                x: this.x, y: this.y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 20, maxLife: 20,
                color: '#ff4444', size: 4
            });
        }

        if (this.hp <= 0) {
            gameState = 'gameover';
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Flicker when invincible
        if (this.invincible > 0 && Math.floor(this.invincible / 3) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Dash trail
        if (this.dashing) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = COLORS.playerGlow;
            ctx.beginPath();
            ctx.arc(-this.dashDirX * 20, -this.dashDirY * 20, this.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Ship glow
        ctx.fillStyle = COLORS.playerGlow;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, this.size + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Ship body (triangular)
        ctx.rotate(this.angle + Math.PI / 2);
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(-this.size * 0.7, this.size * 0.7);
        ctx.lineTo(0, this.size * 0.3);
        ctx.lineTo(this.size * 0.7, this.size * 0.7);
        ctx.closePath();
        ctx.fill();

        // Engine glow
        ctx.fillStyle = '#4488ff';
        ctx.beginPath();
        ctx.arc(0, this.size * 0.5, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Focus mode indicator
        if (keys['ShiftLeft'] || keys['ShiftRight']) {
            ctx.strokeStyle = COLORS.playerGlow;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
            ctx.stroke();

            // Hitbox indicator
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Enemy class
class Enemy {
    constructor(type, x, y) {
        const def = ENEMY_TYPES[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.maxHp = def.hp;
        this.hp = def.hp;
        this.speed = def.speed;
        this.color = def.color;
        this.size = def.size;
        this.behavior = def.behavior;
        this.shoots = def.shoots;
        this.shootsFireball = def.shootsFireball;
        this.spawnsGhosts = def.spawnsGhosts;
        this.contact = def.contact;
        this.splits = def.splits;
        this.ringOnDeath = def.ringOnDeath;
        this.reward = def.reward;

        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.shootTimer = 60 + Math.random() * 60;
        this.actionTimer = 0;
        this.targetX = x;
        this.targetY = y;
        this.spawnTimer = 0;
    }

    update(dt) {
        this.shootTimer -= dt * 60;
        this.actionTimer -= dt * 60;
        this.spawnTimer -= dt * 60;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        switch (this.behavior) {
            case 'chase':
                if (dist > 0) {
                    this.x += (dx / dist) * this.speed;
                    this.y += (dy / dist) * this.speed;
                }
                break;

            case 'dash':
                if (this.actionTimer <= 0) {
                    this.targetX = player.x + (Math.random() - 0.5) * 100;
                    this.targetY = player.y + (Math.random() - 0.5) * 100;
                    this.actionTimer = 60 + Math.random() * 30;
                }
                const tdx = this.targetX - this.x;
                const tdy = this.targetY - this.y;
                const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
                if (tdist > 5) {
                    this.x += (tdx / tdist) * this.speed * 2;
                    this.y += (tdy / tdist) * this.speed * 2;
                }
                break;

            case 'wander':
                if (this.actionTimer <= 0) {
                    this.vx = (Math.random() - 0.5) * 2;
                    this.vy = (Math.random() - 0.5) * 2;
                    this.actionTimer = 60 + Math.random() * 60;
                }
                this.x += this.vx * this.speed;
                this.y += this.vy * this.speed;
                break;

            case 'bounce':
                this.x += this.vx * this.speed;
                this.y += this.vy * this.speed;

                const wallMargin = TILE_SIZE * 4;
                if (this.x < wallMargin + this.size || this.x > canvas.width - wallMargin - this.size) {
                    this.vx *= -1;
                    this.x = Math.max(wallMargin + this.size, Math.min(canvas.width - wallMargin - this.size, this.x));
                }
                if (this.y < PLAY_AREA_Y + wallMargin + this.size || this.y > canvas.height - wallMargin - this.size) {
                    this.vy *= -1;
                    this.y = Math.max(PLAY_AREA_Y + wallMargin + this.size, Math.min(canvas.height - wallMargin - this.size, this.y));
                }
                break;

            case 'stationary':
                // Don't move
                break;
        }

        // Clamp to room
        const wallMargin = TILE_SIZE * 4;
        this.x = Math.max(wallMargin + this.size, Math.min(canvas.width - wallMargin - this.size, this.x));
        this.y = Math.max(PLAY_AREA_Y + wallMargin + this.size, Math.min(canvas.height - wallMargin - this.size, this.y));

        // Shooting
        if (this.shoots && this.shootTimer <= 0 && dist < 400) {
            this.shootTimer = 90 + Math.random() * 30;
            this.shootAtPlayer();
        }

        if (this.shootsFireball && this.shootTimer <= 0 && dist < 400) {
            this.shootTimer = 120 + Math.random() * 60;
            this.shootFireball();
        }

        // Spawn ghosts (hermit)
        if (this.spawnsGhosts && this.spawnTimer <= 0) {
            this.spawnTimer = 180 + Math.random() * 60;
            spawnEnemy('ghost', this.x + (Math.random() - 0.5) * 40, this.y + (Math.random() - 0.5) * 40);
        }

        // Contact damage
        if (this.contact) {
            const playerDist = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2);
            if (playerDist < this.size + player.size) {
                player.takeDamage(1);
            }
        }
    }

    shootAtPlayer() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);

        if (this.type === 'drone') {
            // 3-shot spread
            for (let i = -1; i <= 1; i++) {
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle + i * 0.2) * 5,
                    vy: Math.sin(angle + i * 0.2) * 5,
                    damage: 1, size: 4, color: COLORS.bulletEnemy,
                    friendly: false, life: 180
                });
            }
        } else {
            bullets.push({
                x: this.x, y: this.y,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                damage: 1, size: 5, color: COLORS.bulletEnemy,
                friendly: false, life: 180
            });
        }
    }

    shootFireball() {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        bullets.push({
            x: this.x, y: this.y,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            damage: 1, size: 10, color: COLORS.fireball,
            friendly: false, life: 240, fireball: true, trail: true
        });
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw based on type
        switch (this.type) {
            case 'ghost':
            case 'crazyGhost':
                this.drawGhost();
                break;
            case 'drone':
                this.drawDrone();
                break;
            case 'turret':
                this.drawTurret();
                break;
            case 'seeker':
                this.drawSeeker();
                break;
            case 'swarmer':
                this.drawSwarmer();
                break;
            case 'blob':
                this.drawBlob();
                break;
            case 'pyromancer':
                this.drawPyromancer();
                break;
            case 'hermit':
                this.drawHermit();
                break;
            case 'bumper':
                this.drawBumper();
                break;
            default:
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
        }

        ctx.restore();

        // Health bar
        if (this.hp < this.maxHp) {
            const barWidth = this.size * 2;
            const barHeight = 3;
            const barY = this.y - this.size - 8;

            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);

            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.x - barWidth / 2, barY, barWidth * (this.hp / this.maxHp), barHeight);
        }
    }

    drawGhost() {
        // Ghostly body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, -2, this.size * 0.7, Math.PI, 0);
        ctx.lineTo(this.size * 0.7, this.size * 0.5);
        for (let i = 3; i >= -3; i--) {
            const x = i * this.size * 0.23;
            const y = this.size * 0.5 + (i % 2 === 0 ? 4 : 0);
            ctx.lineTo(x, y);
        }
        ctx.lineTo(-this.size * 0.7, this.size * 0.5);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-3, -2, 3, 0, Math.PI * 2);
        ctx.arc(3, -2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-3, -1, 1.5, 0, Math.PI * 2);
        ctx.arc(3, -1, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawDrone() {
        // Mechanical body
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size, -this.size * 0.5, this.size * 2, this.size);

        // Wings
        ctx.fillStyle = '#666';
        ctx.fillRect(-this.size * 1.2, -this.size * 0.3, this.size * 0.3, this.size * 0.6);
        ctx.fillRect(this.size * 0.9, -this.size * 0.3, this.size * 0.3, this.size * 0.6);

        // Eye
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTurret() {
        // Base
        ctx.fillStyle = '#444';
        ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);

        // Turret
        ctx.fillStyle = this.color;
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        ctx.rotate(angle);
        ctx.fillRect(-4, -this.size * 0.8, this.size * 1.2, this.size * 0.4);
        ctx.fillRect(-4, this.size * 0.4, this.size * 1.2, this.size * 0.4);

        // Center
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSeeker() {
        // Angular body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size, 0);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSwarmer() {
        // Small aggressive creature
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Spikes
        ctx.strokeStyle = '#ff8888';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI / 2 + frameCount * 0.1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * this.size * 1.5, Math.sin(angle) * this.size * 1.5);
            ctx.stroke();
        }
    }

    drawBlob() {
        // Pulsing blob
        const pulse = 1 + Math.sin(frameCount * 0.1) * 0.1;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * pulse, this.size * 0.8 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();

        // Darker spots
        ctx.fillStyle = '#448844';
        ctx.beginPath();
        ctx.arc(-5, -3, 4, 0, Math.PI * 2);
        ctx.arc(6, 2, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawPyromancer() {
        // Robed figure
        ctx.fillStyle = '#442222';
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size * 0.8, this.size * 0.8);
        ctx.lineTo(-this.size * 0.8, this.size * 0.8);
        ctx.closePath();
        ctx.fill();

        // Hood
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, -this.size * 0.3, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Fire glow
        ctx.fillStyle = '#ff6622';
        ctx.globalAlpha = 0.5 + Math.sin(frameCount * 0.2) * 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    drawHermit() {
        // Large robed figure
        ctx.fillStyle = '#332244';
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size, this.size);
        ctx.lineTo(-this.size, this.size);
        ctx.closePath();
        ctx.fill();

        // Face
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, -this.size * 0.4, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Glowing eyes
        ctx.fillStyle = '#ff44ff';
        ctx.beginPath();
        ctx.arc(-4, -this.size * 0.4, 2, 0, Math.PI * 2);
        ctx.arc(4, -this.size * 0.4, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBumper() {
        // Bouncy mechanical thing
        const wobble = Math.sin(frameCount * 0.15) * 2;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, wobble, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Bumper ring
        ctx.strokeStyle = '#ffaa66';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, wobble, this.size + 3, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Boss class
class Boss {
    constructor(type) {
        const def = BOSSES[type];
        this.type = type;
        this.name = def.name;
        this.maxHp = def.hp;
        this.hp = def.hp;
        this.size = def.size;
        this.color = def.color;
        this.floor = def.floor;
        this.phases = def.phases;
        this.reward = def.reward;

        this.x = canvas.width / 2;
        this.y = PLAY_AREA_Y + 150;
        this.phase = 1;
        this.actionTimer = 60;
        this.invincible = false;
        this.attackPattern = 0;
    }

    update(dt) {
        this.actionTimer -= dt * 60;

        // Phase transitions
        const phaseThreshold = this.maxHp / this.phases;
        const newPhase = Math.ceil((this.maxHp - this.hp) / phaseThreshold) + 1;
        if (newPhase > this.phase && newPhase <= this.phases) {
            this.phase = newPhase;
            this.invincible = true;
            this.actionTimer = 60;

            // Phase transition effect
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                particles.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle) * 4,
                    vy: Math.sin(angle) * 4,
                    life: 40, maxLife: 40,
                    color: this.color, size: 8
                });
            }
        }

        if (this.invincible && this.actionTimer <= 0) {
            this.invincible = false;
            this.actionTimer = 30;
        }

        if (!this.invincible && this.actionTimer <= 0) {
            this.attack();
            this.actionTimer = 60 + Math.random() * 30;
        }

        // Movement based on boss type
        this.move(dt);
    }

    move(dt) {
        switch (this.type) {
            case 'chamberlord':
                // Teleport to corners occasionally
                if (Math.random() < 0.005) {
                    const corners = [
                        { x: 200, y: PLAY_AREA_Y + 150 },
                        { x: 600, y: PLAY_AREA_Y + 150 },
                        { x: 200, y: 400 },
                        { x: 600, y: 400 }
                    ];
                    const corner = corners[Math.floor(Math.random() * corners.length)];
                    this.x = corner.x;
                    this.y = corner.y;
                }
                break;

            case 'wraithking':
                // Horizontal movement
                this.x += Math.sin(frameCount * 0.02) * 2;
                break;

            case 'coreGuardian':
                // Stationary, rotate turrets
                break;
        }
    }

    attack() {
        this.attackPattern = (this.attackPattern + 1) % 4;

        switch (this.type) {
            case 'chamberlord':
                this.chamberlordAttack();
                break;
            case 'wraithking':
                this.wraithkingAttack();
                break;
            case 'coreGuardian':
                this.coreGuardianAttack();
                break;
        }
    }

    chamberlordAttack() {
        switch (this.attackPattern) {
            case 0:
                // Spread shot
                for (let i = 0; i < 8; i++) {
                    const angle = i * Math.PI / 4;
                    bullets.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(angle) * 4,
                        vy: Math.sin(angle) * 4,
                        damage: 1, size: 8, color: '#ff8844',
                        friendly: false, life: 180
                    });
                }
                break;
            case 1:
                // Aimed burst
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        if (gameState === 'playing') {
                            bullets.push({
                                x: this.x, y: this.y,
                                vx: Math.cos(angle) * 6,
                                vy: Math.sin(angle) * 6,
                                damage: 1, size: 10, color: '#ffaa44',
                                friendly: false, life: 180
                            });
                        }
                    }, i * 100);
                }
                break;
            case 2:
                // Spawn chamberheads
                for (let i = 0; i < 2; i++) {
                    spawnEnemy('seeker',
                        this.x + (Math.random() - 0.5) * 100,
                        this.y + (Math.random() - 0.5) * 100
                    );
                }
                break;
            case 3:
                // Ring pattern
                for (let i = 0; i < 16; i++) {
                    const angle = i * Math.PI / 8;
                    bullets.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(angle) * 3,
                        vy: Math.sin(angle) * 3,
                        damage: 1, size: 6, color: '#ff6644',
                        friendly: false, life: 240
                    });
                }
                break;
        }
    }

    wraithkingAttack() {
        switch (this.attackPattern) {
            case 0:
                // Spawn ghosts
                for (let i = 0; i < 3; i++) {
                    spawnEnemy('ghost',
                        this.x + (Math.random() - 0.5) * 150,
                        this.y + Math.random() * 100
                    );
                }
                break;
            case 1:
                // Laser sweep
                for (let i = 0; i < 20; i++) {
                    const angle = -Math.PI / 2 - 0.5 + i * 0.05;
                    setTimeout(() => {
                        if (gameState === 'playing') {
                            bullets.push({
                                x: this.x, y: this.y,
                                vx: Math.cos(angle) * 8,
                                vy: Math.sin(angle) * 8,
                                damage: 1, size: 4, color: '#aa44ff',
                                friendly: false, life: 120
                            });
                        }
                    }, i * 50);
                }
                break;
            case 2:
                // Charge at player
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    this.x += (dx / dist) * 100;
                    this.y += (dy / dist) * 50;
                }
                break;
            case 3:
                // Circle of bullets
                for (let ring = 0; ring < 3; ring++) {
                    setTimeout(() => {
                        if (gameState === 'playing') {
                            for (let i = 0; i < 12; i++) {
                                const angle = i * Math.PI / 6 + ring * 0.2;
                                bullets.push({
                                    x: this.x, y: this.y,
                                    vx: Math.cos(angle) * 4,
                                    vy: Math.sin(angle) * 4,
                                    damage: 1, size: 5, color: '#8844aa',
                                    friendly: false, life: 200
                                });
                            }
                        }
                    }, ring * 200);
                }
                break;
        }
    }

    coreGuardianAttack() {
        switch (this.attackPattern) {
            case 0:
                // Turret spray
                for (let t = 0; t < 4; t++) {
                    const baseAngle = t * Math.PI / 2 + frameCount * 0.02;
                    for (let i = 0; i < 3; i++) {
                        const angle = baseAngle + (i - 1) * 0.15;
                        bullets.push({
                            x: this.x + Math.cos(t * Math.PI / 2) * 40,
                            y: this.y + Math.sin(t * Math.PI / 2) * 40,
                            vx: Math.cos(angle) * 5,
                            vy: Math.sin(angle) * 5,
                            damage: 1, size: 5, color: '#4488aa',
                            friendly: false, life: 180
                        });
                    }
                }
                break;
            case 1:
                // Spiral pattern
                for (let i = 0; i < 30; i++) {
                    setTimeout(() => {
                        if (gameState === 'playing') {
                            const angle = i * 0.3 + frameCount * 0.01;
                            bullets.push({
                                x: this.x, y: this.y,
                                vx: Math.cos(angle) * 4,
                                vy: Math.sin(angle) * 4,
                                damage: 1, size: 6, color: '#44aacc',
                                friendly: false, life: 200
                            });
                        }
                    }, i * 50);
                }
                break;
            case 2:
                // Shield phase - spawn generators
                for (let i = 0; i < 2; i++) {
                    spawnEnemy('turret',
                        this.x + (i === 0 ? -100 : 100),
                        this.y
                    );
                }
                break;
            case 3:
                // Bullet hell
                for (let wave = 0; wave < 5; wave++) {
                    setTimeout(() => {
                        if (gameState === 'playing') {
                            for (let i = 0; i < 24; i++) {
                                const angle = i * Math.PI / 12 + wave * 0.1;
                                bullets.push({
                                    x: this.x, y: this.y,
                                    vx: Math.cos(angle) * (3 + wave * 0.5),
                                    vy: Math.sin(angle) * (3 + wave * 0.5),
                                    damage: 1, size: 4, color: '#66ccff',
                                    friendly: false, life: 180
                                });
                            }
                        }
                    }, wave * 150);
                }
                break;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Invincible glow
        if (this.invincible) {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.5 + Math.sin(frameCount * 0.3) * 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        switch (this.type) {
            case 'chamberlord':
                this.drawChamberlord();
                break;
            case 'wraithking':
                this.drawWraithking();
                break;
            case 'coreGuardian':
                this.drawCoreGuardian();
                break;
        }

        ctx.restore();

        // Boss health bar at top
        const barWidth = 300;
        const barHeight = 16;
        const barX = (canvas.width - barWidth) / 2;
        const barY = 10;

        // Background
        ctx.fillStyle = '#222';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health
        ctx.fillStyle = COLORS.bossHealth;
        ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), barHeight);

        // Border
        ctx.strokeStyle = COLORS.ui;
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Name
        ctx.fillStyle = COLORS.ui;
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.name + ' - Phase ' + this.phase, canvas.width / 2, barY + barHeight + 14);
    }

    drawChamberlord() {
        // Large angular construct
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size * 0.8, -this.size * 0.3);
        ctx.lineTo(this.size, this.size * 0.5);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size, this.size * 0.5);
        ctx.lineTo(-this.size * 0.8, -this.size * 0.3);
        ctx.closePath();
        ctx.fill();

        // Core
        ctx.fillStyle = '#ffaa44';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(-15, -10, 5, 0, Math.PI * 2);
        ctx.arc(15, -10, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawWraithking() {
        // Ghostly king
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, -this.size * 0.3, this.size * 0.5, Math.PI, 0);
        ctx.lineTo(this.size * 0.5, this.size * 0.5);
        for (let i = 4; i >= -4; i--) {
            ctx.lineTo(i * this.size * 0.12, this.size * 0.5 + (i % 2 === 0 ? 10 : 0));
        }
        ctx.lineTo(-this.size * 0.5, this.size * 0.5);
        ctx.closePath();
        ctx.fill();

        // Crown
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(-20, -this.size * 0.5);
        ctx.lineTo(-15, -this.size * 0.8);
        ctx.lineTo(-5, -this.size * 0.6);
        ctx.lineTo(0, -this.size * 0.9);
        ctx.lineTo(5, -this.size * 0.6);
        ctx.lineTo(15, -this.size * 0.8);
        ctx.lineTo(20, -this.size * 0.5);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(-12, -this.size * 0.2, 6, 0, Math.PI * 2);
        ctx.arc(12, -this.size * 0.2, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCoreGuardian() {
        // Central core
        ctx.fillStyle = '#334455';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Rotating turrets
        for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI / 2 + frameCount * 0.02;
            const tx = Math.cos(angle) * this.size * 0.8;
            const ty = Math.sin(angle) * this.size * 0.8;

            ctx.fillStyle = '#556677';
            ctx.beginPath();
            ctx.arc(tx, ty, 12, 0, Math.PI * 2);
            ctx.fill();

            // Turret barrel
            ctx.fillStyle = '#667788';
            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(angle);
            ctx.fillRect(0, -3, 15, 6);
            ctx.restore();
        }

        // Core eye
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Utility functions
function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = x1; yy = y1;
    } else if (param > 1) {
        xx = x2; yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function spawnEnemy(type, x, y) {
    enemies.push(new Enemy(type, x, y));
}

function damageEnemy(enemy, damage) {
    enemy.hp -= damage;

    // Floating damage text
    floatingTexts.push({
        x: enemy.x, y: enemy.y - enemy.size,
        text: Math.floor(damage).toString(),
        color: '#ffff00',
        life: 30
    });

    // Hit particles
    for (let i = 0; i < 3; i++) {
        particles.push({
            x: enemy.x + (Math.random() - 0.5) * enemy.size,
            y: enemy.y + (Math.random() - 0.5) * enemy.size,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 15, maxLife: 15,
            color: enemy.color, size: 3
        });
    }

    if (enemy.hp <= 0) {
        killCount++;

        // Kill effects
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                x: enemy.x, y: enemy.y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 25, maxLife: 25,
                color: enemy.color, size: 4
            });
        }

        // Reward
        const reward = Math.floor(enemy.reward * multiplier);
        debris += reward;
        multiplier = Math.min(9.9, multiplier + 0.1);
        multiplierTimer = 180;

        // Floating text for debris
        floatingTexts.push({
            x: enemy.x, y: enemy.y,
            text: '+' + reward + 'G',
            color: COLORS.debris,
            life: 40
        });

        // Special death effects
        if (enemy.splits) {
            // Blob splits into smaller blobs
            for (let i = 0; i < 2; i++) {
                const small = new Enemy('swarmer', enemy.x + (i - 0.5) * 30, enemy.y);
                small.maxHp = 30;
                small.hp = 30;
                small.size = 10;
                enemies.push(small);
            }
        }

        if (enemy.ringOnDeath) {
            // Bumper death ring
            for (let i = 0; i < 12; i++) {
                const angle = i * Math.PI / 6;
                bullets.push({
                    x: enemy.x, y: enemy.y,
                    vx: Math.cos(angle) * 4,
                    vy: Math.sin(angle) * 4,
                    damage: 1, size: 5, color: '#ffaa44',
                    friendly: false, life: 120
                });
            }
        }

        // Drop pickup occasionally
        if (Math.random() < 0.1) {
            pickups.push({
                x: enemy.x, y: enemy.y,
                type: Math.random() < 0.5 ? 'health' : 'ammo',
                size: 8
            });
        }
    }
}

function generateFloor() {
    floorMap = [];
    rooms = {};

    // Simple 5x5 grid floor
    const size = 5;
    for (let y = 0; y < size; y++) {
        floorMap[y] = [];
        for (let x = 0; x < size; x++) {
            floorMap[y][x] = 0;
        }
    }

    // Start room in center
    floorMap[2][2] = 1;
    currentRoom = { x: 2, y: 2 };

    // Generate connected rooms
    const roomQueue = [{ x: 2, y: 2 }];
    let roomCount = 1;
    const maxRooms = 8 + currentFloor * 2;

    while (roomQueue.length > 0 && roomCount < maxRooms) {
        const room = roomQueue.shift();
        const dirs = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ].sort(() => Math.random() - 0.5);

        for (const dir of dirs) {
            const nx = room.x + dir.dx;
            const ny = room.y + dir.dy;

            if (nx >= 0 && nx < size && ny >= 0 && ny < size && floorMap[ny][nx] === 0 && Math.random() < 0.8) {
                floorMap[ny][nx] = 1;
                roomQueue.push({ x: nx, y: ny });
                roomCount++;

                if (roomCount >= maxRooms) break;
            }
        }
    }

    // Find furthest room for boss
    let maxDist = 0;
    let bossRoom = { x: 2, y: 2 };
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (floorMap[y][x] === 1) {
                const dist = Math.abs(x - 2) + Math.abs(y - 2);
                if (dist > maxDist) {
                    maxDist = dist;
                    bossRoom = { x, y };
                }
            }
        }
    }
    floorMap[bossRoom.y][bossRoom.x] = 2; // Boss room

    // Generate room contents
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (floorMap[y][x] > 0) {
                const key = x + ',' + y;
                rooms[key] = {
                    cleared: (x === 2 && y === 2),
                    enemies: [],
                    isBoss: floorMap[y][x] === 2
                };
            }
        }
    }
}

function enterRoom(x, y) {
    currentRoom = { x, y };
    const key = x + ',' + y;
    const room = rooms[key];

    enemies = [];
    bullets = [];

    if (!room.cleared) {
        if (room.isBoss) {
            // Spawn boss
            const bossTypes = ['chamberlord', 'wraithking', 'coreGuardian'];
            enemies.push(new Boss(bossTypes[currentFloor - 1]));
        } else {
            // Spawn enemies based on floor
            const enemyCount = 3 + currentFloor + Math.floor(Math.random() * 3);
            const enemyPool = ['ghost', 'swarmer', 'seeker'];
            if (currentFloor >= 2) enemyPool.push('drone', 'pyromancer', 'blob');
            if (currentFloor >= 3) enemyPool.push('turret', 'hermit', 'bumper', 'crazyGhost');

            for (let i = 0; i < enemyCount; i++) {
                const type = enemyPool[Math.floor(Math.random() * enemyPool.length)];
                const ex = 100 + Math.random() * (canvas.width - 200);
                const ey = PLAY_AREA_Y + 100 + Math.random() * (canvas.height - PLAY_AREA_Y - 200);
                spawnEnemy(type, ex, ey);
            }
        }
    }

    // Position player at entrance
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
}

function checkRoomTransition() {
    const margin = 40; // Larger margin for easier transitions
    let newX = currentRoom.x;
    let newY = currentRoom.y;
    let transition = false;

    if (player.x < margin) {
        newX--;
        player.x = canvas.width - margin - player.size;
        transition = true;
    } else if (player.x > canvas.width - margin) {
        newX++;
        player.x = margin + player.size;
        transition = true;
    } else if (player.y < PLAY_AREA_Y + margin) {
        newY--;
        player.y = canvas.height - margin - player.size;
        transition = true;
    } else if (player.y > canvas.height - margin) {
        newY++;
        player.y = PLAY_AREA_Y + margin + player.size;
        transition = true;
    }

    if (transition && floorMap[newY] && floorMap[newY][newX] > 0) {
        // Check if current room is cleared
        const currentKey = currentRoom.x + ',' + currentRoom.y;
        if (enemies.length === 0) {
            rooms[currentKey].cleared = true;
        }

        // Can only leave if room is cleared
        if (rooms[currentKey].cleared) {
            enterRoom(newX, newY);
        } else {
            // Push player back
            if (player.x < margin + player.size) player.x = margin + player.size;
            if (player.x > canvas.width - margin - player.size) player.x = canvas.width - margin - player.size;
            if (player.y < PLAY_AREA_Y + margin + player.size) player.y = PLAY_AREA_Y + margin + player.size;
            if (player.y > canvas.height - margin - player.size) player.y = canvas.height - margin - player.size;
        }
    } else if (transition) {
        // Invalid room, push back
        player.x = Math.max(margin + player.size, Math.min(canvas.width - margin - player.size, player.x));
        player.y = Math.max(PLAY_AREA_Y + margin + player.size, Math.min(canvas.height - margin - player.size, player.y));
    }
}

function checkBossDefeat() {
    if (enemies.length === 0 && !bossDefeated) {
        const key = currentRoom.x + ',' + currentRoom.y;
        if (rooms[key] && rooms[key].isBoss) {
            bossDefeated = true;

            // Check win condition
            if (currentFloor >= 3) {
                gameState = 'victory';
            } else {
                // Spawn stairs
                pickups.push({
                    x: canvas.width / 2,
                    y: canvas.height / 2,
                    type: 'stairs',
                    size: 24
                });
            }

            // Boss rewards
            player.maxHp += 2;
            player.hp = Math.min(player.hp + 2, player.maxHp);
            player.damageBonus += 5;

            floatingTexts.push({
                x: canvas.width / 2, y: canvas.height / 2 - 50,
                text: '+2 HP, +5% Damage!',
                color: '#ffff00',
                life: 120
            });
        }
    }
}

function checkRoomClear() {
    const key = currentRoom.x + ',' + currentRoom.y;
    const room = rooms[key];

    if (room && !room.cleared && enemies.length === 0 && !room.isBoss) {
        // Room cleared!
        room.cleared = true;
        roomsCleared++;
        totalKills += killCount;
        killCount = 0;

        // Drop a weapon pickup occasionally
        if (Math.random() < 0.3) {
            pickups.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 100,
                y: canvas.height / 2 + (Math.random() - 0.5) * 100,
                type: 'weapon',
                size: 12
            });
        }

        // Show salvage selection every 3 rooms
        if (roomsCleared > 0 && roomsCleared % 3 === 0) {
            showSalvageSelection();
        }

        // Bomb recharge every 3 rooms
        if (roomsCleared % 3 === 0) {
            player.bombs = Math.min(player.maxBombs, player.bombs + 1);
            floatingTexts.push({
                x: canvas.width / 2,
                y: canvas.height / 2 + 30,
                text: '+1 BOMB',
                color: COLORS.bomb,
                life: 60
            });
        }
    }
}

function nextFloor() {
    currentFloor++;
    bossDefeated = false;
    generateFloor();
    enterRoom(2, 2);
    roomsCleared = 0;

    // Bomb recharge
    player.bombs = Math.min(player.maxBombs, player.bombs + 1);
}

// Salvage selection system
const SALVAGE_OPTIONS = [
    { name: 'Extra Health', desc: 'Heal for switching', icon: 'health', effect: () => { player.hp = Math.min(player.maxHp, player.hp + 1); } },
    { name: 'Damage Up', desc: '+5% damage', icon: 'damage', effect: () => { player.damageBonus += 5; } },
    { name: 'Max HP Up', desc: '+1 max health', icon: 'maxhp', effect: () => { player.maxHp++; player.hp++; } },
    { name: 'Bomb Refill', desc: '+1 bomb', icon: 'bomb', effect: () => { player.bombs = Math.min(player.maxBombs, player.bombs + 1); } },
    { name: 'Shield', desc: '+1 shield', icon: 'shield', effect: () => { player.shields++; player.maxShields++; } },
    { name: 'Ammo Refill', desc: 'Refill current weapon', icon: 'ammo', effect: () => { player.ammo[player.weapon] = WEAPONS[player.weapon].ammo; } },
    { name: 'Speed Up', desc: '+10% move speed', icon: 'speed', effect: () => { player.speed *= 1.1; } },
    { name: 'Fire Rate', desc: '+10% fire rate', icon: 'fire', effect: () => { player.fireRateBonus = (player.fireRateBonus || 0) + 0.1; } }
];

function showSalvageSelection() {
    // Pick 3 random options
    const shuffled = [...SALVAGE_OPTIONS].sort(() => Math.random() - 0.5);
    salvageSelection = {
        options: shuffled.slice(0, 3),
        selected: -1
    };
    gameState = 'salvage';
}

function selectSalvage(index) {
    if (salvageSelection && index >= 0 && index < salvageSelection.options.length) {
        salvageSelection.options[index].effect();
        floatingTexts.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            text: salvageSelection.options[index].name + '!',
            color: '#ffff00',
            life: 60
        });
        salvageSelection = null;
        gameState = 'playing';
    }
}

function drawSalvageSelection() {
    if (!salvageSelection) return;

    // Darken background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#ff8844';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CHOOSE ONE', canvas.width / 2, 180);
    ctx.fillText('SALVAGE', canvas.width / 2, 210);

    // Options
    const boxWidth = 120;
    const boxHeight = 100;
    const spacing = 40;
    const startX = canvas.width / 2 - (boxWidth * 1.5 + spacing);

    for (let i = 0; i < 3; i++) {
        const opt = salvageSelection.options[i];
        const x = startX + i * (boxWidth + spacing);
        const y = 280;

        // Check hover
        const hover = mouse.x >= x && mouse.x <= x + boxWidth &&
                     mouse.y >= y && mouse.y <= y + boxHeight;

        // Box
        ctx.strokeStyle = hover ? '#ffaa44' : '#884422';
        ctx.lineWidth = hover ? 3 : 2;
        ctx.strokeRect(x, y, boxWidth, boxHeight);

        if (hover) {
            ctx.fillStyle = 'rgba(255, 136, 68, 0.2)';
            ctx.fillRect(x, y, boxWidth, boxHeight);
        }

        // Icon
        ctx.fillStyle = '#ff6633';
        drawSalvageIcon(x + boxWidth / 2, y + 35, opt.icon);

        // Name
        ctx.fillStyle = '#ffaa66';
        ctx.font = '10px monospace';
        ctx.fillText(opt.name.substring(0, 12), x + boxWidth / 2, y + boxHeight - 10);
    }

    // Description of hovered
    for (let i = 0; i < 3; i++) {
        const x = startX + i * (boxWidth + spacing);
        const y = 280;
        if (mouse.x >= x && mouse.x <= x + boxWidth &&
            mouse.y >= y && mouse.y <= y + boxHeight) {
            ctx.fillStyle = '#ffcc88';
            ctx.font = '14px monospace';
            ctx.fillText(salvageSelection.options[i].desc, canvas.width / 2, 420);
        }
    }
}

function drawSalvageIcon(x, y, type) {
    ctx.save();
    ctx.translate(x, y);

    switch (type) {
        case 'health':
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.bezierCurveTo(0, -15, -15, -15, -15, -5);
            ctx.bezierCurveTo(-15, 5, 0, 15, 0, 20);
            ctx.bezierCurveTo(0, 15, 15, 5, 15, -5);
            ctx.bezierCurveTo(15, -15, 0, -15, 0, -8);
            ctx.fill();
            break;
        case 'damage':
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(5, -5);
            ctx.lineTo(15, -5);
            ctx.lineTo(7, 3);
            ctx.lineTo(10, 15);
            ctx.lineTo(0, 7);
            ctx.lineTo(-10, 15);
            ctx.lineTo(-7, 3);
            ctx.lineTo(-15, -5);
            ctx.lineTo(-5, -5);
            ctx.closePath();
            ctx.fill();
            break;
        case 'maxhp':
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.fillRect(-8, -2, 16, 4);
            ctx.fillRect(-2, -8, 4, 16);
            break;
        case 'bomb':
            ctx.beginPath();
            ctx.arc(0, 5, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(-2, -10, 4, 8);
            break;
        case 'shield':
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(12, -8);
            ctx.lineTo(12, 5);
            ctx.lineTo(0, 15);
            ctx.lineTo(-12, 5);
            ctx.lineTo(-12, -8);
            ctx.closePath();
            ctx.fill();
            break;
        case 'ammo':
            ctx.fillRect(-4, -12, 8, 20);
            ctx.fillStyle = '#ffcc44';
            ctx.fillRect(-2, -10, 4, 6);
            break;
        case 'speed':
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-5, -10);
            ctx.lineTo(-5, -5);
            ctx.lineTo(-15, -5);
            ctx.lineTo(-15, 5);
            ctx.lineTo(-5, 5);
            ctx.lineTo(-5, 10);
            ctx.closePath();
            ctx.fill();
            break;
        case 'fire':
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(-8 + i * 8, 0, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
    }
    ctx.restore();
}

function handleSalvageClick() {
    if (gameState !== 'salvage' || !salvageSelection) return;

    const boxWidth = 120;
    const boxHeight = 100;
    const spacing = 40;
    const startX = canvas.width / 2 - (boxWidth * 1.5 + spacing);
    const y = 280;

    for (let i = 0; i < 3; i++) {
        const x = startX + i * (boxWidth + spacing);
        if (mouse.x >= x && mouse.x <= x + boxWidth &&
            mouse.y >= y && mouse.y <= y + boxHeight) {
            selectSalvage(i);
            break;
        }
    }
}

// Update functions
function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];

        if (b.laser) {
            b.life--;
            if (b.life <= 0) {
                bullets.splice(i, 1);
            }
            continue;
        }

        // Homing
        if (b.homing && b.friendly && enemies.length > 0) {
            let closest = null;
            let closestDist = Infinity;
            for (const e of enemies) {
                const dist = Math.sqrt((e.x - b.x) ** 2 + (e.y - b.y) ** 2);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = e;
                }
            }
            if (closest && closestDist < 200) {
                const angle = Math.atan2(closest.y - b.y, closest.x - b.x);
                const currentAngle = Math.atan2(b.vy, b.vx);
                let diff = angle - currentAngle;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                const turn = Math.min(0.1, Math.abs(diff)) * Math.sign(diff);
                const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                const newAngle = currentAngle + turn;
                b.vx = Math.cos(newAngle) * speed;
                b.vy = Math.sin(newAngle) * speed;
            }
        }

        b.x += b.vx;
        b.y += b.vy;
        b.life--;

        // Trail particles
        if (b.trail && frameCount % 2 === 0) {
            particles.push({
                x: b.x, y: b.y,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                life: 15, maxLife: 15,
                color: b.fireball ? COLORS.fireball : b.color,
                size: b.size * 0.5
            });
        }

        // Check collisions
        if (b.friendly) {
            // Hit enemies
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                const dist = Math.sqrt((e.x - b.x) ** 2 + (e.y - b.y) ** 2);
                if (dist < e.size + b.size) {
                    if (e instanceof Boss) {
                        if (!e.invincible) {
                            e.hp -= b.damage;
                            if (e.hp <= 0) {
                                enemies.splice(j, 1);
                            }
                        }
                    } else {
                        damageEnemy(e, b.damage);
                        if (e.hp <= 0) {
                            enemies.splice(j, 1);
                        }
                    }

                    if (b.aoe > 0) {
                        // AoE explosion
                        for (const e2 of enemies) {
                            const aoeDist = Math.sqrt((e2.x - b.x) ** 2 + (e2.y - b.y) ** 2);
                            if (aoeDist < b.aoe && e2 !== e) {
                                damageEnemy(e2, b.damage * 0.5);
                            }
                        }
                        // Explosion particles
                        for (let p = 0; p < 12; p++) {
                            const angle = Math.random() * Math.PI * 2;
                            particles.push({
                                x: b.x, y: b.y,
                                vx: Math.cos(angle) * 4,
                                vy: Math.sin(angle) * 4,
                                life: 20, maxLife: 20,
                                color: COLORS.fireball, size: 6
                            });
                        }
                    }

                    if (!b.pierce) {
                        bullets.splice(i, 1);
                        break;
                    }
                }
            }
        } else {
            // Hit player
            const dist = Math.sqrt((player.x - b.x) ** 2 + (player.y - b.y) ** 2);
            const hitRadius = (keys['ShiftLeft'] || keys['ShiftRight']) ? 2 : player.size;
            if (dist < hitRadius + b.size) {
                player.takeDamage(b.damage);
                bullets.splice(i, 1);
                continue;
            }
        }

        // Remove if out of bounds or expired
        if (b.life <= 0 || b.x < 0 || b.x > canvas.width || b.y < PLAY_AREA_Y || b.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.vx *= 0.95;
        p.vy *= 0.95;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.y -= 1;
        t.life--;

        if (t.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dist = Math.sqrt((player.x - p.x) ** 2 + (player.y - p.y) ** 2);

        if (dist < player.size + p.size) {
            switch (p.type) {
                case 'health':
                    player.hp = Math.min(player.maxHp, player.hp + 1);
                    floatingTexts.push({ x: p.x, y: p.y, text: '+1 HP', color: COLORS.health, life: 30 });
                    break;
                case 'ammo':
                    player.ammo[player.weapon] = WEAPONS[player.weapon].ammo;
                    floatingTexts.push({ x: p.x, y: p.y, text: 'AMMO', color: '#ffaa00', life: 30 });
                    break;
                case 'bomb':
                    player.bombs = Math.min(player.maxBombs, player.bombs + 1);
                    floatingTexts.push({ x: p.x, y: p.y, text: '+1 BOMB', color: COLORS.bomb, life: 30 });
                    break;
                case 'weapon':
                    const weapons = Object.keys(WEAPONS).filter(w => w !== 'peashooter');
                    player.weapon = weapons[Math.floor(Math.random() * weapons.length)];
                    player.ammo[player.weapon] = WEAPONS[player.weapon].ammo;
                    floatingTexts.push({ x: p.x, y: p.y, text: WEAPONS[player.weapon].name.toUpperCase(), color: '#00ffff', life: 40 });
                    break;
                case 'stairs':
                    nextFloor();
                    break;
            }
            pickups.splice(i, 1);
        }
    }
}

function updateMultiplier(dt) {
    if (multiplierTimer > 0) {
        multiplierTimer -= dt * 60;
    } else if (multiplier > 1) {
        multiplier = Math.max(1, multiplier - 0.01);
    }
}

// Drawing functions
function drawRoom() {
    // Background
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, PLAY_AREA_Y, canvas.width, canvas.height - PLAY_AREA_Y);

    // Floor pattern
    ctx.fillStyle = COLORS.floorPattern;
    for (let x = 0; x < canvas.width; x += 32) {
        for (let y = PLAY_AREA_Y; y < canvas.height; y += 32) {
            if ((x + y) % 64 === 0) {
                ctx.fillRect(x + 2, y + 2, 28, 28);
            }
        }
    }

    // Walls
    const wallThickness = TILE_SIZE * 2;

    // Draw wall tiles
    for (let x = 0; x < canvas.width; x += TILE_SIZE) {
        for (let y = 0; y < wallThickness; y += TILE_SIZE) {
            drawWallTile(x, PLAY_AREA_Y + y);
            drawWallTile(x, canvas.height - wallThickness + y);
        }
    }
    for (let y = PLAY_AREA_Y; y < canvas.height; y += TILE_SIZE) {
        for (let x = 0; x < wallThickness; x += TILE_SIZE) {
            drawWallTile(x, y);
            drawWallTile(canvas.width - wallThickness + x, y);
        }
    }

    // Draw doors
    const key = currentRoom.x + ',' + currentRoom.y;
    const room = rooms[key];
    const canExit = room && room.cleared;

    // Check adjacent rooms for doors
    if (floorMap[currentRoom.y - 1] && floorMap[currentRoom.y - 1][currentRoom.x] > 0) {
        drawDoor(canvas.width / 2, PLAY_AREA_Y + wallThickness / 2, 'up', canExit);
    }
    if (floorMap[currentRoom.y + 1] && floorMap[currentRoom.y + 1][currentRoom.x] > 0) {
        drawDoor(canvas.width / 2, canvas.height - wallThickness / 2, 'down', canExit);
    }
    if (floorMap[currentRoom.y][currentRoom.x - 1] > 0) {
        drawDoor(wallThickness / 2, (PLAY_AREA_Y + canvas.height) / 2, 'left', canExit);
    }
    if (floorMap[currentRoom.y][currentRoom.x + 1] > 0) {
        drawDoor(canvas.width - wallThickness / 2, (PLAY_AREA_Y + canvas.height) / 2, 'right', canExit);
    }
}

function drawWallTile(x, y) {
    const seed = (x * 7 + y * 13) % 100;

    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Brick pattern
    ctx.fillStyle = COLORS.wallDark;
    ctx.fillRect(x, y, TILE_SIZE, 1);
    ctx.fillRect(x, y, 1, TILE_SIZE);

    if (seed < 30) {
        ctx.fillStyle = COLORS.wallLight;
        ctx.fillRect(x + 2, y + 2, 4, 4);
    }

    // Skull decorations occasionally
    if (seed > 95) {
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(x + 8, y + 6, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 6, y + 4, 2, 2);
        ctx.fillRect(x + 9, y + 4, 2, 2);
    }
}

function drawDoor(x, y, dir, open) {
    const color = open ? COLORS.door : COLORS.doorLocked;
    const size = 24;

    ctx.fillStyle = color;
    if (dir === 'up' || dir === 'down') {
        ctx.fillRect(x - size, y - 8, size * 2, 16);
    } else {
        ctx.fillRect(x - 8, y - size, 16, size * 2);
    }

    // Door frame
    ctx.strokeStyle = open ? '#66aa66' : '#aa6666';
    ctx.lineWidth = 2;
    if (dir === 'up' || dir === 'down') {
        ctx.strokeRect(x - size, y - 8, size * 2, 16);
    } else {
        ctx.strokeRect(x - 8, y - size, 16, size * 2);
    }
}

function drawUI() {
    // UI background
    ctx.fillStyle = COLORS.bgDark;
    ctx.fillRect(0, 0, canvas.width, UI_HEIGHT);

    // Weapon box (left)
    const weaponBoxX = 20;
    const weaponBoxY = 8;
    const weaponBoxW = 80;
    const weaponBoxH = 44;

    ctx.strokeStyle = COLORS.ui;
    ctx.lineWidth = 2;
    ctx.strokeRect(weaponBoxX, weaponBoxY, weaponBoxW, weaponBoxH);

    // Weapon icon
    const weapon = WEAPONS[player.weapon];
    ctx.fillStyle = weapon.color;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(weapon.name.substring(0, 8), weaponBoxX + weaponBoxW / 2, weaponBoxY + 20);

    // Ammo display
    if (weapon.ammo !== Infinity) {
        ctx.fillStyle = COLORS.ui;
        ctx.fillText(player.ammo[player.weapon], weaponBoxX + weaponBoxW / 2, weaponBoxY + 35);
    } else {
        ctx.fillStyle = COLORS.ui;
        ctx.fillText('∞', weaponBoxX + weaponBoxW / 2, weaponBoxY + 35);
    }

    // Keyword
    if (player.weaponKeyword) {
        ctx.fillStyle = '#ffaa00';
        ctx.font = '8px monospace';
        ctx.fillText(player.weaponKeyword, weaponBoxX + weaponBoxW / 2, weaponBoxY + weaponBoxH - 2);
    }

    // Bombs below weapon box
    ctx.fillStyle = COLORS.bomb;
    for (let i = 0; i < player.bombs; i++) {
        ctx.beginPath();
        ctx.arc(weaponBoxX + 10 + i * 12, weaponBoxY + weaponBoxH + 10, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Health (center)
    const healthX = canvas.width / 2 - 60;
    const healthY = 20;

    ctx.fillStyle = COLORS.health;
    for (let i = 0; i < player.maxHp; i++) {
        const x = healthX + i * 16;
        if (i < player.hp) {
            // Full heart
            ctx.beginPath();
            ctx.moveTo(x + 6, y = healthY + 3);
            ctx.bezierCurveTo(x + 6, healthY, x, healthY, x, healthY + 4);
            ctx.bezierCurveTo(x, healthY + 8, x + 6, healthY + 12, x + 6, healthY + 14);
            ctx.bezierCurveTo(x + 6, healthY + 12, x + 12, healthY + 8, x + 12, healthY + 4);
            ctx.bezierCurveTo(x + 12, healthY, x + 6, healthY, x + 6, healthY + 3);
            ctx.fill();
        } else {
            // Empty heart
            ctx.strokeStyle = COLORS.healthEmpty;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 6, healthY + 3);
            ctx.bezierCurveTo(x + 6, healthY, x, healthY, x, healthY + 4);
            ctx.bezierCurveTo(x, healthY + 8, x + 6, healthY + 12, x + 6, healthY + 14);
            ctx.bezierCurveTo(x + 6, healthY + 12, x + 12, healthY + 8, x + 12, healthY + 4);
            ctx.bezierCurveTo(x + 12, healthY, x + 6, healthY, x + 6, healthY + 3);
            ctx.stroke();
        }
    }

    // Shields
    ctx.fillStyle = COLORS.shield;
    for (let i = 0; i < player.shields; i++) {
        ctx.fillRect(healthX + i * 16, healthY + 20, 12, 12);
    }

    // Multiplier and debris (right)
    const rightX = canvas.width - 120;

    ctx.strokeStyle = COLORS.ui;
    ctx.lineWidth = 2;
    ctx.strokeRect(rightX, 8, 100, 44);

    // Multiplier
    ctx.fillStyle = COLORS.multiplier;
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('x' + multiplier.toFixed(1), rightX + 90, 28);

    // Debris (currency)
    ctx.fillStyle = COLORS.currency;
    ctx.fillText(debris + 'G', rightX + 90, 45);

    // Minimap
    drawMinimap();

    // Floor indicator
    ctx.fillStyle = COLORS.ui;
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('FLOOR ' + currentFloor, 120, 20);
}

function drawMinimap() {
    const mapX = canvas.width - 60;
    const mapY = 8;
    const roomSize = 8;
    const padding = 2;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(mapX - 5, mapY - 5, 55, 55);

    ctx.strokeStyle = COLORS.ui;
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX - 5, mapY - 5, 55, 55);

    // Rooms
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            if (floorMap[y] && floorMap[y][x] > 0) {
                const rx = mapX + x * (roomSize + padding);
                const ry = mapY + y * (roomSize + padding);

                const key = x + ',' + y;
                const room = rooms[key];

                if (x === currentRoom.x && y === currentRoom.y) {
                    ctx.fillStyle = COLORS.ui;
                } else if (room && room.cleared) {
                    ctx.fillStyle = '#446644';
                } else if (floorMap[y][x] === 2) {
                    ctx.fillStyle = '#884444';
                } else {
                    ctx.fillStyle = '#444444';
                }

                ctx.fillRect(rx, ry, roomSize, roomSize);
            }
        }
    }
}

function drawBullets() {
    for (const b of bullets) {
        if (b.laser) {
            // Laser beam
            ctx.strokeStyle = b.color;
            ctx.lineWidth = b.size;
            ctx.globalAlpha = b.life / 5;
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x + b.vx * 800, b.y + b.vy * 800);
            ctx.stroke();
            ctx.globalAlpha = 1;
            continue;
        }

        if (b.fireball) {
            // Fireball with glow
            const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size);
            gradient.addColorStop(0, COLORS.fireballCore);
            gradient.addColorStop(0.5, COLORS.fireball);
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();

            if (b.homing) {
                // Homing trail
                ctx.strokeStyle = COLORS.bulletHoming;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.size + 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawPickups() {
    for (const p of pickups) {
        const bob = Math.sin(frameCount * 0.1) * 3;

        switch (p.type) {
            case 'health':
                ctx.fillStyle = COLORS.health;
                ctx.beginPath();
                const x = p.x, y = p.y + bob;
                ctx.moveTo(x, y - 4);
                ctx.bezierCurveTo(x, y - 8, x - 8, y - 8, x - 8, y - 2);
                ctx.bezierCurveTo(x - 8, y + 4, x, y + 8, x, y + 10);
                ctx.bezierCurveTo(x, y + 8, x + 8, y + 4, x + 8, y - 2);
                ctx.bezierCurveTo(x + 8, y - 8, x, y - 8, x, y - 4);
                ctx.fill();
                break;

            case 'ammo':
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(p.x - 4, p.y + bob - 6, 8, 12);
                ctx.fillStyle = '#ffcc44';
                ctx.fillRect(p.x - 2, p.y + bob - 4, 4, 3);
                break;

            case 'bomb':
                ctx.fillStyle = COLORS.bomb;
                ctx.beginPath();
                ctx.arc(p.x, p.y + bob, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffcc00';
                ctx.fillRect(p.x - 1, p.y + bob - 12, 2, 6);
                break;

            case 'stairs':
                ctx.fillStyle = '#888';
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(p.x - 12 + i * 4, p.y + bob - i * 4, 24 - i * 8, 4);
                }
                ctx.fillStyle = '#aaa';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('NEXT', p.x, p.y + bob + 20);
                break;
        }
    }
}

function drawFloatingTexts() {
    for (const t of floatingTexts) {
        ctx.globalAlpha = t.life / 40;
        ctx.fillStyle = t.color;
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
}

function drawDebugOverlay() {
    if (!debugMode) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, PLAY_AREA_Y + 10, 200, 180);

    ctx.fillStyle = COLORS.ui;
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const lines = [
        'DEBUG MODE (Q to toggle)',
        '------------------------',
        `FPS: ${fps.toFixed(1)}`,
        `Player: (${Math.floor(player.x)}, ${Math.floor(player.y)})`,
        `HP: ${player.hp}/${player.maxHp}`,
        `Weapon: ${player.weapon}`,
        `Ammo: ${player.ammo[player.weapon]}`,
        `Bombs: ${player.bombs}`,
        `Enemies: ${enemies.length}`,
        `Bullets: ${bullets.length}`,
        `Room: (${currentRoom.x}, ${currentRoom.y})`,
        `Floor: ${currentFloor}`,
        `Multiplier: x${multiplier.toFixed(2)}`,
        `Debris: ${debris}G`
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, 20, PLAY_AREA_Y + 25 + i * 12);
    });
}

function drawMenu() {
    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    for (let i = 0; i < 100; i++) {
        const seed = i * 1234.5678;
        const x = (seed * 7) % canvas.width;
        const y = (seed * 13) % canvas.height;
        const bright = ((seed * 17) % 100) / 100;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + bright * 0.7})`;
        ctx.fillRect(Math.floor(x), Math.floor(y), 2, 2);
    }

    // Title
    ctx.fillStyle = COLORS.ui;
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STAR OF PROVIDENCE', canvas.width / 2, 150);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('A Bullet Hell Roguelike', canvas.width / 2, 180);

    // Ship preview
    ctx.save();
    ctx.translate(canvas.width / 2, 280);
    ctx.scale(3, 3);
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-8, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Instructions
    ctx.fillStyle = COLORS.ui;
    ctx.font = '14px monospace';
    const instructions = [
        'WASD / Arrows - Move',
        'Mouse / Space - Shoot',
        'Shift - Focus (precise dodge)',
        'Z/Q - Dash',
        'X - Bomb',
        '',
        'Press SPACE to start'
    ];

    instructions.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, 380 + i * 22);
    });

    // Version
    ctx.fillStyle = '#444';
    ctx.font = '10px monospace';
    ctx.fillText('v1.0 - Canvas Clone', canvas.width / 2, canvas.height - 20);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = COLORS.ui;
    ctx.font = '18px monospace';
    ctx.fillText(`Floor ${currentFloor} - ${debris}G collected`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText(`Multiplier: x${multiplier.toFixed(1)}`, canvas.width / 2, canvas.height / 2 + 50);

    ctx.font = '14px monospace';
    ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 100);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = COLORS.ui;
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = '#ffff00';
    ctx.font = '18px monospace';
    ctx.fillText('You defeated the Core Guardian!', canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText(`Final Score: ${debris}G`, canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText(`Max Multiplier: x${multiplier.toFixed(1)}`, canvas.width / 2, canvas.height / 2 + 70);

    ctx.font = '14px monospace';
    ctx.fillStyle = COLORS.ui;
    ctx.fillText('Press SPACE to play again', canvas.width / 2, canvas.height / 2 + 120);
}

// Main game loop
function gameLoop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    frameCount++;

    // FPS calculation
    fps = 1 / dt;

    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Screen shake
    if (screenShake > 0) {
        ctx.save();
        ctx.translate(
            (Math.random() - 0.5) * screenShake,
            (Math.random() - 0.5) * screenShake
        );
        screenShake--;
    }

    switch (gameState) {
        case 'menu':
            drawMenu();
            break;

        case 'playing':
            // Update
            player.update(dt);
            enemies.forEach(e => e.update(dt));
            updateBullets(dt);
            updateParticles(dt);
            updateFloatingTexts(dt);
            updatePickups(dt);
            updateMultiplier(dt);
            checkRoomTransition();
            checkBossDefeat();
            checkRoomClear();

            // Draw
            drawRoom();
            drawPickups();
            drawBullets();
            enemies.forEach(e => e.draw());
            player.draw();
            drawParticles();
            drawFloatingTexts();
            drawUI();
            drawDebugOverlay();
            break;

        case 'salvage':
            // Draw the room in background
            drawRoom();
            drawPickups();
            player.draw();
            drawUI();
            // Draw salvage selection overlay
            drawSalvageSelection();
            break;

        case 'gameover':
            drawRoom();
            drawBullets();
            enemies.forEach(e => e.draw());
            player.draw();
            drawParticles();
            drawUI();
            drawGameOver();
            break;

        case 'victory':
            drawRoom();
            player.draw();
            drawUI();
            drawVictory();
            break;
    }

    if (screenShake > 0) {
        ctx.restore();
    }

    requestAnimationFrame(gameLoop);
}

// Input handlers
document.addEventListener('keydown', e => {
    keys[e.code] = true;

    if (e.code === 'KeyQ' && gameState === 'playing') {
        debugMode = !debugMode;
    }

    if (e.code === 'Space') {
        if (gameState === 'menu') {
            startGame();
        } else if (gameState === 'gameover' || gameState === 'victory') {
            startGame();
        }
    }

    // Weapon switch with number keys
    if (gameState === 'playing') {
        const weaponKeys = { 'Digit1': 'peashooter', 'Digit2': 'vulcan', 'Digit3': 'laser', 'Digit4': 'fireball', 'Digit5': 'revolver', 'Digit6': 'sword' };
        if (weaponKeys[e.code] && player.ammo[weaponKeys[e.code]] > 0) {
            player.weapon = weaponKeys[e.code];
        }
    }

    e.preventDefault();
});

document.addEventListener('keyup', e => {
    keys[e.code] = false;
});

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', e => {
    if (e.button === 0) {
        mouse.down = true;
        handleSalvageClick();
    }
    if (e.button === 2) mouse.right = true;
});

canvas.addEventListener('mouseup', e => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.right = false;
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

// Start game
function startGame() {
    gameState = 'playing';
    player = new Player();
    enemies = [];
    bullets = [];
    particles = [];
    floatingTexts = [];
    pickups = [];
    currentFloor = 1;
    debris = 0;
    multiplier = 1.0;
    multiplierTimer = 0;
    roomsCleared = 0;
    bossDefeated = false;

    generateFloor();
    enterRoom(2, 2);
}

// Initialize
requestAnimationFrame(gameLoop);
