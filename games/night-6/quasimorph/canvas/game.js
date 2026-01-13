// Quasimorph Clone - Turn-Based Tactical Extraction
// Canvas Implementation with Test Harness

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════
const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 18;
const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 600;
const VISION_RANGE = 8;

const TileType = {
    FLOOR: 0,
    WALL: 1,
    COVER_HALF: 2,
    COVER_FULL: 3,
    DOOR_CLOSED: 4,
    DOOR_OPEN: 5,
    EXTRACTION: 6,
    VENT: 7
};

const CoverType = { NONE: 0, HALF: 1, FULL: 2 };

const Stance = {
    SNEAK: { name: 'Sneak', ap: 1, detection: 0.5 },
    WALK: { name: 'Walk', ap: 2, detection: 1.0 },
    RUN: { name: 'Run', ap: 3, detection: 1.5 }
};

const WEAPONS = {
    combat_rifle: { name: 'Combat Rifle', damage: [30, 40], accuracy: 70, range: 10, apCost: 2, magSize: 20, ammoType: '7.62mm' },
    pistol: { name: 'Pistol', damage: [15, 20], accuracy: 75, range: 6, apCost: 1, magSize: 12, ammoType: '9mm' },
    smg: { name: 'SMG', damage: [10, 15], accuracy: 60, range: 5, apCost: 1, magSize: 30, ammoType: '9mm', burst: 3 },
    shotgun: { name: 'Shotgun', damage: [25, 40], accuracy: 80, range: 3, apCost: 2, magSize: 6, ammoType: '12g' }
};

const ENEMY_TYPES = {
    guard: { hp: 50, ap: 2, damage: [10, 15], accuracy: 60, range: 6, speed: 1, behavior: 'patrol', color: '#48a' },
    soldier: { hp: 75, ap: 2, damage: [15, 20], accuracy: 70, range: 7, speed: 1, behavior: 'aggressive', color: '#484' },
    possessed: { hp: 80, ap: 3, damage: [20, 30], accuracy: 80, range: 1, speed: 2, behavior: 'berserk', color: '#a48', melee: true },
    stalker: { hp: 60, ap: 4, damage: [15, 25], accuracy: 85, range: 1, speed: 2, behavior: 'ambush', color: '#448', melee: true },
    bloater: { hp: 150, ap: 1, damage: [30, 50], accuracy: 100, range: 2, speed: 1, behavior: 'slow', color: '#884', explodes: true }
};

// ═══════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════
let gameState = 'menu';
let gamePaused = true;
let currentPhase = 'player'; // player, enemy, animation

let map = [];
let visibilityMap = [];
let exploredMap = [];
let player = null;
let enemies = [];
let items = [];
let projectiles = [];
let particles = [];
let floatingTexts = [];

let turnNumber = 1;
let corruption = 0;
let corruptionRate = 1;

let cameraX = 0;
let cameraY = 0;

let selectedTile = null;
let hoveredTile = null;
let pathPreview = [];

let stats = {
    enemiesKilled: 0,
    damageDealt: 0,
    damageTaken: 0,
    turnsTaken: 0,
    itemsUsed: 0
};

// Input
let mouseX = 0, mouseY = 0;
let activeHarnessKeys = new Set();
let keys = {};

