// Brotato Clone - LittleJS Arena Survivor
'use strict';

// Constants
const ARENA_SIZE = 20;
const BASE_SPEED = 5;
const WAVE_DURATION = 30;
const MAX_WAVES = 20;

// Game state
let gamePaused = true;
let gamePhase = 'menu'; // menu, playing, shop, gameover, victory
let player = null;
let enemies = [];
let bullets = [];
let pickups = [];
let currentWave = 1;
let waveTimer = WAVE_DURATION;
let kills = 0;

// Input simulation
let simulatedKeys = new Set();

// Player stats
const defaultStats = {
    maxHp: 10,
    hp: 10,
    hpRegen: 0,
    lifeSteal: 0,
    damage: 0,
    meleeDamage: 0,
    rangedDamage: 0,
    attackSpeed: 0,
    critChance: 0,
    armor: 0,
    dodge: 0,
    speed: 0,
    range: 0,
    luck: 0,
    harvesting: 0
};

let stats = { ...defaultStats };
let xp = 0;
let level = 1;
let materials = 0;

// Weapons
const WEAPON_TYPES = {
    pistol: { name: 'Pistol', damage: 12, cooldown: 0.8, range: 10, type: 'ranged' },
    smg: { name: 'SMG', damage: 4, cooldown: 0.15, range: 8, type: 'ranged' },
    shotgun: { name: 'Shotgun', damage: 6, cooldown: 1.0, range: 6, type: 'ranged', pellets: 5, spread: 0.4 },
    knife: { name: 'Knife', damage: 8, cooldown: 0.6, range: 2, type: 'melee' }
};

let weapons = [];

// Player class
class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.invincible = 0;
    }

    update(dt) {
        // Movement
        let dx = 0, dy = 0;
        if (isKeyHeld('w') || isKeyHeld('W')) dy = 1;
        if (isKeyHeld('s') || isKeyHeld('S')) dy = -1;
        if (isKeyHeld('a') || isKeyHeld('A')) dx = -1;
        if (isKeyHeld('d') || isKeyHeld('D')) dx = 1;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        const speed = (BASE_SPEED * (1 + stats.speed / 100)) * dt;
        this.x = Math.max(-ARENA_SIZE/2 + 0.5, Math.min(ARENA_SIZE/2 - 0.5, this.x + dx * speed));
        this.y = Math.max(-ARENA_SIZE/2 + 0.5, Math.min(ARENA_SIZE/2 - 0.5, this.y + dy * speed));

        // Invincibility
        if (this.invincible > 0) this.invincible -= dt;

        // HP regen
        if (stats.hpRegen > 0) {
            stats.hp = Math.min(stats.maxHp, stats.hp + stats.hpRegen * dt * 0.2);
        }

        // Fire weapons
        for (const weapon of weapons) {
            weapon.cooldownTimer -= dt;
            if (weapon.cooldownTimer <= 0) {
                this.fireWeapon(weapon);
            }
        }
    }

    fireWeapon(weapon) {
        // Find nearest enemy
        let nearest = null;
        let nearestDist = Infinity;
        for (const enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist && dist < weapon.range + stats.range) {
                nearestDist = dist;
                nearest = enemy;
            }
        }

        if (!nearest) {
            weapon.cooldownTimer = weapon.cooldown * 0.1; // Short wait
            return;
        }

        const actualCooldown = weapon.cooldown / (1 + stats.attackSpeed / 100);
        weapon.cooldownTimer = actualCooldown;

        const dx = nearest.x - this.x;
        const dy = nearest.y - this.y;
        const angle = Math.atan2(dy, dx);

        if (weapon.type === 'melee') {
            // Melee attack - instant hit on nearest
            const baseDamage = weapon.damage + stats.meleeDamage;
            const finalDamage = baseDamage * (1 + stats.damage / 100);
            const isCrit = Math.random() < stats.critChance / 100;
            nearest.takeDamage(finalDamage * (isCrit ? 2 : 1));
        } else {
            // Ranged attack
            const pellets = weapon.pellets || 1;
            const spread = weapon.spread || 0;

            for (let i = 0; i < pellets; i++) {
                const spreadAngle = pellets > 1 ? (i - (pellets - 1) / 2) * spread : 0;
                const bulletAngle = angle + spreadAngle;
                bullets.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(bulletAngle) * 15,
                    vy: Math.sin(bulletAngle) * 15,
                    damage: weapon.damage + stats.rangedDamage,
                    life: 2
                });
            }
        }
    }

    takeDamage(amount) {
        if (this.invincible > 0) return;

        // Dodge check
        if (Math.random() < Math.min(stats.dodge, 60) / 100) return;

        // Armor reduction
        const reducedDamage = Math.max(1, amount * (1 - stats.armor / (stats.armor + 15)));

        stats.hp -= reducedDamage;
        this.invincible = 0.5;

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

        switch (type) {
            case 'basic':
                this.hp = 10 + currentWave * 2;
                this.maxHp = this.hp;
                this.speed = 1.5;
                this.damage = 1;
                this.xpValue = 5;
                this.matValue = 1;
                break;
            case 'fast':
                this.hp = 5 + currentWave;
                this.maxHp = this.hp;
                this.speed = 3;
                this.damage = 1;
                this.xpValue = 3;
                this.matValue = 1;
                break;
            case 'tank':
                this.hp = 30 + currentWave * 5;
                this.maxHp = this.hp;
                this.speed = 0.8;
                this.damage = 3;
                this.xpValue = 10;
                this.matValue = 3;
                break;
            case 'elite':
                this.hp = 50 + currentWave * 8;
                this.maxHp = this.hp;
                this.speed = 1.2;
                this.damage = 5;
                this.xpValue = 25;
                this.matValue = 5;
                break;
            default:
                this.hp = 10;
                this.maxHp = 10;
                this.speed = 1.5;
                this.damage = 1;
                this.xpValue = 5;
                this.matValue = 1;
        }
    }

    update(dt) {
        if (!player) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.5) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        } else {
            player.takeDamage(this.damage);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;

        // Life steal
        if (Math.random() < stats.lifeSteal / 100) {
            stats.hp = Math.min(stats.maxHp, stats.hp + 1);
        }

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        const idx = enemies.indexOf(this);
        if (idx >= 0) enemies.splice(idx, 1);

        kills++;

        // Drop XP
        const xpAmount = this.xpValue + stats.harvesting;
        pickups.push({ x: this.x, y: this.y, type: 'xp', value: xpAmount });

        // Drop materials
        if (Math.random() < 0.3) {
            pickups.push({ x: this.x + 0.3, y: this.y, type: 'material', value: this.matValue + Math.floor(stats.harvesting / 5) });
        }
    }
}

