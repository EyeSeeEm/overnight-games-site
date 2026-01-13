// Minishoot Adventures Clone - LittleJS Twin-Stick Adventure
'use strict';

// Constants
const WORLD_SIZE = 50;
const PLAYER_BASE_SPEED = 5;
const BULLET_SPEED = 12;
const DASH_DISTANCE = 4;
const DASH_COOLDOWN = 0.8;
const IFRAMES = 1.0;

// Game state
let gamePaused = true;
let gamePhase = 'menu'; // menu, playing, gameover
let player = null;
let enemies = [];
let bullets = [];
let enemyBullets = [];
let pickups = [];
let areas = [];
let currentArea = 0;

// Stats
let kills = 0;
let xp = 0;
let playerLevel = 1;
let skillPoints = 0;

// Input simulation
let simulatedKeys = new Set();
let simulatedMouse = { x: 400, y: 300 };

// Player stats
const baseStats = {
    maxHp: 3,
    hp: 3,
    damage: 1,
    fireRate: 3,
    range: 10,
    speed: 0,
    critChance: 0,
    energy: 4,
    maxEnergy: 4
};

let stats = { ...baseStats };

// Skills
const skills = {
    damage: 0,
    fireRate: 0,
    range: 0,
    speed: 0,
    critical: 0
};

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.invincible = 0;
        this.fireTimer = 0;
        this.dashCooldown = 0;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDir = { x: 0, y: 0 };
    }

    update(dt) {
        // Invincibility
        if (this.invincible > 0) this.invincible -= dt;

        // Dash
        if (this.dashCooldown > 0) this.dashCooldown -= dt;

        if (this.isDashing) {
            this.dashTimer -= dt;
            this.x += this.dashDir.x * DASH_DISTANCE / 0.2 * dt;
            this.y += this.dashDir.y * DASH_DISTANCE / 0.2 * dt;

            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
        } else {
            // Normal movement
            let dx = 0, dy = 0;
            if (isKeyHeld('w') || isKeyHeld('W')) dy = 1;
            if (isKeyHeld('s') || isKeyHeld('S')) dy = -1;
            if (isKeyHeld('a') || isKeyHeld('A')) dx = -1;
            if (isKeyHeld('d') || isKeyHeld('D')) dx = 1;

            if (dx !== 0 && dy !== 0) {
                dx *= 0.707;
                dy *= 0.707;
            }

            const speed = (PLAYER_BASE_SPEED + stats.speed * 0.4 + skills.speed * 0.5) * dt;
            this.x = Math.max(-WORLD_SIZE/2 + 1, Math.min(WORLD_SIZE/2 - 1, this.x + dx * speed));
            this.y = Math.max(-WORLD_SIZE/2 + 1, Math.min(WORLD_SIZE/2 - 1, this.y + dy * speed));

            // Store movement direction for dash
            if (dx !== 0 || dy !== 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                this.dashDir = { x: dx / len, y: dy / len };
            }
        }

        // Aiming
        let aimX = 0, aimY = 0;
        if (isKeyHeld('ArrowUp')) aimY = 1;
        if (isKeyHeld('ArrowDown')) aimY = -1;
        if (isKeyHeld('ArrowLeft')) aimX = -1;
        if (isKeyHeld('ArrowRight')) aimX = 1;

        if (aimX !== 0 || aimY !== 0) {
            this.angle = Math.atan2(aimY, aimX);
        } else {
            // Mouse aim
            const worldMouse = screenToWorld(vec2(simulatedMouse.x, simulatedMouse.y));
            const dx = worldMouse.x - this.x;
            const dy = worldMouse.y - this.y;
            if (dx * dx + dy * dy > 0.5) {
                this.angle = Math.atan2(dy, dx);
            }
        }

        // Fire
        this.fireTimer -= dt;
        const actualFireRate = stats.fireRate + skills.fireRate * 0.5;
        if ((aimX !== 0 || aimY !== 0 || isKeyHeld(' ') || isKeyHeld('Space')) && this.fireTimer <= 0) {
            this.fire();
            this.fireTimer = 1 / actualFireRate;
        }

        // Dash input
        if ((isKeyHeld('Shift') || isKeyHeld('shift')) && this.dashCooldown <= 0 && !this.isDashing) {
            this.startDash();
        }

        // Supershot (Space)
        if (isKeyHeld('Space') && stats.energy > 0 && this.fireTimer <= 0) {
            this.fireSupershot();
        }

        // Energy regen
        stats.energy = Math.min(stats.maxEnergy, stats.energy + dt * 0.2);
    }

    fire() {
        const damage = stats.damage + skills.damage * 0.5;
        const range = stats.range + skills.range * 0.5;

        bullets.push({
            x: this.x + Math.cos(this.angle) * 0.5,
            y: this.y + Math.sin(this.angle) * 0.5,
            vx: Math.cos(this.angle) * BULLET_SPEED,
            vy: Math.sin(this.angle) * BULLET_SPEED,
            damage: damage,
            life: range / BULLET_SPEED,
            type: 'normal'
        });
    }

    fireSupershot() {
        if (stats.energy < 1) return;
        stats.energy -= 1;

        const damage = (stats.damage + skills.damage * 0.5) * 3;

        bullets.push({
            x: this.x + Math.cos(this.angle) * 0.5,
            y: this.y + Math.sin(this.angle) * 0.5,
            vx: Math.cos(this.angle) * BULLET_SPEED * 1.5,
            vy: Math.sin(this.angle) * BULLET_SPEED * 1.5,
            damage: damage,
            life: 2,
            type: 'super'
        });
    }

    startDash() {
        if (this.dashDir.x === 0 && this.dashDir.y === 0) {
            this.dashDir = { x: Math.cos(this.angle), y: Math.sin(this.angle) };
        }
        this.isDashing = true;
        this.dashTimer = 0.2;
        this.dashCooldown = DASH_COOLDOWN;
    }

    takeDamage(amount) {
        if (this.invincible > 0 || this.isDashing) return;

        stats.hp -= amount;
        this.invincible = IFRAMES;

        if (stats.hp <= 0) {
            gamePhase = 'gameover';
        }
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.angle = Math.random() * Math.PI * 2;
        this.fireTimer = Math.random() * 2;
        this.moveTimer = 0;
        this.moveDir = { x: 0, y: 0 };

        switch (type) {
            case 'basic':
                this.hp = 3;
                this.maxHp = 3;
                this.speed = 1.5;
                this.fireRate = 0.8;
                this.xpValue = 1;
                break;
            case 'shooter':
                this.hp = 5;
                this.maxHp = 5;
                this.speed = 0.8;
                this.fireRate = 1.5;
                this.xpValue = 3;
                break;
            case 'tank':
                this.hp = 15;
                this.maxHp = 15;
                this.speed = 0.5;
                this.fireRate = 0.3;
                this.xpValue = 5;
                break;
            case 'fast':
                this.hp = 2;
                this.maxHp = 2;
                this.speed = 4;
                this.fireRate = 0;
                this.xpValue = 2;
                break;
            case 'boss':
                this.hp = 100 + playerLevel * 20;
                this.maxHp = this.hp;
                this.speed = 1;
                this.fireRate = 2;
                this.xpValue = 100;
                this.bossPhase = 0;
                break;
            default:
                this.hp = 3;
                this.maxHp = 3;
                this.speed = 1.5;
                this.fireRate = 0.5;
                this.xpValue = 1;
        }
    }

    update(dt) {
        if (!player) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Face player
        this.angle = Math.atan2(dy, dx);

        // Movement
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            this.moveTimer = 1 + Math.random();
            if (this.type === 'fast') {
                // Rush player
                this.moveDir = { x: dx / dist, y: dy / dist };
            } else if (dist > 6) {
                // Move toward player
                this.moveDir = { x: dx / dist, y: dy / dist };
            } else if (dist < 3) {
                // Back off
                this.moveDir = { x: -dx / dist, y: -dy / dist };
            } else {
                // Strafe
                this.moveDir = { x: -dy / dist, y: dx / dist };
                if (Math.random() < 0.5) {
                    this.moveDir.x *= -1;
                    this.moveDir.y *= -1;
                }
            }
        }

        this.x += this.moveDir.x * this.speed * dt;
        this.y += this.moveDir.y * this.speed * dt;

        // Bounds
        this.x = Math.max(-WORLD_SIZE/2 + 1, Math.min(WORLD_SIZE/2 - 1, this.x));
        this.y = Math.max(-WORLD_SIZE/2 + 1, Math.min(WORLD_SIZE/2 - 1, this.y));

        // Fire
        if (this.fireRate > 0) {
            this.fireTimer -= dt;
            if (this.fireTimer <= 0) {
                this.fire();
                this.fireTimer = 1 / this.fireRate;
            }
        }

        // Contact damage
        if (dist < 0.8) {
            player.takeDamage(1);
        }
    }

    fire() {
        if (this.type === 'boss') {
            // Boss patterns
            const pattern = this.bossPhase % 3;
            if (pattern === 0) {
                // Spread
                for (let i = -2; i <= 2; i++) {
                    this.shootBullet(this.angle + i * 0.3);
                }
            } else if (pattern === 1) {
                // Ring
                for (let i = 0; i < 8; i++) {
                    this.shootBullet(i * Math.PI / 4);
                }
            } else {
                // Aimed burst
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => this.shootBullet(this.angle), i * 100);
                }
            }
            this.bossPhase++;
        } else {
            this.shootBullet(this.angle);
        }
    }

    shootBullet(angle) {
        enemyBullets.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * 6,
            vy: Math.sin(angle) * 6,
            damage: 1,
            life: 4
        });
    }

    takeDamage(amount) {
        // Critical hit
        if (Math.random() < (skills.critical * 0.05)) {
            amount *= 2;
        }

        this.hp -= amount;
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        const idx = enemies.indexOf(this);
        if (idx >= 0) enemies.splice(idx, 1);

        kills++;

        // Drop XP
        pickups.push({ x: this.x, y: this.y, type: 'xp', value: this.xpValue });

        // Small chance for heart
        if (Math.random() < 0.05) {
            pickups.push({ x: this.x + 0.3, y: this.y, type: 'heart', value: 1 });
        }
    }
}

