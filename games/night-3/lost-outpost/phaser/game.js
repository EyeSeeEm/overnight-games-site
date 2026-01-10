// Lost Outpost - Phaser 3 Version
// Top-down survival horror shooter inspired by Alien Breed

const TILE_SIZE = 32;
const MAP_WIDTH = 30;
const MAP_HEIGHT = 25;

const COLORS = {
    FLOOR: 0x1a1a1a,
    FLOOR_HEX: 0x1f1f1f,
    FLOOR_GRATE: 0x252525,
    WALL: 0x333333,
    WALL_HIGHLIGHT: 0x444444,
    WALL_SHADOW: 0x1a1a1a,
    HAZARD_YELLOW: 0xccaa00,
    HAZARD_BLACK: 0x111111,
    DOOR: 0x444455,
    DOOR_LOCKED: 0x553333,
    UI_BG: 0x0a1a1a,
    UI_BORDER: 0x0a4a4a,
    UI_TEXT: 0x00cccc,
    UI_TEXT_DIM: 0x006666,
    HEALTH_BG: 0x330000,
    HEALTH: 0xcc0000,
    AMMO: 0x00cc00,
    PLAYER: 0x446688,
    ALIEN: 0x44aa44,
    ALIEN_EYES: 0xff0000,
    BULLET: 0xffff00,
    MUZZLE_FLASH: 0xffaa00
};

