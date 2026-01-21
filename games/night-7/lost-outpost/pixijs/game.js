// Lost Outpost - PixiJS
// Top-down survival horror shooter

const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x000000,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
});
document.body.appendChild(app.view);

// Game constants
const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 20;

// Weapon definitions
const WEAPONS = {
    ASSAULT_RIFLE: { name: 'Assault Rifle', damage: 15, fireRate: 8, spread: 0.05, ammo: 300, magSize: 30, speed: 600 },
    SMG: { name: 'SMG', damage: 8, fireRate: 15, spread: 0.1, ammo: 400, magSize: 40, speed: 550 },
    SHOTGUN: { name: 'Shotgun', damage: 12, fireRate: 1.5, spread: 0.25, pellets: 8, ammo: 60, magSize: 8, speed: 450 },
    FLAMETHROWER: { name: 'Flamethrower', damage: 5, fireRate: 20, spread: 0.15, ammo: 200, magSize: 200, speed: 300, flame: true }
};

// Enemy definitions
const ENEMY_TYPES = {
    SCORPION: { hp: 40, speed: 80, damage: 15, size: 18, color: 0x40A040, attackRange: 30, type: 'melee' },
    SCORPION_LASER: { hp: 35, speed: 60, damage: 12, size: 18, color: 0x60C060, attackRange: 200, type: 'ranged', fireRate: 1.5 },
    ARACHNID: { hp: 80, speed: 50, damage: 25, size: 28, color: 0x20A020, attackRange: 35, type: 'melee' }
};

// Game state
const gameState = {
    phase: 'menu', // menu, playing, gameover, victory
    level: 1,
    maxLevel: 5,
    lives: 3,
    credits: 0
};

// Player state
const player = {
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    width: 24,
    height: 24,
    speed: 150,
    health: 100,
    maxHealth: 100,
    currentWeapon: 0,
    weapons: [],
    fireTimer: 0,
    reloading: false,
    reloadTimer: 0,
    invincible: 0
};

// Level data
let levelMap = [];
let enemies = [];
let bullets = [];
let pickups = [];
let keycards = 0;

// Containers
const worldContainer = new PIXI.Container();
const floorContainer = new PIXI.Container();
const entityContainer = new PIXI.Container();
const bulletContainer = new PIXI.Container();
const lightContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();
const menuContainer = new PIXI.Container();

worldContainer.addChild(floorContainer);
worldContainer.addChild(entityContainer);
worldContainer.addChild(bulletContainer);
worldContainer.addChild(lightContainer);
app.stage.addChild(worldContainer);
app.stage.addChild(uiContainer);
app.stage.addChild(menuContainer);

// Player sprite
const playerSprite = new PIXI.Graphics();
function drawPlayer() {
    playerSprite.clear();
    // Body
    playerSprite.beginFill(0x4080C0);
    playerSprite.drawCircle(0, 0, 12);
    playerSprite.endFill();
    // Helmet
    playerSprite.beginFill(0x305070);
    playerSprite.drawCircle(0, -2, 8);
    playerSprite.endFill();
    // Visor
    playerSprite.beginFill(0x80FFFF);
    playerSprite.drawEllipse(0, -3, 5, 3);
    playerSprite.endFill();
}
drawPlayer();

// Flashlight
const flashlight = new PIXI.Graphics();
function drawFlashlight(angle) {
    flashlight.clear();
    flashlight.beginFill(0xFFFF80, 0.15);
    const coneAngle = 0.5;
    const range = 250;
    flashlight.moveTo(0, 0);
    flashlight.lineTo(Math.cos(angle - coneAngle) * range, Math.sin(angle - coneAngle) * range);
    flashlight.lineTo(Math.cos(angle) * range * 1.1, Math.sin(angle) * range * 1.1);
    flashlight.lineTo(Math.cos(angle + coneAngle) * range, Math.sin(angle + coneAngle) * range);
    flashlight.closePath();
    flashlight.endFill();
}

// Darkness overlay
const darkness = new PIXI.Graphics();
function updateDarkness() {
    darkness.clear();
    darkness.beginFill(0x000000, 0.7);
    darkness.drawRect(-500, -500, MAP_WIDTH * TILE_SIZE + 1000, MAP_HEIGHT * TILE_SIZE + 1000);
    darkness.endFill();
}
lightContainer.addChild(darkness);

