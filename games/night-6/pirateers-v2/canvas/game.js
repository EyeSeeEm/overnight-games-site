// Pirateers Clone - Canvas Implementation with Test Harness
// Agent 2 - Night 6

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════════
    const CANVAS_WIDTH = 960;
    const CANVAS_HEIGHT = 640;
    const WORLD_WIDTH = 2400;
    const WORLD_HEIGHT = 2400;

    // Ship
    const SHIP_BASE_SPEED = 150;
    const SHIP_TURN_RATE = 90; // degrees/sec
    const SHIP_BASE_ARMOR = 100;
    const CANNON_COOLDOWN = 2.0;
    const CANNON_RANGE = 300;
    const CANNON_SPEED = 400;
    const CANNON_DAMAGE = 10;

    // Day cycle
    const DAY_DURATION = 120; // seconds (reduced for testing)

    // Colors
    const COLORS = {
        ocean: '#1a4a7a',
        oceanDark: '#0f3055',
        ship: '#8B4513',
        shipHighlight: '#A0522D',
        enemy: '#4a4a4a',
        enemyHostile: '#8B0000',
        merchant: '#228B22',
        cannonball: '#2F4F4F',
        loot: '#FFD700',
        lootGlow: '#FFA500',
        healthBar: '#48BB78',
        healthBarDamage: '#E53E3E',
        uiBackground: 'rgba(26, 32, 44, 0.9)',
        uiText: '#F7FAFC',
        minimap: 'rgba(0, 50, 100, 0.7)',
        minimapPlayer: '#FFD700',
        minimapEnemy: '#FF4444'
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME STATE
    // ═══════════════════════════════════════════════════════════════════════════
    let canvas, ctx;
    let gamePaused = true;
    let gameState = 'menu'; // 'menu', 'playing', 'gameover', 'dayend'
    let lastTime = 0;
    let deltaTime = 0;

    // Input
    let keysDown = {};
    let activeKeys = new Set();

    // Camera
    let camera = { x: 0, y: 0 };

    // Game objects
    let player = null;
    let enemies = [];
    let cannonballs = [];
    let lootItems = [];
    let particles = [];
    let floatingTexts = [];
    let islands = [];

    // Day system
    let dayTimer = DAY_DURATION;
    let dayNumber = 1;
    let gold = 0;

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

    function angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    function normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }

    function worldToScreen(worldX, worldY) {
        return {
            x: worldX - camera.x,
            y: worldY - camera.y
        };
    }

    function circleCollision(x1, y1, r1, x2, y2, r2) {
        return distance(x1, y1, x2, y2) < r1 + r2;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WORLD GENERATION
    // ═══════════════════════════════════════════════════════════════════════════
    function generateWorld() {
        enemies = [];
        lootItems = [];
        cannonballs = [];
        islands = [];

        // Generate islands
        const islandCount = randomInt(8, 15);
        for (let i = 0; i < islandCount; i++) {
            const x = randomRange(200, WORLD_WIDTH - 200);
            const y = randomRange(200, WORLD_HEIGHT - 200);
            const radius = randomRange(50, 120);

            // Don't spawn near center where player starts
            if (distance(x, y, WORLD_WIDTH / 2, WORLD_HEIGHT / 2) < 300) continue;

            islands.push({ x, y, radius });
        }

        // Generate enemies
        const enemyCount = randomInt(6, 10);
        for (let i = 0; i < enemyCount; i++) {
            let x, y, attempts = 0;
            do {
                x = randomRange(300, WORLD_WIDTH - 300);
                y = randomRange(300, WORLD_HEIGHT - 300);
                attempts++;
            } while (attempts < 20 && (
                distance(x, y, WORLD_WIDTH / 2, WORLD_HEIGHT / 2) < 400 ||
                collidesWithIslands(x, y, 30)
            ));

            const types = ['merchant', 'navy', 'navy', 'pirate'];
            const type = types[randomInt(0, types.length - 1)];
            enemies.push(new EnemyShip(x, y, type));
        }

        return { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 };
    }

    function collidesWithIslands(x, y, radius) {
        for (const island of islands) {
            if (distance(x, y, island.x, island.y) < radius + island.radius + 20) {
                return true;
            }
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PLAYER SHIP CLASS
    // ═══════════════════════════════════════════════════════════════════════════
    class PlayerShip {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.angle = -Math.PI / 2; // Facing up
            this.length = 40;
            this.width = 15;

            // Stats
            this.armor = SHIP_BASE_ARMOR;
            this.maxArmor = SHIP_BASE_ARMOR;
            this.baseSpeed = SHIP_BASE_SPEED;
            this.turnRate = SHIP_TURN_RATE * Math.PI / 180;
            this.firepower = CANNON_DAMAGE;
            this.cannonCooldown = 0;

            // Movement
            this.throttle = 0; // 0, 0.25, 0.5, 1.0
            this.targetThrottle = 0;

            // Cargo
            this.cargo = [];
            this.maxCargo = 10;

            // Invincibility
            this.iframes = 0;
        }

        update(dt) {
            // Update cooldowns
            if (this.cannonCooldown > 0) this.cannonCooldown -= dt;
            if (this.iframes > 0) this.iframes -= dt;

            // Handle turning
            if (activeKeys.has('a') || activeKeys.has('A') || activeKeys.has('ArrowLeft')) {
                this.angle -= this.turnRate * dt;
            }
            if (activeKeys.has('d') || activeKeys.has('D') || activeKeys.has('ArrowRight')) {
                this.angle += this.turnRate * dt;
            }

            // Handle throttle
            if (activeKeys.has('w') || activeKeys.has('W') || activeKeys.has('ArrowUp')) {
                this.targetThrottle = Math.min(1, this.targetThrottle + dt * 0.5);
            }
            if (activeKeys.has('s') || activeKeys.has('S') || activeKeys.has('ArrowDown')) {
                this.targetThrottle = Math.max(0, this.targetThrottle - dt * 0.5);
            }

            // Smooth throttle
            this.throttle = lerp(this.throttle, this.targetThrottle, dt * 3);

            // Move
            const speed = this.baseSpeed * this.throttle;
            this.x += Math.cos(this.angle) * speed * dt;
            this.y += Math.sin(this.angle) * speed * dt;

            // Fire cannons
            if ((activeKeys.has(' ')) && this.cannonCooldown <= 0) {
                this.fireCannons();
            }

            // Island collision
            this.handleIslandCollision();

            // World bounds
            this.x = clamp(this.x, 50, WORLD_WIDTH - 50);
            this.y = clamp(this.y, 50, WORLD_HEIGHT - 50);

            // Collect loot
            this.collectLoot();
        }

        fireCannons() {
            this.cannonCooldown = CANNON_COOLDOWN;

            // Fire from both sides
            const perpAngle = this.angle + Math.PI / 2;

            // Port side (left)
            for (let i = 0; i < 3; i++) {
                const spread = (i - 1) * 15 * Math.PI / 180;
                cannonballs.push(new Cannonball(
                    this.x + Math.cos(perpAngle) * 12,
                    this.y + Math.sin(perpAngle) * 12,
                    perpAngle + spread,
                    this.firepower,
                    true
                ));
            }

            // Starboard side (right)
            for (let i = 0; i < 3; i++) {
                const spread = (i - 1) * 15 * Math.PI / 180;
                cannonballs.push(new Cannonball(
                    this.x - Math.cos(perpAngle) * 12,
                    this.y - Math.sin(perpAngle) * 12,
                    perpAngle + Math.PI + spread,
                    this.firepower,
                    true
                ));
            }

            // Muzzle flash
            for (let i = 0; i < 4; i++) {
                spawnParticle(
                    this.x + Math.cos(perpAngle) * 15 * (Math.random() > 0.5 ? 1 : -1),
                    this.y + Math.sin(perpAngle) * 15 * (Math.random() > 0.5 ? 1 : -1),
                    '#FFA500',
                    0.2
                );
            }
        }

        handleIslandCollision() {
            for (const island of islands) {
                const dist = distance(this.x, this.y, island.x, island.y);
                const minDist = this.length / 2 + island.radius;
                if (dist < minDist) {
                    const angle = angleBetween(island.x, island.y, this.x, this.y);
                    this.x = island.x + Math.cos(angle) * minDist;
                    this.y = island.y + Math.sin(angle) * minDist;
                    this.throttle *= 0.5;
                }
            }
        }

        collectLoot() {
            for (let i = lootItems.length - 1; i >= 0; i--) {
                const loot = lootItems[i];
                if (distance(this.x, this.y, loot.x, loot.y) < 40) {
                    gold += loot.value;
                    floatingTexts.push({
                        x: loot.x,
                        y: loot.y,
                        text: `+${loot.value}g`,
                        color: '#FFD700',
                        life: 1.0
                    });
                    lootItems.splice(i, 1);
                }
            }
        }

        takeDamage(amount) {
            if (this.iframes > 0) return;

            this.armor -= amount;
            this.iframes = 0.3;

            floatingTexts.push({
                x: this.x,
                y: this.y - 30,
                text: `-${amount}`,
                color: COLORS.healthBarDamage,
                life: 0.8
            });

            if (this.armor <= 0) {
                this.armor = 0;
                gameState = 'gameover';
            }
        }

        render(ctx) {
            const screen = worldToScreen(this.x, this.y);

            ctx.save();
            ctx.translate(screen.x, screen.y);
            ctx.rotate(this.angle + Math.PI / 2);

            // Ship body
            ctx.fillStyle = this.iframes > 0 ? '#FFFFFF' : COLORS.ship;
            ctx.beginPath();
            ctx.moveTo(0, -this.length / 2);
            ctx.lineTo(-this.width / 2, this.length / 2);
            ctx.lineTo(this.width / 2, this.length / 2);
            ctx.closePath();
            ctx.fill();

            // Deck
            ctx.fillStyle = COLORS.shipHighlight;
            ctx.fillRect(-this.width / 3, -this.length / 4, this.width / 1.5, this.length / 2);

            // Mast
            ctx.fillStyle = '#654321';
            ctx.fillRect(-2, -this.length / 4, 4, this.length / 3);

            // Sail
            ctx.fillStyle = '#F5F5DC';
            ctx.globalAlpha = 0.3 + this.throttle * 0.7;
            ctx.beginPath();
            ctx.ellipse(0, -this.length / 6, 10, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            ctx.restore();

            // Cannon cooldown indicator
            if (this.cannonCooldown > 0) {
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(screen.x, screen.y, this.length / 2 + 10, -Math.PI / 2,
                    -Math.PI / 2 + (1 - this.cannonCooldown / CANNON_COOLDOWN) * Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENEMY SHIP CLASS
    // ═══════════════════════════════════════════════════════════════════════════
    class EnemyShip {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.angle = Math.random() * Math.PI * 2;
            this.length = 35;
            this.width = 12;

            this.setTypeStats();

            this.state = 'patrol';
            this.patrolTarget = { x: x, y: y };
            this.cannonCooldown = 0;
            this.patrolTimer = randomRange(2, 5);
        }

        setTypeStats() {
            switch (this.type) {
                case 'merchant':
                    this.hp = 50;
                    this.maxHp = 50;
                    this.speed = 60;
                    this.damage = 5;
                    this.goldDrop = randomInt(20, 40);
                    this.color = COLORS.merchant;
                    this.aggressive = false;
                    break;
                case 'navy':
                    this.hp = 80;
                    this.maxHp = 80;
                    this.speed = 100;
                    this.damage = 12;
                    this.goldDrop = randomInt(30, 50);
                    this.color = '#4169E1';
                    this.aggressive = true;
                    break;
                case 'pirate':
                    this.hp = 100;
                    this.maxHp = 100;
                    this.speed = 120;
                    this.damage = 15;
                    this.goldDrop = randomInt(40, 70);
                    this.color = COLORS.enemyHostile;
                    this.aggressive = true;
                    break;
                default:
                    this.hp = 60;
                    this.maxHp = 60;
                    this.speed = 80;
                    this.damage = 8;
                    this.goldDrop = randomInt(25, 45);
                    this.color = COLORS.enemy;
                    this.aggressive = false;
            }
        }

        update(dt) {
            if (this.cannonCooldown > 0) this.cannonCooldown -= dt;

            const distToPlayer = distance(this.x, this.y, player.x, player.y);

            switch (this.state) {
                case 'patrol':
                    this.updatePatrol(dt);
                    if (this.aggressive && distToPlayer < 400) {
                        this.state = 'attack';
                    } else if (!this.aggressive && distToPlayer < 200) {
                        this.state = 'flee';
                    }
                    break;

                case 'attack':
                    this.updateAttack(dt);
                    if (distToPlayer > 500) {
                        this.state = 'patrol';
                    }
                    break;

                case 'flee':
                    this.updateFlee(dt);
                    if (distToPlayer > 400) {
                        this.state = 'patrol';
                    }
                    break;
            }

            // Island collision
            this.handleIslandCollision();

            // World bounds
            this.x = clamp(this.x, 50, WORLD_WIDTH - 50);
            this.y = clamp(this.y, 50, WORLD_HEIGHT - 50);
        }

        updatePatrol(dt) {
            this.patrolTimer -= dt;
            if (this.patrolTimer <= 0) {
                this.patrolTarget = {
                    x: this.x + randomRange(-200, 200),
                    y: this.y + randomRange(-200, 200)
                };
                this.patrolTarget.x = clamp(this.patrolTarget.x, 100, WORLD_WIDTH - 100);
                this.patrolTarget.y = clamp(this.patrolTarget.y, 100, WORLD_HEIGHT - 100);
                this.patrolTimer = randomRange(3, 6);
            }

            this.moveToward(this.patrolTarget.x, this.patrolTarget.y, dt, 0.5);
        }

        updateAttack(dt) {
            const distToPlayer = distance(this.x, this.y, player.x, player.y);

            // Try to position for broadside
            const angleToPlayer = angleBetween(this.x, this.y, player.x, player.y);
            const desiredAngle = angleToPlayer + Math.PI / 2; // Perpendicular

            // Approach from side
            if (distToPlayer > 200) {
                this.moveToward(player.x, player.y, dt, 0.8);
            } else if (distToPlayer < 100) {
                // Back off slightly
                const fleeAngle = angleBetween(player.x, player.y, this.x, this.y);
                this.x += Math.cos(fleeAngle) * this.speed * 0.3 * dt;
                this.y += Math.sin(fleeAngle) * this.speed * 0.3 * dt;
            }

            // Rotate to face broadside
            this.rotateToward(desiredAngle, dt);

            // Fire if in range and roughly facing
            if (distToPlayer < CANNON_RANGE && this.cannonCooldown <= 0) {
                this.fireCannons();
            }
        }

        updateFlee(dt) {
            const fleeAngle = angleBetween(player.x, player.y, this.x, this.y);
            this.moveToward(
                this.x + Math.cos(fleeAngle) * 200,
                this.y + Math.sin(fleeAngle) * 200,
                dt, 1.0
            );
        }

        moveToward(tx, ty, dt, speedMult) {
            const angle = angleBetween(this.x, this.y, tx, ty);
            this.rotateToward(angle, dt);

            // Move forward if facing target
            const angleDiff = Math.abs(normalizeAngle(angle - this.angle));
            if (angleDiff < Math.PI / 3) {
                this.x += Math.cos(this.angle) * this.speed * speedMult * dt;
                this.y += Math.sin(this.angle) * this.speed * speedMult * dt;
            }
        }

        rotateToward(targetAngle, dt) {
            const angleDiff = normalizeAngle(targetAngle - this.angle);
            const turnAmount = SHIP_TURN_RATE * Math.PI / 180 * dt;

            if (Math.abs(angleDiff) < turnAmount) {
                this.angle = targetAngle;
            } else if (angleDiff > 0) {
                this.angle += turnAmount;
            } else {
                this.angle -= turnAmount;
            }
        }

        fireCannons() {
            this.cannonCooldown = 2.5;

            const perpAngle = this.angle + Math.PI / 2;

            // Fire from closer side to player
            const angleToPlayer = angleBetween(this.x, this.y, player.x, player.y);
            const leftAngle = normalizeAngle(perpAngle - angleToPlayer);
            const rightAngle = normalizeAngle(perpAngle + Math.PI - angleToPlayer);

            const fireAngle = Math.abs(leftAngle) < Math.abs(rightAngle) ? perpAngle : perpAngle + Math.PI;

            for (let i = 0; i < 2; i++) {
                const spread = (i - 0.5) * 20 * Math.PI / 180;
                cannonballs.push(new Cannonball(
                    this.x + Math.cos(fireAngle) * 10,
                    this.y + Math.sin(fireAngle) * 10,
                    fireAngle + spread,
                    this.damage,
                    false
                ));
            }
        }

        handleIslandCollision() {
            for (const island of islands) {
                const dist = distance(this.x, this.y, island.x, island.y);
                const minDist = this.length / 2 + island.radius;
                if (dist < minDist) {
                    const angle = angleBetween(island.x, island.y, this.x, this.y);
                    this.x = island.x + Math.cos(angle) * minDist;
                    this.y = island.y + Math.sin(angle) * minDist;
                }
            }
        }

        takeDamage(amount) {
            this.hp -= amount;

            for (let i = 0; i < 2; i++) {
                spawnParticle(this.x, this.y, '#8B4513', 0.3);
            }

            if (this.hp <= 0) {
                this.die();
            }
        }

        die() {
            const idx = enemies.indexOf(this);
            if (idx !== -1) {
                enemies.splice(idx, 1);

                // Drop loot
                lootItems.push({
                    x: this.x + randomRange(-20, 20),
                    y: this.y + randomRange(-20, 20),
                    value: this.goldDrop,
                    life: 60
                });

                // Death particles
                for (let i = 0; i < 12; i++) {
                    spawnParticle(this.x, this.y, this.color, 0.5);
                    spawnParticle(this.x, this.y, '#8B4513', 0.4);
                }
            }
        }

        render(ctx) {
            const screen = worldToScreen(this.x, this.y);

            ctx.save();
            ctx.translate(screen.x, screen.y);
            ctx.rotate(this.angle + Math.PI / 2);

            // Ship body
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, -this.length / 2);
            ctx.lineTo(-this.width / 2, this.length / 2);
            ctx.lineTo(this.width / 2, this.length / 2);
            ctx.closePath();
            ctx.fill();

            ctx.restore();

            // State indicator
            if (this.state === 'attack') {
                ctx.fillStyle = '#E53E3E';
                ctx.font = '14px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('!', screen.x, screen.y - this.length / 2 - 10);
            }

            // Health bar
            if (this.hp < this.maxHp) {
                const barWidth = 30;
                const hpPercent = this.hp / this.maxHp;
                ctx.fillStyle = '#2D3748';
                ctx.fillRect(screen.x - barWidth / 2, screen.y - this.length / 2 - 8, barWidth, 4);
                ctx.fillStyle = COLORS.healthBar;
                ctx.fillRect(screen.x - barWidth / 2, screen.y - this.length / 2 - 8, barWidth * hpPercent, 4);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CANNONBALL CLASS
    // ═══════════════════════════════════════════════════════════════════════════
    class Cannonball {
        constructor(x, y, angle, damage, isPlayer) {
            this.x = x;
            this.y = y;
            this.angle = angle;
            this.speed = CANNON_SPEED;
            this.damage = damage;
            this.isPlayer = isPlayer;
            this.radius = 4;
            this.life = CANNON_RANGE / CANNON_SPEED;
        }

        update(dt) {
            this.x += Math.cos(this.angle) * this.speed * dt;
            this.y += Math.sin(this.angle) * this.speed * dt;
            this.life -= dt;

            if (this.isPlayer) {
                // Hit enemies
                for (const enemy of enemies) {
                    if (distance(this.x, this.y, enemy.x, enemy.y) < enemy.length / 2 + this.radius) {
                        enemy.takeDamage(this.damage);
                        this.life = 0;
                        break;
                    }
                }
            } else {
                // Hit player
                if (distance(this.x, this.y, player.x, player.y) < player.length / 2 + this.radius) {
                    player.takeDamage(this.damage);
                    this.life = 0;
                }
            }

            // Hit islands
            for (const island of islands) {
                if (distance(this.x, this.y, island.x, island.y) < island.radius + this.radius) {
                    this.life = 0;
                    spawnParticle(this.x, this.y, '#888', 0.2);
                    break;
                }
            }
        }

        render(ctx) {
            const screen = worldToScreen(this.x, this.y);
            ctx.fillStyle = COLORS.cannonball;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PARTICLE SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════
    function spawnParticle(x, y, color, duration) {
        particles.push({
            x: x,
            y: y,
            vx: randomRange(-80, 80),
            vy: randomRange(-80, 80),
            color: color,
            life: duration,
            maxLife: duration
        });
    }

    function updateParticles(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
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
        });

        document.addEventListener('keyup', (e) => {
            keysDown[e.key] = false;
            activeKeys.delete(e.key);
        });

        requestAnimationFrame(gameLoop);

        // AUTO-START: Skip menu and start game directly
        setTimeout(() => startGame(), 100);

        console.log('[HARNESS] Pirateers harness initialized, game paused');
    }

    function startGame() {
        const startPos = generateWorld();

        player = new PlayerShip(startPos.x, startPos.y);

        cannonballs = [];
        particles = [];
        floatingTexts = [];

        dayTimer = DAY_DURATION;
        gameState = 'playing';
    }

    function startNewDay() {
        dayNumber++;
        dayTimer = DAY_DURATION;

        // Repair ship
        if (player) {
            player.armor = player.maxArmor;
        }

        // Generate new enemies
        const enemyCount = randomInt(5 + dayNumber, 8 + dayNumber * 2);
        for (let i = 0; i < enemyCount; i++) {
            let x, y, attempts = 0;
            do {
                x = randomRange(300, WORLD_WIDTH - 300);
                y = randomRange(300, WORLD_HEIGHT - 300);
                attempts++;
            } while (attempts < 20 && (
                distance(x, y, player.x, player.y) < 500 ||
                collidesWithIslands(x, y, 30)
            ));

            const types = ['merchant', 'navy', 'navy', 'pirate', 'pirate'];
            const type = types[randomInt(0, types.length - 1)];
            enemies.push(new EnemyShip(x, y, type));
        }

        gameState = 'playing';
    }

    function updateCamera() {
        if (!player) return;

        const targetX = player.x - CANVAS_WIDTH / 2;
        const targetY = player.y - CANVAS_HEIGHT / 2;

        camera.x = lerp(camera.x, targetX, 0.1);
        camera.y = lerp(camera.y, targetY, 0.1);

        camera.x = clamp(camera.x, 0, WORLD_WIDTH - CANVAS_WIDTH);
        camera.y = clamp(camera.y, 0, WORLD_HEIGHT - CANVAS_HEIGHT);
    }

    function update(dt) {
        if (gameState !== 'playing') return;

        // Day timer
        dayTimer -= dt;
        if (dayTimer <= 0) {
            gameState = 'dayend';
            return;
        }

        if (player) {
            player.update(dt);
        }

        for (const enemy of enemies) {
            enemy.update(dt);
        }

        for (let i = cannonballs.length - 1; i >= 0; i--) {
            cannonballs[i].update(dt);
            if (cannonballs[i].life <= 0) {
                cannonballs.splice(i, 1);
            }
        }

        // Update loot life
        for (let i = lootItems.length - 1; i >= 0; i--) {
            lootItems[i].life -= dt;
            if (lootItems[i].life <= 0) {
                lootItems.splice(i, 1);
            }
        }

        updateParticles(dt);

        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            floatingTexts[i].life -= dt;
            floatingTexts[i].y -= 30 * dt;
            if (floatingTexts[i].life <= 0) {
                floatingTexts.splice(i, 1);
            }
        }

        updateCamera();
    }

    function render() {
        // Ocean background
        ctx.fillStyle = COLORS.ocean;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Wave pattern
        ctx.fillStyle = COLORS.oceanDark;
        for (let y = -50; y < CANVAS_HEIGHT + 50; y += 30) {
            for (let x = -50; x < CANVAS_WIDTH + 50; x += 60) {
                const waveOffset = Math.sin((x + camera.x + y + camera.y + Date.now() / 1000) * 0.1) * 5;
                ctx.beginPath();
                ctx.ellipse(x + waveOffset, y, 20, 8, 0, 0, Math.PI * 2);
                ctx.globalAlpha = 0.3;
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        if (gameState === 'menu') {
            renderMenu();
            return;
        }

        if (gameState === 'gameover') {
            renderWorld();
            renderGameOver();
            return;
        }

        if (gameState === 'dayend') {
            renderWorld();
            renderDayEnd();
            return;
        }

        renderWorld();
        renderHUD();
    }

    function renderWorld() {
        // Islands
        for (const island of islands) {
            const screen = worldToScreen(island.x, island.y);
            ctx.fillStyle = '#D2B48C';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, island.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Loot
        for (const loot of lootItems) {
            const screen = worldToScreen(loot.x, loot.y);
            ctx.fillStyle = COLORS.lootGlow;
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.2;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = COLORS.loot;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cannonballs
        for (const cb of cannonballs) {
            cb.render(ctx);
        }

        // Particles
        for (const p of particles) {
            const screen = worldToScreen(p.x, p.y);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillRect(screen.x - 3, screen.y - 3, 6, 6);
        }
        ctx.globalAlpha = 1;

        // Enemies
        for (const enemy of enemies) {
            enemy.render(ctx);
        }

        // Player
        if (player) {
            player.render(ctx);
        }

        // Floating texts
        for (const ft of floatingTexts) {
            const screen = worldToScreen(ft.x, ft.y);
            ctx.fillStyle = ft.color;
            ctx.globalAlpha = ft.life;
            ctx.font = 'bold 16px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, screen.x, screen.y);
            ctx.globalAlpha = 1;
        }
    }

    function renderHUD() {
        // Armor bar
        ctx.fillStyle = COLORS.uiBackground;
        ctx.fillRect(10, 10, 200, 25);
        ctx.fillStyle = player.armor / player.maxArmor > 0.3 ? COLORS.healthBar : COLORS.healthBarDamage;
        ctx.fillRect(12, 12, 196 * (player.armor / player.maxArmor), 21);
        ctx.fillStyle = COLORS.uiText;
        ctx.font = '14px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText(`Armor: ${Math.ceil(player.armor)}/${player.maxArmor}`, 15, 28);

        // Gold
        ctx.fillStyle = COLORS.uiBackground;
        ctx.fillRect(10, 40, 150, 25);
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`Gold: ${gold}`, 15, 58);

        // Day timer
        ctx.fillStyle = COLORS.uiBackground;
        ctx.fillRect(CANVAS_WIDTH - 150, 10, 140, 25);
        ctx.fillStyle = dayTimer < 30 ? '#E53E3E' : COLORS.uiText;
        ctx.textAlign = 'right';
        ctx.fillText(`Day ${dayNumber}: ${Math.ceil(dayTimer)}s`, CANVAS_WIDTH - 20, 28);

        // Throttle
        ctx.fillStyle = COLORS.uiBackground;
        ctx.fillRect(10, CANVAS_HEIGHT - 40, 100, 30);
        ctx.fillStyle = COLORS.uiText;
        ctx.textAlign = 'left';
        ctx.fillText(`Speed: ${Math.round(player.throttle * 100)}%`, 15, CANVAS_HEIGHT - 20);

        // Minimap
        renderMinimap();
    }

    function renderMinimap() {
        const mapSize = 120;
        const mapX = CANVAS_WIDTH - mapSize - 15;
        const mapY = CANVAS_HEIGHT - mapSize - 15;
        const scale = mapSize / WORLD_WIDTH;

        ctx.fillStyle = COLORS.minimap;
        ctx.fillRect(mapX, mapY, mapSize, mapSize);

        // Islands
        ctx.fillStyle = '#D2B48C';
        for (const island of islands) {
            ctx.beginPath();
            ctx.arc(mapX + island.x * scale, mapY + island.y * scale, island.radius * scale, 0, Math.PI * 2);
            ctx.fill();
        }

        // Enemies
        ctx.fillStyle = COLORS.minimapEnemy;
        for (const enemy of enemies) {
            ctx.fillRect(mapX + enemy.x * scale - 2, mapY + enemy.y * scale - 2, 4, 4);
        }

        // Player
        ctx.fillStyle = COLORS.minimapPlayer;
        ctx.fillRect(mapX + player.x * scale - 3, mapY + player.y * scale - 3, 6, 6);
    }

    function renderMenu() {
        ctx.fillStyle = COLORS.uiText;
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('PIRATEERS', CANVAS_WIDTH / 2, 180);

        ctx.font = '20px Courier New';
        ctx.fillText('A/D - Turn Ship', CANVAS_WIDTH / 2, 280);
        ctx.fillText('W/S - Speed Up/Down', CANVAS_WIDTH / 2, 320);
        ctx.fillText('Space - Fire Cannons', CANVAS_WIDTH / 2, 360);

        ctx.fillStyle = '#FFD700';
        ctx.fillText('Destroy enemies, collect gold!', CANVAS_WIDTH / 2, 440);
        ctx.fillText('Survive the day!', CANVAS_WIDTH / 2, 480);

        ctx.fillStyle = COLORS.uiText;
        ctx.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, 560);

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
        ctx.fillText('SHIP DESTROYED', CANVAS_WIDTH / 2, 220);

        ctx.fillStyle = COLORS.uiText;
        ctx.font = '24px Courier New';
        ctx.fillText(`Day ${dayNumber}`, CANVAS_WIDTH / 2, 300);
        ctx.fillText(`Gold Collected: ${gold}`, CANVAS_WIDTH / 2, 340);

        ctx.font = '18px Courier New';
        ctx.fillText('Press ENTER to Try Again', CANVAS_WIDTH / 2, 440);

        if (keysDown['Enter']) {
            gold = 0;
            dayNumber = 1;
            startGame();
        }
    }

    function renderDayEnd() {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#48BB78';
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('DAY COMPLETE', CANVAS_WIDTH / 2, 220);

        ctx.fillStyle = COLORS.uiText;
        ctx.font = '24px Courier New';
        ctx.fillText(`Day ${dayNumber} Finished`, CANVAS_WIDTH / 2, 300);
        ctx.fillText(`Gold: ${gold}`, CANVAS_WIDTH / 2, 340);
        ctx.fillText(`Enemies Remaining: ${enemies.length}`, CANVAS_WIDTH / 2, 380);

        ctx.font = '18px Courier New';
        ctx.fillText('Press ENTER for Next Day', CANVAS_WIDTH / 2, 460);

        if (keysDown['Enter']) {
            startNewDay();
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
                dayTimer: dayTimer,
                dayNumber: dayNumber,
                gold: gold,
                player: player ? {
                    x: player.x,
                    y: player.y,
                    angle: player.angle,
                    armor: player.armor,
                    maxArmor: player.maxArmor,
                    throttle: player.throttle,
                    cannonReady: player.cannonCooldown <= 0
                } : null,
                enemies: enemies.map(e => ({
                    x: e.x,
                    y: e.y,
                    type: e.type,
                    hp: e.hp,
                    state: e.state
                })),
                lootCount: lootItems.length
            };
        },

        getPhase: () => gameState,

        debug: {
            setArmor: (hp) => { if (player) player.armor = hp; },
            addGold: (amount) => { gold += amount; },
            spawnEnemy: (type) => {
                enemies.push(new EnemyShip(player.x + 200, player.y, type || 'pirate'));
            },
            clearEnemies: () => { enemies = []; },
            forceStart: () => {
                gold = 0;
                dayNumber = 1;
                startGame();
            },
            nextDay: () => {
                gameState = 'dayend';
            }
        },

        version: '1.0',

        gameInfo: {
            name: 'Pirateers Clone',
            type: 'naval_action',
            controls: {
                movement: { turn: ['a', 'd'], speed: ['w', 's'] },
                combat: { fire: 'Space' }
            }
        }
    };

    window.addEventListener('load', init);
})();
