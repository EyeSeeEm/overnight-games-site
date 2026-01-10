// Starscape Clone - Canvas 2D
// Space combat mining game with inertia-based movement

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1280;
const HEIGHT = 720;

// Sprite loading
const sprites = {};
const SPRITE_PATH = '/workspace/sprites/kenney-shmup/';

function loadSprite(name, path) {
    const img = new Image();
    img.src = path;
    sprites[name] = img;
    return img;
}

// Load all sprites
const spriteList = [
    ['playerShip', SPRITE_PATH + 'Ships/ship_0000.png'],
    ['enemyFighter', SPRITE_PATH + 'Ships/ship_0005.png'],
    ['enemyDrone', SPRITE_PATH + 'Ships/ship_0003.png'],
    ['enemyHeavy', SPRITE_PATH + 'Ships/ship_0007.png'],
    ['bullet', SPRITE_PATH + 'Tiles/tile_0000.png'],
    ['enemyBullet', SPRITE_PATH + 'Tiles/tile_0004.png'],
    ['asteroid1', SPRITE_PATH + 'Tiles/tile_0064.png'],
    ['asteroid2', SPRITE_PATH + 'Tiles/tile_0065.png'],
    ['mineralGreen', SPRITE_PATH + 'Tiles/tile_0040.png'],
    ['mineralYellow', SPRITE_PATH + 'Tiles/tile_0041.png'],
    ['mineralPurple', SPRITE_PATH + 'Tiles/tile_0043.png'],
    ['station', SPRITE_PATH + 'Tiles/tile_0088.png']
];

let spritesLoaded = 0;
spriteList.forEach(([name, path]) => {
    const img = loadSprite(name, path);
    img.onload = () => spritesLoaded++;
});

// Colors from GDD
const COLORS = {
    playerShip: '#4A90D9',
    playerShield: '#00BFFF',
    aegisHull: '#708090',
    aegisShield: '#4169E1',
    archnidBase: '#8B0000',
    archnidGlow: '#FF4500',
    blasterCyan: '#00FFFF',
    missileRed: '#FF6347',
    greenMineral: '#32CD32',
    yellowMineral: '#FFD700',
    purpleMineral: '#9400D3',
    hpBar: '#FF4444',
    shieldBar: '#4444FF',
    energyBar: '#44FF44',
    asteroid: '#8B7355',
    nebulaBlue: '#1E3A5F',
    gravityBeam: '#00FF88'
};

// Physics constants
const PHYSICS = {
    thrustForce: 300,
    maxSpeed: 350,
    drag: 0.985,
    rotationSpeed: 4
};

// Game state
let gameState = 'title'; // title, playing, gameover, victory
let score = 0;
let wave = 1;
let waveTimer = 0;
let waveDelay = 5;
let enemiesInWave = 0;
let waveCleared = true;

// Input state
const keys = {};
let mouseX = WIDTH / 2;
let mouseY = HEIGHT / 2;
let mouseDown = false;

// Stars background (more stars for larger canvas)
const stars = [];
for (let i = 0; i < 300; i++) {
    stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        size: Math.random() * 2.5 + 0.5,
        brightness: Math.random() * 0.6 + 0.4
    });
}

// Player ship
const player = {
    x: WIDTH / 2,
    y: HEIGHT / 2 + 150,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    hp: 75,
    maxHp: 75,
    shield: 60,
    maxShield: 60,
    shieldRecharge: 5,
    energy: 35,
    maxEnergy: 35,
    fireTimer: 0,
    fireRate: 5,
    damage: 12,
    gravityBeamActive: false,
    size: 18,
    shieldFlash: 0,
    // New features
    missileAmmo: 5,
    maxMissiles: 10,
    missileTimer: 0,
    comboCount: 0,
    comboTimer: 0,
    powerups: {
        rapidFire: 0,
        damageBoost: 0,
        speedBoost: 0
    }
};

// Screen effects
let screenShake = 0;
let hitStop = 0;

// Floating texts (damage numbers, combos)
let floatingTexts = [];

// Powerups
let powerups = [];

// Missiles
let missiles = [];

// Powerup types
const POWERUP_TYPES = {
    rapidFire: { color: '#FF4400', duration: 10, label: 'RAPID FIRE' },
    damageBoost: { color: '#FF00FF', duration: 8, label: 'DAMAGE+' },
    speedBoost: { color: '#00FF00', duration: 12, label: 'SPEED+' },
    missileAmmo: { color: '#FF6347', duration: 0, label: '+3 MISSILES' },
    shield: { color: '#4444FF', duration: 0, label: 'SHIELD+' },
    repair: { color: '#44FF44', duration: 0, label: 'REPAIR' }
};

// Aegis station
const aegis = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    hp: 500,
    maxHp: 500,
    shield: 200,
    maxShield: 200,
    shieldRecharge: 10,
    size: 50,
    shieldFlash: 0,
    turretAngle: 0,
    turretFireTimer: 0
};

// Resources
const resources = {
    green: 50,
    yellow: 30,
    purple: 10
};

// Entity arrays
let projectiles = [];
let enemies = [];
let asteroids = [];
let minerals = [];
let particles = [];

// Initialize asteroids
function spawnAsteroids(count) {
    for (let i = 0; i < count; i++) {
        let x, y;
        do {
            x = Math.random() * (WIDTH - 100) + 50;
            y = Math.random() * (HEIGHT - 100) + 50;
        } while (distance(x, y, aegis.x, aegis.y) < 150);

        const size = ['small', 'medium', 'large'][Math.floor(Math.random() * 3)];
        const sizeMap = { small: 20, medium: 35, large: 50 };
        const hpMap = { small: 20, medium: 50, large: 100 };

        asteroids.push({
            x, y,
            size: sizeMap[size],
            hp: hpMap[size],
            maxHp: hpMap[size],
            sizeType: size,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.02,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20
        });
    }
}

