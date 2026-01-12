/*
 * Minishoot Adventures Clone - LittleJS Implementation
 * A twin-stick shooter adventure with exploration
 */

'use strict';

// ============================================================================
// GAME CONSTANTS
// ============================================================================

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 1500;
const ROOM_WIDTH = 800;
const ROOM_HEIGHT = 600;

const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_UP: 'levelUp',
    BOSS: 'boss',
    GAME_OVER: 'gameOver',
    VICTORY: 'victory'
};

// ============================================================================
// GAME DATA
// ============================================================================

const ENEMIES = {
    scout: { hp: 2, speed: 2, damage: 1, fireRate: 1.5, pattern: 'single', xp: 1, color: new Color(0.2, 0.6, 0.8) },
    grasshopper: { hp: 3, speed: 3, damage: 1, fireRate: 2, pattern: 'burst3', xp: 2, color: new Color(0.4, 0.8, 0.3) },
    turret: { hp: 5, speed: 0, damage: 1, fireRate: 2.5, pattern: 'spray8', xp: 3, color: new Color(0.8, 0.4, 0.2) },
    heavy: { hp: 10, speed: 1.2, damage: 2, fireRate: 3, pattern: 'spread5', xp: 5, color: new Color(0.6, 0.2, 0.6) },
    elite: { hp: 15, speed: 2.5, damage: 2, fireRate: 1.5, pattern: 'spiral', xp: 10, color: new Color(0.8, 0.2, 0.8) }
};

const SKILLS = {
    damage: { name: 'Damage', costPerPoint: 1, effectPerPoint: 0.5, max: 10 },
    fireRate: { name: 'Fire Rate', costPerPoint: 1, effectPerPoint: 0.5, max: 10 },
    range: { name: 'Range', costPerPoint: 1, effectPerPoint: 30, max: 10 },
    speed: { name: 'Speed', costPerPoint: 1, effectPerPoint: 0.4, max: 10 },
    critical: { name: 'Critical', costPerPoint: 2, effectPerPoint: 0.05, max: 5 }
};

// ============================================================================
// GAME STATE
// ============================================================================

let currentGameState = GameState.MENU;
let gamePlayer = null;
let gameEnemies = [];
let playerBullets = [];
let enemyBullets = [];
let crystals = [];
let particles = [];

let currentRoom = { x: 0, y: 0 };
let roomCleared = {};
let bossDefeated = false;

let uiMouseX = 0;
let uiMouseY = 0;
let aimAngle = 0;
let screenShake = 0;
let totalKills = 0;

// ============================================================================
// PLAYER CLASS
// ============================================================================

class Player {
    constructor() {
        this.pos = vec2(ROOM_WIDTH / 2, ROOM_HEIGHT / 2);
        this.radius = 0.3;

        // Stats
        this.maxHealth = 3;
        this.health = 3;
        this.maxEnergy = 4;
        this.energy = 4;

        this.baseDamage = 1;
        this.baseFireRate = 3;
        this.baseRange = 300;
        this.baseSpeed = 4;
        this.critChance = 0;

        // Skills
        this.skillPoints = 0;
        this.skills = { damage: 0, fireRate: 0, range: 0, speed: 0, critical: 0 };

        // XP
        this.xp = 0;
        this.level = 1;

        // Abilities - supershot unlocked by default, dash unlocked after boss
        this.abilities = { dash: false, supershot: true };
        this.dashCooldown = 0;
        this.fireCooldown = 0;
        this.invincibleTimer = 0;
        this.isDashing = false;
        this.dashTimer = 0;

        // Currency
        this.crystalCount = 0;
    }

    getDamage() { return this.baseDamage + this.skills.damage * SKILLS.damage.effectPerPoint; }
    getFireRate() { return this.baseFireRate + this.skills.fireRate * SKILLS.fireRate.effectPerPoint; }
    getRange() { return (this.baseRange + this.skills.range * SKILLS.range.effectPerPoint) / 60; }
    getSpeed() { return this.baseSpeed + this.skills.speed * SKILLS.speed.effectPerPoint; }
    getCritChance() { return this.critChance + this.skills.critical * SKILLS.critical.effectPerPoint; }

    getXpToNextLevel() { return 10 + (this.level - 1) * 2; }

    addXp(amount) {
        this.xp += amount;
        while (this.xp >= this.getXpToNextLevel()) {
            this.xp -= this.getXpToNextLevel();
            this.level++;
            this.skillPoints++;
            // Pulse effect - clear nearby enemy bullets
            for (let i = enemyBullets.length - 1; i >= 0; i--) {
                if (this.pos.distance(enemyBullets[i].pos) < 3) {
                    for (let j = 0; j < 5; j++) spawnParticle(enemyBullets[i].pos, new Color(1, 1, 0));
                    enemyBullets.splice(i, 1);
                }
            }
            if (window.testHarness) window.testHarness.logEvent('level_up', { level: this.level });
        }
    }

    takeDamage(amount) {
        if (this.invincibleTimer > 0 || this.isDashing) return;
        this.health -= amount;
        this.invincibleTimer = 1;
        screenShake = Math.min(screenShake + 0.4, 1);
        for (let i = 0; i < 10; i++) spawnParticle(this.pos, new Color(1, 0, 0));
        if (this.health <= 0) {
            currentGameState = GameState.GAME_OVER;
            screenShake = 1.5;
            if (window.testHarness) window.testHarness.logEvent('player_died', { level: this.level });
        }
    }

