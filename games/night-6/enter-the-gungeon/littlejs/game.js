// Enter the Gungeon Clone - LittleJS
'use strict';

// Game constants
const TILE_SIZE = 16;
const ROOM_WIDTH = 15;
const ROOM_HEIGHT = 11;
const PLAYER_SPEED = 0.15;
const BULLET_SPEED = 0.4;
const ENEMY_BULLET_SPEED = 0.15;

// Game state
let gamePaused = true;
let gamePhase = 'menu'; // menu, playing, gameover, victory
let player = null;
let enemies = [];
let playerBullets = [];
let enemyBullets = [];
let pickups = [];
let rooms = [];
let currentRoom = null;
let currentRoomIndex = 0;
let currentFloor = 1;
let kills = 0;
let roomsCleared = 0;

// Player stats
const PLAYER_MAX_HP = 6;
const DODGE_ROLL_DURATION = 0.7;
const DODGE_ROLL_IFRAMES = 0.35;
const DODGE_ROLL_DISTANCE = 4;

// Input simulation
let simulatedKeys = new Set();
let simulatedMouse = { x: 400, y: 300, clicked: false };

// Weapons
const WEAPONS = {
    pistol: { name: 'Pistol', damage: 5, fireRate: 4, magSize: 12, maxAmmo: Infinity, spread: 0.05, projectiles: 1 },
    shotgun: { name: 'Shotgun', damage: 4, fireRate: 1.5, magSize: 6, maxAmmo: 60, spread: 0.3, projectiles: 5 },
    smg: { name: 'SMG', damage: 3, fireRate: 12, magSize: 30, maxAmmo: 150, spread: 0.15, projectiles: 1 },
    rifle: { name: 'Rifle', damage: 8, fireRate: 3, magSize: 8, maxAmmo: 40, spread: 0.02, projectiles: 1 }
};

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.hp = PLAYER_MAX_HP;
        this.maxHp = PLAYER_MAX_HP;
        this.angle = 0;
        this.weapon = { ...WEAPONS.pistol };
        this.ammo = this.weapon.magSize;
        this.totalAmmo = this.weapon.maxAmmo;
        this.blanks = 2;
        this.keys = 1;
        this.isRolling = false;
        this.isInvulnerable = false;
        this.rollTimer = 0;
        this.rollDir = { x: 0, y: 0 };
        this.fireTimer = 0;
        this.reloading = false;
        this.reloadTimer = 0;
        this.iframes = 0;
    }

    update(dt) {
        // Handle rolling
        if (this.isRolling) {
            this.rollTimer -= dt;
            if (this.rollTimer <= DODGE_ROLL_DURATION - DODGE_ROLL_IFRAMES) {
                this.isInvulnerable = false;
            }
            if (this.rollTimer <= 0) {
                this.isRolling = false;
                this.vx = 0;
                this.vy = 0;
            } else {
                const speed = DODGE_ROLL_DISTANCE / DODGE_ROLL_DURATION;
                this.vx = this.rollDir.x * speed;
                this.vy = this.rollDir.y * speed;
            }
        } else {
            // Normal movement
            this.vx = 0;
            this.vy = 0;
            if (isKeyHeld('w') || isKeyHeld('W') || isKeyHeld('ArrowUp')) this.vy = PLAYER_SPEED;
            if (isKeyHeld('s') || isKeyHeld('S') || isKeyHeld('ArrowDown')) this.vy = -PLAYER_SPEED;
            if (isKeyHeld('a') || isKeyHeld('A') || isKeyHeld('ArrowLeft')) this.vx = -PLAYER_SPEED;
            if (isKeyHeld('d') || isKeyHeld('D') || isKeyHeld('ArrowRight')) this.vx = PLAYER_SPEED;

            // Normalize diagonal
            if (this.vx !== 0 && this.vy !== 0) {
                this.vx *= 0.707;
                this.vy *= 0.707;
            }
        }

        // Apply velocity
        const newX = this.x + this.vx;
        const newY = this.y + this.vy;

        // Room bounds collision
        if (currentRoom) {
            const minX = currentRoom.x + 1;
            const maxX = currentRoom.x + ROOM_WIDTH - 1;
            const minY = currentRoom.y + 1;
            const maxY = currentRoom.y + ROOM_HEIGHT - 1;
            this.x = Math.max(minX, Math.min(maxX, newX));
            this.y = Math.max(minY, Math.min(maxY, newY));
        } else {
            this.x = newX;
            this.y = newY;
        }

        // Aim at mouse
        const worldMouse = screenToWorld(vec2(simulatedMouse.x, simulatedMouse.y));
        this.angle = Math.atan2(worldMouse.y - this.y, worldMouse.x - this.x);

        // I-frames countdown
        if (this.iframes > 0) {
            this.iframes -= dt;
            if (this.iframes <= 0) {
                this.isInvulnerable = false;
            }
        }

        // Reload timer
        if (this.reloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.reloading = false;
                const ammoNeeded = this.weapon.magSize - this.ammo;
                if (this.totalAmmo === Infinity) {
                    this.ammo = this.weapon.magSize;
                } else {
                    const ammoToAdd = Math.min(ammoNeeded, this.totalAmmo);
                    this.ammo += ammoToAdd;
                    this.totalAmmo -= ammoToAdd;
                }
            }
        }

        // Fire timer
        if (this.fireTimer > 0) {
            this.fireTimer -= dt;
        }

        // Dodge roll input
        if ((isKeyHeld('Shift') || isKeyHeld('shift')) && !this.isRolling) {
            this.startRoll();
        }

        // Shoot
        if ((simulatedMouse.clicked || isKeyHeld(' ') || isKeyHeld('Space')) && !this.isRolling && !this.reloading) {
            this.shoot();
        }

        // Reload
        if ((isKeyHeld('r') || isKeyHeld('R')) && !this.reloading && this.ammo < this.weapon.magSize) {
            this.startReload();
        }

        // Use blank
        if ((isKeyHeld('q') || isKeyHeld('Q')) && this.blanks > 0) {
            this.useBlank();
        }
    }

    startRoll() {
        // Roll in movement direction or facing direction
        let dx = 0, dy = 0;
        if (isKeyHeld('w') || isKeyHeld('W')) dy = 1;
        if (isKeyHeld('s') || isKeyHeld('S')) dy = -1;
        if (isKeyHeld('a') || isKeyHeld('A')) dx = -1;
        if (isKeyHeld('d') || isKeyHeld('D')) dx = 1;

        if (dx === 0 && dy === 0) {
            dx = Math.cos(this.angle);
            dy = Math.sin(this.angle);
        }

        const len = Math.sqrt(dx * dx + dy * dy);
        this.rollDir = { x: dx / len, y: dy / len };
        this.isRolling = true;
        this.isInvulnerable = true;
        this.rollTimer = DODGE_ROLL_DURATION;
    }

    shoot() {
        if (this.fireTimer > 0 || this.ammo <= 0) return;

        this.fireTimer = 1 / this.weapon.fireRate;

        for (let i = 0; i < this.weapon.projectiles; i++) {
            const spread = (Math.random() - 0.5) * this.weapon.spread * 2;
            const angle = this.angle + spread;
            playerBullets.push({
                x: this.x + Math.cos(this.angle) * 0.5,
                y: this.y + Math.sin(this.angle) * 0.5,
                vx: Math.cos(angle) * BULLET_SPEED,
                vy: Math.sin(angle) * BULLET_SPEED,
                damage: this.weapon.damage,
                life: 3
            });
        }

        this.ammo--;

        if (this.ammo <= 0 && this.totalAmmo > 0) {
            this.startReload();
        }
    }

    startReload() {
        this.reloading = true;
        this.reloadTimer = 1.0;
    }

    useBlank() {
        this.blanks--;
        enemyBullets = [];
        this.isInvulnerable = true;
        this.iframes = 1.0;

        // Stun nearby enemies
        for (const enemy of enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 5) {
                enemy.stunned = 0.5;
            }
        }
    }

    takeDamage(amount) {
        if (this.isInvulnerable) return;

        this.hp -= amount;
        this.isInvulnerable = true;
        this.iframes = 1.5;

        if (this.hp <= 0) {
            gamePhase = 'gameover';
        }
    }
}

