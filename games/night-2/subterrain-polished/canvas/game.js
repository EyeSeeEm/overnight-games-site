// ISOLATION PROTOCOL - POLISHED VERSION
// Survival Horror with enhanced visuals
// 5 meters, crafting, power management, multiple sectors

const WIDTH = 1024;
const HEIGHT = 768;
const TILE_SIZE = 32;

// Canvas setup
const container = document.getElementById('game-container');
const canvas = document.getElementById('gameCanvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
const ctx = canvas.getContext('2d');

// Particles system
let particles = [];

class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1;

        switch(type) {
            case 'blood':
                this.vx = (Math.random() - 0.5) * 6;
                this.vy = (Math.random() - 0.5) * 6;
                this.size = 2 + Math.random() * 4;
                this.decay = 0.02;
                this.color = `hsl(0, 70%, ${30 + Math.random() * 30}%)`;
                break;
            case 'spark':
                this.vx = (Math.random() - 0.5) * 8;
                this.vy = (Math.random() - 0.5) * 8;
                this.size = 1 + Math.random() * 2;
                this.decay = 0.05;
                this.color = '#ffcc00';
                break;
            case 'heal':
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = -2 - Math.random();
                this.size = 3 + Math.random() * 3;
                this.decay = 0.03;
                this.color = '#44ff44';
                break;
            case 'infection':
                this.vx = (Math.random() - 0.5) * 3;
                this.vy = (Math.random() - 0.5) * 3;
                this.size = 2 + Math.random() * 3;
                this.decay = 0.02;
                this.color = '#44ff44';
                break;
            case 'pickup':
                this.vx = (Math.random() - 0.5) * 3;
                this.vy = -1 - Math.random();
                this.size = 2 + Math.random() * 2;
                this.decay = 0.04;
                this.color = '#ffaa00';
                break;
            case 'damage':
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = -2 - Math.random();
                this.size = 10;
                this.decay = 0.05;
                this.text = '-' + Math.floor(Math.random() * 20 + 5);
                this.color = '#ff4444';
                break;
            case 'power':
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = -1;
                this.size = 3;
                this.decay = 0.02;
                this.color = '#ffff00';
                break;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life -= this.decay;
        return this.life > 0;
    }

    draw(ctx, camX, camY) {
        const screenX = this.x - camX;
        const screenY = this.y - camY;

        ctx.save();
        ctx.globalAlpha = this.life;

        if (this.text) {
            ctx.fillStyle = this.color;
            ctx.font = 'bold 14px Share Tech Mono';
            ctx.textAlign = 'center';
            ctx.fillText(this.text, screenX, screenY);
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY, this.size * this.life, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

function spawnParticles(x, y, type, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, type));
    }
}

// Screen shake
let screenShake = { x: 0, y: 0, intensity: 0 };

function addScreenShake(intensity) {
    screenShake.intensity = Math.max(screenShake.intensity, intensity);
}

function updateScreenShake() {
    if (screenShake.intensity > 0) {
        screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
        screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
        screenShake.intensity *= 0.85;
        if (screenShake.intensity < 0.5) screenShake.intensity = 0;
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
    }
}

// Game state
const gameState = {
    screen: 'menu',
    paused: false,
    gameTime: 0,
    globalInfection: 0,
    health: 100,
    hunger: 0,
    thirst: 0,
    fatigue: 0,
    infection: 0,
    stamina: 100,
    dodgeCooldown: 0,
    attackCooldown: 0,
    inventory: [],
    maxInventory: 20,
    selectedItem: -1,
    quickSlots: [null, null, null],
    weapon: null,
    armor: null,
    power: 500,
    maxPower: 500,
    poweredSectors: { hub: true, storage: false, medical: false, research: false, escape: false },
    sectorPowerCost: { hub: 0, storage: 100, medical: 150, research: 200, escape: 300 },
    hasKeycard: false,
    hasDataChip: false,
    tier2Unlocked: false,
    currentSector: 'hub',
    player: { x: 7 * TILE_SIZE, y: 7 * TILE_SIZE, angle: 0, speed: 3 },
    enemies: [],
    containers: [],
    projectiles: [],
    sectors: {},
    message: '',
    messageTimer: 0
};

// Input tracking
const mouse = { x: 0, y: 0, clicked: false, justClicked: false };
const keys = {};
window.mouse = mouse;
window.gameState = gameState;
window.keys = keys;

// Animation variables
let ticks = 0;
let ambientPulse = 0;

// Items database
const ITEMS = {
    cannedFood: { name: 'Canned Food', type: 'consumable', stack: 5, effect: { hunger: -30 } },
    waterBottle: { name: 'Water Bottle', type: 'consumable', stack: 5, effect: { thirst: -40 } },
    mre: { name: 'MRE Pack', type: 'consumable', stack: 3, effect: { hunger: -50, thirst: -20 } },
    coffee: { name: 'Coffee', type: 'consumable', stack: 5, effect: { fatigue: -20 } },
    medkit: { name: 'Medkit', type: 'consumable', stack: 3, effect: { health: 30 } },
    antidote: { name: 'Antidote', type: 'consumable', stack: 3, effect: { infection: -30 } },
    bandage: { name: 'Bandage', type: 'consumable', stack: 5, effect: {} },
    scrapMetal: { name: 'Scrap Metal', type: 'material', stack: 10 },
    cloth: { name: 'Cloth', type: 'material', stack: 10 },
    chemicals: { name: 'Chemicals', type: 'material', stack: 10 },
    electronics: { name: 'Electronics', type: 'material', stack: 10 },
    powerCell: { name: 'Power Cell', type: 'material', stack: 5 },
    shiv: { name: 'Shiv', type: 'weapon', damage: 10, speed: 0.4, durability: 20 },
    pipeClub: { name: 'Pipe Club', type: 'weapon', damage: 20, speed: 1.0, durability: 30 },
    stunBaton: { name: 'Stun Baton', type: 'weapon', damage: 15, speed: 0.7, durability: 25, stun: 2 },
    pistol: { name: 'Pistol', type: 'ranged', damage: 15, speed: 0.5, magazine: 12, accuracy: 0.85 },
    pistolAmmo: { name: 'Pistol Ammo', type: 'ammo', stack: 30 },
    armorVest: { name: 'Armor Vest', type: 'armor', reduction: 0.25 },
    redKeycard: { name: 'Red Keycard', type: 'key', quest: true },
    dataChip: { name: 'Data Chip', type: 'key', quest: true }
};

// Crafting recipes
const RECIPES = {
    tier1: [
        { id: 'shiv', name: 'Shiv', materials: { scrapMetal: 2 }, time: 10 },
        { id: 'pipeClub', name: 'Pipe Club', materials: { scrapMetal: 3 }, time: 15 },
        { id: 'bandage', name: 'Bandage', materials: { cloth: 2 }, time: 5 }
    ],
    tier2: [
        { id: 'pistol', name: 'Pistol', materials: { scrapMetal: 5, electronics: 2 }, time: 30 },
        { id: 'pistolAmmo', name: 'Pistol Ammo x10', materials: { scrapMetal: 2, chemicals: 1 }, time: 10 },
        { id: 'antidote', name: 'Antidote', materials: { chemicals: 3 }, time: 15 },
        { id: 'stunBaton', name: 'Stun Baton', materials: { scrapMetal: 3, electronics: 2, powerCell: 1 }, time: 25 },
        { id: 'armorVest', name: 'Armor Vest', materials: { scrapMetal: 4, cloth: 3 }, time: 30 }
    ]
};

