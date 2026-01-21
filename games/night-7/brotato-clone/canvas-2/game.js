// Spud Survivors - Brotato Clone
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Constants
const ARENA_RADIUS = 280;
const ARENA_CENTER = { x: 400, y: 320 };
const MAX_WAVES = 10;

// Game state
let gameState = 'menu'; // menu, playing, shop, levelup, gameover, victory

// Player stats
const player = {
    x: ARENA_CENTER.x,
    y: ARENA_CENTER.y,
    radius: 16,
    speed: 200,
    maxHp: 15,
    hp: 15,
    damage: 0,
    attackSpeed: 0,
    armor: 0,
    dodge: 0,
    luck: 0,
    harvesting: 8,
    xp: 0,
    xpToLevel: 16,
    level: 1,
    materials: 0,
    weapons: [],
    items: []
};

// Weapons data
const weaponTypes = {
    knife: { name: 'Knife', damage: 8, cooldown: 0.7, range: 80, type: 'melee', color: '#ccc' },
    sword: { name: 'Sword', damage: 25, cooldown: 1.0, range: 120, type: 'melee', color: '#88f' },
    pistol: { name: 'Pistol', damage: 12, cooldown: 0.8, range: 300, type: 'ranged', color: '#888' },
    smg: { name: 'SMG', damage: 4, cooldown: 0.15, range: 280, type: 'ranged', color: '#666' },
    shotgun: { name: 'Shotgun', damage: 6, cooldown: 1.0, range: 200, pellets: 5, type: 'ranged', color: '#964' },
    spear: { name: 'Spear', damage: 18, cooldown: 1.2, range: 200, type: 'melee', color: '#a86' },
    fist: { name: 'Fist', damage: 10, cooldown: 0.5, range: 60, type: 'melee', color: '#fca' },
    flamethrower: { name: 'Flamethrower', damage: 4, cooldown: 0.1, range: 150, type: 'elemental', color: '#f80' }
};

// Items data
const itemTypes = [
    { name: 'Running Shoes', effect: 'speed', value: 15, price: 20, desc: '+15% Speed' },
    { name: 'Power Glove', effect: 'damage', value: 10, price: 30, desc: '+10% Damage' },
    { name: 'Helmet', effect: 'armor', value: 2, price: 25, desc: '+2 Armor' },
    { name: 'Lucky Charm', effect: 'luck', value: 15, price: 35, desc: '+15 Luck' },
    { name: 'Medikit', effect: 'maxHp', value: 5, price: 25, desc: '+5 Max HP' },
    { name: 'Bandana', effect: 'attackSpeed', value: 10, price: 30, desc: '+10% Attack Speed' },
    { name: 'Magnet', effect: 'harvesting', value: 8, price: 20, desc: '+8 Harvesting' },
    { name: 'Adrenaline', effect: 'speed', value: 25, price: 45, desc: '+25% Speed' },
    { name: 'Sharp Blade', effect: 'damage', value: 20, price: 50, desc: '+20% Damage' },
    { name: 'Heavy Armor', effect: 'armor', value: 5, price: 60, desc: '+5 Armor' },
];

// Characters
const characters = [
    { name: 'Potato', color: '#c9a857', hp: 15, speed: 5, harvesting: 8, weapon: 'knife' },
    { name: 'Tomato', color: '#cc4444', hp: 12, speed: 10, damage: 5, weapon: 'pistol' },
    { name: 'Onion', color: '#ddc9ff', hp: 20, speed: 0, armor: 2, weapon: 'sword' },
    { name: 'Carrot', color: '#ff8833', hp: 10, speed: 15, attackSpeed: 10, weapon: 'smg' },
    { name: 'Broccoli', color: '#44aa44', hp: 25, speed: -5, armor: 3, weapon: 'fist' },
];

let selectedCharacter = 0;

// Game objects
let enemies = [];
let projectiles = [];
let pickups = [];
let particles = [];

// Wave state
let wave = 0;
let waveTimer = 0;
let waveDuration = 20;
let spawnTimer = 0;
let spawnInterval = 1.5;

// Shop state
let shopItems = [];
let pendingLevelUp = false;
let levelUpChoices = [];

