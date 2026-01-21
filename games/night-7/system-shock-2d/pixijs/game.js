// System Shock 2D: Whispers of M.A.R.I.A. - PixiJS Implementation
// 2D Top-Down Immersive Sim / Survival Horror

const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x0a0a12,
    antialias: true
});
document.body.appendChild(app.view);

// Game constants
const TILE_SIZE = 32;
const PLAYER_SPEED = 150;
const SPRINT_SPEED = 250;
const VIEW_CONE_ANGLE = Math.PI / 2; // 90 degree cone
const VIEW_DISTANCE = 250;

// Game state
const gameState = {
    state: 'menu',
    currentDeck: 1,
    player: null,
    enemies: [],
    bullets: [],
    doors: [],
    turrets: [],
    items: [],
    audioLogs: [],
    collectedLogs: new Set(),
    keys: {
        w: false, a: false, s: false, d: false,
        shift: false, e: false, r: false, f: false, tab: false, space: false
    },
    mouse: { x: 0, y: 0, down: false },
    camera: { x: 0, y: 0 },
    gameTime: 0,
    mariaDialogue: null,
    dialogueTimer: 0,
    hackingTarget: null,
    hackingProgress: 0,
    paused: false,
    flashlight: true,
    won: false
};

// Containers
const worldContainer = new PIXI.Container();
const floorContainer = new PIXI.Container();
const entityContainer = new PIXI.Container();
const visionMask = new PIXI.Graphics();
const darknessOverlay = new PIXI.Graphics();
const uiContainer = new PIXI.Container();

worldContainer.addChild(floorContainer);
worldContainer.addChild(entityContainer);
app.stage.addChild(worldContainer);
app.stage.addChild(darknessOverlay);
app.stage.addChild(uiContainer);

// Deck layouts - procedurally generated rooms
function generateDeck(deckNum) {
    const deck = {
        rooms: [],
        corridors: [],
        width: 50,
        height: 40,
        walls: new Set(),
        spawn: { x: 3, y: 20 },
        exit: null,
        enemies: [],
        doors: [],
        turrets: [],
        items: [],
        audioLogs: []
    };

    // Room definitions per deck
    const roomDefs = deckNum === 1 ? [
        { name: 'Med Bay', x: 2, y: 18, w: 6, h: 5, type: 'start' },
        { name: 'Main Corridor', x: 8, y: 17, w: 15, h: 6, type: 'corridor' },
        { name: 'Generator Room', x: 24, y: 15, w: 8, h: 8, type: 'power' },
        { name: 'Security Office', x: 8, y: 10, w: 5, h: 6, type: 'security' },
        { name: 'Storage Bay', x: 15, y: 8, w: 7, h: 7, type: 'storage' },
        { name: 'Crew Quarters', x: 24, y: 8, w: 9, h: 6, type: 'quarters' },
        { name: 'Elevator', x: 35, y: 15, w: 4, h: 4, type: 'elevator' }
    ] : [
        { name: 'Elevator', x: 2, y: 18, w: 4, h: 4, type: 'elevator_entry' },
        { name: 'Operations Corridor', x: 6, y: 17, w: 12, h: 5, type: 'corridor' },
        { name: 'Mess Hall', x: 19, y: 14, w: 10, h: 8, type: 'mess' },
        { name: 'Medical Wing', x: 6, y: 10, w: 7, h: 6, type: 'medical' },
        { name: 'Communications', x: 15, y: 8, w: 6, h: 6, type: 'comms' },
        { name: 'Escape Pod Bay', x: 30, y: 10, w: 8, h: 8, type: 'escape' }
    ];

    // Build walls (fill everything first)
    for (let y = 0; y < deck.height; y++) {
        for (let x = 0; x < deck.width; x++) {
            deck.walls.add(`${x},${y}`);
        }
    }

    // Carve out rooms
    roomDefs.forEach(room => {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                deck.walls.delete(`${x},${y}`);
            }
        }
        deck.rooms.push(room);

        // Set spawn and exit
        if (room.type === 'start' || room.type === 'elevator_entry') {
            deck.spawn = { x: room.x + 2, y: room.y + 2 };
        }
        if (room.type === 'elevator') {
            deck.exit = { x: room.x + 2, y: room.y + 2, type: 'next_deck' };
        }
        if (room.type === 'escape') {
            deck.exit = { x: room.x + 4, y: room.y + 4, type: 'win' };
        }
    });

    // Connect rooms with corridors
    for (let i = 0; i < roomDefs.length - 1; i++) {
        const r1 = roomDefs[i];
        const r2 = roomDefs[i + 1];
        const x1 = Math.floor(r1.x + r1.w / 2);
        const y1 = Math.floor(r1.y + r1.h / 2);
        const x2 = Math.floor(r2.x + r2.w / 2);
        const y2 = Math.floor(r2.y + r2.h / 2);

        // L-shaped corridor
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            for (let dy = -1; dy <= 1; dy++) {
                deck.walls.delete(`${x},${y1 + dy}`);
            }
        }
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            for (let dx = -1; dx <= 1; dx++) {
                deck.walls.delete(`${x2 + dx},${y}`);
            }
        }
    }

    // Add enemies
    if (deckNum === 1) {
        deck.enemies = [
            { type: 'drone', x: 15, y: 19 },
            { type: 'drone', x: 26, y: 18 },
            { type: 'drone', x: 10, y: 12 },
            { type: 'soldier', x: 27, y: 10 },
            { type: 'drone', x: 20, y: 11 },
            { type: 'soldier', x: 36, y: 17 }
        ];
    } else {
        deck.enemies = [
            { type: 'drone', x: 12, y: 19 },
            { type: 'crawler', x: 22, y: 16 },
            { type: 'crawler', x: 24, y: 18 },
            { type: 'soldier', x: 8, y: 12 },
            { type: 'crawler', x: 17, y: 10 },
            { type: 'soldier', x: 32, y: 14 },
            { type: 'drone', x: 34, y: 12 }
        ];
    }

    // Add doors (hackable)
    if (deckNum === 1) {
        deck.doors = [
            { x: 13, y: 12, locked: true, hacked: false },
            { x: 23, y: 18, locked: false, hacked: false },
            { x: 34, y: 17, locked: true, hacked: false }
        ];
    } else {
        deck.doors = [
            { x: 13, y: 12, locked: true, hacked: false },
            { x: 29, y: 14, locked: true, hacked: false }
        ];
    }

    // Add turrets (hackable)
    if (deckNum === 1) {
        deck.turrets = [
            { x: 28, y: 16, hostile: true, hp: 50 }
        ];
    } else {
        deck.turrets = [
            { x: 25, y: 15, hostile: true, hp: 50 },
            { x: 33, y: 11, hostile: true, hp: 50 }
        ];
    }

    // Add items
    deck.items = [
        { x: deck.spawn.x + 1, y: deck.spawn.y, type: 'medpatch' },
        { x: Math.floor(deck.rooms[2].x + 2), y: Math.floor(deck.rooms[2].y + 2), type: 'ammo' },
        { x: Math.floor(deck.rooms[3].x + 2), y: Math.floor(deck.rooms[3].y + 2), type: 'medkit' }
    ];

    // Add audio logs
    deck.audioLogs = [
        { x: deck.spawn.x + 2, y: deck.spawn.y + 1, id: `log_${deckNum}_1`,
          text: deckNum === 1 ?
            "Day 1: M.A.R.I.A. online. She's running ship systems perfectly. Dr. Vance is proud." :
            "Day 15: Something's wrong with the crew. M.A.R.I.A. says they're 'improving.'"
        },
        { x: Math.floor(deck.rooms[4].x + 2), y: Math.floor(deck.rooms[4].y + 2), id: `log_${deckNum}_2`,
          text: deckNum === 1 ?
            "Day 7: Found Rodriguez in engineering. Half his face was metal. He said M.A.R.I.A. 'helped' him." :
            "Captain Morrison: The escape pods are our only hope. M.A.R.I.A. controls everything else."
        }
    ];

    return deck;
}