// ═══════════════════════════════════════════════════════════
// PLAYER CLASS
// ═══════════════════════════════════════════════════════════
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hp = 100;
        this.maxHp = 100;
        this.ap = 2;
        this.maxAp = 2;
        this.stance = Stance.WALK;

        this.weapon = { ...WEAPONS.combat_rifle, ammo: 20 };
        this.secondaryWeapon = { ...WEAPONS.pistol, ammo: 12 };

        this.inventory = [];
        this.wounds = { head: 0, torso: 0, leftArm: 0, rightArm: 0, leftLeg: 0, rightLeg: 0 };
    }

    startTurn() {
        this.ap = this.stance.ap;

        // Wound penalties
        if (this.wounds.torso > 0) this.ap = Math.max(1, this.ap - 1);
        if (this.wounds.leftLeg > 0 || this.wounds.rightLeg > 0) this.ap = Math.max(1, this.ap - 1);

        this.maxAp = this.ap;
    }

    canMove() {
        return this.ap >= 1;
    }

    canShoot() {
        return this.ap >= this.weapon.apCost && this.weapon.ammo > 0;
    }

    canReload() {
        return this.ap >= 1 && this.weapon.ammo < this.weapon.magSize;
    }

    move(tx, ty) {
        if (!this.canMove()) {
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'No AP!', '#f44');
            return false;
        }

        const dist = Math.abs(tx - this.x) + Math.abs(ty - this.y);
        if (dist > this.ap) {
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'Too far!', '#f44');
            return false;
        }

        // Check walkable path
        if (!isWalkable(tx, ty)) return false;

        this.x = tx;
        this.y = ty;
        this.ap -= dist;

        // Sound alert
        if (this.stance === Stance.RUN) {
            alertEnemiesInRange(this.x, this.y, 5);
        }

        updateVisibility();
        checkAutoEndTurn();
        return true;
    }

    shoot(target) {
        if (!this.canShoot()) {
            if (this.weapon.ammo <= 0) {
                showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'No ammo!', '#f44');
            } else {
                showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'No AP!', '#f44');
            }
            return false;
        }

        const dist = Math.abs(target.x - this.x) + Math.abs(target.y - this.y);
        if (dist > this.weapon.range) {
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'Out of range!', '#fa0');
            return false;
        }

        if (!hasLineOfSight(this.x, this.y, target.x, target.y)) {
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'No LoS!', '#fa0');
            return false;
        }

        this.ap -= this.weapon.apCost;
        this.weapon.ammo--;

        // Calculate hit chance
        let hitChance = this.weapon.accuracy;
        if (dist > Math.floor(this.weapon.range / 2)) {
            hitChance -= (dist - Math.floor(this.weapon.range / 2)) * 5;
        }

        // Cover penalty
        const coverType = getCoverBetween(this.x, this.y, target.x, target.y);
        if (coverType === CoverType.HALF) hitChance -= 15;
        if (coverType === CoverType.FULL) hitChance -= 30;

        // Wound penalty
        hitChance -= (this.wounds.leftArm + this.wounds.rightArm) * 10;

        hitChance = Math.max(5, Math.min(95, hitChance));

        // Shooting effect
        createProjectile(this.x, this.y, target.x, target.y);

        // Roll to hit
        const roll = Math.random() * 100;
        if (roll < hitChance) {
            const damage = this.weapon.damage[0] + Math.floor(Math.random() * (this.weapon.damage[1] - this.weapon.damage[0] + 1));

            // Apply cover damage reduction
            let finalDamage = damage;
            if (coverType === CoverType.HALF) finalDamage = Math.floor(damage * 0.75);
            if (coverType === CoverType.FULL) finalDamage = Math.floor(damage * 0.5);

            target.takeDamage(finalDamage);
            showFloatingText(target.x * TILE_SIZE, target.y * TILE_SIZE, `-${finalDamage}`, '#f44');
            stats.damageDealt += finalDamage;
            corruption += 5;
        } else {
            showFloatingText(target.x * TILE_SIZE, target.y * TILE_SIZE, 'MISS', '#888');
        }

        corruption += 2;
        alertEnemiesInRange(this.x, this.y, 8);
        checkAutoEndTurn();
        return true;
    }

    reload() {
        if (!this.canReload()) {
            showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'Cannot reload!', '#f44');
            return false;
        }

        this.weapon.ammo = this.weapon.magSize;
        this.ap -= 1;
        showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE, 'Reloaded', '#4f4');
        checkAutoEndTurn();
        return true;
    }

    takeDamage(amount) {
        this.hp -= amount;
        stats.damageTaken += amount;
        spawnParticles(this.x * TILE_SIZE + TILE_SIZE / 2, this.y * TILE_SIZE + TILE_SIZE / 2, '#f44', 10);
        corruption += 3;

        if (this.hp <= 0) {
            gameOver('Your clone has been terminated.');
        }
    }

    draw() {
        const screenX = this.x * TILE_SIZE - cameraX;
        const screenY = this.y * TILE_SIZE - cameraY;

        // Body
        ctx.fillStyle = '#4af';
        ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);

        // Direction indicator
        ctx.fillStyle = '#fff';
        ctx.fillRect(screenX + TILE_SIZE / 2 - 2, screenY + 2, 4, 8);

        // HP bar above
        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = '#400';
        ctx.fillRect(screenX + 2, screenY - 6, TILE_SIZE - 4, 4);
        ctx.fillStyle = hpPercent > 0.3 ? '#4f4' : '#f44';
        ctx.fillRect(screenX + 2, screenY - 6, (TILE_SIZE - 4) * hpPercent, 4);
    }
}

// ═══════════════════════════════════════════════════════════
// ENEMY CLASS
// ═══════════════════════════════════════════════════════════
class Enemy {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        const stats = ENEMY_TYPES[type];
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.ap = stats.ap;
        this.maxAp = stats.ap;
        this.damage = stats.damage;
        this.accuracy = stats.accuracy;
        this.range = stats.range;
        this.speed = stats.speed;
        this.behavior = stats.behavior;
        this.color = stats.color;
        this.melee = stats.melee || false;
        this.explodes = stats.explodes || false;

