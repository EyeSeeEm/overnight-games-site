// Spud Survivors - Brotato Clone
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game state
let gameState = 'menu'; // menu, charSelect, playing, levelUp, shop, gameover, victory
let currentWave = 1;
const MAX_WAVES = 10;
let waveTimer = 0;
let waveDuration = 20;
let waveEnded = false;

// Player
const player = {
    x: 400, y: 300,
    size: 20,
    speed: 200,
    hp: 15, maxHp: 15,
    hpRegen: 0,
    damage: 0, // % bonus
    meleeDamage: 0,
    rangedDamage: 0,
    attackSpeed: 0, // % bonus
    critChance: 0,
    armor: 0,
    dodge: 0,
    luck: 0,
    harvesting: 8,
    xp: 0,
    xpToLevel: 16,
    level: 1,
    materials: 0,
    weapons: [],
    items: [],
    character: null
};

// Characters
const CHARACTERS = [
    { name: 'Potato', color: '#DDB060', hp: 5, speed: 5, harvesting: 8, weapon: 'Knife' },
    { name: 'Tomato', color: '#FF6644', hp: -2, damage: 10, attackSpeed: 10, weapon: 'Pistol' },
    { name: 'Onion', color: '#CCAA88', hp: 8, armor: 2, speed: -5, weapon: 'Fist' },
    { name: 'Carrot', color: '#FF8833', hp: 0, speed: 15, critChance: 5, weapon: 'Spear' },
    { name: 'Broccoli', color: '#44AA44', hp: 15, hpRegen: 3, speed: -10, weapon: 'Sword' }
];

// Weapons
const WEAPONS = {
    Knife: { type: 'melee', damage: 8, cooldown: 0.6, range: 80, scaling: 'melee', color: '#CCCCCC' },
    Sword: { type: 'melee', damage: 30, cooldown: 1.0, range: 120, scaling: 'melee', color: '#8888FF' },
    Spear: { type: 'melee', damage: 20, cooldown: 1.2, range: 180, scaling: 'melee', color: '#AA8844' },
    Fist: { type: 'melee', damage: 10, cooldown: 0.5, range: 60, scaling: 'melee', color: '#FFDDAA' },
    Pistol: { type: 'ranged', damage: 15, cooldown: 0.8, range: 300, speed: 500, scaling: 'ranged', color: '#888888' },
    SMG: { type: 'ranged', damage: 5, cooldown: 0.15, range: 280, speed: 600, scaling: 'ranged', color: '#666666' },
    Shotgun: { type: 'ranged', damage: 8, pellets: 5, cooldown: 1.0, range: 200, speed: 400, spread: 0.4, scaling: 'ranged', color: '#AA6633' },
    Flamethrower: { type: 'elemental', damage: 4, cooldown: 0.1, range: 150, speed: 300, scaling: 'elemental', color: '#FF4400' }
};

// Items
const ITEMS = [
    { name: 'Bandana', cost: 20, effect: { piercing: 1 }, tier: 1 },
    { name: 'Glasses', cost: 18, effect: { critChance: 5 }, tier: 1 },
    { name: 'Helmet', cost: 15, effect: { armor: 2 }, tier: 1 },
    { name: 'Medikit', cost: 20, effect: { hpRegen: 3 }, tier: 1 },
    { name: 'Running Shoes', cost: 15, effect: { speed: 10 }, tier: 1 },
    { name: 'Magnet', cost: 18, effect: { pickupRange: 50 }, tier: 1 },
    { name: 'Power Glove', cost: 45, effect: { meleeDamage: 3, attackSpeed: 10 }, tier: 2 },
    { name: 'Sniper Scope', cost: 50, effect: { range: 30, critChance: 10 }, tier: 2 },
    { name: 'Scared Sausage', cost: 35, effect: { maxHp: 5, dodge: 3 }, tier: 2 },
    { name: 'Lucky Charm', cost: 35, effect: { luck: 15 }, tier: 2 },
    { name: 'Heavy Armor', cost: 80, effect: { armor: 4, speed: -5 }, tier: 3 },
    { name: 'Hunting Trophy', cost: 75, effect: { damage: 15, luck: 10 }, tier: 3 },
    { name: 'Vampire Teeth', cost: 60, effect: { lifeSteal: 3 }, tier: 3 },
    { name: 'Energy Drink', cost: 55, effect: { attackSpeed: 20, speed: 10 }, tier: 3 }
];

