// Isolation Protocol - Subterrain Clone - PixiJS
// 2D Top-Down Survival Horror

const APP_WIDTH = 800;
const APP_HEIGHT = 600;
const TILE_SIZE = 32;

const app = new PIXI.Application({
    width: APP_WIDTH,
    height: APP_HEIGHT,
    backgroundColor: 0x0a0a0a
});
document.body.appendChild(app.view);

// Game States
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    INVENTORY: 'inventory',
    CRAFTING: 'crafting',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// Sectors
const Sectors = {
    HUB: 'hub',
    STORAGE: 'storage',
    MEDICAL: 'medical',
    RESEARCH: 'research',
    ESCAPE: 'escape'
};

// Enemy types
const ENEMY_TYPES = {
    shambler: { name: 'Shambler', hp: 30, damage: 10, speed: 30, infection: 5, color: 0x446644 },
    crawler: { name: 'Crawler', hp: 20, damage: 8, speed: 60, infection: 5, color: 0x664444 },
    spitter: { name: 'Spitter', hp: 25, damage: 15, speed: 25, infection: 10, ranged: true, color: 0x448844 },
    brute: { name: 'Brute', hp: 80, damage: 25, speed: 20, infection: 8, color: 0x884444 },
    cocoon: { name: 'Cocoon', hp: 50, damage: 0, speed: 0, infection: 1, spawns: true, color: 0x446666 }
};

// Items
const ITEMS = {
    canned_food: { name: 'Canned Food', type: 'consumable', effect: { hunger: -30 }, stack: 5 },
    medkit: { name: 'Medkit', type: 'consumable', effect: { health: 30 }, stack: 3 },
    antidote: { name: 'Antidote', type: 'consumable', effect: { infection: -30 }, stack: 3 },
    scrap: { name: 'Scrap Metal', type: 'material', stack: 10 },
    chemicals: { name: 'Chemicals', type: 'material', stack: 10 },
    cloth: { name: 'Cloth', type: 'material', stack: 10 },
    electronics: { name: 'Electronics', type: 'material', stack: 10 },
    red_keycard: { name: 'Red Keycard', type: 'key', stack: 1 },
    pistol_ammo: { name: 'Pistol Ammo', type: 'ammo', stack: 50 }
};

// Crafting recipes
const RECIPES = {
    bandage: { name: 'Bandage', materials: { cloth: 2 }, result: { health: 10 } },
    antidote: { name: 'Antidote', materials: { chemicals: 3 }, result: 'antidote' },
    pistol_ammo: { name: 'Ammo x10', materials: { scrap: 2, chemicals: 1 }, result: { pistol_ammo: 10 } }
};

// Containers
const gameContainer = new PIXI.Container();
const worldContainer = new PIXI.Container();
const entityContainer = new PIXI.Container();
const effectsContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();
const menuContainer = new PIXI.Container();
const overlayContainer = new PIXI.Container();

gameContainer.addChild(worldContainer);
gameContainer.addChild(entityContainer);
gameContainer.addChild(effectsContainer);
app.stage.addChild(gameContainer);
app.stage.addChild(uiContainer);
app.stage.addChild(overlayContainer);
app.stage.addChild(menuContainer);

