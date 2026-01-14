// Tower Wizard Clone - Canvas Implementation with Test Harness
// Agent 2 - Night 6

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════════
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;

    // Colors (pink/black theme)
    const COLORS = {
        background: '#1a1a2e',
        backgroundAlt: '#16213e',
        primary: '#FF69B4',
        primaryDark: '#DB7093',
        primaryLight: '#FFB6C1',
        magic: '#9370DB',
        knowledge: '#4169E1',
        wood: '#8B4513',
        gold: '#FFD700',
        text: '#FFFFFF',
        textDim: '#A0A0A0',
        button: '#4B0082',
        buttonHover: '#6A0DAD',
        orb: '#FF69B4',
        orbGlow: '#FFB6C1'
    };

    // Ascension requirements
    const ASCENSION_REQUIREMENTS = [
        0,           // Level 1 (start)
        100,         // Level 2
        1000,        // Level 3
        10000,       // Level 4
        50000,       // Level 5
        200000,      // Level 6
        1000000      // Level 7
    ];

    // Room unlocks by tower level
    const ROOM_UNLOCKS = {
        1: ['orb'],
        2: ['study'],
        3: ['forest'],
        4: [],
        5: ['academy']
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME STATE
    // ═══════════════════════════════════════════════════════════════════════════
    let canvas, ctx;
    let gamePaused = true;
    let gameState = 'menu';
    let lastTime = 0;
    let deltaTime = 0;

    // Input
    let keysDown = {};
    let activeKeys = new Set();
    let mouseX = 0, mouseY = 0;
    let mouseDown = false;

    // Resources
    let magic = 0;
    let lifetimeMagic = 0;
    let spirits = 0;
    let knowledge = 0;
    let wood = 0;

    // Spirit assignments
    let assignments = {
        cloudlings: 0,
        tomes: 0,
        druids: 0,
        sages: 0
    };

    // Progression
    let towerLevel = 1;
    let unlockedRooms = ['orb'];

    // Stats
    let stats = {
        clicks: 0,
        spiritsSummoned: 0,
        ascensions: 0
    };

    // Visual effects
    let floatingTexts = [];
    let particles = [];
    let orbPulse = 0;

    // Upgrades
    let upgrades = {
        wizardMagic: 0,  // +100% magic per click per level
        autoClick: 0     // Clicks per second
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    function formatNumber(num) {
        if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
        return Math.floor(num).toString();
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME LOGIC
    // ═══════════════════════════════════════════════════════════════════════════
    function getMagicMultiplier() {
        return Math.pow(2, upgrades.wizardMagic);
    }

    function getSpiritCost() {
        const totalSpirits = spirits + assignments.cloudlings + assignments.tomes +
            assignments.druids + assignments.sages;
        return Math.floor(10 * Math.pow(1.15, totalSpirits));
    }

    function clickOrb() {
        const baseMagic = 1;
        const mult = getMagicMultiplier();
        const gained = baseMagic * mult;

        magic += gained;
        lifetimeMagic += gained;
        stats.clicks++;

        // Visual feedback
        floatingTexts.push({
            x: 400 + randomRange(-30, 30),
            y: 200,
            text: `+${formatNumber(gained)}`,
            color: COLORS.magic,
            life: 1.0,
            vy: -60
        });

        // Particles
        for (let i = 0; i < 3; i++) {
            particles.push({
                x: 400,
                y: 200,
                vx: randomRange(-100, 100),
                vy: randomRange(-150, -50),
                color: COLORS.magic,
                life: 0.5,
                size: randomRange(3, 8)
            });
        }
    }

    function summonSpirit() {
        const cost = getSpiritCost();
        if (magic >= cost) {
            magic -= cost;
            spirits++;
            stats.spiritsSummoned++;

            floatingTexts.push({
                x: 600,
                y: 100,
                text: '+1 Spirit',
                color: COLORS.primary,
                life: 1.0,
                vy: -40
            });
        }
    }

    function assignSpirit(room) {
        if (spirits <= 0) return;

        switch (room) {
            case 'cloudlings':
                if (unlockedRooms.includes('orb')) {
                    spirits--;
                    assignments.cloudlings++;
                }
                break;
            case 'tomes':
                if (unlockedRooms.includes('study')) {
                    spirits--;
                    assignments.tomes++;
                }
                break;
            case 'druids':
                if (unlockedRooms.includes('forest')) {
                    spirits--;
                    assignments.druids++;
                }
                break;
            case 'sages':
                if (unlockedRooms.includes('academy')) {
                    spirits--;
                    assignments.sages++;
                }
                break;
        }
    }

    function canAscend() {
        if (towerLevel >= ASCENSION_REQUIREMENTS.length) return false;
        return lifetimeMagic >= ASCENSION_REQUIREMENTS[towerLevel];
    }

    function ascend() {
        if (!canAscend()) return;

        towerLevel++;
        stats.ascensions++;

        // Unlock new rooms
        const newRooms = ROOM_UNLOCKS[towerLevel] || [];
        for (const room of newRooms) {
            if (!unlockedRooms.includes(room)) {
                unlockedRooms.push(room);
                floatingTexts.push({
                    x: 400,
                    y: 300,
                    text: `Unlocked: ${room.toUpperCase()}!`,
                    color: COLORS.gold,
                    life: 2.0,
                    vy: -20
                });
            }
        }

        floatingTexts.push({
            x: 400,
            y: 250,
            text: `ASCENDED TO LEVEL ${towerLevel}!`,
            color: COLORS.primary,
            life: 2.5,
            vy: -30
        });
    }

    function buyUpgrade(type) {
        const costs = {
            wizardMagic: Math.floor(100 * Math.pow(2, upgrades.wizardMagic)),
            autoClick: Math.floor(500 * Math.pow(3, upgrades.autoClick))
        };

        const cost = costs[type];
        if (magic >= cost) {
            magic -= cost;
            upgrades[type]++;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UPDATE
    // ═══════════════════════════════════════════════════════════════════════════
    function update(dt) {
        if (gameState !== 'playing') return;

        // Orb pulse animation
        orbPulse += dt * 3;

        // Auto-generation from spirits
        // Cloudlings generate magic
        const cloudlingMagic = assignments.cloudlings * 0.5 * dt * getMagicMultiplier();
        magic += cloudlingMagic;
        lifetimeMagic += cloudlingMagic;

        // Tomes generate knowledge
        knowledge += assignments.tomes * 0.2 * dt;

        // Druids generate wood
        wood += assignments.druids * 0.3 * dt;

        // Auto-click from upgrades
        if (upgrades.autoClick > 0) {
            // Simple auto-clicker implementation
            const autoClicks = upgrades.autoClick * dt;
            if (autoClicks > 0) {
                const gained = autoClicks * getMagicMultiplier();
                magic += gained;
                lifetimeMagic += gained;
            }
        }

        // Holding space or mouse for fast clicking
        if (activeKeys.has(' ') || mouseDown) {
            clickOrb();
        }

        // Key actions
        if (keysDown['s'] || keysDown['S']) {
            summonSpirit();
            keysDown['s'] = false;
            keysDown['S'] = false;
        }
        if (keysDown['1']) {
            assignSpirit('cloudlings');
            keysDown['1'] = false;
        }
        if (keysDown['2']) {
            assignSpirit('tomes');
            keysDown['2'] = false;
        }
        if (keysDown['3']) {
            assignSpirit('druids');
            keysDown['3'] = false;
        }
        if (keysDown['4']) {
            assignSpirit('sages');
            keysDown['4'] = false;
        }
        if (keysDown['a'] || keysDown['A']) {
            ascend();
            keysDown['a'] = false;
            keysDown['A'] = false;
        }
        if (keysDown['u'] || keysDown['U']) {
            buyUpgrade('wizardMagic');
            keysDown['u'] = false;
            keysDown['U'] = false;
        }

        // Update floating texts
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.life -= dt;
            if (ft.life <= 0) {
                floatingTexts.splice(i, 1);
            }
        }

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt; // Gravity
            p.life -= dt;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDERING
    // ═══════════════════════════════════════════════════════════════════════════
    function render() {
        // Background
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (gameState === 'menu') {
            renderMenu();
            return;
        }

        renderTower();
        renderOrb();
        renderUI();
        renderParticles();
        renderFloatingTexts();
    }

    function renderMenu() {
        ctx.fillStyle = COLORS.primary;
        ctx.font = 'bold 48px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('TOWER WIZARD', CANVAS_WIDTH / 2, 150);

        ctx.fillStyle = COLORS.text;
        ctx.font = '20px Courier New';
        ctx.fillText('Build your magical tower!', CANVAS_WIDTH / 2, 200);

        ctx.font = '16px Courier New';
        ctx.fillText('CONTROLS:', CANVAS_WIDTH / 2, 280);
        ctx.fillText('Space/Click - Generate Magic', CANVAS_WIDTH / 2, 310);
        ctx.fillText('S - Summon Spirit', CANVAS_WIDTH / 2, 340);
        ctx.fillText('1/2/3/4 - Assign Spirit to Room', CANVAS_WIDTH / 2, 370);
        ctx.fillText('A - Ascend Tower', CANVAS_WIDTH / 2, 400);
        ctx.fillText('U - Buy Upgrade', CANVAS_WIDTH / 2, 430);

        ctx.fillStyle = COLORS.gold;
        ctx.font = '18px Courier New';
        ctx.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, 500);

        if (keysDown['Enter']) {
            startGame();
        }
    }

    function renderTower() {
        // Tower background
        const towerX = 50;
        const towerY = 100;
        const towerW = 200;
        const towerH = 400;

        // Draw tower frame
        ctx.fillStyle = COLORS.backgroundAlt;
        ctx.fillRect(towerX, towerY, towerW, towerH);
        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(towerX, towerY, towerW, towerH);

        // Draw floors
        const floorHeight = 60;
        for (let i = 0; i < towerLevel && i < 6; i++) {
            const floorY = towerY + towerH - (i + 1) * floorHeight;
            const roomIndex = i;

            // Floor background
            ctx.fillStyle = unlockedRooms[roomIndex] ? '#2a2a4e' : '#1a1a2e';
            ctx.fillRect(towerX + 5, floorY + 5, towerW - 10, floorHeight - 10);

            // Room name
            ctx.fillStyle = COLORS.text;
            ctx.font = '12px Courier New';
            ctx.textAlign = 'left';

            let roomName = '';
            let spiritCount = 0;
            switch (roomIndex) {
                case 0:
                    roomName = 'ORB';
                    spiritCount = assignments.cloudlings;
                    break;
                case 1:
                    roomName = 'STUDY';
                    spiritCount = assignments.tomes;
                    break;
                case 2:
                    roomName = 'FOREST';
                    spiritCount = assignments.druids;
                    break;
                case 3:
                    roomName = 'ACADEMY';
                    spiritCount = assignments.sages;
                    break;
                default:
                    roomName = `FLOOR ${roomIndex + 1}`;
            }

            if (unlockedRooms[roomIndex]) {
                ctx.fillText(roomName, towerX + 15, floorY + 25);
                ctx.fillStyle = COLORS.primary;
                ctx.fillText(`${spiritCount} spirits`, towerX + 15, floorY + 45);
            } else {
                ctx.fillStyle = COLORS.textDim;
                ctx.fillText('LOCKED', towerX + 15, floorY + 35);
            }
        }

        // Tower level indicator
        ctx.fillStyle = COLORS.gold;
        ctx.font = 'bold 16px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`Tower Lv.${towerLevel}`, towerX + towerW / 2, towerY - 10);
    }

    function renderOrb() {
        const orbX = 400;
        const orbY = 200;
        const baseRadius = 60;
        const pulseAmount = Math.sin(orbPulse) * 5;
        const radius = baseRadius + pulseAmount;

        // Glow effect
        const gradient = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, radius * 1.5);
        gradient.addColorStop(0, COLORS.orbGlow);
        gradient.addColorStop(0.5, 'rgba(255, 105, 180, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 105, 180, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orbX, orbY, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Main orb
        const orbGradient = ctx.createRadialGradient(orbX - 20, orbY - 20, 0, orbX, orbY, radius);
        orbGradient.addColorStop(0, '#FFFFFF');
        orbGradient.addColorStop(0.3, COLORS.orbGlow);
        orbGradient.addColorStop(1, COLORS.orb);
        ctx.fillStyle = orbGradient;
        ctx.beginPath();
        ctx.arc(orbX, orbY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Click hint
        ctx.fillStyle = COLORS.textDim;
        ctx.font = '14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('Click or hold SPACE', orbX, orbY + radius + 30);
    }

    function renderUI() {
        // Top bar - Resources
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, 50);

        ctx.font = '16px Courier New';
        ctx.textAlign = 'left';

        // Magic
        ctx.fillStyle = COLORS.magic;
        ctx.fillText(`Magic: ${formatNumber(magic)}`, 20, 30);

        // Spirits
        ctx.fillStyle = COLORS.primary;
        ctx.fillText(`Spirits: ${spirits}`, 180, 30);

        // Knowledge
        if (unlockedRooms.includes('study')) {
            ctx.fillStyle = COLORS.knowledge;
            ctx.fillText(`Knowledge: ${formatNumber(knowledge)}`, 300, 30);
        }

        // Wood
        if (unlockedRooms.includes('forest')) {
            ctx.fillStyle = COLORS.wood;
            ctx.fillText(`Wood: ${formatNumber(wood)}`, 480, 30);
        }

        // Lifetime magic
        ctx.fillStyle = COLORS.textDim;
        ctx.font = '12px Courier New';
        ctx.fillText(`Lifetime: ${formatNumber(lifetimeMagic)}`, 620, 30);

        // Right side panel - Actions
        const panelX = 550;
        const panelY = 100;
        const panelW = 230;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(panelX, panelY, panelW, 350);

        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText('ACTIONS', panelX + 10, panelY + 25);

        ctx.font = '12px Courier New';
        let y = panelY + 50;

        // Summon spirit
        const spiritCost = getSpiritCost();
        ctx.fillStyle = magic >= spiritCost ? COLORS.gold : COLORS.textDim;
        ctx.fillText(`[S] Summon Spirit`, panelX + 10, y);
        ctx.fillText(`Cost: ${formatNumber(spiritCost)}`, panelX + 130, y);
        y += 30;

        // Assign spirits
        ctx.fillStyle = spirits > 0 ? COLORS.primary : COLORS.textDim;
        ctx.fillText(`[1] Assign to Orb (${assignments.cloudlings})`, panelX + 10, y);
        y += 20;

        if (unlockedRooms.includes('study')) {
            ctx.fillText(`[2] Assign to Study (${assignments.tomes})`, panelX + 10, y);
            y += 20;
        }

        if (unlockedRooms.includes('forest')) {
            ctx.fillText(`[3] Assign to Forest (${assignments.druids})`, panelX + 10, y);
            y += 20;
        }

        if (unlockedRooms.includes('academy')) {
            ctx.fillText(`[4] Assign to Academy (${assignments.sages})`, panelX + 10, y);
            y += 20;
        }

        y += 20;

        // Ascend
        ctx.fillStyle = canAscend() ? COLORS.gold : COLORS.textDim;
        ctx.fillText(`[A] Ascend Tower`, panelX + 10, y);
        if (towerLevel < ASCENSION_REQUIREMENTS.length) {
            ctx.fillText(`Need: ${formatNumber(ASCENSION_REQUIREMENTS[towerLevel])}`, panelX + 130, y);
        }
        y += 30;

        // Upgrades
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 14px Courier New';
        ctx.fillText('UPGRADES', panelX + 10, y);
        y += 25;

        ctx.font = '12px Courier New';
        const upgradeCost = Math.floor(100 * Math.pow(2, upgrades.wizardMagic));
        ctx.fillStyle = magic >= upgradeCost ? COLORS.gold : COLORS.textDim;
        ctx.fillText(`[U] Magic Power Lv.${upgrades.wizardMagic}`, panelX + 10, y);
        ctx.fillText(`Cost: ${formatNumber(upgradeCost)}`, panelX + 130, y);
        y += 20;
        ctx.fillStyle = COLORS.textDim;
        ctx.fillText(`(${getMagicMultiplier()}x magic)`, panelX + 20, y);

        // Production rates
        y += 40;
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 14px Courier New';
        ctx.fillText('PRODUCTION', panelX + 10, y);
        y += 25;

        ctx.font = '12px Courier New';
        ctx.fillStyle = COLORS.magic;
        const magicPerSec = assignments.cloudlings * 0.5 * getMagicMultiplier();
        ctx.fillText(`Magic/sec: ${magicPerSec.toFixed(1)}`, panelX + 10, y);
        y += 20;

        if (unlockedRooms.includes('study')) {
            ctx.fillStyle = COLORS.knowledge;
            ctx.fillText(`Knowledge/sec: ${(assignments.tomes * 0.2).toFixed(1)}`, panelX + 10, y);
            y += 20;
        }

        if (unlockedRooms.includes('forest')) {
            ctx.fillStyle = COLORS.wood;
            ctx.fillText(`Wood/sec: ${(assignments.druids * 0.3).toFixed(1)}`, panelX + 10, y);
        }
    }

    function renderParticles() {
        for (const p of particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life * 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function renderFloatingTexts() {
        for (const ft of floatingTexts) {
            ctx.fillStyle = ft.color;
            ctx.globalAlpha = Math.min(1, ft.life);
            ctx.font = 'bold 16px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.globalAlpha = 1;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    function init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');

        document.addEventListener('keydown', (e) => {
            keysDown[e.key] = true;
            if (!gamePaused) {
                activeKeys.add(e.key);
            }
        });

        document.addEventListener('keyup', (e) => {
            keysDown[e.key] = false;
            activeKeys.delete(e.key);
        });

        canvas.addEventListener('mousedown', (e) => {
            mouseDown = true;
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        });

        canvas.addEventListener('mouseup', () => {
            mouseDown = false;
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        });

        requestAnimationFrame(gameLoop);

        console.log('[HARNESS] Tower Wizard harness initialized, game paused');
    }

    function startGame() {
        magic = 0;
        lifetimeMagic = 0;
        spirits = 0;
        knowledge = 0;
        wood = 0;
        assignments = { cloudlings: 0, tomes: 0, druids: 0, sages: 0 };
        towerLevel = 1;
        unlockedRooms = ['orb'];
        upgrades = { wizardMagic: 0, autoClick: 0 };
        stats = { clicks: 0, spiritsSummoned: 0, ascensions: 0 };
        floatingTexts = [];
        particles = [];
        gameState = 'playing';
    }

    function gameLoop(timestamp) {
        deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;

        if (!gamePaused) {
            update(deltaTime);
        }

        render();

        requestAnimationFrame(gameLoop);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HARNESS INTERFACE
    // ═══════════════════════════════════════════════════════════════════════════
    function releaseAllKeys() {
        activeKeys.clear();
        for (const key in keysDown) {
            keysDown[key] = false;
        }
        mouseDown = false;
    }

    window.harness = {
        pause: () => {
            gamePaused = true;
            releaseAllKeys();
        },

        resume: () => {
            gamePaused = false;
        },

        isPaused: () => gamePaused,

        execute: (action, durationMs) => {
            return new Promise((resolve) => {
                if (action.keys) {
                    for (const key of action.keys) {
                        activeKeys.add(key);
                        keysDown[key] = true;
                    }
                }

                if (action.click) {
                    mouseDown = true;
                }

                gamePaused = false;

                setTimeout(() => {
                    releaseAllKeys();
                    gamePaused = true;
                    resolve();
                }, durationMs);
            });
        },

        getState: () => {
            const totalSpirits = spirits + assignments.cloudlings +
                assignments.tomes + assignments.druids + assignments.sages;
            return {
                gameState: gameState,
                magic: magic,
                lifetimeMagic: lifetimeMagic,
                spirits: spirits,
                knowledge: knowledge,
                wood: wood,
                assignments: { ...assignments },
                towerLevel: towerLevel,
                unlockedRooms: [...unlockedRooms],
                upgrades: { ...upgrades },
                stats: { ...stats },
                totalSpirits: totalSpirits,
                canAscend: canAscend(),
                spiritCost: getSpiritCost()
            };
        },

        getPhase: () => gameState,

        debug: {
            addMagic: (amount) => {
                magic += amount;
                lifetimeMagic += amount;
            },
            addSpirits: (amount) => { spirits += amount; },
            setTowerLevel: (level) => { towerLevel = level; },
            forceStart: () => { startGame(); },
            unlockRoom: (room) => {
                if (!unlockedRooms.includes(room)) {
                    unlockedRooms.push(room);
                }
            }
        },

        version: '1.0',

        gameInfo: {
            name: 'Tower Wizard Clone',
            type: 'incremental_idle',
            controls: {
                click: ['Space', 'click'],
                summon: ['s'],
                assign: ['1', '2', '3', '4'],
                ascend: ['a'],
                upgrade: ['u']
            }
        }
    };

    window.addEventListener('load', init);
})();
