// Isolation Protocol - Survival Horror (Subterrain Clone)
// LittleJS Implementation

'use strict';

// Configuration
const TILE_SIZE = 32;
const GAME_MINUTE_REAL_SECOND = 1; // 1 real second = 1 game minute

// Game state
let gameState = 'menu'; // menu, playing, paused, victory, death
let player;
let enemies = [];
let items = [];
let containers = [];
let projectiles = [];
let particles = [];

// Survival meters (0-100, higher = worse except health)
let meters = {
    health: 100,      // Lower = worse, 0 = death
    hunger: 0,        // Higher = worse
    thirst: 0,        // Higher = worse
    fatigue: 0,       // Higher = worse
    infection: 0      // Higher = worse, 100 = death
};

// Global infection (urgency mechanic)
let globalInfection = 0;
let gameTime = 0; // In game minutes
let realTime = 0;

// Power system
const POWER_CAPACITY = 500;
let currentPower = 0;
let poweredSectors = { hub: true };

// Sector definitions
const SECTORS = {
    hub: { name: 'Central Hub', powerCost: 0, width: 15, height: 15, enemies: [] },
    storage: { name: 'Storage Wing', powerCost: 100, width: 20, height: 20, enemies: ['shambler', 'shambler', 'shambler', 'crawler'] },
    medical: { name: 'Medical Bay', powerCost: 150, width: 20, height: 20, enemies: ['shambler', 'shambler', 'spitter', 'spitter'] },
    research: { name: 'Research Lab', powerCost: 200, width: 25, height: 25, enemies: ['crawler', 'crawler', 'spitter', 'brute'] },
    escape: { name: 'Escape Pod', powerCost: 300, width: 15, height: 15, enemies: ['shambler', 'shambler', 'brute', 'brute'] }
};

// Current sector
let currentSector = 'hub';
let sectorStates = {}; // Persist room states

// Inventory
let inventory = [];
const MAX_INVENTORY = 20;
const STACK_LIMIT = 5;

// Items definitions
const ITEM_DEFS = {
    canned_food: { name: 'Canned Food', stackable: true, effect: { hunger: -30 } },
    water: { name: 'Water Bottle', stackable: true, effect: { thirst: -40 } },
    mre: { name: 'MRE Pack', stackable: true, effect: { hunger: -50, thirst: -20 } },
    coffee: { name: 'Coffee', stackable: true, effect: { fatigue: -20 } },
    medkit: { name: 'Medkit', stackable: true, effect: { health: 30 } },
    antidote: { name: 'Antidote', stackable: true, effect: { infection: -30 } },
    bandage: { name: 'Bandage', stackable: true },
    scrap: { name: 'Scrap Metal', stackable: true },
    cloth: { name: 'Cloth', stackable: true },
    chemicals: { name: 'Chemicals', stackable: true },
    electronics: { name: 'Electronics', stackable: true },
    power_cell: { name: 'Power Cell', stackable: true },
    keycard: { name: 'Red Keycard', stackable: false },
    data_chip: { name: 'Data Chip', stackable: false },
    shiv: { name: 'Shiv', stackable: false, weapon: { damage: 10, speed: 0.4 } },
    pipe: { name: 'Pipe Club', stackable: false, weapon: { damage: 20, speed: 1.0 } },
    pistol: { name: 'Pistol', stackable: false, weapon: { damage: 15, speed: 0.5, ranged: true, ammo: 12 } }
};

// Enemy definitions
const ENEMY_DEFS = {
    shambler: { name: 'Shambler', hp: 30, damage: 10, speed: 0.5, attackRate: 1.5, range: 8, infection: 5, color: new Color(0.5, 0.3, 0.2) },
    crawler: { name: 'Crawler', hp: 20, damage: 8, speed: 1.2, attackRate: 1.0, range: 6, infection: 5, color: new Color(0.3, 0.4, 0.2) },
    spitter: { name: 'Spitter', hp: 25, damage: 15, speed: 0.4, attackRate: 2.5, range: 10, infection: 10, ranged: true, color: new Color(0.2, 0.5, 0.3) },
    brute: { name: 'Brute', hp: 80, damage: 25, speed: 0.3, attackRate: 2.0, range: 6, infection: 8, color: new Color(0.6, 0.2, 0.2) },
    cocoon: { name: 'Cocoon', hp: 50, damage: 0, speed: 0, stationary: true, color: new Color(0.4, 0.5, 0.2) }
};

// Crafting recipes
const RECIPES = {
    tier1: {
        shiv: { materials: { scrap: 2 }, time: 10 },
        pipe: { materials: { scrap: 3 }, time: 15 },
        bandage: { materials: { cloth: 2 }, time: 5 }
    },
    tier2: {
        pistol: { materials: { scrap: 5, electronics: 2 }, time: 30 },
        antidote: { materials: { chemicals: 3 }, time: 15 }
    }
};

let unlockedTier2 = false;
let hasKeycard = false;

// Room tiles
let roomTiles = [];
let roomWalls = [];
let roomContainers = [];

// UI state
let showInventory = false;
let showCrafting = false;
let showMap = false;
let selectedSlot = 0;
let equippedWeapon = null;

// Player class
class Player extends EngineObject {
    constructor(pos) {
        super(pos, vec2(1, 1), undefined, 0, new Color(0.2, 0.4, 0.8));
        this.speed = 0.08;
        this.attackCooldown = 0;
        this.dodgeCooldown = 0;
        this.isDodging = false;
        this.dodgeTime = 0;
        this.iframes = 0;
        this.stamina = 100;
    }