// Game variables
let state = GameState.MENU;
let player = null;
let enemies = [];
let items = [];
let bullets = [];
let effects = [];
let currentSector = Sectors.HUB;
let sectorStates = {};
let gameTime = 0; // In game minutes
let globalInfection = 0;
let powerCapacity = 500;
let poweredSectors = new Set([Sectors.HUB]);
let screenShake = 0;

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false, clicked: false };
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
app.view.addEventListener('mousemove', (e) => {
    const rect = app.view.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
app.view.addEventListener('mousedown', () => { mouse.down = true; mouse.clicked = true; });
app.view.addEventListener('mouseup', () => { mouse.down = false; });

// Sector power costs
const POWER_COSTS = {
    [Sectors.HUB]: 0,
    [Sectors.STORAGE]: 100,
    [Sectors.MEDICAL]: 150,
    [Sectors.RESEARCH]: 200,
    [Sectors.ESCAPE]: 300
};

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 120;

        this.health = 100;
        this.maxHealth = 100;
        this.hunger = 0;
        this.infection = 0;

        this.inventory = [
            { id: 'canned_food', count: 2 },
            { id: 'medkit', count: 1 },
            { id: 'pistol_ammo', count: 24 }
        ];
        this.maxInventory = 20;

        this.hasGun = true;
        this.ammo = 24;
        this.fireCooldown = 0;
        this.invincible = 0;

        this.direction = { x: 0, y: 1 };

        this.sprite = new PIXI.Graphics();
        this.updateSprite();
        entityContainer.addChild(this.sprite);
    }

    updateSprite() {
        this.sprite.clear();
        // Body
        this.sprite.beginFill(0x44aaff);
        this.sprite.drawCircle(0, 0, 12);
        this.sprite.endFill();
        // Direction indicator
        this.sprite.beginFill(0xffffff);
        this.sprite.drawCircle(this.direction.x * 10, this.direction.y * 10, 4);
        this.sprite.endFill();
    }

    update(delta) {
        const dt = delta / 60;

        // Cooldowns
        if (this.fireCooldown > 0) this.fireCooldown -= dt;
        if (this.invincible > 0) this.invincible -= dt;

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

        // Speed penalty from hunger
        let currentSpeed = this.speed;
        if (this.hunger > 75) currentSpeed *= 0.75;
        else if (this.hunger > 50) currentSpeed *= 0.9;

        const nx = this.x + vx * currentSpeed * dt;
        const ny = this.y + vy * currentSpeed * dt;

        if (canMoveTo(nx, this.y)) this.x = nx;
        if (canMoveTo(this.x, ny)) this.y = ny;

        // Update direction towards mouse
        const worldMouse = screenToWorld(mouse.x, mouse.y);
        const dx = worldMouse.x - this.x;
        const dy = worldMouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            this.direction.x = dx / dist;
            this.direction.y = dy / dist;
        }

        // Shooting
        if (mouse.clicked && this.hasGun && this.ammo > 0 && this.fireCooldown <= 0) {
            this.shoot();
        }

        // Update sprite
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.alpha = this.invincible > 0 ? 0.5 : 1;
        this.updateSprite();

        // Sector exit check
        checkSectorTransition();
    }

    shoot() {
        this.fireCooldown = 0.3;
        this.ammo--;

        // Update ammo in inventory
        const ammoItem = this.inventory.find(i => i.id === 'pistol_ammo');
        if (ammoItem) ammoItem.count--;

        const bullet = new Bullet(
            this.x + this.direction.x * 15,
            this.y + this.direction.y * 15,
            this.direction.x * 400,
            this.direction.y * 400,
            15,
            true
        );
        bullets.push(bullet);

        // Muzzle flash effect
        createMuzzleFlash(this.x + this.direction.x * 20, this.y + this.direction.y * 20);
        screenShake = 3;
    }

    takeDamage(amount, infectionAmount = 0) {
        if (this.invincible > 0) return;

        this.health -= amount;
        this.infection += infectionAmount;
        this.invincible = 0.5;

        screenShake = 8;
        showFloatingText(this.x, this.y - 20, `-${amount}`, 0xff4444);

        if (this.health <= 0) {
            this.health = 0;
            gameOver('health');
        }
    }

    useItem(itemId) {
        const idx = this.inventory.findIndex(i => i.id === itemId);
        if (idx < 0) return false;

        const item = ITEMS[itemId];
        if (!item.effect) return false;

        if (item.effect.health) {
            this.health = Math.min(this.maxHealth, this.health + item.effect.health);
            showFloatingText(this.x, this.y - 20, `+${item.effect.health} HP`, 0x44ff44);
        }
        if (item.effect.hunger) {
            this.hunger = Math.max(0, this.hunger + item.effect.hunger);
            showFloatingText(this.x, this.y - 20, `Hunger reduced`, 0xffaa44);
        }
        if (item.effect.infection) {
            this.infection = Math.max(0, this.infection + item.effect.infection);
            showFloatingText(this.x, this.y - 20, `Infection reduced`, 0x44ffaa);
        }

        this.inventory[idx].count--;
        if (this.inventory[idx].count <= 0) {
            this.inventory.splice(idx, 1);
        }

        return true;
    }

    hasItem(itemId) {
        return this.inventory.some(i => i.id === itemId && i.count > 0);
    }

    addItem(itemId, count = 1) {
        const existing = this.inventory.find(i => i.id === itemId);
        if (existing) {
            existing.count += count;
        } else {
            this.inventory.push({ id: itemId, count });
        }

        if (itemId === 'pistol_ammo') {
            this.ammo += count;
        }
    }
}

// Bullet class
class Bullet {
    constructor(x, y, vx, vy, damage, isPlayer) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.isPlayer = isPlayer;

        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(isPlayer ? 0xffff44 : 0x44ff44);
        this.sprite.drawCircle(0, 0, 4);
        this.sprite.endFill();
        entityContainer.addChild(this.sprite);
    }

    update(delta) {
        const dt = delta / 60;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.sprite.x = this.x;
        this.sprite.y = this.y;

        // Check collision
        if (this.isPlayer) {
            for (const enemy of enemies) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                if (Math.sqrt(dx * dx + dy * dy) < 20) {
                    enemy.takeDamage(this.damage);
                    createHitEffect(this.x, this.y);
                    return true;
                }
            }
        } else {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            if (Math.sqrt(dx * dx + dy * dy) < 15) {
                player.takeDamage(this.damage, 10);
                return true;
            }
        }

        // Check walls
        if (!canMoveTo(this.x, this.y)) {
            return true;
        }

        return false;
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        const def = ENEMY_TYPES[type];

        this.name = def.name;
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.damage = def.damage;
        this.speed = def.speed;
        this.infection = def.infection;
        this.ranged = def.ranged || false;
        this.spawns = def.spawns || false;

        this.attackCooldown = 0;
        this.spawnCooldown = 0;

        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(def.color);
        if (type === 'brute') {
            this.sprite.drawRect(-16, -16, 32, 32);
        } else if (type === 'cocoon') {
            this.sprite.drawEllipse(0, 0, 20, 15);
        } else {
            this.sprite.drawCircle(0, 0, 12);
        }
        this.sprite.endFill();

        // HP bar
        this.hpBar = new PIXI.Graphics();
        this.updateHpBar();
        this.sprite.addChild(this.hpBar);

        entityContainer.addChild(this.sprite);
    }

    updateHpBar() {
        this.hpBar.clear();
        this.hpBar.beginFill(0x440000);
        this.hpBar.drawRect(-15, -25, 30, 4);
        this.hpBar.endFill();
        this.hpBar.beginFill(0xff4444);
        this.hpBar.drawRect(-15, -25, 30 * (this.hp / this.maxHp), 4);
        this.hpBar.endFill();
    }

    update(delta) {
        const dt = delta / 60;

        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.spawnCooldown > 0) this.spawnCooldown -= dt;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Cocoon spawns enemies
        if (this.spawns) {
            if (this.spawnCooldown <= 0 && enemies.length < 15) {
                this.spawnCooldown = 10;
                enemies.push(new Enemy(
                    this.x + (Math.random() - 0.5) * 40,
                    this.y + (Math.random() - 0.5) * 40,
                    'shambler'
                ));
            }
            // Infection aura
            if (dist < 150) {
                player.infection += 0.01 * dt;
            }
        } else if (this.ranged) {
            // Spitter - keep distance and shoot
            if (dist < 100) {
                // Back up
                const nx = this.x - (dx / dist) * this.speed * dt;
                const ny = this.y - (dy / dist) * this.speed * dt;
                if (canMoveTo(nx, this.y)) this.x = nx;
                if (canMoveTo(this.x, ny)) this.y = ny;
            } else if (dist < 300 && this.attackCooldown <= 0) {
                this.attackCooldown = 2.5;
                const bullet = new Bullet(
                    this.x,
                    this.y,
                    (dx / dist) * 150,
                    (dy / dist) * 150,
                    this.damage,
                    false
                );
                bullets.push(bullet);
            }
        } else if (this.speed > 0) {
            // Chase player
            if (dist > 25 && dist < 300) {
                const nx = this.x + (dx / dist) * this.speed * dt;
                const ny = this.y + (dy / dist) * this.speed * dt;
                if (canMoveTo(nx, this.y)) this.x = nx;
                if (canMoveTo(this.x, ny)) this.y = ny;
            }

            // Melee attack
            if (dist < 30 && this.attackCooldown <= 0) {
                this.attackCooldown = 1.5;
                player.takeDamage(this.damage, this.infection);
            }
        }

        this.sprite.x = this.x;
        this.sprite.y = this.y;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.updateHpBar();
        showFloatingText(this.x, this.y - 30, `-${amount}`, 0xffaa00);

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        // Drop items
        if (Math.random() < 0.2) {
            const dropTypes = ['canned_food', 'scrap', 'chemicals'];
            const drop = dropTypes[Math.floor(Math.random() * dropTypes.length)];
            items.push(new WorldItem(this.x, this.y, drop));
        }

        // Create blood pool (static)
        createBloodPool(this.x, this.y);

        entityContainer.removeChild(this.sprite);
        enemies = enemies.filter(e => e !== this);

        // Save state
        saveSectorState();
    }
}

