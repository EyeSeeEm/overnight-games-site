// Isolation Protocol - 2D Survival Horror (Subterrain Clone)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const VIEWPORT_WIDTH = 800;
const VIEWPORT_HEIGHT = 600;

// Colors
const COLORS = {
    bg: '#0a0808',
    floor: '#2a2a30',
    floorDark: '#1a1a20',
    floorGrid: '#3a3a40',
    wall: '#404050',
    wallDark: '#252530',
    wallHighlight: '#505060',
    blood: '#8a1a1a',
    bloodDark: '#5a0a0a',
    infection: '#3a8a3a',
    infectionGlow: '#4aba4a',
    player: '#3a4a5a',
    playerLight: '#5a6a7a',
    muzzleFlash: '#ffff88',
    bullet: '#ff8844',
    laser: '#ffffff',
    healthBar: '#cc3333',
    hungerBar: '#cc8833',
    infectionBar: '#33cc33',
    uiBg: 'rgba(0, 0, 0, 0.7)',
    uiBorder: '#444455',
    text: '#aaaaaa',
    textHighlight: '#ffffff',
    door: '#556655',
    doorLocked: '#664444',
    container: '#4a4a5a',
    shambler: '#7a5a4a',
    crawler: '#5a4a3a',
    spitter: '#6a7a4a',
    brute: '#8a6a5a',
    cocoon: '#5a8a5a'
};

// Game state
let gameState = 'menu';
let player = null;
let enemies = [];
let bullets = [];
let pickups = [];
let particles = [];
let bloodPools = [];
let floatingTexts = [];
let containers = [];
let doors = [];
let facilities = [];

// World state
let currentSector = 'hub';
let sectorData = {};
let powerBudget = 500;
let globalInfection = 0;
let gameTime = 0; // in game minutes

// Timing
let lastTime = performance.now();
let frameCount = 0;
let fps = 60;
let debugMode = false;
let screenShake = 0;

// Input
const keys = {};
const mouse = { x: 400, y: 300, down: false, right: false };

// Sector definitions
const SECTORS = {
    hub: {
        name: 'Central Hub',
        powerCost: 0,
        width: 15,
        height: 15,
        safe: true,
        powered: true
    },
    storage: {
        name: 'Storage Wing',
        powerCost: 100,
        width: 20,
        height: 20,
        enemies: ['shambler', 'shambler', 'shambler', 'crawler', 'crawler'],
        loot: ['food', 'food', 'water', 'scrap', 'scrap', 'cloth']
    },
    medical: {
        name: 'Medical Bay',
        powerCost: 150,
        width: 20,
        height: 20,
        enemies: ['shambler', 'shambler', 'spitter', 'spitter', 'crawler'],
        loot: ['medkit', 'medkit', 'chemicals', 'antidote', 'bandage']
    },
    research: {
        name: 'Research Lab',
        powerCost: 200,
        width: 25,
        height: 25,
        enemies: ['crawler', 'crawler', 'crawler', 'spitter', 'spitter', 'brute'],
        loot: ['electronics', 'powerCell', 'chemicals', 'dataChip'],
        hasKeycard: true
    },
    escape: {
        name: 'Escape Pod',
        powerCost: 300,
        width: 15,
        height: 15,
        enemies: ['brute', 'brute', 'shambler', 'shambler', 'spitter', 'crawler'],
        hasEscapePod: true
    }
};

// Item definitions
const ITEMS = {
    food: { name: 'Canned Food', type: 'consumable', effect: { hunger: -30 }, stack: 5 },
    water: { name: 'Water Bottle', type: 'consumable', effect: { hunger: -15 }, stack: 5 },
    medkit: { name: 'Medkit', type: 'consumable', effect: { health: 30 }, stack: 3 },
    antidote: { name: 'Antidote', type: 'consumable', effect: { infection: -30 }, stack: 3 },
    bandage: { name: 'Bandage', type: 'consumable', effect: { health: 10 }, stack: 5 },
    scrap: { name: 'Scrap Metal', type: 'material', stack: 10 },
    cloth: { name: 'Cloth', type: 'material', stack: 10 },
    chemicals: { name: 'Chemicals', type: 'material', stack: 10 },
    electronics: { name: 'Electronics', type: 'material', stack: 5 },
    powerCell: { name: 'Power Cell', type: 'material', stack: 3 },
    dataChip: { name: 'Data Chip', type: 'key', stack: 1 },
    redKeycard: { name: 'Red Keycard', type: 'key', stack: 1 },
    shiv: { name: 'Shiv', type: 'weapon', damage: 10, speed: 0.4, melee: true },
    pipeClub: { name: 'Pipe Club', type: 'weapon', damage: 20, speed: 1.0, melee: true, knockback: true },
    pistol: { name: 'Pistol', type: 'weapon', damage: 15, speed: 0.5, ammo: 12, ranged: true }
};

// Enemy definitions
const ENEMY_TYPES = {
    shambler: { name: 'Shambler', hp: 30, damage: 10, speed: 40, attackRate: 1.5, infection: 5, size: 14 },
    crawler: { name: 'Crawler', hp: 20, damage: 8, speed: 96, attackRate: 1.0, infection: 5, size: 10 },
    spitter: { name: 'Spitter', hp: 25, damage: 15, speed: 32, attackRate: 2.5, infection: 10, size: 12, ranged: true },
    brute: { name: 'Brute', hp: 80, damage: 25, speed: 24, attackRate: 2.0, infection: 8, size: 20 },
    cocoon: { name: 'Cocoon', hp: 50, damage: 0, speed: 0, attackRate: 60, infection: 1, size: 24, spawner: true }
};

// Camera
let camera = { x: 0, y: 0 };

// Room data
let roomWidth = 15;
let roomHeight = 15;
let tiles = [];

// Player class
class Player {
    constructor() {
        this.x = 240;
        this.y = 240;
        this.size = 14;
        this.speed = 160;

        // Stats
        this.maxHealth = 100;
        this.health = 100;
        this.hunger = 0;
        this.infection = 0;

        // Combat
        this.weapon = 'fists';
        this.ammo = 12;
        this.attackCooldown = 0;
        this.dodgeCooldown = 0;
        this.dodgeTimer = 0;
        this.stamina = 100;
        this.invincible = 0;

        // Inventory
        this.inventory = [];
        this.maxInventory = 20;
        this.quickSlots = [null, null, null];

        // Flags
        this.hasDataChip = false;
        this.hasKeycard = false;

        // Aiming
        this.angle = 0;
        this.muzzleFlash = 0;
    }

