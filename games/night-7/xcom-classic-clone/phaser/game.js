// X-COM Classic Clone
// Turn-based tactical strategy

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(w/2 - 160, h/2 - 25, 320, 50);

        this.add.text(w/2, h/2 - 50, 'LOADING TACTICAL DATA...', {
            fontSize: '18px',
            fill: '#44ff44'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x44ff44, 1);
            progressBar.fillRect(w/2 - 150, h/2 - 15, 300 * value, 30);
        });

        this.createTextures();
    }

    createTextures() {
        const TILE = 32;
        let g = this.make.graphics({ x: 0, y: 0, add: false });

        // Soldier
        g.fillStyle(0x4488cc);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x88bbff);
        g.fillRect(8, 6, 16, 10);
        g.fillStyle(0xffcc88);
        g.fillCircle(16, 8, 6);
        g.generateTexture('soldier', TILE, TILE);

        // Soldier selected
        g.clear();
        g.fillStyle(0x44cc44);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x88ff88);
        g.fillRect(8, 6, 16, 10);
        g.fillStyle(0xffcc88);
        g.fillCircle(16, 8, 6);
        g.generateTexture('soldier_selected', TILE, TILE);

        // Sectoid
        g.clear();
        g.fillStyle(0x666666);
        g.fillRect(6, 6, 20, 20);
        g.fillStyle(0x888888);
        g.fillCircle(16, 10, 8);
        g.fillStyle(0x000000);
        g.fillCircle(12, 9, 3);
        g.fillCircle(20, 9, 3);
        g.generateTexture('sectoid', TILE, TILE);

        // Floater
        g.clear();
        g.fillStyle(0x884444);
        g.fillRect(4, 8, 24, 20);
        g.fillStyle(0xaa6666);
        g.fillCircle(16, 12, 8);
        g.fillStyle(0x444488);
        g.fillRect(6, 20, 20, 8);
        g.generateTexture('floater', TILE, TILE);

        // Snakeman
        g.clear();
        g.fillStyle(0x228844);
        g.fillRect(8, 2, 16, 28);
        g.fillStyle(0x44aa66);
        g.fillCircle(16, 8, 8);
        g.fillStyle(0xff4444);
        g.fillCircle(12, 7, 2);
        g.fillCircle(20, 7, 2);
        g.generateTexture('snakeman', TILE, TILE);

        // Grass tile
        g.clear();
        g.fillStyle(0x224422);
        g.fillRect(0, 0, TILE, TILE);
        g.fillStyle(0x335533);
        for (let i = 0; i < 5; i++) {
            g.fillRect(Math.random() * 28, Math.random() * 28, 4, 4);
        }
        g.generateTexture('grass', TILE, TILE);

        // Dirt tile
        g.clear();
        g.fillStyle(0x443322);
        g.fillRect(0, 0, TILE, TILE);
        g.fillStyle(0x554433);
        for (let i = 0; i < 3; i++) {
            g.fillRect(Math.random() * 24 + 4, Math.random() * 24 + 4, 6, 6);
        }
        g.generateTexture('dirt', TILE, TILE);

        // Wall
        g.clear();
        g.fillStyle(0x444466);
        g.fillRect(0, 0, TILE, TILE);
        g.lineStyle(2, 0x555577);
        g.strokeRect(2, 2, TILE-4, TILE-4);
        g.generateTexture('wall', TILE, TILE);

        // Bush (partial cover)
        g.clear();
        g.fillStyle(0x224422);
        g.fillRect(0, 0, TILE, TILE);
        g.fillStyle(0x336633);
        g.fillCircle(16, 16, 12);
        g.fillStyle(0x448844);
        g.fillCircle(12, 12, 6);
        g.fillCircle(20, 18, 6);
        g.generateTexture('bush', TILE, TILE);

        // UFO debris
        g.clear();
        g.fillStyle(0x443322);
        g.fillRect(0, 0, TILE, TILE);
        g.fillStyle(0x666688);
        g.fillRect(4, 4, 24, 24);
        g.fillStyle(0x888899);
        g.fillRect(8, 8, 16, 16);
        g.generateTexture('ufo_debris', TILE, TILE);

        // Move indicator
        g.clear();
        g.fillStyle(0x44ff44);
        g.fillRect(4, 4, 24, 24);
        g.generateTexture('move_indicator', TILE, TILE);

        // Attack indicator
        g.clear();
        g.fillStyle(0xff4444);
        g.fillRect(4, 4, 24, 24);
        g.generateTexture('attack_indicator', TILE, TILE);

        // Bullet
        g.clear();
        g.fillStyle(0xffff44);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet', 8, 8);

        g.destroy();
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
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        this.add.rectangle(w/2, h/2, w, h, 0x0a0a12);

        this.add.text(w/2, h/3, 'X-COM', {
            fontSize: '64px',
            fill: '#44ff44',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(w/2, h/3 + 60, 'CLASSIC CLONE', {
            fontSize: '24px',
            fill: '#88ff88',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.add.text(w/2, h/2, 'UFO CRASH RECOVERY MISSION', {
            fontSize: '16px',
            fill: '#ffff44',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        const startBtn = this.add.text(w/2, h * 0.7, '[ PRESS SPACE TO DEPLOY ]', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setInteractive();

        this.tweens.add({
            targets: startBtn,
            alpha: 0.4,
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        this.add.text(w/2, h * 0.85, 'Click to select soldier | Right-click to move/attack | Tab to next unit | Space to end turn', {
            fontSize: '12px',
            fill: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });

        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.TILE = 32;
        this.MAP_W = 25;
        this.MAP_H = 20;

        this.turn = 'player'; // 'player' or 'alien'
        this.selectedUnit = null;
        this.gameOver = false;
        this.turnNumber = 1;

        // Create groups
        this.moveIndicators = this.add.group();
        this.bullets = this.physics.add.group();

        // Create map
        this.map = [];
        this.createMap();

        // Create units
        this.soldiers = [];
        this.aliens = [];
        this.createSoldiers();
        this.createAliens();

        // Fog of war
        this.fogGraphics = this.add.graphics();
        this.fogGraphics.setDepth(50);
        this.updateFog();

        // Input
        this.input.on('pointerdown', this.handleClick, this);
        this.input.keyboard.on('keydown-TAB', () => this.selectNextSoldier());
        this.input.keyboard.on('keydown-SPACE', () => this.endPlayerTurn());

        // UI
        this.createUI();

        // Select first soldier
        if (this.soldiers.length > 0) {
            this.selectUnit(this.soldiers[0]);
        }

        this.showMessage('MISSION: Kill all aliens. Click to select, right-click to move/attack.');
    }

    createMap() {
        // Ground layer
        for (let y = 0; y < this.MAP_H; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.MAP_W; x++) {
                const type = Math.random() < 0.7 ? 'grass' : 'dirt';
                this.add.image(x * this.TILE + this.TILE/2, y * this.TILE + this.TILE/2, type);
                this.map[y][x] = { type: 'ground', walkable: true, cover: 0 };
            }
        }

        // UFO crash site (center)
        const ufoCenterX = 12;
        const ufoCenterY = 10;
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                const x = ufoCenterX + dx;
                const y = ufoCenterY + dy;
                if (x >= 0 && x < this.MAP_W && y >= 0 && y < this.MAP_H) {
                    this.add.image(x * this.TILE + this.TILE/2, y * this.TILE + this.TILE/2, 'ufo_debris');
                    this.map[y][x] = { type: 'debris', walkable: true, cover: 0.3 };
                }
            }
        }

        // Walls (obstacles)
        const walls = [
            [5, 5], [5, 6], [5, 7],
            [19, 5], [19, 6], [19, 7],
            [5, 13], [5, 14], [5, 15],
            [19, 13], [19, 14], [19, 15],
            [10, 3], [11, 3], [13, 3], [14, 3],
            [10, 17], [11, 17], [13, 17], [14, 17]
        ];

        walls.forEach(([x, y]) => {
            const img = this.add.image(x * this.TILE + this.TILE/2, y * this.TILE + this.TILE/2, 'wall');
            img.setDepth(5);
            this.map[y][x] = { type: 'wall', walkable: false, cover: 1 };
        });

        // Bushes (partial cover)
        const bushes = [
            [3, 8], [3, 12], [21, 8], [21, 12],
            [8, 6], [16, 6], [8, 14], [16, 14],
            [7, 10], [17, 10]
        ];

        bushes.forEach(([x, y]) => {
            const img = this.add.image(x * this.TILE + this.TILE/2, y * this.TILE + this.TILE/2, 'bush');
            img.setDepth(4);
            this.map[y][x] = { type: 'bush', walkable: true, cover: 0.5 };
        });
    }

    createSoldiers() {
        const names = ['SGT. JOHNSON', 'CPL. SMITH', 'PFC. CHEN', 'PVT. GARCIA'];
        const positions = [[2, 2], [2, 17], [3, 9], [3, 11]];

        positions.forEach((pos, i) => {
            const soldier = this.createUnit(pos[0], pos[1], 'soldier', {
                name: names[i],
                hp: 30 + Math.floor(Math.random() * 20),
                maxHp: 50,
                tu: 55 + Math.floor(Math.random() * 10),
                maxTu: 65,
                accuracy: 50 + Math.floor(Math.random() * 30),
                reactions: 40 + Math.floor(Math.random() * 20),
                team: 'player',
                weapon: 'rifle',
                ammo: 20
            });
            this.soldiers.push(soldier);
        });
    }

    createAliens() {
        const alienTypes = [
            { type: 'sectoid', hp: 30, tu: 54, accuracy: 60, reactions: 63, damage: 25 },
            { type: 'floater', hp: 40, tu: 55, accuracy: 50, reactions: 50, damage: 30 },
            { type: 'snakeman', hp: 45, tu: 58, accuracy: 55, reactions: 45, damage: 28 }
        ];

        const positions = [
            [12, 10], [10, 9], [14, 9],
            [11, 11], [13, 11], [12, 8]
        ];

        positions.forEach((pos, i) => {
            const template = alienTypes[i % alienTypes.length];
            const alien = this.createUnit(pos[0], pos[1], template.type, {
                name: template.type.toUpperCase(),
                hp: template.hp,
                maxHp: template.hp,
                tu: template.tu,
                maxTu: template.tu,
                accuracy: template.accuracy,
                reactions: template.reactions,
                damage: template.damage,
                team: 'alien',
                visible: false
            });
            this.aliens.push(alien);
        });
    }

    createUnit(x, y, texture, data) {
        const sprite = this.add.sprite(x * this.TILE + this.TILE/2, y * this.TILE + this.TILE/2, texture);
        sprite.setDepth(10);
        sprite.setInteractive();

        sprite.gridX = x;
        sprite.gridY = y;
        sprite.data = data;
        sprite.data.currentTu = data.tu;

        return sprite;
    }

    createUI() {
        // Turn indicator
        this.turnText = this.add.text(10, 10, 'TURN 1 - PLAYER PHASE', {
            fontSize: '16px',
            fill: '#44ff44',
            fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(100);

        // Selected unit info
        this.unitInfoText = this.add.text(10, 35, '', {
            fontSize: '14px',
            fill: '#ffffff',
            fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(100);

        // Message box
        this.messageBox = this.add.rectangle(512, 730, 800, 40, 0x000000, 0.8).setScrollFactor(0).setDepth(100);
        this.messageText = this.add.text(512, 730, '', {
            fontSize: '14px',
            fill: '#ffff44',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // End turn button
        this.endTurnBtn = this.add.text(900, 10, '[ END TURN ]', {
            fontSize: '14px',
            fill: '#ff8844',
            fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(100).setInteractive();

        this.endTurnBtn.on('pointerdown', () => this.endPlayerTurn());
        this.endTurnBtn.on('pointerover', () => this.endTurnBtn.setFill('#ffaa66'));
        this.endTurnBtn.on('pointerout', () => this.endTurnBtn.setFill('#ff8844'));

        // Unit roster
        this.rosterText = this.add.text(750, 40, '', {
            fontSize: '12px',
            fill: '#88ff88',
            fontFamily: 'monospace'
        }).setScrollFactor(0).setDepth(100);

        this.updateRoster();
    }

    showMessage(text) {
        this.messageText.setText(text);
        this.time.delayedCall(3000, () => {
            if (this.messageText.text === text) {
                this.messageText.setText('');
            }
        });
    }

    updateRoster() {
        let roster = 'SQUAD:\n';
        this.soldiers.forEach((s, i) => {
            const status = s.active ? `HP:${s.data.hp} TU:${s.data.currentTu}` : 'KIA';
            const selected = s === this.selectedUnit ? '>' : ' ';
            roster += `${selected}${i+1}. ${s.data.name.substring(0, 10)} ${status}\n`;
        });
        this.rosterText.setText(roster);
    }

    handleClick(pointer) {
        if (this.gameOver || this.turn !== 'player') return;

        const gridX = Math.floor(pointer.worldX / this.TILE);
        const gridY = Math.floor(pointer.worldY / this.TILE);

        if (gridX < 0 || gridX >= this.MAP_W || gridY < 0 || gridY >= this.MAP_H) return;

        if (pointer.rightButtonDown()) {
            // Right click - move or attack
            if (this.selectedUnit) {
                // Check for alien at target
                const targetAlien = this.aliens.find(a => a.active && a.gridX === gridX && a.gridY === gridY && a.data.visible);

                if (targetAlien) {
                    this.attackUnit(this.selectedUnit, targetAlien);
                } else if (this.map[gridY][gridX].walkable) {
                    this.moveUnit(this.selectedUnit, gridX, gridY);
                }
            }
        } else {
            // Left click - select
            const clickedSoldier = this.soldiers.find(s => s.active && s.gridX === gridX && s.gridY === gridY);
            if (clickedSoldier) {
                this.selectUnit(clickedSoldier);
            }
        }
    }

    selectUnit(unit) {
        // Deselect previous
        if (this.selectedUnit) {
            this.selectedUnit.setTexture('soldier');
        }

        this.selectedUnit = unit;
        unit.setTexture('soldier_selected');

        this.updateUnitInfo();
        this.showMoveIndicators();
        this.updateRoster();
    }

    selectNextSoldier() {
        if (this.soldiers.length === 0) return;

        const activeSoldiers = this.soldiers.filter(s => s.active);
        if (activeSoldiers.length === 0) return;

        const currentIndex = activeSoldiers.indexOf(this.selectedUnit);
        const nextIndex = (currentIndex + 1) % activeSoldiers.length;
        this.selectUnit(activeSoldiers[nextIndex]);
    }

    updateUnitInfo() {
        if (!this.selectedUnit) {
            this.unitInfoText.setText('');
            return;
        }

        const d = this.selectedUnit.data;
        this.unitInfoText.setText(
            `${d.name}\nHP: ${d.hp}/${d.maxHp}  TU: ${d.currentTu}/${d.maxTu}\n` +
            `Accuracy: ${d.accuracy}%  Weapon: ${d.weapon || 'Plasma'}\n` +
            `Snap: 25TU | Aimed: 50TU`
        );
    }

    showMoveIndicators() {
        this.moveIndicators.clear(true, true);

        if (!this.selectedUnit || this.selectedUnit.data.currentTu < 4) return;

        const unit = this.selectedUnit;
        const maxDist = Math.floor(unit.data.currentTu / 4);

        for (let dy = -maxDist; dy <= maxDist; dy++) {
            for (let dx = -maxDist; dx <= maxDist; dx++) {
                const x = unit.gridX + dx;
                const y = unit.gridY + dy;

                if (x < 0 || x >= this.MAP_W || y < 0 || y >= this.MAP_H) continue;
                if (!this.map[y][x].walkable) continue;
                if (this.isOccupied(x, y)) continue;

                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist * 4 > unit.data.currentTu) continue;

                const indicator = this.add.image(
                    x * this.TILE + this.TILE/2,
                    y * this.TILE + this.TILE/2,
                    'move_indicator'
                );
                indicator.setAlpha(0.3);
                indicator.setDepth(1);
                this.moveIndicators.add(indicator);
            }
        }
    }

    isOccupied(x, y) {
        const soldierThere = this.soldiers.find(s => s.active && s.gridX === x && s.gridY === y);
        const alienThere = this.aliens.find(a => a.active && a.gridX === x && a.gridY === y);
        return soldierThere || alienThere;
    }

    moveUnit(unit, targetX, targetY) {
        const dist = Math.abs(targetX - unit.gridX) + Math.abs(targetY - unit.gridY);
        const tuCost = dist * 4;

        if (tuCost > unit.data.currentTu) {
            this.showMessage('Not enough TU to move there!');
            return;
        }

        // Check for reaction fire from aliens
        this.checkReactionFire(unit, targetX, targetY);

        unit.data.currentTu -= tuCost;
        unit.gridX = targetX;
        unit.gridY = targetY;

        this.tweens.add({
            targets: unit,
            x: targetX * this.TILE + this.TILE/2,
            y: targetY * this.TILE + this.TILE/2,
            duration: 200 * dist,
            onComplete: () => {
                this.updateFog();
                this.updateUnitInfo();
                this.showMoveIndicators();
                this.updateRoster();
            }
        });
    }

    attackUnit(attacker, target) {
        const isSnap = true; // For simplicity, always snap shot
        const tuCost = Math.floor(attacker.data.maxTu * (isSnap ? 0.25 : 0.5));

        if (attacker.data.currentTu < tuCost) {
            this.showMessage('Not enough TU to shoot!');
            return;
        }

        attacker.data.currentTu -= tuCost;

        // Calculate hit chance
        const dist = Math.sqrt(
            Math.pow(target.gridX - attacker.gridX, 2) +
            Math.pow(target.gridY - attacker.gridY, 2)
        );
        const baseAccuracy = attacker.data.accuracy;
        const rangePenalty = Math.max(0, (dist - 5) * 2);
        const coverBonus = this.map[target.gridY][target.gridX].cover * 30;
        const hitChance = Math.max(10, baseAccuracy - rangePenalty - coverBonus);

        // Animate bullet
        const bullet = this.bullets.create(
            attacker.x, attacker.y, 'bullet'
        );

        const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, target.x, target.y);
        const hit = Math.random() * 100 < hitChance;

        // Add some spread if miss
        let finalX = target.x;
        let finalY = target.y;
        if (!hit) {
            const spread = 50;
            finalX += (Math.random() - 0.5) * spread;
            finalY += (Math.random() - 0.5) * spread;
        }

        this.tweens.add({
            targets: bullet,
            x: finalX,
            y: finalY,
            duration: 150,
            onComplete: () => {
                bullet.destroy();

                if (hit) {
                    const damage = attacker.data.team === 'player' ?
                        20 + Math.floor(Math.random() * 20) :
                        target.data.damage || 20;

                    target.data.hp -= damage;
                    this.showMessage(`HIT! ${damage} damage to ${target.data.name}`);

                    // Flash target
                    this.tweens.add({
                        targets: target,
                        alpha: 0.2,
                        duration: 100,
                        yoyo: true,
                        repeat: 2
                    });

                    if (target.data.hp <= 0) {
                        this.killUnit(target);
                    }
                } else {
                    this.showMessage('MISS!');
                }

                this.updateUnitInfo();
                this.updateRoster();
                this.showMoveIndicators();
            }
        });
    }

    killUnit(unit) {
        unit.active = false;
        unit.setVisible(false);

        if (unit.data.team === 'player') {
            this.showMessage(`${unit.data.name} is KIA!`);
            this.checkGameOver();
        } else {
            this.showMessage(`${unit.data.name} eliminated!`);
            this.checkVictory();
        }

        this.updateRoster();
    }

    checkReactionFire(movingUnit, targetX, targetY) {
        const enemies = movingUnit.data.team === 'player' ? this.aliens : this.soldiers;

        enemies.forEach(enemy => {
            if (!enemy.active || enemy.data.currentTu < 15) return;
            if (!this.hasLineOfSight(enemy.gridX, enemy.gridY, movingUnit.gridX, movingUnit.gridY)) return;

            // Reaction check
            const reactionChance = (enemy.data.reactions / 100) * 0.5;
            if (Math.random() < reactionChance) {
                this.showMessage(`${enemy.data.name} reaction fire!`);
                enemy.data.currentTu -= 15;

                // Simplified reaction shot
                const hitChance = enemy.data.accuracy * 0.6; // Reduced accuracy for reaction
                if (Math.random() * 100 < hitChance) {
                    const damage = 15 + Math.floor(Math.random() * 15);
                    movingUnit.data.hp -= damage;
                    this.showMessage(`Reaction hit! ${damage} damage!`);

                    if (movingUnit.data.hp <= 0) {
                        this.killUnit(movingUnit);
                    }
                }
            }
        });
    }

    hasLineOfSight(x1, y1, x2, y2) {
        // Simple Bresenham line check
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;

        let x = x1;
        let y = y1;

        while (x !== x2 || y !== y2) {
            if (this.map[y] && this.map[y][x] && !this.map[y][x].walkable) {
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

    updateFog() {
        this.fogGraphics.clear();

        // Reset all aliens visibility
        this.aliens.forEach(a => {
            a.data.visible = false;
            a.setVisible(false);
        });

        // Check visibility from each soldier
        this.soldiers.forEach(soldier => {
            if (!soldier.active) return;

            this.aliens.forEach(alien => {
                if (!alien.active) return;

                const dist = Math.sqrt(
                    Math.pow(alien.gridX - soldier.gridX, 2) +
                    Math.pow(alien.gridY - soldier.gridY, 2)
                );

                if (dist <= 10 && this.hasLineOfSight(soldier.gridX, soldier.gridY, alien.gridX, alien.gridY)) {
                    alien.data.visible = true;
                    alien.setVisible(true);
                }
            });
        });

        // Draw fog over unseen areas (simplified - just dim distant areas)
        this.fogGraphics.fillStyle(0x000000, 0.5);

        for (let y = 0; y < this.MAP_H; y++) {
            for (let x = 0; x < this.MAP_W; x++) {
                let visible = false;
                this.soldiers.forEach(s => {
                    if (!s.active) return;
                    const dist = Math.sqrt(Math.pow(x - s.gridX, 2) + Math.pow(y - s.gridY, 2));
                    if (dist <= 8 && this.hasLineOfSight(s.gridX, s.gridY, x, y)) {
                        visible = true;
                    }
                });

                if (!visible) {
                    this.fogGraphics.fillRect(x * this.TILE, y * this.TILE, this.TILE, this.TILE);
                }
            }
        }
    }

    endPlayerTurn() {
        if (this.turn !== 'player' || this.gameOver) return;

        this.turn = 'alien';
        this.turnText.setText(`TURN ${this.turnNumber} - ALIEN PHASE`);
        this.turnText.setFill('#ff4444');

        // Hide move indicators
        this.moveIndicators.clear(true, true);

        // Alien turn
        this.time.delayedCall(500, () => this.processAlienTurn());
    }

    processAlienTurn() {
        // Restore alien TU
        this.aliens.forEach(a => {
            if (a.active) a.data.currentTu = a.data.maxTu;
        });

        let delay = 0;
        const activeAliens = this.aliens.filter(a => a.active);

        activeAliens.forEach((alien, i) => {
            this.time.delayedCall(delay, () => {
                this.alienAct(alien);
            });
            delay += 800;
        });

        // End alien turn
        this.time.delayedCall(delay + 500, () => {
            this.startPlayerTurn();
        });
    }

    alienAct(alien) {
        if (!alien.active || this.gameOver) return;

        // Find closest visible soldier
        let closestSoldier = null;
        let closestDist = Infinity;

        this.soldiers.forEach(soldier => {
            if (!soldier.active) return;

            const dist = Math.sqrt(
                Math.pow(soldier.gridX - alien.gridX, 2) +
                Math.pow(soldier.gridY - alien.gridY, 2)
            );

            if (dist < closestDist && this.hasLineOfSight(alien.gridX, alien.gridY, soldier.gridX, soldier.gridY)) {
                closestDist = dist;
                closestSoldier = soldier;
            }
        });

        if (closestSoldier) {
            if (closestDist <= 8) {
                // In range - shoot
                if (alien.data.currentTu >= 15) {
                    this.attackUnit(alien, closestSoldier);
                }
            } else {
                // Move closer
                const dx = Math.sign(closestSoldier.gridX - alien.gridX);
                const dy = Math.sign(closestSoldier.gridY - alien.gridY);
                const newX = alien.gridX + dx * 2;
                const newY = alien.gridY + dy * 2;

                if (newX >= 0 && newX < this.MAP_W && newY >= 0 && newY < this.MAP_H &&
                    this.map[newY][newX].walkable && !this.isOccupied(newX, newY)) {
                    this.moveAlien(alien, newX, newY);
                }
            }
        } else {
            // Random patrol
            const dx = Phaser.Math.Between(-2, 2);
            const dy = Phaser.Math.Between(-2, 2);
            const newX = Phaser.Math.Clamp(alien.gridX + dx, 1, this.MAP_W - 2);
            const newY = Phaser.Math.Clamp(alien.gridY + dy, 1, this.MAP_H - 2);

            if (this.map[newY][newX].walkable && !this.isOccupied(newX, newY)) {
                this.moveAlien(alien, newX, newY);
            }
        }
    }

    moveAlien(alien, x, y) {
        const dist = Math.abs(x - alien.gridX) + Math.abs(y - alien.gridY);
        const tuCost = dist * 4;

        if (tuCost > alien.data.currentTu) return;

        alien.data.currentTu -= tuCost;
        alien.gridX = x;
        alien.gridY = y;

        this.tweens.add({
            targets: alien,
            x: x * this.TILE + this.TILE/2,
            y: y * this.TILE + this.TILE/2,
            duration: 200
        });
    }

    startPlayerTurn() {
        this.turn = 'player';
        this.turnNumber++;
        this.turnText.setText(`TURN ${this.turnNumber} - PLAYER PHASE`);
        this.turnText.setFill('#44ff44');

        // Restore soldier TU
        this.soldiers.forEach(s => {
            if (s.active) s.data.currentTu = s.data.maxTu;
        });

        this.updateFog();
        this.updateRoster();
        this.showMoveIndicators();

        this.showMessage('Your turn! Move and attack.');
    }

    checkVictory() {
        const aliensAlive = this.aliens.filter(a => a.active).length;
        if (aliensAlive === 0) {
            this.gameOver = true;
            this.showVictory();
        }
    }

    checkGameOver() {
        const soldiersAlive = this.soldiers.filter(s => s.active).length;
        if (soldiersAlive === 0) {
            this.gameOver = true;
            this.showDefeat();
        }
    }

    showVictory() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.85).setScrollFactor(0).setDepth(200);

        this.add.text(w/2, h/3, 'MISSION COMPLETE', {
            fontSize: '48px',
            fill: '#44ff44',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        const survivors = this.soldiers.filter(s => s.active).length;
        this.add.text(w/2, h/2, `All aliens eliminated!\n${survivors}/4 soldiers survived.\nTurns: ${this.turnNumber}`, {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h * 0.75, '[ PRESS SPACE FOR NEW MISSION ]', {
            fontSize: '18px',
            fill: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    }

    showDefeat() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.85).setScrollFactor(0).setDepth(200);

        this.add.text(w/2, h/3, 'MISSION FAILED', {
            fontSize: '48px',
            fill: '#ff4444',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h/2, 'All soldiers KIA.\nThe aliens remain in control.', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.add.text(w/2, h * 0.75, '[ PRESS SPACE TO TRY AGAIN ]', {
            fontSize: '18px',
            fill: '#888888',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.restart();
        });
    }
}

// Phaser config - MUST be at end of file
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    backgroundColor: '#0a0a12',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene]
};

const game = new Phaser.Game(config);
