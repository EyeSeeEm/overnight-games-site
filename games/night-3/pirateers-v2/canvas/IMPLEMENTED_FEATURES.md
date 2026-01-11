# Implemented Features: Pirateers v2 (Canvas)

## Core Mechanics
- [x] Ship movement (W/S speed control)
- [x] Ship turning (A/D)
- [x] Speed levels (stop, slow, half, full)
- [x] Faster acceleration/deceleration
- [x] Reduced top speed
- [x] Broadside cannon fire (Space)
- [x] Arrow key alternatives

## Combat System
- [x] Broadside cannons (3 per side)
- [x] Cannonball spread
- [x] Enemy ships fire back
- [x] Damage calculation
- [x] Critical hits (15% chance, 2x damage)
- [x] Kill streaks (3+ kills)
- [x] Special weapons (Fireballs, Megashot, Chainshot)
- [x] Defensive items (Energy Cloak, Tortoise Shield)

## Enemy AI
- [x] Merchant ships (flee from player)
- [x] Navy ships (attack player)
- [x] Pirate ships (aggressive)
- [x] Patrol behavior
- [x] Attack behavior (broadside positioning)
- [x] Ghost ship (special enemy)
- [x] Pirate Captain boss
- [x] Navy Frigate (heavy enemy)
- [x] Day-based enemy scaling

## World
- [x] Procedural island generation (6-10 islands)
- [x] Island collision
- [x] Ports at islands (3 trading ports)
- [x] World bounds (2400x1800)
- [x] Forts (appear day 3+)
- [x] Fort combat (attack/destroy)
- [ ] Multiple regions

## Trading System
- [x] Ports with goods
- [x] Buy/sell cargo (E key)
- [x] Cargo capacity (10 items)
- [x] Dynamic pricing
- [x] Trade quest tracking
- [ ] Trade routes
- [ ] Market prices change over time

## Quest System
- [x] Quest generation per day
- [x] Bounty quests (sink pirates)
- [x] Merchant quests (sink merchants)
- [x] Trade quests (sell cargo)
- [x] Survival quests (survive days)
- [x] Quest progress tracking
- [x] Quest completion rewards

## Day/Night Cycle
- [x] Day timer (3 minutes)
- [x] Day counter
- [x] Automatic day end
- [x] Ship repair at day end
- [x] Enemy respawn per day
- [x] Fort respawn per day
- [x] Quest refresh per day
- [ ] Base phase (upgrade shop)

## Economy
- [x] Gold from combat
- [x] Gold from trading
- [x] Loot drops
- [x] Cargo items (Rum, Sugar, Spices, Silk, Tea, Coffee)
- [x] Quest rewards
- [x] Fort destruction rewards
- [ ] Upgrade purchases

## Defensive Items
- [x] Energy Cloak (1 key)
  - 10 second duration
  - Makes player invisible to enemies
  - Attacks miss while active
  - 60 second cooldown
- [x] Tortoise Shield (2 key)
  - 8 second duration
  - 50% damage reduction
  - 45 second cooldown

## Special Weapons
- [x] Fireballs
  - 40 damage per shot
  - Damage over time effect
- [x] Megashot
  - 80 damage per shot
  - Larger projectile
- [x] Chainshot
  - 25 damage per shot
  - Slows enemy ships

## Camera
- [x] Player follow camera
- [x] 50% zoom in (1.5x scale)
- [x] Camera bounds clamping
- [x] Screen shake support

## Visual Effects
- [x] Muzzle flash particles
- [x] Hit particles
- [x] Explosion particles
- [x] Loot pickup sparkle
- [x] Death burst ring
- [x] Damage flash (red overlay)
- [x] Low health vignette
- [x] Screen shake
- [x] Floating damage numbers
- [x] Cloak/Shield activation effects
- [x] Fort destruction effects

## UI/HUD
- [x] Left UI panel
- [x] Day counter
- [x] Gold display
- [x] Armor bar
- [x] Speed indicator
- [x] Day timer
- [x] Message log
- [x] Debug overlay (Q key)
- [x] Minimap (120x120px)
- [x] Quest progress bar
- [x] Active quest display

## Minimap Features
- [x] Islands display
- [x] Ports (gold markers)
- [x] Forts (red markers)
- [x] Enemies (red dots)
- [x] Loot (yellow dots)
- [x] Player position/direction
- [x] Camera view rectangle

## Title Screen
- [x] Title with decorative ship
- [x] Controls display
- [x] Animated ocean background
- [x] Press any key to start

## Stats Tracking
- [x] Ships sunk
- [x] Total damage dealt
- [x] Total damage taken
- [x] Critical hits
- [x] Loot collected
- [x] Cannons fired
- [x] Max kill streak
- [x] Gold earned

## Game Over
- [x] Ship destruction handling
- [x] Gold penalty (25%)
- [x] Automatic day advance
- [x] Performance rating (Deckhand/Sailor/Captain/Admiral)

## Controls
- [x] W/↑ - Increase speed
- [x] S/↓ - Decrease speed
- [x] A/← - Turn left
- [x] D/→ - Turn right
- [x] Space - Fire cannons
- [x] E - Trade at port
- [x] Q - Debug mode
- [x] 1 - Energy Cloak (when owned)
- [x] 2 - Tortoise Shield (when owned)
- [x] F - Fire special weapon (when owned)
