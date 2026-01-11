// Dome Keeper Clone - Phaser 3 Version

// Constants
const TILE_SIZE = 16;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 40;
const DOME_X = 400;
const DOME_Y = 100;

// Tile Types
const TILES = {
    AIR: 0,
    SOFT_DIRT: 1,
    MEDIUM_DIRT: 2,
    HARD_ROCK: 3,
    VERY_HARD_ROCK: 8,
    IRON_ORE: 4,
    WATER_CRYSTAL: 5,
    COBALT_ORE: 6,
    BEDROCK: 7
};

const TILE_HEALTH = {
    [TILES.SOFT_DIRT]: 4,
    [TILES.MEDIUM_DIRT]: 8,
    [TILES.HARD_ROCK]: 16,
    [TILES.VERY_HARD_ROCK]: 32,
    [TILES.IRON_ORE]: 12,
    [TILES.WATER_CRYSTAL]: 10,
    [TILES.COBALT_ORE]: 14,
    [TILES.BEDROCK]: 9999
};

const TILE_COLORS = {
    [TILES.AIR]: 0x1a1a2e,
    [TILES.SOFT_DIRT]: 0x8B7355,
    [TILES.MEDIUM_DIRT]: 0x6B5344,
    [TILES.HARD_ROCK]: 0x5A5A5A,
    [TILES.VERY_HARD_ROCK]: 0x3A3A3A,
    [TILES.IRON_ORE]: 0xB87333,
    [TILES.WATER_CRYSTAL]: 0x4A90D9,
    [TILES.COBALT_ORE]: 0x8B5CF6,
    [TILES.BEDROCK]: 0x2A2A2A
};

