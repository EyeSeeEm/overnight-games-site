// Caribbean Admiral - Canvas Version
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = 1280;
const HEIGHT = 720;

// Game State
let gameState = 'title'; // title, map, port, combat, trading, shipyard, armory, victory, defeat
let selectedShip = null;
let selectedEnemy = null;
let selectedAttack = null;
let combatLog = [];
let floatingTexts = [];
let day = 1;
let turnPhase = 'player'; // player, enemy, result

// Visual Effects
let screenShake = 0;
let particles = [];
let cannonballs = [];
let waveOffset = 0;

// Ship Types Database
const SHIP_TYPES = {
    sloop: { name: 'Sloop', hull: 100, sails: 40, crew: 10, cargo: 20, damage: 15, cost: 0 },
    schooner: { name: 'Schooner', hull: 150, sails: 50, crew: 15, cargo: 40, damage: 20, cost: 1000, requires: 'sloop' },
    cutter: { name: 'Cutter', hull: 180, sails: 45, crew: 20, cargo: 25, damage: 30, cost: 800, requires: 'sloop' },
    brigantine: { name: 'Brigantine', hull: 250, sails: 60, crew: 25, cargo: 80, damage: 35, cost: 2500, requires: 'schooner' },
    brig: { name: 'Brig', hull: 280, sails: 55, crew: 30, cargo: 60, damage: 45, cost: 3000, requires: 'schooner' },
    corvette: { name: 'Corvette', hull: 350, sails: 50, crew: 40, cargo: 35, damage: 60, cost: 4000, requires: 'cutter' },
    frigate: { name: 'Frigate', hull: 400, sails: 55, crew: 50, cargo: 40, damage: 75, cost: 5000, requires: 'cutter' },
    galleon: { name: 'Galleon', hull: 500, sails: 65, crew: 40, cargo: 150, damage: 55, cost: 8000, requires: 'brigantine' },
    manowar: { name: 'Man-o-War', hull: 600, sails: 60, crew: 70, cargo: 50, damage: 100, cost: 12000, requires: 'frigate' },
    eastindiaman: { name: 'East Indiaman', hull: 700, sails: 70, crew: 50, cargo: 250, damage: 70, cost: 15000, requires: 'galleon' },
    shipofline: { name: 'Ship of the Line', hull: 800, sails: 65, crew: 100, cargo: 60, damage: 150, cost: 25000, requires: 'manowar' },
    flagship: { name: 'Flagship', hull: 1000, sails: 80, crew: 150, cargo: 100, damage: 200, cost: 50000, requires: ['eastindiaman', 'shipofline'] }
};

// Trade Goods
const TRADE_GOODS = {
    rice: { name: 'Rice', buyLow: 27, buyHigh: 45, sellLow: 45, sellHigh: 72, unlockPort: 1 },
    corn: { name: 'Corn', buyLow: 66, buyHigh: 100, sellLow: 100, sellHigh: 144, unlockPort: 1 },
    bananas: { name: 'Bananas', buyLow: 200, buyHigh: 250, sellLow: 250, sellHigh: 300, unlockPort: 2 },
    ore: { name: 'Ore', buyLow: 304, buyHigh: 400, sellLow: 400, sellHigh: 480, unlockPort: 3 },
    coffee: { name: 'Coffee', buyLow: 1280, buyHigh: 1600, sellLow: 1600, sellHigh: 1920, unlockPort: 5 },
    rum: { name: 'Rum', buyLow: 3725, buyHigh: 4400, sellLow: 4400, sellHigh: 5016, unlockPort: 6 },
    silver: { name: 'Silver', buyLow: 9600, buyHigh: 12000, sellLow: 12000, sellHigh: 14400, unlockPort: 8 },
    gunpowder: { name: 'Gunpowder', buyLow: 14755, buyHigh: 19000, sellLow: 19000, sellHigh: 24000, unlockPort: 9 }
};

// Ports
const PORTS = [
    { id: 1, name: 'Trinidad', x: 300, y: 550, liberated: false, bossFleet: ['sloop', 'sloop'] },
    { id: 2, name: 'Grenada', x: 500, y: 550, liberated: false, bossFleet: ['sloop', 'sloop', 'sloop'] },
    { id: 3, name: 'Caracas', x: 250, y: 450, liberated: false, bossFleet: ['brig', 'brig'] },
    { id: 4, name: 'Bridgetown', x: 550, y: 450, liberated: false, bossFleet: ['brig', 'brig', 'brig'] },
    { id: 5, name: 'Maracaibo', x: 200, y: 350, liberated: false, bossFleet: ['frigate', 'frigate'] },
    { id: 6, name: 'Port Royal', x: 600, y: 350, liberated: false, bossFleet: ['frigate', 'frigate', 'frigate'] },
    { id: 7, name: 'Cartagena', x: 150, y: 250, liberated: false, bossFleet: ['manowar', 'manowar'] },
    { id: 8, name: 'Kingston', x: 650, y: 250, liberated: false, bossFleet: ['manowar', 'manowar', 'manowar'] },
    { id: 9, name: 'Havana', x: 200, y: 150, liberated: false, bossFleet: ['manowar', 'manowar', 'manowar', 'manowar'] },
    { id: 10, name: 'Nassau', x: 600, y: 150, liberated: false, bossFleet: ['ghostship'] }
];

// Attack Types
const ATTACKS = {
    hull: { name: 'Hull Shot', apCost: 25, hullMult: 1.0, sailMult: 0.1, crewMult: 0.1 },
    sail: { name: 'Sail Shot', apCost: 25, hullMult: 0.1, sailMult: 1.0, crewMult: 0.1 },
    crew: { name: 'Crew Shot', apCost: 25, hullMult: 0.5, sailMult: 0.25, crewMult: 1.0 },
    quick: { name: 'Quick Shot', apCost: 15, hullMult: 0.4, sailMult: 0.4, crewMult: 0.4 },
    board: { name: 'Board', apCost: 35 }
};

// Player Data
let player = {
    gold: 1000,
    warPoints: 0,
    medalPoints: 0,
    fleet: [],
    cargo: {},
    consumables: { powder: 0, dynamite: 0 },
    stats: { shipsSunk: 0, goodsTraded: 0, shipsBoarded: 0 },
    ghostShipDamage: 0,
    currentPort: null,
    mapX: 400,
    mapY: 600
};

// Combat State
let combat = {
    enemyFleet: [],
    playerTurnIndex: 0,
    isPlayerTurn: true,
    isBossFight: false,
    portId: null
};

// Current Port for trading
let currentPortPrices = {};

