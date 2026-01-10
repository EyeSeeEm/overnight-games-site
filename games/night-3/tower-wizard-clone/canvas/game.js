// Tower Wizard Clone - Incremental/Idle Game
// Canvas Version

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Fullscreen canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Color palette matching reference
const COLORS = {
    // Background
    bg: '#1a1a2e',
    bgLight: '#2a2a4e',
    mountain1: '#252545',
    mountain2: '#1e1e3e',
    mountain3: '#151530',

    // Pink/salmon theme
    pink: '#e8a0a0',
    pinkLight: '#f0b8b8',
    pinkDark: '#c88080',
    salmon: '#d4918f',

    // Tower colors
    towerPink: '#d4918f',
    towerLight: '#e8b0b0',
    towerRoof: '#c07878',
    towerWindow: '#2a2a4e',

    // UI
    panelBg: '#0a0a1a',
    panelBorder: '#c88080',
    text: '#ffffff',
    textDim: '#a0a0a0',

    // Resources
    magic: '#9370db',
    knowledge: '#6495ed',
    wood: '#8b6b4a',
    spirits: '#e8a0a0',

    // Orb
    orbDark: '#1a1a3e',
    orbGlow: '#ff69b4',
    orbHighlight: '#ffffff'
};

// Game state
const game = {
    tick: 0,
    magic: 0,
    lifetimeMagic: 0,
    spirits: 0,
    knowledge: 0,
    wood: 0,

    towerLevel: 1,
    prestigePoints: 0,

    // Spirit assignments
    cloudlings: 0,
    spiritTomes: 0,
    druids: 0,

    // Upgrades
    wizardMagic: 0,

    // UI state
    selectedRoom: 'orb',
    orbHeld: false,
    orbClickCooldown: 0,

    // Particles
    particles: [],
    floatingSpirits: []
};

// Costs and rates
const SPIRIT_COST_BASE = 10;
const SPIRIT_COST_FACTOR = 1.15;

const CLOUDLING_RATE = 0.5; // magic per second per cloudling
const SPIRIT_TOME_RATE = 0.2; // knowledge per second
const DRUID_RATE = 0.3; // wood per second

const ASCENSION_COSTS = [0, 100, 1000, 10000, 50000, 200000];

// Input handling
let mouseX = 0, mouseY = 0;
let mouseDown = false;

canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
    handleClick(e.clientX, e.clientY);
});

canvas.addEventListener('mouseup', () => {
    mouseDown = false;
    game.orbHeld = false;
});

// Click handlers
function handleClick(x, y) {
    // Check orb click
    const orbX = 200;
    const orbY = 120;
    const orbRadius = 50;

    if (Math.hypot(x - orbX, y - orbY) < orbRadius) {
        clickOrb();
        game.orbHeld = true;
        return;
    }

    // Check room buttons
    checkRoomButtons(x, y);

    // Check action buttons
    checkActionButtons(x, y);
}

function clickOrb() {
    if (game.orbClickCooldown > 0) return;

    const magicGain = getMagicPerClick();
    game.magic += magicGain;
    game.lifetimeMagic += magicGain;
    game.orbClickCooldown = 0.05; // Faster clicking

    // Create particles
    createMagicParticle(200, 120);

    // More particles for visual feedback
    for (let i = 0; i < 3; i++) {
        game.particles.push({
            x: 200 + (Math.random() - 0.5) * 60,
            y: 120 + (Math.random() - 0.5) * 60,
            vx: (Math.random() - 0.5) * 100,
            vy: -Math.random() * 100 - 50,
            life: 0.8,
            color: i % 2 === 0 ? COLORS.orbGlow : COLORS.magic
        });
    }
}

function getMagicPerClick() {
    return Math.pow(2, game.wizardMagic);
}

function getSpiritCost() {
    return Math.floor(SPIRIT_COST_BASE * Math.pow(SPIRIT_COST_FACTOR, game.spirits));
}

function summonSpirit() {
    const cost = getSpiritCost();
    if (game.magic >= cost) {
        game.magic -= cost;
        game.spirits++;
        createFloatingSpirit();
        return true;
    }
    return false;
}

