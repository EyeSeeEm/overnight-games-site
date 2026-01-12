/*
 * High Tea v2 - LittleJS Implementation
 * A historical trading strategy game about the British opium trade
 */

'use strict';

// ============================================================================
// COLORS
// ============================================================================

const COLORS = {
    background: new Color(0.16, 0.09, 0.06),
    sepia: new Color(0.44, 0.33, 0.21),
    tea: new Color(0.58, 0.42, 0.22),
    ocean: new Color(0.15, 0.30, 0.45),
    opium: new Color(0.40, 0.20, 0.40),
    silver: new Color(0.75, 0.75, 0.80),
    gold: new Color(0.85, 0.65, 0.13),
    danger: new Color(0.80, 0.20, 0.15),
    success: new Color(0.20, 0.60, 0.20),
    text: new Color(0.95, 0.90, 0.82),
    textDark: new Color(0.20, 0.15, 0.10),
    panel: new Color(0.25, 0.18, 0.12, 0.95),
    button: new Color(0.35, 0.25, 0.18),
    buttonHover: new Color(0.45, 0.35, 0.25)
};

// ============================================================================
// GAME CONSTANTS
// ============================================================================

const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    EVENT: 'event',
    GAME_OVER: 'gameOver',
    VICTORY: 'victory'
};

const PORTS = [
    { name: 'Lintin', x: 200, y: 280, baseRisk: 1, offerSize: [5, 15] },
    { name: 'Whampoa', x: 400, y: 300, baseRisk: 2, offerSize: [10, 20] },
    { name: 'Canton', x: 500, y: 250, baseRisk: 3, offerSize: [15, 30] },
    { name: 'Macao', x: 150, y: 350, baseRisk: 2, offerSize: [10, 25] },
    { name: 'Bocca Tigris', x: 350, y: 380, baseRisk: 4, offerSize: [20, 40] }
];

const YEAR_DATA = [
    { year: 1830, quota: 60, opiumBase: 25, teaBase: 18 },
    { year: 1831, quota: 90, opiumBase: 30, teaBase: 20 },
    { year: 1832, quota: 120, opiumBase: 35, teaBase: 22 },
    { year: 1833, quota: 180, opiumBase: 55, teaBase: 28 },
    { year: 1834, quota: 250, opiumBase: 60, teaBase: 32 },
    { year: 1835, quota: 320, opiumBase: 70, teaBase: 38 },
    { year: 1836, quota: 400, opiumBase: 85, teaBase: 45 },
    { year: 1837, quota: 500, opiumBase: 95, teaBase: 55 },
    { year: 1838, quota: 580, opiumBase: 105, teaBase: 65 },
    { year: 1839, quota: 660, opiumBase: 110, teaBase: 75 }
];

// ============================================================================
// GAME STATE
// ============================================================================

let currentGameState = GameState.MENU;
let gameData = null;
let portOffers = [];
let activeShips = [];
let notifications = [];
let timeSpeed = 1;

// UI state
let uiMouseX = 0;
let uiMouseY = 0;
let screenShake = 0;
let particles = [];

// ============================================================================
// GAME DATA CLASS
// ============================================================================

class GameData {
    constructor() {
        this.silver = 500;
        this.opium = 0;
        this.tea = 0;
        this.ships = 1;
        this.bribeCards = 0;

        this.yearIndex = 0;
        this.monthsRemaining = 12;
        this.mood = 80;
        this.clipperTimer = 60;

        this.totalOpiumSold = 0;
        this.totalTeaShipped = 0;
        this.totalSilverEarned = 0;
        this.shipsLost = 0;
        this.finesPaid = 0;

        this.portRisks = {};
        for (const port of PORTS) {
            this.portRisks[port.name] = port.baseRisk;
        }

        this.opiumPrice = 25;
        this.teaPrice = 18;
        this.recentOpiumPurchases = 0;
        this.recentTeaPurchases = 0;

        this.tutorialStep = 0;
        this.tutorialComplete = false;

        this.gameTime = 0;
    }

