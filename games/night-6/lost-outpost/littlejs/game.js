// Lost Outpost - Survival Horror Shooter
// Built with LittleJS - Night 6 Implementation
'use strict';

// ==================== CONSTANTS ====================
const TILE_SIZE = 32;
const PLAYER_SPEED = 3;
const FLASHLIGHT_RANGE = 10;
const FLASHLIGHT_ANGLE = Math.PI / 4;

// Colors
const COLOR_FLOOR = new Color(0.08, 0.08, 0.1);
const COLOR_WALL = new Color(0.15, 0.15, 0.18);
const COLOR_PLAYER = new Color(0.2, 0.6, 0.2);
const COLOR_SCORPION = new Color(0.6, 0.3, 0.1);
const COLOR_ARACHNID = new Color(0.4, 0.2, 0.3);
const COLOR_LASER_ENEMY = new Color(0.3, 0.7, 0.3);
const COLOR_BULLET = new Color(1, 0.8, 0.2);
const COLOR_ENEMY_BULLET = new Color(0.3, 1, 0.3);
const COLOR_HEALTH = new Color(1, 0.2, 0.2);
const COLOR_AMMO = new Color(0.8, 0.8, 0.2);
const COLOR_FLASHLIGHT = new Color(1, 0.95, 0.8, 0.3);

// ==================== GAME STATE ====================
let gameState = 'playing';
let gamePaused = true;
let player = null;
let enemies = [];
let bullets = [];
let enemyBullets = [];
let pickups = [];
let floatingTexts = [];
let particles = [];

// Level
let levelData = [];
const LEVEL_WIDTH = 40;
const LEVEL_HEIGHT = 30;

// Player stats
let playerStats = {
    hp: 100,
    maxHp: 100,
    ammo: 30,
    maxAmmo: 30,
    totalAmmo: 120,
    credits: 0,
    kills: 0
};

let shootCooldown = 0;
let reloadTimer = 0;
let isReloading = false;
const FIRE_RATE = 0.12;
const RELOAD_TIME = 1.5;
const DAMAGE = 15;

// Simulated input
let simulatedKeys = new Set();

// ==================== LEVEL GENERATION ====================
function generateLevel() {
    levelData = [];
    enemies = [];
    bullets = [];
    enemyBullets = [];
    pickups = [];

    // Initialize with walls
    for (let y = 0; y < LEVEL_HEIGHT; y++) {
        levelData[y] = [];
        for (let x = 0; x < LEVEL_WIDTH; x++) {
            levelData[y][x] = 1;
        }
    }

    // Create rooms using BSP-like approach
    const rooms = [];

    // Main rooms
    rooms.push({ x: 2, y: 2, w: 8, h: 6 }); // Start
    rooms.push({ x: 14, y: 2, w: 10, h: 8 });
    rooms.push({ x: 28, y: 2, w: 8, h: 7 });
    rooms.push({ x: 2, y: 12, w: 10, h: 8 });
    rooms.push({ x: 16, y: 14, w: 12, h: 10 });
    rooms.push({ x: 30, y: 12, w: 8, h: 10 });
    rooms.push({ x: 2, y: 22, w: 12, h: 6 });
    rooms.push({ x: 18, y: 24, w: 10, h: 4 });

    // Carve rooms
    for (const room of rooms) {
        for (let y = room.y; y < room.y + room.h && y < LEVEL_HEIGHT; y++) {
            for (let x = room.x; x < room.x + room.w && x < LEVEL_WIDTH; x++) {
                levelData[y][x] = 0;
            }
        }
    }

    // Connect rooms with corridors
    for (let i = 0; i < rooms.length - 1; i++) {
        const r1 = rooms[i];
        const r2 = rooms[i + 1];
        const x1 = Math.floor(r1.x + r1.w / 2);
        const y1 = Math.floor(r1.y + r1.h / 2);
        const x2 = Math.floor(r2.x + r2.w / 2);
        const y2 = Math.floor(r2.y + r2.h / 2);

        // Horizontal then vertical
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            if (y1 >= 0 && y1 < LEVEL_HEIGHT) levelData[y1][x] = 0;
            if (y1 + 1 < LEVEL_HEIGHT) levelData[y1 + 1][x] = 0;
        }
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            if (x2 >= 0 && x2 < LEVEL_WIDTH) levelData[y][x2] = 0;
            if (x2 + 1 < LEVEL_WIDTH) levelData[y][x2 + 1] = 0;
        }
    }

    // Spawn player in first room
    player = new Player(vec2(rooms[0].x + rooms[0].w/2, rooms[0].y + rooms[0].h/2));

    // Spawn enemies in other rooms
    for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];
        const numEnemies = 2 + Math.floor(i * 0.8);

        for (let j = 0; j < numEnemies; j++) {
            const ex = room.x + 1 + rand() * (room.w - 2);
            const ey = room.y + 1 + rand() * (room.h - 2);

            const roll = rand();
            let type = 'scorpion';
            if (i > 4 && roll < 0.2) type = 'laser';
            else if (i > 2 && roll < 0.4) type = 'arachnid';
            else if (roll < 0.3) type = 'small';

            enemies.push(new Enemy(vec2(ex, ey), type));
        }

        // Pickups
        if (rand() < 0.6) {
            pickups.push({
                pos: vec2(room.x + rand() * room.w, room.y + rand() * room.h),
                type: rand() < 0.5 ? 'health' : 'ammo'
            });
        }
    }
}

