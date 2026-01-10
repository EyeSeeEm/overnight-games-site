// ============= TOWER WIZARD CLONE =============
// Idle/Incremental Tower Building Game

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 800;
const HEIGHT = 600;

// ============= COLORS =============
const COLORS = {
    bg: '#1a0a1a',
    primary: '#ff69b4',
    secondary: '#da70d6',
    accent: '#9400d3',
    text: '#fff',
    dark: '#2d1230',
    gold: '#ffd700',
    magic: '#00ffff',
    knowledge: '#9370db',
    wood: '#8b4513',
    research: '#4169e1'
};

// ============= SAVE DATA =============
const SaveData = {
    magic: 0,
    totalMagic: 0,
    spirits: 0,
    knowledge: 0,
    wood: 0,
    research: 0,
    blessings: 0,
    prestigeCount: 0,
    totalClicks: 0,

    assignments: {
        cloudlings: 0,
        tomes: 0,
        druids: 0,
        sages: 0
    },

    upgrades: {
        clickPower: 0,
        autoClick: 0,
        spiritCost: 0,
        magicMult: 0,
        knowledgeMult: 0
    },

    ascensionLevel: 1,
    unlockedRooms: ['orb'],

    save() {
        localStorage.setItem('tower_wizard_clone', JSON.stringify({
            magic: this.magic,
            totalMagic: this.totalMagic,
            spirits: this.spirits,
            knowledge: this.knowledge,
            wood: this.wood,
            research: this.research,
            blessings: this.blessings,
            prestigeCount: this.prestigeCount,
            totalClicks: this.totalClicks,
            assignments: this.assignments,
            upgrades: this.upgrades,
            ascensionLevel: this.ascensionLevel,
            unlockedRooms: this.unlockedRooms
        }));
    },

    load() {
        const data = localStorage.getItem('tower_wizard_clone');
        if (data) {
            const parsed = JSON.parse(data);
            Object.assign(this, parsed);
        }
    },

    reset() {
        this.magic = 0;
        this.totalMagic = 0;
        this.spirits = 0;
        this.knowledge = 0;
        this.wood = 0;
        this.research = 0;
        this.assignments = { cloudlings: 0, tomes: 0, druids: 0, sages: 0 };
        this.upgrades = { clickPower: 0, autoClick: 0, spiritCost: 0, magicMult: 0, knowledgeMult: 0 };
        this.ascensionLevel = 1;
        this.unlockedRooms = ['orb'];
    }
};

// ============= ROOMS =============
const ROOMS = {
    orb: {
        name: 'Magic Orb',
        desc: 'Click to generate magic',
        spiritType: 'cloudlings',
        resource: 'magic',
        baseRate: 0.5,
        ascension: 1,
        color: COLORS.magic
    },
    study: {
        name: 'Study',
        desc: 'Spirit Tomes generate Knowledge',
        spiritType: 'tomes',
        resource: 'knowledge',
        baseRate: 0.2,
        ascension: 2,
        color: COLORS.knowledge
    },
    forest: {
        name: 'Forest',
        desc: 'Druids gather Wood',
        spiritType: 'druids',
        resource: 'wood',
        baseRate: 0.3,
        ascension: 3,
        color: COLORS.wood
    },
    academy: {
        name: 'Academy',
        desc: 'Sages produce Research',
        spiritType: 'sages',
        resource: 'research',
        baseRate: 0.1,
        ascension: 4,
        color: COLORS.research
    }
};

// ============= UPGRADES =============
const UPGRADES = {
    clickPower: {
        name: 'Arcane Touch',
        desc: '+1 magic per click',
        baseCost: 50,
        costMult: 1.5,
        resource: 'magic',
        max: 50
    },
    autoClick: {
        name: 'Auto Orb',
        desc: '+0.5 automatic clicks/sec',
        baseCost: 200,
        costMult: 2,
        resource: 'magic',
        max: 20
    },
    spiritCost: {
        name: 'Spirit Efficiency',
        desc: '-5% spirit summon cost',
        baseCost: 100,
        costMult: 1.8,
        resource: 'knowledge',
        max: 10
    },
    magicMult: {
        name: 'Wizard Magic',
        desc: 'x2 magic generation',
        baseCost: 500,
        costMult: 3,
        resource: 'knowledge',
        max: 10
    },
    knowledgeMult: {
        name: 'Deep Study',
        desc: 'x2 knowledge generation',
        baseCost: 300,
        costMult: 2.5,
        resource: 'research',
        max: 10
    }
};