    update() {
        if (gameState !== 'playing') return;

        // Dodge
        if (this.isDodging) {
            this.dodgeTime -= 1/60;
            if (this.dodgeTime <= 0) {
                this.isDodging = false;
            }
            return;
        }

        // I-frames
        if (this.iframes > 0) {
            this.iframes -= 1/60;
        }

        // Movement
        let moveDir = vec2(0, 0);
        if (keyIsDown('KeyW') || keyIsDown('ArrowUp')) moveDir.y = 1;
        if (keyIsDown('KeyS') || keyIsDown('ArrowDown')) moveDir.y = -1;
        if (keyIsDown('KeyA') || keyIsDown('ArrowLeft')) moveDir.x = -1;
        if (keyIsDown('KeyD') || keyIsDown('ArrowRight')) moveDir.x = 1;

        if (moveDir.length() > 0) {
            moveDir = moveDir.normalize();

            // Speed penalties from meters
            let speedMult = 1;
            if (meters.hunger >= 75) speedMult *= 0.75;
            else if (meters.hunger >= 50) speedMult *= 0.9;
            if (meters.fatigue >= 75) speedMult *= 0.75;

            const newPos = this.pos.add(moveDir.scale(this.speed * speedMult));

            // Collision check
            if (!checkWallCollision(newPos)) {
                this.pos = newPos;
            }
        }

        // Dodge
        if (keyWasPressed('Space') && this.dodgeCooldown <= 0 && moveDir.length() > 0) {
            this.isDodging = true;
            this.dodgeTime = 0.3;
            this.dodgeCooldown = 1.5;
            this.iframes = 0.3;
            this.pos = this.pos.add(moveDir.scale(2));
        }

        if (this.dodgeCooldown > 0) this.dodgeCooldown -= 1/60;
        if (this.attackCooldown > 0) this.attackCooldown -= 1/60;

        // Attack
        if (mouseWasPressed(0) && this.attackCooldown <= 0) {
            this.attack();
        }

        // Check exits
        checkExits();

        // Check container interaction
        if (keyWasPressed('KeyE')) {
            interactWithContainer();
        }
    }

    attack() {
        if (!equippedWeapon) {
            // Fist attack
            this.attackCooldown = 0.5;
            attackMelee(5, 1);
        } else {
            const weapon = ITEM_DEFS[equippedWeapon.type].weapon;
            this.attackCooldown = weapon.speed;

            if (weapon.ranged) {
                if (equippedWeapon.ammo > 0) {
                    equippedWeapon.ammo--;
                    attackRanged(weapon.damage);
                }
            } else {
                attackMelee(weapon.damage, 1.5);
            }
        }
    }

    render() {
        // Flash when hit
        let col = this.color;
        if (this.iframes > 0 && Math.floor(time * 10) % 2 === 0) {
            col = new Color(1, 0, 0);
        }
        drawRect(this.pos, this.size, col);

        // Direction indicator
        const mouseWorld = screenToWorld(mousePos);
        const dir = mouseWorld.subtract(this.pos).normalize();
        drawRect(this.pos.add(dir.scale(0.5)), vec2(0.3, 0.15), new Color(0.8, 0.8, 0.8));
    }

    takeDamage(damage, infectionAmount = 0) {
        if (this.iframes > 0 || this.isDodging) return;

        meters.health -= damage;
        meters.infection = Math.min(100, meters.infection + infectionAmount);
        this.iframes = 0.5;

        // Screen flash
        particles.push({
            type: 'screenFlash',
            color: new Color(1, 0, 0, 0.3),
            life: 0.2
        });

        if (meters.health <= 0) {
            gameState = 'death';
        }
    }
}

// Enemy class
class Enemy extends EngineObject {
    constructor(pos, type) {
        const def = ENEMY_DEFS[type];
        super(pos, vec2(type === 'brute' ? 1.5 : 1, type === 'brute' ? 1.5 : 1), undefined, 0, def.color);
        this.type = type;
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.damage = def.damage;
        this.speed = def.speed * 0.06;
        this.attackRate = def.attackRate;
        this.attackCooldown = 0;
        this.range = def.range;
        this.infection = def.infection;
        this.state = 'idle';
        this.stationary = def.stationary || false;
        this.ranged = def.ranged || false;
        this.stunTime = 0;
    }

    update() {
        if (gameState !== 'playing') return;
        if (!player) return;

        if (this.stunTime > 0) {
            this.stunTime -= 1/60;
            return;
        }

        const dist = this.pos.distance(player.pos);

        if (this.stationary) return;

        // Simple AI
        if (dist < this.range) {
            this.state = 'chase';
        }

        if (this.state === 'chase') {
            const dir = player.pos.subtract(this.pos).normalize();

            if (this.ranged) {
                // Keep distance for ranged
                if (dist > 4) {
                    const newPos = this.pos.add(dir.scale(this.speed));
                    if (!checkWallCollision(newPos)) {
                        this.pos = newPos;
                    }
                } else if (dist < 3) {
                    const newPos = this.pos.subtract(dir.scale(this.speed));
                    if (!checkWallCollision(newPos)) {
                        this.pos = newPos;
                    }
                }

                // Ranged attack
                if (this.attackCooldown <= 0) {
                    this.attackCooldown = this.attackRate;
                    spawnProjectile(this.pos, dir, this.damage, this.infection);
                }
            } else {
                // Melee chase
                if (dist > 1) {
                    const newPos = this.pos.add(dir.scale(this.speed));
                    if (!checkWallCollision(newPos)) {
                        this.pos = newPos;
                    }
                } else if (this.attackCooldown <= 0) {
                    // Attack
                    this.attackCooldown = this.attackRate;
                    player.takeDamage(this.damage, this.infection);
                }
            }
        }

        if (this.attackCooldown > 0) this.attackCooldown -= 1/60;
    }

