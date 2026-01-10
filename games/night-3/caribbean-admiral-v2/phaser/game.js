// Caribbean Admiral v2 - Phaser 3 Implementation

// Ship Types
const SHIP_TYPES = {
    sloop: { name: 'Sloop', hull: 100, sails: 40, crew: 10, cargo: 20, damage: 15, cost: 0 },
    schooner: { name: 'Schooner', hull: 150, sails: 50, crew: 15, cargo: 40, damage: 20, cost: 1000 },
    cutter: { name: 'Cutter', hull: 180, sails: 45, crew: 20, cargo: 25, damage: 30, cost: 800 },
    brigantine: { name: 'Brigantine', hull: 250, sails: 60, crew: 25, cargo: 80, damage: 35, cost: 2500 },
    brig: { name: 'Brig', hull: 280, sails: 55, crew: 30, cargo: 60, damage: 45, cost: 3000 },
    corvette: { name: 'Corvette', hull: 350, sails: 50, crew: 40, cargo: 35, damage: 60, cost: 4000 },
    frigate: { name: 'Frigate', hull: 400, sails: 55, crew: 50, cargo: 40, damage: 75, cost: 5000 },
    galleon: { name: 'Galleon', hull: 500, sails: 65, crew: 40, cargo: 150, damage: 55, cost: 8000 },
    manOWar: { name: "Man-o'-War", hull: 600, sails: 60, crew: 70, cargo: 50, damage: 100, cost: 12000 },
    shipOfLine: { name: 'Ship of the Line', hull: 800, sails: 65, crew: 100, cargo: 60, damage: 150, cost: 25000 },
    flagship: { name: 'Flagship', hull: 1000, sails: 80, crew: 150, cargo: 100, damage: 200, cost: 50000 }
};

// Trade Goods
const GOODS = {
    rice: { name: 'Rice', buyLow: 27, buyHigh: 45, sellLow: 45, sellHigh: 72 },
    corn: { name: 'Corn', buyLow: 66, buyHigh: 100, sellLow: 100, sellHigh: 144 },
    bananas: { name: 'Bananas', buyLow: 200, buyHigh: 250, sellLow: 250, sellHigh: 300 },
    ore: { name: 'Ore', buyLow: 304, buyHigh: 400, sellLow: 400, sellHigh: 480 },
    coffee: { name: 'Coffee', buyLow: 1280, buyHigh: 1600, sellLow: 1600, sellHigh: 1920 },
    rum: { name: 'Rum', buyLow: 3725, buyHigh: 4400, sellLow: 4400, sellHigh: 5016 },
    silver: { name: 'Silver', buyLow: 9600, buyHigh: 12000, sellLow: 12000, sellHigh: 14400 },
    gunpowder: { name: 'Gunpowder', buyLow: 14755, buyHigh: 19000, sellLow: 19000, sellHigh: 24000 }
};

// Ports
const PORTS = [
    { name: 'Trinidad', x: 950, y: 580, liberated: true, bossFleet: null },
    { name: 'Grenada', x: 1050, y: 520, liberated: false, bossFleet: ['sloop', 'sloop'] },
    { name: 'Caracas', x: 900, y: 480, liberated: false, bossFleet: ['sloop', 'sloop', 'sloop'] },
    { name: 'Bridgetown', x: 1100, y: 420, liberated: false, bossFleet: ['cutter', 'cutter'] },
    { name: 'Maracaibo', x: 700, y: 380, liberated: false, bossFleet: ['brig', 'brig'] },
    { name: 'Port Royal', x: 600, y: 320, liberated: false, bossFleet: ['frigate', 'frigate'] },
    { name: 'Cartagena', x: 450, y: 400, liberated: false, bossFleet: ['frigate', 'frigate', 'frigate'] },
    { name: 'Kingston', x: 580, y: 260, liberated: false, bossFleet: ['manOWar', 'manOWar'] },
    { name: 'Havana', x: 400, y: 200, liberated: false, bossFleet: ['manOWar', 'manOWar', 'manOWar'] },
    { name: 'Nassau', x: 650, y: 150, liberated: false, bossFleet: ['shipOfLine', 'shipOfLine', 'shipOfLine'] }
];

// Attack Types
const ATTACKS = {
    hull: { name: 'Hull Shot', apCost: 25, hullMult: 1.0, sailMult: 0.1, crewMult: 0.1 },
    sail: { name: 'Sail Shot', apCost: 25, hullMult: 0.1, sailMult: 1.0, crewMult: 0.1 },
    crew: { name: 'Crew Shot', apCost: 25, hullMult: 0.5, sailMult: 0.25, crewMult: 1.0 },
    quick: { name: 'Quick Shot', apCost: 15, hullMult: 0.4, sailMult: 0.4, crewMult: 0.4 },
    board: { name: 'Board', apCost: 35, special: true }
};

// Global game data
let gameData = {
    day: 1,
    gold: 1000,
    warPoints: 0,
    fleet: [],
    cargo: {},
    currentPort: 0,
    playerPos: { x: 950, y: 620 }
};

function createShip(type) {
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
        upgrades: { hull: 0, sails: 0, crew: 0, cargo: 0, damage: 0 }
    };
}

function initGameData() {
    gameData = {
        day: 1,
        gold: 1000,
        warPoints: 0,
        fleet: [createShip('sloop')],
        cargo: { rice: 0, corn: 0, bananas: 0, ore: 0, coffee: 0, rum: 0, silver: 0, gunpowder: 0 },
        currentPort: 0,
        playerPos: { x: PORTS[0].x, y: PORTS[0].y + 40 }
    };
}