    getCurrentYear() {
        return YEAR_DATA[this.yearIndex]?.year || 1839;
    }

    getCurrentQuota() {
        return YEAR_DATA[this.yearIndex]?.quota || 660;
    }

    getAvailableShips() {
        return this.ships - activeShips.filter(s => s.state === 'traveling' || s.state === 'returning').length;
    }

    updatePrices() {
        const yearData = YEAR_DATA[this.yearIndex];
        if (!yearData) return;

        const yearMod = 1 + (this.yearIndex * 0.08);
        const opiumDemand = Math.min(this.recentOpiumPurchases * 0.02, 0.3);
        const teaDemand = Math.min(this.recentTeaPurchases * 0.02, 0.3);
        const noise = 0.9 + Math.random() * 0.2;

        this.opiumPrice = Math.round(yearData.opiumBase * yearMod * (1 + opiumDemand) * noise);
        this.teaPrice = Math.round(yearData.teaBase * yearMod * (1 + teaDemand) * noise);

        this.recentOpiumPurchases = Math.max(0, this.recentOpiumPurchases - 0.5);
        this.recentTeaPurchases = Math.max(0, this.recentTeaPurchases - 0.5);
    }
}

// ============================================================================
// PORT OFFER CLASS
// ============================================================================

class PortOffer {
    constructor(portIndex) {
        const port = PORTS[portIndex];
        this.portIndex = portIndex;
        this.port = port;

        const [minSize, maxSize] = port.offerSize;
        this.quantity = Math.floor(minSize + Math.random() * (maxSize - minSize));

        const yearData = YEAR_DATA[gameData.yearIndex];
        const basePrice = yearData.opiumBase * 2;
        const riskBonus = 1 + (port.baseRisk * 0.15);
        this.pricePerChest = Math.round(basePrice * riskBonus * (0.9 + Math.random() * 0.3));

        this.timer = 8 + Math.random() * 6;
        this.maxTimer = this.timer;
    }

    getTotalValue() {
        return this.quantity * this.pricePerChest;
    }

    update(dt) {
        this.timer -= dt * timeSpeed;
        return this.timer > 0;
    }
}

// ============================================================================
// SHIP CLASS
// ============================================================================

class Ship {
    constructor(offer) {
        this.offer = offer;
        this.port = offer.port;
        this.cargo = Math.min(offer.quantity, gameData.opium);
        this.state = 'traveling';
        this.travelTime = 2 + Math.random() * 2;
        this.returnTime = 2 + Math.random() * 2;
        this.timer = this.travelTime;

        this.x = 100;
        this.y = 450;
        this.targetX = offer.port.x;
        this.targetY = offer.port.y;

        gameData.opium -= this.cargo;
    }

    update(dt) {
        this.timer -= dt * timeSpeed;

        if (this.state === 'traveling') {
            const progress = 1 - (this.timer / this.travelTime);
            this.x = 100 + (this.targetX - 100) * progress;
            this.y = 450 + (this.targetY - 450) * progress;

            if (this.timer <= 0) {
                this.resolveArrival();
            }
        } else if (this.state === 'returning') {
            const progress = 1 - (this.timer / this.returnTime);
            this.x = this.targetX + (100 - this.targetX) * progress;
            this.y = this.targetY + (450 - this.targetY) * progress;

            if (this.timer <= 0) {
                return false;
            }
        }

        return true;
    }

    resolveArrival() {
        const risk = gameData.portRisks[this.port.name];
        const captureChance = risk * 0.08;

        if (gameData.yearIndex < 2) {
            this.success();
            return;
        }

        if (Math.random() < captureChance) {
            this.handleCapture();
        } else {
            this.success();
        }

        gameData.portRisks[this.port.name] = Math.min(5, risk + 0.3);
    }

