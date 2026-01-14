// FTL Clone - Phaser 3
// Spaceship Roguelike with Pausable Real-Time Combat

const SCREEN_WIDTH = 1024;
const SCREEN_HEIGHT = 768;

// Game state
let gamePaused = true;
let gameState = 'menu'; // menu, map, combat, event, gameover, victory
let combatPaused = false;
let stats = {
    jumpsCompleted: 0,
    shipsDestroyed: 0,
    scrapEarned: 0,
    sectorsCompleted: 0,
    beaconsVisited: 0
};

// Colors
const COLORS = {
    UI_DARK: 0x1a1a2e,
    UI_BORDER: 0x3a3a5c,
    TEXT_WHITE: 0xffffff,
    TEXT_GREEN: 0x00ff00,
    TEXT_RED: 0xff4444,
    TEXT_BLUE: 0x4488ff,
    SHIELDS: 0x00ccff,
    WEAPONS: 0xff6600,
    ENGINES: 0xffff00,
    OXYGEN: 0x88ff88,
    HULL: 0x666666
};

// Ship systems config
const SYSTEMS = {
    shields: { maxPower: 4, color: COLORS.SHIELDS },
    weapons: { maxPower: 4, color: COLORS.WEAPONS },
    engines: { maxPower: 3, color: COLORS.ENGINES },
    oxygen: { maxPower: 2, color: COLORS.OXYGEN },
    medbay: { maxPower: 1, color: COLORS.TEXT_GREEN }
};

// Weapons with fire/breach chance
const WEAPONS = {
    basicLaser: { name: 'Basic Laser', power: 1, chargeTime: 10, shots: 1, damage: 1, fireChance: 0.1, breachChance: 0 },
    burstLaser: { name: 'Burst Laser', power: 2, chargeTime: 12, shots: 2, damage: 1, fireChance: 0.1, breachChance: 0 },
    heavyLaser: { name: 'Heavy Laser', power: 2, chargeTime: 15, shots: 1, damage: 2, fireChance: 0.3, breachChance: 0.2 },
    missile: { name: 'Missile', power: 1, chargeTime: 14, shots: 1, damage: 2, piercing: true, fireChance: 0.4, breachChance: 0.3 }
};

// Enemy types with system health
const ENEMY_TYPES = {
    scout: { hull: 6, shields: 1, weapons: ['basicLaser'], evasion: 20, systems: { shields: 2, weapons: 2, engines: 2 } },
    fighter: { hull: 10, shields: 2, weapons: ['basicLaser', 'basicLaser'], evasion: 15, systems: { shields: 3, weapons: 3, engines: 2 } },
    cruiser: { hull: 15, shields: 3, weapons: ['burstLaser', 'heavyLaser'], evasion: 10, systems: { shields: 4, weapons: 4, engines: 3 } },
    boss: { hull: 25, shields: 4, weapons: ['burstLaser', 'heavyLaser', 'missile'], evasion: 15, systems: { shields: 5, weapons: 5, engines: 4 } }
};

// Room definitions for player ship
const PLAYER_ROOMS = [
    { name: 'shields', x: 80, y: 320, w: 60, h: 60, system: 'shields' },
    { name: 'weapons', x: 150, y: 320, w: 60, h: 60, system: 'weapons' },
    { name: 'engines', x: 80, y: 390, w: 60, h: 60, system: 'engines' },
    { name: 'piloting', x: 220, y: 355, w: 50, h: 50, system: null },
    { name: 'medbay', x: 150, y: 390, w: 60, h: 60, system: 'medbay' },
    { name: 'oxygen', x: 220, y: 290, w: 50, h: 50, system: 'oxygen' }
];

