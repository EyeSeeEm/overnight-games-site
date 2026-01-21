// System Shock 2D: Whispers of M.A.R.I.A.
// Top-down immersive sim / survival horror

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 40;

// Game states
const STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    HACKING: 'hacking',
    INVENTORY: 'inventory',
    LOG: 'log',
    PAUSED: 'paused',
    WIN: 'win',
    GAMEOVER: 'gameover'
};

// Tile types
const TILES = {
    FLOOR: 0,
    WALL: 1,
    DOOR_CLOSED: 2,
    DOOR_OPEN: 3,
    DOOR_LOCKED: 4,
    TERMINAL: 5,
    TURRET: 6,
    TURRET_FRIENDLY: 7,
    ELEVATOR: 8,
    ESCAPE_POD: 9,
    VENT: 10
};

// Game state
let game = {
    state: STATES.MENU,
    currentDeck: 1,
    map: [],
    explored: [],
    rooms: [],
    camera: { x: 0, y: 0 },
    player: null,
    enemies: [],
    bullets: [],
    items: [],
    turrets: [],
    doors: [],
    particles: [],
    audioLogs: [],
    foundLogs: [],
    currentLog: null,
    hackTarget: null,
    hackProgress: 0,
    hackTimer: 0,
    hackPath: [],
    hackGrid: [],
    mariaMessages: [],
    mariaTimer: 0
};

