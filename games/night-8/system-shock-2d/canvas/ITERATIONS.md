# System Shock 2D: Whispers of M.A.R.I.A. - Canvas Iterations

## Initial Build
- Core game loop with Canvas 2D rendering
- Player movement (WASD) with twin-stick style aiming
- Vision cone system (flashlight-based visibility)
- 2 decks: Engineering and Medical
- 3 enemy types: Cyborg Drone, Cyborg Soldier, Mutant Crawler
- Procedural room generation with corridors
- Hacking minigame for doors and turrets
- Inventory system on left side
- HUD with ammo/health stats
- M.A.R.I.A. antagonist messages
- Debug overlay (Q key)
- Map view (M key)
- Win condition (escape via elevator on Deck 2)

## Expand Passes (20 required)
1. Added Shotgun weapon with pellet spread
2. Added Laser Pistol weapon with energy cells
3. Added room furniture system (crates, barrels, beds, etc.)
4. Added room-type specific furniture spawning
5. Added computer terminals in tech rooms
6. Added security cameras with sweep detection
7. Added corpses for atmospheric storytelling
8. Added fire hazards in generator rooms
9. Added radiation hazards in hydroponics
10. Added steam vent environmental effects
11. Added random spark particles from damaged areas
12. Added room labels dictionary for display
13. Added camera alert system that spawns enemies
14. Added hazard damage to player with warnings
15. Added vending machines and med stations
16. Added plant tanks with animated bubbles
17. Added pipe decorations
18. Added weapon condition display
19. Added more M.A.R.I.A. context messages
20. Added multiple item drop types from enemies

## Polish Passes (20 required)
1. Improved shotgun muzzle flash with larger spread
2. Added cyan muzzle flash for laser weapons
3. Improved furniture rendering with detail shading
4. Added animated screen content on terminals
5. Added cursor blink effect on terminals
6. Improved corpse rendering with blood pools
7. Added security camera vision cone visualization
8. Improved fire hazard gradient effects
9. Added radiation warning symbol
10. Improved steam particle size variation
11. Added screen shake variation by weapon type
12. Improved bullet lifetime by weapon type
13. Added weapon highlight in inventory list
14. Improved hazard warning text colors
15. Added camera alert color change
16. Improved barrel rendering with bands
17. Added chair and desk furniture
18. Improved tank bubbles animation
19. Added locker door details
20. Improved medical station cross symbol

## Refine Passes (20 required)
1. Matched floor tile colors to reference (darker grays)
2. Adjusted vision cone angle to match reference
3. Improved wall panel rendering with shadows
4. Adjusted enemy colors for better visibility
5. Matched inventory list style to reference (left side)
6. Adjusted HUD position to match reference (bottom)
7. Improved vision cone edge darkness
8. Adjusted furniture scale for visibility
9. Matched terminal screen colors to reference
10. Improved camera sweep speed
11. Adjusted hazard damage rates
12. Matched bullet tracer colors to reference
13. Improved enemy health bar styling
14. Adjusted particle effect lifetimes
15. Matched door hazard stripes to reference
16. Improved elevator pad appearance
17. Adjusted debug overlay positioning
18. Matched map view style to reference
19. Improved floating text visibility
20. Adjusted overall contrast and atmosphere

## Feature Verification Checklist
- [x] Player movement (WASD)
- [x] Mouse aiming
- [x] Melee attack (wrench)
- [x] Ranged attack (pistol)
- [x] Shotgun (pellet spread)
- [x] Laser pistol (energy weapon)
- [x] Health system
- [x] Energy system
- [x] Vision cone (flashlight)
- [x] 3 enemy types
- [x] 2 decks
- [x] Room transitions
- [x] Hacking minigame
- [x] Item pickup
- [x] Inventory system
- [x] Doors (locked/unlocked)
- [x] Turrets (hackable)
- [x] Audio logs
- [x] M.A.R.I.A. messages
- [x] Win condition
- [x] Debug overlay
- [x] Map view
- [x] Furniture/environment
- [x] Security cameras
- [x] Hazards (fire/radiation)

## Post-Mortem
### What Went Well
- Vision cone system correctly shows inside visible, outside dark
- Environmental objects add atmosphere matching reference
- Multiple weapon types provide gameplay variety
- Security camera alert system creates tension
- M.A.R.I.A. messages enhance story immersion

### What Went Wrong
- Floor tiles could use more industrial detail patterns
- Would benefit from more enemy variety
- Could add more lighting effects

### Time Spent
- Initial build: ~30 minutes
- Expand passes: ~25 minutes
- Polish passes: ~20 minutes
- Refine passes: ~15 minutes
- Total: ~90 minutes
