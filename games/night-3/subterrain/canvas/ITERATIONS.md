# Iteration Log: Subterrain (Canvas)

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
1. Initial build - Created hub sector with diamond floor pattern, doors to other sectors
2. Added survival meters UI (HP, HUN, THI, FAT, INF) - positions match reference style
3. Added enemy types with correct colors (shambler tan, spitter green, brute large)
4. Added blood splatter effects when enemies die
5. Added cocoon enemy type with glowing effect and spawn mechanic
6. Added global infection timer with red warning display
7. Added quick slots for consumable items (1-4 keys)
8. Added facilities (workbench, bed, storage, power panel, medical station)
9. Added darkness overlay for unpowered sectors
10. Added infection visual effect (green screen tint at high infection)

## Iterations 11-20: Core Polish
11. [x] Debug overlay (press Q to toggle) - shows all game stats
12. [x] Stats tracking system - killCount, totalDamageDealt, totalDamageTaken, critCount
13. [x] Critical hit system (15% chance, 2x damage) with yellow damage numbers
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
28. [x] Container looting tracking
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
38. [x] Floating text fade-out animation
39. [x] Screen effect smooth decay
40. [x] Full debug info display with all tracked stats

## Feature Verification
- [x] WASD movement: tested, works
- [x] Mouse aim: player rotates toward cursor
- [x] Click to attack: melee attack with fists works
- [x] Survival meters display and decay over time
- [x] Global infection increases over time
- [x] Hub sector safe zone (no enemies)
- [x] Door transitions between sectors
- [x] Enemy spawning in non-hub sectors
- [x] Enemy AI chases player
- [x] Loot containers can be looted
- [x] Items can be used with number keys
- [x] Victory condition: escape pod with keycard
- [x] Game over conditions: health 0, infection 100, global 100
- [x] Critical hit system
- [x] Kill streak system
- [x] Debug overlay
- [x] Enhanced end screens with stats

## Final Comparison
- Diamond floor pattern matches reference style
- Dark industrial color palette achieved
- Survival meters positioned like reference (top-left)
- Global infection counter in bottom-right like reference
- Enemy designs simplified but functional
- Blood effects present with enhanced particles
- Room-based sector layout implemented
- Full visual feedback system (floating text, screen effects, particles)

## Post-Mortem

### What Went Well
- Multiple survival meters create meaningful resource management decisions
- Global infection timer adds constant urgency without feeling unfair
- Sector-based map design gives clear progression goals
- Enemy variety (shambler, crawler, spitter, brute, cocoon) keeps combat interesting
- Darkness in unpowered sectors creates genuine tension
- Critical hit and kill streak systems make combat more satisfying
- Floating text feedback makes all actions feel responsive

### What Went Wrong
- Balancing 5 survival meters simultaneously required constant tweaking
- Door transitions sometimes felt abrupt without loading screens
- Enemy spawning near sector entrances could feel unfair

### Key Learnings
- Survival games need carefully balanced decay rates - too fast feels punishing, too slow removes tension
- Canvas 2D handles multiple overlapping systems (meters, enemies, effects) efficiently
- Visual feedback (screen tints, blood, floating text) essential for communicating game state
- Stats tracking adds replay value and makes end screens more meaningful

### Time Spent
- Initial build: ~40 minutes
- Iterations 11-20: ~25 minutes
- Iterations 21-30: ~25 minutes
- Iterations 31-40: ~20 minutes
- Total: ~110 minutes

### Difficulty Rating
Medium - Balancing multiple survival systems was the main challenge. Adding visual feedback was straightforward with the floating text system.

---

## Feedback Fixes (2026-01-10)

### Issues from Player Feedback:
1. [x] "When entering a new area, player is just spawned in center of room" → Fixed entry position to spawn near the door leading back to previous sector
2. [x] "sometimes on an object where he gets stuck" → Added corridor protection in addInternalWalls() to keep center paths clear
3. [x] "Entry position must match exit direction!" → Added findDoorPosition() and getDoorTypeForSector() to calculate correct spawn point

### Technical Changes:
- Modified `checkDoorTransition()` to track previous sector and find return door position
- Added `getDoorTypeForSector()` helper to map sector names to door tile types
- Added `findDoorPosition()` helper to find door tile location with entry offset
- Modified `checkCollision()` to allow movement near edge doors (fixes bounding box issue)
- Modified `addInternalWalls()` to keep 3-tile corridors clear from center to all edges

### Verification:
- Player enters Storage from Hub → spawns at top near DOOR_HUB (return to hub)
- Player enters Hub from Storage → spawns at bottom near DOOR_STORAGE
- Clear corridors to all 4 doors in Hub sector
- No objects spawn in door access corridors
- All feedback items addressed

---

## Feedback Fixes Session 2 (2026-01-11)

### Iteration 44: Fix Health Item Collection
**Feedback:** "Fix health item collection"

**Problem:**
- No ground pickups existed - only container looting
- No visual feedback when looting containers