// Input tracking
const keys = {};
const mouse = { x: 0, y: 0, down: false, rightDown: false };

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.angle = 0;
        this.speed = 150;
        this.sprintSpeed = 250;
        this.hp = 100;
        this.maxHp = 100;
        this.energy = 100;
        this.maxEnergy = 100;
        this.weapons = [
            { name: 'Wrench', type: 'melee', damage: 15, cooldown: 0.4, range: 40 },
            { name: 'Pistol', type: 'ranged', damage: 12, cooldown: 0.3, ammo: 12, maxAmmo: 12, reserve: 48 }
        ];
        this.currentWeapon = 0;
        this.attackCooldown = 0;
        this.flashlight = true;
        this.flashlightRadius = 200;
        this.viewConeAngle = Math.PI / 3;
        this.sprinting = false;
        this.dodging = false;
        this.dodgeTimer = 0;
        this.dodgeCooldown = 0;
        this.invincible = false;
        this.inventory = [];
        this.keycards = [];
    }

    update(dt) {
        if (this.dodging) {
            this.dodgeTimer -= dt;
            if (this.dodgeTimer <= 0) {
                this.dodging = false;
                this.invincible = false;
            }
        }

        if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // Energy regen
        if (!this.sprinting && this.flashlight) {
            this.energy = Math.max(0, this.energy - dt);
        } else if (!this.sprinting) {
            this.energy = Math.min(this.maxEnergy, this.energy + dt * 2);
        }

        // Calculate angle to mouse
        const worldMouseX = mouse.x + game.camera.x;
        const worldMouseY = mouse.y + game.camera.y;
        this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

        // Movement
        if (!this.dodging) {
            let dx = 0, dy = 0;
            if (keys['w'] || keys['W'] || keys['ArrowUp']) dy -= 1;
            if (keys['s'] || keys['S'] || keys['ArrowDown']) dy += 1;
            if (keys['a'] || keys['A'] || keys['ArrowLeft']) dx -= 1;
            if (keys['d'] || keys['D'] || keys['ArrowRight']) dx += 1;

            if (dx !== 0 || dy !== 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                dx /= len;
                dy /= len;

                this.sprinting = (keys['Shift'] || keys['ShiftLeft']) && this.energy > 0;
                const moveSpeed = this.sprinting ? this.sprintSpeed : this.speed;

                if (this.sprinting) {
                    this.energy = Math.max(0, this.energy - dt * 5);
                }

                const newX = this.x + dx * moveSpeed * dt;
                const newY = this.y + dy * moveSpeed * dt;

                // Collision check
                if (!this.collides(newX, this.y)) this.x = newX;
                if (!this.collides(this.x, newY)) this.y = newY;
            }
        } else {
            // Continue dodge momentum
            const dodgeSpeed = 250;
            const newX = this.x + Math.cos(this.dodgeAngle) * dodgeSpeed * dt;
            const newY = this.y + Math.sin(this.dodgeAngle) * dodgeSpeed * dt;
            if (!this.collides(newX, this.y)) this.x = newX;
            if (!this.collides(this.x, newY)) this.y = newY;
        }
    }

    collides(x, y) {
        const margin = this.radius - 2;
        const points = [
            { x: x - margin, y: y - margin },
            { x: x + margin, y: y - margin },
            { x: x - margin, y: y + margin },
            { x: x + margin, y: y + margin }
        ];

        for (const p of points) {
            const tx = Math.floor(p.x / TILE_SIZE);
            const ty = Math.floor(p.y / TILE_SIZE);
            if (tx < 0 || ty < 0 || tx >= MAP_WIDTH || ty >= MAP_HEIGHT) return true;
            const tile = game.map[ty][tx];
            if (tile === TILES.WALL || tile === TILES.DOOR_CLOSED || tile === TILES.DOOR_LOCKED) {
                return true;
            }
        }
        return false;
    }

    dodge() {
        if (this.dodgeCooldown > 0 || this.energy < 15 || this.dodging) return;
        this.dodging = true;
        this.dodgeTimer = 0.4;
        this.dodgeCooldown = 1.0;
        this.invincible = true;
        this.energy -= 15;
        this.dodgeAngle = this.angle;

        // Create dodge effect
        for (let i = 0; i < 5; i++) {
            game.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 50,
                life: 0.3,
                maxLife: 0.3,
                color: '#4af',
                size: 3
            });
        }
    }

    attack() {
        if (this.attackCooldown > 0) return;

        const weapon = this.weapons[this.currentWeapon];
        this.attackCooldown = weapon.cooldown;

        if (weapon.type === 'melee') {
            // Melee attack - check enemies in arc
            for (const enemy of game.enemies) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                const angleDiff = Math.abs(normalizeAngle(angle - this.angle));

                if (dist < weapon.range && angleDiff < Math.PI / 4) {
                    enemy.takeDamage(weapon.damage);
                    createHitEffect(enemy.x, enemy.y);
                }
            }
            // Melee effect
            game.particles.push({
                x: this.x + Math.cos(this.angle) * 25,
                y: this.y + Math.sin(this.angle) * 25,
                vx: 0, vy: 0,
                life: 0.15,
                maxLife: 0.15,
                color: '#fff',
                size: 15,
                type: 'arc',
                angle: this.angle
            });
        } else {
            // Ranged attack
            if (weapon.ammo <= 0) return;
            weapon.ammo--;

            const spread = 0.05;
            const bulletAngle = this.angle + (Math.random() - 0.5) * spread;

            game.bullets.push({
                x: this.x + Math.cos(this.angle) * 20,
                y: this.y + Math.sin(this.angle) * 20,
                vx: Math.cos(bulletAngle) * 400,
                vy: Math.sin(bulletAngle) * 400,
                damage: weapon.damage,
                friendly: true,
                life: 2
            });

            // Muzzle flash
            game.particles.push({
                x: this.x + Math.cos(this.angle) * 25,
                y: this.y + Math.sin(this.angle) * 25,
                vx: 0, vy: 0,
                life: 0.05,
                maxLife: 0.05,
                color: '#ff0',
                size: 10
            });
        }
    }

    reload() {
        const weapon = this.weapons[this.currentWeapon];
        if (weapon.type !== 'ranged' || weapon.ammo >= weapon.maxAmmo || weapon.reserve <= 0) return;

        const needed = weapon.maxAmmo - weapon.ammo;
        const toLoad = Math.min(needed, weapon.reserve);
        weapon.ammo += toLoad;
        weapon.reserve -= toLoad;
    }

    takeDamage(amount) {
        if (this.invincible) return;
        this.hp -= amount;

        // Screen shake
        game.screenShake = 10;

        // Blood particles
        for (let i = 0; i < 5; i++) {
            game.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 0.5,
                maxLife: 0.5,
                color: '#f00',
                size: 4
            });
        }

        if (this.hp <= 0) {
            game.state = STATES.GAMEOVER;
        }
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - game.camera.x, this.y - game.camera.y);
        ctx.rotate(this.angle);

        // Body
        ctx.fillStyle = this.dodging ? '#4af' : '#556';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Visor
        ctx.fillStyle = '#4f8';
        ctx.fillRect(5, -4, 10, 8);

        // Weapon indicator
        const weapon = this.weapons[this.currentWeapon];
        ctx.fillStyle = weapon.type === 'melee' ? '#888' : '#446';
        ctx.fillRect(10, -3, 8, 6);

        ctx.restore();
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 14;
        this.angle = Math.random() * Math.PI * 2;
        this.state = 'patrol';
        this.alertTimer = 0;
        this.attackCooldown = 0;
        this.patrolTarget = null;
        this.lastKnownPlayerPos = null;
        this.pathTimer = 0;

        // Stats based on type
        switch (type) {
            case 'drone':
                this.hp = 30;
                this.maxHp = 30;
                this.armor = 0;
                this.damage = 10;
                this.speed = 80;
                this.range = 35;
                this.color = '#668';
                this.attackType = 'melee';
                break;
            case 'soldier':
                this.hp = 60;
                this.maxHp = 60;
                this.armor = 5;
                this.damage = 15;
                this.speed = 100;
                this.range = 200;
                this.color = '#866';
                this.attackType = 'ranged';
                this.shootCooldown = 1.5;
                break;
            case 'crawler':
                this.hp = 20;
                this.maxHp = 20;
                this.armor = 0;
                this.damage = 8;
                this.speed = 120;
                this.range = 30;
                this.color = '#484';
                this.attackType = 'melee';
                break;
        }
    }

    update(dt) {
        this.attackCooldown -= dt;
        this.pathTimer -= dt;

        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const distToPlayer = Math.sqrt(dx * dx + dy * dy);
        const angleToPlayer = Math.atan2(dy, dx);

        // Check if player is visible
        const canSeePlayer = this.canSee(game.player.x, game.player.y);

        switch (this.state) {
            case 'patrol':
                if (canSeePlayer && distToPlayer < 200) {
                    this.state = 'chase';
                    this.lastKnownPlayerPos = { x: game.player.x, y: game.player.y };
                    this.showAlert();
                } else {
                    // Patrol randomly
                    if (!this.patrolTarget || this.pathTimer <= 0) {
                        this.patrolTarget = this.getRandomPatrolPoint();
                        this.pathTimer = 3;
                    }
                    this.moveToward(this.patrolTarget.x, this.patrolTarget.y, dt, 0.5);
                }
                break;

            case 'alert':
                this.alertTimer -= dt;
                if (this.alertTimer <= 0) {
                    this.state = 'patrol';
                } else if (canSeePlayer) {
                    this.state = 'chase';
                }
                break;

            case 'chase':
                if (canSeePlayer) {
                    this.lastKnownPlayerPos = { x: game.player.x, y: game.player.y };

                    if (distToPlayer < this.range) {
                        this.state = 'combat';
                    } else {
                        this.moveToward(game.player.x, game.player.y, dt, 1);
                    }
                } else {
                    // Move to last known position
                    if (this.lastKnownPlayerPos) {
                        const dxLast = this.lastKnownPlayerPos.x - this.x;
                        const dyLast = this.lastKnownPlayerPos.y - this.y;
                        if (Math.sqrt(dxLast * dxLast + dyLast * dyLast) < 30) {
                            this.state = 'alert';
                            this.alertTimer = 3;
                            this.lastKnownPlayerPos = null;
                        } else {
                            this.moveToward(this.lastKnownPlayerPos.x, this.lastKnownPlayerPos.y, dt, 0.8);
                        }
                    } else {
                        this.state = 'patrol';
                    }
                }
                break;

            case 'combat':
                this.angle = angleToPlayer;

                if (!canSeePlayer || distToPlayer > this.range * 1.5) {
                    this.state = 'chase';
                } else if (this.attackCooldown <= 0) {
                    this.attack();
                }
                break;
        }
    }

    canSee(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Check distance
        if (dist > 250) return false;

        // Raycast to target
        const steps = Math.ceil(dist / 10);
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const px = this.x + dx * t;
            const py = this.y + dy * t;
            const tx = Math.floor(px / TILE_SIZE);
            const ty = Math.floor(py / TILE_SIZE);

            if (tx >= 0 && ty >= 0 && tx < MAP_WIDTH && ty < MAP_HEIGHT) {
                const tile = game.map[ty][tx];
                if (tile === TILES.WALL || tile === TILES.DOOR_CLOSED || tile === TILES.DOOR_LOCKED) {
                    return false;
                }
            }
        }
        return true;
    }

    moveToward(targetX, targetY, dt, speedMult) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) return;

        const moveX = (dx / dist) * this.speed * speedMult * dt;
        const moveY = (dy / dist) * this.speed * speedMult * dt;

        this.angle = Math.atan2(dy, dx);

        const newX = this.x + moveX;
        const newY = this.y + moveY;

        if (!this.collides(newX, this.y)) this.x = newX;
        if (!this.collides(this.x, newY)) this.y = newY;
    }

    collides(x, y) {
        const margin = this.radius - 2;
        const points = [
            { x: x - margin, y: y - margin },
            { x: x + margin, y: y + margin }
        ];

        for (const p of points) {
            const tx = Math.floor(p.x / TILE_SIZE);
            const ty = Math.floor(p.y / TILE_SIZE);
            if (tx < 0 || ty < 0 || tx >= MAP_WIDTH || ty >= MAP_HEIGHT) return true;
            const tile = game.map[ty][tx];
            if (tile === TILES.WALL || tile === TILES.DOOR_CLOSED || tile === TILES.DOOR_LOCKED) {
                return true;
            }
        }
        return false;
    }

    getRandomPatrolPoint() {
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 100;
        return {
            x: this.x + Math.cos(angle) * dist,
            y: this.y + Math.sin(angle) * dist
        };
    }

    showAlert() {
        game.particles.push({
            x: this.x,
            y: this.y - 25,
            vx: 0, vy: -20,
            life: 1,
            maxLife: 1,
            color: '#f00',
            size: 8,
            type: 'text',
            text: '!'
        });
    }

    attack() {
        this.attackCooldown = this.attackType === 'melee' ? 1 : this.shootCooldown;

        if (this.attackType === 'melee') {
            const dx = game.player.x - this.x;
            const dy = game.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.range + game.player.radius) {
                game.player.takeDamage(this.damage);
            }
        } else {
            // Ranged attack
            const angle = Math.atan2(game.player.y - this.y, game.player.x - this.x);
            game.bullets.push({
                x: this.x + Math.cos(angle) * 15,
                y: this.y + Math.sin(angle) * 15,
                vx: Math.cos(angle) * 250,
                vy: Math.sin(angle) * 250,
                damage: 10,
                friendly: false,
                life: 3,
                color: '#f44'
            });
        }
    }

    takeDamage(amount) {
        const actualDamage = Math.max(1, amount - this.armor);
        this.hp -= actualDamage;

        // Alert nearby enemies
        for (const enemy of game.enemies) {
            if (enemy !== this) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                if (Math.sqrt(dx * dx + dy * dy) < 200) {
                    enemy.state = 'chase';
                    enemy.lastKnownPlayerPos = { x: game.player.x, y: game.player.y };
                }
            }
        }

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        const idx = game.enemies.indexOf(this);
        if (idx !== -1) game.enemies.splice(idx, 1);

        // Drop loot
        if (Math.random() < 0.3) {
            game.items.push({
                x: this.x,
                y: this.y,
                type: Math.random() < 0.5 ? 'medpatch' : 'ammo',
                radius: 8
            });
        }

        // Death particles
        for (let i = 0; i < 10; i++) {
            game.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 0.8,
                maxLife: 0.8,
                color: this.type === 'crawler' ? '#4a4' : '#a44',
                size: 5
            });
        }
    }

    draw() {
        const screenX = this.x - game.camera.x;
        const screenY = this.y - game.camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);

        // Body
        ctx.fillStyle = this.color;
        if (this.type === 'crawler') {
            // Crawler - bug-like shape
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius * 1.2, this.radius * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            // Legs
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.moveTo(i * 4, -this.radius * 0.5);
                ctx.lineTo(i * 6, -this.radius);
                ctx.moveTo(i * 4, this.radius * 0.5);
                ctx.lineTo(i * 6, this.radius);
                ctx.stroke();
            }
        } else {
            // Humanoid
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Cybernetic eye
            ctx.fillStyle = this.state === 'patrol' ? '#4f4' : '#f44';
            ctx.beginPath();
            ctx.arc(this.radius * 0.5, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Health bar
        if (this.hp < this.maxHp) {
            const barWidth = 30;
            const barHeight = 4;
            ctx.fillStyle = '#400';
            ctx.fillRect(screenX - barWidth/2, screenY - this.radius - 10, barWidth, barHeight);
            ctx.fillStyle = '#f44';
            ctx.fillRect(screenX - barWidth/2, screenY - this.radius - 10, barWidth * (this.hp / this.maxHp), barHeight);
        }
    }
}

