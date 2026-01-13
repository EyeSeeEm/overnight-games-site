// Station Breach - Twin-Stick Shooter with Survival Horror Elements
// Built with LittleJS - Night 6 Implementation
'use strict';

// ==================== CONSTANTS ====================
const TILE_SIZE = 32;
const PLAYER_SPEED = 3;
const PLAYER_SPRINT_SPEED = 4.5;
const PLAYER_RADIUS = 0.4;

// Colors
const COLOR_FLOOR = new Color(0.12, 0.12, 0.15);
const COLOR_WALL = new Color(0.25, 0.25, 0.28);
const COLOR_PLAYER = new Color(0, 0.9, 0.9);
const COLOR_DRONE = new Color(0.3, 0.8, 0.2);
const COLOR_SPITTER = new Color(0.6, 0.3, 0.8);
const COLOR_LURKER = new Color(0.8, 0.5, 0.1);
const COLOR_BRUTE = new Color(0.6, 0.2, 0.2);
const COLOR_BULLET = new Color(1, 1, 0.4);
const COLOR_ENEMY_BULLET = new Color(0.3, 1, 0.3);
const COLOR_HEALTH = new Color(1, 0.3, 0.3);
const COLOR_AMMO = new Color(0.9, 0.9, 0.3);
const COLOR_KEYCARD_GREEN = new Color(0, 1, 0);
const COLOR_KEYCARD_BLUE = new Color(0, 0.5, 1);
const COLOR_KEYCARD_YELLOW = new Color(1, 1, 0);
const COLOR_DOOR_NORMAL = new Color(0.5, 0.35, 0.2);
const COLOR_DOOR_GREEN = new Color(0, 0.6, 0);
const COLOR_DOOR_BLUE = new Color(0, 0.3, 0.8);

// ==================== GAME STATE ====================
let gameState = 'playing'; // Start directly in playing state for LittleJS
let gamePaused = true; // Start paused for harness
let player = null;
let enemies = [];
let bullets = [];
let enemyBullets = [];
let pickups = [];
let doors = [];
let walls = [];
let floatingTexts = [];
let bloodDecals = [];

// Player stats
let playerStats = {
    health: 300,
    maxHealth: 300,
    stamina: 100,
    maxStamina: 100,
    credits: 0,
    keycards: { green: false, blue: false, yellow: false }
};

// Weapons
const WEAPONS = {
    pistol: { damage: 15, fireRate: 0.25, magSize: 12, reloadTime: 0.95, spread: 3, speed: 15, ammoType: '9mm' },
    shotgun: { damage: 8, pellets: 6, fireRate: 0.75, magSize: 8, reloadTime: 2.0, spread: 20, speed: 12, ammoType: 'shells' },
    smg: { damage: 10, fireRate: 0.08, magSize: 40, reloadTime: 1.55, spread: 8, speed: 14, ammoType: '9mm' }
};

let currentWeapon = 'pistol';
let weaponInventory = ['pistol'];
let ammo = { '9mm': 999, 'shells': 24, 'rifle': 0 };
let currentMag = 12;
let isReloading = false;
let reloadTimer = 0;
let shootCooldown = 0;
let lastOutOfAmmoMsg = 0;

// Level data
let levelData = [];
const LEVEL_WIDTH = 50;
const LEVEL_HEIGHT = 40;

// Vision system
let visibleCells = new Set();
const VISION_RANGE = 12;

// Harness input simulation
let simulatedKeys = new Set();
let simulatedClick = null;

// ==================== LEVEL GENERATION ====================
function generateLevel() {
    levelData = [];
    walls = [];
    doors = [];
    pickups = [];
    enemies = [];
    bullets = [];
    enemyBullets = [];

    // Initialize with walls
    for (let y = 0; y < LEVEL_HEIGHT; y++) {
        levelData[y] = [];
        for (let x = 0; x < LEVEL_WIDTH; x++) {
            levelData[y][x] = 1; // wall
        }
    }

    // Create rooms connected by corridors
    const rooms = [];

    // Starting room (safe, no enemies)
    rooms.push({ x: 3, y: 3, w: 8, h: 6, type: 'start' });

    // Section A rooms (no keycard needed)
    rooms.push({ x: 14, y: 3, w: 7, h: 6, type: 'combat' });
    rooms.push({ x: 24, y: 3, w: 6, h: 8, type: 'keycard_green' });

    // Section B rooms (need green keycard)
    rooms.push({ x: 3, y: 15, w: 8, h: 7, type: 'combat_hard' });
    rooms.push({ x: 14, y: 15, w: 7, h: 7, type: 'combat' });
    rooms.push({ x: 24, y: 14, w: 8, h: 8, type: 'keycard_blue' });

    // Section C rooms (need blue keycard)
    rooms.push({ x: 3, y: 28, w: 10, h: 8, type: 'boss' });
    rooms.push({ x: 16, y: 28, w: 8, h: 8, type: 'exit' });

    // Carve out rooms
    for (const room of rooms) {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                if (y >= 0 && y < LEVEL_HEIGHT && x >= 0 && x < LEVEL_WIDTH) {
                    levelData[y][x] = 0; // floor
                }
            }
        }
    }

    // Create corridors between rooms
    // Start to Room 1
    createCorridor(10, 6, 14, 6);
    // Room 1 to Room 2 (green keycard room)
    createCorridor(20, 6, 24, 6);

    // Start to Section B (green door)
    createCorridor(7, 8, 7, 15);
    doors.push({ x: 7, y: 12, type: 'green', open: false });

    // Section B internal corridors
    createCorridor(10, 18, 14, 18);
    createCorridor(20, 18, 24, 18);

    // Section B to Section C (blue door)
    createCorridor(7, 21, 7, 28);
    doors.push({ x: 7, y: 25, type: 'blue', open: false });

    // Boss room to exit
    createCorridor(12, 32, 16, 32);
    doors.push({ x: 14, y: 32, type: 'normal', open: false });

    // Add obstacles and destructibles to rooms
    addRoomContents(rooms);

    // Build wall objects
    for (let y = 0; y < LEVEL_HEIGHT; y++) {
        for (let x = 0; x < LEVEL_WIDTH; x++) {
            if (levelData[y][x] === 1) {
                walls.push({ x, y });
            }
        }
    }

    // Spawn player in start room
    player = new Player(vec2(7, 6));

    // Spawn enemies based on room types
    for (const room of rooms) {
        spawnRoomEnemies(room);
        spawnRoomPickups(room);
    }
}