// Boot Scene - Create textures
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.createTextures();
        this.scene.start('TitleScene');
    }

    createTextures() {
        // Create ship texture
        this.createShipTexture('ship-small', 80, 100, 1);
        this.createShipTexture('ship-med', 110, 120, 2);
        this.createShipTexture('ship-large', 140, 140, 3);

        // Create heart texture
        const heartGfx = this.make.graphics({ x: 0, y: 0, add: false });
        heartGfx.fillStyle(0xff4444);
        heartGfx.fillCircle(6, 6, 6);
        heartGfx.fillCircle(14, 6, 6);
        heartGfx.fillTriangle(0, 8, 20, 8, 10, 20);
        heartGfx.generateTexture('heart', 20, 22);

        // Empty heart
        const emptyHeartGfx = this.make.graphics({ x: 0, y: 0, add: false });
        emptyHeartGfx.fillStyle(0x555555);
        emptyHeartGfx.fillCircle(6, 6, 6);
        emptyHeartGfx.fillCircle(14, 6, 6);
        emptyHeartGfx.fillTriangle(0, 8, 20, 8, 10, 20);
        emptyHeartGfx.generateTexture('heart-empty', 20, 22);

        // Cannonball
        const ballGfx = this.make.graphics({ x: 0, y: 0, add: false });
        ballGfx.fillStyle(0x1a1a1a);
        ballGfx.fillCircle(8, 8, 8);
        ballGfx.generateTexture('cannonball', 16, 16);

        // Port marker
        const portGfx = this.make.graphics({ x: 0, y: 0, add: false });
        portGfx.fillStyle(0xc41e3a);
        portGfx.fillCircle(12, 12, 12);
        portGfx.lineStyle(2, 0xffffff);
        portGfx.strokeCircle(12, 12, 12);
        portGfx.generateTexture('port-marker', 24, 24);

        // Liberated port marker
        const libPortGfx = this.make.graphics({ x: 0, y: 0, add: false });
        libPortGfx.fillStyle(0x228b22);
        libPortGfx.fillCircle(12, 12, 12);
        libPortGfx.lineStyle(2, 0xffffff);
        libPortGfx.strokeCircle(12, 12, 12);
        libPortGfx.generateTexture('port-liberated', 24, 24);

        // Player ship icon for map
        const playerIconGfx = this.make.graphics({ x: 0, y: 0, add: false });
        playerIconGfx.fillStyle(0x6b4423);
        playerIconGfx.fillTriangle(15, 0, 0, 30, 30, 30);
        playerIconGfx.fillStyle(0xf5f5dc);
        playerIconGfx.fillTriangle(15, 5, 8, 20, 22, 20);
        playerIconGfx.generateTexture('player-icon', 30, 30);
    }

    createShipTexture(key, width, height, numMasts) {
        const gfx = this.make.graphics({ x: 0, y: 0, add: false });
        const hullWidth = width * 0.4;
        const centerX = width / 2;
        const centerY = height * 0.65;

        // Hull
        gfx.fillStyle(0x5d3a1a);
        gfx.beginPath();
        gfx.moveTo(centerX - hullWidth, centerY);
        gfx.lineTo(centerX - hullWidth + 10, centerY + 25);
        gfx.lineTo(centerX + hullWidth - 10, centerY + 25);
        gfx.lineTo(centerX + hullWidth, centerY);
        gfx.lineTo(centerX + hullWidth + 10, centerY - 10);
        gfx.lineTo(centerX - hullWidth - 5, centerY - 10);
        gfx.closePath();
        gfx.fill();

        // Deck
        gfx.fillStyle(0x8b6340);
        gfx.fillRect(centerX - hullWidth + 5, centerY - 15, hullWidth * 2 - 10, 8);

        // Masts and sails
        const mastPositions = numMasts === 3 ? [-20, 5, 30] : (numMasts === 2 ? [-10, 20] : [5]);
        const sailHeights = numMasts === 3 ? [50, 60, 45] : (numMasts === 2 ? [55, 45] : [50]);

        mastPositions.forEach((mx, i) => {
            const sh = sailHeights[i];
            const mastX = centerX + mx;

            // Mast
            gfx.fillStyle(0x4a2c10);
            gfx.fillRect(mastX - 2, centerY - sh - 10, 4, sh + 5);

            // Cross beam
            gfx.fillRect(mastX - 18, centerY - sh, 36, 3);

            // Sail
            gfx.fillStyle(0xf5f5dc);
            gfx.beginPath();
            gfx.moveTo(mastX - 15, centerY - sh + 5);
            gfx.lineTo(mastX + 15, centerY - sh + 5);
            gfx.lineTo(mastX + 12, centerY - sh * 0.4);
            gfx.lineTo(mastX - 12, centerY - sh * 0.4);
            gfx.closePath();
            gfx.fill();

            // Red stripe on sail
            gfx.fillStyle(0xc41e3a);
            gfx.fillRect(mastX - 12, centerY - sh * 0.6, 24, 8);
        });

        // Flag
        const mainMast = centerX + mastPositions[Math.floor(mastPositions.length / 2)];
        const mainHeight = sailHeights[Math.floor(sailHeights.length / 2)];
        gfx.fillStyle(0xc41e3a);
        gfx.fillTriangle(mainMast, centerY - mainHeight - 15, mainMast + 15, centerY - mainHeight - 10, mainMast, centerY - mainHeight - 5);

        gfx.generateTexture(key, width, height);
    }
}

// Title Scene
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        // Sky gradient
        const skyGfx = this.add.graphics();
        skyGfx.fillGradientStyle(0xffd89b, 0xffd89b, 0x87ceeb, 0x87ceeb);
        skyGfx.fillRect(0, 0, 1280, 360);

        // Ocean
        const oceanGfx = this.add.graphics();
        oceanGfx.fillGradientStyle(0x2090b0, 0x2090b0, 0x104050, 0x104050);
        oceanGfx.fillRect(0, 360, 1280, 360);

        // Lighthouse
        const lighthouseGfx = this.add.graphics();
        lighthouseGfx.fillStyle(0x8b7355);
        lighthouseGfx.fillTriangle(100, 400, 130, 200, 200, 400);
        lighthouseGfx.fillStyle(0xc41e3a);
        lighthouseGfx.fillTriangle(120, 200, 140, 150, 180, 200);

        // Cliffs
        lighthouseGfx.fillStyle(0xc2a060);
        lighthouseGfx.beginPath();
        lighthouseGfx.moveTo(0, 400);
        lighthouseGfx.lineTo(50, 350);
        lighthouseGfx.lineTo(150, 380);
        lighthouseGfx.lineTo(250, 340);
        lighthouseGfx.lineTo(350, 400);
        lighthouseGfx.lineTo(350, 720);
        lighthouseGfx.lineTo(0, 720);
        lighthouseGfx.closePath();
        lighthouseGfx.fill();

        // Ships
        this.add.image(300, 480, 'ship-small').setScale(0.8);
        this.add.image(1100, 500, 'ship-small').setScale(0.6).setFlipX(true);

        // Title ribbon
        this.drawRibbon(640, 80, 400, 60, 'Caribbean Admiral');

        // Menu panel
        const menuX = 930;
        const menuY = 150;
        this.drawWoodenPanel(menuX, menuY, 280, 350);

        // Menu buttons
        const playBtn = this.add.rectangle(menuX + 140, menuY + 80, 200, 50, 0x5c4033)
            .setInteractive()
            .on('pointerover', () => playBtn.setFillStyle(0x7c5043))
            .on('pointerout', () => playBtn.setFillStyle(0x5c4033))
            .on('pointerdown', () => {
                initGameData();
                this.scene.start('PortScene');
            });
        this.add.text(menuX + 140, menuY + 80, 'PLAY', { fontSize: '20px', fontFamily: 'serif', color: '#fff' }).setOrigin(0.5);

        const contBtn = this.add.rectangle(menuX + 140, menuY + 150, 200, 50, 0x5c4033)
            .setInteractive()
            .on('pointerover', () => contBtn.setFillStyle(0x7c5043))
            .on('pointerout', () => contBtn.setFillStyle(0x5c4033));
        this.add.text(menuX + 140, menuY + 150, 'Continue', { fontSize: '20px', fontFamily: 'serif', color: '#fff' }).setOrigin(0.5);

        const creditsBtn = this.add.rectangle(menuX + 140, menuY + 220, 200, 50, 0x5c4033)
            .setInteractive()
            .on('pointerover', () => creditsBtn.setFillStyle(0x7c5043))
            .on('pointerout', () => creditsBtn.setFillStyle(0x5c4033));
        this.add.text(menuX + 140, menuY + 220, 'Credits', { fontSize: '20px', fontFamily: 'serif', color: '#fff' }).setOrigin(0.5);
    }

    drawRibbon(x, y, w, h, text) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0xc41e3a);
        gfx.beginPath();
        gfx.moveTo(x - w/2 - 20, y - h/2);
        gfx.lineTo(x + w/2 + 20, y - h/2);
        gfx.lineTo(x + w/2 + 10, y);
        gfx.lineTo(x + w/2 + 20, y + h/2);
        gfx.lineTo(x - w/2 - 20, y + h/2);
        gfx.lineTo(x - w/2 - 10, y);
        gfx.closePath();
        gfx.fill();

        this.add.text(x, y, text, { fontSize: '24px', fontFamily: 'serif', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    }

    drawWoodenPanel(x, y, w, h) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0x8b6914);
        gfx.fillRect(x, y, w, h);
        gfx.lineStyle(3, 0x3a2010);
        gfx.strokeRect(x, y, w, h);
    }
}

