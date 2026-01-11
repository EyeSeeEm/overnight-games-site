# Implemented Features: Binding of Isaac Clone (Canvas)

## Core Mechanics
- [x] Twin-stick controls (WASD movement)
- [x] Arrow key shooting (cardinal directions)
- [x] 8-directional movement
- [x] Diagonal speed normalization
- [x] Tear physics with arc trajectory
- [x] Fire rate based on tear delay stat
- [x] Auto-aim assist (gentle homing)
- [x] Critical hit system (10% chance, 2x damage)
- [ ] Multiple characters
- [ ] Character unlocks

## Combat System
- [x] Tear shooting
- [x] Tear range limit with arc
- [x] Tear size decrease at range end
- [x] Tear damage calculation
- [x] Enemy knockback on hit
- [x] Contact damage from enemies
- [x] Enemy projectiles
- [x] Boss fights (Monstro)
- [x] Multishot upgrade (Inner Eye)
- [x] Piercing tears (Cupid's Arrow)
- [x] Homing tears (Spoon Bender)
- [x] Bouncing tears (Rubber Cement)
- [x] Temporary damage bonuses
- [ ] Explosive tears

## Health System
- [x] Red heart containers
- [x] Half-heart damage
- [x] Soul hearts
- [x] Black hearts (damage enemies on loss)
- [x] Heart container max
- [x] Damage priority (black > soul > red)
- [x] Invincibility frames (1.5 seconds)
- [x] Damage flash effect
- [x] Low health pulsing warning
- [x] Player death
- [x] Extra lives (Dead Cat)
- [x] Revival system
- [ ] Bone hearts
- [ ] Eternal hearts

## Pickup System
- [x] Red heart pickups
- [x] Half heart pickups
- [x] Soul heart pickups
- [x] Coin pickups (penny)
- [x] Key pickups
- [x] Bomb pickups
- [x] Weighted drop chances
- [ ] Nickel/dime pickups
- [ ] Pills
- [ ] Cards
- [ ] Trinkets

## Item System
- [x] Item pedestals
- [x] 19 passive stat items
- [x] Stat modification on pickup
- [x] Item collection tracking
- [x] Triple shot (Inner Eye)
- [x] Active items with charge system
- [x] 5 active items
- [x] Damage multiplier items
- [ ] Item synergies
- [ ] Transformations
- [ ] 50+ items

## Floor/Room System
- [x] Procedural floor generation
- [x] 9x9 room grid
- [x] Room count scaling by floor
- [x] Start room placement
- [x] Boss room placement
- [x] Treasure room placement
- [x] Shop room placement
- [x] Room persistence
- [x] Cleared rooms stay cleared
- [x] Destroyed obstacles stay destroyed
- [x] Collected pickups stay collected
- [x] Floor progression via trapdoor
- [x] Infinite floors
- [ ] Secret rooms
- [ ] Challenge rooms

## Fog of War
- [x] Rooms hidden until discovered
- [x] Adjacent rooms shown as dim outlines
- [x] Room type hints for adjacent rooms
- [x] Room discovered on entry
- [ ] Compass item (show icons)
- [ ] Map item (show layout)

## Minimap
- [x] Room-based minimap
- [x] Current room indicator
- [x] Color-coded room types (boss=red, treasure=yellow, shop=green)
- [x] Fog of war on minimap
- [x] Adjacent room hints

## Door System
- [x] Automatic door placement
- [x] Doors locked when enemies present
- [x] Doors open on room clear
- [x] Locked doors (require key)
- [x] Room transition on door entry
- [ ] Secret door bombing
- [ ] Boss room doors

## Obstacles
- [x] Rock obstacles (indestructible)
- [x] Poop obstacles (destroyable, 3 HP)
- [x] Poop damage states (visual)
- [x] Poop shrinks as damaged
- [x] Spike obstacles (damage player)
- [ ] Tinted rocks
- [ ] Fire places
- [ ] Pits

## Bomb System
- [x] Bomb placement (E key)
- [x] Bomb countdown timer (2 seconds)
- [x] Bomb explosion radius
- [x] Damage to enemies
- [x] Damage to player
- [x] Destroy obstacles
- [ ] Bomb synergies
- [ ] Troll bombs

## Enemy AI
- [x] Fly behavior (float + chase)
- [x] Gaper behavior (chase)
- [x] Spider behavior (erratic chase)
- [x] Hopper behavior (jump toward player)
- [x] Host behavior (hide + shoot)
- [x] Leaper behavior (leap attack)
- [x] Charger behavior (charge when aligned)
- [x] Bony behavior (shoot projectiles)
- [x] Globin behavior (regenerates)
- [x] Enemy wake-up delay (0.6s)
- [x] Enemy spawn animation (scale + fade)
- [x] Champion enemies (5 colors)
- [x] Champion modifiers (HP, speed, damage)
- [x] Champion special abilities

## Boss AI
- [x] Monstro boss (200 HP)
- [x] Multi-phase attacks
- [x] Jump attack
- [x] Projectile attacks
- [x] Boss health bar
- [x] Trapdoor spawns on boss defeat
- [ ] Additional bosses
- [ ] Boss patterns

## Shop System
- [x] Shop rooms with items
- [x] Price display
- [x] Purchase with coins
- [ ] Restock after purchase
- [ ] Beggar interactions

## HUD/UI
- [x] Health hearts display (half-heart support)
- [x] Soul hearts display
- [x] Black hearts display
- [x] Damage stat display
- [x] Speed stat display
- [x] Tears/second display
- [x] Range stat display
- [x] Item count display
- [x] Key counter
- [x] Bomb counter
- [x] Coin counter
- [x] Floor indicator
- [x] Minimap
- [x] Active item display
- [x] Charge indicator

## Visual Effects
- [x] Tear splash particles
- [x] Blood splatter particles
- [x] Persistent blood stains
- [x] Player damage flash
- [x] Screen shake on damage
- [x] Screen shake on kills
- [x] Screen shake on item pickups
- [x] Red flash overlay on damage
- [x] Floating critical text
- [x] Pickup bobbing animation
- [x] Item pedestal glow
- [x] Item name/description popup
- [x] Enemy spawn fade-in
- [x] Enemy hit flash
- [x] Enemy shadows
- [x] Champion enemy glow
- [x] Spotlight vignette effect
- [x] Wall brick texture
- [x] Floor tile checker pattern
- [x] Player eye tracking
- [x] Invulnerability flash
- [x] Trapdoor animation

## Debug Features
- [x] Debug mode toggle (backtick key)
- [x] Shows: Room position, Player position, HP
- [x] Shows: Damage, Tear Delay, Enemies, Tears
- [x] Shows: Floor, Total Kills, FPS

## Game States
- [x] Title screen
- [x] Playing state
- [x] Pause screen (ESC)
- [x] Game over screen
- [ ] Victory screen
- [ ] Character select

## Player Spawn
- [x] Spawn near room entry door
- [x] Brief movement pause (0.25s)
- [x] Direction-based positioning

## Room Entry
- [x] Enemy wake-up delay (0.6s)
- [x] Enemy spawn animation
- [x] Player movement pause (0.25s)

## Persistence
- [x] Room state saved per floor
- [x] Enemy deaths persistent
- [x] Pickup collection persistent
- [x] Obstacle destruction persistent
- [x] Blood stains persist
- [ ] Save/load system
- [ ] Unlocks persistence