    update(dt) {
        // Cooldowns
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;
        if (this.dodgeTimer > 0) this.dodgeTimer -= dt;
        if (this.invincible > 0) this.invincible -= dt;
        if (this.muzzleFlash > 0) this.muzzleFlash -= dt;

        // Stamina regen
        if (this.stamina < 100) this.stamina = Math.min(100, this.stamina + 5 * dt);

        // Dodge movement
        if (this.dodgeTimer > 0) {
            this.x += Math.cos(this.dodgeAngle) * 400 * dt;
            this.y += Math.sin(this.dodgeAngle) * 400 * dt;
            this.invincible = Math.max(this.invincible, 0.1);
            this.clampToRoom();
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

            // Speed penalties
            let speed = this.speed;
            if (this.hunger >= 75) speed *= 0.75;
            else if (this.hunger >= 50) speed *= 0.9;

            const newX = this.x + dx * speed * dt;
            const newY = this.y + dy * speed * dt;

            // Collision
            if (!this.collidesWithWall(newX, this.y)) this.x = newX;
            if (!this.collidesWithWall(this.x, newY)) this.y = newY;
        }

        this.clampToRoom();

        // Aim at mouse
        const worldMouseX = mouse.x + camera.x;
        const worldMouseY = mouse.y + camera.y;
        this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

        // Dodge
        if ((keys['Space'] || mouse.right) && this.dodgeCooldown <= 0 && this.stamina >= 20) {
            this.dodge(dx || Math.cos(this.angle), dy || Math.sin(this.angle));
        }

        // Attack
        if (mouse.down && this.attackCooldown <= 0) {
            this.attack();
        }
    }

    collidesWithWall(x, y) {
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);

        for (let checkY = tileY - 1; checkY <= tileY + 1; checkY++) {
            for (let checkX = tileX - 1; checkX <= tileX + 1; checkX++) {
                if (checkX < 0 || checkX >= roomWidth || checkY < 0 || checkY >= roomHeight) {
                    return true;
                }
                if (tiles[checkY] && tiles[checkY][checkX] === 1) {
                    const wallLeft = checkX * TILE_SIZE;
                    const wallRight = (checkX + 1) * TILE_SIZE;
                    const wallTop = checkY * TILE_SIZE;
                    const wallBottom = (checkY + 1) * TILE_SIZE;

                    if (x + this.size > wallLeft && x - this.size < wallRight &&
                        y + this.size > wallTop && y - this.size < wallBottom) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    clampToRoom() {
        const margin = this.size + TILE_SIZE;
        this.x = Math.max(margin, Math.min(roomWidth * TILE_SIZE - margin, this.x));
        this.y = Math.max(margin, Math.min(roomHeight * TILE_SIZE - margin, this.y));
    }

    dodge(dx, dy) {
        if (dx === 0 && dy === 0) {
            dx = Math.cos(this.angle);
            dy = Math.sin(this.angle);
        }
        const len = Math.sqrt(dx * dx + dy * dy);
        this.dodgeAngle = Math.atan2(dy / len, dx / len);
        this.dodgeTimer = 0.3;
        this.dodgeCooldown = 1.5;
        this.stamina -= 20;

        // Dodge particles
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: this.x, y: this.y,
                vx: -dx * 2 + (Math.random() - 0.5),
                vy: -dy * 2 + (Math.random() - 0.5),
                life: 0.3, maxLife: 0.3,
                color: '#666688', size: 3
            });
        }
    }

