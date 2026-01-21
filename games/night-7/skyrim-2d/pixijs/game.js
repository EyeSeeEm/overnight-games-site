// Frostfall - Skyrim 2D Demake - PixiJS
// Top-down action RPG with dungeons, combat, and quests

const APP_WIDTH = 800;
const APP_HEIGHT = 600;
const TILE_SIZE = 32;
const VISION_RANGE = 8;

const app = new PIXI.Application({
    width: APP_WIDTH,
    height: APP_HEIGHT,
    backgroundColor: 0x1a2a3a
});
document.body.appendChild(app.view);

// Game State
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    INVENTORY: 'inventory',
    DIALOGUE: 'dialogue',
    SHOP: 'shop',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// Biome Types
const Biome = {
    VILLAGE: 'village',
    FOREST: 'forest',
    SNOW: 'snow',
    MOUNTAIN: 'mountain'
};

// Weapons
const WEAPONS = {
    fists: { name: 'Fists', damage: [3, 5], speed: 0.3, range: 24, value: 0 },
    iron_sword: { name: 'Iron Sword', damage: [8, 12], speed: 0.3, range: 28, value: 50 },
    steel_sword: { name: 'Steel Sword', damage: [12, 18], speed: 0.3, range: 28, value: 120 },
    iron_greatsword: { name: 'Iron Greatsword', damage: [15, 22], speed: 0.5, range: 36, value: 80 },
    steel_greatsword: { name: 'Steel Greatsword', damage: [22, 32], speed: 0.5, range: 36, value: 180 },
    dagger: { name: 'Dagger', damage: [5, 8], speed: 0.2, range: 20, value: 30 }
};

// Armor
const ARMORS = {
    leather: { name: 'Leather Armor', defense: 15, value: 40 },
    iron: { name: 'Iron Armor', defense: 30, value: 100 },
    steel: { name: 'Steel Armor', defense: 45, value: 200 }
};

// Enemy Types by Biome
const ENEMY_TYPES = {
    // Forest
    wolf: { name: 'Wolf', hp: 25, damage: [4, 8], speed: 70, xp: 15, gold: [0, 5], color: 0x666666, biome: 'forest' },
    bandit: { name: 'Bandit', hp: 40, damage: [6, 10], speed: 50, xp: 25, gold: [5, 15], color: 0x885533, biome: 'forest' },
    bandit_chief: { name: 'Bandit Chief', hp: 80, damage: [12, 18], speed: 45, xp: 100, gold: [25, 50], color: 0xaa4422, boss: true, biome: 'forest' },
    // Snow
    frost_wolf: { name: 'Frost Wolf', hp: 35, damage: [6, 10], speed: 75, xp: 20, gold: [0, 8], color: 0xaaccff, biome: 'snow' },
    draugr: { name: 'Draugr', hp: 50, damage: [8, 14], speed: 40, xp: 35, gold: [5, 20], color: 0x445566, biome: 'snow' },
    draugr_wight: { name: 'Draugr Wight', hp: 100, damage: [15, 22], speed: 35, xp: 150, gold: [40, 80], color: 0x223344, boss: true, biome: 'snow' },
    // Mountain
    bear: { name: 'Bear', hp: 60, damage: [10, 16], speed: 55, xp: 40, gold: [0, 0], color: 0x553311, biome: 'mountain' },
    troll: { name: 'Troll', hp: 80, damage: [12, 20], speed: 35, xp: 60, gold: [0, 10], color: 0x447744, biome: 'mountain' },
    giant: { name: 'Giant', hp: 150, damage: [20, 35], speed: 25, xp: 200, gold: [80, 150], color: 0x887766, boss: true, biome: 'mountain' }
};

// Quests
const QUESTS = [
    { id: 'clear_forest', name: 'Clear the Forest', desc: 'Defeat the Bandit Chief in the Forest Dungeon', target: 'bandit_chief', reward: 200, complete: false },
    { id: 'clear_snow', name: 'The Frozen Dead', desc: 'Defeat the Draugr Wight in the Snow Dungeon', target: 'draugr_wight', reward: 350, complete: false },
    { id: 'clear_mountain', name: 'Giant Slayer', desc: 'Defeat the Giant in the Mountain Dungeon', target: 'giant', reward: 500, complete: false }
];

