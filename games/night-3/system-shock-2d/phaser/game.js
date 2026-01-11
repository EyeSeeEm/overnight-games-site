// WHISPERS OF M.A.R.I.A. - System Shock 2D Clone
// Phaser 3 Implementation

const GAME_WIDTH = 960;
const GAME_HEIGHT = 720;
const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

const COLORS = {
    BG: 0x000000,
    FLOOR: 0x4a4238,
    FLOOR_ALT: 0x3a3228,
    WALL: 0x2a2520,
    WALL_LIGHT: 0x5a4a40,
    DOOR: 0x6a5a50,
    TERMINAL: 0x2a4a3a,
    TERMINAL_SCREEN: 0x40aa60,
    PLAYER: 0x6a8a8a,
    CYBORG: 0x7a6050,
    CYBORG_EYE: 0xff3030,
    CYBORG_HEAVY: 0x5a4030,
    CYBORG_ASSASSIN: 0x404060,
    MUTANT: 0x4a6a4a,
    MUTANT_BRUTE: 0x3a5a3a,
    ROBOT: 0x606880,
    BULLET: 0xffff80,
    LASER: 0x80ffff,
    PLASMA: 0x40ff80,
    HEALTH_BAR: 0xcc4040,
    ENERGY_BAR: 0x4080cc,
    STAMINA_BAR: 0xcccc40,
    EXIT: 0x40aa40
};

// Status effects
const STATUS_EFFECTS = {
    bleeding: { name: 'Bleeding', damagePerSec: 2, duration: 10, color: 0xff3333 },
    shocked: { name: 'Shocked', speedMod: 0, attackMod: 0, duration: 3, color: 0xffff00 },
    irradiated: { name: 'Irradiated', damagePerSec: 0.33, duration: 30, stacks: true, maxStacks: 3, color: 0x40ff40 },
    cloaked: { name: 'Cloaked', invisible: true, duration: 15, color: 0x8080ff }
};

