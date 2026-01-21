// Zero Sievert Clone - PixiJS Implementation
// Top-down extraction shooter in post-apocalyptic wasteland

const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x2d3a2d,
    antialias: true
});
document.body.appendChild(app.view);

// Constants
const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 40;
const PLAYER_SPEED = 150;
const SPRINT_SPEED = 220;
const VIEW_CONE_ANGLE = Math.PI / 2; // 90 degrees
const VIEW_DISTANCE = 300;

// Game state
const gameState = {
    state: 'menu', // menu, playing, extracted, dead
    player: null,
    enemies: [],
    bullets: [],
    lootContainers: [],
    collectibles: [],
    map: [],
    camera: { x: 0, y: 0 },
    keys: { w: false, a: false, s: false, d: false, shift: false, e: false, r: false },
    mouse: { x: 400, y: 300, down: false },
    score: 0,
    kills: 0,
    lootValue: 0,
    gameTime: 0,
    extractionPoint: null,
    highScore: parseInt(localStorage.getItem('zeroSievertHighScore')) || 0,
    message: '',
    messageTimer: 0
};

// Weapons data
const WEAPONS = {
    pistol: { name: 'PM Pistol', damage: 18, fireRate: 0.3, spread: 8, magSize: 8, reloadTime: 1.5, speed: 500, color: 0xffff44 },
    smg: { name: 'Skorpion', damage: 14, fireRate: 0.08, spread: 12, magSize: 20, reloadTime: 2.0, speed: 450, color: 0xff8844 },
    shotgun: { name: 'Pump Shotgun', damage: 8, fireRate: 0.8, spread: 25, magSize: 6, reloadTime: 2.5, pellets: 8, speed: 400, color: 0xff4444 },
    rifle: { name: 'AK-74', damage: 28, fireRate: 0.12, spread: 6, magSize: 30, reloadTime: 2.0, speed: 550, color: 0x44ff44 }
};

// Enemy types
const ENEMY_TYPES = {
    wolf: { hp: 40, speed: 140, damage: 15, color: 0x666666, size: 10, behavior: 'chase', attackRange: 25 },
    boar: { hp: 80, speed: 100, damage: 20, color: 0x884422, size: 14, behavior: 'charge', attackRange: 30 },
    banditMelee: { hp: 60, speed: 90, damage: 18, color: 0xaa6644, size: 12, behavior: 'chase', attackRange: 30 },
    banditPistol: { hp: 60, speed: 70, damage: 15, color: 0x888866, size: 12, behavior: 'ranged', attackRange: 200, fireRate: 0.8 },
    banditRifle: { hp: 80, speed: 60, damage: 25, color: 0x668844, size: 12, behavior: 'ranged', attackRange: 280, fireRate: 0.5 }
};

// Containers
const worldContainer = new PIXI.Container();
const mapContainer = new PIXI.Container();
const entityContainer = new PIXI.Container();
const fogContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();