// Perks
const PERKS = {
    armsman: { name: 'Armsman', desc: '+25% melee damage', level: 2 },
    power_strike: { name: 'Power Strike', desc: 'Power attacks deal 2x damage', level: 4 },
    warriors_resolve: { name: "Warrior's Resolve", desc: '+20 max HP', level: 7 }
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
let currentZone = null;
let zones = {};
let player = null;
let enemies = [];
let npcs = [];
let items = [];
let projectiles = [];
let effects = [];
let quests = JSON.parse(JSON.stringify(QUESTS));
let screenShake = 0;
let screenFlash = 0;

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

// Player Class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.speed = 120;
        this.sprintSpeed = 180;

        this.hp = 100;
        this.maxHp = 100;
        this.stamina = 100;
        this.maxStamina = 100;

        this.level = 1;
        this.xp = 0;
        this.xpToLevel = 100;
        this.perkPoints = 0;
        this.perks = [];

        this.gold = 50;

        this.weapon = { ...WEAPONS.iron_sword };
        this.armor = null;
        this.inventory = [
            { type: 'potion', name: 'Health Potion', healAmount: 50, value: 30 },
            { type: 'potion', name: 'Health Potion', healAmount: 50, value: 30 }
        ];

        this.attackCooldown = 0;
        this.dodgeCooldown = 0;
        this.direction = { x: 0, y: 1 };
        this.invincible = 0;

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
        this.sprite.drawCircle(this.direction.x * 8, this.direction.y * 8, 4);
        this.sprite.endFill();
    }

    update(delta) {
        const dt = delta / 60;

        // Cooldowns
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;
        if (this.invincible > 0) this.invincible -= dt;

        // Stamina regen
        if (!keys['shift']) {
            this.stamina = Math.min(this.maxStamina, this.stamina + 15 * dt);
        }

        // Movement
        this.vx = 0;
        this.vy = 0;

        if (keys['w'] || keys['arrowup']) this.vy = -1;
        if (keys['s'] || keys['arrowdown']) this.vy = 1;
        if (keys['a'] || keys['arrowleft']) this.vx = -1;
        if (keys['d'] || keys['arrowright']) this.vx = 1;

        // Normalize
        const len = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (len > 0) {
            this.vx /= len;
            this.vy /= len;
            this.direction.x = this.vx;
            this.direction.y = this.vy;
        }

        // Sprint
        let currentSpeed = this.speed;
        if (keys['shift'] && this.stamina > 0) {
            currentSpeed = this.sprintSpeed;
            this.stamina -= 20 * dt;
        }

        // Apply movement
        const nx = this.x + this.vx * currentSpeed * dt;
        const ny = this.y + this.vy * currentSpeed * dt;

        if (canMoveTo(nx, this.y)) this.x = nx;
        if (canMoveTo(this.x, ny)) this.y = ny;

        // Zone transition
        checkZoneTransition();

        // Attack
        if (mouse.clicked && this.attackCooldown <= 0) {
            this.attack();
        }

        // Dodge roll
        if (keys[' '] && this.dodgeCooldown <= 0 && this.stamina >= 20) {
            this.dodge();
        }

        // Use potion (E key)
        if (keys['e'] && !this.usedPotion) {
            this.usePotion();
            this.usedPotion = true;
        }
        if (!keys['e']) this.usedPotion = false;

        // Update sprite
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.alpha = this.invincible > 0 ? 0.5 : 1;
        this.updateSprite();
    }

    attack() {
        this.attackCooldown = this.weapon.speed;

        // Attack direction towards mouse
        const worldMouse = {
            x: mouse.x - gameContainer.x,
            y: mouse.y - gameContainer.y
        };
        const dx = worldMouse.x - this.x;
        const dy = worldMouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            this.direction.x = dx / dist;
            this.direction.y = dy / dist;
        }

        // Attack effect
        createSlashEffect(this.x + this.direction.x * 20, this.y + this.direction.y * 20, this.direction);

        // Check hits
        for (const enemy of enemies) {
            const ex = enemy.x - this.x;
            const ey = enemy.y - this.y;
            const edist = Math.sqrt(ex * ex + ey * ey);

            if (edist < this.weapon.range + 16) {
                // Direction check
                const dot = (ex / edist) * this.direction.x + (ey / edist) * this.direction.y;
                if (dot > 0.3) {
                    let damage = this.weapon.damage[0] + Math.floor(Math.random() * (this.weapon.damage[1] - this.weapon.damage[0] + 1));

                    // Perks
                    if (this.perks.includes('armsman')) damage = Math.floor(damage * 1.25);
                    if (this.perks.includes('power_strike') && keys['shift']) damage *= 2;

                    enemy.takeDamage(damage);
                    createHitEffect(enemy.x, enemy.y);
                }
            }
        }
    }

    dodge() {
        this.stamina -= 20;
        this.dodgeCooldown = 0.8;
        this.invincible = 0.3;

        // Quick dash in movement direction or facing direction
        const dashDir = { x: this.vx || this.direction.x, y: this.vy || this.direction.y };
        const dashDist = 60;

        const nx = this.x + dashDir.x * dashDist;
        const ny = this.y + dashDir.y * dashDist;

        if (canMoveTo(nx, ny)) {
            this.x = nx;
            this.y = ny;
        }
    }

    usePotion() {
        const potionIdx = this.inventory.findIndex(i => i.type === 'potion');
        if (potionIdx >= 0 && this.hp < this.maxHp) {
            const potion = this.inventory[potionIdx];
            this.hp = Math.min(this.maxHp, this.hp + potion.healAmount);
            this.inventory.splice(potionIdx, 1);
            showFloatingText(this.x, this.y - 20, `+${potion.healAmount} HP`, 0x44ff44);
        }
    }

    takeDamage(amount) {
        if (this.invincible > 0) return;

        // Armor reduction
        if (this.armor) {
            amount = Math.max(1, amount - Math.floor(this.armor.defense / 3));
        }

        this.hp -= amount;
        this.invincible = 0.5;

        screenShake = 10;
        screenFlash = 0.3;

        showFloatingText(this.x, this.y - 20, `-${amount}`, 0xff4444);

        if (this.hp <= 0) {
            this.hp = 0;
            gameOver();
        }
    }

    gainXP(amount) {
        this.xp += amount;
        showFloatingText(this.x, this.y - 30, `+${amount} XP`, 0xffff44);

        while (this.xp >= this.xpToLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.xp -= this.xpToLevel;
        this.level++;
        this.xpToLevel = Math.floor(this.xpToLevel * 1.5);

        this.maxHp += 10;
        this.hp = this.maxHp;
        this.perkPoints++;

        if (this.perks.includes('warriors_resolve')) {
            this.maxHp += 20;
        }

        showFloatingText(this.x, this.y - 40, `LEVEL UP! (${this.level})`, 0xffaa00);
    }
}