function createCorridor(x1, y1, x2, y2) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    // Horizontal corridor
    for (let x = minX; x <= maxX; x++) {
        for (let dy = -1; dy <= 1; dy++) {
            const y = y1 + dy;
            if (y >= 0 && y < LEVEL_HEIGHT && x >= 0 && x < LEVEL_WIDTH) {
                levelData[y][x] = 0;
            }
        }
    }

    // Vertical corridor
    for (let y = minY; y <= maxY; y++) {
        for (let dx = -1; dx <= 1; dx++) {
            const x = x2 + dx;
            if (y >= 0 && y < LEVEL_HEIGHT && x >= 0 && x < LEVEL_WIDTH) {
                levelData[y][x] = 0;
            }
        }
    }
}

function addRoomContents(rooms) {
    // Simplified - no crates for easier navigation
    // Crates removed to allow AI pathfinding to work better
}

function spawnRoomEnemies(room) {
    if (room.type === 'start') return;

    let numEnemies = 0;
    let types = ['drone'];

    switch (room.type) {
        case 'combat':
            numEnemies = randInt(2, 3);  // Reduced from 3-5
            types = ['drone', 'drone', 'spitter'];
            break;
        case 'combat_hard':
            numEnemies = randInt(3, 4);  // Reduced from 4-7
            types = ['drone', 'spitter', 'lurker'];
            break;
        case 'keycard_green':
        case 'keycard_blue':
            numEnemies = randInt(2, 4);  // Reduced from 4-6
            types = ['drone', 'spitter'];  // Removed lurkers from keycard rooms
            break;
        case 'boss':
            numEnemies = randInt(4, 6);  // Reduced from 6-10
            types = ['drone', 'spitter', 'lurker', 'brute'];
            break;
        case 'exit':
            numEnemies = 0;  // No enemies in exit room - just reach it to win
            types = ['drone'];
            break;
    }

    for (let i = 0; i < numEnemies; i++) {
        const ex = room.x + 1 + rand() * (room.w - 2);
        const ey = room.y + 1 + rand() * (room.h - 2);
        const type = types[randInt(0, types.length)];
        enemies.push(new Enemy(vec2(ex, ey), type));
    }
}

function spawnRoomPickups(room) {
    // Health pickups
    if (room.type !== 'start' && rand() < 0.5) {
        const px = room.x + 1 + rand() * (room.w - 2);
        const py = room.y + 1 + rand() * (room.h - 2);
        pickups.push({ x: px, y: py, type: 'health', amount: 25 });
    }

    // Ammo pickups
    if (room.type !== 'start' && rand() < 0.6) {
        const px = room.x + 1 + rand() * (room.w - 2);
        const py = room.y + 1 + rand() * (room.h - 2);
        pickups.push({ x: px, y: py, type: 'ammo', ammoType: '9mm', amount: 20 });
    }

    // Keycards
    if (room.type === 'keycard_green') {
        pickups.push({ x: room.x + room.w/2, y: room.y + room.h/2, type: 'keycard', keyType: 'green' });
    }
    if (room.type === 'keycard_blue') {
        pickups.push({ x: room.x + room.w/2, y: room.y + room.h/2, type: 'keycard', keyType: 'blue' });
    }

    // Weapons
    if (room.type === 'combat_hard' && !weaponInventory.includes('shotgun')) {
        pickups.push({ x: room.x + room.w/2, y: room.y + 1, type: 'weapon', weaponType: 'shotgun' });
    }
}

// ==================== COLLISION HELPERS ====================
function isWall(x, y) {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    if (tileX < 0 || tileX >= LEVEL_WIDTH || tileY < 0 || tileY >= LEVEL_HEIGHT) return true;
    return levelData[tileY] && (levelData[tileY][tileX] === 1 || levelData[tileY][tileX] === 2);
}

function hasLineOfSight(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const steps = Math.ceil(dist * 3);

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = x1 + dx * t;
        const y = y1 + dy * t;
        if (isWall(x, y)) return false;
    }
    return true;
}

// ==================== VISION RAYCASTING ====================
function updateVision() {
    visibleCells.clear();
    if (!player) return;

    const px = player.pos.x;
    const py = player.pos.y;

    // Cast rays in all directions
    const numRays = 180;
    for (let i = 0; i < numRays; i++) {
        const angle = (i / numRays) * Math.PI * 2;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);

        for (let dist = 0; dist < VISION_RANGE; dist += 0.3) {
            const x = px + dx * dist;
            const y = py + dy * dist;
            const cellKey = `${Math.floor(x)},${Math.floor(y)}`;
            visibleCells.add(cellKey);

            if (isWall(x, y)) break;
        }
    }
}

function isVisible(x, y) {
    const cellKey = `${Math.floor(x)},${Math.floor(y)}`;
    return visibleCells.has(cellKey);
}

// ==================== FLOATING TEXT ====================
function addFloatingText(x, y, text, color) {
    floatingTexts.push({
        x, y,
        text,
        color: color || new Color(1, 1, 1),
        life: 1.5,
        vy: 2
    });
}

// ==================== PLAYER CLASS ====================
class Player extends EngineObject {
    constructor(pos) {
        super(pos, vec2(0.7, 0.7), undefined, 0, COLOR_PLAYER);
        this.facing = vec2(1, 0);
        this.invincibleTimer = 0;
        this.setCollision(true, false);
    }