// Events
const EVENTS = [
    { type: 'empty', text: 'Nothing here but empty space.', choices: [{ text: 'Continue', effect: null }] },
    { type: 'distress', text: 'A distress beacon! A damaged ship floats nearby.', choices: [
        { text: 'Help them (+crew, -10 hull)', effect: { crew: 1, hull: -10 }},
        { text: 'Salvage the wreck (+30 scrap)', effect: { scrap: 30 }},
        { text: 'Leave', effect: null }
    ]},
    { type: 'store', text: 'You found a trading outpost!', choices: [
        { text: 'Repair hull (20 scrap)', effect: { scrap: -20, hull: 10 }},
        { text: 'Buy fuel (5 scrap)', effect: { scrap: -5, fuel: 2 }},
        { text: 'Leave', effect: null }
    ]},
    { type: 'asteroid', text: 'Asteroid field! Take damage or spend fuel to navigate.', choices: [
        { text: 'Navigate through (-1 fuel)', effect: { fuel: -1 }},
        { text: 'Push through (-5 hull)', effect: { hull: -5 }}
    ]},
    { type: 'reward', text: 'You discover an abandoned cargo pod!', choices: [
        { text: 'Collect rewards', effect: { scrap: 25, fuel: 1 }}
    ]}
];

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        gameState = 'menu';

        // Background
        this.add.rectangle(512, 384, 1024, 768, 0x0a0a1a);

        // Stars
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, 1024);
            const y = Phaser.Math.Between(0, 768);
            const alpha = Math.random() * 0.5 + 0.5;
            this.add.circle(x, y, 1, 0xffffff, alpha);
        }

        // Title
        this.add.text(512, 200, 'FTL CLONE', {
            fontSize: '64px',
            fill: '#4488ff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(512, 280, 'Faster Than Light', {
            fontSize: '24px',
            fill: '#888'
        }).setOrigin(0.5);

        // Start button
        const startBtn = this.add.rectangle(512, 400, 200, 50, COLORS.UI_DARK)
            .setStrokeStyle(2, COLORS.UI_BORDER)
            .setInteractive({ useHandCursor: true });
        this.add.text(512, 400, 'NEW GAME', {
            fontSize: '20px',
            fill: '#fff'
        }).setOrigin(0.5);

        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Instructions
        this.add.text(512, 520, 'Space: Pause | 1-3: Power Systems | Click: Target', {
            fontSize: '14px',
            fill: '#666'
        }).setOrigin(0.5);

        // Setup harness
        this.setupHarness();
    }

    setupHarness() {
        window.harness = {
            pause: () => { gamePaused = true; },
            resume: () => { gamePaused = false; },
            isPaused: () => gamePaused,
            execute: async (action, durationMs) => {
                return new Promise(resolve => {
                    setTimeout(resolve, durationMs);
                });
            },
            getState: () => ({ gameState, stats }),
            getPhase: () => gameState,
            debug: {
                forceStart: () => { this.scene.start('GameScene'); }
            }
        };
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        gameState = 'map';
        combatPaused = false;

        // Initialize player ship
        this.playerShip = {
            hull: 30,
            maxHull: 30,
            shields: 0,
            maxShields: 2,
            shieldRecharge: 0,
            fuel: 15,
            scrap: 50,
            missiles: 5,
            reactor: 8,
            systems: {
                shields: { power: 2, maxPower: 4, level: 2, damage: 0 },
                weapons: { power: 2, maxPower: 4, level: 2, damage: 0 },
                engines: { power: 2, maxPower: 3, level: 2, damage: 0 },
                oxygen: { power: 1, maxPower: 2, level: 1, damage: 0 },
                medbay: { power: 0, maxPower: 1, level: 1, damage: 0 }
            },
            weapons: [
                { ...WEAPONS.basicLaser, charge: 0, active: true },
                { ...WEAPONS.basicLaser, charge: 0, active: true }
            ],
            evasion: 15,
            fires: [], // Active fires in rooms
            breaches: [] // Hull breaches in rooms
        };

        // Initialize crew members
        this.crew = [
            { id: 1, name: 'Captain', room: 'piloting', health: 100, maxHealth: 100, skill: 1 },
            { id: 2, name: 'Engineer', room: 'shields', health: 100, maxHealth: 100, skill: 1 },
            { id: 3, name: 'Gunner', room: 'weapons', health: 100, maxHealth: 100, skill: 1 }
        ];
        this.selectedCrew = null;

        // Current sector info
        this.currentSector = 1;
        this.maxSectors = 8;
        this.beacons = [];
        this.currentBeacon = 0;
        this.rebelProgress = 0;

        // Enemy ship (for combat)
        this.enemyShip = null;
        this.selectedTarget = null;

        // Generate sector map
        this.generateSectorMap();

        // Create UI
        this.createUI();

        // Input
        this.input.keyboard.on('keydown-SPACE', () => {
            if (gameState === 'combat') {
                combatPaused = !combatPaused;
                this.updatePauseIndicator();
            }
        });

        this.input.keyboard.on('keydown-ONE', () => this.adjustPower('shields', 1));
        this.input.keyboard.on('keydown-TWO', () => this.adjustPower('weapons', 1));
        this.input.keyboard.on('keydown-THREE', () => this.adjustPower('engines', 1));
        this.input.keyboard.on('keydown-F', () => this.fireWeapons());
        this.input.keyboard.on('keydown-J', () => this.attemptJump());
        this.input.keyboard.on('keydown-C', () => this.cycleCrewSelection());
        this.input.keyboard.on('keydown-R', () => this.repairSystem());

        // Setup harness
        this.setupHarness();

        // Show map
        this.showSectorMap();
    }

    generateSectorMap() {
        this.beacons = [];
        const numBeacons = Phaser.Math.Between(6, 10);

        for (let i = 0; i < numBeacons; i++) {
            const x = 150 + (i / numBeacons) * 700;
            const y = Phaser.Math.Between(200, 500);

            let type = 'empty';
            const roll = Math.random();
            if (roll < 0.4) type = 'combat';
            else if (roll < 0.6) type = 'event';
            else if (roll < 0.75) type = 'store';
            else type = 'empty';

            // Last beacon is always exit
            if (i === numBeacons - 1) type = 'exit';
            // First beacon is start
            if (i === 0) type = 'start';

            this.beacons.push({
                x, y, type,
                visited: i === 0,
                connections: []
            });
        }

        // Create connections
        for (let i = 0; i < this.beacons.length - 1; i++) {
            this.beacons[i].connections.push(i + 1);
            if (i + 2 < this.beacons.length && Math.random() > 0.5) {
                this.beacons[i].connections.push(i + 2);
            }
        }

        this.currentBeacon = 0;
    }

    createUI() {
        // Main UI container
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setDepth(100);

        // Top bar
        const topBar = this.add.rectangle(512, 25, 1024, 50, COLORS.UI_DARK);
        this.uiContainer.add(topBar);

        // Hull display
        this.hullText = this.add.text(20, 15, '', { fontSize: '14px', fill: '#fff' });
        this.uiContainer.add(this.hullText);

        // Resources
        this.resourceText = this.add.text(200, 15, '', { fontSize: '14px', fill: '#ffa' });
        this.uiContainer.add(this.resourceText);

        // Sector info
        this.sectorText = this.add.text(500, 15, '', { fontSize: '14px', fill: '#88f' });
        this.uiContainer.add(this.sectorText);

        // Pause indicator
        this.pauseText = this.add.text(850, 15, '', { fontSize: '14px', fill: '#ff4' });
        this.uiContainer.add(this.pauseText);

        // Bottom bar for systems
        const bottomBar = this.add.rectangle(512, 718, 1024, 100, COLORS.UI_DARK);
        this.uiContainer.add(bottomBar);

        // System power bars
        this.systemBars = {};
        let xPos = 50;
        for (const [name, config] of Object.entries(SYSTEMS)) {
            const label = this.add.text(xPos, 680, name.toUpperCase(), { fontSize: '12px', fill: '#888' });
            const bar = this.add.rectangle(xPos + 40, 710, 80, 20, config.color, 0.3);
            const fill = this.add.rectangle(xPos + 40, 710, 80, 20, config.color);
            fill.setOrigin(0, 0.5);
            fill.x = xPos;

            this.systemBars[name] = { label, bar, fill };
            this.uiContainer.add([label, bar, fill]);

            xPos += 120;
        }

        // Weapons display
        this.weaponTexts = [];
        for (let i = 0; i < 4; i++) {
            const wt = this.add.text(650 + i * 90, 690, '', { fontSize: '11px', fill: '#fff' });
            this.weaponTexts.push(wt);
            this.uiContainer.add(wt);
        }

        // Map container (hidden during combat)
        this.mapContainer = this.add.container(0, 0);
        this.mapContainer.setDepth(50);

        // Combat container
        this.combatContainer = this.add.container(0, 0);
        this.combatContainer.setDepth(50);
        this.combatContainer.setVisible(false);

        // Event container
        this.eventContainer = this.add.container(0, 0);
        this.eventContainer.setDepth(60);
        this.eventContainer.setVisible(false);
    }

    showSectorMap() {
        gameState = 'map';
        this.mapContainer.setVisible(true);
        this.combatContainer.setVisible(false);
        this.eventContainer.setVisible(false);

        // Clear old map elements
        this.mapContainer.removeAll(true);

        // Background
        const bg = this.add.rectangle(512, 384, 1024, 768, 0x0a0a1a);
        this.mapContainer.add(bg);

        // Stars
        for (let i = 0; i < 50; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, 1024),
                Phaser.Math.Between(0, 650),
                1, 0xffffff, Math.random() * 0.5 + 0.3
            );
            this.mapContainer.add(star);
        }

        // Title
        const title = this.add.text(512, 80, `SECTOR ${this.currentSector}`, {
            fontSize: '28px',
            fill: '#4488ff'
        }).setOrigin(0.5);
        this.mapContainer.add(title);

        // Draw connections first
        const graphics = this.add.graphics();
        this.mapContainer.add(graphics);
        graphics.lineStyle(2, 0x444466);

        for (let i = 0; i < this.beacons.length; i++) {
            const beacon = this.beacons[i];
            for (const connIdx of beacon.connections) {
                const target = this.beacons[connIdx];
                graphics.beginPath();
                graphics.moveTo(beacon.x, beacon.y);
                graphics.lineTo(target.x, target.y);
                graphics.strokePath();
            }
        }

        // Draw beacons
        for (let i = 0; i < this.beacons.length; i++) {
            const beacon = this.beacons[i];
            const isCurrentBeacon = i === this.currentBeacon;
            const canJumpTo = this.beacons[this.currentBeacon].connections.includes(i);

            let color = 0x666666;
            if (beacon.type === 'combat') color = 0xff4444;
            else if (beacon.type === 'store') color = 0x44ff44;
            else if (beacon.type === 'exit') color = 0x4444ff;
            else if (beacon.type === 'event') color = 0xffff44;

            if (beacon.visited) color = Phaser.Display.Color.ValueToColor(color).darken(50).color;

            const size = isCurrentBeacon ? 15 : 10;
            const beaconSprite = this.add.circle(beacon.x, beacon.y, size, color);
            this.mapContainer.add(beaconSprite);

            if (isCurrentBeacon) {
                const ring = this.add.circle(beacon.x, beacon.y, 20, 0xffffff, 0);
                ring.setStrokeStyle(2, 0x00ff00);
                this.mapContainer.add(ring);
            }

            // Click to jump
            if (canJumpTo && !beacon.visited) {
                beaconSprite.setInteractive({ useHandCursor: true });
                beaconSprite.on('pointerdown', () => this.jumpToBeacon(i));

                // Highlight
                beaconSprite.setStrokeStyle(2, 0xffffff);
            }

            // Label
            const label = this.add.text(beacon.x, beacon.y + 20, beacon.type, {
                fontSize: '10px',
                fill: '#888'
            }).setOrigin(0.5);
            this.mapContainer.add(label);
        }

        // Rebel fleet indicator
        const rebelX = 50 + (this.rebelProgress / 100) * 800;
        const rebelLine = this.add.rectangle(rebelX, 350, 4, 300, 0xff0000, 0.5);
        this.mapContainer.add(rebelLine);
        const rebelText = this.add.text(rebelX, 150, 'REBEL FLEET', {
            fontSize: '12px',
            fill: '#ff4444'
        }).setOrigin(0.5);
        this.mapContainer.add(rebelText);

        // Instructions
        const inst = this.add.text(512, 620, 'Click on connected beacon to jump (costs 1 fuel)', {
            fontSize: '14px',
            fill: '#888'
        }).setOrigin(0.5);
        this.mapContainer.add(inst);

        this.updateUI();
    }

    jumpToBeacon(beaconIndex) {
        if (this.playerShip.fuel < 1) {
            console.log('No fuel!');
            return;
        }

        this.playerShip.fuel--;
        this.currentBeacon = beaconIndex;
        this.beacons[beaconIndex].visited = true;
        stats.beaconsVisited++;
        stats.jumpsCompleted++;

        // Advance rebel fleet
        this.rebelProgress += 10;

        const beacon = this.beacons[beaconIndex];

        if (beacon.type === 'combat') {
            this.startCombat();
        } else if (beacon.type === 'event' || beacon.type === 'store' || beacon.type === 'empty') {
            this.showEvent(beacon.type);
        } else if (beacon.type === 'exit') {
            this.nextSector();
        } else {
            this.showSectorMap();
        }
    }

    showEvent(eventType) {
        gameState = 'event';
        this.mapContainer.setVisible(false);
        this.eventContainer.setVisible(true);
        this.eventContainer.removeAll(true);

        // Background
        const bg = this.add.rectangle(512, 384, 1024, 768, 0x0a0a1a);
        this.eventContainer.add(bg);

        // Get event
        let event;
        if (eventType === 'store') {
            event = EVENTS.find(e => e.type === 'store');
        } else if (eventType === 'empty') {
            event = EVENTS.find(e => e.type === 'empty');
        } else {
            const eligibleEvents = EVENTS.filter(e => e.type !== 'store');
            event = eligibleEvents[Phaser.Math.Between(0, eligibleEvents.length - 1)];
        }

        // Event text
        const eventText = this.add.text(512, 200, event.text, {
            fontSize: '20px',
            fill: '#fff',
            wordWrap: { width: 600 },
            align: 'center'
        }).setOrigin(0.5);
        this.eventContainer.add(eventText);

        // Choices
        let yPos = 350;
        for (const choice of event.choices) {
            const canAfford = this.canAffordChoice(choice.effect);
            const color = canAfford ? 0x3a3a5c : 0x5c3a3a;

            const btn = this.add.rectangle(512, yPos, 400, 40, color)
                .setStrokeStyle(2, canAfford ? 0x5a5a7c : 0x7c5a5a);

            if (canAfford) {
                btn.setInteractive({ useHandCursor: true });
                btn.on('pointerdown', () => {
                    this.applyChoiceEffect(choice.effect);
                    this.showSectorMap();
                });
            }

            const btnText = this.add.text(512, yPos, choice.text, {
                fontSize: '16px',
                fill: canAfford ? '#fff' : '#666'
            }).setOrigin(0.5);

            this.eventContainer.add([btn, btnText]);
            yPos += 60;
        }
    }

    canAffordChoice(effect) {
        if (!effect) return true;
        if (effect.scrap && this.playerShip.scrap + effect.scrap < 0) return false;
        if (effect.fuel && this.playerShip.fuel + effect.fuel < 0) return false;
        return true;
    }

    applyChoiceEffect(effect) {
        if (!effect) return;
        if (effect.scrap) {
            this.playerShip.scrap += effect.scrap;
            if (effect.scrap > 0) stats.scrapEarned += effect.scrap;
        }
        if (effect.fuel) this.playerShip.fuel += effect.fuel;
        if (effect.hull) this.playerShip.hull = Math.min(this.playerShip.maxHull, this.playerShip.hull + effect.hull);
        if (effect.crew) this.playerShip.crew += effect.crew;
    }

    startCombat() {
        gameState = 'combat';
        combatPaused = false;
        this.mapContainer.setVisible(false);
        this.combatContainer.setVisible(true);
        this.combatContainer.removeAll(true);

        // Background
        const bg = this.add.rectangle(512, 384, 1024, 768, 0x0a0a1a);
        this.combatContainer.add(bg);

        // Stars
        for (let i = 0; i < 30; i++) {
            const star = this.add.circle(
                Phaser.Math.Between(0, 1024),
                Phaser.Math.Between(0, 650),
                1, 0xffffff, Math.random() * 0.5 + 0.3
            );
            this.combatContainer.add(star);
        }

        // Determine enemy type based on sector
        let enemyType = 'scout';
        if (this.currentSector >= 6) enemyType = 'cruiser';
        else if (this.currentSector >= 4) enemyType = 'fighter';

        const enemyConfig = ENEMY_TYPES[enemyType];
        this.enemyShip = {
            hull: enemyConfig.hull,
            maxHull: enemyConfig.hull,
            shields: 0,
            maxShields: enemyConfig.shields,
            shieldRecharge: 0,
            weapons: enemyConfig.weapons.map(w => ({ ...WEAPONS[w], charge: Math.random() * 5, active: true })),
            evasion: enemyConfig.evasion,
            type: enemyType,
            systems: {
                shields: { health: enemyConfig.systems.shields, maxHealth: enemyConfig.systems.shields },
                weapons: { health: enemyConfig.systems.weapons, maxHealth: enemyConfig.systems.weapons },
                engines: { health: enemyConfig.systems.engines, maxHealth: enemyConfig.systems.engines }
            },
            fires: []
        };

        // Reset player weapon charges
        for (const weapon of this.playerShip.weapons) {
            weapon.charge = 0;
        }

        // Draw player ship (left)
        this.drawShip(150, 350, this.playerShip, true);

        // Draw enemy ship (right)
        this.drawShip(750, 350, this.enemyShip, false);

        // Target rooms on enemy ship
        this.enemyRooms = [];
        const roomNames = ['shields', 'weapons', 'engines', 'hull'];
        let rx = 650;
        for (const roomName of roomNames) {
            const room = this.add.rectangle(rx, 350, 50, 50, 0x333355)
                .setStrokeStyle(1, 0x666688)
                .setInteractive({ useHandCursor: true });
            room.roomName = roomName;
            room.on('pointerdown', () => {
                this.selectedTarget = roomName;
                this.updateTargetHighlight();
            });
            this.combatContainer.add(room);

            const label = this.add.text(rx, 380, roomName.substr(0, 3).toUpperCase(), {
                fontSize: '10px',
                fill: '#888'
            }).setOrigin(0.5);
            this.combatContainer.add(label);

            this.enemyRooms.push(room);
            rx += 60;
        }

        // Combat UI
        this.playerHullBar = this.add.rectangle(150, 500, 200, 20, COLORS.HULL);
        this.playerHullBar.setOrigin(0, 0.5);
        this.combatContainer.add(this.playerHullBar);

        this.playerShieldBar = this.add.rectangle(150, 480, 200, 10, COLORS.SHIELDS);
        this.playerShieldBar.setOrigin(0, 0.5);
        this.combatContainer.add(this.playerShieldBar);

        this.enemyHullBar = this.add.rectangle(650, 500, 200, 20, COLORS.HULL);
        this.enemyHullBar.setOrigin(0, 0.5);
        this.combatContainer.add(this.enemyHullBar);

        this.enemyShieldBar = this.add.rectangle(650, 480, 200, 10, COLORS.SHIELDS);
        this.enemyShieldBar.setOrigin(0, 0.5);
        this.combatContainer.add(this.enemyShieldBar);

        // Weapon charge bars
        this.weaponChargeBars = [];
        for (let i = 0; i < this.playerShip.weapons.length; i++) {
            const bar = this.add.rectangle(50 + i * 60, 600, 50, 15, COLORS.WEAPONS);
            bar.setOrigin(0, 0.5);
            this.combatContainer.add(bar);
            this.weaponChargeBars.push(bar);

            const label = this.add.text(75 + i * 60, 620, `W${i+1}`, {
                fontSize: '10px',
                fill: '#888'
            }).setOrigin(0.5);
            this.combatContainer.add(label);
        }

        // Instructions
        const instructions = this.add.text(512, 620, 'Click enemy room to target | SPACE: Pause | F: Fire | C: Select crew | R: Repair', {
            fontSize: '12px',
            fill: '#888'
        }).setOrigin(0.5);
        this.combatContainer.add(instructions);

        // Crew status display
        this.crewStatusText = this.add.text(20, 530, '', {
            fontSize: '10px',
            fill: '#ffcc88'
        });
        this.combatContainer.add(this.crewStatusText);

        // Fire overlay sprites (for player ship)
        this.fireOverlays = [];

        this.selectedTarget = 'hull';
        this.updateTargetHighlight();
        this.updateUI();
    }

    drawShip(x, y, ship, isPlayer) {
        // Draw rooms for player ship
        if (isPlayer) {
            this.playerRoomSprites = [];
            for (const roomDef of PLAYER_ROOMS) {
                const room = this.add.rectangle(roomDef.x, roomDef.y, roomDef.w, roomDef.h, 0x333355)
                    .setStrokeStyle(1, 0x666688)
                    .setInteractive({ useHandCursor: true });
                room.roomName = roomDef.name;
                room.on('pointerdown', () => this.moveCrewToRoom(roomDef.name));
                this.combatContainer.add(room);
                this.playerRoomSprites.push(room);

                // Room label
                const label = this.add.text(roomDef.x, roomDef.y + roomDef.h/2 + 10,
                    roomDef.name.substr(0, 3).toUpperCase(), {
                    fontSize: '8px',
                    fill: '#666'
                }).setOrigin(0.5);
                this.combatContainer.add(label);
            }

            // Draw crew members
            this.crewSprites = [];
            for (const crewMember of this.crew) {
                const roomDef = PLAYER_ROOMS.find(r => r.name === crewMember.room);
                if (roomDef) {
                    const crewSprite = this.add.circle(roomDef.x, roomDef.y, 8, 0xffcc88);
                    crewSprite.crewId = crewMember.id;
                    this.combatContainer.add(crewSprite);
                    this.crewSprites.push(crewSprite);
                }
            }
        } else {
            // Simple enemy ship representation
            const shipBody = this.add.rectangle(x, y, 150, 100, 0x444466);
            shipBody.setStrokeStyle(2, 0x666688);
            this.combatContainer.add(shipBody);
        }

        // Ship label
        const label = this.add.text(x, y - 70, isPlayer ? 'YOUR SHIP' : `ENEMY ${ship.type.toUpperCase()}`, {
            fontSize: '14px',
            fill: isPlayer ? '#44ff44' : '#ff4444'
        }).setOrigin(0.5);
        this.combatContainer.add(label);
    }

    cycleCrewSelection() {
        const aliveCrew = this.crew.filter(c => c.health > 0);
        if (aliveCrew.length === 0) return;

        if (this.selectedCrew === null) {
            this.selectedCrew = aliveCrew[0].id;
        } else {
            const currentIdx = aliveCrew.findIndex(c => c.id === this.selectedCrew);
            const nextIdx = (currentIdx + 1) % aliveCrew.length;
            this.selectedCrew = aliveCrew[nextIdx].id;
        }

        const selected = this.crew.find(c => c.id === this.selectedCrew);
        if (selected) {
            this.showCombatText(`Selected: ${selected.name}`, 150, 550, '#ffcc88');
        }
    }

    moveCrewToRoom(roomName) {
        if (this.selectedCrew === null) return;

        const crewMember = this.crew.find(c => c.id === this.selectedCrew);
        if (crewMember && crewMember.health > 0) {
            crewMember.room = roomName;
            this.showCombatText(`${crewMember.name} -> ${roomName}`, 150, 550, '#88ff88');
            this.updateCrewPositions();
        }
    }

    updateCrewPositions() {
        if (!this.crewSprites) return;

        for (let i = 0; i < this.crew.length; i++) {
            const crewMember = this.crew[i];
            const sprite = this.crewSprites[i];
            if (!sprite) continue;

            const roomDef = PLAYER_ROOMS.find(r => r.name === crewMember.room);
            if (roomDef) {
                // Offset multiple crew in same room
                const crewInRoom = this.crew.filter(c => c.room === crewMember.room);
                const idx = crewInRoom.indexOf(crewMember);
                const offset = (idx - (crewInRoom.length - 1) / 2) * 12;
                sprite.x = roomDef.x + offset;
                sprite.y = roomDef.y;
                sprite.setVisible(crewMember.health > 0);

                // Highlight selected crew
                if (crewMember.id === this.selectedCrew) {
                    sprite.setStrokeStyle(2, 0xffffff);
                } else {
                    sprite.setStrokeStyle(0);
                }
            }
        }
    }

    repairSystem() {
        // Selected crew repairs system in their room
        if (this.selectedCrew === null) return;

        const crewMember = this.crew.find(c => c.id === this.selectedCrew);
        if (!crewMember || crewMember.health <= 0) return;

        const roomDef = PLAYER_ROOMS.find(r => r.name === crewMember.room);
        if (roomDef && roomDef.system) {
            const sys = this.playerShip.systems[roomDef.system];
            if (sys && sys.damage > 0) {
                sys.damage--;
                this.showCombatText(`${roomDef.system.toUpperCase()} repaired!`, 150, 520, '#88ff88');
            }
        }
    }

    updateTargetHighlight() {
        for (const room of this.enemyRooms || []) {
            if (room.roomName === this.selectedTarget) {
                room.setStrokeStyle(2, 0xff4444);
            } else {
                room.setStrokeStyle(1, 0x666688);
            }
        }
    }

    update(time, delta) {
        if (gamePaused) return;

        this.updateUI();

        if (gameState === 'combat' && !combatPaused) {
            this.updateCombat(delta / 1000);
        }
    }

    updateCombat(dt) {
        // Update shield recharge (only if shields system not destroyed)
        const shieldSys = this.playerShip.systems.shields;
        const effectiveShieldPower = Math.max(0, shieldSys.power - shieldSys.damage);
        if (this.playerShip.shields < this.playerShip.maxShields && effectiveShieldPower > 0) {
            this.playerShip.shieldRecharge += dt;
            if (this.playerShip.shieldRecharge >= 2) {
                this.playerShip.shields++;
                this.playerShip.shieldRecharge = 0;
            }
        }

        // Enemy shield recharge (only if shields system not destroyed)
        const enemyShieldSys = this.enemyShip.systems.shields;
        if (this.enemyShip.shields < this.enemyShip.maxShields && enemyShieldSys.health > 0) {
            this.enemyShip.shieldRecharge += dt;
            if (this.enemyShip.shieldRecharge >= 2) {
                this.enemyShip.shields++;
                this.enemyShip.shieldRecharge = 0;
            }
        }

        // Charge weapons (account for system damage)
        const weaponSys = this.playerShip.systems.weapons;
        const effectiveWeaponPower = Math.max(0, weaponSys.power - weaponSys.damage);
        for (let i = 0; i < this.playerShip.weapons.length; i++) {
            const weapon = this.playerShip.weapons[i];
            if (i < effectiveWeaponPower && weapon.charge < weapon.chargeTime) {
                weapon.charge += dt;
            }
        }

        // Enemy weapons charge and fire (skip disabled weapons)
        for (const weapon of this.enemyShip.weapons) {
            if (!weapon.active) continue;
            weapon.charge += dt;
            if (weapon.charge >= weapon.chargeTime) {
                this.enemyFireWeapon(weapon);
                weapon.charge = 0;
            }
        }

        // Update fires on player ship
        this.updateFires(dt);

        // Update fires on enemy ship
        this.updateEnemyFires(dt);

        // Heal crew in medbay
        this.updateMedbay(dt);

        // Update combat UI
        this.updateCombatUI();

        // Check for victory/defeat
        if (this.enemyShip.hull <= 0) {
            this.combatVictory();
        } else if (this.playerShip.hull <= 0) {
            this.gameOver();
        }
    }

    updateFires(dt) {
        // Process player ship fires
        for (let i = this.playerShip.fires.length - 1; i >= 0; i--) {
            const fire = this.playerShip.fires[i];
            fire.duration -= dt;

            // Fire damages crew in that room
            for (const crewMember of this.crew) {
                if (crewMember.room === fire.room && crewMember.health > 0) {
                    crewMember.health -= dt * 5; // 5 damage per second in fire
                    if (crewMember.health <= 0) {
                        crewMember.health = 0;
                        this.showCombatText(`${crewMember.name} DIED!`, 150, 250, '#ff0000');
                    }
                }
            }

            // Fire damages system in that room
            const roomDef = PLAYER_ROOMS.find(r => r.name === fire.room);
            if (roomDef && roomDef.system) {
                const sys = this.playerShip.systems[roomDef.system];
                if (sys && Math.random() < dt * 0.2) {
                    sys.damage++;
                }
            }

            // Fire can spread (10% chance per second)
            if (Math.random() < dt * 0.1) {
                const adjacentRooms = PLAYER_ROOMS.filter(r => r.name !== fire.room);
                if (adjacentRooms.length > 0) {
                    const newRoom = adjacentRooms[Phaser.Math.Between(0, adjacentRooms.length - 1)];
                    if (!this.playerShip.fires.some(f => f.room === newRoom.name)) {
                        this.playerShip.fires.push({ room: newRoom.name, duration: 10 });
                    }
                }
            }

            // Crew can fight fires (reduces duration faster)
            const crewInRoom = this.crew.filter(c => c.room === fire.room && c.health > 0).length;
            if (crewInRoom > 0) {
                fire.duration -= dt * crewInRoom * 2; // Each crew member fights fire
            }

            if (fire.duration <= 0) {
                this.playerShip.fires.splice(i, 1);
            }
        }
    }

    updateEnemyFires(dt) {
        // Process enemy ship fires (damages their systems)
        for (let i = this.enemyShip.fires.length - 1; i >= 0; i--) {
            const fire = this.enemyShip.fires[i];
            fire.duration -= dt;

            // Fire damages enemy system
            if (fire.room && this.enemyShip.systems[fire.room]) {
                if (Math.random() < dt * 0.3) {
                    this.enemyShip.systems[fire.room].health--;
                    if (this.enemyShip.systems[fire.room].health <= 0) {
                        this.enemyShip.systems[fire.room].health = 0;
                    }
                }
            }

            // Fire does hull damage
            if (Math.random() < dt * 0.1) {
                this.enemyShip.hull--;
            }

            if (fire.duration <= 0) {
                this.enemyShip.fires.splice(i, 1);
            }
        }
    }

    updateMedbay(dt) {
        // Heal crew in medbay
        const medbaySys = this.playerShip.systems.medbay;
        const effectivePower = Math.max(0, medbaySys.power - medbaySys.damage);
        if (effectivePower > 0) {
            const healRate = effectivePower * 6; // HP per second
            for (const crewMember of this.crew) {
                if (crewMember.room === 'medbay' && crewMember.health > 0 && crewMember.health < crewMember.maxHealth) {
                    crewMember.health = Math.min(crewMember.maxHealth, crewMember.health + healRate * dt);
                }
            }
        }
    }

    fireWeapons() {
        if (gameState !== 'combat') return;

        for (const weapon of this.playerShip.weapons) {
            if (weapon.charge >= weapon.chargeTime) {
                this.playerFireWeapon(weapon);
                weapon.charge = 0;
            }
        }
    }

    playerFireWeapon(weapon) {
        // Calculate evasion (reduced if engines damaged)
        let evadeChance = this.enemyShip.evasion / 100;
        if (this.enemyShip.systems.engines.health <= 0) {
            evadeChance = 0; // No evasion with destroyed engines
        } else if (this.enemyShip.systems.engines.health < this.enemyShip.systems.engines.maxHealth) {
            evadeChance *= 0.5; // Reduced evasion with damaged engines
        }

        if (Math.random() < evadeChance) {
            this.showCombatText('MISS', 750, 350, '#888');
            return;
        }

        // Check shields (reduced if shields system damaged)
        let shieldsEffective = this.enemyShip.shields;
        if (this.enemyShip.systems.shields.health <= 0) {
            shieldsEffective = 0; // No shields with destroyed system
        }

        if (!weapon.piercing && shieldsEffective > 0) {
            this.enemyShip.shields--;
            this.enemyShip.shieldRecharge = 0;
            this.showCombatText('SHIELD HIT', 750, 350, '#00ccff');
            this.cameras.main.shake(100, 0.002);
            return;
        }

        // Apply hull damage
        this.enemyShip.hull -= weapon.damage;

        // Screen shake on hit
        this.cameras.main.shake(200, 0.005);

        // Apply system damage to targeted system
        if (this.selectedTarget && this.selectedTarget !== 'hull') {
            const system = this.enemyShip.systems[this.selectedTarget];
            if (system && system.health > 0) {
                system.health = Math.max(0, system.health - 1);
                this.showCombatText(`${this.selectedTarget.toUpperCase()} -1`, 750, 320, '#ffaa00');

                // Update enemy based on damaged systems
                if (this.selectedTarget === 'weapons' && system.health <= 0) {
                    // Disable all enemy weapons
                    for (const w of this.enemyShip.weapons) {
                        w.active = false;
                    }
                    this.showCombatText('WEAPONS OFFLINE!', 750, 280, '#ff4444');
                }
            }
        }

        // Fire chance
        if (weapon.fireChance && Math.random() < weapon.fireChance) {
            this.enemyShip.fires.push({ room: this.selectedTarget || 'hull', duration: 10 });
            this.showCombatText('FIRE!', 780, 350, '#ff4400');
        }

        this.showCombatText(`-${weapon.damage}`, 750, 350, '#ff4444');
    }

    enemyFireWeapon(weapon) {
        // Skip if weapon was disabled
        if (!weapon.active) return;

        // Calculate player evasion based on engines (check system damage)
        const engineSys = this.playerShip.systems.engines;
        let enginePower = engineSys.power - engineSys.damage;
        enginePower = Math.max(0, enginePower);

        // Check if pilot is in piloting room
        const hasPilot = this.crew.some(c => c.room === 'piloting' && c.health > 0);
        const baseEvasion = hasPilot ? (5 + enginePower * 5) : 0;
        const evadeChance = baseEvasion / 100;

        if (Math.random() < evadeChance) {
            this.showCombatText('EVADED', 150, 350, '#888');
            return;
        }

        // Check player shields (account for system damage)
        const shieldSys = this.playerShip.systems.shields;
        let effectiveShieldPower = Math.max(0, shieldSys.power - shieldSys.damage);

        if (!weapon.piercing && this.playerShip.shields > 0 && effectiveShieldPower > 0) {
            this.playerShip.shields--;
            this.playerShip.shieldRecharge = 0;
            this.showCombatText('SHIELD', 150, 350, '#00ccff');
            this.cameras.main.shake(100, 0.003);
            return;
        }

        // Apply hull damage
        this.playerShip.hull -= weapon.damage;

        // Screen shake on damage
        this.cameras.main.shake(300, 0.008);

        // Random system damage
        const systemNames = ['shields', 'weapons', 'engines', 'oxygen', 'medbay'];
        const targetSystem = systemNames[Phaser.Math.Between(0, systemNames.length - 1)];
        if (Math.random() < 0.3) {
            this.playerShip.systems[targetSystem].damage++;
            this.showCombatText(`${targetSystem.toUpperCase()} HIT!`, 150, 320, '#ffaa00');
        }

        // Fire chance
        if (weapon.fireChance && Math.random() < weapon.fireChance) {
            const rooms = PLAYER_ROOMS.map(r => r.name);
            const fireRoom = rooms[Phaser.Math.Between(0, rooms.length - 1)];
            this.playerShip.fires.push({ room: fireRoom, duration: 15 });
            this.showCombatText('FIRE IN ' + fireRoom.toUpperCase() + '!', 150, 280, '#ff4400');
        }

        this.showCombatText(`-${weapon.damage}`, 150, 350, '#ff4444');
    }

    showCombatText(text, x, y, color) {
        const dmgText = this.add.text(x, y - 30, text, {
            fontSize: '16px',
            fill: color,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.combatContainer.add(dmgText);

        this.tweens.add({
            targets: dmgText,
            y: y - 80,
            alpha: 0,
            duration: 1000,
            onComplete: () => dmgText.destroy()
        });
    }

    updateCombatUI() {
        // Update hull bars
        const playerHullPercent = this.playerShip.hull / this.playerShip.maxHull;
        this.playerHullBar.scaleX = Math.max(0, playerHullPercent);

        const enemyHullPercent = this.enemyShip.hull / this.enemyShip.maxHull;
        this.enemyHullBar.scaleX = Math.max(0, enemyHullPercent);

        // Update shield bars
        const playerShieldPercent = this.playerShip.shields / Math.max(1, this.playerShip.maxShields);
        this.playerShieldBar.scaleX = playerShieldPercent;

        const enemyShieldPercent = this.enemyShip.shields / Math.max(1, this.enemyShip.maxShields);
        this.enemyShieldBar.scaleX = enemyShieldPercent;

        // Update weapon charge bars
        for (let i = 0; i < this.weaponChargeBars.length; i++) {
            if (i < this.playerShip.weapons.length) {
                const weapon = this.playerShip.weapons[i];
                const chargePercent = weapon.charge / weapon.chargeTime;
                this.weaponChargeBars[i].scaleX = Math.min(1, chargePercent);

                // Green when ready
                if (chargePercent >= 1) {
                    this.weaponChargeBars[i].fillColor = COLORS.TEXT_GREEN;
                } else {
                    this.weaponChargeBars[i].fillColor = COLORS.WEAPONS;
                }
            }
        }

        // Update crew status
        if (this.crewStatusText) {
            let crewText = 'CREW:\n';
            for (const crewMember of this.crew) {
                const status = crewMember.health <= 0 ? 'DEAD' : `${Math.floor(crewMember.health)}HP`;
                const selected = crewMember.id === this.selectedCrew ? '>' : ' ';
                crewText += `${selected}${crewMember.name}: ${status} [${crewMember.room}]\n`;
            }
            this.crewStatusText.setText(crewText);
        }

        // Update fire overlays on player rooms
        if (this.playerRoomSprites) {
            for (const roomSprite of this.playerRoomSprites) {
                const hasFireInRoom = this.playerShip.fires.some(f => f.room === roomSprite.roomName);
                if (hasFireInRoom) {
                    roomSprite.fillColor = 0x884422; // Orange tint for fire
                    roomSprite.setAlpha(0.7 + Math.sin(Date.now() / 100) * 0.2); // Flicker
                } else {
                    roomSprite.fillColor = 0x333355;
                    roomSprite.setAlpha(1);
                }

                // Show damaged systems with red tint
                const roomDef = PLAYER_ROOMS.find(r => r.name === roomSprite.roomName);
                if (roomDef && roomDef.system) {
                    const sys = this.playerShip.systems[roomDef.system];
                    if (sys && sys.damage > 0) {
                        roomSprite.setStrokeStyle(2, 0xff4444);
                    } else {
                        roomSprite.setStrokeStyle(1, 0x666688);
                    }
                }
            }
        }

        // Update crew positions
        this.updateCrewPositions();

        // Update enemy room status (show damaged systems)
        if (this.enemyRooms) {
            for (const room of this.enemyRooms) {
                const sys = this.enemyShip.systems[room.roomName];
                if (sys) {
                    if (sys.health <= 0) {
                        room.fillColor = 0x662222; // Red for destroyed
                    } else if (sys.health < sys.maxHealth) {
                        room.fillColor = 0x555544; // Yellow for damaged
                    } else {
                        room.fillColor = 0x333355;
                    }
                }

                // Fire effect on enemy rooms
                const hasFireInRoom = this.enemyShip.fires.some(f => f.room === room.roomName);
                if (hasFireInRoom) {
                    room.setAlpha(0.7 + Math.sin(Date.now() / 100) * 0.2);
                } else {
                    room.setAlpha(1);
                }
            }
        }
    }

    combatVictory() {
        stats.shipsDestroyed++;
        const scrapReward = Phaser.Math.Between(15, 40);
        this.playerShip.scrap += scrapReward;
        stats.scrapEarned += scrapReward;

        // Show victory and return to map
        const victoryText = this.add.text(512, 300, `VICTORY!\n+${scrapReward} Scrap`, {
            fontSize: '32px',
            fill: '#44ff44',
            align: 'center'
        }).setOrigin(0.5);
        this.combatContainer.add(victoryText);

        this.time.delayedCall(2000, () => {
            this.showSectorMap();
        });
    }

    nextSector() {
        this.currentSector++;
        stats.sectorsCompleted++;

        if (this.currentSector > this.maxSectors) {
            this.victory();
            return;
        }

        this.rebelProgress = Math.max(0, this.rebelProgress - 30);
        this.generateSectorMap();
        this.showSectorMap();
    }

    adjustPower(system, amount) {
        const sys = this.playerShip.systems[system];
        if (!sys) return;

        const totalPower = Object.values(this.playerShip.systems).reduce((sum, s) => sum + s.power, 0);
        const newPower = sys.power + amount;

        if (amount > 0) {
            if (newPower <= sys.maxPower && totalPower + amount <= this.playerShip.reactor) {
                sys.power = newPower;
            }
        } else {
            if (newPower >= 0) {
                sys.power = newPower;
            }
        }

        this.updateUI();
    }

    updateUI() {
        // Hull
        this.hullText.setText(`Hull: ${this.playerShip.hull}/${this.playerShip.maxHull}`);

        // Resources
        this.resourceText.setText(`Scrap: ${this.playerShip.scrap} | Fuel: ${this.playerShip.fuel} | Crew: ${this.playerShip.crew}`);

        // Sector
        this.sectorText.setText(`Sector ${this.currentSector}/${this.maxSectors}`);

        // Pause
        this.pauseText.setText(combatPaused && gameState === 'combat' ? 'PAUSED' : '');

        // System bars
        for (const [name, bar] of Object.entries(this.systemBars)) {
            const sys = this.playerShip.systems[name];
            if (sys) {
                const fillPercent = sys.power / sys.maxPower;
                bar.fill.scaleX = fillPercent;
            }
        }

        // Weapons
        for (let i = 0; i < this.weaponTexts.length; i++) {
            if (i < this.playerShip.weapons.length) {
                const w = this.playerShip.weapons[i];
                const ready = w.charge >= w.chargeTime;
                this.weaponTexts[i].setText(`${w.name}\n${ready ? 'READY' : Math.floor(w.charge)}s`);
                this.weaponTexts[i].setFill(ready ? '#44ff44' : '#ff8844');
            } else {
                this.weaponTexts[i].setText('');
            }
        }
    }

    updatePauseIndicator() {
        this.pauseText.setText(combatPaused ? 'PAUSED' : '');
    }

    gameOver() {
        gameState = 'gameover';

        this.add.rectangle(512, 384, 400, 200, COLORS.UI_DARK, 0.9).setDepth(200);
        this.add.text(512, 350, 'SHIP DESTROYED', {
            fontSize: '32px',
            fill: '#ff4444'
        }).setOrigin(0.5).setDepth(201);

        const restartBtn = this.add.rectangle(512, 420, 150, 40, 0x444466)
            .setInteractive({ useHandCursor: true })
            .setDepth(201);
        this.add.text(512, 420, 'RESTART', {
            fontSize: '16px',
            fill: '#fff'
        }).setOrigin(0.5).setDepth(202);

        restartBtn.on('pointerdown', () => {
            stats = { jumpsCompleted: 0, shipsDestroyed: 0, scrapEarned: 0, sectorsCompleted: 0, beaconsVisited: 0 };
            this.scene.restart();
        });
    }

    victory() {
        gameState = 'victory';

        this.add.rectangle(512, 384, 500, 250, COLORS.UI_DARK, 0.9).setDepth(200);
        this.add.text(512, 320, 'VICTORY!', {
            fontSize: '48px',
            fill: '#44ff44'
        }).setOrigin(0.5).setDepth(201);

        this.add.text(512, 380, `Ships Destroyed: ${stats.shipsDestroyed}\nScrap Earned: ${stats.scrapEarned}`, {
            fontSize: '16px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5).setDepth(201);

        const restartBtn = this.add.rectangle(512, 450, 150, 40, 0x444466)
            .setInteractive({ useHandCursor: true })
            .setDepth(201);
        this.add.text(512, 450, 'NEW GAME', {
            fontSize: '16px',
            fill: '#fff'
        }).setOrigin(0.5).setDepth(202);

        restartBtn.on('pointerdown', () => {
            stats = { jumpsCompleted: 0, shipsDestroyed: 0, scrapEarned: 0, sectorsCompleted: 0, beaconsVisited: 0 };
            this.scene.restart();
        });
    }

    attemptJump() {
        if (gameState === 'map') {
            // Find next unvisited beacon
            const current = this.beacons[this.currentBeacon];
            for (const connIdx of current.connections) {
                if (!this.beacons[connIdx].visited) {
                    this.jumpToBeacon(connIdx);
                    return;
                }
            }
        }
    }

    setupHarness() {
        const scene = this;

        window.harness = {
            pause: () => { gamePaused = true; },
            resume: () => { gamePaused = false; },
            isPaused: () => gamePaused,

            execute: async (action, durationMs) => {
                return new Promise((resolve) => {
                    gamePaused = false;

                    // Handle actions
                    if (action.key === 'space') {
                        combatPaused = !combatPaused;
                    } else if (action.key === 'f') {
                        scene.fireWeapons();
                    } else if (action.key === 'j') {
                        scene.attemptJump();
                    } else if (action.key === '1') {
                        scene.adjustPower('shields', 1);
                    } else if (action.key === '2') {
                        scene.adjustPower('weapons', 1);
                    } else if (action.key === '3') {
                        scene.adjustPower('engines', 1);
                    } else if (action.key === 'c') {
                        scene.cycleCrewSelection();
                    } else if (action.key === 'r') {
                        scene.repairSystem();
                    }

                    setTimeout(() => {
                        gamePaused = true;
                        resolve();
                    }, durationMs);
                });
            },

            getState: () => ({
                gameState: gameState,
                combatPaused: combatPaused,
                currentSector: scene.currentSector,
                currentBeacon: scene.currentBeacon,
                player: scene.playerShip ? {
                    hull: scene.playerShip.hull,
                    maxHull: scene.playerShip.maxHull,
                    shields: scene.playerShip.shields,
                    fuel: scene.playerShip.fuel,
                    scrap: scene.playerShip.scrap,
                    systems: scene.playerShip.systems,
                    fires: scene.playerShip.fires,
                    weapons: scene.playerShip.weapons?.map(w => ({
                        name: w.name,
                        charge: w.charge,
                        chargeTime: w.chargeTime,
                        ready: w.charge >= w.chargeTime
                    }))
                } : null,
                crew: scene.crew?.map(c => ({
                    name: c.name,
                    room: c.room,
                    health: c.health,
                    maxHealth: c.maxHealth
                })),
                selectedCrew: scene.selectedCrew,
                enemy: scene.enemyShip ? {
                    hull: scene.enemyShip.hull,
                    maxHull: scene.enemyShip.maxHull,
                    shields: scene.enemyShip.shields,
                    type: scene.enemyShip.type,
                    systems: scene.enemyShip.systems,
                    fires: scene.enemyShip.fires
                } : null,
                beacons: scene.beacons?.length || 0,
                rebelProgress: scene.rebelProgress,
                stats: stats
            }),

            getPhase: () => {
                if (gameState === 'menu') return 'menu';
                if (gameState === 'gameover') return 'gameover';
                if (gameState === 'victory') return 'victory';
                return 'playing';
            },

            debug: {
                setHealth: (hp) => {
                    if (scene.playerShip) scene.playerShip.hull = hp;
                },
                forceStart: () => {
                    gamePaused = false;
                    if (gameState === 'menu') {
                        scene.scene.start('GameScene');
                    }
                },
                clearEnemies: () => {
                    if (scene.enemyShip) scene.enemyShip.hull = 0;
                },
                addScrap: (amount) => {
                    if (scene.playerShip) scene.playerShip.scrap += amount;
                },
                addFuel: (amount) => {
                    if (scene.playerShip) scene.playerShip.fuel += amount;
                },
                jumpToBeacon: (idx) => {
                    scene.jumpToBeacon(idx);
                },
                winCombat: () => {
                    if (scene.enemyShip) scene.enemyShip.hull = 0;
                }
            }
        };
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0a0a1a',
    scene: [BootScene, MenuScene, GameScene]
};

const game = new Phaser.Game(config);