// Enemy Class
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
        this.xp = def.xp;
        this.gold = def.gold;
        this.boss = def.boss || false;

        this.state = 'idle';
        this.attackCooldown = 0;
        this.stagger = 0;

        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(def.color);
        if (this.boss) {
            this.sprite.drawRect(-16, -16, 32, 32);
        } else {
            this.sprite.drawCircle(0, 0, 10);
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
        this.hpBar.drawRect(-15, -22, 30, 4);
        this.hpBar.endFill();
        this.hpBar.beginFill(0xff4444);
        this.hpBar.drawRect(-15, -22, 30 * (this.hp / this.maxHp), 4);
        this.hpBar.endFill();
    }

    update(delta) {
        const dt = delta / 60;

        if (this.stagger > 0) {
            this.stagger -= dt;
            return;
        }
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // AI behavior
        if (dist < 300) {
            this.state = 'chase';
        }

        if (this.state === 'chase') {
            // Attack range
            if (dist < 30) {
                if (this.attackCooldown <= 0) {
                    this.attack();
                }
            } else {
                // Move towards player
                const mx = (dx / dist) * this.speed * dt;
                const my = (dy / dist) * this.speed * dt;

                if (canMoveTo(this.x + mx, this.y)) this.x += mx;
                if (canMoveTo(this.x, this.y + my)) this.y += my;
            }
        }

        this.sprite.x = this.x;
        this.sprite.y = this.y;
    }

    attack() {
        this.attackCooldown = 1.5;

        const dmg = this.damage[0] + Math.floor(Math.random() * (this.damage[1] - this.damage[0] + 1));
        player.takeDamage(dmg);
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.stagger = 0.2;
        this.updateHpBar();

        showFloatingText(this.x, this.y - 30, `-${amount}`, 0xffaa00);

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        // Drop gold
        const goldAmount = this.gold[0] + Math.floor(Math.random() * (this.gold[1] - this.gold[0] + 1));
        if (goldAmount > 0) {
            player.gold += goldAmount;
            showFloatingText(this.x, this.y - 10, `+${goldAmount} gold`, 0xffff00);
        }

        // XP
        player.gainXP(this.xp);

        // Check quest completion
        for (const quest of quests) {
            if (!quest.complete && quest.target === this.type) {
                quest.complete = true;
                player.gold += quest.reward;
                showFloatingText(player.x, player.y - 50, `Quest Complete! +${quest.reward} gold`, 0x44ff44);
            }
        }

        // Check victory
        if (quests.every(q => q.complete)) {
            victory();
        }

        entityContainer.removeChild(this.sprite);
        enemies = enemies.filter(e => e !== this);
    }
}

// NPC Class
class NPC {
    constructor(x, y, name, type, dialogue) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.type = type;
        this.dialogue = dialogue;

        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(type === 'smith' ? 0xaa6633 : 0x44aa44);
        this.sprite.drawCircle(0, 0, 12);
        this.sprite.endFill();

        const nameText = new PIXI.Text(name, { fontSize: 10, fill: 0xffffff });
        nameText.anchor.set(0.5);
        nameText.y = -20;
        this.sprite.addChild(nameText);

        this.sprite.x = x;
        this.sprite.y = y;
        entityContainer.addChild(this.sprite);
    }

    interact() {
        if (this.type === 'smith') {
            openShop();
        } else {
            openDialogue(this);
        }
    }
}