// Spawn enemy
function spawnEnemy(type = 'fighter') {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch (side) {
        case 0: x = Math.random() * WIDTH; y = -30; break;
        case 1: x = WIDTH + 30; y = Math.random() * HEIGHT; break;
        case 2: x = Math.random() * WIDTH; y = HEIGHT + 30; break;
        case 3: x = -30; y = Math.random() * HEIGHT; break;
    }

    const types = {
        drone: { hp: 15, damage: 5, speed: 250, fireRate: 2, size: 12, score: 10 },
        fighter: { hp: 40, damage: 10, speed: 180, fireRate: 2.5, size: 18, score: 50 },
        heavy: { hp: 80, damage: 15, speed: 120, fireRate: 1.5, size: 24, score: 100, shield: 30 },
        bomber: { hp: 60, damage: 25, speed: 100, fireRate: 0.8, size: 22, score: 150 }
    };

    const config = types[type] || types.fighter;

    enemies.push({
        x, y,
        vx: 0, vy: 0,
        angle: 0,
        ...config,
        maxHp: config.hp,
        maxShield: config.shield || 0,
        type,
        fireTimer: Math.random() * 2
    });
}

// Spawn wave
function spawnWave() {
    const enemyCount = 3 + wave * 2;
    enemiesInWave = enemyCount;

    for (let i = 0; i < enemyCount; i++) {
        setTimeout(() => {
            if (gameState === 'playing') {
                const roll = Math.random();
                if (wave >= 5 && roll < 0.15) {
                    spawnEnemy('bomber');
                } else if (wave >= 3 && roll < 0.35) {
                    spawnEnemy('heavy');
                } else if (roll < 0.5) {
                    spawnEnemy('drone');
                } else {
                    spawnEnemy('fighter');
                }
            }
        }, i * 500);
    }
    waveCleared = false;

    // Announce wave
    spawnFloatingText(WIDTH / 2, HEIGHT / 2 - 150, `WAVE ${wave}`, '#FFFF00', 32);
}

// Distance helper
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Angle between two points
function angleTo(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

// Create particle
function createParticle(x, y, color, count = 5, speed = 100) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vel = Math.random() * speed + speed * 0.5;
        particles.push({
            x, y,
            vx: Math.cos(angle) * vel,
            vy: Math.sin(angle) * vel,
            life: 1,
            decay: Math.random() * 0.02 + 0.02,
            color,
            size: Math.random() * 4 + 2
        });
    }
}

// Drop minerals from asteroid
function dropMinerals(asteroid) {
    const dropCounts = { small: [3, 6], medium: [8, 15], large: [20, 30] };
    const [min, max] = dropCounts[asteroid.sizeType];
    const count = Math.floor(Math.random() * (max - min + 1)) + min;

    for (let i = 0; i < count; i++) {
        const roll = Math.random();
        let mineralType, color;
        if (roll < 0.5) {
            mineralType = 'green'; color = COLORS.greenMineral;
        } else if (roll < 0.85) {
            mineralType = 'yellow'; color = COLORS.yellowMineral;
        } else {
            mineralType = 'purple'; color = COLORS.purpleMineral;
        }

        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * asteroid.size;
        minerals.push({
            x: asteroid.x + Math.cos(angle) * dist,
            y: asteroid.y + Math.sin(angle) * dist,
            vx: Math.cos(angle) * 30,
            vy: Math.sin(angle) * 30,
            type: mineralType,
            color,
            size: 6,
            life: 15 // seconds before despawn
        });
    }
}

// Take damage helper
function takeDamage(entity, damage) {
    if (entity.shield > 0) {
        const absorbed = Math.min(entity.shield, damage);
        entity.shield -= absorbed;
        damage -= absorbed;
        entity.shieldFlash = 0.3;
    }
    if (damage > 0) {
        entity.hp -= damage;
        // Screen shake on player/aegis damage
        if (entity === player || entity === aegis) {
            screenShake = Math.min(screenShake + damage * 0.3, 15);
        }
    }
    return entity.hp > 0;
}

// Spawn floating text
function spawnFloatingText(x, y, text, color = '#FFF', size = 14) {
    floatingTexts.push({
        x, y,
        text,
        color,
        size,
        vy: -40,
        life: 1.5,
        alpha: 1
    });
}

// Spawn powerup
function spawnPowerup(x, y) {
    const types = Object.keys(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const config = POWERUP_TYPES[type];

    powerups.push({
        x, y,
        type,
        color: config.color,
        label: config.label,
        size: 12,
        life: 12,
        bobOffset: Math.random() * Math.PI * 2
    });
}

// Fire missile
function fireMissile() {
    if (player.missileAmmo > 0) {
        player.missileAmmo--;
        player.missileTimer = 0.5;

        // Find nearest enemy
        let target = null;
        let closestDist = Infinity;
        for (const e of enemies) {
            const d = distance(player.x, player.y, e.x, e.y);
            if (d < closestDist) {
                closestDist = d;
                target = e;
            }
        }

        missiles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(player.angle) * 200,
            vy: Math.sin(player.angle) * 200,
            angle: player.angle,
            target: target,
            damage: 40,
            life: 4,
            trail: []
        });

        spawnFloatingText(player.x, player.y - 30, 'MISSILE!', COLORS.missileRed, 16);
    }
}

