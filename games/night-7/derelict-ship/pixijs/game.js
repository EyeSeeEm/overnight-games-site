// Derelict Ship - PixiJS Survival Horror
const app = new PIXI.Application({
    width: 1280,
    height: 720,
    backgroundColor: 0x0a0a0a,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    preferWebGLVersion: 1
});
document.body.appendChild(app.view);

// Constants
const TILE_SIZE = 32;
const VISION_RANGE = 300;
const VISION_ANGLE = Math.PI / 2; // 90 degrees

// Game modes
const MODE = { SHIP: 'ship', SPACE: 'space' };
let gameMode = MODE.SHIP;

// Game state
const gameState = {
    currentShip: 0,
    shipCount: 3,
    paused: false,
    gameOver: false,
    victory: false
};

// Player
const player = {
    x: 400,
    y: 300,
    angle: 0,
    speed: 120,
    runSpeed: 200,
    health: 100,
    maxHealth: 100,
    oxygen: 100,
    maxOxygen: 100,
    weapon: 'pipe',
    ammo: { '9mm': 24, shells: 12 },
    inventory: [],
    flashlight: true,
    flashlightBattery: 60,
    attackCooldown: 0,
    invincible: 0,
    sprite: null
};

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false };

// Containers
const gameContainer = new PIXI.Container();
const worldContainer = new PIXI.Container();
const entityContainer = new PIXI.Container();
const lightingContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();
const spaceContainer = new PIXI.Container();

gameContainer.addChild(worldContainer);
gameContainer.addChild(entityContainer);
gameContainer.addChild(lightingContainer);
app.stage.addChild(gameContainer);
app.stage.addChild(spaceContainer);
app.stage.addChild(uiContainer);

// Game objects
const enemies = [];
const projectiles = [];
const pickups = [];
const walls = [];

// Current ship data
let currentLevel = null;

// Weapon definitions
const WEAPONS = {
    pipe: { name: 'Pipe', damage: 20, cooldown: 0.6, range: 60, type: 'melee', ammo: null },
    pistol: { name: 'Pistol', damage: 25, cooldown: 0.5, range: 400, type: 'ranged', ammo: '9mm' },
    shotgun: { name: 'Shotgun', damage: 40, cooldown: 1.0, range: 200, type: 'ranged', ammo: 'shells', pellets: 5 },
    smg: { name: 'SMG', damage: 15, cooldown: 0.2, range: 350, type: 'ranged', ammo: '9mm' }
};

// Enemy definitions
const ENEMY_TYPES = {
    crawler: { hp: 30, damage: 15, speed: 80, size: 24, color: 0x447744, detectRange: 250 },
    shambler: { hp: 60, damage: 25, speed: 50, size: 28, color: 0x664444, detectRange: 200 },
    stalker: { hp: 45, damage: 20, speed: 150, size: 26, color: 0x222244, detectRange: 350 },
    boss: { hp: 150, damage: 35, speed: 80, size: 64, color: 0x884422, detectRange: 500 }
};

