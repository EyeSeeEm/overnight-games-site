// Tower Wizard Clone - Incremental/Idle Game (EXPANDED)
// Canvas Version - 20 Expand + 20 Polish Passes

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Color palette
const COLORS = {
    bg: '#1a1a2e', bgLight: '#2a2a4e',
    mountain1: '#252545', mountain2: '#1e1e3e', mountain3: '#151530',
    pink: '#e8a0a0', pinkLight: '#f0b8b8', pinkDark: '#c88080', salmon: '#d4918f',
    towerPink: '#d4918f', towerLight: '#e8b0b0', towerRoof: '#c07878', towerWindow: '#2a2a4e',
    panelBg: '#0a0a1a', panelBorder: '#c88080', text: '#ffffff', textDim: '#a0a0a0',
    magic: '#9370db', knowledge: '#6495ed', wood: '#8b6b4a', spirits: '#e8a0a0',
    research: '#7cfc00', dragonXP: '#ff6600', arcaneGold: '#ffd700', runePoints: '#00ffff',
    orbDark: '#1a1a3e', orbGlow: '#ff69b4', orbHighlight: '#ffffff',
    fire: '#ff4500', wall: '#555555', damage: '#ff0000'
};

// EXPAND: Full game state with all systems
const game = {
    tick: 0,
    // Primary resources
    magic: 0, lifetimeMagic: 0,
    spirits: 0,
    knowledge: 0,
    wood: 0,
    research: 0,
    dragonXP: 0,
    arcaneGold: 0,
    runePoints: 0,
    cosmicDust: 0,

    // Tower
    towerLevel: 1,

    // EXPAND: Spirit assignments for all rooms
    assignments: {
        cloudlings: 0,
        spiritTomes: 0,
        druids: 0,
        sages: 0,
        keepers: 0,
        alchemists: 0,
        shamans: 0,
        ifrits: 0,
        runesmiths: 0
    },

    // EXPAND: Upgrades
    upgrades: {
        wizardMagic: 0,
        tomeEfficiency: 0,
        forestry: 0,
        academyResearch: 0,
        dragonTraining: 0,
        alchemyEfficiency: 0
    },

    // EXPAND: Prestige system
    prestigePoints: 0,
    lifetimePrestige: 0,
    blessings: {
        magic: false,
        knowledge: false,
        forest: false,
        research: false,
        dragon: false,
        alchemy: false,
        doubling: false
    },

    // EXPAND: Totem system
    totems: [],
    totemPoles: 0,

    // EXPAND: Dragon system
    dragon: {
        xp: 0,
        level: 0,
        abilities: []
    },

    // EXPAND: Relics
    relics: {},

    // EXPAND: Runes
    runes: { ember: 0, storm: 0, stone: 0, infinity: 0 },

    // EXPAND: Wall system
    currentWall: 0,
    wallHealth: 0,
    wallMaxHealth: 10000,
    wallDamage: 0,
    lifetimeDamage: 0,

    // UI state
    selectedRoom: 'orb',
    orbHeld: false,
    orbClickCooldown: 0,
    showPrestige: false,
    notifications: [],

    // POLISH: Particles and effects
    particles: [],
    floatingSpirits: [],
    damageNumbers: [],
    screenShake: 0
};

// Constants
const SPIRIT_COST_BASE = 10;
const SPIRIT_COST_FACTOR = 1.15;

// EXPAND: Production rates for all spirit types
const PRODUCTION_RATES = {
    cloudlings: 0.5,    // magic/sec
    spiritTomes: 0.2,   // knowledge/sec
    druids: 0.3,        // wood/sec
    sages: 0.1,         // research/sec
    keepers: 0.05,      // dragonXP/sec
    alchemists: 0.02,   // arcaneGold/sec
    runesmiths: 0.01    // runePoints/sec
};

// EXPAND: Sorcery DPS rates
const SORCERY_DPS = {
    shamans: 5,
    ifrits: 10
};

// EXPAND: Ascension costs (expanded)
const ASCENSION_COSTS = [0, 100, 1000, 10000, 50000, 200000, 1000000, 5000000, 25000000, 100000000, 500000000];

// EXPAND: Wall health values
const WALLS = [
    { name: 'Stone Wall', health: 10000, reward: 'academy' },
    { name: 'Iron Wall', health: 100000, reward: 'dragonNest' },
    { name: 'Crystal Wall', health: 1000000, reward: 'alchemyLab' },
    { name: 'Cloud Wall', health: 10000000, reward: 'runecraft' },
    { name: 'Void Wall', health: 100000000, reward: 'temple' }
];

// EXPAND: Totem types
const TOTEM_TYPES = ['magic', 'knowledge', 'forest'];

// EXPAND: Relic definitions
const RELICS = {
    manaStone: { cost: 100, effect: 'magic', value: 1.25 },
    holyGrail: { cost: 1000, effect: 'all', value: 1.5 },
    ouroboros: { cost: 10000, effect: 'damage', value: 2 }
};

// EXPAND: Blessing definitions
const BLESSING_COSTS = {
    magic: 1, knowledge: 1, forest: 1, research: 2, dragon: 2, alchemy: 2, doubling: 3
};

// Orb position constants (moved right to avoid Resources panel overlap)
const ORB_X = 300;
const ORB_Y = 150;
const ORB_RADIUS = 45;

// Input handling
let mouseX = 0, mouseY = 0, mouseDown = false;

canvas.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
canvas.addEventListener('mousedown', (e) => { mouseDown = true; handleClick(e.clientX, e.clientY); });
canvas.addEventListener('mouseup', () => { mouseDown = false; game.orbHeld = false; });