// World Item class
class WorldItem {
    constructor(x, y, itemId) {
        this.x = x;
        this.y = y;
        this.itemId = itemId;

        const colors = {
            canned_food: 0xffaa44,
            medkit: 0xff4444,
            antidote: 0x44ffaa,
            scrap: 0x888888,
            chemicals: 0x44ff44,
            cloth: 0xaaaaaa,
            electronics: 0x4444ff,
            red_keycard: 0xff0000,
            pistol_ammo: 0xffff44
        };

        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(colors[itemId] || 0xffffff);
        this.sprite.drawRect(-8, -8, 16, 16);
        this.sprite.endFill();
        this.sprite.x = x;
        this.sprite.y = y;
        entityContainer.addChild(this.sprite);
    }

    checkPickup() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        if (Math.sqrt(dx * dx + dy * dy) < 25) {
            player.addItem(this.itemId, 1);
            showFloatingText(this.x, this.y - 10, `+${ITEMS[this.itemId].name}`, 0x44ff44);
            entityContainer.removeChild(this.sprite);
            items = items.filter(i => i !== this);
            saveSectorState();
            return true;
        }
        return false;
    }
}

// Sector map data
let currentMap = [];
let mapWidth = 0;
let mapHeight = 0;

function generateSector(sectorId) {
    let width, height;
    switch (sectorId) {
        case Sectors.HUB: width = 15; height = 15; break;
        case Sectors.STORAGE: width = 20; height = 20; break;
        case Sectors.MEDICAL: width = 20; height = 20; break;
        case Sectors.RESEARCH: width = 25; height = 25; break;
        case Sectors.ESCAPE: width = 15; height = 15; break;
        default: width = 15; height = 15;
    }

    mapWidth = width;
    mapHeight = height;
    currentMap = [];

    // Generate base floor
    for (let y = 0; y < height; y++) {
        currentMap[y] = [];
        for (let x = 0; x < width; x++) {
            // Border walls
            if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                currentMap[y][x] = 1;
            } else {
                currentMap[y][x] = 0;
            }
        }
    }

    // Add random obstacles
    const obstacleCount = Math.floor(width * height * 0.05);
    for (let i = 0; i < obstacleCount; i++) {
        const ox = 2 + Math.floor(Math.random() * (width - 4));
        const oy = 2 + Math.floor(Math.random() * (height - 4));
        currentMap[oy][ox] = 2; // Obstacle/container
    }

    // Create exits based on sector connections
    const exits = getSectorExits(sectorId);
    for (const exit of exits) {
        const ex = exit.x === 'left' ? 0 : (exit.x === 'right' ? width - 1 : Math.floor(width / 2));
        const ey = exit.y === 'top' ? 0 : (exit.y === 'bottom' ? height - 1 : Math.floor(height / 2));
        currentMap[ey][ex] = 3; // Exit tile
    }

    return { width, height, map: currentMap };
}

