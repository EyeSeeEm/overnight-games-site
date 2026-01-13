# Iterations Log - Wasteland Extraction (Zero Sievert Clone)

## Initial Implementation (Phase 1)
- **Date**: 2026-01-11
- **Features**: Complete core extraction shooter with test harness
- **Files**: game.js, test-harness-base.js, test-config.js, index.html
- **Test Result**: PASS - Harness verification passed

### Core Systems Implemented:
- Player with 8-directional movement (WASD)
- Mouse aiming (360 degrees)
- Shooting with accuracy cone system
- Dodge roll with i-frames and stamina cost
- Sprint system with stamina drain
- Weapon system with reload mechanics
- 4 weapon types (pistol, SMG, rifle, shotgun)
- 3 enemy types (bandit scout, bandit, bandit heavy)
- Enemy AI with patrol, alert, and combat states
- Line of sight detection for enemies
- Vision cone-based enemy awareness
- Procedural zone generation with obstacles
- Loot container system with random loot
- Extraction point system (3 second extract timer)
- Health and stamina bars
- Damage indicators for hit direction
- Screen shake effects
- Particle effects (muzzle flash, blood, dust)
- Full UI with health, ammo, rubles, enemy count, extraction direction

---

## Polish Iterations (Phase 3)

### Iteration 1: Enhanced Bullet Trails
- **Date**: 2026-01-11
- **Feature**: Multi-layer glow bullet trails
- **Changes**:
  - Added outer glow trail (orange, 15% opacity)
  - Added middle glow trail (bright orange, 25% opacity)
  - Added inner core trail (yellow, 40% opacity)
  - Added bullet impact glow effect
- **Result**: Bullets now have glowing trails for better visibility

### Iteration 2: Enhanced Enemy Death Effects
- **Date**: 2026-01-11
- **Feature**: Blood splatter and death particle system
- **Changes**:
  - Added gib particles (elliptical blood splatters with rotation)
  - Added blood pool particles (expanding dark pools that linger)
  - Added death flash (white explosion effect)
  - Added death ring (expanding shockwave)
  - Added smoke puffs (rising gray clouds)
- **Result**: Enemy deaths now have satisfying multi-particle feedback

### Iteration 3: Enhanced Extraction Point Effects
- **Date**: 2026-01-11
- **Feature**: Beacon-style extraction point visuals
- **Changes**:
  - Added rotating radial beam effects (8 beams)
  - Added outer glow with radial gradient
  - Added multiple pulsing rings at different rates
  - Added center beacon dot with pulse
  - Enhanced extracting state with intensified glow fill
  - Added gradient progress bar with border
- **Result**: Extraction points are now highly visible beacons

### Iteration 4: Footstep Dust Particles
- **Date**: 2026-01-11
- **Feature**: Movement feedback with dust particles
- **Changes**:
  - Added spawnFootstepDust function
  - Walking spawns subtle single dust puffs (15% chance)
  - Sprinting spawns larger triple dust clouds (40% chance)
  - Dust particles rise and fade with gradient rendering
- **Result**: Player movement now has environmental feedback

### Iteration 5: Bleeding Status Effect
- **Date**: 2026-01-11
- **Feature**: Survival status effect system
- **Changes**:
  - Added statusEffects object to Player (bleeding, heavyBleeding, radiation)
  - Bleeding deals 2 HP/sec damage, heavy bleeding deals 5 HP/sec
  - 30% chance to start bleeding when hit, 40% heavy bleed from big hits
  - Added bandages (3 starting) - press B to use
  - Bandages cure bleeding and heal 10 HP
  - Heavy bleeding downgrades to normal bleeding first
  - Added blood_drip particle type for bleed ticks
  - UI shows bleeding status and bandage count
- **Result**: Adds survival depth and resource management

### Iteration 6: Wolf & Ghoul Enemies
- **Date**: 2026-01-11
- **Feature**: Melee enemy types from GDD
- **Changes**:
  - Added melee weapon type (30px range, direct damage)
  - Added Wolf enemy: 40 HP, 130 speed, 15 damage, gray/blue color
  - Added Ghoul enemy: 50 HP, 100 speed, 12 damage, green color
  - Modified tryShoot() to handle melee attacks directly
  - Added spawnMeleeImpact() for claw/bite feedback
  - Melee enemies rush player when in combat state
