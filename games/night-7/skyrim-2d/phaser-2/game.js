// Frostfall - 2D Skyrim Demake
// Phaser 3 Implementation

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Player sprite
        g.fillStyle(0x8b7355);
        g.fillRect(4, 0, 8, 6);
        g.fillStyle(0xdeb887);
        g.fillRect(4, 6, 8, 4);
        g.fillStyle(0x654321);
        g.fillRect(2, 10, 12, 10);
        g.fillStyle(0x4a3520);
        g.fillRect(4, 20, 4, 4);
        g.fillRect(8, 20, 4, 4);
        g.generateTexture('player', 16, 24);
        g.clear();

        // Sword
        g.fillStyle(0x888888);
        g.fillRect(2, 0, 4, 20);
        g.fillStyle(0x654321);
        g.fillRect(0, 18, 8, 4);
        g.generateTexture('sword', 8, 24);
        g.clear();

        // Wolf
        g.fillStyle(0x555555);
        g.fillRect(2, 4, 12, 8);
        g.fillRect(12, 6, 4, 4);
        g.fillStyle(0x333333);
        g.fillRect(0, 8, 4, 4);
        g.fillRect(14, 4, 2, 2);
        g.generateTexture('wolf', 16, 16);
        g.clear();

        // Bandit
        g.fillStyle(0x8b4513);
        g.fillRect(4, 0, 8, 6);
        g.fillStyle(0xdaa520);
        g.fillRect(4, 6, 8, 4);
        g.fillStyle(0x3a3a3a);
        g.fillRect(2, 10, 12, 10);
        g.fillStyle(0x2a2a2a);
        g.fillRect(4, 20, 4, 4);
        g.fillRect(8, 20, 4, 4);
        g.generateTexture('bandit', 16, 24);
        g.clear();

        // Draugr
        g.fillStyle(0x4a6a6a);
        g.fillRect(4, 0, 8, 6);
        g.fillStyle(0x3a5a5a);
        g.fillRect(4, 6, 8, 4);
        g.fillStyle(0x2a4040);
        g.fillRect(2, 10, 12, 10);
        g.fillStyle(0x1a3030);
        g.fillRect(4, 20, 4, 4);
        g.fillRect(8, 20, 4, 4);
        g.generateTexture('draugr', 16, 24);
        g.clear();

        // Bear
        g.fillStyle(0x5c4033);
        g.fillRect(0, 4, 24, 16);
        g.fillRect(20, 0, 8, 12);
        g.fillStyle(0x3c2013);
        g.fillRect(2, 16, 4, 8);
        g.fillRect(18, 16, 4, 8);
        g.generateTexture('bear', 28, 24);
        g.clear();

        // Troll
        g.fillStyle(0x4a5a4a);
        g.fillRect(4, 0, 16, 24);
        g.fillStyle(0x3a4a3a);
        g.fillRect(0, 8, 8, 12);
        g.fillRect(16, 8, 8, 12);
        g.fillStyle(0xff0000);
        g.fillRect(8, 4, 2, 2);
        g.fillRect(12, 4, 2, 2);
        g.fillRect(16, 4, 2, 2);
        g.generateTexture('troll', 24, 28);
        g.clear();

        // Boss markers
        g.fillStyle(0x800000);
        g.fillRect(4, 0, 8, 6);
        g.fillStyle(0xaa0000);
        g.fillRect(4, 6, 8, 4);
        g.fillStyle(0x660000);
        g.fillRect(2, 10, 12, 14);
        g.generateTexture('boss', 16, 28);
        g.clear();

        // Grass tile
        g.fillStyle(0x2a5a2a);
        g.fillRect(0, 0, 16, 16);
        g.fillStyle(0x3a6a3a);
        g.fillRect(2, 3, 2, 3);
        g.fillRect(8, 7, 2, 3);
        g.fillRect(12, 2, 2, 3);
        g.generateTexture('grass', 16, 16);
        g.clear();

        // Snow tile
        g.fillStyle(0xddeeff);
        g.fillRect(0, 0, 16, 16);
        g.fillStyle(0xeef5ff);
        g.fillRect(4, 4, 3, 2);
        g.fillRect(10, 8, 3, 2);
        g.generateTexture('snow', 16, 16);
        g.clear();

        // Mountain tile
        g.fillStyle(0x5a5a6a);
        g.fillRect(0, 0, 16, 16);
        g.fillStyle(0x4a4a5a);
        g.fillRect(4, 4, 8, 8);
        g.generateTexture('mountain', 16, 16);
        g.clear();

        // Dirt path
        g.fillStyle(0x8b7355);
        g.fillRect(0, 0, 16, 16);
        g.fillStyle(0x7a6245);
        g.fillRect(3, 3, 4, 4);
        g.fillRect(9, 9, 4, 4);
        g.generateTexture('dirt', 16, 16);
        g.clear();

        // Tree
        g.fillStyle(0x654321);
        g.fillRect(12, 24, 8, 16);
        g.fillStyle(0x2a5a2a);
        g.beginPath();
        g.moveTo(16, 0);
        g.lineTo(0, 28);
        g.lineTo(32, 28);
        g.closePath();
        g.fill();
        g.generateTexture('tree', 32, 40);
        g.clear();

        // Building
        g.fillStyle(0x654321);
        g.fillRect(0, 8, 48, 32);
        g.fillStyle(0x8b4513);
        g.beginPath();
        g.moveTo(24, 0);
        g.lineTo(0, 12);
        g.lineTo(48, 12);
        g.closePath();
        g.fill();
        g.fillStyle(0x3a3a3a);
        g.fillRect(18, 24, 12, 16);
        g.generateTexture('building', 48, 40);
        g.clear();

        // Chest
        g.fillStyle(0x8b4513);
        g.fillRect(0, 4, 16, 12);
        g.fillStyle(0xffd700);
        g.fillRect(6, 8, 4, 4);
        g.fillStyle(0x654321);
        g.fillRect(0, 0, 16, 4);
        g.generateTexture('chest', 16, 16);
        g.clear();

        // Potion
        g.fillStyle(0xff4444);
        g.fillRect(4, 4, 8, 12);
        g.fillStyle(0x888888);
        g.fillRect(5, 0, 6, 4);
        g.generateTexture('potion', 16, 16);
        g.clear();

        // Town marker
        g.fillStyle(0xffd700);
        g.beginPath();
        g.moveTo(8, 0);
        g.lineTo(0, 16);
        g.lineTo(16, 16);
        g.closePath();
        g.fill();
        g.fillStyle(0xff8800);
        g.fillRect(6, 16, 4, 8);
        g.generateTexture('marker', 16, 24);
        g.clear();

        // Dungeon entrance
        g.fillStyle(0x3a3a3a);
        g.fillRect(0, 0, 32, 24);
        g.fillStyle(0x1a1a1a);
        g.fillRect(8, 4, 16, 16);
        g.generateTexture('dungeon', 32, 24);
        g.clear();

        // NPC
        g.fillStyle(0x8b5a2b);
        g.fillRect(4, 0, 8, 6);
        g.fillStyle(0xdaa520);
        g.fillRect(4, 6, 8, 4);
        g.fillStyle(0x228b22);
        g.fillRect(2, 10, 12, 10);
        g.fillStyle(0x1a6a1a);
        g.fillRect(4, 20, 4, 4);
        g.fillRect(8, 20, 4, 4);
        g.generateTexture('npc', 16, 24);
        g.clear();

        // Sword swing effect
        g.fillStyle(0xaaaaaa);
        g.lineStyle(3, 0xdddddd);
        g.beginPath();
        g.arc(0, 16, 20, -Math.PI/2, Math.PI/2, false);
        g.stroke();
        g.generateTexture('swingEffect', 24, 32);
        g.clear();

        // Hit effect
        g.fillStyle(0xff8800);
        g.fillRect(4, 4, 8, 8);
        g.fillStyle(0xffff00);
        g.fillRect(6, 6, 4, 4);
        g.generateTexture('hitEffect', 16, 16);
        g.clear();

        // Quest marker
        g.fillStyle(0xffff00);
        g.fillRect(6, 0, 4, 12);
        g.fillRect(6, 14, 4, 4);
        g.generateTexture('questMarker', 16, 20);
        g.clear();

        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        // Background
        this.cameras.main.setBackgroundColor('#1a1a2e');

        // Title with Nordic styling
        this.add.text(cx, cy - 120, 'FROSTFALL', {
            fontSize: '48px',
            fontFamily: 'Georgia, serif',
            color: '#ddeeff',
            stroke: '#2a3a4a',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(cx, cy - 70, 'A 2D Skyrim Demake', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#aabbcc'
        }).setOrigin(0.5);

        // Instructions
        const instructions = [
            'WASD / Arrows - Move',
            'Space - Attack',
            'Shift - Sprint',
            'E - Interact / Enter Buildings',
            'I - Inventory',
            'Q - Quest Log',
            '',
            'Explore the land of Skyrim',
            'Complete quests, defeat enemies,',
            'and clear 3 dungeons to win!'
        ];

        instructions.forEach((line, i) => {
            this.add.text(cx, cy - 10 + i * 22, line, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#8899aa'
            }).setOrigin(0.5);
        });

        // Start prompt
        this.add.text(cx, cy + 180, 'Press SPACE or Click to Begin', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffdd88'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
        this.input.once('pointerdown', () => this.scene.start('GameScene'));
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // World settings
        this.worldWidth = 4000;
        this.worldHeight = 4000;
        this.tileSize = 16;

        // Player stats
        this.playerStats = {
            hp: 100,
            maxHp: 100,
            stamina: 100,
            maxStamina: 100,
            gold: 50,
            level: 1,
            xp: 0,
            xpToLevel: 100,
            damage: 10,
            armor: 0
        };

        // Equipment
        this.equipment = {
            weapon: { name: 'Iron Sword', damage: 8 },
            body: null,
            head: null,
            ring: null
        };

        // Inventory
        this.inventory = [
            { type: 'potion', name: 'Health Potion', effect: 'heal', value: 25 },
            { type: 'potion', name: 'Health Potion', effect: 'heal', value: 25 }
        ];

        // Quests
        this.quests = [
            {
                id: 'main1',
                name: 'Trouble at the Mine',
                description: 'Clear Embershard Mine of bandits',
                type: 'main',
                target: 'embershard',
                completed: false,
                reward: { gold: 100, xp: 50 }
            }
        ];
        this.activeQuest = this.quests[0];
        this.dungeonsCleared = 0;

        // Generate world
        this.generateWorld();

        // Create player
        this.player = this.physics.add.sprite(this.worldWidth / 2, this.worldHeight / 2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.body.setSize(12, 12);
        this.player.body.setOffset(2, 12);

        // Combat state
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.iFrames = 0;

        // Camera
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.keys = this.input.keyboard.addKeys({
            space: 'SPACE',
            shift: 'SHIFT',
            e: 'E',
            i: 'I',
            q: 'Q',
            one: 'ONE',
            two: 'TWO'
        });

        // Create enemies
        this.createEnemies();

        // Create HUD
        this.createHUD();

        // UI flags
        this.showingInventory = false;
        this.showingQuests = false;

        // Damage flash overlay
        this.damageOverlay = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0xff0000, 0
        ).setScrollFactor(0).setDepth(100);
    }

    generateWorld() {
        // Create biome zones
        this.biomes = [];

        // Center: Forest (starting area)
        this.biomes.push({
            x: 1500, y: 1500, width: 1000, height: 1000,
            type: 'forest', tile: 'grass', enemies: ['wolf', 'bandit']
        });

        // North: Snow biome
        this.biomes.push({
            x: 1500, y: 500, width: 1000, height: 800,
            type: 'snow', tile: 'snow', enemies: ['wolf', 'draugr']
        });

        // East: Mountain biome
        this.biomes.push({
            x: 2600, y: 1500, width: 1000, height: 1000,
            type: 'mountain', tile: 'mountain', enemies: ['bear', 'troll']
        });

        // Create tile background
        this.tileGroups = {};
        for (const biome of this.biomes) {
            const cols = Math.ceil(biome.width / this.tileSize);
            const rows = Math.ceil(biome.height / this.tileSize);
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const tx = biome.x + x * this.tileSize;
                    const ty = biome.y + y * this.tileSize;
                    this.add.image(tx, ty, biome.tile).setOrigin(0).setDepth(0);
                }
            }
        }

        // Fill rest with grass
        const cols = Math.ceil(this.worldWidth / this.tileSize);
        const rows = Math.ceil(this.worldHeight / this.tileSize);
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const tx = x * this.tileSize;
                const ty = y * this.tileSize;
                if (!this.isInBiome(tx, ty)) {
                    this.add.image(tx, ty, 'grass').setOrigin(0).setDepth(0);
                }
            }
        }

        // Generate towns
        this.towns = [];
        this.generateTown('Riverwood', this.worldWidth / 2, this.worldHeight / 2, 'start');
        this.generateTown('Whiterun', this.worldWidth / 2 - 600, this.worldHeight / 2 - 400, 'city');
        this.generateTown('Winterhold', 1800, 700, 'snow');
        this.generateTown('Markarth', 2800, 1800, 'mountain');
        this.generateTown('Falkreath', this.worldWidth / 2 + 500, this.worldHeight / 2 + 500, 'forest');
        this.generateTown('Riften', 3200, 2500, 'forest');

        // Generate dungeons
        this.dungeons = [];
        this.generateDungeon('Embershard Mine', this.worldWidth / 2 - 300, this.worldHeight / 2 + 300, 'forest', 1);
        this.generateDungeon('Bleak Falls Barrow', 1700, 800, 'snow', 2);
        this.generateDungeon('Nchuand-Zel', 2900, 2000, 'mountain', 3);

        // Generate random trees and obstacles
        this.obstacles = this.physics.add.staticGroup();
        for (let i = 0; i < 200; i++) {
            const x = Phaser.Math.Between(100, this.worldWidth - 100);
            const y = Phaser.Math.Between(100, this.worldHeight - 100);
            if (!this.isNearTown(x, y) && !this.isNearDungeon(x, y)) {
                const tree = this.add.image(x, y, 'tree').setDepth(y);
                const hitbox = this.obstacles.create(x, y + 20, null);
                hitbox.setSize(16, 8).setVisible(false);
                hitbox.refreshBody();
            }
        }

        // Create chests
        this.chests = this.physics.add.group();
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(200, this.worldWidth - 200);
            const y = Phaser.Math.Between(200, this.worldHeight - 200);
            if (!this.isNearTown(x, y)) {
                const chest = this.chests.create(x, y, 'chest');
                chest.opened = false;
                chest.loot = {
                    gold: Phaser.Math.Between(10, 50),
                    hasPotion: Math.random() < 0.4
                };
            }
        }

        // Town markers
        this.markers = this.add.group();
        for (const town of this.towns) {
            const marker = this.add.image(town.x, town.y - 40, 'marker').setDepth(1000);
            this.add.text(town.x, town.y - 65, town.name, {
                fontSize: '10px',
                color: '#ffdd88'
            }).setOrigin(0.5).setDepth(1000);
        }
    }

    generateTown(name, x, y, type) {
        const town = { name, x, y, type, buildings: [], npcs: [] };

        // Create buildings
        const numBuildings = type === 'start' ? 5 : Phaser.Math.Between(3, 7);
        for (let i = 0; i < numBuildings; i++) {
            const angle = (i / numBuildings) * Math.PI * 2;
            const dist = Phaser.Math.Between(60, 120);
            const bx = x + Math.cos(angle) * dist;
            const by = y + Math.sin(angle) * dist;
            const building = this.add.image(bx, by, 'building').setDepth(by);
            town.buildings.push({ x: bx, y: by, sprite: building });
        }

        // Create NPCs
        const npcRoles = ['smith', 'merchant', 'quest'];
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Phaser.Math.Between(30, 60);
            const nx = x + Math.cos(angle) * dist;
            const ny = y + Math.sin(angle) * dist;
            const npc = this.physics.add.sprite(nx, ny, 'npc').setImmovable(true);
            npc.role = npcRoles[i % npcRoles.length];
            npc.townName = name;
            npc.setDepth(ny);
            town.npcs.push(npc);

            // Quest marker for quest givers
            if (npc.role === 'quest') {
                npc.questMarker = this.add.image(nx, ny - 30, 'questMarker').setDepth(1000);
            }
        }

        // Add collision for buildings
        for (const b of town.buildings) {
            const hitbox = this.obstacles.create(b.x, b.y + 10, null);
            hitbox.setSize(40, 20).setVisible(false);
            hitbox.refreshBody();
        }

        this.towns.push(town);
    }

    generateDungeon(name, x, y, biome, tier) {
        const dungeon = {
            name, x, y, biome, tier,
            cleared: false,
            entrance: this.add.image(x, y, 'dungeon').setDepth(y)
        };

        // Label
        this.add.text(x, y - 20, name, {
            fontSize: '10px',
            color: '#ff8888'
        }).setOrigin(0.5).setDepth(1000);

        this.dungeons.push(dungeon);
    }

    isInBiome(x, y) {
        for (const biome of this.biomes) {
            if (x >= biome.x && x < biome.x + biome.width &&
                y >= biome.y && y < biome.y + biome.height) {
                return true;
            }
        }
        return false;
    }

    isNearTown(x, y) {
        for (const town of this.towns) {
            const dist = Phaser.Math.Distance.Between(x, y, town.x, town.y);
            if (dist < 150) return true;
        }
        return false;
    }

    isNearDungeon(x, y) {
        for (const dun of this.dungeons) {
            const dist = Phaser.Math.Distance.Between(x, y, dun.x, dun.y);
            if (dist < 50) return true;
        }
        return false;
    }

    createEnemies() {
        this.enemies = this.physics.add.group();

        // Spawn enemies in each biome
        for (const biome of this.biomes) {
            const numEnemies = 15;
            for (let i = 0; i < numEnemies; i++) {
                const x = biome.x + Phaser.Math.Between(50, biome.width - 50);
                const y = biome.y + Phaser.Math.Between(50, biome.height - 50);

                if (!this.isNearTown(x, y) && !this.isNearDungeon(x, y)) {
                    const type = Phaser.Utils.Array.GetRandom(biome.enemies);
                    this.spawnEnemy(x, y, type, biome.type);
                }
            }
        }

        // Spawn some random enemies in open world
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(200, this.worldWidth - 200);
            const y = Phaser.Math.Between(200, this.worldHeight - 200);
            if (!this.isNearTown(x, y) && !this.isNearDungeon(x, y)) {
                const type = Phaser.Utils.Array.GetRandom(['wolf', 'bandit']);
                this.spawnEnemy(x, y, type, 'forest');
            }
        }

        // Physics
        this.physics.add.collider(this.player, this.obstacles);
        this.physics.add.overlap(this.player, this.enemies, this.handleEnemyCollision, null, this);
        this.physics.add.overlap(this.player, this.chests, this.handleChestInteraction, null, this);
    }

    spawnEnemy(x, y, type, biome) {
        const stats = {
            wolf: { hp: 25, damage: 6, speed: 70, xp: 10 },
            bandit: { hp: 40, damage: 8, speed: 50, xp: 20 },
            draugr: { hp: 50, damage: 10, speed: 40, xp: 30 },
            bear: { hp: 60, damage: 12, speed: 45, xp: 35 },
            troll: { hp: 80, damage: 15, speed: 35, xp: 50 }
        };

        const enemy = this.enemies.create(x, y, type);
        enemy.setDepth(y);
        enemy.type = type;
        enemy.biome = biome;
        enemy.hp = stats[type].hp;
        enemy.maxHp = stats[type].hp;
        enemy.damage = stats[type].damage;
        enemy.speed = stats[type].speed;
        enemy.xpValue = stats[type].xp;
        enemy.state = 'idle';
        enemy.homeX = x;
        enemy.homeY = y;
        enemy.aggroRange = 150;
        enemy.attackRange = 24;
        enemy.attackCooldown = 0;
        enemy.setImmovable(false);
        enemy.body.setSize(12, 12);

        return enemy;
    }

    createHUD() {
        // Health bar background
        this.add.rectangle(10, 10, 104, 14, 0x333333)
            .setOrigin(0).setScrollFactor(0).setDepth(200);

        // Health bar
        this.hpBar = this.add.rectangle(12, 12, 100, 10, 0xff4444)
            .setOrigin(0).setScrollFactor(0).setDepth(201);

        // Stamina bar background
        this.add.rectangle(10, 28, 104, 14, 0x333333)
            .setOrigin(0).setScrollFactor(0).setDepth(200);

        // Stamina bar
        this.staminaBar = this.add.rectangle(12, 30, 100, 10, 0x44ff44)
            .setOrigin(0).setScrollFactor(0).setDepth(201);

        // Gold display
        this.goldText = this.add.text(10, 48, 'Gold: 50', {
            fontSize: '14px',
            color: '#ffd700'
        }).setScrollFactor(0).setDepth(200);

        // Level display
        this.levelText = this.add.text(10, 68, 'Level: 1', {
            fontSize: '14px',
            color: '#88aaff'
        }).setScrollFactor(0).setDepth(200);

        // Quest display
        this.questText = this.add.text(10, this.cameras.main.height - 40, '', {
            fontSize: '12px',
            color: '#ffdd88',
            wordWrap: { width: 300 }
        }).setScrollFactor(0).setDepth(200);

        // Interaction prompt
        this.interactPrompt = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 60,
            '', { fontSize: '14px', color: '#ffffff' }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        // Update quest display
        this.updateQuestDisplay();
    }

    updateQuestDisplay() {
        if (this.activeQuest) {
            this.questText.setText(`Quest: ${this.activeQuest.name}\n${this.activeQuest.description}`);
        } else {
            this.questText.setText('No active quest');
        }
    }

    update(time, delta) {
        if (this.showingInventory || this.showingQuests) {
            this.handleUIInput();
            return;
        }

        this.handleMovement(delta);
        this.handleCombat(delta);
        this.updateEnemies(delta);
        this.updateHUD();
        this.checkInteractions();
        this.handleUIInput();

        // Update cooldowns
        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        if (this.iFrames > 0) this.iFrames -= delta;

        // Regen stamina
        if (!this.keys.shift.isDown) {
            this.playerStats.stamina = Math.min(
                this.playerStats.maxStamina,
                this.playerStats.stamina + delta * 0.02
            );
        }

        // Update damage overlay fade
        if (this.damageOverlay.alpha > 0) {
            this.damageOverlay.alpha -= delta * 0.003;
        }

        // Update player depth
        this.player.setDepth(this.player.y);

        // Check dungeon cleared win condition
        if (this.dungeonsCleared >= 3) {
            this.scene.start('VictoryScene', { stats: this.playerStats });
        }
    }

    handleMovement(delta) {
        const speed = this.keys.shift.isDown && this.playerStats.stamina > 0 ? 140 : 80;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -speed;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed;
        if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -speed;
        if (this.cursors.down.isDown || this.wasd.S.isDown) vy = speed;

        // Normalize diagonal
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx, vy);

        // Track facing direction
        if (vx > 0) this.player.facingRight = true;
        else if (vx < 0) this.player.facingRight = false;

        // Drain stamina while sprinting
        if (this.keys.shift.isDown && (vx !== 0 || vy !== 0)) {
            this.playerStats.stamina = Math.max(0, this.playerStats.stamina - delta * 0.05);
        }
    }

    handleCombat(delta) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.space) && this.attackCooldown <= 0) {
            this.attack();
        }
    }

    attack() {
        if (this.isAttacking) return;

        this.isAttacking = true;
        this.attackCooldown = 400;

        // Attack direction
        const dir = this.player.facingRight ? 1 : -1;
        const attackX = this.player.x + dir * 20;
        const attackY = this.player.y;

        // Visual swing effect
        const swing = this.add.image(attackX, attackY, 'swingEffect')
            .setFlipX(!this.player.facingRight)
            .setDepth(1000)
            .setAlpha(0.7);

        this.tweens.add({
            targets: swing,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 200,
            onComplete: () => swing.destroy()
        });

        // Check hits
        const damage = this.playerStats.damage + (this.equipment.weapon?.damage || 0);

        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(attackX, attackY, enemy.x, enemy.y);
            if (dist < 32) {
                this.damageEnemy(enemy, damage);
            }
        });

        this.time.delayedCall(300, () => {
            this.isAttacking = false;
        });
    }

    damageEnemy(enemy, damage) {
        enemy.hp -= damage;

        // Hit effect
        const hitFx = this.add.image(enemy.x, enemy.y, 'hitEffect')
            .setDepth(1000);
        this.tweens.add({
            targets: hitFx,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 200,
            onComplete: () => hitFx.destroy()
        });

        // Damage number
        const dmgText = this.add.text(enemy.x, enemy.y - 20, `-${damage}`, {
            fontSize: '14px',
            color: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1000);

        this.tweens.add({
            targets: dmgText,
            y: enemy.y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => dmgText.destroy()
        });

        // Knockback
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        enemy.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);
        this.time.delayedCall(150, () => enemy.setVelocity(0, 0));

        // Enemy flash
        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => enemy.clearTint());

        // Death
        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        // XP
        this.playerStats.xp += enemy.xpValue;

        // XP popup
        const xpText = this.add.text(enemy.x, enemy.y, `+${enemy.xpValue} XP`, {
            fontSize: '12px',
            color: '#88aaff'
        }).setOrigin(0.5).setDepth(1000);

        this.tweens.add({
            targets: xpText,
            y: enemy.y - 40,
            alpha: 0,
            duration: 1000,
            onComplete: () => xpText.destroy()
        });

        // Gold drop
        const gold = Phaser.Math.Between(5, 20);
        this.playerStats.gold += gold;

        // Level up check
        if (this.playerStats.xp >= this.playerStats.xpToLevel) {
            this.levelUp();
        }

        // Death animation
        this.tweens.add({
            targets: enemy,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 300,
            onComplete: () => enemy.destroy()
        });
    }

    levelUp() {
        this.playerStats.level++;
        this.playerStats.xp -= this.playerStats.xpToLevel;
        this.playerStats.xpToLevel = Math.floor(this.playerStats.xpToLevel * 1.5);
        this.playerStats.maxHp += 10;
        this.playerStats.hp = this.playerStats.maxHp;
        this.playerStats.damage += 2;

        // Level up visual
        const levelText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            'LEVEL UP!', {
                fontSize: '32px',
                color: '#ffdd00',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(300);

        this.tweens.add({
            targets: levelText,
            y: levelText.y - 30,
            alpha: 0,
            duration: 2000,
            onComplete: () => levelText.destroy()
        });
    }

    updateEnemies(delta) {
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.attackCooldown > 0) enemy.attackCooldown -= delta;

            const distToPlayer = Phaser.Math.Distance.Between(
                enemy.x, enemy.y, this.player.x, this.player.y
            );

            // State machine
            if (distToPlayer < enemy.aggroRange) {
                enemy.state = 'chase';
            } else if (distToPlayer > enemy.aggroRange * 1.5) {
                enemy.state = 'return';
            }

            switch (enemy.state) {
                case 'chase':
                    const angle = Phaser.Math.Angle.Between(
                        enemy.x, enemy.y, this.player.x, this.player.y
                    );
                    enemy.setVelocity(
                        Math.cos(angle) * enemy.speed,
                        Math.sin(angle) * enemy.speed
                    );

                    // Attack when in range
                    if (distToPlayer < enemy.attackRange && enemy.attackCooldown <= 0) {
                        this.enemyAttack(enemy);
                    }
                    break;

                case 'return':
                    const distToHome = Phaser.Math.Distance.Between(
                        enemy.x, enemy.y, enemy.homeX, enemy.homeY
                    );
                    if (distToHome > 10) {
                        const homeAngle = Phaser.Math.Angle.Between(
                            enemy.x, enemy.y, enemy.homeX, enemy.homeY
                        );
                        enemy.setVelocity(
                            Math.cos(homeAngle) * enemy.speed * 0.5,
                            Math.sin(homeAngle) * enemy.speed * 0.5
                        );
                    } else {
                        enemy.setVelocity(0, 0);
                        enemy.state = 'idle';
                    }
                    break;

                case 'idle':
                default:
                    enemy.setVelocity(0, 0);
                    break;
            }

            enemy.setDepth(enemy.y);
        });
    }

    enemyAttack(enemy) {
        enemy.attackCooldown = 1000;

        if (this.iFrames > 0) return;

        // Player takes damage
        const damage = Math.max(1, enemy.damage - this.playerStats.armor);
        this.playerStats.hp -= damage;
        this.iFrames = 500;

        // Damage number on player
        const dmgText = this.add.text(this.player.x, this.player.y - 20, `-${damage}`, {
            fontSize: '16px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1000);

        this.tweens.add({
            targets: dmgText,
            y: this.player.y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => dmgText.destroy()
        });

        // Screen flash
        this.damageOverlay.alpha = 0.3;

        // Screen shake
        this.cameras.main.shake(100, 0.01);

        // Player flash
        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => this.player.clearTint());

        // Check death
        if (this.playerStats.hp <= 0) {
            this.scene.start('GameOverScene', { won: false, stats: this.playerStats });
        }
    }

    handleEnemyCollision(player, enemy) {
        if (this.iFrames <= 0 && enemy.state === 'chase') {
            this.enemyAttack(enemy);
        }
    }

    handleChestInteraction(player, chest) {
        if (!chest.opened && Phaser.Input.Keyboard.JustDown(this.keys.e)) {
            chest.opened = true;
            chest.setTint(0x666666);

            // Loot
            this.playerStats.gold += chest.loot.gold;

            const lootText = this.add.text(chest.x, chest.y - 20,
                `+${chest.loot.gold} gold`, {
                    fontSize: '12px',
                    color: '#ffd700'
                }
            ).setOrigin(0.5).setDepth(1000);

            this.tweens.add({
                targets: lootText,
                y: chest.y - 50,
                alpha: 0,
                duration: 1000,
                onComplete: () => lootText.destroy()
            });

            if (chest.loot.hasPotion) {
                this.inventory.push({
                    type: 'potion',
                    name: 'Health Potion',
                    effect: 'heal',
                    value: 25
                });
            }
        }
    }

    checkInteractions() {
        let nearestInteraction = null;
        let nearestDist = 50;

        // Check NPCs
        for (const town of this.towns) {
            for (const npc of town.npcs) {
                const dist = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y, npc.x, npc.y
                );
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestInteraction = { type: 'npc', npc, town };
                }
            }
        }

        // Check dungeons
        for (const dun of this.dungeons) {
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, dun.x, dun.y
            );
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestInteraction = { type: 'dungeon', dungeon: dun };
            }
        }

        // Check chests
        this.chests.getChildren().forEach(chest => {
            if (!chest.opened) {
                const dist = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y, chest.x, chest.y
                );
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestInteraction = { type: 'chest', chest };
                }
            }
        });

        // Update prompt
        if (nearestInteraction) {
            switch (nearestInteraction.type) {
                case 'npc':
                    const role = nearestInteraction.npc.role;
                    this.interactPrompt.setText(`[E] Talk to ${role}`);
                    if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
                        this.interactWithNPC(nearestInteraction.npc, nearestInteraction.town);
                    }
                    break;
                case 'dungeon':
                    const dun = nearestInteraction.dungeon;
                    this.interactPrompt.setText(`[E] Enter ${dun.name}`);
                    if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
                        this.enterDungeon(dun);
                    }
                    break;
                case 'chest':
                    this.interactPrompt.setText('[E] Open Chest');
                    break;
            }
        } else {
            this.interactPrompt.setText('');
        }
    }

    interactWithNPC(npc, town) {
        // Pause game
        this.physics.pause();
        this.player.setVelocity(0, 0);

        // Create dialogue box
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        const bg = this.add.rectangle(cx, cy + 80, 400, 200, 0x222233, 0.95)
            .setScrollFactor(0).setDepth(300);

        const titleText = this.add.text(cx, cy + 10, npc.role.toUpperCase(), {
            fontSize: '18px',
            color: '#ffdd88'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        let options = [];
        let dialogue = '';

        switch (npc.role) {
            case 'smith':
                dialogue = 'Looking for weapons or armor?';
                options = [
                    { text: 'Buy Iron Sword (50g)', cost: 50, item: { type: 'weapon', name: 'Iron Sword', damage: 8 } },
                    { text: 'Buy Steel Sword (120g)', cost: 120, item: { type: 'weapon', name: 'Steel Sword', damage: 12 } },
                    { text: 'Buy Iron Armor (100g)', cost: 100, item: { type: 'armor', name: 'Iron Armor', armor: 15 } }
                ];
                break;
            case 'merchant':
                dialogue = 'I have goods for sale.';
                options = [
                    { text: 'Buy Health Potion (30g)', cost: 30, item: { type: 'potion', name: 'Health Potion', effect: 'heal', value: 50 } },
                    { text: 'Buy Stamina Potion (20g)', cost: 20, item: { type: 'potion', name: 'Stamina Potion', effect: 'stamina', value: 50 } }
                ];
                break;
            case 'quest':
                const availableQuest = this.getAvailableQuest(town.name);
                if (availableQuest) {
                    dialogue = availableQuest.description;
                    options = [{ text: 'Accept Quest', quest: availableQuest }];
                } else {
                    dialogue = 'No tasks for you right now.';
                }
                break;
        }

        const dialogueText = this.add.text(cx, cy + 50, dialogue, {
            fontSize: '14px',
            color: '#ffffff',
            wordWrap: { width: 350 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        const optionTexts = [];
        options.forEach((opt, i) => {
            const optText = this.add.text(cx, cy + 90 + i * 25, `[${i + 1}] ${opt.text}`, {
                fontSize: '14px',
                color: '#88ddff'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(301)
            .setInteractive();

            optText.on('pointerover', () => optText.setColor('#ffff88'));
            optText.on('pointerout', () => optText.setColor('#88ddff'));
            optText.on('pointerdown', () => this.selectOption(opt));

            optionTexts.push(optText);
        });

        const closeText = this.add.text(cx, cy + 160, '[ESC] Close', {
            fontSize: '12px',
            color: '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        this.dialogueUI = { bg, titleText, dialogueText, optionTexts, closeText };

        // Key handlers
        this.input.keyboard.once('keydown-ESC', () => this.closeDialogue());
        this.input.keyboard.once('keydown-ONE', () => options[0] && this.selectOption(options[0]));
        this.input.keyboard.once('keydown-TWO', () => options[1] && this.selectOption(options[1]));
        this.input.keyboard.once('keydown-THREE', () => options[2] && this.selectOption(options[2]));
    }

    selectOption(opt) {
        if (opt.cost) {
            if (this.playerStats.gold >= opt.cost) {
                this.playerStats.gold -= opt.cost;
                if (opt.item.type === 'weapon') {
                    this.equipment.weapon = opt.item;
                } else if (opt.item.type === 'armor') {
                    this.equipment.body = opt.item;
                    this.playerStats.armor = opt.item.armor;
                } else {
                    this.inventory.push(opt.item);
                }
            }
        } else if (opt.quest) {
            this.quests.push(opt.quest);
            this.activeQuest = opt.quest;
            this.updateQuestDisplay();
        }
        this.closeDialogue();
    }

    closeDialogue() {
        if (this.dialogueUI) {
            Object.values(this.dialogueUI).forEach(el => {
                if (Array.isArray(el)) el.forEach(e => e.destroy());
                else el.destroy();
            });
            this.dialogueUI = null;
        }
        this.physics.resume();
    }

    getAvailableQuest(townName) {
        // Generate quests based on town
        const questTemplates = [
            { name: 'Wolf Problem', description: 'Kill 5 wolves near the town', target: 5, enemyType: 'wolf', reward: { gold: 75, xp: 40 } },
            { name: 'Bandit Trouble', description: 'Clear out the nearby bandit camp', target: 3, enemyType: 'bandit', reward: { gold: 100, xp: 60 } },
            { name: 'Bear Hunt', description: 'Slay the dangerous bear', target: 1, enemyType: 'bear', reward: { gold: 150, xp: 80 } }
        ];

        // Return a random quest not already active
        const available = questTemplates.filter(q =>
            !this.quests.find(active => active.name === q.name)
        );

        if (available.length > 0) {
            const q = Phaser.Utils.Array.GetRandom(available);
            return { ...q, id: `quest_${Date.now()}`, type: 'side', completed: false };
        }
        return null;
    }

    enterDungeon(dungeon) {
        if (dungeon.cleared) {
            this.showMessage('This dungeon has been cleared.');
            return;
        }

        // Launch dungeon scene
        this.scene.start('DungeonScene', {
            dungeon,
            playerStats: this.playerStats,
            equipment: this.equipment,
            inventory: this.inventory,
            quests: this.quests,
            dungeonsCleared: this.dungeonsCleared
        });
    }

    showMessage(text) {
        const msg = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            text, {
                fontSize: '18px',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(400);

        this.time.delayedCall(2000, () => msg.destroy());
    }

    handleUIInput() {
        // Inventory
        if (Phaser.Input.Keyboard.JustDown(this.keys.i)) {
            if (this.showingInventory) {
                this.closeInventory();
            } else {
                this.openInventory();
            }
        }

        // Quest log
        if (Phaser.Input.Keyboard.JustDown(this.keys.q)) {
            if (this.showingQuests) {
                this.closeQuestLog();
            } else {
                this.openQuestLog();
            }
        }

        // Use potions
        if (Phaser.Input.Keyboard.JustDown(this.keys.one)) {
            this.usePotion(0);
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.two)) {
            this.usePotion(1);
        }
    }

    usePotion(index) {
        const potions = this.inventory.filter(i => i.type === 'potion');
        if (potions[index]) {
            const potion = potions[index];
            if (potion.effect === 'heal') {
                this.playerStats.hp = Math.min(
                    this.playerStats.maxHp,
                    this.playerStats.hp + potion.value
                );
            } else if (potion.effect === 'stamina') {
                this.playerStats.stamina = Math.min(
                    this.playerStats.maxStamina,
                    this.playerStats.stamina + potion.value
                );
            }
            // Remove from inventory
            const idx = this.inventory.indexOf(potion);
            if (idx > -1) this.inventory.splice(idx, 1);
        }
    }

    openInventory() {
        this.showingInventory = true;
        this.physics.pause();

        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        this.invUI = [];

        const bg = this.add.rectangle(cx, cy, 350, 300, 0x222233, 0.95)
            .setScrollFactor(0).setDepth(400);
        this.invUI.push(bg);

        const title = this.add.text(cx, cy - 130, 'INVENTORY', {
            fontSize: '20px',
            color: '#ffdd88'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(401);
        this.invUI.push(title);

        // Equipment
        const eqTitle = this.add.text(cx - 150, cy - 100, 'Equipment:', {
            fontSize: '14px',
            color: '#88aaff'
        }).setScrollFactor(0).setDepth(401);
        this.invUI.push(eqTitle);

        const eqList = [
            `Weapon: ${this.equipment.weapon?.name || 'None'} (${this.equipment.weapon?.damage || 0} dmg)`,
            `Body: ${this.equipment.body?.name || 'None'} (${this.equipment.body?.armor || 0} armor)`,
            `Head: ${this.equipment.head?.name || 'None'}`,
            `Ring: ${this.equipment.ring?.name || 'None'}`
        ];

        eqList.forEach((eq, i) => {
            const t = this.add.text(cx - 150, cy - 80 + i * 20, eq, {
                fontSize: '12px',
                color: '#ffffff'
            }).setScrollFactor(0).setDepth(401);
            this.invUI.push(t);
        });

        // Items
        const itemTitle = this.add.text(cx - 150, cy + 10, 'Items:', {
            fontSize: '14px',
            color: '#88aaff'
        }).setScrollFactor(0).setDepth(401);
        this.invUI.push(itemTitle);

        this.inventory.slice(0, 6).forEach((item, i) => {
            const t = this.add.text(cx - 150, cy + 30 + i * 18, `[${i + 1}] ${item.name}`, {
                fontSize: '12px',
                color: '#ffffff'
            }).setScrollFactor(0).setDepth(401);
            this.invUI.push(t);
        });

        const close = this.add.text(cx, cy + 130, '[I] Close', {
            fontSize: '14px',
            color: '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(401);
        this.invUI.push(close);
    }

    closeInventory() {
        this.showingInventory = false;
        this.physics.resume();
        if (this.invUI) {
            this.invUI.forEach(el => el.destroy());
            this.invUI = null;
        }
    }

    openQuestLog() {
        this.showingQuests = true;
        this.physics.pause();

        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        this.questUI = [];

        const bg = this.add.rectangle(cx, cy, 350, 280, 0x222233, 0.95)
            .setScrollFactor(0).setDepth(400);
        this.questUI.push(bg);

        const title = this.add.text(cx, cy - 120, 'QUEST LOG', {
            fontSize: '20px',
            color: '#ffdd88'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(401);
        this.questUI.push(title);

        let yOffset = cy - 90;
        this.quests.forEach((quest, i) => {
            const status = quest.completed ? '[DONE]' : '[ACTIVE]';
            const color = quest.completed ? '#88ff88' : '#ffffff';
            const t = this.add.text(cx - 150, yOffset, `${status} ${quest.name}`, {
                fontSize: '14px',
                color
            }).setScrollFactor(0).setDepth(401);
            this.questUI.push(t);

            const desc = this.add.text(cx - 140, yOffset + 16, quest.description, {
                fontSize: '11px',
                color: '#aaaaaa',
                wordWrap: { width: 280 }
            }).setScrollFactor(0).setDepth(401);
            this.questUI.push(desc);

            yOffset += 50;
        });

        const close = this.add.text(cx, cy + 120, '[Q] Close', {
            fontSize: '14px',
            color: '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(401);
        this.questUI.push(close);
    }

    closeQuestLog() {
        this.showingQuests = false;
        this.physics.resume();
        if (this.questUI) {
            this.questUI.forEach(el => el.destroy());
            this.questUI = null;
        }
    }

    updateHUD() {
        const hpPercent = this.playerStats.hp / this.playerStats.maxHp;
        this.hpBar.width = 100 * hpPercent;

        const stamPercent = this.playerStats.stamina / this.playerStats.maxStamina;
        this.staminaBar.width = 100 * stamPercent;

        this.goldText.setText(`Gold: ${this.playerStats.gold}`);
        this.levelText.setText(`Level: ${this.playerStats.level} (${this.playerStats.xp}/${this.playerStats.xpToLevel} XP)`);
    }
}

class DungeonScene extends Phaser.Scene {
    constructor() {
        super('DungeonScene');
    }

    init(data) {
        this.dungeon = data.dungeon;
        this.playerStats = data.playerStats;
        this.equipment = data.equipment;
        this.inventory = data.inventory;
        this.quests = data.quests;
        this.dungeonsCleared = data.dungeonsCleared;
    }

    create() {
        // Dungeon size based on tier
        this.dungeonWidth = 600 + this.dungeon.tier * 200;
        this.dungeonHeight = 400 + this.dungeon.tier * 150;

        // Background
        for (let y = 0; y < this.dungeonHeight; y += 16) {
            for (let x = 0; x < this.dungeonWidth; x += 16) {
                this.add.rectangle(x + 8, y + 8, 16, 16, 0x2a2a3a).setDepth(0);
            }
        }

        // Walls
        this.walls = this.physics.add.staticGroup();
        for (let x = 0; x < this.dungeonWidth; x += 16) {
            this.walls.create(x + 8, 8, null).setSize(16, 16).setVisible(false).refreshBody();
            this.walls.create(x + 8, this.dungeonHeight - 8, null).setSize(16, 16).setVisible(false).refreshBody();
            this.add.rectangle(x + 8, 8, 16, 16, 0x4a4a5a);
            this.add.rectangle(x + 8, this.dungeonHeight - 8, 16, 16, 0x4a4a5a);
        }
        for (let y = 0; y < this.dungeonHeight; y += 16) {
            this.walls.create(8, y + 8, null).setSize(16, 16).setVisible(false).refreshBody();
            this.walls.create(this.dungeonWidth - 8, y + 8, null).setSize(16, 16).setVisible(false).refreshBody();
            this.add.rectangle(8, y + 8, 16, 16, 0x4a4a5a);
            this.add.rectangle(this.dungeonWidth - 8, y + 8, 16, 16, 0x4a4a5a);
        }

        // Player
        this.player = this.physics.add.sprite(80, this.dungeonHeight / 2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Enemies
        this.enemies = this.physics.add.group();
        this.spawnDungeonEnemies();

        // Boss
        this.boss = this.spawnBoss();

        // Exit (blocked until boss dead)
        this.exit = this.add.rectangle(this.dungeonWidth - 40, this.dungeonHeight / 2, 32, 48, 0x00ff00, 0.5);
        this.physics.add.existing(this.exit, true);
        this.exitActive = false;

        // Camera
        this.cameras.main.setBounds(0, 0, this.dungeonWidth, this.dungeonHeight);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.physics.world.setBounds(0, 0, this.dungeonWidth, this.dungeonHeight);

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.overlap(this.player, this.enemies, this.handleEnemyCollision, null, this);
        this.physics.add.overlap(this.player, this.exit, this.handleExit, null, this);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.keys = this.input.keyboard.addKeys({
            space: 'SPACE',
            shift: 'SHIFT',
            escape: 'ESC'
        });

        // Combat state
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.iFrames = 0;

        // HUD
        this.createHUD();

        // Damage overlay
        this.damageOverlay = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0xff0000, 0
        ).setScrollFactor(0).setDepth(100);
    }

    spawnDungeonEnemies() {
        const numEnemies = 5 + this.dungeon.tier * 3;
        const enemyTypes = {
            forest: ['bandit'],
            snow: ['draugr'],
            mountain: ['troll']
        };
        const types = enemyTypes[this.dungeon.biome] || ['bandit'];

        for (let i = 0; i < numEnemies; i++) {
            const x = Phaser.Math.Between(100, this.dungeonWidth - 100);
            const y = Phaser.Math.Between(50, this.dungeonHeight - 50);
            const type = Phaser.Utils.Array.GetRandom(types);
            this.spawnEnemy(x, y, type);
        }
    }

    spawnEnemy(x, y, type) {
        const stats = {
            bandit: { hp: 40, damage: 8, speed: 50, xp: 20 },
            draugr: { hp: 50, damage: 10, speed: 40, xp: 30 },
            troll: { hp: 80, damage: 15, speed: 35, xp: 50 }
        };

        const enemy = this.enemies.create(x, y, type);
        enemy.type = type;
        enemy.hp = stats[type].hp * (1 + this.dungeon.tier * 0.2);
        enemy.maxHp = enemy.hp;
        enemy.damage = stats[type].damage * (1 + this.dungeon.tier * 0.1);
        enemy.speed = stats[type].speed;
        enemy.xpValue = stats[type].xp * this.dungeon.tier;
        enemy.attackCooldown = 0;

        return enemy;
    }

    spawnBoss() {
        const bossStats = {
            1: { hp: 150, damage: 15, name: 'Bandit Chief' },
            2: { hp: 200, damage: 20, name: 'Draugr Overlord' },
            3: { hp: 300, damage: 25, name: 'Dwarven Centurion' }
        };

        const stat = bossStats[this.dungeon.tier];
        const boss = this.physics.add.sprite(this.dungeonWidth - 100, this.dungeonHeight / 2, 'boss');
        boss.setScale(1.5);
        boss.hp = stat.hp;
        boss.maxHp = stat.hp;
        boss.damage = stat.damage;
        boss.name = stat.name;
        boss.xpValue = 100 * this.dungeon.tier;
        boss.attackCooldown = 0;
        boss.isBoss = true;

        this.enemies.add(boss);

        // Boss health bar
        this.bossHpBg = this.add.rectangle(this.cameras.main.width / 2, 30, 204, 18, 0x333333)
            .setScrollFactor(0).setDepth(200);
        this.bossHpBar = this.add.rectangle(this.cameras.main.width / 2 - 100, 30, 200, 14, 0xff0000)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(201);
        this.bossNameText = this.add.text(this.cameras.main.width / 2, 50, stat.name, {
            fontSize: '14px',
            color: '#ff8888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        return boss;
    }

    createHUD() {
        this.add.rectangle(10, 10, 104, 14, 0x333333).setOrigin(0).setScrollFactor(0).setDepth(200);
        this.hpBar = this.add.rectangle(12, 12, 100, 10, 0xff4444).setOrigin(0).setScrollFactor(0).setDepth(201);

        this.add.rectangle(10, 28, 104, 14, 0x333333).setOrigin(0).setScrollFactor(0).setDepth(200);
        this.staminaBar = this.add.rectangle(12, 30, 100, 10, 0x44ff44).setOrigin(0).setScrollFactor(0).setDepth(201);

        this.dungeonText = this.add.text(10, 50, this.dungeon.name, {
            fontSize: '14px',
            color: '#ff8888'
        }).setScrollFactor(0).setDepth(200);

        this.escText = this.add.text(10, this.cameras.main.height - 20, '[ESC] Leave Dungeon', {
            fontSize: '12px',
            color: '#888888'
        }).setScrollFactor(0).setDepth(200);
    }

    update(time, delta) {
        this.handleMovement(delta);
        this.handleCombat(delta);
        this.updateEnemies(delta);
        this.updateHUD();

        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        if (this.iFrames > 0) this.iFrames -= delta;

        // Stamina regen
        if (!this.keys.shift.isDown) {
            this.playerStats.stamina = Math.min(
                this.playerStats.maxStamina,
                this.playerStats.stamina + delta * 0.02
            );
        }

        // Damage overlay fade
        if (this.damageOverlay.alpha > 0) {
            this.damageOverlay.alpha -= delta * 0.003;
        }

        // Escape to leave
        if (Phaser.Input.Keyboard.JustDown(this.keys.escape)) {
            this.returnToOverworld();
        }

        // Check if boss dead
        if (this.boss && !this.boss.active) {
            this.exitActive = true;
            this.exit.fillColor = 0x00ff00;
        }

        this.player.setDepth(this.player.y);
    }

    handleMovement(delta) {
        const speed = this.keys.shift.isDown && this.playerStats.stamina > 0 ? 140 : 80;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -speed;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed;
        if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -speed;
        if (this.cursors.down.isDown || this.wasd.S.isDown) vy = speed;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx, vy);

        if (vx > 0) this.player.facingRight = true;
        else if (vx < 0) this.player.facingRight = false;

        if (this.keys.shift.isDown && (vx !== 0 || vy !== 0)) {
            this.playerStats.stamina = Math.max(0, this.playerStats.stamina - delta * 0.05);
        }
    }

    handleCombat(delta) {
        if (Phaser.Input.Keyboard.JustDown(this.keys.space) && this.attackCooldown <= 0) {
            this.attack();
        }
    }

    attack() {
        if (this.isAttacking) return;

        this.isAttacking = true;
        this.attackCooldown = 400;

        const dir = this.player.facingRight ? 1 : -1;
        const attackX = this.player.x + dir * 20;
        const attackY = this.player.y;

        const swing = this.add.image(attackX, attackY, 'swingEffect')
            .setFlipX(!this.player.facingRight)
            .setDepth(1000)
            .setAlpha(0.7);

        this.tweens.add({
            targets: swing,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 200,
            onComplete: () => swing.destroy()
        });

        const damage = this.playerStats.damage + (this.equipment.weapon?.damage || 0);

        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(attackX, attackY, enemy.x, enemy.y);
            if (dist < 40) {
                this.damageEnemy(enemy, damage);
            }
        });

        this.time.delayedCall(300, () => {
            this.isAttacking = false;
        });
    }

    damageEnemy(enemy, damage) {
        enemy.hp -= damage;

        const hitFx = this.add.image(enemy.x, enemy.y, 'hitEffect').setDepth(1000);
        this.tweens.add({
            targets: hitFx,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 200,
            onComplete: () => hitFx.destroy()
        });

        const dmgText = this.add.text(enemy.x, enemy.y - 20, `-${damage}`, {
            fontSize: '14px',
            color: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1000);

        this.tweens.add({
            targets: dmgText,
            y: enemy.y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => dmgText.destroy()
        });

        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => enemy.clearTint());

        // Update boss HP bar
        if (enemy.isBoss && this.bossHpBar) {
            this.bossHpBar.width = 200 * (enemy.hp / enemy.maxHp);
        }

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        this.playerStats.xp += enemy.xpValue;
        this.playerStats.gold += Phaser.Math.Between(10, 30);

        const xpText = this.add.text(enemy.x, enemy.y, `+${enemy.xpValue} XP`, {
            fontSize: '12px',
            color: '#88aaff'
        }).setOrigin(0.5).setDepth(1000);

        this.tweens.add({
            targets: xpText,
            y: enemy.y - 40,
            alpha: 0,
            duration: 1000,
            onComplete: () => xpText.destroy()
        });

        if (this.playerStats.xp >= this.playerStats.xpToLevel) {
            this.levelUp();
        }

        if (enemy.isBoss) {
            this.boss = null;
            this.bossHpBg.setVisible(false);
            this.bossHpBar.setVisible(false);
            this.bossNameText.setVisible(false);

            // Boss loot
            this.playerStats.gold += 100 * this.dungeon.tier;

            // Show message
            const victoryText = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2,
                `${enemy.name} DEFEATED!\n\nExit is now open!`, {
                    fontSize: '24px',
                    color: '#ffdd00',
                    align: 'center'
                }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(300);

            this.time.delayedCall(3000, () => victoryText.destroy());
        }

        this.tweens.add({
            targets: enemy,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 300,
            onComplete: () => enemy.destroy()
        });
    }

    levelUp() {
        this.playerStats.level++;
        this.playerStats.xp -= this.playerStats.xpToLevel;
        this.playerStats.xpToLevel = Math.floor(this.playerStats.xpToLevel * 1.5);
        this.playerStats.maxHp += 10;
        this.playerStats.hp = this.playerStats.maxHp;
        this.playerStats.damage += 2;

        const levelText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            'LEVEL UP!', {
                fontSize: '32px',
                color: '#ffdd00',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(300);

        this.tweens.add({
            targets: levelText,
            y: levelText.y - 30,
            alpha: 0,
            duration: 2000,
            onComplete: () => levelText.destroy()
        });
    }

    updateEnemies(delta) {
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.attackCooldown > 0) enemy.attackCooldown -= delta;

            const distToPlayer = Phaser.Math.Distance.Between(
                enemy.x, enemy.y, this.player.x, this.player.y
            );

            // Always chase in dungeon
            const angle = Phaser.Math.Angle.Between(
                enemy.x, enemy.y, this.player.x, this.player.y
            );
            const speed = enemy.isBoss ? 40 : (enemy.speed || 50);
            enemy.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );

            if (distToPlayer < 30 && enemy.attackCooldown <= 0) {
                this.enemyAttack(enemy);
            }

            enemy.setDepth(enemy.y);
        });
    }

    enemyAttack(enemy) {
        enemy.attackCooldown = 1000;

        if (this.iFrames > 0) return;

        const damage = Math.max(1, enemy.damage - this.playerStats.armor);
        this.playerStats.hp -= damage;
        this.iFrames = 500;

        const dmgText = this.add.text(this.player.x, this.player.y - 20, `-${damage}`, {
            fontSize: '16px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1000);

        this.tweens.add({
            targets: dmgText,
            y: this.player.y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => dmgText.destroy()
        });

        this.damageOverlay.alpha = 0.3;
        this.cameras.main.shake(100, 0.01);
        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => this.player.clearTint());

        if (this.playerStats.hp <= 0) {
            this.scene.start('GameOverScene', { won: false, stats: this.playerStats });
        }
    }

    handleEnemyCollision(player, enemy) {
        if (this.iFrames <= 0) {
            this.enemyAttack(enemy);
        }
    }

    handleExit(player, exit) {
        if (this.exitActive) {
            this.dungeon.cleared = true;
            this.dungeonsCleared++;

            // Complete quest if applicable
            const quest = this.quests.find(q => q.target === this.dungeon.name.toLowerCase().replace(' ', ''));
            if (quest) {
                quest.completed = true;
                this.playerStats.gold += quest.reward.gold;
                this.playerStats.xp += quest.reward.xp;
            }

            this.returnToOverworld();
        }
    }

    returnToOverworld() {
        this.scene.start('GameScene');
    }

    updateHUD() {
        const hpPercent = this.playerStats.hp / this.playerStats.maxHp;
        this.hpBar.width = 100 * hpPercent;

        const stamPercent = this.playerStats.stamina / this.playerStats.maxStamina;
        this.staminaBar.width = 100 * stamPercent;
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.won = data.won;
        this.stats = data.stats;
    }

    create() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        this.cameras.main.setBackgroundColor('#1a0a0a');

        this.add.text(cx, cy - 80, 'YOU DIED', {
            fontSize: '48px',
            fontFamily: 'Georgia, serif',
            color: '#aa0000'
        }).setOrigin(0.5);

        const stats = [
            `Level Reached: ${this.stats.level}`,
            `Gold Collected: ${this.stats.gold}`,
            `Final HP: ${Math.max(0, this.stats.hp)}/${this.stats.maxHp}`
        ];

        stats.forEach((line, i) => {
            this.add.text(cx, cy + i * 25, line, {
                fontSize: '16px',
                color: '#888888'
            }).setOrigin(0.5);
        });

        this.add.text(cx, cy + 120, 'Press SPACE to Try Again', {
            fontSize: '18px',
            color: '#ff8888'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('GameScene'));
        this.input.once('pointerdown', () => this.scene.start('GameScene'));
    }
}

class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    init(data) {
        this.stats = data.stats;
    }

    create() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        this.cameras.main.setBackgroundColor('#1a2a1a');

        this.add.text(cx, cy - 100, 'VICTORY!', {
            fontSize: '48px',
            fontFamily: 'Georgia, serif',
            color: '#ffdd00'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 50, 'You have cleared all dungeons!', {
            fontSize: '20px',
            color: '#88ff88'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 10, 'The land of Skyrim is saved!', {
            fontSize: '16px',
            color: '#aabbaa'
        }).setOrigin(0.5);

        const stats = [
            `Final Level: ${this.stats.level}`,
            `Gold Collected: ${this.stats.gold}`,
            `HP: ${this.stats.hp}/${this.stats.maxHp}`
        ];

        stats.forEach((line, i) => {
            this.add.text(cx, cy + 40 + i * 25, line, {
                fontSize: '16px',
                color: '#888888'
            }).setOrigin(0.5);
        });

        this.add.text(cx, cy + 140, 'Press SPACE to Play Again', {
            fontSize: '18px',
            color: '#ffdd88'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => this.scene.start('MenuScene'));
        this.input.once('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Config at end
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, DungeonScene, GameOverScene, VictoryScene]
};

const game = new Phaser.Game(config);