    update() {
        if (gamePaused) return;
        super.update();

        // Invincibility frames
        if (this.invincibleTimer > 0) this.invincibleTimer -= 1/60;

        // Movement input
        let moveDir = vec2(0, 0);
        if (isKeyHeld('w') || isKeyHeld('ArrowUp')) moveDir.y += 1;
        if (isKeyHeld('s') || isKeyHeld('ArrowDown')) moveDir.y -= 1;
        if (isKeyHeld('a') || isKeyHeld('ArrowLeft')) moveDir.x -= 1;
        if (isKeyHeld('d') || isKeyHeld('ArrowRight')) moveDir.x += 1;

        // Sprint
        const sprinting = isKeyHeld('Shift') && playerStats.stamina > 0 && moveDir.length() > 0;
        if (sprinting) {
            playerStats.stamina -= 25 / 60;
        } else if (playerStats.stamina < playerStats.maxStamina) {
            playerStats.stamina += 20 / 60;
        }
        playerStats.stamina = clamp(playerStats.stamina, 0, playerStats.maxStamina);

        // Apply movement with wall sliding
        if (moveDir.length() > 0) {
            moveDir = moveDir.normalize();
            const speed = sprinting ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
            const moveAmount = moveDir.scale(speed / 60);

            // Try X movement
            const newX = this.pos.x + moveAmount.x;
            if (!isWall(newX - 0.3, this.pos.y) && !isWall(newX + 0.3, this.pos.y)) {
                this.pos.x = newX;
            }

            // Try Y movement
            const newY = this.pos.y + moveAmount.y;
            if (!isWall(this.pos.x, newY - 0.3) && !isWall(this.pos.x, newY + 0.3)) {
                this.pos.y = newY;
            }
        }

        // Aiming
        const mouseWorld = screenToWorld(mousePos);
        const aimDir = mouseWorld.subtract(this.pos);
        if (aimDir.length() > 0.1) {
            this.facing = aimDir.normalize();
            this.angle = Math.atan2(this.facing.y, this.facing.x);
        }

        // Shooting
        if (shootCooldown > 0) shootCooldown -= 1/60;

        if ((mouseIsDown(0) || isKeyHeld('Space')) && !isReloading && shootCooldown <= 0) {
            this.shoot();
        }

        // Reload
        if (isKeyPressed('r') && !isReloading) {
            this.startReload();
        }

        if (isReloading) {
            reloadTimer -= 1/60;
            if (reloadTimer <= 0) {
                this.finishReload();
            }
        }

        // Weapon switch
        if (isKeyPressed('q')) {
            this.cycleWeapon();
        }

        // Interact (doors, pickups) - use isKeyHeld for harness compatibility
        if (isKeyHeld('e')) {
            this.interact();
        }

        // Melee fallback
        if (isKeyPressed('f')) {
            this.melee();
        }

        // Pickup collision
        this.checkPickups();

        // Door collision
        this.checkDoors();
    }

    shoot() {
        const weapon = WEAPONS[currentWeapon];

        if (currentMag <= 0) {
            const now = Date.now();
            if (now - lastOutOfAmmoMsg > 1000) {
                addFloatingText(this.pos.x, this.pos.y + 1, 'OUT OF AMMO!', new Color(1, 0.3, 0.3));
                lastOutOfAmmoMsg = now;
            }
            this.startReload();
            return;
        }

        // Screen shake (reduced per feedback)
        // Screen shake removed - was too strong

        if (weapon.pellets) {
            // Shotgun
            for (let i = 0; i < weapon.pellets; i++) {
                const spread = (rand() - 0.5) * weapon.spread * Math.PI / 180;
                const dir = vec2(
                    Math.cos(this.angle + spread),
                    Math.sin(this.angle + spread)
                );
                bullets.push(new Bullet(this.pos.add(this.facing.scale(0.5)), dir, weapon.damage, weapon.speed));
            }
        } else {
            const spread = (rand() - 0.5) * weapon.spread * Math.PI / 180;
            const dir = vec2(
                Math.cos(this.angle + spread),
                Math.sin(this.angle + spread)
            );
            bullets.push(new Bullet(this.pos.add(this.facing.scale(0.5)), dir, weapon.damage, weapon.speed));
        }

        currentMag--;
        shootCooldown = weapon.fireRate;
    }

    startReload() {
        const weapon = WEAPONS[currentWeapon];
        if (ammo[weapon.ammoType] <= 0 && currentMag > 0) return;
        if (currentMag >= weapon.magSize) return;

        isReloading = true;
        reloadTimer = weapon.reloadTime;
        addFloatingText(this.pos.x, this.pos.y + 1, 'Reloading...', new Color(0.8, 0.8, 0.8));
    }

    finishReload() {
        const weapon = WEAPONS[currentWeapon];
        const needed = weapon.magSize - currentMag;
        const available = ammo[weapon.ammoType];
        const toLoad = Math.min(needed, available);

        currentMag += toLoad;
        if (weapon.ammoType !== '9mm' || ammo[weapon.ammoType] < 999) {
            ammo[weapon.ammoType] -= toLoad;
        }
        isReloading = false;
    }

    cycleWeapon() {
        const idx = weaponInventory.indexOf(currentWeapon);
        const nextIdx = (idx + 1) % weaponInventory.length;
        currentWeapon = weaponInventory[nextIdx];
        currentMag = WEAPONS[currentWeapon].magSize;
        isReloading = false;
        addFloatingText(this.pos.x, this.pos.y + 1, currentWeapon.toUpperCase(), new Color(0.8, 0.8, 1));
    }

    interact() {
        // Check doors - interaction range must be >= blocking range
        for (const door of doors) {
            const dist = Math.sqrt((this.pos.x - door.x) ** 2 + (this.pos.y - door.y) ** 2);
            if (dist < 3) {  // Larger than blocking range (2.5)
                this.tryOpenDoor(door);
            }
        }
    }

    tryOpenDoor(door) {
        if (door.open) return;

        if (door.type === 'normal') {
            door.open = true;
            addFloatingText(door.x, door.y + 1, 'Door Opened', new Color(0.8, 0.8, 0.8));
            logEvent('Opened normal door');
        } else if (door.type === 'green') {
            if (playerStats.keycards.green) {
                door.open = true;
                addFloatingText(door.x, door.y + 1, 'Green Door Opened!', COLOR_KEYCARD_GREEN);
                logEvent('Opened GREEN door');
            } else {
                addFloatingText(door.x, door.y + 1, 'Need Green Keycard', COLOR_KEYCARD_GREEN);
            }
        } else if (door.type === 'blue') {
            if (playerStats.keycards.blue) {
                door.open = true;
                addFloatingText(door.x, door.y + 1, 'Blue Door Opened!', COLOR_KEYCARD_BLUE);
                logEvent('Opened BLUE door');
            } else {
                addFloatingText(door.x, door.y + 1, 'Need Blue Keycard', COLOR_KEYCARD_BLUE);
            }
        }
    }