// Spawn enemies
function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 12 + Math.random() * 5;
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;

    // Clamp to world
    const ex = Math.max(-WORLD_SIZE/2 + 2, Math.min(WORLD_SIZE/2 - 2, x));
    const ey = Math.max(-WORLD_SIZE/2 + 2, Math.min(WORLD_SIZE/2 - 2, y));

    // Type based on level
    let type = 'basic';
    const roll = Math.random();
    if (playerLevel >= 10 && roll < 0.05) type = 'boss';
    else if (playerLevel >= 5 && roll < 0.15) type = 'tank';
    else if (playerLevel >= 3 && roll < 0.25) type = 'shooter';
    else if (roll < 0.3) type = 'fast';

    enemies.push(new Enemy(ex, ey, type));
}

// Input helper
function isKeyHeld(key) {
    if (simulatedKeys.has(key)) return true;
    if (simulatedKeys.has(key.toLowerCase())) return true;
    return keyIsDown(key);
}

// XP and leveling
function addXp(amount) {
    xp += amount;
    const xpNeeded = 10 + (playerLevel - 1) * 2;

    while (xp >= xpNeeded) {
        xp -= xpNeeded;
        levelUp();
    }
}

function levelUp() {
    playerLevel++;
    skillPoints++;
    stats.maxHp = Math.min(10, stats.maxHp + 0.25);

    // Auto-allocate skill point
    const skillList = ['damage', 'fireRate', 'range', 'speed', 'critical'];
    const skill = skillList[Math.floor(Math.random() * skillList.length)];
    if (skills[skill] < 10) {
        skills[skill]++;
        skillPoints--;
    }

    // Clear nearby enemy bullets on level up
    enemyBullets = enemyBullets.filter(b => {
        const dx = b.x - player.x;
        const dy = b.y - player.y;
        return dx * dx + dy * dy > 25;
    });
}