function handleClick(x, y) {
    // Orb click
    if (Math.hypot(x - ORB_X, y - ORB_Y) < ORB_RADIUS + 5) {
        clickOrb();
        game.orbHeld = true;
        return;
    }

    // Prestige panel
    if (game.showPrestige) {
        handlePrestigeClick(x, y);
        return;
    }

    checkRoomButtons(x, y);
    checkActionButtons(x, y);
}

function clickOrb() {
    if (game.orbClickCooldown > 0) return;

    const magicGain = getMagicPerClick();
    game.magic += magicGain;
    game.lifetimeMagic += magicGain;
    game.orbClickCooldown = 0.05;

    // POLISH: Enhanced particles
    createMagicParticle(ORB_X, ORB_Y);
    for (let i = 0; i < 5; i++) {
        game.particles.push({
            x: ORB_X + (Math.random() - 0.5) * 80,
            y: ORB_Y + (Math.random() - 0.5) * 80,
            vx: (Math.random() - 0.5) * 150,
            vy: -Math.random() * 150 - 50,
            life: 1,
            color: [COLORS.orbGlow, COLORS.magic, COLORS.pink][Math.floor(Math.random() * 3)],
            size: 3 + Math.random() * 4
        });
    }
}

function getMagicPerClick() {
    let base = Math.pow(2, game.upgrades.wizardMagic);
    if (game.blessings.magic) base *= 2;
    if (game.relics.manaStone) base *= 1.25;
    if (game.relics.holyGrail) base *= 1.5;
    return base;
}

function getSpiritCost() {
    let cost = Math.floor(SPIRIT_COST_BASE * Math.pow(SPIRIT_COST_FACTOR, game.spirits));
    if (game.blessings.doubling) cost *= 0.8;
    return Math.floor(cost);
}

function summonSpirit() {
    const cost = getSpiritCost();
    if (game.magic >= cost) {
        game.magic -= cost;
        game.spirits++;
        createFloatingSpirit();
        addNotification(`Summoned spirit! (${game.spirits} total)`);
        return true;
    }
    return false;
}

function getTotalAssigned() {
    return Object.values(game.assignments).reduce((a, b) => a + b, 0);
}

function assignSpirit(type) {
    if (game.spirits <= getTotalAssigned()) return false;
    if (!game.assignments.hasOwnProperty(type)) return false;

    // Check room unlock
    const unlockLevel = { cloudlings: 1, spiritTomes: 2, druids: 3, sages: 5, keepers: 6, alchemists: 7, shamans: 9, ifrits: 9, runesmiths: 10 };
    if (game.towerLevel < unlockLevel[type]) return false;

    game.assignments[type]++;
    return true;
}

function unassignSpirit(type) {
    if (game.assignments[type] > 0) {
        game.assignments[type]--;
        return true;
    }
    return false;
}

function canAscend() {
    if (game.towerLevel >= ASCENSION_COSTS.length) return false;
    return game.lifetimeMagic >= ASCENSION_COSTS[game.towerLevel];
}

function ascend() {
    if (canAscend()) {
        game.towerLevel++;
        addNotification(`Tower ascended to level ${game.towerLevel}!`);
        // POLISH: Screen effect
        game.screenShake = 0.5;
        for (let i = 0; i < 30; i++) {
            game.particles.push({
                x: 320, y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                life: 1.5, color: COLORS.orbGlow, size: 5
            });
        }
        return true;
    }
    return false;
}

// EXPAND: Prestige system
function calculatePrestigePoints() {
    const magicPoints = Math.floor(Math.log10(game.lifetimeMagic + 1));
    const damagePoints = Math.floor(Math.log10(game.lifetimeDamage + 1) * 0.5);
    return Math.max(0, magicPoints + damagePoints - game.lifetimePrestige);
}

function prestige() {
    const points = calculatePrestigePoints();
    if (points <= 0) return false;

    game.prestigePoints += points;
    game.lifetimePrestige += points;

    // Reset progress
    game.magic = 0;
    game.spirits = 0;
    game.knowledge = 0;
    game.wood = 0;
    game.research = 0;
    game.dragonXP = 0;
    game.arcaneGold = 0;
    game.runePoints = 0;
    game.towerLevel = 1;
    game.totems = [];
    game.totemPoles = 0;
    game.dragon = { xp: 0, level: 0, abilities: [] };
    game.currentWall = 0;
    game.wallHealth = 0;
    game.wallDamage = 0;

    Object.keys(game.assignments).forEach(k => game.assignments[k] = 0);
    Object.keys(game.upgrades).forEach(k => game.upgrades[k] = 0);

    game.floatingSpirits = [];
    addNotification(`Prestige! Gained ${points} points!`);
    return true;
}

function buyBlessing(type) {
    const cost = BLESSING_COSTS[type];
    if (game.prestigePoints >= cost && !game.blessings[type]) {
        game.prestigePoints -= cost;
        game.blessings[type] = true;
        addNotification(`Unlocked ${type} blessing!`);
        return true;
    }
    return false;
}

// EXPAND: Totem system
function craftTotem(type) {
    const cost = getTotemCost();
    if (game.wood >= cost && TOTEM_TYPES.includes(type)) {
        game.wood -= cost;
        game.totems.push({ type, paired: false });
        addNotification(`Crafted ${type} totem!`);
        updateTotemPairing();
        return true;
    }
    return false;
}

function getTotemCost() {
    return Math.floor(100 * Math.pow(1.5, game.totems.length));
}

