// Brotato Clone - Arena Survivor
// Canvas Implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = 800;
const HEIGHT = 600;

// Game state
let gameState = 'menu'; // menu, characterSelect, playing, shop, levelUp, gameover, victory
let gamePaused = true;
let lastTime = 0;

// Wave system
let currentWave = 1;
let waveTimer = 0;
let waveDuration = 30;
const TOTAL_WAVES = 20;

// Player
let player = null;
let projectiles = [];
let enemies = [];
let pickups = [];
let particles = [];

// Shop
let shopItems = [];
let levelUpChoices = [];

// Input
let keys = {};

// Harness v2 - time tracking and debug logs
let gameTime = 0;
let debugLogs = [];

function logEvent(msg) {
    debugLogs.push(`[${Math.floor(gameTime)}ms] ${msg}`);
}

// Characters
const CHARACTERS = {
    well_rounded: { name: 'Well Rounded', hp: 15, speed: 5, damage: 0, harvesting: 8, weapon: 'pistol' },
    brawler: { name: 'Brawler', hp: 10, speed: 10, damage: 10, harvesting: 0, weapon: 'fist' },
    ranger: { name: 'Ranger', hp: 8, speed: 5, damage: 5, harvesting: 5, weapon: 'rifle' },
    tank: { name: 'Tank', hp: 25, speed: -5, damage: -5, harvesting: 0, weapon: 'shotgun' },
    speedster: { name: 'Speedster', hp: 8, speed: 20, damage: 0, harvesting: 10, weapon: 'smg' }
};

// Weapons
const WEAPONS = {
    pistol: { name: 'Pistol', damage: 8, fireRate: 500, range: 300, projectileSpeed: 400, type: 'ranged' },
    fist: { name: 'Fist', damage: 12, fireRate: 400, range: 50, projectileSpeed: 0, type: 'melee' },
    rifle: { name: 'Rifle', damage: 15, fireRate: 800, range: 400, projectileSpeed: 600, type: 'ranged' },
    shotgun: { name: 'Shotgun', damage: 5, fireRate: 900, range: 200, projectileSpeed: 350, pellets: 5, type: 'ranged' },
    smg: { name: 'SMG', damage: 4, fireRate: 150, range: 250, projectileSpeed: 450, type: 'ranged' }
};

// Enemy types
const ENEMY_TYPES = {
    baby_alien: { name: 'Baby Alien', hp: 3, speed: 80, damage: 1, xp: 5, gold: 2, size: 12, color: '#4a4', firstWave: 1 },
    chaser: { name: 'Chaser', hp: 2, speed: 150, damage: 1, xp: 4, gold: 1, size: 10, color: '#6a6', firstWave: 1 },
    charger: { name: 'Charger', hp: 6, speed: 50, damage: 2, xp: 8, gold: 3, size: 16, color: '#a64', charges: true, firstWave: 2 },
    spitter: { name: 'Spitter', hp: 5, speed: 40, damage: 1, xp: 10, gold: 4, size: 14, color: '#46a', ranged: true, firstWave: 3 },
    bruiser: { name: 'Bruiser', hp: 20, speed: 30, damage: 3, xp: 20, gold: 8, size: 24, color: '#a44', firstWave: 5 },
    healer: { name: 'Healer', hp: 8, speed: 60, damage: 1, xp: 15, gold: 6, size: 14, color: '#4a8', heals: true, firstWave: 7 }
};

// Items
const ITEMS = {
    helmet: { name: 'Helmet', cost: 20, stats: { armor: 2 } },
    bandana: { name: 'Bandana', cost: 25, stats: { damage: 5 } },
    boots: { name: 'Running Boots', cost: 18, stats: { speed: 8 } },
    medikit: { name: 'Medikit', cost: 30, stats: { hpRegen: 2 } },
    lucky_charm: { name: 'Lucky Charm', cost: 35, stats: { luck: 15, harvesting: 5 } },
    power_glove: { name: 'Power Glove', cost: 40, stats: { damage: 8, attackSpeed: 5 } },
    glasses: { name: 'Glasses', cost: 22, stats: { critChance: 8 } },
    magnet: { name: 'Magnet', cost: 20, stats: { pickupRange: 50 } }
};