function getSectorExits(sectorId) {
    switch (sectorId) {
        case Sectors.HUB:
            return [
                { to: Sectors.STORAGE, x: 'left', y: 'center' },
                { to: Sectors.MEDICAL, x: 'right', y: 'center' },
                { to: Sectors.RESEARCH, x: 'center', y: 'top' },
                { to: Sectors.ESCAPE, x: 'center', y: 'bottom' }
            ];
        case Sectors.STORAGE:
            return [{ to: Sectors.HUB, x: 'right', y: 'center' }];
        case Sectors.MEDICAL:
            return [{ to: Sectors.HUB, x: 'left', y: 'center' }];
        case Sectors.RESEARCH:
            return [{ to: Sectors.HUB, x: 'center', y: 'bottom' }];
        case Sectors.ESCAPE:
            return [{ to: Sectors.HUB, x: 'center', y: 'top' }];
        default:
            return [];
    }
}

function loadSector(sectorId, entryDirection = null) {
    // Save current sector state
    saveSectorState();

    currentSector = sectorId;

    // Clear entities
    for (const e of enemies) entityContainer.removeChild(e.sprite);
    for (const b of bullets) entityContainer.removeChild(b.sprite);
    for (const i of items) entityContainer.removeChild(i.sprite);
    enemies = [];
    bullets = [];
    items = [];

    // Load or generate sector
    if (sectorStates[sectorId]) {
        restoreSectorState(sectorId);
    } else {
        generateSector(sectorId);
        spawnSectorContent(sectorId);
    }

    renderMap();

    // Position player based on entry
    if (entryDirection) {
        switch (entryDirection) {
            case 'left':
                player.x = (mapWidth - 2) * TILE_SIZE;
                player.y = Math.floor(mapHeight / 2) * TILE_SIZE;
                break;
            case 'right':
                player.x = 2 * TILE_SIZE;
                player.y = Math.floor(mapHeight / 2) * TILE_SIZE;
                break;
            case 'top':
                player.x = Math.floor(mapWidth / 2) * TILE_SIZE;
                player.y = (mapHeight - 2) * TILE_SIZE;
                break;
            case 'bottom':
                player.x = Math.floor(mapWidth / 2) * TILE_SIZE;
                player.y = 2 * TILE_SIZE;
                break;
        }
    }
}

function spawnSectorContent(sectorId) {
    if (sectorId === Sectors.HUB) {
        // Safe zone - no enemies, add workbench marker
        return;
    }

    // Spawn enemies based on sector
    const enemyConfigs = {
        [Sectors.STORAGE]: [
            { type: 'shambler', count: 4 },
            { type: 'crawler', count: 2 }
        ],
        [Sectors.MEDICAL]: [
            { type: 'shambler', count: 3 },
            { type: 'spitter', count: 2 },
            { type: 'cocoon', count: 1 }
        ],
        [Sectors.RESEARCH]: [
            { type: 'crawler', count: 3 },
            { type: 'spitter', count: 2 },
            { type: 'brute', count: 1 }
        ],
        [Sectors.ESCAPE]: [
            { type: 'shambler', count: 3 },
            { type: 'brute', count: 2 }
        ]
    };

    const config = enemyConfigs[sectorId] || [];
    for (const ec of config) {
        for (let i = 0; i < ec.count; i++) {
            let ex, ey;
            do {
                ex = 3 + Math.floor(Math.random() * (mapWidth - 6));
                ey = 3 + Math.floor(Math.random() * (mapHeight - 6));
            } while (currentMap[ey][ex] !== 0);
            enemies.push(new Enemy(ex * TILE_SIZE, ey * TILE_SIZE, ec.type));
        }
    }

    // Spawn items
    const itemConfigs = {
        [Sectors.STORAGE]: ['canned_food', 'canned_food', 'scrap', 'scrap', 'cloth'],
        [Sectors.MEDICAL]: ['medkit', 'medkit', 'antidote', 'chemicals'],
        [Sectors.RESEARCH]: ['electronics', 'chemicals', 'red_keycard'],
        [Sectors.ESCAPE]: ['medkit', 'pistol_ammo']
    };

    const itemList = itemConfigs[sectorId] || [];
    for (const itemId of itemList) {
        let ix, iy;
        do {
            ix = 2 + Math.floor(Math.random() * (mapWidth - 4));
            iy = 2 + Math.floor(Math.random() * (mapHeight - 4));
        } while (currentMap[iy][ix] !== 0);
        items.push(new WorldItem(ix * TILE_SIZE, iy * TILE_SIZE, itemId));
    }
}

function saveSectorState() {
    sectorStates[currentSector] = {
        enemies: enemies.map(e => ({ x: e.x, y: e.y, type: e.type, hp: e.hp })),
        items: items.map(i => ({ x: i.x, y: i.y, itemId: i.itemId })),
        map: JSON.parse(JSON.stringify(currentMap))
    };
}

function restoreSectorState(sectorId) {
    const state = sectorStates[sectorId];
    currentMap = state.map;
    mapWidth = currentMap[0].length;
    mapHeight = currentMap.length;

    for (const e of state.enemies) {
        const enemy = new Enemy(e.x, e.y, e.type);
        enemy.hp = e.hp;
        enemy.updateHpBar();
        enemies.push(enemy);
    }

    for (const i of state.items) {
        items.push(new WorldItem(i.x, i.y, i.itemId));
    }
}

function renderMap() {
    worldContainer.removeChildren();

    const isPowered = poweredSectors.has(currentSector);

    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            const tile = new PIXI.Graphics();
            const tileType = currentMap[y][x];

            if (tileType === 1) {
                tile.beginFill(0x333344);
            } else if (tileType === 2) {
                tile.beginFill(0x444455); // Obstacle
            } else if (tileType === 3) {
                tile.beginFill(0x446644); // Exit
            } else {
                tile.beginFill(isPowered ? 0x1a1a2a : 0x0a0a15);
            }

            tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
            tile.endFill();
            tile.lineStyle(1, 0x111122, 0.3);
            tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);

            tile.x = x * TILE_SIZE;
            tile.y = y * TILE_SIZE;
            worldContainer.addChild(tile);
        }
    }

    // Darkness overlay for unpowered sectors
    if (!isPowered) {
        const darkness = new PIXI.Graphics();
        darkness.beginFill(0x000000, 0.4);
        darkness.drawRect(0, 0, mapWidth * TILE_SIZE, mapHeight * TILE_SIZE);
        darkness.endFill();
        worldContainer.addChild(darkness);
    }
}