    checkDoors() {
        for (const door of doors) {
            if (door.open) continue;
            const dist = Math.sqrt((this.pos.x - door.x) ** 2 + (this.pos.y - door.y) ** 2);
            if (dist < 2.5) {  // Larger blocking radius to cover corridor width
                // Block player
                const dx = this.pos.x - door.x;
                const dy = this.pos.y - door.y;
                const pushDist = 2.5 - dist;
                if (dist > 0) {
                    this.pos.x += (dx / dist) * pushDist;
                    this.pos.y += (dy / dist) * pushDist;
                }
            }
        }
    }

    checkPickups() {
        for (let i = pickups.length - 1; i >= 0; i--) {
            const p = pickups[i];
            const dist = Math.sqrt((this.pos.x - p.x) ** 2 + (this.pos.y - p.y) ** 2);
            if (dist < 2.0) {  // Increased pickup radius for easier collection
                this.collectPickup(p, i);
            }
        }
    }

    collectPickup(p, index) {
        let collected = false;
        let text = '';
        let color = new Color(1, 1, 1);

        switch (p.type) {
            case 'health':
                if (playerStats.health < playerStats.maxHealth) {
                    playerStats.health = Math.min(playerStats.maxHealth, playerStats.health + p.amount);
                    collected = true;
                    text = `+${p.amount} Health`;
                    color = COLOR_HEALTH;
                }
                break;
            case 'ammo':
                ammo[p.ammoType] += p.amount;
                collected = true;
                text = `+${p.amount} ${p.ammoType}`;
                color = COLOR_AMMO;
                break;
            case 'keycard':
                playerStats.keycards[p.keyType] = true;
                collected = true;
                text = `${p.keyType.toUpperCase()} KEYCARD`;
                color = p.keyType === 'green' ? COLOR_KEYCARD_GREEN : COLOR_KEYCARD_BLUE;
                logEvent(`Picked up ${p.keyType} keycard!`);
                break;
            case 'weapon':
                if (!weaponInventory.includes(p.weaponType)) {
                    weaponInventory.push(p.weaponType);
                    collected = true;
                    text = `Got ${p.weaponType.toUpperCase()}!`;
                    color = new Color(1, 0.8, 0.2);
                }
                break;
        }

        if (collected) {
            pickups.splice(index, 1);
            addFloatingText(p.x, p.y + 0.5, text, color);
        }
    }

    melee() {
        // Melee attack when out of ammo
        const meleeRange = 1.5;
        const meleeDamage = 20;

        for (const enemy of enemies) {
            const dist = this.pos.subtract(enemy.pos).length();
            if (dist < meleeRange) {
                const dir = enemy.pos.subtract(this.pos).normalize();
                enemy.takeDamage(meleeDamage, dir);
            }
        }
        addFloatingText(this.pos.x + this.facing.x, this.pos.y + this.facing.y, 'PUNCH!', new Color(1, 0.6, 0.2));
    }

    takeDamage(amount) {
        if (this.invincibleTimer > 0) return;

        playerStats.health -= amount;
        this.invincibleTimer = 1.5; // 1.5 second i-frames
        addFloatingText(this.pos.x, this.pos.y + 1, `-${amount}`, COLOR_HEALTH);
        logEvent(`Player took ${amount} damage (HP: ${playerStats.health}/${playerStats.maxHealth})`);

        if (playerStats.health <= 0) {
            gameState = 'gameover';
            logEvent('GAME OVER - Player died');
        }
    }

    render() {
        // Flash when invincible
        if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 10) % 2 === 0) {
            return;
        }

        // Draw player body
        drawRect(this.pos, vec2(0.7, 0.7), COLOR_PLAYER);

        // Draw facing direction indicator
        const gunTip = this.pos.add(this.facing.scale(0.5));
        drawRect(gunTip, vec2(0.3, 0.15), new Color(0.5, 0.5, 0.5), this.angle);
    }
}

// ==================== BULLET CLASS ====================
class Bullet extends EngineObject {
    constructor(pos, dir, damage, speed, isEnemy = false) {
        super(pos, vec2(0.2, 0.2), undefined, 0, isEnemy ? COLOR_ENEMY_BULLET : COLOR_BULLET);
        this.dir = dir;
        this.damage = damage;
        this.speed = speed;
        this.isEnemy = isEnemy;
        this.life = 2;
    }

    update() {
        if (gamePaused) return;

        this.pos = this.pos.add(this.dir.scale(this.speed / 60));
        this.life -= 1/60;

        // Wall collision
        if (isWall(this.pos.x, this.pos.y)) {
            this.destroy();
            return;
        }

        if (this.life <= 0) {
            this.destroy();
            return;
        }

        // Hit detection
        if (this.isEnemy) {
            if (player) {
                const dist = this.pos.subtract(player.pos).length();
                if (dist < 0.5) {
                    player.takeDamage(this.damage);
                    this.destroy();
                }
            }
        } else {
            for (const enemy of enemies) {
                const dist = this.pos.subtract(enemy.pos).length();
                if (dist < enemy.radius) {
                    enemy.takeDamage(this.damage, this.dir);
                    this.destroy();
                    break;
                }
            }
        }
    }

    destroy() {
        const idx = this.isEnemy ? enemyBullets.indexOf(this) : bullets.indexOf(this);
        if (idx >= 0) {
            if (this.isEnemy) {
                enemyBullets.splice(idx, 1);
            } else {
                bullets.splice(idx, 1);
            }
        }
    }

    render() {
        drawRect(this.pos, vec2(0.2, 0.2), this.isEnemy ? COLOR_ENEMY_BULLET : COLOR_BULLET);
    }
}

// ==================== ENEMY CLASS ====================
class Enemy extends EngineObject {
    constructor(pos, type) {
        super(pos, vec2(0.6, 0.6));
        this.type = type;
        this.facing = vec2(1, 0);
        this.attackCooldown = 0;
        this.alertTimer = 0;
        this.alerted = false;

        // Stats by type
        switch (type) {
            case 'drone':
                this.health = 20;
                this.maxHealth = 20;
                this.speed = 2;
                this.damage = 10;
                this.color = COLOR_DRONE;
                this.radius = 0.4;
                this.attackRange = 1;
                this.detectionRange = 8;
                break;
            case 'spitter':
                this.health = 30;
                this.maxHealth = 30;
                this.speed = 1.3;
                this.damage = 10; // Reduced from 15
                this.color = COLOR_SPITTER;
                this.radius = 0.5;
                this.attackRange = 10;
                this.detectionRange = 12;
                this.isRanged = true;
                this.preferredDist = 6;
                break;
            case 'lurker':
                this.health = 25;  // Reduced from 40 - now 2 pistol shots
                this.maxHealth = 25;
                this.speed = 3.5;
                this.damage = 15; // Reduced from 20
                this.color = COLOR_LURKER;
                this.radius = 0.4;
                this.attackRange = 1;
                this.detectionRange = 6;
                this.lunging = false;
                break;
            case 'brute':
                this.health = 100;
                this.maxHealth = 100;
                this.speed = 1;
                this.damage = 25; // Reduced from 30
                this.color = COLOR_BRUTE;
                this.radius = 0.7;
                this.attackRange = 1.5;
                this.detectionRange = 8;
                this.charging = false;
                this.chargeSpeed = 5;
                break;
        }
    }