// Update floating texts
function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.y += t.vy * dt;
        t.life -= dt;
        t.alpha = Math.min(1, t.life);

        if (t.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

// Update powerups
function updatePowerups(dt) {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.life -= dt;
        p.bobOffset += dt * 3;

        // Collect on player contact
        if (distance(player.x, player.y, p.x, p.y) < 30) {
            const config = POWERUP_TYPES[p.type];

            switch (p.type) {
                case 'rapidFire':
                    player.powerups.rapidFire = config.duration;
                    break;
                case 'damageBoost':
                    player.powerups.damageBoost = config.duration;
                    break;
                case 'speedBoost':
                    player.powerups.speedBoost = config.duration;
                    break;
                case 'missileAmmo':
                    player.missileAmmo = Math.min(player.maxMissiles, player.missileAmmo + 3);
                    break;
                case 'shield':
                    player.shield = Math.min(player.maxShield, player.shield + 30);
                    break;
                case 'repair':
                    player.hp = Math.min(player.maxHp, player.hp + 25);
                    break;
            }

            spawnFloatingText(p.x, p.y, config.label, p.color, 18);
            createParticle(p.x, p.y, p.color, 10, 80);
            score += 25;
            powerups.splice(i, 1);
            continue;
        }

        if (p.life <= 0) {
            powerups.splice(i, 1);
        }
    }
}

// Update missiles
function updateMissiles(dt) {
    for (let i = missiles.length - 1; i >= 0; i--) {
        const m = missiles[i];

        // Homing behavior
        if (m.target && enemies.includes(m.target)) {
            const targetAngle = angleTo(m.x, m.y, m.target.x, m.target.y);
            let angleDiff = targetAngle - m.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            m.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 5 * dt);
        }

        // Accelerate
        const speed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
        const targetSpeed = 400;
        if (speed < targetSpeed) {
            m.vx += Math.cos(m.angle) * 300 * dt;
            m.vy += Math.sin(m.angle) * 300 * dt;
        }

        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.life -= dt;

        // Trail
        m.trail.push({ x: m.x, y: m.y, life: 0.3 });
        if (m.trail.length > 20) m.trail.shift();
        for (const t of m.trail) t.life -= dt;

        // Hit enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (distance(m.x, m.y, e.x, e.y) < e.size + 10) {
                // Explosion damage
                createParticle(m.x, m.y, COLORS.missileRed, 20, 200);
                screenShake = Math.min(screenShake + 8, 15);

                // Damage and destroy
                if (!takeDamage(e, m.damage)) {
                    score += e.score * 2; // Bonus for missile kill
                    spawnFloatingText(e.x, e.y, `+${e.score * 2}`, '#FFD700', 18);
                    enemies.splice(j, 1);

                    // Update combo
                    player.comboCount++;
                    player.comboTimer = 3;
                }

                missiles.splice(i, 1);
                break;
            }
        }

        if (m.life <= 0 || m.x < -50 || m.x > WIDTH + 50 || m.y < -50 || m.y > HEIGHT + 50) {
            missiles.splice(i, 1);
        }
    }
}

