// Binding of Isaac Clone - PixiJS
const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x1a1a2e,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    preferWebGLVersion: 1,
    hello: false
});
document.body.appendChild(app.view);

// Constants
const TILE_SIZE = 48;
const ROOM_WIDTH = 13;
const ROOM_HEIGHT = 7;
const ROOM_PIXEL_WIDTH = ROOM_WIDTH * TILE_SIZE;
const ROOM_PIXEL_HEIGHT = ROOM_HEIGHT * TILE_SIZE;

// Offsets for room centering
const ROOM_OFFSET_X = (800 - ROOM_PIXEL_WIDTH) / 2;
const ROOM_OFFSET_Y = 70; // Leave space for UI at top

// Game state
const gameState = {
    floor: 1,
    floorName: 'Basement',
    paused: false,
    gameOver: false,
    victory: false
};

// Input
const keys = {};
const shootDir = { x: 0, y: 0 };

// Player stats
const player = {
    x: 0,
    y: 0,
    speed: 3,
    damage: 3.5,
    tearRate: 10,
    tearSpeed: 8,
    range: 23,
    luck: 0,
    maxHealth: 6, // In half-hearts
    health: 6,
    soulHearts: 0,
    keys: 1,
    bombs: 1,
    coins: 0,
    tearCooldown: 0,
    invincible: 0,
    sprite: null,
    items: [],
    activeItem: null,
    activeCharges: 0
};

// Containers
const gameContainer = new PIXI.Container();
const roomContainer = new PIXI.Container();
const entityContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();

gameContainer.addChild(roomContainer);
gameContainer.addChild(entityContainer);
app.stage.addChild(gameContainer);
app.stage.addChild(uiContainer);

// Game objects
const tears = [];
const enemies = [];
const pickups = [];
const obstacles = [];

// Floor data
let currentFloor = null;
let currentRoomX = 0;
let currentRoomY = 0;
let rooms = {};

// Enemy definitions
const ENEMY_TYPES = {
    fly: { hp: 5, speed: 2.5, damage: 0.5, size: 20, color: 0x444444, behavior: 'chase' },
    gaper: { hp: 12, speed: 1.5, damage: 1, size: 28, color: 0xcc6666, behavior: 'chase' },
    pooter: { hp: 8, speed: 1, damage: 0.5, size: 24, color: 0x996666, behavior: 'shoot', shootRate: 2 },
    clotty: { hp: 25, speed: 0.8, damage: 0.5, size: 26, color: 0xaa4444, behavior: 'shoot4way', shootRate: 1.5 },
    host: { hp: 30, speed: 0, damage: 0.5, size: 30, color: 0x666633, behavior: 'popup' },
    fatty: { hp: 40, speed: 0.5, damage: 1, size: 36, color: 0xbb8866, behavior: 'chase' },
    mulligan: { hp: 20, speed: 1, damage: 1, size: 28, color: 0x998877, behavior: 'chase', spawnsOnDeath: 'fly' },
    horf: { hp: 15, speed: 0, damage: 0.5, size: 24, color: 0x77aa77, behavior: 'lineShoot' }
};

// Boss definitions
const BOSSES = {
    monstro: { hp: 250, size: 64, color: 0xcc5555 },
    larryJr: { hp: 180, size: 40, color: 0x55aa55 },
    dukeOfFlies: { hp: 200, size: 56, color: 0x666666 }
};

// Item definitions (30 MVP items)
const ITEMS = {
    // Stat items
    sadOnion: { name: 'Sad Onion', effect: 'tearRate', value: -0.7, pool: 'treasure', color: 0xffffaa },
    magicMushroom: { name: 'Magic Mushroom', effect: 'allStats', pool: 'treasure', color: 0xff6666 },
    pentagram: { name: 'Pentagram', effect: 'damage', value: 1, pool: 'devil', color: 0x880000 },
    speedBall: { name: 'Speed Ball', effect: 'speed', value: 0.3, pool: 'treasure', color: 0xffffff },
    stigmata: { name: 'Stigmata', effect: 'damageHealth', pool: 'treasure', color: 0xcc0000 },
    growthHormones: { name: 'Growth Hormones', effect: 'damageSpeed', pool: 'boss', color: 0x00cc00 },
    healthUp: { name: 'Health Up', effect: 'health', value: 2, pool: 'boss', color: 0xff0000 },
    // Tear modifiers
    spoonBender: { name: 'Spoon Bender', effect: 'homing', pool: 'treasure', color: 0xff00ff },
    technology: { name: 'Technology', effect: 'laser', pool: 'treasure', color: 0x00ffff },
    cupidsArrow: { name: "Cupid's Arrow", effect: 'piercing', pool: 'treasure', color: 0xffaaaa },
    fireMind: { name: 'Fire Mind', effect: 'burning', pool: 'treasure', color: 0xff6600 }
};

// Room templates
const ROOM_TEMPLATES = {
    empty: { obstacles: [], enemies: [] },
    basic1: {
        obstacles: [
            { x: 3, y: 2, type: 'rock' }, { x: 9, y: 2, type: 'rock' },
            { x: 3, y: 4, type: 'rock' }, { x: 9, y: 4, type: 'rock' }
        ],
        enemies: [{ x: 6, y: 3, type: 'fly' }, { x: 4, y: 3, type: 'fly' }, { x: 8, y: 3, type: 'fly' }]
    },
    basic2: {
        obstacles: [
            { x: 5, y: 3, type: 'poop' }, { x: 6, y: 3, type: 'poop' }, { x: 7, y: 3, type: 'poop' }
        ],
        enemies: [{ x: 3, y: 2, type: 'gaper' }, { x: 9, y: 4, type: 'gaper' }]
    },
    rocks1: {
        obstacles: [
            { x: 2, y: 2, type: 'rock' }, { x: 3, y: 2, type: 'rock' },
            { x: 9, y: 2, type: 'rock' }, { x: 10, y: 2, type: 'rock' },
            { x: 2, y: 4, type: 'rock' }, { x: 3, y: 4, type: 'rock' },
            { x: 9, y: 4, type: 'rock' }, { x: 10, y: 4, type: 'rock' }
        ],
        enemies: [{ x: 6, y: 3, type: 'pooter' }, { x: 4, y: 1, type: 'fly' }, { x: 8, y: 5, type: 'fly' }]
    },
    clottyRoom: {
        obstacles: [
            { x: 6, y: 3, type: 'rock' }
        ],
        enemies: [{ x: 3, y: 3, type: 'clotty' }, { x: 9, y: 3, type: 'clotty' }]
    },
    hostRoom: {
        obstacles: [],
        enemies: [{ x: 3, y: 2, type: 'host' }, { x: 9, y: 2, type: 'host' }, { x: 6, y: 4, type: 'host' }]
    },
    mulliganRoom: {
        obstacles: [{ x: 5, y: 2, type: 'poop' }, { x: 7, y: 4, type: 'poop' }],
        enemies: [{ x: 3, y: 3, type: 'mulligan' }, { x: 9, y: 3, type: 'mulligan' }]
    },
    treasure: { obstacles: [], enemies: [], special: 'item' },
    shop: { obstacles: [], enemies: [], special: 'shop' },
    boss: { obstacles: [], enemies: [], special: 'boss' }
};