// Enemy types
const enemyTypes = {
    baby: { hp: 5, speed: 150, damage: 1, radius: 12, color: '#4a4', xp: 2, mats: 1 },
    chaser: { hp: 3, speed: 250, damage: 1, radius: 10, color: '#6a6', xp: 2, mats: 1 },
    charger: { hp: 8, speed: 100, damage: 2, radius: 16, color: '#a44', xp: 3, mats: 2, chargeSpeed: 400, chargeCooldown: 3 },
    spitter: { hp: 12, speed: 80, damage: 1, radius: 14, color: '#84a', xp: 4, mats: 2, ranged: true, shootCooldown: 2 },
    bruiser: { hp: 30, speed: 100, damage: 3, radius: 24, color: '#a64', xp: 6, mats: 4 },
    boss: { hp: 200, speed: 80, damage: 5, radius: 48, color: '#f44', xp: 50, mats: 30 }
};

// Input
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('click', handleClick);

function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (gameState === 'menu') {
        // Character selection
        for (let i = 0; i < characters.length; i++) {
            const bx = 100 + (i % 3) * 200;
            const by = 300 + Math.floor(i / 3) * 120;
            if (x > bx && x < bx + 150 && y > by && y < by + 100) {
                selectedCharacter = i;
                startGame();
                return;
            }
        }
    } else if (gameState === 'levelup') {
        // Choose upgrade
        for (let i = 0; i < levelUpChoices.length; i++) {
            const bx = 100 + i * 180;
            const by = 250;
            if (x > bx && x < bx + 160 && y > by && y < by + 100) {
                applyUpgrade(levelUpChoices[i]);
                if (wave > 0) {
                    gameState = 'shop';
                    generateShop();
                } else {
                    startWave();
                }
                return;
            }
        }
    } else if (gameState === 'shop') {
        // Buy items
        for (let i = 0; i < shopItems.length; i++) {
            const bx = 50 + i * 180;
            const by = 200;
            if (x > bx && x < bx + 160 && y > by && y < by + 150 && !shopItems[i].sold) {
                if (player.materials >= shopItems[i].price) {
                    player.materials -= shopItems[i].price;
                    if (shopItems[i].isWeapon) {
                        if (player.weapons.length < 6) {
                            player.weapons.push(createWeapon(shopItems[i].type));
                        }
                    } else {
                        applyItem(shopItems[i]);
                    }
                    shopItems[i].sold = true;
                }
                return;
            }
        }
        // Start wave button
        if (x > 300 && x < 500 && y > 500 && y < 550) {
            startWave();
        }
    } else if (gameState === 'gameover' || gameState === 'victory') {
        if (x > 300 && x < 500 && y > 400 && y < 450) {
            gameState = 'menu';
        }
    }
}

function startGame() {
    const char = characters[selectedCharacter];
    player.x = ARENA_CENTER.x;
    player.y = ARENA_CENTER.y;
    player.maxHp = 10 + (char.hp || 0);
    player.hp = player.maxHp;
    player.speed = 200 * (1 + (char.speed || 0) / 100);
    player.damage = char.damage || 0;
    player.attackSpeed = char.attackSpeed || 0;
    player.armor = char.armor || 0;
    player.dodge = 0;
    player.luck = 0;
    player.harvesting = char.harvesting || 0;
    player.xp = 0;
    player.xpToLevel = 16;
    player.level = 1;
    player.materials = 0;
    player.weapons = [createWeapon(char.weapon)];
    player.items = [];

    wave = 0;
    enemies = [];
    projectiles = [];
    pickups = [];
    particles = [];

    startWave();
}

function createWeapon(type) {
    const template = weaponTypes[type];
    return {
        type,
        ...template,
        cooldownTimer: 0,
        tier: 1
    };
}

function startWave() {
    wave++;
    if (wave > MAX_WAVES) {
        gameState = 'victory';
        return;
    }

    gameState = 'playing';
    waveTimer = 20 + wave * 5;
    if (wave === MAX_WAVES) waveTimer = 90; // Boss wave
    spawnTimer = 0;
    spawnInterval = Math.max(0.3, 1.5 - wave * 0.1);
    enemies = [];
    projectiles = [];
}

function update(dt) {
    if (gameState === 'playing') {
        updatePlayer(dt);
        updateWeapons(dt);
        updateProjectiles(dt);
        updateEnemies(dt);
        updatePickups(dt);
        updateParticles(dt);
        updateWave(dt);
        checkLevelUp();
    }
}