        this.alerted = false;
        this.lastKnownPlayerX = -1;
        this.lastKnownPlayerY = -1;
        this.patrolTarget = { x, y };
        this.state = 'idle';
    }

    takeTurn() {
        if (!player) return;

        this.ap = this.maxAp;

        const canSeePlayer = this.canSeePlayer();
        if (canSeePlayer) {
            this.alerted = true;
            this.lastKnownPlayerX = player.x;
            this.lastKnownPlayerY = player.y;
        }

        if (this.alerted) {
            this.huntPlayer();
        } else {
            this.patrol();
        }
    }

    canSeePlayer() {
        if (!player) return false;
        const dist = Math.abs(player.x - this.x) + Math.abs(player.y - this.y);
        if (dist > VISION_RANGE) return false;
        return hasLineOfSight(this.x, this.y, player.x, player.y);
    }

    huntPlayer() {
        const distToPlayer = Math.abs(player.x - this.x) + Math.abs(player.y - this.y);

        // In range? Attack!
        if (distToPlayer <= this.range && this.ap > 0) {
            if (hasLineOfSight(this.x, this.y, player.x, player.y)) {
                this.attack();
                return;
            }
        }

        // Move toward player
        while (this.ap > 0 && distToPlayer > 1) {
            const moved = this.moveToward(player.x, player.y);
            if (!moved) break;

            const newDist = Math.abs(player.x - this.x) + Math.abs(player.y - this.y);
            if (newDist <= this.range && this.canSeePlayer()) {
                this.attack();
                return;
            }
        }
    }

    patrol() {
        if (this.ap <= 0) return;

        // Pick new patrol target occasionally
        if (Math.random() < 0.3) {
            this.patrolTarget = {
                x: this.x + Math.floor(Math.random() * 5) - 2,
                y: this.y + Math.floor(Math.random() * 5) - 2
            };
        }

        this.moveToward(this.patrolTarget.x, this.patrolTarget.y);
    }

    moveToward(tx, ty) {
        if (this.ap <= 0) return false;

        const dx = Math.sign(tx - this.x);
        const dy = Math.sign(ty - this.y);

        // Try horizontal first, then vertical
        let moved = false;
        if (dx !== 0 && isWalkable(this.x + dx, this.y)) {
            this.x += dx;
            moved = true;
        } else if (dy !== 0 && isWalkable(this.x, this.y + dy)) {
            this.y += dy;
            moved = true;
        }

        if (moved) this.ap--;
        return moved;
    }

    attack() {
        if (this.ap <= 0 || !player) return;

        this.ap--;

        // Show attack animation
        showFloatingText(this.x * TILE_SIZE, this.y * TILE_SIZE - 10, '!', '#f00');

        // Calculate hit
        let hitChance = this.accuracy;
        const dist = Math.abs(player.x - this.x) + Math.abs(player.y - this.y);

        // Cover
        const coverType = getCoverBetween(this.x, this.y, player.x, player.y);
        if (coverType === CoverType.HALF) hitChance -= 15;
        if (coverType === CoverType.FULL) hitChance -= 30;

        hitChance = Math.max(5, Math.min(95, hitChance));

        if (!this.melee) {
            createProjectile(this.x, this.y, player.x, player.y, '#f44');
        }

        const roll = Math.random() * 100;
        if (roll < hitChance) {
            let damage = this.damage[0] + Math.floor(Math.random() * (this.damage[1] - this.damage[0] + 1));

            if (coverType === CoverType.HALF) damage = Math.floor(damage * 0.75);
            if (coverType === CoverType.FULL) damage = Math.floor(damage * 0.5);

            player.takeDamage(damage);
            showFloatingText(player.x * TILE_SIZE, player.y * TILE_SIZE, `-${damage}`, '#f44');
        } else {
            showFloatingText(player.x * TILE_SIZE, player.y * TILE_SIZE, 'MISS', '#888');
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.alerted = true;
        spawnParticles(this.x * TILE_SIZE + TILE_SIZE / 2, this.y * TILE_SIZE + TILE_SIZE / 2, this.color, 8);

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        const idx = enemies.indexOf(this);
        if (idx >= 0) enemies.splice(idx, 1);
        stats.enemiesKilled++;
        spawnParticles(this.x * TILE_SIZE + TILE_SIZE / 2, this.y * TILE_SIZE + TILE_SIZE / 2, this.color, 15);

        // Bloater explosion
        if (this.explodes) {
            const explosionRange = 2;
            for (let dx = -explosionRange; dx <= explosionRange; dx++) {
                for (let dy = -explosionRange; dy <= explosionRange; dy++) {
                    if (Math.abs(dx) + Math.abs(dy) <= explosionRange) {
                        spawnParticles((this.x + dx) * TILE_SIZE + TILE_SIZE / 2, (this.y + dy) * TILE_SIZE + TILE_SIZE / 2, '#fa0', 5);
                    }
                }
            }
            if (player && Math.abs(player.x - this.x) + Math.abs(player.y - this.y) <= explosionRange) {
                player.takeDamage(40);
                showFloatingText(player.x * TILE_SIZE, player.y * TILE_SIZE, 'EXPLOSION -40', '#fa0');
            }
        }

        // Drop item chance
        if (Math.random() < 0.3) {
            items.push({
                x: this.x,
                y: this.y,
                type: Math.random() < 0.5 ? 'medkit' : 'ammo',
                color: Math.random() < 0.5 ? '#f44' : '#4f4'
            });
        }
    }

    draw() {
        if (!isVisible(this.x, this.y)) return;

        const screenX = this.x * TILE_SIZE - cameraX;
        const screenY = this.y * TILE_SIZE - cameraY;

        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, TILE_SIZE / 2 - 4, 0, Math.PI * 2);
        ctx.fill();

        // Alert indicator
        if (this.alerted) {
            ctx.fillStyle = '#f00';
            ctx.font = 'bold 12px monospace';
            ctx.fillText('!', screenX + TILE_SIZE / 2 - 3, screenY - 2);
        }

        // HP bar
        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = '#400';
        ctx.fillRect(screenX + 2, screenY - 6, TILE_SIZE - 4, 3);
        ctx.fillStyle = '#f44';
        ctx.fillRect(screenX + 2, screenY - 6, (TILE_SIZE - 4) * hpPercent, 3);
    }
}