    success() {
        const earnings = this.cargo * this.offer.pricePerChest;
        gameData.silver += earnings;
        gameData.totalSilverEarned += earnings;
        gameData.totalOpiumSold += this.cargo;

        addNotification(`+${earnings} silver from ${this.port.name}!`, COLORS.success);
        spawnCoins(this.port.x, this.port.y, Math.min(10, Math.floor(earnings / 100)));

        this.state = 'returning';
        this.timer = this.returnTime;

        if (window.testHarness) {
            window.testHarness.logEvent('trade_success', {
                port: this.port.name,
                cargo: this.cargo,
                earnings
            });
        }
    }

    handleCapture() {
        const roll = Math.random();

        if (roll < 0.5) {
            addNotification(`Ship escaped from ${this.port.name}`, COLORS.sepia);
            gameData.opium += this.cargo;
            this.state = 'returning';
            this.timer = this.returnTime;
        } else if (roll < 0.7) {
            const fine = Math.round(this.cargo * this.offer.pricePerChest * (0.1 + Math.random() * 0.2));
            if (gameData.silver >= fine) {
                gameData.silver -= fine;
                gameData.finesPaid += fine;
                addNotification(`Bribed officials: -${fine} silver`, COLORS.gold);
                this.success();
            } else {
                this.lostCargo();
            }
        } else if (roll < 0.9) {
            this.lostCargo();
        } else {
            if (gameData.bribeCards > 0) {
                gameData.bribeCards--;
                addNotification('Used bribe card to escape!', COLORS.gold);
                this.success();
            } else {
                this.shipCaptured();
            }
        }
    }

    lostCargo() {
        addNotification(`Cargo confiscated at ${this.port.name}!`, COLORS.danger);
        this.state = 'returning';
        this.timer = this.returnTime;
    }

    shipCaptured() {
        gameData.ships--;
        gameData.shipsLost++;
        addNotification('SHIP CAPTURED!', COLORS.danger);
        screenShake = Math.min(screenShake + 1, 2);
        spawnExplosion(this.x, this.y);

        if (window.testHarness) {
            window.testHarness.logEvent('ship_captured', { port: this.port.name });
        }

        if (gameData.ships <= 0) {
            currentGameState = GameState.GAME_OVER;
        }
    }
}

// ============================================================================
// PARTICLE SYSTEM
// ============================================================================

function spawnCoins(x, y, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 30,
            y: y,
            vx: (Math.random() - 0.5) * 80,
            vy: -60 - Math.random() * 40,
            color: COLORS.gold,
            size: 4 + Math.random() * 3,
            life: 1 + Math.random() * 0.5
        });
    }
}

