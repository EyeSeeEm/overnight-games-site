# Testable Features Manifest - Enter the Gungeon Clone

## Core Systems

### 1. Player Movement System
- **Feature:** 8-directional movement with WASD
- **Test:** Verify movement in all directions
- **Expected:** Smooth movement at 7 units/sec (120 pixels/sec)
- **Status:** Implemented

### 2. Dodge Roll System
- **Feature:** Space key triggers dodge roll
- **Test:** Roll through enemy bullets
- **Expected:**
  - Duration: 0.5s total
  - I-frames: 0.25s (first half)
  - Distance: ~4 tiles
  - Contact damage: 3 to enemies
- **Status:** Implemented

### 3. Shooting System
- **Feature:** Mouse aiming, click to fire
- **Test:** Fire at various angles
- **Expected:**
  - Bullets travel toward cursor
  - Weapon-specific fire rate
  - Reload mechanic works
- **Status:** Implemented

### 4. Weapon Switching
- **Feature:** Scroll wheel or number keys
- **Test:** Switch between equipped weapons
- **Expected:**
  - Current weapon changes
  - Ammo tracked per weapon
  - Starter guns have infinite ammo
- **Status:** Implemented

### 5. Blank System
- **Feature:** Q key clears all bullets
- **Test:** Use blank during bullet storm
- **Expected:**
  - All enemy bullets cleared
  - Brief invulnerability (1.0s)
  - Enemies knocked back and stunned
  - Blank count decremented
- **Status:** Implemented

## Combat Systems

### 6. Enemy AI - Basic
- **Feature:** Bullet Kin behavior
- **Test:** Spawn bullet kin, observe AI
- **Expected:**
  - Moves toward player at preferred range
  - Fires single bullet at player
  - Dies at 0 HP
- **Status:** Implemented

### 7. Enemy AI - Strafe
- **Feature:** Shotgun Kin behavior
- **Test:** Spawn shotgun kin, observe AI
- **Expected:**
  - Moves perpendicular to player
  - Fires spread patterns
- **Status:** Implemented

### 8. Enemy Bullet Patterns
- **Feature:** Various bullet patterns (single, spread, ring, spiral)
- **Test:** Observe different enemy types
- **Expected:**
  - Patterns match enemy data
  - Bullets are dodgeable
- **Status:** Implemented (single, spread3, spread6, spread8, cardinal, spiral, homing, bounce, grenade)

### 9. Boss System
- **Feature:** Floor boss encounters
- **Test:** Reach boss room, fight boss
- **Expected:**
  - Boss spawns in boss room
  - Multiple attack patterns per phase
  - Phase transitions at HP thresholds
  - Drops rewards on death
- **Status:** Implemented (Bullet King, Gatling Gull, Beholster)

### 10. Boss Patterns - Bullet King
- **Feature:** Floor 1 boss attacks
- **Test:** Fight Bullet King
- **Expected:**
  - Throne spin (slow/fast)
  - Spread volley
  - Bullet burst
  - Rain of bullets
- **Status:** Implemented

## Room/Floor Systems

### 11. Room Generation
- **Feature:** Procedurally generated floors
- **Test:** Generate new floor
- **Expected:**
  - 10-15 rooms per floor
  - Required rooms: entrance, boss, elevator, shop, treasure
  - Combat rooms fill the rest
- **Status:** Implemented

### 12. Room Clearing
- **Feature:** Doors lock during combat
- **Test:** Enter combat room
- **Expected:**
  - Doors lock when enemies present
  - Doors unlock when all enemies dead
  - Room marked as cleared
- **Status:** Implemented

### 13. Room Transitions
- **Feature:** Move between rooms via doors
- **Test:** Walk through open door
- **Expected:**
  - Room loads with appropriate content
  - Player spawns at correct position
  - Cleared rooms stay cleared
- **Status:** Implemented

### 14. Obstacle System
- **Feature:** Cover objects in rooms
- **Test:** Interact with obstacles
- **Expected:**
  - Pillars block movement and bullets
  - Crates are destructible
  - Barrels explode when shot
  - Tables can be flipped for cover
- **Status:** Implemented

## Pickup Systems

### 15. Health Pickups
- **Feature:** Heart drops restore HP
- **Test:** Collect heart when damaged
- **Expected:**
  - HP increases (up to max)
  - Pickup disappears
- **Status:** Implemented

### 16. Ammo Pickups
- **Feature:** Ammo boxes refill weapons
- **Test:** Collect ammo with low ammo weapon
- **Expected:**
  - Brown: 20% current gun
  - Green: 10% all guns