function updateTotemPairing() {
    // Group totems by type and pair them
    const typeCounts = {};
    game.totems.forEach(t => {
        typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
        t.paired = false;
    });

    game.totems.forEach(t => {
        if (typeCounts[t.type] >= 2) {
            t.paired = true;
        }
    });
}

function getTotemMultiplier(resource) {
    let mult = 1;
    game.totems.forEach(t => {
        if (t.type === resource) {
            mult *= t.paired ? 2 : 1.5;
        }
    });
    return mult;
}

// EXPAND: Dragon system
function updateDragon(dt) {
    if (game.towerLevel < 6) return;

    game.dragon.xp += game.assignments.keepers * PRODUCTION_RATES.keepers * dt * getMultiplier('dragonXP');

    // Level up dragon
    const xpTable = { 10: 1000, 25: 5000, 50: 25000, 66: 50000, 75: 100000, 100: 500000 };
    for (const [level, xp] of Object.entries(xpTable)) {
        if (game.dragon.xp >= xp && game.dragon.level < Number(level)) {
            game.dragon.level = Number(level);
            addNotification(`Dragon reached level ${level}!`);
        }
    }
}

function getDragonFireballDamage() {
    if (game.dragon.level < 50) return 0;
    let base = 100 * (game.dragon.level >= 66 ? 2 : 1);
    if (game.blessings.dragon) base *= 1.5;
    if (game.relics.ouroboros) base *= 2;
    return base;
}

// EXPAND: Wall combat system
function updateWallCombat(dt) {
    if (game.towerLevel < 9) return;
    if (game.currentWall >= WALLS.length) return;

    const wall = WALLS[game.currentWall];
    if (game.wallMaxHealth !== wall.health) {
        game.wallMaxHealth = wall.health;
        game.wallHealth = wall.health;
    }

    // Calculate DPS
    let dps = 0;
    dps += game.assignments.shamans * SORCERY_DPS.shamans;
    dps += game.assignments.ifrits * SORCERY_DPS.ifrits;
    dps += getDragonFireballDamage();

    // Apply multipliers
    const runeMult = 1 + (game.runes.ember * 0.1) + (game.runes.infinity * 0.3);
    dps *= runeMult;

    const damage = dps * dt;
    game.wallHealth -= damage;
    game.wallDamage += damage;
    game.lifetimeDamage += damage;

    // POLISH: Damage numbers
    if (Math.random() < 0.1 && dps > 0) {
        game.damageNumbers.push({
            x: canvas.width - 150 + Math.random() * 100,
            y: 400, value: Math.floor(dps), life: 1
        });
    }

    // Wall defeated
    if (game.wallHealth <= 0) {
        game.currentWall++;
        addNotification(`Destroyed ${wall.name}!`);
        game.screenShake = 1;

        if (game.currentWall < WALLS.length) {
            game.wallMaxHealth = WALLS[game.currentWall].health;
            game.wallHealth = game.wallMaxHealth;
        }
    }
}

// EXPAND: Rune crafting
function craftRune(type) {
    const costs = { ember: 50, storm: 50, stone: 100, infinity: 500 };
    const maxLevels = { ember: 10, storm: 10, stone: 10, infinity: 999 };

    if (game.runePoints >= costs[type] && game.runes[type] < maxLevels[type]) {
        game.runePoints -= costs[type];
        game.runes[type]++;
        addNotification(`Crafted ${type} rune!`);
        return true;
    }
    return false;
}

// Helper functions
function getMultiplier(resource) {
    let mult = 1;

    // Blessings
    if (game.blessings[resource]) mult *= 2;

    // Totems
    mult *= getTotemMultiplier(resource);

    // Relics
    if (game.relics.holyGrail) mult *= 1.5;

    // Doubling blessing
    if (game.blessings.doubling) mult *= 1.5;

    return mult;
}

function addNotification(text) {
    game.notifications.push({ text, life: 3 });
    if (game.notifications.length > 5) game.notifications.shift();
}

function createMagicParticle(x, y) {
    for (let i = 0; i < 8; i++) {
        game.particles.push({
            x: x + (Math.random() - 0.5) * 40,
            y: y + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 80,
            vy: -Math.random() * 100 - 30,
            life: 1, color: COLORS.magic, size: 4
        });
    }
}

function createFloatingSpirit() {
    game.floatingSpirits.push({
        x: 150 + Math.random() * 150,
        y: 150 + Math.random() * 250,
        angle: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.5,
        bob: Math.random() * Math.PI * 2
    });
}