// Zone Generation
function generateZone(biome, isStart = false) {
    const zone = {
        biome,
        width: 40,
        height: 30,
        tiles: [],
        enemies: [],
        npcs: [],
        exits: {}
    };

    // Generate tiles
    for (let y = 0; y < zone.height; y++) {
        zone.tiles[y] = [];
        for (let x = 0; x < zone.width; x++) {
            // Border walls
            if (x === 0 || x === zone.width - 1 || y === 0 || y === zone.height - 1) {
                zone.tiles[y][x] = 1; // Wall
            } else {
                zone.tiles[y][x] = 0; // Floor
            }
        }
    }

    // Add obstacles
    const obstacleCount = biome === Biome.VILLAGE ? 5 : 15;
    for (let i = 0; i < obstacleCount; i++) {
        const ox = 3 + Math.floor(Math.random() * (zone.width - 6));
        const oy = 3 + Math.floor(Math.random() * (zone.height - 6));
        const ow = 1 + Math.floor(Math.random() * 3);
        const oh = 1 + Math.floor(Math.random() * 3);

        for (let dy = 0; dy < oh; dy++) {
            for (let dx = 0; dx < ow; dx++) {
                if (zone.tiles[oy + dy]) {
                    zone.tiles[oy + dy][ox + dx] = 2; // Obstacle
                }
            }
        }
    }

    // Create exits
    zone.exits.north = { x: Math.floor(zone.width / 2), y: 0 };
    zone.exits.south = { x: Math.floor(zone.width / 2), y: zone.height - 1 };
    zone.exits.east = { x: zone.width - 1, y: Math.floor(zone.height / 2) };
    zone.exits.west = { x: 0, y: Math.floor(zone.height / 2) };

    // Clear exits
    for (const dir in zone.exits) {
        const exit = zone.exits[dir];
        zone.tiles[exit.y][exit.x] = 3; // Exit tile
    }

    // Add NPCs in village
    if (biome === Biome.VILLAGE) {
        zone.npcs.push({
            x: 10 * TILE_SIZE,
            y: 10 * TILE_SIZE,
            name: 'Alvor',
            type: 'smith',
            dialogue: "Need weapons or armor? I can help you."
        });
        zone.npcs.push({
            x: 20 * TILE_SIZE,
            y: 15 * TILE_SIZE,
            name: 'Jarl',
            type: 'quest',
            dialogue: "Brave warrior! Clear the three dungeons to save our land: Forest, Snow, and Mountain. Bring peace to Skyrim!"
        });
    }

    // Add enemies
    if (biome !== Biome.VILLAGE) {
        const enemyTypes = Object.keys(ENEMY_TYPES).filter(t => ENEMY_TYPES[t].biome === biome);
        const normalTypes = enemyTypes.filter(t => !ENEMY_TYPES[t].boss);
        const bossTypes = enemyTypes.filter(t => ENEMY_TYPES[t].boss);

        // Regular enemies
        const enemyCount = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < enemyCount; i++) {
            let ex, ey;
            do {
                ex = 3 + Math.floor(Math.random() * (zone.width - 6));
                ey = 3 + Math.floor(Math.random() * (zone.height - 6));
            } while (zone.tiles[ey][ex] !== 0);

            const type = normalTypes[Math.floor(Math.random() * normalTypes.length)];
            zone.enemies.push({ x: ex * TILE_SIZE, y: ey * TILE_SIZE, type });
        }

        // Boss (only in dungeon zones)
        if (Math.random() < 0.3 && bossTypes.length > 0) {
            let bx, by;
            do {
                bx = 10 + Math.floor(Math.random() * (zone.width - 20));
                by = 10 + Math.floor(Math.random() * (zone.height - 20));
            } while (zone.tiles[by][bx] !== 0);

            zone.enemies.push({ x: bx * TILE_SIZE, y: by * TILE_SIZE, type: bossTypes[0] });
        }
    }

    return zone;
}

function loadZone(zone, entryDir = null) {
    currentZone = zone;

    // Clear entities
    worldContainer.removeChildren();
    for (const enemy of enemies) entityContainer.removeChild(enemy.sprite);
    for (const npc of npcs) entityContainer.removeChild(npc.sprite);
    enemies = [];
    npcs = [];

    // Render tiles
    const colors = {
        [Biome.VILLAGE]: { floor: 0x3a4a3a, wall: 0x554433, obstacle: 0x443322 },
        [Biome.FOREST]: { floor: 0x2a3a2a, wall: 0x1a2a1a, obstacle: 0x224422 },
        [Biome.SNOW]: { floor: 0x667788, wall: 0x445566, obstacle: 0x556677 },
        [Biome.MOUNTAIN]: { floor: 0x4a4a4a, wall: 0x3a3a3a, obstacle: 0x555555 }
    };

    const palette = colors[zone.biome];

    for (let y = 0; y < zone.height; y++) {
        for (let x = 0; x < zone.width; x++) {
            const tile = new PIXI.Graphics();
            const tileType = zone.tiles[y][x];

            if (tileType === 0) {
                tile.beginFill(palette.floor);
            } else if (tileType === 1) {
                tile.beginFill(palette.wall);
            } else if (tileType === 2) {
                tile.beginFill(palette.obstacle);
            } else if (tileType === 3) {
                tile.beginFill(0x44aa44); // Exit
            }

            tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
            tile.endFill();
            tile.lineStyle(1, 0x111111, 0.3);
            tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);

            tile.x = x * TILE_SIZE;
            tile.y = y * TILE_SIZE;
            worldContainer.addChild(tile);
        }
    }

    // Spawn enemies
    for (const e of zone.enemies) {
        // Check if boss already killed
        if (ENEMY_TYPES[e.type].boss) {
            const quest = quests.find(q => q.target === e.type);
            if (quest && quest.complete) continue;
        }
        enemies.push(new Enemy(e.x, e.y, e.type));
    }

    // Spawn NPCs
    for (const n of zone.npcs) {
        npcs.push(new NPC(n.x, n.y, n.name, n.type, n.dialogue));
    }

    // Position player
    if (entryDir) {
        const opposite = { north: 'south', south: 'north', east: 'west', west: 'east' };
        const entry = zone.exits[opposite[entryDir]];
        player.x = entry.x * TILE_SIZE + TILE_SIZE / 2;
        player.y = entry.y * TILE_SIZE + TILE_SIZE / 2;

        // Move slightly inside
        if (entryDir === 'north') player.y += TILE_SIZE * 2;
        if (entryDir === 'south') player.y -= TILE_SIZE * 2;
        if (entryDir === 'east') player.x -= TILE_SIZE * 2;
        if (entryDir === 'west') player.x += TILE_SIZE * 2;
    }
}