// Enemy types from GDD
const ENEMY_TYPES = {
    DRONE: { name: 'Cyborg Drone', hp: 30, armor: 0, damage: 10, speed: 80, behavior: 'melee', color: COLORS.CYBORG, drops: ['bullets'] },
    SOLDIER: { name: 'Cyborg Soldier', hp: 60, armor: 5, damage: 15, speed: 100, behavior: 'ranged', color: COLORS.CYBORG, drops: ['bullets', 'medkit'] },
    ASSASSIN: { name: 'Cyborg Assassin', hp: 40, armor: 0, damage: 25, speed: 150, behavior: 'stealth', color: COLORS.CYBORG_ASSASSIN, drops: ['energy', 'cloak'] },
    HEAVY: { name: 'Cyborg Heavy', hp: 120, armor: 15, damage: 20, speed: 60, behavior: 'tank', color: COLORS.CYBORG_HEAVY, drops: ['shells', 'armor'] },
    MUTANT_CRAWLER: { name: 'Mutant Crawler', hp: 20, armor: 0, damage: 8, speed: 120, behavior: 'swarm', color: COLORS.MUTANT, drops: ['toxin'] },
    MUTANT_BRUTE: { name: 'Mutant Brute', hp: 100, armor: 5, damage: 30, speed: 50, behavior: 'charge', color: COLORS.MUTANT_BRUTE, drops: ['mutagen'] },
    MAINTENANCE_BOT: { name: 'Maintenance Bot', hp: 40, armor: 10, damage: 10, speed: 60, behavior: 'patrol', color: COLORS.ROBOT, drops: ['scrap', 'battery'] },
    SECURITY_BOT: { name: 'Security Bot', hp: 80, armor: 15, damage: 18, speed: 80, behavior: 'aggressive', color: COLORS.ROBOT, drops: ['scrap', 'energy'] }
};

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Boot' });
    }

    create() {
        this.createTextures();
        this.scene.start('Game');
    }

    createTextures() {
        const g = this.make.graphics({ add: false });

        // Floor tile
        g.clear();
        g.fillStyle(COLORS.FLOOR);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, 0x2a2218);
        g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('floor', TILE_SIZE, TILE_SIZE);

        // Floor alt
        g.clear();
        g.fillStyle(COLORS.FLOOR_ALT);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, 0x2a2218);
        g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('floorAlt', TILE_SIZE, TILE_SIZE);

        // Wall tile
        g.clear();
        g.fillStyle(COLORS.WALL);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(COLORS.WALL_LIGHT);
        g.fillRect(0, 0, TILE_SIZE, 4);
        g.fillRect(0, 0, 4, TILE_SIZE);
        g.generateTexture('wall', TILE_SIZE, TILE_SIZE);

        // Door
        g.clear();
        g.fillStyle(COLORS.DOOR);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x3a3028);
        g.fillRect(4, 4, 24, 24);
        g.generateTexture('door', TILE_SIZE, TILE_SIZE);

        // Terminal
        g.clear();
        g.fillStyle(COLORS.TERMINAL);
        g.fillRect(0, 0, 28, 28);
        g.fillStyle(COLORS.TERMINAL_SCREEN);
        g.fillRect(4, 4, 20, 12);
        g.generateTexture('terminal', 28, 28);

        // Player
        g.clear();
        g.fillStyle(COLORS.PLAYER);
        g.fillRect(0, 4, 20, 16);
        g.fillStyle(0x40aa60);
        g.fillRect(15, 8, 8, 8);
        g.fillStyle(0x4a4a4a);
        g.fillRect(22, 10, 10, 4);
        g.generateTexture('player', 32, 24);

        // Cyborg Drone
        g.clear();
        g.fillStyle(COLORS.CYBORG);
        g.fillRect(0, 2, 28, 20);
        g.fillStyle(COLORS.CYBORG_EYE);
        g.fillCircle(20, 12, 4);
        g.generateTexture('cyborg', 28, 24);

        // Cyborg Heavy
        g.clear();
        g.fillStyle(COLORS.CYBORG_HEAVY);
        g.fillRect(0, 0, 36, 28);
        g.fillStyle(0x404040);
        g.fillRect(4, 4, 28, 20);
        g.fillStyle(COLORS.CYBORG_EYE);
        g.fillCircle(28, 14, 5);
        g.generateTexture('cyborg_heavy', 36, 28);

        // Cyborg Assassin
        g.clear();
        g.fillStyle(COLORS.CYBORG_ASSASSIN);
        g.fillRect(2, 4, 24, 16);
        g.fillStyle(0x8080ff);
        g.fillCircle(20, 12, 3);
        g.generateTexture('cyborg_assassin', 28, 24);

        // Mutant Crawler
        g.clear();
        g.fillStyle(COLORS.MUTANT);
        g.fillRect(0, 4, 20, 12);
        g.fillStyle(0x80ff80);
        g.fillCircle(16, 10, 3);
        g.fillCircle(4, 10, 3);
        g.generateTexture('mutant_crawler', 20, 20);

        // Mutant Brute
        g.clear();
        g.fillStyle(COLORS.MUTANT_BRUTE);
        g.fillRect(0, 0, 40, 32);
        g.fillStyle(0xff4040);
        g.fillCircle(32, 12, 4);
        g.fillCircle(32, 20, 4);
        g.generateTexture('mutant_brute', 40, 32);

        // Maintenance Bot
        g.clear();
        g.fillStyle(COLORS.ROBOT);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x40ff40);
        g.fillCircle(16, 8, 4);
        g.fillStyle(0x404040);
        g.fillRect(8, 16, 16, 8);
        g.generateTexture('maintenance_bot', 32, 32);

        // Security Bot
        g.clear();
        g.fillStyle(COLORS.ROBOT);
        g.fillRect(2, 2, 28, 28);
        g.fillStyle(0xff4040);
        g.fillCircle(16, 10, 5);
        g.fillStyle(0x404040);
        g.fillRect(24, 14, 8, 4);
        g.generateTexture('security_bot', 32, 32);

        // Bullet
        g.clear();
        g.fillStyle(COLORS.BULLET);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet', 8, 8);

        // Laser
        g.clear();
        g.fillStyle(COLORS.LASER);
        g.fillCircle(4, 4, 4);
        g.generateTexture('laser', 8, 8);

        // Item
        g.clear();
        g.fillStyle(0x60cc80);
        g.fillRect(0, 0, 12, 12);
        g.generateTexture('item', 12, 12);

        // Exit
        g.clear();
        g.fillStyle(COLORS.EXIT);
        g.fillRect(0, 0, 40, 40);
        g.generateTexture('exit', 40, 40);

        // Darkness overlay (full screen black)
        g.clear();
        g.fillStyle(0x000000);
        g.fillRect(0, 0, 1, 1);
        g.generateTexture('darkness', 1, 1);

        g.destroy();
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Game' });
    }

    create() {
        this.gameData = {
            deck: 1,
            score: 0,
            messages: [],
            state: 'playing'
        };

        this.playerData = {
            hp: 100,
            maxHp: 100,
            energy: 100,
            maxEnergy: 100,
            stamina: 100,
            maxStamina: 100,
            armor: 0,
            weapon: 'pistol',
            secondaryWeapon: 'wrench',
            ammo: { bullets: 48, shells: 12, energy: 30, grenades: 2 },
            magazine: 12,
            maxMagazine: 12,
            reloading: false,
            reloadTime: 0,
            lastShot: 0,
            flashlightOn: true,
            isSprinting: false,
            isCrouching: false,
            isDodging: false,
            dodgeCooldown: 0,
            dodgeDirection: { x: 0, y: 0 },
            dodgeTimer: 0,
            invincible: false,
            statusEffects: [],
            skills: {
                firearms: 1,
                melee: 1,
                hacking: 1,
                repair: 1,
                stealth: 1,
                endurance: 1
            },
            cyberModules: 0,
            scrap: 0
        };

        // Stats tracking
        this.stats = {
            killCount: 0,
            totalDamageDealt: 0,
            totalDamageTaken: 0,
            critCount: 0,
            terminalsHacked: 0,
            itemsPickedUp: 0,
            shotsFired: 0,
            shotsHit: 0,
            maxKillStreak: 0
        };

        // Kill streak system
        this.killStreak = 0;
        this.killStreakTimer = 0;

        // Visual effects
        this.damageFlashAlpha = 0;
        this.lowHealthPulse = 0;
        this.screenShake = { x: 0, y: 0, intensity: 0 };

        // Floating texts
        this.floatingTexts = [];

        // Debug mode
        this.debugMode = false;

        // Game timer
        this.gameStartTime = Date.now();

        this.weapons = {
            wrench: { name: 'Wrench', damage: 15, range: 40, fireRate: 400, ammoType: null, magazineSize: null, melee: true, durability: Infinity, condition: 100 },
            pipe: { name: 'Pipe', damage: 20, range: 50, fireRate: 600, ammoType: null, magazineSize: null, melee: true, durability: 50, condition: 50, knockback: 1.5 },
            stunProd: { name: 'Stun Prod', damage: 10, range: 45, fireRate: 400, ammoType: null, magazineSize: null, melee: true, durability: 30, condition: 30, stunDuration: 2 },
            laserRapier: { name: 'Laser Rapier', damage: 35, range: 45, fireRate: 300, ammoType: 'energy', energyCost: 5, magazineSize: null, melee: true, durability: Infinity, condition: 100, bypassArmor: true },
            pistol: { name: 'Pistol', damage: 12, range: 400, fireRate: 300, ammoType: 'bullets', magazineSize: 12, melee: false, durability: 100, condition: 100 },
            shotgun: { name: 'Shotgun', damage: 8, pellets: 6, range: 200, fireRate: 800, ammoType: 'shells', magazineSize: 6, melee: false, durability: 80, condition: 80, spread: 0.4 },
            smg: { name: 'SMG', damage: 8, range: 350, fireRate: 100, ammoType: 'bullets', magazineSize: 30, melee: false, durability: 90, condition: 90, recoil: 0.1 },
            laserPistol: { name: 'Laser Pistol', damage: 20, range: 450, fireRate: 400, ammoType: 'energy', energyPerShot: 5, magazineSize: 20, melee: false, durability: Infinity, condition: 100, penetration: 0.5 },
            laserRifle: { name: 'Laser Rifle', damage: 35, range: 500, fireRate: 600, ammoType: 'energy', energyPerShot: 8, magazineSize: 30, melee: false, durability: Infinity, condition: 100, penetration: 0.7 },
            grenadeLauncher: { name: 'Grenade Launcher', damage: 80, range: 300, fireRate: 1500, ammoType: 'grenades', magazineSize: 1, melee: false, durability: 120, condition: 100, explosive: true, blastRadius: 80 }
        };

        this.map = [];
        this.floorTiles = this.add.group();
        this.wallTiles = this.add.group();
        this.enemies = [];
        this.bullets = [];
        this.items = [];
        this.doors = [];
        this.terminals = [];
        this.corpses = [];

        this.generateMap();
        this.createPlayer();
        this.spawnEnemies();
        this.spawnItems();
        this.createUI();
        this.setupInput();
        this.createLighting();

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

        this.addMessage("SYSTEM: Welcome to Von Braun. M.A.R.I.A. is watching.");
    }

    generateMap() {
        // Initialize with walls
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.map[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                this.map[y][x] = 1;
            }
        }

        // Create rooms
        const rooms = [];
        const numRooms = 8 + Math.floor(Math.random() * 4);

        for (let i = 0; i < numRooms; i++) {
            const roomW = 5 + Math.floor(Math.random() * 6);
            const roomH = 4 + Math.floor(Math.random() * 5);
            const roomX = 1 + Math.floor(Math.random() * (MAP_WIDTH - roomW - 2));
            const roomY = 1 + Math.floor(Math.random() * (MAP_HEIGHT - roomH - 2));

            for (let y = roomY; y < roomY + roomH; y++) {
                for (let x = roomX; x < roomX + roomW; x++) {
                    this.map[y][x] = 0;
                }
            }

            rooms.push({ x: roomX + roomW/2, y: roomY + roomH/2, w: roomW, h: roomH });
        }

        // Connect rooms with corridors
        for (let i = 1; i < rooms.length; i++) {
            const prev = rooms[i - 1];
            const curr = rooms[i];

            let x = Math.floor(prev.x);
            let y = Math.floor(prev.y);
            const targetX = Math.floor(curr.x);
            const targetY = Math.floor(curr.y);

            while (x !== targetX) {
                if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                    this.map[y][x] = 0;
                    if (y > 0) this.map[y-1][x] = 0;
                }
                x += x < targetX ? 1 : -1;
            }
            while (y !== targetY) {
                if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                    this.map[y][x] = 0;
                    if (x > 0) this.map[y][x-1] = 0;
                }
                y += y < targetY ? 1 : -1;
            }
        }

        // Render map
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const px = x * TILE_SIZE + TILE_SIZE / 2;
                const py = y * TILE_SIZE + TILE_SIZE / 2;

                if (this.map[y][x] === 0) {
                    const texture = ((x + y) % 2 === 0) ? 'floor' : 'floorAlt';
                    const tile = this.add.image(px, py, texture);
                    this.floorTiles.add(tile);
                } else {
                    const tile = this.add.image(px, py, 'wall');
                    this.wallTiles.add(tile);
                }
            }
        }

        // Add doors
        for (let y = 2; y < MAP_HEIGHT - 2; y++) {
            for (let x = 2; x < MAP_WIDTH - 2; x++) {
                if (this.map[y][x] === 0) {
                    const isHorizontalPassage = this.map[y][x-1] === 1 && this.map[y][x+1] === 1 &&
                                               this.map[y-1][x] === 0 && this.map[y+1][x] === 0;
                    const isVerticalPassage = this.map[y-1][x] === 1 && this.map[y+1][x] === 1 &&
                                             this.map[y][x-1] === 0 && this.map[y][x+1] === 0;

                    if ((isHorizontalPassage || isVerticalPassage) && Math.random() < 0.15) {
                        const door = this.add.image(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 'door');
                        door.doorData = { open: false, locked: Math.random() < 0.3, keycard: 'yellow', tx: x, ty: y };
                        this.doors.push(door);
                    }
                }
            }
        }

        // Add terminals
        for (const room of rooms) {
            if (Math.random() < 0.4) {
                const tx = Math.floor(room.x - room.w/2 + 1);
                const ty = Math.floor(room.y - room.h/2 + 1);
                const terminal = this.add.image(tx * TILE_SIZE + TILE_SIZE/2, ty * TILE_SIZE + TILE_SIZE/2, 'terminal');
                terminal.terminalData = { hacked: false, type: 'security' };
                this.terminals.push(terminal);
            }
        }

        // Exit position
        const lastRoom = rooms[rooms.length - 1];
        this.exitX = Math.floor(lastRoom.x) * TILE_SIZE;
        this.exitY = Math.floor(lastRoom.y) * TILE_SIZE;
        this.exit = this.add.image(this.exitX, this.exitY, 'exit');

        // Spawn position
        for (let y = 2; y < MAP_HEIGHT - 2; y++) {
            for (let x = 2; x < MAP_WIDTH - 2; x++) {
                if (this.map[y][x] === 0) {
                    this.spawnX = x * TILE_SIZE + TILE_SIZE / 2;
                    this.spawnY = y * TILE_SIZE + TILE_SIZE / 2;
                    return;
                }
            }
        }
    }

    createPlayer() {
        this.player = this.add.sprite(this.spawnX, this.spawnY, 'player');
        this.player.setDepth(10);
    }

    spawnEnemies() {
        const enemyCount = 5 + this.gameData.deck * 3;
        const enemyTypeKeys = Object.keys(ENEMY_TYPES);
        const textureMap = {
            DRONE: 'cyborg',
            SOLDIER: 'cyborg',
            ASSASSIN: 'cyborg_assassin',
            HEAVY: 'cyborg_heavy',
            MUTANT_CRAWLER: 'mutant_crawler',
            MUTANT_BRUTE: 'mutant_brute',
            MAINTENANCE_BOT: 'maintenance_bot',
            SECURITY_BOT: 'security_bot'
        };

        for (let i = 0; i < enemyCount; i++) {
            let attempts = 0;
            while (attempts < 100) {
                const x = Math.floor(Math.random() * MAP_WIDTH);
                const y = Math.floor(Math.random() * MAP_HEIGHT);

                if (this.map[y][x] === 0) {
                    const dist = Phaser.Math.Distance.Between(
                        x * TILE_SIZE, y * TILE_SIZE, this.spawnX, this.spawnY
                    );
                    if (dist > 200) {
                        // Choose enemy type based on deck
                        let typeKey;
                        const rand = Math.random();
                        if (this.gameData.deck === 1) {
                            typeKey = rand < 0.6 ? 'DRONE' : rand < 0.9 ? 'SOLDIER' : 'MAINTENANCE_BOT';
                        } else if (this.gameData.deck === 2) {
                            typeKey = rand < 0.3 ? 'DRONE' : rand < 0.5 ? 'SOLDIER' : rand < 0.7 ? 'MUTANT_CRAWLER' : rand < 0.85 ? 'HEAVY' : 'SECURITY_BOT';
                        } else {
                            typeKey = enemyTypeKeys[Math.floor(Math.random() * enemyTypeKeys.length)];
                        }

                        const enemyType = ENEMY_TYPES[typeKey];
                        const texture = textureMap[typeKey] || 'cyborg';
                        const enemy = this.add.sprite(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, texture);
                        enemy.setDepth(8);
                        enemy.enemyData = {
                            type: typeKey,
                            typeName: enemyType.name,
                            hp: enemyType.hp + Math.random() * (enemyType.hp * 0.2),
                            maxHp: enemyType.hp,
                            armor: enemyType.armor,
                            speed: enemyType.speed + Math.random() * 20 - 10,
                            damage: enemyType.damage,
                            range: enemyType.behavior === 'melee' || enemyType.behavior === 'swarm' ? 30 :
                                   enemyType.behavior === 'charge' ? 40 : 200,
                            state: 'patrol',
                            alertTimer: 0,
                            lastAttack: 0,
                            lastSeen: { x: 0, y: 0 },
                            patrolTarget: null,
                            behavior: enemyType.behavior,
                            drops: enemyType.drops,
                            statusEffects: [],
                            cloaked: enemyType.behavior === 'stealth',
                            chargeTimer: 0
                        };
                        this.enemies.push(enemy);
                        break;
                    }
                }
                attempts++;
            }
        }
    }

    spawnItems() {
        const itemCount = 12 + this.gameData.deck * 3;
        const itemTypes = [
            { type: 'medkit', weight: 30, amount: [20, 40] },
            { type: 'bullets', weight: 25, amount: [15, 30] },
            { type: 'shells', weight: 15, amount: [6, 12] },
            { type: 'energy', weight: 20, amount: [20, 40] },
            { type: 'grenades', weight: 5, amount: [1, 2] },
            { type: 'scrap', weight: 15, amount: [10, 30] },
            { type: 'cyberModules', weight: 10, amount: [5, 15] }
        ];

        const totalWeight = itemTypes.reduce((sum, it) => sum + it.weight, 0);

        for (let i = 0; i < itemCount; i++) {
            let attempts = 0;
            while (attempts < 50) {
                const x = Math.floor(Math.random() * MAP_WIDTH);
                const y = Math.floor(Math.random() * MAP_HEIGHT);

                if (this.map[y][x] === 0) {
                    // Weighted random selection
                    let roll = Math.random() * totalWeight;
                    let selectedType = itemTypes[0];
                    for (const it of itemTypes) {
                        roll -= it.weight;
                        if (roll <= 0) {
                            selectedType = it;
                            break;
                        }
                    }

                    const item = this.add.image(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 'item');
                    item.setDepth(5);

                    // Set item color based on type
                    if (selectedType.type === 'medkit') item.setTint(0xff4040);
                    else if (selectedType.type === 'bullets') item.setTint(0xffff40);
                    else if (selectedType.type === 'shells') item.setTint(0xff8040);
                    else if (selectedType.type === 'energy') item.setTint(0x40ffff);
                    else if (selectedType.type === 'grenades') item.setTint(0x80ff40);
                    else if (selectedType.type === 'scrap') item.setTint(0x808080);
                    else if (selectedType.type === 'cyberModules') item.setTint(0xff40ff);

                    item.itemData = {
                        type: selectedType.type,
                        amount: selectedType.amount[0] + Math.floor(Math.random() * (selectedType.amount[1] - selectedType.amount[0]))
                    };
                    this.items.push(item);
                    break;
                }
                attempts++;
            }
        }
    }

    createUI() {
        this.uiGroup = this.add.group();

        // UI texts - weapon slots
        this.weaponTexts = [];
        const weapons = ['1:wrench', '2:pistol', '3:shotgun', '4:smg', '5:laserPistol', '6:laserRifle'];
        let y = 25;
        for (const w of weapons) {
            const text = this.add.text(13, y, w, { fontSize: '12px', fontFamily: 'monospace', color: '#ffffff' });
            text.setScrollFactor(0);
            text.setDepth(100);
            this.weaponTexts.push({ text, weapon: w.split(':')[1] });
            y += 16;
        }

        // Ammo display
        this.ammoText = this.add.text(13, GAME_HEIGHT - 130, '', { fontSize: '12px', fontFamily: 'monospace', color: '#60cc80' });
        this.ammoText.setScrollFactor(0);
        this.ammoText.setDepth(100);

        // Stats display
        this.statsText = this.add.text(13, GAME_HEIGHT - 95, '', { fontSize: '14px', fontFamily: 'monospace', color: '#ffffff' });
        this.statsText.setScrollFactor(0);
        this.statsText.setDepth(100);

        // Status effects display
        this.statusText = this.add.text(13, GAME_HEIGHT - 35, '', { fontSize: '10px', fontFamily: 'monospace', color: '#ffaa00' });
        this.statusText.setScrollFactor(0);
        this.statusText.setDepth(100);

        // Weapon description
        this.descText = this.add.text(13, GAME_HEIGHT - 20, '', { fontSize: '12px', fontFamily: 'monospace', color: '#aaaaaa' });
        this.descText.setScrollFactor(0);
        this.descText.setDepth(100);

        // Deck info
        this.deckText = this.add.text(GAME_WIDTH - 200, 25, 'DECK 1: Engineering', { fontSize: '14px', fontFamily: 'monospace', color: '#ffffff' });
        this.deckText.setScrollFactor(0);
        this.deckText.setDepth(100);

        // Minimap background
        this.minimapBg = this.add.rectangle(GAME_WIDTH - 85, 110, 150, 100, 0x000000, 0.6);
        this.minimapBg.setScrollFactor(0).setDepth(99);

        // Minimap graphics
        this.minimap = this.add.graphics();
        this.minimap.setScrollFactor(0).setDepth(100);

        // Messages
        this.messagesText = this.add.text(GAME_WIDTH - 420, GAME_HEIGHT - 100, '', { fontSize: '12px', fontFamily: 'monospace', color: '#60cc80' });
        this.messagesText.setScrollFactor(0);
        this.messagesText.setDepth(100);

        // Controls hint
        this.controlsText = this.add.text(GAME_WIDTH - 200, GAME_HEIGHT - 50, 'SPACE:Dodge Q:Heal TAB:Swap\nRMB:Grenade CTRL:Crouch', { fontSize: '10px', fontFamily: 'monospace', color: '#666666' });
        this.controlsText.setScrollFactor(0);
        this.controlsText.setDepth(100);

        // Crosshair
        this.crosshair = this.add.graphics();
        this.crosshair.setScrollFactor(0);
        this.crosshair.setDepth(100);

        // Visual effects overlays
        this.damageOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0);
        this.damageOverlay.setScrollFactor(0).setDepth(90);

        this.lowHealthOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x330000, 0);
        this.lowHealthOverlay.setScrollFactor(0).setDepth(89);

        // Kill streak display
        this.killStreakText = this.add.text(GAME_WIDTH / 2, 80, '', { fontSize: '18px', fontFamily: 'monospace', color: '#ffaa00', fontStyle: 'bold' });
        this.killStreakText.setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // Debug overlay
        this.debugText = this.add.text(GAME_WIDTH - 200, 50, '', { fontSize: '10px', fontFamily: 'monospace', color: '#00ff00', backgroundColor: '#000000aa' });
        this.debugText.setScrollFactor(0).setDepth(150).setVisible(false);
    }

    createLighting() {
        // Darkness mask
        this.darkness = this.add.graphics();
        this.darkness.setDepth(50);

        // Light mask for flashlight
        this.lightMask = this.make.graphics({ add: false });
    }

    setupInput() {
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            ctrl: Phaser.Input.Keyboard.KeyCodes.CTRL,
            interact: Phaser.Input.Keyboard.KeyCodes.E,
            reload: Phaser.Input.Keyboard.KeyCodes.R,
            flashlight: Phaser.Input.Keyboard.KeyCodes.F,
            dodge: Phaser.Input.Keyboard.KeyCodes.SPACE,
            quickHeal: Phaser.Input.Keyboard.KeyCodes.Q,
            swap: Phaser.Input.Keyboard.KeyCodes.TAB,
            one: Phaser.Input.Keyboard.KeyCodes.ONE,
            two: Phaser.Input.Keyboard.KeyCodes.TWO,
            three: Phaser.Input.Keyboard.KeyCodes.THREE,
            four: Phaser.Input.Keyboard.KeyCodes.FOUR,
            five: Phaser.Input.Keyboard.KeyCodes.FIVE,
            six: Phaser.Input.Keyboard.KeyCodes.SIX
        });

        this.input.keyboard.on('keydown-R', () => this.reload());
        this.input.keyboard.on('keydown-F', () => this.playerData.flashlightOn = !this.playerData.flashlightOn);
        this.input.keyboard.on('keydown-E', () => this.interact());
        this.input.keyboard.on('keydown-G', () => {
            this.debugMode = !this.debugMode;
            this.debugText.setVisible(this.debugMode);
        });
        this.input.keyboard.on('keydown-Q', () => this.quickHeal());
        this.input.keyboard.on('keydown-SPACE', () => this.dodge());
        this.input.keyboard.on('keydown-TAB', (e) => {
            e.preventDefault();
            this.swapWeapon();
        });
        this.input.keyboard.on('keydown-ONE', () => this.selectWeapon('wrench'));
        this.input.keyboard.on('keydown-TWO', () => this.selectWeapon('pistol'));
        this.input.keyboard.on('keydown-THREE', () => this.selectWeapon('shotgun'));
        this.input.keyboard.on('keydown-FOUR', () => this.selectWeapon('smg'));
        this.input.keyboard.on('keydown-FIVE', () => this.selectWeapon('laserPistol'));
        this.input.keyboard.on('keydown-SIX', () => this.selectWeapon('laserRifle'));

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.shoot();
            }
            if (pointer.rightButtonDown()) {
                this.useItem();
            }
        });
    }

    dodge() {
        if (this.playerData.isDodging || this.playerData.dodgeCooldown > 0) return;
        if (this.playerData.stamina < 15) return;

        this.playerData.stamina -= 15;
        this.playerData.isDodging = true;
        this.playerData.invincible = true;
        this.playerData.dodgeTimer = 0.4;

        // Get dodge direction from movement keys or facing direction
        let dx = 0, dy = 0;
        if (this.cursors.up.isDown) dy = -1;
        if (this.cursors.down.isDown) dy = 1;
        if (this.cursors.left.isDown) dx = -1;
        if (this.cursors.right.isDown) dx = 1;

        if (dx === 0 && dy === 0) {
            dx = Math.cos(this.player.rotation);
            dy = Math.sin(this.player.rotation);
        }

        const len = Math.hypot(dx, dy);
        this.playerData.dodgeDirection = { x: dx / len, y: dy / len };

        // Dodge visual effect
        this.player.setAlpha(0.5);
        this.createFloatingText(this.player.x, this.player.y - 20, 'DODGE!', '#80ffff', 12);
    }

    quickHeal() {
        if (this.playerData.hp >= this.playerData.maxHp) return;

        // Look for medkit in inventory (simplified - just check stats)
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (!item.active) continue;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
            if (dist < 60 && item.itemData.type === 'medkit') {
                this.pickupItem(item, i);
                return;
            }
        }

        // If no nearby medkit, use emergency heal for energy
        if (this.playerData.energy >= 30 && this.playerData.hp < this.playerData.maxHp) {
            this.playerData.energy -= 30;
            const healAmount = 15;
            this.playerData.hp = Math.min(this.playerData.maxHp, this.playerData.hp + healAmount);
            this.createFloatingText(this.player.x, this.player.y - 20, '+' + healAmount + ' HP (emergency)', '#40ff40', 12);
            this.addMessage("Emergency heal: -30 energy");
        }
    }

    swapWeapon() {
        const temp = this.playerData.weapon;
        this.playerData.weapon = this.playerData.secondaryWeapon;
        this.playerData.secondaryWeapon = temp;
        this.addMessage("Swapped to: " + this.playerData.weapon);
    }

    useItem() {
        // Use equipped throwable (grenade)
        if (this.playerData.ammo.grenades > 0) {
            this.throwGrenade();
        }
    }

    throwGrenade() {
        if (this.playerData.ammo.grenades <= 0) return;

        this.playerData.ammo.grenades--;
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

        const grenade = this.add.circle(this.player.x, this.player.y, 6, 0x80ff40);
        grenade.setDepth(15);

        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        const dist = Math.min(300, Phaser.Math.Distance.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y));

        this.tweens.add({
            targets: grenade,
            x: this.player.x + Math.cos(angle) * dist,
            y: this.player.y + Math.sin(angle) * dist,
            duration: 500,
            onComplete: () => {
                this.createExplosion(grenade.x, grenade.y, 80, 60);
                grenade.destroy();
            }
        });

        this.addMessage("Threw grenade!");
    }

    createExplosion(x, y, radius, damage) {
        // Visual explosion
        const blast = this.add.circle(x, y, radius, 0xff8800, 0.6);
        this.tweens.add({
            targets: blast,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => blast.destroy()
        });

        // Screen shake
        this.triggerScreenShake(12);

        // Damage enemies in radius
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < radius) {
                const falloff = 1 - (dist / radius);
                this.damageEnemy(enemy, Math.floor(damage * falloff));
            }
        }

        // Damage player if in radius
        const playerDist = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
        if (playerDist < radius && !this.playerData.invincible) {
            const falloff = 1 - (playerDist / radius);
            this.damagePlayer(Math.floor(damage * 0.5 * falloff));
        }

        // Explosion particles
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const particle = this.add.circle(x, y, 4, 0xffaa00, 0.8);
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                alpha: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
    }

    update(time, delta) {
        if (this.gameData.state !== 'playing') return;

        const dt = delta / 1000;

        this.updatePlayer(dt, time);
        this.updateEnemies(dt, time);
        this.updateBullets(dt);
        this.updateLighting();
        this.updateUI();
        this.updateVisualEffects(dt);
        this.updateFloatingTexts(dt);
        this.updateKillStreak(dt);
        this.updateDebugOverlay();

        // Energy regen
        if (this.playerData.energy < this.playerData.maxEnergy) {
            this.playerData.energy = Math.min(this.playerData.maxEnergy, this.playerData.energy + 2 * dt);
        }

        // Flashlight cost
        if (this.playerData.flashlightOn) {
            this.playerData.energy = Math.max(0, this.playerData.energy - 1 * dt);
            if (this.playerData.energy <= 0) this.playerData.flashlightOn = false;
        }

        // Victory check
        const distToExit = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitX, this.exitY);
        if (distToExit < 40 && this.enemies.filter(e => e.active).length === 0) {
            this.gameData.state = 'victory';
            this.addMessage("DECK CLEARED. Proceed to elevator.");
        }

        // Death check
        if (this.playerData.hp <= 0) {
            this.gameData.state = 'gameover';
        }
    }

    updatePlayer(dt, time) {
        // Handle dodge roll
        if (this.playerData.isDodging) {
            this.playerData.dodgeTimer -= dt;
            const dodgeSpeed = 250;
            const newX = this.player.x + this.playerData.dodgeDirection.x * dodgeSpeed * dt;
            const newY = this.player.y + this.playerData.dodgeDirection.y * dodgeSpeed * dt;
            if (!this.checkCollision(newX, this.player.y, 12)) this.player.x = newX;
            if (!this.checkCollision(this.player.x, newY, 12)) this.player.y = newY;

            if (this.playerData.dodgeTimer <= 0.1) {
                this.playerData.invincible = false;
            }
            if (this.playerData.dodgeTimer <= 0) {
                this.playerData.isDodging = false;
                this.playerData.dodgeCooldown = 1.0;
                this.player.setAlpha(1);
            }
            return; // Skip normal movement during dodge
        }

        // Dodge cooldown
        if (this.playerData.dodgeCooldown > 0) {
            this.playerData.dodgeCooldown -= dt;
        }

        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        this.player.rotation = angle;

        // Crouching
        this.playerData.isCrouching = this.cursors.ctrl.isDown;

        // Sprint requires stamina now
        this.playerData.isSprinting = this.cursors.shift.isDown && this.playerData.stamina > 0 && !this.playerData.isCrouching;
        let speed = 150;
        if (this.playerData.isSprinting) {
            speed = 250;
            this.playerData.stamina = Math.max(0, this.playerData.stamina - 20 * dt);
        } else if (this.playerData.isCrouching) {
            speed = 80;
        }

        // Stamina regeneration (slower when moving)
        let moving = false;
        let dx = 0, dy = 0;
        if (this.cursors.up.isDown) dy = -1;
        if (this.cursors.down.isDown) dy = 1;
        if (this.cursors.left.isDown) dx = -1;
        if (this.cursors.right.isDown) dx = 1;
        moving = dx !== 0 || dy !== 0;

        if (!this.playerData.isSprinting) {
            const regenRate = moving ? 15 : 30;
            this.playerData.stamina = Math.min(this.playerData.maxStamina, this.playerData.stamina + regenRate * dt);
        }

        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            dx /= len;
            dy /= len;

            const newX = this.player.x + dx * speed * dt;
            const newY = this.player.y + dy * speed * dt;

            if (!this.checkCollision(newX, this.player.y, 12)) this.player.x = newX;
            if (!this.checkCollision(this.player.x, newY, 12)) this.player.y = newY;
        }

        // Reloading
        if (this.playerData.reloading) {
            this.playerData.reloadTime -= dt * 1000;
            if (this.playerData.reloadTime <= 0) {
                this.playerData.reloading = false;
                const weapon = this.weapons[this.playerData.weapon];
                if (weapon.ammoType && weapon.magazineSize) {
                    const needed = weapon.magazineSize - this.playerData.magazine;
                    const available = Math.min(needed, this.playerData.ammo[weapon.ammoType] || 0);
                    this.playerData.magazine += available;
                    this.playerData.ammo[weapon.ammoType] -= available;
                }
            }
        }

        // Update player status effects
        this.updatePlayerStatusEffects(dt);

        // Auto-fire
        if (pointer.isDown && !this.playerData.reloading && !this.playerData.isDodging) {
            this.shoot();
        }
    }

    updatePlayerStatusEffects(dt) {
        for (let i = this.playerData.statusEffects.length - 1; i >= 0; i--) {
            const effect = this.playerData.statusEffects[i];
            effect.duration -= dt;

            // Apply DOT
            if (effect.damagePerSec) {
                const damage = effect.damagePerSec * dt * (effect.stacks || 1);
                this.playerData.hp -= damage;
                if (Math.random() < 0.1) {
                    this.createFloatingText(this.player.x, this.player.y - 20, '-' + Math.ceil(damage), effect.color ? '#' + effect.color.toString(16) : '#ff4444', 10);
                }
            }

            // Remove expired effects
            if (effect.duration <= 0) {
                this.playerData.statusEffects.splice(i, 1);
                this.addMessage(effect.name + " wore off");
            }
        }
    }

    applyStatusEffect(target, effectName) {
        const effectData = STATUS_EFFECTS[effectName];
        if (!effectData) return;

        const effects = target === this.player ? this.playerData.statusEffects : target.enemyData.statusEffects;

        // Check for existing effect
        const existing = effects.find(e => e.name === effectData.name);
        if (existing) {
            if (effectData.stacks) {
                existing.stacks = Math.min((existing.stacks || 1) + 1, effectData.maxStacks || 3);
                existing.duration = effectData.duration;
            } else {
                existing.duration = effectData.duration;
            }
        } else {
            effects.push({
                ...effectData,
                stacks: 1
            });
            this.addMessage((target === this.player ? "You are " : "Enemy ") + effectData.name.toLowerCase());
        }
    }

    checkCollision(x, y, radius) {
        const minTX = Math.floor((x - radius) / TILE_SIZE);
        const maxTX = Math.floor((x + radius) / TILE_SIZE);
        const minTY = Math.floor((y - radius) / TILE_SIZE);
        const maxTY = Math.floor((y + radius) / TILE_SIZE);

        for (let ty = minTY; ty <= maxTY; ty++) {
            for (let tx = minTX; tx <= maxTX; tx++) {
                if (ty < 0 || ty >= MAP_HEIGHT || tx < 0 || tx >= MAP_WIDTH) return true;
                if (this.map[ty][tx] === 1) return true;
            }
        }

        for (const door of this.doors) {
            if (!door.doorData.open) {
                const dist = Phaser.Math.Distance.Between(x, y, door.x, door.y);
                if (dist < radius + 16) return true;
            }
        }

        return false;
    }

    shoot() {
        const now = this.time.now;
        const weapon = this.weapons[this.playerData.weapon];

        if (now - this.playerData.lastShot < weapon.fireRate) return;

        if (weapon.melee) {
            this.playerData.lastShot = now;
            const attackX = this.player.x + Math.cos(this.player.rotation) * weapon.range;
            const attackY = this.player.y + Math.sin(this.player.rotation) * weapon.range;

            for (const enemy of this.enemies) {
                if (!enemy.active) continue;
                const dist = Phaser.Math.Distance.Between(attackX, attackY, enemy.x, enemy.y);
                if (dist < 30) {
                    this.damageEnemy(enemy, weapon.damage);
                }
            }

            // Visual effect
            const flash = this.add.circle(attackX, attackY, 15, 0xffffff, 0.5);
            this.tweens.add({ targets: flash, alpha: 0, duration: 100, onComplete: () => flash.destroy() });
        } else {
            if (this.playerData.magazine <= 0) {
                this.reload();
                return;
            }

            this.playerData.magazine--;
            this.playerData.lastShot = now;
            this.stats.shotsFired++;

            const count = weapon.pellets || 1;
            for (let i = 0; i < count; i++) {
                const spread = weapon.pellets ? (Math.random() - 0.5) * 0.4 : 0;
                const angle = this.player.rotation + spread;

                const bullet = this.add.sprite(
                    this.player.x + Math.cos(this.player.rotation) * 20,
                    this.player.y + Math.sin(this.player.rotation) * 20,
                    'bullet'
                );
                bullet.setDepth(15);
                bullet.bulletData = {
                    vx: Math.cos(angle) * 600,
                    vy: Math.sin(angle) * 600,
                    damage: weapon.damage,
                    range: weapon.range,
                    traveled: 0,
                    owner: 'player'
                };
                this.bullets.push(bullet);
            }

            // Muzzle flash
            const muzzle = this.add.circle(
                this.player.x + Math.cos(this.player.rotation) * 25,
                this.player.y + Math.sin(this.player.rotation) * 25,
                12, 0xffff80, 0.8
            );
            this.tweens.add({ targets: muzzle, alpha: 0, scale: 0.5, duration: 50, onComplete: () => muzzle.destroy() });
        }
    }

    reload() {
        const weapon = this.weapons[this.playerData.weapon];
        if (!weapon.ammoType) return;
        if (this.playerData.magazine >= weapon.magazineSize) return;
        if (this.playerData.ammo[weapon.ammoType] <= 0) return;

        this.playerData.reloading = true;
        this.playerData.reloadTime = 1500;
        this.addMessage("Reloading...");
    }

    selectWeapon(weapon) {
        this.playerData.weapon = weapon;
        this.playerData.reloading = false;
        const w = this.weapons[weapon];
        if (w.magazineSize) this.playerData.magazine = Math.min(this.playerData.magazine, w.magazineSize);
        this.addMessage("Equipped: " + weapon);
    }

    interact() {
        // Check doors
        for (const door of this.doors) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, door.x, door.y);
            if (dist < 50) {
                if (door.doorData.locked) {
                    this.addMessage("Door locked. Requires " + door.doorData.keycard + " keycard.");
                } else {
                    door.doorData.open = !door.doorData.open;
                    door.setVisible(!door.doorData.open);
                }
                return;
            }
        }

        // Check terminals
        for (const terminal of this.terminals) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, terminal.x, terminal.y);
            if (dist < 50 && !terminal.terminalData.hacked) {
                terminal.terminalData.hacked = true;
                this.gameData.score += 100;
                this.stats.terminalsHacked++;
                this.createFloatingText(terminal.x, terminal.y - 30, 'HACKED +100', '#40ff40', 14);
                this.addMessage("M.A.R.I.A.: You dare access my systems?");
                // Data particles
                for (let i = 0; i < 8; i++) {
                    const particle = this.add.circle(terminal.x, terminal.y, 4, 0x40aa60, 0.8);
                    this.tweens.add({
                        targets: particle,
                        x: terminal.x + (Math.random() - 0.5) * 60,
                        y: terminal.y - 30 - Math.random() * 40,
                        alpha: 0,
                        duration: 600,
                        onComplete: () => particle.destroy()
                    });
                }
                return;
            }
        }

        // Check items
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (!item.active) continue;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
            if (dist < 40) {
                this.pickupItem(item, i);
                return;
            }
        }
    }

    pickupItem(item, index) {
        const data = item.itemData;
        this.stats.itemsPickedUp++;

        let feedbackColor = '#ffffff';
        let feedbackText = '';

        switch (data.type) {
            case 'medkit':
                this.playerData.hp = Math.min(this.playerData.maxHp, this.playerData.hp + data.amount);
                this.addMessage("Used: medkit +" + data.amount);
                feedbackText = '+' + data.amount + ' HP';
                feedbackColor = '#40ff40';
                // Healing particles
                for (let i = 0; i < 6; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const particle = this.add.circle(this.player.x + Math.cos(angle) * 20, this.player.y + Math.sin(angle) * 20, 4, 0x40ff40, 0.8);
                    this.tweens.add({
                        targets: particle,
                        y: particle.y - 30,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => particle.destroy()
                    });
                }
                break;

            case 'bullets':
                this.playerData.ammo.bullets += data.amount;
                this.addMessage("Picked up: bullets x" + data.amount);
                feedbackText = '+' + data.amount + ' BULLETS';
                feedbackColor = '#ffff40';
                break;

            case 'shells':
                this.playerData.ammo.shells += data.amount;
                this.addMessage("Picked up: shells x" + data.amount);
                feedbackText = '+' + data.amount + ' SHELLS';
                feedbackColor = '#ff8040';
                break;

            case 'energy':
                this.playerData.energy = Math.min(this.playerData.maxEnergy, this.playerData.energy + data.amount);
                this.addMessage("Picked up: energy cell");
                feedbackText = '+' + data.amount + ' ENERGY';
                feedbackColor = '#40ffff';
                break;

            case 'grenades':
                this.playerData.ammo.grenades += data.amount;
                this.addMessage("Picked up: grenades x" + data.amount);
                feedbackText = '+' + data.amount + ' GRENADES';
                feedbackColor = '#80ff40';
                break;

            case 'scrap':
                this.playerData.scrap += data.amount;
                this.addMessage("Picked up: scrap x" + data.amount);
                feedbackText = '+' + data.amount + ' SCRAP';
                feedbackColor = '#808080';
                break;

            case 'cyberModules':
                this.playerData.cyberModules += data.amount;
                this.addMessage("Picked up: cyber modules x" + data.amount);
                feedbackText = '+' + data.amount + ' MODULES';
                feedbackColor = '#ff40ff';
                break;

            default:
                this.addMessage("Picked up: " + data.type);
                feedbackText = '+' + data.type.toUpperCase();
        }

        this.createFloatingText(item.x, item.y - 20, feedbackText, feedbackColor, 12);

        // Pickup sparkle
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const particle = this.add.circle(item.x, item.y, 4, 0xffff80, 0.8);
            this.tweens.add({
                targets: particle,
                x: item.x + Math.cos(angle) * 30,
                y: item.y + Math.sin(angle) * 30,
                alpha: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }

        item.destroy();
        this.items.splice(index, 1);
    }

    updateEnemies(dt, time) {
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            const data = enemy.enemyData;
            if (data.hp <= 0) continue;

            // Update enemy status effects
            this.updateEnemyStatusEffects(enemy, dt);

            // Check if stunned - skip movement/attack
            const isStunned = data.statusEffects && data.statusEffects.find(e => e.name === 'Shocked');
            if (isStunned) continue;

            const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            // Stealth modifier based on player crouching/darkness
            const stealthMod = this.playerData.isCrouching ? 0.6 : 1.0;
            const detectRange = (this.playerData.flashlightOn ? 250 : 80) * stealthMod;
            const canSee = distToPlayer < detectRange && !this.playerData.invincible;

            // Behavior-specific speed modifiers
            let speedMod = 1.0;
            if (data.behavior === 'swarm') speedMod = 1.2;
            if (data.behavior === 'tank') speedMod = 0.8;
            if (data.behavior === 'stealth') speedMod = 1.3;

            switch (data.state) {
                case 'patrol':
                    if (canSee && distToPlayer < detectRange) {
                        data.state = 'chase';
                        data.lastSeen = { x: this.player.x, y: this.player.y };
                        if (Math.random() < 0.3) this.addMessage("M.A.R.I.A.: Target acquired.");
                    } else {
                        if (!data.patrolTarget || Math.random() < 0.01) {
                            data.patrolTarget = { x: enemy.x + (Math.random() - 0.5) * 200, y: enemy.y + (Math.random() - 0.5) * 200 };
                        }
                        this.moveEnemy(enemy, data.patrolTarget.x, data.patrolTarget.y, dt, speedMod * 0.6);
                    }
                    break;

                case 'chase':
                    if (canSee) {
                        data.lastSeen = { x: this.player.x, y: this.player.y };
                        data.alertTimer = 5;
                    }

                    // Behavior-specific chase patterns
                    if (data.behavior === 'charge' && distToPlayer < 150 && data.chargeTimer <= 0) {
                        // Brute charge attack
                        data.chargeTimer = 3;
                        data.charging = true;
                        this.createFloatingText(enemy.x, enemy.y - 30, 'CHARGING!', '#ff4400', 14);
                    }

                    if (data.charging) {
                        // Fast charge toward player
                        this.moveEnemy(enemy, this.player.x, this.player.y, dt, 2.5);
                        if (distToPlayer < 30) {
                            this.damagePlayer(data.damage * 1.5);
                            this.triggerScreenShake(10);
                            this.addMessage("BRUTE CHARGE! -" + Math.floor(data.damage * 1.5) + " HP");
                            data.charging = false;
                        }
                        data.chargeTimer -= dt;
                        if (data.chargeTimer <= 2) data.charging = false;
                    } else if (distToPlayer < data.range && canSee) {
                        data.state = 'attack';
                    } else if (data.alertTimer > 0) {
                        this.moveEnemy(enemy, data.lastSeen.x, data.lastSeen.y, dt, speedMod);
                        data.alertTimer -= dt;
                    } else {
                        data.state = 'patrol';
                    }

                    // Update charge cooldown
                    if (data.chargeTimer > 0 && !data.charging) data.chargeTimer -= dt;
                    break;

                case 'attack':
                    enemy.rotation = angleToPlayer;

                    const attackRate = data.behavior === 'swarm' ? 600 : data.behavior === 'tank' ? 1500 : 1000;

                    if (time - data.lastAttack > attackRate) {
                        data.lastAttack = time;

                        if ((data.behavior === 'ranged' || data.behavior === 'aggressive' || data.behavior === 'patrol') && distToPlayer > 50) {
                            // Ranged attack
                            const bullet = this.add.sprite(enemy.x, enemy.y, 'laser');
                            bullet.setDepth(15);
                            bullet.bulletData = {
                                vx: Math.cos(angleToPlayer) * 300,
                                vy: Math.sin(angleToPlayer) * 300,
                                damage: data.damage,
                                range: 300,
                                traveled: 0,
                                owner: 'enemy'
                            };
                            this.bullets.push(bullet);
                        } else if (distToPlayer < data.range + 20) {
                            // Melee attack
                            if (!this.playerData.invincible) {
                                this.damagePlayer(data.damage);

                                // Swarm enemies can cause bleeding
                                if (data.behavior === 'swarm' && Math.random() < 0.2) {
                                    this.applyStatusEffect(this.player, 'bleeding');
                                }

                                this.addMessage(data.typeName + " attacks! -" + data.damage + " HP");
                            }
                        }
                    }

                    // Swarm enemies keep moving during attack
                    if (data.behavior === 'swarm' && distToPlayer > 20) {
                        this.moveEnemy(enemy, this.player.x, this.player.y, dt, speedMod);
                    }

                    if (distToPlayer > data.range * 1.5 || !canSee) {
                        data.state = 'chase';
                    }
                    break;
            }

            // Stealth enemies cloak when far from player
            if (data.behavior === 'stealth') {
                if (distToPlayer > 150 && !data.cloaked) {
                    data.cloaked = true;
                    enemy.setAlpha(0.3);
                } else if (distToPlayer < 100 && data.cloaked) {
                    data.cloaked = false;
                    enemy.setAlpha(1);
                    this.addMessage("Assassin decloaks!");
                }
            }
        }
    }

    updateEnemyStatusEffects(enemy, dt) {
        const data = enemy.enemyData;
        if (!data.statusEffects) return;

        for (let i = data.statusEffects.length - 1; i >= 0; i--) {
            const effect = data.statusEffects[i];
            effect.duration -= dt;

            // Apply DOT
            if (effect.damagePerSec) {
                const damage = effect.damagePerSec * dt * (effect.stacks || 1);
                data.hp -= damage;
                if (data.hp <= 0) {
                    this.killEnemy(enemy, false);
                    return;
                }
            }

            // Remove expired effects
            if (effect.duration <= 0) {
                data.statusEffects.splice(i, 1);
            }
        }
    }

    moveEnemy(enemy, targetX, targetY, dt, speedMod = 1.0) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY);
        enemy.rotation = angle;

        const speed = enemy.enemyData.speed * speedMod;
        const newX = enemy.x + Math.cos(angle) * speed * dt;
        const newY = enemy.y + Math.sin(angle) * speed * dt;

        if (!this.checkCollision(newX, enemy.y, 14)) enemy.x = newX;
        if (!this.checkCollision(enemy.x, newY, 14)) enemy.y = newY;
    }

    damageEnemy(enemy, damage, weaponKey = null) {
        const data = enemy.enemyData;
        const weapon = weaponKey ? this.weapons[weaponKey] : this.weapons[this.playerData.weapon];

        // Apply armor reduction
        let armor = data.armor || 0;
        if (weapon) {
            if (weapon.bypassArmor) {
                armor = 0;
            } else if (weapon.penetration) {
                armor = Math.floor(armor * (1 - weapon.penetration));
            }
        }

        // Reduce damage by armor
        damage = Math.max(1, damage - armor);

        // Critical hit system (15% chance, 2x damage)
        const isCrit = Math.random() < 0.15;
        if (isCrit) {
            damage *= 2;
            this.stats.critCount++;
        }

        // Backstab bonus (3x from behind)
        const angleToEnemy = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(enemy.rotation - angleToEnemy));
        if (angleDiff < Math.PI / 4) {
            damage = Math.floor(damage * 1.5);
            this.createFloatingText(enemy.x, enemy.y - 40, 'BACKSTAB!', '#ff8800', 12);
        }

        data.hp -= damage;
        data.state = 'chase';
        data.lastSeen = { x: this.player.x, y: this.player.y };
        data.alertTimer = 5;

        this.stats.totalDamageDealt += damage;
        this.stats.shotsHit++;

        // Apply weapon effects
        if (weapon) {
            // Stun effect
            if (weapon.stunDuration && Math.random() < 0.5) {
                this.applyStatusEffect(enemy, 'shocked');
            }
            // Knockback
            if (weapon.knockback) {
                const knockAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                const knockDist = weapon.knockback * 20;
                const newX = enemy.x + Math.cos(knockAngle) * knockDist;
                const newY = enemy.y + Math.sin(knockAngle) * knockDist;
                if (!this.checkCollision(newX, enemy.y, 14)) enemy.x = newX;
                if (!this.checkCollision(enemy.x, newY, 14)) enemy.y = newY;
            }
        }

        // Random bleed chance for certain attacks
        if (Math.random() < 0.1 && weapon && weapon.melee) {
            this.applyStatusEffect(enemy, 'bleeding');
        }

        // Floating damage number
        const armorText = armor > 0 ? ' (-' + armor + ' armor)' : '';
        this.createFloatingText(
            enemy.x, enemy.y - 20,
            damage.toString() + (isCrit ? '!' : ''),
            isCrit ? '#ffff00' : '#ff4444',
            isCrit ? 18 : 14
        );

        // Screen shake
        this.triggerScreenShake(isCrit ? 6 : 3);

        // Blood/spark effect based on enemy type
        const isRobot = data.type && (data.type.includes('BOT') || data.type === 'MAINTENANCE_BOT' || data.type === 'SECURITY_BOT');
        const effectColor = isRobot ? 0xffff40 : 0xaa4040;
        const count = isCrit ? 4 : 1;
        for (let i = 0; i < count; i++) {
            const particle = this.add.circle(enemy.x + (Math.random() - 0.5) * 20, enemy.y + (Math.random() - 0.5) * 20, 6, effectColor, 0.8);
            this.tweens.add({ targets: particle, alpha: 0, scale: 2, duration: 400, onComplete: () => particle.destroy() });
        }

        if (data.hp <= 0) {
            this.killEnemy(enemy, isCrit);
        }
    }

    killEnemy(enemy, wasCrit) {
        this.stats.killCount++;

        // Kill streak
        this.killStreak++;
        this.killStreakTimer = 3;
        if (this.killStreak > this.stats.maxKillStreak) {
            this.stats.maxKillStreak = this.killStreak;
        }

        // Kill streak messages
        if (this.killStreak >= 3) {
            const streakMessages = { 3: 'TRIPLE KILL!', 4: 'QUAD KILL!', 5: 'RAMPAGE!', 6: 'MASSACRE!' };
            const msg = streakMessages[Math.min(this.killStreak, 6)] || 'UNSTOPPABLE!';
            this.createFloatingText(this.player.x, this.player.y - 60, msg, '#ffaa00', 22);
        }

        // Death burst particles
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const particle = this.add.circle(enemy.x, enemy.y, 5, 0xaa4040, 0.8);
            this.tweens.add({
                targets: particle,
                x: enemy.x + Math.cos(angle) * 50,
                y: enemy.y + Math.sin(angle) * 50,
                alpha: 0,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }
        this.triggerScreenShake(8);

        enemy.setActive(false).setVisible(false);
        this.gameData.score += wasCrit ? 75 : 50;
        this.addMessage("Enemy destroyed. +" + (wasCrit ? 75 : 50) + " pts");
    }

    updateBullets(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (!bullet.active) continue;
            const data = bullet.bulletData;

            bullet.x += data.vx * dt;
            bullet.y += data.vy * dt;
            data.traveled += Math.hypot(data.vx * dt, data.vy * dt);

            // Wall collision
            const tx = Math.floor(bullet.x / TILE_SIZE);
            const ty = Math.floor(bullet.y / TILE_SIZE);
            if (ty < 0 || ty >= MAP_HEIGHT || tx < 0 || tx >= MAP_WIDTH || this.map[ty][tx] === 1) {
                bullet.destroy();
                this.bullets.splice(i, 1);
                continue;
            }

            // Range check
            if (data.traveled > data.range) {
                bullet.destroy();
                this.bullets.splice(i, 1);
                continue;
            }

            // Hit detection
            if (data.owner === 'player') {
                for (const enemy of this.enemies) {
                    if (!enemy.active) continue;
                    const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
                    if (dist < 15) {
                        this.damageEnemy(enemy, data.damage);
                        bullet.destroy();
                        this.bullets.splice(i, 1);
                        break;
                    }
                }
            } else {
                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y);
                if (dist < 15) {
                    this.damagePlayer(data.damage);
                    this.addMessage("Hit! -" + data.damage + " HP");
                    bullet.destroy();
                    this.bullets.splice(i, 1);
                }
            }
        }
    }

    updateLighting() {
        this.darkness.clear();

        // Much lighter ambient darkness (0.35 instead of 0.85)
        const baseDarkness = 0.35;

        // Create gradual darkness effect - darker at edges, lighter near player
        const playerScreenX = this.player.x - this.cameras.main.scrollX;
        const playerScreenY = this.player.y - this.cameras.main.scrollY;

        // Draw base darkness overlay (much lighter than before)
        this.darkness.fillStyle(0x000000, baseDarkness);
        this.darkness.fillRect(
            this.cameras.main.scrollX,
            this.cameras.main.scrollY,
            GAME_WIDTH,
            GAME_HEIGHT
        );

        // If flashlight is on, draw a bright cone
        if (this.playerData.flashlightOn) {
            // Draw flashlight cone with graduated light (multiple layers)
            const coneLength = 400;
            const coneWidth = Math.PI / 2.5; // Wider cone

            // Outer dim light
            this.darkness.fillStyle(0x1a1a1a, 0.5);
            this.drawLightCone(coneLength, coneWidth);

            // Middle light
            this.darkness.fillStyle(0x2a2a2a, 0.4);
            this.drawLightCone(coneLength * 0.8, coneWidth * 0.85);

            // Inner bright light
            this.darkness.fillStyle(0x3a3a3a, 0.35);
            this.drawLightCone(coneLength * 0.6, coneWidth * 0.7);

            // Core light (brightest)
            this.darkness.fillStyle(0x4a4a4a, 0.3);
            this.drawLightCone(coneLength * 0.4, coneWidth * 0.5);
        }

        // Large ambient light around player (always visible)
        const ambientRadius = this.playerData.flashlightOn ? 120 : 80;

        // Outer ambient glow
        this.darkness.fillStyle(0x1a1a1a, 0.3);
        this.darkness.fillCircle(this.player.x, this.player.y, ambientRadius);

        // Inner ambient glow
        this.darkness.fillStyle(0x2a2a2a, 0.25);
        this.darkness.fillCircle(this.player.x, this.player.y, ambientRadius * 0.7);

        // Core ambient light
        this.darkness.fillStyle(0x3a3a3a, 0.2);
        this.darkness.fillCircle(this.player.x, this.player.y, ambientRadius * 0.4);
    }

    drawLightCone(length, width) {
        this.darkness.beginPath();
        this.darkness.moveTo(this.player.x, this.player.y);

        const startAngle = this.player.rotation - width / 2;
        const endAngle = this.player.rotation + width / 2;

        // Cast rays and stop at walls
        for (let a = startAngle; a <= endAngle; a += 0.03) {
            const rayLength = this.castRay(this.player.x, this.player.y, a, length);
            const x = this.player.x + Math.cos(a) * rayLength;
            const y = this.player.y + Math.sin(a) * rayLength;
            this.darkness.lineTo(x, y);
        }

        this.darkness.closePath();
        this.darkness.fill();
    }

    // Cast a ray from origin in direction angle, return distance to first wall or max length
    castRay(ox, oy, angle, maxLength) {
        const step = TILE_SIZE / 4; // Ray step size
        const dx = Math.cos(angle) * step;
        const dy = Math.sin(angle) * step;

        let x = ox;
        let y = oy;
        let dist = 0;

        while (dist < maxLength) {
            x += dx;
            y += dy;
            dist += step;

            // Check if we hit a wall
            const tx = Math.floor(x / TILE_SIZE);
            const ty = Math.floor(y / TILE_SIZE);

            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) {
                return dist;
            }

            if (this.map[ty] && this.map[ty][tx] === 1) {
                return dist;
            }
        }

        return maxLength;
    }

    updateUI() {
        // Weapon highlight
        for (const wt of this.weaponTexts) {
            const isEquipped = wt.weapon === this.playerData.weapon;
            const isSecondary = wt.weapon === this.playerData.secondaryWeapon;
            wt.text.setBackgroundColor(isEquipped ? '#004400' : isSecondary ? '#333333' : null);
            wt.text.setColor(isEquipped ? '#00ff00' : isSecondary ? '#aaaaaa' : '#666666');
        }

        // Ammo for all types
        const ammoLines = [];
        if (this.playerData.ammo.bullets > 0) ammoLines.push('bullets:' + this.playerData.ammo.bullets);
        if (this.playerData.ammo.shells > 0) ammoLines.push('shells:' + this.playerData.ammo.shells);
        if (this.playerData.ammo.energy > 0) ammoLines.push('energy:' + this.playerData.ammo.energy);
        if (this.playerData.ammo.grenades > 0) ammoLines.push('grenades:' + this.playerData.ammo.grenades);
        this.ammoText.setText(ammoLines.join(' | '));

        // Stats with stamina
        const weapon = this.weapons[this.playerData.weapon];
        let statsStr = '';
        if (weapon && weapon.ammoType && weapon.magazineSize) {
            statsStr += 'ammo  =' + this.playerData.magazine + '/' + (this.playerData.ammo[weapon.ammoType] || 0) + '\n';
        } else if (weapon && weapon.melee) {
            statsStr += 'ammo  = MELEE\n';
        }
        statsStr += 'health=' + Math.floor(this.playerData.hp) + '/' + this.playerData.maxHp + '\n';
        statsStr += 'energy=' + Math.floor(this.playerData.energy) + '/' + this.playerData.maxEnergy + '\n';
        statsStr += 'stamina=' + Math.floor(this.playerData.stamina) + '/' + this.playerData.maxStamina;
        this.statsText.setText(statsStr);

        // Status effects
        const statusEffects = this.playerData.statusEffects.map(e => e.name + (e.stacks > 1 ? 'x' + e.stacks : '')).join(', ');
        this.statusText.setText(statusEffects || '');

        // Description
        let desc = weapon ? weapon.name + ' - Dmg:' + weapon.damage : '';
        if (weapon && weapon.penetration) desc += ' (Armor Pen:' + Math.round(weapon.penetration * 100) + '%)';
        if (weapon && weapon.bypassArmor) desc += ' (Ignores Armor)';
        this.descText.setText(desc);

        // Update minimap
        this.updateMinimap();

        // Messages
        let msgStr = '';
        for (let i = 0; i < Math.min(3, this.gameData.messages.length); i++) {
            msgStr += this.gameData.messages[i].text + '\n';
        }
        this.messagesText.setText(msgStr);

        // Crosshair
        this.crosshair.clear();
        this.crosshair.lineStyle(1, 0x80ff80);
        const mx = this.input.activePointer.x;
        const my = this.input.activePointer.y;
        this.crosshair.lineBetween(mx - 10, my, mx - 4, my);
        this.crosshair.lineBetween(mx + 4, my, mx + 10, my);
        this.crosshair.lineBetween(mx, my - 10, mx, my - 4);
        this.crosshair.lineBetween(mx, my + 4, mx, my + 10);

        // Game state overlays
        if (this.gameData.state === 'gameover' && !this.endScreenDrawn) {
            this.endScreenDrawn = true;
            const timeSurvived = Math.floor((Date.now() - this.gameStartTime) / 1000);
            const accuracy = this.stats.shotsFired > 0 ? Math.round(this.stats.shotsHit / this.stats.shotsFired * 100) : 0;

            // Performance rating
            let rating = 'FAILURE';
            if (this.stats.killCount >= 3 && timeSurvived >= 30) rating = 'POOR';
            if (this.stats.killCount >= 5 && accuracy >= 30) rating = 'ACCEPTABLE';
            if (this.stats.killCount >= 8 && accuracy >= 50 && this.stats.critCount >= 2) rating = 'COMMENDABLE';

            const overlay = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.9);
            overlay.setScrollFactor(0).setDepth(200);

            const title = this.add.text(GAME_WIDTH/2, 100, 'SYSTEM FAILURE', { fontSize: '48px', fontFamily: 'monospace', color: '#cc4040' });
            title.setOrigin(0.5).setScrollFactor(0).setDepth(201);

            const ratingText = this.add.text(GAME_WIDTH/2, 160, `RATING: ${rating}`, { fontSize: '28px', fontFamily: 'monospace', color: rating === 'COMMENDABLE' ? '#40aa60' : rating === 'ACCEPTABLE' ? '#aaaa40' : '#cc4040' });
            ratingText.setOrigin(0.5).setScrollFactor(0).setDepth(201);

            const statsLines = [
                `TIME SURVIVED: ${Math.floor(timeSurvived / 60)}:${(timeSurvived % 60).toString().padStart(2, '0')}`,
                ``,
                `KILLS: ${this.stats.killCount}`,
                `DAMAGE DEALT: ${this.stats.totalDamageDealt}`,
                `DAMAGE TAKEN: ${this.stats.totalDamageTaken}`,
                `CRITICAL HITS: ${this.stats.critCount}`,
                `MAX KILL STREAK: ${this.stats.maxKillStreak}`,
                ``,
                `SHOTS FIRED: ${this.stats.shotsFired}`,
                `SHOTS HIT: ${this.stats.shotsHit}`,
                `ACCURACY: ${accuracy}%`,
                ``,
                `TERMINALS HACKED: ${this.stats.terminalsHacked}`,
                `ITEMS COLLECTED: ${this.stats.itemsPickedUp}`,
                `FINAL SCORE: ${this.gameData.score}`
            ];

            const statsText = this.add.text(GAME_WIDTH/2, 380, statsLines.join('\n'), { fontSize: '16px', fontFamily: 'monospace', color: '#aaaaaa', align: 'center' });
            statsText.setOrigin(0.5).setScrollFactor(0).setDepth(201);

            const maria = this.add.text(GAME_WIDTH/2, GAME_HEIGHT - 80, 'M.A.R.I.A.: Another human terminated. How predictable.', { fontSize: '14px', fontFamily: 'monospace', color: '#40aa60' });
            maria.setOrigin(0.5).setScrollFactor(0).setDepth(201);

        } else if (this.gameData.state === 'victory' && !this.endScreenDrawn) {
            this.endScreenDrawn = true;
            const timeElapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
            const accuracy = this.stats.shotsFired > 0 ? Math.round(this.stats.shotsHit / this.stats.shotsFired * 100) : 0;

            // Efficiency rating
            let rating = 'D';
            let ratingColor = '#cc4040';
            if (accuracy >= 25 && timeElapsed < 180) { rating = 'C'; ratingColor = '#aaaa40'; }
            if (accuracy >= 40 && timeElapsed < 120) { rating = 'B'; ratingColor = '#40aa60'; }
            if (accuracy >= 55 && timeElapsed < 90 && this.stats.critCount >= 3) { rating = 'A'; ratingColor = '#40aaff'; }
            if (accuracy >= 70 && timeElapsed < 60 && this.stats.critCount >= 5) { rating = 'S'; ratingColor = '#ffaa00'; }

            const overlay = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x001a00, 0.9);
            overlay.setScrollFactor(0).setDepth(200);

            const title = this.add.text(GAME_WIDTH/2, 100, 'DECK CLEARED', { fontSize: '48px', fontFamily: 'monospace', color: '#40aa60' });
            title.setOrigin(0.5).setScrollFactor(0).setDepth(201);

            const ratingText = this.add.text(GAME_WIDTH/2, 160, `EFFICIENCY: ${rating}`, { fontSize: '36px', fontFamily: 'monospace', color: ratingColor });
            ratingText.setOrigin(0.5).setScrollFactor(0).setDepth(201);

            const statsLines = [
                `TIME ELAPSED: ${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')}`,
                ``,
                `KILLS: ${this.stats.killCount}`,
                `DAMAGE DEALT: ${this.stats.totalDamageDealt}`,
                `DAMAGE TAKEN: ${this.stats.totalDamageTaken}`,
                `CRITICAL HITS: ${this.stats.critCount}`,
                `MAX KILL STREAK: ${this.stats.maxKillStreak}`,
                ``,
                `SHOTS FIRED: ${this.stats.shotsFired}`,
                `SHOTS HIT: ${this.stats.shotsHit}`,
                `ACCURACY: ${accuracy}%`,
                ``,
                `TERMINALS HACKED: ${this.stats.terminalsHacked}`,
                `ITEMS COLLECTED: ${this.stats.itemsPickedUp}`,
                `FINAL SCORE: ${this.gameData.score}`
            ];

            const statsText = this.add.text(GAME_WIDTH/2, 380, statsLines.join('\n'), { fontSize: '16px', fontFamily: 'monospace', color: '#aaaaaa', align: 'center' });
            statsText.setOrigin(0.5).setScrollFactor(0).setDepth(201);

            const maria = this.add.text(GAME_WIDTH/2, GAME_HEIGHT - 80, 'M.A.R.I.A.: You have won nothing. I am eternal.', { fontSize: '14px', fontFamily: 'monospace', color: '#40aa60' });
            maria.setOrigin(0.5).setScrollFactor(0).setDepth(201);
        }
    }

    updateMinimap() {
        this.minimap.clear();
        const mapX = GAME_WIDTH - 160;
        const mapY = 60;
        const scale = 3;

        // Draw explored tiles
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const px = mapX + x * scale;
                const py = mapY + y * scale;
                if (this.map[y][x] === 0) {
                    this.minimap.fillStyle(0x333333, 0.5);
                } else {
                    this.minimap.fillStyle(0x666666, 0.5);
                }
                this.minimap.fillRect(px, py, scale - 1, scale - 1);
            }
        }

        // Draw enemies (red dots)
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            const ex = mapX + (enemy.x / TILE_SIZE) * scale;
            const ey = mapY + (enemy.y / TILE_SIZE) * scale;
            this.minimap.fillStyle(0xff4444, 0.8);
            this.minimap.fillRect(ex - 1, ey - 1, 2, 2);
        }

        // Draw items (yellow dots)
        for (const item of this.items) {
            if (!item.active) continue;
            const ix = mapX + (item.x / TILE_SIZE) * scale;
            const iy = mapY + (item.y / TILE_SIZE) * scale;
            this.minimap.fillStyle(0xffff00, 0.6);
            this.minimap.fillRect(ix, iy, 1, 1);
        }

        // Draw exit (green)
        const exitTX = mapX + (this.exitX / TILE_SIZE) * scale;
        const exitTY = mapY + (this.exitY / TILE_SIZE) * scale;
        this.minimap.fillStyle(0x40ff40, 0.8);
        this.minimap.fillRect(exitTX - 1, exitTY - 1, 3, 3);

        // Draw player (cyan dot)
        const px = mapX + (this.player.x / TILE_SIZE) * scale;
        const py = mapY + (this.player.y / TILE_SIZE) * scale;
        this.minimap.fillStyle(0x00ffff, 1);
        this.minimap.fillRect(px - 1, py - 1, 3, 3);
    }

    addMessage(text) {
        this.gameData.messages.unshift({ text, time: this.time.now });
        if (this.gameData.messages.length > 5) this.gameData.messages.pop();
    }

    // Helper methods for visual effects
    damagePlayer(damage) {
        this.playerData.hp -= damage;
        this.stats.totalDamageTaken += damage;

        // Damage flash
        this.damageFlashAlpha = 0.4;

        // Screen shake
        this.triggerScreenShake(5);

        // Blood particles
        for (let i = 0; i < 3; i++) {
            const particle = this.add.circle(this.player.x, this.player.y, 6, 0xff4040, 0.8);
            this.tweens.add({
                targets: particle,
                x: this.player.x + (Math.random() - 0.5) * 60,
                y: this.player.y + (Math.random() - 0.5) * 60,
                alpha: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }

        // Floating damage text
        this.createFloatingText(this.player.x, this.player.y - 30, '-' + damage, '#ff4444', 14);
    }

    createFloatingText(x, y, text, color, size) {
        const floatText = this.add.text(x, y, text, {
            fontSize: size + 'px',
            fontFamily: 'monospace',
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(120);

        this.floatingTexts.push({
            obj: floatText,
            life: 1,
            maxLife: 1,
            vy: -30
        });
    }

    triggerScreenShake(intensity) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    }

    updateVisualEffects(dt) {
        // Damage flash decay
        if (this.damageFlashAlpha > 0) {
            this.damageFlashAlpha = Math.max(0, this.damageFlashAlpha - dt * 2);
            this.damageOverlay.setAlpha(this.damageFlashAlpha);
        }

        // Low health pulsing
        if (this.playerData.hp < 30) {
            this.lowHealthPulse += dt * 4;
            const pulseAlpha = 0.15 + Math.sin(this.lowHealthPulse) * 0.1;
            this.lowHealthOverlay.setAlpha(pulseAlpha);
        } else {
            this.lowHealthOverlay.setAlpha(0);
        }

        // Screen shake
        if (this.screenShake.intensity > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.cameras.main.setScroll(
                this.cameras.main.scrollX + this.screenShake.x,
                this.cameras.main.scrollY + this.screenShake.y
            );
            this.screenShake.intensity = Math.max(0, this.screenShake.intensity - dt * 30);
        }
    }

    updateFloatingTexts(dt) {
        this.floatingTexts = this.floatingTexts.filter(ft => {
            ft.life -= dt;
            ft.obj.y += ft.vy * dt;
            ft.obj.setAlpha(ft.life / ft.maxLife);

            if (ft.life <= 0) {
                ft.obj.destroy();
                return false;
            }
            return true;
        });
    }

    updateKillStreak(dt) {
        if (this.killStreakTimer > 0) {
            this.killStreakTimer -= dt;
            if (this.killStreakTimer <= 0) {
                this.killStreak = 0;
            }
        }

        // Update kill streak display
        if (this.killStreak >= 2) {
            this.killStreakText.setText(`${this.killStreak}x STREAK`);
            this.killStreakText.setVisible(true);
        } else {
            this.killStreakText.setVisible(false);
        }
    }

    updateDebugOverlay() {
        if (!this.debugMode) return;

        const accuracy = this.stats.shotsFired > 0 ? Math.round(this.stats.shotsHit / this.stats.shotsFired * 100) : 0;
        const lines = [
            `KILLS: ${this.stats.killCount}`,
            `DMG DEALT: ${this.stats.totalDamageDealt}`,
            `DMG TAKEN: ${this.stats.totalDamageTaken}`,
            `CRITS: ${this.stats.critCount}`,
            `TERMINALS: ${this.stats.terminalsHacked}`,
            `ITEMS: ${this.stats.itemsPickedUp}`,
            `SHOTS: ${this.stats.shotsFired}`,
            `HITS: ${this.stats.shotsHit}`,
            `ACCURACY: ${accuracy}%`,
            `MAX STREAK: ${this.stats.maxKillStreak}`,
            `STREAK: ${this.killStreak}`,
            `---`,
            `HP: ${Math.floor(this.playerData.hp)}`,
            `ENERGY: ${Math.floor(this.playerData.energy)}`,
            `ENEMIES: ${this.enemies.filter(e => e.active).length}`,
            `SCORE: ${this.gameData.score}`
        ];

        this.debugText.setText(lines.join('\n'));
    }
}

const config = {
    type: Phaser.CANVAS,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#000000',
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