// Initialize player fleet
function initGame() {
    player = {
        gold: 1000,
        warPoints: 0,
        medalPoints: 0,
        fleet: [createShip('sloop')],
        cargo: { rice: 0, corn: 0, bananas: 0, ore: 0, coffee: 0, rum: 0, silver: 0, gunpowder: 0 },
        consumables: { powder: 0, dynamite: 0 },
        stats: { shipsSunk: 0, goodsTraded: 0, shipsBoarded: 0 },
        ghostShipDamage: 0,
        currentPort: null,
        mapX: 400,
        mapY: 600
    };
    day = 1;
    PORTS.forEach(p => p.liberated = false);
    gameState = 'map';
}

function createShip(type, isEnemy = false) {
    const base = SHIP_TYPES[type];
    return {
        type: type,
        name: base.name,
        hull: base.hull,
        maxHull: base.hull,
        sails: base.sails,
        maxSails: base.sails,
        crew: base.crew,
        maxCrew: base.crew,
        cargo: base.cargo,
        damage: base.damage,
        ap: base.sails,
        maxAp: base.sails,
        upgrades: { hull: 0, sails: 0, crew: 0, cargo: 0, damage: 0 },
        isEnemy: isEnemy
    };
}

function createGhostShip() {
    return {
        type: 'ghostship',
        name: 'Ghost Ship',
        hull: 30000 - player.ghostShipDamage,
        maxHull: 30000,
        sails: 999,
        maxSails: 999,
        crew: 999,
        maxCrew: 999,
        cargo: 0,
        damage: 500,
        ap: 999,
        maxAp: 999,
        isEnemy: true,
        isGhostShip: true
    };
}

function getShipStat(ship, stat) {
    const base = SHIP_TYPES[ship.type];
    if (!base) return ship[stat];
    const upgradeMult = {
        hull: [1, 1.2, 1.4, 1.6, 1.8, 2.0],
        sails: [1, 1.1, 1.2, 1.3, 1.4, 1.5],
        crew: [1, 1.2, 1.4, 1.6, 1.8, 2.0],
        cargo: [1, 1.25, 1.5, 1.75, 2.0, 2.25],
        damage: [1, 1.15, 1.3, 1.45, 1.6, 1.75]
    };
    const level = ship.upgrades[stat] || 0;
    return Math.floor(base[stat] * upgradeMult[stat][level]);
}

function getFleetTotalHP() {
    return player.fleet.reduce((sum, s) => sum + s.hull, 0);
}

function getFleetCargo() {
    return player.fleet.reduce((sum, s) => sum + getShipStat(s, 'cargo'), 0);
}

function getCargoUsed() {
    return Object.values(player.cargo).reduce((sum, v) => sum + v, 0);
}

// Combat Functions
function startCombat(enemyFleet, isBoss = false, portId = null) {
    combat.enemyFleet = enemyFleet.map(type => {
        if (type === 'ghostship') return createGhostShip();
        return createShip(type, true);
    });
    combat.playerTurnIndex = 0;
    combat.isPlayerTurn = true;
    combat.isBossFight = isBoss;
    combat.portId = portId;
    combatLog = ['Battle begins!'];

    // Reset AP for all ships
    player.fleet.forEach(s => {
        s.ap = getShipStat(s, 'sails');
        s.maxAp = getShipStat(s, 'sails');
    });
    combat.enemyFleet.forEach(s => {
        s.ap = s.sails;
    });

    selectedShip = player.fleet.find(s => s.hull > 0) || null;
    selectedEnemy = null;
    selectedAttack = null;
    turnPhase = 'player';
    gameState = 'combat';
}

function executeAttack(attacker, defender, attackType) {
    const attack = ATTACKS[attackType];
    if (attacker.ap < attack.apCost) {
        addFloatingText(attacker.isEnemy ? WIDTH * 0.7 : WIDTH * 0.3, 400, 'NO AP!', '#ff4444');
        return false;
    }

    attacker.ap -= attack.apCost;

    if (attackType === 'board') {
        return attemptBoarding(attacker, defender);
    }

    // Calculate damage
    let baseDamage = attacker.isEnemy ? attacker.damage : getShipStat(attacker, 'damage');

    // Apply consumable bonus
    if (!attacker.isEnemy && player.consumables.dynamite > 0) {
        baseDamage *= 3;
        addFloatingText(WIDTH / 2, 300, 'DYNAMITE! 3x DAMAGE', '#ffaa00');
    } else if (!attacker.isEnemy && player.consumables.powder > 0) {
        baseDamage *= 1.5;
    }

    // Critical hit (15% chance, 2x damage)
    let isCrit = Math.random() < 0.15;
    if (isCrit) {
        baseDamage *= 2;
    }

    // Random variance
    const variance = 0.9 + Math.random() * 0.2;

    const hullDamage = Math.floor(baseDamage * attack.hullMult * variance);
    const sailDamage = Math.floor(baseDamage * attack.sailMult * variance);
    const crewDamage = Math.floor(baseDamage * attack.crewMult * variance);

    // Ghost ship immunities
    if (defender.isGhostShip) {
        if (attackType === 'sail' || attackType === 'crew' || attackType === 'board') {
            addFloatingText(WIDTH / 2, 300, 'IMMUNE!', '#8888ff');
            combatLog.push(`${attacker.name} attacks but Ghost Ship is immune!`);
            return true;
        }
    }

    defender.hull = Math.max(0, defender.hull - hullDamage);
    defender.sails = Math.max(0, defender.sails - sailDamage);
    defender.crew = Math.max(0, defender.crew - crewDamage);

    const targetX = defender.isEnemy ? WIDTH * 0.65 : WIDTH * 0.3;
    const targetY = 250;

    // Add cannonball animation
    const attackerX = attacker.isEnemy ? WIDTH * 0.65 : WIDTH * 0.15;
    addCannonball(attackerX, 250, targetX, targetY);

    // Add particle and damage text
    setTimeout(() => {
        addParticle(targetX, targetY, '#ff6600', isCrit ? 15 : 8);
        addScreenShake(isCrit ? 12 : 5);
        if (isCrit) {
            addFloatingText(targetX, targetY - 30, 'CRITICAL!', '#ffff00');
        }
        addFloatingText(targetX, targetY, `-${hullDamage}`, isCrit ? '#ffff00' : '#ff4444');
    }, 150);

    combatLog.push(`${attacker.name} ${attack.name} -> ${defender.name}: ${hullDamage}${isCrit ? ' CRIT!' : ''} dmg`);

    // Check if defender is disabled
    if (defender.sails < 15) {
        combatLog.push(`${defender.name} is disabled!`);
    }

    return true;
}