function spawnExplosion(x, y) {
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * (40 + Math.random() * 40),
            vy: Math.sin(angle) * (40 + Math.random() * 40),
            color: COLORS.danger,
            size: 5 + Math.random() * 4,
            life: 0.8 + Math.random() * 0.4
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 150 * dt; // gravity
        p.life -= dt;
        p.size *= 0.97;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

function addNotification(text, color) {
    notifications.push({
        text,
        color,
        y: 550,
        life: 3,
        alpha: 1
    });
}

function updateNotifications(dt) {
    for (let i = notifications.length - 1; i >= 0; i--) {
        const n = notifications[i];
        n.y -= 30 * dt;
        n.life -= dt;
        n.alpha = Math.min(1, n.life);
        if (n.life <= 0) {
            notifications.splice(i, 1);
        }
    }
}

// ============================================================================
// GAME ACTIONS
// ============================================================================

function buyOpium(amount) {
    if (!gameData) return;

    const cost = amount * gameData.opiumPrice;
    if (gameData.silver >= cost) {
        gameData.silver -= cost;
        gameData.opium += amount;
        gameData.recentOpiumPurchases += amount;
        addNotification(`Bought ${amount} opium for ${cost} silver`, COLORS.opium);

        if (window.testHarness) {
            window.testHarness.logEvent('buy_opium', { amount, cost });
        }
    }
}

function buyTea(amount) {
    if (!gameData) return;

    const cost = amount * gameData.teaPrice;
    if (gameData.silver >= cost) {
        gameData.silver -= cost;
        gameData.tea += amount;
        gameData.recentTeaPurchases += amount;
        addNotification(`Bought ${amount} tea for ${cost} silver`, COLORS.tea);

        if (window.testHarness) {
            window.testHarness.logEvent('buy_tea', { amount, cost });
        }
    }
}

function acceptOffer(offerIndex) {
    if (!gameData || offerIndex >= portOffers.length) return;

    const offer = portOffers[offerIndex];
    if (gameData.getAvailableShips() <= 0 || gameData.opium <= 0) return;

    const ship = new Ship(offer);
    activeShips.push(ship);
    portOffers.splice(offerIndex, 1);

    addNotification(`Ship sent to ${offer.port.name}`, COLORS.ocean);

    if (window.testHarness) {
        window.testHarness.logEvent('accept_offer', {
            port: offer.port.name,
            quantity: offer.quantity
        });
    }
}

function shipTea() {
    if (!gameData || gameData.tea <= 0) return;

    const toShip = Math.min(gameData.tea, gameData.getCurrentQuota());
    gameData.totalTeaShipped += toShip;
    gameData.tea -= toShip;

    const moodGain = toShip >= gameData.getCurrentQuota() ? 20 : Math.floor(toShip / 10);
    gameData.mood = Math.min(100, gameData.mood + moodGain);

    addNotification(`Shipped ${toShip} tea to Britain!`, COLORS.success);

    if (toShip >= gameData.getCurrentQuota()) {
        gameData.ships++;
        addNotification('Reward: +1 Ship!', COLORS.gold);
        advanceYear();
    }

    if (window.testHarness) {
        window.testHarness.logEvent('ship_tea', { amount: toShip });
    }
}

function advanceYear() {
    gameData.yearIndex++;

    if (gameData.yearIndex >= YEAR_DATA.length) {
        currentGameState = GameState.VICTORY;
        return;
    }

    gameData.monthsRemaining = 12;
    gameData.clipperTimer = 60;
    gameData.updatePrices();

    for (const port of PORTS) {
        gameData.portRisks[port.name] = Math.max(
            port.baseRisk,
            gameData.portRisks[port.name] - 1
        );
    }

    addNotification(`Year ${gameData.getCurrentYear()} begins!`, COLORS.gold);

    if (window.testHarness) {
        window.testHarness.logEvent('year_advance', { year: gameData.getCurrentYear() });
    }
}

// ============================================================================
// GAME UPDATE
// ============================================================================

function gameInit() {
    canvasFixedSize = vec2(800, 600);
}

function gameUpdate() {
    const dt = 1 / 60;

    if (currentGameState === GameState.MENU) {
        if (mouseWasPressed(0)) {
            gameData = new GameData();
            currentGameState = GameState.PLAYING;
            if (window.testHarness) {
                window.testHarness.logEvent('game_start', {});
            }
        }
        return;
    }

    if (currentGameState !== GameState.PLAYING) return;

    gameData.gameTime += dt * timeSpeed;

    gameData.clipperTimer -= dt * timeSpeed;
    if (gameData.clipperTimer <= 0) {
        gameData.clipperTimer = 60;
        gameData.monthsRemaining--;

        if (gameData.monthsRemaining <= 0) {
            gameData.mood -= 25;
            addNotification('Year ended! Tea quota not met!', COLORS.danger);

            if (gameData.mood <= 0) {
                currentGameState = GameState.GAME_OVER;
            } else {
                advanceYear();
            }
        }

        gameData.updatePrices();
    }

    if (Math.random() < 0.02 * dt * timeSpeed && portOffers.length < 4) {
        const portIndex = Math.floor(Math.random() * PORTS.length);
        portOffers.push(new PortOffer(portIndex));
    }

    portOffers = portOffers.filter(o => o.update(dt));
    activeShips = activeShips.filter(s => s.update(dt));

    updateNotifications(dt);
    updateParticles(dt);

    // Update screen shake
    if (screenShake > 0) {
        screenShake *= 0.92;
        if (screenShake < 0.01) screenShake = 0;
    }

    if (Math.random() < 0.001 * dt * timeSpeed && gameData.bribeCards < 1) {
        gameData.bribeCards++;
        addNotification('Received a bribe card!', COLORS.gold);
    }
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

    ctx.fillStyle = `rgb(${Math.floor(COLORS.background.r * 255)}, ${Math.floor(COLORS.background.g * 255)}, ${Math.floor(COLORS.background.b * 255)})`;
    ctx.fillRect(0, 0, 800, 600);

    if (currentGameState === GameState.MENU) {
        renderMenu(ctx);
    } else if (currentGameState === GameState.PLAYING) {
        renderGame(ctx);
    } else if (currentGameState === GameState.GAME_OVER) {
        renderGameOver(ctx);
    } else if (currentGameState === GameState.VICTORY) {
        renderVictory(ctx);
    }

    for (const n of notifications) {
        ctx.globalAlpha = n.alpha;
        ctx.fillStyle = `rgb(${Math.floor(n.color.r * 255)}, ${Math.floor(n.color.g * 255)}, ${Math.floor(n.color.b * 255)})`;
        ctx.font = 'bold 16px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.text, 400, n.y);
        ctx.globalAlpha = 1;
    }

    ctx.restore();
}

function renderMenu(ctx) {
    ctx.fillStyle = '#f5e6c8';
    ctx.font = 'bold 48px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIGH TEA', 400, 180);

    ctx.font = '22px Georgia, serif';
    ctx.fillStyle = '#c9b896';
    ctx.fillText('The Opium Trade 1830-1839', 400, 230);

    ctx.font = '18px Georgia, serif';
    ctx.fillStyle = '#8a7a5a';
    ctx.fillText('Click to Begin', 400, 350);

    ctx.font = '14px Georgia, serif';
    ctx.fillStyle = '#6a5a4a';
    ctx.fillText('Buy opium → Sell at Chinese ports → Buy tea → Ship to Britain', 400, 450);
    ctx.fillText('Warning: This game depicts the historical British opium trade', 400, 480);
}

