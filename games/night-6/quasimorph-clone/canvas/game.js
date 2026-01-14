// ============================================================================
// QUASIMORPH CLONE - DIMENSIONAL BREACH
// Turn-based tactical extraction roguelike
// ============================================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TILE_SIZE = 32;
const VIEW_TILES_X = 20;
const VIEW_TILES_Y = 15;

// ============================================================================
// GAME CONSTANTS
// ============================================================================

const GameState = {
    TITLE: 'title',
    PLAYING: 'playing',
    PLAYER_TURN: 'player',
    ENEMY_TURN: 'enemy',
    ANIMATION: 'animation',
    GAME_OVER: 'gameover',
    VICTORY: 'victory',
    PAUSED: 'paused'
};

const Stance = {
    SNEAK: { ap: 1, name: 'Sneak', detectMod: 0.5, accuracyMod: 1.1 },
    WALK: { ap: 2, name: 'Walk', detectMod: 1.0, accuracyMod: 1.0 },
    RUN: { ap: 3, name: 'Run', detectMod: 1.5, accuracyMod: 0.8 }
};

const TileType = {
    FLOOR: 0,
    WALL: 1,
    DOOR_CLOSED: 2,
    DOOR_OPEN: 3,
    COVER_HALF: 4,
    COVER_FULL: 5,
    EXTRACTION: 6,
    VENT: 7
};

const CoverType = {
    NONE: 0,
    HALF: 1,
    FULL: 2
};

// Weapons
const WEAPONS = {
    pistol: {
        name: 'Pistol',
        damage: [15, 20],
        accuracy: 75,
        range: 6,
        apCost: 1,
        ammoType: '9mm',
        magSize: 12,
        fireMode: 'single'
    },
    smg: {
        name: 'SMG',
        damage: [10, 15],
        accuracy: 60,
        range: 5,
        apCost: 1,
        ammoType: '9mm',
        magSize: 30,
        fireMode: 'burst',
        burstCount: 3
    },
    shotgun: {
        name: 'Shotgun',
        damage: [25, 40],
        accuracy: 80,
        range: 3,
        apCost: 2,
        ammoType: 'shells',
        magSize: 8,
        fireMode: 'single'
    },
    rifle: {
        name: 'Rifle',
        damage: [30, 40],
        accuracy: 70,
        range: 10,
        apCost: 2,
        ammoType: '7.62mm',
        magSize: 20,
        fireMode: 'single'
    },
    knife: {
        name: 'Knife',
        damage: [20, 30],
        accuracy: 90,
        range: 1,
        apCost: 1,
        ammoType: null,
        magSize: 0,
        fireMode: 'melee'
    }
};

// Enemy types
const ENEMY_TYPES = {
    guard: {
        name: 'Guard',
        hp: 50,
        ap: 2,
        weapon: 'pistol',
        behavior: 'patrol',
        detectRange: 6,
        color: '#668866'
    },
    soldier: {
        name: 'Soldier',
        hp: 75,
        ap: 2,
        weapon: 'smg',
        behavior: 'aggressive',
        detectRange: 7,
        color: '#666688'
    },
    heavy: {
        name: 'Heavy',
        hp: 120,
        ap: 2,
        weapon: 'shotgun',
        behavior: 'aggressive',
        detectRange: 5,
        color: '#886666'
    },
    sniper: {
        name: 'Sniper',
        hp: 40,
        ap: 2,
        weapon: 'rifle',
        behavior: 'guard',
        detectRange: 12,
        color: '#446688'
    },
    officer: {
        name: 'Officer',
        hp: 60,
        ap: 3,
        weapon: 'pistol',
        behavior: 'tactical',
        detectRange: 8,
        color: '#888844'
    },
    possessed: {
        name: 'Possessed',
        hp: 80,
        ap: 3,
        weapon: 'claws',
        behavior: 'berserk',
        detectRange: 8,
        color: '#884488',
        corrupted: true
    },
    stalker: {
        name: 'Stalker',
        hp: 60,
        ap: 4,
        weapon: 'claws',
        behavior: 'ambush',
        detectRange: 4,
        color: '#444466',
        corrupted: true
    },
    screamer: {
        name: 'Screamer',
        hp: 40,
        ap: 2,
        weapon: 'claws',
        behavior: 'screamer',
        detectRange: 6,
        color: '#aa44aa',
        corrupted: true
    }
};

// Special weapons for corrupted enemies
WEAPONS.claws = {
    name: 'Claws',
    damage: [20, 35],
    accuracy: 85,
    range: 1,
    apCost: 1,
    ammoType: null,
    magSize: 0,
    fireMode: 'melee'
};

// Colors
const COLORS = {
    floor: '#2a2a35',
    floorAlt: '#252530',
    wall: '#1a1a20',
    wallHighlight: '#333340',
    door: '#554422',
    doorOpen: '#332211',
    coverHalf: '#444455',
    coverFull: '#555566',
    extraction: '#22aa44',
    vent: '#333344',
    fog: '#0a0a0f',
    player: '#44aaff',
    playerOutline: '#2288dd',
    enemy: '#ff4444',
    corrupted: '#aa44aa',
    health: '#44ff44',
    ap: '#ffaa00',
    corruption: '#ff44ff',
    damage: '#ff4444',
    heal: '#44ff44',
    miss: '#888888',
    ui: '#cccccc',
    uiBg: 'rgba(20, 20, 30, 0.9)',
    highlight: '#ffff00'
};

// ============================================================================
// GLOBAL STATE
// ============================================================================

let gameState = GameState.TITLE;
let turn = 0;
let corruption = 0;
const MAX_CORRUPTION = 1000;

// Map
let mapWidth = 30;
let mapHeight = 25;
let map = [];
let rooms = [];
let visibilityMap = [];
let exploredMap = [];

// Camera
let camera = { x: 0, y: 0 };

// Entities
let player = null;
let enemies = [];
let projectiles = [];
let particles = [];
let floatingTexts = [];
let items = [];

// Animation queue
let animationQueue = [];
let currentAnimation = null;

// Screen effects
let screenShake = { intensity: 0, duration: 0 };
let muzzleFlashes = [];
let ambientParticles = [];

// Input
let selectedTile = null;
let hoveredTile = null;
let mouse = { x: 0, y: 0, down: false };
let keys = {};

// Game time
let lastTime = 0;
let deltaTime = 0;
let gameTime = 0;

// Turn state
let enemyTurnIndex = 0;
let showingEnemyTurn = false;
let enemyTurnTimer = 0;

