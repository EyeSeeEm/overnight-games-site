// Tears of the Fallen - Binding of Isaac Clone
// Built with Phaser 3

const TILE_SIZE = 32;
const ROOM_WIDTH = 13;
const ROOM_HEIGHT = 7;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// ==================== BOOT SCENE ====================
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        this.createTextures();
        this.scene.start('MenuScene');
    }

    createTextures() {
        const g = this.make.graphics({ add: false });

        // Player (Isaac) - crying face
        g.clear();
        g.fillStyle(0xffcc99);
        g.fillCircle(16, 16, 14);
        g.fillStyle(0x000000);
        g.fillCircle(11, 14, 3);
        g.fillCircle(21, 14, 3);
        g.fillStyle(0x3399ff);
        g.fillRect(10, 20, 3, 6); // tears
        g.fillRect(20, 20, 3, 6);
        g.generateTexture('player', 32, 32);

        // Tear (projectile)
        g.clear();
        g.fillStyle(0x3399ff);
        g.fillCircle(6, 6, 6);
        g.generateTexture('tear', 12, 12);

        // Red Heart
        g.clear();
        g.fillStyle(0xff0000);
        g.fillCircle(6, 6, 5);
        g.fillCircle(14, 6, 5);
        g.fillTriangle(3, 8, 17, 8, 10, 18);
        g.generateTexture('heart_red', 20, 20);

        // Empty Heart
        g.clear();
        g.lineStyle(2, 0xff0000);
        g.strokeCircle(6, 6, 5);
        g.strokeCircle(14, 6, 5);
        g.strokeTriangle(3, 8, 17, 8, 10, 18);
        g.generateTexture('heart_empty', 20, 20);

        // Half Heart (left half filled, right half empty)
        g.clear();
        // Filled left side
        g.fillStyle(0xff0000);
        g.fillCircle(6, 6, 5);
        g.beginPath();
        g.moveTo(3, 8);
        g.lineTo(10, 8);
        g.lineTo(10, 18);
        g.closePath();
        g.fillPath();
        // Empty right side
        g.lineStyle(2, 0xff0000);
        g.strokeCircle(14, 6, 5);
        g.beginPath();
        g.moveTo(10, 8);
        g.lineTo(17, 8);
        g.lineTo(10, 18);
        g.closePath();
        g.strokePath();
        g.generateTexture('heart_half', 20, 20);

        // Soul Heart
        g.clear();
        g.fillStyle(0x3366ff);
        g.fillCircle(6, 6, 5);
        g.fillCircle(14, 6, 5);
        g.fillTriangle(3, 8, 17, 8, 10, 18);
        g.generateTexture('heart_soul', 20, 20);

        // Floor tile
        g.clear();
        g.fillStyle(0x4a3830);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, 0x3a2820);
        g.strokeRect(0, 0, 32, 32);
        g.generateTexture('floor', 32, 32);

        // Wall tile
        g.clear();
        g.fillStyle(0x666666);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x555555);
        g.fillRect(4, 4, 24, 24);
        g.generateTexture('wall', 32, 32);

        // Door (open)
        g.clear();
        g.fillStyle(0x4a3830);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x222222);
        g.fillRect(8, 0, 16, 32);
        g.generateTexture('door_open', 32, 32);

        // Door (closed)
        g.clear();
        g.fillStyle(0x888888);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x666666);
        g.fillRect(4, 4, 24, 24);
        g.lineStyle(2, 0x444444);
        g.lineBetween(16, 8, 16, 24);
        g.generateTexture('door_closed', 32, 32);

        // Rock
        g.clear();
        g.fillStyle(0x888888);
        g.fillRoundedRect(4, 8, 24, 20, 4);
        g.fillStyle(0x666666);
        g.fillRoundedRect(8, 12, 16, 12, 2);
        g.generateTexture('rock', 32, 32);

        // Poop
        g.clear();
        g.fillStyle(0x8b4513);
        g.fillCircle(16, 20, 10);
        g.fillCircle(12, 14, 6);
        g.fillCircle(20, 14, 6);
        g.fillCircle(16, 10, 4);
        g.generateTexture('poop', 32, 32);

        // Fly enemy
        g.clear();
        g.fillStyle(0x222222);
        g.fillCircle(12, 12, 8);
        g.fillStyle(0xaaaaaa);
        g.fillEllipse(4, 8, 6, 4);
        g.fillEllipse(20, 8, 6, 4);
        g.generateTexture('fly', 24, 24);

        // Gaper enemy
        g.clear();
        g.fillStyle(0xcc9999);
        g.fillCircle(16, 18, 14);
        g.fillStyle(0xff0000);
        g.fillCircle(10, 16, 4);
        g.fillCircle(22, 16, 4);
        g.fillStyle(0x000000);
        g.fillRect(10, 24, 12, 4);
        g.generateTexture('gaper', 32, 32);

        // Pooter enemy
        g.clear();
        g.fillStyle(0x8866aa);
        g.fillCircle(14, 14, 12);
        g.fillStyle(0xff4444);
        g.fillCircle(9, 12, 4);
        g.fillCircle(19, 12, 4);
        g.fillStyle(0xaaaaaa);
        g.fillEllipse(4, 14, 6, 3);
        g.fillEllipse(24, 14, 6, 3);
        g.generateTexture('pooter', 28, 28);

        // Clotty enemy
        g.clear();
        g.fillStyle(0xaa0000);
        g.fillCircle(16, 16, 14);
        g.fillStyle(0xffffff);
        g.fillCircle(10, 14, 4);
        g.fillCircle(22, 14, 4);
        g.fillStyle(0x000000);
        g.fillCircle(10, 14, 2);
        g.fillCircle(22, 14, 2);
        g.generateTexture('clotty', 32, 32);

        // Boss - Monstro
        g.clear();
        g.fillStyle(0xcc9988);
        g.fillCircle(32, 36, 30);
        g.fillStyle(0xaa0000);
        g.fillRect(14, 40, 36, 8);
        g.fillStyle(0xffffff);
        g.fillCircle(20, 28, 6);
        g.fillCircle(44, 28, 6);
        g.fillStyle(0x000000);
        g.fillCircle(22, 28, 3);
        g.fillCircle(46, 28, 3);
        g.generateTexture('monstro', 64, 64);

        // Item pedestal
        g.clear();
        g.fillStyle(0xccaa88);
        g.fillRect(8, 20, 16, 12);
        g.fillRect(4, 18, 24, 4);
        g.generateTexture('pedestal', 32, 32);

        // Generic item
        g.clear();
        g.fillStyle(0xffff00);
        g.fillCircle(12, 12, 10);
        g.fillStyle(0xffaa00);
        g.fillCircle(12, 12, 6);
        g.generateTexture('item', 24, 24);

        // Coin
        g.clear();
        g.fillStyle(0xffdd00);
        g.fillCircle(8, 8, 7);
        g.fillStyle(0xccaa00);
        g.fillCircle(8, 8, 4);
        g.generateTexture('coin', 16, 16);

        // Bomb
        g.clear();
        g.fillStyle(0x333333);
        g.fillCircle(10, 14, 8);
        g.fillStyle(0xff8800);
        g.fillRect(8, 2, 4, 8);
        g.generateTexture('bomb', 20, 20);

        // Key
        g.clear();
        g.fillStyle(0xffcc00);
        g.fillCircle(8, 6, 5);
        g.fillRect(6, 10, 4, 10);
        g.fillRect(6, 16, 8, 3);
        g.generateTexture('key', 16, 22);

        // Trapdoor
        g.clear();
        g.fillStyle(0x222222);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x111111);
        g.fillRect(8, 8, 16, 16);
        g.generateTexture('trapdoor', 32, 32);

        // Enemy bullet
        g.clear();
        g.fillStyle(0xff4444);
        g.fillCircle(5, 5, 5);
        g.generateTexture('enemy_bullet', 10, 10);

        g.destroy();
    }
}