// Generate ship layout
function generateShip(shipNum) {
    walls.length = 0;
    enemies.length = 0;
    pickups.length = 0;

    while (worldContainer.children.length > 0) worldContainer.removeChildAt(0);
    while (entityContainer.children.length > 0) entityContainer.removeChildAt(0);

    const width = 40 + shipNum * 10;
    const height = 30 + shipNum * 5;
    const tiles = [];

    // Fill with walls
    for (let y = 0; y < height; y++) {
        tiles[y] = [];
        for (let x = 0; x < width; x++) {
            tiles[y][x] = 1;
        }
    }

    // Generate rooms
    const rooms = [];
    const roomCount = 4 + shipNum * 2;

    // Start room
    rooms.push({ x: 2, y: 2, w: 6, h: 6, name: 'start' });

    // Generate connected rooms
    for (let i = 1; i < roomCount; i++) {
        let attempts = 0;
        while (attempts < 50) {
            const prevRoom = rooms[Math.floor(Math.random() * rooms.length)];
            const dir = Math.floor(Math.random() * 4);
            const w = 5 + Math.floor(Math.random() * 4);
            const h = 5 + Math.floor(Math.random() * 4);
            let x, y;

            switch (dir) {
                case 0: x = prevRoom.x + prevRoom.w + 2; y = prevRoom.y; break;
                case 1: x = prevRoom.x - w - 2; y = prevRoom.y; break;
                case 2: x = prevRoom.x; y = prevRoom.y + prevRoom.h + 2; break;
                case 3: x = prevRoom.x; y = prevRoom.y - h - 2; break;
            }

            if (x >= 1 && y >= 1 && x + w < width - 1 && y + h < height - 1) {
                const newRoom = { x, y, w, h, name: i === roomCount - 1 ? 'exit' : `room${i}` };
                rooms.push(newRoom);

                // Create corridor
                const cx1 = prevRoom.x + Math.floor(prevRoom.w / 2);
                const cy1 = prevRoom.y + Math.floor(prevRoom.h / 2);
                const cx2 = x + Math.floor(w / 2);
                const cy2 = y + Math.floor(h / 2);

                // Horizontal corridor
                for (let cx = Math.min(cx1, cx2); cx <= Math.max(cx1, cx2); cx++) {
                    tiles[cy1][cx] = 0;
                    tiles[cy1 + 1][cx] = 0;
                }
                // Vertical corridor
                for (let cy = Math.min(cy1, cy2); cy <= Math.max(cy1, cy2); cy++) {
                    tiles[cy][cx2] = 0;
                    tiles[cy][cx2 + 1] = 0;
                }
                break;
            }
            attempts++;
        }
    }

    // Carve rooms
    rooms.forEach(room => {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                if (y >= 0 && y < height && x >= 0 && x < width) {
                    tiles[y][x] = 0;
                }
            }
        }
    });

    // Draw tiles
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const gfx = new PIXI.Graphics();
            if (tiles[y][x] === 1) {
                gfx.beginFill(0x333344);
                gfx.drawRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                gfx.endFill();
                walls.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE });
            } else {
                gfx.beginFill(0x222233);
                gfx.drawRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                gfx.endFill();
                gfx.lineStyle(1, 0x333344, 0.3);
                gfx.drawRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
            worldContainer.addChild(gfx);
        }
    }

    // Place enemies
    const enemyTypes = ['crawler'];
    if (shipNum >= 1) enemyTypes.push('shambler');
    if (shipNum >= 2) enemyTypes.push('stalker');

    rooms.forEach((room, idx) => {
        if (idx === 0) return; // Skip start room

        // Boss in final room of final ship
        if (room.name === 'exit' && shipNum === 2) {
            createEnemy(
                room.x * TILE_SIZE + room.w * TILE_SIZE / 2,
                room.y * TILE_SIZE + room.h * TILE_SIZE / 2,
                'boss'
            );
        } else if (Math.random() < 0.7) {
            const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            createEnemy(
                room.x * TILE_SIZE + Math.random() * room.w * TILE_SIZE,
                room.y * TILE_SIZE + Math.random() * room.h * TILE_SIZE,
                type
            );
        }
    });

    // Place pickups
    rooms.forEach((room, idx) => {
        if (idx === 0) return;

        // O2 canisters
        if (Math.random() < 0.5) {
            createPickup(
                room.x * TILE_SIZE + Math.random() * room.w * TILE_SIZE,
                room.y * TILE_SIZE + Math.random() * room.h * TILE_SIZE,
                'o2_small'
            );
        }

        // Medkits
        if (Math.random() < 0.3) {
            createPickup(
                room.x * TILE_SIZE + Math.random() * room.w * TILE_SIZE,
                room.y * TILE_SIZE + Math.random() * room.h * TILE_SIZE,
                'medkit_small'
            );
        }

        // Weapons on later ships
        if (shipNum >= 1 && room.name === 'exit' && !gameState.hasWeapon) {
            const weaponType = shipNum === 1 ? 'shotgun' : 'smg';
            createPickup(
                room.x * TILE_SIZE + room.w * TILE_SIZE / 2,
                room.y * TILE_SIZE + room.h * TILE_SIZE / 2,
                weaponType
            );
        }
    });

    // Exit marker in final room
    const exitRoom = rooms.find(r => r.name === 'exit');
    if (exitRoom) {
        const exitGfx = new PIXI.Graphics();
        exitGfx.beginFill(0x00ff00, 0.3);
        exitGfx.drawRect(
            exitRoom.x * TILE_SIZE,
            exitRoom.y * TILE_SIZE,
            exitRoom.w * TILE_SIZE,
            exitRoom.h * TILE_SIZE
        );
        exitGfx.endFill();
        worldContainer.addChild(exitGfx);
    }

    // Set player position
    player.x = rooms[0].x * TILE_SIZE + rooms[0].w * TILE_SIZE / 2;
    player.y = rooms[0].y * TILE_SIZE + rooms[0].h * TILE_SIZE / 2;

    currentLevel = { tiles, width, height, rooms };
}

