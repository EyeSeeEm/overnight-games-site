// Dome Keeper Clone - Canvas Implementation with Test Harness
// Agent 2 - Night 6

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════════
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const TILE_SIZE = 16;
    const MAP_WIDTH = 80;
    const MAP_HEIGHT = 100;
    const DOME_X = 40;
    const DOME_Y = 5;

    // Timing
    const MINING_PHASE_DURATION = 45; // seconds (reduced for testing)
    const MIN_MINING_DURATION = 20;
    const DRILL_HIT_INTERVAL = 0.25;

    // Colors
    const COLORS = {
        sky: '#1a1a3e',
        domeGlass: '#87CEEB',
        domeMetal: '#4A5568',
        laserCore: '#FF6B6B',
        laserGlow: '#FFE66D',
        keeper: '#48BB78',
        keeperHighlight: '#68D391',
        iron: '#B87333',
        water: '#4A90D9',
        cobalt: '#8B5CF6',
        uiBackground: '#1A202C',
        uiText: '#F7FAFC',
        healthBar: '#48BB78',
        healthBarDamage: '#E53E3E',
        enemy: '#E53E3E',
        enemyDark: '#C53030'
    };

    // Rock types - increased drop chances for better resource gathering
    const ROCK_TYPES = {
        air: { hp: 0, color: '#2D3748', name: 'Air' },
        dirt: { hp: 2, color: '#8B4513', name: 'Dirt', dropChance: 0.15, drops: ['iron'] },
        softStone: { hp: 4, color: '#A9A9A9', name: 'Soft Stone', dropChance: 0.4, drops: ['iron'] },
        hardStone: { hp: 8, color: '#696969', name: 'Hard Stone', dropChance: 0.5, drops: ['iron', 'water'] },
        denseRock: { hp: 12, color: '#4A4A4A', name: 'Dense Rock', dropChance: 0.6, drops: ['iron', 'water'] },
        crystalRock: { hp: 16, color: '#4169E1', name: 'Crystal Rock', dropChance: 0.6, drops: ['cobalt'] },
        ironOre: { hp: 6, color: '#B87333', name: 'Iron Ore', dropChance: 1.0, drops: ['iron'], yield: [2, 4] },
        waterCrystal: { hp: 5, color: '#4A90D9', name: 'Water Crystal', dropChance: 1.0, drops: ['water'], yield: [1, 3] },
        cobaltOre: { hp: 7, color: '#8B5CF6', name: 'Cobalt Ore', dropChance: 1.0, drops: ['cobalt'], yield: [1, 2] },
        bedrock: { hp: 9999, color: '#1a1a1a', name: 'Bedrock' }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME STATE
    // ═══════════════════════════════════════════════════════════════════════════
    let canvas, ctx;
    let gamePaused = new URLSearchParams(location.search).has('test');
    let gameState = 'menu'; // 'menu', 'playing', 'gameover', 'victory'
    let lastTime = 0;
    let deltaTime = 0;

    // Input
    let keysDown = {};
    let activeKeys = new Set();
    let mouse = { x: 0, y: 0, down: false };

    // Camera
    let camera = { x: 0, y: 0 };

    // Game objects
    let map = [];
    let keeper = null;
    let dome = null;
    let enemies = [];
    let projectiles = [];
    let floatingTexts = [];
    let particles = [];

    // Game phase
    let phase = 'mining'; // 'mining', 'defense'
    let phaseTimer = MINING_PHASE_DURATION;
    let waveNumber = 0;

    // Resources
    let resources = { iron: 0, water: 0, cobalt: 0 };

    // Upgrades
    let upgrades = {
        drillSpeed: 0,
        drillStrength: 0,
        moveSpeed: 0,
        carryCapacity: 0,
        laserDamage: 0,
        laserSpeed: 0,
        domeHealth: 0
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    function randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function tileToWorld(tileX, tileY) {
        return {
            x: tileX * TILE_SIZE + TILE_SIZE / 2,
            y: tileY * TILE_SIZE + TILE_SIZE / 2
        };
    }

    function worldToTile(worldX, worldY) {
        return {
            x: Math.floor(worldX / TILE_SIZE),
            y: Math.floor(worldY / TILE_SIZE)
        };
    }

    function screenToWorld(screenX, screenY) {
        return {
            x: screenX + camera.x,
            y: screenY + camera.y
        };
    }

    function worldToScreen(worldX, worldY) {
        return {
            x: worldX - camera.x,
            y: worldY - camera.y
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MAP GENERATION
    // ═══════════════════════════════════════════════════════════════════════════
    function generateMap() {
        map = [];

        for (let y = 0; y < MAP_HEIGHT; y++) {
            map[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                map[y][x] = generateTile(x, y);
            }
        }

        // Clear area around dome
        const domeRadius = 4;
        for (let dy = -domeRadius; dy <= domeRadius; dy++) {
            for (let dx = -domeRadius; dx <= domeRadius; dx++) {
                const tx = DOME_X + dx;
                const ty = DOME_Y + dy;
                if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
                    if (dy <= 0) {
                        map[ty][tx] = { type: 'air', hp: 0 };
                    }
                }
            }
        }

        // Clear starting tunnel - deeper and wider for easier navigation
        for (let y = DOME_Y + 1; y < DOME_Y + 15; y++) {
            if (y < MAP_HEIGHT) {
                map[y][DOME_X] = { type: 'air', hp: 0 };
                map[y][DOME_X - 1] = { type: 'air', hp: 0 };
                map[y][DOME_X + 1] = { type: 'air', hp: 0 };
                map[y][DOME_X - 2] = { type: 'air', hp: 0 };
                map[y][DOME_X + 2] = { type: 'air', hp: 0 };
            }
        }

        // Place resource clusters
        placeResourceClusters();

        // Place bedrock boundaries
        for (let y = 0; y < MAP_HEIGHT; y++) {
            map[y][0] = { type: 'bedrock', hp: 9999 };
            map[y][MAP_WIDTH - 1] = { type: 'bedrock', hp: 9999 };
        }
        for (let x = 0; x < MAP_WIDTH; x++) {
            map[MAP_HEIGHT - 1][x] = { type: 'bedrock', hp: 9999 };
        }
    }

    function generateTile(x, y) {
        // Sky/air above ground
        if (y < 5) {
            return { type: 'air', hp: 0 };
        }

        const depth = y - 5;
        const depthPercent = depth / (MAP_HEIGHT - 5);
        const noise = Math.random();

        let type;

        // Depth-based rock selection
        if (depthPercent < 0.2) {
            type = noise < 0.7 ? 'dirt' : 'softStone';
        } else if (depthPercent < 0.4) {
            type = noise < 0.3 ? 'dirt' : noise < 0.7 ? 'softStone' : 'hardStone';
        } else if (depthPercent < 0.6) {
            type = noise < 0.2 ? 'softStone' : noise < 0.6 ? 'hardStone' : 'denseRock';
        } else if (depthPercent < 0.8) {
            type = noise < 0.3 ? 'hardStone' : noise < 0.7 ? 'denseRock' : 'crystalRock';
        } else {
            type = noise < 0.4 ? 'denseRock' : 'crystalRock';
        }

        const rockType = ROCK_TYPES[type];
        return {
            type: type,
            hp: rockType.hp,
            maxHp: rockType.hp
        };
    }

    function placeResourceClusters() {
        // Iron clusters (common, all depths)
        for (let i = 0; i < 40; i++) {
            const cx = randomInt(5, MAP_WIDTH - 5);
            const cy = randomInt(10, MAP_HEIGHT - 10);
            placeCluster(cx, cy, 'ironOre', randomInt(3, 6));
        }

        // Water clusters (medium, deeper)
        for (let i = 0; i < 25; i++) {
            const cx = randomInt(5, MAP_WIDTH - 5);
            const cy = randomInt(20, MAP_HEIGHT - 10);
            placeCluster(cx, cy, 'waterCrystal', randomInt(2, 4));
        }

        // Cobalt clusters (rare, very deep)
        for (let i = 0; i < 15; i++) {
            const cx = randomInt(5, MAP_WIDTH - 5);
            const cy = randomInt(40, MAP_HEIGHT - 10);
            placeCluster(cx, cy, 'cobaltOre', randomInt(1, 3));
        }
    }

    function placeCluster(cx, cy, type, size) {
        const rockType = ROCK_TYPES[type];
        let placed = 0;
        const queue = [{ x: cx, y: cy }];

        while (queue.length > 0 && placed < size) {
            const pos = queue.shift();
            if (pos.x < 1 || pos.x >= MAP_WIDTH - 1 || pos.y < 6 || pos.y >= MAP_HEIGHT - 1) continue;
            if (map[pos.y][pos.x].type === 'air' || map[pos.y][pos.x].type === type) continue;

            map[pos.y][pos.x] = {
                type: type,
                hp: rockType.hp,
                maxHp: rockType.hp
            };
            placed++;

            // Add neighbors with probability
            const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
            for (const d of dirs) {
                if (Math.random() < 0.5) {
                    queue.push({ x: pos.x + d.dx, y: pos.y + d.dy });
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // KEEPER CLASS
    // ═══════════════════════════════════════════════════════════════════════════
    class Keeper {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = 20;
            this.height = 24;
            this.baseSpeed = 80;
            this.speed = this.baseSpeed;

            // Drilling
            this.drilling = false;
            this.drillTarget = null;
            this.drillTimer = 0;
            this.drillStrength = 2;

            // Carrying
            this.carrying = [];
            this.maxCarry = 5;
            this.speedLossPerResource = 8;

            // Animation
            this.facing = 'down';
            this.animFrame = 0;
            this.animTimer = 0;
        }

        update(dt) {
            // Calculate actual speed
            this.speed = this.baseSpeed + (upgrades.moveSpeed * 15) - (this.carrying.length * this.speedLossPerResource);
            this.speed = Math.max(this.speed, 20);

            // Drill strength
            this.drillStrength = 2 + (upgrades.drillStrength * 3);

            // Max carry
            this.maxCarry = 5 + (upgrades.carryCapacity * 3);

            // Movement and drilling
            let moveX = 0;
            let moveY = 0;
            let digDir = null;

            if (activeKeys.has('w') || activeKeys.has('W') || activeKeys.has('ArrowUp')) {
                moveY = -1;
                digDir = 'up';
                this.facing = 'up';
            }
            if (activeKeys.has('s') || activeKeys.has('S') || activeKeys.has('ArrowDown')) {
                moveY = 1;
                digDir = 'down';
                this.facing = 'down';
            }
            if (activeKeys.has('a') || activeKeys.has('A') || activeKeys.has('ArrowLeft')) {
                moveX = -1;
                digDir = 'left';
                this.facing = 'left';
            }
            if (activeKeys.has('d') || activeKeys.has('D') || activeKeys.has('ArrowRight')) {
                moveX = 1;
                digDir = 'right';
                this.facing = 'right';
            }

            // Check if we should dig or move
            if (digDir) {
                const targetTile = this.getAdjacentTile(digDir);
                if (targetTile && this.canDig(targetTile)) {
                    this.drill(targetTile, dt);
                } else if (targetTile && targetTile.tile.type === 'air') {
                    this.move(moveX, moveY, dt);
                }
            }

            // Animation
            if (moveX !== 0 || moveY !== 0 || this.drilling) {
                this.animTimer += dt;
                if (this.animTimer > 0.1) {
                    this.animTimer = 0;
                    this.animFrame = (this.animFrame + 1) % 4;
                }
            }

            // Auto-collect resources at feet
            this.collectResources();

            // Auto-deposit when at dome (no need to press space)
            if (this.isAtDome() && this.carrying.length > 0) {
                this.depositResources();
            }
        }

        getAdjacentTile(dir) {
            const tile = worldToTile(this.x, this.y);
            let tx = tile.x;
            let ty = tile.y;

            if (dir === 'up') ty--;
            if (dir === 'down') ty++;
            if (dir === 'left') tx--;
            if (dir === 'right') tx++;

            if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return null;

            return {
                x: tx,
                y: ty,
                tile: map[ty][tx]
            };
        }

        canDig(targetTile) {
            const tile = targetTile.tile;
            return tile.type !== 'air' && tile.type !== 'bedrock';
        }

        drill(targetTile, dt) {
            this.drilling = true;

            const drillInterval = DRILL_HIT_INTERVAL / (1 + upgrades.drillSpeed * 0.3);

            this.drillTimer += dt;
            if (this.drillTimer >= drillInterval) {
                this.drillTimer = 0;

                // Damage tile
                targetTile.tile.hp -= this.drillStrength;

                // Particle effect
                const pos = tileToWorld(targetTile.x, targetTile.y);
                for (let i = 0; i < 3; i++) {
                    particles.push({
                        x: pos.x + randomRange(-8, 8),
                        y: pos.y + randomRange(-8, 8),
                        vx: randomRange(-30, 30),
                        vy: randomRange(-50, -20),
                        color: ROCK_TYPES[targetTile.tile.type].color,
                        life: 0.3
                    });
                }

                // Tile destroyed
                if (targetTile.tile.hp <= 0) {
                    this.destroyTile(targetTile);
                }
            }
        }

        destroyTile(targetTile) {
            const oldType = targetTile.tile.type;
            const rockType = ROCK_TYPES[oldType];

            // Drop resources
            if (rockType.dropChance && Math.random() < rockType.dropChance) {
                const dropType = rockType.drops[Math.floor(Math.random() * rockType.drops.length)];
                const yield_ = rockType.yield || [1, 1];
                const amount = randomInt(yield_[0], yield_[1]);

                const pos = tileToWorld(targetTile.x, targetTile.y);
                for (let i = 0; i < amount; i++) {
                    particles.push({
                        x: pos.x + randomRange(-10, 10),
                        y: pos.y + randomRange(-10, 10),
                        vx: 0,
                        vy: 0,
                        type: 'resource',
                        resource: dropType,
                        life: 30 // Long lifetime
                    });
                }
            }

            // Clear tile
            map[targetTile.y][targetTile.x] = { type: 'air', hp: 0 };
            this.drilling = false;
        }

        move(dx, dy, dt) {
            this.drilling = false;

            const newX = this.x + dx * this.speed * dt;
            const newY = this.y + dy * this.speed * dt;

            // Collision check
            if (!this.collidesWithMap(newX, this.y)) {
                this.x = newX;
            }
            if (!this.collidesWithMap(this.x, newY)) {
                this.y = newY;
            }

            // Bounds
            this.x = clamp(this.x, TILE_SIZE, (MAP_WIDTH - 1) * TILE_SIZE);
            this.y = clamp(this.y, TILE_SIZE, (MAP_HEIGHT - 1) * TILE_SIZE);
        }

        collidesWithMap(x, y) {
            const hw = this.width / 2 - 2;
            const hh = this.height / 2 - 2;

            const corners = [
                worldToTile(x - hw, y - hh),
                worldToTile(x + hw, y - hh),
                worldToTile(x - hw, y + hh),
                worldToTile(x + hw, y + hh)
            ];

            for (const c of corners) {
                if (c.x < 0 || c.x >= MAP_WIDTH || c.y < 0 || c.y >= MAP_HEIGHT) return true;
                if (map[c.y][c.x].type !== 'air') return true;
            }

            return false;
        }

        collectResources() {
            if (this.carrying.length >= this.maxCarry) return;

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                if (p.type !== 'resource') continue;

                const dist = distance(this.x, this.y, p.x, p.y);
                if (dist < 35) { // Increased collection radius
                    this.carrying.push(p.resource);
                    particles.splice(i, 1);

                    floatingTexts.push({
                        x: this.x,
                        y: this.y - 20,
                        text: `+1 ${p.resource}`,
                        color: COLORS[p.resource],
                        life: 1
                    });

                    if (this.carrying.length >= this.maxCarry) break;
                }
            }
        }

        depositResources() {
            if (this.carrying.length === 0) return;

            for (const res of this.carrying) {
                resources[res]++;
            }

            floatingTexts.push({
                x: this.x,
                y: this.y - 30,
                text: `Deposited ${this.carrying.length} resources`,
                color: '#48BB78',
                life: 1.5
            });

            this.carrying = [];
        }

        isAtDome() {
            const domePos = tileToWorld(DOME_X, DOME_Y);
            // Increased radius for easier deposit - 80 pixels from dome center
            return distance(this.x, this.y, domePos.x, domePos.y + 40) < 80;
        }

        render(ctx) {
            const screen = worldToScreen(this.x, this.y);

            // Body
            ctx.fillStyle = COLORS.keeper;
            ctx.beginPath();
            ctx.ellipse(screen.x, screen.y + 4, 8, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.fillStyle = COLORS.keeperHighlight;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y - 6, 7, 0, Math.PI * 2);
            ctx.fill();

            // Helmet visor
            ctx.fillStyle = '#2D3748';
            ctx.beginPath();
            ctx.ellipse(screen.x, screen.y - 6, 5, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Drill (in direction of facing)
            ctx.fillStyle = '#718096';
            let drillX = screen.x;
            let drillY = screen.y;
            if (this.facing === 'down') drillY += 14;
            if (this.facing === 'up') drillY -= 14;
            if (this.facing === 'left') drillX -= 14;
            if (this.facing === 'right') drillX += 14;

            ctx.beginPath();
            ctx.arc(drillX, drillY, 4, 0, Math.PI * 2);
            ctx.fill();

            if (this.drilling) {
                ctx.fillStyle = '#ECC94B';
                ctx.beginPath();
                ctx.arc(drillX, drillY, 6 + Math.sin(this.animTimer * 40) * 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Carried resources indicator
            if (this.carrying.length > 0) {
                ctx.fillStyle = '#fff';
                ctx.font = '10px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText(`${this.carrying.length}/${this.maxCarry}`, screen.x, screen.y - 18);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DOME CLASS
    // ═══════════════════════════════════════════════════════════════════════════
    class Dome {
        constructor() {
            const pos = tileToWorld(DOME_X, DOME_Y);
            this.x = pos.x;
            this.y = pos.y;
            this.baseMaxHp = 800;
            this.maxHp = this.baseMaxHp;
            this.hp = this.maxHp;

            // Laser
            this.laserAngle = Math.PI / 2; // Pointing down
            this.laserTargetAngle = this.laserAngle;
            this.laserMoveSpeed = 2.0;
            this.laserDamage = 15;
            this.laserFiring = false;
            this.laserRange = 400;
        }

        update(dt) {
            // Update stats from upgrades
            this.maxHp = this.baseMaxHp + (upgrades.domeHealth * 200);
            this.laserDamage = 15 + (upgrades.laserDamage * 10);
            this.laserMoveSpeed = 2.0 + (upgrades.laserSpeed * 0.5);

            // Rotate laser toward mouse during defense
            if (phase === 'defense') {
                const mouseWorld = screenToWorld(mouse.x, mouse.y);
                this.laserTargetAngle = Math.atan2(mouseWorld.y - this.y, mouseWorld.x - this.x);

                // Smooth rotation
                let angleDiff = this.laserTargetAngle - this.laserAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                this.laserAngle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), this.laserMoveSpeed * dt);

                // Fire laser if mouse down
                this.laserFiring = mouse.down;

                if (this.laserFiring) {
                    this.fireLaser(dt);
                }
            } else {
                this.laserFiring = false;
            }
        }

        fireLaser(dt) {
            const endX = this.x + Math.cos(this.laserAngle) * this.laserRange;
            const endY = this.y + Math.sin(this.laserAngle) * this.laserRange;

            // Check collision with enemies
            for (const enemy of enemies) {
                if (this.lineIntersectsEnemy(this.x, this.y, endX, endY, enemy)) {
                    enemy.takeDamage(this.laserDamage * dt);
                }
            }
        }

        lineIntersectsEnemy(x1, y1, x2, y2, enemy) {
            // Simple distance to line check
            const A = x2 - x1;
            const B = y2 - y1;
            const C = enemy.x - x1;
            const D = enemy.y - y1;

            const dot = A * C + B * D;
            const lenSq = A * A + B * B;
            let param = -1;
            if (lenSq !== 0) param = dot / lenSq;

            let xx, yy;
            if (param < 0) {
                xx = x1;
                yy = y1;
            } else if (param > 1) {
                xx = x2;
                yy = y2;
            } else {
                xx = x1 + param * A;
                yy = y1 + param * B;
            }

            const dist = distance(enemy.x, enemy.y, xx, yy);
            return dist < enemy.radius + 4;
        }

        takeDamage(amount) {
            this.hp -= amount;
            if (this.hp <= 0) {
                this.hp = 0;
                gameState = 'gameover';
            }
        }

        render(ctx) {
            const screen = worldToScreen(this.x, this.y);

            // Dome base
            ctx.fillStyle = COLORS.domeMetal;
            ctx.fillRect(screen.x - 35, screen.y + 15, 70, 20);

            // Dome glass
            ctx.fillStyle = COLORS.domeGlass;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.ellipse(screen.x, screen.y, 35, 30, 0, Math.PI, 0);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Dome frame
            ctx.strokeStyle = COLORS.domeMetal;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(screen.x, screen.y, 35, 30, 0, Math.PI, 0);
            ctx.stroke();

            // Laser turret
            const turretX = screen.x;
            const turretY = screen.y - 25;

            ctx.fillStyle = '#4A5568';
            ctx.beginPath();
            ctx.arc(turretX, turretY, 8, 0, Math.PI * 2);
            ctx.fill();

            // Laser barrel
            const barrelLen = 15;
            const barrelEndX = turretX + Math.cos(this.laserAngle) * barrelLen;
            const barrelEndY = turretY + Math.sin(this.laserAngle) * barrelLen;

            ctx.strokeStyle = '#718096';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(turretX, turretY);
            ctx.lineTo(barrelEndX, barrelEndY);
            ctx.stroke();

            // Laser beam when firing
            if (this.laserFiring) {
                const beamEndX = screen.x + Math.cos(this.laserAngle) * this.laserRange;
                const beamEndY = screen.y + Math.sin(this.laserAngle) * this.laserRange;

                // Glow
                ctx.strokeStyle = COLORS.laserGlow;
                ctx.lineWidth = 8;
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.moveTo(turretX, turretY);
                ctx.lineTo(beamEndX, beamEndY);
                ctx.stroke();

                // Core
                ctx.strokeStyle = COLORS.laserCore;
                ctx.lineWidth = 3;
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.moveTo(turretX, turretY);
                ctx.lineTo(beamEndX, beamEndY);
                ctx.stroke();
            }

            // Health bar
            const hpPercent = this.hp / this.maxHp;
            ctx.fillStyle = '#2D3748';
            ctx.fillRect(screen.x - 30, screen.y + 40, 60, 8);
            ctx.fillStyle = hpPercent > 0.3 ? COLORS.healthBar : COLORS.healthBarDamage;
            ctx.fillRect(screen.x - 30, screen.y + 40, 60 * hpPercent, 8);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENEMY CLASS
    // ═══════════════════════════════════════════════════════════════════════════
    class Enemy {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.radius = 12;

            // Set stats based on type
            this.setTypeStats();

            this.stunned = false;
            this.stunTimer = 0;
            this.attackCooldown = 0;
        }

        setTypeStats() {
            switch (this.type) {
                case 'walker':
                    this.hp = 40;
                    this.maxHp = 40;
                    this.speed = 60;
                    this.damage = 12;
                    this.attackInterval = 1.0;
                    this.color = '#E53E3E';
                    break;
                case 'flyer':
                    this.hp = 20;
                    this.maxHp = 20;
                    this.speed = 80;
                    this.damage = 10;
                    this.attackInterval = 1.5;
                    this.color = '#9F7AEA';
                    this.isFlying = true;
                    break;
                case 'hornet':
                    this.hp = 100;
                    this.maxHp = 100;
                    this.speed = 50;
                    this.damage = 30;
                    this.attackInterval = 1.2;
                    this.color = '#DD6B20';
                    this.radius = 16;
                    break;
                case 'tick':
                    this.hp = 8;
                    this.maxHp = 8;
                    this.speed = 40;
                    this.damage = 15;
                    this.attackInterval = 0.8;
                    this.color = '#38A169';
                    this.radius = 8;
                    break;
                default:
                    this.hp = 30;
                    this.maxHp = 30;
                    this.speed = 50;
                    this.damage = 10;
                    this.attackInterval = 1.0;
                    this.color = COLORS.enemy;
            }
        }

        update(dt) {
            if (this.stunned) {
                this.stunTimer -= dt;
                if (this.stunTimer <= 0) this.stunned = false;
                return;
            }

            // Move toward dome
            const domePos = tileToWorld(DOME_X, DOME_Y);
            const dx = domePos.x - this.x;
            const dy = domePos.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 30) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            } else {
                // Attack dome
                this.attackCooldown -= dt;
                if (this.attackCooldown <= 0) {
                    dome.takeDamage(this.damage);
                    this.attackCooldown = this.attackInterval;

                    // Visual feedback
                    floatingTexts.push({
                        x: domePos.x + randomRange(-20, 20),
                        y: domePos.y,
                        text: `-${this.damage}`,
                        color: '#E53E3E',
                        life: 0.8
                    });
                }
            }
        }

        takeDamage(amount) {
            this.hp -= amount;
            if (this.hp <= 0) {
                this.die();
            }
        }

        die() {
            const idx = enemies.indexOf(this);
            if (idx !== -1) {
                enemies.splice(idx, 1);
            }

            // Death particles
            for (let i = 0; i < 8; i++) {
                particles.push({
                    x: this.x,
                    y: this.y,
                    vx: randomRange(-50, 50),
                    vy: randomRange(-50, 50),
                    color: this.color,
                    life: 0.5
                });
            }

            // Check if wave complete
            if (enemies.length === 0 && phase === 'defense') {
                endDefensePhase();
            }
        }

        render(ctx) {
            const screen = worldToScreen(this.x, this.y);

            // Body
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(screen.x - 4, screen.y - 3, 3, 0, Math.PI * 2);
            ctx.arc(screen.x + 4, screen.y - 3, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(screen.x - 4, screen.y - 3, 1.5, 0, Math.PI * 2);
            ctx.arc(screen.x + 4, screen.y - 3, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Health bar
            if (this.hp < this.maxHp) {
                const hpPercent = this.hp / this.maxHp;
                ctx.fillStyle = '#2D3748';
                ctx.fillRect(screen.x - 10, screen.y - this.radius - 8, 20, 4);
                ctx.fillStyle = '#48BB78';
                ctx.fillRect(screen.x - 10, screen.y - this.radius - 8, 20 * hpPercent, 4);
            }

            // Stunned indicator
            if (this.stunned) {
                ctx.fillStyle = '#ECC94B';
                ctx.font = '12px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('★', screen.x, screen.y - this.radius - 12);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WAVE SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════
    function startMiningPhase() {
        phase = 'mining';
        phaseTimer = Math.max(MIN_MINING_DURATION, MINING_PHASE_DURATION - (waveNumber * 2));
    }

    function startDefensePhase() {
        phase = 'defense';
        waveNumber++;
        spawnWave();
    }

    function endDefensePhase() {
        // Victory check
        if (waveNumber >= 10) {
            gameState = 'victory';
            return;
        }

        startMiningPhase();
    }

    function spawnWave() {
        const baseWeight = 40 + (waveNumber * 30);
        let remainingWeight = baseWeight;

        const enemyTypes = [
            { type: 'walker', weight: 20, minWave: 1 },
            { type: 'flyer', weight: 25, minWave: 2 },
            { type: 'tick', weight: 10, minWave: 3 },
            { type: 'hornet', weight: 60, minWave: 4 }
        ];

        while (remainingWeight > 0) {
            const valid = enemyTypes.filter(e => e.weight <= remainingWeight && e.minWave <= waveNumber);
            if (valid.length === 0) break;

            const selected = valid[Math.floor(Math.random() * valid.length)];

            // Spawn position (from edges of screen, near surface)
            const side = Math.floor(Math.random() * 2);
            const spawnX = side === 0 ? randomRange(50, 200) : randomRange(MAP_WIDTH * TILE_SIZE - 200, MAP_WIDTH * TILE_SIZE - 50);
            const spawnY = randomRange(20, 100);

            enemies.push(new Enemy(spawnX, spawnY, selected.type));
            remainingWeight -= selected.weight;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    function init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');

        // Input handlers
        document.addEventListener('keydown', (e) => {
            keysDown[e.key] = true;
            if (!gamePaused) {
                activeKeys.add(e.key);
            }
        });

        document.addEventListener('keyup', (e) => {
            keysDown[e.key] = false;
            activeKeys.delete(e.key);
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });

        canvas.addEventListener('mousedown', () => {
            mouse.down = true;
        });

        canvas.addEventListener('mouseup', () => {
            mouse.down = false;
        });

        // Start game loop
        requestAnimationFrame(gameLoop);

        // AUTO-START: Skip menu and start game directly
        setTimeout(() => startGame(), 100);

        console.log('[HARNESS] Dome Keeper harness initialized, game paused');
    }

    function startGame() {
        generateMap();

        // Create keeper at dome
        const startPos = tileToWorld(DOME_X, DOME_Y + 3);
        keeper = new Keeper(startPos.x, startPos.y);

        // Create dome
        dome = new Dome();

        // Reset state
        enemies = [];
        particles = [];
        floatingTexts = [];
        resources = { iron: 0, water: 0, cobalt: 0 };
        upgrades = {
            drillSpeed: 0,
            drillStrength: 0,
            moveSpeed: 0,
            carryCapacity: 0,
            laserDamage: 0,
            laserSpeed: 0,
            domeHealth: 0
        };
        waveNumber = 0;

        startMiningPhase();
        gameState = 'playing';
    }

    function updateCamera() {
        if (!keeper) return;

        // Target: center on keeper
        const targetX = keeper.x - CANVAS_WIDTH / 2;
        const targetY = keeper.y - CANVAS_HEIGHT / 2;

        // Smooth follow
        camera.x = lerp(camera.x, targetX, 0.1);
        camera.y = lerp(camera.y, targetY, 0.1);

        // Clamp to map bounds
        camera.x = clamp(camera.x, 0, MAP_WIDTH * TILE_SIZE - CANVAS_WIDTH);
        camera.y = clamp(camera.y, 0, MAP_HEIGHT * TILE_SIZE - CANVAS_HEIGHT);
    }

    function update(dt) {
        if (gameState !== 'playing') return;

        // Update phase timer
        if (phase === 'mining') {
            phaseTimer -= dt;
            if (phaseTimer <= 0) {
                startDefensePhase();
            }
        }

        // Update keeper
        if (keeper) {
            keeper.update(dt);
        }

        // Update dome
        if (dome) {
            dome.update(dt);
        }

        // Update enemies
        for (const enemy of enemies) {
            enemy.update(dt);
        }

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }

            if (p.vx !== undefined) {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 100 * dt; // Gravity
            }
        }

        // Update floating texts
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];
            ft.life -= dt;
            ft.y -= 30 * dt;
            if (ft.life <= 0) {
                floatingTexts.splice(i, 1);
            }
        }

        // Update camera
        updateCamera();

        // Handle upgrade menu
        if (keysDown['e'] && keeper && keeper.isAtDome()) {
            // Simple upgrade: spend 5 iron for random upgrade
            if (resources.iron >= 5) {
                resources.iron -= 5;
                const upgradeKeys = Object.keys(upgrades);
                const randomUpgrade = upgradeKeys[Math.floor(Math.random() * upgradeKeys.length)];
                upgrades[randomUpgrade]++;

                floatingTexts.push({
                    x: keeper.x,
                    y: keeper.y - 40,
                    text: `Upgraded ${randomUpgrade}!`,
                    color: '#ECC94B',
                    life: 2
                });
            }
        }
    }

    function render() {
        // Clear with sky color
        ctx.fillStyle = COLORS.sky;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (gameState === 'menu') {
            renderMenu();
            return;
        }

        if (gameState === 'gameover') {
            renderGameOver();
            return;
        }

        if (gameState === 'victory') {
            renderVictory();
            return;
        }

        // Render map
        renderMap();

        // Render particles (resources)
        renderParticles();

        // Render dome
        if (dome) {
            dome.render(ctx);
        }

        // Render keeper
        if (keeper) {
            keeper.render(ctx);
        }

        // Render enemies
        for (const enemy of enemies) {
            enemy.render(ctx);
        }

        // Render floating texts
        renderFloatingTexts();

        // Render UI
        renderUI();
    }

    function renderMenu() {
        ctx.fillStyle = COLORS.uiText;
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('DOME KEEPER', CANVAS_WIDTH / 2, 180);

        ctx.font = '24px Courier New';
        ctx.fillText('CLONE', CANVAS_WIDTH / 2, 220);

        ctx.font = '16px Courier New';
        ctx.fillText('WASD - Move / Dig', CANVAS_WIDTH / 2, 300);
        ctx.fillText('Mouse - Aim Laser (Defense Phase)', CANVAS_WIDTH / 2, 330);
        ctx.fillText('Click - Fire Laser', CANVAS_WIDTH / 2, 360);
        ctx.fillText('Space - Deposit Resources at Dome', CANVAS_WIDTH / 2, 390);
        ctx.fillText('E - Buy Upgrade (5 Iron)', CANVAS_WIDTH / 2, 420);

        ctx.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, 500);

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
        ctx.fillText('DOME DESTROYED', CANVAS_WIDTH / 2, 250);

        ctx.fillStyle = COLORS.uiText;
        ctx.font = '24px Courier New';
        ctx.fillText(`Waves Survived: ${waveNumber}`, CANVAS_WIDTH / 2, 320);

        ctx.font = '18px Courier New';
        ctx.fillText('Press ENTER to Restart', CANVAS_WIDTH / 2, 420);

        if (keysDown['Enter']) {
            startGame();
        }
    }

    function renderVictory() {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#ECC94B';
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', CANVAS_WIDTH / 2, 250);

        ctx.fillStyle = COLORS.uiText;
        ctx.font = '24px Courier New';
        ctx.fillText(`10 Waves Completed!`, CANVAS_WIDTH / 2, 320);

        ctx.font = '18px Courier New';
        ctx.fillText('Press ENTER to Play Again', CANVAS_WIDTH / 2, 420);

        if (keysDown['Enter']) {
            startGame();
        }
    }

    function renderMap() {
        // Calculate visible tiles
        const startTileX = Math.floor(camera.x / TILE_SIZE) - 1;
        const startTileY = Math.floor(camera.y / TILE_SIZE) - 1;
        const endTileX = startTileX + Math.ceil(CANVAS_WIDTH / TILE_SIZE) + 2;
        const endTileY = startTileY + Math.ceil(CANVAS_HEIGHT / TILE_SIZE) + 2;

        for (let y = startTileY; y <= endTileY; y++) {
            for (let x = startTileX; x <= endTileX; x++) {
                if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) continue;

                const tile = map[y][x];
                const rockType = ROCK_TYPES[tile.type];
                const screen = worldToScreen(x * TILE_SIZE, y * TILE_SIZE);

                ctx.fillStyle = rockType.color;
                ctx.fillRect(screen.x, screen.y, TILE_SIZE, TILE_SIZE);

                // Add texture/variation
                if (tile.type !== 'air') {
                    ctx.fillStyle = 'rgba(0,0,0,0.1)';
                    if ((x + y) % 2 === 0) {
                        ctx.fillRect(screen.x, screen.y, TILE_SIZE / 2, TILE_SIZE / 2);
                        ctx.fillRect(screen.x + TILE_SIZE / 2, screen.y + TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2);
                    }

                    // Damage crack effect
                    if (tile.hp < tile.maxHp) {
                        const damagePercent = 1 - (tile.hp / tile.maxHp);
                        ctx.fillStyle = `rgba(0,0,0,${damagePercent * 0.5})`;
                        ctx.fillRect(screen.x + 2, screen.y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    }
                }
            }
        }
    }

    function renderParticles() {
        for (const p of particles) {
            const screen = worldToScreen(p.x, p.y);

            if (p.type === 'resource') {
                ctx.fillStyle = COLORS[p.resource];
                ctx.beginPath();
                ctx.arc(screen.x, screen.y, 5, 0, Math.PI * 2);
                ctx.fill();

                // Glow
                ctx.fillStyle = COLORS[p.resource];
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.arc(screen.x, screen.y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            } else {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life / 0.5;
                ctx.fillRect(screen.x - 2, screen.y - 2, 4, 4);
                ctx.globalAlpha = 1;
            }
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

    function renderUI() {
        // Top bar
        ctx.fillStyle = 'rgba(26, 32, 44, 0.9)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, 40);

        ctx.fillStyle = COLORS.uiText;
        ctx.font = '14px Courier New';
        ctx.textAlign = 'left';

        // Phase and timer
        const phaseText = phase === 'mining' ? 'MINING' : 'DEFENSE';
        ctx.fillText(`${phaseText} | Wave ${waveNumber}`, 10, 25);

        if (phase === 'mining') {
            ctx.fillText(`Next Wave: ${Math.ceil(phaseTimer)}s`, 180, 25);
        } else {
            ctx.fillText(`Enemies: ${enemies.length}`, 180, 25);
        }

        // Resources
        ctx.textAlign = 'right';
        ctx.fillStyle = COLORS.iron;
        ctx.fillText(`Iron: ${resources.iron}`, CANVAS_WIDTH - 180, 25);
        ctx.fillStyle = COLORS.water;
        ctx.fillText(`Water: ${resources.water}`, CANVAS_WIDTH - 100, 25);
        ctx.fillStyle = COLORS.cobalt;
        ctx.fillText(`Cobalt: ${resources.cobalt}`, CANVAS_WIDTH - 10, 25);

        // Dome health
        if (dome) {
            ctx.fillStyle = 'rgba(26, 32, 44, 0.9)';
            ctx.fillRect(CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT - 30, 160, 25);

            const hpPercent = dome.hp / dome.maxHp;
            ctx.fillStyle = '#2D3748';
            ctx.fillRect(CANVAS_WIDTH / 2 - 75, CANVAS_HEIGHT - 25, 150, 15);
            ctx.fillStyle = hpPercent > 0.3 ? COLORS.healthBar : COLORS.healthBarDamage;
            ctx.fillRect(CANVAS_WIDTH / 2 - 75, CANVAS_HEIGHT - 25, 150 * hpPercent, 15);

            ctx.fillStyle = COLORS.uiText;
            ctx.font = '12px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.ceil(dome.hp)} / ${dome.maxHp}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 13);
        }

        // Upgrade hint
        if (keeper && keeper.isAtDome() && resources.iron >= 5) {
            ctx.fillStyle = 'rgba(236, 201, 75, 0.9)';
            ctx.font = '14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('Press E to Upgrade (5 Iron)', CANVAS_WIDTH / 2, 70);
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
        mouse.down = false;
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
                if (action.mouse) {
                    mouse.x = action.mouse.x || mouse.x;
                    mouse.y = action.mouse.y || mouse.y;
                    mouse.down = action.mouse.down || false;
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
                phase: phase,
                waveNumber: waveNumber,
                phaseTimer: phaseTimer,
                resources: { ...resources },
                upgrades: { ...upgrades },
                keeper: keeper ? {
                    x: keeper.x,
                    y: keeper.y,
                    carrying: keeper.carrying.length,
                    maxCarry: keeper.maxCarry,
                    drilling: keeper.drilling
                } : null,
                dome: dome ? {
                    hp: dome.hp,
                    maxHp: dome.maxHp,
                    laserFiring: dome.laserFiring
                } : null,
                enemies: enemies.map(e => ({
                    x: e.x,
                    y: e.y,
                    type: e.type,
                    hp: e.hp
                })),
                particleCount: particles.length
            };
        },

        getPhase: () => {
            if (gameState === 'menu') return 'menu';
            if (gameState === 'gameover') return 'gameover';
            if (gameState === 'victory') return 'victory';
            return phase;
        },

        debug: {
            setDomeHealth: (hp) => { if (dome) dome.hp = hp; },
            addResources: (type, amount) => { resources[type] += amount; },
            spawnEnemy: (type) => {
                const x = randomRange(100, MAP_WIDTH * TILE_SIZE - 100);
                enemies.push(new Enemy(x, 50, type));
            },
            clearEnemies: () => {
                enemies = [];
                if (phase === 'defense') endDefensePhase();
            },
            forceStart: () => {
                startGame();
            },
            skipToWave: (wave) => {
                waveNumber = wave - 1;
                startDefensePhase();
            },
            setPhase: (newPhase) => {
                if (newPhase === 'mining') startMiningPhase();
                if (newPhase === 'defense') startDefensePhase();
            }
        },

        version: '1.0',

        gameInfo: {
            name: 'Dome Keeper Clone',
            type: 'mining_tower_defense',
            controls: {
                movement: ['w', 'a', 's', 'd'],
                actions: { deposit: 'Space', upgrade: 'e' },
                laser: { aim: 'mouse', fire: 'click' }
            }
        }
    };

    // Initialize
    window.addEventListener('load', init);
})();
