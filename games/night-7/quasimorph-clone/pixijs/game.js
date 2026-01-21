// Quasimorph Clone - PixiJS
// Turn-based tactical extraction roguelike with corruption mechanics

const APP_WIDTH = 800;
const APP_HEIGHT = 600;
const TILE_SIZE = 32;
const VIEW_TILES_X = 20;
const VIEW_TILES_Y = 14;
const VISION_RANGE = 6;

const app = new PIXI.Application({
    width: APP_WIDTH,
    height: APP_HEIGHT,
    backgroundColor: 0x0a0a12
});
document.body.appendChild(app.view);

// Game State
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PLAYER_TURN: 'player_turn',
    ENEMY_TURN: 'enemy_turn',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// Room Types
const RoomType = {
    STORAGE: 'storage',
    BARRACKS: 'barracks',
    MEDICAL: 'medical',
    ARMORY: 'armory',
    CORRIDOR: 'corridor'
};

// Weapon definitions
const WEAPONS = {
    knife: { name: 'Knife', apCost: 1, range: 1, accuracy: 0.9, damage: [20, 30], ammoType: null, maxDurability: 50, silent: true },
    pistol: { name: 'Pistol', apCost: 1, range: 6, accuracy: 0.75, damage: [15, 20], ammoType: '9mm', maxDurability: 30 },
    smg: { name: 'SMG', apCost: 1, range: 5, accuracy: 0.6, damage: [10, 15], ammoType: '9mm', burst: 3, maxDurability: 25 },
    shotgun: { name: 'Shotgun', apCost: 2, range: 3, accuracy: 0.8, damage: [25, 40], ammoType: '12g', maxDurability: 20 }
};

// Enemy definitions
const ENEMY_TYPES = {
    guard: { name: 'Guard', hp: 50, ap: 2, weapon: 'pistol', behavior: 'patrol', color: 0x4444aa },
    soldier: { name: 'Soldier', hp: 75, ap: 2, weapon: 'smg', behavior: 'aggressive', color: 0x2222cc },
    possessed: { name: 'Possessed', hp: 80, ap: 3, damage: [15, 25], behavior: 'hunt', corrupted: true, color: 0x8800aa },
    bloater: { name: 'Bloater', hp: 150, ap: 1, damage: [30, 50], behavior: 'slow', corrupted: true, explodes: true, color: 0x448844 },
    stalker: { name: 'Stalker', hp: 60, ap: 4, damage: [10, 20], behavior: 'ambush', corrupted: true, color: 0x660066 }
};

// Corruption thresholds
const CORRUPTION_TIERS = [
    { min: 0, max: 199, name: 'Normal', transformChance: 0, color: 0x1a1a2a },
    { min: 200, max: 399, name: 'Unease', transformChance: 0.1, color: 0x2a1a2a },
    { min: 400, max: 599, name: 'Spreading', transformChance: 0.25, color: 0x3a1a2a },
    { min: 600, max: 799, name: 'Critical', transformChance: 0.5, color: 0x4a1a3a },
    { min: 800, max: 999, name: 'Rapture', transformChance: 1.0, color: 0x5a1a4a },
    { min: 1000, max: 9999, name: 'Breach', transformChance: 1.0, blocked: true, color: 0x6a1a5a }
];

// Containers
const gameContainer = new PIXI.Container();
const worldContainer = new PIXI.Container();
const fogContainer = new PIXI.Container();
const entityContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();
const menuContainer = new PIXI.Container();

gameContainer.addChild(worldContainer);
gameContainer.addChild(fogContainer);
gameContainer.addChild(entityContainer);
gameContainer.addChild(uiContainer);
app.stage.addChild(gameContainer);
app.stage.addChild(menuContainer);

// Game variables
let state = GameState.MENU;
let map = [];
let mapWidth = 0;
let mapHeight = 0;
let player = null;
let enemies = [];
let items = [];
let turn = 0;
let corruption = 0;
let score = 0;
let extractionPoint = { x: 0, y: 0 };
let visibleTiles = new Set();
let exploredTiles = new Set();
let floatingTexts = [];
let turnIndicator = null;
let enemyTurnIndex = 0;
let enemyAnimating = false;