// ═══════════════════════════════════════════════════════════
// MAP GENERATION
// ═══════════════════════════════════════════════════════════
function generateMap() {
    map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                map[y][x] = TileType.WALL;
            } else {
                map[y][x] = TileType.FLOOR;
            }
        }
    }

    // Generate rooms
    const rooms = [];
    for (let i = 0; i < 6; i++) {
        const roomW = 4 + Math.floor(Math.random() * 4);
        const roomH = 3 + Math.floor(Math.random() * 3);
        const roomX = 2 + Math.floor(Math.random() * (MAP_WIDTH - roomW - 4));
        const roomY = 2 + Math.floor(Math.random() * (MAP_HEIGHT - roomH - 4));

        // Clear room
        for (let ry = roomY; ry < roomY + roomH; ry++) {
            for (let rx = roomX; rx < roomX + roomW; rx++) {
                map[ry][rx] = TileType.FLOOR;
            }
        }

        // Add walls around
        for (let ry = roomY - 1; ry <= roomY + roomH; ry++) {
            if (ry >= 0 && ry < MAP_HEIGHT) {
                if (roomX - 1 >= 0) map[ry][roomX - 1] = TileType.WALL;
                if (roomX + roomW < MAP_WIDTH) map[ry][roomX + roomW] = TileType.WALL;
            }
        }
        for (let rx = roomX - 1; rx <= roomX + roomW; rx++) {
            if (rx >= 0 && rx < MAP_WIDTH) {
                if (roomY - 1 >= 0) map[roomY - 1][rx] = TileType.WALL;
                if (roomY + roomH < MAP_HEIGHT) map[roomY + roomH][rx] = TileType.WALL;
            }
        }

        rooms.push({ x: roomX, y: roomY, w: roomW, h: roomH });
    }

    // Connect rooms with corridors
    for (let i = 0; i < rooms.length - 1; i++) {
        const r1 = rooms[i];
        const r2 = rooms[i + 1];
        const x1 = r1.x + Math.floor(r1.w / 2);
        const y1 = r1.y + Math.floor(r1.h / 2);
        const x2 = r2.x + Math.floor(r2.w / 2);
        const y2 = r2.y + Math.floor(r2.h / 2);

        // Horizontal then vertical
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            if (map[y1][x] === TileType.WALL) map[y1][x] = TileType.DOOR_CLOSED;
            else if (map[y1][x] !== TileType.DOOR_CLOSED) map[y1][x] = TileType.FLOOR;
        }
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            if (map[y][x2] === TileType.WALL) map[y][x2] = TileType.DOOR_CLOSED;
            else if (map[y][x2] !== TileType.DOOR_CLOSED) map[y][x2] = TileType.FLOOR;
        }
    }

    // Add cover objects
    for (let i = 0; i < 15; i++) {
        const x = 2 + Math.floor(Math.random() * (MAP_WIDTH - 4));
        const y = 2 + Math.floor(Math.random() * (MAP_HEIGHT - 4));
        if (map[y][x] === TileType.FLOOR) {
            map[y][x] = Math.random() < 0.5 ? TileType.COVER_HALF : TileType.COVER_FULL;
        }
    }

    // Add extraction point
    const lastRoom = rooms[rooms.length - 1];
    map[lastRoom.y + 1][lastRoom.x + 1] = TileType.EXTRACTION;

    // Initialize visibility
    visibilityMap = [];
    exploredMap = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        visibilityMap[y] = [];
        exploredMap[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            visibilityMap[y][x] = false;
            exploredMap[y][x] = false;
        }
    }

    return rooms[0]; // Return starting room
}

// ═══════════════════════════════════════════════════════════
// VISIBILITY SYSTEM
// ═══════════════════════════════════════════════════════════
function updateVisibility() {
    // Clear current visibility
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            visibilityMap[y][x] = false;
        }
    }

    if (!player) return;

    // Cast rays in all directions
    for (let angle = 0; angle < 360; angle += 2) {
        const rad = angle * Math.PI / 180;
        const dx = Math.cos(rad);
        const dy = Math.sin(rad);

        for (let dist = 0; dist <= VISION_RANGE; dist += 0.5) {
            const tx = Math.floor(player.x + dx * dist);
            const ty = Math.floor(player.y + dy * dist);

            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) break;

            visibilityMap[ty][tx] = true;
            exploredMap[ty][tx] = true;

            // Stop at walls
            if (map[ty][tx] === TileType.WALL || map[ty][tx] === TileType.COVER_FULL) {
                break;
            }
        }
    }
}