// Update player
function updatePlayer(dt) {
    // Speed boost effect
    const speedMultiplier = player.powerups.speedBoost > 0 ? 1.5 : 1;

    // Thrust
    let thrustX = 0, thrustY = 0;
    if (keys['w'] || keys['arrowup']) thrustY -= 1;
    if (keys['s'] || keys['arrowdown']) thrustY += 1;
    if (keys['a'] || keys['arrowleft']) thrustX -= 1;
    if (keys['d'] || keys['arrowright']) thrustX += 1;

    if (thrustX !== 0 || thrustY !== 0) {
        const len = Math.sqrt(thrustX * thrustX + thrustY * thrustY);
        thrustX /= len;
        thrustY /= len;

        player.vx += thrustX * PHYSICS.thrustForce * speedMultiplier * dt;
        player.vy += thrustY * PHYSICS.thrustForce * speedMultiplier * dt;

        // Thrust particles
        if (Math.random() < 0.3) {
            createParticle(
                player.x - Math.cos(player.angle) * 15,
                player.y - Math.sin(player.angle) * 15,
                '#FF8800', 1, 50
            );
        }
    }

    // Apply drag
    player.vx *= PHYSICS.drag;
    player.vy *= PHYSICS.drag;

    // Cap speed
    const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    if (speed > PHYSICS.maxSpeed) {
        player.vx = (player.vx / speed) * PHYSICS.maxSpeed;
        player.vy = (player.vy / speed) * PHYSICS.maxSpeed;
    }

    // Move
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Wrap around screen
    if (player.x < 0) player.x = WIDTH;
    if (player.x > WIDTH) player.x = 0;
    if (player.y < 0) player.y = HEIGHT;
    if (player.y > HEIGHT) player.y = 0;

    // Rotate towards mouse
    const targetAngle = angleTo(player.x, player.y, mouseX, mouseY);
    let angleDiff = targetAngle - player.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    player.angle += angleDiff * PHYSICS.rotationSpeed * dt;

    // Shield recharge
    if (player.shield < player.maxShield) {
        player.shield = Math.min(player.maxShield, player.shield + player.shieldRecharge * dt);
    }
    player.shieldFlash = Math.max(0, player.shieldFlash - dt);

    // Update powerup timers
    if (player.powerups.rapidFire > 0) player.powerups.rapidFire -= dt;
    if (player.powerups.damageBoost > 0) player.powerups.damageBoost -= dt;
    if (player.powerups.speedBoost > 0) player.powerups.speedBoost -= dt;

    // Combo timer
    if (player.comboTimer > 0) {
        player.comboTimer -= dt;
        if (player.comboTimer <= 0) {
            player.comboCount = 0;
        }
    }

    // Apply powerup effects
    const effectiveFireRate = player.fireRate * (player.powerups.rapidFire > 0 ? 2.5 : 1);
    const effectiveDamage = player.damage * (player.powerups.damageBoost > 0 ? 2 : 1);

    // Fire weapon
    player.fireTimer -= dt;
    if ((keys['q'] || mouseDown) && player.fireTimer <= 0) {
        player.fireTimer = 1 / effectiveFireRate;

        projectiles.push({
            x: player.x + Math.cos(player.angle) * 20,
            y: player.y + Math.sin(player.angle) * 20,
            vx: Math.cos(player.angle) * 600 + player.vx * 0.5,
            vy: Math.sin(player.angle) * 600 + player.vy * 0.5,
            damage: effectiveDamage,
            friendly: true,
            color: player.powerups.damageBoost > 0 ? '#FF00FF' : COLORS.blasterCyan,
            size: player.powerups.damageBoost > 0 ? 6 : 4,
            life: 2
        });
    }

    // Fire missile (F key)
    player.missileTimer -= dt;
    if (keys['f'] && player.missileTimer <= 0) {
        fireMissile();
    }

    // Gravity beam
    player.gravityBeamActive = keys['e'];
    if (player.gravityBeamActive) {
        const range = 150;
        for (const mineral of minerals) {
            const dist = distance(player.x, player.y, mineral.x, mineral.y);
            if (dist < range) {
                const pull = 200 * dt;
                const angle = angleTo(mineral.x, mineral.y, player.x, player.y);
                mineral.vx += Math.cos(angle) * pull;
                mineral.vy += Math.sin(angle) * pull;
            }
        }
    }

    // Collect minerals
    for (let i = minerals.length - 1; i >= 0; i--) {
        const m = minerals[i];
        if (distance(player.x, player.y, m.x, m.y) < 25) {
            resources[m.type]++;
            score += m.type === 'purple' ? 30 : (m.type === 'yellow' ? 20 : 10);
            createParticle(m.x, m.y, m.color, 3, 30);
            minerals.splice(i, 1);
        }
    }

    // Dock with Aegis (R key)
    if (keys['r'] && distance(player.x, player.y, aegis.x, aegis.y) < 80) {
        // Repair with green resources
        const repairNeeded = player.maxHp - player.hp;
        const repairCost = Math.ceil(repairNeeded * 0.2);
        if (repairCost > 0 && resources.green >= repairCost) {
            resources.green -= repairCost;
            player.hp = player.maxHp;
        }
    }
}

// Update Aegis station
function updateAegis(dt) {
    // Shield recharge
    if (aegis.shield < aegis.maxShield) {
        aegis.shield = Math.min(aegis.maxShield, aegis.shield + aegis.shieldRecharge * dt);
    }
    aegis.shieldFlash = Math.max(0, aegis.shieldFlash - dt);

    // Auto-turret
    aegis.turretFireTimer -= dt;
    if (enemies.length > 0 && aegis.turretFireTimer <= 0) {
        let closest = null;
        let closestDist = Infinity;
        for (const e of enemies) {
            const d = distance(aegis.x, aegis.y, e.x, e.y);
            if (d < closestDist && d < 350) {
                closestDist = d;
                closest = e;
            }
        }

        if (closest) {
            aegis.turretFireTimer = 0.4;
            const angle = angleTo(aegis.x, aegis.y, closest.x, closest.y);
            aegis.turretAngle = angle;

            projectiles.push({
                x: aegis.x + Math.cos(angle) * 55,
                y: aegis.y + Math.sin(angle) * 55,
                vx: Math.cos(angle) * 450,
                vy: Math.sin(angle) * 450,
                damage: 8,
                friendly: true,
                color: '#FFFF00',
                size: 3,
                life: 1.5
            });
        }
    }
}

// Update enemies
function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        // Target selection - prioritize player, then Aegis
        const playerDist = distance(e.x, e.y, player.x, player.y);
        const aegisDist = distance(e.x, e.y, aegis.x, aegis.y);

        let target, targetDist;
        if (e.type === 'bomber' || (playerDist > 400 && aegisDist < 300)) {
            target = aegis;
            targetDist = aegisDist;
        } else {
            target = player;
            targetDist = playerDist;
        }

        // Move towards target
        const targetAngle = angleTo(e.x, e.y, target.x, target.y);
        let angleDiff = targetAngle - e.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        e.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 3 * dt);

        // Strafing for heavy fighters
        if (e.type === 'heavy' && targetDist < 200) {
            e.vx += Math.cos(e.angle + Math.PI / 2) * e.speed * 0.5 * dt;
            e.vy += Math.sin(e.angle + Math.PI / 2) * e.speed * 0.5 * dt;
        } else if (targetDist > 80) {
            e.vx += Math.cos(e.angle) * e.speed * dt;
            e.vy += Math.sin(e.angle) * e.speed * dt;
        }

        // Drag
        e.vx *= 0.98;
        e.vy *= 0.98;

        // Cap speed
        const speed = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
        if (speed > e.speed) {
            e.vx = (e.vx / speed) * e.speed;
            e.vy = (e.vy / speed) * e.speed;
        }

        e.x += e.vx * dt;
        e.y += e.vy * dt;

        // Fire at target
        e.fireTimer -= dt;
        if (e.fireTimer <= 0 && targetDist < 350) {
            e.fireTimer = 1 / e.fireRate;

            const shootAngle = angleTo(e.x, e.y, target.x, target.y);
            projectiles.push({
                x: e.x + Math.cos(shootAngle) * 15,
                y: e.y + Math.sin(shootAngle) * 15,
                vx: Math.cos(shootAngle) * 350,
                vy: Math.sin(shootAngle) * 350,
                damage: e.damage,
                friendly: false,
                color: COLORS.archnidGlow,
                size: 3,
                life: 2
            });
        }

        // Shield recharge for heavy
        if (e.shield !== undefined && e.shield < e.maxShield) {
            e.shield = Math.min(e.maxShield, e.shield + 3 * dt);
        }
    }
}

