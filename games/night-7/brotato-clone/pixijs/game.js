// Brotato Clone - PixiJS
const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x1a1a2e,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    preferWebGLVersion: 1,
    hello: false
});
document.body.appendChild(app.view);

// Constants
const ARENA_RADIUS = 350;
const ARENA_CENTER_X = 400;
const ARENA_CENTER_Y = 320;

// Game states
const STATE = {
    MENU: 'menu',
    CHARACTER_SELECT: 'character',
    WAVE: 'wave',
    LEVEL_UP: 'levelup',
    SHOP: 'shop',
    VICTORY: 'victory',
    GAME_OVER: 'gameover'
};

let gameState = STATE.MENU;

// Player stats
const player = {
    x: ARENA_CENTER_X,
    y: ARENA_CENTER_Y,
    speed: 200,
    maxHealth: 15,
    health: 15,
    damage: 0,
    attackSpeed: 0,
    armor: 0,
    luck: 0,
    harvesting: 8,
    weapons: [],
    items: [],
    xp: 0,
    level: 1,
    materials: 0,
    sprite: null,
    invincible: 0,
    character: null
};

// Wave state
const waveState = {
    current: 0,
    timer: 0,
    duration: 20,
    enemiesSpawned: 0,
    spawnTimer: 0
};

// Wave durations
const WAVE_DURATIONS = [20, 25, 30, 35, 40, 45, 50, 55, 60, 90];

// Input
const keys = {};

// Containers
const gameContainer = new PIXI.Container();
const entityContainer = new PIXI.Container();
const uiContainer = new PIXI.Container();
const menuContainer = new PIXI.Container();

app.stage.addChild(gameContainer);
app.stage.addChild(entityContainer);
app.stage.addChild(uiContainer);
app.stage.addChild(menuContainer);

// Game objects
const enemies = [];
const projectiles = [];
const pickups = [];

// Weapon definitions
const WEAPONS = {
    knife: { name: 'Knife', damage: 8, cooldown: 0.78, range: 100, type: 'melee', color: 0xcccccc },
    sword: { name: 'Sword', damage: 25, cooldown: 1.0, range: 120, type: 'melee', color: 0x4488ff },
    pistol: { name: 'Pistol', damage: 12, cooldown: 0.9, range: 300, type: 'ranged', color: 0x666666 },
    smg: { name: 'SMG', damage: 4, cooldown: 0.15, range: 280, type: 'ranged', color: 0x444444 },
    shotgun: { name: 'Shotgun', damage: 6, cooldown: 1.0, range: 200, type: 'ranged', pellets: 5, color: 0x884422 },
    spear: { name: 'Spear', damage: 15, cooldown: 1.2, range: 200, type: 'melee', color: 0xaa8844 },
    fist: { name: 'Fist', damage: 10, cooldown: 0.65, range: 60, type: 'melee', color: 0xffccaa },
    flamethrower: { name: 'Flamethrower', damage: 4, cooldown: 0.1, range: 150, type: 'elemental', color: 0xff6600 }
};

// Enemy definitions
const ENEMY_TYPES = {
    babyAlien: { name: 'Baby Alien', hp: 3, hpPerWave: 2, speed: 150, damage: 1, color: 0x44aa44, size: 15, behavior: 'chase' },
    chaser: { name: 'Chaser', hp: 2, hpPerWave: 1, speed: 250, damage: 1, color: 0x66ff66, size: 12, behavior: 'chase' },
    charger: { name: 'Charger', hp: 5, hpPerWave: 2.5, speed: 100, damage: 2, color: 0xaa4444, size: 18, behavior: 'charge' },
    spitter: { name: 'Spitter', hp: 8, hpPerWave: 1, speed: 80, damage: 1, color: 0x8844aa, size: 16, behavior: 'ranged' },
    bruiser: { name: 'Bruiser', hp: 25, hpPerWave: 10, speed: 60, damage: 3, color: 0x664422, size: 25, behavior: 'chase' }
};

// Items
const ITEMS = {
    helmet: { name: 'Helmet', cost: 15, effect: { armor: 2 }, tier: 1 },
    bandana: { name: 'Bandana', cost: 20, effect: { damage: 5 }, tier: 1 },
    runningShoes: { name: 'Running Shoes', cost: 15, effect: { speed: 10 }, tier: 1 },
    glasses: { name: 'Glasses', cost: 18, effect: { attackSpeed: 5 }, tier: 1 },
    medikit: { name: 'Medikit', cost: 20, effect: { maxHealth: 5 }, tier: 1 },
    luckyCharm: { name: 'Lucky Charm', cost: 25, effect: { luck: 10 }, tier: 2 },
    powerGlove: { name: 'Power Glove', cost: 35, effect: { damage: 10, attackSpeed: 5 }, tier: 2 },
    heavyArmor: { name: 'Heavy Armor', cost: 40, effect: { armor: 4, speed: -5 }, tier: 2 },
    jetPack: { name: 'Jet Pack', cost: 50, effect: { speed: 15 }, tier: 2 },
    huntingTrophy: { name: 'Hunting Trophy', cost: 60, effect: { damage: 15, luck: 10 }, tier: 3 }
};

