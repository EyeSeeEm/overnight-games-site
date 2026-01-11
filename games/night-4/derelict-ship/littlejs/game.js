// DERELICT - Survival Horror
// LittleJS Implementation

'use strict';

// Configuration
const TILE_SIZE = 32;
const VISION_CONE_ANGLE = Math.PI / 2; // 90 degrees
const VISION_CONE_RANGE = 12; // tiles

// Game state
let gameState = 'menu'; // menu, playing, victory, death
let player;
let enemies = [];
let items = [];
let containers = [];
let projectiles = [];
let doors = [];

// Resources
let oxygen = 100;
let maxOxygen = 100;
let health = 100;
let maxHealth = 100;
let structuralIntegrity = 100;

// Power system (8 bars total, start with 4)
let powerAvailable = 4;
let powerMax = 8;
let powerAllocation = {
    lights: 1,
    doors: 1,
    scanners: 0,
    lifeSupport: 2,
    security: 0,
    engines: 0
};

// Sector system
let currentSector = 1;
const MAX_SECTORS = 6;
let sectorStates = {};

// Inventory
let inventory = [];
const MAX_INVENTORY = 6;
let equippedWeapon = { name: 'Pipe', damage: 20, durability: 15 };

// Keycards
let hasBlueKeycard = false;
let hasRedKeycard = false;
let hasGoldKeycard = false;

// Flashlight
let flashlightOn = true;
let flashlightBattery = 60;
let flashlightMaxBattery = 60;

// Room data
let roomWalls = [];
let roomFloor = [];

// Timers
let oxygenTimer = 0;
let integrityTimer = 0;
let gameTime = 0;

// Enemy definitions
const ENEMY_DEFS = {
    crawler: { name: 'Crawler', hp: 30, damage: 15, speed: 0.05, range: 8, color: new Color(0.6, 0.3, 0.2) },
    shambler: { name: 'Shambler', hp: 60, damage: 25, speed: 0.03, range: 6, color: new Color(0.4, 0.5, 0.3) },
    stalker: { name: 'Stalker', hp: 45, damage: 20, speed: 0.09, range: 10, color: new Color(0.2, 0.2, 0.3) },
    bloater: { name: 'Bloater', hp: 100, damage: 10, speed: 0.02, range: 4, explodes: true, color: new Color(0.5, 0.6, 0.3) },
    hunter: { name: 'Hunter', hp: 80, damage: 35, speed: 0.11, range: 15, color: new Color(0.5, 0.2, 0.2) }
};

// Item definitions
const ITEM_DEFS = {
    o2_small: { name: 'O2 Canister (S)', effect: { oxygen: 25 }, color: new Color(0.2, 0.5, 0.8) },
    o2_large: { name: 'O2 Canister (L)', effect: { oxygen: 50 }, color: new Color(0.3, 0.6, 0.9) },
    medkit_small: { name: 'Medkit (S)', effect: { health: 30 }, color: new Color(0.8, 0.2, 0.2) },
    medkit_large: { name: 'Medkit (L)', effect: { health: 60 }, color: new Color(0.9, 0.3, 0.3) },
    keycard_blue: { name: 'Blue Keycard', keycard: 'blue', color: new Color(0.2, 0.4, 0.9) },
    keycard_red: { name: 'Red Keycard', keycard: 'red', color: new Color(0.9, 0.2, 0.2) },
    keycard_gold: { name: 'Gold Keycard', keycard: 'gold', color: new Color(0.9, 0.8, 0.2) },
    ammo_9mm: { name: '9mm Ammo', ammo: 15, color: new Color(0.7, 0.6, 0.2) },
    pistol: { name: 'Pistol', weapon: { damage: 25, ranged: true, ammo: 12 }, color: new Color(0.4, 0.4, 0.4) }
};

// Player class
class Player extends EngineObject {
    constructor(pos) {
        super(pos, vec2(1, 1), undefined, 0, new Color(0.2, 0.6, 0.9));
        this.facingAngle = 0;
        this.speed = 0.07;
        this.attackCooldown = 0;
        this.iframes = 0;
        this.isRunning = false;
    }