worldContainer.addChild(mapContainer);
worldContainer.addChild(entityContainer);
worldContainer.addChild(fogContainer);
app.stage.addChild(worldContainer);
app.stage.addChild(uiContainer);

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hp = 100;
        this.maxHp = 100;
        this.stamina = 100;
        this.maxStamina = 100;
        this.bleeding = false;
        this.bleedTimer = 0;
        this.angle = 0;

        // Inventory
        this.weapon = 'pistol';
        this.ammo = { pistol: 24, smg: 60, shotgun: 24, rifle: 90 };
        this.magazine = WEAPONS[this.weapon].magSize;
        this.fireCooldown = 0;
        this.reloading = false;
        this.reloadTimer = 0;

        // Items
        this.bandages = 3;
        this.medkits = 1;

        // Loot
        this.inventory = [];

        this.createSprite();
    }

    createSprite() {
        this.sprite = new PIXI.Container();

        // Body
        this.body = new PIXI.Graphics();
        this.body.beginFill(0x4488ff);
        this.body.drawCircle(0, 0, 12);
        this.body.endFill();
        this.sprite.addChild(this.body);

        // Direction indicator
        this.direction = new PIXI.Graphics();
        this.direction.beginFill(0xffffff);
        this.direction.drawRect(10, -2, 8, 4);
        this.direction.endFill();
        this.sprite.addChild(this.direction);

        entityContainer.addChild(this.sprite);
    }

    update(delta) {
        const dt = delta / 60;

        // Movement
        let dx = 0, dy = 0;
        if (gameState.keys.w) dy -= 1;
        if (gameState.keys.s) dy += 1;
        if (gameState.keys.a) dx -= 1;
        if (gameState.keys.d) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;

            let speed = PLAYER_SPEED;
            if (gameState.keys.shift && this.stamina > 0) {
                speed = SPRINT_SPEED;
                this.stamina = Math.max(0, this.stamina - 20 * dt);
            } else {
                this.stamina = Math.min(this.maxStamina, this.stamina + 10 * dt);
            }

            const newX = this.x + dx * speed * dt;
            const newY = this.y + dy * speed * dt;

            // Collision check
            if (!this.checkCollision(newX, this.y)) this.x = newX;
            if (!this.checkCollision(this.x, newY)) this.y = newY;
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + 15 * dt);
        }

        // Aim at mouse
        const worldMouseX = gameState.mouse.x + gameState.camera.x;
        const worldMouseY = gameState.mouse.y + gameState.camera.y;
        this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

        // Cooldowns
        if (this.fireCooldown > 0) this.fireCooldown -= dt;

        // Reloading
        if (this.reloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                const weapon = WEAPONS[this.weapon];
                const needed = weapon.magSize - this.magazine;
                const available = Math.min(needed, this.ammo[this.weapon]);
                this.magazine += available;
                this.ammo[this.weapon] -= available;
                this.reloading = false;
            }
        }

        // Bleeding
        if (this.bleeding) {
            this.hp -= 2 * dt;
            this.bleedTimer -= dt;
            if (this.bleedTimer <= 0) this.bleeding = false;
        }

        // Death check
        if (this.hp <= 0) {
            this.hp = 0;
            gameState.state = 'dead';
        }

        // Update sprite
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.rotation = this.angle;

        // Check extraction
        if (gameState.extractionPoint) {
            const dist = Math.hypot(
                gameState.extractionPoint.x - this.x,
                gameState.extractionPoint.y - this.y
            );
            if (dist < 50 && gameState.keys.e) {
                extract();
            }
        }
    }

    checkCollision(x, y) {
        const tx = Math.floor(x / TILE_SIZE);
        const ty = Math.floor(y / TILE_SIZE);

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const checkX = tx + dx;
                const checkY = ty + dy;
                if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT) {
                    const tile = gameState.map[checkY][checkX];
                    if (tile.solid) {
                        const wallX = checkX * TILE_SIZE + TILE_SIZE / 2;
                        const wallY = checkY * TILE_SIZE + TILE_SIZE / 2;
                        const distX = Math.abs(x - wallX);
                        const distY = Math.abs(y - wallY);
                        if (distX < TILE_SIZE / 2 + 12 && distY < TILE_SIZE / 2 + 12) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    shoot() {
        if (this.fireCooldown > 0 || this.reloading || this.magazine <= 0) return;

        const weapon = WEAPONS[this.weapon];
        this.fireCooldown = weapon.fireRate;
        this.magazine--;

        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const spread = (Math.random() - 0.5) * weapon.spread * Math.PI / 180;
            const angle = this.angle + spread;

            const bullet = {
                x: this.x + Math.cos(this.angle) * 20,
                y: this.y + Math.sin(this.angle) * 20,
                vx: Math.cos(angle) * weapon.speed,
                vy: Math.sin(angle) * weapon.speed,
                damage: weapon.damage,
                friendly: true,
                life: 1.5,
                color: weapon.color,
                sprite: null
            };

            bullet.sprite = new PIXI.Graphics();
            bullet.sprite.beginFill(weapon.color);
            bullet.sprite.drawCircle(0, 0, 3);
            bullet.sprite.endFill();
            bullet.sprite.x = bullet.x;
            bullet.sprite.y = bullet.y;
            entityContainer.addChild(bullet.sprite);
            gameState.bullets.push(bullet);
        }

        // Auto reload
        if (this.magazine <= 0 && this.ammo[this.weapon] > 0) {
            this.reload();
        }
    }

    reload() {
        if (this.reloading || this.magazine >= WEAPONS[this.weapon].magSize || this.ammo[this.weapon] <= 0) return;
        this.reloading = true;
        this.reloadTimer = WEAPONS[this.weapon].reloadTime;
    }

    switchWeapon(weapon) {
        if (this.weapon === weapon) return;
        this.weapon = weapon;
        this.magazine = Math.min(this.ammo[weapon], WEAPONS[weapon].magSize);
        this.ammo[weapon] -= this.magazine;
        this.reloading = false;
        showMessage(`Switched to ${WEAPONS[weapon].name}`);
    }

    useBandage() {
        if (this.bandages <= 0) return;
        this.bandages--;
        this.bleeding = false;
        this.hp = Math.min(this.maxHp, this.hp + 20);
        showMessage('Used bandage');
    }

    useMedkit() {
        if (this.medkits <= 0) return;
        this.medkits--;
        this.bleeding = false;
        this.hp = Math.min(this.maxHp, this.hp + 50);
        showMessage('Used medkit');
    }

    takeDamage(amount) {
        this.hp -= amount;
        // Chance to bleed
        if (Math.random() < 0.3) {
            this.bleeding = true;
            this.bleedTimer = 10;
        }
    }

    canSee(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > VIEW_DISTANCE) return false;

        // Check angle (within vision cone)
        const angleToTarget = Math.atan2(dy, dx);
        let angleDiff = Math.abs(angleToTarget - this.angle);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
        if (angleDiff > VIEW_CONE_ANGLE / 2) return false;

        // Line of sight
        return this.hasLineOfSight(x, y);
    }

    hasLineOfSight(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(dist / (TILE_SIZE / 2));

        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const checkX = Math.floor((this.x + dx * t) / TILE_SIZE);
            const checkY = Math.floor((this.y + dy * t) / TILE_SIZE);

            if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT) {
                if (gameState.map[checkY][checkX].solid) {
                    return false;
                }
            }
        }
        return true;
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        const data = ENEMY_TYPES[type];
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.speed = data.speed;
        this.damage = data.damage;
        this.size = data.size;
        this.behavior = data.behavior;
        this.attackRange = data.attackRange;
        this.fireRate = data.fireRate || 1;
        this.angle = Math.random() * Math.PI * 2;
        this.state = 'patrol';
        this.attackCooldown = 0;
        this.patrolAngle = this.angle;
        this.dead = false;
        this.alertTimer = 0;
        this.chargeTarget = null;

        this.createSprite(data.color);
    }

    createSprite(color) {
        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(color);
        this.sprite.drawCircle(0, 0, this.size);
        this.sprite.endFill();
        // Eye
        this.sprite.beginFill(0xff0000);
        this.sprite.drawCircle(this.size * 0.6, 0, 3);
        this.sprite.endFill();

        entityContainer.addChild(this.sprite);
    }

    update(delta, player) {
        if (this.dead) return;

        const dt = delta / 60;

        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        if (this.alertTimer > 0) this.alertTimer -= dt;

        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);

        // Vision cone check (enemies have limited vision too)
        const canSeePlayer = this.canSeePlayer(player);

        switch (this.state) {
            case 'patrol':
                this.x += Math.cos(this.patrolAngle) * this.speed * 0.3 * dt;
                this.y += Math.sin(this.patrolAngle) * this.speed * 0.3 * dt;
                this.angle = this.patrolAngle;
                this.resolveCollisions();

                if (Math.random() < 0.01) {
                    this.patrolAngle += (Math.random() - 0.5) * Math.PI;
                }

                if (canSeePlayer && distToPlayer < 250) {
                    this.state = 'chase';
                }
                break;

            case 'chase':
                this.angle = angleToPlayer;

                if (this.behavior === 'ranged' && distToPlayer < this.attackRange && distToPlayer > 80) {
                    this.state = 'attack';
                } else if (this.behavior === 'charge' && distToPlayer < 150) {
                    this.state = 'charge';
                    this.chargeTarget = { x: player.x, y: player.y };
                } else {
                    this.x += Math.cos(this.angle) * this.speed * dt;
                    this.y += Math.sin(this.angle) * this.speed * dt;
                    this.resolveCollisions();

                    if (distToPlayer < this.attackRange) {
                        this.state = 'attack';
                    }
                }

                if (!canSeePlayer && distToPlayer > 300) {
                    this.alertTimer = 3;
                    this.state = 'alert';
                }
                break;

            case 'alert':
                if (this.alertTimer <= 0) {
                    this.state = canSeePlayer ? 'chase' : 'patrol';
                }
                break;

            case 'attack':
                this.angle = angleToPlayer;

                if (this.behavior === 'ranged') {
                    if (this.attackCooldown <= 0 && canSeePlayer) {
                        this.shootAt(player);
                        this.attackCooldown = this.fireRate;
                    }
                    if (distToPlayer > this.attackRange * 1.2 || distToPlayer < 60) {
                        this.state = 'chase';
                    }
                } else {
                    if (distToPlayer < this.attackRange && this.attackCooldown <= 0) {
                        player.takeDamage(this.damage);
                        this.attackCooldown = 1.0;
                        showMessage(`Hit by ${this.type}!`);
                    }
                    if (distToPlayer > this.attackRange * 1.5) {
                        this.state = 'chase';
                    }
                }
                break;

            case 'charge':
                if (this.chargeTarget) {
                    const angleToTarget = Math.atan2(this.chargeTarget.y - this.y, this.chargeTarget.x - this.x);
                    this.angle = angleToTarget;
                    this.x += Math.cos(this.angle) * this.speed * 2 * dt;
                    this.y += Math.sin(this.angle) * this.speed * 2 * dt;
                    this.resolveCollisions();

                    const distToTarget = Math.hypot(this.chargeTarget.x - this.x, this.chargeTarget.y - this.y);
                    if (distToTarget < 20) {
                        this.chargeTarget = null;
                        this.state = 'chase';
                    }

                    // Hit player during charge
                    if (distToPlayer < 30 && this.attackCooldown <= 0) {
                        player.takeDamage(this.damage * 1.5);
                        this.attackCooldown = 1.5;
                        showMessage('Charged by boar!');
                    }
                }
                break;
        }

        // Clamp to map
        this.x = Math.max(TILE_SIZE, Math.min(MAP_WIDTH * TILE_SIZE - TILE_SIZE, this.x));
        this.y = Math.max(TILE_SIZE, Math.min(MAP_HEIGHT * TILE_SIZE - TILE_SIZE, this.y));

        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.rotation = this.angle;

        // Visibility based on player vision
        this.sprite.visible = player.canSee(this.x, this.y);
    }

    canSeePlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 250) return false;

        // Check angle
        const angleToPlayer = Math.atan2(dy, dx);
        let angleDiff = Math.abs(angleToPlayer - this.angle);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
        if (angleDiff > Math.PI / 2) return false; // 90 degree cone

        return player.hasLineOfSight(this.x, this.y);
    }

    resolveCollisions() {
        const tx = Math.floor(this.x / TILE_SIZE);
        const ty = Math.floor(this.y / TILE_SIZE);

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const checkX = tx + dx;
                const checkY = ty + dy;
                if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT) {
                    if (gameState.map[checkY][checkX].solid) {
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
    }

    shootAt(player) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const spread = (Math.random() - 0.5) * 10 * Math.PI / 180;

        const bullet = {
            x: this.x + Math.cos(angle) * 15,
            y: this.y + Math.sin(angle) * 15,
            vx: Math.cos(angle + spread) * 300,
            vy: Math.sin(angle + spread) * 300,
            damage: this.damage,
            friendly: false,
            life: 2,
            color: 0xff4444,
            sprite: null
        };

        bullet.sprite = new PIXI.Graphics();
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
            this.die();
        }
    }

    die() {
        this.dead = true;
        entityContainer.removeChild(this.sprite);
        gameState.kills++;
        gameState.score += 50;

        // Drop loot
        const lootChance = Math.random();
        if (lootChance < 0.4) {
            spawnCollectible(this.x, this.y, 'bandage');
        } else if (lootChance < 0.6) {
            spawnCollectible(this.x, this.y, 'ammo');
        } else if (lootChance < 0.7) {
            spawnCollectible(this.x, this.y, 'medkit');
        }
    }
}