// ==================== COLLISION ====================
function isWall(x, y) {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (tx < 0 || tx >= LEVEL_WIDTH || ty < 0 || ty >= LEVEL_HEIGHT) return true;
    return levelData[ty] && levelData[ty][tx] === 1;
}

function hasLineOfSight(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const steps = Math.ceil(dist * 2);

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        if (isWall(x1 + dx * t, y1 + dy * t)) return false;
    }
    return true;
}

// ==================== FLASHLIGHT VISIBILITY ====================
function isInFlashlight(pos) {
    if (!player) return false;

    const toPos = pos.subtract(player.pos);
    const dist = toPos.length();
    if (dist > FLASHLIGHT_RANGE) return false;

    // Check angle
    const angle = Math.atan2(toPos.y, toPos.x);
    const playerAngle = player.angle;
    let angleDiff = Math.abs(angle - playerAngle);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

    if (angleDiff > FLASHLIGHT_ANGLE) return false;

    // Check line of sight
    return hasLineOfSight(player.pos.x, player.pos.y, pos.x, pos.y);
}

// ==================== PLAYER ====================
class Player {
    constructor(pos) {
        this.pos = pos;
        this.angle = 0;
        this.invincibleTimer = 0;
    }

    update() {
        if (gamePaused) return;

        // Timers
        if (this.invincibleTimer > 0) this.invincibleTimer -= 1/60;
        if (shootCooldown > 0) shootCooldown -= 1/60;

        // Movement
        let moveDir = vec2(0, 0);
        if (isKeyHeld('w') || isKeyHeld('ArrowUp')) moveDir.y += 1;
        if (isKeyHeld('s') || isKeyHeld('ArrowDown')) moveDir.y -= 1;
        if (isKeyHeld('a') || isKeyHeld('ArrowLeft')) moveDir.x -= 1;
        if (isKeyHeld('d') || isKeyHeld('ArrowRight')) moveDir.x += 1;

        if (moveDir.length() > 0) {
            moveDir = moveDir.normalize();
            const newPos = this.pos.add(moveDir.scale(PLAYER_SPEED / 60));

            // Wall collision
            if (!isWall(newPos.x - 0.3, this.pos.y) && !isWall(newPos.x + 0.3, this.pos.y)) {
                this.pos.x = newPos.x;
            }
            if (!isWall(this.pos.x, newPos.y - 0.3) && !isWall(this.pos.x, newPos.y + 0.3)) {
                this.pos.y = newPos.y;
            }
        }

        // Aiming - auto-aim at nearest enemy when shooting, or use mouse
        let hasTarget = false;
        if (isKeyHeld('Space') && enemies.length > 0) {
            // Auto-aim at nearest visible enemy
            let nearestDist = Infinity;
            let nearestEnemy = null;
            for (const enemy of enemies) {
                const dist = this.pos.subtract(enemy.pos).length();
                if (dist < nearestDist && dist < 15) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            }
            if (nearestEnemy) {
                const toEnemy = nearestEnemy.pos.subtract(this.pos);
                this.angle = Math.atan2(toEnemy.y, toEnemy.x);
                hasTarget = true;
            }
        }

        if (!hasTarget) {
            // Fall back to mouse aiming
            const mouseWorld = screenToWorld(mousePos);
            const aimDir = mouseWorld.subtract(this.pos);
            if (aimDir.length() > 0.1) {
                this.angle = Math.atan2(aimDir.y, aimDir.x);
            }
        }

        // Shooting
        if ((mouseIsDown(0) || isKeyHeld('Space')) && !isReloading && shootCooldown <= 0) {
            this.shoot();
        }

        // Reload
        if (isKeyHeld('r') && !isReloading && playerStats.ammo < playerStats.maxAmmo && playerStats.totalAmmo > 0) {
            this.startReload();
        }

        if (isReloading) {
            reloadTimer -= 1/60;
            if (reloadTimer <= 0) {
                this.finishReload();
            }
        }

        // Pickup collection
        this.checkPickups();
    }