// Input
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hp = 100;
        this.maxHp = 100;
        this.ap = 2;
        this.maxAp = 2;
        this.stance = 'walk'; // walk = 2ap, run = 3ap
        this.bleeding = false;

        this.weapons = [
            { ...WEAPONS.knife, durability: 50 },
            null
        ];
        this.currentWeapon = 0;
        this.ammo = { '9mm': 30, '12g': 10 };
        this.inventory = [];
        this.maxInventory = 6;

        this.sprite = new PIXI.Graphics();
        this.updateSprite();
        entityContainer.addChild(this.sprite);
    }

    updateSprite() {
        this.sprite.clear();
        this.sprite.beginFill(0x00aaff);
        this.sprite.drawCircle(TILE_SIZE/2, TILE_SIZE/2, TILE_SIZE/3);
        this.sprite.endFill();
        // Direction indicator
        this.sprite.beginFill(0xffffff);
        this.sprite.drawCircle(TILE_SIZE/2 + 8, TILE_SIZE/2 - 4, 4);
        this.sprite.endFill();
    }

    getWeapon() {
        return this.weapons[this.currentWeapon];
    }

    canMove(dx, dy) {
        const nx = this.x + dx;
        const ny = this.y + dy;
        if (nx < 0 || nx >= mapWidth || ny < 0 || ny >= mapHeight) return false;
        return map[ny][nx] !== 1;
    }

    move(dx, dy) {
        if (this.ap < 1) {
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'No AP!', 0xff6666);
            return false;
        }
        if (!this.canMove(dx, dy)) return false;

        this.x += dx;
        this.y += dy;
        this.ap--;
        updateVisibility();
        checkAutoEndTurn();
        return true;
    }

    attack(enemy) {
        const weapon = this.getWeapon();
        if (!weapon) return false;
        if (this.ap < weapon.apCost) {
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'No AP!', 0xff6666);
            return false;
        }

        const dist = Math.abs(this.x - enemy.x) + Math.abs(this.y - enemy.y);
        if (dist > weapon.range) {
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'Too far!', 0xffaa00);
            return false;
        }

        // Check ammo
        if (weapon.ammoType && this.ammo[weapon.ammoType] <= 0) {
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'No ammo!', 0xff6666);
            return false;
        }

        this.ap -= weapon.apCost;
        weapon.durability--;
        if (weapon.ammoType) this.ammo[weapon.ammoType]--;

        // Accuracy check
        let hits = weapon.burst || 1;
        let totalDamage = 0;

        for (let i = 0; i < hits; i++) {
            if (Math.random() < weapon.accuracy) {
                const dmg = weapon.damage[0] + Math.floor(Math.random() * (weapon.damage[1] - weapon.damage[0] + 1));
                totalDamage += dmg;
            }
        }

        if (totalDamage > 0) {
            enemy.takeDamage(totalDamage);
            showFloatingText(enemy.x * TILE_SIZE, enemy.y * TILE_SIZE, `-${totalDamage}`, 0xff4444);
        } else {
            showFloatingText(enemy.x * TILE_SIZE, enemy.y * TILE_SIZE, 'MISS', 0xaaaaaa);
        }

        checkAutoEndTurn();
        return true;
    }

    reload() {
        const weapon = this.getWeapon();
        if (!weapon || !weapon.ammoType) return false;
        if (this.ap < 1) {
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'No AP!', 0xff6666);
            return false;
        }

        this.ap--;
        weapon.durability = Math.min(weapon.durability + 5, weapon.maxDurability);
        showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'Reloaded', 0x44ff44);
        checkAutoEndTurn();
        return true;
    }

    takeDamage(amount) {
        this.hp -= amount;
        showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, `-${amount}`, 0xff0000);
        if (this.hp <= 0) {
            this.hp = 0;
            gameOver(false);
        }
    }

    useItem(index) {
        if (index >= this.inventory.length) return false;
        const item = this.inventory[index];

        if (item.type === 'bandage') {
            this.hp = Math.min(this.maxHp, this.hp + 10);
            this.bleeding = false;
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, '+10 HP', 0x44ff44);
        } else if (item.type === 'medkit') {
            this.hp = Math.min(this.maxHp, this.hp + 30);
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, '+30 HP', 0x44ff44);
        } else if (item.type === 'cigarettes') {
            corruption = Math.max(0, corruption - 25);
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, '-25 Corruption', 0x8844ff);
        }

        this.inventory.splice(index, 1);
        return true;
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
        this.ap = def.ap;
        this.maxAp = def.ap;
        this.weapon = def.weapon ? { ...WEAPONS[def.weapon] } : null;
        this.damage = def.damage;
        this.behavior = def.behavior;
        this.corrupted = def.corrupted || false;
        this.explodes = def.explodes || false;
        this.alerted = false;
        this.lastSeenPlayer = null;

        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(def.color);
        if (this.corrupted) {
            this.sprite.drawPolygon([
                TILE_SIZE/2, 4,
                TILE_SIZE - 4, TILE_SIZE - 4,
                4, TILE_SIZE - 4
            ]);
        } else {
            this.sprite.drawRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
        }
        this.sprite.endFill();

        this.hpBar = new PIXI.Graphics();
        this.updateHpBar();
        this.sprite.addChild(this.hpBar);

        entityContainer.addChild(this.sprite);
    }

    updateHpBar() {
        this.hpBar.clear();
        this.hpBar.beginFill(0x440000);
        this.hpBar.drawRect(0, -6, TILE_SIZE, 4);
        this.hpBar.endFill();
        this.hpBar.beginFill(0xff4444);
        this.hpBar.drawRect(0, -6, TILE_SIZE * (this.hp / this.maxHp), 4);
        this.hpBar.endFill();
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.alerted = true;
        this.updateHpBar();

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        if (this.explodes) {
            // Bloater explosion
            const dist = Math.abs(player.x - this.x) + Math.abs(player.y - this.y);
            if (dist <= 2) {
                const dmg = 30 + Math.floor(Math.random() * 20);
                player.takeDamage(dmg);
            }
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'BOOM!', 0xffaa00);
        }

        score += this.corrupted ? 50 : 25;
        entityContainer.removeChild(this.sprite);
        enemies = enemies.filter(e => e !== this);
    }

    canSeePlayer() {
        const dist = Math.abs(player.x - this.x) + Math.abs(player.y - this.y);
        if (dist > VISION_RANGE) return false;
        return hasLineOfSight(this.x, this.y, player.x, player.y);
    }

    takeTurn() {
        this.ap = this.maxAp;

        if (this.canSeePlayer()) {
            this.alerted = true;
            this.lastSeenPlayer = { x: player.x, y: player.y };
        }

        while (this.ap > 0) {
            const dist = Math.abs(player.x - this.x) + Math.abs(player.y - this.y);

            // Try to attack
            if (this.canSeePlayer()) {
                if (this.weapon && dist <= this.weapon.range) {
                    this.attackPlayer();
                    continue;
                } else if (!this.weapon && dist <= 1) {
                    this.meleeAttack();
                    continue;
                }
            }

            // Move towards player if alerted
            if (this.alerted && this.lastSeenPlayer) {
                const dx = Math.sign(this.lastSeenPlayer.x - this.x);
                const dy = Math.sign(this.lastSeenPlayer.y - this.y);

                if (this.tryMove(dx, 0) || this.tryMove(0, dy) || this.tryMove(dx, dy)) {
                    continue;
                }
            }

            // Random patrol
            if (this.behavior === 'patrol') {
                const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                const dir = dirs[Math.floor(Math.random() * dirs.length)];
                this.tryMove(dir[0], dir[1]);
            }

            this.ap--;
        }
    }

    tryMove(dx, dy) {
        const nx = this.x + dx;
        const ny = this.y + dy;

        if (nx < 0 || nx >= mapWidth || ny < 0 || ny >= mapHeight) return false;
        if (map[ny][nx] === 1) return false;
        if (nx === player.x && ny === player.y) return false;
        if (enemies.some(e => e !== this && e.x === nx && e.y === ny)) return false;

        this.x = nx;
        this.y = ny;
        this.ap--;
        return true;
    }

    attackPlayer() {
        if (!this.weapon) return;
        this.ap -= this.weapon.apCost;

        // Show attack animation
        showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'ATTACK!', 0xff8800);

        if (Math.random() < this.weapon.accuracy) {
            const dmg = this.weapon.damage[0] + Math.floor(Math.random() * (this.weapon.damage[1] - this.weapon.damage[0] + 1));
            player.takeDamage(dmg);
        } else {
            showFloatingText(player.x * TILE_SIZE, player.y * TILE_SIZE, 'MISS', 0xaaaaaa);
        }
    }

    meleeAttack() {
        this.ap--;
        showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'ATTACK!', 0xff8800);

        if (Math.random() < 0.8) {
            const dmg = this.damage[0] + Math.floor(Math.random() * (this.damage[1] - this.damage[0] + 1));
            player.takeDamage(dmg);
        } else {
            showFloatingText(player.x * TILE_SIZE, player.y * TILE_SIZE, 'MISS', 0xaaaaaa);
        }
    }
}

