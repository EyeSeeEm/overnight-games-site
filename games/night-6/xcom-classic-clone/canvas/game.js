// X-COM Classic Clone - Tactical Combat
// A turn-based tactical strategy game inspired by UFO: Enemy Unknown

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 700;
const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;

// Game states
const GameState = {
    TITLE: 'title',
    DEPLOYMENT: 'deployment',
    PLAYER_TURN: 'player',
    ENEMY_TURN: 'enemy',
    ANIMATION: 'animation',
    GAME_OVER: 'gameover',
    VICTORY: 'victory'
};

// Tile types
const TileType = {
    GROUND: 0,
    WALL: 1,
    DOOR_CLOSED: 2,
    DOOR_OPEN: 3,
    COVER_HALF: 4,
    COVER_FULL: 5,
    UFO_HULL: 6,
    UFO_FLOOR: 7,
    RUBBLE: 8,
    GRASS: 9
};

// Direction constants (8 directions)
const Direction = {
    NORTH: 0, NORTHEAST: 1, EAST: 2, SOUTHEAST: 3,
    SOUTH: 4, SOUTHWEST: 5, WEST: 6, NORTHWEST: 7
};

const DIR_OFFSETS = [
    { dx: 0, dy: -1 },  // N
    { dx: 1, dy: -1 },  // NE
    { dx: 1, dy: 0 },   // E
    { dx: 1, dy: 1 },   // SE
    { dx: 0, dy: 1 },   // S
    { dx: -1, dy: 1 },  // SW
    { dx: -1, dy: 0 },  // W
    { dx: -1, dy: -1 }  // NW
];

// Action types
const ActionType = {
    NONE: 'none',
    MOVE: 'move',
    SHOOT_SNAP: 'snap',
    SHOOT_AIMED: 'aimed',
    SHOOT_AUTO: 'auto',
    TURN: 'turn',
    KNEEL: 'kneel',
    OVERWATCH: 'overwatch',
    END_TURN: 'endturn'
};

// Colors
const COLORS = {
    player: '#4488ff',
    playerSelected: '#66aaff',
    alien: '#ff4444',
    alienCorpse: '#882222',
    ground: '#2a3a2a',
    grass: '#2a4a2a',
    wall: '#555555',
    cover: '#444444',
    ufoHull: '#333355',
    ufoFloor: '#3a3a4a',
    door: '#665544',
    doorOpen: '#443322',
    rubble: '#555544',
    fog: '#000000',
    fogPartial: 'rgba(0, 0, 0, 0.5)',
    ui: '#88aacc',
    uiBg: 'rgba(20, 30, 40, 0.9)',
    tuBar: '#44ff44',
    healthBar: '#ff4444',
    selected: 'rgba(68, 136, 255, 0.3)',
    moveRange: 'rgba(68, 255, 68, 0.2)',
    shootRange: 'rgba(255, 136, 68, 0.2)'
};

// Weapons
const WEAPONS = {
    pistol: {
        name: 'Pistol',
        damage: 26,
        snapShot: { accuracy: 30, tuPercent: 18 },
        aimedShot: { accuracy: 78, tuPercent: 30 },
        autoShot: null,
        ammo: 12,
        range: 15
    },
    rifle: {
        name: 'Rifle',
        damage: 30,
        snapShot: { accuracy: 60, tuPercent: 25 },
        aimedShot: { accuracy: 110, tuPercent: 80 },
        autoShot: { accuracy: 35, tuPercent: 35, rounds: 3 },
        ammo: 20,
        range: 25
    },
    heavyCannon: {
        name: 'Heavy Cannon',
        damage: 56,
        snapShot: { accuracy: 60, tuPercent: 33 },
        aimedShot: { accuracy: 90, tuPercent: 80 },
        autoShot: null,
        ammo: 6,
        range: 20
    },
    plasmaPistol: {
        name: 'Plasma Pistol',
        damage: 52,
        snapShot: { accuracy: 65, tuPercent: 30 },
        aimedShot: { accuracy: 85, tuPercent: 60 },
        autoShot: { accuracy: 50, tuPercent: 30, rounds: 3 },
        ammo: 26,
        range: 18
    },
    plasmaRifle: {
        name: 'Plasma Rifle',
        damage: 80,
        snapShot: { accuracy: 86, tuPercent: 30 },
        aimedShot: { accuracy: 100, tuPercent: 60 },
        autoShot: { accuracy: 55, tuPercent: 36, rounds: 3 },
        ammo: 28,
        range: 25
    }
};

// Alien types
const ALIEN_TYPES = {
    sectoid: {
        name: 'Sectoid',
        health: 30,
        tu: 54,
        reactions: 63,
        accuracy: 50,
        armor: 4,
        weapon: 'plasmaPistol',
        color: '#666688'
    },
    floater: {
        name: 'Floater',
        health: 40,
        tu: 55,
        reactions: 55,
        accuracy: 45,
        armor: 6,
        weapon: 'plasmaRifle',
        color: '#668866'
    },
    muton: {
        name: 'Muton',
        health: 125,
        tu: 60,
        reactions: 68,
        accuracy: 65,
        armor: 32,
        weapon: 'plasmaRifle',
        color: '#886644'
    }
};

// Game state
let gameState = GameState.TITLE;
let turn = 0;
let isPaused = false;
let turnAnnouncement = { text: '', timer: 0 };
let selectedSoldier = null;
let currentAction = ActionType.NONE;
let soldiers = [];
let aliens = [];
let map = [];
let visibilityMap = [];
let particles = [];
let floatingTexts = [];
let animationQueue = [];
let currentAnimation = null;
let showingEnemyTurn = false;
let enemyTurnTimer = 0;
let currentEnemyIndex = 0;
let gameTime = 0;
let lastTime = 0;

// Camera
let camera = { x: 0, y: 0 };
const VIEW_WIDTH = Math.floor((CANVAS_WIDTH - 180) / TILE_SIZE);
const VIEW_HEIGHT = Math.floor((CANVAS_HEIGHT - 120) / TILE_SIZE);

// Screen shake
let screenShake = { intensity: 0, duration: 0 };

function triggerScreenShake(intensity, duration) {
    screenShake.intensity = intensity;
    screenShake.duration = duration;
}

// Muzzle flash
let muzzleFlashes = [];

function addMuzzleFlash(x, y, direction) {
    muzzleFlashes.push({
        x: x,
        y: y,
        direction: direction,
        life: 100,
        maxLife: 100
    });
}

// Hit flashes
let hitFlashes = [];

function addHitFlash(x, y) {
    hitFlashes.push({
        x: x,
        y: y,
        life: 150,
        maxLife: 150
    });
}

// Ambient particles
let ambientParticles = [];

function initAmbientParticles() {
    ambientParticles = [];
    for (let i = 0; i < 30; i++) {
        ambientParticles.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            vx: (Math.random() - 0.5) * 10,
            vy: Math.random() * 5 + 5,
            size: 1 + Math.random() * 2,
            alpha: 0.1 + Math.random() * 0.2
        });
    }
}

// Input
let hoveredTile = null;
let hoveredButton = null;
let keys = {};

// Button tooltips
const BUTTON_TOOLTIPS = {
    [ActionType.MOVE]: 'Move soldier. Cost: 4 TU per tile (6 diagonal)',
    [ActionType.SHOOT_SNAP]: 'Quick shot. Low accuracy, fast. 25% TU',
    [ActionType.SHOOT_AIMED]: 'Aimed shot. High accuracy, slow. 50-80% TU',
    [ActionType.SHOOT_AUTO]: '3-round burst. Low accuracy. 35% TU',
    [ActionType.KNEEL]: 'Toggle kneeling. +15% accuracy when kneeling',
    [ActionType.OVERWATCH]: 'Overwatch. React to enemy movement',
    [ActionType.END_TURN]: 'End your turn and let aliens act'
};

// Alien spotted alerts
let alienSpottedAlerts = [];

// ============================================================================
// SOLDIER CLASS
// ============================================================================

class Soldier {
    constructor(x, y, name) {
        this.x = x;
        this.y = y;
        this.name = name;

        // Stats
        this.tuMax = 50 + Math.floor(Math.random() * 20);
        this.tu = this.tuMax;
        this.healthMax = 30 + Math.floor(Math.random() * 15);
        this.health = this.healthMax;
        this.reactions = 40 + Math.floor(Math.random() * 30);
        this.firingAccuracy = 45 + Math.floor(Math.random() * 25);
        this.bravery = 30 + Math.floor(Math.random() * 40);

        // State
        this.facing = Direction.SOUTH;
        this.kneeling = false;
        this.overwatch = false;
        this.morale = 100;
        this.alive = true;

        // Equipment
        this.weapon = { ...WEAPONS.rifle, currentAmmo: WEAPONS.rifle.ammo };
        this.grenades = 2;

        // Stats tracking
        this.kills = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;
    }

    startTurn() {
        this.tu = this.tuMax;
        this.overwatch = false;
    }

    canMove(dx, dy) {
        const cost = this.getMoveCost(dx, dy);
        if (this.tu < cost) return false;

        const newX = this.x + dx;
        const newY = this.y + dy;
        return isWalkable(newX, newY) && !isOccupied(newX, newY);
    }

    getMoveCost(dx, dy) {
        const diagonal = dx !== 0 && dy !== 0;
        const baseCost = diagonal ? 6 : 4;

        const newX = this.x + dx;
        const newY = this.y + dy;
        if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) return 999;