// Map Scene
class MapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MapScene' });
    }

    create() {
        // Parchment background
        this.add.rectangle(640, 360, 1280, 720, 0xd4c4a8);

        // Ocean
        this.add.rectangle(640, 360, 980, 560, 0x5090b0).setPosition(700, 380);

        // Land masses
        const landGfx = this.add.graphics();
        landGfx.fillStyle(0xc2a060);

        // Central America
        landGfx.beginPath();
        landGfx.moveTo(200, 200);
        landGfx.lineTo(350, 150);
        landGfx.lineTo(400, 280);
        landGfx.lineTo(350, 450);
        landGfx.lineTo(200, 500);
        landGfx.closePath();
        landGfx.fill();

        // South America
        landGfx.beginPath();
        landGfx.moveTo(600, 550);
        landGfx.lineTo(800, 500);
        landGfx.lineTo(1000, 550);
        landGfx.lineTo(1150, 480);
        landGfx.lineTo(1200, 720);
        landGfx.lineTo(600, 720);
        landGfx.closePath();
        landGfx.fill();

        // Cuba
        landGfx.fillEllipse(500, 180, 120, 30);

        // Hispaniola
        landGfx.fillEllipse(680, 220, 60, 25);

        // Port markers
        this.portMarkers = [];
        PORTS.forEach((port, i) => {
            const marker = this.add.image(port.x, port.y, port.liberated ? 'port-liberated' : 'port-marker')
                .setInteractive()
                .on('pointerdown', () => this.travelToPort(i));
            this.portMarkers.push(marker);

            this.add.text(port.x, port.y - 20, port.name, { fontSize: '14px', fontFamily: 'serif', color: '#000' }).setOrigin(0.5);

            if (!port.liberated) {
                const flag = this.add.graphics();
                flag.fillStyle(0x1a1a1a);
                flag.fillRect(port.x + 15, port.y - 20, 20, 12);
                flag.fillStyle(0xffffff);
                flag.fillCircle(port.x + 25, port.y - 14, 3);
            }
        });

        // Player ship
        this.playerShip = this.add.image(gameData.playerPos.x, gameData.playerPos.y, 'player-icon');

        // Header
        this.drawWoodenPanel(0, 0, 1280, 60);
        this.drawRibbon(640, 30, 200, 40, 'Global Map');

        this.add.text(20, 30, `Cargo: ${this.getTotalCargo()}/${this.getFleetCargo()}`, { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0, 0.5);
        this.goldText = this.add.text(1100, 30, `Gold: ${gameData.gold}`, { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0, 0.5);
        this.wpText = this.add.text(1220, 30, `WP: ${gameData.warPoints}`, { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0, 0.5);

        // Day counter
        this.add.text(20, 700, `Day: ${gameData.day}`, { fontSize: '18px', fontFamily: 'serif', color: '#000' });

        // Compass
        this.drawCompass(1200, 150, 50);

        // Enter port button
        const enterBtn = this.add.rectangle(1175, 660, 160, 40, 0x5c4033)
            .setInteractive()
            .on('pointerover', () => enterBtn.setFillStyle(0x7c5043))
            .on('pointerout', () => enterBtn.setFillStyle(0x5c4033))
            .on('pointerdown', () => this.scene.start('PortScene'));
        this.add.text(1175, 660, 'Enter Port', { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0.5);

        this.add.text(640, 700, 'Click a port to travel', { fontSize: '16px', fontFamily: 'serif', color: '#000' }).setOrigin(0.5);
    }

    travelToPort(portIndex) {
        const port = PORTS[portIndex];
        gameData.currentPort = portIndex;
        gameData.playerPos = { x: port.x, y: port.y + 40 };
        gameData.day++;

        this.playerShip.setPosition(gameData.playerPos.x, gameData.playerPos.y);

        // Random encounter chance
        if (Math.random() < 0.15) {
            const enemies = ['sloop', 'sloop'].slice(0, 1 + Math.floor(Math.random() * 2));
            this.scene.start('CombatScene', { enemies, isLiberation: false });
        }
    }

    getTotalCargo() {
        return Object.values(gameData.cargo).reduce((a, b) => a + b, 0);
    }

    getFleetCargo() {
        return gameData.fleet.reduce((a, s) => a + s.cargo, 0);
    }

    drawWoodenPanel(x, y, w, h) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0x8b6914);
        gfx.fillRect(x, y, w, h);
        gfx.lineStyle(3, 0x3a2010);
        gfx.strokeRect(x, y, w, h);
    }

    drawRibbon(x, y, w, h, text) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0xc41e3a);
        gfx.beginPath();
        gfx.moveTo(x - w/2 - 20, y - h/2);
        gfx.lineTo(x + w/2 + 20, y - h/2);
        gfx.lineTo(x + w/2 + 10, y);
        gfx.lineTo(x + w/2 + 20, y + h/2);
        gfx.lineTo(x - w/2 - 20, y + h/2);
        gfx.lineTo(x - w/2 - 10, y);
        gfx.closePath();
        gfx.fill();

        this.add.text(x, y, text, { fontSize: '24px', fontFamily: 'serif', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    }

    drawCompass(x, y, size) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0xd4c4a8);
        gfx.fillCircle(x, y, size);
        gfx.lineStyle(3, 0x8b6914);
        gfx.strokeCircle(x, y, size);

        gfx.fillStyle(0xc41e3a);
        for (let i = 0; i < 8; i++) {
            const angle = i * Math.PI / 4 - Math.PI / 2;
            const r = i % 2 === 0 ? size * 0.6 : size * 0.25;
            gfx.fillTriangle(
                x, y,
                x + Math.cos(angle - 0.2) * r, y + Math.sin(angle - 0.2) * r,
                x + Math.cos(angle + 0.2) * r, y + Math.sin(angle + 0.2) * r
            );
        }

        const dirs = ['N', 'E', 'S', 'W'];
        dirs.forEach((d, i) => {
            const angle = i * Math.PI / 2 - Math.PI / 2;
            this.add.text(x + Math.cos(angle) * (size - 15), y + Math.sin(angle) * (size - 15), d, { fontSize: '14px', fontFamily: 'serif', color: '#4a2c10' }).setOrigin(0.5);
        });
    }
}