function updatePlayer(dt) {
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        const speed = player.speed * (1 + player.attackSpeed / 200); // Speed also slightly affected
        player.x += (dx / len) * speed * dt;
        player.y += (dy / len) * speed * dt;

        // Arena bounds
        const distFromCenter = Math.sqrt((player.x - ARENA_CENTER.x) ** 2 + (player.y - ARENA_CENTER.y) ** 2);
        if (distFromCenter > ARENA_RADIUS - player.radius) {
            const angle = Math.atan2(player.y - ARENA_CENTER.y, player.x - ARENA_CENTER.x);
            player.x = ARENA_CENTER.x + Math.cos(angle) * (ARENA_RADIUS - player.radius);
            player.y = ARENA_CENTER.y + Math.sin(angle) * (ARENA_RADIUS - player.radius);
        }
    }
}

function updateWeapons(dt) {
    for (const weapon of player.weapons) {
        weapon.cooldownTimer -= dt;

        if (weapon.cooldownTimer <= 0) {
            // Find nearest enemy
            let nearest = null;
            let nearestDist = weapon.range + 50;

            for (const enemy of enemies) {
                const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
                if (dist < nearestDist) {
                    nearest = enemy;
                    nearestDist = dist;
                }
            }

            if (nearest) {
                fireWeapon(weapon, nearest);
                const cooldownMod = 1 / (1 + player.attackSpeed / 100);
                weapon.cooldownTimer = weapon.cooldown * cooldownMod;
            }
        }
    }
}

function fireWeapon(weapon, target) {
    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    const baseDamage = weapon.damage * weapon.tier * (1 + player.damage / 100);

    if (weapon.type === 'melee') {
        // Melee hit in arc
        for (const enemy of enemies) {
            const dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
            if (dist < weapon.range) {
                const enemyAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                const angleDiff = Math.abs(normalizeAngle(enemyAngle - angle));
                if (angleDiff < Math.PI / 3) {
                    damageEnemy(enemy, baseDamage);
                }
            }
        }
        // Visual
        particles.push({
            x: player.x + Math.cos(angle) * 30,
            y: player.y + Math.sin(angle) * 30,
            angle,
            size: weapon.range,
            color: weapon.color,
            life: 0.15,
            type: 'slash'
        });
    } else {
        // Ranged projectile
        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const spread = pellets > 1 ? (i - (pellets - 1) / 2) * 0.2 : 0;
            projectiles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(angle + spread) * 500,
                vy: Math.sin(angle + spread) * 500,
                damage: baseDamage,
                range: weapon.range,
                traveled: 0,
                color: weapon.color,
                friendly: true
            });
        }
    }
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.traveled += Math.sqrt(p.vx ** 2 + p.vy ** 2) * dt;

        // Out of range or arena
        const distFromCenter = Math.sqrt((p.x - ARENA_CENTER.x) ** 2 + (p.y - ARENA_CENTER.y) ** 2);
        if (p.traveled > p.range || distFromCenter > ARENA_RADIUS + 20) {
            projectiles.splice(i, 1);
            continue;
        }

        if (p.friendly) {
            // Hit enemies
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                const dist = Math.sqrt((p.x - e.x) ** 2 + (p.y - e.y) ** 2);
                if (dist < e.radius + 6) {
                    damageEnemy(e, p.damage);
                    projectiles.splice(i, 1);
                    break;
                }
            }
        } else {
            // Hit player
            const dist = Math.sqrt((p.x - player.x) ** 2 + (p.y - player.y) ** 2);
            if (dist < player.radius + 6) {
                damagePlayer(p.damage);
                projectiles.splice(i, 1);
            }
        }
    }
}

