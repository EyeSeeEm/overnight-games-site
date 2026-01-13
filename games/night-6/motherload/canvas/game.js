// Motherload Clone - Canvas Implementation with Test Harness
// Agent 2 - Night 6

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════════
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const TILE_SIZE = 20;
    const WORLD_WIDTH = 40; // tiles
    const WORLD_HEIGHT = 200; // tiles (4000 ft deep)

    // Player
    const PLAYER_WIDTH = 18;
    const PLAYER_HEIGHT = 22;
    const GRAVITY = 400;
    const THRUST = 500;
    const MOVE_SPEED = 150;
    const DRILL_TIME = 0.3; // seconds to drill one tile

    // Starting stats
    const START_FUEL = 15;
    const START_HULL = 20;
    const START_CARGO = 50; // Must be able to carry minerals
    const START_DRILL_SPEED = 1.0;

    // Colors
    const COLORS = {
        sky: '#8B4513',
        skyGradient: '#CD853F',
        dirt: '#8B4513',
        rock: '#696969',
        empty: '#2F1810',
        surface: '#D2691E',
        building: '#4A4A4A',
        buildingHighlight: '#5A5A5A',
        player: '#4169E1',
        playerCockpit: '#87CEEB',
        fuel: '#FF6347',
        hull: '#48BB78',
        cargo: '#FFD700'
    };

    // Minerals
    const MINERALS = [
        { id: 1, name: 'Ironium', value: 30, weight: 10, minDepth: 25, color: '#8B4513' },
        { id: 2, name: 'Bronzium', value: 60, weight: 10, minDepth: 25, color: '#CD7F32' },
        { id: 3, name: 'Silverium', value: 100, weight: 10, minDepth: 25, color: '#C0C0C0' },
        { id: 4, name: 'Goldium', value: 250, weight: 20, minDepth: 250, color: '#FFD700' },
        { id: 5, name: 'Platinum', value: 750, weight: 30, minDepth: 800, color: '#E5E4E2' },
        { id: 6, name: 'Einsteinium', value: 2000, weight: 40, minDepth: 1600, color: '#00FF00' }
    ];

    // Tile types
    const TILE = {
        EMPTY: 0,
        DIRT: 1,
        ROCK: 2,
        MINERAL_START: 10
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME STATE
    // ═══════════════════════════════════════════════════════════════════════════
    let canvas, ctx;
    let gamePaused = true;
    let gameState = 'menu'; // 'menu', 'playing', 'shop', 'gameover'
    let lastTime = 0;
    let deltaTime = 0;

    // Input
    let keysDown = {};
    let activeKeys = new Set();

    // Camera
    let camera = { x: 0, y: 0 };

    // World
    let world = [];

    // Player
    let player = null;

    // Stats
    let stats = {
        mineralsCollected: 0,
        goldEarned: 0,
        maxDepth: 0
    };

    // Shop state
    let currentShop = null;

    // Floating texts
    let floatingTexts = [];

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function worldToScreen(worldX, worldY) {
        return {
            x: worldX - camera.x,
            y: worldY - camera.y
        };
    }

    function tileToWorld(tileX, tileY) {
        return {
            x: tileX * TILE_SIZE,
            y: tileY * TILE_SIZE
        };
    }

    function worldToTile(worldX, worldY) {
        return {
            x: Math.floor(worldX / TILE_SIZE),
            y: Math.floor(worldY / TILE_SIZE)
        };
    }

    function getDepth(worldY) {
        // Surface is at tile row 2
        return Math.max(0, (worldY / TILE_SIZE - 2) * 13); // 13 ft per tile
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WORLD GENERATION
    // ═══════════════════════════════════════════════════════════════════════════
    function generateWorld() {
        world = [];

        for (let y = 0; y < WORLD_HEIGHT; y++) {
            const row = [];
            const depth = (y - 2) * 13; // ft

            for (let x = 0; x < WORLD_WIDTH; x++) {
                // Surface area (sky + ground level)
                if (y < 2) {
                    row.push(TILE.EMPTY);
                }
                // Building foundations (can't drill)
                else if (y < 4 && isBuilding(x)) {
                    row.push(TILE.ROCK);
                }
                // Underground
                else {
                    row.push(generateTile(depth, x, y));
                }
            }
            world.push(row);
        }
    }

    function isBuilding(x) {
        // Buildings at specific positions
        const buildings = [
            { start: 2, end: 6 },   // Fuel station
            { start: 12, end: 16 }, // Mineral processor
            { start: 22, end: 26 }, // Upgrade shop
            { start: 32, end: 36 }  // Repair shop
        ];

        for (const b of buildings) {
            if (x >= b.start && x <= b.end) return true;
        }
        return false;
    }

    function generateTile(depth, x, y) {
        const roll = Math.random();

        // Empty space chance increases with depth
        const emptyChance = 0.02 + Math.min(0.15, depth / 30000);
        if (roll < emptyChance) {
            return TILE.EMPTY;
        }

        // Mineral chance
        const mineralChance = 0.15 + Math.min(0.15, depth / 20000);
        if (roll < emptyChance + mineralChance) {
            return rollMineral(depth);
        }

        // Rock chance increases with depth
        const rockChance = 0.2 + Math.min(0.2, depth / 15000);
        if (roll < emptyChance + mineralChance + rockChance) {
            return TILE.ROCK;
        }

        return TILE.DIRT;
    }

    function rollMineral(depth) {
        const available = MINERALS.filter(m => depth >= m.minDepth);
        if (available.length === 0) return TILE.DIRT;

        // Weight toward cheaper minerals at shallow depths
        const weights = available.map(m => {
            const depthFactor = Math.max(0.1, 1 - (depth - m.minDepth) / 2000);
            return 1 / (m.value * depthFactor);
        });

        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let roll = Math.random() * totalWeight;

        for (let i = 0; i < available.length; i++) {
            roll -= weights[i];
            if (roll <= 0) {
                return TILE.MINERAL_START + available[i].id;
            }
        }

        return TILE.MINERAL_START + available[0].id;
    }

    function getMineralByTile(tileType) {
        if (tileType < TILE.MINERAL_START) return null;
        const id = tileType - TILE.MINERAL_START;
        return MINERALS.find(m => m.id === id) || null;
    }

    function getTile(tx, ty) {
        if (tx < 0 || tx >= WORLD_WIDTH || ty < 0 || ty >= WORLD_HEIGHT) {
            return TILE.ROCK; // Boundary is solid
        }
        return world[ty][tx];
    }

    function setTile(tx, ty, type) {
        if (tx >= 0 && tx < WORLD_WIDTH && ty >= 0 && ty < WORLD_HEIGHT) {
            world[ty][tx] = type;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PLAYER CLASS
    // ═══════════════════════════════════════════════════════════════════════════
    class Player {
        constructor() {
            // Position (world coordinates, center of pod)
            this.x = WORLD_WIDTH * TILE_SIZE / 2;
            this.y = 1.5 * TILE_SIZE;
            this.vx = 0;
            this.vy = 0;

            // Stats
            this.fuel = START_FUEL;
            this.maxFuel = START_FUEL;
            this.hull = START_HULL;
            this.maxHull = START_HULL;
            this.cargoCapacity = START_CARGO;
            this.drillSpeed = START_DRILL_SPEED;

            // Inventory
            this.cargo = [];
            this.cash = 0;

            // State
            this.drilling = false;
            this.drillProgress = 0;
            this.drillTarget = null;
            this.drillDirection = null;
            this.grounded = false;

            // Upgrades (tier 0-6)
            this.upgrades = {
                drill: 0,
                hull: 0,
                engine: 0,
                fuel: 0,
                cargo: 0
            };
        }

        get cargoWeight() {
            return this.cargo.reduce((sum, m) => sum + m.weight, 0);
        }

        update(dt) {
            if (this.drilling) {
                this.updateDrilling(dt);
                return;
            }

            // Input
            const left = activeKeys.has('a') || activeKeys.has('A') || activeKeys.has('ArrowLeft');
            const right = activeKeys.has('d') || activeKeys.has('D') || activeKeys.has('ArrowRight');
            const up = activeKeys.has('w') || activeKeys.has('W') || activeKeys.has('ArrowUp');
            const down = activeKeys.has('s') || activeKeys.has('S') || activeKeys.has('ArrowDown');

            // Check for drilling
            if (down && this.grounded) {
                this.tryDrill(0, 1);
                if (this.drilling) return;
            }
            if (left) {
                const tile = this.getTileAt(-1, 0);
                if (tile !== TILE.EMPTY && this.grounded) {
                    this.tryDrill(-1, 0);
                    if (this.drilling) return;
                }
            }
            if (right) {
                const tile = this.getTileAt(1, 0);
                if (tile !== TILE.EMPTY && this.grounded) {
                    this.tryDrill(1, 0);
                    if (this.drilling) return;
                }
            }

            // Horizontal movement (only when not drilling into something)
            this.vx = 0;
            if (left && this.getTileAt(-1, 0) === TILE.EMPTY) {
                this.vx = -MOVE_SPEED;
            }
            if (right && this.getTileAt(1, 0) === TILE.EMPTY) {
                this.vx = MOVE_SPEED;
            }

            // Vertical movement
            if (up && this.fuel > 0) {
                this.vy -= THRUST * dt;
                this.fuel -= dt * 0.5; // Fuel consumption
                if (this.fuel < 0) this.fuel = 0;
            }

            // Gravity
            this.vy += GRAVITY * dt;

            // Apply velocity
            this.x += this.vx * dt;
            this.y += this.vy * dt;

            // Collision detection
            this.handleCollisions();

            // Track max depth
            const depth = getDepth(this.y);
            if (depth > stats.maxDepth) {
                stats.maxDepth = depth;
            }

            // Check shop interactions
            this.checkShopInteraction();
        }

        getTileAt(dx, dy) {
            const tile = worldToTile(this.x, this.y + PLAYER_HEIGHT / 2);
            return getTile(tile.x + dx, tile.y + dy);
        }

        tryDrill(dx, dy) {
            const tile = worldToTile(this.x, this.y + PLAYER_HEIGHT / 2);
            const targetX = tile.x + dx;
            const targetY = tile.y + dy;
            const targetTile = getTile(targetX, targetY);

            // Can't drill empty, or certain rocks
            if (targetTile === TILE.EMPTY) return;

            this.drilling = true;
            this.drillProgress = 0;
            this.drillTarget = { x: targetX, y: targetY };
            this.drillDirection = { dx, dy };
        }

        updateDrilling(dt) {
            const drillTime = DRILL_TIME / this.drillSpeed;
            const tile = getTile(this.drillTarget.x, this.drillTarget.y);

            // Rock takes longer
            const timeMultiplier = tile === TILE.ROCK ? 2 : 1;

            this.drillProgress += dt / (drillTime * timeMultiplier);

            if (this.drillProgress >= 1) {
                // Complete drill
                const mineral = getMineralByTile(tile);
                if (mineral) {
                    if (this.cargoWeight + mineral.weight <= this.cargoCapacity) {
                        this.cargo.push({ ...mineral });
                        stats.mineralsCollected++;

                        floatingTexts.push({
                            x: this.x,
                            y: this.y - 20,
                            text: `+${mineral.name}`,
                            color: mineral.color,
                            life: 1.0
                        });
                    } else {
                        floatingTexts.push({
                            x: this.x,
                            y: this.y - 20,
                            text: 'CARGO FULL',
                            color: '#FF0000',
                            life: 1.0
                        });
                    }
                }

                // Clear the tile
                setTile(this.drillTarget.x, this.drillTarget.y, TILE.EMPTY);

                // Move into the drilled space (if drilling down or sideways)
                if (this.drillDirection.dy > 0) {
                    // Drilling down - fall into space
                    this.y += TILE_SIZE;
                } else if (this.drillDirection.dx !== 0) {
                    // Drilling sideways - move into space
                    this.x += this.drillDirection.dx * TILE_SIZE;
                }

                this.drilling = false;
                this.drillTarget = null;
            }
        }

        handleCollisions() {
            const halfW = PLAYER_WIDTH / 2;
            const halfH = PLAYER_HEIGHT / 2;

            // Check grounded
            this.grounded = false;
            const footTile = worldToTile(this.x, this.y + halfH + 1);
            if (getTile(footTile.x, footTile.y) !== TILE.EMPTY) {
                this.grounded = true;
            }

            // Bottom collision
            const bottomTile = worldToTile(this.x, this.y + halfH);
            if (getTile(bottomTile.x, bottomTile.y) !== TILE.EMPTY && this.vy > 0) {
                this.y = bottomTile.y * TILE_SIZE - halfH;
                // Fall damage
                if (this.vy > 400) {
                    const damage = Math.floor((this.vy - 400) / 100);
                    this.hull -= damage;
                    floatingTexts.push({
                        x: this.x,
                        y: this.y - 30,
                        text: `-${damage} HP`,
                        color: COLORS.fuel,
                        life: 0.8
                    });
                }
                this.vy = 0;
                this.grounded = true;
            }

            // Top collision
            const topTile = worldToTile(this.x, this.y - halfH);
            if (getTile(topTile.x, topTile.y) !== TILE.EMPTY && this.vy < 0) {
                this.y = (topTile.y + 1) * TILE_SIZE + halfH;
                this.vy = 0;
            }

            // Left collision
            const leftTile = worldToTile(this.x - halfW, this.y);
            if (getTile(leftTile.x, leftTile.y) !== TILE.EMPTY) {
                this.x = (leftTile.x + 1) * TILE_SIZE + halfW;
                this.vx = 0;
            }

            // Right collision
            const rightTile = worldToTile(this.x + halfW, this.y);
            if (getTile(rightTile.x, rightTile.y) !== TILE.EMPTY) {
                this.x = rightTile.x * TILE_SIZE - halfW;
                this.vx = 0;
            }

            // World bounds
            this.x = clamp(this.x, halfW, WORLD_WIDTH * TILE_SIZE - halfW);
            this.y = clamp(this.y, halfH, WORLD_HEIGHT * TILE_SIZE - halfH);

            // Death check
            if (this.hull <= 0) {
                gameState = 'gameover';
            }
        }

        checkShopInteraction() {
            if (this.y > 2 * TILE_SIZE) return; // Must be on surface

            const tile = worldToTile(this.x, this.y);

            // Fuel Station (tiles 2-6)
            if (tile.x >= 2 && tile.x <= 6) {
                currentShop = 'fuel';
            }
            // Mineral Processor (tiles 12-16)
            else if (tile.x >= 12 && tile.x <= 16) {
                currentShop = 'processor';
            }
            // Upgrade Shop (tiles 22-26)
            else if (tile.x >= 22 && tile.x <= 26) {
                currentShop = 'upgrades';
            }
            // Repair Shop (tiles 32-36)
            else if (tile.x >= 32 && tile.x <= 36) {
                currentShop = 'repair';
            }
            else {
                currentShop = null;
            }
        }

        render(ctx) {
            const screen = worldToScreen(this.x, this.y);

            // Pod body
            ctx.fillStyle = COLORS.player;
            ctx.fillRect(
                screen.x - PLAYER_WIDTH / 2,
                screen.y - PLAYER_HEIGHT / 2,
                PLAYER_WIDTH,
                PLAYER_HEIGHT
            );

            // Cockpit
            ctx.fillStyle = COLORS.playerCockpit;
            ctx.fillRect(
                screen.x - 6,
                screen.y - PLAYER_HEIGHT / 2 + 2,
                12,
                8
            );

            // Drill bit (bottom)
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.moveTo(screen.x - 4, screen.y + PLAYER_HEIGHT / 2);
            ctx.lineTo(screen.x + 4, screen.y + PLAYER_HEIGHT / 2);
            ctx.lineTo(screen.x, screen.y + PLAYER_HEIGHT / 2 + 6);
            ctx.closePath();
            ctx.fill();

            // Drilling progress indicator
            if (this.drilling) {
                const targetWorld = tileToWorld(this.drillTarget.x, this.drillTarget.y);
                const targetScreen = worldToScreen(
                    targetWorld.x + TILE_SIZE / 2,
                    targetWorld.y + TILE_SIZE / 2
                );

                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(targetScreen.x, targetScreen.y, 10, 0, Math.PI * 2 * this.drillProgress);
                ctx.stroke();
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHOP FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    function handleShopAction() {
        if (!currentShop || !player) return;

        switch (currentShop) {
            case 'fuel':
                buyFuel();
                break;
            case 'processor':
                sellMinerals();
                break;
            case 'upgrades':
                buyUpgrade();
                break;
            case 'repair':
                repairHull();
                break;
        }
    }

    function buyFuel() {
        const needed = player.maxFuel - player.fuel;
        const cost = Math.ceil(needed * 2); // $2 per liter

        if (player.cash >= cost && needed > 0) {
            player.cash -= cost;
            player.fuel = player.maxFuel;
            floatingTexts.push({
                x: player.x,
                y: player.y - 30,
                text: `Fuel +${needed.toFixed(1)}L`,
                color: COLORS.fuel,
                life: 1.0
            });
        }
    }

    function sellMinerals() {
        if (player.cargo.length === 0) return;

        let total = 0;
        for (const mineral of player.cargo) {
            total += mineral.value;
        }

        player.cash += total;
        stats.goldEarned += total;

        floatingTexts.push({
            x: player.x,
            y: player.y - 30,
            text: `+$${total}`,
            color: COLORS.cargo,
            life: 1.5
        });

        player.cargo = [];
    }

    function buyUpgrade() {
        // Simple upgrade system - cycle through upgrades
        const upgradePrices = [750, 2000, 5000, 20000, 100000, 500000];

        // Try to upgrade drill first
        if (player.upgrades.drill < 6) {
            const price = upgradePrices[player.upgrades.drill];
            if (player.cash >= price) {
                player.cash -= price;
                player.upgrades.drill++;
                player.drillSpeed = 1 + player.upgrades.drill * 0.4;
                floatingTexts.push({
                    x: player.x,
                    y: player.y - 30,
                    text: `Drill Upgraded!`,
                    color: '#00FF00',
                    life: 1.0
                });
                return;
            }
        }

        // Then cargo
        if (player.upgrades.cargo < 5) {
            const price = upgradePrices[player.upgrades.cargo];
            if (player.cash >= price) {
                player.cash -= price;
                player.upgrades.cargo++;
                const cargoValues = [7, 15, 25, 40, 70, 120];
                player.cargoCapacity = cargoValues[player.upgrades.cargo];
                floatingTexts.push({
                    x: player.x,
                    y: player.y - 30,
                    text: `Cargo Upgraded!`,
                    color: '#00FF00',
                    life: 1.0
                });
                return;
            }
        }

        // Then fuel
        if (player.upgrades.fuel < 6) {
            const price = upgradePrices[player.upgrades.fuel];
            if (player.cash >= price) {
                player.cash -= price;
                player.upgrades.fuel++;
                const fuelValues = [10, 15, 25, 40, 60, 100, 150];
                player.maxFuel = fuelValues[player.upgrades.fuel];
                player.fuel = player.maxFuel;
                floatingTexts.push({
                    x: player.x,
                    y: player.y - 30,
                    text: `Fuel Tank Upgraded!`,
                    color: '#00FF00',
                    life: 1.0
                });
                return;
            }
        }
    }

    function repairHull() {
        const needed = player.maxHull - player.hull;
        const cost = Math.ceil(needed * 15);

        if (player.cash >= cost && needed > 0) {
            player.cash -= cost;
            player.hull = player.maxHull;
            floatingTexts.push({
                x: player.x,
                y: player.y - 30,
                text: `Hull Repaired!`,
                color: COLORS.hull,
                life: 1.0
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    function init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');

        document.addEventListener('keydown', (e) => {
            keysDown[e.key] = true;
            if (!gamePaused) {
                activeKeys.add(e.key);
            }

            // Shop interaction
            if (e.key === 'Enter' && gameState === 'playing') {
                handleShopAction();
            }
        });

        document.addEventListener('keyup', (e) => {
            keysDown[e.key] = false;
            activeKeys.delete(e.key);
        });

        requestAnimationFrame(gameLoop);

        console.log('[HARNESS] Motherload harness initialized, game paused');
    }

    function startGame() {
        generateWorld();
        player = new Player();
        stats = {
            mineralsCollected: 0,
            goldEarned: 0,
            maxDepth: 0
        };
        floatingTexts = [];
        currentShop = null;
        gameState = 'playing';
    }

    function updateCamera() {
        if (!player) return;

        // Center on player, with offset to show more below
        const targetX = player.x - CANVAS_WIDTH / 2;
        const targetY = player.y - CANVAS_HEIGHT / 3;

        camera.x = lerp(camera.x, targetX, 0.1);
        camera.y = lerp(camera.y, targetY, 0.1);

        // Clamp to world bounds
        camera.x = clamp(camera.x, 0, WORLD_WIDTH * TILE_SIZE - CANVAS_WIDTH);
        camera.y = clamp(camera.y, -100, WORLD_HEIGHT * TILE_SIZE - CANVAS_HEIGHT);
    }

    function update(dt) {
        if (gameState !== 'playing') return;

        if (player) {
            player.update(dt);
        }

        // Update floating texts
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            floatingTexts[i].life -= dt;
            floatingTexts[i].y -= 30 * dt;
            if (floatingTexts[i].life <= 0) {
                floatingTexts.splice(i, 1);
            }
        }

        updateCamera();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDERING
    // ═══════════════════════════════════════════════════════════════════════════
    function render() {
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.3, '#CD853F');
        gradient.addColorStop(1, COLORS.empty);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (gameState === 'menu') {
            renderMenu();
            return;
        }

        if (gameState === 'gameover') {
            renderWorld();
            renderGameOver();
            return;
        }

        renderWorld();
        renderBuildings();
        if (player) {
            player.render(ctx);
        }
        renderFloatingTexts();
        renderHUD();
        renderShopUI();
    }

    function renderWorld() {
        // Calculate visible tile range
        const startTileX = Math.floor(camera.x / TILE_SIZE);
        const startTileY = Math.floor(camera.y / TILE_SIZE);
        const endTileX = Math.ceil((camera.x + CANVAS_WIDTH) / TILE_SIZE);
        const endTileY = Math.ceil((camera.y + CANVAS_HEIGHT) / TILE_SIZE);

        for (let ty = startTileY; ty <= endTileY; ty++) {
            for (let tx = startTileX; tx <= endTileX; tx++) {
                const tile = getTile(tx, ty);
                if (tile === TILE.EMPTY) continue;

                const worldPos = tileToWorld(tx, ty);
                const screenPos = worldToScreen(worldPos.x, worldPos.y);

                if (tile === TILE.DIRT) {
                    ctx.fillStyle = COLORS.dirt;
                } else if (tile === TILE.ROCK) {
                    ctx.fillStyle = COLORS.rock;
                } else if (tile >= TILE.MINERAL_START) {
                    const mineral = getMineralByTile(tile);
                    ctx.fillStyle = mineral ? mineral.color : COLORS.dirt;
                }

                ctx.fillRect(screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);

                // Tile borders for depth
                if (tile !== TILE.EMPTY) {
                    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                    ctx.strokeRect(screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    function renderBuildings() {
        // Only render if surface is visible
        if (camera.y > 100) return;

        const buildings = [
            { start: 2, end: 6, name: 'FUEL', color: COLORS.fuel },
            { start: 12, end: 16, name: 'SELL', color: COLORS.cargo },
            { start: 22, end: 26, name: 'UPGRADE', color: '#00FF00' },
            { start: 32, end: 36, name: 'REPAIR', color: COLORS.hull }
        ];

        for (const b of buildings) {
            const worldX = b.start * TILE_SIZE;
            const worldY = -40; // Above surface
            const screen = worldToScreen(worldX, worldY);
            const width = (b.end - b.start + 1) * TILE_SIZE;

            // Building
            ctx.fillStyle = COLORS.building;
            ctx.fillRect(screen.x, screen.y, width, 40);

            // Highlight
            ctx.fillStyle = COLORS.buildingHighlight;
            ctx.fillRect(screen.x + 5, screen.y + 5, width - 10, 10);

            // Label
            ctx.fillStyle = b.color;
            ctx.font = 'bold 12px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(b.name, screen.x + width / 2, screen.y + 30);
        }
    }

    function renderFloatingTexts() {
        for (const ft of floatingTexts) {
            const screen = worldToScreen(ft.x, ft.y);
            ctx.fillStyle = ft.color;
            ctx.globalAlpha = ft.life;
            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, screen.x, screen.y);
            ctx.globalAlpha = 1;
        }
    }

    function renderHUD() {
        const padding = 10;
        const barWidth = 150;
        const barHeight = 16;

        // Top bar background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, 50);

        // Depth
        const depth = player ? Math.floor(getDepth(player.y)) : 0;
        ctx.fillStyle = '#FFF';
        ctx.font = '14px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText(`DEPTH: -${depth} ft`, padding, 20);

        // Cash
        ctx.fillText(`CASH: $${player ? player.cash : 0}`, padding + 150, 20);

        // Score
        ctx.fillText(`EARNED: $${stats.goldEarned}`, padding + 300, 20);

        // Bottom bar background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);

        if (!player) return;

        // Fuel bar
        const fuelPercent = player.fuel / player.maxFuel;
        ctx.fillStyle = '#333';
        ctx.fillRect(padding, CANVAS_HEIGHT - 50, barWidth, barHeight);
        ctx.fillStyle = fuelPercent < 0.2 ? '#FF0000' : COLORS.fuel;
        ctx.fillRect(padding, CANVAS_HEIGHT - 50, barWidth * fuelPercent, barHeight);
        ctx.strokeStyle = '#FFF';
        ctx.strokeRect(padding, CANVAS_HEIGHT - 50, barWidth, barHeight);
        ctx.fillStyle = '#FFF';
        ctx.font = '12px Courier New';
        ctx.fillText(`FUEL: ${player.fuel.toFixed(1)}/${player.maxFuel}`, padding + 5, CANVAS_HEIGHT - 38);

        // Hull bar
        const hullPercent = player.hull / player.maxHull;
        ctx.fillStyle = '#333';
        ctx.fillRect(padding + 170, CANVAS_HEIGHT - 50, barWidth, barHeight);
        ctx.fillStyle = hullPercent < 0.25 ? '#FF0000' : COLORS.hull;
        ctx.fillRect(padding + 170, CANVAS_HEIGHT - 50, barWidth * hullPercent, barHeight);
        ctx.strokeStyle = '#FFF';
        ctx.strokeRect(padding + 170, CANVAS_HEIGHT - 50, barWidth, barHeight);
        ctx.fillText(`HULL: ${player.hull}/${player.maxHull}`, padding + 175, CANVAS_HEIGHT - 38);

        // Cargo bar
        const cargoPercent = player.cargoWeight / player.cargoCapacity;
        ctx.fillStyle = '#333';
        ctx.fillRect(padding + 340, CANVAS_HEIGHT - 50, barWidth, barHeight);
        ctx.fillStyle = cargoPercent >= 1 ? '#FF0000' : COLORS.cargo;
        ctx.fillRect(padding + 340, CANVAS_HEIGHT - 50, barWidth * Math.min(1, cargoPercent), barHeight);
        ctx.strokeStyle = '#FFF';
        ctx.strokeRect(padding + 340, CANVAS_HEIGHT - 50, barWidth, barHeight);
        ctx.fillText(`CARGO: ${player.cargoWeight}/${player.cargoCapacity}`, padding + 345, CANVAS_HEIGHT - 38);

        // Cargo contents
        if (player.cargo.length > 0) {
            const cargoStr = player.cargo.map(m => m.name.substring(0, 2)).join(' ');
            ctx.fillText(`Items: ${cargoStr}`, padding, CANVAS_HEIGHT - 15);
        }

        // Controls hint
        ctx.fillStyle = '#888';
        ctx.textAlign = 'right';
        ctx.fillText('Arrows: Move/Drill | Enter: Shop Action', CANVAS_WIDTH - padding, CANVAS_HEIGHT - 15);
    }

    function renderShopUI() {
        if (!currentShop) return;

        const boxWidth = 250;
        const boxHeight = 100;
        const boxX = CANVAS_WIDTH / 2 - boxWidth / 2;
        const boxY = 60;

        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = '#FFD700';
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px Courier New';
        ctx.textAlign = 'center';

        switch (currentShop) {
            case 'fuel':
                ctx.fillText('FUEL STATION', boxX + boxWidth / 2, boxY + 25);
                const fuelNeeded = player.maxFuel - player.fuel;
                const fuelCost = Math.ceil(fuelNeeded * 2);
                ctx.font = '14px Courier New';
                ctx.fillText(`Need: ${fuelNeeded.toFixed(1)}L`, boxX + boxWidth / 2, boxY + 50);
                ctx.fillText(`Cost: $${fuelCost}`, boxX + boxWidth / 2, boxY + 70);
                ctx.fillStyle = '#FFD700';
                ctx.fillText('Press ENTER to buy', boxX + boxWidth / 2, boxY + 90);
                break;

            case 'processor':
                ctx.fillText('MINERAL PROCESSOR', boxX + boxWidth / 2, boxY + 25);
                let cargoValue = player.cargo.reduce((sum, m) => sum + m.value, 0);
                ctx.font = '14px Courier New';
                ctx.fillText(`Cargo: ${player.cargo.length} items`, boxX + boxWidth / 2, boxY + 50);
                ctx.fillText(`Value: $${cargoValue}`, boxX + boxWidth / 2, boxY + 70);
                ctx.fillStyle = '#FFD700';
                ctx.fillText('Press ENTER to sell all', boxX + boxWidth / 2, boxY + 90);
                break;

            case 'upgrades':
                ctx.fillText('UPGRADE SHOP', boxX + boxWidth / 2, boxY + 25);
                ctx.font = '14px Courier New';
                ctx.fillText(`Drill: Lv${player.upgrades.drill}`, boxX + boxWidth / 2, boxY + 50);
                ctx.fillText(`Cargo: Lv${player.upgrades.cargo} | Fuel: Lv${player.upgrades.fuel}`, boxX + boxWidth / 2, boxY + 70);
                ctx.fillStyle = '#FFD700';
                ctx.fillText('Press ENTER to upgrade', boxX + boxWidth / 2, boxY + 90);
                break;

            case 'repair':
                ctx.fillText('REPAIR SHOP', boxX + boxWidth / 2, boxY + 25);
                const hullNeeded = player.maxHull - player.hull;
                const repairCost = Math.ceil(hullNeeded * 15);
                ctx.font = '14px Courier New';
                ctx.fillText(`Damage: ${hullNeeded} HP`, boxX + boxWidth / 2, boxY + 50);
                ctx.fillText(`Cost: $${repairCost}`, boxX + boxWidth / 2, boxY + 70);
                ctx.fillStyle = '#FFD700';
                ctx.fillText('Press ENTER to repair', boxX + boxWidth / 2, boxY + 90);
                break;
        }
    }

    function renderMenu() {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('MOTHERLOAD', CANVAS_WIDTH / 2, 150);

        ctx.fillStyle = '#CD853F';
        ctx.font = '20px Courier New';
        ctx.fillText('Mars Mining Simulator', CANVAS_WIDTH / 2, 200);

        ctx.fillStyle = '#FFF';
        ctx.font = '16px Courier New';
        ctx.fillText('CONTROLS:', CANVAS_WIDTH / 2, 280);
        ctx.fillText('Arrow Keys / WASD - Move & Drill', CANVAS_WIDTH / 2, 310);
        ctx.fillText('UP = Fly (uses fuel)', CANVAS_WIDTH / 2, 340);
        ctx.fillText('DOWN/LEFT/RIGHT = Drill', CANVAS_WIDTH / 2, 370);
        ctx.fillText('ENTER = Shop Action', CANVAS_WIDTH / 2, 400);

        ctx.fillStyle = '#FFD700';
        ctx.fillText('Collect minerals, return to surface,', CANVAS_WIDTH / 2, 460);
        ctx.fillText('sell them, and dig deeper!', CANVAS_WIDTH / 2, 490);

        ctx.fillStyle = '#FFF';
        ctx.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, 550);

        if (keysDown['Enter']) {
            startGame();
        }
    }

    function renderGameOver() {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#E53E3E';
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 200);

        ctx.fillStyle = '#FFF';
        ctx.font = '24px Courier New';
        ctx.fillText(`Max Depth: -${Math.floor(stats.maxDepth)} ft`, CANVAS_WIDTH / 2, 280);
        ctx.fillText(`Minerals Collected: ${stats.mineralsCollected}`, CANVAS_WIDTH / 2, 320);
        ctx.fillText(`Total Earned: $${stats.goldEarned}`, CANVAS_WIDTH / 2, 360);

        ctx.font = '18px Courier New';
        ctx.fillText('Press ENTER to Try Again', CANVAS_WIDTH / 2, 450);

        if (keysDown['Enter']) {
            startGame();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME LOOP
    // ═══════════════════════════════════════════════════════════════════════════
    function gameLoop(timestamp) {
        deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;

        if (!gamePaused) {
            update(deltaTime);
        }

        render();

        requestAnimationFrame(gameLoop);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HARNESS INTERFACE
    // ═══════════════════════════════════════════════════════════════════════════
    function releaseAllKeys() {
        activeKeys.clear();
        for (const key in keysDown) {
            keysDown[key] = false;
        }
    }

    window.harness = {
        pause: () => {
            gamePaused = true;
            releaseAllKeys();
        },

        resume: () => {
            gamePaused = false;
        },

        isPaused: () => gamePaused,

        execute: (action, durationMs) => {
            return new Promise((resolve) => {
                if (action.keys) {
                    for (const key of action.keys) {
                        activeKeys.add(key);
                        keysDown[key] = true;
                    }
                }

                gamePaused = false;

                setTimeout(() => {
                    releaseAllKeys();
                    gamePaused = true;
                    resolve();
                }, durationMs);
            });
        },

        getState: () => {
            return {
                gameState: gameState,
                currentShop: currentShop,
                stats: { ...stats },
                player: player ? {
                    x: player.x,
                    y: player.y,
                    depth: getDepth(player.y),
                    fuel: player.fuel,
                    maxFuel: player.maxFuel,
                    hull: player.hull,
                    maxHull: player.maxHull,
                    cash: player.cash,
                    cargoWeight: player.cargoWeight,
                    cargoCapacity: player.cargoCapacity,
                    cargoCount: player.cargo.length,
                    drilling: player.drilling,
                    grounded: player.grounded,
                    upgrades: { ...player.upgrades }
                } : null
            };
        },

        getPhase: () => gameState,

        debug: {
            setFuel: (amount) => { if (player) player.fuel = amount; },
            setHull: (amount) => { if (player) player.hull = amount; },
            addCash: (amount) => { if (player) player.cash += amount; },
            forceStart: () => { startGame(); },
            teleportSurface: () => {
                if (player) {
                    player.x = WORLD_WIDTH * TILE_SIZE / 2;
                    player.y = 1.5 * TILE_SIZE;
                    player.vy = 0;
                }
            }
        },

        version: '1.0',

        gameInfo: {
            name: 'Motherload Clone',
            type: 'mining_resource_management',
            controls: {
                movement: ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
                action: ['Enter']
            }
        }
    };

    window.addEventListener('load', init);
})();