// Start game
function startGame() {
    gamePhase = 'playing';
    kills = 0;
    xp = 0;
    playerLevel = 1;
    skillPoints = 0;

    stats = { ...baseStats };
    Object.keys(skills).forEach(k => skills[k] = 0);

    enemies = [];
    bullets = [];
    enemyBullets = [];
    pickups = [];

    player = new Player(0, 0);
}

// LittleJS callbacks
function gameInit() {
    canvasFixedSize = vec2(800, 600);
    cameraScale = 30;
}

let spawnTimer = 0;

function gameUpdate() {
    if (gamePaused) return;

    const dt = 1/60;

    if (gamePhase === 'playing') {
        // Update player
        if (player) {
            player.update(dt);
            cameraPos = vec2(player.x, player.y);
        }

        // Update enemies
        for (const enemy of enemies) {
            enemy.update(dt);
        }

        // Update player bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.life -= dt;

            // Check enemy collision
            for (const enemy of enemies) {
                const dx = b.x - enemy.x;
                const dy = b.y - enemy.y;
                const hitDist = enemy.type === 'boss' ? 1.5 : 0.5;
                if (dx * dx + dy * dy < hitDist) {
                    enemy.takeDamage(b.damage);
                    if (b.type !== 'super') {
                        bullets.splice(i, 1);
                    }
                    break;
                }
            }

            if (b.life <= 0) {
                bullets.splice(i, 1);
            }
        }

        // Update enemy bullets
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.life -= dt;

            // Check player collision
            if (player) {
                const dx = b.x - player.x;
                const dy = b.y - player.y;
                if (dx * dx + dy * dy < 0.4) {
                    player.takeDamage(b.damage);
                    enemyBullets.splice(i, 1);
                    continue;
                }
            }

            if (b.life <= 0) {
                enemyBullets.splice(i, 1);
            }
        }

        // Collect pickups
        if (player) {
            for (let i = pickups.length - 1; i >= 0; i--) {
                const p = pickups[i];
                const dx = p.x - player.x;
                const dy = p.y - player.y;
                if (dx * dx + dy * dy < 2) {
                    if (p.type === 'xp') {
                        addXp(p.value);
                    } else if (p.type === 'heart') {
                        stats.hp = Math.min(stats.maxHp, stats.hp + p.value);
                    }
                    pickups.splice(i, 1);
                }
            }
        }

        // Spawn enemies
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
            const spawnRate = Math.max(0.5, 3 - playerLevel * 0.1);
            spawnTimer = spawnRate;
            if (enemies.length < 10 + playerLevel * 2) {
                spawnEnemy();
            }
        }
    }
}

