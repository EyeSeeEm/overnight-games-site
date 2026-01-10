# Iteration Log: Lost Outpost (Canvas) - EXPANDED VERSION

## Reference Analysis
- Main colors: Dark grays/blacks, blue/cyan UI, yellow hazard stripes, green aliens, red eyes
- Art style: Dark sci-fi survival horror (Alien Breed inspired)
- UI elements: Rank/XP top-left, health/credits bottom-center, ammo bottom-right
- Core features from GDD: WASD movement, mouse aim, shooting, reload, aliens, items, lives

## 20 EXPAND PASSES

### Expand 1: Multiple Weapon Types
- Assault Rifle, Shotgun, Plasma Rifle, SMG, Flamethrower
- Each with unique stats: damage, fire rate, spread, clip size, reload time

### Expand 2: More Enemy Types
- Scorpion (standard), Scorpion Small (fast), Arachnid (tank)
- Facehugger (quick), Spitter (ranged), Brute (heavy), Queen (boss)

### Expand 3: Armor System
- Armor pickup item
- Absorbs 50% of incoming damage
- Blue armor bar in UI

### Expand 4: Speed Boost Power-up
- 10 second duration, 1.5x movement speed
- Visual indicator on player

### Expand 5: Damage Boost Power-up
- 10 second duration, 2x damage
- Visual indicator on player

### Expand 6: Weapon Pickup Items
- Shotgun and Plasma Rifle spawns on map
- Collect to add weapon to inventory

### Expand 7: Explosive Barrels
- Red barrels with hazard symbol
- Chain reaction explosions
- Damages enemies and player in radius

### Expand 8: Acid Pools
- Green bubbling pools
- Damage over time to player
- Particle effects on contact

### Expand 9: Teleporter Pads
- Cyan glowing pads
- Instant teleport to linked pad
- Screen flash effect

### Expand 10: Shop Terminal
- Green $ terminal on map
- Future shop integration point

### Expand 11: Wave Progression System
- 10 waves of increasing difficulty
- Enemies spawn from vents

### Expand 12: Boss Wave (Wave 10)
- Queen alien with 500 HP
- Crown visual, larger size
- Victory screen on completion

### Expand 13: Combo System
- Kill streak multiplier for XP
- 3 second timer to maintain combo
- UI display for combo count

### Expand 14: Larger Map
- 40x35 tiles (expanded from 30x25)
- More rooms and corridors

### Expand 15: Victory Screen
- Displayed after wave 10
- Shows kills, rank, credits

### Expand 16: Kill Counter
- Tracks total kills in session
- Displayed on game over/victory

### Expand 17: Weapon Switching (Keys 1-5)
- Number keys switch weapons
- Only available weapons shown

### Expand 18: Enemy Ranged Attacks
- Spitter enemy shoots acid projectiles
- 2 second cooldown

### Expand 19: More Item Types
- Armor pickups, weapon pickups, power-ups
- Distinct visual styles

### Expand 20: Armor Damage Absorption
- Progressive armor damage system
- Armor depletes before health

## 20 POLISH PASSES

### Polish 1: Damage Numbers
- Floating text on enemy hits
- Yellow color, larger for crits

### Polish 2: Hit Flash Effect
- Enemies flash white when damaged
- Rapid decay animation

### Polish 3: Camera Zoom on Events
- Zoom in on boss kills
- Zoom on explosions

### Polish 4: Shell Casing Particles
- Ejected when shooting
- Gravity-affected falling

### Polish 5: Smoke Trails
- Fire weapon projectiles leave smoke
- Gray particles with fade

### Polish 6: Death Explosion Particles
- Enemy death creates burst
- Boss has larger explosion

### Polish 7: Footstep Dust
- Small dust particles when moving
- Brown/gray color

### Polish 8: Ambient Lighting Flicker
- Subtle tile brightness variation
- Creates atmosphere

### Polish 9: Blood Splatter Decals
- Persistent blood stains
- Limited to 100 decals

### Polish 10: Screen Flash on Damage
- White flash when player hit
- Intensity based on damage

### Polish 11: Weapon Recoil Animation
- Player sprite kicks back
- Smooth decay

### Polish 12: Enemy Spawn Particles
- Green particles from vents
- Alerts player to spawns

### Polish 13: Alert Indicator (!)
- Red exclamation above detected enemy
- Fade out animation

### Polish 14: Pickup Glow Animation
- Pulsing glow around items
- White particles on pickup

### Polish 15: Wave Announcement Text
- Large cyan "WAVE X" text
- Floats up and fades

### Polish 16: Rank Up Celebration
- "RANK UP!" floating text
- Screen flash effect

### Polish 17: Minimap
- Top-right corner
- Shows walls, enemies (red), player (green)

### Polish 18: Combo Counter UI
- Yellow "COMBO xN" display
- Updates in real-time

### Polish 19: Power-up Timer Indicators
- Shows remaining duration
- Bottom-left display

### Polish 20: Weapon Visual Styles
- Shotgun wider barrel
- Flamethrower with fire tip
- Different weapon models

## Feature Verification
- [x] WASD Movement
- [x] Mouse aiming
- [x] Left-click shooting
- [x] R to reload
- [x] 5 Weapon types with switching
- [x] 7 Enemy types including boss
- [x] Wave system (10 waves)
- [x] Combo XP system
- [x] Armor system
- [x] Power-ups (speed, damage)
- [x] Explosive barrels with chains
- [x] Acid pools
- [x] Teleporters
- [x] Minimap
- [x] Damage numbers
- [x] Screen effects (shake, flash, zoom)
- [x] Particles (muzzle, blood, shells, etc.)
- [x] Victory/Game Over screens

## Final Comparison
Game achieves expanded Lost Outpost/Alien Breed aesthetic with:
- Dark metallic corridors with hazard stripes
- Multiple green alien types with red glowing eyes
- Sci-fi UI with teal/cyan colors
- Full weapon arsenal and upgrade system
- Wave-based survival gameplay
- Comprehensive particle and effect system
- Minimap for navigation

## Post-Mortem

### What Went Well
- Canvas 2D rendering is performant for this style of game
- Particle system adds significant polish with minimal code
- Wave-based gameplay provides natural difficulty progression
- Multiple weapon types create satisfying variety
- The alien designs (green with red eyes) match the horror aesthetic perfectly

### What Went Wrong
- Pathfinding for enemies is basic (direct line, no obstacles)
- Spawn system needed multiple iterations to feel balanced
- Screen shake can be disorienting if overdone
- Memory management for particles/decals needed caps

### Key Learnings
- Start with fewer enemy types and add complexity gradually
- Particle limits are essential - 100+ particles cause slowdown
- Wave announcements give players breathing room
- Boss fights need distinct visual indicators (crown worked well)

### Time Spent
- Initial build: ~25 minutes
- Expand passes: ~40 minutes
- Polish passes: ~35 minutes
- Total: ~100 minutes

### Difficulty Rating
Medium - The core shooter mechanics are straightforward, but balancing 7 enemy types and 5 weapons required iteration. The wave system helped structure the difficulty curve.