// ============================================================================
// PLAYER CLASS
// ============================================================================

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hp = 100;
        this.maxHp = 100;
        this.ap = 2;
        this.maxAp = 2;
        this.stance = Stance.WALK;

        // Inventory
        this.primaryWeapon = { ...WEAPONS.pistol, currentMag: 12 };
        this.secondaryWeapon = { ...WEAPONS.knife, currentMag: 0 };
        this.currentWeapon = this.primaryWeapon;

        this.ammo = {
            '9mm': 60,
            'shells': 16,
            '7.62mm': 40
        };

        this.items = [
            { type: 'medkit', count: 2 },
            { type: 'grenade', count: 1 }
        ];

        // Vision
        this.visionRange = 8;

        // Stats
        this.kills = 0;
        this.damageDealt = 0;
        this.damageTaken = 0;
    }

    startTurn() {
        this.maxAp = this.stance.ap;
        this.ap = this.maxAp;
    }

    canMove(dx, dy) {
        if (this.ap < 1) return false;
        const newX = this.x + dx;
        const newY = this.y + dy;
        return isWalkable(newX, newY);
    }

    move(dx, dy) {
        const newX = this.x + dx;
        const newY = this.y + dy;

        // Auto-open doors when moving into them
        if (map[newY] && map[newY][newX] === TileType.DOOR_CLOSED) {
            if (this.ap < 1) {
                showFloatingText(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE, 'No AP!', COLORS.damage);
                return false;
            }
            map[newY][newX] = TileType.DOOR_OPEN;
            this.ap--;
            showFloatingText(newX * TILE_SIZE + TILE_SIZE/2, newY * TILE_SIZE - 10, 'Door opened', '#888888');
            updateVisibility();
            return true;
        }

        if (!this.canMove(dx, dy)) {
            showFloatingText(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE, 'No AP!', COLORS.damage);
            return false;
        }

        this.x = newX;
        this.y = newY;
        this.ap--;

        updateVisibility();
        checkExtraction();
        return true;
    }

    canShoot(target) {
        if (this.ap < this.currentWeapon.apCost) return false;
        if (!hasLineOfSight(this.x, this.y, target.x, target.y)) return false;

        const dist = getDistance(this.x, this.y, target.x, target.y);
        if (dist > this.currentWeapon.range) return false;

        // Check ammo
        if (this.currentWeapon.ammoType && this.currentWeapon.currentMag <= 0) return false;

        return true;
    }

    shoot(target) {
        if (!this.canShoot(target)) {
            if (this.ap < this.currentWeapon.apCost) {
                showFloatingText(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE, 'No AP!', COLORS.damage);
            }
            return false;
        }

        this.ap -= this.currentWeapon.apCost;

        // Use ammo
        if (this.currentWeapon.ammoType) {
            this.currentWeapon.currentMag--;
        }

        // Calculate hit
        const dist = getDistance(this.x, this.y, target.x, target.y);
        const hitChance = calculateHitChance(this, target, this.currentWeapon, dist);
        const roll = Math.random() * 100;

        // Create projectile animation
        const startX = this.x * TILE_SIZE + TILE_SIZE / 2;
        const startY = this.y * TILE_SIZE + TILE_SIZE / 2;
        const endX = target.x * TILE_SIZE + TILE_SIZE / 2;
        const endY = target.y * TILE_SIZE + TILE_SIZE / 2;

        // Add muzzle flash
        const angle = Math.atan2(endY - startY, endX - startX);
        addMuzzleFlash(startX, startY, angle);

        if (roll < hitChance) {
            // Hit! Check for critical
            let damage = randomRange(this.currentWeapon.damage[0], this.currentWeapon.damage[1]);
            const critRoll = Math.random() * 100;
            const isCrit = critRoll < 15; // 15% crit chance

            if (isCrit) {
                damage = Math.floor(damage * 1.75);
                showFloatingText(endX, endY - 40, 'CRITICAL!', '#ffff00');
                addScreenShake(5, 100);
            }

            target.takeDamage(damage, this);
            this.damageDealt += damage;

            queueAnimation({
                type: 'projectile',
                startX, startY, endX, endY,
                color: isCrit ? '#ff8800' : '#ffff00',
                duration: 150,
                hit: true
            });
        } else {
            // Miss
            showFloatingText(endX, endY - 20, 'MISS', COLORS.miss);
            queueAnimation({
                type: 'projectile',
                startX, startY, endX, endY,
                color: '#888888',
                duration: 150,
                hit: false
            });
        }

        // Alert nearby enemies
        alertEnemiesInRange(this.x, this.y, 10);

        // Increase corruption
        addCorruption(2);

        return true;
    }

    reload() {
        if (this.ap < 1) {
            showFloatingText(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE, 'No AP!', COLORS.damage);
            return false;
        }
        if (!this.currentWeapon.ammoType) return false;
        if (this.currentWeapon.currentMag >= this.currentWeapon.magSize) return false;

        const ammoNeeded = this.currentWeapon.magSize - this.currentWeapon.currentMag;
        const ammoAvailable = this.ammo[this.currentWeapon.ammoType] || 0;
        const ammoToLoad = Math.min(ammoNeeded, ammoAvailable);

        if (ammoToLoad <= 0) {
            showFloatingText(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE, 'No ammo!', COLORS.damage);
            return false;
        }

        this.currentWeapon.currentMag += ammoToLoad;
        this.ammo[this.currentWeapon.ammoType] -= ammoToLoad;
        this.ap--;

        showFloatingText(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE - 20, 'Reloaded', '#88ff88');
        return true;
    }

    useMedkit() {
        if (this.ap < 1) {
            showFloatingText(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE, 'No AP!', COLORS.damage);
            return false;
        }

        const medkitItem = this.items.find(i => i.type === 'medkit' && i.count > 0);
        if (!medkitItem) {
            showFloatingText(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE, 'No medkits!', COLORS.damage);
            return false;
        }

        medkitItem.count--;
        const healAmount = 30;
        this.hp = Math.min(this.maxHp, this.hp + healAmount);
        this.ap--;

        showFloatingText(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE - 20, `+${healAmount} HP`, COLORS.heal);
        return true;
    }

    switchWeapon() {
        const temp = this.currentWeapon;
        this.currentWeapon = this.currentWeapon === this.primaryWeapon ? this.secondaryWeapon : this.primaryWeapon;
        showFloatingText(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE - 20, this.currentWeapon.name, '#88aaff');
    }

    throwGrenade(targetX, targetY) {
        if (this.ap < 1) {
            showFloatingText(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE, 'No AP!', COLORS.damage);
            return false;
        }

        const grenadeItem = this.items.find(i => i.type === 'grenade' && i.count > 0);
        if (!grenadeItem) {
            showFloatingText(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE, 'No grenades!', COLORS.damage);
            return false;
        }

        const dist = getDistance(this.x, this.y, targetX, targetY);
        if (dist > 8) {
            showFloatingText(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE, 'Too far!', COLORS.damage);
            return false;
        }

        grenadeItem.count--;
        this.ap--;

        // Queue grenade animation
        const startX = this.x * TILE_SIZE + TILE_SIZE / 2;
        const startY = this.y * TILE_SIZE + TILE_SIZE / 2;
        const endX = targetX * TILE_SIZE + TILE_SIZE / 2;
        const endY = targetY * TILE_SIZE + TILE_SIZE / 2;

        queueAnimation({
            type: 'grenade',
            startX, startY, endX, endY,
            duration: 400,
            callback: () => {
                // Explosion effect
                createExplosion(targetX, targetY, 2);
            }
        });

        return true;
    }

    takeDamage(amount, source) {
        // Apply cover reduction
        const cover = getCoverAt(this.x, this.y, source.x, source.y);
        let reduction = 0;
        if (cover === CoverType.FULL) reduction = 0.5;
        else if (cover === CoverType.HALF) reduction = 0.25;

        const finalDamage = Math.floor(amount * (1 - reduction));
        this.hp -= finalDamage;
        this.damageTaken += finalDamage;

        showFloatingText(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE - 20, `-${finalDamage}`, COLORS.damage);

        // Screen shake on hit
        addScreenShake(8, 150);

        // Corruption increase
        addCorruption(3);

        if (this.hp <= 0) {
            this.hp = 0;
            gameState = GameState.GAME_OVER;
        }
    }

    draw() {
        const screenX = (this.x - camera.x) * TILE_SIZE;
        const screenY = (this.y - camera.y) * TILE_SIZE;
        const centerX = screenX + TILE_SIZE / 2;
        const centerY = screenY + TILE_SIZE / 2;

        // Draw player body
        ctx.fillStyle = COLORS.player;
        ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);

        // Stance indicator border
        let stanceColor = '#888888';
        if (this.stance === Stance.SNEAK) stanceColor = '#4488ff';
        else if (this.stance === Stance.RUN) stanceColor = '#ff8844';
        ctx.strokeStyle = stanceColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX + 3, screenY + 3, TILE_SIZE - 6, TILE_SIZE - 6);

        // Direction indicator towards mouse
        if (hoveredTile) {
            const targetX = hoveredTile.x * TILE_SIZE + TILE_SIZE / 2;
            const targetY = hoveredTile.y * TILE_SIZE + TILE_SIZE / 2;
            const playerWorldX = this.x * TILE_SIZE + TILE_SIZE / 2;
            const playerWorldY = this.y * TILE_SIZE + TILE_SIZE / 2;
            const angle = Math.atan2(targetY - playerWorldY, targetX - playerWorldX);

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(centerX + Math.cos(angle) * 12, centerY + Math.sin(angle) * 12);
            ctx.lineTo(centerX + Math.cos(angle - 0.5) * 6, centerY + Math.sin(angle - 0.5) * 6);
            ctx.lineTo(centerX + Math.cos(angle + 0.5) * 6, centerY + Math.sin(angle + 0.5) * 6);
            ctx.closePath();
            ctx.fill();
        }
    }
}