// Player class
class Player {
    constructor(character) {
        this.x = WIDTH / 2;
        this.y = HEIGHT / 2;
        this.width = 20;
        this.height = 20;

        // Base stats
        this.hp = 10 + (character.hp || 0);
        this.maxHp = this.hp;
        this.baseSpeed = 200;

        // Stats from character and items
        this.stats = {
            damage: character.damage || 0,
            attackSpeed: 0,
            critChance: 0,
            armor: 0,
            dodge: 0,
            speed: character.speed || 0,
            luck: 0,
            harvesting: character.harvesting || 0,
            hpRegen: 0,
            range: 0,
            pickupRange: 50
        };

        // Progression
        this.xp = 0;
        this.level = 1;
        this.xpToLevel = 16;
        this.gold = 0;

        // Weapons
        this.weapons = [{ ...WEAPONS[character.weapon], cooldown: 0 }];

        // Combat
        this.invincible = false;
        this.invincibleTime = 0;
        this.regenTimer = 0;
    }

    get speed() {
        return this.baseSpeed * (1 + this.stats.speed / 100);
    }

    update(dt) {
        // Movement
        let dx = 0, dy = 0;
        if (keys['w'] || keys['ArrowUp']) dy -= 1;
        if (keys['s'] || keys['ArrowDown']) dy += 1;
        if (keys['a'] || keys['ArrowLeft']) dx -= 1;
        if (keys['d'] || keys['ArrowRight']) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;

            this.x += dx * this.speed * dt;
            this.y += dy * this.speed * dt;

            // Clamp to arena
            this.x = Math.max(20, Math.min(WIDTH - 20, this.x));
            this.y = Math.max(60, Math.min(HEIGHT - 20, this.y));
        }

        // Auto-fire weapons
        for (const weapon of this.weapons) {
            weapon.cooldown -= dt * 1000;
            if (weapon.cooldown <= 0 && enemies.length > 0) {
                this.fireWeapon(weapon);
                const fireRate = weapon.fireRate / (1 + this.stats.attackSpeed / 100);
                weapon.cooldown = fireRate;
            }
        }

        // HP Regen
        if (this.stats.hpRegen > 0) {
            this.regenTimer += dt;
            if (this.regenTimer >= 5) {
                this.regenTimer = 0;
                this.hp = Math.min(this.maxHp, this.hp + this.stats.hpRegen);
            }
        }

        // Invincibility
        if (this.invincible && Date.now() - this.invincibleTime > 500) {
            this.invincible = false;
        }
    }

    fireWeapon(weapon) {
        // Find nearest enemy
        let nearest = null;
        let nearestDist = Infinity;
        const range = weapon.range + this.stats.range;

        for (const e of enemies) {
            const dist = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
            if (dist < nearestDist && dist < range) {
                nearestDist = dist;
                nearest = e;
            }
        }

        if (!nearest) return;

        const angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);

        if (weapon.type === 'melee') {
            // Melee attack
            const damage = this.calculateDamage(weapon);
            for (const e of enemies) {
                const dist = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                if (dist < weapon.range) {
                    this.dealDamage(e, damage);
                }
            }
            // Visual
            for (let i = 0; i < 5; i++) {
                particles.push({
                    x: this.x + Math.cos(angle) * 30,
                    y: this.y + Math.sin(angle) * 30,
                    vx: Math.cos(angle + (Math.random() - 0.5)) * 100,
                    vy: Math.sin(angle + (Math.random() - 0.5)) * 100,
                    life: 200,
                    color: '#ff8'
                });
            }
        } else {
            // Ranged attack
            const pellets = weapon.pellets || 1;
            for (let i = 0; i < pellets; i++) {
                const spread = pellets > 1 ? (i - (pellets - 1) / 2) * 0.15 : 0;
                projectiles.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle + spread) * weapon.projectileSpeed,
                    vy: Math.sin(angle + spread) * weapon.projectileSpeed,
                    damage: this.calculateDamage(weapon),
                    range: weapon.range + this.stats.range,
                    traveled: 0,
                    isPlayer: true
                });
            }
        }
    }

    calculateDamage(weapon) {
        let damage = weapon.damage + this.stats.damage;
        // Crit check
        if (Math.random() * 100 < this.stats.critChance) {
            damage *= 2;
        }
        return Math.max(1, Math.floor(damage));
    }

    dealDamage(enemy, damage) {
        enemy.hp -= damage;
        showFloatingText(enemy.x, enemy.y, `-${damage}`, '#ff0');

        if (enemy.hp <= 0) {
            this.onEnemyKill(enemy);
        }
    }

    onEnemyKill(enemy) {
        const type = ENEMY_TYPES[enemy.type];
        logEvent(`Enemy killed: ${enemy.type} at (${Math.floor(enemy.x)}, ${Math.floor(enemy.y)})`);

        // XP
        const xpGain = type.xp + this.stats.harvesting;
        this.xp += xpGain;

        // Gold
        const goldGain = type.gold + Math.floor(this.stats.harvesting / 5);
        this.gold += goldGain;

        // Spawn pickup
        pickups.push({
            x: enemy.x,
            y: enemy.y,
            type: 'xp',
            value: xpGain
        });

        // Death particles
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: enemy.x,
                y: enemy.y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 300,
                color: type.color
            });
        }
    }

    takeDamage(amount) {
        if (this.invincible) return;

        // Dodge check
        if (Math.random() * 100 < Math.min(this.stats.dodge, 60)) {
            showFloatingText(this.x, this.y, 'DODGE', '#0ff');
            return;
        }

        // Armor reduction
        const armorReduction = this.stats.armor / (this.stats.armor + 15);
        let damage = Math.max(1, Math.floor(amount * (1 - armorReduction)));

        this.hp -= damage;
        this.invincible = true;
        this.invincibleTime = Date.now();
        logEvent(`Player took ${damage} damage, HP: ${this.hp}/${this.maxHp}`);

        showFloatingText(this.x, this.y, `-${damage}`, '#f00');

        if (this.hp <= 0) {
            logEvent('Player died - GAME OVER');
        }

        // Pain particles
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 200,
                color: '#f00'
            });
        }

        if (this.hp <= 0) {
            gameState = 'gameover';
        }
    }

    checkLevelUp() {
        while (this.xp >= this.xpToLevel) {
            this.xp -= this.xpToLevel;
            this.level++;
            this.maxHp++;
            this.hp = Math.min(this.hp + 1, this.maxHp);
            this.xpToLevel = (this.level + 3) ** 2;
            return true;
        }
        return false;
    }

    draw() {
        const alpha = this.invincible ? 0.5 + Math.sin(Date.now() * 0.02) * 0.3 : 1;
        ctx.globalAlpha = alpha;

        // Potato body
        ctx.fillStyle = '#c90';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 2, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 4, this.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    }
}

