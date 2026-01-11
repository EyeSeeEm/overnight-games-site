# Implemented Content: Binding of Isaac Clone (Canvas)

## Enemy Types (12 total)
- [x] Fly
  - HP: 4
  - Speed: 70 px/s
  - Behavior: Float + chase
  - Size: 18px
- [x] Red Fly
  - HP: 6
  - Speed: 80 px/s
  - Behavior: Float + chase (aggressive)
  - Size: 18px
- [x] Gaper
  - HP: 12
  - Speed: 45 px/s
  - Behavior: Chase
  - Size: 30px
- [x] Frowning Gaper
  - HP: 18
  - Speed: 55 px/s
  - Behavior: Chase (faster)
  - Size: 30px
- [x] Spider
  - HP: 6
  - Speed: 90 px/s
  - Behavior: Erratic movement + chase
  - Size: 22px
- [x] Big Spider
  - HP: 15
  - Speed: 60 px/s
  - Behavior: Erratic movement + chase
  - Size: 36px
- [x] Hopper
  - HP: 8
  - Speed: 0 (jumps)
  - Behavior: Jump toward player
  - Size: 24px
- [x] Host
  - HP: 20
  - Speed: 0 (stationary)
  - Behavior: Hide in shell, shoot when player near
  - Size: 28px
- [x] Leaper
  - HP: 14
  - Speed: 50 px/s
  - Behavior: Leap attack
  - Size: 26px
- [x] Charger
  - HP: 10
  - Speed: 150 px/s (when charging)
  - Behavior: Charge when aligned with player
  - Size: 26px
- [x] Globin
  - HP: 22
  - Speed: 40 px/s
  - Behavior: Chase + regenerates
  - Size: 28px
- [x] Bony
  - HP: 8
  - Speed: 35 px/s
  - Behavior: Chase + shoot projectiles
  - Size: 24px

## Bosses (1 total)
- [x] Monstro
  - HP: 200
  - Damage: 2 hearts
  - Attack 1: Jump toward player
  - Attack 2: Projectile spread
  - Has health bar
- [ ] Duke of Flies
- [ ] Larry Jr.
- [ ] Gemini
- [ ] The Haunt
- [ ] Dingle

## Champion Variants (5 colors)
- [x] Red Champion - 2x HP
- [x] Yellow Champion - 1.5x Speed
- [x] Blue Champion - Extra projectiles (for shooters)
- [x] Green Champion - Spawns fly on death
- [x] Black Champion - 2x damage, 1.5x HP

## Player Stats
- [x] Red Hearts (3 starting / 6 half-hearts)
- [x] Soul Hearts
- [x] Black Hearts (damage all enemies when lost)
- [x] Damage (3.5 base)
- [x] Damage Multiplier (for multiplicative items)
- [x] Tear Delay (0.35 base)
- [x] Range (220 base)
- [x] Shot Speed (320 base)
- [x] Movement Speed (160 base)
- [x] Multishot (1 base)
- [x] Homing flag (from Spoon Bender)
- [x] Piercing flag (from Cupid's Arrow)
- [x] Bouncing flag (from Rubber Cement)
- [x] Extra Lives (from Dead Cat)
- [x] Temporary damage bonus (from Book of Belial)

## Pickup Types (6 total)
- [x] Red Heart
  - Heals 2 half-hearts
- [x] Half Red Heart
  - Heals 1 half-heart
- [x] Soul Heart
  - Adds shield heart
- [x] Penny
  - Adds 1 coin
- [x] Key
  - Opens locked doors
- [x] Bomb
  - Adds 1 bomb
- [ ] Nickel (+5 coins)
- [ ] Dime (+10 coins)
- [ ] Pills
- [ ] Cards

## Passive Items (19 total)
- [x] Sad Onion - Tears -0.08 (faster fire rate)
- [x] Spinach - Damage +1.2
- [x] Growth Hormones - Damage +0.8, Speed up
- [x] Cat-o-nine-tails - Range +50
- [x] Jesus Juice - Damage +0.5
- [x] Magic Mushroom - Damage +1.5, All stats up
- [x] Pentagram - Damage +1
- [x] The Mark - Damage +1, Speed up
- [x] Wire Coat Hanger - Tears -0.05
- [x] Inner Eye - Triple shot (multishot = 3)
- [x] Spoon Bender - Homing tears
- [x] Cupid's Arrow - Piercing tears
- [x] Rubber Cement - Bouncing tears
- [x] Black Heart - +2 black hearts
- [x] Dead Cat - 9 extra lives
- [x] Cricket's Head - Damage x1.5 multiplier
- [x] Polyphemus - Damage x2 + slower tears
- [x] Steven - Damage +1
- [x] Stigmata - HP up + Damage up

## Active Items (5 total)
- [x] Yum Heart (4 charges) - Heal 1 red heart
- [x] Book of Belial (3 charges) - +2 damage for room
- [x] The Poop (1 charge) - Spawn poop obstacle
- [x] Lemon Mishap (2 charges) - Create damaging creep
- [x] Shoop Da Whoop (4 charges) - Fire damage beam

## Room Types (5 total)
- [x] Start Room
  - No enemies
  - Starting point
- [x] Normal Room
  - Random enemies
  - Random obstacles
- [x] Treasure Room
  - Item pedestal
  - Yellow door on minimap
- [x] Shop Room
  - Items for sale
  - Green door on minimap
- [x] Boss Room
  - Floor boss (Monstro)
  - Red door on minimap
- [ ] Secret Room
- [ ] Curse Room
- [ ] Challenge Room

## Obstacle Types (4 total)
- [x] Rock
  - Indestructible
  - Blocks movement and tears
- [x] Poop
  - HP: 3
  - Destroyable by tears/bombs
  - Visual damage states
  - 30% drop chance on destruction
- [x] Spike
  - Damages player on contact
  - Does not block movement
- [x] Bomb (placed)
  - 2 second fuse
  - Explodes, damages everything
- [ ] Tinted Rock
- [ ] Fire
- [ ] Pit

## Floors (Infinite progression)
- [x] Basement I
  - 9x9 room grid
  - Procedural generation
  - Basic enemies
  - Monstro boss
- [x] Floor progression via trapdoor
  - Trapdoor spawns after boss defeat
  - Difficulty scales with floor number
  - More enemies per room
  - Higher champion spawn chance
  - Infinite floors

## Characters (1 total)
- [x] Isaac
  - 3 red hearts (6 half-hearts)
  - 1 bomb, 1 key
  - Standard stats
- [ ] Magdalene
- [ ] Cain
- [ ] Judas

## UI Screens
- [x] Title Screen
  - "BASEMENT TEARS" title
  - Controls display (WASD/Arrow Keys/Q/E)
  - Start prompt
- [x] Game HUD
  - Hearts display (with half-hearts)
  - Soul hearts display
  - Black hearts display
  - Stats (DMG, SPD, TEARS/s, RANGE)
  - Resources (keys/bombs/coins)
  - Floor indicator
  - Minimap
  - Active item display
  - Charge bar indicator
- [x] Game Over Screen
  - Death message
  - Floor reached
  - Restart prompt
- [x] Pause Screen (ESC key)
  - Dark overlay
  - "PAUSED" text
  - Resume instructions
- [ ] Victory Screen
- [ ] Character Select

## Controls
- [x] WASD - Movement
- [x] Arrow Keys - Shooting (cardinal directions)
- [x] E - Place Bomb
- [x] Q - Use Active Item
- [x] ESC - Pause/Resume
- [x] Backtick (`) - Debug mode
- [x] Space - Start/Continue