// ============= ASCENSION COSTS =============
const ASCENSION_COSTS = [0, 100, 1000, 10000, 50000, 200000, 1000000];

// ============= GAME STATE =============
let state = {
    screen: 'game',
    selectedRoom: 'orb',
    orbPulse: 0,
    particles: [],
    clickFeedback: [],
    lastSave: 0
};

// ============= INPUT =============
let mouse = { x: 0, y: 0, down: false };
let buttons = [];

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => { mouse.down = true; });
canvas.addEventListener('mouseup', () => { mouse.down = false; });
canvas.addEventListener('click', handleClick);

function addButton(id, x, y, w, h, label, callback, enabled = true) {
    buttons.push({ id, x, y, w, h, label, callback, enabled });
}

function clearButtons() {
    buttons = [];
}

function handleClick() {
    // Check orb click
    const orbX = 200;
    const orbY = 300;
    const orbRadius = 60;
    const dist = Math.sqrt((mouse.x - orbX) ** 2 + (mouse.y - orbY) ** 2);

    if (dist <= orbRadius && state.selectedRoom === 'orb') {
        clickOrb();
        return;
    }

    // Check buttons
    for (const btn of buttons) {
        if (btn.enabled && mouse.x >= btn.x && mouse.x <= btn.x + btn.w &&
            mouse.y >= btn.y && mouse.y <= btn.y + btn.h) {
            btn.callback();
            return;
        }
    }
}

function isButtonHovered(btn) {
    return mouse.x >= btn.x && mouse.x <= btn.x + btn.w &&
           mouse.y >= btn.y && mouse.y <= btn.y + btn.h;
}

// ============= GAME LOGIC =============
function clickOrb() {
    const clickPower = 1 + SaveData.upgrades.clickPower;
    const magicMult = Math.pow(2, SaveData.upgrades.magicMult) * (1 + SaveData.blessings * 0.1);

    const magicGained = clickPower * magicMult;
    SaveData.magic += magicGained;
    SaveData.totalMagic += magicGained;
    SaveData.totalClicks++;

    // Visual feedback
    state.clickFeedback.push({
        x: mouse.x + (Math.random() - 0.5) * 30,
        y: mouse.y,
        value: magicGained,
        life: 1
    });

    // Particles
    for (let i = 0; i < 5; i++) {
        state.particles.push({
            x: mouse.x,
            y: mouse.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100 - 50,
            life: 0.5 + Math.random() * 0.5,
            color: COLORS.magic
        });
    }

    state.orbPulse = 0.3;
}

function getSpiritCost() {
    const baseCost = 10 * Math.pow(1.15, SaveData.spirits);
    const discount = 1 - (SaveData.upgrades.spiritCost * 0.05);
    return Math.floor(baseCost * discount);
}

function summonSpirit() {
    const cost = getSpiritCost();
    if (SaveData.magic >= cost) {
        SaveData.magic -= cost;
        SaveData.spirits++;
        return true;
    }
    return false;
}

function assignSpirit(room) {
    const roomData = ROOMS[room];
    if (!roomData || SaveData.spirits <= 0) return false;

    const totalAssigned = Object.values(SaveData.assignments).reduce((a, b) => a + b, 0);
    if (totalAssigned >= SaveData.spirits) return false;

    SaveData.assignments[roomData.spiritType]++;
    return true;
}

function unassignSpirit(room) {
    const roomData = ROOMS[room];
    if (!roomData || SaveData.assignments[roomData.spiritType] <= 0) return false;

    SaveData.assignments[roomData.spiritType]--;
    return true;
}

function buyUpgrade(upgradeId) {
    const upgrade = UPGRADES[upgradeId];
    const level = SaveData.upgrades[upgradeId];

    if (level >= upgrade.max) return false;

    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, level));
    if (SaveData[upgrade.resource] < cost) return false;

    SaveData[upgrade.resource] -= cost;
    SaveData.upgrades[upgradeId]++;
    return true;
}

