// FTL Clone - Phaser Version (Expanded)

// Colors
const COLORS = {
    uiDark: 0x1a1a2e,
    uiBorder: 0x3a3a5c,
    uiPanel: 0x252540,
    textWhite: 0xffffff,
    textGreen: 0x00ff00,
    textRed: 0xff4444,
    textBlue: 0x4488ff,
    textOrange: 0xffaa00,
    textYellow: 0xffff00,
    shields: 0x00ccff,
    weapons: 0xff6600,
    engines: 0xffff00,
    oxygen: 0x88ff88,
    medbay: 0x00ff00,
    human: 0xffcc88,
    mantis: 0x88ff44,
    engi: 0x44aaff,
    rockman: 0xaa6633,
    zoltan: 0xffff88,
    shipHull: 0x888888,
    roomFloor: 0x4a4a5a,
    roomWall: 0x2a2a3a,
    fire: 0xff6600,
    breach: 0x8844ff
};

// Crew Races with unique abilities
const CREW_RACES = {
    human: { color: COLORS.human, health: 100, speed: 1, combat: 1, repair: 1, name: 'Human' },
    mantis: { color: COLORS.mantis, health: 100, speed: 1.2, combat: 1.5, repair: 0.5, name: 'Mantis' },
    engi: { color: COLORS.engi, health: 100, speed: 0.8, combat: 0.5, repair: 2, name: 'Engi' },
    rockman: { color: COLORS.rockman, health: 150, speed: 0.5, combat: 1, repair: 1, fireImmune: true, name: 'Rockman' },
    zoltan: { color: COLORS.zoltan, health: 70, speed: 1, combat: 0.7, repair: 1, power: true, name: 'Zoltan' }
};

// Enemy Templates
const ENEMY_TEMPLATES = {
    fighter: { name: 'Rebel Fighter', hull: 10, maxHull: 10, shields: { layers: 1, maxLayers: 1 }, weapons: [{ name: 'Basic Laser', chargeTime: 10, shots: 1, damage: 1 }], evasion: 15, scrap: 25, missiles: 2, fuel: 2 },
    scout: { name: 'Pirate Scout', hull: 8, maxHull: 8, shields: { layers: 0, maxLayers: 0 }, weapons: [{ name: 'Burst Laser', chargeTime: 8, shots: 2, damage: 1 }], evasion: 25, scrap: 20, missiles: 3, fuel: 1 },
    cruiser: { name: 'Rebel Cruiser', hull: 18, maxHull: 18, shields: { layers: 2, maxLayers: 2 }, weapons: [{ name: 'Heavy Laser', chargeTime: 14, shots: 2, damage: 2 }, { name: 'Missile', chargeTime: 12, shots: 1, damage: 3 }], evasion: 10, scrap: 40, missiles: 4, fuel: 3 },
    drone: { name: 'Auto-Drone', hull: 6, maxHull: 6, shields: { layers: 0, maxLayers: 0 }, weapons: [{ name: 'Drone Laser', chargeTime: 6, shots: 1, damage: 1 }], evasion: 5, scrap: 15, missiles: 0, fuel: 1 }
};

// Weapon Types
const WEAPON_TYPES = {
    laser: { color: 0xff4444, ignoresShields: false, usesAmmo: false },
    missile: { color: 0xffaa00, ignoresShields: true, usesAmmo: true },
    ion: { color: 0x44aaff, ignoresShields: false, usesAmmo: false, ionDamage: true }
};

// Game State
let gameState = {
    state: 'title',
    paused: true,
    scrap: 50,
    fuel: 10,
    missiles: 8,
    sector: 1,
    beacon: 1,
    maxBeacons: 8
};

// Player Ship
let playerShip = {
    hull: 30,
    maxHull: 30,
    rooms: [],
    systems: {
        shields: { level: 2, power: 2, maxPower: 2, damage: 0, layers: 1, maxLayers: 1, rechargeTime: 0 },
        weapons: { level: 2, power: 2, maxPower: 2, damage: 0 },
        engines: { level: 2, power: 1, maxPower: 2, damage: 0, evasion: 10 },
        oxygen: { level: 1, power: 1, maxPower: 1, damage: 0 },
        medbay: { level: 1, power: 0, maxPower: 1, damage: 0 },
        doors: { level: 1, power: 0, maxPower: 1, damage: 0 },
        sensors: { level: 1, power: 0, maxPower: 1, damage: 0 },
        piloting: { level: 1, power: 0, maxPower: 1, damage: 0 }
    },
    reactor: { current: 6, max: 10 },
    weapons: [
        { name: 'Burst Laser II', type: 'laser', power: 2, chargeTime: 12, charge: 0, shots: 3, damage: 1, powered: true },
        { name: 'Artemis Missile', type: 'missile', power: 1, chargeTime: 10, charge: 0, shots: 1, damage: 2, powered: false },
        { name: 'Ion Blast', type: 'ion', power: 1, chargeTime: 8, charge: 0, shots: 1, damage: 1, powered: false }
    ],
    crew: []
};

// Enemy Ship
let enemyShip = null;

// Visual effects
let projectiles = [];
let particles = [];
let floatingTexts = [];
let screenShake = 0;
let screenFlash = null;

// Crew class
class CrewMember {
    constructor(name, race, x, y) {
        this.name = name;
        this.race = race;
        this.raceData = CREW_RACES[race];
        this.health = this.raceData.health;
        this.maxHealth = this.raceData.health;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.selected = false;
        this.room = null;
        this.task = null;
    }
}

let graphics;
let scene;
let selectedCrew = null;
let targetingMode = false;
let targetingWeapon = null;
let combatLog = [];
let currentEvent = null;

// =====================
// BOOT SCENE
// =====================
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }
    create() { this.scene.start('GameScene'); }
}