    heal(amount) { this.health = Math.min(this.health + amount, this.maxHealth); }

    update() {
        // Movement
        let move = vec2(0, 0);
        if (keyIsDown('KeyW') || keyIsDown('ArrowUp')) move.y += 1;
        if (keyIsDown('KeyS') || keyIsDown('ArrowDown')) move.y -= 1;
        if (keyIsDown('KeyA') || keyIsDown('ArrowLeft')) move.x -= 1;
        if (keyIsDown('KeyD') || keyIsDown('ArrowRight')) move.x += 1;

        // Dash
        if (this.abilities.dash && keyWasPressed('Space') && this.dashCooldown <= 0) {
            this.isDashing = true;
            this.dashTimer = 0.15;
            this.dashCooldown = 0.5;
            for (let i = 0; i < 8; i++) spawnParticle(this.pos, new Color(0, 1, 1));
        }

        if (this.isDashing) {
            const dashSpeed = 15;
            this.pos = this.pos.add(vec2(Math.cos(aimAngle), Math.sin(aimAngle)).scale(dashSpeed * timeDelta));
            this.dashTimer -= timeDelta;
            if (this.dashTimer <= 0) this.isDashing = false;
        } else if (move.length() > 0) {
            move = move.normalize();
            this.pos = this.pos.add(move.scale(this.getSpeed() * timeDelta));
        }

        // Clamp to room
        this.pos.x = clamp(this.pos.x, this.radius, ROOM_WIDTH / 40 - this.radius);
        this.pos.y = clamp(this.pos.y, this.radius, ROOM_HEIGHT / 40 - this.radius);

        // Cooldowns
        if (this.dashCooldown > 0) this.dashCooldown -= timeDelta;
        if (this.invincibleTimer > 0) this.invincibleTimer -= timeDelta;

        // Aim with mouse
        const worldMouseX = (uiMouseX - 400) / 40 + cameraPos.x;
        const worldMouseY = (300 - uiMouseY) / 40 + cameraPos.y;
        aimAngle = Math.atan2(worldMouseY - this.pos.y, worldMouseX - this.pos.x);

        // Shooting
        this.fireCooldown -= timeDelta;
        if (mouseIsDown(0) && this.fireCooldown <= 0) {
            this.shoot();
            this.fireCooldown = 1 / this.getFireRate();
        }

        // Supershot
        if (this.abilities.supershot && mouseIsDown(2) && this.energy >= 1 && this.fireCooldown <= 0) {
            this.supershot();
            this.fireCooldown = 0.3;
            this.energy -= 1;
        }

        // Energy regeneration
        this.energy = Math.min(this.energy + 0.5 * timeDelta, this.maxEnergy);

        // Collect crystals
        for (let i = crystals.length - 1; i >= 0; i--) {
            const crystal = crystals[i];
            if (this.pos.distance(crystal.pos) < 2) {
                const dir = crystal.pos.subtract(this.pos).normalize();
                crystal.pos = crystal.pos.subtract(dir.scale(8 * timeDelta));
                if (this.pos.distance(crystal.pos) < 0.5) {
                    if (crystal.isHealth) {
                        this.heal(1);
                        for (let j = 0; j < 5; j++) spawnParticle(this.pos, new Color(0, 1, 0));
                    } else {
                        this.addXp(crystal.xp);
                        this.crystalCount++;
                    }
                    crystals.splice(i, 1);
                }
            }
        }

        // Room transition
        this.checkRoomTransition();
    }

    checkRoomTransition() {
        const margin = 0.5;
        const roomW = ROOM_WIDTH / 40;
        const roomH = ROOM_HEIGHT / 40;

        if (this.pos.x < margin && currentRoom.x > 0) {
            currentRoom.x--;
            this.pos.x = roomW - margin - 0.5;
            loadRoom();
        } else if (this.pos.x > roomW - margin && currentRoom.x < 2) {
            currentRoom.x++;
            this.pos.x = margin + 0.5;
            loadRoom();
        } else if (this.pos.y < margin && currentRoom.y > 0) {
            currentRoom.y--;
            this.pos.y = roomH - margin - 0.5;
            loadRoom();
        } else if (this.pos.y > roomH - margin && currentRoom.y < 2) {
            currentRoom.y++;
            this.pos.y = margin + 0.5;
            loadRoom();
        }
    }

    shoot() {
        const bullet = {
            pos: this.pos.copy(),
            vel: vec2(Math.cos(aimAngle), Math.sin(aimAngle)).scale(10),
            damage: this.getDamage(),
            isCrit: Math.random() < this.getCritChance(),
            range: this.getRange(),
            traveled: 0,
            radius: 0.1,
            color: new Color(0, 0.9, 1)
        };
        if (bullet.isCrit) bullet.damage *= 2;
        playerBullets.push(bullet);
    }

    supershot() {
        const bullet = {
            pos: this.pos.copy(),
            vel: vec2(Math.cos(aimAngle), Math.sin(aimAngle)).scale(12),
            damage: this.getDamage() * 3,
            isCrit: false,
            range: this.getRange() * 1.5,
            traveled: 0,
            radius: 0.2,
            color: new Color(0.2, 0.5, 1),
            isSuper: true
        };
        playerBullets.push(bullet);
        for (let i = 0; i < 5; i++) spawnParticle(this.pos, new Color(0.2, 0.5, 1));
    }
}