function isVisible(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    return visibilityMap[y][x];
}

function isExplored(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    return exploredMap[y][x];
}

function hasLineOfSight(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.max(Math.abs(dx), Math.abs(dy));

    for (let i = 0; i <= dist; i++) {
        const t = dist === 0 ? 0 : i / dist;
        const x = Math.round(x1 + dx * t);
        const y = Math.round(y1 + dy * t);

        if (x === x2 && y === y2) return true;

        if (map[y][x] === TileType.WALL || map[y][x] === TileType.COVER_FULL) {
            return false;
        }
    }
    return true;
}

function getCoverBetween(x1, y1, x2, y2) {
    // Check tiles adjacent to target for cover
    const dx = Math.sign(x1 - x2);
    const dy = Math.sign(y1 - y2);

    const checkX = x2 + dx;
    const checkY = y2 + dy;

    if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT) {
        const tile = map[checkY][checkX];
        if (tile === TileType.COVER_FULL || tile === TileType.WALL) return CoverType.FULL;
        if (tile === TileType.COVER_HALF) return CoverType.HALF;
    }

    return CoverType.NONE;
}

function isWalkable(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    const tile = map[y][x];
    return tile === TileType.FLOOR || tile === TileType.DOOR_OPEN ||
           tile === TileType.EXTRACTION || tile === TileType.VENT;
}

function alertEnemiesInRange(x, y, range) {
    for (const enemy of enemies) {
        const dist = Math.abs(enemy.x - x) + Math.abs(enemy.y - y);
        if (dist <= range) {
            enemy.alerted = true;
            enemy.lastKnownPlayerX = x;
            enemy.lastKnownPlayerY = y;
        }
    }
}

// ═══════════════════════════════════════════════════════════
// EFFECTS
// ═══════════════════════════════════════════════════════════
function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            color,
            life: 0.5 + Math.random() * 0.3
        });
    }
}

function createProjectile(x1, y1, x2, y2, color = '#ff0') {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);

    projectiles.push({
        x: x1 * TILE_SIZE + TILE_SIZE / 2,
        y: y1 * TILE_SIZE + TILE_SIZE / 2,
        vx: (dx / len) * 500,
        vy: (dy / len) * 500,
        targetX: x2 * TILE_SIZE + TILE_SIZE / 2,
        targetY: y2 * TILE_SIZE + TILE_SIZE / 2,
        color,
        life: 0.5
    });
}

function showFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x + TILE_SIZE / 2,
        y: y,
        text,
        color,
        life: 1.5,
        vy: -30
    });
}

// ═══════════════════════════════════════════════════════════
// TURN SYSTEM
// ═══════════════════════════════════════════════════════════
function endTurn() {
    if (currentPhase !== 'player') return;

    currentPhase = 'enemy';
    document.getElementById('turnIndicator').style.display = 'block';
    document.getElementById('turnIndicator').textContent = 'ENEMY TURN';

    // Process enemy turns with delay for visibility
    let enemyIndex = 0;
    const processNextEnemy = () => {
        if (enemyIndex < enemies.length && gameState === 'playing') {
            enemies[enemyIndex].takeTurn();
            enemyIndex++;
            setTimeout(processNextEnemy, 300);
        } else {
            finishEnemyTurn();
        }
    };

    setTimeout(processNextEnemy, 500);
}

function finishEnemyTurn() {
    document.getElementById('turnIndicator').style.display = 'none';

    // Corruption increases
    corruption += corruptionRate;
    checkCorruptionThresholds();

    // Start new player turn
    turnNumber++;
    stats.turnsTaken++;
    currentPhase = 'player';

    if (player) player.startTurn();

    updateUI();
}

function checkAutoEndTurn() {
    if (player && player.ap <= 0) {
        setTimeout(endTurn, 300);
    }
}

function checkCorruptionThresholds() {
    // Spawn enemies at certain thresholds
    if (corruption >= 200 && corruption < 210 && enemies.length < 10) {
        spawnCorruptedEnemy('possessed');
    }
    if (corruption >= 400 && corruption < 410 && enemies.length < 12) {
        spawnCorruptedEnemy('stalker');
    }
    if (corruption >= 600 && corruption < 610 && enemies.length < 15) {
        spawnCorruptedEnemy('bloater');
    }

    // Update visual effects
    if (corruption >= 800) {
        document.body.style.filter = `hue-rotate(${(corruption - 800) / 5}deg) saturate(1.5)`;
    }
}