// Spawn enemies
function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;

    switch (side) {
        case 0: x = -ARENA_SIZE/2 - 1; y = (Math.random() - 0.5) * ARENA_SIZE; break;
        case 1: x = ARENA_SIZE/2 + 1; y = (Math.random() - 0.5) * ARENA_SIZE; break;
        case 2: x = (Math.random() - 0.5) * ARENA_SIZE; y = -ARENA_SIZE/2 - 1; break;
        case 3: x = (Math.random() - 0.5) * ARENA_SIZE; y = ARENA_SIZE/2 + 1; break;
    }

    // Type based on wave
    let type = 'basic';
    const roll = Math.random();
    if (currentWave >= 10 && roll < 0.1) type = 'elite';
    else if (currentWave >= 5 && roll < 0.2) type = 'tank';
    else if (roll < 0.3) type = 'fast';

    enemies.push(new Enemy(x, y, type));
}

// Input helper
function isKeyHeld(key) {
    if (simulatedKeys.has(key)) return true;
    if (simulatedKeys.has(key.toLowerCase())) return true;
    return keyIsDown(key);
}

// XP and leveling
function addXp(amount) {
    xp += amount * (1 + stats.luck / 100);
    const xpNeeded = (level + 3) * (level + 3);

    while (xp >= xpNeeded) {
        xp -= xpNeeded;
        levelUp();
    }
}

function levelUp() {
    level++;
    stats.maxHp += 1;
    stats.hp = Math.min(stats.hp + 1, stats.maxHp);

    // Random stat boost
    const statBoosts = ['damage', 'attackSpeed', 'critChance', 'armor', 'speed', 'rangedDamage'];
    const stat = statBoosts[Math.floor(Math.random() * statBoosts.length)];

    switch (stat) {
        case 'damage': stats.damage += 5; break;
        case 'attackSpeed': stats.attackSpeed += 5; break;
        case 'critChance': stats.critChance += 3; break;
        case 'armor': stats.armor += 1; break;
        case 'speed': stats.speed += 3; break;
        case 'rangedDamage': stats.rangedDamage += 2; break;
    }
}

// Start game
function startGame() {
    gamePhase = 'playing';
    currentWave = 1;
    waveTimer = WAVE_DURATION;
    kills = 0;
    level = 1;
    xp = 0;
    materials = 100;

    stats = { ...defaultStats };
    enemies = [];
    bullets = [];
    pickups = [];

    player = new Player();

    // Starting weapon
    weapons = [
        { ...WEAPON_TYPES.pistol, cooldownTimer: 0 }
    ];
}

