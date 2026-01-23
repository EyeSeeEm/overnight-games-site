// High Tea - Phaser 3 Implementation
// Historical Trading Strategy Game

const COLORS = {
    paper: 0xf4e4c1,
    paperDark: 0xd4c4a1,
    sepia: 0x8b6914,
    brown: 0x4a3520,
    darkBrown: 0x2a1f1a,
    ocean: 0x3a5a6a,
    land: 0x6a8a5a,
    port: 0x8a6a4a,
    red: 0xaa3333,
    green: 0x338833,
    gold: 0xd4a020,
    tea: 0x5a8a5a,
    opium: 0x7a5a8a
};

const PORTS = [
    { name: 'Lintin', x: 350, y: 300, risk: 1, baseOffer: 8, maxOffer: 15 },
    { name: 'Whampoa', x: 500, y: 260, risk: 2, baseOffer: 12, maxOffer: 22 },
    { name: 'Canton', x: 600, y: 200, risk: 3, baseOffer: 18, maxOffer: 32 },
    { name: 'Macao', x: 380, y: 400, risk: 2, baseOffer: 10, maxOffer: 25 },
    { name: 'Bocca Tigris', x: 520, y: 360, risk: 4, baseOffer: 22, maxOffer: 40 }
];

const QUOTAS = [60, 90, 120, 180, 250, 320, 400, 500, 580, 660];