    update() {
        if (gamePaused) return;

        if (!player) return;

        const toPlayer = player.pos.subtract(this.pos);
        const distToPlayer = toPlayer.length();

        // Update facing direction
        if (toPlayer.length() > 0.1) {
            this.facing = toPlayer.normalize();
            this.angle = Math.atan2(this.facing.y, this.facing.x);
        }

        // Check if can see player (raycasting)
        const canSee = distToPlayer < this.detectionRange && hasLineOfSight(this.pos.x, this.pos.y, player.pos.x, player.pos.y);

        // Alert on seeing player or hearing gunfire nearby
        if (canSee || (shootCooldown > 0 && distToPlayer < 15)) {
            this.alerted = true;
            this.alertTimer = 5; // Stay alerted for 5 seconds
        }

        if (this.alertTimer > 0) {
            this.alertTimer -= 1/60;
        } else {
            this.alerted = false;
        }

        // Attack cooldown
        if (this.attackCooldown > 0) this.attackCooldown -= 1/60;

        // Behavior based on type
        if (this.alerted) {
            this.pursueBehavior(toPlayer, distToPlayer, canSee);
        }
    }

    pursueBehavior(toPlayer, distToPlayer, canSee) {
        const moveDir = toPlayer.normalize();

        // Type-specific behavior
        if (this.isRanged) {
            // Spitter: maintain distance and shoot
            if (distToPlayer < this.preferredDist - 1) {
                // Too close, back up
                this.move(moveDir.scale(-1));
            } else if (distToPlayer > this.preferredDist + 2) {
                // Too far, get closer
                this.move(moveDir);
            }

            // Attack if in range and can see
            if (canSee && distToPlayer < this.attackRange && this.attackCooldown <= 0) {
                this.rangedAttack();
            }
        } else if (this.type === 'lurker') {
            // Lurker: fast rush
            if (distToPlayer < this.attackRange) {
                if (this.attackCooldown <= 0) {
                    this.meleeAttack();
                }
            } else {
                this.move(moveDir, this.lunging ? 1.5 : 1);
                if (distToPlayer < 3 && !this.lunging) {
                    this.lunging = true;
                    setTimeout(() => this.lunging = false, 500);
                }
            }
        } else if (this.type === 'brute') {
            // Brute: slow approach then charge
            if (distToPlayer < this.attackRange) {
                if (this.attackCooldown <= 0) {
                    this.meleeAttack();
                }
            } else if (distToPlayer < 4 && !this.charging) {
                // Start charge
                this.charging = true;
                setTimeout(() => {
                    this.charging = false;
                    this.attackCooldown = 1.5; // Stunned after charge
                }, 1000);
            } else {
                const speed = this.charging ? this.chargeSpeed : this.speed;
                this.move(moveDir, this.charging ? this.chargeSpeed / this.speed : 1);
            }
        } else {
            // Drone: simple rush
            if (distToPlayer < this.attackRange) {
                if (this.attackCooldown <= 0) {
                    this.meleeAttack();
                }
            } else {
                this.move(moveDir);
            }
        }
    }

    move(dir, speedMult = 1) {
        const moveAmount = dir.scale(this.speed * speedMult / 60);
        const newX = this.pos.x + moveAmount.x;
        const newY = this.pos.y + moveAmount.y;

        // Wall sliding
        if (!isWall(newX, this.pos.y)) {
            this.pos.x = newX;
        } else {
            // Try to slide
            if (!isWall(newX, this.pos.y + 0.5)) {
                this.pos.y += 0.03;
            } else if (!isWall(newX, this.pos.y - 0.5)) {
                this.pos.y -= 0.03;
            }
        }

        if (!isWall(this.pos.x, newY)) {
            this.pos.y = newY;
        } else {
            // Try to slide
            if (!isWall(this.pos.x + 0.5, newY)) {
                this.pos.x += 0.03;
            } else if (!isWall(this.pos.x - 0.5, newY)) {
                this.pos.x -= 0.03;
            }
        }
    }

    meleeAttack() {
        if (!player) return;
        player.takeDamage(this.damage);
        this.attackCooldown = 1.0;
    }

    rangedAttack() {
        if (!player) return;
        const dir = player.pos.subtract(this.pos).normalize();
        enemyBullets.push(new Bullet(this.pos.add(dir.scale(0.5)), dir, this.damage, 8, true));
        this.attackCooldown = 2.0;
    }

    takeDamage(amount, knockbackDir) {
        this.health -= amount;
        this.alerted = true;
        this.alertTimer = 5;

        // Knockback (reduced for brutes)
        if (knockbackDir && this.type !== 'brute') {
            const knockback = knockbackDir.scale(0.3);
            if (!isWall(this.pos.x + knockback.x, this.pos.y)) {
                this.pos.x += knockback.x;
            }
            if (!isWall(this.pos.x, this.pos.y + knockback.y)) {
                this.pos.y += knockback.y;
            }
        }

        // Blood decal
        bloodDecals.push({ x: this.pos.x, y: this.pos.y, size: rand(0.3, 0.6), alpha: 1 });
        if (bloodDecals.length > 50) bloodDecals.shift();

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        const idx = enemies.indexOf(this);
        if (idx >= 0) {
            enemies.splice(idx, 1);
            logEvent(`Enemy killed: ${this.type} at (${this.pos.x.toFixed(1)}, ${this.pos.y.toFixed(1)})`);
        }

        // Drop loot
        const dropRoll = rand();
        if (dropRoll < 0.2) {
            pickups.push({ x: this.pos.x, y: this.pos.y, type: 'health', amount: 15 });
        } else if (dropRoll < 0.5) {
            pickups.push({ x: this.pos.x, y: this.pos.y, type: 'ammo', ammoType: '9mm', amount: 10 });
        }

        // Credits based on enemy type
        const credits = this.type === 'brute' ? 30 : this.type === 'lurker' ? 15 : this.type === 'spitter' ? 10 : 5;
        playerStats.credits += credits;
        addFloatingText(this.pos.x, this.pos.y + 0.5, `+${credits}`, new Color(1, 1, 0));
    }