function attemptBoarding(attacker, defender) {
    if (defender.isGhostShip) {
        addFloatingText(WIDTH / 2, 300, 'CANNOT BOARD!', '#8888ff');
        return true;
    }

    const attackerCrew = attacker.isEnemy ? attacker.crew : getShipStat(attacker, 'crew');
    const defenderCrew = defender.crew;

    let successRate = 0;
    if (attackerCrew > defenderCrew * 2) successRate = 0.95;
    else if (attackerCrew > defenderCrew * 1.5) successRate = 0.75;
    else if (attackerCrew > defenderCrew) successRate = 0.50;
    else if (attackerCrew === defenderCrew) successRate = 0.30;
    else successRate = 0.10;

    if (Math.random() < successRate) {
        combatLog.push(`${attacker.name} CAPTURED ${defender.name}!`);
        addFloatingText(WIDTH / 2, 300, 'CAPTURED!', '#44ff44');
        defender.hull = 0; // Mark as out of combat
        defender.captured = true;
        player.stats.shipsBoarded++;
        return true;
    } else {
        combatLog.push(`${attacker.name} boarding failed!`);
        addFloatingText(WIDTH / 2, 300, 'BOARDING FAILED', '#ff8844');
        return true;
    }
}

function endPlayerTurn() {
    turnPhase = 'enemy';
    combat.isPlayerTurn = false;
    setTimeout(executeEnemyTurn, 500);
}

function executeEnemyTurn() {
    let actedThisTurn = false;

    for (const enemy of combat.enemyFleet) {
        if (enemy.hull <= 0 || enemy.sails < 15) continue;

        // Ghost ship attacks 3 times
        const attackCount = enemy.isGhostShip ? 3 : 1;

        for (let i = 0; i < attackCount; i++) {
            // Find target (lowest HP player ship)
            const validTargets = player.fleet.filter(s => s.hull > 0);
            if (validTargets.length === 0) break;

            validTargets.sort((a, b) => a.hull - b.hull);
            const target = validTargets[0];

            if (enemy.ap >= 25) {
                executeAttack(enemy, target, 'hull');
                actedThisTurn = true;
            } else if (enemy.ap >= 15) {
                executeAttack(enemy, target, 'quick');
                actedThisTurn = true;
            }
        }
    }

    setTimeout(() => {
        checkCombatEnd();
        if (gameState === 'combat') {
            // Reset AP for next round
            player.fleet.forEach(s => {
                if (s.hull > 0) {
                    s.ap = getShipStat(s, 'sails');
                }
            });
            combat.enemyFleet.forEach(s => {
                if (s.hull > 0) {
                    s.ap = s.sails;
                }
            });
            turnPhase = 'player';
            combat.isPlayerTurn = true;
            selectedShip = player.fleet.find(s => s.hull > 0) || null;
        }
    }, 500);
}

function checkCombatEnd() {
    const playerAlive = player.fleet.some(s => s.hull > 0);
    const enemyAlive = combat.enemyFleet.some(s => s.hull > 0 && !s.captured);

    if (!playerAlive) {
        gameState = 'defeat';
        return;
    }

    if (!enemyAlive) {
        endCombat(true);
        return;
    }
}

function endCombat(victory) {
    if (victory) {
        // Calculate rewards
        let goldReward = 0;
        let wpReward = 0;

        combat.enemyFleet.forEach(enemy => {
            if (enemy.isGhostShip) {
                goldReward += 50000;
                wpReward += 1000;
                player.ghostShipDamage = 30000; // Mark as defeated
            } else {
                const baseHP = SHIP_TYPES[enemy.type]?.hull || 100;
                if (baseHP < 200) { goldReward += 200; wpReward += 7; }
                else if (baseHP < 400) { goldReward += 550; wpReward += 20; }
                else { goldReward += 1400; wpReward += 40; }

                if (enemy.captured) {
                    goldReward *= 1.5;
                    wpReward *= 1.5;
                    // Add captured ship to fleet if space
                    if (player.fleet.length < 5) {
                        const newShip = createShip(enemy.type);
                        newShip.hull = Math.floor(newShip.maxHull * 0.3);
                        player.fleet.push(newShip);
                        combatLog.push(`${enemy.name} added to your fleet!`);
                    }
                }
            }
            player.stats.shipsSunk++;
        });

        player.gold += Math.floor(goldReward);
        player.warPoints += Math.floor(wpReward);

        // Use consumables
        if (player.consumables.dynamite > 0) player.consumables.dynamite--;
        else if (player.consumables.powder > 0) player.consumables.powder--;

        combatLog.push(`Victory! +${Math.floor(goldReward)} gold, +${Math.floor(wpReward)} WP`);

        // Check boss victory
        if (combat.isBossFight && combat.portId) {
            const port = PORTS.find(p => p.id === combat.portId);
            if (port) {
                port.liberated = true;
                combatLog.push(`${port.name} liberated!`);
            }

            // Check Ghost Ship victory
            if (combat.enemyFleet.some(e => e.isGhostShip)) {
                setTimeout(() => { gameState = 'victory'; }, 2000);
                return;
            }
        }

        day++;
        setTimeout(() => { gameState = 'map'; }, 2000);
    }
}

// Port Functions
function enterPort(port) {
    player.currentPort = port;
    generatePortPrices(port);
    gameState = 'port';
}

function generatePortPrices(port) {
    currentPortPrices = {};
    for (const [key, good] of Object.entries(TRADE_GOODS)) {
        if (good.unlockPort <= port.id || port.liberated) {
            const isBuying = Math.random() > 0.5;
            currentPortPrices[key] = {
                buy: isBuying ? good.buyLow : good.buyHigh,
                sell: isBuying ? good.sellHigh : good.sellLow
            };
        }
    }
}

// Rendering Functions
function drawGradientBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#1a3a5c');
    grad.addColorStop(1, '#0a1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawTitle() {
    drawGradientBackground();

    // Ocean waves
    ctx.fillStyle = '#0d4a6f';
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 400 + i * 40);
        for (let x = 0; x <= WIDTH; x += 50) {
            ctx.lineTo(x, 400 + i * 40 + Math.sin(x / 50 + i) * 10);
        }
        ctx.lineTo(WIDTH, HEIGHT);
        ctx.lineTo(0, HEIGHT);
        ctx.fill();
    }

    // Ship silhouette
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.moveTo(500, 380);
    ctx.lineTo(780, 380);
    ctx.lineTo(800, 400);
    ctx.lineTo(480, 400);
    ctx.closePath();
    ctx.fill();

    // Mast
    ctx.fillRect(620, 280, 8, 100);

    // Sail
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(624, 290);
    ctx.lineTo(700, 320);
    ctx.lineTo(624, 370);
    ctx.closePath();
    ctx.fill();

    // Title
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 72px Georgia';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.fillText('Caribbean Admiral', WIDTH / 2, 150);

    ctx.font = '24px Georgia';
    ctx.fillStyle = '#aaa';
    ctx.fillText('A Naval Strategy Game', WIDTH / 2, 200);

    // Buttons
    ctx.shadowBlur = 0;
    drawButton(WIDTH / 2 - 100, 500, 200, 50, 'New Game', '#4a6b4a');
    drawButton(WIDTH / 2 - 100, 570, 200, 50, 'Continue', '#4a5a6b');

    // Instructions
    ctx.fillStyle = '#888';
    ctx.font = '16px Georgia';
    ctx.fillText('Rebuild your fleet. Defeat the Ghost Ship. Save your sister.', WIDTH / 2, 660);
}