// Input
const keys = {};
let mouseX = 400, mouseY = 300;
let mouseDown = false;

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyR' && gameState.phase === 'playing') startReload();
    if (e.code === 'KeyQ' && gameState.phase === 'playing') cycleWeapon();
    if (e.code === 'Space' && gameState.phase === 'playing') interact();
});
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('mousemove', e => {
    const rect = app.view.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});
window.addEventListener('mousedown', e => { if (e.button === 0) mouseDown = true; });
window.addEventListener('mouseup', e => { if (e.button === 0) mouseDown = false; });

// Cycle weapon
function cycleWeapon() {
    if (player.weapons.length > 1) {
        player.currentWeapon = (player.currentWeapon + 1) % player.weapons.length;
        player.reloading = false;
    }
}

// Start reload
function startReload() {
    const weapon = player.weapons[player.currentWeapon];
    if (!weapon || player.reloading) return;
    if (weapon.currentMag >= weapon.magSize) return;
    if (weapon.totalAmmo <= 0) return;

    player.reloading = true;
    player.reloadTimer = 1.5;
}

// Finish reload
function finishReload() {
    const weapon = player.weapons[player.currentWeapon];
    if (!weapon) return;

    const needed = weapon.magSize - weapon.currentMag;
    const available = Math.min(needed, weapon.totalAmmo);
    weapon.currentMag += available;
    weapon.totalAmmo -= available;
    player.reloading = false;
}

// Interact
function interact() {
    // Check pickups
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        if (dx * dx + dy * dy < 900) {
            if (p.type === 'health') {
                player.health = Math.min(player.maxHealth, player.health + 30);
            } else if (p.type === 'ammo') {
                player.weapons.forEach(w => w.totalAmmo += 50);
            } else if (p.type === 'keycard') {
                keycards++;
            } else if (p.type === 'weapon') {
                const newWeapon = { ...WEAPONS[p.weapon], currentMag: WEAPONS[p.weapon].magSize, totalAmmo: WEAPONS[p.weapon].ammo };
                player.weapons.push(newWeapon);
            }
            entityContainer.removeChild(p.sprite);
            pickups.splice(i, 1);
        }
    }
}

