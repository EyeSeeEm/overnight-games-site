// Motherload v2 - Mars Mining Game
// Built with Phaser 3

const TILE_SIZE = 20;
const WORLD_WIDTH = 40;
const WORLD_HEIGHT = 400;
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

// Tile types
const TileType = {
    EMPTY: 0,
    DIRT: 1,
    ROCK: 2,
    BOULDER: 3,
    LAVA: 4,
    GAS: 5,
    BUILDING: 30
};

// Minerals with depth-based spawn
const MINERALS = [
    { id: 10, name: 'Ironium', value: 30, weight: 10, color: 0x8B4513, minDepth: 25, peakDepth: 100, fadeDepth: 1000 },
    { id: 11, name: 'Bronzium', value: 60, weight: 10, color: 0xCD7F32, minDepth: 25, peakDepth: 200, fadeDepth: 1500 },
    { id: 12, name: 'Silverium', value: 100, weight: 10, color: 0xC0C0C0, minDepth: 25, peakDepth: 400, fadeDepth: 2000 },
    { id: 13, name: 'Goldium', value: 250, weight: 20, color: 0xFFD700, minDepth: 250, peakDepth: 600, fadeDepth: 2500 },
    { id: 14, name: 'Platinum', value: 750, weight: 30, color: 0xE5E4E2, minDepth: 800, peakDepth: 1700, fadeDepth: 3500 },
    { id: 15, name: 'Einsteinium', value: 2000, weight: 40, color: 0x00FF00, minDepth: 1600, peakDepth: 2600, fadeDepth: 4500 },
    { id: 16, name: 'Emerald', value: 5000, weight: 60, color: 0x50C878, minDepth: 2400, peakDepth: 4000, fadeDepth: 5500 },
    { id: 17, name: 'Ruby', value: 20000, weight: 80, color: 0xE0115F, minDepth: 4000, peakDepth: 4800, fadeDepth: 6500 },
    { id: 18, name: 'Diamond', value: 100000, weight: 100, color: 0xB9F2FF, minDepth: 4400, peakDepth: 5700, fadeDepth: 7000 },
    { id: 19, name: 'Amazonite', value: 500000, weight: 120, color: 0x00C4B0, minDepth: 5500, peakDepth: 6200, fadeDepth: 7287 }
];

// Upgrade definitions
const UPGRADES = {
    drill: [
        { name: 'Stock Drill', speed: 20, price: 0 },
        { name: 'Silvide Drill', speed: 28, price: 750 },
        { name: 'Goldium Drill', speed: 40, price: 2000 },
        { name: 'Emerald Drill', speed: 50, price: 5000 },
        { name: 'Ruby Drill', speed: 70, price: 20000 },
        { name: 'Diamond Drill', speed: 95, price: 100000 },
        { name: 'Amazonite Drill', speed: 120, price: 500000 }
    ],
    hull: [
        { name: 'Stock Hull', hp: 10, price: 0 },
        { name: 'Ironium Hull', hp: 17, price: 750 },
        { name: 'Bronzium Hull', hp: 30, price: 2000 },
        { name: 'Steel Hull', hp: 50, price: 5000 },
        { name: 'Platinum Hull', hp: 80, price: 20000 },
        { name: 'Einsteinium Hull', hp: 120, price: 100000 },
        { name: 'Energy-Shielded', hp: 180, price: 500000 }
    ],
    engine: [
        { name: 'Stock Engine', power: 150, price: 0 },
        { name: 'V4 1600cc', power: 160, price: 750 },
        { name: 'V4 Turbo', power: 170, price: 2000 },
        { name: 'V6 3.8L', power: 180, price: 5000 },
        { name: 'V8 Supercharged', power: 190, price: 20000 },
        { name: 'V12 6.0L', power: 200, price: 100000 },
        { name: 'V16 Jag', power: 210, price: 500000 }
    ],
    fuel: [
        { name: 'Micro Tank', capacity: 10, price: 0 },
        { name: 'Medium Tank', capacity: 15, price: 750 },
        { name: 'Huge Tank', capacity: 25, price: 2000 },
        { name: 'Gigantic Tank', capacity: 40, price: 5000 },
        { name: 'Titanic Tank', capacity: 60, price: 20000 },
        { name: 'Leviathan Tank', capacity: 100, price: 100000 },
        { name: 'Liquid Compression', capacity: 150, price: 500000 }
    ],
    cargo: [
        { name: 'Micro Bay', capacity: 7, price: 0 },
        { name: 'Medium Bay', capacity: 15, price: 750 },
        { name: 'Huge Bay', capacity: 25, price: 2000 },
        { name: 'Gigantic Bay', capacity: 40, price: 5000 },
        { name: 'Titanic Bay', capacity: 70, price: 20000 },
        { name: 'Leviathan Bay', capacity: 120, price: 100000 }
    ],
    radiator: [
        { name: 'Stock Fan', reduction: 0, price: 0 },
        { name: 'Dual Fans', reduction: 0.10, price: 2000 },
        { name: 'Single Turbine', reduction: 0.25, price: 5000 },
        { name: 'Dual Turbines', reduction: 0.40, price: 20000 },
        { name: 'Puron Cooling', reduction: 0.60, price: 100000 },
        { name: 'Tri-Turbine Freon', reduction: 0.80, price: 500000 }
    ]
};