// Enemy types
const ENEMY_TYPES = {
    shambler: { hp: 30, damage: 10, speed: 0.5, attackRate: 1.5, infection: 5, color: '#556b2f', glowColor: 'rgba(85, 107, 47, 0.5)' },
    crawler: { hp: 20, damage: 8, speed: 1.2, attackRate: 1.0, infection: 5, color: '#8b4513', glowColor: 'rgba(139, 69, 19, 0.5)' },
    spitter: { hp: 25, damage: 15, speed: 0.4, attackRate: 2.5, infection: 10, color: '#9932cc', glowColor: 'rgba(153, 50, 204, 0.6)', ranged: true },
    brute: { hp: 80, damage: 25, speed: 0.3, attackRate: 2.0, infection: 8, color: '#8b0000', glowColor: 'rgba(139, 0, 0, 0.6)', size: 2 },
    cocoon: { hp: 50, damage: 0, speed: 0, attackRate: 0, infection: 0, color: '#2e8b57', glowColor: 'rgba(46, 139, 87, 0.4)', stationary: true }
};

// Generate sector maps
function generateSectors() {
    gameState.sectors.hub = {
        width: 15, height: 15, tiles: [],
        enemies: [],
        containers: [
            { x: 2, y: 2, type: 'locker', items: ['cannedFood', 'waterBottle'], looted: false },
            { x: 12, y: 2, type: 'locker', items: ['scrapMetal', 'cloth'], looted: false }
        ],
        facilities: [
            { x: 7, y: 3, type: 'workbench' },
            { x: 3, y: 7, type: 'bed' },
            { x: 11, y: 7, type: 'storage' },
            { x: 7, y: 11, type: 'powerPanel' }
        ],
        exits: [
            { x: 7, y: 0, to: 'escape', label: 'Escape Pod (N)' },
            { x: 0, y: 7, to: 'research', label: 'Research Lab (W)' },
            { x: 14, y: 7, to: 'medical', label: 'Medical Bay (E)' },
            { x: 7, y: 14, to: 'storage', label: 'Storage Wing (S)' }
        ]
    };
    generateSectorTiles('hub', 15, 15);

    gameState.sectors.storage = {
        width: 20, height: 20, tiles: [],
        enemies: [
            { type: 'shambler', x: 5, y: 5 },
            { type: 'shambler', x: 15, y: 5 },
            { type: 'shambler', x: 10, y: 10 },
            { type: 'crawler', x: 5, y: 15 }
        ],
        containers: [
            { x: 3, y: 3, type: 'crate', items: ['cannedFood', 'cannedFood'], looted: false },
            { x: 16, y: 3, type: 'crate', items: ['waterBottle', 'waterBottle'], looted: false },
            { x: 3, y: 16, type: 'crate', items: ['scrapMetal', 'scrapMetal', 'cloth'], looted: false },
            { x: 16, y: 16, type: 'crate', items: ['cannedFood', 'scrapMetal'], looted: false },
            { x: 10, y: 3, type: 'locker', items: ['coffee', 'cloth'], looted: false },
            { x: 10, y: 16, type: 'locker', items: ['mre', 'scrapMetal'], looted: false }
        ],
        facilities: [{ x: 10, y: 10, type: 'workbench' }],
        exits: [{ x: 10, y: 0, to: 'hub', label: 'Hub (N)' }]
    };
    generateSectorTiles('storage', 20, 20);

    gameState.sectors.medical = {
        width: 20, height: 20, tiles: [],
        enemies: [
            { type: 'shambler', x: 5, y: 10 },
            { type: 'shambler', x: 15, y: 10 },
            { type: 'spitter', x: 10, y: 5 },
            { type: 'spitter', x: 10, y: 15 }
        ],
        containers: [
            { x: 3, y: 3, type: 'cabinet', items: ['medkit', 'bandage'], looted: false },
            { x: 16, y: 3, type: 'cabinet', items: ['antidote', 'chemicals'], looted: false },
            { x: 3, y: 16, type: 'cabinet', items: ['medkit', 'chemicals'], looted: false },
            { x: 16, y: 16, type: 'cabinet', items: ['bandage', 'chemicals', 'chemicals'], looted: false }
        ],
        facilities: [{ x: 10, y: 10, type: 'medicalStation' }],
        exits: [{ x: 0, y: 10, to: 'hub', label: 'Hub (W)' }]
    };
    generateSectorTiles('medical', 20, 20);

    gameState.sectors.research = {
        width: 25, height: 25, tiles: [],
        enemies: [
            { type: 'crawler', x: 5, y: 5 },
            { type: 'crawler', x: 20, y: 5 },
            { type: 'crawler', x: 12, y: 12 },
            { type: 'spitter', x: 5, y: 20 },
            { type: 'spitter', x: 20, y: 20 },
            { type: 'brute', x: 12, y: 20 }
        ],
        containers: [
            { x: 3, y: 3, type: 'locker', items: ['electronics', 'electronics'], looted: false },
            { x: 21, y: 3, type: 'locker', items: ['powerCell', 'scrapMetal'], looted: false },
            { x: 3, y: 21, type: 'locker', items: ['electronics', 'dataChip'], looted: false },
            { x: 21, y: 21, type: 'locker', items: ['redKeycard', 'electronics'], looted: false },
            { x: 12, y: 5, type: 'crate', items: ['chemicals', 'scrapMetal'], looted: false }
        ],
        facilities: [{ x: 12, y: 12, type: 'researchTerminal' }],
        exits: [{ x: 24, y: 12, to: 'hub', label: 'Hub (E)' }]
    };
    generateSectorTiles('research', 25, 25);

    gameState.sectors.escape = {
        width: 15, height: 15, tiles: [],
        enemies: [
            { type: 'shambler', x: 3, y: 7 },
            { type: 'shambler', x: 11, y: 7 },
            { type: 'crawler', x: 7, y: 3 },
            { type: 'brute', x: 7, y: 11 },
            { type: 'spitter', x: 5, y: 5 }
        ],
        containers: [],
        facilities: [{ x: 7, y: 7, type: 'escapePod' }],
        exits: [{ x: 7, y: 14, to: 'hub', label: 'Hub (S)' }]
    };
    generateSectorTiles('escape', 15, 15);
}

function generateSectorTiles(sectorName, w, h) {
    const sector = gameState.sectors[sectorName];
    for (let y = 0; y < h; y++) {
        sector.tiles[y] = [];
        for (let x = 0; x < w; x++) {
            let isExit = sector.exits.some(e => e.x === x && e.y === y);
            sector.tiles[y][x] = (x === 0 || x === w-1 || y === 0 || y === h-1) && !isExit ? 1 : 0;
        }
    }
    for (let i = 0; i < Math.floor(w * h / 50); i++) {
        const wx = 3 + Math.floor(Math.random() * (w - 6));
        const wy = 3 + Math.floor(Math.random() * (h - 6));
        sector.tiles[wy][wx] = 1;
    }
}

function initGame() {
    generateSectors();

    gameState.inventory = [];
    addItem('cannedFood', 2);
    addItem('waterBottle', 2);
    addItem('shiv', 1);
    gameState.weapon = { id: 'shiv', durability: 20 };

    gameState.player = { x: 7 * TILE_SIZE, y: 7 * TILE_SIZE, angle: 0, speed: 3 };
    gameState.currentSector = 'hub';
    spawnEnemiesForSector();

    gameState.health = 100;
    gameState.hunger = 0;
    gameState.thirst = 0;
    gameState.fatigue = 0;
    gameState.infection = 0;
    gameState.globalInfection = 0;
    gameState.gameTime = 0;
    gameState.hasKeycard = false;
    gameState.hasDataChip = false;
    gameState.tier2Unlocked = false;
    gameState.poweredSectors = { hub: true, storage: false, medical: false, research: false, escape: false };
    gameState.projectiles = [];
    particles = [];

    gameState.screen = 'game';
}