// Update function
function update(dt) {
    game.tick++;

    // Cooldowns
    if (game.orbClickCooldown > 0) game.orbClickCooldown -= dt;
    if (game.screenShake > 0) game.screenShake -= dt * 2;

    // Auto-click orb
    if (game.orbHeld && game.orbClickCooldown <= 0) clickOrb();

    // Resource generation
    const cloudlingMagic = game.assignments.cloudlings * PRODUCTION_RATES.cloudlings * dt * getMultiplier('magic');
    game.magic += cloudlingMagic;
    game.lifetimeMagic += cloudlingMagic;

    if (game.towerLevel >= 2) {
        game.knowledge += game.assignments.spiritTomes * PRODUCTION_RATES.spiritTomes * dt * getMultiplier('knowledge');
    }
    if (game.towerLevel >= 3) {
        game.wood += game.assignments.druids * PRODUCTION_RATES.druids * dt * getMultiplier('wood');
    }
    if (game.towerLevel >= 5) {
        game.research += game.assignments.sages * PRODUCTION_RATES.sages * dt * getMultiplier('research');
    }
    if (game.towerLevel >= 7) {
        game.arcaneGold += game.assignments.alchemists * PRODUCTION_RATES.alchemists * dt * getMultiplier('arcaneGold');
    }
    if (game.towerLevel >= 10) {
        game.runePoints += game.assignments.runesmiths * PRODUCTION_RATES.runesmiths * dt;
    }

    updateDragon(dt);
    updateWallCombat(dt);

    // Update particles
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 80 * dt;
        p.life -= dt * 1.5;
        if (p.life <= 0) game.particles.splice(i, 1);
    }

    // Update floating spirits
    for (const spirit of game.floatingSpirits) {
        spirit.angle += spirit.speed * dt;
        spirit.bob += dt * 2;
    }

    // Update notifications
    for (let i = game.notifications.length - 1; i >= 0; i--) {
        game.notifications[i].life -= dt;
        if (game.notifications[i].life <= 0) game.notifications.splice(i, 1);
    }

    // Update damage numbers
    for (let i = game.damageNumbers.length - 1; i >= 0; i--) {
        const dn = game.damageNumbers[i];
        dn.y -= 30 * dt;
        dn.life -= dt;
        if (dn.life <= 0) game.damageNumbers.splice(i, 1);
    }
}

// Draw functions
function draw() {
    // Screen shake
    ctx.save();
    if (game.screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * game.screenShake * 10, (Math.random() - 0.5) * game.screenShake * 10);
    }

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawStarfield();
    drawBackground();
    drawTower();
    drawOrb();
    drawFloatingSpirits();
    drawParticles();
    drawResourcePanel();
    drawActionPanel();
    drawRoomNav();
    drawNotifications();
    drawDamageNumbers();

    if (game.showPrestige) drawPrestigePanel();

    ctx.restore();
}

// POLISH: Star field
function drawStarfield() {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137 + game.tick * 0.1) % canvas.width;
        const y = (i * 97) % (canvas.height * 0.5);
        const twinkle = Math.sin(game.tick * 0.05 + i) * 0.5 + 0.5;
        ctx.globalAlpha = twinkle * 0.5;
        ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
}

function drawBackground() {
    // Mountains
    const layers = [
        { color: COLORS.mountain3, height: 0.5, offset: 0 },
        { color: COLORS.mountain2, height: 0.4, offset: 100 },
        { color: COLORS.mountain1, height: 0.3, offset: 200 }
    ];

    for (const layer of layers) {
        ctx.fillStyle = layer.color;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        for (let x = 0; x <= canvas.width; x += 20) {
            const baseY = canvas.height - canvas.height * layer.height;
            const peakY = baseY - Math.sin((x + layer.offset) * 0.01) * 100 - Math.sin((x + layer.offset) * 0.02) * 50;
            ctx.lineTo(x, peakY);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();
    }

    // Pink trees
    ctx.fillStyle = COLORS.salmon;
    for (let x = 50; x < 350; x += 40) {
        const treeHeight = 40 + Math.sin(x) * 20;
        ctx.fillStyle = COLORS.pinkDark;
        ctx.fillRect(x + 8, canvas.height - 80, 4, 20);
        ctx.fillStyle = COLORS.salmon;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - 80);
        ctx.lineTo(x + 10, canvas.height - 80 - treeHeight);
        ctx.lineTo(x + 20, canvas.height - 80);
        ctx.closePath();
        ctx.fill();
    }
}

function drawTower() {
    const towerX = 350;
    const towerBaseY = canvas.height - 100;
    const floorHeight = 70;

    // POLISH: Tower shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(towerX + 30, towerBaseY + 10, 50, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < Math.min(game.towerLevel, 11); i++) {
        const floorY = towerBaseY - i * floorHeight;
        drawTowerFloor(towerX, floorY, i);
    }

    const roofY = towerBaseY - Math.min(game.towerLevel, 11) * floorHeight;
    drawTowerRoof(towerX, roofY);
}

function drawTowerFloor(x, y, level) {
    const width = 55, height = 65;

    ctx.fillStyle = COLORS.towerPink;
    ctx.fillRect(x - width/2, y - height, width, height);

    // POLISH: Gradient effect
    ctx.fillStyle = COLORS.towerLight;
    ctx.fillRect(x - width/2, y - height, 5, height);

    ctx.fillStyle = COLORS.pinkDark;
    ctx.fillRect(x + width/2 - 5, y - height, 5, height);

    // Window with glow
    const pulse = Math.sin(game.tick * 0.05 + level) * 0.3 + 0.7;
    ctx.fillStyle = COLORS.towerWindow;
    ctx.fillRect(x - 7, y - height + 18, 14, 22);

    ctx.fillStyle = `rgba(100, 150, 200, ${pulse * 0.5})`;
    ctx.fillRect(x - 5, y - height + 20, 10, 18);

    // Floor label
    const labels = ['Orb', 'Study', 'Forest', 'Prestige', 'Academy', 'Dragon', 'Alchemy', 'Embassy', 'Sorcery', 'Runes', 'Temple'];
    ctx.fillStyle = COLORS.text;
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    if (labels[level]) ctx.fillText(labels[level], x, y - 5);
}

