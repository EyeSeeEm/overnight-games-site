// Extraction Protocol - Top-down extraction shooter
// Inspired by Zero Sievert (2022)

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Player sprite (top-down)
        g.fillStyle(0x4488aa);
        g.fillCircle(16, 16, 12);
        g.fillStyle(0x336688);
        g.fillRect(14, 4, 4, 14); // Gun pointing up
        g.fillStyle(0xffcc99);
        g.fillCircle(16, 16, 6); // Face
        g.generateTexture('player', 32, 32);
        g.clear();

        // Ground tile
        g.fillStyle(0x3a4a2a);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x445533);
        g.fillRect(4, 8, 3, 3);
        g.fillRect(20, 16, 4, 4);
        g.fillRect(10, 24, 2, 2);
        g.generateTexture('ground', 32, 32);
        g.clear();

        // Forest tile
        g.fillStyle(0x2a3a1a);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x1a5a1a);
        g.fillCircle(16, 16, 14);
        g.fillStyle(0x2a6a2a);
        g.fillCircle(10, 12, 6);
        g.fillCircle(22, 14, 5);
        g.fillCircle(14, 22, 7);
        g.generateTexture('forest', 32, 32);
        g.clear();

        // Building wall
        g.fillStyle(0x555544);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x444433);
        g.fillRect(2, 2, 28, 28);
        g.generateTexture('wall', 32, 32);
        g.clear();

        // Building interior floor
        g.fillStyle(0x665544);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, 0x554433);
        g.strokeRect(0, 0, 32, 32);
        g.generateTexture('floor', 32, 32);
        g.clear();

        // Door
        g.fillStyle(0x885533);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0xaa6644);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0xffcc00);
        g.fillCircle(24, 16, 3);
        g.generateTexture('door', 32, 32);
        g.clear();

        // Extraction zone
        g.fillStyle(0x00ff00, 0.3);
        g.fillCircle(32, 32, 30);
        g.lineStyle(2, 0x00ff00);
        g.strokeCircle(32, 32, 30);
        g.generateTexture('extraction', 64, 64);
        g.clear();

        // Loot crate
        g.fillStyle(0x886633);
        g.fillRect(0, 0, 24, 24);
        g.fillStyle(0xaa8844);
        g.fillRect(2, 2, 20, 20);
        g.fillStyle(0x666633);
        g.fillRect(10, 0, 4, 24);
        g.generateTexture('crate', 24, 24);
        g.clear();

        // Medical box (red cross)
        g.fillStyle(0xffffff);
        g.fillRect(0, 0, 24, 24);
        g.fillStyle(0xff0000);
        g.fillRect(10, 4, 4, 16);
        g.fillRect(4, 10, 16, 4);
        g.generateTexture('medbox', 24, 24);
        g.clear();

        // Wolf enemy
        g.fillStyle(0x666666);
        g.fillEllipse(16, 16, 20, 12);
        g.fillStyle(0x555555);
        g.fillTriangle(28, 16, 32, 10, 32, 22);  // Head
        g.fillStyle(0xff3333);
        g.fillCircle(30, 14, 2);  // Eye
        g.generateTexture('wolf', 32, 32);
        g.clear();

        // Boar enemy
        g.fillStyle(0x664422);
        g.fillEllipse(16, 16, 24, 14);
        g.fillStyle(0x553311);
        g.fillRect(26, 10, 6, 12);  // Snout
        g.fillStyle(0xffccaa);
        g.fillRect(30, 12, 2, 3);  // Tusk
        g.fillRect(30, 17, 2, 3);
        g.generateTexture('boar', 32, 32);
        g.clear();

        // Bandit (melee)
        g.fillStyle(0x664444);
        g.fillCircle(16, 16, 10);
        g.fillStyle(0xffcc99);
        g.fillCircle(16, 14, 5);  // Face
        g.fillStyle(0x888888);
        g.fillRect(22, 12, 8, 4);  // Knife
        g.generateTexture('bandit_melee', 32, 32);
        g.clear();

        // Bandit (pistol)
        g.fillStyle(0x446644);
        g.fillCircle(16, 16, 10);
        g.fillStyle(0xffcc99);
        g.fillCircle(16, 14, 5);
        g.fillStyle(0x333333);
        g.fillRect(22, 14, 6, 3);  // Pistol
        g.generateTexture('bandit_pistol', 32, 32);
        g.clear();

        // Bandit (rifle)
        g.fillStyle(0x444466);
        g.fillCircle(16, 16, 10);
        g.fillStyle(0xffcc99);
        g.fillCircle(16, 14, 5);
        g.fillStyle(0x333333);
        g.fillRect(20, 13, 12, 4);  // Rifle
        g.generateTexture('bandit_rifle', 32, 32);
        g.clear();

        // Bullet
        g.fillStyle(0xffff00);
        g.fillCircle(3, 3, 3);
        g.generateTexture('bullet', 6, 6);
        g.clear();

        // Shotgun pellet
        g.fillStyle(0xffaa00);
        g.fillCircle(2, 2, 2);
        g.generateTexture('pellet', 4, 4);
        g.clear();

        // Muzzle flash
        g.fillStyle(0xffff88);
        g.fillCircle(8, 8, 8);
        g.fillStyle(0xffffff);
        g.fillCircle(8, 8, 4);
        g.generateTexture('muzzle', 16, 16);
        g.clear();

        // Blood splatter
        g.fillStyle(0xaa0000);
        g.fillCircle(6, 6, 5);
        g.fillCircle(10, 8, 3);
        g.fillCircle(4, 10, 4);
        g.generateTexture('blood', 16, 16);
        g.clear();

        // Vision cone (will be drawn dynamically)
        g.fillStyle(0xffffff, 0.1);
        g.slice(0, 0, 150, Phaser.Math.DegToRad(-45), Phaser.Math.DegToRad(45), true);
        g.fillPath();
        g.generateTexture('vision_cone', 300, 300);
        g.clear();

        // Fog of war tile
        g.fillStyle(0x000000);
        g.fillRect(0, 0, 32, 32);
        g.generateTexture('fog', 32, 32);
        g.clear();

        // Crosshair
        g.lineStyle(2, 0xff0000);
        g.strokeCircle(8, 8, 6);
        g.lineBetween(8, 0, 8, 4);
        g.lineBetween(8, 12, 8, 16);
        g.lineBetween(0, 8, 4, 8);
        g.lineBetween(12, 8, 16, 8);
        g.generateTexture('crosshair', 16, 16);
        g.clear();

        // Item icons
        // Pistol
        g.fillStyle(0x333333);
        g.fillRect(4, 10, 16, 8);
        g.fillRect(8, 8, 6, 4);
        g.generateTexture('item_pistol', 24, 24);
        g.clear();

        // SMG
        g.fillStyle(0x333333);
        g.fillRect(2, 10, 20, 6);
        g.fillRect(6, 8, 8, 4);
        g.fillRect(14, 14, 4, 6);
        g.generateTexture('item_smg', 24, 24);
        g.clear();

        // Shotgun
        g.fillStyle(0x885533);
        g.fillRect(2, 11, 20, 4);
        g.fillStyle(0x333333);
        g.fillRect(0, 10, 6, 6);
        g.generateTexture('item_shotgun', 24, 24);
        g.clear();

        // Rifle
        g.fillStyle(0x885533);
        g.fillRect(4, 11, 16, 4);
        g.fillStyle(0x333333);
        g.fillRect(0, 10, 8, 6);
        g.fillRect(18, 8, 6, 8);
        g.generateTexture('item_rifle', 24, 24);
        g.clear();

        // Bandage
        g.fillStyle(0xffffff);
        g.fillRect(4, 8, 16, 8);
        g.fillStyle(0xff0000);
        g.fillRect(10, 8, 4, 8);
        g.generateTexture('item_bandage', 24, 24);
        g.clear();

        // Medkit
        g.fillStyle(0xffffff);
        g.fillRect(2, 4, 20, 16);
        g.fillStyle(0xff0000);
        g.fillRect(10, 6, 4, 12);
        g.fillRect(6, 10, 12, 4);
        g.generateTexture('item_medkit', 24, 24);
        g.clear();

        // Rubles (money)
        g.fillStyle(0x88aa44);
        g.fillRect(4, 4, 16, 16);
        g.fillStyle(0xaacc66);
        g.fillRect(6, 6, 12, 12);
        g.fillStyle(0x88aa44);
        g.fillRect(10, 8, 4, 8);
        g.generateTexture('item_rubles', 24, 24);
        g.clear();

        g.destroy();

        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const cx = 400, cy = 300;

        this.add.rectangle(cx, cy, 800, 600, 0x1a1a0a);

        this.add.text(cx, 100, 'EXTRACTION PROTOCOL', {
            fontSize: '42px',
            fill: '#88aa44',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(cx, 160, 'A Zero Sievert Demake', {
            fontSize: '18px',
            fill: '#666666',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        const instructions = [
            'MISSION BRIEFING:',
            '',
            'Enter the Forest zone. Loot supplies.',
            'Reach the extraction point to escape.',
            'Death means losing everything.',
            '',
            'CONTROLS:',
            'WASD - Move',
            'Mouse - Aim (90° vision cone)',
            'LMB - Fire weapon',
            'E - Loot / Enter building',
            'R - Reload',
            '1-4 - Switch weapon',
            '',
            'Enemies outside your vision cone are HIDDEN.',
            'Approach from behind for stealth kills.'
        ];

        instructions.forEach((line, i) => {
            const color = line === 'MISSION BRIEFING:' || line === 'CONTROLS:' ? '#88aa44' : '#aaaaaa';
            this.add.text(cx, 210 + i * 18, line, {
                fontSize: '13px',
                fill: color,
                fontFamily: 'monospace'
            }).setOrigin(0.5);
        });

        const btn = this.add.rectangle(cx, 530, 200, 50, 0x446622)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => btn.setFillStyle(0x558833))
            .on('pointerout', () => btn.setFillStyle(0x446622))
            .on('pointerdown', () => this.scene.start('GameScene'));

        this.add.text(cx, 530, 'BEGIN RAID', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.TILE = 32;
        this.MAP_WIDTH = 50;
        this.MAP_HEIGHT = 50;

        // Player state
        this.player = {
            x: 3,
            y: 47,
            hp: 100,
            maxHp: 100,
            angle: 0,
            bleeding: false,
            bleedTimer: 0,
            weapons: [
                { name: 'PM Pistol', damage: 18, rpm: 300, mag: 8, maxMag: 8, ammo: 32, spread: 8, type: 'pistol' }
            ],
            currentWeapon: 0,
            inventory: [],
            rubles: 0,
            kills: 0
        };

        // Camera setup
        this.cameras.main.setBounds(0, 0, this.MAP_WIDTH * this.TILE, this.MAP_HEIGHT * this.TILE);

        // Create world
        this.createMap();
        this.createPlayer();
        this.createEnemies();
        this.createLoot();
        this.createExtraction();
        this.createFogOfWar();

        // Create groups
        this.bullets = this.add.group();
        this.enemyBullets = this.add.group();

        // UI
        this.createUI();

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            reload: Phaser.Input.Keyboard.KeyCodes.R,
            interact: Phaser.Input.Keyboard.KeyCodes.E,
            weapon1: Phaser.Input.Keyboard.KeyCodes.ONE,
            weapon2: Phaser.Input.Keyboard.KeyCodes.TWO,
            weapon3: Phaser.Input.Keyboard.KeyCodes.THREE,
            weapon4: Phaser.Input.Keyboard.KeyCodes.FOUR
        });

        this.input.on('pointerdown', () => this.fireWeapon());

        // Custom crosshair
        this.crosshair = this.add.image(0, 0, 'crosshair').setDepth(1000).setScrollFactor(0);
        this.input.setDefaultCursor('none');

        // Fire rate timer
        this.lastFired = 0;

        // Message system
        this.messageText = this.add.text(400, 200, '', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(500).setVisible(false);
    }

    createMap() {
        this.map = [];
        this.tileSprites = [];

        // 0 = ground, 1 = forest (cover), 2 = wall, 3 = floor (interior), 4 = door
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            this.map[y] = [];
            this.tileSprites[y] = [];
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                // Default ground with scattered forest
                if (Math.random() < 0.15) {
                    this.map[y][x] = 1; // Forest
                } else {
                    this.map[y][x] = 0; // Ground
                }
            }
        }

        // Create buildings
        this.createBuilding(10, 10, 6, 5);
        this.createBuilding(30, 15, 8, 6);
        this.createBuilding(20, 35, 5, 5);
        this.createBuilding(40, 40, 7, 6);
        this.createBuilding(5, 25, 5, 4);

        // Clear spawn area
        for (let y = 45; y < 50; y++) {
            for (let x = 0; x < 8; x++) {
                this.map[y][x] = 0;
            }
        }

        // Render tiles
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                let texture = 'ground';
                const tile = this.map[y][x];
                if (tile === 1) texture = 'forest';
                else if (tile === 2) texture = 'wall';
                else if (tile === 3) texture = 'floor';
                else if (tile === 4) texture = 'door';

                const sprite = this.add.image(x * this.TILE + this.TILE/2, y * this.TILE + this.TILE/2, texture);
                this.tileSprites[y][x] = sprite;
            }
        }
    }

    createBuilding(bx, by, width, height) {
        // Create walls
        for (let y = by; y < by + height; y++) {
            for (let x = bx; x < bx + width; x++) {
                if (y === by || y === by + height - 1 || x === bx || x === bx + width - 1) {
                    this.map[y][x] = 2; // Wall
                } else {
                    this.map[y][x] = 3; // Floor
                }
            }
        }

        // Add door on south side
        const doorX = bx + Math.floor(width / 2);
        this.map[by + height - 1][doorX] = 4;
    }

    createPlayer() {
        this.playerSprite = this.add.container(
            this.player.x * this.TILE + this.TILE/2,
            this.player.y * this.TILE + this.TILE/2
        ).setDepth(100);

        const body = this.add.image(0, 0, 'player');
        this.playerSprite.add(body);

        // Vision cone visualization
        this.visionGraphics = this.add.graphics().setDepth(50);

        this.cameras.main.startFollow(this.playerSprite);
    }

    createEnemies() {
        this.enemies = [];

        const enemySpawns = [
            // Wolves in forest areas
            { x: 15, y: 20, type: 'wolf' },
            { x: 25, y: 25, type: 'wolf' },
            { x: 35, y: 30, type: 'wolf' },
            { x: 8, y: 35, type: 'wolf' },
            // Boars
            { x: 20, y: 15, type: 'boar' },
            { x: 40, y: 25, type: 'boar' },
            { x: 12, y: 40, type: 'boar' },
            // Bandits in/near buildings
            { x: 12, y: 12, type: 'bandit_melee' },
            { x: 32, y: 17, type: 'bandit_pistol' },
            { x: 34, y: 18, type: 'bandit_rifle' },
            { x: 22, y: 37, type: 'bandit_melee' },
            { x: 42, y: 42, type: 'bandit_pistol' },
            { x: 44, y: 43, type: 'bandit_rifle' },
            { x: 6, y: 26, type: 'bandit_melee' },
            // Extra patrols
            { x: 28, y: 8, type: 'bandit_pistol' },
            { x: 45, y: 10, type: 'wolf' }
        ];

        const enemyStats = {
            wolf: { hp: 40, damage: 15, speed: 120, range: 30, type: 'melee', loot: 50 },
            boar: { hp: 80, damage: 20, speed: 80, range: 40, type: 'charge', loot: 80 },
            bandit_melee: { hp: 60, damage: 12, speed: 60, range: 35, type: 'melee', loot: 100 },
            bandit_pistol: { hp: 60, damage: 15, speed: 50, range: 200, type: 'ranged', loot: 150 },
            bandit_rifle: { hp: 50, damage: 25, speed: 40, range: 300, type: 'ranged', loot: 200 }
        };

        enemySpawns.forEach(spawn => {
            const stats = enemyStats[spawn.type];
            const enemy = {
                x: spawn.x,
                y: spawn.y,
                type: spawn.type,
                hp: stats.hp,
                maxHp: stats.hp,
                damage: stats.damage,
                speed: stats.speed,
                range: stats.range,
                attackType: stats.type,
                loot: stats.loot,
                angle: Math.random() * Math.PI * 2,
                alive: true,
                visible: false,
                alerted: false,
                lastShot: 0,
                sprite: null
            };

            enemy.sprite = this.add.image(
                spawn.x * this.TILE + this.TILE/2,
                spawn.y * this.TILE + this.TILE/2,
                spawn.type
            ).setDepth(90).setVisible(false);

            this.enemies.push(enemy);
        });
    }

    createLoot() {
        this.lootContainers = [];

        // Loot spawns - more healing than weapons (2:1 ratio)
        const lootSpawns = [
            // Near buildings - mixed loot
            { x: 11, y: 11, type: 'crate' },
            { x: 14, y: 13, type: 'medbox' },
            { x: 31, y: 16, type: 'crate' },
            { x: 35, y: 19, type: 'medbox' },
            { x: 21, y: 36, type: 'medbox' },
            { x: 23, y: 38, type: 'crate' },
            { x: 41, y: 41, type: 'medbox' },
            { x: 45, y: 44, type: 'crate' },
            { x: 6, y: 27, type: 'medbox' },
            { x: 8, y: 26, type: 'medbox' },
            // Scattered in the world
            { x: 18, y: 5, type: 'medbox' },
            { x: 38, y: 8, type: 'crate' },
            { x: 5, y: 15, type: 'medbox' },
            { x: 45, y: 30, type: 'medbox' },
            { x: 25, y: 45, type: 'crate' },
            { x: 10, y: 45, type: 'medbox' }
        ];

        const weaponLoot = [
            { name: 'Skorpion', damage: 14, rpm: 600, mag: 20, maxMag: 20, ammo: 60, spread: 12, type: 'smg' },
            { name: 'Pump Shotgun', damage: 64, rpm: 60, mag: 6, maxMag: 6, ammo: 18, spread: 25, type: 'shotgun', pellets: 8 },
            { name: 'AK-74', damage: 28, rpm: 450, mag: 30, maxMag: 30, ammo: 60, spread: 6, type: 'rifle' }
        ];

        const healingLoot = [
            { name: 'Bandage', heal: 20, stopBleed: true, icon: 'item_bandage' },
            { name: 'Medkit', heal: 50, stopBleed: true, icon: 'item_medkit' }
        ];

        lootSpawns.forEach(spawn => {
            const container = {
                x: spawn.x,
                y: spawn.y,
                type: spawn.type,
                looted: false,
                contents: [],
                sprite: null
            };

            // Generate loot
            if (spawn.type === 'medbox') {
                // Medical box - healing items
                const item = healingLoot[Math.floor(Math.random() * healingLoot.length)];
                container.contents.push({ ...item });
                if (Math.random() < 0.5) {
                    container.contents.push({ ...healingLoot[0] }); // Extra bandage
                }
                container.contents.push({ name: 'Rubles', value: 100 + Math.floor(Math.random() * 200) });
            } else {
                // Crate - weapons/supplies
                if (Math.random() < 0.4) {
                    const weapon = weaponLoot[Math.floor(Math.random() * weaponLoot.length)];
                    container.contents.push({ ...weapon });
                } else {
                    // Healing instead
                    container.contents.push({ ...healingLoot[Math.floor(Math.random() * healingLoot.length)] });
                }
                container.contents.push({ name: 'Rubles', value: 200 + Math.floor(Math.random() * 300) });
            }

            container.sprite = this.add.image(
                spawn.x * this.TILE + this.TILE/2,
                spawn.y * this.TILE + this.TILE/2,
                spawn.type
            ).setDepth(80);

            this.lootContainers.push(container);
        });
    }

    createExtraction() {
        // Extraction point in the north
        this.extraction = {
            x: 25,
            y: 3,
            radius: 2
        };

        this.extractionSprite = this.add.image(
            this.extraction.x * this.TILE + this.TILE/2,
            this.extraction.y * this.TILE + this.TILE/2,
            'extraction'
        ).setDepth(5);

        // Pulsing animation
        this.tweens.add({
            targets: this.extractionSprite,
            alpha: { from: 0.5, to: 1 },
            scale: { from: 1, to: 1.1 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // Extraction marker text
        this.add.text(
            this.extraction.x * this.TILE + this.TILE/2,
            this.extraction.y * this.TILE - 20,
            'EXTRACT',
            { fontSize: '12px', fill: '#00ff00', fontFamily: 'monospace' }
        ).setOrigin(0.5).setDepth(6);
    }

    createFogOfWar() {
        this.fogTiles = [];
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            this.fogTiles[y] = [];
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                const fog = this.add.image(
                    x * this.TILE + this.TILE/2,
                    y * this.TILE + this.TILE/2,
                    'fog'
                ).setDepth(200).setAlpha(0.8);
                this.fogTiles[y][x] = { sprite: fog, visible: false, explored: false };
            }
        }
    }

    createUI() {
        // HUD background
        this.add.rectangle(400, 30, 800, 60, 0x000000, 0.7).setScrollFactor(0).setDepth(400);

        // Health
        this.healthText = this.add.text(20, 15, '', {
            fontSize: '16px',
            fill: '#ff4444',
            fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(401);

        // Bleeding indicator
        this.bleedText = this.add.text(20, 35, '', {
            fontSize: '14px',
            fill: '#ff0000',
            fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(401);

        // Weapon info
        this.weaponText = this.add.text(200, 15, '', {
            fontSize: '14px',
            fill: '#aaaaaa',
            fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(401);

        // Ammo
        this.ammoText = this.add.text(200, 35, '', {
            fontSize: '14px',
            fill: '#ffaa00',
            fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(401);

        // Extract direction
        this.extractText = this.add.text(500, 15, '', {
            fontSize: '14px',
            fill: '#00ff00',
            fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(401);

        // Loot value
        this.lootText = this.add.text(500, 35, '', {
            fontSize: '14px',
            fill: '#88aa44',
            fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(401);

        // Kills
        this.killsText = this.add.text(700, 15, '', {
            fontSize: '14px',
            fill: '#ff8800',
            fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(401);

        // Interact prompt
        this.interactText = this.add.text(400, 550, '', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(401).setVisible(false);

        this.updateUI();
    }

    updateUI() {
        this.healthText.setText(`HP: ${Math.ceil(this.player.hp)}/${this.player.maxHp}`);

        if (this.player.bleeding) {
            this.bleedText.setText('BLEEDING!').setVisible(true);
        } else {
            this.bleedText.setVisible(false);
        }

        const weapon = this.player.weapons[this.player.currentWeapon];
        if (weapon) {
            this.weaponText.setText(`${weapon.name}`);
            this.ammoText.setText(`${weapon.mag}/${weapon.maxMag} [${weapon.ammo}]`);
        }

        // Extract direction
        const px = this.player.x, py = this.player.y;
        const ex = this.extraction.x, ey = this.extraction.y;
        const dist = Math.sqrt(Math.pow(ex - px, 2) + Math.pow(ey - py, 2));
        const angle = Math.atan2(ey - py, ex - px);
        const dir = this.getDirection(angle);
        this.extractText.setText(`Extract: ${Math.floor(dist * this.TILE)}m ${dir}`);

        this.lootText.setText(`Loot: ${this.player.rubles} RUB`);
        this.killsText.setText(`Kills: ${this.player.kills}`);
    }

    getDirection(angle) {
        const deg = Phaser.Math.RadToDeg(angle);
        if (deg > -22.5 && deg <= 22.5) return 'E';
        if (deg > 22.5 && deg <= 67.5) return 'SE';
        if (deg > 67.5 && deg <= 112.5) return 'S';
        if (deg > 112.5 && deg <= 157.5) return 'SW';
        if (deg > 157.5 || deg <= -157.5) return 'W';
        if (deg > -157.5 && deg <= -112.5) return 'NW';
        if (deg > -112.5 && deg <= -67.5) return 'N';
        return 'NE';
    }

    update(time, delta) {
        this.handleMovement(delta);
        this.handleAiming();
        this.handleInput();
        this.updateVision();
        this.updateEnemies(time, delta);
        this.updateBullets();
        this.updateBleeding(delta);
        this.checkExtraction();
        this.updateUI();

        // Update crosshair position
        this.crosshair.setPosition(this.input.x, this.input.y);
    }

    handleMovement(delta) {
        const speed = 150;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown) vx -= 1;
        if (this.cursors.right.isDown) vx += 1;
        if (this.cursors.up.isDown) vy -= 1;
        if (this.cursors.down.isDown) vy += 1;

        if (vx !== 0 || vy !== 0) {
            const len = Math.sqrt(vx * vx + vy * vy);
            vx /= len;
            vy /= len;

            const newX = this.player.x + vx * speed * delta / 1000 / this.TILE * this.TILE;
            const newY = this.player.y + vy * speed * delta / 1000 / this.TILE * this.TILE;

            // Check collision
            const tileX = Math.floor(newX);
            const tileY = Math.floor(newY);

            if (this.canWalk(tileX, Math.floor(this.player.y))) {
                this.player.x = newX;
            }
            if (this.canWalk(Math.floor(this.player.x), tileY)) {
                this.player.y = newY;
            }

            this.playerSprite.setPosition(
                this.player.x * this.TILE + this.TILE/2,
                this.player.y * this.TILE + this.TILE/2
            );
        }
    }

    canWalk(x, y) {
        if (x < 0 || x >= this.MAP_WIDTH || y < 0 || y >= this.MAP_HEIGHT) return false;
        const tile = this.map[y][x];
        return tile !== 2; // Can't walk through walls
    }

    handleAiming() {
        const worldPoint = this.cameras.main.getWorldPoint(this.input.x, this.input.y);
        const px = this.playerSprite.x;
        const py = this.playerSprite.y;

        this.player.angle = Math.atan2(worldPoint.y - py, worldPoint.x - px);
        this.playerSprite.setRotation(this.player.angle);
    }

    handleInput() {
        // Reload
        if (Phaser.Input.Keyboard.JustDown(this.cursors.reload)) {
            this.reload();
        }

        // Interact
        if (Phaser.Input.Keyboard.JustDown(this.cursors.interact)) {
            this.interact();
        }

        // Weapon switching
        if (Phaser.Input.Keyboard.JustDown(this.cursors.weapon1) && this.player.weapons[0]) {
            this.player.currentWeapon = 0;
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.weapon2) && this.player.weapons[1]) {
            this.player.currentWeapon = 1;
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.weapon3) && this.player.weapons[2]) {
            this.player.currentWeapon = 2;
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.weapon4) && this.player.weapons[3]) {
            this.player.currentWeapon = 3;
        }

        // Check for nearby interactables
        this.checkNearbyInteract();
    }

    checkNearbyInteract() {
        let nearbyLoot = null;
        let nearbyDoor = null;

        // Check loot containers
        this.lootContainers.forEach(container => {
            if (container.looted) return;
            const dist = Math.sqrt(
                Math.pow(container.x - this.player.x, 2) +
                Math.pow(container.y - this.player.y, 2)
            );
            if (dist < 1.5) nearbyLoot = container;
        });

        // Check doors
        const px = Math.floor(this.player.x);
        const py = Math.floor(this.player.y);
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = px + dx;
                const ty = py + dy;
                if (tx >= 0 && tx < this.MAP_WIDTH && ty >= 0 && ty < this.MAP_HEIGHT) {
                    if (this.map[ty][tx] === 4) {
                        nearbyDoor = { x: tx, y: ty };
                    }
                }
            }
        }

        if (nearbyLoot) {
            this.interactText.setText('[E] Loot').setVisible(true);
        } else if (nearbyDoor) {
            this.interactText.setText('[E] Enter').setVisible(true);
        } else {
            this.interactText.setVisible(false);
        }
    }

    interact() {
        // Check loot containers
        for (let container of this.lootContainers) {
            if (container.looted) continue;
            const dist = Math.sqrt(
                Math.pow(container.x - this.player.x, 2) +
                Math.pow(container.y - this.player.y, 2)
            );
            if (dist < 1.5) {
                this.lootContainer(container);
                return;
            }
        }

        // Use healing items from inventory
        for (let i = 0; i < this.player.inventory.length; i++) {
            const item = this.player.inventory[i];
            if (item.heal) {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.heal);
                if (item.stopBleed) this.player.bleeding = false;
                this.showMessage(`Used ${item.name}: +${item.heal} HP`);
                this.player.inventory.splice(i, 1);
                return;
            }
        }
    }

    lootContainer(container) {
        container.looted = true;
        container.sprite.setTint(0x666666).setAlpha(0.5);

        let message = 'Looted: ';
        container.contents.forEach(item => {
            if (item.damage) {
                // Weapon
                if (this.player.weapons.length < 4) {
                    this.player.weapons.push(item);
                    message += `${item.name}, `;
                }
            } else if (item.heal) {
                // Healing item
                this.player.inventory.push(item);
                message += `${item.name}, `;
            } else if (item.value) {
                // Money
                this.player.rubles += item.value;
                message += `${item.value} RUB, `;
            }
        });

        this.showMessage(message.slice(0, -2));
    }

    reload() {
        const weapon = this.player.weapons[this.player.currentWeapon];
        if (!weapon) return;

        const needed = weapon.maxMag - weapon.mag;
        const available = Math.min(needed, weapon.ammo);

        if (available > 0) {
            weapon.mag += available;
            weapon.ammo -= available;
            this.showMessage('Reloading...');
        }
    }

    fireWeapon() {
        const weapon = this.player.weapons[this.player.currentWeapon];
        if (!weapon || weapon.mag <= 0) {
            if (weapon && weapon.ammo > 0) this.reload();
            return;
        }

        const now = this.time.now;
        const fireDelay = 60000 / weapon.rpm;

        if (now - this.lastFired < fireDelay) return;
        this.lastFired = now;

        weapon.mag--;

        // Fire bullet(s) toward mouse
        const px = this.playerSprite.x;
        const py = this.playerSprite.y;

        const pellets = weapon.pellets || 1;

        for (let i = 0; i < pellets; i++) {
            const spread = Phaser.Math.DegToRad(weapon.spread * (Math.random() - 0.5));
            const angle = this.player.angle + spread;

            const bullet = this.add.image(px, py, pellets > 1 ? 'pellet' : 'bullet').setDepth(150);
            bullet.damage = pellets > 1 ? weapon.damage / pellets : weapon.damage;
            bullet.vx = Math.cos(angle) * 600;
            bullet.vy = Math.sin(angle) * 600;
            bullet.life = 1000;

            this.bullets.add(bullet);
        }

        // Muzzle flash
        const flash = this.add.image(
            px + Math.cos(this.player.angle) * 20,
            py + Math.sin(this.player.angle) * 20,
            'muzzle'
        ).setDepth(160);
        this.time.delayedCall(50, () => flash.destroy());
    }

    updateVision() {
        // Clear previous vision
        this.visionGraphics.clear();

        const px = this.player.x;
        const py = this.player.y;
        const visionRange = 8; // tiles
        const visionAngle = Math.PI / 2; // 90 degrees

        // Update fog of war based on vision cone
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                const dx = x - px;
                const dy = y - py;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                // Check if in vision cone
                let angleDiff = angle - this.player.angle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                const inCone = Math.abs(angleDiff) < visionAngle / 2;
                const inRange = dist < visionRange;
                const hasLOS = inRange && this.hasLineOfSight(px, py, x, y);

                if (inCone && hasLOS) {
                    this.fogTiles[y][x].visible = true;
                    this.fogTiles[y][x].explored = true;
                    this.fogTiles[y][x].sprite.setVisible(false);
                } else if (this.fogTiles[y][x].explored) {
                    this.fogTiles[y][x].visible = false;
                    this.fogTiles[y][x].sprite.setVisible(true);
                    this.fogTiles[y][x].sprite.setAlpha(0.5);
                } else {
                    this.fogTiles[y][x].visible = false;
                    this.fogTiles[y][x].sprite.setVisible(true);
                    this.fogTiles[y][x].sprite.setAlpha(0.8);
                }
            }
        }

        // Draw vision cone visualization
        this.visionGraphics.fillStyle(0xffffff, 0.05);
        this.visionGraphics.slice(
            this.playerSprite.x,
            this.playerSprite.y,
            visionRange * this.TILE,
            this.player.angle - visionAngle / 2,
            this.player.angle + visionAngle / 2,
            false
        );
        this.visionGraphics.fillPath();

        // Update enemy visibility
        this.enemies.forEach(enemy => {
            if (!enemy.alive) return;

            const ex = enemy.x, ey = enemy.y;
            const inFog = this.fogTiles[Math.floor(ey)][Math.floor(ex)];

            enemy.visible = inFog && inFog.visible;
            enemy.sprite.setVisible(enemy.visible);
        });
    }

    hasLineOfSight(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 0.1 : -0.1;
        const sy = y1 < y2 ? 0.1 : -0.1;

        let x = x1, y = y1;
        const steps = Math.max(dx, dy) * 10;

        for (let i = 0; i < steps; i++) {
            const tx = Math.floor(x);
            const ty = Math.floor(y);

            if (tx === Math.floor(x2) && ty === Math.floor(y2)) return true;

            if (tx >= 0 && tx < this.MAP_WIDTH && ty >= 0 && ty < this.MAP_HEIGHT) {
                if (this.map[ty][tx] === 2) return false; // Wall blocks vision
            }

            x += sx;
            y += sy;
        }

        return true;
    }

    updateEnemies(time, delta) {
        this.enemies.forEach(enemy => {
            if (!enemy.alive) return;

            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Check if enemy can see player (based on enemy's facing)
            const angleToPlayer = Math.atan2(dy, dx);
            let angleDiff = angleToPlayer - enemy.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            const canSeePlayer = Math.abs(angleDiff) < Math.PI / 4 && dist < 10 &&
                                 this.hasLineOfSight(enemy.x, enemy.y, this.player.x, this.player.y);

            if (canSeePlayer || enemy.alerted) {
                enemy.alerted = true;

                // Turn toward player
                enemy.angle = angleToPlayer;
                enemy.sprite.setRotation(enemy.angle);

                if (enemy.attackType === 'melee' || enemy.attackType === 'charge') {
                    // Move toward player
                    if (dist > 0.5) {
                        const speed = enemy.speed * delta / 1000 / this.TILE;
                        const moveX = (dx / dist) * speed;
                        const moveY = (dy / dist) * speed;

                        const newX = enemy.x + moveX;
                        const newY = enemy.y + moveY;

                        if (this.canWalk(Math.floor(newX), Math.floor(enemy.y))) {
                            enemy.x = newX;
                        }
                        if (this.canWalk(Math.floor(enemy.x), Math.floor(newY))) {
                            enemy.y = newY;
                        }
                    }

                    // Melee attack
                    if (dist < 0.8) {
                        if (time - enemy.lastShot > 1000) {
                            enemy.lastShot = time;
                            this.playerTakeDamage(enemy.damage, true);
                        }
                    }
                } else if (enemy.attackType === 'ranged') {
                    // Ranged attack
                    if (dist < enemy.range / this.TILE && time - enemy.lastShot > 1500) {
                        enemy.lastShot = time;
                        this.enemyShoot(enemy);
                    }

                    // Move closer if too far
                    if (dist > enemy.range / this.TILE / 2) {
                        const speed = enemy.speed * delta / 1000 / this.TILE;
                        const moveX = (dx / dist) * speed;
                        const moveY = (dy / dist) * speed;

                        enemy.x += moveX;
                        enemy.y += moveY;
                    }
                }
            } else {
                // Patrol - slowly rotate
                enemy.angle += 0.5 * delta / 1000;
                enemy.sprite.setRotation(enemy.angle);
            }

            enemy.sprite.setPosition(
                enemy.x * this.TILE + this.TILE/2,
                enemy.y * this.TILE + this.TILE/2
            );
        });
    }

    enemyShoot(enemy) {
        const ex = enemy.x * this.TILE + this.TILE/2;
        const ey = enemy.y * this.TILE + this.TILE/2;

        const spread = Phaser.Math.DegToRad(15 * (Math.random() - 0.5));
        const angle = enemy.angle + spread;

        const bullet = this.add.image(ex, ey, 'bullet').setDepth(150).setTint(0xff4444);
        bullet.damage = enemy.damage;
        bullet.vx = Math.cos(angle) * 400;
        bullet.vy = Math.sin(angle) * 400;
        bullet.life = 1000;

        this.enemyBullets.add(bullet);
    }

    updateBullets() {
        const delta = this.game.loop.delta;

        // Player bullets
        this.bullets.getChildren().forEach(bullet => {
            bullet.x += bullet.vx * delta / 1000;
            bullet.y += bullet.vy * delta / 1000;
            bullet.life -= delta;

            if (bullet.life <= 0) {
                bullet.destroy();
                return;
            }

            // Check wall collision
            const tx = Math.floor(bullet.x / this.TILE);
            const ty = Math.floor(bullet.y / this.TILE);
            if (tx < 0 || tx >= this.MAP_WIDTH || ty < 0 || ty >= this.MAP_HEIGHT ||
                this.map[ty][tx] === 2) {
                bullet.destroy();
                return;
            }

            // Check enemy collision
            this.enemies.forEach(enemy => {
                if (!enemy.alive) return;

                const ex = enemy.x * this.TILE + this.TILE/2;
                const ey = enemy.y * this.TILE + this.TILE/2;
                const dist = Math.sqrt(Math.pow(bullet.x - ex, 2) + Math.pow(bullet.y - ey, 2));

                if (dist < 16) {
                    enemy.hp -= bullet.damage;
                    enemy.alerted = true;

                    // Blood effect
                    const blood = this.add.image(bullet.x, bullet.y, 'blood').setDepth(70);
                    this.time.delayedCall(5000, () => blood.destroy());

                    bullet.destroy();

                    if (enemy.hp <= 0) {
                        this.killEnemy(enemy);
                    }
                }
            });
        });

        // Enemy bullets
        this.enemyBullets.getChildren().forEach(bullet => {
            bullet.x += bullet.vx * delta / 1000;
            bullet.y += bullet.vy * delta / 1000;
            bullet.life -= delta;

            if (bullet.life <= 0) {
                bullet.destroy();
                return;
            }

            // Check wall collision
            const tx = Math.floor(bullet.x / this.TILE);
            const ty = Math.floor(bullet.y / this.TILE);
            if (tx < 0 || tx >= this.MAP_WIDTH || ty < 0 || ty >= this.MAP_HEIGHT ||
                this.map[ty][tx] === 2) {
                bullet.destroy();
                return;
            }

            // Check player collision
            const px = this.playerSprite.x;
            const py = this.playerSprite.y;
            const dist = Math.sqrt(Math.pow(bullet.x - px, 2) + Math.pow(bullet.y - py, 2));

            if (dist < 16) {
                this.playerTakeDamage(bullet.damage, true);
                bullet.destroy();
            }
        });
    }

    killEnemy(enemy) {
        enemy.alive = false;
        enemy.sprite.setTint(0x666666).setAlpha(0.5);
        this.player.kills++;
        this.player.rubles += enemy.loot;
        this.showMessage(`+${enemy.loot} RUB`);
    }

    playerTakeDamage(damage, canBleed) {
        this.player.hp -= damage;

        // Chance to start bleeding
        if (canBleed && Math.random() < 0.3) {
            this.player.bleeding = true;
        }

        // Screen flash
        this.cameras.main.flash(100, 255, 0, 0);

        if (this.player.hp <= 0) {
            this.gameOver();
        }
    }

    updateBleeding(delta) {
        if (this.player.bleeding) {
            this.player.bleedTimer += delta;
            if (this.player.bleedTimer >= 1000) {
                this.player.bleedTimer = 0;
                this.player.hp -= 2;

                if (this.player.hp <= 0) {
                    this.gameOver();
                }
            }
        }
    }

    checkExtraction() {
        const dist = Math.sqrt(
            Math.pow(this.player.x - this.extraction.x, 2) +
            Math.pow(this.player.y - this.extraction.y, 2)
        );

        if (dist < this.extraction.radius) {
            this.extract();
        }
    }

    extract() {
        this.scene.start('ExtractionScene', {
            rubles: this.player.rubles,
            kills: this.player.kills,
            hp: Math.ceil(this.player.hp)
        });
    }

    gameOver() {
        this.scene.start('DeathScene', {
            kills: this.player.kills
        });
    }

    showMessage(text) {
        this.messageText.setText(text).setVisible(true);
        this.time.delayedCall(2000, () => {
            this.messageText.setVisible(false);
        });
    }
}

class ExtractionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ExtractionScene' });
    }

    init(data) {
        this.rubles = data.rubles || 0;
        this.kills = data.kills || 0;
        this.hp = data.hp || 0;
    }

    create() {
        const cx = 400, cy = 300;

        this.add.rectangle(cx, cy, 800, 600, 0x0a1a0a);

        this.add.text(cx, 120, 'EXTRACTION SUCCESSFUL', {
            fontSize: '40px',
            fill: '#00ff00',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(cx, 200, 'RAID SUMMARY', {
            fontSize: '24px',
            fill: '#88aa44',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        const stats = [
            `Loot Value: ${this.rubles} RUB`,
            `Enemies Killed: ${this.kills}`,
            `Kill Bonus: ${this.kills * 50} RUB`,
            `Health Remaining: ${this.hp}%`,
            '',
            `TOTAL SCORE: ${this.rubles + this.kills * 50}`
        ];

        stats.forEach((line, i) => {
            const color = i === stats.length - 1 ? '#ffff00' : '#aaaaaa';
            this.add.text(cx, 260 + i * 30, line, {
                fontSize: '18px',
                fill: color,
                fontFamily: 'monospace'
            }).setOrigin(0.5);
        });

        const btn = this.add.rectangle(cx, 500, 200, 50, 0x446622)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => btn.setFillStyle(0x558833))
            .on('pointerout', () => btn.setFillStyle(0x446622))
            .on('pointerdown', () => this.scene.start('MenuScene'));

        this.add.text(cx, 500, 'NEW RAID', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }
}

class DeathScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DeathScene' });
    }

    init(data) {
        this.kills = data.kills || 0;
    }

    create() {
        const cx = 400, cy = 300;

        this.add.rectangle(cx, cy, 800, 600, 0x1a0a0a);

        this.add.text(cx, 180, 'K.I.A.', {
            fontSize: '64px',
            fill: '#ff0000',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(cx, 280, 'You died in the zone.', {
            fontSize: '24px',
            fill: '#ff6666',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(cx, 330, 'All loot has been lost.', {
            fontSize: '18px',
            fill: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(cx, 380, `Enemies killed: ${this.kills}`, {
            fontSize: '18px',
            fill: '#aaaaaa',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        const btn = this.add.rectangle(cx, 480, 200, 50, 0x662222)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => btn.setFillStyle(0x883333))
            .on('pointerout', () => btn.setFillStyle(0x662222))
            .on('pointerdown', () => this.scene.start('MenuScene'));

        this.add.text(cx, 480, 'TRY AGAIN', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
    scene: [BootScene, MenuScene, GameScene, ExtractionScene, DeathScene]
};

const game = new Phaser.Game(config);