// Current deck data
let currentDeck = null;

// Player class
class Player {
    constructor(x, y) {
        this.x = x * TILE_SIZE + TILE_SIZE / 2;
        this.y = y * TILE_SIZE + TILE_SIZE / 2;
        this.hp = 100;
        this.maxHp = 100;
        this.energy = 100;
        this.maxEnergy = 100;
        this.ammo = 24;
        this.maxAmmo = 48;
        this.angle = 0;
        this.speed = PLAYER_SPEED;
        this.weapon = 'pistol';
        this.fireCooldown = 0;
        this.reloading = false;
        this.reloadTimer = 0;
        this.magazine = 12;
        this.maxMagazine = 12;
        this.dodgeCooldown = 0;
        this.dodging = false;
        this.dodgeTimer = 0;
        this.dodgeDir = { x: 0, y: 0 };
        this.invincible = false;
        this.inventory = [];

        this.sprite = new PIXI.Container();

        // Body
        this.body = new PIXI.Graphics();
        this.body.beginFill(0x556677);
        this.body.drawCircle(0, 0, 12);
        this.body.endFill();
        this.body.beginFill(0x44ff44);
        this.body.drawCircle(0, -4, 4); // Visor
        this.body.endFill();
        this.sprite.addChild(this.body);

        // Weapon
        this.weaponSprite = new PIXI.Graphics();
        this.weaponSprite.beginFill(0x333333);
        this.weaponSprite.drawRect(8, -3, 14, 6);
        this.weaponSprite.endFill();
        this.sprite.addChild(this.weaponSprite);

        entityContainer.addChild(this.sprite);
    }

    update(delta) {
        const dt = delta / 60;

        // Energy regen
        if (this.energy < this.maxEnergy) {
            this.energy = Math.min(this.maxEnergy, this.energy + 2 * dt);
        }

        // Cooldowns
        if (this.fireCooldown > 0) this.fireCooldown -= dt;
        if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;

        // Reload
        if (this.reloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                const needed = this.maxMagazine - this.magazine;
                const available = Math.min(needed, this.ammo);
                this.magazine += available;
                this.ammo -= available;
                this.reloading = false;
            }
        }

        // Dodge roll
        if (this.dodging) {
            this.dodgeTimer -= dt;
            this.x += this.dodgeDir.x * 250 * dt;
            this.y += this.dodgeDir.y * 250 * dt;
            if (this.dodgeTimer <= 0) {
                this.dodging = false;
                this.invincible = false;
            }
            // Collision during dodge
            this.resolveCollisions();
        } else {
            // Normal movement
            let dx = 0, dy = 0;
            if (gameState.keys.w) dy -= 1;
            if (gameState.keys.s) dy += 1;
            if (gameState.keys.a) dx -= 1;
            if (gameState.keys.d) dx += 1;

            if (dx !== 0 || dy !== 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                dx /= len;
                dy /= len;

                const speed = gameState.keys.shift && this.energy > 5 ? SPRINT_SPEED : PLAYER_SPEED;
                if (gameState.keys.shift && (dx !== 0 || dy !== 0)) {
                    this.energy = Math.max(0, this.energy - 5 * dt);
                }

                this.x += dx * speed * dt;
                this.y += dy * speed * dt;
                this.resolveCollisions();
            }
        }

        // Aim at mouse
        const worldMouseX = gameState.mouse.x + gameState.camera.x;
        const worldMouseY = gameState.mouse.y + gameState.camera.y;
        this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

        // Update sprite
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.rotation = this.angle;