// Generate floor
function generateFloor(floorNum) {
    rooms = {};

    // Floor size based on floor number
    const roomCount = 8 + floorNum * 2;

    // Start with spawn room at center
    const spawnRoom = { x: 5, y: 5, type: 'empty', cleared: true, visited: true };
    rooms['5,5'] = spawnRoom;

    // Generate connected rooms
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    const toExpand = [{ x: 5, y: 5 }];
    let normalRooms = 1;

    while (normalRooms < roomCount && toExpand.length > 0) {
        const idx = Math.floor(Math.random() * toExpand.length);
        const current = toExpand.splice(idx, 1)[0];

        // Try to add rooms in random directions
        const shuffledDirs = directions.sort(() => Math.random() - 0.5);

        for (const [dx, dy] of shuffledDirs) {
            if (normalRooms >= roomCount) break;

            const nx = current.x + dx;
            const ny = current.y + dy;
            const key = `${nx},${ny}`;

            if (!rooms[key] && Math.random() < 0.6) {
                const templates = ['basic1', 'basic2', 'rocks1', 'clottyRoom', 'hostRoom', 'mulliganRoom'];
                rooms[key] = {
                    x: nx, y: ny,
                    type: templates[Math.floor(Math.random() * templates.length)],
                    cleared: false,
                    visited: false
                };
                toExpand.push({ x: nx, y: ny });
                normalRooms++;
            }
        }
    }

    // Add special rooms
    const roomKeys = Object.keys(rooms);
    const deadEnds = roomKeys.filter(key => {
        const [x, y] = key.split(',').map(Number);
        let neighbors = 0;
        for (const [dx, dy] of directions) {
            if (rooms[`${x + dx},${y + dy}`]) neighbors++;
        }
        return neighbors === 1 && key !== '5,5';
    });

    // Treasure room
    if (deadEnds.length > 0) {
        const treasureKey = deadEnds.splice(Math.floor(Math.random() * deadEnds.length), 1)[0];
        rooms[treasureKey].type = 'treasure';
        rooms[treasureKey].special = 'item';
    }

    // Boss room
    if (deadEnds.length > 0) {
        const bossKey = deadEnds.splice(Math.floor(Math.random() * deadEnds.length), 1)[0];
        rooms[bossKey].type = 'boss';
        rooms[bossKey].special = 'boss';
    }

    // Shop room
    const shopCandidates = roomKeys.filter(k => !rooms[k].special && k !== '5,5');
    if (shopCandidates.length > 0) {
        const shopKey = shopCandidates[Math.floor(Math.random() * shopCandidates.length)];
        rooms[shopKey].type = 'shop';
        rooms[shopKey].special = 'shop';
    }

    currentRoomX = 5;
    currentRoomY = 5;
    currentFloor = floorNum;

    loadRoom(currentRoomX, currentRoomY);
}

// Load room
function loadRoom(rx, ry) {
    const key = `${rx},${ry}`;
    const roomData = rooms[key];
    if (!roomData) return;

    roomData.visited = true;

    // Clear containers
    while (roomContainer.children.length > 0) roomContainer.removeChildAt(0);
    while (entityContainer.children.length > 0) entityContainer.removeChildAt(0);

    tears.length = 0;
    enemies.length = 0;
    pickups.length = 0;
    obstacles.length = 0;

    // Draw room background
    const floor = new PIXI.Graphics();
    floor.beginFill(0x3d3d3d);
    floor.drawRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_PIXEL_WIDTH, ROOM_PIXEL_HEIGHT);
    floor.endFill();

    // Draw grid
    floor.lineStyle(1, 0x4a4a4a, 0.3);
    for (let x = 0; x <= ROOM_WIDTH; x++) {
        floor.moveTo(ROOM_OFFSET_X + x * TILE_SIZE, ROOM_OFFSET_Y);
        floor.lineTo(ROOM_OFFSET_X + x * TILE_SIZE, ROOM_OFFSET_Y + ROOM_PIXEL_HEIGHT);
    }
    for (let y = 0; y <= ROOM_HEIGHT; y++) {
        floor.moveTo(ROOM_OFFSET_X, ROOM_OFFSET_Y + y * TILE_SIZE);
        floor.lineTo(ROOM_OFFSET_X + ROOM_PIXEL_WIDTH, ROOM_OFFSET_Y + y * TILE_SIZE);
    }
    roomContainer.addChild(floor);

    // Draw walls
    const walls = new PIXI.Graphics();
    walls.beginFill(0x2a2a2a);
    // Top wall
    walls.drawRect(ROOM_OFFSET_X, ROOM_OFFSET_Y - 20, ROOM_PIXEL_WIDTH, 20);
    // Bottom wall
    walls.drawRect(ROOM_OFFSET_X, ROOM_OFFSET_Y + ROOM_PIXEL_HEIGHT, ROOM_PIXEL_WIDTH, 20);
    // Left wall
    walls.drawRect(ROOM_OFFSET_X - 20, ROOM_OFFSET_Y - 20, 20, ROOM_PIXEL_HEIGHT + 40);
    // Right wall
    walls.drawRect(ROOM_OFFSET_X + ROOM_PIXEL_WIDTH, ROOM_OFFSET_Y - 20, 20, ROOM_PIXEL_HEIGHT + 40);
    walls.endFill();
    roomContainer.addChild(walls);

    // Draw doors
    const directions = [[0, -1, 'N'], [0, 1, 'S'], [-1, 0, 'W'], [1, 0, 'E']];
    for (const [dx, dy, dir] of directions) {
        const neighborKey = `${rx + dx},${ry + dy}`;
        if (rooms[neighborKey]) {
            drawDoor(dir, roomData.cleared);
        }
    }

    // Load room content
    const template = ROOM_TEMPLATES[roomData.type] || ROOM_TEMPLATES.empty;

    // Place obstacles
    if (!roomData.obstaclesDestroyed) {
        roomData.obstaclesDestroyed = [];
    }

    template.obstacles?.forEach((obs, idx) => {
        if (roomData.obstaclesDestroyed.includes(idx)) return;
        createObstacle(obs.x, obs.y, obs.type, idx);
    });

    // Place enemies if not cleared
    if (!roomData.cleared && template.enemies) {
        template.enemies.forEach(e => {
            createEnemy(e.x, e.y, e.type);
        });
    }

    // Special rooms
    if (roomData.special === 'item' && !roomData.itemTaken) {
        createItemPedestal(6, 3);
    }

    if (roomData.special === 'shop') {
        createShopItems();
    }

    if (roomData.special === 'boss' && !roomData.cleared) {
        createBoss(floorBoss());
    }

    // Create player sprite if needed
    if (!player.sprite) {
        createPlayer();
    }
    entityContainer.addChild(player.sprite);

    // Position player at entry
    positionPlayerAtEntry(currentRoomX - rx, currentRoomY - ry);

    currentRoomX = rx;
    currentRoomY = ry;

    updateMinimap();
}