// Update projectiles
function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        if (p.life <= 0 || p.x < -50 || p.x > WIDTH + 50 || p.y < -50 || p.y > HEIGHT + 50) {
            projectiles.splice(i, 1);
            continue;
        }

        // Friendly projectile hits
        if (p.friendly) {
            // Hit enemies
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (distance(p.x, p.y, e.x, e.y) < e.size) {
                    if (!takeDamage(e, p.damage)) {
                        // Update combo
                        player.comboCount++;
                        player.comboTimer = 3;

                        // Calculate score with combo multiplier
                        const comboMultiplier = Math.min(1 + player.comboCount * 0.1, 3);
                        const earnedScore = Math.floor(e.score * comboMultiplier);
                        score += earnedScore;

                        createParticle(e.x, e.y, COLORS.archnidGlow, 15, 150);

                        // Show floating score
                        spawnFloatingText(e.x, e.y - 20, `+${earnedScore}`, '#FFD700', 16);
                        if (player.comboCount > 2) {
                            spawnFloatingText(e.x, e.y - 40, `${player.comboCount}x COMBO!`, '#FF8800', 14);
                        }

                        // Drop resources
                        if (Math.random() < 0.5) {
                            const roll = Math.random();
                            const type = roll < 0.5 ? 'green' : (roll < 0.85 ? 'yellow' : 'purple');
                            minerals.push({
                                x: e.x, y: e.y,
                                vx: (Math.random() - 0.5) * 50,
                                vy: (Math.random() - 0.5) * 50,
                                type,
                                color: COLORS[type + 'Mineral'],
                                size: 6,
                                life: 15
                            });
                        }

                        // Chance to drop powerup
                        if (Math.random() < 0.15) {
                            spawnPowerup(e.x, e.y);
                        }

                        enemies.splice(j, 1);
                    } else {
                        createParticle(p.x, p.y, '#FF8800', 3, 50);
                        // Show damage number
                        spawnFloatingText(p.x, p.y, `-${p.damage}`, '#FF4444', 12);
                    }
                    projectiles.splice(i, 1);
                    break;
                }
            }

            // Hit asteroids
            for (let j = asteroids.length - 1; j >= 0; j--) {
                const a = asteroids[j];
                if (distance(p.x, p.y, a.x, a.y) < a.size) {
                    a.hp -= p.damage;
                    createParticle(p.x, p.y, '#8B7355', 3, 30);

                    if (a.hp <= 0) {
                        dropMinerals(a);
                        createParticle(a.x, a.y, '#8B7355', 10, 100);
                        asteroids.splice(j, 1);
                    }

                    projectiles.splice(i, 1);
                    break;
                }
            }
        } else {
            // Enemy projectile hits player
            if (distance(p.x, p.y, player.x, player.y) < player.size) {
                takeDamage(player, p.damage);
                createParticle(p.x, p.y, COLORS.playerShield, 5, 50);
                projectiles.splice(i, 1);
                continue;
            }

            // Enemy projectile hits Aegis
            if (distance(p.x, p.y, aegis.x, aegis.y) < aegis.size) {
                takeDamage(aegis, p.damage);
                createParticle(p.x, p.y, COLORS.aegisShield, 5, 50);
                projectiles.splice(i, 1);
            }
        }
    }
}

// Update asteroids
function updateAsteroids(dt) {
    for (const a of asteroids) {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.rotation += a.rotSpeed;

        // Bounce off edges
        if (a.x < a.size || a.x > WIDTH - a.size) a.vx *= -1;
        if (a.y < a.size || a.y > HEIGHT - a.size) a.vy *= -1;
        a.x = Math.max(a.size, Math.min(WIDTH - a.size, a.x));
        a.y = Math.max(a.size, Math.min(HEIGHT - a.size, a.y));
    }
}

// Update minerals
function updateMinerals(dt) {
    for (let i = minerals.length - 1; i >= 0; i--) {
        const m = minerals[i];
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.vx *= 0.95;
        m.vy *= 0.95;
        m.life -= dt;

        // Bounce off edges
        if (m.x < 10 || m.x > WIDTH - 10) m.vx *= -1;
        if (m.y < 10 || m.y > HEIGHT - 10) m.vy *= -1;

        if (m.life <= 0) {
            minerals.splice(i, 1);
        }
    }
}