// =====================
// GAME SCENE
// =====================
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        scene = this;
        graphics = this.add.graphics();

        initShips();
        spawnEnemy('fighter');

        this.input.on('pointerdown', handleClick);
        this.input.on('pointermove', (p) => { this.mouseX = p.x; this.mouseY = p.y; });
        this.input.keyboard.on('keydown-SPACE', () => {
            if (gameState.state === 'title') {
                gameState.state = 'combat';
                gameState.paused = false;
            } else {
                gameState.paused = !gameState.paused;
            }
        });
        this.input.keyboard.on('keydown-ESC', () => {
            targetingMode = false;
            targetingWeapon = null;
            selectedCrew = null;
            playerShip.crew.forEach(c => c.selected = false);
        });

        this.mouseX = 640;
        this.mouseY = 360;
    }

    update(time, delta) {
        graphics.clear();

        // Apply screen shake
        if (screenShake > 0) {
            this.cameras.main.setScroll(
                (Math.random() - 0.5) * screenShake * 2,
                (Math.random() - 0.5) * screenShake * 2
            );
            screenShake -= delta / 16;
        } else {
            this.cameras.main.setScroll(0, 0);
        }

        if (gameState.state === 'title') {
            drawTitleScreen();
            return;
        }

        if (!gameState.paused && gameState.state === 'combat') {
            updateGame(delta);
        }

        drawStarfield(time);
        drawPlayerShip(time);
        if (enemyShip) drawEnemyShip();
        drawProjectiles(delta);
        drawParticles(delta);
        drawFloatingTexts(delta);
        drawTopBar();
        drawSystemPanel();
        drawWeaponBar();
        if (enemyShip) drawTargetPanel();
        drawCombatLog();

        // Screen flash overlay
        if (screenFlash) {
            graphics.fillStyle(screenFlash.color, screenFlash.alpha);
            graphics.fillRect(0, 0, 1280, 720);
            screenFlash.alpha -= 0.02;
            if (screenFlash.alpha <= 0) screenFlash = null;
        }

        if (gameState.paused && gameState.state === 'combat') drawPauseOverlay();
        if (targetingMode) drawTargetingCursor();
        if (currentEvent) drawEventPopup();
        if (gameState.state === 'gameover') drawGameOver();
        if (gameState.state === 'victory') drawVictory();
    }
}

function initShips() {
    const roomSize = 50;
    playerShip.rooms = [
        { name: 'Engines', system: 'engines', x: 70, y: 300, w: roomSize, h: roomSize, letter: 'E', fire: 0, breach: false },
        { name: 'Shields', system: 'shields', x: 120, y: 250, w: roomSize, h: roomSize * 2, letter: 'S', fire: 0, breach: false },
        { name: 'Oxygen', system: 'oxygen', x: 220, y: 250, w: roomSize, h: roomSize, letter: 'O', fire: 0, breach: false },
        { name: 'Doors', system: 'doors', x: 270, y: 250, w: roomSize, h: roomSize, letter: 'D', fire: 0, breach: false },
        { name: 'Weapons', system: 'weapons', x: 170, y: 300, w: roomSize, h: roomSize, letter: 'W', fire: 0, breach: false },
        { name: 'Sensors', system: 'sensors', x: 270, y: 300, w: roomSize, h: roomSize, letter: 'S', fire: 0, breach: false },
        { name: 'Medbay', system: 'medbay', x: 170, y: 350, w: roomSize, h: roomSize, letter: 'M', fire: 0, breach: false },
        { name: 'Cockpit', system: 'piloting', x: 320, y: 275, w: roomSize, h: roomSize, letter: 'P', fire: 0, breach: false }
    ];

    playerShip.crew = [
        new CrewMember('Captain', 'human', 330, 290),
        new CrewMember('Engineer', 'engi', 130, 280),
        new CrewMember('Gunner', 'mantis', 185, 320),
        new CrewMember('Pilot', 'zoltan', 80, 320)
    ];
    playerShip.crew[0].room = 'piloting';
    playerShip.crew[1].room = 'shields';
    playerShip.crew[2].room = 'weapons';
    playerShip.crew[3].room = 'engines';
}

function spawnEnemy(template) {
    const t = ENEMY_TEMPLATES[template];
    enemyShip = {
        name: t.name,
        hull: t.hull,
        maxHull: t.maxHull,
        shields: { layers: t.shields.layers, maxLayers: t.shields.maxLayers, rechargeTime: 0 },
        weapons: t.weapons.map(w => ({ ...w, charge: Math.random() * w.chargeTime * 0.5 })),
        evasion: t.evasion,
        scrap: t.scrap,
        missiles: t.missiles,
        fuel: t.fuel,
        rooms: [
            { name: 'Shields', x: 880, y: 120, w: 40, h: 60 },
            { name: 'Weapons', x: 920, y: 150, w: 60, h: 40 },
            { name: 'Cockpit', x: 980, y: 130, w: 40, h: 40 },
            { name: 'Engines', x: 850, y: 150, w: 40, h: 40 }
        ]
    };
}

function updateGame(delta) {
    const dt = delta / 1000;

    // Update crew positions
    for (const crew of playerShip.crew) {
        const dx = crew.targetX - crew.x;
        const dy = crew.targetY - crew.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 80 * crew.raceData.speed;
        if (dist > 2) {
            crew.x += (dx / dist) * speed * dt;
            crew.y += (dy / dist) * speed * dt;
        }

        // Crew in medbay heals
        if (crew.room === 'medbay' && playerShip.systems.medbay.power > 0) {
            crew.health = Math.min(crew.maxHealth, crew.health + 10 * dt);
        }

        // Crew repairs damaged systems
        const roomData = playerShip.rooms.find(r => r.system === crew.room);
        if (roomData && playerShip.systems[crew.room]) {
            const sys = playerShip.systems[crew.room];
            if (sys.damage > 0) {
                sys.damage = Math.max(0, sys.damage - 0.5 * crew.raceData.repair * dt);
            }
            // Fight fires
            if (roomData.fire > 0 && !crew.raceData.fireImmune) {
                roomData.fire = Math.max(0, roomData.fire - 0.3 * dt);
                crew.health -= 5 * dt;
            }
            // Repair breaches
            if (roomData.breach) {
                crew.health -= 3 * dt;
            }
        }
    }

    // Update fires
    for (const room of playerShip.rooms) {
        if (room.fire > 0) {
            room.fire += 0.1 * dt;
            if (room.fire > 1) room.fire = 1;
            // Damage system
            if (playerShip.systems[room.system]) {
                playerShip.systems[room.system].damage += 0.2 * dt;
            }
        }
    }

    // Update shield recharge
    const shields = playerShip.systems.shields;
    const effectivePower = Math.max(0, shields.power - Math.floor(shields.damage));
    shields.maxLayers = Math.floor(effectivePower / 2);
    if (effectivePower >= 2 && shields.layers < shields.maxLayers) {
        shields.rechargeTime += dt;
        if (shields.rechargeTime >= 2) {
            shields.layers++;
            shields.rechargeTime = 0;
        }
    }

    // Update enemy shields
    if (enemyShip && enemyShip.shields.layers < enemyShip.shields.maxLayers) {
        enemyShip.shields.rechargeTime += dt;
        if (enemyShip.shields.rechargeTime >= 2.5) {
            enemyShip.shields.layers++;
            enemyShip.shields.rechargeTime = 0;
        }
    }

    // Update weapon charges
    for (const weapon of playerShip.weapons) {
        const weaponPower = Math.max(0, playerShip.systems.weapons.power - Math.floor(playerShip.systems.weapons.damage));
        if (weapon.powered && weaponPower > 0 && weapon.charge < weapon.chargeTime) {
            weapon.charge += dt;
        }
    }

    // Enemy AI
    if (enemyShip) {
        for (const weapon of enemyShip.weapons) {
            weapon.charge += dt;
            if (weapon.charge >= weapon.chargeTime) {
                weapon.charge = 0;
                enemyFire(weapon);
            }
        }
    }

    // Update projectiles
    projectiles = projectiles.filter(p => {
        p.x += p.vx * dt * 200;
        p.y += p.vy * dt * 200;
        p.trail.push({ x: p.x, y: p.y, alpha: 1 });
        if (p.trail.length > 10) p.trail.shift();

        // Check if reached target
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
            p.onHit();
            addParticles(p.x, p.y, p.color, 8);
            return false;
        }
        return true;
    });

    // Update combat log
    combatLog = combatLog.filter(log => { log.time -= dt; return log.time > 0; });
}