function drawButton(x, y, w, h, text, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
}

function drawMap() {
    drawGradientBackground();

    // Draw ocean texture
    ctx.fillStyle = '#0d3d5f';
    for (let x = 0; x < WIDTH; x += 100) {
        for (let y = 0; y < HEIGHT; y += 100) {
            if ((x + y) % 200 === 0) {
                ctx.fillRect(x, y, 100, 100);
            }
        }
    }

    // Draw connections
    ctx.strokeStyle = '#4a6a8a';
    ctx.lineWidth = 2;
    const connections = [
        [0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5], [4, 6], [5, 7], [6, 7], [6, 8], [7, 9], [8, 9]
    ];
    connections.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(PORTS[a].x, PORTS[a].y);
        ctx.lineTo(PORTS[b].x, PORTS[b].y);
        ctx.stroke();
    });

    // Draw ports
    PORTS.forEach(port => {
        const isNear = Math.hypot(player.mapX - port.x, player.mapY - port.y) < 60;

        // Port circle
        ctx.beginPath();
        ctx.arc(port.x, port.y, isNear ? 35 : 30, 0, Math.PI * 2);
        ctx.fillStyle = port.liberated ? '#4a8a4a' : '#8a4a4a';
        ctx.fill();
        ctx.strokeStyle = isNear ? '#fff' : '#d4af37';
        ctx.lineWidth = isNear ? 3 : 2;
        ctx.stroke();

        // Port name
        ctx.fillStyle = '#fff';
        ctx.font = '14px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(port.name, port.x, port.y + 50);
        ctx.fillText(`Port ${port.id}`, port.x, port.y + 65);

        // Status icon (text instead of emoji for compatibility)
        ctx.font = 'bold 16px Georgia';
        ctx.fillText(port.liberated ? 'FREE' : 'PIRATE', port.x, port.y + 8);
    });

    // Draw player ship
    ctx.save();
    ctx.translate(player.mapX, player.mapY);
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(10, 15);
    ctx.lineTo(-10, 15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // HUD
    drawHUD();

    // Instructions
    ctx.fillStyle = '#aaa';
    ctx.font = '16px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('Click on a port to sail there. Click near current position for random encounter.', WIDTH / 2, HEIGHT - 20);
}

function drawHUD() {
    // Top bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, WIDTH, 50);

    ctx.fillStyle = '#d4af37';
    ctx.font = '18px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText(`Gold: ${player.gold.toLocaleString()}`, 20, 32);
    ctx.fillText(`War Points: ${player.warPoints}`, 200, 32);
    ctx.fillText(`Day: ${day}`, 380, 32);
    ctx.fillText(`Fleet: ${player.fleet.length}/5`, 480, 32);
    ctx.fillText(`HP: ${getFleetTotalHP()}`, 600, 32);
    ctx.fillText(`Cargo: ${getCargoUsed()}/${getFleetCargo()}`, 720, 32);
}

function drawCombat() {
    drawGradientBackground();

    // Ocean background for combat
    ctx.fillStyle = '#0d3d5f';
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 100 + i * 25);
        for (let x = 0; x <= WIDTH; x += 30) {
            ctx.lineTo(x, 100 + i * 25 + Math.sin(x / 40 + waveOffset + i) * 5);
        }
        ctx.lineTo(WIDTH, HEIGHT);
        ctx.lineTo(0, HEIGHT);
        ctx.fill();
    }

    // Enemy fleet
    ctx.fillStyle = '#fff';
    ctx.font = '20px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('Enemy Fleet', WIDTH * 0.7, 80);

    combat.enemyFleet.forEach((ship, i) => {
        const x = WIDTH * 0.5 + i * 160;
        const y = 130;
        const isSelected = selectedEnemy === ship;
        const isAlive = ship.hull > 0 && !ship.captured;

        // Ship box
        ctx.fillStyle = isAlive ? (isSelected ? '#6a4a4a' : '#4a2a2a') : '#2a2a2a';
        ctx.fillRect(x, y, 140, 120);
        ctx.strokeStyle = isSelected ? '#ff8888' : '#8a4a4a';
        ctx.lineWidth = isSelected ? 3 : 1;
        ctx.strokeRect(x, y, 140, 120);

        if (!isAlive) {
            ctx.fillStyle = '#888';
            ctx.font = '16px Georgia';
            ctx.fillText(ship.captured ? 'CAPTURED' : 'SUNK', x + 70, y + 70);
            return;
        }

        ctx.fillStyle = '#fff';
        ctx.font = '14px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(ship.name, x + 70, y + 25);

        // HP bar
        const hpPct = ship.hull / ship.maxHull;
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 10, y + 40, 120, 12);
        ctx.fillStyle = hpPct > 0.5 ? '#4a8a4a' : hpPct > 0.25 ? '#8a8a4a' : '#8a4a4a';
        ctx.fillRect(x + 10, y + 40, 120 * hpPct, 12);

        ctx.fillStyle = '#aaa';
        ctx.font = '12px Georgia';
        ctx.textAlign = 'left';
        ctx.fillText(`Hull: ${ship.hull}/${ship.maxHull}`, x + 10, y + 70);
        ctx.fillText(`Sails: ${ship.sails}`, x + 10, y + 85);
        ctx.fillText(`Crew: ${ship.crew}`, x + 10, y + 100);
        ctx.fillText(`AP: ${ship.ap}`, x + 80, y + 100);
    });

    // Player fleet
    ctx.fillStyle = '#fff';
    ctx.font = '20px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('Your Fleet', WIDTH * 0.3, 320);

    player.fleet.forEach((ship, i) => {
        const x = 50 + i * 160;
        const y = 380;
        const isSelected = selectedShip === ship;
        const isAlive = ship.hull > 0;

        // Ship box
        ctx.fillStyle = isAlive ? (isSelected ? '#4a6a4a' : '#2a4a2a') : '#2a2a2a';
        ctx.fillRect(x, y, 140, 120);
        ctx.strokeStyle = isSelected ? '#88ff88' : '#4a8a4a';
        ctx.lineWidth = isSelected ? 3 : 1;
        ctx.strokeRect(x, y, 140, 120);

        if (!isAlive) {
            ctx.fillStyle = '#888';
            ctx.font = '16px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText('DESTROYED', x + 70, y + 70);
            return;
        }

        ctx.fillStyle = '#fff';
        ctx.font = '14px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(ship.name, x + 70, y + 25);

        // HP bar
        const hpPct = ship.hull / getShipStat(ship, 'hull');
        ctx.fillStyle = '#333';
        ctx.fillRect(x + 10, y + 40, 120, 12);
        ctx.fillStyle = hpPct > 0.5 ? '#4a8a4a' : hpPct > 0.25 ? '#8a8a4a' : '#8a4a4a';
        ctx.fillRect(x + 10, y + 40, 120 * hpPct, 12);

        ctx.fillStyle = '#aaa';
        ctx.font = '12px Georgia';
        ctx.textAlign = 'left';
        ctx.fillText(`Hull: ${ship.hull}/${getShipStat(ship, 'hull')}`, x + 10, y + 70);
        ctx.fillText(`Dmg: ${getShipStat(ship, 'damage')}`, x + 10, y + 85);
        ctx.fillText(`AP: ${ship.ap}/${ship.maxAp}`, x + 10, y + 100);
    });

    // Attack buttons
    if (combat.isPlayerTurn && selectedShip && selectedShip.hull > 0) {
        const attacks = ['hull', 'sail', 'crew', 'quick', 'board'];
        attacks.forEach((atk, i) => {
            const x = 100 + i * 150;
            const y = 540;
            const attack = ATTACKS[atk];
            const canUse = selectedShip.ap >= attack.apCost;
            const isSelected = selectedAttack === atk;

            ctx.fillStyle = isSelected ? '#6a8a6a' : (canUse ? '#4a6a4a' : '#3a3a3a');
            ctx.fillRect(x, y, 130, 60);
            ctx.strokeStyle = isSelected ? '#aaffaa' : '#6a8a6a';
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.strokeRect(x, y, 130, 60);

            ctx.fillStyle = canUse ? '#fff' : '#666';
            ctx.font = '14px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText(attack.name, x + 65, y + 25);
            ctx.font = '12px Georgia';
            ctx.fillText(`${attack.apCost} AP`, x + 65, y + 45);
        });

        // End turn button
        drawButton(950, 540, 120, 60, 'End Turn', '#6a4a4a');
    }

    // Combat log
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(850, 100, 400, 200);
    ctx.strokeStyle = '#4a4a4a';
    ctx.strokeRect(850, 100, 400, 200);

    ctx.fillStyle = '#aaa';
    ctx.font = '12px Georgia';
    ctx.textAlign = 'left';
    const logStart = Math.max(0, combatLog.length - 8);
    combatLog.slice(logStart).forEach((msg, i) => {
        ctx.fillText(msg.substring(0, 50), 860, 125 + i * 22);
    });

    // Turn indicator
    ctx.fillStyle = combat.isPlayerTurn ? '#88ff88' : '#ff8888';
    ctx.font = 'bold 24px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(combat.isPlayerTurn ? 'YOUR TURN' : 'ENEMY TURN', WIDTH / 2, 630);

    // Draw floating texts
    drawFloatingTexts();
}