function spawnEnemiesForSector() {
    const sector = gameState.sectors[gameState.currentSector];
    gameState.enemies = [];

    if (sector.enemies) {
        for (const e of sector.enemies) {
            const type = ENEMY_TYPES[e.type];
            gameState.enemies.push({
                type: e.type,
                x: e.x * TILE_SIZE,
                y: e.y * TILE_SIZE,
                hp: type.hp,
                maxHp: type.hp,
                attackTimer: 0,
                state: 'idle',
                stunTimer: 0,
                pulseOffset: Math.random() * Math.PI * 2
            });
        }
    }

    gameState.containers = sector.containers ? [...sector.containers.map(c => ({...c, pulseOffset: Math.random() * Math.PI * 2}))] : [];
}

// Inventory functions
function addItem(itemId, count = 1) {
    const item = ITEMS[itemId];
    if (!item) return false;

    for (let i = 0; i < gameState.inventory.length; i++) {
        const slot = gameState.inventory[i];
        if (slot && slot.id === itemId && item.stack && slot.count < item.stack) {
            const canAdd = Math.min(count, item.stack - slot.count);
            slot.count += canAdd;
            count -= canAdd;
            if (count <= 0) return true;
        }
    }

    while (count > 0 && gameState.inventory.length < gameState.maxInventory) {
        const add = item.stack ? Math.min(count, item.stack) : 1;
        gameState.inventory.push({ id: itemId, count: add, durability: item.durability });
        count -= add;
    }

    return count <= 0;
}

function removeItem(itemId, count = 1) {
    for (let i = gameState.inventory.length - 1; i >= 0; i--) {
        const slot = gameState.inventory[i];
        if (slot && slot.id === itemId) {
            const remove = Math.min(count, slot.count);
            slot.count -= remove;
            count -= remove;
            if (slot.count <= 0) gameState.inventory.splice(i, 1);
            if (count <= 0) return true;
        }
    }
    return count <= 0;
}

function countItem(itemId) {
    let total = 0;
    for (const slot of gameState.inventory) {
        if (slot && slot.id === itemId) total += slot.count;
    }
    return total;
}

function useItem(slot) {
    const invItem = gameState.inventory[slot];
    if (!invItem) return;

    const item = ITEMS[invItem.id];
    if (!item) return;

    if (item.type === 'consumable' && item.effect) {
        if (item.effect.health) {
            gameState.health = Math.min(100, gameState.health + item.effect.health);
            spawnParticles(gameState.player.x, gameState.player.y, 'heal', 15);
        }
        if (item.effect.hunger) gameState.hunger = Math.max(0, gameState.hunger + item.effect.hunger);
        if (item.effect.thirst) gameState.thirst = Math.max(0, gameState.thirst + item.effect.thirst);
        if (item.effect.fatigue) gameState.fatigue = Math.max(0, gameState.fatigue + item.effect.fatigue);
        if (item.effect.infection) {
            gameState.infection = Math.max(0, gameState.infection + item.effect.infection);
            spawnParticles(gameState.player.x, gameState.player.y, 'heal', 10);
        }

        invItem.count--;
        if (invItem.count <= 0) gameState.inventory.splice(slot, 1);
    } else if (item.type === 'weapon' || item.type === 'ranged') {
        gameState.weapon = { id: invItem.id, durability: invItem.durability || item.durability };
    } else if (item.type === 'armor') {
        gameState.armor = invItem.id;
    } else if (item.type === 'key') {
        if (invItem.id === 'redKeycard') gameState.hasKeycard = true;
        if (invItem.id === 'dataChip') gameState.hasDataChip = true;
    }
}

// Game update
let lastTime = Date.now();

function update() {
    const now = Date.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    ticks++;
    ambientPulse = Math.sin(ticks * 0.02) * 0.5 + 0.5;

    // Update particles
    particles = particles.filter(p => p.update());

    // Update screen shake
    updateScreenShake();

    if (gameState.screen === 'game' && !gameState.paused) {
        updateGame(dt);
    }

    render();
    mouse.justClicked = false;
    requestAnimationFrame(update);
}

function updateGame(dt) {
    gameState.gameTime += dt;
    gameState.globalInfection += 0.1 * dt;

    if (gameState.globalInfection >= 100) {
        gameState.screen = 'gameover';
        gameState.deathReason = 'Global infection reached 100%';
        return;
    }

    gameState.hunger += 0.1 * dt;
    gameState.thirst += 0.2 * dt;
    gameState.fatigue += 0.067 * dt;

    if (!gameState.poweredSectors[gameState.currentSector]) {
        gameState.infection += 0.5 * dt;
        if (Math.random() < 0.02) {
            spawnParticles(gameState.player.x + (Math.random() - 0.5) * 50,
                          gameState.player.y + (Math.random() - 0.5) * 50, 'infection', 1);
        }
    }

    if (gameState.hunger >= 75 || gameState.thirst >= 75) gameState.health -= 1 * dt;
    if (gameState.hunger >= 100 || gameState.thirst >= 100) gameState.health -= 5 * dt;
    if (gameState.infection >= 75) gameState.health -= 2 * dt;

    if (gameState.infection >= 100 || gameState.health <= 0) {
        gameState.screen = 'gameover';
        gameState.deathReason = gameState.infection >= 100 ? 'Infection consumed you' : 'You died';
        return;
    }

    gameState.hunger = Math.min(100, gameState.hunger);
    gameState.thirst = Math.min(100, gameState.thirst);
    gameState.fatigue = Math.min(100, gameState.fatigue);
    gameState.infection = Math.min(100, gameState.infection);
    gameState.stamina = Math.min(100, gameState.stamina + 5 * dt);

    if (gameState.attackCooldown > 0) gameState.attackCooldown -= dt;
    if (gameState.dodgeCooldown > 0) gameState.dodgeCooldown -= dt;
    if (gameState.messageTimer > 0) gameState.messageTimer -= dt;

    // Player movement
    const sector = gameState.sectors[gameState.currentSector];
    let speed = gameState.player.speed;
    if (gameState.hunger >= 75) speed *= 0.75;
    if (gameState.hunger >= 50) speed *= 0.9;

    let dx = 0, dy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
    if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
    if (keys['KeyD'] || keys['ArrowRight']) dx = 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        dx = (dx / len) * speed;
        dy = (dy / len) * speed;

        const newX = gameState.player.x + dx;
        const newY = gameState.player.y + dy;

        const tileX = Math.floor(newX / TILE_SIZE);
        const tileY = Math.floor(newY / TILE_SIZE);

        if (tileX >= 0 && tileX < sector.width && tileY >= 0 && tileY < sector.height) {
            if (!sector.tiles[tileY] || sector.tiles[tileY][tileX] !== 1) {
                gameState.player.x = newX;
                gameState.player.y = newY;
            }
        }
    }

    // Player angle toward mouse
    const worldMouseX = mouse.x - WIDTH/2 + gameState.player.x;
    const worldMouseY = mouse.y - HEIGHT/2 + gameState.player.y;
    gameState.player.angle = Math.atan2(worldMouseY - gameState.player.y, worldMouseX - gameState.player.x);

    // Check sector exits
    for (const exit of sector.exits) {
        const ex = exit.x * TILE_SIZE + TILE_SIZE/2;
        const ey = exit.y * TILE_SIZE + TILE_SIZE/2;
        const dist = Math.hypot(gameState.player.x - ex, gameState.player.y - ey);
        if (dist < TILE_SIZE) {
            changeSector(exit.to);
            break;
        }
    }

    // Check interactions
    if (keys['KeyE'] && !keys['KeyE_used']) {
        keys['KeyE_used'] = true;
        checkFacilityInteraction();
        checkContainerInteraction();
    }

    // Attack
    if (mouse.justClicked && gameState.attackCooldown <= 0) {
        performAttack();
    }

    updateEnemies(dt);
    updateProjectiles(dt);
}