        const tile = map[newY][newX];
        if (tile === TileType.RUBBLE || tile === TileType.GRASS) return baseCost + 2;
        return baseCost;
    }

    move(dx, dy) {
        if (!this.canMove(dx, dy)) return false;

        const cost = this.getMoveCost(dx, dy);
        this.tu -= cost;
        this.x += dx;
        this.y += dy;

        // Auto-face movement direction
        this.facing = getDirectionFromOffset(dx, dy);

        // Open doors automatically
        if (map[this.y][this.x] === TileType.DOOR_CLOSED) {
            map[this.y][this.x] = TileType.DOOR_OPEN;
            showFloatingText(this.x * TILE_SIZE + TILE_SIZE / 2, this.y * TILE_SIZE, 'Door opened!', '#ffdd88');
        }

        updateVisibility();
        return true;
    }

    turnTo(direction) {
        const diff = Math.abs(this.facing - direction);
        const turns = Math.min(diff, 8 - diff);
        const cost = turns;

        if (this.tu < cost) return false;
        this.tu -= cost;
        this.facing = direction;
        updateVisibility();
        return true;
    }

    toggleKneel() {
        const cost = this.kneeling ? 8 : 4; // Stand up costs more
        if (this.tu < cost) return false;
        this.tu -= cost;
        this.kneeling = !this.kneeling;
        return true;
    }

    canShoot(mode, target) {
        if (!this.weapon) return false;

        let shotData;
        if (mode === ActionType.SHOOT_SNAP) shotData = this.weapon.snapShot;
        else if (mode === ActionType.SHOOT_AIMED) shotData = this.weapon.aimedShot;
        else if (mode === ActionType.SHOOT_AUTO) shotData = this.weapon.autoShot;

        if (!shotData) return false;

        const tuCost = Math.floor(this.tuMax * shotData.tuPercent / 100);
        if (this.tu < tuCost) return false;
        if (this.weapon.currentAmmo <= 0) return false;

        // Check line of sight
        if (!hasLineOfSight(this.x, this.y, target.x, target.y)) return false;

        // Check range
        const dist = getDistance(this.x, this.y, target.x, target.y);
        if (dist > this.weapon.range) return false;

        return true;
    }

    shoot(mode, target) {
        if (!this.canShoot(mode, target)) return { success: false };

        let shotData;
        if (mode === ActionType.SHOOT_SNAP) shotData = this.weapon.snapShot;
        else if (mode === ActionType.SHOOT_AIMED) shotData = this.weapon.aimedShot;
        else if (mode === ActionType.SHOOT_AUTO) shotData = this.weapon.autoShot;

        const tuCost = Math.floor(this.tuMax * shotData.tuPercent / 100);
        this.tu -= tuCost;

        // Muzzle flash
        addMuzzleFlash(
            this.x * TILE_SIZE + TILE_SIZE / 2,
            this.y * TILE_SIZE + TILE_SIZE / 2,
            this.facing
        );

        const rounds = shotData.rounds || 1;
        let totalHits = 0;
        let totalDamage = 0;

        for (let i = 0; i < rounds; i++) {
            if (this.weapon.currentAmmo <= 0) break;
            this.weapon.currentAmmo--;
            this.shotsFired++;

            // Calculate hit chance
            let hitChance = this.firingAccuracy * shotData.accuracy / 100;
            if (this.kneeling) hitChance *= 1.15;

            const dist = getDistance(this.x, this.y, target.x, target.y);
            const optimalRange = this.weapon.range * 0.6;
            if (dist > optimalRange) {
                hitChance -= (dist - optimalRange) * 2;
            }

            hitChance = Math.max(5, Math.min(95, hitChance));

            // Roll to hit
            const roll = Math.random() * 100;
            if (roll < hitChance) {
                totalHits++;
                this.shotsHit++;

                // Check for critical hit (15% chance)
                const isCritical = Math.random() < 0.15;

                // Calculate damage (50% to 200% variance, 2x for critical)
                let damageMultiplier = 0.5 + Math.random() * 1.5;
                if (isCritical) {
                    damageMultiplier *= 2;
                    showFloatingText(target.x * TILE_SIZE + TILE_SIZE / 2, target.y * TILE_SIZE - 20, 'CRITICAL!', '#ffff00');
                    triggerScreenShake(8, 300);
                }
                const damage = Math.floor(this.weapon.damage * damageMultiplier);
                totalDamage += damage;

                target.takeDamage(damage, this);
            }

            // Create projectile animation
            queueAnimation({
                type: 'projectile',
                startX: this.x * TILE_SIZE + TILE_SIZE / 2,
                startY: this.y * TILE_SIZE + TILE_SIZE / 2,
                endX: target.x * TILE_SIZE + TILE_SIZE / 2,
                endY: target.y * TILE_SIZE + TILE_SIZE / 2,
                hit: roll < hitChance,
                duration: 100 + i * 50
            });
        }

        return { success: true, hits: totalHits, damage: totalDamage, rounds };
    }

    takeDamage(amount, attacker) {
        this.health -= amount;
        showFloatingText(this.x * TILE_SIZE + TILE_SIZE / 2, this.y * TILE_SIZE, `-${amount}`, COLORS.healthBar);

        // Screen shake for player damage
        triggerScreenShake(6, 200);

        // Hit flash
        addHitFlash(this.x * TILE_SIZE + TILE_SIZE / 2, this.y * TILE_SIZE + TILE_SIZE / 2);

        // Morale loss
        this.morale -= 10;

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        showFloatingText(this.x * TILE_SIZE + TILE_SIZE / 2, this.y * TILE_SIZE - 20, `${this.name} KIA!`, '#ff0000');

        // Death particles
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: this.x * TILE_SIZE + TILE_SIZE / 2,
                y: this.y * TILE_SIZE + TILE_SIZE / 2,
                vx: (Math.random() - 0.5) * 80,
                vy: (Math.random() - 0.5) * 80,
                life: 500,
                maxLife: 500,
                color: COLORS.healthBar,
                size: 3
            });
        }
    }

    setOverwatch() {
        if (this.tu < Math.floor(this.tuMax * 0.25)) return false;
        this.overwatch = true;
        return true;
    }

    draw() {
        if (!this.alive) return;

        const screenX = (this.x - camera.x) * TILE_SIZE;
        const screenY = (this.y - camera.y) * TILE_SIZE;

        // Selection highlight
        if (this === selectedSoldier) {
            ctx.fillStyle = COLORS.selected;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        }

        // Soldier body
        const bodyOffset = this.kneeling ? 4 : 0;
        ctx.fillStyle = this === selectedSoldier ? COLORS.playerSelected : COLORS.player;
        ctx.fillRect(screenX + 4, screenY + 4 + bodyOffset, TILE_SIZE - 8, TILE_SIZE - 8 - bodyOffset);

        // Facing indicator
        const facingOffset = DIR_OFFSETS[this.facing];
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(
            screenX + TILE_SIZE / 2 + facingOffset.dx * 8,
            screenY + TILE_SIZE / 2 + facingOffset.dy * 8,
            3, 0, Math.PI * 2
        );
        ctx.fill();

        // Kneeling indicator
        if (this.kneeling) {
            ctx.fillStyle = '#88ff88';
            ctx.fillRect(screenX + 2, screenY + TILE_SIZE - 6, TILE_SIZE - 4, 4);
        }

        // Overwatch indicator
        if (this.overwatch) {
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        }

        // Health bar
        if (this.health < this.healthMax) {
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX, screenY - 6, TILE_SIZE, 4);
            ctx.fillStyle = COLORS.healthBar;
            ctx.fillRect(screenX, screenY - 6, TILE_SIZE * (this.health / this.healthMax), 4);
        }

        // TU bar
        ctx.fillStyle = '#222';
        ctx.fillRect(screenX, screenY - 2, TILE_SIZE, 2);
        ctx.fillStyle = COLORS.tuBar;
        ctx.fillRect(screenX, screenY - 2, TILE_SIZE * (this.tu / this.tuMax), 2);
    }
}

// ============================================================================
// ALIEN CLASS
// ============================================================================

class Alien {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;

        const data = ALIEN_TYPES[type];
        this.name = data.name;
        this.healthMax = data.health;
        this.health = data.health;
        this.tuMax = data.tu;
        this.tu = data.tu;
        this.reactions = data.reactions;
        this.accuracy = data.accuracy;
        this.armor = data.armor;
        this.color = data.color;
        this.weapon = { ...WEAPONS[data.weapon], currentAmmo: WEAPONS[data.weapon].ammo };