// Port Scene
class PortScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PortScene' });
    }

    create() {
        // Sky
        const skyGfx = this.add.graphics();
        skyGfx.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xe0f7fa, 0xe0f7fa);
        skyGfx.fillRect(0, 0, 1280, 300);

        // Town background
        this.add.rectangle(640, 275, 1280, 150, 0xc2a060);

        // Buildings
        const buildings = [
            { x: 100, w: 80, h: 100 },
            { x: 200, w: 100, h: 130 },
            { x: 320, w: 70, h: 90 },
            { x: 450, w: 120, h: 140 },
            { x: 600, w: 90, h: 110 },
            { x: 750, w: 110, h: 120 },
            { x: 900, w: 80, h: 95 },
            { x: 1000, w: 100, h: 115 },
            { x: 1120, w: 90, h: 100 }
        ];

        const buildingGfx = this.add.graphics();
        buildings.forEach(b => {
            buildingGfx.fillStyle(0xf5f5dc);
            buildingGfx.fillRect(b.x, 280 - b.h, b.w, b.h);

            // Roof
            buildingGfx.fillStyle(0x8b4513);
            buildingGfx.fillTriangle(b.x - 5, 280 - b.h, b.x + b.w/2, 280 - b.h - 30, b.x + b.w + 5, 280 - b.h);

            // Windows
            buildingGfx.fillStyle(0x4682b4);
            buildingGfx.fillRect(b.x + 15, 280 - b.h + 20, 15, 20);
            buildingGfx.fillRect(b.x + 40, 280 - b.h + 20, 15, 20);
        });

        // Dock
        this.add.rectangle(640, 300, 1280, 40, 0x8b7355);

        // Ocean
        const oceanGfx = this.add.graphics();
        oceanGfx.fillGradientStyle(0x2090b0, 0x2090b0, 0x104050, 0x104050);
        oceanGfx.fillRect(0, 320, 1280, 400);

        // Ships in harbor
        gameData.fleet.forEach((ship, i) => {
            const size = this.getShipSize(ship.type);
            this.add.image(200 + i * 200, 450, size).setScale(0.7);
        });

        // Header
        this.drawWoodenPanel(0, 0, 1280, 60);
        const port = PORTS[gameData.currentPort];
        this.drawRibbon(640, 30, 200, 40, port.name);

        this.add.text(20, 30, `Cargo: ${this.getTotalCargo()}/${this.getFleetCargo()}`, { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0, 0.5);
        this.add.text(1100, 30, `Gold: ${gameData.gold}`, { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0, 0.5);
        this.add.text(1220, 30, `WP: ${gameData.warPoints}`, { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0, 0.5);

        // Menu buttons
        const buttons = [
            { text: 'Ship Yard', x: 110, action: () => this.scene.start('ShipYardScene') },
            { text: 'Market', x: 260, action: () => this.scene.start('MarketScene') },
            { text: 'Fleet', x: 410, action: () => this.scene.start('FleetScene') },
            { text: 'Repair', x: 560, action: () => this.repairFleet() },
            { text: 'Map', x: 1190, action: () => this.scene.start('MapScene') }
        ];

        buttons.forEach(btn => {
            const rect = this.add.rectangle(btn.x, 680, 120, 50, 0x5c4033)
                .setInteractive()
                .on('pointerover', () => rect.setFillStyle(0x7c5043))
                .on('pointerout', () => rect.setFillStyle(0x5c4033))
                .on('pointerdown', btn.action);
            this.add.text(btn.x, 680, btn.text, { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0.5);
        });

        // Liberate button if not liberated
        if (!port.liberated) {
            const libBtn = this.add.rectangle(720, 680, 150, 50, 0xc41e3a)
                .setInteractive()
                .on('pointerover', () => libBtn.setFillStyle(0xe43e5a))
                .on('pointerout', () => libBtn.setFillStyle(0xc41e3a))
                .on('pointerdown', () => {
                    this.scene.start('CombatScene', { enemies: port.bossFleet, isLiberation: true });
                });
            this.add.text(720, 680, 'Liberate Port!', { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0.5);
        }
    }

    getShipSize(type) {
        const largeShips = ['galleon', 'manOWar', 'shipOfLine', 'flagship'];
        const medShips = ['brigantine', 'brig', 'corvette', 'frigate'];
        if (largeShips.includes(type)) return 'ship-large';
        if (medShips.includes(type)) return 'ship-med';
        return 'ship-small';
    }

    repairFleet() {
        gameData.fleet.forEach(ship => {
            const cost = Math.floor((ship.maxHull - ship.hull) / 2);
            if (gameData.gold >= cost) {
                gameData.gold -= cost;
                ship.hull = ship.maxHull;
            }
        });
        this.scene.restart();
    }

    getTotalCargo() {
        return Object.values(gameData.cargo).reduce((a, b) => a + b, 0);
    }

    getFleetCargo() {
        return gameData.fleet.reduce((a, s) => a + s.cargo, 0);
    }

    drawWoodenPanel(x, y, w, h) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0x8b6914);
        gfx.fillRect(x, y, w, h);
        gfx.lineStyle(3, 0x3a2010);
        gfx.strokeRect(x, y, w, h);
    }

    drawRibbon(x, y, w, h, text) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0xc41e3a);
        gfx.beginPath();
        gfx.moveTo(x - w/2 - 20, y - h/2);
        gfx.lineTo(x + w/2 + 20, y - h/2);
        gfx.lineTo(x + w/2 + 10, y);
        gfx.lineTo(x + w/2 + 20, y + h/2);
        gfx.lineTo(x - w/2 - 20, y + h/2);
        gfx.lineTo(x - w/2 - 10, y);
        gfx.closePath();
        gfx.fill();

        this.add.text(x, y, text, { fontSize: '24px', fontFamily: 'serif', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    }
}

// Combat Scene
class CombatScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CombatScene' });
    }

    init(data) {
        this.enemies = data.enemies.map(type => createShip(type));
        this.isLiberation = data.isLiberation;
        this.selectedShip = 0;
        this.selectedAttack = null;
        this.targetEnemy = 0;
        this.turn = 'player';
        this.message = 'Select a ship and attack!';

        // Reset player AP
        gameData.fleet.forEach(ship => {
            ship.ap = ship.maxAp;
        });
    }

    create() {
        // Sky gradient
        const skyGfx = this.add.graphics();
        skyGfx.fillGradientStyle(0xffd89b, 0xffd89b, 0xb0e0e6, 0xb0e0e6);
        skyGfx.fillRect(0, 0, 1280, 250);

        // Ocean
        const oceanGfx = this.add.graphics();
        oceanGfx.fillGradientStyle(0x2090b0, 0x2090b0, 0x104050, 0x104050);
        oceanGfx.fillRect(0, 250, 1280, 470);

        // Combat UI panel
        this.drawWoodenPanel(0, 600, 1280, 120);

        // Message text
        this.messageText = this.add.text(640, 40, this.message, { fontSize: '18px', fontFamily: 'serif', color: '#fff', backgroundColor: '#000000aa', padding: { x: 20, y: 10 } }).setOrigin(0.5);

        // Player ships
        this.playerShipSprites = [];
        this.playerHealthBars = [];
        gameData.fleet.forEach((ship, i) => {
            const y = 200 + i * 150;
            const size = this.getShipSize(ship.type);

            // Selection highlight
            const highlight = this.add.circle(150, y, 80, 0xffff00, 0.3).setVisible(i === 0);

            const sprite = this.add.image(150, y, size).setScale(0.9)
                .setInteractive()
                .on('pointerdown', () => this.selectShip(i));

            this.playerShipSprites.push({ sprite, highlight });

            // Stats
            this.add.text(90, y - 70, `AP: ${ship.ap}`, { fontSize: '14px', fontFamily: 'serif', color: '#fff' });

            // Health bar
            const hpBar = this.createHealthBar(90, y + 50, ship.hull, ship.maxHull);
            this.playerHealthBars.push(hpBar);
            this.add.text(200, y + 60, `${ship.hull}`, { fontSize: '14px', fontFamily: 'serif', color: '#fff' });
        });

        // Enemy ships
        this.enemyShipSprites = [];
        this.enemyHealthBars = [];
        this.enemies.forEach((enemy, i) => {
            const y = 200 + i * 150;
            const size = this.getShipSize(enemy.type);

            const sprite = this.add.image(1130, y, size).setScale(0.9).setFlipX(true)
                .setInteractive()
                .on('pointerdown', () => this.attackEnemy(i));

            this.enemyShipSprites.push(sprite);

            // Stats
            this.add.text(1150, y - 70, `AP: ${enemy.ap}`, { fontSize: '14px', fontFamily: 'serif', color: '#fff' });

            // Health bar
            const hpBar = this.createHealthBar(1090, y + 50, enemy.hull, enemy.maxHull);
            this.enemyHealthBars.push(hpBar);
            this.add.text(1200, y + 60, `${enemy.hull}`, { fontSize: '14px', fontFamily: 'serif', color: '#fff' });
        });

        // Attack buttons
        const attacks = ['hull', 'sail', 'crew', 'quick', 'board'];
        const attackLabels = ['Hull Shot', 'Sail Shot', 'Crew Shot', 'Quick Shot', 'Board'];
        const attackCosts = [25, 25, 25, 15, 35];

        this.attackButtons = [];
        attacks.forEach((atk, i) => {
            const x = 115 + i * 150;
            const btn = this.add.rectangle(x, 640, 130, 40, 0x5c4033)
                .setInteractive()
                .on('pointerover', () => btn.setFillStyle(0x7c5043))
                .on('pointerout', () => btn.setFillStyle(this.selectedAttack === atk ? 0x4a7c4a : 0x5c4033))
                .on('pointerdown', () => this.selectAttack(atk));

            this.attackButtons.push({ btn, atk });
            this.add.text(x, 632, attackLabels[i], { fontSize: '14px', fontFamily: 'serif', color: '#fff' }).setOrigin(0.5);
            this.add.text(x, 652, `${attackCosts[i]} AP`, { fontSize: '12px', fontFamily: 'serif', color: '#fff' }).setOrigin(0.5);
        });

        // End Turn button
        const endBtn = this.add.rectangle(1125, 640, 150, 40, 0x5c4033)
            .setInteractive()
            .on('pointerover', () => endBtn.setFillStyle(0x7c5043))
            .on('pointerout', () => endBtn.setFillStyle(0x5c4033))
            .on('pointerdown', () => this.endTurn());
        this.add.text(1125, 640, 'End Turn', { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0.5);

        // Selected ship info
        this.shipInfoText = this.add.text(50, 680, '', { fontSize: '16px', fontFamily: 'serif', color: '#fff' });
        this.updateShipInfo();

        // Turn indicator
        this.turnText = this.add.text(1230, 680, 'YOUR TURN', { fontSize: '20px', fontFamily: 'serif', color: '#4a7c4a', fontStyle: 'bold' }).setOrigin(1, 0.5);
    }

    selectShip(index) {
        if (gameData.fleet[index].hull <= 0) return;
        this.selectedShip = index;
        this.playerShipSprites.forEach((ps, i) => ps.highlight.setVisible(i === index));
        this.updateShipInfo();
    }

    selectAttack(attack) {
        this.selectedAttack = attack;
        this.attackButtons.forEach(ab => {
            ab.btn.setFillStyle(ab.atk === attack ? 0x4a7c4a : 0x5c4033);
        });
    }

    attackEnemy(enemyIndex) {
        if (this.turn !== 'player' || !this.selectedAttack) return;

        const attacker = gameData.fleet[this.selectedShip];
        const target = this.enemies[enemyIndex];
        const attack = ATTACKS[this.selectedAttack];

        if (attacker.ap < attack.apCost || target.hull <= 0) return;

        attacker.ap -= attack.apCost;

        if (this.selectedAttack === 'board') {
            const ratio = attacker.crew / target.crew;
            let successChance = ratio >= 2 ? 0.95 : ratio >= 1.5 ? 0.75 : ratio >= 1 ? 0.5 : 0.3;

            if (Math.random() < successChance) {
                this.message = `Boarding successful! ${target.name} captured!`;
                target.hull = 0;
            } else {
                this.message = 'Boarding failed!';
                attacker.crew = Math.floor(attacker.crew * 0.8);
            }
        } else {
            const baseDamage = attacker.damage;
            const randomMult = 0.9 + Math.random() * 0.2;
            const hullDamage = Math.floor(baseDamage * attack.hullMult * randomMult);

            target.hull = Math.max(0, target.hull - hullDamage);
            target.sails = Math.max(0, target.sails - Math.floor(baseDamage * attack.sailMult * randomMult));
            target.ap = Math.max(0, target.ap - Math.floor(baseDamage * attack.sailMult * randomMult));

            this.message = `${attack.name}! ${hullDamage} hull damage!`;

            // Cannonball animation
            const ball = this.add.image(200, 200 + this.selectedShip * 150, 'cannonball');
            this.tweens.add({
                targets: ball,
                x: 1080,
                y: 200 + enemyIndex * 150,
                duration: 500,
                onComplete: () => ball.destroy()
            });
        }

        if (target.hull <= 0) {
            this.message = `${target.name} destroyed!`;
            gameData.gold += Math.floor(100 + Math.random() * 200);
            gameData.warPoints += Math.floor(5 + Math.random() * 10);
        }

        this.messageText.setText(this.message);
        this.selectedAttack = null;
        this.attackButtons.forEach(ab => ab.btn.setFillStyle(0x5c4033));
        this.updateShipInfo();
        this.updateHealthBars();

        this.checkCombatEnd();
    }

    endTurn() {
        if (this.turn !== 'player') return;
        this.turn = 'enemy';
        this.turnText.setText('ENEMY TURN').setColor('#c41e3a');
        this.message = 'Enemy is attacking...';
        this.messageText.setText(this.message);

        this.time.delayedCall(1000, () => this.enemyTurn());
    }

    enemyTurn() {
        this.enemies.forEach(enemy => {
            if (enemy.hull <= 0 || enemy.ap < 15) return;

            // Find target
            let targetIdx = 0;
            let lowestHP = Infinity;
            gameData.fleet.forEach((ship, i) => {
                if (ship.hull > 0 && ship.hull < lowestHP) {
                    lowestHP = ship.hull;
                    targetIdx = i;
                }
            });

            const target = gameData.fleet[targetIdx];
            if (!target || target.hull <= 0) return;

            const damage = Math.floor(enemy.damage * 0.4 * (0.9 + Math.random() * 0.2));
            target.hull = Math.max(0, target.hull - damage);
            enemy.ap -= 15;

            this.message = `Enemy deals ${damage} damage!`;
            this.messageText.setText(this.message);
        });

        this.updateHealthBars();

        if (!this.checkCombatEnd()) {
            gameData.fleet.forEach(ship => {
                if (ship.hull > 0) ship.ap = ship.maxAp;
            });
            this.turn = 'player';
            this.turnText.setText('YOUR TURN').setColor('#4a7c4a');
            this.message = 'Your turn!';
            this.messageText.setText(this.message);
            this.updateShipInfo();
        }
    }

    checkCombatEnd() {
        const enemiesAlive = this.enemies.filter(e => e.hull > 0).length;
        if (enemiesAlive === 0) {
            this.time.delayedCall(1500, () => {
                if (this.isLiberation) {
                    PORTS[gameData.currentPort].liberated = true;
                    gameData.gold += 2000 + gameData.currentPort * 500;
                    gameData.warPoints += 50 + gameData.currentPort * 20;
                }
                this.scene.start('PortScene');
            });
            return true;
        }

        const playerAlive = gameData.fleet.filter(s => s.hull > 0).length;
        if (playerAlive === 0) {
            this.time.delayedCall(1500, () => {
                gameData.fleet = [createShip('sloop')];
                gameData.gold = Math.floor(gameData.gold * 0.5);
                this.scene.start('PortScene');
            });
            return true;
        }

        return false;
    }

    updateShipInfo() {
        const ship = gameData.fleet[this.selectedShip];
        this.shipInfoText.setText(`${ship.name} | AP: ${ship.ap}/${ship.maxAp}`);
    }

    updateHealthBars() {
        gameData.fleet.forEach((ship, i) => {
            if (this.playerHealthBars[i]) {
                this.updateHealthBarGraphics(this.playerHealthBars[i], ship.hull, ship.maxHull);
            }
        });

        this.enemies.forEach((enemy, i) => {
            if (this.enemyHealthBars[i]) {
                this.updateHealthBarGraphics(this.enemyHealthBars[i], enemy.hull, enemy.maxHull);
            }
        });
    }

    createHealthBar(x, y, current, max) {
        const container = this.add.container(x, y);

        for (let i = 0; i < 5; i++) {
            const empty = this.add.image(i * 22, 0, 'heart-empty').setScale(0.9);
            container.add(empty);
        }

        const ratio = current / max;
        const fullHearts = Math.floor(ratio * 5);

        for (let i = 0; i < fullHearts; i++) {
            const full = this.add.image(i * 22, 0, 'heart').setScale(0.9);
            container.add(full);
        }

        return container;
    }

    updateHealthBarGraphics(container, current, max) {
        container.removeAll(true);

        for (let i = 0; i < 5; i++) {
            const empty = this.add.image(i * 22, 0, 'heart-empty').setScale(0.9);
            container.add(empty);
        }

        const ratio = current / max;
        const fullHearts = Math.ceil(ratio * 5);

        for (let i = 0; i < fullHearts; i++) {
            const full = this.add.image(i * 22, 0, 'heart').setScale(0.9);
            container.add(full);
        }
    }

    getShipSize(type) {
        const largeShips = ['galleon', 'manOWar', 'shipOfLine', 'flagship'];
        const medShips = ['brigantine', 'brig', 'corvette', 'frigate'];
        if (largeShips.includes(type)) return 'ship-large';
        if (medShips.includes(type)) return 'ship-med';
        return 'ship-small';
    }

    drawWoodenPanel(x, y, w, h) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0x8b6914);
        gfx.fillRect(x, y, w, h);
        gfx.lineStyle(3, 0x3a2010);
        gfx.strokeRect(x, y, w, h);
    }
}