function handleClick(pointer) {
    const x = pointer.x, y = pointer.y;

    if (gameState.state === 'title') {
        gameState.state = 'combat';
        gameState.paused = false;
        return;
    }

    if (currentEvent) {
        handleEventClick(x, y);
        return;
    }

    if (gameState.state === 'combat') {
        // Weapon targeting
        if (targetingMode && targetingWeapon !== null && enemyShip) {
            for (const room of enemyShip.rooms) {
                if (x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h) {
                    fireWeapon(targetingWeapon, room);
                    targetingMode = false;
                    targetingWeapon = null;
                    return;
                }
            }
        }

        // Crew selection
        for (const crew of playerShip.crew) {
            if (x >= crew.x - 15 && x <= crew.x + 15 && y >= crew.y - 15 && y <= crew.y + 15) {
                if (selectedCrew === crew) selectedCrew = null;
                else {
                    selectedCrew = crew;
                    playerShip.crew.forEach(c => c.selected = false);
                    crew.selected = true;
                }
                return;
            }
        }

        // Move crew to room
        if (selectedCrew) {
            for (const room of playerShip.rooms) {
                if (x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h) {
                    selectedCrew.targetX = room.x + room.w / 2;
                    selectedCrew.targetY = room.y + room.h / 2;
                    selectedCrew.room = room.system;
                    return;
                }
            }
        }

        // Weapon bar clicks
        const weaponBarY = 620;
        for (let i = 0; i < playerShip.weapons.length; i++) {
            const wx = 380 + i * 130;
            if (x >= wx && x <= wx + 120 && y >= weaponBarY && y <= weaponBarY + 60) {
                const weapon = playerShip.weapons[i];
                if (weapon.powered && weapon.charge >= weapon.chargeTime) {
                    targetingMode = true;
                    targetingWeapon = i;
                }
                return;
            }
        }

        // System power clicks
        checkPowerBarClick(x, y);
    }

    if (gameState.state === 'gameover' || gameState.state === 'victory') {
        if (gameState.state === 'victory') {
            // Advance to next beacon
            gameState.beacon++;
            if (gameState.beacon > gameState.maxBeacons) {
                gameState.sector++;
                gameState.beacon = 1;
            }
            // Random event or combat
            if (Math.random() < 0.3) {
                triggerEvent();
            } else {
                const templates = ['fighter', 'scout', 'cruiser', 'drone'];
                spawnEnemy(templates[Math.floor(Math.random() * templates.length)]);
            }
            gameState.state = 'combat';
            playerShip.weapons.forEach(w => w.charge = 0);
        } else {
            resetGame();
        }
    }
}

function checkPowerBarClick(x, y) {
    const systems = ['shields', 'weapons', 'engines', 'oxygen', 'medbay'];
    const startY = 60;

    for (let i = 0; i < systems.length; i++) {
        const sys = playerShip.systems[systems[i]];
        const buttonY = startY + i * 35;

        if (x >= 100 && x <= 115 && y >= buttonY && y <= buttonY + 20) {
            if (sys.power > 0) { sys.power--; playerShip.reactor.current++; }
            return;
        }
        if (x >= 170 && x <= 185 && y >= buttonY && y <= buttonY + 20) {
            if (sys.power < sys.maxPower && playerShip.reactor.current > 0) {
                sys.power++;
                playerShip.reactor.current--;
            }
            return;
        }
    }
}

function fireWeapon(weaponIndex, targetRoom) {
    const weapon = playerShip.weapons[weaponIndex];
    if (!weapon.powered || weapon.charge < weapon.chargeTime) return;
    weapon.charge = 0;

    const weaponType = WEAPON_TYPES[weapon.type];

    if (weaponType.usesAmmo) {
        if (gameState.missiles <= 0) {
            addCombatLog('No missiles!');
            return;
        }
        gameState.missiles--;
    }

    triggerScreenFlash(weaponType.color);

    for (let i = 0; i < weapon.shots; i++) {
        const delay = i * 200;
        scene.time.delayedCall(delay, () => {
            // Create projectile
            const startX = 380;
            const startY = 310;
            const targetX = targetRoom.x + targetRoom.w / 2;
            const targetY = targetRoom.y + targetRoom.h / 2;
            const angle = Math.atan2(targetY - startY, targetX - startX);

            projectiles.push({
                x: startX, y: startY,
                vx: Math.cos(angle), vy: Math.sin(angle),
                targetX, targetY,
                color: weaponType.color,
                trail: [],
                onHit: () => {
                    if (!enemyShip) return;
                    if (Math.random() * 100 < enemyShip.evasion) {
                        addCombatLog('MISS');
                        addFloatingText(targetX, targetY, 'MISS', COLORS.textBlue);
                        return;
                    }

                    if (weaponType.ionDamage) {
                        if (enemyShip.shields.layers > 0) {
                            enemyShip.shields.layers--;
                            addCombatLog('Ion hit - shields down');
                            addFloatingText(targetX, targetY, 'ION', COLORS.textBlue);
                        }
                        return;
                    }

                    if (!weaponType.ignoresShields && enemyShip.shields.layers > 0) {
                        enemyShip.shields.layers--;
                        addCombatLog('Shield hit');
                        addFloatingText(targetX, targetY, 'SHIELD', COLORS.shields);
                        return;
                    }

                    enemyShip.hull -= weapon.damage;
                    triggerScreenShake(5);
                    addCombatLog(`Hit! ${weapon.damage} damage`);
                    addFloatingText(targetX, targetY, `-${weapon.damage}`, COLORS.textRed);

                    if (enemyShip.hull <= 0) {
                        gameState.state = 'victory';
                        gameState.scrap += enemyShip.scrap;
                        gameState.missiles += enemyShip.missiles;
                        gameState.fuel += enemyShip.fuel;
                        addParticles(930, 160, COLORS.weapons, 30);
                        triggerScreenShake(15);
                    }
                }
            });
        });
    }
}

