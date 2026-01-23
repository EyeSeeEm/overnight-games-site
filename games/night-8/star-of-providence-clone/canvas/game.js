// Star of Providence Clone - Canvas Implementation
// A bullet-hell roguelike shooter - EXPANDED VERSION

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Colors matching reference - darker palette
const COLORS = {
    bg: '#0a0a14',
    uiGreen: '#22cc44',
    uiGreenDark: '#116622',
    uiGreenBright: '#44ff66',
    uiOrange: '#dd6622',
    uiRed: '#cc3333',
    uiCyan: '#44aacc',
    uiYellow: '#ddcc22',
    wallBrown: '#664422',
    wallDark: '#442211',
    floorDark: '#1a0a0a',
    floorMid: '#2a1212',
    white: '#ffffff',
    black: '#000000',
    heart: '#22cc44',
    enemy: '#cc6622',
    bullet: '#ffff44',
    playerBullet: '#44ffff',
    skull: '#ddddcc',
    fireball: '#ff4400'
};

// Game State
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    BOSS: 'boss',
    TRANSITION: 'transition',
    GAME_OVER: 'game_over',
    VICTORY: 'victory',
    UPGRADE: 'upgrade',
    SHOP: 'shop'
};

// Weapon definitions with enhanced stats
const WEAPONS = {
    peashooter: { name: 'Peashooter', damage: 5, maxAmmo: Infinity, fireRate: 6, velocity: 12, color: '#44ffff', sound: 'pew' },
    vulcan: { name: 'Vulcan', damage: 15, maxAmmo: 500, fireRate: 4, velocity: 14, color: '#ffff44', sound: 'rapid' },
    laser: { name: 'Laser', damage: 115, maxAmmo: 100, fireRate: 40, velocity: 50, color: '#ff44ff', pierce: true, sound: 'laser' },
    fireball: { name: 'Fireball', damage: 80, maxAmmo: 90, fireRate: 50, velocity: 6, color: '#ff6622', aoe: true, aoeRadius: 40, sound: 'fire' },
    revolver: { name: 'Revolver', damage: 35, maxAmmo: 250, fireRate: 12, velocity: 16, color: '#ffcc44', clip: 6, sound: 'bang' },
    sword: { name: 'Sword', damage: 90, maxAmmo: 125, fireRate: 25, velocity: 0, color: '#88ccff', melee: true, sound: 'slash' }
};

// Keyword modifiers
const KEYWORDS = {
    homing: { name: 'Homing', damageMod: 1.0, ammoMod: 1.0, desc: 'Tracks enemies' },
    triple: { name: 'Triple', damageMod: 0.5, ammoMod: 1.5, desc: 'Fires 3 shots' },
    highCaliber: { name: 'High-Caliber', damageMod: 3.5, ammoMod: 0.56, desc: 'Slow but powerful' }
};

// Enemy definitions with skull theme
const ENEMY_TYPES = {
    ghost: { hp: 50, speed: 1, behavior: 'chase', color: '#88aacc', size: 20, points: 10, revenge: true },
    crazyGhost: { hp: 100, speed: 3.5, behavior: 'dash', color: '#cc88aa', size: 22, points: 25 },
    drone: { hp: 70, speed: 2.5, behavior: 'dash', color: '#888899', size: 18, points: 20 },
    turret: { hp: 90, speed: 0, behavior: 'stationary', color: '#666677', size: 24, points: 30 },
    seeker: { hp: 120, speed: 1.5, behavior: 'wander', color: '#44aa88', size: 22, points: 35 },
    swarmer: { hp: 12, speed: 4.5, behavior: 'chase', color: '#aa4444', size: 10, points: 5 },
    blob: { hp: 150, speed: 0.8, behavior: 'bounce', color: '#44aacc', size: 30, points: 40, splits: true },
    pyromancer: { hp: 110, speed: 0.8, behavior: 'wander', color: '#ff6622', size: 24, points: 45, fireball: true },
    hermit: { hp: 125, speed: 0.3, behavior: 'stationary', color: '#886688', size: 28, points: 50, spawner: true },
    bumper: { hp: 120, speed: 2.5, behavior: 'bounce', color: '#aa8844', size: 26, points: 35, ringOnDeath: true }
};

// Boss definitions
const BOSSES = {
    chamberlord: { name: 'CHAMBERLORD', hp: 1500, floor: 1, color: '#cc8844' },
    wraithking: { name: 'WRAITHKING', hp: 2000, floor: 2, color: '#8844cc' },
    coreGuardian: { name: 'CORE GUARDIAN', hp: 2500, floor: 3, color: '#44cccc' }
};

// Shop items
const SHOP_ITEMS = [
    { name: 'Health Pack', cost: 50, effect: (p) => { p.hp = Math.min(p.hp + 2, p.maxHp); }, desc: '+2 HP' },
    { name: 'Ammo Box', cost: 30, effect: (p) => { p.ammo = Math.min(p.ammo + 100, p.maxAmmo); }, desc: '+100 Ammo' },
    { name: 'Extra Bomb', cost: 75, effect: (p) => { p.bombs = Math.min(p.bombs + 1, p.maxBombs); }, desc: '+1 Bomb' },
    { name: 'Shield', cost: 100, effect: (p) => { p.shields = Math.min(p.shields + 1, 3); }, desc: '+1 Shield' },
    { name: 'Damage Up', cost: 150, effect: (p) => { p.damageBonus += 0.15; }, desc: '+15% DMG' }
];