    update() {
        if (gameState !== 'playing') return;

        // I-frames
        if (this.iframes > 0) this.iframes -= 1/60;

        // Face mouse cursor
        const mouseWorld = screenToWorld(mousePos);
        this.facingAngle = Math.atan2(mouseWorld.y - this.pos.y, mouseWorld.x - this.pos.x);

        // Movement
        let moveDir = vec2(0, 0);
        if (keyIsDown('KeyW') || keyIsDown('ArrowUp')) moveDir.y = 1;
        if (keyIsDown('KeyS') || keyIsDown('ArrowDown')) moveDir.y = -1;
        if (keyIsDown('KeyA') || keyIsDown('ArrowLeft')) moveDir.x = -1;
        if (keyIsDown('KeyD') || keyIsDown('ArrowRight')) moveDir.x = 1;

        this.isRunning = keyIsDown('ShiftLeft') || keyIsDown('ShiftRight');

        if (moveDir.length() > 0) {
            moveDir = moveDir.normalize();
            const speed = this.isRunning ? this.speed * 1.6 : this.speed;
            const newPos = this.pos.add(moveDir.scale(speed));

            if (!checkWallCollision(newPos)) {
                this.pos = newPos;
            }
        }

        // Attack cooldown
        if (this.attackCooldown > 0) this.attackCooldown -= 1/60;

        // Attack
        if (mouseWasPressed(0) && this.attackCooldown <= 0) {
            this.attack();
        }

        // Interact
        if (keyWasPressed('KeyE')) {
            this.interact();
        }

        // Toggle flashlight
        if (keyWasPressed('KeyF')) {
            flashlightOn = !flashlightOn;
        }

        // Check sector exits
        checkSectorExits();
    }

    attack() {
        this.attackCooldown = 0.6;

        // Melee attack
        const attackDir = vec2(Math.cos(this.facingAngle), Math.sin(this.facingAngle));

        for (const enemy of enemies) {
            const toEnemy = enemy.pos.subtract(this.pos);
            const dist = toEnemy.length();

            if (dist < 2) {
                const dot = attackDir.dot(toEnemy.normalize());
                if (dot > 0.5) {
                    enemy.takeDamage(equippedWeapon.damage);
                    oxygen = Math.max(0, oxygen - 2); // Combat costs O2
                }
            }
        }

        // Durability
        if (equippedWeapon.durability) {
            equippedWeapon.durability--;
            if (equippedWeapon.durability <= 0) {
                equippedWeapon = { name: 'Fists', damage: 5, durability: Infinity };
            }
        }
    }

