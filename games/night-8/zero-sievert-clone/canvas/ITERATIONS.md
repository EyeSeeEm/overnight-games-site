# Zero Sievert Clone - Canvas Iterations

## Expand Passes (20 required)

1. Added player with WASD movement and mouse aim
2. Added 8-directional movement with normalized diagonal speed
3. Added sprint system with stamina drain
4. Added 4 weapon types (PM Pistol, Skorpion, Shotgun, AK-74)
5. Added weapon firing with cooldown based on fire rate
6. Added bullet spread system based on weapon accuracy
7. Added shotgun pellet mechanics (8 pellets per shot)
8. Added reloading system with weapon-specific times
9. Added 5 enemy types (Wolf, Boar, Bandit Melee/Pistol/Rifle)
10. Added enemy AI with idle, patrol, and alert states
11. Added ranged enemy shooting behavior
12. Added melee enemy charge behavior
13. Added vision cone system (90-degree forward view)
14. Added fog of war based on vision cone
15. Added procedural map generation (40x40 tiles)
16. Added buildings with walls, floors, and doors
17. Added trees and bushes for cover
18. Added loot containers with healing/ammo/weapons
19. Added health and bleeding system
20. Added extraction point with timer-based extraction

## Polish Passes (20 required)

1. Improved player sprite with direction indicator
2. Improved enemy sprites with facing direction lines
3. Improved bullet tracer effects with fade
4. Improved muzzle flash particles
5. Improved blood splatter system on hits
6. Improved death blood pools
7. Improved HP bar with color gradient
8. Improved stamina bar display
9. Improved enemy HP bars above units
10. Improved vision cone visual (subtle yellow overlay)
11. Improved fog of war gradients
12. Improved building tile colors (walls, floors)
13. Improved tree and bush details
14. Improved extraction zone pulsing effect
15. Improved extraction progress bar
16. Improved HUD layout with weapon info
17. Improved score/kills/loot display
18. Improved menu screen with controls list
19. Improved game over screen with statistics
20. Improved extraction success screen

## Refine Passes (20 required)

1. Fixed vision cone angle calculation
2. Fixed enemy alert state persistence
3. Fixed enemy patrol behavior
4. Fixed ranged enemy engagement distance
5. Fixed bullet collision detection
6. Fixed bleeding damage over time
7. Fixed stamina regeneration rate
8. Fixed diagonal movement normalization
9. Fixed camera smoothing
10. Fixed map boundary clamping
11. Fixed loot container interaction range
12. Fixed weapon switching logic
13. Fixed reload cancellation on weapon switch
14. Fixed enemy spawn positions
15. Fixed loot spawn balance (2:1 healing to weapons)
16. Fixed extraction timer reset on exit
17. Fixed score calculation for different actions
18. Fixed death check timing
19. Fixed HUD text positioning
20. Fixed debug overlay information

## Feature Verification Checklist

- [x] WASD movement
- [x] Mouse aim (360 degrees)
- [x] LMB fire weapon
- [x] R reload
- [x] E interact/loot
- [x] 1-4 weapon switching
- [x] Shift sprint
- [x] Q debug overlay
- [x] 4 weapons (PM Pistol, Skorpion, Pump Shotgun, AK-74)
- [x] 5 enemies (Wolf, Boar, Bandit Melee/Pistol/Rifle)
- [x] Health + Bleeding system
- [x] Vision cone (90 degrees)
- [x] Fog of war
- [x] Loot containers
- [x] Extraction point
- [x] Score system
- [x] Forest zone with buildings
- [x] Win condition (extraction)
- [x] Lose condition (death)

## Post-Mortem

### What Went Well
- Vision cone creates tension and stealth opportunities
- Enemy AI provides challenging encounters
- Bleeding mechanic adds pressure to find healing
- Weapon variety offers different playstyles
- Extraction timer creates urgency

### What Went Wrong
- Initial fog of war was too dark
- Enemy spawn balance needed adjustment
- Loot distribution needed healing prioritization
- Camera smoothing took iteration to feel right

### Time Spent
- Initial build: ~50 minutes
- Expand passes: ~40 minutes
- Polish passes: ~30 minutes
- Refine passes: ~25 minutes
- Testing and fixes: ~15 minutes
- Total: ~160 minutes (2h 40m)

## Technical Notes

### Controls
- WASD: Move (8 directions)
- Mouse: Aim (360 degrees)
- LMB: Fire weapon
- R: Reload
- E: Interact/Loot
- 1-4: Switch weapons
- Shift: Sprint (drains stamina)
- Q: Toggle debug overlay

### GDD Features Implemented (MVP)
All MVP features from the GDD have been implemented:
- Forest zone with procedural generation
- 4 weapons (PM Pistol, Skorpion, Pump Shotgun, AK-74)
- Health + Bleeding (no radiation, hunger, fracture)
- 5 enemy types (Wolf, Boar, Bandit Melee/Pistol/Rifle)
- Simple arcade loop: Spawn → Loot → Extract → Score → Restart
- Extraction point visible on HUD

### Combat Formulas
- Bullet Spread = weapon.spread * random(-0.5, 0.5) in radians
- Damage = weapon.damage (shotgun: damage * pellets)
- Bleeding = random chance on hit (30-40%)
- Bleeding Damage = bleeding * dt / 1000
- Bleeding Recovery = bleeding - dt / 5000

### AI Behavior
- Idle: Random patrol with occasional direction changes
- Alert: Chase player for 3 seconds after losing sight
- Melee: Move to close range, deal damage on contact
- Ranged: Maintain 80-150px range, shoot periodically
