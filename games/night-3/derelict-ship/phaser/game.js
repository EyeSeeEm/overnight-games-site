// DERELICT - Survival Horror Clone
// Phaser 3 Implementation

const GAME_WIDTH = 960;
const GAME_HEIGHT = 720;
const TILE_SIZE = 32;
const MAP_WIDTH = 50;
const MAP_HEIGHT = 40;

const COLORS = {
    BG: 0x0a0808,
    FLOOR: 0x2a2a2a,
    FLOOR_ALT: 0x252525,
    WALL: 0x1a1a1a,
    WALL_LIGHT: 0x3a3a3a,
    DOOR: 0x4a4040,
    PLAYER: 0x6a8a8a,
    CRAWLER: 0x5a4a3a,
    SHAMBLER: 0x4a5a4a,
    BLOOD: 0x6a2020,
    O2_ITEM: 0x4080cc,
    MEDKIT: 0x40aa60,
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

        // Floor
        g.fillStyle(COLORS.FLOOR);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, 0x1a1a1a);
        g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('floor', TILE_SIZE, TILE_SIZE);

        // Floor alt
        g.clear();
        g.fillStyle(COLORS.FLOOR_ALT);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.lineStyle(1, 0x1a1a1a);
        g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('floorAlt', TILE_SIZE, TILE_SIZE);

        // Wall
        g.clear();
        g.fillStyle(COLORS.WALL);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.fillStyle(COLORS.WALL_LIGHT);
        g.fillRect(0, 0, TILE_SIZE, 3);
        g.fillRect(0, 0, 3, TILE_SIZE);
        g.generateTexture('wall', TILE_SIZE, TILE_SIZE);

        // Door
        g.clear();
        g.fillStyle(COLORS.DOOR);
        g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        g.generateTexture('door', TILE_SIZE, TILE_SIZE);

        // Player
        g.clear();
        g.fillStyle(COLORS.PLAYER);
        g.fillRect(0, 4, 20, 16);
        g.fillStyle(0x40aa60);
        g.fillRect(15, 8, 6, 6);
        g.fillStyle(0x5a5a5a);
        g.fillRect(20, 10, 10, 4);
        g.generateTexture('player', 30, 24);

        // Crawler
        g.clear();
        g.fillStyle(COLORS.CRAWLER);
        g.fillRect(0, 4, 28, 14);
        g.generateTexture('crawler', 28, 22);

        // Shambler
        g.clear();
        g.fillStyle(COLORS.SHAMBLER);
        g.fillRect(0, 0, 32, 32);
        g.generateTexture('shambler', 32, 32);

        // Item
        g.clear();
        g.fillStyle(COLORS.O2_ITEM);
        g.fillRect(0, 0, 16, 16);
        g.lineStyle(1, 0xffffff);
        g.strokeRect(0, 0, 16, 16);
        g.generateTexture('itemO2', 16, 16);

        g.clear();
        g.fillStyle(COLORS.MEDKIT);
        g.fillRect(0, 0, 16, 16);
        g.lineStyle(1, 0xffffff);
        g.strokeRect(0, 0, 16, 16);
        g.generateTexture('itemMedkit', 16, 16);

        // Blood
        g.clear();
        g.fillStyle(COLORS.BLOOD);
        g.fillCircle(8, 8, 8);
        g.generateTexture('blood', 16, 16);

        // Exit
        g.clear();
        g.fillStyle(COLORS.EXIT);
        g.fillRect(0, 0, 40, 40);
        g.generateTexture('exit', 40, 40);

        g.destroy();
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Game' });
    }

    create() {
        this.gameData = {
            state: 'playing',
            sector: 1,
            integrity: 100,
            messages: []
        };

        this.playerData = {
            hp: 100,
            maxHp: 100,
            o2: 100,
            maxO2: 100,
            flashlightOn: true,
            flashlightBattery: 60,
            maxFlashlightBattery: 60,
            isRunning: false,
            weapon: 'pipe',
            lastAttack: 0
        };

        // Stats tracking
        this.stats = {
            killCount: 0,
            totalDamageDealt: 0,
            totalDamageTaken: 0,
            critCount: 0,
            itemsPickedUp: 0,
            attacksMade: 0,
            maxKillStreak: 0
        };

        // Kill streak system
        this.killStreak = 0;
        this.killStreakTimer = 0;

        // Visual effects
        this.damageFlashAlpha = 0;
        this.lowHealthPulse = 0;
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        this.floatingTexts = [];

        // Debug mode
        this.debugMode = false;

        // Game start time
        this.gameStartTime = Date.now();

        this.O2_DRAIN = { idle: 0.5, walking: 0.67, running: 1.33, combat: 2 };

        this.map = [];
        this.floorTiles = this.add.group();
        this.enemies = [];
        this.items = [];
        this.doors = [];
        this.bloodStains = [];
        this.corpses = [];

        this.generateMap();
        this.createPlayer();
        this.spawnEnemies();
        this.spawnItems();
        this.createUI();
        this.createLighting();
        this.setupInput();

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);

        this.addMessage("SYSTEM: Wake up. Your oxygen is depleting.");
        this.addMessage("SYSTEM: Find the escape pod. Survive.");
    }

    generateMap() {
        for (let y = 0; y < MAP_HEIGHT; y++) {
            this.map[y] = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                this.map[y][x] = 1;
            }
        }

        const rooms = [];
        const numRooms = 12 + Math.floor(Math.random() * 6);

        for (let i = 0; i < numRooms; i++) {
            const w = 4 + Math.floor(Math.random() * 5);
            const h = 4 + Math.floor(Math.random() * 4);
            const rx = 1 + Math.floor(Math.random() * (MAP_WIDTH - w - 2));
            const ry = 1 + Math.floor(Math.random() * (MAP_HEIGHT - h - 2));

            for (let y = ry; y < ry + h; y++) {
                for (let x = rx; x < rx + w; x++) {
                    this.map[y][x] = 0;
                }
            }
            rooms.push({ x: rx + w/2, y: ry + h/2, w, h });
        }

        // Connect rooms
        for (let i = 1; i < rooms.length; i++) {
            const prev = rooms[i - 1];
            const curr = rooms[i];
            let cx = Math.floor(prev.x);
            let cy = Math.floor(prev.y);
            const tx = Math.floor(curr.x);
            const ty = Math.floor(curr.y);

            while (cx !== tx) {
                if (cy >= 0 && cy < MAP_HEIGHT && cx >= 0 && cx < MAP_WIDTH) this.map[cy][cx] = 0;
                cx += cx < tx ? 1 : -1;
            }
            while (cy !== ty) {
                if (cy >= 0 && cy < MAP_HEIGHT && cx >= 0 && cx < MAP_WIDTH) this.map[cy][cx] = 0;
                cy += cy < ty ? 1 : -1;
            }
        }

        // Render tiles
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const px = x * TILE_SIZE + TILE_SIZE / 2;
                const py = y * TILE_SIZE + TILE_SIZE / 2;

                if (this.map[y][x] === 0) {
                    const tex = ((x + y) % 2 === 0) ? 'floor' : 'floorAlt';
                    this.add.image(px, py, tex);
                } else {
                    this.add.image(px, py, 'wall');
                }
            }
        }

        // Doors
        for (let y = 2; y < MAP_HEIGHT - 2; y++) {
            for (let x = 2; x < MAP_WIDTH - 2; x++) {
                if (this.map[y][x] === 0) {
                    const h = this.map[y][x-1] === 1 && this.map[y][x+1] === 1;
                    const v = this.map[y-1][x] === 1 && this.map[y+1][x] === 1;
                    if ((h || v) && Math.random() < 0.1) {
                        const door = this.add.image(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 'door');
                        door.doorData = { open: false, locked: Math.random() < 0.2 };
                        this.doors.push(door);
                    }
                }
            }
        }

        // Blood stains
        for (let i = 0; i < 30; i++) {
            const bx = Math.floor(Math.random() * MAP_WIDTH);
            const by = Math.floor(Math.random() * MAP_HEIGHT);
            if (this.map[by][bx] === 0) {
                const blood = this.add.image(
                    bx * TILE_SIZE + Math.random() * TILE_SIZE,
                    by * TILE_SIZE + Math.random() * TILE_SIZE,
                    'blood'
                );
                blood.setAlpha(0.5);
                blood.setScale(0.5 + Math.random());
                this.bloodStains.push(blood);
            }
        }

        // Exit
        const lastRoom = rooms[rooms.length - 1];
        this.exitX = Math.floor(lastRoom.x) * TILE_SIZE;
        this.exitY = Math.floor(lastRoom.y) * TILE_SIZE;
        this.exit = this.add.image(this.exitX, this.exitY, 'exit');
        this.exit.setDepth(5);

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
        const count = 6 + this.gameData.sector * 2;

        for (let i = 0; i < count; i++) {
            let attempts = 0;
            while (attempts < 100) {
                const x = Math.floor(Math.random() * MAP_WIDTH);
                const y = Math.floor(Math.random() * MAP_HEIGHT);

                if (this.map[y][x] === 0) {
                    const dist = Phaser.Math.Distance.Between(x * TILE_SIZE, y * TILE_SIZE, this.spawnX, this.spawnY);
                    if (dist > 250) {
                        const isCrawler = Math.random() < 0.7;
                        const enemy = this.add.sprite(
                            x * TILE_SIZE + TILE_SIZE/2,
                            y * TILE_SIZE + TILE_SIZE/2,
                            isCrawler ? 'crawler' : 'shambler'
                        );
                        enemy.setDepth(8);
                        enemy.enemyData = {
                            type: isCrawler ? 'crawler' : 'shambler',
                            hp: isCrawler ? 30 : 60,
                            maxHp: isCrawler ? 30 : 60,
                            damage: isCrawler ? 15 : 25,
                            speed: isCrawler ? 80 : 50,
                            range: isCrawler ? 250 : 200,
                            state: 'patrol',
                            alertTimer: 0,
                            lastAttack: 0,
                            patrolTarget: null
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
        const count = 8 + this.gameData.sector;
        const types = [
            { name: 'O2 Small', texture: 'itemO2', o2: 25 },
            { name: 'O2 Large', texture: 'itemO2', o2: 50 },
            { name: 'Medkit Small', texture: 'itemMedkit', hp: 30 },
            { name: 'Medkit Large', texture: 'itemMedkit', hp: 60 }
        ];

        for (let i = 0; i < count; i++) {
            let attempts = 0;
            while (attempts < 50) {
                const x = Math.floor(Math.random() * MAP_WIDTH);
                const y = Math.floor(Math.random() * MAP_HEIGHT);

                if (this.map[y][x] === 0) {
                    const data = types[Math.floor(Math.random() * types.length)];
                    const item = this.add.image(
                        x * TILE_SIZE + TILE_SIZE/2,
                        y * TILE_SIZE + TILE_SIZE/2,
                        data.texture
                    );
                    item.setDepth(5);
                    item.itemData = { ...data };
                    this.items.push(item);
                    break;
                }
                attempts++;
            }
        }
    }

    createUI() {
        // O2 Bar
        this.o2BarBg = this.add.rectangle(117, 27, 204, 24, 0x000000);
        this.o2BarBg.setScrollFactor(0).setDepth(100);
        this.o2Bar = this.add.rectangle(117, 27, 200, 20, 0x4080cc);
        this.o2Bar.setScrollFactor(0).setDepth(101);
        this.o2Text = this.add.text(20, 20, 'O2: 100/100', { fontSize: '14px', fontFamily: 'monospace', color: '#cccccc' });
        this.o2Text.setScrollFactor(0).setDepth(102);

        // HP Bar
        this.hpBarBg = this.add.rectangle(117, 57, 204, 24, 0x000000);
        this.hpBarBg.setScrollFactor(0).setDepth(100);
        this.hpBar = this.add.rectangle(117, 57, 200, 20, 0xcc4040);
        this.hpBar.setScrollFactor(0).setDepth(101);
        this.hpText = this.add.text(20, 50, 'HP: 100/100', { fontSize: '14px', fontFamily: 'monospace', color: '#cccccc' });
        this.hpText.setScrollFactor(0).setDepth(102);

        // Integrity
        this.integrityText = this.add.text(GAME_WIDTH - 200, 20, 'INTEGRITY: 100%', { fontSize: '14px', fontFamily: 'monospace', color: '#cccccc' });
        this.integrityText.setScrollFactor(0).setDepth(100);

        // Sector
        this.sectorText = this.add.text(GAME_WIDTH - 200, 45, 'SECTOR: 1', { fontSize: '14px', fontFamily: 'monospace', color: '#cccccc' });
        this.sectorText.setScrollFactor(0).setDepth(100);

        // Messages
        this.messagesText = this.add.text(20, GAME_HEIGHT - 80, '', { fontSize: '12px', fontFamily: 'monospace', color: '#60b460' });
        this.messagesText.setScrollFactor(0).setDepth(100);

        // Warning
        this.warningText = this.add.text(GAME_WIDTH/2 - 70, GAME_HEIGHT - 30, '', { fontSize: '20px', fontFamily: 'monospace', color: '#cc4040' });
        this.warningText.setScrollFactor(0).setDepth(100);

        // Crosshair
        this.crosshair = this.add.graphics();
        this.crosshair.setScrollFactor(0).setDepth(100);

        // Visual effects overlays
        this.damageOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0);
        this.damageOverlay.setScrollFactor(0).setDepth(90);

        this.lowHealthOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x330000, 0);
        this.lowHealthOverlay.setScrollFactor(0).setDepth(89);

        // Kill streak display
        this.killStreakText = this.add.text(GAME_WIDTH / 2, 80, '', { fontSize: '18px', fontFamily: 'monospace', color: '#ffaa00', fontStyle: 'bold' });
        this.killStreakText.setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // Debug overlay
        this.debugText = this.add.text(GAME_WIDTH - 200, 80, '', { fontSize: '10px', fontFamily: 'monospace', color: '#00ff00', backgroundColor: '#000000aa' });
        this.debugText.setScrollFactor(0).setDepth(150).setVisible(false);
    }

    createLighting() {
        this.darkness = this.add.graphics();
        this.darkness.setDepth(50);
    }

    setupInput() {
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            interact: Phaser.Input.Keyboard.KeyCodes.E,
            flashlight: Phaser.Input.Keyboard.KeyCodes.F
        });

        this.input.keyboard.on('keydown-F', () => this.playerData.flashlightOn = !this.playerData.flashlightOn);
        this.input.keyboard.on('keydown-E', () => this.interact());
        this.input.keyboard.on('keydown-Q', () => {
            this.debugMode = !this.debugMode;
            this.debugText.setVisible(this.debugMode);
        });
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) this.attack();
        });
    }

    update(time, delta) {
        if (this.gameData.state !== 'playing') return;

        const dt = delta / 1000;

        this.updatePlayer(dt, time);
        this.updateEnemies(dt, time);
        this.updateLighting();
        this.updateUI();
        this.updateVisualEffects(dt);
        this.updateFloatingTexts(dt);
        this.updateKillStreak(dt);
        this.updateDebugOverlay();

        // Integrity decay
        this.gameData.integrity = Math.max(0, this.gameData.integrity - 0.02 * dt);
        if (this.gameData.integrity <= 0) {
            this.gameData.state = 'gameover';
            this.addMessage("The ship tears itself apart.");
        }

        // Victory
        const distToExit = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitX, this.exitY);
        if (distToExit < 40) {
            this.gameData.state = 'victory';
        }

        // Death
        if (this.playerData.o2 <= 0 || this.playerData.hp <= 0) {
            this.gameData.state = 'gameover';
        }
    }

    updatePlayer(dt, time) {
        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
        this.player.rotation = angle;

        this.playerData.isRunning = this.cursors.shift.isDown;
        const speed = this.playerData.isRunning ? 200 : 120;

        let dx = 0, dy = 0;
        if (this.cursors.up.isDown) dy = -1;
        if (this.cursors.down.isDown) dy = 1;
        if (this.cursors.left.isDown) dx = -1;
        if (this.cursors.right.isDown) dx = 1;

        const isMoving = dx !== 0 || dy !== 0;

        if (isMoving) {
            const len = Math.hypot(dx, dy);
            dx /= len;
            dy /= len;

            const newX = this.player.x + dx * speed * dt;
            const newY = this.player.y + dy * speed * dt;

            if (!this.checkCollision(newX, this.player.y, 12)) this.player.x = newX;
            if (!this.checkCollision(this.player.x, newY, 12)) this.player.y = newY;
        }

        // O2 drain
        let drain = this.O2_DRAIN.idle;
        if (isMoving) drain = this.playerData.isRunning ? this.O2_DRAIN.running : this.O2_DRAIN.walking;
        this.playerData.o2 = Math.max(0, this.playerData.o2 - drain * dt);

        // Flashlight
        if (this.playerData.flashlightOn) {
            this.playerData.flashlightBattery = Math.max(0, this.playerData.flashlightBattery - dt);
            if (this.playerData.flashlightBattery <= 0) this.playerData.flashlightOn = false;
        } else {
            this.playerData.flashlightBattery = Math.min(this.playerData.maxFlashlightBattery, this.playerData.flashlightBattery + 0.5 * dt);
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

    attack() {
        const now = this.time.now;
        if (now - this.playerData.lastAttack < 600) return;

        this.playerData.lastAttack = now;
        this.playerData.o2 = Math.max(0, this.playerData.o2 - 2);
        this.stats.attacksMade++;

        const range = 45;
        const attackX = this.player.x + Math.cos(this.player.rotation) * range;
        const attackY = this.player.y + Math.sin(this.player.rotation) * range;

        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            const dist = Phaser.Math.Distance.Between(attackX, attackY, enemy.x, enemy.y);
            if (dist < 35) {
                this.damageEnemy(enemy, 20);
            }
        }

        // Attack visual
        const flash = this.add.circle(attackX, attackY, 15, 0xffffff, 0.5);
        this.tweens.add({ targets: flash, alpha: 0, duration: 100, onComplete: () => flash.destroy() });
    }

    damageEnemy(enemy, damage) {
        // Critical hit system (15% chance, 2x damage)
        const isCrit = Math.random() < 0.15;
        if (isCrit) {
            damage *= 2;
            this.stats.critCount++;
        }

        const data = enemy.enemyData;
        data.hp -= damage;
        data.state = 'alert';
        data.alertTimer = 10;

        this.stats.totalDamageDealt += damage;

        // Floating damage number
        this.createFloatingText(
            enemy.x, enemy.y - 20,
            damage.toString() + (isCrit ? '!' : ''),
            isCrit ? '#ffff00' : '#ff4444',
            isCrit ? 18 : 14
        );

        // Screen shake
        this.triggerScreenShake(isCrit ? 6 : 3);

        // Blood (more for crits)
        const bloodCount = isCrit ? 6 : 3;
        for (let i = 0; i < bloodCount; i++) {
            const blood = this.add.image(
                enemy.x + Phaser.Math.Between(-15, 15),
                enemy.y + Phaser.Math.Between(-15, 15),
                'blood'
            );
            blood.setAlpha(0.5);
            blood.setScale(0.3 + Math.random() * 0.5);
            // Animate blood particle
            this.tweens.add({
                targets: blood,
                x: blood.x + Phaser.Math.Between(-30, 30),
                y: blood.y + Phaser.Math.Between(-30, 30),
                alpha: 0.3,
                duration: 400
            });
        }

        if (data.hp <= 0) {
            this.killEnemy(enemy, isCrit);
        }
    }

    killEnemy(enemy, wasCrit) {
        this.stats.killCount++;

        // Kill streak
        this.killStreak++;
        this.killStreakTimer = 3;
        if (this.killStreak > this.stats.maxKillStreak) {
            this.stats.maxKillStreak = this.killStreak;
        }

        // Kill streak messages
        if (this.killStreak >= 3) {
            const streakMessages = { 3: 'TRIPLE KILL!', 4: 'QUAD KILL!', 5: 'RAMPAGE!', 6: 'MASSACRE!' };
            const msg = streakMessages[Math.min(this.killStreak, 6)] || 'UNSTOPPABLE!';
            this.createFloatingText(this.player.x, this.player.y - 50, msg, '#ffaa00', 20);
        }

        // Death burst particles
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const particle = this.add.circle(enemy.x, enemy.y, 5, COLORS.BLOOD, 0.8);
            this.tweens.add({
                targets: particle,
                x: enemy.x + Math.cos(angle) * 50,
                y: enemy.y + Math.sin(angle) * 50,
                alpha: 0,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }

        this.triggerScreenShake(8);
        enemy.setActive(false).setVisible(false);
        this.addMessage("Enemy killed." + (wasCrit ? " CRITICAL!" : ""));
    }

    interact() {
        for (const door of this.doors) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, door.x, door.y);
            if (dist < 50) {
                if (door.doorData.locked) {
                    this.addMessage("Door is locked.");
                } else {
                    door.doorData.open = !door.doorData.open;
                    door.setVisible(!door.doorData.open);
                }
                return;
            }
        }

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            if (!item.active) continue;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
            if (dist < 40) {
                this.stats.itemsPickedUp++;
                const data = item.itemData;
                if (data.o2) {
                    this.playerData.o2 = Math.min(this.playerData.maxO2, this.playerData.o2 + data.o2);
                    this.addMessage("Used: " + data.name + " (+" + data.o2 + " O2)");
                    this.createFloatingText(item.x, item.y - 20, '+' + data.o2 + ' O2', '#4080cc', 14);
                    // O2 particles
                    for (let p = 0; p < 6; p++) {
                        const angle = Math.random() * Math.PI * 2;
                        const particle = this.add.circle(this.player.x + Math.cos(angle) * 20, this.player.y + Math.sin(angle) * 20, 4, 0x4080cc, 0.8);
                        this.tweens.add({
                            targets: particle,
                            y: particle.y - 30,
                            alpha: 0,
                            duration: 500,
                            onComplete: () => particle.destroy()
                        });
                    }
                } else if (data.hp) {
                    this.playerData.hp = Math.min(this.playerData.maxHp, this.playerData.hp + data.hp);
                    this.addMessage("Used: " + data.name + " (+" + data.hp + " HP)");
                    this.createFloatingText(item.x, item.y - 20, '+' + data.hp + ' HP', '#40aa60', 14);
                    // Healing particles
                    for (let p = 0; p < 6; p++) {
                        const angle = Math.random() * Math.PI * 2;
                        const particle = this.add.circle(this.player.x + Math.cos(angle) * 20, this.player.y + Math.sin(angle) * 20, 4, 0x40aa60, 0.8);
                        this.tweens.add({
                            targets: particle,
                            y: particle.y - 30,
                            alpha: 0,
                            duration: 500,
                            onComplete: () => particle.destroy()
                        });
                    }
                }
                // Pickup sparkle
                for (let p = 0; p < 8; p++) {
                    const angle = (Math.PI * 2 * p) / 8;
                    const particle = this.add.circle(item.x, item.y, 3, 0xffff80, 0.8);
                    this.tweens.add({
                        targets: particle,
                        x: item.x + Math.cos(angle) * 30,
                        y: item.y + Math.sin(angle) * 30,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => particle.destroy()
                    });
                }
                item.destroy();
                this.items.splice(i, 1);
                return;
            }
        }
    }

    updateEnemies(dt, time) {
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            const data = enemy.enemyData;

            const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

            const canSee = distToPlayer < data.range;

            switch (data.state) {
                case 'patrol':
                    if (canSee) {
                        data.state = 'chase';
                        this.addMessage("Something noticed you...");
                    } else {
                        if (!data.patrolTarget || Math.random() < 0.005) {
                            data.patrolTarget = {
                                x: enemy.x + Phaser.Math.Between(-75, 75),
                                y: enemy.y + Phaser.Math.Between(-75, 75)
                            };
                        }
                        this.moveEnemy(enemy, data.patrolTarget.x, data.patrolTarget.y, dt * 0.5);
                    }
                    break;

                case 'chase':
                case 'alert':
                    if (distToPlayer < 40) {
                        if (time - data.lastAttack > 1200) {
                            data.lastAttack = time;
                            this.damagePlayer(data.damage);
                            this.addMessage("Attacked! -" + data.damage + " HP");
                        }
                    } else if (distToPlayer < data.range * 1.5) {
                        this.moveEnemy(enemy, this.player.x, this.player.y, dt);
                    } else {
                        data.alertTimer -= dt;
                        if (data.alertTimer <= 0) data.state = 'patrol';
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

    updateLighting() {
        this.darkness.clear();

        // Full darkness
        this.darkness.fillStyle(0x000000, 0.9);
        this.darkness.fillRect(
            this.cameras.main.scrollX,
            this.cameras.main.scrollY,
            GAME_WIDTH,
            GAME_HEIGHT
        );

        // Vision cone cut-out
        const coneLength = this.playerData.flashlightOn ? 350 : 80;
        const coneAngle = Math.PI / 4;

        this.darkness.fillStyle(0x000000, 0);
        this.darkness.beginPath();
        this.darkness.moveTo(this.player.x, this.player.y);

        for (let a = -coneAngle; a <= coneAngle; a += 0.05) {
            const x = this.player.x + Math.cos(this.player.rotation + a) * coneLength;
            const y = this.player.y + Math.sin(this.player.rotation + a) * coneLength;
            this.darkness.lineTo(x, y);
        }

        this.darkness.closePath();
        this.darkness.fillStyle(0x000000, 0);
        this.darkness.fill();

        // Ambient light
        this.darkness.fillStyle(0x000000, 0);
        this.darkness.fillCircle(this.player.x, this.player.y, this.playerData.flashlightOn ? 50 : 30);
    }

    updateUI() {
        this.o2Bar.setScale(this.playerData.o2 / this.playerData.maxO2, 1);
        this.o2Text.setText('O2: ' + Math.floor(this.playerData.o2) + '/' + this.playerData.maxO2);

        this.hpBar.setScale(this.playerData.hp / this.playerData.maxHp, 1);
        this.hpText.setText('HP: ' + Math.floor(this.playerData.hp) + '/' + this.playerData.maxHp);

        this.integrityText.setText('INTEGRITY: ' + Math.floor(this.gameData.integrity) + '%');

        // Messages
        let msgStr = '';
        for (let i = 0; i < Math.min(3, this.gameData.messages.length); i++) {
            msgStr += this.gameData.messages[i].text + '\n';
        }
        this.messagesText.setText(msgStr);

        // Low O2 warning
        this.warningText.setText(this.playerData.o2 < 30 ? 'LOW OXYGEN' : '');
        this.warningText.setAlpha(0.5 + 0.3 * Math.sin(this.time.now / 200));

        // Crosshair
        this.crosshair.clear();
        this.crosshair.lineStyle(1, 0x80ff80);
        const mx = this.input.activePointer.x;
        const my = this.input.activePointer.y;
        this.crosshair.lineBetween(mx - 8, my, mx - 3, my);
        this.crosshair.lineBetween(mx + 3, my, mx + 8, my);
        this.crosshair.lineBetween(mx, my - 8, mx, my - 3);
        this.crosshair.lineBetween(mx, my + 3, mx, my + 8);

        // Game state screens (Enhanced with stats)
        if (this.gameData.state === 'gameover' && !this.endScreenDrawn) {
            this.endScreenDrawn = true;
            const timeSurvived = Math.floor((Date.now() - this.gameStartTime) / 1000);

            // Performance rating
            let rating = 'LOST';
            let ratingColor = '#cc4040';
            if (this.stats.killCount >= 2 && timeSurvived >= 30) { rating = 'SURVIVOR'; ratingColor = '#aaaa40'; }
            if (this.stats.killCount >= 4 && this.stats.totalDamageDealt > 100) { rating = 'FIGHTER'; ratingColor = '#40aa60'; }
            if (this.stats.killCount >= 6 && this.stats.critCount >= 2) { rating = 'WARRIOR'; ratingColor = '#40aaff'; }

            const overlay = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.9);
            overlay.setScrollFactor(0).setDepth(200);

            const title = this.add.text(GAME_WIDTH/2, 100, 'GAME OVER', { fontSize: '48px', fontFamily: 'monospace', color: '#cc4040' });
            title.setOrigin(0.5).setScrollFactor(0).setDepth(201);

            const ratingText = this.add.text(GAME_WIDTH/2, 150, `RATING: ${rating}`, { fontSize: '28px', fontFamily: 'monospace', color: ratingColor });
            ratingText.setOrigin(0.5).setScrollFactor(0).setDepth(201);

            const statsLines = [
                `TIME SURVIVED: ${Math.floor(timeSurvived / 60)}:${(timeSurvived % 60).toString().padStart(2, '0')}`,
                ``,
                `KILLS: ${this.stats.killCount}`,
                `DAMAGE DEALT: ${this.stats.totalDamageDealt}`,
                `DAMAGE TAKEN: ${this.stats.totalDamageTaken}`,
                `CRITICAL HITS: ${this.stats.critCount}`,
                `MAX KILL STREAK: ${this.stats.maxKillStreak}`,
                ``,
                `ATTACKS MADE: ${this.stats.attacksMade}`,
                `ITEMS USED: ${this.stats.itemsPickedUp}`
            ];

            const statsText = this.add.text(GAME_WIDTH/2, 370, statsLines.join('\n'), { fontSize: '16px', fontFamily: 'monospace', color: '#aaaaaa', align: 'center' });
            statsText.setOrigin(0.5).setScrollFactor(0).setDepth(201);

        } else if (this.gameData.state === 'victory' && !this.endScreenDrawn) {
            this.endScreenDrawn = true;
            const timeElapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);

            // Efficiency rating
            let rating = 'D';
            let ratingColor = '#cc4040';
            if (this.stats.killCount >= 3 && timeElapsed < 300) { rating = 'C'; ratingColor = '#aaaa40'; }
            if (this.stats.killCount >= 5 && timeElapsed < 180) { rating = 'B'; ratingColor = '#40aa60'; }
            if (this.stats.killCount >= 7 && timeElapsed < 120 && this.stats.critCount >= 3) { rating = 'A'; ratingColor = '#40aaff'; }
            if (this.stats.killCount >= 8 && timeElapsed < 90 && this.stats.critCount >= 5) { rating = 'S'; ratingColor = '#ffaa00'; }

            const overlay = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x001a00, 0.9);
            overlay.setScrollFactor(0).setDepth(200);

            const title = this.add.text(GAME_WIDTH/2, 100, 'ESCAPED!', { fontSize: '48px', fontFamily: 'monospace', color: '#40aa40' });
            title.setOrigin(0.5).setScrollFactor(0).setDepth(201);

            const ratingText = this.add.text(GAME_WIDTH/2, 155, `EFFICIENCY: ${rating}`, { fontSize: '36px', fontFamily: 'monospace', color: ratingColor });
            ratingText.setOrigin(0.5).setScrollFactor(0).setDepth(201);

            const statsLines = [
                `TIME ELAPSED: ${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')}`,
                ``,
                `KILLS: ${this.stats.killCount}`,
                `DAMAGE DEALT: ${this.stats.totalDamageDealt}`,
                `DAMAGE TAKEN: ${this.stats.totalDamageTaken}`,
                `CRITICAL HITS: ${this.stats.critCount}`,
                `MAX KILL STREAK: ${this.stats.maxKillStreak}`,
                ``,
                `ATTACKS MADE: ${this.stats.attacksMade}`,
                `ITEMS USED: ${this.stats.itemsPickedUp}`,
                `INTEGRITY REMAINING: ${Math.floor(this.gameData.integrity)}%`
            ];

            const statsText = this.add.text(GAME_WIDTH/2, 380, statsLines.join('\n'), { fontSize: '16px', fontFamily: 'monospace', color: '#aaaaaa', align: 'center' });
            statsText.setOrigin(0.5).setScrollFactor(0).setDepth(201);
        }
    }

    addMessage(text) {
        this.gameData.messages.unshift({ text, time: this.time.now });
        if (this.gameData.messages.length > 4) this.gameData.messages.pop();
    }

    // Helper methods for visual effects
    damagePlayer(damage) {
        this.playerData.hp -= damage;
        this.stats.totalDamageTaken += damage;

        // Damage flash
        this.damageFlashAlpha = 0.4;

        // Screen shake
        this.triggerScreenShake(5);

        // Blood particles
        for (let i = 0; i < 3; i++) {
            const blood = this.add.image(
                this.player.x + Phaser.Math.Between(-15, 15),
                this.player.y + Phaser.Math.Between(-15, 15),
                'blood'
            );
            blood.setAlpha(0.6);
            blood.setScale(0.4 + Math.random() * 0.4);
            this.tweens.add({
                targets: blood,
                alpha: 0.2,
                duration: 400
            });
        }

        // Floating damage text
        this.createFloatingText(this.player.x, this.player.y - 30, '-' + damage, '#ff4444', 14);
    }

    createFloatingText(x, y, text, color, size) {
        const floatText = this.add.text(x, y, text, {
            fontSize: size + 'px',
            fontFamily: 'monospace',
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(120);

        this.floatingTexts.push({
            obj: floatText,
            life: 1,
            maxLife: 1,
            vy: -30
        });
    }

    triggerScreenShake(intensity) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    }

    updateVisualEffects(dt) {
        // Damage flash decay
        if (this.damageFlashAlpha > 0) {
            this.damageFlashAlpha = Math.max(0, this.damageFlashAlpha - dt * 2);
            this.damageOverlay.setAlpha(this.damageFlashAlpha);
        }

        // Low health pulsing
        if (this.playerData.hp < 30) {
            this.lowHealthPulse += dt * 4;
            const pulseAlpha = 0.15 + Math.sin(this.lowHealthPulse) * 0.1;
            this.lowHealthOverlay.setAlpha(pulseAlpha);
        } else {
            this.lowHealthOverlay.setAlpha(0);
        }

        // Screen shake
        if (this.screenShake.intensity > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.cameras.main.setScroll(
                this.cameras.main.scrollX + this.screenShake.x,
                this.cameras.main.scrollY + this.screenShake.y
            );
            this.screenShake.intensity = Math.max(0, this.screenShake.intensity - dt * 30);
        }
    }

    updateFloatingTexts(dt) {
        this.floatingTexts = this.floatingTexts.filter(ft => {
            ft.life -= dt;
            ft.obj.y += ft.vy * dt;
            ft.obj.setAlpha(ft.life / ft.maxLife);

            if (ft.life <= 0) {
                ft.obj.destroy();
                return false;
            }
            return true;
        });
    }

    updateKillStreak(dt) {
        if (this.killStreakTimer > 0) {
            this.killStreakTimer -= dt;
            if (this.killStreakTimer <= 0) {
                this.killStreak = 0;
            }
        }

        // Update kill streak display
        if (this.killStreak >= 2) {
            this.killStreakText.setText(`${this.killStreak}x STREAK`);
            this.killStreakText.setVisible(true);
        } else {
            this.killStreakText.setVisible(false);
        }
    }

    updateDebugOverlay() {
        if (!this.debugMode) return;

        const lines = [
            `KILLS: ${this.stats.killCount}`,
            `DMG DEALT: ${this.stats.totalDamageDealt}`,
            `DMG TAKEN: ${this.stats.totalDamageTaken}`,
            `CRITS: ${this.stats.critCount}`,
            `ITEMS: ${this.stats.itemsPickedUp}`,
            `ATTACKS: ${this.stats.attacksMade}`,
            `MAX STREAK: ${this.stats.maxKillStreak}`,
            `STREAK: ${this.killStreak}`,
            `---`,
            `HP: ${Math.floor(this.playerData.hp)}`,
            `O2: ${Math.floor(this.playerData.o2)}`,
            `INTEGRITY: ${Math.floor(this.gameData.integrity)}%`,
            `ENEMIES: ${this.enemies.filter(e => e.active).length}`
        ];

        this.debugText.setText(lines.join('\n'));
    }
}

const config = {
    type: Phaser.CANVAS,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0a0808',
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