    render() {
        // Only render if visible
        if (!isVisible(this.pos.x, this.pos.y)) return;

        // Draw enemy body
        drawRect(this.pos, vec2(this.radius * 2, this.radius * 2), this.color);

        // Draw facing direction
        const faceTip = this.pos.add(this.facing.scale(this.radius + 0.2));
        drawRect(faceTip, vec2(0.15, 0.15), new Color(1, 1, 1));

        // Health bar
        if (this.health < this.maxHealth) {
            const barWidth = this.radius * 2;
            const healthPct = this.health / this.maxHealth;
            drawRect(this.pos.add(vec2(0, this.radius + 0.3)), vec2(barWidth, 0.1), new Color(0.3, 0.3, 0.3));
            drawRect(this.pos.add(vec2(-(barWidth/2) * (1-healthPct), this.radius + 0.3)), vec2(barWidth * healthPct, 0.1), COLOR_HEALTH);
        }
    }
}

// ==================== INPUT HELPERS ====================
function isKeyHeld(key) {
    // Check all variations of the key
    const keyLower = key.toLowerCase();
    if (simulatedKeys.has(keyLower)) return true;
    if (simulatedKeys.has(key)) return true;

    // Map common key names
    const keyMap = {
        'w': 'KeyW', 'a': 'KeyA', 's': 'KeyS', 'd': 'KeyD',
        'e': 'KeyE', 'r': 'KeyR', 'q': 'KeyQ', 'f': 'KeyF',
        'shift': 'ShiftLeft', 'Shift': 'ShiftLeft',
        'ArrowUp': 'ArrowUp', 'ArrowDown': 'ArrowDown',
        'ArrowLeft': 'ArrowLeft', 'ArrowRight': 'ArrowRight',
        ' ': 'Space', 'Space': 'Space', 'space': 'Space'
    };

    const mappedKey = keyMap[key] || keyMap[keyLower] || key;
    if (simulatedKeys.has(mappedKey)) return true;
    if (simulatedKeys.has(mappedKey.toLowerCase())) return true;

    return keyIsDown(mappedKey) || keyIsDown(key);
}

function isKeyPressed(key) {
    const keyMap = {
        'w': 'KeyW', 'a': 'KeyA', 's': 'KeyS', 'd': 'KeyD',
        'e': 'KeyE', 'r': 'KeyR', 'q': 'KeyQ', 'f': 'KeyF',
        ' ': 'Space', 'Space': 'Space'
    };
    const mappedKey = keyMap[key] || key;
    return keyWasPressed(mappedKey) || keyWasPressed(key);
}

// ==================== RENDERING ====================
function renderGame() {
    // Draw floor
    for (let y = 0; y < LEVEL_HEIGHT; y++) {
        for (let x = 0; x < LEVEL_WIDTH; x++) {
            if (!isVisible(x, y)) {
                // Not visible - draw darkness
                drawRect(vec2(x + 0.5, y + 0.5), vec2(1, 1), new Color(0, 0, 0));
                continue;
            }

            const tile = levelData[y] ? levelData[y][x] : 1;
            if (tile === 0) {
                drawRect(vec2(x + 0.5, y + 0.5), vec2(1, 1), COLOR_FLOOR);
            } else if (tile === 1) {
                drawRect(vec2(x + 0.5, y + 0.5), vec2(1, 1), COLOR_WALL);
            } else if (tile === 2) {
                // Crate/obstacle
                drawRect(vec2(x + 0.5, y + 0.5), vec2(0.9, 0.9), new Color(0.4, 0.3, 0.2));
            }
        }
    }

    // Draw blood decals
    for (const blood of bloodDecals) {
        if (isVisible(blood.x, blood.y)) {
            drawRect(vec2(blood.x, blood.y), vec2(blood.size, blood.size), new Color(0.4, 0.1, 0.1, blood.alpha * 0.5));
        }
    }

    // Draw doors
    for (const door of doors) {
        if (!isVisible(door.x, door.y)) continue;

        let color = COLOR_DOOR_NORMAL;
        if (door.type === 'green') color = COLOR_DOOR_GREEN;
        if (door.type === 'blue') color = COLOR_DOOR_BLUE;

        if (door.open) {
            // Open door - smaller/transparent
            drawRect(vec2(door.x, door.y), vec2(0.3, 1), color.lerp(new Color(0,0,0), 0.5));
        } else {
            drawRect(vec2(door.x, door.y), vec2(1, 1), color);
            // Door interaction prompt
            if (player) {
                const dist = Math.sqrt((player.pos.x - door.x) ** 2 + (player.pos.y - door.y) ** 2);
                if (dist < 2.5) {
                    // Show prompt (will be drawn in HUD)
                }
            }
        }
    }

    // Draw pickups
    for (const p of pickups) {
        if (!isVisible(p.x, p.y)) continue;

        let color = new Color(1, 1, 1);
        let size = 0.4;

        switch (p.type) {
            case 'health':
                color = COLOR_HEALTH;
                break;
            case 'ammo':
                color = COLOR_AMMO;
                break;
            case 'keycard':
                color = p.keyType === 'green' ? COLOR_KEYCARD_GREEN :
                        p.keyType === 'blue' ? COLOR_KEYCARD_BLUE : COLOR_KEYCARD_YELLOW;
                size = 0.5;
                break;
            case 'weapon':
                color = new Color(0.8, 0.6, 0.2);
                size = 0.6;
                break;
        }

        // Pulsing effect
        const pulse = 1 + Math.sin(Date.now() / 200) * 0.1;
        drawRect(vec2(p.x, p.y), vec2(size * pulse, size * pulse), color);
    }

    // Draw enemies
    for (const enemy of enemies) {
        enemy.render();
    }

    // Draw bullets
    for (const bullet of bullets) {
        bullet.render();
    }
    for (const bullet of enemyBullets) {
        bullet.render();
    }

    // Draw player
    if (player) {
        player.render();
    }

    // Draw floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.life -= 1/60;
        ft.y += ft.vy / 60;

        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
            continue;
        }

        const alpha = Math.min(1, ft.life);
        drawText(ft.text, vec2(ft.x, ft.y), 0.4, ft.color.lerp(new Color(1,1,1,0), 1-alpha));
    }
}