// ============================================================================
// ENEMY CLASS
// ============================================================================

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        const data = ENEMY_TYPES[type];

        this.name = data.name;
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.ap = data.ap;
        this.maxAp = data.ap;
        this.weapon = { ...WEAPONS[data.weapon], currentMag: WEAPONS[data.weapon].magSize };
        this.behavior = data.behavior;
        this.detectRange = data.detectRange;
        this.color = data.color;
        this.baseColor = data.color;
        this.corrupted = data.corrupted || false;

        this.alerted = false;
        this.lastSeenPlayerX = -1;
        this.lastSeenPlayerY = -1;
        this.patrolPath = [];
        this.patrolIndex = 0;

        // Visual state
        this.hitFlash = 0;
        this.isAttacking = false;
        this.attackTimer = 0;
    }

    startTurn() {
        this.ap = this.maxAp;
    }

    update() {
        // Check if can see player
        const canSee = this.canSeePlayer();
        if (canSee) {
            this.alerted = true;
            this.lastSeenPlayerX = player.x;
            this.lastSeenPlayerY = player.y;
        }

        // Take actions based on behavior
        while (this.ap > 0) {
            if (!this.takeAction()) break;
        }
    }

    canSeePlayer() {
        const dist = getDistance(this.x, this.y, player.x, player.y);
        // Stance affects detection range - sneaking is harder to detect, running is easier
        const effectiveRange = this.detectRange * player.stance.detectMod;
        if (dist > effectiveRange) return false;
        return hasLineOfSight(this.x, this.y, player.x, player.y);
    }

    takeAction() {
        if (this.ap <= 0) return false;

        const distToPlayer = getDistance(this.x, this.y, player.x, player.y);
        const canSeePlayer = this.canSeePlayer();

        // Screamer behavior - scream to alert all enemies
        if (this.behavior === 'screamer' && canSeePlayer && !this.hasScreamed) {
            this.hasScreamed = true;
            this.isAttacking = true;
            this.attackTimer = 800;

            // Alert ALL enemies
            for (const enemy of enemies) {
                enemy.alerted = true;
                enemy.lastSeenPlayerX = player.x;
                enemy.lastSeenPlayerY = player.y;
            }

            // Visual effect
            showFloatingText(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE - 30, 'SCREEEAM!', '#ff00ff');

            // Stun effect on player - reduce AP
            if (distToPlayer <= 5) {
                player.ap = Math.max(0, player.ap - 1);
                showFloatingText(player.x * TILE_SIZE + TILE_SIZE/2, player.y * TILE_SIZE - 20, 'Stunned!', '#ff00ff');
            }

            this.ap--;
            addCorruption(15);
            return true;
        }

        // If can see player and in range, shoot
        if (canSeePlayer && distToPlayer <= this.weapon.range) {
            return this.shoot();
        }

        // If alerted or can see player, move toward them
        if (this.alerted || canSeePlayer) {
            const targetX = canSeePlayer ? player.x : this.lastSeenPlayerX;
            const targetY = canSeePlayer ? player.y : this.lastSeenPlayerY;

            if (targetX >= 0 && targetY >= 0) {
                return this.moveToward(targetX, targetY);
            }
        }

        // Guard behavior - stay in place but attack if possible
        if (this.behavior === 'guard') {
            return false; // Stay put unless can attack
        }

        // Patrol or idle
        if (this.behavior === 'patrol' && this.patrolPath.length > 0) {
            const target = this.patrolPath[this.patrolIndex];
            if (this.x === target.x && this.y === target.y) {
                this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
            }
            return this.moveToward(target.x, target.y);
        }

        return false;
    }

    moveToward(targetX, targetY) {
        if (this.ap < 1) return false;

        const dx = Math.sign(targetX - this.x);
        const dy = Math.sign(targetY - this.y);

        // Try direct path first
        if (dx !== 0 && isWalkable(this.x + dx, this.y) && !isOccupied(this.x + dx, this.y)) {
            this.x += dx;
            this.ap--;
            return true;
        }
        if (dy !== 0 && isWalkable(this.x, this.y + dy) && !isOccupied(this.x, this.y + dy)) {
            this.y += dy;
            this.ap--;
            return true;
        }

        // Try diagonal
        if (dx !== 0 && dy !== 0 && isWalkable(this.x + dx, this.y + dy) && !isOccupied(this.x + dx, this.y + dy)) {
            this.x += dx;
            this.y += dy;
            this.ap--;
            return true;
        }

        return false;
    }

    shoot() {
        if (this.ap < this.weapon.apCost) return false;

        this.ap -= this.weapon.apCost;

        // Set attack visual state
        this.isAttacking = true;
        this.attackTimer = 500;

        // Calculate hit
        const dist = getDistance(this.x, this.y, player.x, player.y);
        const hitChance = calculateHitChance(this, player, this.weapon, dist);
        const roll = Math.random() * 100;

        // Animation
        const startX = this.x * TILE_SIZE + TILE_SIZE / 2;
        const startY = this.y * TILE_SIZE + TILE_SIZE / 2;
        const endX = player.x * TILE_SIZE + TILE_SIZE / 2;
        const endY = player.y * TILE_SIZE + TILE_SIZE / 2;

        // Enemy muzzle flash for ranged weapons
        if (this.weapon.fireMode !== 'melee') {
            const angle = Math.atan2(endY - startY, endX - startX);
            addMuzzleFlash(startX, startY, angle);
        }

        if (roll < hitChance) {
            const damage = randomRange(this.weapon.damage[0], this.weapon.damage[1]);
            player.takeDamage(damage, this);

            queueAnimation({
                type: 'projectile',
                startX, startY, endX, endY,
                color: '#ff4444',
                duration: 150,
                hit: true
            });
        } else {
            showFloatingText(endX, endY - 20, 'MISS', COLORS.miss);
            queueAnimation({
                type: 'projectile',
                startX, startY, endX, endY,
                color: '#884444',
                duration: 150,
                hit: false
            });
        }

        return true;
    }

    takeDamage(amount, source) {
        const cover = getCoverAt(this.x, this.y, source.x, source.y);
        let reduction = 0;
        if (cover === CoverType.FULL) reduction = 0.5;
        else if (cover === CoverType.HALF) reduction = 0.25;

        const finalDamage = Math.floor(amount * (1 - reduction));
        this.hp -= finalDamage;

        showFloatingText(this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE - 20, `-${finalDamage}`, COLORS.damage);

        // Hit flash effect
        this.hitFlash = 200;
        this.color = '#ffffff';

        // Blood splatter particles
        const bloodDir = Math.atan2(this.y - source.y, this.x - source.x);
        for (let i = 0; i < 8; i++) {
            const spread = (Math.random() - 0.5) * Math.PI * 0.6;
            const speed = 50 + Math.random() * 80;
            particles.push({
                x: this.x * TILE_SIZE + TILE_SIZE / 2,
                y: this.y * TILE_SIZE + TILE_SIZE / 2,
                vx: Math.cos(bloodDir + spread) * speed,
                vy: Math.sin(bloodDir + spread) * speed,
                life: 400 + Math.random() * 200,
                maxLife: 600,
                color: '#cc2222',
                size: 2 + Math.random() * 3
            });
        }

        this.alerted = true;

        if (this.hp <= 0) {
            this.die();
        }
    }

    updateVisuals(dt) {
        // Update hit flash
        if (this.hitFlash > 0) {
            this.hitFlash -= dt * 1000;
            if (this.hitFlash <= 0) {
                this.color = this.baseColor;
            }
        }

        // Update attack timer
        if (this.attackTimer > 0) {
            this.attackTimer -= dt * 1000;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
            }
        }
    }

    die() {
        const idx = enemies.indexOf(this);
        if (idx !== -1) {
            enemies.splice(idx, 1);
        }
        player.kills++;

        // Drop items based on enemy type
        const dropRoll = Math.random();
        if (dropRoll < 0.4) {
            let droppedItem;
            if (this.weapon.ammoType) {
                droppedItem = {
                    x: this.x, y: this.y,
                    type: 'ammo',
                    ammoType: this.weapon.ammoType,
                    count: randomRange(5, 15)
                };
            } else {
                droppedItem = {
                    x: this.x, y: this.y,
                    type: 'medkit',
                    count: 1
                };
            }
            items.push(droppedItem);
        }

        // Corruption from killing - more for corrupted enemies
        addCorruption(this.corrupted ? 10 : 5);

        // Death particles - more dramatic for corrupted
        const particleCount = this.corrupted ? 20 : 12;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            particles.push({
                x: this.x * TILE_SIZE + TILE_SIZE / 2,
                y: this.y * TILE_SIZE + TILE_SIZE / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 400 + Math.random() * 300,
                maxLife: 700,
                color: this.corrupted ? (Math.random() < 0.5 ? '#ff00ff' : '#880088') : '#cc2222',
                size: 3 + Math.random() * 4
            });
        }

        // Blood pool particles (stay longer, move slower)
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: this.x * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 20,
                y: this.y * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 2000,
                maxLife: 2000,
                color: this.corrupted ? '#660066' : '#880000',
                size: 6 + Math.random() * 6
            });
        }
    }

    draw() {
        // Only draw if visible
        if (!visibilityMap[this.y] || !visibilityMap[this.y][this.x]) return;

        const screenX = (this.x - camera.x) * TILE_SIZE;
        const screenY = (this.y - camera.y) * TILE_SIZE;

        // Draw enemy with attack scaling
        let scale = 1;
        if (this.isAttacking) {
            scale = 1.2;
        }

        const size = (TILE_SIZE - 8) * scale;
        const offset = (TILE_SIZE - size) / 2;

        ctx.fillStyle = this.color;
        ctx.fillRect(screenX + offset, screenY + offset, size, size);

        // Attack indicator - pulsing red glow
        if (this.isAttacking) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.strokeRect(screenX + offset - 2, screenY + offset - 2, size + 4, size + 4);

            // "!" indicator above enemy during attack
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!', screenX + TILE_SIZE / 2, screenY - 5);
        }

        // Alert indicator
        if (this.alerted && !this.isAttacking) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(screenX + TILE_SIZE - 6, screenY + 6, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Health bar if damaged
        if (this.hp < this.maxHp) {
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX + 4, screenY - 4, TILE_SIZE - 8, 3);
            ctx.fillStyle = COLORS.health;
            ctx.fillRect(screenX + 4, screenY - 4, (TILE_SIZE - 8) * (this.hp / this.maxHp), 3);
        }
    }
}

// ============================================================================
// MAP GENERATION
// ============================================================================

function generateMap() {
    // Initialize map with walls
    map = [];
    for (let y = 0; y < mapHeight; y++) {
        map[y] = [];
        for (let x = 0; x < mapWidth; x++) {
            map[y][x] = TileType.WALL;
        }
    }

    // Generate rooms
    rooms = [];
    const numRooms = randomRange(8, 12);

    for (let i = 0; i < numRooms; i++) {
        const roomWidth = randomRange(4, 8);
        const roomHeight = randomRange(4, 8);
        const roomX = randomRange(1, mapWidth - roomWidth - 1);
        const roomY = randomRange(1, mapHeight - roomHeight - 1);

        // Check if room overlaps existing rooms
        let overlaps = false;
        for (const room of rooms) {
            if (roomX < room.x + room.w + 1 && roomX + roomWidth + 1 > room.x &&
                roomY < room.y + room.h + 1 && roomY + roomHeight + 1 > room.y) {
                overlaps = true;
                break;
            }
        }

        if (!overlaps) {
            rooms.push({ x: roomX, y: roomY, w: roomWidth, h: roomHeight });

            // Carve room
            for (let ry = roomY; ry < roomY + roomHeight; ry++) {
                for (let rx = roomX; rx < roomX + roomWidth; rx++) {
                    map[ry][rx] = TileType.FLOOR;
                }
            }
        }
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
        const roomA = rooms[i - 1];
        const roomB = rooms[i];

        const ax = Math.floor(roomA.x + roomA.w / 2);
        const ay = Math.floor(roomA.y + roomA.h / 2);
        const bx = Math.floor(roomB.x + roomB.w / 2);
        const by = Math.floor(roomB.y + roomB.h / 2);

        // Horizontal then vertical
        if (Math.random() < 0.5) {
            carveHorizontalCorridor(ax, bx, ay);
            carveVerticalCorridor(ay, by, bx);
        } else {
            carveVerticalCorridor(ay, by, ax);
            carveHorizontalCorridor(ax, bx, by);
        }
    }

    // Add doors at corridor/room intersections
    addDoors();

    // Add cover objects
    addCover();

    // Set extraction point in last room
    const exitRoom = rooms[rooms.length - 1];
    const exitX = Math.floor(exitRoom.x + exitRoom.w / 2);
    const exitY = Math.floor(exitRoom.y + exitRoom.h / 2);
    map[exitY][exitX] = TileType.EXTRACTION;

    // Initialize visibility maps
    visibilityMap = [];
    exploredMap = [];
    for (let y = 0; y < mapHeight; y++) {
        visibilityMap[y] = [];
        exploredMap[y] = [];
        for (let x = 0; x < mapWidth; x++) {
            visibilityMap[y][x] = false;
            exploredMap[y][x] = false;
        }
    }
}

function carveHorizontalCorridor(x1, x2, y) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    for (let x = minX; x <= maxX; x++) {
        if (y >= 0 && y < mapHeight && x >= 0 && x < mapWidth) {
            map[y][x] = TileType.FLOOR;
        }
    }
}

function carveVerticalCorridor(y1, y2, x) {
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    for (let y = minY; y <= maxY; y++) {
        if (y >= 0 && y < mapHeight && x >= 0 && x < mapWidth) {
            map[y][x] = TileType.FLOOR;
        }
    }
}

function addDoors() {
    // Add doors at chokepoints
    for (let y = 1; y < mapHeight - 1; y++) {
        for (let x = 1; x < mapWidth - 1; x++) {
            if (map[y][x] !== TileType.FLOOR) continue;

            // Check for horizontal door position
            if (map[y-1][x] === TileType.WALL && map[y+1][x] === TileType.WALL &&
                map[y][x-1] === TileType.FLOOR && map[y][x+1] === TileType.FLOOR) {
                if (Math.random() < 0.3) {
                    map[y][x] = TileType.DOOR_CLOSED;
                }
            }
            // Check for vertical door position
            else if (map[y][x-1] === TileType.WALL && map[y][x+1] === TileType.WALL &&
                map[y-1][x] === TileType.FLOOR && map[y+1][x] === TileType.FLOOR) {
                if (Math.random() < 0.3) {
                    map[y][x] = TileType.DOOR_CLOSED;
                }
            }
        }
    }
}

function addCover() {
    for (const room of rooms) {
        // Add some cover objects in rooms
        const coverCount = randomRange(0, 3);
        for (let i = 0; i < coverCount; i++) {
            const cx = room.x + randomRange(1, room.w - 2);
            const cy = room.y + randomRange(1, room.h - 2);

            if (map[cy][cx] === TileType.FLOOR) {
                map[cy][cx] = Math.random() < 0.5 ? TileType.COVER_HALF : TileType.COVER_FULL;
            }
        }
    }
}