function enemyFire(weapon) {
    const evasion = playerShip.systems.engines.power > 0 ? playerShip.systems.engines.evasion : 0;

    // Create enemy projectile
    const startX = 840;
    const startY = 160;
    const targetRoom = playerShip.rooms[Math.floor(Math.random() * playerShip.rooms.length)];
    const targetX = targetRoom.x + targetRoom.w / 2;
    const targetY = targetRoom.y + targetRoom.h / 2;
    const angle = Math.atan2(targetY - startY, targetX - startX);

    projectiles.push({
        x: startX, y: startY,
        vx: Math.cos(angle), vy: Math.sin(angle),
        targetX, targetY,
        color: COLORS.weapons,
        trail: [],
        onHit: () => {
            if (Math.random() * 100 < evasion) {
                addCombatLog('Enemy MISS');
                addFloatingText(targetX, targetY, 'EVADE', COLORS.textGreen);
                return;
            }

            const shields = playerShip.systems.shields;
            if (shields.layers > 0) {
                shields.layers--;
                addCombatLog('Shields absorb hit');
                addFloatingText(targetX, targetY, 'SHIELD', COLORS.shields);
                return;
            }

            playerShip.hull -= weapon.damage;
            triggerScreenShake(10);
            triggerScreenFlash(COLORS.textRed);
            addCombatLog(`Hull hit! -${weapon.damage}`);
            addFloatingText(targetX, targetY, `-${weapon.damage}`, COLORS.textRed);

            // Random hazard
            if (Math.random() < 0.2) {
                targetRoom.fire = 0.3;
                addCombatLog('Fire started!');
            } else if (Math.random() < 0.1) {
                targetRoom.breach = true;
                addCombatLog('Hull breach!');
            }

            // Damage system
            if (playerShip.systems[targetRoom.system]) {
                playerShip.systems[targetRoom.system].damage += weapon.damage * 0.5;
            }

            if (playerShip.hull <= 0) gameState.state = 'gameover';
        }
    });
}

function addCombatLog(message) {
    combatLog.unshift({ text: message, time: 4 });
    if (combatLog.length > 5) combatLog.pop();
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, alpha: 1, vy: -30 });
}

function addParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 100;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color,
            alpha: 1,
            size: 2 + Math.random() * 3
        });
    }
}

function triggerScreenShake(intensity) { screenShake = intensity; }
function triggerScreenFlash(color) { screenFlash = { color, alpha: 0.3 }; }

function triggerEvent() {
    const events = [
        {
            title: 'Distress Beacon',
            text: 'You receive a distress signal from a nearby ship. Do you investigate?',
            choices: [
                { text: 'Investigate', outcome: () => {
                    if (Math.random() < 0.6) {
                        gameState.scrap += 15;
                        addCombatLog('Found 15 scrap');
                    } else {
                        playerShip.hull -= 3;
                        addCombatLog('Trap! -3 hull');
                    }
                }},
                { text: 'Ignore', outcome: () => addCombatLog('Continued on') }
            ]
        },
        {
            title: 'Abandoned Station',
            text: 'An abandoned space station appears on sensors. Explore it?',
            choices: [
                { text: 'Explore', outcome: () => {
                    gameState.scrap += 20;
                    gameState.fuel += 2;
                    addCombatLog('Found supplies!');
                }},
                { text: 'Pass by', outcome: () => addCombatLog('Moved on') }
            ]
        },
        {
            title: 'Merchant Ship',
            text: 'A friendly merchant offers repairs for 30 scrap.',
            choices: [
                { text: 'Repair (30 scrap)', outcome: () => {
                    if (gameState.scrap >= 30) {
                        gameState.scrap -= 30;
                        playerShip.hull = Math.min(playerShip.maxHull, playerShip.hull + 10);
                        addCombatLog('Hull repaired +10');
                    } else {
                        addCombatLog('Not enough scrap');
                    }
                }},
                { text: 'Decline', outcome: () => addCombatLog('Declined offer') }
            ]
        }
    ];
    currentEvent = events[Math.floor(Math.random() * events.length)];
}

function handleEventClick(x, y) {
    if (!currentEvent) return;
    const choices = currentEvent.choices;
    for (let i = 0; i < choices.length; i++) {
        const bx = 440, by = 380 + i * 50, bw = 400, bh = 40;
        if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
            choices[i].outcome();
            currentEvent = null;
            // Continue to next encounter
            if (Math.random() < 0.5) {
                const templates = ['fighter', 'scout', 'cruiser', 'drone'];
                spawnEnemy(templates[Math.floor(Math.random() * templates.length)]);
            }
            return;
        }
    }
}

function resetGame() {
    playerShip.hull = playerShip.maxHull;
    playerShip.systems.shields.layers = 1;
    playerShip.systems.shields.damage = 0;
    playerShip.systems.weapons.damage = 0;
    playerShip.systems.engines.damage = 0;
    for (const room of playerShip.rooms) {
        room.fire = 0;
        room.breach = false;
    }
    for (const crew of playerShip.crew) {
        crew.health = crew.maxHealth;
    }
    spawnEnemy('fighter');
    gameState.state = 'combat';
    gameState.scrap = 50;
    gameState.missiles = 8;
    gameState.fuel = 10;
    gameState.sector = 1;
    gameState.beacon = 1;
    combatLog = [];
    projectiles = [];
    particles = [];
    floatingTexts = [];
    playerShip.weapons.forEach(w => w.charge = 0);
}