// Generate level
function generateLevel(levelNum) {
    levelMap = [];
    enemies = [];
    bullets = [];
    pickups = [];
    keycards = 0;

    // Clear containers
    floorContainer.removeChildren();
    entityContainer.removeChildren();
    bulletContainer.removeChildren();

    // Re-add player
    entityContainer.addChild(playerSprite);
    entityContainer.addChild(flashlight);

    // Generate map
    for (let y = 0; y < MAP_HEIGHT; y++) {
        levelMap[y] = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            // Walls on edges and random interior
            if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
                levelMap[y][x] = 1; // Wall
            } else if (Math.random() < 0.15) {
                levelMap[y][x] = 1; // Interior wall
            } else {
                levelMap[y][x] = 0; // Floor
            }
        }
    }

    // Carve corridors
    for (let i = 0; i < 5; i++) {
        const startX = 2 + Math.floor(Math.random() * (MAP_WIDTH - 4));
        const startY = 2 + Math.floor(Math.random() * (MAP_HEIGHT - 4));
        const dir = Math.random() < 0.5 ? 'h' : 'v';
        const length = 5 + Math.floor(Math.random() * 10);

        for (let j = 0; j < length; j++) {
            const x = dir === 'h' ? Math.min(MAP_WIDTH - 2, startX + j) : startX;
            const y = dir === 'v' ? Math.min(MAP_HEIGHT - 2, startY + j) : startY;
            if (x > 0 && x < MAP_WIDTH - 1 && y > 0 && y < MAP_HEIGHT - 1) {
                levelMap[y][x] = 0;
                if (Math.random() < 0.3) {
                    levelMap[y][Math.min(MAP_WIDTH - 2, x + 1)] = 0;
                }
            }
        }
    }

    // Clear spawn area
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            const y = Math.floor(MAP_HEIGHT / 2) + dy;
            const x = 3 + dx;
            if (y > 0 && y < MAP_HEIGHT - 1 && x > 0 && x < MAP_WIDTH - 1) {
                levelMap[y][x] = 0;
            }
        }
    }

    // Draw tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = new PIXI.Graphics();
            tile.x = x * TILE_SIZE;
            tile.y = y * TILE_SIZE;

            if (levelMap[y][x] === 1) {
                // Wall
                tile.beginFill(0x303840);
                tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
                tile.endFill();
                tile.lineStyle(1, 0x404850);
                tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
            } else {
                // Floor - industrial grating
                tile.beginFill(0x202428);
                tile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
                tile.endFill();
                tile.lineStyle(1, 0x181A1E);
                tile.moveTo(0, TILE_SIZE / 2);
                tile.lineTo(TILE_SIZE, TILE_SIZE / 2);
                tile.moveTo(TILE_SIZE / 2, 0);
                tile.lineTo(TILE_SIZE / 2, TILE_SIZE);
            }
            floorContainer.addChild(tile);
        }
    }

    // Add exit
    const exitX = MAP_WIDTH - 3;
    const exitY = Math.floor(MAP_HEIGHT / 2);
    levelMap[exitY][exitX] = 2; // Exit
    const exitTile = new PIXI.Graphics();
    exitTile.x = exitX * TILE_SIZE;
    exitTile.y = exitY * TILE_SIZE;
    exitTile.beginFill(0x40C040);
    exitTile.drawRect(0, 0, TILE_SIZE, TILE_SIZE);
    exitTile.endFill();
    floorContainer.addChild(exitTile);

    // Spawn enemies based on level
    const enemyCount = 5 + levelNum * 3;
    const types = Object.keys(ENEMY_TYPES);
    const availableTypes = types.slice(0, Math.min(types.length, levelNum));

    for (let i = 0; i < enemyCount; i++) {
        let ex, ey;
        do {
            ex = 8 + Math.floor(Math.random() * (MAP_WIDTH - 10));
            ey = 2 + Math.floor(Math.random() * (MAP_HEIGHT - 4));
        } while (levelMap[ey][ex] !== 0);

        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        spawnEnemy(type, ex * TILE_SIZE + TILE_SIZE / 2, ey * TILE_SIZE + TILE_SIZE / 2);
    }

    // Spawn boss on level 5
    if (levelNum === 5) {
        spawnBoss(MAP_WIDTH * TILE_SIZE - 150, MAP_HEIGHT * TILE_SIZE / 2);
    }

    // Spawn pickups
    spawnPickup('health', 5 * TILE_SIZE, 5 * TILE_SIZE);
    spawnPickup('ammo', 10 * TILE_SIZE, MAP_HEIGHT * TILE_SIZE - 100);

    // Spawn new weapon
    if (levelNum === 2) {
        spawnWeaponPickup('SMG', 15 * TILE_SIZE, 5 * TILE_SIZE);
    } else if (levelNum === 3) {
        spawnWeaponPickup('SHOTGUN', 15 * TILE_SIZE, 5 * TILE_SIZE);
    } else if (levelNum === 4) {
        spawnWeaponPickup('FLAMETHROWER', 15 * TILE_SIZE, 5 * TILE_SIZE);
    }

    // Keycard
    spawnPickup('keycard', (MAP_WIDTH - 5) * TILE_SIZE, 3 * TILE_SIZE);

    // Player start position
    player.x = 4 * TILE_SIZE;
    player.y = MAP_HEIGHT * TILE_SIZE / 2;
    player.health = player.maxHealth;
}

// Spawn enemy
function spawnEnemy(type, x, y) {
    const template = ENEMY_TYPES[type];
    const enemy = {
        type,
        x, y,
        vx: 0, vy: 0,
        health: template.hp * (1 + (gameState.level - 1) * 0.1),
        maxHealth: template.hp * (1 + (gameState.level - 1) * 0.1),
        speed: template.speed,
        damage: template.damage,
        size: template.size,
        color: template.color,
        attackRange: template.attackRange,
        attackType: template.type,
        fireRate: template.fireRate || 0,
        fireTimer: 0,
        sprite: new PIXI.Graphics(),
        detected: false
    };

    drawEnemy(enemy);
    entityContainer.addChild(enemy.sprite);
    enemies.push(enemy);
}

function drawEnemy(enemy) {
    enemy.sprite.clear();
    const s = enemy.size;

    // Body - alien insect
    enemy.sprite.beginFill(enemy.color);
    // Main body
    enemy.sprite.drawEllipse(0, 0, s * 0.6, s * 0.4);
    // Head
    enemy.sprite.drawCircle(s * 0.5, 0, s * 0.3);
    enemy.sprite.endFill();

    // Legs
    enemy.sprite.lineStyle(2, enemy.color);
    for (let i = -1; i <= 1; i++) {
        enemy.sprite.moveTo(i * s * 0.3, s * 0.3);
        enemy.sprite.lineTo(i * s * 0.5, s * 0.6);
        enemy.sprite.moveTo(i * s * 0.3, -s * 0.3);
        enemy.sprite.lineTo(i * s * 0.5, -s * 0.6);
    }

    // Eyes - red glow
    enemy.sprite.beginFill(0xFF0000);
    enemy.sprite.drawCircle(s * 0.6, -s * 0.1, 3);
    enemy.sprite.drawCircle(s * 0.6, s * 0.1, 3);
    enemy.sprite.endFill();

    enemy.sprite.x = enemy.x;
    enemy.sprite.y = enemy.y;
}