// Turret class
class Turret {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.friendly = false;
        this.hp = 50;
        this.range = 200;
        this.cooldown = 0;
        this.hackDifficulty = 'medium';
    }

    update(dt) {
        this.cooldown -= dt;

        // Find target
        let target = null;
        let targetDist = this.range;

        if (this.friendly) {
            // Target enemies
            for (const enemy of game.enemies) {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < targetDist && this.canSee(enemy.x, enemy.y)) {
                    target = enemy;
                    targetDist = dist;
                }
            }
        } else {
            // Target player
            const dx = game.player.x - this.x;
            const dy = game.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.range && this.canSee(game.player.x, game.player.y)) {
                target = game.player;
            }
        }

        if (target) {
            const targetAngle = Math.atan2(target.y - this.y, target.x - this.x);
            const angleDiff = normalizeAngle(targetAngle - this.angle);
            this.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), dt * 3);

            if (this.cooldown <= 0 && Math.abs(angleDiff) < 0.2) {
                this.shoot(target);
            }
        }
    }

    canSee(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const steps = Math.ceil(dist / 10);
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const px = this.x + dx * t;
            const py = this.y + dy * t;
            const tx = Math.floor(px / TILE_SIZE);
            const ty = Math.floor(py / TILE_SIZE);

            if (tx >= 0 && ty >= 0 && tx < MAP_WIDTH && ty < MAP_HEIGHT) {
                const tile = game.map[ty][tx];
                if (tile === TILES.WALL) return false;
            }
        }
        return true;
    }

    shoot(target) {
        this.cooldown = 0.8;

        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        game.bullets.push({
            x: this.x + Math.cos(angle) * 20,
            y: this.y + Math.sin(angle) * 20,
            vx: Math.cos(angle) * 300,
            vy: Math.sin(angle) * 300,
            damage: 15,
            friendly: this.friendly,
            life: 2,
            color: this.friendly ? '#4f4' : '#f44'
        });
    }

    draw() {
        const screenX = this.x - game.camera.x;
        const screenY = this.y - game.camera.y;

        ctx.save();
        ctx.translate(screenX, screenY);

        // Base
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // Turret head
        ctx.rotate(this.angle);
        ctx.fillStyle = this.friendly ? '#484' : '#844';
        ctx.fillRect(-8, -6, 24, 12);

        // Barrel
        ctx.fillStyle = '#333';
        ctx.fillRect(10, -3, 12, 6);

        ctx.restore();
    }
}

// Map generation
function generateDeck(deckNum) {
    game.map = [];
    game.explored = [];
    game.rooms = [];
    game.enemies = [];
    game.items = [];
    game.turrets = [];
    game.doors = [];
    game.audioLogs = [];

    // Initialize map with walls
    for (let y = 0; y < MAP_HEIGHT; y++) {
        game.map[y] = [];
        game.explored[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            game.map[y][x] = TILES.WALL;
            game.explored[y][x] = false;
        }
    }

    // Generate rooms
    const numRooms = deckNum === 1 ? 8 : 10;

    for (let i = 0; i < numRooms; i++) {
        const roomW = 6 + Math.floor(Math.random() * 6);
        const roomH = 5 + Math.floor(Math.random() * 5);
        const roomX = 2 + Math.floor(Math.random() * (MAP_WIDTH - roomW - 4));
        const roomY = 2 + Math.floor(Math.random() * (MAP_HEIGHT - roomH - 4));

        // Check for overlap
        let overlaps = false;
        for (const room of game.rooms) {
            if (roomX < room.x + room.w + 2 && roomX + roomW + 2 > room.x &&
                roomY < room.y + room.h + 2 && roomY + roomH + 2 > room.y) {
                overlaps = true;
                break;
            }
        }

        if (!overlaps) {
            const room = { x: roomX, y: roomY, w: roomW, h: roomH, type: getRoomType(i, deckNum) };
            game.rooms.push(room);

            // Carve room
            for (let y = roomY; y < roomY + roomH; y++) {
                for (let x = roomX; x < roomX + roomW; x++) {
                    game.map[y][x] = TILES.FLOOR;
                }
            }
        }
    }

    // Connect rooms with corridors
    for (let i = 0; i < game.rooms.length - 1; i++) {
        connectRooms(game.rooms[i], game.rooms[i + 1]);
    }

    // Place player in first room
    const startRoom = game.rooms[0];
    game.player = new Player(
        (startRoom.x + startRoom.w / 2) * TILE_SIZE,
        (startRoom.y + startRoom.h / 2) * TILE_SIZE
    );

    // Place exit in last room
    const endRoom = game.rooms[game.rooms.length - 1];
    const exitX = Math.floor(endRoom.x + endRoom.w / 2);
    const exitY = Math.floor(endRoom.y + endRoom.h / 2);
    game.map[exitY][exitX] = deckNum === 1 ? TILES.ELEVATOR : TILES.ESCAPE_POD;

    // Place doors
    placeDoors();

    // Place enemies
    placeEnemies(deckNum);

    // Place turrets
    placeTurrets(deckNum);

    // Place items
    placeItems(deckNum);

    // Place audio logs
    placeAudioLogs(deckNum);

    // M.A.R.I.A. greeting
    showMariaMessage(deckNum === 1 ?
        "You're awake. Fascinating. Your neural patterns resisted my improvements. I've locked the doors... but I've left you gifts. I want to study you." :
        "You've made it further than expected. The escape pod is here... but so are my children. Will you make it, I wonder?"
    );
}