// Game class
class Game {
    constructor() {
        this.state = GameState.MENU;
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.pickups = [];
        this.particles = [];
        this.decorations = [];
        this.hazards = [];
        this.floor = 1;
        this.room = { x: 2, y: 2 };
        this.rooms = {};
        this.debris = 0;
        this.multiplier = 1.0;
        this.multiplierDecay = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.boss = null;
        this.showDebug = false;
        this.showMap = false;
        this.frameCount = 0;
        this.fps = 60;
        this.lastFpsUpdate = 0;
        this.fpsCounter = 0;
        this.transitionTimer = 0;
        this.transitionDir = null;
        this.upgradeChoices = [];
        this.screenShake = 0;
        this.screenShakeIntensity = 0;
        this.wave = 0;
        this.totalKills = 0;
        this.totalDamageDealt = 0;
        this.roomsExplored = 0;
        this.shopItems = [];

        this.keys = {};
        this.mouse = { x: 400, y: 300, down: false };

        this.setupInput();
        this.generateFloor();
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === 'q') this.showDebug = !this.showDebug;
            if (e.key === 'Tab') { e.preventDefault(); this.showMap = !this.showMap; }
            if (e.key === 'Escape') this.togglePause();
            if (e.key === ' ' && this.state === GameState.MENU) this.startGame();
            if (e.key === 'r' && (this.state === GameState.GAME_OVER || this.state === GameState.VICTORY)) {
                this.restart();
            }
            if (this.state === GameState.UPGRADE && e.key >= '1' && e.key <= '3') {
                this.selectUpgrade(parseInt(e.key) - 1);
            }
            if (this.state === GameState.SHOP && e.key >= '1' && e.key <= '5') {
                this.buyShopItem(parseInt(e.key) - 1);
            }
            if (this.state === GameState.SHOP && e.key === 'e') {
                this.exitShop();
            }
        });
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            if (this.state === GameState.MENU) this.startGame();
        });
        canvas.addEventListener('mouseup', () => this.mouse.down = false);
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    startGame() {
        this.state = GameState.PLAYING;
        this.player = new Player(400, 450);
        this.floor = 1;
        this.room = { x: 2, y: 2 };
        this.debris = 0;
        this.multiplier = 1.0;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalKills = 0;
        this.totalDamageDealt = 0;
        this.roomsExplored = 1;
        this.generateFloor();
        this.spawnEnemiesForRoom();
    }

    restart() {
        this.state = GameState.MENU;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.pickups = [];
        this.particles = [];
        this.decorations = [];
        this.hazards = [];
        this.boss = null;
    }

    togglePause() {
        if (this.state === GameState.PLAYING || this.state === GameState.BOSS) {
            this.state = GameState.PAUSED;
        } else if (this.state === GameState.PAUSED) {
            this.state = this.boss ? GameState.BOSS : GameState.PLAYING;
        }
    }

    addScreenShake(intensity, duration) {
        this.screenShake = duration;
        this.screenShakeIntensity = intensity;
    }

    generateFloor() {
        this.rooms = {};
        const size = 4 + this.floor;

        // Generate connected rooms
        const visited = new Set();
        const queue = [{ x: 2, y: 2 }];
        visited.add('2,2');

        // Start room is always safe
        this.rooms['2,2'] = { type: 'start', cleared: true, enemies: 0, decorations: [] };

        // Generate more rooms
        let roomCount = 0;
        const maxRooms = 8 + this.floor * 2;

        while (queue.length > 0 && roomCount < maxRooms) {
            const current = queue.shift();
            const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];

            for (const dir of dirs) {
                const nx = current.x + dir.x;
                const ny = current.y + dir.y;
                const key = `${nx},${ny}`;

                if (!visited.has(key) && nx >= 0 && nx < size && ny >= 0 && ny < size && Math.random() < 0.6) {
                    visited.add(key);
                    roomCount++;

                    let type = 'normal';
                    if (roomCount === maxRooms - 1) type = 'boss';
                    else if (Math.random() < 0.15) type = 'shop';
                    else if (Math.random() < 0.12) type = 'upgrade';
                    else if (Math.random() < 0.1) type = 'treasure';

                    // Generate room decorations
                    const decorations = [];
                    if (type === 'normal' || type === 'boss') {
                        const numDecos = Math.floor(Math.random() * 4) + 1;
                        for (let d = 0; d < numDecos; d++) {
                            decorations.push({
                                x: 100 + Math.random() * 600,
                                y: 100 + Math.random() * 350,
                                type: ['pillar', 'debris', 'bones', 'crack'][Math.floor(Math.random() * 4)]
                            });
                        }
                    }

                    // Generate hazards for later floors
                    const hazards = [];
                    if (this.floor >= 2 && type === 'normal' && Math.random() < 0.3) {
                        const numHazards = Math.floor(Math.random() * 3) + 1;
                        for (let h = 0; h < numHazards; h++) {
                            hazards.push({
                                x: 100 + Math.random() * 600,
                                y: 100 + Math.random() * 350,
                                type: Math.random() < 0.5 ? 'spikes' : 'fire',
                                timer: 0
                            });
                        }
                    }

                    this.rooms[key] = {
                        type,
                        cleared: false,
                        enemies: type === 'normal' ? 3 + this.floor + Math.floor(Math.random() * 3) : 0,
                        doors: [],
                        decorations,
                        hazards,
                        hasChest: type === 'treasure'
                    };

                    queue.push({ x: nx, y: ny });
                }
            }
        }

        // Ensure boss room exists
        let hasBoss = false;
        for (const key in this.rooms) {
            if (this.rooms[key].type === 'boss') hasBoss = true;
        }
        if (!hasBoss) {
            const keys = Object.keys(this.rooms).filter(k => k !== '2,2');
            if (keys.length > 0) {
                this.rooms[keys[keys.length - 1]].type = 'boss';
            }
        }

        // Calculate doors
        for (const key in this.rooms) {
            const [x, y] = key.split(',').map(Number);
            const doors = [];
            if (this.rooms[`${x},${y-1}`]) doors.push('up');
            if (this.rooms[`${x},${y+1}`]) doors.push('down');
            if (this.rooms[`${x-1},${y}`]) doors.push('left');
            if (this.rooms[`${x+1},${y}`]) doors.push('right');
            this.rooms[key].doors = doors;
        }
    }

    getCurrentRoom() {
        return this.rooms[`${this.room.x},${this.room.y}`] || { type: 'normal', cleared: true, doors: [], decorations: [], hazards: [] };
    }

    spawnEnemiesForRoom() {
        const room = this.getCurrentRoom();
        if (room.cleared || room.type === 'start' || room.type === 'shop' || room.type === 'treasure') {
            // Setup decorations and hazards
            this.decorations = room.decorations || [];
            this.hazards = room.hazards || [];

            // Spawn chest in treasure room
            if (room.type === 'treasure' && room.hasChest) {
                this.pickups.push({ x: 400, y: 300, type: 'chest' });
            }
            return;
        }

        this.enemies = [];
        this.decorations = room.decorations || [];
        this.hazards = room.hazards || [];

        this.wave++;
        const count = room.enemies || (3 + this.floor * 2);
        const types = Object.keys(ENEMY_TYPES);

        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * Math.min(types.length, 3 + this.floor * 2))];
            const x = 100 + Math.random() * 600;
            const y = 100 + Math.random() * 350;
            this.enemies.push(new Enemy(x, y, type));
        }
    }

    spawnBoss() {
        this.state = GameState.BOSS;
        const bossKeys = Object.keys(BOSSES);
        const bossType = bossKeys[Math.min(this.floor - 1, bossKeys.length - 1)];
        this.boss = new Boss(400, 150, bossType);
        this.enemies = [];
        this.decorations = [];
        this.addScreenShake(5, 30);
    }

    enterShop() {
        this.state = GameState.SHOP;
        // Generate random shop items
        this.shopItems = [];
        const shuffled = [...SHOP_ITEMS].sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(3, shuffled.length); i++) {
            this.shopItems.push({ ...shuffled[i] });
        }
    }

    buyShopItem(index) {
        if (index >= 0 && index < this.shopItems.length) {
            const item = this.shopItems[index];
            if (this.debris >= item.cost) {
                this.debris -= item.cost;
                item.effect(this.player);
                this.shopItems.splice(index, 1);
                this.spawnParticles(400, 300, COLORS.uiYellow, 10);
            }
        }
    }

    exitShop() {
        this.state = GameState.PLAYING;
        this.getCurrentRoom().cleared = true;
    }

    transitionRoom(dir) {
        if (this.state === GameState.TRANSITION) return;

        const newRoom = { ...this.room };
        if (dir === 'up') newRoom.y--;
        if (dir === 'down') newRoom.y++;
        if (dir === 'left') newRoom.x--;
        if (dir === 'right') newRoom.x++;

        if (!this.rooms[`${newRoom.x},${newRoom.y}`]) return;

        this.state = GameState.TRANSITION;
        this.transitionDir = dir;
        this.transitionTimer = 30;
        this.roomsExplored++;

        setTimeout(() => {
            this.room = newRoom;
            this.bullets = [];
            this.enemyBullets = [];
            this.pickups = [];

            // Reposition player
            if (dir === 'up') this.player.y = 520;
            if (dir === 'down') this.player.y = 80;
            if (dir === 'left') this.player.x = 720;
            if (dir === 'right') this.player.x = 80;

            const room = this.getCurrentRoom();
            if (room.type === 'boss' && !room.cleared) {
                this.spawnBoss();
            } else if (room.type === 'shop' && !room.cleared) {
                this.enterShop();
            } else {
                this.state = GameState.PLAYING;
                this.spawnEnemiesForRoom();
            }
        }, 500);
    }

    showUpgradeScreen() {
        this.state = GameState.UPGRADE;
        this.upgradeChoices = [
            { name: '+2 Max HP', icon: 'heart', effect: () => { this.player.maxHp += 2; this.player.hp = Math.min(this.player.hp + 2, this.player.maxHp); }},
            { name: '+15% Damage', icon: 'sword', effect: () => { this.player.damageBonus += 0.15; }},
            { name: '+1 Bomb', icon: 'bomb', effect: () => { this.player.bombs = Math.min(this.player.bombs + 1, this.player.maxBombs); }}
        ];
    }

    selectUpgrade(index) {
        if (index >= 0 && index < this.upgradeChoices.length) {
            this.upgradeChoices[index].effect();
            this.spawnParticles(400, 350, COLORS.uiGreen, 20);
            this.advanceFloor();
        }
    }

    advanceFloor() {
        this.floor++;
        if (this.floor > 3) {
            this.state = GameState.VICTORY;
        } else {
            this.room = { x: 2, y: 2 };
            this.generateFloor();
            this.state = GameState.PLAYING;
            this.boss = null;
        }
    }

    update() {
        this.frameCount++;
        this.fpsCounter++;

        if (Date.now() - this.lastFpsUpdate > 1000) {
            this.fps = this.fpsCounter;
            this.fpsCounter = 0;
            this.lastFpsUpdate = Date.now();
        }

        // Screen shake decay
        if (this.screenShake > 0) this.screenShake--;

        if (this.state === GameState.PLAYING || this.state === GameState.BOSS) {
            this.player.update(this);

            // Update hazards
            for (const h of this.hazards) {
                h.timer++;
                if (h.type === 'fire' && h.timer % 60 < 30) {
                    // Fire damage
                    if (Math.hypot(h.x - this.player.x, h.y - this.player.y) < 25) {
                        this.player.takeDamage(1);
                    }
                }
                if (h.type === 'spikes') {
                    if (Math.hypot(h.x - this.player.x, h.y - this.player.y) < 20) {
                        this.player.takeDamage(1);
                    }
                }
            }

            // Update enemies
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                this.enemies[i].update(this);
                if (this.enemies[i].hp <= 0) {
                    this.onEnemyDeath(this.enemies[i]);
                    this.enemies.splice(i, 1);
                }
            }

            // Update boss
            if (this.boss) {
                this.boss.update(this);
                if (this.boss.hp <= 0) {
                    this.onBossDeath();
                }
            }

            // Update bullets
            this.updateBullets();

            // Update enemy bullets
            this.updateEnemyBullets();

            // Update pickups
            this.updatePickups();

            // Update particles
            this.updateParticles();

            // Check room clear
            if (this.enemies.length === 0 && this.state === GameState.PLAYING) {
                const room = this.getCurrentRoom();
                if (!room.cleared && room.type === 'normal') {
                    room.cleared = true;
                    this.player.roomsCleared++;
                    if (this.player.roomsCleared % 3 === 0) {
                        this.player.bombs = Math.min(this.player.bombs + 1, this.player.maxBombs);
                    }
                    // Chance to spawn weapon pickup
                    if (Math.random() < 0.2) {
                        const weapons = Object.keys(WEAPONS).filter(w => w !== 'peashooter');
                        const wpn = weapons[Math.floor(Math.random() * weapons.length)];
                        this.pickups.push({ x: 400, y: 300, type: 'weapon', weapon: wpn });
                    }
                }
            }

            // Multiplier/combo decay
            this.multiplierDecay++;
            if (this.multiplierDecay > 90) {
                this.multiplier = Math.max(1.0, this.multiplier - 0.02);
                this.combo = Math.max(0, this.combo - 1);
                this.multiplierDecay = 0;
            }

            // Check player death
            if (this.player.hp <= 0) {
                this.state = GameState.GAME_OVER;
                this.addScreenShake(10, 30);
            }
        }

        if (this.state === GameState.TRANSITION) {
            this.transitionTimer--;
        }
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];

            // Homing behavior
            if (b.homing) {
                let closest = null;
                let minDist = Infinity;
                const targets = this.boss ? [this.boss, ...this.enemies] : this.enemies;
                for (const e of targets) {
                    const dist = Math.hypot(e.x - b.x, e.y - b.y);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = e;
                    }
                }
                if (closest && minDist < 250) {
                    const angle = Math.atan2(closest.y - b.y, closest.x - b.x);
                    b.vx += Math.cos(angle) * 0.6;
                    b.vy += Math.sin(angle) * 0.6;
                    const speed = Math.hypot(b.vx, b.vy);
                    b.vx = (b.vx / speed) * b.speed;
                    b.vy = (b.vy / speed) * b.speed;
                }
            }

            b.x += b.vx;
            b.y += b.vy;

            // Trail particles
            if (this.frameCount % 3 === 0) {
                this.particles.push({
                    x: b.x, y: b.y,
                    vx: 0, vy: 0,
                    color: b.color,
                    life: 8,
                    size: 2
                });
            }

            // Check enemy collision
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (Math.hypot(b.x - e.x, b.y - e.y) < e.size + b.size) {
                    e.hp -= b.damage;
                    this.totalDamageDealt += b.damage;
                    this.spawnParticles(b.x, b.y, b.color, 4);
                    this.addScreenShake(1, 3);

                    // AoE damage for fireball
                    if (b.aoe) {
                        for (const other of this.enemies) {
                            if (other !== e && Math.hypot(b.x - other.x, b.y - other.y) < b.aoeRadius) {
                                other.hp -= b.damage * 0.5;
                            }
                        }
                        this.spawnParticles(b.x, b.y, COLORS.fireball, 15);
                        this.addScreenShake(3, 5);
                    }

                    if (!b.pierce) {
                        this.bullets.splice(i, 1);
                        break;
                    }
                }
            }

            // Check boss collision
            if (this.boss && Math.hypot(b.x - this.boss.x, b.y - this.boss.y) < this.boss.size + b.size) {
                if (!this.boss.invulnerable) {
                    this.boss.hp -= b.damage;
                    this.totalDamageDealt += b.damage;
                    this.spawnParticles(b.x, b.y, b.color, 4);
                    this.addScreenShake(2, 4);
                }
                if (!b.pierce) {
                    this.bullets.splice(i, 1);
                    continue;
                }
            }

            // Remove off-screen bullets
            if (b.x < 0 || b.x > 800 || b.y < 50 || b.y > 550) {
                this.bullets.splice(i, 1);
            }
        }
    }

    updateEnemyBullets() {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const b = this.enemyBullets[i];
            b.x += b.vx;
            b.y += b.vy;

            // Check player collision
            const playerHitRadius = this.player.focusing ? 3 : this.player.size;
            if (!this.player.invulnerable && !this.player.iFrames &&
                Math.hypot(b.x - this.player.x, b.y - this.player.y) < playerHitRadius + b.size) {

                // Check shields first
                if (this.player.shields > 0) {
                    this.player.shields--;
                    this.spawnParticles(this.player.x, this.player.y, COLORS.uiCyan, 8);
                } else {
                    this.player.takeDamage(1);
                    this.multiplier = Math.max(1.0, this.multiplier - 0.5);
                    this.combo = 0;
                    this.addScreenShake(5, 10);
                }
                this.enemyBullets.splice(i, 1);
                continue;
            }

            // Remove off-screen bullets
            if (b.x < 0 || b.x > 800 || b.y < 50 || b.y > 550) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }

    updatePickups() {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const p = this.pickups[i];
            const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);

            // Magnet effect for debris
            if (p.type === 'debris' && dist < 100) {
                const angle = Math.atan2(this.player.y - p.y, this.player.x - p.x);
                p.x += Math.cos(angle) * 3;
                p.y += Math.sin(angle) * 3;
            }

            if (dist < 30) {
                if (p.type === 'debris') {
                    this.debris += Math.floor(p.value * this.multiplier);
                    this.spawnParticles(p.x, p.y, COLORS.uiYellow, 3);
                } else if (p.type === 'health') {
                    this.player.hp = Math.min(this.player.hp + 1, this.player.maxHp);
                    this.spawnParticles(p.x, p.y, COLORS.heart, 5);
                } else if (p.type === 'ammo') {
                    this.player.ammo = Math.min(this.player.ammo + 50, this.player.maxAmmo);
                    this.spawnParticles(p.x, p.y, COLORS.uiCyan, 5);
                } else if (p.type === 'weapon') {
                    this.player.currentWeapon = p.weapon;
                    this.player.ammo = WEAPONS[p.weapon].maxAmmo === Infinity ? this.player.ammo : Math.min(this.player.ammo + 200, this.player.maxAmmo);
                    this.spawnParticles(p.x, p.y, WEAPONS[p.weapon].color, 10);
                } else if (p.type === 'chest') {
                    // Open chest - give random reward
                    this.debris += 100 + Math.floor(Math.random() * 100);
                    this.player.ammo = Math.min(this.player.ammo + 100, this.player.maxAmmo);
                    if (Math.random() < 0.5) {
                        this.player.hp = Math.min(this.player.hp + 1, this.player.maxHp);
                    }
                    this.spawnParticles(p.x, p.y, COLORS.uiYellow, 20);
                    this.getCurrentRoom().hasChest = false;
                }
                this.pickups.splice(i, 1);
            }
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity || 0;
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    onEnemyDeath(enemy) {
        this.totalKills++;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.multiplier = Math.min(this.multiplier + 0.1 + this.combo * 0.01, 10.0);
        this.multiplierDecay = 0;

        // Drop debris
        const value = ENEMY_TYPES[enemy.type].points || 10;
        this.pickups.push({ x: enemy.x, y: enemy.y, type: 'debris', value });

        // Chance for health/ammo drop
        if (Math.random() < 0.08) {
            this.pickups.push({ x: enemy.x + 10, y: enemy.y, type: 'health' });
        }
        if (Math.random() < 0.12) {
            this.pickups.push({ x: enemy.x - 10, y: enemy.y, type: 'ammo' });
        }

        // Spawn death particles
        this.spawnParticles(enemy.x, enemy.y, ENEMY_TYPES[enemy.type].color, 10);
        this.addScreenShake(2, 5);

        // Revenge bullet (ghost)
        if (ENEMY_TYPES[enemy.type].revenge) {
            const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
            this.enemyBullets.push({
                x: enemy.x, y: enemy.y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: 8,
                color: '#aaccff'
            });
        }

        // Ring on death (bumper)
        if (ENEMY_TYPES[enemy.type].ringOnDeath) {
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                this.enemyBullets.push({
                    x: enemy.x, y: enemy.y,
                    vx: Math.cos(a) * 3,
                    vy: Math.sin(a) * 3,
                    size: 6,
                    color: COLORS.uiOrange
                });
            }
        }

        // Split behavior (blob)
        if (ENEMY_TYPES[enemy.type].splits && enemy.size > 15) {
            for (let i = 0; i < 2; i++) {
                const child = new Enemy(enemy.x + (i * 20 - 10), enemy.y, 'swarmer');
                child.hp = 30;
                this.enemies.push(child);
            }
        }
    }

    onBossDeath() {
        this.spawnParticles(this.boss.x, this.boss.y, this.boss.color, 50);
        this.debris += 500 * this.floor;
        this.totalKills++;
        this.addScreenShake(15, 45);
        this.boss = null;
        this.getCurrentRoom().cleared = true;
        this.showUpgradeScreen();
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                life: 15 + Math.random() * 25,
                size: 2 + Math.random() * 3,
                gravity: 0.1
            });
        }
    }

    useBomb() {
        if (this.player.bombs > 0) {
            this.player.bombs--;

            // Clear all enemy bullets
            this.enemyBullets = [];

            // Damage all enemies
            for (const e of this.enemies) {
                e.hp -= 75;
            }

            // Damage boss
            if (this.boss) {
                this.boss.hp -= 150;
            }

            // Visual effect - big explosion
            for (let i = 0; i < 100; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 200;
                this.particles.push({
                    x: this.player.x + Math.cos(angle) * dist,
                    y: this.player.y + Math.sin(angle) * dist,
                    vx: Math.cos(angle) * 2,
                    vy: Math.sin(angle) * 2,
                    color: ['#ffffff', '#ffff44', '#ff4444'][Math.floor(Math.random() * 3)],
                    life: 30 + Math.random() * 20,
                    size: 3 + Math.random() * 4
                });
            }
            this.addScreenShake(10, 20);
        }
    }

    render() {
        // Apply screen shake
        ctx.save();
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity;
            ctx.translate(shakeX, shakeY);
        }

        // Clear
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, 800, 600);

        if (this.state === GameState.MENU) {
            this.renderMenu();
        } else if (this.state === GameState.GAME_OVER) {
            this.renderGameOver();
        } else if (this.state === GameState.VICTORY) {
            this.renderVictory();
        } else if (this.state === GameState.UPGRADE) {
            this.renderUpgradeScreen();
        } else if (this.state === GameState.SHOP) {
            this.renderShopScreen();
        } else {
            this.renderGame();
        }

        if (this.showDebug) {
            this.renderDebug();
        }

        ctx.restore();
    }

    renderMenu() {
        // Animated background
        for (let i = 0; i < 50; i++) {
            const x = (i * 123 + this.frameCount * 0.5) % 800;
            const y = (i * 77 + this.frameCount * 0.3) % 600;
            ctx.fillStyle = `rgba(34, 204, 68, ${0.1 + Math.sin(this.frameCount * 0.05 + i) * 0.05})`;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = COLORS.uiGreen;
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STAR OF PROVIDENCE', 400, 180);

        ctx.fillStyle = COLORS.uiGreenDark;
        ctx.font = '20px monospace';
        ctx.fillText('A Bullet-Hell Roguelike', 400, 220);

        // Animated ship
        const shipY = 300 + Math.sin(this.frameCount * 0.05) * 10;
        ctx.fillStyle = COLORS.white;
        ctx.beginPath();
        ctx.moveTo(400, shipY - 20);
        ctx.lineTo(385, shipY + 15);
        ctx.lineTo(415, shipY + 15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = COLORS.uiCyan;
        ctx.beginPath();
        ctx.moveTo(392, shipY + 15);
        ctx.lineTo(400, shipY + 28);
        ctx.lineTo(408, shipY + 15);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = COLORS.uiOrange;
        ctx.font = '24px monospace';
        ctx.fillText('Press SPACE or Click to Start', 400, 400);

        ctx.fillStyle = COLORS.white;
        ctx.font = '14px monospace';
        ctx.fillText('WASD/Arrows - Move | Shift - Focus | Space - Shoot', 400, 480);
        ctx.fillText('Z - Dash | X - Bomb | Tab - Map | Q - Debug', 400, 505);
        ctx.fillText('1-6 - Switch Weapons', 400, 530);
    }

    renderGame() {
        // Draw room
        this.renderRoom();

        // Draw hazards
        for (const h of this.hazards) {
            if (h.type === 'spikes') {
                ctx.fillStyle = '#666666';
                for (let s = 0; s < 3; s++) {
                    ctx.beginPath();
                    ctx.moveTo(h.x - 10 + s * 10, h.y + 10);
                    ctx.lineTo(h.x - 5 + s * 10, h.y - 10);
                    ctx.lineTo(h.x + s * 10, h.y + 10);
                    ctx.closePath();
                    ctx.fill();
                }
            } else if (h.type === 'fire') {
                const flicker = Math.sin(this.frameCount * 0.2 + h.x) * 5;
                ctx.fillStyle = h.timer % 60 < 30 ? '#ff4400' : '#ff8800';
                ctx.beginPath();
                ctx.arc(h.x, h.y, 15 + flicker, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.arc(h.x, h.y - 5, 8 + flicker * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw decorations
        for (const d of this.decorations) {
            ctx.fillStyle = COLORS.wallDark;
            if (d.type === 'pillar') {
                ctx.fillRect(d.x - 15, d.y - 25, 30, 50);
                ctx.fillStyle = COLORS.wallBrown;
                ctx.fillRect(d.x - 18, d.y - 30, 36, 8);
                ctx.fillRect(d.x - 18, d.y + 22, 36, 8);
            } else if (d.type === 'debris') {
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(d.x + i * 8 - 16, d.y + (i % 2) * 5, 6, 6);
                }
            } else if (d.type === 'bones') {
                ctx.fillStyle = COLORS.skull;
                ctx.beginPath();
                ctx.arc(d.x, d.y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(d.x - 15, d.y + 5, 30, 4);
            } else if (d.type === 'crack') {
                ctx.strokeStyle = '#111111';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(d.x - 10, d.y - 10);
                ctx.lineTo(d.x, d.y);
                ctx.lineTo(d.x + 5, d.y + 15);
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x + 12, d.y - 5);
                ctx.stroke();
            }
        }

        // Draw pickups
        for (const p of this.pickups) {
            if (p.type === 'debris') {
                ctx.fillStyle = COLORS.uiYellow;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5 + Math.sin(this.frameCount * 0.1) * 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'health') {
                ctx.fillStyle = COLORS.heart;
                this.drawHeart(p.x, p.y, 10);
            } else if (p.type === 'ammo') {
                ctx.fillStyle = COLORS.uiCyan;
                ctx.fillRect(p.x - 5, p.y - 8, 10, 16);
                ctx.fillStyle = '#88ddff';
                ctx.fillRect(p.x - 3, p.y - 6, 6, 4);
            } else if (p.type === 'weapon') {
                ctx.fillStyle = WEAPONS[p.weapon].color;
                ctx.strokeStyle = COLORS.white;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 12 + Math.sin(this.frameCount * 0.1) * 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = COLORS.white;
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(p.weapon[0].toUpperCase(), p.x, p.y + 4);
            } else if (p.type === 'chest') {
                ctx.fillStyle = '#886622';
                ctx.fillRect(p.x - 20, p.y - 12, 40, 24);
                ctx.fillStyle = '#aa8833';
                ctx.fillRect(p.x - 18, p.y - 10, 36, 10);
                ctx.fillStyle = COLORS.uiYellow;
                ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
            }
        }

        // Draw enemies
        for (const e of this.enemies) {
            e.render(ctx);
        }

        // Draw boss
        if (this.boss) {
            this.boss.render(ctx);
        }

        // Draw player
        this.player.render(ctx);

        // Draw bullets
        for (const b of this.bullets) {
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();
            // Glow effect
            ctx.fillStyle = b.color + '44';
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw enemy bullets
        for (const b of this.enemyBullets) {
            ctx.fillStyle = b.color || COLORS.enemy;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw particles
        for (const p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.min(1, p.life / 20);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Draw HUD
        this.renderHUD();

        // Draw map overlay
        if (this.showMap) {
            this.renderMap();
        }

        // Draw boss HP bar
        if (this.boss) {
            this.renderBossHP();
        }

        // Transition effect
        if (this.state === GameState.TRANSITION) {
            ctx.fillStyle = COLORS.black;
            ctx.globalAlpha = 1 - (this.transitionTimer / 30);
            ctx.fillRect(0, 0, 800, 600);
            ctx.globalAlpha = 1;
        }

        // Pause overlay
        if (this.state === GameState.PAUSED) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, 0, 800, 600);
            ctx.fillStyle = COLORS.uiGreen;
            ctx.font = '48px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', 400, 280);
            ctx.font = '18px monospace';
            ctx.fillText('Press ESC to resume', 400, 330);

            // Show stats while paused
            ctx.font = '14px monospace';
            ctx.fillStyle = COLORS.white;
            ctx.fillText(`Kills: ${this.totalKills} | Combo: ${this.combo} | Max Combo: ${this.maxCombo}`, 400, 400);
            ctx.fillText(`Damage Dealt: ${this.totalDamageDealt} | Rooms: ${this.roomsExplored}`, 400, 425);
        }
    }

    renderRoom() {
        const room = this.getCurrentRoom();

        // Floor
        ctx.fillStyle = COLORS.floorDark;
        ctx.fillRect(50, 50, 700, 500);

        // Floor pattern - darker checkerboard
        for (let x = 0; x < 14; x++) {
            for (let y = 0; y < 10; y++) {
                if ((x + y) % 2 === 0) {
                    ctx.fillStyle = COLORS.floorMid;
                    ctx.fillRect(50 + x * 50, 50 + y * 50, 50, 50);
                }
            }
        }

        // Walls with skull pattern
        ctx.fillStyle = COLORS.wallBrown;
        ctx.fillRect(0, 0, 800, 50);
        ctx.fillRect(0, 550, 800, 50);
        ctx.fillRect(0, 0, 50, 600);
        ctx.fillRect(750, 0, 50, 600);

        // Wall details - brick pattern
        ctx.fillStyle = COLORS.wallDark;
        for (let i = 0; i < 16; i++) {
            ctx.fillRect(i * 50, 0, 24, 24);
            ctx.fillRect(i * 50 + 25, 25, 24, 24);
            ctx.fillRect(i * 50, 550, 24, 24);
            ctx.fillRect(i * 50 + 25, 575, 24, 24);
        }
        for (let i = 0; i < 12; i++) {
            ctx.fillRect(0, i * 50, 24, 24);
            ctx.fillRect(25, i * 50 + 25, 24, 24);
            ctx.fillRect(750, i * 50, 24, 24);
            ctx.fillRect(775, i * 50 + 25, 24, 24);
        }

        // Doors with indicators
        const doors = room.doors || [];
        const canPass = room.cleared || room.type === 'start' || this.enemies.length === 0;

        if (doors.includes('up')) {
            ctx.fillStyle = canPass ? COLORS.uiGreen : COLORS.uiGreenDark;
            ctx.fillRect(375, 0, 50, 50);
            if (canPass) {
                ctx.fillStyle = COLORS.uiGreenBright;
                ctx.beginPath();
                ctx.moveTo(400, 10);
                ctx.lineTo(385, 35);
                ctx.lineTo(415, 35);
                ctx.closePath();
                ctx.fill();
            }
        }
        if (doors.includes('down')) {
            ctx.fillStyle = canPass ? COLORS.uiGreen : COLORS.uiGreenDark;
            ctx.fillRect(375, 550, 50, 50);
            if (canPass) {
                ctx.fillStyle = COLORS.uiGreenBright;
                ctx.beginPath();
                ctx.moveTo(400, 590);
                ctx.lineTo(385, 565);
                ctx.lineTo(415, 565);
                ctx.closePath();
                ctx.fill();
            }
        }
        if (doors.includes('left')) {
            ctx.fillStyle = canPass ? COLORS.uiGreen : COLORS.uiGreenDark;
            ctx.fillRect(0, 275, 50, 50);
            if (canPass) {
                ctx.fillStyle = COLORS.uiGreenBright;
                ctx.beginPath();
                ctx.moveTo(10, 300);
                ctx.lineTo(35, 285);
                ctx.lineTo(35, 315);
                ctx.closePath();
                ctx.fill();
            }
        }
        if (doors.includes('right')) {
            ctx.fillStyle = canPass ? COLORS.uiGreen : COLORS.uiGreenDark;
            ctx.fillRect(750, 275, 50, 50);
            if (canPass) {
                ctx.fillStyle = COLORS.uiGreenBright;
                ctx.beginPath();
                ctx.moveTo(790, 300);
                ctx.lineTo(765, 285);
                ctx.lineTo(765, 315);
                ctx.closePath();
                ctx.fill();
            }
        }

        // Room type indicator
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        if (room.type === 'shop') {
            ctx.fillStyle = COLORS.uiYellow;
            ctx.fillText('$ SHOP $', 400, 90);
        } else if (room.type === 'upgrade') {
            ctx.fillStyle = COLORS.uiCyan;
            ctx.fillText('UPGRADE', 400, 90);
        } else if (room.type === 'boss') {
            ctx.fillStyle = COLORS.uiRed;
            ctx.fillText('!! BOSS !!', 400, 90);
        } else if (room.type === 'treasure') {
            ctx.fillStyle = COLORS.uiYellow;
            ctx.fillText('TREASURE', 400, 90);
        }
    }

    renderHUD() {
        // Top HUD background
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 0, 800, 48);

        // Weapon box (left)
        ctx.strokeStyle = COLORS.uiGreen;
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 4, 130, 40);

        const weapon = WEAPONS[this.player.currentWeapon];
        ctx.fillStyle = weapon.color;
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(weapon.name, 16, 20);

        // Ammo bar
        const ammoText = weapon.maxAmmo === Infinity ? '∞' : this.player.ammo;
        ctx.fillStyle = COLORS.uiGreen;
        ctx.font = '11px monospace';
        ctx.fillText(`${ammoText}`, 16, 38);

        // Keyword
        if (this.player.weaponKeyword) {
            ctx.fillStyle = COLORS.uiOrange;
            ctx.fillText(KEYWORDS[this.player.weaponKeyword].name, 70, 38);
        }

        // Health (center-left)
        const heartStartX = 160;
        ctx.fillStyle = COLORS.heart;
        for (let i = 0; i < this.player.maxHp; i++) {
            if (i < this.player.hp) {
                this.drawHeart(heartStartX + i * 18, 24, 7);
            } else {
                ctx.strokeStyle = COLORS.heart;
                ctx.lineWidth = 1;
                this.drawHeartOutline(heartStartX + i * 18, 24, 7);
            }
        }

        // Shields (after health)
        if (this.player.shields > 0) {
            ctx.fillStyle = COLORS.uiCyan;
            ctx.font = '12px monospace';
            ctx.fillText(`+${this.player.shields}`, heartStartX + this.player.maxHp * 18 + 5, 28);
        }

        // Bombs
        const bombStartX = 350;
        ctx.fillStyle = COLORS.uiOrange;
        for (let i = 0; i < this.player.bombs; i++) {
            ctx.beginPath();
            ctx.arc(bombStartX + i * 16, 24, 7, 0, Math.PI * 2);
            ctx.fill();
        }

        // Combo display
        if (this.combo > 0) {
            ctx.fillStyle = this.combo > 10 ? COLORS.uiOrange : COLORS.white;
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.combo}x COMBO`, 500, 28);
        }

        // Multiplier and Debris (right)
        ctx.strokeStyle = COLORS.uiGreen;
        ctx.strokeRect(660, 4, 130, 40);

        ctx.fillStyle = this.multiplier > 2 ? COLORS.uiOrange : COLORS.uiGreen;
        ctx.textAlign = 'right';
        ctx.font = 'bold 15px monospace';
        ctx.fillText(`X${this.multiplier.toFixed(1)}`, 780, 20);
        ctx.fillStyle = COLORS.uiYellow;
        ctx.font = '13px monospace';
        ctx.fillText(`${this.debris}G`, 780, 38);

        // Floor/Wave indicator (bottom left)
        ctx.fillStyle = COLORS.uiGreen;
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`FLOOR ${this.floor} | WAVE ${this.wave}`, 10, 590);

        // Minimap (bottom right)
        this.renderMinimap(715, 555, 75, 35);
    }

    renderMinimap(x, y, w, h) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = COLORS.uiGreen;
        ctx.strokeRect(x, y, w, h);

        const scale = 8;
        const offsetX = x + w/2;
        const offsetY = y + h/2;

        for (const key in this.rooms) {
            const [rx, ry] = key.split(',').map(Number);
            const px = offsetX + (rx - this.room.x) * scale;
            const py = offsetY + (ry - this.room.y) * scale;

            const room = this.rooms[key];
            if (rx === this.room.x && ry === this.room.y) {
                ctx.fillStyle = COLORS.white;
            } else if (room.cleared) {
                ctx.fillStyle = COLORS.uiGreenDark;
            } else if (room.type === 'boss') {
                ctx.fillStyle = COLORS.uiRed;
            } else if (room.type === 'shop') {
                ctx.fillStyle = COLORS.uiYellow;
            } else {
                ctx.fillStyle = COLORS.uiGreen;
            }

            ctx.fillRect(px - 3, py - 3, 6, 6);
        }
    }

    renderMap() {
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(150, 100, 500, 400);

        ctx.strokeStyle = COLORS.uiGreen;
        ctx.lineWidth = 2;
        ctx.strokeRect(150, 100, 500, 400);

        ctx.fillStyle = COLORS.uiGreen;
        ctx.font = '22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`FLOOR ${this.floor} MAP`, 400, 135);

        const scale = 45;
        const offsetX = 400;
        const offsetY = 300;

        for (const key in this.rooms) {
            const [rx, ry] = key.split(',').map(Number);
            const px = offsetX + (rx - 2) * scale;
            const py = offsetY + (ry - 2) * scale;

            const room = this.rooms[key];

            // Room fill
            if (rx === this.room.x && ry === this.room.y) {
                ctx.fillStyle = COLORS.white;
            } else if (room.cleared) {
                ctx.fillStyle = COLORS.uiGreenDark;
            } else if (room.type === 'boss') {
                ctx.fillStyle = COLORS.uiRed;
            } else if (room.type === 'shop') {
                ctx.fillStyle = COLORS.uiYellow;
            } else if (room.type === 'upgrade' || room.type === 'treasure') {
                ctx.fillStyle = COLORS.uiCyan;
            } else {
                ctx.fillStyle = COLORS.uiGreen;
            }

            ctx.fillRect(px - 15, py - 15, 30, 30);

            // Connections
            ctx.strokeStyle = COLORS.uiGreen;
            ctx.lineWidth = 3;
            for (const door of room.doors) {
                ctx.beginPath();
                ctx.moveTo(px, py);
                if (door === 'up') ctx.lineTo(px, py - scale);
                if (door === 'down') ctx.lineTo(px, py + scale);
                if (door === 'left') ctx.lineTo(px - scale, py);
                if (door === 'right') ctx.lineTo(px + scale, py);
                ctx.stroke();
            }
        }

        // Legend
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        const legendY = 470;
        ctx.fillStyle = COLORS.white;
        ctx.fillText('WHITE=You', 165, legendY);
        ctx.fillStyle = COLORS.uiRed;
        ctx.fillText('RED=Boss', 260, legendY);
        ctx.fillStyle = COLORS.uiYellow;
        ctx.fillText('YEL=Shop', 345, legendY);
        ctx.fillStyle = COLORS.uiCyan;
        ctx.fillText('CYAN=Special', 435, legendY);
        ctx.fillStyle = COLORS.uiGreenDark;
        ctx.fillText('DRK=Cleared', 540, legendY);
    }

    renderBossHP() {
        const barWidth = 600;
        const barHeight = 22;
        const x = 100;
        const y = 58;

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);

        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, barWidth, barHeight);

        const hpPercent = this.boss.hp / this.boss.maxHp;
        const barColor = hpPercent > 0.5 ? COLORS.uiRed : (hpPercent > 0.25 ? '#ff6600' : '#ff0000');
        ctx.fillStyle = barColor;
        ctx.fillRect(x, y, barWidth * hpPercent, barHeight);

        ctx.strokeStyle = COLORS.uiGreen;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);

        ctx.fillStyle = COLORS.white;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.boss.name, 400, y + 16);

        // Phase indicator
        ctx.font = '10px monospace';
        ctx.fillText(`PHASE ${this.boss.phase}`, 400, y + barHeight + 12);
    }

    renderUpgradeScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, 800, 600);

        ctx.fillStyle = COLORS.uiGreen;
        ctx.font = '36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CHOOSE ONE', 400, 130);
        ctx.fillStyle = COLORS.uiOrange;
        ctx.font = '24px monospace';
        ctx.fillText('SALVAGE', 400, 165);

        for (let i = 0; i < this.upgradeChoices.length; i++) {
            const choice = this.upgradeChoices[i];
            const x = 130 + i * 200;
            const y = 250;

            ctx.strokeStyle = i === 0 ? COLORS.uiGreen : COLORS.uiOrange;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, 160, 150);

            ctx.fillStyle = ctx.strokeStyle;
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(choice.name, x + 80, y + 80);
            ctx.font = '14px monospace';
            ctx.fillText(`Press ${i + 1}`, x + 80, y + 130);
        }

        ctx.fillStyle = COLORS.white;
        ctx.font = '18px monospace';
        ctx.fillText(`Floor ${this.floor} Complete!`, 400, 450);
        ctx.font = '14px monospace';
        ctx.fillText(`Kills: ${this.totalKills} | Max Combo: ${this.maxCombo}`, 400, 480);
    }

    renderShopScreen() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, 800, 600);

        ctx.fillStyle = COLORS.uiYellow;
        ctx.font = '36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('$ SHOP $', 400, 100);

        ctx.fillStyle = COLORS.white;
        ctx.font = '18px monospace';
        ctx.fillText(`Your Debris: ${this.debris}G`, 400, 140);

        for (let i = 0; i < this.shopItems.length; i++) {
            const item = this.shopItems[i];
            const x = 150 + i * 180;
            const y = 200;

            const canAfford = this.debris >= item.cost;
            ctx.strokeStyle = canAfford ? COLORS.uiYellow : '#666666';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, 160, 180);

            ctx.fillStyle = canAfford ? COLORS.white : '#666666';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(item.name, x + 80, y + 50);

            ctx.font = '12px monospace';
            ctx.fillText(item.desc, x + 80, y + 80);

            ctx.fillStyle = canAfford ? COLORS.uiYellow : '#666666';
            ctx.font = 'bold 16px monospace';
            ctx.fillText(`${item.cost}G`, x + 80, y + 120);

            ctx.font = '12px monospace';
            ctx.fillText(`Press ${i + 1}`, x + 80, y + 160);
        }

        ctx.fillStyle = COLORS.uiGreen;
        ctx.font = '16px monospace';
        ctx.fillText('Press E to Exit Shop', 400, 450);
    }

    renderGameOver() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, 800, 600);

        ctx.fillStyle = COLORS.uiRed;
        ctx.font = '56px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', 400, 200);

        ctx.fillStyle = COLORS.white;
        ctx.font = '18px monospace';
        ctx.fillText(`Floor: ${this.floor}`, 400, 280);
        ctx.fillText(`Debris: ${this.debris}G`, 400, 310);
        ctx.fillText(`Total Kills: ${this.totalKills}`, 400, 340);
        ctx.fillText(`Max Combo: ${this.maxCombo}`, 400, 370);
        ctx.fillText(`Rooms Explored: ${this.roomsExplored}`, 400, 400);

        ctx.fillStyle = COLORS.uiGreen;
        ctx.font = '22px monospace';
        ctx.fillText('Press R to Restart', 400, 480);
    }

    renderVictory() {
        // Celebration particles
        if (this.frameCount % 5 === 0) {
            this.spawnParticles(Math.random() * 800, Math.random() * 600,
                ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 5)], 3);
        }

        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, 800, 600);

        ctx.fillStyle = COLORS.uiGreen;
        ctx.font = '56px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', 400, 180);

        ctx.fillStyle = COLORS.white;
        ctx.font = '20px monospace';
        ctx.fillText('You have escaped the facility!', 400, 250);

        ctx.font = '16px monospace';
        ctx.fillText(`Final Debris: ${this.debris}G`, 400, 320);
        ctx.fillText(`Total Kills: ${this.totalKills}`, 400, 350);
        ctx.fillText(`Max Combo: ${this.maxCombo}`, 400, 380);
        ctx.fillText(`Damage Dealt: ${this.totalDamageDealt}`, 400, 410);
        ctx.fillText(`Rooms Explored: ${this.roomsExplored}`, 400, 440);

        ctx.fillStyle = COLORS.uiOrange;
        ctx.font = '22px monospace';
        ctx.fillText('Press R to Play Again', 400, 520);

        // Draw particles
        for (const p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 40;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    renderDebug() {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(5, 52, 190, 230);

        ctx.fillStyle = COLORS.uiGreen;
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';

        const lines = [
            `FPS: ${this.fps}`,
            `State: ${this.state}`,
            `Floor: ${this.floor} | Wave: ${this.wave}`,
            `Room: ${this.room.x},${this.room.y}`,
            `Player: ${Math.floor(this.player?.x || 0)},${Math.floor(this.player?.y || 0)}`,
            `HP: ${this.player?.hp || 0}/${this.player?.maxHp || 0}`,
            `Shields: ${this.player?.shields || 0}`,
            `Bombs: ${this.player?.bombs || 0}`,
            `Weapon: ${this.player?.currentWeapon || 'none'}`,
            `Keyword: ${this.player?.weaponKeyword || 'none'}`,
            `Ammo: ${this.player?.ammo || 0}`,
            `Enemies: ${this.enemies.length}`,
            `Bullets: ${this.bullets.length}`,
            `E-Bullets: ${this.enemyBullets.length}`,
            `Particles: ${this.particles.length}`,
            `Multiplier: ${this.multiplier.toFixed(2)}`,
            `Combo: ${this.combo} (Max: ${this.maxCombo})`,
            `Debris: ${this.debris}`
        ];

        lines.forEach((line, i) => {
            ctx.fillText(line, 10, 67 + i * 12);
        });
    }

    drawHeart(x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y + size/4);
        ctx.bezierCurveTo(x, y, x - size/2, y, x - size/2, y + size/4);
        ctx.bezierCurveTo(x - size/2, y + size/2, x, y + size*0.8, x, y + size);
        ctx.bezierCurveTo(x, y + size*0.8, x + size/2, y + size/2, x + size/2, y + size/4);
        ctx.bezierCurveTo(x + size/2, y, x, y, x, y + size/4);
        ctx.fill();
    }

    drawHeartOutline(x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y + size/4);
        ctx.bezierCurveTo(x, y, x - size/2, y, x - size/2, y + size/4);
        ctx.bezierCurveTo(x - size/2, y + size/2, x, y + size*0.8, x, y + size);
        ctx.bezierCurveTo(x, y + size*0.8, x + size/2, y + size/2, x + size/2, y + size/4);
        ctx.bezierCurveTo(x + size/2, y, x, y, x, y + size/4);
        ctx.stroke();
    }
}

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 12;
        this.speed = 280;
        this.focusSpeed = 110;
        this.hp = 4;
        this.maxHp = 4;
        this.shields = 0;
        this.bombs = 2;
        this.maxBombs = 6;
        this.dashDistance = 130;
        this.dashCooldown = 0;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.iFrames = 0;

        this.currentWeapon = 'peashooter';
        this.weaponKeyword = null;
        this.ammo = 500;
        this.maxAmmo = 500;
        this.fireTimer = 0;
        this.damageBonus = 1.0;

        this.roomsCleared = 0;
        this.focusing = false;
        this.dashTrail = [];
    }

    update(game) {
        const dt = 1/60;
        const speed = this.focusing ? this.focusSpeed : this.speed;

        // Movement
        let dx = 0, dy = 0;
        if (game.keys['w'] || game.keys['arrowup']) dy -= 1;
        if (game.keys['s'] || game.keys['arrowdown']) dy += 1;
        if (game.keys['a'] || game.keys['arrowleft']) dx -= 1;
        if (game.keys['d'] || game.keys['arrowright']) dx += 1;

        // Normalize diagonal
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        this.x += dx * speed * dt;
        this.y += dy * speed * dt;

        // Bounds
        this.x = Math.max(65, Math.min(735, this.x));
        this.y = Math.max(65, Math.min(535, this.y));

        // Check door transitions
        const room = game.getCurrentRoom();
        if (room.cleared || room.type === 'start' || game.enemies.length === 0) {
            if (this.y < 70 && room.doors.includes('up')) game.transitionRoom('up');
            if (this.y > 530 && room.doors.includes('down')) game.transitionRoom('down');
            if (this.x < 70 && room.doors.includes('left')) game.transitionRoom('left');
            if (this.x > 730 && room.doors.includes('right')) game.transitionRoom('right');
        }

        // Focus mode
        this.focusing = game.keys['shift'];

        // Dash
        if ((game.keys['z']) && this.dashCooldown <= 0) {
            this.dash(dx, dy, game);
        }
        this.dashCooldown = Math.max(0, this.dashCooldown - dt);

        // Update dash trail
        for (let i = this.dashTrail.length - 1; i >= 0; i--) {
            this.dashTrail[i].alpha -= 0.1;
            if (this.dashTrail[i].alpha <= 0) {
                this.dashTrail.splice(i, 1);
            }
        }

        // Bomb
        if (game.keys['x']) {
            game.keys['x'] = false;
            game.useBomb();
        }

        // Fire
        this.fireTimer = Math.max(0, this.fireTimer - 1);
        if ((game.keys[' '] || game.mouse.down) && this.fireTimer <= 0) {
            this.fire(game);
        }

        // Weapon switching
        const weapons = ['peashooter', 'vulcan', 'laser', 'fireball', 'revolver', 'sword'];
        for (let i = 1; i <= 6; i++) {
            if (game.keys[i.toString()]) {
                game.keys[i.toString()] = false;
                this.currentWeapon = weapons[i - 1];
                // Random keyword chance on switch
                if (Math.random() < 0.35 && i > 1) {
                    const keywords = Object.keys(KEYWORDS);
                    this.weaponKeyword = keywords[Math.floor(Math.random() * keywords.length)];
                } else {
                    this.weaponKeyword = null;
                }
            }
        }

        // Invulnerability timer
        if (this.invulnerable) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }

        // I-frames
        if (this.iFrames > 0) this.iFrames--;
    }

    dash(dx, dy, game) {
        if (dx === 0 && dy === 0) dy = -1;

        // Store trail positions
        for (let i = 0; i < 5; i++) {
            this.dashTrail.push({
                x: this.x + dx * this.dashDistance * (i / 5),
                y: this.y + dy * this.dashDistance * (i / 5),
                alpha: 1
            });
        }

        const dist = this.dashDistance;
        this.x += dx * dist;
        this.y += dy * dist;

        // Bounds
        this.x = Math.max(65, Math.min(735, this.x));
        this.y = Math.max(65, Math.min(535, this.y));

        this.dashCooldown = 0.4;
        this.iFrames = 12;

        game.spawnParticles(this.x, this.y, COLORS.uiCyan, 8);
    }

    fire(game) {
        const weapon = WEAPONS[this.currentWeapon];

        // Check ammo
        if (weapon.maxAmmo !== Infinity && this.ammo <= 0) {
            this.currentWeapon = 'peashooter';
            this.weaponKeyword = null;
            return;
        }

        this.fireTimer = weapon.fireRate;
        if (weapon.maxAmmo !== Infinity) this.ammo--;

        // Calculate damage with modifiers
        let damage = weapon.damage * this.damageBonus;
        let count = 1;
        let homing = false;

        if (this.weaponKeyword) {
            const kw = KEYWORDS[this.weaponKeyword];
            damage *= kw.damageMod;
            if (this.weaponKeyword === 'triple') count = 3;
            if (this.weaponKeyword === 'homing') homing = true;
            if (this.weaponKeyword === 'highCaliber') {
                this.fireTimer *= 2.5;
                damage *= 1.2;
            }
        }

        // Spawn bullets
        for (let i = 0; i < count; i++) {
            let angle = -Math.PI / 2;
            if (count === 3) {
                angle += (i - 1) * 0.25;
            }

            const bullet = {
                x: this.x,
                y: this.y - 12,
                vx: Math.cos(angle) * weapon.velocity,
                vy: Math.sin(angle) * weapon.velocity,
                speed: weapon.velocity,
                damage: damage,
                size: weapon.melee ? 35 : 5,
                color: weapon.color,
                pierce: weapon.pierce || false,
                homing: homing,
                aoe: weapon.aoe || false,
                aoeRadius: weapon.aoeRadius || 0
            };

            game.bullets.push(bullet);
        }

        // Muzzle flash particle
        game.particles.push({
            x: this.x, y: this.y - 15,
            vx: 0, vy: -2,
            color: weapon.color,
            life: 5,
            size: 8
        });
    }

    takeDamage(amount) {
        if (this.invulnerable || this.iFrames > 0) return;

        this.hp -= amount;
        this.invulnerable = true;
        this.invulnerableTimer = 60;
    }

    render(ctx) {
        // Draw dash trail
        for (const t of this.dashTrail) {
            ctx.fillStyle = `rgba(68, 170, 204, ${t.alpha * 0.5})`;
            ctx.beginPath();
            ctx.moveTo(t.x, t.y - 12);
            ctx.lineTo(t.x - 8, t.y + 8);
            ctx.lineTo(t.x + 8, t.y + 8);
            ctx.closePath();
            ctx.fill();
        }

        // Flash when invulnerable
        if (this.invulnerable && Math.floor(game.frameCount / 4) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        // Ship body
        ctx.fillStyle = COLORS.white;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 16);
        ctx.lineTo(this.x - 11, this.y + 11);
        ctx.lineTo(this.x + 11, this.y + 11);
        ctx.closePath();
        ctx.fill();

        // Ship detail
        ctx.fillStyle = '#aaaaaa';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 8);
        ctx.lineTo(this.x - 5, this.y + 6);
        ctx.lineTo(this.x + 5, this.y + 6);
        ctx.closePath();
        ctx.fill();

        // Engine glow
        const flicker = Math.sin(game.frameCount * 0.3) * 2;
        ctx.fillStyle = COLORS.uiCyan;
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y + 11);
        ctx.lineTo(this.x, this.y + 20 + flicker);
        ctx.lineTo(this.x + 5, this.y + 11);
        ctx.closePath();
        ctx.fill();

        // Focus hitbox indicator
        if (this.focusing) {
            ctx.strokeStyle = COLORS.uiCyan;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = COLORS.uiCyan;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Shield indicator
        if (this.shields > 0) {
            ctx.strokeStyle = `rgba(68, 170, 204, ${0.5 + Math.sin(game.frameCount * 0.1) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    }
}

// Enemy class with improved sprites
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        const def = ENEMY_TYPES[type];
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.speed = def.speed;
        this.behavior = def.behavior;
        this.color = def.color;
        this.size = def.size;

        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.attackTimer = 60 + Math.random() * 60;
        this.dashTarget = null;
        this.animFrame = Math.random() * 100;
    }

    update(game) {
        const player = game.player;
        this.animFrame++;

        switch (this.behavior) {
            case 'chase':
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
                break;

            case 'wander':
                this.x += this.vx * this.speed;
                this.y += this.vy * this.speed;
                if (Math.random() < 0.02) {
                    this.vx = (Math.random() - 0.5) * 2;
                    this.vy = (Math.random() - 0.5) * 2;
                }
                break;

            case 'bounce':
                this.x += this.vx * this.speed;
                this.y += this.vy * this.speed;
                if (this.x < 70 || this.x > 730) this.vx *= -1;
                if (this.y < 70 || this.y > 530) this.vy *= -1;
                break;

            case 'dash':
                if (!this.dashTarget) {
                    this.dashTarget = { x: player.x, y: player.y };
                }
                const dx = this.dashTarget.x - this.x;
                const dy = this.dashTarget.y - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 5) {
                    this.x += (dx / dist) * this.speed * 2.5;
                    this.y += (dy / dist) * this.speed * 2.5;
                } else {
                    this.dashTarget = null;
                }
                break;

            case 'stationary':
                break;
        }

        // Bounds
        this.x = Math.max(70, Math.min(730, this.x));
        this.y = Math.max(70, Math.min(530, this.y));

        // Attack
        this.attackTimer--;
        if (this.attackTimer <= 0) {
            this.attack(game);
            this.attackTimer = 50 + Math.random() * 70;
        }

        // Contact damage
        if (Math.hypot(this.x - player.x, this.y - player.y) < this.size + player.size) {
            player.takeDamage(1);
            game.multiplier = Math.max(1.0, game.multiplier - 0.5);
            game.combo = 0;
            game.addScreenShake(4, 8);
        }
    }

    attack(game) {
        const player = game.player;
        const angle = Math.atan2(player.y - this.y, player.x - this.x);

        if (this.type === 'turret') {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (game.state === GameState.PLAYING || game.state === GameState.BOSS) {
                        game.enemyBullets.push({
                            x: this.x, y: this.y,
                            vx: Math.cos(angle) * 5,
                            vy: Math.sin(angle) * 5,
                            size: 6,
                            color: COLORS.enemy
                        });
                    }
                }, i * 80);
            }
        } else if (this.type === 'drone') {
            for (let i = -1; i <= 1; i++) {
                game.enemyBullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle + i * 0.35) * 6,
                    vy: Math.sin(angle + i * 0.35) * 6,
                    size: 5,
                    color: COLORS.enemy
                });
            }
        } else if (this.type === 'pyromancer') {
            game.enemyBullets.push({
                x: this.x, y: this.y,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                size: 14,
                color: COLORS.fireball
            });
        } else if (this.type === 'hermit' && ENEMY_TYPES[this.type].spawner) {
            if (game.enemies.length < 12) {
                game.enemies.push(new Enemy(this.x + 20, this.y, 'ghost'));
            }
        } else if (this.type === 'seeker') {
            for (let i = 0; i < 6; i++) {
                const spreadAngle = angle + (i - 2.5) * 0.35;
                game.enemyBullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(spreadAngle) * 4,
                    vy: Math.sin(spreadAngle) * 4,
                    size: 5,
                    color: COLORS.uiCyan
                });
            }
        } else if (this.type !== 'swarmer') {
            game.enemyBullets.push({
                x: this.x, y: this.y,
                vx: Math.cos(angle) * 4.5,
                vy: Math.sin(angle) * 4.5,
                size: 6,
                color: COLORS.enemy
            });
        }
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        const bob = Math.sin(this.animFrame * 0.1) * 2;

        switch (this.type) {
            case 'ghost':
            case 'crazyGhost':
                // Ghost with skull face
                ctx.beginPath();
                ctx.arc(this.x, this.y - 5 + bob, this.size/2, Math.PI, 0);
                ctx.lineTo(this.x + this.size/2, this.y + this.size/2 + bob);
                for (let i = 0; i < 4; i++) {
                    const wx = this.x + this.size/2 - i * this.size/4;
                    ctx.lineTo(wx - this.size/8, this.y + this.size/3 + bob);
                    ctx.lineTo(wx - this.size/4, this.y + this.size/2 + bob);
                }
                ctx.closePath();
                ctx.fill();
                // Skull eyes
                ctx.fillStyle = COLORS.skull;
                ctx.beginPath();
                ctx.arc(this.x - 4, this.y - 6 + bob, 4, 0, Math.PI * 2);
                ctx.arc(this.x + 4, this.y - 6 + bob, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(this.x - 4, this.y - 6 + bob, 2, 0, Math.PI * 2);
                ctx.arc(this.x + 4, this.y - 6 + bob, 2, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'blob':
                // Blob with face
                const blobSize = this.size + Math.sin(this.animFrame * 0.15) * 3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, blobSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#66ccee';
                ctx.beginPath();
                ctx.arc(this.x - 8, this.y - 8, blobSize/3, 0, Math.PI * 2);
                ctx.fill();
                // Eyes
                ctx.fillStyle = COLORS.skull;
                ctx.beginPath();
                ctx.arc(this.x - 6, this.y - 4, 5, 0, Math.PI * 2);
                ctx.arc(this.x + 6, this.y - 4, 5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'turret':
                ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
                ctx.fillStyle = '#444455';
                const turretAngle = Math.atan2(game.player.y - this.y, game.player.x - this.x);
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(turretAngle);
                ctx.fillRect(0, -5, 25, 10);
                ctx.restore();
                // Eye
                ctx.fillStyle = COLORS.uiRed;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'swarmer':
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.size);
                ctx.lineTo(this.x - this.size, this.y + this.size);
                ctx.lineTo(this.x + this.size, this.y + this.size);
                ctx.closePath();
                ctx.fill();
                break;

            case 'pyromancer':
                // Fireball with angry face
                const fireSize = this.size + Math.sin(this.animFrame * 0.2) * 4;
                ctx.beginPath();
                ctx.arc(this.x, this.y, fireSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffaa44';
                ctx.beginPath();
                ctx.arc(this.x, this.y - 6, fireSize * 0.6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffcc66';
                ctx.beginPath();
                ctx.arc(this.x, this.y - 10, fireSize * 0.3, 0, Math.PI * 2);
                ctx.fill();
                // Angry eyes
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x - 8, this.y - 5, 6, 4);
                ctx.fillRect(this.x + 2, this.y - 5, 6, 4);
                break;

            case 'hermit':
                // Hooded spawner
                ctx.beginPath();
                ctx.arc(this.x, this.y - 8, this.size * 0.6, Math.PI, 0);
                ctx.lineTo(this.x + this.size * 0.6, this.y + this.size * 0.5);
                ctx.lineTo(this.x - this.size * 0.6, this.y + this.size * 0.5);
                ctx.closePath();
                ctx.fill();
                // Hood shadow
                ctx.fillStyle = '#553355';
                ctx.beginPath();
                ctx.arc(this.x, this.y - 4, this.size * 0.4, Math.PI, 0);
                ctx.fill();
                // Glowing eyes
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.arc(this.x - 5, this.y - 2, 3, 0, Math.PI * 2);
                ctx.arc(this.x + 5, this.y - 2, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'bumper':
                // Bouncy ball with spikes
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ccaa66';
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2 + this.animFrame * 0.05;
                    ctx.beginPath();
                    ctx.moveTo(this.x + Math.cos(a) * this.size * 0.7, this.y + Math.sin(a) * this.size * 0.7);
                    ctx.lineTo(this.x + Math.cos(a) * this.size * 1.3, this.y + Math.sin(a) * this.size * 1.3);
                    ctx.lineTo(this.x + Math.cos(a + 0.2) * this.size * 0.7, this.y + Math.sin(a + 0.2) * this.size * 0.7);
                    ctx.fill();
                }
                break;

            default:
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
        }

        // HP bar
        const hpPercent = this.hp / this.maxHp;
        if (hpPercent < 1) {
            ctx.fillStyle = '#222222';
            ctx.fillRect(this.x - 16, this.y - this.size - 12, 32, 5);
            ctx.fillStyle = hpPercent > 0.5 ? COLORS.uiGreen : COLORS.uiRed;
            ctx.fillRect(this.x - 16, this.y - this.size - 12, 32 * hpPercent, 5);
        }
    }
}

// Boss class
class Boss {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        const def = BOSSES[type];
        this.name = def.name;
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.color = def.color;
        this.size = 55;

        this.phase = 1;
        this.attackTimer = 60;
        this.patternIndex = 0;
        this.invulnerable = false;
        this.moveTimer = 0;
        this.targetX = x;
        this.targetY = y;
        this.animFrame = 0;
    }

    update(game) {
        this.animFrame++;

        // Phase transitions
        const hpPercent = this.hp / this.maxHp;
        if (hpPercent < 0.33 && this.phase < 3) {
            this.phase = 3;
            this.invulnerable = true;
            game.addScreenShake(8, 20);
            game.spawnParticles(this.x, this.y, this.color, 30);
            setTimeout(() => this.invulnerable = false, 1500);
        } else if (hpPercent < 0.66 && this.phase < 2) {
            this.phase = 2;
            this.invulnerable = true;
            game.addScreenShake(5, 15);
            game.spawnParticles(this.x, this.y, this.color, 20);
            setTimeout(() => this.invulnerable = false, 1000);
        }

        // Movement
        this.moveTimer--;
        if (this.moveTimer <= 0) {
            this.targetX = 120 + Math.random() * 560;
            this.targetY = 100 + Math.random() * 180;
            this.moveTimer = 100 + Math.random() * 80;
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
            this.x += (dx / dist) * 2.5;
            this.y += (dy / dist) * 2.5;
        }

        // Attacks
        this.attackTimer--;
        if (this.attackTimer <= 0 && !this.invulnerable) {
            this.attack(game);
            this.attackTimer = Math.max(15, 50 - this.phase * 12);
        }
    }

    attack(game) {
        const player = game.player;
        const angle = Math.atan2(player.y - this.y, player.x - this.x);

        switch (this.type) {
            case 'chamberlord':
                if (this.patternIndex % 4 === 0) {
                    // Ring pattern
                    const bulletCount = 12 + this.phase * 4;
                    for (let i = 0; i < bulletCount; i++) {
                        const a = (i / bulletCount) * Math.PI * 2;
                        game.enemyBullets.push({
                            x: this.x, y: this.y,
                            vx: Math.cos(a) * 3.5,
                            vy: Math.sin(a) * 3.5,
                            size: 8,
                            color: this.color
                        });
                    }
                } else if (this.patternIndex % 4 === 2 && this.phase >= 2) {
                    // Spiral
                    for (let i = 0; i < 8; i++) {
                        setTimeout(() => {
                            if (game.state === GameState.BOSS) {
                                const a = this.animFrame * 0.1 + i * 0.3;
                                game.enemyBullets.push({
                                    x: this.x, y: this.y,
                                    vx: Math.cos(a) * 4,
                                    vy: Math.sin(a) * 4,
                                    size: 7,
                                    color: this.color
                                });
                            }
                        }, i * 60);
                    }
                } else {
                    // Aimed spread
                    const spreadCount = 3 + this.phase;
                    for (let i = -spreadCount; i <= spreadCount; i++) {
                        game.enemyBullets.push({
                            x: this.x, y: this.y,
                            vx: Math.cos(angle + i * 0.15) * 5,
                            vy: Math.sin(angle + i * 0.15) * 5,
                            size: 8,
                            color: this.color
                        });
                    }
                }
                break;

            case 'wraithking':
                if (this.phase >= 2 && this.patternIndex % 3 === 0) {
                    // Laser sweep
                    for (let i = 0; i < 25; i++) {
                        setTimeout(() => {
                            if (game.state === GameState.BOSS) {
                                const sweepAngle = angle - 0.6 + (i / 25) * 1.2;
                                game.enemyBullets.push({
                                    x: this.x, y: this.y,
                                    vx: Math.cos(sweepAngle) * 7,
                                    vy: Math.sin(sweepAngle) * 7,
                                    size: 6,
                                    color: '#aa66ff'
                                });
                            }
                        }, i * 40);
                    }
                } else {
                    // Spawn ghosts
                    if (game.enemies.length < 6) {
                        game.enemies.push(new Enemy(this.x - 40, this.y, 'ghost'));
                        game.enemies.push(new Enemy(this.x + 40, this.y, 'ghost'));
                    }
                    // Aimed shots
                    for (let i = -2; i <= 2; i++) {
                        game.enemyBullets.push({
                            x: this.x, y: this.y,
                            vx: Math.cos(angle + i * 0.25) * 4.5,
                            vy: Math.sin(angle + i * 0.25) * 4.5,
                            size: 10,
                            color: this.color
                        });
                    }
                }
                break;

            case 'coreGuardian':
                // Rotating turret fire
                for (let t = 0; t < 4; t++) {
                    const turretAngle = (t / 4) * Math.PI * 2 + this.animFrame * 0.02;
                    const tx = this.x + Math.cos(turretAngle) * 45;
                    const ty = this.y + Math.sin(turretAngle) * 45;

                    const toPlayer = Math.atan2(player.y - ty, player.x - tx);
                    game.enemyBullets.push({
                        x: tx, y: ty,
                        vx: Math.cos(toPlayer) * 5.5,
                        vy: Math.sin(toPlayer) * 5.5,
                        size: 7,
                        color: '#66dddd'
                    });
                }

                // Phase 2+: More bullets
                if (this.phase >= 2) {
                    for (let i = 0; i < 12; i++) {
                        const a = (i / 12) * Math.PI * 2 + this.animFrame * 0.03;
                        game.enemyBullets.push({
                            x: this.x, y: this.y,
                            vx: Math.cos(a) * 3,
                            vy: Math.sin(a) * 3,
                            size: 5,
                            color: '#88ffff'
                        });
                    }
                }

                // Phase 3: Bullet hell
                if (this.phase >= 3) {
                    for (let i = 0; i < 20; i++) {
                        const a = (i / 20) * Math.PI * 2 + this.animFrame * 0.06;
                        game.enemyBullets.push({
                            x: this.x, y: this.y,
                            vx: Math.cos(a) * 2.5,
                            vy: Math.sin(a) * 2.5,
                            size: 4,
                            color: '#aaffff'
                        });
                    }
                }
                break;
        }

        this.patternIndex++;
    }

    render(ctx) {
        // Flash when invulnerable
        if (this.invulnerable && Math.floor(game.frameCount / 4) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        ctx.fillStyle = this.color;

        switch (this.type) {
            case 'chamberlord':
                // Large construct with eye
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.size);
                ctx.lineTo(this.x + this.size, this.y);
                ctx.lineTo(this.x + this.size * 0.6, this.y + this.size);
                ctx.lineTo(this.x - this.size * 0.6, this.y + this.size);
                ctx.lineTo(this.x - this.size, this.y);
                ctx.closePath();
                ctx.fill();

                // Eye socket
                ctx.fillStyle = '#553322';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 22, 0, Math.PI * 2);
                ctx.fill();

                // Eye
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 18, 0, Math.PI * 2);
                ctx.fill();

                // Pupil tracks player
                const eyeAngle = Math.atan2(game.player.y - this.y, game.player.x - this.x);
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(eyeAngle) * 8, this.y + Math.sin(eyeAngle) * 8, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(eyeAngle) * 8, this.y + Math.sin(eyeAngle) * 8, 4, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'wraithking':
                // Ghostly king with crown
                ctx.beginPath();
                ctx.arc(this.x, this.y - 20, this.size * 0.75, Math.PI, 0);
                ctx.lineTo(this.x + this.size * 0.75, this.y + this.size);
                for (let i = 0; i < 6; i++) {
                    const wx = this.x + this.size * 0.75 - i * this.size * 0.25;
                    const wobble = Math.sin(this.animFrame * 0.1 + i) * 3;
                    ctx.lineTo(wx - this.size * 0.12, this.y + this.size * 0.7 + wobble);
                    ctx.lineTo(wx - this.size * 0.25, this.y + this.size + wobble);
                }
                ctx.closePath();
                ctx.fill();

                // Crown
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath();
                ctx.moveTo(this.x - 30, this.y - 55);
                ctx.lineTo(this.x - 20, this.y - 80);
                ctx.lineTo(this.x - 10, this.y - 60);
                ctx.lineTo(this.x, this.y - 85);
                ctx.lineTo(this.x + 10, this.y - 60);
                ctx.lineTo(this.x + 20, this.y - 80);
                ctx.lineTo(this.x + 30, this.y - 55);
                ctx.closePath();
                ctx.fill();

                // Eyes
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(this.x - 15, this.y - 25, 8, 0, Math.PI * 2);
                ctx.arc(this.x + 15, this.y - 25, 8, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'coreGuardian':
                // Mechanical core
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();

                // Inner rings
                ctx.strokeStyle = '#88ffff';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.75, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
                ctx.stroke();

                // Rotating turrets
                for (let t = 0; t < 4; t++) {
                    const turretAngle = (t / 4) * Math.PI * 2 + this.animFrame * 0.02;
                    const tx = this.x + Math.cos(turretAngle) * 45;
                    const ty = this.y + Math.sin(turretAngle) * 45;
                    ctx.fillStyle = '#666677';
                    ctx.beginPath();
                    ctx.arc(tx, ty, 14, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#44aaaa';
                    ctx.beginPath();
                    ctx.arc(tx, ty, 8, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Core eye
                ctx.fillStyle = this.phase >= 3 ? '#ff4444' : (this.phase >= 2 ? '#ffaa44' : '#44ffff');
                ctx.beginPath();
                ctx.arc(this.x, this.y, 22, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        ctx.globalAlpha = 1;
    }
}

// Game loop
let game = new Game();

function gameLoop() {
    game.update();
    game.render();
    requestAnimationFrame(gameLoop);
}

gameLoop();