    interact() {
        // Check containers
        for (const container of containers) {
            if (container.pos.distance(this.pos) < 1.5 && !container.looted) {
                lootContainer(container);
                return;
            }
        }

        // Check doors
        for (const door of doors) {
            if (door.pos.distance(this.pos) < 2) {
                interactDoor(door);
                return;
            }
        }

        // Check escape pod (sector 6 only)
        if (currentSector === 6 && this.pos.distance(vec2(0, 0)) < 3) {
            if (hasGoldKeycard && powerAllocation.engines >= 3) {
                gameState = 'victory';
            } else if (!hasGoldKeycard) {
                showNotification('Need Gold Keycard!');
            } else {
                showNotification('Need 3 power in Engines!');
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
        const dir = vec2(Math.cos(this.facingAngle), Math.sin(this.facingAngle));
        drawRect(this.pos.add(dir.scale(0.6)), vec2(0.3, 0.2), new Color(0.8, 0.8, 0.3));
    }

    takeDamage(damage) {
        if (this.iframes > 0) return;
        health -= damage;
        this.iframes = 0.5;

        if (health <= 0) {
            gameState = 'death';
        }
    }
}

// Enemy class
class Enemy extends EngineObject {
    constructor(pos, type) {
        const def = ENEMY_DEFS[type];
        super(pos, vec2(1, 1), undefined, 0, def.color);
        this.type = type;
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.damage = def.damage;
        this.speed = def.speed;
        this.range = def.range;
        this.attackCooldown = 0;
        this.state = 'patrol';
        this.explodes = def.explodes || false;
        this.visible = false;
    }

    update() {
        if (gameState !== 'playing' || !player) return;

        // Check if in player's vision cone
        this.visible = isInVisionCone(this.pos);

        const dist = this.pos.distance(player.pos);

        // Detection
        if (dist < this.range) {
            this.state = 'chase';
        }

        if (this.state === 'chase') {
            const dir = player.pos.subtract(this.pos).normalize();

            if (dist > 1.2) {
                const newPos = this.pos.add(dir.scale(this.speed));
                if (!checkWallCollision(newPos)) {
                    this.pos = newPos;
                }
            } else if (this.attackCooldown <= 0) {
                player.takeDamage(this.damage);
                this.attackCooldown = 1.5;
            }
        }

        if (this.attackCooldown > 0) this.attackCooldown -= 1/60;
    }

    render() {
        // Only render if visible in vision cone
        if (!this.visible) return;

        drawRect(this.pos, this.size, this.color);

        // Health bar
        if (this.hp < this.maxHp) {
            const hpPercent = this.hp / this.maxHp;
            drawRect(this.pos.add(vec2(0, 0.7)), vec2(1, 0.15), new Color(0.3, 0.3, 0.3));
            drawRect(this.pos.add(vec2((hpPercent - 1) * 0.5, 0.7)), vec2(hpPercent, 0.15), new Color(1, 0, 0));
        }
    }

    takeDamage(damage) {
        this.hp -= damage;

        if (this.hp <= 0) {
            // Bloater explosion
            if (this.explodes) {
                if (player.pos.distance(this.pos) < 3) {
                    player.takeDamage(40);
                }
            }

            this.destroy();
            const idx = enemies.indexOf(this);
            if (idx > -1) enemies.splice(idx, 1);

            // Drop loot
            if (rand() < 0.3) {
                spawnItem(this.pos, rand() < 0.5 ? 'o2_small' : 'medkit_small');
            }
        }
    }
}

// Item class
class Item extends EngineObject {
    constructor(pos, type) {
        const def = ITEM_DEFS[type];
        super(pos, vec2(0.6, 0.6), undefined, 0, def.color);
        this.type = type;
        this.visible = false;
    }

    update() {
        if (!player) return;

        this.visible = isInVisionCone(this.pos) || powerAllocation.lights >= 1;

        // Pickup
        if (this.pos.distance(player.pos) < 1) {
            if (pickupItem(this.type)) {
                this.destroy();
                const idx = items.indexOf(this);
                if (idx > -1) items.splice(idx, 1);
            }
        }
    }

    render() {
        if (!this.visible) return;

        const pulse = 0.8 + Math.sin(time * 4) * 0.2;
        drawRect(this.pos, this.size.scale(pulse), this.color);
    }
}

// Container class
class Container extends EngineObject {
    constructor(pos, lootTable) {
        super(pos, vec2(1, 1), undefined, 0, new Color(0.5, 0.4, 0.3));
        this.lootTable = lootTable;
        this.looted = false;
        this.visible = false;
    }

    render() {
        this.visible = isInVisionCone(this.pos) || powerAllocation.lights >= 1;
        if (!this.visible) return;

        const col = this.looted ? new Color(0.25, 0.2, 0.15) : this.color;
        drawRect(this.pos, this.size, col);

        if (!this.looted) {
            drawRect(this.pos.add(vec2(0, 0.25)), vec2(0.5, 0.15), new Color(0.7, 0.6, 0.4));
        }
    }
}

// Door class
class Door extends EngineObject {
    constructor(pos, isVertical, locked = false, requiredKey = null) {
        super(pos, isVertical ? vec2(0.4, 1.5) : vec2(1.5, 0.4), undefined, 0, new Color(0.4, 0.4, 0.5));
        this.isOpen = false;
        this.locked = locked;
        this.requiredKey = requiredKey;
        this.isVertical = isVertical;
    }

    render() {
        const col = this.locked ? new Color(0.6, 0.2, 0.2) :
                    this.isOpen ? new Color(0.2, 0.4, 0.2) : this.color;
        drawRect(this.pos, this.isOpen ? this.size.scale(0.3) : this.size, col);
    }
}

// Helper functions
function checkWallCollision(pos) {
    for (const wall of roomWalls) {
        if (pos.distance(wall) < 0.7) return true;
    }

    // Check closed doors
    for (const door of doors) {
        if (!door.isOpen && pos.distance(door.pos) < 1) return true;
    }

    return false;
}

function isInVisionCone(targetPos) {
    if (!player) return false;

    const toTarget = targetPos.subtract(player.pos);
    const dist = toTarget.length();

    // Check range
    let maxRange = VISION_CONE_RANGE;
    if (powerAllocation.lights === 0) {
        maxRange = flashlightOn && flashlightBattery > 0 ? 6 : 2;
    }

    if (dist > maxRange) return false;

    // Check angle
    const angleToTarget = Math.atan2(toTarget.y, toTarget.x);
    let angleDiff = angleToTarget - player.facingAngle;

    // Normalize angle
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) > VISION_CONE_ANGLE / 2) return false;

    // Check wall occlusion (simple ray)
    const steps = Math.floor(dist * 2);
    for (let i = 1; i < steps; i++) {
        const checkPos = player.pos.add(toTarget.scale(i / steps));
        if (checkWallCollision(checkPos)) return false;
    }