function canAscend() {
    if (SaveData.ascensionLevel >= ASCENSION_COSTS.length) return false;
    return SaveData.totalMagic >= ASCENSION_COSTS[SaveData.ascensionLevel];
}

function ascend() {
    if (!canAscend()) return false;

    SaveData.ascensionLevel++;

    // Unlock new room
    const roomNames = Object.keys(ROOMS);
    for (const room of roomNames) {
        if (ROOMS[room].ascension === SaveData.ascensionLevel && !SaveData.unlockedRooms.includes(room)) {
            SaveData.unlockedRooms.push(room);
        }
    }

    SaveData.save();
    return true;
}

function canPrestige() {
    return SaveData.totalMagic >= 1000000;
}

function prestige() {
    if (!canPrestige()) return false;

    const blessingsGained = Math.floor(Math.log10(SaveData.totalMagic / 100000));
    SaveData.blessings += blessingsGained;
    SaveData.prestigeCount++;

    // Reset progress but keep blessings
    SaveData.reset();

    SaveData.save();
    return true;
}

function updateGame(dt) {
    // Auto generation from spirits
    for (const roomId of SaveData.unlockedRooms) {
        const room = ROOMS[roomId];
        const assigned = SaveData.assignments[room.spiritType];

        if (assigned > 0) {
            let rate = room.baseRate * assigned;

            // Apply multipliers
            if (room.resource === 'magic') {
                rate *= Math.pow(2, SaveData.upgrades.magicMult);
                rate *= (1 + SaveData.blessings * 0.1);
            }
            if (room.resource === 'knowledge') {
                rate *= Math.pow(2, SaveData.upgrades.knowledgeMult);
            }

            SaveData[room.resource] += rate * dt;
            if (room.resource === 'magic') {
                SaveData.totalMagic += rate * dt;
            }
        }
    }

    // Auto click upgrade
    if (SaveData.upgrades.autoClick > 0) {
        const autoRate = SaveData.upgrades.autoClick * 0.5;
        const clickPower = 1 + SaveData.upgrades.clickPower;
        const magicMult = Math.pow(2, SaveData.upgrades.magicMult) * (1 + SaveData.blessings * 0.1);
        const autoMagic = autoRate * clickPower * magicMult * dt;

        SaveData.magic += autoMagic;
        SaveData.totalMagic += autoMagic;
    }

    // Holding orb bonus
    if (mouse.down && state.selectedRoom === 'orb') {
        const orbX = 200;
        const orbY = 300;
        const dist = Math.sqrt((mouse.x - orbX) ** 2 + (mouse.y - orbY) ** 2);

        if (dist <= 70) {
            const holdRate = 2; // clicks per second while holding
            const clickPower = 1 + SaveData.upgrades.clickPower;
            const magicMult = Math.pow(2, SaveData.upgrades.magicMult) * (1 + SaveData.blessings * 0.1);
            const holdMagic = holdRate * clickPower * magicMult * dt;

            SaveData.magic += holdMagic;
            SaveData.totalMagic += holdMagic;
            state.orbPulse = Math.max(state.orbPulse, 0.1);
        }
    }

    // Update particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 100 * dt; // gravity
        p.life -= dt;

        if (p.life <= 0) {
            state.particles.splice(i, 1);
        }
    }

    // Update click feedback
    for (let i = state.clickFeedback.length - 1; i >= 0; i--) {
        const f = state.clickFeedback[i];
        f.y -= 40 * dt;
        f.life -= dt;

        if (f.life <= 0) {
            state.clickFeedback.splice(i, 1);
        }
    }

    // Orb pulse decay
    state.orbPulse = Math.max(0, state.orbPulse - dt * 2);

    // Auto save every 30 seconds
    state.lastSave += dt;
    if (state.lastSave >= 30) {
        SaveData.save();
        state.lastSave = 0;
    }
}

// ============= DRAWING =============
function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num).toString();
}