// =====================
// DRAWING FUNCTIONS
// =====================

function drawStarfield(time) {
    graphics.fillStyle(0xffffff);
    for (let i = 0; i < 100; i++) {
        const x = (i * 137 + time * 0.01) % 1280;
        const y = (i * 91) % 720;
        const alpha = 0.3 + Math.sin(time * 0.002 + i) * 0.2;
        graphics.fillStyle(0xffffff, alpha);
        graphics.fillRect(x, y, (i % 3) + 1, (i % 3) + 1);
    }

    // Planet with glow
    graphics.fillStyle(0x442222, 0.3);
    graphics.fillCircle(1100, 500, 120);
    graphics.fillStyle(0x663333, 0.5);
    graphics.fillCircle(1100, 500, 100);
    graphics.fillStyle(0x774444, 0.3);
    graphics.fillCircle(1080, 480, 30);
}

function drawPlayerShip(time) {
    // Engine glow
    const enginePower = playerShip.systems.engines.power;
    if (enginePower > 0) {
        const glowSize = 15 + Math.sin(time * 0.01) * 3;
        graphics.fillStyle(COLORS.engines, 0.4);
        graphics.fillCircle(45, 310, glowSize);
        graphics.fillStyle(COLORS.weapons, 0.6);
        graphics.fillCircle(45, 310, glowSize * 0.6);
    }

    // Shield bubble with animation
    if (playerShip.systems.shields.layers > 0) {
        const pulse = Math.sin(time * 0.005) * 5;
        graphics.lineStyle(3, COLORS.shields, 0.4 + Math.sin(time * 0.003) * 0.1);
        graphics.strokeEllipse(220, 310, 340 + pulse, 200 + pulse * 0.6);
        if (playerShip.systems.shields.layers > 1) {
            graphics.strokeEllipse(220, 310, 360 + pulse, 220 + pulse * 0.6);
        }
    }

    // Ship hull
    graphics.fillStyle(COLORS.shipHull);
    graphics.beginPath();
    graphics.moveTo(50, 310);
    graphics.lineTo(120, 240);
    graphics.lineTo(320, 240);
    graphics.lineTo(380, 280);
    graphics.lineTo(380, 340);
    graphics.lineTo(320, 380);
    graphics.lineTo(120, 380);
    graphics.lineTo(50, 310);
    graphics.closePath();
    graphics.fillPath();

    // Rooms
    for (const room of playerShip.rooms) {
        // Room floor
        graphics.fillStyle(COLORS.roomFloor);
        graphics.fillRect(room.x, room.y, room.w, room.h);

        // Fire overlay
        if (room.fire > 0) {
            graphics.fillStyle(COLORS.fire, room.fire * 0.5);
            graphics.fillRect(room.x, room.y, room.w, room.h);
        }

        // Breach overlay
        if (room.breach) {
            graphics.fillStyle(COLORS.breach, 0.4);
            graphics.fillRect(room.x, room.y, room.w, room.h);
        }

        // System damage indicator
        const sys = playerShip.systems[room.system];
        if (sys && sys.damage > 0) {
            graphics.fillStyle(COLORS.textRed, 0.3);
            graphics.fillRect(room.x, room.y, room.w, room.h);
        }

        graphics.lineStyle(2, COLORS.roomWall);
        graphics.strokeRect(room.x, room.y, room.w, room.h);

        // Room letter
        const letterText = scene.add.text(room.x + room.w / 2, room.y + 8, room.letter, {
            fontFamily: 'Courier New', fontSize: '12px', color: '#88ff88'
        });
        letterText.setOrigin(0.5, 0);
        scene.time.delayedCall(16, () => letterText.destroy());
    }

    // Crew
    for (const crew of playerShip.crew) {
        // Selection ring
        if (crew.selected) {
            graphics.lineStyle(2, COLORS.textYellow);
            graphics.strokeCircle(crew.x, crew.y, 14);
        }

        // Crew circle
        graphics.fillStyle(crew.raceData.color);
        graphics.fillCircle(crew.x, crew.y, 10);

        // Health bar background
        graphics.fillStyle(0x333333);
        graphics.fillRect(crew.x - 12, crew.y + 12, 24, 4);
        // Health bar fill
        const healthPct = crew.health / crew.maxHealth;
        const healthColor = healthPct > 0.5 ? COLORS.textGreen : healthPct > 0.25 ? COLORS.textOrange : COLORS.textRed;
        graphics.fillStyle(healthColor);
        graphics.fillRect(crew.x - 12, crew.y + 12, 24 * healthPct, 4);
    }
}

function drawEnemyShip() {
    // Shield bubble
    if (enemyShip.shields.layers > 0) {
        graphics.lineStyle(2, COLORS.shields, 0.5);
        graphics.strokeEllipse(930, 160, 200, 120);
        if (enemyShip.shields.layers > 1) {
            graphics.strokeEllipse(930, 160, 220, 140);
        }
    }

    // Ship hull
    graphics.fillStyle(0x556655);
    graphics.beginPath();
    graphics.moveTo(840, 160);
    graphics.lineTo(880, 100);
    graphics.lineTo(1000, 100);
    graphics.lineTo(1040, 140);
    graphics.lineTo(1040, 180);
    graphics.lineTo(1000, 220);
    graphics.lineTo(880, 220);
    graphics.closePath();
    graphics.fillPath();

    // Rooms
    for (const room of enemyShip.rooms) {
        graphics.fillStyle(0x4a5a4a);
        graphics.fillRect(room.x, room.y, room.w, room.h);
        if (targetingMode) {
            graphics.lineStyle(2, COLORS.textRed);
            graphics.strokeRect(room.x - 2, room.y - 2, room.w + 4, room.h + 4);
        }
    }
}

function drawProjectiles(delta) {
    for (const p of projectiles) {
        // Draw trail
        for (let i = 0; i < p.trail.length; i++) {
            const t = p.trail[i];
            t.alpha -= delta / 200;
            if (t.alpha > 0) {
                graphics.fillStyle(p.color, t.alpha * 0.5);
                graphics.fillCircle(t.x, t.y, 3);
            }
        }
        // Draw projectile
        graphics.fillStyle(p.color);
        graphics.fillCircle(p.x, p.y, 5);
    }
}