function drawPort() {
    drawGradientBackground();

    const port = player.currentPort;

    // Port header (moved down to not overlap HUD)
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 36px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(port.name, WIDTH / 2, 90);
    ctx.font = '18px Georgia';
    ctx.fillStyle = port.liberated ? '#88ff88' : '#ff8888';
    ctx.fillText(port.liberated ? 'Liberated Port' : 'Pirate Controlled', WIDTH / 2, 115);

    // Port actions
    const actions = [
        { name: 'Market', desc: 'Buy and sell goods', action: 'trading' },
        { name: 'Shipyard', desc: 'Buy ships, upgrade', action: 'shipyard' },
        { name: 'Dry Dock', desc: 'Repair your fleet', action: 'repair' },
        { name: 'Armory', desc: 'Buy combat items', action: 'armory' },
        { name: 'Set Sail', desc: 'Return to map', action: 'map' }
    ];

    if (!port.liberated) {
        actions.unshift({ name: 'Attack Pirates!', desc: 'Liberate this port', action: 'boss' });
    }

    actions.forEach((act, i) => {
        const x = 100;
        const y = 120 + i * 80;

        ctx.fillStyle = act.action === 'boss' ? '#6a3a3a' : '#3a4a5a';
        ctx.fillRect(x, y, 400, 65);
        ctx.strokeStyle = '#6a8aaa';
        ctx.strokeRect(x, y, 400, 65);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Georgia';
        ctx.textAlign = 'left';
        ctx.fillText(act.name, x + 20, y + 30);
        ctx.font = '14px Georgia';
        ctx.fillStyle = '#aaa';
        ctx.fillText(act.desc, x + 20, y + 50);
    });

    // Right panel - fleet info
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(550, 120, 700, 550);

    ctx.fillStyle = '#d4af37';
    ctx.font = '24px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('Your Fleet', 570, 160);

    player.fleet.forEach((ship, i) => {
        const y = 190 + i * 70;
        ctx.fillStyle = '#4a6a4a';
        ctx.fillRect(570, y, 660, 60);
        ctx.strokeStyle = '#6a8a6a';
        ctx.strokeRect(570, y, 660, 60);

        ctx.fillStyle = '#fff';
        ctx.font = '16px Georgia';
        ctx.fillText(ship.name, 580, y + 25);
        ctx.font = '12px Georgia';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`Hull: ${ship.hull}/${getShipStat(ship, 'hull')} | Dmg: ${getShipStat(ship, 'damage')} | Crew: ${getShipStat(ship, 'crew')} | Cargo: ${getShipStat(ship, 'cargo')}`, 580, y + 45);
    });

    // HUD
    drawHUD();
}

function drawTrading() {
    drawGradientBackground();

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 32px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('Market - ' + player.currentPort.name, WIDTH / 2, 50);

    // Goods list
    let y = 100;
    ctx.font = '16px Georgia';
    ctx.textAlign = 'left';

    ctx.fillStyle = '#aaa';
    ctx.fillText('Good', 50, y);
    ctx.fillText('Buy', 180, y);
    ctx.fillText('Sell', 280, y);
    ctx.fillText('Profit', 380, y);
    ctx.fillText('Owned', 470, y);
    ctx.fillText('Actions', 560, y);

    y += 30;

    for (const [key, good] of Object.entries(TRADE_GOODS)) {
        if (!currentPortPrices[key]) continue;

        const buyPrice = currentPortPrices[key].buy;
        const sellPrice = currentPortPrices[key].sell;
        const profit = sellPrice - buyPrice;
        const profitPct = Math.round((profit / buyPrice) * 100);

        ctx.fillStyle = '#3a4a5a';
        ctx.fillRect(40, y - 5, 1000, 40);

        ctx.fillStyle = '#fff';
        ctx.font = '14px Georgia';
        ctx.fillText(good.name, 50, y + 20);
        ctx.fillText(buyPrice.toLocaleString(), 180, y + 20);
        ctx.fillText(sellPrice.toLocaleString(), 280, y + 20);
        ctx.fillStyle = profit > 0 ? '#88ff88' : '#ff8888';
        ctx.fillText(`+${profitPct}%`, 380, y + 20);
        ctx.fillStyle = '#fff';
        ctx.fillText(player.cargo[key] || 0, 470, y + 20);

        // Buy/Sell buttons
        drawButton(560, y, 50, 30, 'Buy', '#4a6a4a');
        drawButton(615, y, 50, 30, 'x10', '#3a5a3a');
        drawButton(670, y, 50, 30, 'Sell', '#6a4a4a');
        drawButton(725, y, 50, 30, 'All', '#5a3a3a');

        y += 50;
    }

    // Back button
    drawButton(50, HEIGHT - 80, 150, 50, 'Back to Port', '#4a4a6a');

    // Cargo info
    ctx.fillStyle = '#d4af37';
    ctx.font = '20px Georgia';
    ctx.textAlign = 'right';
    ctx.fillText(`Cargo: ${getCargoUsed()}/${getFleetCargo()}`, WIDTH - 50, 50);
    ctx.fillText(`Gold: ${player.gold.toLocaleString()}`, WIDTH - 50, 80);
}