// Ship Yard Scene
class ShipYardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShipYardScene' });
    }

    create() {
        this.add.rectangle(640, 360, 1280, 720, 0x5090b0);

        this.drawWoodenPanel(0, 0, 1280, 60);
        this.drawRibbon(640, 30, 160, 40, 'Ship Yard');

        this.add.text(1100, 30, `Gold: ${gameData.gold}`, { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0, 0.5);
        this.add.text(1220, 30, `WP: ${gameData.warPoints}`, { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0, 0.5);

        // Buy Ships section
        this.add.text(50, 80, 'Buy Ships:', { fontSize: '20px', fontFamily: 'serif', color: '#fff', fontStyle: 'bold' });

        const availableShips = ['sloop', 'schooner', 'cutter', 'brigantine', 'brig', 'corvette', 'frigate'];
        availableShips.forEach((type, i) => {
            const ship = SHIP_TYPES[type];
            const y = 110 + i * 45;
            const canAfford = gameData.gold >= ship.cost && gameData.fleet.length < 5;

            const btn = this.add.rectangle(250, y + 20, 400, 40, canAfford ? 0x3a3020 : 0x222222)
                .setInteractive()
                .on('pointerover', () => canAfford && btn.setFillStyle(0x5c4033))
                .on('pointerout', () => btn.setFillStyle(canAfford ? 0x3a3020 : 0x222222))
                .on('pointerdown', () => {
                    if (canAfford) {
                        gameData.gold -= ship.cost;
                        gameData.fleet.push(createShip(type));
                        this.scene.restart();
                    }
                });

            this.add.text(60, y + 20, `${ship.name} - ${ship.cost} gold`, { fontSize: '16px', fontFamily: 'serif', color: canAfford ? '#fff' : '#888' }).setOrigin(0, 0.5);
            this.add.text(440, y + 20, `HP:${ship.hull} Sails:${ship.sails} Dmg:${ship.damage}`, { fontSize: '14px', fontFamily: 'serif', color: canAfford ? '#fff' : '#888' }).setOrigin(1, 0.5);
        });

        // Back button
        const backBtn = this.add.rectangle(110, 680, 120, 50, 0x5c4033)
            .setInteractive()
            .on('pointerover', () => backBtn.setFillStyle(0x7c5043))
            .on('pointerout', () => backBtn.setFillStyle(0x5c4033))
            .on('pointerdown', () => this.scene.start('PortScene'));
        this.add.text(110, 680, 'Back', { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0.5);
    }

    drawWoodenPanel(x, y, w, h) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0x8b6914);
        gfx.fillRect(x, y, w, h);
        gfx.lineStyle(3, 0x3a2010);
        gfx.strokeRect(x, y, w, h);
    }

    drawRibbon(x, y, w, h, text) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0xc41e3a);
        gfx.beginPath();
        gfx.moveTo(x - w/2 - 20, y - h/2);
        gfx.lineTo(x + w/2 + 20, y - h/2);
        gfx.lineTo(x + w/2 + 10, y);
        gfx.lineTo(x + w/2 + 20, y + h/2);
        gfx.lineTo(x - w/2 - 20, y + h/2);
        gfx.lineTo(x - w/2 - 10, y);
        gfx.closePath();
        gfx.fill();

        this.add.text(x, y, text, { fontSize: '24px', fontFamily: 'serif', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    }
}

