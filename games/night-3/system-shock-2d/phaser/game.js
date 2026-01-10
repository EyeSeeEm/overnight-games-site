// WHISPERS OF M.A.R.I.A. - System Shock 2D Clone
// Phaser 3 Implementation

const GAME_WIDTH = 960;
const GAME_HEIGHT = 720;
const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

const COLORS = {
    BG: 0x000000,
    FLOOR: 0x4a4238,
    FLOOR_ALT: 0x3a3228,
    WALL: 0x2a2520,
    WALL_LIGHT: 0x5a4a40,
    DOOR: 0x6a5a50,
    TERMINAL: 0x2a4a3a,
    TERMINAL_SCREEN: 0x40aa60,
    PLAYER: 0x6a8a8a,
    CYBORG: 0x7a6050,
    CYBORG_EYE: 0xff3030,
    BULLET: 0xffff80,
    LASER: 0x80ffff,
    HEALTH_BAR: 0xcc4040,
    ENERGY_BAR: 0x4080cc,
    EXIT: 0x40aa40
};

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Boot' });
    }

    create() {
        this.createTextures();
        this.scene.start('Game');
    }

    createTextures() {
        const g = this.make.graphics({ add: false });

        // Floor tile
        g.clear();
        g.fillStyle(COLORS.FLOOR);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, 0x2a2218);
        g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('floor', TILE_SIZE, TILE_SIZE);

        // Floor alt
        g.clear();
        g.fillStyle(COLORS.FLOOR_ALT);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, 0x2a2218);
        g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('floorAlt', TILE_SIZE, TILE_SIZE);

        // Wall tile
        g.clear();
        g.fillStyle(COLORS.WALL);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(COLORS.WALL_LIGHT);
        g.fillRect(0, 0, TILE_SIZE, 4);
        g.fillRect(0, 0, 4, TILE_SIZE);
        g.generateTexture('wall', TILE_SIZE, TILE_SIZE);

        // Door
        g.clear();
        g.fillStyle(COLORS.DOOR);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x3a3028);
        g.fillRect(4, 4, 24, 24);
        g.generateTexture('door', TILE_SIZE, TILE_SIZE);

        // Terminal
        g.clear();
        g.fillStyle(COLORS.TERMINAL);
        g.fillRect(0, 0, 28, 28);
        g.fillStyle(COLORS.TERMINAL_SCREEN);
        g.fillRect(4, 4, 20, 12);
        g.generateTexture('terminal', 28, 28);

        // Player
        g.clear();
        g.fillStyle(COLORS.PLAYER);
        g.fillRect(0, 4, 20, 16);
        g.fillStyle(0x40aa60);
        g.fillRect(15, 8, 8, 8);
        g.fillStyle(0x4a4a4a);
        g.fillRect(22, 10, 10, 4);
        g.generateTexture('player', 32, 24);

        // Cyborg
        g.clear();
        g.fillStyle(COLORS.CYBORG);
        g.fillRect(0, 2, 28, 20);
        g.fillStyle(COLORS.CYBORG_EYE);
        g.fillCircle(20, 12, 4);
        g.generateTexture('cyborg', 28, 24);

        // Bullet
        g.clear();
        g.fillStyle(COLORS.BULLET);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet', 8, 8);

        // Laser
        g.clear();
        g.fillStyle(COLORS.LASER);
        g.fillCircle(4, 4, 4);
        g.generateTexture('laser', 8, 8);

        // Item
        g.clear();
        g.fillStyle(0x60cc80);
        g.fillRect(0, 0, 12, 12);
        g.generateTexture('item', 12, 12);

        // Exit
        g.clear();
        g.fillStyle(COLORS.EXIT);
        g.fillRect(0, 0, 40, 40);
        g.generateTexture('exit', 40, 40);

        // Darkness overlay (full screen black)
        g.clear();
        g.fillStyle(0x000000);
        g.fillRect(0, 0, 1, 1);
        g.generateTexture('darkness', 1, 1);

        g.destroy();
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Game' });
    }

    create() {
        this.gameData = {
            deck: 1,
            score: 0,
            messages: [],
            state: 'playing'
        };

        this.playerData = {
            hp: 100,
            maxHp: 100,
            energy: 100,
            maxEnergy: 100,
            weapon: 'pistol',
            ammo: { bullets: 48, shells: 0 },
            magazine: 12,
            maxMagazine: 12,
            reloading: false,
            reloadTime: 0,
            lastShot: 0,
            flashlightOn: true,
            isSprinting: false
        };

        this.weapons = {
            wrench: { damage: 15, range: 40, fireRate: 400, ammoType: null, magazineSize: null, melee: true },
            pistol: { damage: 12, range: 400, fireRate: 300, ammoType: 'bullets', magazineSize: 12, melee: false },
            shotgun: { damage: 8, pellets: 6, range: 200, fireRate: 800, ammoType: 'shells', magazineSize: 6, melee: false }
        };

        this.map = [];
        this.floorTiles = this.add.group();
        this.wallTiles = this.add.group();
        this.enemies = [];
        this.bullets = [];
        this.items = [];
        this.doors = [];
        this.terminals = [];
        this.corpses = [];

        this.generateMap();
        this.createPlayer();
        this.spawnEnemies();
        this.spawnItems();
        this.createUI();
        this.setupInput();
        this.createLighting();

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

        this.addMessage("SYSTEM: Welcome to Von Braun. M.A.R.I.A. is watching.");
    }

    generateMap() {
        // Initialize with walls
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.map[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                this.map[y][x] = 1;
            }
        }

        // Create rooms
        const rooms = [];
        const numRooms = 8 + Math.floor(Math.random() * 4);

        for (let i = 0; i < numRooms; i++) {
            const roomW = 5 + Math.floor(Math.random() * 6);
            const roomH = 4 + Math.floor(Math.random() * 5);
            const roomX = 1 + Math.floor(Math.random() * (MAP_WIDTH - roomW - 2));
            const roomY = 1 + Math.floor(Math.random() * (MAP_HEIGHT - roomH - 2));

            for (let y = roomY; y < roomY + roomH; y++) {
                for (let x = roomX; x < roomX + roomW; x++) {
                    this.map[y][x] = 0;
                }
            }

            rooms.push({ x: roomX + roomW/2, y: roomY + roomH/2, w: roomW, h: roomH });
        }

        // Connect rooms with corridors
        for (let i = 1; i < rooms.length; i++) {
            const prev = rooms[i - 1];
            const curr = rooms[i];

            let x = Math.floor(prev.x);
            let y = Math.floor(prev.y);
            const targetX = Math.floor(curr.x);
            const targetY = Math.floor(curr.y);

            while (x !== targetX) {
                if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                    this.map[y][x] = 0;
                    if (y > 0) this.map[y-1][x] = 0;
                }
                x += x < targetX ? 1 : -1;
            }
            while (y !== targetY) {
                if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                    this.map[y][x] = 0;
                    if (x > 0) this.map[y][x-1] = 0;
                }
                y += y < targetY ? 1 : -1;
            }
        }

        // Render map
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const px = x * TILE_SIZE + TILE_SIZE / 2;
                const py = y * TILE_SIZE + TILE_SIZE / 2;

                if (this.map[y][x] === 0) {
                    const texture = ((x + y) % 2 === 0) ? 'floor' : 'floorAlt';
                    const tile = this.add.image(px, py, texture);
                    this.floorTiles.add(tile);
                } else {
                    const tile = this.add.image(px, py, 'wall');
                    this.wallTiles.add(tile);
                }
            }
        }

        // Add doors
        for (let y = 2; y < MAP_HEIGHT - 2; y++) {
            for (let x = 2; x < MAP_WIDTH - 2; x++) {
                if (this.map[y][x] === 0) {
                    const isHorizontalPassage = this.map[y][x-1] === 1 && this.map[y][x+1] === 1 &&
                                               this.map[y-1][x] === 0 && this.map[y+1][x] === 0;
                    const isVerticalPassage = this.map[y-1][x] === 1 && this.map[y+1][x] === 1 &&
                                             this.map[y][x-1] === 0 && this.map[y][x+1] === 0;

                    if ((isHorizontalPassage || isVerticalPassage) && Math.random() < 0.15) {
                        const door = this.add.image(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 'door');
                        door.doorData = { open: false, locked: Math.random() < 0.3, keycard: 'yellow', tx: x, ty: y };
                        this.doors.push(door);
                    }
                }
            }
        }

        // Add terminals
        for (const room of rooms) {
            if (Math.random() < 0.4) {
                const tx = Math.floor(room.x - room.w/2 + 1);
                const ty = Math.floor(room.y - room.h/2 + 1);
                const terminal = this.add.image(tx * TILE_SIZE + TILE_SIZE/2, ty * TILE_SIZE + TILE_SIZE/2, 'terminal');
                terminal.terminalData = { hacked: false, type: 'security' };
                this.terminals.push(terminal);
            }
        }

        // Exit position
        const lastRoom = rooms[rooms.length - 1];
        this.exitX = Math.floor(lastRoom.x) * TILE_SIZE;
        this.exitY = Math.floor(lastRoom.y) * TILE_SIZE;
        this.exit = this.add.image(this.exitX, this.exitY, 'exit');

        // Spawn position
        for (let y = 2; y < MAP_HEIGHT - 2; y++) {
            for (let x = 2; x < MAP_WIDTH - 2; x++) {
                if (this.map[y][x] === 0) {
                    this.spawnX = x * TILE_SIZE + TILE_SIZE / 2;
                    this.spawnY = y * TILE_SIZE + TILE_SIZE / 2;
                    return;
                }
            }
        }
    }

    createPlayer() {
        this.player = this.add.sprite(this.spawnX, this.spawnY, 'player');
        this.player.setDepth(10);
    }

    spawnEnemies() {
        const enemyCount = 5 + this.gameData.deck * 3;

        for (let i = 0; i < enemyCount; i++) {
            let attempts = 0;
            while (attempts < 100) {
                const x = Math.floor(Math.random() * MAP_WIDTH);
                const y = Math.floor(Math.random() * MAP_HEIGHT);

                if (this.map[y][x] === 0) {
                    const dist = Phaser.Math.Distance.Between(
                        x * TILE_SIZE, y * TILE_SIZE, this.spawnX, this.spawnY
                    );
                    if (dist > 200) {
                        const enemy = this.add.sprite(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 'cyborg');
                        enemy.setDepth(8);
                        enemy.enemyData = {
                            hp: 30 + Math.random() * 30,
                            maxHp: 60,
                            speed: 80 + Math.random() * 40,
                            damage: 10 + Math.floor(Math.random() * 10),
                            range: Math.random() < 0.5 ? 30 : 200,
                            state: 'patrol',
                            alertTimer: 0,
                            lastAttack: 0,
                            lastSeen: { x: 0, y: 0 },
                            patrolTarget: null,
                            behavior: Math.random() < 0.5 ? 'melee' : 'ranged'
                        };
                        this.enemies.push(enemy);
                        break;
                    }
                }
                attempts++;
            }
        }
    }

    spawnItems() {
        const itemCount = 10 + this.gameData.deck * 2;
        const itemTypes = ['medkit', 'bullets', 'energy'];

        for (let i = 0; i < itemCount; i++) {
            let attempts = 0;
            while (attempts < 50) {
                const x = Math.floor(Math.random() * MAP_WIDTH);
                const y = Math.floor(Math.random() * MAP_HEIGHT);

                if (this.map[y][x] === 0) {
                    const item = this.add.image(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 'item');
                    item.setDepth(5);
                    item.itemData = {
                        type: itemTypes[Math.floor(Math.random() * itemTypes.length)],
                        amount: 20 + Math.floor(Math.random() * 30)
                    };
                    this.items.push(item);
                    break;
                }
                attempts++;
            }
        }
    }

    createUI() {
        this.uiGroup = this.add.group();

        // UI texts
        this.weaponTexts = [];
        const weapons = ['wrench', 'pistol', 'shotgun'];
        let y = 25;
        for (const w of weapons) {
            const text = this.add.text(13, y, w, { fontSize: '14px', fontFamily: 'monospace', color: '#ffffff' });
            text.setScrollFactor(0);
            text.setDepth(100);
            this.weaponTexts.push({ text, weapon: w });
            y += 18;
        }

        this.ammoText = this.add.text(13, GAME_HEIGHT - 110, '', { fontSize: '14px', fontFamily: 'monospace', color: '#60cc80' });
        this.ammoText.setScrollFactor(0);
        this.ammoText.setDepth(100);

        this.statsText = this.add.text(13, GAME_HEIGHT - 80, '', { fontSize: '16px', fontFamily: 'monospace', color: '#ffffff' });
        this.statsText.setScrollFactor(0);
        this.statsText.setDepth(100);

        this.descText = this.add.text(13, GAME_HEIGHT - 30, '', { fontSize: '14px', fontFamily: 'monospace', color: '#ffffff' });
        this.descText.setScrollFactor(0);
        this.descText.setDepth(100);

        this.deckText = this.add.text(GAME_WIDTH - 200, 25, 'DECK 1: Engineering', { fontSize: '14px', fontFamily: 'monospace', color: '#ffffff' });
        this.deckText.setScrollFactor(0);
        this.deckText.setDepth(100);

        this.messagesText = this.add.text(GAME_WIDTH - 420, GAME_HEIGHT - 100, '', { fontSize: '12px', fontFamily: 'monospace', color: '#60cc80' });
        this.messagesText.setScrollFactor(0);
        this.messagesText.setDepth(100);

        // Crosshair
        this.crosshair = this.add.graphics();
        this.crosshair.setScrollFactor(0);
        this.crosshair.setDepth(100);
    }

    createLighting() {
        // Darkness mask
        this.darkness = this.add.graphics();
        this.darkness.setDepth(50);

        // Light mask for flashlight
        this.lightMask = this.make.graphics({ add: false });
    }

    setupInput() {
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            interact: Phaser.Input.Keyboard.KeyCodes.E,
            reload: Phaser.Input.Keyboard.KeyCodes.R,
            flashlight: Phaser.Input.Keyboard.KeyCodes.F,
            one: Phaser.Input.Keyboard.KeyCodes.ONE,
            two: Phaser.Input.Keyboard.KeyCodes.TWO,
            three: Phaser.Input.Keyboard.KeyCodes.THREE
        });

        this.input.keyboard.on('keydown-R', () => this.reload());
        this.input.keyboard.on('keydown-F', () => this.playerData.flashlightOn = !this.playerData.flashlightOn);
        this.input.keyboard.on('keydown-E', () => this.interact());
        this.input.keyboard.on('keydown-ONE', () => this.selectWeapon('wrench'));
        this.input.keyboard.on('keydown-TWO', () => this.selectWeapon('pistol'));
        this.input.keyboard.on('keydown-THREE', () => this.selectWeapon('shotgun'));

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.shoot();
            }
        });
    }

    update(time, delta) {
        if (this.gameData.state !== 'playing') return;

        const dt = delta / 1000;

        this.updatePlayer(dt, time);
        this.updateEnemies(dt, time);
        this.updateBullets(dt);
        this.updateLighting();
        this.updateUI();

        // Energy regen
        if (this.playerData.energy < this.playerData.maxEnergy) {
            this.playerData.energy = Math.min(this.playerData.maxEnergy, this.playerData.energy + 2 * dt);
        }

        // Flashlight cost
        if (this.playerData.flashlightOn) {
            this.playerData.energy = Math.max(0, this.playerData.energy - 1 * dt);
            if (this.playerData.energy <= 0) this.playerData.flashlightOn = false;
        }

        // Victory check
        const distToExit = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitX, this.exitY);
        if (distToExit < 40 && this.enemies.filter(e => e.active).length === 0) {
            this.gameData.state = 'victory';
            this.addMessage("DECK CLEARED. Proceed to elevator.");
        }

        // Death check
        if (this.playerData.hp <= 0) {
            this.gameData.state = 'gameover';
        }
    }

    updatePlayer(dt, time) {
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        this.player.rotation = angle;

        this.playerData.isSprinting = this.cursors.shift.isDown && this.playerData.energy > 0;
        const speed = this.playerData.isSprinting ? 250 : 150;

        if (this.playerData.isSprinting) {
            this.playerData.energy = Math.max(0, this.playerData.energy - 5 * dt);
        }

        let dx = 0, dy = 0;
        if (this.cursors.up.isDown) dy = -1;
        if (this.cursors.down.isDown) dy = 1;
        if (this.cursors.left.isDown) dx = -1;
        if (this.cursors.right.isDown) dx = 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            dx /= len;
            dy /= len;

            const newX = this.player.x + dx * speed * dt;
            const newY = this.player.y + dy * speed * dt;

            if (!this.checkCollision(newX, this.player.y, 12)) this.player.x = newX;
            if (!this.checkCollision(this.player.x, newY, 12)) this.player.y = newY;
        }

        // Reloading
        if (this.playerData.reloading) {
            this.playerData.reloadTime -= dt * 1000;
            if (this.playerData.reloadTime <= 0) {
                this.playerData.reloading = false;
                const weapon = this.weapons[this.playerData.weapon];
                if (weapon.ammoType) {
                    const needed = weapon.magazineSize - this.playerData.magazine;
                    const available = Math.min(needed, this.playerData.ammo[weapon.ammoType]);
                    this.playerData.magazine += available;
                    this.playerData.ammo[weapon.ammoType] -= available;
                }
            }
        }

        // Auto-fire
        if (pointer.isDown && !this.playerData.reloading) {
            this.shoot();
        }
    }

    checkCollision(x, y, radius) {
        const minTX = Math.floor((x - radius) / TILE_SIZE);
        const maxTX = Math.floor((x + radius) / TILE_SIZE);
        const minTY = Math.floor((y - radius) / TILE_SIZE);
        const maxTY = Math.floor((y + radius) / TILE_SIZE);

        for (let ty = minTY; ty <= maxTY; ty++) {
            for (let tx = minTX; tx <= maxTX; tx++) {
                if (ty < 0 || ty >= MAP_HEIGHT || tx < 0 || tx >= MAP_WIDTH) return true;
                if (this.map[ty][tx] === 1) return true;
            }
        }

        for (const door of this.doors) {
            if (!door.doorData.open) {
                const dist = Phaser.Math.Distance.Between(x, y, door.x, door.y);
                if (dist < radius + 16) return true;
            }
        }

        return false;
    }

    shoot() {
        const now = this.time.now;
        const weapon = this.weapons[this.playerData.weapon];

        if (now - this.playerData.lastShot < weapon.fireRate) return;

        if (weapon.melee) {
            this.playerData.lastShot = now;
            const attackX = this.player.x + Math.cos(this.player.rotation) * weapon.range;
            const attackY = this.player.y + Math.sin(this.player.rotation) * weapon.range;

            for (const enemy of this.enemies) {
                if (!enemy.active) continue;
                const dist = Phaser.Math.Distance.Between(attackX, attackY, enemy.x, enemy.y);
                if (dist < 30) {
                    this.damageEnemy(enemy, weapon.damage);
                }
            }

            // Visual effect
            const flash = this.add.circle(attackX, attackY, 15, 0xffffff, 0.5);
            this.tweens.add({ targets: flash, alpha: 0, duration: 100, onComplete: () => flash.destroy() });
        } else {
            if (this.playerData.magazine <= 0) {
                this.reload();
                return;
            }

            this.playerData.magazine--;
            this.playerData.lastShot = now;

            const count = weapon.pellets || 1;
            for (let i = 0; i < count; i++) {
                const spread = weapon.pellets ? (Math.random() - 0.5) * 0.4 : 0;
                const angle = this.player.rotation + spread;

                const bullet = this.add.sprite(
                    this.player.x + Math.cos(this.player.rotation) * 20,
                    this.player.y + Math.sin(this.player.rotation) * 20,
                    'bullet'
                );
                bullet.setDepth(15);
                bullet.bulletData = {
                    vx: Math.cos(angle) * 600,
                    vy: Math.sin(angle) * 600,
                    damage: weapon.damage,
                    range: weapon.range,
                    traveled: 0,
                    owner: 'player'
                };
                this.bullets.push(bullet);
            }

            // Muzzle flash
            const muzzle = this.add.circle(
                this.player.x + Math.cos(this.player.rotation) * 25,
                this.player.y + Math.sin(this.player.rotation) * 25,
                12, 0xffff80, 0.8
            );
            this.tweens.add({ targets: muzzle, alpha: 0, scale: 0.5, duration: 50, onComplete: () => muzzle.destroy() });
        }
    }

    reload() {
        const weapon = this.weapons[this.playerData.weapon];
        if (!weapon.ammoType) return;
        if (this.playerData.magazine >= weapon.magazineSize) return;
        if (this.playerData.ammo[weapon.ammoType] <= 0) return;

        this.playerData.reloading = true;
        this.playerData.reloadTime = 1500;
        this.addMessage("Reloading...");
    }

    selectWeapon(weapon) {
        this.playerData.weapon = weapon;
        this.playerData.reloading = false;
        const w = this.weapons[weapon];
        if (w.magazineSize) this.playerData.magazine = Math.min(this.playerData.magazine, w.magazineSize);
        this.addMessage("Equipped: " + weapon);
    }

    interact() {
        // Check doors
        for (const door of this.doors) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, door.x, door.y);
            if (dist < 50) {
                if (door.doorData.locked) {
                    this.addMessage("Door locked. Requires " + door.doorData.keycard + " keycard.");
                } else {
                    door.doorData.open = !door.doorData.open;
                    door.setVisible(!door.doorData.open);
                }
                return;
            }
        }

        // Check terminals
        for (const terminal of this.terminals) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, terminal.x, terminal.y);
            if (dist < 50 && !terminal.terminalData.hacked) {
                terminal.terminalData.hacked = true;
                this.gameData.score += 100;
                this.addMessage("M.A.R.I.A.: You dare access my systems?");
                return;
            }
        }

        // Check items
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (!item.active) continue;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
            if (dist < 40) {
                this.pickupItem(item, i);
                return;
            }
        }
    }

    pickupItem(item, index) {
        const data = item.itemData;
        if (data.type === 'medkit') {
            this.playerData.hp = Math.min(this.playerData.maxHp, this.playerData.hp + data.amount);
            this.addMessage("Used: medkit +" + data.amount);
        } else if (data.type === 'bullets') {
            this.playerData.ammo.bullets += data.amount;
            this.addMessage("Picked up: bullets x" + data.amount);
        } else if (data.type === 'energy') {
            this.playerData.energy = Math.min(this.playerData.maxEnergy, this.playerData.energy + data.amount);
            this.addMessage("Picked up: energy cell");
        }
        item.destroy();
        this.items.splice(index, 1);
    }

    updateEnemies(dt, time) {
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            const data = enemy.enemyData;
            if (data.hp <= 0) continue;

            const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const angleToPlayer = Phaser.Math.Angle.Between(enemy.y, enemy.y, this.player.x, this.player.y);

            const canSee = distToPlayer < (this.playerData.flashlightOn ? 250 : 80);

            switch (data.state) {
                case 'patrol':
                    if (canSee && distToPlayer < 250) {
                        data.state = 'chase';
                        data.lastSeen = { x: this.player.x, y: this.player.y };
                        this.addMessage("M.A.R.I.A.: Target acquired.");
                    } else {
                        if (!data.patrolTarget || Math.random() < 0.01) {
                            data.patrolTarget = { x: enemy.x + (Math.random() - 0.5) * 200, y: enemy.y + (Math.random() - 0.5) * 200 };
                        }
                        this.moveEnemy(enemy, data.patrolTarget.x, data.patrolTarget.y, dt);
                    }
                    break;

                case 'chase':
                    if (canSee) {
                        data.lastSeen = { x: this.player.x, y: this.player.y };
                        data.alertTimer = 5;
                    }

                    if (distToPlayer < data.range && canSee) {
                        data.state = 'attack';
                    } else if (data.alertTimer > 0) {
                        this.moveEnemy(enemy, data.lastSeen.x, data.lastSeen.y, dt);
                        data.alertTimer -= dt;
                    } else {
                        data.state = 'patrol';
                    }
                    break;

                case 'attack':
                    enemy.rotation = angleToPlayer;

                    if (time - data.lastAttack > 1000) {
                        data.lastAttack = time;

                        if (data.behavior === 'ranged' && distToPlayer > 50) {
                            const bullet = this.add.sprite(enemy.x, enemy.y, 'laser');
                            bullet.setDepth(15);
                            bullet.bulletData = {
                                vx: Math.cos(angleToPlayer) * 300,
                                vy: Math.sin(angleToPlayer) * 300,
                                damage: data.damage,
                                range: data.range,
                                traveled: 0,
                                owner: 'enemy'
                            };
                            this.bullets.push(bullet);
                        } else if (distToPlayer < data.range + 20) {
                            this.playerData.hp -= data.damage;
                            this.addMessage("Cyborg attacks! -" + data.damage + " HP");
                        }
                    }

                    if (distToPlayer > data.range * 1.5 || !canSee) {
                        data.state = 'chase';
                    }
                    break;
            }
        }
    }

    moveEnemy(enemy, targetX, targetY, dt) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY);
        enemy.rotation = angle;

        const speed = enemy.enemyData.speed;
        const newX = enemy.x + Math.cos(angle) * speed * dt;
        const newY = enemy.y + Math.sin(angle) * speed * dt;

        if (!this.checkCollision(newX, enemy.y, 14)) enemy.x = newX;
        if (!this.checkCollision(enemy.x, newY, 14)) enemy.y = newY;
    }

    damageEnemy(enemy, damage) {
        const data = enemy.enemyData;
        data.hp -= damage;
        data.state = 'chase';
        data.lastSeen = { x: this.player.x, y: this.player.y };
        data.alertTimer = 5;

        // Blood effect
        const blood = this.add.circle(enemy.x, enemy.y, 6, 0xaa4040, 0.8);
        this.tweens.add({ targets: blood, alpha: 0, scale: 2, duration: 400, onComplete: () => blood.destroy() });

        if (data.hp <= 0) {
            enemy.setActive(false).setVisible(false);
            this.gameData.score += 50;
            this.addMessage("Enemy destroyed. +50 pts");
        }
    }

    updateBullets(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (!bullet.active) continue;
            const data = bullet.bulletData;

            bullet.x += data.vx * dt;
            bullet.y += data.vy * dt;
            data.traveled += Math.hypot(data.vx * dt, data.vy * dt);

            // Wall collision
            const tx = Math.floor(bullet.x / TILE_SIZE);
            const ty = Math.floor(bullet.y / TILE_SIZE);
            if (ty < 0 || ty >= MAP_HEIGHT || tx < 0 || tx >= MAP_WIDTH || this.map[ty][tx] === 1) {
                bullet.destroy();
                this.bullets.splice(i, 1);
                continue;
            }

            // Range check
            if (data.traveled > data.range) {
                bullet.destroy();
                this.bullets.splice(i, 1);
                continue;
            }

            // Hit detection
            if (data.owner === 'player') {
                for (const enemy of this.enemies) {
                    if (!enemy.active) continue;
                    const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
                    if (dist < 15) {
                        this.damageEnemy(enemy, data.damage);
                        bullet.destroy();
                        this.bullets.splice(i, 1);
                        break;
                    }
                }
            } else {
                const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.player.x, this.player.y);
                if (dist < 15) {
                    this.playerData.hp -= data.damage;
                    this.addMessage("Hit! -" + data.damage + " HP");
                    bullet.destroy();
                    this.bullets.splice(i, 1);
                }
            }
        }
    }

    updateLighting() {
        this.darkness.clear();

        // Draw darkness overlay
        this.darkness.fillStyle(0x000000, 0.85);
        this.darkness.fillRect(
            this.cameras.main.scrollX,
            this.cameras.main.scrollY,
            GAME_WIDTH,
            GAME_HEIGHT
        );

        // Cut out flashlight cone
        if (this.playerData.flashlightOn) {
            this.darkness.fillStyle(0x000000, 0);
            this.darkness.beginPath();
            this.darkness.moveTo(this.player.x, this.player.y);

            const coneLength = 350;
            const coneWidth = Math.PI / 3;
            const startAngle = this.player.rotation - coneWidth / 2;
            const endAngle = this.player.rotation + coneWidth / 2;

            for (let a = startAngle; a <= endAngle; a += 0.05) {
                const x = this.player.x + Math.cos(a) * coneLength;
                const y = this.player.y + Math.sin(a) * coneLength;
                this.darkness.lineTo(x, y);
            }

            this.darkness.closePath();

            // Use blend mode to cut out light
            const savedComposite = this.darkness.defaultFillAlpha;
            this.darkness.fillStyle(0x000000, 0);
            this.darkness.fill();
        }

        // Ambient light around player
        this.darkness.fillStyle(0x000000, 0);
        this.darkness.fillCircle(this.player.x, this.player.y, this.playerData.flashlightOn ? 60 : 40);
    }

    updateUI() {
        // Weapon highlight
        for (const wt of this.weaponTexts) {
            wt.text.setBackgroundColor(wt.weapon === this.playerData.weapon ? '#000000' : null);
        }

        // Ammo
        this.ammoText.setText('bullets ' + this.playerData.ammo.bullets + 'x');

        // Stats
        const weapon = this.weapons[this.playerData.weapon];
        let statsStr = '';
        if (weapon.ammoType) {
            statsStr += 'ammo  =' + this.playerData.magazine + '/' + this.playerData.ammo[weapon.ammoType] + '\n';
        }
        statsStr += 'health=' + Math.floor(this.playerData.hp) + '/' + this.playerData.maxHp + '\n';
        statsStr += 'energy=' + Math.floor(this.playerData.energy) + '/' + this.playerData.maxEnergy;
        this.statsText.setText(statsStr);

        // Description
        let desc = '';
        if (this.playerData.weapon === 'wrench') desc = 'Standard maintenance tool.';
        else if (this.playerData.weapon === 'pistol') desc = '9mm semi-automatic pistol.';
        else if (this.playerData.weapon === 'shotgun') desc = 'Pump-action shotgun.';
        this.descText.setText(desc);

        // Messages
        let msgStr = '';
        for (let i = 0; i < Math.min(3, this.gameData.messages.length); i++) {
            msgStr += this.gameData.messages[i].text + '\n';
        }
        this.messagesText.setText(msgStr);

        // Crosshair
        this.crosshair.clear();
        this.crosshair.lineStyle(1, 0x80ff80);
        const mx = this.input.activePointer.x;
        const my = this.input.activePointer.y;
        this.crosshair.lineBetween(mx - 10, my, mx - 4, my);
        this.crosshair.lineBetween(mx + 4, my, mx + 10, my);
        this.crosshair.lineBetween(mx, my - 10, mx, my - 4);
        this.crosshair.lineBetween(mx, my + 4, mx, my + 10);

        // Game state overlays
        if (this.gameData.state === 'gameover') {
            const overlay = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);
            overlay.setScrollFactor(0);
            overlay.setDepth(200);
            const text = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 20, 'SYSTEM FAILURE', { fontSize: '48px', fontFamily: 'monospace', color: '#cc4040' });
            text.setOrigin(0.5);
            text.setScrollFactor(0);
            text.setDepth(201);
        } else if (this.gameData.state === 'victory') {
            const overlay = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x002800, 0.8);
            overlay.setScrollFactor(0);
            overlay.setDepth(200);
            const text = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 20, 'DECK CLEARED', { fontSize: '48px', fontFamily: 'monospace', color: '#60cc80' });
            text.setOrigin(0.5);
            text.setScrollFactor(0);
            text.setDepth(201);
        }
    }

    addMessage(text) {
        this.gameData.messages.unshift({ text, time: this.time.now });
        if (this.gameData.messages.length > 5) this.gameData.messages.pop();
    }
}

const config = {
    type: Phaser.CANVAS,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#000000',
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