// Enemy class
class Enemy {
    constructor(type, x, y, wave) {
        this.type = type;
        this.x = x;
        this.y = y;
        const data = ENEMY_TYPES[type];
        this.hp = data.hp + Math.floor(wave * 0.5);
        this.maxHp = this.hp;
        this.speed = data.speed;
        this.damage = data.damage;
        this.size = data.size;
        this.color = data.color;
        this.ranged = data.ranged;
        this.charges = data.charges;
        this.heals = data.heals;
        this.lastShot = 0;
        this.chargeTimer = 0;
        this.charging = false;
        this.healTimer = 0;
    }

    update(dt) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (this.charges) {
            // Charger behavior
            this.chargeTimer += dt;
            if (this.chargeTimer > 2 && !this.charging) {
                this.charging = true;
                this.chargeDir = { x: dx / dist, y: dy / dist };
            }
            if (this.charging) {
                this.x += this.chargeDir.x * this.speed * 3 * dt;
                this.y += this.chargeDir.y * this.speed * 3 * dt;
                if (this.chargeTimer > 2.5) {
                    this.charging = false;
                    this.chargeTimer = 0;
                }
            } else {
                // Slow approach
                this.x += (dx / dist) * this.speed * 0.5 * dt;
                this.y += (dy / dist) * this.speed * 0.5 * dt;
            }
        } else if (this.ranged) {
            // Spitter - keep distance and shoot
            if (dist < 150) {
                this.x -= (dx / dist) * this.speed * dt;
                this.y -= (dy / dist) * this.speed * dt;
            } else if (dist > 250) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }
            // Shoot
            if (Date.now() - this.lastShot > 2000) {
                this.lastShot = Date.now();
                const angle = Math.atan2(dy, dx);
                projectiles.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * 150,
                    vy: Math.sin(angle) * 150,
                    damage: this.damage,
                    range: 400,
                    traveled: 0,
                    isPlayer: false
                });
            }
        } else if (this.heals) {
            // Healer - stay near other enemies, heal them
            this.healTimer += dt;
            if (this.healTimer > 3) {
                this.healTimer = 0;
                for (const e of enemies) {
                    if (e !== this) {
                        const d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                        if (d < 100) {
                            e.hp = Math.min(e.maxHp, e.hp + 3);
                            showFloatingText(e.x, e.y, '+3', '#0f0');
                        }
                    }
                }
            }
            // Move toward center of enemies
            let avgX = 0, avgY = 0, count = 0;
            for (const e of enemies) {
                if (e !== this) { avgX += e.x; avgY += e.y; count++; }
            }
            if (count > 0) {
                avgX /= count; avgY /= count;
                const tdx = avgX - this.x;
                const tdy = avgY - this.y;
                const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
                if (tdist > 50) {
                    this.x += (tdx / tdist) * this.speed * dt;
                    this.y += (tdy / tdist) * this.speed * dt;
                }
            }
        } else {
            // Chase player
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        // Clamp to arena
        this.x = Math.max(this.size, Math.min(WIDTH - this.size, this.x));
        this.y = Math.max(50 + this.size, Math.min(HEIGHT - this.size, this.y));

        // Contact damage
        if (dist < this.size + player.width / 2) {
            player.takeDamage(this.damage);
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        ctx.beginPath();
        ctx.arc(this.x + Math.cos(angle - 0.3) * this.size * 0.4, this.y + Math.sin(angle - 0.3) * this.size * 0.4, 2, 0, Math.PI * 2);
        ctx.arc(this.x + Math.cos(angle + 0.3) * this.size * 0.4, this.y + Math.sin(angle + 0.3) * this.size * 0.4, 2, 0, Math.PI * 2);
        ctx.fill();

        // HP bar if damaged
        if (this.hp < this.maxHp) {
            ctx.fillStyle = '#300';
            ctx.fillRect(this.x - 15, this.y - this.size - 8, 30, 4);
            ctx.fillStyle = '#f00';
            ctx.fillRect(this.x - 15, this.y - this.size - 8, 30 * (this.hp / this.maxHp), 4);
        }
    }
}