function floorBoss() {
    if (gameState.floor === 1) return 'monstro';
    if (gameState.floor === 2) return 'larryJr';
    return 'dukeOfFlies';
}

function drawDoor(dir, open) {
    const door = new PIXI.Graphics();
    const doorColor = open ? 0x555555 : 0x333333;

    door.beginFill(doorColor);
    switch (dir) {
        case 'N':
            door.drawRect(ROOM_OFFSET_X + ROOM_PIXEL_WIDTH/2 - 30, ROOM_OFFSET_Y - 15, 60, 20);
            break;
        case 'S':
            door.drawRect(ROOM_OFFSET_X + ROOM_PIXEL_WIDTH/2 - 30, ROOM_OFFSET_Y + ROOM_PIXEL_HEIGHT - 5, 60, 20);
            break;
        case 'W':
            door.drawRect(ROOM_OFFSET_X - 15, ROOM_OFFSET_Y + ROOM_PIXEL_HEIGHT/2 - 30, 20, 60);
            break;
        case 'E':
            door.drawRect(ROOM_OFFSET_X + ROOM_PIXEL_WIDTH - 5, ROOM_OFFSET_Y + ROOM_PIXEL_HEIGHT/2 - 30, 20, 60);
            break;
    }
    door.endFill();
    roomContainer.addChild(door);
}

function positionPlayerAtEntry(fromDx, fromDy) {
    const centerX = ROOM_OFFSET_X + ROOM_PIXEL_WIDTH / 2;
    const centerY = ROOM_OFFSET_Y + ROOM_PIXEL_HEIGHT / 2;

    if (fromDx === 0 && fromDy === 0) {
        // Spawn room or teleport - center
        player.x = centerX;
        player.y = centerY;
    } else if (fromDx < 0) {
        // Came from west, spawn at east door
        player.x = ROOM_OFFSET_X + ROOM_PIXEL_WIDTH - 50;
        player.y = centerY;
    } else if (fromDx > 0) {
        // Came from east, spawn at west door
        player.x = ROOM_OFFSET_X + 50;
        player.y = centerY;
    } else if (fromDy < 0) {
        // Came from north, spawn at south door
        player.x = centerX;
        player.y = ROOM_OFFSET_Y + ROOM_PIXEL_HEIGHT - 50;
    } else if (fromDy > 0) {
        // Came from south, spawn at north door
        player.x = centerX;
        player.y = ROOM_OFFSET_Y + 50;
    }
}

function createPlayer() {
    const gfx = new PIXI.Graphics();
    // Body
    gfx.beginFill(0xffccaa);
    gfx.drawCircle(0, 0, 18);
    gfx.endFill();
    // Eyes
    gfx.beginFill(0x000000);
    gfx.drawCircle(-6, -4, 5);
    gfx.drawCircle(6, -4, 5);
    gfx.endFill();
    // Tears (crying)
    gfx.beginFill(0x6666ff);
    gfx.drawEllipse(-6, 6, 3, 5);
    gfx.drawEllipse(6, 6, 3, 5);
    gfx.endFill();

    player.sprite = gfx;
    player.sprite.position.set(player.x, player.y);
}

function createObstacle(tileX, tileY, type, index) {
    const obs = {
        x: ROOM_OFFSET_X + tileX * TILE_SIZE + TILE_SIZE/2,
        y: ROOM_OFFSET_Y + tileY * TILE_SIZE + TILE_SIZE/2,
        type,
        hp: type === 'rock' ? 999 : 3,
        index
    };

    const gfx = new PIXI.Graphics();
    if (type === 'rock') {
        gfx.beginFill(0x666666);
        gfx.drawRoundedRect(-20, -20, 40, 40, 8);
        gfx.endFill();
        gfx.lineStyle(2, 0x888888);
        gfx.drawRoundedRect(-20, -20, 40, 40, 8);
    } else if (type === 'poop') {
        gfx.beginFill(0x665544);
        gfx.drawCircle(0, 5, 15);
        gfx.drawCircle(-8, -5, 12);
        gfx.drawCircle(8, -5, 12);
        gfx.drawCircle(0, -12, 8);
        gfx.endFill();
    }

    gfx.position.set(obs.x, obs.y);
    roomContainer.addChild(gfx);
    obs.sprite = gfx;
    obstacles.push(obs);
}