function renderHUD() {
    const screenSize = vec2(mainCanvasSize.x, mainCanvasSize.y);

    // Health bar (top left)
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthPct = playerStats.health / playerStats.maxHealth;

    drawRect(screenToWorld(vec2(110, 30)), vec2(healthBarWidth / cameraScale, healthBarHeight / cameraScale), new Color(0.2, 0.2, 0.2));
    drawRect(screenToWorld(vec2(10 + healthBarWidth * healthPct / 2, 30)), vec2(healthBarWidth * healthPct / cameraScale, healthBarHeight / cameraScale), COLOR_HEALTH);

    // Stamina bar
    const staminaPct = playerStats.stamina / playerStats.maxStamina;
    drawRect(screenToWorld(vec2(110, 55)), vec2(healthBarWidth / cameraScale, 10 / cameraScale), new Color(0.2, 0.2, 0.2));
    drawRect(screenToWorld(vec2(10 + healthBarWidth * staminaPct / 2, 55)), vec2(healthBarWidth * staminaPct / cameraScale, 10 / cameraScale), new Color(0.2, 0.8, 0.2));

    // Weapon and ammo (bottom left)
    drawText(currentWeapon.toUpperCase(), screenToWorld(vec2(100, screenSize.y - 60)), 0.5, new Color(1, 1, 1));
    drawText(`${currentMag}/${WEAPONS[currentWeapon].magSize} | ${ammo[WEAPONS[currentWeapon].ammoType]}`, screenToWorld(vec2(100, screenSize.y - 30)), 0.4, COLOR_AMMO);

    if (isReloading) {
        drawText('RELOADING...', screenToWorld(vec2(screenSize.x / 2, screenSize.y - 100)), 0.5, new Color(1, 0.8, 0.2));
    }

    // Credits (top right)
    drawText(`$${playerStats.credits}`, screenToWorld(vec2(screenSize.x - 80, 30)), 0.5, new Color(1, 1, 0));

    // Keycards (top right below credits)
    let kcY = 60;
    if (playerStats.keycards.green) {
        drawRect(screenToWorld(vec2(screenSize.x - 80, kcY)), vec2(20 / cameraScale, 20 / cameraScale), COLOR_KEYCARD_GREEN);
        kcY += 25;
    }
    if (playerStats.keycards.blue) {
        drawRect(screenToWorld(vec2(screenSize.x - 80, kcY)), vec2(20 / cameraScale, 20 / cameraScale), COLOR_KEYCARD_BLUE);
    }

    // Door interaction prompts
    if (player) {
        for (const door of doors) {
            if (door.open) continue;
            const dist = Math.sqrt((player.pos.x - door.x) ** 2 + (player.pos.y - door.y) ** 2);
            if (dist < 2.5) {
                let prompt = 'E/SPACE to open';
                if (door.type === 'green' && !playerStats.keycards.green) prompt = 'Need GREEN keycard';
                if (door.type === 'blue' && !playerStats.keycards.blue) prompt = 'Need BLUE keycard';
                drawText(prompt, vec2(door.x, door.y + 1.5), 0.35, new Color(1, 1, 1));
            }
        }
    }

    // Pickup prompts
    if (player) {
        for (const p of pickups) {
            const dist = Math.sqrt((player.pos.x - p.x) ** 2 + (player.pos.y - p.y) ** 2);
            if (dist < 1.5 && isVisible(p.x, p.y)) {
                let label = '';
                switch (p.type) {
                    case 'health': label = 'Health'; break;
                    case 'ammo': label = `${p.ammoType} ammo`; break;
                    case 'keycard': label = `${p.keyType} Keycard`; break;
                    case 'weapon': label = p.weaponType; break;
                }
                drawText(`E: ${label}`, vec2(p.x, p.y + 0.8), 0.3, new Color(1, 1, 1));
            }
        }
    }

    // Game over / victory overlay
    if (gameState === 'gameover') {
        drawRect(screenToWorld(vec2(screenSize.x/2, screenSize.y/2)), vec2(screenSize.x/cameraScale, screenSize.y/cameraScale), new Color(0, 0, 0, 0.7));
        drawText('GAME OVER', screenToWorld(vec2(screenSize.x/2, screenSize.y/2 - 50)), 1.5, new Color(1, 0.2, 0.2));
        drawText('Press R to restart', screenToWorld(vec2(screenSize.x/2, screenSize.y/2 + 50)), 0.5, new Color(1, 1, 1));
    }

    if (gameState === 'victory') {
        drawRect(screenToWorld(vec2(screenSize.x/2, screenSize.y/2)), vec2(screenSize.x/cameraScale, screenSize.y/cameraScale), new Color(0, 0, 0, 0.7));
        drawText('ESCAPED!', screenToWorld(vec2(screenSize.x/2, screenSize.y/2 - 50)), 1.5, new Color(0.2, 1, 0.2));
        drawText(`Credits: $${playerStats.credits}`, screenToWorld(vec2(screenSize.x/2, screenSize.y/2 + 20)), 0.5, new Color(1, 1, 0));
        drawText('Press R to play again', screenToWorld(vec2(screenSize.x/2, screenSize.y/2 + 70)), 0.5, new Color(1, 1, 1));
    }

    // Enemy count
    drawText(`Enemies: ${enemies.length}`, screenToWorld(vec2(screenSize.x - 100, screenSize.y - 30)), 0.4, new Color(1, 0.5, 0.5));
}

// ==================== MAIN GAME FUNCTIONS ====================
function gameInit() {
    // Set up LittleJS
    canvasFixedSize = vec2(1280, 720);
    cameraScale = 32;

    generateLevel();
    gameState = 'playing';
}

function gameUpdate() {
    // When using harness, keep gamePaused=true to prevent double updates
    // The harness calls runGameTick() directly for time-accelerated execution
    if (gamePaused) return;

    // Only run if not in harness mode (normal gameplay)
    runGameTick();

    // Restart input (only in normal mode)
    if (keyWasPressed('KeyR') && (gameState === 'gameover' || gameState === 'victory')) {
        restartGame();
    }
}