// Wave spawning
function getEnemyPool(wave) {
    const pool = [];
    for (const [type, data] of Object.entries(ENEMY_TYPES)) {
        if (data.firstWave <= wave) {
            pool.push(type);
        }
    }
    return pool;
}

function spawnEnemy() {
    const pool = getEnemyPool(currentWave);
    const type = pool[Math.floor(Math.random() * pool.length)];

    // Spawn from edges
    let x, y;
    const side = Math.floor(Math.random() * 4);
    switch (side) {
        case 0: x = Math.random() * WIDTH; y = 50; break; // top
        case 1: x = Math.random() * WIDTH; y = HEIGHT; break; // bottom
        case 2: x = 0; y = 50 + Math.random() * (HEIGHT - 50); break; // left
        case 3: x = WIDTH; y = 50 + Math.random() * (HEIGHT - 50); break; // right
    }

    enemies.push(new Enemy(type, x, y, currentWave));
}

function getWaveDuration(wave) {
    if (wave >= 9 && wave < 20) return 60;
    if (wave === 20) return 90;
    return 20 + (wave - 1) * 5;
}

function getSpawnRate(wave) {
    return 0.5 + wave * 0.3;
}

// Shop
function generateShop() {
    shopItems = [];
    const itemKeys = Object.keys(ITEMS);
    const weaponKeys = Object.keys(WEAPONS);

    // 2 weapons + 2 items
    for (let i = 0; i < 2; i++) {
        const key = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
        shopItems.push({ type: 'weapon', key, data: WEAPONS[key], cost: 50 + currentWave * 5 });
    }
    for (let i = 0; i < 2; i++) {
        const key = itemKeys[Math.floor(Math.random() * itemKeys.length)];
        shopItems.push({ type: 'item', key, data: ITEMS[key], cost: ITEMS[key].cost + currentWave * 2 });
    }
}

function generateLevelUpChoices() {
    const stats = ['damage', 'attackSpeed', 'critChance', 'armor', 'dodge', 'speed', 'hpRegen', 'maxHp'];
    const values = { damage: 5, attackSpeed: 8, critChance: 5, armor: 2, dodge: 5, speed: 5, hpRegen: 1, maxHp: 5 };

    levelUpChoices = [];
    const shuffled = stats.sort(() => Math.random() - 0.5);
    for (let i = 0; i < 4; i++) {
        const stat = shuffled[i];
        levelUpChoices.push({ stat, value: values[stat] });
    }
}

// Floating text
function showFloatingText(x, y, text, color) {
    const container = document.getElementById('floatingTexts');
    const elem = document.createElement('div');
    elem.className = 'floating-text';
    elem.style.left = x + 'px';
    elem.style.top = y + 'px';
    elem.style.color = color;
    elem.textContent = text;
    container.appendChild(elem);
    setTimeout(() => elem.remove(), 600);
}