// Enemy base class
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.hp = 10;
        this.maxHp = 10;
        this.speed = 0.05;
        this.fireRate = 1;
        this.fireTimer = Math.random() * 2;
        this.stunned = 0;
        this.pattern = 'aimed';

        switch (type) {
            case 'bullet_kin':
                this.hp = this.maxHp = 10;
                this.speed = 0.04;
                this.fireRate = 0.8;
                break;
            case 'shotgun_kin':
                this.hp = this.maxHp = 15;
                this.speed = 0.03;
                this.fireRate = 0.5;
                this.pattern = 'spread';
                break;
            case 'gunjurer':
                this.hp = this.maxHp = 20;
                this.speed = 0.02;
                this.fireRate = 0.3;
                this.pattern = 'ring';
                break;
            case 'boss':
                this.hp = this.maxHp = 100;
                this.speed = 0.03;
                this.fireRate = 0.15;
                this.pattern = 'boss';
                break;
        }
    }

    update(dt) {
        if (this.stunned > 0) {
            this.stunned -= dt;
            return;
        }

        if (!player) return;

        // Move toward player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 3 && this.type !== 'boss') {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }

        // Room bounds
        if (currentRoom) {
            this.x = Math.max(currentRoom.x + 1, Math.min(currentRoom.x + ROOM_WIDTH - 1, this.x));
            this.y = Math.max(currentRoom.y + 1, Math.min(currentRoom.y + ROOM_HEIGHT - 1, this.y));
        }

        // Fire
        this.fireTimer -= dt;
        if (this.fireTimer <= 0) {
            this.fireTimer = 1 / this.fireRate;
            this.fire();
        }
    }

    fire() {
        if (!player) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const angle = Math.atan2(dy, dx);

        switch (this.pattern) {
            case 'aimed':
                this.shootBullet(angle);
                break;
            case 'spread':
                for (let i = -2; i <= 2; i++) {
                    this.shootBullet(angle + i * 0.2);
                }
                break;
            case 'ring':
                for (let i = 0; i < 8; i++) {
                    this.shootBullet(i * Math.PI / 4);
                }
                break;
            case 'boss':
                // Complex boss pattern
                const phase = Math.floor(Math.random() * 3);
                if (phase === 0) {
                    // Aimed burst
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => this.shootBullet(angle + (Math.random() - 0.5) * 0.3), i * 100);
                    }
                } else if (phase === 1) {
                    // Spiral
                    for (let i = 0; i < 12; i++) {
                        this.shootBullet(angle + i * Math.PI / 6);
                    }
                } else {
                    // Spread
                    for (let i = -4; i <= 4; i++) {
                        this.shootBullet(angle + i * 0.15);
                    }
                }
                break;
        }
    }

    shootBullet(angle) {
        enemyBullets.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * ENEMY_BULLET_SPEED,
            vy: Math.sin(angle) * ENEMY_BULLET_SPEED,
            damage: 1,
            life: 5
        });
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        const index = enemies.indexOf(this);
        if (index > -1) {
            enemies.splice(index, 1);
            kills++;

            // Drop pickup
            if (Math.random() < 0.3) {
                const type = Math.random() < 0.5 ? 'ammo' : (Math.random() < 0.3 ? 'health' : 'ammo');
                pickups.push({ x: this.x, y: this.y, type: type });
            }
        }
    }
}