// Loot container class
class LootContainer {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.looted = false;

        this.sprite = new PIXI.Graphics();
        const colors = { crate: 0x8b4513, medical: 0xffffff, weapon: 0x666666 };
        this.sprite.beginFill(colors[type] || 0x8b4513);
        this.sprite.drawRect(-10, -10, 20, 20);
        this.sprite.endFill();
        this.sprite.x = x;
        this.sprite.y = y;
        entityContainer.addChild(this.sprite);
    }

    interact(player) {
        if (this.looted) return;
        this.looted = true;
        this.sprite.alpha = 0.3;

        // Generate loot (more healing than weapons, 2:1 ratio)
        const lootRoll = Math.random();
        if (this.type === 'medical') {
            if (lootRoll < 0.5) {
                player.bandages += 2;
                showMessage('Found 2 bandages!');
            } else {
                player.medkits += 1;
                showMessage('Found medkit!');
            }
        } else if (this.type === 'weapon') {
            const ammoType = ['pistol', 'smg', 'shotgun', 'rifle'][Math.floor(Math.random() * 4)];
            const amount = { pistol: 16, smg: 40, shotgun: 12, rifle: 30 }[ammoType];
            player.ammo[ammoType] += amount;
            showMessage(`Found ${amount} ${ammoType} ammo!`);
            gameState.lootValue += 100;
        } else {
            // Regular crate - mostly healing
            if (lootRoll < 0.4) {
                player.bandages += 1;
                showMessage('Found bandage!');
            } else if (lootRoll < 0.6) {
                const ammoType = ['pistol', 'smg', 'shotgun', 'rifle'][Math.floor(Math.random() * 4)];
                const amount = { pistol: 8, smg: 20, shotgun: 6, rifle: 15 }[ammoType];
                player.ammo[ammoType] += amount;
                showMessage(`Found ${amount} ${ammoType} ammo!`);
                gameState.lootValue += 50;
            } else if (lootRoll < 0.8) {
                player.medkits += 1;
                showMessage('Found medkit!');
            } else {
                gameState.lootValue += 200;
                showMessage('Found valuable item! +200');
            }
        }

        gameState.score += 25;
    }
}