// Market Scene
class MarketScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MarketScene' });
    }

    create() {
        this.add.rectangle(640, 360, 1280, 720, 0x5090b0);

        this.drawWoodenPanel(0, 0, 1280, 60);
        this.drawRibbon(640, 30, 120, 40, 'Market');

        this.add.text(20, 30, `Cargo: ${this.getTotalCargo()}/${this.getFleetCargo()}`, { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0, 0.5);
        this.goldText = this.add.text(1200, 30, `Gold: ${gameData.gold}`, { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0, 0.5);

        const goods = Object.keys(GOODS);
        const port = PORTS[gameData.currentPort];

        goods.forEach((good, i) => {
            const goodData = GOODS[good];
            const y = 80 + i * 75;

            const priceVariation = ((port.name.charCodeAt(0) + i) % 3) - 1;
            const buyPrice = priceVariation < 0 ? goodData.buyLow : goodData.buyHigh;
            const sellPrice = priceVariation > 0 ? goodData.sellHigh : goodData.sellLow;

            this.drawWoodenPanel(50, y, 1180, 65);

            this.add.text(70, y + 25, goodData.name, { fontSize: '18px', fontFamily: 'serif', color: '#fff', fontStyle: 'bold' });
            this.add.text(70, y + 50, `Owned: ${gameData.cargo[good]}`, { fontSize: '14px', fontFamily: 'serif', color: '#fff' });

            this.add.text(250, y + 38, `Buy: ${buyPrice}`, { fontSize: '14px', fontFamily: 'serif', color: priceVariation < 0 ? '#4a7c4a' : '#c41e3a' });
            this.add.text(400, y + 38, `Sell: ${sellPrice}`, { fontSize: '14px', fontFamily: 'serif', color: priceVariation > 0 ? '#4a7c4a' : '#c41e3a' });

            // Buy buttons
            [1, 10].forEach((amt, j) => {
                const bx = 585 + j * 80;
                const canBuy = gameData.gold >= buyPrice && this.getTotalCargo() < this.getFleetCargo();
                const btn = this.add.rectangle(bx, y + 32, 70, 35, canBuy ? 0x5c4033 : 0x333333)
                    .setInteractive()
                    .on('pointerover', () => canBuy && btn.setFillStyle(0x4a7c4a))
                    .on('pointerout', () => btn.setFillStyle(canBuy ? 0x5c4033 : 0x333333))
                    .on('pointerdown', () => {
                        const buyAmt = Math.min(amt, this.getFleetCargo() - this.getTotalCargo(), Math.floor(gameData.gold / buyPrice));
                        if (buyAmt > 0) {
                            gameData.gold -= buyPrice * buyAmt;
                            gameData.cargo[good] += buyAmt;
                            gameData.day++;
                            this.scene.restart();
                        }
                    });
                this.add.text(bx, y + 32, `Buy ${amt}`, { fontSize: '14px', fontFamily: 'serif', color: canBuy ? '#fff' : '#666' }).setOrigin(0.5);
            });

            // Sell buttons
            [1, 10].forEach((amt, j) => {
                const sx = 755 + j * 80;
                const canSell = gameData.cargo[good] > 0;
                const btn = this.add.rectangle(sx, y + 32, 70, 35, canSell ? 0x5c4033 : 0x333333)
                    .setInteractive()
                    .on('pointerover', () => canSell && btn.setFillStyle(0x4a7c4a))
                    .on('pointerout', () => btn.setFillStyle(canSell ? 0x5c4033 : 0x333333))
                    .on('pointerdown', () => {
                        const sellAmt = Math.min(amt, gameData.cargo[good]);
                        if (sellAmt > 0) {
                            gameData.gold += sellPrice * sellAmt;
                            gameData.cargo[good] -= sellAmt;
                            gameData.day++;
                            this.scene.restart();
                        }
                    });
                this.add.text(sx, y + 32, `Sell ${amt}`, { fontSize: '14px', fontFamily: 'serif', color: canSell ? '#fff' : '#666' }).setOrigin(0.5);
            });
        });

        // Back button
        const backBtn = this.add.rectangle(110, 680, 120, 50, 0x5c4033)
            .setInteractive()
            .on('pointerover', () => backBtn.setFillStyle(0x7c5043))
            .on('pointerout', () => backBtn.setFillStyle(0x5c4033))
            .on('pointerdown', () => this.scene.start('PortScene'));
        this.add.text(110, 680, 'Back', { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0.5);
    }

    getTotalCargo() {
        return Object.values(gameData.cargo).reduce((a, b) => a + b, 0);
    }

    getFleetCargo() {
        return gameData.fleet.reduce((a, s) => a + s.cargo, 0);
    }

    drawWoodenPanel(x, y, w, h) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0x8b6914);
        gfx.fillRect(x, y, w, h);
        gfx.lineStyle(3, 0x3a2010);
        gfx.strokeRect(x, y, w, h);
    }

    drawRibbon(x, y, w, h, text) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0xc41e3a);
        gfx.beginPath();
        gfx.moveTo(x - w/2 - 20, y - h/2);
        gfx.lineTo(x + w/2 + 20, y - h/2);
        gfx.lineTo(x + w/2 + 10, y);
        gfx.lineTo(x + w/2 + 20, y + h/2);
        gfx.lineTo(x - w/2 - 20, y + h/2);
        gfx.lineTo(x - w/2 - 10, y);
        gfx.closePath();
        gfx.fill();

        this.add.text(x, y, text, { fontSize: '24px', fontFamily: 'serif', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    }
}