// Room generation
function generateRoom(index, type) {
    const room = {
        x: index * (ROOM_WIDTH + 2),
        y: 0,
        width: ROOM_WIDTH,
        height: ROOM_HEIGHT,
        type: type,
        cleared: false,
        enemies: [],
        doors: []
    };

    // Add enemies based on room type
    if (type === 'combat') {
        const enemyCount = 3 + Math.floor(Math.random() * 3) + currentFloor;
        const types = ['bullet_kin', 'shotgun_kin', 'gunjurer'];
        for (let i = 0; i < enemyCount; i++) {
            const ex = room.x + 2 + Math.random() * (ROOM_WIDTH - 4);
            const ey = room.y + 2 + Math.random() * (ROOM_HEIGHT - 4);
            const type = types[Math.floor(Math.random() * Math.min(types.length, currentFloor + 1))];
            room.enemies.push({ x: ex, y: ey, type: type });
        }
    } else if (type === 'boss') {
        room.enemies.push({
            x: room.x + ROOM_WIDTH / 2,
            y: room.y + ROOM_HEIGHT / 2,
            type: 'boss'
        });
    }

    return room;
}

function generateFloor() {
    rooms = [];
    const roomCount = 4 + currentFloor;

    // Start room
    rooms.push(generateRoom(0, 'start'));

    // Combat rooms
    for (let i = 1; i < roomCount - 1; i++) {
        rooms.push(generateRoom(i, 'combat'));
    }

    // Boss room
    rooms.push(generateRoom(roomCount - 1, 'boss'));

    currentRoomIndex = 0;
    currentRoom = rooms[0];
}

