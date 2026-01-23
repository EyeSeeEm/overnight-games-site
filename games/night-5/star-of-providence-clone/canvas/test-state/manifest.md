# Test Manifest - Star of Providence Clone

## Core Systems

### 1. Player Movement
- [ ] 8-directional movement at 250px/s
- [ ] Focus mode reduces speed to 100px/s
- [ ] Diagonal movement normalized (0.7071 factor)
- [ ] Player clamped to room bounds
- [ ] Dash covers 120px in 0.1s
- [ ] Dash cooldown 0.5s
- [ ] Dash i-frames last 0.15s
- [ ] Cannot dash while on cooldown

### 2. Shooting System
- [ ] Peashooter fires at 10 shots/sec, infinite ammo
- [ ] Vulcan fires at 7.5 shots/sec, 500 max ammo
- [ ] Laser is hitscan, pierces, 1.5 shots/sec
- [ ] Fireball has explosion radius, leaves trail
- [ ] Sword has melee cone + projectile
- [ ] Revolver has 6-shot clip with reload
- [ ] Ammo depletes on non-peashooter weapons
- [ ] Auto-switch to peashooter when ammo empty
- [ ] Projectile velocity matches weapon config
- [ ] Projectile damage matches weapon config

### 3. Weapon Keywords
- [ ] Homing projectiles track nearest enemy
- [ ] Triple fires 3 projectiles at -15/0/+15 degrees
- [ ] High-Caliber: 3.5x damage, slower fire rate
- [ ] Gatling: 0.5x damage, faster fire rate
- [ ] Freeze: slows enemies on hit
- [ ] Chain Lightning: arcs to nearby enemies
- [ ] Phasing: passes through walls
- [ ] Multiple keywords stack correctly

### 4. Health System
- [ ] Starting HP is 4 hearts
- [ ] Max HP capped at 12
- [ ] Shields absorb damage before HP
- [ ] 1 second invincibility after taking damage
- [ ] Visual flash during invincibility
- [ ] Game over triggers at 0 HP
- [ ] Autobomb activates on hit (if upgrade owned + 3+ bombs)
- [ ] HP parts (4) combine into max HP increase

### 5. Bomb System
- [ ] Starting bombs: 2
- [ ] Max bombs: 6
- [ ] Bomb clears all enemy bullets
- [ ] Bomb damages all enemies in room
- [ ] Bomb grants brief invincibility
- [ ] Bombs recharge every 3 rooms cleared

### 6. Multiplier System
- [ ] Starts at 1.0x
- [ ] +0.05 per kill (below 2.5x)
- [ ] +0.01 per kill (above 2.5x threshold)
- [ ] Caps at 3.0x
- [ ] -1.0x on taking damage
- [ ] -0.5x on autobomb trigger
- [ ] Affects debris pickup values
- [ ] Affects Magic cartridge thresholds

### 7. Enemy AI & Combat
- [ ] Ghost: chases player, revenge bullet on death
- [ ] Drone: dashes to player, fires spread
- [ ] Turret: stationary, burst fire
- [ ] Seeker: wanders, fires from tips
- [ ] Reaper: teleports, fires when visible
- [ ] Bumper: bounces, pushable by bullets
- [ ] Pyromancer: fireball with trail
- [ ] Cryomancer: icicle drops
- [ ] Necromancer: ring attack, resurrects ghosts
- [ ] Enemies spawn on room entry
- [ ] Enemies activate with delay (stealth affects this)
- [ ] Enemy bullets damage player
- [ ] Player bullets damage enemies
- [ ] Debris spawns on enemy death
- [ ] Room clears when all enemies dead

### 8. Boss System
- [ ] Chamberlord: phase at 33% HP, spawns Chamberheads
- [ ] Guardian: mace smash, helmet burst patterns
- [ ] Grinder: charge attack, spawns saws
- [ ] Ringleader: ghost summoning, rotating ring
- [ ] Boss health bar displays
- [ ] Phase transitions trigger at HP thresholds
- [ ] Boss reward choice appears on death
- [ ] Floor exit portal spawns after reward chosen

