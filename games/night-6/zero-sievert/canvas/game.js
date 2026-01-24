// Zero Sievert Clone - Canvas Implementation with Test Harness
// Agent 2 - Night 6

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════════
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const WORLD_WIDTH = 1200;
    const WORLD_HEIGHT = 1200;

    // Player
    const PLAYER_SPEED = 150;
    const SPRINT_MULTIPLIER = 1.6;
    const DODGE_DURATION = 0.3;
    const DODGE_COOLDOWN = 1.5;
    const STAMINA_MAX = 100;
    const STAMINA_SPRINT_DRAIN = 15;
    const STAMINA_REGEN = 8;

    // Combat
    const BULLET_SPEED = 600;
    const PLAYER_MAX_HP = 100;
    const RELOAD_TIME = 1.5;
    const MAGAZINE_SIZE = 30;
    const FIRE_RATE = 0.15; // seconds between shots
    const BULLET_DAMAGE = 25;

    // Extraction
    const EXTRACTION_TIME = 3.0;

    // Colors
    const COLORS = {
        background: '#2D4F3C',
        player: '#4A90D9',
        playerDodge: '#7AB3E8',
        enemy: '#E53E3E',
        enemyAlert: '#FF6B6B',
        ghoul: '#9F7AEA',
        bullet: '#FFE066',
        enemyBullet: '#FF4444',
        extraction: '#48BB78',
        container: '#B87333',
        containerLooted: '#5C4033',
        building: '#4A5568',
        wall: '#2D3748',
        tree: '#228B22',
        blood: '#8B0000',
        healthBar: '#48BB78',
        healthBarDamage: '#E53E3E',
        staminaBar: '#ECC94B',
        uiBackground: 'rgba(26, 32, 44, 0.9)',
        uiText: '#F7FAFC'
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME STATE
    // ═══════════════════════════════════════════════════════════════════════════
    let canvas, ctx;
    let gamePaused = true;
    let gameState = 'menu'; // 'menu', 'playing', 'gameover', 'victory', 'extracted'
    let lastTime = 0;
    let deltaTime = 0;

    // Input
    let keysDown = {};
    let activeKeys = new Set();
    let mouse = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, down: false, worldX: 0, worldY: 0 };

    // Camera
    let camera = { x: 0, y: 0 };

    // Game objects
    let player = null;
    let enemies = [];
    let bullets = [];
    let containers = [];
    let buildings = [];
    let trees = [];
    let extractionPoint = null;
    let particles = [];
    let floatingTexts = [];

    // Stats
    let stats = {
        enemiesKilled: 0,
        containersLooted: 0,
        damageDealt: 0,
        damageTaken: 0,
        extracted: false
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

    function angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
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

    function rectCollision(r1, r2) {
        return r1.x < r2.x + r2.width &&
               r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height &&
               r1.y + r1.height > r2.y;
    }

    function circleRectCollision(cx, cy, radius, rect) {
        const nearestX = clamp(cx, rect.x, rect.x + rect.width);
        const nearestY = clamp(cy, rect.y, rect.y + rect.height);
        const dx = cx - nearestX;
        const dy = cy - nearestY;
        return (dx * dx + dy * dy) < (radius * radius);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WORLD GENERATION
    // ═══════════════════════════════════════════════════════════════════════════
    function generateWorld() {
        buildings = [];
        trees = [];
        containers = [];
        enemies = [];

        // Player start position
        const playerStartX = 100;
        const playerStartY = WORLD_HEIGHT / 2;

        // Extraction point (opposite side)
        extractionPoint = {
            x: WORLD_WIDTH - 150,
            y: randomRange(200, WORLD_HEIGHT - 200),
            radius: 60
        };

        // Generate buildings
        const buildingCount = randomInt(8, 12);
        for (let i = 0; i < buildingCount; i++) {
            let attempts = 0;
            while (attempts < 20) {
                const w = randomInt(80, 150);
                const h = randomInt(60, 120);
                const x = randomRange(200, WORLD_WIDTH - 300);
                const y = randomRange(100, WORLD_HEIGHT - h - 100);

                const building = { x, y, width: w, height: h };

                // Check not too close to player start or extraction
                if (distance(x + w/2, y + h/2, playerStartX, playerStartY) < 150 ||
                    distance(x + w/2, y + h/2, extractionPoint.x, extractionPoint.y) < 150) {
                    attempts++;
                    continue;
                }

                // Check not overlapping other buildings
                let overlaps = false;
                for (const b of buildings) {
                    if (rectCollision(
                        { x: building.x - 30, y: building.y - 30, width: building.width + 60, height: building.height + 60 },
                        b
                    )) {
                        overlaps = true;
                        break;
                    }
                }

                if (!overlaps) {
                    buildings.push(building);
                    break;
                }
                attempts++;
            }
        }

        // Generate trees
        const treeCount = randomInt(40, 60);
        for (let i = 0; i < treeCount; i++) {
            let attempts = 0;
            while (attempts < 10) {
                const x = randomRange(50, WORLD_WIDTH - 50);
                const y = randomRange(50, WORLD_HEIGHT - 50);
                const radius = randomRange(15, 25);

                // Check not in building or too close to start/extraction
                let valid = true;
                for (const b of buildings) {
                    if (circleRectCollision(x, y, radius + 20, b)) {
                        valid = false;
                        break;
                    }
                }
                if (distance(x, y, playerStartX, playerStartY) < 80) valid = false;
                if (distance(x, y, extractionPoint.x, extractionPoint.y) < 100) valid = false;

                if (valid) {
                    trees.push({ x, y, radius });
                    break;
                }
                attempts++;
            }
        }

        // Generate loot containers
        const containerCount = randomInt(6, 10);
        for (let i = 0; i < containerCount; i++) {
            // Place containers near or inside buildings
            if (buildings.length > 0 && Math.random() < 0.7) {
                const building = buildings[randomInt(0, buildings.length - 1)];
                containers.push({
                    x: building.x + randomRange(10, building.width - 30),
                    y: building.y + randomRange(10, building.height - 30),
                    width: 20,
                    height: 20,
                    looted: false,
                    lootValue: randomInt(100, 500)
                });
            } else {
                containers.push({
                    x: randomRange(100, WORLD_WIDTH - 100),
                    y: randomRange(100, WORLD_HEIGHT - 100),
                    width: 20,
                    height: 20,
                    looted: false,
                    lootValue: randomInt(50, 200)
                });
            }
        }

        // Generate enemies
        const enemyCount = randomInt(10, 15);
        for (let i = 0; i < enemyCount; i++) {
            let x, y;
            let attempts = 0;

            do {
                x = randomRange(250, WORLD_WIDTH - 100);
                y = randomRange(100, WORLD_HEIGHT - 100);
                attempts++;
            } while (
                attempts < 20 &&
                (distance(x, y, playerStartX, playerStartY) < 300 ||
                 collidesWithBuildings(x, y, 15))
            );

            const type = Math.random() < 0.3 ? 'ghoul' : (Math.random() < 0.5 ? 'bandit' : 'bandit_scout');
            enemies.push(new Enemy(x, y, type));
        }

        return { x: playerStartX, y: playerStartY };
    }

    function collidesWithBuildings(x, y, radius) {
        for (const b of buildings) {
            if (circleRectCollision(x, y, radius, b)) {
                return true;
            }
        }
        return false;
    }

    function collidesWithTrees(x, y, radius) {
        for (const t of trees) {
            if (distance(x, y, t.x, t.y) < radius + t.radius) {
                return true;
            }
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PLAYER CLASS
    // ═══════════════════════════════════════════════════════════════════════════
    class Player {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 12;
            this.angle = 0;

            // Stats
            this.hp = PLAYER_MAX_HP;
            this.maxHp = PLAYER_MAX_HP;
            this.stamina = STAMINA_MAX;
            this.maxStamina = STAMINA_MAX;

            // Combat
            this.ammo = MAGAZINE_SIZE;
            this.maxAmmo = MAGAZINE_SIZE;
            this.reloading = false;
            this.reloadTimer = 0;
            this.fireTimer = 0;

            // Movement
            this.vx = 0;
            this.vy = 0;
            this.speed = PLAYER_SPEED;
            this.sprinting = false;

            // Dodge
            this.dodging = false;
            this.dodgeTimer = 0;
            this.dodgeCooldown = 0;
            this.dodgeVx = 0;
            this.dodgeVy = 0;

            // Status effects
            this.bleeding = false;
            this.bleedTimer = 0;
            this.iframes = 0;

            // Extraction
            this.extracting = false;
            this.extractTimer = 0;

            // Loot
            this.lootValue = 0;
        }

        update(dt) {
            // Update cooldowns
            if (this.fireTimer > 0) this.fireTimer -= dt;
            if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;
            if (this.iframes > 0) this.iframes -= dt;

            // Reloading
            if (this.reloading) {
                this.reloadTimer -= dt;
                if (this.reloadTimer <= 0) {
                    this.ammo = this.maxAmmo;
                    this.reloading = false;
                }
            }

            // Bleeding
            if (this.bleeding) {
                this.bleedTimer -= dt;
                if (this.bleedTimer <= 0) {
                    this.takeDamage(2, false);
                    this.bleedTimer = 1.0;
                    spawnParticle(this.x, this.y, COLORS.blood, 0.5);
                }
            }

            // Handle dodge
            if (this.dodging) {
                this.dodgeTimer -= dt;
                this.x += this.dodgeVx * dt;
                this.y += this.dodgeVy * dt;

                if (this.dodgeTimer <= 0) {
                    this.dodging = false;
                }
            } else {
                // Normal movement
                this.handleMovement(dt);
            }

            // Aim toward mouse
            this.angle = angleBetween(this.x, this.y, mouse.worldX, mouse.worldY);

            // Stamina regen
            if (!this.sprinting && this.stamina < this.maxStamina) {
                this.stamina = Math.min(this.maxStamina, this.stamina + STAMINA_REGEN * dt);
            }

            // Collision with buildings
            this.handleCollision();

            // Bounds
            this.x = clamp(this.x, this.radius, WORLD_WIDTH - this.radius);
            this.y = clamp(this.y, this.radius, WORLD_HEIGHT - this.radius);

            // Check extraction
            this.checkExtraction(dt);

            // Check interact
            if (activeKeys.has('e') || activeKeys.has('E')) {
                this.tryInteract();
            }

            // Shooting
            if (mouse.down && !this.reloading && !this.dodging) {
                this.shoot();
            }

            // Reload
            if ((activeKeys.has('r') || activeKeys.has('R')) && !this.reloading && this.ammo < this.maxAmmo) {
                this.startReload();
            }

            // Dodge
            if ((activeKeys.has(' ')) && !this.dodging && this.dodgeCooldown <= 0 && this.stamina >= 20) {
                this.startDodge();
            }
        }

        handleMovement(dt) {
            let moveX = 0;
            let moveY = 0;

            if (activeKeys.has('w') || activeKeys.has('W')) moveY = -1;
            if (activeKeys.has('s') || activeKeys.has('S')) moveY = 1;
            if (activeKeys.has('a') || activeKeys.has('A')) moveX = -1;
            if (activeKeys.has('d') || activeKeys.has('D')) moveX = 1;

            // Normalize diagonal
            if (moveX !== 0 && moveY !== 0) {
                const len = Math.sqrt(moveX * moveX + moveY * moveY);
                moveX /= len;
                moveY /= len;
            }

            // Sprint
            this.sprinting = (activeKeys.has('Shift') || activeKeys.has('shift')) && this.stamina > 0 && (moveX !== 0 || moveY !== 0);

            let speed = this.speed;
            if (this.sprinting) {
                speed *= SPRINT_MULTIPLIER;
                this.stamina -= STAMINA_SPRINT_DRAIN * dt;
            }

            this.vx = moveX * speed;
            this.vy = moveY * speed;

            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }

        handleCollision() {
            // Buildings
            for (const b of buildings) {
                if (circleRectCollision(this.x, this.y, this.radius, b)) {
                    // Push out
                    const centerX = b.x + b.width / 2;
                    const centerY = b.y + b.height / 2;

                    const nearestX = clamp(this.x, b.x, b.x + b.width);
                    const nearestY = clamp(this.y, b.y, b.y + b.height);

                    const dx = this.x - nearestX;
                    const dy = this.y - nearestY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 0) {
                        const overlap = this.radius - dist;
                        this.x += (dx / dist) * overlap;
                        this.y += (dy / dist) * overlap;
                    }
                }
            }

            // Trees
            for (const t of trees) {
                const dist = distance(this.x, this.y, t.x, t.y);
                const minDist = this.radius + t.radius;
                if (dist < minDist) {
                    const angle = angleBetween(t.x, t.y, this.x, this.y);
                    this.x = t.x + Math.cos(angle) * minDist;
                    this.y = t.y + Math.sin(angle) * minDist;
                }
            }
        }

        startDodge() {
            this.dodging = true;
            this.dodgeTimer = DODGE_DURATION;
            this.dodgeCooldown = DODGE_COOLDOWN;
            this.stamina -= 20;

            // Dodge in movement direction or facing direction
            let dodgeAngle = this.angle;
            if (this.vx !== 0 || this.vy !== 0) {
                dodgeAngle = Math.atan2(this.vy, this.vx);
            }

            const dodgeSpeed = 400;
            this.dodgeVx = Math.cos(dodgeAngle) * dodgeSpeed;
            this.dodgeVy = Math.sin(dodgeAngle) * dodgeSpeed;
        }

        shoot() {
            if (this.fireTimer > 0 || this.ammo <= 0) return;

            this.fireTimer = FIRE_RATE;
            this.ammo--;

            // Create bullet
            const spread = randomRange(-3, 3) * Math.PI / 180;
            const angle = this.angle + spread;

            bullets.push(new Bullet(
                this.x + Math.cos(angle) * 20,
                this.y + Math.sin(angle) * 20,
                angle,
                BULLET_SPEED,
                BULLET_DAMAGE,
                true
            ));

            // Muzzle flash particle
            spawnParticle(
                this.x + Math.cos(this.angle) * 25,
                this.y + Math.sin(this.angle) * 25,
                '#FFE066',
                0.1
            );

            // Auto reload if empty
            if (this.ammo <= 0) {
                this.startReload();
            }
        }

        startReload() {
            this.reloading = true;
            this.reloadTimer = RELOAD_TIME;
        }

        takeDamage(amount, applyBleed = true) {
            if (this.iframes > 0 || this.dodging) return;

            this.hp -= amount;
            this.iframes = 0.3;
            stats.damageTaken += amount;

            // Chance to start bleeding
            if (applyBleed && Math.random() < 0.3 && !this.bleeding) {
                this.bleeding = true;
                this.bleedTimer = 1.0;
            }

            // Damage indicator
            floatingTexts.push({
                x: this.x,
                y: this.y - 20,
                text: `-${amount}`,
                color: COLORS.healthBarDamage,
                life: 0.8
            });

            if (this.hp <= 0) {
                this.hp = 0;
                gameState = 'gameover';
            }
        }

        checkExtraction(dt) {
            const dist = distance(this.x, this.y, extractionPoint.x, extractionPoint.y);
            if (dist < extractionPoint.radius) {
                this.extracting = true;
                this.extractTimer += dt;

                if (this.extractTimer >= EXTRACTION_TIME) {
                    gameState = 'extracted';
                    stats.extracted = true;
                }
            } else {
                this.extracting = false;
                this.extractTimer = 0;
            }
        }

        tryInteract() {
            // Check containers
            for (const c of containers) {
                if (!c.looted && distance(this.x, this.y, c.x + c.width/2, c.y + c.height/2) < 40) {
                    c.looted = true;
                    this.lootValue += c.lootValue;
                    stats.containersLooted++;

                    floatingTexts.push({
                        x: c.x + c.width/2,
                        y: c.y,
                        text: `+${c.lootValue}`,
                        color: '#ECC94B',
                        life: 1.0
                    });
                    break;
                }
            }
        }

        render(ctx) {
            const screen = worldToScreen(this.x, this.y);

            // Dodge trail
            if (this.dodging) {
                ctx.fillStyle = COLORS.playerDodge;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(screen.x, screen.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // Body
            ctx.fillStyle = this.iframes > 0 ? '#FFFFFF' : COLORS.player;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Direction indicator / gun
            ctx.strokeStyle = '#2D3748';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(screen.x, screen.y);
            ctx.lineTo(
                screen.x + Math.cos(this.angle) * 20,
                screen.y + Math.sin(this.angle) * 20
            );
            ctx.stroke();

            // Bleeding indicator
            if (this.bleeding) {
                ctx.fillStyle = COLORS.blood;
                ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.3;
                ctx.beginPath();
                ctx.arc(screen.x, screen.y + this.radius + 5, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // Extraction progress
            if (this.extracting) {
                ctx.strokeStyle = COLORS.extraction;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(screen.x, screen.y, this.radius + 8, -Math.PI/2,
                    -Math.PI/2 + (this.extractTimer / EXTRACTION_TIME) * Math.PI * 2);
                ctx.stroke();
            }
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
            this.radius = 10;

            this.setTypeStats();

            this.angle = Math.random() * Math.PI * 2;
            this.state = 'patrol';
            this.targetX = x;
            this.targetY = y;
            this.lastSeen = { x: 0, y: 0 };
            this.alertTimer = 0;
            this.fireTimer = 0;
            this.patrolTimer = randomRange(2, 5);
        }

        setTypeStats() {
            switch (this.type) {
                case 'bandit_scout':
                    this.hp = 60;
                    this.maxHp = 60;
                    this.speed = 100;
                    this.damage = 12;
                    this.fireRate = 0.8;
                    this.visionRange = 200;
                    this.color = '#DD6B20';
                    break;
                case 'bandit':
                    this.hp = 80;
                    this.maxHp = 80;
                    this.speed = 90;
                    this.damage = 15;
                    this.fireRate = 0.5;
                    this.visionRange = 180;
                    this.color = COLORS.enemy;
                    break;
                case 'ghoul':
                    this.hp = 50;
                    this.maxHp = 50;
                    this.speed = 130;
                    this.damage = 12;
                    this.fireRate = 0; // Melee only
                    this.visionRange = 150;
                    this.color = COLORS.ghoul;
                    this.melee = true;
                    break;
                default:
                    this.hp = 60;
                    this.maxHp = 60;
                    this.speed = 80;
                    this.damage = 10;
                    this.fireRate = 0.6;
                    this.visionRange = 160;
                    this.color = COLORS.enemy;
            }
        }

        update(dt) {
            if (this.fireTimer > 0) this.fireTimer -= dt;

            const distToPlayer = distance(this.x, this.y, player.x, player.y);
            const canSeePlayer = distToPlayer < this.visionRange && this.hasLineOfSight(player.x, player.y);

            switch (this.state) {
                case 'patrol':
                    this.updatePatrol(dt);
                    if (canSeePlayer) {
                        this.state = 'combat';
                        this.lastSeen = { x: player.x, y: player.y };
                    }
                    break;

                case 'alert':
                    this.alertTimer -= dt;
                    this.moveToward(this.lastSeen.x, this.lastSeen.y, dt);
                    if (canSeePlayer) {
                        this.state = 'combat';
                        this.lastSeen = { x: player.x, y: player.y };
                    } else if (this.alertTimer <= 0) {
                        this.state = 'patrol';
                    }
                    break;

                case 'combat':
                    if (canSeePlayer) {
                        this.lastSeen = { x: player.x, y: player.y };
                        this.angle = angleBetween(this.x, this.y, player.x, player.y);

                        if (this.melee) {
                            // Melee: rush player
                            this.moveToward(player.x, player.y, dt);
                            if (distToPlayer < this.radius + player.radius + 5) {
                                this.meleeAttack();
                            }
                        } else {
                            // Ranged: maintain distance and shoot
                            if (distToPlayer < 80) {
                                // Too close, back up
                                const angle = angleBetween(player.x, player.y, this.x, this.y);
                                this.x += Math.cos(angle) * this.speed * 0.5 * dt;
                                this.y += Math.sin(angle) * this.speed * 0.5 * dt;
                            } else if (distToPlayer > 150) {
                                // Too far, move closer
                                this.moveToward(player.x, player.y, dt);
                            }
                            this.tryShoot();
                        }
                    } else {
                        this.state = 'alert';
                        this.alertTimer = 3;
                    }
                    break;
            }

            // Collision
            this.handleCollision();

            // Bounds
            this.x = clamp(this.x, this.radius, WORLD_WIDTH - this.radius);
            this.y = clamp(this.y, this.radius, WORLD_HEIGHT - this.radius);
        }

        updatePatrol(dt) {
            this.patrolTimer -= dt;
            if (this.patrolTimer <= 0) {
                // Pick new patrol point
                this.targetX = this.x + randomRange(-100, 100);
                this.targetY = this.y + randomRange(-100, 100);
                this.targetX = clamp(this.targetX, 50, WORLD_WIDTH - 50);
                this.targetY = clamp(this.targetY, 50, WORLD_HEIGHT - 50);
                this.patrolTimer = randomRange(2, 5);
            }

            this.moveToward(this.targetX, this.targetY, dt * 0.5);
        }

        moveToward(tx, ty, dt) {
            const angle = angleBetween(this.x, this.y, tx, ty);
            this.angle = angle;
            this.x += Math.cos(angle) * this.speed * dt;
            this.y += Math.sin(angle) * this.speed * dt;
        }

        handleCollision() {
            // Buildings
            for (const b of buildings) {
                if (circleRectCollision(this.x, this.y, this.radius, b)) {
                    const nearestX = clamp(this.x, b.x, b.x + b.width);
                    const nearestY = clamp(this.y, b.y, b.y + b.height);
                    const dx = this.x - nearestX;
                    const dy = this.y - nearestY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        const overlap = this.radius - dist;
                        this.x += (dx / dist) * overlap;
                        this.y += (dy / dist) * overlap;
                    }
                }
            }

            // Trees
            for (const t of trees) {
                const dist = distance(this.x, this.y, t.x, t.y);
                const minDist = this.radius + t.radius;
                if (dist < minDist && dist > 0) {
                    const angle = angleBetween(t.x, t.y, this.x, this.y);
                    this.x = t.x + Math.cos(angle) * minDist;
                    this.y = t.y + Math.sin(angle) * minDist;
                }
            }
        }

        hasLineOfSight(tx, ty) {
            // Simple ray check against buildings
            const steps = 10;
            const dx = (tx - this.x) / steps;
            const dy = (ty - this.y) / steps;

            for (let i = 1; i < steps; i++) {
                const checkX = this.x + dx * i;
                const checkY = this.y + dy * i;

                for (const b of buildings) {
                    if (checkX > b.x && checkX < b.x + b.width &&
                        checkY > b.y && checkY < b.y + b.height) {
                        return false;
                    }
                }
            }
            return true;
        }

        tryShoot() {
            if (this.fireTimer > 0) return;

            this.fireTimer = this.fireRate;

            const spread = randomRange(-8, 8) * Math.PI / 180;
            const angle = this.angle + spread;

            bullets.push(new Bullet(
                this.x + Math.cos(angle) * 15,
                this.y + Math.sin(angle) * 15,
                angle,
                400,
                this.damage,
                false
            ));
        }

        meleeAttack() {
            if (this.fireTimer > 0) return;
            this.fireTimer = 0.8;
            player.takeDamage(this.damage);
        }

        takeDamage(amount) {
            this.hp -= amount;
            this.state = 'combat';
            this.lastSeen = { x: player.x, y: player.y };

            // Blood particles
            for (let i = 0; i < 3; i++) {
                spawnParticle(this.x, this.y, COLORS.blood, 0.3);
            }

            if (this.hp <= 0) {
                this.die();
            }
        }

        die() {
            const idx = enemies.indexOf(this);
            if (idx !== -1) {
                enemies.splice(idx, 1);
                stats.enemiesKilled++;

                // Death particles
                for (let i = 0; i < 8; i++) {
                    spawnParticle(this.x, this.y, this.color, 0.5);
                }
            }
        }

        render(ctx) {
            const screen = worldToScreen(this.x, this.y);

            // Alert indicator
            if (this.state === 'alert') {
                ctx.fillStyle = '#ECC94B';
                ctx.font = '16px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('?', screen.x, screen.y - this.radius - 8);
            } else if (this.state === 'combat') {
                ctx.fillStyle = '#E53E3E';
                ctx.font = '16px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('!', screen.x, screen.y - this.radius - 8);
            }

            // Body
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Direction
            ctx.strokeStyle = '#2D3748';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(screen.x, screen.y);
            ctx.lineTo(
                screen.x + Math.cos(this.angle) * 15,
                screen.y + Math.sin(this.angle) * 15
            );
            ctx.stroke();

            // Health bar
            if (this.hp < this.maxHp) {
                const barWidth = 20;
                const hpPercent = this.hp / this.maxHp;
                ctx.fillStyle = '#2D3748';
                ctx.fillRect(screen.x - barWidth/2, screen.y - this.radius - 6, barWidth, 4);
                ctx.fillStyle = COLORS.healthBar;
                ctx.fillRect(screen.x - barWidth/2, screen.y - this.radius - 6, barWidth * hpPercent, 4);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BULLET CLASS
    // ═══════════════════════════════════════════════════════════════════════════
    class Bullet {
        constructor(x, y, angle, speed, damage, isPlayerBullet) {
            this.x = x;
            this.y = y;
            this.angle = angle;
            this.speed = speed;
            this.damage = damage;
            this.isPlayerBullet = isPlayerBullet;
            this.radius = 3;
            this.life = 2.0;
        }

        update(dt) {
            this.x += Math.cos(this.angle) * this.speed * dt;
            this.y += Math.sin(this.angle) * this.speed * dt;
            this.life -= dt;

            // Check collisions
            if (this.isPlayerBullet) {
                // Hit enemies
                for (const enemy of enemies) {
                    if (distance(this.x, this.y, enemy.x, enemy.y) < enemy.radius + this.radius) {
                        enemy.takeDamage(this.damage);
                        stats.damageDealt += this.damage;
                        this.life = 0;
                        break;
                    }
                }
            } else {
                // Hit player
                if (distance(this.x, this.y, player.x, player.y) < player.radius + this.radius) {
                    player.takeDamage(this.damage);
                    this.life = 0;
                }
            }

            // Hit buildings
            for (const b of buildings) {
                if (this.x > b.x && this.x < b.x + b.width &&
                    this.y > b.y && this.y < b.y + b.height) {
                    this.life = 0;
                    spawnParticle(this.x, this.y, '#888', 0.2);
                    break;
                }
            }

            // Hit trees
            for (const t of trees) {
                if (distance(this.x, this.y, t.x, t.y) < t.radius) {
                    this.life = 0;
                    spawnParticle(this.x, this.y, '#228B22', 0.2);
                    break;
                }
            }
        }

        render(ctx) {
            const screen = worldToScreen(this.x, this.y);
            ctx.fillStyle = this.isPlayerBullet ? COLORS.bullet : COLORS.enemyBullet;
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
            vx: randomRange(-50, 50),
            vy: randomRange(-50, 50),
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
            p.vy += 100 * dt; // Gravity
            p.life -= dt;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function renderParticles(ctx) {
        for (const p of particles) {
            const screen = worldToScreen(p.x, p.y);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillRect(screen.x - 2, screen.y - 2, 4, 4);
        }
        ctx.globalAlpha = 1;
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
            const world = screenToWorld(mouse.x, mouse.y);
            mouse.worldX = world.x;
            mouse.worldY = world.y;
        });

        canvas.addEventListener('mousedown', () => {
            mouse.down = true;
        });

        canvas.addEventListener('mouseup', () => {
            mouse.down = false;
        });

        // Prevent context menu on right click
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Start game loop
        requestAnimationFrame(gameLoop);

        console.log('[HARNESS] Zero Sievert harness initialized, game paused');
    }

    function startGame() {
        // Unpause the game so input works
        gamePaused = false;

        // Reset stats
        stats = {
            enemiesKilled: 0,
            containersLooted: 0,
            damageDealt: 0,
            damageTaken: 0,
            extracted: false
        };

        // Generate world
        const startPos = generateWorld();

        // Create player
        player = new Player(startPos.x, startPos.y);

        // Reset
        bullets = [];
        particles = [];
        floatingTexts = [];

        gameState = 'playing';
    }

    function updateCamera() {
        if (!player) return;

        // Center on player
        const targetX = player.x - CANVAS_WIDTH / 2;
        const targetY = player.y - CANVAS_HEIGHT / 2;

        // Smooth follow
        camera.x = lerp(camera.x, targetX, 0.1);
        camera.y = lerp(camera.y, targetY, 0.1);

        // Clamp to world bounds
        camera.x = clamp(camera.x, 0, WORLD_WIDTH - CANVAS_WIDTH);
        camera.y = clamp(camera.y, 0, WORLD_HEIGHT - CANVAS_HEIGHT);

        // Update mouse world position
        const world = screenToWorld(mouse.x, mouse.y);
        mouse.worldX = world.x;
        mouse.worldY = world.y;
    }

    function update(dt) {
        if (gameState !== 'playing') return;

        // Update player
        if (player) {
            player.update(dt);
        }

        // Update enemies
        for (const enemy of enemies) {
            enemy.update(dt);
        }

        // Update bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            bullets[i].update(dt);
            if (bullets[i].life <= 0) {
                bullets.splice(i, 1);
            }
        }

        // Update particles
        updateParticles(dt);

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
    }

    function render() {
        // Clear
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (gameState === 'menu') {
            renderMenu();
            return;
        }

        if (gameState === 'gameover') {
            renderGameOver();
            return;
        }

        if (gameState === 'extracted') {
            renderExtracted();
            return;
        }

        // Render world
        renderWorld();

        // Render HUD
        renderHUD();
    }

    function renderWorld() {
        // Extraction point
        const epScreen = worldToScreen(extractionPoint.x, extractionPoint.y);
        ctx.fillStyle = COLORS.extraction;
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 500) * 0.1;
        ctx.beginPath();
        ctx.arc(epScreen.x, epScreen.y, extractionPoint.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = COLORS.extraction;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = COLORS.uiText;
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('EXTRACT', epScreen.x, epScreen.y + 4);

        // Buildings
        for (const b of buildings) {
            const screen = worldToScreen(b.x, b.y);
            ctx.fillStyle = COLORS.building;
            ctx.fillRect(screen.x, screen.y, b.width, b.height);
            ctx.strokeStyle = COLORS.wall;
            ctx.lineWidth = 2;
            ctx.strokeRect(screen.x, screen.y, b.width, b.height);
        }

        // Trees
        for (const t of trees) {
            const screen = worldToScreen(t.x, t.y);
            ctx.fillStyle = COLORS.tree;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, t.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#1a5c1a';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Containers
        for (const c of containers) {
            const screen = worldToScreen(c.x, c.y);
            ctx.fillStyle = c.looted ? COLORS.containerLooted : COLORS.container;
            ctx.fillRect(screen.x, screen.y, c.width, c.height);
            if (!c.looted) {
                ctx.strokeStyle = '#FFE066';
                ctx.lineWidth = 2;
                ctx.strokeRect(screen.x, screen.y, c.width, c.height);
            }
        }

        // Bullets
        for (const bullet of bullets) {
            bullet.render(ctx);
        }

        // Particles
        renderParticles(ctx);

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
            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, screen.x, screen.y);
            ctx.globalAlpha = 1;
        }
    }

    function renderHUD() {
        // Health bar
        ctx.fillStyle = COLORS.uiBackground;
        ctx.fillRect(10, 10, 150, 20);
        const hpPercent = player.hp / player.maxHp;
        ctx.fillStyle = hpPercent > 0.3 ? COLORS.healthBar : COLORS.healthBarDamage;
        ctx.fillRect(12, 12, 146 * hpPercent, 16);
        ctx.fillStyle = COLORS.uiText;
        ctx.font = '12px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`, 15, 24);

        // Stamina bar
        ctx.fillStyle = COLORS.uiBackground;
        ctx.fillRect(10, 35, 150, 12);
        ctx.fillStyle = COLORS.staminaBar;
        ctx.fillRect(12, 37, 146 * (player.stamina / player.maxStamina), 8);

        // Ammo
        ctx.fillStyle = COLORS.uiBackground;
        ctx.fillRect(10, 52, 100, 20);
        ctx.fillStyle = COLORS.uiText;
        ctx.fillText(player.reloading ? 'RELOADING...' : `Ammo: ${player.ammo}/${player.maxAmmo}`, 15, 66);

        // Loot value
        ctx.fillStyle = COLORS.uiBackground;
        ctx.fillRect(CANVAS_WIDTH - 110, 10, 100, 20);
        ctx.fillStyle = '#ECC94B';
        ctx.textAlign = 'right';
        ctx.fillText(`Loot: ${player.lootValue}`, CANVAS_WIDTH - 15, 24);

        // Extraction direction
        const angleToExtract = angleBetween(player.x, player.y, extractionPoint.x, extractionPoint.y);
        const distToExtract = Math.floor(distance(player.x, player.y, extractionPoint.x, extractionPoint.y));

        ctx.fillStyle = COLORS.uiBackground;
        ctx.fillRect(CANVAS_WIDTH - 160, CANVAS_HEIGHT - 50, 150, 40);
        ctx.fillStyle = COLORS.extraction;
        ctx.textAlign = 'right';
        ctx.fillText(`Extract: ${distToExtract}m`, CANVAS_WIDTH - 15, CANVAS_HEIGHT - 32);

        // Arrow pointing to extraction
        const arrowX = CANVAS_WIDTH - 135;
        const arrowY = CANVAS_HEIGHT - 30;
        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angleToExtract);
        ctx.fillStyle = COLORS.extraction;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-5, -6);
        ctx.lineTo(-5, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Stats
        ctx.fillStyle = COLORS.uiBackground;
        ctx.fillRect(10, CANVAS_HEIGHT - 30, 180, 20);
        ctx.fillStyle = COLORS.uiText;
        ctx.textAlign = 'left';
        ctx.fillText(`Kills: ${stats.enemiesKilled} | Loot: ${stats.containersLooted}`, 15, CANVAS_HEIGHT - 16);

        // Bleeding warning
        if (player.bleeding) {
            ctx.fillStyle = 'rgba(139, 0, 0, 0.3)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 16px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('BLEEDING', CANVAS_WIDTH / 2, 90);
        }
    }

    function renderMenu() {
        ctx.fillStyle = COLORS.uiText;
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('ZERO SIEVERT', CANVAS_WIDTH / 2, 150);

        ctx.font = '24px Courier New';
        ctx.fillText('CLONE', CANVAS_WIDTH / 2, 190);

        ctx.font = '16px Courier New';
        ctx.fillText('WASD - Move', CANVAS_WIDTH / 2, 280);
        ctx.fillText('Mouse - Aim', CANVAS_WIDTH / 2, 310);
        ctx.fillText('Click - Shoot', CANVAS_WIDTH / 2, 340);
        ctx.fillText('R - Reload', CANVAS_WIDTH / 2, 370);
        ctx.fillText('E - Interact/Loot', CANVAS_WIDTH / 2, 400);
        ctx.fillText('Shift - Sprint', CANVAS_WIDTH / 2, 430);
        ctx.fillText('Space - Dodge', CANVAS_WIDTH / 2, 460);

        ctx.fillStyle = COLORS.extraction;
        ctx.fillText('Reach the green extraction zone to win!', CANVAS_WIDTH / 2, 520);

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
        ctx.fillText('YOU DIED', CANVAS_WIDTH / 2, 200);

        ctx.fillStyle = COLORS.uiText;
        ctx.font = '20px Courier New';
        ctx.fillText(`Enemies Killed: ${stats.enemiesKilled}`, CANVAS_WIDTH / 2, 280);
        ctx.fillText(`Containers Looted: ${stats.containersLooted}`, CANVAS_WIDTH / 2, 320);
        ctx.fillText(`Damage Dealt: ${stats.damageDealt}`, CANVAS_WIDTH / 2, 360);

        ctx.font = '18px Courier New';
        ctx.fillText('Press ENTER to Try Again', CANVAS_WIDTH / 2, 440);

        if (keysDown['Enter']) {
            startGame();
        }
    }

    function renderExtracted() {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = COLORS.extraction;
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('EXTRACTED!', CANVAS_WIDTH / 2, 200);

        ctx.fillStyle = COLORS.uiText;
        ctx.font = '20px Courier New';
        ctx.fillText(`Enemies Killed: ${stats.enemiesKilled}`, CANVAS_WIDTH / 2, 280);
        ctx.fillText(`Containers Looted: ${stats.containersLooted}`, CANVAS_WIDTH / 2, 320);
        ctx.fillText(`Loot Value: ${player.lootValue}`, CANVAS_WIDTH / 2, 360);

        ctx.font = '18px Courier New';
        ctx.fillText('Press ENTER to Play Again', CANVAS_WIDTH / 2, 440);

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
                    mouse.x = action.mouse.x !== undefined ? action.mouse.x : mouse.x;
                    mouse.y = action.mouse.y !== undefined ? action.mouse.y : mouse.y;
                    mouse.down = action.mouse.down || false;
                    // Update world coords
                    const world = screenToWorld(mouse.x, mouse.y);
                    mouse.worldX = world.x;
                    mouse.worldY = world.y;
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
                player: player ? {
                    x: player.x,
                    y: player.y,
                    hp: player.hp,
                    maxHp: player.maxHp,
                    stamina: player.stamina,
                    ammo: player.ammo,
                    reloading: player.reloading,
                    bleeding: player.bleeding,
                    extracting: player.extracting,
                    extractTimer: player.extractTimer,
                    lootValue: player.lootValue
                } : null,
                enemies: enemies.map(e => ({
                    x: e.x,
                    y: e.y,
                    type: e.type,
                    hp: e.hp,
                    state: e.state
                })),
                extraction: extractionPoint ? {
                    x: extractionPoint.x,
                    y: extractionPoint.y,
                    distance: player ? distance(player.x, player.y, extractionPoint.x, extractionPoint.y) : 0
                } : null,
                containers: containers.map(c => ({
                    x: c.x,
                    y: c.y,
                    looted: c.looted
                })),
                stats: { ...stats },
                camera: { ...camera }
            };
        },

        getPhase: () => {
            return gameState;
        },

        debug: {
            setHealth: (hp) => { if (player) player.hp = hp; },
            setAmmo: (ammo) => { if (player) player.ammo = ammo; },
            teleport: (x, y) => { if (player) { player.x = x; player.y = y; } },
            spawnEnemy: (type, x, y) => {
                enemies.push(new Enemy(x || player.x + 100, y || player.y, type || 'bandit'));
            },
            clearEnemies: () => { enemies = []; },
            forceStart: () => {
                startGame();
            },
            forceExtract: () => {
                gameState = 'extracted';
                stats.extracted = true;
            }
        },

        version: '1.0',

        gameInfo: {
            name: 'Zero Sievert Clone',
            type: 'extraction_shooter',
            controls: {
                movement: ['w', 'a', 's', 'd'],
                actions: { reload: 'r', interact: 'e', sprint: 'Shift', dodge: 'Space' },
                combat: { aim: 'mouse', fire: 'click' }
            }
        }
    };

    // Initialize
    window.addEventListener('load', init);
})();