function enterRoom(roomIndex) {
    if (roomIndex < 0 || roomIndex >= rooms.length) return;

    currentRoomIndex = roomIndex;
    currentRoom = rooms[roomIndex];

    // Clear bullets
    playerBullets = [];
    enemyBullets = [];
    pickups = [];
    enemies = [];

    // Spawn enemies
    for (const e of currentRoom.enemies) {
        enemies.push(new Enemy(e.x, e.y, e.type));
    }

    // Position player
    if (player) {
        player.x = currentRoom.x + 2;
        player.y = currentRoom.y + ROOM_HEIGHT / 2;
    }

    // Refill blanks on new floor
    if (roomIndex === 0 && player) {
        player.blanks = Math.max(player.blanks, 2);
    }
}

// Input handling
function isKeyHeld(key) {
    if (simulatedKeys.has(key)) return true;
    if (simulatedKeys.has(key.toLowerCase())) return true;
    if (key === 'Space' && simulatedKeys.has(' ')) return true;
    if (key === ' ' && simulatedKeys.has('Space')) return true;
    return keyIsDown(key);
}

// LittleJS callbacks
function gameInit() {
    // Set up canvas
    canvasFixedSize = vec2(800, 600);
    cameraScale = 32;
}

function gameUpdate() {
    // Handle menu/gameover input even when paused
    if (gamePhase === 'menu' || gamePhase === 'gameover') {
        if (keyWasPressed('Space') || keyWasPressed(' ')) {
            startGame();
            gamePaused = false;
            return;
        }
    }

    if (gamePaused) return;

    const dt = 1/60;

    if (gamePhase === 'playing') {
        // Update player
        if (player) {
            player.update(dt);
        }

        // Update enemies
        for (const enemy of enemies) {
            enemy.update(dt);
        }

        // Update player bullets
        for (let i = playerBullets.length - 1; i >= 0; i--) {
            const b = playerBullets[i];
            b.x += b.vx;
            b.y += b.vy;
            b.life -= dt;

            // Check enemy collision
            for (const enemy of enemies) {
                const dx = b.x - enemy.x;
                const dy = b.y - enemy.y;
                if (dx * dx + dy * dy < 0.5) {
                    enemy.takeDamage(b.damage);
                    playerBullets.splice(i, 1);
                    break;
                }
            }

            // Room bounds
            if (currentRoom && b.life > 0) {
                if (b.x < currentRoom.x || b.x > currentRoom.x + ROOM_WIDTH ||
                    b.y < currentRoom.y || b.y > currentRoom.y + ROOM_HEIGHT) {
                    playerBullets.splice(i, 1);
                }
            }

            if (b.life <= 0) {
                playerBullets.splice(i, 1);
            }
        }

        // Update enemy bullets
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];
            b.x += b.vx;
            b.y += b.vy;
            b.life -= dt;

            // Check player collision
            if (player && !player.isInvulnerable) {
                const dx = b.x - player.x;
                const dy = b.y - player.y;
                if (dx * dx + dy * dy < 0.3) {
                    player.takeDamage(b.damage);
                    enemyBullets.splice(i, 1);
                    continue;
                }
            }

            // Room bounds
            if (currentRoom) {
                if (b.x < currentRoom.x || b.x > currentRoom.x + ROOM_WIDTH ||
                    b.y < currentRoom.y || b.y > currentRoom.y + ROOM_HEIGHT) {
                    enemyBullets.splice(i, 1);
                    continue;
                }
            }

            if (b.life <= 0) {
                enemyBullets.splice(i, 1);
            }
        }

        // Pickup collection
        if (player) {
            for (let i = pickups.length - 1; i >= 0; i--) {
                const p = pickups[i];
                const dx = p.x - player.x;
                const dy = p.y - player.y;
                if (dx * dx + dy * dy < 0.5) {
                    if (p.type === 'ammo') {
                        if (player.totalAmmo !== Infinity) {
                            player.totalAmmo += Math.floor(player.weapon.maxAmmo * 0.2);
                        }
                    } else if (p.type === 'health') {
                        player.hp = Math.min(player.hp + 2, player.maxHp);
                    } else if (p.type === 'weapon') {
                        const weapons = Object.values(WEAPONS);
                        player.weapon = { ...weapons[Math.floor(Math.random() * weapons.length)] };
                        player.ammo = player.weapon.magSize;
                        player.totalAmmo = player.weapon.maxAmmo;
                    }
                    pickups.splice(i, 1);
                }
            }
        }

        // Check room cleared
        if (currentRoom && !currentRoom.cleared && enemies.length === 0) {
            currentRoom.cleared = true;
            roomsCleared++;

            // Drop weapon in boss room
            if (currentRoom.type === 'boss') {
                pickups.push({ x: currentRoom.x + ROOM_WIDTH / 2, y: currentRoom.y + ROOM_HEIGHT / 2, type: 'weapon' });
            }
        }

        // Door interaction - move to next room
        if (player && currentRoom && currentRoom.cleared) {
            if (player.x > currentRoom.x + ROOM_WIDTH - 1.5 && (isKeyHeld('e') || isKeyHeld('E'))) {
                if (currentRoomIndex < rooms.length - 1) {
                    enterRoom(currentRoomIndex + 1);
                } else if (currentRoom.type === 'boss') {
                    // Next floor
                    currentFloor++;
                    generateFloor();
                    enterRoom(0);
                }
            }
        }
    }
}