// Upgrades
const UPGRADES = [
    { name: '+3 Max HP', stat: 'maxHp', value: 3 },
    { name: '+5% Damage', stat: 'damage', value: 5 },
    { name: '+10% Attack Speed', stat: 'attackSpeed', value: 10 },
    { name: '+3 Melee Damage', stat: 'meleeDamage', value: 3 },
    { name: '+2 Ranged Damage', stat: 'rangedDamage', value: 2 },
    { name: '+2 Armor', stat: 'armor', value: 2 },
    { name: '+5% Dodge', stat: 'dodge', value: 5 },
    { name: '+5% Speed', stat: 'speed', value: 5 },
    { name: '+3% Crit', stat: 'critChance', value: 3 },
    { name: '+5 Luck', stat: 'luck', value: 5 },
    { name: '+3 HP Regen', stat: 'hpRegen', value: 3 },
    { name: '+5 Harvesting', stat: 'harvesting', value: 5 }
];

// Enemy types
const ENEMY_TYPES = {
    baby: { hp: 5, speed: 150, damage: 1, size: 16, color: '#88FF88', xp: 2 },
    chaser: { hp: 3, speed: 250, damage: 1, size: 12, color: '#FFFF88', xp: 1 },
    spitter: { hp: 10, speed: 100, damage: 1, size: 20, color: '#88FFFF', xp: 3, shoots: true },
    charger: { hp: 8, speed: 120, damage: 2, size: 18, color: '#FF8888', xp: 3, charges: true },
    bruiser: { hp: 30, speed: 80, damage: 3, size: 32, color: '#AA4444', xp: 8 },
    boss: { hp: 500, speed: 60, damage: 5, size: 64, color: '#FF00FF', xp: 100, isBoss: true }
};

// Input
const keys = {};

// Game objects
let enemies = [];
let projectiles = [];
let pickups = [];
let particles = [];
let floatingTexts = [];

// Shop state
let shopItems = [];
let upgradeChoices = [];
let selectedCharacter = 0;

// Regen timer
let regenTimer = 0;

// Input handlers
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;

    if (gameState === 'menu' && e.key === ' ') {
        gameState = 'charSelect';
    } else if (gameState === 'charSelect') {
        if (e.key === 'ArrowLeft') selectedCharacter = (selectedCharacter - 1 + CHARACTERS.length) % CHARACTERS.length;
        if (e.key === 'ArrowRight') selectedCharacter = (selectedCharacter + 1) % CHARACTERS.length;
        if (e.key === ' ' || e.key === 'Enter') {
            selectCharacter(selectedCharacter);
        }
    } else if (gameState === 'levelUp') {
        const num = parseInt(e.key);
        if (num >= 1 && num <= upgradeChoices.length) {
            applyUpgrade(upgradeChoices[num - 1]);
        }
    } else if (gameState === 'shop') {
        const num = parseInt(e.key);
        if (num >= 1 && num <= shopItems.length) {
            buyShopItem(num - 1);
        }
        if (e.key === ' ' || e.key === 'Enter') {
            startNextWave();
        }
    } else if ((gameState === 'gameover' || gameState === 'victory') && e.key === ' ') {
        resetGame();
        gameState = 'menu';
    }
});

document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Character selection
function selectCharacter(index) {
    const char = CHARACTERS[index];
    player.character = char;

    // Apply character bonuses
    player.maxHp = 10 + (char.hp || 0);
    player.hp = player.maxHp;
    player.speed = 200 * (1 + (char.speed || 0) / 100);
    player.damage = char.damage || 0;
    player.attackSpeed = char.attackSpeed || 0;
    player.armor = char.armor || 0;
    player.hpRegen = char.hpRegen || 0;
    player.critChance = char.critChance || 0;
    player.harvesting = char.harvesting || 0;

    // Starting weapon
    player.weapons = [{ ...WEAPONS[char.weapon], name: char.weapon, timer: 0 }];

    startGame();
}

function startGame() {
    currentWave = 1;
    player.x = 400;
    player.y = 300;
    player.xp = 0;
    player.xpToLevel = 16;
    player.level = 1;
    player.materials = 0;
    player.items = [];

    enemies = [];
    projectiles = [];
    pickups = [];
    particles = [];

    waveTimer = 0;
    waveDuration = 20;
    waveEnded = false;

    gameState = 'playing';
}

