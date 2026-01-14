// Star of Providence Clone - Bullet Hell Roguelike
// Built with LittleJS - Night 6 Implementation
'use strict';

// ==================== CONSTANTS ====================
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 4.5;
const PLAYER_FOCUS_SPEED = 1.8;
const PLAYER_HITBOX = 0.12; // Tiny hitbox for bullet hell
const DASH_DISTANCE = 3;
const DASH_DURATION = 0.1;
const DASH_COOLDOWN = 0.5;
const DASH_IFRAMES = 0.15;

// Colors
const COLOR_PLAYER = new Color(0, 0.8, 1);
const COLOR_PLAYER_FOCUS = new Color(1, 0.2, 0.8);
const COLOR_BULLET = new Color(1, 1, 0);
const COLOR_ENEMY = new Color(1, 0.3, 0.3);
const COLOR_ENEMY_BULLET = new Color(1, 0.5, 0.8);
const COLOR_PICKUP = new Color(0.3, 1, 0.3);
const COLOR_BOMB = new Color(0.5, 0.5, 1);

// ==================== GAME STATE ====================
let gameState = 'playing';
let gamePaused = true;
let player = null;
let enemies = [];
let playerBullets = [];
let enemyBullets = [];
let pickups = [];
let particles = [];
let floatingTexts = [];

// Player stats
let playerStats = {
    hp: 4,
    maxHp: 4,
    shields: 0,
    bombs: 2,
    maxBombs: 6,
    score: 0,
    multiplier: 1.0,
    floor: 1,
    roomsCleared: 0
};

// Current weapon
let currentWeapon = {
    name: 'Peashooter',
    damage: 5,
    fireRate: 0.1,
    ammo: Infinity
};

let shootCooldown = 0;
let dashCooldown = 0;
let invincibleTimer = 0;
let isDashing = false;
let isFocusing = false;

// Wave system
let currentWave = 0;
let waveTimer = 0;
let waveEnemiesRemaining = 0;
let betweenWaves = true;

// Simulated input
let simulatedKeys = new Set();

// ==================== PLAYER CLASS ====================
class Player {
    constructor() {
        this.pos = vec2(GAME_WIDTH / 64, GAME_HEIGHT / 64 * 0.8);
        this.angle = -Math.PI / 2; // Facing up
        this.size = 0.5;
    }

    update() {
        if (gamePaused) return;

        // Update timers
        if (invincibleTimer > 0) invincibleTimer -= 1/60;
        if (dashCooldown > 0) dashCooldown -= 1/60;
        if (shootCooldown > 0) shootCooldown -= 1/60;

        // Input
        let moveDir = vec2(0, 0);
        if (isKeyHeld('w') || isKeyHeld('ArrowUp')) moveDir.y += 1;
        if (isKeyHeld('s') || isKeyHeld('ArrowDown')) moveDir.y -= 1;
        if (isKeyHeld('a') || isKeyHeld('ArrowLeft')) moveDir.x -= 1;
        if (isKeyHeld('d') || isKeyHeld('ArrowRight')) moveDir.x += 1;

        // Focus mode (Shift)
        isFocusing = isKeyHeld('Shift');

        // Movement
        if (moveDir.length() > 0) {
            moveDir = moveDir.normalize();
            const speed = isFocusing ? PLAYER_FOCUS_SPEED : PLAYER_SPEED;
            this.pos = this.pos.add(moveDir.scale(speed / 60));

            // Clamp to bounds
            this.pos.x = clamp(this.pos.x, 0.5, GAME_WIDTH / 32 - 0.5);
            this.pos.y = clamp(this.pos.y, 0.5, GAME_HEIGHT / 32 - 0.5);
        }

        // Dash (Z key)
        if (isKeyHeld('z') && dashCooldown <= 0 && !isDashing) {
            this.dash(moveDir.length() > 0 ? moveDir : vec2(0, 1));
        }

        // Shoot (Space)
        if (isKeyHeld('Space') && shootCooldown <= 0) {
            this.shoot();
        }

        // Bomb (X key)
        if (isKeyHeld('x') && playerStats.bombs > 0) {
            this.bomb();
        }
    }

