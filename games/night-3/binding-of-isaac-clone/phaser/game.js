// Basement Tears - Phaser 3 Version (20 Expand + 20 Polish)
// Binding of Isaac Style Roguelike

const TILE_SIZE = 48;
const ROOM_WIDTH = 13;
const ROOM_HEIGHT = 7;

const COLORS = {
    floor: 0x2A2018,
    floorAlt: 0x231A12,
    wall: 0x4A4A4A,
    wallDark: 0x2A2A2A,
    player: 0xEECCBB,
    tear: 0x6688CC,
    heart: 0xCC2222,
    blood: 0xAA2222,
    rock: 0x6A6A6A,
    poop: 0x6A4A2A
};

const ENEMY_DATA = {
    fly: { health: 4, speed: 70, width: 18, height: 18 },
    redFly: { health: 6, speed: 80, width: 18, height: 18 },
    gaper: { health: 12, speed: 45, width: 30, height: 30 },
    spider: { health: 6, speed: 90, width: 22, height: 22 },
    hopper: { health: 8, speed: 0, width: 24, height: 24 },
    charger: { health: 10, speed: 150, width: 26, height: 26 },
    bony: { health: 8, speed: 35, width: 24, height: 24 },
    boss_monstro: { health: 200, speed: 30, width: 80, height: 80, isBoss: true }
};

