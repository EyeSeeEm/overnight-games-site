// X-COM Classic Clone
// Turn-Based Tactical Strategy with Phaser 3

const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 700;

let gamePaused = true;
let gameState = 'menu';
let currentTurn = 'player';
let turnNumber = 1;
let selectedSoldier = null;
let targetedEnemy = null;
let shotType = 'snap';

// Soldier stats
const SOLDIER_TEMPLATES = [
    { name: 'Sgt. Williams', tu: 58, health: 40, reactions: 55, firingAccuracy: 62, bravery: 50 },
    { name: 'Cpl. Martinez', tu: 54, health: 35, reactions: 48, firingAccuracy: 55, bravery: 45 },
    { name: 'Pvt. Johnson', tu: 52, health: 32, reactions: 45, firingAccuracy: 50, bravery: 40 },
    { name: 'Pvt. Chen', tu: 50, health: 30, reactions: 42, firingAccuracy: 48, bravery: 35 },
    { name: 'Rkt. Anderson', tu: 48, health: 28, reactions: 38, firingAccuracy: 45, bravery: 30 },
    { name: 'Rkt. Davis', tu: 48, health: 28, reactions: 35, firingAccuracy: 42, bravery: 30 }
];

// Weapons
const WEAPONS = {
    rifle: {
        name: 'Rifle',
        damage: 30,
        snap: { accuracy: 60, tuPercent: 25 },
        aimed: { accuracy: 110, tuPercent: 80 },
        auto: { accuracy: 35, tuPercent: 35, rounds: 3 },
        maxAmmo: 20,
        ammo: 20
    },
    pistol: {
        name: 'Pistol',
        damage: 26,
        snap: { accuracy: 30, tuPercent: 18 },
        aimed: { accuracy: 78, tuPercent: 30 },
        auto: null,
        maxAmmo: 12,
        ammo: 12
    },
    heavyCannon: {
        name: 'Heavy Cannon',
        damage: 56,
        snap: { accuracy: 60, tuPercent: 33 },
        aimed: { accuracy: 90, tuPercent: 80 },
        auto: null,
        maxAmmo: 6,
        ammo: 6
    }
};

// Equipment
const EQUIPMENT = {
    fragGrenade: {
        name: 'Frag Grenade',
        damage: 50,
        radius: 3,
        throwTuPercent: 25,
        primeTuCost: 4
    },
    smokeGrenade: {
        name: 'Smoke Grenade',
        radius: 3,
        throwTuPercent: 25,
        primeTuCost: 4,
        duration: 3
    }
};

// Aliens
const ALIEN_TYPES = {
    sectoid: {
        name: 'Sectoid',
        health: 30,
        tu: 54,
        reactions: 63,
        accuracy: 55,
        damage: 35,
        color: 0x88aa88,
        armor: 4
    },
    floater: {
        name: 'Floater',
        health: 40,
        tu: 55,
        reactions: 55,
        accuracy: 50,
        damage: 45,
        color: 0xaa8888,
        armor: 8
    },
    muton: {
        name: 'Muton',
        health: 125,
        tu: 60,
        reactions: 68,
        accuracy: 65,
        damage: 60,
        color: 0x8888aa,
        armor: 32
    }
};

// Tile types
const TILES = {
    ground: { walkable: true, cover: 'none', tuCost: 4, color: 0x3a4a3a, destructible: false },
    grass: { walkable: true, cover: 'none', tuCost: 4, color: 0x4a5a3a, destructible: false },
    road: { walkable: true, cover: 'none', tuCost: 4, color: 0x4a4a4a, destructible: false },
    wall: { walkable: false, cover: 'full', tuCost: 0, color: 0x5a5a5a, destructible: true, hp: 40 },
    cover: { walkable: true, cover: 'partial', tuCost: 4, color: 0x6a5a4a, destructible: true, hp: 20 },
    debris: { walkable: true, cover: 'partial', tuCost: 6, color: 0x5a4a3a, destructible: false },
    door: { walkable: true, cover: 'none', tuCost: 6, color: 0x4a6a4a, destructible: true, hp: 15 },
    rubble: { walkable: true, cover: 'partial', tuCost: 6, color: 0x4a3a3a, destructible: false },
    smoke: { walkable: true, cover: 'partial', tuCost: 4, color: 0x666688, destructible: false, smokeTimer: 0 }
};

