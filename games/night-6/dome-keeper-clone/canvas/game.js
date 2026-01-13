/**
 * Underground Keeper - Dome Keeper Clone
 * Night 6 - Canvas Implementation
 */

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
    const DOME_X = 40; // Center of map
    const DOME_Y = 3;  // Near top

    // Camera viewport (visible tiles)
    const VIEW_TILES_X = 25;
    const VIEW_TILES_Y = 19;

    const COLORS = {
        sky: '#1a1a3a',
        dirt: '#8B4513',
        softStone: '#A9A9A9',
        hardStone: '#696969',
        denseRock: '#4A4A4A',
        crystalRock: '#4169E1',
        obsidian: '#2F1B41',
        bedrock: '#111111',
        air: '#2a2a4a',
        domeGlass: '#87CEEB',
        domeMetal: '#4A5568',
        iron: '#CD853F',
        ironGlow: '#DAA520',
        water: '#4A90D9',
        waterGlow: '#7AB8F5',
        cobalt: '#8B5CF6',
        cobaltGlow: '#A78BFA',
        player: '#88ccff',
        laser: '#ff6b6b',
        laserGlow: '#ffe66d',
        enemy: '#cc4444',
        enemyFlyer: '#aa44aa',
        ui: '#222244',
        uiText: '#ffffff'
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // TILE DATA
    // ═══════════════════════════════════════════════════════════════════════════

    const TILE_TYPES = {
        air: { name: 'Air', hp: 0, color: COLORS.air, mineable: false },
        bedrock: { name: 'Bedrock', hp: Infinity, color: COLORS.bedrock, mineable: false },
        dirt: { name: 'Dirt', hp: 1, color: '#8B4513', mineable: true, drops: [] },
        softStone: { name: 'Soft Stone', hp: 2, color: '#A9A9A9', mineable: true, drops: [{ type: 'iron', chance: 0.2 }] },
        hardStone: { name: 'Hard Stone', hp: 4, color: '#696969', mineable: true, drops: [{ type: 'iron', chance: 0.3 }, { type: 'water', chance: 0.05 }] },
        denseRock: { name: 'Dense Rock', hp: 6, color: '#4A4A4A', mineable: true, drops: [{ type: 'iron', chance: 0.4 }, { type: 'water', chance: 0.1 }] },
        crystalRock: { name: 'Crystal Rock', hp: 8, color: '#4169E1', mineable: true, drops: [{ type: 'cobalt', chance: 0.2 }] },
        obsidian: { name: 'Obsidian', hp: 12, color: '#2F1B41', mineable: true, drops: [{ type: 'cobalt', chance: 0.5 }] },
        ironOre: { name: 'Iron Ore', hp: 3, color: '#CD853F', mineable: true, drops: [{ type: 'iron', chance: 1.0, amount: [2, 4] }] },
        waterCrystal: { name: 'Water Crystal', hp: 3, color: '#4A90D9', mineable: true, drops: [{ type: 'water', chance: 1.0, amount: [1, 3] }] },
        cobaltOre: { name: 'Cobalt Ore', hp: 5, color: '#8B5CF6', mineable: true, drops: [{ type: 'cobalt', chance: 1.0, amount: [1, 2] }] }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // ENEMY DATA
    // ═══════════════════════════════════════════════════════════════════════════

    const ENEMY_DATA = {
        walker: { name: 'Walker', hp: 40, damage: 12, speed: 60, weight: 20, color: '#cc4444', size: 14 },
        flyer: { name: 'Flyer', hp: 20, damage: 8, speed: 80, weight: 25, color: '#aa44aa', size: 12, flying: true, ranged: true },
        hornet: { name: 'Hornet', hp: 100, damage: 45, speed: 50, weight: 80, color: '#ff8844', size: 16 },
        tick: { name: 'Tick', hp: 5, damage: 15, speed: 40, weight: 10, color: '#44cc44', size: 8 },
        diver: { name: 'Diver', hp: 30, damage: 100, speed: 200, weight: 70, color: '#4488ff', size: 14, dives: true },
        boss: { name: 'Boss', hp: 500, damage: 30, speed: 25, weight: 300, color: '#ff4444', size: 28 }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // UPGRADE DATA
    // ═══════════════════════════════════════════════════════════════════════════

    const UPGRADES = {
        // Drill upgrades
        drillSpeed1: { name: 'Drill Speed I', cost: { iron: 5 }, effect: { drillSpeedMult: 1.2 } },
        drillSpeed2: { name: 'Drill Speed II', cost: { iron: 15 }, effect: { drillSpeedMult: 1.4 }, requires: 'drillSpeed1' },
        drillStrength1: { name: 'Drill Strength I', cost: { iron: 10 }, effect: { drillStrength: 1 } },
        carryCapacity1: { name: 'Cargo I', cost: { iron: 10 }, effect: { carryCapacity: 2 } },
        carryCapacity2: { name: 'Cargo II', cost: { iron: 20 }, effect: { carryCapacity: 4 }, requires: 'carryCapacity1' },

        // Dome defense
        laserDamage1: { name: 'Laser Power I', cost: { iron: 10, water: 5 }, effect: { laserDamageMult: 1.25 } },
        laserDamage2: { name: 'Laser Power II', cost: { iron: 20, water: 10 }, effect: { laserDamageMult: 1.5 }, requires: 'laserDamage1' },
        laserSpeed1: { name: 'Laser Speed I', cost: { iron: 8, water: 3 }, effect: { laserSpeedMult: 1.3 } },
        domeHP1: { name: 'Dome Armor I', cost: { iron: 20 }, effect: { domeMaxHP: 200 } },
        domeHP2: { name: 'Dome Armor II', cost: { iron: 40 }, effect: { domeMaxHP: 400 }, requires: 'domeHP1' },

        // Advanced (Cobalt)
        jetpack: { name: 'Jetpack', cost: { cobalt: 5 }, effect: { moveSpeedMult: 1.5 } },
        teleport: { name: 'Teleporter', cost: { cobalt: 10 }, effect: { canTeleport: true } },
        radar: { name: 'Resource Radar', cost: { cobalt: 8 }, effect: { showResources: true } }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME STATE
    // ═══════════════════════════════════════════════════════════════════════════

    let canvas, ctx;
    let gameState = 'menu'; // menu, mining, defense, upgradeMenu, dead, victory
    let lastTime = 0;
    let deltaTime = 0;

    // Input
    const keys = {};
    let mouse = { x: 0, y: 0, down: false, worldX: 0, worldY: 0 };

    // Camera
    let camera = { x: 0, y: 0 };

    // Map
    let tileMap = [];
    let droppedResources = [];

    // Game entities
    let player = null;
    let dome = null;
    let enemies = [];
    let projectiles = [];
    let particles = [];

    // Wave system
    let currentWave = 0;
    let phaseTimer = 75; // Mining phase duration
    let waveInProgress = false;

    // Screen effects
    let screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
    let damageFlash = 0;
    let floatingTexts = [];

    // Run statistics
    let runStats = {
        ironCollected: 0,
        waterCollected: 0,
        cobaltCollected: 0,
        enemiesKilled: 0,
        damageDealt: 0,
        tilesMineed: 0,
        wavesCompleted: 0
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // PLAYER CLASS
    // ═══════════════════════════════════════════════════════════════════════════

    class Player {
        constructor(x, y) {
            this.x = x * TILE_SIZE + TILE_SIZE / 2;
            this.y = y * TILE_SIZE + TILE_SIZE / 2;
            this.width = 12;
            this.height = 14;
            this.speed = 100;

            // Drilling
            this.drillStrength = 2;
            this.drillSpeedMult = 1.0;
            this.drillCooldown = 0;
            this.drillingTile = null;
            this.drillProgress = 0;

            // Inventory
            this.carryCapacity = 5;
            this.inventory = { iron: 0, water: 0, cobalt: 0 };

            // Stats
            this.moveSpeedMult = 1.0;
            this.canTeleport = false;

            // Upgrades purchased
            this.upgrades = new Set();
        }

        get carryingCount() {
            return this.inventory.iron + this.inventory.water + this.inventory.cobalt;
        }

        get canCarryMore() {
            return this.carryingCount < this.carryCapacity;
        }

        update(dt) {
            // Movement
            let dx = 0, dy = 0;

            if (keys['w'] || keys['arrowup']) dy = -1;
            if (keys['s'] || keys['arrowdown']) dy = 1;
            if (keys['a'] || keys['arrowleft']) dx = -1;
            if (keys['d'] || keys['arrowright']) dx = 1;

            // Normalize diagonal movement
            if (dx !== 0 && dy !== 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                dx /= len;
                dy /= len;
            }

            // Apply movement with speed modifier based on cargo
            const cargoSlowdown = 1 - (this.carryingCount / this.carryCapacity * 0.3);
            const effectiveSpeed = this.speed * this.moveSpeedMult * cargoSlowdown;

            const newX = this.x + dx * effectiveSpeed * dt;
            const newY = this.y + dy * effectiveSpeed * dt;

            // Check collision with tiles
            if (this.canMoveTo(newX, this.y)) this.x = newX;
            if (this.canMoveTo(this.x, newY)) this.y = newY;

            // Drilling
            this.drillCooldown -= dt;

            if (this.drillCooldown <= 0) {
                this.tryDrill(dx, dy, dt);
            }

            // Pick up dropped resources
            this.pickUpResources();
        }

        canMoveTo(x, y) {
            // Check tile at each corner of player hitbox
            const corners = [
                { x: x - this.width/2, y: y - this.height/2 },
                { x: x + this.width/2, y: y - this.height/2 },
                { x: x - this.width/2, y: y + this.height/2 },
                { x: x + this.width/2, y: y + this.height/2 }
            ];

            for (const corner of corners) {
                const tx = Math.floor(corner.x / TILE_SIZE);
                const ty = Math.floor(corner.y / TILE_SIZE);

                if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) {
                    return false;
                }

                const tile = tileMap[ty]?.[tx];
                if (tile && tile !== 'air') {
                    return false;
                }
            }

            return true;
        }

        tryDrill(dx, dy, dt) {
            // Determine which direction to drill
            let drillDir = null;
            let drillKey = null;

            if (keys['w'] || keys['arrowup']) { drillDir = { x: 0, y: -1 }; drillKey = 'up'; }
            else if (keys['s'] || keys['arrowdown']) { drillDir = { x: 0, y: 1 }; drillKey = 'down'; }
            else if (keys['a'] || keys['arrowleft']) { drillDir = { x: -1, y: 0 }; drillKey = 'left'; }
            else if (keys['d'] || keys['arrowright']) { drillDir = { x: 1, y: 0 }; drillKey = 'right'; }

            if (!drillDir) {
                this.drillingTile = null;
                this.drillProgress = 0;
                return;
            }

            // Find tile in drill direction
            const checkX = Math.floor((this.x + drillDir.x * (this.width/2 + 4)) / TILE_SIZE);
            const checkY = Math.floor((this.y + drillDir.y * (this.height/2 + 4)) / TILE_SIZE);

            if (checkX < 0 || checkX >= MAP_WIDTH || checkY < 0 || checkY >= MAP_HEIGHT) return;

            const tileType = tileMap[checkY]?.[checkX];
            if (!tileType || tileType === 'air') {
                this.drillingTile = null;
                this.drillProgress = 0;
                return;
            }

            const tileData = TILE_TYPES[tileType];
            if (!tileData || !tileData.mineable) {
                this.drillingTile = null;
                this.drillProgress = 0;
                return;
            }

            // Check if same tile as before
            const tileKey = `${checkX},${checkY}`;
            if (this.drillingTile !== tileKey) {
                this.drillingTile = tileKey;
                this.drillProgress = 0;
            }

            // Drill the tile
            const drillDamage = this.drillStrength * this.drillSpeedMult * dt * 2;
            this.drillProgress += drillDamage;

            // Spawn drill particles
            if (Math.random() < 0.3) {
                spawnDrillParticle(
                    checkX * TILE_SIZE + TILE_SIZE/2,
                    checkY * TILE_SIZE + TILE_SIZE/2,
                    tileData.color
                );
            }

            // Check if tile is destroyed
            if (this.drillProgress >= tileData.hp) {
                // Mine the tile
                mineTile(checkX, checkY);
                this.drillingTile = null;
                this.drillProgress = 0;
            }
        }

        pickUpResources() {
            for (let i = droppedResources.length - 1; i >= 0; i--) {
                const res = droppedResources[i];
                const dx = res.x - this.x;
                const dy = res.y - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < 20 && this.canCarryMore) {
                    this.inventory[res.type] += res.amount;

                    // Track stats
                    if (res.type === 'iron') runStats.ironCollected += res.amount;
                    else if (res.type === 'water') runStats.waterCollected += res.amount;
                    else if (res.type === 'cobalt') runStats.cobaltCollected += res.amount;

                    // Spawn floating text
                    spawnFloatingText(res.x, res.y, `+${res.amount}`, getResourceColor(res.type));

                    droppedResources.splice(i, 1);
                }
            }
        }

        depositResources() {
            // Transfer resources to dome
            dome.iron += this.inventory.iron;
            dome.water += this.inventory.water;
            dome.cobalt += this.inventory.cobalt;

            this.inventory = { iron: 0, water: 0, cobalt: 0 };
        }

        isAtDome() {
            const domeCenterX = DOME_X * TILE_SIZE + TILE_SIZE/2;
            const domeCenterY = DOME_Y * TILE_SIZE + TILE_SIZE/2;
            const dx = this.x - domeCenterX;
            const dy = this.y - domeCenterY;
            return Math.sqrt(dx*dx + dy*dy) < 50;
        }

        draw(ctx) {
            ctx.save();

            // Player body
            ctx.fillStyle = COLORS.player;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.width/2, this.height/2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Visor
            ctx.fillStyle = '#44aaff';
            ctx.beginPath();
            ctx.arc(this.x, this.y - 2, 4, 0, Math.PI * 2);
            ctx.fill();

            // Jetpack
            ctx.fillStyle = '#555555';
            ctx.fillRect(this.x - 6, this.y + 2, 4, 6);
            ctx.fillRect(this.x + 2, this.y + 2, 4, 6);

            // Drill direction indicator
            if (this.drillingTile) {
                ctx.fillStyle = '#ffaa44';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Cargo indicator
            if (this.carryingCount > 0) {
                ctx.fillStyle = '#44ff44';
                ctx.font = '8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(this.carryingCount.toString(), this.x, this.y - 12);
            }

            ctx.restore();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DOME CLASS
    // ═══════════════════════════════════════════════════════════════════════════

    class Dome {
        constructor(x, y) {
            this.x = x * TILE_SIZE + TILE_SIZE/2;
            this.y = y * TILE_SIZE;
            this.width = 64;
            this.height = 48;

            // Health
            this.maxHP = 800;
            this.hp = 800;

            // Resources
            this.iron = 0;
            this.water = 0;
            this.cobalt = 0;

            // Laser weapon
            this.laserAngle = -Math.PI / 2; // Pointing up
            this.laserDamage = 15;
            this.laserDamageMult = 1.0;
            this.laserSpeed = 2; // Radians per second
            this.laserSpeedMult = 1.0;
            this.isFiring = false;
            this.laserRange = 400;

            // Upgrades
            this.upgrades = new Set();
        }

        update(dt) {
            if (gameState !== 'defense') return;

            // Rotate laser toward mouse
            const targetAngle = Math.atan2(mouse.worldY - this.y, mouse.worldX - this.x);

            // Clamp to upper hemisphere
            let clampedTarget = targetAngle;
            if (clampedTarget > 0) clampedTarget = Math.max(-Math.PI, Math.min(0, clampedTarget));
            if (clampedTarget < -Math.PI) clampedTarget = -Math.PI;
            if (clampedTarget > 0) clampedTarget = 0;

            // Rotate toward target
            const angleDiff = clampedTarget - this.laserAngle;
            const rotateSpeed = this.laserSpeed * this.laserSpeedMult * (this.isFiring ? 0.6 : 1);
            const rotation = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), rotateSpeed * dt);
            this.laserAngle += rotation;

            // Clamp angle
            this.laserAngle = Math.max(-Math.PI, Math.min(0, this.laserAngle));

            // Fire laser
            if (mouse.down) {
                this.isFiring = true;
                this.fireLaser(dt);
            } else {
                this.isFiring = false;
            }
        }

        fireLaser(dt) {
            const beamEndX = this.x + Math.cos(this.laserAngle) * this.laserRange;
            const beamEndY = this.y + Math.sin(this.laserAngle) * this.laserRange;

            // Check enemies along beam
            for (const enemy of enemies) {
                if (this.laserHitsEnemy(enemy, beamEndX, beamEndY)) {
                    const damage = this.laserDamage * this.laserDamageMult * dt;
                    enemy.takeDamage(damage);
                }
            }
        }

        laserHitsEnemy(enemy, beamEndX, beamEndY) {
            // Line-circle intersection
            const dx = beamEndX - this.x;
            const dy = beamEndY - this.y;
            const fx = this.x - enemy.x;
            const fy = this.y - enemy.y;

            const a = dx*dx + dy*dy;
            const b = 2*(fx*dx + fy*dy);
            const c = fx*fx + fy*fy - (enemy.size/2 + 5) * (enemy.size/2 + 5);

            let discriminant = b*b - 4*a*c;
            if (discriminant < 0) return false;

            discriminant = Math.sqrt(discriminant);
            const t1 = (-b - discriminant) / (2*a);
            const t2 = (-b + discriminant) / (2*a);

            return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
        }

        takeDamage(amount) {
            this.hp -= amount;
            triggerScreenShake(5, 0.15);
            damageFlash = 0.5;  // Red flash on dome damage

            if (this.hp <= 0) {
                this.hp = 0;
                gameState = 'dead';
            }
        }

        draw(ctx) {
            ctx.save();

            // Dome glass
            ctx.fillStyle = COLORS.domeGlass;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(this.x, this.y + 20, this.width/2, Math.PI, 0);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Dome frame
            ctx.strokeStyle = COLORS.domeMetal;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y + 20, this.width/2, Math.PI, 0);
            ctx.stroke();

            // Base
            ctx.fillStyle = COLORS.domeMetal;
            ctx.fillRect(this.x - this.width/2, this.y + 20, this.width, 10);

            // Laser turret
            const turretX = this.x;
            const turretY = this.y + 5;

            ctx.fillStyle = '#666666';
            ctx.beginPath();
            ctx.arc(turretX, turretY, 8, 0, Math.PI * 2);
            ctx.fill();

            // Laser barrel
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(turretX, turretY);
            ctx.lineTo(
                turretX + Math.cos(this.laserAngle) * 15,
                turretY + Math.sin(this.laserAngle) * 15
            );
            ctx.stroke();

            // Draw laser beam when firing
            if (this.isFiring) {
                const beamEndX = this.x + Math.cos(this.laserAngle) * this.laserRange;
                const beamEndY = this.y + Math.sin(this.laserAngle) * this.laserRange;

                // Pulsing intensity
                const pulse = 0.7 + Math.sin(performance.now() * 0.015) * 0.3;

                // Outer glow (widest)
                ctx.strokeStyle = COLORS.laserGlow;
                ctx.lineWidth = 16 * pulse;
                ctx.globalAlpha = 0.15;
                ctx.beginPath();
                ctx.moveTo(turretX, turretY);
                ctx.lineTo(beamEndX, beamEndY);
                ctx.stroke();

                // Middle glow
                ctx.strokeStyle = '#ff9966';
                ctx.lineWidth = 10 * pulse;
                ctx.globalAlpha = 0.25;
                ctx.beginPath();
                ctx.moveTo(turretX, turretY);
                ctx.lineTo(beamEndX, beamEndY);
                ctx.stroke();

                // Inner glow
                ctx.strokeStyle = COLORS.laserGlow;
                ctx.lineWidth = 6;
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.moveTo(turretX, turretY);
                ctx.lineTo(beamEndX, beamEndY);
                ctx.stroke();

                // Core beam
                ctx.strokeStyle = COLORS.laser;
                ctx.lineWidth = 3;
                ctx.globalAlpha = 1;
                ctx.beginPath();
                ctx.moveTo(turretX, turretY);
                ctx.lineTo(beamEndX, beamEndY);
                ctx.stroke();

                // White hot center
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(turretX, turretY);
                ctx.lineTo(beamEndX, beamEndY);
                ctx.stroke();

                // Spawn beam particles
                if (Math.random() < 0.3) {
                    spawnLaserParticle(beamEndX, beamEndY);
                }
            }

            ctx.restore();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENEMY CLASS
    // ═══════════════════════════════════════════════════════════════════════════

    class Enemy {
        constructor(type, x, y) {
            const data = ENEMY_DATA[type];

            this.type = type;
            this.x = x;
            this.y = y;
            this.maxHP = data.hp;
            this.hp = data.hp;
            this.damage = data.damage;
            this.speed = data.speed;
            this.color = data.color;
            this.size = data.size;
            this.flying = data.flying || false;
            this.ranged = data.ranged || false;
            this.dives = data.dives || false;

            this.flashTimer = 0;
            this.attackCooldown = 0;

            // Diver state
            this.isDiving = false;
            this.diveTarget = null;
        }

        update(dt) {
            if (this.flashTimer > 0) this.flashTimer -= dt;
            if (this.attackCooldown > 0) this.attackCooldown -= dt;

            // Move toward dome
            const dx = dome.x - this.x;
            const dy = dome.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            // Special diver behavior
            if (this.dives && !this.isDiving && dist < 300) {
                this.isDiving = true;
                this.diveTarget = { x: dome.x, y: dome.y };
            }

            if (this.isDiving) {
                const diveDx = this.diveTarget.x - this.x;
                const diveDy = this.diveTarget.y - this.y;
                const diveDist = Math.sqrt(diveDx*diveDx + diveDy*diveDy);

                if (diveDist > 5) {
                    this.x += (diveDx / diveDist) * this.speed * dt;
                    this.y += (diveDy / diveDist) * this.speed * dt;
                } else {
                    // Hit dome
                    dome.takeDamage(this.damage);
                    this.hp = 0; // Diver dies after attack
                }
            } else if (dist > 30) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            } else {
                // Attack dome
                if (this.attackCooldown <= 0) {
                    dome.takeDamage(this.damage);
                    this.attackCooldown = 1.3;

                    // Ranged enemies shoot
                    if (this.ranged) {
                        this.shoot();
                    }
                }
            }
        }

        shoot() {
            const angle = Math.atan2(dome.y - this.y, dome.x - this.x);
            projectiles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * 150,
                vy: Math.sin(angle) * 150,
                damage: this.damage * 0.5,
                color: '#ff8844',
                size: 4,
                fromEnemy: true
            });
        }

        takeDamage(amount) {
            this.hp -= amount;
            this.flashTimer = 0.1;

            if (this.hp <= 0) {
                this.die();
                return true;
            }
            return false;
        }

        die() {
            runStats.enemiesKilled++;
            spawnDeathParticles(this.x, this.y, this.color);
        }

        draw(ctx) {
            ctx.save();

            if (this.flashTimer > 0) {
                ctx.fillStyle = '#ffffff';
            } else {
                ctx.fillStyle = this.color;
            }

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(this.x - 3, this.y - 2, 2, 0, Math.PI * 2);
            ctx.arc(this.x + 3, this.y - 2, 2, 0, Math.PI * 2);
            ctx.fill();

            // Health bar
            if (this.hp < this.maxHP) {
                const barWidth = this.size + 4;
                const barHeight = 3;
                const barX = this.x - barWidth/2;
                const barY = this.y - this.size/2 - 8;

                ctx.fillStyle = '#222222';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                ctx.fillStyle = '#44ff44';
                ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHP), barHeight);
            }

            ctx.restore();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MAP GENERATION
    // ═══════════════════════════════════════════════════════════════════════════

    function generateMap() {
        tileMap = [];

        for (let y = 0; y < MAP_HEIGHT; y++) {
            tileMap[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                tileMap[y][x] = generateTile(x, y);
            }
        }

        // Clear dome area
        const domeRadius = 5;
        for (let dy = -domeRadius; dy <= 2; dy++) {
            for (let dx = -domeRadius; dx <= domeRadius; dx++) {
                const tx = DOME_X + dx;
                const ty = DOME_Y + dy;
                if (ty >= 0 && ty < MAP_HEIGHT && tx >= 0 && tx < MAP_WIDTH) {
                    tileMap[ty][tx] = 'air';
                }
            }
        }

        // Add bedrock borders
        for (let y = 0; y < MAP_HEIGHT; y++) {
            tileMap[y][0] = 'bedrock';
            tileMap[y][MAP_WIDTH - 1] = 'bedrock';
        }
        for (let x = 0; x < MAP_WIDTH; x++) {
            tileMap[MAP_HEIGHT - 1][x] = 'bedrock';
        }

        // Place resource clusters
        placeResourceClusters('ironOre', 0.08, 0, MAP_HEIGHT);
        placeResourceClusters('waterCrystal', 0.04, 20, MAP_HEIGHT);
        placeResourceClusters('cobaltOre', 0.02, 50, MAP_HEIGHT);
    }

    function generateTile(x, y) {
        // Sky/surface
        if (y < 3) return 'air';

        const depthPercent = y / MAP_HEIGHT;
        const noise = Math.random();

        // Deeper = harder rocks
        if (depthPercent > 0.8 && noise < 0.3) return 'obsidian';
        if (depthPercent > 0.6 && noise < 0.25) return 'crystalRock';
        if (depthPercent > 0.5 && noise < 0.4) return 'denseRock';
        if (depthPercent > 0.3 && noise < 0.5) return 'hardStone';
        if (depthPercent > 0.15 && noise < 0.6) return 'softStone';

        return 'dirt';
    }

    function placeResourceClusters(resourceType, density, minDepth, maxDepth) {
        const clusterCount = Math.floor(MAP_WIDTH * (maxDepth - minDepth) * density / 5);

        for (let i = 0; i < clusterCount; i++) {
            const cx = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
            const cy = Math.floor(Math.random() * (maxDepth - minDepth - 4)) + minDepth + 2;
            const size = 2 + Math.floor(Math.random() * 4);

            growCluster(cx, cy, resourceType, size);
        }
    }

    function growCluster(x, y, type, size) {
        const queue = [{ x, y }];
        let placed = 0;

        while (queue.length > 0 && placed < size) {
            const pos = queue.shift();
            if (pos.x < 1 || pos.x >= MAP_WIDTH - 1 || pos.y < 3 || pos.y >= MAP_HEIGHT - 1) continue;

            const currentType = tileMap[pos.y]?.[pos.x];
            if (currentType && currentType !== 'air' && currentType !== 'bedrock' &&
                !currentType.includes('Ore') && !currentType.includes('Crystal')) {
                tileMap[pos.y][pos.x] = type;
                placed++;

                // Add neighbors
                const neighbors = [
                    { x: pos.x + 1, y: pos.y },
                    { x: pos.x - 1, y: pos.y },
                    { x: pos.x, y: pos.y + 1 },
                    { x: pos.x, y: pos.y - 1 }
                ];

                for (const n of neighbors) {
                    if (Math.random() < 0.5) queue.push(n);
                }
            }
        }
    }

    function mineTile(x, y) {
        const tileType = tileMap[y]?.[x];
        if (!tileType) return;

        const tileData = TILE_TYPES[tileType];
        if (!tileData) return;

        // Track stats
        runStats.tilesMined++;

        // Drop resources
        for (const drop of tileData.drops || []) {
            if (Math.random() < drop.chance) {
                const amount = drop.amount ?
                    drop.amount[0] + Math.floor(Math.random() * (drop.amount[1] - drop.amount[0] + 1)) : 1;

                droppedResources.push({
                    type: drop.type,
                    amount: amount,
                    x: x * TILE_SIZE + TILE_SIZE/2,
                    y: y * TILE_SIZE + TILE_SIZE/2,
                    bobOffset: Math.random() * Math.PI * 2
                });
            }
        }

        // Remove tile
        tileMap[y][x] = 'air';

        // Spawn tile break effect
        spawnTileBreakEffect(
            x * TILE_SIZE + TILE_SIZE/2,
            y * TILE_SIZE + TILE_SIZE/2,
            tileData.color
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WAVE SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════

    function startDefensePhase() {
        gameState = 'defense';
        waveInProgress = true;
        currentWave++;

        spawnWave();
    }

    function spawnWave() {
        const waveWeight = calculateWaveWeight();
        let remainingWeight = waveWeight;

        const enemyPool = [
            { type: 'walker', weight: 20, minWave: 1 },
            { type: 'tick', weight: 10, minWave: 1 },
            { type: 'flyer', weight: 25, minWave: 2 },
            { type: 'hornet', weight: 80, minWave: 4 },
            { type: 'diver', weight: 70, minWave: 6 },
            { type: 'boss', weight: 300, minWave: 10 }
        ];

        while (remainingWeight > 5) {
            const validEnemies = enemyPool.filter(e =>
                e.weight <= remainingWeight && e.minWave <= currentWave
            );

            if (validEnemies.length === 0) break;

            const selected = validEnemies[Math.floor(Math.random() * validEnemies.length)];

            // Spawn from sides
            const side = Math.random() < 0.5 ? -1 : 1;
            const spawnX = dome.x + side * (300 + Math.random() * 200);
            const spawnY = dome.y - 50 - Math.random() * 100;

            enemies.push(new Enemy(selected.type, spawnX, spawnY));
            spawnEnemySpawnEffect(spawnX, spawnY);
            remainingWeight -= selected.weight;
        }
    }

    function calculateWaveWeight() {
        const baseWeight = 10;
        const cycleWeight = 0.15 * currentWave * currentWave + 11 * currentWave;
        const resourceBonus = dome.iron * 0.6 + dome.water * 1.2 + dome.cobalt * 2.2;

        return Math.max(20, baseWeight + cycleWeight + resourceBonus * 0.1);
    }

    function checkWaveComplete() {
        if (waveInProgress && enemies.length === 0) {
            waveInProgress = false;
            gameState = 'mining';
            phaseTimer = 75;

            // Deposit player resources if at dome
            if (player.isAtDome()) {
                player.depositResources();
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PARTICLE SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════

    function spawnDrillParticle(x, y, color) {
        // Rock fragment particle
        particles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 60 - 30,
            life: 0.4 + Math.random() * 0.3,
            maxLife: 0.7,
            size: 2 + Math.random() * 4,
            color: color,
            gravity: true,
            type: 'rock'
        });

        // Dust cloud particle (lighter color)
        particles.push({
            x: x + (Math.random() - 0.5) * 8,
            y: y + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 30,
            vy: -20 - Math.random() * 40,
            life: 0.5 + Math.random() * 0.3,
            maxLife: 0.8,
            size: 4 + Math.random() * 6,
            color: '#9b8b7a',
            gravity: false,
            type: 'dust'
        });
    }

    function spawnTileBreakEffect(x, y, color) {
        // Spawn multiple fragments when tile breaks
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 120;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                life: 0.6 + Math.random() * 0.4,
                maxLife: 1.0,
                size: 3 + Math.random() * 5,
                color: color,
                gravity: true,
                type: 'rock'
            });
        }

        // Dust cloud burst
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: x + (Math.random() - 0.5) * 16,
                y: y + (Math.random() - 0.5) * 16,
                vx: (Math.random() - 0.5) * 60,
                vy: -30 - Math.random() * 50,
                life: 0.8 + Math.random() * 0.4,
                maxLife: 1.2,
                size: 8 + Math.random() * 10,
                color: '#8b7b6a',
                gravity: false,
                type: 'dust'
            });
        }
    }

    function spawnLaserParticle(x, y) {
        // Sparks at laser endpoint
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 60;
            particles.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.2 + Math.random() * 0.2,
                maxLife: 0.4,
                size: 2 + Math.random() * 3,
                color: Math.random() < 0.5 ? '#ff6b6b' : '#ffe66d',
                gravity: true,
                type: 'spark'
            });
        }
    }

    function spawnDeathParticles(x, y, color) {
        // Main blood/goo splatter
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 120;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                life: 0.6 + Math.random() * 0.3,
                maxLife: 0.9,
                size: 3 + Math.random() * 5,
                color: color,
                gravity: true,
                type: 'gib'
            });
        }

        // Flash/explosion ring
        particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: 0.3,
            maxLife: 0.3,
            size: 30,
            color: '#ffffff',
            type: 'flash'
        });

        // Smoke puff
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 40,
                vy: -20 - Math.random() * 30,
                life: 0.8 + Math.random() * 0.4,
                maxLife: 1.2,
                size: 10 + Math.random() * 10,
                color: '#444444',
                gravity: false,
                type: 'dust'
            });
        }
    }

    function spawnResourceSparkle(x, y, color) {
        // Small rising sparkle
        const angle = -Math.PI/2 + (Math.random() - 0.5) * 0.8;
        const speed = 20 + Math.random() * 30;
        particles.push({
            x: x + (Math.random() - 0.5) * 8,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.4 + Math.random() * 0.3,
            maxLife: 0.7,
            size: 2 + Math.random() * 2,
            color: color,
            gravity: false,
            type: 'sparkle'
        });
    }

    function spawnEnemySpawnEffect(x, y) {
        // Warning circle that expands
        particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: 0.5,
            maxLife: 0.5,
            size: 5,
            color: '#ff4444',
            type: 'spawn_ring'
        });

        // Dust poof
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 50;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.4 + Math.random() * 0.3,
                maxLife: 0.7,
                size: 6 + Math.random() * 8,
                color: '#886666',
                gravity: false,
                type: 'dust'
            });
        }
    }

    function updateParticles(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            if (p.gravity) {
                p.vy += 200 * dt;
            }

            p.vx *= 0.95;
            p.vy *= 0.95;

            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function drawParticles(ctx) {
        for (const p of particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;

            if (p.type === 'dust') {
                // Softer dust particles with gradient
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * alpha);
                grad.addColorStop(0, p.color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.fillRect(p.x - p.size * alpha, p.y - p.size * alpha, p.size * 2 * alpha, p.size * 2 * alpha);
            } else if (p.type === 'rock') {
                // Angular rock fragments
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.vx * 0.01);
                const size = p.size * alpha;
                ctx.fillRect(-size/2, -size/2, size, size);
                ctx.restore();
            } else if (p.type === 'spark') {
                // Glowing spark particles
                const sparkSize = p.size * alpha;
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sparkSize * 2);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.3, p.color);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.fillRect(p.x - sparkSize * 2, p.y - sparkSize * 2, sparkSize * 4, sparkSize * 4);
            } else if (p.type === 'gib') {
                // Blood/goo particles with trail
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
                // Small trail
                ctx.globalAlpha = alpha * 0.5;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
                ctx.lineWidth = p.size * alpha * 0.5;
                ctx.strokeStyle = p.color;
                ctx.stroke();
            } else if (p.type === 'flash') {
                // Explosion flash - expands then fades
                const flashSize = p.size * (1 - alpha) * 2;
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, flashSize);
                grad.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
                grad.addColorStop(0.3, 'rgba(255,200,100,' + alpha * 0.5 + ')');
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, flashSize, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'spawn_ring') {
                // Expanding warning ring
                const ringSize = p.size + (1 - alpha) * 40;
                ctx.strokeStyle = p.color;
                ctx.globalAlpha = alpha;
                ctx.lineWidth = 3 * alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, ringSize, 0, Math.PI * 2);
                ctx.stroke();
            } else if (p.type === 'sparkle') {
                // Twinkling star sparkle
                const size = p.size * alpha;
                const twinkle = 0.5 + Math.sin(performance.now() * 0.02 + p.x) * 0.5;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.globalAlpha = alpha * twinkle;
                // Draw 4-point star
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.3, 0);
                ctx.lineTo(0, size);
                ctx.lineTo(-size * 0.3, 0);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(-size, 0);
                ctx.lineTo(0, size * 0.3);
                ctx.lineTo(size, 0);
                ctx.lineTo(0, -size * 0.3);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            } else {
                // Default circular particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SCREEN EFFECTS
    // ═══════════════════════════════════════════════════════════════════════════

    function triggerScreenShake(intensity, duration) {
        screenShake.intensity = intensity;
        screenShake.duration = duration;
    }

    function updateScreenShake(dt) {
        if (screenShake.duration > 0) {
            screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
            screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
            screenShake.duration -= dt;
        } else {
            screenShake.x = 0;
            screenShake.y = 0;
        }
    }

    function updateDamageFlash(dt) {
        if (damageFlash > 0) {
            damageFlash -= dt * 2.5;
            if (damageFlash < 0) damageFlash = 0;
        }
    }

    function drawDamageFlash(ctx) {
        if (damageFlash > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(180, 30, 30, ${damageFlash * 0.4})`;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Vignette effect
            const gradient = ctx.createRadialGradient(
                CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 100,
                CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH / 2
            );
            gradient.addColorStop(0, 'rgba(180, 30, 30, 0)');
            gradient.addColorStop(1, `rgba(180, 30, 30, ${damageFlash * 0.5})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.restore();
        }
    }

    function getResourceColor(type) {
        switch(type) {
            case 'iron': return COLORS.ironGlow;
            case 'water': return COLORS.waterGlow;
            case 'cobalt': return COLORS.cobaltGlow;
            default: return '#ffffff';
        }
    }

    function spawnFloatingText(x, y, text, color) {
        floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            life: 1.0,
            maxLife: 1.0
        });
    }

    function updateFloatingTexts(dt) {
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            floatingTexts[i].life -= dt;
            floatingTexts[i].y -= 30 * dt;  // Float upward
            if (floatingTexts[i].life <= 0) {
                floatingTexts.splice(i, 1);
            }
        }
    }

    function drawFloatingTexts(ctx) {
        for (const ft of floatingTexts) {
            const alpha = ft.life / ft.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = ft.color;
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x - camera.x, ft.y - camera.y);
            ctx.restore();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CAMERA
    // ═══════════════════════════════════════════════════════════════════════════

    function updateCamera() {
        // Follow player during mining, follow dome during defense
        let targetX, targetY;

        if (gameState === 'mining') {
            targetX = player.x - CANVAS_WIDTH / 2;
            targetY = player.y - CANVAS_HEIGHT / 2;
        } else {
            targetX = dome.x - CANVAS_WIDTH / 2;
            targetY = dome.y - CANVAS_HEIGHT / 3;
        }

        // Smooth follow
        camera.x += (targetX - camera.x) * 0.1;
        camera.y += (targetY - camera.y) * 0.1;

        // Clamp to map bounds
        camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - CANVAS_WIDTH, camera.x));
        camera.y = Math.max(-100, Math.min(MAP_HEIGHT * TILE_SIZE - CANVAS_HEIGHT, camera.y));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INPUT HANDLING
    // ═══════════════════════════════════════════════════════════════════════════

    function setupInput() {
        document.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;

            // Deposit resources
            if (e.key.toLowerCase() === 'e') {
                if (gameState === 'mining' && player.isAtDome()) {
                    player.depositResources();
                    gameState = 'upgradeMenu';
                }
            }

            // Close upgrade menu
            if (e.key === 'Escape') {
                if (gameState === 'upgradeMenu') {
                    gameState = 'mining';
                } else if (gameState === 'mining' || gameState === 'defense') {
                    // Do nothing, keep playing
                }
            }

            // Start game
            if (e.key === 'Enter') {
                if (gameState === 'menu') {
                    startGame();
                } else if (gameState === 'dead' || gameState === 'victory') {
                    gameState = 'menu';
                }
            }

            // Teleport to dome (if upgraded)
            if (e.key.toLowerCase() === 't' && player && player.canTeleport && gameState === 'mining') {
                player.x = dome.x;
                player.y = dome.y + 30;
            }
        });

        document.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
            mouse.worldX = mouse.x + camera.x;
            mouse.worldY = mouse.y + camera.y;
        });

        canvas.addEventListener('mousedown', (e) => {
            mouse.down = true;

            // Handle upgrade menu clicks
            if (gameState === 'upgradeMenu') {
                handleUpgradeClick(mouse.x, mouse.y);
            }
        });

        canvas.addEventListener('mouseup', () => {
            mouse.down = false;
        });
    }

    function handleUpgradeClick(x, y) {
        // Check which upgrade was clicked
        const upgradeKeys = Object.keys(UPGRADES);
        const startY = 120;
        const itemHeight = 35;

        for (let i = 0; i < upgradeKeys.length; i++) {
            const key = upgradeKeys[i];
            const upgrade = UPGRADES[key];

            // Check if already purchased
            if (player.upgrades.has(key)) continue;

            // Check requirements
            if (upgrade.requires && !player.upgrades.has(upgrade.requires)) continue;

            const itemY = startY + i * itemHeight;

            if (x >= 50 && x <= 400 && y >= itemY && y <= itemY + 30) {
                // Try to purchase
                if (canAfford(upgrade.cost)) {
                    purchaseUpgrade(key, upgrade);
                }
                break;
            }
        }
    }

    function canAfford(cost) {
        for (const [resource, amount] of Object.entries(cost)) {
            if (dome[resource] < amount) return false;
        }
        return true;
    }

    function purchaseUpgrade(key, upgrade) {
        // Deduct cost
        for (const [resource, amount] of Object.entries(upgrade.cost)) {
            dome[resource] -= amount;
        }

        // Apply effects
        const effects = upgrade.effect;
        if (effects.drillSpeedMult) player.drillSpeedMult *= effects.drillSpeedMult;
        if (effects.drillStrength) player.drillStrength += effects.drillStrength;
        if (effects.carryCapacity) player.carryCapacity += effects.carryCapacity;
        if (effects.moveSpeedMult) player.moveSpeedMult *= effects.moveSpeedMult;
        if (effects.canTeleport) player.canTeleport = true;
        if (effects.laserDamageMult) dome.laserDamageMult *= effects.laserDamageMult;
        if (effects.laserSpeedMult) dome.laserSpeedMult *= effects.laserSpeedMult;
        if (effects.domeMaxHP) {
            dome.maxHP += effects.domeMaxHP;
            dome.hp += effects.domeMaxHP;
        }

        player.upgrades.add(key);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DRAWING
    // ═══════════════════════════════════════════════════════════════════════════

    function draw() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.save();
        ctx.translate(-camera.x + screenShake.x, -camera.y + screenShake.y);

        switch (gameState) {
            case 'menu':
                ctx.restore();
                drawMenu();
                break;
            case 'mining':
            case 'defense':
                drawGame();
                ctx.restore();
                drawUI();
                drawDamageFlash(ctx);
                break;
            case 'upgradeMenu':
                drawGame();
                ctx.restore();
                drawUI();
                drawUpgradeMenu();
                break;
            case 'dead':
                drawGame();
                ctx.restore();
                drawDead();
                break;
            case 'victory':
                drawGame();
                ctx.restore();
                drawVictory();
                break;
            default:
                ctx.restore();
        }
    }

    function drawMenu() {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#88ccff';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('UNDERGROUND KEEPER', CANVAS_WIDTH / 2, 180);

        ctx.fillStyle = '#888888';
        ctx.font = '16px monospace';
        ctx.fillText('Dome Keeper Clone', CANVAS_WIDTH / 2, 220);

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px monospace';
        ctx.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, 320);

        ctx.fillStyle = '#aaaaaa';
        ctx.font = '12px monospace';
        const instructions = [
            'WASD - Move & Dig',
            'Mouse - Aim laser (defense phase)',
            'Click - Fire laser',
            'E - Deposit resources / Open upgrades',
            'T - Teleport to dome (requires upgrade)'
        ];

        instructions.forEach((text, i) => {
            ctx.fillText(text, CANVAS_WIDTH / 2, 400 + i * 20);
        });
    }

    function drawGame() {
        // Sky background
        ctx.fillStyle = COLORS.sky;
        ctx.fillRect(camera.x, camera.y - 100, CANVAS_WIDTH, 200);

        // Draw tiles
        const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE));
        const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE));
        const endX = Math.min(MAP_WIDTH, startX + VIEW_TILES_X + 2);
        const endY = Math.min(MAP_HEIGHT, startY + VIEW_TILES_Y + 2);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tileType = tileMap[y]?.[x];
                if (!tileType || tileType === 'air') continue;

                const tileData = TILE_TYPES[tileType];
                if (!tileData) continue;

                ctx.fillStyle = tileData.color;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

                // Add slight variation
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                if ((x + y) % 2 === 0) {
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }

                // Resource glow
                if (tileType.includes('Ore') || tileType.includes('Crystal')) {
                    ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    ctx.beginPath();
                    ctx.arc(
                        x * TILE_SIZE + TILE_SIZE/2,
                        y * TILE_SIZE + TILE_SIZE/2,
                        TILE_SIZE/3,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                }
            }
        }

        // Draw dropped resources
        for (const res of droppedResources) {
            const bob = Math.sin(Date.now() / 200 + res.bobOffset) * 2;
            const pulse = 0.7 + Math.sin(Date.now() / 150 + res.bobOffset * 2) * 0.3;
            const color = COLORS[res.type] || '#ffffff';
            const glowColor = COLORS[res.type + 'Glow'] || '#ffffff';

            // Outer pulse glow
            const outerSize = 12 * pulse;
            const outerGrad = ctx.createRadialGradient(res.x, res.y + bob, 0, res.x, res.y + bob, outerSize);
            outerGrad.addColorStop(0, glowColor);
            outerGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = outerGrad;
            ctx.globalAlpha = 0.3 * pulse;
            ctx.beginPath();
            ctx.arc(res.x, res.y + bob, outerSize, 0, Math.PI * 2);
            ctx.fill();

            // Inner glow
            const innerGrad = ctx.createRadialGradient(res.x, res.y + bob, 0, res.x, res.y + bob, 8);
            innerGrad.addColorStop(0, '#ffffff');
            innerGrad.addColorStop(0.5, glowColor);
            innerGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = innerGrad;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(res.x, res.y + bob, 8, 0, Math.PI * 2);
            ctx.fill();

            // Core resource
            ctx.globalAlpha = 1;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(res.x, res.y + bob, 5, 0, Math.PI * 2);
            ctx.fill();

            // Bright center
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(res.x - 1, res.y + bob - 1, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Occasional sparkle particles
            if (Math.random() < 0.02) {
                spawnResourceSparkle(res.x, res.y, glowColor);
            }
        }

        // Draw dome
        dome.draw(ctx);

        // Draw player
        player.draw(ctx);

        // Draw enemies
        for (const enemy of enemies) {
            enemy.draw(ctx);
        }

        // Draw projectiles
        for (const proj of projectiles) {
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw particles
        drawParticles(ctx);

        // Draw floating texts
        drawFloatingTexts(ctx);
    }

    function drawUI() {
        // Top bar
        ctx.fillStyle = 'rgba(20, 20, 40, 0.9)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, 50);

        // Phase indicator
        ctx.fillStyle = gameState === 'defense' ? '#ff4444' : '#44ff44';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(gameState === 'defense' ? 'DEFENSE PHASE' : 'MINING PHASE', 15, 20);

        // Wave / Timer
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        if (gameState === 'mining') {
            ctx.fillText(`Next wave in: ${Math.ceil(phaseTimer)}s`, 15, 38);
        } else {
            ctx.fillText(`Wave ${currentWave} - Enemies: ${enemies.length}`, 15, 38);
        }

        // Resources
        ctx.textAlign = 'right';
        ctx.fillStyle = COLORS.iron;
        ctx.fillText(`Iron: ${dome.iron}`, CANVAS_WIDTH - 15, 20);
        ctx.fillStyle = COLORS.water;
        ctx.fillText(`Water: ${dome.water}`, CANVAS_WIDTH - 15, 35);
        ctx.fillStyle = COLORS.cobalt;
        ctx.fillText(`Cobalt: ${dome.cobalt}`, CANVAS_WIDTH - 120, 20);

        // Dome HP with critical warning
        const hpBarWidth = 200;
        const hpBarHeight = 10;
        const hpBarX = CANVAS_WIDTH / 2 - hpBarWidth / 2;
        const hpBarY = 20;

        const isCritical = dome.hp <= dome.maxHP * 0.25;
        const pulse = isCritical ? 0.6 + Math.sin(Date.now() * 0.01) * 0.4 : 1;

        ctx.fillStyle = '#333333';
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

        if (isCritical) {
            ctx.fillStyle = `rgba(255, 68, 68, ${pulse})`;
        } else {
            ctx.fillStyle = dome.hp > dome.maxHP * 0.3 ? '#44ff44' : '#ff4444';
        }
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth * (dome.hp / dome.maxHP), hpBarHeight);

        // HP bar border
        ctx.strokeStyle = isCritical ? `rgba(255, 100, 100, ${pulse})` : '#555555';
        ctx.lineWidth = 1;
        ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.ceil(dome.hp)}/${dome.maxHP}`, CANVAS_WIDTH / 2, hpBarY + 9);

        // Critical warning text
        if (isCritical) {
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('CRITICAL!', CANVAS_WIDTH / 2, hpBarY + 22);
            ctx.restore();
        }

        // Wave timer progress bar (during mining phase)
        if (gameState === 'mining') {
            const timerBarWidth = 150;
            const timerBarHeight = 6;
            const timerBarX = CANVAS_WIDTH / 2 - timerBarWidth / 2;
            const timerBarY = 40;
            const maxPhaseTime = 75;
            const progress = phaseTimer / maxPhaseTime;

            ctx.fillStyle = '#222244';
            ctx.fillRect(timerBarX, timerBarY, timerBarWidth, timerBarHeight);
            ctx.fillStyle = progress > 0.3 ? '#44aaff' : '#ff8844';
            ctx.fillRect(timerBarX, timerBarY, timerBarWidth * progress, timerBarHeight);
        }

        // Player inventory (bottom)
        ctx.fillStyle = 'rgba(20, 20, 40, 0.8)';
        ctx.fillRect(0, CANVAS_HEIGHT - 30, 200, 30);

        ctx.fillStyle = '#ffffff';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Carrying:', 10, CANVAS_HEIGHT - 12);
        ctx.fillStyle = COLORS.iron;
        ctx.fillText(`${player.inventory.iron}`, 80, CANVAS_HEIGHT - 12);
        ctx.fillStyle = COLORS.water;
        ctx.fillText(`${player.inventory.water}`, 100, CANVAS_HEIGHT - 12);
        ctx.fillStyle = COLORS.cobalt;
        ctx.fillText(`${player.inventory.cobalt}`, 120, CANVAS_HEIGHT - 12);

        ctx.fillStyle = '#888888';
        ctx.fillText(`(${player.carryingCount}/${player.carryCapacity})`, 150, CANVAS_HEIGHT - 12);

        // Instructions
        if (gameState === 'mining' && player.isAtDome()) {
            ctx.fillStyle = '#ffff44';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Press E to deposit & upgrade', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
        }
    }

    function drawUpgradeMenu() {
        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Menu background
        ctx.fillStyle = '#222244';
        ctx.fillRect(30, 70, 440, 460);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('UPGRADES', 50, 100);

        // Resources
        ctx.font = '12px monospace';
        ctx.fillStyle = COLORS.iron;
        ctx.fillText(`Iron: ${dome.iron}`, 300, 100);
        ctx.fillStyle = COLORS.water;
        ctx.fillText(`Water: ${dome.water}`, 370, 100);
        ctx.fillStyle = COLORS.cobalt;
        ctx.fillText(`Cobalt: ${dome.cobalt}`, 300, 115);

        // List upgrades
        const upgradeKeys = Object.keys(UPGRADES);
        const startY = 140;
        const itemHeight = 35;

        for (let i = 0; i < upgradeKeys.length; i++) {
            const key = upgradeKeys[i];
            const upgrade = UPGRADES[key];
            const itemY = startY + i * itemHeight;

            // Check if purchased
            const purchased = player.upgrades.has(key);
            const locked = upgrade.requires && !player.upgrades.has(upgrade.requires);
            const affordable = canAfford(upgrade.cost);

            if (purchased) {
                ctx.fillStyle = '#44aa44';
            } else if (locked) {
                ctx.fillStyle = '#555555';
            } else if (affordable) {
                ctx.fillStyle = '#4488ff';
            } else {
                ctx.fillStyle = '#884444';
            }

            ctx.fillRect(50, itemY, 350, 28);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px monospace';
            ctx.fillText(upgrade.name, 60, itemY + 18);

            // Cost
            if (!purchased) {
                let costText = '';
                for (const [res, amt] of Object.entries(upgrade.cost)) {
                    costText += `${amt} ${res} `;
                }
                ctx.fillStyle = affordable ? '#88ff88' : '#ff8888';
                ctx.fillText(costText, 220, itemY + 18);
            } else {
                ctx.fillStyle = '#88ff88';
                ctx.fillText('PURCHASED', 220, itemY + 18);
            }
        }

        // Close instruction
        ctx.fillStyle = '#888888';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Press ESC to close', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    }

    function drawDead() {
        ctx.fillStyle = 'rgba(80, 0, 0, 0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DOME DESTROYED', CANVAS_WIDTH / 2, 120);

        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.fillText(`Survived ${currentWave} waves`, CANVAS_WIDTH / 2, 170);

        // Run statistics
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#cccccc';
        ctx.fillText('─── RUN STATISTICS ───', CANVAS_WIDTH / 2, 220);

        ctx.font = '14px monospace';
        const stats = [
            { label: 'Enemies Killed', value: runStats.enemiesKilled, color: '#ff8888' },
            { label: 'Iron Collected', value: runStats.ironCollected, color: COLORS.ironGlow },
            { label: 'Water Collected', value: runStats.waterCollected, color: COLORS.waterGlow },
            { label: 'Cobalt Collected', value: runStats.cobaltCollected, color: COLORS.cobaltGlow },
            { label: 'Tiles Mined', value: runStats.tilesMined, color: '#aaaaaa' }
        ];

        let y = 260;
        for (const stat of stats) {
            ctx.fillStyle = '#888888';
            ctx.textAlign = 'right';
            ctx.fillText(stat.label + ':', CANVAS_WIDTH / 2 - 10, y);
            ctx.fillStyle = stat.color;
            ctx.textAlign = 'left';
            ctx.fillText(stat.value, CANVAS_WIDTH / 2 + 10, y);
            y += 26;
        }

        ctx.fillStyle = '#666666';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Press ENTER to Return to Menu', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
    }

    function drawVictory() {
        ctx.fillStyle = 'rgba(0, 60, 0, 0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#44ff44';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', CANVAS_WIDTH / 2, 250);

        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.fillText(`Completed ${currentWave} waves`, CANVAS_WIDTH / 2, 320);

        ctx.font = '16px monospace';
        ctx.fillText('Press ENTER to Return to Menu', CANVAS_WIDTH / 2, 400);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME LOOP
    // ═══════════════════════════════════════════════════════════════════════════

    function update(dt) {
        if (gameState !== 'mining' && gameState !== 'defense') return;

        // Update player
        player.update(dt);

        // Update dome
        dome.update(dt);

        // Update enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update(dt);
            if (enemies[i].hp <= 0) {
                enemies.splice(i, 1);
            }
        }

        // Update projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // Check dome collision
            if (p.fromEnemy) {
                const dx = p.x - dome.x;
                const dy = p.y - dome.y;
                if (Math.sqrt(dx*dx + dy*dy) < 40) {
                    dome.takeDamage(p.damage);
                    projectiles.splice(i, 1);
                    continue;
                }
            }

            // Remove if off screen
            if (p.y < camera.y - 100 || p.y > camera.y + CANVAS_HEIGHT + 100) {
                projectiles.splice(i, 1);
            }
        }

        // Update particles
        updateParticles(dt);

        // Update screen shake
        updateScreenShake(dt);

        // Update damage flash and floating texts
        updateDamageFlash(dt);
        updateFloatingTexts(dt);

        // Update camera
        updateCamera();

        // Phase timer (mining)
        if (gameState === 'mining') {
            phaseTimer -= dt;
            if (phaseTimer <= 0) {
                startDefensePhase();
            }
        }

        // Check wave complete
        if (gameState === 'defense') {
            checkWaveComplete();
        }

        // Victory condition (wave 15 for demo)
        if (currentWave >= 15 && enemies.length === 0 && !waveInProgress) {
            gameState = 'victory';
        }
    }

    function gameLoop(timestamp) {
        deltaTime = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        if (deltaTime > 0.1) deltaTime = 0.1;

        update(deltaTime);
        draw();

        requestAnimationFrame(gameLoop);

        // AUTO-START: Skip menu and start game directly
        setTimeout(() => startGame(), 100);
    }

    function startGame() {
        generateMap();

        player = new Player(DOME_X, DOME_Y + 2);
        dome = new Dome(DOME_X, DOME_Y);

        enemies = [];
        projectiles = [];
        particles = [];
        droppedResources = [];
        floatingTexts = [];

        currentWave = 0;
        phaseTimer = 75;
        waveInProgress = false;
        damageFlash = 0;

        // Reset stats
        runStats = {
            ironCollected: 0,
            waterCollected: 0,
            cobaltCollected: 0,
            enemiesKilled: 0,
            damageDealt: 0,
            tilesMined: 0,
            wavesCompleted: 0
        };

        camera.x = player.x - CANVAS_WIDTH / 2;
        camera.y = player.y - CANVAS_HEIGHT / 2;

        gameState = 'mining';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    function init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');

        setupInput();

        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST HARNESS GETTERS
    // ═══════════════════════════════════════════════════════════════════════════

    window.getPlayer = function() { return player; };
    window.getDome = function() { return dome; };
    window.getEnemies = function() { return enemies; };
    window.getTileMap = function() { return tileMap; };
    window.getDroppedResources = function() { return droppedResources; };
    window.getCurrentWave = function() { return currentWave; };
    window.getPhaseTimer = function() { return phaseTimer; };
    window.getKeys = function() { return keys; };
    window.gameState = function() { return { state: gameState, wave: currentWave }; };
    window.getResources = function() {
        return dome ? { iron: dome.iron, water: dome.water, cobalt: dome.cobalt } : {};
    };
    window.getCamera = function() { return camera; };
    window.getPurchasedUpgrades = function() {
        return player && player.upgrades ? Array.from(player.upgrades) : [];
    };
    window.isShopOpen = function() { return gameState === 'upgradeMenu'; };
    window.startWave = function() {
        if (gameState === 'mining') {
            gameState = 'defending';
            waveTimer = 0;
            spawnWave();
        }
    };

    window.TILE_TYPES = TILE_TYPES;
    window.ENEMY_DATA = ENEMY_DATA;
    window.UPGRADES = UPGRADES;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