function drawShipyard() {
    drawGradientBackground();

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 32px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('Shipyard - ' + player.currentPort.name, WIDTH / 2, 50);

    // Available ships
    let y = 100;
    let col = 0;

    for (const [type, ship] of Object.entries(SHIP_TYPES)) {
        if (ship.cost === 0) continue;

        const x = 50 + col * 400;
        const canBuy = player.gold >= ship.cost && player.fleet.length < 5;

        ctx.fillStyle = canBuy ? '#3a4a5a' : '#2a2a3a';
        ctx.fillRect(x, y, 380, 100);
        ctx.strokeStyle = canBuy ? '#6a8aaa' : '#4a4a5a';
        ctx.strokeRect(x, y, 380, 100);

        ctx.fillStyle = canBuy ? '#fff' : '#666';
        ctx.font = 'bold 18px Georgia';
        ctx.textAlign = 'left';
        ctx.fillText(ship.name, x + 10, y + 25);

        ctx.font = '12px Georgia';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`Hull: ${ship.hull} | Sails: ${ship.sails} | Crew: ${ship.crew}`, x + 10, y + 50);
        ctx.fillText(`Cargo: ${ship.cargo} | Damage: ${ship.damage}`, x + 10, y + 70);

        ctx.fillStyle = '#d4af37';
        ctx.fillText(`${ship.cost.toLocaleString()} gold`, x + 280, y + 25);

        if (canBuy) {
            drawButton(x + 280, y + 50, 80, 35, 'Buy', '#4a6a4a');
        }

        col++;
        if (col >= 3) {
            col = 0;
            y += 120;
        }
    }

    // Upgrade section
    y = 420;
    ctx.fillStyle = '#d4af37';
    ctx.font = '24px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('Upgrade Ships (War Points)', 50, y);

    y += 40;
    player.fleet.forEach((ship, i) => {
        ctx.fillStyle = '#3a4a5a';
        ctx.fillRect(50, y, 1180, 50);

        ctx.fillStyle = '#fff';
        ctx.font = '16px Georgia';
        ctx.fillText(`${ship.name} [Hull:${ship.upgrades.hull} Sails:${ship.upgrades.sails} Crew:${ship.upgrades.crew} Cargo:${ship.upgrades.cargo} Dmg:${ship.upgrades.damage}]`, 60, y + 30);

        // Quick upgrade buttons
        const stats = ['hull', 'sails', 'crew', 'cargo', 'damage'];
        const costs = [10, 15, 8, 5, 20];
        stats.forEach((stat, si) => {
            const bx = 600 + si * 110;
            const level = ship.upgrades[stat];
            const cost = costs[si] * (level + 1);
            const canUpgrade = level < 5 && player.warPoints >= cost;

            ctx.fillStyle = canUpgrade ? '#4a6a4a' : '#3a3a3a';
            ctx.fillRect(bx, y + 10, 100, 30);
            ctx.fillStyle = canUpgrade ? '#fff' : '#666';
            ctx.font = '11px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText(`${stat.charAt(0).toUpperCase() + stat.slice(1)} (${cost}WP)`, bx + 50, y + 30);
        });

        y += 60;
    });

    // Back button
    drawButton(50, HEIGHT - 80, 150, 50, 'Back to Port', '#4a4a6a');

    // Info
    ctx.fillStyle = '#d4af37';
    ctx.font = '20px Georgia';
    ctx.textAlign = 'right';
    ctx.fillText(`War Points: ${player.warPoints}`, WIDTH - 50, 50);
    ctx.fillText(`Gold: ${player.gold.toLocaleString()}`, WIDTH - 50, 80);
}

function drawArmory() {
    drawGradientBackground();

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 32px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('Armory - ' + player.currentPort.name, WIDTH / 2, 80);

    // Current consumables
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(50, 120, 500, 100);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('Your Consumables:', 70, 155);
    ctx.fillText(`Powder: ${player.consumables.powder}`, 70, 185);
    ctx.fillText(`Dynamite: ${player.consumables.dynamite}`, 250, 185);

    // Items to buy
    const items = [
        { name: 'Powder', desc: '1.5x damage for one battle', cost: 500, key: 'powder' },
        { name: 'Dynamite', desc: '3.0x damage for one battle', cost: 5000, key: 'dynamite' }
    ];

    items.forEach((item, i) => {
        const y = 260 + i * 120;
        const canBuy = player.gold >= item.cost;

        ctx.fillStyle = canBuy ? '#3a4a5a' : '#2a2a3a';
        ctx.fillRect(50, y, 600, 100);
        ctx.strokeStyle = '#6a8aaa';
        ctx.strokeRect(50, y, 600, 100);

        ctx.fillStyle = canBuy ? '#fff' : '#666';
        ctx.font = 'bold 24px Georgia';
        ctx.textAlign = 'left';
        ctx.fillText(item.name, 70, y + 35);

        ctx.font = '16px Georgia';
        ctx.fillStyle = '#aaa';
        ctx.fillText(item.desc, 70, y + 60);

        ctx.fillStyle = '#d4af37';
        ctx.fillText(`${item.cost.toLocaleString()} gold`, 70, y + 85);

        if (canBuy) {
            drawButton(480, y + 30, 120, 50, 'Buy', '#4a6a4a');
        }
    });

    // Back button
    drawButton(50, HEIGHT - 80, 150, 50, 'Back to Port', '#4a4a6a');

    // HUD
    drawHUD();
}