// Create player sprite
function createPlayer() {
    if (player.sprite) {
        entityContainer.removeChild(player.sprite);
    }

    const gfx = new PIXI.Graphics();
    // Body
    gfx.beginFill(0x4488aa);
    gfx.drawCircle(0, 0, 14);
    gfx.endFill();
    // Direction indicator
    gfx.beginFill(0x66aacc);
    gfx.drawRect(10, -4, 10, 8);
    gfx.endFill();
    // Flashlight beam indicator
    gfx.beginFill(0xffffaa, 0.3);
    gfx.moveTo(15, 0);
    gfx.lineTo(50, -15);
    gfx.lineTo(50, 15);
    gfx.lineTo(15, 0);
    gfx.endFill();

    player.sprite = gfx;
    entityContainer.addChild(gfx);
}

// Create enemy
function createEnemy(x, y, type) {
    const def = ENEMY_TYPES[type];
    if (!def) return;

    const enemy = {
        x, y, type,
        hp: def.hp,
        maxHp: def.hp,
        damage: def.damage,
        speed: def.speed,
        size: def.size,
        detectRange: def.detectRange,
        attackCooldown: 0,
        state: 'idle',
        angle: Math.random() * Math.PI * 2
    };

    const gfx = new PIXI.Graphics();
    gfx.beginFill(def.color);
    gfx.drawCircle(0, 0, def.size / 2);
    gfx.endFill();
    // Eyes
    gfx.beginFill(0xff0000);
    gfx.drawCircle(-def.size/6, -def.size/6, 3);
    gfx.drawCircle(def.size/6, -def.size/6, 3);
    gfx.endFill();

    gfx.position.set(x, y);
    entityContainer.addChild(gfx);
    enemy.sprite = gfx;
    enemies.push(enemy);
}

// Create pickup
function createPickup(x, y, type) {
    const pickup = { x, y, type };

    const gfx = new PIXI.Graphics();
    let color = 0xffffff;
    let size = 12;

    switch (type) {
        case 'o2_small': color = 0x00aaff; break;
        case 'o2_large': color = 0x0066ff; size = 16; break;
        case 'medkit_small': color = 0xff4444; break;
        case 'medkit_large': color = 0xff0000; size = 16; break;
        case 'ammo_9mm': color = 0xffaa00; break;
        case 'ammo_shells': color = 0xff6600; break;
        case 'pistol': color = 0x666666; size = 18; break;
        case 'shotgun': color = 0x884422; size = 20; break;
        case 'smg': color = 0x444444; size = 18; break;
    }

    gfx.beginFill(color);
    gfx.drawRoundedRect(-size/2, -size/2, size, size, 4);
    gfx.endFill();

    gfx.position.set(x, y);
    entityContainer.addChild(gfx);
    pickup.sprite = gfx;
    pickups.push(pickup);
}