function assignSpirit(type) {
    if (game.spirits <= getTotalAssigned()) return false;

    switch(type) {
        case 'cloudling':
            game.cloudlings++;
            break;
        case 'spiritTome':
            if (game.towerLevel < 2) return false;
            game.spiritTomes++;
            break;
        case 'druid':
            if (game.towerLevel < 3) return false;
            game.druids++;
            break;
    }
    return true;
}

function unassignSpirit(type) {
    switch(type) {
        case 'cloudling':
            if (game.cloudlings > 0) game.cloudlings--;
            break;
        case 'spiritTome':
            if (game.spiritTomes > 0) game.spiritTomes--;
            break;
        case 'druid':
            if (game.druids > 0) game.druids--;
            break;
    }
}

function getTotalAssigned() {
    return game.cloudlings + game.spiritTomes + game.druids;
}

function canAscend() {
    if (game.towerLevel >= ASCENSION_COSTS.length) return false;
    return game.lifetimeMagic >= ASCENSION_COSTS[game.towerLevel];
}

function ascend() {
    if (canAscend()) {
        game.towerLevel++;
        return true;
    }
    return false;
}

// Button handling
const buttons = [];

function checkRoomButtons(x, y) {
    const roomY = canvas.height - 60;
    const rooms = ['orb', 'study', 'forest'];
    const startX = canvas.width / 2 - 150;

    rooms.forEach((room, i) => {
        const bx = startX + i * 100;
        if (x >= bx && x <= bx + 90 && y >= roomY && y <= roomY + 40) {
            if (room === 'study' && game.towerLevel < 2) return;
            if (room === 'forest' && game.towerLevel < 3) return;
            game.selectedRoom = room;
        }
    });
}

function checkActionButtons(x, y) {
    const panelX = canvas.width - 320;
    const panelY = 200;

    // Summon spirit button
    if (x >= panelX + 10 && x <= panelX + 290 && y >= panelY + 60 && y <= panelY + 95) {
        summonSpirit();
        return;
    }

    // Room-specific buttons
    const actionY = panelY + 140;

    if (game.selectedRoom === 'orb') {
        // Assign cloudling
        if (x >= panelX + 10 && x <= panelX + 140 && y >= actionY && y <= actionY + 35) {
            assignSpirit('cloudling');
        }
        // Unassign cloudling
        if (x >= panelX + 150 && x <= panelX + 290 && y >= actionY && y <= actionY + 35) {
            unassignSpirit('cloudling');
        }
    } else if (game.selectedRoom === 'study') {
        // Assign spirit tome
        if (x >= panelX + 10 && x <= panelX + 140 && y >= actionY && y <= actionY + 35) {
            assignSpirit('spiritTome');
        }
        // Unassign
        if (x >= panelX + 150 && x <= panelX + 290 && y >= actionY && y <= actionY + 35) {
            unassignSpirit('spiritTome');
        }
    } else if (game.selectedRoom === 'forest') {
        // Assign druid
        if (x >= panelX + 10 && x <= panelX + 140 && y >= actionY && y <= actionY + 35) {
            assignSpirit('druid');
        }
        // Unassign
        if (x >= panelX + 150 && x <= panelX + 290 && y >= actionY && y <= actionY + 35) {
            unassignSpirit('druid');
        }
    }

    // Ascend button
    if (x >= panelX + 10 && x <= panelX + 290 && y >= panelY + 250 && y <= panelY + 285) {
        ascend();
    }
}

// Particle system
function createMagicParticle(x, y) {
    for (let i = 0; i < 5; i++) {
        game.particles.push({
            x: x + (Math.random() - 0.5) * 30,
            y: y + (Math.random() - 0.5) * 30,
            vx: (Math.random() - 0.5) * 50,
            vy: -Math.random() * 80 - 20,
            life: 1,
            color: COLORS.magic
        });
    }
}

function createFloatingSpirit() {
    game.floatingSpirits.push({
        x: 200 + Math.random() * 100,
        y: 200 + Math.random() * 200,
        angle: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
        bob: Math.random() * Math.PI * 2
    });
}