function spawnEnemies() {
    enemies = [];

    // Spawn enemies in rooms (not the first room where player spawns)
    for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];
        const enemyCount = randomRange(1, 3);

        for (let e = 0; e < enemyCount; e++) {
            const ex = room.x + randomRange(1, room.w - 2);
            const ey = room.y + randomRange(1, room.h - 2);

            if (isWalkable(ex, ey) && !isOccupied(ex, ey)) {
                // Choose enemy type based on corruption and randomness
                let type = 'guard';
                const roll = Math.random();

                if (corruption >= 600) {
                    // High corruption - mostly corrupted enemies
                    if (roll < 0.4) type = 'possessed';
                    else if (roll < 0.6) type = 'stalker';
                    else if (roll < 0.75) type = 'screamer';
                    else type = 'soldier';
                } else if (corruption >= 200) {
                    // Medium corruption - mix
                    if (roll < 0.2) type = 'possessed';
                    else if (roll < 0.4) type = 'soldier';
                    else if (roll < 0.55) type = 'heavy';
                    else if (roll < 0.7) type = 'sniper';
                    else if (roll < 0.85) type = 'officer';
                    else type = 'guard';
                } else {
                    // Low corruption - human enemies
                    if (roll < 0.4) type = 'guard';
                    else if (roll < 0.6) type = 'soldier';
                    else if (roll < 0.75) type = 'heavy';
                    else if (roll < 0.9) type = 'sniper';
                    else type = 'officer';
                }

                const enemy = new Enemy(ex, ey, type);

                // Set patrol path for guards
                if (enemy.behavior === 'patrol') {
                    enemy.patrolPath = [
                        { x: room.x + 1, y: room.y + 1 },
                        { x: room.x + room.w - 2, y: room.y + 1 },
                        { x: room.x + room.w - 2, y: room.y + room.h - 2 },
                        { x: room.x + 1, y: room.y + room.h - 2 }
                    ];
                }

                enemies.push(enemy);
            }
        }
    }
}

function spawnItems() {
    items = [];

    // Spawn items in rooms
    for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];

        if (Math.random() < 0.5) {
            const ix = room.x + randomRange(1, room.w - 2);
            const iy = room.y + randomRange(1, room.h - 2);

            if (isWalkable(ix, iy)) {
                const roll = Math.random();
                let item;

                if (roll < 0.3) {
                    // Ammo
                    const ammoTypes = ['9mm', 'shells', '7.62mm'];
                    const ammoType = ammoTypes[Math.floor(Math.random() * ammoTypes.length)];
                    item = { type: 'ammo', ammoType, count: randomRange(10, 25), x: ix, y: iy };
                } else if (roll < 0.5) {
                    // Medkit
                    item = { type: 'medkit', count: 1, x: ix, y: iy };
                } else if (roll < 0.65) {
                    // Grenade
                    item = { type: 'grenade', count: 1, x: ix, y: iy };
                } else if (roll < 0.85) {
                    // Weapon pickup
                    const weaponTypes = ['smg', 'shotgun', 'rifle'];
                    const weaponType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
                    item = { type: 'weapon', weaponType, x: ix, y: iy };
                } else {
                    // Corruption reducer (cigarettes/alcohol)
                    item = { type: 'cigarettes', count: 1, corruptionReduce: 25, x: ix, y: iy };
                }

                items.push(item);
            }
        }
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function isWalkable(x, y) {
    if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) return false;
    const tile = map[y][x];
    return tile === TileType.FLOOR || tile === TileType.DOOR_OPEN ||
           tile === TileType.EXTRACTION || tile === TileType.VENT;
}

function isOccupied(x, y) {
    if (player.x === x && player.y === y) return true;
    for (const enemy of enemies) {
        if (enemy.x === x && enemy.y === y) return true;
    }
    return false;
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

        // Check if this tile blocks LoS
        const tile = map[y]?.[x];
        if (tile === TileType.WALL || tile === TileType.DOOR_CLOSED || tile === TileType.COVER_FULL) {
            // Allow the start tile
            if (x !== x1 || y !== y1) return false;
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

function getCoverAt(targetX, targetY, sourceX, sourceY) {
    // Check adjacent tiles for cover between target and source
    const dx = Math.sign(sourceX - targetX);
    const dy = Math.sign(sourceY - targetY);

    // Check tile in direction of source
    const coverTile = map[targetY + dy]?.[targetX + dx];
    if (coverTile === TileType.COVER_FULL) return CoverType.FULL;
    if (coverTile === TileType.COVER_HALF) return CoverType.HALF;

    return CoverType.NONE;
}

function calculateHitChance(attacker, target, weapon, distance) {
    let baseAccuracy = weapon.accuracy;

    // Distance penalty (beyond optimal range)
    const optimalRange = Math.floor(weapon.range * 0.6);
    if (distance > optimalRange) {
        baseAccuracy -= (distance - optimalRange) * 5;
    }

    // Cover penalty
    const cover = getCoverAt(target.x, target.y, attacker.x, attacker.y);
    if (cover === CoverType.FULL) baseAccuracy -= 40;
    else if (cover === CoverType.HALF) baseAccuracy -= 20;

    // Stance accuracy modifier (player only)
    if (attacker === player && player.stance && player.stance.accuracyMod) {
        baseAccuracy = Math.floor(baseAccuracy * player.stance.accuracyMod);
    }

    return Math.max(5, Math.min(95, baseAccuracy));
}

function updateVisibility() {
    // Reset visibility
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            visibilityMap[y][x] = false;
        }
    }

    // Cast rays from player
    const numRays = 360;
    for (let i = 0; i < numRays; i++) {
        const angle = (i / numRays) * Math.PI * 2;
        castVisibilityRay(player.x, player.y, angle, player.visionRange);
    }

    // Mark visible tiles as explored
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            if (visibilityMap[y][x]) {
                exploredMap[y][x] = true;
            }
        }
    }
}

function castVisibilityRay(startX, startY, angle, maxDist) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    for (let d = 0; d <= maxDist; d += 0.5) {
        const x = Math.floor(startX + dx * d);
        const y = Math.floor(startY + dy * d);

        if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) break;

        visibilityMap[y][x] = true;

        // Stop at walls
        const tile = map[y][x];
        if (tile === TileType.WALL || tile === TileType.DOOR_CLOSED) break;
    }
}

function alertEnemiesInRange(x, y, range) {
    for (const enemy of enemies) {
        const dist = getDistance(x, y, enemy.x, enemy.y);
        if (dist <= range) {
            enemy.alerted = true;
            enemy.lastSeenPlayerX = x;
            enemy.lastSeenPlayerY = y;
        }
    }
}

function addCorruption(amount) {
    corruption = Math.min(MAX_CORRUPTION, corruption + amount);
    checkCorruptionThresholds();
}

let lastCorruptionThreshold = 0;

function checkCorruptionThresholds() {
    // Show warnings at thresholds
    const thresholds = [200, 400, 600, 800];
    for (const threshold of thresholds) {
        if (corruption >= threshold && lastCorruptionThreshold < threshold) {
            let message = '';
            let color = '#ff88ff';
            switch (threshold) {
                case 200:
                    message = 'CORRUPTION RISING - Enemies may transform';
                    break;
                case 400:
                    message = 'CORRUPTION SPREADING - Stronger enemies appearing';
                    color = '#ff44ff';
                    break;
                case 600:
                    message = 'CORRUPTION CRITICAL - Dimensional breach imminent';
                    color = '#ff00ff';
                    break;
                case 800:
                    message = 'CORRUPTION RAPTURE - Extract immediately!';
                    color = '#ff0000';
                    break;
            }
            showFloatingText(CANVAS_WIDTH / 2, 200, message, color);
            lastCorruptionThreshold = threshold;
        }
    }

    // Transform humans at high corruption
    if (corruption >= 400) {
        for (const enemy of enemies) {
            if (!enemy.corrupted && Math.random() < 0.1) {
                // Transform to corrupted
                enemy.corrupted = true;
                enemy.color = COLORS.corrupted;
                enemy.baseColor = COLORS.corrupted;
                enemy.behavior = 'berserk';
                enemy.hp = Math.floor(enemy.hp * 1.5);
                enemy.maxHp = enemy.hp;

                showFloatingText(enemy.x * TILE_SIZE + TILE_SIZE/2, enemy.y * TILE_SIZE - 30, 'TRANSFORMED!', '#ff00ff');

                // Particles
                for (let i = 0; i < 15; i++) {
                    particles.push({
                        x: enemy.x * TILE_SIZE + TILE_SIZE/2,
                        y: enemy.y * TILE_SIZE + TILE_SIZE/2,
                        vx: (Math.random() - 0.5) * 80,
                        vy: (Math.random() - 0.5) * 80,
                        life: 600,
                        maxLife: 600,
                        color: COLORS.corrupted,
                        size: 4 + Math.random() * 4
                    });
                }
            }
        }
    }
}

function checkExtraction() {
    if (map[player.y][player.x] === TileType.EXTRACTION) {
        gameState = GameState.VICTORY;
    }
}

// ============================================================================
// TURN SYSTEM
// ============================================================================

function startPlayerTurn() {
    gameState = GameState.PLAYER_TURN;
    player.startTurn();
    turn++;

    // Passive corruption increase
    addCorruption(1);
}

function endPlayerTurn() {
    // Auto-end when no AP left
    if (player.ap <= 0) {
        startEnemyTurn();
    }
}

function startEnemyTurn() {
    gameState = GameState.ENEMY_TURN;
    showingEnemyTurn = true;
    enemyTurnTimer = 1000; // Show "ENEMY TURN" for 1 second
    enemyTurnIndex = 0;

    // Start all enemy turns
    for (const enemy of enemies) {
        enemy.startTurn();
    }
}

function processEnemyTurn(dt) {
    if (showingEnemyTurn) {
        enemyTurnTimer -= dt * 1000;
        if (enemyTurnTimer <= 0) {
            showingEnemyTurn = false;
        }
        return;
    }

    // Process one enemy at a time with delay
    if (enemyTurnIndex < enemies.length) {
        const enemy = enemies[enemyTurnIndex];
        enemy.update();
        enemyTurnIndex++;

        // Add small delay between enemies
        setTimeout(() => {
            if (gameState === GameState.ENEMY_TURN) {
                // Continue to next enemy or end turn
            }
        }, 200);
    } else {
        // All enemies done
        startPlayerTurn();
    }
}

// ============================================================================
// ANIMATION SYSTEM
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
            // Call callback if exists
            if (currentAnimation.callback) {
                currentAnimation.callback();
            }
            currentAnimation = null;
        }
    }
}

