// Star of Providence Clone - Phaser 3 Implementation
// A bullet-hell roguelike shooter

const COLORS = {
    bg: 0x0a0a14,
    uiGreen: 0x22cc44,
    uiGreenDark: 0x116622,
    uiOrange: 0xdd6622,
    uiRed: 0xcc3333,
    uiCyan: 0x44aacc,
    uiYellow: 0xddcc22,
    wallBrown: 0x664422,
    wallDark: 0x442211,
    floorDark: 0x1a0a0a,
    floorMid: 0x2a1212,
    white: 0xffffff,
    black: 0x000000,
    heart: 0x22cc44,
    enemy: 0xcc6622,
    playerBullet: 0x44ffff
};

const WEAPONS = {
    peashooter: { name: 'Peashooter', damage: 5, maxAmmo: Infinity, fireRate: 100, velocity: 600, color: 0x44ffff },
    vulcan: { name: 'Vulcan', damage: 15, maxAmmo: 500, fireRate: 65, velocity: 700, color: 0xffff44 },
    laser: { name: 'Laser', damage: 115, maxAmmo: 100, fireRate: 650, velocity: 1200, color: 0xff44ff, pierce: true },
    fireball: { name: 'Fireball', damage: 80, maxAmmo: 90, fireRate: 800, velocity: 300, color: 0xff6622, aoe: true },
    revolver: { name: 'Revolver', damage: 35, maxAmmo: 250, fireRate: 200, velocity: 800, color: 0xffcc44 },
    sword: { name: 'Sword', damage: 90, maxAmmo: 125, fireRate: 400, velocity: 0, color: 0x88ccff, melee: true }
};

const KEYWORDS = {
    homing: { name: 'Homing', damageMod: 1.0, ammoMod: 1.0 },
    triple: { name: 'Triple', damageMod: 0.5, ammoMod: 1.5 },
    highCaliber: { name: 'High-Caliber', damageMod: 3.5, ammoMod: 0.56 }
};

const ENEMY_TYPES = {
    ghost: { hp: 50, speed: 60, behavior: 'chase', color: 0x88aacc, size: 20, points: 10, revenge: true },
    crazyGhost: { hp: 100, speed: 180, behavior: 'dash', color: 0xcc88aa, size: 22, points: 25 },
    drone: { hp: 70, speed: 150, behavior: 'dash', color: 0x888899, size: 18, points: 20 },
    turret: { hp: 90, speed: 0, behavior: 'stationary', color: 0x666677, size: 24, points: 30 },
    seeker: { hp: 120, speed: 90, behavior: 'wander', color: 0x44aa88, size: 22, points: 35 },
    swarmer: { hp: 12, speed: 250, behavior: 'chase', color: 0xaa4444, size: 10, points: 5 },
    blob: { hp: 150, speed: 50, behavior: 'bounce', color: 0x44aacc, size: 30, points: 40, splits: true },
    pyromancer: { hp: 110, speed: 50, behavior: 'wander', color: 0xff6622, size: 24, points: 45 },
    hermit: { hp: 125, speed: 20, behavior: 'stationary', color: 0x886688, size: 28, points: 50, spawner: true },
    bumper: { hp: 120, speed: 150, behavior: 'bounce', color: 0xaa8844, size: 26, points: 35, ringOnDeath: true }
};

const BOSSES = {
    chamberlord: { name: 'CHAMBERLORD', hp: 1500, color: 0xcc8844 },
    wraithking: { name: 'WRAITHKING', hp: 2000, color: 0x8844cc },
    coreGuardian: { name: 'CORE GUARDIAN', hp: 2500, color: 0x44cccc }
};