const TERRAIN = {
    FLOOR: 0, WALL: 1, DOOR: 2, TERMINAL: 3, VENT: 4,
    HAZARD_FLOOR: 5, CRATE: 6, BARREL: 7
};

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.gameState = 'playing';
        this.tick = 0;

        // Player data
        this.playerData = {
            hp: 100, maxHp: 100,
            lives: 3,
            credits: 0,
            rank: 1, xp: 0, xpToNext: 1000,
            weapon: {
                name: 'Assault Rifle',
                damage: 10,
                fireRate: 8,
                ammo: 68,
                maxAmmo: 300,
                clipSize: 30,
                clip: 30,
                reloading: false,
                reloadTime: 0
            },
            cooldown: 0,
            invincible: 0
        };

        // Create graphics
        this.mapGraphics = this.add.graphics();
        this.flashlightGraphics = this.add.graphics();

        // Create groups
        this.bulletsGroup = this.add.group();
        this.enemiesGroup = this.add.group();
        this.itemsGroup = this.add.group();
        this.particlesGroup = this.add.group();

        // Generate level
        this.map = [];
        this.enemies = [];
        this.items = [];
        this.bullets = [];
        this.particles = [];
        this.generateLevel();

        // Create player
        this.player = this.add.graphics();
        this.player.x = 320;
        this.player.y = 400;
        this.playerAngle = 0;

        // Set up camera
        this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
        this.cameras.main.startFollow({ x: this.player.x, y: this.player.y }, true, 0.1, 0.1);

        // Input
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            reload: Phaser.Input.Keyboard.KeyCodes.R
        });

        this.input.on('pointermove', (pointer) => {
            this.mouseX = pointer.worldX;
            this.mouseY = pointer.worldY;
        });

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.mouseDown = true;
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (!pointer.leftButtonDown()) {
                this.mouseDown = false;
            }
        });

        this.mouseX = this.player.x;
        this.mouseY = this.player.y;
        this.mouseDown = false;

        // Create UI (fixed to camera)
        this.createUI();

        // Draw initial map
        this.drawMap();

        // Expose for testing
        window.player = this.playerData;
        window.gameState = { state: this.gameState };
        const self = this;
        Object.defineProperty(window, 'enemies', { get: () => self.enemies, configurable: true });
        Object.defineProperty(window, 'items', { get: () => self.items, configurable: true });
    }

    generateLevel() {
        this.map = [];

        // Fill with floor
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.map[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                const pattern = (x + y) % 2;
                this.map[y][x] = { terrain: TERRAIN.FLOOR, variant: pattern };
            }
        }

        // Border walls
        for (let x = 0; x < MAP_WIDTH; x++) {
            this.map[0][x] = { terrain: TERRAIN.WALL, variant: 0 };
            this.map[MAP_HEIGHT - 1][x] = { terrain: TERRAIN.WALL, variant: 0 };
        }
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.map[y][0] = { terrain: TERRAIN.WALL, variant: 0 };
            this.map[y][MAP_WIDTH - 1] = { terrain: TERRAIN.WALL, variant: 0 };
        }

        // Horizontal corridor
        for (let x = 1; x < MAP_WIDTH - 1; x++) {
            for (let dy = 0; dy < 5; dy++) {
                this.map[10 + dy][x] = { terrain: TERRAIN.FLOOR, variant: (x + dy) % 2 };
            }
            if (x % 6 < 3) {
                this.map[10][x] = { terrain: TERRAIN.HAZARD_FLOOR, variant: 0 };
                this.map[14][x] = { terrain: TERRAIN.HAZARD_FLOOR, variant: 0 };
            }
        }

        // Vertical corridors
        for (let y = 1; y < MAP_HEIGHT - 1; y++) {
            for (let dx = 0; dx < 4; dx++) {
                this.map[y][8 + dx] = { terrain: TERRAIN.FLOOR, variant: (y + dx) % 2 };
                this.map[y][20 + dx] = { terrain: TERRAIN.FLOOR, variant: (y + dx) % 2 };
            }
        }

        // Rooms
        const rooms = [
            { x: 2, y: 2, w: 5, h: 5 },
            { x: 23, y: 2, w: 5, h: 5 },
            { x: 2, y: 18, w: 5, h: 5 },
            { x: 23, y: 18, w: 5, h: 5 },
            { x: 12, y: 2, w: 6, h: 5 },
            { x: 12, y: 18, w: 6, h: 5 }
        ];

        for (const room of rooms) {
            for (let dy = 0; dy < room.h; dy++) {
                for (let dx = 0; dx < room.w; dx++) {
                    this.map[room.y + dy][room.x + dx] = {
                        terrain: TERRAIN.FLOOR,
                        variant: (room.x + dx + room.y + dy) % 2
                    };
                }
            }
        }

        // Doors
        this.map[12][1] = { terrain: TERRAIN.DOOR, variant: 0, locked: false };
        this.map[12][MAP_WIDTH - 2] = { terrain: TERRAIN.DOOR, variant: 0, locked: true };
        this.map[6][10] = { terrain: TERRAIN.DOOR, variant: 1, locked: false };
        this.map[18][10] = { terrain: TERRAIN.DOOR, variant: 1, locked: false };

        // Vents
        this.map[3][3] = { terrain: TERRAIN.VENT, variant: 0 };
        this.map[3][26] = { terrain: TERRAIN.VENT, variant: 0 };
        this.map[21][3] = { terrain: TERRAIN.VENT, variant: 0 };
        this.map[21][26] = { terrain: TERRAIN.VENT, variant: 0 };

        // Terminal
        this.map[4][14] = { terrain: TERRAIN.TERMINAL, variant: 0 };

        // Crates and barrels
        const cratePositions = [
            { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 25, y: 4 },
            { x: 4, y: 20 }, { x: 25, y: 20 }, { x: 26, y: 20 }
        ];
        for (const pos of cratePositions) {
            this.map[pos.y][pos.x] = { terrain: TERRAIN.CRATE, variant: Math.floor(Math.random() * 2) };
        }

        const barrelPositions = [
            { x: 13, y: 4 }, { x: 16, y: 4 }, { x: 14, y: 20 }
        ];
        for (const pos of barrelPositions) {
            this.map[pos.y][pos.x] = { terrain: TERRAIN.BARREL, variant: 0 };
        }

        // Spawn enemies
        this.enemies = [];
        const enemySpawns = [
            { x: 4, y: 4, type: 'scorpion' },
            { x: 25, y: 4, type: 'scorpion' },
            { x: 4, y: 20, type: 'scorpion' },
            { x: 25, y: 20, type: 'scorpion' },
            { x: 15, y: 3, type: 'scorpion_small' },
            { x: 15, y: 21, type: 'scorpion_small' },
            { x: 15, y: 12, type: 'arachnid' }
        ];

        const enemyStats = {
            scorpion: { hp: 30, speed: 60, damage: 15, xp: 50, color: COLORS.ALIEN },
            scorpion_small: { hp: 15, speed: 80, damage: 8, xp: 25, color: 0x338833 },
            arachnid: { hp: 80, speed: 40, damage: 25, xp: 100, color: 0x226622 }
        };

        for (const spawn of enemySpawns) {
            const stats = enemyStats[spawn.type];
            this.enemies.push({
                x: spawn.x * TILE_SIZE + TILE_SIZE / 2,
                y: spawn.y * TILE_SIZE + TILE_SIZE / 2,
                type: spawn.type,
                hp: stats.hp, maxHp: stats.hp,
                speed: stats.speed,
                damage: stats.damage,
                xp: stats.xp,
                color: stats.color,
                state: 'patrol',
                attackCooldown: 0,
                angle: Math.random() * Math.PI * 2
            });
        }

        // Spawn items
        this.items = [];
        this.items.push({ x: 100, y: 100, type: 'ammo', amount: 30 });
        this.items.push({ x: 200, y: 400, type: 'health', amount: 25 });
        this.items.push({ x: 600, y: 200, type: 'credits', amount: 500 });
        this.items.push({ x: 800, y: 600, type: 'ammo', amount: 50 });
        this.items.push({ x: 500, y: 300, type: 'keycard', color: 'yellow' });

        this.bullets = [];
        this.particles = [];
    }

    drawMap() {
        this.mapGraphics.clear();

        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const tile = this.map[y][x];
                const screenX = x * TILE_SIZE;
                const screenY = y * TILE_SIZE;
                this.drawTile(tile, screenX, screenY, x, y);
            }
        }
    }

    drawTile(tile, screenX, screenY, tileX, tileY) {
        switch (tile.terrain) {
            case TERRAIN.FLOOR:
                this.mapGraphics.fillStyle(tile.variant === 0 ? COLORS.FLOOR : COLORS.FLOOR_HEX);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.mapGraphics.fillStyle(COLORS.FLOOR_GRATE);
                this.mapGraphics.fillRect(screenX + 4, screenY + 4, 8, 1);
                this.mapGraphics.fillRect(screenX + 20, screenY + 20, 8, 1);
                this.mapGraphics.fillRect(screenX + 4, screenY + 26, 8, 1);
                break;

            case TERRAIN.HAZARD_FLOOR:
                this.mapGraphics.fillStyle(COLORS.FLOOR);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                for (let i = 0; i < 8; i++) {
                    this.mapGraphics.fillStyle(COLORS.HAZARD_YELLOW);
                    this.mapGraphics.fillRect(screenX + i * 8, screenY + 2, 4, TILE_SIZE - 4);
                    this.mapGraphics.fillStyle(COLORS.HAZARD_BLACK);
                    this.mapGraphics.fillRect(screenX + i * 8 + 4, screenY + 2, 4, TILE_SIZE - 4);
                }
                break;

            case TERRAIN.WALL:
                this.mapGraphics.fillStyle(COLORS.WALL);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.mapGraphics.fillStyle(COLORS.WALL_HIGHLIGHT);
                this.mapGraphics.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, 2);
                this.mapGraphics.fillRect(screenX + 2, screenY + 2, 2, TILE_SIZE - 4);
                this.mapGraphics.fillStyle(COLORS.WALL_SHADOW);
                this.mapGraphics.fillRect(screenX + 2, screenY + TILE_SIZE - 4, TILE_SIZE - 4, 2);
                this.mapGraphics.fillRect(screenX + TILE_SIZE - 4, screenY + 2, 2, TILE_SIZE - 4);
                if ((tileX + tileY) % 3 === 0) {
                    this.mapGraphics.fillStyle(COLORS.FLOOR_GRATE);
                    this.mapGraphics.fillRect(screenX + 8, screenY + 12, 16, 8);
                    this.mapGraphics.fillStyle(0x0a0a0a);
                    this.mapGraphics.fillRect(screenX + 10, screenY + 14, 3, 4);
                    this.mapGraphics.fillRect(screenX + 15, screenY + 14, 3, 4);
                    this.mapGraphics.fillRect(screenX + 20, screenY + 14, 3, 4);
                }
                break;

            case TERRAIN.DOOR:
                this.mapGraphics.fillStyle(COLORS.FLOOR);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.mapGraphics.fillStyle(tile.locked ? COLORS.DOOR_LOCKED : COLORS.DOOR);
                if (tile.variant === 0) {
                    this.mapGraphics.fillRect(screenX, screenY + 10, TILE_SIZE, 12);
                    this.mapGraphics.fillStyle(tile.locked ? 0xff0000 : 0x00ff00);
                    this.mapGraphics.fillRect(screenX + 14, screenY + 14, 4, 4);
                } else {
                    this.mapGraphics.fillRect(screenX + 10, screenY, 12, TILE_SIZE);
                    this.mapGraphics.fillStyle(tile.locked ? 0xff0000 : 0x00ff00);
                    this.mapGraphics.fillRect(screenX + 14, screenY + 14, 4, 4);
                }
                break;

            case TERRAIN.VENT:
                this.mapGraphics.fillStyle(COLORS.FLOOR);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.mapGraphics.fillStyle(0x1a1a1a);
                this.mapGraphics.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                this.mapGraphics.fillStyle(0x333333);
                for (let i = 0; i < 4; i++) {
                    this.mapGraphics.fillRect(screenX + 6 + i * 6, screenY + 4, 2, TILE_SIZE - 8);
                }
                break;

            case TERRAIN.TERMINAL:
                this.mapGraphics.fillStyle(COLORS.FLOOR);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.mapGraphics.fillStyle(0x333340);
                this.mapGraphics.fillRect(screenX + 4, screenY + 8, TILE_SIZE - 8, TILE_SIZE - 12);
                this.mapGraphics.fillStyle(0x003344);
                this.mapGraphics.fillRect(screenX + 6, screenY + 10, TILE_SIZE - 12, 12);
                this.mapGraphics.fillStyle(0x00cccc);
                this.mapGraphics.fillRect(screenX + 8, screenY + 12, TILE_SIZE - 16, 2);
                this.mapGraphics.fillRect(screenX + 8, screenY + 16, TILE_SIZE - 16, 2);
                break;

            case TERRAIN.CRATE:
                this.mapGraphics.fillStyle(COLORS.FLOOR);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.mapGraphics.fillStyle(0x5a4a30);
                this.mapGraphics.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                this.mapGraphics.fillStyle(0x4a3a20);
                this.mapGraphics.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, 2);
                this.mapGraphics.fillRect(screenX + 4, screenY + TILE_SIZE - 8, TILE_SIZE - 8, 2);
                this.mapGraphics.fillRect(screenX + 4, screenY + 14, TILE_SIZE - 8, 2);
                break;

            case TERRAIN.BARREL:
                this.mapGraphics.fillStyle(COLORS.FLOOR);
                this.mapGraphics.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
                this.mapGraphics.fillStyle(0x334455);
                this.mapGraphics.fillCircle(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 12);
                this.mapGraphics.fillStyle(0x223344);
                this.mapGraphics.fillCircle(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 8);
                this.mapGraphics.fillStyle(COLORS.HAZARD_YELLOW);
                this.mapGraphics.fillRect(screenX + 12, screenY + 12, 8, 8);
                break;
        }
    }

    createUI() {
        this.uiContainer = this.add.container(0, 0);
        this.uiContainer.setScrollFactor(0);
        this.uiContainer.setDepth(100);

        // Top-left: Rank/XP and Lives
        const topLeftBg = this.add.graphics();
        topLeftBg.fillStyle(COLORS.UI_BG, 1);
        topLeftBg.fillRect(10, 10, 120, 50);
        topLeftBg.lineStyle(2, COLORS.UI_BORDER);
        topLeftBg.strokeRect(10, 10, 120, 50);
        this.uiContainer.add(topLeftBg);

        this.rankText = this.add.text(18, 16, 'RANK/XP', {
            fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00cccc'
        });
        this.uiContainer.add(this.rankText);

        this.rankValueText = this.add.text(80, 16, '1/0', {
            fontSize: '11px', fontFamily: 'Arial', color: '#006666'
        });
        this.uiContainer.add(this.rankValueText);

        this.livesText = this.add.text(18, 38, 'LIVES', {
            fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00cccc'
        });
        this.uiContainer.add(this.livesText);

        this.livesValueText = this.add.text(70, 38, '3', {
            fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold', color: '#cc0000'
        });
        this.uiContainer.add(this.livesValueText);

        // Bottom-center: Health and Credits
        const bottomCenterBg = this.add.graphics();
        bottomCenterBg.fillStyle(COLORS.UI_BG, 1);
        bottomCenterBg.fillRect(200, this.scale.height - 50, 240, 40);
        bottomCenterBg.lineStyle(2, COLORS.UI_BORDER);
        bottomCenterBg.strokeRect(200, this.scale.height - 50, 240, 40);
        this.uiContainer.add(bottomCenterBg);

        // Health bar background
        this.healthBarBg = this.add.graphics();
        this.healthBarBg.fillStyle(COLORS.HEALTH_BG, 1);
        this.healthBarBg.fillRect(210, this.scale.height - 42, 150, 12);
        this.healthBarBg.lineStyle(1, 0x440000);
        this.healthBarBg.strokeRect(210, this.scale.height - 42, 150, 12);
        this.uiContainer.add(this.healthBarBg);

        this.healthBar = this.add.graphics();
        this.uiContainer.add(this.healthBar);

        this.creditsText = this.add.text(370, this.scale.height - 32, '$0', {
            fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00cccc'
        });
        this.uiContainer.add(this.creditsText);

        // Bottom-right: Weapon and Ammo
        const bottomRightBg = this.add.graphics();
        bottomRightBg.fillStyle(COLORS.UI_BG, 1);
        bottomRightBg.fillRect(this.scale.width - 140, this.scale.height - 60, 130, 50);
        bottomRightBg.lineStyle(2, COLORS.UI_BORDER);
        bottomRightBg.strokeRect(this.scale.width - 140, this.scale.height - 60, 130, 50);
        // Weapon icon
        bottomRightBg.fillStyle(0x555555, 1);
        bottomRightBg.fillRect(this.scale.width - 130, this.scale.height - 50, 30, 12);
        this.uiContainer.add(bottomRightBg);

        this.ammoText = this.add.text(this.scale.width - 90, this.scale.height - 48, '30 | 68', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00cc00'
        });
        this.uiContainer.add(this.ammoText);

        this.weaponNameText = this.add.text(this.scale.width - 130, this.scale.height - 30, 'Assault Rifle', {
            fontSize: '10px', fontFamily: 'Arial', color: '#006666'
        });
        this.uiContainer.add(this.weaponNameText);

        this.reloadBar = this.add.graphics();
        this.uiContainer.add(this.reloadBar);
    }

    updateUI() {
        this.rankValueText.setText(`${this.playerData.rank}/${this.playerData.xp}`);

        this.livesValueText.setText(String(Math.max(0, this.playerData.lives)));

        // Health bar
        this.healthBar.clear();
        this.healthBar.fillStyle(COLORS.HEALTH, 1);
        this.healthBar.fillRect(210, this.scale.height - 42, 150 * (this.playerData.hp / this.playerData.maxHp), 12);

        this.creditsText.setText(`$${this.playerData.credits}`);

        // Ammo
        const weapon = this.playerData.weapon;
        if (weapon.reloading) {
            this.ammoText.setText('RELOAD');
            this.ammoText.setColor('#ff8800');
        } else {
            this.ammoText.setText(`${weapon.clip} | ${weapon.ammo}`);
            this.ammoText.setColor('#00cc00');
        }

        // Reload bar
        this.reloadBar.clear();
        if (weapon.reloading) {
            const progress = 1 - (weapon.reloadTime / 1.5);
            this.reloadBar.fillStyle(0xff8800, 0.5);
            this.reloadBar.fillRect(210, this.scale.height - 28, 150 * progress, 4);
        }
    }

    update(time, delta) {
        if (this.gameState !== 'playing') return;

        const dt = delta / 1000;
        this.tick++;

        this.updatePlayer(dt);
        this.updateEnemies(dt);
        this.updateBullets(dt);
        this.updateParticles(dt);
        this.updateUI();

        // Redraw dynamic elements
        this.drawDynamicElements();

        // Check lose condition
        if (this.playerData.hp <= 0) {
            this.playerData.lives--;
            if (this.playerData.lives <= 0) {
                this.gameState = 'gameover';
                window.gameState.state = 'gameover';
                this.showGameOver();
            } else {
                this.playerData.hp = this.playerData.maxHp;
                this.player.x = 320;
                this.player.y = 400;
                this.playerData.invincible = 2;
            }
        }

        // Update camera target
        this.cameras.main.centerOn(this.player.x, this.player.y);
    }

    updatePlayer(dt) {
        let dx = 0, dy = 0;
        const speed = 120;

        if (this.cursors.up.isDown) dy = -1;
        if (this.cursors.down.isDown) dy = 1;
        if (this.cursors.left.isDown) dx = -1;
        if (this.cursors.right.isDown) dx = 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len; dy /= len;

            const newX = this.player.x + dx * speed * dt;
            const newY = this.player.y + dy * speed * dt;

            if (this.canMove(newX, this.player.y, 20, 20)) this.player.x = newX;
            if (this.canMove(this.player.x, newY, 20, 20)) this.player.y = newY;
        }

        // Aim at mouse
        this.playerAngle = Math.atan2(this.mouseY - this.player.y, this.mouseX - this.player.x);

        // Shooting
        const weapon = this.playerData.weapon;
        if (this.mouseDown && this.playerData.cooldown <= 0 && !weapon.reloading) {
            if (weapon.clip > 0) {
                this.shoot();
                this.playerData.cooldown = 1 / weapon.fireRate;
                weapon.clip--;

                if (weapon.clip === 0 && weapon.ammo > 0) {
                    this.startReload();
                }
            } else if (weapon.ammo > 0) {
                this.startReload();
            }
        }

        if (this.playerData.cooldown > 0) this.playerData.cooldown -= dt;

        // Reload key
        if (Phaser.Input.Keyboard.JustDown(this.cursors.reload) &&
            !weapon.reloading && weapon.clip < weapon.clipSize && weapon.ammo > 0) {
            this.startReload();
        }

        if (weapon.reloading) {
            weapon.reloadTime -= dt;
            if (weapon.reloadTime <= 0) {
                const needed = weapon.clipSize - weapon.clip;
                const reload = Math.min(needed, weapon.ammo);
                weapon.clip += reload;
                weapon.ammo -= reload;
                weapon.reloading = false;
            }
        }

        // Interact with items
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
            if (dist < 24) {
                this.pickupItem(item);
                this.items.splice(i, 1);
            }
        }

        // Invincibility frames
        if (this.playerData.invincible > 0) this.playerData.invincible -= dt;
    }

    startReload() {
        this.playerData.weapon.reloading = true;
        this.playerData.weapon.reloadTime = 1.5;
    }

    shoot() {
        const spread = 0.05;
        const angle = this.playerAngle + (Math.random() - 0.5) * spread;

        this.bullets.push({
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * 500,
            vy: Math.sin(angle) * 500,
            damage: this.playerData.weapon.damage,
            owner: 'player',
            life: 2
        });

        // Muzzle flash particle
        this.particles.push({
            x: this.player.x + Math.cos(this.playerAngle) * 15,
            y: this.player.y + Math.sin(this.playerAngle) * 15,
            type: 'muzzle',
            life: 0.1
        });

        // Screen shake
        this.cameras.main.shake(50, 0.002);
    }

    updateEnemies(dt) {
        for (const enemy of this.enemies) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);

            if (enemy.state === 'patrol') {
                enemy.x += Math.cos(enemy.angle) * enemy.speed * 0.3 * dt;
                enemy.y += Math.sin(enemy.angle) * enemy.speed * 0.3 * dt;

                if (Math.random() < 0.01) {
                    enemy.angle += (Math.random() - 0.5) * Math.PI;
                }

                if (dist < 150) {
                    enemy.state = 'chase';
                }
            } else if (enemy.state === 'chase') {
                const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
                enemy.angle = angle;

                const newX = enemy.x + Math.cos(angle) * enemy.speed * dt;
                const newY = enemy.y + Math.sin(angle) * enemy.speed * dt;

                if (this.canMove(newX, enemy.y, 16, 16)) enemy.x = newX;
                if (this.canMove(enemy.x, newY, 16, 16)) enemy.y = newY;

                if (dist < 25 && enemy.attackCooldown <= 0 && this.playerData.invincible <= 0) {
                    this.playerData.hp -= enemy.damage;
                    enemy.attackCooldown = 1;
                    this.cameras.main.shake(100, 0.005);

                    // Blood particles
                    for (let i = 0; i < 5; i++) {
                        this.particles.push({
                            x: this.player.x,
                            y: this.player.y,
                            vx: (Math.random() - 0.5) * 100,
                            vy: (Math.random() - 0.5) * 100,
                            type: 'blood',
                            life: 0.5
                        });
                    }
                }

                if (dist > 300) {
                    enemy.state = 'patrol';
                }
            }

            if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;

            // Keep in bounds
            const tileX = Math.floor(enemy.x / TILE_SIZE);
            const tileY = Math.floor(enemy.y / TILE_SIZE);
            if (tileX < 1 || tileX >= MAP_WIDTH - 1 || tileY < 1 || tileY >= MAP_HEIGHT - 1) {
                enemy.angle += Math.PI;
            }
        }
    }

    updateBullets(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;
            bullet.life -= dt;

            // Wall collision
            const tileX = Math.floor(bullet.x / TILE_SIZE);
            const tileY = Math.floor(bullet.y / TILE_SIZE);
            if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
                this.bullets.splice(i, 1);
                continue;
            }

            const tile = this.map[tileY]?.[tileX];
            if (tile && (tile.terrain === TERRAIN.WALL || tile.terrain === TERRAIN.CRATE)) {
                this.particles.push({
                    x: bullet.x,
                    y: bullet.y,
                    type: 'spark',
                    life: 0.2
                });
                this.bullets.splice(i, 1);
                continue;
            }

            // Enemy collision
            if (bullet.owner === 'player') {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y) < 16) {
                        enemy.hp -= bullet.damage;
                        enemy.state = 'chase';

                        // Blood particles
                        for (let k = 0; k < 3; k++) {
                            this.particles.push({
                                x: enemy.x,
                                y: enemy.y,
                                vx: (Math.random() - 0.5) * 80,
                                vy: (Math.random() - 0.5) * 80,
                                type: 'alienblood',
                                life: 0.4
                            });
                        }

                        if (enemy.hp <= 0) {
                            this.playerData.xp += enemy.xp;
                            this.playerData.credits += Math.floor(Math.random() * 50) + 10;

                            if (this.playerData.xp >= this.playerData.xpToNext) {
                                this.playerData.rank++;
                                this.playerData.xp -= this.playerData.xpToNext;
                                this.playerData.xpToNext = Math.floor(this.playerData.xpToNext * 1.5);
                            }

                            if (Math.random() < 0.3) {
                                this.items.push({
                                    x: enemy.x,
                                    y: enemy.y,
                                    type: Math.random() < 0.5 ? 'ammo' : 'health',
                                    amount: Math.random() < 0.5 ? 15 : 10
                                });
                            }

                            this.enemies.splice(j, 1);
                        }

                        this.bullets.splice(i, 1);
                        break;
                    }
                }
            }

            if (bullet.life <= 0) {
                this.bullets.splice(i, 1);
            }
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;

            if (p.vx !== undefined) {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= 0.95;
                p.vy *= 0.95;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    pickupItem(item) {
        const weapon = this.playerData.weapon;
        switch (item.type) {
            case 'ammo':
                weapon.ammo = Math.min(weapon.maxAmmo, weapon.ammo + item.amount);
                break;
            case 'health':
                this.playerData.hp = Math.min(this.playerData.maxHp, this.playerData.hp + item.amount);
                break;
            case 'credits':
                this.playerData.credits += item.amount;
                break;
            case 'keycard':
                for (let y = 0; y < MAP_HEIGHT; y++) {
                    for (let x = 0; x < MAP_WIDTH; x++) {
                        if (this.map[y][x].terrain === TERRAIN.DOOR && this.map[y][x].locked) {
                            this.map[y][x].locked = false;
                        }
                    }
                }
                this.drawMap();
                break;
        }
    }

    canMove(x, y, w, h) {
        const margin = 2;
        const tiles = [
            { x: Math.floor((x - w / 2 + margin) / TILE_SIZE), y: Math.floor((y - h / 2 + margin) / TILE_SIZE) },
            { x: Math.floor((x + w / 2 - margin) / TILE_SIZE), y: Math.floor((y - h / 2 + margin) / TILE_SIZE) },
            { x: Math.floor((x - w / 2 + margin) / TILE_SIZE), y: Math.floor((y + h / 2 - margin) / TILE_SIZE) },
            { x: Math.floor((x + w / 2 - margin) / TILE_SIZE), y: Math.floor((y + h / 2 - margin) / TILE_SIZE) }
        ];

        for (const tile of tiles) {
            if (tile.x < 0 || tile.x >= MAP_WIDTH || tile.y < 0 || tile.y >= MAP_HEIGHT) return false;
            const t = this.map[tile.y][tile.x];
            if (t.terrain === TERRAIN.WALL || t.terrain === TERRAIN.CRATE ||
                t.terrain === TERRAIN.BARREL || (t.terrain === TERRAIN.DOOR && t.locked)) {
                return false;
            }
        }
        return true;
    }

    drawDynamicElements() {
        // Clear and redraw flashlight
        this.flashlightGraphics.clear();

        // Draw items
        for (const item of this.items) {
            const pulse = Math.sin(this.tick * 0.1) * 0.3 + 0.7;

            switch (item.type) {
                case 'ammo':
                    this.flashlightGraphics.fillStyle(0x00c800, pulse * 0.3);
                    this.flashlightGraphics.fillCircle(item.x, item.y, 12);
                    this.flashlightGraphics.fillStyle(COLORS.AMMO, 1);
                    this.flashlightGraphics.fillRect(item.x - 6, item.y - 4, 12, 8);
                    this.flashlightGraphics.fillStyle(0x005500, 1);
                    this.flashlightGraphics.fillRect(item.x - 4, item.y - 2, 3, 4);
                    this.flashlightGraphics.fillRect(item.x + 1, item.y - 2, 3, 4);
                    break;

                case 'health':
                    this.flashlightGraphics.fillStyle(0xc80000, pulse * 0.3);
                    this.flashlightGraphics.fillCircle(item.x, item.y, 12);
                    this.flashlightGraphics.fillStyle(0xcc0000, 1);
                    this.flashlightGraphics.fillRect(item.x - 6, item.y - 2, 12, 4);
                    this.flashlightGraphics.fillRect(item.x - 2, item.y - 6, 4, 12);
                    break;

                case 'credits':
                    this.flashlightGraphics.fillStyle(0xc8c800, pulse * 0.3);
                    this.flashlightGraphics.fillCircle(item.x, item.y, 12);
                    this.flashlightGraphics.fillStyle(0xcccc00, 1);
                    this.flashlightGraphics.fillCircle(item.x, item.y, 6);
                    break;

                case 'keycard':
                    this.flashlightGraphics.fillStyle(0xc8c800, pulse * 0.3);
                    this.flashlightGraphics.fillCircle(item.x, item.y, 15);
                    this.flashlightGraphics.fillStyle(0xccaa00, 1);
                    this.flashlightGraphics.fillRect(item.x - 8, item.y - 5, 16, 10);
                    this.flashlightGraphics.fillStyle(0x886600, 1);
                    this.flashlightGraphics.fillRect(item.x - 6, item.y - 3, 4, 6);
                    break;
            }
        }

        // Draw bullets
        for (const bullet of this.bullets) {
            this.flashlightGraphics.fillStyle(COLORS.BULLET, 1);
            this.flashlightGraphics.fillCircle(bullet.x, bullet.y, 3);
            this.flashlightGraphics.fillStyle(0xffc800, 0.5);
            this.flashlightGraphics.fillCircle(bullet.x - bullet.vx * 0.02, bullet.y - bullet.vy * 0.02, 2);
        }

        // Draw enemies
        for (const enemy of this.enemies) {
            // Shadow
            this.flashlightGraphics.fillStyle(0x000000, 0.4);
            this.flashlightGraphics.fillEllipse(enemy.x, enemy.y + 10, 24, 8);

            // Body
            this.flashlightGraphics.fillStyle(enemy.color, 1);
            if (enemy.type === 'arachnid') {
                this.flashlightGraphics.fillEllipse(enemy.x, enemy.y, 32, 24);
                // Legs
                this.flashlightGraphics.lineStyle(2, enemy.color);
                for (let i = 0; i < 4; i++) {
                    const legAngle = enemy.angle + (i * Math.PI / 2) - Math.PI / 4;
                    this.flashlightGraphics.lineBetween(
                        enemy.x, enemy.y,
                        enemy.x + Math.cos(legAngle) * 18,
                        enemy.y + Math.sin(legAngle) * 18
                    );
                }
            } else {
                const size = enemy.type === 'scorpion_small' ? 16 : 20;
                this.flashlightGraphics.fillEllipse(enemy.x, enemy.y, size, size * 0.8);
                // Tail
                this.flashlightGraphics.lineStyle(enemy.type === 'scorpion_small' ? 2 : 3, enemy.color);
                const tailX = enemy.x - Math.cos(enemy.angle) * 12;
                const tailY = enemy.y - Math.sin(enemy.angle) * 12;
                this.flashlightGraphics.lineBetween(enemy.x, enemy.y, tailX, tailY);
                this.flashlightGraphics.lineBetween(tailX, tailY,
                    tailX - Math.cos(enemy.angle) * 5,
                    tailY - Math.sin(enemy.angle) * 5 - 6);
            }

            // Eyes
            this.flashlightGraphics.fillStyle(COLORS.ALIEN_EYES, 1);
            const eyeOffset = enemy.type === 'arachnid' ? 6 : 4;
            this.flashlightGraphics.fillCircle(enemy.x + Math.cos(enemy.angle) * eyeOffset - 2, enemy.y + Math.sin(enemy.angle) * eyeOffset - 2, 2);
            this.flashlightGraphics.fillCircle(enemy.x + Math.cos(enemy.angle) * eyeOffset + 2, enemy.y + Math.sin(enemy.angle) * eyeOffset + 2, 2);

            // Health bar
            if (enemy.hp < enemy.maxHp) {
                this.flashlightGraphics.fillStyle(0x330000, 1);
                this.flashlightGraphics.fillRect(enemy.x - 12, enemy.y - 18, 24, 4);
                this.flashlightGraphics.fillStyle(0xcc0000, 1);
                this.flashlightGraphics.fillRect(enemy.x - 12, enemy.y - 18, 24 * (enemy.hp / enemy.maxHp), 4);
            }
        }

        // Draw particles
        for (const p of this.particles) {
            const alpha = Math.min(1, p.life * 5);
            switch (p.type) {
                case 'muzzle':
                    this.flashlightGraphics.fillStyle(COLORS.MUZZLE_FLASH, p.life * 10);
                    this.flashlightGraphics.fillCircle(p.x, p.y, 6);
                    break;
                case 'blood':
                    this.flashlightGraphics.fillStyle(0xc80000, p.life * 2);
                    this.flashlightGraphics.fillCircle(p.x, p.y, 3);
                    break;
                case 'alienblood':
                    this.flashlightGraphics.fillStyle(0x00c800, p.life * 2.5);
                    this.flashlightGraphics.fillCircle(p.x, p.y, 3);
                    break;
                case 'spark':
                    this.flashlightGraphics.fillStyle(0xffc864, p.life * 5);
                    this.flashlightGraphics.fillRect(p.x - 2, p.y - 2, 4, 4);
                    break;
            }
        }

        // Draw player
        this.player.clear();

        // Invincibility flash
        if (this.playerData.invincible > 0 && Math.floor(this.playerData.invincible * 10) % 2 === 0) {
            return;
        }

        // Shadow
        this.player.fillStyle(0x000000, 0.4);
        this.player.fillEllipse(0, 8, 20, 8);

        // Body with rotation
        this.player.save();
        const cos = Math.cos(this.playerAngle);
        const sin = Math.sin(this.playerAngle);

        // Armor (rotated rectangle)
        this.player.fillStyle(COLORS.PLAYER, 1);
        this.drawRotatedRect(this.player, 0, 0, 16, 20, this.playerAngle);

        // Weapon
        this.player.fillStyle(0x555555, 1);
        const weaponX = cos * 10;
        const weaponY = sin * 10;
        this.drawRotatedRect(this.player, weaponX, weaponY, 15, 6, this.playerAngle);

        // Visor
        this.player.fillStyle(0x00aaaa, 1);
        const visorX = cos * 4 - sin * 2;
        const visorY = sin * 4 + cos * 2;
        this.player.fillCircle(visorX, visorY, 3);

        // Laser sight
        this.flashlightGraphics.lineStyle(1, 0xff0000, 0.5);
        this.flashlightGraphics.lineBetween(
            this.player.x, this.player.y,
            this.player.x + Math.cos(this.playerAngle) * 200,
            this.player.y + Math.sin(this.playerAngle) * 200
        );

        // Flashlight cone
        const gradient = this.flashlightGraphics;
        gradient.fillStyle(0xc8c896, 0.1);
        gradient.beginPath();
        gradient.moveTo(this.player.x, this.player.y);
        const coneAngle = 0.4;
        const coneLength = 200;
        for (let a = -coneAngle; a <= coneAngle; a += 0.1) {
            const angle = this.playerAngle + a;
            gradient.lineTo(
                this.player.x + Math.cos(angle) * coneLength,
                this.player.y + Math.sin(angle) * coneLength
            );
        }
        gradient.closePath();
        gradient.fillPath();
    }

    drawRotatedRect(graphics, x, y, width, height, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const hw = width / 2;
        const hh = height / 2;

        const points = [
            { x: -hw, y: -hh },
            { x: hw, y: -hh },
            { x: hw, y: hh },
            { x: -hw, y: hh }
        ];

        const rotated = points.map(p => ({
            x: x + p.x * cos - p.y * sin,
            y: y + p.x * sin + p.y * cos
        }));

        graphics.beginPath();
        graphics.moveTo(rotated[0].x, rotated[0].y);
        for (let i = 1; i < rotated.length; i++) {
            graphics.lineTo(rotated[i].x, rotated[i].y);
        }
        graphics.closePath();
        graphics.fillPath();
    }

    showGameOver() {
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, this.scale.width, this.scale.height);
        overlay.setScrollFactor(0);
        overlay.setDepth(200);

        const gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 30, 'GAME OVER', {
            fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: '#cc0000'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        const scoreText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 20,
            `Final Rank: ${this.playerData.rank} | Credits: ${this.playerData.credits}`, {
            fontSize: '18px', fontFamily: 'Arial', color: '#00cccc'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        const restartText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 60, 'Press R to Restart', {
            fontSize: '18px', fontFamily: 'Arial', color: '#00cccc'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    }
}

const config = {
    type: Phaser.CANVAS,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#000000',
    canvas: document.createElement('canvas'),
    scene: [GameScene],
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    }
};

document.body.appendChild(config.canvas);
const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