function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    clearButtons();

    drawTower();
    drawMainPanel();
    drawRightPanel();
    drawTopBar();

    // Draw particles
    for (const p of state.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw click feedback
    for (const f of state.clickFeedback) {
        ctx.fillStyle = COLORS.magic;
        ctx.globalAlpha = f.life;
        ctx.font = 'bold 18px VT323';
        ctx.textAlign = 'center';
        ctx.fillText('+' + formatNumber(f.value), f.x, f.y);
    }
    ctx.globalAlpha = 1;

    // Draw buttons
    for (const btn of buttons) {
        const hovered = isButtonHovered(btn);
        ctx.fillStyle = !btn.enabled ? '#333' : hovered ? COLORS.primary : COLORS.dark;
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

        if (btn.enabled) {
            ctx.strokeStyle = COLORS.primary;
            ctx.lineWidth = 1;
            ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        }

        ctx.fillStyle = btn.enabled ? COLORS.text : '#666';
        ctx.font = '14px VT323';
        ctx.textAlign = 'center';
        ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
    }
}

function drawTopBar() {
    ctx.fillStyle = 'rgba(45, 18, 48, 0.95)';
    ctx.fillRect(0, 0, WIDTH, 50);

    ctx.strokeStyle = COLORS.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(WIDTH, 50);
    ctx.stroke();

    // Resources
    ctx.font = '18px VT323';
    ctx.textAlign = 'left';

    ctx.fillStyle = COLORS.magic;
    ctx.fillText(`Magic: ${formatNumber(SaveData.magic)}`, 20, 30);

    ctx.fillStyle = COLORS.gold;
    ctx.fillText(`Spirits: ${SaveData.spirits}`, 180, 30);

    ctx.fillStyle = COLORS.knowledge;
    ctx.fillText(`Knowledge: ${formatNumber(SaveData.knowledge)}`, 300, 30);

    if (SaveData.unlockedRooms.includes('forest')) {
        ctx.fillStyle = COLORS.wood;
        ctx.fillText(`Wood: ${formatNumber(SaveData.wood)}`, 470, 30);
    }

    if (SaveData.unlockedRooms.includes('academy')) {
        ctx.fillStyle = COLORS.research;
        ctx.fillText(`Research: ${formatNumber(SaveData.research)}`, 600, 30);
    }

    // Blessings
    if (SaveData.blessings > 0) {
        ctx.fillStyle = COLORS.gold;
        ctx.textAlign = 'right';
        ctx.fillText(`Blessings: ${SaveData.blessings}`, WIDTH - 20, 30);
    }
}