function renderGame(ctx) {
    // Apply screen shake
    if (screenShake > 0) {
        ctx.translate(
            (Math.random() - 0.5) * screenShake * 10,
            (Math.random() - 0.5) * screenShake * 10
        );
    }

    renderTopBar(ctx);
    renderMap(ctx);
    renderSidePanel(ctx);
    renderBottomPanel(ctx);
    renderShips(ctx);
    renderParticles(ctx);
}

function renderParticles(ctx) {
    for (const p of particles) {
        ctx.globalAlpha = Math.min(1, p.life);
        ctx.fillStyle = `rgb(${Math.floor(p.color.r * 255)}, ${Math.floor(p.color.g * 255)}, ${Math.floor(p.color.b * 255)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function renderTopBar(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, 800, 50);

    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f5e6c8';
    ctx.fillText(`Year: ${gameData.getCurrentYear()}`, 20, 32);

    ctx.fillText(`Silver: ${gameData.silver}`, 150, 32);

    const moodColor = gameData.mood > 60 ? '#4a4' : gameData.mood > 30 ? '#aa4' : '#a44';
    ctx.fillStyle = moodColor;
    ctx.fillText(`Mood: ${gameData.mood}%`, 300, 32);

    ctx.fillStyle = '#f5e6c8';
    ctx.fillText(`Ships: ${gameData.getAvailableShips()}/${gameData.ships}`, 450, 32);

    if (gameData.bribeCards > 0) {
        ctx.fillStyle = '#d4a74a';
        ctx.fillText(`Bribe: ${gameData.bribeCards}`, 580, 32);
    }

    ctx.fillStyle = '#aaa';
    ctx.font = '14px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Speed: ${timeSpeed}x`, 780, 32);
}

