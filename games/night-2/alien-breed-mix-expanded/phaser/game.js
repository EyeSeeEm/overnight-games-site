// STATION BREACH: EXPANDED EDITION
// Twin-Stick Shooter with full progression, save/load, achievements, and more content

// Game config and initialization at the end of file

// ============= GLOBAL GAME DATA =============
const GameData = {
    // Permanent progression (saved)
    credits: 0,
    totalKills: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    highScore: 0,
    achievements: {},
    unlockedWeapons: ['PISTOL'],
    upgrades: {
        maxHp: 0,
        maxShield: 0,
        speed: 0,
        damage: 0,
        reloadSpeed: 0
    },
    settings: {
        musicVolume: 0.5,
        sfxVolume: 0.7,
        screenShake: true,
        showDamageNumbers: true
    },

    // Session data (not saved)
    currentRun: {
        deck: 1,
        hp: 100,
        shield: 0,
        keycards: { green: false, blue: false, yellow: false, red: false },
        weapon: 0,
        ammo: {},
        magazine: [],
        score: 0,
        kills: 0,
        time: 0
    },

    save() {
        const saveData = {
            credits: this.credits,
            totalKills: this.totalKills,
            gamesPlayed: this.gamesPlayed,
            gamesWon: this.gamesWon,
            highScore: this.highScore,
            achievements: this.achievements,
            unlockedWeapons: this.unlockedWeapons,
            upgrades: this.upgrades,
            settings: this.settings
        };
        localStorage.setItem('stationBreach_save', JSON.stringify(saveData));
    },

    load() {
        const saved = localStorage.getItem('stationBreach_save');
        if (saved) {
            const data = JSON.parse(saved);
            Object.assign(this, data);
        }
    },

    resetRun() {
        this.currentRun = {
            deck: 1,
            hp: 100 + this.upgrades.maxHp * 20,
            shield: this.upgrades.maxShield * 10,
            keycards: { green: false, blue: false, yellow: false, red: false },
            weapon: 0,
            ammo: { '9mm': 300, 'shells': 64, 'plasma': 80, 'rockets': 20, 'laser': 100 },
            magazine: [12, 8, 45, 20, 4, 50],
            score: 0,
            kills: 0,
            time: 0
        };
    }
};

// ============= WEAPON DEFINITIONS (Expanded) =============
const WEAPONS = [
    { name: 'PISTOL', damage: 15, fireRate: 200, magSize: 12, reloadTime: 1000, ammoType: '9mm', spread: 2, color: 0xffff00, infinite: true, shake: 3, unlocked: true },
    { name: 'SHOTGUN', damage: 10, pellets: 8, fireRate: 600, magSize: 8, reloadTime: 2000, ammoType: 'shells', spread: 20, color: 0xff8800, shake: 12 },
    { name: 'SMG', damage: 8, fireRate: 60, magSize: 45, reloadTime: 1500, ammoType: '9mm', spread: 6, color: 0x44ff44, shake: 2 },
    { name: 'PLASMA', damage: 35, fireRate: 300, magSize: 20, reloadTime: 2500, ammoType: 'plasma', spread: 0, color: 0x44ffff, shake: 8 },
    { name: 'ROCKET', damage: 80, fireRate: 1000, magSize: 4, reloadTime: 3000, ammoType: 'rockets', spread: 0, color: 0xff4444, shake: 20, explosive: true },
    { name: 'LASER', damage: 5, fireRate: 30, magSize: 50, reloadTime: 2000, ammoType: 'laser', spread: 0, color: 0xff00ff, shake: 1, beam: true }
];

// ============= ENEMY TYPES (Expanded) =============
const ENEMY_TYPES = {
    drone: { hp: 25, damage: 8, speed: 140, color: 0x44ff44, glowColor: 0x22aa22, size: 10, value: 10, xp: 5 },
    spitter: { hp: 35, damage: 12, speed: 70, color: 0xffff44, glowColor: 0xaaaa22, size: 14, ranged: true, value: 20, xp: 10 },
    lurker: { hp: 45, damage: 18, speed: 220, color: 0xff44ff, glowColor: 0xaa22aa, size: 12, value: 25, xp: 15 },
    brute: { hp: 120, damage: 25, speed: 50, color: 0xff4444, glowColor: 0xaa2222, size: 22, value: 50, xp: 30 },
    // New enemy types
    swarm: { hp: 10, damage: 5, speed: 180, color: 0x88ff88, glowColor: 0x44aa44, size: 6, value: 5, xp: 3 },
    tank: { hp: 200, damage: 35, speed: 30, color: 0x884444, glowColor: 0x662222, size: 28, value: 100, xp: 50 },
    sniper: { hp: 30, damage: 40, speed: 40, color: 0xffaaff, glowColor: 0xaa66aa, size: 12, ranged: true, longRange: true, value: 40, xp: 25 },
    bomber: { hp: 50, damage: 50, speed: 100, color: 0xff8844, glowColor: 0xaa5522, size: 16, explosive: true, value: 35, xp: 20 },
    boss_queen: { hp: 500, damage: 30, speed: 60, color: 0xff0000, glowColor: 0xaa0000, size: 40, boss: true, value: 500, xp: 200, spawner: true }
};

// ============= ACHIEVEMENTS =============
const ACHIEVEMENTS = {
    first_blood: { name: 'First Blood', desc: 'Kill your first alien', condition: (d) => d.totalKills >= 1 },
    hundred_kills: { name: 'Centurion', desc: 'Kill 100 aliens', condition: (d) => d.totalKills >= 100 },
    thousand_kills: { name: 'Exterminator', desc: 'Kill 1000 aliens', condition: (d) => d.totalKills >= 1000 },
    first_win: { name: 'Survivor', desc: 'Escape the station', condition: (d) => d.gamesWon >= 1 },
    ten_wins: { name: 'Veteran', desc: 'Escape 10 times', condition: (d) => d.gamesWon >= 10 },
    rich: { name: 'Wealthy', desc: 'Accumulate 10000 credits', condition: (d) => d.credits >= 10000 },
    all_weapons: { name: 'Arsenal', desc: 'Unlock all weapons', condition: (d) => d.unlockedWeapons.length >= 6 },
    speed_run: { name: 'Speed Demon', desc: 'Beat the game in under 5 minutes', condition: (d, run) => run && run.time < 300 && run.won },
    no_damage: { name: 'Untouchable', desc: 'Complete a deck without taking damage', condition: (d, run) => run && run.noDamageDeck },
    boss_slayer: { name: 'Boss Slayer', desc: 'Defeat the Alien Queen', condition: (d) => d.bossKilled }
};