function resetGame() {
    player.hp = 10;
    player.maxHp = 10;
    player.weapons = [];
    player.items = [];
}

// Wave management
function startNextWave() {
    currentWave++;
    if (currentWave > MAX_WAVES) {
        gameState = 'victory';
        return;
    }

    waveTimer = 0;
    waveDuration = 20 + currentWave * 5;
    if (currentWave === MAX_WAVES) waveDuration = 90; // Boss wave
    waveEnded = false;

    enemies = [];
    projectiles = [];

    gameState = 'playing';
}

function endWave() {
    waveEnded = true;

    // Collect all remaining pickups
    pickups.forEach(p => {
        if (p.type === 'xp') {
            player.xp += p.value;
        } else if (p.type === 'material') {
            player.materials += p.value;
        }
    });
    pickups = [];

    // Check for level up
    if (player.xp >= player.xpToLevel) {
        player.xp -= player.xpToLevel;
        player.level++;
        player.xpToLevel = Math.pow(player.level + 3, 2);
        player.maxHp += 1;
        player.hp = Math.min(player.maxHp, player.hp + 1);
        generateUpgrades();
        gameState = 'levelUp';
    } else {
        generateShop();
        gameState = 'shop';
    }
}

function generateUpgrades() {
    upgradeChoices = [];
    const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 4; i++) {
        upgradeChoices.push(shuffled[i]);
    }
}

function applyUpgrade(upgrade) {
    if (upgrade.stat === 'maxHp') {
        player.maxHp += upgrade.value;
        player.hp += upgrade.value;
    } else {
        player[upgrade.stat] = (player[upgrade.stat] || 0) + upgrade.value;
    }

    addFloatingText(player.x, player.y - 30, upgrade.name, '#FFFF00');

    generateShop();
    gameState = 'shop';
}

function generateShop() {
    shopItems = [];

    // 2 weapons + 2 items for early waves, more items later
    const weaponNames = Object.keys(WEAPONS);
    const availableItems = ITEMS.filter(i => i.tier <= Math.ceil(currentWave / 3));

    // Add weapons
    for (let i = 0; i < 2; i++) {
        const name = weaponNames[Math.floor(Math.random() * weaponNames.length)];
        const weapon = { ...WEAPONS[name], name, isWeapon: true };
        weapon.cost = Math.floor(20 + currentWave * 3 + Math.random() * 10);
        shopItems.push(weapon);
    }

    // Add items
    for (let i = 0; i < 2; i++) {
        if (availableItems.length > 0) {
            const item = availableItems[Math.floor(Math.random() * availableItems.length)];
            shopItems.push({ ...item, isWeapon: false });
        }
    }
}

function buyShopItem(index) {
    const item = shopItems[index];
    if (!item || player.materials < item.cost) return;

    player.materials -= item.cost;

    if (item.isWeapon) {
        if (player.weapons.length < 6) {
            player.weapons.push({ ...item, timer: 0 });
            addFloatingText(400, 300, `Got ${item.name}!`, '#00FF00');
        } else {
            addFloatingText(400, 300, 'Weapon slots full!', '#FF0000');
            player.materials += item.cost;
            return;
        }
    } else {
        player.items.push(item);
        // Apply item effects
        if (item.effect) {
            for (const [stat, value] of Object.entries(item.effect)) {
                if (stat === 'maxHp') {
                    player.maxHp += value;
                    player.hp += value;
                } else {
                    player[stat] = (player[stat] || 0) + value;
                }
            }
        }
        addFloatingText(400, 300, `Got ${item.name}!`, '#00FFFF');
    }

    shopItems[index] = null;
}

// Update functions
function update(dt) {
    if (gameState !== 'playing') return;

    updatePlayer(dt);
    updateWeapons(dt);
    updateProjectiles(dt);
    updateEnemies(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateFloatingTexts(dt);
    spawnEnemies(dt);
    updateRegeneration(dt);

    // Wave timer
    waveTimer += dt;
    if (waveTimer >= waveDuration && enemies.length === 0) {
        endWave();
    }
}

function updatePlayer(dt) {
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        dx /= len; dy /= len;
    }

    const actualSpeed = player.speed * (1 + player.speed / 100);
    player.x += dx * actualSpeed * dt;
    player.y += dy * actualSpeed * dt;

    // Keep in bounds (circular arena)
    const cx = 400, cy = 300, radius = 280;
    const distToCenter = Math.sqrt((player.x - cx)**2 + (player.y - cy)**2);
    if (distToCenter > radius - player.size) {
        const angle = Math.atan2(player.y - cy, player.x - cx);
        player.x = cx + Math.cos(angle) * (radius - player.size);
        player.y = cy + Math.sin(angle) * (radius - player.size);
    }

    // Death check
    if (player.hp <= 0) {
        gameState = 'gameover';
    }
}