function gameUpdatePost() {}

function gameRender() {
    // Clear background
    drawRect(cameraPos, vec2(100, 100), new Color(0.1, 0.1, 0.15));

    if (gamePhase === 'menu') {
        drawText('ENTER THE GUNGEON', cameraPos.add(vec2(0, 3)), 1, new Color(1, 0.8, 0));
        drawText('WASD to move, Mouse to aim', cameraPos.add(vec2(0, 1)), 0.5, new Color(1, 1, 1));
        drawText('Shift to dodge roll', cameraPos.add(vec2(0, 0)), 0.5, new Color(1, 1, 1));
        drawText('Click/Space to shoot, R to reload', cameraPos.add(vec2(0, -1)), 0.5, new Color(1, 1, 1));
        drawText('Q to use blank', cameraPos.add(vec2(0, -2)), 0.5, new Color(1, 1, 1));
        drawText('Press Space to Start', cameraPos.add(vec2(0, -4)), 0.6, new Color(0, 1, 0));
    } else if (gamePhase === 'playing') {
        // Draw room
        if (currentRoom) {
            // Floor
            drawRect(vec2(currentRoom.x + ROOM_WIDTH/2, currentRoom.y + ROOM_HEIGHT/2),
                    vec2(ROOM_WIDTH, ROOM_HEIGHT), new Color(0.2, 0.2, 0.25));

            // Walls
            const wallColor = new Color(0.4, 0.35, 0.3);
            drawRect(vec2(currentRoom.x + ROOM_WIDTH/2, currentRoom.y), vec2(ROOM_WIDTH, 0.5), wallColor);
            drawRect(vec2(currentRoom.x + ROOM_WIDTH/2, currentRoom.y + ROOM_HEIGHT), vec2(ROOM_WIDTH, 0.5), wallColor);
            drawRect(vec2(currentRoom.x, currentRoom.y + ROOM_HEIGHT/2), vec2(0.5, ROOM_HEIGHT), wallColor);
            drawRect(vec2(currentRoom.x + ROOM_WIDTH, currentRoom.y + ROOM_HEIGHT/2), vec2(0.5, ROOM_HEIGHT), wallColor);

            // Door indicator
            if (currentRoom.cleared && currentRoomIndex < rooms.length - 1) {
                drawRect(vec2(currentRoom.x + ROOM_WIDTH, currentRoom.y + ROOM_HEIGHT/2), vec2(0.5, 2), new Color(0, 1, 0));
            }
        }

        // Draw pickups
        for (const p of pickups) {
            const color = p.type === 'ammo' ? new Color(1, 0.8, 0) :
                         p.type === 'health' ? new Color(1, 0.2, 0.2) :
                         new Color(0.8, 0.2, 1);
            drawRect(vec2(p.x, p.y), vec2(0.4, 0.4), color);
        }

        // Draw player
        if (player) {
            const playerColor = player.isInvulnerable ?
                new Color(1, 1, 1, 0.5) : new Color(0.2, 0.6, 1);

            if (player.isRolling) {
                drawRect(vec2(player.x, player.y), vec2(0.6, 0.3), playerColor);
            } else {
                drawRect(vec2(player.x, player.y), vec2(0.8, 0.8), playerColor);
            }

            // Gun direction
            const gunLen = 0.6;
            const gunEnd = vec2(player.x + Math.cos(player.angle) * gunLen,
                               player.y + Math.sin(player.angle) * gunLen);
            drawLine(vec2(player.x, player.y), gunEnd, 0.1, new Color(0.5, 0.5, 0.5));
        }

        // Draw enemies
        for (const enemy of enemies) {
            let color, size;
            switch (enemy.type) {
                case 'bullet_kin':
                    color = new Color(1, 0.6, 0.2);
                    size = 0.7;
                    break;
                case 'shotgun_kin':
                    color = new Color(0.8, 0.3, 0.3);
                    size = 0.9;
                    break;
                case 'gunjurer':
                    color = new Color(0.6, 0.2, 0.8);
                    size = 0.8;
                    break;
                case 'boss':
                    color = new Color(1, 0.2, 0.2);
                    size = 1.5;
                    break;
                default:
                    color = new Color(1, 0.5, 0);
                    size = 0.7;
            }

            if (enemy.stunned > 0) {
                color = new Color(0.5, 0.5, 0.5);
            }

            drawRect(vec2(enemy.x, enemy.y), vec2(size, size), color);

            // HP bar for boss
            if (enemy.type === 'boss') {
                const barWidth = 10;
                const hpRatio = enemy.hp / enemy.maxHp;
                drawRect(vec2(currentRoom.x + ROOM_WIDTH/2, currentRoom.y + ROOM_HEIGHT - 0.5),
                        vec2(barWidth, 0.3), new Color(0.3, 0.3, 0.3));
                drawRect(vec2(currentRoom.x + ROOM_WIDTH/2 - (1-hpRatio)*barWidth/2, currentRoom.y + ROOM_HEIGHT - 0.5),
                        vec2(barWidth * hpRatio, 0.3), new Color(1, 0, 0));
            }
        }

        // Draw player bullets
        for (const b of playerBullets) {
            drawRect(vec2(b.x, b.y), vec2(0.2, 0.2), new Color(1, 1, 0.5));
        }

        // Draw enemy bullets
        for (const b of enemyBullets) {
            drawRect(vec2(b.x, b.y), vec2(0.25, 0.25), new Color(1, 0.3, 0.3));
        }

        // UI
        if (player) {
            const uiY = cameraPos.y + 8;
            const uiX = cameraPos.x - 10;

            // HP hearts
            for (let i = 0; i < player.maxHp / 2; i++) {
                const heartColor = i * 2 < player.hp ? new Color(1, 0.2, 0.2) :
                                  i * 2 + 1 === player.hp ? new Color(1, 0.5, 0.5) :
                                  new Color(0.3, 0.3, 0.3);
                drawRect(vec2(uiX + i * 0.8, uiY), vec2(0.6, 0.6), heartColor);
            }

            // Blanks
            drawText(`B:${player.blanks}`, vec2(uiX + 6, uiY), 0.4, new Color(0.5, 0.8, 1));

            // Keys
            drawText(`K:${player.keys}`, vec2(uiX + 8, uiY), 0.4, new Color(1, 0.8, 0));

            // Ammo
            const ammoText = player.reloading ? 'RELOAD' : `${player.ammo}/${player.totalAmmo === Infinity ? '∞' : player.totalAmmo}`;
            drawText(ammoText, vec2(uiX + 12, uiY), 0.4, new Color(1, 1, 1));

            // Floor/Room
            drawText(`F${currentFloor} R${currentRoomIndex + 1}/${rooms.length}`, vec2(uiX + 18, uiY), 0.4, new Color(0.7, 0.7, 0.7));
        }
    } else if (gamePhase === 'gameover') {
        drawText('GAME OVER', cameraPos.add(vec2(0, 2)), 1.2, new Color(1, 0, 0));
        drawText(`Floor: ${currentFloor}  Kills: ${kills}`, cameraPos.add(vec2(0, 0)), 0.6, new Color(1, 1, 1));
        drawText(`Rooms Cleared: ${roomsCleared}`, cameraPos.add(vec2(0, -1)), 0.5, new Color(0.7, 0.7, 0.7));
        drawText('Press Space to Restart', cameraPos.add(vec2(0, -3)), 0.5, new Color(0, 1, 0));
    }
}