function changeSector(toSector) {
    if (toSector === 'escape' && !gameState.hasKeycard) {
        gameState.message = 'Need Red Keycard';
        gameState.messageTimer = 2;
        return;
    }

    if (!gameState.poweredSectors[toSector] && toSector !== 'hub') {
        gameState.message = 'Sector unpowered - danger!';
        gameState.messageTimer = 2;
    }

    gameState.currentSector = toSector;
    const sector = gameState.sectors[toSector];

    let entryX = sector.width / 2;
    let entryY = sector.height / 2;
    for (const exit of sector.exits) {
        entryX = exit.x;
        entryY = exit.y;
        if (exit.y === 0) entryY = 2;
        if (exit.y === sector.height - 1) entryY = sector.height - 3;
        if (exit.x === 0) entryX = 2;
        if (exit.x === sector.width - 1) entryX = sector.width - 3;
        break;
    }

    gameState.player.x = entryX * TILE_SIZE;
    gameState.player.y = entryY * TILE_SIZE;
    spawnEnemiesForSector();
    gameState.gameTime += 30;
}

function checkFacilityInteraction() {
    const sector = gameState.sectors[gameState.currentSector];
    const playerTileX = Math.floor(gameState.player.x / TILE_SIZE);
    const playerTileY = Math.floor(gameState.player.y / TILE_SIZE);

    for (const facility of (sector.facilities || [])) {
        const dist = Math.abs(facility.x - playerTileX) + Math.abs(facility.y - playerTileY);
        if (dist <= 2) {
            switch (facility.type) {
                case 'workbench': gameState.screen = 'crafting'; break;
                case 'bed': gameState.screen = 'sleep'; break;
                case 'storage': gameState.screen = 'storage'; break;
                case 'powerPanel': gameState.screen = 'power'; break;
                case 'medicalStation':
                    if (gameState.poweredSectors.medical) gameState.screen = 'medical';
                    else { gameState.message = 'Needs power'; gameState.messageTimer = 2; }
                    break;
                case 'researchTerminal':
                    if (gameState.poweredSectors.research) {
                        if (gameState.hasDataChip && !gameState.tier2Unlocked) {
                            gameState.tier2Unlocked = true;
                            gameState.message = 'Tier 2 recipes unlocked!';
                            gameState.messageTimer = 3;
                            spawnParticles(gameState.player.x, gameState.player.y, 'spark', 20);
                        } else if (gameState.tier2Unlocked) {
                            gameState.message = 'Already researched';
                            gameState.messageTimer = 2;
                        } else {
                            gameState.message = 'Need Data Chip';
                            gameState.messageTimer = 2;
                        }
                    } else { gameState.message = 'Needs power'; gameState.messageTimer = 2; }
                    break;
                case 'escapePod':
                    if (gameState.poweredSectors.escape && gameState.hasKeycard) {
                        gameState.screen = 'victory';
                    } else if (!gameState.hasKeycard) {
                        gameState.message = 'Need Red Keycard';
                        gameState.messageTimer = 2;
                    } else {
                        gameState.message = 'Needs power';
                        gameState.messageTimer = 2;
                    }
                    break;
            }
            break;
        }
    }
}

function checkContainerInteraction() {
    for (const container of gameState.containers) {
        if (container.looted) continue;

        const cx = container.x * TILE_SIZE + TILE_SIZE/2;
        const cy = container.y * TILE_SIZE + TILE_SIZE/2;
        const dist = Math.hypot(gameState.player.x - cx, gameState.player.y - cy);

        if (dist < TILE_SIZE * 1.5) {
            container.looted = true;
            for (const itemId of container.items) addItem(itemId, 1);
            gameState.message = `Found: ${container.items.map(id => ITEMS[id]?.name || id).join(', ')}`;
            gameState.messageTimer = 3;
            gameState.gameTime += 5;
            spawnParticles(cx, cy, 'pickup', 15);
            break;
        }
    }
}

function performAttack() {
    if (!gameState.weapon) {
        gameState.attackCooldown = 0.5;
        attackMelee(5);
        return;
    }

    const weapon = ITEMS[gameState.weapon.id];
    if (!weapon) return;

    if (weapon.type === 'weapon') {
        gameState.attackCooldown = weapon.speed;
        attackMelee(weapon.damage);
        gameState.weapon.durability--;
        addScreenShake(3);
        spawnParticles(gameState.player.x + Math.cos(gameState.player.angle) * 20,
                      gameState.player.y + Math.sin(gameState.player.angle) * 20, 'spark', 5);
        if (gameState.weapon.durability <= 0) {
            gameState.weapon = null;
            gameState.message = 'Weapon broke!';
            gameState.messageTimer = 2;
        }
    } else if (weapon.type === 'ranged') {
        if (countItem('pistolAmmo') > 0) {
            removeItem('pistolAmmo', 1);
            gameState.attackCooldown = weapon.speed;
            attackRanged(weapon.damage, weapon.accuracy);
            addScreenShake(4);
            spawnParticles(gameState.player.x + Math.cos(gameState.player.angle) * 25,
                          gameState.player.y + Math.sin(gameState.player.angle) * 25, 'spark', 8);
        } else {
            gameState.message = 'No ammo!';
            gameState.messageTimer = 2;
        }
    }
}

function attackMelee(damage) {
    if (gameState.stamina < 10) return;
    gameState.stamina -= 10;

    if (gameState.fatigue >= 75) damage *= 0.6;
    else if (gameState.fatigue >= 50) damage *= 0.8;

    const range = TILE_SIZE * 1.5;
    for (const enemy of gameState.enemies) {
        const dx = enemy.x - gameState.player.x;
        const dy = enemy.y - gameState.player.y;
        const dist = Math.hypot(dx, dy);

        if (dist < range) {
            const angleToEnemy = Math.atan2(dy, dx);
            let angleDiff = Math.abs(angleToEnemy - gameState.player.angle);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

            if (angleDiff < Math.PI / 3) {
                enemy.hp -= damage;
                spawnParticles(enemy.x, enemy.y, 'blood', 10);
                addScreenShake(5);
                if (gameState.weapon && ITEMS[gameState.weapon.id]?.stun) {
                    enemy.stunTimer = ITEMS[gameState.weapon.id].stun;
                }
            }
        }
    }

    gameState.enemies = gameState.enemies.filter(e => e.hp > 0);
}

function attackRanged(damage, accuracy) {
    if (gameState.thirst >= 75) accuracy *= 0.6;
    else if (gameState.thirst >= 50) accuracy *= 0.8;

    gameState.projectiles.push({
        x: gameState.player.x,
        y: gameState.player.y,
        vx: Math.cos(gameState.player.angle) * 12,
        vy: Math.sin(gameState.player.angle) * 12,
        damage: damage,
        accuracy: accuracy,
        friendly: true
    });
}