// Boot Scene
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.scene.start('MenuScene');
    }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bg);

        // Background particles
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);
            const star = this.add.circle(x, y, 1, COLORS.uiGreen, 0.3);
            this.tweens.add({
                targets: star,
                alpha: { from: 0.1, to: 0.5 },
                duration: 1000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1
            });
        }

        // Title
        this.add.text(400, 150, 'STAR OF PROVIDENCE', {
            fontSize: '42px',
            fontFamily: 'monospace',
            color: '#22cc44'
        }).setOrigin(0.5);

        this.add.text(400, 200, 'A Bullet-Hell Roguelike', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#116622'
        }).setOrigin(0.5);

        // Animated ship
        this.ship = this.add.graphics();
        this.shipY = 300;
        this.drawShip();

        // Start prompt
        const startText = this.add.text(400, 400, 'Press SPACE or Click to Start', {
            fontSize: '22px',
            fontFamily: 'monospace',
            color: '#dd6622'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: startText,
            alpha: { from: 1, to: 0.5 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Controls
        this.add.text(400, 480, 'WASD - Move | Shift - Focus | Space - Shoot', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.add.text(400, 505, 'Z - Dash | X - Bomb | Tab - Map | Q - Debug', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.add.text(400, 530, '1-6 - Switch Weapons', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Input
        this.input.keyboard.on('keydown-SPACE', () => this.startGame());
        this.input.on('pointerdown', () => this.startGame());
    }

    drawShip() {
        this.ship.clear();
        this.ship.fillStyle(COLORS.white, 1);
        this.ship.beginPath();
        this.ship.moveTo(400, this.shipY - 20);
        this.ship.lineTo(385, this.shipY + 15);
        this.ship.lineTo(415, this.shipY + 15);
        this.ship.closePath();
        this.ship.fillPath();

        this.ship.fillStyle(COLORS.uiCyan, 1);
        this.ship.beginPath();
        this.ship.moveTo(392, this.shipY + 15);
        this.ship.lineTo(400, this.shipY + 28);
        this.ship.lineTo(408, this.shipY + 15);
        this.ship.closePath();
        this.ship.fillPath();
    }

    update(time) {
        this.shipY = 300 + Math.sin(time * 0.002) * 10;
        this.drawShip();
    }

    startGame() {
        this.scene.start('GameScene');
    }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bg);

        // Game state
        this.floor = 1;
        this.room = { x: 2, y: 2 };
        this.rooms = {};
        this.debris = 0;
        this.multiplier = 1.0;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalKills = 0;
        this.wave = 0;
        this.paused = false;
        this.showDebug = false;
        this.showMap = false;
        this.inBossFight = false;
        this.boss = null;

        // Groups
        this.playerBullets = this.add.group();
        this.enemyBullets = this.add.group();
        this.enemies = this.add.group();
        this.pickups = this.add.group();
        this.particles = this.add.group();

        // Generate floor
        this.generateFloor();

        // Create room graphics FIRST (background)
        this.roomGraphics = this.add.graphics();
        this.roomGraphics.setDepth(0);
        this.drawRoom();

        // Create player (above room)
        this.createPlayer();

        // Create HUD (topmost)
        this.createHUD();

        // Setup input
        this.setupInput();

        // Spawn enemies if not start room
        this.spawnEnemiesForRoom();
    }

    generateFloor() {
        this.rooms = {};
        const size = 4 + this.floor;

        const visited = new Set();
        const queue = [{ x: 2, y: 2 }];
        visited.add('2,2');
        this.rooms['2,2'] = { type: 'start', cleared: true, enemies: 0, doors: [] };

        let roomCount = 0;
        const maxRooms = 8 + this.floor * 2;

        while (queue.length > 0 && roomCount < maxRooms) {
            const current = queue.shift();
            const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];

            for (const dir of dirs) {
                const nx = current.x + dir.x;
                const ny = current.y + dir.y;
                const key = `${nx},${ny}`;

                if (!visited.has(key) && nx >= 0 && nx < size && ny >= 0 && ny < size && Math.random() < 0.6) {
                    visited.add(key);
                    roomCount++;

                    let type = 'normal';
                    if (roomCount === maxRooms - 1) type = 'boss';
                    else if (Math.random() < 0.15) type = 'shop';
                    else if (Math.random() < 0.1) type = 'treasure';

                    this.rooms[key] = {
                        type,
                        cleared: false,
                        enemies: type === 'normal' ? 3 + this.floor + Math.floor(Math.random() * 3) : 0,
                        doors: []
                    };

                    queue.push({ x: nx, y: ny });
                }
            }
        }

        // Ensure boss room
        let hasBoss = false;
        for (const key in this.rooms) {
            if (this.rooms[key].type === 'boss') hasBoss = true;
        }
        if (!hasBoss) {
            const keys = Object.keys(this.rooms).filter(k => k !== '2,2');
            if (keys.length > 0) {
                this.rooms[keys[keys.length - 1]].type = 'boss';
            }
        }

        // Calculate doors
        for (const key in this.rooms) {
            const [x, y] = key.split(',').map(Number);
            const doors = [];
            if (this.rooms[`${x},${y - 1}`]) doors.push('up');
            if (this.rooms[`${x},${y + 1}`]) doors.push('down');
            if (this.rooms[`${x - 1},${y}`]) doors.push('left');
            if (this.rooms[`${x + 1},${y}`]) doors.push('right');
            this.rooms[key].doors = doors;
        }
    }

    getCurrentRoom() {
        return this.rooms[`${this.room.x},${this.room.y}`] || { type: 'normal', cleared: true, doors: [] };
    }

    createPlayer() {
        this.player = {
            x: 400,
            y: 480,
            hp: 4,
            maxHp: 4,
            shields: 0,
            bombs: 2,
            maxBombs: 6,
            speed: 280,
            focusSpeed: 110,
            currentWeapon: 'peashooter',
            weaponKeyword: null,
            ammo: 500,
            maxAmmo: 500,
            damageBonus: 1.0,
            invulnerable: false,
            invulnerableTimer: 0,
            iFrames: 0,
            fireTimer: 0,
            dashCooldown: 0,
            focusing: false,
            roomsCleared: 0
        };

        this.playerGraphics = this.add.graphics();
        this.playerGraphics.setDepth(10);
        this.drawPlayer();
    }

    drawPlayer() {
        this.playerGraphics.clear();

        // Flash when invulnerable
        if (this.player.invulnerable && Math.floor(this.time.now / 100) % 2 === 0) {
            this.playerGraphics.setAlpha(0.4);
        } else {
            this.playerGraphics.setAlpha(1);
        }

        // Ship body
        this.playerGraphics.fillStyle(COLORS.white, 1);
        this.playerGraphics.beginPath();
        this.playerGraphics.moveTo(this.player.x, this.player.y - 16);
        this.playerGraphics.lineTo(this.player.x - 11, this.player.y + 11);
        this.playerGraphics.lineTo(this.player.x + 11, this.player.y + 11);
        this.playerGraphics.closePath();
        this.playerGraphics.fillPath();

        // Engine glow
        const flicker = Math.sin(this.time.now * 0.01) * 2;
        this.playerGraphics.fillStyle(COLORS.uiCyan, 1);
        this.playerGraphics.beginPath();
        this.playerGraphics.moveTo(this.player.x - 5, this.player.y + 11);
        this.playerGraphics.lineTo(this.player.x, this.player.y + 20 + flicker);
        this.playerGraphics.lineTo(this.player.x + 5, this.player.y + 11);
        this.playerGraphics.closePath();
        this.playerGraphics.fillPath();

        // Focus indicator
        if (this.player.focusing) {
            this.playerGraphics.lineStyle(2, COLORS.uiCyan, 1);
            this.playerGraphics.strokeCircle(this.player.x, this.player.y, 4);
            this.playerGraphics.fillStyle(COLORS.uiCyan, 1);
            this.playerGraphics.fillCircle(this.player.x, this.player.y, 2);
        }

        // Shield indicator
        if (this.player.shields > 0) {
            this.playerGraphics.lineStyle(2, COLORS.uiCyan, 0.5 + Math.sin(this.time.now * 0.005) * 0.3);
            this.playerGraphics.strokeCircle(this.player.x, this.player.y, 22);
        }
    }

    drawRoom() {
        this.roomGraphics.clear();
        const room = this.getCurrentRoom();

        // Floor
        this.roomGraphics.fillStyle(COLORS.floorDark, 1);
        this.roomGraphics.fillRect(50, 50, 700, 500);

        // Checkerboard
        for (let x = 0; x < 14; x++) {
            for (let y = 0; y < 10; y++) {
                if ((x + y) % 2 === 0) {
                    this.roomGraphics.fillStyle(COLORS.floorMid, 1);
                    this.roomGraphics.fillRect(50 + x * 50, 50 + y * 50, 50, 50);
                }
            }
        }

        // Walls
        this.roomGraphics.fillStyle(COLORS.wallBrown, 1);
        this.roomGraphics.fillRect(0, 0, 800, 50);
        this.roomGraphics.fillRect(0, 550, 800, 50);
        this.roomGraphics.fillRect(0, 0, 50, 600);
        this.roomGraphics.fillRect(750, 0, 50, 600);

        // Wall details
        this.roomGraphics.fillStyle(COLORS.wallDark, 1);
        for (let i = 0; i < 16; i++) {
            this.roomGraphics.fillRect(i * 50, 0, 24, 24);
            this.roomGraphics.fillRect(i * 50 + 25, 25, 24, 24);
            this.roomGraphics.fillRect(i * 50, 550, 24, 24);
            this.roomGraphics.fillRect(i * 50 + 25, 575, 24, 24);
        }

        // Doors
        const doors = room.doors || [];
        const canPass = room.cleared || room.type === 'start' || this.enemies.getLength() === 0;
        const doorColor = canPass ? COLORS.uiGreen : COLORS.uiGreenDark;
        const arrowColor = 0x44ff66;

        if (doors.includes('up')) {
            this.roomGraphics.fillStyle(doorColor, 1);
            this.roomGraphics.fillRect(375, 0, 50, 50);
            if (canPass) {
                this.roomGraphics.fillStyle(arrowColor, 1);
                this.roomGraphics.beginPath();
                this.roomGraphics.moveTo(400, 10);
                this.roomGraphics.lineTo(385, 35);
                this.roomGraphics.lineTo(415, 35);
                this.roomGraphics.closePath();
                this.roomGraphics.fillPath();
            }
        }
        if (doors.includes('down')) {
            this.roomGraphics.fillStyle(doorColor, 1);
            this.roomGraphics.fillRect(375, 550, 50, 50);
            if (canPass) {
                this.roomGraphics.fillStyle(arrowColor, 1);
                this.roomGraphics.beginPath();
                this.roomGraphics.moveTo(400, 590);
                this.roomGraphics.lineTo(385, 565);
                this.roomGraphics.lineTo(415, 565);
                this.roomGraphics.closePath();
                this.roomGraphics.fillPath();
            }
        }
        if (doors.includes('left')) {
            this.roomGraphics.fillStyle(doorColor, 1);
            this.roomGraphics.fillRect(0, 275, 50, 50);
            if (canPass) {
                this.roomGraphics.fillStyle(arrowColor, 1);
                this.roomGraphics.beginPath();
                this.roomGraphics.moveTo(10, 300);
                this.roomGraphics.lineTo(35, 285);
                this.roomGraphics.lineTo(35, 315);
                this.roomGraphics.closePath();
                this.roomGraphics.fillPath();
            }
        }
        if (doors.includes('right')) {
            this.roomGraphics.fillStyle(doorColor, 1);
            this.roomGraphics.fillRect(750, 275, 50, 50);
            if (canPass) {
                this.roomGraphics.fillStyle(arrowColor, 1);
                this.roomGraphics.beginPath();
                this.roomGraphics.moveTo(790, 300);
                this.roomGraphics.lineTo(765, 285);
                this.roomGraphics.lineTo(765, 315);
                this.roomGraphics.closePath();
                this.roomGraphics.fillPath();
            }
        }
    }

    createHUD() {
        // HUD background
        this.add.rectangle(400, 24, 800, 48, 0x000000, 0.9).setDepth(100);

        // Weapon box
        this.add.rectangle(73, 24, 130, 40, 0x000000, 0).setStrokeStyle(2, COLORS.uiGreen).setDepth(100);

        this.weaponText = this.add.text(16, 12, 'Peashooter', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#44ffff'
        }).setDepth(101);

        this.ammoText = this.add.text(16, 30, '∞', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#22cc44'
        }).setDepth(101);

        // Health display
        this.healthGraphics = this.add.graphics();
        this.healthGraphics.setDepth(101);
        this.drawHealth();

        // Bombs display
        this.bombGraphics = this.add.graphics();
        this.bombGraphics.setDepth(101);
        this.drawBombs();

        // Multiplier box
        this.add.rectangle(725, 24, 130, 40, 0x000000, 0).setStrokeStyle(2, COLORS.uiGreen).setDepth(100);

        this.multiplierText = this.add.text(784, 12, 'X1.0', {
            fontSize: '15px',
            fontFamily: 'monospace',
            color: '#22cc44'
        }).setOrigin(1, 0).setDepth(101);

        this.debrisText = this.add.text(784, 30, '0G', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#ddcc22'
        }).setOrigin(1, 0).setDepth(101);

        // Floor/Wave
        this.floorText = this.add.text(10, 585, 'FLOOR 1 | WAVE 0', {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#22cc44'
        }).setDepth(101);

        // Minimap
        this.minimapGraphics = this.add.graphics();
        this.minimapGraphics.setDepth(101);
        this.drawMinimap();

        // Debug overlay (hidden by default)
        this.debugText = this.add.text(10, 55, '', {
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#22cc44',
            backgroundColor: 'rgba(0,0,0,0.85)',
            padding: { x: 5, y: 5 }
        }).setVisible(false).setDepth(200);

        // Combo display
        this.comboText = this.add.text(500, 20, '', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(101);

        // Boss HP bar (hidden by default)
        this.bossHpBg = this.add.rectangle(400, 68, 604, 24, 0x1a1a1a).setVisible(false).setDepth(100);
        this.bossHpBar = this.add.rectangle(100, 68, 600, 20, COLORS.uiRed).setOrigin(0, 0.5).setVisible(false).setDepth(101);
        this.bossHpBorder = this.add.rectangle(400, 68, 600, 20, 0x000000, 0).setStrokeStyle(2, COLORS.uiGreen).setVisible(false).setDepth(101);
        this.bossNameText = this.add.text(400, 68, '', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5).setVisible(false).setDepth(102);
    }

    drawHealth() {
        this.healthGraphics.clear();
        const startX = 160;
        for (let i = 0; i < this.player.maxHp; i++) {
            if (i < this.player.hp) {
                this.healthGraphics.fillStyle(COLORS.heart, 1);
            } else {
                this.healthGraphics.lineStyle(1, COLORS.heart, 1);
            }
            // Simple heart shape
            const x = startX + i * 18;
            const y = 24;
            if (i < this.player.hp) {
                this.healthGraphics.fillCircle(x - 3, y - 2, 5);
                this.healthGraphics.fillCircle(x + 3, y - 2, 5);
                this.healthGraphics.fillTriangle(x - 8, y, x + 8, y, x, y + 8);
            } else {
                this.healthGraphics.strokeCircle(x - 3, y - 2, 5);
                this.healthGraphics.strokeCircle(x + 3, y - 2, 5);
            }
        }
    }

    drawBombs() {
        this.bombGraphics.clear();
        this.bombGraphics.fillStyle(COLORS.uiOrange, 1);
        const startX = 350;
        for (let i = 0; i < this.player.bombs; i++) {
            this.bombGraphics.fillCircle(startX + i * 16, 24, 7);
        }
    }

    drawMinimap() {
        this.minimapGraphics.clear();
        const x = 715;
        const y = 555;
        const w = 75;
        const h = 35;

        this.minimapGraphics.fillStyle(0x000000, 0.7);
        this.minimapGraphics.fillRect(x, y, w, h);
        this.minimapGraphics.lineStyle(1, COLORS.uiGreen, 1);
        this.minimapGraphics.strokeRect(x, y, w, h);

        const scale = 8;
        const offsetX = x + w / 2;
        const offsetY = y + h / 2;

        for (const key in this.rooms) {
            const [rx, ry] = key.split(',').map(Number);
            const px = offsetX + (rx - this.room.x) * scale;
            const py = offsetY + (ry - this.room.y) * scale;

            const room = this.rooms[key];
            let color = COLORS.uiGreen;
            if (rx === this.room.x && ry === this.room.y) {
                color = COLORS.white;
            } else if (room.cleared) {
                color = COLORS.uiGreenDark;
            } else if (room.type === 'boss') {
                color = COLORS.uiRed;
            } else if (room.type === 'shop') {
                color = COLORS.uiYellow;
            }

            this.minimapGraphics.fillStyle(color, 1);
            this.minimapGraphics.fillRect(px - 3, py - 3, 6, 6);
        }
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            z: Phaser.Input.Keyboard.KeyCodes.Z,
            x: Phaser.Input.Keyboard.KeyCodes.X,
            q: Phaser.Input.Keyboard.KeyCodes.Q,
            tab: Phaser.Input.Keyboard.KeyCodes.TAB,
            esc: Phaser.Input.Keyboard.KeyCodes.ESC,
            one: Phaser.Input.Keyboard.KeyCodes.ONE,
            two: Phaser.Input.Keyboard.KeyCodes.TWO,
            three: Phaser.Input.Keyboard.KeyCodes.THREE,
            four: Phaser.Input.Keyboard.KeyCodes.FOUR,
            five: Phaser.Input.Keyboard.KeyCodes.FIVE,
            six: Phaser.Input.Keyboard.KeyCodes.SIX,
            r: Phaser.Input.Keyboard.KeyCodes.R
        });

        this.input.keyboard.on('keydown-Q', () => {
            this.showDebug = !this.showDebug;
            this.debugText.setVisible(this.showDebug);
        });

        this.input.keyboard.on('keydown-TAB', (event) => {
            event.preventDefault();
            this.showMap = !this.showMap;
        });

        this.input.keyboard.on('keydown-ESC', () => {
            this.paused = !this.paused;
        });
    }

    spawnEnemiesForRoom() {
        const room = this.getCurrentRoom();
        if (room.cleared || room.type === 'start' || room.type === 'shop' || room.type === 'treasure') {
            return;
        }

        this.enemies.clear(true, true);
        this.wave++;

        const count = room.enemies || (3 + this.floor * 2);
        const types = Object.keys(ENEMY_TYPES);

        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * Math.min(types.length, 3 + this.floor * 2))];
            const x = 100 + Math.random() * 600;
            const y = 100 + Math.random() * 350;
            this.createEnemy(x, y, type);
        }
    }

    createEnemy(x, y, type) {
        const def = ENEMY_TYPES[type];
        const enemy = this.add.graphics();
        enemy.x = x;
        enemy.y = y;
        enemy.type = type;
        enemy.hp = def.hp;
        enemy.maxHp = def.hp;
        enemy.speed = def.speed;
        enemy.behavior = def.behavior;
        enemy.color = def.color;
        enemy.size = def.size;
        enemy.vx = (Math.random() - 0.5) * 2;
        enemy.vy = (Math.random() - 0.5) * 2;
        enemy.attackTimer = 1000 + Math.random() * 1000;
        enemy.dashTarget = null;
        enemy.lastAttack = 0;

        enemy.setDepth(5);
        this.drawEnemy(enemy);
        this.enemies.add(enemy);
    }

    drawEnemy(enemy) {
        enemy.clear();
        enemy.fillStyle(enemy.color, 1);

        switch (enemy.type) {
            case 'ghost':
            case 'crazyGhost':
                enemy.beginPath();
                enemy.arc(0, -5, enemy.size / 2, Math.PI, 0);
                enemy.lineTo(enemy.size / 2, enemy.size / 2);
                for (let i = 0; i < 4; i++) {
                    const wx = enemy.size / 2 - i * enemy.size / 4;
                    enemy.lineTo(wx - enemy.size / 8, enemy.size / 3);
                    enemy.lineTo(wx - enemy.size / 4, enemy.size / 2);
                }
                enemy.closePath();
                enemy.fillPath();
                // Eyes
                enemy.fillStyle(0xddddcc, 1);
                enemy.fillCircle(-4, -6, 4);
                enemy.fillCircle(4, -6, 4);
                enemy.fillStyle(0x000000, 1);
                enemy.fillCircle(-4, -6, 2);
                enemy.fillCircle(4, -6, 2);
                break;

            case 'blob':
                enemy.fillCircle(0, 0, enemy.size);
                enemy.fillStyle(0x66ccee, 1);
                enemy.fillCircle(-8, -8, enemy.size / 3);
                enemy.fillStyle(0xddddcc, 1);
                enemy.fillCircle(-6, -4, 5);
                enemy.fillCircle(6, -4, 5);
                break;

            case 'turret':
                enemy.fillRect(-enemy.size / 2, -enemy.size / 2, enemy.size, enemy.size);
                enemy.fillStyle(COLORS.uiRed, 1);
                enemy.fillCircle(0, 0, 6);
                break;

            case 'swarmer':
                enemy.beginPath();
                enemy.moveTo(0, -enemy.size);
                enemy.lineTo(-enemy.size, enemy.size);
                enemy.lineTo(enemy.size, enemy.size);
                enemy.closePath();
                enemy.fillPath();
                break;

            case 'pyromancer':
                enemy.fillCircle(0, 0, enemy.size);
                enemy.fillStyle(0xffaa44, 1);
                enemy.fillCircle(0, -6, enemy.size * 0.6);
                enemy.fillStyle(0xffcc66, 1);
                enemy.fillCircle(0, -10, enemy.size * 0.3);
                break;

            default:
                enemy.fillCircle(0, 0, enemy.size);
        }

        // HP bar
        const hpPercent = enemy.hp / enemy.maxHp;
        if (hpPercent < 1) {
            enemy.fillStyle(0x222222, 1);
            enemy.fillRect(-16, -enemy.size - 12, 32, 5);
            enemy.fillStyle(hpPercent > 0.5 ? COLORS.uiGreen : COLORS.uiRed, 1);
            enemy.fillRect(-16, -enemy.size - 12, 32 * hpPercent, 5);
        }

        enemy.setPosition(enemy.x, enemy.y);
    }

    createBullet(x, y, vx, vy, damage, color, isEnemy = false, pierce = false) {
        const bullet = this.add.circle(x, y, isEnemy ? 6 : 5, color);
        bullet.vx = vx;
        bullet.vy = vy;
        bullet.damage = damage;
        bullet.pierce = pierce;
        bullet.setDepth(8);

        if (isEnemy) {
            this.enemyBullets.add(bullet);
        } else {
            this.playerBullets.add(bullet);
            // Glow effect
            const glow = this.add.circle(x, y, 10, color, 0.3);
            glow.setDepth(7);
            bullet.glow = glow;
        }

        return bullet;
    }

    update(time, delta) {
        if (this.paused) return;

        this.updatePlayer(delta);
        this.updateEnemies(time, delta);
        this.updateBullets(delta);
        this.updateBoss(time, delta);
        this.checkCollisions();
        this.updateHUD();

        // Redraw room for door status
        this.drawRoom();
        this.drawMinimap();

        // Multiplier decay
        if (time % 1500 < 16) {
            this.multiplier = Math.max(1.0, this.multiplier - 0.02);
        }

        // Check room clear
        if (this.enemies.getLength() === 0 && !this.inBossFight) {
            const room = this.getCurrentRoom();
            if (!room.cleared && room.type === 'normal') {
                room.cleared = true;
                this.player.roomsCleared++;
                if (this.player.roomsCleared % 3 === 0) {
                    this.player.bombs = Math.min(this.player.bombs + 1, this.player.maxBombs);
                    this.drawBombs();
                }
            }
        }

        // Update debug
        if (this.showDebug) {
            this.debugText.setText([
                `FPS: ${Math.round(this.game.loop.actualFps)}`,
                `Floor: ${this.floor} | Wave: ${this.wave}`,
                `Room: ${this.room.x},${this.room.y}`,
                `Player: ${Math.floor(this.player.x)},${Math.floor(this.player.y)}`,
                `HP: ${this.player.hp}/${this.player.maxHp}`,
                `Shields: ${this.player.shields}`,
                `Bombs: ${this.player.bombs}`,
                `Weapon: ${this.player.currentWeapon}`,
                `Ammo: ${this.player.ammo}`,
                `Enemies: ${this.enemies.getLength()}`,
                `P-Bullets: ${this.playerBullets.getLength()}`,
                `E-Bullets: ${this.enemyBullets.getLength()}`,
                `Multiplier: ${this.multiplier.toFixed(2)}`,
                `Combo: ${this.combo} (Max: ${this.maxCombo})`,
                `Debris: ${this.debris}`
            ].join('\n'));
        }

        // Check player death
        if (this.player.hp <= 0) {
            this.scene.start('GameOverScene', {
                floor: this.floor,
                debris: this.debris,
                kills: this.totalKills,
                maxCombo: this.maxCombo
            });
        }
    }

    updatePlayer(delta) {
        const dt = delta / 1000;

        // Movement
        let dx = 0, dy = 0;
        if (this.keys.w.isDown || this.cursors.up.isDown) dy -= 1;
        if (this.keys.s.isDown || this.cursors.down.isDown) dy += 1;
        if (this.keys.a.isDown || this.cursors.left.isDown) dx -= 1;
        if (this.keys.d.isDown || this.cursors.right.isDown) dx += 1;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        this.player.focusing = this.keys.shift.isDown;
        const speed = this.player.focusing ? this.player.focusSpeed : this.player.speed;

        this.player.x += dx * speed * dt;
        this.player.y += dy * speed * dt;

        // Bounds
        this.player.x = Phaser.Math.Clamp(this.player.x, 65, 735);
        this.player.y = Phaser.Math.Clamp(this.player.y, 65, 535);

        // Check door transitions
        const room = this.getCurrentRoom();
        const canPass = room.cleared || room.type === 'start' || this.enemies.getLength() === 0;
        if (canPass) {
            if (this.player.y < 70 && room.doors.includes('up')) this.transitionRoom('up');
            if (this.player.y > 530 && room.doors.includes('down')) this.transitionRoom('down');
            if (this.player.x < 70 && room.doors.includes('left')) this.transitionRoom('left');
            if (this.player.x > 730 && room.doors.includes('right')) this.transitionRoom('right');
        }

        // Dash
        if (Phaser.Input.Keyboard.JustDown(this.keys.z) && this.player.dashCooldown <= 0) {
            this.dash(dx, dy);
        }
        this.player.dashCooldown = Math.max(0, this.player.dashCooldown - dt);

        // Bomb
        if (Phaser.Input.Keyboard.JustDown(this.keys.x)) {
            this.useBomb();
        }

        // Fire
        this.player.fireTimer = Math.max(0, this.player.fireTimer - delta);
        if (this.keys.space.isDown && this.player.fireTimer <= 0) {
            this.fire();
        }

        // Weapon switching
        const weapons = ['peashooter', 'vulcan', 'laser', 'fireball', 'revolver', 'sword'];
        const weaponKeys = [this.keys.one, this.keys.two, this.keys.three, this.keys.four, this.keys.five, this.keys.six];
        for (let i = 0; i < 6; i++) {
            if (Phaser.Input.Keyboard.JustDown(weaponKeys[i])) {
                this.player.currentWeapon = weapons[i];
                if (Math.random() < 0.35 && i > 0) {
                    const kws = Object.keys(KEYWORDS);
                    this.player.weaponKeyword = kws[Math.floor(Math.random() * kws.length)];
                } else {
                    this.player.weaponKeyword = null;
                }
            }
        }

        // Invulnerability
        if (this.player.invulnerable) {
            this.player.invulnerableTimer -= delta;
            if (this.player.invulnerableTimer <= 0) {
                this.player.invulnerable = false;
            }
        }
        if (this.player.iFrames > 0) this.player.iFrames -= delta;

        this.drawPlayer();
    }

    dash(dx, dy) {
        if (dx === 0 && dy === 0) dy = -1;

        this.player.x += dx * 130;
        this.player.y += dy * 130;

        this.player.x = Phaser.Math.Clamp(this.player.x, 65, 735);
        this.player.y = Phaser.Math.Clamp(this.player.y, 65, 535);

        this.player.dashCooldown = 0.4;
        this.player.iFrames = 200;

        // Dash particles
        for (let i = 0; i < 8; i++) {
            const p = this.add.circle(this.player.x, this.player.y, 3, COLORS.uiCyan);
            this.tweens.add({
                targets: p,
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: () => p.destroy()
            });
        }
    }

    fire() {
        const weapon = WEAPONS[this.player.currentWeapon];

        if (weapon.maxAmmo !== Infinity && this.player.ammo <= 0) {
            this.player.currentWeapon = 'peashooter';
            this.player.weaponKeyword = null;
            return;
        }

        this.player.fireTimer = weapon.fireRate;
        if (weapon.maxAmmo !== Infinity) this.player.ammo--;

        let damage = weapon.damage * this.player.damageBonus;
        let count = 1;

        if (this.player.weaponKeyword) {
            const kw = KEYWORDS[this.player.weaponKeyword];
            damage *= kw.damageMod;
            if (this.player.weaponKeyword === 'triple') count = 3;
            if (this.player.weaponKeyword === 'highCaliber') {
                this.player.fireTimer *= 2.5;
                damage *= 1.2;
            }
        }

        for (let i = 0; i < count; i++) {
            let angle = -Math.PI / 2;
            if (count === 3) angle += (i - 1) * 0.25;

            const vx = Math.cos(angle) * weapon.velocity;
            const vy = Math.sin(angle) * weapon.velocity;

            this.createBullet(
                this.player.x,
                this.player.y - 12,
                vx, vy,
                damage,
                weapon.color,
                false,
                weapon.pierce
            );
        }
    }

    useBomb() {
        if (this.player.bombs <= 0) return;
        this.player.bombs--;
        this.drawBombs();

        // Clear enemy bullets
        this.enemyBullets.clear(true, true);

        // Damage enemies
        this.enemies.getChildren().forEach(e => {
            e.hp -= 75;
        });

        // Damage boss
        if (this.boss) {
            this.boss.hp -= 150;
        }

        // Visual effect
        this.cameras.main.shake(200, 0.01);
        const explosion = this.add.circle(this.player.x, this.player.y, 10, 0xffffff);
        this.tweens.add({
            targets: explosion,
            scale: 20,
            alpha: 0,
            duration: 500,
            onComplete: () => explosion.destroy()
        });
    }

    transitionRoom(dir) {
        const newRoom = { ...this.room };
        if (dir === 'up') newRoom.y--;
        if (dir === 'down') newRoom.y++;
        if (dir === 'left') newRoom.x--;
        if (dir === 'right') newRoom.x++;

        if (!this.rooms[`${newRoom.x},${newRoom.y}`]) return;

        // Clear bullets
        this.playerBullets.clear(true, true);
        this.enemyBullets.clear(true, true);
        this.enemies.clear(true, true);
        this.pickups.clear(true, true);

        this.room = newRoom;

        // Reposition player
        if (dir === 'up') this.player.y = 520;
        if (dir === 'down') this.player.y = 80;
        if (dir === 'left') this.player.x = 720;
        if (dir === 'right') this.player.x = 80;

        const room = this.getCurrentRoom();
        if (room.type === 'boss' && !room.cleared) {
            this.startBossFight();
        } else {
            this.spawnEnemiesForRoom();
        }

        this.drawRoom();
        this.drawMinimap();
    }

    startBossFight() {
        this.inBossFight = true;
        const bossKeys = Object.keys(BOSSES);
        const bossType = bossKeys[Math.min(this.floor - 1, bossKeys.length - 1)];
        const def = BOSSES[bossType];

        this.boss = {
            x: 400,
            y: 150,
            type: bossType,
            name: def.name,
            hp: def.hp,
            maxHp: def.hp,
            color: def.color,
            phase: 1,
            attackTimer: 1000,
            invulnerable: false,
            lastAttack: 0
        };

        this.bossGraphics = this.add.graphics();
        this.bossGraphics.setDepth(6);
        this.drawBoss();

        // Show boss HP bar
        this.bossHpBg.setVisible(true);
        this.bossHpBar.setVisible(true);
        this.bossHpBorder.setVisible(true);
        this.bossNameText.setText(this.boss.name).setVisible(true);

        this.cameras.main.shake(300, 0.005);
    }

    drawBoss() {
        if (!this.boss) return;
        this.bossGraphics.clear();

        if (this.boss.invulnerable && Math.floor(this.time.now / 100) % 2 === 0) {
            this.bossGraphics.setAlpha(0.4);
        } else {
            this.bossGraphics.setAlpha(1);
        }

        this.bossGraphics.fillStyle(this.boss.color, 1);

        switch (this.boss.type) {
            case 'chamberlord':
                this.bossGraphics.beginPath();
                this.bossGraphics.moveTo(this.boss.x, this.boss.y - 55);
                this.bossGraphics.lineTo(this.boss.x + 55, this.boss.y);
                this.bossGraphics.lineTo(this.boss.x + 33, this.boss.y + 55);
                this.bossGraphics.lineTo(this.boss.x - 33, this.boss.y + 55);
                this.bossGraphics.lineTo(this.boss.x - 55, this.boss.y);
                this.bossGraphics.closePath();
                this.bossGraphics.fillPath();

                // Eye
                this.bossGraphics.fillStyle(0xffffff, 1);
                this.bossGraphics.fillCircle(this.boss.x, this.boss.y, 18);
                this.bossGraphics.fillStyle(0x000000, 1);
                this.bossGraphics.fillCircle(this.boss.x, this.boss.y, 10);
                this.bossGraphics.fillStyle(0xff0000, 1);
                this.bossGraphics.fillCircle(this.boss.x, this.boss.y, 4);
                break;

            case 'wraithking':
                this.bossGraphics.beginPath();
                this.bossGraphics.arc(this.boss.x, this.boss.y - 20, 40, Math.PI, 0);
                this.bossGraphics.lineTo(this.boss.x + 40, this.boss.y + 55);
                for (let i = 0; i < 6; i++) {
                    const wx = this.boss.x + 40 - i * 13;
                    this.bossGraphics.lineTo(wx - 6, this.boss.y + 38);
                    this.bossGraphics.lineTo(wx - 13, this.boss.y + 55);
                }
                this.bossGraphics.closePath();
                this.bossGraphics.fillPath();

                // Crown
                this.bossGraphics.fillStyle(0xffcc00, 1);
                this.bossGraphics.beginPath();
                this.bossGraphics.moveTo(this.boss.x - 30, this.boss.y - 55);
                this.bossGraphics.lineTo(this.boss.x - 20, this.boss.y - 80);
                this.bossGraphics.lineTo(this.boss.x, this.boss.y - 60);
                this.bossGraphics.lineTo(this.boss.x + 20, this.boss.y - 80);
                this.bossGraphics.lineTo(this.boss.x + 30, this.boss.y - 55);
                this.bossGraphics.closePath();
                this.bossGraphics.fillPath();

                // Eyes
                this.bossGraphics.fillStyle(0xff0000, 1);
                this.bossGraphics.fillCircle(this.boss.x - 15, this.boss.y - 25, 8);
                this.bossGraphics.fillCircle(this.boss.x + 15, this.boss.y - 25, 8);
                break;

            case 'coreGuardian':
                this.bossGraphics.fillCircle(this.boss.x, this.boss.y, 55);
                this.bossGraphics.lineStyle(4, 0x88ffff, 1);
                this.bossGraphics.strokeCircle(this.boss.x, this.boss.y, 40);
                this.bossGraphics.strokeCircle(this.boss.x, this.boss.y, 28);

                // Turrets
                for (let t = 0; t < 4; t++) {
                    const angle = (t / 4) * Math.PI * 2 + this.time.now * 0.001;
                    const tx = this.boss.x + Math.cos(angle) * 45;
                    const ty = this.boss.y + Math.sin(angle) * 45;
                    this.bossGraphics.fillStyle(0x666677, 1);
                    this.bossGraphics.fillCircle(tx, ty, 14);
                    this.bossGraphics.fillStyle(0x44aaaa, 1);
                    this.bossGraphics.fillCircle(tx, ty, 8);
                }

                // Core
                const coreColor = this.boss.phase >= 3 ? 0xff4444 : (this.boss.phase >= 2 ? 0xffaa44 : 0x44ffff);
                this.bossGraphics.fillStyle(coreColor, 1);
                this.bossGraphics.fillCircle(this.boss.x, this.boss.y, 22);
                this.bossGraphics.fillStyle(0xffffff, 1);
                this.bossGraphics.fillCircle(this.boss.x, this.boss.y, 12);
                break;
        }
    }

    updateEnemies(time, delta) {
        this.enemies.getChildren().forEach(enemy => {
            const dt = delta / 1000;

            switch (enemy.behavior) {
                case 'chase':
                    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                    enemy.x += Math.cos(angle) * enemy.speed * dt;
                    enemy.y += Math.sin(angle) * enemy.speed * dt;
                    break;

                case 'wander':
                    enemy.x += enemy.vx * enemy.speed * dt;
                    enemy.y += enemy.vy * enemy.speed * dt;
                    if (Math.random() < 0.02) {
                        enemy.vx = (Math.random() - 0.5) * 2;
                        enemy.vy = (Math.random() - 0.5) * 2;
                    }
                    break;

                case 'bounce':
                    enemy.x += enemy.vx * enemy.speed * dt;
                    enemy.y += enemy.vy * enemy.speed * dt;
                    if (enemy.x < 70 || enemy.x > 730) enemy.vx *= -1;
                    if (enemy.y < 70 || enemy.y > 530) enemy.vy *= -1;
                    break;

                case 'dash':
                    if (!enemy.dashTarget) {
                        enemy.dashTarget = { x: this.player.x, y: this.player.y };
                    }
                    const dx = enemy.dashTarget.x - enemy.x;
                    const dy = enemy.dashTarget.y - enemy.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 5) {
                        enemy.x += (dx / dist) * enemy.speed * 2 * dt;
                        enemy.y += (dy / dist) * enemy.speed * 2 * dt;
                    } else {
                        enemy.dashTarget = null;
                    }
                    break;
            }

            // Bounds
            enemy.x = Phaser.Math.Clamp(enemy.x, 70, 730);
            enemy.y = Phaser.Math.Clamp(enemy.y, 70, 530);

            // Attack
            if (time - enemy.lastAttack > enemy.attackTimer) {
                this.enemyAttack(enemy);
                enemy.lastAttack = time;
            }

            // Check if dead
            if (enemy.hp <= 0) {
                this.onEnemyDeath(enemy);
                enemy.destroy();
            } else {
                this.drawEnemy(enemy);
            }
        });
    }

    enemyAttack(enemy) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

        if (enemy.type === 'turret') {
            for (let i = 0; i < 3; i++) {
                this.time.delayedCall(i * 80, () => {
                    this.createBullet(enemy.x, enemy.y, Math.cos(angle) * 300, Math.sin(angle) * 300, 1, COLORS.enemy, true);
                });
            }
        } else if (enemy.type === 'drone') {
            for (let i = -1; i <= 1; i++) {
                this.createBullet(enemy.x, enemy.y, Math.cos(angle + i * 0.35) * 350, Math.sin(angle + i * 0.35) * 350, 1, COLORS.enemy, true);
            }
        } else if (enemy.type === 'pyromancer') {
            this.createBullet(enemy.x, enemy.y, Math.cos(angle) * 250, Math.sin(angle) * 250, 1, 0xff4400, true);
        } else if (enemy.type === 'seeker') {
            for (let i = 0; i < 6; i++) {
                const spreadAngle = angle + (i - 2.5) * 0.35;
                this.createBullet(enemy.x, enemy.y, Math.cos(spreadAngle) * 250, Math.sin(spreadAngle) * 250, 1, COLORS.uiCyan, true);
            }
        } else if (enemy.type !== 'swarmer') {
            this.createBullet(enemy.x, enemy.y, Math.cos(angle) * 280, Math.sin(angle) * 280, 1, COLORS.enemy, true);
        }
    }

    onEnemyDeath(enemy) {
        this.totalKills++;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.multiplier = Math.min(this.multiplier + 0.1 + this.combo * 0.01, 10.0);

        // Drop debris
        const points = ENEMY_TYPES[enemy.type].points || 10;
        this.debris += Math.floor(points * this.multiplier);

        // Death effect
        for (let i = 0; i < 8; i++) {
            const p = this.add.circle(enemy.x, enemy.y, 4, enemy.color);
            const angle = Math.random() * Math.PI * 2;
            this.tweens.add({
                targets: p,
                x: enemy.x + Math.cos(angle) * 50,
                y: enemy.y + Math.sin(angle) * 50,
                alpha: 0,
                duration: 400,
                onComplete: () => p.destroy()
            });
        }

        // Revenge bullet (ghost)
        if (ENEMY_TYPES[enemy.type].revenge) {
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            this.createBullet(enemy.x, enemy.y, Math.cos(angle) * 200, Math.sin(angle) * 200, 1, 0xaaccff, true);
        }

        // Ring on death (bumper)
        if (ENEMY_TYPES[enemy.type].ringOnDeath) {
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                this.createBullet(enemy.x, enemy.y, Math.cos(a) * 200, Math.sin(a) * 200, 1, COLORS.uiOrange, true);
            }
        }

        // Split (blob)
        if (ENEMY_TYPES[enemy.type].splits) {
            this.createEnemy(enemy.x - 15, enemy.y, 'swarmer');
            this.createEnemy(enemy.x + 15, enemy.y, 'swarmer');
        }

        this.cameras.main.shake(100, 0.003);
    }

    updateBoss(time, delta) {
        if (!this.boss) return;

        const dt = delta / 1000;

        // Phase transitions
        const hpPercent = this.boss.hp / this.boss.maxHp;
        if (hpPercent < 0.33 && this.boss.phase < 3) {
            this.boss.phase = 3;
            this.boss.invulnerable = true;
            this.cameras.main.shake(400, 0.008);
            this.time.delayedCall(1500, () => { if (this.boss) this.boss.invulnerable = false; });
        } else if (hpPercent < 0.66 && this.boss.phase < 2) {
            this.boss.phase = 2;
            this.boss.invulnerable = true;
            this.cameras.main.shake(300, 0.005);
            this.time.delayedCall(1000, () => { if (this.boss) this.boss.invulnerable = false; });
        }

        // Movement
        const targetX = 100 + Math.sin(time * 0.001) * 300 + 300;
        const targetY = 100 + Math.cos(time * 0.0008) * 80 + 50;
        this.boss.x += (targetX - this.boss.x) * 0.02;
        this.boss.y += (targetY - this.boss.y) * 0.02;

        // Attacks
        if (time - this.boss.lastAttack > this.boss.attackTimer && !this.boss.invulnerable) {
            this.bossAttack();
            this.boss.lastAttack = time;
            this.boss.attackTimer = Math.max(300, 800 - this.boss.phase * 150);
        }

        // Update HP bar
        this.bossHpBar.width = 600 * (this.boss.hp / this.boss.maxHp);

        // Check death
        if (this.boss.hp <= 0) {
            this.onBossDeath();
        }

        this.drawBoss();
    }

    bossAttack() {
        const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);

        switch (this.boss.type) {
            case 'chamberlord':
                if (Math.random() < 0.5) {
                    // Ring
                    const count = 12 + this.boss.phase * 4;
                    for (let i = 0; i < count; i++) {
                        const a = (i / count) * Math.PI * 2;
                        this.createBullet(this.boss.x, this.boss.y, Math.cos(a) * 220, Math.sin(a) * 220, 1, this.boss.color, true);
                    }
                } else {
                    // Spread
                    for (let i = -3 - this.boss.phase; i <= 3 + this.boss.phase; i++) {
                        this.createBullet(this.boss.x, this.boss.y, Math.cos(angle + i * 0.15) * 300, Math.sin(angle + i * 0.15) * 300, 1, this.boss.color, true);
                    }
                }
                break;

            case 'wraithking':
                if (this.boss.phase >= 2 && Math.random() < 0.4) {
                    // Laser sweep
                    for (let i = 0; i < 25; i++) {
                        this.time.delayedCall(i * 40, () => {
                            if (this.boss) {
                                const sweepAngle = angle - 0.6 + (i / 25) * 1.2;
                                this.createBullet(this.boss.x, this.boss.y, Math.cos(sweepAngle) * 400, Math.sin(sweepAngle) * 400, 1, 0xaa66ff, true);
                            }
                        });
                    }
                } else {
                    // Spawn ghosts
                    if (this.enemies.getLength() < 6) {
                        this.createEnemy(this.boss.x - 40, this.boss.y, 'ghost');
                        this.createEnemy(this.boss.x + 40, this.boss.y, 'ghost');
                    }
                    // Aimed shots
                    for (let i = -2; i <= 2; i++) {
                        this.createBullet(this.boss.x, this.boss.y, Math.cos(angle + i * 0.25) * 280, Math.sin(angle + i * 0.25) * 280, 1, this.boss.color, true);
                    }
                }
                break;

            case 'coreGuardian':
                // Turret fire
                for (let t = 0; t < 4; t++) {
                    const turretAngle = (t / 4) * Math.PI * 2 + this.time.now * 0.001;
                    const tx = this.boss.x + Math.cos(turretAngle) * 45;
                    const ty = this.boss.y + Math.sin(turretAngle) * 45;
                    const toPlayer = Phaser.Math.Angle.Between(tx, ty, this.player.x, this.player.y);
                    this.createBullet(tx, ty, Math.cos(toPlayer) * 320, Math.sin(toPlayer) * 320, 1, 0x66dddd, true);
                }

                if (this.boss.phase >= 2) {
                    for (let i = 0; i < 12; i++) {
                        const a = (i / 12) * Math.PI * 2 + this.time.now * 0.002;
                        this.createBullet(this.boss.x, this.boss.y, Math.cos(a) * 180, Math.sin(a) * 180, 1, 0x88ffff, true);
                    }
                }

                if (this.boss.phase >= 3) {
                    for (let i = 0; i < 20; i++) {
                        const a = (i / 20) * Math.PI * 2 + this.time.now * 0.003;
                        this.createBullet(this.boss.x, this.boss.y, Math.cos(a) * 150, Math.sin(a) * 150, 1, 0xaaffff, true);
                    }
                }
                break;
        }
    }

    onBossDeath() {
        this.totalKills++;
        this.debris += 500 * this.floor;

        // Hide boss HP bar
        this.bossHpBg.setVisible(false);
        this.bossHpBar.setVisible(false);
        this.bossHpBorder.setVisible(false);
        this.bossNameText.setVisible(false);

        // Death effect
        for (let i = 0; i < 30; i++) {
            const p = this.add.circle(this.boss.x, this.boss.y, 6, this.boss.color);
            const angle = Math.random() * Math.PI * 2;
            this.tweens.add({
                targets: p,
                x: this.boss.x + Math.cos(angle) * 150,
                y: this.boss.y + Math.sin(angle) * 150,
                alpha: 0,
                duration: 800,
                onComplete: () => p.destroy()
            });
        }

        this.cameras.main.shake(500, 0.015);

        this.bossGraphics.destroy();
        this.boss = null;
        this.inBossFight = false;
        this.getCurrentRoom().cleared = true;

        // Advance floor
        this.floor++;
        if (this.floor > 3) {
            this.scene.start('VictoryScene', {
                debris: this.debris,
                kills: this.totalKills,
                maxCombo: this.maxCombo
            });
        } else {
            this.room = { x: 2, y: 2 };
            this.generateFloor();
            this.player.x = 400;
            this.player.y = 480;
            this.drawRoom();
            this.drawMinimap();
        }
    }

    updateBullets(delta) {
        const dt = delta / 1000;

        // Player bullets
        this.playerBullets.getChildren().forEach(bullet => {
            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;

            if (bullet.glow) {
                bullet.glow.x = bullet.x;
                bullet.glow.y = bullet.y;
            }

            if (bullet.x < 0 || bullet.x > 800 || bullet.y < 50 || bullet.y > 550) {
                if (bullet.glow) bullet.glow.destroy();
                bullet.destroy();
            }
        });

        // Enemy bullets
        this.enemyBullets.getChildren().forEach(bullet => {
            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;

            if (bullet.x < 0 || bullet.x > 800 || bullet.y < 50 || bullet.y > 550) {
                bullet.destroy();
            }
        });
    }

    checkCollisions() {
        // Player bullets vs enemies
        this.playerBullets.getChildren().forEach(bullet => {
            this.enemies.getChildren().forEach(enemy => {
                if (Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y) < enemy.size + 5) {
                    enemy.hp -= bullet.damage;
                    if (!bullet.pierce) {
                        if (bullet.glow) bullet.glow.destroy();
                        bullet.destroy();
                    }
                }
            });

            // vs boss
            if (this.boss && !this.boss.invulnerable) {
                if (Phaser.Math.Distance.Between(bullet.x, bullet.y, this.boss.x, this.boss.y) < 55) {
                    this.boss.hp -= bullet.damage;
                    if (!bullet.pierce) {
                        if (bullet.glow) bullet.glow.destroy();
                        bullet.destroy();
                    }
                }
            }
        });

        // Enemy bullets vs player
        const playerHitRadius = this.player.focusing ? 3 : 12;
        this.enemyBullets.getChildren().forEach(bullet => {
            if (Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y) < playerHitRadius + 6) {
                if (!this.player.invulnerable && this.player.iFrames <= 0) {
                    if (this.player.shields > 0) {
                        this.player.shields--;
                    } else {
                        this.player.hp--;
                        this.player.invulnerable = true;
                        this.player.invulnerableTimer = 1000;
                        this.multiplier = Math.max(1.0, this.multiplier - 0.5);
                        this.combo = 0;
                        this.cameras.main.shake(150, 0.008);
                        this.drawHealth();
                    }
                    bullet.destroy();
                }
            }
        });

        // Enemies vs player (contact damage)
        this.enemies.getChildren().forEach(enemy => {
            if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) < enemy.size + 12) {
                if (!this.player.invulnerable && this.player.iFrames <= 0) {
                    this.player.hp--;
                    this.player.invulnerable = true;
                    this.player.invulnerableTimer = 1000;
                    this.multiplier = Math.max(1.0, this.multiplier - 0.5);
                    this.combo = 0;
                    this.cameras.main.shake(150, 0.008);
                    this.drawHealth();
                }
            }
        });
    }

    updateHUD() {
        const weapon = WEAPONS[this.player.currentWeapon];
        this.weaponText.setText(weapon.name);
        this.weaponText.setColor('#' + weapon.color.toString(16).padStart(6, '0'));

        const ammoStr = weapon.maxAmmo === Infinity ? '∞' : this.player.ammo.toString();
        this.ammoText.setText(ammoStr + (this.player.weaponKeyword ? ' ' + KEYWORDS[this.player.weaponKeyword].name : ''));

        this.multiplierText.setText('X' + this.multiplier.toFixed(1));
        this.multiplierText.setColor(this.multiplier > 2 ? '#dd6622' : '#22cc44');
        this.debrisText.setText(this.debris + 'G');

        this.floorText.setText(`FLOOR ${this.floor} | WAVE ${this.wave}`);

        if (this.combo > 0) {
            this.comboText.setText(`${this.combo}x COMBO`);
            this.comboText.setColor(this.combo > 10 ? '#dd6622' : '#ffffff');
        } else {
            this.comboText.setText('');
        }
    }
}

