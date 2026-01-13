// Motherload Clone - Phaser 3
// Mars Mining Game

const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;
const TILE_SIZE = 20;
const WORLD_WIDTH = 40;
const WORLD_HEIGHT = 300;
const SURFACE_Y = 3;

// Game state
let gamePaused = true;
let gameState = 'menu';
let stats = {
    mineralsCollected: 0,
    depthReached: 0,
    cashEarned: 0,
    upgradesPurchased: 0,
    trips: 0
};

// Minerals
const MINERALS = {
    ironium: { name: 'Ironium', value: 30, weight: 10, color: 0x8B4513, minDepth: 25 },
    bronzium: { name: 'Bronzium', value: 60, weight: 10, color: 0xCD7F32, minDepth: 25 },
    silverium: { name: 'Silverium', value: 100, weight: 10, color: 0xC0C0C0, minDepth: 25 },
    goldium: { name: 'Goldium', value: 250, weight: 20, color: 0xFFD700, minDepth: 100 },
    platinum: { name: 'Platinum', value: 750, weight: 30, color: 0xE5E4E2, minDepth: 500 },
    einsteinium: { name: 'Einsteinium', value: 2000, weight: 40, color: 0x00FF00, minDepth: 1000 },
    emerald: { name: 'Emerald', value: 5000, weight: 60, color: 0x50C878, minDepth: 1500 },
    ruby: { name: 'Ruby', value: 20000, weight: 80, color: 0xE0115F, minDepth: 2500 },
    diamond: { name: 'Diamond', value: 100000, weight: 100, color: 0xB9F2FF, minDepth: 3500 }
};

// Upgrades
const UPGRADES = {
    drill: {
        name: 'Drill',
        tiers: [
            { name: 'Stock Drill', speed: 1, price: 0 },
            { name: 'Silvide Drill', speed: 1.4, price: 750 },
            { name: 'Goldium Drill', speed: 2, price: 2000 },
            { name: 'Emerald Drill', speed: 2.5, price: 5000 },
            { name: 'Ruby Drill', speed: 3.5, price: 20000 },
            { name: 'Diamond Drill', speed: 5, price: 100000 }
        ]
    },
    hull: {
        name: 'Hull',
        tiers: [
            { name: 'Stock Hull', hp: 10, price: 0 },
            { name: 'Ironium Hull', hp: 17, price: 750 },
            { name: 'Bronzium Hull', hp: 30, price: 2000 },
            { name: 'Steel Hull', hp: 50, price: 5000 },
            { name: 'Platinum Hull', hp: 80, price: 20000 },
            { name: 'Energy Hull', hp: 120, price: 100000 }
        ]
    },
    fuel: {
        name: 'Fuel Tank',
        tiers: [
            { name: 'Micro Tank', capacity: 10, price: 0 },
            { name: 'Medium Tank', capacity: 15, price: 750 },
            { name: 'Huge Tank', capacity: 25, price: 2000 },
            { name: 'Gigantic Tank', capacity: 40, price: 5000 },
            { name: 'Titanic Tank', capacity: 60, price: 20000 },
            { name: 'Leviathan Tank', capacity: 100, price: 100000 }
        ]
    },
    cargo: {
        name: 'Cargo Bay',
        tiers: [
            { name: 'Micro Bay', capacity: 7, price: 0 },
            { name: 'Medium Bay', capacity: 15, price: 750 },
            { name: 'Huge Bay', capacity: 25, price: 2000 },
            { name: 'Gigantic Bay', capacity: 40, price: 5000 },
            { name: 'Titanic Bay', capacity: 70, price: 20000 }
        ]
    },
    radiator: {
        name: 'Radiator',
        tiers: [
            { name: 'Stock Fan', reduction: 0, price: 0 },
            { name: 'Dual Fans', reduction: 0.1, price: 2000 },
            { name: 'Single Turbine', reduction: 0.25, price: 5000 },
            { name: 'Dual Turbines', reduction: 0.4, price: 20000 },
            { name: 'Puron Cooling', reduction: 0.6, price: 100000 }
        ]
    }
};

// Consumable items
const CONSUMABLES = {
    reserveFuel: { name: 'Reserve Fuel', price: 2000, effect: 'fuel', amount: 25 },
    nanobots: { name: 'Hull Nanobots', price: 7500, effect: 'repair', amount: 30 },
    dynamite: { name: 'Dynamite', price: 2000, effect: 'explode', radius: 3 },
    teleporter: { name: 'Teleporter', price: 10000, effect: 'surface' }
};

// Depth transmissions
const TRANSMISSIONS = [
    { depth: 500, speaker: 'Mr. Natas', text: 'Excellent progress! Here is a $1,000 bonus.', bonus: 1000 },
    { depth: 1000, speaker: 'Mr. Natas', text: 'You are doing splendidly! $3,000 bonus!', bonus: 3000 },
    { depth: 1750, speaker: 'Unknown', text: 'The eyes... Oh my god, THE EYES!!!', bonus: 0 },
    { depth: 2500, speaker: 'Mr. Natas', text: 'Keep going! Riches await you below!', bonus: 0 }
];