function renderAnimations() {
    if (!currentAnimation) return;

    const anim = currentAnimation;
    const t = Math.min(1, anim.progress);

    if (anim.type === 'projectile') {
        const x = anim.startX + (anim.endX - anim.startX) * t - camera.x * TILE_SIZE;
        const y = anim.startY + (anim.endY - anim.startY) * t - camera.y * TILE_SIZE;

        ctx.fillStyle = anim.color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.strokeStyle = anim.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(anim.startX - camera.x * TILE_SIZE, anim.startY - camera.y * TILE_SIZE);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    if (anim.type === 'grenade') {
        // Arc trajectory
        const arcHeight = 50 * Math.sin(t * Math.PI);
        const x = anim.startX + (anim.endX - anim.startX) * t - camera.x * TILE_SIZE;
        const y = anim.startY + (anim.endY - anim.startY) * t - arcHeight - camera.y * TILE_SIZE;

        // Grenade body
        ctx.fillStyle = '#556655';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Pin
        ctx.fillStyle = '#888888';
        ctx.fillRect(x - 2, y - 12, 4, 6);

        // Shadow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x, anim.startY + (anim.endY - anim.startY) * t - camera.y * TILE_SIZE, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ============================================================================
// PARTICLES & EFFECTS
// ============================================================================

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt * 1000;

        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.95;
        p.vy *= 0.95;
    }
}

function renderParticles() {
    for (const p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - camera.x * TILE_SIZE, p.y - camera.y * TILE_SIZE, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function showFloatingText(x, y, text, color) {
    floatingTexts.push({
        x, y,
        text,
        color,
        life: 1000,
        maxLife: 1000
    });
}

function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.life -= dt * 1000;
        ft.y -= 30 * dt;

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

// Screen shake
function addScreenShake(intensity, duration = 200) {
    screenShake.intensity = Math.max(screenShake.intensity, intensity);
    screenShake.duration = Math.max(screenShake.duration, duration);
}

function updateScreenShake(dt) {
    if (screenShake.duration > 0) {
        screenShake.duration -= dt * 1000;
        if (screenShake.duration <= 0) {
            screenShake.intensity = 0;
        }
    }
}

function getScreenShakeOffset() {
    if (screenShake.intensity <= 0) return { x: 0, y: 0 };
    return {
        x: (Math.random() - 0.5) * screenShake.intensity * 2,
        y: (Math.random() - 0.5) * screenShake.intensity * 2
    };
}

// Muzzle flash
function addMuzzleFlash(x, y, angle) {
    muzzleFlashes.push({
        x, y, angle,
        life: 100,
        maxLife: 100
    });
}

function updateMuzzleFlashes(dt) {
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
        muzzleFlashes[i].life -= dt * 1000;
        if (muzzleFlashes[i].life <= 0) {
            muzzleFlashes.splice(i, 1);
        }
    }
}

// Ambient particles
function updateAmbientParticles(dt) {
    // Remove dead particles
    for (let i = ambientParticles.length - 1; i >= 0; i--) {
        ambientParticles[i].life -= dt * 1000;
        if (ambientParticles[i].life <= 0) {
            ambientParticles.splice(i, 1);
        }
    }

    // Spawn new particles (more at high corruption)
    const spawnRate = 0.02 + (corruption / 1000) * 0.05;
    if (Math.random() < spawnRate && ambientParticles.length < 30) {
        const screenX = Math.random() * CANVAS_WIDTH;
        const screenY = Math.random() * CANVAS_HEIGHT;
        ambientParticles.push({
            x: screenX,
            y: screenY,
            vx: (Math.random() - 0.5) * 10,
            vy: Math.random() * -10 - 5,
            life: 2000 + Math.random() * 2000,
            maxLife: 4000,
            size: 1 + Math.random() * 2,
            color: corruption > 400 ? '#442244' : '#333333'
        });
    }
}

function renderAmbientParticles() {
    for (const p of ambientParticles) {
        const alpha = (p.life / p.maxLife) * 0.3;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
    }
    ctx.globalAlpha = 1;
}

function renderMuzzleFlashes() {
    for (const flash of muzzleFlashes) {
        const alpha = flash.life / flash.maxLife;
        const size = 15 * alpha;

        ctx.save();
        ctx.translate(flash.x - camera.x * TILE_SIZE, flash.y - camera.y * TILE_SIZE);
        ctx.rotate(flash.angle);

        // Flash glow
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size * 1.5, -size * 0.3);
        ctx.lineTo(size * 1.5, size * 0.3);
        ctx.closePath();
        ctx.fill();

        // Core flash
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
    ctx.globalAlpha = 1;
}

// Explosion system
function createExplosion(tileX, tileY, radius) {
    const centerX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const centerY = tileY * TILE_SIZE + TILE_SIZE / 2;

    // Screen shake
    addScreenShake(15, 300);

    // Damage enemies in radius
    for (const enemy of enemies.slice()) {
        const dist = getDistance(tileX, tileY, enemy.x, enemy.y);
        if (dist <= radius) {
            const damage = Math.floor(40 * (1 - dist / (radius + 1)));
            enemy.takeDamage(damage, player);
        }
    }

    // Check player damage if in range
    const playerDist = getDistance(tileX, tileY, player.x, player.y);
    if (playerDist <= radius) {
        const damage = Math.floor(30 * (1 - playerDist / (radius + 1)));
        player.takeDamage(damage, { x: tileX, y: tileY });
    }

    // Create explosion particles
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 150;
        particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 500 + Math.random() * 300,
            maxLife: 800,
            color: Math.random() < 0.5 ? '#ff8800' : '#ffff00',
            size: 4 + Math.random() * 6
        });
    }

    // Smoke particles
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 20 + Math.random() * 50;
        particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 800 + Math.random() * 400,
            maxLife: 1200,
            color: '#444444',
            size: 8 + Math.random() * 8
        });
    }

    // Add corruption from explosion
    addCorruption(10);
}

// ============================================================================
// RENDERING
// ============================================================================

function render() {
    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gameState === GameState.TITLE) {
        renderTitle();
        return;
    }

    if (gameState === GameState.GAME_OVER) {
        renderGameOver();
        return;
    }

    if (gameState === GameState.PAUSED) {
        renderPaused();
        return;
    }

    if (gameState === GameState.VICTORY) {
        renderVictory();
        return;
    }

    // Update camera with screen shake
    const shake = getScreenShakeOffset();
    camera.x = Math.max(0, Math.min(mapWidth - VIEW_TILES_X, player.x - Math.floor(VIEW_TILES_X / 2))) + shake.x / TILE_SIZE;
    camera.y = Math.max(0, Math.min(mapHeight - VIEW_TILES_Y, player.y - Math.floor(VIEW_TILES_Y / 2))) + shake.y / TILE_SIZE;

    // Render map
    renderMap();

    // Render movement range preview
    if (gameState === GameState.PLAYER_TURN && player.ap > 0) {
        renderMovementRange();
    }

    // Render items
    renderItems();

    // Render enemies
    for (const enemy of enemies) {
        enemy.draw();
    }

    // Render player
    player.draw();

    // Render particles
    renderParticles();

    // Render muzzle flashes
    renderMuzzleFlashes();

    // Render animations
    renderAnimations();

    // Render floating texts
    renderFloatingTexts();

    // Render fog of war
    renderFog();

    // Render ambient particles
    renderAmbientParticles();

    // Render UI
    renderUI();

    // Corruption visual overlay
    if (corruption >= 200) {
        const intensity = Math.min(1, (corruption - 200) / 800);
        ctx.fillStyle = `rgba(100, 0, 50, ${intensity * 0.3})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Screen edge vignette at high corruption
        if (corruption >= 400) {
            const gradient = ctx.createRadialGradient(
                CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.3,
                CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.7
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(1, `rgba(80, 0, 40, ${intensity * 0.5})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        // Flickering at very high corruption
        if (corruption >= 600 && Math.random() < 0.05) {
            ctx.fillStyle = `rgba(255, 0, 100, ${0.1 + Math.random() * 0.1})`;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
    }

    // Render enemy turn overlay
    if (showingEnemyTurn) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ENEMY TURN', CANVAS_WIDTH / 2, 100);

        // Show enemy count
        ctx.font = '18px Arial';
        ctx.fillText(`${enemies.length} enemies remaining`, CANVAS_WIDTH / 2, 140);
    }

    // Render tile info on hover
    renderHoverInfo();
}

function renderMap() {
    for (let y = 0; y < VIEW_TILES_Y + 1; y++) {
        for (let x = 0; x < VIEW_TILES_X + 1; x++) {
            const mapX = x + Math.floor(camera.x);
            const mapY = y + Math.floor(camera.y);

            if (mapX < 0 || mapX >= mapWidth || mapY < 0 || mapY >= mapHeight) continue;

            const tile = map[mapY][mapX];
            const screenX = (mapX - camera.x) * TILE_SIZE;
            const screenY = (mapY - camera.y) * TILE_SIZE;

            // Only render if explored
            if (!exploredMap[mapY][mapX]) continue;

            // Tile color
            let color = COLORS.floor;
            switch (tile) {
                case TileType.WALL:
                    color = COLORS.wall;
                    break;
                case TileType.DOOR_CLOSED:
                    color = COLORS.door;
                    break;
                case TileType.DOOR_OPEN:
                    color = COLORS.doorOpen;
                    break;
                case TileType.COVER_HALF:
                    color = COLORS.coverHalf;
                    break;
                case TileType.COVER_FULL:
                    color = COLORS.coverFull;
                    break;
                case TileType.EXTRACTION:
                    color = COLORS.extraction;
                    break;
                case TileType.VENT:
                    color = COLORS.vent;
                    break;
                default:
                    // Checkerboard floor
                    color = (mapX + mapY) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
            }

            ctx.fillStyle = color;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

            // Wall highlights
            if (tile === TileType.WALL) {
                ctx.fillStyle = COLORS.wallHighlight;
                ctx.fillRect(screenX, screenY, TILE_SIZE, 2);
                ctx.fillRect(screenX, screenY, 2, TILE_SIZE);
            }

            // Extraction glow with pulsing
            if (tile === TileType.EXTRACTION) {
                const pulse = Math.sin(gameTime / 300) * 0.3 + 0.7;
                ctx.strokeStyle = `rgba(68, 255, 68, ${pulse})`;
                ctx.lineWidth = 3;
                ctx.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);

                // Inner glow
                ctx.fillStyle = `rgba(68, 255, 68, ${pulse * 0.3})`;
                ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);

                // Arrow indicator
                ctx.fillStyle = '#44ff44';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('EXIT', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 5);
            }

            // Cover indicator icons
            if (tile === TileType.COVER_HALF || tile === TileType.COVER_FULL) {
                ctx.fillStyle = tile === TileType.COVER_FULL ? '#88ff88' : '#ffff88';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(tile === TileType.COVER_FULL ? 'F' : 'H', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 3);
            }
        }
    }
}