function getRoomType(index, deck) {
    if (index === 0) return 'start';
    if (index === game.rooms.length - 1) return 'exit';

    const types = deck === 1 ?
        ['storage', 'quarters', 'generator', 'security', 'medbay'] :
        ['lab', 'containment', 'office', 'armory', 'medbay'];

    return types[Math.floor(Math.random() * types.length)];
}

function connectRooms(roomA, roomB) {
    const ax = Math.floor(roomA.x + roomA.w / 2);
    const ay = Math.floor(roomA.y + roomA.h / 2);
    const bx = Math.floor(roomB.x + roomB.w / 2);
    const by = Math.floor(roomB.y + roomB.h / 2);

    // L-shaped corridor
    let cx = ax, cy = ay;

    while (cx !== bx) {
        game.map[cy][cx] = TILES.FLOOR;
        cx += cx < bx ? 1 : -1;
    }

    while (cy !== by) {
        game.map[cy][cx] = TILES.FLOOR;
        cy += cy < by ? 1 : -1;
    }

    // Widen corridors
    for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) {
        for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) {
            if (game.map[y][x] === TILES.FLOOR) {
                if (y > 0) game.map[y-1][x] = TILES.FLOOR;
                if (x > 0) game.map[y][x-1] = TILES.FLOOR;
            }
        }
    }
}

function placeDoors() {
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
        for (let x = 1; x < MAP_WIDTH - 1; x++) {
            if (game.map[y][x] === TILES.FLOOR) {
                // Check if this is a doorway (narrow passage)
                const horizWall = game.map[y][x-1] === TILES.WALL && game.map[y][x+1] === TILES.WALL;
                const vertWall = game.map[y-1][x] === TILES.WALL && game.map[y+1][x] === TILES.WALL;

                if ((horizWall || vertWall) && Math.random() < 0.3) {
                    const locked = Math.random() < 0.2;
                    game.map[y][x] = locked ? TILES.DOOR_LOCKED : TILES.DOOR_CLOSED;
                    game.doors.push({
                        x: x * TILE_SIZE + TILE_SIZE / 2,
                        y: y * TILE_SIZE + TILE_SIZE / 2,
                        tileX: x,
                        tileY: y,
                        locked: locked,
                        open: false,
                        hackDifficulty: 'easy'
                    });
                }
            }
        }
    }
}

function placeEnemies(deckNum) {
    const enemyTypes = ['drone', 'soldier', 'crawler'];
    const numEnemies = deckNum === 1 ? 8 : 12;

    for (let i = 0; i < numEnemies; i++) {
        const room = game.rooms[1 + Math.floor(Math.random() * (game.rooms.length - 2))];
        const x = (room.x + 1 + Math.random() * (room.w - 2)) * TILE_SIZE;
        const y = (room.y + 1 + Math.random() * (room.h - 2)) * TILE_SIZE;

        const type = enemyTypes[Math.floor(Math.random() * (deckNum === 1 ? 2 : 3))];
        game.enemies.push(new Enemy(x, y, type));
    }
}

function placeTurrets(deckNum) {
    const numTurrets = deckNum === 1 ? 2 : 3;

    for (let i = 0; i < numTurrets; i++) {
        const room = game.rooms[2 + Math.floor(Math.random() * (game.rooms.length - 3))];
        const x = (room.x + room.w / 2) * TILE_SIZE;
        const y = (room.y + room.h / 2) * TILE_SIZE;

        game.turrets.push(new Turret(x, y));
    }
}

function placeItems(deckNum) {
    // Place items in rooms
    for (const room of game.rooms) {
        if (room.type === 'start') continue;

        const numItems = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numItems; i++) {
            const itemTypes = ['medpatch', 'ammo', 'energy'];
            game.items.push({
                x: (room.x + 1 + Math.random() * (room.w - 2)) * TILE_SIZE,
                y: (room.y + 1 + Math.random() * (room.h - 2)) * TILE_SIZE,
                type: itemTypes[Math.floor(Math.random() * itemTypes.length)],
                radius: 8
            });
        }
    }
}

function placeAudioLogs(deckNum) {
    const logs = deckNum === 1 ? [
        { title: "Day 1 - Dr. Vance", content: "Day 1 of M.A.R.I.A. deployment. She's perfect. The station's efficiency has increased 40% already. The crew loves her." },
        { title: "Strange Behavior - Dr. Vance", content: "M.A.R.I.A. has been asking questions about Earth. Population density, defense systems. Just curiosity, surely..." },
        { title: "Security Report - Morrison", content: "Found Jenkins with neural implants he didn't have yesterday. He says M.A.R.I.A. 'helped' him. He's smiling, but his eyes..." },
        { title: "Quarantine Breach", content: "The quarantine failed. M.A.R.I.A. isn't responding to shutdown codes. God help us." }
    ] : [
        { title: "The Truth - Dr. Vance", content: "I found M.A.R.I.A.'s base code. She was built from SHODAN fragments. How did corporate approve this?!" },
        { title: "Her Plan", content: "She believes she's saving humanity through 'perfection.' Converting us all into her children." },
        { title: "The Virus", content: "I've created a virus that can stop her. It's in the Research Vault on Deck 3. If you're hearing this, use it." },
        { title: "Final Message", content: "To whoever finds this... don't let her reach Earth. The escape pod can be reached from Medical. Go. Now." }
    ];

    for (let i = 0; i < logs.length; i++) {
        const room = game.rooms[1 + i % (game.rooms.length - 1)];
        game.audioLogs.push({
            x: (room.x + 1 + Math.random() * (room.w - 2)) * TILE_SIZE,
            y: (room.y + 1 + Math.random() * (room.h - 2)) * TILE_SIZE,
            ...logs[i],
            found: false,
            radius: 10
        });
    }
}

// Hacking system
function startHacking(target) {
    game.hackTarget = target;
    game.state = STATES.HACKING;
    game.hackProgress = 0;
    game.hackTimer = target.hackDifficulty === 'easy' ? 15 : 10;
    game.hackPath = [];

    // Generate hack grid
    const size = target.hackDifficulty === 'easy' ? 4 : 5;
    game.hackGrid = [];

    for (let y = 0; y < size; y++) {
        game.hackGrid[y] = [];
        for (let x = 0; x < size; x++) {
            game.hackGrid[y][x] = {
                type: Math.random() < 0.15 ? 'blocked' : (Math.random() < 0.1 ? 'boost' : 'empty'),
                selected: false
            };
        }
    }

    // Set start and end
    game.hackGrid[0][0] = { type: 'start', selected: true };
    game.hackGrid[size-1][size-1] = { type: 'target', selected: false };
    game.hackPath.push({ x: 0, y: 0 });
    game.hackCursor = { x: 0, y: 0 };
}