function spawnCorruptedEnemy(type) {
    // Find spawn point away from player
    for (let attempts = 0; attempts < 50; attempts++) {
        const x = 2 + Math.floor(Math.random() * (MAP_WIDTH - 4));
        const y = 2 + Math.floor(Math.random() * (MAP_HEIGHT - 4));

        if (isWalkable(x, y) && (!player || Math.abs(x - player.x) + Math.abs(y - player.y) > 5)) {
            enemies.push(new Enemy(type, x, y));
            showFloatingText(x * TILE_SIZE, y * TILE_SIZE, 'SPAWNED', '#f0f');
            return;
        }
    }
}

// ═══════════════════════════════════════════════════════════
// GAME SETUP
// ═══════════════════════════════════════════════════════════
function startGame() {
    gameState = 'playing';
        // gamePaused stays as set by URL param
    currentPhase = 'player';

    document.getElementById('menuScreen').classList.add('hidden');
    document.getElementById('gameoverScreen').classList.add('hidden');
    document.getElementById('victoryScreen').classList.add('hidden');
    document.body.style.filter = '';

    // Reset stats
    stats = { enemiesKilled: 0, damageDealt: 0, damageTaken: 0, turnsTaken: 0, itemsUsed: 0 };

    // Generate map
    const startRoom = generateMap();

    // Create player
    player = new Player(startRoom.x + 1, startRoom.y + 1);
    player.startTurn();

    // Spawn enemies
    enemies = [];
    const enemyTypes = ['guard', 'guard', 'guard', 'soldier', 'soldier'];
    for (const type of enemyTypes) {
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = 2 + Math.floor(Math.random() * (MAP_WIDTH - 4));
            const y = 2 + Math.floor(Math.random() * (MAP_HEIGHT - 4));

            if (isWalkable(x, y) && Math.abs(x - player.x) + Math.abs(y - player.y) > 5) {
                enemies.push(new Enemy(type, x, y));
                break;
            }
        }
    }

    items = [];
    projectiles = [];
    particles = [];
    floatingTexts = [];

    turnNumber = 1;
    corruption = 0;

    // Center camera on player
    updateCamera();
    updateVisibility();
    updateUI();
}

function gameOver(reason) {
    gameState = 'gameover';
    document.getElementById('deathReason').textContent = reason;
    document.getElementById('deathStats').innerHTML = `
        Turns: ${stats.turnsTaken}<br>
        Kills: ${stats.enemiesKilled}<br>
        Damage Dealt: ${stats.damageDealt}
    `;
    document.getElementById('gameoverScreen').classList.remove('hidden');
}

function victory() {
    gameState = 'victory';
    document.getElementById('victoryStats').innerHTML = `
        Turns: ${stats.turnsTaken}<br>
        Kills: ${stats.enemiesKilled}<br>
        Damage Dealt: ${stats.damageDealt}<br>
        Corruption: ${corruption}
    `;
    document.getElementById('victoryScreen').classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════════
// UI
// ═══════════════════════════════════════════════════════════
function updateUI() {
    if (!player) return;

    document.getElementById('hpBar').style.width = (player.hp / player.maxHp * 100) + '%';
    document.getElementById('hpText').textContent = player.hp;

    document.getElementById('apBar').style.width = (player.ap / player.maxAp * 100) + '%';
    document.getElementById('apText').textContent = `${player.ap}/${player.maxAp}`;

    document.getElementById('turnNum').textContent = turnNumber;

    document.getElementById('corruptionBar').style.width = (corruption / 1000 * 100) + '%';
    document.getElementById('corruptionText').textContent = corruption;

    document.getElementById('stanceDisplay').textContent = `STANCE: ${player.stance.name} (${player.stance.ap} AP)`;
    document.getElementById('weaponDisplay').textContent = `[1] ${player.weapon.name}: ${player.weapon.ammo}/${player.weapon.magSize}`;

    document.getElementById('currentStance').textContent = player.stance.name.toUpperCase();
    document.getElementById('stanceAP').textContent = `${player.stance.ap} AP/turn`;

    document.getElementById('ammoCount').textContent = `${player.weapon.ammo}/${player.weapon.magSize}`;
}

function updateCamera() {
    if (!player) return;

    cameraX = player.x * TILE_SIZE - VIEW_WIDTH / 2 + TILE_SIZE / 2;
    cameraY = player.y * TILE_SIZE - VIEW_HEIGHT / 2 + TILE_SIZE / 2;

    cameraX = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - VIEW_WIDTH, cameraX));
    cameraY = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - VIEW_HEIGHT, cameraY));
}

// ═══════════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════════
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    const tileX = Math.floor((mouseX + cameraX) / TILE_SIZE);
    const tileY = Math.floor((mouseY + cameraY) / TILE_SIZE);
    hoveredTile = { x: tileX, y: tileY };
});

canvas.addEventListener('click', (e) => {
    handleClick();
});