function renderMap(ctx) {
    ctx.fillStyle = 'rgba(25, 50, 75, 0.5)';
    ctx.fillRect(130, 60, 540, 380);

    ctx.strokeStyle = '#3a5a7a';
    ctx.lineWidth = 2;
    ctx.strokeRect(130, 60, 540, 380);

    ctx.fillStyle = '#f5e6c8';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Pearl River Delta', 400, 85);

    for (const port of PORTS) {
        const risk = gameData.portRisks[port.name];
        const riskColor = risk <= 2 ? '#4a4' : risk <= 3 ? '#aa4' : '#a44';

        ctx.fillStyle = riskColor;
        ctx.beginPath();
        ctx.arc(port.x, port.y, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '12px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(port.name, port.x, port.y + 30);
    }

    const mx = mousePos.x * 800 / mainCanvas.width + 400;
    const my = 300 - mousePos.y * 600 / mainCanvas.height;

    for (let i = 0; i < portOffers.length; i++) {
        const offer = portOffers[i];
        const x = offer.port.x + 30;
        const y = offer.port.y - 40;
        const width = 90;
        const height = 70;

        const hover = mx >= x && mx <= x + width && my >= y && my <= y + height;

        ctx.fillStyle = hover ? 'rgba(80, 60, 40, 0.95)' : 'rgba(60, 45, 30, 0.9)';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 5);
        ctx.fill();

        ctx.strokeStyle = '#c9b896';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#f5e6c8';
        ctx.font = '11px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${offer.quantity} chests`, x + width / 2, y + 20);
        ctx.fillText(`@${offer.pricePerChest} silver`, x + width / 2, y + 35);

        ctx.fillStyle = '#8a8';
        ctx.fillText('ACCEPT', x + width / 2, y + 55);

        ctx.fillStyle = '#888';
        ctx.fillRect(x + 5, y + height - 8, (width - 10) * (offer.timer / offer.maxTimer), 4);

        if (mouseWasPressed(0) && hover && gameData.getAvailableShips() > 0 && gameData.opium > 0) {
            acceptOffer(i);
        }
    }
}