    attack() {
        const weaponDef = this.weapon === 'fists' ?
            { damage: 5, speed: 0.5, melee: true } :
            ITEMS[this.weapon];

        if (!weaponDef) return;

        this.attackCooldown = weaponDef.speed;

        if (weaponDef.ranged) {
            // Ranged attack
            if (this.ammo <= 0) return;
            this.ammo--;
            this.muzzleFlash = 0.1;
            screenShake = 3;

            bullets.push({
                x: this.x + Math.cos(this.angle) * this.size,
                y: this.y + Math.sin(this.angle) * this.size,
                vx: Math.cos(this.angle) * 500,
                vy: Math.sin(this.angle) * 500,
                damage: weaponDef.damage,
                friendly: true,
                life: 2
            });

            // Muzzle flash particles
            for (let i = 0; i < 3; i++) {
                particles.push({
                    x: this.x + Math.cos(this.angle) * (this.size + 5),
                    y: this.y + Math.sin(this.angle) * (this.size + 5),
                    vx: Math.cos(this.angle + (Math.random() - 0.5) * 0.5) * 3,
                    vy: Math.sin(this.angle + (Math.random() - 0.5) * 0.5) * 3,
                    life: 0.1, maxLife: 0.1,
                    color: COLORS.muzzleFlash, size: 4
                });
            }
        } else {
            // Melee attack
            this.stamina -= 10;
            screenShake = 2;

            // Melee swing visual
            for (let i = 0; i < 5; i++) {
                const swingAngle = this.angle - 0.3 + i * 0.15;
                particles.push({
                    x: this.x + Math.cos(swingAngle) * (this.size + 10),
                    y: this.y + Math.sin(swingAngle) * (this.size + 10),
                    vx: Math.cos(swingAngle) * 2,
                    vy: Math.sin(swingAngle) * 2,
                    life: 0.15, maxLife: 0.15,
                    color: '#aaaaaa', size: 2
                });
            }

            // Check melee hits
            for (const enemy of enemies) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const enemyAngle = Math.atan2(dy, dx);
                let angleDiff = Math.abs(enemyAngle - this.angle);
                if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

                if (dist < TILE_SIZE * 1.5 && angleDiff < Math.PI / 3) {
                    damageEnemy(enemy, weaponDef.damage);
                    if (weaponDef.knockback) {
                        enemy.x += dx / dist * 20;
                        enemy.y += dy / dist * 20;
                    }
                }
            }
        }
    }

    takeDamage(amount, infectionAmount = 0) {
        if (this.invincible > 0 || this.dodgeTimer > 0) return;

        this.health -= amount;
        this.infection = Math.min(100, this.infection + infectionAmount);
        this.invincible = 0.5;
        screenShake = 8;

        // Blood particles
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                x: this.x, y: this.y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 0.5, maxLife: 0.5,
                color: COLORS.blood, size: 4
            });
        }

        if (this.health <= 0) {
            gameState = 'gameover';
        }
    }

    useItem(item) {
        const def = ITEMS[item];
        if (!def || def.type !== 'consumable') return false;

        if (def.effect.health) {
            this.health = Math.min(this.maxHealth, this.health + def.effect.health);
        }
        if (def.effect.hunger) {
            this.hunger = Math.max(0, this.hunger + def.effect.hunger);
        }
        if (def.effect.infection) {
            this.infection = Math.max(0, this.infection + def.effect.infection);
        }

        floatingTexts.push({
            x: this.x, y: this.y - 20,
            text: def.name + ' used!',
            color: '#88ff88',
            life: 1
        });

        return true;
    }

    addItem(item) {
        // Check if stackable and already have
        const def = ITEMS[item];
        if (!def) return false;

        for (const slot of this.inventory) {
            if (slot.item === item && slot.count < def.stack) {
                slot.count++;
                return true;
            }
        }

        // New slot
        if (this.inventory.length < this.maxInventory) {
            this.inventory.push({ item: item, count: 1 });
            return true;
        }

        return false;
    }

    hasItem(item) {
        return this.inventory.some(slot => slot.item === item);
    }

    removeItem(item) {
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i].item === item) {
                this.inventory[i].count--;
                if (this.inventory[i].count <= 0) {
                    this.inventory.splice(i, 1);
                }
                return true;
            }
        }
        return false;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);

        // Flicker when invincible
        if (this.invincible > 0 && Math.floor(this.invincible * 20) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Body
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = COLORS.playerLight;
        ctx.beginPath();
        ctx.arc(-3, -3, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Weapon/arm pointing at angle
        ctx.rotate(this.angle);
        ctx.fillStyle = COLORS.playerLight;
        ctx.fillRect(this.size * 0.5, -2, this.size, 4);

        // Muzzle flash
        if (this.muzzleFlash > 0) {
            ctx.fillStyle = COLORS.muzzleFlash;
            ctx.beginPath();
            ctx.arc(this.size * 1.5, 0, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
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
        this.damage = def.damage;
        this.speed = def.speed;
        this.attackRate = def.attackRate;
        this.infection = def.infection;
        this.size = def.size;
        this.ranged = def.ranged || false;
        this.spawner = def.spawner || false;

        this.attackCooldown = 0;
        this.state = 'idle';
        this.stateTimer = 0;
        this.targetX = x;
        this.targetY = y;
        this.spawnedCount = 0;
    }

    update(dt) {
        this.attackCooldown -= dt;
        this.stateTimer -= dt;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Detection
        const detectionRange = this.type === 'spitter' ? 320 : this.type === 'shambler' ? 256 : 192;

        if (dist < detectionRange) {
            this.state = 'chase';
        }

        if (this.spawner) {
            // Cocoon behavior - spawn enemies
            if (this.attackCooldown <= 0 && this.spawnedCount < 3) {
                this.attackCooldown = this.attackRate;
                this.spawnedCount++;
                enemies.push(new Enemy('shambler', this.x + (Math.random() - 0.5) * 50, this.y + (Math.random() - 0.5) * 50));
            }

            // Infection aura
            if (dist < 160) {
                player.infection = Math.min(100, player.infection + this.infection * dt / 60);
            }
            return;
        }

        if (this.state === 'chase') {
            if (this.ranged) {
                // Spitter - keep distance
                const preferredDist = 128;
                if (dist < preferredDist) {
                    // Retreat
                    this.x -= (dx / dist) * this.speed * dt;
                    this.y -= (dy / dist) * this.speed * dt;
                } else if (dist > preferredDist + 64) {
                    // Approach
                    this.x += (dx / dist) * this.speed * dt;
                    this.y += (dy / dist) * this.speed * dt;
                }

                // Ranged attack
                if (this.attackCooldown <= 0 && dist < 300) {
                    this.attackCooldown = this.attackRate;
                    const angle = Math.atan2(dy, dx);
                    bullets.push({
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(angle) * 200,
                        vy: Math.sin(angle) * 200,
                        damage: this.damage,
                        friendly: false,
                        acid: true,
                        life: 3,
                        size: 6
                    });
                }
            } else {
                // Melee - chase player
                if (dist > this.size + player.size) {
                    this.x += (dx / dist) * this.speed * dt;
                    this.y += (dy / dist) * this.speed * dt;
                }

                // Melee attack
                if (dist < this.size + player.size + 10 && this.attackCooldown <= 0) {
                    this.attackCooldown = this.attackRate;
                    player.takeDamage(this.damage, this.infection);
                }
            }
        } else if (this.state === 'idle') {
            // Wander
            if (this.stateTimer <= 0) {
                this.stateTimer = 2 + Math.random() * 3;
                this.targetX = this.x + (Math.random() - 0.5) * 100;
                this.targetY = this.y + (Math.random() - 0.5) * 100;
            }

            const tdx = this.targetX - this.x;
            const tdy = this.targetY - this.y;
            const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
            if (tdist > 5) {
                this.x += (tdx / tdist) * this.speed * 0.3 * dt;
                this.y += (tdy / tdist) * this.speed * 0.3 * dt;
            }
        }

        // Clamp to room
        const margin = this.size + TILE_SIZE;
        this.x = Math.max(margin, Math.min(roomWidth * TILE_SIZE - margin, this.x));
        this.y = Math.max(margin, Math.min(roomHeight * TILE_SIZE - margin, this.y));
    }

    draw() {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);

        switch (this.type) {
            case 'shambler':
                this.drawShambler();
                break;
            case 'crawler':
                this.drawCrawler();
                break;
            case 'spitter':
                this.drawSpitter();
                break;
            case 'brute':
                this.drawBrute();
                break;
            case 'cocoon':
                this.drawCocoon();
                break;
        }

        ctx.restore();

        // Health bar
        if (this.hp < this.maxHp) {
            const barWidth = this.size * 2;
            const barHeight = 4;
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX - barWidth / 2, screenY - this.size - 10, barWidth, barHeight);
            ctx.fillStyle = COLORS.healthBar;
            ctx.fillRect(screenX - barWidth / 2, screenY - this.size - 10, barWidth * (this.hp / this.maxHp), barHeight);
        }
    }

    drawShambler() {
        // Body - humanoid but mutated
        ctx.fillStyle = COLORS.shambler;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mutations
        ctx.fillStyle = '#9a6a5a';
        ctx.beginPath();
        ctx.arc(-5, -4, 5, 0, Math.PI * 2);
        ctx.arc(4, 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffaa44';
        ctx.beginPath();
        ctx.arc(-3, -6, 2, 0, Math.PI * 2);
        ctx.arc(3, -6, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCrawler() {
        // Low, fast creature
        ctx.fillStyle = COLORS.crawler;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 1.3, this.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.strokeStyle = '#4a3a2a';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI / 2 + frameCount * 0.1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * this.size * 1.5, Math.sin(angle) * this.size * 0.8);
            ctx.stroke();
        }

        // Eyes
        ctx.fillStyle = '#ff6644';
        ctx.beginPath();
        ctx.arc(-3, -2, 2, 0, Math.PI * 2);
        ctx.arc(3, -2, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSpitter() {
        // Bloated creature
        ctx.fillStyle = COLORS.spitter;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Acid sacs
        ctx.fillStyle = '#8aba6a';
        ctx.beginPath();
        ctx.arc(-4, 3, 4, 0, Math.PI * 2);
        ctx.arc(4, 3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.fillStyle = '#3a3a2a';
        ctx.beginPath();
        ctx.arc(0, -4, 5, 0, Math.PI);
        ctx.fill();
    }

    drawBrute() {
        // Large, muscular
        ctx.fillStyle = COLORS.brute;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Armor plates
        ctx.fillStyle = '#6a5040';
        ctx.beginPath();
        ctx.arc(0, -5, this.size * 0.6, Math.PI, 0);
        ctx.fill();

        // Fists
        ctx.fillStyle = '#9a7a6a';
        ctx.beginPath();
        ctx.arc(-this.size * 0.8, 5, 6, 0, Math.PI * 2);
        ctx.arc(this.size * 0.8, 5, 6, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(-5, -8, 3, 0, Math.PI * 2);
        ctx.arc(5, -8, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCocoon() {
        // Pulsing organic mass
        const pulse = 1 + Math.sin(frameCount * 0.05) * 0.1;

        ctx.fillStyle = COLORS.cocoon;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * pulse, this.size * 1.3 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tendrils
        ctx.strokeStyle = '#4a7a4a';
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
            const angle = i * Math.PI * 2 / 5 + Math.sin(frameCount * 0.03 + i) * 0.2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(
                Math.cos(angle) * this.size,
                Math.sin(angle) * this.size,
                Math.cos(angle) * this.size * 1.5,
                Math.sin(angle) * this.size * 1.5
            );
            ctx.stroke();
        }

        // Infection glow
        ctx.fillStyle = 'rgba(80, 200, 80, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, 80, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Utility functions
function damageEnemy(enemy, damage) {
    enemy.hp -= damage;

    // Floating damage text
    floatingTexts.push({
        x: enemy.x, y: enemy.y - enemy.size,
        text: damage.toString(),
        color: '#ffff44',
        life: 0.5
    });

    // Hit particles
    for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        particles.push({
            x: enemy.x, y: enemy.y,
            vx: Math.cos(angle) * 2,
            vy: Math.sin(angle) * 2,
            life: 0.3, maxLife: 0.3,
            color: COLORS.blood, size: 3
        });
    }

    if (enemy.hp <= 0) {
        // Death effects
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                x: enemy.x, y: enemy.y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 0.5, maxLife: 0.5,
                color: COLORS.blood, size: 4
            });
        }

        // Blood pool
        bloodPools.push({
            x: enemy.x,
            y: enemy.y,
            size: enemy.size * 2,
            alpha: 0.8
        });

        // Loot drop
        if (Math.random() < 0.3) {
            const lootTypes = ['food', 'scrap', 'chemicals'];
            const loot = lootTypes[Math.floor(Math.random() * lootTypes.length)];
            pickups.push({
                x: enemy.x,
                y: enemy.y,
                type: loot
            });
        }
    }
}

function generateRoom(sectorName) {
    const sector = SECTORS[sectorName];
    roomWidth = sector.width;
    roomHeight = sector.height;
    tiles = [];
    enemies = [];
    pickups = [];
    containers = [];
    doors = [];
    facilities = [];
    bloodPools = [];

    // Generate tiles
    for (let y = 0; y < roomHeight; y++) {
        tiles[y] = [];
        for (let x = 0; x < roomWidth; x++) {
            // Walls around edges
            if (x === 0 || y === 0 || x === roomWidth - 1 || y === roomHeight - 1) {
                tiles[y][x] = 1;
            } else {
                tiles[y][x] = 0;
            }
        }
    }

    // Add internal walls/obstacles
    const numObstacles = Math.floor(roomWidth * roomHeight / 50);
    for (let i = 0; i < numObstacles; i++) {
        const ox = 2 + Math.floor(Math.random() * (roomWidth - 4));
        const oy = 2 + Math.floor(Math.random() * (roomHeight - 4));
        const isHorizontal = Math.random() < 0.5;
        const length = 2 + Math.floor(Math.random() * 3);

        for (let j = 0; j < length; j++) {
            const wx = isHorizontal ? ox + j : ox;
            const wy = isHorizontal ? oy : oy + j;
            if (wx > 1 && wx < roomWidth - 2 && wy > 1 && wy < roomHeight - 2) {
                tiles[wy][wx] = 1;
            }
        }
    }

    // Add doors
    if (sectorName === 'hub') {
        doors.push({ x: roomWidth / 2 * TILE_SIZE, y: TILE_SIZE, target: 'storage', dir: 'up' });
        doors.push({ x: (roomWidth - 1) * TILE_SIZE, y: roomHeight / 2 * TILE_SIZE, target: 'medical', dir: 'right' });
        doors.push({ x: TILE_SIZE, y: roomHeight / 2 * TILE_SIZE, target: 'research', dir: 'left' });
        doors.push({ x: roomWidth / 2 * TILE_SIZE, y: (roomHeight - 1) * TILE_SIZE, target: 'escape', dir: 'down', locked: true });
    } else {
        doors.push({ x: roomWidth / 2 * TILE_SIZE, y: (roomHeight - 1) * TILE_SIZE, target: 'hub', dir: 'down' });
    }

    // Clear door areas
    for (const door of doors) {
        const tileX = Math.floor(door.x / TILE_SIZE);
        const tileY = Math.floor(door.y / TILE_SIZE);
        tiles[tileY][tileX] = 0;
        if (tileY > 0) tiles[tileY - 1][tileX] = 0;
        if (tileY < roomHeight - 1) tiles[tileY + 1][tileX] = 0;
    }

    // Add facilities
    if (sectorName === 'hub') {
        facilities.push({ x: 4 * TILE_SIZE, y: 4 * TILE_SIZE, type: 'workbench' });
        facilities.push({ x: 8 * TILE_SIZE, y: 4 * TILE_SIZE, type: 'storage' });
        facilities.push({ x: 12 * TILE_SIZE, y: 4 * TILE_SIZE, type: 'bed' });
        facilities.push({ x: 8 * TILE_SIZE, y: 10 * TILE_SIZE, type: 'power' });
    }

    if (sectorName === 'medical') {
        facilities.push({ x: 10 * TILE_SIZE, y: 10 * TILE_SIZE, type: 'medical' });
    }

    if (sectorName === 'research') {
        facilities.push({ x: 12 * TILE_SIZE, y: 12 * TILE_SIZE, type: 'research' });
    }

    // Add enemies
    if (sector.enemies && !sector.safe) {
        const powered = sectorData[sectorName]?.powered || false;
        const spawnMult = powered ? 0.5 : 1.5;

        for (const enemyType of sector.enemies) {
            if (Math.random() < spawnMult) {
                const ex = (2 + Math.random() * (roomWidth - 4)) * TILE_SIZE;
                const ey = (2 + Math.random() * (roomHeight - 4)) * TILE_SIZE;
                enemies.push(new Enemy(enemyType, ex, ey));
            }
        }
    }

    // Add containers
    const numContainers = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numContainers; i++) {
        const cx = (2 + Math.random() * (roomWidth - 4)) * TILE_SIZE;
        const cy = (2 + Math.random() * (roomHeight - 4)) * TILE_SIZE;
        const loot = sector.loot ? sector.loot[Math.floor(Math.random() * sector.loot.length)] : 'scrap';
        containers.push({ x: cx, y: cy, loot: loot, searched: false });
    }

    // Special items
    if (sector.hasKeycard) {
        containers.push({ x: (roomWidth - 3) * TILE_SIZE, y: (roomHeight - 3) * TILE_SIZE, loot: 'redKeycard', searched: false });
    }

    // Position player
    if (sectorName !== 'hub' || !player) {
        if (player) {
            player.x = roomWidth / 2 * TILE_SIZE;
            player.y = (roomHeight - 3) * TILE_SIZE;
        }
    }
}

function updateCamera() {
    const targetX = player.x - VIEWPORT_WIDTH / 2;
    const targetY = player.y - VIEWPORT_HEIGHT / 2;

    camera.x += (targetX - camera.x) * 0.1;
    camera.y += (targetY - camera.y) * 0.1;

    // Clamp
    camera.x = Math.max(0, Math.min(roomWidth * TILE_SIZE - VIEWPORT_WIDTH, camera.x));
    camera.y = Math.max(0, Math.min(roomHeight * TILE_SIZE - VIEWPORT_HEIGHT, camera.y));
}

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;

        if (b.friendly) {
            // Check hits on enemies
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                const dist = Math.sqrt((e.x - b.x) ** 2 + (e.y - b.y) ** 2);
                if (dist < e.size + 4) {
                    damageEnemy(e, b.damage);
                    if (e.hp <= 0) {
                        enemies.splice(j, 1);
                    }
                    bullets.splice(i, 1);
                    break;
                }
            }
        } else {
            // Check hit on player
            const dist = Math.sqrt((player.x - b.x) ** 2 + (player.y - b.y) ** 2);
            if (dist < player.size + (b.size || 4)) {
                player.takeDamage(b.damage, b.acid ? 10 : 0);

                // Acid puddle
                if (b.acid) {
                    bloodPools.push({
                        x: b.x, y: b.y,
                        size: 20,
                        alpha: 0.6,
                        acid: true,
                        life: 3
                    });
                }

                bullets.splice(i, 1);
                continue;
            }
        }

        // Wall collision
        const tileX = Math.floor(b.x / TILE_SIZE);
        const tileY = Math.floor(b.y / TILE_SIZE);
        if (tiles[tileY] && tiles[tileY][tileX] === 1) {
            bullets.splice(i, 1);
            continue;
        }

        // Out of bounds or expired
        if (b.life <= 0 || b.x < 0 || b.x > roomWidth * TILE_SIZE || b.y < 0 || b.y > roomHeight * TILE_SIZE) {
            bullets.splice(i, 1);
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt;
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
        t.y -= 30 * dt;
        t.life -= dt;

        if (t.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function updateBloodPools(dt) {
    for (let i = bloodPools.length - 1; i >= 0; i--) {
        const p = bloodPools[i];
        if (p.life !== undefined) {
            p.life -= dt;

            // Acid damage
            if (p.acid) {
                const dist = Math.sqrt((player.x - p.x) ** 2 + (player.y - p.y) ** 2);
                if (dist < p.size) {
                    player.infection = Math.min(100, player.infection + 2 * dt);
                }
            }

            if (p.life <= 0) {
                bloodPools.splice(i, 1);
            }
        }
    }
}

function updateSurvival(dt) {
    // Hunger increases over time (0.1 per game minute, 1 real second = 1 game minute)
    player.hunger = Math.min(100, player.hunger + 0.1 * dt);

    // Health drain at high hunger
    if (player.hunger >= 100) {
        player.health -= 5 * dt;
    } else if (player.hunger >= 75) {
        player.health -= 1 * dt;
    }

    // Health drain at high infection
    if (player.infection >= 75) {
        player.health -= 2 * dt;
    }

    // Global infection rises
    globalInfection = Math.min(100, globalInfection + 0.1 * dt);

    // Game over at 100% global infection
    if (globalInfection >= 100) {
        gameState = 'gameover';
    }

    // Infection death
    if (player.infection >= 100) {
        gameState = 'gameover';
    }

    // Game time
    gameTime += dt;
}

function checkInteractions() {
    // Check door interactions
    for (const door of doors) {
        const dist = Math.sqrt((player.x - door.x) ** 2 + (player.y - door.y) ** 2);
        if (dist < TILE_SIZE * 2 && keys['KeyE']) {
            if (door.locked && !player.hasKeycard) {
                floatingTexts.push({
                    x: player.x, y: player.y - 20,
                    text: 'Need Red Keycard!',
                    color: '#ff4444',
                    life: 1
                });
            } else {
                // Transition to sector
                currentSector = door.target;
                generateRoom(door.target);
            }
            keys['KeyE'] = false;
        }
    }

    // Check container interactions
    for (const container of containers) {
        if (container.searched) continue;
        const dist = Math.sqrt((player.x - container.x) ** 2 + (player.y - container.y) ** 2);
        if (dist < TILE_SIZE * 2 && keys['KeyE']) {
            container.searched = true;

            if (container.loot === 'redKeycard') {
                player.hasKeycard = true;
                floatingTexts.push({
                    x: player.x, y: player.y - 20,
                    text: 'Found Red Keycard!',
                    color: '#ff4444',
                    life: 2
                });
            } else {
                player.addItem(container.loot);
                const def = ITEMS[container.loot];
                floatingTexts.push({
                    x: player.x, y: player.y - 20,
                    text: '+ ' + (def ? def.name : container.loot),
                    color: '#44ff44',
                    life: 1
                });
            }
            keys['KeyE'] = false;
        }
    }

    // Check pickup interactions
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dist = Math.sqrt((player.x - p.x) ** 2 + (player.y - p.y) ** 2);
        if (dist < TILE_SIZE) {
            if (player.addItem(p.type)) {
                const def = ITEMS[p.type];
                floatingTexts.push({
                    x: player.x, y: player.y - 20,
                    text: '+ ' + (def ? def.name : p.type),
                    color: '#44ff44',
                    life: 1
                });
                pickups.splice(i, 1);
            }
        }
    }

    // Check facility interactions
    for (const facility of facilities) {
        const dist = Math.sqrt((player.x - facility.x) ** 2 + (player.y - facility.y) ** 2);
        if (dist < TILE_SIZE * 2 && keys['KeyE']) {
            handleFacility(facility);
            keys['KeyE'] = false;
        }
    }

    // Check escape pod (win condition)
    const sector = SECTORS[currentSector];
    if (sector.hasEscapePod && player.hasKeycard) {
        const escapeX = roomWidth / 2 * TILE_SIZE;
        const escapeY = roomHeight / 2 * TILE_SIZE;
        const dist = Math.sqrt((player.x - escapeX) ** 2 + (player.y - escapeY) ** 2);
        if (dist < TILE_SIZE * 2 && keys['KeyE']) {
            gameState = 'victory';
            keys['KeyE'] = false;
        }
    }
}

function handleFacility(facility) {
    switch (facility.type) {
        case 'workbench':
            floatingTexts.push({
                x: player.x, y: player.y - 20,
                text: 'Workbench - Press 1-3 to craft',
                color: '#88aaff',
                life: 2
            });
            break;
        case 'bed':
            // Rest to heal a bit
            player.health = Math.min(player.maxHealth, player.health + 10);
            player.hunger = Math.min(100, player.hunger + 10);
            gameTime += 60; // 1 hour passes
            globalInfection = Math.min(100, globalInfection + 6);
            floatingTexts.push({
                x: player.x, y: player.y - 20,
                text: 'Rested. +10 HP',
                color: '#88ff88',
                life: 1.5
            });
            break;
        case 'medical':
            if (sectorData['medical']?.powered) {
                player.health = Math.min(player.maxHealth, player.health + 30);
                player.infection = Math.max(0, player.infection - 20);
                floatingTexts.push({
                    x: player.x, y: player.y - 20,
                    text: 'Medical Treatment: +30 HP, -20 Infection',
                    color: '#88ff88',
                    life: 2
                });
            } else {
                floatingTexts.push({
                    x: player.x, y: player.y - 20,
                    text: 'Medical Bay needs power!',
                    color: '#ff8888',
                    life: 1.5
                });
            }
            break;
        case 'storage':
            floatingTexts.push({
                x: player.x, y: player.y - 20,
                text: 'Storage Locker',
                color: '#88aaff',
                life: 1
            });
            break;
        case 'power':
            floatingTexts.push({
                x: player.x, y: player.y - 20,
                text: 'Power Panel - Press F to toggle',
                color: '#ffaa44',
                life: 2
            });
            break;
        case 'research':
            if (sectorData['research']?.powered && !player.hasDataChip) {
                player.hasDataChip = true;
                floatingTexts.push({
                    x: player.x, y: player.y - 20,
                    text: 'Data Chip acquired! Tier 2 unlocked',
                    color: '#88ffff',
                    life: 2
                });
            }
            break;
    }
}

// Drawing functions
function drawRoom() {
    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get powered status
    const powered = currentSector === 'hub' || sectorData[currentSector]?.powered;

    // Tiles
    for (let y = 0; y < roomHeight; y++) {
        for (let x = 0; x < roomWidth; x++) {
            const screenX = x * TILE_SIZE - camera.x;
            const screenY = y * TILE_SIZE - camera.y;

            // Skip if off screen
            if (screenX < -TILE_SIZE || screenX > VIEWPORT_WIDTH ||
                screenY < -TILE_SIZE || screenY > VIEWPORT_HEIGHT) continue;

            if (tiles[y][x] === 1) {
                // Wall
                ctx.fillStyle = COLORS.wall;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                // Wall detail
                ctx.fillStyle = COLORS.wallDark;
                ctx.fillRect(screenX, screenY, TILE_SIZE, 2);
                ctx.fillRect(screenX, screenY, 2, TILE_SIZE);

                ctx.fillStyle = COLORS.wallHighlight;
                ctx.fillRect(screenX + TILE_SIZE - 2, screenY, 2, TILE_SIZE);
                ctx.fillRect(screenX, screenY + TILE_SIZE - 2, TILE_SIZE, 2);
            } else {
                // Floor
                ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorDark;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                // Grid pattern
                ctx.strokeStyle = COLORS.floorGrid;
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX + 0.5, screenY + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
            }
        }
    }

    // Darkness overlay if not powered
    if (!powered) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawBloodPools() {
    for (const pool of bloodPools) {
        const screenX = pool.x - camera.x;
        const screenY = pool.y - camera.y;

        ctx.globalAlpha = pool.alpha * (pool.life !== undefined ? pool.life / 3 : 1);
        ctx.fillStyle = pool.acid ? COLORS.infection : COLORS.blood;
        ctx.beginPath();
        ctx.ellipse(screenX, screenY, pool.size, pool.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function drawContainers() {
    for (const container of containers) {
        const screenX = container.x - camera.x;
        const screenY = container.y - camera.y;

        ctx.fillStyle = container.searched ? '#333340' : COLORS.container;
        ctx.fillRect(screenX - 12, screenY - 12, 24, 24);

        // Highlight
        if (!container.searched) {
            ctx.strokeStyle = '#6a6a7a';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX - 12, screenY - 12, 24, 24);
        }
    }
}

function drawDoors() {
    for (const door of doors) {
        const screenX = door.x - camera.x;
        const screenY = door.y - camera.y;

        ctx.fillStyle = door.locked ? COLORS.doorLocked : COLORS.door;

        if (door.dir === 'up' || door.dir === 'down') {
            ctx.fillRect(screenX - TILE_SIZE, screenY - 8, TILE_SIZE * 2, 16);
        } else {
            ctx.fillRect(screenX - 8, screenY - TILE_SIZE, 16, TILE_SIZE * 2);
        }

        // Label
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(SECTORS[door.target].name, screenX, screenY - 15);
    }
}

function drawFacilities() {
    for (const facility of facilities) {
        const screenX = facility.x - camera.x;
        const screenY = facility.y - camera.y;

        switch (facility.type) {
            case 'workbench':
                ctx.fillStyle = '#6a5a4a';
                ctx.fillRect(screenX - 16, screenY - 8, 32, 16);
                ctx.fillStyle = '#8a7a6a';
                ctx.fillRect(screenX - 14, screenY - 6, 28, 12);
                break;
            case 'bed':
                ctx.fillStyle = '#4a4a6a';
                ctx.fillRect(screenX - 12, screenY - 20, 24, 40);
                ctx.fillStyle = '#6a6a8a';
                ctx.fillRect(screenX - 10, screenY - 18, 20, 10);
                break;
            case 'storage':
                ctx.fillStyle = '#5a5a6a';
                ctx.fillRect(screenX - 16, screenY - 24, 32, 48);
                ctx.strokeStyle = '#7a7a8a';
                ctx.lineWidth = 2;
                ctx.strokeRect(screenX - 16, screenY - 24, 32, 48);
                break;
            case 'power':
                ctx.fillStyle = '#4a5a4a';
                ctx.fillRect(screenX - 12, screenY - 16, 24, 32);
                ctx.fillStyle = '#ffaa44';
                ctx.fillRect(screenX - 8, screenY - 12, 16, 8);
                ctx.fillStyle = '#44ff44';
                ctx.fillRect(screenX - 8, screenY, 16, 8);
                break;
            case 'medical':
                ctx.fillStyle = '#5a6a6a';
                ctx.fillRect(screenX - 20, screenY - 12, 40, 24);
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(screenX - 4, screenY - 8, 8, 16);
                ctx.fillRect(screenX - 8, screenY - 4, 16, 8);
                break;
            case 'research':
                ctx.fillStyle = '#4a5a6a';
                ctx.fillRect(screenX - 16, screenY - 20, 32, 40);
                ctx.fillStyle = '#44aaff';
                ctx.fillRect(screenX - 12, screenY - 16, 24, 20);
                break;
        }

        // Interaction hint
        const dist = Math.sqrt((player.x - facility.x) ** 2 + (player.y - facility.y) ** 2);
        if (dist < TILE_SIZE * 2) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('[E] ' + facility.type, screenX, screenY - 30);
        }
    }
}

function drawPickups() {
    for (const pickup of pickups) {
        const screenX = pickup.x - camera.x;
        const screenY = pickup.y - camera.y;
        const bob = Math.sin(frameCount * 0.1) * 2;

        ctx.fillStyle = '#88ff88';
        ctx.beginPath();
        ctx.arc(screenX, screenY + bob, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        const def = ITEMS[pickup.type];
        ctx.fillText(def ? def.name.substring(0, 8) : pickup.type, screenX, screenY + bob - 10);
    }
}

function drawBullets() {
    for (const b of bullets) {
        const screenX = b.x - camera.x;
        const screenY = b.y - camera.y;

        if (b.acid) {
            ctx.fillStyle = COLORS.infection;
        } else {
            ctx.fillStyle = b.friendly ? COLORS.bullet : COLORS.infection;
        }

        ctx.beginPath();
        ctx.arc(screenX, screenY, b.size || 4, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.strokeStyle = b.friendly ? COLORS.laser : COLORS.infectionGlow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(screenX - b.vx * 0.02, screenY - b.vy * 0.02);
        ctx.stroke();
    }
}

function drawParticles() {
    for (const p of particles) {
        const screenX = p.x - camera.x;
        const screenY = p.y - camera.y;

        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawFloatingTexts() {
    for (const t of floatingTexts) {
        const screenX = t.x - camera.x;
        const screenY = t.y - camera.y;

        ctx.globalAlpha = Math.min(1, t.life * 2);
        ctx.fillStyle = t.color;
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, screenX, screenY);
    }
    ctx.globalAlpha = 1;
}

function drawUI() {
    // Background bar
    ctx.fillStyle = COLORS.uiBg;
    ctx.fillRect(0, 0, canvas.width, 50);

    // Health bar
    const barWidth = 150;
    const barHeight = 16;
    const barY = 10;

    ctx.fillStyle = '#333';
    ctx.fillRect(10, barY, barWidth, barHeight);
    ctx.fillStyle = COLORS.healthBar;
    ctx.fillRect(10, barY, barWidth * (player.health / player.maxHealth), barHeight);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(10, barY, barWidth, barHeight);
    ctx.fillStyle = COLORS.text;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HP: ' + Math.floor(player.health) + '/' + player.maxHealth, 15, barY + 12);

    // Hunger bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, barY + 20, barWidth, barHeight);
    ctx.fillStyle = COLORS.hungerBar;
    ctx.fillRect(10, barY + 20, barWidth * (player.hunger / 100), barHeight);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(10, barY + 20, barWidth, barHeight);
    ctx.fillText('Hunger: ' + Math.floor(player.hunger) + '%', 15, barY + 32);

    // Infection bar
    ctx.fillStyle = '#333';
    ctx.fillRect(170, barY, barWidth, barHeight);
    ctx.fillStyle = COLORS.infectionBar;
    ctx.fillRect(170, barY, barWidth * (player.infection / 100), barHeight);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(170, barY, barWidth, barHeight);
    ctx.fillText('Infection: ' + Math.floor(player.infection) + '%', 175, barY + 12);

    // Global infection
    ctx.fillStyle = '#333';
    ctx.fillRect(170, barY + 20, barWidth, barHeight);
    ctx.fillStyle = '#cc4444';
    ctx.fillRect(170, barY + 20, barWidth * (globalInfection / 100), barHeight);
    ctx.strokeStyle = COLORS.uiBorder;
    ctx.strokeRect(170, barY + 20, barWidth, barHeight);
    ctx.fillText('Global: ' + Math.floor(globalInfection) + '%', 175, barY + 32);

    // Weapon and ammo
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'right';
    ctx.fillText('Weapon: ' + (player.weapon === 'fists' ? 'Fists' : ITEMS[player.weapon]?.name || player.weapon), canvas.width - 10, barY + 12);
    ctx.fillText('Ammo: ' + player.ammo, canvas.width - 10, barY + 32);

    // Sector name
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.textHighlight;
    ctx.font = '14px monospace';
    ctx.fillText(SECTORS[currentSector].name, canvas.width / 2, barY + 12);

    // Time
    const hours = Math.floor(gameTime / 60);
    const mins = Math.floor(gameTime % 60);
    ctx.fillStyle = COLORS.text;
    ctx.font = '12px monospace';
    ctx.fillText(hours.toString().padStart(2, '0') + ':' + mins.toString().padStart(2, '0'), canvas.width / 2, barY + 28);

    // Keycard indicator
    if (player.hasKeycard) {
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(canvas.width - 60, barY + 35, 50, 10);
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.fillText('KEYCARD', canvas.width - 35, barY + 43);
    }

    // Inventory hint
    ctx.fillStyle = COLORS.text;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('[TAB] Inventory | [E] Interact | [Q] Debug', 10, canvas.height - 10);
}

function drawDebugOverlay() {
    if (!debugMode) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 60, 200, 180);

    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    const lines = [
        'DEBUG MODE (Q to toggle)',
        '------------------------',
        `FPS: ${fps.toFixed(1)}`,
        `Player: (${Math.floor(player.x)}, ${Math.floor(player.y)})`,
        `HP: ${Math.floor(player.health)}/${player.maxHealth}`,
        `Hunger: ${Math.floor(player.hunger)}%`,
        `Infection: ${Math.floor(player.infection)}%`,
        `Global: ${Math.floor(globalInfection)}%`,
        `Enemies: ${enemies.length}`,
        `Bullets: ${bullets.length}`,
        `Sector: ${currentSector}`,
        `Has Keycard: ${player.hasKeycard}`
    ];

    lines.forEach((line, i) => {
        ctx.fillText(line, 20, 75 + i * 14);
    });
}

function drawMenu() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#cc4444';
    ctx.font = '36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ISOLATION PROTOCOL', canvas.width / 2, 150);

    ctx.fillStyle = '#888888';
    ctx.font = '14px monospace';
    ctx.fillText('A 2D Survival Horror', canvas.width / 2, 180);

    // Instructions
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '14px monospace';
    const instructions = [
        'WASD - Move',
        'Mouse - Aim',
        'Left Click - Attack',
        'Right Click / Space - Dodge',
        'E - Interact',
        'TAB - Inventory',
        'Q - Debug overlay',
        '',
        'Find the Red Keycard in Research Lab',
        'Power the Escape Pod sector',
        'Escape before infection reaches 100%',
        '',
        'Press SPACE to start'
    ];

    instructions.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, 240 + i * 22);
    });
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#cc4444';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '18px monospace';
    if (player.health <= 0) {
        ctx.fillText('You died. The facility claims another victim.', canvas.width / 2, canvas.height / 2 + 10);
    } else if (player.infection >= 100) {
        ctx.fillText('The infection has consumed you.', canvas.width / 2, canvas.height / 2 + 10);
    } else if (globalInfection >= 100) {
        ctx.fillText('The facility is lost. No one escapes.', canvas.width / 2, canvas.height / 2 + 10);
    }

    ctx.font = '14px monospace';
    ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 60);
}

function drawVictory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#44cc44';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '18px monospace';
    ctx.fillText('You made it to the escape pod!', canvas.width / 2, canvas.height / 2 + 10);

    const hours = Math.floor(gameTime / 60);
    const mins = Math.floor(gameTime % 60);
    ctx.fillText(`Time: ${hours}:${mins.toString().padStart(2, '0')} | Global Infection: ${Math.floor(globalInfection)}%`, canvas.width / 2, canvas.height / 2 + 40);

    ctx.font = '14px monospace';
    ctx.fillText('Press SPACE to play again', canvas.width / 2, canvas.height / 2 + 80);
}