function gameRender() {
    renderGame();
}

function gameRenderPost() {
    renderHUD();
}

function restartGame() {
    playerStats = {
        health: 200,
        maxHealth: 200,
        stamina: 100,
        maxStamina: 100,
        credits: 0,
        keycards: { green: false, blue: false, yellow: false }
    };
    currentWeapon = 'pistol';
    weaponInventory = ['pistol'];
    ammo = { '9mm': 999, 'shells': 24, 'rifle': 0 };
    currentMag = 12;
    isReloading = false;
    floatingTexts = [];
    bloodDecals = [];

    generateLevel();
    gameState = 'playing';
}

// ==================== HARNESS INTERFACE (V2 TIME-ACCELERATED) ====================
let debugLogs = [];
let gameTime = 0;

function logEvent(msg) {
    debugLogs.push(`[${gameTime}ms] ${msg}`);
}

function runGameTick() {
    // Run one frame of game logic (16ms of game time)
    gameTime += 16;

    // Temporarily unpause so entity updates work
    const wasPaused = gamePaused;
    gamePaused = false;

    // Update vision
    updateVision();

    // Update player
    if (player) {
        player.update();
        cameraPos = player.pos;
    }

    // Update enemies
    for (const enemy of enemies) {
        enemy.update();
    }

    // Update bullets
    for (const bullet of [...bullets]) {
        bullet.update();
    }
    for (const bullet of [...enemyBullets]) {
        bullet.update();
    }

    // Restore pause state
    gamePaused = wasPaused;

    // Check victory condition (blue keycard + reach exit room + exit room clear)
    if (player && playerStats.keycards.blue) {
        if (player.pos.x >= 16 && player.pos.x <= 24 && player.pos.y >= 28 && player.pos.y <= 36) {
            const exitRoomEnemies = enemies.filter(e =>
                e.pos.x >= 16 && e.pos.x <= 24 && e.pos.y >= 28 && e.pos.y <= 36
            );
            if (exitRoomEnemies.length === 0) {
                gameState = 'victory';
                logEvent('VICTORY! Reached exit with blue keycard');
            }
        }
    }
}

(function() {
    window.harness = {
        pause: () => {
            gamePaused = true;
            simulatedKeys.clear();
        },

        resume: () => {
            gamePaused = false;
        },

        isPaused: () => gamePaused,

        // V2 TIME-ACCELERATED EXECUTE
        execute: async ({ keys = [], duration = 500, screenshot = false }) => {
            const startReal = performance.now();
            debugLogs = [];

            // Apply inputs - normalize key names
            for (const key of keys) {
                simulatedKeys.add(key);
                simulatedKeys.add(key.toLowerCase());
            }

            // Calculate number of ticks (16ms per tick for ~60fps)
            const dt = 16;
            const numTicks = Math.ceil(duration / dt);

            // Run physics ticks synchronously (TIME-ACCELERATED)
            for (let i = 0; i < numTicks; i++) {
                // Check if game ended
                if (gameState === 'gameover' || gameState === 'victory') {
                    break;
                }
                // Run one game tick
                runGameTick();
            }

            // Clear inputs
            simulatedKeys.clear();

            // Get screenshot if requested
            let screenshotData = null;
            if (screenshot && typeof mainCanvas !== 'undefined') {
                screenshotData = mainCanvas.toDataURL('image/png');
            }

            return {
                screenshot: screenshotData,
                logs: [...debugLogs],
                state: window.harness.getState(),
                realTime: performance.now() - startReal,
                gameTime: gameTime
            };
        },

        getState: () => {
            return {
                gameState: gameState,
                player: player ? {
                    x: player.pos.x,
                    y: player.pos.y,
                    health: playerStats.health,
                    maxHealth: playerStats.maxHealth,
                    stamina: playerStats.stamina,
                    weapon: currentWeapon,
                    ammo: currentMag,
                    totalAmmo: ammo[WEAPONS[currentWeapon].ammoType]
                } : null,
                enemies: enemies.map(e => ({
                    x: e.pos.x,
                    y: e.pos.y,
                    type: e.type,
                    health: e.health,
                    alerted: e.alerted
                })),
                pickups: pickups.map(p => ({
                    x: p.x,
                    y: p.y,
                    type: p.type
                })),
                keycards: playerStats.keycards,
                credits: playerStats.credits,
                doorsOpen: doors.filter(d => d.open).length,
                totalDoors: doors.length
            };
        },

        getPhase: () => {
            return gameState;
        },

        debug: {
            setHealth: (hp) => {
                if (playerStats) playerStats.health = hp;
            },
            setPosition: (x, y) => {
                if (player) {
                    player.pos.x = x;
                    player.pos.y = y;
                }
            },
            setGodMode: (enabled) => {
                if (player) player.invincibleTimer = enabled ? 99999 : 0;
            },
            clearEnemies: () => {
                enemies.length = 0;
            },
            giveKeycard: (type) => {
                playerStats.keycards[type] = true;
            },
            forceStart: () => {
                // Always restart to ensure fresh state
                restartGame();
                gameTime = 0;
                debugLogs = [];
                // Keep paused - harness calls runGameTick directly
                gamePaused = true;
            },
            forceGameOver: () => {
                gameState = 'gameover';
            },
            forceVictory: () => {
                gameState = 'victory';
            },
            forceShoot: () => {
                if (player) player.shoot();
            },
            getDebugInfo: () => {
                return {
                    gamePaused,
                    shootCooldown,
                    isReloading,
                    currentMag,
                    simulatedKeysSize: simulatedKeys.size,
                    simulatedKeysList: Array.from(simulatedKeys),
                    playerExists: !!player
                };
            },
            log: (msg) => {
                console.log('[HARNESS]', msg);
            }
        },

        version: '2.0',  // Time-accelerated harness

        gameInfo: {
            name: 'Station Breach',
            type: 'twin_stick_shooter',
            controls: {
                movement: ['w', 'a', 's', 'd'],
                fire: ['mouse0', 'Space'],
                actions: { reload: 'r', interact: 'e', sprint: 'Shift', weapon: 'q', melee: 'f' }
            }
        }
    };

    console.log('[HARNESS] Test harness initialized, game paused');
})();

// ==================== START ENGINE ====================
engineInit(gameInit, gameUpdate, () => {}, gameRender, gameRenderPost);