// Item class
class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;

        this.sprite = new PIXI.Graphics();

        const colors = {
            bandage: 0xffffff,
            medkit: 0xff4444,
            cigarettes: 0xffaa44,
            pistol: 0x888888,
            smg: 0x666666,
            shotgun: 0x444444,
            ammo_9mm: 0xaaaa44,
            ammo_12g: 0xaa4444
        };

        this.sprite.beginFill(colors[type] || 0xffff00);
        this.sprite.drawRect(8, 8, TILE_SIZE - 16, TILE_SIZE - 16);
        this.sprite.endFill();

        entityContainer.addChild(this.sprite);
    }

    pickup() {
        if (this.type === 'ammo_9mm') {
            player.ammo['9mm'] += 12;
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, '+12 9mm', 0xffff44);
        } else if (this.type === 'ammo_12g') {
            player.ammo['12g'] += 6;
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, '+6 12g', 0xffff44);
        } else if (['pistol', 'smg', 'shotgun'].includes(this.type)) {
            if (!player.weapons[1]) {
                player.weapons[1] = { ...WEAPONS[this.type], durability: WEAPONS[this.type].maxDurability };
                showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, `Got ${WEAPONS[this.type].name}!`, 0x44ff44);
            } else {
                return false; // Can't carry more weapons
            }
        } else {
            if (player.inventory.length >= player.maxInventory) return false;
            player.inventory.push({ type: this.type, name: this.type });
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, `Got ${this.type}!`, 0x44ff44);
        }

        score += 10;
        entityContainer.removeChild(this.sprite);
        items = items.filter(i => i !== this);
        return true;
    }
}