// Main game loop
function gameLoop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    frameCount++;

    fps = 1 / dt;

    // Screen shake
    if (screenShake > 0) {
        ctx.save();
        ctx.translate(
            (Math.random() - 0.5) * screenShake,
            (Math.random() - 0.5) * screenShake
        );
        screenShake -= dt * 30;
        if (screenShake < 0) screenShake = 0;
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
            updateBloodPools(dt);
            updateCamera();
            updateSurvival(dt);
            checkInteractions();

            // Remove dead enemies
            enemies = enemies.filter(e => e.hp > 0);

            // Draw
            drawRoom();
            drawBloodPools();
            drawContainers();
            drawDoors();
            drawFacilities();
            drawPickups();
            drawBullets();
            enemies.forEach(e => e.draw());
            player.draw();
            drawParticles();
            drawFloatingTexts();
            drawUI();
            drawDebugOverlay();
            break;

        case 'gameover':
            drawRoom();
            drawBloodPools();
            enemies.forEach(e => e.draw());
            player.draw();
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

    // Quick use items
    if (gameState === 'playing') {
        if (e.code === 'Digit1' && player.hasItem('food')) {
            if (player.useItem('food')) player.removeItem('food');
        }
        if (e.code === 'Digit2' && player.hasItem('medkit')) {
            if (player.useItem('medkit')) player.removeItem('medkit');
        }
        if (e.code === 'Digit3' && player.hasItem('antidote')) {
            if (player.useItem('antidote')) player.removeItem('antidote');
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
    if (e.button === 0) mouse.down = true;
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
    currentSector = 'hub';
    sectorData = {};
    globalInfection = 0;
    gameTime = 0;
    enemies = [];
    bullets = [];
    particles = [];
    bloodPools = [];
    floatingTexts = [];
    pickups = [];

    // Starting items
    player.addItem('food');
    player.addItem('food');
    player.addItem('water');
    player.addItem('shiv');
    player.weapon = 'shiv';

    generateRoom('hub');
    player.x = roomWidth / 2 * TILE_SIZE;
    player.y = roomHeight / 2 * TILE_SIZE;
}

// Initialize
requestAnimationFrame(gameLoop);