// Update
let spawnTimer = 0;

function update(dt) {
    if (gameState === 'playing') {
        player.update(dt);

        // Wave timer
        waveTimer -= dt;
        if (waveTimer <= 0) {
            // End wave
            enemies = [];
            if (currentWave >= TOTAL_WAVES) {
                gameState = 'victory';
            } else {
                if (player.checkLevelUp()) {
                    generateLevelUpChoices();
                    gameState = 'levelUp';
                } else {
                    generateShop();
                    gameState = 'shop';
                }
            }
            return;
        }

        // Spawn enemies
        spawnTimer += dt;
        const spawnRate = getSpawnRate(currentWave);
        if (spawnTimer > 1 / spawnRate && enemies.length < 50) {
            spawnTimer = 0;
            spawnEnemy();
        }

        // Update enemies
        for (const e of enemies) {
            e.update(dt);
        }

        // Update projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.traveled += Math.sqrt(p.vx ** 2 + p.vy ** 2) * dt;

            // Out of range or arena
            if (p.traveled > p.range || p.x < 0 || p.x > WIDTH || p.y < 50 || p.y > HEIGHT) {
                projectiles.splice(i, 1);
                continue;
            }

            if (p.isPlayer) {
                // Hit enemy
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const e = enemies[j];
                    const dist = Math.sqrt((e.x - p.x) ** 2 + (e.y - p.y) ** 2);
                    if (dist < e.size) {
                        player.dealDamage(e, p.damage);
                        projectiles.splice(i, 1);
                        if (e.hp <= 0) {
                            enemies.splice(j, 1);
                        }
                        break;
                    }
                }
            } else {
                // Hit player
                const dist = Math.sqrt((player.x - p.x) ** 2 + (player.y - p.y) ** 2);
                if (dist < player.width / 2 + 4) {
                    player.takeDamage(p.damage);
                    projectiles.splice(i, 1);
                }
            }
        }

        // Update pickups
        for (let i = pickups.length - 1; i >= 0; i--) {
            const p = pickups[i];
            const dist = Math.sqrt((player.x - p.x) ** 2 + (player.y - p.y) ** 2);
            if (dist < player.stats.pickupRange) {
                pickups.splice(i, 1);
            }
        }

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 1000;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }
}

// Draw
function draw() {
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (gameState === 'menu') {
        drawMenu();
    } else if (gameState === 'characterSelect') {
        drawCharacterSelect();
    } else if (gameState === 'playing') {
        drawGame();
        drawHUD();
    } else if (gameState === 'shop') {
        drawGame();
        drawShop();
    } else if (gameState === 'levelUp') {
        drawGame();
        drawLevelUp();
    } else if (gameState === 'gameover') {
        drawGame();
        drawGameOver();
    } else if (gameState === 'victory') {
        drawGame();
        drawVictory();
    }
}