- **Status:** Implemented

### 17. Shell Currency
- **Feature:** Enemy drops and shop currency
- **Test:** Kill enemies, collect shells
- **Expected:**
  - Enemies drop 1-3 shells
  - Shop items cost shells
- **Status:** Implemented

### 18. Key System
- **Feature:** Keys open locked chests
- **Test:** Use key on locked chest
- **Expected:**
  - Key consumed
  - Chest opens
  - Loot spawns
- **Status:** Implemented

## Chest System

### 19. Chest Tiers
- **Feature:** Different quality chests
- **Test:** Open chests of each tier
- **Expected:**
  - D (Brown): Common items
  - C (Blue): Uncommon items
  - B (Green): Rare items
  - Higher tiers always locked
- **Status:** Implemented (D, C, B tiers)

### 20. Chest Contents
- **Feature:** Weapons or items from chests
- **Test:** Open multiple chests
- **Expected:**
  - Quality matches chest tier
  - Items apply effects correctly
  - Weapons add to inventory
- **Status:** Implemented

## Shop System

### 21. Shop Room
- **Feature:** Buy items with shells
- **Test:** Enter shop, purchase item
- **Expected:**
  - Items displayed with prices
  - Shells deducted on purchase
  - Item added to inventory
- **Status:** Implemented

## Item System

### 22. Passive Items
- **Feature:** Always-active effects
- **Test:** Collect passive item
- **Expected:**
  - +1 Bullets: +25% damage
  - Bouncy Bullets: Bullets bounce
  - Scope: 50% less spread
  - Armor: Block next hit
- **Status:** Implemented

### 23. Active Items
- **Feature:** Charged abilities
- **Test:** Collect and use active item
- **Expected:**
  - Cooldown charges via damage dealt
  - Effect triggers on E key
  - Medkit: Heal 2 hearts
  - Bomb: Area damage
- **Status:** Implemented

## Visual Effects

### 24. Screen Shake
- **Feature:** Camera shake on impacts
- **Test:** Take damage, kill enemies
- **Expected:**
  - Shake on player damage
  - Shake on explosions
  - Intensity varies by event
- **Status:** Implemented

### 25. Damage Flash
- **Feature:** Red flash when hit
- **Test:** Take damage
- **Expected:**
  - Screen flashes red
  - Fades over ~0.2s
  - Vignette effect
- **Status:** Implemented

### 26. Hit Markers
- **Feature:** X markers on hits
- **Test:** Hit enemy
- **Expected:**
  - White X on hit
  - Red X on kill
  - Fades out quickly
- **Status:** Implemented

### 27. Particle System
- **Feature:** Various particle effects
- **Test:** Observe combat
- **Expected:**
  - Muzzle flash on firing
  - Bullet impact sparks
  - Death particles
  - Shell casings
  - Blank wave
- **Status:** Implemented

## UI Elements

### 28. Health Display
- **Feature:** Heart icons for HP
- **Test:** Observe UI during play
- **Expected:**
  - Full/half/empty hearts
  - Updates on damage/heal
- **Status:** Implemented

### 29. Weapon/Ammo Display
- **Feature:** Current gun and ammo count
- **Test:** Observe UI, switch weapons
- **Expected:**
  - Shows current weapon name
  - Magazine/total ammo displayed
  - Updates on fire/reload
- **Status:** Implemented

### 30. Resource Display
- **Feature:** Blanks, keys, shells shown
- **Test:** Observe UI
- **Expected:**
  - Blank count visible
  - Key count visible
  - Shell currency visible
- **Status:** Implemented

### 31. Minimap
- **Feature:** Floor map display
- **Test:** Explore floor
- **Expected:**
  - Shows room layout
  - Current room highlighted
  - Visited rooms shown
- **Status:** Implemented

## Debug Commands Required

| Command | Purpose | Arguments |
|---------|---------|-----------|
| `gotoRoom(index)` | Jump to specific room | Room index |
| `gotoFloor(num)` | Jump to floor | Floor number 1-5 |
| `setHealth(hp)` | Set player HP | HP value |
| `spawnEnemy(type)` | Spawn enemy at player | Enemy type string |
| `clearEnemies()` | Remove all enemies | None |
| `getState()` | Get full game state | None |
| `setPosition(x, y)` | Move player | X, Y coords |
| `giveWeapon(name)` | Add weapon to inventory | Weapon key |
| `giveItem(name)` | Add item to inventory | Item key |
| `setBlanks(count)` | Set blank count | Number |
| `setKeys(count)` | Set key count | Number |
| `setShells(count)` | Set shell currency | Number |
