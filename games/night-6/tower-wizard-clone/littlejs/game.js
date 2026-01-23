/*
 * Tower Wizard Clone - LittleJS Implementation
 * An incremental/idle game with wizard tower progression
 */

'use strict';

// ============================================================================
// COLORS
// ============================================================================

const COLORS = {
    background: new Color(0.1, 0.1, 0.18),
    primary: new Color(1, 0.41, 0.71),        // Hot pink
    primaryDark: new Color(0.86, 0.44, 0.58), // Pale violet
    primaryLight: new Color(1, 0.71, 0.76),   // Light pink
    magic: new Color(0.58, 0.44, 0.86),       // Purple
    knowledge: new Color(0.25, 0.41, 0.88),   // Blue
    wood: new Color(0.55, 0.27, 0.07),        // Brown
    gold: new Color(1, 0.84, 0),              // Gold
    fire: new Color(1, 0.27, 0),              // Orange red
    text: new Color(1, 1, 1),
    textDim: new Color(0.63, 0.63, 0.63),
    button: new Color(0.29, 0, 0.51),
    buttonHover: new Color(0.42, 0.05, 0.68),
    panel: new Color(0.08, 0.08, 0.15, 0.95)
};

// ============================================================================
// GAME CONSTANTS
// ============================================================================

const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused'
};

const ASCENSION_REQUIREMENTS = [
    0,           // Level 1 (start)
    100,         // Level 2 - Study
    1000,        // Level 3 - Forest
    10000,       // Level 4 - Prestige
    50000,       // Level 5 - Academy
    200000,      // Level 6 - Dragon Nest
    1000000,     // Level 7 - Alchemy Lab
    5000000,     // Level 8 - Embassy
    25000000,    // Level 9 - Sorcery
    100000000,   // Level 10 - Runecraft
    500000000,   // Level 11 - Temple
    1000000000   // Level 12 - Observatory
];

const ROOMS = [
    { name: 'Orb', level: 1, spiritType: 'cloudling', resource: 'magic', baseRate: 0.5, color: COLORS.magic },
    { name: 'Study', level: 2, spiritType: 'tome', resource: 'knowledge', baseRate: 0.2, color: COLORS.knowledge },
    { name: 'Forest', level: 3, spiritType: 'druid', resource: 'wood', baseRate: 0.3, color: COLORS.wood },
    { name: 'Academy', level: 5, spiritType: 'sage', resource: 'research', baseRate: 0.1, color: new Color(0.4, 0.6, 0.9) },
    { name: 'Dragon Nest', level: 6, spiritType: 'keeper', resource: 'dragonXP', baseRate: 0.05, color: COLORS.fire },
    { name: 'Alchemy Lab', level: 7, spiritType: 'alchemist', resource: 'gold', baseRate: 0.02, color: COLORS.gold }
];

const BLESSINGS = [
    { id: 'magic', name: 'Magic', cost: 1, effect: 'magic', multiplier: 2, tier: 1 },
    { id: 'knowledge', name: 'Knowledge', cost: 1, effect: 'knowledge', multiplier: 2, tier: 1 },
    { id: 'forest', name: 'Forest', cost: 1, effect: 'wood', multiplier: 2, tier: 1 },
    { id: 'research', name: 'Research', cost: 2, effect: 'research', multiplier: 1.5, tier: 2 },
    { id: 'dragon', name: 'Dragon', cost: 2, effect: 'dragonXP', multiplier: 1.5, tier: 2 },
    { id: 'alchemy', name: 'Alchemy', cost: 2, effect: 'gold', multiplier: 1.5, tier: 2 },
    { id: 'doubling', name: 'Doubling', cost: 3, effect: 'spirits', multiplier: 2, tier: 3 }
];

// ============================================================================
// GAME STATE
// ============================================================================

let currentGameState = GameState.MENU;
let gameData = null;
let floatingTexts = [];
let particles = [];
let orbPulse = 0;
let selectedRoom = 0;
let showPrestigePanel = false;
let lastClickTime = 0;
let clickCombo = 0;
let orbHeld = false;
let holdTimer = 0;

// UI state
let uiButtons = [];
let uiMouseX = 0;
let uiMouseY = 0;
let screenShake = 0;
let magicPerSecond = 0;
let lastSecondMagic = 0;
let lastMagicCheck = 0;

// ============================================================================
// GAME DATA CLASS
// ============================================================================

class GameData {
    constructor() {
        // Resources
        this.magic = 0;
        this.lifetimeMagic = 0;
        this.spirits = 0;
        this.unassignedSpirits = 0;
        this.knowledge = 0;
        this.wood = 0;
        this.research = 0;
        this.dragonXP = 0;
        this.gold = 0;

        // Spirit assignments
        this.assignments = {
            cloudling: 0,
            tome: 0,
            druid: 0,
            sage: 0,
            keeper: 0,
            alchemist: 0
        };

        // Progression
        this.towerLevel = 1;
        this.prestigePoints = 0;
        this.lifetimePrestige = 0;
        this.blessings = {};
        this.totems = [];

        // Upgrades
        this.wizardMagicLevel = 0;
        this.spiritEfficiency = 1;

        // Dragon
        this.dragonLevel = 0;

        // Stats
        this.totalClicks = 0;
        this.playTime = 0;
        this.prestigeCount = 0;
    }