function canMoveTo(x, y) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    if (tx < 0 || tx >= mapWidth || ty < 0 || ty >= mapHeight) return false;
    return currentMap[ty][tx] === 0 || currentMap[ty][tx] === 3;
}

function checkSectorTransition() {
    const tx = Math.floor(player.x / TILE_SIZE);
    const ty = Math.floor(player.y / TILE_SIZE);

    if (currentMap[ty] && currentMap[ty][tx] === 3) {
        const exits = getSectorExits(currentSector);
        for (const exit of exits) {
            const ex = exit.x === 'left' ? 0 : (exit.x === 'right' ? mapWidth - 1 : Math.floor(mapWidth / 2));
            const ey = exit.y === 'top' ? 0 : (exit.y === 'bottom' ? mapHeight - 1 : Math.floor(mapHeight / 2));

            if (tx === ex && ty === ey) {
                // Check if escape pod
                if (exit.to === Sectors.ESCAPE || currentSector === Sectors.ESCAPE) {
                    if (!poweredSectors.has(Sectors.ESCAPE)) {
                        showFloatingText(player.x, player.y - 30, 'Escape Pod not powered!', 0xff4444);
                        return;
                    }
                    if (currentSector === Sectors.ESCAPE && player.hasItem('red_keycard')) {
                        // Victory!
                        victory();
                        return;
                    }
                }

                // Determine entry direction
                let entryDir = null;
                if (exit.x === 'left') entryDir = 'left';
                else if (exit.x === 'right') entryDir = 'right';
                else if (exit.y === 'top') entryDir = 'top';
                else if (exit.y === 'bottom') entryDir = 'bottom';

                loadSector(exit.to, entryDir);
                return;
            }
        }
    }
}

function screenToWorld(sx, sy) {
    return {
        x: sx - gameContainer.x,
        y: sy - gameContainer.y
    };
}

// Effects
function createMuzzleFlash(x, y) {
    const effect = new PIXI.Graphics();
    effect.beginFill(0xffff00);
    effect.drawCircle(0, 0, 8);
    effect.endFill();
    effect.x = x;
    effect.y = y;
    effect.life = 0.1;
    effectsContainer.addChild(effect);
    effects.push(effect);
}

function createHitEffect(x, y) {
    const effect = new PIXI.Graphics();
    effect.beginFill(0xff8800);
    for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 5 + Math.random() * 10;
        effect.drawCircle(Math.cos(angle) * dist, Math.sin(angle) * dist, 2);
    }
    effect.endFill();
    effect.x = x;
    effect.y = y;
    effect.life = 0.2;
    effectsContainer.addChild(effect);
    effects.push(effect);
}

function createBloodPool(x, y) {
    const pool = new PIXI.Graphics();
    pool.beginFill(0x880000, 0.6);
    pool.drawEllipse(0, 0, 15 + Math.random() * 10, 10 + Math.random() * 5);
    pool.endFill();
    pool.x = x;
    pool.y = y;
    // Blood pools are static - add to world container behind entities
    worldContainer.addChild(pool);
}

function showFloatingText(x, y, text, color) {
    const t = new PIXI.Text(text, {
        fontSize: 12,
        fill: color,
        fontWeight: 'bold',
        stroke: 0x000000,
        strokeThickness: 2
    });
    t.anchor.set(0.5);
    t.x = x;
    t.y = y;
    t.life = 1;
    t.vy = -30;
    effectsContainer.addChild(t);
    effects.push(t);
}

function updateEffects(delta) {
    const dt = delta / 60;
    for (let i = effects.length - 1; i >= 0; i--) {
        const e = effects[i];
        e.life -= dt;
        if (e.vy) e.y += e.vy * dt;
        e.alpha = Math.max(0, e.life * 2);

        if (e.life <= 0) {
            effectsContainer.removeChild(e);
            effects.splice(i, 1);
        }
    }
}

// Camera
function updateCamera() {
    let targetX = -player.x + APP_WIDTH / 2;
    let targetY = -player.y + APP_HEIGHT / 2;

    if (screenShake > 0) {
        targetX += (Math.random() - 0.5) * screenShake;
        targetY += (Math.random() - 0.5) * screenShake;
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }

    gameContainer.x = targetX;
    gameContainer.y = targetY;
}

// Time and survival mechanics
function updateSurvival(delta) {
    const dt = delta / 60;

    // Time passes (1 real second = 1 game minute)
    gameTime += dt;

    // Global infection increases
    globalInfection += 0.1 * dt / 60; // 0.1% per game minute

    // Hunger increases
    player.hunger += 0.1 * dt;

    // Effects of high hunger
    if (player.hunger >= 100) {
        player.health -= 5 * dt;
        if (player.health <= 0) gameOver('hunger');
    } else if (player.hunger >= 75) {
        player.health -= 1 * dt;
    }

    // Effects of high infection
    if (player.infection >= 100) {
        gameOver('infection');
    } else if (player.infection >= 75) {
        player.health -= 2 * dt;
    }

    // Global infection game over
    if (globalInfection >= 100) {
        gameOver('global');
    }

    // Unpowered sector infection
    if (!poweredSectors.has(currentSector) && currentSector !== Sectors.HUB) {
        player.infection += 0.5 * dt;
    }
}