        this.facing = Direction.SOUTH;
        this.alive = true;
        this.alerted = false;
        this.lastSeenPlayer = null;
    }

    startTurn() {
        this.tu = this.tuMax;
    }

    canSeeAny() {
        for (const soldier of soldiers) {
            if (!soldier.alive) continue;
            if (hasLineOfSight(this.x, this.y, soldier.x, soldier.y)) {
                const dist = getDistance(this.x, this.y, soldier.x, soldier.y);
                if (dist <= 15) {
                    this.alerted = true;
                    this.lastSeenPlayer = { x: soldier.x, y: soldier.y };
                    return soldier;
                }
            }
        }
        return null;
    }

    takeAction() {
        if (this.tu <= 0) return false;

        const target = this.canSeeAny();

        if (target) {
            // Try to shoot
            const dist = getDistance(this.x, this.y, target.x, target.y);
            if (dist <= this.weapon.range && this.weapon.currentAmmo > 0) {
                const shotData = this.weapon.snapShot;
                const tuCost = Math.floor(this.tuMax * shotData.tuPercent / 100);

                if (this.tu >= tuCost) {
                    this.shoot(target);
                    return true;
                }
            }

            // Move closer
            return this.moveToward(target.x, target.y);
        } else if (this.alerted && this.lastSeenPlayer) {
            // Move to last seen position
            return this.moveToward(this.lastSeenPlayer.x, this.lastSeenPlayer.y);
        }

        return false;
    }

    moveToward(targetX, targetY) {
        if (this.tu < 4) return false;

        const dx = Math.sign(targetX - this.x);
        const dy = Math.sign(targetY - this.y);

        // Try diagonal first, then cardinal
        const moves = [
            { dx, dy },
            { dx: dx, dy: 0 },
            { dx: 0, dy: dy },
            { dx: -dx, dy: dy },
            { dx: dx, dy: -dy }
        ];

        for (const move of moves) {
            if (move.dx === 0 && move.dy === 0) continue;

            const newX = this.x + move.dx;
            const newY = this.y + move.dy;

            if (isWalkable(newX, newY) && !isOccupied(newX, newY)) {
                const diagonal = move.dx !== 0 && move.dy !== 0;
                const cost = diagonal ? 6 : 4;
                if (this.tu >= cost) {
                    this.tu -= cost;
                    this.x = newX;
                    this.y = newY;
                    this.facing = getDirectionFromOffset(move.dx, move.dy);
                    return true;
                }
            }
        }

        return false;
    }

    shoot(target) {
        const shotData = this.weapon.snapShot;
        const tuCost = Math.floor(this.tuMax * shotData.tuPercent / 100);
        this.tu -= tuCost;
        this.weapon.currentAmmo--;

        // Muzzle flash
        addMuzzleFlash(
            this.x * TILE_SIZE + TILE_SIZE / 2,
            this.y * TILE_SIZE + TILE_SIZE / 2,
            this.facing
        );

        let hitChance = this.accuracy * shotData.accuracy / 100;
        hitChance = Math.max(5, Math.min(85, hitChance));

        const roll = Math.random() * 100;
        const hit = roll < hitChance;

        queueAnimation({
            type: 'projectile',
            startX: this.x * TILE_SIZE + TILE_SIZE / 2,
            startY: this.y * TILE_SIZE + TILE_SIZE / 2,
            endX: target.x * TILE_SIZE + TILE_SIZE / 2,
            endY: target.y * TILE_SIZE + TILE_SIZE / 2,
            hit: hit,
            color: '#ff8800',
            duration: 150
        });

        if (hit) {
            const damageMultiplier = 0.5 + Math.random() * 1.5;
            const damage = Math.floor(this.weapon.damage * damageMultiplier);
            target.takeDamage(damage, this);
        } else {
            showFloatingText(target.x * TILE_SIZE + TILE_SIZE / 2, target.y * TILE_SIZE, 'MISS', '#888888');
            // Miss particles - shot goes wide
            const missAngle = Math.random() * Math.PI * 2;
            for (let i = 0; i < 3; i++) {
                particles.push({
                    x: target.x * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * TILE_SIZE,
                    y: target.y * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * TILE_SIZE,
                    vx: Math.cos(missAngle) * 100 * (0.5 + Math.random()),
                    vy: Math.sin(missAngle) * 100 * (0.5 + Math.random()),
                    life: 300,
                    maxLife: 300,
                    color: '#ffff88',
                    size: 2
                });
            }
        }
    }

    takeDamage(amount, attacker) {
        // Apply armor
        const finalDamage = Math.max(1, amount - this.armor);
        this.health -= finalDamage;

        showFloatingText(this.x * TILE_SIZE + TILE_SIZE / 2, this.y * TILE_SIZE, `-${finalDamage}`, COLORS.healthBar);

        // Screen shake on hit
        triggerScreenShake(3, 100);

        // Hit flash
        addHitFlash(this.x * TILE_SIZE + TILE_SIZE / 2, this.y * TILE_SIZE + TILE_SIZE / 2);

        this.alerted = true;
        if (attacker) {
            this.lastSeenPlayer = { x: attacker.x, y: attacker.y };
        }

        if (this.health <= 0) {
            this.die(attacker);
        }
    }

    die(killer) {
        this.alive = false;
        if (killer && killer.kills !== undefined) {
            killer.kills++;
        }

        showFloatingText(this.x * TILE_SIZE + TILE_SIZE / 2, this.y * TILE_SIZE - 20, `${this.name} KILLED!`, '#ffff00');

        // Screen shake on kill
        triggerScreenShake(5, 200);

        // Death particles (alien goo/blood)
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 80;
            particles.push({
                x: this.x * TILE_SIZE + TILE_SIZE / 2,
                y: this.y * TILE_SIZE + TILE_SIZE / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 600 + Math.random() * 400,
                maxLife: 1000,
                color: this.color,
                size: 2 + Math.random() * 4
            });
        }

        // Green blood splatter
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: this.x * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 20,
                y: this.y * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 20,
                vx: 0,
                vy: 0,
                life: 2000,
                maxLife: 2000,
                color: '#336633',
                size: 4 + Math.random() * 6
            });
        }
    }

    draw() {
        if (!this.alive) return;
        if (!visibilityMap[this.y] || !visibilityMap[this.y][this.x]) return;

        const screenX = (this.x - camera.x) * TILE_SIZE;
        const screenY = (this.y - camera.y) * TILE_SIZE;

        // Alien body
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);

        // Facing indicator
        const facingOffset = DIR_OFFSETS[this.facing];
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(
            screenX + TILE_SIZE / 2 + facingOffset.dx * 8,
            screenY + TILE_SIZE / 2 + facingOffset.dy * 8,
            3, 0, Math.PI * 2
        );
        ctx.fill();

        // Alert indicator
        if (this.alerted) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', screenX + TILE_SIZE / 2, screenY - 8);
        }

        // Health bar
        if (this.health < this.healthMax) {
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX, screenY - 6, TILE_SIZE, 4);
            ctx.fillStyle = COLORS.healthBar;
            ctx.fillRect(screenX, screenY - 6, TILE_SIZE * (this.health / this.healthMax), 4);
        }
    }
}

// ============================================================================
// MAP GENERATION
// ============================================================================

function generateMap() {
    // Initialize empty map with terrain variation
    map = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Add some ground variation
            if (Math.random() < 0.15) {
                map[y][x] = TileType.GROUND;
            } else {
                map[y][x] = TileType.GRASS;
            }
        }
    }

    // Generate procedural buildings (2-4 buildings)
    const numBuildings = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numBuildings; i++) {
        if (Math.random() < 0.7) {
            generateBuilding();
        } else {
            generateLShapedBuilding();
        }
    }

    // Generate crashed UFO
    generateUFO();

    // Add fence clusters
    const numFences = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numFences; i++) {
        generateFenceCluster();
    }

    // Add scattered cover
    for (let i = 0; i < 15 + Math.floor(Math.random() * 10); i++) {
        const x = Math.floor(Math.random() * MAP_WIDTH);
        const y = Math.floor(Math.random() * MAP_HEIGHT);
        if (map[y][x] === TileType.GRASS || map[y][x] === TileType.GROUND) {
            const r = Math.random();
            if (r < 0.4) {
                map[y][x] = TileType.COVER_HALF;
            } else if (r < 0.7) {
                map[y][x] = TileType.RUBBLE;
            } else {
                map[y][x] = TileType.COVER_FULL;
            }
        }
    }

    // Initialize visibility map
    visibilityMap = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        visibilityMap[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            visibilityMap[y][x] = false;
        }
    }
}

function generateBuilding() {
    const width = 4 + Math.floor(Math.random() * 4);
    const height = 3 + Math.floor(Math.random() * 3);
    const startX = 1 + Math.floor(Math.random() * (MAP_WIDTH - width - 2));
    const startY = 1 + Math.floor(Math.random() * (MAP_HEIGHT - height - 2));

    // Walls
    for (let y = startY; y < startY + height; y++) {
        for (let x = startX; x < startX + width; x++) {
            if (y === startY || y === startY + height - 1 || x === startX || x === startX + width - 1) {
                map[y][x] = TileType.WALL;
            } else {
                map[y][x] = TileType.GROUND;
            }
        }
    }

    // Door
    const doorSide = Math.floor(Math.random() * 4);
    let doorX, doorY;
    switch (doorSide) {
        case 0: // North
            doorX = startX + 1 + Math.floor(Math.random() * (width - 2));
            doorY = startY;
            break;
        case 1: // South
            doorX = startX + 1 + Math.floor(Math.random() * (width - 2));
            doorY = startY + height - 1;
            break;
        case 2: // West
            doorX = startX;
            doorY = startY + 1 + Math.floor(Math.random() * (height - 2));
            break;
        case 3: // East
            doorX = startX + width - 1;
            doorY = startY + 1 + Math.floor(Math.random() * (height - 2));
            break;
    }
    if (doorY >= 0 && doorY < MAP_HEIGHT && doorX >= 0 && doorX < MAP_WIDTH) {
        map[doorY][doorX] = TileType.DOOR_CLOSED;
    }

    // Interior cover
    if (width > 4 && height > 3) {
        const coverX = startX + 2;
        const coverY = startY + 1;
        map[coverY][coverX] = TileType.COVER_HALF;
    }
}

function generateLShapedBuilding() {
    const startX = 2 + Math.floor(Math.random() * (MAP_WIDTH - 10));
    const startY = 2 + Math.floor(Math.random() * (MAP_HEIGHT - 8));

    // Main vertical part
    for (let y = startY; y < startY + 6; y++) {
        for (let x = startX; x < startX + 3; x++) {
            if (y === startY || y === startY + 5 || x === startX || x === startX + 2) {
                map[y][x] = TileType.WALL;
            } else {
                map[y][x] = TileType.GROUND;
            }
        }
    }

    // Horizontal extension
    for (let y = startY; y < startY + 3; y++) {
        for (let x = startX + 2; x < startX + 6; x++) {
            if (y === startY || y === startY + 2 || x === startX + 5) {
                map[y][x] = TileType.WALL;
            } else {
                map[y][x] = TileType.GROUND;
            }
        }
    }

    // Add doors
    map[startY + 3][startX] = TileType.DOOR_CLOSED;
    map[startY + 1][startX + 5] = TileType.DOOR_CLOSED;
}

function generateFenceCluster() {
    const startX = 1 + Math.floor(Math.random() * (MAP_WIDTH - 6));
    const startY = 1 + Math.floor(Math.random() * (MAP_HEIGHT - 4));
    const horizontal = Math.random() < 0.5;
    const length = 3 + Math.floor(Math.random() * 4);

    for (let i = 0; i < length; i++) {
        const x = horizontal ? startX + i : startX;
        const y = horizontal ? startY : startY + i;
        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
            if (map[y][x] === TileType.GRASS || map[y][x] === TileType.GROUND) {
                map[y][x] = TileType.COVER_HALF;
            }
        }
    }
}

function generateUFO() {
    const ufoWidth = 5;
    const ufoHeight = 4;
    const startX = MAP_WIDTH - ufoWidth - 2;
    const startY = Math.floor(MAP_HEIGHT / 2) - Math.floor(ufoHeight / 2);

    // UFO hull
    for (let y = startY; y < startY + ufoHeight; y++) {
        for (let x = startX; x < startX + ufoWidth; x++) {
            if (y === startY || y === startY + ufoHeight - 1 || x === startX || x === startX + ufoWidth - 1) {
                map[y][x] = TileType.UFO_HULL;
            } else {
                map[y][x] = TileType.UFO_FLOOR;
            }
        }
    }

    // UFO door
    map[startY + Math.floor(ufoHeight / 2)][startX] = TileType.DOOR_OPEN;

    // Rubble around crash
    for (let i = 0; i < 5; i++) {
        const rx = startX - 2 + Math.floor(Math.random() * (ufoWidth + 4));
        const ry = startY - 1 + Math.floor(Math.random() * (ufoHeight + 2));
        if (ry >= 0 && ry < MAP_HEIGHT && rx >= 0 && rx < MAP_WIDTH) {
            if (map[ry][rx] === TileType.GRASS || map[ry][rx] === TileType.GROUND) {
                map[ry][rx] = TileType.RUBBLE;
            }
        }
    }
}

