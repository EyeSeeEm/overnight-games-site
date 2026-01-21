// Zero Sievert Clone - Extraction Shooter
// Top-down survival with vision cones

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 40;
const VIEW_CONE_ANGLE = Math.PI / 2; // 90 degrees
const VISION_RANGE = 250;

// Game states
const STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    EXTRACTED: 'extracted',
    DEAD: 'dead'
};

// Tile types
const TILES = {
    GRASS: 0,
    DIRT: 1,
    TREE: 2,
    BUSH: 3,
    WALL: 4,
    FLOOR: 5,
    WATER: 6,
    ROAD: 7
};

// Weapons
const WEAPONS = {
    pistol: {
        name: 'PM Pistol',
        damage: 18,
        fireRate: 300,
        magSize: 8,
        maxAmmo: 8,
        spread: 8,
        range: 200,
        bulletSpeed: 500
    },
    smg: {
        name: 'Skorpion',
        damage: 14,
        fireRate: 100,
        magSize: 20,
        maxAmmo: 20,
        spread: 12,
        range: 150,
        bulletSpeed: 450
    },
    shotgun: {
        name: 'Pump Shotgun',
        damage: 8,
        pellets: 8,
        fireRate: 800,
        magSize: 6,
        maxAmmo: 6,
        spread: 25,
        range: 100,
        bulletSpeed: 400
    },
    rifle: {
        name: 'AK-74',
        damage: 28,
        fireRate: 130,
        magSize: 30,
        maxAmmo: 30,
        spread: 6,
        range: 280,
        bulletSpeed: 600
    }
};

// Game state
let game = {
    state: STATES.MENU,
    map: [],
    player: null,
    enemies: [],
    bullets: [],
    loot: [],
    particles: [],
    camera: { x: 0, y: 0 },
    extractionPoint: { x: 0, y: 0 },
    score: 0,
    kills: 0,
    lootCollected: 0,
    raidTime: 0,
    highScore: 0
};

