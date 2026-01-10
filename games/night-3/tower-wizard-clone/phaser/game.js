// Tower Wizard Clone - Phaser 3 Version (EXPANDED)
// Incremental/Idle Game - 20 Expand + 20 Polish Passes

const COLORS = {
    bg: 0x1a1a2e, bgLight: 0x2a2a4e,
    mountain1: 0x252545, mountain2: 0x1e1e3e, mountain3: 0x151530,
    pink: 0xe8a0a0, pinkLight: 0xf0b8b8, pinkDark: 0xc88080, salmon: 0xd4918f,
    towerPink: 0xd4918f, towerLight: 0xe8b0b0, towerRoof: 0xc07878, towerWindow: 0x2a2a4e,
    panelBg: 0x0a0a1a, panelBorder: 0xc88080, text: '#ffffff', textDim: '#a0a0a0',
    magic: 0x9370db, knowledge: 0x6495ed, wood: 0x8b6b4a, spirits: 0xe8a0a0,
    research: 0x7cfc00, dragonXP: 0xff6600, arcaneGold: 0xffd700, runePoints: 0x00ffff,
    orbDark: 0x1a1a3e, orbGlow: 0xff69b4, orbHighlight: 0xffffff,
    button: 0x4b0082, buttonDisabled: 0x2a2a3a, buttonActive: 0x6b20a2,
    fire: 0xff4500, wall: 0x555555, damage: 0xff0000
};

// EXPAND: Production rates for all spirit types
const PRODUCTION_RATES = {
    cloudlings: 0.5, spiritTomes: 0.2, druids: 0.3, sages: 0.1,
    keepers: 0.05, alchemists: 0.02, runesmiths: 0.01
};

const SORCERY_DPS = { shamans: 5, ifrits: 10 };

// EXPAND: Ascension costs (11 levels)
const ASCENSION_COSTS = [0, 100, 1000, 10000, 50000, 200000, 1000000, 5000000, 25000000, 100000000, 500000000];

// EXPAND: Wall definitions
const WALLS = [
    { name: 'Stone Wall', health: 10000, reward: 'academy' },
    { name: 'Iron Wall', health: 100000, reward: 'dragonNest' },
    { name: 'Crystal Wall', health: 1000000, reward: 'alchemyLab' },
    { name: 'Cloud Wall', health: 10000000, reward: 'runecraft' },
    { name: 'Void Wall', health: 100000000, reward: 'temple' }
];

const TOTEM_TYPES = ['magic', 'knowledge', 'forest'];
const RELICS = {
    manaStone: { cost: 100, effect: 'magic', value: 1.25 },
    holyGrail: { cost: 1000, effect: 'all', value: 1.5 },
    ouroboros: { cost: 10000, effect: 'damage', value: 2 }
};
const BLESSING_COSTS = { magic: 1, knowledge: 1, forest: 1, research: 2, dragon: 2, alchemy: 2, doubling: 3 };