function updateProjectiles(dt) {
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const proj = gameState.projectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy;

        const sector = gameState.sectors[gameState.currentSector];
        if (proj.x < 0 || proj.x >= sector.width * TILE_SIZE ||
            proj.y < 0 || proj.y >= sector.height * TILE_SIZE) {
            gameState.projectiles.splice(i, 1);
            continue;
        }

        const tileX = Math.floor(proj.x / TILE_SIZE);
        const tileY = Math.floor(proj.y / TILE_SIZE);
        if (sector.tiles[tileY]?.[tileX] === 1) {
            spawnParticles(proj.x, proj.y, 'spark', 5);
            gameState.projectiles.splice(i, 1);
            continue;
        }

        if (proj.friendly) {
            for (const enemy of gameState.enemies) {
                const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
                if (dist < TILE_SIZE) {
                    if (Math.random() < proj.accuracy) {
                        enemy.hp -= proj.damage;
                        spawnParticles(enemy.x, enemy.y, 'blood', 12);
                        addScreenShake(4);
                    }
                    gameState.projectiles.splice(i, 1);
                    break;
                }
            }
        } else {
            const dist = Math.hypot(proj.x - gameState.player.x, proj.y - gameState.player.y);
            if (dist < TILE_SIZE / 2) {
                let damage = proj.damage;
                if (gameState.armor && ITEMS[gameState.armor]?.reduction) {
                    damage *= (1 - ITEMS[gameState.armor].reduction);
                }
                gameState.health -= damage;
                gameState.infection += proj.infection || 0;
                addScreenShake(8);
                spawnParticles(gameState.player.x, gameState.player.y, 'blood', 8);
                gameState.projectiles.splice(i, 1);
            }
        }
    }

    gameState.enemies = gameState.enemies.filter(e => e.hp > 0);
}

function updateEnemies(dt) {
    const scaleFactor = 1 + (gameState.globalInfection / 100);

    for (const enemy of gameState.enemies) {
        const type = ENEMY_TYPES[enemy.type];

        if (enemy.stunTimer > 0) {
            enemy.stunTimer -= dt;
            continue;
        }

        if (type.stationary) continue;

        const dx = gameState.player.x - enemy.x;
        const dy = gameState.player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        const detectionRange = type.ranged ? 10 * TILE_SIZE : 8 * TILE_SIZE;

        if (dist < detectionRange) {
            enemy.state = 'chase';
            const speed = type.speed * gameState.player.speed * dt * 60;

            if (type.ranged) {
                if (dist < 4 * TILE_SIZE) {
                    enemy.x -= (dx / dist) * speed;
                    enemy.y -= (dy / dist) * speed;
                } else if (dist > 6 * TILE_SIZE) {
                    enemy.x += (dx / dist) * speed;
                    enemy.y += (dy / dist) * speed;
                }
            } else {
                enemy.x += (dx / dist) * speed;
                enemy.y += (dy / dist) * speed;
            }

            enemy.attackTimer -= dt;
            if (enemy.attackTimer <= 0) {
                if (type.ranged && dist < 10 * TILE_SIZE) {
                    const angle = Math.atan2(dy, dx);
                    gameState.projectiles.push({
                        x: enemy.x, y: enemy.y,
                        vx: Math.cos(angle) * 6, vy: Math.sin(angle) * 6,
                        damage: type.damage * scaleFactor,
                        accuracy: 0.8,
                        infection: type.infection,
                        friendly: false
                    });
                    enemy.attackTimer = type.attackRate;
                } else if (dist < TILE_SIZE * 1.2) {
                    let damage = type.damage * scaleFactor;
                    if (gameState.armor && ITEMS[gameState.armor]?.reduction) {
                        damage *= (1 - ITEMS[gameState.armor].reduction);
                    }
                    gameState.health -= damage;
                    gameState.infection += type.infection;
                    enemy.attackTimer = type.attackRate;
                    addScreenShake(8);
                    spawnParticles(gameState.player.x, gameState.player.y, 'blood', 8);
                }
            }
        } else {
            enemy.state = 'idle';
        }
    }
}

// Rendering
function render() {
    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);

    // Background
    const bgGrad = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, 0, WIDTH/2, HEIGHT/2, WIDTH);
    bgGrad.addColorStop(0, '#0a0a12');
    bgGrad.addColorStop(1, '#050508');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-20, -20, WIDTH + 40, HEIGHT + 40);

    switch (gameState.screen) {
        case 'menu': renderMenu(); break;
        case 'game': renderGame(); renderHUD(); break;
        case 'crafting': renderGame(); renderCrafting(); break;
        case 'power': renderGame(); renderPower(); break;
        case 'sleep': renderGame(); renderSleep(); break;
        case 'storage': renderGame(); renderStorage(); break;
        case 'medical': renderGame(); renderMedical(); break;
        case 'inventory': renderGame(); renderInventory(); break;
        case 'gameover': renderGameOver(); break;
        case 'victory': renderVictory(); break;
    }

    ctx.restore();
}

function renderMenu() {
    // Animated background
    ctx.fillStyle = '#080812';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Grid effect
    ctx.strokeStyle = '#151525';
    ctx.lineWidth = 1;
    for (let x = 0; x < WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < HEIGHT; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);
        ctx.stroke();
    }

    // Title with glow
    ctx.save();
    ctx.shadowColor = '#ff3333';
    ctx.shadowBlur = 30 + ambientPulse * 20;
    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 56px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ISOLATION PROTOCOL', WIDTH/2, 200);
    ctx.restore();

    ctx.fillStyle = '#666666';
    ctx.font = '22px Share Tech Mono, monospace';
    ctx.fillText('A Survival Horror Experience', WIDTH/2, 260);

    const btnX = WIDTH/2 - 120, btnY = 350, btnW = 240, btnH = 60;
    const hover = mouse.x >= btnX && mouse.x <= btnX + btnW && mouse.y >= btnY && mouse.y <= btnY + btnH;

    ctx.save();
    if (hover) ctx.shadowColor = '#ff3333';
    if (hover) ctx.shadowBlur = 15;
    ctx.fillStyle = hover ? '#442222' : '#221111';
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(btnX, btnY, btnW, btnH);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ff3333';
    ctx.font = '28px Orbitron, sans-serif';
    ctx.fillText('NEW GAME', WIDTH/2, btnY + 40);

    if (hover && mouse.justClicked) initGame();

    ctx.fillStyle = '#555555';
    ctx.font = '14px Share Tech Mono, monospace';
    ctx.fillText('WASD: Move | E: Interact | Tab: Inventory | Click: Attack', WIDTH/2, 550);
}