function renderSidePanel(ctx) {
    const x = 10;
    const mx = mousePos.x * 800 / mainCanvas.width + 400;
    const my = 300 - mousePos.y * 600 / mainCanvas.height;

    ctx.fillStyle = 'rgba(40, 30, 20, 0.9)';
    ctx.beginPath();
    ctx.roundRect(x, 60, 115, 180, 8);
    ctx.fill();

    ctx.strokeStyle = '#6a4a3a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#c9a896';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('OPIUM', x + 57, 82);

    ctx.fillStyle = '#f5e6c8';
    ctx.font = '12px Georgia, serif';
    ctx.fillText(`Price: ${gameData.opiumPrice}`, x + 57, 102);
    ctx.fillText(`Stock: ${gameData.opium}`, x + 57, 118);

    const buyAmounts = [5, 10, 15];
    for (let i = 0; i < buyAmounts.length; i++) {
        const bx = x + 8 + i * 36;
        const by = 128;
        const bw = 32;
        const bh = 25;
        const hover = mx >= bx && mx <= bx + bw && my >= by && my <= by + bh;
        const canAfford = gameData.silver >= buyAmounts[i] * gameData.opiumPrice;

        ctx.fillStyle = !canAfford ? '#333' : hover ? '#5a4a3a' : '#4a3a2a';
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 3);
        ctx.fill();

        ctx.fillStyle = canAfford ? '#f5e6c8' : '#666';
        ctx.font = '11px Georgia, serif';
        ctx.fillText(`+${buyAmounts[i]}`, bx + bw / 2, by + 17);

        if (mouseWasPressed(0) && hover && canAfford) {
            buyOpium(buyAmounts[i]);
        }
    }

    ctx.fillStyle = 'rgba(40, 30, 20, 0.9)';
    ctx.beginPath();
    ctx.roundRect(x, 165, 115, 180, 8);
    ctx.fill();

    ctx.strokeStyle = '#4a6a4a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#96c9a8';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText('TEA', x + 57, 187);

    ctx.fillStyle = '#f5e6c8';
    ctx.font = '12px Georgia, serif';
    ctx.fillText(`Price: ${gameData.teaPrice}`, x + 57, 207);
    ctx.fillText(`Stock: ${gameData.tea}`, x + 57, 223);

    for (let i = 0; i < buyAmounts.length; i++) {
        const bx = x + 8 + i * 36;
        const by = 233;
        const bw = 32;
        const bh = 25;
        const hover = mx >= bx && mx <= bx + bw && my >= by && my <= by + bh;
        const canAfford = gameData.silver >= buyAmounts[i] * gameData.teaPrice;

        ctx.fillStyle = !canAfford ? '#333' : hover ? '#4a5a4a' : '#3a4a3a';
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 3);
        ctx.fill();

        ctx.fillStyle = canAfford ? '#f5e6c8' : '#666';
        ctx.font = '11px Georgia, serif';
        ctx.fillText(`+${buyAmounts[i]}`, bx + bw / 2, by + 17);

        if (mouseWasPressed(0) && hover && canAfford) {
            buyTea(buyAmounts[i]);
        }
    }

    ctx.fillStyle = 'rgba(40, 30, 20, 0.9)';
    ctx.beginPath();
    ctx.roundRect(x, 360, 115, 80, 8);
    ctx.fill();

    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.fillText('TIME SPEED', x + 57, 380);

    for (let i = 0; i < 3; i++) {
        const speed = i + 1;
        const bx = x + 8 + i * 36;
        const by = 390;
        const bw = 32;
        const bh = 25;
        const hover = mx >= bx && mx <= bx + bw && my >= by && my <= by + bh;
        const active = timeSpeed === speed;

        ctx.fillStyle = active ? '#6a5a4a' : hover ? '#5a4a3a' : '#3a2a1a';
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 3);
        ctx.fill();

        ctx.fillStyle = active ? '#fff' : '#aaa';
        ctx.font = '11px Georgia, serif';
        ctx.fillText(`${speed}x`, bx + bw / 2, by + 17);

        if (mouseWasPressed(0) && hover) {
            timeSpeed = speed;
        }
    }
}

function renderBottomPanel(ctx) {
    ctx.fillStyle = 'rgba(40, 30, 20, 0.9)';
    ctx.fillRect(130, 450, 540, 90);

    ctx.strokeStyle = '#6a4a3a';
    ctx.lineWidth = 2;
    ctx.strokeRect(130, 450, 540, 90);

    ctx.fillStyle = '#f5e6c8';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('TEA CLIPPER', 145, 475);

    ctx.font = '12px Georgia, serif';
    ctx.fillText(`Arriving in: ${Math.ceil(gameData.clipperTimer)}s`, 145, 495);
    ctx.fillText(`Quota: ${gameData.getCurrentQuota()} chests`, 145, 515);
    ctx.fillText(`Your tea: ${gameData.tea} chests`, 300, 515);

    const mx = mousePos.x * 800 / mainCanvas.width + 400;
    const my = 300 - mousePos.y * 600 / mainCanvas.height;

    const shipBtnX = 500;
    const shipBtnY = 470;
    const shipBtnW = 150;
    const shipBtnH = 50;
    const hover = mx >= shipBtnX && mx <= shipBtnX + shipBtnW && my >= shipBtnY && my <= shipBtnY + shipBtnH;
    const canShip = gameData.tea > 0;

    ctx.fillStyle = !canShip ? '#333' : hover ? '#5a6a5a' : '#4a5a4a';
    ctx.beginPath();
    ctx.roundRect(shipBtnX, shipBtnY, shipBtnW, shipBtnH, 5);
    ctx.fill();

    ctx.fillStyle = canShip ? '#fff' : '#666';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHIP TEA', shipBtnX + shipBtnW / 2, shipBtnY + 30);

    if (mouseWasPressed(0) && hover && canShip) {
        shipTea();
    }
}