// Characters
const CHARACTERS = {
    potato: { name: 'Potato', hp: 5, speed: 5, harvesting: 8, weapon: 'knife', color: 0xddaa66 },
    brawler: { name: 'Brawler', hp: 10, damage: 5, speed: -5, weapon: 'fist', color: 0xcc6644 },
    ranger: { name: 'Ranger', hp: 0, damage: 0, speed: 10, weapon: 'pistol', color: 0x44aa88 },
    soldier: { name: 'Soldier', hp: 5, armor: 2, speed: 0, weapon: 'smg', color: 0x446688 },
    knight: { name: 'Knight', hp: 15, armor: 3, speed: -10, weapon: 'sword', color: 0x888888 }
};

// Upgrades for level up
const UPGRADES = [
    { name: '+3 Max HP', stat: 'maxHealth', value: 3 },
    { name: '+5% Damage', stat: 'damage', value: 5 },
    { name: '+5% Attack Speed', stat: 'attackSpeed', value: 5 },
    { name: '+1 Armor', stat: 'armor', value: 1 },
    { name: '+5% Speed', stat: 'speed', value: 5 },
    { name: '+5 Luck', stat: 'luck', value: 5 },
    { name: '+5 Harvesting', stat: 'harvesting', value: 5 }
];

// Draw arena
function drawArena() {
    while (gameContainer.children.length > 0) gameContainer.removeChildAt(0);

    const arena = new PIXI.Graphics();
    // Arena floor
    arena.beginFill(0x2a2a4a);
    arena.drawCircle(ARENA_CENTER_X, ARENA_CENTER_Y, ARENA_RADIUS);
    arena.endFill();
    // Arena border
    arena.lineStyle(4, 0x4a4a6a);
    arena.drawCircle(ARENA_CENTER_X, ARENA_CENTER_Y, ARENA_RADIUS);
    gameContainer.addChild(arena);
}

// Create player
function createPlayer() {
    if (player.sprite) {
        entityContainer.removeChild(player.sprite);
    }

    const gfx = new PIXI.Graphics();
    const char = CHARACTERS[player.character] || CHARACTERS.potato;
    // Body
    gfx.beginFill(char.color);
    gfx.drawCircle(0, 0, 15);
    gfx.endFill();
    // Face
    gfx.beginFill(0x000000);
    gfx.drawCircle(-4, -3, 3);
    gfx.drawCircle(4, -3, 3);
    gfx.endFill();
    gfx.beginFill(0x333333);
    gfx.drawEllipse(0, 5, 6, 3);
    gfx.endFill();

    player.sprite = gfx;
    player.sprite.position.set(player.x, player.y);
    entityContainer.addChild(player.sprite);
}

// Create enemy
function createEnemy(type) {
    const def = ENEMY_TYPES[type];
    if (!def) return;

    // Spawn at arena edge
    const angle = Math.random() * Math.PI * 2;
    const x = ARENA_CENTER_X + Math.cos(angle) * (ARENA_RADIUS + 30);
    const y = ARENA_CENTER_Y + Math.sin(angle) * (ARENA_RADIUS + 30);

    const enemy = {
        x, y,
        type,
        hp: def.hp + def.hpPerWave * (waveState.current - 1),
        maxHp: def.hp + def.hpPerWave * (waveState.current - 1),
        speed: def.speed,
        damage: def.damage,
        size: def.size,
        behavior: def.behavior,
        chargeTimer: 0,
        chargeDir: null,
        shootTimer: 2
    };

    const gfx = new PIXI.Graphics();
    gfx.beginFill(def.color);
    gfx.drawCircle(0, 0, def.size);
    gfx.endFill();
    gfx.beginFill(0x000000);
    gfx.drawCircle(-def.size/4, -def.size/4, def.size/6);
    gfx.drawCircle(def.size/4, -def.size/4, def.size/6);
    gfx.endFill();

    gfx.position.set(x, y);
    entityContainer.addChild(gfx);
    enemy.sprite = gfx;
    enemies.push(enemy);
}

// Create projectile
function createProjectile(x, y, targetX, targetY, damage, isEnemy = false, color = 0xffff00) {
    const angle = Math.atan2(targetY - y, targetX - x);
    const speed = isEnemy ? 200 : 500;

    const proj = {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage,
        isEnemy,
        life: 2
    };

    const gfx = new PIXI.Graphics();
    gfx.beginFill(color);
    gfx.drawCircle(0, 0, isEnemy ? 5 : 4);
    gfx.endFill();
    gfx.position.set(x, y);
    entityContainer.addChild(gfx);
    proj.sprite = gfx;
    projectiles.push(proj);
}