function updateWeapons(dt) {
    player.weapons.forEach(weapon => {
        weapon.timer -= dt;

        if (weapon.timer <= 0) {
            // Find nearest enemy
            let nearest = null;
            let nearestDist = Infinity;
            enemies.forEach(e => {
                const d = Math.sqrt((e.x - player.x)**2 + (e.y - player.y)**2);
                if (d < nearestDist && d < weapon.range + 100) {
                    nearestDist = d;
                    nearest = e;
                }
            });

            if (nearest) {
                fireWeapon(weapon, nearest);
                const cooldown = weapon.cooldown / (1 + player.attackSpeed / 100);
                weapon.timer = Math.max(0.05, cooldown);
            }
        }
    });
}

function fireWeapon(weapon, target) {
    const angle = Math.atan2(target.y - player.y, target.x - player.x);

    if (weapon.type === 'melee') {
        // Melee attack - instant hit in cone
        enemies.forEach(e => {
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const eAngle = Math.atan2(dy, dx);
            let angleDiff = Math.abs(eAngle - angle);
            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

            if (dist < weapon.range && angleDiff < 0.5) {
                const damage = calculateDamage(weapon);
                damageEnemy(e, damage);
            }
        });

        // Visual slash
        particles.push({
            x: player.x + Math.cos(angle) * 40,
            y: player.y + Math.sin(angle) * 40,
            angle, size: weapon.range,
            life: 0.15,
            type: 'slash',
            color: weapon.color
        });
    } else {
        // Ranged attack - fire projectile
        const pellets = weapon.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const spread = weapon.spread ? (Math.random() - 0.5) * weapon.spread : 0;
            const finalAngle = angle + spread;

            projectiles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(finalAngle) * weapon.speed,
                vy: Math.sin(finalAngle) * weapon.speed,
                damage: calculateDamage(weapon),
                range: weapon.range,
                traveled: 0,
                owner: 'player',
                color: weapon.color,
                piercing: player.piercing || 0
            });
        }
    }
}

function calculateDamage(weapon) {
    let damage = weapon.damage;

    // Add scaling
    if (weapon.scaling === 'melee') {
        damage += player.meleeDamage;
    } else if (weapon.scaling === 'ranged') {
        damage += player.rangedDamage;
    }

    // Apply damage %
    damage *= (1 + player.damage / 100);

    // Crit
    if (Math.random() * 100 < player.critChance) {
        damage *= 2;
    }

    return Math.max(1, Math.floor(damage));
}

function updateProjectiles(dt) {
    projectiles = projectiles.filter(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.traveled += Math.sqrt(p.vx*p.vx + p.vy*p.vy) * dt;

        if (p.traveled > p.range) return false;

        // Check collisions
        if (p.owner === 'player') {
            for (let i = enemies.length - 1; i >= 0; i--) {
                const e = enemies[i];
                const dx = p.x - e.x;
                const dy = p.y - e.y;
                if (dx*dx + dy*dy < (e.size/2 + 5)**2) {
                    damageEnemy(e, p.damage);
                    if (p.piercing > 0) {
                        p.piercing--;
                    } else {
                        return false;
                    }
                }
            }
        } else {
            // Enemy projectile
            const dx = p.x - player.x;
            const dy = p.y - player.y;
            if (dx*dx + dy*dy < (player.size)**2) {
                damagePlayer(p.damage);
                return false;
            }
        }

        // Out of arena
        const cx = 400, cy = 300, radius = 290;
        if (Math.sqrt((p.x-cx)**2 + (p.y-cy)**2) > radius) return false;

        return true;
    });
}

function damageEnemy(enemy, damage) {
    enemy.hp -= damage;

    // Hit particles
    for (let i = 0; i < 3; i++) {
        particles.push({
            x: enemy.x, y: enemy.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 0.3,
            color: enemy.color,
            size: 4
        });
    }

    if (enemy.hp <= 0) {
        killEnemy(enemy);
    }
}