// Game Over Scene
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.stats = data;
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bg);

        this.add.text(400, 180, 'GAME OVER', {
            fontSize: '52px',
            fontFamily: 'monospace',
            color: '#cc3333'
        }).setOrigin(0.5);

        this.add.text(400, 280, `Floor: ${this.stats.floor}`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(400, 310, `Debris: ${this.stats.debris}G`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(400, 340, `Total Kills: ${this.stats.kills}`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(400, 370, `Max Combo: ${this.stats.maxCombo}`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(400, 460, 'Press R to Restart', {
            fontSize: '22px',
            fontFamily: 'monospace',
            color: '#22cc44'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-R', () => this.scene.start('MenuScene'));
    }
}

// Victory Scene
class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    init(data) {
        this.stats = data;
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bg);

        this.add.text(400, 160, 'VICTORY!', {
            fontSize: '52px',
            fontFamily: 'monospace',
            color: '#22cc44'
        }).setOrigin(0.5);

        this.add.text(400, 230, 'You have escaped the facility!', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(400, 300, `Final Debris: ${this.stats.debris}G`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(400, 330, `Total Kills: ${this.stats.kills}`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(400, 360, `Max Combo: ${this.stats.maxCombo}`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(400, 460, 'Press R to Play Again', {
            fontSize: '22px',
            fontFamily: 'monospace',
            color: '#dd6622'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-R', () => this.scene.start('MenuScene'));

        // Celebration particles
        this.time.addEvent({
            delay: 200,
            callback: () => {
                const x = Phaser.Math.Between(100, 700);
                const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
                const p = this.add.circle(x, 600, 5, Phaser.Utils.Array.GetRandom(colors));
                this.tweens.add({
                    targets: p,
                    y: -50,
                    alpha: 0,
                    duration: 2000,
                    onComplete: () => p.destroy()
                });
            },
            repeat: -1
        });
    }
}

// Game Config
const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a14',
    scene: [BootScene, MenuScene, GameScene, GameOverScene, VictoryScene],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    render: {
        pixelArt: false,
        antialias: true
    }
};

const game = new Phaser.Game(config);
