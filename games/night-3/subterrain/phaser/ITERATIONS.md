# Iteration Log: Subterrain (Phaser)

## Reference Analysis
- Main colors: Dark gray floors (#2a2828), red blood (#6a2020, #8a3030), green acid (#305a30), brown enemies (#6a5848)
- Art style: Top-down 2D with diamond floor pattern, gritty industrial sci-fi horror
- UI elements: Health bar (red), survival meters (hunger orange, thirst blue, fatigue gray), infection bar (green), global infection counter, quick slots
- Core features from GDD:
  - WASD movement
  - Mouse aim and click to attack
  - 4 survival meters (health, hunger, thirst, fatigue)
  - Infection meter
  - Global infection timer
  - 5 sectors (hub, storage, medical, research, escape)
  - Enemies (shambler, crawler, spitter, brute, cocoon)
  - Loot containers
  - Crafting (basic)
  - Win condition (escape pod with keycard)

## Iterations 1-10: Initial Build
1. Initial build - Created Phaser 3 project structure with index.html and game.js
2. Added BootScene for texture generation - floor, wall, door, player, enemies
3. Implemented diamond floor pattern matching Canvas version style
4. Added survival meters UI (HP, HUN, THI, FAT, INF) - positioned in top-left
5. Added GameScene with sector-based map system (5 sectors)
6. Added enemy types with correct colors (shambler tan, spitter green, brute large)
7. Added blood splatter effects when enemies die
8. Added cocoon enemy type with glowing effect and spawn mechanic
9. Added global infection timer with red warning display
10. Added quick slots for consumable items (1-4 keys)

## Iterations 11-20: Core Polish
11. [x] Debug overlay (press Q to toggle) - shows all game stats
12. [x] Stats tracking system - killCount, totalDamageDealt, totalDamageTaken, critCount
13. [x] Critical hit system (15% chance, 2x damage) with yellow flash and damage numbers
14. [x] Kill streak system with streak timer and feedback messages
15. [x] Item drops from killed enemies (20% chance - scrap, cloth, chemicals)
16. [x] Floating damage numbers on hit (red for damage, yellow for crits)
17. [x] Damage tracking for enemy melee attacks
18. [x] Damage tracking for enemy projectile attacks
19. [x] Screen shake on damage dealt and received
20. [x] Damage flash effect (red screen overlay) when taking damage

## Iterations 21-30: Visual Feedback & UI
21. [x] Low health pulsing red vignette effect (below 30% HP)
22. [x] Floating text system for all feedback
23. [x] Enhanced blood particles (more particles for crits)
24. [x] Kill streak feedback messages (TRIPLE KILL, QUAD KILL, etc.)
25. [x] Healing particles when using medkit
26. [x] Cure particles when using antidote
27. [x] Item use floating text feedback (HUNGER -30, THIRST -40, etc.)
28. [x] Container looting tracking with floating text
29. [x] Items used tracking
30. [x] Sector visited tracking with transition messages

## Iterations 31-40: Final Polish
31. [x] Enhanced game over screen with detailed stats
32. [x] Performance rating on death (SURVIVOR/FIGHTER/STRUGGLER/VICTIM)
33. [x] Enhanced victory screen with detailed stats
34. [x] Efficiency rating system (S/A/B/C/D) for victory
35. [x] Max kill streak tracking
36. [x] Kill streak timer decay system
37. [x] Sector transition floating text (ENTERING: SECTOR NAME)
38. [x] Loot sparkle effect when collecting items
39. [x] Death burst particle effect for killed enemies
40. [x] Infection visual effect (green screen tint at high infection)

## Feature Verification
- [x] WASD movement: tested, player moves around sector
- [x] Mouse aim: player rotates toward cursor
- [x] Click to attack: melee attack works
- [x] Survival meters display and decay over time
- [x] Global infection increases over time
- [x] Hub sector safe zone (no enemies spawn)
- [x] Door tiles placed at sector edges for transitions
- [x] Enemy AI chases player and attacks
- [x] Loot containers can be interacted with
- [x] Items can be used with number keys
- [x] Victory condition: escape pod with keycard
- [x] Game over conditions: health 0, infection 100, global 100
- [x] Critical hit system
- [x] Kill streak system
- [x] Debug overlay
- [x] Enhanced end screens with stats

## Final Comparison
- Diamond floor pattern matches reference style
- Dark industrial color palette achieved (#2a2828 floor, #1a1818 walls)
- Survival meters positioned like reference (top-left corner)
- Global infection counter in bottom-right like reference
- Enemy designs simplified but functional with correct color schemes
- Blood effects present (red and green variants)
- Sector-based layout with hub and 4 outlying areas
- Phaser 3 implementation with CANVAS renderer for headless compatibility
- Full visual feedback system (floating text, screen effects, particles)

## Post-Mortem

### What Went Well
- Phaser's sprite and physics system simplified entity management
- Dynamic texture generation maintained visual consistency with Canvas version
- Scene transitions cleaner than Canvas state management
- Input handling (keyboard + mouse) worked smoothly with Phaser
- Floating text system using Phaser text objects is cleaner than canvas drawing
- Stats tracking system mirrors canvas version exactly for consistency

### What Went Wrong
- Texture generation for diamond floor pattern required careful math
- Phaser physics sometimes interacted unexpectedly with tile-based movement
- Some Canvas-specific drawing had to be reimplemented for Phaser
- Particle system in Phaser is more complex than canvas, used simpler array approach

### Key Learnings
- Phaser 3 Canvas mode essential for headless testing environments
- Dynamic textures enable sprite-like visuals without external assets
- Phaser's built-in physics simplified collision detection significantly
- Consistent patterns between canvas/phaser versions makes porting easier
- setScrollFactor(0) is critical for UI elements that shouldn't move with camera

### Time Spent
- Initial build: ~35 minutes
- Iterations 11-20: ~25 minutes
- Iterations 21-30: ~25 minutes
- Iterations 31-40: ~20 minutes
- Total: ~105 minutes

### Difficulty Rating
Medium - Familiar patterns from Canvas version, but Phaser-specific adaptations needed. Adding visual feedback was straightforward with the floating text system.

## Feedback Fixes (2026-01-10)

### Issues from Player Feedback:
1. [x] "Camera doesn't move with player when moving through larger rooms"
   → Re-established camera follow after sector load with `startFollow()` and `centerOn()`
   → Changed screen shake from `setScroll()` to `setFollowOffset()` to not interfere with follow
   → Increased camera lerp values from 0.1 to 0.15 for smoother tracking

### Verification:
- Tested 60+ seconds in Storage Wing (larger sector)
- Player moved to edges of sector, camera followed properly
- Sector transitions maintain camera follow
- All feedback items addressed

---

## Second 100 Iterations (2026-01-11)

### Iterations 41-50: Weapons System Foundation
41. Added WEAPONS constant with weapon definitions (fists, shiv, pipeClub, stunBaton, pistol)
42. Added weapon properties: damage, speed, range, durability, special effects
43. Added playerData.weapon and weaponDurability tracking
44. Implemented weapon-based damage calculation in attack()
45. Added melee weapon cooldown based on weapon speed
46. Added weapon durability reduction on attack
47. Added weapon breaking mechanic and "WEAPON BROKE" feedback
48. Added stamina cost for melee attacks (10 per swing)
49. Added weapon switching with 5-7 keys
50. Added weapon display in UI (bottom left)

### Iterations 51-60: Ranged Combat
51. Added fireProjectile() for ranged weapons
52. Implemented accuracy system with spread calculation
53. Added ammo tracking (playerData.ammo.bullets)
54. Added player bullet collision with enemies in updateProjectiles()
55. Added wall collision for projectiles
56. Added muzzle flash effect for ranged weapons
57. Added "NO AMMO" feedback when empty
58. Added bullets floor drop item with brass texture
59. Added ammo pickup (+10 bullets) handling
60. Updated UI to show ammo count for ranged weapons

### Iterations 61-70: Status Effects System
61. Added STATUS_EFFECTS constant (bleeding, stunned, slowed)
62. Added playerData.statusEffects array
63. Implemented updatePlayerStatusEffects() with DOT handling
64. Added bleeding effect (2 damage/sec for 10 sec)
65. Added shiv bleedChance (20%) on hit
66. Implemented enemy status effects array
67. Added updateEnemyStatusEffects() with DOT on enemies
68. Added pipe club knockback effect
69. Added stun baton stun effect (2 sec)
70. Added stunned state blocking enemy actions

### Iterations 71-80: Dodge Roll System
71. Added dodge() function with invincibility frames
72. Added dodgeCooldown (1.5 sec) tracking
73. Added stamina cost for dodge (20)
74. Added dodge direction based on movement keys
75. Added dodge tween with flicker animation
76. Added "DODGE!" floating text feedback
77. Added playerData.isInvincible flag
78. Updated damagePlayer() to check invincibility
79. Added space key binding for dodge
80. Added right-click binding for dodge

### Iterations 81-90: Sprint and Movement
81. Added sprint mechanic (Shift key)
82. Added sprint speed boost (150 -> 220)
83. Added stamina drain during sprint (15/sec)
84. Added fatigue movement penalty at 50%+ (10% slower)
85. Added fatigue movement penalty at 75%+ (25% slower)
86. Added stamina regeneration (5/sec when not attacking)
87. Added stamina display in UI
88. Added dodge cooldown decay in updatePlayer()
89. Implemented status effect speed modifiers
90. Added bleeding visual tint on bleeding enemies

### Iterations 91-100: Crawler Lunge Attack
91. Added crawler lunge detection (80 units, >30 units)
92. Added isLunging flag and lungeTimer
93. Added lungeVx/lungeVy velocity calculation
94. Implemented lunge movement in updateEnemies()
95. Added lunge hit detection on completion
96. Added lunge damage application with infection
97. Added lunge cooldown via lastAttack timer
98. Tested crawler behavior - lunges work correctly
99. Tuned lunge speed (300) and duration (0.3s)
100. Added lunge attack animation (movement speed burst)

### Iterations 101-110: Brute Charge Attack
101. Added brute charge detection (150 units, >50 units)
102. Added isCharging flag and chargeTimer
103. Added chargeAngle tracking for direction
104. Added charge visual indicator (orange tint)
105. Implemented charge movement (200 speed for 0.5s)
106. Added charge hit detection during movement
107. Added charge damage multiplier (1.5x)
108. Added wall collision stun (1 sec)
109. Added "STUN!" feedback on wall collision
110. Added screen shake on charge wall collision

### Iterations 111-120: Crafting System
111. Added RECIPES constant with tier1 and tier2 recipes
112. Added openCraftingMenu() at workbench interaction
113. Implemented canCraft() material checking
114. Implemented craftItem() material consumption
115. Added crafting result to inventory
116. Added crafting time passage (gameData.realTime)
117. Added "CRAFTED:" floating text feedback
118. Added sparkle effect on craft completion
119. Added tier2Unlocked flag for advanced recipes
120. Added "NEED MATERIALS" feedback when can't craft

### Iterations 121-130: Power Panel System
121. Added power panel texture generation
122. Added TILE.POWER_PANEL constant
123. Added power panel tile in hub generation
124. Added openPowerPanel() function
125. Implemented power budget calculation (500 max)
126. Added sector power costs (100/150/200/300)
127. Implemented power cycling (toggle first available)
128. Added "POWERED" feedback on sector enable
129. Added "UNPOWERED" feedback on sector disable
130. Added getPowerCost() helper function

### Iterations 131-140: Additional Features
131. Added storage locker texture generation
132. Added TILE.STORAGE_LOCKER constant
133. Added storage locker tile in hub
134. Added electronics floor drop texture
135. Added electronics to drop table (5% chance)
136. Added data chip handling for tier 2 unlock
137. Added "TIER 2 UNLOCKED!" feedback
138. Added escape pod interaction messages
139. Added "NEED KEYCARD" and "NO POWER" feedback
140. Updated help hints in UI

## Feedback Fixes (2026-01-11)

### Fix 1: Health item collection on floor
**Issue:** Items dropped by enemies were immediately added to inventory instead of appearing on the floor for collection.

**Solution:**
1. Created floor item textures for all item types (medkit, scrap, cloth, chemicals, food, water, antidote)
2. Added `floorItems` array and `floorItemGroup` for tracking floor items
3. Rewrote `dropItem()` to spawn visible sprites on the floor with bobbing animation
4. Added weighted drop system - health items (medkit) now have 15% drop chance, consumables have lower chances
5. Added `collectFloorItems()` function that checks player proximity (25px range) and auto-collects items
6. Items show visual feedback with floating text and sparkle effects on collection

**Changes made:**
- BootScene: Added 7 floor item textures (floorItem_medkit, floorItem_scrap, etc.)
- initGameState: Added `this.floorItems = []`
- loadSector: Added floorItemGroup creation and clearing
- dropItem: Complete rewrite - spawns sprites with tween animation
- collectFloorItems: New function for proximity-based auto-collection
- update: Added `collectFloorItems()` call

**Testing:**
- Verified floor items spawn when enemies die
- Verified items have bobbing animation
- Verified player auto-collects items when walking over them
- Verified inventory updates correctly on collection

### Fix 2: Remove combo system
**Issue:** Kill streak/combo system was not needed for this survival horror game.

**Removed:**
- `maxKillStreak` stat tracking
- `killStreak` and `killStreakTimer` variables
- `killStreakText` UI element
- `updateKillStreak()` function
- Kill streak logic in `killEnemy()`
- Streak messages (TRIPLE KILL, QUAD KILL, etc.)
- Streak display in debug overlay, game over, and victory screens

**Testing:**
- Verified game runs without JavaScript errors
- Verified game state remains 'playing'
- All kill streak UI and logic removed cleanly

### Fix 3: Add room persistence
**Issue:** Rooms reset when leaving and re-entering - enemies respawned, blood disappeared.

**Solution:**
1. Added `sectorStates` object to track per-sector state (enemies, blood splatters, visited flag)
2. Added `saveSectorState()` - saves surviving enemies (position, HP) and blood splatters before leaving
3. Added `restoreSectorState()` - recreates enemies and blood from saved state on return
4. Modified `loadSector()` to save state before clearing, and either spawn fresh enemies (first visit) or restore saved state (return visit)
5. Modified `createEnemy()` to return the enemy object for HP restoration

**Changes made:**
- initGameState: Added `this.sectorStates` with entries for all 5 sectors
- loadSector: Added save state before clearing, conditional spawn/restore based on visited flag
- saveSectorState: New function - serializes enemies and blood splatters
- restoreSectorState: New function - recreates enemies and blood from saved data
- createEnemy: Now returns the created enemy object

**Testing:**
- Verified no JavaScript errors
- Verified enemies persist when leaving and returning to a sector
- Verified blood splatters persist between visits
- Verified first visit spawns fresh enemies, return visits restore saved state

### Fix 4: Fix room transition spawn positions
**Issue:** Player always spawned at the same fixed position regardless of which door they used to enter.

**Solution:**
1. Modified `checkDoorTransition()` to determine entry direction based on door position (top/bottom/left/right)
2. Modified `loadSector()` to accept an entryDirection parameter
3. Added spawn positioning logic: when exiting from one side, spawn on the opposite side of the new room
   - Exit from top → spawn at bottom
   - Exit from bottom → spawn at top
   - Exit from left → spawn at right
   - Exit from right → spawn at left

**Changes made:**
- checkDoorTransition: Added entry direction calculation based on door tile position
- loadSector: Added entryDirection parameter and spawn positioning switch statement

**Testing:**
- Exit hub from bottom (to storage) → spawn at top of storage ✓
- Exit storage from top (to hub) → spawn at bottom of hub ✓
- No JavaScript errors ✓