// ============================================================================
// ENEMY CLASS
// ============================================================================

class Enemy {
    constructor(type, x, y) {
        const data = ENEMIES[type];
        this.id = Math.random().toString(36).substr(2, 9);
        this.type = type;
        this.data = data;
        this.pos = vec2(x, y);
        this.radius = 0.35;
        this.color = data.color;
        this.maxHp = data.hp;
        this.hp = data.hp;
        this.speed = data.speed;
        this.fireCooldown = Math.random() * data.fireRate;
        this.stateTimer = 0;
        this.rotationAngle = 0;
    }

    update() {
        if (!gamePlayer) return;
        const toPlayer = gamePlayer.pos.subtract(this.pos);
        const dist = toPlayer.length();

        // Movement based on type
        if (this.type === 'turret') {
            this.rotationAngle += 0.5 * timeDelta;
        } else if (this.type === 'grasshopper') {
            this.stateTimer -= timeDelta;
            if (this.stateTimer <= 0) {
                // Hop toward player
                if (dist > 0) {
                    const hopDir = toPlayer.normalize();
                    this.pos = this.pos.add(hopDir.scale(2));
                }
                this.stateTimer = 1.5;
            }
        } else if (this.type === 'heavy') {
            // Advance slowly
            if (dist > 3 && dist > 0) {
                this.pos = this.pos.add(toPlayer.normalize().scale(this.speed * timeDelta));
            }
        } else {
            // Chase/maintain distance
            const targetDist = this.type === 'scout' ? 4 : 5;
            if (dist > targetDist && dist > 0) {
                this.pos = this.pos.add(toPlayer.normalize().scale(this.speed * timeDelta));
            } else if (dist < targetDist - 1 && dist > 0) {
                this.pos = this.pos.subtract(toPlayer.normalize().scale(this.speed * timeDelta));
            }
        }

        // Clamp to room
        const roomW = ROOM_WIDTH / 40;
        const roomH = ROOM_HEIGHT / 40;
        this.pos.x = clamp(this.pos.x, this.radius, roomW - this.radius);
        this.pos.y = clamp(this.pos.y, this.radius, roomH - this.radius);

        // Shooting
        this.fireCooldown -= timeDelta;
        if (this.fireCooldown <= 0 && dist < 12) {
            this.fire();
            this.fireCooldown = this.data.fireRate;
        }
    }