// Spawn boss
function spawnBoss(x, y) {
    const boss = {
        type: 'HIVE_COMMANDER',
        isBoss: true,
        x, y,
        vx: 0, vy: 0,
        health: 500,
        maxHealth: 500,
        speed: 40,
        damage: 40,
        size: 50,
        color: 0x80FF40,
        attackRange: 60,
        attackType: 'melee',
        fireTimer: 0,
        sprite: new PIXI.Graphics(),
        phase: 1,
        spawnTimer: 0
    };

    drawBoss(boss);
    entityContainer.addChild(boss.sprite);
    enemies.push(boss);
}

function drawBoss(boss) {
    boss.sprite.clear();
    const s = boss.size;

    // Massive body
    boss.sprite.beginFill(boss.color);
    boss.sprite.drawEllipse(0, 0, s, s * 0.7);
    boss.sprite.endFill();

    // Armored plates
    boss.sprite.beginFill(0x406020);
    boss.sprite.drawEllipse(-s * 0.3, 0, s * 0.3, s * 0.4);
    boss.sprite.drawEllipse(s * 0.3, 0, s * 0.3, s * 0.4);
    boss.sprite.endFill();

    // Head
    boss.sprite.beginFill(boss.color);
    boss.sprite.drawCircle(s * 0.8, 0, s * 0.35);
    boss.sprite.endFill();

    // Mandibles
    boss.sprite.beginFill(0xC0FF60);
    boss.sprite.moveTo(s * 1.1, -s * 0.2);
    boss.sprite.lineTo(s * 1.4, -s * 0.1);
    boss.sprite.lineTo(s * 1.1, 0);
    boss.sprite.closePath();
    boss.sprite.moveTo(s * 1.1, s * 0.2);
    boss.sprite.lineTo(s * 1.4, s * 0.1);
    boss.sprite.lineTo(s * 1.1, 0);
    boss.sprite.closePath();
    boss.sprite.endFill();

    // Eyes
    boss.sprite.beginFill(0xFF0000);
    boss.sprite.drawCircle(s * 0.9, -s * 0.15, 6);
    boss.sprite.drawCircle(s * 0.9, s * 0.15, 6);
    boss.sprite.endFill();

    boss.sprite.x = boss.x;
    boss.sprite.y = boss.y;
}

// Spawn pickup
function spawnPickup(type, x, y) {
    const pickup = {
        type,
        x, y,
        sprite: new PIXI.Graphics()
    };

    pickup.sprite.x = x;
    pickup.sprite.y = y;

    if (type === 'health') {
        pickup.sprite.beginFill(0xFF4040);
        pickup.sprite.drawRect(-8, -3, 16, 6);
        pickup.sprite.drawRect(-3, -8, 6, 16);
        pickup.sprite.endFill();
    } else if (type === 'ammo') {
        pickup.sprite.beginFill(0xFFAA00);
        pickup.sprite.drawRect(-6, -10, 12, 20);
        pickup.sprite.endFill();
        pickup.sprite.beginFill(0xCC8800);
        pickup.sprite.drawRect(-4, -8, 8, 6);
        pickup.sprite.endFill();
    } else if (type === 'keycard') {
        pickup.sprite.beginFill(0x00AAFF);
        pickup.sprite.drawRoundedRect(-12, -8, 24, 16, 3);
        pickup.sprite.endFill();
        pickup.sprite.beginFill(0xFFFFFF);
        pickup.sprite.drawRect(6, -4, 4, 8);
        pickup.sprite.endFill();
    }

    entityContainer.addChild(pickup.sprite);
    pickups.push(pickup);
}

// Spawn weapon pickup
function spawnWeaponPickup(weaponName, x, y) {
    const pickup = {
        type: 'weapon',
        weapon: weaponName,
        x, y,
        sprite: new PIXI.Graphics()
    };

    pickup.sprite.x = x;
    pickup.sprite.y = y;
    pickup.sprite.beginFill(0x8080FF);
    pickup.sprite.drawRect(-15, -5, 30, 10);
    pickup.sprite.endFill();
    pickup.sprite.beginFill(0x6060DD);
    pickup.sprite.drawRect(-5, -8, 10, 6);
    pickup.sprite.endFill();

    entityContainer.addChild(pickup.sprite);
    pickups.push(pickup);
}