function drawVictory() {
    drawGradientBackground();

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', WIDTH / 2, 150);

    ctx.font = '24px Georgia';
    ctx.fillStyle = '#fff';
    ctx.fillText('You defeated the Ghost Ship and saved your sister!', WIDTH / 2, 220);

    ctx.font = '18px Georgia';
    ctx.fillStyle = '#aaa';
    const stats = [
        `Days Survived: ${day}`,
        `Ships Sunk: ${player.stats.shipsSunk}`,
        `Ships Boarded: ${player.stats.shipsBoarded}`,
        `Goods Traded: ${player.stats.goodsTraded}`,
        `Final Gold: ${player.gold.toLocaleString()}`,
        `Fleet Size: ${player.fleet.length}`
    ];

    stats.forEach((stat, i) => {
        ctx.fillText(stat, WIDTH / 2, 300 + i * 35);
    });

    drawButton(WIDTH / 2 - 100, 550, 200, 50, 'Play Again', '#4a6a4a');
}

function drawDefeat() {
    drawGradientBackground();

    ctx.fillStyle = '#8a4a4a';
    ctx.font = 'bold 48px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('DEFEAT', WIDTH / 2, 150);

    ctx.font = '24px Georgia';
    ctx.fillStyle = '#fff';
    ctx.fillText('Your fleet has been destroyed.', WIDTH / 2, 220);

    ctx.font = '18px Georgia';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`Days Survived: ${day}`, WIDTH / 2, 300);
    ctx.fillText(`Ships Sunk: ${player.stats.shipsSunk}`, WIDTH / 2, 335);

    drawButton(WIDTH / 2 - 100, 450, 200, 50, 'Try Again', '#4a6a4a');
}

function addFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 60 });
}

// Visual Effects Functions
function addScreenShake(intensity) {
    screenShake = Math.max(screenShake, intensity);
}

function addParticle(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 30 + Math.random() * 20,
            color,
            size: 2 + Math.random() * 4
        });
    }
}

function addCannonball(fromX, fromY, toX, toY) {
    cannonballs.push({
        x: fromX, y: fromY,
        targetX: toX, targetY: toY,
        progress: 0,
        speed: 0.1
    });
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // gravity
        p.life--;
        return p.life > 0;
    });
}

