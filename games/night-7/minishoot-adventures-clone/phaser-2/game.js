// Minishoot Adventures Clone - Twin-Stick Shooter Adventure
// Built with Phaser 3

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Player ship (cute spaceship)
        const player = this.add.graphics();
        player.fillStyle(0x66aaff);
        player.fillCircle(16, 16, 14);
        player.fillStyle(0x88ccff);
        player.fillCircle(16, 12, 8);
        player.fillStyle(0xffffff);
        player.fillCircle(14, 10, 3);
        player.fillCircle(18, 10, 3);
        player.fillStyle(0x222244);
        player.fillCircle(14, 10, 1.5);
        player.fillCircle(18, 10, 1.5);
        player.generateTexture('player', 32, 32);
        player.destroy();

        // Player bullet
        const bullet = this.add.graphics();
        bullet.fillStyle(0xffff44);
        bullet.fillCircle(4, 4, 4);
        bullet.fillStyle(0xffffaa);
        bullet.fillCircle(4, 3, 2);
        bullet.generateTexture('bullet', 8, 8);
        bullet.destroy();

        // Supershot bullet
        const superBullet = this.add.graphics();
        superBullet.fillStyle(0x44aaff);
        superBullet.fillCircle(6, 6, 6);
        superBullet.fillStyle(0x88ddff);
        superBullet.fillCircle(6, 4, 3);
        superBullet.generateTexture('superBullet', 12, 12);
        superBullet.destroy();

        // Enemy bullet
        const enemyBullet = this.add.graphics();
        enemyBullet.fillStyle(0xff6644);
        enemyBullet.fillCircle(4, 4, 4);
        enemyBullet.generateTexture('enemyBullet', 8, 8);
        enemyBullet.destroy();

        // Enemy: Scout
        const scout = this.add.graphics();
        scout.fillStyle(0x44aa44);
        scout.fillCircle(12, 12, 10);
        scout.fillStyle(0xff4444);
        scout.fillCircle(8, 10, 2);
        scout.fillCircle(16, 10, 2);
        scout.generateTexture('scout', 24, 24);
        scout.destroy();

        // Enemy: Grasshopper
        const grasshopper = this.add.graphics();
        grasshopper.fillStyle(0x66cc66);
        grasshopper.fillCircle(14, 14, 12);
        grasshopper.fillStyle(0x88ff88);
        grasshopper.fillCircle(14, 10, 6);
        grasshopper.fillStyle(0xff0000);
        grasshopper.fillCircle(11, 9, 2);
        grasshopper.fillCircle(17, 9, 2);
        grasshopper.generateTexture('grasshopper', 28, 28);
        grasshopper.destroy();

        // Enemy: Turret
        const turret = this.add.graphics();
        turret.fillStyle(0x888888);
        turret.fillRect(4, 4, 24, 24);
        turret.fillStyle(0x666666);
        turret.fillCircle(16, 16, 8);
        turret.fillStyle(0xff4444);
        turret.fillCircle(16, 16, 4);
        turret.generateTexture('turret', 32, 32);
        turret.destroy();

        // Enemy: Burrower
        const burrower = this.add.graphics();
        burrower.fillStyle(0x8b4513);
        burrower.fillCircle(14, 14, 12);
        burrower.fillStyle(0xa0522d);
        burrower.fillCircle(14, 10, 5);
        burrower.fillStyle(0xff0000);
        burrower.fillCircle(14, 10, 2);
        burrower.generateTexture('burrower', 28, 28);
        burrower.destroy();

        // Enemy: Heavy
        const heavy = this.add.graphics();
        heavy.fillStyle(0x664466);
        heavy.fillCircle(18, 18, 16);
        heavy.fillStyle(0x886688);
        heavy.fillCircle(18, 14, 8);
        heavy.fillStyle(0xff0000);
        heavy.fillCircle(14, 12, 3);
        heavy.fillCircle(22, 12, 3);
        heavy.generateTexture('heavy', 36, 36);
        heavy.destroy();

        // Boss: Forest Guardian
        const forestBoss = this.add.graphics();
        forestBoss.fillStyle(0x226622);
        forestBoss.fillCircle(32, 32, 30);
        forestBoss.fillStyle(0x44aa44);
        forestBoss.fillCircle(32, 24, 16);
        forestBoss.fillStyle(0xffff00);
        forestBoss.fillCircle(24, 20, 6);
        forestBoss.fillCircle(40, 20, 6);
        forestBoss.fillStyle(0x000000);
        forestBoss.fillCircle(24, 20, 3);
        forestBoss.fillCircle(40, 20, 3);
        forestBoss.generateTexture('forestBoss', 64, 64);
        forestBoss.destroy();

        // Boss: Crystal Golem
        const crystalBoss = this.add.graphics();
        crystalBoss.fillStyle(0x4444aa);
        crystalBoss.fillCircle(32, 32, 30);
        crystalBoss.fillStyle(0x8888ff);
        crystalBoss.fillTriangle(20, 8, 12, 24, 28, 24);
        crystalBoss.fillTriangle(44, 8, 36, 24, 52, 24);
        crystalBoss.fillTriangle(32, 4, 24, 20, 40, 20);
        crystalBoss.fillStyle(0xff00ff);
        crystalBoss.fillCircle(24, 28, 5);
        crystalBoss.fillCircle(40, 28, 5);
        crystalBoss.generateTexture('crystalBoss', 64, 64);
        crystalBoss.destroy();

        // Heart piece
        const heart = this.add.graphics();
        heart.fillStyle(0xff4466);
        heart.fillCircle(5, 6, 5);
        heart.fillCircle(11, 6, 5);
        heart.fillTriangle(0, 8, 16, 8, 8, 18);
        heart.generateTexture('heart', 16, 18);
        heart.destroy();

        // Energy battery
        const battery = this.add.graphics();
        battery.fillStyle(0x44aaff);
        battery.fillRect(2, 4, 12, 16);
        battery.fillStyle(0x88ddff);
        battery.fillRect(4, 0, 8, 4);
        battery.generateTexture('battery', 16, 20);
        battery.destroy();

        // Crystal (XP)
        const crystal = this.add.graphics();
        crystal.fillStyle(0xff4444);
        crystal.fillTriangle(6, 0, 0, 12, 12, 12);
        crystal.fillStyle(0xff8888);
        crystal.fillTriangle(6, 2, 2, 10, 10, 10);
        crystal.generateTexture('crystal', 12, 12);
        crystal.destroy();

        // Grass tile
        const grass = this.add.graphics();
        grass.fillStyle(0x4a8a5a);
        grass.fillRect(0, 0, 32, 32);
        grass.fillStyle(0x5a9a6a);
        grass.fillCircle(8, 12, 4);
        grass.fillCircle(24, 20, 3);
        grass.fillCircle(16, 8, 3);
        grass.generateTexture('grass', 32, 32);
        grass.destroy();

        // Forest tile
        const forest = this.add.graphics();
        forest.fillStyle(0x3a7a5a);
        forest.fillRect(0, 0, 32, 32);
        forest.fillStyle(0x2a6a4a);
        forest.fillCircle(10, 10, 6);
        forest.fillCircle(22, 18, 5);
        forest.generateTexture('forest', 32, 32);
        forest.destroy();

        // Cave tile
        const cave = this.add.graphics();
        cave.fillStyle(0x3a3a5a);
        cave.fillRect(0, 0, 32, 32);
        cave.fillStyle(0x6a4aaa);
        cave.fillTriangle(8, 4, 4, 14, 12, 14);
        cave.fillTriangle(24, 8, 20, 16, 28, 16);
        cave.generateTexture('cave', 32, 32);
        cave.destroy();

        // Wall
        const wall = this.add.graphics();
        wall.fillStyle(0x5a5a4a);
        wall.fillRect(0, 0, 32, 32);
        wall.fillStyle(0x4a4a3a);
        wall.fillRect(2, 2, 28, 28);
        wall.generateTexture('wall', 32, 32);
        wall.destroy();

        // Village tile
        const village = this.add.graphics();
        village.fillStyle(0x6a9a7a);
        village.fillRect(0, 0, 32, 32);
        village.fillStyle(0x8aba9a);
        village.fillRect(4, 4, 8, 8);
        village.fillRect(20, 20, 8, 8);
        village.generateTexture('village', 32, 32);
        village.destroy();

        // NPC
        const npc = this.add.graphics();
        npc.fillStyle(0xffaa66);
        npc.fillCircle(12, 12, 10);
        npc.fillStyle(0xffdd99);
        npc.fillCircle(12, 10, 6);
        npc.fillStyle(0x000000);
        npc.fillCircle(9, 9, 2);
        npc.fillCircle(15, 9, 2);
        npc.generateTexture('npc', 24, 24);
        npc.destroy();

        // Particle
        const particle = this.add.graphics();
        particle.fillStyle(0xffffff);
        particle.fillCircle(2, 2, 2);
        particle.generateTexture('particle', 4, 4);
        particle.destroy();

        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const centerX = 400;

        this.add.text(centerX, 100, 'MINISHOOT', {
            fontSize: '56px',
            fill: '#88ddff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(centerX, 155, 'Adventures', {
            fontSize: '28px',
            fill: '#66aacc',
            fontFamily: 'Arial',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        const instructions = [
            'A twin-stick shooter adventure!',
            '',
            'WASD / Arrows - Move',
            'Mouse - Aim',
            'Left Click - Shoot',
            'Right Click - Supershot (costs energy)',
            'SPACE - Dash (when unlocked)',
            '',
            'Collect crystals to level up',
            'Find heart pieces and batteries',
            'Defeat both dungeon bosses to win!'
        ];

        instructions.forEach((text, i) => {
            this.add.text(centerX, 210 + i * 26, text, {
                fontSize: '16px',
                fill: '#aaddaa',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        });

        const startBtn = this.add.text(centerX, 550, '[ START ADVENTURE ]', {
            fontSize: '28px',
            fill: '#88ff88',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#aaffaa'));
        startBtn.on('pointerout', () => startBtn.setFill('#88ff88'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));

        this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'));
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Player stats
        this.health = 3;
        this.maxHealth = 3;
        this.energy = 4;
        this.maxEnergy = 4;

        // XP and leveling
        this.xp = 0;
        this.level = 1;
        this.xpToLevel = 20;
        this.skillPoints = 0;

        // Upgrades
        this.stats = {
            damage: 1,
            fireRate: 1,
            speed: 1
        };

        // Abilities
        this.hasDash = false;
        this.hasSupershot = false;
        this.dashCooldown = 0;

        // Progress
        this.bossesDefeated = 0;
        this.heartPieces = 0;

        // Current area
        this.currentArea = 'village';

        // Create world
        this.createWorld();

        // Player
        this.player = this.physics.add.sprite(400, 450, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.playerSpeed = 180 + this.stats.speed * 20;

        // Groups
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.npcs = this.physics.add.group();

        // Spawn content for starting area
        this.spawnAreaContent();

        // UI
        this.createUI();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {
                this.fireSupershot();
            } else {
                this.shooting = true;
            }
        });
        this.input.on('pointerup', () => this.shooting = false);

        // Collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.walls);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHitByBullet, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerTouchEnemy, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);
        this.physics.add.overlap(this.player, this.npcs, this.talkToNPC, null, this);

        // Firing timer
        this.lastFire = 0;
        this.baseFireRate = 300;

        // Area transitions
        this.transitionZones = [];
        this.createTransitions();
    }

    createWorld() {
        const tileSize = 32;
        const worldWidth = 25;
        const worldHeight = 19;

        this.walls = this.physics.add.staticGroup();

        // Create tilemap based on current area
        for (let y = 0; y < worldHeight; y++) {
            for (let x = 0; x < worldWidth; x++) {
                const worldX = x * tileSize + tileSize / 2;
                const worldY = y * tileSize + tileSize / 2;

                // Walls on edges
                if (x === 0 || x === worldWidth - 1 || y === 0 || y === worldHeight - 1) {
                    // Exits
                    const isExit = (x === worldWidth - 1 && y === Math.floor(worldHeight / 2)) ||
                                   (x === Math.floor(worldWidth / 2) && y === worldHeight - 1) ||
                                   (x === 0 && y === Math.floor(worldHeight / 2));
                    if (!isExit) {
                        this.walls.create(worldX, worldY, 'wall');
                    }
                } else {
                    // Floor tiles based on area
                    let tile = 'village';
                    if (this.currentArea === 'forest') tile = 'forest';
                    if (this.currentArea === 'cave') tile = 'cave';

                    this.add.sprite(worldX, worldY, tile);

                    // Random walls inside
                    if (Math.random() < 0.05) {
                        this.walls.create(worldX, worldY, 'wall');
                    }
                }
            }
        }
    }

    createTransitions() {
        // East exit -> Forest
        this.transitionZones.push({
            x: 790, y: 300, width: 20, height: 64,
            target: 'forest', playerX: 50, playerY: 300
        });

        // South exit -> Cave
        this.transitionZones.push({
            x: 400, y: 590, width: 64, height: 20,
            target: 'cave', playerX: 400, playerY: 50
        });

        // West exit -> Village
        this.transitionZones.push({
            x: 10, y: 300, width: 20, height: 64,
            target: 'village', playerX: 750, playerY: 300
        });
    }

    spawnAreaContent() {
        // Clear existing
        this.enemies.clear(true, true);
        this.pickups.clear(true, true);
        this.npcs.clear(true, true);

        if (this.currentArea === 'village') {
            // NPCs in village
            this.spawnNPC(200, 200, 'Mechanic', 'I can help you respec your skills!');
            this.spawnNPC(600, 200, 'Healer', 'Let me heal you!');
            this.spawnNPC(400, 150, 'Elder', 'Defeat the Forest Guardian and Crystal Golem to save us!');

            // Some pickups
            this.spawnPickup(300, 400, 'crystal');
            this.spawnPickup(500, 400, 'crystal');
        } else if (this.currentArea === 'forest') {
            // Forest enemies
            for (let i = 0; i < 8; i++) {
                this.spawnEnemy(
                    Phaser.Math.Between(100, 700),
                    Phaser.Math.Between(100, 500),
                    Phaser.Utils.Array.GetRandom(['scout', 'grasshopper', 'turret'])
                );
            }

            // Heart piece
            this.spawnPickup(600, 400, 'heart');

            // Check for boss area (south-east)
            if (!this.forestBossDefeated && this.player) {
                // Boss spawns when player reaches certain area
            }
        } else if (this.currentArea === 'cave') {
            // Cave enemies
            for (let i = 0; i < 10; i++) {
                this.spawnEnemy(
                    Phaser.Math.Between(100, 700),
                    Phaser.Math.Between(100, 500),
                    Phaser.Utils.Array.GetRandom(['burrower', 'heavy', 'turret'])
                );
            }

            // Battery
            this.spawnPickup(200, 300, 'battery');
        }
    }

    spawnEnemy(x, y, type) {
        const enemy = this.enemies.create(x, y, type);
        enemy.enemyType = type;
        enemy.lastFire = 0;

        switch (type) {
            case 'scout':
                enemy.health = 2;
                enemy.speed = 100;
                enemy.damage = 1;
                enemy.xpValue = 1;
                enemy.fireRate = 2000;
                break;
            case 'grasshopper':
                enemy.health = 3;
                enemy.speed = 150;
                enemy.damage = 1;
                enemy.xpValue = 2;
                enemy.fireRate = 1500;
                break;
            case 'turret':
                enemy.health = 5;
                enemy.speed = 0;
                enemy.damage = 1;
                enemy.xpValue = 3;
                enemy.fireRate = 1000;
                break;
            case 'burrower':
                enemy.health = 6;
                enemy.speed = 120;
                enemy.damage = 1;
                enemy.xpValue = 4;
                enemy.fireRate = 1800;
                break;
            case 'heavy':
                enemy.health = 10;
                enemy.speed = 60;
                enemy.damage = 2;
                enemy.xpValue = 5;
                enemy.fireRate = 2500;
                break;
        }
    }

    spawnBoss(type) {
        const boss = this.enemies.create(400, 200, type);
        boss.isBoss = true;
        boss.enemyType = type;
        boss.lastFire = 0;
        boss.phase = 1;

        if (type === 'forestBoss') {
            boss.health = 100;
            boss.maxHealth = 100;
            boss.speed = 50;
            boss.xpValue = 50;
        } else if (type === 'crystalBoss') {
            boss.health = 150;
            boss.maxHealth = 150;
            boss.speed = 40;
            boss.xpValue = 75;
        }

        // Boss health bar
        this.bossHealthBar = this.add.rectangle(400, 30, 300, 16, 0xff4444).setDepth(100);
        this.bossHealthBarBg = this.add.rectangle(400, 30, 300, 16, 0x333333).setDepth(99);
        this.bossNameText = this.add.text(400, 10, type === 'forestBoss' ? 'FOREST GUARDIAN' : 'CRYSTAL GOLEM', {
            fontSize: '14px',
            fill: '#fff'
        }).setOrigin(0.5).setDepth(100);
    }

    spawnNPC(x, y, name, dialogue) {
        const npc = this.npcs.create(x, y, 'npc');
        npc.npcName = name;
        npc.dialogue = dialogue;
    }

    spawnPickup(x, y, type) {
        const pickup = this.pickups.create(x, y, type);
        pickup.pickupType = type;

        // Floating animation
        this.tweens.add({
            targets: pickup,
            y: y - 5,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createUI() {
        // Health hearts
        this.heartIcons = [];
        for (let i = 0; i < 10; i++) {
            const heart = this.add.sprite(30 + i * 24, 30, 'heart').setDepth(100).setScale(0.8);
            heart.setVisible(i < this.maxHealth);
            heart.setAlpha(i < this.health ? 1 : 0.3);
            this.heartIcons.push(heart);
        }

        // Energy bars
        this.energyBars = [];
        for (let i = 0; i < 12; i++) {
            const bar = this.add.rectangle(30 + i * 18, 55, 14, 10, 0x44aaff).setDepth(100);
            bar.setVisible(i < this.maxEnergy);
            bar.setAlpha(i < this.energy ? 1 : 0.3);
            this.energyBars.push(bar);
        }

        // Level and XP
        this.levelText = this.add.text(20, 75, 'Lv: 1', {
            fontSize: '14px',
            fill: '#ffff88'
        }).setDepth(100);

        this.xpText = this.add.text(80, 75, 'XP: 0/20', {
            fontSize: '14px',
            fill: '#ffaa88'
        }).setDepth(100);

        // Skill points
        this.skillText = this.add.text(200, 75, '', {
            fontSize: '14px',
            fill: '#88ff88'
        }).setDepth(100);

        // Area name
        this.areaText = this.add.text(400, 580, 'Central Village', {
            fontSize: '16px',
            fill: '#aaddaa'
        }).setOrigin(0.5).setDepth(100);

        // Abilities
        this.abilityText = this.add.text(700, 20, '', {
            fontSize: '12px',
            fill: '#88ddff'
        }).setDepth(100);

        // Stats display
        this.statsText = this.add.text(700, 55, '', {
            fontSize: '11px',
            fill: '#aaa'
        }).setDepth(100);

        this.updateUI();
    }

    updateUI() {
        // Hearts
        for (let i = 0; i < 10; i++) {
            this.heartIcons[i].setVisible(i < this.maxHealth);
            this.heartIcons[i].setAlpha(i < this.health ? 1 : 0.3);
        }

        // Energy
        for (let i = 0; i < 12; i++) {
            this.energyBars[i].setVisible(i < this.maxEnergy);
            this.energyBars[i].setAlpha(i < this.energy ? 1 : 0.3);
        }

        this.levelText.setText(`Lv: ${this.level}`);
        this.xpText.setText(`XP: ${this.xp}/${this.xpToLevel}`);

        if (this.skillPoints > 0) {
            this.skillText.setText(`+${this.skillPoints} points! Press 1/2/3 to upgrade`);
        } else {
            this.skillText.setText('');
        }

        // Area name
        const areaNames = {
            village: 'Central Village',
            forest: 'Blue Forest',
            cave: 'Crystal Caves'
        };
        this.areaText.setText(areaNames[this.currentArea] || 'Unknown');

        // Abilities
        let abilities = [];
        if (this.hasDash) abilities.push('SPACE: Dash');
        if (this.hasSupershot) abilities.push('RClick: Supershot');
        this.abilityText.setText(abilities.join('\n'));

        // Stats
        this.statsText.setText(`DMG: ${this.stats.damage} | RATE: ${this.stats.fireRate} | SPD: ${this.stats.speed}`);
    }

    update(time, delta) {
        this.handleInput(time);
        this.updateEnemies(time);
        this.checkAreaTransition();
        this.updateUI();

        // Dash cooldown
        if (this.dashCooldown > 0) {
            this.dashCooldown -= delta;
        }
    }

    handleInput(time) {
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -1;
        if (this.cursors.right.isDown || this.wasd.D.isDown) vx = 1;
        if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -1;
        if (this.cursors.down.isDown || this.wasd.S.isDown) vy = 1;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx * this.playerSpeed, vy * this.playerSpeed);

        // Aim at mouse
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
        this.player.setRotation(angle);

        // Shooting
        if (this.shooting) {
            this.fire(time);
        }

        // Dash
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.hasDash && this.dashCooldown <= 0) {
            this.dash(vx, vy, angle);
        }

        // Skill point allocation
        if (this.skillPoints > 0) {
            if (this.input.keyboard.addKey('ONE').isDown) {
                this.stats.damage++;
                this.skillPoints--;
            }
            if (this.input.keyboard.addKey('TWO').isDown) {
                this.stats.fireRate++;
                this.skillPoints--;
            }
            if (this.input.keyboard.addKey('THREE').isDown) {
                this.stats.speed++;
                this.playerSpeed = 180 + this.stats.speed * 20;
                this.skillPoints--;
            }
        }
    }

    fire(time) {
        const fireRate = this.baseFireRate - this.stats.fireRate * 25;
        if (time - this.lastFire < fireRate) return;

        this.lastFire = time;

        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);

        const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
        bullet.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
        bullet.damage = this.stats.damage;
        bullet.setRotation(angle);

        this.time.delayedCall(2000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    fireSupershot() {
        if (!this.hasSupershot || this.energy < 1) return;

        this.energy--;

        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);

        const bullet = this.bullets.create(this.player.x, this.player.y, 'superBullet');
        bullet.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
        bullet.damage = this.stats.damage * 3;
        bullet.setRotation(angle);
        bullet.setScale(1.5);

        this.time.delayedCall(3000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    dash(vx, vy, angle) {
        if (vx === 0 && vy === 0) {
            vx = Math.cos(angle);
            vy = Math.sin(angle);
        }

        this.dashCooldown = 500;

        // Quick dash movement
        this.player.setVelocity(vx * 600, vy * 600);

        // Brief invincibility
        this.player.setAlpha(0.5);
        this.time.delayedCall(200, () => {
            this.player.setAlpha(1);
        });
    }

    updateEnemies(time) {
        this.enemies.children.iterate((enemy) => {
            if (!enemy || !enemy.active) return;

            if (enemy.isBoss) {
                this.updateBoss(enemy, time);
            } else {
                this.updateRegularEnemy(enemy, time);
            }
        });
    }

    updateRegularEnemy(enemy, time) {
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

        // Movement
        if (enemy.speed > 0) {
            if (dist > 100) {
                enemy.setVelocity(Math.cos(angle) * enemy.speed, Math.sin(angle) * enemy.speed);
            } else {
                enemy.setVelocity(0, 0);
            }
        }

        // Firing
        if (time - enemy.lastFire > enemy.fireRate && dist < 400) {
            enemy.lastFire = time;
            this.enemyFire(enemy, angle);
        }

        enemy.setRotation(angle);
    }

    updateBoss(boss, time) {
        const dist = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);

        // Update health bar
        if (this.bossHealthBar) {
            const healthPercent = boss.health / boss.maxHealth;
            this.bossHealthBar.width = 300 * healthPercent;
        }

        // Phase change at 50%
        if (boss.health < boss.maxHealth * 0.5 && boss.phase === 1) {
            boss.phase = 2;
            boss.speed *= 1.5;
        }

        // Movement
        if (dist > 150) {
            boss.setVelocity(Math.cos(angle) * boss.speed, Math.sin(angle) * boss.speed);
        } else {
            boss.setVelocity(0, 0);
        }

        // Boss attack patterns
        if (time - boss.lastFire > 1500) {
            boss.lastFire = time;

            // Spray attack
            const numBullets = boss.phase === 1 ? 8 : 12;
            for (let i = 0; i < numBullets; i++) {
                const a = (i / numBullets) * Math.PI * 2;
                const bullet = this.enemyBullets.create(boss.x, boss.y, 'enemyBullet');
                bullet.setVelocity(Math.cos(a) * 150, Math.sin(a) * 150);
                this.time.delayedCall(4000, () => { if (bullet.active) bullet.destroy(); });
            }
        }

        boss.setRotation(angle);
    }

    enemyFire(enemy, angle) {
        const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemyBullet');
        bullet.setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150);

        this.time.delayedCall(4000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    bulletHitEnemy(bullet, enemy) {
        bullet.destroy();

        enemy.health -= bullet.damage;

        enemy.setTint(0xffffff);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });

        if (enemy.health <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        // Particles
        for (let i = 0; i < 5; i++) {
            const p = this.add.sprite(enemy.x, enemy.y, 'particle');
            p.setTint(enemy.isBoss ? 0xffff00 : 0xff4444);
            this.tweens.add({
                targets: p,
                x: enemy.x + Phaser.Math.Between(-30, 30),
                y: enemy.y + Phaser.Math.Between(-30, 30),
                alpha: 0,
                duration: 300,
                onComplete: () => p.destroy()
            });
        }

        // Drop crystals
        const crystalCount = enemy.isBoss ? 20 : Phaser.Math.Between(1, 3);
        for (let i = 0; i < crystalCount; i++) {
            this.spawnPickup(
                enemy.x + Phaser.Math.Between(-20, 20),
                enemy.y + Phaser.Math.Between(-20, 20),
                'crystal'
            );
        }

        // Boss rewards
        if (enemy.isBoss) {
            this.bossesDefeated++;

            if (this.bossHealthBar) {
                this.bossHealthBar.destroy();
                this.bossHealthBarBg.destroy();
                this.bossNameText.destroy();
            }

            // Unlock ability
            if (enemy.enemyType === 'forestBoss') {
                this.hasDash = true;
                this.showMessage('DASH UNLOCKED! Press SPACE to dash.');
            } else if (enemy.enemyType === 'crystalBoss') {
                this.hasSupershot = true;
                this.showMessage('SUPERSHOT UNLOCKED! Right-click for powerful shot.');
            }

            // Check win
            if (this.bossesDefeated >= 2) {
                this.time.delayedCall(2000, () => this.victory());
            }
        }

        enemy.destroy();
    }

    showMessage(text) {
        const msg = this.add.text(400, 300, text, {
            fontSize: '24px',
            fill: '#ffff88',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(200);

        this.time.delayedCall(3000, () => msg.destroy());
    }

    playerHitByBullet(player, bullet) {
        if (player.alpha < 1) return; // Invincible during dash

        bullet.destroy();
        this.takeDamage(1);
    }

    playerTouchEnemy(player, enemy) {
        if (player.alpha < 1) return;

        this.takeDamage(enemy.damage);

        // Knockback
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        player.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
    }

    takeDamage(amount) {
        this.health -= amount;

        this.player.setTint(0xff4444);
        this.time.delayedCall(200, () => this.player.clearTint());

        this.cameras.main.shake(100, 0.01);

        if (this.health <= 0) {
            this.gameOver();
        }
    }

    collectPickup(player, pickup) {
        switch (pickup.pickupType) {
            case 'crystal':
                this.xp++;
                if (this.xp >= this.xpToLevel) {
                    this.levelUp();
                }
                break;
            case 'heart':
                this.heartPieces++;
                if (this.heartPieces >= 4) {
                    this.heartPieces = 0;
                    this.maxHealth++;
                    this.health = this.maxHealth;
                    this.showMessage('+1 MAX HEART!');
                } else {
                    this.showMessage(`Heart piece ${this.heartPieces}/4`);
                }
                break;
            case 'battery':
                this.maxEnergy++;
                this.energy = this.maxEnergy;
                this.showMessage('+1 MAX ENERGY!');
                break;
        }
        pickup.destroy();
    }

    levelUp() {
        this.level++;
        this.xp = 0;
        this.xpToLevel = Math.floor(this.xpToLevel * 1.5);
        this.skillPoints++;

        this.showMessage(`LEVEL UP! ${this.level}`);
    }

    talkToNPC(player, npc) {
        // Simple heal from healer
        if (npc.npcName === 'Healer') {
            this.health = this.maxHealth;
            this.energy = this.maxEnergy;
        }

        this.showMessage(`${npc.npcName}: "${npc.dialogue}"`);
    }

    checkAreaTransition() {
        for (const zone of this.transitionZones) {
            if (this.player.x > zone.x - zone.width / 2 &&
                this.player.x < zone.x + zone.width / 2 &&
                this.player.y > zone.y - zone.height / 2 &&
                this.player.y < zone.y + zone.height / 2) {

                this.transitionToArea(zone.target, zone.playerX, zone.playerY);
                break;
            }
        }

        // Check for boss spawn in forest
        if (this.currentArea === 'forest' && !this.forestBossSpawned &&
            this.player.x > 500 && this.player.y > 400) {
            this.forestBossSpawned = true;
            this.spawnBoss('forestBoss');
        }

        // Check for boss spawn in cave
        if (this.currentArea === 'cave' && !this.caveBossSpawned &&
            this.player.x > 500 && this.player.y < 200) {
            this.caveBossSpawned = true;
            this.spawnBoss('crystalBoss');
        }
    }

    transitionToArea(newArea, px, py) {
        if (newArea === this.currentArea) return;

        this.currentArea = newArea;

        // Clear and rebuild
        this.walls.clear(true, true);
        this.bullets.clear(true, true);
        this.enemyBullets.clear(true, true);

        // Rebuild walls
        const tileSize = 32;
        const worldWidth = 25;
        const worldHeight = 19;

        for (let y = 0; y < worldHeight; y++) {
            for (let x = 0; x < worldWidth; x++) {
                const worldX = x * tileSize + tileSize / 2;
                const worldY = y * tileSize + tileSize / 2;

                if (x === 0 || x === worldWidth - 1 || y === 0 || y === worldHeight - 1) {
                    const isExit = (x === worldWidth - 1 && y === Math.floor(worldHeight / 2)) ||
                                   (x === Math.floor(worldWidth / 2) && y === worldHeight - 1) ||
                                   (x === 0 && y === Math.floor(worldHeight / 2));
                    if (!isExit) {
                        this.walls.create(worldX, worldY, 'wall');
                    }
                } else {
                    let tile = 'village';
                    if (this.currentArea === 'forest') tile = 'forest';
                    if (this.currentArea === 'cave') tile = 'cave';

                    this.add.sprite(worldX, worldY, tile);

                    if (Math.random() < 0.05) {
                        this.walls.create(worldX, worldY, 'wall');
                    }
                }
            }
        }

        this.player.setPosition(px, py);
        this.spawnAreaContent();
    }

    gameOver() {
        this.scene.start('GameOverScene', { victory: false, level: this.level, bosses: this.bossesDefeated });
    }

    victory() {
        this.scene.start('GameOverScene', { victory: true, level: this.level, bosses: this.bossesDefeated });
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.victory = data.victory;
        this.level = data.level;
        this.bosses = data.bosses;
    }

    create() {
        const centerX = 400;

        if (this.victory) {
            this.add.text(centerX, 150, 'VICTORY!', {
                fontSize: '64px',
                fill: '#88ff88',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            this.add.text(centerX, 230, 'You saved the village!', {
                fontSize: '24px',
                fill: '#aaffaa'
            }).setOrigin(0.5);

            this.add.text(centerX, 280, `Final Level: ${this.level}`, {
                fontSize: '20px',
                fill: '#ffff88'
            }).setOrigin(0.5);
        } else {
            this.add.text(centerX, 150, 'GAME OVER', {
                fontSize: '64px',
                fill: '#ff6666',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            this.add.text(centerX, 230, `Reached Level ${this.level}`, {
                fontSize: '20px',
                fill: '#ffaa88'
            }).setOrigin(0.5);

            this.add.text(centerX, 270, `Bosses Defeated: ${this.bosses}/2`, {
                fontSize: '18px',
                fill: '#aaa'
            }).setOrigin(0.5);
        }

        const restartBtn = this.add.text(centerX, 400, '[ PLAY AGAIN ]', {
            fontSize: '28px',
            fill: '#88ff88'
        }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerover', () => restartBtn.setFill('#aaffaa'));
        restartBtn.on('pointerout', () => restartBtn.setFill('#88ff88'));
        restartBtn.on('pointerdown', () => this.scene.start('GameScene'));

        const menuBtn = this.add.text(centerX, 460, '[ MAIN MENU ]', {
            fontSize: '20px',
            fill: '#888'
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerover', () => menuBtn.setFill('#aaa'));
        menuBtn.on('pointerout', () => menuBtn.setFill('#888'));
        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2a4a3a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);
