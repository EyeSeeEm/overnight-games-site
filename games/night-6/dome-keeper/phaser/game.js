// Dome Keeper Clone - Phaser 3
// Mining + Tower Defense Roguelike

const TILE_SIZE = 16;
const MAP_WIDTH = 80;
const MAP_HEIGHT = 100;
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

// Game state
let gamePaused = true;
let gameState = 'menu';
let phase = 'mining'; // 'mining' or 'defense'
let phaseTimer = 75;
let currentWave = 0;
let stats = {
    resourcesCollected: 0,
    tilesMined: 0,
    wavesSurvived: 0,
    upgradesPurchased: 0,
    enemiesKilled: 0
};

let gameTime = 0;
let debugLogs = [];

function logEvent(msg) {
    debugLogs.push(`[${gameTime}ms] ${msg}`);
}

// Rock types with depth-based spawning
const ROCK_TYPES = {
    air: { hp: 0, color: 0x1a0a0a, drops: [] },
    dirt: { hp: 1, color: 0x8B4513, drops: [] },
    soft_stone: { hp: 2, color: 0xA9A9A9, drops: ['iron'] },
    hard_stone: { hp: 4, color: 0x696969, drops: ['iron', 'water'] },
    dense_rock: { hp: 6, color: 0x4A4A4A, drops: ['iron', 'water'] },
    crystal_rock: { hp: 8, color: 0x4169E1, drops: ['cobalt'] },
    obsidian: { hp: 12, color: 0x2F1B41, drops: ['cobalt'] },
    iron_ore: { hp: 3, color: 0xB87333, drops: ['iron'], isOre: true },
    water_crystal: { hp: 4, color: 0x4A90D9, drops: ['water'], isOre: true },
    cobalt_ore: { hp: 6, color: 0x8B5CF6, drops: ['cobalt'], isOre: true },
    dome_base: { hp: Infinity, color: 0x4A5568, drops: [] },
    relic_node: { hp: 8, color: 0xFFD700, drops: ['relic_piece'], isRelic: true },
    final_relic: { hp: 12, color: 0xFF00FF, drops: ['relic'], isRelic: true }
};

// Enemy types
const ENEMY_TYPES = {
    walker: { hp: 40, damage: 12, speed: 90, color: 0xff4444 },
    flyer: { hp: 20, damage: 15, speed: 120, color: 0xff8844 },
    hornet: { hp: 100, damage: 45, speed: 65, color: 0xffaa00 },
    tick: { hp: 5, damage: 15, speed: 40, color: 0x44ff44 },
    diver: { hp: 30, damage: 100, speed: 400, color: 0x4444ff },
    boss: { hp: 500, damage: 30, speed: 30, color: 0xff00ff }
};

// Upgrades
const UPGRADES = {
    drillSpeed1: { cost: { iron: 5 }, effect: 'drillSpeed', value: 1.2, name: 'Drill Speed I' },
    drillSpeed2: { cost: { iron: 15 }, effect: 'drillSpeed', value: 1.4, requires: 'drillSpeed1', name: 'Drill Speed II' },
    drillStrength1: { cost: { iron: 10 }, effect: 'drillStrength', value: 2, name: 'Drill Strength I' },
    carryCapacity1: { cost: { iron: 10 }, effect: 'carryCapacity', value: 5, name: 'Carry Capacity I' },
    laserDamage1: { cost: { iron: 10, water: 5 }, effect: 'laserDamage', value: 30, name: 'Laser Damage I' },
    laserDamage2: { cost: { iron: 20, water: 10 }, effect: 'laserDamage', value: 55, requires: 'laserDamage1', name: 'Laser Damage II' },
    laserSpeed1: { cost: { iron: 8, water: 3 }, effect: 'laserSpeed', value: 0.3, name: 'Laser Speed I' },
    laserSight: { cost: { iron: 4 }, effect: 'laserSight', value: true, name: 'Laser Sight' },
    domeHP1: { cost: { iron: 20 }, effect: 'domeMaxHP', value: 1100, name: 'Dome HP I' },
    domeHP2: { cost: { iron: 40 }, effect: 'domeMaxHP', value: 1400, requires: 'domeHP1', name: 'Dome HP II' },
    jetpack: { cost: { cobalt: 5 }, effect: 'moveSpeed', value: 80, name: 'Jetpack' }
};