**Implementation:**
- Added `groundPickups` array for items on the ground
- Created `spawnGroundPickups()` function that spawns health, ammo, and antidote pickups in non-hub sectors
- Created `checkGroundPickups()` function to auto-collect pickups when player walks over them
- Created `drawGroundPickups()` function with bobbing animation and glow effects
- Health pickups: Red box with white cross, heals +15 HP
- Ammo pickups: Yellow box, gives +5 ammo and auto-equips pistol
- Antidote pickups: Green syringe, reduces infection by 15
- Added floating text feedback to `lootContainer()` function showing item collected

**Technical Changes:**
- Added `groundPickups = []` array
- Added `spawnGroundPickups(sectorName)` - spawns 3-6 pickups per sector
- Added `checkGroundPickups()` - checks 24px radius collision
- Added `drawGroundPickups()` - renders with time-based bobbing and glow
- Updated `lootContainer()` to show floating text for each item looted
- Each pickup type has distinct visual design

**Verification:**
- Ground pickups spawn in storage sector (3-5 health/ammo)
- Walking over pickups collects them automatically
- Floating text shows "+15 HP" or "+5 AMMO" on collection
- Container looting now shows "+1 [Item Name]" feedback

### Iteration 45: Fix Blood Pool Wiggle Bug
**Feedback:** "Fix blood pool wiggle bug"

**Problem:**
The `drawBlood()` function was calling `Math.random()` every frame to determine splatter positions, causing blood pools to "wiggle" as positions changed each frame.

**Implementation:**
- Modified blood splatter objects to store their irregular splatter positions on first draw
- Each blood splatter now has a `splatters` array containing pre-calculated angle/distance pairs
- Subsequent draws use the stored values instead of regenerating random positions

**Technical Changes:**
```javascript
// Before (buggy):
for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2;  // Random each frame!
    const dist = blood.size * 0.5 + Math.random() * blood.size * 0.5;
    ...
}

// After (fixed):
if (!blood.splatters) {
    blood.splatters = [];
    for (let i = 0; i < 5; i++) {
        blood.splatters.push({
            angle: Math.random() * Math.PI * 2,
            dist: blood.size * 0.5 + Math.random() * blood.size * 0.5
        });
    }
}
// Draw using stored values
```

**Verification:**
- Blood pools no longer wiggle/flicker
- Splatter patterns remain stable across frames

### Iteration 46: Add Room Persistence Across Visits
**Feedback:** "Add room persistence across visits"

**Problem:**
- Enemies respawned every time player entered a sector
- Blood splatters were cleared on sector transition
- Ground pickups were regenerated each visit

**Implementation:**
- Added `sectorStates` object to store sector data when leaving
- Created `saveSectorState(sectorName)` to deep-copy enemies, blood, and pickups
- Created `restoreSectorState(sectorName)` to restore saved state
- Modified `checkDoorTransition()` to save state before leaving and check for saved state on entry

**Technical Changes:**
```javascript
const sectorStates = {};

function saveSectorState(sectorName) {
    sectorStates[sectorName] = {
        enemies: enemies.map(e => ({...e})),
        bloodSplatters: bloodSplatters.map(b => ({...b, splatters: ...})),
        groundPickups: groundPickups.filter(p => p.sector === sectorName).map(p => ({...p}))
    };
}

function restoreSectorState(sectorName) {
    const state = sectorStates[sectorName];
    if (!state) return;
    enemies = state.enemies.map(e => ({...e}));
    bloodSplatters = state.bloodSplatters.map(b => ({...b}));
    // Restore ground pickups for this sector
    ...
}
```

**Verification:**
- Killed enemies stay dead when returning to sector
- Blood splatters persist across visits
- Collected pickups don't respawn
- First visit to sector generates new enemies/pickups
- Subsequent visits restore saved state

**Test Results:**
```
Step 1: Moving to storage sector...
After entering storage: { sector: 'storage', enemies: 4, pickups: 3 }
Step 2: Creating blood splatter...
Before returning to hub: { enemies: 3, bloodSplatters: 1, pickups: 3 }
Step 3: Returning to hub...
Back in hub, saved states: [ 'hub', 'storage' ]
Step 4: Returning to storage...
After returning to storage: { sector: 'storage', enemies: 3, bloodSplatters: 1, pickups: 3 }
PERSISTENCE: PASS
```

**Total Iterations Logged:** 46 (40 initial + 6 feedback fixes)

---

## Expansion Session (2026-01-11) - 100 Iterations

### Iterations 47-56: Weapon System
47. [x] Added WEAPONS constant with 5 weapon types (fists, shiv, pipeClub, stunBaton, pistol)
48. [x] Added weapon damage, speed, durability, type, and range properties
49. [x] Added player.weaponDurability tracking object
50. [x] Implemented shiv with 10 damage, 0.4s speed, 20 durability, 20% bleed chance
51. [x] Implemented pipeClub with 20 damage, 1.0s speed, 30 durability, knockback effect
52. [x] Implemented stunBaton with 15 damage, 0.7s speed, 25 durability, 2s stun effect
53. [x] Updated attack() to use WEAPONS constant for damage and speed
54. [x] Added weapon durability reduction on attack
55. [x] Added weapon break message when durability reaches 0
56. [x] Added weapon-specific swing particle colors