    render() {
        drawRect(this.pos, this.size, this.color);

        // Health bar
        if (this.hp < this.maxHp) {
            const hpPercent = this.hp / this.maxHp;
            drawRect(this.pos.add(vec2(0, 0.8)), vec2(1, 0.15), new Color(0.3, 0.3, 0.3));
            drawRect(this.pos.add(vec2((hpPercent - 1) * 0.5, 0.8)), vec2(hpPercent, 0.15), new Color(1, 0, 0));
        }
    }

    takeDamage(damage) {
        this.hp -= damage;
        this.stunTime = 0.2;

        // Blood particle
        for (let i = 0; i < 3; i++) {
            particles.push({
                type: 'blood',
                pos: this.pos.copy(),
                vel: vec2(rand(-1, 1), rand(-1, 1)),
                life: 1,
                color: new Color(0.5, 0, 0)
            });
        }

        if (this.hp <= 0) {
            this.destroy();
            const idx = enemies.indexOf(this);
            if (idx > -1) enemies.splice(idx, 1);

            // Drop loot
            if (rand() < 0.3) {
                spawnItem(this.pos, 'scrap');
            }
        }
    }
}

// Projectile class
class Projectile extends EngineObject {
    constructor(pos, dir, damage, infection, isEnemy = true) {
        super(pos, vec2(0.3, 0.3), undefined, 0, isEnemy ? new Color(0, 1, 0) : new Color(1, 1, 0));
        this.vel = dir.scale(0.2);
        this.damage = damage;
        this.infection = infection;
        this.isEnemy = isEnemy;
        this.life = 2;
    }

    update() {
        this.pos = this.pos.add(this.vel);
        this.life -= 1/60;

        if (this.life <= 0 || checkWallCollision(this.pos)) {
            this.destroy();
            return;
        }

        if (this.isEnemy) {
            if (this.pos.distance(player.pos) < 0.7) {
                player.takeDamage(this.damage, this.infection);
                this.destroy();
            }
        } else {
            for (const enemy of enemies) {
                if (this.pos.distance(enemy.pos) < 0.7) {
                    enemy.takeDamage(this.damage);
                    this.destroy();
                    break;
                }
            }
        }
    }
}

// Item class
class Item extends EngineObject {
    constructor(pos, type) {
        const colors = {
            canned_food: new Color(0.8, 0.6, 0.2),
            water: new Color(0.2, 0.5, 0.9),
            medkit: new Color(1, 0.2, 0.2),
            scrap: new Color(0.5, 0.5, 0.5),
            keycard: new Color(1, 0, 0)
        };
        super(pos, vec2(0.5, 0.5), undefined, 0, colors[type] || new Color(0.7, 0.7, 0.3));
        this.type = type;
    }

    update() {
        if (!player) return;

        // Pickup
        if (this.pos.distance(player.pos) < 1) {
            if (addToInventory(this.type)) {
                this.destroy();
                const idx = items.indexOf(this);
                if (idx > -1) items.splice(idx, 1);
            }
        }
    }

    render() {
        // Pulsing glow
        const pulse = 0.8 + Math.sin(time * 4) * 0.2;
        drawRect(this.pos, this.size.scale(pulse), this.color);
    }
}

// Container class
class Container extends EngineObject {
    constructor(pos, lootTable) {
        super(pos, vec2(1, 1), undefined, 0, new Color(0.4, 0.3, 0.2));
        this.lootTable = lootTable;
        this.looted = false;
    }

    render() {
        const col = this.looted ? new Color(0.2, 0.2, 0.2) : this.color;
        drawRect(this.pos, this.size, col);

        if (!this.looted) {
            drawRect(this.pos.add(vec2(0, 0.3)), vec2(0.6, 0.2), new Color(0.6, 0.5, 0.3));
        }
    }
}

// Helper functions
function checkWallCollision(pos) {
    for (const wall of roomWalls) {
        if (pos.distance(wall) < 0.8) return true;
    }
    return false;
}

function attackMelee(damage, range) {
    const mouseWorld = screenToWorld(mousePos);
    const dir = mouseWorld.subtract(player.pos).normalize();

    for (const enemy of enemies) {
        const toEnemy = enemy.pos.subtract(player.pos);
        const dist = toEnemy.length();

        if (dist < range) {
            const dot = dir.dot(toEnemy.normalize());
            if (dot > 0.5) {
                enemy.takeDamage(damage);
            }
        }
    }

    // Swing effect
    particles.push({
        type: 'swing',
        pos: player.pos.add(dir.scale(0.7)),
        angle: Math.atan2(dir.y, dir.x),
        life: 0.1
    });
}

function attackRanged(damage) {
    const mouseWorld = screenToWorld(mousePos);
    const dir = mouseWorld.subtract(player.pos).normalize();
    new Projectile(player.pos.add(dir.scale(0.5)), dir, damage, 0, false);
}

function spawnProjectile(pos, dir, damage, infection) {
    new Projectile(pos.add(dir.scale(0.5)), dir, damage, infection, true);
}

function spawnItem(pos, type) {
    const item = new Item(pos.add(vec2(rand(-0.5, 0.5), rand(-0.5, 0.5))), type);
    items.push(item);
}