// World Map
function generateWorld() {
    zones = {};

    // Central village
    zones['0,0'] = generateZone(Biome.VILLAGE, true);

    // Forest biome (south)
    zones['0,-1'] = generateZone(Biome.FOREST);
    zones['0,-2'] = generateZone(Biome.FOREST);
    // Force boss in deepest zone
    const forestBoss = zones['0,-2'].enemies.find(e => ENEMY_TYPES[e.type].boss);
    if (!forestBoss) {
        zones['0,-2'].enemies.push({ x: 20 * TILE_SIZE, y: 15 * TILE_SIZE, type: 'bandit_chief' });
    }

    // Snow biome (east)
    zones['1,0'] = generateZone(Biome.SNOW);
    zones['2,0'] = generateZone(Biome.SNOW);
    const snowBoss = zones['2,0'].enemies.find(e => ENEMY_TYPES[e.type].boss);
    if (!snowBoss) {
        zones['2,0'].enemies.push({ x: 20 * TILE_SIZE, y: 15 * TILE_SIZE, type: 'draugr_wight' });
    }

    // Mountain biome (north)
    zones['0,1'] = generateZone(Biome.MOUNTAIN);
    zones['0,2'] = generateZone(Biome.MOUNTAIN);
    const mtnBoss = zones['0,2'].enemies.find(e => ENEMY_TYPES[e.type].boss);
    if (!mtnBoss) {
        zones['0,2'].enemies.push({ x: 20 * TILE_SIZE, y: 15 * TILE_SIZE, type: 'giant' });
    }
}

// Zone transition
let currentZoneKey = '0,0';

function checkZoneTransition() {
    const zone = currentZone;
    const [cx, cy] = currentZoneKey.split(',').map(Number);

    let newKey = null;
    let entryDir = null;

    // Check exits
    const px = Math.floor(player.x / TILE_SIZE);
    const py = Math.floor(player.y / TILE_SIZE);

    if (py <= 0) { // North exit -> go to zone cy+1
        newKey = `${cx},${cy + 1}`;
        entryDir = 'north';
    } else if (py >= zone.height - 1) { // South exit -> go to zone cy-1
        newKey = `${cx},${cy - 1}`;
        entryDir = 'south';
    } else if (px >= zone.width - 1) { // East exit -> go to zone cx+1
        newKey = `${cx + 1},${cy}`;
        entryDir = 'east';
    } else if (px <= 0) { // West exit -> go to zone cx-1
        newKey = `${cx - 1},${cy}`;
        entryDir = 'west';
    }

    if (newKey && zones[newKey]) {
        currentZoneKey = newKey;
        loadZone(zones[newKey], entryDir);
    }
}

function canMoveTo(x, y) {
    const zone = currentZone;
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);

    if (tx < 0 || tx >= zone.width || ty < 0 || ty >= zone.height) return false;
    const tile = zone.tiles[ty][tx];
    return tile === 0 || tile === 3;
}

// Effects
function createSlashEffect(x, y, dir) {
    const effect = new PIXI.Graphics();
    effect.lineStyle(3, 0xffffff);
    effect.arc(0, 0, 25, -Math.PI / 4, Math.PI / 4);
    effect.x = x;
    effect.y = y;
    effect.rotation = Math.atan2(dir.y, dir.x);
    effect.life = 0.15;
    effectsContainer.addChild(effect);
    effects.push(effect);
}

function createHitEffect(x, y) {
    const effect = new PIXI.Graphics();
    effect.beginFill(0xffaa00);
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const dist = 8 + Math.random() * 8;
        effect.drawCircle(Math.cos(angle) * dist, Math.sin(angle) * dist, 3);
    }
    effect.endFill();
    effect.x = x;
    effect.y = y;
    effect.life = 0.2;
    effectsContainer.addChild(effect);
    effects.push(effect);
}