    shoot() {
        if (playerStats.ammo <= 0) {
            this.startReload();
            return;
        }

        playerStats.ammo--;
        shootCooldown = FIRE_RATE;

        const dir = vec2(Math.cos(this.angle), Math.sin(this.angle));
        bullets.push({
            pos: this.pos.add(dir.scale(0.5)),
            vel: dir.scale(15),
            damage: DAMAGE,
            life: 2
        });

        // Muzzle flash
        particles.push({
            pos: this.pos.add(dir.scale(0.6)),
            vel: vec2(0, 0),
            color: new Color(1, 0.8, 0.3),
            life: 0.05,
            size: 0.3
        });
    }

    startReload() {
        if (isReloading || playerStats.totalAmmo <= 0) return;
        isReloading = true;
        reloadTimer = RELOAD_TIME;
        addFloatingText(this.pos.x, this.pos.y + 0.8, 'Reloading...', new Color(0.8, 0.8, 0.8));
    }

    finishReload() {
        const needed = playerStats.maxAmmo - playerStats.ammo;
        const toLoad = Math.min(needed, playerStats.totalAmmo);
        playerStats.ammo += toLoad;
        playerStats.totalAmmo -= toLoad;
        isReloading = false;
    }

    checkPickups() {
        for (let i = pickups.length - 1; i >= 0; i--) {
            const p = pickups[i];
            const dist = this.pos.subtract(p.pos).length();
            if (dist < 0.8) {
                if (p.type === 'health' && playerStats.hp < playerStats.maxHp) {
                    playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + 25);
                    addFloatingText(p.pos.x, p.pos.y, '+25 HP', COLOR_HEALTH);
                    pickups.splice(i, 1);
                } else if (p.type === 'ammo') {
                    playerStats.totalAmmo += 30;
                    addFloatingText(p.pos.x, p.pos.y, '+30 Ammo', COLOR_AMMO);
                    pickups.splice(i, 1);
                }
            }
        }
    }

    takeDamage(amount) {
        if (this.invincibleTimer > 0) return;

        playerStats.hp -= amount;
        this.invincibleTimer = 0.5;
        addFloatingText(this.pos.x, this.pos.y + 0.5, `-${amount}`, COLOR_HEALTH);

        if (playerStats.hp <= 0) {
            gameState = 'gameover';
        }
    }

    render() {
        if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 10) % 2 === 0) return;

        // Body
        drawRect(this.pos, vec2(0.6, 0.6), COLOR_PLAYER);

        // Gun direction
        const gunDir = vec2(Math.cos(this.angle), Math.sin(this.angle));
        const gunTip = this.pos.add(gunDir.scale(0.5));
        drawRect(gunTip, vec2(0.35, 0.15), new Color(0.3, 0.3, 0.3), this.angle);
    }
}