// Create UI
function createUI() {
    while (uiContainer.children.length > 0) uiContainer.removeChildAt(0);

    // O2 bar background
    const o2Bg = new PIXI.Graphics();
    o2Bg.beginFill(0x333333);
    o2Bg.drawRoundedRect(10, 10, 200, 20, 5);
    o2Bg.endFill();
    uiContainer.addChild(o2Bg);

    const o2Bar = new PIXI.Graphics();
    uiContainer.addChild(o2Bar);
    uiContainer.o2Bar = o2Bar;

    const o2Label = new PIXI.Text('O2', { fontFamily: 'Arial', fontSize: 14, fill: 0x00aaff });
    o2Label.position.set(15, 12);
    uiContainer.addChild(o2Label);

    // HP bar background
    const hpBg = new PIXI.Graphics();
    hpBg.beginFill(0x333333);
    hpBg.drawRoundedRect(10, 35, 200, 20, 5);
    hpBg.endFill();
    uiContainer.addChild(hpBg);

    const hpBar = new PIXI.Graphics();
    uiContainer.addChild(hpBar);
    uiContainer.hpBar = hpBar;

    const hpLabel = new PIXI.Text('HP', { fontFamily: 'Arial', fontSize: 14, fill: 0xff4444 });
    hpLabel.position.set(15, 37);
    uiContainer.addChild(hpLabel);

    // Weapon display
    const weaponText = new PIXI.Text('', { fontFamily: 'Arial', fontSize: 16, fill: 0xffffff });
    weaponText.position.set(10, 680);
    uiContainer.addChild(weaponText);
    uiContainer.weaponText = weaponText;

    // Ship info
    const shipText = new PIXI.Text('', { fontFamily: 'Arial', fontSize: 14, fill: 0xaaaaaa });
    shipText.position.set(1100, 10);
    uiContainer.addChild(shipText);
    uiContainer.shipText = shipText;

    // Message text
    const messageText = new PIXI.Text('', { fontFamily: 'Arial', fontSize: 20, fill: 0xffff00, align: 'center' });
    messageText.anchor.set(0.5);
    messageText.position.set(640, 100);
    uiContainer.addChild(messageText);
    uiContainer.messageText = messageText;
}

function updateUI() {
    // O2 Bar
    const o2Percent = Math.max(0, player.oxygen / player.maxOxygen);
    uiContainer.o2Bar.clear();
    const o2Color = player.oxygen < 20 ? 0xff4444 : 0x00aaff;
    uiContainer.o2Bar.beginFill(o2Color);
    uiContainer.o2Bar.drawRoundedRect(12, 12, 196 * o2Percent, 16, 4);
    uiContainer.o2Bar.endFill();

    // HP Bar
    const hpPercent = Math.max(0, player.health / player.maxHealth);
    uiContainer.hpBar.clear();
    uiContainer.hpBar.beginFill(0xff4444);
    uiContainer.hpBar.drawRoundedRect(12, 37, 196 * hpPercent, 16, 4);
    uiContainer.hpBar.endFill();

    // Weapon
    const weapon = WEAPONS[player.weapon];
    let ammoText = '';
    if (weapon.ammo) {
        ammoText = ` [${player.ammo[weapon.ammo] || 0}]`;
    }
    uiContainer.weaponText.text = `${weapon.name}${ammoText}`;

    // Ship info
    uiContainer.shipText.text = `Ship ${gameState.currentShip + 1}/${gameState.shipCount}`;
}