function renderGame() {
    const sector = gameState.sectors[gameState.currentSector];
    const camX = gameState.player.x - WIDTH/2;
    const camY = gameState.player.y - HEIGHT/2;
    const isPowered = gameState.poweredSectors[gameState.currentSector];
    const brightness = isPowered ? 1.0 : 0.35;

    // Draw tiles with lighting
    for (let y = 0; y < sector.height; y++) {
        for (let x = 0; x < sector.width; x++) {
            const screenX = x * TILE_SIZE - camX;
            const screenY = y * TILE_SIZE - camY;
            if (screenX < -TILE_SIZE || screenX > WIDTH || screenY < -TILE_SIZE || screenY > HEIGHT) continue;

            const tile = sector.tiles[y]?.[x] || 0;
            if (tile === 1) {
                // Wall with 3D effect
                const wallGrad = ctx.createLinearGradient(screenX, screenY, screenX + TILE_SIZE, screenY + TILE_SIZE);
                wallGrad.addColorStop(0, isPowered ? '#3a3a4e' : '#1a1a22');
                wallGrad.addColorStop(1, isPowered ? '#2a2a3e' : '#0a0a12');
                ctx.fillStyle = wallGrad;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = isPowered ? '#4a4a5e' : '#2a2a32';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = isPowered ? '#12121e' : '#080810';
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = isPowered ? '#1a1a2e' : '#101018';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Draw exits with glow
    for (const exit of sector.exits) {
        const screenX = exit.x * TILE_SIZE - camX;
        const screenY = exit.y * TILE_SIZE - camY;

        ctx.save();
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 15 + ambientPulse * 10;
        ctx.fillStyle = '#00aa00';
        ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        ctx.restore();
    }

    // Draw facilities with glow
    for (const facility of (sector.facilities || [])) {
        const screenX = facility.x * TILE_SIZE - camX;
        const screenY = facility.y * TILE_SIZE - camY;

        const colors = {
            workbench: { fill: '#cc8800', glow: 'rgba(204, 136, 0, 0.6)' },
            bed: { fill: '#0088cc', glow: 'rgba(0, 136, 204, 0.6)' },
            storage: { fill: '#88cc00', glow: 'rgba(136, 204, 0, 0.6)' },
            powerPanel: { fill: '#ffff00', glow: 'rgba(255, 255, 0, 0.6)' },
            medicalStation: { fill: '#ff0088', glow: 'rgba(255, 0, 136, 0.6)' },
            researchTerminal: { fill: '#8800ff', glow: 'rgba(136, 0, 255, 0.6)' },
            escapePod: { fill: '#00ffff', glow: 'rgba(0, 255, 255, 0.7)' }
        };

        const col = colors[facility.type] || { fill: '#888888', glow: 'rgba(136, 136, 136, 0.5)' };

        ctx.save();
        ctx.shadowColor = col.glow;
        ctx.shadowBlur = 12 + ambientPulse * 8;
        ctx.fillStyle = col.fill;
        ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.restore();
    }

    // Draw containers with pulse
    for (const container of gameState.containers) {
        if (container.looted) continue;
        const screenX = container.x * TILE_SIZE - camX;
        const screenY = container.y * TILE_SIZE - camY;
        const pulse = Math.sin(ticks * 0.1 + (container.pulseOffset || 0)) * 0.2 + 0.8;

        ctx.save();
        ctx.shadowColor = 'rgba(153, 102, 51, 0.6)';
        ctx.shadowBlur = 8 * pulse;
        ctx.fillStyle = '#996633';
        ctx.fillRect(screenX + 6, screenY + 6, (TILE_SIZE - 12) * pulse, (TILE_SIZE - 12) * pulse);
        ctx.restore();
    }

    // Draw enemies with glow
    for (const enemy of gameState.enemies) {
        const type = ENEMY_TYPES[enemy.type];
        const size = (type.size || 1) * TILE_SIZE * 0.8;
        const screenX = enemy.x - camX;
        const screenY = enemy.y - camY;
        const pulse = Math.sin(ticks * 0.15 + (enemy.pulseOffset || 0)) * 0.15 + 0.85;

        ctx.save();
        ctx.shadowColor = type.glowColor;
        ctx.shadowBlur = enemy.state === 'chase' ? 20 : 10;
        ctx.fillStyle = type.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, (size / 2) * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Eyes
        if (!type.stationary) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(screenX - size/6, screenY - size/6, 2, 0, Math.PI * 2);
            ctx.arc(screenX + size/6, screenY - size/6, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Health bar
        if (enemy.hp < enemy.maxHp) {
            ctx.fillStyle = '#220000';
            ctx.fillRect(screenX - 15, screenY - size/2 - 10, 30, 5);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(screenX - 15, screenY - size/2 - 10, 30 * (enemy.hp / enemy.maxHp), 5);
        }
    }

    // Draw projectiles
    for (const proj of gameState.projectiles) {
        const screenX = proj.x - camX;
        const screenY = proj.y - camY;

        ctx.save();
        ctx.shadowColor = proj.friendly ? '#ffff00' : '#00ff00';
        ctx.shadowBlur = 10;
        ctx.fillStyle = proj.friendly ? '#ffff00' : '#00ff00';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Draw particles
    for (const particle of particles) {
        particle.draw(ctx, camX, camY);
    }

    // Draw player with glow
    ctx.save();
    ctx.shadowColor = 'rgba(68, 68, 255, 0.6)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#4444ff';
    ctx.beginPath();
    ctx.arc(WIDTH/2, HEIGHT/2, TILE_SIZE/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Direction indicator
    ctx.strokeStyle = '#aaaaff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(WIDTH/2, HEIGHT/2);
    ctx.lineTo(WIDTH/2 + Math.cos(gameState.player.angle) * TILE_SIZE,
               HEIGHT/2 + Math.sin(gameState.player.angle) * TILE_SIZE);
    ctx.stroke();

    // Darkness overlay for unpowered sectors
    if (!isPowered) {
        const gradient = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, 50, WIDTH/2, HEIGHT/2, 250);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // Message
    if (gameState.messageTimer > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, gameState.messageTimer);
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 24px Share Tech Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(gameState.message, WIDTH/2, HEIGHT - 100);
        ctx.restore();
    }
}

function renderHUD() {
    ctx.textAlign = 'left';

    // Background panels
    ctx.fillStyle = 'rgba(0, 0, 20, 0.7)';
    ctx.fillRect(5, 5, 230, 145);
    ctx.strokeStyle = '#333355';
    ctx.lineWidth = 1;
    ctx.strokeRect(5, 5, 230, 145);

    // Health bar with gradient
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(10, 12, 200, 22);
    const hpGrad = ctx.createLinearGradient(10, 0, 210, 0);
    hpGrad.addColorStop(0, gameState.health < 30 ? '#ff0000' : '#cc0000');
    hpGrad.addColorStop(1, gameState.health < 30 ? '#880000' : '#aa0000');
    ctx.fillStyle = hpGrad;
    ctx.fillRect(10, 12, 200 * (gameState.health / 100), 22);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Share Tech Mono, monospace';
    ctx.fillText(`HP: ${Math.floor(gameState.health)}`, 15, 28);

    // Status meters
    const meters = [
        { name: 'Hunger', value: gameState.hunger, color: '#ff8800', warnColor: '#ff4400' },
        { name: 'Thirst', value: gameState.thirst, color: '#0088ff', warnColor: '#0044ff' },
        { name: 'Fatigue', value: gameState.fatigue, color: '#888888', warnColor: '#666666' },
        { name: 'Infection', value: gameState.infection, color: '#00ff00', warnColor: '#44ff44' }
    ];

    for (let i = 0; i < meters.length; i++) {
        const m = meters[i];
        const y = 42 + i * 24;
        ctx.fillStyle = '#151515';
        ctx.fillRect(10, y, 100, 18);
        ctx.fillStyle = m.value > 75 ? m.warnColor : m.color;
        ctx.fillRect(10, y, 100 * (m.value / 100), 18);
        ctx.fillStyle = '#cccccc';
        ctx.font = '11px Share Tech Mono, monospace';
        ctx.fillText(`${m.name}: ${Math.floor(m.value)}`, 115, y + 13);
    }

    // Right side panel
    ctx.fillStyle = 'rgba(0, 0, 20, 0.7)';
    ctx.fillRect(WIDTH - 160, 5, 155, 90);
    ctx.strokeStyle = '#333355';
    ctx.strokeRect(WIDTH - 160, 5, 155, 90);

    // Global infection
    ctx.save();
    ctx.shadowColor = gameState.globalInfection > 75 ? '#ff0000' : '#00ff00';
    ctx.shadowBlur = 10;
    ctx.fillStyle = gameState.globalInfection > 75 ? '#ff0000' : '#00ff00';
    ctx.font = 'bold 20px Orbitron, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(gameState.globalInfection)}%`, WIDTH - 15, 30);
    ctx.restore();

    ctx.fillStyle = '#888888';
    ctx.font = '12px Share Tech Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('GLOBAL INFECTION', WIDTH - 15, 45);

    // Time
    const hours = Math.floor(gameState.gameTime / 60) % 24;
    const mins = Math.floor(gameState.gameTime) % 60;
    ctx.fillStyle = '#cccccc';
    ctx.font = '14px Share Tech Mono, monospace';
    ctx.fillText(`Time: ${hours.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}`, WIDTH - 15, 65);

    // Sector
    ctx.fillStyle = gameState.poweredSectors[gameState.currentSector] ? '#00ff00' : '#ff4444';
    ctx.fillText(`${gameState.currentSector.toUpperCase()}`, WIDTH - 15, 85);

    // Bottom bar
    ctx.fillStyle = 'rgba(0, 0, 20, 0.7)';
    ctx.fillRect(5, HEIGHT - 35, WIDTH - 10, 30);
    ctx.strokeStyle = '#333355';
    ctx.strokeRect(5, HEIGHT - 35, WIDTH - 10, 30);

    // Weapon
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Share Tech Mono, monospace';
    const weaponName = gameState.weapon ? ITEMS[gameState.weapon.id]?.name : 'Fists';
    ctx.fillText(`Weapon: ${weaponName}`, 15, HEIGHT - 15);

    // Keys/unlocks
    if (gameState.hasKeycard) {
        ctx.save();
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ff0000';
        ctx.font = '12px Share Tech Mono, monospace';
        ctx.fillText('[KEYCARD]', 200, HEIGHT - 15);
        ctx.restore();
    }
    if (gameState.tier2Unlocked) {
        ctx.save();
        ctx.shadowColor = '#8800ff';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#aa44ff';
        ctx.fillText('[TIER 2]', 300, HEIGHT - 15);
        ctx.restore();
    }

    ctx.fillStyle = '#666666';
    ctx.textAlign = 'right';
    ctx.fillText('Tab: Inventory | E: Interact', WIDTH - 15, HEIGHT - 15);
}

function renderCrafting() {
    renderPanel(200, 80, 624, 540, '#ff8800', 'WORKBENCH');

    let y = 150;
    const allRecipes = [...RECIPES.tier1, ...(gameState.tier2Unlocked ? RECIPES.tier2 : [])];

    for (const recipe of allRecipes) {
        const canCraft = Object.entries(recipe.materials).every(([mat, count]) => countItem(mat) >= count);
        const rectY = y;
        const hover = mouse.x >= 210 && mouse.x <= 800 && mouse.y >= rectY && mouse.y <= rectY + 38;

        if (hover) {
            ctx.fillStyle = '#333344';
            ctx.fillRect(210, rectY, 600, 38);
        }

        ctx.fillStyle = canCraft ? '#00ff00' : '#666666';
        ctx.font = '16px Share Tech Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(recipe.name, 220, y + 25);

        const matsStr = Object.entries(recipe.materials)
            .map(([m, c]) => `${ITEMS[m]?.name}: ${countItem(m)}/${c}`)
            .join(', ');
        ctx.fillStyle = '#999999';
        ctx.font = '12px Share Tech Mono, monospace';
        ctx.fillText(matsStr, 380, y + 25);

        if (hover && mouse.justClicked && canCraft) {
            for (const [mat, count] of Object.entries(recipe.materials)) removeItem(mat, count);
            addItem(recipe.id, recipe.id === 'pistolAmmo' ? 10 : 1);
            gameState.gameTime += recipe.time;
            gameState.message = `Crafted ${recipe.name}`;
            gameState.messageTimer = 2;
            spawnParticles(gameState.player.x, gameState.player.y, 'spark', 15);
        }

        y += 42;
    }

    if (renderCloseButton(780, 90)) gameState.screen = 'game';
}

function renderPower() {
    renderPanel(250, 130, 524, 420, '#ffff00', 'POWER CONTROL');

    const usedPower = Object.entries(gameState.poweredSectors)
        .filter(([s, on]) => on)
        .reduce((sum, [s]) => sum + gameState.sectorPowerCost[s], 0);

    // Power bar
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(270, 190, 484, 30);
    const powerGrad = ctx.createLinearGradient(270, 0, 754, 0);
    powerGrad.addColorStop(0, '#ffff00');
    powerGrad.addColorStop(1, '#ffaa00');
    ctx.fillStyle = powerGrad;
    ctx.fillRect(270, 190, 484 * (usedPower / gameState.maxPower), 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${usedPower} / ${gameState.maxPower} UNITS`, 512, 240);

    let y = 280;
    for (const [sector, cost] of Object.entries(gameState.sectorPowerCost)) {
        if (sector === 'hub') continue;

        const isOn = gameState.poweredSectors[sector];
        const canToggleOn = !isOn && (usedPower + cost <= gameState.maxPower);
        const hover = mouse.x >= 260 && mouse.x <= 760 && mouse.y >= y && mouse.y <= y + 45;

        if (hover) {
            ctx.fillStyle = '#333344';
            ctx.fillRect(260, y, 500, 45);
        }

        ctx.fillStyle = isOn ? '#00ff00' : (canToggleOn ? '#ffff00' : '#666666');
        ctx.font = '16px Share Tech Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${sector.toUpperCase()}: ${cost} units`, 280, y + 28);

        // Toggle button
        ctx.fillStyle = isOn ? '#004400' : '#442200';
        ctx.fillRect(660, y + 8, 80, 28);
        ctx.fillStyle = isOn ? '#00ff00' : '#ffaa00';
        ctx.font = '14px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isOn ? 'ON' : 'OFF', 700, y + 28);

        if (hover && mouse.justClicked) {
            if (isOn) {
                gameState.poweredSectors[sector] = false;
            } else if (canToggleOn) {
                gameState.poweredSectors[sector] = true;
                spawnParticles(gameState.player.x, gameState.player.y, 'power', 10);
            }
        }

        y += 55;
    }

    if (renderCloseButton(730, 140)) gameState.screen = 'game';
}

function renderSleep() {
    renderPanel(300, 180, 424, 320, '#0088cc', 'SLEEP');

    const options = [
        { label: 'Nap (1 hour)', fatigue: -30, time: 60 },
        { label: 'Rest (4 hours)', fatigue: -60, time: 240 },
        { label: 'Full Sleep (8 hours)', fatigue: -100, time: 480 }
    ];

    let y = 260;
    for (const opt of options) {
        const hover = mouse.x >= 320 && mouse.x <= 700 && mouse.y >= y && mouse.y <= y + 45;

        if (hover) {
            ctx.fillStyle = '#333344';
            ctx.fillRect(320, y, 380, 45);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Share Tech Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(opt.label, 340, y + 30);

        if (hover && mouse.justClicked) {
            gameState.fatigue = Math.max(0, gameState.fatigue + opt.fatigue);
            gameState.gameTime += opt.time;
            gameState.message = `Rested for ${opt.time / 60} hours`;
            gameState.messageTimer = 2;
            gameState.screen = 'game';
        }

        y += 55;
    }

    if (renderCloseButton(680, 190)) gameState.screen = 'game';
}

function renderStorage() {
    renderPanel(200, 100, 624, 500, '#88cc00', 'STORAGE LOCKER');

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px Share Tech Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Storage not implemented - items stay in inventory', 512, 350);

    if (renderCloseButton(780, 110)) gameState.screen = 'game';
}

function renderMedical() {
    renderPanel(250, 130, 524, 420, '#ff0088', 'MEDICAL STATION');

    const treatments = [
        { label: 'Basic Heal (free)', effect: { health: 20 }, cost: {}, time: 30 },
        { label: 'Full Heal (1 Chemicals)', effect: { health: 100, setHealth: true }, cost: { chemicals: 1 }, time: 60 },
        { label: 'Cure Infection (2 Chemicals)', effect: { infection: -50 }, cost: { chemicals: 2 }, time: 60 }
    ];

    let y = 220;
    for (const treat of treatments) {
        const canAfford = Object.entries(treat.cost).every(([m, c]) => countItem(m) >= c);
        const hover = mouse.x >= 260 && mouse.x <= 760 && mouse.y >= y && mouse.y <= y + 55;

        if (hover && canAfford) {
            ctx.fillStyle = '#333344';
            ctx.fillRect(260, y, 500, 55);
        }

        ctx.fillStyle = canAfford ? '#ffffff' : '#666666';
        ctx.font = '18px Share Tech Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(treat.label, 280, y + 35);

        if (hover && mouse.justClicked && canAfford) {
            for (const [m, c] of Object.entries(treat.cost)) removeItem(m, c);
            if (treat.effect.setHealth) gameState.health = treat.effect.health;
            else if (treat.effect.health) gameState.health = Math.min(100, gameState.health + treat.effect.health);
            if (treat.effect.infection) gameState.infection = Math.max(0, gameState.infection + treat.effect.infection);
            gameState.gameTime += treat.time;
            gameState.message = 'Treatment complete';
            gameState.messageTimer = 2;
            spawnParticles(gameState.player.x, gameState.player.y, 'heal', 20);
        }

        y += 65;
    }

    if (renderCloseButton(730, 140)) gameState.screen = 'game';
}

function renderInventory() {
    renderPanel(200, 80, 624, 540, '#ffffff', 'INVENTORY');

    const slotSize = 65;
    const cols = 5;
    const startX = 260;
    const startY = 160;

    for (let i = 0; i < gameState.maxInventory; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (slotSize + 12);
        const y = startY + row * (slotSize + 12);

        const slot = gameState.inventory[i];
        const hover = mouse.x >= x && mouse.x <= x + slotSize && mouse.y >= y && mouse.y <= y + slotSize;

        ctx.fillStyle = hover ? '#444466' : '#222244';
        ctx.strokeStyle = '#666688';
        ctx.lineWidth = 1;
        ctx.fillRect(x, y, slotSize, slotSize);
        ctx.strokeRect(x, y, slotSize, slotSize);

        if (slot) {
            const item = ITEMS[slot.id];
            ctx.fillStyle = '#ffffff';
            ctx.font = '11px Share Tech Mono, monospace';
            ctx.textAlign = 'left';
            ctx.fillText((item?.name || slot.id).substring(0, 8), x + 4, y + 38);

            if (slot.count > 1) {
                ctx.fillStyle = '#ffff00';
                ctx.font = '12px Share Tech Mono, monospace';
                ctx.textAlign = 'right';
                ctx.fillText(`x${slot.count}`, x + slotSize - 4, y + slotSize - 6);
            }

            if (hover && mouse.justClicked) useItem(i);
        }
    }

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '14px Share Tech Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Click item to use/equip', 512, 575);

    if (renderCloseButton(780, 90)) gameState.screen = 'game';
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(20, 0, 0, 0.9)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.save();
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 40;
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 56px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', WIDTH/2, 250);
    ctx.restore();

    ctx.fillStyle = '#888888';
    ctx.font = '22px Share Tech Mono, monospace';
    ctx.fillText(gameState.deathReason || 'You died', WIDTH/2, 320);

    ctx.fillStyle = '#666666';
    ctx.font = '16px Share Tech Mono, monospace';
    ctx.fillText(`Time survived: ${Math.floor(gameState.gameTime)} minutes`, WIDTH/2, 380);
    ctx.fillText(`Global Infection: ${Math.floor(gameState.globalInfection)}%`, WIDTH/2, 410);

    const btnX = WIDTH/2 - 100, btnY = 470;
    const hover = mouse.x >= btnX && mouse.x <= btnX + 200 && mouse.y >= btnY && mouse.y <= btnY + 55;

    ctx.fillStyle = hover ? '#553333' : '#331111';
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(btnX, btnY, 200, 55);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ff0000';
    ctx.font = '24px Orbitron, sans-serif';
    ctx.fillText('RETRY', WIDTH/2, btnY + 38);

    if (hover && mouse.justClicked) gameState.screen = 'menu';
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 20, 10, 0.9)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.save();
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 40;
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 56px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED!', WIDTH/2, 200);
    ctx.restore();

    ctx.fillStyle = '#00cc66';
    ctx.font = '26px Share Tech Mono, monospace';
    ctx.fillText('You escaped the facility!', WIDTH/2, 280);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Share Tech Mono, monospace';
    ctx.fillText(`Time: ${Math.floor(gameState.gameTime)} minutes`, WIDTH/2, 360);
    ctx.fillText(`Global Infection: ${Math.floor(gameState.globalInfection)}%`, WIDTH/2, 395);
    ctx.fillText(`Health: ${Math.floor(gameState.health)}%`, WIDTH/2, 430);

    const btnX = WIDTH/2 - 120, btnY = 490;
    const hover = mouse.x >= btnX && mouse.x <= btnX + 240 && mouse.y >= btnY && mouse.y <= btnY + 55;

    ctx.fillStyle = hover ? '#225533' : '#113322';
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(btnX, btnY, 240, 55);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00ff88';
    ctx.font = '24px Orbitron, sans-serif';
    ctx.fillText('PLAY AGAIN', WIDTH/2, btnY + 38);

    if (hover && mouse.justClicked) gameState.screen = 'menu';
}

function renderPanel(x, y, w, h, color, title) {
    ctx.fillStyle = 'rgba(20, 20, 40, 0.95)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.font = 'bold 28px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, x + w/2, y + 45);
    ctx.restore();
}

function renderCloseButton(x, y) {
    const hover = mouse.x >= x && mouse.x <= x + 35 && mouse.y >= y && mouse.y <= y + 35;

    ctx.fillStyle = hover ? '#ff4444' : '#662222';
    ctx.fillRect(x, y, 35, 35);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Share Tech Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('X', x + 17, y + 26);

    return hover && mouse.justClicked;
}

// Input handlers
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => {
    mouse.clicked = true;
    mouse.justClicked = true;
});

canvas.addEventListener('mouseup', () => {
    mouse.clicked = false;
});

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (e.code === 'Tab') {
        e.preventDefault();
        if (gameState.screen === 'game') gameState.screen = 'inventory';
        else if (gameState.screen === 'inventory') gameState.screen = 'game';
    }

    if (e.code === 'Escape') {
        if (gameState.screen !== 'game' && gameState.screen !== 'menu' &&
            gameState.screen !== 'gameover' && gameState.screen !== 'victory') {
            gameState.screen = 'game';
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.code === 'KeyE') keys['KeyE_used'] = false;
});

// Start game loop
requestAnimationFrame(update);

console.log('Isolation Protocol POLISHED - Canvas2D loaded');