function addToInventory(type) {
    const def = ITEM_DEFS[type];

    // Check for existing stack
    if (def.stackable) {
        const existing = inventory.find(i => i.type === type && i.quantity < STACK_LIMIT);
        if (existing) {
            existing.quantity++;
            return true;
        }
    }

    // New slot
    if (inventory.length < MAX_INVENTORY) {
        const item = { type, quantity: 1 };
        if (def.weapon && def.weapon.ammo) {
            item.ammo = def.weapon.ammo;
        }
        inventory.push(item);
        return true;
    }

    return false;
}

function useItem(slot) {
    if (slot >= inventory.length) return;

    const item = inventory[slot];
    const def = ITEM_DEFS[item.type];

    if (def.weapon) {
        equippedWeapon = item;
        return;
    }

    if (def.effect) {
        for (const [stat, value] of Object.entries(def.effect)) {
            if (stat === 'health') {
                meters.health = Math.min(100, meters.health + value);
            } else {
                meters[stat] = Math.max(0, meters[stat] + value);
            }
        }

        item.quantity--;
        if (item.quantity <= 0) {
            inventory.splice(slot, 1);
        }
    }
}

function checkExits() {
    const sector = SECTORS[currentSector];
    const halfW = sector.width / 2;
    const halfH = sector.height / 2;

    // Check cardinal exits
    if (player.pos.y > halfH - 1) {
        // North exit
        if (currentSector === 'hub') changeSector('escape', 'south');
    }
    if (player.pos.y < -halfH + 1) {
        // South exit
        if (currentSector === 'hub') changeSector('storage', 'north');
        else if (currentSector === 'escape') changeSector('hub', 'north');
    }
    if (player.pos.x < -halfW + 1) {
        // West exit
        if (currentSector === 'hub') changeSector('research', 'east');
    }
    if (player.pos.x > halfW - 1) {
        // East exit
        if (currentSector === 'hub') changeSector('medical', 'west');
        else if (currentSector === 'research') changeSector('hub', 'west');
        else if (currentSector === 'medical') changeSector('hub', 'east');
        else if (currentSector === 'storage') changeSector('hub', 'south');
    }
}

function changeSector(newSector, spawnSide) {
    // Save current sector state
    saveSectorState();

    currentSector = newSector;
    generateRoom();

    // Spawn player based on exit direction
    const sector = SECTORS[newSector];
    const halfW = sector.width / 2 - 2;
    const halfH = sector.height / 2 - 2;

    switch (spawnSide) {
        case 'north': player.pos = vec2(0, halfH); break;
        case 'south': player.pos = vec2(0, -halfH); break;
        case 'east': player.pos = vec2(halfW, 0); break;
        case 'west': player.pos = vec2(-halfW, 0); break;
    }
}

function saveSectorState() {
    sectorStates[currentSector] = {
        enemies: enemies.map(e => ({ type: e.type, pos: e.pos.copy(), hp: e.hp })),
        items: items.map(i => ({ type: i.type, pos: i.pos.copy() })),
        containers: containers.map(c => ({ pos: c.pos.copy(), looted: c.looted, lootTable: c.lootTable }))
    };
}

function loadSectorState() {
    const state = sectorStates[currentSector];
    if (!state) return false;

    // Restore enemies
    enemies.forEach(e => e.destroy());
    enemies = [];
    for (const eData of state.enemies) {
        const enemy = new Enemy(eData.pos, eData.type);
        enemy.hp = eData.hp;
        enemies.push(enemy);
    }

    // Restore items
    items.forEach(i => i.destroy());
    items = [];
    for (const iData of state.items) {
        const item = new Item(iData.pos, iData.type);
        items.push(item);
    }

    // Restore containers
    containers.forEach(c => c.destroy());
    containers = [];
    for (const cData of state.containers) {
        const container = new Container(cData.pos, cData.lootTable);
        container.looted = cData.looted;
        containers.push(container);
    }

    return true;
}

function interactWithContainer() {
    for (const container of containers) {
        if (container.pos.distance(player.pos) < 1.5 && !container.looted) {
            container.looted = true;

            // Generate loot
            const lootTables = {
                basic: ['canned_food', 'water', 'scrap', 'cloth'],
                medical: ['medkit', 'antidote', 'chemicals', 'bandage'],
                tech: ['electronics', 'power_cell', 'scrap']
            };

            const table = lootTables[container.lootTable] || lootTables.basic;
            const itemType = table[Math.floor(rand() * table.length)];

            if (addToInventory(itemType)) {
                showNotification(`Found ${ITEM_DEFS[itemType].name}`);
            }

            // Special items in specific locations
            if (currentSector === 'research' && !hasKeycard && rand() < 0.3) {
                if (addToInventory('keycard')) {
                    hasKeycard = true;
                    showNotification('Found Red Keycard!');
                }
            }
            if (currentSector === 'research' && !unlockedTier2 && rand() < 0.3) {
                if (addToInventory('data_chip')) {
                    unlockedTier2 = true;
                    showNotification('Found Data Chip - Tier 2 recipes unlocked!');
                }
            }

            break;
        }
    }

    // Check for escape pod
    if (currentSector === 'escape' && player.pos.distance(vec2(0, 0)) < 2) {
        if (hasKeycard && poweredSectors.escape) {
            gameState = 'victory';
        } else if (!hasKeycard) {
            showNotification('Need Red Keycard!');
        } else if (!poweredSectors.escape) {
            showNotification('Escape Pod needs power!');
        }
    }
}

let notifications = [];
function showNotification(text) {
    notifications.push({ text, life: 3 });
}