function handleClick() {
    if (gameState !== 'playing' || currentPhase !== 'player' || !player) return;

    if (!hoveredTile) return;

    const tx = hoveredTile.x;
    const ty = hoveredTile.y;

    // Check if clicking on enemy
    const targetEnemy = enemies.find(e => e.x === tx && e.y === ty && isVisible(e.x, e.y));
    if (targetEnemy) {
        player.shoot(targetEnemy);
        updateUI();
        return;
    }

    // Check extraction
    if (map[ty] && map[ty][tx] === TileType.EXTRACTION) {
        if (player.x === tx && player.y === ty) {
            victory();
            return;
        }
    }

    // Open doors
    if (map[ty] && map[ty][tx] === TileType.DOOR_CLOSED) {
        map[ty][tx] = TileType.DOOR_OPEN;
        updateVisibility();
        return;
    }

    // Move
    if (isWalkable(tx, ty)) {
        player.move(tx, ty);
        updateCamera();
        updateUI();

        // Check victory
        if (map[ty][tx] === TileType.EXTRACTION) {
            victory();
        }
    }
}

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (gameState === 'playing' && currentPhase === 'player') {
        if (e.key === 'Enter') endTurn();
        if (e.key.toLowerCase() === 'r') reloadWeapon();
        if (e.key === 'Tab') { cycleStance(); e.preventDefault(); }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

function reloadWeapon() {
    if (player) {
        player.reload();
        updateUI();
    }
}

function cycleStance() {
    if (!player) return;

    if (player.stance === Stance.SNEAK) player.stance = Stance.WALK;
    else if (player.stance === Stance.WALK) player.stance = Stance.RUN;
    else player.stance = Stance.SNEAK;

    updateUI();
}

// ═══════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════
function render() {
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    if (gameState !== 'playing') return;

    // Draw map
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const screenX = x * TILE_SIZE - cameraX;
            const screenY = y * TILE_SIZE - cameraY;

            if (screenX < -TILE_SIZE || screenX > VIEW_WIDTH || screenY < -TILE_SIZE || screenY > VIEW_HEIGHT) continue;

            const visible = isVisible(x, y);
            const explored = isExplored(x, y);

            if (!explored) {
                ctx.fillStyle = '#0a0a15';
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                continue;
            }

            const tile = map[y][x];
            let color = '#1a1a2a';

            switch (tile) {
                case TileType.FLOOR: color = '#1a1a2a'; break;
                case TileType.WALL: color = '#2a2a3a'; break;
                case TileType.COVER_HALF: color = '#3a3a4a'; break;
                case TileType.COVER_FULL: color = '#2a2a3a'; break;
                case TileType.DOOR_CLOSED: color = '#4a3a2a'; break;
                case TileType.DOOR_OPEN: color = '#2a2a1a'; break;
                case TileType.EXTRACTION: color = '#1a4a1a'; break;
            }

            if (!visible) {
                // Darken explored but not visible
                const r = parseInt(color.slice(1, 3), 16) * 0.4;
                const g = parseInt(color.slice(3, 5), 16) * 0.4;
                const b = parseInt(color.slice(5, 7), 16) * 0.4;
                color = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
            }

            ctx.fillStyle = color;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Tile details
            if (visible) {
                ctx.strokeStyle = '#111';
                ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                // Cover indicator
                if (tile === TileType.COVER_HALF) {
                    ctx.fillStyle = '#555';
                    ctx.fillRect(screenX + 4, screenY + TILE_SIZE - 12, TILE_SIZE - 8, 8);
                }
                if (tile === TileType.COVER_FULL) {
                    ctx.fillStyle = '#444';
                    ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }

                // Extraction marker
                if (tile === TileType.EXTRACTION) {
                    ctx.fillStyle = '#4f4';
                    ctx.font = 'bold 10px monospace';
                    ctx.fillText('EXIT', screenX + 2, screenY + TILE_SIZE / 2 + 3);
                }
            }
        }
    }

    // Draw items
    for (const item of items) {
        if (!isVisible(item.x, item.y)) continue;
        const screenX = item.x * TILE_SIZE - cameraX;
        const screenY = item.y * TILE_SIZE - cameraY;
        ctx.fillStyle = item.color;
        ctx.fillRect(screenX + 10, screenY + 10, 12, 12);
    }

    // Draw enemies
    for (const enemy of enemies) {
        enemy.draw();
    }

    // Draw player
    if (player) player.draw();

    // Draw projectiles
    for (const p of projectiles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - cameraX, p.y - cameraY, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x - cameraX - 2, p.y - cameraY - 2, 4, 4);
    }
    ctx.globalAlpha = 1;

    // Draw floating texts
    ctx.font = 'bold 14px monospace';
    for (const ft of floatingTexts) {
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.min(1, ft.life);
        ctx.fillText(ft.text, ft.x - cameraX - ctx.measureText(ft.text).width / 2, ft.y - cameraY);
    }
    ctx.globalAlpha = 1;

    // Hover highlight
    if (hoveredTile && currentPhase === 'player') {
        const screenX = hoveredTile.x * TILE_SIZE - cameraX;
        const screenY = hoveredTile.y * TILE_SIZE - cameraY;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        ctx.lineWidth = 1;
    }

    // AP indicator on valid move tiles
    if (player && currentPhase === 'player' && hoveredTile) {
        const dist = Math.abs(hoveredTile.x - player.x) + Math.abs(hoveredTile.y - player.y);
        if (dist > 0 && dist <= player.ap && isWalkable(hoveredTile.x, hoveredTile.y)) {
            const screenX = hoveredTile.x * TILE_SIZE - cameraX;
            const screenY = hoveredTile.y * TILE_SIZE - cameraY;
            ctx.fillStyle = 'rgba(100, 200, 100, 0.3)';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.fillText(`${dist}AP`, screenX + 2, screenY + TILE_SIZE - 4);
        }
    }
}