// Surface buildings
const BUILDINGS = {
    fuelStation: { x: 2, width: 4, name: 'Fuel Station', color: 0x4488ff },
    processor: { x: 10, width: 4, name: 'Mineral Processor', color: 0x44ff44 },
    junkShop: { x: 18, width: 4, name: 'Junk Shop', color: 0xffaa44 },
    repairShop: { x: 26, width: 4, name: 'Repair Shop', color: 0xff4444 }
};

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
        gameState = 'playing';

        // Initialize player
        this.player = {
            x: 15,
            y: SURFACE_Y,
            fuel: 10,
            maxFuel: 10,
            hull: 10,
            maxHull: 10,
            cash: 100,
            score: 0,
            cargo: [],
            cargoCapacity: 7,
            drillSpeed: 1,
            radiatorReduction: 0,
            upgrades: {
                drill: 0,
                hull: 0,
                fuel: 0,
                cargo: 0,
                radiator: 0
            },
            consumables: {
                reserveFuel: 0,
                nanobots: 0,
                dynamite: 0,
                teleporter: 0
            }
        };

        // Track received transmissions
        this.receivedTransmissions = [];
        this.maxDepthReached = 0;

        // Generate world
        this.tiles = [];
        this.generateWorld();

        // Tile graphics
        this.tileGraphics = this.add.graphics();
        this.renderTiles();

        // Create player sprite
        this.playerSprite = this.add.rectangle(
            this.player.x * TILE_SIZE + TILE_SIZE / 2,
            this.player.y * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE - 4, TILE_SIZE - 4, 0xffaa00
        );
        this.playerSprite.setStrokeStyle(2, 0xff6600);
        this.playerSprite.setDepth(10);

        // Drill indicator
        this.drillIndicator = this.add.rectangle(0, 0, TILE_SIZE - 6, 4, 0xff0000);
        this.drillIndicator.setVisible(false);
        this.drillIndicator.setDepth(11);

        // Camera setup
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH * TILE_SIZE, WORLD_HEIGHT * TILE_SIZE);
        this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);

        // Create UI
        this.createUI();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            e: Phaser.Input.Keyboard.KeyCodes.E,
            one: Phaser.Input.Keyboard.KeyCodes.ONE,
            r: Phaser.Input.Keyboard.KeyCodes.R, // Reserve fuel
            f: Phaser.Input.Keyboard.KeyCodes.F, // Nanobots (fix hull)
            t: Phaser.Input.Keyboard.KeyCodes.T, // Teleporter
            x: Phaser.Input.Keyboard.KeyCodes.X  // Dynamite
        });

        // Track last key press to prevent spam
        this.lastConsumableUse = 0;

        // Drilling state
        this.isDrilling = false;
        this.drillProgress = 0;
        this.drillTarget = null;
        this.moveCooldown = 0;

        // Physics
        this.velocityY = 0;
        this.isGrounded = false;

        // Shop state
        this.shopOpen = false;
        this.currentShop = null;

        // Setup harness
        this.setupHarness();
    }

    generateWorld() {
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < WORLD_WIDTH; x++) {
                // Surface/sky
                if (y < SURFACE_Y) {
                    this.tiles[y][x] = { type: 'sky', solid: false };
                    continue;
                }

                // Surface buildings
                if (y === SURFACE_Y) {
                    let isBuilding = false;
                    for (const building of Object.values(BUILDINGS)) {
                        if (x >= building.x && x < building.x + building.width) {
                            this.tiles[y][x] = { type: 'building', solid: true };
                            isBuilding = true;
                            break;
                        }
                    }
                    if (!isBuilding) {
                        this.tiles[y][x] = { type: 'surface', solid: false };
                    }
                    continue;
                }

                // Underground
                const depth = (y - SURFACE_Y) * 10; // Convert to ft
                let tileType = this.generateTile(depth, x, y);
                this.tiles[y][x] = tileType;
            }
        }
    }

    generateTile(depth, x, y) {
        const roll = Math.random();

        // Empty space chance increases with depth
        const emptyChance = 0.02 + depth / 50000;
        if (roll < emptyChance) {
            return { type: 'empty', solid: false };
        }

        // Rock chance
        const rockChance = 0.2 + depth / 20000;
        if (roll < emptyChance + rockChance * 0.3) {
            return { type: 'rock', solid: true, hp: 3 };
        }

        // Mineral chance
        const mineralChance = 0.15 + depth / 15000;
        if (roll < emptyChance + rockChance * 0.3 + mineralChance) {
            // Pick mineral based on depth
            const availableMinerals = Object.entries(MINERALS).filter(([key, m]) => depth >= m.minDepth);
            if (availableMinerals.length > 0) {
                // Favor deeper minerals slightly
                const weights = availableMinerals.map(([key, m]) => {
                    const depthDiff = depth - m.minDepth;
                    return Math.max(1, 100 - depthDiff / 50);
                });
                const totalWeight = weights.reduce((a, b) => a + b, 0);
                let picked = Math.random() * totalWeight;
                for (let i = 0; i < availableMinerals.length; i++) {
                    picked -= weights[i];
                    if (picked <= 0) {
                        const [key, mineral] = availableMinerals[i];
                        return { type: 'mineral', mineralType: key, solid: true, hp: 1 };
                    }
                }
            }
        }

        // Lava at deep levels
        if (depth > 2000 && Math.random() < 0.03) {
            return { type: 'lava', solid: true, hp: 1 };
        }

        // Gas pockets at very deep levels (invisible hazard)
        if (depth > 2200 && Math.random() < 0.02 + (depth - 2200) / 50000) {
            return { type: 'gas', solid: true, hp: 1, hidden: true };
        }

        // Boulders (indestructible)
        if (depth > 1000 && Math.random() < 0.02) {
            return { type: 'boulder', solid: true, indestructible: true };
        }

        // Default dirt
        return { type: 'dirt', solid: true, hp: 1 };
    }

    createUI() {
        // UI container
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setScrollFactor(0);
        this.uiContainer.setDepth(100);

        // Top bar
        const topBar = this.add.rectangle(400, 25, 800, 50, 0x1a0a0a, 0.9);
        this.uiContainer.add(topBar);

        // Depth
        this.depthText = this.add.text(20, 15, 'Depth: 0 ft', { fontSize: '16px', fill: '#fff' });
        this.uiContainer.add(this.depthText);

        // Cash
        this.cashText = this.add.text(200, 15, 'Cash: $100', { fontSize: '16px', fill: '#44ff44' });
        this.uiContainer.add(this.cashText);

        // Score
        this.scoreText = this.add.text(400, 15, 'Score: 0', { fontSize: '16px', fill: '#ffaa44' });
        this.uiContainer.add(this.scoreText);

        // Bottom bar
        const bottomBar = this.add.rectangle(400, 575, 800, 50, 0x1a0a0a, 0.9);
        this.uiContainer.add(bottomBar);

        // Fuel bar
        this.fuelLabel = this.add.text(20, 560, 'FUEL', { fontSize: '12px', fill: '#4488ff' });
        this.fuelBarBg = this.add.rectangle(100, 570, 150, 15, 0x333333);
        this.fuelBar = this.add.rectangle(100, 570, 150, 15, 0x4488ff);
        this.fuelBar.setOrigin(0, 0.5);
        this.fuelBar.x = 25;
        this.uiContainer.add([this.fuelLabel, this.fuelBarBg, this.fuelBar]);

        // Hull bar
        this.hullLabel = this.add.text(200, 560, 'HULL', { fontSize: '12px', fill: '#ff4444' });
        this.hullBarBg = this.add.rectangle(280, 570, 150, 15, 0x333333);
        this.hullBar = this.add.rectangle(280, 570, 150, 15, 0xff4444);
        this.hullBar.setOrigin(0, 0.5);
        this.hullBar.x = 205;
        this.uiContainer.add([this.hullLabel, this.hullBarBg, this.hullBar]);

        // Cargo
        this.cargoText = this.add.text(400, 560, 'Cargo: 0/7', { fontSize: '14px', fill: '#ffaa44' });
        this.uiContainer.add(this.cargoText);

        // Instructions
        this.instructionText = this.add.text(600, 560, '', { fontSize: '12px', fill: '#888' });
        this.uiContainer.add(this.instructionText);

        // Shop overlay
        this.shopContainer = this.add.container(400, 300);
        this.shopContainer.setScrollFactor(0);
        this.shopContainer.setDepth(200);
        this.shopContainer.setVisible(false);
    }

    renderTiles() {
        this.tileGraphics.clear();

        // Get visible area
        const cam = this.cameras.main;
        const startX = Math.max(0, Math.floor(cam.scrollX / TILE_SIZE) - 2);
        const startY = Math.max(0, Math.floor(cam.scrollY / TILE_SIZE) - 2);
        const endX = Math.min(WORLD_WIDTH, startX + Math.ceil(SCREEN_WIDTH / TILE_SIZE) + 4);
        const endY = Math.min(WORLD_HEIGHT, startY + Math.ceil(SCREEN_HEIGHT / TILE_SIZE) + 4);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.tiles[y][x];
                if (!tile) continue;

                let color = 0x0a0a0a;
                switch (tile.type) {
                    case 'sky': color = 0xff8866; break;
                    case 'surface': color = 0x8B4513; break;
                    case 'building': color = 0x444444; break;
                    case 'dirt': color = 0x654321; break;
                    case 'rock': color = 0x666666; break;
                    case 'empty': color = 0x1a0a0a; break;
                    case 'lava': color = 0xff4400; break;
                    case 'boulder': color = 0x555555; break;
                    case 'gas': color = 0x654321; break; // Gas looks like dirt until triggered
                    case 'mineral':
                        const mineral = MINERALS[tile.mineralType];
                        color = mineral ? mineral.color : 0x888888;
                        break;
                }

                if (tile.type !== 'sky') {
                    this.tileGraphics.fillStyle(color);
                    this.tileGraphics.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }

        // Draw buildings
        for (const [key, building] of Object.entries(BUILDINGS)) {
            this.tileGraphics.fillStyle(building.color);
            this.tileGraphics.fillRect(
                building.x * TILE_SIZE, (SURFACE_Y - 2) * TILE_SIZE,
                building.width * TILE_SIZE, TILE_SIZE * 2
            );
        }
    }

    update(time, delta) {
        if (gamePaused || gameState !== 'playing') return;

        const dt = delta / 1000;

        // Update cooldowns
        if (this.moveCooldown > 0) this.moveCooldown -= dt;

        // Handle shop
        if (this.shopOpen) {
            this.handleShopInput();
            return;
        }

        // Check for shop interaction
        this.checkShopInteraction();

        // Handle movement
        this.handleMovement(dt);

        // Apply gravity
        this.applyGravity(dt);

        // Consume fuel
        if (this.player.fuel > 0) {
            this.player.fuel -= dt * 0.1; // Slow drain
        }

        // Update depth stat
        const currentDepth = Math.max(0, (this.player.y - SURFACE_Y) * 10);
        stats.depthReached = Math.max(stats.depthReached, currentDepth);

        // Check for depth transmissions
        this.checkTransmissions(currentDepth);

        // Handle consumable usage
        this.handleConsumables(time);

        // Update visuals
        this.updatePlayer();
        this.updateUI();
        this.renderTiles();

        // Check death
        if (this.player.hull <= 0) {
            this.gameOver();
        }
    }

    checkTransmissions(depth) {
        if (depth > this.maxDepthReached) {
            this.maxDepthReached = depth;

            for (const trans of TRANSMISSIONS) {
                if (depth >= trans.depth && !this.receivedTransmissions.includes(trans.depth)) {
                    this.receivedTransmissions.push(trans.depth);
                    this.showTransmission(trans);
                    break;
                }
            }
        }
    }

    showTransmission(trans) {
        // Show transmission popup
        const popup = this.add.container(400, 300);
        popup.setScrollFactor(0);
        popup.setDepth(300);

        const bg = this.add.rectangle(0, 0, 500, 150, 0x0a0a3a, 0.95);
        bg.setStrokeStyle(2, 0x4488ff);
        popup.add(bg);

        const speaker = this.add.text(0, -50, `[${trans.speaker}]`, {
            fontSize: '18px',
            fill: '#4488ff'
        }).setOrigin(0.5);
        popup.add(speaker);

        const text = this.add.text(0, 0, trans.text, {
            fontSize: '14px',
            fill: '#fff',
            wordWrap: { width: 450 },
            align: 'center'
        }).setOrigin(0.5);
        popup.add(text);

        if (trans.bonus > 0) {
            this.player.cash += trans.bonus;
            const bonus = this.add.text(0, 40, `+$${trans.bonus}`, {
                fontSize: '20px',
                fill: '#44ff44'
            }).setOrigin(0.5);
            popup.add(bonus);
        }

        // Screen shake for dramatic effect
        this.cameras.main.shake(200, 0.005);

        // Auto-dismiss after 3 seconds
        this.time.delayedCall(3000, () => popup.destroy());
    }

    handleConsumables(time) {
        if (time - this.lastConsumableUse < 500) return; // Cooldown

        // R - Reserve fuel
        if (Phaser.Input.Keyboard.JustDown(this.wasd.r)) {
            if (this.player.consumables.reserveFuel > 0) {
                this.player.consumables.reserveFuel--;
                this.player.fuel = Math.min(this.player.maxFuel, this.player.fuel + 25);
                this.showMessage('+25 Fuel!', '#4488ff');
                this.lastConsumableUse = time;
            }
        }

        // F - Nanobots (fix hull)
        if (Phaser.Input.Keyboard.JustDown(this.wasd.f)) {
            if (this.player.consumables.nanobots > 0) {
                this.player.consumables.nanobots--;
                this.player.hull = Math.min(this.player.maxHull, this.player.hull + 30);
                this.showMessage('+30 Hull!', '#44ff44');
                this.lastConsumableUse = time;
            }
        }

        // T - Teleporter (return to surface)
        if (Phaser.Input.Keyboard.JustDown(this.wasd.t)) {
            if (this.player.consumables.teleporter > 0) {
                this.player.consumables.teleporter--;
                this.player.x = 15;
                this.player.y = SURFACE_Y;
                this.velocityY = 0;
                this.showMessage('Teleported!', '#aa44ff');
                this.cameras.main.shake(300, 0.01);
                this.lastConsumableUse = time;
            }
        }

        // X - Dynamite (if grounded)
        if (Phaser.Input.Keyboard.JustDown(this.wasd.x)) {
            if (this.player.consumables.dynamite > 0 && this.isGrounded) {
                this.player.consumables.dynamite--;
                this.useDynamite();
                this.lastConsumableUse = time;
            }
        }
    }

    useDynamite() {
        const px = this.player.x;
        const py = this.player.y;
        const radius = 3;

        // Destroy tiles in radius
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const tx = px + dx;
                const ty = py + dy;
                if (tx < 0 || tx >= WORLD_WIDTH || ty < 0 || ty >= WORLD_HEIGHT) continue;

                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= radius) {
                    const tile = this.tiles[ty][tx];
                    if (tile && tile.type !== 'building' && tile.type !== 'sky') {
                        // Collect minerals
                        if (tile.type === 'mineral') {
                            const mineral = MINERALS[tile.mineralType];
                            if (mineral && this.getCargoWeight() + mineral.weight <= this.player.cargoCapacity * 10) {
                                this.player.cargo.push(tile.mineralType);
                            }
                        }
                        tile.type = 'empty';
                        tile.solid = false;
                    }
                }
            }
        }

        // Screen shake
        this.cameras.main.shake(500, 0.02);
        this.showMessage('BOOM!', '#ff4400');
    }

    showMessage(text, color) {
        const msg = this.add.text(400, 200, text, {
            fontSize: '24px',
            fill: color
        }).setOrigin(0.5).setScrollFactor(0).setDepth(250);

        this.tweens.add({
            targets: msg,
            y: 150,
            alpha: 0,
            duration: 1000,
            onComplete: () => msg.destroy()
        });
    }

    handleMovement(dt) {
        const left = this.cursors.left.isDown || this.wasd.a.isDown;
        const right = this.cursors.right.isDown || this.wasd.d.isDown;
        const up = this.cursors.up.isDown || this.wasd.w.isDown;
        const down = this.cursors.down.isDown || this.wasd.s.isDown;

        // Flying up (costs fuel)
        if (up && this.player.fuel > 0) {
            this.velocityY = -3;
            this.player.fuel -= dt * 0.5;
        }

        // Horizontal movement
        if (this.moveCooldown <= 0) {
            if (left) {
                this.tryMove(-1, 0);
            } else if (right) {
                this.tryMove(1, 0);
            }
        }

        // Drilling down
        if (down && this.moveCooldown <= 0) {
            this.tryDrill(0, 1);
        }

        // Diagonal drilling
        if (down && left && this.moveCooldown <= 0) {
            this.tryDrill(-1, 1);
        } else if (down && right && this.moveCooldown <= 0) {
            this.tryDrill(1, 1);
        }
    }

    tryMove(dx, dy) {
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;

        if (newX < 0 || newX >= WORLD_WIDTH || newY < 0 || newY >= WORLD_HEIGHT) return;

        const tile = this.tiles[newY][newX];
        if (!tile.solid) {
            this.player.x = newX;
            this.player.y = newY;
            this.moveCooldown = 0.1;
        }
    }

    tryDrill(dx, dy) {
        const targetX = this.player.x + dx;
        const targetY = this.player.y + dy;

        if (targetX < 0 || targetX >= WORLD_WIDTH || targetY < 0 || targetY >= WORLD_HEIGHT) return;

        const tile = this.tiles[targetY][targetX];
        if (!tile.solid) {
            // Move into empty space
            this.player.x = targetX;
            this.player.y = targetY;
            this.moveCooldown = 0.1;
            return;
        }

        if (tile.type === 'building') return; // Can't drill buildings
        if (tile.type === 'boulder' || tile.indestructible) {
            this.showMessage('Can\'t drill boulder!', '#888888');
            return; // Can't drill boulders
        }
        if (tile.type === 'rock' && tile.hp > 1) {
            tile.hp -= this.player.drillSpeed;
            this.moveCooldown = 0.3 / this.player.drillSpeed;
            return;
        }

        // Drill through
        if (tile.type === 'mineral') {
            const mineral = MINERALS[tile.mineralType];
            if (mineral && this.getCargoWeight() + mineral.weight <= this.player.cargoCapacity * 10) {
                this.player.cargo.push(tile.mineralType);
                stats.mineralsCollected++;
            }
        }

        if (tile.type === 'lava') {
            const baseDamage = 5;
            const actualDamage = Math.floor(baseDamage * (1 - this.player.radiatorReduction));
            this.player.hull -= actualDamage;
            this.cameras.main.shake(200, 0.01);
            this.showMessage(`-${actualDamage} HP!`, '#ff4400');
        }

        if (tile.type === 'gas') {
            // Gas pocket explosion - massive damage based on depth
            const depth = (targetY - SURFACE_Y) * 10;
            const baseDamage = Math.floor((depth + 1500) / 20);
            const actualDamage = Math.floor(baseDamage * (1 - this.player.radiatorReduction));
            this.player.hull -= actualDamage;
            this.cameras.main.shake(500, 0.03);
            this.showMessage(`GAS EXPLOSION! -${actualDamage} HP!`, '#88ff00');
        }

        tile.type = 'empty';
        tile.solid = false;
        this.player.x = targetX;
        this.player.y = targetY;
        this.moveCooldown = 0.2 / this.player.drillSpeed;
    }

    applyGravity(dt) {
        const belowY = this.player.y + 1;
        if (belowY >= WORLD_HEIGHT) {
            this.isGrounded = true;
            this.velocityY = 0;
            return;
        }

        const tileBelow = this.tiles[belowY][this.player.x];
        if (tileBelow && tileBelow.solid) {
            this.isGrounded = true;
            this.velocityY = 0;
        } else {
            this.isGrounded = false;
            this.velocityY += dt * 5; // Gravity
            this.velocityY = Math.min(this.velocityY, 5); // Terminal velocity

            if (this.velocityY > 0) {
                const fallDist = Math.floor(this.velocityY * dt * 10);
                for (let i = 0; i < Math.max(1, fallDist); i++) {
                    const checkY = this.player.y + 1;
                    if (checkY >= WORLD_HEIGHT) break;
                    const checkTile = this.tiles[checkY][this.player.x];
                    if (checkTile && checkTile.solid) break;
                    this.player.y++;
                }
            }
        }
    }

    getCargoWeight() {
        return this.player.cargo.reduce((sum, type) => sum + MINERALS[type].weight, 0);
    }

    getCargoValue() {
        return this.player.cargo.reduce((sum, type) => sum + MINERALS[type].value, 0);
    }

    checkShopInteraction() {
        if (this.player.y !== SURFACE_Y - 1 && this.player.y !== SURFACE_Y) return;

        let nearShop = null;
        for (const [key, building] of Object.entries(BUILDINGS)) {
            if (this.player.x >= building.x && this.player.x < building.x + building.width) {
                nearShop = key;
                break;
            }
        }

        if (nearShop) {
            this.instructionText.setText(`[E] Enter ${BUILDINGS[nearShop].name}`);

            if (Phaser.Input.Keyboard.JustDown(this.wasd.e)) {
                this.openShop(nearShop);
            }
        } else {
            this.instructionText.setText('');
        }
    }

    openShop(shopType) {
        this.shopOpen = true;
        this.currentShop = shopType;
        this.shopContainer.setVisible(true);
        this.shopContainer.removeAll(true);

        const bg = this.add.rectangle(0, 0, 500, 400, 0x1a1a2e, 0.95);
        bg.setStrokeStyle(2, 0x3a3a5c);
        this.shopContainer.add(bg);

        const title = this.add.text(0, -170, BUILDINGS[shopType].name.toUpperCase(), {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);
        this.shopContainer.add(title);

        if (shopType === 'fuelStation') {
            this.createFuelShop();
        } else if (shopType === 'processor') {
            this.createProcessorShop();
        } else if (shopType === 'junkShop') {
            this.createUpgradeShop();
        } else if (shopType === 'repairShop') {
            this.createRepairShop();
        }

        // Close button
        const closeBtn = this.add.rectangle(0, 160, 100, 40, 0x444466)
            .setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => this.closeShop());
        const closeText = this.add.text(0, 160, 'CLOSE', { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);
        this.shopContainer.add([closeBtn, closeText]);
    }

    createFuelShop() {
        const fuelNeeded = Math.ceil(this.player.maxFuel - this.player.fuel);
        const cost = fuelNeeded * 2;

        const info = this.add.text(0, -80, `Current Fuel: ${this.player.fuel.toFixed(1)}/${this.player.maxFuel}\nCost: $2 per liter`, {
            fontSize: '16px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);
        this.shopContainer.add(info);

        const canAfford = this.player.cash >= cost;
        const fillBtn = this.add.rectangle(0, 20, 150, 40, canAfford ? 0x4488ff : 0x444444)
            .setInteractive({ useHandCursor: canAfford });

        if (canAfford) {
            fillBtn.on('pointerdown', () => {
                this.player.cash -= cost;
                this.player.fuel = this.player.maxFuel;
                this.closeShop();
            });
        }

        const fillText = this.add.text(0, 20, `FILL TANK ($${cost})`, {
            fontSize: '14px',
            fill: canAfford ? '#fff' : '#666'
        }).setOrigin(0.5);
        this.shopContainer.add([fillBtn, fillText]);
    }

    createProcessorShop() {
        const value = this.getCargoValue();

        const info = this.add.text(0, -80, `Cargo Value: $${value}\nMinerals: ${this.player.cargo.length}`, {
            fontSize: '16px',
            fill: '#44ff44',
            align: 'center'
        }).setOrigin(0.5);
        this.shopContainer.add(info);

        const hasCargo = this.player.cargo.length > 0;
        const sellBtn = this.add.rectangle(0, 20, 150, 40, hasCargo ? 0x44ff44 : 0x444444)
            .setInteractive({ useHandCursor: hasCargo });

        if (hasCargo) {
            sellBtn.on('pointerdown', () => {
                this.player.cash += value;
                stats.cashEarned += value;
                this.player.score += value;
                this.player.cargo = [];
                stats.trips++;
                this.closeShop();
            });
        }

        const sellText = this.add.text(0, 20, 'SELL ALL', {
            fontSize: '14px',
            fill: hasCargo ? '#000' : '#666'
        }).setOrigin(0.5);
        this.shopContainer.add([sellBtn, sellText]);
    }

    createUpgradeShop() {
        let yPos = -100;
        for (const [key, upgrade] of Object.entries(UPGRADES)) {
            const currentTier = this.player.upgrades[key];
            const nextTier = upgrade.tiers[currentTier + 1];

            if (!nextTier) {
                const maxText = this.add.text(-180, yPos, `${upgrade.name}: MAX`, {
                    fontSize: '14px',
                    fill: '#888'
                });
                this.shopContainer.add(maxText);
            } else {
                const canAfford = this.player.cash >= nextTier.price;
                const text = this.add.text(-180, yPos, `${upgrade.name}: ${nextTier.name}`, {
                    fontSize: '14px',
                    fill: '#fff'
                });

                const buyBtn = this.add.rectangle(150, yPos + 8, 80, 25, canAfford ? 0xffaa44 : 0x444444)
                    .setInteractive({ useHandCursor: canAfford });

                if (canAfford) {
                    buyBtn.on('pointerdown', () => {
                        this.player.cash -= nextTier.price;
                        this.player.upgrades[key]++;
                        this.applyUpgrade(key);
                        stats.upgradesPurchased++;
                        this.closeShop();
                        this.openShop('junkShop');
                    });
                }

                const priceText = this.add.text(150, yPos + 8, `$${nextTier.price}`, {
                    fontSize: '12px',
                    fill: canAfford ? '#000' : '#666'
                }).setOrigin(0.5);

                this.shopContainer.add([text, buyBtn, priceText]);
            }
            yPos += 40;
        }
    }

    createRepairShop() {
        const damage = this.player.maxHull - this.player.hull;
        const cost = damage * 15;

        const info = this.add.text(0, -130, `Hull: ${this.player.hull}/${this.player.maxHull} | Repair: $${cost}`, {
            fontSize: '14px',
            fill: '#ff4444',
            align: 'center'
        }).setOrigin(0.5);
        this.shopContainer.add(info);

        const canAfford = this.player.cash >= cost && damage > 0;
        const repairBtn = this.add.rectangle(-100, -90, 120, 30, canAfford ? 0xff4444 : 0x444444)
            .setInteractive({ useHandCursor: canAfford });

        if (canAfford) {
            repairBtn.on('pointerdown', () => {
                this.player.cash -= cost;
                this.player.hull = this.player.maxHull;
                this.closeShop();
                this.openShop('repairShop');
            });
        }

        const repairText = this.add.text(-100, -90, 'REPAIR', {
            fontSize: '12px',
            fill: canAfford ? '#fff' : '#666'
        }).setOrigin(0.5);
        this.shopContainer.add([repairBtn, repairText]);

        // Consumables section
        const consTitle = this.add.text(0, -50, 'CONSUMABLES', {
            fontSize: '16px',
            fill: '#ffaa44'
        }).setOrigin(0.5);
        this.shopContainer.add(consTitle);

        let yPos = -20;
        for (const [key, item] of Object.entries(CONSUMABLES)) {
            const owned = this.player.consumables[key] || 0;
            const canBuy = this.player.cash >= item.price;

            const text = this.add.text(-180, yPos, `${item.name} (x${owned})`, {
                fontSize: '12px',
                fill: '#fff'
            });

            const buyBtn = this.add.rectangle(120, yPos + 6, 80, 22, canBuy ? 0x44aa44 : 0x444444)
                .setInteractive({ useHandCursor: canBuy });

            if (canBuy) {
                buyBtn.on('pointerdown', () => {
                    this.player.cash -= item.price;
                    this.player.consumables[key]++;
                    this.closeShop();
                    this.openShop('repairShop');
                });
            }

            const priceText = this.add.text(120, yPos + 6, `$${item.price}`, {
                fontSize: '10px',
                fill: canBuy ? '#000' : '#666'
            }).setOrigin(0.5);

            this.shopContainer.add([text, buyBtn, priceText]);
            yPos += 30;
        }

        // Show controls hint
        const hint = this.add.text(0, 120, 'R:Fuel F:Repair T:Teleport X:Dynamite', {
            fontSize: '10px',
            fill: '#666'
        }).setOrigin(0.5);
        this.shopContainer.add(hint);
    }

    applyUpgrade(type) {
        const tier = this.player.upgrades[type];
        const tierData = UPGRADES[type].tiers[tier];

        switch (type) {
            case 'drill':
                this.player.drillSpeed = tierData.speed;
                break;
            case 'hull':
                this.player.maxHull = tierData.hp;
                this.player.hull = tierData.hp;
                break;
            case 'fuel':
                this.player.maxFuel = tierData.capacity;
                break;
            case 'cargo':
                this.player.cargoCapacity = tierData.capacity;
                break;
            case 'radiator':
                this.player.radiatorReduction = tierData.reduction;
                break;
        }
    }

    closeShop() {
        this.shopOpen = false;
        this.currentShop = null;
        this.shopContainer.setVisible(false);
    }

    handleShopInput() {
        if (Phaser.Input.Keyboard.JustDown(this.wasd.e)) {
            this.closeShop();
        }
    }

    updatePlayer() {
        this.playerSprite.x = this.player.x * TILE_SIZE + TILE_SIZE / 2;
        this.playerSprite.y = this.player.y * TILE_SIZE + TILE_SIZE / 2;
    }

    updateUI() {
        const depth = Math.max(0, (this.player.y - SURFACE_Y) * 10);
        this.depthText.setText(`Depth: ${depth} ft`);
        this.cashText.setText(`Cash: $${this.player.cash}`);
        this.scoreText.setText(`Score: ${this.player.score}`);

        // Fuel bar
        const fuelPercent = this.player.fuel / this.player.maxFuel;
        this.fuelBar.scaleX = Math.max(0, fuelPercent);
        this.fuelBar.fillColor = fuelPercent < 0.2 ? 0xff4444 : 0x4488ff;

        // Hull bar
        const hullPercent = this.player.hull / this.player.maxHull;
        this.hullBar.scaleX = Math.max(0, hullPercent);

        // Cargo
        const cargoWeight = this.getCargoWeight();
        this.cargoText.setText(`Cargo: ${this.player.cargo.length} (${cargoWeight}/${this.player.cargoCapacity * 10} kg)`);
    }

    gameOver() {
        gameState = 'gameover';

        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        overlay.setScrollFactor(0);
        overlay.setDepth(300);

        const gameOverText = this.add.text(400, 250, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff4444'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        const statsText = this.add.text(400, 330, `Max Depth: ${stats.depthReached} ft\nCash Earned: $${stats.cashEarned}\nMinerals: ${stats.mineralsCollected}`, {
            fontSize: '18px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(301);

        const restartBtn = this.add.rectangle(400, 420, 150, 40, 0xff4444)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(301);
        restartBtn.on('pointerdown', () => {
            stats = { mineralsCollected: 0, depthReached: 0, cashEarned: 0, upgradesPurchased: 0, trips: 0 };
            this.scene.restart();
        });

        const restartText = this.add.text(400, 420, 'RESTART', {
            fontSize: '16px',
            fill: '#fff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(302);
    }

    setupHarness() {
        const scene = this;

        window.harness = {
            pause: () => { gamePaused = true; },
            resume: () => { gamePaused = false; },
            isPaused: () => gamePaused,

            execute: async (action, durationMs) => {
                return new Promise((resolve) => {
                    gamePaused = false;

                    // Simulate key presses
                    if (action.keys) {
                        action.keys.forEach(key => {
                            if (key === 'ArrowUp' || key === 'w') scene.wasd.w.isDown = true;
                            if (key === 'ArrowDown' || key === 's') scene.wasd.s.isDown = true;
                            if (key === 'ArrowLeft' || key === 'a') scene.wasd.a.isDown = true;
                            if (key === 'ArrowRight' || key === 'd') scene.wasd.d.isDown = true;
                        });
                    }

                    setTimeout(() => {
                        scene.wasd.w.isDown = false;
                        scene.wasd.s.isDown = false;
                        scene.wasd.a.isDown = false;
                        scene.wasd.d.isDown = false;
                        gamePaused = true;
                        resolve();
                    }, durationMs);
                });
            },

            getState: () => ({
                gameState: gameState,
                player: {
                    x: scene.player?.x || 0,
                    y: scene.player?.y || 0,
                    fuel: scene.player?.fuel || 0,
                    maxFuel: scene.player?.maxFuel || 0,
                    hull: scene.player?.hull || 0,
                    maxHull: scene.player?.maxHull || 0,
                    cash: scene.player?.cash || 0,
                    cargo: scene.player?.cargo?.length || 0,
                    cargoValue: scene.getCargoValue?.() || 0
                },
                depth: scene.player ? Math.max(0, (scene.player.y - SURFACE_Y) * 10) : 0,
                shopOpen: scene.shopOpen,
                currentShop: scene.currentShop,
                stats: stats
            }),

            getPhase: () => {
                if (gameState === 'gameover') return 'gameover';
                return 'playing';
            },

            debug: {
                setHealth: (hp) => {
                    if (scene.player) scene.player.hull = hp;
                },
                forceStart: () => {
                    gamePaused = false;
                },
                addCash: (amount) => {
                    if (scene.player) scene.player.cash += amount;
                },
                addFuel: (amount) => {
                    if (scene.player) scene.player.fuel = Math.min(scene.player.maxFuel, scene.player.fuel + amount);
                },
                teleportSurface: () => {
                    if (scene.player) {
                        scene.player.x = 15;
                        scene.player.y = SURFACE_Y - 1;
                    }
                }
            }
        };
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a0a0a',
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