// Game state
let soldiers = [];
let aliens = [];
let mapData = [];
let visibleTiles = [];
let gameScene = null;

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

        this.add.rectangle(400, 350, 800, 700, 0x0a0a14);

        this.add.text(400, 120, 'X-COM CLASSIC', {
            fontSize: '48px',
            fill: '#4488ff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(400, 180, 'Tactical Combat Simulator', {
            fontSize: '18px',
            fill: '#2266aa',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Mission briefing
        this.add.text(400, 280, 'MISSION BRIEFING', {
            fontSize: '20px',
            fill: '#ff8844',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(400, 320, 'UFO crash site detected. Deploy squad\nto eliminate all alien hostiles.', {
            fontSize: '14px',
            fill: '#aaaaaa',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5);

        const startBtn = this.add.text(400, 420, '[ BEGIN MISSION ]', {
            fontSize: '28px',
            fill: '#44ff44',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#88ff88'));
        startBtn.on('pointerout', () => startBtn.setFill('#44ff44'));
        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Keyboard support for starting
        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('GameScene');
        });
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });

        // Controls
        this.add.text(400, 520, 'CONTROLS', {
            fontSize: '16px',
            fill: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(400, 560, 'Click tile to move | Click enemy to target | Tab = Next soldier', {
            fontSize: '12px',
            fill: '#666666',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(400, 585, '1/2/3 = Shot type | C = Crouch | Enter = End Turn', {
            fontSize: '12px',
            fill: '#666666',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        gameScene = this;
        gameState = 'playing';
        gamePaused = true;

        this.initGame();
        this.createMap();
        this.createSoldiers();
        this.createAliens();
        this.createUI();
        this.setupInput();
        this.updateVisibility();

        gamePaused = false;
    }

    initGame() {
        currentTurn = 'player';
        turnNumber = 1;
        selectedSoldier = null;
        targetedEnemy = null;
        shotType = 'snap';
        soldiers = [];
        aliens = [];
        mapData = [];
        visibleTiles = [];
    }

    createMap() {
        // Procedural map generation
        mapData = [];
        for (let y = 0; y < MAP_HEIGHT; y++) {
            mapData[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                mapData[y][x] = { ...TILES.ground };
            }
        }

        // Generate buildings
        const buildingCount = 3 + Math.floor(Math.random() * 3);
        for (let b = 0; b < buildingCount; b++) {
            const bx = 3 + Math.floor(Math.random() * (MAP_WIDTH - 8));
            const by = 3 + Math.floor(Math.random() * (MAP_HEIGHT - 6));
            const bw = 3 + Math.floor(Math.random() * 3);
            const bh = 3 + Math.floor(Math.random() * 2);

            // Walls
            for (let x = bx; x < bx + bw; x++) {
                for (let y = by; y < by + bh; y++) {
                    if (x === bx || x === bx + bw - 1 || y === by || y === by + bh - 1) {
                        if (mapData[y] && mapData[y][x]) {
                            mapData[y][x] = { ...TILES.wall };
                        }
                    }
                }
            }

            // Door
            const doorSide = Math.floor(Math.random() * 4);
            if (doorSide === 0 && mapData[by]) mapData[by][bx + 1] = { ...TILES.door };
            else if (doorSide === 1 && mapData[by + bh - 1]) mapData[by + bh - 1][bx + 1] = { ...TILES.door };
            else if (doorSide === 2 && mapData[by + 1]) mapData[by + 1][bx] = { ...TILES.door };
            else if (doorSide === 3 && mapData[by + 1]) mapData[by + 1][bx + bw - 1] = { ...TILES.door };
        }

        // Scatter cover objects
        for (let i = 0; i < 15; i++) {
            const cx = Math.floor(Math.random() * MAP_WIDTH);
            const cy = Math.floor(Math.random() * MAP_HEIGHT);
            if (mapData[cy][cx].walkable) {
                mapData[cy][cx] = { ...TILES.cover };
            }
        }

        // Add debris
        for (let i = 0; i < 10; i++) {
            const dx = Math.floor(Math.random() * MAP_WIDTH);
            const dy = Math.floor(Math.random() * MAP_HEIGHT);
            if (mapData[dy][dx].walkable && mapData[dy][dx].cover === 'none') {
                mapData[dy][dx] = { ...TILES.debris };
            }
        }

        // Render map
        this.mapTiles = [];
        this.fogTiles = [];

        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.mapTiles[y] = [];
            this.fogTiles[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                const tile = mapData[y][x];
                const px = x * TILE_SIZE + TILE_SIZE / 2;
                const py = y * TILE_SIZE + TILE_SIZE / 2 + 60;

                const rect = this.add.rectangle(px, py, TILE_SIZE - 1, TILE_SIZE - 1, tile.color);
                rect.setStrokeStyle(1, 0x222222);
                rect.gridX = x;
                rect.gridY = y;
                rect.setInteractive();
                this.mapTiles[y][x] = rect;

                // Fog of war
                const fog = this.add.rectangle(px, py, TILE_SIZE, TILE_SIZE, 0x000000, 0.8);
                fog.setDepth(50);
                this.fogTiles[y][x] = fog;
            }
        }
    }

    createSoldiers() {
        this.soldierSprites = [];

        // Spawn soldiers on left side
        const soldierCount = 4;
        for (let i = 0; i < soldierCount; i++) {
            const template = SOLDIER_TEMPLATES[i];
            let sx, sy;

            // Find walkable spawn point
            do {
                sx = Math.floor(Math.random() * 3);
                sy = 2 + i * 3;
            } while (!mapData[sy] || !mapData[sy][sx] || !mapData[sy][sx].walkable);

            const soldier = {
                id: i,
                ...template,
                maxTu: template.tu,
                currentTu: template.tu,
                maxHealth: template.health,
                currentHealth: template.health,
                x: sx,
                y: sy,
                facing: 2, // East
                stance: 'standing',
                weapon: { ...WEAPONS.rifle, ammo: WEAPONS.rifle.maxAmmo },
                grenades: 2,
                morale: 100,
                panicked: false,
                alive: true
            };

            soldiers.push(soldier);

            const px = sx * TILE_SIZE + TILE_SIZE / 2;
            const py = sy * TILE_SIZE + TILE_SIZE / 2 + 60;

            const sprite = this.add.rectangle(px, py, 24, 24, 0x4488ff);
            sprite.setStrokeStyle(2, 0x88aaff);
            sprite.setDepth(100);
            sprite.soldierIndex = i;
            sprite.setInteractive();

            // Health bar
            const hpBg = this.add.rectangle(px, py - 18, 26, 4, 0x333333).setDepth(101);
            const hpBar = this.add.rectangle(px, py - 18, 24, 2, 0x44ff44).setDepth(102);

            // TU bar
            const tuBg = this.add.rectangle(px, py - 13, 26, 4, 0x333333).setDepth(101);
            const tuBar = this.add.rectangle(px, py - 13, 24, 2, 0x4488ff).setDepth(102);

            this.soldierSprites.push({
                sprite, hpBg, hpBar, tuBg, tuBar
            });
        }

        // Select first soldier
        selectedSoldier = 0;
        this.highlightSelectedSoldier();
    }

    createAliens() {
        this.alienSprites = [];

        // Spawn aliens on right side
        const alienCount = 4 + Math.floor(Math.random() * 3);
        const alienTypes = ['sectoid', 'sectoid', 'sectoid', 'floater', 'floater', 'muton'];

        for (let i = 0; i < alienCount; i++) {
            const type = alienTypes[Math.min(i, alienTypes.length - 1)];
            const template = ALIEN_TYPES[type];

            let ax, ay;
            do {
                ax = MAP_WIDTH - 5 + Math.floor(Math.random() * 4);
                ay = Math.floor(Math.random() * MAP_HEIGHT);
            } while (!mapData[ay] || !mapData[ay][ax] || !mapData[ay][ax].walkable ||
                     aliens.some(a => a.x === ax && a.y === ay) ||
                     soldiers.some(s => s.x === ax && s.y === ay));

            const alien = {
                id: i,
                type,
                ...template,
                maxTu: template.tu,
                currentTu: template.tu,
                maxHealth: template.health,
                currentHealth: template.health,
                x: ax,
                y: ay,
                facing: 6, // West
                state: 'patrol',
                alive: true,
                visible: false
            };

            aliens.push(alien);

            const px = ax * TILE_SIZE + TILE_SIZE / 2;
            const py = ay * TILE_SIZE + TILE_SIZE / 2 + 60;

            const sprite = this.add.rectangle(px, py, 24, 24, template.color);
            sprite.setStrokeStyle(2, 0xff4444);
            sprite.setDepth(100);
            sprite.alienIndex = i;
            sprite.setInteractive();
            sprite.setVisible(false);

            // Health bar (hidden initially)
            const hpBg = this.add.rectangle(px, py - 18, 26, 4, 0x333333).setDepth(101).setVisible(false);
            const hpBar = this.add.rectangle(px, py - 18, 24, 2, 0xff4444).setDepth(102).setVisible(false);

            this.alienSprites.push({ sprite, hpBg, hpBar });
        }
    }

    createUI() {
        // Top bar
        this.add.rectangle(400, 30, 800, 60, 0x1a1a2a).setDepth(200);

        this.turnText = this.add.text(20, 20, 'TURN 1 - PLAYER PHASE', {
            fontSize: '16px',
            fill: '#44ff44',
            fontFamily: 'monospace'
        }).setDepth(201);

        this.soldierText = this.add.text(250, 10, '', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setDepth(201);

        this.tuText = this.add.text(250, 30, '', {
            fontSize: '14px',
            fill: '#4488ff',
            fontFamily: 'monospace'
        }).setDepth(201);

        this.healthText = this.add.text(450, 10, '', {
            fontSize: '14px',
            fill: '#44ff44',
            fontFamily: 'monospace'
        }).setDepth(201);

        this.weaponText = this.add.text(450, 30, '', {
            fontSize: '14px',
            fill: '#ffaa44',
            fontFamily: 'monospace'
        }).setDepth(201);

        // Bottom action bar
        this.add.rectangle(400, 650, 800, 100, 0x1a1a2a).setDepth(200);

        // Action buttons with icons
        const buttons = [
            { x: 60, label: 'SNAP', key: '1', icon: '>', desc: '25% TU, Low accuracy' },
            { x: 140, label: 'AIMED', key: '2', icon: '@', desc: '80% TU, High accuracy' },
            { x: 220, label: 'AUTO', key: '3', icon: ']]', desc: '35% TU, 3 rounds' },
            { x: 300, label: 'GREN', key: 'G', icon: '*', desc: 'Throw grenade (25% TU)' },
            { x: 400, label: 'CROUCH', key: 'C', icon: 'v', desc: '+15% accuracy' },
            { x: 500, label: 'RELOAD', key: 'R', icon: '[]', desc: 'Reload weapon (15 TU)' },
            { x: 600, label: 'NEXT', key: 'TAB', icon: '>>', desc: 'Next soldier' },
            { x: 700, label: 'END', key: 'RET', icon: 'X', desc: 'End turn' }
        ];

        this.actionButtons = [];
        buttons.forEach((btn, i) => {
            const bg = this.add.rectangle(btn.x, 635, 80, 50, 0x2a2a4a).setDepth(201).setInteractive();
            bg.setStrokeStyle(2, 0x4a4a6a);

            const icon = this.add.text(btn.x, 625, btn.icon, {
                fontSize: '18px',
                fill: '#88aaff',
                fontFamily: 'monospace'
            }).setOrigin(0.5).setDepth(202);

            const label = this.add.text(btn.x, 650, btn.label, {
                fontSize: '10px',
                fill: '#aaaaaa',
                fontFamily: 'monospace'
            }).setOrigin(0.5).setDepth(202);

            const key = this.add.text(btn.x + 30, 615, btn.key, {
                fontSize: '8px',
                fill: '#666666',
                fontFamily: 'monospace'
            }).setOrigin(0.5).setDepth(202);

            bg.on('pointerover', () => {
                bg.setFillStyle(0x3a3a5a);
                this.showTooltip(btn.desc, btn.x, 590);
            });
            bg.on('pointerout', () => {
                bg.setFillStyle(0x2a2a4a);
                this.hideTooltip();
            });
            bg.on('pointerdown', () => this.handleButtonClick(btn.label));

            this.actionButtons.push({ bg, icon, label, btnData: btn });
        });

        // Shot type indicator
        this.shotTypeText = this.add.text(700, 620, 'SHOT: SNAP', {
            fontSize: '12px',
            fill: '#ffaa44',
            fontFamily: 'monospace'
        }).setDepth(202);

        // Message text
        this.messageText = this.add.text(400, 580, '', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(202);

        // Tooltip
        this.tooltip = this.add.text(400, 590, '', {
            fontSize: '11px',
            fill: '#aaaaaa',
            fontFamily: 'monospace',
            backgroundColor: '#1a1a2a',
            padding: { x: 5, y: 3 }
        }).setOrigin(0.5).setDepth(210).setVisible(false);
    }

    showTooltip(text, x, y) {
        this.tooltip.setText(text);
        this.tooltip.setPosition(x, y);
        this.tooltip.setVisible(true);
    }

    hideTooltip() {
        this.tooltip.setVisible(false);
    }

    handleButtonClick(label) {
        switch (label) {
            case 'SNAP': shotType = 'snap'; break;
            case 'AIMED': shotType = 'aimed'; break;
            case 'AUTO': shotType = 'auto'; break;
            case 'GREN': this.enterGrenadeMode(); break;
            case 'CROUCH': this.toggleCrouch(); break;
            case 'RELOAD': this.reloadWeapon(); break;
            case 'NEXT': this.selectNextSoldier(); break;
            case 'END': this.endPlayerTurn(); break;
        }
        this.updateUI();
    }

    grenadeMode = false;

    enterGrenadeMode() {
        const soldier = soldiers[selectedSoldier];
        if (!soldier || !soldier.alive) return;

        if (soldier.grenades <= 0) {
            this.showMessage('No grenades!');
            return;
        }

        const tuCost = Math.ceil(soldier.maxTu * 0.25) + 4; // throw + prime
        if (soldier.currentTu < tuCost) {
            this.showMessage('Not enough TU! Need ' + tuCost);
            return;
        }

        this.grenadeMode = true;
        this.showMessage('Click target tile to throw grenade...');
    }

    throwGrenade(targetX, targetY) {
        const soldier = soldiers[selectedSoldier];
        if (!soldier || !soldier.alive) return;

        const tuCost = Math.ceil(soldier.maxTu * 0.25) + 4;
        soldier.currentTu -= tuCost;
        soldier.grenades--;

        this.grenadeMode = false;

        // Calculate throw accuracy
        const dist = Math.abs(targetX - soldier.x) + Math.abs(targetY - soldier.y);
        const accuracy = soldier.firingAccuracy * 0.8;
        const scatter = Math.random() * 100 > accuracy ? Math.floor(Math.random() * 2) + 1 : 0;

        // Apply scatter
        const finalX = Math.max(0, Math.min(MAP_WIDTH - 1, targetX + (Math.random() > 0.5 ? scatter : -scatter)));
        const finalY = Math.max(0, Math.min(MAP_HEIGHT - 1, targetY + (Math.random() > 0.5 ? scatter : -scatter)));

        // Create explosion
        this.createExplosion(finalX, finalY, EQUIPMENT.fragGrenade.damage, EQUIPMENT.fragGrenade.radius);
        this.showMessage('Grenade exploded!');
        this.updateUI();
    }

    createExplosion(centerX, centerY, damage, radius) {
        // Screen shake
        this.screenShake(10, 200);

        // Visual explosion
        const px = centerX * TILE_SIZE + TILE_SIZE / 2;
        const py = centerY * TILE_SIZE + TILE_SIZE / 2 + 60;

        const explosion = this.add.circle(px, py, radius * TILE_SIZE, 0xff8800, 0.8);
        explosion.setDepth(150);
        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => explosion.destroy()
        });

        // Damage units and destroy terrain in radius
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) continue;

                const dist = Math.abs(x - centerX) + Math.abs(y - centerY);
                if (dist > radius) continue;

                const falloff = 1 - (dist / (radius + 1));
                const actualDamage = damage * falloff * (0.5 + Math.random());

                // Damage soldiers
                soldiers.forEach((soldier, i) => {
                    if (soldier.alive && soldier.x === x && soldier.y === y) {
                        soldier.currentHealth -= actualDamage;
                        this.screenShake(5, 100);

                        if (soldier.currentHealth <= 0) {
                            soldier.alive = false;
                            const ss = this.soldierSprites[i];
                            ss.sprite.setVisible(false);
                            ss.hpBg.setVisible(false);
                            ss.hpBar.setVisible(false);
                            ss.tuBg.setVisible(false);
                            ss.tuBar.setVisible(false);
                            this.showMessage(soldier.name + ' KIA!');
                            this.moraleCheckTeam();
                        }
                    }
                });

                // Damage aliens
                aliens.forEach((alien, i) => {
                    if (alien.alive && alien.x === x && alien.y === y) {
                        const dmg = Math.max(0, actualDamage - alien.armor);
                        alien.currentHealth -= dmg;

                        if (alien.currentHealth <= 0) {
                            alien.alive = false;
                            this.alienSprites[i].sprite.setVisible(false);
                            this.alienSprites[i].hpBg.setVisible(false);
                            this.alienSprites[i].hpBar.setVisible(false);
                        }
                    }
                });

                // Destroy terrain
                const tile = mapData[y]?.[x];
                if (tile && tile.destructible) {
                    if (!tile.currentHp) tile.currentHp = tile.hp || 20;
                    tile.currentHp -= actualDamage;

                    if (tile.currentHp <= 0) {
                        // Convert to rubble
                        mapData[y][x] = { ...TILES.rubble };
                        this.mapTiles[y][x].setFillStyle(TILES.rubble.color);
                    }
                }
            }
        }

        this.updateSoldierSprites();
        this.updateAlienSprites();
        this.updateVisibility();
        this.checkVictory();
        this.checkDefeat();
    }

    screenShake(intensity, duration) {
        this.cameras.main.shake(duration, intensity / 1000);
    }

    reloadWeapon() {
        const soldier = soldiers[selectedSoldier];
        if (!soldier || !soldier.alive) return;

        const reloadTu = 15;
        if (soldier.currentTu < reloadTu) {
            this.showMessage('Not enough TU to reload!');
            return;
        }

        if (soldier.weapon.ammo >= soldier.weapon.maxAmmo) {
            this.showMessage('Weapon already full!');
            return;
        }

        soldier.currentTu -= reloadTu;
        soldier.weapon.ammo = soldier.weapon.maxAmmo;
        this.showMessage('Reloaded!');
        this.updateUI();
    }

    moraleCheckTeam() {
        // When ally dies, morale drops for all soldiers
        soldiers.forEach(soldier => {
            if (soldier.alive) {
                soldier.morale -= 15 + Math.floor(Math.random() * 10);
                if (soldier.morale < 0) soldier.morale = 0;

                // Panic check
                if (soldier.morale < 30 && Math.random() * 100 > soldier.bravery) {
                    soldier.panicked = true;
                    this.showMessage(soldier.name + ' panicked!');
                }
            }
        });
    }

    setupInput() {
        this.input.on('pointerdown', this.handleClick, this);

        this.input.keyboard.on('keydown-ONE', () => { shotType = 'snap'; this.grenadeMode = false; this.updateUI(); });
        this.input.keyboard.on('keydown-TWO', () => { shotType = 'aimed'; this.grenadeMode = false; this.updateUI(); });
        this.input.keyboard.on('keydown-THREE', () => { shotType = 'auto'; this.grenadeMode = false; this.updateUI(); });
        this.input.keyboard.on('keydown-G', () => this.enterGrenadeMode());
        this.input.keyboard.on('keydown-R', () => this.reloadWeapon());
        this.input.keyboard.on('keydown-C', () => this.toggleCrouch());
        this.input.keyboard.on('keydown-TAB', () => this.selectNextSoldier());
        this.input.keyboard.on('keydown-ENTER', () => this.endPlayerTurn());
    }

    handleClick(pointer) {
        if (gamePaused || gameState !== 'playing' || currentTurn !== 'player') return;

        const gridX = Math.floor(pointer.x / TILE_SIZE);
        const gridY = Math.floor((pointer.y - 60) / TILE_SIZE);

        if (gridX < 0 || gridX >= MAP_WIDTH || gridY < 0 || gridY >= MAP_HEIGHT) return;

        // Handle grenade mode
        if (this.grenadeMode) {
            this.throwGrenade(gridX, gridY);
            return;
        }

        // Check if clicked on soldier
        for (let i = 0; i < soldiers.length; i++) {
            if (soldiers[i].alive && soldiers[i].x === gridX && soldiers[i].y === gridY) {
                selectedSoldier = i;
                this.highlightSelectedSoldier();
                this.updateUI();
                return;
            }
        }

        // Check if clicked on visible alien
        for (let i = 0; i < aliens.length; i++) {
            if (aliens[i].alive && aliens[i].visible && aliens[i].x === gridX && aliens[i].y === gridY) {
                this.fireAtAlien(i);
                return;
            }
        }

        // Try to move selected soldier
        if (selectedSoldier !== null) {
            this.moveSoldier(gridX, gridY);
        }
    }

    moveSoldier(targetX, targetY) {
        const soldier = soldiers[selectedSoldier];
        if (!soldier || !soldier.alive) return;

        const tile = mapData[targetY]?.[targetX];
        if (!tile || !tile.walkable) {
            this.showMessage('Cannot move there!');
            return;
        }

        // Simple pathfinding - direct line
        const dx = targetX - soldier.x;
        const dy = targetY - soldier.y;
        const distance = Math.abs(dx) + Math.abs(dy);
        const tuCost = distance * tile.tuCost;

        if (soldier.currentTu < tuCost) {
            this.showMessage('Not enough TU!');
            return;
        }

        // Check for collision
        if (soldiers.some(s => s.alive && s.x === targetX && s.y === targetY) ||
            aliens.some(a => a.alive && a.x === targetX && a.y === targetY)) {
            this.showMessage('Tile occupied!');
            return;
        }

        // Perform move
        soldier.currentTu -= tuCost;
        soldier.x = targetX;
        soldier.y = targetY;

        // Update facing
        if (dx > 0) soldier.facing = 2;
        else if (dx < 0) soldier.facing = 6;
        else if (dy > 0) soldier.facing = 4;
        else if (dy < 0) soldier.facing = 0;

        // Update sprite
        const ss = this.soldierSprites[selectedSoldier];
        const px = targetX * TILE_SIZE + TILE_SIZE / 2;
        const py = targetY * TILE_SIZE + TILE_SIZE / 2 + 60;
        ss.sprite.setPosition(px, py);
        ss.hpBg.setPosition(px, py - 18);
        ss.hpBar.setPosition(px, py - 18);
        ss.tuBg.setPosition(px, py - 13);
        ss.tuBar.setPosition(px, py - 13);

        // Check for alien reaction fire
        this.checkReactionFire(soldier, tuCost);

        this.updateVisibility();
        this.updateUI();
    }

    fireAtAlien(alienIndex) {
        const soldier = soldiers[selectedSoldier];
        const alien = aliens[alienIndex];

        if (!soldier || !soldier.alive || !alien || !alien.alive) return;

        // Check for panic
        if (soldier.panicked) {
            this.showMessage(soldier.name + ' is panicked and cannot act!');
            return;
        }

        const weapon = soldier.weapon;
        const shot = weapon[shotType];

        if (!shot) {
            this.showMessage('Weapon cannot use ' + shotType + ' shot!');
            return;
        }

        const tuCost = Math.ceil(soldier.maxTu * shot.tuPercent / 100);
        if (soldier.currentTu < tuCost) {
            this.showMessage('Not enough TU! Need ' + tuCost);
            return;
        }

        // Check ammo
        const rounds = shot.rounds || 1;
        if (weapon.ammo < rounds) {
            this.showMessage('Out of ammo! Press R to reload.');
            return;
        }

        soldier.currentTu -= tuCost;
        weapon.ammo -= rounds;

        // Calculate hit chance
        const distance = Math.abs(alien.x - soldier.x) + Math.abs(alien.y - soldier.y);
        let hitChance = soldier.firingAccuracy * (shot.accuracy / 100);

        // Modifiers
        if (soldier.stance === 'kneeling') hitChance *= 1.15;
        if (distance > 10) hitChance -= (distance - 10) * 2;
        hitChance = Math.max(5, Math.min(95, hitChance));

        // Fire
        let hits = 0;

        for (let r = 0; r < rounds; r++) {
            if (Math.random() * 100 < hitChance) {
                hits++;
                const damage = weapon.damage * (0.5 + Math.random() * 1.5);
                const actualDamage = Math.max(0, damage - alien.armor);
                alien.currentHealth -= actualDamage;

                // Screen shake on hit
                this.screenShake(3, 50);

                if (alien.currentHealth <= 0) {
                    alien.alive = false;
                    this.alienSprites[alienIndex].sprite.setVisible(false);
                    this.alienSprites[alienIndex].hpBg.setVisible(false);
                    this.alienSprites[alienIndex].hpBar.setVisible(false);
                    this.showMessage(alien.name + ' eliminated!');
                    this.screenShake(5, 100);
                    break;
                }
            }
        }

        if (hits > 0) {
            this.showMessage(hits + ' hit(s)! ' + (rounds > 1 ? '(' + rounds + ' fired)' : ''));
            // Flash alien
            const as = this.alienSprites[alienIndex];
            as.sprite.setFillStyle(0xffffff);
            this.time.delayedCall(100, () => {
                if (alien.alive) as.sprite.setFillStyle(ALIEN_TYPES[alien.type].color);
            });
        } else {
            this.showMessage('Missed! (' + rounds + ' fired)');
        }

        // Update alien HP bar
        this.updateAlienSprites();
        this.updateUI();
        this.checkVictory();
    }

    toggleCrouch() {
        const soldier = soldiers[selectedSoldier];
        if (!soldier || !soldier.alive) return;

        const cost = soldier.stance === 'standing' ? 4 : 8;
        if (soldier.currentTu < cost) {
            this.showMessage('Not enough TU!');
            return;
        }

        soldier.currentTu -= cost;
        soldier.stance = soldier.stance === 'standing' ? 'kneeling' : 'standing';

        // Visual indication
        const ss = this.soldierSprites[selectedSoldier];
        if (soldier.stance === 'kneeling') {
            ss.sprite.setSize(24, 16);
        } else {
            ss.sprite.setSize(24, 24);
        }

        this.showMessage(soldier.stance === 'kneeling' ? 'Crouching (+15% accuracy)' : 'Standing');
        this.updateUI();
    }

    selectNextSoldier() {
        if (soldiers.filter(s => s.alive).length === 0) return;

        let next = (selectedSoldier + 1) % soldiers.length;
        while (!soldiers[next].alive && next !== selectedSoldier) {
            next = (next + 1) % soldiers.length;
        }
        selectedSoldier = next;
        this.highlightSelectedSoldier();
        this.updateUI();
    }

    highlightSelectedSoldier() {
        this.soldierSprites.forEach((ss, i) => {
            if (i === selectedSoldier && soldiers[i].alive) {
                ss.sprite.setStrokeStyle(3, 0xffff44);
            } else {
                ss.sprite.setStrokeStyle(2, 0x88aaff);
            }
        });
    }

    checkReactionFire(movingSoldier, tuSpent) {
        aliens.forEach((alien, i) => {
            if (!alien.alive || !alien.visible) return;

            // Check if alien can see the soldier
            if (this.hasLineOfSight(alien, movingSoldier)) {
                const reactionCheck = (alien.reactions * alien.currentTu) > (movingSoldier.reactions * tuSpent);

                if (reactionCheck && Math.random() < 0.4) {
                    // Alien takes reaction shot
                    const hitChance = alien.accuracy * 0.6; // Snap shot accuracy
                    if (Math.random() * 100 < hitChance) {
                        const damage = alien.damage * (0.5 + Math.random() * 1.5);
                        movingSoldier.currentHealth -= damage;
                        this.showMessage('Reaction fire! ' + movingSoldier.name + ' hit for ' + Math.floor(damage));

                        // Flash soldier
                        const ss = this.soldierSprites[soldiers.indexOf(movingSoldier)];
                        ss.sprite.setFillStyle(0xff4444);
                        this.time.delayedCall(200, () => {
                            ss.sprite.setFillStyle(0x4488ff);
                        });

                        if (movingSoldier.currentHealth <= 0) {
                            movingSoldier.alive = false;
                            ss.sprite.setVisible(false);
                            ss.hpBg.setVisible(false);
                            ss.hpBar.setVisible(false);
                            ss.tuBg.setVisible(false);
                            ss.tuBar.setVisible(false);
                            this.showMessage(movingSoldier.name + ' KIA!');
                            this.selectNextSoldier();
                            this.checkDefeat();
                        }
                    } else {
                        this.showMessage('Reaction fire missed!');
                    }

                    alien.currentTu -= Math.floor(alien.maxTu * 0.25);
                }
            }
        });

        this.updateSoldierSprites();
    }

    hasLineOfSight(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));

        for (let i = 1; i < steps; i++) {
            const x = Math.round(from.x + (dx * i / steps));
            const y = Math.round(from.y + (dy * i / steps));

            if (mapData[y]?.[x]?.cover === 'full') {
                return false;
            }
        }
        return true;
    }

    endPlayerTurn() {
        if (currentTurn !== 'player') return;

        currentTurn = 'alien';
        turnNumber++;
        this.turnText.setText('TURN ' + turnNumber + ' - ALIEN PHASE');
        this.showMessage('Alien turn...');

        // Reset alien TU
        aliens.forEach(alien => {
            if (alien.alive) {
                alien.currentTu = alien.maxTu;
            }
        });

        // Alien AI turn
        this.time.delayedCall(500, () => this.processAlienTurn());
    }

    processAlienTurn() {
        let delay = 0;

        aliens.forEach((alien, i) => {
            if (!alien.alive) return;

            this.time.delayedCall(delay, () => {
                this.alienAction(alien, i);
            });
            delay += 800;
        });

        this.time.delayedCall(delay + 500, () => {
            this.startPlayerTurn();
        });
    }

    alienAction(alien, alienIndex) {
        // Find nearest visible soldier
        let nearestSoldier = null;
        let nearestDist = Infinity;

        soldiers.forEach(soldier => {
            if (!soldier.alive) return;

            const dist = Math.abs(alien.x - soldier.x) + Math.abs(alien.y - soldier.y);
            if (this.hasLineOfSight(alien, soldier) && dist < nearestDist) {
                nearestDist = dist;
                nearestSoldier = soldier;
            }
        });

        if (nearestSoldier) {
            // Try to shoot
            if (nearestDist <= 15 && alien.currentTu >= Math.floor(alien.maxTu * 0.3)) {
                const hitChance = alien.accuracy * 0.8;

                if (Math.random() * 100 < hitChance) {
                    const damage = alien.damage * (0.5 + Math.random() * 1.5);
                    nearestSoldier.currentHealth -= damage;
                    this.showMessage(alien.name + ' shoots ' + nearestSoldier.name + ' for ' + Math.floor(damage));

                    // Flash
                    const si = soldiers.indexOf(nearestSoldier);
                    const ss = this.soldierSprites[si];
                    ss.sprite.setFillStyle(0xff4444);
                    this.time.delayedCall(200, () => {
                        if (nearestSoldier.alive) ss.sprite.setFillStyle(0x4488ff);
                    });

                    if (nearestSoldier.currentHealth <= 0) {
                        nearestSoldier.alive = false;
                        ss.sprite.setVisible(false);
                        ss.hpBg.setVisible(false);
                        ss.hpBar.setVisible(false);
                        ss.tuBg.setVisible(false);
                        ss.tuBar.setVisible(false);
                        this.showMessage(nearestSoldier.name + ' KIA!');
                    }

                    this.updateSoldierSprites();
                    this.checkDefeat();
                } else {
                    this.showMessage(alien.name + ' misses!');
                }

                alien.currentTu -= Math.floor(alien.maxTu * 0.3);
            }
            // Move toward soldier
            else if (alien.currentTu >= 8) {
                const dx = nearestSoldier.x - alien.x;
                const dy = nearestSoldier.y - alien.y;

                let nx = alien.x + (dx > 0 ? 1 : dx < 0 ? -1 : 0);
                let ny = alien.y + (dy > 0 ? 1 : dy < 0 ? -1 : 0);

                if (mapData[ny]?.[nx]?.walkable &&
                    !soldiers.some(s => s.alive && s.x === nx && s.y === ny) &&
                    !aliens.some(a => a.alive && a !== alien && a.x === nx && a.y === ny)) {

                    alien.x = nx;
                    alien.y = ny;
                    alien.currentTu -= 4;

                    const as = this.alienSprites[alienIndex];
                    const px = nx * TILE_SIZE + TILE_SIZE / 2;
                    const py = ny * TILE_SIZE + TILE_SIZE / 2 + 60;
                    as.sprite.setPosition(px, py);
                    as.hpBg.setPosition(px, py - 18);
                    as.hpBar.setPosition(px, py - 18);
                }
            }
        } else {
            // Patrol randomly
            if (alien.currentTu >= 8) {
                const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
                const dir = directions[Math.floor(Math.random() * directions.length)];
                const nx = alien.x + dir[0];
                const ny = alien.y + dir[1];

                if (mapData[ny]?.[nx]?.walkable &&
                    !soldiers.some(s => s.alive && s.x === nx && s.y === ny) &&
                    !aliens.some(a => a.alive && a !== alien && a.x === nx && a.y === ny)) {

                    alien.x = nx;
                    alien.y = ny;
                    alien.currentTu -= 4;

                    const as = this.alienSprites[alienIndex];
                    const px = nx * TILE_SIZE + TILE_SIZE / 2;
                    const py = ny * TILE_SIZE + TILE_SIZE / 2 + 60;
                    as.sprite.setPosition(px, py);
                    as.hpBg.setPosition(px, py - 18);
                    as.hpBar.setPosition(px, py - 18);
                }
            }
        }

        this.updateVisibility();
    }

    startPlayerTurn() {
        currentTurn = 'player';
        this.turnText.setText('TURN ' + turnNumber + ' - PLAYER PHASE');
        this.showMessage('Your turn');

        // Reset soldier TU
        soldiers.forEach(soldier => {
            if (soldier.alive) {
                soldier.currentTu = soldier.maxTu;
            }
        });

        // Make sure we have a valid selection
        if (!soldiers[selectedSoldier]?.alive) {
            this.selectNextSoldier();
        }

        this.updateUI();
        this.updateSoldierSprites();
    }

    updateVisibility() {
        // Reset fog
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                this.fogTiles[y][x].setAlpha(0.8);
            }
        }

        // Reveal tiles around each soldier
        soldiers.forEach(soldier => {
            if (!soldier.alive) return;

            for (let y = 0; y < MAP_HEIGHT; y++) {
                for (let x = 0; x < MAP_WIDTH; x++) {
                    const dist = Math.abs(x - soldier.x) + Math.abs(y - soldier.y);
                    if (dist <= 10 && this.hasLineOfSight(soldier, { x, y })) {
                        this.fogTiles[y][x].setAlpha(0);
                    }
                }
            }
        });

        // Update alien visibility
        aliens.forEach((alien, i) => {
            const wasVisible = alien.visible;
            alien.visible = false;

            soldiers.forEach(soldier => {
                if (!soldier.alive) return;
                const dist = Math.abs(alien.x - soldier.x) + Math.abs(alien.y - soldier.y);
                if (dist <= 10 && this.hasLineOfSight(soldier, alien)) {
                    alien.visible = true;
                }
            });

            this.alienSprites[i].sprite.setVisible(alien.visible && alien.alive);
            this.alienSprites[i].hpBg.setVisible(alien.visible && alien.alive);
            this.alienSprites[i].hpBar.setVisible(alien.visible && alien.alive);

            if (alien.visible && !wasVisible && alien.alive) {
                this.showMessage('Alien spotted!');
            }
        });
    }

    updateSoldierSprites() {
        soldiers.forEach((soldier, i) => {
            if (!soldier.alive) return;
            const ss = this.soldierSprites[i];
            const hpPercent = soldier.currentHealth / soldier.maxHealth;
            const tuPercent = soldier.currentTu / soldier.maxTu;

            ss.hpBar.setSize(24 * hpPercent, 2);
            ss.tuBar.setSize(24 * tuPercent, 2);
        });
    }

    updateAlienSprites() {
        aliens.forEach((alien, i) => {
            if (!alien.alive || !alien.visible) return;
            const as = this.alienSprites[i];
            const hpPercent = alien.currentHealth / alien.maxHealth;
            as.hpBar.setSize(24 * hpPercent, 2);
        });
    }

    updateUI() {
        const soldier = soldiers[selectedSoldier];

        if (soldier && soldier.alive) {
            const panicStr = soldier.panicked ? ' [PANIC!]' : '';
            this.soldierText.setText(soldier.name + ' [' + soldier.stance.toUpperCase() + ']' + panicStr);
            this.tuText.setText('TU: ' + soldier.currentTu + '/' + soldier.maxTu + '  Morale: ' + soldier.morale);
            this.healthText.setText('HP: ' + Math.ceil(soldier.currentHealth) + '/' + soldier.maxHealth);
            this.weaponText.setText(soldier.weapon.name + ' [' + soldier.weapon.ammo + '/' + soldier.weapon.maxAmmo + '] Grenades: ' + soldier.grenades);
        } else {
            this.soldierText.setText('No soldier selected');
            this.tuText.setText('');
            this.healthText.setText('');
            this.weaponText.setText('');
        }

        this.shotTypeText.setText(this.grenadeMode ? 'MODE: GRENADE' : 'SHOT: ' + shotType.toUpperCase());

        // Highlight active shot button
        this.actionButtons.forEach((btn) => {
            if (['SNAP', 'AIMED', 'AUTO'].includes(btn.btnData.label)) {
                if (btn.btnData.label === shotType.toUpperCase() && !this.grenadeMode) {
                    btn.bg.setStrokeStyle(2, 0xffff44);
                } else {
                    btn.bg.setStrokeStyle(2, 0x4a4a6a);
                }
            }
            if (btn.btnData.label === 'GREN' && this.grenadeMode) {
                btn.bg.setStrokeStyle(2, 0xff8844);
            }
        });

        this.updateSoldierSprites();
    }

    showMessage(text) {
        this.messageText.setText(text);
        this.time.delayedCall(3000, () => {
            if (this.messageText.text === text) {
                this.messageText.setText('');
            }
        });
    }

    checkVictory() {
        if (aliens.filter(a => a.alive).length === 0) {
            this.victory();
        }
    }

    checkDefeat() {
        if (soldiers.filter(s => s.alive).length === 0) {
            this.defeat();
        }
    }

    victory() {
        gameState = 'victory';
        gamePaused = true;

        this.add.rectangle(400, 350, 400, 200, 0x000000, 0.9).setDepth(300);
        this.add.text(400, 300, 'MISSION COMPLETE', {
            fontSize: '32px',
            fill: '#44ff44',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(301);

        const survived = soldiers.filter(s => s.alive).length;
        this.add.text(400, 350, 'Soldiers survived: ' + survived + '/' + soldiers.length, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(301);

        const again = this.add.text(400, 410, '[ NEW MISSION ]', {
            fontSize: '20px',
            fill: '#44ff44',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(301).setInteractive();

        again.on('pointerdown', () => this.scene.start('MenuScene'));
    }

    defeat() {
        gameState = 'gameover';
        gamePaused = true;

        this.add.rectangle(400, 350, 400, 200, 0x000000, 0.9).setDepth(300);
        this.add.text(400, 300, 'MISSION FAILED', {
            fontSize: '32px',
            fill: '#ff4444',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(301);

        this.add.text(400, 350, 'All soldiers eliminated', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(301);

        const again = this.add.text(400, 410, '[ RETRY ]', {
            fontSize: '20px',
            fill: '#ff4444',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(301).setInteractive();

        again.on('pointerdown', () => this.scene.start('MenuScene'));
    }

    update() {
        // Nothing needed in update for turn-based
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0a0a14',
    scene: [BootScene, MenuScene, GameScene]
};

const game = new Phaser.Game(config);

// Harness interface
window.harness = {
    pause: () => {
        gamePaused = true;
    },

    resume: () => {
        gamePaused = false;
    },

    isPaused: () => gamePaused,

    execute: async (action, durationMs) => {
        gamePaused = false;

        const scene = game.scene.getScene('GameScene');
        if (!scene) {
            await new Promise(r => setTimeout(r, durationMs));
            gamePaused = true;
            return;
        }

        // Handle actions
        if (action.type === 'click') {
            const pointer = { x: action.x, y: action.y };
            scene.handleClick(pointer);
        } else if (action.type === 'key') {
            switch (action.key) {
                case '1': shotType = 'snap'; break;
                case '2': shotType = 'aimed'; break;
                case '3': shotType = 'auto'; break;
                case 'c': scene.toggleCrouch(); break;
                case 'Tab': scene.selectNextSoldier(); break;
                case 'Enter': scene.endPlayerTurn(); break;
            }
            scene.updateUI();
        }

        await new Promise(r => setTimeout(r, durationMs));
        gamePaused = true;
    },

    getState: () => {
        const aliveSoldiers = soldiers.filter(s => s.alive).map(s => ({
            name: s.name,
            x: s.x,
            y: s.y,
            health: s.currentHealth,
            maxHealth: s.maxHealth,
            tu: s.currentTu,
            maxTu: s.maxTu,
            stance: s.stance
        }));

        const visibleAliens = aliens.filter(a => a.alive && a.visible).map(a => ({
            type: a.type,
            x: a.x,
            y: a.y,
            health: a.currentHealth,
            maxHealth: a.maxHealth
        }));

        const selected = selectedSoldier !== null && soldiers[selectedSoldier]?.alive ?
            soldiers[selectedSoldier].name : null;

        return {
            gameState,
            currentTurn,
            turnNumber,
            shotType,
            selectedSoldier: selected,
            soldiers: aliveSoldiers,
            soldiersAlive: aliveSoldiers.length,
            soldiersTotal: soldiers.length,
            visibleAliens,
            aliensRemaining: aliens.filter(a => a.alive).length
        };
    },

    getPhase: () => {
        if (gameState === 'menu') return 'menu';
        if (gameState === 'victory') return 'victory';
        if (gameState === 'gameover') return 'gameover';
        return 'playing';
    },

    debug: {
        setHealth: (soldierIndex, hp) => {
            if (soldiers[soldierIndex]) {
                soldiers[soldierIndex].currentHealth = hp;
            }
        },
        setTu: (soldierIndex, tu) => {
            if (soldiers[soldierIndex]) {
                soldiers[soldierIndex].currentTu = tu;
            }
        },
        killAlien: (alienIndex) => {
            if (aliens[alienIndex]) {
                aliens[alienIndex].alive = false;
                aliens[alienIndex].visible = false;
            }
        },
        forceStart: () => {
            gameState = 'playing';
            gamePaused = false;
            const menuScene = game.scene.getScene('MenuScene');
            if (menuScene && menuScene.scene.isActive()) {
                menuScene.scene.start('GameScene');
            }
        },
        clearAliens: () => {
            aliens.forEach((a, i) => {
                a.alive = false;
                a.visible = false;
                if (gameScene?.alienSprites?.[i]) {
                    gameScene.alienSprites[i].sprite.setVisible(false);
                    gameScene.alienSprites[i].hpBg.setVisible(false);
                    gameScene.alienSprites[i].hpBar.setVisible(false);
                }
            });
        },
        revealAllAliens: () => {
            aliens.forEach(a => {
                if (a.alive) a.visible = true;
            });
            if (gameScene) gameScene.updateVisibility();
        },
        selectSoldier: (index) => {
            if (soldiers[index]?.alive) {
                selectedSoldier = index;
                if (gameScene) {
                    gameScene.highlightSelectedSoldier();
                    gameScene.updateUI();
                }
            }
        },
        endTurn: () => {
            if (gameScene) gameScene.endPlayerTurn();
        }
    }
};