function killEnemy(enemy) {
    const index = enemies.indexOf(enemy);
    if (index >= 0) enemies.splice(index, 1);

    // Drop XP
    const xpValue = enemy.xp + Math.floor(player.harvesting / 5);
    pickups.push({
        type: 'xp',
        x: enemy.x,
        y: enemy.y,
        value: xpValue,
        color: '#88FF88'
    });

    // Drop materials
    const matValue = 1 + Math.floor(player.harvesting / 10);
    pickups.push({
        type: 'material',
        x: enemy.x + 10,
        y: enemy.y,
        value: matValue,
        color: '#FFD700'
    });

    // Consumable drop chance
    if (Math.random() * 100 < 5 + player.luck / 10) {
        pickups.push({
            type: 'health',
            x: enemy.x - 10,
            y: enemy.y,
            value: 3,
            color: '#FF4444'
        });
    }
}

function damagePlayer(damage) {
    // Dodge check
    if (Math.random() * 100 < Math.min(60, player.dodge)) {
        addFloatingText(player.x, player.y - 20, 'DODGE!', '#FFFF00');
        return;
    }

    // Armor reduction
    const reduction = player.armor / (player.armor + 15);
    const finalDamage = Math.max(1, Math.floor(damage * (1 - reduction)));

    player.hp -= finalDamage;
    addFloatingText(player.x, player.y - 20, `-${finalDamage}`, '#FF4444');

    // Screen flash
    particles.push({
        x: 400, y: 300,
        vx: 0, vy: 0,
        life: 0.1,
        color: 'rgba(255,0,0,0.3)',
        size: 800,
        type: 'flash'
    });
}

function updateEnemies(dt) {
    enemies.forEach(e => {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Movement
        if (e.charging) {
            e.chargeTimer -= dt;
            e.x += e.chargeVx * dt;
            e.y += e.chargeVy * dt;
            if (e.chargeTimer <= 0) e.charging = false;
        } else if (e.charges && !e.chargeCooldown && dist < 200) {
            // Start charge
            e.charging = true;
            e.chargeTimer = 0.5;
            e.chargeVx = (dx / dist) * 400;
            e.chargeVy = (dy / dist) * 400;
            e.chargeCooldown = 3;
        } else {
            // Normal movement
            const moveSpeed = e.speed * dt;
            if (dist > 20) {
                e.x += (dx / dist) * moveSpeed;
                e.y += (dy / dist) * moveSpeed;
            }
        }

        // Charge cooldown
        if (e.chargeCooldown) {
            e.chargeCooldown = Math.max(0, e.chargeCooldown - dt);
        }

        // Shooting enemies
        if (e.shoots) {
            e.shootTimer = (e.shootTimer || 2) - dt;
            if (e.shootTimer <= 0 && dist < 300) {
                e.shootTimer = 2;
                projectiles.push({
                    x: e.x, y: e.y,
                    vx: (dx / dist) * 200,
                    vy: (dy / dist) * 200,
                    damage: e.damage,
                    range: 400,
                    traveled: 0,
                    owner: 'enemy',
                    color: '#FF6666'
                });
            }
        }

        // Contact damage
        if (dist < e.size/2 + player.size/2) {
            damagePlayer(e.damage);
            // Knockback enemy
            e.x -= (dx / dist) * 30;
            e.y -= (dy / dist) * 30;
        }

        // Keep in arena
        const cx = 400, cy = 300, radius = 290;
        const distToCenter = Math.sqrt((e.x - cx)**2 + (e.y - cy)**2);
        if (distToCenter > radius - e.size/2) {
            const angle = Math.atan2(e.y - cy, e.x - cx);
            e.x = cx + Math.cos(angle) * (radius - e.size/2);
            e.y = cy + Math.sin(angle) * (radius - e.size/2);
        }
    });
}

function updatePickups(dt) {
    const pickupRange = 50 + (player.pickupRange || 0);

    pickups = pickups.filter(p => {
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < pickupRange) {
            // Move toward player
            p.x += (dx / dist) * 300 * dt;
            p.y += (dy / dist) * 300 * dt;

            if (dist < 20) {
                if (p.type === 'xp') {
                    player.xp += p.value;
                    addFloatingText(p.x, p.y, `+${p.value} XP`, '#88FF88');
                } else if (p.type === 'material') {
                    player.materials += p.value;
                    addFloatingText(p.x, p.y, `+${p.value}`, '#FFD700');
                } else if (p.type === 'health') {
                    player.hp = Math.min(player.maxHp, player.hp + p.value);
                    addFloatingText(p.x, p.y, `+${p.value} HP`, '#FF4444');
                }
                return false;
            }
        }
        return true;
    });

    // Check level up during wave
    while (player.xp >= player.xpToLevel) {
        player.xp -= player.xpToLevel;
        player.level++;
        player.xpToLevel = Math.pow(player.level + 3, 2);
        player.maxHp += 1;
        player.hp = Math.min(player.maxHp, player.hp + 1);
        addFloatingText(player.x, player.y - 40, 'LEVEL UP!', '#FFFF00');
    }
}