### 9. Floor Generation
- [ ] Floor 1: 12-16 rooms, 1 miniboss
- [ ] Floor 2: 16-22 rooms, 2 minibosses
- [ ] Guaranteed rooms: shop, upgrade terminal, weapon trove
- [ ] Start room connects to main path
- [ ] Boss room at end of main path
- [ ] Side rooms branch off main path
- [ ] Doors lock in miniboss/boss rooms until cleared
- [ ] Secret walls detectable with bombs

### 10. Room Types
- [ ] Normal: 4-8 enemies, pickup chance
- [ ] Miniboss: single miniboss, reward on clear
- [ ] Boss: floor boss, reward choice
- [ ] Shop: 4 items for purchase (5 with Member Card)
- [ ] Upgrade Terminal: 3 choices (4 with Plug)
- [ ] Weapon Trove: 1-3 weapons with keywords
- [ ] Vault: requires key, high-quality items
- [ ] Shrine: trade offer
- [ ] Secret: hidden, bonus pickups

### 11. Shop System
- [ ] 4 item slots default
- [ ] Items have debris cost
- [ ] Discount upgrade reduces prices 34%
- [ ] Purchase removes item from shop
- [ ] Cannot purchase without enough debris
- [ ] Shop persists until floor exit

### 12. Upgrade System
- [ ] Terminal shows 3 random upgrades
- [ ] Only one upgrade can be selected
- [ ] Terminal becomes inactive after selection
- [ ] Upgrades apply permanent effects
- [ ] Ship-excluded upgrades don't appear

### 13. Cartridge System
- [ ] Cartridges stack effects
- [ ] Max 4 cartridges per run
- [ ] Expansion Port grants +2 cartridge choices
- [ ] Cartridge pickup shows name and description
- [ ] Rarity affects drop rates

### 14. Blessing System
- [ ] Only one blessing active at a time
- [ ] New blessing replaces old
- [ ] Flame: fire trail behind ship
- [ ] Frost: slowing aura
- [ ] Earth: orbiting rocks
- [ ] Storm: lightning strikes
- [ ] Sight: reveals map
- [ ] Abyss: void bullets
- [ ] Enigma: random effect per room

### 15. Difficulty System
- [ ] Mild: 75% enemy HP/damage
- [ ] Normal: 100% baseline
- [ ] Intense: 125% HP, 150% damage
- [ ] Sudden Death: one-hit kills
- [ ] Bullet speed scales with difficulty
- [ ] Bullet density scales with difficulty

### 16. Ship Variants
- [ ] Standard: baseline stats
- [ ] Tank: more HP, slower
- [ ] Speedster: faster, less HP
- [ ] Bomber: more bombs
- [ ] Glass Cannon: high damage, low HP
- [ ] Vampire: heal on kills
- [ ] Rogue: better dash

### 17. UI/HUD
- [ ] HP hearts display correctly
- [ ] Shield icons display correctly
- [ ] Bomb count visible
- [ ] Current weapon name shown
- [ ] Ammo bar reflects ammo percentage
- [ ] Debris counter updates on pickup
- [ ] Multiplier display with color coding
- [ ] Floor number shown
- [ ] Minimap functional
- [ ] Pause menu accessible

### 18. Audio (if implemented)
- [ ] Shooting sounds play
- [ ] Hit sounds on damage
- [ ] Death sounds for enemies
- [ ] Boss music triggers
- [ ] Floor theme music changes
- [ ] UI interaction sounds

## Regression Checklist

After each iteration, verify:
1. [ ] Game starts without errors
2. [ ] Player can move in all 8 directions
3. [ ] Player can shoot
4. [ ] Player can dash
5. [ ] Enemies spawn and can be killed
6. [ ] Debris drops and can be collected
7. [ ] Doors work for room transitions
8. [ ] Game over triggers correctly
9. [ ] At least one boss is defeatable
10. [ ] Floor progression works