// ==================== MENU SCENE ====================
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width, height } = this.cameras.main;

        // Paper background
        this.add.rectangle(width / 2, height / 2, width, height, COLORS.paper);

        // Border
        const border = this.add.graphics();
        border.lineStyle(4, COLORS.sepia);
        border.strokeRect(10, 10, width - 20, height - 20);

        // Title
        this.add.text(width / 2, 120, 'HIGH TEA', {
            fontSize: '64px',
            fontFamily: 'Georgia',
            color: '#4a3520',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 180, 'A Trading Strategy Game', {
            fontSize: '24px',
            fontFamily: 'Georgia',
            color: '#8b6914'
        }).setOrigin(0.5);

        // Historical context
        const lines = [
            'The year is 1830. Britain is addicted to tea,',
            'but China only accepts silver in trade.',
            '',
            'Your solution? Sell opium from Bengal to Chinese ports,',
            'use the silver to buy tea, and ship it to Britain.',
            '',
            'Can you satisfy Britain\'s insatiable demand',
            'while evading Chinese authorities?'
        ];

        lines.forEach((line, i) => {
            this.add.text(width / 2, 260 + i * 28, line, {
                fontSize: '18px',
                fontFamily: 'Georgia',
                color: '#4a3520'
            }).setOrigin(0.5);
        });

        // Start prompt
        this.startText = this.add.text(width / 2, 520, 'Click or Press SPACE to Begin', {
            fontSize: '28px',
            fontFamily: 'Georgia',
            color: '#8b6914'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.startText,
            alpha: { from: 1, to: 0.4 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Controls hint
        this.add.text(width / 2, 580, 'Q - Debug | P - Pause | 1/2/3 - Time Speed', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#4a3520'
        }).setOrigin(0.5);

        // Input
        this.input.on('pointerdown', () => this.startGame());
        this.input.keyboard.on('keydown-SPACE', () => this.startGame());
    }

    startGame() {
        this.scene.start('GameScene');
    }
}

// ==================== GAME SCENE ====================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        this.gameData = {
            year: 1830,
            silver: 500,
            opium: 0,
            tea: 0,
            ships: 1,
            mood: 80,
            quota: 60,
            teaShipped: 0,
            clipperTimer: 45,
            opiumPrice: 20,
            teaPrice: 15,
            timeScale: 1,
            totalOpiumSold: 0,
            totalTeaShipped: 0,
            totalSilverEarned: 0,
            shipsLost: 0,
            hasBribeCard: false
        };
        this.offers = [];
        this.activeShips = [];
        this.offerSpawnTimer = 0;
        this.debugMode = false;
        this.isPaused = false;
        this.tutorialStep = 0;
    }

    create() {
        const { width, height } = this.cameras.main;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, COLORS.paper);

        this.createHeader();
        this.createLeftPanel();
        this.createMap();
        this.createRightPanel();
        this.createBottomPanel();
        this.createTutorial();

        // Input
        this.input.keyboard.on('keydown-Q', () => this.toggleDebug());
        this.input.keyboard.on('keydown-P', () => this.togglePause());
        this.input.keyboard.on('keydown-ONE', () => this.gameData.timeScale = 1);
        this.input.keyboard.on('keydown-TWO', () => this.gameData.timeScale = 2);
        this.input.keyboard.on('keydown-THREE', () => this.gameData.timeScale = 3);

        this.notifications = [];
    }

    createHeader() {
        const header = this.add.rectangle(450, 30, 900, 60, COLORS.sepia);

        this.yearText = this.add.text(20, 20, 'Year: 1830', {
            fontSize: '20px',
            fontFamily: 'Georgia',
            color: '#f4e4c1',
            fontStyle: 'bold'
        });

        this.add.text(200, 20, 'Britain:', {
            fontSize: '18px',
            fontFamily: 'Georgia',
            color: '#f4e4c1'
        });

        // Mood bar background
        this.add.rectangle(350, 30, 150, 25, COLORS.darkBrown);
        this.moodBar = this.add.rectangle(277, 30, 0, 21, COLORS.green).setOrigin(0, 0.5);
        this.moodText = this.add.text(350, 20, '80%', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#f4e4c1'
        }).setOrigin(0.5, 0);

        this.speedText = this.add.text(500, 20, 'Speed: 1x', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#f4e4c1'
        });

        this.silverText = this.add.text(880, 20, 'Silver: 500', {
            fontSize: '20px',
            fontFamily: 'Georgia',
            color: '#f4e4c1',
            fontStyle: 'bold'
        }).setOrigin(1, 0);
    }

    createLeftPanel() {
        // Panel background
        this.add.rectangle(95, 350, 170, 520, COLORS.paperDark);
        const border = this.add.graphics();
        border.lineStyle(2, COLORS.sepia);
        border.strokeRect(10, 70, 170, 520);

        // Opium section
        this.add.rectangle(95, 90, 160, 30, COLORS.opium);
        this.add.text(95, 82, 'BUY OPIUM', {
            fontSize: '16px',
            fontFamily: 'Georgia',
            color: '#f4e4c1',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        this.opiumPriceText = this.add.text(25, 120, 'Price: 20 silver', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#4a3520'
        });

        this.opiumStockText = this.add.text(25, 145, 'Stock: 0 chests', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#4a3520'
        });

        // Opium buttons
        this.createButton(45, 180, 50, 25, '5', () => this.buyOpium(5));
        this.createButton(100, 180, 50, 25, '10', () => this.buyOpium(10));
        this.createButton(155, 180, 35, 25, '15', () => this.buyOpium(15));

        // Tea section
        this.add.rectangle(95, 240, 160, 30, COLORS.tea);
        this.add.text(95, 232, 'BUY TEA', {
            fontSize: '16px',
            fontFamily: 'Georgia',
            color: '#f4e4c1',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        this.teaPriceText = this.add.text(25, 275, 'Price: 15 silver', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#4a3520'
        });

        this.teaStockText = this.add.text(25, 300, 'Stock: 0 chests', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#4a3520'
        });

        // Tea buttons
        this.createButton(45, 335, 50, 25, '5', () => this.buyTea(5));
        this.createButton(100, 335, 50, 25, '10', () => this.buyTea(10));
        this.createButton(155, 335, 35, 25, '15', () => this.buyTea(15));

        // Fleet section
        this.add.rectangle(95, 400, 160, 30, COLORS.sepia);
        this.add.text(95, 392, 'FLEET', {
            fontSize: '16px',
            fontFamily: 'Georgia',
            color: '#f4e4c1',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        this.shipsText = this.add.text(25, 440, 'Ships: 1/1', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#4a3520'
        });

        this.shipIcons = this.add.text(25, 470, '⛵', {
            fontSize: '24px',
            fontFamily: 'Georgia'
        });
    }

    createButton(x, y, w, h, text, callback) {
        const btn = this.add.rectangle(x, y, w, h, COLORS.sepia).setInteractive();
        const label = this.add.text(x, y - 4, text, {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#f4e4c1',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        btn.on('pointerdown', callback);
        btn.on('pointerover', () => btn.setFillStyle(COLORS.gold));
        btn.on('pointerout', () => btn.setFillStyle(COLORS.sepia));

        return btn;
    }

    createMap() {
        // Ocean
        this.add.rectangle(480, 340, 480, 400, COLORS.ocean);

        // Land
        const land = this.add.graphics();
        land.fillStyle(COLORS.land);
        land.beginPath();
        land.moveTo(500, 80);
        land.lineTo(720, 80);
        land.lineTo(720, 200);
        land.lineTo(640, 260);
        land.lineTo(580, 220);
        land.lineTo(520, 280);
        land.lineTo(480, 200);
        land.closePath();
        land.fillPath();

        land.beginPath();
        land.moveTo(320, 360);
        land.lineTo(420, 320);
        land.lineTo(440, 400);
        land.lineTo(380, 480);
        land.lineTo(300, 440);
        land.closePath();
        land.fillPath();

        // Map title
        this.add.text(480, 100, 'PEARL RIVER DELTA', {
            fontSize: '16px',
            fontFamily: 'Georgia',
            color: '#4a3520',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Ports
        this.portGraphics = [];
        PORTS.forEach(port => {
            const circle = this.add.circle(port.x, port.y, 15, COLORS.port).setInteractive();
            this.add.text(port.x, port.y + 28, port.name, {
                fontSize: '12px',
                fontFamily: 'Georgia',
                color: '#f4e4c1'
            }).setOrigin(0.5);

            // Risk bars
            for (let i = 0; i < 5; i++) {
                this.add.rectangle(port.x - 12 + i * 7, port.y + 42, 5, 8, i < port.risk ? 0xaa3333 : 0x888888);
            }

            this.portGraphics.push(circle);
        });

        // Your port
        this.add.circle(240, 480, 20, COLORS.sepia);
        this.add.text(240, 475, 'YOUR', { fontSize: '8px', fontFamily: 'Georgia', color: '#f4e4c1' }).setOrigin(0.5);
        this.add.text(240, 485, 'PORT', { fontSize: '8px', fontFamily: 'Georgia', color: '#f4e4c1' }).setOrigin(0.5);

        // Offer container
        this.offerContainer = this.add.container(0, 0);

        // Ship container
        this.shipContainer = this.add.container(0, 0);
    }

    createRightPanel() {
        this.add.rectangle(805, 200, 180, 180, COLORS.paperDark);
        const border = this.add.graphics();
        border.lineStyle(2, COLORS.sepia);
        border.strokeRect(715, 70, 180, 180);

        this.add.rectangle(805, 90, 170, 30, COLORS.tea);
        this.add.text(805, 82, 'TEA CLIPPER', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#f4e4c1',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        this.clipperText = this.add.text(725, 120, 'Arriving in: 45s', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#4a3520'
        });

        this.quotaText = this.add.text(725, 145, 'Quota: 60 chests', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#4a3520'
        });

        this.yourTeaText = this.add.text(725, 170, 'Your tea: 0 chests', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#4a3520'
        });

        this.shippedText = this.add.text(725, 195, 'Shipped: 0/60', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#4a3520'
        });

        // Progress bar
        this.add.rectangle(805, 230, 160, 20, COLORS.darkBrown);
        this.quotaBar = this.add.rectangle(727, 230, 0, 16, COLORS.tea).setOrigin(0, 0.5);

        // Speed buttons
        this.add.text(725, 270, 'Speed:', {
            fontSize: '12px',
            fontFamily: 'Georgia',
            color: '#4a3520'
        });

        this.speedBtns = [];
        for (let i = 1; i <= 3; i++) {
            const btn = this.createButton(770 + (i - 1) * 45, 280, 40, 25, `${i}x`, () => {
                this.gameData.timeScale = i;
            });
            this.speedBtns.push(btn);
        }
    }

    createBottomPanel() {
        this.add.rectangle(480, 560, 480, 80, COLORS.sepia);

        this.newsText = this.add.text(250, 530, 'Welcome, merchant. Britain needs tea!', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#f4e4c1'
        });

        this.add.text(250, 560, 'Click offers on map to send ships. Buy opium first!', {
            fontSize: '12px',
            fontFamily: 'Georgia',
            color: '#f4e4c1'
        });

        this.add.text(250, 580, 'Ship tea to Britain before the clipper arrives.', {
            fontSize: '12px',
            fontFamily: 'Georgia',
            color: '#f4e4c1'
        });
    }

    createTutorial() {
        this.tutorialOverlay = this.add.rectangle(450, 325, 900, 650, 0x000000, 0.7);
        this.tutorialBox = this.add.rectangle(450, 325, 400, 200, COLORS.paper);
        this.tutorialText = this.add.text(450, 300, '', {
            fontSize: '16px',
            fontFamily: 'Georgia',
            color: '#4a3520',
            align: 'center',
            wordWrap: { width: 380 }
        }).setOrigin(0.5);

        this.tutorialBtn = this.createButton(450, 400, 100, 35, 'Next', () => this.advanceTutorial());

        this.showTutorialStep(0);
    }

    showTutorialStep(step) {
        const steps = [
            'Welcome! This is your trading post in 1830.\n\nYou must ship tea to Britain to satisfy their demand.',
            'First, BUY OPIUM from the panel on the left.\n\nClick the "10" button to buy 10 chests.',
            'Now wait for TRADE OFFERS to appear on the map.\n\nClick an offer to send your ship to sell opium.',
            'Use the silver you earn to BUY TEA.\n\nThe TEA CLIPPER will arrive to collect your quota.',
            'Meet the quota to earn a new ship and advance!\n\nGood luck, merchant!'
        ];

        if (step < steps.length) {
            this.tutorialText.setText(steps[step]);
            this.tutorialStep = step;
        } else {
            this.tutorialOverlay.setVisible(false);
            this.tutorialBox.setVisible(false);
            this.tutorialText.setVisible(false);
            this.tutorialBtn.setVisible(false);
        }
    }

    advanceTutorial() {
        this.showTutorialStep(this.tutorialStep + 1);
    }

    update(time, delta) {
        if (this.isPaused || this.tutorialOverlay.visible) return;

        const dt = (delta / 1000) * this.gameData.timeScale;

        this.updateOffers(dt);
        this.updateShips(dt);
        this.updateClipper(dt);
        this.updateUI();
        this.checkGameState();
    }

    updateOffers(dt) {
        this.offerSpawnTimer -= dt;
        if (this.offerSpawnTimer <= 0 && this.offers.length < 3) {
            this.spawnOffer();
            this.offerSpawnTimer = 4 + Math.random() * 4;
        }

        // Update existing offers
        for (let i = this.offers.length - 1; i >= 0; i--) {
            const offer = this.offers[i];
            offer.timer -= dt;

            // Update timer bar
            if (offer.timerBar) {
                offer.timerBar.width = (offer.timer / 20) * 70;
                offer.timerBar.setFillStyle(offer.timer < 5 ? COLORS.red : COLORS.green);
            }

            if (offer.timer <= 0) {
                offer.container.destroy();
                this.offers.splice(i, 1);
            }
        }
    }

    spawnOffer() {
        const port = PORTS[Math.floor(Math.random() * PORTS.length)];
        const yearFactor = (this.gameData.year - 1830) * 0.1;

        const quantity = port.baseOffer + Math.floor(Math.random() * (port.maxOffer - port.baseOffer));
        const priceBase = 40 + yearFactor * 30;
        const price = Math.round(priceBase + (Math.random() - 0.3) * 20 + port.risk * 5);

        const x = port.x + (Math.random() - 0.5) * 40;
        const y = port.y - 60;

        const container = this.add.container(x, y);

        const bubble = this.add.ellipse(0, 0, 90, 70, COLORS.paper);
        bubble.setStrokeStyle(2, COLORS.sepia);
        container.add(bubble);

        const text1 = this.add.text(0, -12, `${quantity} chests`, {
            fontSize: '12px',
            fontFamily: 'Georgia',
            color: '#4a3520',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(text1);

        const text2 = this.add.text(0, 6, `@${price} silver`, {
            fontSize: '12px',
            fontFamily: 'Georgia',
            color: '#4a3520'
        }).setOrigin(0.5);
        container.add(text2);

        const timerBar = this.add.rectangle(-35, 28, 70, 4, COLORS.green).setOrigin(0, 0.5);
        container.add(timerBar);

        bubble.setInteractive();
        bubble.on('pointerdown', () => this.acceptOffer(offer));
        bubble.on('pointerover', () => bubble.setStrokeStyle(3, COLORS.green));
        bubble.on('pointerout', () => bubble.setStrokeStyle(2, COLORS.sepia));

        const offer = {
            port,
            quantity,
            price,
            timer: 15,
            container,
            timerBar
        };

        this.offers.push(offer);
        this.offerContainer.add(container);
    }

    acceptOffer(offer) {
        const availableShips = this.gameData.ships - this.activeShips.length;
        if (availableShips <= 0) {
            this.showNotification('No ships available!', COLORS.red);
            return;
        }
        if (this.gameData.opium < offer.quantity) {
            this.showNotification('Not enough opium!', COLORS.red);
            return;
        }

        this.gameData.opium -= offer.quantity;

        // Create ship
        const ship = this.add.text(240, 480, '⛵', {
            fontSize: '24px',
            fontFamily: 'Georgia'
        }).setOrigin(0.5);

        this.activeShips.push({
            sprite: ship,
            port: offer.port,
            quantity: offer.quantity,
            price: offer.price,
            progress: 0,
            returning: false
        });

        this.shipContainer.add(ship);

        // Remove offer
        const idx = this.offers.indexOf(offer);
        if (idx >= 0) {
            offer.container.destroy();
            this.offers.splice(idx, 1);
        }
    }

    updateShips(dt) {
        for (let i = this.activeShips.length - 1; i >= 0; i--) {
            const ship = this.activeShips[i];
            ship.progress += dt * 0.3;

            if (!ship.returning && ship.progress >= 1) {
                this.resolveShipMission(ship);
                ship.returning = true;
                ship.progress = 0;
            } else if (ship.returning && ship.progress >= 1) {
                ship.sprite.destroy();
                this.activeShips.splice(i, 1);
                continue;
            }

            // Update position
            const startX = 240, startY = 480;
            const endX = ship.port.x, endY = ship.port.y;

            if (!ship.returning) {
                ship.sprite.x = startX + (endX - startX) * ship.progress;
                ship.sprite.y = startY + (endY - startY) * ship.progress;
            } else {
                ship.sprite.x = endX + (startX - endX) * ship.progress;
                ship.sprite.y = endY + (startY - endY) * ship.progress;
            }
        }
    }

    resolveShipMission(ship) {
        const yearIndex = this.gameData.year - 1830;
        let captureChance = 0.05 + (ship.port.risk - 1) * 0.05;
        if (yearIndex < 2) captureChance = 0.01;
        captureChance += yearIndex * 0.02;
        captureChance = Math.min(captureChance, 0.4);

        if (Math.random() < captureChance) {
            const outcome = Math.random();
            if (outcome < 0.6) {
                const partial = Math.floor(ship.quantity * ship.price * 0.3);
                this.gameData.silver += partial;
                this.gameData.totalSilverEarned += partial;
                this.showNotification(`Escaped! Recovered ${partial} silver`, COLORS.gold);
            } else if (outcome < 0.8) {
                const earned = Math.floor(ship.quantity * ship.price * 0.5);
                this.gameData.silver += earned;
                this.showNotification(`Fined! Earned ${earned} silver`, COLORS.gold);
            } else if (outcome < 0.95) {
                this.showNotification('Cargo confiscated!', COLORS.red);
            } else if (this.gameData.ships > 1) {
                this.gameData.ships--;
                this.gameData.shipsLost++;
                this.showNotification('SHIP CAPTURED!', COLORS.red);
            } else {
                this.showNotification('Cargo confiscated!', COLORS.red);
            }
        } else {
            const earned = ship.quantity * ship.price;
            this.gameData.silver += earned;
            this.gameData.totalSilverEarned += earned;
            this.gameData.totalOpiumSold += ship.quantity;
            this.showNotification(`Success! +${earned} silver`, COLORS.green);
        }
    }

    updateClipper(dt) {
        this.gameData.clipperTimer -= dt;
        if (this.gameData.clipperTimer <= 0) {
            this.shipTea();
        }
    }

    shipTea() {
        const toShip = Math.min(this.gameData.tea, this.gameData.quota - this.gameData.teaShipped);
        if (toShip > 0) {
            this.gameData.tea -= toShip;
            this.gameData.teaShipped += toShip;
            this.gameData.totalTeaShipped += toShip;
            this.showNotification(`Shipped ${toShip} tea!`, COLORS.tea);
        }

        if (this.gameData.teaShipped >= this.gameData.quota) {
            this.gameData.mood = Math.min(100, this.gameData.mood + 15);
            this.gameData.ships = Math.min(6, this.gameData.ships + 1);
            this.showNotification('QUOTA MET! +1 Ship', COLORS.green);
            this.advanceYear();
        } else {
            const deficit = this.gameData.quota - this.gameData.teaShipped;
            const loss = Math.ceil(deficit / 10) * 3;
            this.gameData.mood -= loss;
            this.showNotification(`Quota short! Mood -${loss}`, COLORS.red);
            this.advanceYear();
        }
    }

    advanceYear() {
        this.gameData.year++;
        this.gameData.teaShipped = 0;
        this.gameData.clipperTimer = 45;

        if (this.gameData.year > 1839) {
            this.scene.start('VictoryScene', { data: this.gameData });
            return;
        }

        this.gameData.quota = QUOTAS[this.gameData.year - 1830];

        const yearIndex = this.gameData.year - 1830;
        if (yearIndex < 3) {
            this.gameData.opiumPrice = 15 + Math.floor(Math.random() * 20);
            this.gameData.teaPrice = 12 + Math.floor(Math.random() * 13);
        } else if (yearIndex < 6) {
            this.gameData.opiumPrice = 45 + Math.floor(Math.random() * 25);
            this.gameData.teaPrice = 25 + Math.floor(Math.random() * 20);
        } else {
            this.gameData.opiumPrice = 70 + Math.floor(Math.random() * 50);
            this.gameData.teaPrice = 45 + Math.floor(Math.random() * 35);
        }

        this.showNotification(`Year ${this.gameData.year}. Quota: ${this.gameData.quota}`, COLORS.paper);
    }

    buyOpium(amount) {
        const cost = amount * this.gameData.opiumPrice;
        if (this.gameData.silver >= cost) {
            this.gameData.silver -= cost;
            this.gameData.opium += amount;
            this.showNotification(`Bought ${amount} opium`, COLORS.opium);
        }
    }

    buyTea(amount) {
        const cost = amount * this.gameData.teaPrice;
        if (this.gameData.silver >= cost) {
            this.gameData.silver -= cost;
            this.gameData.tea += amount;
            this.showNotification(`Bought ${amount} tea`, COLORS.tea);
        }
    }

    updateUI() {
        const d = this.gameData;
        this.yearText.setText(`Year: ${d.year}`);
        this.silverText.setText(`Silver: ${d.silver}`);
        this.speedText.setText(`Speed: ${d.timeScale}x`);

        this.moodBar.width = (d.mood / 100) * 146;
        this.moodBar.setFillStyle(d.mood > 60 ? COLORS.green : d.mood > 30 ? COLORS.gold : COLORS.red);
        this.moodText.setText(`${d.mood}%`);

        this.opiumPriceText.setText(`Price: ${d.opiumPrice} silver`);
        this.opiumStockText.setText(`Stock: ${d.opium} chests`);
        this.teaPriceText.setText(`Price: ${d.teaPrice} silver`);
        this.teaStockText.setText(`Stock: ${d.tea} chests`);

        const available = d.ships - this.activeShips.length;
        this.shipsText.setText(`Ships: ${available}/${d.ships}`);
        this.shipIcons.setText('⛵'.repeat(d.ships));

        this.clipperText.setText(`Arriving in: ${Math.ceil(d.clipperTimer)}s`);
        this.quotaText.setText(`Quota: ${d.quota} chests`);
        this.yourTeaText.setText(`Your tea: ${d.tea} chests`);
        this.shippedText.setText(`Shipped: ${d.teaShipped}/${d.quota}`);

        const progress = Math.min(1, d.teaShipped / d.quota);
        this.quotaBar.width = progress * 156;
    }

    checkGameState() {
        if (this.gameData.mood <= 0) {
            this.scene.start('GameOverScene', { data: this.gameData });
        }

        // Softlock prevention
        if (this.gameData.silver <= 0 && this.gameData.opium <= 0 && this.gameData.tea <= 0 && this.activeShips.length === 0) {
            this.gameData.silver = 100;
            this.showNotification('Emergency loan! +100 silver', COLORS.gold);
        }
    }

    showNotification(text, color) {
        const notif = this.add.text(450, 500, text, {
            fontSize: '16px',
            fontFamily: 'Georgia',
            color: '#' + color.toString(16).padStart(6, '0'),
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: notif,
            y: 450,
            alpha: 0,
            duration: 2000,
            onComplete: () => notif.destroy()
        });
    }

    toggleDebug() {
        this.debugMode = !this.debugMode;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }
}

// ==================== GAME OVER SCENE ====================
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(params) {
        this.data = params.data || {};
    }

    create() {
        const { width, height } = this.cameras.main;

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);

        this.add.text(width / 2, 150, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'Georgia',
            color: '#aa3333'
        }).setOrigin(0.5);

        this.add.text(width / 2, 250, 'Britain has lost patience with your trading.', {
            fontSize: '20px',
            fontFamily: 'Georgia',
            color: '#f4e4c1'
        }).setOrigin(0.5);

        this.add.text(width / 2, 350, `Years survived: ${(this.data.year || 1830) - 1830}`, {
            fontSize: '16px',
            fontFamily: 'Georgia',
            color: '#f4e4c1'
        }).setOrigin(0.5);

        this.add.text(width / 2, 450, 'Press SPACE to try again', {
            fontSize: '24px',
            fontFamily: 'Georgia',
            color: '#f4e4c1'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('MenuScene'));
    }
}