function createEnemy(tileX, tileY, type) {
    const def = ENEMY_TYPES[type];
    if (!def) return;

    const enemy = {
        x: ROOM_OFFSET_X + tileX * TILE_SIZE + TILE_SIZE/2,
        y: ROOM_OFFSET_Y + tileY * TILE_SIZE + TILE_SIZE/2,
        type,
        hp: def.hp,
        maxHp: def.hp,
        speed: def.speed,
        damage: def.damage,
        size: def.size,
        behavior: def.behavior,
        shootRate: def.shootRate || 0,
        shootTimer: 0,
        spawnsOnDeath: def.spawnsOnDeath,
        state: 'spawn',
        spawnTimer: 0.5,
        popupState: 'down',
        popupTimer: 0
    };

    const gfx = new PIXI.Graphics();
    gfx.beginFill(def.color);
    gfx.drawCircle(0, 0, def.size / 2);
    gfx.endFill();
    // Eyes
    gfx.beginFill(0xffffff);
    gfx.drawCircle(-def.size/6, -def.size/6, def.size/8);
    gfx.drawCircle(def.size/6, -def.size/6, def.size/8);
    gfx.endFill();
    gfx.beginFill(0x000000);
    gfx.drawCircle(-def.size/6, -def.size/6, def.size/16);
    gfx.drawCircle(def.size/6, -def.size/6, def.size/16);
    gfx.endFill();

    gfx.position.set(enemy.x, enemy.y);
    gfx.alpha = 0.3; // Spawn animation
    entityContainer.addChild(gfx);
    enemy.sprite = gfx;
    enemies.push(enemy);
}

function createBoss(type) {
    const def = BOSSES[type];
    const boss = {
        x: ROOM_OFFSET_X + ROOM_PIXEL_WIDTH / 2,
        y: ROOM_OFFSET_Y + ROOM_PIXEL_HEIGHT / 2,
        type,
        hp: def.hp,
        maxHp: def.hp,
        size: def.size,
        isBoss: true,
        state: 'idle',
        attackTimer: 2,
        phase: 0
    };

    const gfx = new PIXI.Graphics();
    gfx.beginFill(def.color);
    gfx.drawCircle(0, 0, def.size / 2);
    gfx.endFill();
    // Boss face
    gfx.beginFill(0x000000);
    gfx.drawCircle(-def.size/5, -def.size/6, def.size/8);
    gfx.drawCircle(def.size/5, -def.size/6, def.size/8);
    gfx.endFill();
    gfx.beginFill(0x330000);
    gfx.drawEllipse(0, def.size/6, def.size/3, def.size/6);
    gfx.endFill();

    gfx.position.set(boss.x, boss.y);
    entityContainer.addChild(gfx);
    boss.sprite = gfx;
    enemies.push(boss);
}

function createItemPedestal(tileX, tileY) {
    const itemKeys = Object.keys(ITEMS);
    const itemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
    const item = ITEMS[itemKey];

    const pickup = {
        x: ROOM_OFFSET_X + tileX * TILE_SIZE + TILE_SIZE/2,
        y: ROOM_OFFSET_Y + tileY * TILE_SIZE + TILE_SIZE/2,
        type: 'item',
        itemKey,
        item
    };

    const gfx = new PIXI.Graphics();
    // Pedestal
    gfx.beginFill(0x555555);
    gfx.drawRect(-20, 15, 40, 10);
    gfx.endFill();
    // Item
    gfx.beginFill(item.color || 0xffff00);
    gfx.drawCircle(0, 0, 15);
    gfx.endFill();
    gfx.lineStyle(2, 0xffffff);
    gfx.drawCircle(0, 0, 15);

    gfx.position.set(pickup.x, pickup.y);
    entityContainer.addChild(gfx);
    pickup.sprite = gfx;
    pickups.push(pickup);
}

function createShopItems() {
    const shopItems = [
        { x: 4, y: 3, type: 'heart', cost: 3 },
        { x: 6, y: 3, type: 'bomb', cost: 5 },
        { x: 8, y: 3, type: 'key', cost: 5 }
    ];

    shopItems.forEach(si => {
        const pickup = {
            x: ROOM_OFFSET_X + si.x * TILE_SIZE + TILE_SIZE/2,
            y: ROOM_OFFSET_Y + si.y * TILE_SIZE + TILE_SIZE/2,
            type: si.type,
            cost: si.cost,
            isShopItem: true
        };

        const gfx = new PIXI.Graphics();
        let color = 0xffffff;
        if (si.type === 'heart') color = 0xff0000;
        else if (si.type === 'bomb') color = 0x444444;
        else if (si.type === 'key') color = 0xffff00;

        gfx.beginFill(color);
        gfx.drawCircle(0, 0, 12);
        gfx.endFill();

        // Price tag
        const priceText = new PIXI.Text(`${si.cost}c`, {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xffffff
        });
        priceText.anchor.set(0.5);
        priceText.position.set(0, 20);
        gfx.addChild(priceText);

        gfx.position.set(pickup.x, pickup.y);
        entityContainer.addChild(gfx);
        pickup.sprite = gfx;
        pickups.push(pickup);
    });
}

function createPickup(x, y, type) {
    const pickup = { x, y, type };

    const gfx = new PIXI.Graphics();
    let color = 0xffffff;
    let size = 10;

    switch (type) {
        case 'redHeart': color = 0xff0000; break;
        case 'halfHeart': color = 0xff6666; size = 8; break;
        case 'soulHeart': color = 0x6666ff; break;
        case 'penny': color = 0xffcc00; size = 8; break;
        case 'nickel': color = 0xcccccc; size = 10; break;
        case 'bomb': color = 0x444444; break;
        case 'key': color = 0xffff00; break;
    }

    gfx.beginFill(color);
    gfx.drawCircle(0, 0, size);
    gfx.endFill();

    gfx.position.set(x, y);
    entityContainer.addChild(gfx);
    pickup.sprite = gfx;
    pickups.push(pickup);
}

// Create UI
function createUI() {
    // Hearts
    uiContainer.hearts = new PIXI.Container();
    uiContainer.hearts.position.set(120, 20);
    uiContainer.addChild(uiContainer.hearts);

    // Stats
    const statsText = new PIXI.Text('', {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xffffff
    });
    statsText.position.set(10, 10);
    uiContainer.addChild(statsText);
    uiContainer.statsText = statsText;

    // Resources
    const resourceText = new PIXI.Text('', {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xffffff
    });
    resourceText.position.set(10, 550);
    uiContainer.addChild(resourceText);
    uiContainer.resourceText = resourceText;

    // Floor info
    const floorText = new PIXI.Text('', {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xaaaaaa
    });
    floorText.position.set(350, 5);
    uiContainer.addChild(floorText);
    uiContainer.floorText = floorText;

    // Minimap
    uiContainer.minimap = new PIXI.Container();
    uiContainer.minimap.position.set(700, 10);
    uiContainer.addChild(uiContainer.minimap);

    // Boss HP bar (hidden by default)
    const bossHpBg = new PIXI.Graphics();
    bossHpBg.beginFill(0x333333);
    bossHpBg.drawRect(200, 560, 400, 20);
    bossHpBg.endFill();
    bossHpBg.visible = false;
    uiContainer.addChild(bossHpBg);
    uiContainer.bossHpBg = bossHpBg;

    const bossHpBar = new PIXI.Graphics();
    bossHpBar.visible = false;
    uiContainer.addChild(bossHpBar);
    uiContainer.bossHpBar = bossHpBar;

    // Message text
    const messageText = new PIXI.Text('', {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0xffff00,
        align: 'center'
    });
    messageText.anchor.set(0.5);
    messageText.position.set(400, 300);
    uiContainer.addChild(messageText);
    uiContainer.messageText = messageText;
}