// Map Generation
function generateMap() {
    mapWidth = 40;
    mapHeight = 30;
    map = [];

    // Fill with walls
    for (let y = 0; y < mapHeight; y++) {
        map[y] = [];
        for (let x = 0; x < mapWidth; x++) {
            map[y][x] = 1;
        }
    }

    // Generate rooms
    const rooms = [];
    const roomTypes = [RoomType.STORAGE, RoomType.BARRACKS, RoomType.MEDICAL, RoomType.ARMORY, RoomType.CORRIDOR];

    for (let i = 0; i < 12; i++) {
        const w = 4 + Math.floor(Math.random() * 5);
        const h = 4 + Math.floor(Math.random() * 4);
        const x = 1 + Math.floor(Math.random() * (mapWidth - w - 2));
        const y = 1 + Math.floor(Math.random() * (mapHeight - h - 2));

        // Check overlap
        let overlaps = false;
        for (const room of rooms) {
            if (x < room.x + room.w + 1 && x + w + 1 > room.x &&
                y < room.y + room.h + 1 && y + h + 1 > room.y) {
                overlaps = true;
                break;
            }
        }

        if (!overlaps) {
            rooms.push({ x, y, w, h, type: roomTypes[Math.floor(Math.random() * roomTypes.length)] });

            // Carve room
            for (let ry = y; ry < y + h; ry++) {
                for (let rx = x; rx < x + w; rx++) {
                    map[ry][rx] = 0;
                }
            }
        }
    }

    // Connect rooms with corridors
    for (let i = 0; i < rooms.length - 1; i++) {
        const r1 = rooms[i];
        const r2 = rooms[i + 1];

        const x1 = Math.floor(r1.x + r1.w / 2);
        const y1 = Math.floor(r1.y + r1.h / 2);
        const x2 = Math.floor(r2.x + r2.w / 2);
        const y2 = Math.floor(r2.y + r2.h / 2);

        // L-shaped corridor
        let cx = x1;
        while (cx !== x2) {
            map[y1][cx] = 0;
            cx += Math.sign(x2 - x1);
        }
        let cy = y1;
        while (cy !== y2) {
            map[cy][x2] = 0;
            cy += Math.sign(y2 - y1);
        }
    }

    // Place player in first room
    const startRoom = rooms[0];
    player = new Player(
        startRoom.x + Math.floor(startRoom.w / 2),
        startRoom.y + Math.floor(startRoom.h / 2)
    );

    // Place extraction in last room
    const endRoom = rooms[rooms.length - 1];
    extractionPoint.x = endRoom.x + Math.floor(endRoom.w / 2);
    extractionPoint.y = endRoom.y + Math.floor(endRoom.h / 2);
    map[extractionPoint.y][extractionPoint.x] = 2; // Extraction marker

    // Spawn enemies
    enemies = [];
    for (let i = 1; i < rooms.length - 1; i++) {
        const room = rooms[i];
        const enemyCount = 1 + Math.floor(Math.random() * 2);

        for (let j = 0; j < enemyCount; j++) {
            const ex = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const ey = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

            const types = room.type === RoomType.BARRACKS ? ['soldier', 'soldier', 'guard'] : ['guard', 'guard', 'soldier'];
            const type = types[Math.floor(Math.random() * types.length)];

            enemies.push(new Enemy(ex, ey, type));
        }
    }

    // Spawn items based on room type
    items = [];
    for (const room of rooms) {
        let itemTypes = [];

        if (room.type === RoomType.MEDICAL) {
            itemTypes = ['medkit', 'bandage', 'bandage'];
        } else if (room.type === RoomType.ARMORY) {
            itemTypes = ['pistol', 'smg', 'shotgun', 'ammo_9mm', 'ammo_12g'];
        } else if (room.type === RoomType.STORAGE) {
            itemTypes = ['ammo_9mm', 'ammo_12g', 'cigarettes', 'bandage'];
        }

        if (itemTypes.length > 0 && Math.random() < 0.7) {
            const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            const ix = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
            const iy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
            items.push(new Item(ix, iy, itemType));
        }
    }

    renderMap();
}

