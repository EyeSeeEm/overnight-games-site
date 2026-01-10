// MOTHERLOAD - Mars Mining Simulation (Phaser)
// Uses global 'Phaser' from CDN

// Constants
const TILE_SIZE = 16;
const WORLD_WIDTH = 40;
const WORLD_HEIGHT = 200;
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

// Minerals data
const MINERALS = {
    ironium: { id: 10, name: 'Ironium', value: 30, weight: 10, minDepth: 25, color: 0x8B4513 },
    bronzium: { id: 11, name: 'Bronzium', value: 60, weight: 10, minDepth: 25, color: 0xCD7F32 },
    silverium: { id: 12, name: 'Silverium', value: 100, weight: 10, minDepth: 25, color: 0xC0C0C0 },
    goldium: { id: 13, name: 'Goldium', value: 250, weight: 20, minDepth: 250, color: 0xFFD700 },
    platinum: { id: 14, name: 'Platinum', value: 750, weight: 30, minDepth: 800, color: 0xE5E4E2 },
    einsteinium: { id: 15, name: 'Einsteinium', value: 2000, weight: 40, minDepth: 1600, color: 0x00FF00 },
    emerald: { id: 16, name: 'Emerald', value: 5000, weight: 60, minDepth: 2400, color: 0x50C878 },
    ruby: { id: 17, name: 'Ruby', value: 20000, weight: 80, minDepth: 4000, color: 0xE0115F },
    diamond: { id: 18, name: 'Diamond', value: 100000, weight: 100, minDepth: 4400, color: 0xB9F2FF },
    amazonite: { id: 19, name: 'Amazonite', value: 500000, weight: 120, minDepth: 5500, color: 0x00C4B0 }
};

// Tile types
const TILE = {
    EMPTY: 0, DIRT: 1, ROCK: 2, BOULDER: 3, LAVA: 4, BUILDING: 5
};

// Upgrades
const DRILL_UPGRADES = [
    { name: 'Stock', speed: 20, price: 0 },
    { name: 'Silvide', speed: 28, price: 750 },
    { name: 'Goldium', speed: 40, price: 2000 },
    { name: 'Emerald', speed: 50, price: 5000 },
    { name: 'Ruby', speed: 70, price: 20000 },
    { name: 'Diamond', speed: 95, price: 100000 },
    { name: 'Amazonite', speed: 120, price: 500000 }
];

const HULL_UPGRADES = [
    { name: 'Stock', hp: 10, price: 0 },
    { name: 'Ironium', hp: 17, price: 750 },
    { name: 'Bronzium', hp: 30, price: 2000 },
    { name: 'Steel', hp: 50, price: 5000 },
    { name: 'Platinum', hp: 80, price: 20000 },
    { name: 'Einsteinium', hp: 120, price: 100000 },
    { name: 'Energy-Shield', hp: 180, price: 500000 }
];

const FUEL_UPGRADES = [
    { name: 'Micro', capacity: 10, price: 0 },
    { name: 'Medium', capacity: 15, price: 750 },
    { name: 'Huge', capacity: 25, price: 2000 },
    { name: 'Gigantic', capacity: 40, price: 5000 },
    { name: 'Titanic', capacity: 60, price: 20000 },
    { name: 'Leviathan', capacity: 100, price: 100000 },
    { name: 'Compressed', capacity: 150, price: 500000 }
];

const CARGO_UPGRADES = [
    { name: 'Micro', capacity: 70, price: 0 },
    { name: 'Medium', capacity: 150, price: 750 },
    { name: 'Huge', capacity: 250, price: 2000 },
    { name: 'Gigantic', capacity: 400, price: 5000 },
    { name: 'Titanic', capacity: 700, price: 20000 },
    { name: 'Leviathan', capacity: 1200, price: 100000 }
];

// Game state
let state;
let world;
let particles;
let screenShake = 0;

// Expose for testing
window.gameState = null;

// Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.shopOpen = false;
        this.shopType = '';
    }

    create() {
        // Initialize state
        state = {
            cash: 500,
            score: 0,
            fuel: 10,
            hull: 10,
            drillTier: 0,
            hullTier: 0,
            fuelTier: 0,
            cargoTier: 0,
            cargo: [],
            depth: 0,
            x: SCREEN_WIDTH / 2,
            y: 80,
            vx: 0,
            vy: 0,
            drilling: false,
            drillDir: { x: 0, y: 0 },
            drillProgress: 0
        };

        particles = [];

        // Generate world
        generateWorld();

        // Create graphics
        this.graphics = this.add.graphics();

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-SPACE', () => this.toggleShop());
        this.input.keyboard.on('keydown-B', () => this.buyUpgrade());

        // HUD
        this.hudText = this.add.text(10, 10, '', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'monospace',
            backgroundColor: '#00000088',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(100);

        // Camera
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH * TILE_SIZE, WORLD_HEIGHT * TILE_SIZE);

        // Expose state
        window.gameState = state;
    }

    update(time, delta) {
        if (this.shopOpen) {
            this.drawShop();
            return;
        }

        const dt = delta / 1000;

        // Input handling
        let dx = 0;
        let dy = 0;
        if (this.cursors.left.isDown) dx = -1;
        if (this.cursors.right.isDown) dx = 1;
        if (this.cursors.up.isDown) dy = -1;
        if (this.cursors.down.isDown) dy = 1;

        // Movement
        if (state.fuel > 0) {
            if (dy < 0) {
                state.vy -= 400 * dt;
                state.fuel -= 0.1 * dt;
            }
            if (dx !== 0) {
                state.vx = dx * 100;
                state.fuel -= 0.05 * dt;
            }
        }

        // Gravity
        state.vy += 200 * dt;
        state.vy = Math.min(state.vy, 300);

        // Drilling
        if (dy > 0 && state.fuel > 0) {
            const tileX = Math.floor(state.x / TILE_SIZE);
            const tileY = Math.floor((state.y + TILE_SIZE) / TILE_SIZE);

            if (tileY >= 0 && tileY < WORLD_HEIGHT && tileX >= 0 && tileX < WORLD_WIDTH) {
                const tile = world[tileY][tileX];
                if (tile !== TILE.EMPTY && tile !== TILE.BUILDING && tile !== TILE.BOULDER) {
                    if (!state.drilling) {
                        state.drilling = true;
                        state.drillDir = { x: tileX, y: tileY };
                        state.drillProgress = 0;
                    }

                    const drillSpeed = DRILL_UPGRADES[state.drillTier].speed;
                    state.drillProgress += drillSpeed * dt;
                    state.fuel -= 0.1 * dt;

                    // Drill complete
                    if (state.drillProgress >= 100) {
                        this.completeDrill(tileX, tileY, tile);
                        state.drilling = false;
                        state.y += TILE_SIZE;
                    }
                } else {
                    state.drilling = false;
                }
            }
        } else {
            state.drilling = false;
        }

        // Apply velocity if not drilling
        if (!state.drilling) {
            state.x += state.vx * dt;
            state.y += state.vy * dt;
        }

        // Friction
        state.vx *= 0.9;

        // Collision with world
        this.handleCollision();

        // Update depth
        state.depth = Math.max(0, Math.floor((state.y - 100) / TILE_SIZE) * 13);

        // Surface buildings
        if (state.y < 100) {
            if (state.x < 100) this.shopType = 'fuel';
            else if (state.x < 250) this.shopType = 'sell';
            else if (state.x < 400) this.shopType = 'upgrade';
            else if (state.x < 550) this.shopType = 'repair';
            else this.shopType = '';
        } else {
            this.shopType = '';
        }

        // Update particles
        this.updateParticles(dt);

        // Screen shake
        if (screenShake > 0) screenShake -= dt * 10;

        // Drawing
        this.draw();

        // Update HUD
        this.updateHUD();
    }

    handleCollision() {
        // World bounds
        state.x = Phaser.Math.Clamp(state.x, TILE_SIZE, WORLD_WIDTH * TILE_SIZE - TILE_SIZE);
        state.y = Math.max(state.y, 50);

        // Tile collision
        const tileX = Math.floor(state.x / TILE_SIZE);
        const tileY = Math.floor(state.y / TILE_SIZE);

        // Check below
        if (tileY + 1 < WORLD_HEIGHT) {
            const below = world[tileY + 1] ? world[tileY + 1][tileX] : undefined;
            if (below && below !== TILE.EMPTY) {
                if (state.vy > 0 && !state.drilling) {
                    // Fall damage
                    if (state.vy > 150) {
                        const damage = Math.floor((state.vy - 150) / 30);
                        this.takeDamage(damage);
                    }
                    state.vy = 0;
                    state.y = tileY * TILE_SIZE;
                }
            }
        }

        // Check sides
        const leftTile = world[tileY] ? world[tileY][tileX - 1] : undefined;
        const rightTile = world[tileY] ? world[tileY][tileX + 1] : undefined;
        if (leftTile && leftTile !== TILE.EMPTY && state.vx < 0) {
            state.vx = 0;
            state.x = tileX * TILE_SIZE + TILE_SIZE / 2;
        }
        if (rightTile && rightTile !== TILE.EMPTY && state.vx > 0) {
            state.vx = 0;
            state.x = tileX * TILE_SIZE + TILE_SIZE / 2;
        }
    }

    completeDrill(tileX, tileY, tile) {
        // Check for minerals
        const mineralKey = Object.keys(MINERALS).find(k => MINERALS[k].id === tile);

        if (mineralKey) {
            const mineral = MINERALS[mineralKey];
            const cargoWeight = state.cargo.reduce((a, c) => a + c.weight, 0);
            const maxCargo = CARGO_UPGRADES[state.cargoTier].capacity;

            if (cargoWeight + mineral.weight <= maxCargo) {
                state.cargo.push({
                    type: mineral.name,
                    value: mineral.value,
                    weight: mineral.weight
                });
                this.spawnParticles(tileX * TILE_SIZE, tileY * TILE_SIZE, mineral.color, 10);
            }
        } else if (tile === TILE.LAVA) {
            this.takeDamage(5);
            screenShake = 5;
        }

        // Clear tile
        world[tileY][tileX] = TILE.EMPTY;

        // Drill particles
        this.spawnParticles(tileX * TILE_SIZE, tileY * TILE_SIZE, 0x8B4513, 5);
    }

    takeDamage(amount) {
        state.hull -= amount;
        screenShake = Math.max(screenShake, amount);
        this.spawnParticles(state.x, state.y, 0xff0000, 10);

        if (state.hull <= 0) {
            this.scene.start('GameOverScene');
        }
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 1) * 100,
                color,
                life: 1
            });
        }
    }

    updateParticles(dt) {
        particles = particles.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt;
            p.life -= dt * 2;
            return p.life > 0;
        });
    }

    toggleShop() {
        if (this.shopType && state.y < 100) {
            this.shopOpen = !this.shopOpen;
        }
    }

    buyUpgrade() {
        if (!this.shopOpen) return;

        if (this.shopType === 'fuel') {
            const cost = Math.ceil((FUEL_UPGRADES[state.fuelTier].capacity - state.fuel) * 2);
            if (state.cash >= cost) {
                state.cash -= cost;
                state.fuel = FUEL_UPGRADES[state.fuelTier].capacity;
            }
        } else if (this.shopType === 'sell') {
            let total = 0;
            state.cargo.forEach(c => {
                total += c.value;
                state.score += c.value;
            });
            state.cash += total;
            state.cargo = [];
        } else if (this.shopType === 'upgrade') {
            // Buy next drill upgrade
            const nextTier = state.drillTier + 1;
            if (nextTier < DRILL_UPGRADES.length) {
                const cost = DRILL_UPGRADES[nextTier].price;
                if (state.cash >= cost) {
                    state.cash -= cost;
                    state.drillTier = nextTier;
                }
            }
        } else if (this.shopType === 'repair') {
            const maxHull = HULL_UPGRADES[state.hullTier].hp;
            const damage = maxHull - state.hull;
            const cost = damage * 15;
            if (state.cash >= cost && damage > 0) {
                state.cash -= cost;
                state.hull = maxHull;
            }
        }
    }

    draw() {
        const g = this.graphics;
        g.clear();

        const camY = Math.max(0, state.y - SCREEN_HEIGHT / 2);
        const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;
        const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;

        // Sky gradient
        g.fillGradientStyle(0x8B2500, 0x8B2500, 0x2F1010, 0x2F1010);
        g.fillRect(shakeX, shakeY, SCREEN_WIDTH, 100 - camY + shakeY);

        // Draw visible tiles
        const startY = Math.floor(camY / TILE_SIZE);
        const endY = Math.min(startY + Math.ceil(SCREEN_HEIGHT / TILE_SIZE) + 2, WORLD_HEIGHT);

        for (let ty = startY; ty < endY; ty++) {
            for (let tx = 0; tx < WORLD_WIDTH; tx++) {
                const tile = world[ty][tx];
                if (tile === TILE.EMPTY) continue;

                const sx = tx * TILE_SIZE + shakeX;
                const sy = ty * TILE_SIZE - camY + shakeY;

                if (tile === TILE.DIRT) {
                    // Textured dirt
                    g.fillStyle(0x6B4423);
                    g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                    g.fillStyle(0x5C3317);
                    g.fillRect(sx, sy, TILE_SIZE, 2);
                    g.fillStyle(0x7C5533);
                    g.fillRect(sx + 2, sy + 4, 4, 2);
                } else if (tile === TILE.ROCK) {
                    g.fillStyle(0x555555);
                    g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                    g.fillStyle(0x666666);
                    g.fillRect(sx + 2, sy + 2, TILE_SIZE - 4, 2);
                } else if (tile === TILE.LAVA) {
                    g.fillStyle(0xFF4500);
                    g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                    g.fillStyle(0xFFFF00);
                    g.fillRect(sx + 4, sy + 4, 8, 8);
                } else if (tile === TILE.BOULDER) {
                    g.fillStyle(0x333333);
                    g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                } else if (tile === TILE.BUILDING) {
                    g.fillStyle(0x444444);
                    g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                } else {
                    // Mineral
                    const mineralKey = Object.keys(MINERALS).find(k => MINERALS[k].id === tile);
                    if (mineralKey) {
                        const mineral = MINERALS[mineralKey];
                        // Ore in dirt
                        g.fillStyle(0x6B4423);
                        g.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                        g.fillStyle(mineral.color);
                        g.fillRect(sx + 4, sy + 4, 8, 8);
                        g.fillStyle(0xFFFFFF);
                        g.fillRect(sx + 5, sy + 5, 2, 2);
                    }
                }
            }
        }

        // Surface buildings
        if (camY < 150) {
            const buildingY = 100 - camY + shakeY;

            // Fuel station
            g.fillStyle(0x880000);
            g.fillRect(20 + shakeX, buildingY - 40, 60, 40);
            g.fillStyle(0xFF0000);
            g.fillRect(30 + shakeX, buildingY - 30, 40, 20);

            // Mineral Processor
            g.fillStyle(0x008800);
            g.fillRect(160 + shakeX, buildingY - 50, 80, 50);
            g.fillStyle(0x00FF00);
            g.fillRect(180 + shakeX, buildingY - 40, 40, 30);

            // Junk Shop
            g.fillStyle(0x888800);
            g.fillRect(320 + shakeX, buildingY - 45, 70, 45);
            g.fillStyle(0xFFFF00);
            g.fillRect(335 + shakeX, buildingY - 35, 40, 25);

            // Repair Shop
            g.fillStyle(0x000088);
            g.fillRect(480 + shakeX, buildingY - 40, 65, 40);
            g.fillStyle(0x0000FF);
            g.fillRect(495 + shakeX, buildingY - 30, 35, 20);
        }

        // Draw particles
        particles.forEach(p => {
            g.fillStyle(p.color, p.life);
            g.fillCircle(p.x + shakeX, p.y - camY + shakeY, 3);
        });

        // Draw player pod
        const px = state.x + shakeX;
        const py = state.y - camY + shakeY;

        // Pod body
        g.fillStyle(0xCC8800);
        g.fillRect(px - 8, py - 12, 16, 20);

        // Cockpit
        g.fillStyle(0x88CCFF);
        g.fillRect(px - 5, py - 10, 10, 8);

        // Drill
        g.fillStyle(0x666666);
        g.fillTriangle(px, py + 8, px - 6, py + 2, px + 6, py + 2);

        // Exhaust when moving up
        if (this.cursors.up.isDown && state.fuel > 0) {
            g.fillStyle(0xFF6600);
            g.fillRect(px - 4, py + 8, 8, 10 + Math.random() * 5);
            g.fillStyle(0xFFFF00);
            g.fillRect(px - 2, py + 12, 4, 6 + Math.random() * 3);
        }

        // Drill effect
        if (state.drilling) {
            g.fillStyle(0xFFFFFF, 0.5);
            g.fillCircle(px, py + 15, 5 + Math.random() * 3);
        }

        // Low fuel/hull indicators
        if (state.fuel < FUEL_UPGRADES[state.fuelTier].capacity * 0.2) {
            g.lineStyle(2, 0xFF0000);
            g.strokeCircle(px, py, 20 + Math.sin(Date.now() / 100) * 3);
        }
    }

    drawShop() {
        const g = this.graphics;
        g.clear();

        // Overlay
        g.fillStyle(0x000000, 0.8);
        g.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        // Panel
        g.fillStyle(0x333333);
        g.fillRect(100, 100, SCREEN_WIDTH - 200, SCREEN_HEIGHT - 200);
        g.lineStyle(3, 0xFFFFFF);
        g.strokeRect(100, 100, SCREEN_WIDTH - 200, SCREEN_HEIGHT - 200);

        // Shop content as HUD text
        let text = '';
        if (this.shopType === 'fuel') {
            const maxFuel = FUEL_UPGRADES[state.fuelTier].capacity;
            const cost = Math.ceil((maxFuel - state.fuel) * 2);
            text = `FUEL STATION\n\nCurrent: ${state.fuel.toFixed(1)}L / ${maxFuel}L\n\nCost to fill: $${cost}\n\n[B] Buy Fuel   [SPACE] Close`;
        } else if (this.shopType === 'sell') {
            const total = state.cargo.reduce((a, c) => a + c.value, 0);
            text = `MINERAL PROCESSOR\n\nCargo: ${state.cargo.length} items\nTotal value: $${total}\n\n[B] Sell All   [SPACE] Close`;
        } else if (this.shopType === 'upgrade') {
            const nextTier = state.drillTier + 1;
            const nextDrill = DRILL_UPGRADES[nextTier];
            text = `JUNK SHOP\n\nDrill: ${DRILL_UPGRADES[state.drillTier].name}\n`;
            if (nextDrill) {
                text += `Next: ${nextDrill.name} ($${nextDrill.price})\n`;
            }
            text += `\n[B] Buy Upgrade   [SPACE] Close`;
        } else if (this.shopType === 'repair') {
            const maxHull = HULL_UPGRADES[state.hullTier].hp;
            const damage = maxHull - state.hull;
            const cost = damage * 15;
            text = `REPAIR SHOP\n\nHull: ${state.hull} / ${maxHull}\n\nRepair cost: $${cost}\n\n[B] Repair   [SPACE] Close`;
        }

        this.hudText.setText(text);
        this.hudText.setPosition(150, 150);
    }

    updateHUD() {
        if (this.shopOpen) return;

        const maxFuel = FUEL_UPGRADES[state.fuelTier].capacity;
        const maxHull = HULL_UPGRADES[state.hullTier].hp;
        const maxCargo = CARGO_UPGRADES[state.cargoTier].capacity;
        const cargoWeight = state.cargo.reduce((a, c) => a + c.weight, 0);

        let hud = `DEPTH: ${state.depth}ft | CASH: $${state.cash} | SCORE: ${state.score}\n`;
        hud += `FUEL: ${state.fuel.toFixed(1)}/${maxFuel}L | HULL: ${state.hull}/${maxHull} | CARGO: ${cargoWeight}/${maxCargo}kg`;

        if (this.shopType) {
            hud += `\n\n[SPACE] Enter ${this.shopType.toUpperCase()}`;
        }

        this.hudText.setText(hud);
        this.hudText.setPosition(10, 10);
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Background
        this.cameras.main.setBackgroundColor('#2a0a0a');

        // Title
        this.add.text(SCREEN_WIDTH / 2, 150, 'MOTHERLOAD', {
            fontSize: '64px',
            color: '#CD7F32',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(SCREEN_WIDTH / 2, 220, 'Mars Mining Simulation', {
            fontSize: '24px',
            color: '#E5E4E2'
        }).setOrigin(0.5);

        // Start button
        const startBtn = this.add.text(SCREEN_WIDTH / 2, 350, '[ START GAME ]', {
            fontSize: '32px',
            color: '#FFD700',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setColor('#FFFFFF'));
        startBtn.on('pointerout', () => startBtn.setColor('#FFD700'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));

        // Instructions
        this.add.text(SCREEN_WIDTH / 2, 480, 'Arrow Keys: Move/Drill\nSPACE: Enter Buildings\nB: Buy/Sell', {
            fontSize: '18px',
            color: '#888888',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5);
    }
}

// Game Over Scene
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#0a0a0a');

        this.add.text(SCREEN_WIDTH / 2, 200, 'GAME OVER', {
            fontSize: '64px',
            color: '#FF0000',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(SCREEN_WIDTH / 2, 300, `Final Score: ${state.score}`, {
            fontSize: '32px',
            color: '#FFD700'
        }).setOrigin(0.5);

        this.add.text(SCREEN_WIDTH / 2, 340, `Max Depth: ${state.depth}ft`, {
            fontSize: '24px',
            color: '#E5E4E2'
        }).setOrigin(0.5);

        const restartBtn = this.add.text(SCREEN_WIDTH / 2, 450, '[ PLAY AGAIN ]', {
            fontSize: '28px',
            color: '#00FF00',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// World Generation
function generateWorld() {
    world = [];

    for (let y = 0; y < WORLD_HEIGHT; y++) {
        const row = [];
        const depth = y * 13; // ft

        for (let x = 0; x < WORLD_WIDTH; x++) {
            // Surface
            if (y < 7) {
                // Building foundations
                if (y === 6 && (
                    (x >= 1 && x <= 5) ||
                    (x >= 10 && x <= 15) ||
                    (x >= 20 && x <= 25) ||
                    (x >= 30 && x <= 35)
                )) {
                    row.push(TILE.BUILDING);
                } else {
                    row.push(TILE.EMPTY);
                }
                continue;
            }

            const roll = Math.random();

            // Hazards
            if (depth > 3100 && roll < 0.03) {
                row.push(TILE.LAVA);
                continue;
            }

            if (depth > 1500 && roll < 0.02) {
                row.push(TILE.BOULDER);
                continue;
            }

            // Minerals
            const mineral = rollMineral(depth);
            if (mineral) {
                row.push(mineral);
                continue;
            }

            // Default terrain
            if (roll < 0.7) {
                row.push(TILE.DIRT);
            } else {
                row.push(TILE.ROCK);
            }
        }

        world.push(row);
    }
}

function rollMineral(depth) {
    const roll = Math.random();

    // Check minerals in reverse value order (rarest first)
    const mineralList = Object.values(MINERALS).sort((a, b) => b.value - a.value);

    for (const mineral of mineralList) {
        if (depth >= mineral.minDepth) {
            // Probability decreases with value
            const prob = 0.15 - (mineral.value / 5000000);
            // But increases at appropriate depths
            const depthBonus = Math.min(0.1, (depth - mineral.minDepth) / 10000);

            if (roll < Math.max(0.01, prob + depthBonus)) {
                return mineral.id;
            }
        }
    }

    return null;
}

// Game Config
const config = {
    type: Phaser.AUTO,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
    scene: [MenuScene, GameScene, GameOverScene],
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    audio: {
        noAudio: true // Disable audio for testing
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

new Phaser.Game(config);
