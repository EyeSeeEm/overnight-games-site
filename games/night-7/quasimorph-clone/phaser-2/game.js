// Quasimorph Clone - Turn-Based Tactical Extraction
// Built with Phaser 3

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        // Player
        const player = this.add.graphics();
        player.fillStyle(0x4488ff);
        player.fillCircle(16, 16, 12);
        player.fillStyle(0x88aaff);
        player.fillCircle(16, 12, 6);
        player.generateTexture('player', 32, 32);
        player.destroy();

        // Enemy: Guard
        const guard = this.add.graphics();
        guard.fillStyle(0x888844);
        guard.fillCircle(16, 16, 12);
        guard.fillStyle(0xaaaa66);
        guard.fillCircle(16, 12, 5);
        guard.generateTexture('guard', 32, 32);
        guard.destroy();

        // Enemy: Soldier
        const soldier = this.add.graphics();
        soldier.fillStyle(0x446644);
        soldier.fillCircle(16, 16, 12);
        soldier.fillStyle(0x668866);
        soldier.fillCircle(16, 12, 5);
        soldier.generateTexture('soldier', 32, 32);
        soldier.destroy();

        // Enemy: Possessed
        const possessed = this.add.graphics();
        possessed.fillStyle(0x884444);
        possessed.fillCircle(16, 16, 12);
        possessed.fillStyle(0xff4444);
        possessed.fillCircle(16, 12, 6);
        possessed.generateTexture('possessed', 32, 32);
        possessed.destroy();

        // Enemy: Bloater
        const bloater = this.add.graphics();
        bloater.fillStyle(0x664466);
        bloater.fillCircle(16, 16, 14);
        bloater.fillStyle(0xaa66aa);
        bloater.fillCircle(16, 14, 8);
        bloater.generateTexture('bloater', 32, 32);
        bloater.destroy();

        // Enemy: Stalker
        const stalker = this.add.graphics();
        stalker.fillStyle(0x333366);
        stalker.fillCircle(16, 16, 10);
        stalker.fillStyle(0x6666ff);
        stalker.fillCircle(16, 12, 4);
        stalker.generateTexture('stalker', 32, 32);
        stalker.destroy();

        // Floor tile
        const floor = this.add.graphics();
        floor.fillStyle(0x222233);
        floor.fillRect(0, 0, 32, 32);
        floor.fillStyle(0x2a2a3a);
        floor.fillRect(2, 2, 28, 28);
        floor.generateTexture('floor', 32, 32);
        floor.destroy();

        // Wall tile
        const wall = this.add.graphics();
        wall.fillStyle(0x444455);
        wall.fillRect(0, 0, 32, 32);
        wall.fillStyle(0x333344);
        wall.fillRect(2, 2, 28, 28);
        wall.generateTexture('wall', 32, 32);
        wall.destroy();

        // Door
        const door = this.add.graphics();
        door.fillStyle(0x666644);
        door.fillRect(0, 8, 32, 16);
        door.fillStyle(0xaaaa66);
        door.fillCircle(24, 16, 4);
        door.generateTexture('door', 32, 32);
        door.destroy();

        // Extraction point
        const extract = this.add.graphics();
        extract.fillStyle(0x44ff44);
        extract.fillRect(0, 0, 32, 32);
        extract.fillStyle(0x88ff88);
        extract.fillTriangle(16, 4, 4, 28, 28, 28);
        extract.generateTexture('extract', 32, 32);
        extract.destroy();

        // Fog tile
        const fog = this.add.graphics();
        fog.fillStyle(0x000000);
        fog.fillRect(0, 0, 32, 32);
        fog.generateTexture('fog', 32, 32);
        fog.destroy();

        // Items
        const medkit = this.add.graphics();
        medkit.fillStyle(0xffffff);
        medkit.fillRect(4, 4, 24, 24);
        medkit.fillStyle(0xff0000);
        medkit.fillRect(12, 6, 8, 20);
        medkit.fillRect(6, 12, 20, 8);
        medkit.generateTexture('medkit', 32, 32);
        medkit.destroy();

        const ammo = this.add.graphics();
        ammo.fillStyle(0xcc8822);
        ammo.fillRect(6, 8, 20, 16);
        ammo.fillStyle(0xaa6611);
        ammo.fillRect(8, 10, 6, 12);
        ammo.fillRect(16, 10, 6, 12);
        ammo.generateTexture('ammo', 32, 32);
        ammo.destroy();

        const pistol = this.add.graphics();
        pistol.fillStyle(0x444444);
        pistol.fillRect(8, 8, 16, 16);
        pistol.fillStyle(0x666666);
        pistol.fillRect(4, 16, 8, 12);
        pistol.generateTexture('pistolItem', 32, 32);
        pistol.destroy();

        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const centerX = 400;

        this.add.text(centerX, 100, 'QUASIMORPH', {
            fontSize: '56px',
            fill: '#ff4444',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(centerX, 155, 'Tactical Extraction', {
            fontSize: '20px',
            fill: '#884444'
        }).setOrigin(0.5);

        const instructions = [
            'Deploy as a mercenary on a corrupted station.',
            'Explore, loot, and fight to extract alive.',
            '',
            'CLICK - Move / Attack',
            'R - Reload weapon',
            'ENTER - End turn early',
            '1-4 - Switch weapons',
            '',
            'Stay too long = Corruption rises',
            'Corruption spawns deadlier enemies!',
            '',
            'Die = Lose everything',
            'Extract = Keep your loot and score'
        ];

        instructions.forEach((text, i) => {
            this.add.text(centerX, 200 + i * 24, text, {
                fontSize: '14px',
                fill: '#aaaacc'
            }).setOrigin(0.5);
        });

        const startBtn = this.add.text(centerX, 550, '[ DEPLOY ]', {
            fontSize: '32px',
            fill: '#44ff44'
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setFill('#88ff88'));
        startBtn.on('pointerout', () => startBtn.setFill('#44ff44'));
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));

        this.input.keyboard.once('keydown-ENTER', () => this.scene.start('GameScene'));
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Map dimensions
        this.mapWidth = 25;
        this.mapHeight = 18;
        this.tileSize = 32;

        // Player stats
        this.hp = 100;
        this.maxHp = 100;
        this.ap = 2;
        this.maxAp = 2;
        this.stance = 'walk'; // walk=2AP, run=3AP

        // Corruption
        this.corruption = 0;
        this.turn = 1;

        // Inventory
        this.weapons = [
            { name: 'Knife', ap: 1, range: 1, accuracy: 90, damage: [20, 30], ammo: Infinity, maxAmmo: Infinity, durability: 50 },
            { name: 'Pistol', ap: 1, range: 6, accuracy: 75, damage: [15, 20], ammo: 12, maxAmmo: 12, durability: 30 },
            null,
            null
        ];
        this.currentWeapon = 0;
        this.medkits = 2;
        this.score = 0;

        // Turn state
        this.playerTurn = true;
        this.selectedTile = null;

        // Generate map
        this.map = [];
        this.fogMap = [];
        this.enemies = [];
        this.items = [];
        this.generateMap();

        // Create tilemap visuals
        this.floorSprites = [];
        this.fogSprites = [];
        this.createMapVisuals();

        // Player sprite
        this.playerSprite = this.add.sprite(
            this.playerX * this.tileSize + this.tileSize / 2,
            this.playerY * this.tileSize + this.tileSize / 2,
            'player'
        ).setDepth(10);

        // Enemy sprites
        this.enemySprites = [];
        this.enemies.forEach(e => this.createEnemySprite(e));

        // Item sprites
        this.itemSprites = [];
        this.items.forEach(item => this.createItemSprite(item));

        // Update vision
        this.updateVision();

        // UI
        this.createUI();

        // Input
        this.input.on('pointerdown', (pointer) => this.handleClick(pointer));
        this.reloadKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    }

    generateMap() {
        // Initialize with walls
        for (let y = 0; y < this.mapHeight; y++) {
            this.map[y] = [];
            this.fogMap[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.map[y][x] = 'wall';
                this.fogMap[y][x] = true; // true = fogged
            }
        }

        // Carve rooms
        const rooms = [];
        for (let i = 0; i < 8; i++) {
            const roomW = Phaser.Math.Between(4, 7);
            const roomH = Phaser.Math.Between(4, 6);
            const roomX = Phaser.Math.Between(1, this.mapWidth - roomW - 1);
            const roomY = Phaser.Math.Between(1, this.mapHeight - roomH - 1);

            for (let y = roomY; y < roomY + roomH; y++) {
                for (let x = roomX; x < roomX + roomW; x++) {
                    this.map[y][x] = 'floor';
                }
            }

            rooms.push({ x: roomX + Math.floor(roomW / 2), y: roomY + Math.floor(roomH / 2), w: roomW, h: roomH });
        }

        // Connect rooms with corridors
        for (let i = 0; i < rooms.length - 1; i++) {
            const r1 = rooms[i];
            const r2 = rooms[i + 1];

            // Horizontal then vertical
            let x = r1.x;
            while (x !== r2.x) {
                if (this.map[r1.y]) this.map[r1.y][x] = 'floor';
                x += x < r2.x ? 1 : -1;
            }
            let y = r1.y;
            while (y !== r2.y) {
                if (this.map[y]) this.map[y][r2.x] = 'floor';
                y += y < r2.y ? 1 : -1;
            }
        }

        // Place player in first room
        this.playerX = rooms[0].x;
        this.playerY = rooms[0].y;

        // Place extraction in last room
        const lastRoom = rooms[rooms.length - 1];
        this.extractX = lastRoom.x;
        this.extractY = lastRoom.y;
        this.map[this.extractY][this.extractX] = 'extract';

        // Place enemies
        for (let i = 1; i < rooms.length - 1; i++) {
            const room = rooms[i];
            const enemyCount = Phaser.Math.Between(1, 2);

            for (let j = 0; j < enemyCount; j++) {
                const ex = room.x + Phaser.Math.Between(-1, 1);
                const ey = room.y + Phaser.Math.Between(-1, 1);

                if (this.map[ey][ex] === 'floor') {
                    const types = ['guard', 'soldier', 'guard'];
                    this.enemies.push({
                        type: Phaser.Utils.Array.GetRandom(types),
                        x: ex,
                        y: ey,
                        hp: Phaser.Utils.Array.GetRandom(types) === 'soldier' ? 75 : 50,
                        ap: 2,
                        damage: [10, 15],
                        alerted: false
                    });
                }
            }
        }

        // Place items in some rooms
        for (let i = 1; i < rooms.length; i++) {
            const room = rooms[i];
            if (Math.random() < 0.5) {
                const ix = room.x + Phaser.Math.Between(-1, 1);
                const iy = room.y + Phaser.Math.Between(-1, 1);

                if (this.map[iy][ix] === 'floor') {
                    this.items.push({
                        type: Phaser.Utils.Array.GetRandom(['medkit', 'ammo', 'pistolItem']),
                        x: ix,
                        y: iy
                    });
                }
            }
        }
    }

    createMapVisuals() {
        for (let y = 0; y < this.mapHeight; y++) {
            this.floorSprites[y] = [];
            this.fogSprites[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                const worldX = x * this.tileSize + this.tileSize / 2;
                const worldY = y * this.tileSize + this.tileSize / 2;

                const tile = this.map[y][x];
                let texture = tile === 'wall' ? 'wall' : (tile === 'extract' ? 'extract' : 'floor');

                const sprite = this.add.sprite(worldX, worldY, texture);
                this.floorSprites[y][x] = sprite;

                // Fog sprite
                const fog = this.add.sprite(worldX, worldY, 'fog').setDepth(20);
                this.fogSprites[y][x] = fog;
            }
        }
    }

    createEnemySprite(enemy) {
        const sprite = this.add.sprite(
            enemy.x * this.tileSize + this.tileSize / 2,
            enemy.y * this.tileSize + this.tileSize / 2,
            enemy.type
        ).setDepth(9);
        sprite.enemyData = enemy;
        this.enemySprites.push(sprite);
    }

    createItemSprite(item) {
        const sprite = this.add.sprite(
            item.x * this.tileSize + this.tileSize / 2,
            item.y * this.tileSize + this.tileSize / 2,
            item.type
        ).setDepth(5).setScale(0.7);
        sprite.itemData = item;
        this.itemSprites.push(sprite);
    }

    createUI() {
        // Top bar
        this.add.rectangle(400, 25, 800, 50, 0x000000, 0.8).setDepth(100);

        this.turnText = this.add.text(20, 10, 'Turn: 1', {
            fontSize: '16px',
            fill: '#fff'
        }).setDepth(101);

        this.corruptionText = this.add.text(150, 10, 'Corruption: 0', {
            fontSize: '16px',
            fill: '#ff4444'
        }).setDepth(101);

        this.apText = this.add.text(350, 10, 'AP: 2/2', {
            fontSize: '16px',
            fill: '#44ff44'
        }).setDepth(101);

        this.hpText = this.add.text(500, 10, 'HP: 100/100', {
            fontSize: '16px',
            fill: '#4488ff'
        }).setDepth(101);

        this.scoreText = this.add.text(680, 10, 'Score: 0', {
            fontSize: '16px',
            fill: '#ffd700'
        }).setDepth(101);

        // Bottom bar
        this.add.rectangle(400, 575, 800, 50, 0x000000, 0.8).setDepth(100);

        this.weaponText = this.add.text(20, 560, 'Knife', {
            fontSize: '14px',
            fill: '#aaa'
        }).setDepth(101);

        this.ammoText = this.add.text(150, 560, '', {
            fontSize: '14px',
            fill: '#cc8822'
        }).setDepth(101);

        this.medkitText = this.add.text(300, 560, 'Medkits: 2', {
            fontSize: '14px',
            fill: '#ff4444'
        }).setDepth(101);

        this.stanceText = this.add.text(450, 560, 'Stance: Walk', {
            fontSize: '14px',
            fill: '#88ff88'
        }).setDepth(101);

        this.hintText = this.add.text(600, 560, 'Click to move/attack', {
            fontSize: '12px',
            fill: '#666'
        }).setDepth(101);

        // Turn indicator (enemy turn)
        this.enemyTurnIndicator = this.add.text(400, 100, 'ENEMY TURN', {
            fontSize: '32px',
            fill: '#ff4444',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(200).setVisible(false);

        this.updateUI();
    }

    updateUI() {
        this.turnText.setText(`Turn: ${this.turn}`);
        this.corruptionText.setText(`Corruption: ${this.corruption}`);
        this.apText.setText(`AP: ${this.ap}/${this.maxAp}`);
        this.hpText.setText(`HP: ${this.hp}/${this.maxHp}`);
        this.scoreText.setText(`Score: ${this.score}`);

        const weapon = this.weapons[this.currentWeapon];
        if (weapon) {
            this.weaponText.setText(`[${this.currentWeapon + 1}] ${weapon.name}`);
            if (weapon.ammo !== Infinity) {
                this.ammoText.setText(`Ammo: ${weapon.ammo}/${weapon.maxAmmo}`);
            } else {
                this.ammoText.setText('');
            }
        }

        this.medkitText.setText(`Medkits: ${this.medkits}`);
        this.stanceText.setText(`Stance: ${this.stance === 'walk' ? 'Walk' : 'Run'}`);

        // Corruption color
        if (this.corruption >= 600) {
            this.corruptionText.setFill('#ff0000');
        } else if (this.corruption >= 400) {
            this.corruptionText.setFill('#ff6644');
        } else if (this.corruption >= 200) {
            this.corruptionText.setFill('#ffaa44');
        }
    }

    updateVision() {
        const visionRange = 6;

        // Simple radial vision
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const dist = Math.sqrt((x - this.playerX) ** 2 + (y - this.playerY) ** 2);

                if (dist <= visionRange) {
                    // Check line of sight
                    if (this.hasLineOfSight(this.playerX, this.playerY, x, y)) {
                        this.fogMap[y][x] = false;
                        this.fogSprites[y][x].setVisible(false);
                    }
                }
            }
        }

        // Update enemy visibility
        this.enemySprites.forEach(sprite => {
            const e = sprite.enemyData;
            sprite.setVisible(!this.fogMap[e.y][e.x]);
        });

        // Update item visibility
        this.itemSprites.forEach(sprite => {
            const item = sprite.itemData;
            sprite.setVisible(!this.fogMap[item.y][item.x]);
        });
    }

    hasLineOfSight(x0, y0, x1, y1) {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        let x = x0;
        let y = y0;

        while (x !== x1 || y !== y1) {
            if (this.map[y][x] === 'wall' && (x !== x0 || y !== y0)) {
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

        return true;
    }

    update(time, delta) {
        if (!this.playerTurn) return;

        // Reload
        if (Phaser.Input.Keyboard.JustDown(this.reloadKey)) {
            this.reloadWeapon();
        }

        // End turn
        if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            this.endPlayerTurn();
        }

        // Switch weapons
        if (Phaser.Input.Keyboard.JustDown(this.key1)) this.currentWeapon = 0;
        if (Phaser.Input.Keyboard.JustDown(this.key2) && this.weapons[1]) this.currentWeapon = 1;

        // Auto-end turn when no AP
        if (this.ap <= 0) {
            this.endPlayerTurn();
        }
    }

    handleClick(pointer) {
        if (!this.playerTurn) return;

        const tileX = Math.floor(pointer.x / this.tileSize);
        const tileY = Math.floor(pointer.y / this.tileSize);

        // Check bounds
        if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) return;

        // Check if clicking enemy
        const enemy = this.enemies.find(e => e.x === tileX && e.y === tileY && e.hp > 0);
        if (enemy && !this.fogMap[tileY][tileX]) {
            this.attackEnemy(enemy);
            return;
        }

        // Check if clicking adjacent floor tile to move
        const dist = Math.abs(tileX - this.playerX) + Math.abs(tileY - this.playerY);
        if (dist === 1 && this.map[tileY][tileX] !== 'wall') {
            this.movePlayer(tileX, tileY);
        } else if (this.ap <= 0) {
            this.showFloatingText('No AP!');
        }
    }

    movePlayer(x, y) {
        if (this.ap < 1) {
            this.showFloatingText('No AP!');
            return;
        }

        this.ap--;
        this.playerX = x;
        this.playerY = y;

        this.playerSprite.setPosition(
            x * this.tileSize + this.tileSize / 2,
            y * this.tileSize + this.tileSize / 2
        );

        // Pick up items
        const item = this.items.find(i => i.x === x && i.y === y);
        if (item) {
            this.collectItem(item);
        }

        // Check extraction
        if (x === this.extractX && y === this.extractY) {
            this.extract();
            return;
        }

        this.updateVision();
        this.updateUI();
    }

    collectItem(item) {
        if (item.type === 'medkit') {
            this.medkits++;
            this.score += 10;
        } else if (item.type === 'ammo') {
            const pistol = this.weapons[1];
            if (pistol) {
                pistol.ammo = pistol.maxAmmo;
            }
            this.score += 5;
        } else if (item.type === 'pistolItem') {
            if (!this.weapons[1]) {
                this.weapons[1] = { name: 'Pistol', ap: 1, range: 6, accuracy: 75, damage: [15, 20], ammo: 12, maxAmmo: 12, durability: 30 };
            } else {
                this.weapons[1].ammo = this.weapons[1].maxAmmo;
            }
            this.score += 20;
        }

        // Remove item
        const idx = this.items.indexOf(item);
        if (idx > -1) {
            this.items.splice(idx, 1);
            const spriteIdx = this.itemSprites.findIndex(s => s.itemData === item);
            if (spriteIdx > -1) {
                this.itemSprites[spriteIdx].destroy();
                this.itemSprites.splice(spriteIdx, 1);
            }
        }
    }

    attackEnemy(enemy) {
        const weapon = this.weapons[this.currentWeapon];
        if (!weapon) return;

        const dist = Math.abs(enemy.x - this.playerX) + Math.abs(enemy.y - this.playerY);
        if (dist > weapon.range) {
            this.showFloatingText('Out of range!');
            return;
        }

        if (weapon.ap > this.ap) {
            this.showFloatingText('No AP!');
            return;
        }

        if (weapon.ammo !== Infinity && weapon.ammo <= 0) {
            this.showFloatingText('No ammo!');
            return;
        }

        this.ap -= weapon.ap;
        if (weapon.ammo !== Infinity) weapon.ammo--;

        // Accuracy check
        const roll = Math.random() * 100;
        if (roll > weapon.accuracy) {
            this.showFloatingText('Miss!');
            enemy.alerted = true;
            this.updateUI();
            return;
        }

        // Damage
        const damage = Phaser.Math.Between(weapon.damage[0], weapon.damage[1]);
        enemy.hp -= damage;
        enemy.alerted = true;

        // Visual feedback
        const sprite = this.enemySprites.find(s => s.enemyData === enemy);
        if (sprite) {
            sprite.setTint(0xff0000);
            this.time.delayedCall(200, () => {
                if (sprite.active) sprite.clearTint();
            });
        }

        this.showFloatingText(`-${damage}`, enemy.x * this.tileSize + 16, enemy.y * this.tileSize);

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }

        this.updateUI();
    }

    killEnemy(enemy) {
        const sprite = this.enemySprites.find(s => s.enemyData === enemy);
        if (sprite) {
            sprite.destroy();
            this.enemySprites = this.enemySprites.filter(s => s !== sprite);
        }

        this.enemies = this.enemies.filter(e => e !== enemy);

        // Score
        const scoreGain = enemy.type === 'soldier' ? 30 : 20;
        this.score += scoreGain;
        this.showFloatingText(`+${scoreGain} pts`, enemy.x * this.tileSize + 16, enemy.y * this.tileSize - 16);
    }

    reloadWeapon() {
        const weapon = this.weapons[this.currentWeapon];
        if (!weapon || weapon.ammo === Infinity) return;
        if (this.ap < 1) {
            this.showFloatingText('No AP!');
            return;
        }

        this.ap--;
        weapon.ammo = weapon.maxAmmo;
        this.showFloatingText('Reloaded');
        this.updateUI();
    }

    showFloatingText(text, x = null, y = null) {
        const px = x !== null ? x : this.playerSprite.x;
        const py = y !== null ? y : this.playerSprite.y - 20;

        const txt = this.add.text(px, py, text, {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#000000'
        }).setOrigin(0.5).setDepth(150);

        this.tweens.add({
            targets: txt,
            y: py - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => txt.destroy()
        });
    }

    endPlayerTurn() {
        this.playerTurn = false;
        this.enemyTurnIndicator.setVisible(true);

        // Enemy turn
        this.time.delayedCall(500, () => {
            this.doEnemyTurn();
        });
    }

    doEnemyTurn() {
        let delay = 0;

        this.enemies.forEach(enemy => {
            if (enemy.hp <= 0) return;

            this.time.delayedCall(delay, () => {
                this.processEnemyAI(enemy);
            });

            delay += 300;
        });

        this.time.delayedCall(delay + 200, () => {
            this.startNewTurn();
        });
    }

    processEnemyAI(enemy) {
        const dist = Math.abs(enemy.x - this.playerX) + Math.abs(enemy.y - this.playerY);
        const canSee = !this.fogMap[enemy.y][enemy.x] && this.hasLineOfSight(enemy.x, enemy.y, this.playerX, this.playerY);

        if (canSee || enemy.alerted) {
            enemy.alerted = true;

            // Attack if in range
            if (dist <= 5) {
                this.enemyAttack(enemy);
            } else {
                // Move toward player
                this.enemyMove(enemy);
            }
        }
    }

    enemyAttack(enemy) {
        const damage = Phaser.Math.Between(enemy.damage[0], enemy.damage[1]);

        // Flash enemy
        const sprite = this.enemySprites.find(s => s.enemyData === enemy);
        if (sprite) {
            sprite.setTint(0xffff00);
            this.time.delayedCall(200, () => {
                if (sprite.active) sprite.clearTint();
            });
        }

        // Accuracy
        if (Math.random() < 0.7) {
            this.hp -= damage;
            this.showFloatingText(`-${damage}`, this.playerSprite.x, this.playerSprite.y - 20);
            this.cameras.main.shake(100, 0.01);

            if (this.hp <= 0) {
                this.gameOver();
            }
        } else {
            this.showFloatingText('Missed!', this.playerSprite.x, this.playerSprite.y - 20);
        }
    }

    enemyMove(enemy) {
        const dx = Math.sign(this.playerX - enemy.x);
        const dy = Math.sign(this.playerY - enemy.y);

        let newX = enemy.x;
        let newY = enemy.y;

        // Prefer moving toward player
        if (Math.random() < 0.5 && dx !== 0 && this.map[enemy.y][enemy.x + dx] !== 'wall') {
            newX = enemy.x + dx;
        } else if (dy !== 0 && this.map[enemy.y + dy] && this.map[enemy.y + dy][enemy.x] !== 'wall') {
            newY = enemy.y + dy;
        } else if (dx !== 0 && this.map[enemy.y][enemy.x + dx] !== 'wall') {
            newX = enemy.x + dx;
        }

        // Check for other enemies
        const occupied = this.enemies.some(e => e !== enemy && e.x === newX && e.y === newY);
        if (!occupied && !(newX === this.playerX && newY === this.playerY)) {
            enemy.x = newX;
            enemy.y = newY;

            const sprite = this.enemySprites.find(s => s.enemyData === enemy);
            if (sprite) {
                sprite.setPosition(
                    enemy.x * this.tileSize + this.tileSize / 2,
                    enemy.y * this.tileSize + this.tileSize / 2
                );
            }
        }
    }

    startNewTurn() {
        this.enemyTurnIndicator.setVisible(false);
        this.turn++;
        this.corruption += 10 + Math.floor(this.turn / 5) * 5;

        // Corruption effects - transform or spawn new enemies
        if (this.corruption >= 400 && Math.random() < 0.2) {
            this.spawnCorruptedEnemy();
        }

        this.ap = this.stance === 'walk' ? 2 : 3;
        this.playerTurn = true;

        this.updateVision();
        this.updateUI();
    }

    spawnCorruptedEnemy() {
        // Find a valid spawn location
        const floorTiles = [];
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                if (this.map[y][x] === 'floor' && this.fogMap[y][x]) {
                    const dist = Math.abs(x - this.playerX) + Math.abs(y - this.playerY);
                    if (dist > 3 && dist < 10) {
                        floorTiles.push({ x, y });
                    }
                }
            }
        }

        if (floorTiles.length > 0) {
            const tile = Phaser.Utils.Array.GetRandom(floorTiles);
            const types = this.corruption >= 600 ? ['possessed', 'bloater', 'stalker'] : ['possessed', 'stalker'];
            const type = Phaser.Utils.Array.GetRandom(types);

            const enemy = {
                type: type,
                x: tile.x,
                y: tile.y,
                hp: type === 'bloater' ? 150 : (type === 'possessed' ? 80 : 60),
                ap: type === 'stalker' ? 4 : (type === 'possessed' ? 3 : 1),
                damage: type === 'bloater' ? [30, 40] : [15, 25],
                alerted: true
            };

            this.enemies.push(enemy);
            this.createEnemySprite(enemy);
        }
    }

    extract() {
        this.scene.start('GameOverScene', { victory: true, score: this.score, turn: this.turn });
    }

    gameOver() {
        this.scene.start('GameOverScene', { victory: false, score: 0, turn: this.turn });
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.victory = data.victory;
        this.score = data.score;
        this.turn = data.turn;
    }

    create() {
        const centerX = 400;

        if (this.victory) {
            this.add.text(centerX, 150, 'EXTRACTED!', {
                fontSize: '56px',
                fill: '#44ff44'
            }).setOrigin(0.5);

            this.add.text(centerX, 230, `Score: ${this.score}`, {
                fontSize: '32px',
                fill: '#ffd700'
            }).setOrigin(0.5);

            this.add.text(centerX, 280, `Turns survived: ${this.turn}`, {
                fontSize: '20px',
                fill: '#aaa'
            }).setOrigin(0.5);
        } else {
            this.add.text(centerX, 150, 'CLONE LOST', {
                fontSize: '56px',
                fill: '#ff4444'
            }).setOrigin(0.5);

            this.add.text(centerX, 230, 'All gear lost!', {
                fontSize: '24px',
                fill: '#ff8888'
            }).setOrigin(0.5);

            this.add.text(centerX, 280, `Survived ${this.turn} turns`, {
                fontSize: '18px',
                fill: '#888'
            }).setOrigin(0.5);
        }

        const restartBtn = this.add.text(centerX, 400, '[ DEPLOY AGAIN ]', {
            fontSize: '28px',
            fill: '#44ff44'
        }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerover', () => restartBtn.setFill('#88ff88'));
        restartBtn.on('pointerout', () => restartBtn.setFill('#44ff44'));
        restartBtn.on('pointerdown', () => this.scene.start('GameScene'));

        const menuBtn = this.add.text(centerX, 460, '[ MAIN MENU ]', {
            fontSize: '20px',
            fill: '#888'
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerover', () => menuBtn.setFill('#aaa'));
        menuBtn.on('pointerout', () => menuBtn.setFill('#888'));
        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#0a0a12',
    scene: [BootScene, MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);