// Repair costs
const REPAIR_COST_PER_COBALT = 1; // cobalt spent
const REPAIR_FLAT_HP = 80;
const REPAIR_PERCENT_HP = 0.15; // 15% of max HP

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.scene.start('GameScene');
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Initialize game systems
        this.map = [];
        this.resources = { iron: 0, water: 0, cobalt: 0 };
        this.carriedResources = [];
        this.enemies = [];
        this.purchasedUpgrades = [];

        // Player stats
        this.playerStats = {
            drillSpeed: 1,
            drillStrength: 2,
            carryCapacity: 3,
            moveSpeed: 56
        };

        // Dome stats
        this.domeStats = {
            hp: 800,
            maxHP: 800,
            laserDamage: 15,
            laserSpeed: 0.2,
            laserAngle: -Math.PI / 2,
            laserSight: false
        };

        // Relic tracking
        this.relicNodesFound = 0;
        this.relicNodesTotal = 3;
        this.hasRelic = false;

        // Generate map
        this.generateMap();

        // Create tile graphics
        this.tileGraphics = this.add.graphics();
        this.renderTiles();

        // Create dome at top center
        this.domeX = MAP_WIDTH * TILE_SIZE / 2;
        this.domeY = 5 * TILE_SIZE;
        this.dome = this.add.rectangle(this.domeX, this.domeY, 64, 48, 0x87CEEB);
        this.dome.setStrokeStyle(2, 0x4A5568);

        // Create player (keeper)
        this.player = this.add.rectangle(this.domeX, this.domeY + 40, 16, 24, 0x48BB78);
        this.player.setStrokeStyle(1, 0x2F855A);
        this.playerX = Math.floor(this.domeX / TILE_SIZE);
        this.playerY = Math.floor((this.domeY + 40) / TILE_SIZE);

        // Laser beam graphics
        this.laserGraphics = this.add.graphics();

        // UI elements
        this.createUI();

        // Set up camera to follow player
        this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(2);

        // Input
        this.cursors = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Drilling state
        this.isDrilling = false;
        this.drillProgress = 0;
        this.drillTarget = null;
        this.drillCooldown = 0;

        // Menu state
        this.upgradeMenuOpen = false;

        // Set up harness
        this.setupHarness();

        // Start in menu
        gameState = 'menu';
        this.showMenu();
    }

    generateMap() {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.map[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                // Surface area
                if (y < 8) {
                    if (y < 5) {
                        this.map[y][x] = { type: 'air', hp: 0 };
                    } else if (x >= MAP_WIDTH/2 - 3 && x <= MAP_WIDTH/2 + 3) {
                        this.map[y][x] = { type: 'dome_base', hp: Infinity };
                    } else {
                        this.map[y][x] = { type: 'air', hp: 0 };
                    }
                    continue;
                }

                // Underground
                let tileType = this.getTileTypeForDepth(y, x);
                const rockType = ROCK_TYPES[tileType];
                this.map[y][x] = {
                    type: tileType,
                    hp: rockType.hp,
                    maxHp: rockType.hp
                };
            }
        }

        // Place resource clusters
        this.placeResourceClusters();
    }

    getTileTypeForDepth(y, x) {
        const depth = y - 8;
        const roll = Math.random();

        if (depth < 20) {
            if (roll < 0.4) return 'dirt';
            if (roll < 0.8) return 'soft_stone';
            return 'hard_stone';
        } else if (depth < 50) {
            if (roll < 0.2) return 'dirt';
            if (roll < 0.5) return 'soft_stone';
            if (roll < 0.8) return 'hard_stone';
            return 'dense_rock';
        } else if (depth < 80) {
            if (roll < 0.3) return 'hard_stone';
            if (roll < 0.6) return 'dense_rock';
            if (roll < 0.9) return 'crystal_rock';
            return 'obsidian';
        } else {
            if (roll < 0.3) return 'dense_rock';
            if (roll < 0.6) return 'crystal_rock';
            return 'obsidian';
        }
    }

    placeResourceClusters() {
        // Iron clusters (shallow)
        for (let i = 0; i < 40; i++) {
            const cx = Phaser.Math.Between(5, MAP_WIDTH - 5);
            const cy = Phaser.Math.Between(10, 60);
            this.growCluster(cx, cy, 'iron_ore', Phaser.Math.Between(3, 6));
        }

        // Water clusters (medium depth)
        for (let i = 0; i < 25; i++) {
            const cx = Phaser.Math.Between(5, MAP_WIDTH - 5);
            const cy = Phaser.Math.Between(25, 80);
            this.growCluster(cx, cy, 'water_crystal', Phaser.Math.Between(2, 4));
        }

        // Cobalt clusters (deep)
        for (let i = 0; i < 15; i++) {
            const cx = Phaser.Math.Between(5, MAP_WIDTH - 5);
            const cy = Phaser.Math.Between(50, MAP_HEIGHT - 10);
            this.growCluster(cx, cy, 'cobalt_ore', Phaser.Math.Between(1, 3));
        }

        // Relic nodes (spaced out at different depths)
        const relicDepths = [30, 55, 75];
        for (let i = 0; i < this.relicNodesTotal; i++) {
            const rx = Phaser.Math.Between(10, MAP_WIDTH - 10);
            const ry = relicDepths[i] + Phaser.Math.Between(-5, 5);
            this.placeRelicNode(rx, ry);
        }

        // Final relic at the bottom
        const finalX = Phaser.Math.Between(20, MAP_WIDTH - 20);
        const finalY = MAP_HEIGHT - 15;
        this.placeFinalRelic(finalX, finalY);
    }

    growCluster(cx, cy, type, size) {
        const queue = [{ x: cx, y: cy }];
        let placed = 0;

        while (queue.length > 0 && placed < size) {
            const pos = queue.shift();
            if (pos.x >= 0 && pos.x < MAP_WIDTH && pos.y >= 8 && pos.y < MAP_HEIGHT) {
                const tile = this.map[pos.y][pos.x];
                if (tile && tile.type !== 'air' && tile.type !== 'dome_base' && !ROCK_TYPES[tile.type].isOre) {
                    tile.type = type;
                    tile.hp = ROCK_TYPES[type].hp;
                    tile.maxHp = ROCK_TYPES[type].hp;
                    placed++;

                    // Add neighbors
                    if (Math.random() < 0.6) queue.push({ x: pos.x + 1, y: pos.y });
                    if (Math.random() < 0.6) queue.push({ x: pos.x - 1, y: pos.y });
                    if (Math.random() < 0.6) queue.push({ x: pos.x, y: pos.y + 1 });
                    if (Math.random() < 0.6) queue.push({ x: pos.x, y: pos.y - 1 });
                }
            }
        }
    }

    placeRelicNode(x, y) {
        if (y >= 8 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
            this.map[y][x] = { type: 'relic_node', hp: 8, maxHp: 8 };
        }
    }

    placeFinalRelic(x, y) {
        if (y >= 8 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
            // Place final relic surrounded by special tiles
            this.map[y][x] = { type: 'final_relic', hp: 12, maxHp: 12 };
            // Mark surrounding tiles as relic chamber
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const ny = y + dy;
                    const nx = x + dx;
                    if (ny >= 8 && ny < MAP_HEIGHT && nx >= 0 && nx < MAP_WIDTH) {
                        this.map[ny][nx] = { type: 'crystal_rock', hp: 10, maxHp: 10 };
                    }
                }
            }
        }
    }

    repairDome(cobaltSpent) {
        if (this.resources.cobalt >= cobaltSpent) {
            const healAmount = Math.floor(REPAIR_FLAT_HP + (this.domeStats.maxHP * REPAIR_PERCENT_HP)) * cobaltSpent;
            this.domeStats.hp = Math.min(this.domeStats.maxHP, this.domeStats.hp + healAmount);
            this.resources.cobalt -= cobaltSpent;
            // Screen shake feedback
            this.cameras.main.shake(100, 0.003);
            return true;
        }
        return false;
    }

    renderTiles() {
        this.tileGraphics.clear();

        // Get visible area from camera
        const cam = this.cameras.main;
        const startX = Math.max(0, Math.floor((cam.scrollX - SCREEN_WIDTH) / TILE_SIZE));
        const startY = Math.max(0, Math.floor((cam.scrollY - SCREEN_HEIGHT) / TILE_SIZE));
        const endX = Math.min(MAP_WIDTH, Math.ceil((cam.scrollX + SCREEN_WIDTH * 2) / TILE_SIZE));
        const endY = Math.min(MAP_HEIGHT, Math.ceil((cam.scrollY + SCREEN_HEIGHT * 2) / TILE_SIZE));

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.map[y][x];
                if (tile && tile.type !== 'air') {
                    const rockType = ROCK_TYPES[tile.type];
                    this.tileGraphics.fillStyle(rockType.color);
                    this.tileGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

                    // Draw damage indicator
                    if (tile.hp < tile.maxHp && tile.hp > 0) {
                        const damagePercent = 1 - (tile.hp / tile.maxHp);
                        this.tileGraphics.fillStyle(0x000000, damagePercent * 0.5);
                        this.tileGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    }
                }
            }
        }
    }

    createUI() {
        // UI container (fixed to camera)
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setScrollFactor(0);
        this.uiContainer.setDepth(100);

        // Top bar background
        const topBar = this.add.rectangle(200, 15, 400, 30, 0x1A202C, 0.9);
        this.uiContainer.add(topBar);

        // Wave text
        this.waveText = this.add.text(10, 5, 'WAVE: 0', { fontSize: '12px', fill: '#fff' });
        this.uiContainer.add(this.waveText);

        // Phase timer
        this.phaseText = this.add.text(100, 5, 'MINING: 75s', { fontSize: '12px', fill: '#48BB78' });
        this.uiContainer.add(this.phaseText);

        // Resources
        this.resourceText = this.add.text(220, 5, 'Fe:0 H2O:0 Co:0', { fontSize: '12px', fill: '#FFD700' });
        this.uiContainer.add(this.resourceText);

        // Carrying
        this.carryText = this.add.text(350, 5, 'Carry: 0/3', { fontSize: '12px', fill: '#87CEEB' });
        this.uiContainer.add(this.carryText);

        // Bottom bar - Dome HP
        const bottomBar = this.add.rectangle(200, 290, 400, 25, 0x1A202C, 0.9);
        this.uiContainer.add(bottomBar);

        this.domeHPText = this.add.text(10, 280, 'DOME: 800/800', { fontSize: '12px', fill: '#E53E3E' });
        this.uiContainer.add(this.domeHPText);

        // Instructions
        this.instructionText = this.add.text(200, 150, '', { fontSize: '14px', fill: '#fff', align: 'center' });
        this.instructionText.setOrigin(0.5);
        this.uiContainer.add(this.instructionText);

        // Menu overlay
        this.menuContainer = this.add.container(200, 150);
        this.menuContainer.setScrollFactor(0);
        this.menuContainer.setDepth(200);
        this.menuContainer.setVisible(false);
    }

    showMenu() {
        this.menuContainer.removeAll(true);

        const bg = this.add.rectangle(0, 0, 300, 200, 0x1A202C, 0.95);
        bg.setStrokeStyle(2, 0x48BB78);
        this.menuContainer.add(bg);

        const title = this.add.text(0, -70, 'DOME KEEPER', { fontSize: '24px', fill: '#48BB78' });
        title.setOrigin(0.5);
        this.menuContainer.add(title);

        const startText = this.add.text(0, 0, 'Press SPACE to Start', { fontSize: '16px', fill: '#fff' });
        startText.setOrigin(0.5);
        this.menuContainer.add(startText);

        const controls = this.add.text(0, 50, 'WASD: Dig | E: Upgrades | Q: Drop', { fontSize: '12px', fill: '#888' });
        controls.setOrigin(0.5);
        this.menuContainer.add(controls);

        this.menuContainer.setVisible(true);
    }

    showUpgradeMenu() {
        this.upgradeMenuOpen = true;
        this.menuContainer.removeAll(true);

        const bg = this.add.rectangle(0, 0, 350, 280, 0x1A202C, 0.95);
        bg.setStrokeStyle(2, 0x48BB78);
        this.menuContainer.add(bg);

        const title = this.add.text(0, -120, 'UPGRADES', { fontSize: '20px', fill: '#48BB78' });
        title.setOrigin(0.5);
        this.menuContainer.add(title);

        const resText = this.add.text(0, -95, `Iron: ${this.resources.iron} | Water: ${this.resources.water} | Cobalt: ${this.resources.cobalt}`,
            { fontSize: '12px', fill: '#FFD700' });
        resText.setOrigin(0.5);
        this.menuContainer.add(resText);

        let yPos = -60;
        let index = 1;
        for (const [key, upgrade] of Object.entries(UPGRADES)) {
            if (this.purchasedUpgrades.includes(key)) continue;
            if (upgrade.requires && !this.purchasedUpgrades.includes(upgrade.requires)) continue;

            const canAfford = this.canAffordUpgrade(upgrade);
            const costStr = Object.entries(upgrade.cost).map(([r, amt]) => `${r}:${amt}`).join(' ');
            const color = canAfford ? '#48BB78' : '#666';

            const text = this.add.text(-150, yPos, `${index}. ${upgrade.name} (${costStr})`,
                { fontSize: '11px', fill: color });
            this.menuContainer.add(text);

            // Store reference for click
            text.setInteractive();
            text.upgradeKey = key;
            text.on('pointerdown', () => this.purchaseUpgrade(key));

            yPos += 20;
            index++;
            if (index > 8) break;
        }

        const closeText = this.add.text(0, 110, 'Press E to close', { fontSize: '12px', fill: '#888' });
        closeText.setOrigin(0.5);
        this.menuContainer.add(closeText);

        this.menuContainer.setVisible(true);
    }

    hideUpgradeMenu() {
        this.upgradeMenuOpen = false;
        this.menuContainer.setVisible(false);
    }

    canAffordUpgrade(upgrade) {
        for (const [resource, amount] of Object.entries(upgrade.cost)) {
            if ((this.resources[resource] || 0) < amount) return false;
        }
        return true;
    }

    purchaseUpgrade(key) {
        const upgrade = UPGRADES[key];
        if (!upgrade || this.purchasedUpgrades.includes(key)) return;
        if (!this.canAffordUpgrade(upgrade)) return;

        // Deduct resources
        for (const [resource, amount] of Object.entries(upgrade.cost)) {
            this.resources[resource] -= amount;
        }

        // Apply upgrade
        if (upgrade.effect === 'drillSpeed') this.playerStats.drillSpeed = upgrade.value;
        else if (upgrade.effect === 'drillStrength') this.playerStats.drillStrength = upgrade.value;
        else if (upgrade.effect === 'carryCapacity') this.playerStats.carryCapacity = upgrade.value;
        else if (upgrade.effect === 'moveSpeed') this.playerStats.moveSpeed = upgrade.value;
        else if (upgrade.effect === 'laserDamage') this.domeStats.laserDamage = upgrade.value;
        else if (upgrade.effect === 'laserSpeed') this.domeStats.laserSpeed = upgrade.value;
        else if (upgrade.effect === 'laserSight') this.domeStats.laserSight = upgrade.value;
        else if (upgrade.effect === 'domeMaxHP') {
            this.domeStats.maxHP = upgrade.value;
            this.domeStats.hp = Math.min(this.domeStats.hp + 300, this.domeStats.maxHP);
        }

        this.purchasedUpgrades.push(key);
        stats.upgradesPurchased++;

        this.showUpgradeMenu(); // Refresh menu
    }

    update(time, delta) {
        if (gamePaused || gameState !== 'playing') {
            // Check for start
            if (gameState === 'menu' && Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
                this.startGame();
            }
            return;
        }

        const dt = delta / 1000;

        // Handle upgrade menu toggle
        if (Phaser.Input.Keyboard.JustDown(this.cursors.e)) {
            if (this.upgradeMenuOpen) {
                this.hideUpgradeMenu();
            } else if (this.isNearDome()) {
                this.showUpgradeMenu();
            }
        }

        if (this.upgradeMenuOpen) return;

        // Update based on phase
        if (phase === 'mining') {
            this.updateMiningPhase(dt);
        } else {
            this.updateDefensePhase(dt);
        }

        // Update UI
        this.updateUI();

        // Re-render visible tiles
        this.renderTiles();
    }

    updateMiningPhase(dt) {
        // Phase timer
        phaseTimer -= dt;
        if (phaseTimer <= 0) {
            this.startDefensePhase();
            return;
        }

        // Handle drilling cooldown
        if (this.drillCooldown > 0) {
            this.drillCooldown -= dt;
        }

        // Handle movement/drilling
        if (this.drillCooldown <= 0) {
            let dx = 0, dy = 0;
            if (this.cursors.w.isDown) dy = -1;
            else if (this.cursors.s.isDown) dy = 1;
            else if (this.cursors.a.isDown) dx = -1;
            else if (this.cursors.d.isDown) dx = 1;

            if (dx !== 0 || dy !== 0) {
                this.tryMoveOrDig(dx, dy);
            }
        }

        // Drop resources
        if (Phaser.Input.Keyboard.JustDown(this.cursors.q) && this.carriedResources.length > 0) {
            if (this.isNearDome()) {
                // Deposit at dome
                for (const res of this.carriedResources) {
                    this.resources[res]++;
                    stats.resourcesCollected++;
                }
                this.carriedResources = [];
            } else {
                // Drop one resource
                this.carriedResources.pop();
            }
        }

        // Auto-deposit at dome
        if (this.isNearDome() && this.carriedResources.length > 0) {
            const deposited = this.carriedResources.length;
            for (const res of this.carriedResources) {
                this.resources[res]++;
                stats.resourcesCollected++;
            }
            logEvent(`Deposited ${deposited} resources at dome`);
            this.carriedResources = [];
        }

        // Check victory condition - relic delivered to dome
        if (this.isNearDome() && this.hasRelic) {
            this.cameras.main.shake(500, 0.03);
            this.victory();
            return;
        }

        // Update player position
        this.player.x = this.playerX * TILE_SIZE + TILE_SIZE / 2;
        this.player.y = this.playerY * TILE_SIZE + TILE_SIZE / 2;
    }

    tryMoveOrDig(dx, dy) {
        const newX = this.playerX + dx;
        const newY = this.playerY + dy;

        // Bounds check
        if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) return;

        const tile = this.map[newY][newX];

        // Air or empty - move freely
        if (tile.type === 'air' || tile.hp <= 0) {
            this.playerX = newX;
            this.playerY = newY;
            this.drillCooldown = 0.1;
            return;
        }

        // Dome base - can't dig
        if (tile.type === 'dome_base') return;

        // Dig the tile
        const damage = this.playerStats.drillStrength;
        tile.hp -= damage;

        if (tile.hp <= 0) {
            // Tile destroyed
            stats.tilesMined++;
            logEvent(`Tile mined: ${tile.type} at (${newX}, ${newY})`);

            // Handle relic nodes
            const rockType = ROCK_TYPES[tile.type];
            if (rockType.isRelic) {
                if (tile.type === 'relic_node') {
                    this.relicNodesFound++;
                    this.showMessage(`Relic Node Found! ${this.relicNodesFound}/${this.relicNodesTotal}`);
                    this.cameras.main.shake(200, 0.01);
                } else if (tile.type === 'final_relic') {
                    if (this.relicNodesFound >= this.relicNodesTotal) {
                        this.hasRelic = true;
                        this.showMessage('FINAL RELIC ACQUIRED! Return to dome to win!');
                        this.cameras.main.shake(500, 0.02);
                    } else {
                        this.showMessage(`Find all ${this.relicNodesTotal} relic nodes first!`);
                    }
                }
            }

            // Drop resources
            if (rockType.drops.length > 0 && this.carriedResources.length < this.playerStats.carryCapacity) {
                const drop = Phaser.Math.RND.pick(rockType.drops);
                if (drop !== 'relic_piece' && drop !== 'relic') {
                    if (Math.random() < (rockType.isOre ? 0.8 : 0.3)) {
                        this.carriedResources.push(drop);
                    }
                }
            }

            tile.type = 'air';
            tile.hp = 0;

            // Move into the space
            this.playerX = newX;
            this.playerY = newY;
        }

        this.drillCooldown = 0.35 / this.playerStats.drillSpeed;
    }

    isNearDome() {
        const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.domeX, this.domeY
        );
        return dist < 60;
    }

    startDefensePhase() {
        phase = 'defense';
        currentWave++;
        logEvent(`Defense phase started: Wave ${currentWave}`);

        // Spawn enemies
        this.spawnWave();
    }

    spawnWave() {
        const waveWeight = 40 + currentWave * 30;
        let remainingWeight = waveWeight;

        const enemyPool = [
            { type: 'walker', weight: 20, minWave: 1 },
            { type: 'flyer', weight: 25, minWave: 2 },
            { type: 'tick', weight: 10, minWave: 3 },
            { type: 'hornet', weight: 80, minWave: 5 },
            { type: 'diver', weight: 70, minWave: 7 },
            { type: 'boss', weight: 200, minWave: 10 }
        ];

        while (remainingWeight > 0) {
            const valid = enemyPool.filter(e => e.weight <= remainingWeight && e.minWave <= currentWave);
            if (valid.length === 0) break;

            const selected = Phaser.Math.RND.pick(valid);
            this.spawnEnemy(selected.type);
            remainingWeight -= selected.weight;
        }
    }

    spawnEnemy(type) {
        const config = ENEMY_TYPES[type];
        const side = Math.random() < 0.5 ? -1 : 1;
        const x = this.domeX + side * (200 + Math.random() * 100);
        const y = this.domeY - 50 + Math.random() * 100;

        const enemy = this.add.rectangle(x, y, 16, 16, config.color);
        enemy.enemyType = type;
        enemy.hp = config.hp;
        enemy.maxHp = config.hp;
        enemy.damage = config.damage;
        enemy.speed = config.speed;
        enemy.stunTimer = 0;

        this.enemies.push(enemy);
    }

    updateDefensePhase(dt) {
        // Update laser angle toward mouse
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const targetAngle = Phaser.Math.Angle.Between(this.domeX, this.domeY, worldPoint.x, worldPoint.y);

        const angleDiff = Phaser.Math.Angle.Wrap(targetAngle - this.domeStats.laserAngle);
        const rotateAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.domeStats.laserSpeed);
        this.domeStats.laserAngle += rotateAmount;

        // Fire laser if clicking
        this.laserGraphics.clear();

        // Draw laser sight line if upgrade purchased
        if (this.domeStats.laserSight && !pointer.isDown) {
            const sightLength = 400;
            const sightEndX = this.domeX + Math.cos(this.domeStats.laserAngle) * sightLength;
            const sightEndY = this.domeY + Math.sin(this.domeStats.laserAngle) * sightLength;
            this.laserGraphics.lineStyle(1, 0xff6666, 0.5);
            this.laserGraphics.beginPath();
            this.laserGraphics.moveTo(this.domeX, this.domeY);
            this.laserGraphics.lineTo(sightEndX, sightEndY);
            this.laserGraphics.strokePath();
        }

        if (pointer.isDown) {
            this.fireLaser(dt);
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // Stun timer
            if (enemy.stunTimer > 0) {
                enemy.stunTimer -= dt;
                continue;
            }

            // Move toward dome
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.domeX, this.domeY);
            enemy.x += Math.cos(angle) * enemy.speed * dt;
            enemy.y += Math.sin(angle) * enemy.speed * dt;

            // Attack dome
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.domeX, this.domeY);
            if (dist < 40) {
                this.domeStats.hp -= enemy.damage * dt;
                // Screen shake when taking damage
                if (Math.random() < 0.1) {
                    this.cameras.main.shake(100, 0.005);
                }
                if (this.domeStats.hp <= 0) {
                    this.cameras.main.shake(500, 0.02);
                    this.gameOver();
                    return;
                }
            }

            // Remove dead enemies
            if (enemy.hp <= 0) {
                logEvent(`Enemy killed: ${enemy.enemyType}`);
                enemy.destroy();
                this.enemies.splice(i, 1);
                stats.enemiesKilled++;
            }
        }

        // Check wave complete
        if (this.enemies.length === 0) {
            stats.wavesSurvived++;
            this.endDefensePhase();
        }
    }

    fireLaser(dt) {
        const beamLength = 400;
        const endX = this.domeX + Math.cos(this.domeStats.laserAngle) * beamLength;
        const endY = this.domeY + Math.sin(this.domeStats.laserAngle) * beamLength;

        // Draw laser beam
        this.laserGraphics.lineStyle(4, 0xFF6B6B);
        this.laserGraphics.beginPath();
        this.laserGraphics.moveTo(this.domeX, this.domeY);
        this.laserGraphics.lineTo(endX, endY);
        this.laserGraphics.strokePath();

        // Glow effect
        this.laserGraphics.lineStyle(8, 0xFFE66D, 0.3);
        this.laserGraphics.beginPath();
        this.laserGraphics.moveTo(this.domeX, this.domeY);
        this.laserGraphics.lineTo(endX, endY);
        this.laserGraphics.strokePath();

        // Check enemy hits
        for (const enemy of this.enemies) {
            const dist = Phaser.Math.Distance.BetweenPoints(
                { x: enemy.x, y: enemy.y },
                Phaser.Geom.Line.GetNearestPoint(
                    new Phaser.Geom.Line(this.domeX, this.domeY, endX, endY),
                    { x: enemy.x, y: enemy.y }
                )
            );

            if (dist < 20) {
                enemy.hp -= this.domeStats.laserDamage * dt;
                enemy.stunTimer = 0.2;
            }
        }
    }

    endDefensePhase() {
        phase = 'mining';
        phaseTimer = Math.max(30, 75 - currentWave * 2);

        // Move player back to dome area if far away
        if (!this.isNearDome()) {
            // Keep player where they are
        }
    }

    updateUI() {
        this.waveText.setText(`WAVE: ${currentWave}`);

        if (phase === 'mining') {
            this.phaseText.setText(`MINING: ${Math.ceil(phaseTimer)}s`);
            this.phaseText.setFill('#48BB78');
        } else {
            this.phaseText.setText(`DEFENSE: ${this.enemies.length} enemies`);
            this.phaseText.setFill('#E53E3E');
        }

        this.resourceText.setText(`Fe:${this.resources.iron} H2O:${this.resources.water} Co:${this.resources.cobalt}`);
        this.carryText.setText(`Carry: ${this.carriedResources.length}/${this.playerStats.carryCapacity}`);
        this.domeHPText.setText(`DOME: ${Math.ceil(this.domeStats.hp)}/${this.domeStats.maxHP}`);

        // Instructions
        if (this.isNearDome() && phase === 'mining') {
            this.instructionText.setText('E: Upgrades | Resources auto-deposit');
        } else if (phase === 'mining') {
            this.instructionText.setText('WASD to dig | Return to dome before wave!');
        } else {
            this.instructionText.setText('Click and hold to fire laser!');
        }
    }

    showMessage(text, duration = 2000) {
        // Create temporary message overlay
        if (this.messageText) {
            this.messageText.destroy();
        }

        this.messageText = this.add.text(200, 130, text, {
            fontSize: '14px',
            fill: '#FFD700',
            backgroundColor: '#1A202C',
            padding: { x: 10, y: 5 }
        });
        this.messageText.setOrigin(0.5);
        this.messageText.setScrollFactor(0);
        this.messageText.setDepth(150);

        // Auto-destroy after duration
        this.time.delayedCall(duration, () => {
            if (this.messageText) {
                this.messageText.destroy();
                this.messageText = null;
            }
        });
    }

    victory() {
        gameState = 'victory';
        gamePaused = true;

        this.menuContainer.removeAll(true);

        const bg = this.add.rectangle(0, 0, 300, 220, 0x1A202C, 0.95);
        bg.setStrokeStyle(2, 0x48BB78);
        this.menuContainer.add(bg);

        const title = this.add.text(0, -80, 'VICTORY!', { fontSize: '24px', fill: '#48BB78' });
        title.setOrigin(0.5);
        this.menuContainer.add(title);

        const subtitle = this.add.text(0, -50, 'RELIC RECOVERED', { fontSize: '14px', fill: '#FFD700' });
        subtitle.setOrigin(0.5);
        this.menuContainer.add(subtitle);

        const statsText = this.add.text(0, 10,
            `Waves Survived: ${stats.wavesSurvived}\nResources: ${stats.resourcesCollected}\nTiles Mined: ${stats.tilesMined}\nUpgrades: ${stats.upgradesPurchased}\nEnemies Killed: ${stats.enemiesKilled}`,
            { fontSize: '12px', fill: '#fff', align: 'center' });
        statsText.setOrigin(0.5);
        this.menuContainer.add(statsText);

        const restart = this.add.text(0, 80, 'Press SPACE to play again', { fontSize: '14px', fill: '#888' });
        restart.setOrigin(0.5);
        this.menuContainer.add(restart);

        this.menuContainer.setVisible(true);

        // Listen for restart
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
            gamePaused = true;
            gameState = 'menu';
            stats = { resourcesCollected: 0, tilesMined: 0, wavesSurvived: 0, upgradesPurchased: 0, enemiesKilled: 0 };
        });
    }

    startGame() {
        gameState = 'playing';
        phase = 'mining';
        phaseTimer = 75;
        currentWave = 0;
        this.menuContainer.setVisible(false);
    }

    gameOver() {
        gameState = 'gameover';
        gamePaused = true;

        this.menuContainer.removeAll(true);

        const bg = this.add.rectangle(0, 0, 300, 200, 0x1A202C, 0.95);
        bg.setStrokeStyle(2, 0xE53E3E);
        this.menuContainer.add(bg);

        const title = this.add.text(0, -50, 'DOME DESTROYED', { fontSize: '20px', fill: '#E53E3E' });
        title.setOrigin(0.5);
        this.menuContainer.add(title);

        const statsText = this.add.text(0, 0,
            `Waves: ${stats.wavesSurvived}\nResources: ${stats.resourcesCollected}\nTiles: ${stats.tilesMined}`,
            { fontSize: '14px', fill: '#fff', align: 'center' });
        statsText.setOrigin(0.5);
        this.menuContainer.add(statsText);

        const restart = this.add.text(0, 60, 'Press SPACE to restart', { fontSize: '14px', fill: '#888' });
        restart.setOrigin(0.5);
        this.menuContainer.add(restart);

        this.menuContainer.setVisible(true);

        // Listen for restart
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
            gamePaused = true;
            gameState = 'menu';
            stats = { resourcesCollected: 0, tilesMined: 0, wavesSurvived: 0, upgradesPurchased: 0, enemiesKilled: 0 };
        });
    }

    setupHarness() {
        const scene = this;
        let activeKeys = new Set();
        let mouseState = { x: 200, y: 150, isDown: false };

        // Manual tick function for time-accelerated execution
        const runTick = (dt) => {
            gameTime += dt;
            const dtSec = dt / 1000;

            if (phase === 'mining') {
                // Mining phase logic
                phaseTimer -= dtSec;
                if (phaseTimer <= 0) {
                    scene.startDefensePhase();
                    return;
                }

                // Drilling cooldown
                if (scene.drillCooldown > 0) {
                    scene.drillCooldown -= dtSec;
                }

                // Movement/drilling
                if (scene.drillCooldown <= 0) {
                    let dx = 0, dy = 0;
                    if (activeKeys.has('w')) dy = -1;
                    else if (activeKeys.has('s')) dy = 1;
                    else if (activeKeys.has('a')) dx = -1;
                    else if (activeKeys.has('d')) dx = 1;

                    if (dx !== 0 || dy !== 0) {
                        scene.tryMoveOrDig(dx, dy);
                    }
                }

                // Auto-deposit at dome
                if (scene.isNearDome() && scene.carriedResources.length > 0) {
                    const deposited = scene.carriedResources.length;
                    for (const res of scene.carriedResources) {
                        scene.resources[res]++;
                        stats.resourcesCollected++;
                    }
                    logEvent(`Deposited ${deposited} resources at dome`);
                    scene.carriedResources = [];
                }

                // Update player position
                scene.player.x = scene.playerX * TILE_SIZE + TILE_SIZE / 2;
                scene.player.y = scene.playerY * TILE_SIZE + TILE_SIZE / 2;

            } else {
                // Defense phase logic
                // Update laser angle toward mouse
                const worldPoint = scene.cameras.main.getWorldPoint(mouseState.x, mouseState.y);
                const targetAngle = Phaser.Math.Angle.Between(scene.domeX, scene.domeY, worldPoint.x, worldPoint.y);
                const angleDiff = Phaser.Math.Angle.Wrap(targetAngle - scene.domeStats.laserAngle);
                const rotateAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), scene.domeStats.laserSpeed);
                scene.domeStats.laserAngle += rotateAmount;

                // Fire laser if mouse down
                if (mouseState.isDown) {
                    scene.fireLaserTick(dtSec);
                }

                // Update enemies
                for (let i = scene.enemies.length - 1; i >= 0; i--) {
                    const enemy = scene.enemies[i];

                    // Check death FIRST (before any continue)
                    if (enemy.hp <= 0) {
                        logEvent(`Enemy killed: ${enemy.enemyType}`);
                        enemy.destroy();
                        scene.enemies.splice(i, 1);
                        stats.enemiesKilled++;
                        continue;
                    }

                    if (enemy.stunTimer > 0) {
                        enemy.stunTimer -= dtSec;
                        continue;
                    }

                    // Move toward dome
                    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, scene.domeX, scene.domeY);
                    enemy.x += Math.cos(angle) * enemy.speed * dtSec;
                    enemy.y += Math.sin(angle) * enemy.speed * dtSec;

                    // Attack dome
                    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, scene.domeX, scene.domeY);
                    if (dist < 40) {
                        scene.domeStats.hp -= enemy.damage * dtSec;
                        if (scene.domeStats.hp <= 0) {
                            logEvent('Dome destroyed!');
                            scene.gameOver();
                            return;
                        }
                    }
                }

                // Check wave complete
                if (scene.enemies.length === 0) {
                    stats.wavesSurvived++;
                    logEvent(`Wave ${currentWave} survived!`);
                    scene.endDefensePhase();
                }
            }
        };

        // Laser firing for tick-based execution
        scene.fireLaserTick = (dtSec) => {
            const beamLength = 400;
            const endX = scene.domeX + Math.cos(scene.domeStats.laserAngle) * beamLength;
            const endY = scene.domeY + Math.sin(scene.domeStats.laserAngle) * beamLength;

            // Check enemy hits
            for (const enemy of scene.enemies) {
                const dist = Phaser.Math.Distance.BetweenPoints(
                    { x: enemy.x, y: enemy.y },
                    Phaser.Geom.Line.GetNearestPoint(
                        new Phaser.Geom.Line(scene.domeX, scene.domeY, endX, endY),
                        { x: enemy.x, y: enemy.y }
                    )
                );

                if (dist < 20) {
                    enemy.hp -= scene.domeStats.laserDamage * dtSec;
                    enemy.stunTimer = 0.2;
                }
            }
        };

        window.harness = {
            execute: async ({ keys = [], mouseX, mouseY, mouseDown = false, duration = 500, screenshot = false }) => {
                const startReal = performance.now();
                debugLogs = [];

                // Set active keys
                activeKeys = new Set(keys.map(k => k.toLowerCase()));

                // Set mouse state
                if (mouseX !== undefined) mouseState.x = mouseX;
                if (mouseY !== undefined) mouseState.y = mouseY;
                mouseState.isDown = mouseDown;

                // Run physics ticks (TIME-ACCELERATED)
                const dt = 16;
                const ticks = Math.ceil(duration / dt);

                for (let i = 0; i < ticks; i++) {
                    if (gameState === 'gameover' || gameState === 'victory') break;
                    runTick(dt);
                }

                // Clear keys
                activeKeys.clear();
                mouseState.isDown = false;

                // Render final frame
                scene.renderTiles();
                scene.updateUI();

                // Screenshot
                let screenshotData = null;
                if (screenshot) {
                    screenshotData = scene.game.canvas.toDataURL('image/png');
                }

                return {
                    screenshot: screenshotData,
                    logs: [...debugLogs],
                    state: window.harness.getState(),
                    realTime: performance.now() - startReal
                };
            },

            getState: () => ({
                gameState,
                phase,
                phaseTimer,
                currentWave,
                gameTime,
                player: {
                    x: scene.player?.x || 0,
                    y: scene.player?.y || 0,
                    tileX: scene.playerX,
                    tileY: scene.playerY,
                    carriedResources: scene.carriedResources?.length || 0,
                    carryCapacity: scene.playerStats?.carryCapacity || 3
                },
                dome: {
                    hp: scene.domeStats?.hp || 0,
                    maxHP: scene.domeStats?.maxHP || 800,
                    laserAngle: scene.domeStats?.laserAngle || 0
                },
                resources: scene.resources || { iron: 0, water: 0, cobalt: 0 },
                enemies: (scene.enemies || []).map(e => ({
                    x: e.x,
                    y: e.y,
                    type: e.enemyType,
                    hp: e.hp
                })),
                stats,
                isNearDome: scene.isNearDome?.() || false,
                relic: {
                    nodesFound: scene.relicNodesFound || 0,
                    nodesTotal: scene.relicNodesTotal || 3,
                    hasRelic: scene.hasRelic || false
                }
            }),

            getPhase: () => {
                if (gameState === 'menu') return 'menu';
                if (gameState === 'gameover') return 'gameover';
                if (gameState === 'victory') return 'victory';
                return 'playing';
            },

            debug: {
                setHealth: (hp) => {
                    if (scene.domeStats) scene.domeStats.hp = hp;
                },
                forceStart: () => {
                    gameState = 'playing';
                    phase = 'mining';
                    phaseTimer = 75;
                    currentWave = 0;
                    gamePaused = true; // Keep paused for harness control
                    gameTime = 0;
                    debugLogs = [];
                    scene.menuContainer?.setVisible(false);
                },
                clearEnemies: () => {
                    scene.enemies?.forEach(e => e.destroy());
                    scene.enemies = [];
                },
                addResources: (iron, water, cobalt) => {
                    if (scene.resources) {
                        scene.resources.iron += iron || 0;
                        scene.resources.water += water || 0;
                        scene.resources.cobalt += cobalt || 0;
                    }
                },
                skipToDefense: () => {
                    phaseTimer = 0;
                },
                teleportPlayer: (x, y) => {
                    scene.playerX = x;
                    scene.playerY = y;
                },
                restart: () => {
                    gameState = 'menu';
                    phase = 'mining';
                    phaseTimer = 75;
                    currentWave = 0;
                    gameTime = 0;
                    debugLogs = [];
                    stats = { resourcesCollected: 0, tilesMined: 0, wavesSurvived: 0, upgradesPurchased: 0, enemiesKilled: 0 };
                    scene.scene.restart();
                }
            },

            version: '2.0',
            gameInfo: {
                name: 'Dome Keeper Clone',
                type: 'mining_tower_defense',
                controls: {
                    movement: ['w', 'a', 's', 'd'],
                    actions: { deposit: 'q', upgrades: 'e' },
                    laser: { mouseAim: true, mouseClick: 'fire' }
                }
            }
        };

        console.log('[HARNESS v2] Dome Keeper harness initialized');
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a0a0a',
    scene: [BootScene, GameScene],
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    }
};

const game = new Phaser.Game(config);