function drawGame() {
    // Arena border
    ctx.strokeStyle = '#4a4a6a';
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 55, WIDTH - 10, HEIGHT - 60);

    // Pickups
    for (const p of pickups) {
        ctx.fillStyle = '#8f8';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Enemies
    for (const e of enemies) {
        e.draw();
    }

    // Player
    if (player) {
        player.draw();
    }

    // Projectiles
    for (const p of projectiles) {
        ctx.fillStyle = p.isPlayer ? '#ff0' : '#f55';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Particles
    for (const p of particles) {
        ctx.globalAlpha = p.life / 300;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawHUD() {
    // Top bar background
    ctx.fillStyle = '#1a1a3a';
    ctx.fillRect(0, 0, WIDTH, 50);

    // HP bar
    ctx.fillStyle = '#400';
    ctx.fillRect(10, 10, 150, 20);
    ctx.fillStyle = '#f44';
    ctx.fillRect(10, 10, 150 * (player.hp / player.maxHp), 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 150, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${player.hp}/${player.maxHp}`, 85, 24);

    // XP bar
    ctx.fillStyle = '#040';
    ctx.fillRect(10, 35, 150, 10);
    ctx.fillStyle = '#4f4';
    ctx.fillRect(10, 35, 150 * (player.xp / player.xpToLevel), 10);

    // Wave timer
    ctx.textAlign = 'center';
    ctx.font = '16px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Wave ${currentWave}/${TOTAL_WAVES}`, WIDTH / 2, 20);
    ctx.fillText(`${Math.ceil(waveTimer)}s`, WIDTH / 2, 40);

    // Gold
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fc0';
    ctx.fillText(`Gold: ${player.gold}`, WIDTH - 10, 20);

    // Level
    ctx.fillStyle = '#0ff';
    ctx.fillText(`Level ${player.level}`, WIDTH - 10, 40);
}

function drawMenu() {
    ctx.fillStyle = '#fc0';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BROTATO', WIDTH / 2, HEIGHT / 2 - 60);

    ctx.font = '18px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Arena Survivor', WIDTH / 2, HEIGHT / 2 - 20);
    ctx.fillText('WASD to Move - Weapons auto-fire', WIDTH / 2, HEIGHT / 2 + 20);

    ctx.fillStyle = '#ff0';
    ctx.fillText('Click to Start', WIDTH / 2, HEIGHT / 2 + 70);
}

function drawCharacterSelect() {
    ctx.fillStyle = '#fc0';
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT CHARACTER', WIDTH / 2, 60);

    const chars = Object.entries(CHARACTERS);
    const startY = 120;
    const spacing = 90;

    for (let i = 0; i < chars.length; i++) {
        const [key, data] = chars[i];
        const y = startY + i * spacing;

        ctx.fillStyle = '#2a2a4a';
        ctx.fillRect(150, y - 25, 500, 70);

        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}. ${data.name}`, 170, y);

        ctx.font = '14px monospace';
        ctx.fillStyle = '#aaa';
        const stats = `HP:${10 + data.hp} SPD:${data.speed > 0 ? '+' : ''}${data.speed}% DMG:${data.damage > 0 ? '+' : ''}${data.damage}`;
        ctx.fillText(stats, 170, y + 25);
        ctx.fillText(`Weapon: ${WEAPONS[data.weapon].name}`, 170, y + 40);
    }

    ctx.fillStyle = '#ff0';
    ctx.textAlign = 'center';
    ctx.font = '16px monospace';
    ctx.fillText('Press 1-5 to select', WIDTH / 2, HEIGHT - 50);
}

function drawShop() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#fc0';
    ctx.font = '28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SHOP', WIDTH / 2, 60);

    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Gold: ${player.gold}`, WIDTH / 2, 90);

    const startX = 100;
    const spacing = 150;

    for (let i = 0; i < shopItems.length; i++) {
        const item = shopItems[i];
        const x = startX + i * spacing;
        const y = HEIGHT / 2 - 50;

        ctx.fillStyle = '#2a2a4a';
        ctx.fillRect(x - 50, y - 30, 120, 120);

        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.data.name, x + 10, y);
        ctx.fillStyle = '#fc0';
        ctx.fillText(`${item.cost}g`, x + 10, y + 20);

        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        if (item.type === 'weapon') {
            ctx.fillText(`DMG: ${item.data.damage}`, x + 10, y + 50);
        } else {
            const statText = Object.entries(item.data.stats).map(([k, v]) => `${k}:+${v}`).join(' ');
            ctx.fillText(statText, x + 10, y + 50);
        }

        ctx.fillStyle = '#0f0';
        ctx.fillText(`[${i + 1}]`, x + 10, y + 75);
    }

    ctx.fillStyle = '#ff0';
    ctx.font = '16px monospace';
    ctx.fillText('Press 1-4 to buy, SPACE to continue', WIDTH / 2, HEIGHT - 50);
}

function drawLevelUp() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#0f0';
    ctx.font = '28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL UP!', WIDTH / 2, 80);

    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Level ${player.level}`, WIDTH / 2, 110);

    const startX = 100;
    const spacing = 150;

    for (let i = 0; i < levelUpChoices.length; i++) {
        const choice = levelUpChoices[i];
        const x = startX + i * spacing;
        const y = HEIGHT / 2;

        ctx.fillStyle = '#2a4a2a';
        ctx.fillRect(x - 40, y - 30, 100, 80);

        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(choice.stat, x + 10, y);
        ctx.fillStyle = '#0f0';
        ctx.fillText(`+${choice.value}`, x + 10, y + 25);

        ctx.fillStyle = '#ff0';
        ctx.fillText(`[${i + 1}]`, x + 10, y + 45);
    }

    ctx.fillStyle = '#ff0';
    ctx.font = '16px monospace';
    ctx.fillText('Press 1-4 to choose', WIDTH / 2, HEIGHT - 50);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#f44';
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 30);

    ctx.font = '18px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Wave ${currentWave} | Level ${player.level}`, WIDTH / 2, HEIGHT / 2 + 10);

    ctx.fillStyle = '#ff0';
    ctx.fillText('Click to Restart', WIDTH / 2, HEIGHT / 2 + 60);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#4f4';
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', WIDTH / 2, HEIGHT / 2 - 30);

    ctx.font = '18px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Completed all ${TOTAL_WAVES} waves!`, WIDTH / 2, HEIGHT / 2 + 10);
    ctx.fillText(`Level ${player.level} | Gold: ${player.gold}`, WIDTH / 2, HEIGHT / 2 + 40);

    ctx.fillStyle = '#ff0';
    ctx.fillText('Click to Play Again', WIDTH / 2, HEIGHT / 2 + 90);
}

