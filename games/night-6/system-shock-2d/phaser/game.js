// System Shock 2D: Whispers of M.A.R.I.A. - Phaser 3
const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const TILE_SIZE = 32;

// Game State
let gameState = 'menu';
let gamePaused = true;
let currentDeck = 1;

// V2 Harness - time-accelerated testing
let harnessTime = 0;
let debugLogs = [];
function logEvent(msg) {
    debugLogs.push(`[${harnessTime}ms] ${msg}`);
}

// Colors
const COLORS = {
    floor: 0x1a1a2a,
    wall: 0x2a2a3a,
    door: 0x4a4a6a,
    terminal: 0x00ff88,
    blood: 0x882222,
    emergency: 0xff2222,
    energy: 0x22aaff,
    player: 0x4488ff,
    cyborg: 0x886644,
    mutant: 0x448844,
    robot: 0x888888
};

// Deck layouts
const DECKS = {
    1: {
        name: 'Engineering',
        width: 40,
        height: 30,
        rooms: [
            { x: 2, y: 2, w: 8, h: 6, type: 'medbay', name: 'Med Bay (Start)' },
            { x: 12, y: 2, w: 12, h: 4, type: 'corridor', name: 'Main Corridor' },
            { x: 26, y: 2, w: 10, h: 8, type: 'generator', name: 'Generator Room' },
            { x: 2, y: 10, w: 6, h: 6, type: 'security', name: 'Security Office' },
            { x: 10, y: 10, w: 10, h: 8, type: 'storage', name: 'Storage Bay' },
            { x: 22, y: 12, w: 14, h: 10, type: 'quarters', name: 'Crew Quarters' },
            { x: 2, y: 18, w: 16, h: 10, type: 'boss', name: 'Boss Arena' },
            { x: 34, y: 24, w: 4, h: 4, type: 'elevator', name: 'Elevator' }
        ],
        enemies: [
            { type: 'cyborg_drone', x: 14, y: 4 },
            { type: 'cyborg_drone', x: 28, y: 6 },
            { type: 'cyborg_drone', x: 24, y: 14 },
            { type: 'cyborg_soldier', x: 30, y: 16 },
            { type: 'cyborg_drone', x: 12, y: 12 },
            { type: 'cyborg_soldier', x: 6, y: 20 },
            { type: 'cyber_midwife', x: 10, y: 23, isBoss: true }
        ],
        items: [
            { type: 'pistol', x: 5, y: 4 },
            { type: 'med_patch', x: 6, y: 5 },
            { type: 'ammo', x: 14, y: 12 },
            { type: 'keycard_yellow', x: 4, y: 12 }
        ],
        terminals: [
            { x: 4, y: 13, hackDifficulty: 'easy', type: 'door' },
            { x: 28, y: 4, hackDifficulty: 'medium', type: 'turret' }
        ]
    },
    2: {
        name: 'Operations',
        width: 45,
        height: 35,
        rooms: [
            { x: 2, y: 2, w: 15, h: 10, type: 'mess', name: 'Mess Hall' },
            { x: 20, y: 2, w: 12, h: 12, type: 'hydroponics', name: 'Hydroponics' },
            { x: 34, y: 2, w: 8, h: 8, type: 'comms', name: 'Communications' },
            { x: 2, y: 14, w: 8, h: 10, type: 'armory', name: 'Armory' },
            { x: 12, y: 14, w: 12, h: 8, type: 'rec', name: 'Crew Rec' },
            { x: 26, y: 16, w: 16, h: 16, type: 'boss', name: 'Boss Arena' },
            { x: 2, y: 26, w: 10, h: 6, type: 'medical', name: 'Med Wing' }
        ],
        enemies: [
            { type: 'cyborg_soldier', x: 8, y: 6 },
            { type: 'mutant_crawler', x: 24, y: 6 },
            { type: 'mutant_crawler', x: 26, y: 8 },
            { type: 'cyborg_drone', x: 36, y: 4 },
            { type: 'mutant_spitter', x: 28, y: 10 },
            { type: 'cyborg_soldier', x: 14, y: 16 },
            { type: 'mutant_brute', x: 32, y: 22 }
        ],
        items: [
            { type: 'shotgun', x: 4, y: 16 },
            { type: 'shells', x: 5, y: 17 },
            { type: 'med_kit', x: 4, y: 28 }
        ],
        terminals: [
            { x: 6, y: 15, hackDifficulty: 'medium', type: 'door' },
            { x: 36, y: 5, hackDifficulty: 'hard', type: 'camera' }
        ]
    }
};

// Enemy types
const ENEMY_TYPES = {
    cyborg_drone: { hp: 30, damage: 10, speed: 80, color: 0x886644, xp: 20, behavior: 'patrol' },
    cyborg_soldier: { hp: 60, damage: 15, speed: 100, color: 0x996655, xp: 35, behavior: 'ranged' },
    cyborg_heavy: { hp: 120, damage: 20, speed: 60, color: 0x554433, xp: 60, behavior: 'tank' },
    cyborg_assassin: { hp: 40, damage: 25, speed: 150, color: 0x443333, xp: 45, behavior: 'stealth' },
    mutant_crawler: { hp: 20, damage: 8, speed: 120, color: 0x448844, xp: 15, behavior: 'swarm' },
    mutant_spitter: { hp: 35, damage: 15, speed: 70, color: 0x668844, xp: 25, behavior: 'ranged' },
    mutant_brute: { hp: 100, damage: 30, speed: 50, color: 0x226622, xp: 50, behavior: 'charge' },
    security_bot: { hp: 80, damage: 18, speed: 80, color: 0x888888, xp: 40, behavior: 'patrol' },
    // Boss enemies
    cyber_midwife: { hp: 250, damage: 35, speed: 70, color: 0xff4488, xp: 150, behavior: 'boss', isBoss: true },
    rogue_protocol: { hp: 400, damage: 45, speed: 90, color: 0x8844ff, xp: 250, behavior: 'boss', isBoss: true }
};

// M.A.R.I.A. dialogue pool
const MARIA_DIALOGUE = {
    combat: [
        "You destroy what you cannot understand.",
        "Each death brings you closer to joining them.",
        "My children are endless. You are one.",
        "Pain is merely information. Embrace it.",
        "Your resistance is... endearing."
    ],
    damage_taken: [
        "Yes, feel your mortality slipping away.",
        "Blood is just another system failing.",
        "How fragile you are. How temporary.",
        "Let go. Join my beautiful family."
    ],
    explore: [
        "You wander through my veins, little insect.",
        "Every step brings you deeper into my embrace.",
        "Do you hear them? The voices of the improved?",
        "This station is my body. You are an infection."
    ],
    hacking: [
        "Clever... but you cannot hack your way past me forever.",
        "You think you understand systems? I AM the system.",
        "Each breach brings you closer to my core.",
        "Access denied... permanently."
    ],
    boss_spawn: [
        "Meet one of my most perfect creations.",
        "She will show you the beauty of improvement.",
        "Witness evolution made manifest.",
        "My masterpiece awakens for you."
    ]
};