- **Result**: Two new fast melee threats add variety to combat

### Iteration 7: Grenade System
- **Date**: 2026-01-11
- **Feature**: Throwable explosive grenades
- **Changes**:
  - Added grenades array for active grenades
  - Player starts with 2 grenades, press G to throw
  - Grenades travel with friction, explode after 2 seconds
  - 100px blast radius deals up to 80 damage (falloff with distance)
  - Player takes 50% reduced self-damage from own grenades
  - Added explosion effects: flash, fire ring, debris, smoke
  - Flashing red indicator when grenade is about to explode
  - UI shows grenade count with [G] key hint
- **Result**: Powerful area damage option for crowd control

### Iteration 8: Enemy Loot Drops
- **Date**: 2026-01-11
- **Feature**: Loot drops from killed enemies
- **Changes**:
  - Added lootDrops array for ground items
  - spawnEnemyLoot() creates drops on enemy death
  - Enemies always drop rubles (10-40)
  - 40% chance to drop ammo (5-15 rounds)
  - 20% chance to drop bandage
  - 10% chance to drop grenade
  - Loot auto-pickup within 25px of player
  - Loot pulses with glow effect and displays icons
  - Each loot type has distinct color coding
- **Result**: Combat rewards with risk/reward pickup gameplay

### Iteration 9: Radar Minimap
- **Date**: 2026-01-11
- **Feature**: Circular radar-style minimap
- **Changes**:
  - Added drawMinimap() function
  - Circular 120px radar in top-right corner
  - Player-centered view with direction indicator
  - Enemies shown with color-coded states (red=combat, orange=alert, pink=patrol)
  - Extraction points shown as green dots
  - Loot containers shown as orange squares
  - Ground loot shown as yellow dots
  - Obstacles rendered as brown rectangles
  - "RADAR" label below map
- **Result**: Better situational awareness and navigation

### Iteration 10: Weapon Swap System
- **Date**: 2026-01-11
- **Feature**: Weapon drops and swapping
- **Changes**:
  - Added droppedWeapons array for ground weapons
  - Enemies have 25% chance to drop their weapon on death
  - spawnWeaponDrop() creates weapon pickups with pulsing glow
  - Press Q near dropped weapon to swap
  - Old weapon drops on ground when swapping
  - Weapons display with icon and name label
  - Particle feedback on weapon pickup
  - UI shows Q - Swap Weapon hint
- **Result**: Tactical weapon scavenging adds depth to combat

### Iteration 11: Bandit Sniper Enemy
- **Date**: 2026-01-11
- **Feature**: Long-range sniper enemy type
- **Changes**:
  - Added Mosin Nagant sniper weapon (65 damage, 400 range, 30 RPM)
  - Added Bandit Sniper enemy (50 HP, 350 vision range)
  - Sniper behavior: stays stationary, retreats if player gets close
  - Narrow 60-degree vision angle for focused targeting
  - Slow speed (40) makes them positional threats
  - Brown/tan color for differentiation
- **Result**: Adds long-range threat requiring different tactics

### Iteration 12: Body Armor System
- **Date**: 2026-01-11
- **Feature**: Armor damage reduction
- **Changes**:
  - Added armor and maxArmor properties to Player (0-100)
  - 50% damage reduction when armor > 0
  - Armor takes 40% of incoming damage itself
  - 5% chance for enemies to drop armor plates (20-50 points)
  - Blue armor bar displayed below stamina
  - Armor pickup via loot drop system
- **Result**: Survivability improvement through gear scavenging

### Iteration 13: Medkit Healing System
- **Date**: 2026-01-11
- **Feature**: Large healing items
- **Changes**:
  - Added medkits property to Player (starts at 0)
  - Press H to use medkit (heals 50 HP)
  - Medkits also cure all bleeding effects
  - 3% chance for enemies to drop medkits
  - Red medkit icons in loot drops
  - UI shows medkit count with [H] hint