// Game loop
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    if (!gamePaused) {
        update(dt);
    }
    draw();

    requestAnimationFrame(gameLoop);
}

// Input
canvas.addEventListener('click', () => {
    if (gameState === 'menu') {
        gameState = 'characterSelect';
    } else if (gameState === 'gameover' || gameState === 'victory') {
        gameState = 'menu';
    }
});

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.key] = true;

    // Character select
    if (gameState === 'characterSelect') {
        const chars = Object.keys(CHARACTERS);
        const num = parseInt(e.key);
        if (num >= 1 && num <= chars.length) {
            const charKey = chars[num - 1];
            player = new Player(CHARACTERS[charKey]);
            currentWave = 1;
            waveTimer = getWaveDuration(currentWave);
            enemies = [];
            projectiles = [];
            pickups = [];
            particles = [];
            gameState = 'playing';
            gamePaused = false;
        }
    }

    // Shop
    if (gameState === 'shop') {
        if (e.key === ' ') {
            currentWave++;
            waveTimer = getWaveDuration(currentWave);
            gameState = 'playing';
        } else {
            const num = parseInt(e.key);
            if (num >= 1 && num <= shopItems.length) {
                const item = shopItems[num - 1];
                if (player.gold >= item.cost) {
                    player.gold -= item.cost;
                    if (item.type === 'weapon') {
                        if (player.weapons.length < 6) {
                            player.weapons.push({ ...item.data, cooldown: 0 });
                        }
                    } else {
                        for (const [stat, value] of Object.entries(item.data.stats)) {
                            if (stat === 'maxHp') {
                                player.maxHp += value;
                                player.hp += value;
                            } else {
                                player.stats[stat] = (player.stats[stat] || 0) + value;
                            }
                        }
                    }
                    shopItems.splice(num - 1, 1);
                }
            }
        }
    }

    // Level up
    if (gameState === 'levelUp') {
        const num = parseInt(e.key);
        if (num >= 1 && num <= levelUpChoices.length) {
            const choice = levelUpChoices[num - 1];
            if (choice.stat === 'maxHp') {
                player.maxHp += choice.value;
                player.hp += choice.value;
            } else {
                player.stats[choice.stat] = (player.stats[choice.stat] || 0) + choice.value;
            }
            generateShop();
            gameState = 'shop';
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.key] = false;
});

// Initialize
lastTime = performance.now();
requestAnimationFrame(gameLoop);