function renderMap() {
    worldContainer.removeChildren();

    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            const tile = new PIXI.Graphics();

            if (map[y][x] === 1) {
                tile.beginFill(0x333344);
                tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
                tile.endFill();
                tile.lineStyle(1, 0x222233);
                tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
            } else if (map[y][x] === 2) {
                tile.beginFill(0x004400);
                tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
                tile.endFill();
                tile.lineStyle(2, 0x00ff00);
                tile.drawRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
            } else {
                tile.beginFill(0x1a1a2a);
                tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
                tile.endFill();
                tile.lineStyle(1, 0x111122);
                tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
            }

            tile.x = x * TILE_SIZE;
            tile.y = y * TILE_SIZE;
            worldContainer.addChild(tile);
        }
    }
}

// Visibility / Fog of War
function hasLineOfSight(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let cx = x1;
    let cy = y1;

    while (cx !== x2 || cy !== y2) {
        if (map[cy][cx] === 1) return false;

        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; cx += sx; }
        if (e2 < dx) { err += dx; cy += sy; }
    }

    return true;
}

function updateVisibility() {
    visibleTiles.clear();

    // Cast rays in all directions
    for (let angle = 0; angle < 360; angle += 2) {
        const rad = angle * Math.PI / 180;
        const dx = Math.cos(rad);
        const dy = Math.sin(rad);

        for (let dist = 0; dist <= VISION_RANGE; dist += 0.5) {
            const tx = Math.floor(player.x + dx * dist);
            const ty = Math.floor(player.y + dy * dist);

            if (tx < 0 || tx >= mapWidth || ty < 0 || ty >= mapHeight) break;

            const key = `${tx},${ty}`;
            visibleTiles.add(key);
            exploredTiles.add(key);

            if (map[ty][tx] === 1) break;
        }
    }

    updateFog();
}

function updateFog() {
    fogContainer.removeChildren();

    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            const key = `${x},${y}`;

            if (!visibleTiles.has(key)) {
                const fog = new PIXI.Graphics();

                if (exploredTiles.has(key)) {
                    fog.beginFill(0x000000, 0.6);
                } else {
                    fog.beginFill(0x000000, 1);
                }

                fog.drawRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                fog.endFill();
                fogContainer.addChild(fog);
            }
        }
    }
}

// Update entity positions
function updateEntities() {
    if (player) {
        player.sprite.x = player.x * TILE_SIZE;
        player.sprite.y = player.y * TILE_SIZE;
    }

    for (const enemy of enemies) {
        enemy.sprite.x = enemy.x * TILE_SIZE;
        enemy.sprite.y = enemy.y * TILE_SIZE;

        const key = `${enemy.x},${enemy.y}`;
        enemy.sprite.visible = visibleTiles.has(key);
    }

    for (const item of items) {
        item.sprite.x = item.x * TILE_SIZE;
        item.sprite.y = item.y * TILE_SIZE;

        const key = `${item.x},${item.y}`;
        item.sprite.visible = visibleTiles.has(key);
    }
}

// Camera
function updateCamera() {
    const targetX = player.x * TILE_SIZE - APP_WIDTH / 2 + TILE_SIZE / 2;
    const targetY = player.y * TILE_SIZE - APP_HEIGHT / 2 + TILE_SIZE / 2;

    gameContainer.x = -targetX;
    gameContainer.y = -targetY + 40; // Offset for UI
}