function drawTower() {
    const towerX = 50;
    const towerW = 300;

    // Tower background
    ctx.fillStyle = COLORS.dark;
    ctx.fillRect(towerX, 60, towerW, HEIGHT - 70);
    ctx.strokeStyle = COLORS.primary;
    ctx.lineWidth = 2;
    ctx.strokeRect(towerX, 60, towerW, HEIGHT - 70);

    // Draw rooms
    let y = 520;
    const roomHeight = 100;

    for (let i = 0; i < SaveData.unlockedRooms.length && i < 5; i++) {
        const roomId = SaveData.unlockedRooms[i];
        const room = ROOMS[roomId];
        const isSelected = state.selectedRoom === roomId;

        // Room background
        ctx.fillStyle = isSelected ? 'rgba(255, 105, 180, 0.2)' : 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(towerX + 5, y, towerW - 10, roomHeight - 5);

        if (isSelected) {
            ctx.strokeStyle = COLORS.primary;
            ctx.lineWidth = 2;
            ctx.strokeRect(towerX + 5, y, towerW - 10, roomHeight - 5);
        }

        // Room icon
        ctx.fillStyle = room.color;
        ctx.font = '24px VT323';
        ctx.textAlign = 'left';

        const icons = { orb: '🔮', study: '📚', forest: '🌲', academy: '🎓' };
        ctx.fillText(icons[roomId] || '⬜', towerX + 15, y + 35);

        // Room name
        ctx.fillStyle = COLORS.text;
        ctx.font = '16px VT323';
        ctx.fillText(room.name, towerX + 50, y + 30);

        // Assigned spirits
        const assigned = SaveData.assignments[room.spiritType];
        ctx.fillStyle = COLORS.gold;
        ctx.font = '14px VT323';
        ctx.fillText(`Spirits: ${assigned}`, towerX + 50, y + 50);

        // Production rate
        if (assigned > 0) {
            let rate = room.baseRate * assigned;
            if (room.resource === 'magic') rate *= Math.pow(2, SaveData.upgrades.magicMult);
            if (room.resource === 'knowledge') rate *= Math.pow(2, SaveData.upgrades.knowledgeMult);

            ctx.fillStyle = room.color;
            ctx.fillText(`+${rate.toFixed(1)}/sec`, towerX + 50, y + 70);
        }

        // Room select button
        addButton(`select_${roomId}`, towerX + 5, y, towerW - 10, roomHeight - 5, '', () => {
            state.selectedRoom = roomId;
        });

        y -= roomHeight;
    }

    // Ascension progress
    if (SaveData.ascensionLevel < ASCENSION_COSTS.length) {
        const nextCost = ASCENSION_COSTS[SaveData.ascensionLevel];
        const progress = Math.min(1, SaveData.totalMagic / nextCost);

        ctx.fillStyle = '#333';
        ctx.fillRect(towerX + 10, 65, towerW - 20, 15);
        ctx.fillStyle = COLORS.secondary;
        ctx.fillRect(towerX + 10, 65, (towerW - 20) * progress, 15);

        ctx.fillStyle = COLORS.text;
        ctx.font = '12px VT323';
        ctx.textAlign = 'center';
        ctx.fillText(`Ascension ${SaveData.ascensionLevel + 1}: ${formatNumber(SaveData.totalMagic)}/${formatNumber(nextCost)}`, towerX + towerW / 2, 77);

        if (canAscend()) {
            addButton('ascend', towerX + towerW / 2 - 50, 85, 100, 25, 'ASCEND!', ascend);
        }
    }
}

function drawMainPanel() {
    const panelX = 360;
    const panelY = 60;
    const panelW = 200;
    const panelH = HEIGHT - 70;

    ctx.fillStyle = 'rgba(45, 18, 48, 0.8)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = COLORS.primary;
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Room-specific content
    const room = ROOMS[state.selectedRoom];
    if (!room) return;

    ctx.fillStyle = COLORS.text;
    ctx.font = '20px VT323';
    ctx.textAlign = 'center';
    ctx.fillText(room.name, panelX + panelW / 2, panelY + 30);

    ctx.font = '14px VT323';
    ctx.fillStyle = '#aaa';
    ctx.fillText(room.desc, panelX + panelW / 2, panelY + 55);

    if (state.selectedRoom === 'orb') {
        // Draw clickable orb
        const orbX = panelX + panelW / 2;
        const orbY = panelY + 150;
        const orbRadius = 50 + state.orbPulse * 20;

        // Glow
        const gradient = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbRadius + 20);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orbX, orbY, orbRadius + 20, 0, Math.PI * 2);
        ctx.fill();

        // Orb
        ctx.fillStyle = COLORS.magic;
        ctx.beginPath();
        ctx.arc(orbX, orbY, orbRadius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(orbX - 15, orbY - 15, orbRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COLORS.text;
        ctx.font = '14px VT323';
        ctx.fillText('Click or Hold!', panelX + panelW / 2, panelY + 230);

        const clickPower = 1 + SaveData.upgrades.clickPower;
        const magicMult = Math.pow(2, SaveData.upgrades.magicMult) * (1 + SaveData.blessings * 0.1);
        ctx.fillText(`+${formatNumber(clickPower * magicMult)}/click`, panelX + panelW / 2, panelY + 250);
    }

    // Spirit assignment controls
    const totalAssigned = Object.values(SaveData.assignments).reduce((a, b) => a + b, 0);
    const freeSpirits = SaveData.spirits - totalAssigned;

    ctx.fillStyle = COLORS.text;
    ctx.font = '16px VT323';
    ctx.textAlign = 'center';
    ctx.fillText(`Free Spirits: ${freeSpirits}`, panelX + panelW / 2, panelY + 300);

    const assigned = SaveData.assignments[room.spiritType];
    ctx.fillText(`Assigned: ${assigned}`, panelX + panelW / 2, panelY + 325);

    addButton('assign', panelX + 20, panelY + 340, 70, 30, '+Spirit', () => assignSpirit(state.selectedRoom), freeSpirits > 0);
    addButton('unassign', panelX + 110, panelY + 340, 70, 30, '-Spirit', () => unassignSpirit(state.selectedRoom), assigned > 0);

    // Summon spirit button
    const spiritCost = getSpiritCost();
    ctx.fillStyle = COLORS.gold;
    ctx.font = '14px VT323';
    ctx.fillText(`Summon: ${formatNumber(spiritCost)} magic`, panelX + panelW / 2, panelY + 410);

    addButton('summon', panelX + 30, panelY + 420, 140, 35, 'Summon Spirit', summonSpirit, SaveData.magic >= spiritCost);

    // Prestige
    if (canPrestige()) {
        ctx.fillStyle = COLORS.gold;
        ctx.font = '14px VT323';
        ctx.fillText('Prestige Available!', panelX + panelW / 2, panelY + 480);
        addButton('prestige', panelX + 30, panelY + 490, 140, 35, 'PRESTIGE', prestige);
    }
}