function gameUpdatePost() {}

function gameRender() {
    // Background
    const bgColor = new Color(0.15, 0.25, 0.2);
    drawRect(cameraPos, vec2(100, 100), bgColor);

    // World bounds
    const worldColor = new Color(0.2, 0.35, 0.25);
    drawRect(vec2(0, 0), vec2(WORLD_SIZE, WORLD_SIZE), worldColor);

    // Border
    const borderColor = new Color(0.1, 0.15, 0.1);
    drawRect(vec2(0, -WORLD_SIZE/2), vec2(WORLD_SIZE, 1), borderColor);
    drawRect(vec2(0, WORLD_SIZE/2), vec2(WORLD_SIZE, 1), borderColor);
    drawRect(vec2(-WORLD_SIZE/2, 0), vec2(1, WORLD_SIZE), borderColor);
    drawRect(vec2(WORLD_SIZE/2, 0), vec2(1, WORLD_SIZE), borderColor);

    if (gamePhase === 'menu') {
        drawText('MINISHOOT', cameraPos.add(vec2(0, 3)), 1.2, new Color(0.3, 0.9, 0.5));
        drawText('ADVENTURES', cameraPos.add(vec2(0, 1.5)), 0.8, new Color(0.5, 0.8, 0.6));
        drawText('WASD to move', cameraPos.add(vec2(0, -0.5)), 0.4, new Color(0.8, 0.8, 0.8));
        drawText('Arrow keys to shoot', cameraPos.add(vec2(0, -1.3)), 0.4, new Color(0.8, 0.8, 0.8));
        drawText('Shift to dash', cameraPos.add(vec2(0, -2.1)), 0.4, new Color(0.8, 0.8, 0.8));
        drawText('Press Space to Start', cameraPos.add(vec2(0, -4)), 0.6, new Color(0, 1, 0));
    } else if (gamePhase === 'playing') {
        // Pickups
        for (const p of pickups) {
            const color = p.type === 'xp' ? new Color(1, 0.2, 0.4) : new Color(1, 0.3, 0.3);
            drawRect(vec2(p.x, p.y), vec2(0.3, 0.3), color);
        }

        // Player
        if (player) {
            let playerColor = new Color(0.3, 0.8, 0.5);
            if (player.invincible > 0) {
                playerColor = new Color(1, 1, 1, 0.5);
            } else if (player.isDashing) {
                playerColor = new Color(0.5, 1, 0.8);
            }

            drawRect(vec2(player.x, player.y), vec2(0.7, 0.7), playerColor);

            // Aim indicator
            const aimLen = 0.8;
            const aimEnd = vec2(player.x + Math.cos(player.angle) * aimLen,
                               player.y + Math.sin(player.angle) * aimLen);
            drawLine(vec2(player.x, player.y), aimEnd, 0.1, new Color(1, 1, 0.5));
        }

        // Enemies
        for (const enemy of enemies) {
            let color, size;
            switch (enemy.type) {
                case 'basic': color = new Color(0.8, 0.4, 0.2); size = 0.5; break;
                case 'shooter': color = new Color(0.6, 0.2, 0.6); size = 0.6; break;
                case 'tank': color = new Color(0.4, 0.4, 0.6); size = 0.9; break;
                case 'fast': color = new Color(0.2, 0.7, 0.2); size = 0.4; break;
                case 'boss': color = new Color(0.9, 0.2, 0.2); size = 1.5; break;
                default: color = new Color(0.8, 0.4, 0.2); size = 0.5;
            }
            drawRect(vec2(enemy.x, enemy.y), vec2(size, size), color);

            // Boss HP bar
            if (enemy.type === 'boss') {
                const barWidth = 3;
                const hpRatio = enemy.hp / enemy.maxHp;
                drawRect(vec2(enemy.x, enemy.y + 1.2), vec2(barWidth, 0.2), new Color(0.3, 0.3, 0.3));
                drawRect(vec2(enemy.x - (1-hpRatio)*barWidth/2, enemy.y + 1.2), vec2(barWidth * hpRatio, 0.2), new Color(1, 0, 0));
            }
        }

        // Player bullets
        for (const b of bullets) {
            const color = b.type === 'super' ? new Color(0.3, 0.7, 1) : new Color(1, 1, 0.5);
            const size = b.type === 'super' ? 0.3 : 0.15;
            drawRect(vec2(b.x, b.y), vec2(size, size), color);
        }

        // Enemy bullets
        for (const b of enemyBullets) {
            drawRect(vec2(b.x, b.y), vec2(0.2, 0.2), new Color(1, 0.5, 0.2));
        }

        // UI
        if (player) {
            const uiBase = cameraPos.add(vec2(0, 8));

            // HP hearts
            for (let i = 0; i < Math.ceil(stats.maxHp); i++) {
                const heartX = uiBase.x - 8 + i * 0.7;
                const heartColor = i < Math.floor(stats.hp) ? new Color(1, 0.2, 0.3) :
                                  i < stats.hp ? new Color(1, 0.5, 0.5) :
                                  new Color(0.3, 0.3, 0.3);
                drawRect(vec2(heartX, uiBase.y), vec2(0.5, 0.5), heartColor);
            }

            // Energy
            for (let i = 0; i < stats.maxEnergy; i++) {
                const energyX = uiBase.x - 8 + i * 0.5;
                const energyColor = i < stats.energy ? new Color(0.3, 0.7, 1) : new Color(0.2, 0.2, 0.3);
                drawRect(vec2(energyX, uiBase.y - 0.7), vec2(0.4, 0.25), energyColor);
            }

            // Level and XP
            const xpNeeded = 10 + (playerLevel - 1) * 2;
            drawText(`Lv.${playerLevel}`, vec2(uiBase.x + 5, uiBase.y), 0.4, new Color(0.3, 1, 0.5));
            drawText(`XP:${xp}/${xpNeeded}`, vec2(uiBase.x + 5, uiBase.y - 0.7), 0.3, new Color(1, 0.3, 0.5));

            // Kills
            drawText(`Kills: ${kills}`, vec2(uiBase.x + 8, uiBase.y), 0.35, new Color(0.8, 0.8, 0.8));

            // Dash indicator
            if (player.dashCooldown <= 0) {
                drawText('DASH READY', vec2(uiBase.x, uiBase.y - 1.5), 0.3, new Color(0.5, 1, 0.8));
            }
        }
    } else if (gamePhase === 'gameover') {
        drawText('GAME OVER', cameraPos.add(vec2(0, 2)), 1.2, new Color(1, 0.3, 0.3));
        drawText(`Level: ${playerLevel}`, cameraPos.add(vec2(0, 0)), 0.6, new Color(1, 1, 1));
        drawText(`Kills: ${kills}`, cameraPos.add(vec2(0, -1)), 0.5, new Color(0.8, 0.8, 0.8));
        drawText('Press Space to Restart', cameraPos.add(vec2(0, -3)), 0.5, new Color(0, 1, 0));
    }
}

