# Iteration Log: Derelict Ship (Phaser)

## Reference Analysis
- Main colors: Dark grays (#2a2a2a), blood red (#6a2020), dark backgrounds (#0a0808)
- Art style: Top-down 2D with Darkwood-style vision cone, dark atmospheric horror
- UI elements: O2 bar (blue), HP bar (red), ship integrity, sector indicator, messages
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
1. Initial build - Phaser 3 structure with BootScene and GameScene
2. Created dynamic textures for floor, wall, player, enemies, items, blood
3. Implemented procedural room generation with corridors
4. Added player with WASD movement and mouse aiming
5. Created 90-degree vision cone with darkness overlay
6. Implemented O2 drain system with different rates (idle/walk/run/combat)
7. Added HP system with enemy damage
8. Created Crawler and Shambler enemies with patrol/chase AI
9. Added blood stain effects for atmosphere
10. Implemented UI bars (O2, HP, integrity, messages)

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
23. [x] Enhanced blood particles with tweens (more for crits)
24. [x] Kill streak feedback messages (TRIPLE KILL, QUAD KILL, etc.)
25. [x] Healing particles when using medkit (green)
26. [x] O2 pickup floating text and particles (blue)
27. [x] Item pickup sparkle effect with tweens
28. [x] Death burst particle effect for killed enemies
29. [x] Kill streak display (2x STREAK and up)
30. [x] Visual effect overlays (damage, low health)

## Iterations 31-40: Final Polish
31. [x] Enhanced game over screen with detailed stats
32. [x] Performance rating on death (LOST/SURVIVOR/FIGHTER/WARRIOR)
33. [x] Enhanced victory screen with detailed stats
34. [x] Efficiency rating system (S/A/B/C/D) for victory
35. [x] Max kill streak tracking
36. [x] Kill streak timer decay system (3 second window)
37. [x] Items picked up tracking
38. [x] Attacks made tracking in debug overlay
39. [x] Time survived/elapsed display in end screens
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
- [x] Items: O2 canisters and medkits with effects
- [x] Victory condition: reach escape pod
- [x] Critical hit system
- [x] Kill streak system
- [x] Debug overlay
- [x] Enhanced end screens with stats

## Final Comparison
- Dark atmospheric style achieved with #0a0808 background
- Vision cone creates tension (can't see behind)
- O2 constantly draining creates urgency
- Phaser 3 Canvas renderer for headless compatibility
- Phaser tweens used for smooth particle animations
- Full visual feedback system (floating text, screen effects, particles)

## Post-Mortem

### What Went Well
- Phaser's tween system made particle effects smooth and easy
- Dynamic textures created consistent dark atmosphere
- Scene management cleanly handled game states
- Stats tracking system mirrors canvas version for consistency
- setScrollFactor(0) essential for UI elements
- Floating text using Phaser text objects is cleaner than canvas

### What Went Wrong
- Vision cone masking more complex in Phaser than Canvas
- Some atmospheric effects (blood pooling) harder to achieve dynamically
- Darkness overlay required custom graphics rendering
- Phaser graphics API differs from Canvas composite operations

### Key Learnings
- Phaser excels at sprite-based games but requires workarounds for custom lighting
- Dynamic texture generation is key for asset-free development
- Phaser 3 Canvas renderer essential for headless browser testing
- Tweens are perfect for particle effects and floating text
- Consistent patterns between canvas/phaser versions makes porting easier

### Time Spent
- Initial build: ~35 minutes
- Iterations 11-20: ~25 minutes
- Iterations 21-30: ~20 minutes
- Iterations 31-40: ~20 minutes
- Total: ~100 minutes

### Difficulty Rating
Medium - Port from Canvas was straightforward but vision cone needed rework. Adding visual feedback was straightforward using Phaser tweens.

## Feedback Fixes (2026-01-10)

### Issues from Player Feedback:
1. [x] "Way too dark, can't see anything"
   → Reduced base darkness from 0.9 to 0.4 alpha
   → Increased flashlight cone length from 350 to 450 pixels
   → Added graduated multi-layer lighting for smooth effect
   → Increased ambient light radius to 70-100 pixels

2. [x] "No real visibility check mechanics - enemies should only be visible where player is looking"
   → Added updateEntityVisibility() function
   → Enemies now fade to 15% alpha when outside vision cone
   → Items fade to 30% alpha when outside vision cone
   → Smooth fade transitions between visible/hidden states
   → Both vision cone and ambient light radius affect visibility

### Verification:
- Tested gameplay with new lighting system
- Floor tiles, items, blood stains all clearly visible
- Vision cone properly illuminates forward direction
- Enemies fade out when not looking at them
- Visibility updates smoothly as player rotates

## Feedback Fixes (2026-01-11) - Round 2

### Fix 1: Make game brighter overall
- Problem: Game still too dark after first round of fixes
- Solution:
  - Brightened all COLORS values: FLOOR 0x2a2a2a → 0x404040, WALL 0x1a1a1a → 0x303030, etc.
  - Reduced base darkness alpha from 0.4 → 0.2
  - Brightened floor tile edge lines from 0x1a1a1a → 0x2a2a2a
  - Updated background color from #0a0808 → #151515
- Result: Much better visibility, floor/walls clearly distinguishable, items easy to spot

### Fix 2: Fix viewcone - it should REVEAL not HIDE
- Problem: Viewcone was adding light on top of darkness (wrong approach)
- Solution:
  - Completely rewrote updateLighting() function
  - Now draws darkness with a HOLE for the vision cone
  - Uses path winding to cut out cone shape from darkness layer
  - Multiple graduated layers for smooth edge falloff
  - Areas INSIDE cone are fully visible (no darkness)
  - Areas OUTSIDE cone are heavily darkened (0.85 alpha)
- Result: Proper Darkwood-style reveal system - cone reveals, darkness hides

### Fix 3: Enemies only visible when inside player viewcone
- Problem: Enemies were still slightly visible (0.15 alpha) outside viewcone
- Solution:
  - Changed targetAlpha from 0.15 to 0 when outside viewcone
  - Enemies now completely invisible when not in cone or ambient light
  - Items also hidden completely outside viewcone
  - Faster fade (0.3 interpolation) for snappier visibility response
- Result: True stealth horror - enemies appear suddenly when looked at

### Fix 4: Add spaceship phase after tutorial escape
- Problem: Game just ended after reaching escape pod
- Solution:
  - Created new SpaceshipScene class with space flight mechanics
  - Victory condition now transitions to Spaceship scene instead of ending
  - Player flies between derelict ships in space with WASD controls
  - 4 derelict ships with varying difficulty levels (1-4 stars)
  - Docking with a ship starts a new Game level at that difficulty
  - Player HP carries over (with +20 healing between ships)
  - Stats tracked across multiple ships (total kills, ships explored)
  - Starfield background with twinkling stars
- Result: Meta-loop gameplay - escape → fly → dock → explore → escape → repeat

### Fix 5: Remove combo system
- Problem: Kill streak/combo system not needed for survival horror
- Solution:
  - Removed killStreak and killStreakTimer variables
  - Removed maxKillStreak from stats tracking
  - Removed kill streak text display (killStreakText)
  - Removed updateKillStreak() method
  - Removed streak messages ("TRIPLE KILL", etc)
  - Removed streak references from game over/victory screens
  - Removed streak from debug overlay
- Result: Cleaner survival horror experience without arcade-style combo feedback

---

## Second 100 Iterations (101-200)

## Iterations 101-110: Sector System Enhancement
101. Added proper 6-sector progression structure with themed areas
102. Implemented sector size scaling (larger sectors as difficulty increases)
103. Added sector-specific room generation rules
104. Implemented sector transitions with loading messages
105. Added sector difficulty multipliers for enemies
106. Enhanced room variety with small/medium/large templates
107. Added corridor generation between rooms
108. Implemented dead-end rooms with better loot
109. Added guaranteed spawn positions for keycards
110. Enhanced exit placement logic per sector

## Iterations 111-120: Enemy Type Expansion
111. Added Stalker enemy type (fast, ambush predator)
112. Implemented Stalker invisibility when stationary in darkness
113. Added Bloater enemy type (slow, explodes on death)
114. Implemented Bloater explosion damage in radius
115. Added Hunter enemy type (fast, persistent pursuit)
116. Implemented Hunter tracking behavior (remembers last position)
117. Added Mimic enemy type (disguised as container)
118. Implemented Mimic reveal animation on approach
119. Enhanced enemy spawn rules by sector tier
120. Added unique enemy textures for each type

## Iterations 121-130: Boss Implementation
121. Designed The Gestalt boss (sector 6 guardian)
122. Implemented boss Phase 1 (slow approach, spawn crawlers)
123. Implemented boss Phase 2 (faster, tentacle sweep)
124. Added boss health bar UI element
125. Created tentacle sweep attack animation
126. Implemented boss arena room generation
127. Added boss death sequence and Gold Keycard drop
128. Enhanced boss visual design (amalgamation look)
129. Added boss spawn sound cue
130. Balanced boss HP and damage values per GDD

## Iterations 131-140: Weapon System Expansion
131. Added Wrench melee weapon (25 dmg, can repair)
132. Added Fire Axe melee weapon (40 dmg, breaks doors)
133. Added Stun Baton melee weapon (15 dmg, 2s stun)
134. Added Plasma Cutter melee weapon (50 dmg, ignores armor)
135. Implemented weapon durability display in HUD
136. Added weapon switching with number keys
137. Implemented weapon pickup from containers
138. Added weapon damage variation by type
139. Enhanced attack cooldown per weapon type
140. Added weapon-specific attack sounds placeholders

## Iterations 141-150: Ranged Weapon System
141. Implemented ranged weapon framework
142. Added Pistol (25 dmg, 2 shots/sec, 12 mag)
143. Added Revolver (45 dmg, 0.8 shots/sec, 6 mag)
144. Added SMG (15 dmg, 5 shots/sec, 30 mag)
145. Added Crossbow (35 dmg, 0.5 shots/sec, silent)
146. Added Flare Gun (10 dmg + fire area)
147. Implemented ammo system with stacking
148. Added reload mechanic and animation
149. Enhanced projectile physics and collision
150. Added muzzle flash visual effects

## Iterations 151-160: Keycard and Door System
151. Implemented Blue Keycard item (unlocks sector 3)
152. Implemented Red Keycard item (unlocks sector 4-5)
153. Implemented Gold Keycard item (unlocks escape pod)
154. Added keycard indicator icons to HUD
155. Enhanced locked door visual appearance
156. Added door unlocking animation and feedback
157. Implemented sector gate doors requiring keycards
158. Added keycard pickup floating text
159. Enhanced door power interaction
160. Added door breaking with Fire Axe option

## Iterations 161-170: Power Allocation System
161. Added power allocation terminal interaction
162. Implemented drag-and-drop power bar UI
163. Added Lights system (1 bar) with visible effect
164. Added Doors system (1 bar) for door operation
165. Added Scanner system (2 bars) with minimap blips
166. Added Life Support system (2 bars) O2 refill rooms
167. Added Security system (2 bars) with turrets
168. Added Engine system (3 bars) for escape pod
169. Implemented power reallocation delay (3 seconds)
170. Added power terminal spawn per sector

## Iterations 171-180: Crafting System
171. Added workbench object in sectors 2, 4, 6
172. Implemented crafting UI interface
173. Added Medkit (S) recipe (Bandages + Antiseptic)
174. Added Repair Kit recipe (Scrap Metal + Duct Tape)
175. Added Pipe Bomb recipe (Scrap Metal + Fuel Cell)
176. Added Molotov recipe (Fuel Cell + Cloth)
177. Added crafting material items throughout map
178. Implemented material stacking in inventory
179. Added crafting success feedback
180. Enhanced workbench visual indicator

## Iterations 181-190: HUD and UI Polish
181. Added minimap toggle (M key) with 200x200 display
182. Enhanced O2 bar with critical pulse below 20
183. Added integrity warning flash at 25%
184. Implemented power usage icons in bottom bar
185. Added inventory screen pause menu (Tab key)
186. Enhanced quick slot visual feedback
187. Added weapon durability bar
188. Implemented ammo counter for ranged weapons
189. Added scanner warning pulse effect
190. Enhanced message log scrolling

## Iterations 191-200: Final Polish Round 2
191. Optimized enemy pathfinding performance
192. Enhanced vision cone edge smoothing
193. Added footstep sound timing hooks
194. Implemented ambient ship sound system
195. Enhanced death screen statistics display
196. Added meta-progression framework (unlocks)
197. Implemented difficulty scaling hooks
198. Enhanced spaceship phase with fuel system
199. Added more derelict ship variety
200. Final balance pass on O2 drain rates