// ==================== ENEMY ====================
class Enemy {
    constructor(pos, type) {
        this.pos = pos;
        this.type = type;
        this.angle = rand(0, Math.PI * 2);
        this.alerted = false;
        this.alertTimer = 0;
        this.attackCooldown = 0;

        switch (type) {
            case 'scorpion':
                this.hp = 30;
                this.maxHp = 30;
                this.speed = 2;
                this.damage = 15;
                this.color = COLOR_SCORPION;
                this.size = 0.5;
                this.points = 50;
                break;
            case 'small':
                this.hp = 15;
                this.maxHp = 15;
                this.speed = 3.5;
                this.damage = 8;
                this.color = COLOR_SCORPION.lerp(new Color(0.3, 0.2, 0.1), 0.3);
                this.size = 0.35;
                this.points = 30;
                break;
            case 'arachnid':
                this.hp = 60;
                this.maxHp = 60;
                this.speed = 1.5;
                this.damage = 25;
                this.color = COLOR_ARACHNID;
                this.size = 0.7;
                this.points = 100;
                break;
            case 'laser':
                this.hp = 25;
                this.maxHp = 25;
                this.speed = 1.2;
                this.damage = 12;
                this.color = COLOR_LASER_ENEMY;
                this.size = 0.5;
                this.points = 80;
                this.isRanged = true;
                break;
        }
    }

    update() {
        if (gamePaused || !player) return;

        const toPlayer = player.pos.subtract(this.pos);
        const dist = toPlayer.length();

        // Update facing
        if (toPlayer.length() > 0.1) {
            this.angle = Math.atan2(toPlayer.y, toPlayer.x);
        }

        // Alert when player is close or in flashlight
        const canSee = dist < 3 || (isInFlashlight(this.pos) && hasLineOfSight(this.pos.x, this.pos.y, player.pos.x, player.pos.y));
        if (canSee || shootCooldown > 0 && dist < 12) {
            this.alerted = true;
            this.alertTimer = 5;
        }

        if (this.alertTimer > 0) {
            this.alertTimer -= 1/60;
        } else {
            this.alerted = false;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= 1/60;

        if (this.alerted) {
            if (this.isRanged) {
                // Ranged enemy - keep distance and shoot
                if (dist < 4) {
                    this.move(toPlayer.normalize().scale(-1));
                } else if (dist > 8) {
                    this.move(toPlayer.normalize());
                }

                if (dist < 12 && this.attackCooldown <= 0 && hasLineOfSight(this.pos.x, this.pos.y, player.pos.x, player.pos.y)) {
                    this.rangedAttack();
                }
            } else {
                // Melee enemy - charge
                if (dist < 1) {
                    if (this.attackCooldown <= 0) {
                        this.meleeAttack();
                    }
                } else {
                    this.move(toPlayer.normalize());
                }
            }
        }
    }

    move(dir) {
        const newPos = this.pos.add(dir.scale(this.speed / 60));

        // Wall collision with sliding
        if (!isWall(newPos.x, this.pos.y)) {
            this.pos.x = newPos.x;
        }
        if (!isWall(this.pos.x, newPos.y)) {
            this.pos.y = newPos.y;
        }
    }

    meleeAttack() {
        player.takeDamage(this.damage);
        this.attackCooldown = 1.0;
    }

    rangedAttack() {
        const dir = player.pos.subtract(this.pos).normalize();
        enemyBullets.push({
            pos: this.pos.add(dir.scale(0.5)),
            vel: dir.scale(6),
            damage: this.damage,
            life: 4
        });
        this.attackCooldown = 1.5;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.alerted = true;
        this.alertTimer = 5;

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        const idx = enemies.indexOf(this);
        if (idx >= 0) enemies.splice(idx, 1);

        playerStats.kills++;
        playerStats.credits += this.points;
        addFloatingText(this.pos.x, this.pos.y, `+${this.points}`, new Color(1, 1, 0));

        // Death particles
        for (let i = 0; i < 10; i++) {
            particles.push({
                pos: this.pos.copy(),
                vel: vec2(rand(-2, 2), rand(-2, 2)),
                color: this.color,
                life: 0.5,
                size: rand(0.15, 0.3)
            });
        }

        // Chance to drop pickup
        if (rand() < 0.2) {
            pickups.push({
                pos: this.pos.copy(),
                type: rand() < 0.4 ? 'health' : 'ammo'
            });
        }
    }

    render() {
        // Only render if in flashlight or very close
        if (!isInFlashlight(this.pos) && player && this.pos.subtract(player.pos).length() > 3) {
            // Show red eyes in darkness if alerted
            if (this.alerted) {
                drawRect(this.pos.add(vec2(-0.15, 0.1)), vec2(0.1, 0.1), new Color(1, 0, 0));
                drawRect(this.pos.add(vec2(0.15, 0.1)), vec2(0.1, 0.1), new Color(1, 0, 0));
            }
            return;
        }

        // Body
        const healthPct = this.hp / this.maxHp;
        const color = this.color.lerp(new Color(0.2, 0.1, 0.1), 1 - healthPct);
        drawRect(this.pos, vec2(this.size * 2, this.size * 2), color, this.angle);

        // Health bar for bigger enemies
        if (this.type === 'arachnid' && this.hp < this.maxHp) {
            drawRect(this.pos.add(vec2(0, -this.size - 0.3)), vec2(1, 0.15), new Color(0.3, 0.3, 0.3));
            drawRect(this.pos.add(vec2(0, -this.size - 0.3)), vec2(healthPct, 0.15), COLOR_HEALTH);
        }
    }
}

// ==================== BULLETS & PARTICLES ====================
function updateBullets() {
    // Player bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.pos = b.pos.add(b.vel.scale(1/60));
        b.life -= 1/60;

        if (b.life <= 0 || isWall(b.pos.x, b.pos.y)) {
            bullets.splice(i, 1);
            continue;
        }

        for (const enemy of enemies) {
            const dist = b.pos.subtract(enemy.pos).length();
            if (dist < enemy.size + 0.1) {
                enemy.takeDamage(b.damage);
                bullets.splice(i, 1);
                break;
            }
        }
    }

    // Enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.pos = b.pos.add(b.vel.scale(1/60));
        b.life -= 1/60;

        if (b.life <= 0 || isWall(b.pos.x, b.pos.y)) {
            enemyBullets.splice(i, 1);
            continue;
        }

        if (player) {
            const dist = b.pos.subtract(player.pos).length();
            if (dist < 0.4) {
                player.takeDamage(b.damage);
                enemyBullets.splice(i, 1);
            }
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.pos = p.pos.add(p.vel.scale(1/60));
        p.life -= 1/60;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// ==================== FLOATING TEXT ====================
function addFloatingText(x, y, text, color) {
    floatingTexts.push({
        pos: vec2(x, y),
        text,
        color: color || new Color(1, 1, 1),
        life: 1.5,
        vy: 1.5
    });
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.pos.y += ft.vy / 60;
        ft.life -= 1/60;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
}

// ==================== INPUT ====================
function isKeyHeld(key) {
    const keyLower = key.toLowerCase();
    if (simulatedKeys.has(keyLower) || simulatedKeys.has(key)) return true;

    const keyMap = {
        'w': 'KeyW', 'a': 'KeyA', 's': 'KeyS', 'd': 'KeyD',
        'r': 'KeyR', 'shift': 'ShiftLeft', 'Shift': 'ShiftLeft',
        ' ': 'Space', 'Space': 'Space', 'space': 'Space'
    };

    const mappedKey = keyMap[key] || keyMap[keyLower] || key;
    if (simulatedKeys.has(mappedKey) || simulatedKeys.has(mappedKey.toLowerCase())) return true;

    return keyIsDown(mappedKey) || keyIsDown(key);
}

// ==================== RENDERING ====================
function renderGame() {
    // Dark background
    drawRect(vec2(LEVEL_WIDTH/2, LEVEL_HEIGHT/2), vec2(LEVEL_WIDTH, LEVEL_HEIGHT), new Color(0, 0, 0));

    // Draw level tiles
    for (let y = 0; y < LEVEL_HEIGHT; y++) {
        for (let x = 0; x < LEVEL_WIDTH; x++) {
            const tile = levelData[y] ? levelData[y][x] : 1;
            const tilePos = vec2(x + 0.5, y + 0.5);

            // Only draw what's in flashlight range
            const inLight = isInFlashlight(tilePos);
            const distToPlayer = player ? tilePos.subtract(player.pos).length() : 100;
            const visible = inLight || distToPlayer < 2;

            if (!visible) continue;

            const lightFactor = inLight ? Math.max(0.3, 1 - distToPlayer / FLASHLIGHT_RANGE) : 0.4;

            if (tile === 0) {
                drawRect(tilePos, vec2(1, 1), COLOR_FLOOR.scale(lightFactor));
            } else {
                drawRect(tilePos, vec2(1, 1), COLOR_WALL.scale(lightFactor));
            }
        }
    }

    // Flashlight cone (visual effect)
    if (player) {
        const segments = 20;
        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const angle = player.angle - FLASHLIGHT_ANGLE + t * FLASHLIGHT_ANGLE * 2;
            const endPoint = player.pos.add(vec2(Math.cos(angle), Math.sin(angle)).scale(FLASHLIGHT_RANGE));
            const alpha = 0.1 * (1 - t * 0.5);
            drawRect(player.pos.lerp(endPoint, 0.5), vec2(0.3, FLASHLIGHT_RANGE), new Color(1, 1, 0.8, alpha), angle);
        }
    }

    // Pickups
    for (const p of pickups) {
        if (!isInFlashlight(p.pos) && (!player || p.pos.subtract(player.pos).length() > 2)) continue;
        const color = p.type === 'health' ? COLOR_HEALTH : COLOR_AMMO;
        const pulse = 1 + Math.sin(Date.now() / 200) * 0.15;
        drawRect(p.pos, vec2(0.4 * pulse, 0.4 * pulse), color);
    }

    // Player bullets
    for (const b of bullets) {
        drawRect(b.pos, vec2(0.15, 0.15), COLOR_BULLET);
    }

    // Enemy bullets
    for (const b of enemyBullets) {
        drawRect(b.pos, vec2(0.2, 0.2), COLOR_ENEMY_BULLET);
    }

    // Enemies
    for (const enemy of enemies) {
        enemy.render();
    }

    // Player
    if (player) player.render();

    // Particles
    for (const p of particles) {
        const alpha = p.life;
        drawRect(p.pos, vec2(p.size, p.size), p.color.scale(alpha));
    }

    // Floating texts
    for (const ft of floatingTexts) {
        const alpha = Math.min(1, ft.life);
        drawText(ft.text, ft.pos, 0.35, ft.color.scale(alpha));
    }
}

function renderHUD() {
    const sw = mainCanvasSize.x;
    const sh = mainCanvasSize.y;

    // Health bar
    const hpPct = playerStats.hp / playerStats.maxHp;
    drawRect(screenToWorld(vec2(120, 30)), vec2(200/cameraScale, 20/cameraScale), new Color(0.2, 0.2, 0.2));
    drawRect(screenToWorld(vec2(20 + 100 * hpPct, 30)), vec2(200 * hpPct / cameraScale, 20/cameraScale), COLOR_HEALTH);
    drawText(`HP: ${playerStats.hp}/${playerStats.maxHp}`, screenToWorld(vec2(120, 30)), 0.35, new Color(1, 1, 1));

    // Ammo
    drawText(`AMMO: ${playerStats.ammo}/${playerStats.maxAmmo} | ${playerStats.totalAmmo}`, screenToWorld(vec2(120, 60)), 0.35, COLOR_AMMO);

    if (isReloading) {
        drawText('RELOADING...', screenToWorld(vec2(sw/2, sh - 100)), 0.5, new Color(1, 0.8, 0.2));
    }

    // Credits/Score
    drawText(`CREDITS: ${playerStats.credits}`, screenToWorld(vec2(sw - 100, 30)), 0.35, new Color(1, 1, 0));
    drawText(`KILLS: ${playerStats.kills}`, screenToWorld(vec2(sw - 100, 55)), 0.35, new Color(1, 1, 1));

    // Enemy count
    drawText(`ENEMIES: ${enemies.length}`, screenToWorld(vec2(sw - 100, 80)), 0.35, COLOR_SCORPION);

    // Game over
    if (gameState === 'gameover') {
        drawRect(screenToWorld(vec2(sw/2, sh/2)), vec2(sw/cameraScale, sh/cameraScale), new Color(0, 0, 0, 0.8));
        drawText('GAME OVER', screenToWorld(vec2(sw/2, sh/2 - 40)), 1.0, COLOR_HEALTH);
        drawText(`Kills: ${playerStats.kills} | Credits: ${playerStats.credits}`, screenToWorld(vec2(sw/2, sh/2 + 20)), 0.4, new Color(1, 1, 1));
        drawText('Press R to restart', screenToWorld(vec2(sw/2, sh/2 + 60)), 0.35, new Color(0.8, 0.8, 0.8));
    }
}

// ==================== MAIN ====================
function gameInit() {
    canvasFixedSize = vec2(1280, 720);
    cameraScale = 32;
    generateLevel();
    gameState = 'playing';
}

function gameUpdate() {
    if (gamePaused) return;

    if (player) {
        player.update();
        cameraPos = player.pos;
    }

    for (const enemy of [...enemies]) {
        enemy.update();
    }

    updateBullets();
    updateParticles();
    updateFloatingTexts();

    if (keyWasPressed('KeyR') && gameState === 'gameover') {
        restartGame();
    }
}

function gameRender() {
    renderGame();
}

function gameRenderPost() {
    renderHUD();
}

function restartGame() {
    playerStats = {
        hp: 100,
        maxHp: 100,
        ammo: 30,
        maxAmmo: 30,
        totalAmmo: 120,
        credits: 0,
        kills: 0
    };
    isReloading = false;
    shootCooldown = 0;
    floatingTexts = [];
    particles = [];

    generateLevel();
    gameState = 'playing';
}

// ==================== HARNESS ====================
(function() {
    window.harness = {
        pause: () => { gamePaused = true; simulatedKeys.clear(); },
        resume: () => { gamePaused = false; },
        isPaused: () => gamePaused,

        execute: (action, durationMs) => {
            return new Promise(resolve => {
                if (action.keys) {
                    for (const key of action.keys) {
                        simulatedKeys.add(key);
                        simulatedKeys.add(key.toLowerCase());
                    }
                }
                gamePaused = false;
                setTimeout(() => {
                    simulatedKeys.clear();
                    gamePaused = true;
                    resolve();
                }, durationMs);
            });
        },

        getState: () => ({
            gameState,
            player: player ? {
                x: player.pos.x,
                y: player.pos.y,
                hp: playerStats.hp,
                maxHp: playerStats.maxHp,
                ammo: playerStats.ammo
            } : null,
            enemies: enemies.map(e => ({
                x: e.pos.x,
                y: e.pos.y,
                type: e.type,
                hp: e.hp,
                alerted: e.alerted
            })),
            kills: playerStats.kills,
            credits: playerStats.credits
        }),

        getPhase: () => gameState,

        debug: {
            setHealth: hp => { playerStats.hp = hp; },
            clearEnemies: () => { enemies = []; },
            forceStart: () => {
                if (gameState !== 'playing') restartGame();
                gamePaused = false;
            },
            forceGameOver: () => { gameState = 'gameover'; },
            log: msg => console.log('[HARNESS]', msg)
        },

        version: '1.0',
        gameInfo: {
            name: 'Lost Outpost',
            type: 'survival_horror',
            controls: {
                movement: ['w', 'a', 's', 'd'],
                fire: ['Space', 'mouse0'],
                actions: { reload: 'r' }
            }
        }
    };

    console.log('[HARNESS] Lost Outpost initialized');
})();

// ==================== START ====================
engineInit(gameInit, gameUpdate, () => {}, gameRender, gameRenderPost);