    return true;
}

function spawnItem(pos, type) {
    const item = new Item(pos.add(vec2(rand(-0.3, 0.3), rand(-0.3, 0.3))), type);
    items.push(item);
}

function pickupItem(type) {
    const def = ITEM_DEFS[type];

    // Keycard pickup
    if (def.keycard) {
        if (def.keycard === 'blue') hasBlueKeycard = true;
        else if (def.keycard === 'red') hasRedKeycard = true;
        else if (def.keycard === 'gold') hasGoldKeycard = true;
        showNotification(`Found ${def.name}!`);
        return true;
    }

    // Instant effect items
    if (def.effect) {
        if (def.effect.oxygen) {
            oxygen = Math.min(maxOxygen, oxygen + def.effect.oxygen);
            showNotification(`+${def.effect.oxygen} O2`);
            return true;
        }
        if (def.effect.health) {
            health = Math.min(maxHealth, health + def.effect.health);
            showNotification(`+${def.effect.health} HP`);
            return true;
        }
    }

    // Inventory items
    if (inventory.length < MAX_INVENTORY) {
        inventory.push({ type });
        showNotification(`Found ${def.name}`);
        return true;
    }

    showNotification('Inventory full!');
    return false;
}

function lootContainer(container) {
    container.looted = true;

    const lootTables = {
        basic: ['o2_small', 'o2_small', 'medkit_small'],
        medical: ['medkit_small', 'medkit_large', 'o2_large'],
        tech: ['ammo_9mm', 'o2_small', 'medkit_small']
    };

    const table = lootTables[container.lootTable] || lootTables.basic;
    const itemType = table[Math.floor(rand() * table.length)];
    pickupItem(itemType);
}

function interactDoor(door) {
    if (powerAllocation.doors === 0) {
        showNotification('Doors need power!');
        return;
    }

    if (door.locked) {
        if (door.requiredKey === 'blue' && hasBlueKeycard) {
            door.locked = false;
            showNotification('Blue Keycard used');
        } else if (door.requiredKey === 'red' && hasRedKeycard) {
            door.locked = false;
            showNotification('Red Keycard used');
        } else if (door.requiredKey === 'gold' && hasGoldKeycard) {
            door.locked = false;
            showNotification('Gold Keycard used');
        } else {
            showNotification(`Need ${door.requiredKey} Keycard!`);
            return;
        }
    }

    door.isOpen = !door.isOpen;
}

function checkSectorExits() {
    const sector = getSectorSize();
    const halfW = sector.width / 2;
    const halfH = sector.height / 2;

    // North exit (to next sector)
    if (player.pos.y > halfH - 1 && currentSector < MAX_SECTORS) {
        // Check keycard requirements
        if (currentSector === 2 && !hasBlueKeycard) {
            showNotification('Need Blue Keycard to proceed!');
            player.pos.y = halfH - 2;
            return;
        }
        if (currentSector === 4 && !hasRedKeycard) {
            showNotification('Need Red Keycard to proceed!');
            player.pos.y = halfH - 2;
            return;
        }

        saveSectorState();
        currentSector++;
        generateSector();
        player.pos = vec2(0, -halfH + 2);
    }

    // South exit (to previous sector)
    if (player.pos.y < -halfH + 1 && currentSector > 1) {
        saveSectorState();
        currentSector--;
        generateSector();
        player.pos = vec2(0, halfH - 2);
    }
}

function getSectorSize() {
    const sizes = {
        1: { width: 20, height: 15 },
        2: { width: 22, height: 18 },
        3: { width: 25, height: 20 },
        4: { width: 22, height: 18 },
        5: { width: 25, height: 20 },
        6: { width: 20, height: 15 }
    };
    return sizes[currentSector] || { width: 20, height: 15 };
}

function saveSectorState() {
    sectorStates[currentSector] = {
        enemies: enemies.map(e => ({ type: e.type, pos: e.pos.copy(), hp: e.hp })),
        items: items.map(i => ({ type: i.type, pos: i.pos.copy() })),
        containers: containers.map(c => ({ pos: c.pos.copy(), looted: c.looted, lootTable: c.lootTable })),
        doors: doors.map(d => ({ pos: d.pos.copy(), isOpen: d.isOpen, locked: d.locked, requiredKey: d.requiredKey, isVertical: d.isVertical }))
    };
}