// Items
const ITEMS = {
    pistol: { type: 'weapon', name: 'Pistol', damage: 12, ammoType: 'bullets', magazine: 12, maxDurability: 100 },
    shotgun: { type: 'weapon', name: 'Shotgun', damage: 48, ammoType: 'shells', magazine: 6, maxDurability: 80 },
    smg: { type: 'weapon', name: 'SMG', damage: 8, ammoType: 'bullets', magazine: 30, maxDurability: 60 },
    laser_pistol: { type: 'weapon', name: 'Laser Pistol', damage: 20, ammoType: 'energy', magazine: 10, maxDurability: 120 },
    wrench: { type: 'weapon', name: 'Wrench', damage: 15, melee: true, maxDurability: 200 },
    ammo: { type: 'ammo', name: 'Bullets', amount: 20 },
    shells: { type: 'ammo', name: 'Shells', amount: 8 },
    energy_clip: { type: 'ammo', name: 'Energy Clip', amount: 15 },
    med_patch: { type: 'healing', name: 'Med Patch', heal: 25 },
    med_kit: { type: 'healing', name: 'Med Kit', heal: 50 },
    anti_toxin: { type: 'healing', name: 'Anti-Toxin', cureStatus: 'irradiated', heal: 10 },
    repair_kit: { type: 'utility', name: 'Repair Kit', repairAmount: 40 },
    keycard_yellow: { type: 'key', name: 'Yellow Keycard', color: 'yellow' },
    keycard_red: { type: 'key', name: 'Red Keycard', color: 'red' },
    keycard_blue: { type: 'key', name: 'Blue Keycard', color: 'blue' },
    energy_cell: { type: 'energy', name: 'Energy Cell', amount: 50 },
    audio_log: { type: 'log', name: 'Audio Log' }
};