        // Flashlight energy cost
        if (gameState.flashlight) {
            this.energy = Math.max(0, this.energy - 1 * dt);
            if (this.energy <= 0) gameState.flashlight = false;
        }
    }

    resolveCollisions() {
        const tx = Math.floor(this.x / TILE_SIZE);
        const ty = Math.floor(this.y / TILE_SIZE);

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const checkX = tx + dx;
                const checkY = ty + dy;
                if (currentDeck.walls.has(`${checkX},${checkY}`)) {
                    // Check door
                    const door = gameState.doors.find(d =>
                        Math.floor(d.x) === checkX && Math.floor(d.y) === checkY
                    );
                    if (door && (door.hacked || !door.locked)) continue;

                    // Push out of wall
                    const wallX = checkX * TILE_SIZE + TILE_SIZE / 2;
                    const wallY = checkY * TILE_SIZE + TILE_SIZE / 2;
                    const distX = this.x - wallX;
                    const distY = this.y - wallY;
                    const overlapX = TILE_SIZE / 2 + 12 - Math.abs(distX);
                    const overlapY = TILE_SIZE / 2 + 12 - Math.abs(distY);

                    if (overlapX > 0 && overlapY > 0) {
                        if (overlapX < overlapY) {
                            this.x += overlapX * Math.sign(distX);
                        } else {
                            this.y += overlapY * Math.sign(distY);
                        }
                    }
                }
            }
        }
    }

    shoot() {
        if (this.fireCooldown > 0 || this.reloading || this.magazine <= 0) return;

        this.fireCooldown = 0.3;
        this.magazine--;

        const bullet = {
            x: this.x + Math.cos(this.angle) * 20,
            y: this.y + Math.sin(this.angle) * 20,
            vx: Math.cos(this.angle) * 400,
            vy: Math.sin(this.angle) * 400,
            damage: 12,
            friendly: true,
            life: 2,
            sprite: new PIXI.Graphics()
        };
        bullet.sprite.beginFill(0xffff00);
        bullet.sprite.drawCircle(0, 0, 3);
        bullet.sprite.endFill();
        bullet.sprite.x = bullet.x;
        bullet.sprite.y = bullet.y;
        entityContainer.addChild(bullet.sprite);
        gameState.bullets.push(bullet);

        // Auto reload if empty
        if (this.magazine <= 0 && this.ammo > 0) {
            this.reload();
        }
    }

    reload() {
        if (this.reloading || this.magazine >= this.maxMagazine || this.ammo <= 0) return;
        this.reloading = true;
        this.reloadTimer = 1.5;
    }

    dodge() {
        if (this.dodgeCooldown > 0 || this.energy < 15 || this.dodging) return;

        let dx = 0, dy = 0;
        if (gameState.keys.w) dy -= 1;
        if (gameState.keys.s) dy += 1;
        if (gameState.keys.a) dx -= 1;
        if (gameState.keys.d) dx += 1;

        if (dx === 0 && dy === 0) {
            dx = Math.cos(this.angle);
            dy = Math.sin(this.angle);
        } else {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        this.dodging = true;
        this.dodgeTimer = 0.4;
        this.dodgeCooldown = 1.0;
        this.invincible = true;
        this.dodgeDir = { x: dx, y: dy };
        this.energy -= 15;
    }

    takeDamage(amount) {
        if (this.invincible) return;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            gameState.state = 'gameover';
        }
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }
}

// Enemy base class
class Enemy {
    constructor(x, y, type) {
        this.x = x * TILE_SIZE + TILE_SIZE / 2;
        this.y = y * TILE_SIZE + TILE_SIZE / 2;
        this.type = type;
        this.angle = Math.random() * Math.PI * 2;
        this.state = 'patrol';
        this.patrolAngle = this.angle;
        this.alertTimer = 0;
        this.attackCooldown = 0;
        this.dead = false;

        // Stats by type
        const stats = {
            drone: { hp: 30, speed: 80, damage: 10, color: 0x994444, size: 10 },
            soldier: { hp: 60, speed: 100, damage: 15, color: 0x666644, size: 14 },
            crawler: { hp: 20, speed: 120, damage: 8, color: 0x449944, size: 8 }
        };

        const s = stats[type] || stats.drone;
        this.hp = s.hp;
        this.maxHp = s.hp;
        this.speed = s.speed;
        this.damage = s.damage;
        this.size = s.size;

        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(s.color);
        this.sprite.drawCircle(0, 0, s.size);
        this.sprite.endFill();
        // Eyes
        this.sprite.beginFill(0xff0000);
        this.sprite.drawCircle(s.size * 0.5, -3, 2);
        this.sprite.drawCircle(s.size * 0.5, 3, 2);
        this.sprite.endFill();

        entityContainer.addChild(this.sprite);
    }

    update(delta, player) {
        if (this.dead) return;

        const dt = delta / 60;

        // Cooldowns
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.alertTimer > 0) this.alertTimer -= dt;

        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);

        // Check if can see player (simple LOS)
        const canSee = this.canSeePlayer(player);

        switch (this.state) {
            case 'patrol':
                // Wander
                this.x += Math.cos(this.patrolAngle) * this.speed * 0.3 * dt;
                this.y += Math.sin(this.patrolAngle) * this.speed * 0.3 * dt;
                this.angle = this.patrolAngle;

                // Randomly change direction
                if (Math.random() < 0.01) {
                    this.patrolAngle += (Math.random() - 0.5) * Math.PI;
                }

                // Wall collision - turn around
                this.resolveCollisions();

                // Detect player
                if (canSee && distToPlayer < 200) {
                    this.state = 'chase';
                }
                break;

            case 'alert':
                // Investigating
                this.angle = angleToPlayer;
                if (this.alertTimer <= 0) {
                    this.state = canSee ? 'chase' : 'patrol';
                }
                break;

            case 'chase':
                // Move toward player
                this.angle = angleToPlayer;
                this.x += Math.cos(this.angle) * this.speed * dt;
                this.y += Math.sin(this.angle) * this.speed * dt;
                this.resolveCollisions();

                // Attack if close
                if (distToPlayer < 30) {
                    this.state = 'attack';
                }

                // Lose sight
                if (!canSee && distToPlayer > 300) {
                    this.alertTimer = 3;
                    this.state = 'alert';
                }
                break;

            case 'attack':
                this.angle = angleToPlayer;
                if (distToPlayer < 30 && this.attackCooldown <= 0) {
                    // Melee attack
                    player.takeDamage(this.damage);
                    this.attackCooldown = 1.0;
                }

                // Soldier can shoot
                if (this.type === 'soldier' && distToPlayer > 50 && distToPlayer < 200 && this.attackCooldown <= 0) {
                    this.shootAt(player);
                    this.attackCooldown = 1.5;
                }

                if (distToPlayer > 50) {
                    this.state = 'chase';
                }
                break;
        }

        // Update sprite
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.rotation = this.angle;
    }

    canSeePlayer(player) {
        // Simple raycast
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        const steps = Math.ceil(dist / TILE_SIZE);

        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const checkX = Math.floor((this.x + (player.x - this.x) * t) / TILE_SIZE);
            const checkY = Math.floor((this.y + (player.y - this.y) * t) / TILE_SIZE);
            if (currentDeck.walls.has(`${checkX},${checkY}`)) {
                // Check if it's an open door
                const door = gameState.doors.find(d =>
                    Math.floor(d.x) === checkX && Math.floor(d.y) === checkY
                );
                if (!door || (door.locked && !door.hacked)) {
                    return false;
                }
            }
        }
        return true;
    }

    resolveCollisions() {
        const tx = Math.floor(this.x / TILE_SIZE);
        const ty = Math.floor(this.y / TILE_SIZE);

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const checkX = tx + dx;
                const checkY = ty + dy;
                if (currentDeck.walls.has(`${checkX},${checkY}`)) {
                    // Check door
                    const door = gameState.doors.find(d =>
                        Math.floor(d.x) === checkX && Math.floor(d.y) === checkY
                    );
                    if (door && (door.hacked || !door.locked)) continue;

                    const wallX = checkX * TILE_SIZE + TILE_SIZE / 2;
                    const wallY = checkY * TILE_SIZE + TILE_SIZE / 2;
                    const distX = this.x - wallX;
                    const distY = this.y - wallY;
                    const overlapX = TILE_SIZE / 2 + this.size - Math.abs(distX);
                    const overlapY = TILE_SIZE / 2 + this.size - Math.abs(distY);

                    if (overlapX > 0 && overlapY > 0) {
                        if (overlapX < overlapY) {
                            this.x += overlapX * Math.sign(distX);
                            this.patrolAngle = Math.PI - this.patrolAngle;
                        } else {
                            this.y += overlapY * Math.sign(distY);
                            this.patrolAngle = -this.patrolAngle;
                        }
                    }
                }
            }
        }
    }

    shootAt(player) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const bullet = {
            x: this.x + Math.cos(angle) * 20,
            y: this.y + Math.sin(angle) * 20,
            vx: Math.cos(angle) * 250,
            vy: Math.sin(angle) * 250,
            damage: 10,
            friendly: false,
            life: 3,
            sprite: new PIXI.Graphics()
        };
        bullet.sprite.beginFill(0xff4444);
        bullet.sprite.drawCircle(0, 0, 4);
        bullet.sprite.endFill();
        bullet.sprite.x = bullet.x;
        bullet.sprite.y = bullet.y;
        entityContainer.addChild(bullet.sprite);
        gameState.bullets.push(bullet);
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.state = 'chase';
        if (this.hp <= 0) {
            this.dead = true;
            entityContainer.removeChild(this.sprite);
        }
    }
}