// Boot Scene - Load assets
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        this.scene.start('GameScene');
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Game state
        this.gameState = {
            phase: 'mining', // 'mining' or 'defense'
            phaseTimer: 60,
            wave: 0,
            iron: 5,
            water: 0,
            cobalt: 0,
            domeHP: 800,
            domeMaxHP: 800,
            drillStrength: 2,
            moveSpeed: 120,
            carryCapacity: 3,
            laserDamage: 15,
            laserSpeed: 0.03,
            carriedResources: [],
            speedLossPerResource: 15,
            screenShake: 0,
            killCount: 0,
            totalIronMined: 0,
            totalDepthReached: 0
        };

        // Generate map
        this.generateMap();

        // Create dome
        this.createDome();

        // Create keeper
        this.createKeeper();

        // Create enemies group
        this.enemies = this.add.group();

        // Create projectiles group
        this.projectiles = this.add.group();

        // Create UI
        this.createUI();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey('W'),
            down: this.input.keyboard.addKey('S'),
            left: this.input.keyboard.addKey('A'),
            right: this.input.keyboard.addKey('D'),
            space: this.input.keyboard.addKey('SPACE'),
            e: this.input.keyboard.addKey('E'),
            q: this.input.keyboard.addKey('Q'),
            r: this.input.keyboard.addKey('R')
        };

        // Camera follows keeper
        this.cameras.main.startFollow(this.keeper, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE + 200);

        // Particles
        this.particles = [];
    }

    generateMap() {
        this.map = [];
        this.tileHealth = [];
        this.tileSprites = [];

        // Surface level (dome area)
        const surfaceY = 8;

        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.map[y] = [];
            this.tileHealth[y] = [];
            this.tileSprites[y] = [];

            for (let x = 0; x < MAP_WIDTH; x++) {
                let tileType = TILES.AIR;

                if (y < surfaceY) {
                    // Sky/dome area
                    tileType = TILES.AIR;
                } else if (x === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
                    // Bedrock boundaries
                    tileType = TILES.BEDROCK;
                } else {
                    // Underground
                    const depthFactor = (y - surfaceY) / (MAP_HEIGHT - surfaceY);
                    const rand = Math.random();

                    // Resource spawning
                    if (rand < 0.08) {
                        tileType = TILES.IRON_ORE;
                    } else if (rand < 0.12 && depthFactor > 0.2) {
                        tileType = TILES.WATER_CRYSTAL;
                    } else if (rand < 0.15 && depthFactor > 0.4) {
                        tileType = TILES.COBALT_ORE;
                    } else if (depthFactor > 0.8 && rand < 0.4) {
                        tileType = TILES.VERY_HARD_ROCK;
                    } else if (depthFactor > 0.5 && rand < 0.5) {
                        tileType = TILES.HARD_ROCK;
                    } else if (depthFactor > 0.25 && rand < 0.6) {
                        tileType = TILES.MEDIUM_DIRT;
                    } else {
                        tileType = TILES.SOFT_DIRT;
                    }
                }

                this.map[y][x] = tileType;
                this.tileHealth[y][x] = TILE_HEALTH[tileType] || 0;

                // Create tile sprite
                if (tileType !== TILES.AIR) {
                    const sprite = this.add.rectangle(
                        x * TILE_SIZE + TILE_SIZE / 2,
                        y * TILE_SIZE + TILE_SIZE / 2 + 100, // Offset for dome
                        TILE_SIZE - 1,
                        TILE_SIZE - 1,
                        TILE_COLORS[tileType]
                    );
                    this.tileSprites[y][x] = sprite;
                }
            }
        }

        // Clear starting shaft under dome
        const shaftX = Math.floor(MAP_WIDTH / 2);
        for (let y = surfaceY; y < surfaceY + 5; y++) {
            for (let dx = -1; dx <= 1; dx++) {
                this.clearTile(shaftX + dx, y);
            }
        }
    }

    clearTile(x, y) {
        if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;
        if (this.map[y][x] === TILES.AIR || this.map[y][x] === TILES.BEDROCK) return;

        const tileType = this.map[y][x];
        this.map[y][x] = TILES.AIR;

        if (this.tileSprites[y][x]) {
            this.tileSprites[y][x].destroy();
            this.tileSprites[y][x] = null;
        }

        return tileType;
    }

    createDome() {
        // Dome base
        this.dome = this.add.container(DOME_X, DOME_Y);

        // Glass dome
        const domeGlass = this.add.ellipse(0, 0, 80, 60, 0x87CEEB, 0.5);
        this.dome.add(domeGlass);

        // Metal frame
        const frame = this.add.ellipse(0, 0, 84, 64, 0x4A5568, 1);
        frame.setStrokeStyle(3, 0x718096);
        frame.setFillStyle(0x000000, 0);
        this.dome.add(frame);

        // Laser turret
        this.laserAngle = -Math.PI / 2; // Start pointing up

        // Laser glow (outer)
        this.laserGlow = this.add.line(0, 0, 0, 0, 0, -100, 0xFFE66D);
        this.laserGlow.setLineWidth(8);
        this.laserGlow.setOrigin(0, 0);
        this.laserGlow.setAlpha(0.3);
        this.dome.add(this.laserGlow);
        this.laserGlow.setVisible(false);

        // Laser core
        this.laserLine = this.add.line(0, 0, 0, 0, 0, -100, 0xFF6B6B);
        this.laserLine.setLineWidth(3);
        this.laserLine.setOrigin(0, 0);
        this.dome.add(this.laserLine);
        this.laserLine.setVisible(false);

        // Base platform
        const platform = this.add.rectangle(0, 35, 100, 10, 0x4A5568);
        this.dome.add(platform);

        this.dome.setDepth(10);
    }

    createKeeper() {
        this.keeper = this.add.container(DOME_X, DOME_Y + 50);

        // Body
        const body = this.add.rectangle(0, 0, 16, 20, 0xE2E8F0);
        this.keeper.add(body);

        // Helmet
        const helmet = this.add.circle(0, -8, 8, 0x4A90D9);
        this.keeper.add(helmet);

        // Jetpack
        const jetpack = this.add.rectangle(-6, 5, 4, 10, 0x718096);
        this.keeper.add(jetpack);

        // Jetpack flame
        this.jetpackFlame = this.add.triangle(-6, 14, 0, -6, -3, 6, 3, 6, 0xFF6B6B);
        this.jetpackFlame.setAlpha(0);
        this.keeper.add(this.jetpackFlame);

        // Physics-like movement
        this.keeperVelX = 0;
        this.keeperVelY = 0;
        this.keeperOnGround = false;

        this.keeper.setDepth(15);
    }

    createUI() {
        // UI Container (fixed to camera)
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setScrollFactor(0);
        this.uiContainer.setDepth(100);

        // Top bar background
        const topBar = this.add.rectangle(400, 25, 800, 50, 0x000000, 0.7);
        this.uiContainer.add(topBar);

        // Phase text
        this.phaseText = this.add.text(20, 10, 'MINING PHASE', {
            fontSize: '16px',
            fill: '#48BB78'
        });
        this.uiContainer.add(this.phaseText);

        // Timer text
        this.timerText = this.add.text(20, 30, 'Time: 60s', {
            fontSize: '14px',
            fill: '#F7FAFC'
        });
        this.uiContainer.add(this.timerText);

        // Resources
        this.ironText = this.add.text(200, 10, 'Iron: 5', {
            fontSize: '14px',
            fill: '#B87333'
        });
        this.uiContainer.add(this.ironText);

        this.waterText = this.add.text(300, 10, 'Water: 0', {
            fontSize: '14px',
            fill: '#4A90D9'
        });
        this.uiContainer.add(this.waterText);

        this.cobaltText = this.add.text(400, 10, 'Cobalt: 0', {
            fontSize: '14px',
            fill: '#8B5CF6'
        });
        this.uiContainer.add(this.cobaltText);

        // Wave text
        this.waveText = this.add.text(520, 10, 'Wave: 0', {
            fontSize: '14px',
            fill: '#F7FAFC'
        });
        this.uiContainer.add(this.waveText);

        // Dome HP bar
        this.domeHPBar = this.add.rectangle(650, 35, 100, 12, 0x48BB78);
        this.domeHPBarBG = this.add.rectangle(650, 35, 100, 12, 0x333333);
        this.domeHPBarBG.setDepth(0);
        this.domeHPBar.setDepth(1);
        this.uiContainer.add(this.domeHPBarBG);
        this.uiContainer.add(this.domeHPBar);

        this.domeHPText = this.add.text(600, 28, 'Dome:', {
            fontSize: '12px',
            fill: '#F7FAFC'
        });
        this.uiContainer.add(this.domeHPText);

        // Carried resources indicator
        this.carryText = this.add.text(200, 30, 'Carrying: 0/3', {
            fontSize: '12px',
            fill: '#F7FAFC'
        });
        this.uiContainer.add(this.carryText);

        // Depth indicator
        this.depthText = this.add.text(320, 30, 'Depth: 0', {
            fontSize: '12px',
            fill: '#888888'
        });
        this.uiContainer.add(this.depthText);

        // Instructions
        this.instrText = this.add.text(400, 580, 'WASD: Move | SPACE: Drill | Q: Drop | E: Upgrades | R: Repair (1 Cobalt)', {
            fontSize: '11px',
            fill: '#888888'
        });
        this.instrText.setOrigin(0.5);
        this.uiContainer.add(this.instrText);

        // Wave warning
        this.waveWarning = this.add.text(400, 150, '', {
            fontSize: '24px',
            fill: '#E53E3E'
        });
        this.waveWarning.setOrigin(0.5);
        this.waveWarning.setAlpha(0);
        this.uiContainer.add(this.waveWarning);

        // Minimap
        this.createMinimap();
    }

    createMinimap() {
        const minimapScale = 2;
        const minimapWidth = MAP_WIDTH * minimapScale;
        const minimapHeight = MAP_HEIGHT * minimapScale;
        const minimapX = 790 - minimapWidth;
        const minimapY = 580 - minimapHeight;

        // Minimap background
        this.minimapBg = this.add.rectangle(minimapX + minimapWidth / 2, minimapY + minimapHeight / 2, minimapWidth + 4, minimapHeight + 4, 0x000000, 0.6);
        this.uiContainer.add(this.minimapBg);

        // Minimap graphics
        this.minimapGraphics = this.add.graphics();
        this.minimapGraphics.setScrollFactor(0);
        this.uiContainer.add(this.minimapGraphics);

        this.minimapX = minimapX;
        this.minimapY = minimapY;
        this.minimapScale = minimapScale;
    }

    updateMinimap() {
        if (!this.minimapGraphics) return;

        this.minimapGraphics.clear();

        // Draw tiles
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const tile = this.map[y][x];
                if (tile !== TILES.AIR) {
                    this.minimapGraphics.fillStyle(TILE_COLORS[tile] || 0x444444);
                    this.minimapGraphics.fillRect(
                        this.minimapX + x * this.minimapScale,
                        this.minimapY + y * this.minimapScale,
                        this.minimapScale,
                        this.minimapScale
                    );
                }
            }
        }

        // Draw dome
        this.minimapGraphics.fillStyle(0x87CEEB);
        this.minimapGraphics.fillCircle(this.minimapX + (MAP_WIDTH / 2) * this.minimapScale, this.minimapY + 4 * this.minimapScale, 4);

        // Draw keeper
        const keeperMapX = Math.floor(this.keeper.x / TILE_SIZE);
        const keeperMapY = Math.floor((this.keeper.y - 100) / TILE_SIZE);
        this.minimapGraphics.fillStyle(0x48BB78);
        this.minimapGraphics.fillRect(
            this.minimapX + keeperMapX * this.minimapScale - 1,
            this.minimapY + keeperMapY * this.minimapScale - 1,
            3, 3
        );
    }

    update(time, delta) {
        const dt = delta / 1000;

        // Update phase timer
        this.updatePhaseTimer(dt);

        // Handle input based on phase
        if (this.gameState.phase === 'mining') {
            this.updateKeeper(dt);
        } else {
            this.updateDefense(dt);
        }

        // Update enemies
        this.updateEnemies(dt);

        // Update particles
        this.updateParticles(dt);

        // Update resources (sparkle)
        this.updateResources(dt);

        // Update screen shake
        if (this.gameState.screenShake > 0) {
            this.cameras.main.setScroll(
                this.cameras.main.scrollX + (Math.random() - 0.5) * this.gameState.screenShake,
                this.cameras.main.scrollY + (Math.random() - 0.5) * this.gameState.screenShake
            );
            this.gameState.screenShake *= 0.9;
            if (this.gameState.screenShake < 0.5) this.gameState.screenShake = 0;
        }

        // Track depth reached
        const keeperDepth = Math.floor((this.keeper.y - 100) / TILE_SIZE);
        this.gameState.totalDepthReached = Math.max(this.gameState.totalDepthReached, keeperDepth);

        // Update UI
        this.updateUI();

        // Update minimap
        this.updateMinimap();

        // Check upgrade menu
        if (Phaser.Input.Keyboard.JustDown(this.wasd.e)) {
            const distToDome = Phaser.Math.Distance.Between(
                this.keeper.x, this.keeper.y,
                DOME_X, DOME_Y
            );
            if (distToDome < 100) {
                this.scene.launch('UpgradeScene', { gameState: this.gameState });
                this.scene.pause();
            }
        }

        // Repair dome with cobalt (R key)
        if (Phaser.Input.Keyboard.JustDown(this.wasd.r)) {
            this.repairDome();
        }

        // Wave warning countdown
        if (this.gameState.phase === 'mining' && this.gameState.phaseTimer <= 10) {
            this.waveWarning.setText(`WAVE ${this.gameState.wave + 1} IN ${Math.ceil(this.gameState.phaseTimer)}s`);
            this.waveWarning.setAlpha(0.5 + Math.sin(Date.now() / 200) * 0.5);
        } else {
            this.waveWarning.setAlpha(0);
        }
    }

    repairDome() {
        const distToDome = Phaser.Math.Distance.Between(this.keeper.x, this.keeper.y, DOME_X, DOME_Y);
        if (distToDome > 100) return;
        if (this.gameState.cobalt < 1) return;
        if (this.gameState.domeHP >= this.gameState.domeMaxHP) return;

        this.gameState.cobalt--;
        const healAmount = 80 + this.gameState.domeMaxHP * 0.15;
        this.gameState.domeHP = Math.min(this.gameState.domeMaxHP, this.gameState.domeHP + healAmount);

        // Repair visual
        for (let i = 0; i < 10; i++) {
            this.addParticle(DOME_X + (Math.random() - 0.5) * 60, DOME_Y + (Math.random() - 0.5) * 40, 0x8B5CF6);
        }
    }

    updatePhaseTimer(dt) {
        this.gameState.phaseTimer -= dt;

        if (this.gameState.phaseTimer <= 0) {
            if (this.gameState.phase === 'mining') {
                this.startDefensePhase();
            } else {
                // Check if all enemies dead
                if (this.enemies.getLength() === 0) {
                    this.startMiningPhase();
                }
            }
        }
    }

    startDefensePhase() {
        this.gameState.phase = 'defense';
        this.gameState.wave++;
        this.gameState.phaseTimer = 999; // Until all enemies dead

        // Spawn enemies
        this.spawnWave();

        // Move keeper to dome
        this.keeper.x = DOME_X;
        this.keeper.y = DOME_Y;

        // Deposit carried resources
        this.depositResources();
    }

    startMiningPhase() {
        this.gameState.phase = 'mining';
        this.gameState.phaseTimer = 60 + this.gameState.wave * 5; // Longer phases later
    }

    spawnWave() {
        const waveWeight = 20 + this.gameState.wave * 30;
        let remainingWeight = waveWeight;

        const enemyTypes = [
            { type: 'walker', weight: 20, hp: 40, damage: 12, speed: 60 },
            { type: 'flyer', weight: 25, hp: 20, damage: 15, speed: 80 }
        ];

        // Add harder enemies later
        if (this.gameState.wave >= 2) {
            enemyTypes.push({ type: 'tick', weight: 15, hp: 5, damage: 10, speed: 40 });
        }
        if (this.gameState.wave >= 3) {
            enemyTypes.push({ type: 'hornet', weight: 80, hp: 100, damage: 45, speed: 50 });
        }
        if (this.gameState.wave >= 5) {
            enemyTypes.push({ type: 'diver', weight: 70, hp: 30, damage: 100, speed: 200 });
        }
        if (this.gameState.wave >= 8) {
            enemyTypes.push({ type: 'boss', weight: 200, hp: 400, damage: 30, speed: 25 });
        }

        while (remainingWeight > 0) {
            const validTypes = enemyTypes.filter(e => e.weight <= remainingWeight);
            if (validTypes.length === 0) break;

            const selected = Phaser.Math.RND.pick(validTypes);
            this.spawnEnemy(selected);
            remainingWeight -= selected.weight;
        }
    }

    spawnEnemy(config) {
        const side = Math.random() > 0.5 ? -1 : 1;
        const x = DOME_X + side * (400 + Math.random() * 100);
        const y = 50 + Math.random() * 50;

        const enemy = this.add.container(x, y);

        // Body based on type
        let bodyColor = 0xE53E3E;
        let size = 20;

        if (config.type === 'walker') {
            const body = this.add.rectangle(0, 0, 20, 24, 0x2D3748);
            const eye = this.add.circle(0, -4, 4, 0xE53E3E);
            enemy.add(body);
            enemy.add(eye);
        } else if (config.type === 'flyer') {
            const body = this.add.ellipse(0, 0, 24, 16, 0x2D3748);
            const wing1 = this.add.triangle(-10, 0, 0, -8, 10, 0, 0, 8, 0xFC8181, 0.5);
            const wing2 = this.add.triangle(10, 0, 0, -8, -10, 0, 0, 8, 0xFC8181, 0.5);
            const eye = this.add.circle(5, 0, 3, 0xE53E3E);
            enemy.add(body);
            enemy.add(wing1);
            enemy.add(wing2);
            enemy.add(eye);
        } else if (config.type === 'hornet') {
            const body = this.add.rectangle(0, 0, 28, 32, 0x2D3748);
            const eye1 = this.add.circle(-5, -8, 4, 0xE53E3E);
            const eye2 = this.add.circle(5, -8, 4, 0xE53E3E);
            enemy.add(body);
            enemy.add(eye1);
            enemy.add(eye2);
        } else if (config.type === 'diver') {
            const body = this.add.triangle(0, 0, 0, -16, -12, 16, 12, 16, 0x2D3748);
            const eye = this.add.circle(0, 0, 4, 0xE53E3E);
            enemy.add(body);
            enemy.add(eye);
        } else if (config.type === 'tick') {
            const body = this.add.circle(0, 0, 8, 0x2D3748);
            const eye = this.add.circle(0, 0, 3, 0xE53E3E);
            enemy.add(body);
            enemy.add(eye);
        } else if (config.type === 'boss') {
            const body = this.add.rectangle(0, 0, 40, 48, 0x2D3748);
            const eye1 = this.add.circle(-8, -12, 6, 0xE53E3E);
            const eye2 = this.add.circle(8, -12, 6, 0xE53E3E);
            const horn1 = this.add.triangle(-15, -20, 0, -12, -8, 8, 8, 8, 0xFC8181);
            const horn2 = this.add.triangle(15, -20, 0, -12, -8, 8, 8, 8, 0xFC8181);
            enemy.add(body);
            enemy.add(eye1);
            enemy.add(eye2);
            enemy.add(horn1);
            enemy.add(horn2);
        }

        enemy.hp = config.hp;
        enemy.maxHP = config.hp;
        enemy.damage = config.damage;
        enemy.speed = config.speed;
        enemy.type = config.type;
        enemy.attackCooldown = 0;
        enemy.setDepth(5);

        // Health bar
        const hpBarBg = this.add.rectangle(0, -25, 24, 4, 0x333333);
        const hpBar = this.add.rectangle(0, -25, 24, 4, 0x48BB78);
        enemy.add(hpBarBg);
        enemy.add(hpBar);
        enemy.hpBar = hpBar;

        // Spawn animation
        enemy.setAlpha(0);
        enemy.setScale(0.5);
        this.tweens.add({
            targets: enemy,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });

        this.enemies.add(enemy);
    }

    updateDefense(dt) {
        // Laser aiming
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const targetAngle = Phaser.Math.Angle.Between(
            DOME_X, DOME_Y, worldPoint.x, worldPoint.y
        );

        // Smooth rotation
        const angleDiff = Phaser.Math.Angle.Wrap(targetAngle - this.laserAngle);
        this.laserAngle += angleDiff * this.gameState.laserSpeed * 60 * dt;

        // Update laser line
        const laserLength = 400;
        this.laserLine.setTo(
            0, 0,
            Math.cos(this.laserAngle) * laserLength,
            Math.sin(this.laserAngle) * laserLength
        );
        this.laserGlow.setTo(
            0, 0,
            Math.cos(this.laserAngle) * laserLength,
            Math.sin(this.laserAngle) * laserLength
        );

        // Fire laser on click
        if (pointer.isDown) {
            this.laserLine.setVisible(true);
            this.laserGlow.setVisible(true);
            // Pulsing glow
            this.laserGlow.setAlpha(0.2 + Math.sin(Date.now() / 50) * 0.15);
            this.fireLaser(dt);
        } else {
            this.laserLine.setVisible(false);
            this.laserGlow.setVisible(false);
        }
    }

    fireLaser(dt) {
        const laserEndX = DOME_X + Math.cos(this.laserAngle) * 400;
        const laserEndY = DOME_Y + Math.sin(this.laserAngle) * 400;

        this.enemies.getChildren().forEach(enemy => {
            // Check if enemy intersects laser line
            const dist = Phaser.Math.Distance.BetweenPointsSquared(
                { x: enemy.x, y: enemy.y },
                Phaser.Geom.Line.GetNearestPoint(
                    new Phaser.Geom.Line(DOME_X, DOME_Y, laserEndX, laserEndY),
                    { x: enemy.x, y: enemy.y }
                )
            );

            if (dist < 400) { // Within hit range
                enemy.hp -= this.gameState.laserDamage * dt;

                // Update health bar
                if (enemy.hpBar) {
                    enemy.hpBar.setScale(Math.max(0, enemy.hp / enemy.maxHP), 1);
                    enemy.hpBar.setFillStyle(enemy.hp > enemy.maxHP * 0.5 ? 0x48BB78 : enemy.hp > enemy.maxHP * 0.25 ? 0xF6E05E : 0xE53E3E);
                }

                // Hit particles
                if (Math.random() < 0.3) {
                    this.addParticle(enemy.x, enemy.y, 0xFFE66D);
                }

                if (enemy.hp <= 0) {
                    this.killEnemy(enemy);
                }
            }
        });
    }

    updateEnemies(dt) {
        this.enemies.getChildren().forEach(enemy => {
            // Move toward dome
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, DOME_X, DOME_Y);
            const speed = enemy.speed * (enemy.type === 'flyer' ? 1 : 0.7);

            enemy.x += Math.cos(angle) * speed * dt;
            enemy.y += Math.sin(angle) * speed * dt;

            // Attack dome when close
            const distToDome = Phaser.Math.Distance.Between(enemy.x, enemy.y, DOME_X, DOME_Y);
            if (distToDome < 60) {
                enemy.attackCooldown -= dt;
                if (enemy.attackCooldown <= 0) {
                    this.gameState.domeHP -= enemy.damage;
                    enemy.attackCooldown = 1.5;
                    this.addParticle(DOME_X, DOME_Y, 0xE53E3E);

                    // Screen shake on damage
                    this.gameState.screenShake = Math.min(10, this.gameState.screenShake + enemy.damage / 10);

                    // Check dome destroyed
                    if (this.gameState.domeHP <= 0) {
                        this.gameOver();
                    }
                }
            }
        });

        // Check wave complete
        if (this.gameState.phase === 'defense' && this.enemies.getLength() === 0) {
            this.startMiningPhase();
        }
    }

    killEnemy(enemy) {
        // Death particles
        for (let i = 0; i < 8; i++) {
            this.addParticle(enemy.x, enemy.y, 0xFC8181);
        }

        // Track kills
        this.gameState.killCount++;

        enemy.destroy();
    }

    updateKeeper(dt) {
        // Speed reduced by carried resources
        const carriedCount = this.gameState.carriedResources.length;
        const speed = Math.max(40, this.gameState.moveSpeed - carriedCount * this.gameState.speedLossPerResource);
        let moveX = 0;
        let moveY = 0;

        // Horizontal movement
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            moveX = -speed * dt;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            moveX = speed * dt;
        }

        // Vertical movement (jetpack)
        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            moveY = -speed * dt;
            // Jetpack flame visible
            this.jetpackFlame.setAlpha(0.6 + Math.random() * 0.4);
            this.jetpackFlame.setScale(0.8 + Math.random() * 0.4);
            // Jetpack particles
            if (Math.random() < 0.3) {
                this.addParticle(this.keeper.x - 6, this.keeper.y + 15, 0xFF6B6B);
            }
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            moveY = speed * dt * 0.7;
            this.jetpackFlame.setAlpha(0);
        } else {
            this.jetpackFlame.setAlpha(0);
        }

        // Check collisions
        const newX = this.keeper.x + moveX;
        const newY = this.keeper.y + moveY;

        const tileX = Math.floor(newX / TILE_SIZE);
        const tileY = Math.floor((newY - 100) / TILE_SIZE);

        // Only move if destination is clear
        if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
            if (this.map[tileY] && this.map[tileY][tileX] === TILES.AIR) {
                this.keeper.x = newX;
            }
        } else {
            this.keeper.x = newX;
        }

        if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
            if (this.map[tileY] && this.map[tileY][tileX] === TILES.AIR) {
                this.keeper.y = newY;
            }
        } else if (tileY < 0) {
            this.keeper.y = newY;
        }

        // Continuous drilling (hold space)
        if (this.wasd.space.isDown) {
            if (!this.drillCooldown || this.drillCooldown <= 0) {
                this.tryDrill();
                this.drillCooldown = 0.35; // Drill hit interval
            }
        }
        if (this.drillCooldown > 0) {
            this.drillCooldown -= dt;
        }

        // Drop resources
        if (Phaser.Input.Keyboard.JustDown(this.wasd.q)) {
            this.dropResources();
        }

        // Auto-pickup resources near keeper
        this.checkResourcePickup();

        // Deposit at dome
        if (Phaser.Math.Distance.Between(this.keeper.x, this.keeper.y, DOME_X, DOME_Y) < 50) {
            this.depositResources();
        }
    }

    tryDrill() {
        // Check all adjacent tiles
        const directions = [
            { dx: 0, dy: 1 },  // Down
            { dx: 1, dy: 0 },  // Right
            { dx: -1, dy: 0 }, // Left
            { dx: 0, dy: -1 }  // Up
        ];

        const keeperTileX = Math.floor(this.keeper.x / TILE_SIZE);
        const keeperTileY = Math.floor((this.keeper.y - 100) / TILE_SIZE);

        for (const dir of directions) {
            const tileX = keeperTileX + dir.dx;
            const tileY = keeperTileY + dir.dy;

            if (tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT) {
                if (this.map[tileY] && this.map[tileY][tileX] !== TILES.AIR && this.map[tileY][tileX] !== TILES.BEDROCK) {
                    this.drillTile(tileX, tileY);
                    return;
                }
            }
        }
    }

    drillTile(x, y) {
        if (!this.tileHealth[y] || this.tileHealth[y][x] === undefined) return;

        this.tileHealth[y][x] -= this.gameState.drillStrength;

        // Drill particles
        this.addParticle(
            x * TILE_SIZE + TILE_SIZE / 2,
            y * TILE_SIZE + TILE_SIZE / 2 + 100,
            TILE_COLORS[this.map[y][x]]
        );

        // Tile damage visualization (darken based on damage)
        if (this.tileSprites[y] && this.tileSprites[y][x]) {
            const maxHealth = TILE_HEALTH[this.map[y][x]] || 1;
            const healthPercent = this.tileHealth[y][x] / maxHealth;
            const alpha = 0.5 + healthPercent * 0.5;
            this.tileSprites[y][x].setAlpha(alpha);
        }

        if (this.tileHealth[y][x] <= 0) {
            const tileType = this.clearTile(x, y);

            // Spawn resource if ore
            if (tileType === TILES.IRON_ORE) {
                this.spawnResource(x, y, 'iron', 1 + Math.floor(Math.random() * 3));
            } else if (tileType === TILES.WATER_CRYSTAL) {
                this.spawnResource(x, y, 'water', 1 + Math.floor(Math.random() * 2));
            } else if (tileType === TILES.COBALT_ORE) {
                this.spawnResource(x, y, 'cobalt', 1 + Math.floor(Math.random() * 2));
            }
        }
    }

    spawnResource(tileX, tileY, type, amount) {
        for (let i = 0; i < amount; i++) {
            const x = tileX * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 10;
            const y = tileY * TILE_SIZE + TILE_SIZE / 2 + 100 + (Math.random() - 0.5) * 10;

            const colors = { iron: 0xB87333, water: 0x4A90D9, cobalt: 0x8B5CF6 };
            const resource = this.add.circle(x, y, 4, colors[type]);
            resource.resourceType = type;
            resource.setDepth(3);

            // Resource sparkle effect
            resource.sparkleTime = Math.random() * Math.PI * 2;

            if (!this.resources) this.resources = this.add.group();
            this.resources.add(resource);
        }
    }

    updateResources(dt) {
        if (!this.resources) return;

        this.resources.getChildren().forEach(resource => {
            // Sparkle effect
            resource.sparkleTime += dt * 3;
            resource.setScale(1 + Math.sin(resource.sparkleTime) * 0.15);
        });
    }

    checkResourcePickup() {
        if (!this.resources) return;

        const capacity = this.gameState.carryCapacity;
        if (this.gameState.carriedResources.length >= capacity) return;

        this.resources.getChildren().forEach(resource => {
            const dist = Phaser.Math.Distance.Between(
                this.keeper.x, this.keeper.y, resource.x, resource.y
            );

            if (dist < 20 && this.gameState.carriedResources.length < capacity) {
                this.gameState.carriedResources.push(resource.resourceType);
                resource.destroy();
            }
        });
    }

    depositResources() {
        this.gameState.carriedResources.forEach(type => {
            this.gameState[type]++;
            if (type === 'iron') {
                this.gameState.totalIronMined++;
            }
            // Deposit visual feedback
            this.addParticle(DOME_X, DOME_Y, type === 'iron' ? 0xB87333 : type === 'water' ? 0x4A90D9 : 0x8B5CF6);
        });
        this.gameState.carriedResources = [];
    }

    dropResources() {
        if (this.gameState.carriedResources.length === 0) return;

        // Drop one resource at a time
        const type = this.gameState.carriedResources.pop();
        const colors = { iron: 0xB87333, water: 0x4A90D9, cobalt: 0x8B5CF6 };
        const resource = this.add.circle(this.keeper.x, this.keeper.y + 10, 4, colors[type]);
        resource.resourceType = type;
        resource.setDepth(3);

        if (!this.resources) this.resources = this.add.group();
        this.resources.add(resource);
    }

    addParticle(x, y, color) {
        const particle = this.add.circle(x, y, 3, color);
        particle.vx = (Math.random() - 0.5) * 100;
        particle.vy = (Math.random() - 0.5) * 100;
        particle.life = 0.5;
        this.particles.push(particle);
    }

    updateParticles(dt) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt; // Gravity
            p.life -= dt;
            p.alpha = p.life * 2;

            if (p.life <= 0) {
                p.destroy();
                return false;
            }
            return true;
        });
    }

    updateUI() {
        this.phaseText.setText(this.gameState.phase === 'mining' ? 'MINING PHASE' : 'DEFENSE PHASE');
        this.phaseText.setFill(this.gameState.phase === 'mining' ? '#48BB78' : '#E53E3E');

        if (this.gameState.phase === 'mining') {
            this.timerText.setText(`Time: ${Math.ceil(this.gameState.phaseTimer)}s`);
        } else {
            this.timerText.setText(`Enemies: ${this.enemies.getLength()}`);
        }

        this.ironText.setText(`Iron: ${this.gameState.iron}`);
        this.waterText.setText(`Water: ${this.gameState.water}`);
        this.cobaltText.setText(`Cobalt: ${this.gameState.cobalt}`);
        this.waveText.setText(`Wave: ${this.gameState.wave}`);
        this.carryText.setText(`Carrying: ${this.gameState.carriedResources.length}/${this.gameState.carryCapacity}`);

        // Depth indicator
        const currentDepth = Math.max(0, Math.floor((this.keeper.y - 100) / TILE_SIZE) - 8);
        this.depthText.setText(`Depth: ${currentDepth}m`);

        // Dome HP bar
        const hpPercent = this.gameState.domeHP / this.gameState.domeMaxHP;
        this.domeHPBar.setScale(hpPercent, 1);
        this.domeHPBar.setFillStyle(hpPercent > 0.5 ? 0x48BB78 : hpPercent > 0.25 ? 0xF6E05E : 0xE53E3E);
    }

    gameOver() {
        // Game over screen
        this.add.rectangle(400, 300, 420, 280, 0x000000, 0.9).setScrollFactor(0).setDepth(200);
        this.add.text(400, 200, 'DOME DESTROYED', {
            fontSize: '32px',
            fill: '#E53E3E'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        // Stats
        const stats = [
            `Waves Survived: ${this.gameState.wave}`,
            `Enemies Killed: ${this.gameState.killCount}`,
            `Iron Mined: ${this.gameState.totalIronMined}`,
            `Max Depth: ${this.gameState.totalDepthReached} tiles`
        ];
        stats.forEach((stat, i) => {
            this.add.text(400, 250 + i * 25, stat, {
                fontSize: '16px',
                fill: '#F7FAFC'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
        });

        this.add.text(400, 380, 'Click to restart', {
            fontSize: '14px',
            fill: '#888888'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });

        this.scene.pause();
    }
}

// Upgrade Scene
class UpgradeScene extends Phaser.Scene {
    constructor() {
        super('UpgradeScene');
    }

    init(data) {
        this.gameState = data.gameState;
    }

    create() {
        // Semi-transparent background
        this.add.rectangle(400, 300, 600, 400, 0x000000, 0.9);

        // Title
        this.add.text(400, 130, 'UPGRADES', {
            fontSize: '28px',
            fill: '#F7FAFC'
        }).setOrigin(0.5);

        // Resources display
        this.add.text(400, 160, `Iron: ${this.gameState.iron} | Water: ${this.gameState.water} | Cobalt: ${this.gameState.cobalt}`, {
            fontSize: '14px',
            fill: '#888888'
        }).setOrigin(0.5);

        // Upgrades with scaling costs
        const drillTier = Math.floor((this.gameState.drillStrength - 2) / 5) + 1;
        const speedTier = Math.floor((this.gameState.moveSpeed - 120) / 20) + 1;
        const carryTier = Math.floor((this.gameState.carryCapacity - 3) / 2) + 1;
        const laserTier = Math.floor((this.gameState.laserDamage - 15) / 10) + 1;
        const laserSpeedTier = Math.floor((this.gameState.laserSpeed - 0.03) / 0.01) + 1;
        const domeTier = Math.floor((this.gameState.domeMaxHP - 800) / 200) + 1;

        const upgrades = [
            { name: 'Drill Strength', key: 'drillStrength', cost: 4 + drillTier * 2, current: this.gameState.drillStrength, increment: 5, tier: drillTier },
            { name: 'Move Speed', key: 'moveSpeed', cost: 4 + speedTier * 2, current: this.gameState.moveSpeed, increment: 20, tier: speedTier },
            { name: 'Carry Capacity', key: 'carryCapacity', cost: 4 + carryTier * 2, current: this.gameState.carryCapacity, increment: 2, tier: carryTier },
            { name: 'Laser Damage', key: 'laserDamage', cost: 6 + laserTier * 3, current: this.gameState.laserDamage, increment: 15, tier: laserTier },
            { name: 'Laser Speed', key: 'laserSpeed', cost: 6 + laserSpeedTier * 2, current: Math.round(this.gameState.laserSpeed * 100) / 100, increment: 0.01, tier: laserSpeedTier },
            { name: 'Dome HP', key: 'domeMaxHP', cost: 5 + domeTier * 3, current: this.gameState.domeMaxHP, increment: 300, tier: domeTier }
        ];

        upgrades.forEach((upg, i) => {
            const y = 200 + i * 45;

            this.add.text(150, y, `${upg.name} (Tier ${upg.tier})`, {
                fontSize: '15px',
                fill: '#F7FAFC'
            });

            this.add.text(350, y, `${upg.current}`, {
                fontSize: '14px',
                fill: '#48BB78'
            });

            const canAfford = this.gameState.iron >= upg.cost;
            const btn = this.add.rectangle(550, y + 5, 100, 30, canAfford ? 0x48BB78 : 0x333333);
            const btnText = this.add.text(550, y + 5, `${upg.cost} Iron`, {
                fontSize: '14px',
                fill: canAfford ? '#fff' : '#666'
            }).setOrigin(0.5);

            if (canAfford) {
                btn.setInteractive();
                btn.on('pointerdown', () => {
                    this.gameState.iron -= upg.cost;
                    this.gameState[upg.key] += upg.increment;
                    if (upg.key === 'domeMaxHP') {
                        this.gameState.domeHP = Math.min(this.gameState.domeHP + upg.increment, this.gameState.domeMaxHP);
                    }
                    this.scene.restart({ gameState: this.gameState });
                });
            }
        });

        // Close button
        const closeBtn = this.add.rectangle(400, 460, 120, 40, 0x4A5568);
        this.add.text(400, 460, 'Close', {
            fontSize: '18px',
            fill: '#F7FAFC'
        }).setOrigin(0.5);

        closeBtn.setInteractive();
        closeBtn.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('GameScene');
        });
    }
}

// Game Configuration
const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [BootScene, GameScene, UpgradeScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    }
};

// Start game
const game = new Phaser.Game(config);