function drawParticles(delta) {
    particles = particles.filter(p => {
        p.x += p.vx * delta / 1000;
        p.y += p.vy * delta / 1000;
        p.alpha -= delta / 500;
        if (p.alpha > 0) {
            graphics.fillStyle(p.color, p.alpha);
            graphics.fillCircle(p.x, p.y, p.size * p.alpha);
        }
        return p.alpha > 0;
    });
}

function drawFloatingTexts(delta) {
    floatingTexts = floatingTexts.filter(ft => {
        ft.y += ft.vy * delta / 1000;
        ft.alpha -= delta / 1000;
        if (ft.alpha > 0) {
            const text = scene.add.text(ft.x, ft.y, ft.text, {
                fontFamily: 'Courier New', fontSize: '16px', color: '#' + ft.color.toString(16).padStart(6, '0')
            });
            text.setOrigin(0.5, 0.5);
            text.setAlpha(ft.alpha);
            scene.time.delayedCall(16, () => text.destroy());
        }
        return ft.alpha > 0;
    });
}

function drawTopBar() {
    // Hull bar
    graphics.fillStyle(COLORS.uiDark);
    graphics.fillRect(10, 10, 250, 25);
    graphics.lineStyle(1, COLORS.uiBorder);
    graphics.strokeRect(10, 10, 250, 25);

    const hullText = scene.add.text(15, 17, 'HULL', { fontFamily: 'Courier New', fontSize: '14px', color: '#00ff00' });
    scene.time.delayedCall(16, () => hullText.destroy());

    for (let i = 0; i < 30; i++) {
        graphics.fillStyle(i < playerShip.hull ? COLORS.textGreen : 0x333333);
        graphics.fillRect(60 + i * 6, 14, 4, 17);
    }

    // Shields indicator
    graphics.fillStyle(COLORS.uiDark);
    graphics.fillRect(10, 40, 180, 20);
    const shieldText = scene.add.text(15, 44, 'SHIELDS', { fontFamily: 'Courier New', fontSize: '12px', color: '#00ccff' });
    scene.time.delayedCall(16, () => shieldText.destroy());

    for (let i = 0; i < playerShip.systems.shields.maxLayers; i++) {
        graphics.fillStyle(i < playerShip.systems.shields.layers ? COLORS.shields : 0x333333);
        graphics.fillCircle(100 + i * 25, 50, 8);
    }

    // Resources
    const resourceY = 10;
    graphics.fillStyle(COLORS.uiDark);
    graphics.fillRect(280, resourceY, 200, 25);
    const scrapText = scene.add.text(290, resourceY + 5, `Scrap: ${gameState.scrap}`, { fontFamily: 'Courier New', fontSize: '12px', color: '#ffffff' });
    const missileText = scene.add.text(370, resourceY + 5, `Missiles: ${gameState.missiles}`, { fontFamily: 'Courier New', fontSize: '12px', color: '#ffaa00' });
    const fuelText = scene.add.text(460, resourceY + 5, `Fuel: ${gameState.fuel}`, { fontFamily: 'Courier New', fontSize: '12px', color: '#88ff88' });
    scene.time.delayedCall(16, () => { scrapText.destroy(); missileText.destroy(); fuelText.destroy(); });

    // Sector display
    graphics.fillStyle(COLORS.uiDark);
    graphics.fillRect(500, resourceY, 120, 25);
    const sectorText = scene.add.text(510, resourceY + 5, `Sector ${gameState.sector} - ${gameState.beacon}/${gameState.maxBeacons}`, { fontFamily: 'Courier New', fontSize: '12px', color: '#ffffff' });
    scene.time.delayedCall(16, () => sectorText.destroy());
}

function drawSystemPanel() {
    graphics.fillStyle(COLORS.uiDark);
    graphics.fillRect(10, 55, 200, 200);
    graphics.lineStyle(1, COLORS.uiBorder);
    graphics.strokeRect(10, 55, 200, 200);

    const systems = ['shields', 'weapons', 'engines', 'oxygen', 'medbay'];
    const sysColors = [COLORS.shields, COLORS.weapons, COLORS.engines, COLORS.oxygen, COLORS.medbay];

    for (let i = 0; i < systems.length; i++) {
        const sys = playerShip.systems[systems[i]];
        const y = 60 + i * 35;

        const labelColor = sys.damage > 0 ? '#ff4444' : '#' + sysColors[i].toString(16).padStart(6, '0');
        const sysLabel = scene.add.text(15, y + 5, systems[i].toUpperCase(), { fontFamily: 'Courier New', fontSize: '11px', color: labelColor });
        scene.time.delayedCall(16, () => sysLabel.destroy());

        // - button
        graphics.fillStyle(sys.power > 0 ? COLORS.textRed : 0x333333);
        graphics.fillRect(100, y, 15, 20);
        // + button
        graphics.fillStyle(sys.power < sys.maxPower && playerShip.reactor.current > 0 ? COLORS.textGreen : 0x333333);
        graphics.fillRect(170, y, 15, 20);

        const minusText = scene.add.text(107, y + 5, '-', { fontFamily: 'Courier New', fontSize: '14px', color: '#ffffff' });
        minusText.setOrigin(0.5, 0);
        const plusText = scene.add.text(177, y + 5, '+', { fontFamily: 'Courier New', fontSize: '14px', color: '#ffffff' });
        plusText.setOrigin(0.5, 0);
        const powerText = scene.add.text(142, y + 5, `${sys.power}/${sys.maxPower}`, { fontFamily: 'Courier New', fontSize: '11px', color: '#ffffff' });
        powerText.setOrigin(0.5, 0);
        scene.time.delayedCall(16, () => { minusText.destroy(); plusText.destroy(); powerText.destroy(); });
    }

    const reactorText = scene.add.text(15, 240, `REACTOR: ${playerShip.reactor.current}/${playerShip.reactor.max}`, { fontFamily: 'Courier New', fontSize: '12px', color: '#ffff00' });
    scene.time.delayedCall(16, () => reactorText.destroy());
}