// Floating text
function showFloatingText(x, y, text, color) {
    const ft = new PIXI.Text(text, {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: color,
        fontWeight: 'bold',
        stroke: 0x000000,
        strokeThickness: 2
    });
    ft.x = x + TILE_SIZE / 2;
    ft.y = y;
    ft.anchor.set(0.5, 1);
    ft.alpha = 1;
    ft.vy = -2;
    ft.life = 60;

    entityContainer.addChild(ft);
    floatingTexts.push(ft);
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.life--;
        ft.alpha = ft.life / 60;

        if (ft.life <= 0) {
            entityContainer.removeChild(ft);
            floatingTexts.splice(i, 1);
        }
    }
}

// Turn system
function endPlayerTurn() {
    if (state !== GameState.PLAYER_TURN) return;

    state = GameState.ENEMY_TURN;
    showTurnIndicator('ENEMY TURN');
    enemyTurnIndex = 0;

    // Process bleeding
    if (player.bleeding) {
        player.hp--;
        showFloatingText(player.x * TILE_SIZE, player.y * TILE_SIZE, '-1 (bleed)', 0xaa0000);
    }

    // Increment corruption
    corruption += 10;
    turn++;

    // Check for enemy transformations
    processCorruption();
}

function processCorruption() {
    const tier = CORRUPTION_TIERS.find(t => corruption >= t.min && corruption <= t.max);

    // Transform human enemies
    for (const enemy of enemies) {
        if (!enemy.corrupted && Math.random() < tier.transformChance) {
            transformEnemy(enemy);
        }
    }

    // Update background color based on corruption
    app.renderer.background.color = tier.color;
}

function transformEnemy(enemy) {
    const transformTypes = ['possessed', 'bloater', 'stalker'];
    const newType = transformTypes[Math.floor(Math.random() * transformTypes.length)];

    const newEnemy = new Enemy(enemy.x, enemy.y, newType);
    enemies = enemies.filter(e => e !== enemy);
    entityContainer.removeChild(enemy.sprite);
    enemies.push(newEnemy);

    showFloatingText(enemy.x * TILE_SIZE, enemy.y * TILE_SIZE, 'TRANSFORMED!', 0xff00ff);
}

function processEnemyTurns() {
    if (enemyTurnIndex < enemies.length) {
        const enemy = enemies[enemyTurnIndex];
        enemy.takeTurn();
        enemyTurnIndex++;

        // Small delay between enemies
        setTimeout(() => processEnemyTurns(), 200);
    } else {
        // All enemies done, back to player
        startPlayerTurn();
    }
}

function startPlayerTurn() {
    state = GameState.PLAYER_TURN;
    player.ap = player.stance === 'run' ? 3 : 2;
    hideTurnIndicator();
    updateUI();
}

function checkAutoEndTurn() {
    if (player.ap <= 0) {
        setTimeout(() => endPlayerTurn(), 100);
    }
}

// Turn indicator
function showTurnIndicator(text) {
    if (!turnIndicator) {
        turnIndicator = new PIXI.Graphics();
        app.stage.addChild(turnIndicator);
    }

    turnIndicator.clear();
    turnIndicator.beginFill(0x000000, 0.8);
    turnIndicator.drawRoundedRect(APP_WIDTH / 2 - 100, 50, 200, 40, 10);
    turnIndicator.endFill();

    if (turnIndicator.textChild) {
        turnIndicator.removeChild(turnIndicator.textChild);
    }

    const t = new PIXI.Text(text, {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0xff4444,
        fontWeight: 'bold'
    });
    t.anchor.set(0.5);
    t.x = APP_WIDTH / 2;
    t.y = 70;
    turnIndicator.textChild = t;
    turnIndicator.addChild(t);
    turnIndicator.visible = true;

    // Start enemy turns after showing indicator
    setTimeout(() => processEnemyTurns(), 500);
}

function hideTurnIndicator() {
    if (turnIndicator) {
        turnIndicator.visible = false;
    }
}

// UI
const uiPanel = new PIXI.Graphics();
app.stage.addChild(uiPanel);

const uiTexts = {};