// Fire bullet
function fireBullet() {
    if (player.weapons.length === 0) return;
    const weapon = player.weapons[player.currentWeapon];
    if (!weapon || weapon.currentMag <= 0 || player.reloading) return;

    const worldMouseX = mouseX - worldContainer.x;
    const worldMouseY = mouseY - worldContainer.y;
    const angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
    const pellets = weapon.pellets || 1;

    for (let i = 0; i < pellets; i++) {
        const spread = (Math.random() - 0.5) * weapon.spread * 2;
        const bulletAngle = angle + spread;

        const bullet = {
            x: player.x,
            y: player.y,
            vx: Math.cos(bulletAngle) * weapon.speed,
            vy: Math.sin(bulletAngle) * weapon.speed,
            damage: weapon.damage,
            isFlame: weapon.flame,
            owner: 'player',
            sprite: new PIXI.Graphics()
        };

        if (weapon.flame) {
            bullet.sprite.beginFill(0xFF6600, 0.8);
            bullet.sprite.drawCircle(0, 0, 6 + Math.random() * 4);
            bullet.sprite.endFill();
        } else {
            bullet.sprite.beginFill(0xFFFF00);
            bullet.sprite.drawCircle(0, 0, 3);
            bullet.sprite.endFill();
        }

        bullet.sprite.x = bullet.x;
        bullet.sprite.y = bullet.y;
        bulletContainer.addChild(bullet.sprite);
        bullets.push(bullet);
    }

    weapon.currentMag--;
    if (weapon.currentMag <= 0 && weapon.totalAmmo > 0) {
        startReload();
    }
}

// Fire enemy bullet
function fireEnemyBullet(enemy, angle) {
    const bullet = {
        x: enemy.x,
        y: enemy.y,
        vx: Math.cos(angle) * 250,
        vy: Math.sin(angle) * 250,
        damage: enemy.damage,
        owner: 'enemy',
        sprite: new PIXI.Graphics()
    };

    bullet.sprite.beginFill(0x00FF00);
    bullet.sprite.drawCircle(0, 0, 4);
    bullet.sprite.endFill();

    bullet.sprite.x = bullet.x;
    bullet.sprite.y = bullet.y;
    bulletContainer.addChild(bullet.sprite);
    bullets.push(bullet);
}

// Check wall collision
function isWall(x, y) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return true;
    return levelMap[ty][tx] === 1;
}

// Update player
function updatePlayer(delta) {
    const dt = delta / 60;

    // Invincibility
    if (player.invincible > 0) player.invincible -= dt;

    // Reload
    if (player.reloading) {
        player.reloadTimer -= dt;
        if (player.reloadTimer <= 0) {
            finishReload();
        }
    }

    // Fire timer
    if (player.fireTimer > 0) player.fireTimer -= dt;

    // Movement
    let dx = 0, dy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
    if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
    if (keys['KeyD'] || keys['ArrowRight']) dx = 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
    }

    const newX = player.x + dx * player.speed * dt;
    const newY = player.y + dy * player.speed * dt;

    if (!isWall(newX - 10, player.y) && !isWall(newX + 10, player.y)) {
        player.x = newX;
    }
    if (!isWall(player.x, newY - 10) && !isWall(player.x, newY + 10)) {
        player.y = newY;
    }

    // Shooting
    if (mouseDown && player.fireTimer <= 0 && player.weapons.length > 0) {
        const weapon = player.weapons[player.currentWeapon];
        if (weapon && weapon.currentMag > 0 && !player.reloading) {
            fireBullet();
            player.fireTimer = 1 / weapon.fireRate;
        }
    }

    // Update sprite
    playerSprite.x = player.x;
    playerSprite.y = player.y;
    playerSprite.alpha = player.invincible > 0 ? 0.5 : 1;

    // Update flashlight
    const worldMouseX = mouseX - worldContainer.x;
    const worldMouseY = mouseY - worldContainer.y;
    const angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
    flashlight.x = player.x;
    flashlight.y = player.y;
    drawFlashlight(angle);

    // Check exit
    const tx = Math.floor(player.x / TILE_SIZE);
    const ty = Math.floor(player.y / TILE_SIZE);
    if (levelMap[ty] && levelMap[ty][tx] === 2 && keycards > 0 && enemies.filter(e => e.isBoss).length === 0) {
        nextLevel();
    }
}