function drawWeaponBar() {
    const y = 620;
    graphics.fillStyle(COLORS.uiDark);
    graphics.fillRect(350, y - 10, 420, 80);
    graphics.lineStyle(1, COLORS.uiBorder);
    graphics.strokeRect(350, y - 10, 420, 80);

    const weaponsLabel = scene.add.text(560, y - 5, 'WEAPONS', { fontFamily: 'Courier New', fontSize: '12px', color: '#ffffff' });
    weaponsLabel.setOrigin(0.5, 0);
    scene.time.delayedCall(16, () => weaponsLabel.destroy());

    for (let i = 0; i < playerShip.weapons.length; i++) {
        const weapon = playerShip.weapons[i];
        const x = 380 + i * 130;

        const bgColor = weapon.powered ? 0x2a3a2a : 0x2a2a2a;
        graphics.fillStyle(bgColor);
        graphics.fillRect(x, y + 8, 120, 55);

        const borderColor = weapon.charge >= weapon.chargeTime ? COLORS.textGreen : COLORS.uiBorder;
        graphics.lineStyle(weapon.charge >= weapon.chargeTime ? 2 : 1, borderColor);
        graphics.strokeRect(x, y + 8, 120, 55);

        // Weapon name
        const weaponName = scene.add.text(x + 5, y + 12, weapon.name, { fontFamily: 'Courier New', fontSize: '9px', color: weapon.powered ? '#ffffff' : '#666666' });
        // Weapon type
        const typeColor = weapon.type === 'laser' ? '#ff4444' : weapon.type === 'missile' ? '#ffaa00' : '#44aaff';
        const typeText = scene.add.text(x + 5, y + 24, weapon.type.toUpperCase(), { fontFamily: 'Courier New', fontSize: '8px', color: typeColor });
        scene.time.delayedCall(16, () => { weaponName.destroy(); typeText.destroy(); });

        // Charge bar
        graphics.fillStyle(0x333333);
        graphics.fillRect(x + 5, y + 38, 110, 12);
        const chargeColor = weapon.charge >= weapon.chargeTime ? COLORS.textGreen : COLORS.textOrange;
        graphics.fillStyle(chargeColor);
        graphics.fillRect(x + 5, y + 38, 110 * Math.min(1, weapon.charge / weapon.chargeTime), 12);

        // Power indicator
        graphics.fillStyle(weapon.powered ? COLORS.textGreen : 0x666666);
        graphics.fillRect(x + 5, y + 53, 8, 6);
    }
}

function drawTargetPanel() {
    const x = 1050, y = 70;
    graphics.fillStyle(COLORS.uiPanel);
    graphics.fillRect(x, y, 220, 200);
    graphics.lineStyle(1, COLORS.uiBorder);
    graphics.strokeRect(x, y, 220, 200);

    const targetLabel = scene.add.text(x + 110, y + 12, 'TARGET', { fontFamily: 'Courier New', fontSize: '14px', color: '#ff4444' });
    targetLabel.setOrigin(0.5, 0);
    const enemyName = scene.add.text(x + 110, y + 32, enemyShip.name, { fontFamily: 'Courier New', fontSize: '12px', color: '#ffffff' });
    enemyName.setOrigin(0.5, 0);
    scene.time.delayedCall(16, () => { targetLabel.destroy(); enemyName.destroy(); });

    // Hull bar
    const hullLabel = scene.add.text(x + 10, y + 55, 'HULL', { fontFamily: 'Courier New', fontSize: '12px', color: '#00ff00' });
    scene.time.delayedCall(16, () => hullLabel.destroy());
    graphics.fillStyle(0x333333);
    graphics.fillRect(x + 60, y + 55, 150, 15);
    graphics.fillStyle(COLORS.textGreen);
    graphics.fillRect(x + 60, y + 55, 150 * (enemyShip.hull / enemyShip.maxHull), 15);

    // Shields
    const shieldsLabel = scene.add.text(x + 10, y + 80, 'SHIELDS', { fontFamily: 'Courier New', fontSize: '12px', color: '#00ccff' });
    scene.time.delayedCall(16, () => shieldsLabel.destroy());
    for (let i = 0; i < enemyShip.shields.maxLayers; i++) {
        graphics.fillStyle(i < enemyShip.shields.layers ? COLORS.shields : 0x333333);
        graphics.fillCircle(x + 100 + i * 25, y + 85, 8);
    }

    // Evasion
    const evasionLabel = scene.add.text(x + 10, y + 105, `EVASION: ${enemyShip.evasion}%`, { fontFamily: 'Courier New', fontSize: '11px', color: '#ffff00' });
    scene.time.delayedCall(16, () => evasionLabel.destroy());

    // Mini ship
    graphics.fillStyle(0x556655);
    graphics.fillRect(x + 50, y + 125, 120, 50);

    const relationText = scene.add.text(x + 110, y + 185, 'HOSTILE', { fontFamily: 'Courier New', fontSize: '12px', color: '#ff4444' });
    relationText.setOrigin(0.5, 0);
    scene.time.delayedCall(16, () => relationText.destroy());
}

function drawCombatLog() {
    const x = 800, y = 620;
    graphics.fillStyle(COLORS.uiDark);
    graphics.fillRect(x, y - 10, 230, 80);
    graphics.lineStyle(1, COLORS.uiBorder);
    graphics.strokeRect(x, y - 10, 230, 80);

    for (let i = 0; i < combatLog.length; i++) {
        const log = combatLog[i];
        const color = log.text.includes('MISS') || log.text.includes('EVADE') ? '#4488ff' :
                     log.text.includes('hit') || log.text.includes('Hull') ? '#ff4444' :
                     log.text.includes('Shield') ? '#00ccff' : '#ffffff';
        const logText = scene.add.text(x + 10, y + i * 14, log.text, { fontFamily: 'Courier New', fontSize: '11px', color: color });
        logText.setAlpha(Math.min(1, log.time));
        scene.time.delayedCall(16, () => logText.destroy());
    }
}

function drawPauseOverlay() {
    graphics.fillStyle(0x000000, 0.5);
    graphics.fillRect(0, 0, 1280, 720);
    const pauseText = scene.add.text(640, 340, 'PAUSED', { fontFamily: 'Courier New', fontSize: '48px', color: '#ffffff' });
    pauseText.setOrigin(0.5, 0.5);
    const resumeText = scene.add.text(640, 390, 'Press SPACE to resume', { fontFamily: 'Courier New', fontSize: '18px', color: '#aaaaaa' });
    resumeText.setOrigin(0.5, 0.5);
    scene.time.delayedCall(16, () => { pauseText.destroy(); resumeText.destroy(); });
}