// Create melee attack
function createMeleeAttack(weapon, targetX, targetY) {
    const angle = Math.atan2(targetY - player.y, targetX - player.x);
    const range = weapon.range;

    // Visual slash
    const slash = new PIXI.Graphics();
    slash.beginFill(weapon.color, 0.6);
    slash.moveTo(0, 0);
    slash.arc(0, 0, range, -0.5, 0.5);
    slash.lineTo(0, 0);
    slash.endFill();
    slash.position.set(player.x, player.y);
    slash.rotation = angle;
    entityContainer.addChild(slash);

    // Check enemy hits
    const damageMultiplier = 1 + player.damage / 100;
    const totalDamage = weapon.damage * damageMultiplier;

    enemies.forEach(enemy => {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const enemyAngle = Math.atan2(dy, dx);
        const angleDiff = Math.abs(normalizeAngle(enemyAngle - angle));

        if (dist < range && angleDiff < 0.6) {
            damageEnemy(enemy, totalDamage);
        }
    });

    // Remove slash after delay
    setTimeout(() => {
        entityContainer.removeChild(slash);
    }, 100);
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

// Damage enemy
function damageEnemy(enemy, damage) {
    enemy.hp -= damage;

    // Knockback
    const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
    enemy.x += Math.cos(angle) * 10;
    enemy.y += Math.sin(angle) * 10;

    if (enemy.hp <= 0) {
        killEnemy(enemy);
    }
}

// Kill enemy
function killEnemy(enemy) {
    entityContainer.removeChild(enemy.sprite);
    const idx = enemies.indexOf(enemy);
    if (idx >= 0) enemies.splice(idx, 1);

    // Drop materials and XP
    const materialsAmount = 1 + Math.floor(Math.random() * 3) + Math.floor(player.harvesting / 10);
    createPickup(enemy.x, enemy.y, 'materials', materialsAmount);
}

// Create pickup
function createPickup(x, y, type, amount) {
    const pickup = { x, y, type, amount };

    const gfx = new PIXI.Graphics();
    if (type === 'materials') {
        gfx.beginFill(0xffcc00);
        gfx.drawCircle(0, 0, 6);
        gfx.endFill();
    } else if (type === 'health') {
        gfx.beginFill(0xff4444);
        gfx.drawCircle(0, 0, 8);
        gfx.endFill();
    }

    gfx.position.set(x, y);
    entityContainer.addChild(gfx);
    pickup.sprite = gfx;
    pickups.push(pickup);
}

// XP needed for level
function xpForLevel(level) {
    return (level + 3) * (level + 3);
}

// Create UI
function createUI() {
    while (uiContainer.children.length > 0) uiContainer.removeChildAt(0);

    // HP Bar background
    const hpBg = new PIXI.Graphics();
    hpBg.beginFill(0x333333);
    hpBg.drawRoundedRect(10, 10, 200, 20, 5);
    hpBg.endFill();
    uiContainer.addChild(hpBg);

    // HP Bar
    const hpBar = new PIXI.Graphics();
    uiContainer.addChild(hpBar);
    uiContainer.hpBar = hpBar;

    // XP Bar background
    const xpBg = new PIXI.Graphics();
    xpBg.beginFill(0x333333);
    xpBg.drawRoundedRect(10, 35, 200, 10, 3);
    xpBg.endFill();
    uiContainer.addChild(xpBg);

    // XP Bar
    const xpBar = new PIXI.Graphics();
    uiContainer.addChild(xpBar);
    uiContainer.xpBar = xpBar;

    // Wave info
    const waveText = new PIXI.Text('', { fontFamily: 'Arial', fontSize: 16, fill: 0xffffff });
    waveText.position.set(350, 10);
    uiContainer.addChild(waveText);
    uiContainer.waveText = waveText;

    // Timer
    const timerText = new PIXI.Text('', { fontFamily: 'Arial', fontSize: 20, fill: 0xffff00 });
    timerText.position.set(380, 30);
    uiContainer.addChild(timerText);
    uiContainer.timerText = timerText;

    // Materials
    const materialsText = new PIXI.Text('', { fontFamily: 'Arial', fontSize: 14, fill: 0xffcc00 });
    materialsText.position.set(10, 560);
    uiContainer.addChild(materialsText);
    uiContainer.materialsText = materialsText;

    // Level
    const levelText = new PIXI.Text('', { fontFamily: 'Arial', fontSize: 14, fill: 0x88ff88 });
    levelText.position.set(10, 580);
    uiContainer.addChild(levelText);
    uiContainer.levelText = levelText;

    // Weapon slots
    const weaponContainer = new PIXI.Container();
    weaponContainer.position.set(550, 550);
    uiContainer.addChild(weaponContainer);
    uiContainer.weaponContainer = weaponContainer;
}

function updateUI() {
    // HP Bar
    const hpPercent = Math.max(0, player.health / player.maxHealth);
    uiContainer.hpBar.clear();
    uiContainer.hpBar.beginFill(0xff4444);
    uiContainer.hpBar.drawRoundedRect(12, 12, 196 * hpPercent, 16, 4);
    uiContainer.hpBar.endFill();

    // XP Bar
    const xpNeeded = xpForLevel(player.level);
    const xpPercent = Math.min(1, player.xp / xpNeeded);
    uiContainer.xpBar.clear();
    uiContainer.xpBar.beginFill(0x44ff44);
    uiContainer.xpBar.drawRoundedRect(12, 37, 196 * xpPercent, 6, 2);
    uiContainer.xpBar.endFill();

    // Wave info
    uiContainer.waveText.text = `Wave ${waveState.current}/10`;

    // Timer
    const seconds = Math.ceil(waveState.timer);
    uiContainer.timerText.text = `${seconds}s`;

    // Materials
    uiContainer.materialsText.text = `Materials: ${player.materials}`;

    // Level
    uiContainer.levelText.text = `Level ${player.level}`;

    // Weapons
    while (uiContainer.weaponContainer.children.length > 0) {
        uiContainer.weaponContainer.removeChildAt(0);
    }
    for (let i = 0; i < 6; i++) {
        const slot = new PIXI.Graphics();
        slot.beginFill(i < player.weapons.length ? 0x446688 : 0x333333);
        slot.drawRect(i * 40, 0, 35, 35);
        slot.endFill();
        uiContainer.weaponContainer.addChild(slot);

        if (player.weapons[i]) {
            const weapon = WEAPONS[player.weapons[i].type];
            const dot = new PIXI.Graphics();
            dot.beginFill(weapon.color);
            dot.drawCircle(17.5, 17.5, 10);
            dot.endFill();
            dot.position.set(i * 40, 0);
            uiContainer.weaponContainer.addChild(dot);
        }
    }
}

// Show menu
function showMenu() {
    while (menuContainer.children.length > 0) menuContainer.removeChildAt(0);

    const title = new PIXI.Text('BROTATO CLONE', {
        fontFamily: 'Arial',
        fontSize: 48,
        fill: 0xffcc00,
        fontWeight: 'bold'
    });
    title.anchor.set(0.5);
    title.position.set(400, 150);
    menuContainer.addChild(title);

    const subtitle = new PIXI.Text('Arena Survivor', {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xaaaaaa
    });
    subtitle.anchor.set(0.5);
    subtitle.position.set(400, 200);
    menuContainer.addChild(subtitle);

    const startBtn = createButton(400, 350, 'START GAME', () => {
        gameState = STATE.CHARACTER_SELECT;
        showCharacterSelect();
    });
    menuContainer.addChild(startBtn);

    const instructText = new PIXI.Text('WASD to move\nWeapons auto-fire at nearest enemy', {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0x888888,
        align: 'center'
    });
    instructText.anchor.set(0.5);
    instructText.position.set(400, 480);
    menuContainer.addChild(instructText);
}

function createButton(x, y, text, onClick) {
    const btn = new PIXI.Container();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x446688);
    bg.drawRoundedRect(-100, -25, 200, 50, 10);
    bg.endFill();
    btn.addChild(bg);

    const label = new PIXI.Text(text, {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0xffffff
    });
    label.anchor.set(0.5);
    btn.addChild(label);

    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', onClick);

    return btn;
}