function updateParticles(dt) {
    particles = particles.filter(p => {
        if (p.vx !== undefined) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
        p.life -= dt;
        return p.life > 0;
    });
}

function updateFloatingTexts(dt) {
    floatingTexts = floatingTexts.filter(t => {
        t.y -= 40 * dt;
        t.life -= dt;
        return t.life > 0;
    });
}

function spawnEnemies(dt) {
    if (waveTimer >= waveDuration) return;

    const spawnRate = 1 + currentWave * 0.5; // enemies per second
    const shouldSpawn = Math.random() < spawnRate * dt;

    if (shouldSpawn && enemies.length < 100) {
        // Choose enemy type based on wave
        let types = ['baby'];
        if (currentWave >= 2) types.push('chaser');
        if (currentWave >= 3) types.push('charger');
        if (currentWave >= 4) types.push('spitter');
        if (currentWave >= 6) types.push('bruiser');

        // Boss wave
        if (currentWave === MAX_WAVES && enemies.filter(e => e.isBoss).length === 0 && waveTimer > 5) {
            spawnEnemy('boss');
            return;
        }

        const type = types[Math.floor(Math.random() * types.length)];
        spawnEnemy(type);
    }
}

function spawnEnemy(type) {
    const template = ENEMY_TYPES[type];
    const cx = 400, cy = 300, radius = 300;

    // Spawn at arena edge
    const angle = Math.random() * Math.PI * 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    // Scale HP with wave
    const hpMulti = 1 + (currentWave - 1) * 0.2;

    enemies.push({
        x, y,
        hp: Math.floor(template.hp * hpMulti),
        maxHp: Math.floor(template.hp * hpMulti),
        speed: template.speed,
        damage: template.damage,
        size: template.size,
        color: template.color,
        xp: template.xp,
        shoots: template.shoots,
        charges: template.charges,
        isBoss: template.isBoss
    });
}

function updateRegeneration(dt) {
    if (player.hpRegen > 0) {
        regenTimer += dt;
        if (regenTimer >= 5) {
            regenTimer = 0;
            const heal = Math.floor(player.hpRegen);
            player.hp = Math.min(player.maxHp, player.hp + heal);
            if (heal > 0) {
                addFloatingText(player.x, player.y - 30, `+${heal}`, '#44FF44');
            }
        }
    }
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 1 });
}

// Render functions
function render() {
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'menu') {
        renderMenu();
    } else if (gameState === 'charSelect') {
        renderCharSelect();
    } else if (gameState === 'playing') {
        renderGame();
        renderHUD();
    } else if (gameState === 'levelUp') {
        renderGame();
        renderHUD();
        renderLevelUp();
    } else if (gameState === 'shop') {
        renderShop();
    } else if (gameState === 'gameover') {
        renderGameOver();
    } else if (gameState === 'victory') {
        renderVictory();
    }
}

function renderMenu() {
    ctx.fillStyle = '#FFD700';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SPUD SURVIVORS', 400, 200);

    ctx.fillStyle = '#888';
    ctx.font = '20px Arial';
    ctx.fillText('A Brotato-style Arena Survivor', 400, 250);

    ctx.fillStyle = '#FFF';
    ctx.font = '24px Arial';
    ctx.fillText('Press SPACE to Start', 400, 400);

    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.fillText('WASD - Move | Weapons auto-fire', 400, 500);
}