function createUI() {
    const style = {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xffffff
    };

    uiTexts.hp = new PIXI.Text('', style);
    uiTexts.hp.x = 10;
    uiTexts.hp.y = 5;

    uiTexts.ap = new PIXI.Text('', style);
    uiTexts.ap.x = 150;
    uiTexts.ap.y = 5;

    uiTexts.corruption = new PIXI.Text('', style);
    uiTexts.corruption.x = 250;
    uiTexts.corruption.y = 5;

    uiTexts.turn = new PIXI.Text('', style);
    uiTexts.turn.x = 420;
    uiTexts.turn.y = 5;

    uiTexts.weapon = new PIXI.Text('', style);
    uiTexts.weapon.x = 10;
    uiTexts.weapon.y = 22;

    uiTexts.ammo = new PIXI.Text('', style);
    uiTexts.ammo.x = 200;
    uiTexts.ammo.y = 22;

    uiTexts.score = new PIXI.Text('', style);
    uiTexts.score.x = 520;
    uiTexts.score.y = 5;

    uiTexts.controls = new PIXI.Text('WASD:Move  1/2:Weapon  R:Reload  E:Pickup  Enter:EndTurn', { fontFamily: 'Arial', fontSize: 10, fill: 0x888888 });
    uiTexts.controls.x = 10;
    uiTexts.controls.y = APP_HEIGHT - 15;

    for (const key in uiTexts) {
        app.stage.addChild(uiTexts[key]);
    }
}

function updateUI() {
    if (!player) return;

    uiPanel.clear();
    uiPanel.beginFill(0x111122, 0.9);
    uiPanel.drawRect(0, 0, APP_WIDTH, 40);
    uiPanel.endFill();

    const tier = CORRUPTION_TIERS.find(t => corruption >= t.min && corruption <= t.max);

    uiTexts.hp.text = `HP: ${player.hp}/${player.maxHp}`;
    uiTexts.ap.text = `AP: ${player.ap}/${player.maxAp} (${player.stance})`;
    uiTexts.corruption.text = `Corruption: ${corruption} [${tier.name}]`;
    uiTexts.turn.text = `Turn: ${turn}`;
    uiTexts.score.text = `Score: ${score}`;

    const weapon = player.getWeapon();
    if (weapon) {
        uiTexts.weapon.text = `[${player.currentWeapon + 1}] ${weapon.name} (${weapon.durability}/${weapon.maxDurability})`;
    } else {
        uiTexts.weapon.text = '[No Weapon]';
    }

    uiTexts.ammo.text = `9mm: ${player.ammo['9mm']}  12g: ${player.ammo['12g']}`;

    // HP color
    uiTexts.hp.style.fill = player.hp > 50 ? 0x44ff44 : player.hp > 25 ? 0xffaa00 : 0xff4444;
}

// Input handling
let lastKeyState = {};

function handleInput() {
    if (state !== GameState.PLAYER_TURN) return;

    // Movement
    if (keys['w'] && !lastKeyState['w']) player.move(0, -1);
    if (keys['s'] && !lastKeyState['s']) player.move(0, 1);
    if (keys['a'] && !lastKeyState['a']) player.move(-1, 0);
    if (keys['d'] && !lastKeyState['d']) player.move(1, 0);

    // Weapon switch
    if (keys['1'] && !lastKeyState['1']) { player.currentWeapon = 0; updateUI(); }
    if (keys['2'] && !lastKeyState['2'] && player.weapons[1]) { player.currentWeapon = 1; updateUI(); }

    // Reload
    if (keys['r'] && !lastKeyState['r']) player.reload();

    // End turn
    if (keys['enter'] && !lastKeyState['enter']) endPlayerTurn();

    // Pickup
    if (keys['e'] && !lastKeyState['e']) {
        const item = items.find(i => i.x === player.x && i.y === player.y);
        if (item) item.pickup();
    }

    // Stance toggle
    if (keys['shift'] && !lastKeyState['shift']) {
        player.stance = player.stance === 'walk' ? 'run' : 'walk';
        player.maxAp = player.stance === 'run' ? 3 : 2;
        updateUI();
    }

    // Check extraction
    if (player.x === extractionPoint.x && player.y === extractionPoint.y) {
        const tier = CORRUPTION_TIERS.find(t => corruption >= t.min && corruption <= t.max);
        if (!tier.blocked) {
            gameOver(true);
        } else {
            showFloatingText(player.x * TILE_SIZE, player.y * TILE_SIZE, 'BLOCKED! Kill boss!', 0xff4444);
        }
    }

    lastKeyState = { ...keys };
}

