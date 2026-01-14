// Binding of Isaac Clone - Canvas Implementation with Test Harness
// Agent 2 - Night 6

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════════
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const ROOM_TILES_X = 13;
    const ROOM_TILES_Y = 7;
    const TILE_SIZE = 48;
    const ROOM_WIDTH = ROOM_TILES_X * TILE_SIZE;  // 624
    const ROOM_HEIGHT = ROOM_TILES_Y * TILE_SIZE; // 336
    const ROOM_OFFSET_X = (CANVAS_WIDTH - ROOM_WIDTH) / 2;
    const ROOM_OFFSET_Y = 80; // Space for UI at top
    const WALL_THICKNESS = 32;

    // Player constants
    const PLAYER_SIZE = 32;
    const PLAYER_SPEED = 180;
    const TEAR_SPEED = 350;
    const TEAR_SIZE = 12;
    const TEAR_LIFETIME = 0.8;
    const TEAR_COOLDOWN = 0.35;
    const IFRAMES_DURATION = 1.0;
    const SPAWN_PAUSE_DURATION = 0.15;

    // Enemy spawn constants
    const ENEMY_SPAWN_DURATION = 0.5;

    // Colors
    const COLORS = {
        background: '#2a1a0a',
        floor: '#3d2817',
        floorAlt: '#352213',
        wall: '#5a3d2b',
        wallDark: '#4a2d1b',
        door: '#6b4423',
        doorOpen: '#1a1a1a',
        player: '#f4d03f',
        playerBody: '#f5cba7',
        tear: '#5dade2',
        tearHighlight: '#85c1e9',
        enemy: '#c0392b',
        enemyDark: '#922b21',
        heart: '#e74c3c',
        heartEmpty: '#7b7b7b',
        soulHeart: '#3498db',
        coin: '#f1c40f',
        key: '#f39c12',
        bomb: '#7f8c8d',
        rock: '#7f8c8d',
        poop: '#8b6914',
        pit: '#1a1a1a',
        fire: '#e67e22',
        minimap: '#2c3e50',
        minimapCurrent: '#ecf0f1',
        minimapVisited: '#7f8c8d',
        minimapBoss: '#c0392b',
        minimapTreasure: '#f1c40f',
        minimapShop: '#3498db',
        text: '#ecf0f1',
        textShadow: '#2c3e50'
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME STATE
    // ═══════════════════════════════════════════════════════════════════════════
    let canvas, ctx;
    let gamePaused = true;
    let gameState = 'menu'; // 'menu', 'playing', 'gameover', 'victory', 'roomTransition'
    let lastTime = 0;
    let deltaTime = 0;

    // Input state
    let keysDown = {};
    let activeKeys = new Set();

    // Player
    let player = null;

    // Current floor/room
    let currentFloor = null;
    let currentRoom = null;
    let floorNumber = 1;

    // Entity pools
    let tears = [];
    let enemyProjectiles = [];
    let pickups = [];
    let effects = [];

    // Room transition
    let transitionDirection = null;
    let transitionProgress = 0;

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

    function normalize(x, y) {
        const len = Math.sqrt(x * x + y * y);
        if (len === 0) return { x: 0, y: 0 };
        return { x: x / len, y: y / len };
    }

    function randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function gridToWorld(gridX, gridY) {
        return {
            x: ROOM_OFFSET_X + (gridX + 0.5) * TILE_SIZE,
            y: ROOM_OFFSET_Y + (gridY + 0.5) * TILE_SIZE
        };
    }

    function worldToGrid(worldX, worldY) {
        return {
            x: Math.floor((worldX - ROOM_OFFSET_X) / TILE_SIZE),
            y: Math.floor((worldY - ROOM_OFFSET_Y) / TILE_SIZE)
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PLAYER CLASS
    // ═══════════════════════════════════════════════════════════════════════════
    class Player {
        constructor() {
            this.x = ROOM_OFFSET_X + ROOM_WIDTH / 2;
            this.y = ROOM_OFFSET_Y + ROOM_HEIGHT / 2;
            this.width = PLAYER_SIZE;
            this.height = PLAYER_SIZE;
            this.speed = PLAYER_SPEED;

            // Stats
            this.maxRedHearts = 3;
            this.redHearts = 3;
            this.soulHearts = 0;
            this.damage = 3.5;
            this.tearDelay = TEAR_COOLDOWN;
            this.range = TEAR_LIFETIME;
            this.shotSpeed = TEAR_SPEED;

            // Resources
            this.coins = 0;
            this.bombs = 1;
            this.keys = 1;

            // Combat state
            this.tearCooldown = 0;
            this.iframes = 0;
            this.iframesBlink = 0;

            // Movement state
            this.canMove = true;
            this.spawnPauseTimer = 0;
            this.vx = 0;
            this.vy = 0;

            // Animation
            this.animFrame = 0;
            this.animTimer = 0;
            this.facing = 'down';
            this.lastFireDir = null;
        }

        update(dt) {
            // Spawn pause
            if (this.spawnPauseTimer > 0) {
                this.spawnPauseTimer -= dt;
                return;
            }

            // Iframes
            if (this.iframes > 0) {
                this.iframes -= dt;
                this.iframesBlink += dt * 10;
            }

            // Tear cooldown
            if (this.tearCooldown > 0) {
                this.tearCooldown -= dt;
            }

            if (!this.canMove) return;

            // Movement
            let moveX = 0;
            let moveY = 0;

            if (activeKeys.has('w') || activeKeys.has('W')) moveY -= 1;
            if (activeKeys.has('s') || activeKeys.has('S')) moveY += 1;
            if (activeKeys.has('a') || activeKeys.has('A')) moveX -= 1;
            if (activeKeys.has('d') || activeKeys.has('D')) moveX += 1;

            // Normalize diagonal movement
            if (moveX !== 0 && moveY !== 0) {
                const norm = normalize(moveX, moveY);
                moveX = norm.x;
                moveY = norm.y;
            }

            // Update facing
            if (moveX !== 0 || moveY !== 0) {
                if (Math.abs(moveX) > Math.abs(moveY)) {
                    this.facing = moveX > 0 ? 'right' : 'left';
                } else {
                    this.facing = moveY > 0 ? 'down' : 'up';
                }
            }

            // Apply movement with collision
            const newX = this.x + moveX * this.speed * dt;
            const newY = this.y + moveY * this.speed * dt;

            // Room bounds collision
            const minX = ROOM_OFFSET_X + WALL_THICKNESS + this.width / 2;
            const maxX = ROOM_OFFSET_X + ROOM_WIDTH - WALL_THICKNESS - this.width / 2;
            const minY = ROOM_OFFSET_Y + WALL_THICKNESS + this.height / 2;
            const maxY = ROOM_OFFSET_Y + ROOM_HEIGHT - WALL_THICKNESS - this.height / 2;

            // Check tile collisions
            if (!this.checkTileCollision(newX, this.y)) {
                this.x = clamp(newX, minX, maxX);
            }
            if (!this.checkTileCollision(this.x, newY)) {
                this.y = clamp(newY, minY, maxY);
            }

            this.vx = moveX * this.speed;
            this.vy = moveY * this.speed;

            // Animation
            if (moveX !== 0 || moveY !== 0) {
                this.animTimer += dt;
                if (this.animTimer > 0.1) {
                    this.animTimer = 0;
                    this.animFrame = (this.animFrame + 1) % 4;
                }
            } else {
                this.animFrame = 0;
            }

            // Shooting
            let fireX = 0;
            let fireY = 0;

            if (activeKeys.has('ArrowUp')) fireY -= 1;
            if (activeKeys.has('ArrowDown')) fireY += 1;
            if (activeKeys.has('ArrowLeft')) fireX -= 1;
            if (activeKeys.has('ArrowRight')) fireX += 1;

            if ((fireX !== 0 || fireY !== 0) && this.tearCooldown <= 0) {
                this.fireTear(fireX, fireY);
            }

            // Check door collision for room transition
            this.checkDoorCollision();
        }

        checkTileCollision(x, y) {
            if (!currentRoom) return false;

            const halfW = this.width / 2 - 4;
            const halfH = this.height / 2 - 4;

            // Check all four corners
            const corners = [
                { x: x - halfW, y: y - halfH },
                { x: x + halfW, y: y - halfH },
                { x: x - halfW, y: y + halfH },
                { x: x + halfW, y: y + halfH }
            ];

            for (const corner of corners) {
                const grid = worldToGrid(corner.x, corner.y);
                if (grid.x < 0 || grid.x >= ROOM_TILES_X || grid.y < 0 || grid.y >= ROOM_TILES_Y) {
                    continue;
                }
                const tile = currentRoom.tiles[grid.y]?.[grid.x];
                if (tile && (tile.type === 'rock' || tile.type === 'poop' || tile.type === 'pit')) {
                    return true;
                }
            }
            return false;
        }

        checkDoorCollision() {
            if (!currentRoom || currentRoom.enemies.length > 0) return;

            const doorSize = 56;
            const centerX = ROOM_OFFSET_X + ROOM_WIDTH / 2;
            const centerY = ROOM_OFFSET_Y + ROOM_HEIGHT / 2;

            // Door trigger distance from wall (player center to wall edge)
            const triggerDist = WALL_THICKNESS + this.height / 2 + 8;

            // North door
            if (currentRoom.doors.north && this.y <= ROOM_OFFSET_Y + triggerDist) {
                if (Math.abs(this.x - centerX) < doorSize) {
                    transitionToRoom('north');
                }
            }
            // South door
            if (currentRoom.doors.south && this.y >= ROOM_OFFSET_Y + ROOM_HEIGHT - triggerDist) {
                if (Math.abs(this.x - centerX) < doorSize) {
                    transitionToRoom('south');
                }
            }
            // East door
            if (currentRoom.doors.east && this.x >= ROOM_OFFSET_X + ROOM_WIDTH - triggerDist) {
                if (Math.abs(this.y - centerY) < doorSize) {
                    transitionToRoom('east');
                }
            }
            // West door
            if (currentRoom.doors.west && this.x <= ROOM_OFFSET_X + triggerDist) {
                if (Math.abs(this.y - centerY) < doorSize) {
                    transitionToRoom('west');
                }
            }
        }

        fireTear(dirX, dirY) {
            const norm = normalize(dirX, dirY);

            // Update facing based on fire direction
            if (Math.abs(norm.x) > Math.abs(norm.y)) {
                this.lastFireDir = norm.x > 0 ? 'right' : 'left';
            } else {
                this.lastFireDir = norm.y > 0 ? 'down' : 'up';
            }

            const tear = {
                x: this.x,
                y: this.y,
                vx: norm.x * this.shotSpeed + this.vx * 0.2,
                vy: norm.y * this.shotSpeed + this.vy * 0.2,
                damage: this.damage,
                size: TEAR_SIZE,
                lifetime: this.range,
                height: 0,
                fallSpeed: 0
            };

            tears.push(tear);
            this.tearCooldown = this.tearDelay;

            // Spawn effect
            effects.push({
                type: 'tearSpawn',
                x: this.x,
                y: this.y,
                lifetime: 0.1
            });
        }

        takeDamage(amount) {
            if (this.iframes > 0) return;

            // Damage soul hearts first
            if (this.soulHearts > 0) {
                this.soulHearts -= amount;
                if (this.soulHearts < 0) {
                    this.redHearts += this.soulHearts;
                    this.soulHearts = 0;
                }
            } else {
                this.redHearts -= amount;
            }

            this.iframes = IFRAMES_DURATION;

            // Spawn damage effect
            effects.push({
                type: 'damage',
                x: this.x,
                y: this.y,
                lifetime: 0.3
            });

            if (this.redHearts <= 0 && this.soulHearts <= 0) {
                this.die();
            }
        }

        die() {
            gameState = 'gameover';
        }

        heal(amount) {
            this.redHearts = Math.min(this.redHearts + amount, this.maxRedHearts);
        }

        render(ctx) {
            // Blinking during iframes
            if (this.iframes > 0 && Math.floor(this.iframesBlink) % 2 === 0) {
                return;
            }

            const x = this.x;
            const y = this.y;
            const size = this.width;

            // Body (oval)
            ctx.fillStyle = COLORS.playerBody;
            ctx.beginPath();
            ctx.ellipse(x, y + 4, size / 2 - 2, size / 2.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.fillStyle = COLORS.playerBody;
            ctx.beginPath();
            ctx.arc(x, y - 4, size / 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            const eyeOffset = 6;
            const eyeY = y - 6;

            // White of eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(x - eyeOffset, eyeY, 5, 6, 0, 0, Math.PI * 2);
            ctx.ellipse(x + eyeOffset, eyeY, 5, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pupils - look in fire direction or facing direction
            let pupilOffsetX = 0;
            let pupilOffsetY = 0;
            const dir = this.lastFireDir || this.facing;
            if (dir === 'left') pupilOffsetX = -2;
            if (dir === 'right') pupilOffsetX = 2;
            if (dir === 'up') pupilOffsetY = -2;
            if (dir === 'down') pupilOffsetY = 2;

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - eyeOffset + pupilOffsetX, eyeY + pupilOffsetY, 2, 0, Math.PI * 2);
            ctx.arc(x + eyeOffset + pupilOffsetX, eyeY + pupilOffsetY, 2, 0, Math.PI * 2);
            ctx.fill();

            // Tears (crying)
            if (this.tearCooldown > 0) {
                ctx.fillStyle = COLORS.tear;
                ctx.beginPath();
                ctx.ellipse(x - eyeOffset, eyeY + 8, 2, 4, 0, 0, Math.PI * 2);
                ctx.ellipse(x + eyeOffset, eyeY + 8, 2, 4, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // Mouth
            ctx.strokeStyle = '#8b5a2b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y + 2, 4, 0.2 * Math.PI, 0.8 * Math.PI);
            ctx.stroke();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENEMY CLASSES
    // ═══════════════════════════════════════════════════════════════════════════
    class Enemy {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.width = 32;
            this.height = 32;

            // State
            this.state = 'spawning';
            this.spawnTimer = ENEMY_SPAWN_DURATION;
            this.canMove = false;
            this.canAttack = false;
            this.invulnerable = true;
            this.stunTimer = 0;

            // Set stats based on type
            this.setTypeStats();

            // Animation
            this.animFrame = 0;
            this.animTimer = 0;
            this.vx = 0;
            this.vy = 0;
        }

        setTypeStats() {
            switch (this.type) {
                case 'fly':
                    this.hp = 4;
                    this.maxHp = 4;
                    this.speed = 60;
                    this.damage = 0.5;
                    this.isFlying = true;
                    this.behavior = 'wander';
                    this.width = 24;
                    this.height = 24;
                    break;
                case 'attackFly':
                    this.hp = 6;
                    this.maxHp = 6;
                    this.speed = 100;
                    this.damage = 0.5;
                    this.isFlying = true;
                    this.behavior = 'chase';
                    this.width = 24;
                    this.height = 24;
                    break;
                case 'gaper':
                    this.hp = 12;
                    this.maxHp = 12;
                    this.speed = 70;
                    this.damage = 1;
                    this.isFlying = false;
                    this.behavior = 'chase';
                    break;
                case 'pooter':
                    this.hp = 8;
                    this.maxHp = 8;
                    this.speed = 40;
                    this.damage = 0.5;
                    this.isFlying = true;
                    this.behavior = 'shootChase';
                    this.fireRate = 2.0;
                    this.fireCooldown = 1.0;
                    this.width = 28;
                    this.height = 28;
                    break;
                case 'spider':
                    this.hp = 6;
                    this.maxHp = 6;
                    this.speed = 120;
                    this.damage = 0.5;
                    this.isFlying = false;
                    this.behavior = 'erratic';
                    this.width = 20;
                    this.height = 20;
                    this.dirChangeTimer = 0;
                    break;
                case 'charger':
                    this.hp = 15;
                    this.maxHp = 15;
                    this.speed = 50;
                    this.chargeSpeed = 250;
                    this.damage = 1;
                    this.isFlying = false;
                    this.behavior = 'charge';
                    this.charging = false;
                    this.chargeDir = { x: 0, y: 0 };
                    break;
                case 'clotty':
                    this.hp = 10;
                    this.maxHp = 10;
                    this.speed = 50;
                    this.damage = 0.5;
                    this.isFlying = false;
                    this.behavior = 'shoot4way';
                    this.fireRate = 2.5;
                    this.fireCooldown = 1.5;
                    break;
                case 'hopper':
                    this.hp = 10;
                    this.maxHp = 10;
                    this.speed = 0;
                    this.jumpForce = 200;
                    this.damage = 1;
                    this.isFlying = false;
                    this.behavior = 'hop';
                    this.hopTimer = 0;
                    this.hopCooldown = 1.5;
                    this.isJumping = false;
                    break;
                default:
                    this.hp = 10;
                    this.maxHp = 10;
                    this.speed = 50;
                    this.damage = 0.5;
                    this.isFlying = false;
                    this.behavior = 'wander';
            }
        }

        update(dt) {
            // Spawn animation
            if (this.state === 'spawning') {
                this.spawnTimer -= dt;
                if (this.spawnTimer <= 0) {
                    this.state = 'active';
                    this.canMove = true;
                    this.canAttack = true;
                    this.invulnerable = false;
                }
                return;
            }

            // Stun
            if (this.stunTimer > 0) {
                this.stunTimer -= dt;
                return;
            }

            if (!this.canMove) return;

            // Animation
            this.animTimer += dt;
            if (this.animTimer > 0.15) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 4;
            }

            // Behavior
            switch (this.behavior) {
                case 'wander':
                    this.behaviorWander(dt);
                    break;
                case 'chase':
                    this.behaviorChase(dt);
                    break;
                case 'shootChase':
                    this.behaviorShootChase(dt);
                    break;
                case 'erratic':
                    this.behaviorErratic(dt);
                    break;
                case 'charge':
                    this.behaviorCharge(dt);
                    break;
                case 'shoot4way':
                    this.behaviorShoot4Way(dt);
                    break;
                case 'hop':
                    this.behaviorHop(dt);
                    break;
            }

            // Apply movement with collision
            if (!this.isFlying) {
                this.applyGroundCollision(dt);
            } else {
                this.x += this.vx * dt;
                this.y += this.vy * dt;
            }

            // Keep in bounds
            this.keepInBounds();
        }

        behaviorWander(dt) {
            if (this.vx === 0 && this.vy === 0 || Math.random() < 0.02) {
                const angle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(angle) * this.speed;
                this.vy = Math.sin(angle) * this.speed;
            }
        }

        behaviorChase(dt) {
            if (!player) return;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const norm = normalize(dx, dy);
            this.vx = norm.x * this.speed;
            this.vy = norm.y * this.speed;
        }

        behaviorShootChase(dt) {
            if (!player) return;

            // Slowly move toward player
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const norm = normalize(dx, dy);
            this.vx = norm.x * this.speed;
            this.vy = norm.y * this.speed;

            // Shoot
            if (this.canAttack) {
                this.fireCooldown -= dt;
                if (this.fireCooldown <= 0) {
                    this.fireProjectile(norm.x, norm.y);
                    this.fireCooldown = this.fireRate;
                }
            }
        }

        behaviorErratic(dt) {
            this.dirChangeTimer -= dt;
            if (this.dirChangeTimer <= 0 || (this.vx === 0 && this.vy === 0)) {
                // Random direction change
                const angle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(angle) * this.speed;
                this.vy = Math.sin(angle) * this.speed;
                this.dirChangeTimer = randomRange(0.2, 0.8);
            }

            // Occasionally chase player briefly
            if (player && Math.random() < 0.01) {
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                if (distance(this.x, this.y, player.x, player.y) < 100) {
                    const norm = normalize(dx, dy);
                    this.vx = norm.x * this.speed * 1.5;
                    this.vy = norm.y * this.speed * 1.5;
                }
            }
        }

        behaviorCharge(dt) {
            if (!player) return;

            if (this.charging) {
                // Continue charging in set direction
                this.vx = this.chargeDir.x * this.chargeSpeed;
                this.vy = this.chargeDir.y * this.chargeSpeed;

                // Stop if hit wall
                if (this.hitWall) {
                    this.charging = false;
                    this.vx = 0;
                    this.vy = 0;
                }
            } else {
                // Wander slowly
                if (Math.random() < 0.02) {
                    const angle = Math.random() * Math.PI * 2;
                    this.vx = Math.cos(angle) * this.speed;
                    this.vy = Math.sin(angle) * this.speed;
                }

                // Check if player in line to charge
                const dx = player.x - this.x;
                const dy = player.y - this.y;

                if (Math.abs(dx) < 20 || Math.abs(dy) < 20) {
                    // In line - start charge
                    if (Math.abs(dx) < 20) {
                        this.chargeDir = { x: 0, y: dy > 0 ? 1 : -1 };
                    } else {
                        this.chargeDir = { x: dx > 0 ? 1 : -1, y: 0 };
                    }
                    this.charging = true;
                }
            }
        }

        behaviorShoot4Way(dt) {
            // Wander
            if (Math.random() < 0.02) {
                const angle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(angle) * this.speed;
                this.vy = Math.sin(angle) * this.speed;
            }

            // Shoot in 4 directions
            if (this.canAttack) {
                this.fireCooldown -= dt;
                if (this.fireCooldown <= 0) {
                    this.fireProjectile(1, 0);
                    this.fireProjectile(-1, 0);
                    this.fireProjectile(0, 1);
                    this.fireProjectile(0, -1);
                    this.fireCooldown = this.fireRate;
                }
            }
        }

        behaviorHop(dt) {
            if (!player) return;

            if (this.isJumping) {
                // In air - continue arc
                this.vy += 400 * dt; // gravity
                if (this.y > this.jumpStartY) {
                    // Landed
                    this.y = this.jumpStartY;
                    this.isJumping = false;
                    this.vx = 0;
                    this.vy = 0;
                    this.hopTimer = this.hopCooldown;
                }
            } else {
                // On ground - wait then hop
                this.hopTimer -= dt;
                if (this.hopTimer <= 0) {
                    // Jump toward player
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const norm = normalize(dx, dy);
                    this.vx = norm.x * this.jumpForce;
                    this.vy = -this.jumpForce;
                    this.isJumping = true;
                    this.jumpStartY = this.y;
                }
            }
        }

        fireProjectile(dirX, dirY) {
            const proj = {
                x: this.x,
                y: this.y,
                vx: dirX * 150,
                vy: dirY * 150,
                damage: this.damage,
                size: 8,
                lifetime: 2.0
            };
            enemyProjectiles.push(proj);
        }

        applyGroundCollision(dt) {
            if (!currentRoom) return;

            const newX = this.x + this.vx * dt;
            const newY = this.y + this.vy * dt;

            this.hitWall = false;

            // Check tile collision
            const grid = worldToGrid(newX, newY);
            if (grid.x >= 0 && grid.x < ROOM_TILES_X && grid.y >= 0 && grid.y < ROOM_TILES_Y) {
                const tile = currentRoom.tiles[grid.y]?.[grid.x];
                if (tile && (tile.type === 'rock' || tile.type === 'poop')) {
                    // Try alternate directions
                    const altDirs = [
                        { x: this.vx, y: 0 },
                        { x: 0, y: this.vy },
                        { x: -this.vy, y: this.vx },
                        { x: this.vy, y: -this.vx }
                    ];

                    for (const alt of altDirs) {
                        const altX = this.x + alt.x * dt;
                        const altY = this.y + alt.y * dt;
                        const altGrid = worldToGrid(altX, altY);
                        const altTile = currentRoom.tiles[altGrid.y]?.[altGrid.x];
                        if (!altTile || (altTile.type !== 'rock' && altTile.type !== 'poop')) {
                            this.x = altX;
                            this.y = altY;
                            return;
                        }
                    }

                    this.hitWall = true;
                    this.vx = -this.vx;
                    this.vy = -this.vy;
                    return;
                }
            }

            this.x = newX;
            this.y = newY;
        }

        keepInBounds() {
            const minX = ROOM_OFFSET_X + WALL_THICKNESS + this.width / 2;
            const maxX = ROOM_OFFSET_X + ROOM_WIDTH - WALL_THICKNESS - this.width / 2;
            const minY = ROOM_OFFSET_Y + WALL_THICKNESS + this.height / 2;
            const maxY = ROOM_OFFSET_Y + ROOM_HEIGHT - WALL_THICKNESS - this.height / 2;

            if (this.x < minX) { this.x = minX; this.vx = Math.abs(this.vx); this.hitWall = true; }
            if (this.x > maxX) { this.x = maxX; this.vx = -Math.abs(this.vx); this.hitWall = true; }
            if (this.y < minY) { this.y = minY; this.vy = Math.abs(this.vy); this.hitWall = true; }
            if (this.y > maxY) { this.y = maxY; this.vy = -Math.abs(this.vy); this.hitWall = true; }
        }

        takeDamage(amount) {
            if (this.invulnerable) return;

            this.hp -= amount;

            // Knockback
            if (player) {
                const dx = this.x - player.x;
                const dy = this.y - player.y;
                const norm = normalize(dx, dy);
                this.vx += norm.x * 100;
                this.vy += norm.y * 100;
            }

            // Hit effect
            effects.push({
                type: 'hit',
                x: this.x,
                y: this.y,
                lifetime: 0.15
            });

            if (this.hp <= 0) {
                this.die();
            }
        }

        die() {
            // Remove from room
            if (currentRoom) {
                const idx = currentRoom.enemies.indexOf(this);
                if (idx !== -1) {
                    currentRoom.enemies.splice(idx, 1);
                }
            }

            // Death effect
            effects.push({
                type: 'death',
                x: this.x,
                y: this.y,
                lifetime: 0.3
            });

            // Drop chance
            if (Math.random() < 0.33) {
                spawnRandomPickup(this.x, this.y);
            }

            // Check if room cleared
            if (currentRoom && currentRoom.enemies.length === 0) {
                onRoomCleared();
            }
        }

        render(ctx) {
            const x = this.x;
            const y = this.y;

            // Spawn animation (rising from floor)
            if (this.state === 'spawning') {
                const progress = 1 - (this.spawnTimer / ENEMY_SPAWN_DURATION);
                ctx.globalAlpha = progress;
                ctx.save();
                ctx.translate(x, y + (1 - progress) * 20);
            }

            switch (this.type) {
                case 'fly':
                case 'attackFly':
                    this.renderFly(ctx);
                    break;
                case 'gaper':
                    this.renderGaper(ctx);
                    break;
                case 'pooter':
                    this.renderPooter(ctx);
                    break;
                case 'spider':
                    this.renderSpider(ctx);
                    break;
                case 'charger':
                    this.renderCharger(ctx);
                    break;
                case 'clotty':
                    this.renderClotty(ctx);
                    break;
                case 'hopper':
                    this.renderHopper(ctx);
                    break;
                default:
                    this.renderDefault(ctx);
            }

            if (this.state === 'spawning') {
                ctx.restore();
                ctx.globalAlpha = 1;
            }
        }

        renderFly(ctx) {
            const x = this.x;
            const y = this.y;
            const wobble = Math.sin(this.animTimer * 20) * 2;

            // Wings
            ctx.fillStyle = this.type === 'attackFly' ? '#c0392b' : '#7f8c8d';
            ctx.beginPath();
            ctx.ellipse(x - 10, y + wobble, 8, 5, -0.3, 0, Math.PI * 2);
            ctx.ellipse(x + 10, y + wobble, 8, 5, 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Body
            ctx.fillStyle = this.type === 'attackFly' ? '#922b21' : '#5d6d7e';
            ctx.beginPath();
            ctx.ellipse(x, y, 8, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x - 3, y - 4, 3, 0, Math.PI * 2);
            ctx.arc(x + 3, y - 4, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - 3, y - 4, 1.5, 0, Math.PI * 2);
            ctx.arc(x + 3, y - 4, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        renderGaper(ctx) {
            const x = this.x;
            const y = this.y;

            // Body
            ctx.fillStyle = '#d5a6bd';
            ctx.beginPath();
            ctx.ellipse(x, y + 4, 14, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.fillStyle = '#d5a6bd';
            ctx.beginPath();
            ctx.arc(x, y - 6, 12, 0, Math.PI * 2);
            ctx.fill();

            // Eyes (bloodshot)
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x - 5, y - 8, 5, 0, Math.PI * 2);
            ctx.arc(x + 5, y - 8, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#c0392b';
            ctx.beginPath();
            ctx.arc(x - 5, y - 8, 3, 0, Math.PI * 2);
            ctx.arc(x + 5, y - 8, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - 5, y - 8, 1.5, 0, Math.PI * 2);
            ctx.arc(x + 5, y - 8, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Mouth (open)
            ctx.fillStyle = '#7b241c';
            ctx.beginPath();
            ctx.ellipse(x, y, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        renderPooter(ctx) {
            const x = this.x;
            const y = this.y;
            const wobble = Math.sin(this.animTimer * 15) * 1.5;

            // Wings
            ctx.fillStyle = '#d35400';
            ctx.beginPath();
            ctx.ellipse(x - 12, y + wobble, 6, 10, -0.2, 0, Math.PI * 2);
            ctx.ellipse(x + 12, y + wobble, 6, 10, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Body
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fill();

            // Face
            ctx.fillStyle = '#f5b7b1';
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - 3, y - 2, 2, 0, Math.PI * 2);
            ctx.arc(x + 3, y - 2, 2, 0, Math.PI * 2);
            ctx.fill();

            // Nose
            ctx.fillStyle = '#c0392b';
            ctx.beginPath();
            ctx.arc(x, y + 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        renderSpider(ctx) {
            const x = this.x;
            const y = this.y;

            // Legs
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const angle = (i * 0.5 - 0.75) * Math.PI;
                const legWobble = Math.sin(this.animTimer * 20 + i) * 3;

                ctx.beginPath();
                ctx.moveTo(x - 4, y);
                ctx.lineTo(x - 10 + legWobble, y + Math.sin(angle) * 8);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x + 4, y);
                ctx.lineTo(x + 10 - legWobble, y + Math.sin(angle) * 8);
                ctx.stroke();
            }

            // Body
            ctx.fillStyle = '#34495e';
            ctx.beginPath();
            ctx.ellipse(x, y, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(x - 3, y - 2, 2, 0, Math.PI * 2);
            ctx.arc(x + 3, y - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        renderCharger(ctx) {
            const x = this.x;
            const y = this.y;

            // Body (maggot-like)
            const segments = 5;
            const segmentSize = 8;

            for (let i = 0; i < segments; i++) {
                const segX = x - (this.vx > 0 ? 1 : -1) * i * 5;
                const size = segmentSize - i;
                ctx.fillStyle = i === 0 ? '#d5a6bd' : '#c39bd3';
                ctx.beginPath();
                ctx.arc(segX, y, size, 0, Math.PI * 2);
                ctx.fill();
            }

            // Head
            ctx.fillStyle = '#d5a6bd';
            ctx.beginPath();
            ctx.arc(x + (this.vx > 0 ? 8 : -8), y, 10, 0, Math.PI * 2);
            ctx.fill();

            // Teeth
            ctx.fillStyle = '#fff';
            const headX = x + (this.vx > 0 ? 15 : -15);
            ctx.beginPath();
            ctx.moveTo(headX, y - 4);
            ctx.lineTo(headX + (this.vx > 0 ? 5 : -5), y);
            ctx.lineTo(headX, y + 4);
            ctx.closePath();
            ctx.fill();
        }

        renderClotty(ctx) {
            const x = this.x;
            const y = this.y;

            // Blood blob body
            ctx.fillStyle = '#922b21';
            ctx.beginPath();
            ctx.arc(x, y, 14, 0, Math.PI * 2);
            ctx.fill();

            // Highlights
            ctx.fillStyle = '#c0392b';
            ctx.beginPath();
            ctx.arc(x - 3, y - 3, 6, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#f9e79f';
            ctx.beginPath();
            ctx.arc(x - 4, y - 2, 4, 0, Math.PI * 2);
            ctx.arc(x + 4, y - 2, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - 4, y - 2, 2, 0, Math.PI * 2);
            ctx.arc(x + 4, y - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        renderHopper(ctx) {
            const x = this.x;
            const y = this.y;

            // Body
            const squash = this.isJumping ? 0.8 : 1.2;
            ctx.fillStyle = '#a9cce3';
            ctx.beginPath();
            ctx.ellipse(x, y, 12 / squash, 14 * squash, 0, 0, Math.PI * 2);
            ctx.fill();

            // Face
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2);
            ctx.arc(x + 4, y - 4, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x - 4, y - 4, 2, 0, Math.PI * 2);
            ctx.arc(x + 4, y - 4, 2, 0, Math.PI * 2);
            ctx.fill();

            // Legs
            if (!this.isJumping) {
                ctx.fillStyle = '#7fb3d5';
                ctx.beginPath();
                ctx.ellipse(x - 8, y + 10, 6, 4, -0.3, 0, Math.PI * 2);
                ctx.ellipse(x + 8, y + 10, 6, 4, 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        renderDefault(ctx) {
            ctx.fillStyle = COLORS.enemy;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ROOM AND FLOOR GENERATION
    // ═══════════════════════════════════════════════════════════════════════════
    const ROOM_TEMPLATES = [
        {
            name: 'empty',
            tiles: [
                '.............',
                '.............',
                '.............',
                '.............',
                '.............',
                '.............',
                '.............'
            ],
            enemyCount: 0
        },
        {
            name: 'corner_rocks',
            tiles: [
                '##.......##',
                '#.........#',
                '...........',
                '...........',
                '...........',
                '#.........#',
                '##.......##'
            ],
            enemyCount: 3
        },
        {
            name: 'center_rocks',
            tiles: [
                '...........',
                '...........',
                '....###....',
                '....#.#....',
                '....###....',
                '...........',
                '...........'
            ],
            enemyCount: 4
        },
        {
            name: 'scattered',
            tiles: [
                '..#.....#..',
                '...........',
                '.....#.....',
                '...........',
                '.....#.....',
                '...........',
                '..#.....#..'
            ],
            enemyCount: 3
        },
        {
            name: 'poop_room',
            tiles: [
                '...........',
                '..P.....P..',
                '...........',
                '....PPP....',
                '...........',
                '..P.....P..',
                '...........'
            ],
            enemyCount: 2
        },
        {
            name: 'mixed',
            tiles: [
                '#.........#',
                '...........',
                '..P.....P..',
                '...........',
                '..P.....P..',
                '...........',
                '#.........#'
            ],
            enemyCount: 4
        },
        {
            name: 'corridor',
            tiles: [
                '###.....###',
                '##.......##',
                '...........',
                '...........',
                '...........',
                '##.......##',
                '###.....###'
            ],
            enemyCount: 2
        }
    ];

    const ENEMY_TYPES_BY_FLOOR = {
        1: ['fly', 'attackFly', 'gaper', 'spider'],
        2: ['fly', 'attackFly', 'gaper', 'spider', 'pooter', 'charger'],
        3: ['gaper', 'pooter', 'charger', 'clotty', 'hopper'],
        4: ['charger', 'clotty', 'hopper', 'pooter']
    };

    class Room {
        constructor(gridX, gridY, type) {
            this.gridX = gridX;
            this.gridY = gridY;
            this.type = type; // 'normal', 'start', 'boss', 'treasure', 'shop', 'secret'
            this.discovered = false;
            this.cleared = false;
            this.doors = { north: false, south: false, east: false, west: false };
            this.tiles = [];
            this.enemies = [];
            this.pickups = [];
            this.savedState = null;
        }

        generate(floor) {
            // Choose template based on room type
            let template;
            if (this.type === 'start') {
                template = ROOM_TEMPLATES[0]; // empty
            } else if (this.type === 'boss') {
                template = ROOM_TEMPLATES[0]; // empty for boss
            } else if (this.type === 'treasure') {
                template = ROOM_TEMPLATES[0]; // empty with pedestal
            } else if (this.type === 'shop') {
                template = ROOM_TEMPLATES[0]; // empty with shop items
            } else {
                template = randomChoice(ROOM_TEMPLATES);
            }

            // Parse tiles
            this.tiles = [];
            for (let y = 0; y < ROOM_TILES_Y; y++) {
                this.tiles[y] = [];
                for (let x = 0; x < ROOM_TILES_X; x++) {
                    const char = template.tiles[y]?.[x] || '.';
                    let tileType = null;

                    if (char === '#') tileType = 'rock';
                    else if (char === 'P') tileType = 'poop';
                    else if (char === 'X') tileType = 'pit';

                    this.tiles[y][x] = tileType ? { type: tileType, hp: tileType === 'poop' ? 3 : 0 } : null;
                }
            }

            // Spawn enemies for normal rooms
            if (this.type === 'normal' && template.enemyCount > 0) {
                const enemyTypes = ENEMY_TYPES_BY_FLOOR[Math.min(floor, 4)] || ENEMY_TYPES_BY_FLOOR[1];
                const count = template.enemyCount + randomInt(-1, 1);

                for (let i = 0; i < Math.max(1, count); i++) {
                    // Find empty tile
                    let ex, ey, attempts = 0;
                    do {
                        ex = randomInt(2, ROOM_TILES_X - 3);
                        ey = randomInt(2, ROOM_TILES_Y - 3);
                        attempts++;
                    } while (this.tiles[ey][ex] && attempts < 20);

                    if (attempts < 20) {
                        const pos = gridToWorld(ex, ey);
                        const enemyType = randomChoice(enemyTypes);
                        this.enemies.push(new Enemy(pos.x, pos.y, enemyType));
                    }
                }
            }

            // Boss room enemy
            if (this.type === 'boss') {
                const pos = gridToWorld(6, 3);
                // Simple boss - stronger gaper for now
                const boss = new Enemy(pos.x, pos.y, 'gaper');
                boss.hp = 100;
                boss.maxHp = 100;
                boss.width = 48;
                boss.height = 48;
                boss.damage = 1;
                boss.speed = 60;
                this.enemies.push(boss);
            }

            // Treasure room item
            if (this.type === 'treasure') {
                const pos = gridToWorld(6, 3);
                this.pickups.push({
                    type: 'item',
                    x: pos.x,
                    y: pos.y,
                    collected: false,
                    itemName: 'Mystery Item'
                });
            }

            // Shop items
            if (this.type === 'shop') {
                for (let i = 0; i < 3; i++) {
                    const pos = gridToWorld(4 + i * 2, 3);
                    this.pickups.push({
                        type: 'shopItem',
                        x: pos.x,
                        y: pos.y,
                        collected: false,
                        price: [3, 5, 7][i],
                        itemType: ['heart', 'bomb', 'key'][i]
                    });
                }
            }
        }

        saveState() {
            this.savedState = {
                cleared: this.cleared,
                tiles: JSON.parse(JSON.stringify(this.tiles)),
                enemies: [], // enemies that were killed stay killed
                pickups: this.pickups.filter(p => !p.collected).map(p => ({...p}))
            };
        }

        restoreState() {
            if (this.savedState) {
                this.cleared = this.savedState.cleared;
                this.tiles = JSON.parse(JSON.stringify(this.savedState.tiles));
                this.enemies = []; // Killed enemies stay dead
                this.pickups = this.savedState.pickups.map(p => ({...p}));
            }
        }
    }

    class Floor {
        constructor(floorNum) {
            this.floorNumber = floorNum;
            this.rooms = new Map(); // key: "x,y"
            this.startRoom = null;
            this.bossRoom = null;
            this.generate();
        }

        generate() {
            const targetRooms = this.calculateRoomCount();
            const grid = new Map();

            // Start at center
            const startX = 4, startY = 4;
            const startRoom = new Room(startX, startY, 'start');
            grid.set(`${startX},${startY}`, startRoom);
            this.startRoom = startRoom;

            const queue = [{ x: startX, y: startY }];
            const allRooms = [{ x: startX, y: startY }];
            const deadEnds = [];

            // Breadth-first expansion
            while (queue.length > 0 && allRooms.length < targetRooms) {
                const current = queue.shift();
                let expandedAny = false;

                const directions = [
                    { dx: 0, dy: -1 },
                    { dx: 0, dy: 1 },
                    { dx: -1, dy: 0 },
                    { dx: 1, dy: 0 }
                ];

                // Shuffle directions for variety
                for (let i = directions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [directions[i], directions[j]] = [directions[j], directions[i]];
                }

                for (const dir of directions) {
                    const newX = current.x + dir.dx;
                    const newY = current.y + dir.dy;

                    if (newX < 0 || newX > 8 || newY < 0 || newY > 8) continue;
                    if (grid.has(`${newX},${newY}`)) continue;

                    // Check neighbor count
                    let neighborCount = 0;
                    for (const d of directions) {
                        if (grid.has(`${newX + d.dx},${newY + d.dy}`)) neighborCount++;
                    }
                    if (neighborCount >= 2) continue;

                    if (allRooms.length >= targetRooms) continue;
                    if (Math.random() < 0.5) continue;

                    const newRoom = new Room(newX, newY, 'normal');
                    grid.set(`${newX},${newY}`, newRoom);
                    queue.push({ x: newX, y: newY });
                    allRooms.push({ x: newX, y: newY });
                    expandedAny = true;
                }

                if (!expandedAny) {
                    deadEnds.push(current);
                }
            }

            // Place special rooms
            this.placeBossRoom(grid, deadEnds, startX, startY);
            this.placeTreasureRoom(grid, deadEnds);
            this.placeShopRoom(grid, deadEnds);

            // Connect doors
            for (const [key, room] of grid) {
                const [x, y] = key.split(',').map(Number);
                if (grid.has(`${x},${y-1}`)) room.doors.north = true;
                if (grid.has(`${x},${y+1}`)) room.doors.south = true;
                if (grid.has(`${x+1},${y}`)) room.doors.east = true;
                if (grid.has(`${x-1},${y}`)) room.doors.west = true;
            }

            // Generate room contents
            for (const room of grid.values()) {
                room.generate(this.floorNumber);
            }

            this.rooms = grid;
            this.startRoom.discovered = true;
            this.startRoom.cleared = true;
        }

        calculateRoomCount() {
            return Math.floor(Math.random() * 2) + 5 + Math.floor(this.floorNumber * 2.6);
        }

        placeBossRoom(grid, deadEnds, startX, startY) {
            if (deadEnds.length === 0) return;

            let furthest = deadEnds[0];
            let maxDist = 0;

            for (const room of deadEnds) {
                const dist = Math.abs(room.x - startX) + Math.abs(room.y - startY);
                if (dist > maxDist) {
                    maxDist = dist;
                    furthest = room;
                }
            }

            const bossRoom = grid.get(`${furthest.x},${furthest.y}`);
            if (bossRoom) {
                bossRoom.type = 'boss';
                this.bossRoom = bossRoom;
                deadEnds.splice(deadEnds.indexOf(furthest), 1);
            }
        }

        placeTreasureRoom(grid, deadEnds) {
            if (deadEnds.length === 0) return;

            const idx = Math.floor(Math.random() * deadEnds.length);
            const pos = deadEnds[idx];
            const room = grid.get(`${pos.x},${pos.y}`);
            if (room) {
                room.type = 'treasure';
                deadEnds.splice(idx, 1);
            }
        }

        placeShopRoom(grid, deadEnds) {
            if (deadEnds.length === 0) return;

            const idx = Math.floor(Math.random() * deadEnds.length);
            const pos = deadEnds[idx];
            const room = grid.get(`${pos.x},${pos.y}`);
            if (room) {
                room.type = 'shop';
                deadEnds.splice(idx, 1);
            }
        }

        getRoom(x, y) {
            return this.rooms.get(`${x},${y}`);
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

        // Start game loop
        requestAnimationFrame(gameLoop);

        console.log('[HARNESS] Test harness initialized, game paused');
    }

    function startGame() {
        player = new Player();
        currentFloor = new Floor(floorNumber);
        currentRoom = currentFloor.startRoom;

        // Position player in start room
        const startPos = gridToWorld(6, 5);
        player.x = startPos.x;
        player.y = startPos.y;

        tears = [];
        enemyProjectiles = [];
        effects = [];

        gameState = 'playing';
    }

    function transitionToRoom(direction) {
        if (!currentRoom || !currentFloor) return;

        // Save current room state
        currentRoom.saveState();

        // Find next room
        let nextX = currentRoom.gridX;
        let nextY = currentRoom.gridY;

        if (direction === 'north') nextY--;
        if (direction === 'south') nextY++;
        if (direction === 'east') nextX++;
        if (direction === 'west') nextX--;

        const nextRoom = currentFloor.getRoom(nextX, nextY);
        if (!nextRoom) return;

        // Restore next room state if visited before
        if (nextRoom.discovered) {
            nextRoom.restoreState();
        }

        currentRoom = nextRoom;
        currentRoom.discovered = true;

        // Position player at entry door
        const centerX = ROOM_OFFSET_X + ROOM_WIDTH / 2;
        const centerY = ROOM_OFFSET_Y + ROOM_HEIGHT / 2;
        const doorOffset = WALL_THICKNESS + 24;

        if (direction === 'north') {
            player.x = centerX;
            player.y = ROOM_OFFSET_Y + ROOM_HEIGHT - doorOffset;
        } else if (direction === 'south') {
            player.x = centerX;
            player.y = ROOM_OFFSET_Y + doorOffset;
        } else if (direction === 'east') {
            player.x = ROOM_OFFSET_X + doorOffset;
            player.y = centerY;
        } else if (direction === 'west') {
            player.x = ROOM_OFFSET_X + ROOM_WIDTH - doorOffset;
            player.y = centerY;
        }

        // Spawn pause
        player.spawnPauseTimer = SPAWN_PAUSE_DURATION;

        // Reset room enemies to spawning state
        for (const enemy of currentRoom.enemies) {
            enemy.state = 'spawning';
            enemy.spawnTimer = ENEMY_SPAWN_DURATION;
            enemy.canMove = false;
            enemy.canAttack = false;
            enemy.invulnerable = true;
        }

        // Clear projectiles
        tears = [];
        enemyProjectiles = [];
    }

    function onRoomCleared() {
        if (!currentRoom) return;

        currentRoom.cleared = true;

        // Spawn pickup
        if (Math.random() < 0.5) {
            const pos = gridToWorld(6, 3);
            spawnRandomPickup(pos.x, pos.y);
        }

        // Check for victory (boss killed)
        if (currentRoom.type === 'boss') {
            // Spawn trapdoor or victory
            if (floorNumber >= 2) {
                gameState = 'victory';
            } else {
                // Spawn trapdoor pickup
                const pos = gridToWorld(6, 3);
                currentRoom.pickups.push({
                    type: 'trapdoor',
                    x: pos.x,
                    y: pos.y,
                    collected: false
                });
            }
        }
    }

    function spawnRandomPickup(x, y) {
        const types = [
            { type: 'heart', weight: 20 },
            { type: 'halfHeart', weight: 15 },
            { type: 'coin', weight: 25 },
            { type: 'bomb', weight: 10 },
            { type: 'key', weight: 10 }
        ];

        const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
        let roll = Math.random() * totalWeight;

        for (const t of types) {
            roll -= t.weight;
            if (roll <= 0) {
                pickups.push({
                    type: t.type,
                    x: x + randomRange(-10, 10),
                    y: y + randomRange(-10, 10)
                });
                return;
            }
        }
    }

    function collectPickup(pickup) {
        switch (pickup.type) {
            case 'heart':
                player.heal(1);
                break;
            case 'halfHeart':
                player.heal(0.5);
                break;
            case 'coin':
                player.coins++;
                break;
            case 'bomb':
                player.bombs++;
                break;
            case 'key':
                player.keys++;
                break;
            case 'soulHeart':
                player.soulHearts = Math.min(player.soulHearts + 1, 12);
                break;
            case 'trapdoor':
                // Go to next floor
                floorNumber++;
                currentFloor = new Floor(floorNumber);
                currentRoom = currentFloor.startRoom;
                const startPos = gridToWorld(6, 5);
                player.x = startPos.x;
                player.y = startPos.y;
                tears = [];
                enemyProjectiles = [];
                break;
            case 'item':
                // Stat upgrade
                player.damage += 0.5;
                break;
            case 'shopItem':
                if (player.coins >= pickup.price) {
                    player.coins -= pickup.price;
                    if (pickup.itemType === 'heart') player.heal(1);
                    if (pickup.itemType === 'bomb') player.bombs++;
                    if (pickup.itemType === 'key') player.keys++;
                }
                break;
        }

        // Effect
        effects.push({
            type: 'pickup',
            x: pickup.x,
            y: pickup.y,
            lifetime: 0.2
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UPDATE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    function update(dt) {
        if (gameState !== 'playing') return;

        // Update player
        if (player) {
            player.update(dt);
        }

        // Update enemies
        if (currentRoom) {
            for (const enemy of currentRoom.enemies) {
                enemy.update(dt);

                // Check collision with player
                if (player && enemy.state === 'active') {
                    const dist = distance(player.x, player.y, enemy.x, enemy.y);
                    if (dist < (player.width + enemy.width) / 2 - 4) {
                        player.takeDamage(enemy.damage);
                    }
                }
            }
        }

        // Update tears
        for (let i = tears.length - 1; i >= 0; i--) {
            const tear = tears[i];
            tear.x += tear.vx * dt;
            tear.y += tear.vy * dt;
            tear.vy += 50 * dt; // gravity
            tear.lifetime -= dt;

            // Check collision with enemies
            let hit = false;
            if (currentRoom) {
                for (const enemy of currentRoom.enemies) {
                    const dist = distance(tear.x, tear.y, enemy.x, enemy.y);
                    if (dist < (tear.size + enemy.width) / 2) {
                        enemy.takeDamage(tear.damage);
                        hit = true;
                        break;
                    }
                }
            }

            // Check collision with tiles
            const grid = worldToGrid(tear.x, tear.y);
            if (grid.x >= 0 && grid.x < ROOM_TILES_X && grid.y >= 0 && grid.y < ROOM_TILES_Y) {
                const tile = currentRoom?.tiles[grid.y]?.[grid.x];
                if (tile) {
                    if (tile.type === 'rock') {
                        hit = true;
                    } else if (tile.type === 'poop') {
                        tile.hp--;
                        if (tile.hp <= 0) {
                            currentRoom.tiles[grid.y][grid.x] = null;
                            effects.push({
                                type: 'poopDestroy',
                                x: gridToWorld(grid.x, grid.y).x,
                                y: gridToWorld(grid.x, grid.y).y,
                                lifetime: 0.2
                            });
                        }
                        hit = true;
                    }
                }
            }

            // Check bounds
            if (tear.x < ROOM_OFFSET_X + WALL_THICKNESS ||
                tear.x > ROOM_OFFSET_X + ROOM_WIDTH - WALL_THICKNESS ||
                tear.y < ROOM_OFFSET_Y + WALL_THICKNESS ||
                tear.y > ROOM_OFFSET_Y + ROOM_HEIGHT - WALL_THICKNESS) {
                hit = true;
            }

            if (hit || tear.lifetime <= 0) {
                effects.push({
                    type: 'tearSplash',
                    x: tear.x,
                    y: tear.y,
                    lifetime: 0.15
                });
                tears.splice(i, 1);
            }
        }

        // Update enemy projectiles
        for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
            const proj = enemyProjectiles[i];
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;
            proj.lifetime -= dt;

            // Check collision with player
            if (player) {
                const dist = distance(proj.x, proj.y, player.x, player.y);
                if (dist < (proj.size + player.width) / 2 - 4) {
                    player.takeDamage(proj.damage);
                    enemyProjectiles.splice(i, 1);
                    continue;
                }
            }

            // Check bounds
            if (proj.x < ROOM_OFFSET_X + WALL_THICKNESS ||
                proj.x > ROOM_OFFSET_X + ROOM_WIDTH - WALL_THICKNESS ||
                proj.y < ROOM_OFFSET_Y + WALL_THICKNESS ||
                proj.y > ROOM_OFFSET_Y + ROOM_HEIGHT - WALL_THICKNESS ||
                proj.lifetime <= 0) {
                enemyProjectiles.splice(i, 1);
            }
        }

        // Update pickups (collect on contact)
        for (let i = pickups.length - 1; i >= 0; i--) {
            const pickup = pickups[i];
            if (player) {
                const dist = distance(player.x, player.y, pickup.x, pickup.y);
                if (dist < 24) {
                    collectPickup(pickup);
                    pickups.splice(i, 1);
                }
            }
        }

        // Room pickups
        if (currentRoom) {
            for (const pickup of currentRoom.pickups) {
                if (pickup.collected) continue;
                if (player) {
                    const dist = distance(player.x, player.y, pickup.x, pickup.y);
                    if (dist < 24) {
                        collectPickup(pickup);
                        pickup.collected = true;
                    }
                }
            }
        }

        // Update effects
        for (let i = effects.length - 1; i >= 0; i--) {
            effects[i].lifetime -= dt;
            if (effects[i].lifetime <= 0) {
                effects.splice(i, 1);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
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

        if (gameState === 'victory') {
            renderVictory();
            return;
        }

        // Render room
        renderRoom();

        // Render entities
        renderEntities();

        // Render UI
        renderUI();
    }

    function renderMenu() {
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('BINDING OF ISAAC', CANVAS_WIDTH / 2, 200);

        ctx.font = '24px Courier New';
        ctx.fillText('CLONE', CANVAS_WIDTH / 2, 240);

        ctx.font = '18px Courier New';
        ctx.fillText('WASD - Move', CANVAS_WIDTH / 2, 320);
        ctx.fillText('Arrow Keys - Shoot', CANVAS_WIDTH / 2, 350);
        ctx.fillText('E - Drop Bomb', CANVAS_WIDTH / 2, 380);

        ctx.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, 450);

        // Start on Enter
        if (keysDown['Enter']) {
            startGame();
        }
    }

    function renderGameOver() {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#c0392b';
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 280);

        ctx.fillStyle = COLORS.text;
        ctx.font = '24px Courier New';
        ctx.fillText(`Floor: ${floorNumber}`, CANVAS_WIDTH / 2, 340);

        ctx.font = '18px Courier New';
        ctx.fillText('Press ENTER to Restart', CANVAS_WIDTH / 2, 420);

        if (keysDown['Enter']) {
            floorNumber = 1;
            startGame();
        }
    }

    function renderVictory() {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', CANVAS_WIDTH / 2, 280);

        ctx.fillStyle = COLORS.text;
        ctx.font = '24px Courier New';
        ctx.fillText(`Cleared Floor ${floorNumber}!`, CANVAS_WIDTH / 2, 340);

        ctx.font = '18px Courier New';
        ctx.fillText('Press ENTER to Play Again', CANVAS_WIDTH / 2, 420);

        if (keysDown['Enter']) {
            floorNumber = 1;
            startGame();
        }
    }

    function renderRoom() {
        if (!currentRoom) return;

        // Room background (floor tiles)
        for (let y = 0; y < ROOM_TILES_Y; y++) {
            for (let x = 0; x < ROOM_TILES_X; x++) {
                const worldPos = gridToWorld(x, y);
                const isAlt = (x + y) % 2 === 0;
                ctx.fillStyle = isAlt ? COLORS.floor : COLORS.floorAlt;
                ctx.fillRect(
                    worldPos.x - TILE_SIZE / 2,
                    worldPos.y - TILE_SIZE / 2,
                    TILE_SIZE,
                    TILE_SIZE
                );
            }
        }

        // Walls
        ctx.fillStyle = COLORS.wall;
        // Top wall
        ctx.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH, WALL_THICKNESS);
        // Bottom wall
        ctx.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y + ROOM_HEIGHT - WALL_THICKNESS, ROOM_WIDTH, WALL_THICKNESS);
        // Left wall
        ctx.fillRect(ROOM_OFFSET_X, ROOM_OFFSET_Y, WALL_THICKNESS, ROOM_HEIGHT);
        // Right wall
        ctx.fillRect(ROOM_OFFSET_X + ROOM_WIDTH - WALL_THICKNESS, ROOM_OFFSET_Y, WALL_THICKNESS, ROOM_HEIGHT);

        // Doors
        const doorWidth = 48;
        const doorHeight = 32;
        const centerX = ROOM_OFFSET_X + ROOM_WIDTH / 2;
        const centerY = ROOM_OFFSET_Y + ROOM_HEIGHT / 2;
        const roomCleared = currentRoom.cleared || currentRoom.enemies.length === 0;

        // North door
        if (currentRoom.doors.north) {
            ctx.fillStyle = roomCleared ? COLORS.doorOpen : COLORS.door;
            ctx.fillRect(centerX - doorWidth / 2, ROOM_OFFSET_Y, doorWidth, WALL_THICKNESS);
        }
        // South door
        if (currentRoom.doors.south) {
            ctx.fillStyle = roomCleared ? COLORS.doorOpen : COLORS.door;
            ctx.fillRect(centerX - doorWidth / 2, ROOM_OFFSET_Y + ROOM_HEIGHT - WALL_THICKNESS, doorWidth, WALL_THICKNESS);
        }
        // East door
        if (currentRoom.doors.east) {
            ctx.fillStyle = roomCleared ? COLORS.doorOpen : COLORS.door;
            ctx.fillRect(ROOM_OFFSET_X + ROOM_WIDTH - WALL_THICKNESS, centerY - doorWidth / 2, WALL_THICKNESS, doorWidth);
        }
        // West door
        if (currentRoom.doors.west) {
            ctx.fillStyle = roomCleared ? COLORS.doorOpen : COLORS.door;
            ctx.fillRect(ROOM_OFFSET_X, centerY - doorWidth / 2, WALL_THICKNESS, doorWidth);
        }

        // Tiles (rocks, poop, etc)
        for (let y = 0; y < ROOM_TILES_Y; y++) {
            for (let x = 0; x < ROOM_TILES_X; x++) {
                const tile = currentRoom.tiles[y]?.[x];
                if (!tile) continue;

                const worldPos = gridToWorld(x, y);

                if (tile.type === 'rock') {
                    // Rock
                    ctx.fillStyle = COLORS.rock;
                    ctx.beginPath();
                    ctx.moveTo(worldPos.x - 18, worldPos.y + 10);
                    ctx.lineTo(worldPos.x - 10, worldPos.y - 15);
                    ctx.lineTo(worldPos.x + 10, worldPos.y - 15);
                    ctx.lineTo(worldPos.x + 18, worldPos.y + 10);
                    ctx.closePath();
                    ctx.fill();

                    ctx.fillStyle = '#95a5a6';
                    ctx.beginPath();
                    ctx.moveTo(worldPos.x - 10, worldPos.y - 15);
                    ctx.lineTo(worldPos.x, worldPos.y - 20);
                    ctx.lineTo(worldPos.x + 10, worldPos.y - 15);
                    ctx.closePath();
                    ctx.fill();
                } else if (tile.type === 'poop') {
                    // Poop (with damage states)
                    const damageLevel = 3 - tile.hp;
                    const size = 16 - damageLevel * 3;

                    ctx.fillStyle = COLORS.poop;
                    // Poop pile
                    ctx.beginPath();
                    ctx.arc(worldPos.x, worldPos.y + 5, size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(worldPos.x - 6, worldPos.y, size - 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(worldPos.x + 6, worldPos.y, size - 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(worldPos.x, worldPos.y - 8, size - 6, 0, Math.PI * 2);
                    ctx.fill();
                } else if (tile.type === 'pit') {
                    ctx.fillStyle = COLORS.pit;
                    ctx.fillRect(
                        worldPos.x - TILE_SIZE / 2 + 4,
                        worldPos.y - TILE_SIZE / 2 + 4,
                        TILE_SIZE - 8,
                        TILE_SIZE - 8
                    );
                }
            }
        }

        // Room pickups (items, shop items, trapdoor)
        for (const pickup of currentRoom.pickups) {
            if (pickup.collected) continue;
            renderPickup(pickup);
        }
    }

    function renderEntities() {
        // Render pickups
        for (const pickup of pickups) {
            renderPickup(pickup);
        }

        // Render enemies
        if (currentRoom) {
            for (const enemy of currentRoom.enemies) {
                enemy.render(ctx);
            }
        }

        // Render player
        if (player) {
            player.render(ctx);
        }

        // Render tears
        for (const tear of tears) {
            ctx.fillStyle = COLORS.tear;
            ctx.beginPath();
            ctx.arc(tear.x, tear.y, tear.size / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = COLORS.tearHighlight;
            ctx.beginPath();
            ctx.arc(tear.x - 2, tear.y - 2, tear.size / 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Render enemy projectiles
        for (const proj of enemyProjectiles) {
            ctx.fillStyle = '#922b21';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Render effects
        for (const effect of effects) {
            renderEffect(effect);
        }
    }

    function renderPickup(pickup) {
        const x = pickup.x;
        const y = pickup.y;
        const bob = Math.sin(Date.now() / 200) * 2;

        switch (pickup.type) {
            case 'heart':
                ctx.fillStyle = COLORS.heart;
                drawHeart(ctx, x, y + bob, 12);
                break;
            case 'halfHeart':
                ctx.fillStyle = COLORS.heart;
                drawHeart(ctx, x, y + bob, 8);
                break;
            case 'soulHeart':
                ctx.fillStyle = COLORS.soulHeart;
                drawHeart(ctx, x, y + bob, 12);
                break;
            case 'coin':
                ctx.fillStyle = COLORS.coin;
                ctx.beginPath();
                ctx.arc(x, y + bob, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#d4ac0d';
                ctx.font = 'bold 10px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('$', x, y + bob + 4);
                break;
            case 'bomb':
                ctx.fillStyle = COLORS.bomb;
                ctx.beginPath();
                ctx.arc(x, y + bob + 2, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#c0392b';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, y + bob - 8);
                ctx.lineTo(x + 3, y + bob - 14);
                ctx.stroke();
                break;
            case 'key':
                ctx.fillStyle = COLORS.key;
                ctx.beginPath();
                ctx.arc(x, y + bob - 5, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(x - 2, y + bob, 4, 12);
                ctx.fillRect(x - 5, y + bob + 8, 4, 4);
                break;
            case 'item':
                ctx.fillStyle = '#9b59b6';
                ctx.beginPath();
                ctx.arc(x, y + bob, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('?', x, y + bob + 6);
                break;
            case 'shopItem':
                ctx.fillStyle = '#3498db';
                ctx.beginPath();
                ctx.arc(x, y + bob, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText('$' + pickup.price, x, y + bob + 20);
                break;
            case 'trapdoor':
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath();
                ctx.ellipse(x, y, 24, 16, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#4a4a4a';
                ctx.lineWidth = 3;
                ctx.stroke();
                break;
        }
    }

    function drawHeart(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y + size / 4);
        ctx.bezierCurveTo(x, y - size / 2, x - size, y - size / 2, x - size, y + size / 4);
        ctx.bezierCurveTo(x - size, y + size, x, y + size * 1.2, x, y + size * 1.2);
        ctx.bezierCurveTo(x, y + size * 1.2, x + size, y + size, x + size, y + size / 4);
        ctx.bezierCurveTo(x + size, y - size / 2, x, y - size / 2, x, y + size / 4);
        ctx.fill();
    }

    function renderEffect(effect) {
        const progress = effect.lifetime / 0.3;

        switch (effect.type) {
            case 'hit':
                ctx.fillStyle = `rgba(255, 255, 255, ${progress})`;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 20 * (1 - progress), 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'death':
                ctx.fillStyle = `rgba(192, 57, 43, ${progress})`;
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const dist = 30 * (1 - progress);
                    ctx.beginPath();
                    ctx.arc(
                        effect.x + Math.cos(angle) * dist,
                        effect.y + Math.sin(angle) * dist,
                        5 * progress,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                }
                break;
            case 'tearSplash':
                ctx.fillStyle = `rgba(93, 173, 226, ${progress * 2})`;
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    const dist = 15 * (1 - progress);
                    ctx.beginPath();
                    ctx.arc(
                        effect.x + Math.cos(angle) * dist,
                        effect.y + Math.sin(angle) * dist,
                        3,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                }
                break;
            case 'pickup':
                ctx.fillStyle = `rgba(241, 196, 15, ${progress * 3})`;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 25 * (1 - progress), 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'poopDestroy':
                ctx.fillStyle = `rgba(139, 105, 20, ${progress * 2})`;
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2 + progress * 2;
                    const dist = 20 * (1 - progress);
                    ctx.beginPath();
                    ctx.arc(
                        effect.x + Math.cos(angle) * dist,
                        effect.y + Math.sin(angle) * dist,
                        4,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                }
                break;
        }
    }

    function renderUI() {
        // Hearts (top left)
        let heartX = 20;
        const heartY = 30;

        // Red hearts
        for (let i = 0; i < player.maxRedHearts; i++) {
            if (i < Math.floor(player.redHearts)) {
                ctx.fillStyle = COLORS.heart;
            } else if (i < player.redHearts) {
                ctx.fillStyle = COLORS.heart;
                ctx.globalAlpha = 0.5;
            } else {
                ctx.fillStyle = COLORS.heartEmpty;
            }
            drawHeart(ctx, heartX + i * 28, heartY, 10);
            ctx.globalAlpha = 1;
        }

        // Soul hearts
        for (let i = 0; i < player.soulHearts; i++) {
            ctx.fillStyle = COLORS.soulHeart;
            drawHeart(ctx, heartX + (player.maxRedHearts + i) * 28, heartY, 10);
        }

        // Resources (left side)
        ctx.fillStyle = COLORS.text;
        ctx.font = '16px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText(`Keys: ${player.keys}`, 20, 480);
        ctx.fillText(`Bombs: ${player.bombs}`, 20, 500);
        ctx.fillText(`Coins: ${player.coins}`, 20, 520);

        // Stats
        ctx.fillText(`DMG: ${player.damage.toFixed(1)}`, 20, 550);
        ctx.fillText(`SPD: ${(player.speed / PLAYER_SPEED).toFixed(1)}`, 20, 570);

        // Floor info (top center)
        ctx.textAlign = 'center';
        ctx.fillText(`Basement ${floorNumber}`, CANVAS_WIDTH / 2, 30);

        // Minimap (top right)
        renderMinimap();
    }

    function renderMinimap() {
        if (!currentFloor) return;

        const mapX = CANVAS_WIDTH - 120;
        const mapY = 20;
        const roomSize = 12;
        const gap = 2;

        // Background
        ctx.fillStyle = 'rgba(44, 62, 80, 0.7)';
        ctx.fillRect(mapX - 10, mapY - 10, 110, 100);

        // Find bounds
        let minX = 9, maxX = 0, minY = 9, maxY = 0;
        for (const [key, room] of currentFloor.rooms) {
            if (room.discovered) {
                minX = Math.min(minX, room.gridX);
                maxX = Math.max(maxX, room.gridX);
                minY = Math.min(minY, room.gridY);
                maxY = Math.max(maxY, room.gridY);
            }
        }

        // Render discovered rooms
        for (const [key, room] of currentFloor.rooms) {
            if (!room.discovered) continue;

            const rx = mapX + (room.gridX - minX) * (roomSize + gap);
            const ry = mapY + (room.gridY - minY) * (roomSize + gap);

            // Room color
            let color = COLORS.minimapVisited;
            if (room === currentRoom) color = COLORS.minimapCurrent;
            else if (room.type === 'boss') color = COLORS.minimapBoss;
            else if (room.type === 'treasure') color = COLORS.minimapTreasure;
            else if (room.type === 'shop') color = COLORS.minimapShop;

            ctx.fillStyle = color;
            ctx.fillRect(rx, ry, roomSize, roomSize);

            // Room icon
            ctx.fillStyle = '#fff';
            ctx.font = '8px Courier New';
            ctx.textAlign = 'center';
            if (room.type === 'boss') ctx.fillText('B', rx + roomSize/2, ry + roomSize - 2);
            if (room.type === 'treasure') ctx.fillText('T', rx + roomSize/2, ry + roomSize - 2);
            if (room.type === 'shop') ctx.fillText('$', rx + roomSize/2, ry + roomSize - 2);
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
    function simulateKeyDown(key) {
        activeKeys.add(key);
        keysDown[key] = true;
    }

    function simulateKeyUp(key) {
        activeKeys.delete(key);
        keysDown[key] = false;
    }

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
                // Apply inputs
                if (action.keys) {
                    for (const key of action.keys) {
                        simulateKeyDown(key);
                    }
                }

                // Resume game
                gamePaused = false;

                // After duration, pause and release inputs
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
                floorNumber: floorNumber,
                player: player ? {
                    x: player.x,
                    y: player.y,
                    redHearts: player.redHearts,
                    maxRedHearts: player.maxRedHearts,
                    soulHearts: player.soulHearts,
                    damage: player.damage,
                    coins: player.coins,
                    bombs: player.bombs,
                    keys: player.keys,
                    iframes: player.iframes
                } : null,
                room: currentRoom ? {
                    gridX: currentRoom.gridX,
                    gridY: currentRoom.gridY,
                    type: currentRoom.type,
                    cleared: currentRoom.cleared,
                    enemyCount: currentRoom.enemies.length,
                    doors: currentRoom.doors
                } : null,
                enemies: currentRoom ? currentRoom.enemies.map(e => ({
                    x: e.x,
                    y: e.y,
                    type: e.type,
                    hp: e.hp,
                    maxHp: e.maxHp,
                    state: e.state
                })) : [],
                tears: tears.length,
                pickups: pickups.length + (currentRoom ? currentRoom.pickups.filter(p => !p.collected).length : 0)
            };
        },

        getPhase: () => {
            if (gameState === 'menu') return 'menu';
            if (gameState === 'playing') return 'playing';
            if (gameState === 'gameover') return 'gameover';
            if (gameState === 'victory') return 'victory';
            return gameState;
        },

        debug: {
            setHealth: (hp) => { if (player) player.redHearts = hp; },
            setPosition: (x, y) => { if (player) { player.x = x; player.y = y; } },
            setGodMode: (enabled) => { if (player) player.iframes = enabled ? 9999 : 0; },
            getFloorInfo: () => {
                if (!currentFloor) return null;
                const rooms = [];
                for (const [key, room] of currentFloor.rooms) {
                    rooms.push({
                        key,
                        gridX: room.gridX,
                        gridY: room.gridY,
                        type: room.type,
                        doors: room.doors,
                        discovered: room.discovered
                    });
                }
                return { roomCount: currentFloor.rooms.size, rooms };
            },
            transitionRoom: (dir) => {
                transitionToRoom(dir);
            },
            skipToLevel: (level) => {
                floorNumber = level;
                currentFloor = new Floor(floorNumber);
                currentRoom = currentFloor.startRoom;
                const startPos = gridToWorld(6, 5);
                if (player) {
                    player.x = startPos.x;
                    player.y = startPos.y;
                }
            },
            spawnEnemy: (type, x, y) => {
                if (currentRoom) {
                    currentRoom.enemies.push(new Enemy(x, y, type));
                }
            },
            clearEnemies: () => {
                if (currentRoom) {
                    currentRoom.enemies = [];
                    onRoomCleared();
                }
            },
            giveItem: (itemId) => {
                if (player) {
                    if (itemId === 'damage') player.damage += 1;
                    if (itemId === 'health') player.maxRedHearts++;
                    if (itemId === 'speed') player.speed += 20;
                }
            },
            forceStart: () => {
                // Always restart from floor 1
                floorNumber = 1;
                startGame();
            },
            forceGameOver: () => {
                gameState = 'gameover';
            },
            log: (msg) => {
                console.log('[HARNESS]', msg);
            }
        },

        version: '1.0',

        gameInfo: {
            name: 'Binding of Isaac Clone',
            type: 'roguelike',
            controls: {
                movement: ['w', 'a', 's', 'd'],
                fire: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
                actions: { bomb: 'e', use: 'Space' }
            }
        }
    };

    // Initialize
    window.addEventListener('load', init);
})();