// Update enemies
function updateEnemies(delta) {
    const dt = delta / 60;

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Check if in flashlight cone (detection)
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 300) {
            enemy.detected = true;
        }

        if (enemy.detected && dist > 30) {
            // Move toward player
            const nx = dx / dist;
            const ny = dy / dist;

            const newX = enemy.x + nx * enemy.speed * dt;
            const newY = enemy.y + ny * enemy.speed * dt;

            if (!isWall(newX, enemy.y)) enemy.x = newX;
            if (!isWall(enemy.x, newY)) enemy.y = newY;
        }

        // Attack
        if (enemy.attackType === 'ranged' && dist < enemy.attackRange && enemy.detected) {
            enemy.fireTimer -= dt;
            if (enemy.fireTimer <= 0) {
                const angle = Math.atan2(dy, dx);
                fireEnemyBullet(enemy, angle);
                enemy.fireTimer = 1 / enemy.fireRate;
            }
        } else if (enemy.attackType === 'melee' && dist < enemy.attackRange) {
            if (player.invincible <= 0) {
                player.health -= enemy.damage * dt;
                if (player.health <= 0) {
                    playerDied();
                }
            }
        }

        // Boss spawning
        if (enemy.isBoss) {
            enemy.spawnTimer -= dt;
            if (enemy.spawnTimer <= 0 && enemies.length < 15) {
                // Spawn minion
                spawnEnemy('SCORPION', enemy.x + (Math.random() - 0.5) * 100, enemy.y + (Math.random() - 0.5) * 100);
                enemy.spawnTimer = 10;
            }
        }

        // Check death
        if (enemy.health <= 0) {
            entityContainer.removeChild(enemy.sprite);
            enemies.splice(i, 1);
            gameState.credits += enemy.isBoss ? 500 : 50;

            // Boss killed - level complete
            if (enemy.isBoss && gameState.level === 5) {
                showVictory();
            }
            continue;
        }

        // Update sprite
        enemy.sprite.x = enemy.x;
        enemy.sprite.y = enemy.y;

        // Face player
        if (enemy.detected) {
            enemy.sprite.rotation = Math.atan2(dy, dx);
        }
    }
}

// Update bullets
function updateBullets(delta) {
    const dt = delta / 60;

    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.sprite.x = bullet.x;
        bullet.sprite.y = bullet.y;

        // Wall collision
        if (isWall(bullet.x, bullet.y)) {
            bulletContainer.removeChild(bullet.sprite);
            bullets.splice(i, 1);
            continue;
        }

        // Hit detection
        if (bullet.owner === 'player') {
            for (const enemy of enemies) {
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                if (dx * dx + dy * dy < enemy.size * enemy.size) {
                    enemy.health -= bullet.damage;
                    if (!bullet.isFlame) {
                        bulletContainer.removeChild(bullet.sprite);
                        bullets.splice(i, 1);
                    }
                    break;
                }
            }
        } else if (bullet.owner === 'enemy') {
            const dx = bullet.x - player.x;
            const dy = bullet.y - player.y;
            if (dx * dx + dy * dy < 144 && player.invincible <= 0) {
                player.health -= bullet.damage;
                bulletContainer.removeChild(bullet.sprite);
                bullets.splice(i, 1);
                if (player.health <= 0) {
                    playerDied();
                }
                continue;
            }
        }

        // Flame decay
        if (bullet.isFlame) {
            bullet.sprite.alpha -= dt * 2;
            if (bullet.sprite.alpha <= 0) {
                bulletContainer.removeChild(bullet.sprite);
                bullets.splice(i, 1);
            }
        }

        // Out of bounds
        if (bullet.x < 0 || bullet.x > MAP_WIDTH * TILE_SIZE || bullet.y < 0 || bullet.y > MAP_HEIGHT * TILE_SIZE) {
            bulletContainer.removeChild(bullet.sprite);
            bullets.splice(i, 1);
        }
    }
}

// Player died
function playerDied() {
    gameState.lives--;
    if (gameState.lives <= 0) {
        showGameOver();
    } else {
        // Respawn
        player.health = player.maxHealth;
        player.x = 4 * TILE_SIZE;
        player.y = MAP_HEIGHT * TILE_SIZE / 2;
        player.invincible = 2;
    }
}