function generateRoom() {
    // Clear existing
    roomWalls = [];
    enemies.forEach(e => e.destroy());
    enemies = [];
    items.forEach(i => i.destroy());
    items = [];
    containers.forEach(c => c.destroy());
    containers = [];

    // Check if we have saved state
    if (loadSectorState()) return;

    const sector = SECTORS[currentSector];
    const halfW = sector.width / 2;
    const halfH = sector.height / 2;

    // Generate walls
    for (let x = -halfW; x <= halfW; x++) {
        roomWalls.push(vec2(x, halfH));
        roomWalls.push(vec2(x, -halfH));
    }
    for (let y = -halfH; y <= halfH; y++) {
        roomWalls.push(vec2(-halfW, y));
        roomWalls.push(vec2(halfW, y));
    }

    // Add some internal walls
    if (currentSector !== 'hub') {
        for (let i = 0; i < 5; i++) {
            const wx = rand(-halfW + 3, halfW - 3);
            const wy = rand(-halfH + 3, halfH - 3);
            const len = rand(2, 5);
            const vertical = rand() > 0.5;

            for (let j = 0; j < len; j++) {
                if (vertical) {
                    roomWalls.push(vec2(wx, wy + j));
                } else {
                    roomWalls.push(vec2(wx + j, wy));
                }
            }
        }
    }

    // Spawn enemies
    if (currentSector !== 'hub') {
        for (const enemyType of sector.enemies) {
            const pos = vec2(
                rand(-halfW + 3, halfW - 3),
                rand(-halfH + 3, halfH - 3)
            );
            enemies.push(new Enemy(pos, enemyType));
        }
    }

    // Spawn containers
    const containerCount = currentSector === 'hub' ? 2 : rand(5, 10);
    const lootType = currentSector === 'medical' ? 'medical' :
                     currentSector === 'research' ? 'tech' : 'basic';

    for (let i = 0; i < containerCount; i++) {
        const pos = vec2(
            rand(-halfW + 2, halfW - 2),
            rand(-halfH + 2, halfH - 2)
        );
        containers.push(new Container(pos, lootType));
    }
}