function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Behavior
        if (e.charging) {
            e.x += e.chargeVx * dt;
            e.y += e.chargeVy * dt;
            e.chargeTime -= dt;
            if (e.chargeTime <= 0) e.charging = false;
        } else if (e.ranged && dist < 200) {
            // Run away and shoot
            e.x -= (dx / dist) * e.speed * 0.5 * dt;
            e.y -= (dy / dist) * e.speed * 0.5 * dt;
            e.shootTimer = (e.shootTimer || 0) - dt;
            if (e.shootTimer <= 0) {
                const angle = Math.atan2(dy, dx);
                projectiles.push({
                    x: e.x, y: e.y,
                    vx: Math.cos(angle) * 200,
                    vy: Math.sin(angle) * 200,
                    damage: e.damage,
                    range: 400,
                    traveled: 0,
                    color: '#f88',
                    friendly: false
                });
                e.shootTimer = e.shootCooldown || 2;
            }
        } else if (e.chargeSpeed) {
            // Charger behavior
            e.chargeCooldownTimer = (e.chargeCooldownTimer || 0) - dt;
            if (e.chargeCooldownTimer <= 0 && dist < 200) {
                e.charging = true;
                e.chargeVx = (dx / dist) * e.chargeSpeed;
                e.chargeVy = (dy / dist) * e.chargeSpeed;
                e.chargeTime = 0.5;
                e.chargeCooldownTimer = e.chargeCooldown;
            } else {
                e.x += (dx / dist) * e.speed * dt;
                e.y += (dy / dist) * e.speed * dt;
            }
        } else {
            // Chase
            if (dist > e.radius + player.radius) {
                e.x += (dx / dist) * e.speed * dt;
                e.y += (dy / dist) * e.speed * dt;
            }
        }

        // Arena bounds
        const distFromCenter = Math.sqrt((e.x - ARENA_CENTER.x) ** 2 + (e.y - ARENA_CENTER.y) ** 2);
        if (distFromCenter > ARENA_RADIUS - e.radius) {
            const angle = Math.atan2(e.y - ARENA_CENTER.y, e.x - ARENA_CENTER.x);
            e.x = ARENA_CENTER.x + Math.cos(angle) * (ARENA_RADIUS - e.radius);
            e.y = ARENA_CENTER.y + Math.sin(angle) * (ARENA_RADIUS - e.radius);
        }

        // Contact damage
        if (dist < e.radius + player.radius) {
            damagePlayer(e.damage);
        }
    }
}

function damageEnemy(enemy, damage) {
    enemy.hp -= damage;

    particles.push({
        x: enemy.x,
        y: enemy.y - 20,
        text: Math.round(damage).toString(),
        life: 0.5,
        vy: -50,
        type: 'damage'
    });

    if (enemy.hp <= 0) {
        // Drop XP and materials
        const xpAmount = enemy.xp + Math.floor(player.harvesting / 5);
        const matAmount = enemy.mats + Math.floor(player.harvesting / 10);

        pickups.push({ x: enemy.x, y: enemy.y, type: 'xp', amount: xpAmount });
        pickups.push({ x: enemy.x + 10, y: enemy.y, type: 'material', amount: matAmount });

        // Remove enemy
        const idx = enemies.indexOf(enemy);
        if (idx > -1) enemies.splice(idx, 1);

        // Death particles
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: enemy.x,
                y: enemy.y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 0.3,
                color: enemy.color,
                type: 'death'
            });
        }
    }
}

function damagePlayer(damage) {
    // Dodge check
    if (Math.random() * 100 < player.dodge) {
        particles.push({
            x: player.x, y: player.y - 30,
            text: 'DODGE!',
            life: 0.5, vy: -30,
            type: 'damage',
            color: '#8f8'
        });
        return;
    }

    // Armor reduction
    const reduction = player.armor / (player.armor + 15);
    const finalDamage = Math.max(1, damage * (1 - reduction));

    player.hp -= finalDamage;

    if (player.hp <= 0) {
        player.hp = 0;
        gameState = 'gameover';
    }
}