function spawnUnits() {
    soldiers = [];
    aliens = [];

    // Spawn soldiers on the left side
    const soldierNames = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'];
    for (let i = 0; i < 4; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * 4);
            y = 2 + i * 3;
        } while (!isWalkable(x, y) || isOccupied(x, y));

        soldiers.push(new Soldier(x, y, soldierNames[i]));
    }

    // Spawn aliens near and in UFO (random variety)
    const numAliens = 4 + Math.floor(Math.random() * 3); // 4-6 aliens
    const possibleTypes = ['sectoid', 'sectoid', 'sectoid', 'floater', 'floater', 'muton'];

    for (let i = 0; i < numAliens; i++) {
        let x, y;
        let attempts = 0;
        do {
            // Some aliens in UFO area, some spread around map
            if (Math.random() < 0.6) {
                x = MAP_WIDTH - 7 + Math.floor(Math.random() * 6);
                y = 2 + Math.floor(Math.random() * (MAP_HEIGHT - 4));
            } else {
                x = 6 + Math.floor(Math.random() * (MAP_WIDTH - 10));
                y = 1 + Math.floor(Math.random() * (MAP_HEIGHT - 2));
            }
            attempts++;
        } while ((!isWalkable(x, y) || isOccupied(x, y)) && attempts < 50);

        if (attempts < 50) {
            const type = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
            aliens.push(new Alien(x, y, type));
        }
    }

    selectedSoldier = soldiers[0];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function isWalkable(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
    const tile = map[y][x];
    return tile !== TileType.WALL && tile !== TileType.UFO_HULL;
}

function isOccupied(x, y) {
    for (const s of soldiers) {
        if (s.alive && s.x === x && s.y === y) return true;
    }
    for (const a of aliens) {
        if (a.alive && a.x === x && a.y === y) return true;
    }
    return false;
}

function getUnitAt(x, y) {
    for (const s of soldiers) {
        if (s.alive && s.x === x && s.y === y) return s;
    }
    for (const a of aliens) {
        if (a.alive && a.x === x && a.y === y) return a;
    }
    return null;
}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function getDirectionFromOffset(dx, dy) {
    if (dx === 0 && dy < 0) return Direction.NORTH;
    if (dx > 0 && dy < 0) return Direction.NORTHEAST;
    if (dx > 0 && dy === 0) return Direction.EAST;
    if (dx > 0 && dy > 0) return Direction.SOUTHEAST;
    if (dx === 0 && dy > 0) return Direction.SOUTH;
    if (dx < 0 && dy > 0) return Direction.SOUTHWEST;
    if (dx < 0 && dy === 0) return Direction.WEST;
    if (dx < 0 && dy < 0) return Direction.NORTHWEST;
    return Direction.SOUTH;
}

function hasLineOfSight(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let x = x1;
    let y = y1;

    while (true) {
        if (x === x2 && y === y2) return true;

        if (x !== x1 || y !== y1) {
            const tile = map[y][x];
            if (tile === TileType.WALL || tile === TileType.UFO_HULL || tile === TileType.DOOR_CLOSED) {
                return false;
            }
        }

        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }
}

function updateVisibility() {
    // Store previous visibility for alien spotted detection
    const prevVisible = {};
    for (const alien of aliens) {
        if (alien.alive && visibilityMap[alien.y] && visibilityMap[alien.y][alien.x]) {
            prevVisible[`${alien.x},${alien.y}`] = true;
        }
    }

    // Reset visibility
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            visibilityMap[y][x] = false;
        }
    }

    // Calculate visibility from each soldier
    for (const soldier of soldiers) {
        if (!soldier.alive) continue;

        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const dist = getDistance(soldier.x, soldier.y, x, y);
                if (dist <= 12) {
                    if (hasLineOfSight(soldier.x, soldier.y, x, y)) {
                        visibilityMap[y][x] = true;
                    }
                }
            }
        }
    }

    // Check for newly spotted aliens
    for (const alien of aliens) {
        if (alien.alive && visibilityMap[alien.y] && visibilityMap[alien.y][alien.x]) {
            if (!prevVisible[`${alien.x},${alien.y}`]) {
                // New alien spotted!
                showFloatingText(alien.x * TILE_SIZE + TILE_SIZE / 2, alien.y * TILE_SIZE - 10, 'SPOTTED!', '#ff8800');
                triggerScreenShake(2, 100);
            }
        }
    }
}

// ============================================================================
// ANIMATIONS & EFFECTS
// ============================================================================

function queueAnimation(anim) {
    animationQueue.push(anim);
}

function updateAnimations(dt) {
    if (!currentAnimation && animationQueue.length > 0) {
        currentAnimation = animationQueue.shift();
        currentAnimation.progress = 0;
    }

    if (currentAnimation) {
        currentAnimation.progress += (dt * 1000) / currentAnimation.duration;
        if (currentAnimation.progress >= 1) {
            currentAnimation = null;
        }
    }
}