// Character select
function showCharacterSelect() {
    while (menuContainer.children.length > 0) menuContainer.removeChildAt(0);

    const title = new PIXI.Text('SELECT CHARACTER', {
        fontFamily: 'Arial',
        fontSize: 32,
        fill: 0xffffff
    });
    title.anchor.set(0.5);
    title.position.set(400, 50);
    menuContainer.addChild(title);

    const charKeys = Object.keys(CHARACTERS);
    charKeys.forEach((key, idx) => {
        const char = CHARACTERS[key];
        const x = 100 + (idx % 5) * 140;
        const y = 150 + Math.floor(idx / 5) * 180;

        const charBtn = new PIXI.Container();

        const bg = new PIXI.Graphics();
        bg.beginFill(0x333355);
        bg.drawRoundedRect(-60, -70, 120, 150, 10);
        bg.endFill();
        charBtn.addChild(bg);

        const icon = new PIXI.Graphics();
        icon.beginFill(char.color);
        icon.drawCircle(0, -30, 25);
        icon.endFill();
        charBtn.addChild(icon);

        const nameText = new PIXI.Text(char.name, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xffffff
        });
        nameText.anchor.set(0.5);
        nameText.position.set(0, 20);
        charBtn.addChild(nameText);

        const statsText = new PIXI.Text(
            `HP: +${char.hp || 0}\nWeapon: ${WEAPONS[char.weapon]?.name || 'None'}`,
            { fontFamily: 'Arial', fontSize: 10, fill: 0xaaaaaa, align: 'center' }
        );
        statsText.anchor.set(0.5);
        statsText.position.set(0, 50);
        charBtn.addChild(statsText);

        charBtn.position.set(x, y);
        charBtn.eventMode = 'static';
        charBtn.cursor = 'pointer';
        charBtn.on('pointerdown', () => selectCharacter(key));
        menuContainer.addChild(charBtn);
    });
}