// UI
function createUI() {
    uiContainer.removeChildren();

    // Top bar background
    const topBar = new PIXI.Graphics();
    topBar.beginFill(0x111122, 0.9);
    topBar.drawRect(0, 0, APP_WIDTH, 50);
    topBar.endFill();
    uiContainer.addChild(topBar);

    // Bottom bar
    const bottomBar = new PIXI.Graphics();
    bottomBar.beginFill(0x111122, 0.9);
    bottomBar.drawRect(0, APP_HEIGHT - 30, APP_WIDTH, 30);
    bottomBar.endFill();
    uiContainer.addChild(bottomBar);
}

function updateUI() {
    // Clear dynamic UI
    while (uiContainer.children.length > 2) {
        uiContainer.removeChildAt(2);
    }

    // Health bar
    const hpLabel = new PIXI.Text('HP', { fontSize: 10, fill: 0xaaaaaa });
    hpLabel.x = 10;
    hpLabel.y = 5;
    uiContainer.addChild(hpLabel);

    const hpBar = new PIXI.Graphics();
    hpBar.beginFill(0x440000);
    hpBar.drawRect(30, 5, 100, 12);
    hpBar.endFill();
    hpBar.beginFill(0xff4444);
    hpBar.drawRect(30, 5, 100 * (player.health / player.maxHealth), 12);
    hpBar.endFill();
    uiContainer.addChild(hpBar);

    // Hunger bar
    const hungerLabel = new PIXI.Text('HGR', { fontSize: 10, fill: 0xaaaaaa });
    hungerLabel.x = 10;
    hungerLabel.y = 20;
    uiContainer.addChild(hungerLabel);

    const hungerBar = new PIXI.Graphics();
    hungerBar.beginFill(0x444400);
    hungerBar.drawRect(30, 20, 100, 12);
    hungerBar.endFill();
    hungerBar.beginFill(0xffaa44);
    hungerBar.drawRect(30, 20, 100 * (player.hunger / 100), 12);
    hungerBar.endFill();
    uiContainer.addChild(hungerBar);

    // Infection bar
    const infLabel = new PIXI.Text('INF', { fontSize: 10, fill: 0xaaaaaa });
    infLabel.x = 10;
    infLabel.y = 35;
    uiContainer.addChild(infLabel);

    const infBar = new PIXI.Graphics();
    infBar.beginFill(0x004400);
    infBar.drawRect(30, 35, 100, 12);
    infBar.endFill();
    infBar.beginFill(0x44ff44);
    infBar.drawRect(30, 35, 100 * (player.infection / 100), 12);
    infBar.endFill();
    uiContainer.addChild(infBar);

    // Ammo
    const ammoText = new PIXI.Text(`Ammo: ${player.ammo}`, { fontSize: 12, fill: 0xffff44 });
    ammoText.x = 150;
    ammoText.y = 10;
    uiContainer.addChild(ammoText);

    // Sector name
    const sectorNames = {
        [Sectors.HUB]: 'Central Hub',
        [Sectors.STORAGE]: 'Storage Wing',
        [Sectors.MEDICAL]: 'Medical Bay',
        [Sectors.RESEARCH]: 'Research Lab',
        [Sectors.ESCAPE]: 'Escape Pod'
    };
    const sectorText = new PIXI.Text(sectorNames[currentSector], { fontSize: 14, fill: 0xffffff });
    sectorText.x = APP_WIDTH / 2 - 50;
    sectorText.y = 10;
    uiContainer.addChild(sectorText);

    // Power status
    const powerStatus = poweredSectors.has(currentSector) ? 'POWERED' : 'UNPOWERED';
    const powerText = new PIXI.Text(powerStatus, {
        fontSize: 12,
        fill: poweredSectors.has(currentSector) ? 0x44ff44 : 0xff4444
    });
    powerText.x = APP_WIDTH / 2 - 30;
    powerText.y = 28;
    uiContainer.addChild(powerText);

    // Global infection
    const globalText = new PIXI.Text(`Global: ${globalInfection.toFixed(1)}%`, { fontSize: 12, fill: 0x44ff44 });
    globalText.x = APP_WIDTH - 100;
    globalText.y = 10;
    uiContainer.addChild(globalText);

    // Time
    const hours = Math.floor(gameTime / 60);
    const mins = Math.floor(gameTime % 60);
    const timeText = new PIXI.Text(`Time: ${hours}:${mins.toString().padStart(2, '0')}`, { fontSize: 12, fill: 0xaaaaaa });
    timeText.x = APP_WIDTH - 100;
    timeText.y = 28;
    uiContainer.addChild(timeText);

    // Controls hint
    const controls = new PIXI.Text('WASD:Move  Click:Shoot  E:Use Item  I:Inventory  P:Power', { fontSize: 10, fill: 0x666666 });
    controls.x = 10;
    controls.y = APP_HEIGHT - 22;
    uiContainer.addChild(controls);

    // Keycard indicator
    if (player.hasItem('red_keycard')) {
        const keyText = new PIXI.Text('[RED KEYCARD]', { fontSize: 12, fill: 0xff4444 });
        keyText.x = APP_WIDTH - 120;
        keyText.y = APP_HEIGHT - 22;
        uiContainer.addChild(keyText);
    }
}