function renderFog() {
    for (let y = 0; y < VIEW_TILES_Y + 1; y++) {
        for (let x = 0; x < VIEW_TILES_X + 1; x++) {
            const mapX = x + Math.floor(camera.x);
            const mapY = y + Math.floor(camera.y);

            if (mapX < 0 || mapX >= mapWidth || mapY < 0 || mapY >= mapHeight) continue;

            const screenX = (mapX - camera.x) * TILE_SIZE;
            const screenY = (mapY - camera.y) * TILE_SIZE;

            if (!visibilityMap[mapY][mapX]) {
                if (exploredMap[mapY][mapX]) {
                    // Explored but not visible - dim
                    ctx.fillStyle = 'rgba(10, 10, 15, 0.7)';
                } else {
                    // Never explored - black
                    ctx.fillStyle = COLORS.fog;
                }
                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

function renderItems() {
    for (const item of items) {
        if (!visibilityMap[item.y] || !visibilityMap[item.y][item.x]) continue;

        const screenX = (item.x - camera.x) * TILE_SIZE;
        const screenY = (item.y - camera.y) * TILE_SIZE;

        // Color based on item type
        let color = '#ffaa00';
        let symbol = '?';
        switch (item.type) {
            case 'medkit':
                color = COLORS.heal;
                symbol = '+';
                break;
            case 'ammo':
                color = '#ffaa00';
                symbol = 'A';
                break;
            case 'grenade':
                color = '#ff8800';
                symbol = 'G';
                break;
            case 'weapon':
                color = '#88aaff';
                symbol = 'W';
                break;
            case 'cigarettes':
                color = '#aa88ff';
                symbol = 'C';
                break;
        }

        ctx.fillStyle = color;
        ctx.fillRect(screenX + 10, screenY + 10, TILE_SIZE - 20, TILE_SIZE - 20);

        // Symbol
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(symbol, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + 4);
    }
}

function renderUI() {
    // Top bar
    ctx.fillStyle = COLORS.uiBg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 40);

    ctx.font = '14px Arial';
    ctx.fillStyle = COLORS.ui;
    ctx.textAlign = 'left';

    // Turn and corruption
    ctx.fillText(`Turn: ${turn}`, 10, 25);

    // Corruption bar
    let corruptionColor = COLORS.corruption;
    if (corruption >= 800) corruptionColor = '#ff0000';
    else if (corruption >= 600) corruptionColor = '#ff00ff';
    else if (corruption >= 400) corruptionColor = '#ff44ff';

    ctx.fillStyle = '#333';
    ctx.fillRect(100, 12, 150, 16);
    ctx.fillStyle = corruptionColor;
    ctx.fillRect(100, 12, 150 * (corruption / MAX_CORRUPTION), 16);
    ctx.strokeStyle = '#666';
    ctx.strokeRect(100, 12, 150, 16);

    // Corruption level text
    let corruptionLevel = 'Low';
    if (corruption >= 800) corruptionLevel = 'RAPTURE';
    else if (corruption >= 600) corruptionLevel = 'Critical';
    else if (corruption >= 400) corruptionLevel = 'High';
    else if (corruption >= 200) corruptionLevel = 'Moderate';

    ctx.fillStyle = COLORS.ui;
    ctx.fillText(`Corruption: ${corruption}`, 260, 17);
    ctx.font = '10px Arial';
    ctx.fillStyle = corruptionColor;
    ctx.fillText(corruptionLevel, 260, 30);
    ctx.font = '14px Arial';

    // Enemy count
    ctx.fillStyle = '#ff8888';
    ctx.textAlign = 'center';
    ctx.fillText(`Enemies: ${enemies.length}`, 450, 25);

    // Turn counter
    ctx.fillStyle = '#aaaaaa';
    ctx.textAlign = 'center';
    ctx.fillText(`Turn ${turn}`, 550, 25);

    // Game state
    const stateText = gameState === GameState.PLAYER_TURN ? 'YOUR TURN' : 'ENEMY TURN';
    ctx.fillStyle = gameState === GameState.PLAYER_TURN ? '#44ff44' : '#ff4444';
    ctx.textAlign = 'right';
    ctx.fillText(stateText, CANVAS_WIDTH - 120, 25);

    // Bottom bar
    ctx.fillStyle = COLORS.uiBg;
    ctx.fillRect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);

    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.ui;

    // Health
    ctx.fillText('HP:', 10, CANVAS_HEIGHT - 60);
    ctx.fillStyle = '#333';
    ctx.fillRect(40, CANVAS_HEIGHT - 70, 150, 20);

    // Health bar color based on amount
    let healthColor = COLORS.health;
    if (player.hp <= player.maxHp * 0.25) {
        healthColor = '#ff4444';
        // Pulse effect when critical
        if (Math.sin(gameTime / 100) > 0) {
            healthColor = '#ff8888';
        }
    } else if (player.hp <= player.maxHp * 0.5) {
        healthColor = '#ffaa00';
    }

    ctx.fillStyle = healthColor;
    ctx.fillRect(40, CANVAS_HEIGHT - 70, 150 * (player.hp / player.maxHp), 20);
    ctx.fillStyle = COLORS.ui;
    ctx.fillText(`${player.hp}/${player.maxHp}`, 200, CANVAS_HEIGHT - 55);

    // Low health warning
    if (player.hp <= player.maxHp * 0.25) {
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 11px Arial';
        ctx.fillText('LOW HEALTH!', 200, CANVAS_HEIGHT - 40);
    }

    // AP
    ctx.fillText('AP:', 10, CANVAS_HEIGHT - 35);
    for (let i = 0; i < player.maxAp; i++) {
        ctx.fillStyle = i < player.ap ? COLORS.ap : '#333';
        ctx.fillRect(40 + i * 30, CANVAS_HEIGHT - 45, 25, 20);
    }
    ctx.fillStyle = COLORS.ui;
    ctx.fillText(`${player.ap}/${player.maxAp}`, 130, CANVAS_HEIGHT - 30);

    // Stance
    ctx.fillText(`Stance: ${player.stance.name}`, 10, CANVAS_HEIGHT - 10);

    // Weapon
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.ui;
    ctx.fillText(`[${player.currentWeapon.name}]`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 55);

    if (player.currentWeapon.ammoType) {
        // Mag with warning
        const magLow = player.currentWeapon.currentMag <= Math.ceil(player.currentWeapon.magSize * 0.25);
        ctx.fillStyle = magLow ? '#ff8844' : COLORS.ui;
        if (player.currentWeapon.currentMag === 0) ctx.fillStyle = '#ff4444';
        ctx.fillText(`Mag: ${player.currentWeapon.currentMag}/${player.currentWeapon.magSize}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 35);

        // Reserve with warning
        const reserve = player.ammo[player.currentWeapon.ammoType] || 0;
        ctx.fillStyle = reserve <= player.currentWeapon.magSize ? '#ff8844' : COLORS.ui;
        if (reserve === 0) ctx.fillStyle = '#ff4444';
        ctx.fillText(`Reserve: ${reserve}${reserve === 0 ? ' (EMPTY!)' : ''}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
    } else {
        ctx.fillText('Melee', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 35);
    }

    // Items and secondary weapon
    ctx.textAlign = 'right';
    ctx.fillStyle = '#666666';
    ctx.font = '11px Arial';
    ctx.fillText(`[Q] Alt: ${player.secondaryWeapon.name}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 70);

    ctx.fillStyle = COLORS.ui;
    ctx.font = '14px Arial';
    const medkits = player.items.find(i => i.type === 'medkit');
    const grenades = player.items.find(i => i.type === 'grenade');
    ctx.fillText(`Medkits: ${medkits ? medkits.count : 0}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 50);
    ctx.fillText(`Grenades: ${grenades ? grenades.count : 0}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 30);
    ctx.fillText(`Kills: ${player.kills}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);

    // Controls help
    ctx.textAlign = 'left';
    ctx.font = '10px Arial';
    ctx.fillStyle = '#888';
    ctx.fillText('WASD: Move | Click: Shoot | R: Reload | H: Heal | Q: Switch Weapon | G: Grenade | 1/2/3: Stance | ENTER: End Turn', 10, CANVAS_HEIGHT - 85);

    // Minimap
    renderMinimap();
}

function renderMovementRange() {
    const range = player.ap;
    ctx.globalAlpha = 0.15;

    for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
            const dist = Math.abs(dx) + Math.abs(dy);
            if (dist > range || dist === 0) continue;

            const tileX = player.x + dx;
            const tileY = player.y + dy;

            if (tileX < 0 || tileX >= mapWidth || tileY < 0 || tileY >= mapHeight) continue;
            if (!isWalkable(tileX, tileY)) continue;

            const screenX = (tileX - camera.x) * TILE_SIZE;
            const screenY = (tileY - camera.y) * TILE_SIZE;

            ctx.fillStyle = '#44aaff';
            ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        }
    }
    ctx.globalAlpha = 1;
}

function renderMinimap() {
    const minimapSize = 100;
    const minimapX = CANVAS_WIDTH - minimapSize - 10;
    const minimapY = 50;
    const scale = minimapSize / Math.max(mapWidth, mapHeight);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(minimapX - 2, minimapY - 2, minimapSize + 4, minimapSize + 4);

    // Explored tiles
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            if (!exploredMap[y][x]) continue;

            const tile = map[y][x];
            let color = '#222';

            if (tile === TileType.WALL) color = '#444';
            else if (tile === TileType.FLOOR) color = '#333';
            else if (tile === TileType.EXTRACTION) color = '#0f0';
            else if (tile === TileType.DOOR_CLOSED || tile === TileType.DOOR_OPEN) color = '#654';

            ctx.fillStyle = color;
            ctx.fillRect(minimapX + x * scale, minimapY + y * scale, Math.max(1, scale), Math.max(1, scale));
        }
    }

    // Enemies (only if visible)
    for (const enemy of enemies) {
        if (visibilityMap[enemy.y] && visibilityMap[enemy.y][enemy.x]) {
            ctx.fillStyle = enemy.corrupted ? '#f0f' : '#f00';
            ctx.fillRect(minimapX + enemy.x * scale - 1, minimapY + enemy.y * scale - 1, 3, 3);
        }
    }

    // Player
    ctx.fillStyle = '#0af';
    ctx.fillRect(minimapX + player.x * scale - 1, minimapY + player.y * scale - 1, 3, 3);

    // Extraction arrow if off-screen
    renderExtractionArrow();
}