function drawTargetingCursor() {
    graphics.lineStyle(2, COLORS.textRed);
    if (enemyShip) {
        for (const room of enemyShip.rooms) {
            graphics.strokeRect(room.x - 3, room.y - 3, room.w + 6, room.h + 6);
        }
    }
    const targetText = scene.add.text(930, 250, 'SELECT TARGET ROOM', { fontFamily: 'Courier New', fontSize: '14px', color: '#ff4444' });
    targetText.setOrigin(0.5, 0.5);
    scene.time.delayedCall(16, () => targetText.destroy());
}

function drawEventPopup() {
    graphics.fillStyle(0x000000, 0.7);
    graphics.fillRect(0, 0, 1280, 720);

    graphics.fillStyle(COLORS.uiDark);
    graphics.fillRect(340, 200, 600, 300);
    graphics.lineStyle(2, COLORS.textOrange);
    graphics.strokeRect(340, 200, 600, 300);

    const titleText = scene.add.text(640, 230, currentEvent.title, { fontFamily: 'Courier New', fontSize: '24px', color: '#ffaa00' });
    titleText.setOrigin(0.5, 0);
    const descText = scene.add.text(640, 280, currentEvent.text, { fontFamily: 'Courier New', fontSize: '14px', color: '#ffffff', wordWrap: { width: 550 } });
    descText.setOrigin(0.5, 0);
    scene.time.delayedCall(16, () => { titleText.destroy(); descText.destroy(); });

    for (let i = 0; i < currentEvent.choices.length; i++) {
        const bx = 440, by = 380 + i * 50, bw = 400, bh = 40;
        graphics.fillStyle(0x3a5a3a);
        graphics.fillRect(bx, by, bw, bh);
        graphics.lineStyle(1, COLORS.textGreen);
        graphics.strokeRect(bx, by, bw, bh);

        const choiceText = scene.add.text(640, by + 12, currentEvent.choices[i].text, { fontFamily: 'Courier New', fontSize: '14px', color: '#00ff00' });
        choiceText.setOrigin(0.5, 0);
        scene.time.delayedCall(16, () => choiceText.destroy());
    }
}

function drawTitleScreen() {
    drawStarfield(scene.time.now);
    const title = scene.add.text(640, 250, 'FTL', { fontFamily: 'Courier New', fontSize: '72px', color: '#ffffff' });
    title.setOrigin(0.5, 0.5);
    const subtitle = scene.add.text(640, 310, 'FASTER THAN LIGHT', { fontFamily: 'Courier New', fontSize: '24px', color: '#aaaaaa' });
    subtitle.setOrigin(0.5, 0.5);
    const startText = scene.add.text(640, 420, 'Click to Start', { fontFamily: 'Courier New', fontSize: '18px', color: '#00ff00' });
    startText.setOrigin(0.5, 0.5);

    // Controls hint
    const controls = scene.add.text(640, 520, 'SPACE: Pause | Click weapons to fire | Click crew then rooms to move', { fontFamily: 'Courier New', fontSize: '12px', color: '#888888' });
    controls.setOrigin(0.5, 0.5);
    const controls2 = scene.add.text(640, 545, 'ESC: Cancel | M: Map (placeholder)', { fontFamily: 'Courier New', fontSize: '12px', color: '#888888' });
    controls2.setOrigin(0.5, 0.5);

    scene.time.delayedCall(16, () => { title.destroy(); subtitle.destroy(); startText.destroy(); controls.destroy(); controls2.destroy(); });
}

function drawGameOver() {
    graphics.fillStyle(0x000000, 0.7);
    graphics.fillRect(0, 0, 1280, 720);
    const gameOverText = scene.add.text(640, 320, 'SHIP DESTROYED', { fontFamily: 'Courier New', fontSize: '48px', color: '#ff4444' });
    gameOverText.setOrigin(0.5, 0.5);

    const statsText = scene.add.text(640, 380, `Reached Sector ${gameState.sector}, Beacon ${gameState.beacon}`, { fontFamily: 'Courier New', fontSize: '18px', color: '#ffffff' });
    statsText.setOrigin(0.5, 0.5);

    const retryText = scene.add.text(640, 430, 'Click to try again', { fontFamily: 'Courier New', fontSize: '16px', color: '#aaaaaa' });
    retryText.setOrigin(0.5, 0.5);
    scene.time.delayedCall(16, () => { gameOverText.destroy(); statsText.destroy(); retryText.destroy(); });
}

function drawVictory() {
    graphics.fillStyle(0x000000, 0.7);
    graphics.fillRect(0, 0, 1280, 720);
    const victoryText = scene.add.text(640, 300, 'ENEMY DESTROYED', { fontFamily: 'Courier New', fontSize: '48px', color: '#00ff00' });
    victoryText.setOrigin(0.5, 0.5);

    const rewardsTitle = scene.add.text(640, 360, 'Rewards:', { fontFamily: 'Courier New', fontSize: '18px', color: '#ffffff' });
    rewardsTitle.setOrigin(0.5, 0.5);

    const scrapReward = scene.add.text(640, 390, `+${enemyShip.scrap} Scrap`, { fontFamily: 'Courier New', fontSize: '16px', color: '#ffff00' });
    scrapReward.setOrigin(0.5, 0.5);

    let rewardY = 415;
    const rewards = [];
    if (enemyShip.missiles > 0) {
        const missileReward = scene.add.text(640, rewardY, `+${enemyShip.missiles} Missiles`, { fontFamily: 'Courier New', fontSize: '14px', color: '#ffaa00' });
        missileReward.setOrigin(0.5, 0.5);
        rewards.push(missileReward);
        rewardY += 20;
    }
    if (enemyShip.fuel > 0) {
        const fuelReward = scene.add.text(640, rewardY, `+${enemyShip.fuel} Fuel`, { fontFamily: 'Courier New', fontSize: '14px', color: '#88ff88' });
        fuelReward.setOrigin(0.5, 0.5);
        rewards.push(fuelReward);
    }

    const continueText = scene.add.text(640, 480, 'Click to continue', { fontFamily: 'Courier New', fontSize: '16px', color: '#aaaaaa' });
    continueText.setOrigin(0.5, 0.5);
    scene.time.delayedCall(16, () => {
        victoryText.destroy(); rewardsTitle.destroy(); scrapReward.destroy(); continueText.destroy();
        rewards.forEach(r => r.destroy());
    });
}

// =====================
// GAME INITIALIZATION
// =====================
const config = {
    type: Phaser.CANVAS,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#0a0a1a',
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