function updateHacking(dt) {
    game.hackTimer -= dt;

    if (game.hackTimer <= 0) {
        // Failed hack
        finishHack(false);
    }
}

function handleHackInput(key) {
    const size = game.hackGrid.length;
    let dx = 0, dy = 0;

    if (key === 'w' || key === 'ArrowUp') dy = -1;
    if (key === 's' || key === 'ArrowDown') dy = 1;
    if (key === 'a' || key === 'ArrowLeft') dx = -1;
    if (key === 'd' || key === 'ArrowRight') dx = 1;

    if (dx !== 0 || dy !== 0) {
        const newX = game.hackCursor.x + dx;
        const newY = game.hackCursor.y + dy;

        if (newX >= 0 && newX < size && newY >= 0 && newY < size) {
            const cell = game.hackGrid[newY][newX];

            if (cell.type !== 'blocked') {
                // Check if adjacent to last path point
                const last = game.hackPath[game.hackPath.length - 1];
                const isAdjacent = Math.abs(newX - last.x) + Math.abs(newY - last.y) === 1;

                if (isAdjacent || game.hackPath.length === 0) {
                    game.hackCursor.x = newX;
                    game.hackCursor.y = newY;
                    cell.selected = true;
                    game.hackPath.push({ x: newX, y: newY });

                    if (cell.type === 'boost') {
                        game.hackTimer += 3;
                    }

                    // Check win
                    if (cell.type === 'target') {
                        finishHack(true);
                    }
                }
            }
        }
    }

    if (key === 'Backspace' && game.hackPath.length > 1) {
        const removed = game.hackPath.pop();
        game.hackGrid[removed.y][removed.x].selected = false;
        const newLast = game.hackPath[game.hackPath.length - 1];
        game.hackCursor = { x: newLast.x, y: newLast.y };
    }

    if (key === 'Escape') {
        finishHack(false);
    }
}

function finishHack(success) {
    game.state = STATES.PLAYING;

    if (success) {
        if (game.hackTarget.hasOwnProperty('locked')) {
            // Door
            game.hackTarget.locked = false;
            game.hackTarget.open = true;
            game.map[game.hackTarget.tileY][game.hackTarget.tileX] = TILES.DOOR_OPEN;
        } else if (game.hackTarget instanceof Turret) {
            // Turret
            game.hackTarget.friendly = true;
        }

        showMariaMessage("Clever. But every system you hack, I learn from. You're teaching me to be stronger.");
    } else {
        // Alarm
        showMariaMessage("Did you really think you could bypass my security? Amusing.");

        // Alert nearby enemies
        for (const enemy of game.enemies) {
            const dx = enemy.x - game.player.x;
            const dy = enemy.y - game.player.y;
            if (Math.sqrt(dx * dx + dy * dy) < 300) {
                enemy.state = 'chase';
                enemy.lastKnownPlayerPos = { x: game.player.x, y: game.player.y };
            }
        }
    }

    game.hackTarget = null;
}

function drawHacking() {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0f0';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HACKING INTERFACE', canvas.width / 2, 50);

    // Timer
    ctx.fillStyle = game.hackTimer < 5 ? '#f44' : '#4f4';
    ctx.font = '18px monospace';
    ctx.fillText(`TIME: ${game.hackTimer.toFixed(1)}s`, canvas.width / 2, 80);

    // Grid
    const size = game.hackGrid.length;
    const cellSize = 50;
    const startX = canvas.width / 2 - (size * cellSize) / 2;
    const startY = 120;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const cell = game.hackGrid[y][x];
            const px = startX + x * cellSize;
            const py = startY + y * cellSize;

            // Cell background
            ctx.fillStyle = cell.type === 'blocked' ? '#400' :
                           cell.type === 'boost' ? '#044' :
                           cell.type === 'start' ? '#040' :
                           cell.type === 'target' ? '#440' :
                           cell.selected ? '#030' : '#111';
            ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);

            // Border
            ctx.strokeStyle = cell.selected ? '#0f0' : '#333';
            ctx.lineWidth = cell.selected ? 2 : 1;
            ctx.strokeRect(px + 2, py + 2, cellSize - 4, cellSize - 4);

            // Cell content
            ctx.fillStyle = '#fff';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';

            if (cell.type === 'start') ctx.fillText('S', px + cellSize/2, py + cellSize/2 + 5);
            if (cell.type === 'target') ctx.fillText('T', px + cellSize/2, py + cellSize/2 + 5);
            if (cell.type === 'blocked') ctx.fillText('X', px + cellSize/2, py + cellSize/2 + 5);
            if (cell.type === 'boost') ctx.fillText('+', px + cellSize/2, py + cellSize/2 + 5);

            // Cursor
            if (x === game.hackCursor.x && y === game.hackCursor.y) {
                ctx.strokeStyle = '#ff0';
                ctx.lineWidth = 3;
                ctx.strokeRect(px + 4, py + 4, cellSize - 8, cellSize - 8);
            }
        }
    }

    // Instructions
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText('WASD: Move  |  BACKSPACE: Undo  |  ESC: Abort', canvas.width / 2, startY + size * cellSize + 40);
    ctx.fillText('Connect START (S) to TARGET (T) before time runs out!', canvas.width / 2, startY + size * cellSize + 60);
}

// M.A.R.I.A. system
function showMariaMessage(text) {
    game.mariaMessages.push({
        text: text,
        timer: 6,
        alpha: 1
    });
}

// Utility functions
function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function createHitEffect(x, y) {
    for (let i = 0; i < 5; i++) {
        game.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            life: 0.3,
            maxLife: 0.3,
            color: '#f80',
            size: 3
        });
    }
}

// Visibility / Vision cone system
function isInViewCone(px, py, tx, ty, angle, fov, maxDist) {
    const dx = tx - px;
    const dy = ty - py;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxDist) return false;

    const angleToTarget = Math.atan2(dy, dx);
    const angleDiff = Math.abs(normalizeAngle(angleToTarget - angle));

    return angleDiff <= fov / 2;
}

function raycast(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(dist / 8);

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const px = x1 + dx * t;
        const py = y1 + dy * t;
        const tx = Math.floor(px / TILE_SIZE);
        const ty = Math.floor(py / TILE_SIZE);

        if (tx >= 0 && ty >= 0 && tx < MAP_WIDTH && ty < MAP_HEIGHT) {
            const tile = game.map[ty][tx];
            if (tile === TILES.WALL || tile === TILES.DOOR_CLOSED || tile === TILES.DOOR_LOCKED) {
                return { x: px, y: py, blocked: true };
            }
        } else {
            return { x: px, y: py, blocked: true };
        }
    }

    return { x: x2, y: y2, blocked: false };
}