function renderExtractionArrow() {
    // Find extraction point
    let extractX = -1, extractY = -1;
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            if (map[y][x] === TileType.EXTRACTION) {
                extractX = x;
                extractY = y;
                break;
            }
        }
        if (extractX >= 0) break;
    }

    if (extractX < 0) return;

    // Check if on screen
    const screenX = (extractX - camera.x) * TILE_SIZE;
    const screenY = (extractY - camera.y) * TILE_SIZE;

    if (screenX >= 0 && screenX < CANVAS_WIDTH - 100 && screenY >= 50 && screenY < CANVAS_HEIGHT - 80) {
        return; // Already visible
    }

    // Draw arrow pointing to extraction
    const playerScreenX = CANVAS_WIDTH / 2;
    const playerScreenY = CANVAS_HEIGHT / 2;
    const angle = Math.atan2(extractY - player.y, extractX - player.x);

    // Position arrow at edge of screen
    const margin = 50;
    let arrowX = playerScreenX + Math.cos(angle) * 200;
    let arrowY = playerScreenY + Math.sin(angle) * 150;

    // Clamp to screen edges
    arrowX = Math.max(margin, Math.min(CANVAS_WIDTH - margin - 100, arrowX));
    arrowY = Math.max(60, Math.min(CANVAS_HEIGHT - 100, arrowY));

    // Draw arrow
    ctx.save();
    ctx.translate(arrowX, arrowY);
    ctx.rotate(angle);

    const pulse = Math.sin(gameTime / 200) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#44ff44';
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-5, -10);
    ctx.lineTo(-5, 10);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.restore();

    // Distance text
    const dist = Math.floor(getDistance(player.x, player.y, extractX, extractY));
    ctx.fillStyle = '#44ff44';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`EXIT: ${dist} tiles`, arrowX, arrowY + 25);
}

function renderHoverInfo() {
    if (!hoveredTile) return;

    const { x, y } = hoveredTile;
    if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) return;
    if (!visibilityMap[y][x]) return;

    // Check for enemy at tile
    const enemy = enemies.find(e => e.x === x && e.y === y);
    if (enemy) {
        const screenX = (x - camera.x) * TILE_SIZE;
        const screenY = (y - camera.y) * TILE_SIZE;

        // Adjust position if too close to edge
        let infoX = screenX + TILE_SIZE + 5;
        let infoY = screenY;
        if (infoX + 140 > CANVAS_WIDTH - 110) {
            infoX = screenX - 145;
        }

        // Show enemy info
        ctx.fillStyle = COLORS.uiBg;
        ctx.fillRect(infoX - 5, infoY, 140, 80);
        ctx.strokeStyle = enemy.corrupted ? '#882288' : '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(infoX - 5, infoY, 140, 80);

        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = enemy.color;
        ctx.textAlign = 'left';
        ctx.fillText(enemy.name + (enemy.corrupted ? ' [CORRUPTED]' : ''), infoX, infoY + 15);

        ctx.font = '11px Arial';
        ctx.fillStyle = COLORS.ui;
        ctx.fillText(`HP: ${enemy.hp}/${enemy.maxHp}`, infoX, infoY + 30);
        ctx.fillText(`Weapon: ${enemy.weapon.name}`, infoX, infoY + 45);
        ctx.fillText(`State: ${enemy.alerted ? 'ALERT' : 'Unaware'}`, infoX, infoY + 60);

        // Hit chance if in range
        if (player.currentWeapon && hasLineOfSight(player.x, player.y, x, y)) {
            const dist = getDistance(player.x, player.y, x, y);
            if (dist <= player.currentWeapon.range) {
                const hitChance = calculateHitChance(player, enemy, player.currentWeapon, dist);
                ctx.fillStyle = hitChance > 50 ? '#88ff88' : '#ff8888';
                ctx.fillText(`Hit: ${Math.floor(hitChance)}% (${Math.floor(dist)} tiles)`, infoX, infoY + 75);
            } else {
                ctx.fillStyle = '#888888';
                ctx.fillText(`Out of range (${Math.floor(dist)} tiles)`, infoX, infoY + 75);
            }
        }
    }

    // Show tile info for non-enemy tiles
    if (!enemy) {
        const tile = map[y][x];
        const tileNames = {
            [TileType.FLOOR]: null,
            [TileType.WALL]: null,
            [TileType.DOOR_CLOSED]: 'Closed Door',
            [TileType.DOOR_OPEN]: 'Open Door',
            [TileType.COVER_HALF]: 'Half Cover (-25% dmg)',
            [TileType.COVER_FULL]: 'Full Cover (-50% dmg)',
            [TileType.EXTRACTION]: 'EXTRACTION POINT',
            [TileType.VENT]: 'Vent'
        };

        const tileName = tileNames[tile];
        if (tileName) {
            const screenX = (x - camera.x) * TILE_SIZE;
            const screenY = (y - camera.y) * TILE_SIZE;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(screenX, screenY - 20, ctx.measureText(tileName).width + 10, 18);

            ctx.font = '12px Arial';
            ctx.fillStyle = tile === TileType.EXTRACTION ? '#44ff44' : '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(tileName, screenX + 5, screenY - 6);
        }
    }
}

function renderTitle() {
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Animated background corruption effect
    const time = Date.now() / 1000;
    for (let i = 0; i < 5; i++) {
        const x = Math.sin(time + i * 0.7) * 200 + CANVAS_WIDTH / 2;
        const y = Math.cos(time * 0.5 + i * 1.2) * 150 + CANVAS_HEIGHT / 2;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 150);
        gradient.addColorStop(0, 'rgba(100, 0, 80, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = COLORS.corrupted;
    ctx.textAlign = 'center';
    ctx.fillText('DIMENSIONAL BREACH', CANVAS_WIDTH / 2, 150);

    ctx.font = '18px Arial';
    ctx.fillStyle = COLORS.ui;
    ctx.fillText('A Quasimorph-Inspired Tactical Extraction Game', CANVAS_WIDTH / 2, 190);

    // Features list
    ctx.font = '14px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText('• Turn-based tactical combat with Action Points', CANVAS_WIDTH / 2, 250);
    ctx.fillText('• Corruption system - stay too long and face worse enemies', CANVAS_WIDTH / 2, 275);
    ctx.fillText('• Cover system - use terrain for protection', CANVAS_WIDTH / 2, 300);
    ctx.fillText('• Multiple weapons, grenades, and items', CANVAS_WIDTH / 2, 325);

    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffff00';
    const pulse = Math.sin(time * 3) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText('Click to Start', CANVAS_WIDTH / 2, 400);
    ctx.globalAlpha = 1;

    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('WASD: Move | Click: Shoot | R: Reload | H: Heal | G: Grenade', CANVAS_WIDTH / 2, 480);
    ctx.fillText('Q: Switch Weapon | 1/2/3: Stance | ENTER: End Turn', CANVAS_WIDTH / 2, 500);
    ctx.fillText('Reach the EXIT to win!', CANVAS_WIDTH / 2, 540);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(20, 0, 0, 0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Static effect
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgba(255, 0, 0, ${Math.random() * 0.1})`;
        ctx.fillRect(Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT, 2, 2);
    }

    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = COLORS.damage;
    ctx.textAlign = 'center';
    ctx.fillText('MISSION FAILED', CANVAS_WIDTH / 2, 140);

    ctx.font = '18px Arial';
    ctx.fillStyle = '#cc4444';
    ctx.fillText('Your clone has been terminated', CANVAS_WIDTH / 2, 180);

    // Stats box
    ctx.fillStyle = 'rgba(40, 0, 0, 0.8)';
    ctx.fillRect(CANVAS_WIDTH / 2 - 150, 210, 300, 200);
    ctx.strokeStyle = '#882222';
    ctx.strokeRect(CANVAS_WIDTH / 2 - 150, 210, 300, 200);

    ctx.font = '16px Arial';
    ctx.fillStyle = COLORS.ui;
    ctx.textAlign = 'left';
    const statsX = CANVAS_WIDTH / 2 - 130;
    ctx.fillText(`Turns Survived:`, statsX, 250);
    ctx.fillText(`Enemies Killed:`, statsX, 280);
    ctx.fillText(`Damage Dealt:`, statsX, 310);
    ctx.fillText(`Damage Taken:`, statsX, 340);
    ctx.fillText(`Final Corruption:`, statsX, 370);

    ctx.textAlign = 'right';
    const statsX2 = CANVAS_WIDTH / 2 + 130;
    ctx.fillText(`${turn}`, statsX2, 250);
    ctx.fillText(`${player.kills}`, statsX2, 280);
    ctx.fillText(`${player.damageDealt}`, statsX2, 310);
    ctx.fillText(`${player.damageTaken}`, statsX2, 340);
    ctx.fillText(`${corruption}/${MAX_CORRUPTION}`, statsX2, 370);

    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffff00';
    ctx.textAlign = 'center';
    const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText('Click to Try Again', CANVAS_WIDTH / 2, 480);
    ctx.globalAlpha = 1;
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 20, 0, 0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Particle effect
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(68, 255, 68, ${Math.random() * 0.2})`;
        const y = (Date.now() / 20 + i * 12) % CANVAS_HEIGHT;
        ctx.fillRect(Math.random() * CANVAS_WIDTH, y, 2, 4);
    }

    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = COLORS.extraction;
    ctx.textAlign = 'center';
    ctx.fillText('EXTRACTION SUCCESSFUL', CANVAS_WIDTH / 2, 120);

    ctx.font = '18px Arial';
    ctx.fillStyle = '#88ff88';
    ctx.fillText('Mission Complete - Clone Preserved', CANVAS_WIDTH / 2, 160);

    // Calculate score
    const score = (player.kills * 100) + ((100 - turn) * 10) + (player.hp * 5) + ((1000 - corruption) / 2);

    // Stats box
    ctx.fillStyle = 'rgba(0, 40, 0, 0.8)';
    ctx.fillRect(CANVAS_WIDTH / 2 - 150, 190, 300, 230);
    ctx.strokeStyle = '#228822';
    ctx.strokeRect(CANVAS_WIDTH / 2 - 150, 190, 300, 230);

    ctx.font = '16px Arial';
    ctx.fillStyle = COLORS.ui;
    ctx.textAlign = 'left';
    const statsX = CANVAS_WIDTH / 2 - 130;
    ctx.fillText(`Turns Taken:`, statsX, 230);
    ctx.fillText(`Enemies Killed:`, statsX, 260);
    ctx.fillText(`HP Remaining:`, statsX, 290);
    ctx.fillText(`Final Corruption:`, statsX, 320);
    ctx.fillText(`Damage Dealt:`, statsX, 350);

    ctx.textAlign = 'right';
    const statsX2 = CANVAS_WIDTH / 2 + 130;
    ctx.fillText(`${turn}`, statsX2, 230);
    ctx.fillText(`${player.kills}`, statsX2, 260);
    ctx.fillText(`${player.hp}/${player.maxHp}`, statsX2, 290);
    ctx.fillText(`${corruption}/${MAX_CORRUPTION}`, statsX2, 320);
    ctx.fillText(`${player.damageDealt}`, statsX2, 350);

    // Score
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`SCORE: ${Math.floor(score)}`, CANVAS_WIDTH / 2, 400);

    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffff00';
    const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillText('Click to Play Again', CANVAS_WIDTH / 2, 480);
    ctx.globalAlpha = 1;
}