function gameRenderPost() {}

// Start game
function startGame() {
    gamePhase = 'playing';
    currentFloor = 1;
    kills = 0;
    roomsCleared = 0;

    generateFloor();

    player = new Player(rooms[0].x + 2, rooms[0].y + ROOM_HEIGHT / 2);
    enterRoom(0);

    // Center camera on room
    cameraPos = vec2(currentRoom.x + ROOM_WIDTH / 2, currentRoom.y + ROOM_HEIGHT / 2);
}

// Harness interface
window.harness = {
    pause: () => { gamePaused = true; },
    resume: () => { gamePaused = false; },
    isPaused: () => gamePaused,

    execute: (action, durationMs) => {
        return new Promise((resolve) => {
            if (action.keys) {
                for (const key of action.keys) {
                    simulatedKeys.add(key);
                    simulatedKeys.add(key.toLowerCase());
                }
            }
            if (action.mouse) {
                simulatedMouse.x = action.mouse.x || simulatedMouse.x;
                simulatedMouse.y = action.mouse.y || simulatedMouse.y;
                simulatedMouse.clicked = action.mouse.click || false;
            }

            gamePaused = false;

            setTimeout(() => {
                simulatedKeys.clear();
                simulatedMouse.clicked = false;
                gamePaused = true;
                resolve();
            }, durationMs);
        });
    },

    getState: () => ({
        gamePhase: gamePhase,
        floor: currentFloor,
        kills: kills,
        roomsCleared: roomsCleared,
        currentRoom: currentRoomIndex,
        totalRooms: rooms.length,
        roomCleared: currentRoom ? currentRoom.cleared : false,
        player: player ? {
            x: player.x,
            y: player.y,
            hp: player.hp,
            maxHp: player.maxHp,
            ammo: player.ammo,
            totalAmmo: player.totalAmmo,
            blanks: player.blanks,
            keys: player.keys,
            weapon: player.weapon.name,
            isRolling: player.isRolling,
            isInvulnerable: player.isInvulnerable,
            reloading: player.reloading
        } : null,
        enemies: enemies.map(e => ({
            x: e.x,
            y: e.y,
            type: e.type,
            hp: e.hp,
            maxHp: e.maxHp
        })),
        enemyBullets: enemyBullets.length,
        pickups: pickups.map(p => ({ x: p.x, y: p.y, type: p.type }))
    }),

    getPhase: () => gamePhase,

    debug: {
        setHealth: (hp) => { if (player) player.hp = hp; },
        forceStart: () => {
            if (gamePhase !== 'playing') {
                startGame();
            }
            gamePaused = false;
        },
        clearEnemies: () => { enemies = []; },
        addBlanks: (n) => { if (player) player.blanks += n; },
        giveWeapon: (name) => {
            if (player && WEAPONS[name]) {
                player.weapon = { ...WEAPONS[name] };
                player.ammo = player.weapon.magSize;
                player.totalAmmo = player.weapon.maxAmmo;
            }
        },
        nextRoom: () => {
            if (currentRoom) {
                currentRoom.cleared = true;
                if (currentRoomIndex < rooms.length - 1) {
                    enterRoom(currentRoomIndex + 1);
                }
            }
        },
        nextFloor: () => {
            currentFloor++;
            generateFloor();
            enterRoom(0);
        }
    }
};

// Initialize LittleJS
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