    dash(dir) {
        isDashing = true;
        invincibleTimer = DASH_IFRAMES;
        dashCooldown = DASH_COOLDOWN;

        const dashTarget = this.pos.add(dir.scale(DASH_DISTANCE));
        dashTarget.x = clamp(dashTarget.x, 0.5, GAME_WIDTH / 32 - 0.5);
        dashTarget.y = clamp(dashTarget.y, 0.5, GAME_HEIGHT / 32 - 0.5);

        // Instant dash
        this.pos = dashTarget;

        setTimeout(() => { isDashing = false; }, DASH_DURATION * 1000);

        // Particles
        for (let i = 0; i < 10; i++) {
            particles.push({
                pos: this.pos.copy(),
                vel: vec2(rand(-2, 2), rand(-2, 2)),
                color: COLOR_PLAYER,
                life: 0.3,
                size: 0.2
            });
        }
    }

    shoot() {
        shootCooldown = currentWeapon.fireRate;

        // Create bullet going up
        playerBullets.push({
            pos: this.pos.add(vec2(0, 0.3)),
            vel: vec2(0, 12),
            damage: currentWeapon.damage,
            life: 2
        });

        // Slight spread for visual interest
        if (currentWeapon.name !== 'Peashooter') {
            playerBullets.push({
                pos: this.pos.add(vec2(-0.2, 0.2)),
                vel: vec2(-0.5, 12),
                damage: currentWeapon.damage * 0.7,
                life: 2
            });
            playerBullets.push({
                pos: this.pos.add(vec2(0.2, 0.2)),
                vel: vec2(0.5, 12),
                damage: currentWeapon.damage * 0.7,
                life: 2
            });
        }
    }

    bomb() {
        if (playerStats.bombs <= 0) return;
        playerStats.bombs--;

        // Clear all enemy bullets
        enemyBullets = [];

        // Damage all enemies
        for (const enemy of enemies) {
            enemy.takeDamage(50);
        }

        // Big flash effect
        for (let i = 0; i < 50; i++) {
            particles.push({
                pos: vec2(rand(0, GAME_WIDTH/32), rand(0, GAME_HEIGHT/32)),
                vel: vec2(0, 0),
                color: COLOR_BOMB,
                life: 0.5,
                size: rand(0.3, 0.8)
            });
        }

        addFloatingText(this.pos.x, this.pos.y + 1, 'BOMB!', COLOR_BOMB);
    }

    takeDamage() {
        if (invincibleTimer > 0) return;

        // Auto-bomb if available
        if (playerStats.bombs > 0) {
            this.bomb();
            playerStats.multiplier = Math.max(1.0, playerStats.multiplier - 0.5);
            return;
        }

        if (playerStats.shields > 0) {
            playerStats.shields--;
        } else {
            playerStats.hp--;
        }

        playerStats.multiplier = Math.max(1.0, playerStats.multiplier - 1.0);
        invincibleTimer = 1.0;

        addFloatingText(this.pos.x, this.pos.y + 0.5, '-1 HP', new Color(1, 0.3, 0.3));

        if (playerStats.hp <= 0) {
            gameState = 'gameover';
        }
    }

    render() {
        // Flash when invincible
        if (invincibleTimer > 0 && Math.floor(invincibleTimer * 15) % 2 === 0) {
            return;
        }

        // Ship body
        const shipColor = isFocusing ? COLOR_PLAYER_FOCUS : COLOR_PLAYER;
        drawRect(this.pos, vec2(this.size, this.size * 1.2), shipColor);

        // Ship point (triangle effect)
        drawRect(this.pos.add(vec2(0, 0.3)), vec2(0.2, 0.3), shipColor);

        // Focus hitbox indicator
        if (isFocusing) {
            drawRect(this.pos, vec2(PLAYER_HITBOX * 4, PLAYER_HITBOX * 4), new Color(1, 1, 1, 0.5));
        }

        // Engine glow
        drawRect(this.pos.add(vec2(0, -0.4)), vec2(0.15, 0.2), new Color(1, 0.5, 0));
    }
}

// ==================== ENEMY CLASS ====================
class Enemy {
    constructor(x, y, type) {
        this.pos = vec2(x, y);
        this.type = type || 'basic';
        this.hp = 20;
        this.maxHp = 20;
        this.shootTimer = rand(0.5, 2);
        this.moveTimer = 0;
        this.moveDir = vec2(rand(-1, 1), rand(-0.5, 0.5));
        this.size = 0.6;
        this.points = 100;

        // Type-specific stats
        switch (type) {
            case 'shooter':
                this.hp = 30;
                this.maxHp = 30;
                this.shootTimer = 1.5;
                this.points = 200;
                break;
            case 'swarm':
                this.hp = 10;
                this.maxHp = 10;
                this.size = 0.4;
                this.points = 50;
                break;
            case 'tank':
                this.hp = 80;
                this.maxHp = 80;
                this.size = 0.9;
                this.points = 500;
                break;
            case 'boss':
                this.hp = 300;
                this.maxHp = 300;
                this.size = 1.5;
                this.points = 2000;
                this.phase = 0;
                break;
        }
    }