// ==================== VICTORY SCENE ====================
class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    init(params) {
        this.data = params.data || {};
    }

    create() {
        const { width, height } = this.cameras.main;

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);

        this.add.text(width / 2, 100, 'VICTORY!', {
            fontSize: '48px',
            fontFamily: 'Georgia',
            color: '#d4a020'
        }).setOrigin(0.5);

        this.add.text(width / 2, 170, 'You survived all 9 years of the Opium Trade.', {
            fontSize: '18px',
            fontFamily: 'Georgia',
            color: '#f4e4c1'
        }).setOrigin(0.5);

        const stats = [
            `Total opium sold: ${this.data.totalOpiumSold || 0} chests`,
            `Total tea shipped: ${this.data.totalTeaShipped || 0} chests`,
            `Total silver earned: ${this.data.totalSilverEarned || 0}`,
            `Ships lost: ${this.data.shipsLost || 0}`
        ];

        stats.forEach((stat, i) => {
            this.add.text(width / 2, 250 + i * 35, stat, {
                fontSize: '16px',
                fontFamily: 'Georgia',
                color: '#f4e4c1'
            }).setOrigin(0.5);
        });

        const addictions = Math.floor((this.data.totalOpiumSold || 0) * 5);
        this.add.text(width / 2, 430, `Estimated Chinese addicted: ${addictions.toLocaleString()}`, {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#aa3333'
        }).setOrigin(0.5);

        this.add.text(width / 2, 480, 'The First Opium War (1839-1842) would soon follow.', {
            fontSize: '12px',
            fontFamily: 'Georgia',
            color: '#f4e4c1'
        }).setOrigin(0.5);

        this.add.text(width / 2, 550, 'Press SPACE to play again', {
            fontSize: '24px',
            fontFamily: 'Georgia',
            color: '#f4e4c1'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('MenuScene'));
    }
}

// ==================== GAME CONFIG ====================
const config = {
    type: Phaser.CANVAS,
    width: 900,
    height: 650,
    parent: 'game-container',
    backgroundColor: '#2a1f1a',
    scene: [MenuScene, GameScene, GameOverScene, VictoryScene]
};

const game = new Phaser.Game(config);