function drawTowerRoof(x, y) {
    ctx.fillStyle = COLORS.towerRoof;
    ctx.beginPath();
    ctx.moveTo(x - 35, y);
    ctx.lineTo(x, y - 50);
    ctx.lineTo(x + 35, y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = COLORS.towerLight;
    ctx.beginPath();
    ctx.moveTo(x - 30, y - 5);
    ctx.lineTo(x - 5, y - 40);
    ctx.lineTo(x - 5, y - 5);
    ctx.closePath();
    ctx.fill();

    // POLISH: Roof ornament
    ctx.fillStyle = COLORS.orbGlow;
    ctx.beginPath();
    ctx.arc(x, y - 55, 5, 0, Math.PI * 2);
    ctx.fill();
}

function drawOrb() {
    const orbX = ORB_X, orbY = ORB_Y, orbRadius = ORB_RADIUS;

    // POLISH: Enhanced glow
    const glowGradient = ctx.createRadialGradient(orbX, orbY, orbRadius * 0.3, orbX, orbY, orbRadius * 2.5);
    glowGradient.addColorStop(0, 'rgba(255, 105, 180, 0.4)');
    glowGradient.addColorStop(0.5, 'rgba(255, 105, 180, 0.2)');
    glowGradient.addColorStop(1, 'rgba(255, 105, 180, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbRadius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Orb body
    const orbGradient = ctx.createRadialGradient(orbX - 15, orbY - 15, 5, orbX, orbY, orbRadius);
    orbGradient.addColorStop(0, '#4a4a7e');
    orbGradient.addColorStop(0.5, COLORS.orbDark);
    orbGradient.addColorStop(1, '#0a0a1e');
    ctx.fillStyle = orbGradient;
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbRadius, 0, Math.PI * 2);
    ctx.fill();

    // POLISH: Animated stars
    ctx.fillStyle = COLORS.orbHighlight;
    for (let i = 0; i < 8; i++) {
        const angle = game.tick * 0.03 + i * Math.PI * 0.25;
        const dist = 12 + Math.sin(game.tick * 0.08 + i * 2) * 15;
        const sx = orbX + Math.cos(angle) * dist;
        const sy = orbY + Math.sin(angle) * dist;
        const size = 2 + Math.sin(game.tick * 0.1 + i) * 1;
        ctx.fillRect(sx - size/2, sy - size/2, size, size);
    }

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(orbX - 15, orbY - 15, 10, 0, Math.PI * 2);
    ctx.fill();

    // Magic per click
    ctx.fillStyle = COLORS.spirits;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`+${formatNumber(getMagicPerClick())}`, orbX, orbY - orbRadius - 15);

    ctx.fillStyle = COLORS.textDim;
    ctx.font = '11px monospace';
    ctx.fillText('Click/hold for magic', orbX, orbY + orbRadius + 20);
}