function updateCannonballs() {
    cannonballs = cannonballs.filter(cb => {
        cb.progress += cb.speed;
        if (cb.progress >= 1) {
            addParticle(cb.targetX, cb.targetY, '#ff8800', 8);
            addScreenShake(5);
            return false;
        }
        return true;
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 50;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawCannonballs() {
    cannonballs.forEach(cb => {
        const x = cb.x + (cb.targetX - cb.x) * cb.progress;
        const y = cb.y + (cb.targetY - cb.y) * cb.progress - Math.sin(cb.progress * Math.PI) * 50;

        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(x - 3, y + 2, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawFloatingTexts() {
    floatingTexts = floatingTexts.filter(ft => {
        ft.life--;
        ft.y -= 1;

        ctx.globalAlpha = ft.life / 60;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 20px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;

        return ft.life > 0;
    });
}

// Input Handling
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    handleClick(x, y);
});

function handleClick(x, y) {
    if (gameState === 'title') {
        if (x >= WIDTH / 2 - 100 && x <= WIDTH / 2 + 100) {
            if (y >= 500 && y <= 550) {
                initGame();
            }
        }
    } else if (gameState === 'map') {
        // Check port clicks
        for (const port of PORTS) {
            const dist = Math.hypot(x - port.x, y - port.y);
            if (dist < 40) {
                // Travel to port
                const travelDist = Math.hypot(player.mapX - port.x, player.mapY - port.y);
                const travelDays = Math.ceil(travelDist / 100);

                // Random encounter chance
                if (Math.random() < 0.15 * travelDays) {
                    const region = Math.ceil(port.id / 2);
                    const enemyTypes = [
                        ['sloop'],
                        ['sloop', 'schooner', 'cutter'],
                        ['schooner', 'brig', 'brigantine'],
                        ['brig', 'corvette', 'frigate'],
                        ['frigate', 'manowar']
                    ];
                    const regionTypes = enemyTypes[Math.min(region - 1, enemyTypes.length - 1)];
                    const enemyCount = Math.min(4, 1 + Math.floor(region / 2) + (Math.random() > 0.7 ? 1 : 0));
                    const enemyFleet = [];
                    for (let i = 0; i < enemyCount; i++) {
                        const typeIndex = Math.floor(Math.random() * regionTypes.length);
                        enemyFleet.push(regionTypes[typeIndex]);
                    }
                    combatLog = [`Pirate attack! ${enemyCount} ships incoming!`];
                    startCombat(enemyFleet, false, null);
                } else {
                    player.mapX = port.x;
                    player.mapY = port.y;
                    day += travelDays;
                    enterPort(port);
                }
                return;
            }
        }
    } else if (gameState === 'port') {
        const port = player.currentPort;
        const actions = [];
        if (!port.liberated) {
            actions.push({ name: 'boss', y: 120 });
        }
        actions.push({ name: 'trading', y: port.liberated ? 120 : 200 });
        actions.push({ name: 'shipyard', y: port.liberated ? 200 : 280 });
        actions.push({ name: 'repair', y: port.liberated ? 280 : 360 });
        actions.push({ name: 'armory', y: port.liberated ? 360 : 440 });
        actions.push({ name: 'map', y: port.liberated ? 440 : 520 });

        for (const act of actions) {
            if (x >= 100 && x <= 500 && y >= act.y && y <= act.y + 65) {
                if (act.name === 'boss') {
                    startCombat(port.bossFleet, true, port.id);
                } else if (act.name === 'trading') {
                    gameState = 'trading';
                } else if (act.name === 'shipyard') {
                    gameState = 'shipyard';
                } else if (act.name === 'repair') {
                    // Repair all ships
                    let cost = 0;
                    player.fleet.forEach(ship => {
                        const maxHull = getShipStat(ship, 'hull');
                        const damage = maxHull - ship.hull;
                        cost += Math.floor(damage / 2);
                    });
                    if (player.gold >= cost) {
                        player.gold -= cost;
                        player.fleet.forEach(ship => {
                            ship.hull = getShipStat(ship, 'hull');
                        });
                        addFloatingText(300, 360, `-${cost} gold, Fleet repaired!`, '#88ff88');
                    }
                } else if (act.name === 'armory') {
                    gameState = 'armory';
                } else if (act.name === 'map') {
                    gameState = 'map';
                }
                return;
            }
        }
    } else if (gameState === 'trading') {
        // Back button
        if (x >= 50 && x <= 200 && y >= HEIGHT - 80 && y <= HEIGHT - 30) {
            gameState = 'port';
            return;
        }

        // Buy/Sell buttons
        let row = 0;
        for (const [key, good] of Object.entries(TRADE_GOODS)) {
            if (!currentPortPrices[key]) continue;

            const rowY = 130 + row * 50;
            const price = currentPortPrices[key].buy;
            const sellPrice = currentPortPrices[key].sell;

            // Buy 1
            if (x >= 560 && x <= 610 && y >= rowY && y <= rowY + 30) {
                if (player.gold >= price && getCargoUsed() < getFleetCargo()) {
                    player.gold -= price;
                    player.cargo[key] = (player.cargo[key] || 0) + 1;
                    player.stats.goodsTraded++;
                }
                return;
            }

            // Buy 10
            if (x >= 615 && x <= 665 && y >= rowY && y <= rowY + 30) {
                for (let i = 0; i < 10; i++) {
                    if (player.gold >= price && getCargoUsed() < getFleetCargo()) {
                        player.gold -= price;
                        player.cargo[key] = (player.cargo[key] || 0) + 1;
                        player.stats.goodsTraded++;
                    }
                }
                return;
            }

            // Sell 1
            if (x >= 670 && x <= 720 && y >= rowY && y <= rowY + 30) {
                if (player.cargo[key] > 0) {
                    player.gold += sellPrice;
                    player.cargo[key]--;
                    player.stats.goodsTraded++;
                }
                return;
            }

            // Sell All
            if (x >= 725 && x <= 775 && y >= rowY && y <= rowY + 30) {
                while (player.cargo[key] > 0) {
                    player.gold += sellPrice;
                    player.cargo[key]--;
                    player.stats.goodsTraded++;
                }
                return;
            }

            row++;
        }
    } else if (gameState === 'armory') {
        // Back button
        if (x >= 50 && x <= 200 && y >= HEIGHT - 80 && y <= HEIGHT - 30) {
            gameState = 'port';
            return;
        }

        // Buy Powder
        if (x >= 480 && x <= 600 && y >= 290 && y <= 340) {
            if (player.gold >= 500) {
                player.gold -= 500;
                player.consumables.powder++;
                addFloatingText(500, 300, 'Powder +1', '#88ff88');
            }
            return;
        }

        // Buy Dynamite
        if (x >= 480 && x <= 600 && y >= 410 && y <= 460) {
            if (player.gold >= 5000) {
                player.gold -= 5000;
                player.consumables.dynamite++;
                addFloatingText(500, 420, 'Dynamite +1', '#88ff88');
            }
            return;
        }
    } else if (gameState === 'shipyard') {
        // Back button
        if (x >= 50 && x <= 200 && y >= HEIGHT - 80 && y <= HEIGHT - 30) {
            gameState = 'port';
            return;
        }

        // Buy ships
        let row = 0;
        let col = 0;
        for (const [type, ship] of Object.entries(SHIP_TYPES)) {
            if (ship.cost === 0) continue;

            const bx = 50 + col * 400;
            const by = 100 + row * 120;

            if (x >= bx + 280 && x <= bx + 360 && y >= by + 50 && y <= by + 85) {
                if (player.gold >= ship.cost && player.fleet.length < 5) {
                    player.gold -= ship.cost;
                    player.fleet.push(createShip(type));
                }
                return;
            }

            col++;
            if (col >= 3) {
                col = 0;
                row++;
            }
        }

        // Upgrade buttons
        player.fleet.forEach((ship, i) => {
            const rowY = 460 + i * 60;
            const stats = ['hull', 'sails', 'crew', 'cargo', 'damage'];
            const costs = [10, 15, 8, 5, 20];

            stats.forEach((stat, si) => {
                const bx = 600 + si * 110;
                if (x >= bx && x <= bx + 100 && y >= rowY + 10 && y <= rowY + 40) {
                    const level = ship.upgrades[stat];
                    const cost = costs[si] * (level + 1);
                    if (level < 5 && player.warPoints >= cost) {
                        player.warPoints -= cost;
                        ship.upgrades[stat]++;
                        // Update ship stats
                        ship.maxHull = getShipStat(ship, 'hull');
                        ship.maxSails = getShipStat(ship, 'sails');
                        ship.maxCrew = getShipStat(ship, 'crew');
                    }
                    return;
                }
            });
        });
    } else if (gameState === 'combat') {
        if (!combat.isPlayerTurn) return;

        // Select player ship
        player.fleet.forEach((ship, i) => {
            const sx = 50 + i * 160;
            const sy = 380;
            if (x >= sx && x <= sx + 140 && y >= sy && y <= sy + 120) {
                if (ship.hull > 0) {
                    selectedShip = ship;
                }
            }
        });

        // Select enemy ship
        combat.enemyFleet.forEach((ship, i) => {
            const sx = WIDTH * 0.5 + i * 160;
            const sy = 150;
            if (x >= sx && x <= sx + 140 && y >= sy && y <= sy + 120) {
                if (ship.hull > 0 && !ship.captured) {
                    selectedEnemy = ship;
                }
            }
        });

        // Select attack
        const attacks = ['hull', 'sail', 'crew', 'quick', 'board'];
        attacks.forEach((atk, i) => {
            const ax = 100 + i * 150;
            const ay = 540;
            if (x >= ax && x <= ax + 130 && y >= ay && y <= ay + 60) {
                selectedAttack = atk;
            }
        });

        // Execute attack if all selected
        if (selectedShip && selectedEnemy && selectedAttack) {
            if (executeAttack(selectedShip, selectedEnemy, selectedAttack)) {
                selectedAttack = null;
                selectedEnemy = null;
                checkCombatEnd();
            }
        }

        // End turn button
        if (x >= 950 && x <= 1070 && y >= 540 && y <= 600) {
            endPlayerTurn();
        }
    } else if (gameState === 'victory' || gameState === 'defeat') {
        if (x >= WIDTH / 2 - 100 && x <= WIDTH / 2 + 100 && y >= 450 && y <= 600) {
            gameState = 'title';
        }
    }
}

// Game Loop
function gameLoop() {
    // Update effects
    waveOffset += 0.02;
    updateParticles();
    updateCannonballs();

    // Apply screen shake
    ctx.save();
    if (screenShake > 0) {
        ctx.translate(
            (Math.random() - 0.5) * screenShake,
            (Math.random() - 0.5) * screenShake
        );
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }

    ctx.clearRect(-20, -20, WIDTH + 40, HEIGHT + 40);

    if (gameState === 'title') {
        drawTitle();
    } else if (gameState === 'map') {
        drawMap();
    } else if (gameState === 'port') {
        drawPort();
    } else if (gameState === 'trading') {
        drawTrading();
    } else if (gameState === 'shipyard') {
        drawShipyard();
    } else if (gameState === 'armory') {
        drawArmory();
    } else if (gameState === 'combat') {
        drawCombat();
        drawCannonballs();
        drawParticles();
    } else if (gameState === 'victory') {
        drawVictory();
    } else if (gameState === 'defeat') {
        drawDefeat();
    }

    ctx.restore();

    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