// Harness interface
window.harness = {
    pause: () => { gamePaused = true; },
    resume: () => { gamePaused = false; },
    isPaused: () => gamePaused,

    execute: async ({ keys: inputKeys = [], duration = 500, screenshot = false }) => {
        const startReal = performance.now();
        debugLogs = [];

        // Set active keys
        for (const k of inputKeys) {
            keys[k.toLowerCase()] = true;
            keys[k] = true;

            // Handle immediate state transitions
            if (gameState === 'characterSelect') {
                const chars = Object.keys(CHARACTERS);
                const num = parseInt(k);
                if (num >= 1 && num <= chars.length) {
                    const charKey = chars[num - 1];
                    player = new Player(CHARACTERS[charKey]);
                    currentWave = 1;
                    waveTimer = getWaveDuration(currentWave);
                    enemies = [];
                    projectiles = [];
                    pickups = [];
                    particles = [];
                    gameState = 'playing';
                    logEvent(`Character selected: ${charKey}`);
                }
            }

            if (gameState === 'shop') {
                if (k === ' ') {
                    currentWave++;
                    waveTimer = getWaveDuration(currentWave);
                    gameState = 'playing';
                    logEvent(`Wave ${currentWave} started`);
                } else {
                    const num = parseInt(k);
                    if (num >= 1 && num <= shopItems.length) {
                        const item = shopItems[num - 1];
                        if (player && player.gold >= item.cost) {
                            player.gold -= item.cost;
                            if (item.type === 'weapon') {
                                if (player.weapons.length < 6) {
                                    player.weapons.push({ ...item.data, cooldown: 0 });
                                    logEvent(`Weapon purchased: ${item.data.name}`);
                                }
                            } else {
                                for (const [stat, value] of Object.entries(item.data.stats)) {
                                    if (stat === 'maxHp') {
                                        player.maxHp += value;
                                        player.hp += value;
                                    } else {
                                        player.stats[stat] = (player.stats[stat] || 0) + value;
                                    }
                                }
                                logEvent(`Item purchased: ${item.data.name}`);
                            }
                            shopItems.splice(num - 1, 1);
                        }
                    }
                }
            }

            if (gameState === 'levelUp') {
                const num = parseInt(k);
                if (num >= 1 && num <= levelUpChoices.length) {
                    const choice = levelUpChoices[num - 1];
                    if (choice.stat === 'maxHp') {
                        player.maxHp += choice.value;
                        player.hp += choice.value;
                    } else {
                        player.stats[choice.stat] = (player.stats[choice.stat] || 0) + choice.value;
                    }
                    logEvent(`Level up: ${choice.stat} +${choice.value}`);
                    generateShop();
                    gameState = 'shop';
                }
            }
        }

        // Run physics for duration (TIME-ACCELERATED)
        const dt = 16;  // 16ms per tick
        const ticks = Math.ceil(duration / dt);

        for (let i = 0; i < ticks; i++) {
            const phase = window.harness.getPhase();
            if (phase === 'gameover' || phase === 'victory') break;
            if (phase !== 'playing') break;  // Don't run physics in menus

            gameTime += dt;
            update(dt / 1000);
        }

        // Clear keys
        for (const k of inputKeys) {
            keys[k.toLowerCase()] = false;
            keys[k] = false;
        }

        // Render final frame
        draw();

        // Capture screenshot
        let screenshotData = null;
        if (screenshot) {
            screenshotData = canvas.toDataURL('image/png');
        }

        return {
            screenshot: screenshotData,
            logs: [...debugLogs],
            state: window.harness.getState(),
            realTime: performance.now() - startReal,
        };
    },

    getState: () => ({
        gameState,
        gameTime,
        wave: currentWave,
        waveTimer: Math.ceil(waveTimer),
        player: player ? {
            x: player.x,
            y: player.y,
            hp: player.hp,
            maxHp: player.maxHp,
            gold: player.gold,
            level: player.level,
            xp: player.xp,
            weapons: player.weapons.length
        } : null,
        enemies: enemies.map(e => ({ x: e.x, y: e.y, type: e.type, hp: e.hp })),
        shopItems: shopItems.length,
        levelUpChoices: levelUpChoices.length
    }),

    getPhase: () => {
        if (gameState === 'menu') return 'menu';
        if (gameState === 'characterSelect') return 'menu';
        if (gameState === 'gameover') return 'gameover';
        if (gameState === 'victory') return 'victory';
        if (gameState === 'shop' || gameState === 'levelUp') return 'shop';
        return 'playing';
    },

    debug: {
        setHealth: (hp) => { if (player) player.hp = hp; },
        addGold: (g) => { if (player) player.gold += g; },
        clearEnemies: () => { enemies = []; },
        forceStart: () => {
            player = new Player(CHARACTERS.well_rounded);
            currentWave = 1;
            waveTimer = getWaveDuration(currentWave);
            enemies = [];
            projectiles = [];
            pickups = [];
            particles = [];
            gameState = 'playing';
            gamePaused = true;
            gameTime = 0;
            debugLogs = [];
        },
        skipWave: () => {
            waveTimer = 0;
        },
        selectCharacter: (num) => {
            const chars = Object.keys(CHARACTERS);
            if (num >= 1 && num <= chars.length) {
                const charKey = chars[num - 1];
                player = new Player(CHARACTERS[charKey]);
                currentWave = 1;
                waveTimer = getWaveDuration(currentWave);
                enemies = [];
                projectiles = [];
                pickups = [];
                particles = [];
                gameState = 'playing';
                gamePaused = true;
            }
        }
    },

    version: '2.0',

    gameInfo: {
        name: 'Brotato Clone',
        type: 'arena_survivor',
        controls: {
            movement: ['w', 'a', 's', 'd'],
            shop: ['1', '2', '3', '4', ' ']
        }
    }
};

console.log('[HARNESS v2] Brotato time-accelerated harness ready');