function loadSectorState() {
    const state = sectorStates[currentSector];
    if (!state) return false;

    enemies.forEach(e => e.destroy());
    enemies = [];
    for (const eData of state.enemies) {
        const enemy = new Enemy(eData.pos, eData.type);
        enemy.hp = eData.hp;
        enemies.push(enemy);
    }

    items.forEach(i => i.destroy());
    items = [];
    for (const iData of state.items) {
        const item = new Item(iData.pos, iData.type);
        items.push(item);
    }

    containers.forEach(c => c.destroy());
    containers = [];
    for (const cData of state.containers) {
        const container = new Container(cData.pos, cData.lootTable);
        container.looted = cData.looted;
        containers.push(container);
    }

    doors.forEach(d => d.destroy());
    doors = [];
    for (const dData of state.doors) {
        const door = new Door(dData.pos, dData.isVertical, dData.locked, dData.requiredKey);
        door.isOpen = dData.isOpen;
        doors.push(door);
    }

    return true;
}

function generateSector() {
    roomWalls = [];
    enemies.forEach(e => e.destroy());
    enemies = [];
    items.forEach(i => i.destroy());
    items = [];
    containers.forEach(c => c.destroy());
    containers = [];
    doors.forEach(d => d.destroy());
    doors = [];

    if (loadSectorState()) return;

    const sector = getSectorSize();
    const halfW = sector.width / 2;
    const halfH = sector.height / 2;

    // Outer walls
    for (let x = -halfW; x <= halfW; x++) {
        roomWalls.push(vec2(x, halfH));
        roomWalls.push(vec2(x, -halfH));
    }
    for (let y = -halfH; y <= halfH; y++) {
        roomWalls.push(vec2(-halfW, y));
        roomWalls.push(vec2(halfW, y));
    }

    // Add internal walls
    const wallCount = currentSector + 2;
    for (let i = 0; i < wallCount; i++) {
        const wx = rand(-halfW + 3, halfW - 3);
        const wy = rand(-halfH + 3, halfH - 3);
        const len = rand(3, 6);
        const vertical = rand() > 0.5;

        for (let j = 0; j < len; j++) {
            if (vertical) {
                roomWalls.push(vec2(wx, wy + j));
            } else {
                roomWalls.push(vec2(wx + j, wy));
            }
        }
    }

    // Spawn enemies based on sector
    const enemyConfigs = {
        1: [['crawler', 2], ['crawler', 1]],
        2: [['shambler', 2], ['shambler', 2]],
        3: [['stalker', 2], ['crawler', 2]],
        4: [['bloater', 1], ['shambler', 2]],
        5: [['hunter', 1], ['stalker', 2]],
        6: [['hunter', 2]]
    };

    const config = enemyConfigs[currentSector] || [];
    for (const [type, count] of config) {
        for (let i = 0; i < count; i++) {
            const pos = vec2(rand(-halfW + 3, halfW - 3), rand(-halfH + 3, halfH - 3));
            enemies.push(new Enemy(pos, type));
        }
    }

    // Spawn containers
    const containerCount = 4 + currentSector;
    const lootTypes = ['basic', 'medical', 'tech'];
    for (let i = 0; i < containerCount; i++) {
        const pos = vec2(rand(-halfW + 2, halfW - 2), rand(-halfH + 2, halfH - 2));
        containers.push(new Container(pos, lootTypes[i % lootTypes.length]));
    }

    // Guaranteed keycards
    if (currentSector === 2) {
        spawnItem(vec2(rand(-3, 3), rand(-3, 3)), 'keycard_blue');
    }
    if (currentSector === 4) {
        spawnItem(vec2(rand(-3, 3), rand(-3, 3)), 'keycard_red');
    }
    if (currentSector === 6) {
        spawnItem(vec2(rand(-3, 3), rand(2, 5)), 'keycard_gold');
    }

    // Starting items in sector 1
    if (currentSector === 1) {
        spawnItem(vec2(-2, -2), 'o2_small');
        spawnItem(vec2(2, -2), 'o2_small');
    }
}