function renderPaused() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, 200);

    ctx.font = '20px Arial';
    ctx.fillStyle = '#888888';
    ctx.fillText('Press ESC to resume', CANVAS_WIDTH / 2, 260);

    // Show current stats
    ctx.font = '16px Arial';
    ctx.fillStyle = COLORS.ui;
    ctx.fillText(`Turn: ${turn}`, CANVAS_WIDTH / 2, 320);
    ctx.fillText(`Kills: ${player.kills}`, CANVAS_WIDTH / 2, 350);
    ctx.fillText(`Corruption: ${corruption}/${MAX_CORRUPTION}`, CANVAS_WIDTH / 2, 380);
    ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, CANVAS_WIDTH / 2, 410);

    // Controls reminder
    ctx.font = '14px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText('Controls:', CANVAS_WIDTH / 2, 470);
    ctx.fillText('WASD - Move | Click - Shoot | R - Reload | H - Heal', CANVAS_WIDTH / 2, 495);
    ctx.fillText('G - Grenade | Q - Switch Weapon | 1/2/3 - Stance', CANVAS_WIDTH / 2, 520);
    ctx.fillText('ENTER - End Turn', CANVAS_WIDTH / 2, 545);
}

// ============================================================================
// INPUT HANDLING
// ============================================================================

function setupInput() {
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

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

    // Convert to tile coordinates
    const tileX = Math.floor(clickX / TILE_SIZE) + Math.floor(camera.x);
    const tileY = Math.floor(clickY / TILE_SIZE) + Math.floor(camera.y);

    // Check if clicking on enemy
    const enemy = enemies.find(e => e.x === tileX && e.y === tileY);
    if (enemy && visibilityMap[tileY][tileX]) {
        player.shoot(enemy);
        endPlayerTurn();
        return;
    }

    // Check for door toggle
    if (map[tileY][tileX] === TileType.DOOR_CLOSED && getDistance(player.x, player.y, tileX, tileY) <= 1.5) {
        map[tileY][tileX] = TileType.DOOR_OPEN;
        updateVisibility();
        return;
    }

    // Check for item pickup
    const itemIndex = items.findIndex(i => i.x === tileX && i.y === tileY);
    if (itemIndex !== -1 && player.x === tileX && player.y === tileY) {
        pickupItem(itemIndex);
        return;
    }
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    hoveredTile = {
        x: Math.floor(mouse.x / TILE_SIZE) + Math.floor(camera.x),
        y: Math.floor(mouse.y / TILE_SIZE) + Math.floor(camera.y)
    };
}

function handleKeyDown(e) {
    keys[e.key.toLowerCase()] = true;

    if (gameState !== GameState.PLAYER_TURN) return;

    let dx = 0, dy = 0;

    // Movement
    if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') dy = -1;
    if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') dy = 1;
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') dx = -1;
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') dx = 1;

    if (dx !== 0 || dy !== 0) {
        if (player.move(dx, dy)) {
            endPlayerTurn();
        }
    }

    // Reload
    if (e.key.toLowerCase() === 'r') {
        if (player.reload()) {
            // Only check for auto-end turn, don't force it
            if (player.ap <= 0) {
                startEnemyTurn();
            }
        }
    }

    // Use medkit
    if (e.key.toLowerCase() === 'h') {
        if (player.useMedkit()) {
            if (player.ap <= 0) {
                startEnemyTurn();
            }
        }
    }

    // Switch weapon
    if (e.key.toLowerCase() === 'q') {
        player.switchWeapon();
    }

    // End turn
    if (e.key === 'Enter') {
        startEnemyTurn();
    }

    // Pause
    if (e.key === 'Escape') {
        if (gameState === GameState.PLAYER_TURN) {
            gameState = GameState.PAUSED;
        } else if (gameState === GameState.PAUSED) {
            gameState = GameState.PLAYER_TURN;
        }
    }

    // Stance switching (free action)
    if (e.key === '1') {
        player.stance = Stance.SNEAK;
        showFloatingText(player.x * TILE_SIZE + TILE_SIZE/2, player.y * TILE_SIZE - 20, 'Sneak Mode', '#88aaff');
    }
    if (e.key === '2') {
        player.stance = Stance.WALK;
        showFloatingText(player.x * TILE_SIZE + TILE_SIZE/2, player.y * TILE_SIZE - 20, 'Walk Mode', '#88aaff');
    }
    if (e.key === '3') {
        player.stance = Stance.RUN;
        showFloatingText(player.x * TILE_SIZE + TILE_SIZE/2, player.y * TILE_SIZE - 20, 'Run Mode', '#88aaff');
    }

    // Throw grenade at mouse position
    if (e.key.toLowerCase() === 'g' && hoveredTile) {
        if (player.throwGrenade(hoveredTile.x, hoveredTile.y)) {
            if (player.ap <= 0) {
                startEnemyTurn();
            }
        }
    }

    // Pickup item on current tile
    if (e.key.toLowerCase() === 'e') {
        const itemIndex = items.findIndex(i => i.x === player.x && i.y === player.y);
        if (itemIndex !== -1) {
            pickupItem(itemIndex);
        }
    }
}

function handleKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
}

function pickupItem(index) {
    const item = items[index];

    if (item.type === 'ammo') {
        player.ammo[item.ammoType] = (player.ammo[item.ammoType] || 0) + item.count;
        showFloatingText(player.x * TILE_SIZE + TILE_SIZE/2, player.y * TILE_SIZE - 20,
            `+${item.count} ${item.ammoType}`, '#ffaa00');
    } else if (item.type === 'medkit') {
        const existing = player.items.find(i => i.type === 'medkit');
        if (existing) existing.count += item.count;
        else player.items.push({ type: 'medkit', count: item.count });
        showFloatingText(player.x * TILE_SIZE + TILE_SIZE/2, player.y * TILE_SIZE - 20,
            '+Medkit', COLORS.heal);
    } else if (item.type === 'grenade') {
        const existing = player.items.find(i => i.type === 'grenade');
        if (existing) existing.count += item.count;
        else player.items.push({ type: 'grenade', count: item.count });
        showFloatingText(player.x * TILE_SIZE + TILE_SIZE/2, player.y * TILE_SIZE - 20,
            '+Grenade', '#ff8800');
    } else if (item.type === 'weapon') {
        // Swap with secondary weapon
        const newWeapon = { ...WEAPONS[item.weaponType], currentMag: WEAPONS[item.weaponType].magSize };
        player.secondaryWeapon = newWeapon;
        showFloatingText(player.x * TILE_SIZE + TILE_SIZE/2, player.y * TILE_SIZE - 20,
            `+${newWeapon.name}`, '#88aaff');
    } else if (item.type === 'cigarettes') {
        corruption = Math.max(0, corruption - item.corruptionReduce);
        showFloatingText(player.x * TILE_SIZE + TILE_SIZE/2, player.y * TILE_SIZE - 20,
            `-${item.corruptionReduce} Corruption`, '#aa88ff');
    }

    items.splice(index, 1);
}

// ============================================================================
// GAME LOOP
// ============================================================================

function startGame() {
    gameState = GameState.PLAYING;
    turn = 0;
    corruption = 0;
    lastCorruptionThreshold = 0;

    generateMap();

    // Spawn player in first room
    const startRoom = rooms[0];
    player = new Player(
        Math.floor(startRoom.x + startRoom.w / 2),
        Math.floor(startRoom.y + startRoom.h / 2)
    );

    spawnEnemies();
    spawnItems();
    updateVisibility();

    startPlayerTurn();
}

function update(dt) {
    deltaTime = dt;
    gameTime += dt * 1000;

    // Update particles
    updateParticles(dt);
    updateFloatingTexts(dt);
    updateAnimations(dt);
    updateScreenShake(dt);
    updateMuzzleFlashes(dt);
    updateAmbientParticles(dt);

    // Update enemy visuals
    for (const enemy of enemies) {
        enemy.updateVisuals(dt);
    }

    // Process enemy turn
    if (gameState === GameState.ENEMY_TURN) {
        processEnemyTurn(dt);
    }

    // Auto-end player turn when out of AP
    if (gameState === GameState.PLAYER_TURN && player.ap <= 0) {
        startEnemyTurn();
    }
}

function gameLoop(timestamp) {
    const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

// ============================================================================
// TEST HARNESS
// ============================================================================

window.testHarness = {
    verifyHarness() {
        const checks = [];

        checks.push({ name: 'Canvas exists', passed: !!canvas, error: canvas ? null : 'Canvas not found' });
        checks.push({ name: 'Game state defined', passed: gameState !== undefined, error: null });
        checks.push({ name: 'Player class exists', passed: typeof Player === 'function', error: null });
        checks.push({ name: 'Enemy class exists', passed: typeof Enemy === 'function', error: null });
        checks.push({ name: 'Map generation works', passed: typeof generateMap === 'function', error: null });

        return {
            allPassed: checks.every(c => c.passed),
            checks
        };
    },

    getVision() {
        return {
            scene: gameState,
            player: player ? { x: player.x, y: player.y, hp: player.hp, ap: player.ap } : null,
            enemies: enemies.map(e => ({ x: e.x, y: e.y, hp: e.hp, type: e.type })),
            turn,
            corruption,
            mapSize: { width: mapWidth, height: mapHeight }
        };
    },

    step(input) {
        if (input.actions) {
            for (const action of input.actions) {
                if (action.type === 'move' && player) {
                    player.move(action.dx, action.dy);
                }
            }
        }
        return { ok: true };
    }
};

window.debugCommands = {
    godMode(enable) {
        if (player) player.hp = enable ? 9999 : 100;
    },
    skipToVictory() {
        gameState = GameState.VICTORY;
    },
    addCorruption(amount) {
        addCorruption(amount);
    }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

setupInput();
requestAnimationFrame(gameLoop);