    fire() {
        const angleToPlayer = Math.atan2(gamePlayer.pos.y - this.pos.y, gamePlayer.pos.x - this.pos.x);

        switch (this.data.pattern) {
            case 'single':
                this.fireBullet(angleToPlayer);
                break;
            case 'burst3':
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => this.fireBullet(angleToPlayer), i * 100);
                }
                break;
            case 'spray8':
                for (let i = 0; i < 8; i++) {
                    this.fireBullet(this.rotationAngle + (i / 8) * Math.PI * 2);
                }
                break;
            case 'spread5':
                for (let i = -2; i <= 2; i++) {
                    this.fireBullet(angleToPlayer + i * 0.15);
                }
                break;
            case 'spiral':
                for (let i = 0; i < 4; i++) {
                    this.fireBullet(this.rotationAngle + (i / 4) * Math.PI * 2);
                }
                this.rotationAngle += 0.3;
                break;
        }
    }

    fireBullet(angle) {
        enemyBullets.push({
            pos: this.pos.copy(),
            vel: vec2(Math.cos(angle), Math.sin(angle)).scale(4),
            damage: this.data.damage,
            radius: 0.12,
            lifetime: 5,
            color: new Color(1, 0.6, 0.2)
        });
    }

    takeDamage(amount, isCrit) {
        this.hp -= amount;
        const color = isCrit ? new Color(1, 0.84, 0) : new Color(1, 1, 1);
        for (let i = 0; i < 3; i++) spawnParticle(this.pos, color);

        if (this.hp <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    die() {
        totalKills++;
        screenShake = Math.min(screenShake + 0.08, 0.3);

        // Drop crystals
        for (let i = 0; i < this.data.xp; i++) {
            crystals.push({
                pos: this.pos.add(vec2((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8)),
                xp: 1,
                color: new Color(1, 0.2, 0.3)
            });
        }

        // Chance to drop health crystal
        if (Math.random() < 0.08) {
            crystals.push({
                pos: this.pos.add(vec2((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5)),
                xp: 0,
                isHealth: true,
                color: new Color(0.2, 1, 0.3)
            });
        }

        // Particles
        for (let i = 0; i < 8; i++) spawnParticle(this.pos, this.color);

        // Remove
        const idx = gameEnemies.indexOf(this);
        if (idx > -1) gameEnemies.splice(idx, 1);

        if (window.testHarness) window.testHarness.logEvent('enemy_killed', { type: this.type, id: this.id });
    }
}

// ============================================================================
// BOSS CLASS
// ============================================================================

class Boss {
    constructor() {
        this.pos = vec2(ROOM_WIDTH / 80, ROOM_HEIGHT / 40 - 3);
        this.radius = 1.2;
        this.color = new Color(0.8, 0.2, 0.6);
        this.maxHp = 500;
        this.hp = 500;
        this.phase = 0;
        this.phaseTimer = 0;
        this.attackTimer = 0;
        this.rotationAngle = 0;
    }

    update() {
        if (!gamePlayer) return;

        this.phaseTimer += timeDelta;
        this.attackTimer -= timeDelta;
        this.rotationAngle += 0.3 * timeDelta;

        // Phase changes
        if (this.hp < 350 && this.phase === 0) this.phase = 1;
        if (this.hp < 200 && this.phase === 1) this.phase = 2;
        if (this.hp < 100 && this.phase === 2) this.phase = 3;

        // Movement
        const targetY = 3 + Math.sin(this.phaseTimer) * 2;
        this.pos.y += (targetY - this.pos.y) * 0.02;

        // Attacks based on phase
        if (this.attackTimer <= 0) {
            switch (this.phase) {
                case 0:
                    this.circleSpray(12);
                    this.attackTimer = 2;
                    break;
                case 1:
                    this.circleSpray(16);
                    this.spiralBurst();
                    this.attackTimer = 1.5;
                    break;
                case 2:
                    this.circleSpray(20);
                    this.targetedBurst();
                    this.attackTimer = 1;
                    break;
                case 3:
                    this.bulletHell();
                    this.attackTimer = 0.8;
                    break;
            }
        }
    }

    circleSpray(count) {
        for (let i = 0; i < count; i++) {
            const angle = this.rotationAngle + (i / count) * Math.PI * 2;
            this.fireBullet(angle, 3);
        }
    }

    spiralBurst() {
        for (let i = 0; i < 4; i++) {
            const angle = this.rotationAngle + (i / 4) * Math.PI * 2;
            this.fireBullet(angle, 4);
        }
    }

    targetedBurst() {
        if (!gamePlayer) return;
        const angle = Math.atan2(gamePlayer.pos.y - this.pos.y, gamePlayer.pos.x - this.pos.x);
        for (let i = -2; i <= 2; i++) {
            this.fireBullet(angle + i * 0.2, 5);
        }
    }

    bulletHell() {
        for (let i = 0; i < 8; i++) {
            const angle = this.rotationAngle * 2 + (i / 8) * Math.PI * 2;
            this.fireBullet(angle, 3.5);
        }
        if (gamePlayer) {
            const angle = Math.atan2(gamePlayer.pos.y - this.pos.y, gamePlayer.pos.x - this.pos.x);
            this.fireBullet(angle, 6);
        }
    }

    fireBullet(angle, speed) {
        enemyBullets.push({
            pos: this.pos.copy(),
            vel: vec2(Math.cos(angle), Math.sin(angle)).scale(speed),
            damage: 1,
            radius: 0.15,
            lifetime: 8,
            color: new Color(0.9, 0.3, 0.5)
        });
    }

    takeDamage(amount) {
        this.hp -= amount;
        for (let i = 0; i < 3; i++) spawnParticle(this.pos, new Color(1, 0.84, 0));

        if (this.hp <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    die() {
        // Drop lots of crystals
        for (let i = 0; i < 100; i++) {
            crystals.push({
                pos: this.pos.add(vec2((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3)),
                xp: 1,
                color: new Color(1, 0.2, 0.3)
            });
        }

        // Big explosion
        for (let i = 0; i < 30; i++) spawnParticle(this.pos, this.color);

        bossDefeated = true;
        gamePlayer.abilities.dash = true;
        currentGameState = GameState.VICTORY;

        if (window.testHarness) window.testHarness.logEvent('boss_killed', { hp: this.maxHp });
    }
}

let boss = null;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function spawnParticle(pos, color) {
    particles.push({
        pos: pos.copy(),
        vel: vec2((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3),
        color: color,
        timer: 0.5
    });
}

function getRoomKey() {
    return `${currentRoom.x},${currentRoom.y}`;
}

function loadRoom() {
    gameEnemies = [];
    enemyBullets = [];
    crystals = [];
    boss = null;

    const key = getRoomKey();

    // Boss room
    if (currentRoom.x === 2 && currentRoom.y === 2) {
        if (!bossDefeated) {
            boss = new Boss();
            currentGameState = GameState.BOSS;
        }
        return;
    }

    currentGameState = GameState.PLAYING;

    // Check if room was cleared
    if (roomCleared[key]) return;

    // Spawn enemies based on distance from start
    const difficulty = currentRoom.x + currentRoom.y;
    const enemyCount = 3 + difficulty * 2;

    const types = ['scout'];
    if (difficulty >= 1) types.push('grasshopper');
    if (difficulty >= 2) types.push('turret');
    if (difficulty >= 3) types.push('heavy');
    if (difficulty >= 4) types.push('elite');

    const roomW = ROOM_WIDTH / 40;
    const roomH = ROOM_HEIGHT / 40;

    for (let i = 0; i < enemyCount; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const x = 2 + Math.random() * (roomW - 4);
        const y = 2 + Math.random() * (roomH - 4);
        gameEnemies.push(new Enemy(type, x, y));
    }

    if (window.testHarness) window.testHarness.logEvent('room_entered', { room: key, enemies: enemyCount });
}

function checkRoomCleared() {
    if (gameEnemies.length === 0 && !boss) {
        const key = getRoomKey();
        if (!roomCleared[key]) {
            roomCleared[key] = true;
            if (window.testHarness) window.testHarness.logEvent('room_cleared', { room: key });
        }
    }
}

// ============================================================================
// LITTLEJS CALLBACKS
// ============================================================================

function gameInit() {
    canvasFixedSize = vec2(800, 600);
    cameraScale = 40;
    cameraPos = vec2(ROOM_WIDTH / 80, ROOM_HEIGHT / 80);

    document.addEventListener('mousemove', (e) => {
        const rect = mainCanvas.getBoundingClientRect();
        uiMouseX = e.clientX - rect.left;
        uiMouseY = e.clientY - rect.top;
    });

    // Prevent context menu
    document.addEventListener('contextmenu', e => e.preventDefault());
}

function gameUpdate() {
    if (currentGameState === GameState.PLAYING || currentGameState === GameState.BOSS) {
        if (gamePlayer) {
            gamePlayer.update();
            cameraPos = gamePlayer.pos.copy();
            cameraPos.x = clamp(cameraPos.x, 10, ROOM_WIDTH / 40 - 10);
            cameraPos.y = clamp(cameraPos.y, 7.5, ROOM_HEIGHT / 40 - 7.5);

            // Apply screen shake
            if (screenShake > 0) {
                cameraPos.x += (Math.random() - 0.5) * screenShake * 2;
                cameraPos.y += (Math.random() - 0.5) * screenShake * 2;
                screenShake *= 0.88;
                if (screenShake < 0.01) screenShake = 0;
            }
        }

        // Update enemies
        for (const enemy of gameEnemies) enemy.update();

        // Update boss
        if (boss) boss.update();

        // Update player bullets
        for (let i = playerBullets.length - 1; i >= 0; i--) {
            const bullet = playerBullets[i];
            bullet.pos = bullet.pos.add(bullet.vel.scale(timeDelta));
            bullet.traveled += bullet.vel.length() * timeDelta;

            if (bullet.traveled > bullet.range) {
                playerBullets.splice(i, 1);
                continue;
            }

            // Check enemy hits
            for (const enemy of gameEnemies) {
                if (bullet.pos.distance(enemy.pos) < bullet.radius + enemy.radius) {
                    enemy.takeDamage(bullet.damage, bullet.isCrit);
                    playerBullets.splice(i, 1);
                    break;
                }
            }

            // Check boss hits
            if (boss && bullet.pos.distance(boss.pos) < bullet.radius + boss.radius) {
                boss.takeDamage(bullet.damage);
                playerBullets.splice(i, 1);
            }
        }

        // Update enemy bullets
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const bullet = enemyBullets[i];
            bullet.pos = bullet.pos.add(bullet.vel.scale(timeDelta));
            bullet.lifetime -= timeDelta;

            if (bullet.lifetime <= 0) {
                enemyBullets.splice(i, 1);
                continue;
            }

            // Check player hit
            if (gamePlayer && bullet.pos.distance(gamePlayer.pos) < bullet.radius + gamePlayer.radius) {
                gamePlayer.takeDamage(bullet.damage);
                enemyBullets.splice(i, 1);
            }
        }

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.pos = p.pos.add(p.vel.scale(timeDelta));
            p.timer -= timeDelta;
            if (p.timer <= 0) particles.splice(i, 1);
        }

        checkRoomCleared();
    }

    // Input handling
    if (currentGameState === GameState.MENU && (keyWasPressed('Space') || mouseWasPressed(0))) {
        startGame();
    }

    if (currentGameState === GameState.PLAYING && keyWasPressed('Escape')) {
        currentGameState = GameState.PAUSED;
    } else if (currentGameState === GameState.PAUSED && keyWasPressed('Escape')) {
        currentGameState = GameState.PLAYING;
    }

    if ((currentGameState === GameState.GAME_OVER || currentGameState === GameState.VICTORY) && mouseWasPressed(0)) {
        resetGame();
        currentGameState = GameState.MENU;
    }

    // Level up screen
    if (currentGameState === GameState.PLAYING && gamePlayer && gamePlayer.skillPoints > 0) {
        // Can press E to open skill menu
        if (keyWasPressed('KeyE')) {
            currentGameState = GameState.LEVEL_UP;
        }
    }

    if (currentGameState === GameState.LEVEL_UP && keyWasPressed('Escape')) {
        currentGameState = GameState.PLAYING;
    }
}

function startGame() {
    gamePlayer = new Player();
    currentRoom = { x: 0, y: 0 };
    roomCleared = {};
    bossDefeated = false;
    boss = null;
    loadRoom();
    currentGameState = GameState.PLAYING;

    if (window.testHarness) window.testHarness.logEvent('game_started', {});
}

function resetGame() {
    gamePlayer = null;
    gameEnemies = [];
    playerBullets = [];
    enemyBullets = [];
    crystals = [];
    particles = [];
    boss = null;
    screenShake = 0;
    totalKills = 0;
}

function gameUpdatePost() {}

function gameRender() {
    // Background
    const roomW = ROOM_WIDTH / 40;
    const roomH = ROOM_HEIGHT / 40;

    // Floor color based on room
    const roomColors = [
        [new Color(0.15, 0.4, 0.25), new Color(0.2, 0.45, 0.3), new Color(0.25, 0.5, 0.35)],
        [new Color(0.4, 0.35, 0.2), new Color(0.45, 0.4, 0.25), new Color(0.5, 0.3, 0.3)],
        [new Color(0.3, 0.25, 0.35), new Color(0.35, 0.2, 0.4), new Color(0.4, 0.15, 0.4)]
    ];
    const floorColor = roomColors[currentRoom.y]?.[currentRoom.x] || new Color(0.2, 0.3, 0.2);

    drawRect(vec2(roomW / 2, roomH / 2), vec2(roomW, roomH), floorColor);

    // Floor pattern
    for (let x = 0; x < roomW; x += 2) {
        for (let y = 0; y < roomH; y += 2) {
            if ((Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0) {
                drawRect(vec2(x + 1, y + 1), vec2(2, 2), floorColor.lerp(new Color(0, 0, 0), 0.1));
            }
        }
    }

    // Border/walls
    drawRect(vec2(roomW / 2, -0.25), vec2(roomW, 0.5), new Color(0.1, 0.15, 0.1));
    drawRect(vec2(roomW / 2, roomH + 0.25), vec2(roomW, 0.5), new Color(0.1, 0.15, 0.1));
    drawRect(vec2(-0.25, roomH / 2), vec2(0.5, roomH), new Color(0.1, 0.15, 0.1));
    drawRect(vec2(roomW + 0.25, roomH / 2), vec2(0.5, roomH), new Color(0.1, 0.15, 0.1));

    // Room exits (if adjacent room exists)
    if (currentRoom.x > 0) drawRect(vec2(0, roomH / 2), vec2(0.5, 2), floorColor);
    if (currentRoom.x < 2) drawRect(vec2(roomW, roomH / 2), vec2(0.5, 2), floorColor);
    if (currentRoom.y > 0) drawRect(vec2(roomW / 2, 0), vec2(2, 0.5), floorColor);
    if (currentRoom.y < 2) drawRect(vec2(roomW / 2, roomH), vec2(2, 0.5), floorColor);

    // Crystals
    for (const crystal of crystals) {
        drawRect(crystal.pos, vec2(0.2, 0.25), crystal.color);
    }

    // Enemies
    for (const enemy of gameEnemies) {
        drawRect(enemy.pos, vec2(enemy.radius * 2, enemy.radius * 2), enemy.color);
        // Eye
        drawRect(enemy.pos.add(vec2(0, enemy.radius * 0.3)), vec2(enemy.radius * 0.5, enemy.radius * 0.3), new Color(0.9, 0.2, 0.2));
        // Health bar
        if (enemy.hp < enemy.maxHp) {
            drawRect(enemy.pos.add(vec2(0, enemy.radius + 0.2)), vec2(enemy.radius * 2, 0.1), new Color(0.2, 0.2, 0.2));
            drawRect(enemy.pos.add(vec2(0, enemy.radius + 0.2)), vec2(enemy.radius * 2 * (enemy.hp / enemy.maxHp), 0.1), new Color(1, 0.2, 0.2));
        }
    }

    // Boss
    if (boss) {
        // Main body
        drawRect(boss.pos, vec2(boss.radius * 2, boss.radius * 2.5), boss.color);
        // Face
        drawRect(boss.pos.add(vec2(-0.4, 0.3)), vec2(0.3, 0.3), new Color(0.9, 0.2, 0.2));
        drawRect(boss.pos.add(vec2(0.4, 0.3)), vec2(0.3, 0.3), new Color(0.9, 0.2, 0.2));
        // Health bar (big)
        drawRect(boss.pos.add(vec2(0, boss.radius + 0.5)), vec2(3, 0.15), new Color(0.2, 0.2, 0.2));
        drawRect(boss.pos.add(vec2(0, boss.radius + 0.5)), vec2(3 * (boss.hp / boss.maxHp), 0.15), new Color(0.9, 0.2, 0.6));
    }

    // Player
    if (gamePlayer) {
        // Ship body
        const pColor = gamePlayer.invincibleTimer > 0 && Math.floor(gamePlayer.invincibleTimer * 10) % 2 === 0
            ? new Color(1, 1, 1, 0.5)
            : new Color(0.3, 0.8, 0.9);
        drawRect(gamePlayer.pos, vec2(gamePlayer.radius * 2, gamePlayer.radius * 2.5), pColor);
        // Cockpit
        drawRect(gamePlayer.pos.add(vec2(0, gamePlayer.radius * 0.3)), vec2(gamePlayer.radius * 0.8, gamePlayer.radius * 0.6), new Color(0.1, 0.2, 0.3));
        // Aim indicator
        const aimEnd = gamePlayer.pos.add(vec2(Math.cos(aimAngle), Math.sin(aimAngle)).scale(1.5));
        drawLine(gamePlayer.pos, aimEnd, 0.05, new Color(0, 1, 1, 0.5));
    }

    // Player bullets
    for (const bullet of playerBullets) {
        drawRect(bullet.pos, vec2(bullet.radius * 2, bullet.radius * 2), bullet.color);
    }

    // Enemy bullets
    for (const bullet of enemyBullets) {
        drawRect(bullet.pos, vec2(bullet.radius * 2, bullet.radius * 2), bullet.color);
        // Outer ring
        drawRect(bullet.pos, vec2(bullet.radius * 2.5, bullet.radius * 2.5), new Color(1, 1, 1, 0.3));
    }

    // Particles
    for (const p of particles) {
        const alpha = p.timer / 0.5;
        drawRect(p.pos, vec2(0.15, 0.15), new Color(p.color.r, p.color.g, p.color.b, alpha));
    }
}

function gameRenderPost() {
    const ctx = mainContext || overlayContext || mainCanvas?.getContext('2d');
    if (!ctx) return;
    ctx.save();

    switch (currentGameState) {
        case GameState.MENU: renderMenu(ctx); break;
        case GameState.PLAYING:
        case GameState.BOSS:
            renderHUD(ctx);
            break;
        case GameState.PAUSED:
            renderHUD(ctx);
            renderPauseOverlay(ctx);
            break;
        case GameState.LEVEL_UP:
            renderHUD(ctx);
            renderLevelUp(ctx);
            break;
        case GameState.GAME_OVER: renderGameOver(ctx); break;
        case GameState.VICTORY: renderVictory(ctx); break;
    }

    ctx.restore();
}

function renderMenu(ctx) {
    ctx.fillStyle = 'rgba(10, 20, 30, 0.95)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#00E0FF';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MINISHOOT', 400, 180);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '22px Arial';
    ctx.fillText('Adventures', 400, 220);

    ctx.font = '18px Arial';
    ctx.fillStyle = '#88CCFF';
    ctx.fillText('Click or Press SPACE to Start', 400, 380);

    ctx.font = '14px Arial';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('WASD to Move | Mouse to Aim | Left Click to Shoot', 400, 480);
    ctx.fillText('Right Click for Supershot | SPACE to Dash', 400, 510);
    ctx.fillText('Navigate rooms to find and defeat the Boss!', 400, 540);
}

function renderHUD(ctx) {
    if (!gamePlayer) return;

    // Health hearts
    for (let i = 0; i < gamePlayer.maxHealth; i++) {
        const x = 30 + i * 28;
        ctx.fillStyle = i < gamePlayer.health ? '#FF4444' : '#444444';
        ctx.beginPath();
        ctx.moveTo(x, 35);
        ctx.bezierCurveTo(x, 30, x - 10, 25, x - 10, 30);
        ctx.bezierCurveTo(x - 10, 35, x, 42, x, 48);
        ctx.bezierCurveTo(x, 42, x + 10, 35, x + 10, 30);
        ctx.bezierCurveTo(x + 10, 25, x, 30, x, 35);
        ctx.fill();
    }

    // Energy bars
    ctx.fillStyle = '#333333';
    ctx.fillRect(20, 55, 100, 12);
    ctx.fillStyle = '#00CCFF';
    ctx.fillRect(20, 55, 100 * (gamePlayer.energy / gamePlayer.maxEnergy), 12);
    ctx.strokeStyle = '#666666';
    ctx.strokeRect(20, 55, 100, 12);

    // Crystals
    ctx.fillStyle = '#FF4466';
    ctx.beginPath();
    ctx.moveTo(25, 90);
    ctx.lineTo(30, 80);
    ctx.lineTo(35, 90);
    ctx.lineTo(30, 95);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(gamePlayer.crystalCount, 45, 92);

    // Kill counter
    ctx.fillStyle = '#FF6666';
    ctx.font = '13px Arial';
    ctx.fillText(`Kills: ${totalKills}`, 100, 92);

    // Level and XP
    ctx.fillStyle = '#FFCC00';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`LV ${gamePlayer.level}`, 20, 120);
    ctx.fillStyle = '#333333';
    ctx.fillRect(60, 108, 80, 10);
    ctx.fillStyle = '#FFCC00';
    ctx.fillRect(60, 108, 80 * (gamePlayer.xp / gamePlayer.getXpToNextLevel()), 10);

    // Skill points indicator
    if (gamePlayer.skillPoints > 0) {
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${gamePlayer.skillPoints} Skill Points! Press E`, 20, 145);
    }

    // Room indicator
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Room: ${currentRoom.x + 1}, ${currentRoom.y + 1}`, 780, 30);

    // Boss indicator
    if (currentRoom.x === 2 && currentRoom.y === 2 && !bossDefeated) {
        ctx.fillStyle = '#FF4466';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS: Forest Guardian', 400, 30);
        if (boss) {
            ctx.fillStyle = '#333333';
            ctx.fillRect(250, 40, 300, 15);
            ctx.fillStyle = '#FF4466';
            ctx.fillRect(250, 40, 300 * (boss.hp / boss.maxHp), 15);
        }
    }

    // Abilities
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';
    ctx.fillStyle = gamePlayer.abilities.dash ? '#00FFFF' : '#555555';
    ctx.fillText('Dash: ' + (gamePlayer.abilities.dash ? 'SPACE' : 'Locked'), 660, 570);
    ctx.fillStyle = gamePlayer.abilities.supershot ? '#4488FF' : '#555555';
    ctx.fillText('Super: ' + (gamePlayer.abilities.supershot ? 'RMB' : 'Locked'), 660, 590);

    // Mini map
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(710, 80, 80, 80);
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            const rx = 715 + x * 24;
            const ry = 85 + y * 24;
            if (x === currentRoom.x && y === currentRoom.y) {
                ctx.fillStyle = '#00FFFF';
            } else if (roomCleared[`${x},${y}`]) {
                ctx.fillStyle = '#446644';
            } else if (x === 2 && y === 2) {
                ctx.fillStyle = bossDefeated ? '#884488' : '#FF4466';
            } else {
                ctx.fillStyle = '#333333';
            }
            ctx.fillRect(rx, ry, 20, 20);
        }
    }
}

function renderLevelUp(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#FFCC00';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ALLOCATE SKILL POINTS', 400, 100);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Arial';
    ctx.fillText(`Points Available: ${gamePlayer.skillPoints}`, 400, 140);

    const skillList = Object.entries(SKILLS);
    const startY = 200;

    for (let i = 0; i < skillList.length; i++) {
        const [key, skill] = skillList[i];
        const y = startY + i * 60;
        const current = gamePlayer.skills[key];
        const canUpgrade = gamePlayer.skillPoints >= skill.costPerPoint && current < skill.max;

        // Background
        ctx.fillStyle = canUpgrade ? '#334455' : '#222233';
        ctx.fillRect(200, y - 15, 400, 50);

        // Name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(skill.name, 220, y + 5);

        // Current level
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '14px Arial';
        ctx.fillText(`${current}/${skill.max}`, 350, y + 5);

        // Cost
        ctx.fillStyle = '#FFCC00';
        ctx.fillText(`Cost: ${skill.costPerPoint}`, 420, y + 5);

        // + Button
        if (canUpgrade) {
            const btnX = 520;
            const hover = uiMouseX >= btnX && uiMouseX <= btnX + 60 && uiMouseY >= y - 15 && uiMouseY <= y + 35;
            ctx.fillStyle = hover ? '#44AA44' : '#228822';
            ctx.fillRect(btnX, y - 10, 60, 30);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('+', btnX + 30, y + 10);

            if (hover && mouseWasPressed(0)) {
                gamePlayer.skills[key]++;
                gamePlayer.skillPoints -= skill.costPerPoint;
            }
        }
    }

    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press ESC to close', 400, 550);
}

function renderPauseOverlay(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', 400, 280);
    ctx.font = '18px Arial';
    ctx.fillText('Press ESC to resume', 400, 330);
}

function renderGameOver(ctx) {
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#FF4444';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', 400, 200);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '22px Arial';
    ctx.fillText(`Level ${gamePlayer ? gamePlayer.level : 1}`, 400, 270);
    ctx.fillText(`Crystals: ${gamePlayer ? gamePlayer.crystalCount : 0}`, 400, 310);
    ctx.fillStyle = '#FF6666';
    ctx.fillText(`Enemies Killed: ${totalKills}`, 400, 350);

    ctx.font = '18px Arial';
    ctx.fillStyle = '#888888';
    ctx.fillText('Click to try again', 400, 450);
}

function renderVictory(ctx) {
    ctx.fillStyle = '#0a1a2a';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#00FFCC';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', 400, 160);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '22px Arial';
    ctx.fillText('You defeated the Forest Guardian!', 400, 220);

    ctx.fillStyle = '#00CCFF';
    ctx.font = '18px Arial';
    ctx.fillText('Dash ability unlocked!', 400, 270);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Final Level: ${gamePlayer ? gamePlayer.level : 1}`, 400, 320);
    ctx.fillText(`Crystals: ${gamePlayer ? gamePlayer.crystalCount : 0}`, 400, 355);
    ctx.fillStyle = '#FF6666';
    ctx.fillText(`Total Enemies Killed: ${totalKills}`, 400, 390);
    ctx.fillStyle = '#FFCC00';
    ctx.fillText(`Rooms Cleared: ${Object.keys(roomCleared).length}/8`, 400, 425);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#888888';
    ctx.fillText('Click to play again', 400, 500);
}

// ============================================================================
// DEBUG COMMANDS
// ============================================================================

window.debugCommands = {
    godMode: (enabled) => { if (gamePlayer) gamePlayer.invincibleTimer = enabled ? 999999 : 0; },
    setHealth: (amount) => { if (gamePlayer) gamePlayer.health = Math.min(amount, gamePlayer.maxHealth); },
    giveXp: (amount) => { if (gamePlayer) gamePlayer.addXp(amount); },
    giveSkillPoints: (amount) => { if (gamePlayer) gamePlayer.skillPoints += amount; },
    unlockDash: () => { if (gamePlayer) gamePlayer.abilities.dash = true; },
    unlockSupershot: () => { if (gamePlayer) gamePlayer.abilities.supershot = true; },
    clearRoom: () => { while (gameEnemies.length > 0) gameEnemies[0].die(); },
    spawnEnemy: (type) => { if (ENEMIES[type]) gameEnemies.push(new Enemy(type, 10, 8)); },
    teleportToBoss: () => { currentRoom = { x: 2, y: 2 }; loadRoom(); }
};

// ============================================================================
// GLOBAL GETTERS FOR TEST HARNESS
// ============================================================================

window.getPlayer = () => gamePlayer;
window.getEnemies = () => gameEnemies;
window.getPlayerBullets = () => playerBullets;
window.getEnemyBullets = () => enemyBullets;
window.getCrystals = () => crystals;
window.getBoss = () => boss;
window.getGameState = () => currentGameState;
window.getCurrentRoom = () => currentRoom;
window.startGame = startGame;

// ============================================================================
// START GAME
// ============================================================================

engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, ['']);