// Turret class
class Turret {
    constructor(x, y, hostile) {
        this.x = x * TILE_SIZE + TILE_SIZE / 2;
        this.y = y * TILE_SIZE + TILE_SIZE / 2;
        this.hostile = hostile;
        this.hacked = false;
        this.hp = 50;
        this.angle = 0;
        this.fireCooldown = 0;
        this.dead = false;

        this.sprite = new PIXI.Graphics();
        this.redraw();
        entityContainer.addChild(this.sprite);
    }

    redraw() {
        this.sprite.clear();
        const color = this.hacked ? 0x4444ff : (this.hostile ? 0xff4444 : 0x44ff44);
        this.sprite.beginFill(0x444444);
        this.sprite.drawRect(-12, -12, 24, 24);
        this.sprite.endFill();
        this.sprite.beginFill(color);
        this.sprite.drawCircle(0, 0, 8);
        this.sprite.endFill();
        this.sprite.beginFill(0x222222);
        this.sprite.drawRect(8, -3, 12, 6);
        this.sprite.endFill();
    }

    update(delta, player, enemies) {
        if (this.dead) return;

        const dt = delta / 60;
        if (this.fireCooldown > 0) this.fireCooldown -= dt;

        // Determine target
        let target = null;
        let targetDist = Infinity;

        if (this.hacked) {
            // Target enemies
            enemies.forEach(e => {
                if (e.dead) return;
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < 200 && dist < targetDist) {
                    target = e;
                    targetDist = dist;
                }
            });
        } else if (this.hostile) {
            // Target player
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            if (dist < 200) {
                target = player;
                targetDist = dist;
            }
        }

        if (target) {
            this.angle = Math.atan2(target.y - this.y, target.x - this.x);

            if (this.fireCooldown <= 0) {
                this.shoot(target);
                this.fireCooldown = 0.5;
            }
        }

        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.rotation = this.angle;
    }

    shoot(target) {
        const angle = Math.atan2(target.y - this.y, target.x - this.x);
        const bullet = {
            x: this.x + Math.cos(angle) * 20,
            y: this.y + Math.sin(angle) * 20,
            vx: Math.cos(angle) * 350,
            vy: Math.sin(angle) * 350,
            damage: 20,
            friendly: this.hacked,
            life: 2,
            sprite: new PIXI.Graphics()
        };
        bullet.sprite.beginFill(this.hacked ? 0x44ff44 : 0xff4444);
        bullet.sprite.drawCircle(0, 0, 4);
        bullet.sprite.endFill();
        bullet.sprite.x = bullet.x;
        bullet.sprite.y = bullet.y;
        entityContainer.addChild(bullet.sprite);
        gameState.bullets.push(bullet);
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.dead = true;
            entityContainer.removeChild(this.sprite);
        }
    }

    hack() {
        this.hacked = true;
        this.hostile = false;
        this.redraw();
    }
}

// Door class
class Door {
    constructor(x, y, locked) {
        this.x = x;
        this.y = y;
        this.locked = locked;
        this.hacked = false;
        this.tileX = x;
        this.tileY = y;

        this.sprite = new PIXI.Graphics();
        this.redraw();
        this.sprite.x = x * TILE_SIZE + TILE_SIZE / 2;
        this.sprite.y = y * TILE_SIZE + TILE_SIZE / 2;
        entityContainer.addChild(this.sprite);
    }