function updatePickups(dt) {
    const pickupRange = 50 + player.harvesting;

    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < pickupRange) {
            // Move towards player
            p.x += (dx / dist) * 300 * dt;
            p.y += (dy / dist) * 300 * dt;

            if (dist < 20) {
                if (p.type === 'xp') {
                    player.xp += p.amount;
                } else if (p.type === 'material') {
                    player.materials += p.amount;
                } else if (p.type === 'health') {
                    player.hp = Math.min(player.maxHp, player.hp + p.amount);
                }
                pickups.splice(i, 1);
            }
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.vx) p.x += p.vx * dt;
        if (p.vy) p.y += p.vy * dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function updateWave(dt) {
    waveTimer -= dt;
    spawnTimer -= dt;

    if (spawnTimer <= 0 && enemies.length < 100) {
        spawnEnemy();
        spawnTimer = spawnInterval;
    }

    if (waveTimer <= 0 || (wave === MAX_WAVES && enemies.length === 0 && enemies.some(e => e.type === 'boss') === false)) {
        // Check if boss wave and boss is dead
        if (wave === MAX_WAVES) {
            const bossAlive = enemies.some(e => e.type === 'boss');
            if (!bossAlive && waveTimer <= 0) {
                // Collect remaining pickups
                for (const p of pickups) {
                    if (p.type === 'xp') player.xp += p.amount;
                    else if (p.type === 'material') player.materials += p.amount;
                }
                pickups = [];
                gameState = 'victory';
                return;
            }
        }

        if (waveTimer <= 0) {
            // Collect remaining pickups
            for (const p of pickups) {
                if (p.type === 'xp') player.xp += p.amount;
                else if (p.type === 'material') player.materials += p.amount;
            }
            pickups = [];

            // Check level up
            if (player.xp >= player.xpToLevel) {
                generateLevelUp();
                gameState = 'levelup';
            } else {
                gameState = 'shop';
                generateShop();
            }
        }
    }
}

function spawnEnemy() {
    // Spawn from edge
    const angle = Math.random() * Math.PI * 2;
    const x = ARENA_CENTER.x + Math.cos(angle) * (ARENA_RADIUS + 30);
    const y = ARENA_CENTER.y + Math.sin(angle) * (ARENA_RADIUS + 30);

    // Determine enemy type based on wave
    let type;
    if (wave === MAX_WAVES && enemies.filter(e => e.type === 'boss').length === 0) {
        type = 'boss';
    } else {
        const roll = Math.random();
        if (wave >= 8 && roll < 0.1) type = 'bruiser';
        else if (wave >= 4 && roll < 0.2) type = 'spitter';
        else if (wave >= 3 && roll < 0.3) type = 'charger';
        else if (wave >= 2 && roll < 0.5) type = 'chaser';
        else type = 'baby';
    }

    const template = enemyTypes[type];
    const waveScale = 1 + (wave - 1) * 0.15;

    enemies.push({
        x, y,
        type,
        hp: template.hp * waveScale,
        maxHp: template.hp * waveScale,
        speed: template.speed,
        damage: template.damage,
        radius: template.radius,
        color: template.color,
        xp: template.xp,
        mats: template.mats,
        chargeSpeed: template.chargeSpeed,
        chargeCooldown: template.chargeCooldown,
        ranged: template.ranged,
        shootCooldown: template.shootCooldown
    });
}

function checkLevelUp() {
    while (player.xp >= player.xpToLevel) {
        player.xp -= player.xpToLevel;
        player.level++;
        player.xpToLevel = Math.floor((player.level + 3) ** 2);
        player.maxHp += 1;
        player.hp = Math.min(player.hp + 1, player.maxHp);
        pendingLevelUp = true;
    }
}

function generateLevelUp() {
    const upgrades = [
        { name: '+3 Max HP', stat: 'maxHp', value: 3 },
        { name: '+5% Damage', stat: 'damage', value: 5 },
        { name: '+5% Attack Speed', stat: 'attackSpeed', value: 5 },
        { name: '+2 Armor', stat: 'armor', value: 2 },
        { name: '+5% Dodge', stat: 'dodge', value: 5 },
        { name: '+10 Luck', stat: 'luck', value: 10 },
        { name: '+5% Speed', stat: 'speed', value: 5 },
        { name: '+5 Harvesting', stat: 'harvesting', value: 5 },
    ];

    // Shuffle and pick 4
    levelUpChoices = [];
    const shuffled = [...upgrades].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 4 && i < shuffled.length; i++) {
        levelUpChoices.push(shuffled[i]);
    }
    pendingLevelUp = false;
}

function applyUpgrade(upgrade) {
    if (upgrade.stat === 'speed') {
        player.speed *= (1 + upgrade.value / 100);
    } else if (upgrade.stat === 'maxHp') {
        player.maxHp += upgrade.value;
        player.hp += upgrade.value;
    } else {
        player[upgrade.stat] += upgrade.value;
    }
}