function drawFloatingSpirits() {
    for (let i = 0; i < Math.min(game.floatingSpirits.length, 30); i++) {
        const spirit = game.floatingSpirits[i];
        const bobY = Math.sin(spirit.bob) * 5;

        // POLISH: Glowing spirits
        ctx.fillStyle = 'rgba(232, 160, 160, 0.3)';
        ctx.beginPath();
        ctx.arc(spirit.x, spirit.y + bobY, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.spirits;
        ctx.beginPath();
        ctx.arc(spirit.x, spirit.y + bobY, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.panelBg;
        ctx.fillRect(spirit.x - 3, spirit.y + bobY - 2, 2, 2);
        ctx.fillRect(spirit.x + 1, spirit.y + bobY - 2, 2, 2);
    }
}

function drawParticles() {
    for (const p of game.particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawResourcePanel() {
    const panelX = 20, panelY = 20, panelW = 180, panelH = 220;

    ctx.fillStyle = COLORS.panelBg;
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Resources', panelX + 10, panelY + 20);

    ctx.font = '11px monospace';
    const resources = [
        { icon: '\u2727', name: 'Magic', value: game.magic, color: COLORS.magic },
        { icon: '\u263C', name: 'Spirits', value: `${getTotalAssigned()}/${game.spirits}`, color: COLORS.spirits },
        { icon: '\u2726', name: 'Knowledge', value: game.knowledge, color: COLORS.knowledge },
        { icon: '\u2663', name: 'Wood', value: game.wood, color: COLORS.wood },
        { icon: '\u2665', name: 'Research', value: game.research, color: COLORS.research, min: 5 },
        { icon: '\u2666', name: 'Dragon XP', value: game.dragon.xp, color: COLORS.dragonXP, min: 6 },
        { icon: '\u2605', name: 'Gold', value: game.arcaneGold, color: COLORS.arcaneGold, min: 7 },
        { icon: '\u2606', name: 'Runes', value: game.runePoints, color: COLORS.runePoints, min: 10 }
    ];

    let yOffset = 0;
    resources.forEach((res) => {
        if (res.min && game.towerLevel < res.min) return;
        const y = panelY + 42 + yOffset * 22;
        ctx.fillStyle = res.color;
        ctx.fillText(res.icon, panelX + 10, y);
        ctx.fillStyle = COLORS.text;
        const value = typeof res.value === 'number' ? formatNumber(res.value) : res.value;
        ctx.fillText(value, panelX + 30, y);
        yOffset++;
    });
}

function drawActionPanel() {
    const panelX = canvas.width - 340, panelY = 180, panelW = 320, panelH = 420;

    ctx.fillStyle = COLORS.panelBg;
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Room title
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    const roomTitles = {
        orb: 'Orb Room', study: 'Study', forest: 'Forestry', prestige: 'Prestige Chamber',
        academy: 'Academy', dragon: 'Dragon Nest', alchemy: 'Alchemy Lab',
        sorcery: 'Sorcery Chamber', runes: 'Runecraft'
    };
    ctx.fillText(roomTitles[game.selectedRoom] || 'Room', panelX + 15, panelY + 25);

    // Summon button
    const spiritCost = getSpiritCost();
    drawButton(panelX + 15, panelY + 50, 290, 35, `Summon Spirit   ${formatNumber(spiritCost)}`, game.magic >= spiritCost);

    // Room content
    const infoY = panelY + 100;
    ctx.font = '12px monospace';

    if (game.selectedRoom === 'orb') {
        drawSpiritRoom(panelX, infoY, 'cloudlings', 'Cloudlings', PRODUCTION_RATES.cloudlings, 'magic/sec');
    } else if (game.selectedRoom === 'study') {
        if (game.towerLevel < 2) {
            ctx.fillStyle = COLORS.textDim;
            ctx.fillText('Unlock at Tower Level 2', panelX + 15, infoY);
        } else {
            drawSpiritRoom(panelX, infoY, 'spiritTomes', 'Spirit Tomes', PRODUCTION_RATES.spiritTomes, 'knowledge/sec');
        }
    } else if (game.selectedRoom === 'forest') {
        if (game.towerLevel < 3) {
            ctx.fillStyle = COLORS.textDim;
            ctx.fillText('Unlock at Tower Level 3', panelX + 15, infoY);
        } else {
            drawSpiritRoom(panelX, infoY, 'druids', 'Druids', PRODUCTION_RATES.druids, 'wood/sec');
            // Totem crafting
            ctx.fillStyle = COLORS.text;
            ctx.fillText(`Totems: ${game.totems.length}`, panelX + 15, infoY + 80);
            ctx.fillText(`Next cost: ${formatNumber(getTotemCost())} wood`, panelX + 15, infoY + 100);
        }
    } else if (game.selectedRoom === 'prestige') {
        drawPrestigeRoom(panelX, infoY);
    } else if (game.selectedRoom === 'academy') {
        if (game.towerLevel < 5) {
            ctx.fillStyle = COLORS.textDim;
            ctx.fillText('Unlock at Tower Level 5', panelX + 15, infoY);
        } else {
            drawSpiritRoom(panelX, infoY, 'sages', 'Sages', PRODUCTION_RATES.sages, 'research/sec');
        }
    } else if (game.selectedRoom === 'dragon') {
        if (game.towerLevel < 6) {
            ctx.fillStyle = COLORS.textDim;
            ctx.fillText('Unlock at Tower Level 6', panelX + 15, infoY);
        } else {
            drawSpiritRoom(panelX, infoY, 'keepers', 'Keepers', PRODUCTION_RATES.keepers, 'dragonXP/sec');
            ctx.fillStyle = COLORS.dragonXP;
            ctx.fillText(`Dragon Level: ${game.dragon.level}`, panelX + 15, infoY + 80);
            ctx.fillText(`Fireball DPS: ${formatNumber(getDragonFireballDamage())}`, panelX + 15, infoY + 100);
        }
    } else if (game.selectedRoom === 'alchemy') {
        if (game.towerLevel < 7) {
            ctx.fillStyle = COLORS.textDim;
            ctx.fillText('Unlock at Tower Level 7', panelX + 15, infoY);
        } else {
            drawSpiritRoom(panelX, infoY, 'alchemists', 'Alchemists', PRODUCTION_RATES.alchemists, 'gold/sec');
        }
    } else if (game.selectedRoom === 'sorcery') {
        if (game.towerLevel < 9) {
            ctx.fillStyle = COLORS.textDim;
            ctx.fillText('Unlock at Tower Level 9', panelX + 15, infoY);
        } else {
            drawSorceryRoom(panelX, infoY);
        }
    } else if (game.selectedRoom === 'runes') {
        if (game.towerLevel < 10) {
            ctx.fillStyle = COLORS.textDim;
            ctx.fillText('Unlock at Tower Level 10', panelX + 15, infoY);
        } else {
            drawRuneRoom(panelX, infoY);
        }
    }

    // Tower info
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`Tower Level: ${game.towerLevel}`, panelX + 15, panelY + 340);

    ctx.font = '11px monospace';
    ctx.fillStyle = COLORS.textDim;
    if (game.towerLevel < ASCENSION_COSTS.length) {
        const nextCost = ASCENSION_COSTS[game.towerLevel];
        ctx.fillText(`Next: ${formatNumber(nextCost)} lifetime magic`, panelX + 15, panelY + 360);
    }

    drawButton(panelX + 15, panelY + 375, 290, 35, 'Ascend Tower', canAscend());
}

function drawSpiritRoom(panelX, infoY, type, name, rate, unit) {
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`${name}: ${game.assignments[type]}`, panelX + 15, infoY);
    const production = game.assignments[type] * rate * getMultiplier(type === 'cloudlings' ? 'magic' : type === 'spiritTomes' ? 'knowledge' : type === 'druids' ? 'wood' : type === 'sages' ? 'research' : type === 'keepers' ? 'dragonXP' : 'arcaneGold');
    ctx.fillText(`${formatNumber(production)} ${unit}`, panelX + 15, infoY + 20);

    const freeSpirits = game.spirits - getTotalAssigned();
    drawButton(panelX + 15, infoY + 35, 135, 32, 'Assign +1', freeSpirits > 0);
    drawButton(panelX + 160, infoY + 35, 135, 32, 'Remove -1', game.assignments[type] > 0);
}

function drawPrestigeRoom(panelX, infoY) {
    const points = calculatePrestigePoints();
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`Current Points: ${game.prestigePoints}`, panelX + 15, infoY);
    ctx.fillText(`Potential: +${points}`, panelX + 15, infoY + 20);

    ctx.fillStyle = COLORS.textDim;
    ctx.fillText('Prestige resets progress but', panelX + 15, infoY + 50);
    ctx.fillText('grants permanent blessings', panelX + 15, infoY + 65);

    drawButton(panelX + 15, infoY + 85, 290, 35, `PRESTIGE (+${points} pts)`, points > 0);

    // Blessings list
    ctx.fillStyle = COLORS.text;
    ctx.fillText('Blessings:', panelX + 15, infoY + 135);
    let bY = infoY + 155;
    for (const [name, cost] of Object.entries(BLESSING_COSTS)) {
        const owned = game.blessings[name];
        ctx.fillStyle = owned ? COLORS.spirits : COLORS.textDim;
        ctx.fillText(`${name} (${cost}pts) ${owned ? '\u2713' : ''}`, panelX + 15, bY);
        bY += 18;
    }
}

function drawSorceryRoom(panelX, infoY) {
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`Shamans: ${game.assignments.shamans} (${SORCERY_DPS.shamans} DPS each)`, panelX + 15, infoY);
    ctx.fillText(`Ifrits: ${game.assignments.ifrits} (${SORCERY_DPS.ifrits} DPS each)`, panelX + 15, infoY + 20);

    const freeSpirits = game.spirits - getTotalAssigned();
    drawButton(panelX + 15, infoY + 35, 70, 28, '+Shaman', freeSpirits > 0);
    drawButton(panelX + 90, infoY + 35, 70, 28, '-Shaman', game.assignments.shamans > 0);
    drawButton(panelX + 165, infoY + 35, 70, 28, '+Ifrit', freeSpirits > 0);
    drawButton(panelX + 240, infoY + 35, 70, 28, '-Ifrit', game.assignments.ifrits > 0);

    // Wall info
    if (game.currentWall < WALLS.length) {
        const wall = WALLS[game.currentWall];
        ctx.fillStyle = COLORS.wall;
        ctx.fillText(`${wall.name}`, panelX + 15, infoY + 85);
        const healthPct = game.wallHealth / game.wallMaxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(panelX + 15, infoY + 95, 290, 20);
        ctx.fillStyle = COLORS.damage;
        ctx.fillRect(panelX + 15, infoY + 95, 290 * healthPct, 20);
        ctx.fillStyle = COLORS.text;
        ctx.fillText(`${formatNumber(game.wallHealth)} / ${formatNumber(game.wallMaxHealth)}`, panelX + 100, infoY + 110);
    }
}