// Surface buildings
const BUILDINGS = [
    { name: 'Fuel Station', x: 2, width: 4, color: 0x4444FF },
    { name: 'Mineral Processor', x: 10, width: 4, color: 0xFF8800 },
    { name: 'Junk Shop', x: 18, width: 4, color: 0x888888 },
    { name: 'Repair Shop', x: 26, width: 4, color: 0xFF4444 },
    { name: 'Save Point', x: 34, width: 4, color: 0x44FF44 }
];

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Mars background
        this.add.rectangle(400, 300, 800, 600, 0x220808);

        // Stars
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 800;
            const y = Math.random() * 400;
            const size = Math.random() * 2 + 1;
            this.add.circle(x, y, size, 0xFFFFFF, Math.random() * 0.5 + 0.3);
        }

        // Title
        this.add.text(400, 120, 'MOTHERLOAD', {
            fontSize: '64px',
            fontFamily: 'Arial Black',
            color: '#FF6600',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(400, 180, 'MARS MINING EXPEDITION', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#FFAA44'
        }).setOrigin(0.5);

        // Mining pod graphic
        const pod = this.add.graphics();
        pod.fillStyle(0x888888);
        pod.fillRoundedRect(350, 250, 100, 80, 10);
        pod.fillStyle(0x44AAFF);
        pod.fillRoundedRect(370, 260, 60, 30, 5);
        pod.fillStyle(0xFF6600);
        pod.fillTriangle(400, 330, 370, 350, 430, 350);

        // Start button
        const startBtn = this.add.rectangle(400, 420, 200, 50, 0xFF6600)
            .setInteractive({ useHandCursor: true });
        this.add.text(400, 420, 'START MINING', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        startBtn.on('pointerover', () => startBtn.setFillStyle(0xFF8833));
        startBtn.on('pointerout', () => startBtn.setFillStyle(0xFF6600));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));

        // Controls
        this.add.text(400, 500, 'CONTROLS:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#AAAAAA'
        }).setOrigin(0.5);

        this.add.text(400, 530, 'Arrow Keys = Move/Drill   |   R = Repair   |   F = Reserve Fuel', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5);

        this.add.text(400, 555, 'UP = Fly (uses fuel)   |   DOWN/LEFT/RIGHT = Drill', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Initialize player state
        // Start player at x=7 which is between Fuel Station (x=2-6) and Mineral Processor (x=10-14)
        this.player = {
            x: 7 * TILE_SIZE,
            y: -20,
            vx: 0,
            vy: 0,
            cash: 0,
            score: 0,
            fuel: 10,
            hull: 10,
            maxHull: 10,
            maxFuel: 10,
            drillSpeed: 20,
            enginePower: 150,
            cargoCapacity: 7,
            radiatorReduction: 0,
            cargo: [],
            upgrades: { drill: 0, hull: 0, engine: 0, fuel: 0, cargo: 0, radiator: 0 },
            consumables: { fuelTanks: 0, nanobots: 0, dynamite: 0 },
            isDrilling: false,
            drillProgress: 0,
            drillTarget: null,
            drillDirection: null,
            isGrounded: false,
            fallStartY: null
        };

        // Generate world
        this.world = this.generateWorld();

        // Create tilemap graphics
        this.worldGraphics = this.add.graphics();
        this.buildingGraphics = this.add.graphics();

        // Create player sprite
        this.playerGraphics = this.add.graphics();

        // HUD layer (fixed position)
        this.hudContainer = this.add.container(0, 0).setScrollFactor(0);
        this.createHUD();

        // Shop overlay
        this.shopContainer = this.add.container(0, 0).setScrollFactor(0).setVisible(false);
        this.currentShop = null;

        // Camera setup
        this.cameras.main.setBounds(0, -100, WORLD_WIDTH * TILE_SIZE, (WORLD_HEIGHT + 10) * TILE_SIZE);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = {
            W: this.input.keyboard.addKey('W'),
            A: this.input.keyboard.addKey('A'),
            S: this.input.keyboard.addKey('S'),
            D: this.input.keyboard.addKey('D'),
            R: this.input.keyboard.addKey('R'),
            F: this.input.keyboard.addKey('F'),
            E: this.input.keyboard.addKey('E'),
            ESC: this.input.keyboard.addKey('ESC')
        };

        // Particles for drilling
        this.drillParticles = [];

        // Sparkle particles for valuable minerals
        this.sparkles = [];

        // Notifications
        this.notifications = [];

        // Low fuel/hull warning state
        this.warningPulse = 0;

        // Depth milestones
        this.depthMilestones = {
            500: { shown: false, text: "Mr. Natas: Excellent progress! $1,000 bonus!", bonus: 1000 },
            1000: { shown: false, text: "Mr. Natas: Splendid work! $3,000 bonus!", bonus: 3000 },
            1750: { shown: false, text: "Unknown: The eyes... Oh my god, THE EYES!!!", bonus: 0 },
            6000: { shown: false, text: "Mr. Natas: That's deep enough. Return to surface.", bonus: 0 }
        };

        // Initial render
        this.renderWorld();
        this.renderBuildings();
    }

    generateWorld() {
        const world = [];

        for (let y = 0; y < WORLD_HEIGHT; y++) {
            const row = [];
            const depth = y * TILE_SIZE;

            for (let x = 0; x < WORLD_WIDTH; x++) {
                if (y < 2) {
                    // Surface - empty above ground
                    row.push(TileType.EMPTY);
                } else if (this.isBuildingFoundation(x, y)) {
                    row.push(TileType.BUILDING);
                } else {
                    row.push(this.generateTile(depth, x, y));
                }
            }
            world.push(row);
        }

        return world;
    }

    isBuildingFoundation(x, y) {
        if (y > 5) return false;
        for (const b of BUILDINGS) {
            if (x >= b.x && x < b.x + b.width) return true;
        }
        return false;
    }

    generateTile(depth, x, y) {
        const roll = Math.random();

        // Check for hazards at depth
        if (depth >= 3100 && roll < (depth >= 5000 ? 0.10 : 0.05)) {
            return TileType.LAVA;
        }
        if (depth >= 4750 && roll < this.getGasChance(depth)) {
            return TileType.GAS;
        }
        if (depth >= 1500 && roll < (depth >= 4000 ? 0.05 : 0.03)) {
            return TileType.BOULDER;
        }

        // Check for minerals
        const mineral = this.rollMineral(depth);
        if (mineral) return mineral;

        // Default: dirt or rock
        const rockChance = Math.min(0.3, 0.15 + depth / 10000);
        return roll < rockChance ? TileType.ROCK : TileType.DIRT;
    }

    getGasChance(depth) {
        if (depth < 4750) return 0;
        if (depth < 4950) return 0.05;
        if (depth < 6500) return 0.25;
        return 1.0;
    }

    rollMineral(depth) {
        for (const mineral of MINERALS) {
            if (depth >= mineral.minDepth && depth <= mineral.fadeDepth) {
                // Calculate spawn weight based on depth proximity to peak
                const distToPeak = Math.abs(depth - mineral.peakDepth);
                const range = Math.max(mineral.fadeDepth - mineral.minDepth, 1);
                const weight = Math.max(0, 1 - distToPeak / (range * 0.5)) * 0.15;

                if (Math.random() < weight) {
                    return mineral.id;
                }
            }
        }
        return null;
    }

    renderWorld() {
        this.worldGraphics.clear();

        const camY = this.cameras.main.scrollY;
        const startRow = Math.max(0, Math.floor(camY / TILE_SIZE) - 2);
        const endRow = Math.min(WORLD_HEIGHT, startRow + Math.ceil(SCREEN_HEIGHT / TILE_SIZE) + 4);

        for (let y = startRow; y < endRow; y++) {
            for (let x = 0; x < WORLD_WIDTH; x++) {
                const tile = this.world[y][x];
                if (tile === TileType.EMPTY) continue;

                const screenX = x * TILE_SIZE;
                const screenY = y * TILE_SIZE;

                let color;
                switch (tile) {
                    case TileType.DIRT:
                        color = 0x8B4513 + (((x + y) % 3) * 0x111111);
                        break;
                    case TileType.ROCK:
                        color = 0x666666;
                        break;
                    case TileType.BOULDER:
                        color = 0x444444;
                        break;
                    case TileType.LAVA:
                        color = 0xFF4400 + Math.floor(Math.random() * 0x222200);
                        break;
                    case TileType.GAS:
                        // Gas is invisible - render as dirt
                        color = 0x8B4513;
                        break;
                    case TileType.BUILDING:
                        color = 0x333333;
                        break;
                    default:
                        // Check if it's a mineral
                        const mineral = MINERALS.find(m => m.id === tile);
                        if (mineral) {
                            color = mineral.color;
                        } else {
                            color = 0x8B4513;
                        }
                }

                this.worldGraphics.fillStyle(color);
                this.worldGraphics.fillRect(screenX, screenY, TILE_SIZE - 1, TILE_SIZE - 1);
            }
        }

        // Mars surface/sky
        this.worldGraphics.fillStyle(0x441111);
        this.worldGraphics.fillRect(0, -100, WORLD_WIDTH * TILE_SIZE, 100);
    }

    renderBuildings() {
        this.buildingGraphics.clear();

        for (const building of BUILDINGS) {
            const x = building.x * TILE_SIZE;
            const y = -60;
            const w = building.width * TILE_SIZE;
            const h = 60;

            // Building body
            this.buildingGraphics.fillStyle(building.color);
            this.buildingGraphics.fillRoundedRect(x, y, w, h, 5);

            // Building door
            this.buildingGraphics.fillStyle(0x222222);
            this.buildingGraphics.fillRect(x + w/2 - 10, y + h - 30, 20, 30);

            // Building sign background
            this.buildingGraphics.fillStyle(0x111111);
            this.buildingGraphics.fillRect(x + 5, y + 5, w - 10, 20);
        }

        // Add building labels
        if (!this.buildingLabels) {
            this.buildingLabels = [];
            for (const building of BUILDINGS) {
                const x = (building.x + building.width / 2) * TILE_SIZE;
                const label = this.add.text(x, -50, building.name, {
                    fontSize: '10px',
                    fontFamily: 'Arial',
                    color: '#FFFFFF'
                }).setOrigin(0.5);
                this.buildingLabels.push(label);
            }
        }
    }

    createHUD() {
        // Background bar
        const hudBg = this.add.rectangle(400, 25, 800, 50, 0x000000, 0.8);
        this.hudContainer.add(hudBg);

        // Depth display
        this.depthText = this.add.text(20, 10, 'DEPTH: 0 ft', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        });
        this.hudContainer.add(this.depthText);

        // Cash display
        this.cashText = this.add.text(180, 10, 'CASH: $0', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#00FF00'
        });
        this.hudContainer.add(this.cashText);

        // Score display
        this.scoreText = this.add.text(340, 10, 'SCORE: 0', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFFF00'
        });
        this.hudContainer.add(this.scoreText);

        // Fuel bar
        this.add.text(20, 35, 'FUEL:', { fontSize: '12px', color: '#4488FF' }).setScrollFactor(0);
        this.fuelBar = this.add.rectangle(120, 40, 100, 12, 0x4488FF).setOrigin(0, 0.5);
        this.fuelBarBg = this.add.rectangle(120, 40, 100, 12, 0x333333).setOrigin(0, 0.5);
        this.hudContainer.add(this.fuelBarBg);
        this.hudContainer.add(this.fuelBar);

        // Hull bar
        this.add.text(250, 35, 'HULL:', { fontSize: '12px', color: '#FF4444' }).setScrollFactor(0);
        this.hullBar = this.add.rectangle(350, 40, 100, 12, 0xFF4444).setOrigin(0, 0.5);
        this.hullBarBg = this.add.rectangle(350, 40, 100, 12, 0x333333).setOrigin(0, 0.5);
        this.hudContainer.add(this.hullBarBg);
        this.hudContainer.add(this.hullBar);

        // Cargo bar
        this.add.text(480, 35, 'CARGO:', { fontSize: '12px', color: '#FFAA00' }).setScrollFactor(0);
        this.cargoBar = this.add.rectangle(580, 40, 100, 12, 0xFFAA00).setOrigin(0, 0.5);
        this.cargoBarBg = this.add.rectangle(580, 40, 100, 12, 0x333333).setOrigin(0, 0.5);
        this.hudContainer.add(this.cargoBarBg);
        this.hudContainer.add(this.cargoBar);

        // Consumables display
        this.consumablesText = this.add.text(700, 15, '', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#AAAAAA'
        });
        this.hudContainer.add(this.consumablesText);
    }

    updateHUD() {
        const depth = Math.max(0, Math.floor(this.player.y / TILE_SIZE) * TILE_SIZE);
        this.depthText.setText(`DEPTH: ${depth} ft`);
        this.cashText.setText(`CASH: $${this.player.cash.toLocaleString()}`);
        this.scoreText.setText(`SCORE: ${this.player.score.toLocaleString()}`);

        // Update bars
        const fuelPercent = this.player.fuel / this.player.maxFuel;
        this.fuelBar.setScale(fuelPercent, 1);
        this.fuelBar.setFillStyle(fuelPercent < 0.2 ? 0xFF0000 : 0x4488FF);

        const hullPercent = this.player.hull / this.player.maxHull;
        this.hullBar.setScale(hullPercent, 1);
        this.hullBar.setFillStyle(hullPercent < 0.25 ? 0xFF0000 : 0xFF4444);

        const cargoWeight = this.getCargoWeight();
        const cargoPercent = cargoWeight / this.player.cargoCapacity;
        this.cargoBar.setScale(Math.min(1, cargoPercent), 1);
        this.cargoBar.setFillStyle(cargoPercent >= 1 ? 0xFF0000 : 0xFFAA00);

        // Consumables
        const cons = this.player.consumables;
        this.consumablesText.setText(`N:${cons.nanobots} F:${cons.fuelTanks} D:${cons.dynamite}`);
    }

    getCargoWeight() {
        return this.player.cargo.reduce((sum, item) => sum + item.weight, 0);
    }

    update(time, delta) {
        if (this.shopContainer.visible) {
            this.handleShopInput();
            return;
        }

        this.handleInput(delta);
        this.updatePlayer(delta);
        this.checkBuildingCollision();
        this.checkDepthMilestones();
        this.updateCamera();
        this.updateHUD();
        this.updateSparkles(delta);
        this.updateWarningEffects(delta);
        this.renderWorld();
        this.renderPlayer();
        this.renderSparkles();
        this.renderWarningOverlay();
        this.updateNotifications(delta);
    }

    updateWarningEffects(delta) {
        this.warningPulse += delta * 0.005;
        if (this.warningPulse > Math.PI * 2) this.warningPulse -= Math.PI * 2;
    }

    renderWarningOverlay() {
        const p = this.player;

        // Low hull warning vignette
        if (p.hull / p.maxHull < 0.25) {
            const intensity = 0.3 + Math.sin(this.warningPulse * 3) * 0.15;
            const overlay = this.add.graphics().setScrollFactor(0);
            overlay.fillStyle(0xFF0000, intensity);
            overlay.fillRect(0, 0, 20, SCREEN_HEIGHT);
            overlay.fillRect(SCREEN_WIDTH - 20, 0, 20, SCREEN_HEIGHT);
            overlay.fillRect(0, 0, SCREEN_WIDTH, 20);
            overlay.fillRect(0, SCREEN_HEIGHT - 20, SCREEN_WIDTH, 20);
            // Destroy after render
            this.time.delayedCall(16, () => overlay.destroy());
        }

        // Low fuel warning
        if (p.fuel / p.maxFuel < 0.2 && p.fuel > 0) {
            const intensity = Math.sin(this.warningPulse * 4) > 0 ? 1 : 0.3;
            this.fuelBar.setAlpha(intensity);
        } else {
            this.fuelBar.setAlpha(1);
        }
    }

    handleInput(delta) {
        const p = this.player;

        // Consumables
        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
            this.useNanobot();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.F)) {
            this.useFuelTank();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
            this.useDynamite();
        }

        // Already drilling?
        if (p.isDrilling) {
            this.continueDrilling(delta);
            return;
        }

        // Movement / Drilling
        const left = this.cursors.left.isDown || this.keys.A.isDown;
        const right = this.cursors.right.isDown || this.keys.D.isDown;
        const up = this.cursors.up.isDown || this.keys.W.isDown;
        const down = this.cursors.down.isDown || this.keys.S.isDown;

        // Flying up (uses fuel)
        if (up && p.fuel > 0) {
            const thrust = (p.enginePower / 150) * 200;
            p.vy -= thrust * delta / 1000;
            p.fuel -= 0.02 * delta / 16;
            if (p.fuel < 0) p.fuel = 0;
        }

        // Horizontal movement (on surface or in air)
        const tileBelow = this.getTileAt(p.x, p.y + TILE_SIZE);
        const canMoveHorizontal = tileBelow === TileType.EMPTY || p.y <= 0;

        if (canMoveHorizontal) {
            if (left) {
                p.vx = -150;
                if (p.fuel > 0) p.fuel -= 0.005 * delta / 16;
            } else if (right) {
                p.vx = 150;
                if (p.fuel > 0) p.fuel -= 0.005 * delta / 16;
            } else {
                p.vx *= 0.9;
            }
        } else {
            // On ground - try to drill sideways
            if (left) {
                this.tryDrill(-1, 0);
            } else if (right) {
                this.tryDrill(1, 0);
            }
            p.vx = 0;
        }

        // Drilling down
        if (down) {
            this.tryDrill(0, 1);
        }
    }

    tryDrill(dx, dy) {
        const p = this.player;
        const tileX = Math.floor(p.x / TILE_SIZE) + dx;
        const tileY = Math.floor((p.y + TILE_SIZE / 2) / TILE_SIZE) + dy;

        if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) return;

        const tile = this.world[tileY][tileX];

        if (tile === TileType.EMPTY) {
            // Move into empty space
            if (dx !== 0) {
                p.x += dx * TILE_SIZE;
            }
            return;
        }

        if (tile === TileType.BOULDER || tile === TileType.BUILDING) {
            this.showNotification("Can't drill this!", 0xFF0000);
            return;
        }

        // Start drilling
        p.isDrilling = true;
        p.drillProgress = 0;
        p.drillTarget = { x: tileX, y: tileY, tile: tile };
        p.drillDirection = { dx, dy };
    }

    continueDrilling(delta) {
        const p = this.player;
        const tile = p.drillTarget.tile;

        // Calculate drill time based on tile type and drill speed
        const baseTime = tile === TileType.ROCK ? 1500 : 800;
        const drillTime = baseTime / (p.drillSpeed / 20);

        p.drillProgress += delta;

        // Drill particles
        if (Math.random() < 0.3) {
            this.addDrillParticle(
                p.drillTarget.x * TILE_SIZE + TILE_SIZE / 2,
                p.drillTarget.y * TILE_SIZE + TILE_SIZE / 2
            );
        }

        if (p.drillProgress >= drillTime) {
            // Complete drilling
            this.completeDrill();
        }
    }

    completeDrill() {
        const p = this.player;
        const target = p.drillTarget;
        const tile = target.tile;

        // Handle hazards
        if (tile === TileType.LAVA) {
            const damage = Math.floor(58 * (1 - p.radiatorReduction));
            this.takeDamage(damage);
            this.showNotification(`LAVA! -${damage} HP`, 0xFF4400);
        } else if (tile === TileType.GAS) {
            const depth = target.y * TILE_SIZE;
            const baseDamage = (depth + 3000) / 15;
            const damage = Math.floor(baseDamage * (1 - p.radiatorReduction));
            this.takeDamage(damage);
            this.showNotification(`GAS EXPLOSION! -${damage} HP`, 0xFFFF00);
        }

        // Handle minerals
        const mineral = MINERALS.find(m => m.id === tile);
        if (mineral) {
            const cargoWeight = this.getCargoWeight();
            if (cargoWeight + mineral.weight <= p.cargoCapacity) {
                p.cargo.push({ ...mineral });
                this.showNotification(`+${mineral.name} ($${mineral.value})`, mineral.color);
                // Add sparkle effect for valuable minerals
                if (mineral.value >= 1000) {
                    this.addSparkles(target.x * TILE_SIZE + TILE_SIZE/2, target.y * TILE_SIZE + TILE_SIZE/2);
                }
            } else {
                this.showNotification('CARGO FULL!', 0xFF0000);
            }
        }

        // Clear tile and move player
        this.world[target.y][target.x] = TileType.EMPTY;
        p.x = target.x * TILE_SIZE;
        p.y = target.y * TILE_SIZE;

        p.isDrilling = false;
        p.drillProgress = 0;
        p.drillTarget = null;
    }

    updatePlayer(delta) {
        const p = this.player;

        if (p.isDrilling) return;

        // Gravity
        p.vy += 400 * delta / 1000;

        // Apply velocity
        let newX = p.x + p.vx * delta / 1000;
        let newY = p.y + p.vy * delta / 1000;

        // Horizontal collision
        const tileLeft = this.getTileAt(newX - 5, p.y);
        const tileRight = this.getTileAt(newX + TILE_SIZE - 5, p.y);
        if ((p.vx < 0 && tileLeft !== TileType.EMPTY) || (p.vx > 0 && tileRight !== TileType.EMPTY)) {
            p.vx = 0;
            newX = p.x;
        }

        // Vertical collision
        const tileBelow = this.getTileAt(p.x, newY + TILE_SIZE);
        const wasGrounded = p.isGrounded;

        if (tileBelow !== TileType.EMPTY && p.vy > 0) {
            // Check for fall damage
            if (p.fallStartY !== null) {
                const fallHeight = (newY - p.fallStartY);
                if (fallHeight > 24) {
                    const damage = this.calculateFallDamage(fallHeight);
                    this.takeDamage(damage);
                    this.showNotification(`FALL DAMAGE! -${damage}`, 0xFF8800);
                }
            }

            // Land on ground
            newY = Math.floor(newY / TILE_SIZE) * TILE_SIZE;
            p.vy = 0;
            p.isGrounded = true;
            p.fallStartY = null;
        } else {
            p.isGrounded = false;
            if (wasGrounded && p.vy > 0) {
                p.fallStartY = p.y;
            }
        }

        // World bounds
        newX = Phaser.Math.Clamp(newX, 0, (WORLD_WIDTH - 1) * TILE_SIZE);
        newY = Phaser.Math.Clamp(newY, -100, (WORLD_HEIGHT - 2) * TILE_SIZE);

        p.x = newX;
        p.y = newY;
    }

    calculateFallDamage(fallHeight) {
        if (fallHeight <= 24) return 0;
        if (fallHeight <= 36) return 3;
        if (fallHeight <= 72) return 4;
        if (fallHeight <= 144) return 5;
        if (fallHeight <= 288) return 6;
        if (fallHeight <= 432) return 7;
        return 8;
    }

    getTileAt(x, y) {
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);

        if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) {
            return TileType.EMPTY;
        }

        return this.world[tileY][tileX];
    }

    renderPlayer() {
        this.playerGraphics.clear();

        const p = this.player;
        const screenX = p.x;
        const screenY = p.y;

        // Pod body
        this.playerGraphics.fillStyle(0x888888);
        this.playerGraphics.fillRoundedRect(screenX - 2, screenY - 5, TILE_SIZE + 4, TILE_SIZE + 5, 3);

        // Cockpit window
        this.playerGraphics.fillStyle(0x44AAFF);
        this.playerGraphics.fillRoundedRect(screenX + 3, screenY, TILE_SIZE - 6, 8, 2);

        // Drill bit
        const drillColor = p.isDrilling ? 0xFF8800 : 0xFF6600;
        this.playerGraphics.fillStyle(drillColor);

        if (p.drillDirection) {
            if (p.drillDirection.dy > 0) {
                // Drilling down
                this.playerGraphics.fillTriangle(
                    screenX + TILE_SIZE / 2, screenY + TILE_SIZE + 8,
                    screenX + 2, screenY + TILE_SIZE,
                    screenX + TILE_SIZE - 2, screenY + TILE_SIZE
                );
            } else if (p.drillDirection.dx < 0) {
                // Drilling left
                this.playerGraphics.fillTriangle(
                    screenX - 8, screenY + TILE_SIZE / 2,
                    screenX, screenY + 2,
                    screenX, screenY + TILE_SIZE - 2
                );
            } else if (p.drillDirection.dx > 0) {
                // Drilling right
                this.playerGraphics.fillTriangle(
                    screenX + TILE_SIZE + 8, screenY + TILE_SIZE / 2,
                    screenX + TILE_SIZE, screenY + 2,
                    screenX + TILE_SIZE, screenY + TILE_SIZE - 2
                );
            }
        } else {
            // Default drill down
            this.playerGraphics.fillTriangle(
                screenX + TILE_SIZE / 2, screenY + TILE_SIZE + 5,
                screenX + 4, screenY + TILE_SIZE,
                screenX + TILE_SIZE - 4, screenY + TILE_SIZE
            );
        }

        // Exhaust particles when flying
        if (this.cursors.up.isDown || this.keys.W.isDown) {
            for (let i = 0; i < 3; i++) {
                const ex = screenX + TILE_SIZE / 2 + (Math.random() - 0.5) * 10;
                const ey = screenY - 5 + Math.random() * 5;
                this.playerGraphics.fillStyle(0xFF4400 + Math.floor(Math.random() * 0x004400));
                this.playerGraphics.fillCircle(ex, ey, 2 + Math.random() * 2);
            }
        }

        // Drill particles
        this.updateDrillParticles();
    }

    addDrillParticle(x, y) {
        this.drillParticles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 100,
            vy: -Math.random() * 50 - 20,
            life: 500,
            color: 0x8B4513
        });
    }

    addSparkles(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.sparkles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 80,
                vy: Math.sin(angle) * 80,
                life: 600,
                color: 0xFFFFAA
            });
        }
    }

    updateSparkles(delta) {
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const s = this.sparkles[i];
            s.x += s.vx * delta / 1000;
            s.y += s.vy * delta / 1000;
            s.vx *= 0.95;
            s.vy *= 0.95;
            s.life -= delta;

            if (s.life <= 0) {
                this.sparkles.splice(i, 1);
            }
        }
    }

    renderSparkles() {
        for (const s of this.sparkles) {
            const alpha = s.life / 600;
            this.playerGraphics.fillStyle(s.color, alpha);
            this.playerGraphics.fillCircle(s.x, s.y, 3);
        }
    }

    checkDepthMilestones() {
        const depth = Math.max(0, Math.floor(this.player.y));

        for (const [milestoneDepth, data] of Object.entries(this.depthMilestones)) {
            if (!data.shown && depth >= parseInt(milestoneDepth)) {
                data.shown = true;
                this.showTransmission(data.text);
                if (data.bonus > 0) {
                    this.player.cash += data.bonus;
                    this.showNotification(`+$${data.bonus}`, 0x00FF00);
                }
            }
        }
    }

    showTransmission(text) {
        // Create transmission overlay
        const overlay = this.add.rectangle(400, 300, 600, 100, 0x000000, 0.9).setScrollFactor(0);
        const border = this.add.rectangle(400, 300, 604, 104, 0x00FF00).setStrokeStyle(2, 0x00FF00).setScrollFactor(0);
        const title = this.add.text(400, 270, '-- TRANSMISSION --', {
            fontSize: '14px', color: '#00FF00'
        }).setOrigin(0.5).setScrollFactor(0);
        const msg = this.add.text(400, 310, text, {
            fontSize: '16px', color: '#FFFFFF', wordWrap: { width: 550 }
        }).setOrigin(0.5).setScrollFactor(0);

        // Fade out after 3 seconds
        this.time.delayedCall(3000, () => {
            overlay.destroy();
            border.destroy();
            title.destroy();
            msg.destroy();
        });
    }

    updateDrillParticles() {
        for (let i = this.drillParticles.length - 1; i >= 0; i--) {
            const p = this.drillParticles[i];
            p.x += p.vx * 0.016;
            p.y += p.vy * 0.016;
            p.vy += 200 * 0.016;
            p.life -= 16;

            if (p.life > 0) {
                const alpha = p.life / 500;
                this.playerGraphics.fillStyle(p.color, alpha);
                this.playerGraphics.fillCircle(p.x, p.y, 2);
            } else {
                this.drillParticles.splice(i, 1);
            }
        }
    }

    updateCamera() {
        const p = this.player;
        const targetY = p.y - SCREEN_HEIGHT / 3;
        this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, targetY, 0.1);
        this.cameras.main.scrollX = Phaser.Math.Clamp(
            p.x - SCREEN_WIDTH / 2,
            0,
            WORLD_WIDTH * TILE_SIZE - SCREEN_WIDTH
        );
    }

    checkBuildingCollision() {
        const p = this.player;
        if (p.y > 0) return; // Below surface

        const playerTileX = Math.floor((p.x + TILE_SIZE / 2) / TILE_SIZE);

        for (const building of BUILDINGS) {
            if (playerTileX >= building.x && playerTileX < building.x + building.width) {
                // At building entrance
                if (this.cursors.up.isDown || this.keys.W.isDown) {
                    this.enterBuilding(building);
                    return;
                }
            }
        }
    }

    enterBuilding(building) {
        this.currentShop = building.name;
        this.shopContainer.removeAll(true);
        this.shopContainer.setVisible(true);

        // Shop background
        const bg = this.add.rectangle(400, 300, 600, 500, 0x222222, 0.95);
        this.shopContainer.add(bg);

        // Border
        const border = this.add.rectangle(400, 300, 604, 504, 0x666666).setStrokeStyle(2, 0xFFFFFF);
        this.shopContainer.add(border);

        // Title
        const title = this.add.text(400, 80, building.name.toUpperCase(), {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: '#FFFFFF'
        }).setOrigin(0.5);
        this.shopContainer.add(title);

        // Content based on building type
        switch (building.name) {
            case 'Fuel Station':
                this.createFuelStationUI();
                break;
            case 'Mineral Processor':
                this.createMineralProcessorUI();
                break;
            case 'Junk Shop':
                this.createJunkShopUI();
                break;
            case 'Repair Shop':
                this.createRepairShopUI();
                break;
            case 'Save Point':
                this.createSavePointUI();
                break;
        }

        // Close button
        const closeBtn = this.add.rectangle(680, 80, 80, 30, 0xFF4444)
            .setInteractive({ useHandCursor: true });
        const closeText = this.add.text(680, 80, 'CLOSE', {
            fontSize: '14px',
            color: '#FFFFFF'
        }).setOrigin(0.5);
        this.shopContainer.add(closeBtn);
        this.shopContainer.add(closeText);

        closeBtn.on('pointerdown', () => this.closeShop());
    }

    closeShop() {
        this.shopContainer.setVisible(false);
        this.currentShop = null;
    }

    handleShopInput() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
            this.closeShop();
        }
    }

    createFuelStationUI() {
        const p = this.player;
        const fuelNeeded = p.maxFuel - p.fuel;
        const cost = Math.ceil(fuelNeeded * 2);

        // Current fuel display
        const fuelText = this.add.text(400, 150, `Current Fuel: ${p.fuel.toFixed(1)}/${p.maxFuel}L`, {
            fontSize: '18px',
            color: '#4488FF'
        }).setOrigin(0.5);
        this.shopContainer.add(fuelText);

        // Fill tank button
        if (fuelNeeded > 0) {
            const fillBtn = this.add.rectangle(400, 220, 250, 50, 0x4488FF)
                .setInteractive({ useHandCursor: true });
            const fillText = this.add.text(400, 220, `FILL TANK - $${cost}`, {
                fontSize: '20px',
                color: '#FFFFFF'
            }).setOrigin(0.5);
            this.shopContainer.add(fillBtn);
            this.shopContainer.add(fillText);

            fillBtn.on('pointerdown', () => {
                if (p.cash >= cost) {
                    p.cash -= cost;
                    p.fuel = p.maxFuel;
                    this.closeShop();
                    this.showNotification('Tank filled!', 0x4488FF);
                } else {
                    this.showNotification('Not enough cash!', 0xFF0000);
                }
            });
        } else {
            const fullText = this.add.text(400, 220, 'TANK IS FULL', {
                fontSize: '20px',
                color: '#00FF00'
            }).setOrigin(0.5);
            this.shopContainer.add(fullText);
        }

        // Cash display
        const cashText = this.add.text(400, 300, `Your Cash: $${p.cash.toLocaleString()}`, {
            fontSize: '16px',
            color: '#00FF00'
        }).setOrigin(0.5);
        this.shopContainer.add(cashText);
    }

    createMineralProcessorUI() {
        const p = this.player;

        if (p.cargo.length === 0) {
            const emptyText = this.add.text(400, 200, 'CARGO BAY EMPTY', {
                fontSize: '24px',
                color: '#888888'
            }).setOrigin(0.5);
            this.shopContainer.add(emptyText);
            return;
        }

        // List cargo
        let totalValue = 0;
        let yPos = 130;

        // Group minerals by type
        const grouped = {};
        for (const mineral of p.cargo) {
            if (!grouped[mineral.name]) {
                grouped[mineral.name] = { ...mineral, count: 0, totalValue: 0 };
            }
            grouped[mineral.name].count++;
            grouped[mineral.name].totalValue += mineral.value;
            totalValue += mineral.value;
        }

        for (const [name, data] of Object.entries(grouped)) {
            const line = this.add.text(200, yPos, `${data.count}x ${name}: $${data.totalValue.toLocaleString()}`, {
                fontSize: '16px',
                color: `#${data.color.toString(16).padStart(6, '0')}`
            });
            this.shopContainer.add(line);
            yPos += 25;
        }

        // Total
        const totalText = this.add.text(400, yPos + 30, `TOTAL VALUE: $${totalValue.toLocaleString()}`, {
            fontSize: '24px',
            color: '#FFD700'
        }).setOrigin(0.5);
        this.shopContainer.add(totalText);

        // Sell button
        const sellBtn = this.add.rectangle(400, yPos + 90, 200, 50, 0xFF8800)
            .setInteractive({ useHandCursor: true });
        const sellText = this.add.text(400, yPos + 90, 'SELL ALL', {
            fontSize: '24px',
            color: '#FFFFFF'
        }).setOrigin(0.5);
        this.shopContainer.add(sellBtn);
        this.shopContainer.add(sellText);

        sellBtn.on('pointerdown', () => {
            p.cash += totalValue;
            p.score += totalValue * 10;
            p.cargo = [];
            this.closeShop();
            this.showNotification(`+$${totalValue.toLocaleString()}`, 0x00FF00);
        });
    }

    createJunkShopUI() {
        const categories = ['drill', 'hull', 'engine', 'fuel', 'cargo', 'radiator'];
        const labels = ['DRILL', 'HULL', 'ENGINE', 'FUEL TANK', 'CARGO BAY', 'RADIATOR'];

        let yPos = 120;

        for (let i = 0; i < categories.length; i++) {
            const cat = categories[i];
            const currentTier = this.player.upgrades[cat];
            const upgrades = UPGRADES[cat];
            const current = upgrades[currentTier];
            const next = upgrades[currentTier + 1];

            // Category label
            const label = this.add.text(150, yPos, labels[i] + ':', {
                fontSize: '14px',
                color: '#AAAAAA'
            });
            this.shopContainer.add(label);

            // Current upgrade
            const currentText = this.add.text(280, yPos, current.name, {
                fontSize: '14px',
                color: '#FFFFFF'
            });
            this.shopContainer.add(currentText);

            // Upgrade button
            if (next) {
                const canAfford = this.player.cash >= next.price;
                const btn = this.add.rectangle(550, yPos + 5, 180, 28, canAfford ? 0x44AA44 : 0x666666)
                    .setInteractive({ useHandCursor: canAfford });
                const btnText = this.add.text(550, yPos + 5, `${next.name} - $${next.price.toLocaleString()}`, {
                    fontSize: '11px',
                    color: canAfford ? '#FFFFFF' : '#888888'
                }).setOrigin(0.5);
                this.shopContainer.add(btn);
                this.shopContainer.add(btnText);

                if (canAfford) {
                    const catCopy = cat;
                    btn.on('pointerdown', () => {
                        this.purchaseUpgrade(catCopy);
                    });
                }
            } else {
                const maxText = this.add.text(550, yPos + 5, 'MAX LEVEL', {
                    fontSize: '12px',
                    color: '#FFD700'
                }).setOrigin(0.5);
                this.shopContainer.add(maxText);
            }

            yPos += 50;
        }

        // Cash display
        const cashText = this.add.text(400, yPos + 30, `Your Cash: $${this.player.cash.toLocaleString()}`, {
            fontSize: '18px',
            color: '#00FF00'
        }).setOrigin(0.5);
        this.shopContainer.add(cashText);
    }

    purchaseUpgrade(category) {
        const p = this.player;
        const currentTier = p.upgrades[category];
        const next = UPGRADES[category][currentTier + 1];

        if (!next || p.cash < next.price) return;

        p.cash -= next.price;
        p.upgrades[category] = currentTier + 1;

        // Apply upgrade effects
        switch (category) {
            case 'drill':
                p.drillSpeed = next.speed;
                break;
            case 'hull':
                const oldMax = p.maxHull;
                p.maxHull = next.hp;
                p.hull = p.hull + (next.hp - oldMax); // Heal by difference
                break;
            case 'engine':
                p.enginePower = next.power;
                break;
            case 'fuel':
                p.maxFuel = next.capacity;
                break;
            case 'cargo':
                p.cargoCapacity = next.capacity;
                break;
            case 'radiator':
                p.radiatorReduction = next.reduction;
                break;
        }

        this.closeShop();
        this.showNotification(`Upgraded ${category}!`, 0x44FF44);
    }

    createRepairShopUI() {
        const p = this.player;

        // Hull repair
        const damageHP = p.maxHull - p.hull;
        const repairCost = damageHP * 15;

        const hullText = this.add.text(400, 130, `Hull: ${p.hull}/${p.maxHull} HP`, {
            fontSize: '18px',
            color: '#FF4444'
        }).setOrigin(0.5);
        this.shopContainer.add(hullText);

        if (damageHP > 0) {
            const repairBtn = this.add.rectangle(400, 180, 250, 40, 0xFF4444)
                .setInteractive({ useHandCursor: true });
            const repairText = this.add.text(400, 180, `REPAIR ALL - $${repairCost}`, {
                fontSize: '16px',
                color: '#FFFFFF'
            }).setOrigin(0.5);
            this.shopContainer.add(repairBtn);
            this.shopContainer.add(repairText);

            repairBtn.on('pointerdown', () => {
                if (p.cash >= repairCost) {
                    p.cash -= repairCost;
                    p.hull = p.maxHull;
                    this.closeShop();
                    this.showNotification('Hull repaired!', 0x00FF00);
                }
            });
        } else {
            const fullText = this.add.text(400, 180, 'HULL IS FULL', {
                fontSize: '16px',
                color: '#00FF00'
            }).setOrigin(0.5);
            this.shopContainer.add(fullText);
        }

        // Consumables
        const items = [
            { key: 'fuelTanks', name: 'Reserve Fuel', price: 2000, desc: '+25L fuel' },
            { key: 'nanobots', name: 'Hull Nanobots', price: 7500, desc: '+30 HP' },
            { key: 'dynamite', name: 'Dynamite', price: 2000, desc: '3x3 blast' }
        ];

        let yPos = 250;
        for (const item of items) {
            const owned = p.consumables[item.key];
            const canAfford = p.cash >= item.price;

            const itemText = this.add.text(200, yPos, `${item.name} (${owned}): ${item.desc}`, {
                fontSize: '14px',
                color: '#AAAAAA'
            });
            this.shopContainer.add(itemText);

            const buyBtn = this.add.rectangle(550, yPos + 5, 120, 28, canAfford ? 0x44AA44 : 0x666666)
                .setInteractive({ useHandCursor: canAfford });
            const buyText = this.add.text(550, yPos + 5, `$${item.price}`, {
                fontSize: '14px',
                color: canAfford ? '#FFFFFF' : '#888888'
            }).setOrigin(0.5);
            this.shopContainer.add(buyBtn);
            this.shopContainer.add(buyText);

            if (canAfford) {
                const itemKey = item.key;
                const itemPrice = item.price;
                buyBtn.on('pointerdown', () => {
                    p.cash -= itemPrice;
                    p.consumables[itemKey]++;
                    this.closeShop();
                    this.showNotification(`Bought ${item.name}!`, 0x44FF44);
                });
            }

            yPos += 40;
        }

        // Cash display
        const cashText = this.add.text(400, 450, `Your Cash: $${p.cash.toLocaleString()}`, {
            fontSize: '18px',
            color: '#00FF00'
        }).setOrigin(0.5);
        this.shopContainer.add(cashText);
    }

    createSavePointUI() {
        const saveText = this.add.text(400, 200, 'QUANTUM STATE ANALYZER', {
            fontSize: '20px',
            color: '#44FF44'
        }).setOrigin(0.5);
        this.shopContainer.add(saveText);

        const saveBtn = this.add.rectangle(400, 280, 200, 50, 0x44FF44)
            .setInteractive({ useHandCursor: true });
        const saveBtnText = this.add.text(400, 280, 'SAVE GAME', {
            fontSize: '20px',
            color: '#000000'
        }).setOrigin(0.5);
        this.shopContainer.add(saveBtn);
        this.shopContainer.add(saveBtnText);

        saveBtn.on('pointerdown', () => {
            this.saveGame();
            this.closeShop();
            this.showNotification('Game Saved!', 0x44FF44);
        });

        // Load button (if save exists)
        if (localStorage.getItem('motherload_save')) {
            const loadBtn = this.add.rectangle(400, 350, 200, 50, 0x4488FF)
                .setInteractive({ useHandCursor: true });
            const loadBtnText = this.add.text(400, 350, 'LOAD GAME', {
                fontSize: '20px',
                color: '#FFFFFF'
            }).setOrigin(0.5);
            this.shopContainer.add(loadBtn);
            this.shopContainer.add(loadBtnText);

            loadBtn.on('pointerdown', () => {
                this.loadGame();
                this.closeShop();
                this.showNotification('Game Loaded!', 0x4488FF);
            });
        }
    }

    saveGame() {
        const saveData = {
            player: { ...this.player },
            version: 1
        };
        delete saveData.player.cargo; // Cargo serialized separately
        saveData.cargo = this.player.cargo.map(m => ({ id: m.id, name: m.name, value: m.value, weight: m.weight }));

        localStorage.setItem('motherload_save', JSON.stringify(saveData));
    }

    loadGame() {
        const data = JSON.parse(localStorage.getItem('motherload_save'));
        if (!data) return;

        Object.assign(this.player, data.player);
        this.player.cargo = data.cargo.map(c => {
            const mineral = MINERALS.find(m => m.id === c.id);
            return mineral ? { ...mineral } : c;
        });
    }

    useNanobot() {
        const p = this.player;
        if (p.consumables.nanobots > 0 && p.hull < p.maxHull) {
            p.consumables.nanobots--;
            p.hull = Math.min(p.hull + 30, p.maxHull);
            this.showNotification('+30 HP', 0x00FF00);
        }
    }

    useFuelTank() {
        const p = this.player;
        if (p.consumables.fuelTanks > 0 && p.fuel < p.maxFuel) {
            p.consumables.fuelTanks--;
            p.fuel = Math.min(p.fuel + 25, p.maxFuel);
            this.showNotification('+25 Fuel', 0x4488FF);
        }
    }

    useDynamite() {
        const p = this.player;
        if (p.consumables.dynamite > 0 && p.isGrounded) {
            p.consumables.dynamite--;

            // Destroy 3x3 area below player
            const centerX = Math.floor(p.x / TILE_SIZE);
            const centerY = Math.floor(p.y / TILE_SIZE) + 1;

            for (let dy = 0; dy < 3; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const tx = centerX + dx;
                    const ty = centerY + dy;
                    if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
                        const tile = this.world[ty][tx];
                        if (tile !== TileType.BUILDING) {
                            this.world[ty][tx] = TileType.EMPTY;
                        }
                    }
                }
            }

            this.showNotification('BOOM!', 0xFF8800);
            // Screen shake
            this.cameras.main.shake(300, 0.02);
        }
    }

    takeDamage(amount) {
        this.player.hull -= amount;
        this.cameras.main.shake(200, 0.01);

        if (this.player.hull <= 0) {
            this.player.hull = 0;
            this.gameOver();
        }
    }

    gameOver() {
        this.scene.start('GameOverScene', {
            score: this.player.score,
            cash: this.player.cash,
            depth: Math.floor(this.player.y / TILE_SIZE) * TILE_SIZE
        });
    }

    showNotification(text, color) {
        this.notifications.push({
            text: text,
            color: color,
            life: 2000,
            y: 100
        });
    }

    updateNotifications(delta) {
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notif = this.notifications[i];
            notif.life -= delta;
            notif.y -= delta * 0.03;

            if (notif.life <= 0) {
                this.notifications.splice(i, 1);
            }
        }

        // Render notifications
        for (const notif of this.notifications) {
            const alpha = Math.min(1, notif.life / 500);
            if (!notif.textObj) {
                notif.textObj = this.add.text(400, notif.y, notif.text, {
                    fontSize: '20px',
                    fontFamily: 'Arial',
                    color: `#${notif.color.toString(16).padStart(6, '0')}`
                }).setOrigin(0.5).setScrollFactor(0);
            }
            notif.textObj.setPosition(400, notif.y);
            notif.textObj.setAlpha(alpha);

            if (notif.life <= 0 && notif.textObj) {
                notif.textObj.destroy();
            }
        }
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.finalCash = data.cash || 0;
        this.maxDepth = data.depth || 0;
    }

    create() {
        this.add.rectangle(400, 300, 800, 600, 0x220000);

        this.add.text(400, 100, 'GAME OVER', {
            fontSize: '64px',
            fontFamily: 'Arial Black',
            color: '#FF0000'
        }).setOrigin(0.5);

        this.add.text(400, 200, 'Your pod was destroyed!', {
            fontSize: '24px',
            color: '#AAAAAA'
        }).setOrigin(0.5);

        // Stats
        this.add.text(400, 280, `Max Depth: ${this.maxDepth} ft`, {
            fontSize: '20px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        this.add.text(400, 320, `Final Score: ${this.finalScore.toLocaleString()}`, {
            fontSize: '20px',
            color: '#FFFF00'
        }).setOrigin(0.5);

        this.add.text(400, 360, `Cash Earned: $${this.finalCash.toLocaleString()}`, {
            fontSize: '20px',
            color: '#00FF00'
        }).setOrigin(0.5);

        // Retry button
        const retryBtn = this.add.rectangle(400, 460, 200, 50, 0xFF6600)
            .setInteractive({ useHandCursor: true });
        this.add.text(400, 460, 'TRY AGAIN', {
            fontSize: '24px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        retryBtn.on('pointerdown', () => this.scene.start('GameScene'));

        // Menu button
        const menuBtn = this.add.rectangle(400, 530, 200, 50, 0x666666)
            .setInteractive({ useHandCursor: true });
        this.add.text(400, 530, 'MAIN MENU', {
            fontSize: '24px',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Game configuration
const config = {
    type: Phaser.CANVAS,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    parent: 'game',
    backgroundColor: '#000000',
    scene: [BootScene, MenuScene, GameScene, GameOverScene],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    render: {
        pixelArt: true,
        antialias: false
    }
};

const game = new Phaser.Game(config);