// Inventory overlay
function openInventory() {
    state = GameState.INVENTORY;
    overlayContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.8);
    bg.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
    bg.endFill();
    overlayContainer.addChild(bg);

    const title = new PIXI.Text('INVENTORY', { fontSize: 24, fill: 0xffffff });
    title.x = APP_WIDTH / 2 - 60;
    title.y = 50;
    overlayContainer.addChild(title);

    player.inventory.forEach((item, idx) => {
        const itemDef = ITEMS[item.id];
        const text = new PIXI.Text(`${idx + 1}. ${itemDef.name} x${item.count}`, {
            fontSize: 14,
            fill: itemDef.type === 'consumable' ? 0x44ff44 : 0xaaaaaa
        });
        text.x = 200;
        text.y = 120 + idx * 30;
        overlayContainer.addChild(text);

        if (itemDef.type === 'consumable') {
            const useBtn = new PIXI.Text('[E to Use]', { fontSize: 12, fill: 0x888888 });
            useBtn.x = 450;
            useBtn.y = 120 + idx * 30;
            overlayContainer.addChild(useBtn);
        }
    });

    const closeText = new PIXI.Text('Press I or ESC to close', { fontSize: 12, fill: 0x888888 });
    closeText.x = APP_WIDTH / 2 - 80;
    closeText.y = APP_HEIGHT - 50;
    overlayContainer.addChild(closeText);
}

// Power management overlay
function openPowerMenu() {
    state = GameState.CRAFTING; // Reusing state
    overlayContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.8);
    bg.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
    bg.endFill();
    overlayContainer.addChild(bg);

    const title = new PIXI.Text('POWER CONTROL', { fontSize: 24, fill: 0xffffff });
    title.x = APP_WIDTH / 2 - 80;
    title.y = 50;
    overlayContainer.addChild(title);

    // Calculate current power usage
    let usedPower = 0;
    for (const sector of poweredSectors) {
        usedPower += POWER_COSTS[sector];
    }

    const powerText = new PIXI.Text(`Power: ${usedPower}/${powerCapacity}`, {
        fontSize: 16,
        fill: usedPower <= powerCapacity ? 0x44ff44 : 0xff4444
    });
    powerText.x = APP_WIDTH / 2 - 60;
    powerText.y = 90;
    overlayContainer.addChild(powerText);

    const sectorNames = {
        [Sectors.HUB]: 'Central Hub',
        [Sectors.STORAGE]: 'Storage Wing',
        [Sectors.MEDICAL]: 'Medical Bay',
        [Sectors.RESEARCH]: 'Research Lab',
        [Sectors.ESCAPE]: 'Escape Pod'
    };

    let yPos = 140;
    for (const sectorId in POWER_COSTS) {
        const cost = POWER_COSTS[sectorId];
        const isPowered = poweredSectors.has(sectorId);
        const name = sectorNames[sectorId];

        const text = new PIXI.Text(
            `${name}: ${cost} units - ${isPowered ? 'ON' : 'OFF'}`,
            { fontSize: 14, fill: isPowered ? 0x44ff44 : 0xff4444 }
        );
        text.x = 200;
        text.y = yPos;
        overlayContainer.addChild(text);

        if (sectorId !== Sectors.HUB) {
            const toggleText = new PIXI.Text(`[${sectorId[0].toUpperCase()}]`, {
                fontSize: 14,
                fill: 0xaaaaaa
            });
            toggleText.x = 500;
            toggleText.y = yPos;
            overlayContainer.addChild(toggleText);
        }

        yPos += 35;
    }

    const closeText = new PIXI.Text('Press sector key to toggle, ESC to close', { fontSize: 12, fill: 0x888888 });
    closeText.x = APP_WIDTH / 2 - 130;
    closeText.y = APP_HEIGHT - 50;
    overlayContainer.addChild(closeText);
}

function toggleSectorPower(sectorId) {
    if (sectorId === Sectors.HUB) return; // Hub always on

    if (poweredSectors.has(sectorId)) {
        poweredSectors.delete(sectorId);
    } else {
        // Check if we have enough power
        let usedPower = 0;
        for (const sector of poweredSectors) {
            usedPower += POWER_COSTS[sector];
        }
        if (usedPower + POWER_COSTS[sectorId] <= powerCapacity) {
            poweredSectors.add(sectorId);
        }
    }

    // Refresh the map if we're in the affected sector
    if (sectorId === currentSector) {
        renderMap();
    }

    openPowerMenu(); // Refresh display
}

function closeOverlay() {
    overlayContainer.removeChildren();
    state = GameState.PLAYING;
}

// Game Over / Victory
function gameOver(reason) {
    state = GameState.GAME_OVER;
    overlayContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.9);
    bg.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
    bg.endFill();
    overlayContainer.addChild(bg);

    const messages = {
        health: 'You died. The facility claims another victim.',
        hunger: 'You starved to death.',
        infection: 'The infection has consumed you.',
        global: 'The facility is lost. No one escapes.'
    };

    const text = new PIXI.Text('GAME OVER', { fontSize: 48, fill: 0xff4444 });
    text.anchor.set(0.5);
    text.x = APP_WIDTH / 2;
    text.y = APP_HEIGHT / 2 - 80;
    overlayContainer.addChild(text);

    const reasonText = new PIXI.Text(messages[reason] || 'You died.', { fontSize: 16, fill: 0xaaaaaa });
    reasonText.anchor.set(0.5);
    reasonText.x = APP_WIDTH / 2;
    reasonText.y = APP_HEIGHT / 2;
    overlayContainer.addChild(reasonText);

    const restart = new PIXI.Text('Press SPACE to restart', { fontSize: 16, fill: 0x888888 });
    restart.anchor.set(0.5);
    restart.x = APP_WIDTH / 2;
    restart.y = APP_HEIGHT / 2 + 80;
    overlayContainer.addChild(restart);
}