function drawRightPanel() {
    const panelX = 570;
    const panelY = 60;
    const panelW = 220;
    const panelH = HEIGHT - 70;

    ctx.fillStyle = 'rgba(45, 18, 48, 0.8)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = COLORS.primary;
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.fillStyle = COLORS.text;
    ctx.font = '18px VT323';
    ctx.textAlign = 'center';
    ctx.fillText('UPGRADES', panelX + panelW / 2, panelY + 25);

    let y = panelY + 50;

    for (const [id, upgrade] of Object.entries(UPGRADES)) {
        const level = SaveData.upgrades[id];
        const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, level));
        const maxed = level >= upgrade.max;
        const canBuy = !maxed && SaveData[upgrade.resource] >= cost;

        ctx.fillStyle = COLORS.text;
        ctx.font = '14px VT323';
        ctx.textAlign = 'left';
        ctx.fillText(upgrade.name, panelX + 10, y + 15);

        ctx.fillStyle = '#888';
        ctx.font = '12px VT323';
        ctx.fillText(upgrade.desc, panelX + 10, y + 30);
        ctx.fillText(`Level: ${level}/${upgrade.max}`, panelX + 10, y + 45);

        if (!maxed) {
            const resourceColors = { magic: COLORS.magic, knowledge: COLORS.knowledge, wood: COLORS.wood, research: COLORS.research };
            addButton(`buy_${id}`, panelX + 130, y + 10, 80, 35,
                `${formatNumber(cost)}`, () => buyUpgrade(id), canBuy);

            ctx.fillStyle = resourceColors[upgrade.resource] || COLORS.text;
            ctx.font = '10px VT323';
            ctx.textAlign = 'center';
            ctx.fillText(upgrade.resource, panelX + 170, y + 52);
        } else {
            ctx.fillStyle = COLORS.gold;
            ctx.font = '12px VT323';
            ctx.textAlign = 'right';
            ctx.fillText('MAXED', panelX + panelW - 10, y + 35);
        }

        y += 70;
    }

    // Stats
    ctx.fillStyle = '#666';
    ctx.font = '12px VT323';
    ctx.textAlign = 'left';
    ctx.fillText(`Total Clicks: ${formatNumber(SaveData.totalClicks)}`, panelX + 10, panelY + panelH - 50);
    ctx.fillText(`Total Magic: ${formatNumber(SaveData.totalMagic)}`, panelX + 10, panelY + panelH - 35);
    ctx.fillText(`Prestiges: ${SaveData.prestigeCount}`, panelX + 10, panelY + panelH - 20);
}

// ============= GAME LOOP =============
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    updateGame(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

// ============= EXPOSE FOR TESTING =============
window.getGameState = () => ({
    screen: 'game',
    magic: SaveData.magic,
    spirits: SaveData.spirits,
    ascensionLevel: SaveData.ascensionLevel
});

// ============= START =============
SaveData.load();
requestAnimationFrame(gameLoop);