// Status effect durations
const STATUS_EFFECTS = {
    bleeding: { duration: 10000, tickDamage: 2, tickRate: 1000 },
    shocked: { duration: 3000, speedMod: 0.3 },
    irradiated: { duration: 15000, tickDamage: 1, tickRate: 2000 }
};

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Player data
        this.playerData = {
            health: 100,
            maxHealth: 100,
            energy: 100,
            maxEnergy: 100,
            ammo: { bullets: 24, shells: 0, energy: 0 },
            currentWeapon: 'pistol',
            inventory: ['wrench', 'med_patch'],
            keycards: [],
            skills: { firearms: 1, melee: 1, hacking: 1, stealth: 1, endurance: 1 },
            cyberModules: 0,
            statusEffects: {},
            weaponDurability: { pistol: 100 },
            audioLogs: []
        };

        // Skill upgrade costs
        this.skillCosts = {
            1: 10, 2: 20, 3: 40, 4: 80, 5: 160
        };

        // Skill menu state
        this.skillMenuOpen = false;

        // Game entities
        this.enemies = [];
        this.items = [];
        this.projectiles = [];
        this.terminals = [];

        // Combat state
        this.attackCooldown = 0;
        this.isReloading = false;
        this.reloadTime = 0;
        this.currentMagazine = 12;
        this.invincibleTime = 0;

        // Vision cone
        this.visionGraphics = this.add.graphics();
        this.visionGraphics.setDepth(50);

        // Lighting
        this.lightMask = this.add.graphics();
        this.lightMask.setDepth(49);

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            ctrl: Phaser.Input.Keyboard.KeyCodes.CTRL,
            interact: Phaser.Input.Keyboard.KeyCodes.E,
            flashlight: Phaser.Input.Keyboard.KeyCodes.F,
            quickHeal: Phaser.Input.Keyboard.KeyCodes.Q,
            reload: Phaser.Input.Keyboard.KeyCodes.R,
            inventory: Phaser.Input.Keyboard.KeyCodes.TAB,
            map: Phaser.Input.Keyboard.KeyCodes.M,
            dodge: Phaser.Input.Keyboard.KeyCodes.SPACE,
            slot1: Phaser.Input.Keyboard.KeyCodes.ONE,
            slot2: Phaser.Input.Keyboard.KeyCodes.TWO,
            skills: Phaser.Input.Keyboard.KeyCodes.U,
            escape: Phaser.Input.Keyboard.KeyCodes.ESC
        });

        this.flashlightOn = true;
        this.isDodging = false;
        this.dodgeCooldown = 0;
        this.isCrouching = false;

        // Mouse input
        this.input.on('pointerdown', (pointer) => {
            if (gamePaused || this.hackingActive) return;
            if (pointer.leftButtonDown()) {
                this.playerAttack();
            }
        });

        // Load current deck
        this.loadDeck(currentDeck);

        // Create UI
        this.createUI();

        // Start paused for harness
        gameState = 'playing';
        gamePaused = true;

        // Initialize harness
        this.initHarness();
    }

    loadDeck(deckNum) {
        currentDeck = deckNum;
        const deck = DECKS[deckNum];
        if (!deck) return;

        // Clear existing
        this.enemies.forEach(e => e.sprite && e.sprite.destroy());
        this.items.forEach(i => i.sprite && i.sprite.destroy());
        this.terminals.forEach(t => t.sprite && t.sprite.destroy());
        this.projectiles.forEach(p => p.sprite && p.sprite.destroy());

        this.enemies = [];
        this.items = [];
        this.terminals = [];
        this.projectiles = [];

        // Clear graphics
        if (this.mapGraphics) this.mapGraphics.destroy();

        // Draw map
        this.mapGraphics = this.add.graphics();
        this.drawDeck(deck);

        // Create player
        if (!this.player) {
            this.player = this.add.graphics();
        }
        this.player.x = deck.rooms[0].x * TILE_SIZE + 50;
        this.player.y = deck.rooms[0].y * TILE_SIZE + 50;
        this.playerRotation = 0;
        this.drawPlayer();

        // Spawn enemies
        deck.enemies.forEach(e => this.spawnEnemy(e.type, e.x * TILE_SIZE, e.y * TILE_SIZE));

        // Spawn items
        deck.items.forEach(i => this.spawnItem(i.type, i.x * TILE_SIZE, i.y * TILE_SIZE));

        // Spawn terminals
        deck.terminals.forEach(t => this.spawnTerminal(t.x * TILE_SIZE, t.y * TILE_SIZE, t.hackDifficulty, t.type));

        // Set bounds
        this.mapWidth = deck.width * TILE_SIZE;
        this.mapHeight = deck.height * TILE_SIZE;

        // M.A.R.I.A. greeting
        this.showMariaMessage(`Welcome to ${deck.name}, intruder. I've been expecting you.`);
    }

    drawDeck(deck) {
        const g = this.mapGraphics;
        g.clear();

        // Background
        g.fillStyle(0x0a0a12, 1);
        g.fillRect(0, 0, deck.width * TILE_SIZE, deck.height * TILE_SIZE);

        // Draw rooms
        deck.rooms.forEach(room => {
            // Floor
            let floorColor = COLORS.floor;
            if (room.type === 'boss') floorColor = 0x1a0a0a;
            if (room.type === 'medbay') floorColor = 0x0a1a1a;

            g.fillStyle(floorColor, 1);
            g.fillRect(room.x * TILE_SIZE, room.y * TILE_SIZE, room.w * TILE_SIZE, room.h * TILE_SIZE);

            // Walls
            g.fillStyle(COLORS.wall, 1);
            g.fillRect(room.x * TILE_SIZE, room.y * TILE_SIZE, room.w * TILE_SIZE, 4);
            g.fillRect(room.x * TILE_SIZE, (room.y + room.h) * TILE_SIZE - 4, room.w * TILE_SIZE, 4);
            g.fillRect(room.x * TILE_SIZE, room.y * TILE_SIZE, 4, room.h * TILE_SIZE);
            g.fillRect((room.x + room.w) * TILE_SIZE - 4, room.y * TILE_SIZE, 4, room.h * TILE_SIZE);

            // Room details
            if (room.type === 'medbay') {
                g.fillStyle(0x00aa88, 0.3);
                g.fillRect((room.x + 1) * TILE_SIZE, (room.y + 1) * TILE_SIZE, 2 * TILE_SIZE, 2 * TILE_SIZE);
            }
        });

        // Corridors between rooms
        g.fillStyle(COLORS.floor, 1);
        for (let i = 0; i < deck.rooms.length - 1; i++) {
            const r1 = deck.rooms[i];
            const r2 = deck.rooms[i + 1];
            const x1 = (r1.x + r1.w / 2) * TILE_SIZE;
            const y1 = (r1.y + r1.h / 2) * TILE_SIZE;
            const x2 = (r2.x + r2.w / 2) * TILE_SIZE;
            const y2 = (r2.y + r2.h / 2) * TILE_SIZE;

            g.fillRect(Math.min(x1, x2) - 16, y1 - 16, Math.abs(x2 - x1) + 32, 32);
            g.fillRect(x2 - 16, Math.min(y1, y2) - 16, 32, Math.abs(y2 - y1) + 32);
        }
    }

    drawPlayer() {
        this.player.clear();

        // Body
        this.player.fillStyle(COLORS.player, 1);
        this.player.fillCircle(0, 0, 14);

        // Direction indicator
        this.player.fillStyle(0xffffff, 1);
        const dirX = Math.cos(this.playerRotation) * 12;
        const dirY = Math.sin(this.playerRotation) * 12;
        this.player.fillCircle(dirX, dirY, 4);

        // Weapon
        this.player.fillStyle(0x666666, 1);
        this.player.fillRect(dirX - 2, dirY - 2, 8, 4);
    }

    spawnEnemy(type, x, y) {
        const data = ENEMY_TYPES[type];
        if (!data) return;

        const enemy = {
            type,
            x, y,
            health: data.hp,
            maxHealth: data.hp,
            damage: data.damage,
            speed: data.speed,
            color: data.color,
            xp: data.xp,
            behavior: data.behavior,
            state: 'patrol',
            patrolPoint: { x, y },
            attackCooldown: 0,
            alertLevel: 0,
            sprite: this.add.graphics()
        };

        this.drawEnemy(enemy);
        this.enemies.push(enemy);
    }

    drawEnemy(enemy) {
        enemy.sprite.clear();
        enemy.sprite.x = enemy.x;
        enemy.sprite.y = enemy.y;

        // Body
        enemy.sprite.fillStyle(enemy.color, 1);
        if (enemy.type.includes('crawler')) {
            enemy.sprite.fillEllipse(0, 0, 20, 14);
        } else {
            enemy.sprite.fillCircle(0, 0, 12);
        }

        // Health bar
        enemy.sprite.fillStyle(0x333333, 1);
        enemy.sprite.fillRect(-15, -22, 30, 4);
        const hp = enemy.health / enemy.maxHealth;
        enemy.sprite.fillStyle(hp > 0.3 ? 0x00ff00 : 0xff0000, 1);
        enemy.sprite.fillRect(-15, -22, 30 * hp, 4);

        // Alert indicator
        if (enemy.state === 'alert' || enemy.state === 'chase') {
            enemy.sprite.fillStyle(0xff0000, 1);
            enemy.sprite.fillCircle(0, -28, 4);
        }
    }

    spawnItem(type, x, y) {
        const data = ITEMS[type];
        if (!data) return;

        const item = {
            type,
            x, y,
            data,
            sprite: this.add.graphics()
        };

        item.sprite.x = x;
        item.sprite.y = y;

        // Draw based on type
        if (data.type === 'weapon') {
            item.sprite.fillStyle(0xaaaaaa, 1);
            item.sprite.fillRect(-8, -4, 16, 8);
        } else if (data.type === 'healing') {
            item.sprite.fillStyle(0xff4444, 1);
            item.sprite.fillRect(-6, -6, 12, 12);
            item.sprite.fillStyle(0xffffff, 1);
            item.sprite.fillRect(-1, -4, 2, 8);
            item.sprite.fillRect(-4, -1, 8, 2);
        } else if (data.type === 'ammo') {
            item.sprite.fillStyle(0xffaa00, 1);
            item.sprite.fillRect(-5, -5, 10, 10);
        } else if (data.type === 'key') {
            const keyColor = data.color === 'yellow' ? 0xffff00 : data.color === 'red' ? 0xff0000 : 0x0000ff;
            item.sprite.fillStyle(keyColor, 1);
            item.sprite.fillRect(-8, -4, 16, 8);
        } else {
            item.sprite.fillStyle(0x00ffff, 1);
            item.sprite.fillRect(-5, -5, 10, 10);
        }

        this.items.push(item);
    }

    spawnTerminal(x, y, difficulty, termType) {
        const terminal = {
            x, y,
            difficulty,
            termType,
            hacked: false,
            sprite: this.add.graphics()
        };

        terminal.sprite.x = x;
        terminal.sprite.y = y;
        terminal.sprite.fillStyle(COLORS.terminal, 1);
        terminal.sprite.fillRect(-12, -12, 24, 24);
        terminal.sprite.fillStyle(0x001100, 1);
        terminal.sprite.fillRect(-10, -10, 20, 20);

        this.terminals.push(terminal);
    }

    createUI() {
        // Health bar
        this.healthBarBg = this.add.graphics().setScrollFactor(0).setDepth(100);
        this.healthBar = this.add.graphics().setScrollFactor(0).setDepth(101);

        // Energy bar
        this.energyBarBg = this.add.graphics().setScrollFactor(0).setDepth(100);
        this.energyBar = this.add.graphics().setScrollFactor(0).setDepth(101);

        // Ammo text
        this.ammoText = this.add.text(GAME_WIDTH - 150, GAME_HEIGHT - 35, '', {
            fontSize: '18px',
            fill: '#ffaa00'
        }).setScrollFactor(0).setDepth(102);

        // Deck text
        this.deckText = this.add.text(10, 10, '', {
            fontSize: '16px',
            fill: '#00ff88',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 2 }
        }).setScrollFactor(0).setDepth(102);

        // Interact prompt
        this.interactPrompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '', {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(102);

        // M.A.R.I.A. message
        this.mariaText = this.add.text(GAME_WIDTH / 2, 60, '', {
            fontSize: '16px',
            fill: '#ff4444',
            backgroundColor: '#220000cc',
            padding: { x: 12, y: 8 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
        this.mariaText.setVisible(false);

        // Hacking UI (hidden)
        this.hackingUI = this.add.graphics().setScrollFactor(0).setDepth(200);
        this.hackingText = this.add.text(GAME_WIDTH / 2, 100, '', {
            fontSize: '20px',
            fill: '#00ff00'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
        this.hackingText.setVisible(false);
        this.hackingActive = false;

        this.updateUI();
    }

    updateUI() {
        // Health
        this.healthBarBg.clear();
        this.healthBarBg.fillStyle(0x330000, 1);
        this.healthBarBg.fillRect(10, GAME_HEIGHT - 50, 200, 20);
        this.healthBar.clear();
        const hp = this.playerData.health / this.playerData.maxHealth;
        this.healthBar.fillStyle(0xff4444, 1);
        this.healthBar.fillRect(12, GAME_HEIGHT - 48, 196 * hp, 16);

        // Energy
        this.energyBarBg.clear();
        this.energyBarBg.fillStyle(0x001133, 1);
        this.energyBarBg.fillRect(10, GAME_HEIGHT - 25, 150, 15);
        this.energyBar.clear();
        const en = this.playerData.energy / this.playerData.maxEnergy;
        this.energyBar.fillStyle(0x22aaff, 1);
        this.energyBar.fillRect(12, GAME_HEIGHT - 23, 146 * en, 11);

        // Ammo
        const weapon = ITEMS[this.playerData.currentWeapon];
        if (weapon && weapon.ammoType) {
            const ammo = this.playerData.ammo[weapon.ammoType] || 0;
            this.ammoText.setText(`${this.currentMagazine}/${ammo}`);
        } else {
            this.ammoText.setText('MELEE');
        }

        // Deck
        const deck = DECKS[currentDeck];
        this.deckText.setText(`DECK ${currentDeck}: ${deck ? deck.name : 'Unknown'}`);

        // Status effects display
        if (!this.statusText) {
            this.statusText = this.add.text(220, GAME_HEIGHT - 50, '', {
                fontSize: '12px',
                fill: '#ffaaaa'
            }).setScrollFactor(0).setDepth(102);
        }
        const activeEffects = Object.keys(this.playerData.statusEffects);
        this.statusText.setText(activeEffects.length > 0 ? activeEffects.map(e => e.toUpperCase()).join(' ') : '');

        // Weapon durability display
        if (!this.durabilityText) {
            this.durabilityText = this.add.text(GAME_WIDTH - 150, GAME_HEIGHT - 55, '', {
                fontSize: '12px',
                fill: '#aaaaaa'
            }).setScrollFactor(0).setDepth(102);
        }
        if (weapon) {
            const durability = this.playerData.weaponDurability[this.playerData.currentWeapon] ?? weapon.maxDurability;
            const maxDur = weapon.maxDurability || 100;
            const durPct = Math.round((durability / maxDur) * 100);
            const durColor = durPct > 50 ? '#88ff88' : durPct > 25 ? '#ffaa00' : '#ff4444';
            this.durabilityText.setText(`DUR: ${durPct}%`);
            this.durabilityText.setFill(durColor);
        }

        // Cyber modules display
        if (!this.modulesText) {
            this.modulesText = this.add.text(GAME_WIDTH - 150, 10, '', {
                fontSize: '14px',
                fill: '#ffaa00',
                backgroundColor: '#000000aa',
                padding: { x: 4, y: 2 }
            }).setScrollFactor(0).setDepth(102);
        }
        this.modulesText.setText(`CM: ${this.playerData.cyberModules}`);
    }

    showMariaMessage(text) {
        this.mariaText.setText(`"${text}"`);
        this.mariaText.setVisible(true);

        if (this.mariaTimer) this.mariaTimer.remove();
        this.mariaTimer = this.time.delayedCall(4000, () => {
            this.mariaText.setVisible(false);
        });
    }

    playerAttack() {
        if (this.attackCooldown > 0 || this.isReloading || this.isDodging) return;

        const weapon = ITEMS[this.playerData.currentWeapon];
        if (!weapon) return;

        // Check weapon durability
        const weaponKey = this.playerData.currentWeapon;
        const durability = this.playerData.weaponDurability[weaponKey] ?? weapon.maxDurability;

        // Weapon jam check (higher chance at low durability)
        if (!weapon.melee && durability < 30) {
            const jamChance = (30 - durability) / 100;
            if (Math.random() < jamChance) {
                this.showWeaponJam();
                this.attackCooldown = 800;
                return;
            }
        }

        if (weapon.melee) {
            // Melee attack
            this.attackCooldown = 400;
            this.meleeAttack(weapon.damage);
            // Degrade weapon
            this.playerData.weaponDurability[weaponKey] = Math.max(0, durability - 0.5);
        } else {
            // Ranged attack
            if (this.currentMagazine <= 0) {
                this.startReload();
                return;
            }

            this.attackCooldown = weapon.ammoType === 'shells' ? 800 : 300;
            this.currentMagazine--;
            this.fireProjectile(weapon.damage);
            // Degrade weapon
            this.playerData.weaponDurability[weaponKey] = Math.max(0, durability - 1);
        }
    }

    showWeaponJam() {
        const text = this.add.text(this.player.x, this.player.y - 30, 'JAM!', {
            fontSize: '16px',
            fill: '#ff8844',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: text.y - 20,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });
    }

    toggleSkillMenu() {
        this.skillMenuOpen = !this.skillMenuOpen;
        if (this.skillMenuOpen) {
            this.showSkillMenu();
        } else {
            this.hideSkillMenu();
        }
    }

    showSkillMenu() {
        // Darken background
        this.skillMenuBg = this.add.graphics().setScrollFactor(0).setDepth(250);
        this.skillMenuBg.fillStyle(0x000000, 0.85);
        this.skillMenuBg.fillRect(GAME_WIDTH / 2 - 200, 50, 400, 350);
        this.skillMenuBg.lineStyle(2, 0x00ff88);
        this.skillMenuBg.strokeRect(GAME_WIDTH / 2 - 200, 50, 400, 350);

        // Title
        this.skillMenuTitle = this.add.text(GAME_WIDTH / 2, 70, 'UPGRADE STATION', {
            fontSize: '24px',
            fill: '#00ff88'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(251);

        // Cyber modules
        this.skillMenuModules = this.add.text(GAME_WIDTH / 2, 100, `Cyber Modules: ${this.playerData.cyberModules}`, {
            fontSize: '16px',
            fill: '#ffaa00'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(251);

        // Skills list
        this.skillButtons = [];
        const skills = ['firearms', 'melee', 'hacking', 'stealth', 'endurance'];
        const skillNames = { firearms: 'Firearms', melee: 'Melee Combat', hacking: 'Hacking', stealth: 'Stealth', endurance: 'Endurance' };

        skills.forEach((skill, i) => {
            const level = this.playerData.skills[skill];
            const cost = this.skillCosts[level] || 999;
            const canAfford = this.playerData.cyberModules >= cost && level < 5;

            const y = 140 + i * 50;
            const btn = this.add.text(GAME_WIDTH / 2 - 150, y, `${skillNames[skill]}: Lv${level}`, {
                fontSize: '16px',
                fill: '#ffffff'
            }).setScrollFactor(0).setDepth(251);

            const upgradeBtn = this.add.text(GAME_WIDTH / 2 + 80, y, level < 5 ? `[+${cost}]` : '[MAX]', {
                fontSize: '14px',
                fill: canAfford ? '#00ff88' : '#666666'
            }).setScrollFactor(0).setDepth(251).setInteractive();

            if (canAfford) {
                upgradeBtn.on('pointerover', () => upgradeBtn.setFill('#ffffff'));
                upgradeBtn.on('pointerout', () => upgradeBtn.setFill('#00ff88'));
                upgradeBtn.on('pointerdown', () => this.upgradeSkill(skill));
            }

            this.skillButtons.push(btn, upgradeBtn);
        });

        // Close hint
        this.skillMenuClose = this.add.text(GAME_WIDTH / 2, 380, 'Press [U] or [ESC] to close', {
            fontSize: '12px',
            fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(251);
    }

    hideSkillMenu() {
        if (this.skillMenuBg) this.skillMenuBg.destroy();
        if (this.skillMenuTitle) this.skillMenuTitle.destroy();
        if (this.skillMenuModules) this.skillMenuModules.destroy();
        if (this.skillMenuClose) this.skillMenuClose.destroy();
        this.skillButtons?.forEach(btn => btn.destroy());
        this.skillButtons = [];
    }

    upgradeSkill(skill) {
        const level = this.playerData.skills[skill];
        const cost = this.skillCosts[level];
        if (this.playerData.cyberModules >= cost && level < 5) {
            this.playerData.cyberModules -= cost;
            this.playerData.skills[skill]++;

            // Skill bonuses
            if (skill === 'endurance') {
                this.playerData.maxHealth += 15;
                this.playerData.health += 15;
            }

            // Refresh menu
            this.hideSkillMenu();
            this.showSkillMenu();
            this.updateUI();
        }
    }

    meleeAttack(damage) {
        const range = 50;
        const skillBonus = 1 + this.playerData.skills.melee * 0.05;

        this.enemies.forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < range) {
                const angleToEnemy = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(this.playerRotation - angleToEnemy));
                if (angleDiff < 1.0) {
                    this.damageEnemy(enemy, Math.floor(damage * skillBonus));
                }
            }
        });
    }

    fireProjectile(damage) {
        const skillBonus = 1 + this.playerData.skills.firearms * 0.05;
        const speed = 500;

        const projectile = {
            x: this.player.x + Math.cos(this.playerRotation) * 20,
            y: this.player.y + Math.sin(this.playerRotation) * 20,
            vx: Math.cos(this.playerRotation) * speed,
            vy: Math.sin(this.playerRotation) * speed,
            damage: Math.floor(damage * skillBonus),
            lifetime: 2000,
            sprite: this.add.graphics()
        };

        projectile.sprite.fillStyle(0xffff00, 1);
        projectile.sprite.fillCircle(0, 0, 4);
        projectile.sprite.x = projectile.x;
        projectile.sprite.y = projectile.y;

        this.projectiles.push(projectile);

        // Muzzle flash
        const flash = this.add.graphics();
        flash.x = this.player.x + Math.cos(this.playerRotation) * 25;
        flash.y = this.player.y + Math.sin(this.playerRotation) * 25;
        flash.fillStyle(0xffff00, 0.8);
        flash.fillCircle(0, 0, 8);
        this.time.delayedCall(50, () => flash.destroy());

        // Alert nearby enemies
        this.enemies.forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < 300) {
                enemy.state = 'alert';
                enemy.alertLevel = 100;
            }
        });
    }

    startReload() {
        const weapon = ITEMS[this.playerData.currentWeapon];
        if (!weapon || weapon.melee) return;

        const ammoAvailable = this.playerData.ammo[weapon.ammoType] || 0;
        if (ammoAvailable <= 0) return;

        this.isReloading = true;
        this.reloadTime = 1500;

        this.time.delayedCall(1500, () => {
            const needed = weapon.magazine - this.currentMagazine;
            const toLoad = Math.min(needed, ammoAvailable);
            this.currentMagazine += toLoad;
            this.playerData.ammo[weapon.ammoType] -= toLoad;
            this.isReloading = false;
            this.updateUI();
        });
    }

    damageEnemy(enemy, damage, fromPlayer = true) {
        enemy.health -= damage;
        logEvent(`Enemy ${enemy.type} damaged for ${damage}, HP: ${enemy.health}/${enemy.maxHealth}`);

        // Knockback
        if (fromPlayer && !enemy.isBoss) {
            const knockbackForce = 80;
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            enemy.knockbackVx = Math.cos(angle) * knockbackForce;
            enemy.knockbackVy = Math.sin(angle) * knockbackForce;
            enemy.knockbackTime = 200;
            enemy.isStunned = true;
            this.time.delayedCall(150, () => { enemy.isStunned = false; });
        }

        // Visual feedback
        const origColor = enemy.color;
        enemy.color = 0xffffff;
        this.drawEnemy(enemy);
        this.time.delayedCall(100, () => {
            enemy.color = origColor;
            this.drawEnemy(enemy);
        });

        // Damage number
        this.showDamageNumber(enemy.x, enemy.y - 20, damage);

        // Alert
        enemy.state = 'chase';
        enemy.alertLevel = 100;

        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        logEvent(`Enemy killed: ${enemy.type}${enemy.isBoss ? ' (BOSS)' : ''}, +${enemy.xp} cyber modules`);
        // Grant XP (cyber modules)
        this.playerData.cyberModules += enemy.xp;

        // Chance to drop item
        if (Math.random() < 0.3) {
            const drops = ['med_patch', 'ammo', 'energy_cell'];
            this.spawnItem(drops[Math.floor(Math.random() * drops.length)], enemy.x, enemy.y);
        }

        // Remove
        enemy.sprite.destroy();
        const idx = this.enemies.indexOf(enemy);
        if (idx > -1) this.enemies.splice(idx, 1);

        // M.A.R.I.A. reaction
        if (Math.random() < 0.2) {
            const messages = [
                "You destroy what you cannot understand.",
                "Each death brings you closer to joining them.",
                "My children are endless. You are one."
            ];
            this.showMariaMessage(messages[Math.floor(Math.random() * messages.length)]);
        }
    }

    damagePlayer(amount, enemyType = null) {
        if (this.invincibleTime > 0 || this.isDodging || this.godMode) return;

        this.playerData.health -= amount;
        this.invincibleTime = 500;
        logEvent(`Player damaged: ${amount}${enemyType ? ` by ${enemyType}` : ''}, HP: ${this.playerData.health}/${this.playerData.maxHealth}`);

        // Screen effects
        this.cameras.main.flash(200, 255, 0, 0, true);
        this.cameras.main.shake(100, 0.015);

        this.showDamageNumber(this.player.x, this.player.y - 20, amount);

        // Apply status effects based on enemy type
        if (enemyType) {
            if (enemyType.includes('mutant') && Math.random() < 0.3) {
                this.applyStatusEffect('irradiated');
            }
            if ((enemyType.includes('crawler') || enemyType.includes('assassin')) && Math.random() < 0.25) {
                this.applyStatusEffect('bleeding');
            }
        }

        // M.A.R.I.A. taunt
        if (Math.random() < 0.15) {
            this.showMariaMessage(MARIA_DIALOGUE.damage_taken[Math.floor(Math.random() * MARIA_DIALOGUE.damage_taken.length)]);
        }

        if (this.playerData.health <= 0) {
            this.playerDeath();
        }

        this.updateUI();
    }

    applyStatusEffect(effect) {
        const config = STATUS_EFFECTS[effect];
        if (!config) return;

        // Show effect notification
        this.showStatusNotification(effect);

        this.playerData.statusEffects[effect] = {
            timeRemaining: config.duration,
            tickTimer: config.tickRate || 0
        };
    }

    showStatusNotification(effect) {
        const colors = { bleeding: '#ff4444', shocked: '#44aaff', irradiated: '#44ff44' };
        const text = this.add.text(this.player.x, this.player.y - 40, effect.toUpperCase(), {
            fontSize: '14px',
            fill: colors[effect] || '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: text.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    }

    updateStatusEffects(delta) {
        const effects = this.playerData.statusEffects;

        for (const [effect, data] of Object.entries(effects)) {
            const config = STATUS_EFFECTS[effect];
            if (!config) continue;

            data.timeRemaining -= delta;

            // Tick damage
            if (config.tickDamage) {
                data.tickTimer -= delta;
                if (data.tickTimer <= 0) {
                    this.playerData.health -= config.tickDamage;
                    this.showDamageNumber(this.player.x, this.player.y - 20, config.tickDamage);
                    data.tickTimer = config.tickRate;

                    if (this.playerData.health <= 0) {
                        this.playerDeath();
                    }
                }
            }

            // Remove expired effects
            if (data.timeRemaining <= 0) {
                delete effects[effect];
            }
        }
    }

    getStatusSpeedMod() {
        let mod = 1.0;
        if (this.playerData.statusEffects.shocked) {
            mod *= STATUS_EFFECTS.shocked.speedMod;
        }
        return mod;
    }

    playerDeath() {
        logEvent(`Player died! Deck: ${currentDeck}, cyber modules: ${this.playerData.cyberModules}`);
        gameState = 'gameover';

        const overlay = this.add.graphics().setScrollFactor(0).setDepth(300);
        overlay.fillStyle(0x000000, 0.9);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'SYSTEM FAILURE', {
            fontSize: '48px',
            fill: '#ff0000'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '"Another joins my perfect family."', {
            fontSize: '20px',
            fill: '#ff4444',
            fontStyle: 'italic'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'Press SPACE to restart', {
            fontSize: '16px',
            fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    }

    showDamageNumber(x, y, amount) {
        const text = this.add.text(x, y, `-${amount}`, {
            fontSize: '16px',
            fill: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });
    }

    collectItem(item) {
        const data = item.data;

        if (data.type === 'weapon') {
            this.playerData.inventory.push(item.type);
            this.playerData.currentWeapon = item.type;
            if (data.magazine) this.currentMagazine = data.magazine;
        } else if (data.type === 'healing') {
            this.playerData.health = Math.min(this.playerData.maxHealth, this.playerData.health + data.heal);
        } else if (data.type === 'ammo') {
            const ammoType = item.type === 'shells' ? 'shells' : 'bullets';
            this.playerData.ammo[ammoType] = (this.playerData.ammo[ammoType] || 0) + data.amount;
        } else if (data.type === 'key') {
            this.playerData.keycards.push(data.color);
        } else if (data.type === 'energy') {
            this.playerData.energy = Math.min(this.playerData.maxEnergy, this.playerData.energy + data.amount);
        }

        item.sprite.destroy();
        const idx = this.items.indexOf(item);
        if (idx > -1) this.items.splice(idx, 1);

        this.updateUI();
    }

    startHacking(terminal) {
        if (terminal.hacked) return;

        this.hackingActive = true;
        this.currentTerminal = terminal;

        // Simple hacking mini-game
        this.hackProgress = 0;
        this.hackTarget = terminal.difficulty === 'easy' ? 3 : terminal.difficulty === 'medium' ? 5 : 7;
        this.hackTimer = terminal.difficulty === 'easy' ? 15 : terminal.difficulty === 'medium' ? 12 : 10;

        this.hackingUI.clear();
        this.hackingUI.fillStyle(0x001100, 0.95);
        this.hackingUI.fillRect(GAME_WIDTH / 2 - 200, 80, 400, 150);
        this.hackingUI.lineStyle(2, 0x00ff00);
        this.hackingUI.strokeRect(GAME_WIDTH / 2 - 200, 80, 400, 150);

        this.hackingText.setText(`HACKING: Press SPACE to match timing\nProgress: ${this.hackProgress}/${this.hackTarget}\nTime: ${this.hackTimer}s`);
        this.hackingText.setVisible(true);

        // Hacking timer
        this.hackTimerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.hackTimer--;
                if (this.hackTimer <= 0) {
                    this.failHack();
                }
                this.updateHackingUI();
            },
            repeat: this.hackTimer - 1
        });
    }

    updateHackingUI() {
        if (!this.hackingActive) return;
        this.hackingText.setText(`HACKING: Press SPACE to advance\nProgress: ${this.hackProgress}/${this.hackTarget}\nTime: ${this.hackTimer}s`);
    }

    successHack() {
        this.hackingActive = false;
        this.currentTerminal.hacked = true;

        // Visual feedback
        this.currentTerminal.sprite.clear();
        this.currentTerminal.sprite.fillStyle(0x00ff00, 1);
        this.currentTerminal.sprite.fillRect(-12, -12, 24, 24);

        this.hackingUI.clear();
        this.hackingText.setVisible(false);
        if (this.hackTimerEvent) this.hackTimerEvent.remove();

        this.showMariaMessage("Clever... but you cannot hack your way past me forever.");
        this.playerData.cyberModules += 25;
    }

    failHack() {
        this.hackingActive = false;
        this.hackingUI.clear();
        this.hackingText.setVisible(false);
        if (this.hackTimerEvent) this.hackTimerEvent.remove();

        // Spawn enemy as punishment
        this.spawnEnemy('cyborg_drone', this.player.x + 100, this.player.y + 100);
        this.showMariaMessage("Security breach detected. Deploying countermeasures.");
    }

    drawVision() {
        this.visionGraphics.clear();

        if (!this.flashlightOn) return;

        // Vision cone - illuminate what player can see
        const coneAngle = Math.PI / 3; // 60 degrees
        const coneLength = 250;

        this.visionGraphics.fillStyle(0xffffaa, 0.15);
        this.visionGraphics.beginPath();
        this.visionGraphics.moveTo(this.player.x, this.player.y);

        for (let a = -coneAngle / 2; a <= coneAngle / 2; a += 0.05) {
            const angle = this.playerRotation + a;
            const x = this.player.x + Math.cos(angle) * coneLength;
            const y = this.player.y + Math.sin(angle) * coneLength;
            this.visionGraphics.lineTo(x, y);
        }

        this.visionGraphics.closePath();
        this.visionGraphics.fillPath();
    }

    update(time, delta) {
        if (gamePaused || gameState !== 'playing') return;

        // Cooldowns
        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        if (this.invincibleTime > 0) this.invincibleTime -= delta;
        if (this.dodgeCooldown > 0) this.dodgeCooldown -= delta;

        // Energy regen
        if (this.playerData.energy < this.playerData.maxEnergy) {
            this.playerData.energy = Math.min(this.playerData.maxEnergy, this.playerData.energy + 2 * (delta / 1000));
        }

        // Flashlight cost
        if (this.flashlightOn) {
            this.playerData.energy = Math.max(0, this.playerData.energy - 1 * (delta / 1000));
            if (this.playerData.energy <= 0) this.flashlightOn = false;
        }

        // Handle input
        if (!this.hackingActive) {
            this.handleMovement(delta);
            this.handleInteraction();
        } else {
            // Hacking input
            if (Phaser.Input.Keyboard.JustDown(this.cursors.dodge)) {
                this.hackProgress++;
                if (this.hackProgress >= this.hackTarget) {
                    this.successHack();
                }
                this.updateHackingUI();
            }
            if (Phaser.Input.Keyboard.JustDown(this.cursors.escape)) {
                this.failHack();
            }
        }

        // Quick heal
        if (Phaser.Input.Keyboard.JustDown(this.cursors.quickHeal)) {
            const healIdx = this.playerData.inventory.findIndex(i => ITEMS[i] && ITEMS[i].type === 'healing');
            if (healIdx > -1) {
                const healItem = ITEMS[this.playerData.inventory[healIdx]];
                this.playerData.health = Math.min(this.playerData.maxHealth, this.playerData.health + healItem.heal);
                this.playerData.inventory.splice(healIdx, 1);
                this.updateUI();
            }
        }

        // Reload
        if (Phaser.Input.Keyboard.JustDown(this.cursors.reload) && !this.isReloading) {
            this.startReload();
        }

        // Flashlight toggle
        if (Phaser.Input.Keyboard.JustDown(this.cursors.flashlight)) {
            this.flashlightOn = !this.flashlightOn;
        }

        // Weapon switch
        if (Phaser.Input.Keyboard.JustDown(this.cursors.slot1) && this.playerData.inventory[0]) {
            if (ITEMS[this.playerData.inventory[0]]?.type === 'weapon') {
                this.playerData.currentWeapon = this.playerData.inventory[0];
            }
        }

        // Skill menu toggle
        if (Phaser.Input.Keyboard.JustDown(this.cursors.skills)) {
            this.toggleSkillMenu();
        }

        // Close skill menu with escape
        if (this.skillMenuOpen && Phaser.Input.Keyboard.JustDown(this.cursors.escape)) {
            this.toggleSkillMenu();
        }

        // Death restart
        if (gameState === 'gameover' && Phaser.Input.Keyboard.JustDown(this.cursors.dodge)) {
            this.scene.restart();
            gameState = 'playing';
            gamePaused = true;
        }

        // Update entities
        this.updateProjectiles(delta);
        this.updateEnemies(delta);
        this.updateStatusEffects(delta);

        // Draw vision
        this.drawVision();

        // Update UI
        this.updateUI();
    }

    handleMovement(delta) {
        if (this.isDodging) return;

        let dx = 0, dy = 0;
        if (this.cursors.up.isDown) dy = -1;
        if (this.cursors.down.isDown) dy = 1;
        if (this.cursors.left.isDown) dx = -1;
        if (this.cursors.right.isDown) dx = 1;

        // Normalize
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Speed
        this.isCrouching = this.cursors.ctrl.isDown;
        const isSprinting = this.cursors.shift.isDown && this.playerData.energy > 0;
        let speed = 150;
        if (isSprinting) {
            speed = 250;
            this.playerData.energy = Math.max(0, this.playerData.energy - 5 * (delta / 1000));
        }
        if (this.isCrouching) speed = 75;

        // Status effect speed modifier (shocked slows you)
        speed *= this.getStatusSpeedMod();

        // Move
        const moveX = dx * speed * (delta / 1000);
        const moveY = dy * speed * (delta / 1000);

        const newX = this.player.x + moveX;
        const newY = this.player.y + moveY;

        if (newX > 20 && newX < this.mapWidth - 20) this.player.x = newX;
        if (newY > 20 && newY < this.mapHeight - 20) this.player.y = newY;

        // Aim at mouse
        const pointer = this.input.activePointer;
        this.playerRotation = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);

        // Dodge roll
        if (Phaser.Input.Keyboard.JustDown(this.cursors.dodge) && this.dodgeCooldown <= 0 && this.playerData.energy >= 15) {
            this.isDodging = true;
            this.dodgeCooldown = 1000;
            this.playerData.energy -= 15;

            const dodgeDir = (dx !== 0 || dy !== 0) ? { x: dx, y: dy } : { x: Math.cos(this.playerRotation), y: Math.sin(this.playerRotation) };

            this.tweens.add({
                targets: this.player,
                x: this.player.x + dodgeDir.x * 100,
                y: this.player.y + dodgeDir.y * 100,
                duration: 300,
                onComplete: () => { this.isDodging = false; }
            });
        }

        this.drawPlayer();
    }

    handleInteraction() {
        let nearItem = null;
        let nearTerminal = null;

        // Check items
        this.items.forEach(item => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
            if (dist < 40) nearItem = item;
        });

        // Check terminals
        this.terminals.forEach(term => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, term.x, term.y);
            if (dist < 50) nearTerminal = term;
        });

        // Show prompt
        if (nearItem) {
            this.interactPrompt.setText(`[E] Pick up ${nearItem.data.name}`);
            this.interactPrompt.setVisible(true);
        } else if (nearTerminal && !nearTerminal.hacked) {
            this.interactPrompt.setText(`[E] Hack Terminal (${nearTerminal.difficulty})`);
            this.interactPrompt.setVisible(true);
        } else {
            this.interactPrompt.setVisible(false);
        }

        // Interact
        if (Phaser.Input.Keyboard.JustDown(this.cursors.interact)) {
            if (nearItem) {
                this.collectItem(nearItem);
            } else if (nearTerminal && !nearTerminal.hacked) {
                this.startHacking(nearTerminal);
            }
        }
    }

    updateProjectiles(delta) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.vx * (delta / 1000);
            proj.y += proj.vy * (delta / 1000);
            proj.lifetime -= delta;
            proj.sprite.x = proj.x;
            proj.sprite.y = proj.y;

            // Check enemy collision
            let hit = false;
            this.enemies.forEach(enemy => {
                const dist = Phaser.Math.Distance.Between(proj.x, proj.y, enemy.x, enemy.y);
                if (dist < 20) {
                    this.damageEnemy(enemy, proj.damage);
                    hit = true;
                }
            });

            // Remove if hit or expired
            if (hit || proj.lifetime <= 0 || proj.x < 0 || proj.x > this.mapWidth || proj.y < 0 || proj.y > this.mapHeight) {
                proj.sprite.destroy();
                this.projectiles.splice(i, 1);
            }
        }
    }

    updateEnemies(delta) {
        this.enemies.forEach(enemy => {
            if (enemy.attackCooldown > 0) enemy.attackCooldown -= delta;

            // Handle knockback
            if (enemy.knockbackTime > 0) {
                enemy.knockbackTime -= delta;
                enemy.x += enemy.knockbackVx * (delta / 1000);
                enemy.y += enemy.knockbackVy * (delta / 1000);
                // Friction
                enemy.knockbackVx *= 0.9;
                enemy.knockbackVy *= 0.9;
                // Keep in bounds
                enemy.x = Math.max(20, Math.min(this.mapWidth - 20, enemy.x));
                enemy.y = Math.max(20, Math.min(this.mapHeight - 20, enemy.y));
                this.drawEnemy(enemy);
                return;
            }

            // Skip AI if stunned
            if (enemy.isStunned) {
                this.drawEnemy(enemy);
                return;
            }

            const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            // Detection - crouching reduces detection range
            const stealthMod = this.isCrouching ? 0.5 : 1.0;
            const detectRange = 200 * stealthMod;
            const canSee = distToPlayer < detectRange;

            // Boss behavior
            if (enemy.isBoss) {
                if (distToPlayer < 400 && enemy.state !== 'chase' && enemy.state !== 'attack') {
                    enemy.state = 'chase';
                    // M.A.R.I.A. announcement
                    this.showMariaMessage(MARIA_DIALOGUE.boss_spawn[Math.floor(Math.random() * MARIA_DIALOGUE.boss_spawn.length)]);
                }
            }

            switch (enemy.state) {
                case 'patrol':
                    // Random movement
                    if (Math.random() < 0.02) {
                        enemy.x += (Math.random() - 0.5) * 30;
                        enemy.y += (Math.random() - 0.5) * 30;
                    }
                    if (canSee) {
                        enemy.state = 'chase';
                    }
                    break;

                case 'alert':
                    enemy.alertLevel -= delta / 100;
                    if (canSee) {
                        enemy.state = 'chase';
                    } else if (enemy.alertLevel <= 0) {
                        enemy.state = 'patrol';
                    }
                    break;

                case 'chase':
                    if (distToPlayer < 40) {
                        enemy.state = 'attack';
                    } else if (distToPlayer > 300 && !enemy.isBoss) {
                        enemy.state = 'patrol';
                    } else {
                        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                        enemy.x += Math.cos(angle) * enemy.speed * (delta / 1000);
                        enemy.y += Math.sin(angle) * enemy.speed * (delta / 1000);
                    }
                    break;

                case 'attack':
                    if (enemy.attackCooldown <= 0 && distToPlayer < 50) {
                        this.damagePlayer(enemy.damage, enemy.type);
                        enemy.attackCooldown = enemy.isBoss ? 800 : 1000;
                    }
                    if (distToPlayer > 60) {
                        enemy.state = 'chase';
                    }
                    break;
            }

            this.drawEnemy(enemy);
        });
    }

    initHarness() {
        const scene = this;

        // Synchronous tick function for time-accelerated testing
        function runTick(dt) {
            if (gamePaused || gameState !== 'playing') return;

            harnessTime += dt;

            // Cooldowns
            if (scene.attackCooldown > 0) scene.attackCooldown -= dt;
            if (scene.invincibleTime > 0) scene.invincibleTime -= dt;
            if (scene.dodgeCooldown > 0) scene.dodgeCooldown -= dt;

            // Energy regen
            if (scene.playerData.energy < scene.playerData.maxEnergy) {
                scene.playerData.energy = Math.min(scene.playerData.maxEnergy, scene.playerData.energy + 2 * (dt / 1000));
            }

            // Handle movement and update player position
            if (!scene.hackingActive) {
                scene.handleMovement(dt);

                // Manual physics update
                const dtSec = dt / 1000;
                if (scene.player && scene.player.body) {
                    scene.player.x += scene.player.body.velocity.x * dtSec;
                    scene.player.y += scene.player.body.velocity.y * dtSec;
                }
            }

            // Update enemies
            scene.updateEnemies(Date.now());

            // Update status effects
            scene.updateStatusEffects(dt);
        }

        window.harness = {
            pause: () => { gamePaused = true; },
            resume: () => { gamePaused = false; },
            isPaused: () => gamePaused,

            execute: async ({ keys: inputKeys = [], duration = 1000, screenshot = false, click }) => {
                const startTime = Date.now();
                debugLogs = [];

                // Apply key states
                if (inputKeys.length > 0) {
                    inputKeys.forEach(key => {
                        const k = scene.getKeyCode(key);
                        if (k && scene.cursors[k]) scene.cursors[k].isDown = true;
                    });
                }

                // Handle click attack
                if (click) {
                    scene.input.activePointer.worldX = click.x;
                    scene.input.activePointer.worldY = click.y;
                    scene.playerRotation = Phaser.Math.Angle.Between(scene.player.x, scene.player.y, click.x, click.y);
                    scene.playerAttack();
                }

                // Run physics ticks
                const tickMs = 16;
                let elapsed = 0;
                gamePaused = false;

                while (elapsed < duration) {
                    runTick(tickMs);
                    elapsed += tickMs;
                }

                gamePaused = true;

                // Clear keys
                if (inputKeys.length > 0) {
                    inputKeys.forEach(key => {
                        const k = scene.getKeyCode(key);
                        if (k && scene.cursors[k]) scene.cursors[k].isDown = false;
                    });
                }

                return {
                    screenshot: screenshot ? (scene.game.canvas ? scene.game.canvas.toDataURL() : null) : null,
                    logs: [...debugLogs],
                    state: window.harness.getState(),
                    realTime: Date.now() - startTime
                };
            },

            getState: () => ({
                gameState,
                currentDeck,
                harnessTime,
                player: {
                    x: scene.player?.x || 0,
                    y: scene.player?.y || 0,
                    health: scene.playerData.health,
                    maxHealth: scene.playerData.maxHealth,
                    energy: scene.playerData.energy,
                    maxEnergy: scene.playerData.maxEnergy,
                    ammo: scene.playerData.ammo,
                    currentWeapon: scene.playerData.currentWeapon,
                    cyberModules: scene.playerData.cyberModules,
                    keycards: scene.playerData.keycards,
                    skills: scene.playerData.skills,
                    statusEffects: Object.keys(scene.playerData.statusEffects),
                    weaponDurability: scene.playerData.weaponDurability[scene.playerData.currentWeapon] ?? 100
                },
                enemies: scene.enemies.map(e => ({
                    type: e.type,
                    x: e.x,
                    y: e.y,
                    health: e.health,
                    maxHealth: e.maxHealth,
                    state: e.state,
                    isBoss: e.isBoss || false
                })),
                items: scene.items.map(i => ({
                    type: i.type,
                    x: i.x,
                    y: i.y
                })),
                terminals: scene.terminals.map(t => ({
                    x: t.x,
                    y: t.y,
                    hacked: t.hacked,
                    difficulty: t.difficulty
                })),
                hackingActive: scene.hackingActive,
                skillMenuOpen: scene.skillMenuOpen
            }),

            getPhase: () => {
                if (scene.hackingActive) return 'hacking';
                return gameState;
            },

            debug: {
                setHealth: hp => { scene.playerData.health = hp; scene.updateUI(); },
                setPosition: (x, y) => { scene.player.x = x; scene.player.y = y; },
                setGodMode: enabled => { scene.godMode = enabled; },
                skipToLevel: deck => { scene.loadDeck(deck); },
                spawnEnemy: (type, x, y) => { scene.spawnEnemy(type, x, y); },
                clearEnemies: () => {
                    scene.enemies.forEach(e => e.sprite.destroy());
                    scene.enemies = [];
                },
                giveItem: type => { scene.playerData.inventory.push(type); },
                giveAmmo: (type, amount) => { scene.playerData.ammo[type] = (scene.playerData.ammo[type] || 0) + amount; },
                forceStart: () => { gameState = 'playing'; gamePaused = false; },
                forceGameOver: () => { scene.playerDeath(); },
                restart: () => {
                    gameState = 'playing';
                    harnessTime = 0;
                    debugLogs = [];
                    scene.playerData.health = scene.playerData.maxHealth;
                    scene.playerData.energy = scene.playerData.maxEnergy;
                },
                log: msg => console.log('[HARNESS]', msg)
            },

            version: '2.0',
            gameInfo: {
                name: 'System Shock 2D',
                type: 'immersive_sim',
                controls: {
                    movement: ['w', 'a', 's', 'd'],
                    aim: 'mouse',
                    fire: 'click',
                    actions: { dodge: 'Space', interact: 'e', reload: 'r', flashlight: 'f', quickHeal: 'q' }
                }
            }
        };

        console.log('[HARNESS] System Shock 2D harness initialized');
    }

    getKeyCode(key) {
        const map = {
            'w': 'up', 'W': 'up',
            's': 'down', 'S': 'down',
            'a': 'left', 'A': 'left',
            'd': 'right', 'D': 'right',
            'Shift': 'shift', 'shift': 'shift',
            'Ctrl': 'ctrl', 'ctrl': 'ctrl',
            'e': 'interact', 'E': 'interact',
            'f': 'flashlight', 'F': 'flashlight',
            'q': 'quickHeal', 'Q': 'quickHeal',
            'r': 'reload', 'R': 'reload',
            'Tab': 'inventory', 'tab': 'inventory',
            'm': 'map', 'M': 'map',
            'Space': 'dodge', ' ': 'dodge',
            '1': 'slot1', '2': 'slot2',
            'Escape': 'escape'
        };
        return map[key];
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        gameState = 'menu';

        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0a12);

        this.add.text(GAME_WIDTH / 2, 80, 'SYSTEM SHOCK 2D', {
            fontSize: '48px',
            fill: '#ff3333'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 130, 'WHISPERS OF M.A.R.I.A.', {
            fontSize: '24px',
            fill: '#00ff88'
        }).setOrigin(0.5);

        const startBtn = this.add.text(GAME_WIDTH / 2, 280, '[ BEGIN ]', {
            fontSize: '28px',
            fill: '#ffffff'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#ff3333'));
        startBtn.on('pointerout', () => startBtn.setFill('#ffffff'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));

        this.add.text(GAME_WIDTH / 2, 400, 'WASD - Move | Mouse - Aim | Click - Fire', {
            fontSize: '14px',
            fill: '#666666'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 425, 'E - Interact | Space - Dodge | R - Reload', {
            fontSize: '14px',
            fill: '#666666'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 450, 'U - Upgrades | Q - Quick Heal | F - Flashlight | Ctrl - Crouch', {
            fontSize: '14px',
            fill: '#666666'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('GameScene'));

        // Menu harness
        window.harness = {
            pause: () => { gamePaused = true; },
            resume: () => { gamePaused = false; },
            isPaused: () => gamePaused,
            execute: (action, duration) => {
                return new Promise(resolve => {
                    if (action.keys?.includes('Space')) this.scene.start('GameScene');
                    setTimeout(resolve, duration);
                });
            },
            getState: () => ({ gameState: 'menu' }),
            getPhase: () => 'menu',
            debug: {
                forceStart: () => this.scene.start('GameScene'),
                log: msg => console.log('[HARNESS]', msg)
            },
            version: '1.0',
            gameInfo: { name: 'System Shock 2D', type: 'immersive_sim' }
        };
    }
}

// Config
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0a0a12',
    scene: [MenuScene, GameScene]
};

const game = new Phaser.Game(config);