function renderAnimations() {
    if (!currentAnimation) return;

    const t = Math.min(1, currentAnimation.progress);

    if (currentAnimation.type === 'projectile') {
        const x = currentAnimation.startX + (currentAnimation.endX - currentAnimation.startX) * t - camera.x * TILE_SIZE;
        const y = currentAnimation.startY + (currentAnimation.endY - currentAnimation.startY) * t - camera.y * TILE_SIZE;

        ctx.fillStyle = currentAnimation.color || '#ffff00';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.strokeStyle = currentAnimation.color || '#ffff00';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(currentAnimation.startX - camera.x * TILE_SIZE, currentAnimation.startY - camera.y * TILE_SIZE);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 100 * dt; // Gravity
        p.life -= dt * 1000;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function renderParticles() {
    for (const p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - camera.x * TILE_SIZE, p.y - camera.y * TILE_SIZE, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

function updateMuzzleFlashes(dt) {
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
        muzzleFlashes[i].life -= dt * 1000;
        if (muzzleFlashes[i].life <= 0) {
            muzzleFlashes.splice(i, 1);
        }
    }
}

function renderMuzzleFlashes() {
    for (const flash of muzzleFlashes) {
        const alpha = flash.life / flash.maxLife;
        const screenX = flash.x - camera.x * TILE_SIZE;
        const screenY = flash.y - camera.y * TILE_SIZE;

        // Muzzle flash glow
        const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 15);
        gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
        gradient.addColorStop(0.3, `rgba(255, 200, 100, ${alpha * 0.7})`);
        gradient.addColorStop(1, `rgba(255, 100, 50, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 15, 0, Math.PI * 2);
        ctx.fill();

        // Flash core
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function updateHitFlashes(dt) {
    for (let i = hitFlashes.length - 1; i >= 0; i--) {
        hitFlashes[i].life -= dt * 1000;
        if (hitFlashes[i].life <= 0) {
            hitFlashes.splice(i, 1);
        }
    }
}

function renderHitFlashes() {
    for (const flash of hitFlashes) {
        const alpha = flash.life / flash.maxLife;
        const screenX = flash.x - camera.x * TILE_SIZE;
        const screenY = flash.y - camera.y * TILE_SIZE;

        // Red hit glow
        const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 20);
        gradient.addColorStop(0, `rgba(255, 100, 100, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 50, 50, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(200, 0, 0, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
        ctx.fill();
    }
}

function updateAmbientParticles(dt) {
    for (const p of ambientParticles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Wrap around screen
        if (p.y > CANVAS_HEIGHT) {
            p.y = -5;
            p.x = Math.random() * CANVAS_WIDTH;
        }
        if (p.x < 0) p.x = CANVAS_WIDTH;
        if (p.x > CANVAS_WIDTH) p.x = 0;
    }
}

function renderAmbientParticles() {
    for (const p of ambientParticles) {
        ctx.fillStyle = `rgba(200, 200, 180, ${p.alpha})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    }
}

function showFloatingText(x, y, text, color) {
    floatingTexts.push({
        x, y, text, color,
        life: 1500,
        maxLife: 1500
    });
}

function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y -= 30 * dt;
        ft.life -= dt * 1000;
        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

function renderFloatingTexts() {
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';

    for (const ft of floatingTexts) {
        const alpha = ft.life / ft.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#000';
        ctx.fillText(ft.text, ft.x - camera.x * TILE_SIZE + 1, ft.y - camera.y * TILE_SIZE + 1);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x - camera.x * TILE_SIZE, ft.y - camera.y * TILE_SIZE);
    }
    ctx.globalAlpha = 1;
}

// ============================================================================
// RENDERING
// ============================================================================

function render() {
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gameState === GameState.TITLE) {
        renderTitle();
        return;
    }

    if (gameState === GameState.GAME_OVER) {
        renderGameOver();
        return;
    }

    if (gameState === GameState.VICTORY) {
        renderVictory();
        return;
    }

    // Apply screen shake
    ctx.save();
    if (screenShake.duration > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake.intensity * 2;
        const shakeY = (Math.random() - 0.5) * screenShake.intensity * 2;
        ctx.translate(shakeX, shakeY);
    }

    // Render map
    renderMap();

    // Render units
    for (const soldier of soldiers) {
        soldier.draw();
    }
    for (const alien of aliens) {
        alien.draw();
    }

    // Render particles
    renderParticles();

    // Render muzzle flashes
    renderMuzzleFlashes();

    // Render hit flashes
    renderHitFlashes();

    // Render animations
    renderAnimations();

    // Render floating texts
    renderFloatingTexts();

    // Render ambient particles
    renderAmbientParticles();

    // Render fog
    renderFog();

    // Render targeting cursor when shooting
    if (selectedSoldier && gameState === GameState.PLAYER_TURN && hoveredTile &&
        (currentAction === ActionType.SHOOT_SNAP || currentAction === ActionType.SHOOT_AIMED || currentAction === ActionType.SHOOT_AUTO)) {
        const screenX = (hoveredTile.x - camera.x) * TILE_SIZE + TILE_SIZE / 2;
        const screenY = (hoveredTile.y - camera.y) * TILE_SIZE + TILE_SIZE / 2;

        // Crosshair
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Outer circle
        ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
        ctx.stroke();
        // Cross lines
        ctx.moveTo(screenX - 18, screenY);
        ctx.lineTo(screenX - 8, screenY);
        ctx.moveTo(screenX + 8, screenY);
        ctx.lineTo(screenX + 18, screenY);
        ctx.moveTo(screenX, screenY - 18);
        ctx.lineTo(screenX, screenY - 8);
        ctx.moveTo(screenX, screenY + 8);
        ctx.lineTo(screenX, screenY + 18);
        ctx.stroke();

        // Line from soldier to target
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo((selectedSoldier.x - camera.x) * TILE_SIZE + TILE_SIZE / 2, (selectedSoldier.y - camera.y) * TILE_SIZE + TILE_SIZE / 2);
        ctx.lineTo(screenX, screenY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Restore context (end screen shake)
    ctx.restore();

    // Render UI
    renderUI();

    // Enemy turn overlay
    if (showingEnemyTurn) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ALIEN TURN', CANVAS_WIDTH / 2, 80);
    }

    // Minimap
    renderMinimap();

    // Hover info for units
    renderHoverInfo();

    // Turn announcement
    if (turnAnnouncement.timer > 0) {
        const alpha = Math.min(1, turnAnnouncement.timer / 500);
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = gameState === GameState.PLAYER_TURN ? '#4488ff' : '#ff4444';
        ctx.fillText(turnAnnouncement.text, (CANVAS_WIDTH - 175) / 2, 100);
        ctx.globalAlpha = 1;
    }

    // Pause overlay
    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', CANVAS_WIDTH / 2, 200);

        ctx.font = '18px Arial';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('--- CONTROLS ---', CANVAS_WIDTH / 2, 280);
        ctx.fillText('WASD / Arrows: Scroll camera', CANVAS_WIDTH / 2, 310);
        ctx.fillText('1-4: Select soldier', CANVAS_WIDTH / 2, 340);
        ctx.fillText('TAB: Cycle soldiers', CANVAS_WIDTH / 2, 370);
        ctx.fillText('M: Move mode', CANVAS_WIDTH / 2, 400);
        ctx.fillText('S/A/B: Snap/Aimed/Auto shot', CANVAS_WIDTH / 2, 430);
        ctx.fillText('K: Kneel', CANVAS_WIDTH / 2, 460);
        ctx.fillText('O: Overwatch', CANVAS_WIDTH / 2, 490);
        ctx.fillText('ENTER: End turn', CANVAS_WIDTH / 2, 520);
        ctx.fillText('SPACE: Center camera', CANVAS_WIDTH / 2, 550);

        ctx.font = '24px Arial';
        ctx.fillStyle = '#ffff00';
        ctx.fillText('Press ESC to resume', CANVAS_WIDTH / 2, 600);
    }
}

function renderMap() {
    for (let y = 0; y < VIEW_HEIGHT + 1; y++) {
        for (let x = 0; x < VIEW_WIDTH + 1; x++) {
            const mapX = Math.floor(camera.x) + x;
            const mapY = Math.floor(camera.y) + y;

            if (mapX < 0 || mapX >= MAP_WIDTH || mapY < 0 || mapY >= MAP_HEIGHT) continue;

            const screenX = (mapX - camera.x) * TILE_SIZE;
            const screenY = (mapY - camera.y) * TILE_SIZE;

            const tile = map[mapY][mapX];
            let color = COLORS.ground;

            switch (tile) {
                case TileType.GRASS: color = COLORS.grass; break;
                case TileType.WALL: color = COLORS.wall; break;
                case TileType.DOOR_CLOSED: color = COLORS.door; break;
                case TileType.DOOR_OPEN: color = COLORS.doorOpen; break;
                case TileType.COVER_HALF: color = COLORS.cover; break;
                case TileType.COVER_FULL: color = COLORS.wall; break;
                case TileType.UFO_HULL: color = COLORS.ufoHull; break;
                case TileType.UFO_FLOOR:
                    color = COLORS.ufoFloor;
                    // UFO label on floor tiles
                    ctx.fillStyle = 'rgba(100, 100, 150, 0.3)';
                    ctx.font = '8px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('UFO', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 3);
                    break;
                case TileType.RUBBLE: color = COLORS.rubble; break;
            }

            ctx.fillStyle = color;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Grid lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Cover indicators
            if (tile === TileType.COVER_HALF) {
                ctx.fillStyle = 'rgba(255, 200, 100, 0.4)';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('H', screenX + TILE_SIZE / 2, screenY + TILE_SIZE - 5);
                // Half shield icon
                ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(screenX + 8, screenY + 4);
                ctx.lineTo(screenX + 8, screenY + 12);
                ctx.lineTo(screenX + TILE_SIZE - 8, screenY + 12);
                ctx.lineTo(screenX + TILE_SIZE - 8, screenY + 4);
                ctx.stroke();
            } else if (tile === TileType.COVER_FULL || tile === TileType.WALL) {
                ctx.fillStyle = 'rgba(100, 200, 255, 0.4)';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('F', screenX + TILE_SIZE / 2, screenY + TILE_SIZE - 5);
                // Full shield icon
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX + 6, screenY + 4, TILE_SIZE - 12, 10);
            } else if (tile === TileType.DOOR_CLOSED) {
                // Door indicator
                ctx.fillStyle = 'rgba(255, 220, 100, 0.5)';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('D', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 4);
            } else if (tile === TileType.DOOR_OPEN) {
                ctx.fillStyle = 'rgba(100, 200, 100, 0.3)';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('D', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 4);
            }

            // Hover highlight
            if (hoveredTile && hoveredTile.x === mapX && hoveredTile.y === mapY) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                // Show TU cost preview for movement
                if (selectedSoldier && gameState === GameState.PLAYER_TURN && currentAction === ActionType.MOVE) {
                    const dx = Math.abs(mapX - selectedSoldier.x);
                    const dy = Math.abs(mapY - selectedSoldier.y);
                    if (dx <= 1 && dy <= 1 && (dx > 0 || dy > 0)) {
                        const diagonal = dx > 0 && dy > 0;
                        let tuCost = diagonal ? 6 : 4;
                        if (tile === TileType.RUBBLE || tile === TileType.GRASS) tuCost += 2;

                        ctx.fillStyle = tuCost <= selectedSoldier.tu ? '#44ff44' : '#ff4444';
                        ctx.font = 'bold 12px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(`${tuCost}TU`, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 4);
                    }
                }

                // Show hit chance preview when targeting aliens
                if (selectedSoldier && gameState === GameState.PLAYER_TURN &&
                    (currentAction === ActionType.SHOOT_SNAP || currentAction === ActionType.SHOOT_AIMED || currentAction === ActionType.SHOOT_AUTO)) {
                    const target = getUnitAt(mapX, mapY);
                    if (target && target instanceof Alien && visibilityMap[target.y] && visibilityMap[target.y][target.x]) {
                        let shotData = selectedSoldier.weapon.snapShot;
                        if (currentAction === ActionType.SHOOT_AIMED) shotData = selectedSoldier.weapon.aimedShot;
                        if (currentAction === ActionType.SHOOT_AUTO) shotData = selectedSoldier.weapon.autoShot;

                        if (shotData) {
                            let hitChance = selectedSoldier.firingAccuracy * shotData.accuracy / 100;
                            if (selectedSoldier.kneeling) hitChance *= 1.15;
                            const dist = getDistance(selectedSoldier.x, selectedSoldier.y, target.x, target.y);
                            const optimalRange = selectedSoldier.weapon.range * 0.6;
                            if (dist > optimalRange) hitChance -= (dist - optimalRange) * 2;
                            hitChance = Math.max(5, Math.min(95, hitChance));

                            ctx.fillStyle = hitChance >= 50 ? '#44ff44' : (hitChance >= 25 ? '#ffaa44' : '#ff4444');
                            ctx.font = 'bold 14px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText(`${Math.floor(hitChance)}%`, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 5);
                        }
                    }
                }
            }
        }
    }

    // Movement range for selected soldier
    if (selectedSoldier && gameState === GameState.PLAYER_TURN && currentAction === ActionType.MOVE) {
        ctx.fillStyle = COLORS.moveRange;
        const maxRange = Math.floor(selectedSoldier.tu / 4);

        for (let dy = -maxRange; dy <= maxRange; dy++) {
            for (let dx = -maxRange; dx <= maxRange; dx++) {
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist === 0 || dist > maxRange) continue;

                const mapX = selectedSoldier.x + dx;
                const mapY = selectedSoldier.y + dy;

                if (mapX < 0 || mapX >= MAP_WIDTH || mapY < 0 || mapY >= MAP_HEIGHT) continue;
                if (!isWalkable(mapX, mapY) || isOccupied(mapX, mapY)) continue;

                const screenX = (mapX - camera.x) * TILE_SIZE;
                const screenY = (mapY - camera.y) * TILE_SIZE;
                ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            }
        }
    }
}

function renderFog() {
    for (let y = 0; y < VIEW_HEIGHT + 1; y++) {
        for (let x = 0; x < VIEW_WIDTH + 1; x++) {
            const mapX = Math.floor(camera.x) + x;
            const mapY = Math.floor(camera.y) + y;

            if (mapX < 0 || mapX >= MAP_WIDTH || mapY < 0 || mapY >= MAP_HEIGHT) continue;

            const screenX = (mapX - camera.x) * TILE_SIZE;
            const screenY = (mapY - camera.y) * TILE_SIZE;

            if (!visibilityMap[mapY][mapX]) {
                ctx.fillStyle = COLORS.fogPartial;
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

function renderUI() {
    const uiX = CANVAS_WIDTH - 175;

    // Background
    ctx.fillStyle = COLORS.uiBg;
    ctx.fillRect(uiX, 0, 175, CANVAS_HEIGHT);

    ctx.fillStyle = COLORS.ui;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';

    // Turn info
    ctx.fillText(`Turn ${turn}`, uiX + 10, 25);
    ctx.fillText(gameState === GameState.PLAYER_TURN ? 'YOUR TURN' : 'ALIEN TURN', uiX + 10, 45);

    // Enemy count
    const aliensAlive = aliens.filter(a => a.alive).length;
    const visibleAliens = aliens.filter(a => a.alive && visibilityMap[a.y] && visibilityMap[a.y][a.x]).length;
    ctx.fillStyle = aliensAlive > 0 ? '#ff8888' : '#88ff88';
    ctx.fillText(`Enemies: ${visibleAliens}/${aliensAlive}`, uiX + 10, 65);
    ctx.fillStyle = COLORS.ui;

    // Selected soldier info
    if (selectedSoldier) {
        ctx.fillText('--- SOLDIER ---', uiX + 10, 80);
        ctx.fillText(selectedSoldier.name, uiX + 10, 100);
        ctx.fillText(`TU: ${selectedSoldier.tu}/${selectedSoldier.tuMax}`, uiX + 10, 120);

        // Health with color warning
        const healthPercent = selectedSoldier.health / selectedSoldier.healthMax;
        if (healthPercent <= 0.25) {
            ctx.fillStyle = '#ff4444';
            // Pulsing effect for critical health
            const pulse = Math.sin(gameTime / 200) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
        } else if (healthPercent <= 0.5) {
            ctx.fillStyle = '#ffaa44';
        } else {
            ctx.fillStyle = COLORS.ui;
        }
        ctx.fillText(`HP: ${selectedSoldier.health}/${selectedSoldier.healthMax}`, uiX + 10, 140);
        if (healthPercent <= 0.25) {
            ctx.fillText('! LOW !', uiX + 100, 140);
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = COLORS.ui;
        ctx.fillText(`Acc: ${selectedSoldier.firingAccuracy}%`, uiX + 10, 160);

        // Weapon info with ammo warning
        if (selectedSoldier.weapon) {
            ctx.fillText('--- WEAPON ---', uiX + 10, 190);
            ctx.fillText(selectedSoldier.weapon.name, uiX + 10, 210);

            const ammoPercent = selectedSoldier.weapon.currentAmmo / selectedSoldier.weapon.ammo;
            if (ammoPercent <= 0.15) {
                ctx.fillStyle = '#ff4444';
            } else if (ammoPercent <= 0.35) {
                ctx.fillStyle = '#ffaa44';
            }
            ctx.fillText(`Ammo: ${selectedSoldier.weapon.currentAmmo}/${selectedSoldier.weapon.ammo}`, uiX + 10, 230);
            if (ammoPercent <= 0.15) {
                ctx.fillText('RELOAD!', uiX + 100, 230);
            }
            ctx.fillStyle = COLORS.ui;
        }
    }

    // Action buttons with icons
    ctx.fillText('--- ACTIONS ---', uiX + 10, 270);
    renderActionButton(uiX + 10, 290, 75, 35, 'MOVE', ActionType.MOVE, 'M');
    renderActionButton(uiX + 90, 290, 75, 35, 'SNAP', ActionType.SHOOT_SNAP, 'S');
    renderActionButton(uiX + 10, 330, 75, 35, 'AIMED', ActionType.SHOOT_AIMED, 'A');
    renderActionButton(uiX + 90, 330, 75, 35, 'AUTO', ActionType.SHOOT_AUTO, 'B');
    renderActionButton(uiX + 10, 370, 75, 35, 'KNEEL', ActionType.KNEEL, 'K');
    renderActionButton(uiX + 90, 370, 75, 35, 'WATCH', ActionType.OVERWATCH, 'W');
    renderActionButton(uiX + 10, 410, 155, 35, 'END TURN', ActionType.END_TURN, 'ENTER');

    // Soldier list
    ctx.fillText('--- SQUAD ---', uiX + 10, 470);
    let soldierY = 490;
    for (let i = 0; i < soldiers.length; i++) {
        const s = soldiers[i];
        ctx.fillStyle = s === selectedSoldier ? COLORS.playerSelected : (s.alive ? COLORS.ui : '#666666');
        ctx.fillText(`${i + 1}. ${s.name} ${s.alive ? '' : '[KIA]'}`, uiX + 10, soldierY);
        if (s.alive) {
            // Mini TU bar
            ctx.fillStyle = '#333';
            ctx.fillRect(uiX + 120, soldierY - 10, 40, 6);
            ctx.fillStyle = COLORS.tuBar;
            ctx.fillRect(uiX + 120, soldierY - 10, 40 * (s.tu / s.tuMax), 6);
        }
        soldierY += 20;
    }

    // Controls help
    ctx.fillStyle = '#666666';
    ctx.font = '10px Arial';
    ctx.fillText('1-4: Select soldier', uiX + 10, CANVAS_HEIGHT - 60);
    ctx.fillText('WASD/Arrows: Scroll', uiX + 10, CANVAS_HEIGHT - 45);
    ctx.fillText('Click: Action', uiX + 10, CANVAS_HEIGHT - 30);
    ctx.fillText('ESC: Cancel', uiX + 10, CANVAS_HEIGHT - 15);

    // Render tooltip for hovered button
    if (hoveredButton && BUTTON_TOOLTIPS[hoveredButton]) {
        const tooltip = BUTTON_TOOLTIPS[hoveredButton];
        ctx.font = '11px Arial';
        const textWidth = ctx.measureText(tooltip).width;
        const tooltipX = Math.min(CANVAS_WIDTH - textWidth - 20, CANVAS_WIDTH - 180 - textWidth - 10);
        const tooltipY = 450;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(tooltipX - 5, tooltipY - 14, textWidth + 10, 20);
        ctx.strokeStyle = '#446688';
        ctx.strokeRect(tooltipX - 5, tooltipY - 14, textWidth + 10, 20);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(tooltip, tooltipX, tooltipY);
    }
}

function renderActionButton(x, y, w, h, label, action, key) {
    const isActive = currentAction === action;
    const isHovered = hoveredTile && hoveredTile.uiButton === action;

    // Button background with gradient effect
    ctx.fillStyle = isActive ? '#446688' : (isHovered ? '#334455' : '#223344');
    ctx.fillRect(x, y, w, h);

    // Highlight edge for 3D effect
    ctx.fillStyle = isActive ? '#5577aa' : '#334466';
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y, 2, h);

    ctx.strokeStyle = isActive ? '#88aacc' : '#446688';
    ctx.strokeRect(x, y, w, h);

    // Draw icon based on action type
    ctx.fillStyle = isActive ? '#ffffff' : '#aabbcc';
    const iconX = x + w / 2;
    const iconY = y + 14;

    if (action === ActionType.MOVE) {
        // Movement arrows icon
        ctx.beginPath();
        ctx.moveTo(iconX, iconY - 6);
        ctx.lineTo(iconX + 5, iconY);
        ctx.lineTo(iconX, iconY + 6);
        ctx.lineTo(iconX - 5, iconY);
        ctx.closePath();
        ctx.fill();
    } else if (action === ActionType.SHOOT_SNAP) {
        // Quick shot icon (small crosshair)
        ctx.fillRect(iconX - 4, iconY - 1, 8, 2);
        ctx.fillRect(iconX - 1, iconY - 4, 2, 8);
    } else if (action === ActionType.SHOOT_AIMED) {
        // Aimed shot icon (larger crosshair with circle)
        ctx.beginPath();
        ctx.arc(iconX, iconY, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillRect(iconX - 6, iconY - 1, 12, 2);
        ctx.fillRect(iconX - 1, iconY - 6, 2, 12);
    } else if (action === ActionType.SHOOT_AUTO) {
        // Auto shot icon (three bullets)
        ctx.fillRect(iconX - 5, iconY - 3, 3, 6);
        ctx.fillRect(iconX - 1, iconY - 3, 3, 6);
        ctx.fillRect(iconX + 3, iconY - 3, 3, 6);
    } else if (action === ActionType.KNEEL) {
        // Kneeling figure icon
        ctx.fillRect(iconX - 2, iconY - 5, 4, 5);
        ctx.fillRect(iconX - 4, iconY, 8, 3);
    } else if (action === ActionType.OVERWATCH) {
        // Eye icon for overwatch
        ctx.beginPath();
        ctx.ellipse(iconX, iconY, 6, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(iconX, iconY, 2, 0, Math.PI * 2);
        ctx.fill();
    } else if (action === ActionType.END_TURN) {
        // Arrow turning icon
        ctx.beginPath();
        ctx.moveTo(iconX - 4, iconY - 3);
        ctx.lineTo(iconX + 4, iconY - 3);
        ctx.lineTo(iconX + 4, iconY + 1);
        ctx.lineTo(iconX + 7, iconY + 1);
        ctx.lineTo(iconX + 2, iconY + 5);
        ctx.lineTo(iconX - 3, iconY + 1);
        ctx.lineTo(iconX, iconY + 1);
        ctx.lineTo(iconX, iconY - 1);
        ctx.lineTo(iconX - 4, iconY - 1);
        ctx.closePath();
        ctx.fill();
    }

    // Label
    ctx.font = '9px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#aabbcc';
    ctx.fillText(label, x + w / 2, y + 28);

    // Key hint
    ctx.font = '8px Arial';
    ctx.fillStyle = '#666688';
    ctx.fillText('[' + key + ']', x + w / 2, y + h - 3);
}

function renderHoverInfo() {
    if (!hoveredTile) return;

    const unit = getUnitAt(hoveredTile.x, hoveredTile.y);
    if (!unit) return;

    // Only show info for visible aliens
    if (unit instanceof Alien) {
        if (!visibilityMap[unit.y] || !visibilityMap[unit.y][unit.x]) return;
    }

    const screenX = (unit.x - camera.x) * TILE_SIZE + TILE_SIZE / 2;
    const screenY = (unit.y - camera.y) * TILE_SIZE - 40;

    // Background box
    const boxWidth = 100;
    const boxHeight = unit instanceof Alien ? 70 : 80;
    let boxX = screenX - boxWidth / 2;
    let boxY = screenY - boxHeight;

    // Keep on screen
    if (boxX < 5) boxX = 5;
    if (boxX + boxWidth > CANVAS_WIDTH - 180) boxX = CANVAS_WIDTH - 180 - boxWidth - 5;
    if (boxY < 5) boxY = screenY + TILE_SIZE + 10;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeStyle = unit instanceof Soldier ? '#4488ff' : '#ff4444';
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = unit instanceof Soldier ? '#88aaff' : '#ff8888';

    if (unit instanceof Soldier) {
        ctx.fillText(unit.name, boxX + 5, boxY + 14);
        ctx.font = '10px Arial';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`HP: ${unit.health}/${unit.healthMax}`, boxX + 5, boxY + 28);
        ctx.fillText(`TU: ${unit.tu}/${unit.tuMax}`, boxX + 5, boxY + 42);
        ctx.fillText(`Acc: ${unit.firingAccuracy}%`, boxX + 5, boxY + 56);
        ctx.fillText(unit.kneeling ? 'Kneeling' : 'Standing', boxX + 5, boxY + 70);
    } else {
        ctx.fillText(unit.name, boxX + 5, boxY + 14);
        ctx.font = '10px Arial';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`HP: ${unit.health}/${unit.healthMax}`, boxX + 5, boxY + 28);
        ctx.fillText(`Armor: ${unit.armor}`, boxX + 5, boxY + 42);
        ctx.fillText(unit.weapon.name, boxX + 5, boxY + 56);
        if (unit.alerted) {
            ctx.fillStyle = '#ff4444';
            ctx.fillText('ALERT!', boxX + 5, boxY + 70);
        }
    }
}

function renderMinimap() {
    const minimapX = 10;
    const minimapY = 10;
    const minimapScale = 4;
    const minimapWidth = MAP_WIDTH * minimapScale;
    const minimapHeight = MAP_HEIGHT * minimapScale;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(minimapX - 2, minimapY - 2, minimapWidth + 4, minimapHeight + 4);
    ctx.strokeStyle = '#446688';
    ctx.strokeRect(minimapX - 2, minimapY - 2, minimapWidth + 4, minimapHeight + 4);

    // Draw tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = map[y][x];
            let color = '#222222';

            if (visibilityMap[y] && visibilityMap[y][x]) {
                switch (tile) {
                    case TileType.GRASS: color = '#2a4a2a'; break;
                    case TileType.GROUND: color = '#2a3a2a'; break;
                    case TileType.WALL: color = '#555555'; break;
                    case TileType.UFO_HULL: color = '#333355'; break;
                    case TileType.UFO_FLOOR: color = '#3a3a4a'; break;
                    case TileType.DOOR_CLOSED:
                    case TileType.DOOR_OPEN: color = '#665544'; break;
                    default: color = '#333333';
                }
            }

            ctx.fillStyle = color;
            ctx.fillRect(minimapX + x * minimapScale, minimapY + y * minimapScale, minimapScale, minimapScale);
        }
    }

    // Draw soldiers
    for (const soldier of soldiers) {
        if (!soldier.alive) continue;
        ctx.fillStyle = soldier === selectedSoldier ? '#88aaff' : '#4488ff';
        ctx.fillRect(
            minimapX + soldier.x * minimapScale,
            minimapY + soldier.y * minimapScale,
            minimapScale, minimapScale
        );
    }

    // Draw visible aliens
    for (const alien of aliens) {
        if (!alien.alive) continue;
        if (!visibilityMap[alien.y] || !visibilityMap[alien.y][alien.x]) continue;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(
            minimapX + alien.x * minimapScale,
            minimapY + alien.y * minimapScale,
            minimapScale, minimapScale
        );
    }

    // Draw camera view
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.strokeRect(
        minimapX + camera.x * minimapScale,
        minimapY + camera.y * minimapScale,
        VIEW_WIDTH * minimapScale,
        VIEW_HEIGHT * minimapScale
    );
}

function renderTitle() {
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Animated stars - use deterministic twinkle based on index and time
    for (let i = 0; i < 50; i++) {
        const x = (i * 73 + gameTime * 0.01) % CANVAS_WIDTH;
        const y = (i * 47 + gameTime * 0.005) % CANVAS_HEIGHT;
        // Deterministic twinkle using sine wave with per-star phase offset
        const twinkle = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(gameTime * 0.003 + i * 0.7));
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        ctx.fillRect(x, y, 2, 2);
    }

    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#4488ff';
    ctx.textAlign = 'center';
    ctx.fillText('X-COM TACTICAL', CANVAS_WIDTH / 2, 180);

    ctx.font = '20px Arial';
    ctx.fillStyle = COLORS.ui;
    ctx.fillText('A Classic UFO Defense Clone', CANVAS_WIDTH / 2, 220);

    // Features
    ctx.font = '14px Arial';
    ctx.fillStyle = '#888888';
    ctx.fillText('Time Unit based tactical combat', CANVAS_WIDTH / 2, 280);
    ctx.fillText('Multiple shot types (Snap, Aimed, Auto)', CANVAS_WIDTH / 2, 305);
    ctx.fillText('Reaction fire and overwatch', CANVAS_WIDTH / 2, 330);
    ctx.fillText('Procedurally generated maps', CANVAS_WIDTH / 2, 355);

    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffff00';
    const pulse = Math.sin(gameTime / 300) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText('Click to Start Mission', CANVAS_WIDTH / 2, 450);
    ctx.globalAlpha = 1;

    ctx.font = '12px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText('WASD: Scroll | 1-4: Select | Click: Action | ENTER: End Turn', CANVAS_WIDTH / 2, 550);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(20, 0, 0, 0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ff4444';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION FAILED', CANVAS_WIDTH / 2, 200);

    ctx.font = '20px Arial';
    ctx.fillStyle = '#888888';
    ctx.fillText('All soldiers have been killed in action', CANVAS_WIDTH / 2, 260);

    // Stats
    ctx.font = '16px Arial';
    ctx.fillStyle = COLORS.ui;
    ctx.fillText(`Turns survived: ${turn}`, CANVAS_WIDTH / 2, 330);
    ctx.fillText(`Aliens killed: ${aliens.filter(a => !a.alive).length}`, CANVAS_WIDTH / 2, 360);

    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffff00';
    ctx.fillText('Click to Retry', CANVAS_WIDTH / 2, 450);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 20, 0, 0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#44ff44';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION SUCCESSFUL', CANVAS_WIDTH / 2, 120);

    ctx.font = '20px Arial';
    ctx.fillStyle = '#888888';
    ctx.fillText('All aliens have been eliminated!', CANVAS_WIDTH / 2, 160);

    // Calculate score
    const soldiersAlive = soldiers.filter(s => s.alive).length;
    const totalKills = soldiers.reduce((sum, s) => sum + s.kills, 0);
    const totalShots = soldiers.reduce((sum, s) => sum + s.shotsFired, 0);
    const totalHits = soldiers.reduce((sum, s) => sum + s.shotsHit, 0);
    const overallAccuracy = totalShots > 0 ? Math.floor(totalHits / totalShots * 100) : 0;

    const score = totalKills * 100 + soldiersAlive * 500 - turn * 10;

    // Score
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`SCORE: ${score}`, CANVAS_WIDTH / 2, 210);

    // Stats
    ctx.font = '14px Arial';
    ctx.fillStyle = COLORS.ui;
    ctx.fillText(`Turns: ${turn} | Soldiers Alive: ${soldiersAlive}/4 | Accuracy: ${overallAccuracy}%`, CANVAS_WIDTH / 2, 250);

    // Individual stats
    ctx.font = '12px Arial';
    ctx.fillText('--- SOLDIER PERFORMANCE ---', CANVAS_WIDTH / 2, 290);
    let statY = 315;
    for (const s of soldiers) {
        const accuracy = s.shotsFired > 0 ? Math.floor(s.shotsHit / s.shotsFired * 100) : 0;
        ctx.fillStyle = s.alive ? '#88ff88' : '#ff8888';
        ctx.fillText(`${s.name}: ${s.kills} kills, ${s.shotsFired} shots, ${accuracy}% acc ${s.alive ? '' : '[KIA]'}`, CANVAS_WIDTH / 2, statY);
        statY += 22;
    }

    // Rating
    ctx.font = 'bold 20px Arial';
    let rating = 'POOR';
    let ratingColor = '#ff4444';
    if (score >= 1500) { rating = 'EXCELLENT'; ratingColor = '#44ff44'; }
    else if (score >= 1000) { rating = 'GOOD'; ratingColor = '#88ff88'; }
    else if (score >= 500) { rating = 'FAIR'; ratingColor = '#ffff44'; }
    else if (score >= 200) { rating = 'POOR'; ratingColor = '#ffaa44'; }
    ctx.fillStyle = ratingColor;
    ctx.fillText(`Rating: ${rating}`, CANVAS_WIDTH / 2, 430);

    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffff00';
    const pulse = Math.sin(gameTime / 300) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText('Click to Play Again', CANVAS_WIDTH / 2, 500);
    ctx.globalAlpha = 1;
}

// ============================================================================
// TURN MANAGEMENT
// ============================================================================

function startPlayerTurn() {
    gameState = GameState.PLAYER_TURN;
    turn++;

    // Turn announcement
    turnAnnouncement = { text: `TURN ${turn} - YOUR TURN`, timer: 2000 };

    for (const soldier of soldiers) {
        if (soldier.alive) {
            soldier.startTurn();
        }
    }

    // Select first living soldier
    selectedSoldier = soldiers.find(s => s.alive);
    currentAction = ActionType.NONE;

    updateVisibility();
}

function startEnemyTurn() {
    gameState = GameState.ENEMY_TURN;
    showingEnemyTurn = true;
    enemyTurnTimer = 0;
    currentEnemyIndex = 0;

    // Turn announcement
    turnAnnouncement = { text: 'ALIEN ACTIVITY', timer: 1500 };

    for (const alien of aliens) {
        if (alien.alive) {
            alien.startTurn();
        }
    }
}

function processEnemyTurn(dt) {
    enemyTurnTimer += dt * 1000;

    // Wait for animations
    if (currentAnimation) return;

    // Process one alien at a time
    const livingAliens = aliens.filter(a => a.alive);
    if (currentEnemyIndex >= livingAliens.length) {
        // All aliens done
        showingEnemyTurn = false;
        checkVictory();
        if (gameState !== GameState.VICTORY) {
            startPlayerTurn();
        }
        return;
    }

    const alien = livingAliens[currentEnemyIndex];

    // Small delay between alien actions
    if (enemyTurnTimer < 300) return;

    if (!alien.takeAction()) {
        currentEnemyIndex++;
        enemyTurnTimer = 0;
    } else {
        enemyTurnTimer = 0;
    }
}

function checkVictory() {
    const aliensAlive = aliens.filter(a => a.alive).length;
    const soldiersAlive = soldiers.filter(s => s.alive).length;

    if (aliensAlive === 0) {
        gameState = GameState.VICTORY;
    } else if (soldiersAlive === 0) {
        gameState = GameState.GAME_OVER;
    }
}

// ============================================================================
// INPUT HANDLING
// ============================================================================

function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (gameState === GameState.TITLE) {
        startGame();
        return;
    }

    if (gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) {
        startGame();
        return;
    }

    if (gameState !== GameState.PLAYER_TURN) return;

    // Check UI button clicks
    const uiX = CANVAS_WIDTH - 175;
    if (clickX >= uiX) {
        handleUIClick(clickX, clickY, uiX);
        return;
    }

    // Map click
    const mapX = Math.floor(clickX / TILE_SIZE + camera.x);
    const mapY = Math.floor(clickY / TILE_SIZE + camera.y);

    if (mapX < 0 || mapX >= MAP_WIDTH || mapY < 0 || mapY >= MAP_HEIGHT) return;

    handleMapClick(mapX, mapY);
}

function handleUIClick(clickX, clickY, uiX) {
    // Action buttons
    if (clickY >= 290 && clickY < 325) {
        if (clickX < uiX + 85) setAction(ActionType.MOVE);
        else setAction(ActionType.SHOOT_SNAP);
    } else if (clickY >= 330 && clickY < 365) {
        if (clickX < uiX + 85) setAction(ActionType.SHOOT_AIMED);
        else setAction(ActionType.SHOOT_AUTO);
    } else if (clickY >= 370 && clickY < 405) {
        if (clickX < uiX + 85) {
            if (selectedSoldier) selectedSoldier.toggleKneel();
        } else {
            if (selectedSoldier) selectedSoldier.setOverwatch();
        }
    } else if (clickY >= 410 && clickY < 445) {
        startEnemyTurn();
    }
}

function handleMapClick(mapX, mapY) {
    const unit = getUnitAt(mapX, mapY);

    // Clicking on own soldier selects them
    if (unit && unit instanceof Soldier) {
        selectedSoldier = unit;
        currentAction = ActionType.NONE;
        return;
    }

    if (!selectedSoldier) return;

    // Handle current action
    if (currentAction === ActionType.MOVE) {
        // Pathfind to target (simplified - just try direct movement)
        const dx = Math.sign(mapX - selectedSoldier.x);
        const dy = Math.sign(mapY - selectedSoldier.y);

        if (dx !== 0 || dy !== 0) {
            selectedSoldier.move(dx, dy);
        }
    } else if (currentAction === ActionType.SHOOT_SNAP || currentAction === ActionType.SHOOT_AIMED || currentAction === ActionType.SHOOT_AUTO) {
        // Shoot at target
        if (unit && unit instanceof Alien) {
            const result = selectedSoldier.shoot(currentAction, unit);
            if (result.success) {
                checkVictory();
            }
        }
    } else {
        // Default: try to move toward clicked tile
        const dx = Math.sign(mapX - selectedSoldier.x);
        const dy = Math.sign(mapY - selectedSoldier.y);

        if (dx !== 0 || dy !== 0) {
            selectedSoldier.move(dx, dy);
        }
    }
}

function setAction(action) {
    currentAction = currentAction === action ? ActionType.NONE : action;
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const mapX = Math.floor(mouseX / TILE_SIZE + camera.x);
    const mapY = Math.floor(mouseY / TILE_SIZE + camera.y);

    hoveredTile = { x: mapX, y: mapY };

    // Track button hover
    const uiX = CANVAS_WIDTH - 175;
    hoveredButton = null;
    if (mouseX >= uiX) {
        // Check each button region
        if (mouseY >= 300 && mouseY < 345) {
            if (mouseX < uiX + 85) hoveredButton = ActionType.MOVE;
            else hoveredButton = ActionType.SHOOT_SNAP;
        } else if (mouseY >= 345 && mouseY < 390) {
            if (mouseX < uiX + 85) hoveredButton = ActionType.SHOOT_AIMED;
            else hoveredButton = ActionType.SHOOT_AUTO;
        } else if (mouseY >= 390 && mouseY < 435) {
            if (mouseX < uiX + 85) hoveredButton = ActionType.KNEEL;
            else hoveredButton = ActionType.OVERWATCH;
        } else if (mouseY >= 435 && mouseY < 480) {
            hoveredButton = ActionType.END_TURN;
        }
    }
}

function handleKeyDown(e) {
    keys[e.key.toLowerCase()] = true;

    if (gameState === GameState.TITLE) {
        startGame();
        return;
    }

    if (gameState !== GameState.PLAYER_TURN) return;

    // Number keys select soldiers
    if (e.key >= '1' && e.key <= '4') {
        const index = parseInt(e.key) - 1;
        if (soldiers[index] && soldiers[index].alive) {
            selectedSoldier = soldiers[index];
            centerOnSoldier(selectedSoldier);
        }
    }

    // Action hotkeys
    if (e.key.toLowerCase() === 'm') setAction(ActionType.MOVE);
    if (e.key.toLowerCase() === 's') setAction(ActionType.SHOOT_SNAP);
    if (e.key.toLowerCase() === 'a') setAction(ActionType.SHOOT_AIMED);
    if (e.key.toLowerCase() === 'b') setAction(ActionType.SHOOT_AUTO);
    if (e.key.toLowerCase() === 'k' && selectedSoldier) selectedSoldier.toggleKneel();
    if (e.key.toLowerCase() === 'o' && selectedSoldier) selectedSoldier.setOverwatch();
    if (e.key === 'Enter') startEnemyTurn();
    if (e.key === 'Escape') {
        if (currentAction !== ActionType.NONE) {
            currentAction = ActionType.NONE;
        } else {
            isPaused = !isPaused;
        }
    }

    // Tab cycles soldiers
    if (e.key === 'Tab') {
        e.preventDefault();
        cycleSoldier();
    }

    // Space centers on selected soldier
    if (e.key === ' ' && selectedSoldier) {
        e.preventDefault();
        centerOnSoldier(selectedSoldier);
    }
}

function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
}

function cycleSoldier() {
    const living = soldiers.filter(s => s.alive);
    if (living.length === 0) return;

    const currentIndex = living.indexOf(selectedSoldier);
    const nextIndex = (currentIndex + 1) % living.length;
    selectedSoldier = living[nextIndex];
    centerOnSoldier(selectedSoldier);
}

function centerOnSoldier(soldier) {
    camera.x = Math.max(0, Math.min(MAP_WIDTH - VIEW_WIDTH, soldier.x - VIEW_WIDTH / 2));
    camera.y = Math.max(0, Math.min(MAP_HEIGHT - VIEW_HEIGHT, soldier.y - VIEW_HEIGHT / 2));
}

// ============================================================================
// GAME LOOP
// ============================================================================

function startGame() {
    gameState = GameState.PLAYING;
    turn = 0;

    generateMap();
    spawnUnits();
    updateVisibility();
    initAmbientParticles();

    camera.x = 0;
    camera.y = 0;
    centerOnSoldier(soldiers[0]);

    startPlayerTurn();
}

function update(dt) {
    gameTime += dt * 1000;

    // Don't update game logic when paused
    if (isPaused) return;

    // Camera movement
    if (keys['w'] || keys['arrowup']) camera.y = Math.max(0, camera.y - 10 * dt);
    if (keys['s'] || keys['arrowdown']) camera.y = Math.min(MAP_HEIGHT - VIEW_HEIGHT, camera.y + 10 * dt);
    if (keys['a'] || keys['arrowleft']) camera.x = Math.max(0, camera.x - 10 * dt);
    if (keys['d'] || keys['arrowright']) camera.x = Math.min(MAP_WIDTH - VIEW_WIDTH, camera.x + 10 * dt);

    // Round camera position to prevent sub-pixel tile jitter
    camera.x = Math.round(camera.x);
    camera.y = Math.round(camera.y);

    // Update screen shake
    if (screenShake.duration > 0) {
        screenShake.duration -= dt * 1000;
        screenShake.intensity *= 0.95; // Decay
    }

    // Update turn announcement
    if (turnAnnouncement.timer > 0) {
        turnAnnouncement.timer -= dt * 1000;
    }

    updateAnimations(dt);
    updateParticles(dt);
    updateFloatingTexts(dt);
    updateMuzzleFlashes(dt);
    updateHitFlashes(dt);
    updateAmbientParticles(dt);

    if (gameState === GameState.ENEMY_TURN) {
        processEnemyTurn(dt);
    }
}

function gameLoop(timestamp) {
    const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// Setup
canvas.addEventListener('click', handleClick);
canvas.addEventListener('mousemove', handleMouseMove);
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Test harness
window.testHarness = {
    verifyHarness: function() {
        const checks = [
            { name: 'Canvas exists', passed: !!canvas, error: 'No canvas' },
            { name: 'Game running', passed: gameState !== undefined, error: 'No game state' },
            { name: 'Soldiers exist', passed: soldiers.length > 0, error: 'No soldiers' }
        ];
        return {
            allPassed: checks.every(c => c.passed),
            checks
        };
    },
    getVision: function() {
        return {
            scene: gameState,
            soldiers: soldiers.map(s => ({
                name: s.name,
                x: s.x,
                y: s.y,
                health: s.health,
                tu: s.tu,
                alive: s.alive
            })),
            aliens: aliens.filter(a => visibilityMap[a.y] && visibilityMap[a.y][a.x]).map(a => ({
                type: a.type,
                x: a.x,
                y: a.y,
                health: a.health,
                alive: a.alive
            })),
            turn,
            mapSize: { width: MAP_WIDTH, height: MAP_HEIGHT }
        };
    },
    step: function(params) {
        // Simulate actions
        return { success: true };
    }
};

// Initialize and start game loop (runs once at load)
lastTime = performance.now();
requestAnimationFrame(gameLoop);