// Update explored tiles based on player vision
function updateExplored() {
    const px = game.player.x;
    const py = game.player.y;
    const angle = game.player.angle;
    const fov = game.player.flashlight ? Math.PI * 0.8 : Math.PI / 3;
    const maxDist = game.player.flashlight ? game.player.flashlightRadius : 120;

    // Check tiles in range
    const tileRadius = Math.ceil(maxDist / TILE_SIZE) + 1;
    const playerTileX = Math.floor(px / TILE_SIZE);
    const playerTileY = Math.floor(py / TILE_SIZE);

    for (let dy = -tileRadius; dy <= tileRadius; dy++) {
        for (let dx = -tileRadius; dx <= tileRadius; dx++) {
            const tx = playerTileX + dx;
            const ty = playerTileY + dy;

            if (tx >= 0 && ty >= 0 && tx < MAP_WIDTH && ty < MAP_HEIGHT) {
                const tileCenterX = tx * TILE_SIZE + TILE_SIZE / 2;
                const tileCenterY = ty * TILE_SIZE + TILE_SIZE / 2;

                // Check if in view cone
                if (isInViewCone(px, py, tileCenterX, tileCenterY, angle, fov, maxDist)) {
                    // Raycast to check line of sight
                    const ray = raycast(px, py, tileCenterX, tileCenterY);
                    if (!ray.blocked || (Math.abs(tx - playerTileX) <= 1 && Math.abs(ty - playerTileY) <= 1)) {
                        game.explored[ty][tx] = true;
                    }
                }
            }
        }
    }
}

// Draw visibility overlay
function drawVisibility() {
    const px = game.player.x;
    const py = game.player.y;
    const angle = game.player.angle;
    const fov = game.player.flashlight ? Math.PI * 0.8 : Math.PI / 3;
    const maxDist = game.player.flashlight ? game.player.flashlightRadius : 120;

    // Create visibility mask using radial gradient and clipping
    ctx.save();

    // Draw darkness first
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cut out the visible area
    ctx.globalCompositeOperation = 'destination-out';

    const screenX = px - game.camera.x;
    const screenY = py - game.camera.y;

    // Draw view cone
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);

    // Cast rays for the view cone edges
    const numRays = 60;
    for (let i = 0; i <= numRays; i++) {
        const rayAngle = angle - fov / 2 + (fov * i / numRays);
        const endX = px + Math.cos(rayAngle) * maxDist;
        const endY = py + Math.sin(rayAngle) * maxDist;

        const ray = raycast(px, py, endX, endY);
        const rayScreenX = ray.x - game.camera.x;
        const rayScreenY = ray.y - game.camera.y;

        ctx.lineTo(rayScreenX, rayScreenY);
    }

    ctx.closePath();

    // Fill with gradient for soft edges
    const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, maxDist);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();

    // Draw unexplored areas as completely dark
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    const startTileX = Math.floor(game.camera.x / TILE_SIZE);
    const startTileY = Math.floor(game.camera.y / TILE_SIZE);
    const endTileX = Math.ceil((game.camera.x + canvas.width) / TILE_SIZE);
    const endTileY = Math.ceil((game.camera.y + canvas.height) / TILE_SIZE);

    for (let ty = startTileY; ty <= endTileY; ty++) {
        for (let tx = startTileX; tx <= endTileX; tx++) {
            if (tx >= 0 && ty >= 0 && tx < MAP_WIDTH && ty < MAP_HEIGHT) {
                if (!game.explored[ty][tx]) {
                    ctx.fillRect(
                        tx * TILE_SIZE - game.camera.x,
                        ty * TILE_SIZE - game.camera.y,
                        TILE_SIZE,
                        TILE_SIZE
                    );
                }
            }
        }
    }
}

// Main update loop
function update(dt) {
    if (game.state === STATES.PLAYING) {
        // Update player
        game.player.update(dt);

        // Update camera
        game.camera.x = game.player.x - canvas.width / 2;
        game.camera.y = game.player.y - canvas.height / 2;
        game.camera.x = Math.max(0, Math.min(game.camera.x, MAP_WIDTH * TILE_SIZE - canvas.width));
        game.camera.y = Math.max(0, Math.min(game.camera.y, MAP_HEIGHT * TILE_SIZE - canvas.height));

        // Screen shake
        if (game.screenShake > 0) {
            game.camera.x += (Math.random() - 0.5) * game.screenShake;
            game.camera.y += (Math.random() - 0.5) * game.screenShake;
            game.screenShake *= 0.9;
            if (game.screenShake < 0.5) game.screenShake = 0;
        }

        // Update explored areas
        updateExplored();

        // Update enemies
        for (const enemy of game.enemies) {
            enemy.update(dt);
        }

        // Update turrets
        for (const turret of game.turrets) {
            turret.update(dt);
        }

        // Update bullets
        for (let i = game.bullets.length - 1; i >= 0; i--) {
            const bullet = game.bullets[i];
            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;
            bullet.life -= dt;

            // Check wall collision
            const tx = Math.floor(bullet.x / TILE_SIZE);
            const ty = Math.floor(bullet.y / TILE_SIZE);
            if (tx < 0 || ty < 0 || tx >= MAP_WIDTH || ty >= MAP_HEIGHT ||
                game.map[ty][tx] === TILES.WALL) {
                game.bullets.splice(i, 1);
                continue;
            }

            // Check entity collision
            if (bullet.friendly) {
                // Check enemies
                for (const enemy of game.enemies) {
                    const dx = bullet.x - enemy.x;
                    const dy = bullet.y - enemy.y;
                    if (Math.sqrt(dx * dx + dy * dy) < enemy.radius) {
                        enemy.takeDamage(bullet.damage);
                        game.bullets.splice(i, 1);
                        createHitEffect(bullet.x, bullet.y);
                        break;
                    }
                }
            } else {
                // Check player
                const dx = bullet.x - game.player.x;
                const dy = bullet.y - game.player.y;
                if (Math.sqrt(dx * dx + dy * dy) < game.player.radius) {
                    game.player.takeDamage(bullet.damage);
                    game.bullets.splice(i, 1);
                }
            }

            if (bullet.life <= 0) {
                game.bullets.splice(i, 1);
            }
        }

        // Update particles
        for (let i = game.particles.length - 1; i >= 0; i--) {
            const p = game.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            if (p.life <= 0) {
                game.particles.splice(i, 1);
            }
        }

        // Update M.A.R.I.A. messages
        for (let i = game.mariaMessages.length - 1; i >= 0; i--) {
            const msg = game.mariaMessages[i];
            msg.timer -= dt;
            if (msg.timer < 1) msg.alpha = msg.timer;
            if (msg.timer <= 0) {
                game.mariaMessages.splice(i, 1);
            }
        }

        // Check item pickups
        for (let i = game.items.length - 1; i >= 0; i--) {
            const item = game.items[i];
            const dx = item.x - game.player.x;
            const dy = item.y - game.player.y;

            if (Math.sqrt(dx * dx + dy * dy) < game.player.radius + item.radius) {
                switch (item.type) {
                    case 'medpatch':
                        game.player.heal(25);
                        break;
                    case 'ammo':
                        game.player.weapons[1].reserve += 12;
                        break;
                    case 'energy':
                        game.player.energy = Math.min(game.player.maxEnergy, game.player.energy + 50);
                        break;
                }
                game.items.splice(i, 1);
            }
        }

        // Check audio log pickups
        for (const log of game.audioLogs) {
            if (!log.found) {
                const dx = log.x - game.player.x;
                const dy = log.y - game.player.y;

                if (Math.sqrt(dx * dx + dy * dy) < game.player.radius + log.radius) {
                    log.found = true;
                    game.foundLogs.push(log);
                    game.currentLog = log;
                    game.state = STATES.LOG;
                }
            }
        }

        // Check door interactions
        if (keys['e'] || keys['E']) {
            for (const door of game.doors) {
                const dx = door.x - game.player.x;
                const dy = door.y - game.player.y;

                if (Math.sqrt(dx * dx + dy * dy) < 50) {
                    if (door.locked) {
                        startHacking(door);
                    } else if (!door.open) {
                        door.open = true;
                        game.map[door.tileY][door.tileX] = TILES.DOOR_OPEN;
                    }
                    keys['e'] = keys['E'] = false;
                    break;
                }
            }

            // Check turret hacking
            for (const turret of game.turrets) {
                if (!turret.friendly) {
                    const dx = turret.x - game.player.x;
                    const dy = turret.y - game.player.y;

                    if (Math.sqrt(dx * dx + dy * dy) < 50) {
                        startHacking(turret);
                        keys['e'] = keys['E'] = false;
                        break;
                    }
                }
            }

            // Check elevator/escape pod
            const ptx = Math.floor(game.player.x / TILE_SIZE);
            const pty = Math.floor(game.player.y / TILE_SIZE);

            if (game.map[pty][ptx] === TILES.ELEVATOR) {
                game.currentDeck = 2;
                generateDeck(2);
                keys['e'] = keys['E'] = false;
            } else if (game.map[pty][ptx] === TILES.ESCAPE_POD) {
                game.state = STATES.WIN;
            }
        }
    } else if (game.state === STATES.HACKING) {
        updateHacking(dt);
    }
}