// Mouse input for attacking
app.view.addEventListener('click', (e) => {
    if (state !== GameState.PLAYER_TURN) return;

    const rect = app.view.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - gameContainer.x;
    const mouseY = e.clientY - rect.top - gameContainer.y;

    const tileX = Math.floor(mouseX / TILE_SIZE);
    const tileY = Math.floor(mouseY / TILE_SIZE);

    // Check if clicked on enemy
    const enemy = enemies.find(en => en.x === tileX && en.y === tileY);
    if (enemy && visibleTiles.has(`${tileX},${tileY}`)) {
        player.attack(enemy);
    }
});

// Game over
function gameOver(victory) {
    if (victory) {
        state = GameState.VICTORY;
        score += player.hp * 2; // Bonus for remaining HP
        showEndScreen('EXTRACTION SUCCESSFUL!', 0x44ff44);
    } else {
        state = GameState.GAME_OVER;
        showEndScreen('CLONE LOST', 0xff4444);
    }
}

function showEndScreen(message, color) {
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.8);
    overlay.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
    overlay.endFill();
    app.stage.addChild(overlay);

    const text = new PIXI.Text(message, {
        fontFamily: 'Arial',
        fontSize: 36,
        fill: color,
        fontWeight: 'bold'
    });
    text.anchor.set(0.5);
    text.x = APP_WIDTH / 2;
    text.y = APP_HEIGHT / 2 - 50;
    app.stage.addChild(text);

    const scoreText = new PIXI.Text(`Final Score: ${score}`, {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff
    });
    scoreText.anchor.set(0.5);
    scoreText.x = APP_WIDTH / 2;
    scoreText.y = APP_HEIGHT / 2;
    app.stage.addChild(scoreText);

    const turnText = new PIXI.Text(`Survived ${turn} turns`, {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0xaaaaaa
    });
    turnText.anchor.set(0.5);
    turnText.x = APP_WIDTH / 2;
    turnText.y = APP_HEIGHT / 2 + 40;
    app.stage.addChild(turnText);

    const restartText = new PIXI.Text('Press SPACE to restart', {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0x888888
    });
    restartText.anchor.set(0.5);
    restartText.x = APP_WIDTH / 2;
    restartText.y = APP_HEIGHT / 2 + 100;
    app.stage.addChild(restartText);

    const restart = () => {
        if (keys[' ']) {
            window.removeEventListener('keydown', restart);
            location.reload();
        }
    };
    window.addEventListener('keydown', restart);
}

// Menu
function createMenu() {
    menuContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x0a0a12);
    bg.drawRect(0, 0, APP_WIDTH, APP_HEIGHT);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('QUASIMORPH', {
        fontFamily: 'Arial',
        fontSize: 48,
        fill: 0xff4444,
        fontWeight: 'bold'
    });
    title.anchor.set(0.5);
    title.x = APP_WIDTH / 2;
    title.y = 150;
    menuContainer.addChild(title);

    const subtitle = new PIXI.Text('Tactical Extraction Roguelike', {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0x888888
    });
    subtitle.anchor.set(0.5);
    subtitle.x = APP_WIDTH / 2;
    subtitle.y = 200;
    menuContainer.addChild(subtitle);

    const instructions = [
        'WASD - Move (costs 1 AP)',
        'Click Enemy - Attack',
        'R - Reload weapon',
        'E - Pickup items',
        '1/2 - Switch weapons',
        'SHIFT - Toggle Run/Walk stance',
        'ENTER - End turn early',
        '',
        'Reach the extraction point (green)',
        'Corruption rises each turn - don\'t stay too long!'
    ];

    for (let i = 0; i < instructions.length; i++) {
        const inst = new PIXI.Text(instructions[i], {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xaaaaaa
        });
        inst.anchor.set(0.5);
        inst.x = APP_WIDTH / 2;
        inst.y = 280 + i * 22;
        menuContainer.addChild(inst);
    }

    const startText = new PIXI.Text('Press SPACE to Deploy', {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0x44ff44
    });
    startText.anchor.set(0.5);
    startText.x = APP_WIDTH / 2;
    startText.y = 520;
    menuContainer.addChild(startText);
}

function startGame() {
    menuContainer.visible = false;
    state = GameState.PLAYER_TURN;

    generateMap();
    createUI();
    updateVisibility();
    updateEntities();
    updateCamera();
    updateUI();
}

// Main loop
app.ticker.add((delta) => {
    if (state === GameState.MENU) {
        if (keys[' ']) {
            startGame();
        }
        return;
    }

    if (state === GameState.PLAYER_TURN) {
        handleInput();
    }

    updateEntities();
    updateCamera();
    updateUI();
    updateFloatingTexts();
});

// Initialize
createMenu();