function generateShop() {
    shopItems = [];

    // 2 weapons, 2 items
    const weaponList = Object.keys(weaponTypes);
    for (let i = 0; i < 2; i++) {
        const type = weaponList[Math.floor(Math.random() * weaponList.length)];
        shopItems.push({
            name: weaponTypes[type].name,
            type,
            price: 20 + wave * 5,
            isWeapon: true,
            sold: false
        });
    }

    for (let i = 0; i < 2; i++) {
        const item = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        shopItems.push({
            ...item,
            price: item.price + wave * 2,
            sold: false
        });
    }
}

function applyItem(item) {
    if (item.effect === 'speed') {
        player.speed *= (1 + item.value / 100);
    } else if (item.effect === 'maxHp') {
        player.maxHp += item.value;
        player.hp += item.value;
    } else {
        player[item.effect] += item.value;
    }
    player.items.push(item.name);
}

// Rendering
function render() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'menu') {
        renderMenu();
    } else if (gameState === 'playing') {
        renderGame();
        renderHUD();
    } else if (gameState === 'shop') {
        renderShop();
    } else if (gameState === 'levelup') {
        renderLevelUp();
    } else if (gameState === 'gameover') {
        renderGameOver();
    } else if (gameState === 'victory') {
        renderVictory();
    }
}

function renderMenu() {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SPUD SURVIVORS', 400, 100);

    ctx.font = '24px Arial';
    ctx.fillText('Choose your character:', 400, 180);

    for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        const bx = 100 + (i % 3) * 200;
        const by = 300 + Math.floor(i / 3) * 120;

        ctx.fillStyle = char.color;
        ctx.fillRect(bx, by, 150, 100);

        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(char.name, bx + 75, by + 30);
        ctx.font = '12px Arial';
        ctx.fillText(`HP: ${10 + (char.hp || 0)}`, bx + 75, by + 50);
        ctx.fillText(`SPD: ${100 + (char.speed || 0)}%`, bx + 75, by + 65);
        ctx.fillText(`Weapon: ${char.weapon}`, bx + 75, by + 80);
    }

    ctx.font = '14px Arial';
    ctx.fillStyle = '#888';
    ctx.fillText('Click a character to start!', 400, 550);
}