    update() {
        if (gamePaused) return;

        // Movement
        this.moveTimer -= 1/60;
        if (this.moveTimer <= 0) {
            this.moveTimer = rand(1, 3);
            this.moveDir = vec2(rand(-1, 1), rand(-0.3, 0.3)).normalize();
        }

        const speed = this.type === 'swarm' ? 2 : 1;
        this.pos = this.pos.add(this.moveDir.scale(speed / 60));

        // Keep in upper portion of screen
        this.pos.x = clamp(this.pos.x, 1, GAME_WIDTH / 32 - 1);
        this.pos.y = clamp(this.pos.y, GAME_HEIGHT / 32 * 0.3, GAME_HEIGHT / 32 - 1);

        // Shooting
        this.shootTimer -= 1/60;
        if (this.shootTimer <= 0 && player) {
            this.shoot();
            this.shootTimer = this.type === 'boss' ? 0.5 : (this.type === 'shooter' ? 1.0 : 2.0);
        }
    }

    shoot() {
        if (!player) return;

        const toPlayer = player.pos.subtract(this.pos).normalize();

        if (this.type === 'basic' || this.type === 'swarm') {
            // Single aimed shot
            enemyBullets.push({
                pos: this.pos.copy(),
                vel: toPlayer.scale(4),
                life: 5
            });
        } else if (this.type === 'shooter') {
            // Spread shot
            for (let i = -2; i <= 2; i++) {
                const angle = Math.atan2(toPlayer.y, toPlayer.x) + i * 0.2;
                enemyBullets.push({
                    pos: this.pos.copy(),
                    vel: vec2(Math.cos(angle), Math.sin(angle)).scale(3),
                    life: 5
                });
            }
        } else if (this.type === 'tank') {
            // Circular burst
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                enemyBullets.push({
                    pos: this.pos.copy(),
                    vel: vec2(Math.cos(angle), Math.sin(angle)).scale(2.5),
                    life: 6
                });
            }
        } else if (this.type === 'boss') {
            // Complex patterns based on phase
            this.phase = (this.phase + 1) % 3;

            if (this.phase === 0) {
                // Spiral
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2 + Date.now() / 500;
                    enemyBullets.push({
                        pos: this.pos.copy(),
                        vel: vec2(Math.cos(angle), Math.sin(angle)).scale(3),
                        life: 6
                    });
                }
            } else if (this.phase === 1) {
                // Aimed burst
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        if (player && !gamePaused) {
                            const aim = player.pos.subtract(this.pos).normalize();
                            enemyBullets.push({
                                pos: this.pos.copy(),
                                vel: aim.scale(5),
                                life: 5
                            });
                        }
                    }, i * 100);
                }
            } else {
                // Wall of bullets
                for (let i = 0; i < 15; i++) {
                    enemyBullets.push({
                        pos: vec2(i * (GAME_WIDTH / 32 / 15), this.pos.y),
                        vel: vec2(0, -2.5),
                        life: 8
                    });
                }
            }
        }
    }

    takeDamage(damage) {
        this.hp -= damage;

        // Hit flash effect
        particles.push({
            pos: this.pos.copy(),
            vel: vec2(0, 0),
            color: new Color(1, 1, 1),
            life: 0.1,
            size: this.size
        });

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        // Remove from array
        const idx = enemies.indexOf(this);
        if (idx >= 0) enemies.splice(idx, 1);

        // Score
        const scoreGain = Math.floor(this.points * playerStats.multiplier);
        playerStats.score += scoreGain;
        playerStats.multiplier = Math.min(3.0, playerStats.multiplier + 0.05);

        addFloatingText(this.pos.x, this.pos.y, `+${scoreGain}`, new Color(1, 1, 0));

        // Explosion particles
        for (let i = 0; i < 15; i++) {
            particles.push({
                pos: this.pos.copy(),
                vel: vec2(rand(-3, 3), rand(-3, 3)),
                color: COLOR_ENEMY,
                life: 0.5,
                size: rand(0.2, 0.4)
            });
        }

        // Drop pickup
        if (rand() < 0.3) {
            pickups.push({
                pos: this.pos.copy(),
                type: rand() < 0.5 ? 'health' : 'bomb',
                life: 10
            });
        }

        waveEnemiesRemaining--;
    }

    render() {
        // Enemy body
        const healthPct = this.hp / this.maxHp;
        const color = COLOR_ENEMY.lerp(new Color(0.3, 0.1, 0.1), 1 - healthPct);

        if (this.type === 'boss') {
            // Boss is diamond shaped
            drawRect(this.pos, vec2(this.size, this.size), color, Math.PI / 4);
            drawRect(this.pos, vec2(this.size * 0.6, this.size * 0.6), new Color(0.8, 0.2, 0.5));
        } else {
            drawRect(this.pos, vec2(this.size, this.size), color);
        }

        // Health bar for bigger enemies
        if (this.type === 'tank' || this.type === 'boss') {
            const barWidth = this.size * 1.5;
            drawRect(this.pos.add(vec2(0, -this.size - 0.2)), vec2(barWidth, 0.15), new Color(0.3, 0.3, 0.3));
            drawRect(this.pos.add(vec2(-barWidth/2 * (1-healthPct), -this.size - 0.2)), vec2(barWidth * healthPct, 0.15), new Color(1, 0.2, 0.2));
        }
    }
}