function updateResources(dt) {
    // O2 drain
    oxygenTimer += dt;
    let drainRate = 2; // seconds per 1 O2

    if (keyIsDown('KeyW') || keyIsDown('KeyS') || keyIsDown('KeyA') || keyIsDown('KeyD')) {
        drainRate = player.isRunning ? 0.75 : 1.5;
    }

    if (oxygenTimer >= drainRate) {
        oxygenTimer = 0;
        oxygen = Math.max(0, oxygen - 1);

        // Life support helps
        if (powerAllocation.lifeSupport >= 2) {
            oxygen = Math.min(maxOxygen, oxygen + 0.5);
        }
    }

    if (oxygen <= 0) {
        gameState = 'death';
    }

    // Structural integrity decay
    integrityTimer += dt;
    const decayRate = powerAllocation.lifeSupport >= 2 ? 60 : 45;

    if (integrityTimer >= decayRate) {
        integrityTimer = 0;
        structuralIntegrity = Math.max(0, structuralIntegrity - 1);
    }

    if (structuralIntegrity <= 0) {
        gameState = 'death';
    }

    // Flashlight battery
    if (flashlightOn) {
        flashlightBattery = Math.max(0, flashlightBattery - dt);
    } else {
        flashlightBattery = Math.min(flashlightMaxBattery, flashlightBattery + dt * 0.5);
    }

    // Game time
    gameTime += dt;
}

let notifications = [];
function showNotification(text) {
    notifications.push({ text, life: 3 });
}

// LittleJS callbacks
function gameInit() {
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

    // Update resources
    updateResources(1/60);

    // Update notifications
    for (let i = notifications.length - 1; i >= 0; i--) {
        notifications[i].life -= 1/60;
        if (notifications[i].life <= 0) {
            notifications.splice(i, 1);
        }
    }

    // Quick use items
    if (keyWasPressed('Digit1')) useQuickSlot(0);
    if (keyWasPressed('Digit2')) useQuickSlot(1);
    if (keyWasPressed('Digit3')) useQuickSlot(2);
}

function useQuickSlot(slot) {
    if (slot >= inventory.length) return;

    const item = inventory[slot];
    const def = ITEM_DEFS[item.type];

    if (def.effect) {
        if (def.effect.oxygen) {
            oxygen = Math.min(maxOxygen, oxygen + def.effect.oxygen);
        }
        if (def.effect.health) {
            health = Math.min(maxHealth, health + def.effect.health);
        }
        inventory.splice(slot, 1);
    }
}

function gameUpdatePost() {
    if (player && gameState === 'playing') {
        cameraPos = player.pos;
    }
}

function gameRender() {
    // Draw floor
    const sector = getSectorSize();
    const halfW = sector.width / 2;
    const halfH = sector.height / 2;

    const lightLevel = powerAllocation.lights >= 1 ? 0.25 : 0.08;

    for (let x = -halfW; x <= halfW; x++) {
        for (let y = -halfH; y <= halfH; y++) {
            drawRect(vec2(x, y), vec2(1, 1), new Color(lightLevel, lightLevel, lightLevel + 0.02));
        }
    }

    // Draw walls (always visible for navigation)
    for (const wall of roomWalls) {
        drawRect(wall, vec2(1, 1), new Color(0.35, 0.35, 0.4));
    }

    // Draw vision cone lighting
    if (player) {
        drawVisionCone();
    }

    // Draw escape pod in sector 6
    if (currentSector === 6) {
        const podVisible = isInVisionCone(vec2(0, 0)) || powerAllocation.lights >= 1;
        if (podVisible) {
            drawRect(vec2(0, 0), vec2(3, 2), new Color(0.2, 0.5, 0.3));
            drawText('ESCAPE', vec2(0, 1.2), 0.3, new Color(0, 1, 0));
        }
    }
}