// Collectible class
class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.collected = false;

        this.sprite = new PIXI.Graphics();
        const colors = { bandage: 0xffffff, medkit: 0xff4444, ammo: 0xffff44 };
        this.sprite.beginFill(colors[type] || 0xffffff);
        this.sprite.drawCircle(0, 0, 6);
        this.sprite.endFill();
        this.sprite.x = x;
        this.sprite.y = y;
        entityContainer.addChild(this.sprite);
    }

    update(player) {
        if (this.collected) return;

        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < 25) {
            this.collect(player);
        }
    }

    collect(player) {
        this.collected = true;
        entityContainer.removeChild(this.sprite);

        if (this.type === 'bandage') {
            player.bandages++;
            showMessage('Picked up bandage');
        } else if (this.type === 'medkit') {
            player.medkits++;
            showMessage('Picked up medkit');
        } else if (this.type === 'ammo') {
            const types = ['pistol', 'smg', 'shotgun', 'rifle'];
            const type = types[Math.floor(Math.random() * types.length)];
            const amounts = { pistol: 8, smg: 20, shotgun: 6, rifle: 15 };
            player.ammo[type] += amounts[type];
            showMessage(`Picked up ${type} ammo`);
        }
    }
}

// Helper functions
function spawnCollectible(x, y, type) {
    const collectible = new Collectible(x, y, type);
    gameState.collectibles.push(collectible);
}

function showMessage(text) {
    gameState.message = text;
    gameState.messageTimer = 3;
}

