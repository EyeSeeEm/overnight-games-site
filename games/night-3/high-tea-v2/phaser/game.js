// High Tea Clone - Phaser 3 Version (Expanded)
const COLORS = {
    sea: 0x4a8a8a,
    seaLight: 0x5a9a9a,
    seaDark: 0x3a7a7a,
    land: 0xc4a060,
    landDark: 0xa08040,
    landLight: 0xd4b070,
    panelBg: 0xf4e8d0,
    panelBorder: 0xa08050,
    text: 0x3a2a1a,
    textLight: 0x6a5a4a,
    silver: 0x708090,
    opium: 0x804020,
    tea: 0x408040,
    highlight: 0xffd700,
    danger: 0xc04040,
    warning: 0xff8800,
    button: 0xd4c0a0,
    buttonHover: 0xe8d8b8,
    offer: 0xffffff,
    ship: 0x8b4513,
    bribe: 0x9932cc
};

// Historical events
const HISTORICAL_EVENTS = {
    1832: { title: "Orders Drying Up", message: "Chinese merchants are becoming cautious. Trade offers less frequent." },
    1833: { title: "Dealing Houses Merge", message: "The Bengal trading houses have consolidated. Opium prices soar!" },
    1836: { title: "Commissioner Lin Appointed", message: "Emperor Daoguang appoints Lin Zexu to end the opium trade." },
    1838: { title: "Lin Arrives in Canton", message: "Commissioner Lin has arrived. The noose tightens." },
    1839: { title: "Final Warning", message: "Lin Zexu demands all foreign opium be surrendered. War is imminent." }
};

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        this.createTextures();
        this.scene.start('GameScene');
    }

    createTextures() {
        // Ship texture
        const shipGfx = this.make.graphics({ add: false });
        shipGfx.fillStyle(COLORS.ship);
        shipGfx.beginPath();
        shipGfx.moveTo(20, 10);
        shipGfx.lineTo(5, 5);
        shipGfx.lineTo(5, 15);
        shipGfx.closePath();
        shipGfx.fillPath();
        shipGfx.fillStyle(0xffffff);
        shipGfx.fillRect(8, 2, 2, 16);
        shipGfx.beginPath();
        shipGfx.moveTo(9, 4);
        shipGfx.lineTo(18, 10);
        shipGfx.lineTo(9, 16);
        shipGfx.fillPath();
        shipGfx.generateTexture('ship', 24, 20);

        // Port marker
        const portGfx = this.make.graphics({ add: false });
        portGfx.fillStyle(0xffffff);
        portGfx.fillCircle(10, 10, 8);
        portGfx.lineStyle(2, COLORS.panelBorder);
        portGfx.strokeCircle(10, 10, 8);
        portGfx.generateTexture('port', 20, 20);

        // Particle texture
        const partGfx = this.make.graphics({ add: false });
        partGfx.fillStyle(0xffffff);
        partGfx.fillCircle(4, 4, 4);
        partGfx.generateTexture('particle', 8, 8);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init() {
        this.showTutorial = true;

        this.gameState = {
            year: 1830,
            silver: 1000, // Increased from 500 for easier start
            opium: 20, // Start with some opium to trade immediately
            tea: 0,
            ships: 1,
            maxShips: 6,
            mood: 100,
            quota: 60,
            teaShipped: 0,
            totalTeaShipped: 0,
            totalOpiumSold: 0,
            quotaTimer: 150, // Increased from 120 for more time
            gameOver: false,
            victory: false,
            bribeCards: 0,
            finesPaid: 0,
            shipsLost: 0
        };

        this.opiumPrice = 25;
        this.teaPrice = 15;
        this.offers = [];
        this.activeShips = [];
        this.particles = [];
        this.floatingTexts = [];
        this.newsMessage = "Welcome to the Pearl River Delta...";
        this.newsTimer = 10;
        this.currentEvent = null;
    }

    create() {
        // Draw map background
        this.drawMap();

        // Create ports
        this.ports = [
            { name: 'Lintin Island', x: 650, y: 150, risk: 1, baseRisk: 1, basePrice: 1.0 },
            { name: 'Whampoa', x: 700, y: 280, risk: 2, baseRisk: 2, basePrice: 1.1 },
            { name: 'Canton', x: 580, y: 220, risk: 3, baseRisk: 3, basePrice: 1.25 },
            { name: 'Macao', x: 550, y: 450, risk: 2, baseRisk: 2, basePrice: 1.15 },
            { name: 'Bocca Tigris', x: 750, y: 380, risk: 4, baseRisk: 4, basePrice: 1.4 },
            { name: 'Hong Kong', x: 820, y: 320, risk: 3, baseRisk: 3, basePrice: 1.3, unlocked: false }
        ];

        this.ports.forEach(port => {
            if (port.unlocked === false) return;
            const marker = this.add.image(port.x, port.y, 'port').setInteractive();
            const label = this.add.text(port.x, port.y + 20, port.name, {
                fontSize: '11px',
                fontFamily: 'Georgia',
                color: '#3a2a1a'
            }).setOrigin(0.5);
            port.marker = marker;
            port.label = label;

            // Risk indicator
            port.riskDot = this.add.circle(port.x + 12, port.y - 12, 5, this.getRiskColor(port.risk));
        });

        // Create ship sprites group
        this.shipSprites = this.add.group();

        // Create offer containers group
        this.offerContainers = this.add.group();

        // Create UI
        this.createUI();

        // Create screen effects
        this.screenFlash = this.add.rectangle(450, 300, 900, 600, 0xff0000, 0).setDepth(90);

        // Spawn initial offer
        this.time.delayedCall(1000, () => this.spawnOffer());

        // Update prices
        this.updatePrices();

        // Expose for testing
        window.game = this.gameState;

        // Show tutorial
        this.createTutorialOverlay();
    }

    createTutorialOverlay() {
        // Dark overlay
        this.tutorialBg = this.add.rectangle(450, 300, 900, 600, 0x000000, 0.85);
        this.tutorialBg.setDepth(400);

        // Title
        this.tutorialTitle = this.add.text(450, 60, 'HIGH TEA', {
            fontSize: '48px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#ffd700'
        }).setOrigin(0.5).setDepth(401);

        // Subtitle
        this.tutorialSubtitle = this.add.text(450, 110, 'Opium Trade Simulation - 1830', {
            fontSize: '18px',
            fontFamily: 'Georgia',
            color: '#c0a080'
        }).setOrigin(0.5).setDepth(401);

        // How to play
        const tutorialText = [
            '--- HOW TO PLAY ---',
            '',
            '1. CLICK trade offers on the map to buy TEA or sell OPIUM',
            '2. Use SILVER to buy OPIUM from merchants on the left',
            '3. Sell OPIUM at ports for more SILVER and TEA',
            '4. SHIP enough TEA to England before time runs out!',
            '',
            '--- TIPS ---',
            '',
            'Higher risk ports = Better prices (watch the colored dots)',
            'Watch the QUOTA bar - you must ship that much tea!',
            'The year advances as you play - prices and risks change',
            '',
            'You start with: 1000 Silver + 20 Opium'
        ].join('\n');

        this.tutorialText = this.add.text(450, 310, tutorialText, {
            fontSize: '16px',
            fontFamily: 'Georgia',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5).setDepth(401);

        // Start prompt
        this.tutorialPrompt = this.add.text(450, 530, 'Click anywhere to begin trading!', {
            fontSize: '24px',
            fontFamily: 'Georgia',
            color: '#ffaa00'
        }).setOrigin(0.5).setDepth(401);

        // Blink the prompt
        this.tweens.add({
            targets: this.tutorialPrompt,
            alpha: 0.4,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Click to dismiss
        this.input.once('pointerdown', () => {
            if (this.showTutorial) {
                this.dismissTutorial();
            }
        });
    }

    dismissTutorial() {
        this.showTutorial = false;

        // Fade out
        this.tweens.add({
            targets: [this.tutorialBg, this.tutorialTitle, this.tutorialSubtitle, this.tutorialText, this.tutorialPrompt],
            alpha: 0,
            duration: 400,
            onComplete: () => {
                this.tutorialBg.destroy();
                this.tutorialTitle.destroy();
                this.tutorialSubtitle.destroy();
                this.tutorialText.destroy();
                this.tutorialPrompt.destroy();
            }
        });
    }

    getRiskColor(risk) {
        const colors = [0x00aa00, 0x88aa00, 0xffaa00, 0xff6600, 0xff0000];
        return colors[Math.floor(risk) - 1] || colors[0];
    }

    drawMap() {
        // Sea
        this.add.rectangle(550, 300, 700, 600, COLORS.sea);

        // Animated sea waves
        this.waveGraphics = this.add.graphics();

        // Land shadow (darker offset)
        const landShadowGfx = this.add.graphics();
        landShadowGfx.fillStyle(COLORS.landDark);

        // Top land shadow
        landShadowGfx.beginPath();
        landShadowGfx.moveTo(400, 5);
        landShadowGfx.lineTo(500, 85);
        landShadowGfx.lineTo(600, 105);
        landShadowGfx.lineTo(700, 85);
        landShadowGfx.lineTo(800, 125);
        landShadowGfx.lineTo(900, 105);
        landShadowGfx.lineTo(900, 5);
        landShadowGfx.closePath();
        landShadowGfx.fillPath();

        // Middle peninsula shadow
        landShadowGfx.beginPath();
        landShadowGfx.moveTo(455, 155);
        landShadowGfx.lineTo(505, 205);
        landShadowGfx.lineTo(485, 285);
        landShadowGfx.lineTo(525, 355);
        landShadowGfx.lineTo(505, 405);
        landShadowGfx.lineTo(405, 385);
        landShadowGfx.lineTo(385, 305);
        landShadowGfx.lineTo(405, 225);
        landShadowGfx.closePath();
        landShadowGfx.fillPath();

        // Macao shadow
        landShadowGfx.beginPath();
        landShadowGfx.moveTo(455, 405);
        landShadowGfx.lineTo(505, 455);
        landShadowGfx.lineTo(525, 525);
        landShadowGfx.lineTo(585, 600);
        landShadowGfx.lineTo(405, 600);
        landShadowGfx.lineTo(425, 485);
        landShadowGfx.closePath();
        landShadowGfx.fillPath();

        // Main land masses
        const landGfx = this.add.graphics();
        landGfx.fillStyle(COLORS.land);

        // Top land
        landGfx.beginPath();
        landGfx.moveTo(400, 0);
        landGfx.lineTo(500, 80);
        landGfx.lineTo(600, 100);
        landGfx.lineTo(700, 80);
        landGfx.lineTo(800, 120);
        landGfx.lineTo(900, 100);
        landGfx.lineTo(900, 0);
        landGfx.closePath();
        landGfx.fillPath();

        // Middle peninsula
        landGfx.beginPath();
        landGfx.moveTo(450, 150);
        landGfx.lineTo(500, 200);
        landGfx.lineTo(480, 280);
        landGfx.lineTo(520, 350);
        landGfx.lineTo(500, 400);
        landGfx.lineTo(400, 380);
        landGfx.lineTo(380, 300);
        landGfx.lineTo(400, 220);
        landGfx.closePath();
        landGfx.fillPath();

        // Macao peninsula
        landGfx.beginPath();
        landGfx.moveTo(450, 400);
        landGfx.lineTo(500, 450);
        landGfx.lineTo(520, 520);
        landGfx.lineTo(580, 600);
        landGfx.lineTo(400, 600);
        landGfx.lineTo(420, 480);
        landGfx.closePath();
        landGfx.fillPath();

        // Right land
        landGfx.beginPath();
        landGfx.moveTo(750, 200);
        landGfx.lineTo(850, 250);
        landGfx.lineTo(900, 300);
        landGfx.lineTo(900, 200);
        landGfx.lineTo(820, 150);
        landGfx.closePath();
        landGfx.fillPath();

        // Land highlights
        landGfx.fillStyle(COLORS.landLight);
        landGfx.beginPath();
        landGfx.moveTo(460, 165);
        landGfx.lineTo(480, 200);
        landGfx.lineTo(465, 230);
        landGfx.lineTo(445, 200);
        landGfx.closePath();
        landGfx.fillPath();
    }

    createUI() {
        // Left panel shadow
        this.add.rectangle(110, 305, 210, 600, 0x000000, 0.2);

        // Left panel
        this.add.rectangle(105, 300, 210, 600, COLORS.panelBg);
        this.add.rectangle(105, 300, 210, 600).setStrokeStyle(3, COLORS.panelBorder);

        // Title
        this.add.text(105, 30, 'INVENTORY', {
            fontSize: '18px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        }).setOrigin(0.5);

        // Decorative line
        this.add.rectangle(105, 48, 150, 1, COLORS.panelBorder);

        // Silver
        this.silverText = this.add.text(50, 70, '500', {
            fontSize: '24px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#708090'
        });
        this.add.text(50, 95, 'SILVER COINS', {
            fontSize: '11px',
            fontFamily: 'Georgia',
            color: '#6a5a4a'
        });

        // Opium
        this.opiumText = this.add.text(50, 125, '0', {
            fontSize: '24px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#804020'
        });
        this.add.text(50, 150, 'OPIUM CHESTS', {
            fontSize: '11px',
            fontFamily: 'Georgia',
            color: '#6a5a4a'
        });

        // Tea
        this.teaText = this.add.text(50, 175, '0', {
            fontSize: '24px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#408040'
        });
        this.add.text(50, 200, 'TEA CHESTS', {
            fontSize: '11px',
            fontFamily: 'Georgia',
            color: '#6a5a4a'
        });

        // Divider
        this.add.rectangle(105, 220, 170, 1, COLORS.panelBorder);

        // Buy Opium
        this.add.text(105, 242, 'BUY OPIUM', {
            fontSize: '13px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        }).setOrigin(0.5);

        this.opiumPriceText = this.add.text(105, 262, '20 silver/chest', {
            fontSize: '13px',
            fontFamily: 'Georgia',
            color: '#804020'
        }).setOrigin(0.5);

        this.createButton(52, 295, '5', () => this.buyOpium(5));
        this.createButton(107, 295, '15', () => this.buyOpium(15));
        this.createButton(162, 295, '30', () => this.buyOpium(30));

        // Divider
        this.add.rectangle(105, 345, 170, 1, COLORS.panelBorder);

        // Buy Tea
        this.add.text(105, 367, 'BUY TEA', {
            fontSize: '13px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        }).setOrigin(0.5);

        this.teaPriceText = this.add.text(105, 387, '12 silver/chest', {
            fontSize: '13px',
            fontFamily: 'Georgia',
            color: '#408040'
        }).setOrigin(0.5);

        this.createButton(52, 420, '5', () => this.buyTea(5));
        this.createButton(107, 420, '15', () => this.buyTea(15));
        this.createButton(162, 420, '30', () => this.buyTea(30));

        // Divider
        this.add.rectangle(105, 465, 170, 1, COLORS.panelBorder);

        // Ships
        this.add.text(30, 485, 'FLEET', {
            fontSize: '13px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        });

        this.shipIcons = [];
        for (let i = 0; i < 6; i++) {
            const icon = this.add.text(30 + i * 26, 510, '⛵', { fontSize: '18px' });
            this.shipIcons.push(icon);
        }

        // Divider
        this.add.rectangle(105, 535, 170, 1, COLORS.panelBorder);

        // Bribe cards
        this.add.text(30, 555, 'BRIBE CARDS', {
            fontSize: '13px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        });

        this.bribeText = this.add.text(150, 560, '-', {
            fontSize: '20px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#aaaaaa'
        });

        // Top bar
        this.add.rectangle(555, 27, 690, 55, 0x1e140a, 0.85);

        // Year
        this.yearText = this.add.text(230, 32, '1830', {
            fontSize: '22px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#ffd700'
        }).setOrigin(0, 0.5);

        // Timeline
        this.timelineDots = [];
        for (let y = 1830; y <= 1839; y++) {
            const x = 340 + (y - 1830) * 28;
            const dot = this.add.circle(x, 28, y === 1830 ? 8 : 5, 0xffd700);
            this.timelineDots.push({ dot, year: y });
        }

        this.add.text(340, 48, '1830', { fontSize: '9px', fontFamily: 'Georgia', color: '#888888' }).setOrigin(0.5);
        this.add.text(592, 48, '1839', { fontSize: '9px', fontFamily: 'Georgia', color: '#888888' }).setOrigin(0.5);

        // Mood label
        this.add.text(880, 14, "BRITAIN'S MOOD", {
            fontSize: '11px',
            fontFamily: 'Georgia',
            color: '#ffffff'
        }).setOrigin(1, 0);

        // Mood bar
        this.moodBarBg = this.add.rectangle(805, 35, 150, 18, 0x222222);
        this.moodBarFill = this.add.rectangle(730, 35, 150, 18, COLORS.tea);
        this.moodBarFill.setOrigin(0, 0.5);
        this.add.rectangle(805, 35, 150, 18).setStrokeStyle(1, 0x666666);

        this.moodPercentText = this.add.text(805, 35, '100%', {
            fontSize: '11px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Quota panel shadow
        this.add.rectangle(405, 563, 300, 70, 0x000000, 0.3);

        // Quota panel
        this.add.rectangle(400, 560, 300, 70, COLORS.panelBg);
        this.add.rectangle(400, 560, 300, 70).setStrokeStyle(2, COLORS.panelBorder);

        this.add.text(268, 545, '⛵', { fontSize: '26px' });

        this.quotaText = this.add.text(300, 535, 'TEA ORDER: 60 chests', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        });

        // Progress bar
        this.quotaBarBg = this.add.rectangle(375, 555, 150, 12, 0xdddddd);
        this.quotaBarFill = this.add.rectangle(300, 555, 0, 12, COLORS.warning);
        this.quotaBarFill.setOrigin(0, 0.5);
        this.add.rectangle(375, 555, 150, 12).setStrokeStyle(1, COLORS.panelBorder);

        this.quotaTeaText = this.add.text(460, 555, '0 / 60', {
            fontSize: '11px',
            fontFamily: 'Georgia',
            color: '#3a2a1a'
        }).setOrigin(0, 0.5);

        this.timerText = this.add.text(480, 578, '2:00', {
            fontSize: '18px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        });

        // News ticker
        this.add.rectangle(555, 588, 690, 25, 0x1e140a, 0.9);
        this.newsText = this.add.text(220, 588, '📜 Welcome to the Pearl River Delta...', {
            fontSize: '12px',
            fontFamily: 'Georgia',
            fontStyle: 'italic',
            color: '#ccccaa'
        }).setOrigin(0, 0.5);

        // Message text
        this.messageContainer = this.add.container(450, 275).setDepth(80).setVisible(false);
        this.messageBg = this.add.rectangle(0, 0, 400, 50, 0x000000, 0.8);
        this.messageBg.setStrokeStyle(2, COLORS.highlight);
        this.messageContainer.add(this.messageBg);
        this.messageText = this.add.text(0, 0, '', {
            fontSize: '16px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.messageContainer.add(this.messageText);

        // Event popup
        this.eventContainer = this.add.container(450, 250).setDepth(95).setVisible(false);
        this.eventDarkBg = this.add.rectangle(0, 50, 900, 600, 0x000000, 0.7);
        this.eventContainer.add(this.eventDarkBg);
        this.eventBg = this.add.rectangle(0, 0, 400, 200, COLORS.panelBg);
        this.eventBg.setStrokeStyle(3, COLORS.highlight);
        this.eventContainer.add(this.eventBg);
        this.eventTitle = this.add.text(0, -60, '', {
            fontSize: '18px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        }).setOrigin(0.5);
        this.eventContainer.add(this.eventTitle);
        this.eventMessage = this.add.text(0, 0, '', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#6a5a4a',
            wordWrap: { width: 360 },
            align: 'center'
        }).setOrigin(0.5);
        this.eventContainer.add(this.eventMessage);
        this.eventButton = this.add.rectangle(0, 70, 150, 40, COLORS.button).setInteractive();
        this.eventButton.on('pointerover', () => this.eventButton.setFillStyle(COLORS.buttonHover));
        this.eventButton.on('pointerout', () => this.eventButton.setFillStyle(COLORS.button));
        this.eventButton.on('pointerdown', () => this.dismissEvent());
        this.eventContainer.add(this.eventButton);
        this.eventButtonText = this.add.text(0, 70, 'UNDERSTOOD', {
            fontSize: '12px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        }).setOrigin(0.5);
        this.eventContainer.add(this.eventButtonText);

        // Game over overlay
        this.gameOverOverlay = this.add.container(450, 300).setVisible(false).setDepth(100);
        this.gameOverOverlay.add(this.add.rectangle(0, 0, 900, 600, 0x000000, 0.9));

        this.victoryTitle = this.add.text(0, -200, '', {
            fontSize: '36px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#ffd700'
        }).setOrigin(0.5);
        this.gameOverOverlay.add(this.victoryTitle);

        this.victorySubtitle = this.add.text(0, -160, '', {
            fontSize: '18px',
            fontFamily: 'Georgia',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.gameOverOverlay.add(this.victorySubtitle);

        // Stats panel
        this.statsPanel = this.add.rectangle(0, 20, 400, 280, COLORS.panelBg);
        this.statsPanel.setStrokeStyle(2, COLORS.panelBorder);
        this.gameOverOverlay.add(this.statsPanel);

        this.statsText = this.add.text(0, 20, '', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#3a2a1a',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);
        this.gameOverOverlay.add(this.statsText);

        this.scoreText = this.add.text(0, 200, '', {
            fontSize: '24px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#ffd700'
        }).setOrigin(0.5);
        this.gameOverOverlay.add(this.scoreText);

        this.restartText = this.add.text(0, 260, 'Click to play again', {
            fontSize: '14px',
            fontFamily: 'Georgia',
            color: '#888888'
        }).setOrigin(0.5).setInteractive();
        this.gameOverOverlay.add(this.restartText);
        this.restartText.on('pointerdown', () => this.restartGame());

        // Floating text container
        this.floatingTextContainer = this.add.container(0, 0).setDepth(85);
    }

    createButton(x, y, text, callback) {
        const btn = this.add.rectangle(x, y, 45, 30, COLORS.button)
            .setInteractive()
            .on('pointerover', () => btn.setFillStyle(COLORS.buttonHover))
            .on('pointerout', () => btn.setFillStyle(COLORS.button))
            .on('pointerdown', callback);

        btn.setStrokeStyle(1, COLORS.panelBorder);

        this.add.text(x, y, text, {
            fontSize: '14px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        }).setOrigin(0.5);
    }

    updatePrices() {
        const yearMod = 1 + (this.gameState.year - 1830) * 0.08;
        const randomNoise = 0.9 + Math.random() * 0.2;

        this.opiumPrice = Math.round(20 * yearMod * randomNoise);
        if (this.gameState.year >= 1833) this.opiumPrice = Math.round(this.opiumPrice * 1.5);

        this.teaPrice = Math.round(12 * yearMod * randomNoise);

        this.opiumPriceText.setText(`${this.opiumPrice} silver/chest`);
        this.teaPriceText.setText(`${this.teaPrice} silver/chest`);

        // Unlock Hong Kong in 1836
        if (this.gameState.year >= 1836 && this.ports[5].unlocked === false) {
            this.ports[5].unlocked = true;
            const port = this.ports[5];
            port.marker = this.add.image(port.x, port.y, 'port').setInteractive();
            port.label = this.add.text(port.x, port.y + 20, port.name, {
                fontSize: '11px',
                fontFamily: 'Georgia',
                color: '#3a2a1a'
            }).setOrigin(0.5);
            port.riskDot = this.add.circle(port.x + 12, port.y - 12, 5, this.getRiskColor(port.risk));
        }
    }

    spawnOffer() {
        if (this.offers.length >= 4) return;

        const availablePorts = this.ports.filter(p =>
            !this.offers.find(o => o.port === p) &&
            (p.unlocked !== false)
        );
        if (availablePorts.length === 0) return;

        const port = Phaser.Utils.Array.GetRandom(availablePorts);
        const quantity = 10 + Math.floor(Math.random() * 30) + (this.gameState.year - 1830) * 5;
        const pricePerChest = Math.round(40 * port.basePrice * (0.9 + Math.random() * 0.3));

        const offer = {
            port,
            quantity,
            price: pricePerChest,
            timer: 12 + Math.random() * 8,
            spawnScale: 0
        };

        // Create offer UI
        const container = this.add.container(port.x, port.y - 55);

        // Shadow
        const shadow = this.add.rectangle(3, 3, 110, 65, 0x000000, 0.2);
        container.add(shadow);

        const bg = this.add.rectangle(0, 0, 110, 65, COLORS.offer, 1);
        bg.setStrokeStyle(2, COLORS.panelBorder);
        container.add(bg);

        // Arrow
        const arrow = this.add.triangle(0, 38, -8, 0, 8, 0, 0, 10, COLORS.offer);
        container.add(arrow);

        const quantityText = this.add.text(0, -18, `${quantity} CHESTS`, {
            fontSize: '14px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#3a2a1a'
        }).setOrigin(0.5);
        container.add(quantityText);

        const priceText = this.add.text(0, 2, `${pricePerChest} silver/ea`, {
            fontSize: '13px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: '#408040'
        }).setOrigin(0.5);
        container.add(priceText);

        const totalText = this.add.text(0, 17, `Total: ${quantity * pricePerChest}`, {
            fontSize: '10px',
            fontFamily: 'Georgia',
            color: '#6a5a4a'
        }).setOrigin(0.5);
        container.add(totalText);

        // Timer bar
        const timerBar = this.add.rectangle(-40, -28, 80, 4, COLORS.tea);
        timerBar.setOrigin(0, 0.5);
        container.add(timerBar);

        // Make clickable
        bg.setInteractive();
        bg.on('pointerdown', () => this.acceptOffer(offer));
        bg.on('pointerover', () => {
            bg.setFillStyle(0xfffff8);
            bg.setStrokeStyle(3, COLORS.highlight);
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(COLORS.offer);
            bg.setStrokeStyle(2, COLORS.panelBorder);
        });

        offer.container = container;
        offer.timerBar = timerBar;
        offer.bg = bg;
        this.offers.push(offer);
    }

    acceptOffer(offer) {
        if (this.currentEvent) return;

        const availableShips = this.gameState.ships - this.activeShips.length;
        if (availableShips <= 0) {
            this.showMessage('No ships available!');
            return;
        }
        if (this.gameState.opium < offer.quantity) {
            this.showMessage('Not enough opium!');
            return;
        }

        // Warning for last ship
        if (this.gameState.ships === 1 && offer.port.risk >= 3) {
            this.showMessage('WARNING: High risk with only 1 ship!');
        }

        this.gameState.opium -= offer.quantity;
        this.gameState.totalOpiumSold += offer.quantity;

        // Create ship sprite
        const ship = this.add.image(300, 550, 'ship');
        const shipData = {
            sprite: ship,
            targetX: offer.port.x,
            targetY: offer.port.y,
            returning: false,
            cargo: offer.quantity,
            value: offer.quantity * offer.price,
            risk: offer.port.risk,
            port: offer.port,
            trail: []
        };
        this.activeShips.push(shipData);

        // Remove offer
        offer.container.destroy();
        this.offers = this.offers.filter(o => o !== offer);
        this.showMessage(`Ship sent to ${offer.port.name}`);
    }

    handleShipArrival(shipData, index) {
        const riskChance = shipData.risk * 0.1;

        if (Math.random() < riskChance) {
            const roll = Math.random();

            if (roll < 0.05) {
                // Captured
                if (this.gameState.bribeCards > 0) {
                    // TODO: Show bribe dialog
                    this.gameState.bribeCards--;
                    shipData.returning = true;
                    this.showMessage("Bribe accepted. Ship escapes.");
                    return;
                }
                this.captureShip(shipData, index);
                return;
            } else if (roll < 0.20) {
                // Confiscated
                this.showMessage(`Cargo confiscated at ${shipData.port.name}!`);
                shipData.value = 0;
                this.flashScreen(COLORS.warning, 0.5);
                shipData.returning = true;
            } else if (roll < 0.40) {
                // Fined
                const fine = Math.floor(shipData.value * (0.10 + Math.random() * 0.20));
                shipData.value -= fine;
                this.gameState.finesPaid += fine;
                this.showMessage(`Fined ${fine} silver`);
                this.flashScreen(COLORS.warning, 0.3);
                shipData.returning = true;
            } else {
                // Escaped
                this.showMessage(`Ship escaped at ${shipData.port.name}. No sale.`);
                shipData.value = 0;
                shipData.returning = true;
            }
        } else {
            shipData.returning = true;
            shipData.port.risk = Math.min(5, shipData.port.risk + 0.3);
            if (shipData.cargo >= 30) shipData.port.risk = Math.min(5, shipData.port.risk + 0.5);
            shipData.port.riskDot.setFillStyle(this.getRiskColor(shipData.port.risk));
        }
    }

    captureShip(shipData, index) {
        this.showMessage(`Ship CAPTURED at ${shipData.port.name}!`);
        this.flashScreen(COLORS.danger, 0.7);
        this.cameras.main.shake(300, 0.01);
        this.spawnParticles(shipData.sprite.x, shipData.sprite.y, COLORS.danger, 15);

        shipData.sprite.destroy();
        this.activeShips.splice(index, 1);
        this.gameState.ships--;
        this.gameState.shipsLost++;

        if (this.gameState.ships <= 0) {
            this.endGame('All ships lost! Your trading empire collapses.', false);
        }
    }

    buyOpium(amount) {
        const cost = amount * this.opiumPrice;
        if (this.gameState.silver >= cost) {
            this.gameState.silver -= cost;
            this.gameState.opium += amount;
            this.showMessage(`Bought ${amount} opium`);
            this.spawnFloatingText(`-${cost}`, 100, 70, '#c04040');
            this.spawnParticles(100, 130, COLORS.opium, 5);
        } else {
            this.showMessage('Not enough silver!');
            this.flashScreen(COLORS.danger, 0.3);
        }
    }

    buyTea(amount) {
        const cost = amount * this.teaPrice;
        if (this.gameState.silver >= cost) {
            this.gameState.silver -= cost;
            this.gameState.tea += amount;
            this.showMessage(`Bought ${amount} tea`);
            this.spawnFloatingText(`-${cost}`, 100, 70, '#c04040');
            this.spawnParticles(100, 180, COLORS.tea, 5);
        } else {
            this.showMessage('Not enough silver!');
            this.flashScreen(COLORS.danger, 0.3);
        }
    }

    showMessage(msg) {
        this.messageText.setText(msg);
        this.messageContainer.setVisible(true);
        this.time.delayedCall(2500, () => this.messageContainer.setVisible(false));
    }

    flashScreen(color, alpha) {
        this.screenFlash.setFillStyle(color, alpha);
        this.tweens.add({
            targets: this.screenFlash,
            alpha: 0,
            duration: 300,
            onComplete: () => this.screenFlash.setAlpha(1)
        });
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const particle = this.add.circle(x, y, 3 + Math.random() * 3, color);
            particle.vx = (Math.random() - 0.5) * 100;
            particle.vy = (Math.random() - 0.5) * 100 - 50;
            particle.life = 1.0;
            this.particles.push(particle);
        }
    }

    spawnFloatingText(text, x, y, color) {
        const ft = this.add.text(x, y, text, {
            fontSize: '16px',
            fontFamily: 'Georgia',
            fontStyle: 'bold',
            color: color
        }).setOrigin(0.5);
        ft.life = 1.5;
        ft.vy = -40;
        this.floatingTexts.push(ft);
        this.floatingTextContainer.add(ft);
    }

    showEvent(eventData) {
        this.currentEvent = eventData;
        this.eventTitle.setText(eventData.title);
        this.eventMessage.setText(eventData.message);
        this.eventContainer.setVisible(true);
    }

    dismissEvent() {
        this.eventContainer.setVisible(false);

        // Apply event effects
        if (this.gameState.year === 1836 || this.gameState.year === 1838) {
            this.ports.forEach(p => {
                if (p.unlocked !== false) {
                    p.risk = Math.min(5, p.risk + 1);
                    p.riskDot.setFillStyle(this.getRiskColor(p.risk));
                }
            });
        }

        this.currentEvent = null;
    }

    update(time, delta) {
        if (this.gameState.gameOver || this.currentEvent || this.showTutorial) return;

        const dt = delta / 1000;

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt;
            p.life -= dt;
            p.setAlpha(p.life);
            if (p.life <= 0) {
                p.destroy();
                this.particles.splice(i, 1);
            }
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.life -= dt;
            ft.setAlpha(Math.min(1, ft.life));
            if (ft.life <= 0) {
                ft.destroy();
                this.floatingTexts.splice(i, 1);
            }
        }

        // Port risk decay
        this.ports.forEach(p => {
            if (p.unlocked !== false && p.risk > p.baseRisk) {
                p.risk = Math.max(p.baseRisk, p.risk - dt * 0.02);
                p.riskDot.setFillStyle(this.getRiskColor(p.risk));
            }
        });

        // Update offers
        for (let i = this.offers.length - 1; i >= 0; i--) {
            const offer = this.offers[i];
            offer.timer -= dt;
            offer.timerBar.width = Math.max(0, (offer.timer / 20) * 80);
            offer.timerBar.setFillStyle(offer.timer < 5 ? COLORS.danger : COLORS.tea);

            // Spawn animation
            if (offer.spawnScale < 1) {
                offer.spawnScale = Math.min(1, offer.spawnScale + dt * 3);
                offer.container.setScale(offer.spawnScale);
            }

            // Bob animation
            offer.container.y = offer.port.y - 55 + Math.sin(time * 0.003) * 3;

            if (offer.timer <= 0) {
                offer.container.destroy();
                this.offers.splice(i, 1);
            }
        }

        // Spawn new offers
        let spawnRate = 0.3;
        if (this.gameState.year === 1832) spawnRate = 0.15;
        if (Math.random() < dt * spawnRate) {
            this.spawnOffer();
        }

        // Random bribe card
        if (this.gameState.year >= 1833 && this.gameState.bribeCards < 1 && Math.random() < dt * 0.01) {
            this.gameState.bribeCards = 1;
            this.showMessage('A corrupt official offers his services...');
            this.spawnParticles(155, 560, COLORS.bribe, 10);
        }

        // Update ships
        for (let i = this.activeShips.length - 1; i >= 0; i--) {
            const ship = this.activeShips[i];
            const tx = ship.returning ? 300 : ship.targetX;
            const ty = ship.returning ? 550 : ship.targetY;

            const dx = tx - ship.sprite.x;
            const dy = ty - ship.sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = 80;

            if (dist > 5) {
                ship.sprite.x += (dx / dist) * speed * dt;
                ship.sprite.y += (dy / dist) * speed * dt;
                ship.sprite.rotation = Math.atan2(dy, dx);
            } else if (!ship.returning) {
                this.handleShipArrival(ship, i);
            } else {
                if (ship.value > 0) {
                    this.gameState.silver += ship.value;
                    this.showMessage(`+${ship.value} silver`);
                    this.spawnFloatingText(`+${ship.value}`, 100, 70, '#408040');
                    this.spawnParticles(300, 550, COLORS.highlight, 8);
                }
                ship.sprite.destroy();
                this.activeShips.splice(i, 1);
            }
        }

        // Update quota timer
        this.gameState.quotaTimer -= dt;
        if (this.gameState.quotaTimer <= 0) {
            this.processQuota();
        }

        // Update mood
        this.gameState.mood -= dt * 0.3;
        if (this.gameState.mood <= 0) {
            this.endGame("Britain's patience has run out. You are ruined.", false);
        }

        // Update news
        this.newsTimer -= dt;
        if (this.newsTimer <= 0) {
            this.newsTimer = 15 + Math.random() * 10;
            const newsItems = [
                "Prices remain volatile in the Delta...",
                "Traders report high demand at inner ports...",
                "Authorities patrol the waters near Canton...",
                "Bengal supplies continue to flow...",
                "Tea shipments keep Britain satisfied...",
                "The opium trade flourishes despite risks..."
            ];
            this.newsMessage = newsItems[Math.floor(Math.random() * newsItems.length)];
            this.newsText.setText(`📜 ${this.newsMessage}`);
        }

        // Update UI
        this.updateUI();
    }

    processQuota() {
        const shipped = Math.min(this.gameState.tea, this.gameState.quota);
        this.gameState.tea -= shipped;
        this.gameState.teaShipped = shipped;
        this.gameState.totalTeaShipped += shipped;

        if (shipped >= this.gameState.quota) {
            this.gameState.mood = Math.min(100, this.gameState.mood + 15);
            if (shipped >= this.gameState.quota * 1.2) this.gameState.mood = Math.min(100, this.gameState.mood + 10);
            this.gameState.ships = Math.min(this.gameState.maxShips, this.gameState.ships + 1);
            this.showMessage('Quota met! +1 ship. Britain is pleased.');
            this.flashScreen(COLORS.tea, 0.3);
            this.spawnParticles(400, 560, COLORS.tea, 20);
        } else {
            const shortfall = this.gameState.quota - shipped;
            const penalty = 20 + Math.floor(shortfall / 10) * 3;
            this.gameState.mood -= penalty;
            this.showMessage(`Quota missed by ${shortfall}! Mood -${penalty}`);
            this.flashScreen(COLORS.danger, 0.4);
        }

        this.advanceYear();
    }

    advanceYear() {
        this.gameState.year++;

        // Check for historical event
        if (HISTORICAL_EVENTS[this.gameState.year]) {
            this.showEvent(HISTORICAL_EVENTS[this.gameState.year]);
        }

        if (this.gameState.year > 1839) {
            this.endGame('VICTORY!', true);
            return;
        }

        const quotas = [60, 90, 120, 180, 250, 320, 400, 500, 580, 660];
        this.gameState.quota = quotas[this.gameState.year - 1830] || 660;
        this.gameState.quotaTimer = 120;

        this.updatePrices();
        if (!this.currentEvent) {
            this.showMessage(`Year ${this.gameState.year}. Quota: ${this.gameState.quota}`);
        }
    }

    updateUI() {
        this.silverText.setText(this.gameState.silver.toString());
        this.opiumText.setText(this.gameState.opium.toString());
        this.teaText.setText(this.gameState.tea.toString());

        this.yearText.setText(this.gameState.year.toString());

        // Timeline
        this.timelineDots.forEach(({ dot, year }) => {
            dot.setFillStyle(year < this.gameState.year ? COLORS.tea : (year === this.gameState.year ? COLORS.highlight : 0x444444));
            dot.setRadius(year === this.gameState.year ? 8 : 5);
        });

        // Mood
        this.moodBarFill.width = 150 * (this.gameState.mood / 100);
        this.moodBarFill.setFillStyle(
            this.gameState.mood > 60 ? COLORS.tea :
            this.gameState.mood > 30 ? COLORS.warning : COLORS.danger
        );
        this.moodPercentText.setText(`${Math.floor(this.gameState.mood)}%`);

        // Ships
        const availableShips = this.gameState.ships - this.activeShips.length;
        this.shipIcons.forEach((icon, i) => {
            icon.setVisible(i < this.gameState.ships);
            icon.setAlpha(i < availableShips ? 1 : 0.3);
        });

        // Bribe
        this.bribeText.setText(this.gameState.bribeCards > 0 ? '🎴' : '-');
        this.bribeText.setColor(this.gameState.bribeCards > 0 ? '#9932cc' : '#aaaaaa');

        // Quota
        this.quotaText.setText(`TEA ORDER: ${this.gameState.quota} chests`);
        const progress = Math.min(1, this.gameState.tea / this.gameState.quota);
        this.quotaBarFill.width = 150 * progress;
        this.quotaBarFill.setFillStyle(progress >= 1 ? COLORS.tea : COLORS.warning);
        this.quotaTeaText.setText(`${this.gameState.tea} / ${this.gameState.quota}`);

        const minutes = Math.floor(this.gameState.quotaTimer / 60);
        const seconds = Math.floor(this.gameState.quotaTimer % 60);
        this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        this.timerText.setColor(this.gameState.quotaTimer < 30 ? '#c04040' : '#3a2a1a');
        this.timerText.setFontSize(this.gameState.quotaTimer < 30 ? '20px' : '18px');
    }

    endGame(message, victory) {
        this.gameState.gameOver = true;
        this.gameState.victory = victory;

        if (victory) {
            this.victoryTitle.setText('VICTORY!');
            this.victorySubtitle.setText('You survived the opium trade until the war began.');

            const addictions = Math.round(this.gameState.totalOpiumSold * 3.5);
            const score = this.gameState.totalTeaShipped * 10 + this.gameState.silver + this.gameState.ships * 500 - addictions * 2;

            this.statsText.setText(
                `Tea Shipped: ${this.gameState.totalTeaShipped} chests\n` +
                `Opium Sold: ${this.gameState.totalOpiumSold} chests\n` +
                `Silver Remaining: ${this.gameState.silver}\n` +
                `Ships Owned: ${this.gameState.ships}\n` +
                `Ships Lost: ${this.gameState.shipsLost}\n` +
                `Fines Paid: ${this.gameState.finesPaid} silver\n` +
                `Chinese Addicted: ~${addictions.toLocaleString()}`
            );
            this.scoreText.setText(`SCORE: ${score}`);
        } else {
            this.victoryTitle.setText('GAME OVER').setColor('#c04040');
            this.victorySubtitle.setText(message);
            this.statsText.setText(
                `Tea Shipped: ${this.gameState.totalTeaShipped} chests\n` +
                `Year: ${this.gameState.year}`
            );
            this.scoreText.setText('');
        }

        this.gameOverOverlay.setVisible(true);
    }

    restartGame() {
        this.scene.restart();
    }
}

const config = {
    type: Phaser.CANVAS,
    width: 900,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2a3a3a',
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