function update(dt) {
    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        const dist = Math.hypot(p.x - p.targetX, p.y - p.targetY);
        if (dist < 10 || p.life <= 0) {
            projectiles.splice(i, 1);
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.life -= dt;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
}

let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (!gamePaused) {
        update(dt);
    }

    render();
    requestAnimationFrame(gameLoop);
}

// ═══════════════════════════════════════════════════════════
// TEST HARNESS
// ═══════════════════════════════════════════════════════════
(function() {
    function simulateKeyDown(key) {
        activeHarnessKeys.add(key.toLowerCase());
        keys[key.toLowerCase()] = true;
    }

    function simulateKeyUp(key) {
        activeHarnessKeys.delete(key.toLowerCase());
        keys[key.toLowerCase()] = false;
    }

    function releaseAllKeys() {
        activeHarnessKeys.clear();
        for (const k in keys) keys[k] = false;
    }

    window.harness = {
        pause: () => { gamePaused = true; releaseAllKeys(); },
        resume: () => { gamePaused = false; },
        isPaused: () => gamePaused,

        execute: (action, durationMs) => {
            return new Promise((resolve) => {
                if (action.keys) {
                    for (const key of action.keys) {
                        simulateKeyDown(key);

                        // Handle specific keys
                        if (key.toLowerCase() === 'enter') endTurn();
                        if (key.toLowerCase() === 'r') reloadWeapon();
                        if (key.toLowerCase() === 'tab') cycleStance();
                    }
                }

                if (action.click && player) {
                    const tileX = Math.floor((action.click.x + cameraX) / TILE_SIZE);
                    const tileY = Math.floor((action.click.y + cameraY) / TILE_SIZE);
                    hoveredTile = { x: tileX, y: tileY };
                    handleClick();
                }

                gamePaused = false;

                setTimeout(() => {
                    releaseAllKeys();
                    gamePaused = true;
                    resolve();
                }, durationMs);
            });
        },

        getState: () => ({
            gameState,
            currentPhase,
            turnNumber,
            corruption,
            player: player ? {
                x: player.x,
                y: player.y,
                hp: player.hp,
                maxHp: player.maxHp,
                ap: player.ap,
                maxAp: player.maxAp,
                stance: player.stance.name,
                weapon: player.weapon.name,
                ammo: player.weapon.ammo,
                magSize: player.weapon.magSize
            } : null,
            enemies: enemies.map(e => ({
                x: e.x,
                y: e.y,
                type: e.type,
                hp: e.hp,
                maxHp: e.maxHp,
                alerted: e.alerted,
                visible: isVisible(e.x, e.y)
            })),
            items: items.map(i => ({ x: i.x, y: i.y, type: i.type })),
            stats: { ...stats },
            camera: { x: cameraX, y: cameraY },
            mapSize: { width: MAP_WIDTH, height: MAP_HEIGHT }
        }),

        getPhase: () => {
            if (gameState === 'menu') return 'menu';
            if (gameState === 'playing') return 'playing';
            if (gameState === 'gameover') return 'gameover';
            if (gameState === 'victory') return 'victory';
            return gameState;
        },

        debug: {
            setHealth: (hp) => { if (player) player.hp = hp; },
            setAP: (ap) => { if (player) player.ap = ap; },
            setPosition: (x, y) => { if (player) { player.x = x; player.y = y; updateCamera(); updateVisibility(); } },
            setCorruption: (val) => { corruption = val; },
            spawnEnemy: (type, x, y) => { enemies.push(new Enemy(type, x, y)); },
            clearEnemies: () => { enemies.length = 0; },
            giveAmmo: (amount) => { if (player) player.weapon.ammo = Math.min(player.weapon.magSize, player.weapon.ammo + amount); },
            forceStart: () => { startGame(); gamePaused = false; },
            forceEndTurn: () => { endTurn(); },
            forceGameOver: () => { gameOver('Debug triggered'); },
            forceVictory: () => { victory(); },
            log: (msg) => { console.log('[HARNESS]', msg); }
        },

        version: '1.0',
        gameInfo: {
            name: 'Quasimorph Clone',
            type: 'turn_based_tactical',
            controls: {
                movement: ['click'],
                actions: { endTurn: 'Enter', reload: 'r', stance: 'Tab' }
            }
        }
    };

    console.log('[HARNESS] Test harness initialized');
})();

requestAnimationFrame(gameLoop);