// Map generation
function generateMap() {
    gameState.map = [];

    // Initialize with grass
    for (let y = 0; y < MAP_HEIGHT; y++) {
        gameState.map[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            gameState.map[y][x] = { type: 'grass', solid: false, color: 0x2d5a27 };
        }
    }

    // Add trees (obstacles)
    for (let i = 0; i < 80; i++) {
        const x = Math.floor(Math.random() * (MAP_WIDTH - 4)) + 2;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - 4)) + 2;
        gameState.map[y][x] = { type: 'tree', solid: true, color: 0x1a4a17 };
    }

    // Add buildings (clusters of walls)
    const buildingCount = 5;
    for (let b = 0; b < buildingCount; b++) {
        const bx = Math.floor(Math.random() * (MAP_WIDTH - 10)) + 5;
        const by = Math.floor(Math.random() * (MAP_HEIGHT - 10)) + 5;
        const bw = 4 + Math.floor(Math.random() * 3);
        const bh = 4 + Math.floor(Math.random() * 3);

        // Walls
        for (let y = by; y < by + bh && y < MAP_HEIGHT; y++) {
            for (let x = bx; x < bx + bw && x < MAP_WIDTH; x++) {
                if (y === by || y === by + bh - 1 || x === bx || x === bx + bw - 1) {
                    gameState.map[y][x] = { type: 'wall', solid: true, color: 0x555566 };
                } else {
                    gameState.map[y][x] = { type: 'floor', solid: false, color: 0x444444 };
                }
            }
        }

        // Door (gap in wall)
        const doorSide = Math.floor(Math.random() * 4);
        let doorX, doorY;
        if (doorSide === 0) { doorX = bx + Math.floor(bw / 2); doorY = by; }
        else if (doorSide === 1) { doorX = bx + Math.floor(bw / 2); doorY = by + bh - 1; }
        else if (doorSide === 2) { doorX = bx; doorY = by + Math.floor(bh / 2); }
        else { doorX = bx + bw - 1; doorY = by + Math.floor(bh / 2); }

        if (doorX < MAP_WIDTH && doorY < MAP_HEIGHT) {
            gameState.map[doorY][doorX] = { type: 'door', solid: false, color: 0x8b4513 };
        }

        // Add loot inside building
        const lootX = bx + 1 + Math.floor(Math.random() * (bw - 2));
        const lootY = by + 1 + Math.floor(Math.random() * (bh - 2));
        if (lootX < MAP_WIDTH && lootY < MAP_HEIGHT) {
            const lootType = Math.random() < 0.6 ? 'medical' : 'weapon';
            const container = new LootContainer(
                lootX * TILE_SIZE + TILE_SIZE / 2,
                lootY * TILE_SIZE + TILE_SIZE / 2,
                lootType
            );
            gameState.lootContainers.push(container);
        }
    }

    // Add scattered loot crates
    for (let i = 0; i < 15; i++) {
        const x = Math.floor(Math.random() * MAP_WIDTH);
        const y = Math.floor(Math.random() * MAP_HEIGHT);
        if (!gameState.map[y][x].solid) {
            const container = new LootContainer(
                x * TILE_SIZE + TILE_SIZE / 2,
                y * TILE_SIZE + TILE_SIZE / 2,
                'crate'
            );
            gameState.lootContainers.push(container);
        }
    }

    // Extraction point (top right corner area)
    gameState.extractionPoint = {
        x: (MAP_WIDTH - 5) * TILE_SIZE,
        y: 5 * TILE_SIZE
    };
}

// Render map
function renderMap() {
    mapContainer.removeChildren();

    const graphics = new PIXI.Graphics();
    const startX = Math.max(0, Math.floor(gameState.camera.x / TILE_SIZE) - 1);
    const startY = Math.max(0, Math.floor(gameState.camera.y / TILE_SIZE) - 1);
    const endX = Math.min(MAP_WIDTH, startX + Math.ceil(800 / TILE_SIZE) + 3);
    const endY = Math.min(MAP_HEIGHT, startY + Math.ceil(600 / TILE_SIZE) + 3);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const tile = gameState.map[y][x];
            const screenX = x * TILE_SIZE - gameState.camera.x;
            const screenY = y * TILE_SIZE - gameState.camera.y;

            graphics.beginFill(tile.color);
            graphics.drawRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            graphics.endFill();
        }
    }

    // Draw extraction point
    if (gameState.extractionPoint) {
        const ex = gameState.extractionPoint.x - gameState.camera.x;
        const ey = gameState.extractionPoint.y - gameState.camera.y;
        graphics.beginFill(0x44ff44, 0.3);
        graphics.drawCircle(ex, ey, 50);
        graphics.endFill();
        graphics.lineStyle(2, 0x44ff44);
        graphics.drawCircle(ex, ey, 50);
        graphics.lineStyle(0);
    }

    mapContainer.addChild(graphics);
}

// Render fog of war (vision cone)
function renderFog() {
    fogContainer.removeChildren();

    if (!gameState.player) return;

    const p = gameState.player;
    const graphics = new PIXI.Graphics();

    // Dark overlay
    graphics.beginFill(0x000000, 0.7);
    graphics.drawRect(0, 0, 800, 600);
    graphics.endFill();

    // Cut out vision cone (what player CAN see)
    graphics.beginHole();

    const screenX = p.x - gameState.camera.x;
    const screenY = p.y - gameState.camera.y;
    const segments = 40;

    // Draw cone
    graphics.moveTo(screenX, screenY);
    for (let i = 0; i <= segments; i++) {
        const angle = p.angle - VIEW_CONE_ANGLE / 2 + (VIEW_CONE_ANGLE * i / segments);

        // Raycast for walls
        let dist = VIEW_DISTANCE;
        for (let d = TILE_SIZE; d < VIEW_DISTANCE; d += TILE_SIZE / 2) {
            const checkX = Math.floor((p.x + Math.cos(angle) * d) / TILE_SIZE);
            const checkY = Math.floor((p.y + Math.sin(angle) * d) / TILE_SIZE);
            if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT) {
                if (gameState.map[checkY][checkX].solid) {
                    dist = d + TILE_SIZE / 2;
                    break;
                }
            }
        }

        const px = screenX + Math.cos(angle) * dist;
        const py = screenY + Math.sin(angle) * dist;
        graphics.lineTo(px, py);
    }
    graphics.lineTo(screenX, screenY);
    graphics.endHole();

    // Small circle around player
    graphics.beginHole();
    graphics.drawCircle(screenX, screenY, 30);
    graphics.endHole();

    fogContainer.addChild(graphics);
}