function showFloatingText(x, y, text, color) {
    const t = new PIXI.Text(text, {
        fontSize: 14,
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

        if (e.vy !== undefined) {
            e.y += e.vy * dt;
        }

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

    // Screen shake
    if (screenShake > 0) {
        targetX += (Math.random() - 0.5) * screenShake;
        targetY += (Math.random() - 0.5) * screenShake;
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }

    gameContainer.x = targetX;
    gameContainer.y = targetY;
}

// UI
const uiGraphics = new PIXI.Graphics();
uiContainer.addChild(uiGraphics);

const uiTexts = {};
function createUI() {
    const style = { fontSize: 12, fill: 0xffffff };

    uiTexts.hp = new PIXI.Text('', style);
    uiTexts.hp.x = 10;
    uiTexts.hp.y = 10;

    uiTexts.stamina = new PIXI.Text('', style);
    uiTexts.stamina.x = 10;
    uiTexts.stamina.y = 30;

    uiTexts.level = new PIXI.Text('', style);
    uiTexts.level.x = 10;
    uiTexts.level.y = 50;

    uiTexts.gold = new PIXI.Text('', style);
    uiTexts.gold.x = APP_WIDTH - 100;
    uiTexts.gold.y = 10;

    uiTexts.quest = new PIXI.Text('', { fontSize: 11, fill: 0xaaaaaa });
    uiTexts.quest.x = 10;
    uiTexts.quest.y = APP_HEIGHT - 60;

    uiTexts.zone = new PIXI.Text('', { fontSize: 12, fill: 0xaaaaaa });
    uiTexts.zone.x = APP_WIDTH - 120;
    uiTexts.zone.y = 30;

    uiTexts.controls = new PIXI.Text('WASD:Move  Click:Attack  Space:Dodge  E:Potion  I:Inventory', { fontSize: 10, fill: 0x666666 });
    uiTexts.controls.x = 10;
    uiTexts.controls.y = APP_HEIGHT - 20;

    for (const key in uiTexts) {
        uiContainer.addChild(uiTexts[key]);
    }
}

function updateUI() {
    // Draw bars
    uiGraphics.clear();

    // HP bar
    uiGraphics.beginFill(0x440000);
    uiGraphics.drawRect(70, 10, 100, 12);
    uiGraphics.endFill();
    uiGraphics.beginFill(0xff4444);
    uiGraphics.drawRect(70, 10, 100 * (player.hp / player.maxHp), 12);
    uiGraphics.endFill();

    // Stamina bar
    uiGraphics.beginFill(0x004400);
    uiGraphics.drawRect(70, 30, 100, 12);
    uiGraphics.endFill();
    uiGraphics.beginFill(0x44ff44);
    uiGraphics.drawRect(70, 30, 100 * (player.stamina / player.maxStamina), 12);
    uiGraphics.endFill();

    // XP bar
    uiGraphics.beginFill(0x444400);
    uiGraphics.drawRect(70, 50, 100, 12);
    uiGraphics.endFill();
    uiGraphics.beginFill(0xffff44);
    uiGraphics.drawRect(70, 50, 100 * (player.xp / player.xpToLevel), 12);
    uiGraphics.endFill();

    // Screen flash
    if (screenFlash > 0) {
        uiGraphics.beginFill(0xff0000, screenFlash * 0.5);
        uiGraphics.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
        uiGraphics.endFill();
        screenFlash -= 0.02;
    }

    uiTexts.hp.text = `HP:`;
    uiTexts.stamina.text = `ST:`;
    uiTexts.level.text = `LV:${player.level}`;
    uiTexts.gold.text = `Gold: ${player.gold}`;

    // Zone indicator
    const biomeNames = { village: 'Village', forest: 'Forest', snow: 'Snow Ruins', mountain: 'Mountain' };
    uiTexts.zone.text = biomeNames[currentZone.biome];

    // Active quest
    const activeQuest = quests.find(q => !q.complete);
    if (activeQuest) {
        uiTexts.quest.text = `Quest: ${activeQuest.name}\n${activeQuest.desc}`;
    } else {
        uiTexts.quest.text = 'All quests complete!';
    }
}

// Shop
function openShop() {
    state = GameState.SHOP;
    overlayContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.8);
    bg.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
    bg.endFill();
    overlayContainer.addChild(bg);

    const title = new PIXI.Text("BLACKSMITH", { fontSize: 24, fill: 0xffffff });
    title.x = APP_WIDTH / 2 - 60;
    title.y = 50;
    overlayContainer.addChild(title);

    const shopItems = [
        { item: { ...WEAPONS.steel_sword }, type: 'weapon', price: 120 },
        { item: { ...WEAPONS.steel_greatsword }, type: 'weapon', price: 180 },
        { item: { ...ARMORS.iron }, type: 'armor', price: 100 },
        { item: { ...ARMORS.steel }, type: 'armor', price: 200 },
        { item: { type: 'potion', name: 'Health Potion', healAmount: 50, value: 30 }, type: 'consumable', price: 40 }
    ];

    shopItems.forEach((si, idx) => {
        const y = 120 + idx * 50;

        const itemText = new PIXI.Text(`${si.item.name} - ${si.price} gold`, { fontSize: 14, fill: 0xffffff });
        itemText.x = 200;
        itemText.y = y;
        overlayContainer.addChild(itemText);

        const buyBtn = new PIXI.Graphics();
        buyBtn.beginFill(0x446644);
        buyBtn.drawRect(0, 0, 60, 25);
        buyBtn.endFill();
        buyBtn.x = 500;
        buyBtn.y = y - 5;
        buyBtn.eventMode = 'static';
        buyBtn.cursor = 'pointer';
        buyBtn.on('pointerdown', () => buyItem(si));
        overlayContainer.addChild(buyBtn);

        const btnText = new PIXI.Text('Buy', { fontSize: 12, fill: 0xffffff });
        btnText.x = 515;
        btnText.y = y;
        overlayContainer.addChild(btnText);
    });

    const goldText = new PIXI.Text(`Your Gold: ${player.gold}`, { fontSize: 16, fill: 0xffff00 });
    goldText.x = 200;
    goldText.y = 400;
    overlayContainer.addChild(goldText);

    const closeText = new PIXI.Text('Press ESC to close', { fontSize: 12, fill: 0x888888 });
    closeText.x = APP_WIDTH / 2 - 60;
    closeText.y = 450;
    overlayContainer.addChild(closeText);
}

function buyItem(shopItem) {
    if (player.gold >= shopItem.price) {
        player.gold -= shopItem.price;

        if (shopItem.type === 'weapon') {
            player.weapon = shopItem.item;
            showFloatingText(player.x, player.y, `Bought ${shopItem.item.name}!`, 0x44ff44);
        } else if (shopItem.type === 'armor') {
            player.armor = shopItem.item;
            showFloatingText(player.x, player.y, `Bought ${shopItem.item.name}!`, 0x44ff44);
        } else {
            player.inventory.push(shopItem.item);
            showFloatingText(player.x, player.y, `Bought ${shopItem.item.name}!`, 0x44ff44);
        }

        closeOverlay();
        openShop(); // Refresh
    }
}

// Dialogue
function openDialogue(npc) {
    state = GameState.DIALOGUE;
    overlayContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.7);
    bg.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
    bg.endFill();
    overlayContainer.addChild(bg);

    const box = new PIXI.Graphics();
    box.beginFill(0x222233);
    box.drawRoundedRect(100, 350, 600, 150, 10);
    box.endFill();
    overlayContainer.addChild(box);

    const nameText = new PIXI.Text(npc.name, { fontSize: 18, fill: 0xffff00 });
    nameText.x = 120;
    nameText.y = 365;
    overlayContainer.addChild(nameText);

    const dialogueText = new PIXI.Text(npc.dialogue, { fontSize: 14, fill: 0xffffff, wordWrap: true, wordWrapWidth: 560 });
    dialogueText.x = 120;
    dialogueText.y = 400;
    overlayContainer.addChild(dialogueText);

    const closeText = new PIXI.Text('Press ESC to close', { fontSize: 12, fill: 0x888888 });
    closeText.x = 120;
    closeText.y = 470;
    overlayContainer.addChild(closeText);
}

