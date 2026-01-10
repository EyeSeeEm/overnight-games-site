// Minishoot Adventures Clone - Canvas Version (Expanded + Polished)
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game resolution (internal)
canvas.width = 1280;
canvas.height = 720;

// Scale canvas to fill window while maintaining aspect ratio
function scaleCanvas() {
    const scale = Math.min(window.innerWidth / canvas.width, window.innerHeight / canvas.height);
    canvas.style.width = (canvas.width * scale) + 'px';
    canvas.style.height = (canvas.height * scale) + 'px';
    canvas.style.position = 'absolute';
    canvas.style.left = ((window.innerWidth - canvas.width * scale) / 2) + 'px';
    canvas.style.top = ((window.innerHeight - canvas.height * scale) / 2) + 'px';
}
scaleCanvas();
window.addEventListener('resize', scaleCanvas);

// Color palette matching reference
const COLORS = {
    background: '#1a2a35',
    forestDark: '#1e3a3a',
    forestLight: '#2d5a4a',
    path: '#d4a864',
    pathDark: '#a67c42',
    treeTeal: '#3a7a8a',
    treeBlue: '#2a5a7a',
    treeOrange: '#e87830',
    playerBody: '#e8f4f8',
    playerAccent: '#50c8ff',
    playerGlow: 'rgba(80, 200, 255, 0.4)',
    bulletPlayer: '#50c8ff',
    bulletSuper: '#4080ff',
    bulletEnemy: '#ff6030',
    bulletEnemyDark: '#802010',
    bulletHoming: '#ff40ff',
    crystal: '#ff3050',
    crystalGlow: 'rgba(255, 48, 80, 0.5)',
    healthFull: '#ff4060',
    healthEmpty: '#402030',
    energyFull: '#50d0ff',
    energyEmpty: '#203040',
    enemyScout: '#50aa70',
    enemyTurret: '#8060a0',
    enemyHeavy: '#c06040',
    enemyGrasshopper: '#80c040',
    enemyBurrower: '#a08060',
    enemyMimic: '#406030',
    enemyElite: '#a040c0',
    pickup: '#50ff80',
    white: '#ffffff',
    black: '#000000',
    critical: '#ffff00',
    combo: '#ff8000'
};

// Game state
const game = {
    state: 'title', // ITERATION 63: Start with title screen
    camera: { x: 0, y: 0 },
    screenShake: 0,
    screenFlash: 0,
    screenFlashColor: '#ffffff',
    time: 0,
    crystals: 0,
    level: 1,
    xp: 0,
    xpToLevel: 15,
    wave: 1, // Now represents room number
    maxWave: 10,
    combo: 0,
    comboTimer: 0,
    comboMultiplier: 1,
    bossActive: false,
    paused: false,
    slowMotion: 1,
    slowMotionTimer: 0,
    debugMode: false,
    fps: 60,
    lastFrameTime: 0,
    // Room/wave announcement
    waveAnnounce: '',
    waveAnnounceTimer: 0,
    // ITERATION 59: Kill streak
    killStreak: 0,
    lastAnnouncedStreak: 0,
    // ITERATION 80: Victory celebration
    victoryTimer: 0,
    victoryConfetti: null,
    // Room-based exploration (Feedback fix)
    roomCleared: false,
    doors: [],
    roomGrid: { x: 0, y: 0 }, // Current room coordinates
    visitedRooms: new Set(),
    transitioning: false
};

// Input
const keys = {};
const mouse = { x: 640, y: 360, down: false, rightDown: false };

// Player
const player = {
    x: 640,
    y: 360,
    vx: 0,
    vy: 0,
    angle: 0,
    speed: 200,
    health: 5,
    maxHealth: 5,
    energy: 4,
    maxEnergy: 6,
    damage: 1,
    fireRate: 5,
    fireCooldown: 0,
    range: 350,
    invincible: 0,
    dashCooldown: 0,
    hasDash: true,
    hasBoost: true,
    hasSupershot: true,
    hasTimeStop: true,
    boosting: false,
    bulletCount: 1,
    critChance: 0.1,
    superShotCharge: 0,
    trail: [],
    shotPulse: 0 // ITERATION 73: Visual pulse when shooting
};

// Entity arrays
let playerBullets = [];
let enemyBullets = [];
let enemies = [];
let crystals = [];
let particles = [];
let trees = [];
let pickups = [];
let damageNumbers = [];
let muzzleFlashes = [];
let spawnWarnings = [];

// Boss state
let boss = null;

// World generation - create forest environment
function generateWorld() {
    trees = [];

    // Create fluffy trees around the edges and scattered (scaled for 1280x720)
    const treePositions = [
        // Top border
        ...Array(18).fill(0).map((_, i) => ({ x: 50 + i * 70, y: 30 + Math.random() * 50 })),
        // Bottom border
        ...Array(18).fill(0).map((_, i) => ({ x: 50 + i * 70, y: 650 + Math.random() * 50 })),
        // Left border
        ...Array(10).fill(0).map((_, i) => ({ x: 20 + Math.random() * 50, y: 80 + i * 65 })),
        // Right border
        ...Array(10).fill(0).map((_, i) => ({ x: 1210 + Math.random() * 50, y: 80 + i * 65 })),
        // Scattered in play area
        { x: 200, y: 180 }, { x: 1080, y: 180 },
        { x: 300, y: 480 }, { x: 980, y: 500 },
        { x: 500, y: 250 }, { x: 780, y: 550 },
        { x: 640, y: 160 }, { x: 640, y: 560 }
    ];

    treePositions.forEach(pos => {
        const isOrange = Math.random() > 0.7;
        trees.push({
            x: pos.x,
            y: pos.y,
            radius: 30 + Math.random() * 20,
            color: isOrange ? COLORS.treeOrange : (Math.random() > 0.5 ? COLORS.treeTeal : COLORS.treeBlue),
            shadowColor: isOrange ? '#a05018' : '#1a3a4a',
            wobble: Math.random() * Math.PI * 2
        });
    });
}

// EXPAND 1: More enemy types with improved difficulty curve
function spawnEnemies() {
    enemies = [];
    // More enemies per wave, capped at 15
    const baseCount = 3 + Math.floor(game.wave * 1.2);
    const enemyCount = Math.min(baseCount, 15);

    // Elite chance ramps up more aggressively
    const eliteChance = game.wave >= 3 ? Math.min(0.1 + (game.wave - 3) * 0.05, 0.4) : 0;

    // Wave-based composition: early waves have weaker enemies
    for (let i = 0; i < enemyCount; i++) {
        const typeRoll = Math.random();
        let type;

        if (game.wave <= 2) {
            // Early waves: mostly scouts and grasshoppers
            if (typeRoll < 0.5) type = 'scout';
            else if (typeRoll < 0.8) type = 'grasshopper';
            else type = 'turret';
        } else if (game.wave <= 5) {
            // Mid waves: introduce turrets and heavies
            if (typeRoll < 0.25) type = 'scout';
            else if (typeRoll < 0.45) type = 'turret';
            else if (typeRoll < 0.65) type = 'heavy';
            else if (typeRoll < 0.85) type = 'grasshopper';
            else type = 'burrower';
        } else {
            // Late waves: full variety with more dangerous enemies
            if (typeRoll < 0.15) type = 'scout';
            else if (typeRoll < 0.30) type = 'turret';
            else if (typeRoll < 0.50) type = 'heavy';
            else if (typeRoll < 0.65) type = 'grasshopper';
            else if (typeRoll < 0.80) type = 'burrower';
            else type = 'mimic';
        }

        const isElite = Math.random() < eliteChance;

        let x, y;
        do {
            x = 100 + Math.random() * 1080;
            y = 100 + Math.random() * 520;
        } while (Math.hypot(x - player.x, y - player.y) < 200);

        // EXPAND 13: Spawn warning indicators
        spawnWarnings.push({
            x, y,
            timer: 1.0,
            type: type
        });

        setTimeout(() => {
            if (game.state === 'playing') {
                enemies.push(createEnemy(type, x, y, isElite));
            }
        }, 1000);
    }
}

function createEnemy(type, x, y, isElite = false) {
    const configs = {
        scout: { hp: 3, speed: 90, fireRate: 1.2, size: 18, color: COLORS.enemyScout, xp: 2 },
        turret: { hp: 6, speed: 0, fireRate: 0.8, size: 24, color: COLORS.enemyTurret, xp: 4 },
        heavy: { hp: 12, speed: 40, fireRate: 2, size: 30, color: COLORS.enemyHeavy, xp: 6 },
        // EXPAND 2: Grasshopper - hops toward player, burst fire
        grasshopper: { hp: 4, speed: 0, fireRate: 1.5, size: 20, color: COLORS.enemyGrasshopper, xp: 3 },
        // EXPAND 3: Burrower - emerges and fires homing shots
        burrower: { hp: 8, speed: 60, fireRate: 2.5, size: 22, color: COLORS.enemyBurrower, xp: 5 },
        // EXPAND 4: Tree mimic - disguised until player is close
        mimic: { hp: 5, speed: 100, fireRate: 1.0, size: 26, color: COLORS.enemyMimic, xp: 4 }
    };
    const cfg = configs[type];

    // EXPAND 14: Elite multipliers
    const eliteMultiplier = isElite ? 2 : 1;

    // Wave-based scaling: enemies get 10% stronger each wave after wave 3
    const waveScaling = game.wave > 3 ? 1 + (game.wave - 3) * 0.1 : 1;

    return {
        type, x, y, vx: 0, vy: 0,
        hp: Math.ceil(cfg.hp * eliteMultiplier * waveScaling),
        maxHp: Math.ceil(cfg.hp * eliteMultiplier * waveScaling),
        speed: cfg.speed * (1 + (game.wave - 1) * 0.02), // Slightly faster each wave
        fireRate: cfg.fireRate / (isElite ? 1.3 : 1) * (1 - (game.wave - 1) * 0.03), // Fire faster
        fireCooldown: Math.random() * 2,
        size: cfg.size * (isElite ? 1.2 : 1),
        color: isElite ? COLORS.enemyElite : cfg.color,
        xp: cfg.xp * eliteMultiplier,
        angle: Math.random() * Math.PI * 2,
        hitFlash: 0,
        isElite,
        // Grasshopper specific
        hopCooldown: 1,
        // Burrower specific
        burrowed: type === 'burrower',
        emergeTimer: 2,
        // Mimic specific
        disguised: type === 'mimic',
        // POLISH 12: Spawn animation
        spawnScale: 0,
        aggroRange: type === 'mimic' ? 150 : 400
    };
}

// EXPAND 16: Boss fight
function spawnBoss() {
    game.bossActive = true;
    boss = {
        type: 'forestGuardian',
        x: 640,
        y: -100, // ITERATION 72: Start off-screen for dramatic entrance
        hp: 200 + game.wave * 50,
        maxHp: 200 + game.wave * 50,
        size: 60,
        angle: 0,
        phase: 1,
        attackTimer: 0,
        attackPattern: 0,
        hitFlash: 0,
        spawnScale: 0,
        enteringArena: true, // ITERATION 72: Boss entrance state
        entranceTimer: 0
    };

    // Clear enemies for boss fight
    enemies = [];
    enemyBullets = [];

    // ITERATION 72: Epic boss entrance effects
    game.screenShake = 20;
    game.screenFlash = 0.6;
    game.announcement = '⚠️ BOSS INCOMING ⚠️';
    game.announcementTimer = 3;
    game.announcementColor = '#ff3030';

    // Warning particles
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: 640,
            y: 150,
            vx: (Math.random() - 0.5) * 400,
            vy: (Math.random() - 0.5) * 400,
            life: 1.5,
            decay: 0.7,
            size: 4 + Math.random() * 6,
            color: ['#ff3030', '#ff6060', '#ff9030', '#ffffff'][Math.floor(Math.random() * 4)]
        });
    }

    // Ring particles for dramatic effect
    for (let i = 0; i < 3; i++) {
        particles.push({
            type: 'ring',
            x: 640,
            y: 150,
            size: 20 + i * 30,
            maxSize: 200 + i * 50,
            life: 1,
            decay: 0.5,
            color: '#ff3030'
        });
    }
}

// Drawing functions
function drawBackground() {
    // Dark space/void background with stars
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw some stars in background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
        const sx = (i * 73) % canvas.width;
        const sy = (i * 47) % canvas.height;
        const size = (i % 3) + 1;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw darker forest edge (scaled for 1280x720)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(70, 70);
    ctx.bezierCurveTo(320, 45, 960, 45, 1210, 70);
    ctx.lineTo(1235, 650);
    ctx.bezierCurveTo(1050, 685, 230, 685, 45, 650);
    ctx.closePath();
    ctx.fillStyle = COLORS.forestDark;
    ctx.fill();
    ctx.restore();

    // Draw forest ground layer
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(85, 85);
    ctx.bezierCurveTo(320, 60, 960, 60, 1195, 85);
    ctx.lineTo(1215, 635);
    ctx.bezierCurveTo(1050, 665, 230, 665, 65, 635);
    ctx.closePath();
    ctx.fillStyle = COLORS.forestLight;
    ctx.fill();
    ctx.restore();

    // Draw path/ground area
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.bezierCurveTo(320, 80, 960, 80, 1180, 100);
    ctx.lineTo(1200, 620);
    ctx.bezierCurveTo(1050, 650, 230, 650, 80, 620);
    ctx.closePath();

    // Path gradient
    const pathGrad = ctx.createLinearGradient(0, 100, 0, 620);
    pathGrad.addColorStop(0, COLORS.path);
    pathGrad.addColorStop(1, COLORS.pathDark);
    ctx.fillStyle = pathGrad;
    ctx.fill();

    // Path outline (edge lighting)
    ctx.strokeStyle = '#8a6030';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
}

// ITERATION 77: Boundary warning effect when player is near edge
function drawBoundaryWarning() {
    if (game.state !== 'playing') return;

    const warningDist = 80;
    const minX = 100, maxX = 1180;
    const minY = 100, maxY = 620;

    const distToLeft = player.x - minX;
    const distToRight = maxX - player.x;
    const distToTop = player.y - minY;
    const distToBottom = maxY - player.y;

    ctx.save();

    // Left edge warning
    if (distToLeft < warningDist) {
        const intensity = 1 - (distToLeft / warningDist);
        const gradient = ctx.createLinearGradient(0, 0, 150, 0);
        gradient.addColorStop(0, `rgba(255, 50, 50, ${0.4 * intensity})`);
        gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 150, canvas.height);
    }

    // Right edge warning
    if (distToRight < warningDist) {
        const intensity = 1 - (distToRight / warningDist);
        const gradient = ctx.createLinearGradient(canvas.width, 0, canvas.width - 150, 0);
        gradient.addColorStop(0, `rgba(255, 50, 50, ${0.4 * intensity})`);
        gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(canvas.width - 150, 0, 150, canvas.height);
    }

    // Top edge warning
    if (distToTop < warningDist) {
        const intensity = 1 - (distToTop / warningDist);
        const gradient = ctx.createLinearGradient(0, 0, 0, 120);
        gradient.addColorStop(0, `rgba(255, 50, 50, ${0.4 * intensity})`);
        gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, 120);
    }

    // Bottom edge warning
    if (distToBottom < warningDist) {
        const intensity = 1 - (distToBottom / warningDist);
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - 120);
        gradient.addColorStop(0, `rgba(255, 50, 50, ${0.4 * intensity})`);
        gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height - 120, canvas.width, 120);
    }

    ctx.restore();
}