function drawRuneRoom(panelX, infoY) {
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`Runesmiths: ${game.assignments.runesmiths}`, panelX + 15, infoY);
    ctx.fillText(`Rune Points: ${formatNumber(game.runePoints)}`, panelX + 15, infoY + 20);

    const freeSpirits = game.spirits - getTotalAssigned();
    drawButton(panelX + 15, infoY + 35, 135, 28, '+Runesmith', freeSpirits > 0);
    drawButton(panelX + 160, infoY + 35, 135, 28, '-Runesmith', game.assignments.runesmiths > 0);

    ctx.fillText(`Ember: ${game.runes.ember} (+${game.runes.ember * 10}% fire)`, panelX + 15, infoY + 80);
    ctx.fillText(`Storm: ${game.runes.storm}`, panelX + 15, infoY + 100);
    ctx.fillText(`Infinity: ${game.runes.infinity} (+${game.runes.infinity * 30}% all)`, panelX + 15, infoY + 120);
}

function drawRoomNav() {
    const navY = canvas.height - 60;
    const rooms = [
        { id: 'orb', name: 'Orb', unlock: 1 },
        { id: 'study', name: 'Study', unlock: 2 },
        { id: 'forest', name: 'Forest', unlock: 3 },
        { id: 'prestige', name: 'Prestige', unlock: 4 },
        { id: 'academy', name: 'Academy', unlock: 5 },
        { id: 'dragon', name: 'Dragon', unlock: 6 },
        { id: 'alchemy', name: 'Alchemy', unlock: 7 },
        { id: 'sorcery', name: 'Sorcery', unlock: 9 },
        { id: 'runes', name: 'Runes', unlock: 10 }
    ];

    const startX = Math.max(10, canvas.width / 2 - (rooms.length * 80) / 2);

    rooms.forEach((room, i) => {
        const x = startX + i * 80;
        const unlocked = game.towerLevel >= room.unlock;
        const selected = game.selectedRoom === room.id;

        ctx.fillStyle = selected ? COLORS.panelBorder : (unlocked ? '#4b0082' : '#2a2a3a');
        ctx.fillRect(x, navY, 75, 40);
        ctx.strokeStyle = unlocked ? COLORS.panelBorder : '#4a4a5a';
        ctx.lineWidth = selected ? 3 : 1;
        ctx.strokeRect(x, navY, 75, 40);

        ctx.fillStyle = unlocked ? COLORS.text : COLORS.textDim;
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(room.name, x + 37, navY + 25);
    });
    ctx.textAlign = 'left';
}

function drawButton(x, y, w, h, text, enabled) {
    ctx.fillStyle = enabled ? '#4b0082' : '#2a2a3a';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = enabled ? COLORS.panelBorder : '#4a4a5a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = enabled ? COLORS.text : COLORS.textDim;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w/2, y + h/2 + 4);
    ctx.textAlign = 'left';
}