// Update
function update(dt) {
    game.tick++;

    // Orb cooldown
    if (game.orbClickCooldown > 0) {
        game.orbClickCooldown -= dt;
    }

    // Auto-click while holding orb
    if (game.orbHeld && game.orbClickCooldown <= 0) {
        clickOrb();
    }

    // Cloudling magic generation
    const cloudlingMagic = game.cloudlings * CLOUDLING_RATE * dt;
    game.magic += cloudlingMagic;
    game.lifetimeMagic += cloudlingMagic;

    // Knowledge generation
    if (game.towerLevel >= 2) {
        game.knowledge += game.spiritTomes * SPIRIT_TOME_RATE * dt;
    }

    // Wood generation
    if (game.towerLevel >= 3) {
        game.wood += game.druids * DRUID_RATE * dt;
    }

    // Update particles
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 50 * dt; // gravity
        p.life -= dt * 2;

        if (p.life <= 0) {
            game.particles.splice(i, 1);
        }
    }

    // Update floating spirits
    for (const spirit of game.floatingSpirits) {
        spirit.angle += spirit.speed * dt;
        spirit.bob += dt * 2;
    }
}

// Draw functions
function draw() {
    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawTower();
    drawOrb();
    drawFloatingSpirits();
    drawParticles();
    drawResourcePanel();
    drawActionPanel();
    drawRoomNav();
}

function drawBackground() {
    // Mountains with dithering effect
    const mountainLayers = [
        { color: COLORS.mountain3, height: 0.5, offset: 0 },
        { color: COLORS.mountain2, height: 0.4, offset: 100 },
        { color: COLORS.mountain1, height: 0.3, offset: 200 }
    ];

    for (const layer of mountainLayers) {
        ctx.fillStyle = layer.color;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);

        for (let x = 0; x <= canvas.width; x += 20) {
            const baseY = canvas.height - canvas.height * layer.height;
            const peakY = baseY - Math.sin((x + layer.offset) * 0.01) * 100
                         - Math.sin((x + layer.offset) * 0.02) * 50;
            ctx.lineTo(x, peakY);
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Dithering effect
        ctx.fillStyle = COLORS.bg;
        for (let x = 0; x < canvas.width; x += 4) {
            for (let y = canvas.height * (1 - layer.height); y < canvas.height; y += 4) {
                if ((x + y) % 8 === 0 && Math.random() < 0.3) {
                    ctx.fillRect(x, y, 2, 2);
                }
            }
        }
    }

    // Ground silhouette (trees)
    ctx.fillStyle = '#0a0a1a';
    for (let x = 0; x < canvas.width; x += 30) {
        const treeHeight = 20 + Math.random() * 30;
        // Simple triangle tree
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - 50);
        ctx.lineTo(x + 10, canvas.height - 50 - treeHeight);
        ctx.lineTo(x + 20, canvas.height - 50);
        ctx.closePath();
        ctx.fill();
    }

    // Pink trees in foreground
    ctx.fillStyle = COLORS.salmon;
    for (let x = 50; x < 350; x += 40) {
        const treeHeight = 40 + Math.sin(x) * 20;
        drawPixelTree(x, canvas.height - 80, treeHeight);
    }

    // Floating clouds
    ctx.fillStyle = '#4a6080';
    drawCloud(canvas.width - 200, 80, 60);
    drawCloud(100, 150, 40);
}

function drawPixelTree(x, y, height) {
    // Trunk
    ctx.fillStyle = COLORS.pinkDark;
    ctx.fillRect(x + 8, y, 4, 20);

    // Foliage (triangle)
    ctx.fillStyle = COLORS.salmon;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 10, y - height);
    ctx.lineTo(x + 20, y);
    ctx.closePath();
    ctx.fill();
}

function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.3, 0, Math.PI * 2);
    ctx.arc(x + size * 0.7, y, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
}