// Inventory
function openInventory() {
    state = GameState.INVENTORY;
    overlayContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.8);
    bg.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
    bg.endFill();
    overlayContainer.addChild(bg);

    const title = new PIXI.Text("INVENTORY", { fontSize: 24, fill: 0xffffff });
    title.x = APP_WIDTH / 2 - 50;
    title.y = 30;
    overlayContainer.addChild(title);

    // Stats
    const stats = new PIXI.Text(
        `Level: ${player.level}  HP: ${player.hp}/${player.maxHp}  Gold: ${player.gold}\n` +
        `Weapon: ${player.weapon.name} (${player.weapon.damage[0]}-${player.weapon.damage[1]} dmg)\n` +
        `Armor: ${player.armor ? player.armor.name + ' (' + player.armor.defense + ' def)' : 'None'}`,
        { fontSize: 14, fill: 0xaaaaaa }
    );
    stats.x = 50;
    stats.y = 80;
    overlayContainer.addChild(stats);

    // Items
    const itemsTitle = new PIXI.Text("Items:", { fontSize: 16, fill: 0xffffff });
    itemsTitle.x = 50;
    itemsTitle.y = 160;
    overlayContainer.addChild(itemsTitle);

    player.inventory.forEach((item, idx) => {
        const itemText = new PIXI.Text(`${idx + 1}. ${item.name}`, { fontSize: 14, fill: 0xcccccc });
        itemText.x = 70;
        itemText.y = 190 + idx * 25;
        overlayContainer.addChild(itemText);
    });

    // Quests
    const questsTitle = new PIXI.Text("Quests:", { fontSize: 16, fill: 0xffffff });
    questsTitle.x = 400;
    questsTitle.y = 160;
    overlayContainer.addChild(questsTitle);

    quests.forEach((quest, idx) => {
        const status = quest.complete ? '[COMPLETE]' : '[Active]';
        const color = quest.complete ? 0x44ff44 : 0xffff44;
        const questText = new PIXI.Text(`${status} ${quest.name}`, { fontSize: 12, fill: color });
        questText.x = 400;
        questText.y = 190 + idx * 40;
        overlayContainer.addChild(questText);

        const descText = new PIXI.Text(quest.desc, { fontSize: 10, fill: 0x888888 });
        descText.x = 400;
        descText.y = 205 + idx * 40;
        overlayContainer.addChild(descText);
    });

    // Perks
    const perksTitle = new PIXI.Text("Perks (Perk Points: " + player.perkPoints + "):", { fontSize: 16, fill: 0xffffff });
    perksTitle.x = 50;
    perksTitle.y = 350;
    overlayContainer.addChild(perksTitle);

    let perkY = 380;
    for (const perkId in PERKS) {
        const perk = PERKS[perkId];
        const owned = player.perks.includes(perkId);
        const canBuy = !owned && player.level >= perk.level && player.perkPoints > 0;

        const perkText = new PIXI.Text(
            `${perk.name} (Lv${perk.level}): ${perk.desc} ${owned ? '[OWNED]' : ''}`,
            { fontSize: 12, fill: owned ? 0x44ff44 : (canBuy ? 0xffffff : 0x666666) }
        );
        perkText.x = 70;
        perkText.y = perkY;
        overlayContainer.addChild(perkText);

        if (canBuy) {
            const btn = new PIXI.Graphics();
            btn.beginFill(0x446644);
            btn.drawRect(0, 0, 50, 20);
            btn.endFill();
            btn.x = 500;
            btn.y = perkY - 3;
            btn.eventMode = 'static';
            btn.cursor = 'pointer';
            btn.on('pointerdown', () => {
                player.perks.push(perkId);
                player.perkPoints--;
                if (perkId === 'warriors_resolve') player.maxHp += 20;
                closeOverlay();
                openInventory();
            });
            overlayContainer.addChild(btn);

            const btnText = new PIXI.Text('Learn', { fontSize: 10, fill: 0xffffff });
            btnText.x = 510;
            btnText.y = perkY;
            overlayContainer.addChild(btnText);
        }

        perkY += 30;
    }

    const closeText = new PIXI.Text('Press I or ESC to close', { fontSize: 12, fill: 0x888888 });
    closeText.x = APP_WIDTH / 2 - 70;
    closeText.y = APP_HEIGHT - 40;
    overlayContainer.addChild(closeText);
}

function closeOverlay() {
    overlayContainer.removeChildren();
    state = GameState.PLAYING;
}