function drawNotifications() {
    for (let i = 0; i < game.notifications.length; i++) {
        const n = game.notifications[i];
        const y = canvas.height - 100 - i * 25;
        ctx.globalAlpha = Math.min(1, n.life);
        ctx.fillStyle = COLORS.orbGlow;
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(n.text, canvas.width / 2, y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
}

function drawDamageNumbers() {
    for (const dn of game.damageNumbers) {
        ctx.globalAlpha = dn.life;
        ctx.fillStyle = COLORS.damage;
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`-${formatNumber(dn.value)}`, dn.x, dn.y);
    }
    ctx.globalAlpha = 1;
}

function checkRoomButtons(x, y) {
    const navY = canvas.height - 60;
    const rooms = ['orb', 'study', 'forest', 'prestige', 'academy', 'dragon', 'alchemy', 'sorcery', 'runes'];
    const unlocks = [1, 2, 3, 4, 5, 6, 7, 9, 10];
    const startX = Math.max(10, canvas.width / 2 - (rooms.length * 80) / 2);

    rooms.forEach((room, i) => {
        const bx = startX + i * 80;
        if (x >= bx && x <= bx + 75 && y >= navY && y <= navY + 40) {
            if (game.towerLevel >= unlocks[i]) {
                game.selectedRoom = room;
            }
        }
    });
}

function checkActionButtons(x, y) {
    const panelX = canvas.width - 340;
    const panelY = 180;

    // Summon spirit
    if (x >= panelX + 15 && x <= panelX + 305 && y >= panelY + 50 && y <= panelY + 85) {
        summonSpirit();
        return;
    }

    // Room-specific buttons
    const infoY = panelY + 100;

    if (game.selectedRoom === 'orb') {
        if (y >= infoY + 35 && y <= infoY + 67) {
            if (x >= panelX + 15 && x <= panelX + 150) assignSpirit('cloudlings');
            if (x >= panelX + 160 && x <= panelX + 295) unassignSpirit('cloudlings');
        }
    } else if (game.selectedRoom === 'study' && game.towerLevel >= 2) {
        if (y >= infoY + 35 && y <= infoY + 67) {
            if (x >= panelX + 15 && x <= panelX + 150) assignSpirit('spiritTomes');
            if (x >= panelX + 160 && x <= panelX + 295) unassignSpirit('spiritTomes');
        }
    } else if (game.selectedRoom === 'forest' && game.towerLevel >= 3) {
        if (y >= infoY + 35 && y <= infoY + 67) {
            if (x >= panelX + 15 && x <= panelX + 150) assignSpirit('druids');
            if (x >= panelX + 160 && x <= panelX + 295) unassignSpirit('druids');
        }
    } else if (game.selectedRoom === 'prestige') {
        if (y >= infoY + 85 && y <= infoY + 120) {
            prestige();
        }
    } else if (game.selectedRoom === 'academy' && game.towerLevel >= 5) {
        if (y >= infoY + 35 && y <= infoY + 67) {
            if (x >= panelX + 15 && x <= panelX + 150) assignSpirit('sages');
            if (x >= panelX + 160 && x <= panelX + 295) unassignSpirit('sages');
        }
    } else if (game.selectedRoom === 'dragon' && game.towerLevel >= 6) {
        if (y >= infoY + 35 && y <= infoY + 67) {
            if (x >= panelX + 15 && x <= panelX + 150) assignSpirit('keepers');
            if (x >= panelX + 160 && x <= panelX + 295) unassignSpirit('keepers');
        }
    } else if (game.selectedRoom === 'alchemy' && game.towerLevel >= 7) {
        if (y >= infoY + 35 && y <= infoY + 67) {
            if (x >= panelX + 15 && x <= panelX + 150) assignSpirit('alchemists');
            if (x >= panelX + 160 && x <= panelX + 295) unassignSpirit('alchemists');
        }
    } else if (game.selectedRoom === 'sorcery' && game.towerLevel >= 9) {
        if (y >= infoY + 35 && y <= infoY + 63) {
            if (x >= panelX + 15 && x <= panelX + 85) assignSpirit('shamans');
            if (x >= panelX + 90 && x <= panelX + 160) unassignSpirit('shamans');
            if (x >= panelX + 165 && x <= panelX + 235) assignSpirit('ifrits');
            if (x >= panelX + 240 && x <= panelX + 310) unassignSpirit('ifrits');
        }
    } else if (game.selectedRoom === 'runes' && game.towerLevel >= 10) {
        if (y >= infoY + 35 && y <= infoY + 63) {
            if (x >= panelX + 15 && x <= panelX + 150) assignSpirit('runesmiths');
            if (x >= panelX + 160 && x <= panelX + 295) unassignSpirit('runesmiths');
        }
    }

    // Ascend button
    if (y >= panelY + 375 && y <= panelY + 410) {
        ascend();
    }
}

function handlePrestigeClick(x, y) {
    // Close prestige panel
    game.showPrestige = false;
}

function formatNumber(n) {
    if (n < 1000) return Math.floor(n).toString();
    if (n < 1000000) return (n / 1000).toFixed(1) + 'K';
    if (n < 1000000000) return (n / 1000000).toFixed(1) + 'M';
    if (n < 1000000000000) return (n / 1000000000).toFixed(1) + 'B';
    return (n / 1000000000000).toFixed(1) + 'T';
}

// Game loop
let lastTime = 0;

function gameLoop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

// Initialize
for (let i = 0; i < 5; i++) createFloatingSpirit();

requestAnimationFrame(gameLoop);

// Expose for testing
window.game = game;
window.gameState = { state: 'playing' };