// Vision cone
function updateVision() {
    while (lightingContainer.children.length > 0) {
        lightingContainer.removeChildAt(0);
    }

    const visionGfx = new PIXI.Graphics();

    // Dark overlay covering everything
    visionGfx.beginFill(0x000000, 0.85);
    visionGfx.drawRect(
        player.x - 800,
        player.y - 600,
        1600,
        1200
    );
    visionGfx.endFill();

    // Cut out vision cone using raycasting
    const rays = 60;
    const halfAngle = VISION_ANGLE / 2;

    visionGfx.beginHole();
    visionGfx.moveTo(player.x, player.y);

    for (let i = 0; i <= rays; i++) {
        const rayAngle = player.angle - halfAngle + (VISION_ANGLE * i / rays);
        const endpoint = castRay(player.x, player.y, rayAngle, VISION_RANGE);
        visionGfx.lineTo(endpoint.x, endpoint.y);
    }

    visionGfx.lineTo(player.x, player.y);
    visionGfx.endHole();

    // Small ambient circle around player
    visionGfx.beginHole();
    visionGfx.drawCircle(player.x, player.y, 40);
    visionGfx.endHole();

    lightingContainer.addChild(visionGfx);

    // Check enemy visibility
    enemies.forEach(enemy => {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const angleDiff = Math.abs(normalizeAngle(angle - player.angle));

        // Hide enemies outside vision cone
        if (dist > VISION_RANGE || angleDiff > halfAngle) {
            enemy.sprite.visible = false;
        } else {
            // Check line of sight
            const los = checkLineOfSight(player.x, player.y, enemy.x, enemy.y);
            enemy.sprite.visible = los;
        }
    });

    // Pickup visibility
    pickups.forEach(pickup => {
        const dx = pickup.x - player.x;
        const dy = pickup.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const angleDiff = Math.abs(normalizeAngle(angle - player.angle));

        if (dist > VISION_RANGE || angleDiff > halfAngle) {
            pickup.sprite.visible = false;
        } else {
            const los = checkLineOfSight(player.x, player.y, pickup.x, pickup.y);
            pickup.sprite.visible = los;
        }
    });
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function castRay(startX, startY, angle, maxDist) {
    const step = 4;
    let dist = 0;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    while (dist < maxDist) {
        const x = startX + dx * dist;
        const y = startY + dy * dist;

        if (checkWallCollision(x, y, 1)) {
            return { x, y };
        }

        dist += step;
    }

    return { x: startX + dx * maxDist, y: startY + dy * maxDist };
}

function checkLineOfSight(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(dist / 8);

    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const x = x1 + dx * t;
        const y = y1 + dy * t;
        if (checkWallCollision(x, y, 1)) {
            return false;
        }
    }
    return true;
}

function checkWallCollision(x, y, radius) {
    for (const wall of walls) {
        if (x + radius > wall.x && x - radius < wall.x + wall.w &&
            y + radius > wall.y && y - radius < wall.y + wall.h) {
            return true;
        }
    }
    return false;
}

// Player update
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

    const running = keys['ShiftLeft'];
    const speed = running ? player.runSpeed : player.speed;

    const newX = player.x + dx * speed * delta;
    const newY = player.y + dy * speed * delta;

    if (!checkWallCollision(newX, player.y, 14)) {
        player.x = newX;
    }
    if (!checkWallCollision(player.x, newY, 14)) {
        player.y = newY;
    }

    // Face mouse
    const worldMouse = {
        x: mouse.x - app.screen.width / 2 + player.x,
        y: mouse.y - app.screen.height / 2 + player.y
    };
    player.angle = Math.atan2(worldMouse.y - player.y, worldMouse.x - player.x);

    player.sprite.position.set(player.x, player.y);
    player.sprite.rotation = player.angle;

    // O2 drain
    let o2Drain = 0.5; // Idle drain
    if (dx !== 0 || dy !== 0) {
        o2Drain = running ? 1.33 : 0.67;
    }
    player.oxygen -= o2Drain * delta;

    if (player.oxygen <= 0) {
        player.oxygen = 0;
        gameOver('suffocation');
    }

    // Attack cooldown
    if (player.attackCooldown > 0) {
        player.attackCooldown -= delta;
    }

    // Invincibility
    if (player.invincible > 0) {
        player.invincible -= delta;
        player.sprite.alpha = Math.sin(player.invincible * 20) * 0.5 + 0.5;
    } else {
        player.sprite.alpha = 1;
    }

    // Attack on click
    if (mouse.down && player.attackCooldown <= 0) {
        attack();
    }

    // Pickup collection
    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        const dist = Math.sqrt((player.x - pickup.x) ** 2 + (player.y - pickup.y) ** 2);

        if (dist < 30) {
            collectPickup(pickup, i);
        }
    }

    // Check exit
    checkExit();
}