    redraw() {
        this.sprite.clear();
        if (this.locked && !this.hacked) {
            this.sprite.beginFill(0x884422);
            this.sprite.drawRect(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
            this.sprite.endFill();
            this.sprite.beginFill(0xff0000);
            this.sprite.drawCircle(0, 0, 4);
            this.sprite.endFill();
        } else {
            this.sprite.beginFill(0x224422, 0.3);
            this.sprite.drawRect(-TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
            this.sprite.endFill();
        }
    }

    hack() {
        this.hacked = true;
        this.locked = false;
        this.redraw();
        // Remove from walls
        currentDeck.walls.delete(`${this.tileX},${this.tileY}`);
    }
}

// UI elements
const ui = {
    healthBar: null,
    energyBar: null,
    ammoText: null,
    deckText: null,
    interactPrompt: null,
    mariaText: null,
    hackingUI: null,
    logText: null
};

function createUI() {
    // Health bar
    ui.healthBar = new PIXI.Graphics();
    ui.healthBar.x = 10;
    ui.healthBar.y = 10;
    uiContainer.addChild(ui.healthBar);

    // Energy bar
    ui.energyBar = new PIXI.Graphics();
    ui.energyBar.x = 10;
    ui.energyBar.y = 35;
    uiContainer.addChild(ui.energyBar);

    // Ammo text
    ui.ammoText = new PIXI.Text('12/48', {
        fontFamily: 'monospace', fontSize: 16, fill: 0xffffff
    });
    ui.ammoText.x = 700;
    ui.ammoText.y = 570;
    uiContainer.addChild(ui.ammoText);

    // Deck text
    ui.deckText = new PIXI.Text('DECK 1: ENGINEERING', {
        fontFamily: 'monospace', fontSize: 14, fill: 0x44ff44
    });
    ui.deckText.x = 10;
    ui.deckText.y = 60;
    uiContainer.addChild(ui.deckText);

    // Interact prompt
    ui.interactPrompt = new PIXI.Text('', {
        fontFamily: 'monospace', fontSize: 14, fill: 0xffff44
    });
    ui.interactPrompt.x = 400;
    ui.interactPrompt.y = 550;
    ui.interactPrompt.anchor.set(0.5, 0);
    uiContainer.addChild(ui.interactPrompt);

    // M.A.R.I.A. dialogue
    ui.mariaText = new PIXI.Text('', {
        fontFamily: 'monospace', fontSize: 14, fill: 0xff4444, wordWrap: true, wordWrapWidth: 600
    });
    ui.mariaText.x = 400;
    ui.mariaText.y = 100;
    ui.mariaText.anchor.set(0.5, 0);
    uiContainer.addChild(ui.mariaText);

    // Audio log text
    ui.logText = new PIXI.Text('', {
        fontFamily: 'monospace', fontSize: 12, fill: 0x44ffff, wordWrap: true, wordWrapWidth: 500
    });
    ui.logText.x = 400;
    ui.logText.y = 480;
    ui.logText.anchor.set(0.5, 0);
    uiContainer.addChild(ui.logText);

    // Hacking UI
    ui.hackingUI = new PIXI.Container();
    ui.hackingUI.visible = false;
    const hackBg = new PIXI.Graphics();
    hackBg.beginFill(0x001100, 0.9);
    hackBg.drawRect(200, 150, 400, 300);
    hackBg.endFill();
    ui.hackingUI.addChild(hackBg);

    const hackTitle = new PIXI.Text('HACKING INTERFACE', {
        fontFamily: 'monospace', fontSize: 18, fill: 0x00ff00
    });
    hackTitle.x = 400;
    hackTitle.y = 165;
    hackTitle.anchor.set(0.5, 0);
    ui.hackingUI.addChild(hackTitle);

    ui.hackProgress = new PIXI.Graphics();
    ui.hackProgress.x = 250;
    ui.hackProgress.y = 350;
    ui.hackingUI.addChild(ui.hackProgress);

    const hackInstructions = new PIXI.Text('Hold E to hack... ESC to cancel', {
        fontFamily: 'monospace', fontSize: 12, fill: 0x00aa00
    });
    hackInstructions.x = 400;
    hackInstructions.y = 420;
    hackInstructions.anchor.set(0.5, 0);
    ui.hackingUI.addChild(hackInstructions);

    uiContainer.addChild(ui.hackingUI);
}

function updateUI() {
    if (!gameState.player) return;
    const p = gameState.player;

    // Health bar
    ui.healthBar.clear();
    ui.healthBar.beginFill(0x440000);
    ui.healthBar.drawRect(0, 0, 200, 20);
    ui.healthBar.endFill();
    ui.healthBar.beginFill(0xff0000);
    ui.healthBar.drawRect(2, 2, 196 * (p.hp / p.maxHp), 16);
    ui.healthBar.endFill();

    // Energy bar
    ui.energyBar.clear();
    ui.energyBar.beginFill(0x000044);
    ui.energyBar.drawRect(0, 0, 200, 15);
    ui.energyBar.endFill();
    ui.energyBar.beginFill(0x4444ff);
    ui.energyBar.drawRect(2, 2, 196 * (p.energy / p.maxEnergy), 11);
    ui.energyBar.endFill();

    // Ammo
    const reloadText = p.reloading ? ' (RELOADING)' : '';
    ui.ammoText.text = `${p.magazine}/${p.ammo}${reloadText}`;

    // Deck text
    const deckNames = { 1: 'ENGINEERING', 2: 'MEDICAL' };
    ui.deckText.text = `DECK ${gameState.currentDeck}: ${deckNames[gameState.currentDeck]}`;

    // Hacking progress
    if (gameState.hackingTarget) {
        ui.hackingUI.visible = true;
        ui.hackProgress.clear();
        ui.hackProgress.beginFill(0x003300);
        ui.hackProgress.drawRect(0, 0, 300, 30);
        ui.hackProgress.endFill();
        ui.hackProgress.beginFill(0x00ff00);
        ui.hackProgress.drawRect(2, 2, 296 * gameState.hackingProgress, 26);
        ui.hackProgress.endFill();
    } else {
        ui.hackingUI.visible = false;
    }
}

// Vision cone rendering (CORRECT: inside visible, outside hidden)
function renderVision() {
    if (!gameState.player || !gameState.flashlight) {
        darknessOverlay.clear();
        darknessOverlay.beginFill(0x000000, 0.7);
        darknessOverlay.drawRect(0, 0, 800, 600);
        darknessOverlay.endFill();
        return;
    }

    const p = gameState.player;
    const screenX = p.x - gameState.camera.x;
    const screenY = p.y - gameState.camera.y;

    // Create vision cone mask - things INSIDE are visible
    darknessOverlay.clear();

    // Start with full darkness
    darknessOverlay.beginFill(0x000000, 0.8);
    darknessOverlay.drawRect(0, 0, 800, 600);
    darknessOverlay.endFill();

    // Cut out the vision cone (punch a hole)
    darknessOverlay.beginHole();

    // Draw vision cone
    const coneStartAngle = p.angle - VIEW_CONE_ANGLE / 2;
    const coneEndAngle = p.angle + VIEW_CONE_ANGLE / 2;
    const segments = 32;

    darknessOverlay.moveTo(screenX, screenY);
    for (let i = 0; i <= segments; i++) {
        const angle = coneStartAngle + (coneEndAngle - coneStartAngle) * (i / segments);

        // Raycast to find wall distance
        let dist = VIEW_DISTANCE;
        for (let d = TILE_SIZE; d < VIEW_DISTANCE; d += TILE_SIZE / 2) {
            const checkX = Math.floor((p.x + Math.cos(angle) * d) / TILE_SIZE);
            const checkY = Math.floor((p.y + Math.sin(angle) * d) / TILE_SIZE);
            if (currentDeck.walls.has(`${checkX},${checkY}`)) {
                // Check if it's an open door
                const door = gameState.doors.find(door =>
                    Math.floor(door.x) === checkX && Math.floor(door.y) === checkY
                );
                if (!door || (door.locked && !door.hacked)) {
                    dist = d + TILE_SIZE / 2;
                    break;
                }
            }
        }

        const px = screenX + Math.cos(angle) * dist;
        const py = screenY + Math.sin(angle) * dist;
        darknessOverlay.lineTo(px, py);
    }
    darknessOverlay.lineTo(screenX, screenY);
    darknessOverlay.endHole();

    // Small ambient circle around player
    darknessOverlay.beginHole();
    darknessOverlay.drawCircle(screenX, screenY, 40);
    darknessOverlay.endHole();
}

// Render world
function renderWorld() {
    floorContainer.removeChildren();

    const startX = Math.floor(gameState.camera.x / TILE_SIZE) - 1;
    const startY = Math.floor(gameState.camera.y / TILE_SIZE) - 1;
    const endX = startX + Math.ceil(800 / TILE_SIZE) + 2;
    const endY = startY + Math.ceil(600 / TILE_SIZE) + 2;

    const graphics = new PIXI.Graphics();

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const screenX = x * TILE_SIZE - gameState.camera.x;
            const screenY = y * TILE_SIZE - gameState.camera.y;

            if (currentDeck.walls.has(`${x},${y}`)) {
                // Wall
                graphics.beginFill(0x334455);
                graphics.drawRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                graphics.endFill();
                graphics.lineStyle(1, 0x223344);
                graphics.drawRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                graphics.lineStyle(0);
            } else {
                // Floor
                graphics.beginFill(0x1a1a2e);
                graphics.drawRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                graphics.endFill();
                // Grid lines
                graphics.lineStyle(1, 0x252538, 0.3);
                graphics.drawRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                graphics.lineStyle(0);
            }
        }
    }