function updateUI() {
    // Update hearts
    while (uiContainer.hearts.children.length > 0) {
        uiContainer.hearts.removeChildAt(0);
    }

    const totalContainers = Math.ceil(player.maxHealth / 2);
    for (let i = 0; i < totalContainers; i++) {
        const heartGfx = new PIXI.Graphics();
        const filled = player.health - i * 2;

        if (filled >= 2) {
            heartGfx.beginFill(0xff0000);
        } else if (filled === 1) {
            heartGfx.beginFill(0xff6666);
        } else {
            heartGfx.beginFill(0x444444);
        }
        heartGfx.drawCircle(0, 0, 12);
        heartGfx.endFill();
        heartGfx.position.set(i * 28, 0);
        uiContainer.hearts.addChild(heartGfx);
    }

    // Soul hearts
    for (let i = 0; i < Math.ceil(player.soulHearts / 2); i++) {
        const soulGfx = new PIXI.Graphics();
        soulGfx.beginFill(0x6666ff);
        soulGfx.drawCircle(0, 0, 12);
        soulGfx.endFill();
        soulGfx.position.set((totalContainers + i) * 28, 0);
        uiContainer.hearts.addChild(soulGfx);
    }

    // Stats
    uiContainer.statsText.text = `DMG: ${player.damage.toFixed(1)}\nSPD: ${player.speed.toFixed(1)}`;

    // Resources
    uiContainer.resourceText.text = `Keys: ${player.keys}  Bombs: ${player.bombs}  Coins: ${player.coins}`;

    // Floor
    uiContainer.floorText.text = `${gameState.floorName} ${['I', 'II', 'III'][gameState.floor - 1] || gameState.floor}`;

    // Boss HP
    const boss = enemies.find(e => e.isBoss);
    if (boss) {
        uiContainer.bossHpBg.visible = true;
        uiContainer.bossHpBar.visible = true;
        uiContainer.bossHpBar.clear();
        uiContainer.bossHpBar.beginFill(0xff0000);
        uiContainer.bossHpBar.drawRect(202, 562, (boss.hp / boss.maxHp) * 396, 16);
        uiContainer.bossHpBar.endFill();
    } else {
        uiContainer.bossHpBg.visible = false;
        uiContainer.bossHpBar.visible = false;
    }
}

function updateMinimap() {
    while (uiContainer.minimap.children.length > 0) {
        uiContainer.minimap.removeChildAt(0);
    }

    const mapSize = 8;
    const roomSize = 10;

    Object.values(rooms).forEach(room => {
        if (!room.visited) return;

        const rx = (room.x - 5) * (roomSize + 2);
        const ry = (room.y - 5) * (roomSize + 2);

        const gfx = new PIXI.Graphics();
        let color = 0x555555;

        if (room.special === 'boss') color = 0xff0000;
        else if (room.special === 'item') color = 0xffff00;
        else if (room.special === 'shop') color = 0x00ffff;

        if (room.x === currentRoomX && room.y === currentRoomY) {
            gfx.lineStyle(2, 0xffffff);
        }

        gfx.beginFill(color);
        gfx.drawRect(rx, ry, roomSize, roomSize);
        gfx.endFill();

        uiContainer.minimap.addChild(gfx);
    });
}

function showMessage(text, duration = 2000) {
    uiContainer.messageText.text = text;
    setTimeout(() => {
        uiContainer.messageText.text = '';
    }, duration);
}

// Shooting
function shootTear() {
    if (player.tearCooldown > 0) return;
    if (shootDir.x === 0 && shootDir.y === 0) return;

    player.tearCooldown = player.tearRate / 60;

    const tear = {
        x: player.x,
        y: player.y,
        vx: shootDir.x * player.tearSpeed,
        vy: shootDir.y * player.tearSpeed,
        damage: player.damage,
        range: player.range * 10,
        traveled: 0,
        gravity: 0.15 // Slight arc
    };

    const gfx = new PIXI.Graphics();
    gfx.beginFill(0x6666ff);
    gfx.drawCircle(0, 0, 8);
    gfx.endFill();
    gfx.position.set(tear.x, tear.y);
    entityContainer.addChild(gfx);
    tear.sprite = gfx;
    tears.push(tear);
}

// Update functions
function updatePlayer(delta) {
    if (gameState.paused || gameState.gameOver) return;

    // Movement
    let dx = 0, dy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    const newX = player.x + dx * player.speed;
    const newY = player.y + dy * player.speed;

    // Room bounds
    const minX = ROOM_OFFSET_X + 25;
    const maxX = ROOM_OFFSET_X + ROOM_PIXEL_WIDTH - 25;
    const minY = ROOM_OFFSET_Y + 25;
    const maxY = ROOM_OFFSET_Y + ROOM_PIXEL_HEIGHT - 25;

    // Obstacle collision
    let canMove = true;
    obstacles.forEach(obs => {
        const dist = Math.sqrt((newX - obs.x) ** 2 + (newY - obs.y) ** 2);
        if (dist < 40) canMove = false;
    });

    if (canMove) {
        player.x = Math.max(minX, Math.min(maxX, newX));
        player.y = Math.max(minY, Math.min(maxY, newY));
    }

    player.sprite.position.set(player.x, player.y);

    // Shooting direction (arrow keys)
    shootDir.x = 0;
    shootDir.y = 0;
    if (keys['ArrowUp']) shootDir.y = -1;
    else if (keys['ArrowDown']) shootDir.y = 1;
    else if (keys['ArrowLeft']) shootDir.x = -1;
    else if (keys['ArrowRight']) shootDir.x = 1;

    if (shootDir.x !== 0 || shootDir.y !== 0) {
        shootTear();
    }

    // Cooldown
    if (player.tearCooldown > 0) {
        player.tearCooldown -= delta;
    }

    // Invincibility
    if (player.invincible > 0) {
        player.invincible -= delta;
        player.sprite.alpha = Math.sin(player.invincible * 20) * 0.5 + 0.5;
    } else {
        player.sprite.alpha = 1;
    }

    // Room transitions
    checkRoomTransition();

    // Pickup collection
    checkPickups();
}