// Update particles
function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= p.decay;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Draw functions
function drawStars() {
    for (const star of stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle + Math.PI / 2); // Adjust for sprite orientation

    // Draw sprite or fallback
    if (sprites.playerShip && sprites.playerShip.complete) {
        const scale = 2;
        ctx.drawImage(sprites.playerShip, -sprites.playerShip.width * scale / 2, -sprites.playerShip.height * scale / 2,
                      sprites.playerShip.width * scale, sprites.playerShip.height * scale);
    } else {
        // Fallback: Ship body (teardrop shape)
        ctx.fillStyle = COLORS.playerShip;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-12, -10);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-12, 10);
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#88CCFF';
        ctx.beginPath();
        ctx.arc(5, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Engine glow
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.ellipse(-14, 0, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    // Shield effect
    if (player.shieldFlash > 0 || player.shield > player.maxShield * 0.1) {
        ctx.strokeStyle = player.shieldFlash > 0 ? '#FFFFFF' : COLORS.playerShield;
        ctx.lineWidth = 2;
        ctx.globalAlpha = player.shieldFlash > 0 ? player.shieldFlash * 3 : 0.3 + (player.shield / player.maxShield) * 0.3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.size + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    // Gravity beam effect
    if (player.gravityBeamActive) {
        ctx.strokeStyle = COLORS.gravityBeam;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 150, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = COLORS.gravityBeam;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function drawAegis() {
    // Main body
    ctx.fillStyle = COLORS.aegisHull;
    ctx.beginPath();
    ctx.arc(aegis.x, aegis.y, aegis.size, 0, Math.PI * 2);
    ctx.fill();

    // Details
    ctx.fillStyle = '#556677';
    ctx.beginPath();
    ctx.arc(aegis.x, aegis.y, aegis.size * 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#445566';
    ctx.beginPath();
    ctx.arc(aegis.x, aegis.y, aegis.size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Windows/lights
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const wx = aegis.x + Math.cos(angle) * aegis.size * 0.55;
        const wy = aegis.y + Math.sin(angle) * aegis.size * 0.55;
        ctx.fillStyle = '#88AAFF';
        ctx.beginPath();
        ctx.arc(wx, wy, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Turret
    ctx.save();
    ctx.translate(aegis.x, aegis.y);
    ctx.rotate(aegis.turretAngle);
    ctx.fillStyle = '#778899';
    ctx.fillRect(-5, -3, 60, 6);
    ctx.restore();

    // Shield effect
    if (aegis.shieldFlash > 0 || aegis.shield > aegis.maxShield * 0.1) {
        ctx.strokeStyle = aegis.shieldFlash > 0 ? '#FFFFFF' : COLORS.aegisShield;
        ctx.lineWidth = 3;
        ctx.globalAlpha = aegis.shieldFlash > 0 ? aegis.shieldFlash * 3 : 0.2 + (aegis.shield / aegis.maxShield) * 0.4;
        ctx.beginPath();
        ctx.arc(aegis.x, aegis.y, aegis.size + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle + Math.PI / 2);

    // Select sprite based on type
    let sprite = null;
    let scale = 1.5;
    if (e.type === 'drone' && sprites.enemyDrone && sprites.enemyDrone.complete) {
        sprite = sprites.enemyDrone;
        scale = 1.2;
    } else if (e.type === 'heavy' && sprites.enemyHeavy && sprites.enemyHeavy.complete) {
        sprite = sprites.enemyHeavy;
        scale = 2;
    } else if (sprites.enemyFighter && sprites.enemyFighter.complete) {
        sprite = sprites.enemyFighter;
    }

    if (sprite) {
        ctx.drawImage(sprite, -sprite.width * scale / 2, -sprite.height * scale / 2,
                      sprite.width * scale, sprite.height * scale);
    } else {
        // Fallback procedural
        ctx.fillStyle = COLORS.archnidBase;
        if (e.type === 'drone') {
            ctx.beginPath();
            ctx.arc(0, 0, e.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (e.type === 'heavy') {
            ctx.beginPath();
            ctx.moveTo(e.size, 0);
            ctx.lineTo(-e.size * 0.6, -e.size * 0.8);
            ctx.lineTo(-e.size * 0.6, e.size * 0.8);
            ctx.closePath();
            ctx.fill();
        } else if (e.type === 'bomber') {
            // Wide flat bomber shape
            ctx.fillStyle = '#660000';
            ctx.beginPath();
            ctx.moveTo(e.size, 0);
            ctx.lineTo(0, -e.size * 0.9);
            ctx.lineTo(-e.size * 0.8, -e.size * 0.5);
            ctx.lineTo(-e.size * 0.8, e.size * 0.5);
            ctx.lineTo(0, e.size * 0.9);
            ctx.closePath();
            ctx.fill();
            // Payload
            ctx.fillStyle = '#FF4400';
            ctx.beginPath();
            ctx.arc(-e.size * 0.3, 0, e.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(e.size, 0);
            ctx.lineTo(-e.size * 0.7, -e.size * 0.6);
            ctx.lineTo(-e.size * 0.5, 0);
            ctx.lineTo(-e.size * 0.7, e.size * 0.6);
            ctx.closePath();
            ctx.fill();
        }

        // Glow eye
        ctx.fillStyle = COLORS.archnidGlow;
        ctx.beginPath();
        ctx.arc(e.size * 0.3, 0, e.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    // Shield for heavy
    if (e.shield > 0) {
        ctx.strokeStyle = '#9400D3';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

function drawAsteroid(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rotation);

    ctx.fillStyle = COLORS.asteroid;
    ctx.beginPath();
    const points = 7;
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = a.size * (0.7 + Math.sin(i * 3) * 0.3);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Cracks/details
    ctx.strokeStyle = '#5C4033';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-a.size * 0.3, -a.size * 0.2);
    ctx.lineTo(a.size * 0.2, a.size * 0.1);
    ctx.stroke();

    ctx.restore();

    // Health bar for damaged asteroids
    if (a.hp < a.maxHp) {
        const barWidth = a.size * 1.5;
        const hpRatio = a.hp / a.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(a.x - barWidth / 2, a.y - a.size - 10, barWidth, 4);
        ctx.fillStyle = COLORS.hpBar;
        ctx.fillRect(a.x - barWidth / 2, a.y - a.size - 10, barWidth * hpRatio, 4);
    }
}

function drawMineral(m) {
    ctx.fillStyle = m.color;
    ctx.shadowColor = m.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawProjectile(p) {
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;

    const angle = Math.atan2(p.vy, p.vx);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    ctx.fillRect(-p.size * 2, -p.size / 2, p.size * 4, p.size);
    ctx.restore();
    ctx.shadowBlur = 0;
}

function drawParticle(p) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    ctx.globalAlpha = 1;
}

function drawFloatingText(t) {
    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.fillStyle = t.color;
    ctx.font = `bold ${t.size}px Arial`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
}

function drawPowerup(p) {
    const bob = Math.sin(p.bobOffset) * 3;
    const flash = Math.sin(p.bobOffset * 2) * 0.3 + 0.7;

    ctx.save();
    ctx.translate(p.x, p.y + bob);

    // Outer glow
    ctx.fillStyle = p.color;
    ctx.globalAlpha = 0.3 * flash;
    ctx.beginPath();
    ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Inner circle
    ctx.globalAlpha = flash;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();

    // White center
    ctx.fillStyle = '#FFF';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawMissile(m) {
    // Trail
    ctx.strokeStyle = COLORS.missileRed;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    for (let i = 0; i < m.trail.length; i++) {
        const t = m.trail[i];
        ctx.globalAlpha = t.life;
        if (i === 0) ctx.moveTo(t.x, t.y);
        else ctx.lineTo(t.x, t.y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Missile body
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.angle);

    ctx.fillStyle = COLORS.missileRed;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -5);
    ctx.lineTo(-8, 5);
    ctx.closePath();
    ctx.fill();

    // Exhaust glow
    ctx.fillStyle = '#FF8800';
    ctx.beginPath();
    ctx.ellipse(-12, 0, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawHUD() {
    // Top bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, WIDTH, 50);

    // Player stats
    const barWidth = 120;
    const barHeight = 12;
    const barY = 10;

    // Shield bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, barY, barWidth, barHeight);
    ctx.fillStyle = COLORS.shieldBar;
    ctx.fillRect(10, barY, barWidth * (player.shield / player.maxShield), barHeight);
    ctx.fillStyle = '#FFF';
    ctx.font = '10px Arial';
    ctx.fillText('SHIELD', 15, barY + 10);

    // HP bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, barY + 16, barWidth, barHeight);
    ctx.fillStyle = COLORS.hpBar;
    ctx.fillRect(10, barY + 16, barWidth * (player.hp / player.maxHp), barHeight);
    ctx.fillStyle = '#FFF';
    ctx.fillText('HULL', 15, barY + 26);

    // Resources
    ctx.font = '14px Arial';
    ctx.fillStyle = COLORS.greenMineral;
    ctx.fillText(`G: ${resources.green}`, 150, 20);
    ctx.fillStyle = COLORS.yellowMineral;
    ctx.fillText(`Y: ${resources.yellow}`, 220, 20);
    ctx.fillStyle = COLORS.purpleMineral;
    ctx.fillText(`P: ${resources.purple}`, 290, 20);

    // Score and wave
    ctx.fillStyle = '#FFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Wave ${wave}`, WIDTH / 2, 20);
    ctx.fillText(`Score: ${score}`, WIDTH / 2, 38);
    ctx.textAlign = 'left';

    // Aegis status (bottom)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, HEIGHT - 40, 250, 40);

    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.fillText('AEGIS', 10, HEIGHT - 25);

    // Aegis shield
    ctx.fillStyle = '#333';
    ctx.fillRect(60, HEIGHT - 32, 80, 10);
    ctx.fillStyle = COLORS.shieldBar;
    ctx.fillRect(60, HEIGHT - 32, 80 * (aegis.shield / aegis.maxShield), 10);

    // Aegis HP
    ctx.fillStyle = '#333';
    ctx.fillRect(60, HEIGHT - 18, 80, 10);
    ctx.fillStyle = COLORS.hpBar;
    ctx.fillRect(60, HEIGHT - 18, 80 * (aegis.hp / aegis.maxHp), 10);

    // Controls hint
    ctx.fillStyle = '#888';
    ctx.font = '11px Arial';
    ctx.fillText('[WASD] Move  [Q/Click] Fire  [F] Missile  [E] Gravity Beam  [R] Dock', 160, HEIGHT - 15);

    // Missiles ammo (top right)
    ctx.fillStyle = COLORS.missileRed;
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Missiles: ${player.missileAmmo}`, WIDTH - 20, 40);

    // Combo display
    if (player.comboCount > 1) {
        ctx.fillStyle = '#FF8800';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`${player.comboCount}x COMBO`, WIDTH - 20, 60);
    }

    // Active powerups
    let powerupY = 80;
    if (player.powerups.rapidFire > 0) {
        ctx.fillStyle = '#FF4400';
        ctx.font = '12px Arial';
        ctx.fillText(`RAPID: ${Math.ceil(player.powerups.rapidFire)}s`, WIDTH - 20, powerupY);
        powerupY += 15;
    }
    if (player.powerups.damageBoost > 0) {
        ctx.fillStyle = '#FF00FF';
        ctx.fillText(`DMG+: ${Math.ceil(player.powerups.damageBoost)}s`, WIDTH - 20, powerupY);
        powerupY += 15;
    }
    if (player.powerups.speedBoost > 0) {
        ctx.fillStyle = '#00FF00';
        ctx.fillText(`SPEED: ${Math.ceil(player.powerups.speedBoost)}s`, WIDTH - 20, powerupY);
    }
    ctx.textAlign = 'left';

    // Wave warning
    if (waveCleared && waveTimer > 0) {
        ctx.fillStyle = '#FFFF00';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Next wave in ${Math.ceil(waveTimer)}...`, WIDTH / 2, HEIGHT / 2 - 100);
        ctx.textAlign = 'left';
    }

    // Enemies remaining
    if (!waveCleared) {
        ctx.fillStyle = '#FF8800';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Enemies: ${enemies.length}`, WIDTH - 20, 25);
        ctx.textAlign = 'left';
    }
}

function drawTitleScreen() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawStars();

    ctx.fillStyle = '#4A90D9';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('STARSCAPE', WIDTH / 2, 200);

    ctx.fillStyle = '#88CCFF';
    ctx.font = '18px Arial';
    ctx.fillText('Space Combat Mining', WIDTH / 2, 240);

    ctx.fillStyle = '#FFF';
    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE or Click to Start', WIDTH / 2, 350);

    ctx.fillStyle = '#888';
    ctx.font = '14px Arial';
    ctx.fillText('WASD - Move  |  Q/Click - Fire  |  E - Gravity Beam  |  R - Dock', WIDTH / 2, 450);
    ctx.fillText('Defend the Aegis station! Mine asteroids for resources!', WIDTH / 2, 480);
    ctx.textAlign = 'left';
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#FF4444';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', WIDTH / 2, 250);

    ctx.fillStyle = '#FFF';
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score}`, WIDTH / 2, 320);
    ctx.fillText(`Waves Survived: ${wave}`, WIDTH / 2, 360);

    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE to Restart', WIDTH / 2, 450);
    ctx.textAlign = 'left';
}

// Main game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    // Clear
    ctx.fillStyle = '#0A0A15';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (gameState === 'title') {
        drawTitleScreen();
    } else if (gameState === 'playing') {
        // Update
        updatePlayer(dt);
        updateAegis(dt);
        updateEnemies(dt);
        updateProjectiles(dt);
        updateMissiles(dt);
        updateAsteroids(dt);
        updateMinerals(dt);
        updatePowerups(dt);
        updateFloatingTexts(dt);
        updateParticles(dt);

        // Update screen shake
        screenShake = Math.max(0, screenShake - dt * 20);

        // Wave management
        if (waveCleared) {
            waveTimer -= dt;
            if (waveTimer <= 0) {
                spawnWave();
            }
        } else if (enemies.length === 0) {
            waveCleared = true;
            wave++;
            waveTimer = waveDelay;

            // Respawn some asteroids
            if (asteroids.length < 5) {
                spawnAsteroids(3);
            }
        }

        // Check game over
        if (player.hp <= 0 || aegis.hp <= 0) {
            gameState = 'gameover';
        }

        // Apply screen shake
        if (screenShake > 0) {
            ctx.save();
            const shakeX = (Math.random() - 0.5) * screenShake * 2;
            const shakeY = (Math.random() - 0.5) * screenShake * 2;
            ctx.translate(shakeX, shakeY);
        }

        // Draw
        drawStars();
        for (const a of asteroids) drawAsteroid(a);
        for (const m of minerals) drawMineral(m);
        for (const p of powerups) drawPowerup(p);
        drawAegis();
        drawPlayer();
        for (const e of enemies) drawEnemy(e);
        for (const p of projectiles) drawProjectile(p);
        for (const m of missiles) drawMissile(m);
        for (const p of particles) drawParticle(p);
        for (const t of floatingTexts) drawFloatingText(t);

        // Restore from screen shake
        if (screenShake > 0) {
            ctx.restore();
        }

        drawHUD();

    } else if (gameState === 'gameover') {
        drawStars();
        drawGameOver();
    }

    requestAnimationFrame(gameLoop);
}

// Reset game
function resetGame() {
    player.x = WIDTH / 2;
    player.y = HEIGHT / 2 + 150;
    player.vx = 0;
    player.vy = 0;
    player.hp = player.maxHp;
    player.shield = player.maxShield;
    player.missileAmmo = 5;
    player.comboCount = 0;
    player.comboTimer = 0;
    player.powerups.rapidFire = 0;
    player.powerups.damageBoost = 0;
    player.powerups.speedBoost = 0;

    aegis.hp = aegis.maxHp;
    aegis.shield = aegis.maxShield;

    resources.green = 50;
    resources.yellow = 30;
    resources.purple = 10;

    score = 0;
    wave = 1;
    waveTimer = 3;
    waveCleared = true;

    projectiles = [];
    enemies = [];
    asteroids = [];
    minerals = [];
    particles = [];
    missiles = [];
    powerups = [];
    floatingTexts = [];
    screenShake = 0;

    spawnAsteroids(8);
}

// Input handlers
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (e.code === 'Space') {
        if (gameState === 'title') {
            gameState = 'playing';
            resetGame();
        } else if (gameState === 'gameover') {
            gameState = 'playing';
            resetGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
    if (gameState === 'title') {
        gameState = 'playing';
        resetGame();
    }
});

canvas.addEventListener('mouseup', () => {
    mouseDown = false;
});

// Expose game state for testing
window.gameState = {
    get state() { return gameState; },
    get score() { return score; },
    get wave() { return wave; },
    get playerHp() { return player.hp; },
    get aegisHp() { return aegis.hp; },
    get resources() { return resources; },
    get enemies() { return enemies.length; },
    get asteroids() { return asteroids.length; },
    get minerals() { return minerals.length; }
};

window.startGame = () => {
    if (gameState === 'title' || gameState === 'gameover') {
        gameState = 'playing';
        resetGame();
    }
};

// Start
resetGame();
gameState = 'title';
requestAnimationFrame(gameLoop);
