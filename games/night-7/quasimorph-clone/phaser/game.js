// Quasimorph Clone - Turn-based tactical extraction roguelike
// Built with Phaser 3

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Player (green soldier)
        g.fillStyle(0x44aa44);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x226622);
        g.fillRect(8, 8, 16, 16);
        g.fillStyle(0x88ff88);
        g.fillRect(10, 6, 4, 4);
        g.fillRect(18, 6, 4, 4);
        g.generateTexture('player', 32, 32);
        g.clear();

        // Guard enemy (red)
        g.fillStyle(0xaa4444);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x662222);
        g.fillRect(8, 8, 16, 16);
        g.generateTexture('guard', 32, 32);
        g.clear();

        // Soldier enemy (orange)
        g.fillStyle(0xcc6622);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x884411);
        g.fillRect(8, 8, 16, 16);
        g.generateTexture('soldier', 32, 32);
        g.clear();

        // Possessed enemy (purple)
        g.fillStyle(0x8844aa);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x552266);
        g.fillRect(8, 8, 16, 16);
        g.fillStyle(0xff44ff);
        g.fillRect(10, 10, 12, 8);
        g.generateTexture('possessed', 32, 32);
        g.clear();

        // Bloater enemy (green/yellow)
        g.fillStyle(0x88aa22);
        g.fillRect(2, 2, 28, 28);
        g.fillStyle(0x556611);
        g.fillRect(6, 6, 20, 20);
        g.generateTexture('bloater', 32, 32);
        g.clear();

        // Stalker enemy (dark blue)
        g.fillStyle(0x224466);
        g.fillRect(6, 6, 20, 20);
        g.fillStyle(0x113344);
        g.fillRect(10, 10, 12, 12);
        g.fillStyle(0x44aaff);
        g.fillRect(12, 8, 3, 3);
        g.fillRect(17, 8, 3, 3);
        g.generateTexture('stalker', 32, 32);
        g.clear();

        // Floor tile
        g.fillStyle(0x222233);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, 0x333344);
        g.strokeRect(0, 0, 32, 32);
        g.generateTexture('floor', 32, 32);
        g.clear();

        // Wall tile
        g.fillStyle(0x445566);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x556677);
        g.fillRect(2, 2, 28, 14);
        g.generateTexture('wall', 32, 32);
        g.clear();

        // Door tile
        g.fillStyle(0x664422);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x885533);
        g.fillRect(12, 4, 8, 24);
        g.generateTexture('door', 32, 32);
        g.clear();

        // Extract point
        g.fillStyle(0x44ff44);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(0x22aa22);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0xffffff);
        g.fillTriangle(16, 8, 8, 24, 24, 24);
        g.generateTexture('extract', 32, 32);
        g.clear();

        // Crate (loot)
        g.fillStyle(0x886644);
        g.fillRect(4, 8, 24, 20);
        g.fillStyle(0xaa8866);
        g.fillRect(6, 10, 20, 8);
        g.generateTexture('crate', 32, 32);
        g.clear();

        // Bullet
        g.fillStyle(0xffff44);
        g.fillCircle(4, 4, 3);
        g.generateTexture('bullet', 8, 8);
        g.clear();

        // Selection indicator
        g.lineStyle(2, 0x44ff44);
        g.strokeRect(2, 2, 28, 28);
        g.generateTexture('selection', 32, 32);
        g.clear();

        // Target indicator (red)
        g.lineStyle(2, 0xff4444);
        g.strokeRect(2, 2, 28, 28);
        g.strokeRect(8, 8, 16, 16);
        g.generateTexture('target', 32, 32);
        g.clear();

        // Fog
        g.fillStyle(0x000000);
        g.fillRect(0, 0, 32, 32);
        g.generateTexture('fog', 32, 32);
        g.clear();

        // Fog partial (explored but not visible)
        g.fillStyle(0x000000, 0.6);
        g.fillRect(0, 0, 32, 32);
        g.generateTexture('fog_partial', 32, 32);
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
        this.add.text(cx, 120, 'QUASIMORPH', {
            fontSize: '64px',
            fontFamily: 'monospace',
            color: '#44ff44',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(cx, 180, 'CLONE', {
            fontSize: '32px',
            fontFamily: 'monospace',
            color: '#88ff88'
        }).setOrigin(0.5);

        // Instructions
        const instructions = [
            'TURN-BASED TACTICAL EXTRACTION',
            '',
            'WASD/Arrows - Move (costs 1 AP per tile)',
            'Click Enemy - Attack (if in range)',
            'R - Reload weapon',
            'ENTER - End turn early',
            '1-4 - Switch weapons',
            'E - Use item',
            '',
            'CORRUPTION rises each turn',
            'Extract before its too late!',
            '',
            'Click to Deploy'
        ];

        this.add.text(cx, 380, instructions.join('\n'), {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#aaaaaa',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5);

        // High score
        const highScore = localStorage.getItem('quasimorph_highscore') || 0;
        this.add.text(cx, 550, `High Score: ${highScore}`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#ffff44'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Game constants
        this.TILE_SIZE = 32;
        this.MAP_WIDTH = 25;
        this.MAP_HEIGHT = 18;
        this.VISION_RANGE = 6;

        // Weapons data
        this.WEAPONS = {
            knife: { name: 'Knife', ap: 1, range: 1, accuracy: 90, damage: [20, 30], ammoType: null, durability: 100 },
            pistol: { name: 'Pistol', ap: 1, range: 6, accuracy: 75, damage: [15, 20], ammoType: '9mm', durability: 30 },
            smg: { name: 'SMG', ap: 1, range: 5, accuracy: 60, damage: [10, 15], ammoType: '9mm', burst: 3, durability: 25 },
            shotgun: { name: 'Shotgun', ap: 2, range: 3, accuracy: 80, damage: [25, 40], ammoType: '12g', durability: 20 }
        };

        // Enemy data
        this.ENEMIES = {
            guard: { hp: 50, ap: 2, weapon: 'pistol', behavior: 'patrol', texture: 'guard' },
            soldier: { hp: 75, ap: 2, weapon: 'smg', behavior: 'aggressive', texture: 'soldier' },
            possessed: { hp: 80, ap: 3, weapon: 'claws', behavior: 'hunt', texture: 'possessed', melee: true, damage: [15, 25] },
            bloater: { hp: 150, ap: 1, weapon: 'explode', behavior: 'slow', texture: 'bloater', explodeOnDeath: true },
            stalker: { hp: 60, ap: 4, weapon: 'bite', behavior: 'ambush', texture: 'stalker', melee: true, damage: [10, 20] }
        };

        // Player state
        this.player = {
            x: 2, y: 2,
            hp: 100, maxHp: 100,
            ap: 2, maxAp: 2,
            stance: 'walk',
            weapons: [
                { ...this.WEAPONS.knife, currentDurability: 100 },
                { ...this.WEAPONS.pistol, currentDurability: 30, ammo: 12, maxAmmo: 12 }
            ],
            currentWeapon: 1,
            inventory: [
                { type: 'bandage', name: 'Bandage', count: 2 },
                { type: 'ammo_9mm', name: '9mm Ammo', count: 24 }
            ],
            bleeding: false,
            score: 0
        };

        // Game state
        this.turn = 1;
        this.corruption = 0;
        this.enemies = [];
        this.loot = [];
        this.map = [];
        this.explored = [];
        this.visible = [];
        this.playerTurn = true;
        this.gameOver = false;
        this.extractPoint = { x: 0, y: 0 };

        // Generate map
        this.generateMap();

        // Create tilemap display
        this.tileGroup = this.add.group();
        this.entityGroup = this.add.group();
        this.fogGroup = this.add.group();
        this.uiGroup = this.add.group();

        // Render initial map
        this.renderMap();

        // Create player sprite
        this.playerSprite = this.add.image(
            this.player.x * this.TILE_SIZE + 16,
            this.player.y * this.TILE_SIZE + 16,
            'player'
        ).setDepth(10);

        // Selection indicator
        this.selection = this.add.image(0, 0, 'selection').setVisible(false).setDepth(15);

        // Target indicator
        this.targetIndicator = this.add.image(0, 0, 'target').setVisible(false).setDepth(15);

        // Create enemy sprites
        this.renderEnemies();

        // Create loot sprites
        this.renderLoot();

        // Update visibility
        this.updateVisibility();

        // Create UI
        this.createUI();

        // Input handling
        this.setupInput();

        // Enemy turn indicator
        this.enemyTurnText = this.add.text(400, 80, 'ENEMY TURN', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(100).setVisible(false);

        // No AP text
        this.noApText = this.add.text(0, 0, 'NO AP!', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100).setVisible(false);
    }

    generateMap() {
        // Initialize map with walls
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            this.map[y] = [];
            this.explored[y] = [];
            this.visible[y] = [];
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                this.map[y][x] = 1; // Wall
                this.explored[y][x] = false;
                this.visible[y][x] = false;
            }
        }

        // Generate rooms
        const rooms = [];
        const numRooms = Phaser.Math.Between(8, 12);

        for (let i = 0; i < numRooms; i++) {
            const w = Phaser.Math.Between(4, 7);
            const h = Phaser.Math.Between(4, 6);
            const x = Phaser.Math.Between(1, this.MAP_WIDTH - w - 1);
            const y = Phaser.Math.Between(1, this.MAP_HEIGHT - h - 1);

            // Check overlap
            let overlap = false;
            for (const room of rooms) {
                if (x < room.x + room.w + 1 && x + w + 1 > room.x &&
                    y < room.y + room.h + 1 && y + h + 1 > room.y) {
                    overlap = true;
                    break;
                }
            }

            if (!overlap) {
                rooms.push({ x, y, w, h });

                // Carve room
                for (let ry = y; ry < y + h; ry++) {
                    for (let rx = x; rx < x + w; rx++) {
                        this.map[ry][rx] = 0; // Floor
                    }
                }
            }
        }

        // Connect rooms with corridors
        for (let i = 1; i < rooms.length; i++) {
            const prev = rooms[i - 1];
            const curr = rooms[i];

            const prevCx = Math.floor(prev.x + prev.w / 2);
            const prevCy = Math.floor(prev.y + prev.h / 2);
            const currCx = Math.floor(curr.x + curr.w / 2);
            const currCy = Math.floor(curr.y + curr.h / 2);

            // Horizontal then vertical
            if (Math.random() < 0.5) {
                this.carveHCorridor(prevCx, currCx, prevCy);
                this.carveVCorridor(prevCy, currCy, currCx);
            } else {
                this.carveVCorridor(prevCy, currCy, prevCx);
                this.carveHCorridor(prevCx, currCx, currCy);
            }
        }

        // Place player in first room
        if (rooms.length > 0) {
            this.player.x = Math.floor(rooms[0].x + rooms[0].w / 2);
            this.player.y = Math.floor(rooms[0].y + rooms[0].h / 2);
        }

        // Place extraction in last room
        if (rooms.length > 1) {
            const lastRoom = rooms[rooms.length - 1];
            this.extractPoint.x = Math.floor(lastRoom.x + lastRoom.w / 2);
            this.extractPoint.y = Math.floor(lastRoom.y + lastRoom.h / 2);
            this.map[this.extractPoint.y][this.extractPoint.x] = 2; // Extract
        }

        // Spawn enemies (not in first room)
        for (let i = 1; i < rooms.length; i++) {
            const room = rooms[i];
            const numEnemies = Phaser.Math.Between(1, 2);

            for (let e = 0; e < numEnemies; e++) {
                const ex = Phaser.Math.Between(room.x + 1, room.x + room.w - 2);
                const ey = Phaser.Math.Between(room.y + 1, room.y + room.h - 2);

                if (this.map[ey][ex] === 0 && !(ex === this.extractPoint.x && ey === this.extractPoint.y)) {
                    const type = Math.random() < 0.6 ? 'guard' : 'soldier';
                    this.enemies.push({
                        x: ex, y: ey,
                        type: type,
                        hp: this.ENEMIES[type].hp,
                        maxHp: this.ENEMIES[type].hp,
                        ap: this.ENEMIES[type].ap,
                        alerted: false,
                        sprite: null
                    });
                }
            }
        }

        // Spawn loot
        for (let i = 0; i < rooms.length; i++) {
            const room = rooms[i];
            if (Math.random() < 0.6) {
                const lx = Phaser.Math.Between(room.x + 1, room.x + room.w - 2);
                const ly = Phaser.Math.Between(room.y + 1, room.y + room.h - 2);

                if (this.map[ly][lx] === 0) {
                    const lootTypes = ['weapon', 'ammo', 'medkit', 'bandage'];
                    const type = lootTypes[Phaser.Math.Between(0, lootTypes.length - 1)];

                    let item = { x: lx, y: ly, type: type };
                    if (type === 'weapon') {
                        const weapons = ['pistol', 'smg', 'shotgun'];
                        item.weapon = weapons[Phaser.Math.Between(0, weapons.length - 1)];
                    }

                    this.loot.push(item);
                }
            }
        }
    }

    carveHCorridor(x1, x2, y) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        for (let x = minX; x <= maxX; x++) {
            if (y > 0 && y < this.MAP_HEIGHT - 1) {
                this.map[y][x] = 0;
            }
        }
    }

    carveVCorridor(y1, y2, x) {
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        for (let y = minY; y <= maxY; y++) {
            if (x > 0 && x < this.MAP_WIDTH - 1) {
                this.map[y][x] = 0;
            }
        }
    }

    renderMap() {
        this.tileGroup.clear(true, true);

        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                let texture = 'wall';
                if (this.map[y][x] === 0) texture = 'floor';
                else if (this.map[y][x] === 2) texture = 'extract';

                const tile = this.add.image(x * this.TILE_SIZE + 16, y * this.TILE_SIZE + 16, texture);
                this.tileGroup.add(tile);
            }
        }
    }

    renderEnemies() {
        // Clear existing enemy sprites
        this.enemies.forEach(e => {
            if (e.sprite) e.sprite.destroy();
        });

        this.enemies.forEach(enemy => {
            const data = this.ENEMIES[enemy.type];
            enemy.sprite = this.add.image(
                enemy.x * this.TILE_SIZE + 16,
                enemy.y * this.TILE_SIZE + 16,
                data.texture
            ).setDepth(9);
            enemy.sprite.setInteractive();
            enemy.sprite.enemy = enemy;
        });
    }

    renderLoot() {
        this.loot.forEach(item => {
            if (!item.sprite) {
                item.sprite = this.add.image(
                    item.x * this.TILE_SIZE + 16,
                    item.y * this.TILE_SIZE + 16,
                    'crate'
                ).setDepth(5);
            }
        });
    }

    updateVisibility() {
        // Reset visibility
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                this.visible[y][x] = false;
            }
        }

        // Simple shadowcasting
        const px = this.player.x;
        const py = this.player.y;

        this.visible[py][px] = true;
        this.explored[py][px] = true;

        for (let angle = 0; angle < 360; angle += 2) {
            const rad = angle * Math.PI / 180;
            const dx = Math.cos(rad);
            const dy = Math.sin(rad);

            for (let dist = 1; dist <= this.VISION_RANGE; dist++) {
                const x = Math.round(px + dx * dist);
                const y = Math.round(py + dy * dist);

                if (x < 0 || x >= this.MAP_WIDTH || y < 0 || y >= this.MAP_HEIGHT) break;

                this.visible[y][x] = true;
                this.explored[y][x] = true;

                if (this.map[y][x] === 1) break; // Wall blocks vision
            }
        }

        // Update fog overlay
        this.fogGroup.clear(true, true);

        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                if (!this.visible[y][x]) {
                    const texture = this.explored[y][x] ? 'fog_partial' : 'fog';
                    const fog = this.add.image(x * this.TILE_SIZE + 16, y * this.TILE_SIZE + 16, texture).setDepth(20);
                    this.fogGroup.add(fog);
                }
            }
        }

        // Update enemy visibility
        this.enemies.forEach(enemy => {
            if (enemy.sprite) {
                enemy.sprite.setVisible(this.visible[enemy.y][enemy.x]);
            }
        });

        // Update loot visibility
        this.loot.forEach(item => {
            if (item.sprite) {
                item.sprite.setVisible(this.visible[item.y][item.x]);
            }
        });
    }

    createUI() {
        const uiY = 576;

        // UI Background
        this.add.rectangle(400, uiY, 800, 48, 0x111122, 0.9).setDepth(50);

        // Top bar
        this.add.rectangle(400, 12, 800, 24, 0x111122, 0.9).setDepth(50);

        // HP display
        this.hpText = this.add.text(10, uiY - 12, '', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ff4444'
        }).setDepth(51);

        // AP display
        this.apText = this.add.text(150, uiY - 12, '', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#44aaff'
        }).setDepth(51);

        // Weapon display
        this.weaponText = this.add.text(280, uiY - 12, '', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffff44'
        }).setDepth(51);

        // Top bar info
        this.turnText = this.add.text(10, 4, '', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#aaaaaa'
        }).setDepth(51);

        this.corruptionText = this.add.text(200, 4, '', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#aa44aa'
        }).setDepth(51);

        this.scoreText = this.add.text(500, 4, '', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#ffff44'
        }).setDepth(51);

        // Instructions
        this.add.text(650, uiY - 12, 'R:Reload ENTER:End', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#666666'
        }).setDepth(51);

        this.updateUI();
    }

    updateUI() {
        const weapon = this.player.weapons[this.player.currentWeapon];
        const ammoText = weapon.ammoType ? ` [${weapon.ammo}/${weapon.maxAmmo}]` : '';
        const durText = ` (${weapon.currentDurability}%)`;

        this.hpText.setText(`HP: ${this.player.hp}/${this.player.maxHp}`);
        this.apText.setText(`AP: ${this.player.ap}/${this.player.maxAp}`);
        this.weaponText.setText(`${weapon.name}${ammoText}${durText}`);

        this.turnText.setText(`Turn: ${this.turn}`);
        this.corruptionText.setText(`Corruption: ${this.corruption}/1000`);
        this.scoreText.setText(`Score: ${this.player.score}`);

        // Color corruption based on level
        if (this.corruption >= 800) {
            this.corruptionText.setColor('#ff0000');
        } else if (this.corruption >= 600) {
            this.corruptionText.setColor('#ff4444');
        } else if (this.corruption >= 400) {
            this.corruptionText.setColor('#ff8844');
        } else if (this.corruption >= 200) {
            this.corruptionText.setColor('#ffaa44');
        } else {
            this.corruptionText.setColor('#aa44aa');
        }
    }

    setupInput() {
        // Movement keys
        this.input.keyboard.on('keydown-W', () => this.tryMove(0, -1));
        this.input.keyboard.on('keydown-UP', () => this.tryMove(0, -1));
        this.input.keyboard.on('keydown-S', () => this.tryMove(0, 1));
        this.input.keyboard.on('keydown-DOWN', () => this.tryMove(0, 1));
        this.input.keyboard.on('keydown-A', () => this.tryMove(-1, 0));
        this.input.keyboard.on('keydown-LEFT', () => this.tryMove(-1, 0));
        this.input.keyboard.on('keydown-D', () => this.tryMove(1, 0));
        this.input.keyboard.on('keydown-RIGHT', () => this.tryMove(1, 0));

        // End turn
        this.input.keyboard.on('keydown-ENTER', () => this.endTurn());

        // Reload
        this.input.keyboard.on('keydown-R', () => this.reload());

        // Weapon switching
        this.input.keyboard.on('keydown-ONE', () => this.switchWeapon(0));
        this.input.keyboard.on('keydown-TWO', () => this.switchWeapon(1));
        this.input.keyboard.on('keydown-THREE', () => this.switchWeapon(2));
        this.input.keyboard.on('keydown-FOUR', () => this.switchWeapon(3));

        // Use item
        this.input.keyboard.on('keydown-E', () => this.useItem());

        // Click handling for attacks
        this.input.on('pointerdown', (pointer) => {
            if (this.gameOver || !this.playerTurn) return;

            const tileX = Math.floor(pointer.x / this.TILE_SIZE);
            const tileY = Math.floor(pointer.y / this.TILE_SIZE);

            // Check if clicking on an enemy
            const enemy = this.enemies.find(e => e.x === tileX && e.y === tileY && e.hp > 0);
            if (enemy && this.visible[tileY][tileX]) {
                this.attackEnemy(enemy);
            }
        });

        // Mouse move for targeting
        this.input.on('pointermove', (pointer) => {
            if (this.gameOver || !this.playerTurn) return;

            const tileX = Math.floor(pointer.x / this.TILE_SIZE);
            const tileY = Math.floor(pointer.y / this.TILE_SIZE);

            // Show target on enemies
            const enemy = this.enemies.find(e => e.x === tileX && e.y === tileY && e.hp > 0);
            if (enemy && this.visible[tileY][tileX]) {
                this.targetIndicator.setPosition(tileX * this.TILE_SIZE + 16, tileY * this.TILE_SIZE + 16);
                this.targetIndicator.setVisible(true);
            } else {
                this.targetIndicator.setVisible(false);
            }
        });
    }

    showNoAP() {
        this.noApText.setPosition(this.playerSprite.x, this.playerSprite.y - 20);
        this.noApText.setVisible(true);
        this.noApText.setAlpha(1);

        this.tweens.add({
            targets: this.noApText,
            y: this.noApText.y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => {
                this.noApText.setVisible(false);
            }
        });
    }

    tryMove(dx, dy) {
        if (this.gameOver || !this.playerTurn) return;

        if (this.player.ap < 1) {
            this.showNoAP();
            return;
        }

        const newX = this.player.x + dx;
        const newY = this.player.y + dy;

        // Check bounds
        if (newX < 0 || newX >= this.MAP_WIDTH || newY < 0 || newY >= this.MAP_HEIGHT) return;

        // Check wall
        if (this.map[newY][newX] === 1) return;

        // Check enemy collision
        const enemy = this.enemies.find(e => e.x === newX && e.y === newY && e.hp > 0);
        if (enemy) return;

        // Move player
        this.player.x = newX;
        this.player.y = newY;
        this.player.ap -= 1;

        // Update sprite
        this.playerSprite.setPosition(newX * this.TILE_SIZE + 16, newY * this.TILE_SIZE + 16);

        // Check loot pickup
        const lootItem = this.loot.find(l => l.x === newX && l.y === newY);
        if (lootItem) {
            this.pickupLoot(lootItem);
        }

        // Check extraction
        if (this.map[newY][newX] === 2) {
            this.extract();
            return;
        }

        // Update visibility
        this.updateVisibility();
        this.updateUI();

        // Check for auto end turn
        if (this.player.ap <= 0) {
            this.time.delayedCall(200, () => this.endTurn());
        }
    }

    attackEnemy(enemy) {
        if (this.gameOver || !this.playerTurn) return;

        const weapon = this.player.weapons[this.player.currentWeapon];

        if (this.player.ap < weapon.ap) {
            this.showNoAP();
            return;
        }

        // Check range
        const dist = Math.abs(enemy.x - this.player.x) + Math.abs(enemy.y - this.player.y);
        if (dist > weapon.range) {
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, 'Out of range!', '#ffaa00');
            return;
        }

        // Check ammo
        if (weapon.ammoType && weapon.ammo <= 0) {
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, 'No ammo!', '#ff4444');
            return;
        }

        // Spend AP
        this.player.ap -= weapon.ap;

        // Use ammo
        if (weapon.ammoType) {
            weapon.ammo--;
        }

        // Weapon durability
        weapon.currentDurability -= 2;
        if (weapon.currentDurability < 0) weapon.currentDurability = 0;

        // Check for jam
        if (weapon.currentDurability <= 0 && Math.random() < 0.5) {
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, 'JAMMED!', '#ff4444');
            this.updateUI();
            if (this.player.ap <= 0) {
                this.time.delayedCall(200, () => this.endTurn());
            }
            return;
        }

        // Calculate hit
        let accuracy = weapon.accuracy;
        const hit = Math.random() * 100 < accuracy;

        // Show bullet
        this.showBullet(
            this.player.x * this.TILE_SIZE + 16,
            this.player.y * this.TILE_SIZE + 16,
            enemy.x * this.TILE_SIZE + 16,
            enemy.y * this.TILE_SIZE + 16
        );

        if (hit) {
            const damage = Phaser.Math.Between(weapon.damage[0], weapon.damage[1]);
            enemy.hp -= damage;

            this.showFloatingText(enemy.sprite.x, enemy.sprite.y - 16, `-${damage}`, '#ff4444');

            // Flash enemy red
            enemy.sprite.setTint(0xff0000);
            this.time.delayedCall(100, () => enemy.sprite.clearTint());

            if (enemy.hp <= 0) {
                this.killEnemy(enemy);
            }

            // Alert enemy
            enemy.alerted = true;
        } else {
            this.showFloatingText(enemy.sprite.x, enemy.sprite.y - 16, 'MISS', '#888888');
        }

        this.updateUI();

        // Check for auto end turn
        if (this.player.ap <= 0) {
            this.time.delayedCall(300, () => this.endTurn());
        }
    }

    showBullet(fromX, fromY, toX, toY) {
        const bullet = this.add.image(fromX, fromY, 'bullet').setDepth(25);

        this.tweens.add({
            targets: bullet,
            x: toX,
            y: toY,
            duration: 100,
            onComplete: () => bullet.destroy()
        });
    }

    showFloatingText(x, y, text, color) {
        const txt = this.add.text(x, y, text, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: color,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: txt,
            y: y - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => txt.destroy()
        });
    }

    killEnemy(enemy) {
        enemy.sprite.destroy();
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }

        // Score
        this.player.score += 50;

        // Bloater explosion
        if (enemy.type === 'bloater') {
            this.explode(enemy.x, enemy.y, 2, 40);
        }
    }

    explode(x, y, radius, damage) {
        // Visual effect
        const explosion = this.add.circle(x * this.TILE_SIZE + 16, y * this.TILE_SIZE + 16, radius * this.TILE_SIZE, 0xff8800, 0.6).setDepth(30);
        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => explosion.destroy()
        });

        // Damage player if in range
        const playerDist = Math.abs(this.player.x - x) + Math.abs(this.player.y - y);
        if (playerDist <= radius) {
            this.player.hp -= damage;
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 16, `-${damage}`, '#ff4444');

            if (this.player.hp <= 0) {
                this.die();
            }
        }
    }

    reload() {
        if (this.gameOver || !this.playerTurn) return;

        if (this.player.ap < 1) {
            this.showNoAP();
            return;
        }

        const weapon = this.player.weapons[this.player.currentWeapon];

        if (!weapon.ammoType) {
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, 'No ammo needed', '#888888');
            return;
        }

        if (weapon.ammo >= weapon.maxAmmo) {
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, 'Full!', '#888888');
            return;
        }

        // Find ammo in inventory
        const ammoItem = this.player.inventory.find(i =>
            (i.type === 'ammo_9mm' && weapon.ammoType === '9mm') ||
            (i.type === 'ammo_12g' && weapon.ammoType === '12g')
        );

        if (!ammoItem || ammoItem.count <= 0) {
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, 'No ammo!', '#ff4444');
            return;
        }

        const needed = weapon.maxAmmo - weapon.ammo;
        const used = Math.min(needed, ammoItem.count);

        weapon.ammo += used;
        ammoItem.count -= used;
        this.player.ap -= 1;

        this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, 'Reloaded', '#44ff44');
        this.updateUI();

        if (this.player.ap <= 0) {
            this.time.delayedCall(200, () => this.endTurn());
        }
    }

    switchWeapon(index) {
        if (index < this.player.weapons.length) {
            this.player.currentWeapon = index;
            this.updateUI();
        }
    }

    useItem() {
        if (this.gameOver || !this.playerTurn) return;

        if (this.player.ap < 1) {
            this.showNoAP();
            return;
        }

        // Use bandage or medkit if hurt
        if (this.player.hp < this.player.maxHp) {
            const medkit = this.player.inventory.find(i => i.type === 'medkit' && i.count > 0);
            const bandage = this.player.inventory.find(i => i.type === 'bandage' && i.count > 0);

            if (medkit && medkit.count > 0) {
                medkit.count--;
                this.player.hp = Math.min(this.player.hp + 30, this.player.maxHp);
                this.player.ap -= 1;
                this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, '+30 HP', '#44ff44');
            } else if (bandage && bandage.count > 0) {
                bandage.count--;
                this.player.hp = Math.min(this.player.hp + 10, this.player.maxHp);
                this.player.bleeding = false;
                this.player.ap -= 1;
                this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, '+10 HP', '#44ff44');
            } else {
                this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, 'No items!', '#ff4444');
            }
        }

        this.updateUI();

        if (this.player.ap <= 0) {
            this.time.delayedCall(200, () => this.endTurn());
        }
    }

    pickupLoot(loot) {
        if (loot.type === 'weapon') {
            const weaponData = this.WEAPONS[loot.weapon];
            if (weaponData && this.player.weapons.length < 4) {
                this.player.weapons.push({
                    ...weaponData,
                    currentDurability: weaponData.durability,
                    ammo: Math.floor(weaponData.durability / 2),
                    maxAmmo: weaponData.durability
                });
                this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, `Found ${weaponData.name}!`, '#ffff44');
            }
        } else if (loot.type === 'ammo') {
            const ammoTypes = ['ammo_9mm', 'ammo_12g'];
            const type = ammoTypes[Phaser.Math.Between(0, 1)];
            const existing = this.player.inventory.find(i => i.type === type);
            if (existing) {
                existing.count += 12;
            } else {
                this.player.inventory.push({ type: type, name: type === 'ammo_9mm' ? '9mm Ammo' : '12g Shells', count: 12 });
            }
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, 'Found ammo!', '#ffff44');
        } else if (loot.type === 'medkit') {
            const existing = this.player.inventory.find(i => i.type === 'medkit');
            if (existing) {
                existing.count++;
            } else {
                this.player.inventory.push({ type: 'medkit', name: 'Medkit', count: 1 });
            }
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, 'Found Medkit!', '#44ff44');
        } else if (loot.type === 'bandage') {
            const existing = this.player.inventory.find(i => i.type === 'bandage');
            if (existing) {
                existing.count++;
            } else {
                this.player.inventory.push({ type: 'bandage', name: 'Bandage', count: 1 });
            }
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, 'Found Bandage!', '#44ff44');
        }

        this.player.score += 20;

        // Remove loot
        if (loot.sprite) loot.sprite.destroy();
        const index = this.loot.indexOf(loot);
        if (index > -1) this.loot.splice(index, 1);
    }

    endTurn() {
        if (this.gameOver || !this.playerTurn) return;

        this.playerTurn = false;

        // Show enemy turn indicator
        this.enemyTurnText.setVisible(true);

        // Enemy turns
        this.time.delayedCall(300, () => {
            this.processEnemyTurns();
        });
    }

    processEnemyTurns() {
        let delay = 0;

        this.enemies.forEach(enemy => {
            if (enemy.hp <= 0) return;

            const data = this.ENEMIES[enemy.type];

            // Check if player visible
            const canSee = this.canEnemySeePlayer(enemy);
            if (canSee) {
                enemy.alerted = true;
            }

            if (!enemy.alerted) return;

            // Enemy actions based on AP
            for (let ap = 0; ap < data.ap; ap++) {
                this.time.delayedCall(delay, () => {
                    this.enemyAction(enemy, data);
                });
                delay += 200;
            }
        });

        // End enemy turn
        this.time.delayedCall(delay + 300, () => {
            this.enemyTurnText.setVisible(false);
            this.startPlayerTurn();
        });
    }

    canEnemySeePlayer(enemy) {
        const dist = Math.abs(enemy.x - this.player.x) + Math.abs(enemy.y - this.player.y);
        if (dist > 8) return false;

        // Simple line of sight
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));

        for (let i = 1; i < steps; i++) {
            const x = Math.round(enemy.x + (dx * i) / steps);
            const y = Math.round(enemy.y + (dy * i) / steps);
            if (this.map[y][x] === 1) return false;
        }

        return true;
    }

    enemyAction(enemy, data) {
        if (enemy.hp <= 0) return;

        const dist = Math.abs(enemy.x - this.player.x) + Math.abs(enemy.y - this.player.y);

        // Melee enemy
        if (data.melee) {
            if (dist <= 1) {
                this.enemyAttackPlayer(enemy, data);
            } else {
                this.enemyMoveTowardPlayer(enemy);
            }
        } else {
            // Ranged enemy
            const weaponData = this.WEAPONS[data.weapon];
            if (weaponData && dist <= weaponData.range && this.canEnemySeePlayer(enemy)) {
                this.enemyAttackPlayer(enemy, data);
            } else {
                this.enemyMoveTowardPlayer(enemy);
            }
        }
    }

    enemyAttackPlayer(enemy, data) {
        // Flash enemy yellow (attacking)
        if (enemy.sprite) {
            enemy.sprite.setTint(0xffff00);
            this.time.delayedCall(200, () => {
                if (enemy.sprite) enemy.sprite.clearTint();
            });
        }

        // Calculate damage
        let damage;
        if (data.melee) {
            damage = Phaser.Math.Between(data.damage[0], data.damage[1]);
        } else {
            const weaponData = this.WEAPONS[data.weapon];
            damage = Phaser.Math.Between(weaponData.damage[0], weaponData.damage[1]);
        }

        // Roll accuracy
        const accuracy = data.melee ? 80 : this.WEAPONS[data.weapon].accuracy;
        if (Math.random() * 100 > accuracy) {
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 16, 'MISS', '#888888');
            return;
        }

        // Show bullet for ranged
        if (!data.melee && enemy.sprite) {
            this.showBullet(
                enemy.x * this.TILE_SIZE + 16,
                enemy.y * this.TILE_SIZE + 16,
                this.player.x * this.TILE_SIZE + 16,
                this.player.y * this.TILE_SIZE + 16
            );
        }

        // Apply damage
        this.player.hp -= damage;
        this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 16, `-${damage}`, '#ff4444');

        // Flash player red
        this.playerSprite.setTint(0xff0000);
        this.time.delayedCall(100, () => this.playerSprite.clearTint());

        if (this.player.hp <= 0) {
            this.die();
        }

        this.updateUI();
    }

    enemyMoveTowardPlayer(enemy) {
        if (enemy.hp <= 0) return;

        const dx = Math.sign(this.player.x - enemy.x);
        const dy = Math.sign(this.player.y - enemy.y);

        // Try to move toward player
        let moved = false;

        const tryMove = (nx, ny) => {
            if (moved) return;
            if (nx < 0 || nx >= this.MAP_WIDTH || ny < 0 || ny >= this.MAP_HEIGHT) return;
            if (this.map[ny][nx] === 1) return;
            if (nx === this.player.x && ny === this.player.y) return;
            if (this.enemies.some(e => e !== enemy && e.x === nx && e.y === ny && e.hp > 0)) return;

            enemy.x = nx;
            enemy.y = ny;
            if (enemy.sprite) {
                enemy.sprite.setPosition(nx * this.TILE_SIZE + 16, ny * this.TILE_SIZE + 16);
            }
            moved = true;
        };

        // Prioritize axis with larger distance
        if (Math.abs(this.player.x - enemy.x) > Math.abs(this.player.y - enemy.y)) {
            tryMove(enemy.x + dx, enemy.y);
            if (!moved) tryMove(enemy.x, enemy.y + dy);
        } else {
            tryMove(enemy.x, enemy.y + dy);
            if (!moved) tryMove(enemy.x + dx, enemy.y);
        }
    }

    startPlayerTurn() {
        this.turn++;
        this.corruption += 15;

        // Corruption effects
        this.processCorruption();

        // Bleeding damage
        if (this.player.bleeding) {
            this.player.hp -= 1;
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 16, '-1 (bleed)', '#ff4444');
        }

        // Reset player AP
        this.player.ap = this.player.maxAp;
        this.playerTurn = true;

        this.updateUI();
        this.updateVisibility();

        // Check death
        if (this.player.hp <= 0) {
            this.die();
        }
    }

    processCorruption() {
        // Spawn corrupted enemies at high corruption
        if (this.corruption >= 400 && this.turn % 5 === 0) {
            // Transform a human enemy to corrupted
            const humanEnemy = this.enemies.find(e => (e.type === 'guard' || e.type === 'soldier') && e.hp > 0);
            if (humanEnemy) {
                const newType = Math.random() < 0.5 ? 'possessed' : 'stalker';
                humanEnemy.type = newType;
                humanEnemy.hp = this.ENEMIES[newType].hp;
                humanEnemy.maxHp = this.ENEMIES[newType].hp;

                if (humanEnemy.sprite) {
                    humanEnemy.sprite.setTexture(this.ENEMIES[newType].texture);
                }

                if (this.visible[humanEnemy.y][humanEnemy.x]) {
                    this.showFloatingText(humanEnemy.sprite.x, humanEnemy.sprite.y - 16, 'TRANSFORMED!', '#ff44ff');
                }
            }
        }

        // Spawn bloater at very high corruption
        if (this.corruption >= 600 && this.turn % 8 === 0) {
            // Spawn at random visible position
            for (let attempts = 0; attempts < 10; attempts++) {
                const x = Phaser.Math.Between(1, this.MAP_WIDTH - 2);
                const y = Phaser.Math.Between(1, this.MAP_HEIGHT - 2);

                if (this.map[y][x] === 0 &&
                    !this.enemies.some(e => e.x === x && e.y === y) &&
                    !(x === this.player.x && y === this.player.y)) {

                    const newEnemy = {
                        x, y,
                        type: 'bloater',
                        hp: this.ENEMIES.bloater.hp,
                        maxHp: this.ENEMIES.bloater.hp,
                        ap: this.ENEMIES.bloater.ap,
                        alerted: true,
                        sprite: null
                    };

                    this.enemies.push(newEnemy);
                    newEnemy.sprite = this.add.image(
                        x * this.TILE_SIZE + 16,
                        y * this.TILE_SIZE + 16,
                        'bloater'
                    ).setDepth(9);
                    newEnemy.sprite.setInteractive();
                    newEnemy.sprite.enemy = newEnemy;

                    break;
                }
            }
        }

        // Visual corruption effects
        if (this.corruption >= 600) {
            this.cameras.main.setTint(0xff8888);
        } else if (this.corruption >= 400) {
            this.cameras.main.setTint(0xffaaaa);
        } else {
            this.cameras.main.clearTint();
        }
    }

    extract() {
        this.gameOver = true;

        // Calculate final score
        const finalScore = this.player.score + (100 - this.turn) + (100 - Math.floor(this.corruption / 10));

        // Check high score
        const highScore = localStorage.getItem('quasimorph_highscore') || 0;
        if (finalScore > highScore) {
            localStorage.setItem('quasimorph_highscore', finalScore);
        }

        // Show extraction message
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setDepth(200);

        this.add.text(400, 200, 'EXTRACTION SUCCESSFUL', {
            fontSize: '40px',
            fontFamily: 'monospace',
            color: '#44ff44'
        }).setOrigin(0.5).setDepth(201);

        this.add.text(400, 280, `Final Score: ${finalScore}`, {
            fontSize: '28px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(201);

        this.add.text(400, 340, `Turns: ${this.turn}  |  Corruption: ${this.corruption}`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(201);

        this.add.text(400, 450, 'Click to play again', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#888888'
        }).setOrigin(0.5).setDepth(201);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }

    die() {
        this.gameOver = true;
        this.cameras.main.clearTint();

        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setDepth(200);

        this.add.text(400, 200, 'MISSION FAILED', {
            fontSize: '48px',
            fontFamily: 'monospace',
            color: '#ff4444'
        }).setOrigin(0.5).setDepth(201);

        this.add.text(400, 280, 'Clone Lost - All Gear Lost', {
            fontSize: '24px',
            fontFamily: 'monospace',
            color: '#888888'
        }).setOrigin(0.5).setDepth(201);

        this.add.text(400, 340, `Turns Survived: ${this.turn}`, {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(201);

        this.add.text(400, 450, 'Click to try again', {
            fontSize: '20px',
            fontFamily: 'monospace',
            color: '#888888'
        }).setOrigin(0.5).setDepth(201);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }
}

// Phaser configuration - MUST be at end of file after all class definitions
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#0a0a12',
    scene: [BootScene, MenuScene, GameScene],
    pixelArt: true
};

const game = new Phaser.Game(config);