function checkRoomTransition() {
    const roomData = rooms[`${currentRoomX},${currentRoomY}`];
    if (!roomData || !roomData.cleared) return;

    const centerX = ROOM_OFFSET_X + ROOM_PIXEL_WIDTH / 2;
    const centerY = ROOM_OFFSET_Y + ROOM_PIXEL_HEIGHT / 2;

    // North door
    if (player.y < ROOM_OFFSET_Y + 30 && Math.abs(player.x - centerX) < 40) {
        if (rooms[`${currentRoomX},${currentRoomY - 1}`]) {
            loadRoom(currentRoomX, currentRoomY - 1);
        }
    }
    // South door
    if (player.y > ROOM_OFFSET_Y + ROOM_PIXEL_HEIGHT - 30 && Math.abs(player.x - centerX) < 40) {
        if (rooms[`${currentRoomX},${currentRoomY + 1}`]) {
            loadRoom(currentRoomX, currentRoomY + 1);
        }
    }
    // West door
    if (player.x < ROOM_OFFSET_X + 30 && Math.abs(player.y - centerY) < 40) {
        if (rooms[`${currentRoomX - 1},${currentRoomY}`]) {
            loadRoom(currentRoomX - 1, currentRoomY);
        }
    }
    // East door
    if (player.x > ROOM_OFFSET_X + ROOM_PIXEL_WIDTH - 30 && Math.abs(player.y - centerY) < 40) {
        if (rooms[`${currentRoomX + 1},${currentRoomY}`]) {
            loadRoom(currentRoomX + 1, currentRoomY);
        }
    }
}

function checkPickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        const dist = Math.sqrt((player.x - pickup.x) ** 2 + (player.y - pickup.y) ** 2);

        if (dist < 30) {
            if (pickup.isShopItem) {
                if (player.coins >= pickup.cost && keys['KeyE']) {
                    player.coins -= pickup.cost;
                    collectPickup(pickup, i);
                }
            } else {
                collectPickup(pickup, i);
            }
        }
    }
}

function collectPickup(pickup, index) {
    switch (pickup.type) {
        case 'redHeart':
            if (player.health < player.maxHealth) {
                player.health = Math.min(player.maxHealth, player.health + 2);
            } else return;
            break;
        case 'halfHeart':
            if (player.health < player.maxHealth) {
                player.health = Math.min(player.maxHealth, player.health + 1);
            } else return;
            break;
        case 'soulHeart':
            player.soulHearts += 2;
            break;
        case 'penny':
            player.coins += 1;
            break;
        case 'nickel':
            player.coins += 5;
            break;
        case 'bomb':
            player.bombs += 1;
            break;
        case 'key':
            player.keys += 1;
            break;
        case 'heart':
            if (player.health < player.maxHealth) {
                player.health = Math.min(player.maxHealth, player.health + 2);
            } else return;
            break;
        case 'item':
            applyItem(pickup.itemKey);
            rooms[`${currentRoomX},${currentRoomY}`].itemTaken = true;
            break;
    }

    entityContainer.removeChild(pickup.sprite);
    pickups.splice(index, 1);
}

function applyItem(itemKey) {
    const item = ITEMS[itemKey];
    if (!item) return;

    player.items.push(itemKey);
    showMessage(`Got ${item.name}!`);

    switch (item.effect) {
        case 'tearRate':
            player.tearRate += item.value;
            break;
        case 'damage':
            player.damage += item.value;
            break;
        case 'speed':
            player.speed += item.value;
            break;
        case 'health':
            player.maxHealth += item.value;
            player.health += item.value;
            break;
        case 'allStats':
            player.damage += 0.5;
            player.speed += 0.3;
            player.tearRate -= 0.5;
            player.maxHealth += 2;
            player.health += 2;
            break;
        case 'damageHealth':
            player.damage += 0.3;
            player.maxHealth += 2;
            player.health += 2;
            break;
        case 'damageSpeed':
            player.damage += 1;
            player.speed += 0.4;
            break;
        case 'homing':
            player.hasHoming = true;
            break;
        case 'piercing':
            player.hasPiercing = true;
            break;
    }
}

function updateTears(delta) {
    for (let i = tears.length - 1; i >= 0; i--) {
        const tear = tears[i];

        // Apply gravity (arc)
        tear.vy += tear.gravity;

        tear.x += tear.vx;
        tear.y += tear.vy;
        tear.traveled += Math.sqrt(tear.vx ** 2 + tear.vy ** 2);

        tear.sprite.position.set(tear.x, tear.y);

        // Homing
        if (player.hasHoming && enemies.length > 0) {
            let closest = null;
            let closestDist = Infinity;
            enemies.forEach(e => {
                if (e.hp <= 0) return;
                const d = Math.sqrt((e.x - tear.x) ** 2 + (e.y - tear.y) ** 2);
                if (d < closestDist) {
                    closestDist = d;
                    closest = e;
                }
            });
            if (closest && closestDist < 150) {
                const angle = Math.atan2(closest.y - tear.y, closest.x - tear.x);
                tear.vx += Math.cos(angle) * 0.3;
                tear.vy += Math.sin(angle) * 0.3;
            }
        }

        let hit = false;

        // Wall collision
        if (tear.x < ROOM_OFFSET_X || tear.x > ROOM_OFFSET_X + ROOM_PIXEL_WIDTH ||
            tear.y < ROOM_OFFSET_Y || tear.y > ROOM_OFFSET_Y + ROOM_PIXEL_HEIGHT) {
            hit = true;
        }

        // Obstacle collision
        obstacles.forEach(obs => {
            const dist = Math.sqrt((tear.x - obs.x) ** 2 + (tear.y - obs.y) ** 2);
            if (dist < 25) {
                if (obs.type === 'poop') {
                    obs.hp--;
                    if (obs.hp <= 0) {
                        roomContainer.removeChild(obs.sprite);
                        const idx = obstacles.indexOf(obs);
                        if (idx >= 0) obstacles.splice(idx, 1);

                        const roomData = rooms[`${currentRoomX},${currentRoomY}`];
                        if (roomData && obs.index !== undefined) {
                            roomData.obstaclesDestroyed.push(obs.index);
                        }

                        // Drop chance
                        if (Math.random() < 0.3) {
                            createPickup(obs.x, obs.y, Math.random() < 0.5 ? 'penny' : 'halfHeart');
                        }
                    }
                }
                hit = true;
            }
        });

        // Enemy collision
        for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;
            if (enemy.state === 'spawn') continue;
            if (enemy.behavior === 'popup' && enemy.popupState === 'down') continue;

            const dist = Math.sqrt((tear.x - enemy.x) ** 2 + (tear.y - enemy.y) ** 2);
            if (dist < enemy.size / 2 + 8) {
                enemy.hp -= tear.damage;

                if (enemy.hp <= 0) {
                    enemyDeath(enemy);
                }

                if (!player.hasPiercing) {
                    hit = true;
                }
                break;
            }
        }

        // Range check
        if (tear.traveled > tear.range) {
            hit = true;
        }

        if (hit) {
            entityContainer.removeChild(tear.sprite);
            tears.splice(i, 1);
        }
    }
}

