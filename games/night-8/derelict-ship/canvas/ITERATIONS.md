# Derelict Ship - Canvas Iterations

## Initial Build Summary
- Two game modes: Ship (top-down) and Space (flying between ships)
- Darkwood-style vision cone system (90 degrees, raycasting)
- O2 constantly draining - core tension mechanic
- 3 ships to explore progressively (Tutorial, Derelict Alpha, Final)
- 4 enemy types (Crawler, Shambler, Stalker, Ship Boss)
- 4 weapons (Pipe, Pistol, Shotgun, SMG)
- Procedural ship generation with connected rooms
- Life support rooms refill O2
- Pickup system (O2 canisters, medkits, ammo, weapons)
- Full UI (O2 bar, HP bar, weapon display, inventory)
- Debug overlay (Q key)

## Expand Passes (20 required)
1. Added extended color palette for floors, walls, nebula, asteroids
2. Added metal floor tile grid patterns with rivets
3. Added wall panel detailing with corner rivets
4. Added floor grate patterns on alternating tiles
5. Added hazard stripes near room edges
6. Added room props system (crates, corpses, consoles, debris, barrels)
7. Added flickering light effect for some rooms
8. Added prop drawing with unique visuals per type
9. Added ambient dust particle system
10. Added spark particles from debris props
11. Added O2 particles from life support terminals
12. Added gravity to spark particles
13. Added pixelated asteroid rendering for space mode
14. Added detailed derelict ship rendering with hull plating
15. Added nebula background with parallax scrolling
16. Added improved player ship with wings and cockpit
17. Added docking port glow indicator on ships
18. Added life support terminal with glowing screen
19. Added exit hatch with green glow and arrow indicator
20. Increased vision range from 300 to 350 for better gameplay

## Polish Passes (20 required)
1. Improved player character with space suit design and visor
2. Added O2 tank backpack to player sprite
3. Added arm holding weapon detail to player
4. Improved Crawler enemy with legs and glowing eyes
5. Improved Shambler enemy with bulky body and reaching arms
6. Improved Stalker enemy with menacing red eyes
7. Improved Ship Boss with pulsating body and tentacles
8. Reduced darkness overlay from 0.85 to 0.70 for visibility
9. Added vision cone tint with warm color
10. Improved bullet visuals and glow effects
11. Added engine glow with multi-layer flame effect
12. Added secondary nebula cloud for depth
13. Added variable star brightness in space
14. Improved blood pool rendering with ellipse shape
15. Added corpse prop with blood pools
16. Added console prop with flickering screen
17. Fixed debug display for Running status
18. Improved particle damping for dust vs other types
19. Added particle gravity system for sparks
20. Enhanced prop visibility in vision cone

## Refine Passes (20 required)
1. Matched floor colors to dark industrial reference style
2. Matched wall colors to dark metal panel style
3. Matched hazard stripe yellow/black pattern
4. Added proper grid lines on floor tiles
5. Matched player ship color to yellow like reference
6. Matched asteroid pixelated style from reference
7. Matched derelict ship hull plating pattern
8. Matched nebula orange/brown tones from reference
9. Added proper window patterns on derelict ships
10. Matched O2 terminal blue glow style
11. Matched exit indicator green color
12. Added damage marks to derelict ships
13. Refined vision cone warm lighting tint
14. Matched enemy color palette to dark tones
15. Added boss central eye matching reference
16. Refined blood color to dark red
17. Matched crate industrial style
18. Refined barrel hazard stripe pattern
19. Matched spark particle orange color
20. Refined overall dark horror atmosphere

## Feature Verification Checklist
- [x] Two game modes (Ship + Space)
- [x] Vision cone limiting visibility
- [x] O2 constantly draining
- [x] Running uses more O2
- [x] Life support rooms refill O2
- [x] Combat drains extra O2
- [x] 4 enemy types with behaviors
- [x] Ship Boss on final ship
- [x] 4 weapons (melee + ranged)
- [x] Procedural ship generation
- [x] Door transitions between rooms
- [x] Space flight between derelicts
- [x] Asteroid hazards in space
- [x] Docking with ships
- [x] Item pickup system
- [x] Consumables (O2, medkits)
- [x] Victory condition (escape final ship)
- [x] Death conditions (O2 or HP depleted)
- [x] Debug overlay (Q key)

## Post-Mortem
### What Went Well
- Vision cone system creates good tension
- Procedural ship generation works smoothly
- Dual mode (ship/space) transition works well
- Ambient particle effects add atmosphere
- Metal floor tile patterns look industrial

### What Went Wrong
- Initial darkness level was too high
- Debug display showed undefined for running status (fixed)
- Had to iterate on prop visibility in vision cone

### Time Spent
- Initial build: ~20 minutes
- Expand passes: ~35 minutes
- Polish passes: ~25 minutes
- Refine passes: ~20 minutes
- Total: ~100 minutes