function updateMeters(dt) {
    // Time passes
    gameTime += dt;
    realTime += dt;

    // Global infection
    globalInfection += 0.1 * dt;
    if (globalInfection >= 100) {
        gameState = 'death';
    }

    // Hunger
    meters.hunger += 0.1 * dt;

    // Thirst
    meters.thirst += 0.2 * dt;

    // Fatigue (when moving)
    if (keyIsDown('KeyW') || keyIsDown('KeyS') || keyIsDown('KeyA') || keyIsDown('KeyD')) {
        meters.fatigue += 0.067 * dt;
    }

    // Infection in unpowered sectors
    if (!poweredSectors[currentSector]) {
        meters.infection += 0.5 * dt;
    }

    // Health drain from critical meters
    if (meters.hunger >= 100) meters.health -= 5 * dt;
    else if (meters.hunger >= 75) meters.health -= 1 * dt;

    if (meters.thirst >= 100) meters.health -= 5 * dt;
    else if (meters.thirst >= 75) meters.health -= 1 * dt;

    if (meters.infection >= 100) {
        gameState = 'death';
    } else if (meters.infection >= 75) {
        meters.health -= 2 * dt;
    }

    // Clamp values
    meters.hunger = Math.min(100, meters.hunger);
    meters.thirst = Math.min(100, meters.thirst);
    meters.fatigue = Math.min(100, meters.fatigue);
    meters.infection = Math.min(100, meters.infection);
    meters.health = Math.max(0, meters.health);

    if (meters.health <= 0) {
        gameState = 'death';
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;

        if (p.vel) {
            p.pos = p.pos.add(p.vel.scale(dt));
        }

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Update notifications
    for (let i = notifications.length - 1; i >= 0; i--) {
        notifications[i].life -= dt;
        if (notifications[i].life <= 0) {
            notifications.splice(i, 1);
        }
    }
}

// LittleJS callbacks
function gameInit() {
    // Set canvas size
    canvasFixedSize = vec2(800, 600);
    cameraScale = 32;
}

function gameUpdate() {
    if (gameState === 'menu') {
        if (keyWasPressed('Space') || mouseWasPressed(0)) {
            startGame();
        }
        return;
    }

    if (gameState === 'victory' || gameState === 'death') {
        if (keyWasPressed('Space') || keyWasPressed('KeyR')) {
            gameState = 'menu';
        }
        return;
    }

    // Toggle inventory
    if (keyWasPressed('Tab')) {
        showInventory = !showInventory;
        showCrafting = false;
        showMap = false;
    }

    // Toggle map
    if (keyWasPressed('KeyM')) {
        showMap = !showMap;
        showInventory = false;
        showCrafting = false;
    }

    // Quick use slots
    if (keyWasPressed('Digit1')) useItem(0);
    if (keyWasPressed('Digit2')) useItem(1);
    if (keyWasPressed('Digit3')) useItem(2);

    // Inventory navigation
    if (showInventory) {
        if (keyWasPressed('ArrowUp') && selectedSlot > 0) selectedSlot--;
        if (keyWasPressed('ArrowDown') && selectedSlot < inventory.length - 1) selectedSlot++;
        if (keyWasPressed('KeyE') || keyWasPressed('Enter')) useItem(selectedSlot);
        return;
    }

    // Update game systems
    updateMeters(1/60);
    updateParticles(1/60);
}

function gameUpdatePost() {
    if (player && gameState === 'playing') {
        cameraPos = player.pos;
    }
}

function gameRender() {
    // Draw floor
    const sector = SECTORS[currentSector];
    const halfW = sector.width / 2;
    const halfH = sector.height / 2;

    const floorColor = poweredSectors[currentSector] ?
        new Color(0.15, 0.15, 0.2) : new Color(0.08, 0.08, 0.1);

    for (let x = -halfW; x <= halfW; x++) {
        for (let y = -halfH; y <= halfH; y++) {
            drawRect(vec2(x, y), vec2(1, 1), floorColor);
        }
    }

    // Draw walls
    for (const wall of roomWalls) {
        drawRect(wall, vec2(1, 1), new Color(0.3, 0.3, 0.35));
    }

    // Draw particles
    for (const p of particles) {
        if (p.type === 'blood') {
            drawRect(p.pos, vec2(0.2, 0.2), p.color);
        } else if (p.type === 'swing') {
            // Arc effect
        }
    }

    // Escape pod
    if (currentSector === 'escape') {
        drawRect(vec2(0, 0), vec2(3, 3), new Color(0.2, 0.5, 0.2));
        drawText('ESCAPE POD', vec2(0, 2), 0.3, new Color(0, 1, 0));
    }

    // Hub facilities
    if (currentSector === 'hub') {
        // Bed
        drawRect(vec2(-5, 3), vec2(2, 1.5), new Color(0.4, 0.3, 0.5));
        drawText('BED', vec2(-5, 4), 0.25, new Color(1, 1, 1));

        // Workbench
        drawRect(vec2(5, 3), vec2(2, 1.5), new Color(0.5, 0.4, 0.2));
        drawText('WORKBENCH', vec2(5, 4), 0.2, new Color(1, 1, 1));

        // Power panel
        drawRect(vec2(0, -5), vec2(2, 1), new Color(0.3, 0.3, 0.4));
        drawText('POWER', vec2(0, -4.3), 0.25, new Color(0, 1, 0));
    }
}

function gameRenderPost() {
    if (gameState === 'menu') {
        drawMenu();
        return;
    }

    if (gameState === 'victory') {
        drawVictory();
        return;
    }

    if (gameState === 'death') {
        drawDeath();
        return;
    }

    // Draw HUD
    drawHUD();

    if (showInventory) {
        drawInventoryUI();
    }

    if (showMap) {
        drawMapUI();
    }

    // Draw notifications
    for (let i = 0; i < notifications.length; i++) {
        const n = notifications[i];
        const alpha = Math.min(1, n.life);
        drawTextScreen(n.text, vec2(mainCanvasSize.x / 2, 100 + i * 25), 16, new Color(1, 1, 0, alpha), 0, undefined, 'center');
    }
}

function drawMenu() {
    drawTextScreen('ISOLATION PROTOCOL', vec2(mainCanvasSize.x / 2, 150), 40, new Color(0, 0.8, 0.2), 0, undefined, 'center');
    drawTextScreen('A Survival Horror Experience', vec2(mainCanvasSize.x / 2, 200), 16, new Color(0.5, 0.5, 0.5), 0, undefined, 'center');

    drawTextScreen('Press SPACE to Start', vec2(mainCanvasSize.x / 2, 320), 20, new Color(0, 1, 0), 0, undefined, 'center');

    drawTextScreen('CONTROLS:', vec2(mainCanvasSize.x / 2, 400), 18, new Color(0.7, 0.7, 0.7), 0, undefined, 'center');
    drawTextScreen('WASD - Move | SPACE - Dodge | E - Interact', vec2(mainCanvasSize.x / 2, 430), 14, new Color(0.5, 0.5, 0.5), 0, undefined, 'center');
    drawTextScreen('Mouse - Aim/Attack | TAB - Inventory | M - Map', vec2(mainCanvasSize.x / 2, 455), 14, new Color(0.5, 0.5, 0.5), 0, undefined, 'center');
    drawTextScreen('1-3 - Quick Use Items', vec2(mainCanvasSize.x / 2, 480), 14, new Color(0.5, 0.5, 0.5), 0, undefined, 'center');
}

function drawVictory() {
    drawTextScreen('ESCAPED!', vec2(mainCanvasSize.x / 2, 200), 48, new Color(0, 1, 0), 0, undefined, 'center');
    drawTextScreen(`Time: ${Math.floor(realTime / 60)}:${Math.floor(realTime % 60).toString().padStart(2, '0')}`, vec2(mainCanvasSize.x / 2, 280), 24, new Color(0.7, 0.7, 0.7), 0, undefined, 'center');
    drawTextScreen(`Global Infection: ${Math.floor(globalInfection)}%`, vec2(mainCanvasSize.x / 2, 320), 24, new Color(0.7, 0.7, 0.7), 0, undefined, 'center');
    drawTextScreen('Press SPACE to Play Again', vec2(mainCanvasSize.x / 2, 420), 18, new Color(0, 0.8, 0), 0, undefined, 'center');
}

function drawDeath() {
    const deathReason = meters.health <= 0 ? 'You Died' :
                        meters.infection >= 100 ? 'Infected' :
                        globalInfection >= 100 ? 'Facility Lost' : 'Game Over';

    drawTextScreen(deathReason, vec2(mainCanvasSize.x / 2, 200), 48, new Color(1, 0, 0), 0, undefined, 'center');
    drawTextScreen('The facility claims another victim.', vec2(mainCanvasSize.x / 2, 280), 18, new Color(0.5, 0.5, 0.5), 0, undefined, 'center');
    drawTextScreen('Press R to Restart', vec2(mainCanvasSize.x / 2, 380), 18, new Color(0.8, 0, 0), 0, undefined, 'center');
}

function drawHUD() {
    const barWidth = 150;
    const barHeight = 16;
    const startX = 20;
    let y = 20;

    // Health
    drawRectScreenSpace(vec2(startX + barWidth/2, y + barHeight/2), vec2(barWidth, barHeight), new Color(0.2, 0.2, 0.2));
    drawRectScreenSpace(vec2(startX + (meters.health/100) * barWidth/2, y + barHeight/2), vec2((meters.health/100) * barWidth, barHeight), new Color(0.8, 0.1, 0.1));
    drawTextScreen(`HP: ${Math.floor(meters.health)}`, vec2(startX + barWidth + 10, y + barHeight/2 + 4), 12, new Color(1, 1, 1));
    y += 22;

    // Infection
    drawRectScreenSpace(vec2(startX + barWidth/2, y + barHeight/2), vec2(barWidth, barHeight), new Color(0.2, 0.2, 0.2));
    drawRectScreenSpace(vec2(startX + (meters.infection/100) * barWidth/2, y + barHeight/2), vec2((meters.infection/100) * barWidth, barHeight), new Color(0.2, 0.8, 0.2));
    drawTextScreen(`INF: ${Math.floor(meters.infection)}%`, vec2(startX + barWidth + 10, y + barHeight/2 + 4), 12, new Color(0.5, 1, 0.5));
    y += 22;

    // Small bars for hunger/thirst/fatigue
    const smallBarWidth = 80;
    const smallBarHeight = 10;

    // Hunger
    drawRectScreenSpace(vec2(startX + smallBarWidth/2, y + smallBarHeight/2), vec2(smallBarWidth, smallBarHeight), new Color(0.2, 0.2, 0.2));
    drawRectScreenSpace(vec2(startX + (meters.hunger/100) * smallBarWidth/2, y + smallBarHeight/2), vec2((meters.hunger/100) * smallBarWidth, smallBarHeight), new Color(0.9, 0.6, 0.2));
    drawTextScreen('HGR', vec2(startX + smallBarWidth + 5, y + smallBarHeight/2 + 3), 10, new Color(0.9, 0.6, 0.2));
    y += 14;

    // Thirst
    drawRectScreenSpace(vec2(startX + smallBarWidth/2, y + smallBarHeight/2), vec2(smallBarWidth, smallBarHeight), new Color(0.2, 0.2, 0.2));
    drawRectScreenSpace(vec2(startX + (meters.thirst/100) * smallBarWidth/2, y + smallBarHeight/2), vec2((meters.thirst/100) * smallBarWidth, smallBarHeight), new Color(0.2, 0.5, 0.9));
    drawTextScreen('THR', vec2(startX + smallBarWidth + 5, y + smallBarHeight/2 + 3), 10, new Color(0.2, 0.5, 0.9));
    y += 14;

    // Fatigue
    drawRectScreenSpace(vec2(startX + smallBarWidth/2, y + smallBarHeight/2), vec2(smallBarWidth, smallBarHeight), new Color(0.2, 0.2, 0.2));
    drawRectScreenSpace(vec2(startX + (meters.fatigue/100) * smallBarWidth/2, y + smallBarHeight/2), vec2((meters.fatigue/100) * smallBarWidth, smallBarHeight), new Color(0.5, 0.5, 0.5));
    drawTextScreen('FTG', vec2(startX + smallBarWidth + 5, y + smallBarHeight/2 + 3), 10, new Color(0.5, 0.5, 0.5));

    // Sector name
    drawTextScreen(SECTORS[currentSector].name, vec2(mainCanvasSize.x / 2, 20), 16, new Color(0, 0.8, 0), 0, undefined, 'center');

    // Power status
    const powered = poweredSectors[currentSector] ? 'POWERED' : 'NO POWER';
    const powerColor = poweredSectors[currentSector] ? new Color(0, 1, 0) : new Color(1, 0.3, 0);
    drawTextScreen(powered, vec2(mainCanvasSize.x / 2, 40), 12, powerColor, 0, undefined, 'center');

    // Global infection
    drawTextScreen(`GLOBAL: ${Math.floor(globalInfection)}%`, vec2(mainCanvasSize.x - 100, mainCanvasSize.y - 30), 14, new Color(0, 1, 0));

    // Time
    const mins = Math.floor(gameTime);
    const hours = Math.floor(mins / 60);
    drawTextScreen(`${hours.toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`, vec2(mainCanvasSize.x - 100, 20), 14, new Color(0.7, 0.7, 0.7));

    // Equipped weapon
    if (equippedWeapon) {
        const def = ITEM_DEFS[equippedWeapon.type];
        let weaponText = def.name;
        if (def.weapon.ranged) {
            weaponText += ` [${equippedWeapon.ammo}]`;
        }
        drawTextScreen(weaponText, vec2(mainCanvasSize.x / 2, mainCanvasSize.y - 30), 14, new Color(1, 1, 0), 0, undefined, 'center');
    }

    // Quick slots
    for (let i = 0; i < 3; i++) {
        const slotX = 20 + i * 50;
        const slotY = mainCanvasSize.y - 50;

        drawRectScreenSpace(vec2(slotX + 20, slotY + 20), vec2(40, 40), new Color(0.2, 0.2, 0.2));
        drawTextScreen((i + 1).toString(), vec2(slotX + 5, slotY + 5), 10, new Color(0.5, 0.5, 0.5));

        if (i < inventory.length) {
            const item = inventory[i];
            const def = ITEM_DEFS[item.type];
            drawTextScreen(def.name.substring(0, 4), vec2(slotX + 20, slotY + 25), 10, new Color(1, 1, 1), 0, undefined, 'center');
            if (def.stackable && item.quantity > 1) {
                drawTextScreen(`x${item.quantity}`, vec2(slotX + 35, slotY + 35), 8, new Color(0.8, 0.8, 0.8));
            }
        }
    }
}

function drawInventoryUI() {
    // Background
    drawRectScreenSpace(vec2(mainCanvasSize.x / 2, mainCanvasSize.y / 2), vec2(400, 400), new Color(0.1, 0.1, 0.15, 0.95));

    drawTextScreen('INVENTORY', vec2(mainCanvasSize.x / 2, 120), 24, new Color(0, 0.8, 0), 0, undefined, 'center');

    let y = 160;
    for (let i = 0; i < inventory.length; i++) {
        const item = inventory[i];
        const def = ITEM_DEFS[item.type];
        const isSelected = i === selectedSlot;
        const color = isSelected ? new Color(1, 1, 0) : new Color(0.8, 0.8, 0.8);

        let text = def.name;
        if (def.stackable && item.quantity > 1) {
            text += ` x${item.quantity}`;
        }
        if (def.weapon && def.weapon.ranged && item.ammo !== undefined) {
            text += ` [${item.ammo}]`;
        }

        if (isSelected) {
            drawRectScreenSpace(vec2(mainCanvasSize.x / 2, y + 8), vec2(350, 20), new Color(0.2, 0.3, 0.2));
        }

        drawTextScreen(text, vec2(mainCanvasSize.x / 2, y), 14, color, 0, undefined, 'center');
        y += 22;
    }

    if (inventory.length === 0) {
        drawTextScreen('Empty', vec2(mainCanvasSize.x / 2, y), 14, new Color(0.5, 0.5, 0.5), 0, undefined, 'center');
    }

    drawTextScreen('E - Use | TAB - Close', vec2(mainCanvasSize.x / 2, 480), 12, new Color(0.5, 0.5, 0.5), 0, undefined, 'center');
}

function drawMapUI() {
    // Background
    drawRectScreenSpace(vec2(mainCanvasSize.x / 2, mainCanvasSize.y / 2), vec2(400, 350), new Color(0.1, 0.1, 0.15, 0.95));

    drawTextScreen('FACILITY MAP', vec2(mainCanvasSize.x / 2, 140), 24, new Color(0, 0.8, 0), 0, undefined, 'center');

    // Draw sector layout
    const mapCenterX = mainCanvasSize.x / 2;
    const mapCenterY = 280;
    const boxSize = 60;
    const gap = 80;

    // Hub (center)
    drawMapSector('hub', mapCenterX, mapCenterY, boxSize);

    // Escape (north)
    drawMapSector('escape', mapCenterX, mapCenterY - gap, boxSize);

    // Storage (south)
    drawMapSector('storage', mapCenterX, mapCenterY + gap, boxSize);

    // Research (west)
    drawMapSector('research', mapCenterX - gap, mapCenterY, boxSize);

    // Medical (east)
    drawMapSector('medical', mapCenterX + gap, mapCenterY, boxSize);

    // Power display
    drawTextScreen(`Power: ${currentPower}/${POWER_CAPACITY}`, vec2(mainCanvasSize.x / 2, 420), 14, new Color(0, 1, 0), 0, undefined, 'center');
    drawTextScreen('M - Close', vec2(mainCanvasSize.x / 2, 450), 12, new Color(0.5, 0.5, 0.5), 0, undefined, 'center');
}

function drawMapSector(sectorId, x, y, size) {
    const sector = SECTORS[sectorId];
    const isPowered = poweredSectors[sectorId];
    const isCurrent = currentSector === sectorId;

    let bgColor = isPowered ? new Color(0.1, 0.3, 0.1) : new Color(0.2, 0.1, 0.1);
    if (isCurrent) bgColor = new Color(0.1, 0.4, 0.4);

    drawRectScreenSpace(vec2(x, y), vec2(size, size), bgColor);

    // Sector name
    const shortName = sector.name.split(' ')[0];
    drawTextScreen(shortName, vec2(x, y - 5), 10, new Color(1, 1, 1), 0, undefined, 'center');

    // Power cost
    drawTextScreen(`${sector.powerCost}W`, vec2(x, y + 10), 8, isPowered ? new Color(0, 1, 0) : new Color(1, 0.3, 0), 0, undefined, 'center');

    // Current indicator
    if (isCurrent) {
        drawTextScreen('YOU', vec2(x, y + 20), 8, new Color(1, 1, 0), 0, undefined, 'center');
    }
}

function drawRectScreenSpace(pos, size, color) {
    drawRect(screenToWorld(pos), size.scale(1/cameraScale), color);
}

function startGame() {
    gameState = 'playing';

    // Reset all state
    meters = {
        health: 100,
        hunger: 0,
        thirst: 0,
        fatigue: 0,
        infection: 0
    };
    globalInfection = 0;
    gameTime = 0;
    realTime = 0;
    currentPower = 0;
    poweredSectors = { hub: true };
    currentSector = 'hub';
    sectorStates = {};
    inventory = [];
    equippedWeapon = null;
    unlockedTier2 = false;
    hasKeycard = false;
    showInventory = false;
    showMap = false;

    // Starting items
    addToInventory('canned_food');
    addToInventory('canned_food');
    addToInventory('water');
    addToInventory('water');
    addToInventory('shiv');

    // Create player
    player = new Player(vec2(0, 0));

    // Generate starting room
    generateRoom();
}

// Initialize LittleJS
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