function attack() {
    const weapon = WEAPONS[player.weapon];
    player.attackCooldown = weapon.cooldown;

    // O2 cost for combat
    player.oxygen -= 2;

    if (weapon.type === 'melee') {
        // Melee attack
        enemies.forEach(enemy => {
            const dist = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
            const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
            const angleDiff = Math.abs(normalizeAngle(angle - player.angle));

            if (dist < weapon.range && angleDiff < 0.8) {
                damageEnemy(enemy, weapon.damage);
            }
        });
    } else {
        // Ranged attack
        if (player.ammo[weapon.ammo] <= 0) return;
        player.ammo[weapon.ammo]--;

        if (weapon.pellets) {
            for (let i = 0; i < weapon.pellets; i++) {
                const spread = (Math.random() - 0.5) * 0.4;
                createProjectile(player.x, player.y, player.angle + spread, weapon.damage, false);
            }
        } else {
            createProjectile(player.x, player.y, player.angle, weapon.damage, false);
        }
    }
}

function createProjectile(x, y, angle, damage, isEnemy) {
    const proj = {
        x, y,
        vx: Math.cos(angle) * 500,
        vy: Math.sin(angle) * 500,
        damage,
        isEnemy,
        life: 1
    };

    const gfx = new PIXI.Graphics();
    gfx.beginFill(isEnemy ? 0xff6666 : 0xffff00);
    gfx.drawCircle(0, 0, isEnemy ? 5 : 4);
    gfx.endFill();
    gfx.position.set(x, y);
    entityContainer.addChild(gfx);
    proj.sprite = gfx;
    projectiles.push(proj);
}

function damageEnemy(enemy, damage) {
    enemy.hp -= damage;

    // Knockback
    const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
    enemy.x += Math.cos(angle) * 15;
    enemy.y += Math.sin(angle) * 15;

    if (enemy.hp <= 0) {
        killEnemy(enemy);
    }
}

function killEnemy(enemy) {
    entityContainer.removeChild(enemy.sprite);
    const idx = enemies.indexOf(enemy);
    if (idx >= 0) enemies.splice(idx, 1);

    // Drop items
    if (Math.random() < 0.4) {
        const drops = ['o2_small', 'medkit_small', 'ammo_9mm'];
        const drop = drops[Math.floor(Math.random() * drops.length)];
        createPickup(enemy.x, enemy.y, drop);
    }

    // Boss drop
    if (enemy.type === 'boss') {
        showMessage('Boss defeated! Find the escape pod!');
    }
}

function collectPickup(pickup, index) {
    let collected = true;

    switch (pickup.type) {
        case 'o2_small':
            player.oxygen = Math.min(player.maxOxygen, player.oxygen + 25);
            showMessage('+25 O2');
            break;
        case 'o2_large':
            player.oxygen = Math.min(player.maxOxygen, player.oxygen + 50);
            showMessage('+50 O2');
            break;
        case 'medkit_small':
            player.health = Math.min(player.maxHealth, player.health + 30);
            showMessage('+30 HP');
            break;
        case 'medkit_large':
            player.health = Math.min(player.maxHealth, player.health + 60);
            showMessage('+60 HP');
            break;
        case 'ammo_9mm':
            player.ammo['9mm'] += 12;
            showMessage('+12 9mm');
            break;
        case 'ammo_shells':
            player.ammo.shells += 6;
            showMessage('+6 Shells');
            break;
        case 'pistol':
            player.weapon = 'pistol';
            player.ammo['9mm'] += 12;
            showMessage('Pistol acquired!');
            break;
        case 'shotgun':
            player.weapon = 'shotgun';
            player.ammo.shells += 8;
            showMessage('Shotgun acquired!');
            gameState.hasWeapon = true;
            break;
        case 'smg':
            player.weapon = 'smg';
            player.ammo['9mm'] += 30;
            showMessage('SMG acquired!');
            break;
        default:
            collected = false;
    }

    if (collected) {
        entityContainer.removeChild(pickup.sprite);
        pickups.splice(index, 1);
    }
}