// ==================== WAVE SYSTEM ====================
function spawnWave() {
    currentWave++;
    betweenWaves = false;

    const enemyCount = 3 + currentWave * 2;
    waveEnemiesRemaining = enemyCount;

    // Spawn enemies at top of screen
    for (let i = 0; i < enemyCount; i++) {
        const x = rand(2, GAME_WIDTH / 32 - 2);
        const y = rand(GAME_HEIGHT / 32 * 0.5, GAME_HEIGHT / 32 - 2);

        let type = 'basic';
        const roll = rand();
        if (currentWave >= 3 && roll < 0.1) type = 'tank';
        else if (currentWave >= 2 && roll < 0.3) type = 'shooter';
        else if (roll < 0.5) type = 'swarm';

        enemies.push(new Enemy(x, y, type));
    }

    // Boss every 5 waves
    if (currentWave % 5 === 0) {
        enemies.push(new Enemy(GAME_WIDTH / 64, GAME_HEIGHT / 32 * 0.6, 'boss'));
        waveEnemiesRemaining++;
    }

    addFloatingText(GAME_WIDTH / 64, GAME_HEIGHT / 64, `WAVE ${currentWave}`, new Color(1, 1, 0));
}

function checkWaveComplete() {
    if (waveEnemiesRemaining <= 0 && enemies.length === 0 && !betweenWaves) {
        betweenWaves = true;
        waveTimer = 2.0; // Wait before next wave
        playerStats.roomsCleared++;

        // Replenish bomb every 3 rooms
        if (playerStats.roomsCleared % 3 === 0 && playerStats.bombs < playerStats.maxBombs) {
            playerStats.bombs++;
            addFloatingText(player.pos.x, player.pos.y + 1, '+1 BOMB', COLOR_BOMB);
        }
    }

    if (betweenWaves) {
        waveTimer -= 1/60;
        if (waveTimer <= 0) {
            spawnWave();
        }
    }
}

// ==================== COLLISION ====================
function updateBullets() {
    // Player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const b = playerBullets[i];
        b.pos = b.pos.add(b.vel.scale(1/60));
        b.life -= 1/60;

        // Out of bounds or expired
        if (b.life <= 0 || b.pos.y > GAME_HEIGHT / 32 || b.pos.y < 0 ||
            b.pos.x < 0 || b.pos.x > GAME_WIDTH / 32) {
            playerBullets.splice(i, 1);
            continue;
        }

        // Hit enemy
        for (const enemy of enemies) {
            const dist = b.pos.subtract(enemy.pos).length();
            if (dist < enemy.size / 2 + 0.1) {
                enemy.takeDamage(b.damage);
                playerBullets.splice(i, 1);
                break;
            }
        }
    }

    // Enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        b.pos = b.pos.add(b.vel.scale(1/60));
        b.life -= 1/60;

        // Out of bounds or expired
        if (b.life <= 0 || b.pos.y > GAME_HEIGHT / 32 || b.pos.y < 0 ||
            b.pos.x < 0 || b.pos.x > GAME_WIDTH / 32) {
            enemyBullets.splice(i, 1);
            continue;
        }

        // Hit player (tiny hitbox!)
        if (player && !isDashing && invincibleTimer <= 0) {
            const dist = b.pos.subtract(player.pos).length();
            if (dist < PLAYER_HITBOX + 0.1) {
                player.takeDamage();
                enemyBullets.splice(i, 1);
            }
        }
    }
}

function updatePickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        p.life -= 1/60;

        if (p.life <= 0) {
            pickups.splice(i, 1);
            continue;
        }

        // Collect
        if (player) {
            const dist = p.pos.subtract(player.pos).length();
            if (dist < 0.8) {
                if (p.type === 'health' && playerStats.hp < playerStats.maxHp) {
                    playerStats.hp++;
                    addFloatingText(p.pos.x, p.pos.y, '+1 HP', new Color(0.3, 1, 0.3));
                } else if (p.type === 'bomb' && playerStats.bombs < playerStats.maxBombs) {
                    playerStats.bombs++;
                    addFloatingText(p.pos.x, p.pos.y, '+1 BOMB', COLOR_BOMB);
                }
                pickups.splice(i, 1);
            }
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.pos = p.pos.add(p.vel.scale(1/60));
        p.life -= 1/60;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
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
        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

// ==================== INPUT HELPERS ====================
function isKeyHeld(key) {
    const keyLower = key.toLowerCase();
    if (simulatedKeys.has(keyLower)) return true;
    if (simulatedKeys.has(key)) return true;

    const keyMap = {
        'w': 'KeyW', 'a': 'KeyA', 's': 'KeyS', 'd': 'KeyD',
        'z': 'KeyZ', 'x': 'KeyX',
        'shift': 'ShiftLeft', 'Shift': 'ShiftLeft',
        'ArrowUp': 'ArrowUp', 'ArrowDown': 'ArrowDown',
        'ArrowLeft': 'ArrowLeft', 'ArrowRight': 'ArrowRight',
        ' ': 'Space', 'Space': 'Space', 'space': 'Space'
    };

    const mappedKey = keyMap[key] || keyMap[keyLower] || key;
    if (simulatedKeys.has(mappedKey)) return true;
    if (simulatedKeys.has(mappedKey.toLowerCase())) return true;

    return keyIsDown(mappedKey) || keyIsDown(key);
}

// ==================== RENDERING ====================
function renderGame() {
    // Background
    drawRect(vec2(GAME_WIDTH / 64, GAME_HEIGHT / 64), vec2(GAME_WIDTH / 32, GAME_HEIGHT / 32), new Color(0.05, 0.05, 0.1));

    // Stars background
    for (let i = 0; i < 50; i++) {
        const x = (i * 17 + Date.now() / 50) % (GAME_WIDTH / 32);
        const y = (i * 23) % (GAME_HEIGHT / 32);
        drawRect(vec2(x, y), vec2(0.05, 0.05), new Color(0.5, 0.5, 0.6));
    }

    // Pickups
    for (const p of pickups) {
        const color = p.type === 'health' ? COLOR_PICKUP : COLOR_BOMB;
        const pulse = 1 + Math.sin(Date.now() / 150) * 0.2;
        drawRect(p.pos, vec2(0.4 * pulse, 0.4 * pulse), color);
    }

    // Player bullets
    for (const b of playerBullets) {
        drawRect(b.pos, vec2(0.15, 0.3), COLOR_BULLET);
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
    if (player) {
        player.render();
    }

    // Particles
    for (const p of particles) {
        const alpha = p.life;
        drawRect(p.pos, vec2(p.size, p.size), p.color.lerp(new Color(0,0,0,0), 1-alpha));
    }

    // Floating texts
    for (const ft of floatingTexts) {
        const alpha = Math.min(1, ft.life);
        drawText(ft.text, ft.pos, 0.4, ft.color.lerp(new Color(1,1,1,0), 1-alpha));
    }
}

function renderHUD() {
    const sw = mainCanvasSize.x;
    const sh = mainCanvasSize.y;

    // HP hearts
    for (let i = 0; i < playerStats.maxHp; i++) {
        const filled = i < playerStats.hp;
        const color = filled ? new Color(1, 0.2, 0.2) : new Color(0.3, 0.1, 0.1);
        drawRect(screenToWorld(vec2(30 + i * 25, 30)), vec2(0.6, 0.6), color);
    }

    // Shields
    for (let i = 0; i < playerStats.shields; i++) {
        drawRect(screenToWorld(vec2(30 + i * 20, 55)), vec2(0.5, 0.5), new Color(0.2, 0.6, 1));
    }

    // Bombs
    drawText(`BOMBS: ${playerStats.bombs}`, screenToWorld(vec2(30, 80)), 0.4, COLOR_BOMB);

    // Score
    drawText(`SCORE: ${playerStats.score}`, screenToWorld(vec2(sw - 150, 30)), 0.4, new Color(1, 1, 0));

    // Multiplier
    const multColor = playerStats.multiplier >= 2.5 ? new Color(1, 0.5, 0) : new Color(1, 1, 1);
    drawText(`x${playerStats.multiplier.toFixed(2)}`, screenToWorld(vec2(sw - 100, 55)), 0.5, multColor);

    // Wave
    drawText(`WAVE ${currentWave}`, screenToWorld(vec2(sw / 2, 30)), 0.5, new Color(1, 1, 1));

    // Game over / victory
    if (gameState === 'gameover') {
        drawRect(screenToWorld(vec2(sw/2, sh/2)), vec2(sw/32, sh/32), new Color(0, 0, 0, 0.8));
        drawText('GAME OVER', screenToWorld(vec2(sw/2, sh/2 - 50)), 1.2, new Color(1, 0.2, 0.2));
        drawText(`FINAL SCORE: ${playerStats.score}`, screenToWorld(vec2(sw/2, sh/2 + 20)), 0.5, new Color(1, 1, 0));
        drawText('Press R to restart', screenToWorld(vec2(sw/2, sh/2 + 60)), 0.4, new Color(1, 1, 1));
    }
}

// ==================== MAIN FUNCTIONS ====================
function gameInit() {
    canvasFixedSize = vec2(GAME_WIDTH, GAME_HEIGHT);
    cameraScale = 32;
    cameraPos = vec2(GAME_WIDTH / 64, GAME_HEIGHT / 64);

    player = new Player();
    spawnWave();
    gameState = 'playing';
}

function gameUpdate() {
    if (gamePaused) return;

    if (player) player.update();

    for (const enemy of [...enemies]) {
        enemy.update();
    }

    updateBullets();
    updatePickups();
    updateParticles();
    updateFloatingTexts();
    checkWaveComplete();

    // Restart
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
        hp: 4,
        maxHp: 4,
        shields: 0,
        bombs: 2,
        maxBombs: 6,
        score: 0,
        multiplier: 1.0,
        floor: 1,
        roomsCleared: 0
    };

    player = new Player();
    enemies = [];
    playerBullets = [];
    enemyBullets = [];
    pickups = [];
    particles = [];
    floatingTexts = [];
    currentWave = 0;
    betweenWaves = true;
    waveTimer = 1;

    gameState = 'playing';
}

// ==================== HARNESS ====================
(function() {
    window.harness = {
        pause: () => {
            gamePaused = true;
            simulatedKeys.clear();
        },

        resume: () => {
            gamePaused = false;
        },

        isPaused: () => gamePaused,

        execute: (action, durationMs) => {
            return new Promise((resolve) => {
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

        getState: () => {
            return {
                gameState,
                player: player ? {
                    x: player.pos.x,
                    y: player.pos.y,
                    hp: playerStats.hp,
                    maxHp: playerStats.maxHp,
                    bombs: playerStats.bombs,
                    isFocusing
                } : null,
                enemies: enemies.map(e => ({
                    x: e.pos.x,
                    y: e.pos.y,
                    type: e.type,
                    hp: e.hp
                })),
                enemyBullets: enemyBullets.length,
                score: playerStats.score,
                wave: currentWave,
                multiplier: playerStats.multiplier
            };
        },

        getPhase: () => gameState,

        debug: {
            setHealth: (hp) => { playerStats.hp = hp; },
            clearEnemies: () => { enemies = []; waveEnemiesRemaining = 0; },
            clearBullets: () => { enemyBullets = []; },
            forceStart: () => {
                if (gameState !== 'playing') restartGame();
                gamePaused = false;
            },
            forceGameOver: () => { gameState = 'gameover'; },
            log: (msg) => { console.log('[HARNESS]', msg); }
        },

        version: '1.0',
        gameInfo: {
            name: 'Star of Providence Clone',
            type: 'bullet_hell',
            controls: {
                movement: ['w', 'a', 's', 'd'],
                fire: ['Space'],
                actions: { focus: 'Shift', dash: 'z', bomb: 'x' }
            }
        }
    };

    console.log('[HARNESS] Test harness initialized');
})();

// ==================== START ====================
engineInit(gameInit, gameUpdate, () => {}, gameRender, gameRenderPost);