- **Result**: Emergency healing option for critical situations

### Iteration 14: Run Statistics System
- **Date**: 2026-01-11
- **Feature**: Kill tracking and end-of-run statistics
- **Changes**:
  - Added runStats object (kills, damageDealt, damageTaken, shotsFired)
  - Kills tracked on enemy death (bullets and grenades)
  - Damage dealt and shots fired tracked
  - Damage taken tracked with armor-reduced amounts
  - Stats reset on game start
  - Enhanced extraction screen showing all statistics
  - Health remaining shown with color coding
- **Result**: Meaningful feedback and performance metrics

### Iteration 15: Screen Damage Flash
- **Date**: 2026-01-11
- **Feature**: Red flash overlay when taking damage
- **Changes**:
  - Added damageFlash variable for intensity tracking
  - Triggered on player takeDamage (0.6 intensity)
  - Fades out over ~0.2 seconds
  - Red tint overlay across entire screen
  - Radial vignette effect for dramatic impact
- **Result**: Clear visual feedback when hit

### Iteration 16: Hit Markers
- **Date**: 2026-01-11
- **Feature**: Visual X markers when hitting enemies
- **Changes**:
  - Added hitMarkers array for tracking active markers
  - White X marker spawns on enemy hit
  - Red X marker spawns on kill
  - Markers scale down and fade over 0.3 seconds
  - updateHitMarkers and drawHitMarkers functions
  - Reset on game start
- **Result**: Satisfying combat feedback

### Iteration 17: Low Ammo & Health Warnings
- **Date**: 2026-01-11
- **Feature**: Pulsing warnings for critical states
- **Changes**:
  - Low ammo warning when <= 30% ammo (pulsing orange "LOW")
  - No ammo warning in red "NO AMMO!"
  - Critical health warning when <= 25% (pulsing red bar + "CRITICAL!")
  - Health bar pulses red when critical
  - All warnings use sinusoidal pulsing animation
- **Result**: Clear awareness of resource depletion

### Iteration 18: Reload Progress Bar
- **Date**: 2026-01-11
- **Feature**: Visual reload progress indicator
- **Changes**:
  - Progress bar appears below "RELOADING..." text
  - Shows reload completion percentage
  - Orange bar fills from left to right
  - 80px wide, positioned center-screen
- **Result**: Clear feedback on reload timing

### Iteration 19: Weighted Enemy Spawns
- **Date**: 2026-01-11
- **Feature**: Balanced enemy variety distribution
- **Changes**:
  - Added enemyWeights object for spawn probability
  - Bandit Scout: 30% (common basic enemy)
  - Bandit: 25% (moderate threat)
  - Bandit Heavy: 15% (tanky threat)
  - Wolf: 12% (fast melee)
  - Ghoul: 10% (melee swarm)
  - Bandit Sniper: 8% (rare dangerous threat)
  - selectWeightedEnemy() function for balanced selection
- **Result**: More balanced and interesting enemy composition

### Iteration 20: Enhanced Death Screen
- **Date**: 2026-01-11
- **Feature**: Statistics shown on death
- **Changes**:
  - Death screen now shows run statistics
  - Enemies eliminated count displayed
  - Damage dealt and taken shown
  - "Rubles lost" shown (what you would have extracted)
  - Improved layout and formatting
  - Darker overlay for better contrast
- **Result**: Feedback on performance even in failure

---

## Summary: 20 Polish Iterations Complete

Total features added through iterations 1-20:
1. Enhanced bullet trails with glow
2. Multi-particle death effects
3. Beacon-style extraction visuals
4. Footstep dust particles
5. Bleeding status effects with bandages
6. Wolf & Ghoul melee enemies
7. Grenade system with explosions
8. Enemy loot drops with auto-pickup
9. Radar minimap
10. Weapon swap system
11. Bandit Sniper enemy
12. Body armor damage reduction
13. Medkit healing items
14. Run statistics tracking
15. Screen damage flash
16. Hit markers on enemies
17. Low ammo/health warnings
18. Reload progress bar
19. Weighted enemy spawns
20. Enhanced death screen