function checkExit() {
    if (!currentLevel) return;

    const exitRoom = currentLevel.rooms.find(r => r.name === 'exit');
    if (!exitRoom) return;

    const inExit = player.x >= exitRoom.x * TILE_SIZE &&
                   player.x <= (exitRoom.x + exitRoom.w) * TILE_SIZE &&
                   player.y >= exitRoom.y * TILE_SIZE &&
                   player.y <= (exitRoom.y + exitRoom.h) * TILE_SIZE;

    if (inExit && enemies.length === 0) {
        if (gameState.currentShip >= 2) {
            victory();
        } else {
            enterSpaceMode();
        }
    }
}

// Enemy update
function updateEnemies(delta) {
    enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Detection
        if (dist < enemy.detectRange) {
            enemy.state = 'chase';

            // Movement toward player
            if (dist > enemy.size / 2 + 20) {
                enemy.x += (dx / dist) * enemy.speed * delta;
                enemy.y += (dy / dist) * enemy.speed * delta;
            }

            // Wall collision
            if (checkWallCollision(enemy.x, enemy.y, enemy.size / 2)) {
                enemy.x -= (dx / dist) * enemy.speed * delta;
                enemy.y -= (dy / dist) * enemy.speed * delta;
            }

            // Attack
            if (dist < enemy.size / 2 + 20) {
                enemy.attackCooldown -= delta;
                if (enemy.attackCooldown <= 0) {
                    damagePlayer(enemy.damage);
                    enemy.attackCooldown = 1.2;
                }
            }

            // Boss special: spawn crawlers at 50% HP
            if (enemy.type === 'boss' && enemy.hp < enemy.maxHp * 0.5 && !enemy.spawnedMinions) {
                enemy.spawnedMinions = true;
                createEnemy(enemy.x + 50, enemy.y, 'crawler');
                createEnemy(enemy.x - 50, enemy.y, 'crawler');
            }
        }

        enemy.sprite.position.set(enemy.x, enemy.y);
    });
}

function damagePlayer(damage) {
    if (player.invincible > 0) return;

    player.health -= damage;
    player.invincible = 0.5;

    if (player.health <= 0) {
        gameOver('death');
    }
}

// Projectile update
function updateProjectiles(delta) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.vx * delta;
        proj.y += proj.vy * delta;
        proj.life -= delta;
        proj.sprite.position.set(proj.x, proj.y);

        let hit = false;

        // Wall collision
        if (checkWallCollision(proj.x, proj.y, 3)) {
            hit = true;
        }

        // Enemy collision (player projectiles)
        if (!proj.isEnemy) {
            for (const enemy of enemies) {
                const dist = Math.sqrt((proj.x - enemy.x) ** 2 + (proj.y - enemy.y) ** 2);
                if (dist < enemy.size / 2) {
                    damageEnemy(enemy, proj.damage);
                    hit = true;
                    break;
                }
            }
        }

        // Player collision (enemy projectiles)
        if (proj.isEnemy) {
            const dist = Math.sqrt((proj.x - player.x) ** 2 + (proj.y - player.y) ** 2);
            if (dist < 18) {
                damagePlayer(proj.damage);
                hit = true;
            }
        }

        if (hit || proj.life <= 0) {
            entityContainer.removeChild(proj.sprite);
            projectiles.splice(i, 1);
        }
    }
}

// Camera
function updateCamera() {
    gameContainer.x = app.screen.width / 2 - player.x;
    gameContainer.y = app.screen.height / 2 - player.y;
}

// Space mode
function enterSpaceMode() {
    gameMode = MODE.SPACE;
    gameState.currentShip++;

    showSpaceUI();
}