// Update bullets
function updateBullets(delta) {
    const dt = delta / 60;

    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const b = gameState.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        b.sprite.x = b.x - gameState.camera.x;
        b.sprite.y = b.y - gameState.camera.y;

        // Wall collision
        const tx = Math.floor(b.x / TILE_SIZE);
        const ty = Math.floor(b.y / TILE_SIZE);
        if (tx >= 0 && tx < MAP_WIDTH && ty >= 0 && ty < MAP_HEIGHT) {
            if (gameState.map[ty][tx].solid) {
                entityContainer.removeChild(b.sprite);
                gameState.bullets.splice(i, 1);
                continue;
            }
        }

        // Hit detection
        if (b.friendly) {
            for (const enemy of gameState.enemies) {
                if (enemy.dead) continue;
                const dist = Math.hypot(enemy.x - b.x, enemy.y - b.y);
                if (dist < enemy.size + 5) {
                    enemy.takeDamage(b.damage);
                    entityContainer.removeChild(b.sprite);
                    gameState.bullets.splice(i, 1);
                    break;
                }
            }
        } else {
            const dist = Math.hypot(gameState.player.x - b.x, gameState.player.y - b.y);
            if (dist < 15) {
                gameState.player.takeDamage(b.damage);
                showMessage('Hit!');
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

// Update camera
function updateCamera() {
    if (!gameState.player) return;

    gameState.camera.x = gameState.player.x - 400;
    gameState.camera.y = gameState.player.y - 300;

    gameState.camera.x = Math.max(0, Math.min(MAP_WIDTH * TILE_SIZE - 800, gameState.camera.x));
    gameState.camera.y = Math.max(0, Math.min(MAP_HEIGHT * TILE_SIZE - 600, gameState.camera.y));

    worldContainer.x = -gameState.camera.x;
    worldContainer.y = -gameState.camera.y;
}

// Spawn enemies
function spawnEnemies() {
    gameState.enemies = [];

    const enemySpawns = [
        // Wildlife
        { type: 'wolf', count: 4 },
        { type: 'boar', count: 2 },
        // Bandits
        { type: 'banditMelee', count: 3 },
        { type: 'banditPistol', count: 3 },
        { type: 'banditRifle', count: 2 }
    ];

    enemySpawns.forEach(spawn => {
        for (let i = 0; i < spawn.count; i++) {
            let x, y, attempts = 0;
            do {
                x = Math.floor(Math.random() * (MAP_WIDTH - 4) + 2) * TILE_SIZE + TILE_SIZE / 2;
                y = Math.floor(Math.random() * (MAP_HEIGHT - 4) + 2) * TILE_SIZE + TILE_SIZE / 2;
                attempts++;
            } while (
                (Math.hypot(x - gameState.player.x, y - gameState.player.y) < 200 ||
                    gameState.map[Math.floor(y / TILE_SIZE)][Math.floor(x / TILE_SIZE)].solid) &&
                attempts < 50
            );

            if (attempts < 50) {
                const enemy = new Enemy(x, y, spawn.type);
                gameState.enemies.push(enemy);
            }
        }
    });
}

// UI
function createUI() {
    uiContainer.removeChildren();

    // HP bar
    const hpBar = new PIXI.Graphics();
    hpBar.name = 'hpBar';
    uiContainer.addChild(hpBar);

    // Stamina bar
    const staminaBar = new PIXI.Graphics();
    staminaBar.name = 'staminaBar';
    uiContainer.addChild(staminaBar);

    // Weapon info
    const weaponText = new PIXI.Text('', { fontFamily: 'monospace', fontSize: 14, fill: 0xffffff });
    weaponText.name = 'weaponText';
    weaponText.x = 10;
    weaponText.y = 560;
    uiContainer.addChild(weaponText);

    // Items
    const itemsText = new PIXI.Text('', { fontFamily: 'monospace', fontSize: 12, fill: 0xcccccc });
    itemsText.name = 'itemsText';
    itemsText.x = 10;
    itemsText.y = 580;
    uiContainer.addChild(itemsText);

    // Score
    const scoreText = new PIXI.Text('', { fontFamily: 'monospace', fontSize: 14, fill: 0xffff44 });
    scoreText.name = 'scoreText';
    scoreText.x = 700;
    scoreText.y = 10;
    uiContainer.addChild(scoreText);

    // Extraction marker
    const extractText = new PIXI.Text('', { fontFamily: 'monospace', fontSize: 12, fill: 0x44ff44 });
    extractText.name = 'extractText';
    extractText.x = 650;
    extractText.y = 560;
    uiContainer.addChild(extractText);

    // Message
    const messageText = new PIXI.Text('', { fontFamily: 'monospace', fontSize: 14, fill: 0xffff44 });
    messageText.name = 'messageText';
    messageText.x = 400;
    messageText.y = 100;
    messageText.anchor.set(0.5, 0);
    uiContainer.addChild(messageText);

    // Bleeding indicator
    const bleedText = new PIXI.Text('', { fontFamily: 'monospace', fontSize: 14, fill: 0xff0000 });
    bleedText.name = 'bleedText';
    bleedText.x = 220;
    bleedText.y = 10;
    uiContainer.addChild(bleedText);
}

function updateUI() {
    if (!gameState.player) return;
    const p = gameState.player;

    // HP bar
    const hpBar = uiContainer.getChildByName('hpBar');
    hpBar.clear();
    hpBar.beginFill(0x440000);
    hpBar.drawRect(10, 10, 200, 20);
    hpBar.endFill();
    hpBar.beginFill(0xff0000);
    hpBar.drawRect(12, 12, 196 * (p.hp / p.maxHp), 16);
    hpBar.endFill();

    // Stamina bar
    const staminaBar = uiContainer.getChildByName('staminaBar');
    staminaBar.clear();
    staminaBar.beginFill(0x004400);
    staminaBar.drawRect(10, 35, 150, 12);
    staminaBar.endFill();
    staminaBar.beginFill(0x44ff44);
    staminaBar.drawRect(12, 37, 146 * (p.stamina / p.maxStamina), 8);
    staminaBar.endFill();

    // Weapon info
    const weaponText = uiContainer.getChildByName('weaponText');
    const weapon = WEAPONS[p.weapon];
    const reloadStr = p.reloading ? ' [RELOADING]' : '';
    weaponText.text = `${weapon.name}: ${p.magazine}/${p.ammo[p.weapon]}${reloadStr}`;

    // Items
    const itemsText = uiContainer.getChildByName('itemsText');
    itemsText.text = `[Q]Bandage:${p.bandages} [E]Medkit:${p.medkits}`;

    // Score
    const scoreText = uiContainer.getChildByName('scoreText');
    scoreText.text = `Score: ${gameState.score}`;

    // Extraction
    const extractText = uiContainer.getChildByName('extractText');
    if (gameState.extractionPoint && p) {
        const dist = Math.floor(Math.hypot(
            gameState.extractionPoint.x - p.x,
            gameState.extractionPoint.y - p.y
        ));
        extractText.text = `Extract: ${dist}m`;
    }

    // Message
    const messageText = uiContainer.getChildByName('messageText');
    messageText.text = gameState.message;

    // Bleeding
    const bleedText = uiContainer.getChildByName('bleedText');
    bleedText.text = p.bleeding ? 'BLEEDING!' : '';
}

// Extract
function extract() {
    gameState.state = 'extracted';
    gameState.score += gameState.lootValue;
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('zeroSievertHighScore', gameState.highScore);
    }
}

// Input
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in gameState.keys) gameState.keys[key] = true;

    if (gameState.state === 'playing' && gameState.player) {
        // Weapon switching
        if (key === '1') gameState.player.switchWeapon('pistol');
        if (key === '2') gameState.player.switchWeapon('smg');
        if (key === '3') gameState.player.switchWeapon('shotgun');
        if (key === '4') gameState.player.switchWeapon('rifle');

        // Items
        if (key === 'q') gameState.player.useBandage();

        // Loot interaction
        if (key === 'e') {
            // Check medkit first
            if (gameState.player.medkits > 0 && gameState.player.hp < gameState.player.maxHp) {
                // Don't use medkit on E, use for interaction instead
            }

            // Check nearby loot containers
            for (const container of gameState.lootContainers) {
                if (container.looted) continue;
                const dist = Math.hypot(container.x - gameState.player.x, container.y - gameState.player.y);
                if (dist < 40) {
                    container.interact(gameState.player);
                    break;
                }
            }
        }

        // Medkit on F
        if (key === 'f') gameState.player.useMedkit();
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in gameState.keys) gameState.keys[key] = false;
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
            startGame();
        } else if (gameState.state === 'extracted' || gameState.state === 'dead') {
            gameState.state = 'menu';
            renderMenu();
        }
    }
});