function drawVisionCone() {
    const range = powerAllocation.lights >= 1 ? VISION_CONE_RANGE :
                  (flashlightOn && flashlightBattery > 0 ? 6 : 2);

    // Draw illuminated area as lighter tiles
    for (let x = -15; x <= 15; x++) {
        for (let y = -15; y <= 15; y++) {
            const checkPos = player.pos.add(vec2(x, y));
            if (isInVisionCone(checkPos)) {
                drawRect(checkPos, vec2(1, 1), new Color(0.15, 0.15, 0.1, 0.3));
            }
        }
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

    drawHUD();

    // Draw notifications
    for (let i = 0; i < notifications.length; i++) {
        const n = notifications[i];
        const alpha = Math.min(1, n.life);
        drawTextScreen(n.text, vec2(mainCanvasSize.x / 2, 120 + i * 25), 16, new Color(1, 1, 0, alpha), 0, undefined, 'center');
    }
}

function drawMenu() {
    drawTextScreen('DERELICT', vec2(mainCanvasSize.x / 2, 120), 48, new Color(0.8, 0.2, 0.2), 0, undefined, 'center');
    drawTextScreen('Survival Horror', vec2(mainCanvasSize.x / 2, 170), 18, new Color(0.5, 0.5, 0.5), 0, undefined, 'center');

    drawTextScreen('Press SPACE to Start', vec2(mainCanvasSize.x / 2, 280), 20, new Color(0, 0.8, 0), 0, undefined, 'center');

    drawTextScreen('CONTROLS:', vec2(mainCanvasSize.x / 2, 370), 16, new Color(0.7, 0.7, 0.7), 0, undefined, 'center');
    drawTextScreen('WASD - Move | SHIFT - Run | Mouse - Look', vec2(mainCanvasSize.x / 2, 400), 12, new Color(0.5, 0.5, 0.5), 0, undefined, 'center');
    drawTextScreen('LMB - Attack | E - Interact | F - Flashlight', vec2(mainCanvasSize.x / 2, 420), 12, new Color(0.5, 0.5, 0.5), 0, undefined, 'center');
    drawTextScreen('1-3 - Quick Use Items', vec2(mainCanvasSize.x / 2, 440), 12, new Color(0.5, 0.5, 0.5), 0, undefined, 'center');

    drawTextScreen('Reach the Escape Pod before O2 runs out!', vec2(mainCanvasSize.x / 2, 500), 14, new Color(0.8, 0.4, 0.4), 0, undefined, 'center');
}

function drawVictory() {
    drawTextScreen('ESCAPED!', vec2(mainCanvasSize.x / 2, 150), 48, new Color(0, 1, 0), 0, undefined, 'center');

    const mins = Math.floor(gameTime / 60);
    const secs = Math.floor(gameTime % 60);
    drawTextScreen(`Time: ${mins}:${secs.toString().padStart(2, '0')}`, vec2(mainCanvasSize.x / 2, 250), 20, new Color(0.8, 0.8, 0.8), 0, undefined, 'center');
    drawTextScreen(`O2 Remaining: ${Math.floor(oxygen)}`, vec2(mainCanvasSize.x / 2, 280), 16, new Color(0.5, 0.7, 0.9), 0, undefined, 'center');
    drawTextScreen(`Ship Integrity: ${Math.floor(structuralIntegrity)}%`, vec2(mainCanvasSize.x / 2, 310), 16, new Color(0.5, 0.7, 0.9), 0, undefined, 'center');

    drawTextScreen('Press SPACE to Play Again', vec2(mainCanvasSize.x / 2, 420), 18, new Color(0, 0.8, 0), 0, undefined, 'center');
}

function drawDeath() {
    const deathReason = oxygen <= 0 ? 'SUFFOCATED' :
                        health <= 0 ? 'KILLED' :
                        structuralIntegrity <= 0 ? 'SHIP DESTROYED' : 'GAME OVER';

    drawTextScreen(deathReason, vec2(mainCanvasSize.x / 2, 150), 48, new Color(0.8, 0, 0), 0, undefined, 'center');

    drawTextScreen(`Reached Sector ${currentSector}/${MAX_SECTORS}`, vec2(mainCanvasSize.x / 2, 250), 18, new Color(0.6, 0.6, 0.6), 0, undefined, 'center');

    drawTextScreen('Press R to Restart', vec2(mainCanvasSize.x / 2, 380), 18, new Color(0.8, 0, 0), 0, undefined, 'center');
}

function drawHUD() {
    // O2 Bar
    const barWidth = 150;
    const barHeight = 20;

    drawRectScreenSpace(vec2(100, 30), vec2(barWidth + 4, barHeight + 4), new Color(0.2, 0.2, 0.2));
    drawRectScreenSpace(vec2(26 + (oxygen/maxOxygen) * barWidth/2, 30), vec2((oxygen/maxOxygen) * barWidth, barHeight), new Color(0.2, 0.6, 0.9));
    drawTextScreen(`O2: ${Math.floor(oxygen)}/${maxOxygen}`, vec2(100, 30), 12, new Color(1, 1, 1), 0, undefined, 'center');

    // HP Bar
    drawRectScreenSpace(vec2(100, 58), vec2(barWidth + 4, barHeight + 4), new Color(0.2, 0.2, 0.2));
    drawRectScreenSpace(vec2(26 + (health/maxHealth) * barWidth/2, 58), vec2((health/maxHealth) * barWidth, barHeight), new Color(0.8, 0.2, 0.2));
    drawTextScreen(`HP: ${Math.floor(health)}/${maxHealth}`, vec2(100, 58), 12, new Color(1, 1, 1), 0, undefined, 'center');

    // Structural Integrity
    drawTextScreen(`INTEGRITY: ${Math.floor(structuralIntegrity)}%`, vec2(mainCanvasSize.x - 100, 30), 14,
        structuralIntegrity < 25 ? new Color(1, 0, 0) : new Color(0.7, 0.7, 0.7));

    // Sector
    drawTextScreen(`SECTOR ${currentSector}/${MAX_SECTORS}`, vec2(mainCanvasSize.x / 2, 20), 16, new Color(0, 0.8, 0), 0, undefined, 'center');

    // Flashlight
    const flashColor = flashlightOn ? new Color(1, 1, 0) : new Color(0.4, 0.4, 0.4);
    drawTextScreen(`[F] LIGHT: ${Math.floor(flashlightBattery)}s`, vec2(mainCanvasSize.x - 100, 58), 12, flashColor);

    // Keycards
    let keyY = 90;
    if (hasBlueKeycard) {
        drawTextScreen('[BLUE]', vec2(mainCanvasSize.x - 80, keyY), 10, new Color(0.2, 0.4, 0.9));
        keyY += 15;
    }
    if (hasRedKeycard) {
        drawTextScreen('[RED]', vec2(mainCanvasSize.x - 80, keyY), 10, new Color(0.9, 0.2, 0.2));
        keyY += 15;
    }
    if (hasGoldKeycard) {
        drawTextScreen('[GOLD]', vec2(mainCanvasSize.x - 80, keyY), 10, new Color(0.9, 0.8, 0.2));
    }

    // Weapon
    drawTextScreen(`Weapon: ${equippedWeapon.name}`, vec2(mainCanvasSize.x / 2, mainCanvasSize.y - 40), 14, new Color(0.8, 0.8, 0.8), 0, undefined, 'center');

    // Quick slots
    for (let i = 0; i < 3; i++) {
        const slotX = 30 + i * 55;
        const slotY = mainCanvasSize.y - 60;

        drawRectScreenSpace(vec2(slotX + 22, slotY + 22), vec2(44, 44), new Color(0.15, 0.15, 0.15));
        drawTextScreen((i + 1).toString(), vec2(slotX + 5, slotY + 5), 10, new Color(0.5, 0.5, 0.5));

        if (i < inventory.length) {
            const def = ITEM_DEFS[inventory[i].type];
            drawTextScreen(def.name.substring(0, 5), vec2(slotX + 22, slotY + 28), 9, new Color(1, 1, 1), 0, undefined, 'center');
        }
    }

    // Power display
    drawTextScreen(`PWR: ${getTotalPower()}/${powerMax}`, vec2(30, mainCanvasSize.y - 100), 10, new Color(0, 0.8, 0));

    // Scanner warning (enemies outside vision)
    if (powerAllocation.scanners >= 2) {
        let nearbyEnemies = 0;
        for (const enemy of enemies) {
            if (!enemy.visible && enemy.pos.distance(player.pos) < 10) {
                nearbyEnemies++;
            }
        }
        if (nearbyEnemies > 0) {
            drawTextScreen(`! ${nearbyEnemies} DETECTED !`, vec2(mainCanvasSize.x / 2, 80), 14, new Color(1, 0.3, 0.3), 0, undefined, 'center');
        }
    }
}

function getTotalPower() {
    return powerAllocation.lights + powerAllocation.doors + powerAllocation.scanners +
           powerAllocation.lifeSupport + powerAllocation.security + powerAllocation.engines;
}

function drawRectScreenSpace(pos, size, color) {
    drawRect(screenToWorld(pos), size.scale(1/cameraScale), color);
}

function startGame() {
    gameState = 'playing';

    // Reset everything
    oxygen = 100;
    maxOxygen = 100;
    health = 100;
    maxHealth = 100;
    structuralIntegrity = 100;

    powerAvailable = 4;
    powerAllocation = {
        lights: 1,
        doors: 1,
        scanners: 0,
        lifeSupport: 2,
        security: 0,
        engines: 0
    };

    currentSector = 1;
    sectorStates = {};

    inventory = [];
    equippedWeapon = { name: 'Pipe', damage: 20, durability: 15 };

    hasBlueKeycard = false;
    hasRedKeycard = false;
    hasGoldKeycard = false;

    flashlightOn = true;
    flashlightBattery = 60;

    oxygenTimer = 0;
    integrityTimer = 0;
    gameTime = 0;

    notifications = [];

    // Create player
    player = new Player(vec2(0, -5));

    // Generate first sector
    generateSector();
}

// Initialize LittleJS
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