function gameRenderPost() {}

// Harness
window.harness = {
    pause: () => { gamePaused = true; },
    resume: () => { gamePaused = false; },
    isPaused: () => gamePaused,

    execute: (action, durationMs) => {
        return new Promise((resolve) => {
            if (action.keys) {
                for (const key of action.keys) {
                    simulatedKeys.add(key);
                    simulatedKeys.add(key.toLowerCase());
                }
            }
            if (action.mouse) {
                simulatedMouse.x = action.mouse.x || simulatedMouse.x;
                simulatedMouse.y = action.mouse.y || simulatedMouse.y;
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
        gamePhase: gamePhase,
        kills: kills,
        level: playerLevel,
        xp: xp,
        skillPoints: skillPoints,
        player: player ? {
            x: player.x,
            y: player.y,
            hp: stats.hp,
            maxHp: stats.maxHp,
            energy: stats.energy,
            invincible: player.invincible > 0,
            isDashing: player.isDashing
        } : null,
        enemies: enemies.map(e => ({
            x: e.x,
            y: e.y,
            type: e.type,
            hp: e.hp
        })),
        enemyBullets: enemyBullets.length,
        pickups: pickups.length
    }),

    getPhase: () => gamePhase,

    debug: {
        setHealth: (hp) => { stats.hp = hp; },
        forceStart: () => {
            if (gamePhase !== 'playing') {
                startGame();
            }
            gamePaused = false;
        },
        clearEnemies: () => { enemies = []; },
        addXp: (n) => { addXp(n); },
        spawnBoss: () => {
            if (player) {
                enemies.push(new Enemy(player.x + 5, player.y, 'boss'));
            }
        }
    }
};

// Init
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