// End wave -> shop
function endWave() {
    if (currentWave >= MAX_WAVES) {
        gamePhase = 'victory';
        return;
    }

    gamePhase = 'shop';
    enemies = [];
    bullets = [];
}

// Start next wave
function startNextWave() {
    currentWave++;
    waveTimer = WAVE_DURATION + currentWave * 2;
    gamePhase = 'playing';
    pickups = [];
}

// LittleJS callbacks
function gameInit() {
    canvasFixedSize = vec2(800, 600);
    cameraScale = 25;
}

let spawnTimer = 0;

function gameUpdate() {
    if (gamePaused) return;

    const dt = 1/60;

    if (gamePhase === 'playing') {
        // Update player
        if (player) {
            player.update(dt);
        }

        // Update enemies
        for (const enemy of enemies) {
            enemy.update(dt);
        }

        // Update bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.life -= dt;

            // Check enemy collision
            for (const enemy of enemies) {
                const dx = b.x - enemy.x;
                const dy = b.y - enemy.y;
                if (dx * dx + dy * dy < 0.5) {
                    const finalDamage = b.damage * (1 + stats.damage / 100);
                    const isCrit = Math.random() < stats.critChance / 100;
                    enemy.takeDamage(finalDamage * (isCrit ? 2 : 1));
                    bullets.splice(i, 1);
                    break;
                }
            }

            if (b.life <= 0 || Math.abs(b.x) > ARENA_SIZE || Math.abs(b.y) > ARENA_SIZE) {
                bullets.splice(i, 1);
            }
        }

        // Collect pickups
        if (player) {
            const pickupRange = 1.5 + stats.range * 0.05;
            for (let i = pickups.length - 1; i >= 0; i--) {
                const p = pickups[i];
                const dx = p.x - player.x;
                const dy = p.y - player.y;
                if (dx * dx + dy * dy < pickupRange * pickupRange) {
                    if (p.type === 'xp') {
                        addXp(p.value);
                    } else if (p.type === 'material') {
                        materials += p.value;
                    }
                    pickups.splice(i, 1);
                }
            }
        }

        // Spawn enemies
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
            const spawnRate = Math.max(0.3, 2 - currentWave * 0.1);
            spawnTimer = spawnRate;
            if (enemies.length < 20 + currentWave * 3) {
                spawnEnemy();
            }
        }

        // Wave timer
        waveTimer -= dt;
        if (waveTimer <= 0) {
            endWave();
        }
    } else if (gamePhase === 'shop') {
        // Buy weapon with Space
        if (isKeyHeld('Space') || isKeyHeld(' ')) {
            if (materials >= 50 && weapons.length < 6) {
                materials -= 50;
                const types = Object.values(WEAPON_TYPES);
                weapons.push({ ...types[Math.floor(Math.random() * types.length)], cooldownTimer: 0 });
            }
            startNextWave();
        }
    }
}

function gameUpdatePost() {}