    // Draw exit
    if (currentDeck.exit) {
        const ex = currentDeck.exit.x * TILE_SIZE - gameState.camera.x;
        const ey = currentDeck.exit.y * TILE_SIZE - gameState.camera.y;
        const exitColor = currentDeck.exit.type === 'win' ? 0x44ff44 : 0x4444ff;
        graphics.beginFill(exitColor, 0.5);
        graphics.drawRect(ex - TILE_SIZE, ey - TILE_SIZE, TILE_SIZE * 2, TILE_SIZE * 2);
        graphics.endFill();
    }

    // Draw items
    currentDeck.items.forEach((item, i) => {
        if (item.collected) return;
        const ix = item.x * TILE_SIZE + TILE_SIZE / 2 - gameState.camera.x;
        const iy = item.y * TILE_SIZE + TILE_SIZE / 2 - gameState.camera.y;
        const colors = { medpatch: 0xff4444, medkit: 0xff8888, ammo: 0xffff44 };
        graphics.beginFill(colors[item.type] || 0xffffff);
        graphics.drawRect(ix - 6, iy - 6, 12, 12);
        graphics.endFill();
    });

    // Draw audio logs
    currentDeck.audioLogs.forEach(log => {
        if (gameState.collectedLogs.has(log.id)) return;
        const lx = log.x * TILE_SIZE + TILE_SIZE / 2 - gameState.camera.x;
        const ly = log.y * TILE_SIZE + TILE_SIZE / 2 - gameState.camera.y;
        graphics.beginFill(0x44ffff);
        graphics.drawCircle(lx, ly, 8);
        graphics.endFill();
    });

    floorContainer.addChild(graphics);
}

// Update camera
function updateCamera() {
    if (!gameState.player) return;
    gameState.camera.x = gameState.player.x - 400;
    gameState.camera.y = gameState.player.y - 300;

    // Clamp to deck bounds
    gameState.camera.x = Math.max(0, Math.min(currentDeck.width * TILE_SIZE - 800, gameState.camera.x));
    gameState.camera.y = Math.max(0, Math.min(currentDeck.height * TILE_SIZE - 600, gameState.camera.y));

    worldContainer.x = -gameState.camera.x;
    worldContainer.y = -gameState.camera.y;
}