function renderCharSelect() {
    ctx.fillStyle = '#FFD700';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT CHARACTER', 400, 80);

    ctx.fillStyle = '#888';
    ctx.font = '16px Arial';
    ctx.fillText('Arrow Keys to select, SPACE to confirm', 400, 110);

    CHARACTERS.forEach((char, i) => {
        const x = 80 + i * 140;
        const y = 250;
        const selected = i === selectedCharacter;

        // Card background
        ctx.fillStyle = selected ? '#444' : '#222';
        ctx.fillRect(x - 50, y - 80, 100, 200);
        ctx.strokeStyle = selected ? '#FFD700' : '#555';
        ctx.lineWidth = selected ? 3 : 1;
        ctx.strokeRect(x - 50, y - 80, 100, 200);

        // Character visual
        ctx.fillStyle = char.color;
        ctx.beginPath();
        ctx.arc(x, y - 30, 30, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - 10, y - 35, 5, 0, Math.PI * 2);
        ctx.arc(x + 10, y - 35, 5, 0, Math.PI * 2);
        ctx.fill();

        // Name
        ctx.fillStyle = '#FFF';
        ctx.font = '14px Arial';
        ctx.fillText(char.name, x, y + 30);

        // Stats
        ctx.fillStyle = '#AAA';
        ctx.font = '11px Arial';
        const stats = [];
        if (char.hp) stats.push(`HP: ${char.hp > 0 ? '+' : ''}${char.hp}`);
        if (char.speed) stats.push(`SPD: ${char.speed > 0 ? '+' : ''}${char.speed}%`);
        if (char.damage) stats.push(`DMG: +${char.damage}%`);
        if (char.armor) stats.push(`ARM: +${char.armor}`);
        if (char.harvesting) stats.push(`HAR: +${char.harvesting}`);
        stats.forEach((s, si) => {
            ctx.fillText(s, x, y + 55 + si * 14);
        });

        // Starting weapon
        ctx.fillStyle = '#88FF88';
        ctx.fillText(char.weapon, x, y + 100);
    });
}

function renderGame() {
    // Arena background
    ctx.fillStyle = '#252535';
    ctx.beginPath();
    ctx.arc(400, 300, 290, 0, Math.PI * 2);
    ctx.fill();

    // Arena border
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(400, 300, 290, 0, Math.PI * 2);
    ctx.stroke();

    // Grid pattern
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    for (let i = -5; i <= 5; i++) {
        ctx.beginPath();
        ctx.moveTo(400 + i * 50, 10);
        ctx.lineTo(400 + i * 50, 590);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(110, 300 + i * 50);
        ctx.lineTo(690, 300 + i * 50);
        ctx.stroke();
    }

    // Pickups
    pickups.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
    });

    // Projectiles
    projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Enemies
    enemies.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(e.x - e.size/6, e.y - e.size/8, e.size/8, 0, Math.PI * 2);
        ctx.arc(e.x + e.size/6, e.y - e.size/8, e.size/8, 0, Math.PI * 2);
        ctx.fill();

        // Boss HP bar
        if (e.isBoss) {
            ctx.fillStyle = '#333';
            ctx.fillRect(200, 550, 400, 20);
            ctx.fillStyle = '#FF4444';
            ctx.fillRect(200, 550, 400 * (e.hp / e.maxHp), 20);
            ctx.fillStyle = '#FFF';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('BOSS', 400, 545);
        }
    });

    // Player
    ctx.fillStyle = player.character ? player.character.color : '#DDB060';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Player eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.x - 4, player.y - 3, 3, 0, Math.PI * 2);
    ctx.arc(player.x + 4, player.y - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life * 2;
        if (p.type === 'slash') {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(player.x, player.y, p.size * 0.7, p.angle - 0.4, p.angle + 0.4);
            ctx.stroke();
        } else if (p.type === 'flash') {
            ctx.fillStyle = p.color;
            ctx.fillRect(0, 0, 800, 600);
        } else {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        }
    });
    ctx.globalAlpha = 1;

    // Floating texts
    floatingTexts.forEach(t => {
        ctx.globalAlpha = t.life;
        ctx.fillStyle = t.color;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;
}

function renderHUD() {
    // HP Bar
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 20, 200, 20);
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(20, 20, 200 * (player.hp / player.maxHp), 20);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(20, 20, 200, 20);
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`, 25, 35);

    // XP Bar
    ctx.fillStyle = '#333';
    ctx.fillRect(20, 45, 200, 12);
    ctx.fillStyle = '#88FF88';
    ctx.fillRect(20, 45, 200 * (player.xp / player.xpToLevel), 12);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(20, 45, 200, 12);
    ctx.fillStyle = '#FFF';
    ctx.font = '10px Arial';
    ctx.fillText(`Level ${player.level}`, 25, 55);

    // Wave info
    ctx.fillStyle = '#FFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Wave ${currentWave}/${MAX_WAVES}`, 780, 30);
    ctx.fillText(`Time: ${Math.max(0, Math.ceil(waveDuration - waveTimer))}s`, 780, 50);

    // Materials
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'left';
    ctx.fillText(`Materials: ${player.materials}`, 20, 80);

    // Weapons
    ctx.fillStyle = '#888';
    ctx.font = '12px Arial';
    ctx.fillText('Weapons:', 20, 560);
    player.weapons.forEach((w, i) => {
        ctx.fillStyle = w.color;
        ctx.fillRect(90 + i * 50, 548, 40, 20);
        ctx.fillStyle = '#FFF';
        ctx.font = '9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(w.name.slice(0, 5), 110 + i * 50, 562);
    });
}