function drawTower() {
    const towerX = 320;
    const towerBaseY = canvas.height - 100;
    const floorHeight = 80;

    // Draw tower floors from bottom to top
    for (let i = 0; i < game.towerLevel && i < 6; i++) {
        const floorY = towerBaseY - i * floorHeight;
        drawTowerFloor(towerX, floorY, i);
    }

    // Roof
    const roofY = towerBaseY - game.towerLevel * floorHeight;
    drawTowerRoof(towerX, roofY);
}

function drawTowerFloor(x, y, level) {
    const width = 60;
    const height = 70;

    // Main body
    ctx.fillStyle = COLORS.towerPink;
    ctx.fillRect(x - width/2, y - height, width, height);

    // Highlight
    ctx.fillStyle = COLORS.towerLight;
    ctx.fillRect(x - width/2, y - height, 4, height);

    // Shadow
    ctx.fillStyle = COLORS.pinkDark;
    ctx.fillRect(x + width/2 - 4, y - height, 4, height);

    // Window
    ctx.fillStyle = COLORS.towerWindow;
    ctx.fillRect(x - 8, y - height + 20, 16, 24);

    // Window glow
    ctx.fillStyle = '#4a5a8a';
    ctx.fillRect(x - 6, y - height + 22, 4, 8);

    // Floor label
    ctx.fillStyle = COLORS.text;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    const labels = ['Orb', 'Study', 'Forest', 'Academy', 'Dragon', 'Alchemy'];
    if (labels[level]) {
        ctx.fillText(labels[level], x, y - 5);
    }
}

function drawTowerRoof(x, y) {
    // Pointed roof
    ctx.fillStyle = COLORS.towerRoof;
    ctx.beginPath();
    ctx.moveTo(x - 40, y);
    ctx.lineTo(x, y - 60);
    ctx.lineTo(x + 40, y);
    ctx.closePath();
    ctx.fill();

    // Roof highlight
    ctx.fillStyle = COLORS.towerLight;
    ctx.beginPath();
    ctx.moveTo(x - 35, y - 5);
    ctx.lineTo(x - 5, y - 50);
    ctx.lineTo(x - 5, y - 5);
    ctx.closePath();
    ctx.fill();
}

function drawOrb() {
    const orbX = 200;
    const orbY = 120;
    const orbRadius = 45;

    // Glow
    const glowGradient = ctx.createRadialGradient(orbX, orbY, orbRadius * 0.5, orbX, orbY, orbRadius * 2);
    glowGradient.addColorStop(0, 'rgba(255, 105, 180, 0.3)');
    glowGradient.addColorStop(1, 'rgba(255, 105, 180, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Orb body
    const orbGradient = ctx.createRadialGradient(orbX - 15, orbY - 15, 5, orbX, orbY, orbRadius);
    orbGradient.addColorStop(0, '#3a3a5e');
    orbGradient.addColorStop(0.5, COLORS.orbDark);
    orbGradient.addColorStop(1, '#0a0a1e');
    ctx.fillStyle = orbGradient;
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbRadius, 0, Math.PI * 2);
    ctx.fill();

    // Stars inside orb
    ctx.fillStyle = COLORS.orbHighlight;
    for (let i = 0; i < 5; i++) {
        const angle = (game.tick * 0.02 + i * Math.PI * 0.4);
        const dist = 15 + Math.sin(game.tick * 0.05 + i) * 10;
        const sx = orbX + Math.cos(angle) * dist;
        const sy = orbY + Math.sin(angle) * dist;
        ctx.fillRect(sx - 1, sy - 1, 2, 2);
    }

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(orbX - 15, orbY - 15, 8, 0, Math.PI * 2);
    ctx.fill();

    // Magic per click text
    ctx.fillStyle = COLORS.spirits;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`+${formatNumber(getMagicPerClick())}`, orbX, orbY - orbRadius - 10);

    // Click instruction
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '12px monospace';
    ctx.fillText('Click orb for magic', orbX, orbY + orbRadius + 20);
}

