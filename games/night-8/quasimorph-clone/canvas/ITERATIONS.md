# Quasimorph Clone - Canvas Iterations

## Initial Build Summary
- Turn-based tactical extraction roguelike
- AP system (Sneak 1, Walk 2, Run 3)
- 4 weapons: Knife, Pistol, SMG, Shotgun
- Weapon durability and jamming mechanics
- 5 enemies: Guard, Soldier, Possessed, Bloater, Stalker
- Corruption system with 6 tiers (0-1000)
- Enemy transformation at high corruption
- Procedural station generation (8-12 rooms)
- Room types: Storage, Barracks, Medical, Armory, Corridor
- Shadowcasting visibility (8 tile range)
- Fog of war and explored areas
- Line of sight combat
- Extraction point objective
- Full UI with HP, AP, Corruption, Weapons, Items
- Debug overlay (Q key)
- Auto-end turn when AP depleted
- "No AP!" floating text feedback

## Expand Passes (20 required)
1. Added detailed floor tile patterns with grid lines
2. Added corner rivets to floor tiles
3. Added grate patterns on alternating tiles
4. Added wall panel detailing with layers
5. Added blood pool rendering with dark splatter
6. Added medkit item with cross symbol
7. Added bandage item visual
8. Added ammo box visual
9. Added human enemy armor details
10. Added corrupted enemy glow effect
11. Added Bloater unique color
12. Added Stalker unique color
13. Added Possessed unique color
14. Added extraction point pulsing glow
15. Added enemy health bars above sprites
16. Added alerted eye color change
17. Added floating text system for feedback
18. Added corruption visual overlay at high levels
19. Added explored area dimming
20. Added weapon display in UI with ammo count

## Polish Passes (20 required)
1. Improved floor color palette to dark industrial
2. Improved wall shading with multiple layers
3. Improved player character visor visibility
4. Improved enemy sprite detail layers
5. Added smooth health bar rendering
6. Improved blood splatter circular shape
7. Added item glow on visible tiles
8. Improved extraction marker visibility
9. Added UI panel background opacity
10. Improved message log readability
11. Added turn counter display
12. Added corruption meter with warning colors
13. Improved weapon durability display
14. Added stance indicator in UI
15. Improved score tracking display
16. Added enemy turn indicator banner
17. Improved game over screen layout
18. Improved victory screen with stats
19. Added debug overlay formatting
20. Improved hover tile highlight

## Refine Passes (20 required)
1. Matched floor colors to reference dark gray
2. Matched wall colors to reference dark tones
3. Added grid pattern matching reference style
4. Matched enemy human colors to tan/brown
5. Matched corrupted enemy red glow
6. Added proper blood pool dark red
7. Matched item colors to reference
8. Matched UI green accent color
9. Added corruption high warning red
10. Matched extraction green glow
11. Added proper fog of war darkness
12. Matched explored area dimming level
13. Refined player green color
14. Added proper health bar colors
15. Matched turn indicator red
16. Refined menu screen colors
17. Added proper border colors
18. Matched text colors to reference
19. Refined overall dark atmosphere
20. Added final visual polish pass

## Feature Verification Checklist
- [x] Turn-based AP system
- [x] Walk (2 AP), Run (3 AP) stances
- [x] 4 weapons with different stats
- [x] Weapon durability and jamming
- [x] R = Reload weapon
- [x] ENTER = End turn
- [x] Auto-end turn on 0 AP
- [x] No AP floating text
- [x] 5 enemy types
- [x] Enemy AI (patrol, hunt, attack)
- [x] Enemy transformation at high corruption
- [x] Bloater explosion on death
- [x] Stalker poison
- [x] Corruption system (all 6 tiers)
- [x] Shadowcasting vision
- [x] Fog of war
- [x] Procedural room generation
- [x] Room types with different loot/enemies
- [x] Corridor connections
- [x] Item pickup
- [x] Healing items (bandage, medkit)
- [x] Extraction point
- [x] Score tracking
- [x] Enemy turn indicator
- [x] Debug overlay (Q key)

## Post-Mortem
### What Went Well
- Turn-based system feels tactical
- Corruption mechanic creates tension
- Shadowcasting vision works smoothly
- Procedural generation creates varied layouts
- Enemy AI provides challenge

### What Went Wrong
- Had to iterate on color palette several times
- Initial tiles were too bright
- Needed to add more visual feedback for actions

### Time Spent
- Initial build: ~30 minutes
- Expand passes: ~25 minutes
- Polish passes: ~20 minutes
- Refine passes: ~15 minutes
- Total: ~90 minutes