function selectCharacter(charKey) {
    const char = CHARACTERS[charKey];
    player.character = charKey;

    // Reset player stats
    player.maxHealth = 10 + (char.hp || 0);
    player.health = player.maxHealth;
    player.speed = 200 + (char.speed || 0) * 2;
    player.damage = char.damage || 0;
    player.attackSpeed = 0;
    player.armor = char.armor || 0;
    player.luck = 0;
    player.harvesting = char.harvesting || 0;
    player.xp = 0;
    player.level = 1;
    player.materials = 0;
    player.items = [];
    player.x = ARENA_CENTER_X;
    player.y = ARENA_CENTER_Y;

    // Starting weapon
    player.weapons = [{
        type: char.weapon,
        cooldown: 0,
        tier: 1
    }];

    waveState.current = 0;

    startWave();
}

// Start wave
function startWave() {
    waveState.current++;
    waveState.timer = WAVE_DURATIONS[waveState.current - 1] || 60;
    waveState.duration = waveState.timer;
    waveState.enemiesSpawned = 0;
    waveState.spawnTimer = 0;

    // Clear entities
    enemies.forEach(e => entityContainer.removeChild(e.sprite));
    enemies.length = 0;
    projectiles.forEach(p => entityContainer.removeChild(p.sprite));
    projectiles.length = 0;
    pickups.forEach(p => entityContainer.removeChild(p.sprite));
    pickups.length = 0;

    gameState = STATE.WAVE;

    while (menuContainer.children.length > 0) menuContainer.removeChildAt(0);

    drawArena();
    createPlayer();
    createUI();
}

// End wave
function endWave() {
    // Collect all pickups
    pickups.forEach(p => {
        if (p.type === 'materials') {
            player.materials += p.amount;
            player.xp += p.amount;
        }
        entityContainer.removeChild(p.sprite);
    });
    pickups.length = 0;

    // Check for level up
    const xpNeeded = xpForLevel(player.level);
    if (player.xp >= xpNeeded) {
        player.xp -= xpNeeded;
        player.level++;
        player.maxHealth++;
        player.health = Math.min(player.health + 1, player.maxHealth);
        showLevelUp();
    } else {
        showShop();
    }
}

// Level up screen
function showLevelUp() {
    gameState = STATE.LEVEL_UP;

    while (menuContainer.children.length > 0) menuContainer.removeChildAt(0);

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.8);
    bg.drawRect(0, 0, 800, 600);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('LEVEL UP!', {
        fontFamily: 'Arial',
        fontSize: 36,
        fill: 0xffff00
    });
    title.anchor.set(0.5);
    title.position.set(400, 80);
    menuContainer.addChild(title);

    const levelText = new PIXI.Text(`Level ${player.level}`, {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0xffffff
    });
    levelText.anchor.set(0.5);
    levelText.position.set(400, 120);
    menuContainer.addChild(levelText);

    // Random upgrades
    const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
    const choices = shuffled.slice(0, 4);

    choices.forEach((upgrade, idx) => {
        const btn = createButton(400, 200 + idx * 70, upgrade.name, () => {
            applyUpgrade(upgrade);
            showShop();
        });
        menuContainer.addChild(btn);
    });
}

function applyUpgrade(upgrade) {
    if (upgrade.stat === 'maxHealth') {
        player.maxHealth += upgrade.value;
        player.health += upgrade.value;
    } else if (upgrade.stat === 'speed') {
        player.speed += upgrade.value * 2;
    } else {
        player[upgrade.stat] = (player[upgrade.stat] || 0) + upgrade.value;
    }
}