const ROOMS = ['orb', 'study', 'forest', 'prestige', 'academy', 'dragon', 'alchemy', 'sorcery', 'runes'];

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // EXPAND: Full game state with all systems
        this.gameData = {
            tick: 0,
            magic: 0, lifetimeMagic: 0, spirits: 0,
            knowledge: 0, wood: 0, research: 0,
            dragonXP: 0, arcaneGold: 0, runePoints: 0, cosmicDust: 0,
            towerLevel: 1,
            assignments: {
                cloudlings: 0, spiritTomes: 0, druids: 0, sages: 0,
                keepers: 0, alchemists: 0, shamans: 0, ifrits: 0, runesmiths: 0
            },
            upgrades: {
                wizardMagic: 0, tomeEfficiency: 0, forestry: 0,
                academyResearch: 0, dragonTraining: 0, alchemyEfficiency: 0
            },
            prestigePoints: 0, lifetimePrestige: 0,
            blessings: {
                magic: false, knowledge: false, forest: false,
                research: false, dragon: false, alchemy: false, doubling: false
            },
            totems: [], totemPoles: 0,
            dragon: { xp: 0, level: 0, abilities: [] },
            relics: {},
            runes: { ember: 0, storm: 0, stone: 0, infinity: 0 },
            currentWall: 0, wallHealth: 0, wallMaxHealth: 10000,
            wallDamage: 0, lifetimeDamage: 0,
            selectedRoom: 'orb',
            orbHeld: false, orbClickCooldown: 0,
            showPrestige: false
        };

        this.particles = [];
        this.floatingSpirits = [];
        this.damageNumbers = [];
        this.notifications = [];
        this.screenShake = 0;
        this.stars = [];

        // POLISH: Generate star field
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * this.scale.width,
                y: Math.random() * this.scale.height * 0.6,
                brightness: 0.3 + Math.random() * 0.7,
                twinkle: Math.random() * Math.PI * 2
            });
        }

        // Initialize wall health
        if (WALLS[0]) this.gameData.wallMaxHealth = WALLS[0].health;

        this.bgGraphics = this.add.graphics();
        this.starGraphics = this.add.graphics();
        this.towerGraphics = this.add.graphics();
        this.orbGraphics = this.add.graphics();
        this.uiGraphics = this.add.graphics();
        this.particleGraphics = this.add.graphics();

        this.drawBackground();
        this.createUIText();

        // Interactive orb zone
        this.orbZone = this.add.zone(200, 120, 100, 100).setInteractive();
        this.orbZone.on('pointerdown', () => { this.gameData.orbHeld = true; this.clickOrb(); });
        this.orbZone.on('pointerup', () => { this.gameData.orbHeld = false; });
        this.orbZone.on('pointerout', () => { this.gameData.orbHeld = false; });

        this.createButtons();

        // Initial floating spirits
        for (let i = 0; i < 5; i++) this.createFloatingSpirit();

        window.game = this.gameData;
        window.gameState = { state: 'playing' };
    }

    drawBackground() {
        const g = this.bgGraphics;
        const w = this.scale.width;
        const h = this.scale.height;

        g.fillStyle(COLORS.bg);
        g.fillRect(0, 0, w, h);

        // Mountain layers
        const layers = [
            { color: COLORS.mountain3, height: 0.5, offset: 0 },
            { color: COLORS.mountain2, height: 0.4, offset: 100 },
            { color: COLORS.mountain1, height: 0.3, offset: 200 }
        ];

        for (const layer of layers) {
            g.fillStyle(layer.color);
            g.beginPath();
            g.moveTo(0, h);
            for (let x = 0; x <= w; x += 20) {
                const baseY = h - h * layer.height;
                const peakY = baseY - Math.sin((x + layer.offset) * 0.01) * 100 - Math.sin((x + layer.offset) * 0.02) * 50;
                g.lineTo(x, peakY);
            }
            g.lineTo(w, h);
            g.closePath();
            g.fillPath();
        }

        // Dark tree silhouettes
        g.fillStyle(0x0a0a1a);
        for (let x = 0; x < w; x += 30) {
            const treeHeight = 20 + Math.random() * 30;
            g.fillTriangle(x, h - 50, x + 10, h - 50 - treeHeight, x + 20, h - 50);
        }

        // Pink trees in foreground
        for (let x = 50; x < 320; x += 35) {
            const treeHeight = 50 + Math.sin(x) * 20;
            g.fillStyle(COLORS.pinkDark);
            g.fillRect(x + 8, h - 90, 4, 30);
            g.fillStyle(COLORS.salmon);
            g.fillTriangle(x, h - 90, x + 10, h - 90 - treeHeight, x + 20, h - 90);
        }
    }

    createUIText() {
        const style = { fontFamily: 'monospace', fontSize: '12px', color: COLORS.text };
        const dimStyle = { fontFamily: 'monospace', fontSize: '11px', color: COLORS.textDim };

        // Resource panel
        this.resourceTitle = this.add.text(30, 30, 'Resources', { ...style, fontStyle: 'bold', fontSize: '14px' });
        this.magicText = this.add.text(30, 55, '', style);
        this.spiritsText = this.add.text(30, 75, '', style);
        this.knowledgeText = this.add.text(30, 95, '', style);
        this.woodText = this.add.text(30, 115, '', style);
        this.researchText = this.add.text(30, 135, '', style);
        this.dragonXPText = this.add.text(30, 155, '', style);
        this.goldText = this.add.text(30, 175, '', style);
        this.runeText = this.add.text(30, 195, '', style);

        // Action panel
        const panelX = this.scale.width - 280;
        this.roomTitle = this.add.text(panelX + 10, 195, 'Orb Room', { ...style, fontStyle: 'bold', fontSize: '16px' });
        this.roomInfo1 = this.add.text(panelX + 10, 275, '', style);
        this.roomInfo2 = this.add.text(panelX + 10, 295, '', style);
        this.roomInfo3 = this.add.text(panelX + 10, 315, '', style);
        this.towerLevelText = this.add.text(panelX + 10, 515, '', { ...style, fontStyle: 'bold', fontSize: '14px' });
        this.ascendReqText = this.add.text(panelX + 10, 535, '', dimStyle);

        // Orb text
        this.orbClickText = this.add.text(200, 55, '+1', { fontFamily: 'monospace', fontSize: '16px', fontStyle: 'bold', color: '#e8a0a0' }).setOrigin(0.5);
        this.orbHintText = this.add.text(200, 180, 'Click/hold for magic', { fontFamily: 'monospace', fontSize: '11px', color: COLORS.textDim }).setOrigin(0.5);
    }

    createButtons() {
        const panelX = this.scale.width - 280;
        const navY = this.scale.height - 50;

        // Summon button
        this.summonBtn = this.createButton(panelX + 10, 235, 240, 32, 'Summon Spirit   10', () => this.summonSpirit());

        // Assign/Remove
        this.assignBtn = this.createButton(panelX + 10, 340, 115, 32, 'Assign +1', () => this.assignSpirit());
        this.removeBtn = this.createButton(panelX + 135, 340, 115, 32, 'Remove -1', () => this.unassignSpirit());

        // Ascend
        this.ascendBtn = this.createButton(panelX + 10, 560, 240, 32, 'Ascend Tower', () => this.ascend());

        // Room navigation tabs
        const rooms = ['Orb', 'Study', 'Forest', 'Prestige', 'Academy', 'Dragon', 'Alchemy', 'Sorcery', 'Runes'];
        const tabWidth = 80;
        const startX = (this.scale.width - rooms.length * tabWidth) / 2;

        this.roomTabs = rooms.map((name, i) => {
            const btn = this.createButton(startX + i * tabWidth, navY, tabWidth - 4, 38, name, () => {
                this.gameData.selectedRoom = ROOMS[i];
            });
            return btn;
        });
    }

    createButton(x, y, w, h, text, callback) {
        const btn = this.add.container(x, y);
        const bg = this.add.graphics();
        bg.fillStyle(COLORS.button);
        bg.fillRoundedRect(0, 0, w, h, 4);
        bg.lineStyle(1, COLORS.panelBorder);
        bg.strokeRoundedRect(0, 0, w, h, 4);

        const label = this.add.text(w/2, h/2, text, { fontFamily: 'monospace', fontSize: '11px', color: '#ffffff' }).setOrigin(0.5);
        btn.add([bg, label]);
        btn.setSize(w, h);
        btn.setInteractive();

        // Visual feedback on click
        btn.on('pointerdown', () => {
            // Flash effect - brighten button
            bg.clear();
            bg.fillStyle(0xffffff, 0.3);
            bg.fillRoundedRect(0, 0, w, h, 4);
            bg.fillStyle(COLORS.buttonActive);
            bg.fillRoundedRect(2, 2, w - 4, h - 4, 3);
            bg.lineStyle(2, 0xffffff);
            bg.strokeRoundedRect(0, 0, w, h, 4);
            label.setScale(0.95);

            // Call the actual callback
            callback();

            // Reset after short delay
            this.time.delayedCall(100, () => {
                label.setScale(1);
            });
        });

        btn.on('pointerup', () => {
            label.setScale(1);
        });

        btn.on('pointerover', () => {
            if (!btn.isDisabled) {
                bg.clear();
                bg.fillStyle(COLORS.buttonActive);
                bg.fillRoundedRect(0, 0, w, h, 4);
                bg.lineStyle(1, COLORS.panelBorder);
                bg.strokeRoundedRect(0, 0, w, h, 4);
            }
        });

        btn.on('pointerout', () => {
            if (!btn.isDisabled && !btn.isActive) {
                bg.clear();
                bg.fillStyle(COLORS.button);
                bg.fillRoundedRect(0, 0, w, h, 4);
                bg.lineStyle(1, COLORS.panelBorder);
                bg.strokeRoundedRect(0, 0, w, h, 4);
            }
        });

        btn.bg = bg; btn.label = label; btn.w = w; btn.h = h;
        btn.isDisabled = false;
        btn.isActive = false;
        return btn;
    }

    updateButton(btn, enabled, active = false) {
        btn.isDisabled = !enabled;
        btn.isActive = active;
        btn.bg.clear();

        if (active) {
            // Active state - highlighted with bright border
            btn.bg.fillStyle(COLORS.buttonActive);
            btn.bg.fillRoundedRect(0, 0, btn.w, btn.h, 4);
            btn.bg.lineStyle(2, 0xffffff);
            btn.bg.strokeRoundedRect(0, 0, btn.w, btn.h, 4);
            btn.label.setColor('#ffffff');
        } else if (enabled) {
            // Normal enabled state
            btn.bg.fillStyle(COLORS.button);
            btn.bg.fillRoundedRect(0, 0, btn.w, btn.h, 4);
            btn.bg.lineStyle(1, COLORS.panelBorder);
            btn.bg.strokeRoundedRect(0, 0, btn.w, btn.h, 4);
            btn.label.setColor('#ffffff');
        } else {
            // Disabled state
            btn.bg.fillStyle(COLORS.buttonDisabled);
            btn.bg.fillRoundedRect(0, 0, btn.w, btn.h, 4);
            btn.bg.lineStyle(1, 0x4a4a5a);
            btn.bg.strokeRoundedRect(0, 0, btn.w, btn.h, 4);
            btn.label.setColor('#606060');
        }
    }

    clickOrb() {
        if (this.gameData.orbClickCooldown > 0) return;
        const gain = this.getMagicPerClick();
        this.gameData.magic += gain;
        this.gameData.lifetimeMagic += gain;
        this.gameData.orbClickCooldown = 0.05;

        // POLISH: Particles
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: 200 + (Math.random() - 0.5) * 50,
                y: 120 + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 80,
                vy: -Math.random() * 80 - 30,
                life: 1,
                color: i % 2 === 0 ? COLORS.orbGlow : COLORS.magic
            });
        }
    }

    getMagicPerClick() {
        let base = 1 + this.gameData.towerLevel * 0.5;
        base *= Math.pow(1.5, this.gameData.upgrades.wizardMagic);
        if (this.gameData.blessings.magic) base *= 2;
        if (this.gameData.relics.manaStone) base *= RELICS.manaStone.value;
        if (this.gameData.relics.holyGrail) base *= RELICS.holyGrail.value;
        return Math.floor(base);
    }

    getSpiritCost() {
        return Math.floor(10 * Math.pow(1.15, this.gameData.spirits));
    }

    getTotalAssigned() {
        return Object.values(this.gameData.assignments).reduce((a, b) => a + b, 0);
    }

    summonSpirit() {
        const cost = this.getSpiritCost();
        if (this.gameData.magic >= cost) {
            this.gameData.magic -= cost;
            this.gameData.spirits++;
            this.createFloatingSpirit();
            this.addNotification('Spirit summoned!');
        }
    }

    assignSpirit() {
        if (this.gameData.spirits <= this.getTotalAssigned()) return;
        const room = this.gameData.selectedRoom;
        const spiritTypes = {
            orb: 'cloudlings', study: 'spiritTomes', forest: 'druids',
            academy: 'sages', dragon: 'keepers', alchemy: 'alchemists',
            sorcery: 'shamans', runes: 'runesmiths'
        };
        const type = spiritTypes[room];
        if (type && this.gameData.assignments[type] !== undefined) {
            this.gameData.assignments[type]++;
        }
    }

    unassignSpirit() {
        const room = this.gameData.selectedRoom;
        const spiritTypes = {
            orb: 'cloudlings', study: 'spiritTomes', forest: 'druids',
            academy: 'sages', dragon: 'keepers', alchemy: 'alchemists',
            sorcery: 'shamans', runes: 'runesmiths'
        };
        const type = spiritTypes[room];
        if (type && this.gameData.assignments[type] > 0) {
            this.gameData.assignments[type]--;
        }
    }

    canAscend() {
        if (this.gameData.towerLevel >= ASCENSION_COSTS.length) return false;
        return this.gameData.lifetimeMagic >= ASCENSION_COSTS[this.gameData.towerLevel];
    }

    ascend() {
        if (this.canAscend()) {
            this.gameData.towerLevel++;
            this.screenShake = 15;
            this.addNotification(`Tower Level ${this.gameData.towerLevel}!`);
        }
    }

    // EXPAND: Prestige system
    getPrestigePoints() {
        return Math.floor(Math.sqrt(this.gameData.lifetimeMagic / 10000));
    }

    doPrestige() {
        const points = this.getPrestigePoints();
        if (points > 0) {
            this.gameData.prestigePoints += points;
            this.gameData.lifetimePrestige += points;
            this.gameData.magic = 0;
            this.gameData.spirits = 0;
            this.gameData.knowledge = 0;
            this.gameData.wood = 0;
            this.gameData.lifetimeMagic = 0;
            Object.keys(this.gameData.assignments).forEach(k => this.gameData.assignments[k] = 0);
            this.addNotification(`+${points} Prestige Points!`);
            this.screenShake = 20;
        }
    }

    buyBlessing(name) {
        const cost = BLESSING_COSTS[name];
        if (cost && this.gameData.prestigePoints >= cost && !this.gameData.blessings[name]) {
            this.gameData.prestigePoints -= cost;
            this.gameData.blessings[name] = true;
            this.addNotification(`${name} blessing unlocked!`);
        }
    }

    createFloatingSpirit() {
        this.floatingSpirits.push({
            x: 100 + Math.random() * 200,
            y: 150 + Math.random() * 250,
            bob: Math.random() * Math.PI * 2
        });
    }

    addNotification(text) {
        this.notifications.push({ text, life: 3, y: 0 });
    }

    addDamageNumber(x, y, amount) {
        this.damageNumbers.push({ x, y, amount, life: 1, vy: -30 });
    }

    formatNumber(n) {
        if (n < 1000) return Math.floor(n).toString();
        if (n < 1000000) return (n / 1000).toFixed(1) + 'K';
        if (n < 1000000000) return (n / 1000000).toFixed(1) + 'M';
        if (n < 1000000000000) return (n / 1000000000).toFixed(1) + 'B';
        return (n / 1000000000000).toFixed(1) + 'T';
    }

    // EXPAND: Get multipliers from blessings/totems/relics
    getMultiplier(type) {
        let mult = 1;
        if (this.gameData.blessings[type]) mult *= 2;
        if (this.gameData.blessings.doubling) mult *= 2;
        if (this.gameData.relics.holyGrail) mult *= RELICS.holyGrail.value;
        // Totem bonuses
        this.gameData.totems.forEach(t => { if (t === type) mult *= 1.1; });
        return mult;
    }

    update(time, delta) {
        const dt = delta / 1000;
        this.gameData.tick++;

        // Cooldown
        if (this.gameData.orbClickCooldown > 0) this.gameData.orbClickCooldown -= dt;

        // Auto-click
        if (this.gameData.orbHeld && this.gameData.orbClickCooldown <= 0) this.clickOrb();

        // EXPAND: Resource generation from all spirits
        const a = this.gameData.assignments;

        // Cloudlings -> Magic
        const cloudMagic = a.cloudlings * PRODUCTION_RATES.cloudlings * this.getMultiplier('magic') * dt;
        this.gameData.magic += cloudMagic;
        this.gameData.lifetimeMagic += cloudMagic;

        // Spirit Tomes -> Knowledge
        if (this.gameData.towerLevel >= 2) {
            this.gameData.knowledge += a.spiritTomes * PRODUCTION_RATES.spiritTomes * this.getMultiplier('knowledge') * dt;
        }

        // Druids -> Wood
        if (this.gameData.towerLevel >= 3) {
            this.gameData.wood += a.druids * PRODUCTION_RATES.druids * this.getMultiplier('forest') * dt;
        }

        // Sages -> Research
        if (this.gameData.towerLevel >= 4) {
            this.gameData.research += a.sages * PRODUCTION_RATES.sages * this.getMultiplier('research') * dt;
        }

        // Keepers -> Dragon XP
        if (this.gameData.towerLevel >= 5) {
            this.gameData.dragonXP += a.keepers * PRODUCTION_RATES.keepers * this.getMultiplier('dragon') * dt;
        }

        // Alchemists -> Arcane Gold
        if (this.gameData.towerLevel >= 6) {
            this.gameData.arcaneGold += a.alchemists * PRODUCTION_RATES.alchemists * this.getMultiplier('alchemy') * dt;
        }

        // Runesmiths -> Rune Points
        if (this.gameData.towerLevel >= 8) {
            this.gameData.runePoints += a.runesmiths * PRODUCTION_RATES.runesmiths * dt;
        }

        // EXPAND: Wall damage (Sorcery)
        const dps = a.shamans * SORCERY_DPS.shamans + a.ifrits * SORCERY_DPS.ifrits;
        if (dps > 0 && this.gameData.currentWall < WALLS.length) {
            const damage = dps * dt;
            this.gameData.wallDamage += damage;
            this.gameData.lifetimeDamage += damage;

            if (this.gameData.wallDamage >= this.gameData.wallMaxHealth) {
                this.gameData.wallDamage = 0;
                this.gameData.currentWall++;
                if (this.gameData.currentWall < WALLS.length) {
                    this.gameData.wallMaxHealth = WALLS[this.gameData.currentWall].health;
                    this.addNotification(`${WALLS[this.gameData.currentWall - 1].name} destroyed!`);
                    this.screenShake = 25;
                }
            }
        }

        // EXPAND: Dragon leveling
        const dragonLevelThreshold = Math.pow(2, this.gameData.dragon.level + 1) * 100;
        if (this.gameData.dragonXP >= dragonLevelThreshold) {
            this.gameData.dragon.level++;
            this.addNotification(`Dragon Level ${this.gameData.dragon.level}!`);
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 40 * dt;
            p.life -= dt * 2;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Update floating spirits
        for (const spirit of this.floatingSpirits) {
            spirit.bob += dt * 2;
        }

        // Update damage numbers
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const d = this.damageNumbers[i];
            d.y += d.vy * dt;
            d.life -= dt;
            if (d.life <= 0) this.damageNumbers.splice(i, 1);
        }

        // Update notifications
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const n = this.notifications[i];
            n.life -= dt;
            n.y += dt * 20;
            if (n.life <= 0) this.notifications.splice(i, 1);
        }

        // POLISH: Screen shake decay
        if (this.screenShake > 0) this.screenShake *= 0.9;

        this.drawDynamic();
        this.updateUI();
    }

    drawDynamic() {
        const shakeX = (Math.random() - 0.5) * this.screenShake;
        const shakeY = (Math.random() - 0.5) * this.screenShake;

        // POLISH: Stars
        const sg = this.starGraphics;
        sg.clear();
        for (const star of this.stars) {
            star.twinkle += 0.05;
            const alpha = 0.3 + Math.sin(star.twinkle) * 0.3;
            sg.fillStyle(0xffffff, alpha * star.brightness);
            sg.fillRect(star.x + shakeX, star.y + shakeY, 2, 2);
        }

        // Tower
        const g = this.towerGraphics;
        g.clear();
        const h = this.scale.height;
        const towerX = 350 + shakeX;
        const towerBaseY = h - 120;
        const floorHeight = 60;

        // POLISH: Tower shadow
        g.fillStyle(0x000000, 0.3);
        g.fillEllipse(towerX + 30, towerBaseY + 10, 50, 15);

        // Tower floors
        for (let i = 0; i < Math.min(this.gameData.towerLevel, 11); i++) {
            const floorY = towerBaseY - i * floorHeight;
            const w = 60;

            g.fillStyle(COLORS.towerPink);
            g.fillRect(towerX, floorY - 55, w, 55);

            g.fillStyle(COLORS.towerLight);
            g.fillRect(towerX, floorY - 55, 4, 55);

            g.fillStyle(COLORS.pinkDark);
            g.fillRect(towerX + w - 4, floorY - 55, 4, 55);

            // POLISH: Window with glow
            const glowIntensity = 0.3 + Math.sin(this.gameData.tick * 0.03 + i) * 0.2;
            g.fillStyle(0x4a6090, glowIntensity);
            g.fillRect(towerX + 20, floorY - 45, 20, 30);
            g.fillStyle(COLORS.towerWindow);
            g.fillRect(towerX + 22, floorY - 43, 16, 26);
        }

        // Roof
        const roofY = towerBaseY - Math.min(this.gameData.towerLevel, 11) * floorHeight + shakeY;
        g.fillStyle(COLORS.towerRoof);
        g.fillTriangle(towerX - 5, roofY, towerX + 30, roofY - 50, towerX + 65, roofY);
        g.fillStyle(COLORS.towerLight);
        g.fillTriangle(towerX, roofY - 5, towerX + 25, roofY - 45, towerX + 25, roofY - 5);

        // POLISH: Roof ornament
        g.fillStyle(COLORS.orbGlow);
        g.fillCircle(towerX + 30, roofY - 55, 5);

        // Orb
        const og = this.orbGraphics;
        og.clear();
        const orbX = 200 + shakeX;
        const orbY = 120 + shakeY;

        // POLISH: Multi-layer glow
        og.fillStyle(COLORS.orbGlow, 0.15);
        og.fillCircle(orbX, orbY, 100);
        og.fillStyle(COLORS.orbGlow, 0.25);
        og.fillCircle(orbX, orbY, 70);

        og.fillStyle(COLORS.orbDark);
        og.fillCircle(orbX, orbY, 45);

        // POLISH: Animated stars inside orb
        og.fillStyle(0xffffff);
        for (let i = 0; i < 8; i++) {
            const angle = this.gameData.tick * 0.025 + i * Math.PI * 0.25;
            const dist = 12 + Math.sin(this.gameData.tick * 0.06 + i * 2) * 15;
            const sx = orbX + Math.cos(angle) * dist;
            const sy = orbY + Math.sin(angle) * dist;
            const size = 2 + Math.sin(this.gameData.tick * 0.08 + i) * 1;
            og.fillRect(sx - size/2, sy - size/2, size, size);
        }

        og.fillStyle(0xffffff, 0.4);
        og.fillCircle(orbX - 15, orbY - 15, 8);

        // POLISH: Floating spirits with glow
        for (let i = 0; i < Math.min(this.floatingSpirits.length, 25); i++) {
            const spirit = this.floatingSpirits[i];
            const bobY = Math.sin(spirit.bob) * 5;

            og.fillStyle(COLORS.spirits, 0.3);
            og.fillCircle(spirit.x + shakeX, spirit.y + bobY + shakeY, 12);
            og.fillStyle(COLORS.spirits);
            og.fillCircle(spirit.x + shakeX, spirit.y + bobY + shakeY, 7);
            og.fillStyle(COLORS.panelBg);
            og.fillRect(spirit.x - 3 + shakeX, spirit.y + bobY - 2 + shakeY, 2, 2);
            og.fillRect(spirit.x + 1 + shakeX, spirit.y + bobY - 2 + shakeY, 2, 2);
        }

        // Particles
        const pg = this.particleGraphics;
        pg.clear();
        for (const p of this.particles) {
            pg.fillStyle(p.color, p.life);
            pg.fillCircle(p.x + shakeX, p.y + shakeY, 4);
        }

        // Damage numbers
        for (const d of this.damageNumbers) {
            pg.fillStyle(0xffff00, d.life);
            // Would need text but using rect approximation
        }

        this.drawUIPanels();
    }

    drawUIPanels() {
        const g = this.uiGraphics;
        g.clear();

        // Resource panel
        g.fillStyle(COLORS.panelBg, 0.9);
        g.fillRoundedRect(20, 20, 170, 200, 8);
        g.lineStyle(2, COLORS.panelBorder);
        g.strokeRoundedRect(20, 20, 170, 200, 8);

        // Action panel
        const panelX = this.scale.width - 290;
        g.fillStyle(COLORS.panelBg, 0.9);
        g.fillRoundedRect(panelX, 185, 270, 420, 8);
        g.lineStyle(2, COLORS.panelBorder);
        g.strokeRoundedRect(panelX, 185, 270, 420, 8);

        // POLISH: Notifications
        let notifY = 250;
        for (const n of this.notifications) {
            g.fillStyle(COLORS.panelBg, n.life * 0.8);
            g.fillRoundedRect(this.scale.width / 2 - 100, notifY + n.y, 200, 30, 4);
            notifY += 35;
        }
    }

    updateUI() {
        const d = this.gameData;
        const a = d.assignments;

        // Resources
        this.magicText.setText(`* ${this.formatNumber(d.magic)}`);
        this.spiritsText.setText(`@ ${this.getTotalAssigned()}/${d.spirits}`);
        this.knowledgeText.setText(`+ ${this.formatNumber(d.knowledge)}`);
        this.woodText.setText(`# ${this.formatNumber(d.wood)}`);
        this.researchText.setText(d.towerLevel >= 4 ? `~ ${this.formatNumber(d.research)}` : '');
        this.dragonXPText.setText(d.towerLevel >= 5 ? `^ ${this.formatNumber(d.dragonXP)}` : '');
        this.goldText.setText(d.towerLevel >= 6 ? `$ ${this.formatNumber(d.arcaneGold)}` : '');
        this.runeText.setText(d.towerLevel >= 8 ? `% ${this.formatNumber(d.runePoints)}` : '');

        // Room titles
        const roomTitles = {
            orb: 'Orb Room', study: 'Study', forest: 'Forest', prestige: 'Prestige',
            academy: 'Academy', dragon: 'Dragon Nest', alchemy: 'Alchemy Lab',
            sorcery: 'Sorcery', runes: 'Runecraft'
        };
        this.roomTitle.setText(roomTitles[d.selectedRoom] || 'Room');

        // Summon cost
        this.summonBtn.label.setText(`Summon Spirit   ${this.formatNumber(this.getSpiritCost())}`);

        // Room-specific info
        const spiritTypes = {
            orb: ['Cloudlings', a.cloudlings, 'magic/sec', a.cloudlings * PRODUCTION_RATES.cloudlings],
            study: ['Spirit Tomes', a.spiritTomes, 'knowledge/sec', a.spiritTomes * PRODUCTION_RATES.spiritTomes],
            forest: ['Druids', a.druids, 'wood/sec', a.druids * PRODUCTION_RATES.druids],
            academy: ['Sages', a.sages, 'research/sec', a.sages * PRODUCTION_RATES.sages],
            dragon: ['Keepers', a.keepers, 'dragon XP/sec', a.keepers * PRODUCTION_RATES.keepers],
            alchemy: ['Alchemists', a.alchemists, 'gold/sec', a.alchemists * PRODUCTION_RATES.alchemists],
            sorcery: ['Shamans', a.shamans, 'DPS', a.shamans * SORCERY_DPS.shamans + a.ifrits * SORCERY_DPS.ifrits],
            runes: ['Runesmiths', a.runesmiths, 'rune pts/sec', a.runesmiths * PRODUCTION_RATES.runesmiths]
        };

        const info = spiritTypes[d.selectedRoom];
        if (info && d.selectedRoom !== 'prestige') {
            this.roomInfo1.setText(`${info[0]}: ${info[1]}`);
            this.roomInfo2.setText(`${this.formatNumber(info[3])} ${info[2]}`);
            this.roomInfo3.setText('');
        } else if (d.selectedRoom === 'prestige') {
            this.roomInfo1.setText(`Prestige Points: ${d.prestigePoints}`);
            this.roomInfo2.setText(`Potential: +${this.getPrestigePoints()}`);
            this.roomInfo3.setText('Resets progress for bonuses');
        } else {
            this.roomInfo1.setText('');
            this.roomInfo2.setText('');
            this.roomInfo3.setText('');
        }

        // Tower level
        this.towerLevelText.setText(`Tower Level: ${d.towerLevel}`);
        if (d.towerLevel < ASCENSION_COSTS.length) {
            this.ascendReqText.setText(`Next: ${this.formatNumber(ASCENSION_COSTS[d.towerLevel])} lifetime magic`);
        } else {
            this.ascendReqText.setText('Max level reached');
        }

        // Orb text
        this.orbClickText.setText(`+${this.formatNumber(this.getMagicPerClick())}`);

        // Button states
        this.updateButton(this.summonBtn, d.magic >= this.getSpiritCost());
        this.updateButton(this.assignBtn, d.spirits > this.getTotalAssigned());

        const currentAssigned = spiritTypes[d.selectedRoom] ? spiritTypes[d.selectedRoom][1] : 0;
        this.updateButton(this.removeBtn, currentAssigned > 0);
        this.updateButton(this.ascendBtn, this.canAscend());

        // Room tabs
        const roomUnlocks = { orb: 1, study: 2, forest: 3, prestige: 1, academy: 4, dragon: 5, alchemy: 6, sorcery: 7, runes: 8 };
        this.roomTabs.forEach((tab, i) => {
            const room = ROOMS[i];
            const unlocked = d.towerLevel >= roomUnlocks[room];
            const active = d.selectedRoom === room;
            this.updateButton(tab, unlocked, active);
        });

        // Notifications text
        let notifY = 250;
        for (const n of this.notifications) {
            // Would need dynamic text objects, simplified here
            notifY += 35;
        }
    }
}

const config = {
    type: Phaser.CANVAS,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1a1a2e',
    canvas: document.createElement('canvas'),
    scene: [GameScene],
    render: { pixelArt: true }
};

document.body.appendChild(config.canvas);
const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