function drawTree(tree) {
    const wobble = Math.sin(game.time * 2 + tree.wobble) * 2;

    // Shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(tree.x + 5, tree.y + tree.radius * 0.8, tree.radius * 0.8, tree.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 20, 20, 0.4)';
    ctx.fill();
    ctx.restore();

    // Tree trunk hint
    ctx.fillStyle = '#503020';
    ctx.fillRect(tree.x - 4, tree.y, 8, tree.radius * 0.5);

    // Main fluffy foliage (multiple overlapping circles)
    const fluffCount = 6;
    for (let i = 0; i < fluffCount; i++) {
        const angle = (i / fluffCount) * Math.PI * 2;
        const dist = tree.radius * 0.4;
        const fx = tree.x + Math.cos(angle) * dist + wobble;
        const fy = tree.y - tree.radius * 0.3 + Math.sin(angle) * dist * 0.6;
        const r = tree.radius * 0.6;

        ctx.beginPath();
        ctx.arc(fx, fy, r, 0, Math.PI * 2);
        ctx.fillStyle = tree.shadowColor;
        ctx.fill();
    }

    // Center highlight
    ctx.beginPath();
    ctx.arc(tree.x + wobble, tree.y - tree.radius * 0.3, tree.radius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = tree.color;
    ctx.fill();

    // Highlight circle
    ctx.beginPath();
    ctx.arc(tree.x - tree.radius * 0.2 + wobble, tree.y - tree.radius * 0.5, tree.radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
}

function drawPlayer() {
    const { x, y, angle, invincible, boosting, trail } = player;

    // ITERATION 62: Enhanced invincibility visual
    const isInvincible = invincible > 0;
    const blinkOut = isInvincible && Math.floor(invincible * 10) % 2 === 0;

    // Draw shield effect when invincible (even during blink)
    if (isInvincible) {
        ctx.save();
        ctx.translate(x, y);

        const shieldPulse = 1 + Math.sin(game.time * 20) * 0.15;
        const shieldAlpha = Math.min(0.6, invincible * 0.5);

        // Outer shield ring
        ctx.beginPath();
        ctx.arc(0, 0, 25 * shieldPulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(100, 200, 255, ${shieldAlpha})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#50c8ff';
        ctx.shadowBlur = 15;
        ctx.stroke();

        // Inner shield glow
        ctx.beginPath();
        ctx.arc(0, 0, 20 * shieldPulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80, 200, 255, ${shieldAlpha * 0.3})`;
        ctx.fill();

        // Rotating shield segments
        const segmentCount = 6;
        ctx.strokeStyle = `rgba(255, 255, 255, ${shieldAlpha * 0.7})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < segmentCount; i++) {
            const segAngle = (i / segmentCount) * Math.PI * 2 + game.time * 3;
            ctx.beginPath();
            ctx.arc(0, 0, 22 * shieldPulse, segAngle, segAngle + 0.3);
            ctx.stroke();
        }

        ctx.restore();
    }

    // Don't draw ship during blink frames
    if (blinkOut) return;

    // POLISH 6: Player trail effect when moving
    if (trail.length > 1) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < trail.length - 1; i++) {
            const t = trail[i];
            const alpha = i / trail.length * 0.3;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.playerAccent;
            ctx.fill();
        }
        ctx.restore();
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // ITERATION 73: Shot pulse scale effect
    const shotScale = 1 + player.shotPulse * 0.15;
    ctx.scale(shotScale, shotScale);

    // Glow effect (stronger when boosting)
    ctx.shadowColor = boosting ? '#80ffff' : COLORS.playerGlow;
    ctx.shadowBlur = boosting ? 40 : 25;

    // Engine trail/glow
    const trailSize = boosting ? 1.5 : 1;
    ctx.beginPath();
    ctx.ellipse(-14 * trailSize, 0, 10 * trailSize, 5 * trailSize, 0, 0, Math.PI * 2);
    ctx.fillStyle = boosting ? 'rgba(128, 255, 255, 0.7)' : 'rgba(80, 200, 255, 0.5)';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(-16 * trailSize, 0, 6 * trailSize, 3 * trailSize, 0, 0, Math.PI * 2);
    ctx.fillStyle = boosting ? 'rgba(200, 255, 255, 0.9)' : 'rgba(120, 220, 255, 0.8)';
    ctx.fill();

    // Ship shadow
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(2, 4, 12, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 20, 40, 0.3)';
    ctx.fill();

    // Wings (back part)
    ctx.beginPath();
    ctx.moveTo(-8, -12);
    ctx.quadraticCurveTo(-10, -8, -8, 0);
    ctx.quadraticCurveTo(-10, 8, -8, 12);
    ctx.lineTo(-4, 8);
    ctx.lineTo(-4, -8);
    ctx.closePath();
    ctx.fillStyle = '#90c8d8';
    ctx.fill();
    ctx.strokeStyle = '#60a0b8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Main body (cute rounded spaceship)
    ctx.beginPath();
    ctx.moveTo(14, 0);  // Nose
    ctx.quadraticCurveTo(16, -4, 10, -8);  // Top curve
    ctx.lineTo(-4, -8);  // Top back
    ctx.quadraticCurveTo(-8, -6, -8, 0);  // Back curve top
    ctx.quadraticCurveTo(-8, 6, -4, 8);   // Back curve bottom
    ctx.lineTo(10, 8);  // Bottom back
    ctx.quadraticCurveTo(16, 4, 14, 0);   // Bottom curve to nose
    ctx.closePath();

    // Body gradient (white to light cyan)
    const bodyGrad = ctx.createLinearGradient(-8, -10, 14, 10);
    bodyGrad.addColorStop(0, '#b8e0f0');
    bodyGrad.addColorStop(0.3, '#e8f8ff');
    bodyGrad.addColorStop(0.6, '#ffffff');
    bodyGrad.addColorStop(1, '#d0e8f4');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Body outline
    ctx.strokeStyle = '#70b8d0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cockpit window (cute eye-like)
    ctx.beginPath();
    ctx.ellipse(6, 0, 5, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.playerAccent;
    ctx.fill();
    ctx.strokeStyle = '#40a0c0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Cockpit inner glow
    ctx.beginPath();
    ctx.ellipse(6, 0, 3, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#80e0ff';
    ctx.fill();

    // Cockpit highlight (makes it look shiny/cute)
    ctx.beginPath();
    ctx.ellipse(4, -2, 2, 1.5, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();

    // Small decorative lines on body
    ctx.strokeStyle = 'rgba(80, 180, 220, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2, -5);
    ctx.lineTo(8, -5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-2, 5);
    ctx.lineTo(8, 5);
    ctx.stroke();

    ctx.restore();
}

// ITERATION 76: Crosshair aim indicator
function drawCrosshair() {
    if (game.state !== 'playing') return;

    // Calculate aim position (extended from player in facing direction)
    const aimDist = 100;
    const aimX = player.x + Math.cos(player.angle) * aimDist;
    const aimY = player.y + Math.sin(player.angle) * aimDist;

    ctx.save();
    ctx.translate(aimX, aimY);

    // Rotate crosshair slowly
    const rotation = game.time * 2;
    ctx.rotate(rotation);

    // Dynamic size based on firing
    const baseSize = 12;
    const pulseSize = baseSize + (player.shotPulse * 8);

    // Crosshair color - changes when shooting
    const alpha = 0.6 + player.shotPulse * 0.4;
    ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
    ctx.lineWidth = 2;

    // Cross lines
    const gap = 4;
    ctx.beginPath();
    ctx.moveTo(-pulseSize, 0);
    ctx.lineTo(-gap, 0);
    ctx.moveTo(gap, 0);
    ctx.lineTo(pulseSize, 0);
    ctx.moveTo(0, -pulseSize);
    ctx.lineTo(0, -gap);
    ctx.moveTo(0, gap);
    ctx.lineTo(0, pulseSize);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    // Outer circle (faint)
    ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.5})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, pulseSize + 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

function drawEnemy(enemy) {
    const { x, y, type, size, color, hp, maxHp, hitFlash, angle, isElite, disguised, burrowed, spawnScale } = enemy;

    // POLISH 12: Spawn animation
    const scale = Math.min(1, spawnScale);
    if (scale <= 0) return;

    // Mimic stays hidden when disguised
    if (disguised) {
        drawTree({ x, y, radius: size, color: COLORS.enemyMimic, shadowColor: '#203018', wobble: x });
        return;
    }

    // Burrower underground indicator
    if (burrowed) {
        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(game.time * 5) * 0.2;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#604030';
        ctx.fill();
        ctx.restore();
        return;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Elite glow
    if (isElite) {
        ctx.shadowColor = COLORS.enemyElite;
        ctx.shadowBlur = 20;
    }

    // ITERATION 65: Enhanced hit flash effect
    if (hitFlash > 0) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 25 + hitFlash * 10;

        // Brief scale pulse
        const flashScale = 1 + hitFlash * 0.15;
        ctx.scale(flashScale, flashScale);

        // Add white outline
        ctx.strokeStyle = `rgba(255, 255, 255, ${hitFlash})`;
        ctx.lineWidth = 4;
    }

    if (type === 'scout') {
        ctx.rotate(angle);
        // Scout - small triangular enemy
        ctx.beginPath();
        ctx.moveTo(size * 0.8, 0);
        ctx.lineTo(-size * 0.5, -size * 0.6);
        ctx.lineTo(-size * 0.3, 0);
        ctx.lineTo(-size * 0.5, size * 0.6);
        ctx.closePath();
        ctx.fillStyle = hitFlash > 0 ? '#ffffff' : color;
        ctx.fill();
        ctx.strokeStyle = '#204030';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eye
        ctx.beginPath();
        ctx.arc(size * 0.2, 0, size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ff8040';
        ctx.fill();
    } else if (type === 'turret') {
        // Turret - hexagonal base with rotating gun
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const px = Math.cos(a) * size;
            const py = Math.sin(a) * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = hitFlash > 0 ? '#ffffff' : color;
        ctx.fill();
        ctx.strokeStyle = '#402050';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Gun barrel
        ctx.rotate(angle);
        ctx.fillStyle = '#503060';
        ctx.fillRect(0, -4, size * 1.2, 8);

        // Core
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6040';
        ctx.fill();
    } else if (type === 'heavy') {
        // Heavy - large rounded enemy
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = hitFlash > 0 ? '#ffffff' : color;
        ctx.fill();
        ctx.strokeStyle = '#602020';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Face/core
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4020';
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#200000';
        ctx.beginPath();
        ctx.arc(-size * 0.2, -size * 0.1, 4, 0, Math.PI * 2);
        ctx.arc(size * 0.2, -size * 0.1, 4, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'grasshopper') {
        // EXPAND 2: Grasshopper - bouncy enemy
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.8, size * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = hitFlash > 0 ? '#ffffff' : color;
        ctx.fill();
        ctx.strokeStyle = '#406020';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Legs
        ctx.strokeStyle = '#608040';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-size * 0.3, size * 0.3);
        ctx.lineTo(-size * 0.6, size * 0.8);
        ctx.moveTo(size * 0.3, size * 0.3);
        ctx.lineTo(size * 0.6, size * 0.8);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(size * 0.4, -size * 0.1, 4, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'burrower') {
        // EXPAND 3: Burrower - worm-like
        ctx.rotate(angle);
        // Segments
        for (let i = 3; i >= 0; i--) {
            ctx.beginPath();
            ctx.arc(-i * size * 0.4, 0, size * (0.5 - i * 0.08), 0, Math.PI * 2);
            ctx.fillStyle = hitFlash > 0 ? '#ffffff' : (i === 0 ? color : '#806040');
            ctx.fill();
        }
        // Head details
        ctx.fillStyle = '#ff4040';
        ctx.beginPath();
        ctx.arc(size * 0.2, -size * 0.15, 3, 0, Math.PI * 2);
        ctx.arc(size * 0.2, size * 0.15, 3, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'mimic') {
        // EXPAND 4: Tree mimic revealed
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = hitFlash > 0 ? '#ffffff' : color;
        ctx.fill();
        ctx.strokeStyle = '#304020';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Angry face
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(-size * 0.25, -size * 0.2, 5, 0, Math.PI * 2);
        ctx.arc(size * 0.25, -size * 0.2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Angry mouth
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, size * 0.2, size * 0.3, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }

    ctx.restore();

    // Health bar for damaged enemies
    if (hp < maxHp) {
        const barWidth = size * 2;
        const barHeight = 4;
        const hpRatio = hp / maxHp;

        ctx.fillStyle = '#400000';
        ctx.fillRect(x - barWidth / 2, y - size - 12, barWidth, barHeight);
        ctx.fillStyle = isElite ? '#c040ff' : '#ff4040';
        ctx.fillRect(x - barWidth / 2, y - size - 12, barWidth * hpRatio, barHeight);
    }

    // POLISH 20: Aggro indicator
    const distToPlayer = Math.hypot(player.x - x, player.y - y);
    if (distToPlayer < enemy.aggroRange && !disguised && !burrowed) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(player.x, player.y);
        ctx.stroke();
        ctx.restore();
    }
}

// EXPAND 16: Draw boss
function drawBoss() {
    if (!boss) return;

    const { x, y, hp, maxHp, size, angle, hitFlash, spawnScale, phase } = boss;
    const scale = Math.min(1, spawnScale);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Boss glow
    ctx.shadowColor = phase >= 3 ? '#ff4040' : '#40ff40';
    ctx.shadowBlur = 30;

    if (hitFlash > 0) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 50;
    }

    // Forest Guardian - large tree spirit
    // Base
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fillStyle = hitFlash > 0 ? '#ffffff' : '#2a5a3a';
    ctx.fill();
    ctx.strokeStyle = '#1a3a2a';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Inner pattern
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = '#3a7a4a';
    ctx.fill();

    // Face
    ctx.fillStyle = phase >= 3 ? '#ff4040' : '#ffff00';
    ctx.beginPath();
    ctx.arc(-size * 0.25, -size * 0.15, 8, 0, Math.PI * 2);
    ctx.arc(size * 0.25, -size * 0.15, 8, 0, Math.PI * 2);
    ctx.fill();

    // Branches/arms
    ctx.strokeStyle = '#4a2a1a';
    ctx.lineWidth = 8;
    for (let i = 0; i < 4; i++) {
        const armAngle = angle + (i / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(armAngle) * size * 0.8, Math.sin(armAngle) * size * 0.8);
        ctx.lineTo(Math.cos(armAngle) * size * 1.5, Math.sin(armAngle) * size * 1.5);
        ctx.stroke();
    }

    ctx.restore();

    // Boss health bar
    const barWidth = 300;
    const barHeight = 20;
    const barX = (canvas.width - barWidth) / 2;
    const barY = 550;

    ctx.fillStyle = '#200000';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = phase >= 3 ? '#ff4040' : '#40ff40';
    ctx.fillRect(barX, barY, barWidth * (hp / maxHp), barHeight);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('FOREST GUARDIAN', canvas.width / 2, barY - 5);
}

function drawBullet(bullet, isEnemy) {
    const { x, y, size, vx, vy, isHoming, isSuper } = bullet;

    ctx.save();
    ctx.translate(x, y);

    if (isEnemy) {
        // EXPAND 18: Homing bullets are purple
        if (isHoming) {
            ctx.shadowColor = 'rgba(255, 64, 255, 0.6)';
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.arc(0, 0, size + 2, 0, Math.PI * 2);
            ctx.strokeStyle = COLORS.bulletHoming;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.bulletHoming;
            ctx.fill();
        } else {
            // Enemy bullet - orange with dark center and glow ring
            ctx.shadowColor = 'rgba(255, 96, 48, 0.6)';
            ctx.shadowBlur = 8;

            // Outer glow ring
            ctx.beginPath();
            ctx.arc(0, 0, size + 3, 0, Math.PI * 2);
            ctx.strokeStyle = COLORS.bulletEnemy;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Main bullet
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.bulletEnemy;
            ctx.fill();

            // Dark center
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.bulletEnemyDark;
            ctx.fill();
        }
    } else {
        // Player bullet - cyan with strong glow and trail
        const angle = Math.atan2(vy, vx);
        ctx.rotate(angle);

        // EXPAND 1: Supershot is bigger and blue
        const bulletColor = isSuper ? COLORS.bulletSuper : COLORS.bulletPlayer;
        const bulletSize = isSuper ? size * 1.5 : size;

        // ITERATION 75: Enhanced supershot visuals
        if (isSuper) {
            // Spinning energy ring
            ctx.save();
            ctx.rotate(game.time * 10);
            ctx.strokeStyle = 'rgba(150, 200, 255, 0.6)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(0, 0, bulletSize + 6, a, a + 0.8);
                ctx.stroke();
            }
            ctx.restore();

            // Star-like points
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2 + game.time * 5;
                const len = 8 + Math.sin(game.time * 15 + i) * 3;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * bulletSize, Math.sin(a) * bulletSize);
                ctx.lineTo(Math.cos(a) * (bulletSize + len), Math.sin(a) * (bulletSize + len));
                ctx.stroke();
            }
        }

        // Trail effect
        ctx.beginPath();
        ctx.ellipse(-8, 0, 12, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = isSuper ? 'rgba(64, 128, 255, 0.3)' : 'rgba(80, 200, 255, 0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(-5, 0, 8, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = isSuper ? 'rgba(100, 160, 255, 0.5)' : 'rgba(120, 220, 255, 0.5)';
        ctx.fill();

        // Main bullet with glow
        ctx.shadowColor = bulletColor;
        ctx.shadowBlur = isSuper ? 25 : 15;

        ctx.beginPath();
        ctx.ellipse(0, 0, bulletSize + 2, bulletSize, 0, 0, Math.PI * 2);
        ctx.fillStyle = bulletColor;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.ellipse(1, 0, bulletSize * 0.6, bulletSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }

    ctx.restore();
}

function drawCrystal(crystal) {
    const { x, y, value, magnetRange } = crystal;
    const bob = Math.sin(game.time * 5 + x) * 3;

    // ITERATION 55: Distance-based excitement effect
    const dx = player.x - x;
    const dy = player.y - y;
    const dist = Math.hypot(dx, dy);
    const magnetRatio = dist < magnetRange ? 1 - (dist / magnetRange) : 0;

    // Scale up when being pulled toward player
    const exciteScale = 1 + magnetRatio * 0.4;
    // Pulse faster when close
    const pulseSpeed = 5 + magnetRatio * 10;
    const pulse = 1 + Math.sin(game.time * pulseSpeed) * 0.1 * (1 + magnetRatio);

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(exciteScale * pulse, exciteScale * pulse);

    // ITERATION 74: Crystal magnet beam
    if (magnetRatio > 0.2) {
        ctx.save();
        ctx.resetTransform();
        const beamAlpha = (magnetRatio - 0.2) * 0.8;
        const gradient = ctx.createLinearGradient(x, y, player.x, player.y);
        gradient.addColorStop(0, `rgba(255, 100, 180, ${beamAlpha})`);
        gradient.addColorStop(1, 'rgba(255, 100, 180, 0)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2 * magnetRatio;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -game.time * 50;
        ctx.beginPath();
        ctx.moveTo(x, y + bob);
        ctx.lineTo(player.x, player.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    // Glow - stronger when close to player
    ctx.shadowColor = COLORS.crystalGlow;
    ctx.shadowBlur = 15 + magnetRatio * 15;

    // POLISH 13: Crystal sparkle particles - more frequent when pulled
    if (Math.random() < 0.1 + magnetRatio * 0.3) {
        particles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + bob + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 20,
            vy: -Math.random() * 30,
            life: 0.5,
            decay: 1,
            size: 2,
            color: '#ff80a0'
        });
    }

    // Crystal shape (diamond)
    const size = 6 + value * 2;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.7, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.7, 0);
    ctx.closePath();
    ctx.fillStyle = COLORS.crystal;
    ctx.fill();

    // Highlight
    ctx.beginPath();
    ctx.moveTo(-2, -size * 0.6);
    ctx.lineTo(2, -size * 0.3);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();

    ctx.restore();
}

// EXPAND 5-6: Draw pickups - enhanced with pulse and sparkles
function drawPickup(pickup) {
    const { x, y, type } = pickup;
    const bob = Math.sin(game.time * 4 + x) * 4;
    const pulse = 1 + Math.sin(game.time * 6) * 0.15; // Scale pulse

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(pulse, pulse);

    // Stronger glow
    ctx.shadowColor = type === 'health' ? '#ff4080' : '#40ff80';
    ctx.shadowBlur = 20 + Math.sin(game.time * 8) * 5;

    // Rotating sparkle ring
    for (let i = 0; i < 4; i++) {
        const sparkleAngle = game.time * 3 + (i / 4) * Math.PI * 2;
        const sparkleX = Math.cos(sparkleAngle) * 15;
        const sparkleY = Math.sin(sparkleAngle) * 15;
        ctx.fillStyle = type === 'health' ? 'rgba(255, 128, 200, 0.5)' : 'rgba(128, 255, 200, 0.5)';
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    if (type === 'health') {
        // Heart shape
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.bezierCurveTo(-10, -5, -10, -12, 0, -5);
        ctx.bezierCurveTo(10, -12, 10, -5, 0, 5);
        ctx.fillStyle = COLORS.healthFull;
        ctx.fill();

        // Shine
        ctx.beginPath();
        ctx.arc(-3, -5, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    } else {
        // Energy diamond
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 10);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fillStyle = COLORS.energyFull;
        ctx.fill();

        // Shine
        ctx.beginPath();
        ctx.moveTo(-2, -5);
        ctx.lineTo(2, -2);
        ctx.lineTo(0, 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    }

    ctx.restore();
}

function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = p.life;

    // ITERATION 55: Support ring particles for collection effects
    if (p.ring) {
        const radius = p.ringRadius + (1 - p.life) * p.ringExpand;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * p.life;
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
    }
    ctx.restore();
}

// POLISH 1: Muzzle flash - enhanced for better feedback
function drawMuzzleFlash(flash) {
    ctx.save();
    ctx.translate(flash.x, flash.y);
    ctx.rotate(flash.angle);
    ctx.globalAlpha = flash.life;

    // Outer glow
    ctx.shadowColor = flash.isSuper ? '#4080ff' : '#50c8ff';
    ctx.shadowBlur = 20;

    // Main flash - larger and more dramatic
    const scale = flash.isSuper ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(20 * scale, -8 * scale);
    ctx.lineTo(35 * scale, 0);
    ctx.lineTo(20 * scale, 8 * scale);
    ctx.closePath();
    ctx.fillStyle = flash.isSuper ? '#80c0ff' : '#ffffff';
    ctx.fill();

    // Inner bright core
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(15 * scale, -4 * scale);
    ctx.lineTo(25 * scale, 0);
    ctx.lineTo(15 * scale, 4 * scale);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Side flares for extra punch
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(8, -12 * scale);
    ctx.lineTo(12, -3);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 3);
    ctx.lineTo(8, 12 * scale);
    ctx.lineTo(12, 3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// POLISH 3: Damage numbers - enhanced crits
function drawDamageNumber(dn) {
    ctx.save();
    ctx.globalAlpha = dn.life;

    if (dn.isCrit) {
        // Critical hits are much more dramatic
        const scale = 1 + (1 - dn.life) * 0.3; // Scale up as they fade
        const shake = Math.sin(game.time * 30) * 2;

        ctx.font = `bold ${Math.floor(24 * scale)}px Arial`;
        ctx.shadowColor = '#ff8000';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ffff00';
        ctx.textAlign = 'center';

        // Double render for extra glow
        ctx.fillText('CRIT!', dn.x + shake, dn.y - 12);
        ctx.shadowColor = COLORS.critical;
        ctx.shadowBlur = 8;
        ctx.fillText(dn.text, dn.x, dn.y + 8);
    } else {
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(dn.text, dn.x, dn.y);
    }

    ctx.restore();
}

// ITERATION 58: Enhanced spawn warnings
function drawSpawnWarning(warning) {
    const progress = 1 - warning.timer; // 0 to 1 as it gets closer
    const urgency = Math.min(1, progress * 1.5);
    const pulseSpeed = 10 + urgency * 15;
    const pulse = Math.sin(game.time * pulseSpeed);

    ctx.save();

    // Outer expanding ring
    const outerRadius = 40 + progress * 20 + pulse * 5;
    ctx.globalAlpha = (0.3 + urgency * 0.3) * (1 - progress * 0.5);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(warning.x, warning.y, outerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner filling circle (fills as spawn approaches)
    ctx.globalAlpha = 0.2 + urgency * 0.3;
    ctx.fillStyle = `rgba(255, 50, 50, ${0.2 + pulse * 0.1})`;
    ctx.beginPath();
    ctx.arc(warning.x, warning.y, 30 * progress, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing warning circle
    ctx.globalAlpha = 0.5 + pulse * 0.3;
    ctx.strokeStyle = '#ff4040';
    ctx.lineWidth = 3 + urgency * 2;
    ctx.setLineDash([8 - progress * 4, 4 + progress * 4]);
    ctx.beginPath();
    ctx.arc(warning.x, warning.y, 30 + pulse * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Progress arc showing time until spawn
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(warning.x, warning.y, 25, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.stroke();

    // Warning icon with scale pulse
    const iconScale = 1 + pulse * 0.2 + urgency * 0.3;
    ctx.font = `bold ${Math.floor(16 * iconScale)}px Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.8 + pulse * 0.2;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10 + urgency * 10;
    ctx.fillText('!', warning.x, warning.y + 6 * iconScale);

    // Spawn particle effects near completion
    if (progress > 0.7 && Math.random() < 0.3) {
        const angle = Math.random() * Math.PI * 2;
        particles.push({
            x: warning.x + Math.cos(angle) * 35,
            y: warning.y + Math.sin(angle) * 35,
            vx: -Math.cos(angle) * 50,
            vy: -Math.sin(angle) * 50,
            life: 0.4,
            decay: 1,
            size: 3,
            color: '#ff6060'
        });
    }

    ctx.restore();
}

function drawHUD() {
    // Health hearts
    const heartSize = 18;
    const heartSpacing = 24;
    const startX = 20;
    const startY = 20;

    // ITERATION 70: Pass index for heart pulsing
    for (let i = 0; i < player.maxHealth; i++) {
        drawHeart(startX + i * heartSpacing, startY, heartSize, i < player.health, i);
    }

    // Energy diamonds - ITERATION 67: Pass index for regen visual
    const energyY = 48;
    for (let i = 0; i < player.maxEnergy; i++) {
        drawEnergy(startX + i * heartSpacing, energyY, i < player.energy, i);
    }

    // Crystal counter
    ctx.fillStyle = COLORS.crystal;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';

    // Crystal icon
    ctx.save();
    ctx.translate(startX + 8, energyY + 35);
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 8);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(game.crystals.toString(), startX + 22, energyY + 40);

    // XP bar
    const xpBarWidth = 150;
    const xpBarHeight = 8;
    const xpRatio = game.xp / game.xpToLevel;

    ctx.fillStyle = '#203040';
    ctx.fillRect(startX, energyY + 52, xpBarWidth, xpBarHeight);
    ctx.fillStyle = '#50ff80';
    ctx.fillRect(startX, energyY + 52, xpBarWidth * xpRatio, xpBarHeight);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX, energyY + 52, xpBarWidth, xpBarHeight);

    ctx.font = '12px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`LVL ${game.level}`, startX + xpBarWidth + 8, energyY + 60);

    // EXPAND 15: Combo multiplier - enhanced with scaling and glow
    if (game.combo > 0) {
        ctx.save();

        // Pulse effect on combo updates
        const pulse = 1 + Math.sin(game.time * 10) * 0.05;
        const comboScale = 1 + Math.min(game.comboMultiplier - 1, 1) * 0.3; // Scale up with higher combos

        // Glow for high combos
        if (game.comboMultiplier >= 2) {
            ctx.shadowColor = '#ff8000';
            ctx.shadowBlur = 10 + game.comboMultiplier * 3;
        }

        // Choose color based on combo level
        let comboColor = '#ff8000'; // Orange
        if (game.comboMultiplier >= 3) comboColor = '#ff4000'; // Red-orange
        if (game.comboMultiplier >= 4) comboColor = '#ff00ff'; // Magenta
        if (game.comboMultiplier >= 5) comboColor = '#ffff00'; // Gold

        ctx.font = `bold ${Math.floor(20 * comboScale * pulse)}px Arial`;
        ctx.fillStyle = comboColor;
        ctx.textAlign = 'left';
        ctx.fillText(`COMBO x${game.comboMultiplier.toFixed(1)}`, startX, energyY + 85);

        // Combo count
        ctx.font = '12px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fillText(`${game.combo} hits`, startX + 110, energyY + 85);

        // Combo timer bar with gradient
        const barWidth = 100;
        const timerRatio = game.comboTimer / 2;

        ctx.fillStyle = 'rgba(255, 128, 0, 0.2)';
        ctx.fillRect(startX, energyY + 92, barWidth, 6);

        // Timer bar with color based on time left
        const timerColor = timerRatio > 0.5 ? comboColor : (timerRatio > 0.25 ? '#ff4000' : '#ff0000');
        ctx.fillStyle = timerColor;
        ctx.fillRect(startX, energyY + 92, barWidth * timerRatio, 6);

        ctx.restore();
    }

    // Ability icons at bottom center
    drawAbilityBar();

    // EXPAND 9: Room indicator (changed from Wave for exploration mode)
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`Room ${game.wave}/${game.maxWave}`, canvas.width - 20, 30);
    ctx.fillText(`Enemies: ${enemies.length}${game.bossActive ? ' + BOSS' : ''}`, canvas.width - 20, 50);

    // EXPAND 10: Minimap
    drawMinimap();

    // ITERATION 57: Enhanced low health warning
    if (player.health <= 2) {
        const urgency = 1 - (player.health / 3); // More urgent at lower health
        const pulseSpeed = 8 + urgency * 8; // Faster pulse at lower health
        const pulseIntensity = 0.15 + urgency * 0.15;
        const pulse = Math.sin(game.time * pulseSpeed);

        ctx.save();

        // Red vignette effect (darker at edges)
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.8
        );
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(255, 0, 0, ${pulseIntensity + pulse * 0.1})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Pulsing red border
        ctx.strokeStyle = `rgba(255, 50, 50, ${0.4 + pulse * 0.2})`;
        ctx.lineWidth = 8 + pulse * 4;
        ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

        // Warning heart icon at center bottom
        if (player.health === 1) {
            const heartScale = 1.5 + Math.sin(game.time * 12) * 0.3;
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height - 50);
            ctx.scale(heartScale, heartScale);
            ctx.globalAlpha = 0.5 + pulse * 0.2;

            // Heart shape
            ctx.fillStyle = '#ff3050';
            ctx.beginPath();
            ctx.moveTo(0, 5);
            ctx.bezierCurveTo(-10, -5, -10, -10, 0, -5);
            ctx.bezierCurveTo(10, -10, 10, -5, 0, 5);
            ctx.fill();

            ctx.restore();

            // "DANGER" text
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = `rgba(255, 80, 80, ${0.6 + pulse * 0.3})`;
            ctx.textAlign = 'center';
            ctx.fillText('LOW HEALTH!', canvas.width / 2, canvas.height - 20);
        }

        ctx.restore();
    }

    // ITERATION 56: Enhanced supershot charge indicator
    if (player.superShotCharge > 0 && mouse.rightDown) {
        const charge = Math.min(1, player.superShotCharge);

        // Glowing ring that grows with charge
        ctx.save();
        const ringRadius = 20 + charge * 30;
        const ringPulse = 1 + Math.sin(game.time * 15) * 0.1 * charge;

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(player.x, player.y, ringRadius * ringPulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(64, 128, 255, ${0.3 + charge * 0.4})`;
        ctx.lineWidth = 3 + charge * 4;
        ctx.shadowColor = COLORS.bulletSuper;
        ctx.shadowBlur = 10 + charge * 20;
        ctx.stroke();

        // Inner charging ring (partial arc)
        ctx.beginPath();
        ctx.arc(player.x, player.y, ringRadius * ringPulse * 0.8, -Math.PI / 2, -Math.PI / 2 + charge * Math.PI * 2);
        ctx.strokeStyle = COLORS.bulletSuper;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Energy particles swirling toward player
        if (Math.random() < 0.5 + charge * 0.5) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 40;
            particles.push({
                x: player.x + Math.cos(angle) * dist,
                y: player.y + Math.sin(angle) * dist,
                vx: -Math.cos(angle) * (100 + charge * 100),
                vy: -Math.sin(angle) * (100 + charge * 100),
                life: 0.4,
                decay: 1.2,
                size: 3 + Math.random() * 3,
                color: charge >= 0.9 ? '#ffffff' : COLORS.bulletSuper
            });
        }

        // At full charge: visual flash indication
        if (charge >= 1) {
            ctx.beginPath();
            ctx.arc(player.x, player.y, ringRadius * 1.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + Math.sin(game.time * 20) * 0.1})`;
            ctx.fill();
        }

        ctx.restore();

        // Bar indicator (backup)
        ctx.fillStyle = 'rgba(64, 128, 255, 0.5)';
        ctx.fillRect(player.x - 25, player.y + 35, 50, 4);
        ctx.fillStyle = charge >= 1 ? '#ffffff' : COLORS.bulletSuper;
        ctx.fillRect(player.x - 25, player.y + 35, 50 * charge, 4);
    }
}

function drawHeart(x, y, size, filled, index) {
    ctx.save();
    ctx.translate(x, y);

    // ITERATION 70: Pulse hearts at low health
    const isLowHealth = player.health <= 2;
    const isLastHeart = filled && index === player.health - 1;
    if (isLowHealth && isLastHeart) {
        const pulse = 1 + Math.sin(game.time * 10) * 0.15;
        ctx.scale(pulse, pulse);
        ctx.shadowColor = '#ff4060';
        ctx.shadowBlur = 10 + Math.sin(game.time * 10) * 5;
    }

    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.bezierCurveTo(-size * 0.5, -size * 0.3, -size * 0.5, -size * 0.6, 0, -size * 0.3);
    ctx.bezierCurveTo(size * 0.5, -size * 0.6, size * 0.5, -size * 0.3, 0, size * 0.3);

    ctx.fillStyle = filled ? COLORS.healthFull : COLORS.healthEmpty;
    ctx.fill();

    if (filled) {
        ctx.beginPath();
        ctx.arc(-size * 0.15, -size * 0.2, size * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
    }

    ctx.restore();
}

function drawEnergy(x, y, filled, index) {
    ctx.save();
    ctx.translate(x, y);

    // ITERATION 67: Energy regen visual
    const isRegenTarget = !player.boosting && Math.floor(player.energy) === index && player.energy < player.maxEnergy;
    if (isRegenTarget) {
        // Pulsing glow for currently regenerating diamond
        const regenPulse = Math.sin(game.time * 10) * 0.3 + 0.7;
        ctx.shadowColor = '#50d0ff';
        ctx.shadowBlur = 10 * regenPulse;

        // Scale pulse
        const scale = 1 + Math.sin(game.time * 8) * 0.1;
        ctx.scale(scale, scale);
    }

    // Diamond shape
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-8, 0);
    ctx.closePath();

    ctx.fillStyle = filled ? COLORS.energyFull : COLORS.energyEmpty;
    ctx.fill();
    ctx.strokeStyle = filled ? '#80e0ff' : (isRegenTarget ? '#60a0c0' : '#304050');
    ctx.lineWidth = 2;
    ctx.stroke();

    if (filled) {
        ctx.beginPath();
        ctx.moveTo(-2, -5);
        ctx.lineTo(2, -2);
        ctx.lineTo(-1, 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    }

    ctx.restore();
}

function drawAbilityBar() {
    const abilities = [
        { name: 'DASH', key: 'SPACE', ready: player.dashCooldown <= 0, has: player.hasDash },
        { name: 'SUPER', key: 'RMB', ready: player.energy >= 1, has: player.hasSupershot },
        { name: 'BOOST', key: 'SHIFT', ready: player.energy >= 0.1, has: player.hasBoost },
        { name: 'TIME', key: 'Q', ready: player.energy >= 3, has: player.hasTimeStop }
    ];

    const iconSize = 40;
    const spacing = 10;
    const availableAbilities = abilities.filter(a => a.has);
    const totalWidth = availableAbilities.length * iconSize + (availableAbilities.length - 1) * spacing;
    const startX = (canvas.width - totalWidth) / 2;
    const y = canvas.height - 55;

    availableAbilities.forEach((ability, i) => {
        const x = startX + i * (iconSize + spacing);

        // Hexagon background
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
            const angle = (j / 6) * Math.PI * 2 - Math.PI / 2;
            const px = x + iconSize / 2 + Math.cos(angle) * iconSize / 2;
            const py = y + iconSize / 2 + Math.sin(angle) * iconSize / 2;
            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = ability.ready ? 'rgba(80, 200, 255, 0.3)' : 'rgba(40, 60, 80, 0.5)';
        ctx.fill();
        ctx.strokeStyle = ability.ready ? '#50c8ff' : '#405060';
        ctx.lineWidth = 2;
        ctx.stroke();

        // POLISH 14: Cooldown visual
        if (!ability.ready && ability.name === 'DASH' && player.dashCooldown > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.moveTo(x + iconSize / 2, y + iconSize / 2);
            ctx.arc(x + iconSize / 2, y + iconSize / 2, iconSize / 2, -Math.PI / 2, -Math.PI / 2 + (player.dashCooldown / 0.8) * Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }

        // Icon text
        ctx.font = '10px Arial';
        ctx.fillStyle = ability.ready ? '#ffffff' : '#606060';
        ctx.textAlign = 'center';
        ctx.fillText(ability.name, x + iconSize / 2, y + iconSize / 2 + 3);
    });
}

// ITERATION 61: Enhanced Minimap
function drawMinimap() {
    const mapSize = 100;
    const mapHeight = mapSize * (720 / 1280);
    const mapX = canvas.width - mapSize - 15;
    const mapY = 70;
    const scaleX = mapSize / canvas.width;
    const scaleY = mapHeight / canvas.height;

    ctx.save();

    // Background with gradient
    const bgGrad = ctx.createLinearGradient(mapX, mapY, mapX, mapY + mapHeight);
    bgGrad.addColorStop(0, 'rgba(10, 30, 40, 0.7)');
    bgGrad.addColorStop(1, 'rgba(5, 15, 25, 0.8)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(mapX, mapY, mapSize, mapHeight);

    // Inner glow border
    ctx.strokeStyle = 'rgba(80, 200, 255, 0.3)';
    ctx.lineWidth = 4;
    ctx.strokeRect(mapX + 2, mapY + 2, mapSize - 4, mapHeight - 4);

    // Outer border
    ctx.strokeStyle = '#50c8ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapSize, mapHeight);

    // Grid lines
    ctx.strokeStyle = 'rgba(80, 200, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(mapX + (mapSize / 4) * i, mapY);
        ctx.lineTo(mapX + (mapSize / 4) * i, mapY + mapHeight);
        ctx.stroke();
    }
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(mapX, mapY + (mapHeight / 3) * i);
        ctx.lineTo(mapX + mapSize, mapY + (mapHeight / 3) * i);
        ctx.stroke();
    }

    // Spawn warnings on minimap
    spawnWarnings.forEach(w => {
        const pulse = Math.sin(game.time * 10) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 100, 100, ${pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(mapX + w.x * scaleX, mapY + w.y * scaleY, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Crystal dots
    ctx.fillStyle = 'rgba(255, 48, 80, 0.7)';
    crystals.forEach(c => {
        ctx.beginPath();
        ctx.arc(mapX + c.x * scaleX, mapY + c.y * scaleY, 1.5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Pickup dots with glow
    pickups.forEach(p => {
        const color = p.type === 'health' ? '#ff80a0' : '#80ffb0';
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(mapX + p.x * scaleX, mapY + p.y * scaleY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Enemy dots with size variation
    enemies.forEach(e => {
        if (!e.disguised && !e.burrowed) {
            const dotSize = e.isElite ? 3 : 2;
            ctx.fillStyle = e.isElite ? '#c040ff' : '#ff4040';
            ctx.beginPath();
            ctx.arc(mapX + e.x * scaleX, mapY + e.y * scaleY, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Boss dot with pulsing
    if (boss) {
        const bossPulse = 1 + Math.sin(game.time * 8) * 0.3;
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(mapX + boss.x * scaleX, mapY + boss.y * scaleY, 5 * bossPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Player dot with direction indicator
    const px = mapX + player.x * scaleX;
    const py = mapY + player.y * scaleY;

    // Player glow
    ctx.fillStyle = 'rgba(80, 200, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    // Player dot
    ctx.fillStyle = '#50c8ff';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

    // Direction indicator
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(player.angle) * 8, py + Math.sin(player.angle) * 8);
    ctx.stroke();

    // Label
    ctx.font = '9px Arial';
    ctx.fillStyle = '#80c0ff';
    ctx.textAlign = 'center';
    ctx.fillText('MAP', mapX + mapSize / 2, mapY - 3);

    ctx.restore();
}

// Debug overlay (press Q to toggle)
function drawDebugOverlay() {
    if (!game.debugMode) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 150, 280, 240);

    ctx.fillStyle = '#0f0';
    ctx.font = '14px monospace';
    let y = 170;
    const line = (text) => { ctx.fillText(text, 20, y); y += 18; };

    line('=== DEBUG (Q to close) ===');
    line('Player: (' + Math.round(player.x) + ', ' + Math.round(player.y) + ')');
    line('Health: ' + player.health + '/' + player.maxHealth);
    line('Energy: ' + player.energy.toFixed(1) + '/' + player.maxEnergy);
    line('Enemies: ' + enemies.length);
    line('Wave: ' + game.wave + '/' + game.maxWave);
    line('State: ' + game.state);
    line('Crystals: ' + game.crystals);
    line('Level: ' + game.level + ' (XP: ' + game.xp + '/' + game.xpToLevel + ')');
    line('Combo: ' + game.comboMultiplier.toFixed(1) + 'x');
    line('FPS: ' + Math.round(game.fps));
    line('Bullets: ' + playerBullets.length + ' / ' + enemyBullets.length);
    line('Boss: ' + (boss ? boss.hp + '/' + boss.maxHp : 'None'));

    ctx.restore();
}

// Update functions
function updatePlayer(dt) {
    // Movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    // Normalize diagonal
    if (dx && dy) {
        dx *= 0.707;
        dy *= 0.707;
    }

    // EXPAND 7: Boost ability
    player.boosting = keys['shift'] && player.hasBoost && player.energy >= 0.1 * dt;
    const speedMult = player.boosting ? 2 : 1;

    if (player.boosting) {
        player.energy -= 2 * dt;
        if (player.energy < 0) player.energy = 0;

        // ITERATION 68: Enhanced boost trail particles
        if (Math.random() < 0.6) {
            const backAngle = player.angle + Math.PI;
            const spread = (Math.random() - 0.5) * 0.8;
            particles.push({
                x: player.x + Math.cos(backAngle) * 15,
                y: player.y + Math.sin(backAngle) * 15,
                vx: Math.cos(backAngle + spread) * (80 + Math.random() * 60),
                vy: Math.sin(backAngle + spread) * (80 + Math.random() * 60),
                life: 0.4,
                decay: 1.5,
                size: 4 + Math.random() * 3,
                color: Math.random() < 0.5 ? '#80ffff' : '#ffffff'
            });
        }
    }

    player.vx = dx * player.speed * speedMult;
    player.vy = dy * player.speed * speedMult;

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // ITERATION 73: Decay shot pulse
    if (player.shotPulse > 0) {
        player.shotPulse -= dt * 4;
        if (player.shotPulse < 0) player.shotPulse = 0;
    }

    // POLISH 6: Update trail
    if (Math.abs(player.vx) > 10 || Math.abs(player.vy) > 10) {
        player.trail.push({ x: player.x, y: player.y });
        if (player.trail.length > 10) player.trail.shift();
    } else {
        if (player.trail.length > 0) player.trail.shift();
    }

    // Bounds (scaled for 1280x720)
    player.x = Math.max(100, Math.min(1180, player.x));
    player.y = Math.max(100, Math.min(620, player.y));

    // Aim toward mouse
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Shooting
    player.fireCooldown -= dt;
    if (mouse.down && player.fireCooldown <= 0) {
        firePlayerBullet();
        player.fireCooldown = 1 / player.fireRate;
    }

    // EXPAND 1: Supershot (right-click)
    if (mouse.rightDown && player.hasSupershot) {
        player.superShotCharge += dt * 2;
        if (player.superShotCharge >= 1 && player.energy >= 1) {
            fireSupershot();
            player.superShotCharge = 0;
        }
    } else {
        player.superShotCharge = 0;
    }

    // EXPAND 17: Time stop (Q key)
    if (keys['q'] && player.hasTimeStop && player.energy >= 3 && game.slowMotion === 1) {
        player.energy -= 3;
        game.slowMotion = 0.2;
        game.slowMotionTimer = 3;

        // Time stop effect
        game.screenFlash = 0.3;
        game.screenFlashColor = '#8080ff';

        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            particles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * 200,
                vy: Math.sin(angle) * 200,
                life: 1,
                decay: 1,
                size: 4,
                color: '#8080ff'
            });
        }
    }

    // Dash cooldown
    player.dashCooldown -= dt;

    // Invincibility
    if (player.invincible > 0) {
        player.invincible -= dt;
    }

    // Energy regen
    if (!player.boosting && player.energy < player.maxEnergy) {
        player.energy += 0.5 * dt;
        if (player.energy > player.maxEnergy) player.energy = player.maxEnergy;
    }
}

function dash() {
    const dashDist = 150; // Increased dash distance
    const startX = player.x;
    const startY = player.y;

    player.x += Math.cos(player.angle) * dashDist;
    player.y += Math.sin(player.angle) * dashDist;
    player.x = Math.max(100, Math.min(1180, player.x));
    player.y = Math.max(100, Math.min(620, player.y));
    player.dashCooldown = 0.8;

    // Dash screen effects
    game.screenFlash = 0.15;
    game.screenFlashColor = '#50c8ff';

    // EXPAND 19: Dash i-frames
    player.invincible = Math.max(player.invincible, 0.25);

    // POLISH 19: Dodge afterimage effect - more afterimages
    for (let i = 0; i < 8; i++) {
        const t = i / 8;
        particles.push({
            x: startX + (player.x - startX) * t,
            y: startY + (player.y - startY) * t,
            vx: 0,
            vy: 0,
            life: 0.6 - t * 0.3,
            decay: 1.5,
            size: 15 - i * 1.5,
            color: 'rgba(80, 200, 255, ' + (0.6 - t * 0.4) + ')'
        });
    }

    // Dash trail particles - more particles for whoosh effect
    for (let i = 0; i < 20; i++) {
        const t = Math.random();
        particles.push({
            x: startX + (player.x - startX) * t + (Math.random() - 0.5) * 20,
            y: startY + (player.y - startY) * t + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 80,
            vy: (Math.random() - 0.5) * 80,
            life: 0.8,
            decay: 1.5,
            size: 3 + Math.random() * 3,
            color: COLORS.playerAccent
        });
    }
}

function firePlayerBullet() {
    const speed = 500;
    const spread = 0.1;

    // EXPAND 8: Multiple bullets
    for (let i = 0; i < player.bulletCount; i++) {
        const angleOffset = player.bulletCount > 1 ? (i - (player.bulletCount - 1) / 2) * spread : 0;
        const angle = player.angle + angleOffset;

        playerBullets.push({
            x: player.x + Math.cos(angle) * 20,
            y: player.y + Math.sin(angle) * 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: player.damage,
            range: player.range,
            traveled: 0,
            size: 5,
            isSuper: false
        });
    }

    // POLISH 1: Muzzle flash
    muzzleFlashes.push({
        x: player.x + Math.cos(player.angle) * 20,
        y: player.y + Math.sin(player.angle) * 20,
        angle: player.angle,
        life: 0.1,
        isSuper: false
    });

    // ITERATION 73: Shot recoil visual
    player.shotPulse = 0.2;

    // Tiny recoil push
    player.vx -= Math.cos(player.angle) * 10;
    player.vy -= Math.sin(player.angle) * 10;
}

// EXPAND 1: Supershot - ITERATION 56 enhanced
function fireSupershot() {
    player.energy -= 1;
    const speed = 400;

    playerBullets.push({
        x: player.x + Math.cos(player.angle) * 20,
        y: player.y + Math.sin(player.angle) * 20,
        vx: Math.cos(player.angle) * speed,
        vy: Math.sin(player.angle) * speed,
        damage: player.damage * 3,
        range: player.range * 1.5,
        traveled: 0,
        size: 10,
        isSuper: true,
        piercing: true
    });

    // Big muzzle flash
    muzzleFlashes.push({
        x: player.x + Math.cos(player.angle) * 20,
        y: player.y + Math.sin(player.angle) * 20,
        angle: player.angle,
        life: 0.25,
        isSuper: true
    });

    // ITERATION 56: Dramatic release effect
    game.screenShake = 0.2;
    game.screenFlash = 0.2;
    game.screenFlashColor = '#4080ff';

    // Shockwave ring from player
    particles.push({
        x: player.x,
        y: player.y,
        vx: 0,
        vy: 0,
        life: 0.4,
        decay: 1,
        size: 0,
        color: '#4080ff',
        ring: true,
        ringRadius: 20,
        ringExpand: 200
    });

    // Burst particles in firing direction
    for (let i = 0; i < 12; i++) {
        const spread = (Math.random() - 0.5) * 0.8;
        particles.push({
            x: player.x + Math.cos(player.angle) * 25,
            y: player.y + Math.sin(player.angle) * 25,
            vx: Math.cos(player.angle + spread) * (150 + Math.random() * 100),
            vy: Math.sin(player.angle + spread) * (150 + Math.random() * 100),
            life: 0.5,
            decay: 1.2,
            size: 4 + Math.random() * 4,
            color: i % 3 === 0 ? '#ffffff' : '#4080ff'
        });
    }

    // Kickback particles behind player
    for (let i = 0; i < 6; i++) {
        const backAngle = player.angle + Math.PI + (Math.random() - 0.5) * 1.2;
        particles.push({
            x: player.x + Math.cos(backAngle) * 15,
            y: player.y + Math.sin(backAngle) * 15,
            vx: Math.cos(backAngle) * (80 + Math.random() * 60),
            vy: Math.sin(backAngle) * (80 + Math.random() * 60),
            life: 0.3,
            decay: 1,
            size: 3,
            color: '#80b0ff'
        });
    }
}

function updateEnemies(dt) {
    const effectiveDt = dt * game.slowMotion;

    enemies.forEach(enemy => {
        enemy.hitFlash -= dt * 5;
        if (enemy.hitFlash < 0) enemy.hitFlash = 0;

        // POLISH 12: Spawn animation
        if (enemy.spawnScale < 1) {
            enemy.spawnScale += dt * 3;
            return;
        }

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        // Mimic activation
        if (enemy.type === 'mimic' && enemy.disguised) {
            if (dist < enemy.aggroRange) {
                enemy.disguised = false;
                // Surprise attack particles
                for (let i = 0; i < 10; i++) {
                    particles.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        life: 1,
                        decay: 2,
                        size: 4,
                        color: '#80ff80'
                    });
                }
            }
            return;
        }

        // Burrower mechanics
        if (enemy.type === 'burrower') {
            if (enemy.burrowed) {
                enemy.emergeTimer -= effectiveDt;
                // Move underground toward player
                if (dist > 50) {
                    enemy.x += (dx / dist) * 100 * effectiveDt;
                    enemy.y += (dy / dist) * 100 * effectiveDt;
                }
                if (enemy.emergeTimer <= 0) {
                    enemy.burrowed = false;
                    // Emerge particles
                    for (let i = 0; i < 8; i++) {
                        particles.push({
                            x: enemy.x,
                            y: enemy.y,
                            vx: (Math.random() - 0.5) * 80,
                            vy: (Math.random() - 0.5) * 80,
                            life: 1,
                            decay: 2,
                            size: 5,
                            color: '#a08060'
                        });
                    }
                }
                return;
            }
        }

        enemy.angle = Math.atan2(dy, dx);

        // AI behavior by type
        if (enemy.type === 'scout') {
            if (dist > 150) {
                enemy.x += (dx / dist) * enemy.speed * effectiveDt;
                enemy.y += (dy / dist) * enemy.speed * effectiveDt;
            } else if (dist < 100) {
                enemy.x -= (dx / dist) * enemy.speed * effectiveDt;
                enemy.y -= (dy / dist) * enemy.speed * effectiveDt;
            }
        } else if (enemy.type === 'heavy') {
            if (dist > 80) {
                enemy.x += (dx / dist) * enemy.speed * effectiveDt;
                enemy.y += (dy / dist) * enemy.speed * effectiveDt;
            }
        } else if (enemy.type === 'grasshopper') {
            // EXPAND 2: Grasshopper hops
            enemy.hopCooldown -= effectiveDt;
            if (enemy.hopCooldown <= 0 && dist > 50) {
                const hopDist = Math.min(100, dist);
                enemy.x += (dx / dist) * hopDist;
                enemy.y += (dy / dist) * hopDist;
                enemy.hopCooldown = 1.5;

                // Hop particles
                for (let i = 0; i < 5; i++) {
                    particles.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: (Math.random() - 0.5) * 50,
                        vy: 20 + Math.random() * 30,
                        life: 0.5,
                        decay: 1,
                        size: 3,
                        color: '#80c040'
                    });
                }
            }
        } else if (enemy.type === 'burrower') {
            // Chase when above ground
            if (dist > 100) {
                enemy.x += (dx / dist) * enemy.speed * effectiveDt;
                enemy.y += (dy / dist) * enemy.speed * effectiveDt;
            }
        } else if (enemy.type === 'mimic') {
            // Aggressive chase
            if (dist > 40) {
                enemy.x += (dx / dist) * enemy.speed * effectiveDt;
                enemy.y += (dy / dist) * enemy.speed * effectiveDt;
            }
        }

        // Firing
        enemy.fireCooldown -= effectiveDt;
        if (enemy.fireCooldown <= 0 && dist < 400 && !enemy.disguised && !enemy.burrowed) {
            fireEnemyBullet(enemy);
            enemy.fireCooldown = enemy.fireRate;
        }
    });
}

function fireEnemyBullet(enemy) {
    const speed = 150 * game.slowMotion;
    const angle = enemy.angle;

    if (enemy.type === 'turret') {
        // Spray 8 bullets
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            enemyBullets.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                size: 6
            });
        }
    } else if (enemy.type === 'heavy') {
        // Spread 5 bullets
        for (let i = -2; i <= 2; i++) {
            const a = angle + i * 0.2;
            enemyBullets.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                size: 7
            });
        }
    } else if (enemy.type === 'grasshopper') {
        // Burst 3 bullets
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (game.state === 'playing') {
                    enemyBullets.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: Math.cos(angle) * speed * 1.2,
                        vy: Math.sin(angle) * speed * 1.2,
                        size: 5
                    });
                }
            }, i * 100);
        }
    } else if (enemy.type === 'burrower') {
        // EXPAND 18: Homing bullet
        enemyBullets.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * speed * 0.8,
            vy: Math.sin(angle) * speed * 0.8,
            size: 6,
            isHoming: true,
            turnSpeed: 2
        });
    } else if (enemy.type === 'mimic') {
        // Fast double shot
        for (let i = -1; i <= 1; i += 2) {
            const a = angle + i * 0.15;
            enemyBullets.push({
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(a) * speed * 1.3,
                vy: Math.sin(a) * speed * 1.3,
                size: 5
            });
        }
    } else {
        // Single bullet
        enemyBullets.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 6
        });
    }
}

// EXPAND 16: Boss update
function updateBoss(dt) {
    if (!boss) return;

    const effectiveDt = dt * game.slowMotion;

    boss.hitFlash -= dt * 5;
    if (boss.hitFlash < 0) boss.hitFlash = 0;

    // Spawn animation
    if (boss.spawnScale < 1) {
        boss.spawnScale += dt * 1.5;
        return;
    }

    // ITERATION 72: Boss entrance animation
    if (boss.enteringArena) {
        boss.entranceTimer += dt;
        // Move down into arena
        const targetY = 250;
        boss.y += (targetY - boss.y) * dt * 2;

        // Shake during entrance
        if (Math.random() < 0.3) game.screenShake = Math.max(game.screenShake, 0.15);

        // Entrance particles
        if (Math.random() < 0.4) {
            particles.push({
                x: boss.x + (Math.random() - 0.5) * 60,
                y: boss.y + 30,
                vx: (Math.random() - 0.5) * 100,
                vy: 50 + Math.random() * 50,
                life: 0.5,
                decay: 1,
                size: 5 + Math.random() * 5,
                color: '#ff6030'
            });
        }

        // Entrance complete
        if (boss.y > 240) {
            boss.enteringArena = false;
            boss.y = 250;
            game.screenShake = 0.4;
            game.announcement = '⚔️ FOREST GUARDIAN ⚔️';
            game.announcementTimer = 2;
            game.announcementColor = '#ffff00';

            // Landing particles
            for (let i = 0; i < 25; i++) {
                particles.push({
                    x: boss.x + (Math.random() - 0.5) * 80,
                    y: boss.y + 30,
                    vx: (Math.random() - 0.5) * 200,
                    vy: -50 - Math.random() * 100,
                    life: 1,
                    decay: 0.8,
                    size: 4 + Math.random() * 6,
                    color: ['#ffcc00', '#ff8800', '#ffffff'][Math.floor(Math.random() * 3)]
                });
            }
        }
        return;
    }

    // Rotate arms
    boss.angle += effectiveDt * 0.5;

    // Phase transitions with dramatic feedback
    const hpPercent = boss.hp / boss.maxHp;
    const oldPhase = boss.phase;

    if (hpPercent < 0.3) boss.phase = 3;
    else if (hpPercent < 0.6) boss.phase = 2;

    // Phase change effects
    if (boss.phase !== oldPhase) {
        game.screenShake = 0.5;
        game.screenFlash = 0.4;
        game.screenFlashColor = boss.phase === 3 ? '#ff4040' : '#ff8000';

        // Boss roar announcement
        game.waveAnnounce = boss.phase === 3 ? 'BOSS ENRAGED!' : 'BOSS PHASE 2';
        game.waveAnnounceTimer = 2;

        // Shockwave particles
        for (let k = 0; k < 24; k++) {
            const angle = (k / 24) * Math.PI * 2;
            particles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle) * 300,
                vy: Math.sin(angle) * 300,
                life: 0.6,
                decay: 1,
                size: 8,
                color: boss.phase === 3 ? '#ff4040' : '#ff8000'
            });
        }
    }

    // Attack patterns
    boss.attackTimer -= effectiveDt;
    if (boss.attackTimer <= 0) {
        bossAttack();
        boss.attackTimer = boss.phase >= 3 ? 1.5 : (boss.phase >= 2 ? 2 : 2.5);
    }

    // Movement
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 150) {
        boss.x += (dx / dist) * 30 * effectiveDt;
        boss.y += (dy / dist) * 30 * effectiveDt;
    }

    // Keep in bounds (scaled for 1280x720)
    boss.x = Math.max(150, Math.min(1130, boss.x));
    boss.y = Math.max(150, Math.min(570, boss.y));
}

function bossAttack() {
    const patterns = boss.phase >= 3 ? 3 : (boss.phase >= 2 ? 2 : 1);
    const pattern = Math.floor(Math.random() * patterns);

    const speed = 120;

    if (pattern === 0) {
        // Circle spray
        for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2;
            enemyBullets.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                size: 8
            });
        }
    } else if (pattern === 1) {
        // Spiral
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                if (game.state === 'playing' && boss) {
                    const a = boss.angle + (i / 12) * Math.PI * 4;
                    enemyBullets.push({
                        x: boss.x,
                        y: boss.y,
                        vx: Math.cos(a) * speed * 1.2,
                        vy: Math.sin(a) * speed * 1.2,
                        size: 7
                    });
                }
            }, i * 80);
        }
    } else {
        // Targeted burst + circle
        const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
        for (let i = -2; i <= 2; i++) {
            enemyBullets.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle + i * 0.15) * speed * 1.5,
                vy: Math.sin(angle + i * 0.15) * speed * 1.5,
                size: 9
            });
        }
        // Plus circle
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            enemyBullets.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(a) * speed * 0.8,
                vy: Math.sin(a) * speed * 0.8,
                size: 6
            });
        }
    }
}

function updateBullets(dt) {
    const effectiveDt = dt * game.slowMotion;

    // Player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const b = playerBullets[i];
        b.x += b.vx * dt;  // Player bullets not affected by slow
        b.y += b.vy * dt;
        b.traveled += Math.hypot(b.vx, b.vy) * dt;

        // ITERATION 60: Spawn trail particles
        if (Math.random() < (b.isSuper ? 0.8 : 0.4)) {
            particles.push({
                x: b.x - b.vx * dt * 0.5,
                y: b.y - b.vy * dt * 0.5,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                life: 0.3,
                decay: 1.5,
                size: b.isSuper ? 3 : 2,
                color: b.isSuper ? '#4080ff' : '#50c8ff'
            });
        }

        // Range check
        if (b.traveled > b.range) {
            playerBullets.splice(i, 1);
            continue;
        }

        // Bounds - ITERATION 69: Add impact particles at walls
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            // Wall impact particles
            for (let k = 0; k < 5; k++) {
                const angle = Math.atan2(b.vy, b.vx) + Math.PI + (Math.random() - 0.5) * 1.5;
                particles.push({
                    x: Math.max(5, Math.min(canvas.width - 5, b.x)),
                    y: Math.max(5, Math.min(canvas.height - 5, b.y)),
                    vx: Math.cos(angle) * (50 + Math.random() * 50),
                    vy: Math.sin(angle) * (50 + Math.random() * 50),
                    life: 0.3,
                    decay: 1.5,
                    size: 2 + Math.random() * 2,
                    color: b.isSuper ? '#4080ff' : '#50c8ff'
                });
            }
            playerBullets.splice(i, 1);
            continue;
        }

        // Hit boss
        if (boss && Math.hypot(b.x - boss.x, b.y - boss.y) < boss.size + b.size) {
            // EXPAND 11: Critical hits
            const isCrit = Math.random() < player.critChance;
            const damage = isCrit ? b.damage * 2 : b.damage;

            boss.hp -= damage;
            boss.hitFlash = 1;

            // POLISH 3: Damage numbers
            damageNumbers.push({
                x: b.x,
                y: b.y - 20,
                text: Math.floor(damage).toString() + (isCrit ? '!' : ''),
                life: 1,
                vy: -50,
                isCrit
            });

            // POLISH 5: Hit particles
            for (let k = 0; k < 8; k++) {
                particles.push({
                    x: b.x,
                    y: b.y,
                    vx: (Math.random() - 0.5) * 150,
                    vy: (Math.random() - 0.5) * 150,
                    life: 1,
                    decay: 3,
                    size: 4,
                    color: isCrit ? COLORS.critical : '#4a8a4a'
                });
            }

            if (!b.piercing) {
                playerBullets.splice(i, 1);
            }

            // EXPAND 15: Combo system
            game.combo++;
            game.comboTimer = 2;
            game.comboMultiplier = 1 + Math.floor(game.combo / 5) * 0.5;

            if (boss.hp <= 0) {
                defeatBoss();
            }
            continue;
        }

        // Hit enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (e.disguised || e.burrowed) continue;

            if (Math.hypot(b.x - e.x, b.y - e.y) < e.size + b.size) {
                // EXPAND 11: Critical hits
                const isCrit = Math.random() < player.critChance;
                const damage = isCrit ? b.damage * 2 : b.damage;

                e.hp -= damage;
                e.hitFlash = 1;

                // POLISH 3: Damage numbers
                damageNumbers.push({
                    x: b.x,
                    y: b.y - 20,
                    text: Math.floor(damage).toString() + (isCrit ? '!' : ''),
                    life: 1,
                    vy: -50,
                    isCrit
                });

                // POLISH 5: Hit particles
                for (let k = 0; k < 5; k++) {
                    particles.push({
                        x: b.x,
                        y: b.y,
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        life: 1,
                        decay: 3,
                        size: 3,
                        color: isCrit ? COLORS.critical : e.color
                    });
                }

                if (!b.piercing) {
                    playerBullets.splice(i, 1);
                }

                // EXPAND 15: Combo system
                game.combo++;
                game.comboTimer = 2;
                game.comboMultiplier = 1 + Math.floor(game.combo / 5) * 0.5;

                if (e.hp <= 0) {
                    killEnemy(j);
                }
                break;
            }
        }
    }

    // Enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];

        // EXPAND 18: Homing bullets
        if (b.isHoming) {
            const dx = player.x - b.x;
            const dy = player.y - b.y;
            const targetAngle = Math.atan2(dy, dx);
            const currentAngle = Math.atan2(b.vy, b.vx);
            let angleDiff = targetAngle - currentAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            const turn = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), b.turnSpeed * effectiveDt);
            const newAngle = currentAngle + turn;
            const speed = Math.hypot(b.vx, b.vy);
            b.vx = Math.cos(newAngle) * speed;
            b.vy = Math.sin(newAngle) * speed;
        }

        b.x += b.vx * effectiveDt;
        b.y += b.vy * effectiveDt;

        // ITERATION 60: Enemy bullet trails
        if (Math.random() < (b.isHoming ? 0.6 : 0.3)) {
            particles.push({
                x: b.x - b.vx * effectiveDt * 0.5,
                y: b.y - b.vy * effectiveDt * 0.5,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                life: 0.25,
                decay: 1.5,
                size: b.isHoming ? 3 : 2,
                color: b.isHoming ? '#ff60ff' : '#ff6030'
            });
        }

        // Bounds
        if (b.x < -20 || b.x > canvas.width + 20 || b.y < -20 || b.y > canvas.height + 20) {
            enemyBullets.splice(i, 1);
            continue;
        }

        // Hit player
        if (player.invincible <= 0 && Math.hypot(b.x - player.x, b.y - player.y) < 15 + b.size) {
            player.health--;
            player.invincible = 1.5;
            enemyBullets.splice(i, 1);

            // Stronger damage feedback
            game.screenShake = 0.4;
            game.screenFlash = 0.6;
            game.screenFlashColor = '#ff0000';

            // POLISH 17: Enhanced damage particles - more dramatic
            for (let k = 0; k < 20; k++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 100 + Math.random() * 200;
                particles.push({
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.8 + Math.random() * 0.4,
                    decay: 1.5,
                    size: 3 + Math.random() * 4,
                    color: COLORS.healthFull
                });
            }

            // Warning ring expanding outward
            for (let k = 0; k < 16; k++) {
                const angle = (k / 16) * Math.PI * 2;
                particles.push({
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(angle) * 250,
                    vy: Math.sin(angle) * 250,
                    life: 0.5,
                    decay: 1,
                    size: 6,
                    color: '#ff4040'
                });
            }

            // Reset combo and kill streak
            game.combo = 0;
            game.comboMultiplier = 1;
            game.killStreak = 0;
            game.lastAnnouncedStreak = 0;

            if (player.health <= 0) {
                // ITERATION 78: Player death explosion
                game.screenShake = 1;
                game.screenFlash = 1;
                game.screenFlashColor = '#ff0000';

                // Massive death explosion particles
                for (let i = 0; i < 60; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 100 + Math.random() * 300;
                    particles.push({
                        x: player.x,
                        y: player.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 1 + Math.random() * 0.5,
                        decay: 0.8,
                        size: 4 + Math.random() * 6,
                        color: ['#50c8ff', '#80ffff', '#ffffff', '#ff8080'][Math.floor(Math.random() * 4)]
                    });
                }

                // Death rings
                for (let i = 0; i < 4; i++) {
                    particles.push({
                        type: 'ring',
                        x: player.x,
                        y: player.y,
                        size: 20 + i * 20,
                        maxSize: 150 + i * 50,
                        life: 1,
                        decay: 0.6 + i * 0.1,
                        color: i < 2 ? '#50c8ff' : '#ffffff'
                    });
                }

                game.state = 'gameover';
            }
        }
    }
}

function killEnemy(index) {
    const e = enemies[index];

    // Scale effects by enemy size for more satisfying kills
    const sizeMult = e.size / 20;
    const particleCount = Math.floor(20 * sizeMult);

    // POLISH 7: Death explosion particles - MORE for bigger enemies
    for (let i = 0; i < particleCount; i++) {
        const speed = 200 + Math.random() * 150;
        const angle = Math.random() * Math.PI * 2;
        particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.8 + Math.random() * 0.4,
            decay: 1.5,
            size: 4 + Math.random() * 4,
            color: e.color
        });
    }

    // More dramatic death ring - expands outward
    const ringCount = Math.floor(16 * sizeMult);
    for (let i = 0; i < ringCount; i++) {
        const angle = (i / ringCount) * Math.PI * 2;
        const speed = 180 + Math.random() * 50;
        particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.6,
            decay: 1.2,
            size: 5,
            color: '#ffffff'
        });
    }

    // Inner burst for extra juiciness
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        particles.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(angle) * 80,
            vy: Math.sin(angle) * 80,
            life: 0.5,
            decay: 2,
            size: 8,
            color: '#ffff80'
        });
    }

    // Elite kills get screen flash
    if (e.isElite) {
        game.screenFlash = 0.4;
        game.screenFlashColor = '#c040ff';
    }

    // ITERATION 59: Kill streak announcements
    game.killStreak = game.combo + 1; // Will be incremented after this
    const streak = game.killStreak;

    // Check for streak milestones and announce
    const streakMilestones = {
        2: { text: 'DOUBLE KILL!', color: '#ffff00' },
        3: { text: 'TRIPLE KILL!', color: '#ff8000' },
        5: { text: 'RAMPAGE!', color: '#ff4000' },
        7: { text: 'UNSTOPPABLE!', color: '#ff00ff' },
        10: { text: 'GODLIKE!', color: '#00ffff' },
        15: { text: 'LEGENDARY!', color: '#ffffff' }
    };

    if (streakMilestones[streak] && streak > game.lastAnnouncedStreak) {
        const milestone = streakMilestones[streak];
        game.waveAnnounce = milestone.text;
        game.waveAnnounceTimer = 1.5;
        game.lastAnnouncedStreak = streak;

        // Extra effects for big streaks
        if (streak >= 5) {
            game.screenShake = Math.min(0.3, streak * 0.03);
            game.screenFlash = 0.3;
            game.screenFlashColor = milestone.color;

            // Particle burst
            for (let i = 0; i < streak * 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                particles.push({
                    x: e.x,
                    y: e.y,
                    vx: Math.cos(angle) * (100 + Math.random() * 100),
                    vy: Math.sin(angle) * (100 + Math.random() * 100),
                    life: 1,
                    decay: 1,
                    size: 5,
                    color: milestone.color
                });
            }
        }
    }

    // Drop crystals with combo bonus - spread them out more
    const xpValue = Math.floor(e.xp * game.comboMultiplier);
    const crystalCount = Math.ceil(xpValue / 2);
    for (let i = 0; i < crystalCount; i++) {
        const angle = (i / crystalCount) * Math.PI * 2;
        const dist = 20 + Math.random() * 30;
        crystals.push({
            x: e.x + Math.cos(angle) * dist,
            y: e.y + Math.sin(angle) * dist,
            value: Math.ceil(xpValue / crystalCount),
            magnetRange: 100
        });
    }

    // EXPAND 5-6: Chance to drop pickups
    if (Math.random() < 0.15) {
        pickups.push({
            x: e.x,
            y: e.y,
            type: Math.random() < 0.5 ? 'health' : 'energy'
        });
    }

    enemies.splice(index, 1);

    // Screen shake scales with enemy size - bigger kills = more shake
    game.screenShake = Math.max(game.screenShake, 0.1 + 0.15 * sizeMult);

    // Check room complete
    if (enemies.length === 0 && !game.bossActive && !game.roomCleared) {
        // Room complete - open doors for exploration
        game.roomCleared = true;
        game.screenFlash = 0.3;
        game.screenFlashColor = '#50ff80';
        game.waveAnnounce = 'ROOM CLEARED!';
        game.waveAnnounceTimer = 1.5;

        // Victory particle burst from center
        for (let ring = 0; ring < 2; ring++) {
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                particles.push({
                    x: canvas.width / 2,
                    y: canvas.height / 2,
                    vx: Math.cos(angle) * (200 + ring * 100),
                    vy: Math.sin(angle) * (200 + ring * 100),
                    life: 1,
                    decay: 1.5,
                    size: 6 - ring * 2,
                    color: ring === 0 ? '#50ff80' : '#80ffb0'
                });
            }
        }

        // Open doors when room is cleared
        openRoomDoors();

        if (game.wave >= game.maxWave) {
            // Final room leads to boss
            game.waveAnnounce = 'BOSS DOOR OPENED!';
        }
    }
}

// Room-based exploration functions
function openRoomDoors() {
    game.doors = [];

    // Determine which doors to open based on room position
    const canGoNorth = game.roomGrid.y > 0 || Math.random() > 0.3;
    const canGoSouth = game.roomGrid.y < 3 || Math.random() > 0.3;
    const canGoEast = game.roomGrid.x < 3 || Math.random() > 0.3;
    const canGoWest = game.roomGrid.x > 0 || Math.random() > 0.3;

    // At least 2 doors in early rooms, 1 door for final room
    const doorCount = game.wave >= game.maxWave ? 1 : Math.max(2, Math.floor(Math.random() * 3) + 1);
    const possibleDoors = [];

    if (canGoNorth) possibleDoors.push({ dir: 'north', x: canvas.width / 2, y: 30, dx: 0, dy: -1 });
    if (canGoSouth) possibleDoors.push({ dir: 'south', x: canvas.width / 2, y: canvas.height - 30, dx: 0, dy: 1 });
    if (canGoEast) possibleDoors.push({ dir: 'east', x: canvas.width - 30, y: canvas.height / 2, dx: 1, dy: 0 });
    if (canGoWest) possibleDoors.push({ dir: 'west', x: 30, y: canvas.height / 2, dx: -1, dy: 0 });

    // Shuffle and pick doors
    possibleDoors.sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(doorCount, possibleDoors.length); i++) {
        game.doors.push(possibleDoors[i]);
    }

    // Ensure at least one exit (for progression)
    if (game.doors.length === 0 && possibleDoors.length > 0) {
        game.doors.push(possibleDoors[0]);
    }
}

function checkDoorTransition() {
    if (!game.roomCleared || game.transitioning) return;

    for (const door of game.doors) {
        const doorDist = Math.sqrt((player.x - door.x) ** 2 + (player.y - door.y) ** 2);
        if (doorDist < 60) {
            transitionToNextRoom(door);
            return;
        }
    }
}

function transitionToNextRoom(door) {
    game.transitioning = true;
    game.roomCleared = false;

    // Move to next room in grid
    game.roomGrid.x += door.dx;
    game.roomGrid.y += door.dy;
    game.visitedRooms.add(`${game.roomGrid.x},${game.roomGrid.y}`);

    // Flash screen
    game.screenFlash = 0.5;
    game.screenFlashColor = '#000000';

    // Clear bullets
    playerBullets = [];
    enemyBullets = [];
    game.doors = [];

    // Position player at opposite side
    if (door.dir === 'north') {
        player.y = canvas.height - 80;
        player.x = canvas.width / 2;
    } else if (door.dir === 'south') {
        player.y = 80;
        player.x = canvas.width / 2;
    } else if (door.dir === 'east') {
        player.x = 80;
        player.y = canvas.height / 2;
    } else if (door.dir === 'west') {
        player.x = canvas.width - 80;
        player.y = canvas.height / 2;
    }

    // Increment room counter
    game.wave++;

    // Spawn new enemies after transition
    setTimeout(() => {
        game.transitioning = false;
        if (game.state === 'playing') {
            if (game.wave > game.maxWave) {
                spawnBoss();
            } else {
                announceRoom();
                spawnEnemies();
            }
        }
    }, 500);
}

function announceRoom() {
    const roomNames = ['', 'Entrance', 'Forest Path', 'Clearing', 'Dense Woods', 'Ancient Grove',
                       'Hidden Path', 'Crystal Cave', 'Dark Hollow', 'Boss Approach', 'Final Chamber'];
    game.waveAnnounce = `Room ${game.wave}: ${roomNames[game.wave] || 'Unknown'}`;
    game.waveAnnounceTimer = 2;

    if (game.wave === game.maxWave) {
        game.waveAnnounce = 'FINAL ROOM - BOSS AHEAD!';
        game.screenFlash = 0.2;
        game.screenFlashColor = '#ff8000';
    }
}

function drawDoors() {
    if (!game.roomCleared) return;

    for (const door of game.doors) {
        ctx.save();
        ctx.translate(door.x, door.y);

        // Door glow
        const pulse = Math.sin(game.time * 4) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(80, 255, 128, ${pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI * 2);
        ctx.fill();

        // Door frame
        ctx.fillStyle = '#3a5a4a';
        if (door.dir === 'north' || door.dir === 'south') {
            ctx.fillRect(-40, -15, 80, 30);
        } else {
            ctx.fillRect(-15, -40, 30, 80);
        }

        // Door opening
        ctx.fillStyle = '#1a2a35';
        if (door.dir === 'north' || door.dir === 'south') {
            ctx.fillRect(-30, -10, 60, 20);
        } else {
            ctx.fillRect(-10, -30, 20, 60);
        }

        // Arrow indicator
        ctx.fillStyle = '#50ff80';
        ctx.beginPath();
        if (door.dir === 'north') {
            ctx.moveTo(0, -25);
            ctx.lineTo(10, -10);
            ctx.lineTo(-10, -10);
        } else if (door.dir === 'south') {
            ctx.moveTo(0, 25);
            ctx.lineTo(10, 10);
            ctx.lineTo(-10, 10);
        } else if (door.dir === 'east') {
            ctx.moveTo(25, 0);
            ctx.lineTo(10, 10);
            ctx.lineTo(10, -10);
        } else {
            ctx.moveTo(-25, 0);
            ctx.lineTo(-10, 10);
            ctx.lineTo(-10, -10);
        }
        ctx.fill();

        ctx.restore();
    }
}

// Wave announcement function
function announceWave() {
    const waveNames = ['', 'Wave 1', 'Wave 2', 'Wave 3', 'Wave 4', 'Wave 5',
                       'Wave 6', 'Wave 7', 'Wave 8', 'Wave 9', 'FINAL WAVE'];
    game.waveAnnounce = waveNames[game.wave] || 'Wave ' + game.wave;
    game.waveAnnounceTimer = 2.5;

    // Special announcements
    if (game.wave === 5) game.waveAnnounce = 'Wave 5 - ELITES INCOMING!';
    if (game.wave === 10) {
        game.waveAnnounce = 'FINAL WAVE - BOSS APPROACHES!';
        game.screenFlash = 0.3;
        game.screenFlashColor = '#ff8000';
    }

    // ITERATION 79: Wave start fanfare particles
    const particleCount = 15 + game.wave * 3;
    for (let i = 0; i < particleCount; i++) {
        const side = i % 2 === 0 ? 0 : canvas.width;
        particles.push({
            x: side,
            y: canvas.height / 2 + (Math.random() - 0.5) * 100,
            vx: (side === 0 ? 1 : -1) * (200 + Math.random() * 200),
            vy: (Math.random() - 0.5) * 150,
            life: 1 + Math.random() * 0.5,
            decay: 0.6,
            size: 3 + Math.random() * 4,
            color: ['#ff8000', '#ffcc00', '#ffffff'][Math.floor(Math.random() * 3)]
        });
    }

    // Light screen flash for wave starts
    if (game.wave > 1) {
        game.screenFlash = Math.max(game.screenFlash, 0.2);
        game.screenFlashColor = '#ffcc00';
        game.screenShake = Math.max(game.screenShake, 0.15);
    }
}

// Draw wave announcement
function drawWaveAnnouncement() {
    if (game.waveAnnounceTimer <= 0) return;

    ctx.save();

    // Fade in/out
    let alpha = 1;
    if (game.waveAnnounceTimer > 2) alpha = (2.5 - game.waveAnnounceTimer) * 2;
    if (game.waveAnnounceTimer < 0.5) alpha = game.waveAnnounceTimer * 2;
    ctx.globalAlpha = alpha;

    // Scale animation
    const scale = 1 + Math.sin((2.5 - game.waveAnnounceTimer) * 3) * 0.1;

    // Background bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);

    // Glow effect
    ctx.shadowColor = '#ff8000';
    ctx.shadowBlur = 20;

    // Text
    ctx.font = 'bold ' + Math.floor(36 * scale) + 'px Arial';
    ctx.fillStyle = '#ff8000';
    ctx.textAlign = 'center';
    ctx.fillText(game.waveAnnounce, canvas.width / 2, canvas.height / 2 + 12);

    ctx.restore();
}

function defeatBoss() {
    // EXPAND 20: Victory!
    game.bossActive = false;

    // Massive death explosion
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: boss.x,
            y: boss.y,
            vx: (Math.random() - 0.5) * 400,
            vy: (Math.random() - 0.5) * 400,
            life: 1.5,
            decay: 1,
            size: 8,
            color: ['#40ff40', '#80ff80', '#ffff00', '#ffffff'][i % 4]
        });
    }

    // Drop lots of crystals
    for (let i = 0; i < 20; i++) {
        crystals.push({
            x: boss.x + (Math.random() - 0.5) * 100,
            y: boss.y + (Math.random() - 0.5) * 100,
            value: 10,
            magnetRange: 100
        });
    }

    game.screenShake = 0.5;
    game.screenFlash = 0.5;
    game.screenFlashColor = '#ffffff';

    boss = null;

    // Victory after a delay
    setTimeout(() => {
        if (game.state === 'playing') {
            // ITERATION 80: Victory celebration
            game.state = 'victory';
            game.victoryTimer = 0;

            // Big celebration screen flash
            game.screenFlash = 0.8;
            game.screenFlashColor = '#ffffff';
            game.screenShake = 0.3;

            // Firework burst from center
            for (let i = 0; i < 80; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 150 + Math.random() * 350;
                particles.push({
                    x: canvas.width / 2,
                    y: canvas.height / 2,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1.5 + Math.random(),
                    decay: 0.5,
                    size: 4 + Math.random() * 6,
                    color: ['#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#ffffff', '#00ff00'][Math.floor(Math.random() * 6)]
                });
            }

            // Victory rings
            for (let i = 0; i < 5; i++) {
                particles.push({
                    type: 'ring',
                    x: canvas.width / 2,
                    y: canvas.height / 2,
                    size: 30 + i * 40,
                    maxSize: 300 + i * 100,
                    life: 1.5,
                    decay: 0.4,
                    color: ['#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#50ff80'][i]
                });
            }

            // Spawn confetti particles continuously
            game.victoryConfetti = setInterval(() => {
                if (game.state !== 'victory') {
                    clearInterval(game.victoryConfetti);
                    return;
                }
                for (let i = 0; i < 5; i++) {
                    particles.push({
                        x: Math.random() * canvas.width,
                        y: -10,
                        vx: (Math.random() - 0.5) * 100,
                        vy: 80 + Math.random() * 80,
                        life: 3,
                        decay: 0.3,
                        size: 4 + Math.random() * 4,
                        color: ['#ffff00', '#ff00ff', '#00ffff', '#ff0000', '#00ff00', '#ffffff'][Math.floor(Math.random() * 6)]
                    });
                }
            }, 100);
        }
    }, 2000);
}

function updateCrystals(dt) {
    for (let i = crystals.length - 1; i >= 0; i--) {
        const c = crystals[i];
        const dx = player.x - c.x;
        const dy = player.y - c.y;
        const dist = Math.hypot(dx, dy);

        // Magnet effect
        if (dist < c.magnetRange) {
            const pull = (c.magnetRange - dist) / c.magnetRange * 400;
            c.x += (dx / dist) * pull * dt;
            c.y += (dy / dist) * pull * dt;
        }

        // Collect
        if (dist < 20) {
            game.crystals += c.value;
            game.xp += c.value;

            // ITERATION 55: Enhanced crystal collection feedback
            // Show floating value number
            damageNumbers.push({
                x: player.x,
                y: player.y - 15,
                text: '+' + c.value,
                color: COLORS.crystal,
                life: 0.8,
                vy: -60,
                scale: 1.2
            });

            // Burst of particles outward from collection point
            const particleCount = 8 + Math.floor(c.value / 2);
            for (let k = 0; k < particleCount; k++) {
                const angle = (k / particleCount) * Math.PI * 2;
                const speed = 80 + Math.random() * 60;
                particles.push({
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 0.6,
                    decay: 1.2,
                    size: 4 + Math.random() * 2,
                    color: k % 2 === 0 ? COLORS.crystal : '#ff80a0'
                });
            }

            // Inner bright sparkle burst
            for (let k = 0; k < 6; k++) {
                particles.push({
                    x: player.x,
                    y: player.y,
                    vx: (Math.random() - 0.5) * 120,
                    vy: (Math.random() - 0.5) * 120,
                    life: 0.4,
                    decay: 1,
                    size: 2,
                    color: '#ffffff'
                });
            }

            // Expanding ring effect
            particles.push({
                x: player.x,
                y: player.y,
                vx: 0,
                vy: 0,
                life: 0.3,
                decay: 1,
                size: 5,
                color: COLORS.crystal,
                ring: true,
                ringRadius: 10,
                ringExpand: 150
            });

            // Level up check
            while (game.xp >= game.xpToLevel) {
                game.xp -= game.xpToLevel;
                game.level++;
                game.xpToLevel = Math.floor(game.xpToLevel * 1.15);
                player.damage += 0.15;

                // EXPAND 8: Every 3 levels, extra bullet
                if (game.level % 3 === 0 && player.bulletCount < 5) {
                    player.bulletCount++;
                }

                // EXPAND 11: Every 5 levels, more crit
                if (game.level % 5 === 0) {
                    player.critChance += 0.05;
                }

                // POLISH 8: Level up celebration
                game.screenFlash = 0.5;
                game.screenFlashColor = '#50ff80';
                game.screenShake = 0.2;

                // Level up announcement
                game.waveAnnounce = 'LEVEL UP! ' + game.level;
                game.waveAnnounceTimer = 2;

                // Multi-ring particle burst
                for (let ring = 0; ring < 3; ring++) {
                    const ringSize = 20 + ring * 10;
                    for (let k = 0; k < ringSize; k++) {
                        const angle = (k / ringSize) * Math.PI * 2 + ring * 0.3;
                        const speed = 150 + ring * 80;
                        particles.push({
                            x: player.x,
                            y: player.y,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            life: 1.2 - ring * 0.2,
                            decay: 1.2,
                            size: 6 - ring,
                            color: ring === 0 ? '#ffffff' : (ring === 1 ? '#80ffb0' : '#50ff80')
                        });
                    }
                }

                // Sparkle particles around player
                for (let s = 0; s < 15; s++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 20 + Math.random() * 40;
                    particles.push({
                        x: player.x + Math.cos(angle) * dist,
                        y: player.y + Math.sin(angle) * dist,
                        vx: (Math.random() - 0.5) * 50,
                        vy: -50 - Math.random() * 100,
                        life: 1.5,
                        decay: 1,
                        size: 4,
                        color: '#ffff80'
                    });
                }
            }

            crystals.splice(i, 1);
        }
    }
}

// EXPAND 5-6: Update pickups
function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        const dist = Math.hypot(dx, dy);

        // Collect
        if (dist < 25) {
            if (p.type === 'health' && player.health < player.maxHealth) {
                player.health++;
                // Health pickup effect
                for (let k = 0; k < 10; k++) {
                    particles.push({
                        x: player.x,
                        y: player.y,
                        vx: (Math.random() - 0.5) * 60,
                        vy: (Math.random() - 0.5) * 60,
                        life: 0.8,
                        decay: 1,
                        size: 4,
                        color: COLORS.healthFull
                    });
                }
                pickups.splice(i, 1);
            } else if (p.type === 'energy' && player.energy < player.maxEnergy) {
                player.energy = Math.min(player.maxEnergy, player.energy + 2);
                // Energy pickup effect
                for (let k = 0; k < 10; k++) {
                    particles.push({
                        x: player.x,
                        y: player.y,
                        vx: (Math.random() - 0.5) * 60,
                        vy: (Math.random() - 0.5) * 60,
                        life: 0.8,
                        decay: 1,
                        size: 4,
                        color: COLORS.energyFull
                    });
                }
                pickups.splice(i, 1);
            }
        }
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= p.decay * dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// POLISH 1: Update muzzle flashes
function updateMuzzleFlashes(dt) {
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
        muzzleFlashes[i].life -= dt * 10;
        if (muzzleFlashes[i].life <= 0) {
            muzzleFlashes.splice(i, 1);
        }
    }
}

// POLISH 3: Update damage numbers
function updateDamageNumbers(dt) {
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const dn = damageNumbers[i];
        dn.y += dn.vy * dt;
        dn.vy *= 0.95;
        dn.life -= dt;

        if (dn.life <= 0) {
            damageNumbers.splice(i, 1);
        }
    }
}

// EXPAND 13: Update spawn warnings
function updateSpawnWarnings(dt) {
    for (let i = spawnWarnings.length - 1; i >= 0; i--) {
        spawnWarnings[i].timer -= dt;
        if (spawnWarnings[i].timer <= 0) {
            spawnWarnings.splice(i, 1);
        }
    }
}

// EXPAND 15: Update combo
function updateCombo(dt) {
    if (game.comboTimer > 0) {
        game.comboTimer -= dt;
        if (game.comboTimer <= 0) {
            game.combo = 0;
            game.comboMultiplier = 1;
            // ITERATION 59: Reset kill streak
            game.killStreak = 0;
            game.lastAnnouncedStreak = 0;
        }
    }
}

// EXPAND 17: Update slow motion
function updateSlowMotion(dt) {
    if (game.slowMotionTimer > 0) {
        game.slowMotionTimer -= dt;
        if (game.slowMotionTimer <= 0) {
            game.slowMotion = 1;
        }
    }
}

// Main game loop
let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    // Track FPS
    if (timestamp - game.lastFrameTime >= 1000) {
        game.lastFrameTime = timestamp;
    }
    game.fps = dt > 0 ? 1 / dt : 60;

    game.time += dt;

    // Screen flash decay
    if (game.screenFlash > 0) {
        game.screenFlash -= dt * 3;
    }

    // ITERATION 71: Ambient particles
    if (game.state === 'playing' && Math.random() < 0.15) {
        particles.push({
            x: 100 + Math.random() * 1080,
            y: 100 + Math.random() * 520,
            vx: (Math.random() - 0.5) * 20,
            vy: -15 - Math.random() * 15,
            life: 2 + Math.random() * 2,
            decay: 0.3,
            size: 1 + Math.random() * 2,
            color: ['#50ff80', '#80ffb0', '#a0ffd0', '#ffffff'][Math.floor(Math.random() * 4)]
        });
    }

    // Update
    if (game.state === 'playing') {
        updatePlayer(dt);
        checkDoorTransition();
        updateEnemies(dt);
        updateBoss(dt);
        updateBullets(dt);
        updateCrystals(dt);
        updatePickups(dt);
        updateParticles(dt);
        updateMuzzleFlashes(dt);
        updateDamageNumbers(dt);
        updateSpawnWarnings(dt);
        updateCombo(dt);
        updateSlowMotion(dt);

        // Wave announcement timer
        if (game.waveAnnounceTimer > 0) {
            game.waveAnnounceTimer -= dt;
        }

        if (game.screenShake > 0) {
            game.screenShake -= dt;
        }
    }

    // Draw
    ctx.save();

    // Screen shake
    if (game.screenShake > 0) {
        const shake = game.screenShake * 10;
        ctx.translate(
            (Math.random() - 0.5) * shake,
            (Math.random() - 0.5) * shake
        );
    }

    drawBackground();
    drawDoors();

    // ITERATION 77: Draw boundary warning
    drawBoundaryWarning();

    // Draw spawn warnings
    spawnWarnings.forEach(drawSpawnWarning);

    // Draw trees (back layer)
    trees.filter(t => t.y < player.y).forEach(drawTree);

    // Draw pickups
    pickups.forEach(drawPickup);

    // Draw crystals
    crystals.forEach(drawCrystal);

    // Draw player
    drawPlayer();

    // ITERATION 76: Draw crosshair
    drawCrosshair();

    // Draw enemies
    enemies.forEach(drawEnemy);

    // Draw boss
    drawBoss();

    // Draw trees (front layer)
    trees.filter(t => t.y >= player.y).forEach(drawTree);

    // Draw bullets
    playerBullets.forEach(b => drawBullet(b, false));
    enemyBullets.forEach(b => drawBullet(b, true));

    // Draw muzzle flashes
    muzzleFlashes.forEach(drawMuzzleFlash);

    // Draw particles
    particles.forEach(drawParticle);

    // Draw damage numbers
    damageNumbers.forEach(drawDamageNumber);

    ctx.restore();

    // Screen flash effect
    if (game.screenFlash > 0) {
        ctx.save();
        ctx.globalAlpha = game.screenFlash * 0.5;
        ctx.fillStyle = game.screenFlashColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    // ITERATION 66: Enhanced time slow visual effect
    if (game.slowMotion < 1) {
        ctx.save();

        // Radial vignette in blue
        const vignette = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 100, canvas.width/2, canvas.height/2, canvas.width*0.7);
        vignette.addColorStop(0, 'rgba(64, 64, 200, 0)');
        vignette.addColorStop(1, 'rgba(40, 40, 150, 0.3)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Pulsing border
        const pulse = 1 + Math.sin(game.time * 8) * 0.3;
        ctx.strokeStyle = `rgba(128, 128, 255, ${0.3 + pulse * 0.2})`;
        ctx.lineWidth = 4 + pulse * 2;
        ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

        // Timer indicator
        const timerRatio = game.slowMotionTimer / 3;
        ctx.fillStyle = 'rgba(128, 128, 255, 0.3)';
        ctx.fillRect(canvas.width/2 - 100, canvas.height - 30, 200, 10);
        ctx.fillStyle = '#8080ff';
        ctx.fillRect(canvas.width/2 - 100, canvas.height - 30, 200 * timerRatio, 10);

        // "TIME STOP" text
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#a0a0ff';
        ctx.textAlign = 'center';
        ctx.fillText('TIME STOP', canvas.width/2, canvas.height - 40);

        ctx.restore();
    }

    // Draw HUD (no shake)
    drawHUD();

    // Draw wave announcement
    drawWaveAnnouncement();

    // Draw debug overlay
    drawDebugOverlay();

    // ITERATION 63: Title screen
    if (game.state === 'title') {
        ctx.fillStyle = 'rgba(0, 20, 40, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Animated title
        const titlePulse = 1 + Math.sin(game.time * 3) * 0.05;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2 - 100);
        ctx.scale(titlePulse, titlePulse);

        ctx.font = 'bold 56px Arial';
        ctx.shadowColor = '#50c8ff';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#50c8ff';
        ctx.textAlign = 'center';
        ctx.fillText('MINISHOOT', 0, 0);

        ctx.font = 'bold 36px Arial';
        ctx.shadowColor = '#ff4060';
        ctx.fillStyle = '#ff4060';
        ctx.fillText('ADVENTURES', 0, 45);
        ctx.restore();

        // Animated ship icon
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2 + 30);
        ctx.rotate(Math.sin(game.time * 2) * 0.1);

        // Draw a small ship icon
        ctx.fillStyle = '#50c8ff';
        ctx.shadowColor = '#50c8ff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-15, -12);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-15, 12);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Blinking prompt
        if (Math.floor(game.time * 2) % 2 === 0) {
            ctx.font = '24px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('Press SPACE to start', canvas.width / 2, canvas.height / 2 + 120);
        }

        // Controls hint
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText('WASD - Move  |  MOUSE - Aim & Shoot  |  RIGHT-CLICK - Supershot  |  SPACE - Dash', canvas.width / 2, canvas.height - 50);
    }

    // ITERATION 64: Enhanced Game over screen
    if (game.state === 'gameover') {
        ctx.fillStyle = 'rgba(40, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Vignette effect
        const vignette = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 100, canvas.width/2, canvas.height/2, canvas.width*0.7);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const shake = Math.sin(game.time * 5) * 2;
        ctx.save();
        ctx.translate(shake, 0);

        ctx.font = 'bold 56px Arial';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ff4060';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);

        ctx.shadowBlur = 0;
        ctx.font = '20px Arial';
        ctx.fillStyle = '#ff8080';
        ctx.fillText(`Room ${game.wave}  •  Level ${game.level}  •  ${game.crystals} Crystals`, canvas.width / 2, canvas.height / 2 + 10);

        ctx.restore();

        if (Math.floor(game.time * 2) % 2 === 0) {
            ctx.font = '22px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('Press SPACE to try again', canvas.width / 2, canvas.height / 2 + 80);
        }
    }

    // ITERATION 64: Enhanced Victory screen
    if (game.state === 'victory') {
        ctx.fillStyle = 'rgba(0, 30, 20, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Celebratory particles
        if (Math.random() < 0.3) {
            particles.push({
                x: Math.random() * canvas.width,
                y: canvas.height + 10,
                vx: (Math.random() - 0.5) * 50,
                vy: -150 - Math.random() * 100,
                life: 2,
                decay: 0.5,
                size: 4 + Math.random() * 3,
                color: ['#50ff80', '#ffff50', '#50c8ff', '#ff80ff'][Math.floor(Math.random() * 4)]
            });
        }

        const pulse = 1 + Math.sin(game.time * 4) * 0.05;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2 - 60);
        ctx.scale(pulse, pulse);

        ctx.font = 'bold 64px Arial';
        ctx.shadowColor = '#50ff80';
        ctx.shadowBlur = 40;
        ctx.fillStyle = '#50ff80';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', 0, 0);
        ctx.restore();

        ctx.shadowBlur = 0;
        ctx.font = '24px Arial';
        ctx.fillStyle = '#80ffb0';
        ctx.fillText('Forest Guardian Defeated!', canvas.width / 2, canvas.height / 2 + 10);

        ctx.font = '18px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Final Stats:  Level ${game.level}  •  ${game.crystals} Crystals Collected`, canvas.width / 2, canvas.height / 2 + 50);

        if (Math.floor(game.time * 2) % 2 === 0) {
            ctx.font = '22px Arial';
            ctx.fillText('Press SPACE to play again', canvas.width / 2, canvas.height / 2 + 100);
        }
    }

    requestAnimationFrame(gameLoop);
}

// Input handlers
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    // Toggle debug mode with Q
    if (e.key.toLowerCase() === 'q') {
        game.debugMode = !game.debugMode;
    }

    // Handle dash on keydown for responsive feel
    if ((e.key === ' ' || e.code === 'Space') && game.state === 'playing') {
        if (player.dashCooldown <= 0 && player.hasDash) {
            dash();
        }
    }

    // ITERATION 63: Start game from title
    if (e.key === ' ' && game.state === 'title') {
        game.state = 'playing';
        announceWave();
        spawnEnemies();
    }

    if (e.key === ' ' && (game.state === 'gameover' || game.state === 'victory')) {
        resetGame();
    }

    // Prevent default for game keys
    if (['w', 'a', 's', 'd', ' ', 'q', 'shift'].includes(e.key.toLowerCase())) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) mouse.down = true;
    if (e.button === 2) mouse.rightDown = true;
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rightDown = false;
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function resetGame() {
    game.state = 'playing';
    game.crystals = 0;
    game.level = 1;
    game.xp = 0;
    game.xpToLevel = 15;
    game.wave = 1;
    game.screenShake = 0;
    game.screenFlash = 0;
    game.combo = 0;
    game.comboTimer = 0;
    game.comboMultiplier = 1;
    game.killStreak = 0;
    game.lastAnnouncedStreak = 0;
    game.bossActive = false;
    game.slowMotion = 1;
    game.slowMotionTimer = 0;

    player.x = 400;
    player.y = 300;
    player.health = player.maxHealth;
    player.energy = player.maxEnergy;
    player.damage = 1;
    player.invincible = 0;
    player.bulletCount = 1;
    player.critChance = 0.1;
    player.trail = [];

    playerBullets = [];
    enemyBullets = [];
    crystals = [];
    particles = [];
    pickups = [];
    damageNumbers = [];
    muzzleFlashes = [];
    spawnWarnings = [];
    boss = null;

    spawnEnemies();
}

// Initialize
generateWorld();
// ITERATION 63: Don't spawn enemies until title screen is passed
requestAnimationFrame(gameLoop);

// Expose for testing
window.gameState = game;
window.player = player;
window.enemies = enemies;