function enemyDeath(enemy) {
    entityContainer.removeChild(enemy.sprite);
    const idx = enemies.indexOf(enemy);
    if (idx >= 0) enemies.splice(idx, 1);

    // Spawn on death
    if (enemy.spawnsOnDeath) {
        for (let i = 0; i < 3; i++) {
            const tx = Math.floor((enemy.x - ROOM_OFFSET_X) / TILE_SIZE);
            const ty = Math.floor((enemy.y - ROOM_OFFSET_Y) / TILE_SIZE);
            createEnemy(tx + (Math.random() - 0.5) * 2, ty + (Math.random() - 0.5) * 2, enemy.spawnsOnDeath);
        }
    }

    // Drop
    if (Math.random() < 0.25) {
        const drops = ['penny', 'halfHeart', 'bomb', 'key'];
        const weights = [0.5, 0.3, 0.1, 0.1];
        let r = Math.random();
        let drop = drops[0];
        for (let i = 0; i < weights.length; i++) {
            r -= weights[i];
            if (r <= 0) {
                drop = drops[i];
                break;
            }
        }
        createPickup(enemy.x, enemy.y, drop);
    }

    // Boss death
    if (enemy.isBoss) {
        showMessage('BOSS DEFEATED!');
        rooms[`${currentRoomX},${currentRoomY}`].cleared = true;

        // Create trapdoor/victory
        if (gameState.floor >= 3) {
            gameState.victory = true;
            showMessage("YOU WIN! Mom's Heart defeated!", 5000);
        } else {
            // Create item drop
            createItemPedestal(6, 3);
            // Create trapdoor (next floor)
            setTimeout(() => {
                nextFloor();
            }, 3000);
        }
    }

    // Check room clear
    checkRoomClear();
}

function checkRoomClear() {
    const aliveEnemies = enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length === 0) {
        const roomData = rooms[`${currentRoomX},${currentRoomY}`];
        if (roomData && !roomData.cleared) {
            roomData.cleared = true;
            showMessage('Room Cleared!', 1000);

            // Redraw doors
            loadRoom(currentRoomX, currentRoomY);
        }
    }
}

function updateEnemies(delta) {
    enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;

        // Spawn animation
        if (enemy.state === 'spawn') {
            enemy.spawnTimer -= delta;
            enemy.sprite.alpha = 1 - enemy.spawnTimer;
            if (enemy.spawnTimer <= 0) {
                enemy.state = 'active';
                enemy.sprite.alpha = 1;
            }
            return;
        }

        // Boss AI
        if (enemy.isBoss) {
            updateBossAI(enemy, delta);
            return;
        }

        // Regular enemy AI
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        switch (enemy.behavior) {
            case 'chase':
                if (dist > 0) {
                    enemy.x += (dx / dist) * enemy.speed;
                    enemy.y += (dy / dist) * enemy.speed;
                }
                break;

            case 'shoot':
                enemy.shootTimer -= delta;
                if (enemy.shootTimer <= 0) {
                    enemy.shootTimer = enemy.shootRate;
                    createEnemyTear(enemy, dx / dist, dy / dist);
                }
                // Slow movement
                if (dist > 100) {
                    enemy.x += (dx / dist) * enemy.speed * 0.5;
                    enemy.y += (dy / dist) * enemy.speed * 0.5;
                }
                break;

            case 'shoot4way':
                enemy.shootTimer -= delta;
                if (enemy.shootTimer <= 0) {
                    enemy.shootTimer = enemy.shootRate;
                    createEnemyTear(enemy, 1, 0);
                    createEnemyTear(enemy, -1, 0);
                    createEnemyTear(enemy, 0, 1);
                    createEnemyTear(enemy, 0, -1);
                }
                break;

            case 'popup':
                enemy.popupTimer -= delta;
                if (enemy.popupTimer <= 0) {
                    if (enemy.popupState === 'down') {
                        enemy.popupState = 'up';
                        enemy.popupTimer = 1.5;
                        enemy.sprite.alpha = 1;
                        // Shoot when popping up
                        if (dist > 0) {
                            createEnemyTear(enemy, dx / dist, dy / dist);
                        }
                    } else {
                        enemy.popupState = 'down';
                        enemy.popupTimer = 1;
                        enemy.sprite.alpha = 0.4;
                    }
                }
                break;

            case 'lineShoot':
                // Only shoot if player in line
                if (Math.abs(dx) < 30 || Math.abs(dy) < 30) {
                    enemy.shootTimer -= delta;
                    if (enemy.shootTimer <= 0) {
                        enemy.shootTimer = 1;
                        createEnemyTear(enemy, Math.sign(dx) || 0, Math.sign(dy) || 0);
                    }
                }
                break;
        }

        // Keep in room
        enemy.x = Math.max(ROOM_OFFSET_X + 30, Math.min(ROOM_OFFSET_X + ROOM_PIXEL_WIDTH - 30, enemy.x));
        enemy.y = Math.max(ROOM_OFFSET_Y + 30, Math.min(ROOM_OFFSET_Y + ROOM_PIXEL_HEIGHT - 30, enemy.y));

        enemy.sprite.position.set(enemy.x, enemy.y);

        // Player collision
        const playerDist = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
        if (playerDist < enemy.size / 2 + 18 && player.invincible <= 0) {
            damagePlayer(enemy.damage);
        }
    });
}