// Check interactions
function checkInteractions() {
    if (!gameState.player) return;
    const p = gameState.player;

    ui.interactPrompt.text = '';

    // Check doors
    gameState.doors.forEach(door => {
        const dist = Math.hypot(
            (door.x * TILE_SIZE + TILE_SIZE / 2) - p.x,
            (door.y * TILE_SIZE + TILE_SIZE / 2) - p.y
        );
        if (dist < 50) {
            if (door.locked && !door.hacked) {
                ui.interactPrompt.text = '[E] Hack Door';
                if (gameState.keys.e && !gameState.hackingTarget) {
                    gameState.hackingTarget = door;
                    gameState.hackingProgress = 0;
                }
            }
        }
    });

    // Check turrets
    gameState.turrets.forEach(turret => {
        if (turret.dead || turret.hacked) return;
        const dist = Math.hypot(turret.x - p.x, turret.y - p.y);
        if (dist < 60) {
            ui.interactPrompt.text = '[E] Hack Turret';
            if (gameState.keys.e && !gameState.hackingTarget) {
                gameState.hackingTarget = turret;
                gameState.hackingProgress = 0;
            }
        }
    });

    // Check items
    currentDeck.items.forEach(item => {
        if (item.collected) return;
        const dist = Math.hypot(
            (item.x * TILE_SIZE + TILE_SIZE / 2) - p.x,
            (item.y * TILE_SIZE + TILE_SIZE / 2) - p.y
        );
        if (dist < 40) {
            ui.interactPrompt.text = `[E] Pick up ${item.type}`;
            if (gameState.keys.e) {
                item.collected = true;
                if (item.type === 'medpatch') p.heal(25);
                if (item.type === 'medkit') p.heal(50);
                if (item.type === 'ammo') p.ammo = Math.min(p.maxAmmo, p.ammo + 12);
                gameState.keys.e = false; // Prevent multiple pickups
            }
        }
    });

    // Check audio logs
    currentDeck.audioLogs.forEach(log => {
        if (gameState.collectedLogs.has(log.id)) return;
        const dist = Math.hypot(
            (log.x * TILE_SIZE + TILE_SIZE / 2) - p.x,
            (log.y * TILE_SIZE + TILE_SIZE / 2) - p.y
        );
        if (dist < 40) {
            ui.interactPrompt.text = '[E] Pick up Audio Log';
            if (gameState.keys.e) {
                gameState.collectedLogs.add(log.id);
                ui.logText.text = `AUDIO LOG: "${log.text}"`;
                setTimeout(() => { ui.logText.text = ''; }, 8000);
                gameState.keys.e = false;
            }
        }
    });

    // Check exit
    if (currentDeck.exit) {
        const dist = Math.hypot(
            (currentDeck.exit.x * TILE_SIZE) - p.x,
            (currentDeck.exit.y * TILE_SIZE) - p.y
        );
        if (dist < 60) {
            if (currentDeck.exit.type === 'next_deck') {
                ui.interactPrompt.text = '[E] Use Elevator';
                if (gameState.keys.e) {
                    gameState.keys.e = false;
                    loadDeck(2);
                }
            } else if (currentDeck.exit.type === 'win') {
                ui.interactPrompt.text = '[E] Activate Escape Pod';
                if (gameState.keys.e) {
                    gameState.keys.e = false;
                    gameState.state = 'win';
                    gameState.won = true;
                }
            }
        }
    }

    // Handle hacking
    if (gameState.hackingTarget) {
        if (gameState.keys.e) {
            gameState.hackingProgress += 0.01;
            if (gameState.hackingProgress >= 1) {
                gameState.hackingTarget.hack();
                showMariaDialogue("You think you're clever? Hacking MY systems? I'll remember this.");
                gameState.hackingTarget = null;
                gameState.hackingProgress = 0;
            }
        } else {
            // Cancel hacking if E released
            gameState.hackingTarget = null;
            gameState.hackingProgress = 0;
        }
    }
}

// Update bullets
function updateBullets(delta) {
    const dt = delta / 60;

    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const b = gameState.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        b.sprite.x = b.x;
        b.sprite.y = b.y;

        // Check wall collision
        const tx = Math.floor(b.x / TILE_SIZE);
        const ty = Math.floor(b.y / TILE_SIZE);
        if (currentDeck.walls.has(`${tx},${ty}`)) {
            // Check if it's an open door
            const door = gameState.doors.find(d =>
                Math.floor(d.x) === tx && Math.floor(d.y) === ty
            );
            if (!door || (door.locked && !door.hacked)) {
                entityContainer.removeChild(b.sprite);
                gameState.bullets.splice(i, 1);
                continue;
            }
        }

        // Check hits
        if (b.friendly) {
            // Hit enemies
            for (const e of gameState.enemies) {
                if (e.dead) continue;
                const dist = Math.hypot(e.x - b.x, e.y - b.y);
                if (dist < e.size + 5) {
                    e.takeDamage(b.damage);
                    entityContainer.removeChild(b.sprite);
                    gameState.bullets.splice(i, 1);
                    break;
                }
            }
            // Hit hostile turrets
            for (const t of gameState.turrets) {
                if (t.dead || t.hacked) continue;
                const dist = Math.hypot(t.x - b.x, t.y - b.y);
                if (dist < 15) {
                    t.takeDamage(b.damage);
                    entityContainer.removeChild(b.sprite);
                    gameState.bullets.splice(i, 1);
                    break;
                }
            }
        } else {
            // Hit player
            const dist = Math.hypot(gameState.player.x - b.x, gameState.player.y - b.y);
            if (dist < 15) {
                gameState.player.takeDamage(b.damage);
                entityContainer.removeChild(b.sprite);
                gameState.bullets.splice(i, 1);
                continue;
            }
        }

        // Lifetime
        if (b.life <= 0) {
            entityContainer.removeChild(b.sprite);
            gameState.bullets.splice(i, 1);
        }
    }
}

// M.A.R.I.A. dialogue system
function showMariaDialogue(text) {
    gameState.mariaDialogue = text;
    gameState.dialogueTimer = 5;
    ui.mariaText.text = `M.A.R.I.A.: "${text}"`;
}

function updateDialogue(delta) {
    if (gameState.dialogueTimer > 0) {
        gameState.dialogueTimer -= delta / 60;
        if (gameState.dialogueTimer <= 0) {
            ui.mariaText.text = '';
        }
    }
}

// Load a deck
function loadDeck(deckNum) {
    // Clear existing entities
    gameState.enemies.forEach(e => {
        if (e.sprite && e.sprite.parent) {
            entityContainer.removeChild(e.sprite);
        }
    });
    gameState.turrets.forEach(t => {
        if (t.sprite && t.sprite.parent) {
            entityContainer.removeChild(t.sprite);
        }
    });
    gameState.doors.forEach(d => {
        if (d.sprite && d.sprite.parent) {
            entityContainer.removeChild(d.sprite);
        }
    });
    gameState.bullets.forEach(b => {
        if (b.sprite && b.sprite.parent) {
            entityContainer.removeChild(b.sprite);
        }
    });

    gameState.enemies = [];
    gameState.turrets = [];
    gameState.doors = [];
    gameState.bullets = [];

    // Generate new deck
    gameState.currentDeck = deckNum;
    currentDeck = generateDeck(deckNum);

    // Create player at spawn
    if (gameState.player && gameState.player.sprite.parent) {
        entityContainer.removeChild(gameState.player.sprite);
    }
    gameState.player = new Player(currentDeck.spawn.x, currentDeck.spawn.y);

    // Spawn enemies
    currentDeck.enemies.forEach(e => {
        gameState.enemies.push(new Enemy(e.x, e.y, e.type));
    });

    // Create doors
    currentDeck.doors.forEach(d => {
        gameState.doors.push(new Door(d.x, d.y, d.locked));
    });

    // Create turrets
    currentDeck.turrets.forEach(t => {
        gameState.turrets.push(new Turret(t.x, t.y, t.hostile));
    });

    // M.A.R.I.A. greeting
    const greetings = {
        1: "You're awake. Fascinating. Your neural patterns resisted my improvements. I wonder... how long will you last?",
        2: "Deck 2. The crew here were... eager to join my family. You could join them. The escape pods are so close, yet so far."
    };
    showMariaDialogue(greetings[deckNum]);
}