// Shop screen
function showShop() {
    gameState = STATE.SHOP;

    while (menuContainer.children.length > 0) menuContainer.removeChildAt(0);

    const bg = new PIXI.Graphics();
    bg.beginFill(0x1a1a2e);
    bg.drawRect(0, 0, 800, 600);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text(`SHOP - Wave ${waveState.current}/10`, {
        fontFamily: 'Arial',
        fontSize: 28,
        fill: 0xffffff
    });
    title.anchor.set(0.5);
    title.position.set(400, 30);
    menuContainer.addChild(title);

    const materialsText = new PIXI.Text(`Materials: ${player.materials}`, {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0xffcc00
    });
    materialsText.anchor.set(0.5);
    materialsText.position.set(400, 60);
    menuContainer.addChild(materialsText);
    menuContainer.materialsText = materialsText;

    // Generate shop items
    const shopItems = generateShopItems();
    shopItems.forEach((item, idx) => {
        const x = 100 + (idx % 4) * 170;
        const y = 150 + Math.floor(idx / 4) * 180;
        createShopItem(x, y, item);
    });

    // Next wave button
    const nextBtn = createButton(400, 520, waveState.current >= 10 ? 'VICTORY!' : 'NEXT WAVE', () => {
        if (waveState.current >= 10) {
            showVictory();
        } else {
            startWave();
        }
    });
    menuContainer.addChild(nextBtn);
}

function generateShopItems() {
    const items = [];

    // 2 weapons
    const weaponKeys = Object.keys(WEAPONS);
    for (let i = 0; i < 2; i++) {
        const key = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
        items.push({ type: 'weapon', key, cost: 20 + waveState.current * 3 });
    }

    // 2 items
    const itemKeys = Object.keys(ITEMS);
    for (let i = 0; i < 2; i++) {
        const key = itemKeys[Math.floor(Math.random() * itemKeys.length)];
        items.push({ type: 'item', key, cost: ITEMS[key].cost + waveState.current * 2 });
    }

    return items;
}

function createShopItem(x, y, shopItem) {
    const container = new PIXI.Container();

    const bg = new PIXI.Graphics();
    bg.beginFill(0x333355);
    bg.drawRoundedRect(-70, -80, 140, 160, 10);
    bg.endFill();
    container.addChild(bg);

    let name, color;
    if (shopItem.type === 'weapon') {
        const weapon = WEAPONS[shopItem.key];
        name = weapon.name;
        color = weapon.color;
    } else {
        const item = ITEMS[shopItem.key];
        name = item.name;
        color = 0x88ff88;
    }

    const icon = new PIXI.Graphics();
    icon.beginFill(color);
    icon.drawRoundedRect(-25, -50, 50, 50, 5);
    icon.endFill();
    container.addChild(icon);

    const nameText = new PIXI.Text(name, {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xffffff
    });
    nameText.anchor.set(0.5);
    nameText.position.set(0, 20);
    container.addChild(nameText);

    const costText = new PIXI.Text(`${shopItem.cost} mat`, {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xffcc00
    });
    costText.anchor.set(0.5);
    costText.position.set(0, 45);
    container.addChild(costText);

    const buyBtn = new PIXI.Graphics();
    buyBtn.beginFill(0x446688);
    buyBtn.drawRoundedRect(-30, 55, 60, 25, 5);
    buyBtn.endFill();
    container.addChild(buyBtn);

    const buyText = new PIXI.Text('BUY', {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xffffff
    });
    buyText.anchor.set(0.5);
    buyText.position.set(0, 67);
    container.addChild(buyText);

    container.position.set(x, y);
    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.on('pointerdown', () => {
        if (player.materials >= shopItem.cost) {
            player.materials -= shopItem.cost;
            if (shopItem.type === 'weapon') {
                if (player.weapons.length < 6) {
                    player.weapons.push({ type: shopItem.key, cooldown: 0, tier: 1 });
                }
            } else {
                const item = ITEMS[shopItem.key];
                player.items.push(shopItem.key);
                Object.entries(item.effect).forEach(([stat, value]) => {
                    if (stat === 'maxHealth') {
                        player.maxHealth += value;
                        player.health += value;
                    } else if (stat === 'speed') {
                        player.speed += value * 2;
                    } else {
                        player[stat] = (player[stat] || 0) + value;
                    }
                });
            }
            menuContainer.materialsText.text = `Materials: ${player.materials}`;
        }
    });

    menuContainer.addChild(container);
}

// Victory screen
function showVictory() {
    gameState = STATE.VICTORY;

    while (menuContainer.children.length > 0) menuContainer.removeChildAt(0);

    const bg = new PIXI.Graphics();
    bg.beginFill(0x1a2a1a);
    bg.drawRect(0, 0, 800, 600);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('VICTORY!', {
        fontFamily: 'Arial',
        fontSize: 64,
        fill: 0xffff00
    });
    title.anchor.set(0.5);
    title.position.set(400, 150);
    menuContainer.addChild(title);

    const statsText = new PIXI.Text(
        `Level: ${player.level}\n` +
        `Weapons: ${player.weapons.length}\n` +
        `Items: ${player.items.length}`,
        { fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'center' }
    );
    statsText.anchor.set(0.5);
    statsText.position.set(400, 300);
    menuContainer.addChild(statsText);

    const playAgainBtn = createButton(400, 450, 'PLAY AGAIN', () => {
        gameState = STATE.MENU;
        showMenu();
    });
    menuContainer.addChild(playAgainBtn);
}