function updateBossAI(boss, delta) {
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    boss.attackTimer -= delta;

    if (boss.type === 'monstro') {
        if (boss.state === 'idle') {
            if (boss.attackTimer <= 0) {
                boss.state = Math.random() < 0.5 ? 'jump' : 'spit';
                boss.attackTimer = 2;
            }
        } else if (boss.state === 'jump') {
            // Jump toward player
            boss.x += (dx / dist) * 5;
            boss.y += (dy / dist) * 5;
            if (boss.attackTimer <= 1) {
                boss.state = 'land';
            }
        } else if (boss.state === 'land') {
            // Land and create burst
            if (boss.attackTimer <= 0) {
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    createEnemyTear(boss, Math.cos(angle), Math.sin(angle));
                }
                boss.state = 'idle';
                boss.attackTimer = 1.5;
            }
        } else if (boss.state === 'spit') {
            // Spit tears at player
            if (boss.attackTimer <= 1.5) {
                for (let i = 0; i < 5; i++) {
                    const spread = (Math.random() - 0.5) * 0.5;
                    createEnemyTear(boss, dx / dist + spread, dy / dist + spread);
                }
                boss.state = 'idle';
                boss.attackTimer = 2;
            }
        }
    } else if (boss.type === 'larryJr') {
        // Snake movement
        const angle = Math.atan2(dy, dx);
        boss.x += Math.cos(angle) * 2;
        boss.y += Math.sin(angle) * 2;
    } else if (boss.type === 'dukeOfFlies') {
        if (boss.attackTimer <= 0) {
            // Spawn flies
            createEnemy(Math.floor((boss.x - ROOM_OFFSET_X) / TILE_SIZE),
                       Math.floor((boss.y - ROOM_OFFSET_Y) / TILE_SIZE), 'fly');
            boss.attackTimer = 3;
        }
        // Circle movement
        boss.x += Math.sin(Date.now() / 500) * 1.5;
        boss.y += Math.cos(Date.now() / 500) * 1.5;
    }

    // Keep in room
    boss.x = Math.max(ROOM_OFFSET_X + 50, Math.min(ROOM_OFFSET_X + ROOM_PIXEL_WIDTH - 50, boss.x));
    boss.y = Math.max(ROOM_OFFSET_Y + 50, Math.min(ROOM_OFFSET_Y + ROOM_PIXEL_HEIGHT - 50, boss.y));

    boss.sprite.position.set(boss.x, boss.y);

    // Player collision
    const playerDist = Math.sqrt((player.x - boss.x) ** 2 + (player.y - boss.y) ** 2);
    if (playerDist < boss.size / 2 + 18 && player.invincible <= 0) {
        damagePlayer(1);
    }
}

function createEnemyTear(enemy, dx, dy) {
    const tear = {
        x: enemy.x,
        y: enemy.y,
        vx: dx * 4,
        vy: dy * 4,
        isEnemy: true
    };

    const gfx = new PIXI.Graphics();
    gfx.beginFill(0xff6666);
    gfx.drawCircle(0, 0, 6);
    gfx.endFill();
    gfx.position.set(tear.x, tear.y);
    entityContainer.addChild(gfx);
    tear.sprite = gfx;
    tears.push(tear);
}

function damagePlayer(amount) {
    if (player.invincible > 0) return;

    // Remove soul hearts first
    if (player.soulHearts > 0) {
        const soulDamage = Math.min(player.soulHearts, Math.ceil(amount));
        player.soulHearts -= soulDamage;
        amount -= soulDamage;
    }

    if (amount > 0) {
        player.health -= Math.ceil(amount);
    }

    player.invincible = 1;

    if (player.health <= 0) {
        gameOver();
    }
}

function gameOver() {
    gameState.gameOver = true;
    showMessage('GAME OVER - Press R to restart', 10000);
}

function nextFloor() {
    gameState.floor++;

    const floorNames = ['Basement', 'Caves', 'Depths'];
    gameState.floorName = floorNames[Math.min(gameState.floor - 1, floorNames.length - 1)];

    generateFloor(gameState.floor);
    showMessage(`${gameState.floorName}`);
}

function restart() {
    gameState.floor = 1;
    gameState.floorName = 'Basement';
    gameState.gameOver = false;
    gameState.victory = false;

    player.health = 6;
    player.maxHealth = 6;
    player.soulHearts = 0;
    player.damage = 3.5;
    player.speed = 3;
    player.tearRate = 10;
    player.keys = 1;
    player.bombs = 1;
    player.coins = 0;
    player.items = [];
    player.hasHoming = false;
    player.hasPiercing = false;

    generateFloor(1);
}

// Enemy tear collision with player
function updateEnemyTears(delta) {
    for (let i = tears.length - 1; i >= 0; i--) {
        const tear = tears[i];
        if (!tear.isEnemy) continue;

        tear.x += tear.vx;
        tear.y += tear.vy;
        tear.sprite.position.set(tear.x, tear.y);

        let hit = false;

        // Wall collision
        if (tear.x < ROOM_OFFSET_X || tear.x > ROOM_OFFSET_X + ROOM_PIXEL_WIDTH ||
            tear.y < ROOM_OFFSET_Y || tear.y > ROOM_OFFSET_Y + ROOM_PIXEL_HEIGHT) {
            hit = true;
        }

        // Player collision
        const dist = Math.sqrt((tear.x - player.x) ** 2 + (tear.y - player.y) ** 2);
        if (dist < 25 && player.invincible <= 0) {
            damagePlayer(0.5);
            hit = true;
        }

        if (hit) {
            entityContainer.removeChild(tear.sprite);
            tears.splice(i, 1);
        }
    }
}

// Input handlers
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (e.code === 'KeyR' && (gameState.gameOver || gameState.victory)) {
        restart();
    }

    if (e.code === 'Escape') {
        gameState.paused = !gameState.paused;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Game loop
app.ticker.add((delta) => {
    const dt = delta / 60;

    if (!gameState.paused && !gameState.gameOver && !gameState.victory) {
        updatePlayer(dt);
        updateTears(dt);
        updateEnemyTears(dt);
        updateEnemies(dt);
    }

    updateUI();
});

// Initialize
createUI();
generateFloor(1);
showMessage('WASD to move, Arrow keys to shoot', 3000);

console.log('Binding of Isaac Clone initialized');