// Next level
function nextLevel() {
    gameState.level++;
    if (gameState.level > gameState.maxLevel) {
        showVictory();
    } else {
        gameState.lives = 3;
        generateLevel(gameState.level);
    }
}

// Camera
function updateCamera() {
    worldContainer.x = app.screen.width / 2 - player.x;
    worldContainer.y = app.screen.height / 2 - player.y;
    updateDarkness();
}

// UI
const uiElements = {};

function createUI() {
    // Top bar
    const topBar = new PIXI.Graphics();
    topBar.beginFill(0x000000, 0.8);
    topBar.drawRect(0, 0, 800, 40);
    topBar.endFill();
    uiContainer.addChild(topBar);

    // Lives
    uiElements.lives = new PIXI.Text('Lives: 3', { fontSize: 16, fill: 0xFF4040 });
    uiElements.lives.x = 20;
    uiElements.lives.y = 10;
    uiContainer.addChild(uiElements.lives);

    // Level
    uiElements.level = new PIXI.Text('Level: 1', { fontSize: 16, fill: 0xFFFFFF });
    uiElements.level.x = 150;
    uiElements.level.y = 10;
    uiContainer.addChild(uiElements.level);

    // Credits
    uiElements.credits = new PIXI.Text('Credits: 0', { fontSize: 16, fill: 0xFFFF00 });
    uiElements.credits.x = 300;
    uiElements.credits.y = 10;
    uiContainer.addChild(uiElements.credits);

    // Keycards
    uiElements.keycards = new PIXI.Text('Keycard: No', { fontSize: 16, fill: 0x00AAFF });
    uiElements.keycards.x = 450;
    uiElements.keycards.y = 10;
    uiContainer.addChild(uiElements.keycards);

    // Bottom bar
    const bottomBar = new PIXI.Graphics();
    bottomBar.beginFill(0x000000, 0.8);
    bottomBar.drawRect(0, 560, 800, 40);
    bottomBar.endFill();
    uiContainer.addChild(bottomBar);

    // Health bar
    uiElements.healthBar = new PIXI.Graphics();
    uiElements.healthBar.x = 20;
    uiElements.healthBar.y = 570;
    uiContainer.addChild(uiElements.healthBar);

    // Weapon info
    uiElements.weapon = new PIXI.Text('Assault Rifle', { fontSize: 14, fill: 0xFFFFFF });
    uiElements.weapon.x = 250;
    uiElements.weapon.y = 572;
    uiContainer.addChild(uiElements.weapon);

    // Ammo
    uiElements.ammo = new PIXI.Text('30 | 300', { fontSize: 14, fill: 0xFFAA00 });
    uiElements.ammo.x = 500;
    uiElements.ammo.y = 572;
    uiContainer.addChild(uiElements.ammo);

    // Controls hint
    uiElements.controls = new PIXI.Text('[WASD] Move | [Click] Shoot | [R] Reload | [Q] Switch | [Space] Interact', {
        fontSize: 12, fill: 0x808080
    });
    uiElements.controls.x = 200;
    uiElements.controls.y = 590;
    uiContainer.addChild(uiElements.controls);
}

function updateUI() {
    uiElements.lives.text = `Lives: ${gameState.lives}`;
    uiElements.level.text = `Level: ${gameState.level}`;
    uiElements.credits.text = `Credits: ${gameState.credits}`;
    uiElements.keycards.text = `Keycard: ${keycards > 0 ? 'Yes' : 'No'}`;

    // Health bar
    uiElements.healthBar.clear();
    uiElements.healthBar.beginFill(0x400000);
    uiElements.healthBar.drawRect(0, 0, 200, 16);
    uiElements.healthBar.endFill();
    uiElements.healthBar.beginFill(0x40FF40);
    uiElements.healthBar.drawRect(0, 0, (player.health / player.maxHealth) * 200, 16);
    uiElements.healthBar.endFill();

    // Weapon
    if (player.weapons.length > 0) {
        const weapon = player.weapons[player.currentWeapon];
        uiElements.weapon.text = weapon.name + (player.reloading ? ' (Reloading...)' : '');
        uiElements.ammo.text = `${weapon.currentMag} | ${weapon.totalAmmo}`;
    }
}