// ============= BOOT SCENE =============
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    preload() {
        // Load saved data
        GameData.load();
    }

    create() {
        this.createTextures();
        this.scene.start('MenuScene');
    }

    createTextures() {
        // Player
        let gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x4488ff, 0.3);
        gfx.fillCircle(16, 16, 16);
        gfx.fillStyle(0x4488ff);
        gfx.fillRoundedRect(4, 4, 24, 24, 4);
        gfx.fillStyle(0x00ffff);
        gfx.fillRect(20, 10, 10, 12);
        gfx.fillStyle(0x88ccff);
        gfx.fillRect(6, 6, 16, 4);
        gfx.generateTexture('player', 32, 32);
        gfx.destroy();

        // Bullets
        WEAPONS.forEach((w, i) => {
            gfx = this.make.graphics({ add: false });
            gfx.fillStyle(w.color, 0.5);
            gfx.fillCircle(8, 4, 8);
            gfx.fillStyle(w.color);
            gfx.fillRoundedRect(2, 1, 12, 6, 2);
            gfx.fillStyle(0xffffff);
            gfx.fillRect(10, 2, 4, 4);
            gfx.generateTexture('bullet_' + i, 16, 8);
            gfx.destroy();
        });

        // Plasma
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x44ffff, 0.3);
        gfx.fillCircle(8, 8, 10);
        gfx.fillStyle(0x44ffff);
        gfx.fillCircle(8, 8, 6);
        gfx.fillStyle(0xffffff);
        gfx.fillCircle(8, 8, 3);
        gfx.generateTexture('plasma', 16, 16);
        gfx.destroy();

        // Rocket
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xff4444);
        gfx.fillRect(0, 2, 16, 8);
        gfx.fillStyle(0xffaa00);
        gfx.fillTriangle(16, 6, 20, 2, 20, 10);
        gfx.fillStyle(0xff8800);
        gfx.fillRect(-4, 4, 4, 4);
        gfx.generateTexture('rocket', 24, 12);
        gfx.destroy();

        // Enemy bullet
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x00ff44, 0.4);
        gfx.fillCircle(8, 8, 10);
        gfx.fillStyle(0x00ff44);
        gfx.fillCircle(8, 8, 5);
        gfx.generateTexture('enemyBullet', 16, 16);
        gfx.destroy();

        // Wall
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x3a3a4a);
        gfx.fillRect(0, 0, 32, 32);
        gfx.fillStyle(0x4a4a5a);
        gfx.fillRect(2, 2, 28, 28);
        gfx.lineStyle(1, 0x5a5a6a);
        gfx.lineBetween(16, 4, 16, 28);
        gfx.generateTexture('wall', 32, 32);
        gfx.destroy();

        // Doors
        ['green', 'blue', 'yellow', 'red', 'normal', 'boss'].forEach((color) => {
            gfx = this.make.graphics({ add: false });
            const colors = { green: 0x00ff00, blue: 0x0088ff, yellow: 0xffff00, red: 0xff0000, normal: 0x888888, boss: 0xff00ff };
            const c = colors[color];
            gfx.fillStyle(c, 0.2);
            gfx.fillRect(-4, -4, 40, 56);
            gfx.fillStyle(0x222233);
            gfx.fillRect(0, 0, 32, 48);
            gfx.fillStyle(c);
            gfx.fillRect(0, 0, 32, 6);
            gfx.fillRect(0, 42, 32, 6);
            gfx.fillRect(0, 0, 4, 48);
            gfx.fillRect(28, 0, 4, 48);
            gfx.fillStyle(c, 0.5);
            gfx.fillCircle(16, 24, 8);
            gfx.generateTexture('door_' + color, 40, 56);
            gfx.destroy();
        });

        // Items
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xff4444, 0.3);
        gfx.fillCircle(10, 10, 12);
        gfx.fillStyle(0xffffff);
        gfx.fillRect(6, 3, 8, 14);
        gfx.fillRect(3, 6, 14, 8);
        gfx.fillStyle(0xff4444);
        gfx.fillRect(7, 4, 6, 12);
        gfx.fillRect(4, 7, 12, 6);
        gfx.generateTexture('health', 20, 20);
        gfx.destroy();

        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xffaa00, 0.3);
        gfx.fillCircle(10, 10, 12);
        gfx.fillStyle(0x664400);
        gfx.fillRect(2, 2, 16, 16);
        gfx.fillStyle(0xffaa00);
        gfx.fillRect(4, 4, 12, 12);
        gfx.generateTexture('ammo', 20, 20);
        gfx.destroy();

        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xffdd00, 0.4);
        gfx.fillCircle(10, 10, 12);
        gfx.fillStyle(0xffdd00);
        gfx.fillCircle(10, 10, 8);
        gfx.fillStyle(0xffffff);
        gfx.fillCircle(7, 7, 2);
        gfx.generateTexture('credit', 20, 20);
        gfx.destroy();

        // Shield pickup
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x4488ff, 0.3);
        gfx.fillCircle(10, 10, 12);
        gfx.lineStyle(3, 0x4488ff);
        gfx.strokeCircle(10, 10, 8);
        gfx.generateTexture('shield_item', 20, 20);
        gfx.destroy();

        // Keycards
        ['green', 'blue', 'yellow', 'red'].forEach(color => {
            gfx = this.make.graphics({ add: false });
            const colors = { green: 0x00ff00, blue: 0x0088ff, yellow: 0xffff00, red: 0xff0000 };
            gfx.fillStyle(colors[color], 0.5);
            gfx.fillRect(-2, -2, 28, 18);
            gfx.fillStyle(colors[color]);
            gfx.fillRoundedRect(0, 0, 24, 14, 2);
            gfx.fillStyle(0x222222);
            gfx.fillRect(2, 2, 8, 10);
            gfx.generateTexture('keycard_' + color, 28, 18);
            gfx.destroy();
        });

        // Particles
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xffffff);
        gfx.fillCircle(4, 4, 4);
        gfx.generateTexture('particle', 8, 8);
        gfx.destroy();

        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x00ff44);
        gfx.fillCircle(3, 3, 3);
        gfx.generateTexture('blood', 6, 6);
        gfx.destroy();

        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xffff88, 0.8);
        gfx.fillCircle(16, 16, 16);
        gfx.fillStyle(0xffffff);
        gfx.fillCircle(16, 16, 8);
        gfx.generateTexture('muzzleFlash', 32, 32);
        gfx.destroy();

        // Explosion
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xff8800, 0.8);
        gfx.fillCircle(24, 24, 24);
        gfx.fillStyle(0xffff00);
        gfx.fillCircle(24, 24, 16);
        gfx.fillStyle(0xffffff);
        gfx.fillCircle(24, 24, 8);
        gfx.generateTexture('explosion', 48, 48);
        gfx.destroy();
    }
}

// ============= MENU SCENE =============
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        // Background
        this.add.rectangle(400, 300, 800, 600, 0x0a0a12);

        // Title with glow effect
        const title = this.add.text(400, 100, 'STATION BREACH', {
            fontSize: '48px',
            fontFamily: 'Orbitron',
            fontStyle: 'bold',
            color: '#ff3322',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(400, 150, 'EXPANDED EDITION', {
            fontSize: '20px',
            fontFamily: 'Orbitron',
            color: '#ffaa00'
        }).setOrigin(0.5);

        // Stats display
        this.add.text(400, 200, `Credits: $${GameData.credits} | Kills: ${GameData.totalKills} | Wins: ${GameData.gamesWon}`, {
            fontSize: '14px',
            fontFamily: 'Share Tech Mono',
            color: '#888'
        }).setOrigin(0.5);

        // Menu buttons
        const buttons = [
            { text: 'START GAME', y: 280, action: () => this.startGame() },
            { text: 'UPGRADES', y: 330, action: () => this.scene.start('UpgradeScene') },
            { text: 'ACHIEVEMENTS', y: 380, action: () => this.scene.start('AchievementsScene') },
            { text: 'TUTORIAL', y: 430, action: () => this.scene.start('TutorialScene') },
            { text: 'SETTINGS', y: 480, action: () => this.scene.start('SettingsScene') }
        ];

        buttons.forEach(btn => {
            const bg = this.add.rectangle(400, btn.y, 250, 40, 0x222244, 0.8).setInteractive();
            const text = this.add.text(400, btn.y, btn.text, {
                fontSize: '18px',
                fontFamily: 'Orbitron',
                color: '#fff'
            }).setOrigin(0.5);

            bg.on('pointerover', () => { bg.setFillStyle(0x444466); text.setColor('#ffaa00'); });
            bg.on('pointerout', () => { bg.setFillStyle(0x222244); text.setColor('#fff'); });
            bg.on('pointerdown', btn.action);
        });

        // High score
        this.add.text(400, 550, `High Score: ${GameData.highScore}`, {
            fontSize: '16px',
            fontFamily: 'Share Tech Mono',
            color: '#ffdd00'
        }).setOrigin(0.5);

        // Expose for testing
        if (typeof window !== 'undefined') {
            window.getGameState = () => ({ screen: 'menu', data: GameData });
        }
    }

    startGame() {
        GameData.resetRun();
        GameData.gamesPlayed++;
        GameData.save();
        this.scene.start('GameScene');
    }
}

