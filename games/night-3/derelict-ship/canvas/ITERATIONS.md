# Iteration Log: Derelict Ship (Canvas)

## Reference Analysis
- Main colors: Dark grays (#2a2a2a), dark backgrounds (#0a0808), blood red (#6a2020)
- Art style: Top-down 2D with Darkwood-style vision cone, dark atmospheric horror
- UI elements: O2 bar (blue), HP bar (red), flashlight battery, ship integrity, sector indicator, messages
- Core features from GDD:
  - Constant O2 drain (survival horror tension)
  - Vision cone (90 degrees, Darkwood-style)
  - Flashlight with battery management
  - Ship integrity decay timer
  - Enemies (Crawler, Shambler)
  - Melee combat
  - Item pickups (O2, medkits)
  - Escape pod win condition

## Iterations 1-10: Initial Build
1. Initial build - Canvas structure with game loop
2. Added procedural room generation with corridors
3. Implemented player movement (WASD) with collision detection
4. Added Darkwood-style 90-degree vision cone
5. Implemented darkness overlay with cone cut-out using composite operations
6. Added O2 drain system (idle, walking, running, combat rates)
7. Added HP system with damage
8. Created Crawler and Shambler enemy types with patrol/chase AI
9. Added blood stain effects for atmosphere
10. Implemented UI bars (O2, HP, flashlight, integrity)

## Iterations 11-20: Core Polish
11. [x] Debug overlay (press Q to toggle) - shows all game stats
12. [x] Stats tracking system - killCount, totalDamageDealt, totalDamageTaken, critCount
13. [x] Critical hit system (15% chance, 2x damage) with yellow damage numbers
14. [x] Kill streak system with streak timer and feedback messages
15. [x] Floating damage numbers on hit (red for damage, yellow for crits)
16. [x] Damage tracking for player attacks (attacksMade)
17. [x] Damage tracking for enemy melee attacks
18. [x] Screen shake on damage dealt and received
19. [x] Damage flash effect (red screen overlay) when taking damage
20. [x] Attack visual effect (white flash at attack point)

## Iterations 21-30: Visual Feedback & UI
21. [x] Low health pulsing red vignette effect (below 30 HP)
22. [x] Floating text system for all feedback
23. [x] Enhanced blood particles (more particles for crits)
24. [x] Kill streak feedback messages (TRIPLE KILL, QUAD KILL, etc.)
25. [x] Healing particles when using medkit (green)
26. [x] O2 pickup floating text and particles (blue)
27. [x] Item pickup sparkle effect
28. [x] Death burst particle effect for killed enemies
29. [x] Particle system for blood and effects
30. [x] Kill streak display (2x STREAK and up)

## Iterations 31-40: Final Polish
31. [x] Enhanced game over screen with detailed stats
32. [x] Performance rating on death (LOST/SURVIVOR/FIGHTER/WARRIOR)
33. [x] Enhanced victory screen with detailed stats
34. [x] Efficiency rating system (S/A/B/C/D) for victory
35. [x] Max kill streak tracking
36. [x] Kill streak timer decay system (3 second window)
37. [x] Items picked up tracking
38. [x] Attacks made tracking in debug overlay
39. [x] Time survived display in end screens
40. [x] Full debug info display with all tracked stats

## Feature Verification
- [x] WASD movement: tested, works with collision detection
- [x] Mouse aim: player rotates toward cursor
- [x] Vision cone: 90 degree cone, darkness outside
- [x] O2 drain: constant drain, different rates for actions
- [x] HP system: damage from enemies
- [x] Flashlight toggle: F key, battery management
- [x] Enemy AI: patrol and chase states working
- [x] Melee combat: click to attack with visual effect
- [x] Ship integrity: slowly decays
- [x] Items: O2 canisters and medkits
- [x] Victory condition: reach escape pod
- [x] Critical hit system
- [x] Kill streak system
- [x] Debug overlay
- [x] Enhanced end screens with stats

## Final Comparison
- Dark atmospheric style achieved with #0a0808 background
- Vision cone creates tension (can't see behind)
- O2 constantly draining creates urgency
- Grid floor pattern like reference interior shots
- Blood stains add to horror atmosphere
- Enemy silhouettes in darkness
- Full visual feedback system (floating text, screen effects, particles)

## Post-Mortem

### What Went Well
- Darkwood-style 90-degree vision cone creates excellent horror tension
- O2 drain mechanic adds constant survival pressure without feeling unfair
- Different drain rates (idle/walk/run/combat) create meaningful movement decisions
- Blood stains enhance atmosphere and tell environmental stories
- Screen shake and damage flash make combat feel impactful
- Critical hit and kill streak systems make combat more satisfying
- Floating damage numbers provide excellent combat feedback
- Debug overlay helpful for testing all systems

### What Went Wrong
- Ship integrity decay needed balancing - too fast felt punishing
- Vision cone edges sometimes had aliasing artifacts
- Enemy pathfinding in narrow corridors occasionally bugged
- Canvas composite operations for lighting required careful ordering

### Key Learnings
- Restricted vision is extremely effective for horror games
- Resource drain mechanics need multiple rates for different actions
- Atmosphere (blood, darkness) matters as much as mechanics for horror
- Canvas globalCompositeOperation = 'destination-out' essential for cone cutout
- Stats tracking adds replay value and makes end screens more meaningful

### Time Spent
- Initial build: ~40 minutes
- Iterations 11-20: ~25 minutes
- Iterations 21-30: ~20 minutes
- Iterations 31-40: ~20 minutes
- Total: ~105 minutes

### Difficulty Rating
Medium - Vision cone and O2 systems required careful implementation. Adding visual feedback was straightforward with established patterns.

---

## Feedback Fixes (2026-01-10)

### Issues from Player Feedback:
1. [x] "CRITICAL: Way too dark, can't see anything" → Reduced darkness from 90% to 50% opacity
2. [x] "Increase visibility significantly" → Increased flashlight cone 350→500px, cone angle 45→60°, ambient 50→150px

### Technical Changes:
- Darkness overlay: rgba(0,0,0,0.9) → rgba(0,0,0,0.5)
- `coneLength` with flashlight: 350 → 500 pixels
- `coneLength` without flashlight: 80 → 120 pixels
- `coneAngle`: π/4 (45°) → π/3 (60°)
- `ambientRadius` with flashlight: 50 → 150 pixels
- `ambientRadius` without flashlight: 30 → 100 pixels
- Improved gradient stops for brighter center
- Updated enemy visibility range to match (350→500, 80→120)

### Verification:
- Game is now playable with visible map, items, and enemies
- Flashlight cone clearly illuminates forward area
- Ambient light allows seeing immediate surroundings
- Still maintains atmospheric darkness for horror feel
- All feedback items addressed

---

## Feedback Fixes Session 2 (2026-01-11)

### Iteration 41: Make Game Brighter Overall
**Feedback:** "Make game brighter overall - too dark"

**Changes Made:**
- Reduced darkness overlay from 0.5 to 0.25 opacity
- Increased flashlight cone from 500 to 600 pixels
- Increased base cone (no flashlight) from 120 to 180 pixels
- Widened cone angle from π/3 (60°) to π/2.5 (~72°)
- Increased ambient radius from 150/100 to 200/150 (flashlight on/off)
- Brighter gradient center (0.9 opacity)

**Result:** Game significantly brighter while maintaining horror atmosphere

### Iteration 42: Fix Viewcone - Should REVEAL not HIDE
**Feedback:** "Fix viewcone - it should REVEAL not HIDE (opposite of current)"

**Problem Identified:**
- Enemies only rendered when INSIDE vision cone (line 895: `if (isInVisionCone(enemy.x, enemy.y))`)
- This made enemies completely invisible outside the cone
- `isInVisionCone()` parameters didn't match `renderLighting()` parameters

**Changes Made:**
1. Removed conditional rendering check for enemies - they now always render
2. Lighting overlay naturally handles visibility (darker outside cone)
3. Synced `isInVisionCone()` parameters with `renderLighting()`:
   - Range: 500/120 → 600/180 (flashlight on/off)
   - Cone angle: π/4 (45°) → π/2.5 (~72°)

**Result:** Viewcone now acts as lighting effect, not visibility cull. Enemies visible everywhere but dimmed outside cone.

### Iteration 43: Make Enemies Clearly Visible on Screenshots
**Feedback:** "Make enemies clearly visible on screenshots"

**Changes Made:**
1. Brightened enemy base colors:
   - Crawler: #5a4a3a → #8a6a4a (warmer brown)
   - Shambler: #4a5a4a → #6a8a6a (brighter green)
2. Added orange outline (strokeStyle #ffaa00) to all enemies
3. Added glowing red/orange eyes:
   - Crawlers: orange eyes (#ff4400)
   - Shamblers: red eyes (#ff0000)
4. Increased health bar size (4px → 5px height)

**Result:** Enemies now clearly stand out with bright outlines and glowing eyes. Easy to spot in screenshots even in darker areas.

### Iteration 44: Add Spaceship Phase After Tutorial Escape
**Feedback:** "Add spaceship phase after tutorial escape"

**Implementation:**
Added a complete second phase that triggers after reaching the escape pod:

**Spaceship State Variables:**
- `spaceship.x/y`: Pod position
- `spaceship.hp`: 3 hull points
- `spaceship.distance`: Progress toward escape (0 to 1000)
- `spaceship.asteroids[]`: Incoming obstacles
- `spaceship.stars[]`: Parallax background stars

**Gameplay:**
- WASD to dodge incoming asteroids
- 3 hull points before destruction
- Progress bar shows escape distance
- Derelict ship fades in background as you escape
- Victory after reaching target distance

**Visual Features:**
- Parallax star field (100 stars, varying speeds)
- Escape pod with engine glow and cockpit
- Rotating irregular asteroids
- Derelict ship shrinking in background
- Screen shake and damage flash on hit

**Technical Changes:**
- Modified victory check to enter 'spaceship' state instead of 'victory'
- Added initSpaceship(), updateSpaceship(), renderSpaceship() functions
- Modified game loop to handle spaceship state
- Modified render() to call renderSpaceship() for spaceship state

**Result:** Two-phase game: survive the ship, then escape through asteroid field!

### Iteration 45: Remove Combo System
**Feedback:** "Remove combo system - not needed"

**Rationale:** Kill streaks/combos don't fit the survival horror atmosphere. The game is about tense survival, not arcade scoring.

**Removed:**
- `killStreak` variable
- `killStreakTimer` variable
- `stats.maxKillStreak` tracking
- Kill streak messages (TRIPLE KILL!, QUAD KILL!, etc.)
- Kill streak UI display (Nx STREAK)
- Kill streak timer update in updateVisualEffects()
- MAX KILL STREAK from debug overlay
- MAX KILL STREAK from game over and victory screens

**Result:** Cleaner, more focused horror experience without arcade-style kill streaks.

---

## Second 100 Iterations - Major Feature Expansion (2026-01-11)

### Iterations 46-55: New Enemy Types
**Added 4 new enemy types from GDD:**
- **Stalker**: HP 45, Speed 150, invisible when stationary in darkness, fast attacker
- **Bloater**: HP 100, Speed 40, explodes on death dealing 40 damage in 100px radius
- **Hunter**: HP 80, Speed 180, persistent (never gives up chase), drops better loot
- **Mimic**: HP 50, Speed 100, disguises as item until player gets close

**Implementation:**
- Added enemy type data to `enemyTypes` object
- Added `invisible`, `explodes`, `persistent`, `disguised` flags
- Enemies spawn based on sector (harder types in later sectors)
- Stalker only visible when moving (alpha 0.1-0.3)
- Mimic looks like O2 canister until triggered
- Bloater has circular shape with pustules
- Hunter has glowing red eyes and large body

### Iterations 56-65: Ranged Weapons System
**Added 3 ranged weapons:**
- **Pistol**: 25 damage, 12 mag, 9mm ammo, high noise
- **Revolver**: 45 damage, 6 mag, .44 ammo, very high noise
- **Crossbow**: 35 damage, 1 mag, bolts, silent

**Implementation:**
- Weapons have `type: 'ranged'` or `type: 'melee'`
- Added ammo tracking object for 9mm, .44, bolts
- Added projectile array and update function
- Ranged attacks create bullet projectiles
- Bullets travel at 500px/s and hit enemies
- Non-silent weapons alert nearby enemies (400px range)
- Muzzle flash particles on ranged attack

### Iterations 66-75: New Melee Weapons
**Added 2 new melee weapons:**
- **Fire Axe**: 40 damage, 55 range, 0.6x speed
- **Stun Baton**: 15 damage, 40 range, 1.2x speed, 2s stun

**Implementation:**
- Updated weapons object with new entries
- Stun mechanic: enemy.stunTimer prevents movement/attacks
- "STUNNED" indicator shown above stunned enemies
- Weapon switching with 1-4 keys

### Iterations 76-85: Projectile System
**Full projectile implementation:**
- Bullets track distance traveled and disappear at max range
- Wall collision with spark particles
- Grenades with 2s fuse, slow down over time
- Explosion function with radial damage falloff
- Player grenades vs enemy grenades distinction

**Visual effects:**
- Bullet: Yellow circle (4px radius)
- Grenade: Brown circle with fuse spark when < 1s
- Explosion: 20 particles in orange/yellow

### Iterations 86-95: New Items System
**Added 6 new item types:**
- **9mm Ammo**: +12 rounds
- **.44 Ammo**: +6 rounds
- **Crossbow Bolts**: +4 bolts
- **Stimpack**: +50% speed for 15 seconds
- **Flare**: Stored for later use (Press V)
- **Frag Grenade**: Stored for throwing (Press G)

**Implementation:**
- Weighted item spawn system (common items more frequent)
- Rare weapon pickups (30% chance per spawn)
- Ammo pickup adds to global ammo pool
- Stimpack sets player.stimpackTimer
- Grenades/flares add to player inventory counts

### Iterations 96-105: Minimap System
**Added corner minimap:**
- 100x100 pixel minimap in bottom-right corner
- Shows floor layout (passable tiles)
- Red dots for enemies
- Green dots for items
- Larger green square for exit
- Blue square for player with direction line

**Implementation:**
- renderMinimap() function called from renderUI()
- Scale factor based on map dimensions
- Semi-transparent background

### Iterations 106-115: Enhanced HUD
**Added weapon/ammo display:**
- Weapon name in HUD (WEAPON: PIPE)
- Ammo count for ranged weapons
- Damage display for melee weapons
- Grenade and flare counts
- Stimpack timer countdown

**Visual improvements:**
- Black background boxes for readability
- Consistent font styling

### Iterations 116-125: Enemy AI Improvements
**Enhanced enemy behaviors:**
- Stalker: Silent when noticing player
- Hunter: Never loses interest (persistent)
- Mimic: Reveals with "IT'S A MIMIC!" message
- Stun mechanic: Enemies skip turns while stunned
- Bloater: "BLOATER EXPLODED!" message on death

**Implementation:**
- State machine handles 'disguised' state for mimics
- isMoving flag tracks stalker visibility
- attackRate varies by enemy type (stalker faster)

### Iterations 126-135: Visual Polish
**Enemy rendering by type:**
- Crawler: Low rectangular body, orange eyes
- Shambler: Square body, red eyes
- Stalker: Thin elongated body, purple eye
- Bloater: Circular with pustules
- Hunter: Large rectangular, bright red eyes
- Mimic (disguised): Looks like item pickup

**Stalker invisibility:**
- Patrol state: 10% visible
- Chase state (not moving): 30% visible
- Moving: Fully visible

### Iterations 136-145: Bloater Mechanics
**Explosion on death:**
- 40 damage in 100px radius
- Damages player too (be careful!)
- Screen shake (15 intensity)
- 20 explosion particles
- Message warns player

**Hunter loot drops:**
- 50% chance to drop Medkit (L) on death
- Reward for defeating tough enemy

**Total Iterations:** 145