const ITEMS = {
    sad_onion: { name: 'Sad Onion', stat: 'tearDelay', value: -0.08 },
    spinach: { name: 'Spinach', stat: 'damage', value: 1.2 },
    inner_eye: { name: 'Inner Eye', stat: 'multishot', value: 3 }
};

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this.createTextures();
        this.scene.start('GameScene');
    }

    createTextures() {
        let gfx = this.make.graphics({ add: false });

        // Player
        gfx.fillStyle(COLORS.player);
        gfx.fillCircle(16, 12, 16);
        gfx.fillEllipse(16, 26, 24, 16);
        gfx.fillStyle(0x000000);
        gfx.fillEllipse(11, 10, 8, 12);
        gfx.fillEllipse(21, 10, 8, 12);
        gfx.lineStyle(2, 0x000000);
        gfx.beginPath();
        gfx.arc(16, 18, 5, 0.2, Math.PI - 0.2);
        gfx.strokePath();
        gfx.generateTexture('player', 32, 36);
        gfx.destroy();

        // Tear
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.tear);
        gfx.fillCircle(10, 10, 10);
        gfx.fillStyle(0xAADDFF);
        gfx.fillCircle(6, 6, 4);
        gfx.generateTexture('tear', 20, 20);
        gfx.destroy();

        // Enemy tear
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x661111);
        gfx.fillCircle(8, 8, 8);
        gfx.fillStyle(0xAA2222);
        gfx.fillCircle(5, 5, 3);
        gfx.generateTexture('enemy_tear', 16, 16);
        gfx.destroy();

        // Fly
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x555555);
        gfx.fillEllipse(5, 10, 6, 10);
        gfx.fillEllipse(19, 10, 6, 10);
        gfx.fillStyle(0x3A3A3A);
        gfx.fillCircle(12, 12, 8);
        gfx.fillStyle(0xFF0000);
        gfx.fillCircle(9, 10, 2.5);
        gfx.fillCircle(15, 10, 2.5);
        gfx.generateTexture('fly', 24, 24);
        gfx.destroy();

        // Red fly
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x555555);
        gfx.fillEllipse(5, 10, 6, 10);
        gfx.fillEllipse(19, 10, 6, 10);
        gfx.fillStyle(0x882222);
        gfx.fillCircle(12, 12, 8);
        gfx.fillStyle(0xFF4444);
        gfx.fillCircle(9, 10, 2.5);
        gfx.fillCircle(15, 10, 2.5);
        gfx.generateTexture('redFly', 24, 24);
        gfx.destroy();

        // Gaper
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xDDAA88);
        gfx.fillCircle(16, 16, 16);
        gfx.fillStyle(0x000000);
        gfx.fillEllipse(10, 13, 6, 8);
        gfx.fillEllipse(22, 13, 6, 8);
        gfx.fillStyle(0x4A2A1A);
        gfx.fillEllipse(16, 23, 10, 8);
        gfx.generateTexture('gaper', 32, 32);
        gfx.destroy();

        // Spider
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x3A3020);
        gfx.fillEllipse(14, 14, 18, 14);
        gfx.lineStyle(2, 0x3A3020);
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI - Math.PI / 2;
            gfx.lineBetween(14 + Math.cos(angle) * 6, 14 + Math.sin(angle) * 4,
                14 + Math.cos(angle) * 16, 14 + Math.sin(angle) * 10 + 4);
            gfx.lineBetween(14 - Math.cos(angle) * 6, 14 + Math.sin(angle) * 4,
                14 - Math.cos(angle) * 16, 14 + Math.sin(angle) * 10 + 4);
        }
        gfx.fillStyle(0xFF0000);
        gfx.fillCircle(10, 12, 2);
        gfx.fillCircle(18, 12, 2);
        gfx.generateTexture('spider', 28, 28);
        gfx.destroy();

        // Hopper
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x556644);
        gfx.fillEllipse(14, 14, 20, 16);
        gfx.fillStyle(0xFF0000);
        gfx.fillCircle(14, 10, 4);
        gfx.generateTexture('hopper', 28, 28);
        gfx.destroy();

        // Charger
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x664422);
        gfx.fillEllipse(14, 14, 22, 18);
        gfx.fillStyle(0xFF4400);
        gfx.fillCircle(9, 12, 3);
        gfx.fillCircle(19, 12, 3);
        gfx.generateTexture('charger', 28, 28);
        gfx.destroy();

        // Bony
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xDDDDCC);
        gfx.fillCircle(14, 14, 13);
        gfx.fillStyle(0x000000);
        gfx.fillEllipse(10, 12, 5, 7);
        gfx.fillEllipse(18, 12, 5, 7);
        gfx.generateTexture('bony', 28, 28);
        gfx.destroy();

        // Monstro boss
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xDDAA88);
        gfx.fillCircle(48, 48, 44);
        gfx.fillStyle(0x000000);
        gfx.fillEllipse(32, 40, 12, 18);
        gfx.fillEllipse(64, 40, 12, 18);
        gfx.fillStyle(0x662222);
        gfx.fillEllipse(48, 68, 24, 16);
        gfx.fillStyle(0xEEEECC);
        for (let i = -3; i <= 3; i++) {
            gfx.fillTriangle(48 + i * 5 - 2, 60, 48 + i * 5 + 2, 60, 48 + i * 5, 72);
        }
        gfx.generateTexture('boss_monstro', 96, 96);
        gfx.destroy();

        // Heart pickup
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.heart);
        gfx.fillCircle(7, 7, 7);
        gfx.fillCircle(17, 7, 7);
        gfx.fillTriangle(0, 10, 12, 24, 24, 10);
        gfx.generateTexture('heart_pickup', 24, 24);
        gfx.destroy();

        // Coin
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xFFDD44);
        gfx.fillCircle(10, 10, 10);
        gfx.fillStyle(0xAA9922);
        gfx.fillCircle(10, 10, 6);
        gfx.generateTexture('coin', 20, 20);
        gfx.destroy();

        // Bomb pickup
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x444444);
        gfx.fillCircle(12, 14, 10);
        gfx.lineStyle(2, 0xAA6622);
        gfx.lineBetween(12, 4, 15, -2);
        gfx.lineBetween(15, -2, 13, -6);
        gfx.fillStyle(0xFF6600);
        gfx.fillCircle(13, -6, 3);
        gfx.generateTexture('bomb_pickup', 24, 20);
        gfx.destroy();

        // Key pickup
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xFFCC22);
        gfx.fillCircle(10, 7, 6);
        gfx.fillRect(8, 10, 4, 14);
        gfx.fillRect(10, 17, 5, 3);
        gfx.fillRect(10, 21, 5, 3);
        gfx.generateTexture('key', 20, 28);
        gfx.destroy();

        // Floor tile
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.floor);
        gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        gfx.generateTexture('floor', TILE_SIZE, TILE_SIZE);
        gfx.destroy();

        // Wall tile
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.wall);
        gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        gfx.fillStyle(COLORS.wallDark);
        gfx.fillRect(3, 3, TILE_SIZE - 6, 12);
        gfx.fillRect(6, 18, TILE_SIZE - 12, 12);
        gfx.fillRect(3, 33, TILE_SIZE - 6, 12);
        gfx.generateTexture('wall', TILE_SIZE, TILE_SIZE);
        gfx.destroy();

        // Rock
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.rock);
        gfx.fillTriangle(4, 36, 20, 4, 36, 36);
        gfx.fillStyle(0x4A4A4A);
        gfx.fillTriangle(10, 36, 20, 14, 30, 36);
        gfx.generateTexture('rock', 40, 40);
        gfx.destroy();

        // Poop
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.poop);
        gfx.fillCircle(20, 28, 16);
        gfx.fillCircle(12, 16, 12);
        gfx.fillCircle(28, 20, 10);
        gfx.fillCircle(20, 6, 6);
        gfx.generateTexture('poop', 40, 40);
        gfx.destroy();

        // Spike
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0x666666);
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            gfx.fillTriangle(
                16 + Math.cos(angle) * 4, 16 + Math.sin(angle) * 4,
                16 + Math.cos(angle + 0.3) * 16, 16 + Math.sin(angle + 0.3) * 16,
                16 + Math.cos(angle - 0.3) * 16, 16 + Math.sin(angle - 0.3) * 16
            );
        }
        gfx.generateTexture('spike', 32, 32);
        gfx.destroy();

        // Item glow
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(0xFFDD44);
        gfx.fillCircle(16, 16, 14);
        gfx.generateTexture('item', 32, 32);
        gfx.destroy();

        // Blood particle
        gfx = this.make.graphics({ add: false });
        gfx.fillStyle(COLORS.blood);
        gfx.fillCircle(4, 4, 4);
        gfx.generateTexture('blood', 8, 8);
        gfx.destroy();
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.roomOffsetX = (960 - ROOM_WIDTH * TILE_SIZE) / 2;
        this.roomOffsetY = 100;

        // Floor state
        this.currentRoom = { x: 4, y: 4 };
        this.floorMap = [];
        this.visitedRooms = new Set();
        this.floorNum = 1;
        this.totalKills = 0;

        // Generate floor
        this.generateFloor();

        // Draw initial room
        this.levelGroup = this.add.group();
        this.drawRoom();

        // Blood stains
        this.bloodStains = this.add.graphics();
        this.bloodStains.setDepth(1);

        // Player
        this.player = this.add.sprite(
            this.roomOffsetX + ROOM_WIDTH * TILE_SIZE / 2,
            this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE / 2,
            'player'
        );
        this.player.setDepth(10);
        this.physics.add.existing(this.player);
        this.player.body.setSize(24, 24);

        this.initPlayer();

        // Groups
        this.tears = this.add.group();
        this.enemyTears = this.add.group();
        this.enemies = this.add.group();
        this.pickups = this.add.group();
        this.obstacles = this.add.group();
        this.items = this.add.group();
        this.doors = [];

        // Generate room content
        this.generateRoomContent();

        // Particles
        this.bloodParticles = this.add.particles(0, 0, 'blood', {
            speed: { min: 100, max: 200 },
            scale: { start: 1, end: 0 },
            lifespan: 400,
            emitting: false
        });

        // Input
        this.cursors = this.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            i: Phaser.Input.Keyboard.KeyCodes.I,
            j: Phaser.Input.Keyboard.KeyCodes.J,
            k: Phaser.Input.Keyboard.KeyCodes.K,
            l: Phaser.Input.Keyboard.KeyCodes.L,
            e: Phaser.Input.Keyboard.KeyCodes.E
        });

        // HUD
        this.createHUD();

        // Vignette effect for atmosphere
        this.createVignette();

        // Debug mode
        this.debugMode = false;
        this.debugText = null;
        this.input.keyboard.on('keydown-BACKTICK', () => this.toggleDebug());

        // Game state
        this.gameState = 'playing';
        this.lastFireDir = { x: 0, y: 1 };

        // Expose for testing
        window.gameState = () => ({
            state: this.gameState,
            playerHealth: this.playerHealth,
            enemies: this.enemies.getLength(),
            room: this.currentRoom,
            visited: this.visitedRooms.size
        });
    }

    initPlayer() {
        this.playerHealth = 6;
        this.maxHealth = 6;
        this.soulHearts = 0;
        this.coins = 0;
        this.bombs = 1;
        this.keys = 1;
        this.damage = 3.5;
        this.tearDelay = 0.35;
        this.fireTimer = 0;
        this.invulnTimer = 0;
        this.multishot = 1;
        this.collectedItems = [];
        // Additional stats for tears
        this.range = 220;
        this.shotSpeed = 320;
        this.speed = 160;
    }

    generateFloor() {
        this.floorMap = [];
        for (let y = 0; y < 9; y++) {
            this.floorMap[y] = [];
            for (let x = 0; x < 9; x++) {
                this.floorMap[y][x] = null;
            }
        }

        this.floorMap[4][4] = { type: 'start', cleared: true };

        const roomCount = 8 + this.floorNum * 2;
        const roomPositions = [{ x: 4, y: 4 }];

        while (roomPositions.length < roomCount) {
            const room = roomPositions[Math.floor(Math.random() * roomPositions.length)];
            const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            const newX = room.x + dir.x;
            const newY = room.y + dir.y;

            if (newX >= 0 && newX < 9 && newY >= 0 && newY < 9 && !this.floorMap[newY][newX]) {
                this.floorMap[newY][newX] = { type: 'normal', cleared: false };
                roomPositions.push({ x: newX, y: newY });
            }
        }

        // Boss room (farthest)
        let farthest = { x: 4, y: 4 };
        let maxDist = 0;
        for (let pos of roomPositions) {
            const dist = Math.abs(pos.x - 4) + Math.abs(pos.y - 4);
            if (dist > maxDist && !(pos.x === 4 && pos.y === 4)) {
                maxDist = dist;
                farthest = pos;
            }
        }
        this.floorMap[farthest.y][farthest.x] = { type: 'boss', cleared: false };

        // Treasure room
        for (let pos of roomPositions) {
            if (this.floorMap[pos.y][pos.x].type === 'normal') {
                this.floorMap[pos.y][pos.x] = { type: 'treasure', cleared: false };
                break;
            }
        }

        // Shop room
        for (let pos of roomPositions) {
            if (this.floorMap[pos.y][pos.x].type === 'normal') {
                this.floorMap[pos.y][pos.x] = { type: 'shop', cleared: true };
                break;
            }
        }

        this.visitedRooms.add('4,4');
    }

    drawRoom() {
        this.levelGroup.clear(true, true);

        // Floor
        for (let y = 1; y < ROOM_HEIGHT - 1; y++) {
            for (let x = 1; x < ROOM_WIDTH - 1; x++) {
                const tile = this.add.image(
                    this.roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2,
                    this.roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2,
                    'floor'
                );
                if ((x + y) % 2 === 1) tile.setTint(0x231A12);
                this.levelGroup.add(tile);
            }
        }

        // Walls
        for (let x = 0; x < ROOM_WIDTH; x++) {
            const topWall = this.add.image(
                this.roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2,
                this.roomOffsetY + TILE_SIZE / 2,
                'wall'
            );
            const bottomWall = this.add.image(
                this.roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2,
                this.roomOffsetY + (ROOM_HEIGHT - 1) * TILE_SIZE + TILE_SIZE / 2,
                'wall'
            );
            this.levelGroup.add(topWall);
            this.levelGroup.add(bottomWall);
        }
        for (let y = 0; y < ROOM_HEIGHT; y++) {
            const leftWall = this.add.image(
                this.roomOffsetX + TILE_SIZE / 2,
                this.roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2,
                'wall'
            );
            const rightWall = this.add.image(
                this.roomOffsetX + (ROOM_WIDTH - 1) * TILE_SIZE + TILE_SIZE / 2,
                this.roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2,
                'wall'
            );
            this.levelGroup.add(leftWall);
            this.levelGroup.add(rightWall);
        }
    }

    generateRoomContent() {
        this.enemies.clear(true, true);
        this.obstacles.clear(true, true);
        this.pickups.clear(true, true);
        this.items.clear(true, true);
        this.enemyTears.clear(true, true);
        this.doors = [];

        const roomData = this.floorMap[this.currentRoom.y][this.currentRoom.x];
        if (!roomData) return;

        // Generate doors
        const dirs = [
            { x: 0, y: -1, doorX: this.roomOffsetX + ROOM_WIDTH * TILE_SIZE / 2, doorY: this.roomOffsetY + TILE_SIZE / 2 },
            { x: 0, y: 1, doorX: this.roomOffsetX + ROOM_WIDTH * TILE_SIZE / 2, doorY: this.roomOffsetY + (ROOM_HEIGHT - 0.5) * TILE_SIZE },
            { x: -1, y: 0, doorX: this.roomOffsetX + TILE_SIZE / 2, doorY: this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE / 2 },
            { x: 1, y: 0, doorX: this.roomOffsetX + (ROOM_WIDTH - 0.5) * TILE_SIZE, doorY: this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE / 2 }
        ];

        for (let dir of dirs) {
            const adjX = this.currentRoom.x + dir.x;
            const adjY = this.currentRoom.y + dir.y;
            if (adjX >= 0 && adjX < 9 && adjY >= 0 && adjY < 9 && this.floorMap[adjY][adjX]) {
                const doorRect = this.add.rectangle(dir.doorX, dir.doorY, 50, 10, roomData.cleared ? COLORS.floor : 0x4A3A2A);
                doorRect.setRotation(dir.x === 0 ? 0 : Math.PI / 2);
                doorRect.setDepth(2);
                this.doors.push({ x: dir.doorX, y: dir.doorY, direction: dir, open: roomData.cleared, sprite: doorRect });
            }
        }

        if (roomData.cleared || roomData.type === 'start') return;

        // Spawn obstacles
        const obstacleCount = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < obstacleCount; i++) {
            const ox = this.roomOffsetX + (2 + Math.random() * (ROOM_WIDTH - 4)) * TILE_SIZE;
            const oy = this.roomOffsetY + (2 + Math.random() * (ROOM_HEIGHT - 4)) * TILE_SIZE;
            const types = ['rock', 'poop', 'spike'];
            const type = types[Math.floor(Math.random() * types.length)];
            const obs = this.add.image(ox, oy, type);
            obs.setDepth(3);
            obs.obstacleType = type;
            this.obstacles.add(obs);
        }

        // Spawn enemies
        if (roomData.type === 'normal') {
            const enemyCount = 2 + Math.floor(Math.random() * 3) + this.floorNum;
            const types = ['fly', 'redFly', 'gaper', 'spider', 'hopper', 'charger', 'bony'];
            for (let i = 0; i < enemyCount; i++) {
                const ex = this.roomOffsetX + (2 + Math.random() * (ROOM_WIDTH - 4)) * TILE_SIZE;
                const ey = this.roomOffsetY + (2 + Math.random() * (ROOM_HEIGHT - 4)) * TILE_SIZE;
                this.createEnemy(ex, ey, types[Math.floor(Math.random() * types.length)]);
            }
        } else if (roomData.type === 'boss') {
            this.createEnemy(
                this.roomOffsetX + ROOM_WIDTH * TILE_SIZE / 2,
                this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE / 2,
                'boss_monstro'
            );
        } else if (roomData.type === 'treasure') {
            const itemKeys = Object.keys(ITEMS);
            const randomItem = itemKeys[Math.floor(Math.random() * itemKeys.length)];
            const item = this.add.image(
                this.roomOffsetX + ROOM_WIDTH * TILE_SIZE / 2,
                this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE / 2 - 20,
                'item'
            );
            item.setDepth(3);
            item.itemId = randomItem;
            item.itemData = ITEMS[randomItem];
            this.items.add(item);
            roomData.cleared = true;
            this.doors.forEach(d => { d.open = true; d.sprite.setFillStyle(COLORS.floor); });
        } else if (roomData.type === 'shop') {
            const shopItems = [
                { x: 5, type: 'heart_pickup' },
                { x: 7, type: 'bomb_pickup' },
                { x: 9, type: 'key' }
            ];
            shopItems.forEach(si => {
                const pickup = this.add.sprite(
                    this.roomOffsetX + si.x * TILE_SIZE,
                    this.roomOffsetY + 3 * TILE_SIZE,
                    si.type
                );
                pickup.setDepth(3);
                pickup.pickupType = si.type.replace('_pickup', '');
                pickup.price = si.type === 'heart_pickup' ? 3 : 5;
                this.pickups.add(pickup);
            });
        }
    }

    createEnemy(x, y, type) {
        const enemy = this.add.sprite(x, y, type);
        enemy.setDepth(6);
        enemy.enemyType = type;
        const data = ENEMY_DATA[type] || ENEMY_DATA.fly;
        enemy.health = data.health;
        enemy.maxHealth = data.health;
        enemy.speed = data.speed;
        enemy.isBoss = data.isBoss || false;
        enemy.floatPhase = Math.random() * Math.PI * 2;
        enemy.state = 'idle';
        enemy.stateTimer = 0;
        enemy.moveDir = { x: 0, y: 0 };
        enemy.fireTimer = 0;
        enemy.jumping = false;
        enemy.hitFlash = 0;
        // Wake-up delay - enemies don't attack immediately
        enemy.spawnAnim = 0.6;
        enemy.setAlpha(0.5);
        this.physics.add.existing(enemy);
        this.enemies.add(enemy);
    }

    createHUD() {
        // Background
        this.add.rectangle(480, 47, 960, 94, 0x0A0A0A).setDepth(100);

        // Hearts
        this.heartSprites = [];
        for (let i = 0; i < 3; i++) {
            const heart = this.add.image(35 + i * 30, 25, 'heart_pickup');
            heart.setDepth(101);
            this.heartSprites.push(heart);
        }

        const textStyle = { fontFamily: 'monospace', fontSize: '16px', color: '#FFFFFF' };

        // Coins
        this.add.image(30, 60, 'coin').setScale(0.8).setDepth(101);
        this.coinText = this.add.text(48, 52, '00', textStyle).setDepth(101);

        // Bombs
        this.add.image(100, 60, 'bomb_pickup').setScale(0.8).setDepth(101);
        this.bombText = this.add.text(118, 52, '01', textStyle).setDepth(101);

        // Keys
        this.add.image(170, 60, 'key').setScale(0.7).setDepth(101);
        this.keyText = this.add.text(188, 52, '01', textStyle).setDepth(101);

        // Floor text
        this.floorText = this.add.text(30, 80, 'Basement 1', { fontFamily: 'monospace', fontSize: '14px', color: '#FFFFFF' }).setDepth(101);

        // Player stats display
        const statsStyle = { fontFamily: 'monospace', fontSize: '11px', color: '#AAAAAA' };
        this.statDmgText = this.add.text(250, 20, 'DMG: 3.5', statsStyle).setDepth(101);
        this.statSpdText = this.add.text(250, 35, 'SPD: 1.0', statsStyle).setDepth(101);
        this.statTearsText = this.add.text(330, 20, 'TEARS: 2.9/s', statsStyle).setDepth(101);
        this.statRangeText = this.add.text(330, 35, 'RANGE: 1.0', statsStyle).setDepth(101);

        // Minimap
        this.minimapBg = this.add.rectangle(890, 50, 110, 100, 0x000000, 0.6).setDepth(100);
        this.minimap = this.add.graphics().setDepth(101);

        // Boss health bar
        this.bossHealthBg = this.add.rectangle(480, 75, 300, 16, 0x222222).setDepth(100).setVisible(false);
        this.bossHealthFill = this.add.rectangle(331, 75, 296, 12, COLORS.heart).setDepth(100).setOrigin(0, 0.5).setVisible(false);
        this.bossText = this.add.text(480, 75, 'MONSTRO', { fontFamily: 'monospace', fontSize: '12px', color: '#FFFFFF' }).setOrigin(0.5).setDepth(101).setVisible(false);
    }

    createVignette() {
        // Create vignette graphics for Isaac-style spotlight effect
        this.vignetteGraphics = this.add.graphics();
        this.vignetteGraphics.setDepth(50);
    }

    updateVignette() {
        if (!this.vignetteGraphics) return;

        this.vignetteGraphics.clear();

        // Room center
        const roomCenterX = this.roomOffsetX + (ROOM_WIDTH * TILE_SIZE) / 2;
        const roomCenterY = this.roomOffsetY + (ROOM_HEIGHT * TILE_SIZE) / 2;
        const roomWidth = ROOM_WIDTH * TILE_SIZE;
        const roomHeight = ROOM_HEIGHT * TILE_SIZE;

        // Corner darkening for Isaac-style atmosphere
        const corners = [
            [this.roomOffsetX, this.roomOffsetY],
            [this.roomOffsetX + roomWidth, this.roomOffsetY],
            [this.roomOffsetX, this.roomOffsetY + roomHeight],
            [this.roomOffsetX + roomWidth, this.roomOffsetY + roomHeight]
        ];

        // Draw gradient darkness in corners
        corners.forEach(([cx, cy]) => {
            for (let r = 150; r > 0; r -= 10) {
                const alpha = (1 - r / 150) * 0.3;
                this.vignetteGraphics.fillStyle(0x000000, alpha);
                this.vignetteGraphics.fillCircle(cx, cy, r);
            }
        });

        // Subtle overall darkening at edges
        this.vignetteGraphics.fillStyle(0x000000, 0.15);
        this.vignetteGraphics.fillRect(this.roomOffsetX, this.roomOffsetY, roomWidth, 30);
        this.vignetteGraphics.fillRect(this.roomOffsetX, this.roomOffsetY + roomHeight - 30, roomWidth, 30);
        this.vignetteGraphics.fillRect(this.roomOffsetX, this.roomOffsetY, 30, roomHeight);
        this.vignetteGraphics.fillRect(this.roomOffsetX + roomWidth - 30, this.roomOffsetY, 30, roomHeight);
    }

    update(time, delta) {
        if (this.gameState !== 'playing') return;

        const dt = delta / 1000;

        // Movement
        let dx = 0, dy = 0;
        if (this.cursors.w.isDown) dy = -1;
        if (this.cursors.s.isDown) dy = 1;
        if (this.cursors.a.isDown) dx = -1;
        if (this.cursors.d.isDown) dx = 1;

        if (dx && dy) { dx *= 0.707; dy *= 0.707; }

        const speed = 160;
        this.player.body.setVelocity(dx * speed, dy * speed);

        // Keep in bounds
        const minX = this.roomOffsetX + TILE_SIZE + 16;
        const maxX = this.roomOffsetX + (ROOM_WIDTH - 1) * TILE_SIZE - 16;
        const minY = this.roomOffsetY + TILE_SIZE + 16;
        const maxY = this.roomOffsetY + (ROOM_HEIGHT - 1) * TILE_SIZE - 16;

        this.player.x = Phaser.Math.Clamp(this.player.x, minX, maxX);
        this.player.y = Phaser.Math.Clamp(this.player.y, minY, maxY);

        // Shooting
        let fireX = 0, fireY = 0;
        if (this.cursors.i.isDown) fireY = -1;
        if (this.cursors.k.isDown) fireY = 1;
        if (this.cursors.j.isDown) fireX = -1;
        if (this.cursors.l.isDown) fireX = 1;

        if (fireX && fireY) fireY = 0;

        if (fireX || fireY) this.lastFireDir = { x: fireX, y: fireY };

        this.fireTimer -= dt;
        if ((fireX || fireY) && this.fireTimer <= 0) {
            this.shoot(fireX, fireY);
        }

        // Bomb placement
        if (Phaser.Input.Keyboard.JustDown(this.cursors.e) && this.bombs > 0) {
            this.placeBomb();
        }

        // Update tears
        this.updateTears(dt);

        // Update enemies
        this.updateEnemies(dt);

        // Update enemy tears
        this.updateEnemyTears(dt);

        // Check pickups
        this.updatePickups();

        // Check items
        this.updateItems();

        // Check doors
        this.checkDoors();

        // Invulnerability
        if (this.invulnTimer > 0) {
            this.invulnTimer -= dt;
            this.player.alpha = Math.floor(this.invulnTimer * 10) % 2 === 0 ? 0.5 : 1;
        } else {
            this.player.alpha = 1;
        }

        // Low health pulse
        if (this.playerHealth <= 2) {
            const pulse = Math.sin(time / 150) * 0.2 + 0.8;
            this.player.alpha *= pulse;
        }

        // Check room cleared
        this.checkRoomCleared();

        // Update visuals
        this.updateVignette();
        this.updateHUD();
        this.updateDebugDisplay();
    }

    toggleDebug() {
        this.debugMode = !this.debugMode;
        if (this.debugMode) {
            this.debugText = this.add.text(10, 100, '', {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#00ff00',
                backgroundColor: '#000000cc',
                padding: { x: 8, y: 8 }
            }).setScrollFactor(0).setDepth(1000);
        } else if (this.debugText) {
            this.debugText.destroy();
            this.debugText = null;
        }
    }

    updateDebugDisplay() {
        if (!this.debugMode || !this.debugText || !this.player) return;
        const enemyCount = this.enemies ? this.enemies.countActive() : 0;
        this.debugText.setText([
            '=== DEBUG (` to close) ===',
            `Room: (${this.currentRoom.x}, ${this.currentRoom.y})`,
            `Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
            `HP: ${this.health}/${this.maxHealth}`,
            `Damage: ${(this.damage || 3.5).toFixed(1)}`,
            `Enemies: ${enemyCount}`,
            `Tears: ${this.tears ? this.tears.countActive() : 0}`,
            `Floor: ${this.floorNum || 1}`,
            `Kills: ${this.kills || 0}`,
            `FPS: ${Math.round(this.game.loop.actualFps)}`
        ].join('\n'));
    }

    shoot(dx, dy) {
        const spread = this.multishot > 1 ? 0.15 : 0;
        for (let i = 0; i < this.multishot; i++) {
            const angle = Math.atan2(dy, dx) + (i - (this.multishot - 1) / 2) * spread;
            const vx = Math.cos(angle) * this.shotSpeed;
            const vy = Math.sin(angle) * this.shotSpeed;

            const tear = this.add.sprite(this.player.x, this.player.y - 10, 'tear');
            tear.setDepth(8);
            tear.damage = this.damage;
            // Tear arc properties
            tear.distanceTraveled = 0;
            tear.maxRange = this.range;
            tear.startY = this.player.y - 10;
            tear.arcHeight = 0;
            this.physics.add.existing(tear);
            tear.body.setVelocity(vx, vy);
            this.tears.add(tear);
        }
        this.fireTimer = this.tearDelay;
    }

    placeBomb() {
        this.bombs--;
        const bomb = this.add.circle(this.player.x, this.player.y, 14, 0x222222);
        bomb.setDepth(4);
        bomb.timer = 2.0;
        bomb.isBomb = true;
        this.obstacles.add(bomb);
    }

    updateTears(dt) {
        this.tears.children.iterate(tear => {
            if (!tear || !tear.active) return;

            // Track distance traveled for arc motion
            if (tear.body) {
                const speed = tear.body.velocity.length();
                tear.distanceTraveled += speed * dt;

                // Calculate arc height (parabola simulation)
                const progress = tear.distanceTraveled / tear.maxRange;
                tear.arcHeight = Math.sin(progress * Math.PI) * 18;

                // Apply visual offset (not physics - just display)
                tear.setY(tear.body.y - tear.arcHeight);

                // Shrink tear as it reaches end of range
                if (progress > 0.7) {
                    const shrink = 1 - (progress - 0.7) / 0.3;
                    tear.setScale(Math.max(0.3, shrink));
                }

                // Destroy when out of range
                if (progress >= 1) {
                    this.splashTear(tear);
                    tear.destroy();
                    return;
                }
            }

            // Auto-aim assist (gentle homing)
            if (this.enemies.children.size > 0 && tear.body) {
                let nearest = null;
                let nearestDist = 120;  // Max homing range
                this.enemies.children.iterate(enemy => {
                    if (!enemy || !enemy.active) return;
                    const dist = Phaser.Math.Distance.Between(tear.x, tear.y, enemy.x, enemy.y);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearest = enemy;
                    }
                });
                if (nearest) {
                    const targetAngle = Phaser.Math.Angle.Between(tear.x, tear.y, nearest.x, nearest.y);
                    const tearAngle = Math.atan2(tear.body.velocity.y, tear.body.velocity.x);
                    let angleDiff = targetAngle - tearAngle;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    // Only curve if within 30 degrees
                    if (Math.abs(angleDiff) < Math.PI / 6) {
                        const homeStrength = 2.0 * dt;
                        const speed = tear.body.velocity.length();
                        const newAngle = tearAngle + angleDiff * homeStrength;
                        tear.body.setVelocity(Math.cos(newAngle) * speed, Math.sin(newAngle) * speed);
                    }
                }
            }

            if (tear.x < this.roomOffsetX + TILE_SIZE ||
                tear.x > this.roomOffsetX + (ROOM_WIDTH - 1) * TILE_SIZE ||
                tear.y < this.roomOffsetY + TILE_SIZE ||
                tear.y > this.roomOffsetY + (ROOM_HEIGHT - 1) * TILE_SIZE) {
                this.splashTear(tear);
                tear.destroy();
                return;
            }

            this.enemies.children.iterate(enemy => {
                if (!enemy || !enemy.active) return;
                const dist = Phaser.Math.Distance.Between(tear.x, tear.y, enemy.x, enemy.y);
                if (dist < 20) {
                    // Critical hit chance (10%)
                    const isCrit = Math.random() < 0.1;
                    const finalDamage = isCrit ? tear.damage * 2 : tear.damage;

                    if (isCrit) {
                        this.showFloatingText(enemy.x, enemy.y - 30, 'CRITICAL!', '#FF4400', 1.5);
                        this.cameras.main.shake(80, 0.005);
                    }

                    this.hitEnemy(enemy, finalDamage);
                    this.splashTear(tear);
                    tear.destroy();
                }
            });
        });
    }

    splashTear(tear) {
        for (let i = 0; i < 4; i++) {
            const particle = this.add.circle(
                tear.x + (Math.random() - 0.5) * 10,
                tear.y + (Math.random() - 0.5) * 10,
                3, COLORS.tear
            );
            this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0,
                duration: 200,
                onComplete: () => particle.destroy()
            });
        }
    }

    updateEnemies(dt) {
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.active) return;

            // Wake-up animation - enemies don't move/attack during this
            if (enemy.spawnAnim > 0) {
                enemy.spawnAnim -= dt;
                enemy.setAlpha(0.5 + (0.6 - enemy.spawnAnim) * 0.8);
                return; // Skip all behavior during spawn animation
            } else if (enemy.alpha < 1) {
                enemy.setAlpha(1);
            }

            if (enemy.hitFlash > 0) {
                enemy.hitFlash -= dt;
                enemy.setTint(0xFFFFFF);
            } else {
                enemy.clearTint();
            }

            switch (enemy.enemyType) {
                case 'fly':
                case 'redFly':
                    this.updateFly(enemy, dt);
                    break;
                case 'gaper':
                    this.updateGaper(enemy, dt);
                    break;
                case 'spider':
                    this.updateSpider(enemy, dt);
                    break;
                case 'hopper':
                    this.updateHopper(enemy, dt);
                    break;
                case 'charger':
                    this.updateCharger(enemy, dt);
                    break;
                case 'bony':
                    this.updateBony(enemy, dt);
                    break;
                case 'boss_monstro':
                    this.updateMonstro(enemy, dt);
                    break;
                default:
                    this.updateGaper(enemy, dt);
            }

            // Player collision
            if (!enemy.jumping) {
                const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                if (dist < 24 && this.invulnTimer <= 0) {
                    this.takeDamage(1);
                }
            }
        });
    }

    updateFly(enemy, dt) {
        enemy.floatPhase += dt * 5;
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        enemy.x += Math.cos(angle) * enemy.speed * dt + (Math.random() - 0.5) * 30 * dt;
        enemy.y += Math.sin(angle) * enemy.speed * dt + (Math.random() - 0.5) * 30 * dt + Math.sin(enemy.floatPhase) * 0.5;
    }

    updateGaper(enemy, dt) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        enemy.x += Math.cos(angle) * enemy.speed * dt;
        enemy.y += Math.sin(angle) * enemy.speed * dt;
    }

    updateSpider(enemy, dt) {
        enemy.stateTimer -= dt;
        if (enemy.stateTimer <= 0) {
            enemy.stateTimer = 0.3 + Math.random() * 0.4;
            if (Math.random() < 0.7) {
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                enemy.moveDir = { x: Math.cos(angle), y: Math.sin(angle) };
            } else {
                const angle = Math.random() * Math.PI * 2;
                enemy.moveDir = { x: Math.cos(angle), y: Math.sin(angle) };
            }
        }
        enemy.x += enemy.moveDir.x * enemy.speed * dt;
        enemy.y += enemy.moveDir.y * enemy.speed * dt;
    }

    updateHopper(enemy, dt) {
        enemy.stateTimer -= dt;
        if (enemy.state === 'idle' && enemy.stateTimer <= 0) {
            enemy.state = 'jump';
            enemy.stateTimer = 0.5;
            enemy.jumping = true;
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            enemy.moveDir = { x: Math.cos(angle), y: Math.sin(angle) };
        } else if (enemy.state === 'jump') {
            enemy.x += enemy.moveDir.x * 150 * dt;
            enemy.y += enemy.moveDir.y * 150 * dt;
            if (enemy.stateTimer <= 0) {
                enemy.state = 'idle';
                enemy.stateTimer = 1 + Math.random();
                enemy.jumping = false;
            }
        }
    }

    updateCharger(enemy, dt) {
        enemy.stateTimer -= dt;
        if (enemy.state === 'idle' && enemy.stateTimer <= 0) {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            if (Math.abs(dx) < 30 || Math.abs(dy) < 30) {
                enemy.state = 'charge';
                enemy.stateTimer = 0.8;
                enemy.moveDir = { x: Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : 0, y: Math.abs(dy) >= Math.abs(dx) ? Math.sign(dy) : 0 };
            }
        } else if (enemy.state === 'charge') {
            enemy.x += enemy.moveDir.x * enemy.speed * dt;
            enemy.y += enemy.moveDir.y * enemy.speed * dt;
            if (enemy.stateTimer <= 0) {
                enemy.state = 'idle';
                enemy.stateTimer = 1;
            }
        }
    }

    updateBony(enemy, dt) {
        this.updateGaper(enemy, dt);
        enemy.fireTimer -= dt;
        if (enemy.fireTimer <= 0) {
            const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            if (dist < 250) {
                enemy.fireTimer = 2;
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                const tear = this.add.sprite(enemy.x, enemy.y, 'enemy_tear');
                tear.setDepth(7);
                tear.life = 2;
                this.physics.add.existing(tear);
                tear.body.setVelocity(Math.cos(angle) * 180, Math.sin(angle) * 180);
                this.enemyTears.add(tear);
            }
        }
    }

    updateMonstro(enemy, dt) {
        enemy.stateTimer -= dt;
        if (enemy.state === 'idle' && enemy.stateTimer <= 0) {
            const attacks = ['jump', 'spit'];
            enemy.state = attacks[Math.floor(Math.random() * attacks.length)];
            enemy.stateTimer = enemy.state === 'jump' ? 1.0 : 0.8;
            if (enemy.state === 'jump') {
                enemy.moveDir = { x: this.player.x - enemy.x, y: this.player.y - enemy.y };
            }
        } else if (enemy.state === 'jump') {
            enemy.x += enemy.moveDir.x * dt;
            enemy.y += enemy.moveDir.y * dt;
            if (enemy.stateTimer <= 0) {
                enemy.state = 'idle';
                enemy.stateTimer = 1.5;
                this.cameras.main.shake(200, 0.02);
                // Spawn tears on landing
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const tear = this.add.sprite(enemy.x, enemy.y, 'enemy_tear');
                    tear.setDepth(7);
                    tear.life = 2;
                    this.physics.add.existing(tear);
                    tear.body.setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150);
                    this.enemyTears.add(tear);
                }
            }
        } else if (enemy.state === 'spit') {
            if (enemy.stateTimer <= 0.3 && enemy.stateTimer > 0.2) {
                for (let i = 0; i < 5; i++) {
                    const spread = (Math.random() - 0.5) * 0.8;
                    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y) + spread;
                    const tear = this.add.sprite(enemy.x, enemy.y - 20, 'enemy_tear');
                    tear.setDepth(7);
                    tear.life = 2;
                    this.physics.add.existing(tear);
                    tear.body.setVelocity(Math.cos(angle) * 220, Math.sin(angle) * 220);
                    this.enemyTears.add(tear);
                }
                enemy.stateTimer = 0.2;
            }
            if (enemy.stateTimer <= 0) {
                enemy.state = 'idle';
                enemy.stateTimer = 2;
            }
        }
    }

    updateEnemyTears(dt) {
        this.enemyTears.children.iterate(tear => {
            if (!tear || !tear.active) return;

            tear.life -= dt;
            if (tear.life <= 0) {
                tear.destroy();
                return;
            }

            if (tear.x < this.roomOffsetX + TILE_SIZE ||
                tear.x > this.roomOffsetX + (ROOM_WIDTH - 1) * TILE_SIZE ||
                tear.y < this.roomOffsetY + TILE_SIZE ||
                tear.y > this.roomOffsetY + (ROOM_HEIGHT - 1) * TILE_SIZE) {
                tear.destroy();
                return;
            }

            const dist = Phaser.Math.Distance.Between(tear.x, tear.y, this.player.x, this.player.y);
            if (dist < 20 && this.invulnTimer <= 0) {
                this.takeDamage(1);
                tear.destroy();
            }
        });

        // Update bomb timers
        this.obstacles.children.iterate(obs => {
            if (!obs || !obs.isBomb) return;
            obs.timer -= dt / 1000;
            if (obs.timer < 0.5 && Math.floor(obs.timer * 10) % 2 === 0) {
                obs.setFillStyle(0xFF0000);
            } else {
                obs.setFillStyle(0x222222);
            }
            if (obs.timer <= 0) {
                this.explodeBomb(obs);
            }
        });
    }

    explodeBomb(bomb) {
        this.cameras.main.shake(150, 0.015);

        // Damage enemies
        this.enemies.children.iterate(enemy => {
            if (!enemy || !enemy.active) return;
            const dist = Phaser.Math.Distance.Between(bomb.x, bomb.y, enemy.x, enemy.y);
            if (dist < 100) {
                this.hitEnemy(enemy, 60);
            }
        });

        // Damage player
        const playerDist = Phaser.Math.Distance.Between(bomb.x, bomb.y, this.player.x, this.player.y);
        if (playerDist < 80 && this.invulnTimer <= 0) {
            this.takeDamage(1);
        }

        // Particles
        for (let i = 0; i < 10; i++) {
            const particle = this.add.circle(
                bomb.x + (Math.random() - 0.5) * 40,
                bomb.y + (Math.random() - 0.5) * 40,
                6, 0xFF6622
            );
            this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }

        bomb.destroy();
    }

    hitEnemy(enemy, damage) {
        enemy.health -= damage;
        enemy.hitFlash = 0.15;
        this.cameras.main.shake(50, 0.005);

        // Floating damage
        const dmgText = this.add.text(enemy.x, enemy.y - 20, Math.round(damage).toString(), {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFFF44'
        });
        dmgText.setOrigin(0.5).setDepth(50);
        this.tweens.add({
            targets: dmgText,
            y: enemy.y - 50,
            alpha: 0,
            duration: 600,
            onComplete: () => dmgText.destroy()
        });

        if (enemy.health <= 0) {
            this.totalKills++;

            // Blood particles
            this.bloodParticles.setPosition(enemy.x, enemy.y);
            this.bloodParticles.explode(10);

            // Blood stain
            this.bloodStains.fillStyle(COLORS.blood, 0.4);
            this.bloodStains.fillCircle(enemy.x, enemy.y, 15 + Math.random() * 10);

            // Drop
            if (Math.random() < (enemy.isBoss ? 1.0 : 0.25)) {
                const types = enemy.isBoss ? ['heart_pickup', 'heart_pickup'] : ['heart_pickup', 'coin', 'coin', 'bomb_pickup', 'key'];
                const type = types[Math.floor(Math.random() * types.length)];
                const pickup = this.add.sprite(enemy.x, enemy.y, type);
                pickup.setDepth(3);
                pickup.pickupType = type.replace('_pickup', '');
                this.pickups.add(pickup);
            }

            enemy.destroy();
        }
    }

    takeDamage(amount) {
        if (this.soulHearts > 0) {
            this.soulHearts -= amount;
            if (this.soulHearts < 0) {
                amount = -this.soulHearts;
                this.soulHearts = 0;
            } else {
                amount = 0;
            }
        }

        this.playerHealth -= amount;
        this.invulnTimer = 1.5;
        this.cameras.main.shake(100, 0.01);
        this.cameras.main.flash(100, 255, 0, 0, false, null, this);

        // Blood particles
        this.bloodParticles.setPosition(this.player.x, this.player.y);
        this.bloodParticles.explode(8);

        if (this.playerHealth <= 0) {
            this.gameState = 'gameover';
            this.showGameOver();
        }
    }

    updatePickups() {
        this.pickups.children.iterate(pickup => {
            if (!pickup || !pickup.active) return;

            // Bob animation
            pickup.y += Math.sin(this.time.now / 200) * 0.3;

            const dist = Phaser.Math.Distance.Between(pickup.x, pickup.y, this.player.x, this.player.y);
            if (dist < 30) {
                if (pickup.price) {
                    if (this.coins >= pickup.price) {
                        this.coins -= pickup.price;
                    } else {
                        return;
                    }
                }

                let collected = false;
                switch (pickup.pickupType) {
                    case 'heart':
                        if (this.playerHealth < this.maxHealth) {
                            this.playerHealth = Math.min(this.playerHealth + 2, this.maxHealth);
                            collected = true;
                        }
                        break;
                    case 'coin':
                        this.coins++;
                        collected = true;
                        break;
                    case 'bomb':
                        this.bombs++;
                        collected = true;
                        break;
                    case 'key':
                        this.keys++;
                        collected = true;
                        break;
                }
                if (collected) pickup.destroy();
            }
        });
    }

    updateItems() {
        this.items.children.iterate(item => {
            if (!item || !item.active) return;

            // Pulse
            const pulse = Math.sin(this.time.now / 200) * 0.2 + 1;
            item.setScale(pulse);

            const dist = Phaser.Math.Distance.Between(item.x, item.y, this.player.x, this.player.y);
            if (dist < 35) {
                if (item.itemData.stat === 'multishot') {
                    this.multishot = item.itemData.value;
                } else {
                    this[item.itemData.stat] = (this[item.itemData.stat] || 0) + item.itemData.value;
                }
                this.collectedItems.push(item.itemId);

                // Pickup text
                const text = this.add.text(this.player.x, this.player.y - 50, item.itemData.name + '!', {
                    fontFamily: 'monospace', fontSize: '14px', color: '#FFFF44'
                });
                text.setOrigin(0.5).setDepth(50);
                this.tweens.add({
                    targets: text,
                    y: this.player.y - 80,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => text.destroy()
                });

                item.destroy();
            }
        });
    }

    checkDoors() {
        for (let door of this.doors) {
            if (!door.open) continue;
            const dist = Phaser.Math.Distance.Between(door.x, door.y, this.player.x, this.player.y);
            if (dist < 60) {
                this.transitionRoom(door.direction);
                break;
            }
        }
    }

    transitionRoom(dir) {
        this.currentRoom.x += dir.x;
        this.currentRoom.y += dir.y;
        this.visitedRooms.add(`${this.currentRoom.x},${this.currentRoom.y}`);

        this.drawRoom();
        this.bloodStains.clear();
        this.generateRoomContent();

        if (dir.x > 0) this.player.x = this.roomOffsetX + 2 * TILE_SIZE;
        if (dir.x < 0) this.player.x = this.roomOffsetX + (ROOM_WIDTH - 2) * TILE_SIZE;
        if (dir.y > 0) this.player.y = this.roomOffsetY + 2 * TILE_SIZE;
        if (dir.y < 0) this.player.y = this.roomOffsetY + (ROOM_HEIGHT - 2) * TILE_SIZE;

        this.tears.clear(true, true);
    }

    checkRoomCleared() {
        const roomData = this.floorMap[this.currentRoom.y][this.currentRoom.x];
        if (!roomData.cleared && this.enemies.getLength() === 0) {
            roomData.cleared = true;
            this.doors.forEach(door => {
                door.open = true;
                door.sprite.setFillStyle(COLORS.floor);
            });
        }
    }

    updateHUD() {
        // Hearts
        for (let i = 0; i < this.heartSprites.length; i++) {
            const fullHearts = Math.floor(this.playerHealth / 2);
            if (i < fullHearts) {
                this.heartSprites[i].setTint(0xFFFFFF);
                this.heartSprites[i].setAlpha(1);
            } else {
                this.heartSprites[i].setTint(0x222222);
                this.heartSprites[i].setAlpha(0.5);
            }
        }

        this.coinText.setText(this.coins.toString().padStart(2, '0'));
        this.bombText.setText(this.bombs.toString().padStart(2, '0'));
        this.keyText.setText(this.keys.toString().padStart(2, '0'));
        this.floorText.setText('Basement ' + this.floorNum);

        // Update stats display
        this.statDmgText.setText(`DMG: ${this.damage.toFixed(1)}`);
        this.statSpdText.setText(`SPD: ${(this.speed / 160).toFixed(1)}`);
        this.statTearsText.setText(`TEARS: ${(1 / this.tearDelay).toFixed(1)}/s`);
        this.statRangeText.setText(`RANGE: ${(this.range / 220).toFixed(1)}`);

        // Boss health bar
        const boss = this.enemies.getChildren().find(e => e.isBoss);
        if (boss) {
            this.bossHealthBg.setVisible(true);
            this.bossHealthFill.setVisible(true);
            this.bossText.setVisible(true);
            this.bossHealthFill.setScale(boss.health / boss.maxHealth, 1);
        } else {
            this.bossHealthBg.setVisible(false);
            this.bossHealthFill.setVisible(false);
            this.bossText.setVisible(false);
        }

        // Minimap with fog of war
        this.minimap.clear();
        const mapX = 840;
        const mapY = 5;
        const cellSize = 11;

        // Helper to check if a room is adjacent to a visited room
        const isAdjacentToVisited = (rx, ry) => {
            const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            for (const [dx, dy] of dirs) {
                if (this.visitedRooms.has(`${rx + dx},${ry + dy}`)) return true;
            }
            return false;
        };

        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const room = this.floorMap[y]?.[x];
                if (!room) continue;

                const px = mapX + x * cellSize;
                const py = mapY + y * cellSize;
                const isVisited = this.visitedRooms.has(`${x},${y}`);
                const isCurrent = x === this.currentRoom.x && y === this.currentRoom.y;
                const isAdjacent = isAdjacentToVisited(x, y);

                // Fog of war: only show visited rooms and rooms adjacent to visited
                if (!isVisited && !isAdjacent) continue;

                let color = 0x333333;
                if (isCurrent) {
                    color = 0xFFFFFF;
                } else if (isVisited) {
                    switch (room.type) {
                        case 'boss': color = 0xCC4444; break;
                        case 'treasure': color = 0xCCCC44; break;
                        case 'shop': color = 0x44CC44; break;
                        default: color = 0x666666;
                    }
                } else if (isAdjacent) {
                    // Undiscovered but adjacent - show as dark silhouette
                    color = 0x333333;
                }

                this.minimap.fillStyle(color);
                this.minimap.fillRect(px, py, cellSize - 1, cellSize - 1);
            }
        }
    }

    showFloatingText(x, y, text, color, scale = 1) {
        const txt = this.add.text(x, y, text, {
            fontFamily: 'monospace',
            fontSize: `${14 * scale}px`,
            color: color
        });
        txt.setOrigin(0.5).setDepth(100);
        this.tweens.add({
            targets: txt,
            y: y - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => txt.destroy()
        });
    }

    showGameOver() {
        const bg = this.add.rectangle(480, 360, 960, 720, 0x000000, 0.85);
        bg.setDepth(199);

        const text = this.add.text(480, 280, 'YOU DIED', {
            fontFamily: 'serif', fontSize: '56px', color: '#AA2222'
        });
        text.setOrigin(0.5).setDepth(200);

        const stats = this.add.text(480, 360, 'Rooms Explored: ' + this.visitedRooms.size + '\nEnemies Killed: ' + this.totalKills, {
            fontFamily: 'monospace', fontSize: '22px', color: '#DDCCBB', align: 'center'
        });
        stats.setOrigin(0.5).setDepth(200);
    }
}

const config = {
    type: Phaser.CANVAS,
    width: 960,
    height: 720,
    backgroundColor: '#000000',
    parent: document.body,
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
window.startGame = () => game.scene.start('GameScene');