// Input
const keys = {};
const mouse = { x: 0, y: 0, down: false };

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 14;
        this.angle = 0;
        this.speed = 150;
        this.sprintSpeed = 220;
        this.hp = 100;
        this.maxHp = 100;
        this.stamina = 100;
        this.maxStamina = 100;
        this.bleeding = false;
        this.bleedTimer = 0;

        this.weapons = [
            { ...WEAPONS.pistol, ammo: 8 },
            { ...WEAPONS.smg, ammo: 20 },
            { ...WEAPONS.shotgun, ammo: 6 },
            { ...WEAPONS.rifle, ammo: 30 }
        ];
        this.currentWeapon = 0;
        this.fireCooldown = 0;
        this.reloading = false;
        this.reloadTimer = 0;

        this.bandages = 3;
        this.medkits = 1;
    }

    update(dt) {
        // Aim at mouse
        const worldMouseX = mouse.x + game.camera.x;
        const worldMouseY = mouse.y + game.camera.y;
        this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

        // Movement
        let dx = 0, dy = 0;
        if (keys['w'] || keys['W'] || keys['ArrowUp']) dy -= 1;
        if (keys['s'] || keys['S'] || keys['ArrowDown']) dy += 1;
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) dx -= 1;
        if (keys['d'] || keys['D'] || keys['ArrowRight']) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;

            const sprinting = keys['Shift'] && this.stamina > 0;
            const moveSpeed = sprinting ? this.sprintSpeed : this.speed;

            if (sprinting) {
                this.stamina = Math.max(0, this.stamina - dt * 20);
            }

            const newX = this.x + dx * moveSpeed * dt;
            const newY = this.y + dy * moveSpeed * dt;

            if (!this.collides(newX, this.y)) this.x = newX;
            if (!this.collides(this.x, newY)) this.y = newY;
        }

        // Stamina regen
        if (!keys['Shift']) {
            this.stamina = Math.min(this.maxStamina, this.stamina + dt * 15);
        }

        // Bleeding
        if (this.bleeding) {
            this.bleedTimer -= dt;
            this.hp -= dt * 2;

            // Blood particles
            if (Math.random() < dt * 3) {
                game.particles.push({
                    x: this.x + (Math.random() - 0.5) * 10,
                    y: this.y + (Math.random() - 0.5) * 10,
                    vx: 0, vy: 20,
                    life: 2,
                    maxLife: 2,
                    color: '#a00',
                    size: 3
                });
            }

            if (this.bleedTimer <= 0) {
                this.bleeding = false;
            }
        }

        // Fire cooldown
        if (this.fireCooldown > 0) this.fireCooldown -= dt * 1000;

        // Reloading
        if (this.reloading) {
            this.reloadTimer -= dt * 1000;
            if (this.reloadTimer <= 0) {
                const weapon = this.weapons[this.currentWeapon];
                weapon.ammo = weapon.maxAmmo;
                this.reloading = false;
            }
        }

        // Death check
        if (this.hp <= 0) {
            game.state = STATES.DEAD;
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
            if (tile === TILES.TREE || tile === TILES.WALL || tile === TILES.WATER) {
                return true;
            }
        }
        return false;
    }

    shoot() {
        if (this.reloading || this.fireCooldown > 0) return;

        const weapon = this.weapons[this.currentWeapon];
        if (weapon.ammo <= 0) {
            this.reload();
            return;
        }

        this.fireCooldown = weapon.fireRate;
        weapon.ammo--;

        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const spreadRad = (weapon.spread * Math.PI / 180) * (Math.random() - 0.5);
            const bulletAngle = this.angle + spreadRad;

            game.bullets.push({
                x: this.x + Math.cos(this.angle) * 20,
                y: this.y + Math.sin(this.angle) * 20,
                vx: Math.cos(bulletAngle) * weapon.bulletSpeed,
                vy: Math.sin(bulletAngle) * weapon.bulletSpeed,
                damage: weapon.damage,
                range: weapon.range,
                traveled: 0,
                friendly: true
            });
        }

        // Muzzle flash
        game.particles.push({
            x: this.x + Math.cos(this.angle) * 25,
            y: this.y + Math.sin(this.angle) * 25,
            vx: 0, vy: 0,
            life: 0.05,
            maxLife: 0.05,
            color: '#ff0',
            size: 12
        });
    }

    reload() {
        if (this.reloading) return;
        const weapon = this.weapons[this.currentWeapon];
        if (weapon.ammo >= weapon.maxAmmo) return;

        this.reloading = true;
        this.reloadTimer = 1500; // 1.5 seconds
    }

    useBandage() {
        if (this.bandages > 0 && this.bleeding) {
            this.bandages--;
            this.bleeding = false;
            this.hp = Math.min(this.maxHp, this.hp + 10);
        }
    }

    useMedkit() {
        if (this.medkits > 0 && this.hp < this.maxHp) {
            this.medkits--;
            this.bleeding = false;
            this.hp = Math.min(this.maxHp, this.hp + 50);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;

        // Chance to cause bleeding
        if (Math.random() < 0.3) {
            this.bleeding = true;
            this.bleedTimer = 10;
        }

        // Screen shake
        game.screenShake = 8;

        // Blood particles
        for (let i = 0; i < 5; i++) {
            game.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 80,
                vy: (Math.random() - 0.5) * 80,
                life: 0.5,
                maxLife: 0.5,
                color: '#a00',
                size: 4
            });
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - game.camera.x, this.y - game.camera.y);
        ctx.rotate(this.angle);

        // Body
        ctx.fillStyle = '#4a5';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Backpack
        ctx.fillStyle = '#352';
        ctx.fillRect(-8, -5, -6, 10);

        // Weapon
        ctx.fillStyle = '#333';
        ctx.fillRect(8, -3, 15, 6);

        ctx.restore();
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 12;
        this.angle = Math.random() * Math.PI * 2;
        this.state = 'patrol';
        this.alertTimer = 0;
        this.attackCooldown = 0;
        this.patrolTarget = null;
        this.pathTimer = 0;

        switch (type) {
            case 'wolf':
                this.hp = 40;
                this.maxHp = 40;
                this.damage = 15;
                this.speed = 130;
                this.range = 30;
                this.color = '#665';
                this.attackType = 'melee';
                this.viewRange = 150;
                break;
            case 'boar':
                this.hp = 80;
                this.maxHp = 80;
                this.damage = 20;
                this.speed = 100;
                this.range = 35;
                this.color = '#543';
                this.attackType = 'charge';
                this.charging = false;
                this.viewRange = 120;
                break;
            case 'bandit_melee':
                this.hp = 60;
                this.maxHp = 60;
                this.damage = 18;
                this.speed = 90;
                this.range = 35;
                this.color = '#644';
                this.attackType = 'melee';
                this.viewRange = 180;
                break;
            case 'bandit_pistol':
                this.hp = 50;
                this.maxHp = 50;
                this.damage = 12;
                this.speed = 80;
                this.range = 200;
                this.color = '#466';
                this.attackType = 'ranged';
                this.fireRate = 800;
                this.viewRange = 220;
                break;
            case 'bandit_rifle':
                this.hp = 70;
                this.maxHp = 70;
                this.damage = 20;
                this.speed = 70;
                this.range = 280;
                this.color = '#446';
                this.attackType = 'ranged';
                this.fireRate = 500;
                this.viewRange = 250;
                break;
        }
    }

    update(dt) {
        this.attackCooldown -= dt * 1000;
        this.pathTimer -= dt;

        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const distToPlayer = Math.sqrt(dx * dx + dy * dy);
        const angleToPlayer = Math.atan2(dy, dx);

        // Check if player is in view cone
        const canSeePlayer = this.canSee(game.player.x, game.player.y);

        switch (this.state) {
            case 'patrol':
                if (canSeePlayer && distToPlayer < this.viewRange) {
                    this.state = 'chase';
                    this.showAlert();
                } else {
                    // Patrol
                    if (!this.patrolTarget || this.pathTimer <= 0) {
                        this.patrolTarget = this.getRandomPatrolPoint();
                        this.pathTimer = 3 + Math.random() * 2;
                    }
                    this.moveToward(this.patrolTarget.x, this.patrolTarget.y, dt, 0.4);
                }
                break;

            case 'chase':
                this.angle = angleToPlayer;

                if (distToPlayer < this.range) {
                    this.state = 'combat';
                } else if (canSeePlayer) {
                    this.moveToward(game.player.x, game.player.y, dt, 1);
                } else {
                    // Lost sight
                    this.alertTimer -= dt;
                    if (this.alertTimer <= 0) {
                        this.state = 'patrol';
                    } else {
                        // Move to last known position
                        this.moveToward(game.player.x, game.player.y, dt, 0.7);
                    }
                }
                break;

            case 'combat':
                this.angle = angleToPlayer;

                if (distToPlayer > this.range * 1.5 || !canSeePlayer) {
                    this.state = 'chase';
                    this.alertTimer = 5;
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

        if (dist > this.viewRange) return false;

        // Check view cone
        const angleToTarget = Math.atan2(dy, dx);
        const angleDiff = Math.abs(normalizeAngle(angleToTarget - this.angle));
        if (angleDiff > VIEW_CONE_ANGLE / 2) return false;

        // Raycast
        const steps = Math.ceil(dist / 10);
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const px = this.x + dx * t;
            const py = this.y + dy * t;
            const tx = Math.floor(px / TILE_SIZE);
            const ty = Math.floor(py / TILE_SIZE);

            if (tx >= 0 && ty >= 0 && tx < MAP_WIDTH && ty < MAP_HEIGHT) {
                const tile = game.map[ty][tx];
                if (tile === TILES.TREE || tile === TILES.WALL) {
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
        const tx = Math.floor(x / TILE_SIZE);
        const ty = Math.floor(y / TILE_SIZE);
        if (tx < 0 || ty < 0 || tx >= MAP_WIDTH || ty >= MAP_HEIGHT) return true;
        const tile = game.map[ty][tx];
        return tile === TILES.TREE || tile === TILES.WALL || tile === TILES.WATER;
    }

    getRandomPatrolPoint() {
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 80;
        return {
            x: this.x + Math.cos(angle) * dist,
            y: this.y + Math.sin(angle) * dist
        };
    }

    showAlert() {
        this.alertTimer = 8;
        game.particles.push({
            x: this.x,
            y: this.y - 25,
            vx: 0, vy: -15,
            life: 1,
            maxLife: 1,
            color: '#f00',
            size: 8,
            type: 'text',
            text: '!'
        });
    }

    attack() {
        if (this.attackType === 'melee' || this.attackType === 'charge') {
            this.attackCooldown = 1000;
            const dx = game.player.x - this.x;
            const dy = game.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.range + game.player.radius) {
                game.player.takeDamage(this.damage);
            }
        } else {
            // Ranged
            this.attackCooldown = this.fireRate;
            const angle = Math.atan2(game.player.y - this.y, game.player.x - this.x);
            const spread = 0.15 * (Math.random() - 0.5);

            game.bullets.push({
                x: this.x + Math.cos(angle) * 15,
                y: this.y + Math.sin(angle) * 15,
                vx: Math.cos(angle + spread) * 350,
                vy: Math.sin(angle + spread) * 350,
                damage: this.damage,
                range: this.range,
                traveled: 0,
                friendly: false,
                color: '#f84'
            });

            // Muzzle flash
            game.particles.push({
                x: this.x + Math.cos(angle) * 18,
                y: this.y + Math.sin(angle) * 18,
                vx: 0, vy: 0,
                life: 0.05,
                maxLife: 0.05,
                color: '#f80',
                size: 8
            });
        }
    }

    takeDamage(amount) {
        this.hp -= amount;

        // Alert if not already
        if (this.state === 'patrol') {
            this.state = 'chase';
            this.alertTimer = 10;
        }

        // Alert nearby enemies
        for (const enemy of game.enemies) {
            if (enemy !== this && enemy.state === 'patrol') {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                if (Math.sqrt(dx * dx + dy * dy) < 200) {
                    enemy.state = 'chase';
                    enemy.alertTimer = 8;
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

        game.kills++;
        game.score += this.type.includes('bandit') ? 100 : 50;

        // Drop loot
        if (Math.random() < 0.4) {
            const lootType = Math.random() < 0.6 ? 'healing' : 'ammo';
            game.loot.push({
                x: this.x,
                y: this.y,
                type: lootType,
                value: lootType === 'healing' ? 25 : 10,
                radius: 10
            });
        }

        // Death particles
        for (let i = 0; i < 8; i++) {
            game.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 0.8,
                maxLife: 0.8,
                color: this.type.includes('bandit') ? '#a44' : '#654',
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

        if (this.type === 'wolf') {
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius * 1.3, this.radius * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            // Ears
            ctx.fillRect(this.radius * 0.5, -8, 4, 6);
            ctx.fillRect(this.radius * 0.5, 2, 4, 6);
        } else if (this.type === 'boar') {
            ctx.beginPath();
            ctx.ellipse(0, 0, this.radius * 1.4, this.radius, 0, 0, Math.PI * 2);
            ctx.fill();
            // Tusks
            ctx.fillStyle = '#ddc';
            ctx.fillRect(this.radius, -4, 6, 3);
            ctx.fillRect(this.radius, 1, 6, 3);
        } else {
            // Human bandit
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Weapon indicator
            if (this.attackType === 'ranged') {
                ctx.fillStyle = '#333';
                ctx.fillRect(8, -3, 12, 6);
            }
        }

        ctx.restore();

        // Health bar (if damaged)
        if (this.hp < this.maxHp) {
            const barWidth = 28;
            const barHeight = 4;
            ctx.fillStyle = '#400';
            ctx.fillRect(screenX - barWidth/2, screenY - this.radius - 10, barWidth, barHeight);
            ctx.fillStyle = '#f44';
            ctx.fillRect(screenX - barWidth/2, screenY - this.radius - 10, barWidth * (this.hp / this.maxHp), barHeight);
        }

        // Alert indicator
        if (this.state !== 'patrol') {
            ctx.fillStyle = this.state === 'combat' ? '#f00' : '#f80';
            ctx.beginPath();
            ctx.arc(screenX, screenY - this.radius - 15, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Map generation
function generateMap() {
    game.map = [];
    game.enemies = [];
    game.loot = [];
    game.bullets = [];
    game.particles = [];

    // Initialize with grass
    for (let y = 0; y < MAP_HEIGHT; y++) {
        game.map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (Math.random() < 0.3) {
                game.map[y][x] = TILES.DIRT;
            } else {
                game.map[y][x] = TILES.GRASS;
            }
        }
    }

    // Add trees
    for (let i = 0; i < 150; i++) {
        const tx = Math.floor(Math.random() * MAP_WIDTH);
        const ty = Math.floor(Math.random() * MAP_HEIGHT);
        game.map[ty][tx] = TILES.TREE;
    }

    // Add bushes
    for (let i = 0; i < 80; i++) {
        const tx = Math.floor(Math.random() * MAP_WIDTH);
        const ty = Math.floor(Math.random() * MAP_HEIGHT);
        if (game.map[ty][tx] !== TILES.TREE) {
            game.map[ty][tx] = TILES.BUSH;
        }
    }

    // Add a road
    const roadY = MAP_HEIGHT - 5;
    for (let x = 0; x < MAP_WIDTH; x++) {
        game.map[roadY][x] = TILES.ROAD;
        game.map[roadY + 1][x] = TILES.ROAD;
    }

    // Add buildings (bandit camp)
    addBuilding(20, 10, 6, 5);
    addBuilding(30, 8, 5, 4);
    addBuilding(38, 12, 4, 4);

    // Add water pond
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
            const wx = 10 + dx;
            const wy = 25 + dy;
            if (Math.abs(dx) + Math.abs(dy) < 4) {
                game.map[wy][wx] = TILES.WATER;
            }
        }
    }

    // Clear spawn area
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            game.map[MAP_HEIGHT - 3 + dy][3 + dx] = TILES.GRASS;
        }
    }

    // Player spawn
    game.player = new Player(3 * TILE_SIZE + TILE_SIZE/2, (MAP_HEIGHT - 3) * TILE_SIZE + TILE_SIZE/2);

    // Extraction point (far side of map)
    game.extractionPoint = {
        x: (MAP_WIDTH - 4) * TILE_SIZE,
        y: 5 * TILE_SIZE
    };
    // Clear extraction area
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const ex = Math.floor(game.extractionPoint.x / TILE_SIZE) + dx;
            const ey = Math.floor(game.extractionPoint.y / TILE_SIZE) + dy;
            if (ex >= 0 && ey >= 0 && ex < MAP_WIDTH && ey < MAP_HEIGHT) {
                game.map[ey][ex] = TILES.GRASS;
            }
        }
    }

    // Spawn enemies
    spawnEnemies();

    // Spawn loot containers
    spawnLoot();

    // Reset stats
    game.score = 0;
    game.kills = 0;
    game.lootCollected = 0;
    game.raidTime = 0;
    game.screenShake = 0;
}

function addBuilding(bx, by, w, h) {
    for (let y = by; y < by + h; y++) {
        for (let x = bx; x < bx + w; x++) {
            if (x === bx || x === bx + w - 1 || y === by || y === by + h - 1) {
                game.map[y][x] = TILES.WALL;
            } else {
                game.map[y][x] = TILES.FLOOR;
            }
        }
    }
    // Door
    game.map[by + h - 1][bx + Math.floor(w/2)] = TILES.FLOOR;
}

function spawnEnemies() {
    const enemyTypes = ['wolf', 'wolf', 'boar', 'bandit_melee', 'bandit_pistol', 'bandit_rifle'];

    // Spawn wildlife in forest areas
    for (let i = 0; i < 8; i++) {
        const x = (5 + Math.random() * 20) * TILE_SIZE;
        const y = (5 + Math.random() * 25) * TILE_SIZE;
        const type = Math.random() < 0.6 ? 'wolf' : 'boar';
        game.enemies.push(new Enemy(x, y, type));
    }

    // Spawn bandits near buildings
    for (let i = 0; i < 6; i++) {
        const x = (18 + Math.random() * 25) * TILE_SIZE;
        const y = (5 + Math.random() * 15) * TILE_SIZE;
        const type = ['bandit_melee', 'bandit_pistol', 'bandit_rifle'][Math.floor(Math.random() * 3)];
        game.enemies.push(new Enemy(x, y, type));
    }

    // Spawn near extraction (guards)
    for (let i = 0; i < 3; i++) {
        const x = game.extractionPoint.x + (Math.random() - 0.5) * 200;
        const y = game.extractionPoint.y + 100 + Math.random() * 150;
        const type = Math.random() < 0.5 ? 'bandit_rifle' : 'bandit_pistol';
        game.enemies.push(new Enemy(x, y, type));
    }
}

function spawnLoot() {
    // Scatter loot around the map
    for (let i = 0; i < 20; i++) {
        const x = (3 + Math.random() * (MAP_WIDTH - 6)) * TILE_SIZE;
        const y = (3 + Math.random() * (MAP_HEIGHT - 6)) * TILE_SIZE;

        // Check if valid position
        const tx = Math.floor(x / TILE_SIZE);
        const ty = Math.floor(y / TILE_SIZE);
        if (game.map[ty][tx] !== TILES.TREE && game.map[ty][tx] !== TILES.WALL && game.map[ty][tx] !== TILES.WATER) {
            // 2:1 ratio healing to ammo
            const isHealing = Math.random() < 0.67;
            game.loot.push({
                x: x,
                y: y,
                type: isHealing ? 'healing' : 'ammo',
                value: isHealing ? 20 : 15,
                radius: 10
            });
        }
    }

    // Valuable loot in buildings
    game.loot.push({
        x: 22 * TILE_SIZE,
        y: 12 * TILE_SIZE,
        type: 'valuable',
        value: 500,
        radius: 10
    });
    game.loot.push({
        x: 32 * TILE_SIZE,
        y: 10 * TILE_SIZE,
        type: 'valuable',
        value: 300,
        radius: 10
    });
}

// Utility
function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

// Check if position is in player's view cone
function isInPlayerView(x, y) {
    const dx = x - game.player.x;
    const dy = y - game.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > VISION_RANGE) return false;

    const angleToTarget = Math.atan2(dy, dx);
    const angleDiff = Math.abs(normalizeAngle(angleToTarget - game.player.angle));

    if (angleDiff > VIEW_CONE_ANGLE / 2) return false;

    // Raycast check
    const steps = Math.ceil(dist / 10);
    for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const px = game.player.x + dx * t;
        const py = game.player.y + dy * t;
        const tx = Math.floor(px / TILE_SIZE);
        const ty = Math.floor(py / TILE_SIZE);

        if (tx >= 0 && ty >= 0 && tx < MAP_WIDTH && ty < MAP_HEIGHT) {
            const tile = game.map[ty][tx];
            if (tile === TILES.TREE || tile === TILES.WALL) {
                return false;
            }
        }
    }

    return true;
}

// Update
function update(dt) {
    if (game.state !== STATES.PLAYING) return;

    game.raidTime += dt;

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

    // Update enemies
    for (const enemy of game.enemies) {
        enemy.update(dt);
    }

    // Update bullets
    for (let i = game.bullets.length - 1; i >= 0; i--) {
        const bullet = game.bullets[i];
        const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.traveled += speed * dt;

        // Range check
        if (bullet.traveled > bullet.range) {
            game.bullets.splice(i, 1);
            continue;
        }

        // Wall collision
        const tx = Math.floor(bullet.x / TILE_SIZE);
        const ty = Math.floor(bullet.y / TILE_SIZE);
        if (tx < 0 || ty < 0 || tx >= MAP_WIDTH || ty >= MAP_HEIGHT ||
            game.map[ty][tx] === TILES.TREE || game.map[ty][tx] === TILES.WALL) {
            game.bullets.splice(i, 1);
            continue;
        }

        // Entity collision
        if (bullet.friendly) {
            for (const enemy of game.enemies) {
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                if (Math.sqrt(dx * dx + dy * dy) < enemy.radius) {
                    enemy.takeDamage(bullet.damage);
                    game.bullets.splice(i, 1);

                    // Hit effect
                    for (let j = 0; j < 3; j++) {
                        game.particles.push({
                            x: bullet.x,
                            y: bullet.y,
                            vx: (Math.random() - 0.5) * 60,
                            vy: (Math.random() - 0.5) * 60,
                            life: 0.3,
                            maxLife: 0.3,
                            color: '#f80',
                            size: 3
                        });
                    }
                    break;
                }
            }
        } else {
            const dx = bullet.x - game.player.x;
            const dy = bullet.y - game.player.y;
            if (Math.sqrt(dx * dx + dy * dy) < game.player.radius) {
                game.player.takeDamage(bullet.damage);
                game.bullets.splice(i, 1);
            }
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

    // Loot pickup
    for (let i = game.loot.length - 1; i >= 0; i--) {
        const loot = game.loot[i];
        const dx = loot.x - game.player.x;
        const dy = loot.y - game.player.y;

        if (Math.sqrt(dx * dx + dy * dy) < game.player.radius + loot.radius) {
            if (loot.type === 'healing') {
                game.player.hp = Math.min(game.player.maxHp, game.player.hp + loot.value);
            } else if (loot.type === 'ammo') {
                // Add ammo to all weapons
                for (const weapon of game.player.weapons) {
                    weapon.ammo = Math.min(weapon.maxAmmo, weapon.ammo + Math.floor(loot.value / 3));
                }
            } else if (loot.type === 'valuable') {
                game.score += loot.value;
            }
            game.lootCollected++;
            game.loot.splice(i, 1);
        }
    }

    // Extraction check
    const extractDx = game.extractionPoint.x - game.player.x;
    const extractDy = game.extractionPoint.y - game.player.y;
    if (Math.sqrt(extractDx * extractDx + extractDy * extractDy) < 50) {
        if (keys['e'] || keys['E']) {
            game.state = STATES.EXTRACTED;
            game.score += Math.floor(game.raidTime) * 10; // Survival bonus
            if (game.score > game.highScore) {
                game.highScore = game.score;
            }
        }
    }

    // Shooting
    if (mouse.down) {
        game.player.shoot();
    }
}

// Draw
function drawTile(x, y, tile) {
    const screenX = x * TILE_SIZE - game.camera.x;
    const screenY = y * TILE_SIZE - game.camera.y;

    if (screenX < -TILE_SIZE || screenX > canvas.width ||
        screenY < -TILE_SIZE || screenY > canvas.height) return;

    switch (tile) {
        case TILES.GRASS:
            ctx.fillStyle = '#2a3a2a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            break;
        case TILES.DIRT:
            ctx.fillStyle = '#3a3528';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            break;
        case TILES.TREE:
            ctx.fillStyle = '#2a3a2a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            // Tree trunk and foliage
            ctx.fillStyle = '#432';
            ctx.fillRect(screenX + 12, screenY + 20, 8, 12);
            ctx.fillStyle = '#253';
            ctx.beginPath();
            ctx.arc(screenX + 16, screenY + 12, 14, 0, Math.PI * 2);
            ctx.fill();
            break;
        case TILES.BUSH:
            ctx.fillStyle = '#2a3a2a';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#354';
            ctx.beginPath();
            ctx.arc(screenX + 10, screenY + 16, 8, 0, Math.PI * 2);
            ctx.arc(screenX + 22, screenY + 18, 9, 0, Math.PI * 2);
            ctx.fill();
            break;
        case TILES.WALL:
            ctx.fillStyle = '#555';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#666';
            ctx.fillRect(screenX, screenY, TILE_SIZE, 4);
            break;
        case TILES.FLOOR:
            ctx.fillStyle = '#443';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#332';
            ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            break;
        case TILES.WATER:
            ctx.fillStyle = '#235';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = `rgba(100, 150, 200, ${0.3 + Math.sin(Date.now() / 500 + x + y) * 0.1})`;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            break;
        case TILES.ROAD:
            ctx.fillStyle = '#333';
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            if (x % 4 < 2) {
                ctx.fillStyle = '#aa3';
                ctx.fillRect(screenX + 12, screenY + TILE_SIZE/2 - 1, 8, 2);
            }
            break;
    }
}

function drawVisibilityOverlay() {
    // Create darkness outside view cone
    ctx.save();

    // Fill entire screen with darkness
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cut out view cone
    ctx.globalCompositeOperation = 'destination-out';

    const playerScreenX = game.player.x - game.camera.x;
    const playerScreenY = game.player.y - game.camera.y;

    // Draw view cone with raycasting
    ctx.beginPath();
    ctx.moveTo(playerScreenX, playerScreenY);

    const numRays = 60;
    for (let i = 0; i <= numRays; i++) {
        const rayAngle = game.player.angle - VIEW_CONE_ANGLE / 2 + (VIEW_CONE_ANGLE * i / numRays);

        // Cast ray
        let rayDist = VISION_RANGE;
        for (let d = 10; d < VISION_RANGE; d += 5) {
            const rx = game.player.x + Math.cos(rayAngle) * d;
            const ry = game.player.y + Math.sin(rayAngle) * d;
            const tx = Math.floor(rx / TILE_SIZE);
            const ty = Math.floor(ry / TILE_SIZE);

            if (tx >= 0 && ty >= 0 && tx < MAP_WIDTH && ty < MAP_HEIGHT) {
                const tile = game.map[ty][tx];
                if (tile === TILES.TREE || tile === TILES.WALL) {
                    rayDist = d;
                    break;
                }
            }
        }

        const endX = playerScreenX + Math.cos(rayAngle) * rayDist;
        const endY = playerScreenY + Math.sin(rayAngle) * rayDist;
        ctx.lineTo(endX, endY);
    }

    ctx.closePath();

    // Create gradient for soft edges
    const gradient = ctx.createRadialGradient(playerScreenX, playerScreenY, 0, playerScreenX, playerScreenY, VISION_RANGE);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
}

function draw() {
    ctx.fillStyle = '#1a1a18';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (game.state === STATES.MENU) {
        drawMenu();
        return;
    }

    if (game.state === STATES.EXTRACTED) {
        drawExtracted();
        return;
    }

    if (game.state === STATES.DEAD) {
        drawDead();
        return;
    }

    // Draw map
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            drawTile(x, y, game.map[y][x]);
        }
    }

    // Draw extraction point
    const extractScreenX = game.extractionPoint.x - game.camera.x;
    const extractScreenY = game.extractionPoint.y - game.camera.y;
    ctx.fillStyle = `rgba(68, 255, 68, ${0.3 + Math.sin(Date.now() / 300) * 0.2})`;
    ctx.beginPath();
    ctx.arc(extractScreenX, extractScreenY, 40 + Math.sin(Date.now() / 200) * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4f4';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRACT', extractScreenX, extractScreenY - 50);
    ctx.fillText('[E]', extractScreenX, extractScreenY + 5);

    // Draw loot
    for (const loot of game.loot) {
        const screenX = loot.x - game.camera.x;
        const screenY = loot.y - game.camera.y;

        ctx.fillStyle = loot.type === 'healing' ? '#4f4' :
                       loot.type === 'ammo' ? '#ff0' : '#f80';
        ctx.beginPath();
        ctx.arc(screenX, screenY, loot.radius, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(loot.type === 'healing' ? '+' : loot.type === 'ammo' ? 'A' : '$',
                    screenX, screenY + 4);
    }

    // Draw enemies (only if in view)
    for (const enemy of game.enemies) {
        if (isInPlayerView(enemy.x, enemy.y)) {
            enemy.draw();
        }
    }

    // Draw bullets
    for (const bullet of game.bullets) {
        ctx.fillStyle = bullet.color || '#ff0';
        ctx.beginPath();
        ctx.arc(bullet.x - game.camera.x, bullet.y - game.camera.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw player
    game.player.draw();

    // Draw particles
    for (const p of game.particles) {
        const alpha = p.life / p.maxLife;

        if (p.type === 'text') {
            ctx.fillStyle = p.color;
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            ctx.globalAlpha = alpha;
            ctx.fillText(p.text, p.x - game.camera.x, p.y - game.camera.y);
            ctx.globalAlpha = 1;
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
    drawVisibilityOverlay();

    // Draw HUD
    drawHUD();
}

function drawHUD() {
    // Health bar
    ctx.fillStyle = '#400';
    ctx.fillRect(10, 10, 180, 20);
    ctx.fillStyle = game.player.bleeding ? '#f44' : '#4a4';
    ctx.fillRect(10, 10, 180 * (game.player.hp / game.player.maxHp), 20);
    ctx.strokeStyle = '#644';
    ctx.strokeRect(10, 10, 180, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${Math.ceil(game.player.hp)}/${game.player.maxHp}${game.player.bleeding ? ' [BLEEDING]' : ''}`, 100, 24);

    // Stamina bar
    ctx.fillStyle = '#004';
    ctx.fillRect(10, 35, 180, 12);
    ctx.fillStyle = '#44a';
    ctx.fillRect(10, 35, 180 * (game.player.stamina / game.player.maxStamina), 12);
    ctx.strokeStyle = '#446';
    ctx.strokeRect(10, 35, 180, 12);

    // Weapon info
    const weapon = game.player.weapons[game.player.currentWeapon];
    ctx.fillStyle = '#222';
    ctx.fillRect(10, canvas.height - 80, 200, 70);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(10, canvas.height - 80, 200, 70);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(weapon.name, 20, canvas.height - 60);

    ctx.font = '16px monospace';
    ctx.fillStyle = weapon.ammo === 0 ? '#f44' : '#ff0';
    ctx.fillText(`${weapon.ammo}/${weapon.maxAmmo}`, 20, canvas.height - 40);

    if (game.player.reloading) {
        ctx.fillStyle = '#888';
        ctx.fillText('RELOADING...', 80, canvas.height - 40);
    }

    // Quick slots
    ctx.font = '10px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(`[Q] Bandage: ${game.player.bandages}  [F] Medkit: ${game.player.medkits}`, 20, canvas.height - 20);

    // Weapon selection
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    for (let i = 0; i < game.player.weapons.length; i++) {
        const wx = 220 + i * 70;
        ctx.fillStyle = i === game.player.currentWeapon ? '#446' : '#222';
        ctx.fillRect(wx, canvas.height - 35, 65, 25);
        ctx.strokeStyle = i === game.player.currentWeapon ? '#88f' : '#444';
        ctx.strokeRect(wx, canvas.height - 35, 65, 25);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}: ${game.player.weapons[i].name.split(' ')[0]}`, wx + 32, canvas.height - 18);
    }

    // Score & stats
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${game.score}`, canvas.width - 10, 24);
    ctx.fillText(`Kills: ${game.kills}`, canvas.width - 10, 44);
    ctx.fillText(`Time: ${Math.floor(game.raidTime)}s`, canvas.width - 10, 64);

    // Extraction distance
    const extractDx = game.extractionPoint.x - game.player.x;
    const extractDy = game.extractionPoint.y - game.player.y;
    const extractDist = Math.floor(Math.sqrt(extractDx * extractDx + extractDy * extractDy) / TILE_SIZE);
    ctx.fillStyle = '#4f4';
    ctx.fillText(`Extract: ${extractDist}m`, canvas.width - 10, 84);

    // Extraction prompt
    if (extractDist < 2) {
        ctx.fillStyle = '#4f4';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Press E to EXTRACT', canvas.width / 2, canvas.height / 2 - 100);
    }

    // Controls hint
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WASD: Move | Mouse: Aim | LMB: Shoot | R: Reload | 1-4: Weapons | Shift: Sprint', canvas.width / 2, canvas.height - 5);
}

function drawMenu() {
    ctx.fillStyle = '#0a0a08';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4a5';
    ctx.font = 'bold 42px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ZERO SIEVERT', canvas.width / 2, 150);

    ctx.fillStyle = '#686';
    ctx.font = '20px monospace';
    ctx.fillText('Extraction Shooter', canvas.width / 2, 185);

    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText('Survive the wasteland. Collect loot. Extract.', canvas.width / 2, 250);

    ctx.fillStyle = '#4f4';
    ctx.font = '22px monospace';
    ctx.fillText('Click to Start Raid', canvas.width / 2, 350);

    if (game.highScore > 0) {
        ctx.fillStyle = '#ff0';
        ctx.font = '16px monospace';
        ctx.fillText(`High Score: ${game.highScore}`, canvas.width / 2, 420);
    }

    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.fillText('Controls:', canvas.width / 2, 480);
    ctx.fillText('WASD: Move | Mouse: Aim | LMB: Shoot | R: Reload', canvas.width / 2, 500);
    ctx.fillText('1-4: Switch Weapons | Q: Bandage | F: Medkit | E: Interact', canvas.width / 2, 520);
    ctx.fillText('Shift: Sprint', canvas.width / 2, 540);
}

function drawExtracted() {
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4f4';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXTRACTED!', canvas.width / 2, 150);

    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Raid Summary:', canvas.width / 2, 230);

    ctx.font = '16px monospace';
    ctx.fillText(`Kills: ${game.kills}`, canvas.width / 2, 280);
    ctx.fillText(`Loot Collected: ${game.lootCollected}`, canvas.width / 2, 310);
    ctx.fillText(`Survival Time: ${Math.floor(game.raidTime)}s`, canvas.width / 2, 340);

    ctx.fillStyle = '#ff0';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`Total Score: ${game.score}`, canvas.width / 2, 400);

    if (game.score >= game.highScore) {
        ctx.fillStyle = '#f80';
        ctx.fillText('NEW HIGH SCORE!', canvas.width / 2, 440);
    }

    ctx.fillStyle = '#888';
    ctx.font = '18px monospace';
    ctx.fillText('Click to Start New Raid', canvas.width / 2, 520);
}

function drawDead() {
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f44';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('K.I.A.', canvas.width / 2, 150);

    ctx.fillStyle = '#888';
    ctx.font = '18px monospace';
    ctx.fillText('You died in the wasteland.', canvas.width / 2, 220);

    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Kills: ${game.kills}`, canvas.width / 2, 290);
    ctx.fillText(`Loot Lost: ${game.lootCollected}`, canvas.width / 2, 320);
    ctx.fillText(`Survival Time: ${Math.floor(game.raidTime)}s`, canvas.width / 2, 350);

    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.fillText('All loot has been lost.', canvas.width / 2, 410);

    ctx.fillStyle = '#888';
    ctx.font = '18px monospace';
    ctx.fillText('Click to Try Again', canvas.width / 2, 500);
}

// Input handlers
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (game.state === STATES.PLAYING) {
        if (e.key === 'r' || e.key === 'R') {
            game.player.reload();
        }
        if (e.key === 'q' || e.key === 'Q') {
            game.player.useBandage();
        }
        if (e.key === 'f' || e.key === 'F') {
            game.player.useMedkit();
        }
        if (e.key >= '1' && e.key <= '4') {
            game.player.currentWeapon = parseInt(e.key) - 1;
            game.player.reloading = false;
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

        if (game.state === STATES.MENU || game.state === STATES.EXTRACTED || game.state === STATES.DEAD) {
            generateMap();
            game.state = STATES.PLAYING;
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
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