function drawFloatingSpirits() {
    ctx.fillStyle = COLORS.spirits;

    for (let i = 0; i < Math.min(game.floatingSpirits.length, 20); i++) {
        const spirit = game.floatingSpirits[i];
        const bobY = Math.sin(spirit.bob) * 5;

        // Simple spirit shape
        ctx.beginPath();
        ctx.arc(spirit.x, spirit.y + bobY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = COLORS.panelBg;
        ctx.fillRect(spirit.x - 3, spirit.y + bobY - 2, 2, 2);
        ctx.fillRect(spirit.x + 1, spirit.y + bobY - 2, 2, 2);
        ctx.fillStyle = COLORS.spirits;
    }
}

function drawParticles() {
    for (const p of game.particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawResourcePanel() {
    const panelX = 20;
    const panelY = 20;
    const panelW = 160;
    const panelH = 150;

    // Panel background
    ctx.fillStyle = COLORS.panelBg;
    ctx.fillRect(panelX, panelY, panelW, panelH);

    // Border
    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Title
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Resources', panelX + 10, panelY + 20);

    // Resources
    ctx.font = '12px monospace';
    const resources = [
        { icon: '\u2727', name: 'Magic', value: game.magic, color: COLORS.magic },
        { icon: '\u263C', name: 'Spirits', value: `${getTotalAssigned()}/${game.spirits}`, color: COLORS.spirits },
        { icon: '\u2726', name: 'Knowledge', value: game.knowledge, color: COLORS.knowledge },
        { icon: '\u2663', name: 'Wood', value: game.wood, color: COLORS.wood }
    ];

    resources.forEach((res, i) => {
        const y = panelY + 45 + i * 25;
        ctx.fillStyle = res.color;
        ctx.fillText(res.icon, panelX + 10, y);
        ctx.fillStyle = COLORS.text;
        const value = typeof res.value === 'number' ? formatNumber(res.value) : res.value;
        ctx.fillText(value, panelX + 30, y);
    });
}

function drawActionPanel() {
    const panelX = canvas.width - 320;
    const panelY = 200;
    const panelW = 300;
    const panelH = 350;

    // Panel background
    ctx.fillStyle = COLORS.panelBg;
    ctx.fillRect(panelX, panelY, panelW, panelH);

    // Border
    ctx.strokeStyle = COLORS.panelBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Room title
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    const roomTitles = {
        orb: 'Orb Room',
        study: 'Study',
        forest: 'Forestry'
    };
    ctx.fillText(roomTitles[game.selectedRoom] || 'Room', panelX + 10, panelY + 25);

    // Summon spirit button
    const spiritCost = getSpiritCost();
    const canAfford = game.magic >= spiritCost;
    drawButton(panelX + 10, panelY + 60, 280, 35,
        `Summon Spirit   Cost: ${formatNumber(spiritCost)}`,
        canAfford);

    // Room-specific content
    ctx.font = '12px monospace';
    const infoY = panelY + 110;

    if (game.selectedRoom === 'orb') {
        ctx.fillStyle = COLORS.text;
        ctx.fillText(`Cloudlings: ${game.cloudlings}`, panelX + 10, infoY);
        ctx.fillText(`Magic/sec: ${formatNumber(game.cloudlings * CLOUDLING_RATE)}`, panelX + 10, infoY + 20);

        const freeSpirits = game.spirits - getTotalAssigned();
        drawButton(panelX + 10, panelY + 140, 130, 35, `Assign +1`, freeSpirits > 0);
        drawButton(panelX + 150, panelY + 140, 130, 35, `Remove -1`, game.cloudlings > 0);

    } else if (game.selectedRoom === 'study') {
        if (game.towerLevel < 2) {
            ctx.fillStyle = COLORS.textDim;
            ctx.fillText('Unlock at Tower Level 2', panelX + 10, infoY);
        } else {
            ctx.fillStyle = COLORS.text;
            ctx.fillText(`Spirit Tomes: ${game.spiritTomes}`, panelX + 10, infoY);
            ctx.fillText(`Knowledge/sec: ${formatNumber(game.spiritTomes * SPIRIT_TOME_RATE)}`, panelX + 10, infoY + 20);

            const freeSpirits = game.spirits - getTotalAssigned();
            drawButton(panelX + 10, panelY + 140, 130, 35, `Assign +1`, freeSpirits > 0);
            drawButton(panelX + 150, panelY + 140, 130, 35, `Remove -1`, game.spiritTomes > 0);
        }

    } else if (game.selectedRoom === 'forest') {
        if (game.towerLevel < 3) {
            ctx.fillStyle = COLORS.textDim;
            ctx.fillText('Unlock at Tower Level 3', panelX + 10, infoY);
        } else {
            ctx.fillStyle = COLORS.text;
            ctx.fillText(`Druids: ${game.druids}`, panelX + 10, infoY);
            ctx.fillText(`Wood/sec: ${formatNumber(game.druids * DRUID_RATE)}`, panelX + 10, infoY + 20);

            const freeSpirits = game.spirits - getTotalAssigned();
            drawButton(panelX + 10, panelY + 140, 130, 35, `Assign +1`, freeSpirits > 0);
            drawButton(panelX + 150, panelY + 140, 130, 35, `Remove -1`, game.druids > 0);
        }
    }

    // Tower level info
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`Tower Level: ${game.towerLevel}`, panelX + 10, panelY + 210);

    ctx.font = '12px monospace';
    ctx.fillStyle = COLORS.textDim;
    if (game.towerLevel < ASCENSION_COSTS.length) {
        const nextCost = ASCENSION_COSTS[game.towerLevel];
        ctx.fillText(`Next: ${formatNumber(nextCost)} lifetime magic`, panelX + 10, panelY + 230);
    }

    // Ascend button
    const canAscendNow = canAscend();
    drawButton(panelX + 10, panelY + 250, 280, 35, 'Ascend Tower', canAscendNow);

    // Stats
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '11px monospace';
    ctx.fillText(`Lifetime Magic: ${formatNumber(game.lifetimeMagic)}`, panelX + 10, panelY + 310);
    ctx.fillText(`Prestige Points: ${game.prestigePoints}`, panelX + 10, panelY + 330);
}

function drawButton(x, y, w, h, text, enabled) {
    // Button background
    ctx.fillStyle = enabled ? '#4b0082' : '#2a2a3a';
    ctx.fillRect(x, y, w, h);

    // Border
    ctx.strokeStyle = enabled ? COLORS.panelBorder : '#4a4a5a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Text
    ctx.fillStyle = enabled ? COLORS.text : COLORS.textDim;
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w/2, y + h/2 + 4);
    ctx.textAlign = 'left';
}

function drawRoomNav() {
    const navY = canvas.height - 60;
    const rooms = [
        { id: 'orb', name: 'Orb', unlocked: true },
        { id: 'study', name: 'Study', unlocked: game.towerLevel >= 2 },
        { id: 'forest', name: 'Forest', unlocked: game.towerLevel >= 3 }
    ];

    const startX = canvas.width / 2 - 150;

    rooms.forEach((room, i) => {
        const x = startX + i * 100;
        const selected = game.selectedRoom === room.id;

        // Button
        ctx.fillStyle = selected ? COLORS.panelBorder : (room.unlocked ? '#4b0082' : '#2a2a3a');
        ctx.fillRect(x, navY, 90, 40);

        ctx.strokeStyle = room.unlocked ? COLORS.panelBorder : '#4a4a5a';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, navY, 90, 40);

        // Text
        ctx.fillStyle = room.unlocked ? COLORS.text : COLORS.textDim;
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(room.name, x + 45, navY + 25);
    });

    ctx.textAlign = 'left';
}

function formatNumber(n) {
    if (n < 1000) return Math.floor(n).toString();
    if (n < 1000000) return (n / 1000).toFixed(1) + 'K';
    if (n < 1000000000) return (n / 1000000).toFixed(1) + 'M';
    return (n / 1000000000).toFixed(1) + 'B';
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

// Initialize floating spirits based on owned spirits
for (let i = 0; i < 3; i++) {
    createFloatingSpirit();
}

// Start game
requestAnimationFrame(gameLoop);

// Expose for testing
window.game = game;
window.gameState = { state: 'playing' };