    getSpiritCost() {
        const total = this.spirits;
        return Math.floor(10 * Math.pow(1.15, total));
    }

    getWizardMagicCost() {
        return Math.floor(50 * Math.pow(2, this.wizardMagicLevel));
    }

    getMagicMultiplier() {
        let mult = Math.pow(2, this.wizardMagicLevel);
        if (this.blessings.magic) mult *= BLESSINGS.find(b => b.id === 'magic').multiplier;
        return mult;
    }

    getResourceMultiplier(resource) {
        let mult = 1;
        const blessing = BLESSINGS.find(b => b.effect === resource && this.blessings[b.id]);
        if (blessing) mult *= blessing.multiplier;
        if (this.blessings.doubling) mult *= 2;
        return mult;
    }

    canAscend() {
        if (this.towerLevel >= ASCENSION_REQUIREMENTS.length) return false;
        return this.lifetimeMagic >= ASCENSION_REQUIREMENTS[this.towerLevel];
    }

    calculatePrestigePoints() {
        const magicPoints = Math.floor(Math.log10(this.lifetimeMagic + 1));
        return Math.max(0, magicPoints - 3);
    }

    getUnlockedRooms() {
        return ROOMS.filter(r => r.level <= this.towerLevel);
    }

    save() {
        localStorage.setItem('towerWizardSave', JSON.stringify(this));
    }

    load() {
        const data = localStorage.getItem('towerWizardSave');
        if (data) {
            Object.assign(this, JSON.parse(data));
            return true;
        }
        return false;
    }
}

// ============================================================================
// FLOATING TEXT
// ============================================================================