### Iterations 57-66: Crafting System
57. [x] Added RECIPES constant with tier1 and tier2 arrays
58. [x] Added Tier 1 recipes: Shiv, Pipe Club, Bandage, Torch, Barricade
59. [x] Added Tier 2 recipes: Pistol, Pistol Ammo x10, Antidote, Stun Baton, Armor Vest
60. [x] Created craftItem() function with material checking
61. [x] Added material consumption in crafting
62. [x] Added time passage during crafting
63. [x] Added weapon crafting results with durability assignment
64. [x] Added ammo crafting result (+10 ammo)
65. [x] Added armor crafting result (25% damage reduction)
66. [x] Added item crafting results (add to inventory)

### Iterations 67-76: Dodge Mechanic
67. [x] Added player.dodging, dodgeTimer, dodgeCooldown, dodgeDir properties
68. [x] Created startDodge() function triggered by right-click
69. [x] Added 20 stamina cost for dodge
70. [x] Added 0.3s invincibility frames during dodge
71. [x] Added 1.5s cooldown between dodges
72. [x] Dodge direction follows movement keys or facing direction
73. [x] Added dodge movement at 300 speed
74. [x] Created updateDodge() function with collision checking
75. [x] Added dodge particles (blue trails)
76. [x] Player immune to damage during dodge (melee and projectile)

### Iterations 77-86: Enemy AI Improvements
77. [x] Added enemy.stunned and enemy.stunTimer properties
78. [x] Added enemy.bleeding and enemy.bleedTimer properties
79. [x] Stunned enemies don't move or attack
80. [x] Bleeding enemies take 2 damage/second
81. [x] Brute charge mechanic - starts charge when player 100-300px away
82. [x] Brute charge at 3x normal speed
83. [x] Brute stuns self for 1.5s if hits wall during charge
84. [x] Brute charge does 1.5x damage with big knockback (40px)
85. [x] Added CHARGE! warning floating text when brute starts charging
86. [x] Added STUNNED! floating text when brute hits wall

### Iterations 87-96: Acid Puddles
87. [x] Added acidPuddles array
88. [x] Created updateAcidPuddles() function
89. [x] Acid puddles deal 2 damage/second to player
90. [x] Acid puddles add 2 infection/second to player
91. [x] Acid puddles last 3 seconds
92. [x] Spitter projectiles create puddles on hit
93. [x] Puddles created on wall collision too
94. [x] Created drawAcidPuddles() with alpha fade
95. [x] Added bubbling animation effect to puddles
96. [x] Dodging makes player immune to acid damage

### Iterations 97-106: Hallucination System
97. [x] Added hallucinations array
98. [x] Created updateHallucinations() function
99. [x] Hallucinations spawn at infection > 50%
100. [x] Spawn rate increases with infection level
101. [x] Hallucinations appear as random enemy types (shambler, crawler, spitter)
102. [x] Hallucinations flicker with random alpha changes
103. [x] Hallucinations fade out over 0.5-2s
104. [x] Created drawHallucinations() with transparency
105. [x] Added infection visual effect (green tint at 75%+)
106. [x] Added random green screen flickers at high infection

### Iterations 107-116: Inventory UI Screen
107. [x] Added showInventory boolean state
108. [x] Tab key toggles inventory screen
109. [x] Created drawInventoryScreen() function
110. [x] 5-column grid layout for items
111. [x] Each item shows colored icon and name
112. [x] Item count displayed for stackable items
113. [x] Equipped weapon info panel
114. [x] Current durability display
115. [x] Ammo count display
116. [x] Armor status display when equipped

### Iterations 117-126: Map Screen
117. [x] Added showMap boolean state
118. [x] M key toggles map screen
119. [x] Created drawMapScreen() function
120. [x] Visual sector layout matching facility design
121. [x] Current sector highlighted with green border
122. [x] Powered sectors shown with green text
123. [x] Visited sectors show gray color
124. [x] Connection lines between sectors
125. [x] Power usage display (used/max)
126. [x] Legend explaining colors

### Iterations 127-136: Crafting Screen
127. [x] Added showCrafting boolean state
128. [x] E key at workbench toggles crafting screen
129. [x] Created drawCraftingScreen() function
130. [x] Recipe list with selection highlight
131. [x] Material requirements display
132. [x] Crafting time display
133. [x] Arrow keys navigate recipe selection
134. [x] Enter/C key crafts selected item
135. [x] Current materials panel
136. [x] Tier 2 unlock status display

### Iterations 137-146: Combat & Armor System
137. [x] Added player.armorReduction property
138. [x] Armor Vest gives 25% damage reduction
139. [x] Enemy melee damage reduced by armor
140. [x] Enemy projectile damage reduced by armor
141. [x] Brute charge damage reduced by armor
142. [x] Weapon switching with 5-9 keys
143. [x] Fatigue affects melee damage (60% at 75+, 80% at 50+)
144. [x] Thirst affects ranged accuracy (spread increases)
145. [x] Updated attack() with accuracy modifier
146. [x] Updated instructions hint at bottom of screen

**Total Iterations Logged:** 146 (46 previous + 100 expansion)