function renderLevelUp() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#FFD700';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL UP!', 400, 150);

    ctx.fillStyle = '#FFF';
    ctx.font = '18px Arial';
    ctx.fillText('Choose an upgrade (Press 1-4):', 400, 200);

    upgradeChoices.forEach((u, i) => {
        ctx.fillStyle = '#333';
        ctx.fillRect(150 + i * 130, 250, 120, 80);
        ctx.strokeStyle = '#FFD700';
        ctx.strokeRect(150 + i * 130, 250, 120, 80);

        ctx.fillStyle = '#FFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`[${i + 1}]`, 210 + i * 130, 275);
        ctx.font = '12px Arial';
        ctx.fillText(u.name, 210 + i * 130, 300);
    });
}

function renderShop() {
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#FFD700';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`SHOP - Wave ${currentWave}`, 400, 60);

    ctx.fillStyle = '#FFF';
    ctx.font = '18px Arial';
    ctx.fillText(`Materials: ${player.materials}`, 400, 100);

    // Shop items
    shopItems.forEach((item, i) => {
        if (!item) return;

        const x = 100 + (i % 4) * 160;
        const y = 180 + Math.floor(i / 4) * 150;

        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, 140, 120);
        ctx.strokeStyle = item.isWeapon ? '#88FF88' : '#88FFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 140, 120);

        ctx.fillStyle = '#FFF';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`[${i + 1}] ${item.name}`, x + 70, y + 25);

        ctx.fillStyle = '#FFD700';
        ctx.font = '16px Arial';
        ctx.fillText(`${item.cost} mat`, x + 70, y + 50);

        ctx.fillStyle = '#AAA';
        ctx.font = '11px Arial';
        if (item.isWeapon) {
            ctx.fillText(`DMG: ${item.damage}`, x + 70, y + 75);
            ctx.fillText(`Type: ${item.type}`, x + 70, y + 90);
        } else if (item.effect) {
            const effects = Object.entries(item.effect).map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`);
            effects.forEach((e, ei) => {
                ctx.fillText(e, x + 70, y + 75 + ei * 15);
            });
        }
    });

    // Weapons display
    ctx.fillStyle = '#FFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Your Weapons (${player.weapons.length}/6):`, 50, 450);
    player.weapons.forEach((w, i) => {
        ctx.fillStyle = w.color;
        ctx.fillRect(50 + i * 80, 460, 70, 30);
        ctx.fillStyle = '#FFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(w.name, 85 + i * 80, 480);
    });

    ctx.fillStyle = '#88FF88';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE for Next Wave', 400, 550);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#FF4444';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', 400, 250);

    ctx.fillStyle = '#FFF';
    ctx.font = '24px Arial';
    ctx.fillText(`Reached Wave ${currentWave}`, 400, 320);
    ctx.fillText(`Level ${player.level}`, 400, 360);

    ctx.fillStyle = '#888';
    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE to return to menu', 400, 450);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#44FF44';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', 400, 200);

    ctx.fillStyle = '#FFD700';
    ctx.font = '24px Arial';
    ctx.fillText('You survived all 10 waves!', 400, 270);

    ctx.fillStyle = '#FFF';
    ctx.font = '20px Arial';
    ctx.fillText(`Final Level: ${player.level}`, 400, 340);
    ctx.fillText(`Weapons: ${player.weapons.length}`, 400, 380);
    ctx.fillText(`Items: ${player.items.length}`, 400, 420);

    ctx.fillStyle = '#888';
    ctx.font = '18px Arial';
    ctx.fillText('Press SPACE to return to menu', 400, 500);
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