// ============= GAME SCENE =============
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        this.gameState = 'playing';
        this.selfDestructTimer = 0;
        this.selfDestructActive = false;
        this.deckDamageTaken = false;

        // Groups
        this.walls = this.physics.add.staticGroup();
        this.doors = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.items = this.physics.add.group();
        this.explosions = this.add.group();

        // Particle emitters
        this.particles = this.add.particles(0, 0, 'particle', {
            speed: { min: 50, max: 200 },
            scale: { start: 0.6, end: 0 },
            lifespan: 300,
            blendMode: 'ADD',
            emitting: false
        });

        this.bloodEmitter = this.add.particles(0, 0, 'blood', {
            speed: { min: 100, max: 300 },
            scale: { start: 1, end: 0.3 },
            lifespan: 500,
            gravityY: 200,
            emitting: false
        });

        this.sparkEmitter = this.add.particles(0, 0, 'particle', {
            speed: { min: 100, max: 400 },
            scale: { start: 0.4, end: 0 },
            lifespan: 200,
            tint: 0xffaa00,
            blendMode: 'ADD',
            emitting: false
        });

        // Player
        this.player = this.physics.add.sprite(400, 500, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Muzzle flash
        this.muzzleFlash = this.add.sprite(0, 0, 'muzzleFlash');
        this.muzzleFlash.setVisible(false);
        this.muzzleFlash.setDepth(11);
        this.muzzleFlash.setBlendMode(Phaser.BlendModes.ADD);

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D',
            reload: 'R', interact: 'E', sprint: 'SHIFT',
            switchWeapon: 'Q', pause: 'ESC'
        });

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.collider(this.bullets, this.walls, this.bulletHitWall, null, this);
        this.physics.add.collider(this.enemyBullets, this.walls, this.bulletHitWall, null, this);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.enemyBullets, this.player, this.enemyBulletHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerTouchEnemy, null, this);
        this.physics.add.overlap(this.player, this.items, this.collectItem, null, this);
        this.physics.add.overlap(this.player, this.doors, this.checkDoor, null, this);

        this.createUI();
        this.generateDeck(GameData.currentRun.deck);

        // Session tracking
        this.lastFired = 0;
        this.reloading = false;
        this.reloadTimer = 0;
        this.messageTimer = 0;
        this.invincibleTimer = 0;
        this.runTime = 0;

        // Expose for testing
        if (typeof window !== 'undefined') {
            window.getGameState = () => ({
                screen: this.gameState,
                deck: GameData.currentRun.deck,
                hp: GameData.currentRun.hp,
                score: GameData.currentRun.score,
                enemies: this.enemies.getChildren().length
            });
        }
    }

    createUI() {
        // Health bar background
        this.add.rectangle(15, 20, 210, 22, 0x111122).setScrollFactor(0).setDepth(99).setOrigin(0, 0.5);
        this.add.rectangle(15, 20, 204, 16, 0x331111).setScrollFactor(0).setDepth(100).setOrigin(0, 0.5);
        this.healthBar = this.add.rectangle(17, 20, 200, 12, 0xff4444).setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);

        this.healthText = this.add.text(120, 20, '100/100', {
            fontSize: '12px', fontFamily: 'Share Tech Mono', color: '#fff'
        }).setScrollFactor(0).setDepth(102).setOrigin(0.5);

        // Shield bar
        this.add.rectangle(15, 45, 160, 16, 0x112233).setScrollFactor(0).setDepth(99).setOrigin(0, 0.5);
        this.shieldBar = this.add.rectangle(17, 45, 0, 10, 0x4488ff).setScrollFactor(0).setDepth(100).setOrigin(0, 0.5);

        // Weapon display
        this.add.rectangle(10, 545, 160, 50, 0x111122, 0.8).setScrollFactor(0).setDepth(99).setOrigin(0, 0);
        this.weaponText = this.add.text(20, 555, 'PISTOL', {
            fontSize: '18px', fontFamily: 'Orbitron', fontStyle: 'bold', color: '#ffaa00'
        }).setScrollFactor(0).setDepth(100);
        this.ammoText = this.add.text(20, 578, '12/12 | INF', {
            fontSize: '12px', fontFamily: 'Share Tech Mono', color: '#aaa'
        }).setScrollFactor(0).setDepth(100);

        // Score and credits
        this.add.rectangle(690, 20, 100, 25, 0x111122, 0.8).setScrollFactor(0).setDepth(99);
        this.scoreText = this.add.text(695, 13, 'SCORE: 0', {
            fontSize: '14px', fontFamily: 'Share Tech Mono', color: '#fff'
        }).setScrollFactor(0).setDepth(100);

        this.add.rectangle(690, 575, 100, 30, 0x111122, 0.8).setScrollFactor(0).setDepth(99);
        this.creditText = this.add.text(695, 568, '$ 0', {
            fontSize: '18px', fontFamily: 'Orbitron', color: '#ffdd00'
        }).setScrollFactor(0).setDepth(100);

        // Keycard icons
        this.keycardIcons = {};
        ['green', 'blue', 'yellow', 'red'].forEach((color, i) => {
            this.keycardIcons[color] = this.add.rectangle(650 + i * 35, 50, 28, 16, 0x333344)
                .setScrollFactor(0).setDepth(100);
        });

        // Timer (for self-destruct)
        this.timerText = this.add.text(400, 25, '', {
            fontSize: '28px', fontFamily: 'Orbitron', fontStyle: 'bold', color: '#ff0000'
        }).setScrollFactor(0).setDepth(100).setOrigin(0.5);

        // Message
        this.messageText = this.add.text(400, 100, '', {
            fontSize: '20px', fontFamily: 'Orbitron', color: '#fff', stroke: '#000', strokeThickness: 4
        }).setScrollFactor(0).setDepth(200).setOrigin(0.5);

        // Deck indicator
        this.deckText = this.add.text(400, 580, 'DECK 1', {
            fontSize: '14px', fontFamily: 'Share Tech Mono', color: '#666'
        }).setScrollFactor(0).setDepth(100).setOrigin(0.5);

        // Kill counter
        this.killText = this.add.text(15, 70, 'KILLS: 0', {
            fontSize: '12px', fontFamily: 'Share Tech Mono', color: '#ff4444'
        }).setScrollFactor(0).setDepth(100);
    }

    generateDeck(deck) {
        this.walls.clear(true, true);
        this.doors.clear(true, true);
        this.enemies.clear(true, true);
        this.items.clear(true, true);

        GameData.currentRun.deck = deck;
        this.deckText.setText('DECK ' + deck);
        this.deckDamageTaken = false;

        // Border walls
        for (let x = 0; x < 800; x += 32) {
            this.walls.create(x + 16, 16, 'wall');
            this.walls.create(x + 16, 584, 'wall');
        }
        for (let y = 32; y < 584; y += 32) {
            this.walls.create(16, y + 16, 'wall');
            this.walls.create(784, y + 16, 'wall');
        }

        this.createDeckLayout(deck);
        this.spawnEnemies(deck);
        this.spawnItems(deck);

        this.player.setPosition(400, 500);
        this.showMessage('DECK ' + deck + (deck === 6 ? ' - BOSS DECK' : ' - CLEAR THE STATION'));
    }

    createDeckLayout(deck) {
        // More varied layouts per deck
        const layouts = {
            1: () => {
                for (let x = 100; x < 300; x += 32) {
                    this.walls.create(x, 200, 'wall');
                    this.walls.create(x, 400, 'wall');
                }
                for (let x = 500; x < 700; x += 32) {
                    this.walls.create(x, 200, 'wall');
                    this.walls.create(x, 400, 'wall');
                }
                this.walls.create(400, 300, 'wall');
                this.walls.create(432, 300, 'wall');
                let door = this.doors.create(400, 48, 'door_green');
                door.doorType = 'green'; door.nextDeck = 2;
            },
            2: () => {
                for (let x = 200; x < 400; x += 32) this.walls.create(x, 150, 'wall');
                for (let y = 150; y < 350; y += 32) this.walls.create(400, y, 'wall');
                for (let x = 400; x < 600; x += 32) this.walls.create(x, 350, 'wall');
                this.walls.create(200, 450, 'wall');
                this.walls.create(600, 200, 'wall');
                let door = this.doors.create(400, 48, 'door_blue');
                door.doorType = 'blue'; door.nextDeck = 3;
            },
            3: () => {
                for (let x = 150; x < 350; x += 32) this.walls.create(x, 250, 'wall');
                for (let x = 450; x < 650; x += 32) this.walls.create(x, 250, 'wall');
                this.walls.create(400, 150, 'wall');
                this.walls.create(400, 400, 'wall');
                let door = this.doors.create(400, 48, 'door_yellow');
                door.doorType = 'yellow'; door.nextDeck = 4;
            },
            4: () => {
                // More complex layout
                for (let x = 100; x < 250; x += 32) this.walls.create(x, 200, 'wall');
                for (let x = 550; x < 700; x += 32) this.walls.create(x, 200, 'wall');
                for (let y = 200; y < 400; y += 32) {
                    this.walls.create(250, y, 'wall');
                    this.walls.create(550, y, 'wall');
                }
                for (let x = 300; x < 500; x += 32) this.walls.create(x, 350, 'wall');
                let door = this.doors.create(400, 48, 'door_red');
                door.doorType = 'red'; door.nextDeck = 5;
            },
            5: () => {
                // Final regular deck
                for (let x = 150; x < 350; x += 32) this.walls.create(x, 180, 'wall');
                for (let x = 450; x < 650; x += 32) this.walls.create(x, 180, 'wall');
                for (let x = 150; x < 350; x += 32) this.walls.create(x, 420, 'wall');
                for (let x = 450; x < 650; x += 32) this.walls.create(x, 420, 'wall');
                this.walls.create(400, 300, 'wall');
                let door = this.doors.create(400, 48, 'door_boss');
                door.doorType = 'boss'; door.nextDeck = 6;
                if (!this.selfDestructActive) {
                    this.selfDestructActive = true;
                    this.selfDestructTimer = 420; // 7 minutes for expanded
                    this.showMessage('SELF-DESTRUCT ACTIVATED!');
                }
            },
            6: () => {
                // Boss arena - open space
                this.walls.create(200, 200, 'wall');
                this.walls.create(600, 200, 'wall');
                this.walls.create(200, 400, 'wall');
                this.walls.create(600, 400, 'wall');
                let escapePod = this.doors.create(400, 80, 'door_normal');
                escapePod.doorType = 'escape';
                escapePod.isEscape = true;
            }
        };

        (layouts[deck] || layouts[1])();
    }

    spawnEnemies(deck) {
        const spawns = {
            1: { drone: 12, spitter: 4 },
            2: { drone: 10, spitter: 6, lurker: 4, brute: 2 },
            3: { drone: 8, spitter: 6, lurker: 6, brute: 3, swarm: 10 },
            4: { drone: 6, spitter: 8, lurker: 8, brute: 4, sniper: 3, swarm: 15 },
            5: { drone: 10, spitter: 8, lurker: 10, brute: 6, tank: 2, bomber: 4 },
            6: { boss_queen: 1, drone: 8, lurker: 6 } // Boss deck
        };

        const spawn = spawns[deck] || spawns[1];

        Object.entries(spawn).forEach(([type, count]) => {
            for (let i = 0; i < count; i++) {
                let x, y, attempts = 0;
                do {
                    x = Phaser.Math.Between(100, 700);
                    y = Phaser.Math.Between(100, 450);
                    attempts++;
                } while (attempts < 50 && Phaser.Math.Distance.Between(x, y, 400, 500) < 200);
                this.createEnemy(x, y, type);
            }
        });
    }

    createEnemy(x, y, type) {
        const def = ENEMY_TYPES[type];

        let gfx = this.make.graphics({ add: false });
        gfx.fillStyle(def.glowColor, 0.4);
        gfx.fillCircle(def.size + 4, def.size + 4, def.size + 4);
        gfx.fillStyle(def.color);
        gfx.fillCircle(def.size + 4, def.size + 4, def.size);
        gfx.fillStyle(0x000000);
        gfx.fillCircle(def.size + 6, def.size + 2, def.size / 4);
        gfx.fillStyle(0xff0000);
        gfx.fillCircle(def.size + 6, def.size + 2, def.size / 6);

        const texKey = 'enemy_' + type + '_' + Date.now() + '_' + Math.random();
        gfx.generateTexture(texKey, (def.size + 4) * 2, (def.size + 4) * 2);
        gfx.destroy();

        let enemy = this.enemies.create(x, y, texKey);
        Object.assign(enemy, {
            enemyType: type,
            hp: def.hp,
            maxHp: def.hp,
            damage: def.damage,
            speed: def.speed,
            ranged: def.ranged || false,
            longRange: def.longRange || false,
            explosive: def.explosive || false,
            boss: def.boss || false,
            spawner: def.spawner || false,
            value: def.value,
            xp: def.xp,
            lastAttack: 0,
            attackCooldown: def.ranged ? (def.longRange ? 2500 : 1500) : 800,
            spawnCooldown: 0,
            state: 'patrol',
            patrolAngle: Math.random() * Math.PI * 2
        });

        return enemy;
    }

    spawnItems(deck) {
        // Health pickups
        for (let i = 0; i < 5; i++) {
            let x = Phaser.Math.Between(100, 700);
            let y = Phaser.Math.Between(100, 500);
            let item = this.items.create(x, y, 'health');
            item.itemType = 'health';
            item.value = 30;
            this.tweens.add({ targets: item, y: y - 5, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }

        // Shield pickups
        for (let i = 0; i < 2; i++) {
            let x = Phaser.Math.Between(100, 700);
            let y = Phaser.Math.Between(100, 500);
            let item = this.items.create(x, y, 'shield_item');
            item.itemType = 'shield';
            item.value = 25;
            this.tweens.add({ targets: item, y: y - 5, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }

        // Ammo
        for (let i = 0; i < 6; i++) {
            let x = Phaser.Math.Between(100, 700);
            let y = Phaser.Math.Between(100, 500);
            let item = this.items.create(x, y, 'ammo');
            item.itemType = 'ammo';
            this.tweens.add({ targets: item, y: y - 5, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }

        // Credits
        for (let i = 0; i < 8; i++) {
            let x = Phaser.Math.Between(100, 700);
            let y = Phaser.Math.Between(100, 500);
            let item = this.items.create(x, y, 'credit');
            item.itemType = 'credit';
            item.value = Phaser.Math.Between(15, 50);
            this.tweens.add({ targets: item, angle: 360, duration: 2000, repeat: -1 });
        }

        // Keycards
        const keycardDeck = { 1: 'green', 2: 'blue', 3: 'yellow', 4: 'red' };
        if (keycardDeck[deck]) {
            let keycard = this.items.create(Phaser.Math.Between(150, 650), Phaser.Math.Between(150, 400), 'keycard_' + keycardDeck[deck]);
            keycard.itemType = 'keycard';
            keycard.keycardColor = keycardDeck[deck];
            this.tweens.add({ targets: keycard, y: keycard.y - 5, duration: 500, yoyo: true, repeat: -1 });
        }
    }

    update(time, delta) {
        if (this.gameState !== 'playing') return;

        // Pause
        if (Phaser.Input.Keyboard.JustDown(this.cursors.pause)) {
            this.scene.pause();
            this.scene.launch('PauseScene');
            return;
        }

        this.runTime += delta / 1000;
        GameData.currentRun.time = this.runTime;

        // Player movement
        const baseSpeed = 200 + GameData.upgrades.speed * 20;
        let speed = this.cursors.sprint.isDown ? baseSpeed * 1.5 : baseSpeed;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown) vx = -speed;
        if (this.cursors.right.isDown) vx = speed;
        if (this.cursors.up.isDown) vy = -speed;
        if (this.cursors.down.isDown) vy = speed;

        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
        this.player.setVelocity(vx, vy);

        // Aim
        let pointer = this.input.activePointer;
        let angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
        this.player.rotation = angle;

        // Shooting
        if (pointer.isDown && !this.reloading && time > this.lastFired) {
            this.shoot(time, angle);
        }

        // Reload
        if (this.cursors.reload.isDown && !this.reloading) this.startReload(time);
        if (this.reloading && time > this.reloadTimer) this.finishReload();

        // Switch weapon
        if (Phaser.Input.Keyboard.JustDown(this.cursors.switchWeapon)) {
            this.switchWeapon();
        }

        // Update enemies
        this.enemies.getChildren().forEach(enemy => this.updateEnemy(enemy, time));

        // Clean bullets
        this.bullets.getChildren().forEach(bullet => {
            if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) bullet.destroy();
        });
        this.enemyBullets.getChildren().forEach(bullet => {
            if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) bullet.destroy();
        });

        // Invincibility
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= delta;
            this.player.alpha = Math.sin(time * 0.02) * 0.3 + 0.7;
        } else {
            this.player.alpha = 1;
        }

        // Self-destruct
        if (this.selfDestructActive) {
            this.selfDestructTimer -= delta / 1000;
            if (this.selfDestructTimer <= 0) {
                this.gameOver('STATION EXPLODED');
                return;
            }
            let mins = Math.floor(this.selfDestructTimer / 60);
            let secs = Math.floor(this.selfDestructTimer % 60);
            this.timerText.setText(mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0'));
            this.timerText.setColor(this.selfDestructTimer < 60 ? '#ff0000' : '#ff4444');
            if (this.selfDestructTimer < 30 && GameData.settings.screenShake) {
                this.cameras.main.shake(100, 0.002);
            }
        }

        this.updateUI();

        if (this.messageTimer > 0) {
            this.messageTimer -= delta;
            if (this.messageTimer <= 0) this.messageText.setText('');
        }

        if (GameData.currentRun.hp <= 0) this.gameOver('YOU DIED');
    }

    shoot(time, angle) {
        const weapon = WEAPONS[GameData.currentRun.weapon];
        if (!GameData.unlockedWeapons.includes(weapon.name)) return;

        if (GameData.currentRun.magazine[GameData.currentRun.weapon] <= 0) {
            this.startReload(time);
            return;
        }

        const reloadMult = 1 - GameData.upgrades.reloadSpeed * 0.1;
        this.lastFired = time + weapon.fireRate * reloadMult;
        GameData.currentRun.magazine[GameData.currentRun.weapon]--;

        // Screen shake
        if (GameData.settings.screenShake) {
            this.cameras.main.shake(50, weapon.shake * 0.001);
        }

        // Muzzle flash
        this.muzzleFlash.setPosition(
            this.player.x + Math.cos(angle) * 20,
            this.player.y + Math.sin(angle) * 20
        );
        this.muzzleFlash.setVisible(true);
        this.muzzleFlash.setScale(0.5 + weapon.shake * 0.05);
        this.muzzleFlash.setTint(weapon.color);
        this.time.delayedCall(50, () => this.muzzleFlash.setVisible(false));

        // Particles
        this.particles.setParticleTint(weapon.color);
        this.particles.emitParticleAt(this.player.x + Math.cos(angle) * 20, this.player.y + Math.sin(angle) * 20, 5);

        const damage = weapon.damage * (1 + GameData.upgrades.damage * 0.15);

        if (weapon.pellets) {
            for (let i = 0; i < weapon.pellets; i++) {
                let spreadAngle = angle + Phaser.Math.DegToRad(Phaser.Math.Between(-weapon.spread, weapon.spread));
                this.createBullet(spreadAngle, damage, weapon);
            }
        } else {
            let spreadAngle = angle + Phaser.Math.DegToRad(Phaser.Math.FloatBetween(-weapon.spread, weapon.spread));
            this.createBullet(spreadAngle, damage, weapon);
        }
    }

    createBullet(angle, damage, weapon) {
        let tex = weapon.name === 'PLASMA' ? 'plasma' : (weapon.name === 'ROCKET' ? 'rocket' : 'bullet_' + GameData.currentRun.weapon);
        let bullet = this.bullets.create(
            this.player.x + Math.cos(angle) * 25,
            this.player.y + Math.sin(angle) * 25,
            tex
        );
        bullet.rotation = angle;
        bullet.damage = damage;
        bullet.explosive = weapon.explosive || false;
        const speed = weapon.name === 'PLASMA' ? 500 : (weapon.name === 'ROCKET' ? 400 : 700);
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }

    switchWeapon() {
        let nextWeapon = GameData.currentRun.weapon;
        do {
            nextWeapon = (nextWeapon + 1) % WEAPONS.length;
        } while (!GameData.unlockedWeapons.includes(WEAPONS[nextWeapon].name) && nextWeapon !== GameData.currentRun.weapon);

        GameData.currentRun.weapon = nextWeapon;
        this.showMessage(WEAPONS[nextWeapon].name);
    }

    startReload(time) {
        const weapon = WEAPONS[GameData.currentRun.weapon];
        if (weapon.infinite) {
            GameData.currentRun.magazine[GameData.currentRun.weapon] = weapon.magSize;
            return;
        }
        if (GameData.currentRun.ammo[weapon.ammoType] <= 0) {
            this.showMessage('NO AMMO!');
            return;
        }
        this.reloading = true;
        const reloadMult = 1 - GameData.upgrades.reloadSpeed * 0.1;
        this.reloadTimer = time + weapon.reloadTime * reloadMult;
        this.showMessage('RELOADING...');
    }

    finishReload() {
        const weapon = WEAPONS[GameData.currentRun.weapon];
        this.reloading = false;
        if (weapon.infinite) {
            GameData.currentRun.magazine[GameData.currentRun.weapon] = weapon.magSize;
        } else {
            let needed = weapon.magSize - GameData.currentRun.magazine[GameData.currentRun.weapon];
            let available = Math.min(needed, GameData.currentRun.ammo[weapon.ammoType]);
            GameData.currentRun.magazine[GameData.currentRun.weapon] += available;
            GameData.currentRun.ammo[weapon.ammoType] -= available;
        }
        this.showMessage('READY!');
    }

    updateEnemy(enemy, time) {
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);

        // Boss spawning logic
        if (enemy.spawner && enemy.boss && time > enemy.spawnCooldown) {
            enemy.spawnCooldown = time + 5000;
            if (this.enemies.getChildren().length < 20) {
                const spawnTypes = ['drone', 'lurker', 'swarm'];
                const type = spawnTypes[Math.floor(Math.random() * spawnTypes.length)];
                this.createEnemy(
                    enemy.x + Phaser.Math.Between(-50, 50),
                    enemy.y + Phaser.Math.Between(-50, 50),
                    type
                );
            }
        }

        if (dist < 400) enemy.state = 'chase';
        else if (dist > 500) enemy.state = 'patrol';

        if (enemy.state === 'patrol') {
            enemy.setVelocity(
                Math.cos(enemy.patrolAngle) * enemy.speed * 0.3,
                Math.sin(enemy.patrolAngle) * enemy.speed * 0.3
            );
            if (Math.random() < 0.01) enemy.patrolAngle = Math.random() * Math.PI * 2;
        } else if (enemy.state === 'chase') {
            let angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            if (enemy.ranged) {
                const optimalDist = enemy.longRange ? 350 : 180;
                if (dist > optimalDist) {
                    enemy.setVelocity(Math.cos(angle) * enemy.speed * 0.5, Math.sin(angle) * enemy.speed * 0.5);
                } else if (dist < optimalDist - 50) {
                    enemy.setVelocity(-Math.cos(angle) * enemy.speed * 0.5, -Math.sin(angle) * enemy.speed * 0.5);
                } else {
                    enemy.setVelocity(0, 0);
                }

                if (time > enemy.lastAttack + enemy.attackCooldown) {
                    enemy.lastAttack = time;
                    let bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
                    bullet.damage = enemy.damage;
                    const bulletSpeed = enemy.longRange ? 450 : 350;
                    bullet.setVelocity(Math.cos(angle) * bulletSpeed, Math.sin(angle) * bulletSpeed);
                }
            } else {
                enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
            }
        }
    }

    bulletHitWall(bullet) {
        if (bullet.explosive) {
            this.createExplosion(bullet.x, bullet.y, bullet.damage);
        } else {
            this.sparkEmitter.emitParticleAt(bullet.x, bullet.y, 5);
        }
        bullet.destroy();
    }

    bulletHitEnemy(bullet, enemy) {
        if (bullet.explosive) {
            this.createExplosion(bullet.x, bullet.y, bullet.damage);
            bullet.destroy();
            return;
        }

        enemy.hp -= bullet.damage;
        this.bloodEmitter.emitParticleAt(enemy.x, enemy.y, 8);

        // Damage number
        if (GameData.settings.showDamageNumbers) {
            const dmgText = this.add.text(enemy.x, enemy.y - 20, Math.floor(bullet.damage).toString(), {
                fontSize: '14px', fontFamily: 'Orbitron', color: '#ff4444'
            }).setOrigin(0.5);
            this.tweens.add({
                targets: dmgText, y: dmgText.y - 30, alpha: 0, duration: 500,
                onComplete: () => dmgText.destroy()
            });
        }

        // Knockback
        let angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, enemy.x, enemy.y);
        enemy.setVelocity(Math.cos(angle) * 250, Math.sin(angle) * 250);

        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => enemy.clearTint());

        bullet.destroy();

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    createExplosion(x, y, damage) {
        const exp = this.add.sprite(x, y, 'explosion');
        exp.setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
            targets: exp, scale: 2, alpha: 0, duration: 300,
            onComplete: () => exp.destroy()
        });

        if (GameData.settings.screenShake) {
            this.cameras.main.shake(200, 0.02);
        }

        // Damage nearby enemies
        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (dist < 80) {
                const dmg = damage * (1 - dist / 80);
                enemy.hp -= dmg;
                if (enemy.hp <= 0) this.killEnemy(enemy);
            }
        });

        // Damage player if too close
        const playerDist = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
        if (playerDist < 80 && this.invincibleTimer <= 0) {
            const dmg = damage * 0.5 * (1 - playerDist / 80);
            this.takeDamage(dmg);
        }
    }

    killEnemy(enemy) {
        this.bloodEmitter.emitParticleAt(enemy.x, enemy.y, 20);

        // Explosive enemies explode on death
        if (enemy.explosive) {
            this.createExplosion(enemy.x, enemy.y, enemy.damage);
        }

        // Drop loot
        if (Math.random() < 0.4) {
            let item = this.items.create(enemy.x, enemy.y, 'credit');
            item.itemType = 'credit';
            item.value = enemy.value;
        }
        if (Math.random() < 0.2) {
            let item = this.items.create(enemy.x, enemy.y, 'health');
            item.itemType = 'health';
            item.value = 20;
        }
        if (Math.random() < 0.15) {
            let item = this.items.create(enemy.x, enemy.y, 'ammo');
            item.itemType = 'ammo';
        }

        GameData.currentRun.score += enemy.value;
        GameData.currentRun.kills++;
        GameData.totalKills++;

        if (enemy.boss) {
            GameData.bossKilled = true;
            this.showMessage('BOSS DEFEATED!');
        }

        enemy.destroy();
    }

    enemyBulletHitPlayer(player, bullet) {
        if (this.invincibleTimer > 0) {
            bullet.destroy();
            return;
        }
        this.takeDamage(bullet.damage);
        bullet.destroy();
    }

    playerTouchEnemy(player, enemy) {
        if (this.invincibleTimer > 0) return;
        if (!enemy.lastTouch || Date.now() - enemy.lastTouch > enemy.attackCooldown) {
            this.takeDamage(enemy.damage);
            enemy.lastTouch = Date.now();
        }
    }

    takeDamage(amount) {
        this.deckDamageTaken = true;

        if (GameData.currentRun.shield > 0) {
            let shieldDamage = Math.min(GameData.currentRun.shield, amount);
            GameData.currentRun.shield -= shieldDamage;
            amount -= shieldDamage;
        }
        GameData.currentRun.hp -= amount;
        this.invincibleTimer = 500;

        if (GameData.settings.screenShake) {
            this.cameras.main.shake(100, 0.01);
        }
        this.cameras.main.flash(100, 255, 0, 0, 0.3);
    }

    collectItem(player, item) {
        const maxHp = 100 + GameData.upgrades.maxHp * 20;
        const maxShield = 25 + GameData.upgrades.maxShield * 10;

        if (item.itemType === 'health') {
            GameData.currentRun.hp = Math.min(maxHp, GameData.currentRun.hp + item.value);
            this.showMessage('+' + item.value + ' HP');
        } else if (item.itemType === 'shield') {
            GameData.currentRun.shield = Math.min(maxShield, GameData.currentRun.shield + item.value);
            this.showMessage('+' + item.value + ' SHIELD');
        } else if (item.itemType === 'ammo') {
            const weapon = WEAPONS[GameData.currentRun.weapon];
            if (!weapon.infinite) {
                GameData.currentRun.ammo[weapon.ammoType] += 40;
                this.showMessage('+40 ' + weapon.ammoType.toUpperCase());
            }
        } else if (item.itemType === 'credit') {
            GameData.currentRun.score += item.value;
            GameData.credits += item.value;
            this.showMessage('+$' + item.value);
        } else if (item.itemType === 'keycard') {
            GameData.currentRun.keycards[item.keycardColor] = true;
            this.showMessage(item.keycardColor.toUpperCase() + ' KEYCARD ACQUIRED!');
            const colors = { green: 0x00ff00, blue: 0x0088ff, yellow: 0xffff00, red: 0xff0000 };
            this.keycardIcons[item.keycardColor].setFillStyle(colors[item.keycardColor]);
        }
        item.destroy();
    }

    checkDoor(player, door) {
        if (door.doorType === 'escape') {
            this.victory();
            return;
        }

        if (door.doorType === 'boss') {
            this.generateDeck(door.nextDeck);
            return;
        }

        const required = door.doorType;
        const kc = GameData.currentRun.keycards;
        const hasAccess = kc[required] ||
            (required === 'green' && (kc.blue || kc.yellow || kc.red)) ||
            (required === 'blue' && (kc.yellow || kc.red)) ||
            (required === 'yellow' && kc.red);

        if (hasAccess) {
            // Check for no-damage achievement
            if (!this.deckDamageTaken) {
                GameData.currentRun.noDamageDeck = true;
            }
            this.generateDeck(door.nextDeck);
        } else {
            this.showMessage('NEED ' + required.toUpperCase() + ' KEYCARD');
        }
    }

    updateUI() {
        const maxHp = 100 + GameData.upgrades.maxHp * 20;
        const maxShield = 25 + GameData.upgrades.maxShield * 10;

        this.healthBar.width = (GameData.currentRun.hp / maxHp) * 200;
        this.healthBar.setFillStyle(GameData.currentRun.hp < 30 ? 0xff2222 : 0xff4444);
        this.healthText.setText(Math.floor(GameData.currentRun.hp) + '/' + maxHp);

        this.shieldBar.width = maxShield > 0 ? (GameData.currentRun.shield / maxShield) * 150 : 0;

        const weapon = WEAPONS[GameData.currentRun.weapon];
        this.weaponText.setText(weapon.name);
        this.weaponText.setColor('#' + weapon.color.toString(16).padStart(6, '0'));

        if (weapon.infinite) {
            this.ammoText.setText(GameData.currentRun.magazine[GameData.currentRun.weapon] + '/' + weapon.magSize + ' | INF');
        } else {
            this.ammoText.setText(GameData.currentRun.magazine[GameData.currentRun.weapon] + '/' + weapon.magSize + ' | ' + GameData.currentRun.ammo[weapon.ammoType]);
        }

        this.scoreText.setText('SCORE: ' + GameData.currentRun.score);
        this.creditText.setText('$ ' + GameData.credits);
        this.killText.setText('KILLS: ' + GameData.currentRun.kills);
    }

    showMessage(msg) {
        this.messageText.setText(msg);
        this.messageTimer = 2000;
    }

    gameOver(reason) {
        this.gameState = 'gameover';

        // Update high score
        if (GameData.currentRun.score > GameData.highScore) {
            GameData.highScore = GameData.currentRun.score;
        }

        // Check achievements
        this.checkAchievements();
        GameData.save();

        this.add.rectangle(400, 300, 400, 300, 0x000000, 0.8).setDepth(300);
        this.add.text(400, 200, 'GAME OVER', {
            fontSize: '36px', fontFamily: 'Orbitron', color: '#ff3322'
        }).setOrigin(0.5).setDepth(301);
        this.add.text(400, 250, reason, {
            fontSize: '20px', fontFamily: 'Share Tech Mono', color: '#fff'
        }).setOrigin(0.5).setDepth(301);
        this.add.text(400, 300, 'Score: ' + GameData.currentRun.score, {
            fontSize: '18px', fontFamily: 'Share Tech Mono', color: '#ffdd00'
        }).setOrigin(0.5).setDepth(301);
        this.add.text(400, 330, 'Kills: ' + GameData.currentRun.kills, {
            fontSize: '16px', fontFamily: 'Share Tech Mono', color: '#ff4444'
        }).setOrigin(0.5).setDepth(301);

        const menuBtn = this.add.text(400, 400, 'RETURN TO MENU', {
            fontSize: '18px', fontFamily: 'Orbitron', color: '#fff', backgroundColor: '#333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(301).setInteractive();
        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }

    victory() {
        this.gameState = 'win';
        this.selfDestructActive = false;

        GameData.gamesWon++;
        GameData.currentRun.won = true;

        if (GameData.currentRun.score > GameData.highScore) {
            GameData.highScore = GameData.currentRun.score;
        }

        // Bonus credits for winning
        const bonus = 500;
        GameData.credits += bonus;
        GameData.currentRun.score += bonus;

        this.checkAchievements();
        GameData.save();

        this.add.rectangle(400, 300, 400, 350, 0x000000, 0.8).setDepth(300);
        this.add.text(400, 180, 'ESCAPED!', {
            fontSize: '36px', fontFamily: 'Orbitron', color: '#44ff44'
        }).setOrigin(0.5).setDepth(301);
        this.add.text(400, 230, 'You survived Station Breach!', {
            fontSize: '16px', fontFamily: 'Share Tech Mono', color: '#fff'
        }).setOrigin(0.5).setDepth(301);
        this.add.text(400, 280, 'Score: ' + GameData.currentRun.score, {
            fontSize: '20px', fontFamily: 'Share Tech Mono', color: '#ffdd00'
        }).setOrigin(0.5).setDepth(301);
        this.add.text(400, 310, 'Kills: ' + GameData.currentRun.kills, {
            fontSize: '16px', fontFamily: 'Share Tech Mono', color: '#ff4444'
        }).setOrigin(0.5).setDepth(301);
        this.add.text(400, 340, 'Time: ' + Math.floor(this.runTime / 60) + ':' + Math.floor(this.runTime % 60).toString().padStart(2, '0'), {
            fontSize: '16px', fontFamily: 'Share Tech Mono', color: '#4488ff'
        }).setOrigin(0.5).setDepth(301);
        this.add.text(400, 370, 'Escape Bonus: +$' + bonus, {
            fontSize: '14px', fontFamily: 'Share Tech Mono', color: '#44ff44'
        }).setOrigin(0.5).setDepth(301);

        const menuBtn = this.add.text(400, 430, 'RETURN TO MENU', {
            fontSize: '18px', fontFamily: 'Orbitron', color: '#fff', backgroundColor: '#333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(301).setInteractive();
        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }

    checkAchievements() {
        Object.entries(ACHIEVEMENTS).forEach(([key, ach]) => {
            if (!GameData.achievements[key] && ach.condition(GameData, GameData.currentRun)) {
                GameData.achievements[key] = true;
                this.showMessage('ACHIEVEMENT: ' + ach.name);
            }
        });
    }
}

// ============= PAUSE SCENE =============
class PauseScene extends Phaser.Scene {
    constructor() { super('PauseScene'); }

    create() {
        this.add.rectangle(400, 300, 300, 250, 0x000000, 0.9);
        this.add.text(400, 200, 'PAUSED', {
            fontSize: '32px', fontFamily: 'Orbitron', color: '#fff'
        }).setOrigin(0.5);

        const resumeBtn = this.add.text(400, 280, 'RESUME', {
            fontSize: '20px', fontFamily: 'Orbitron', color: '#44ff44', backgroundColor: '#333', padding: { x: 30, y: 10 }
        }).setOrigin(0.5).setInteractive();
        resumeBtn.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('GameScene');
        });

        const quitBtn = this.add.text(400, 350, 'QUIT TO MENU', {
            fontSize: '16px', fontFamily: 'Orbitron', color: '#ff4444', backgroundColor: '#333', padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive();
        quitBtn.on('pointerdown', () => {
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });
    }
}

// ============= SETTINGS SCENE =============
class SettingsScene extends Phaser.Scene {
    constructor() { super('SettingsScene'); }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x0a0a12);
        this.add.text(400, 80, 'SETTINGS', {
            fontSize: '36px', fontFamily: 'Orbitron', color: '#fff'
        }).setOrigin(0.5);

        // Screen Shake toggle
        this.add.text(250, 180, 'Screen Shake:', {
            fontSize: '18px', fontFamily: 'Share Tech Mono', color: '#fff'
        });
        const shakeBtn = this.add.text(500, 180, GameData.settings.screenShake ? 'ON' : 'OFF', {
            fontSize: '18px', fontFamily: 'Orbitron', color: GameData.settings.screenShake ? '#44ff44' : '#ff4444',
            backgroundColor: '#333', padding: { x: 20, y: 5 }
        }).setInteractive();
        shakeBtn.on('pointerdown', () => {
            GameData.settings.screenShake = !GameData.settings.screenShake;
            shakeBtn.setText(GameData.settings.screenShake ? 'ON' : 'OFF');
            shakeBtn.setColor(GameData.settings.screenShake ? '#44ff44' : '#ff4444');
            GameData.save();
        });

        // Damage Numbers toggle
        this.add.text(250, 240, 'Damage Numbers:', {
            fontSize: '18px', fontFamily: 'Share Tech Mono', color: '#fff'
        });
        const dmgBtn = this.add.text(500, 240, GameData.settings.showDamageNumbers ? 'ON' : 'OFF', {
            fontSize: '18px', fontFamily: 'Orbitron', color: GameData.settings.showDamageNumbers ? '#44ff44' : '#ff4444',
            backgroundColor: '#333', padding: { x: 20, y: 5 }
        }).setInteractive();
        dmgBtn.on('pointerdown', () => {
            GameData.settings.showDamageNumbers = !GameData.settings.showDamageNumbers;
            dmgBtn.setText(GameData.settings.showDamageNumbers ? 'ON' : 'OFF');
            dmgBtn.setColor(GameData.settings.showDamageNumbers ? '#44ff44' : '#ff4444');
            GameData.save();
        });

        // Reset Progress button
        const resetBtn = this.add.text(400, 400, 'RESET ALL PROGRESS', {
            fontSize: '16px', fontFamily: 'Orbitron', color: '#ff4444', backgroundColor: '#331111', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        resetBtn.on('pointerdown', () => {
            localStorage.removeItem('stationBreach_save');
            location.reload();
        });

        // Back button
        const backBtn = this.add.text(400, 500, 'BACK', {
            fontSize: '20px', fontFamily: 'Orbitron', color: '#fff', backgroundColor: '#333', padding: { x: 40, y: 10 }
        }).setOrigin(0.5).setInteractive();
        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// ============= UPGRADE SCENE =============
class UpgradeScene extends Phaser.Scene {
    constructor() { super('UpgradeScene'); }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x0a0a12);
        this.add.text(400, 50, 'UPGRADES', {
            fontSize: '36px', fontFamily: 'Orbitron', color: '#fff'
        }).setOrigin(0.5);

        this.creditsText = this.add.text(400, 90, 'Credits: $' + GameData.credits, {
            fontSize: '18px', fontFamily: 'Share Tech Mono', color: '#ffdd00'
        }).setOrigin(0.5);

        const upgrades = [
            { key: 'maxHp', name: 'Max Health', desc: '+20 HP per level', cost: 200, max: 5 },
            { key: 'maxShield', name: 'Max Shield', desc: '+10 Shield per level', cost: 250, max: 5 },
            { key: 'speed', name: 'Movement Speed', desc: '+10% speed per level', cost: 300, max: 3 },
            { key: 'damage', name: 'Weapon Damage', desc: '+15% damage per level', cost: 350, max: 5 },
            { key: 'reloadSpeed', name: 'Reload Speed', desc: '-10% reload time per level', cost: 250, max: 3 }
        ];

        upgrades.forEach((upg, i) => {
            const y = 150 + i * 60;
            const level = GameData.upgrades[upg.key];
            const cost = upg.cost * (level + 1);

            this.add.text(100, y, upg.name, {
                fontSize: '16px', fontFamily: 'Orbitron', color: '#fff'
            });
            this.add.text(100, y + 20, upg.desc, {
                fontSize: '12px', fontFamily: 'Share Tech Mono', color: '#888'
            });

            // Level indicators
            for (let j = 0; j < upg.max; j++) {
                this.add.rectangle(450 + j * 25, y + 10, 20, 20, level > j ? 0x44ff44 : 0x333333);
            }

            if (level < upg.max) {
                const buyBtn = this.add.text(620, y + 5, '$' + cost, {
                    fontSize: '14px', fontFamily: 'Orbitron',
                    color: GameData.credits >= cost ? '#44ff44' : '#666',
                    backgroundColor: '#333', padding: { x: 15, y: 5 }
                }).setInteractive();

                buyBtn.on('pointerdown', () => {
                    if (GameData.credits >= cost) {
                        GameData.credits -= cost;
                        GameData.upgrades[upg.key]++;
                        GameData.save();
                        this.scene.restart();
                    }
                });
            } else {
                this.add.text(620, y + 5, 'MAX', {
                    fontSize: '14px', fontFamily: 'Orbitron', color: '#ffaa00'
                });
            }
        });

        // Weapon unlocks
        this.add.text(400, 470, 'WEAPON UNLOCKS', {
            fontSize: '20px', fontFamily: 'Orbitron', color: '#ffaa00'
        }).setOrigin(0.5);

        const weaponCosts = { SHOTGUN: 500, SMG: 750, PLASMA: 1000, ROCKET: 1500, LASER: 2000 };
        let wx = 100;
        WEAPONS.forEach((w, i) => {
            if (i === 0) return; // Skip pistol
            const unlocked = GameData.unlockedWeapons.includes(w.name);
            const cost = weaponCosts[w.name];

            const btn = this.add.text(wx, 510, w.name, {
                fontSize: '12px', fontFamily: 'Orbitron',
                color: unlocked ? '#44ff44' : (GameData.credits >= cost ? '#fff' : '#666'),
                backgroundColor: '#333', padding: { x: 10, y: 5 }
            }).setInteractive();

            if (!unlocked) {
                this.add.text(wx + 35, 540, '$' + cost, {
                    fontSize: '10px', fontFamily: 'Share Tech Mono', color: '#ffdd00'
                }).setOrigin(0.5);

                btn.on('pointerdown', () => {
                    if (GameData.credits >= cost) {
                        GameData.credits -= cost;
                        GameData.unlockedWeapons.push(w.name);
                        GameData.save();
                        this.scene.restart();
                    }
                });
            }
            wx += 130;
        });

        // Back button
        const backBtn = this.add.text(400, 570, 'BACK', {
            fontSize: '20px', fontFamily: 'Orbitron', color: '#fff', backgroundColor: '#333', padding: { x: 40, y: 10 }
        }).setOrigin(0.5).setInteractive();
        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// ============= ACHIEVEMENTS SCENE =============
class AchievementsScene extends Phaser.Scene {
    constructor() { super('AchievementsScene'); }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x0a0a12);
        this.add.text(400, 50, 'ACHIEVEMENTS', {
            fontSize: '36px', fontFamily: 'Orbitron', color: '#fff'
        }).setOrigin(0.5);

        const unlocked = Object.keys(GameData.achievements).length;
        const total = Object.keys(ACHIEVEMENTS).length;
        this.add.text(400, 90, unlocked + '/' + total + ' Unlocked', {
            fontSize: '16px', fontFamily: 'Share Tech Mono', color: '#ffdd00'
        }).setOrigin(0.5);

        let y = 130;
        Object.entries(ACHIEVEMENTS).forEach(([key, ach]) => {
            const earned = GameData.achievements[key];
            this.add.rectangle(400, y + 15, 500, 45, earned ? 0x224422 : 0x222222).setOrigin(0.5);
            this.add.text(170, y, ach.name, {
                fontSize: '16px', fontFamily: 'Orbitron', color: earned ? '#44ff44' : '#666'
            });
            this.add.text(170, y + 22, ach.desc, {
                fontSize: '12px', fontFamily: 'Share Tech Mono', color: earned ? '#88aa88' : '#444'
            });
            if (earned) {
                this.add.text(620, y + 10, '✓', {
                    fontSize: '24px', color: '#44ff44'
                });
            }
            y += 50;
        });

        // Back button
        const backBtn = this.add.text(400, 560, 'BACK', {
            fontSize: '20px', fontFamily: 'Orbitron', color: '#fff', backgroundColor: '#333', padding: { x: 40, y: 10 }
        }).setOrigin(0.5).setInteractive();
        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// ============= TUTORIAL SCENE =============
class TutorialScene extends Phaser.Scene {
    constructor() { super('TutorialScene'); }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x0a0a12);
        this.add.text(400, 50, 'HOW TO PLAY', {
            fontSize: '36px', fontFamily: 'Orbitron', color: '#fff'
        }).setOrigin(0.5);

        const instructions = [
            { title: 'MOVEMENT', text: '[WASD] Move your marine' },
            { title: 'SHOOTING', text: '[Mouse] Aim and Left-Click to shoot' },
            { title: 'RELOAD', text: '[R] Reload your weapon' },
            { title: 'SWITCH WEAPON', text: '[Q] Cycle through unlocked weapons' },
            { title: 'SPRINT', text: '[Shift] Hold to run faster' },
            { title: 'PAUSE', text: '[ESC] Pause the game' },
            { title: '', text: '' },
            { title: 'OBJECTIVE', text: 'Clear 6 decks and escape before the station explodes!' },
            { title: 'KEYCARDS', text: 'Find colored keycards to unlock doors to new decks' },
            { title: 'UPGRADES', text: 'Earn credits to buy permanent upgrades and new weapons' }
        ];

        instructions.forEach((inst, i) => {
            const y = 110 + i * 42;
            if (inst.title) {
                this.add.text(150, y, inst.title + ':', {
                    fontSize: '14px', fontFamily: 'Orbitron', color: '#ffaa00'
                });
            }
            this.add.text(320, y, inst.text, {
                fontSize: '14px', fontFamily: 'Share Tech Mono', color: '#fff'
            });
        });

        // Back button
        const backBtn = this.add.text(400, 550, 'BACK', {
            fontSize: '20px', fontFamily: 'Orbitron', color: '#fff', backgroundColor: '#333', padding: { x: 40, y: 10 }
        }).setOrigin(0.5).setInteractive();
        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// ============= GAME INITIALIZATION =============
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#080810',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [BootScene, MenuScene, GameScene, PauseScene, SettingsScene, UpgradeScene, AchievementsScene, TutorialScene]
};

const game = new Phaser.Game(config);