// Game Over / Victory
function gameOver() {
    state = GameState.GAME_OVER;
    overlayContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.9);
    bg.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
    bg.endFill();
    overlayContainer.addChild(bg);

    const text = new PIXI.Text("YOU DIED", { fontSize: 48, fill: 0xff4444 });
    text.anchor.set(0.5);
    text.x = APP_WIDTH / 2;
    text.y = APP_HEIGHT / 2 - 50;
    overlayContainer.addChild(text);

    const restart = new PIXI.Text("Press SPACE to restart", { fontSize: 16, fill: 0x888888 });
    restart.anchor.set(0.5);
    restart.x = APP_WIDTH / 2;
    restart.y = APP_HEIGHT / 2 + 50;
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

    const text = new PIXI.Text("VICTORY!", { fontSize: 48, fill: 0x44ff44 });
    text.anchor.set(0.5);
    text.x = APP_WIDTH / 2;
    text.y = APP_HEIGHT / 2 - 80;
    overlayContainer.addChild(text);

    const sub = new PIXI.Text("You have cleared all dungeons and saved Skyrim!", { fontSize: 16, fill: 0xffffff });
    sub.anchor.set(0.5);
    sub.x = APP_WIDTH / 2;
    sub.y = APP_HEIGHT / 2 - 20;
    overlayContainer.addChild(sub);

    const stats = new PIXI.Text(
        `Level: ${player.level}\nGold Collected: ${player.gold}\nEnemies Slain: Many`,
        { fontSize: 14, fill: 0xaaaaaa }
    );
    stats.anchor.set(0.5);
    stats.x = APP_WIDTH / 2;
    stats.y = APP_HEIGHT / 2 + 50;
    overlayContainer.addChild(stats);

    const restart = new PIXI.Text("Press SPACE to play again", { fontSize: 16, fill: 0x888888 });
    restart.anchor.set(0.5);
    restart.x = APP_WIDTH / 2;
    restart.y = APP_HEIGHT / 2 + 120;
    overlayContainer.addChild(restart);
}

// Menu
function createMenu() {
    menuContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x1a2a3a);
    bg.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text("FROSTFALL", { fontSize: 48, fill: 0x88ccff, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = APP_WIDTH / 2;
    title.y = 120;
    menuContainer.addChild(title);

    const subtitle = new PIXI.Text("A Skyrim 2D Demake", { fontSize: 20, fill: 0x668899 });
    subtitle.anchor.set(0.5);
    subtitle.x = APP_WIDTH / 2;
    subtitle.y = 170;
    menuContainer.addChild(subtitle);

    const instructions = [
        "WASD - Move",
        "SHIFT - Sprint",
        "Mouse Click - Attack",
        "SPACE - Dodge Roll",
        "E - Use Potion",
        "I - Inventory",
        "F - Interact with NPCs",
        "",
        "Clear all 3 dungeons to win!",
        "South: Forest | East: Snow | North: Mountain"
    ];

    instructions.forEach((line, idx) => {
        const text = new PIXI.Text(line, { fontSize: 14, fill: 0xaaaaaa });
        text.anchor.set(0.5);
        text.x = APP_WIDTH / 2;
        text.y = 250 + idx * 22;
        menuContainer.addChild(text);
    });

    const start = new PIXI.Text("Press SPACE to begin your adventure", { fontSize: 18, fill: 0x44ff44 });
    start.anchor.set(0.5);
    start.x = APP_WIDTH / 2;
    start.y = 520;
    menuContainer.addChild(start);
}

function startGame() {
    menuContainer.visible = false;
    overlayContainer.removeChildren();

    state = GameState.PLAYING;
    quests = JSON.parse(JSON.stringify(QUESTS));

    generateWorld();

    // Start player in village center
    player = new Player(20 * TILE_SIZE, 15 * TILE_SIZE);

    currentZoneKey = '0,0';
    loadZone(zones['0,0']);

    createUI();
}

// NPC Interaction
let interactCooldown = 0;

function checkNPCInteraction() {
    if (keys['f'] && interactCooldown <= 0) {
        for (const npc of npcs) {
            const dx = npc.x - player.x;
            const dy = npc.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 40) {
                npc.interact();
                interactCooldown = 0.5;
                break;
            }
        }
    }
}

// Main loop
let lastEscState = false;
let lastIState = false;

app.ticker.add((delta) => {
    // Menu state
    if (state === GameState.MENU) {
        if (keys[' ']) {
            startGame();
        }
        return;
    }

    // Game over / Victory restart
    if (state === GameState.GAME_OVER || state === GameState.VICTORY) {
        if (keys[' ']) {
            location.reload();
        }
        return;
    }

    // ESC to close overlays
    if (keys['escape'] && !lastEscState) {
        if (state !== GameState.PLAYING) {
            closeOverlay();
        }
    }
    lastEscState = keys['escape'];

    // I for inventory
    if (keys['i'] && !lastIState) {
        if (state === GameState.PLAYING) {
            openInventory();
        } else if (state === GameState.INVENTORY) {
            closeOverlay();
        }
    }
    lastIState = keys['i'];

    // Playing state
    if (state === GameState.PLAYING) {
        player.update(delta);

        for (const enemy of enemies) {
            enemy.update(delta);
        }

        checkNPCInteraction();
        if (interactCooldown > 0) interactCooldown -= delta / 60;

        updateEffects(delta);
        updateCamera();
        updateUI();
    }

    // Reset click
    mouse.clicked = false;
});

// Initialize
createMenu();