function victory() {
    state = GameState.VICTORY;
    overlayContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.9);
    bg.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
    bg.endFill();
    overlayContainer.addChild(bg);

    const text = new PIXI.Text('YOU ESCAPED!', { fontSize: 48, fill: 0x44ff44 });
    text.anchor.set(0.5);
    text.x = APP_WIDTH / 2;
    text.y = APP_HEIGHT / 2 - 80;
    overlayContainer.addChild(text);

    const hours = Math.floor(gameTime / 60);
    const mins = Math.floor(gameTime % 60);
    const stats = new PIXI.Text(
        `Time: ${hours}:${mins.toString().padStart(2, '0')}\nGlobal Infection: ${globalInfection.toFixed(1)}%`,
        { fontSize: 16, fill: 0xaaaaaa }
    );
    stats.anchor.set(0.5);
    stats.x = APP_WIDTH / 2;
    stats.y = APP_HEIGHT / 2;
    overlayContainer.addChild(stats);

    const restart = new PIXI.Text('Press SPACE to play again', { fontSize: 16, fill: 0x888888 });
    restart.anchor.set(0.5);
    restart.x = APP_WIDTH / 2;
    restart.y = APP_HEIGHT / 2 + 80;
    overlayContainer.addChild(restart);
}

// Menu
function createMenu() {
    menuContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x0a0a0a);
    bg.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('ISOLATION PROTOCOL', { fontSize: 36, fill: 0xff4444, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = APP_WIDTH / 2;
    title.y = 100;
    menuContainer.addChild(title);

    const sub = new PIXI.Text('A Survival Horror Experience', { fontSize: 16, fill: 0x666666 });
    sub.anchor.set(0.5);
    sub.x = APP_WIDTH / 2;
    sub.y = 140;
    menuContainer.addChild(sub);

    const instructions = [
        "WASD - Move",
        "Mouse - Aim",
        "Click - Shoot",
        "E - Use Item / Interact",
        "I - Inventory",
        "P - Power Control",
        "",
        "Find the Red Keycard in Research Lab",
        "Power the Escape Pod sector",
        "Escape before infection reaches 100%!"
    ];

    instructions.forEach((line, idx) => {
        const text = new PIXI.Text(line, { fontSize: 14, fill: 0xaaaaaa });
        text.anchor.set(0.5);
        text.x = APP_WIDTH / 2;
        text.y = 220 + idx * 24;
        menuContainer.addChild(text);
    });

    const start = new PIXI.Text('Press SPACE to begin', { fontSize: 20, fill: 0x44ff44 });
    start.anchor.set(0.5);
    start.x = APP_WIDTH / 2;
    start.y = 520;
    menuContainer.addChild(start);
}

function startGame() {
    menuContainer.visible = false;
    overlayContainer.removeChildren();

    state = GameState.PLAYING;
    gameTime = 0;
    globalInfection = 0;
    sectorStates = {};
    poweredSectors = new Set([Sectors.HUB]);

    enemies = [];
    bullets = [];
    items = [];
    effects = [];

    player = new Player(7 * TILE_SIZE, 7 * TILE_SIZE);
    loadSector(Sectors.HUB);
    createUI();
}

// Main loop
let lastIState = false;
let lastPState = false;
let lastEState = false;

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

    // ESC to close overlays
    if (keys['escape']) {
        if (state !== GameState.PLAYING) {
            closeOverlay();
        }
    }

    // I for inventory
    if (keys['i'] && !lastIState) {
        if (state === GameState.PLAYING) {
            openInventory();
        } else if (state === GameState.INVENTORY) {
            closeOverlay();
        }
    }
    lastIState = keys['i'];

    // P for power
    if (keys['p'] && !lastPState) {
        if (state === GameState.PLAYING && currentSector === Sectors.HUB) {
            openPowerMenu();
        } else if (state === GameState.CRAFTING) {
            closeOverlay();
        }
    }
    lastPState = keys['p'];

    // Power toggles in power menu
    if (state === GameState.CRAFTING) {
        if (keys['s']) toggleSectorPower(Sectors.STORAGE);
        if (keys['m']) toggleSectorPower(Sectors.MEDICAL);
        if (keys['r']) toggleSectorPower(Sectors.RESEARCH);
        if (keys['e']) toggleSectorPower(Sectors.ESCAPE);
    }

    // E to use consumable
    if (keys['e'] && !lastEState && state === GameState.PLAYING) {
        const consumables = player.inventory.filter(i => ITEMS[i.id].type === 'consumable');
        if (consumables.length > 0) {
            player.useItem(consumables[0].id);
        }
    }
    lastEState = keys['e'];

    // Number keys for quick use
    if (state === GameState.PLAYING) {
        for (let i = 1; i <= 9; i++) {
            if (keys[i.toString()]) {
                const idx = i - 1;
                if (player.inventory[idx]) {
                    player.useItem(player.inventory[idx].id);
                }
            }
        }
    }

    if (state === GameState.PLAYING) {
        player.update(delta);

        for (const enemy of enemies) {
            enemy.update(delta);
        }

        // Update bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (bullets[i].update(delta)) {
                entityContainer.removeChild(bullets[i].sprite);
                bullets.splice(i, 1);
            }
        }

        // Check item pickups
        for (const item of items) {
            item.checkPickup();
        }

        updateEffects(delta);
        updateSurvival(delta);
        updateCamera();
        updateUI();
    }

    mouse.clicked = false;
});

// Initialize
createMenu();