// Menu
function createMenu() {
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.95);
    bg.drawRect(0, 0, 800, 600);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('LOST OUTPOST', { fontSize: 56, fill: 0x40FF40, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = 400;
    title.y = 150;
    menuContainer.addChild(title);

    const subtitle = new PIXI.Text('Survival Horror Shooter', { fontSize: 24, fill: 0x20A020 });
    subtitle.anchor.set(0.5);
    subtitle.x = 400;
    subtitle.y = 210;
    menuContainer.addChild(subtitle);

    const controls = new PIXI.Text(
        'WASD - Move\n' +
        'Mouse - Aim\n' +
        'Left Click - Shoot\n' +
        'R - Reload\n' +
        'Q - Switch Weapon\n' +
        'Space - Interact / Pick up\n\n' +
        'Find the keycard and reach the exit!\n' +
        'Survive 5 levels and defeat the Hive Commander!',
        { fontSize: 16, fill: 0xA0A0A0, align: 'center', lineHeight: 22 }
    );
    controls.anchor.set(0.5);
    controls.x = 400;
    controls.y = 380;
    menuContainer.addChild(controls);

    const start = new PIXI.Text('[ Click to Enter the Outpost ]', { fontSize: 28, fill: 0x40FF40 });
    start.anchor.set(0.5);
    start.x = 400;
    start.y = 530;
    start.eventMode = 'static';
    start.cursor = 'pointer';
    start.on('pointerdown', startGame);
    menuContainer.addChild(start);
}

function startGame() {
    gameState.phase = 'playing';
    gameState.level = 1;
    gameState.lives = 3;
    gameState.credits = 0;

    player.health = player.maxHealth;
    player.weapons = [{ ...WEAPONS.ASSAULT_RIFLE, currentMag: 30, totalAmmo: 300 }];
    player.currentWeapon = 0;

    generateLevel(1);
    menuContainer.visible = false;
}

function showGameOver() {
    gameState.phase = 'gameover';
    menuContainer.visible = true;
    menuContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x200000, 0.95);
    bg.drawRect(0, 0, 800, 600);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('MISSION FAILED', { fontSize: 56, fill: 0xFF4040, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = 400;
    title.y = 250;
    menuContainer.addChild(title);

    const stats = new PIXI.Text(`Level Reached: ${gameState.level}\nCredits: ${gameState.credits}`, {
        fontSize: 24, fill: 0xFFFFFF, align: 'center'
    });
    stats.anchor.set(0.5);
    stats.x = 400;
    stats.y = 350;
    menuContainer.addChild(stats);

    const restart = new PIXI.Text('[ Click to Try Again ]', { fontSize: 28, fill: 0xFF8080 });
    restart.anchor.set(0.5);
    restart.x = 400;
    restart.y = 450;
    restart.eventMode = 'static';
    restart.cursor = 'pointer';
    restart.on('pointerdown', () => {
        menuContainer.removeChildren();
        createMenu();
        menuContainer.visible = true;
    });
    menuContainer.addChild(restart);
}

function showVictory() {
    gameState.phase = 'victory';
    menuContainer.visible = true;
    menuContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x002000, 0.95);
    bg.drawRect(0, 0, 800, 600);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('MISSION COMPLETE', { fontSize: 56, fill: 0x40FF40, fontWeight: 'bold' });
    title.anchor.set(0.5);
    title.x = 400;
    title.y = 200;
    menuContainer.addChild(title);

    const subtitle = new PIXI.Text('The Hive Commander is destroyed!', { fontSize: 24, fill: 0x80FF80 });
    subtitle.anchor.set(0.5);
    subtitle.x = 400;
    subtitle.y = 270;
    menuContainer.addChild(subtitle);

    const stats = new PIXI.Text(`Total Credits: ${gameState.credits}`, {
        fontSize: 24, fill: 0xFFFFFF
    });
    stats.anchor.set(0.5);
    stats.x = 400;
    stats.y = 350;
    menuContainer.addChild(stats);

    const restart = new PIXI.Text('[ Click to Play Again ]', { fontSize: 28, fill: 0x80FF80 });
    restart.anchor.set(0.5);
    restart.x = 400;
    restart.y = 450;
    restart.eventMode = 'static';
    restart.cursor = 'pointer';
    restart.on('pointerdown', () => {
        menuContainer.removeChildren();
        createMenu();
        menuContainer.visible = true;
    });
    menuContainer.addChild(restart);
}

// Initialize
createUI();
createMenu();

// Game loop
app.ticker.add((delta) => {
    if (gameState.phase !== 'playing') return;

    updatePlayer(delta);
    updateEnemies(delta);
    updateBullets(delta);
    updateCamera();
    updateUI();
});

console.log('Lost Outpost loaded!');