// Game over screen
function showGameOver() {
    gameState = STATE.GAME_OVER;

    while (menuContainer.children.length > 0) menuContainer.removeChildAt(0);

    const bg = new PIXI.Graphics();
    bg.beginFill(0x2a1a1a);
    bg.drawRect(0, 0, 800, 600);
    bg.endFill();
    menuContainer.addChild(bg);

    const title = new PIXI.Text('GAME OVER', {
        fontFamily: 'Arial',
        fontSize: 64,
        fill: 0xff4444
    });
    title.anchor.set(0.5);
    title.position.set(400, 150);
    menuContainer.addChild(title);

    const statsText = new PIXI.Text(
        `Wave: ${waveState.current}\n` +
        `Level: ${player.level}`,
        { fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'center' }
    );
    statsText.anchor.set(0.5);
    statsText.position.set(400, 300);
    menuContainer.addChild(statsText);

    const retryBtn = createButton(400, 450, 'TRY AGAIN', () => {
        gameState = STATE.MENU;
        showMenu();
    });
    menuContainer.addChild(retryBtn);
}

// Update player
function updatePlayer(delta) {
    let dx = 0, dy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    const speedMod = 1 + player.attackSpeed / 100;
    player.x += dx * player.speed * speedMod * delta;
    player.y += dy * player.speed * speedMod * delta;

    // Arena bounds
    const distFromCenter = Math.sqrt((player.x - ARENA_CENTER_X) ** 2 + (player.y - ARENA_CENTER_Y) ** 2);
    if (distFromCenter > ARENA_RADIUS - 20) {
        const angle = Math.atan2(player.y - ARENA_CENTER_Y, player.x - ARENA_CENTER_X);
        player.x = ARENA_CENTER_X + Math.cos(angle) * (ARENA_RADIUS - 20);
        player.y = ARENA_CENTER_Y + Math.sin(angle) * (ARENA_RADIUS - 20);
    }

    player.sprite.position.set(player.x, player.y);

    // Invincibility
    if (player.invincible > 0) {
        player.invincible -= delta;
        player.sprite.alpha = Math.sin(player.invincible * 20) * 0.5 + 0.5;
    } else {
        player.sprite.alpha = 1;
    }

    // Fire weapons
    player.weapons.forEach(weapon => {
        weapon.cooldown -= delta;
        if (weapon.cooldown <= 0) {
            fireWeapon(weapon);
            const def = WEAPONS[weapon.type];
            const speedMod = 1 + player.attackSpeed / 100;
            weapon.cooldown = def.cooldown / speedMod;
        }
    });

    // Pickup collection
    const pickupRange = 50;
    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        const dist = Math.sqrt((player.x - pickup.x) ** 2 + (player.y - pickup.y) ** 2);
        if (dist < pickupRange) {
            if (pickup.type === 'materials') {
                player.materials += pickup.amount;
                player.xp += pickup.amount;
            } else if (pickup.type === 'health') {
                player.health = Math.min(player.maxHealth, player.health + pickup.amount);
            }
            entityContainer.removeChild(pickup.sprite);
            pickups.splice(i, 1);
        }
    }
}

function fireWeapon(weapon) {
    if (enemies.length === 0) return;

    // Find nearest enemy
    let nearest = null;
    let nearestDist = Infinity;
    enemies.forEach(enemy => {
        const dist = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearest = enemy;
        }
    });

    if (!nearest) return;

    const def = WEAPONS[weapon.type];

    if (def.type === 'melee') {
        createMeleeAttack(def, nearest.x, nearest.y);
    } else {
        const damageMultiplier = 1 + player.damage / 100;
        const damage = def.damage * damageMultiplier;

        if (def.pellets) {
            for (let i = 0; i < def.pellets; i++) {
                const spread = (Math.random() - 0.5) * 0.5;
                const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x) + spread;
                const targetX = player.x + Math.cos(angle) * 300;
                const targetY = player.y + Math.sin(angle) * 300;
                createProjectile(player.x, player.y, targetX, targetY, damage, false, def.color);
            }
        } else {
            createProjectile(player.x, player.y, nearest.x, nearest.y, damage, false, def.color);
        }
    }
}