app.view.addEventListener('mouseup', (e) => {
    if (e.button === 0) gameState.mouse.down = false;
});

app.view.addEventListener('contextmenu', (e) => e.preventDefault());

// Start game
function startGame() {
    gameState.state = 'playing';
    gameState.score = 0;
    gameState.kills = 0;
    gameState.lootValue = 0;
    gameState.gameTime = 0;
    gameState.message = '';
    gameState.bullets = [];
    gameState.collectibles = [];
    gameState.lootContainers = [];

    entityContainer.removeChildren();

    generateMap();
    renderMap();

    // Spawn player in bottom left
    gameState.player = new Player(3 * TILE_SIZE, (MAP_HEIGHT - 3) * TILE_SIZE);

    spawnEnemies();
    createUI();

    showMessage('Reach the extraction point (green circle)! Press E to loot containers.');
}

// Menu
function renderMenu() {
    uiContainer.removeChildren();
    mapContainer.removeChildren();
    entityContainer.removeChildren();
    fogContainer.removeChildren();

    const title = new PIXI.Text('ZERO SIEVERT', {
        fontFamily: 'monospace', fontSize: 36, fill: 0x44ff44
    });
    title.x = 400;
    title.y = 120;
    title.anchor.set(0.5);
    uiContainer.addChild(title);

    const subtitle = new PIXI.Text('Extraction Shooter', {
        fontFamily: 'monospace', fontSize: 16, fill: 0xaaaaaa
    });
    subtitle.x = 400;
    subtitle.y = 165;
    subtitle.anchor.set(0.5);
    uiContainer.addChild(subtitle);

    const controls = new PIXI.Text(
        'CONTROLS:\n\n' +
        'WASD - Move    Mouse - Aim    LMB - Shoot\n' +
        'Shift - Sprint    R - Reload\n' +
        '1-4 - Switch Weapons\n' +
        'Q - Use Bandage    F - Use Medkit\n' +
        'E - Loot containers / Extract\n\n' +
        'Reach the green extraction zone!\n' +
        'Kill enemies and loot containers for score.',
        { fontFamily: 'monospace', fontSize: 12, fill: 0xcccccc, align: 'center' }
    );
    controls.x = 400;
    controls.y = 320;
    controls.anchor.set(0.5);
    uiContainer.addChild(controls);

    const highScore = new PIXI.Text(`High Score: ${gameState.highScore}`, {
        fontFamily: 'monospace', fontSize: 14, fill: 0xffff44
    });
    highScore.x = 400;
    highScore.y = 480;
    highScore.anchor.set(0.5);
    uiContainer.addChild(highScore);

    const start = new PIXI.Text('Click to Start Raid', {
        fontFamily: 'monospace', fontSize: 18, fill: 0xffffff
    });
    start.x = 400;
    start.y = 520;
    start.anchor.set(0.5);
    uiContainer.addChild(start);
}