class FloatingText {
    constructor(x, y, text, color, size = 16) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.size = size;
        this.life = 1.5;
        this.maxLife = 1.5;
        this.vy = -40;
    }

    update(dt) {
        this.y += this.vy * dt;
        this.vy *= 0.98;
        this.life -= dt;
        return this.life > 0;
    }

    render(ctx) {
        const alpha = Math.min(1, this.life / 0.5);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgba(${Math.floor(this.color.r * 255)}, ${Math.floor(this.color.g * 255)}, ${Math.floor(this.color.b * 255)}, ${alpha})`;
        ctx.font = `bold ${this.size}px 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

// ============================================================================
// MAGIC PARTICLE
// ============================================================================

class MagicParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 100;
        this.vy = (Math.random() - 0.5) * 100 - 50;
        this.life = 0.5 + Math.random() * 0.5;
        this.size = 3 + Math.random() * 4;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 100 * dt;
        this.life -= dt;
        this.size *= 0.98;
        return this.life > 0;
    }

    render(ctx) {
        const alpha = Math.min(1, this.life * 2);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgba(${Math.floor(this.color.r * 255)}, ${Math.floor(this.color.g * 255)}, ${Math.floor(this.color.b * 255)}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ============================================================================
// UI BUTTON
// ============================================================================

class GameUIButton {
    constructor(x, y, width, height, text, callback, enabled = true) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.callback = callback;
        this.enabled = enabled;
        this.hovered = false;
    }

    contains(mx, my) {
        return mx >= this.x && mx <= this.x + this.width &&
               my >= this.y && my <= this.y + this.height;
    }

    render(ctx) {
        const color = !this.enabled ? COLORS.textDim :
                      this.hovered ? COLORS.buttonHover : COLORS.button;

        // Button background
        ctx.fillStyle = `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 5);
        ctx.fill();

        // Border
        ctx.strokeStyle = this.enabled ? `rgb(${Math.floor(COLORS.primary.r * 255)}, ${Math.floor(COLORS.primary.g * 255)}, ${Math.floor(COLORS.primary.b * 255)})` : '#555';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text
        ctx.fillStyle = this.enabled ? '#fff' : '#888';
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num).toString();
}

function spawnFloatingText(x, y, text, color, size) {
    floatingTexts.push(new FloatingText(x, y, text, color, size));
}

function spawnParticles(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
        particles.push(new MagicParticle(x, y, color));
    }
}

// ============================================================================
// GAME ACTIONS
// ============================================================================

function clickOrb() {
    if (!gameData) return;

    const now = Date.now();
    if (now - lastClickTime < 100) {
        clickCombo++;
    } else {
        clickCombo = 1;
    }
    lastClickTime = now;

    const baseMagic = 1;
    const mult = gameData.getMagicMultiplier();
    const holdBonus = orbHeld ? 1.35 : 1;
    const comboBonus = 1 + Math.min(clickCombo * 0.1, 1);

    const gained = baseMagic * mult * holdBonus * comboBonus;
    gameData.magic += gained;
    gameData.lifetimeMagic += gained;
    gameData.totalClicks++;

    // Visual feedback
    const orbX = 400;
    const orbY = 200;
    spawnFloatingText(
        orbX + (Math.random() - 0.5) * 60,
        orbY - 30,
        '+' + formatNumber(gained),
        COLORS.magic,
        16 + Math.min(clickCombo, 10)
    );
    spawnParticles(orbX, orbY, COLORS.magic, 5 + Math.floor(clickCombo / 2));

    orbPulse = 1;
    screenShake = Math.min(screenShake + 0.15 + clickCombo * 0.02, 0.6);

    if (window.testHarness) {
        window.testHarness.logEvent('orb_click', { magic: gained, combo: clickCombo });
    }
}

function summonSpirit() {
    if (!gameData) return;

    const cost = gameData.getSpiritCost();
    if (gameData.magic >= cost) {
        gameData.magic -= cost;
        gameData.spirits++;
        gameData.unassignedSpirits++;
        spawnFloatingText(400, 350, '+1 Spirit!', COLORS.primary, 24);
        spawnParticles(400, 350, COLORS.primary, 15);
        spawnParticles(400, 350, COLORS.primaryLight, 10);
        screenShake = Math.min(screenShake + 0.3, 0.8);
        orbPulse = 0.5;

        if (window.testHarness) {
            window.testHarness.logEvent('spirit_summoned', { total: gameData.spirits });
        }
    }
}

function assignSpirit(roomIndex, amount = 1) {
    if (!gameData) return;

    const room = ROOMS[roomIndex];
    if (!room || room.level > gameData.towerLevel) return;

    const toAssign = Math.min(amount, gameData.unassignedSpirits);
    if (toAssign > 0) {
        gameData.assignments[room.spiritType] += toAssign;
        gameData.unassignedSpirits -= toAssign;
    }
}

function unassignSpirit(roomIndex, amount = 1) {
    if (!gameData) return;

    const room = ROOMS[roomIndex];
    if (!room) return;

    const toUnassign = Math.min(amount, gameData.assignments[room.spiritType]);
    if (toUnassign > 0) {
        gameData.assignments[room.spiritType] -= toUnassign;
        gameData.unassignedSpirits += toUnassign;
    }
}

function upgradeWizardMagic() {
    if (!gameData) return;

    const cost = gameData.getWizardMagicCost();
    if (gameData.magic >= cost) {
        gameData.magic -= cost;
        gameData.wizardMagicLevel++;
        spawnFloatingText(400, 150, 'Magic Power Up!', COLORS.primary, 24);
        spawnParticles(400, 150, COLORS.primary, 15);
    }
}

function ascendTower() {
    if (!gameData || !gameData.canAscend()) return;

    gameData.towerLevel++;
    spawnFloatingText(400, 100, 'TOWER ASCENDED!', COLORS.gold, 28);
    spawnParticles(400, 100, COLORS.gold, 20);

    if (window.testHarness) {
        window.testHarness.logEvent('tower_ascend', { level: gameData.towerLevel });
    }
}

function prestige() {
    if (!gameData) return;

    const points = gameData.calculatePrestigePoints();
    if (points <= 0) return;

    gameData.prestigePoints += points;
    gameData.lifetimePrestige += points;
    gameData.prestigeCount++;

    // Reset
    gameData.magic = 0;
    gameData.lifetimeMagic = 0;
    gameData.spirits = 0;
    gameData.unassignedSpirits = 0;
    gameData.knowledge = 0;
    gameData.wood = 0;
    gameData.research = 0;
    gameData.dragonXP = 0;
    gameData.gold = 0;
    gameData.assignments = { cloudling: 0, tome: 0, druid: 0, sage: 0, keeper: 0, alchemist: 0 };
    gameData.towerLevel = 1;
    gameData.wizardMagicLevel = 0;
    gameData.totems = [];

    showPrestigePanel = false;

    spawnFloatingText(400, 200, '+' + points + ' PRESTIGE POINTS!', COLORS.gold, 32);
    spawnParticles(400, 200, COLORS.gold, 30);

    if (window.testHarness) {
        window.testHarness.logEvent('prestige', { points, total: gameData.prestigePoints });
    }
}

function buyBlessing(blessingId) {
    if (!gameData) return;

    const blessing = BLESSINGS.find(b => b.id === blessingId);
    if (!blessing || gameData.blessings[blessingId]) return;

    if (gameData.prestigePoints >= blessing.cost) {
        gameData.prestigePoints -= blessing.cost;
        gameData.blessings[blessingId] = true;
        spawnFloatingText(400, 300, blessing.name + ' Blessing!', COLORS.gold, 24);
    }
}

// ============================================================================
// RESOURCE GENERATION
// ============================================================================

function updateResources(dt) {
    if (!gameData || currentGameState !== GameState.PLAYING) return;

    // Generate resources from spirits
    for (const room of ROOMS) {
        if (room.level > gameData.towerLevel) continue;

        const spiritCount = gameData.assignments[room.spiritType] || 0;
        if (spiritCount <= 0) continue;

        const baseProduction = spiritCount * room.baseRate;
        const mult = gameData.getResourceMultiplier(room.resource);
        const production = baseProduction * mult * dt;

        switch (room.resource) {
            case 'magic':
                gameData.magic += production;
                gameData.lifetimeMagic += production;
                break;
            case 'knowledge':
                gameData.knowledge += production;
                break;
            case 'wood':
                gameData.wood += production;
                break;
            case 'research':
                gameData.research += production;
                break;
            case 'dragonXP':
                gameData.dragonXP += production;
                updateDragonLevel();
                break;
            case 'gold':
                gameData.gold += production;
                break;
        }
    }

    // Auto-click from cloudlings
    if (orbHeld && gameData.assignments.cloudling > 0) {
        holdTimer += dt;
        if (holdTimer >= 0.1) {
            holdTimer = 0;
            clickOrb();
        }
    }
}

function updateDragonLevel() {
    if (!gameData) return;

    const xpTable = [0, 1000, 5000, 25000, 50000, 100000, 500000];
    for (let i = xpTable.length - 1; i >= 0; i--) {
        if (gameData.dragonXP >= xpTable[i]) {
            if (gameData.dragonLevel < i * 10) {
                gameData.dragonLevel = i * 10;
            }
            break;
        }
    }
}

// ============================================================================
// GAME INIT
// ============================================================================

function gameInit() {
    gameData = new GameData();

    // Try loading saved game
    if (!gameData.load()) {
        currentGameState = GameState.MENU;
    } else {
        currentGameState = GameState.PLAYING;
    }

    // Set canvas size
    canvasFixedSize = vec2(800, 600);
}

// ============================================================================
// GAME UPDATE
// ============================================================================

function gameUpdate() {
    const dt = 1 / 60;

    if (currentGameState === GameState.MENU) {
        if (keyWasPressed('Space') || keyWasPressed(' ')) {
            currentGameState = GameState.PLAYING;
            if (window.testHarness) {
                window.testHarness.logEvent('game_start', {});
            }
        }
        return;
    }

    if (currentGameState === GameState.PLAYING) {
        // Update resources
        updateResources(dt);

        // Update orb pulse
        if (orbPulse > 0) {
            orbPulse -= dt * 3;
        }

        // Update screen shake
        if (screenShake > 0) {
            screenShake *= 0.9;
            if (screenShake < 0.01) screenShake = 0;
        }

        // Track magic per second
        const now = Date.now();
        if (now - lastMagicCheck >= 1000) {
            magicPerSecond = gameData.magic - lastSecondMagic;
            lastSecondMagic = gameData.magic;
            lastMagicCheck = now;
        }

        // Track orb holding
        orbHeld = mouseIsDown(0) && isMouseOverOrb();

        // Check orb click
        if (mouseWasPressed(0) && isMouseOverOrb()) {
            clickOrb();
        }

        // Update play time
        gameData.playTime += dt;

        // Auto-save every 30 seconds
        if (Math.floor(gameData.playTime) % 30 === 0 && Math.floor(gameData.playTime) !== Math.floor(gameData.playTime - dt)) {
            gameData.save();
        }
    }

    // Update floating texts
    floatingTexts = floatingTexts.filter(ft => ft.update(dt));

    // Update particles
    particles = particles.filter(p => p.update(dt));
}

function isMouseOverOrb() {
    const orbX = 400;
    const orbY = 200;
    const orbRadius = 50;
    const mx = mousePos.x * 800 / mainCanvas.width + 400;
    const my = 300 - mousePos.y * 600 / mainCanvas.height;
    const dx = mx - orbX;
    const dy = my - orbY;
    return (dx * dx + dy * dy) <= orbRadius * orbRadius;
}

function gameUpdatePost() {}

// ============================================================================
// RENDERING
// ============================================================================

function gameRender() {}

function gameRenderPost() {
    const ctx = mainContext || overlayContext || mainCanvas?.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // Clear background
    ctx.fillStyle = `rgb(${Math.floor(COLORS.background.r * 255)}, ${Math.floor(COLORS.background.g * 255)}, ${Math.floor(COLORS.background.b * 255)})`;
    ctx.fillRect(0, 0, 800, 600);

    if (currentGameState === GameState.MENU) {
        renderMenu(ctx);
    } else if (currentGameState === GameState.PLAYING) {
        renderGame(ctx);
    }

    // Render floating texts
    for (const ft of floatingTexts) {
        ft.render(ctx);
    }

    // Render particles
    for (const p of particles) {
        p.render(ctx);
    }

    ctx.restore();
}

function renderMenu(ctx) {
    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TOWER WIZARD', 400, 200);

    // Subtitle
    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.fillStyle = `rgb(${Math.floor(COLORS.primary.r * 255)}, ${Math.floor(COLORS.primary.g * 255)}, ${Math.floor(COLORS.primary.b * 255)})`;
    ctx.fillText('An Incremental Adventure', 400, 250);

    // Start prompt
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press SPACE to start', 400, 350);

    // Controls info
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('Click the orb to generate magic', 400, 450);
    ctx.fillText('Summon spirits and assign them to rooms', 400, 470);
    ctx.fillText('Ascend the tower to unlock new mechanics', 400, 490);
}

function renderGame(ctx) {
    // Apply screen shake
    if (screenShake > 0) {
        ctx.translate(
            (Math.random() - 0.5) * screenShake * 10,
            (Math.random() - 0.5) * screenShake * 10
        );
    }

    // Tower view (left side)
    renderTower(ctx);

    // Resource bar (top)
    renderResourceBar(ctx);

    // Orb area (center)
    renderOrb(ctx);

    // Room panel (right side)
    renderRoomPanel(ctx);

    // Bottom buttons
    renderBottomButtons(ctx);

    // Prestige panel (if open)
    if (showPrestigePanel) {
        renderPrestigePanel(ctx);
    }
}

function renderResourceBar(ctx) {
    const y = 10;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 800, 50);

    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';

    // Magic
    ctx.fillStyle = `rgb(${Math.floor(COLORS.magic.r * 255)}, ${Math.floor(COLORS.magic.g * 255)}, ${Math.floor(COLORS.magic.b * 255)})`;
    ctx.fillText('✨ ' + formatNumber(gameData.magic), 20, y + 20);
    if (magicPerSecond > 0) {
        ctx.fillStyle = '#88CC88';
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.fillText('+' + formatNumber(magicPerSecond) + '/s', 20, y + 35);
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
    }

    // Spirits
    ctx.fillStyle = `rgb(${Math.floor(COLORS.primary.r * 255)}, ${Math.floor(COLORS.primary.g * 255)}, ${Math.floor(COLORS.primary.b * 255)})`;
    ctx.fillText('👻 ' + gameData.spirits + ' (' + gameData.unassignedSpirits + ' free)', 150, y + 20);

    // Knowledge
    if (gameData.towerLevel >= 2) {
        ctx.fillStyle = `rgb(${Math.floor(COLORS.knowledge.r * 255)}, ${Math.floor(COLORS.knowledge.g * 255)}, ${Math.floor(COLORS.knowledge.b * 255)})`;
        ctx.fillText('📚 ' + formatNumber(gameData.knowledge), 320, y + 20);
    }

    // Wood
    if (gameData.towerLevel >= 3) {
        ctx.fillStyle = `rgb(${Math.floor(COLORS.wood.r * 255)}, ${Math.floor(COLORS.wood.g * 255)}, ${Math.floor(COLORS.wood.b * 255)})`;
        ctx.fillText('🪵 ' + formatNumber(gameData.wood), 440, y + 20);
    }

    // Prestige
    ctx.fillStyle = `rgb(${Math.floor(COLORS.gold.r * 255)}, ${Math.floor(COLORS.gold.g * 255)}, ${Math.floor(COLORS.gold.b * 255)})`;
    ctx.fillText('⭐ ' + gameData.prestigePoints + ' PP', 650, y + 20);

    // Tower level
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText('Tower Lv.' + gameData.towerLevel, 780, y + 40);
}

function renderTower(ctx) {
    const x = 50;
    const y = 80;
    const width = 120;
    const floorHeight = 40;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x - 10, y - 10, width + 20, 400);

    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';

    for (let i = 0; i < Math.min(gameData.towerLevel, 8); i++) {
        const floorY = y + (7 - i) * floorHeight;
        const room = ROOMS[i];

        // Floor background
        if (room) {
            ctx.fillStyle = `rgba(${Math.floor(room.color.r * 255)}, ${Math.floor(room.color.g * 255)}, ${Math.floor(room.color.b * 255)}, 0.3)`;
        } else {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        }
        ctx.fillRect(x, floorY, width, floorHeight - 2);

        // Floor border
        ctx.strokeStyle = selectedRoom === i ? '#fff' : '#555';
        ctx.lineWidth = selectedRoom === i ? 2 : 1;
        ctx.strokeRect(x, floorY, width, floorHeight - 2);

        // Floor label
        ctx.fillStyle = '#fff';
        ctx.fillText(room ? room.name : 'Floor ' + (i + 1), x + width / 2, floorY + floorHeight / 2 + 4);
    }

    // Ascension indicator
    if (gameData.canAscend()) {
        ctx.fillStyle = `rgb(${Math.floor(COLORS.gold.r * 255)}, ${Math.floor(COLORS.gold.g * 255)}, ${Math.floor(COLORS.gold.b * 255)})`;
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.fillText('ASCEND!', x + width / 2, y - 20);
    }
}

function renderOrb(ctx) {
    const orbX = 400;
    const orbY = 200;
    const baseRadius = 50;
    const pulseRadius = baseRadius + orbPulse * 15;

    // Glow effect
    const gradient = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, pulseRadius * 1.5);
    gradient.addColorStop(0, `rgba(${Math.floor(COLORS.magic.r * 255)}, ${Math.floor(COLORS.magic.g * 255)}, ${Math.floor(COLORS.magic.b * 255)}, 0.5)`);
    gradient.addColorStop(0.5, `rgba(${Math.floor(COLORS.magic.r * 255)}, ${Math.floor(COLORS.magic.g * 255)}, ${Math.floor(COLORS.magic.b * 255)}, 0.2)`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(orbX, orbY, pulseRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Orb
    const orbGradient = ctx.createRadialGradient(orbX - 15, orbY - 15, 0, orbX, orbY, pulseRadius);
    orbGradient.addColorStop(0, `rgb(${Math.floor(COLORS.primaryLight.r * 255)}, ${Math.floor(COLORS.primaryLight.g * 255)}, ${Math.floor(COLORS.primaryLight.b * 255)})`);
    orbGradient.addColorStop(0.5, `rgb(${Math.floor(COLORS.magic.r * 255)}, ${Math.floor(COLORS.magic.g * 255)}, ${Math.floor(COLORS.magic.b * 255)})`);
    orbGradient.addColorStop(1, `rgb(${Math.floor(COLORS.primary.r * 255)}, ${Math.floor(COLORS.primary.g * 255)}, ${Math.floor(COLORS.primary.b * 255)})`);
    ctx.fillStyle = orbGradient;
    ctx.beginPath();
    ctx.arc(orbX, orbY, pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Orb border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(orbX, orbY, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Click instruction
    ctx.fillStyle = '#aaa';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Click to generate magic', orbX, orbY + 80);

    // Click multiplier display
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillText('x' + gameData.getMagicMultiplier().toFixed(1), orbX, orbY + 100);
}

function renderRoomPanel(ctx) {
    const x = 500;
    const y = 80;
    const width = 280;
    const height = 300;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 10);
    ctx.fill();

    const room = ROOMS[selectedRoom];
    if (!room) return;

    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(room.name, x + 15, y + 30);

    if (room.level > gameData.towerLevel) {
        ctx.fillStyle = '#888';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('Requires Tower Level ' + room.level, x + 15, y + 60);
        return;
    }

    // Spirit count
    const count = gameData.assignments[room.spiritType] || 0;
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('Assigned: ' + count + ' spirits', x + 15, y + 60);

    // Production rate
    const rate = count * room.baseRate * gameData.getResourceMultiplier(room.resource);
    ctx.fillStyle = `rgb(${Math.floor(room.color.r * 255)}, ${Math.floor(room.color.g * 255)}, ${Math.floor(room.color.b * 255)})`;
    ctx.fillText(room.resource + '/sec: ' + rate.toFixed(2), x + 15, y + 85);

    // Assignment buttons
    renderAssignButtons(ctx, x + 15, y + 110);
}

function renderAssignButtons(ctx, x, y) {
    const buttonW = 60;
    const buttonH = 30;
    const mx = mousePos.x * 800 / mainCanvas.width + 400;
    const my = 300 - mousePos.y * 600 / mainCanvas.height;

    // +1 button
    const btn1X = x;
    const btn1Hover = mx >= btn1X && mx <= btn1X + buttonW && my >= y && my <= y + buttonH;
    ctx.fillStyle = btn1Hover ? `rgb(${Math.floor(COLORS.buttonHover.r * 255)}, ${Math.floor(COLORS.buttonHover.g * 255)}, ${Math.floor(COLORS.buttonHover.b * 255)})` : `rgb(${Math.floor(COLORS.button.r * 255)}, ${Math.floor(COLORS.button.g * 255)}, ${Math.floor(COLORS.button.b * 255)})`;
    ctx.beginPath();
    ctx.roundRect(btn1X, y, buttonW, buttonH, 5);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('+1', btn1X + buttonW / 2, y + buttonH / 2 + 5);

    // +10 button
    const btn10X = x + 70;
    const btn10Hover = mx >= btn10X && mx <= btn10X + buttonW && my >= y && my <= y + buttonH;
    ctx.fillStyle = btn10Hover ? `rgb(${Math.floor(COLORS.buttonHover.r * 255)}, ${Math.floor(COLORS.buttonHover.g * 255)}, ${Math.floor(COLORS.buttonHover.b * 255)})` : `rgb(${Math.floor(COLORS.button.r * 255)}, ${Math.floor(COLORS.button.g * 255)}, ${Math.floor(COLORS.button.b * 255)})`;
    ctx.beginPath();
    ctx.roundRect(btn10X, y, buttonW, buttonH, 5);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('+10', btn10X + buttonW / 2, y + buttonH / 2 + 5);

    // -1 button
    const btnM1X = x + 140;
    const btnM1Hover = mx >= btnM1X && mx <= btnM1X + buttonW && my >= y && my <= y + buttonH;
    ctx.fillStyle = btnM1Hover ? `rgb(${Math.floor(COLORS.buttonHover.r * 255)}, ${Math.floor(COLORS.buttonHover.g * 255)}, ${Math.floor(COLORS.buttonHover.b * 255)})` : `rgb(${Math.floor(COLORS.button.r * 255)}, ${Math.floor(COLORS.button.g * 255)}, ${Math.floor(COLORS.button.b * 255)})`;
    ctx.beginPath();
    ctx.roundRect(btnM1X, y, buttonW, buttonH, 5);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('-1', btnM1X + buttonW / 2, y + buttonH / 2 + 5);

    // Handle clicks
    if (mouseWasPressed(0)) {
        if (btn1Hover) assignSpirit(selectedRoom, 1);
        else if (btn10Hover) assignSpirit(selectedRoom, 10);
        else if (btnM1Hover) unassignSpirit(selectedRoom, 1);
    }
}

function renderBottomButtons(ctx) {
    const y = 500;
    const buttonW = 140;
    const buttonH = 40;
    const mx = mousePos.x * 800 / mainCanvas.width + 400;
    const my = 300 - mousePos.y * 600 / mainCanvas.height;

    // Summon Spirit button
    const summonX = 50;
    const summonCost = gameData.getSpiritCost();
    const canSummon = gameData.magic >= summonCost;
    const summonHover = mx >= summonX && mx <= summonX + buttonW && my >= y && my <= y + buttonH;

    ctx.fillStyle = !canSummon ? '#333' :
                    summonHover ? `rgb(${Math.floor(COLORS.buttonHover.r * 255)}, ${Math.floor(COLORS.buttonHover.g * 255)}, ${Math.floor(COLORS.buttonHover.b * 255)})` :
                    `rgb(${Math.floor(COLORS.button.r * 255)}, ${Math.floor(COLORS.button.g * 255)}, ${Math.floor(COLORS.button.b * 255)})`;
    ctx.beginPath();
    ctx.roundRect(summonX, y, buttonW, buttonH, 5);
    ctx.fill();

    ctx.fillStyle = canSummon ? '#fff' : '#666';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Summon Spirit', summonX + buttonW / 2, y + 18);
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillText(formatNumber(summonCost) + ' magic', summonX + buttonW / 2, y + 32);

    if (mouseWasPressed(0) && summonHover && canSummon) {
        summonSpirit();
    }

    // Wizard Magic button
    const wizardX = 210;
    const wizardCost = gameData.getWizardMagicCost();
    const canWizard = gameData.magic >= wizardCost;
    const wizardHover = mx >= wizardX && mx <= wizardX + buttonW && my >= y && my <= y + buttonH;

    ctx.fillStyle = !canWizard ? '#333' :
                    wizardHover ? `rgb(${Math.floor(COLORS.buttonHover.r * 255)}, ${Math.floor(COLORS.buttonHover.g * 255)}, ${Math.floor(COLORS.buttonHover.b * 255)})` :
                    `rgb(${Math.floor(COLORS.button.r * 255)}, ${Math.floor(COLORS.button.g * 255)}, ${Math.floor(COLORS.button.b * 255)})`;
    ctx.beginPath();
    ctx.roundRect(wizardX, y, buttonW, buttonH, 5);
    ctx.fill();

    ctx.fillStyle = canWizard ? '#fff' : '#666';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText('Wizard Magic (' + gameData.wizardMagicLevel + ')', wizardX + buttonW / 2, y + 18);
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillText(formatNumber(wizardCost) + ' magic', wizardX + buttonW / 2, y + 32);

    if (mouseWasPressed(0) && wizardHover && canWizard) {
        upgradeWizardMagic();
    }

    // Ascend button
    const ascendX = 370;
    const canAscend = gameData.canAscend();
    const ascendHover = mx >= ascendX && mx <= ascendX + buttonW && my >= y && my <= y + buttonH;

    ctx.fillStyle = !canAscend ? '#333' :
                    ascendHover ? `rgb(${Math.floor(COLORS.gold.r * 255)}, ${Math.floor(COLORS.gold.g * 255)}, ${Math.floor(COLORS.gold.b * 255)})` :
                    `rgb(${Math.floor(COLORS.buttonHover.r * 255)}, ${Math.floor(COLORS.buttonHover.g * 255)}, ${Math.floor(COLORS.buttonHover.b * 255)})`;
    ctx.beginPath();
    ctx.roundRect(ascendX, y, buttonW, buttonH, 5);
    ctx.fill();

    ctx.fillStyle = canAscend ? '#000' : '#666';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText('Ascend Tower', ascendX + buttonW / 2, y + 18);
    ctx.font = '10px "Segoe UI", sans-serif';
    const nextReq = ASCENSION_REQUIREMENTS[gameData.towerLevel] || 'MAX';
    ctx.fillText(typeof nextReq === 'number' ? formatNumber(nextReq) + ' total' : nextReq, ascendX + buttonW / 2, y + 32);

    if (mouseWasPressed(0) && ascendHover && canAscend) {
        ascendTower();
    }

    // Prestige button
    const prestigeX = 530;
    const prestigePoints = gameData.calculatePrestigePoints();
    const canPrestige = prestigePoints > 0 && gameData.towerLevel >= 4;
    const prestigeHover = mx >= prestigeX && mx <= prestigeX + buttonW && my >= y && my <= y + buttonH;

    ctx.fillStyle = !canPrestige ? '#333' :
                    prestigeHover ? `rgb(${Math.floor(COLORS.gold.r * 255)}, ${Math.floor(COLORS.gold.g * 255)}, ${Math.floor(COLORS.gold.b * 255)})` :
                    `rgb(${Math.floor(COLORS.button.r * 255)}, ${Math.floor(COLORS.button.g * 255)}, ${Math.floor(COLORS.button.b * 255)})`;
    ctx.beginPath();
    ctx.roundRect(prestigeX, y, buttonW, buttonH, 5);
    ctx.fill();

    ctx.fillStyle = canPrestige ? '#fff' : '#666';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText('Prestige', prestigeX + buttonW / 2, y + 18);
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillText('+' + prestigePoints + ' points', prestigeX + buttonW / 2, y + 32);

    if (mouseWasPressed(0) && prestigeHover && canPrestige) {
        showPrestigePanel = true;
    }

    // Room selection buttons
    renderRoomTabs(ctx);
}

function renderRoomTabs(ctx) {
    const y = 450;
    const tabW = 80;
    const tabH = 30;
    const mx = mousePos.x * 800 / mainCanvas.width + 400;
    const my = 300 - mousePos.y * 600 / mainCanvas.height;

    const unlockedRooms = gameData.getUnlockedRooms();

    for (let i = 0; i < unlockedRooms.length; i++) {
        const room = unlockedRooms[i];
        const x = 200 + i * (tabW + 5);
        const hover = mx >= x && mx <= x + tabW && my >= y && my <= y + tabH;
        const selected = selectedRoom === i;

        ctx.fillStyle = selected ? `rgb(${Math.floor(room.color.r * 255)}, ${Math.floor(room.color.g * 255)}, ${Math.floor(room.color.b * 255)})` :
                       hover ? `rgba(${Math.floor(room.color.r * 255)}, ${Math.floor(room.color.g * 255)}, ${Math.floor(room.color.b * 255)}, 0.5)` :
                       'rgba(50, 50, 50, 0.8)';
        ctx.beginPath();
        ctx.roundRect(x, y, tabW, tabH, 5);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(room.name, x + tabW / 2, y + tabH / 2 + 4);

        if (mouseWasPressed(0) && hover) {
            selectedRoom = i;
        }
    }
}

function renderPrestigePanel(ctx) {
    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 800, 600);

    // Panel
    const px = 150;
    const py = 100;
    const pw = 500;
    const ph = 400;

    ctx.fillStyle = `rgb(${Math.floor(COLORS.panel.r * 255)}, ${Math.floor(COLORS.panel.g * 255)}, ${Math.floor(COLORS.panel.b * 255)})`;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 15);
    ctx.fill();

    ctx.strokeStyle = `rgb(${Math.floor(COLORS.gold.r * 255)}, ${Math.floor(COLORS.gold.g * 255)}, ${Math.floor(COLORS.gold.b * 255)})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Title
    ctx.fillStyle = `rgb(${Math.floor(COLORS.gold.r * 255)}, ${Math.floor(COLORS.gold.g * 255)}, ${Math.floor(COLORS.gold.b * 255)})`;
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PRESTIGE', px + pw / 2, py + 40);

    // Points to gain
    const points = gameData.calculatePrestigePoints();
    ctx.fillStyle = '#fff';
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.fillText('You will gain: ' + points + ' Prestige Points', px + pw / 2, py + 80);

    // Warning
    ctx.fillStyle = '#f88';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText('This will reset your tower progress!', px + pw / 2, py + 110);
    ctx.fillText('Blessings and Prestige Points are kept.', px + pw / 2, py + 130);

    // Blessings
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Blessings:', px + 30, py + 170);

    const mx = mousePos.x * 800 / mainCanvas.width + 400;
    const my = 300 - mousePos.y * 600 / mainCanvas.height;

    let by = py + 190;
    for (const blessing of BLESSINGS.slice(0, 6)) {
        const owned = gameData.blessings[blessing.id];
        const canBuy = !owned && gameData.prestigePoints >= blessing.cost;
        const bx = px + 30;
        const bw = pw - 60;
        const bh = 25;
        const hover = mx >= bx && mx <= bx + bw && my >= by && my <= by + bh;

        ctx.fillStyle = owned ? 'rgba(0, 100, 0, 0.5)' :
                       canBuy && hover ? 'rgba(100, 50, 150, 0.8)' :
                       canBuy ? 'rgba(50, 0, 100, 0.5)' :
                       'rgba(50, 50, 50, 0.5)';
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 3);
        ctx.fill();

        ctx.fillStyle = owned ? '#0f0' : canBuy ? '#fff' : '#666';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(blessing.name + ' (' + blessing.cost + ' PP) - x' + blessing.multiplier + ' ' + blessing.effect,
                    bx + 10, by + 17);

        if (owned) {
            ctx.fillStyle = '#0f0';
            ctx.textAlign = 'right';
            ctx.fillText('OWNED', bx + bw - 10, by + 17);
            ctx.textAlign = 'left';
        }

        if (mouseWasPressed(0) && hover && canBuy) {
            buyBlessing(blessing.id);
        }

        by += 30;
    }

    // Confirm/Cancel buttons
    const confirmX = px + 100;
    const confirmY = py + ph - 60;
    const confirmW = 120;
    const confirmH = 40;
    const confirmHover = mx >= confirmX && mx <= confirmX + confirmW && my >= confirmY && my <= confirmY + confirmH;

    ctx.fillStyle = confirmHover ? `rgb(${Math.floor(COLORS.gold.r * 255)}, ${Math.floor(COLORS.gold.g * 255)}, ${Math.floor(COLORS.gold.b * 255)})` : `rgb(${Math.floor(COLORS.button.r * 255)}, ${Math.floor(COLORS.button.g * 255)}, ${Math.floor(COLORS.button.b * 255)})`;
    ctx.beginPath();
    ctx.roundRect(confirmX, confirmY, confirmW, confirmH, 5);
    ctx.fill();
    ctx.fillStyle = confirmHover ? '#000' : '#fff';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PRESTIGE', confirmX + confirmW / 2, confirmY + confirmH / 2 + 5);

    if (mouseWasPressed(0) && confirmHover) {
        prestige();
    }

    const cancelX = px + pw - 220;
    const cancelHover = mx >= cancelX && mx <= cancelX + confirmW && my >= confirmY && my <= confirmY + confirmH;

    ctx.fillStyle = cancelHover ? '#666' : '#444';
    ctx.beginPath();
    ctx.roundRect(cancelX, confirmY, confirmW, confirmH, 5);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('Cancel', cancelX + confirmW / 2, confirmY + confirmH / 2 + 5);

    if (mouseWasPressed(0) && cancelHover) {
        showPrestigePanel = false;
    }
}

// ============================================================================
// TEST HARNESS EXPORTS
// ============================================================================

window.getPlayer = () => gameData;
window.getGameState = () => currentGameState;
window.getResources = () => gameData ? {
    magic: gameData.magic,
    spirits: gameData.spirits,
    knowledge: gameData.knowledge,
    wood: gameData.wood,
    research: gameData.research,
    dragonXP: gameData.dragonXP,
    gold: gameData.gold
} : null;
window.getTowerLevel = () => gameData ? gameData.towerLevel : 0;
window.getPrestigePoints = () => gameData ? gameData.prestigePoints : 0;
window.clickOrb = clickOrb;
window.summonSpirit = summonSpirit;
window.assignSpirit = assignSpirit;
window.ascendTower = ascendTower;
window.prestige = prestige;
window.startGame = () => { currentGameState = GameState.PLAYING; };

// ============================================================================
// ENGINE INIT
// ============================================================================

engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