// Update enemies
function updateEnemies(delta) {
    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        switch (enemy.behavior) {
            case 'chase':
                if (dist > 0) {
                    enemy.x += (dx / dist) * enemy.speed * delta;
                    enemy.y += (dy / dist) * enemy.speed * delta;
                }
                break;

            case 'charge':
                enemy.chargeTimer -= delta;
                if (enemy.chargeDir) {
                    enemy.x += enemy.chargeDir.x * enemy.speed * 3 * delta;
                    enemy.y += enemy.chargeDir.y * enemy.speed * 3 * delta;
                    if (enemy.chargeTimer <= 0) {
                        enemy.chargeDir = null;
                        enemy.chargeTimer = 2 + Math.random();
                    }
                } else if (enemy.chargeTimer <= 0) {
                    enemy.chargeDir = { x: dx / dist, y: dy / dist };
                    enemy.chargeTimer = 0.5;
                } else {
                    // Slow approach
                    enemy.x += (dx / dist) * enemy.speed * 0.3 * delta;
                    enemy.y += (dy / dist) * enemy.speed * 0.3 * delta;
                }
                break;

            case 'ranged':
                enemy.shootTimer -= delta;
                if (enemy.shootTimer <= 0) {
                    createProjectile(enemy.x, enemy.y, player.x, player.y, enemy.damage, true, 0xff6666);
                    enemy.shootTimer = 2 + Math.random();
                }
                // Keep distance
                if (dist < 150) {
                    enemy.x -= (dx / dist) * enemy.speed * delta;
                    enemy.y -= (dy / dist) * enemy.speed * delta;
                } else if (dist > 250) {
                    enemy.x += (dx / dist) * enemy.speed * delta;
                    enemy.y += (dy / dist) * enemy.speed * delta;
                }
                break;
        }

        // Keep in arena
        const distFromCenter = Math.sqrt((enemy.x - ARENA_CENTER_X) ** 2 + (enemy.y - ARENA_CENTER_Y) ** 2);
        if (distFromCenter > ARENA_RADIUS - 10) {
            const angle = Math.atan2(enemy.y - ARENA_CENTER_Y, enemy.x - ARENA_CENTER_X);
            enemy.x = ARENA_CENTER_X + Math.cos(angle) * (ARENA_RADIUS - 10);
            enemy.y = ARENA_CENTER_Y + Math.sin(angle) * (ARENA_RADIUS - 10);
        }

        enemy.sprite.position.set(enemy.x, enemy.y);

        // Player collision
        const playerDist = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
        if (playerDist < enemy.size + 15 && player.invincible <= 0) {
            damagePlayer(enemy.damage);
        }
    });
}

function damagePlayer(damage) {
    const actualDamage = Math.max(1, damage - player.armor);
    player.health -= actualDamage;
    player.invincible = 1;

    if (player.health <= 0) {
        showGameOver();
    }
}

// Update projectiles
function updateProjectiles(delta) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.vx * delta;
        proj.y += proj.vy * delta;
        proj.life -= delta;
        proj.sprite.position.set(proj.x, proj.y);

        let hit = false;

        // Arena bounds
        const distFromCenter = Math.sqrt((proj.x - ARENA_CENTER_X) ** 2 + (proj.y - ARENA_CENTER_Y) ** 2);
        if (distFromCenter > ARENA_RADIUS) hit = true;

        if (proj.isEnemy) {
            // Hit player
            const playerDist = Math.sqrt((player.x - proj.x) ** 2 + (player.y - proj.y) ** 2);
            if (playerDist < 20 && player.invincible <= 0) {
                damagePlayer(proj.damage);
                hit = true;
            }
        } else {
            // Hit enemies
            for (const enemy of enemies) {
                const dist = Math.sqrt((enemy.x - proj.x) ** 2 + (enemy.y - proj.y) ** 2);
                if (dist < enemy.size) {
                    damageEnemy(enemy, proj.damage);
                    hit = true;
                    break;
                }
            }
        }

        if (hit || proj.life <= 0) {
            entityContainer.removeChild(proj.sprite);
            projectiles.splice(i, 1);
        }
    }
}

// Spawn enemies
function spawnEnemies(delta) {
    waveState.spawnTimer -= delta;
    if (waveState.spawnTimer <= 0 && enemies.length < 50) {
        const spawnRate = 0.5 + waveState.current * 0.1;
        waveState.spawnTimer = 1 / spawnRate;

        // Enemy types based on wave
        const types = ['babyAlien'];
        if (waveState.current >= 2) types.push('chaser');
        if (waveState.current >= 3) types.push('charger');
        if (waveState.current >= 4) types.push('spitter');
        if (waveState.current >= 6) types.push('bruiser');

        const type = types[Math.floor(Math.random() * types.length)];
        createEnemy(type);
    }
}

// Input handlers
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Game loop
app.ticker.add((delta) => {
    const dt = delta / 60;

    if (gameState === STATE.WAVE) {
        updatePlayer(dt);
        updateEnemies(dt);
        updateProjectiles(dt);
        spawnEnemies(dt);
        updateUI();

        // Wave timer
        waveState.timer -= dt;
        if (waveState.timer <= 0) {
            endWave();
        }
    }
});

// Initialize
showMenu();
console.log('Brotato Clone initialized');