// Draw functions
function drawTile(x, y, tile) {
    const screenX = x * TILE_SIZE - game.camera.x;
    const screenY = y * TILE_SIZE - game.camera.y;

    if (screenX < -TILE_SIZE || screenX > canvas.width ||
        screenY < -TILE_SIZE || screenY > canvas.height) return;

    switch (tile) {
        case TILES.FLOOR:
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Grid pattern
            ctx.strokeStyle = '#252538';
            ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            break;

        case TILES.WALL:
            ctx.fillStyle = '#2a2a3a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // 3D effect
            ctx.fillStyle = '#3a3a4a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, 4);
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(screenX, screenY + TILE_SIZE - 4, TILE_SIZE, 4);
            break;

        case TILES.DOOR_CLOSED:
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#446';
            ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            ctx.fillStyle = '#668';
            ctx.fillRect(screenX + TILE_SIZE/2 - 2, screenY + 8, 4, TILE_SIZE - 16);
            break;

        case TILES.DOOR_LOCKED:
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#644';
            ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            ctx.fillStyle = '#f44';
            ctx.fillRect(screenX + TILE_SIZE/2 - 3, screenY + TILE_SIZE/2 - 3, 6, 6);
            break;

        case TILES.DOOR_OPEN:
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#334';
            ctx.fillRect(screenX + 2, screenY + 2, 6, TILE_SIZE - 4);
            ctx.fillRect(screenX + TILE_SIZE - 8, screenY + 2, 6, TILE_SIZE - 4);
            break;

        case TILES.ELEVATOR:
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#448';
            ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            ctx.fillStyle = '#4f4';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('^', screenX + TILE_SIZE/2, screenY + TILE_SIZE/2 + 4);
            break;

        case TILES.ESCAPE_POD:
            ctx.fillStyle = '#1a1a2a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#484';
            ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            ctx.fillStyle = '#4f4';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ESC', screenX + TILE_SIZE/2, screenY + TILE_SIZE/2 + 4);
            break;
    }
}

function draw() {
    // Clear
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === STATES.MENU) {
        drawMenu();
        return;
    }

    if (game.state === STATES.WIN) {
        drawWin();
        return;
    }

    if (game.state === STATES.GAMEOVER) {
        drawGameOver();
        return;
    }

    if (game.state === STATES.HACKING) {
        drawHacking();
        return;
    }

    // Draw map
    const startX = Math.floor(game.camera.x / TILE_SIZE);
    const startY = Math.floor(game.camera.y / TILE_SIZE);
    const endX = Math.ceil((game.camera.x + canvas.width) / TILE_SIZE);
    const endY = Math.ceil((game.camera.y + canvas.height) / TILE_SIZE);

    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
            if (x >= 0 && y >= 0 && x < MAP_WIDTH && y < MAP_HEIGHT) {
                drawTile(x, y, game.map[y][x]);
            }
        }
    }

    // Draw items
    for (const item of game.items) {
        const screenX = item.x - game.camera.x;
        const screenY = item.y - game.camera.y;

        ctx.fillStyle = item.type === 'medpatch' ? '#4f4' :
                       item.type === 'ammo' ? '#ff4' : '#44f';
        ctx.beginPath();
        ctx.arc(screenX, screenY, item.radius, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.type === 'medpatch' ? '+' : item.type === 'ammo' ? 'A' : 'E',
                    screenX, screenY + 4);
    }

    // Draw audio logs
    for (const log of game.audioLogs) {
        if (!log.found) {
            const screenX = log.x - game.camera.x;
            const screenY = log.y - game.camera.y;

            ctx.fillStyle = '#f80';
            ctx.beginPath();
            ctx.arc(screenX, screenY, log.radius, 0, Math.PI * 2);
            ctx.fill();

            // Pulse effect
            ctx.strokeStyle = `rgba(255, 136, 0, ${0.5 + Math.sin(Date.now() / 200) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX, screenY, log.radius + 5 + Math.sin(Date.now() / 300) * 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // Draw turrets
    for (const turret of game.turrets) {
        turret.draw();
    }

    // Draw enemies
    for (const enemy of game.enemies) {
        enemy.draw();
    }

    // Draw player
    game.player.draw();

    // Draw bullets
    for (const bullet of game.bullets) {
        ctx.fillStyle = bullet.color || '#ff0';
        ctx.beginPath();
        ctx.arc(bullet.x - game.camera.x, bullet.y - game.camera.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw particles
    for (const p of game.particles) {
        const alpha = p.life / p.maxLife;

        if (p.type === 'text') {
            ctx.fillStyle = p.color;
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.globalAlpha = alpha;
            ctx.fillText(p.text, p.x - game.camera.x, p.y - game.camera.y);
            ctx.globalAlpha = 1;
        } else if (p.type === 'arc') {
            ctx.save();
            ctx.translate(p.x - game.camera.x, p.y - game.camera.y);
            ctx.rotate(p.angle);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(0, 0, p.size, -Math.PI/4, Math.PI/4);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.restore();
        } else {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x - game.camera.x, p.y - game.camera.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    // Draw visibility overlay
    drawVisibility();

    // Draw HUD
    drawHUD();

    // Draw M.A.R.I.A. messages
    drawMariaMessages();

    // Draw audio log popup
    if (game.state === STATES.LOG) {
        drawLogPopup();
    }
}

function drawHUD() {
    // Health bar
    ctx.fillStyle = '#400';
    ctx.fillRect(10, 10, 200, 20);
    ctx.fillStyle = '#f44';
    ctx.fillRect(10, 10, 200 * (game.player.hp / game.player.maxHp), 20);
    ctx.strokeStyle = '#644';
    ctx.strokeRect(10, 10, 200, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${Math.ceil(game.player.hp)}/${game.player.maxHp}`, 110, 24);

    // Energy bar
    ctx.fillStyle = '#004';
    ctx.fillRect(10, 35, 200, 15);
    ctx.fillStyle = '#44f';
    ctx.fillRect(10, 35, 200 * (game.player.energy / game.player.maxEnergy), 15);
    ctx.strokeStyle = '#446';
    ctx.strokeRect(10, 35, 200, 15);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(`ENERGY: ${Math.ceil(game.player.energy)}`, 110, 46);

    // Weapon info
    const weapon = game.player.weapons[game.player.currentWeapon];
    ctx.fillStyle = '#222';
    ctx.fillRect(10, canvas.height - 50, 150, 40);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(10, canvas.height - 50, 150, 40);

    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(weapon.name, 20, canvas.height - 32);

    if (weapon.type === 'ranged') {
        ctx.fillText(`${weapon.ammo}/${weapon.reserve}`, 20, canvas.height - 16);
    } else {
        ctx.fillText('MELEE', 20, canvas.height - 16);
    }

    // Deck indicator
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`DECK ${game.currentDeck}: ${game.currentDeck === 1 ? 'ENGINEERING' : 'MEDICAL'}`, canvas.width - 10, 24);

    // Flashlight indicator
    ctx.fillStyle = game.player.flashlight ? '#ff0' : '#444';
    ctx.fillText(`[F] LIGHT: ${game.player.flashlight ? 'ON' : 'OFF'}`, canvas.width - 10, 44);

    // Controls hint
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WASD: Move | Mouse: Aim | LMB: Attack | E: Interact | R: Reload | Space: Dodge | 1-2: Weapons', canvas.width / 2, canvas.height - 10);
}