// Fleet Scene
class FleetScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FleetScene' });
    }

    create() {
        this.add.rectangle(640, 360, 1280, 720, 0x5090b0);

        this.drawWoodenPanel(0, 0, 1280, 60);
        this.drawRibbon(640, 30, 100, 40, 'Fleet');

        this.add.text(1100, 30, `Gold: ${gameData.gold}`, { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0, 0.5);
        this.add.text(1220, 30, `WP: ${gameData.warPoints}`, { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0, 0.5);

        gameData.fleet.forEach((ship, i) => {
            const y = 80 + i * 120;
            this.drawWoodenPanel(50, y, 1180, 110);

            const size = this.getShipSize(ship.type);
            this.add.image(150, y + 55, size).setScale(0.6);

            this.add.text(250, y + 30, ship.name, { fontSize: '20px', fontFamily: 'serif', color: '#fff', fontStyle: 'bold' });
            this.add.text(250, y + 55, `Hull: ${ship.hull}/${ship.maxHull}`, { fontSize: '14px', fontFamily: 'serif', color: '#fff' });
            this.add.text(400, y + 55, `Sails/AP: ${ship.sails}/${ship.maxSails}`, { fontSize: '14px', fontFamily: 'serif', color: '#fff' });
            this.add.text(550, y + 55, `Crew: ${ship.crew}/${ship.maxCrew}`, { fontSize: '14px', fontFamily: 'serif', color: '#fff' });
            this.add.text(700, y + 55, `Cargo: ${ship.cargo}`, { fontSize: '14px', fontFamily: 'serif', color: '#fff' });
            this.add.text(850, y + 55, `Damage: ${ship.damage}`, { fontSize: '14px', fontFamily: 'serif', color: '#fff' });

            // Health bar
            this.createHealthBar(250, y + 75, ship.hull, ship.maxHull);

            // Repair button
            if (ship.hull < ship.maxHull) {
                const repairCost = Math.floor((ship.maxHull - ship.hull) / 2);
                const canRepair = gameData.gold >= repairCost;

                const repairBtn = this.add.rectangle(1060, y + 50, 120, 40, canRepair ? 0x5c4033 : 0x333333)
                    .setInteractive()
                    .on('pointerover', () => canRepair && repairBtn.setFillStyle(0x4a7c4a))
                    .on('pointerout', () => repairBtn.setFillStyle(canRepair ? 0x5c4033 : 0x333333))
                    .on('pointerdown', () => {
                        if (canRepair) {
                            gameData.gold -= repairCost;
                            ship.hull = ship.maxHull;
                            gameData.day++;
                            this.scene.restart();
                        }
                    });
                this.add.text(1060, y + 42, 'Repair', { fontSize: '14px', fontFamily: 'serif', color: canRepair ? '#fff' : '#888' }).setOrigin(0.5);
                this.add.text(1060, y + 58, `${repairCost}g`, { fontSize: '12px', fontFamily: 'serif', color: canRepair ? '#fff' : '#888' }).setOrigin(0.5);
            }
        });

        // Back button
        const backBtn = this.add.rectangle(110, 680, 120, 50, 0x5c4033)
            .setInteractive()
            .on('pointerover', () => backBtn.setFillStyle(0x7c5043))
            .on('pointerout', () => backBtn.setFillStyle(0x5c4033))
            .on('pointerdown', () => this.scene.start('PortScene'));
        this.add.text(110, 680, 'Back', { fontSize: '18px', fontFamily: 'serif', color: '#fff' }).setOrigin(0.5);
    }

    getShipSize(type) {
        const largeShips = ['galleon', 'manOWar', 'shipOfLine', 'flagship'];
        const medShips = ['brigantine', 'brig', 'corvette', 'frigate'];
        if (largeShips.includes(type)) return 'ship-large';
        if (medShips.includes(type)) return 'ship-med';
        return 'ship-small';
    }

    createHealthBar(x, y, current, max) {
        for (let i = 0; i < 5; i++) {
            this.add.image(x + i * 22, y, 'heart-empty').setScale(0.9);
        }

        const ratio = current / max;
        const fullHearts = Math.ceil(ratio * 5);

        for (let i = 0; i < fullHearts; i++) {
            this.add.image(x + i * 22, y, 'heart').setScale(0.9);
        }
    }

    drawWoodenPanel(x, y, w, h) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0x8b6914);
        gfx.fillRect(x, y, w, h);
        gfx.lineStyle(3, 0x3a2010);
        gfx.strokeRect(x, y, w, h);
    }

    drawRibbon(x, y, w, h, text) {
        const gfx = this.add.graphics();
        gfx.fillStyle(0xc41e3a);
        gfx.beginPath();
        gfx.moveTo(x - w/2 - 20, y - h/2);
        gfx.lineTo(x + w/2 + 20, y - h/2);
        gfx.lineTo(x + w/2 + 10, y);
        gfx.lineTo(x + w/2 + 20, y + h/2);
        gfx.lineTo(x - w/2 - 20, y + h/2);
        gfx.lineTo(x - w/2 - 10, y);
        gfx.closePath();
        gfx.fill();

        this.add.text(x, y, text, { fontSize: '24px', fontFamily: 'serif', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    }
}

// Game configuration
const config = {
    type: Phaser.CANVAS,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#1a3050',
    scene: [BootScene, TitleScene, MapScene, PortScene, CombatScene, ShipYardScene, MarketScene, FleetScene]
};

const game = new Phaser.Game(config);