function renderShips(ctx) {
    for (const ship of activeShips) {
        ctx.fillStyle = '#8ac';
        ctx.beginPath();
        ctx.moveTo(ship.x, ship.y - 8);
        ctx.lineTo(ship.x + 10, ship.y + 8);
        ctx.lineTo(ship.x - 10, ship.y + 8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.fillRect(ship.x - 1, ship.y - 15, 2, 12);
    }
}

function renderGameOver(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#a44';
    ctx.font = 'bold 48px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', 400, 200);

    ctx.fillStyle = '#f5e6c8';
    ctx.font = '20px Georgia, serif';

    if (gameData.ships <= 0) {
        ctx.fillText('All ships lost!', 400, 280);
    } else if (gameData.mood <= 0) {
        ctx.fillText('Britain has lost patience!', 400, 280);
    }

    ctx.font = '16px Georgia, serif';
    ctx.fillText(`Tea Shipped: ${gameData.totalTeaShipped}`, 400, 340);
    ctx.fillText(`Opium Sold: ${gameData.totalOpiumSold}`, 400, 370);
    ctx.fillText(`Chinese Addicted: ~${Math.round(gameData.totalOpiumSold * 3.5)}`, 400, 400);

    ctx.fillStyle = '#888';
    ctx.fillText('Click to restart', 400, 480);

    if (mouseWasPressed(0)) {
        currentGameState = GameState.MENU;
    }
}

function renderVictory(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = '#4a4';
    ctx.font = 'bold 48px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', 400, 150);

    ctx.fillStyle = '#f5e6c8';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('You survived the opium trade era.', 400, 200);

    ctx.font = '16px Georgia, serif';
    ctx.fillText(`Tea Shipped: ${gameData.totalTeaShipped}`, 400, 260);
    ctx.fillText(`Silver Earned: ${gameData.totalSilverEarned}`, 400, 290);
    ctx.fillText(`Opium Sold: ${gameData.totalOpiumSold}`, 400, 320);
    ctx.fillText(`Ships Lost: ${gameData.shipsLost}`, 400, 350);
    ctx.fillText(`Fines Paid: ${gameData.finesPaid}`, 400, 380);

    ctx.fillStyle = '#a66';
    ctx.fillText(`Estimated Addictions Created: ~${Math.round(gameData.totalOpiumSold * 3.5)}`, 400, 430);

    ctx.fillStyle = '#888';
    ctx.font = '14px Georgia, serif';
    ctx.fillText('The First Opium War (1839-1842) followed soon after.', 400, 480);

    ctx.fillText('Click to restart', 400, 530);

    if (mouseWasPressed(0)) {
        currentGameState = GameState.MENU;
    }
}

// ============================================================================
// TEST HARNESS EXPORTS
// ============================================================================

window.getPlayer = () => gameData;
window.getGameState = () => currentGameState;
window.getResources = () => gameData ? {
    silver: gameData.silver,
    opium: gameData.opium,
    tea: gameData.tea
} : null;
window.getCurrentYear = () => gameData ? gameData.getCurrentYear() : 1830;
window.getMood = () => gameData ? gameData.mood : 0;
window.getShips = () => gameData ? gameData.ships : 0;
window.getPortOffers = () => portOffers.map(o => ({
    port: o.port.name,
    quantity: o.quantity,
    price: o.pricePerChest
}));
window.buyOpium = buyOpium;
window.buyTea = buyTea;
window.acceptOffer = acceptOffer;
window.shipTea = shipTea;
window.startGame = () => {
    gameData = new GameData();
    currentGameState = GameState.PLAYING;
};

// ============================================================================
// ENGINE INIT
// ============================================================================

engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