function renderGame() {
    // Arena
    ctx.beginPath();
    ctx.arc(ARENA_CENTER.x, ARENA_CENTER.y, ARENA_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#2a2a3e';
    ctx.fill();
    ctx.strokeStyle = '#4a4a5e';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Grid pattern
    ctx.strokeStyle = '#3a3a4e';
    ctx.lineWidth = 1;
    for (let x = ARENA_CENTER.x - ARENA_RADIUS; x <= ARENA_CENTER.x + ARENA_RADIUS; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, ARENA_CENTER.y - ARENA_RADIUS);
        ctx.lineTo(x, ARENA_CENTER.y + ARENA_RADIUS);
        ctx.stroke();
    }
    for (let y = ARENA_CENTER.y - ARENA_RADIUS; y <= ARENA_CENTER.y + ARENA_RADIUS; y += 50) {
        ctx.beginPath();
        ctx.moveTo(ARENA_CENTER.x - ARENA_RADIUS, y);
        ctx.lineTo(ARENA_CENTER.x + ARENA_RADIUS, y);
        ctx.stroke();
    }

    // Pickups
    for (const p of pickups) {
        if (p.type === 'xp') {
            ctx.fillStyle = '#4f4';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'material') {
            ctx.fillStyle = '#ff0';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Enemies
    for (const e of enemies) {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();

        // HP bar for bigger enemies
        if (e.radius > 15) {
            ctx.fillStyle = '#333';
            ctx.fillRect(e.x - 20, e.y - e.radius - 10, 40, 6);
            ctx.fillStyle = '#f44';
            ctx.fillRect(e.x - 20, e.y - e.radius - 10, 40 * (e.hp / e.maxHp), 6);
        }
    }

    // Projectiles
    for (const p of projectiles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Player
    ctx.fillStyle = characters[selectedCharacter].color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x - 5, player.y - 4, 4, 0, Math.PI * 2);
    ctx.arc(player.x + 5, player.y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.x - 5, player.y - 4, 2, 0, Math.PI * 2);
    ctx.arc(player.x + 5, player.y - 4, 2, 0, Math.PI * 2);
    ctx.fill();

    // Particles
    for (const p of particles) {
        if (p.type === 'slash') {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 0.15;
            ctx.fillRect(0, -15, p.size * 0.8, 30);
            ctx.restore();
        } else if (p.type === 'damage') {
            ctx.fillStyle = p.color || '#ff4';
            ctx.font = 'bold 14px Arial';
            ctx.globalAlpha = p.life * 2;
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x, p.y);
        } else if (p.type === 'death') {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

function renderHUD() {
    // HP Bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 10, 200, 20);
    ctx.fillStyle = '#f44';
    ctx.fillRect(10, 10, 200 * (player.hp / player.maxHp), 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 200, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`, 15, 25);

    // XP Bar
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 35, 150, 12);
    ctx.fillStyle = '#4f4';
    ctx.fillRect(10, 35, 150 * (player.xp / player.xpToLevel), 12);
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.fillText(`LV ${player.level}`, 15, 45);

    // Wave and Timer
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Wave ${wave}/${MAX_WAVES}`, 400, 25);
    ctx.font = '16px Arial';
    ctx.fillText(`${Math.ceil(waveTimer)}s`, 400, 45);

    // Materials
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff0';
    ctx.fillText(`Materials: ${player.materials}`, 790, 25);

    // Weapons
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';
    ctx.fillStyle = '#aaa';
    for (let i = 0; i < player.weapons.length; i++) {
        const w = player.weapons[i];
        ctx.fillText(`${w.name}`, 10, 580 - i * 15);
    }

    // Stats
    ctx.fillStyle = '#888';
    ctx.fillText(`DMG: +${player.damage}%  SPD: +${Math.round((player.speed / 200 - 1) * 100)}%  ARM: ${player.armor}`, 10, 560);
}

function renderShop() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`SHOP - Wave ${wave} Complete!`, 400, 50);

    ctx.font = '20px Arial';
    ctx.fillStyle = '#ff0';
    ctx.fillText(`Materials: ${player.materials}`, 400, 90);

    // Shop items
    for (let i = 0; i < shopItems.length; i++) {
        const item = shopItems[i];
        const bx = 50 + i * 180;
        const by = 200;

        ctx.fillStyle = item.sold ? '#333' : (item.isWeapon ? '#446' : '#464');
        ctx.fillRect(bx, by, 160, 150);

        ctx.fillStyle = item.sold ? '#666' : '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.name, bx + 80, by + 30);

        if (!item.isWeapon && item.desc) {
            ctx.font = '12px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText(item.desc, bx + 80, by + 60);
        }

        ctx.font = '16px Arial';
        ctx.fillStyle = item.sold ? '#666' : (player.materials >= item.price ? '#ff0' : '#f44');
        ctx.fillText(`$${item.price}`, bx + 80, by + 100);

        if (item.sold) {
            ctx.fillStyle = '#4f4';
            ctx.fillText('SOLD', bx + 80, by + 130);
        }
    }

    // Weapons display
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Your Weapons:', 50, 400);
    for (let i = 0; i < 6; i++) {
        const w = player.weapons[i];
        ctx.fillStyle = w ? '#446' : '#333';
        ctx.fillRect(50 + i * 100, 410, 90, 40);
        if (w) {
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(w.name, 95 + i * 100, 435);
        }
    }

    // Start wave button
    ctx.fillStyle = '#484';
    ctx.fillRect(300, 500, 200, 50);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('START WAVE', 400, 532);
}

function renderLevelUp() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff0';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL UP!', 400, 150);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('Choose an upgrade:', 400, 200);

    for (let i = 0; i < levelUpChoices.length; i++) {
        const upgrade = levelUpChoices[i];
        const bx = 100 + i * 180;
        const by = 250;

        ctx.fillStyle = '#446';
        ctx.fillRect(bx, by, 160, 100);

        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(upgrade.name, bx + 80, by + 55);
    }
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f44';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', 400, 200);

    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(`You reached Wave ${wave}`, 400, 280);
    ctx.fillText(`Level ${player.level}`, 400, 320);

    ctx.fillStyle = '#484';
    ctx.fillRect(300, 400, 200, 50);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('PLAY AGAIN', 400, 432);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#4f4';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', 400, 200);

    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('You survived all 10 waves!', 400, 280);
    ctx.fillText(`Final Level: ${player.level}`, 400, 320);
    ctx.fillText(`Materials Collected: ${player.materials}`, 400, 360);

    ctx.fillStyle = '#484';
    ctx.fillRect(300, 400, 200, 50);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('PLAY AGAIN', 400, 432);
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