// ==================== MENU SCENE ====================
class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        this.add.text(cx, cy - 140, 'TEARS OF THE FALLEN', {
            fontSize: '42px',
            fill: '#ff4444',
            fontFamily: 'Arial Black'
        }).setOrigin(0.5);

        this.add.text(cx, cy - 70, 'A Binding of Isaac Clone', {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5);

        this.add.text(cx, cy, 'WASD - Move', { fontSize: '16px', fill: '#cccccc' }).setOrigin(0.5);
        this.add.text(cx, cy + 25, 'Arrow Keys - Shoot', { fontSize: '16px', fill: '#cccccc' }).setOrigin(0.5);
        this.add.text(cx, cy + 50, 'E - Use Bomb    |    SPACE - Use Item', { fontSize: '16px', fill: '#cccccc' }).setOrigin(0.5);

        const startBtn = this.add.text(cx, cy + 120, '[ CLICK TO START ]', {
            fontSize: '24px',
            fill: '#00ff00'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#88ff88'));
        startBtn.on('pointerout', () => startBtn.setFill('#00ff00'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));
    }
}

// ==================== GAME SCENE ====================
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Floor data
        this.currentFloor = 1; // 1=Basement, 2=Caves, 3=Depths
        this.floorNames = ['', 'Basement', 'Caves', 'Depths'];

        // Room offset for rendering
        this.roomOffsetX = (GAME_WIDTH - ROOM_WIDTH * TILE_SIZE) / 2;
        this.roomOffsetY = 60;

        // Player stats
        this.playerStats = {
            maxHealth: 6, // 3 full hearts
            health: 6,
            soulHearts: 0,
            damage: 3.5,
            tearRate: 400, // ms between shots
            tearRange: 300,
            tearSpeed: 400,
            moveSpeed: 160,
            coins: 0,
            bombs: 3,
            keys: 1
        };

        // Generate floor
        this.generateFloor();

        // Groups
        this.tears = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.pickups = this.physics.add.group();
        this.obstacles = this.physics.add.staticGroup();

        // Create player
        this.createPlayer();

        // Render current room
        this.renderRoom();

        // Controls
        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            UP: Phaser.Input.Keyboard.KeyCodes.UP,
            DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
            LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
            RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            E: Phaser.Input.Keyboard.KeyCodes.E,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.lastShot = 0;
        this.roomCleared = false;
        this.invincible = false;

        // Collisions
        this.physics.add.collider(this.player, this.obstacles);
        this.physics.add.overlap(this.tears, this.enemies, this.tearHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHitBullet, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.pickups, this.collectPickup, null, this);

        // Create HUD
        this.createHUD();

        // Room transition state
        this.transitioning = false;
    }

    generateFloor() {
        // Simple floor generation: 5x5 grid of rooms
        this.floorMap = [];
        this.roomStates = {}; // Track cleared rooms, collected items
        const gridSize = 5;
        const center = Math.floor(gridSize / 2);

        // Initialize grid
        for (let y = 0; y < gridSize; y++) {
            this.floorMap[y] = [];
            for (let x = 0; x < gridSize; x++) {
                this.floorMap[y][x] = null;
            }
        }

        // Generate rooms using simple algorithm
        const roomCount = 6 + this.currentFloor * 2;
        const rooms = [{ x: center, y: center, type: 'start' }];
        this.floorMap[center][center] = { type: 'start', visited: true };

        const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];

        while (rooms.length < roomCount) {
            const base = rooms[Math.floor(Math.random() * rooms.length)];
            const dir = directions[Math.floor(Math.random() * 4)];
            const nx = base.x + dir[0];
            const ny = base.y + dir[1];

            if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && !this.floorMap[ny][nx]) {
                const roomType = this.getRandomRoomType(rooms.length);
                this.floorMap[ny][nx] = { type: roomType, visited: false };
                rooms.push({ x: nx, y: ny, type: roomType });
            }
        }

        // Ensure special rooms exist
        let hasTreasure = false, hasShop = false, hasBoss = false;
        rooms.forEach(r => {
            if (r.type === 'treasure') hasTreasure = true;
            if (r.type === 'shop') hasShop = true;
            if (r.type === 'boss') hasBoss = true;
        });

        // Add missing special rooms at edges
        const addSpecialRoom = (type) => {
            for (const room of rooms) {
                for (const dir of directions) {
                    const nx = room.x + dir[0];
                    const ny = room.y + dir[1];
                    if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize && !this.floorMap[ny][nx]) {
                        this.floorMap[ny][nx] = { type: type, visited: false };
                        rooms.push({ x: nx, y: ny, type: type });
                        return;
                    }
                }
            }
        };

        if (!hasTreasure) addSpecialRoom('treasure');
        if (!hasShop) addSpecialRoom('shop');
        if (!hasBoss) addSpecialRoom('boss');

        // Current position
        this.currentRoomX = center;
        this.currentRoomY = center;

        // Generate room contents
        this.roomContents = {};
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (this.floorMap[y][x]) {
                    const key = `${x},${y}`;
                    this.roomContents[key] = this.generateRoomContent(this.floorMap[y][x].type, x, y);
                }
            }
        }
    }

    getRandomRoomType(roomIndex) {
        if (roomIndex === 1) return 'treasure';
        if (roomIndex === 2) return 'shop';
        if (roomIndex === 3) return 'boss';
        return Math.random() < 0.8 ? 'normal' : 'empty';
    }

    generateRoomContent(type, x, y) {
        const content = {
            type: type,
            enemies: [],
            obstacles: [],
            pickups: [],
            item: null,
            cleared: type === 'start' || type === 'empty' || type === 'treasure' || type === 'shop'
        };

        // Add obstacles
        if (type !== 'boss' && type !== 'treasure' && type !== 'shop') {
            const obstacleCount = Math.floor(Math.random() * 5) + 2;
            for (let i = 0; i < obstacleCount; i++) {
                const ox = 2 + Math.floor(Math.random() * (ROOM_WIDTH - 4));
                const oy = 1 + Math.floor(Math.random() * (ROOM_HEIGHT - 2));
                // Avoid center spawn area
                if (Math.abs(ox - 6) > 1 || Math.abs(oy - 3) > 1) {
                    content.obstacles.push({
                        x: ox,
                        y: oy,
                        type: Math.random() < 0.7 ? 'rock' : 'poop',
                        health: 20
                    });
                }
            }
        }

        // Add enemies based on room type
        if (type === 'normal') {
            const enemyCount = 2 + Math.floor(Math.random() * 3) + this.currentFloor;
            for (let i = 0; i < enemyCount; i++) {
                const ex = 2 + Math.floor(Math.random() * (ROOM_WIDTH - 4));
                const ey = 1 + Math.floor(Math.random() * (ROOM_HEIGHT - 2));
                content.enemies.push({
                    x: ex,
                    y: ey,
                    type: this.getRandomEnemyType()
                });
            }
        } else if (type === 'boss') {
            content.enemies.push({
                x: 6,
                y: 2,
                type: 'monstro',
                isBoss: true
            });
        }

        // Add item for treasure/shop
        if (type === 'treasure') {
            content.item = {
                name: this.getRandomItem(),
                x: 6,
                y: 3
            };
        } else if (type === 'shop') {
            content.shopItems = [
                { name: 'heart', price: 3, x: 4, y: 3 },
                { name: 'bomb', price: 5, x: 6, y: 3 },
                { name: 'key', price: 5, x: 8, y: 3 }
            ];
        }

        return content;
    }

    getRandomEnemyType() {
        const enemies = this.currentFloor === 1 ? ['fly', 'gaper'] :
                       this.currentFloor === 2 ? ['fly', 'gaper', 'pooter'] :
                       ['fly', 'gaper', 'pooter', 'clotty'];
        return enemies[Math.floor(Math.random() * enemies.length)];
    }

    getRandomItem() {
        const items = ['damage_up', 'speed_up', 'health_up', 'tears_up', 'range_up'];
        return items[Math.floor(Math.random() * items.length)];
    }

    createPlayer() {
        const cx = this.roomOffsetX + ROOM_WIDTH * TILE_SIZE / 2;
        const cy = this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE / 2;
        this.player = this.physics.add.sprite(cx, cy, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.player.body.setSize(20, 20);
    }

    renderRoom() {
        // Clear previous room
        this.obstacles.clear(true, true);
        this.enemies.clear(true, true);
        this.pickups.clear(true, true);
        this.enemyBullets.clear(true, true);

        // Clear existing tiles
        if (this.floorTiles) {
            this.floorTiles.forEach(t => t.destroy());
        }
        this.floorTiles = [];

        // Get room content
        const roomKey = `${this.currentRoomX},${this.currentRoomY}`;
        const content = this.roomContents[roomKey];
        const roomData = this.floorMap[this.currentRoomY][this.currentRoomX];

        if (roomData) roomData.visited = true;

        // Draw floor and walls
        for (let y = -1; y <= ROOM_HEIGHT; y++) {
            for (let x = -1; x <= ROOM_WIDTH; x++) {
                const px = this.roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2;
                const py = this.roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2;

                if (y === -1 || y === ROOM_HEIGHT || x === -1 || x === ROOM_WIDTH) {
                    // Check for doors
                    const isDoor = this.isDoorPosition(x, y);
                    if (isDoor) {
                        const tile = this.add.image(px, py, content.cleared ? 'door_open' : 'door_closed');
                        this.floorTiles.push(tile);
                        if (!content.cleared) {
                            const wall = this.obstacles.create(px, py, 'door_closed');
                            wall.setVisible(false);
                        }
                    } else {
                        const wall = this.obstacles.create(px, py, 'wall');
                        this.floorTiles.push(wall);
                    }
                } else {
                    const tile = this.add.image(px, py, 'floor');
                    this.floorTiles.push(tile);
                }
            }
        }

        // Spawn obstacles
        if (content) {
            content.obstacles.forEach((obs, idx) => {
                if (!this.roomStates[roomKey]?.destroyedObstacles?.includes(idx)) {
                    const px = this.roomOffsetX + obs.x * TILE_SIZE + TILE_SIZE / 2;
                    const py = this.roomOffsetY + obs.y * TILE_SIZE + TILE_SIZE / 2;
                    const obstacle = this.obstacles.create(px, py, obs.type);
                    obstacle.obstacleIndex = idx;
                    obstacle.health = obs.health;
                    obstacle.obstacleType = obs.type;
                }
            });

            // Spawn enemies (only if not cleared)
            if (!content.cleared) {
                content.enemies.forEach(e => {
                    const px = this.roomOffsetX + e.x * TILE_SIZE + TILE_SIZE / 2;
                    const py = this.roomOffsetY + e.y * TILE_SIZE + TILE_SIZE / 2;
                    this.spawnEnemy(e.type, px, py, e.isBoss);
                });
            }

            // Spawn item pedestal
            if (content.item && !this.roomStates[roomKey]?.itemTaken) {
                const px = this.roomOffsetX + content.item.x * TILE_SIZE + TILE_SIZE / 2;
                const py = this.roomOffsetY + content.item.y * TILE_SIZE + TILE_SIZE / 2;
                const pedestal = this.add.image(px, py + 8, 'pedestal');
                this.floorTiles.push(pedestal);
                const item = this.pickups.create(px, py - 8, 'item');
                item.pickupType = 'item';
                item.itemName = content.item.name;
            }

            // Spawn shop items
            if (content.shopItems) {
                content.shopItems.forEach((si, idx) => {
                    if (!this.roomStates[roomKey]?.boughtItems?.includes(idx)) {
                        const px = this.roomOffsetX + si.x * TILE_SIZE + TILE_SIZE / 2;
                        const py = this.roomOffsetY + si.y * TILE_SIZE + TILE_SIZE / 2;
                        let texture = si.name === 'heart' ? 'heart_red' : si.name;
                        const item = this.pickups.create(px, py, texture);
                        item.pickupType = 'shop';
                        item.shopItem = si.name;
                        item.price = si.price;
                        item.shopIndex = idx;
                        const priceText = this.add.text(px, py + 20, `$${si.price}`, {
                            fontSize: '12px',
                            fill: '#ffff00'
                        }).setOrigin(0.5);
                        this.floorTiles.push(priceText);
                    }
                });
            }

            // Spawn trapdoor if boss room is cleared
            if (content.type === 'boss' && content.cleared) {
                const px = this.roomOffsetX + 6 * TILE_SIZE + TILE_SIZE / 2;
                const py = this.roomOffsetY + 3 * TILE_SIZE + TILE_SIZE / 2;
                const trap = this.pickups.create(px, py, 'trapdoor');
                trap.pickupType = 'trapdoor';
            }

            // Restore saved pickups (coins, hearts dropped by enemies)
            if (content.pickups && content.pickups.length > 0) {
                content.pickups.forEach(p => {
                    const pickup = this.pickups.create(p.x, p.y, p.texture);
                    pickup.pickupType = p.type;
                });
            }
        }

        this.roomCleared = content?.cleared || false;
    }

    isDoorPosition(x, y) {
        const midX = Math.floor(ROOM_WIDTH / 2);
        const midY = Math.floor(ROOM_HEIGHT / 2);

        // Check adjacent rooms
        if (y === -1 && x === midX) {
            return this.floorMap[this.currentRoomY - 1]?.[this.currentRoomX];
        }
        if (y === ROOM_HEIGHT && x === midX) {
            return this.floorMap[this.currentRoomY + 1]?.[this.currentRoomX];
        }
        if (x === -1 && y === midY) {
            return this.floorMap[this.currentRoomY]?.[this.currentRoomX - 1];
        }
        if (x === ROOM_WIDTH && y === midY) {
            return this.floorMap[this.currentRoomY]?.[this.currentRoomX + 1];
        }
        return false;
    }

    spawnEnemy(type, x, y, isBoss = false) {
        const enemy = this.enemies.create(x, y, type);
        enemy.enemyType = type;
        enemy.isBoss = isBoss;

        const stats = {
            fly: { hp: 5, speed: 80, damage: 0.5 },
            gaper: { hp: 12, speed: 50, damage: 1 },
            pooter: { hp: 8, speed: 30, damage: 0.5, shoots: true },
            clotty: { hp: 25, speed: 40, damage: 0.5, shoots: true },
            monstro: { hp: 200, speed: 0, damage: 1, isBoss: true }
        };

        const s = stats[type] || stats.fly;
        enemy.hp = isBoss ? 200 : s.hp;
        enemy.maxHp = enemy.hp;
        enemy.speed = s.speed;
        enemy.contactDamage = s.damage;
        enemy.canShoot = s.shoots;
        enemy.lastShot = 0;
        enemy.setDepth(5);

        // Spawn animation
        enemy.setAlpha(0);
        enemy.spawning = true;
        this.tweens.add({
            targets: enemy,
            alpha: 1,
            y: y,
            duration: 500,
            onComplete: () => { enemy.spawning = false; }
        });

        if (isBoss) {
            enemy.setScale(1.5);
            enemy.phase = 1;
            enemy.lastJump = 0;
        }
    }

    createHUD() {
        // Hearts
        this.heartIcons = [];
        this.updateHearts();

        // Stats display
        this.statsText = this.add.text(10, 10, '', {
            fontSize: '14px',
            fill: '#ffffff'
        });

        // Resources
        this.resourceText = this.add.text(GAME_WIDTH - 10, 10, '', {
            fontSize: '14px',
            fill: '#ffffff'
        }).setOrigin(1, 0);

        // Floor name
        this.floorText = this.add.text(GAME_WIDTH / 2, 10, this.floorNames[this.currentFloor], {
            fontSize: '16px',
            fill: '#aaaaaa'
        }).setOrigin(0.5, 0);

        // Minimap
        this.createMinimap();

        // Boss health bar (hidden by default)
        this.bossHealthBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 30, 300, 20, 0x333333).setVisible(false);
        this.bossHealthBar = this.add.rectangle(GAME_WIDTH / 2 - 145, GAME_HEIGHT - 30, 290, 16, 0xff0000).setOrigin(0, 0.5).setVisible(false);
    }

    createMinimap() {
        const mapX = GAME_WIDTH - 80;
        const mapY = 50;
        const cellSize = 12;

        this.minimapContainer = this.add.container(mapX, mapY);

        // Draw rooms
        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                if (this.floorMap[y]?.[x]) {
                    const room = this.floorMap[y][x];
                    let color = 0x888888;
                    if (room.type === 'treasure') color = 0xffff00;
                    else if (room.type === 'boss') color = 0xff0000;
                    else if (room.type === 'shop') color = 0x00ffff;
                    else if (room.type === 'start') color = 0x00ff00;

                    const alpha = room.visited ? 1 : 0.3;
                    const rect = this.add.rectangle(x * cellSize, y * cellSize, cellSize - 2, cellSize - 2, color, alpha);
                    this.minimapContainer.add(rect);
                }
            }
        }

        // Current room indicator
        this.minimapMarker = this.add.rectangle(
            this.currentRoomX * cellSize,
            this.currentRoomY * cellSize,
            cellSize - 2, cellSize - 2, 0xffffff
        );
        this.minimapContainer.add(this.minimapMarker);
    }

    updateMinimap() {
        this.minimapMarker.x = this.currentRoomX * 12;
        this.minimapMarker.y = this.currentRoomY * 12;

        // Update visited rooms
        this.minimapContainer.list.forEach(child => {
            if (child !== this.minimapMarker && child.type === 'Rectangle') {
                // Update alpha based on visited
            }
        });
    }

    updateHearts() {
        // Clear existing
        this.heartIcons.forEach(h => h.destroy());
        this.heartIcons = [];

        const maxHearts = Math.ceil(this.playerStats.maxHealth / 2);
        const fullHearts = Math.floor(this.playerStats.health / 2);
        const halfHeart = this.playerStats.health % 2 === 1;

        for (let i = 0; i < maxHearts; i++) {
            const x = 10 + i * 22;
            const y = 40;
            let texture = 'heart_empty';
            if (i < fullHearts) texture = 'heart_red';
            else if (i === fullHearts && halfHeart) texture = 'heart_half'; // Use half-heart texture

            const heart = this.add.image(x + 10, y, texture).setScale(0.8);
            this.heartIcons.push(heart);
        }

        // Soul hearts
        for (let i = 0; i < Math.ceil(this.playerStats.soulHearts / 2); i++) {
            const x = 10 + (maxHearts + i) * 22;
            const heart = this.add.image(x + 10, 40, 'heart_soul').setScale(0.8);
            this.heartIcons.push(heart);
        }
    }

    update(time, delta) {
        if (this.transitioning) return;

        // Player movement
        let vx = 0, vy = 0;
        if (this.keys.W.isDown) vy = -1;
        if (this.keys.S.isDown) vy = 1;
        if (this.keys.A.isDown) vx = -1;
        if (this.keys.D.isDown) vx = 1;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.player.setVelocity(vx * this.playerStats.moveSpeed, vy * this.playerStats.moveSpeed);

        // Shooting (arrow keys)
        if (time > this.lastShot + this.playerStats.tearRate) {
            let shootDir = null;
            if (this.keys.UP.isDown) shootDir = { x: 0, y: -1 };
            else if (this.keys.DOWN.isDown) shootDir = { x: 0, y: 1 };
            else if (this.keys.LEFT.isDown) shootDir = { x: -1, y: 0 };
            else if (this.keys.RIGHT.isDown) shootDir = { x: 1, y: 0 };

            if (shootDir) {
                this.shootTear(shootDir.x, shootDir.y);
                this.lastShot = time;
            }
        }

        // Update tears
        this.tears.getChildren().forEach(tear => {
            tear.life -= delta;
            if (tear.life <= 0) tear.destroy();
        });

        // Update enemies
        this.enemies.getChildren().forEach(enemy => {
            this.updateEnemy(enemy, time);
        });

        // Check room cleared
        if (!this.roomCleared && this.enemies.countActive() === 0) {
            this.clearRoom();
        }

        // Check door transitions
        this.checkDoorTransition();

        // Use bomb
        if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
            this.useBomb();
        }

        // Update HUD
        this.updateHUD();
    }

    shootTear(dx, dy) {
        const tear = this.tears.create(this.player.x, this.player.y, 'tear');
        tear.setVelocity(dx * this.playerStats.tearSpeed, dy * this.playerStats.tearSpeed);
        tear.damage = this.playerStats.damage;
        tear.life = (this.playerStats.tearRange / this.playerStats.tearSpeed) * 1000;
        tear.setDepth(8);

        // Slight arc (gravity effect)
        if (dy <= 0) {
            tear.setGravityY(50);
        }
    }

    updateEnemy(enemy, time) {
        if (enemy.spawning) return;

        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (enemy.isBoss) {
            this.updateBoss(enemy, time, dx, dy, dist);
            return;
        }

        // Basic chase AI
        if (enemy.speed > 0 && dist > 10) {
            const nx = dx / dist;
            const ny = dy / dist;
            enemy.setVelocity(nx * enemy.speed, ny * enemy.speed);
        }

        // Shooting enemies
        if (enemy.canShoot && time > enemy.lastShot + 2000 && dist < 200) {
            enemy.lastShot = time;
            const bullet = this.enemyBullets.create(enemy.x, enemy.y, 'enemy_bullet');
            const angle = Math.atan2(dy, dx);
            bullet.setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150);
            bullet.damage = enemy.contactDamage;
            this.time.delayedCall(3000, () => { if (bullet.active) bullet.destroy(); });
        }
    }

    updateBoss(boss, time, dx, dy, dist) {
        // Monstro AI
        if (time > boss.lastJump + 3000) {
            boss.lastJump = time;

            // Jump toward player
            const jumpX = this.player.x;
            const jumpY = this.player.y;

            this.tweens.add({
                targets: boss,
                x: jumpX,
                y: jumpY - 50,
                duration: 500,
                yoyo: true,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    // Land and spawn projectiles
                    for (let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2;
                        const bullet = this.enemyBullets.create(boss.x, boss.y, 'enemy_bullet');
                        bullet.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
                        bullet.damage = 0.5;
                        this.time.delayedCall(2000, () => { if (bullet.active) bullet.destroy(); });
                    }
                }
            });
        }

        // Update boss health bar
        this.bossHealthBg.setVisible(true);
        this.bossHealthBar.setVisible(true);
        this.bossHealthBar.width = 290 * (boss.hp / boss.maxHp);
    }

    tearHitEnemy(tear, enemy) {
        if (enemy.spawning) return;

        enemy.hp -= tear.damage;
        tear.destroy();

        enemy.setTint(0xffffff);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });

        if (enemy.hp <= 0) {
            this.enemyDeath(enemy);
        }
    }

    enemyDeath(enemy) {
        // Drop pickup
        if (Math.random() < 0.3) {
            const types = ['coin', 'heart_red', 'bomb', 'key'];
            const weights = [0.5, 0.25, 0.15, 0.1];
            let rand = Math.random();
            let type = 'coin';
            let cumulative = 0;
            for (let i = 0; i < types.length; i++) {
                cumulative += weights[i];
                if (rand < cumulative) {
                    type = types[i];
                    break;
                }
            }
            const pickup = this.pickups.create(enemy.x, enemy.y, type);
            pickup.pickupType = type === 'heart_red' ? 'heart' : type;
        }

        if (enemy.isBoss) {
            this.bossHealthBg.setVisible(false);
            this.bossHealthBar.setVisible(false);
        }

        enemy.destroy();
    }

    playerHitBullet(player, bullet) {
        if (this.invincible) return;
        this.damagePlayer(bullet.damage);
        bullet.destroy();
    }

    playerHitEnemy(player, enemy) {
        if (this.invincible || enemy.spawning) return;
        this.damagePlayer(enemy.contactDamage);
    }

    damagePlayer(amount) {
        const damage = Math.ceil(amount * 2); // Convert to half-hearts

        // Remove soul hearts first
        if (this.playerStats.soulHearts > 0) {
            this.playerStats.soulHearts = Math.max(0, this.playerStats.soulHearts - damage);
        } else {
            this.playerStats.health = Math.max(0, this.playerStats.health - damage);
        }

        this.updateHearts();

        // Invincibility frames
        this.invincible = true;
        this.player.setAlpha(0.5);

        this.time.delayedCall(1000, () => {
            this.invincible = false;
            if (this.player.active) this.player.setAlpha(1);
        });

        // Flash
        this.cameras.main.shake(100, 0.01);

        if (this.playerStats.health <= 0) {
            this.playerDeath();
        }
    }

    playerDeath() {
        this.player.setActive(false);
        this.player.setVisible(false);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'YOU DIED', {
            fontSize: '48px',
            fill: '#ff0000'
        }).setOrigin(0.5);

        this.time.delayedCall(2000, () => {
            this.scene.start('MenuScene');
        });
    }

    collectPickup(player, pickup) {
        const type = pickup.pickupType;

        if (type === 'coin') {
            this.playerStats.coins++;
            pickup.destroy();
        } else if (type === 'heart') {
            if (this.playerStats.health < this.playerStats.maxHealth) {
                this.playerStats.health = Math.min(this.playerStats.maxHealth, this.playerStats.health + 2);
                this.updateHearts();
                pickup.destroy();
            }
        } else if (type === 'bomb') {
            this.playerStats.bombs++;
            pickup.destroy();
        } else if (type === 'key') {
            this.playerStats.keys++;
            pickup.destroy();
        } else if (type === 'item') {
            this.applyItem(pickup.itemName);
            const roomKey = `${this.currentRoomX},${this.currentRoomY}`;
            if (!this.roomStates[roomKey]) this.roomStates[roomKey] = {};
            this.roomStates[roomKey].itemTaken = true;
            pickup.destroy();
        } else if (type === 'shop') {
            if (this.playerStats.coins >= pickup.price) {
                this.playerStats.coins -= pickup.price;
                if (pickup.shopItem === 'heart') {
                    this.playerStats.health = Math.min(this.playerStats.maxHealth, this.playerStats.health + 2);
                    this.updateHearts();
                } else if (pickup.shopItem === 'bomb') {
                    this.playerStats.bombs++;
                } else if (pickup.shopItem === 'key') {
                    this.playerStats.keys++;
                }
                const roomKey = `${this.currentRoomX},${this.currentRoomY}`;
                if (!this.roomStates[roomKey]) this.roomStates[roomKey] = {};
                if (!this.roomStates[roomKey].boughtItems) this.roomStates[roomKey].boughtItems = [];
                this.roomStates[roomKey].boughtItems.push(pickup.shopIndex);
                pickup.destroy();
            }
        } else if (type === 'trapdoor') {
            this.nextFloor();
        }
    }

    applyItem(itemName) {
        const effects = {
            damage_up: () => { this.playerStats.damage += 1; },
            speed_up: () => { this.playerStats.moveSpeed += 20; },
            health_up: () => {
                this.playerStats.maxHealth += 2;
                this.playerStats.health += 2;
                this.updateHearts();
            },
            tears_up: () => { this.playerStats.tearRate = Math.max(100, this.playerStats.tearRate - 50); },
            range_up: () => { this.playerStats.tearRange += 50; }
        };

        if (effects[itemName]) effects[itemName]();
        this.showMessage(`Got ${itemName.replace('_', ' ')}!`);
    }

    showMessage(text) {
        const msg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, text, {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: msg,
            y: GAME_HEIGHT / 2 - 50,
            alpha: 0,
            duration: 1500,
            onComplete: () => msg.destroy()
        });
    }

    clearRoom() {
        this.roomCleared = true;
        const roomKey = `${this.currentRoomX},${this.currentRoomY}`;
        this.roomContents[roomKey].cleared = true;
        // Doors will update on next render naturally
    }

    checkDoorTransition() {
        if (this.transitioning || !this.roomCleared) return;

        const px = this.player.x;
        const py = this.player.y;
        const roomLeft = this.roomOffsetX;
        const roomRight = this.roomOffsetX + ROOM_WIDTH * TILE_SIZE;
        const roomTop = this.roomOffsetY;
        const roomBottom = this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE;

        let newRoomX = this.currentRoomX;
        let newRoomY = this.currentRoomY;
        let entryDir = null;

        if (px < roomLeft) {
            newRoomX--;
            entryDir = 'left';
        } else if (px > roomRight) {
            newRoomX++;
            entryDir = 'right';
        } else if (py < roomTop) {
            newRoomY--;
            entryDir = 'up';
        } else if (py > roomBottom) {
            newRoomY++;
            entryDir = 'down';
        }

        if (entryDir && this.floorMap[newRoomY]?.[newRoomX]) {
            this.transitionToRoom(newRoomX, newRoomY, entryDir);
        }
    }

    transitionToRoom(newX, newY, entryDir) {
        this.transitioning = true;
        this.player.setVelocity(0, 0);

        // Save current room's pickups before leaving
        const currentRoomKey = `${this.currentRoomX},${this.currentRoomY}`;
        if (this.roomContents[currentRoomKey]) {
            this.roomContents[currentRoomKey].pickups = [];
            this.pickups.getChildren().forEach(pickup => {
                this.roomContents[currentRoomKey].pickups.push({
                    x: pickup.x,
                    y: pickup.y,
                    type: pickup.pickupType,
                    texture: pickup.texture.key
                });
            });
        }

        // Fade out
        this.cameras.main.fadeOut(200, 0, 0, 0);

        this.time.delayedCall(200, () => {
            this.currentRoomX = newX;
            this.currentRoomY = newY;

            // Position player at entry door
            let px, py;
            const midX = this.roomOffsetX + ROOM_WIDTH * TILE_SIZE / 2;
            const midY = this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE / 2;

            if (entryDir === 'left') {
                px = this.roomOffsetX + TILE_SIZE * 1.5;
                py = midY;
            } else if (entryDir === 'right') {
                px = this.roomOffsetX + ROOM_WIDTH * TILE_SIZE - TILE_SIZE * 1.5;
                py = midY;
            } else if (entryDir === 'up') {
                px = midX;
                py = this.roomOffsetY + TILE_SIZE * 1.5;
            } else {
                px = midX;
                py = this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE - TILE_SIZE * 1.5;
            }

            this.player.setPosition(px, py);
            this.renderRoom();
            this.updateMinimap();

            this.cameras.main.fadeIn(200, 0, 0, 0);

            this.time.delayedCall(300, () => {
                this.transitioning = false;
            });
        });
    }

    nextFloor() {
        if (this.currentFloor >= 3) {
            // Victory!
            this.scene.start('VictoryScene');
            return;
        }

        this.currentFloor++;
        this.cameras.main.fadeOut(500, 0, 0, 0);

        this.time.delayedCall(500, () => {
            this.generateFloor();
            const cx = this.roomOffsetX + ROOM_WIDTH * TILE_SIZE / 2;
            const cy = this.roomOffsetY + ROOM_HEIGHT * TILE_SIZE / 2;
            this.player.setPosition(cx, cy);
            this.renderRoom();
            this.createMinimap();
            this.floorText.setText(this.floorNames[this.currentFloor]);
            this.cameras.main.fadeIn(500, 0, 0, 0);
        });
    }

    useBomb() {
        if (this.playerStats.bombs <= 0) return;
        this.playerStats.bombs--;

        const bomb = this.add.image(this.player.x, this.player.y, 'bomb').setDepth(6);

        this.time.delayedCall(1500, () => {
            // Explosion
            const explosion = this.add.circle(bomb.x, bomb.y, 60, 0xff8800, 0.5);
            this.cameras.main.shake(200, 0.02);

            // Damage enemies
            this.enemies.getChildren().forEach(enemy => {
                const dist = Phaser.Math.Distance.Between(bomb.x, bomb.y, enemy.x, enemy.y);
                if (dist < 60) {
                    enemy.hp -= 60;
                    if (enemy.hp <= 0) this.enemyDeath(enemy);
                }
            });

            // Destroy obstacles
            this.obstacles.getChildren().forEach(obs => {
                if (obs.obstacleType) {
                    const dist = Phaser.Math.Distance.Between(bomb.x, bomb.y, obs.x, obs.y);
                    if (dist < 60) {
                        const roomKey = `${this.currentRoomX},${this.currentRoomY}`;
                        if (!this.roomStates[roomKey]) this.roomStates[roomKey] = {};
                        if (!this.roomStates[roomKey].destroyedObstacles) this.roomStates[roomKey].destroyedObstacles = [];
                        this.roomStates[roomKey].destroyedObstacles.push(obs.obstacleIndex);
                        obs.destroy();
                    }
                }
            });

            this.time.delayedCall(200, () => explosion.destroy());
            bomb.destroy();
        });
    }

    updateHUD() {
        this.statsText.setText(`DMG: ${this.playerStats.damage.toFixed(1)}\nSPD: ${(this.playerStats.moveSpeed / 160).toFixed(1)}`);
        this.resourceText.setText(`🔑 ${this.playerStats.keys}  💣 ${this.playerStats.bombs}  💰 ${this.playerStats.coins}`);
    }
}

// ==================== VICTORY SCENE ====================
class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    create() {
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'VICTORY!', {
            fontSize: '48px',
            fill: '#00ff00'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'You defeated Mom\'s Heart!', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const playAgain = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, '[ PLAY AGAIN ]', {
            fontSize: '24px',
            fill: '#00ff00'
        }).setOrigin(0.5).setInteractive();

        playAgain.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// ==================== CONFIG ====================
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, VictoryScene]
};

const game = new Phaser.Game(config);