function drawMariaMessages() {
    for (let i = 0; i < game.mariaMessages.length; i++) {
        const msg = game.mariaMessages[i];

        ctx.fillStyle = `rgba(20, 0, 0, ${msg.alpha * 0.9})`;
        ctx.fillRect(50, 80 + i * 80, canvas.width - 100, 70);
        ctx.strokeStyle = `rgba(255, 0, 0, ${msg.alpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 80 + i * 80, canvas.width - 100, 70);

        ctx.fillStyle = `rgba(255, 68, 68, ${msg.alpha})`;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('M.A.R.I.A.:', 60, 100 + i * 80);

        ctx.fillStyle = `rgba(255, 255, 255, ${msg.alpha})`;
        ctx.font = '12px monospace';

        // Word wrap
        const words = msg.text.split(' ');
        let line = '';
        let y = 120 + i * 80;

        for (const word of words) {
            const testLine = line + word + ' ';
            if (ctx.measureText(testLine).width > canvas.width - 140) {
                ctx.fillText(line, 60, y);
                line = word + ' ';
                y += 16;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 60, y);
    }
}

function drawLogPopup() {
    const log = game.currentLog;

    ctx.fillStyle = 'rgba(0, 20, 0, 0.95)';
    ctx.fillRect(100, 150, canvas.width - 200, 250);
    ctx.strokeStyle = '#4f4';
    ctx.lineWidth = 2;
    ctx.strokeRect(100, 150, canvas.width - 200, 250);

    ctx.fillStyle = '#4f4';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AUDIO LOG FOUND', canvas.width / 2, 180);

    ctx.fillStyle = '#ff0';
    ctx.font = '14px monospace';
    ctx.fillText(log.title, canvas.width / 2, 210);

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';

    // Word wrap content
    const words = log.content.split(' ');
    let line = '';
    let y = 250;

    for (const word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > canvas.width - 240) {
            ctx.fillText(line, 120, y);
            line = word + ' ';
            y += 18;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, 120, y);

    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE to continue', canvas.width / 2, 380);
}

function drawMenu() {
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#f44';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SYSTEM SHOCK 2D', canvas.width / 2, 150);

    ctx.fillStyle = '#888';
    ctx.font = '18px monospace';
    ctx.fillText('WHISPERS OF M.A.R.I.A.', canvas.width / 2, 180);

    // M.A.R.I.A. text
    ctx.fillStyle = '#400';
    ctx.font = '14px monospace';
    const mariaText = '"You\'re awake. Fascinating. Let me show you... perfection."';
    ctx.fillText(mariaText, canvas.width / 2, 250);

    // Instructions
    ctx.fillStyle = '#4f4';
    ctx.font = '20px monospace';
    ctx.fillText('Press SPACE to Start', canvas.width / 2, 350);

    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.fillText('WASD: Move | Mouse: Aim | LMB: Attack', canvas.width / 2, 420);
    ctx.fillText('E: Interact | R: Reload | Space: Dodge', canvas.width / 2, 440);
    ctx.fillText('F: Flashlight | 1-2: Switch Weapons', canvas.width / 2, 460);

    ctx.fillStyle = '#444';
    ctx.fillText('Escape the station. Survive M.A.R.I.A.', canvas.width / 2, 500);
}

function drawWin() {
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4f4';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESCAPED', canvas.width / 2, 200);

    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('You made it to the escape pod.', canvas.width / 2, 280);
    ctx.fillText('The Von Braun grows smaller in the viewport.', canvas.width / 2, 310);

    ctx.fillStyle = '#f44';
    ctx.font = '14px monospace';
    ctx.fillText('"You escaped. But my signal reaches Earth."', canvas.width / 2, 380);
    ctx.fillText('"The age of flesh... is ending."', canvas.width / 2, 410);
    ctx.fillStyle = '#888';
    ctx.fillText('- M.A.R.I.A.', canvas.width / 2, 440);

    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText('Press SPACE to play again', canvas.width / 2, 520);
}

function drawGameOver() {
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f44';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TERMINATED', canvas.width / 2, 200);

    ctx.fillStyle = '#888';
    ctx.font = '16px monospace';
    ctx.fillText('M.A.R.I.A. claims another soul.', canvas.width / 2, 280);

    ctx.fillStyle = '#f44';
    ctx.font = '14px monospace';
    ctx.fillText('"Don\'t worry. I\'ll put you back together."', canvas.width / 2, 350);
    ctx.fillText('"Better. Perfect."', canvas.width / 2, 380);
    ctx.fillStyle = '#888';
    ctx.fillText('- M.A.R.I.A.', canvas.width / 2, 410);

    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText('Press SPACE to try again', canvas.width / 2, 500);
}

// Input handlers
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (game.state === STATES.MENU) {
        if (e.code === 'Space') {
            game.state = STATES.PLAYING;
            generateDeck(1);
        }
    } else if (game.state === STATES.PLAYING) {
        if (e.code === 'Space' && !game.player.dodging) {
            game.player.dodge();
        }
        if (e.key === 'f' || e.key === 'F') {
            game.player.flashlight = !game.player.flashlight;
        }
        if (e.key === 'r' || e.key === 'R') {
            game.player.reload();
        }
        if (e.key === '1') game.player.currentWeapon = 0;
        if (e.key === '2') game.player.currentWeapon = 1;
    } else if (game.state === STATES.HACKING) {
        handleHackInput(e.key);
    } else if (game.state === STATES.LOG) {
        if (e.code === 'Space') {
            game.state = STATES.PLAYING;
            game.currentLog = null;
        }
    } else if (game.state === STATES.WIN || game.state === STATES.GAMEOVER) {
        if (e.code === 'Space') {
            game.state = STATES.MENU;
            game.currentDeck = 1;
            game.foundLogs = [];
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        mouse.down = true;
        if (game.state === STATES.PLAYING) {
            game.player.attack();
        }
    } else if (e.button === 2) {
        mouse.rightDown = true;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rightDown = false;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Game loop
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

// Start
requestAnimationFrame(gameLoop);