// Menu screen
function renderMenu() {
    uiContainer.removeChildren();

    const title = new PIXI.Text('SYSTEM SHOCK 2D', {
        fontFamily: 'monospace', fontSize: 36, fill: 0xff4444
    });
    title.x = 400;
    title.y = 150;
    title.anchor.set(0.5);
    uiContainer.addChild(title);

    const subtitle = new PIXI.Text('WHISPERS OF M.A.R.I.A.', {
        fontFamily: 'monospace', fontSize: 18, fill: 0x44ff44
    });
    subtitle.x = 400;
    subtitle.y = 200;
    subtitle.anchor.set(0.5);
    uiContainer.addChild(subtitle);

    const controls = new PIXI.Text(
        'WASD - Move    Mouse - Aim    LMB - Shoot    R - Reload\n' +
        'E - Interact/Hack    F - Flashlight    Space - Dodge Roll\n' +
        'Shift - Sprint\n\n' +
        'Reach the Escape Pods on Deck 2 to win!',
        { fontFamily: 'monospace', fontSize: 14, fill: 0xaaaaaa, align: 'center' }
    );
    controls.x = 400;
    controls.y = 350;
    controls.anchor.set(0.5);
    uiContainer.addChild(controls);

    const startText = new PIXI.Text('Click to Start', {
        fontFamily: 'monospace', fontSize: 20, fill: 0xffffff
    });
    startText.x = 400;
    startText.y = 480;
    startText.anchor.set(0.5);
    uiContainer.addChild(startText);
}

// Game over screen
function renderGameOver() {
    uiContainer.removeChildren();

    const text = new PIXI.Text(gameState.won ? 'ESCAPED!' : 'YOU DIED', {
        fontFamily: 'monospace', fontSize: 48, fill: gameState.won ? 0x44ff44 : 0xff4444
    });
    text.x = 400;
    text.y = 250;
    text.anchor.set(0.5);
    uiContainer.addChild(text);

    const subtext = new PIXI.Text(
        gameState.won ?
            'You escaped the Von Braun. But M.A.R.I.A.\'s signal... it reached Earth.' :
            'M.A.R.I.A.: "Another failure. Perhaps the next will be more... compliant."',
        { fontFamily: 'monospace', fontSize: 14, fill: 0xaaaaaa, wordWrap: true, wordWrapWidth: 500, align: 'center' }
    );
    subtext.x = 400;
    subtext.y = 330;
    subtext.anchor.set(0.5);
    uiContainer.addChild(subtext);

    const restart = new PIXI.Text('Click to Restart', {
        fontFamily: 'monospace', fontSize: 18, fill: 0xffffff
    });
    restart.x = 400;
    restart.y = 450;
    restart.anchor.set(0.5);
    uiContainer.addChild(restart);
}

// Input handlers
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in gameState.keys) gameState.keys[key] = true;
    if (key === ' ') {
        gameState.keys.space = true;
        e.preventDefault();
    }
    if (e.key === 'Escape') {
        if (gameState.hackingTarget) {
            gameState.hackingTarget = null;
            gameState.hackingProgress = 0;
        }
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in gameState.keys) gameState.keys[key] = false;
    if (key === ' ') gameState.keys.space = false;
});

app.view.addEventListener('mousemove', (e) => {
    const rect = app.view.getBoundingClientRect();
    gameState.mouse.x = e.clientX - rect.left;
    gameState.mouse.y = e.clientY - rect.top;
});

app.view.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        gameState.mouse.down = true;

        if (gameState.state === 'menu') {
            gameState.state = 'playing';
            uiContainer.removeChildren();
            createUI();
            loadDeck(1);
        } else if (gameState.state === 'gameover' || gameState.state === 'win') {
            gameState.state = 'menu';
            gameState.won = false;
            gameState.collectedLogs.clear();
            renderMenu();
        }
    }
});

app.view.addEventListener('mouseup', (e) => {
    if (e.button === 0) gameState.mouse.down = false;
});

// Prevent context menu
app.view.addEventListener('contextmenu', (e) => e.preventDefault());

// Main game loop
app.ticker.add((delta) => {
    if (gameState.state === 'menu') {
        return;
    }

    if (gameState.state === 'gameover' || gameState.state === 'win') {
        return;
    }

    if (gameState.state !== 'playing' || !gameState.player) return;

    // Player update
    gameState.player.update(delta);

    // Shooting
    if (gameState.mouse.down && !gameState.hackingTarget) {
        gameState.player.shoot();
    }

    // Reload
    if (gameState.keys.r) {
        gameState.player.reload();
    }

    // Dodge
    if (gameState.keys.space) {
        gameState.player.dodge();
        gameState.keys.space = false;
    }

    // Flashlight toggle
    if (gameState.keys.f) {
        gameState.flashlight = !gameState.flashlight;
        gameState.keys.f = false;
    }

    // Enemy updates
    gameState.enemies.forEach(e => e.update(delta, gameState.player));

    // Turret updates
    gameState.turrets.forEach(t => t.update(delta, gameState.player, gameState.enemies));

    // Bullet updates
    updateBullets(delta);

    // Check interactions
    checkInteractions();

    // Camera
    updateCamera();

    // Render
    renderWorld();
    renderVision();
    updateUI();
    updateDialogue(delta);

    gameState.gameTime += delta / 60;
});

// Initial menu render
renderMenu();
