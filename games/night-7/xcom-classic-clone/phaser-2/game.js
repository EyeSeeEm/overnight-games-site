// X-COM: Tactical - Turn-based tactical combat
// Inspired by UFO: Enemy Unknown (1994)

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Tile textures (32x32)
        const TILE = 32;

        // Ground tile
        g.fillStyle(0x3a5a3a);
        g.fillRect(0, 0, TILE, TILE);
        g.lineStyle(1, 0x2a4a2a);
        g.strokeRect(0, 0, TILE, TILE);
        g.generateTexture('tile_ground', TILE, TILE);
        g.clear();

        // Wall tile
        g.fillStyle(0x666666);
        g.fillRect(0, 0, TILE, TILE);
        g.fillStyle(0x555555);
        g.fillRect(4, 4, TILE-8, TILE-8);
        g.generateTexture('tile_wall', TILE, TILE);
        g.clear();

        // UFO floor tile
        g.fillStyle(0x445566);
        g.fillRect(0, 0, TILE, TILE);
        g.lineStyle(1, 0x556677);
        g.strokeRect(0, 0, TILE, TILE);
        g.generateTexture('tile_ufo', TILE, TILE);
        g.clear();

        // Fog tile
        g.fillStyle(0x000000);
        g.fillRect(0, 0, TILE, TILE);
        g.generateTexture('tile_fog', TILE, TILE);
        g.clear();

        // Partial fog
        g.fillStyle(0x000000, 0.5);
        g.fillRect(0, 0, TILE, TILE);
        g.generateTexture('tile_fog_partial', TILE, TILE);
        g.clear();

        // Rubble/debris
        g.fillStyle(0x4a4a3a);
        g.fillRect(0, 0, TILE, TILE);
        g.fillStyle(0x5a5a4a);
        g.fillRect(4, 8, 8, 6);
        g.fillRect(18, 12, 10, 8);
        g.fillRect(8, 20, 12, 6);
        g.generateTexture('tile_rubble', TILE, TILE);
        g.clear();

        // Cover/bush
        g.fillStyle(0x3a5a3a);
        g.fillRect(0, 0, TILE, TILE);
        g.fillStyle(0x2a6a2a);
        g.fillCircle(16, 16, 12);
        g.fillStyle(0x3a7a3a);
        g.fillCircle(12, 12, 6);
        g.fillCircle(20, 18, 6);
        g.generateTexture('tile_bush', TILE, TILE);
        g.clear();

        // Soldier sprite (side view)
        g.fillStyle(0x4488ff);
        g.fillRect(8, 4, 16, 20); // Body
        g.fillStyle(0xffcc99);
        g.fillCircle(16, 6, 5); // Head
        g.fillStyle(0x2266cc);
        g.fillRect(6, 10, 4, 10); // Left arm
        g.fillRect(22, 10, 4, 10); // Right arm
        g.fillRect(10, 24, 5, 8); // Left leg
        g.fillRect(17, 24, 5, 8); // Right leg
        g.generateTexture('soldier', TILE, TILE);
        g.clear();

        // Soldier selected highlight
        g.lineStyle(3, 0x00ff00);
        g.strokeCircle(16, 16, 14);
        g.generateTexture('selection', TILE, TILE);
        g.clear();

        // Sectoid (grey alien)
        g.fillStyle(0x888888);
        g.fillRect(10, 8, 12, 16); // Body
        g.fillStyle(0xaaaaaa);
        g.fillEllipse(16, 8, 14, 10); // Big head
        g.fillStyle(0x000000);
        g.fillEllipse(12, 8, 4, 3); // Left eye
        g.fillEllipse(20, 8, 4, 3); // Right eye
        g.fillStyle(0x666666);
        g.fillRect(8, 14, 4, 8); // Arms
        g.fillRect(20, 14, 4, 8);
        g.fillRect(11, 24, 4, 6); // Legs
        g.fillRect(17, 24, 4, 6);
        g.generateTexture('sectoid', TILE, TILE);
        g.clear();

        // Floater (flying alien)
        g.fillStyle(0x996633);
        g.fillRect(10, 6, 12, 14); // Body
        g.fillStyle(0xcc9966);
        g.fillCircle(16, 6, 6); // Head
        g.fillStyle(0x444444);
        g.fillEllipse(16, 24, 14, 6); // Hover device
        g.fillStyle(0x00ffff);
        g.fillCircle(16, 24, 3); // Glow
        g.generateTexture('floater', TILE, TILE);
        g.clear();

        // Snakeman
        g.fillStyle(0x44aa44);
        g.fillRect(12, 4, 8, 12); // Upper body
        g.fillStyle(0x55bb55);
        g.fillCircle(16, 6, 5); // Head
        g.fillStyle(0xff0000);
        g.fillRect(14, 5, 4, 2); // Eyes
        g.fillStyle(0x338833);
        // Snake body curves
        g.fillRect(8, 16, 16, 6);
        g.fillRect(4, 22, 12, 5);
        g.fillRect(12, 27, 12, 4);
        g.generateTexture('snakeman', TILE, TILE);
        g.clear();

        // Bullet
        g.fillStyle(0xffff00);
        g.fillCircle(4, 4, 3);
        g.generateTexture('bullet', 8, 8);
        g.clear();

        // Explosion
        g.fillStyle(0xff6600);
        g.fillCircle(24, 24, 20);
        g.fillStyle(0xffaa00);
        g.fillCircle(24, 24, 14);
        g.fillStyle(0xffff00);
        g.fillCircle(24, 24, 8);
        g.generateTexture('explosion', 48, 48);
        g.clear();

        // Move indicator
        g.fillStyle(0x00ff00, 0.5);
        g.fillRect(0, 0, TILE, TILE);
        g.lineStyle(2, 0x00ff00);
        g.strokeRect(0, 0, TILE, TILE);
        g.generateTexture('move_tile', TILE, TILE);
        g.clear();

        // Attack indicator
        g.fillStyle(0xff0000, 0.5);
        g.fillRect(0, 0, TILE, TILE);
        g.lineStyle(2, 0xff0000);
        g.strokeRect(0, 0, TILE, TILE);
        g.generateTexture('attack_tile', TILE, TILE);
        g.clear();

        // UI Panel background
        g.fillStyle(0x1a1a2a);
        g.fillRect(0, 0, 800, 100);
        g.lineStyle(2, 0x3a3a5a);
        g.strokeRect(0, 0, 800, 100);
        g.generateTexture('ui_panel', 800, 100);
        g.clear();

        // Health bar background
        g.fillStyle(0x330000);
        g.fillRect(0, 0, 30, 4);
        g.generateTexture('health_bg', 30, 4);
        g.clear();

        // Health bar fill
        g.fillStyle(0x00ff00);
        g.fillRect(0, 0, 30, 4);
        g.generateTexture('health_fill', 30, 4);
        g.clear();

        // TU bar fill
        g.fillStyle(0x00aaff);
        g.fillRect(0, 0, 30, 4);
        g.generateTexture('tu_fill', 30, 4);
        g.clear();

        g.destroy();

        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const cx = 400, cy = 300;

        // Background
        this.add.rectangle(cx, cy, 800, 600, 0x0a0a12);

        // Title
        this.add.text(cx, 120, 'X-COM: TACTICAL', {
            fontSize: '48px',
            fill: '#00aaff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(cx, 180, 'UFO Crash Recovery', {
            fontSize: '24px',
            fill: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // Instructions
        const instructions = [
            'MISSION BRIEFING:',
            '',
            'A UFO has crashed. Eliminate all alien hostiles.',
            '',
            'CONTROLS:',
            'Click soldier to select',
            'Click green tiles to move (costs TU)',
            'Click red tiles/aliens to attack',
            'END TURN when all soldiers done',
            '',
            'TU = Time Units - All actions cost TU',
            'Soldiers with remaining TU may reaction fire',
            '',
            'ENEMIES: Sectoid, Floater, Snakeman'
        ];

        instructions.forEach((line, i) => {
            this.add.text(cx, 240 + i * 20, line, {
                fontSize: '14px',
                fill: line === 'MISSION BRIEFING:' || line === 'CONTROLS:' ? '#00ff00' : '#aaaaaa',
                fontFamily: 'monospace'
            }).setOrigin(0.5);
        });

        // Start button
        const startBtn = this.add.rectangle(cx, 520, 200, 50, 0x006600)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => startBtn.setFillStyle(0x008800))
            .on('pointerout', () => startBtn.setFillStyle(0x006600))
            .on('pointerdown', () => this.scene.start('GameScene'));

        this.add.text(cx, 520, 'BEGIN MISSION', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.TILE = 32;
        this.MAP_WIDTH = 25;
        this.MAP_HEIGHT = 16;

        // Game state
        this.turn = 'player';
        this.turnNumber = 1;
        this.selectedSoldier = null;
        this.soldiers = [];
        this.aliens = [];
        this.moveIndicators = [];
        this.attackIndicators = [];
        this.fogTiles = [];

        // Create map
        this.createMap();

        // Create units
        this.createSoldiers();
        this.createAliens();

        // Create fog of war
        this.createFogOfWar();
        this.updateFogOfWar();

        // UI
        this.createUI();

        // Input
        this.input.on('pointerdown', this.handleClick, this);

        // Message display
        this.messageText = this.add.text(400, 300, '', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            backgroundColor: '#000000aa',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(200).setVisible(false);
    }

    createMap() {
        this.map = [];
        this.tileSprites = [];

        // 0 = ground, 1 = wall, 2 = UFO floor, 3 = rubble, 4 = bush/cover
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            this.map[y] = [];
            this.tileSprites[y] = [];
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                this.map[y][x] = 0; // Default ground
            }
        }

        // Create UFO crash site (center of map)
        const ufoX = 12, ufoY = 7;

        // UFO main body
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist <= 4) {
                    this.map[ufoY + dy][ufoX + dx] = 2; // UFO floor
                }
            }
        }

        // UFO walls (edges)
        this.map[ufoY - 2][ufoX - 2] = 1;
        this.map[ufoY - 2][ufoX + 2] = 1;
        this.map[ufoY + 2][ufoX - 2] = 1;
        this.map[ufoY + 2][ufoX + 2] = 1;

        // Rubble around crash
        const rubblePositions = [
            [ufoX - 4, ufoY - 1], [ufoX - 4, ufoY], [ufoX - 4, ufoY + 1],
            [ufoX + 4, ufoY - 1], [ufoX + 4, ufoY], [ufoX + 4, ufoY + 1],
            [ufoX - 2, ufoY - 3], [ufoX, ufoY - 3], [ufoX + 2, ufoY - 3],
            [ufoX - 2, ufoY + 3], [ufoX, ufoY + 3], [ufoX + 2, ufoY + 3]
        ];
        rubblePositions.forEach(([rx, ry]) => {
            if (rx >= 0 && rx < this.MAP_WIDTH && ry >= 0 && ry < this.MAP_HEIGHT) {
                this.map[ry][rx] = 3;
            }
        });

        // Scatter some bushes/cover
        const bushPositions = [
            [3, 3], [5, 8], [2, 12], [7, 5], [8, 13],
            [20, 4], [22, 9], [19, 13], [21, 2], [18, 11]
        ];
        bushPositions.forEach(([bx, by]) => {
            this.map[by][bx] = 4;
        });

        // Some random walls (buildings)
        // Left building
        for (let y = 2; y <= 5; y++) {
            this.map[y][1] = 1;
            this.map[y][4] = 1;
        }
        for (let x = 1; x <= 4; x++) {
            this.map[2][x] = 1;
            this.map[5][x] = 1;
        }
        this.map[3][4] = 0; // Door

        // Right building
        for (let y = 10; y <= 13; y++) {
            this.map[y][21] = 1;
            this.map[y][24] = 1;
        }
        for (let x = 21; x <= 24; x++) {
            this.map[10][x] = 1;
            this.map[13][x] = 1;
        }
        this.map[11][21] = 0; // Door

        // Render tiles
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                const tileType = this.map[y][x];
                let texture = 'tile_ground';
                if (tileType === 1) texture = 'tile_wall';
                else if (tileType === 2) texture = 'tile_ufo';
                else if (tileType === 3) texture = 'tile_rubble';
                else if (tileType === 4) texture = 'tile_bush';

                const sprite = this.add.image(x * this.TILE + this.TILE/2, y * this.TILE + this.TILE/2, texture);
                this.tileSprites[y][x] = sprite;
            }
        }
    }

    createSoldiers() {
        const soldierData = [
            { name: 'Cpl. Miller', tu: 58, hp: 35, accuracy: 55, reactions: 45 },
            { name: 'Pvt. Chen', tu: 52, hp: 30, accuracy: 48, reactions: 52 },
            { name: 'Sgt. Volkov', tu: 65, hp: 40, accuracy: 62, reactions: 38 },
            { name: 'Pvt. Santos', tu: 50, hp: 32, accuracy: 45, reactions: 58 }
        ];

        const startPositions = [[2, 14], [3, 14], [4, 14], [5, 14]];

        soldierData.forEach((data, i) => {
            const pos = startPositions[i];
            const soldier = {
                ...data,
                x: pos[0],
                y: pos[1],
                maxTu: data.tu,
                currentTu: data.tu,
                maxHp: data.hp,
                currentHp: data.hp,
                weapon: { name: 'Rifle', damage: 30, snapCost: 25, snapAccuracy: 60, range: 15 },
                alive: true,
                sprite: null,
                selectionSprite: null,
                healthBar: null,
                tuBar: null
            };

            soldier.sprite = this.add.image(
                pos[0] * this.TILE + this.TILE/2,
                pos[1] * this.TILE + this.TILE/2,
                'soldier'
            ).setDepth(10).setInteractive();

            soldier.selectionSprite = this.add.image(
                pos[0] * this.TILE + this.TILE/2,
                pos[1] * this.TILE + this.TILE/2,
                'selection'
            ).setDepth(9).setVisible(false);

            // Health bar
            soldier.healthBg = this.add.image(
                pos[0] * this.TILE + this.TILE/2,
                pos[1] * this.TILE - 4,
                'health_bg'
            ).setDepth(15);

            soldier.healthBar = this.add.image(
                pos[0] * this.TILE + this.TILE/2 - 15,
                pos[1] * this.TILE - 4,
                'health_fill'
            ).setDepth(16).setOrigin(0, 0.5);

            // TU bar
            soldier.tuBg = this.add.image(
                pos[0] * this.TILE + this.TILE/2,
                pos[1] * this.TILE + this.TILE + 2,
                'health_bg'
            ).setDepth(15);

            soldier.tuBar = this.add.image(
                pos[0] * this.TILE + this.TILE/2 - 15,
                pos[1] * this.TILE + this.TILE + 2,
                'tu_fill'
            ).setDepth(16).setOrigin(0, 0.5);

            this.soldiers.push(soldier);
        });
    }

    createAliens() {
        const alienTypes = [
            { type: 'sectoid', hp: 30, tu: 54, accuracy: 50, reactions: 63, damage: 35 },
            { type: 'floater', hp: 40, tu: 55, accuracy: 45, reactions: 55, damage: 40 },
            { type: 'snakeman', hp: 50, tu: 60, accuracy: 55, reactions: 50, damage: 45 }
        ];

        // Place aliens near/in UFO
        const alienPositions = [
            { pos: [12, 7], typeIdx: 0 },  // Sectoid in UFO center
            { pos: [10, 6], typeIdx: 0 },  // Sectoid in UFO
            { pos: [14, 8], typeIdx: 1 },  // Floater near UFO
            { pos: [18, 5], typeIdx: 1 },  // Floater patrolling
            { pos: [11, 9], typeIdx: 2 },  // Snakeman in UFO
            { pos: [22, 11], typeIdx: 0 }  // Sectoid in building
        ];

        alienPositions.forEach((data, i) => {
            const typeData = alienTypes[data.typeIdx];
            const alien = {
                ...typeData,
                x: data.pos[0],
                y: data.pos[1],
                maxTu: typeData.tu,
                currentTu: typeData.tu,
                maxHp: typeData.hp,
                currentHp: typeData.hp,
                alive: true,
                visible: false,
                sprite: null,
                healthBar: null
            };

            alien.sprite = this.add.image(
                data.pos[0] * this.TILE + this.TILE/2,
                data.pos[1] * this.TILE + this.TILE/2,
                typeData.type
            ).setDepth(10).setVisible(false);

            alien.healthBg = this.add.image(
                data.pos[0] * this.TILE + this.TILE/2,
                data.pos[1] * this.TILE - 4,
                'health_bg'
            ).setDepth(15).setVisible(false);

            alien.healthBar = this.add.image(
                data.pos[0] * this.TILE + this.TILE/2 - 15,
                data.pos[1] * this.TILE - 4,
                'health_fill'
            ).setDepth(16).setOrigin(0, 0.5).setVisible(false);
            alien.healthBar.setTint(0xff0000);

            this.aliens.push(alien);
        });
    }

    createFogOfWar() {
        this.fogLayer = [];
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            this.fogLayer[y] = [];
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                const fog = this.add.image(
                    x * this.TILE + this.TILE/2,
                    y * this.TILE + this.TILE/2,
                    'tile_fog'
                ).setDepth(50).setAlpha(1);
                this.fogLayer[y][x] = { sprite: fog, visible: false, explored: false };
            }
        }
    }

    updateFogOfWar() {
        // Reset fog visibility
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                this.fogLayer[y][x].visible = false;
            }
        }

        // Calculate visibility from each soldier
        this.soldiers.forEach(soldier => {
            if (!soldier.alive) return;

            const visionRange = 10;
            for (let dy = -visionRange; dy <= visionRange; dy++) {
                for (let dx = -visionRange; dx <= visionRange; dx++) {
                    const tx = soldier.x + dx;
                    const ty = soldier.y + dy;
                    if (tx < 0 || tx >= this.MAP_WIDTH || ty < 0 || ty >= this.MAP_HEIGHT) continue;

                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist > visionRange) continue;

                    // Check line of sight
                    if (this.hasLineOfSight(soldier.x, soldier.y, tx, ty)) {
                        this.fogLayer[ty][tx].visible = true;
                        this.fogLayer[ty][tx].explored = true;
                    }
                }
            }
        });

        // Update fog sprites
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                const fog = this.fogLayer[y][x];
                if (fog.visible) {
                    fog.sprite.setVisible(false);
                } else if (fog.explored) {
                    fog.sprite.setVisible(true);
                    fog.sprite.setAlpha(0.5);
                } else {
                    fog.sprite.setVisible(true);
                    fog.sprite.setAlpha(1);
                }
            }
        }

        // Update alien visibility
        this.aliens.forEach(alien => {
            if (!alien.alive) return;
            const fog = this.fogLayer[alien.y][alien.x];
            alien.visible = fog.visible;
            alien.sprite.setVisible(alien.visible);
            alien.healthBg.setVisible(alien.visible);
            alien.healthBar.setVisible(alien.visible);
        });
    }

    hasLineOfSight(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        let x = x1, y = y1;

        while (true) {
            if (x === x2 && y === y2) return true;

            // Check if blocked by wall
            if ((x !== x1 || y !== y1) && this.map[y][x] === 1) {
                return false;
            }

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }

    createUI() {
        // Bottom UI panel
        this.uiPanel = this.add.image(400, 550, 'ui_panel').setDepth(100);

        // Soldier info
        this.soldierNameText = this.add.text(20, 510, '', {
            fontSize: '16px',
            fill: '#00aaff',
            fontFamily: 'monospace'
        }).setDepth(101);

        this.soldierStatsText = this.add.text(20, 530, '', {
            fontSize: '14px',
            fill: '#aaaaaa',
            fontFamily: 'monospace'
        }).setDepth(101);

        this.weaponText = this.add.text(20, 560, '', {
            fontSize: '12px',
            fill: '#888888',
            fontFamily: 'monospace'
        }).setDepth(101);

        // Turn indicator
        this.turnText = this.add.text(400, 510, 'PLAYER TURN - Turn 1', {
            fontSize: '18px',
            fill: '#00ff00',
            fontFamily: 'monospace'
        }).setDepth(101).setOrigin(0.5, 0);

        // Action buttons
        this.createActionButtons();

        // Alien counter
        this.alienCountText = this.add.text(700, 510, '', {
            fontSize: '14px',
            fill: '#ff6666',
            fontFamily: 'monospace'
        }).setDepth(101).setOrigin(1, 0);
        this.updateAlienCount();
    }

    createActionButtons() {
        // End Turn button
        this.endTurnBtn = this.add.rectangle(700, 560, 100, 30, 0x666600)
            .setDepth(101)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.endTurnBtn.setFillStyle(0x888800))
            .on('pointerout', () => this.endTurnBtn.setFillStyle(0x666600))
            .on('pointerdown', () => this.endPlayerTurn());

        this.add.text(700, 560, 'END TURN', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setDepth(102).setOrigin(0.5);

        // Attack mode button
        this.attackBtn = this.add.rectangle(580, 560, 80, 30, 0x660000)
            .setDepth(101)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.attackBtn.setFillStyle(0x880000))
            .on('pointerout', () => this.attackBtn.setFillStyle(0x660000))
            .on('pointerdown', () => this.toggleAttackMode());

        this.attackBtnText = this.add.text(580, 560, 'ATTACK', {
            fontSize: '12px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setDepth(102).setOrigin(0.5);

        this.attackMode = false;
    }

    toggleAttackMode() {
        if (!this.selectedSoldier || this.turn !== 'player') return;

        this.attackMode = !this.attackMode;
        this.clearIndicators();

        if (this.attackMode) {
            this.attackBtn.setFillStyle(0xaa0000);
            this.showAttackRange();
        } else {
            this.attackBtn.setFillStyle(0x660000);
            this.showMoveRange();
        }
    }

    handleClick(pointer) {
        if (this.turn !== 'player') return;

        const tx = Math.floor(pointer.x / this.TILE);
        const ty = Math.floor(pointer.y / this.TILE);

        if (ty >= this.MAP_HEIGHT) return; // Clicked on UI

        // Check if clicked on a soldier
        const clickedSoldier = this.soldiers.find(s =>
            s.alive && s.x === tx && s.y === ty
        );

        if (clickedSoldier) {
            this.selectSoldier(clickedSoldier);
            return;
        }

        // Check if clicked on alien (in attack mode)
        if (this.attackMode && this.selectedSoldier) {
            const clickedAlien = this.aliens.find(a =>
                a.alive && a.visible && a.x === tx && a.y === ty
            );

            if (clickedAlien) {
                this.attackAlien(clickedAlien);
                return;
            }
        }

        // Check if clicked on valid move tile
        if (this.selectedSoldier && !this.attackMode) {
            const indicator = this.moveIndicators.find(ind =>
                ind.tx === tx && ind.ty === ty
            );

            if (indicator) {
                this.moveSoldier(tx, ty, indicator.cost);
            }
        }
    }

    selectSoldier(soldier) {
        // Deselect previous
        if (this.selectedSoldier) {
            this.selectedSoldier.selectionSprite.setVisible(false);
        }

        this.selectedSoldier = soldier;
        soldier.selectionSprite.setVisible(true);

        this.attackMode = false;
        this.attackBtn.setFillStyle(0x660000);

        this.clearIndicators();
        this.showMoveRange();
        this.updateSoldierInfo();
    }

    updateSoldierInfo() {
        if (!this.selectedSoldier) {
            this.soldierNameText.setText('');
            this.soldierStatsText.setText('');
            this.weaponText.setText('');
            return;
        }

        const s = this.selectedSoldier;
        this.soldierNameText.setText(s.name);
        this.soldierStatsText.setText(
            `HP: ${s.currentHp}/${s.maxHp}  TU: ${s.currentTu}/${s.maxTu}  Acc: ${s.accuracy}%`
        );
        this.weaponText.setText(
            `${s.weapon.name} | Snap: ${s.weapon.snapCost}% TU, ${s.weapon.snapAccuracy}% Acc`
        );
    }

    showMoveRange() {
        if (!this.selectedSoldier) return;

        const soldier = this.selectedSoldier;
        const maxTiles = Math.floor(soldier.currentTu / 4); // 4 TU per tile

        for (let dy = -maxTiles; dy <= maxTiles; dy++) {
            for (let dx = -maxTiles; dx <= maxTiles; dx++) {
                const tx = soldier.x + dx;
                const ty = soldier.y + dy;

                if (tx < 0 || tx >= this.MAP_WIDTH || ty < 0 || ty >= this.MAP_HEIGHT) continue;
                if (tx === soldier.x && ty === soldier.y) continue;

                // Check if tile is walkable
                const tileType = this.map[ty][tx];
                if (tileType === 1) continue; // Wall

                // Check if occupied
                if (this.soldiers.some(s => s.alive && s.x === tx && s.y === ty)) continue;
                if (this.aliens.some(a => a.alive && a.x === tx && a.y === ty)) continue;

                // Calculate path cost (simple manhattan for now)
                const dist = Math.abs(dx) + Math.abs(dy);
                const cost = dist * 4;

                if (cost <= soldier.currentTu) {
                    const indicator = this.add.image(
                        tx * this.TILE + this.TILE/2,
                        ty * this.TILE + this.TILE/2,
                        'move_tile'
                    ).setDepth(5);

                    indicator.tx = tx;
                    indicator.ty = ty;
                    indicator.cost = cost;
                    this.moveIndicators.push(indicator);
                }
            }
        }
    }

    showAttackRange() {
        if (!this.selectedSoldier) return;

        const soldier = this.selectedSoldier;
        const tuCost = Math.floor(soldier.maxTu * soldier.weapon.snapCost / 100);

        if (soldier.currentTu < tuCost) return; // Not enough TU

        // Show attack indicators on visible aliens
        this.aliens.forEach(alien => {
            if (!alien.alive || !alien.visible) return;

            // Check if in range
            const dist = Math.sqrt(Math.pow(alien.x - soldier.x, 2) + Math.pow(alien.y - soldier.y, 2));
            if (dist > soldier.weapon.range) return;

            // Check line of sight
            if (!this.hasLineOfSight(soldier.x, soldier.y, alien.x, alien.y)) return;

            const indicator = this.add.image(
                alien.x * this.TILE + this.TILE/2,
                alien.y * this.TILE + this.TILE/2,
                'attack_tile'
            ).setDepth(5);

            indicator.alien = alien;
            this.attackIndicators.push(indicator);
        });
    }

    clearIndicators() {
        this.moveIndicators.forEach(ind => ind.destroy());
        this.moveIndicators = [];
        this.attackIndicators.forEach(ind => ind.destroy());
        this.attackIndicators = [];
    }

    moveSoldier(tx, ty, cost) {
        const soldier = this.selectedSoldier;

        // Check reaction fire from visible aliens
        this.checkReactionFire(soldier, tx, ty);

        soldier.x = tx;
        soldier.y = ty;
        soldier.currentTu -= cost;

        // Update sprite position
        soldier.sprite.setPosition(tx * this.TILE + this.TILE/2, ty * this.TILE + this.TILE/2);
        soldier.selectionSprite.setPosition(tx * this.TILE + this.TILE/2, ty * this.TILE + this.TILE/2);
        soldier.healthBg.setPosition(tx * this.TILE + this.TILE/2, ty * this.TILE - 4);
        soldier.healthBar.setPosition(tx * this.TILE + this.TILE/2 - 15, ty * this.TILE - 4);
        soldier.tuBg.setPosition(tx * this.TILE + this.TILE/2, ty * this.TILE + this.TILE + 2);
        soldier.tuBar.setPosition(tx * this.TILE + this.TILE/2 - 15, ty * this.TILE + this.TILE + 2);

        // Update TU bar
        soldier.tuBar.setScale(soldier.currentTu / soldier.maxTu, 1);

        this.updateFogOfWar();
        this.clearIndicators();
        this.showMoveRange();
        this.updateSoldierInfo();

        this.checkVictory();
    }

    checkReactionFire(soldier, tx, ty) {
        this.aliens.forEach(alien => {
            if (!alien.alive || !alien.visible) return;
            if (alien.currentTu < 15) return; // Need TU for reaction

            // Check if alien can see soldier's path
            if (!this.hasLineOfSight(alien.x, alien.y, soldier.x, soldier.y)) return;

            // Reaction check
            const soldierTuSpent = 4; // Moving one tile
            const reactionChance = (alien.reactions * alien.currentTu) / (soldier.reactions * soldierTuSpent + 100);

            if (Math.random() < reactionChance * 0.3) {
                // Alien takes reaction shot
                this.showMessage(`${alien.type.toUpperCase()} reaction fire!`);

                const hitChance = alien.accuracy * 0.5; // Reaction shots less accurate
                if (Math.random() * 100 < hitChance) {
                    const damage = Math.floor(alien.damage * (0.5 + Math.random()));
                    soldier.currentHp -= damage;

                    this.showMessage(`${soldier.name} hit for ${damage}!`);

                    // Update health bar
                    soldier.healthBar.setScale(Math.max(0, soldier.currentHp / soldier.maxHp), 1);

                    if (soldier.currentHp <= 0) {
                        this.killSoldier(soldier);
                    }
                }

                alien.currentTu -= 15;
            }
        });
    }

    attackAlien(alien) {
        const soldier = this.selectedSoldier;
        const tuCost = Math.floor(soldier.maxTu * soldier.weapon.snapCost / 100);

        if (soldier.currentTu < tuCost) {
            this.showMessage('Not enough TU!');
            return;
        }

        soldier.currentTu -= tuCost;
        soldier.tuBar.setScale(soldier.currentTu / soldier.maxTu, 1);

        // Calculate hit chance
        const dist = Math.sqrt(Math.pow(alien.x - soldier.x, 2) + Math.pow(alien.y - soldier.y, 2));
        const rangePenalty = Math.max(0, (dist - 5) * 2);
        const hitChance = (soldier.accuracy * soldier.weapon.snapAccuracy / 100) - rangePenalty;

        // Show bullet
        this.fireBullet(soldier, alien, hitChance);
    }

    fireBullet(soldier, alien, hitChance) {
        const bullet = this.add.image(
            soldier.x * this.TILE + this.TILE/2,
            soldier.y * this.TILE + this.TILE/2,
            'bullet'
        ).setDepth(100);

        this.tweens.add({
            targets: bullet,
            x: alien.x * this.TILE + this.TILE/2,
            y: alien.y * this.TILE + this.TILE/2,
            duration: 200,
            onComplete: () => {
                bullet.destroy();

                if (Math.random() * 100 < hitChance) {
                    // Hit!
                    const damage = Math.floor(soldier.weapon.damage * (0.5 + Math.random()));
                    alien.currentHp -= damage;

                    this.showMessage(`Hit! ${damage} damage`);

                    // Show explosion
                    const exp = this.add.image(
                        alien.x * this.TILE + this.TILE/2,
                        alien.y * this.TILE + this.TILE/2,
                        'explosion'
                    ).setDepth(100).setScale(0.5);

                    this.time.delayedCall(200, () => exp.destroy());

                    // Update health bar
                    alien.healthBar.setScale(Math.max(0, alien.currentHp / alien.maxHp), 1);

                    if (alien.currentHp <= 0) {
                        this.killAlien(alien);
                    }
                } else {
                    this.showMessage('Missed!');
                }

                this.clearIndicators();
                if (this.attackMode) {
                    this.showAttackRange();
                }
                this.updateSoldierInfo();
                this.checkVictory();
            }
        });
    }

    killSoldier(soldier) {
        soldier.alive = false;
        soldier.sprite.setTint(0x666666).setAlpha(0.5);
        soldier.selectionSprite.setVisible(false);
        soldier.healthBg.setVisible(false);
        soldier.healthBar.setVisible(false);
        soldier.tuBg.setVisible(false);
        soldier.tuBar.setVisible(false);

        this.showMessage(`${soldier.name} KIA!`);

        if (this.selectedSoldier === soldier) {
            this.selectedSoldier = null;
            this.clearIndicators();
            this.updateSoldierInfo();
        }

        this.checkGameOver();
    }

    killAlien(alien) {
        alien.alive = false;
        alien.sprite.setTint(0x666666).setAlpha(0.5);
        alien.healthBg.setVisible(false);
        alien.healthBar.setVisible(false);

        this.showMessage(`${alien.type.toUpperCase()} eliminated!`);
        this.updateAlienCount();
    }

    updateAlienCount() {
        const alive = this.aliens.filter(a => a.alive).length;
        const visible = this.aliens.filter(a => a.alive && a.visible).length;
        this.alienCountText.setText(`Aliens: ${visible} visible\n${alive} remaining`);
    }

    showMessage(text) {
        this.messageText.setText(text).setVisible(true);
        this.time.delayedCall(1500, () => {
            this.messageText.setVisible(false);
        });
    }

    endPlayerTurn() {
        if (this.turn !== 'player') return;

        this.turn = 'alien';
        this.turnText.setText('ALIEN TURN').setFill('#ff0000');

        // Clear selection
        if (this.selectedSoldier) {
            this.selectedSoldier.selectionSprite.setVisible(false);
            this.selectedSoldier = null;
        }
        this.clearIndicators();
        this.updateSoldierInfo();

        // Process alien turn
        this.time.delayedCall(500, () => this.processAlienTurn());
    }

    processAlienTurn() {
        // Reset alien TU
        this.aliens.forEach(a => {
            if (a.alive) a.currentTu = a.maxTu;
        });

        let alienIndex = 0;
        const processNextAlien = () => {
            // Find next alive alien
            while (alienIndex < this.aliens.length && !this.aliens[alienIndex].alive) {
                alienIndex++;
            }

            if (alienIndex >= this.aliens.length) {
                this.startPlayerTurn();
                return;
            }

            const alien = this.aliens[alienIndex];
            this.processAlienAction(alien, () => {
                alienIndex++;
                this.time.delayedCall(300, processNextAlien);
            });
        };

        processNextAlien();
    }

    processAlienAction(alien, callback) {
        // Find nearest visible soldier
        let nearestSoldier = null;
        let nearestDist = Infinity;

        this.soldiers.forEach(soldier => {
            if (!soldier.alive) return;

            const dist = Math.sqrt(Math.pow(soldier.x - alien.x, 2) + Math.pow(soldier.y - alien.y, 2));
            if (dist < nearestDist && this.hasLineOfSight(alien.x, alien.y, soldier.x, soldier.y)) {
                nearestDist = dist;
                nearestSoldier = soldier;
            }
        });

        if (nearestSoldier && nearestDist <= 12) {
            // Attack if in range
            if (alien.currentTu >= 15) {
                this.alienAttack(alien, nearestSoldier, callback);
                return;
            }
        } else {
            // Move toward nearest soldier (even if not visible, patrol behavior)
            let targetSoldier = nearestSoldier;
            if (!targetSoldier) {
                // Pick random alive soldier
                const aliveSoldiers = this.soldiers.filter(s => s.alive);
                if (aliveSoldiers.length > 0) {
                    targetSoldier = aliveSoldiers[Math.floor(Math.random() * aliveSoldiers.length)];
                }
            }

            if (targetSoldier && alien.currentTu >= 4) {
                const dx = Math.sign(targetSoldier.x - alien.x);
                const dy = Math.sign(targetSoldier.y - alien.y);

                // Try to move
                let moved = false;
                const tryMove = (mx, my) => {
                    const nx = alien.x + mx;
                    const ny = alien.y + my;

                    if (nx < 0 || nx >= this.MAP_WIDTH || ny < 0 || ny >= this.MAP_HEIGHT) return false;
                    if (this.map[ny][nx] === 1) return false;
                    if (this.soldiers.some(s => s.alive && s.x === nx && s.y === ny)) return false;
                    if (this.aliens.some(a => a.alive && a !== alien && a.x === nx && a.y === ny)) return false;

                    // Check soldier reaction fire
                    this.checkSoldierReaction(alien, nx, ny);

                    if (!alien.alive) {
                        callback();
                        return true;
                    }

                    alien.x = nx;
                    alien.y = ny;
                    alien.currentTu -= 4;

                    alien.sprite.setPosition(nx * this.TILE + this.TILE/2, ny * this.TILE + this.TILE/2);
                    alien.healthBg.setPosition(nx * this.TILE + this.TILE/2, ny * this.TILE - 4);
                    alien.healthBar.setPosition(nx * this.TILE + this.TILE/2 - 15, ny * this.TILE - 4);

                    this.updateFogOfWar();
                    return true;
                };

                // Try diagonal first, then cardinal
                if (!moved && dx !== 0 && dy !== 0) moved = tryMove(dx, dy);
                if (!moved && dx !== 0) moved = tryMove(dx, 0);
                if (!moved && dy !== 0) moved = tryMove(0, dy);

                if (moved && !alien.alive) return;
            }
        }

        callback();
    }

    checkSoldierReaction(alien, nx, ny) {
        this.soldiers.forEach(soldier => {
            if (!soldier.alive) return;
            if (soldier.currentTu < Math.floor(soldier.maxTu * soldier.weapon.snapCost / 100)) return;

            // Check if soldier can see alien
            if (!this.fogLayer[alien.y]?.[alien.x]?.visible) return;
            if (!this.hasLineOfSight(soldier.x, soldier.y, alien.x, alien.y)) return;

            // Reaction check
            const reactionChance = (soldier.reactions * soldier.currentTu) / (alien.reactions * 4 + 100);

            if (Math.random() < reactionChance * 0.25) {
                const tuCost = Math.floor(soldier.maxTu * soldier.weapon.snapCost / 100);
                soldier.currentTu -= tuCost;
                soldier.tuBar.setScale(soldier.currentTu / soldier.maxTu, 1);

                this.showMessage(`${soldier.name} reaction fire!`);

                const hitChance = soldier.accuracy * soldier.weapon.snapAccuracy / 100 * 0.6;
                if (Math.random() * 100 < hitChance) {
                    const damage = Math.floor(soldier.weapon.damage * (0.5 + Math.random()));
                    alien.currentHp -= damage;

                    alien.healthBar.setScale(Math.max(0, alien.currentHp / alien.maxHp), 1);

                    if (alien.currentHp <= 0) {
                        this.killAlien(alien);
                    }
                }
            }
        });
    }

    alienAttack(alien, soldier, callback) {
        alien.currentTu -= 15;

        // Show alien attacking
        const hitChance = alien.accuracy;

        const bullet = this.add.image(
            alien.x * this.TILE + this.TILE/2,
            alien.y * this.TILE + this.TILE/2,
            'bullet'
        ).setDepth(100).setTint(0xff00ff);

        this.tweens.add({
            targets: bullet,
            x: soldier.x * this.TILE + this.TILE/2,
            y: soldier.y * this.TILE + this.TILE/2,
            duration: 200,
            onComplete: () => {
                bullet.destroy();

                if (Math.random() * 100 < hitChance) {
                    const damage = Math.floor(alien.damage * (0.5 + Math.random()));
                    soldier.currentHp -= damage;

                    this.showMessage(`${soldier.name} hit for ${damage}!`);

                    soldier.healthBar.setScale(Math.max(0, soldier.currentHp / soldier.maxHp), 1);

                    if (soldier.currentHp <= 0) {
                        this.killSoldier(soldier);
                    }
                }

                this.checkGameOver();
                callback();
            }
        });
    }

    startPlayerTurn() {
        this.turn = 'player';
        this.turnNumber++;
        this.turnText.setText(`PLAYER TURN - Turn ${this.turnNumber}`).setFill('#00ff00');

        // Reset soldier TU
        this.soldiers.forEach(s => {
            if (s.alive) {
                s.currentTu = s.maxTu;
                s.tuBar.setScale(1, 1);
            }
        });

        this.updateFogOfWar();
        this.updateAlienCount();
    }

    checkVictory() {
        const aliensAlive = this.aliens.filter(a => a.alive).length;
        if (aliensAlive === 0) {
            this.time.delayedCall(1000, () => {
                this.scene.start('VictoryScene', {
                    turns: this.turnNumber,
                    survivors: this.soldiers.filter(s => s.alive).length
                });
            });
        }
    }

    checkGameOver() {
        const soldiersAlive = this.soldiers.filter(s => s.alive).length;
        if (soldiersAlive === 0) {
            this.time.delayedCall(1000, () => {
                this.scene.start('GameOverScene', { turns: this.turnNumber });
            });
        }
    }
}

class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    init(data) {
        this.turns = data.turns || 1;
        this.survivors = data.survivors || 0;
    }

    create() {
        const cx = 400, cy = 300;

        this.add.rectangle(cx, cy, 800, 600, 0x001122);

        this.add.text(cx, 150, 'MISSION COMPLETE', {
            fontSize: '48px',
            fill: '#00ff00',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(cx, 230, 'All hostiles eliminated', {
            fontSize: '24px',
            fill: '#88ff88',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(cx, 300, `Turns: ${this.turns}`, {
            fontSize: '20px',
            fill: '#aaaaaa',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(cx, 340, `Survivors: ${this.survivors}/4`, {
            fontSize: '20px',
            fill: this.survivors === 4 ? '#00ff00' : '#ffaa00',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        const rating = this.survivors === 4 ? 'EXCELLENT' : this.survivors >= 2 ? 'GOOD' : 'ACCEPTABLE';
        this.add.text(cx, 400, `Rating: ${rating}`, {
            fontSize: '28px',
            fill: '#ffff00',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        const btn = this.add.rectangle(cx, 500, 200, 50, 0x006600)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => btn.setFillStyle(0x008800))
            .on('pointerout', () => btn.setFillStyle(0x006600))
            .on('pointerdown', () => this.scene.start('MenuScene'));

        this.add.text(cx, 500, 'NEW MISSION', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.turns = data.turns || 1;
    }

    create() {
        const cx = 400, cy = 300;

        this.add.rectangle(cx, cy, 800, 600, 0x110000);

        this.add.text(cx, 180, 'MISSION FAILED', {
            fontSize: '48px',
            fill: '#ff0000',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(cx, 260, 'All soldiers KIA', {
            fontSize: '24px',
            fill: '#ff6666',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(cx, 320, `Survived ${this.turns} turns`, {
            fontSize: '20px',
            fill: '#aaaaaa',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        const btn = this.add.rectangle(cx, 450, 200, 50, 0x660000)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => btn.setFillStyle(0x880000))
            .on('pointerout', () => btn.setFillStyle(0x660000))
            .on('pointerdown', () => this.scene.start('MenuScene'));

        this.add.text(cx, 450, 'TRY AGAIN', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a0a',
    scene: [BootScene, MenuScene, GameScene, VictoryScene, GameOverScene]
};

const game = new Phaser.Game(config);