function showSpaceUI() {
    while (spaceContainer.children.length > 0) spaceContainer.removeChildAt(0);

    // Background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000011);
    bg.drawRect(0, 0, 1280, 720);
    bg.endFill();
    spaceContainer.addChild(bg);

    // Stars
    for (let i = 0; i < 100; i++) {
        const star = new PIXI.Graphics();
        star.beginFill(0xffffff, Math.random() * 0.5 + 0.5);
        star.drawCircle(0, 0, Math.random() * 2);
        star.endFill();
        star.position.set(Math.random() * 1280, Math.random() * 720);
        spaceContainer.addChild(star);
    }

    // Ships
    const shipColors = [0x444444, 0x666666, 0x888888];
    for (let i = 0; i < 3; i++) {
        const ship = new PIXI.Graphics();
        ship.beginFill(i <= gameState.currentShip ? shipColors[i] : 0x333333);
        ship.drawRect(-40, -20, 80, 40);
        ship.endFill();

        const label = new PIXI.Text(`Ship ${i + 1}`, { fontFamily: 'Arial', fontSize: 14, fill: 0xffffff });
        label.anchor.set(0.5);
        label.position.set(0, 35);
        ship.addChild(label);

        if (i === gameState.currentShip) {
            ship.lineStyle(3, 0x00ff00);
            ship.drawRect(-45, -25, 90, 50);

            const enterText = new PIXI.Text('Press ENTER to dock', { fontFamily: 'Arial', fontSize: 12, fill: 0x00ff00 });
            enterText.anchor.set(0.5);
            enterText.position.set(0, 55);
            ship.addChild(enterText);
        }

        ship.position.set(250 + i * 300, 360);
        spaceContainer.addChild(ship);
    }

    // Info
    const infoText = new PIXI.Text(
        `O2: ${Math.ceil(player.oxygen)}  HP: ${Math.ceil(player.health)}`,
        { fontFamily: 'Arial', fontSize: 18, fill: 0xffffff }
    );
    infoText.position.set(10, 10);
    spaceContainer.addChild(infoText);
}

function exitSpaceMode() {
    gameMode = MODE.SHIP;
    while (spaceContainer.children.length > 0) spaceContainer.removeChildAt(0);

    generateShip(gameState.currentShip);
    createPlayer();
    createUI();
}

// Messages
function showMessage(text, duration = 2000) {
    uiContainer.messageText.text = text;
    setTimeout(() => {
        uiContainer.messageText.text = '';
    }, duration);
}

// Game over / Victory
function gameOver(reason) {
    gameState.gameOver = true;
    const msg = reason === 'suffocation' ?
        'Your lungs burned for oxygen that never came.' :
        'Your body joins the ship\'s other victims.';
    showMessage(`GAME OVER\n${msg}\nPress R to restart`, 10000);
}

function victory() {
    gameState.victory = true;
    showMessage('ESCAPED!\nYou survived the derelict ships!\nPress R to play again', 10000);
}

function restart() {
    gameState.currentShip = 0;
    gameState.gameOver = false;
    gameState.victory = false;
    gameState.hasWeapon = false;

    player.health = 100;
    player.oxygen = 100;
    player.weapon = 'pipe';
    player.ammo = { '9mm': 0, shells: 0 };
    player.invincible = 0;

    gameMode = MODE.SHIP;
    while (spaceContainer.children.length > 0) spaceContainer.removeChildAt(0);

    generateShip(0);
    createPlayer();
    createUI();
}

// Input handlers
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (e.code === 'KeyR' && (gameState.gameOver || gameState.victory)) {
        restart();
    }

    if (e.code === 'Enter' && gameMode === MODE.SPACE) {
        exitSpaceMode();
    }

    // Weapon switch
    if (e.code === 'Digit1') player.weapon = 'pipe';
    if (e.code === 'Digit2' && player.ammo['9mm'] > 0) player.weapon = 'pistol';
    if (e.code === 'Digit3' && player.ammo.shells > 0) player.weapon = 'shotgun';
    if (e.code === 'Digit4' && player.ammo['9mm'] > 0) player.weapon = 'smg';
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mousedown', (e) => {
    if (e.button === 0) mouse.down = true;
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
});

window.addEventListener('contextmenu', (e) => e.preventDefault());

// Game loop
app.ticker.add((delta) => {
    const dt = delta / 60;

    if (gameMode === MODE.SHIP && !gameState.paused && !gameState.gameOver && !gameState.victory) {
        updatePlayer(dt);
        updateEnemies(dt);
        updateProjectiles(dt);
        updateVision();
        updateCamera();
        updateUI();
    }
});

// Initialize
generateShip(0);
createPlayer();
createUI();
showMessage('WASD to move, Mouse to aim, Click to attack\nShift to run (costs more O2)', 4000);

console.log('Derelict Ship initialized');