function gameRender() {
    // Background
    drawRect(vec2(0, 0), vec2(50, 50), new Color(0.1, 0.1, 0.15));

    // Arena
    drawRect(vec2(0, 0), vec2(ARENA_SIZE, ARENA_SIZE), new Color(0.15, 0.15, 0.2));

    if (gamePhase === 'menu') {
        drawText('BROTATO', vec2(0, 3), 1.5, new Color(1, 0.8, 0.2));
        drawText('Arena Survivor', vec2(0, 1.5), 0.6, new Color(1, 1, 1));
        drawText('WASD to move', vec2(0, -0.5), 0.4, new Color(0.8, 0.8, 0.8));
        drawText('Weapons fire automatically', vec2(0, -1.5), 0.4, new Color(0.8, 0.8, 0.8));
        drawText('Press Space to Start', vec2(0, -4), 0.6, new Color(0, 1, 0));
    } else if (gamePhase === 'playing') {
        // Player
        if (player) {
            const playerColor = player.invincible > 0 ?
                new Color(1, 1, 1, 0.5) : new Color(0.8, 0.6, 0.2);
            drawRect(vec2(player.x, player.y), vec2(0.8, 0.8), playerColor);
        }

        // Enemies
        for (const enemy of enemies) {
            let color;
            let size;
            switch (enemy.type) {
                case 'basic': color = new Color(0.8, 0.2, 0.2); size = 0.6; break;
                case 'fast': color = new Color(0.2, 0.8, 0.2); size = 0.4; break;
                case 'tank': color = new Color(0.5, 0.3, 0.7); size = 1.0; break;
                case 'elite': color = new Color(1, 0.8, 0.2); size = 0.8; break;
                default: color = new Color(0.8, 0.2, 0.2); size = 0.6;
            }
            drawRect(vec2(enemy.x, enemy.y), vec2(size, size), color);
        }

        // Bullets
        for (const b of bullets) {
            drawRect(vec2(b.x, b.y), vec2(0.2, 0.2), new Color(1, 1, 0.5));
        }

        // Pickups
        for (const p of pickups) {
            const color = p.type === 'xp' ? new Color(0.3, 1, 0.3) : new Color(1, 0.8, 0.2);
            drawRect(vec2(p.x, p.y), vec2(0.3, 0.3), color);
        }

        // UI
        const uiY = 9;
        drawText(`Wave ${currentWave}/${MAX_WAVES}`, vec2(0, uiY), 0.5, new Color(1, 1, 1));
        drawText(`Time: ${Math.ceil(waveTimer)}s`, vec2(0, uiY - 0.8), 0.4, new Color(0.7, 0.7, 0.7));
        drawText(`HP: ${Math.floor(stats.hp)}/${stats.maxHp}`, vec2(-8, uiY), 0.4, new Color(1, 0.3, 0.3));
        drawText(`Lvl: ${level}`, vec2(-8, uiY - 0.8), 0.4, new Color(0.3, 1, 0.3));
        drawText(`$${materials}`, vec2(8, uiY), 0.4, new Color(1, 0.8, 0.2));
        drawText(`Kills: ${kills}`, vec2(8, uiY - 0.8), 0.4, new Color(0.8, 0.8, 0.8));

    } else if (gamePhase === 'shop') {
        drawText('SHOP', vec2(0, 4), 1, new Color(1, 0.8, 0.2));
        drawText(`Materials: $${materials}`, vec2(0, 2), 0.5, new Color(1, 1, 1));
        drawText(`Weapons: ${weapons.length}/6`, vec2(0, 1), 0.4, new Color(0.8, 0.8, 0.8));
        drawText('Press Space to buy random weapon ($50)', vec2(0, -1), 0.4, new Color(0, 1, 0));
        drawText('and start next wave', vec2(0, -2), 0.4, new Color(0.7, 0.7, 0.7));
    } else if (gamePhase === 'gameover') {
        drawText('GAME OVER', vec2(0, 2), 1.2, new Color(1, 0, 0));
        drawText(`Wave: ${currentWave}`, vec2(0, 0), 0.6, new Color(1, 1, 1));
        drawText(`Kills: ${kills}`, vec2(0, -1), 0.5, new Color(0.8, 0.8, 0.8));
        drawText(`Level: ${level}`, vec2(0, -2), 0.5, new Color(0.8, 0.8, 0.8));
        drawText('Press Space to Restart', vec2(0, -4), 0.5, new Color(0, 1, 0));
    } else if (gamePhase === 'victory') {
        drawText('VICTORY!', vec2(0, 2), 1.2, new Color(1, 0.8, 0));
        drawText(`All ${MAX_WAVES} waves survived!`, vec2(0, 0), 0.6, new Color(0, 1, 0));
        drawText(`Kills: ${kills}`, vec2(0, -1), 0.5, new Color(0.8, 0.8, 0.8));
        drawText(`Level: ${level}`, vec2(0, -2), 0.5, new Color(0.8, 0.8, 0.8));
        drawText('Press Space to Restart', vec2(0, -4), 0.5, new Color(0, 1, 0));
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
        wave: currentWave,
        waveTimer: waveTimer,
        kills: kills,
        level: level,
        materials: materials,
        weaponCount: weapons.length,
        player: player ? {
            x: player.x,
            y: player.y,
            hp: stats.hp,
            maxHp: stats.maxHp,
            invincible: player.invincible > 0
        } : null,
        enemies: enemies.map(e => ({
            x: e.x,
            y: e.y,
            type: e.type,
            hp: e.hp
        })),
        pickups: pickups.length
    }),

    getPhase: () => gamePhase,

    debug: {
        setHealth: (hp) => { stats.hp = hp; },
        forceStart: () => {
            if (gamePhase !== 'playing' && gamePhase !== 'shop') {
                startGame();
            } else if (gamePhase === 'shop') {
                startNextWave();
            }
            gamePaused = false;
        },
        clearEnemies: () => { enemies = []; },
        addMaterials: (n) => { materials += n; },
        addWeapon: (type) => {
            if (WEAPON_TYPES[type] && weapons.length < 6) {
                weapons.push({ ...WEAPON_TYPES[type], cooldownTimer: 0 });
            }
        },
        skipWave: () => { waveTimer = 0; }
    }
};

// Init
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
