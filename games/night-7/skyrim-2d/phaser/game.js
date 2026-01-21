// Frostfall - 2D Skyrim Demake
// Built with Phaser 3

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Player sprite (16x24)
        g.fillStyle(0x4488aa);
        g.fillRect(2, 0, 12, 6); // Head
        g.fillStyle(0x6644aa);
        g.fillRect(1, 6, 14, 12); // Body/armor
        g.fillStyle(0x333366);
        g.fillRect(3, 18, 4, 6); // Left leg
        g.fillRect(9, 18, 4, 6); // Right leg
        g.fillStyle(0xddccaa);
        g.fillRect(4, 1, 3, 4); // Face
        g.fillRect(9, 1, 3, 4);
        g.generateTexture('player', 16, 24);
        g.clear();

        // Enemy - Wolf
        g.fillStyle(0x666666);
        g.fillRect(2, 4, 12, 8);
        g.fillStyle(0x555555);
        g.fillRect(0, 6, 4, 4);
        g.fillRect(12, 6, 4, 4);
        g.fillStyle(0xff4444);
        g.fillRect(3, 5, 2, 2);
        g.fillRect(9, 5, 2, 2);
        g.generateTexture('wolf', 16, 16);
        g.clear();

        // Enemy - Bandit
        g.fillStyle(0x885533);
        g.fillRect(2, 0, 12, 6);
        g.fillStyle(0x553322);
        g.fillRect(1, 6, 14, 12);
        g.fillRect(3, 18, 4, 6);
        g.fillRect(9, 18, 4, 6);
        g.fillStyle(0xddccaa);
        g.fillRect(4, 1, 3, 4);
        g.fillRect(9, 1, 3, 4);
        g.generateTexture('bandit', 16, 24);
        g.clear();

        // Enemy - Draugr (undead)
        g.fillStyle(0x446688);
        g.fillRect(2, 0, 12, 6);
        g.fillStyle(0x334455);
        g.fillRect(1, 6, 14, 12);
        g.fillRect(3, 18, 4, 6);
        g.fillRect(9, 18, 4, 6);
        g.fillStyle(0x88aacc);
        g.fillRect(4, 1, 2, 3);
        g.fillRect(10, 1, 2, 3);
        g.generateTexture('draugr', 16, 24);
        g.clear();

        // Boss
        g.fillStyle(0xaa2222);
        g.fillRect(4, 0, 24, 12);
        g.fillStyle(0x881111);
        g.fillRect(2, 12, 28, 16);
        g.fillRect(6, 28, 8, 8);
        g.fillRect(18, 28, 8, 8);
        g.fillStyle(0xffff00);
        g.fillRect(10, 4, 4, 4);
        g.fillRect(18, 4, 4, 4);
        g.generateTexture('boss', 32, 36);
        g.clear();

        // Grass tile
        g.fillStyle(0x3a5a3a);
        g.fillRect(0, 0, 16, 16);
        g.fillStyle(0x4a6a4a);
        g.fillRect(2, 2, 3, 3);
        g.fillRect(10, 8, 3, 3);
        g.fillRect(5, 12, 3, 3);
        g.generateTexture('grass', 16, 16);
        g.clear();

        // Snow tile
        g.fillStyle(0xccddee);
        g.fillRect(0, 0, 16, 16);
        g.fillStyle(0xddeeff);
        g.fillRect(2, 2, 4, 4);
        g.fillRect(10, 8, 4, 4);
        g.generateTexture('snow', 16, 16);
        g.clear();

        // Mountain tile
        g.fillStyle(0x555566);
        g.fillRect(0, 0, 16, 16);
        g.fillStyle(0x666677);
        g.fillRect(4, 4, 8, 8);
        g.generateTexture('mountain', 16, 16);
        g.clear();

        // Stone floor (dungeon)
        g.fillStyle(0x444455);
        g.fillRect(0, 0, 16, 16);
        g.lineStyle(1, 0x333344);
        g.strokeRect(0, 0, 16, 16);
        g.generateTexture('stone', 16, 16);
        g.clear();

        // Wall
        g.fillStyle(0x333344);
        g.fillRect(0, 0, 16, 16);
        g.fillStyle(0x444455);
        g.fillRect(2, 2, 12, 6);
        g.generateTexture('wall', 16, 16);
        g.clear();

        // Tree
        g.fillStyle(0x553311);
        g.fillRect(6, 12, 4, 8);
        g.fillStyle(0x226622);
        g.fillCircle(8, 8, 8);
        g.generateTexture('tree', 16, 20);
        g.clear();

        // House
        g.fillStyle(0x664422);
        g.fillRect(0, 8, 32, 24);
        g.fillStyle(0x883322);
        g.fillTriangle(16, 0, 0, 10, 32, 10);
        g.fillStyle(0x442211);
        g.fillRect(12, 18, 8, 14);
        g.generateTexture('house', 32, 32);
        g.clear();

        // NPC
        g.fillStyle(0x8866aa);
        g.fillRect(2, 0, 12, 6);
        g.fillStyle(0x996688);
        g.fillRect(1, 6, 14, 12);
        g.fillRect(3, 18, 4, 6);
        g.fillRect(9, 18, 4, 6);
        g.fillStyle(0xddccaa);
        g.fillRect(4, 1, 3, 4);
        g.fillRect(9, 1, 3, 4);
        g.generateTexture('npc', 16, 24);
        g.clear();

        // Chest
        g.fillStyle(0x885522);
        g.fillRect(0, 4, 16, 12);
        g.fillStyle(0xaa7744);
        g.fillRect(2, 6, 12, 4);
        g.fillStyle(0xffdd44);
        g.fillRect(6, 8, 4, 4);
        g.generateTexture('chest', 16, 16);
        g.clear();

        // Door (dungeon entrance)
        g.fillStyle(0x222233);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x443322);
        g.fillRect(4, 4, 24, 28);
        g.fillStyle(0xffdd44);
        g.fillRect(20, 16, 4, 4);
        g.generateTexture('door', 32, 32);
        g.clear();

        // Health potion
        g.fillStyle(0xff4444);
        g.fillRect(4, 4, 8, 12);
        g.fillStyle(0xffffff);
        g.fillRect(5, 0, 6, 4);
        g.generateTexture('potion_health', 16, 16);
        g.clear();

        // Sword
        g.fillStyle(0xaaaaaa);
        g.fillRect(6, 0, 4, 12);
        g.fillStyle(0x664422);
        g.fillRect(4, 12, 8, 4);
        g.generateTexture('sword', 16, 16);
        g.clear();

        // Attack effect
        g.fillStyle(0xffffff, 0.5);
        g.slice(16, 16, 16, Phaser.Math.DegToRad(-45), Phaser.Math.DegToRad(45), false);
        g.fillPath();
        g.generateTexture('attack_effect', 32, 32);
        g.clear();

        // Quest marker
        g.fillStyle(0xffdd44);
        g.fillTriangle(8, 0, 0, 12, 16, 12);
        g.fillRect(6, 14, 4, 6);
        g.generateTexture('quest_marker', 16, 20);
        g.clear();

        // Town marker
        g.fillStyle(0x44aaff);
        g.fillCircle(8, 8, 6);
        g.fillStyle(0xffffff);
        g.fillCircle(8, 8, 3);
        g.generateTexture('town_marker', 16, 16);
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

        this.add.rectangle(cx, cy, 800, 600, 0x1a1a2e);

        // Mountain silhouette
        this.add.triangle(200, 400, 0, 200, 200, 0, 400, 200, 0x2a2a3e);
        this.add.triangle(500, 400, 0, 200, 250, 0, 500, 200, 0x252535);
        this.add.triangle(650, 400, 0, 200, 150, 0, 300, 200, 0x2a2a3e);

        // Title
        this.add.text(cx, 120, 'FROSTFALL', {
            fontSize: '72px',
            fontFamily: 'Georgia, serif',
            color: '#88ccff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(cx, 180, 'A 2D Skyrim Demake', {
            fontSize: '24px',
            fontFamily: 'Georgia, serif',
            color: '#6699bb'
        }).setOrigin(0.5);

        // Instructions
        const instructions = [
            'WASD - Move',
            'Left Click - Attack',
            'Shift - Dodge Roll',
            'E - Interact / Open Chest',
            'Tab - Inventory',
            '1-3 - Quick Use Items',
            '',
            'Explore the land, clear dungeons,',
            'and become a legendary hero!',
            '',
            'Click to begin your adventure'
        ];

        this.add.text(cx, 380, instructions.join('\n'), {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#aabbcc',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Constants
        this.TILE_SIZE = 16;
        this.WORLD_WIDTH = 100;
        this.WORLD_HEIGHT = 100;

        // Player stats
        this.player = {
            hp: 100, maxHp: 100,
            stamina: 100, maxStamina: 100,
            gold: 50,
            xp: 0, level: 1,
            damage: 10,
            armor: 0,
            inventory: [
                { type: 'potion_health', name: 'Health Potion', count: 3, effect: 'heal', value: 25 }
            ],
            weapon: { name: 'Iron Sword', damage: 8 },
            kills: 0
        };

        // Game state
        this.enemies = [];
        this.npcs = [];
        this.chests = [];
        this.dungeonEntrances = [];
        this.towns = [];
        this.quests = [
            { id: 1, name: 'Clear the Bandit Cave', type: 'clear_dungeon', target: 'bandit_cave', completed: false, reward: 100 },
            { id: 2, name: 'Slay 10 Wolves', type: 'kill', target: 'wolf', count: 0, required: 10, completed: false, reward: 50 },
            { id: 3, name: 'Defeat the Draugr Lord', type: 'boss', target: 'draugr_lord', completed: false, reward: 200 }
        ];
        this.activeQuest = this.quests[0];
        this.inDungeon = false;
        this.currentDungeon = null;
        this.dungeonCleared = {};

        // Camera bounds
        this.cameras.main.setBounds(0, 0, this.WORLD_WIDTH * this.TILE_SIZE, this.WORLD_HEIGHT * this.TILE_SIZE);

        // Create world
        this.generateWorld();

        // Player sprite
        this.playerSprite = this.physics.add.sprite(
            50 * this.TILE_SIZE,
            50 * this.TILE_SIZE,
            'player'
        );
        this.playerSprite.setCollideWorldBounds(true);
        this.playerSprite.setDepth(10);
        this.playerSprite.body.setSize(12, 12);
        this.playerSprite.body.setOffset(2, 12);

        this.cameras.main.startFollow(this.playerSprite);

        // Spawn initial content
        this.spawnWorldContent();

        // Create UI
        this.createUI();

        // Input
        this.setupInput();

        // Combat cooldown
        this.canAttack = true;
        this.attackCooldown = 300;

        // Dodge cooldown
        this.canDodge = true;
        this.dodgeCooldown = 500;
        this.isDodging = false;

        // Stamina regen
        this.time.addEvent({
            delay: 100,
            callback: () => {
                if (this.player.stamina < this.player.maxStamina && !this.isDodging) {
                    this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + 1);
                    this.updateUI();
                }
            },
            loop: true
        });

        // Damage flash
        this.damageOverlay = this.add.rectangle(400, 300, 800, 600, 0xff0000, 0)
            .setScrollFactor(0).setDepth(100);
    }

    generateWorld() {
        // Create biome map
        this.biomeMap = [];
        this.collisionMap = [];

        for (let y = 0; y < this.WORLD_HEIGHT; y++) {
            this.biomeMap[y] = [];
            this.collisionMap[y] = [];
            for (let x = 0; x < this.WORLD_WIDTH; x++) {
                // Determine biome based on position
                const distFromCenter = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));

                let biome;
                if (distFromCenter < 20) {
                    biome = 'forest';
                } else if (y < 40) {
                    biome = 'snow';
                } else if (distFromCenter > 40) {
                    biome = 'mountain';
                } else {
                    biome = 'forest';
                }

                this.biomeMap[y][x] = biome;
                this.collisionMap[y][x] = 0;

                // Add some obstacles
                if (Math.random() < 0.05 && distFromCenter > 5) {
                    this.collisionMap[y][x] = 1;
                }
            }
        }

        // Render tiles
        this.tileGroup = this.add.group();
        this.obstacleGroup = this.add.group();

        for (let y = 0; y < this.WORLD_HEIGHT; y++) {
            for (let x = 0; x < this.WORLD_WIDTH; x++) {
                let texture = 'grass';
                if (this.biomeMap[y][x] === 'snow') texture = 'snow';
                if (this.biomeMap[y][x] === 'mountain') texture = 'mountain';

                const tile = this.add.image(x * this.TILE_SIZE + 8, y * this.TILE_SIZE + 8, texture);
                this.tileGroup.add(tile);

                if (this.collisionMap[y][x] === 1) {
                    const tree = this.add.image(x * this.TILE_SIZE + 8, y * this.TILE_SIZE + 10, 'tree');
                    tree.setDepth(5);
                    this.obstacleGroup.add(tree);
                }
            }
        }

        // Create physics for obstacles
        this.obstacleColliders = this.physics.add.staticGroup();
        for (let y = 0; y < this.WORLD_HEIGHT; y++) {
            for (let x = 0; x < this.WORLD_WIDTH; x++) {
                if (this.collisionMap[y][x] === 1) {
                    const collider = this.obstacleColliders.create(
                        x * this.TILE_SIZE + 8,
                        y * this.TILE_SIZE + 8,
                        null
                    );
                    collider.setSize(12, 12);
                    collider.setVisible(false);
                }
            }
        }
    }

    spawnWorldContent() {
        // Spawn starting village
        this.createTown(50, 50, 'Riverwood', true);

        // Spawn other towns
        this.createTown(30, 30, 'Whiterun');
        this.createTown(70, 25, 'Winterhold');
        this.createTown(75, 70, 'Riften');
        this.createTown(25, 65, 'Markarth');

        // Spawn dungeon entrances
        this.createDungeonEntrance(40, 40, 'bandit_cave', 'Bandit Cave');
        this.createDungeonEntrance(35, 20, 'frost_tomb', 'Frost Tomb');
        this.createDungeonEntrance(65, 55, 'draugr_crypt', 'Draugr Crypt');

        // Spawn world enemies
        this.spawnWorldEnemies();

        // Spawn chests
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(10, 90);
            const y = Phaser.Math.Between(10, 90);
            if (this.collisionMap[y][x] === 0) {
                this.createChest(x, y);
            }
        }
    }

    createTown(x, y, name, isStarting = false) {
        // Clear area for town
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const tx = x + dx;
                const ty = y + dy;
                if (tx >= 0 && tx < this.WORLD_WIDTH && ty >= 0 && ty < this.WORLD_HEIGHT) {
                    this.collisionMap[ty][tx] = 0;
                }
            }
        }

        // House sprites
        const house = this.add.image(x * this.TILE_SIZE, y * this.TILE_SIZE, 'house').setDepth(5);

        // NPC
        const npc = this.physics.add.sprite(
            (x + 1) * this.TILE_SIZE,
            (y + 1) * this.TILE_SIZE,
            'npc'
        );
        npc.setImmovable(true);
        npc.name = name + ' Merchant';
        npc.isMerchant = true;
        npc.townName = name;
        npc.body.setSize(12, 12);
        npc.body.setOffset(2, 12);
        this.npcs.push(npc);

        // Quest marker if has quest
        const marker = this.add.image(npc.x, npc.y - 20, 'quest_marker').setDepth(15);
        npc.questMarker = marker;

        // Town label
        this.add.text(x * this.TILE_SIZE, (y - 2) * this.TILE_SIZE, name, {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(20);

        // Town marker for map reference
        this.towns.push({ x, y, name });

        // Create town markers pointing to nearby towns
        if (!isStarting) {
            const dirToStart = Math.atan2(50 - y, 50 - x);
            const markerDist = 8;
            const mx = x + Math.cos(dirToStart) * markerDist;
            const my = y + Math.sin(dirToStart) * markerDist;
            this.add.image(mx * this.TILE_SIZE, my * this.TILE_SIZE, 'town_marker').setDepth(3);
        }
    }

    createDungeonEntrance(x, y, id, name) {
        // Clear collision
        this.collisionMap[y][x] = 0;

        const door = this.physics.add.sprite(
            x * this.TILE_SIZE,
            y * this.TILE_SIZE,
            'door'
        );
        door.setImmovable(true);
        door.dungeonId = id;
        door.dungeonName = name;
        door.body.setSize(28, 28);

        this.dungeonEntrances.push(door);

        // Label
        this.add.text(x * this.TILE_SIZE, (y - 2) * this.TILE_SIZE, name, {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#ffaa44',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(20);
    }

    spawnWorldEnemies() {
        // Spawn wolves in forest
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(5, 95);
            const y = Phaser.Math.Between(5, 95);

            if (this.biomeMap[y][x] === 'forest' && this.collisionMap[y][x] === 0) {
                const distFromStart = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));
                if (distFromStart > 8) {
                    this.spawnEnemy(x, y, 'wolf', 25, 6);
                }
            }
        }

        // Spawn bandits
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(5, 95);
            const y = Phaser.Math.Between(5, 95);

            if (this.collisionMap[y][x] === 0) {
                const distFromStart = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));
                if (distFromStart > 15) {
                    this.spawnEnemy(x, y, 'bandit', 40, 8);
                }
            }
        }

        // Spawn draugr in snow
        for (let i = 0; i < 10; i++) {
            const x = Phaser.Math.Between(20, 80);
            const y = Phaser.Math.Between(5, 35);

            if (this.biomeMap[y][x] === 'snow' && this.collisionMap[y][x] === 0) {
                this.spawnEnemy(x, y, 'draugr', 50, 10);
            }
        }
    }

    spawnEnemy(tileX, tileY, type, hp, damage) {
        const enemy = this.physics.add.sprite(
            tileX * this.TILE_SIZE,
            tileY * this.TILE_SIZE,
            type
        );
        enemy.type = type;
        enemy.hp = hp;
        enemy.maxHp = hp;
        enemy.damage = damage;
        enemy.aggroRange = 80;
        enemy.attackRange = 20;
        enemy.attackCooldown = 0;
        enemy.speed = type === 'wolf' ? 60 : 40;
        enemy.body.setSize(12, 12);
        if (type !== 'wolf') {
            enemy.body.setOffset(2, 12);
        }
        enemy.setDepth(8);

        this.enemies.push(enemy);
        return enemy;
    }

    createChest(tileX, tileY) {
        const chest = this.physics.add.sprite(
            tileX * this.TILE_SIZE,
            tileY * this.TILE_SIZE,
            'chest'
        );
        chest.setImmovable(true);
        chest.opened = false;
        chest.body.setSize(14, 14);
        chest.setDepth(5);

        this.chests.push(chest);
    }

    createUI() {
        // HP Bar background
        this.add.rectangle(100, 560, 150, 16, 0x333333).setScrollFactor(0).setDepth(50);
        this.hpBar = this.add.rectangle(28, 560, 0, 12, 0xff4444).setScrollFactor(0).setDepth(51);
        this.hpBar.setOrigin(0, 0.5);

        // Stamina bar
        this.add.rectangle(100, 578, 150, 12, 0x333333).setScrollFactor(0).setDepth(50);
        this.staminaBar = this.add.rectangle(28, 578, 0, 8, 0x44ff44).setScrollFactor(0).setDepth(51);
        this.staminaBar.setOrigin(0, 0.5);

        // XP bar
        this.add.rectangle(100, 592, 150, 8, 0x333333).setScrollFactor(0).setDepth(50);
        this.xpBar = this.add.rectangle(28, 592, 0, 4, 0x4444ff).setScrollFactor(0).setDepth(51);
        this.xpBar.setOrigin(0, 0.5);

        // Stats text
        this.hpText = this.add.text(100, 560, '', {
            fontSize: '12px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52);

        this.levelText = this.add.text(28, 540, '', {
            fontSize: '14px', fontFamily: 'monospace', color: '#ffff44'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(52);

        this.goldText = this.add.text(200, 540, '', {
            fontSize: '14px', fontFamily: 'monospace', color: '#ffdd44'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(52);

        // Quest display
        this.questText = this.add.text(400, 20, '', {
            fontSize: '12px', fontFamily: 'monospace', color: '#ffdd44',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(52);

        // Interaction prompt
        this.interactText = this.add.text(400, 550, '', {
            fontSize: '14px', fontFamily: 'monospace', color: '#ffffff',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0).setDepth(52);

        // Quick slots
        for (let i = 0; i < 3; i++) {
            this.add.rectangle(650 + i * 40, 570, 32, 32, 0x333333, 0.8)
                .setScrollFactor(0).setDepth(50);
            this.add.text(650 + i * 40 - 12, 570 - 20, `${i + 1}`, {
                fontSize: '10px', fontFamily: 'monospace', color: '#888888'
            }).setScrollFactor(0).setDepth(51);
        }

        this.updateUI();
    }

    updateUI() {
        const hpPercent = this.player.hp / this.player.maxHp;
        this.hpBar.width = 144 * hpPercent;

        const stamPercent = this.player.stamina / this.player.maxStamina;
        this.staminaBar.width = 144 * stamPercent;

        const xpNeeded = this.player.level * 100;
        const xpPercent = this.player.xp / xpNeeded;
        this.xpBar.width = 144 * xpPercent;

        this.hpText.setText(`${this.player.hp}/${this.player.maxHp}`);
        this.levelText.setText(`Lv.${this.player.level}`);
        this.goldText.setText(`Gold: ${this.player.gold}`);

        // Update quest text
        if (this.activeQuest && !this.activeQuest.completed) {
            let questProgress = '';
            if (this.activeQuest.type === 'kill') {
                questProgress = ` (${this.activeQuest.count}/${this.activeQuest.required})`;
            }
            this.questText.setText(`Quest: ${this.activeQuest.name}${questProgress}`);
        } else {
            this.questText.setText('');
        }
    }

    setupInput() {
        this.keys = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            tab: Phaser.Input.Keyboard.KeyCodes.TAB,
            one: Phaser.Input.Keyboard.KeyCodes.ONE,
            two: Phaser.Input.Keyboard.KeyCodes.TWO,
            three: Phaser.Input.Keyboard.KeyCodes.THREE
        });

        // Attack on click
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.attack();
            }
        });

        // Prevent tab default
        this.input.keyboard.on('keydown-TAB', (event) => {
            event.preventDefault();
            this.toggleInventory();
        });

        // Quick use items
        this.input.keyboard.on('keydown-ONE', () => this.useQuickSlot(0));
        this.input.keyboard.on('keydown-TWO', () => this.useQuickSlot(1));
        this.input.keyboard.on('keydown-THREE', () => this.useQuickSlot(2));

        // Interact
        this.input.keyboard.on('keydown-E', () => this.interact());

        // Collisions
        this.physics.add.collider(this.playerSprite, this.obstacleColliders);
    }

    update(time, delta) {
        if (this.showingInventory || this.showingDialogue) return;

        this.handleMovement();
        this.updateEnemies();
        this.checkInteractions();
    }

    handleMovement() {
        const speed = 100;
        let vx = 0, vy = 0;

        if (this.isDodging) return;

        if (this.keys.w.isDown) vy -= speed;
        if (this.keys.s.isDown) vy += speed;
        if (this.keys.a.isDown) vx -= speed;
        if (this.keys.d.isDown) vx += speed;

        // Normalize diagonal
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        // Dodge roll
        if (this.keys.shift.isDown && this.canDodge && (vx !== 0 || vy !== 0) && this.player.stamina >= 20) {
            this.dodge(vx, vy);
            return;
        }

        this.playerSprite.setVelocity(vx, vy);

        // Flip sprite based on direction
        if (vx < 0) this.playerSprite.setFlipX(true);
        if (vx > 0) this.playerSprite.setFlipX(false);
    }

    dodge(vx, vy) {
        this.canDodge = false;
        this.isDodging = true;
        this.player.stamina -= 20;

        // Dodge in movement direction
        const dodgeSpeed = 200;
        const angle = Math.atan2(vy, vx);
        this.playerSprite.setVelocity(
            Math.cos(angle) * dodgeSpeed,
            Math.sin(angle) * dodgeSpeed
        );

        // Brief invincibility visual
        this.playerSprite.setAlpha(0.5);

        this.time.delayedCall(300, () => {
            this.isDodging = false;
            this.playerSprite.setAlpha(1);
            this.playerSprite.setVelocity(0, 0);
        });

        this.time.delayedCall(this.dodgeCooldown, () => {
            this.canDodge = true;
        });

        this.updateUI();
    }

    attack() {
        if (!this.canAttack) return;

        this.canAttack = false;

        // Get attack direction toward mouse
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(
            this.playerSprite.x, this.playerSprite.y,
            worldPoint.x, worldPoint.y
        );

        // Show attack effect
        const effect = this.add.image(
            this.playerSprite.x + Math.cos(angle) * 20,
            this.playerSprite.y + Math.sin(angle) * 20,
            'attack_effect'
        ).setRotation(angle).setDepth(20).setAlpha(0.7);

        this.time.delayedCall(150, () => effect.destroy());

        // Check for enemy hits
        const attackRange = 30;
        this.enemies.forEach(enemy => {
            if (!enemy.active) return;

            const dist = Phaser.Math.Distance.Between(
                this.playerSprite.x, this.playerSprite.y,
                enemy.x, enemy.y
            );

            if (dist < attackRange) {
                const angleToEnemy = Phaser.Math.Angle.Between(
                    this.playerSprite.x, this.playerSprite.y,
                    enemy.x, enemy.y
                );

                // Check if enemy is in attack arc
                const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angle - angleToEnemy));
                if (angleDiff < Math.PI / 3) {
                    this.hitEnemy(enemy);
                }
            }
        });

        this.time.delayedCall(this.attackCooldown, () => {
            this.canAttack = true;
        });
    }

    hitEnemy(enemy) {
        const damage = this.player.damage + this.player.weapon.damage;
        enemy.hp -= damage;

        // Show damage number
        const dmgText = this.add.text(enemy.x, enemy.y - 20, `-${damage}`, {
            fontSize: '16px', fontFamily: 'monospace', color: '#ff4444',
            stroke: '#000000', strokeThickness: 2
        }).setDepth(50);

        this.tweens.add({
            targets: dmgText,
            y: dmgText.y - 30,
            alpha: 0,
            duration: 600,
            onComplete: () => dmgText.destroy()
        });

        // Knockback
        const angle = Phaser.Math.Angle.Between(
            this.playerSprite.x, this.playerSprite.y,
            enemy.x, enemy.y
        );
        enemy.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.setVelocity(0, 0);
        });

        // Flash red
        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        // XP reward
        const xpReward = enemy.type === 'wolf' ? 10 : enemy.type === 'bandit' ? 20 : 30;
        this.gainXP(xpReward);

        // Gold drop
        const goldDrop = Phaser.Math.Between(5, 15);
        this.player.gold += goldDrop;

        // Quest progress
        if (this.activeQuest && this.activeQuest.type === 'kill' && this.activeQuest.target === enemy.type) {
            this.activeQuest.count++;
            if (this.activeQuest.count >= this.activeQuest.required) {
                this.completeQuest();
            }
        }

        this.player.kills++;

        // Remove enemy
        const index = this.enemies.indexOf(enemy);
        if (index > -1) this.enemies.splice(index, 1);
        enemy.destroy();

        this.updateUI();
    }

    gainXP(amount) {
        this.player.xp += amount;
        const xpNeeded = this.player.level * 100;

        if (this.player.xp >= xpNeeded) {
            this.player.xp -= xpNeeded;
            this.levelUp();
        }

        this.updateUI();
    }

    levelUp() {
        this.player.level++;
        this.player.maxHp += 10;
        this.player.hp = this.player.maxHp;
        this.player.damage += 2;

        // Show level up text
        const lvlText = this.add.text(400, 200, `LEVEL UP! (${this.player.level})`, {
            fontSize: '32px', fontFamily: 'Georgia', color: '#ffdd44',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        this.tweens.add({
            targets: lvlText,
            y: 150,
            alpha: 0,
            duration: 2000,
            onComplete: () => lvlText.destroy()
        });

        this.updateUI();
    }

    completeQuest() {
        this.activeQuest.completed = true;
        this.player.gold += this.activeQuest.reward;

        // Show completion
        const questText = this.add.text(400, 250, `Quest Complete: ${this.activeQuest.name}\n+${this.activeQuest.reward} Gold`, {
            fontSize: '20px', fontFamily: 'monospace', color: '#44ff44',
            stroke: '#000000', strokeThickness: 3, align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        this.tweens.add({
            targets: questText,
            alpha: 0,
            duration: 3000,
            onComplete: () => questText.destroy()
        });

        // Find next quest
        const nextQuest = this.quests.find(q => !q.completed);
        if (nextQuest) {
            this.activeQuest = nextQuest;
        } else {
            this.activeQuest = null;
            this.victory();
        }

        this.updateUI();
    }

    updateEnemies() {
        this.enemies.forEach(enemy => {
            if (!enemy.active) return;

            const dist = Phaser.Math.Distance.Between(
                enemy.x, enemy.y,
                this.playerSprite.x, this.playerSprite.y
            );

            enemy.attackCooldown -= 16;

            if (dist < enemy.aggroRange) {
                // Chase player
                const angle = Phaser.Math.Angle.Between(
                    enemy.x, enemy.y,
                    this.playerSprite.x, this.playerSprite.y
                );

                if (dist > enemy.attackRange) {
                    enemy.setVelocity(
                        Math.cos(angle) * enemy.speed,
                        Math.sin(angle) * enemy.speed
                    );
                } else {
                    enemy.setVelocity(0, 0);

                    // Attack if in range and cooldown ready
                    if (enemy.attackCooldown <= 0 && !this.isDodging) {
                        this.enemyAttack(enemy);
                        enemy.attackCooldown = 1000;
                    }
                }

                // Flip sprite
                if (this.playerSprite.x < enemy.x) enemy.setFlipX(true);
                else enemy.setFlipX(false);
            } else {
                enemy.setVelocity(0, 0);
            }
        });
    }

    enemyAttack(enemy) {
        const damage = enemy.damage;
        this.player.hp -= damage;

        // Damage feedback - screen flash
        this.damageOverlay.setAlpha(0.3);
        this.tweens.add({
            targets: this.damageOverlay,
            alpha: 0,
            duration: 200
        });

        // Screen shake
        this.cameras.main.shake(100, 0.01);

        // Flash player red
        this.playerSprite.setTint(0xff0000);
        this.time.delayedCall(100, () => this.playerSprite.clearTint());

        // Damage number
        const dmgText = this.add.text(this.playerSprite.x, this.playerSprite.y - 30, `-${damage}`, {
            fontSize: '18px', fontFamily: 'monospace', color: '#ff4444',
            stroke: '#000000', strokeThickness: 3
        }).setDepth(50);

        this.tweens.add({
            targets: dmgText,
            y: dmgText.y - 30,
            alpha: 0,
            duration: 600,
            onComplete: () => dmgText.destroy()
        });

        if (this.player.hp <= 0) {
            this.die();
        }

        this.updateUI();
    }

    checkInteractions() {
        let nearInteraction = null;

        // Check dungeon entrances
        this.dungeonEntrances.forEach(entrance => {
            const dist = Phaser.Math.Distance.Between(
                this.playerSprite.x, this.playerSprite.y,
                entrance.x, entrance.y
            );
            if (dist < 40) {
                nearInteraction = { type: 'dungeon', object: entrance };
            }
        });

        // Check NPCs
        this.npcs.forEach(npc => {
            const dist = Phaser.Math.Distance.Between(
                this.playerSprite.x, this.playerSprite.y,
                npc.x, npc.y
            );
            if (dist < 30) {
                nearInteraction = { type: 'npc', object: npc };
            }
        });

        // Check chests
        this.chests.forEach(chest => {
            if (chest.opened) return;
            const dist = Phaser.Math.Distance.Between(
                this.playerSprite.x, this.playerSprite.y,
                chest.x, chest.y
            );
            if (dist < 25) {
                nearInteraction = { type: 'chest', object: chest };
            }
        });

        this.nearInteraction = nearInteraction;

        if (nearInteraction) {
            if (nearInteraction.type === 'dungeon') {
                this.interactText.setText(`[E] Enter ${nearInteraction.object.dungeonName}`);
            } else if (nearInteraction.type === 'npc') {
                this.interactText.setText(`[E] Talk to ${nearInteraction.object.name}`);
            } else if (nearInteraction.type === 'chest') {
                this.interactText.setText('[E] Open Chest');
            }
        } else {
            this.interactText.setText('');
        }
    }

    interact() {
        if (!this.nearInteraction) return;

        if (this.nearInteraction.type === 'dungeon') {
            this.enterDungeon(this.nearInteraction.object);
        } else if (this.nearInteraction.type === 'npc') {
            this.talkToNPC(this.nearInteraction.object);
        } else if (this.nearInteraction.type === 'chest') {
            this.openChest(this.nearInteraction.object);
        }
    }

    enterDungeon(entrance) {
        // For MVP, just spawn enemies around the entrance area
        const dungeonId = entrance.dungeonId;

        if (this.dungeonCleared[dungeonId]) {
            this.showMessage('This dungeon has been cleared!');
            return;
        }

        // Spawn dungeon enemies near entrance
        const numEnemies = 5;
        for (let i = 0; i < numEnemies; i++) {
            const angle = (i / numEnemies) * Math.PI * 2;
            const dist = 50 + Math.random() * 30;
            const ex = entrance.x + Math.cos(angle) * dist;
            const ey = entrance.y + Math.sin(angle) * dist;

            const enemyType = dungeonId === 'frost_tomb' ? 'draugr' : 'bandit';
            const enemy = this.spawnEnemy(
                Math.floor(ex / this.TILE_SIZE),
                Math.floor(ey / this.TILE_SIZE),
                enemyType,
                enemyType === 'draugr' ? 60 : 50,
                enemyType === 'draugr' ? 12 : 10
            );
            enemy.dungeonId = dungeonId;
        }

        // Spawn boss
        const boss = this.physics.add.sprite(entrance.x, entrance.y - 60, 'boss');
        boss.type = 'boss';
        boss.hp = 150;
        boss.maxHp = 150;
        boss.damage = 20;
        boss.aggroRange = 120;
        boss.attackRange = 30;
        boss.attackCooldown = 0;
        boss.speed = 35;
        boss.dungeonId = dungeonId;
        boss.setDepth(8);
        this.enemies.push(boss);

        // Check boss death for quest
        const checkBoss = this.time.addEvent({
            delay: 500,
            callback: () => {
                const bossAlive = this.enemies.some(e => e.type === 'boss' && e.dungeonId === dungeonId);
                const minionsAlive = this.enemies.some(e => e.dungeonId === dungeonId);

                if (!bossAlive && !minionsAlive) {
                    this.dungeonCleared[dungeonId] = true;
                    this.showMessage(`${entrance.dungeonName} Cleared!`);

                    // Quest progress
                    if (this.activeQuest) {
                        if (this.activeQuest.type === 'clear_dungeon' && this.activeQuest.target === dungeonId) {
                            this.completeQuest();
                        } else if (this.activeQuest.type === 'boss') {
                            this.completeQuest();
                        }
                    }

                    checkBoss.destroy();
                }
            },
            loop: true
        });

        this.showMessage(`Entering ${entrance.dungeonName}...`);
    }

    talkToNPC(npc) {
        this.showingDialogue = true;

        // Create dialogue box
        const bg = this.add.rectangle(400, 450, 700, 150, 0x222233, 0.95)
            .setScrollFactor(0).setDepth(200);

        const nameText = this.add.text(80, 390, npc.name, {
            fontSize: '16px', fontFamily: 'Georgia', color: '#ffdd44'
        }).setScrollFactor(0).setDepth(201);

        const dialogue = npc.isMerchant ?
            '"Welcome, traveler! I can heal your wounds for 20 gold, or sell you potions."' :
            '"Safe travels, adventurer."';

        const dialogueText = this.add.text(80, 420, dialogue, {
            fontSize: '14px', fontFamily: 'monospace', color: '#ffffff',
            wordWrap: { width: 620 }
        }).setScrollFactor(0).setDepth(201);

        // Options
        const options = [];
        if (npc.isMerchant) {
            options.push({ text: '[1] Heal me (20 gold)', action: 'heal' });
            options.push({ text: '[2] Buy Health Potion (30 gold)', action: 'buy_potion' });
        }
        options.push({ text: '[3] Goodbye', action: 'close' });

        options.forEach((opt, i) => {
            const optText = this.add.text(80, 470 + i * 20, opt.text, {
                fontSize: '12px', fontFamily: 'monospace', color: '#aaffaa'
            }).setScrollFactor(0).setDepth(201);
            optText.action = opt.action;
        });

        // Close on key press
        const closeDialogue = () => {
            bg.destroy();
            nameText.destroy();
            dialogueText.destroy();
            this.showingDialogue = false;
        };

        this.input.keyboard.once('keydown-ONE', () => {
            if (npc.isMerchant && this.player.gold >= 20) {
                this.player.gold -= 20;
                this.player.hp = this.player.maxHp;
                this.showMessage('You feel refreshed!');
                this.updateUI();
            }
            closeDialogue();
        });

        this.input.keyboard.once('keydown-TWO', () => {
            if (npc.isMerchant && this.player.gold >= 30) {
                this.player.gold -= 30;
                const existing = this.player.inventory.find(i => i.type === 'potion_health');
                if (existing) existing.count++;
                else this.player.inventory.push({ type: 'potion_health', name: 'Health Potion', count: 1, effect: 'heal', value: 25 });
                this.showMessage('Bought Health Potion!');
                this.updateUI();
            }
            closeDialogue();
        });

        this.input.keyboard.once('keydown-THREE', closeDialogue);
        this.input.keyboard.once('keydown-ESC', closeDialogue);
        this.input.keyboard.once('keydown-E', closeDialogue);
    }

    openChest(chest) {
        chest.opened = true;
        chest.setTint(0x666666);

        // Random loot
        const goldFound = Phaser.Math.Between(10, 50);
        this.player.gold += goldFound;

        let message = `Found ${goldFound} gold`;

        if (Math.random() < 0.4) {
            const existing = this.player.inventory.find(i => i.type === 'potion_health');
            if (existing) existing.count++;
            else this.player.inventory.push({ type: 'potion_health', name: 'Health Potion', count: 1, effect: 'heal', value: 25 });
            message += ' and a Health Potion';
        }

        this.showMessage(message + '!');
        this.updateUI();
    }

    useQuickSlot(slot) {
        const potion = this.player.inventory.find(i => i.type === 'potion_health' && i.count > 0);
        if (potion && this.player.hp < this.player.maxHp) {
            potion.count--;
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + potion.value);
            this.showMessage(`+${potion.value} HP`);

            if (potion.count <= 0) {
                const index = this.player.inventory.indexOf(potion);
                this.player.inventory.splice(index, 1);
            }

            this.updateUI();
        }
    }

    toggleInventory() {
        if (this.showingInventory) {
            this.closeInventory();
        } else {
            this.openInventory();
        }
    }

    openInventory() {
        this.showingInventory = true;

        this.invBg = this.add.rectangle(400, 300, 400, 300, 0x222233, 0.95)
            .setScrollFactor(0).setDepth(200);

        this.add.text(400, 170, 'INVENTORY', {
            fontSize: '20px', fontFamily: 'Georgia', color: '#ffdd44'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        let y = 200;
        this.player.inventory.forEach(item => {
            this.add.text(250, y, `${item.name} x${item.count}`, {
                fontSize: '14px', fontFamily: 'monospace', color: '#ffffff'
            }).setScrollFactor(0).setDepth(201);
            y += 25;
        });

        // Stats
        this.add.text(250, 350, `Weapon: ${this.player.weapon.name} (${this.player.weapon.damage} dmg)`, {
            fontSize: '12px', fontFamily: 'monospace', color: '#aaaaaa'
        }).setScrollFactor(0).setDepth(201);

        this.add.text(250, 370, `Kills: ${this.player.kills}`, {
            fontSize: '12px', fontFamily: 'monospace', color: '#aaaaaa'
        }).setScrollFactor(0).setDepth(201);

        this.add.text(400, 420, 'Press TAB to close', {
            fontSize: '12px', fontFamily: 'monospace', color: '#666666'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    }

    closeInventory() {
        this.showingInventory = false;
        // Clear inventory UI elements (simplified - would need proper tracking)
        this.children.list
            .filter(c => c.depth >= 200 && c.depth <= 201)
            .forEach(c => c.destroy());
    }

    showMessage(text) {
        const msg = this.add.text(400, 100, text, {
            fontSize: '18px', fontFamily: 'monospace', color: '#ffffff',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        this.tweens.add({
            targets: msg,
            y: 80,
            alpha: 0,
            duration: 2000,
            onComplete: () => msg.destroy()
        });
    }

    die() {
        this.physics.pause();

        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8)
            .setScrollFactor(0).setDepth(300);

        this.add.text(400, 250, 'YOU DIED', {
            fontSize: '64px', fontFamily: 'Georgia', color: '#ff4444',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        this.add.text(400, 350, `Level ${this.player.level} | ${this.player.kills} Kills`, {
            fontSize: '20px', fontFamily: 'monospace', color: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        this.add.text(400, 450, 'Click to try again', {
            fontSize: '16px', fontFamily: 'monospace', color: '#666666'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }

    victory() {
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8)
            .setScrollFactor(0).setDepth(300);

        this.add.text(400, 200, 'VICTORY!', {
            fontSize: '64px', fontFamily: 'Georgia', color: '#ffdd44',
            stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        this.add.text(400, 280, 'You have completed all quests!', {
            fontSize: '20px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        this.add.text(400, 340, `Level ${this.player.level} | ${this.player.kills} Kills | ${this.player.gold} Gold`, {
            fontSize: '18px', fontFamily: 'monospace', color: '#aaaaaa'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        this.add.text(400, 450, 'Click to play again', {
            fontSize: '16px', fontFamily: 'monospace', color: '#666666'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }
}

// Phaser configuration - MUST be at end of file
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene],
    pixelArt: true
};

const game = new Phaser.Game(config);