// End screens
function renderEndScreen() {
    uiContainer.removeChildren();

    const title = new PIXI.Text(
        gameState.state === 'extracted' ? 'EXTRACTED!' : 'YOU DIED',
        { fontFamily: 'monospace', fontSize: 36, fill: gameState.state === 'extracted' ? 0x44ff44 : 0xff4444 }
    );
    title.x = 400;
    title.y = 150;
    title.anchor.set(0.5);
    uiContainer.addChild(title);

    const stats = new PIXI.Text(
        `Score: ${gameState.score}\n` +
        `Kills: ${gameState.kills}\n` +
        `Loot Value: ${gameState.lootValue}\n` +
        `Time: ${Math.floor(gameState.gameTime)}s\n\n` +
        `High Score: ${gameState.highScore}`,
        { fontFamily: 'monospace', fontSize: 16, fill: 0xffffff, align: 'center' }
    );
    stats.x = 400;
    stats.y = 280;
    stats.anchor.set(0.5);
    uiContainer.addChild(stats);

    const restart = new PIXI.Text('Click to Return to Menu', {
        fontFamily: 'monospace', fontSize: 16, fill: 0xcccccc
    });
    restart.x = 400;
    restart.y = 450;
    restart.anchor.set(0.5);
    uiContainer.addChild(restart);
}

// Main loop
app.ticker.add((delta) => {
    if (gameState.state === 'menu') return;

    if (gameState.state === 'extracted' || gameState.state === 'dead') {
        if (!gameState.endRendered) {
            renderEndScreen();
            gameState.endRendered = true;
        }
        return;
    }

    gameState.endRendered = false;

    if (gameState.state !== 'playing' || !gameState.player) return;

    const dt = delta / 60;
    gameState.gameTime += dt;

    // Message timer
    if (gameState.messageTimer > 0) {
        gameState.messageTimer -= dt;
        if (gameState.messageTimer <= 0) {
            gameState.message = '';
        }
    }

    // Player
    gameState.player.update(delta);

    // Shooting
    if (gameState.mouse.down) {
        gameState.player.shoot();
    }

    // Reload
    if (gameState.keys.r) {
        gameState.player.reload();
    }

    // Enemies
    gameState.enemies.forEach(e => {
        if (!e.dead) e.update(delta, gameState.player);
    });

    // Bullets
    updateBullets(delta);

    // Collectibles
    gameState.collectibles.forEach(c => {
        if (!c.collected) c.update(gameState.player);
    });

    // Camera
    updateCamera();

    // Render
    renderMap();
    renderFog();
    updateUI();

    // Update entity positions relative to camera
    gameState.player.sprite.x = gameState.player.x - gameState.camera.x;
    gameState.player.sprite.y = gameState.player.y - gameState.camera.y;

    gameState.enemies.forEach(e => {
        if (!e.dead) {
            e.sprite.x = e.x - gameState.camera.x;
            e.sprite.y = e.y - gameState.camera.y;
        }
    });

    gameState.lootContainers.forEach(c => {
        c.sprite.x = c.x - gameState.camera.x;
        c.sprite.y = c.y - gameState.camera.y;
        c.sprite.visible = gameState.player.canSee(c.x, c.y);
    });

    gameState.collectibles.forEach(c => {
        if (!c.collected) {
            c.sprite.x = c.x - gameState.camera.x;
            c.sprite.y = c.y - gameState.camera.y;
            c.sprite.visible = gameState.player.canSee(c.x, c.y);
        }
    });
});

// Initial menu
renderMenu();
