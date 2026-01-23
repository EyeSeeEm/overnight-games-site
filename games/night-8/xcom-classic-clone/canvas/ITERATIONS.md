# X-COM Tactical Clone - Canvas Iterations

## Expand Passes (20 required)

1. Added tile-based tactical map (20x15 grid)
2. Added procedural map generation with terrain types (grass, dirt, road, walls)
3. Added UFO crash site structure with walls and floor
4. Added building with walls and door
5. Added bush cover tiles providing partial cover
6. Added 4 soldiers with unique names and randomized stats
7. Added 3 alien types (Sectoid, Floater, Snakeman) with unique visuals
8. Added Time Unit (TU) system for all actions
9. Added movement with A* pathfinding
10. Added snap shot firing mode (quick, lower accuracy)
11. Added aimed shot firing mode (slow, high accuracy)
12. Added grenade throwing with area of effect damage
13. Added kneeling stance (+15% accuracy bonus)
14. Added fog of war with visibility calculation
15. Added line of sight checking for combat
16. Added reaction fire system for aliens
17. Added turn-based combat (player turn, enemy turn)
18. Added enemy AI (chase, shoot, move toward soldiers)
19. Added morale and panic system (framework)
20. Added permadeath for soldiers (KIA status)

## Polish Passes (20 required)

1. Improved soldier sprites with body, head, facing indicator
2. Improved Sectoid alien sprite with large head, eyes
3. Improved Floater alien sprite with cyborg appearance
4. Improved Snakeman alien sprite with scales pattern
5. Improved shot animations with tracer lines
6. Improved hit animations with expanding circles
7. Improved explosion animations for grenades
8. Improved grenade arc trajectory animation
9. Improved fog of war with partial visibility zone
10. Improved tile highlighting for valid moves (blue)
11. Improved tile highlighting for valid targets (red)
12. Improved soldier selection highlight (yellow border)
13. Improved HP bars for enemies
14. Improved left panel soldier list with HP/TU bars
15. Improved bottom panel with action buttons
16. Improved message log with fade-out
17. Improved turn indicator with color coding
18. Improved debug overlay with comprehensive stats
19. Improved victory/defeat screens with statistics
20. Improved menu with controls explanation

## Refine Passes (20 required)

1. Fixed tile colors to match tactical aesthetic
2. Fixed grass checkerboard pattern
3. Fixed soldier facing direction on move
4. Fixed pathfinding to avoid occupied tiles
5. Fixed TU cost calculation for movement
6. Fixed accuracy modifiers for kneeling
7. Fixed damage variance (50%-150% of base)
8. Fixed armor reduction calculation
9. Fixed grenade friendly fire damage
10. Fixed reaction fire trigger conditions
11. Fixed line of sight through walls
12. Fixed visibility map update after movement
13. Fixed alien spotted state persistence
14. Fixed turn transition timing
15. Fixed soldier selection by clicking
16. Fixed action mode button highlighting
17. Fixed UI panel positioning
18. Fixed message display timing
19. Fixed enemy AI movement logic
20. Fixed victory/defeat condition checks

## Feature Verification Checklist

- [x] 4 soldiers with unique stats (HP, TU, Accuracy, Reactions)
- [x] Time Unit system (movement costs 4 TU/tile)
- [x] Snap shot (25% TU, 60% accuracy)
- [x] Aimed shot (80% TU, 110% accuracy)
- [x] Grenade throwing (radius 2 damage)
- [x] Kneeling stance (+15% accuracy)
- [x] 3 alien types (Sectoid, Floater, Snakeman)
- [x] Fog of war with line of sight
- [x] Reaction fire from aliens
- [x] Turn-based combat (player/enemy turns)
- [x] Pathfinding (A* algorithm)
- [x] Permadeath (KIA status)
- [x] Debug overlay (Q key)
- [x] Soldier selection (click/Tab)
- [x] Action mode switching (1-4 keys)
- [x] End turn button (Enter key)
- [x] Victory condition (all aliens dead)
- [x] Defeat condition (all soldiers dead)
- [x] Message log with combat results

## Post-Mortem

### What Went Well
- TU system creates meaningful tactical decisions
- Fog of war adds tension and exploration
- Reaction fire makes movement dangerous
- Soldier/alien variety provides strategic depth
- Debug overlay invaluable for testing

### What Went Wrong
- Initial pathfinding didn't account for units
- Fog of war calculation needed optimization
- Reaction fire balance needed tuning
- UI layout required multiple iterations

### Time Spent
- Initial build: ~55 minutes
- Expand passes: ~40 minutes
- Polish passes: ~35 minutes
- Refine passes: ~25 minutes
- Testing and fixes: ~15 minutes
- Total: ~170 minutes (2h 50m)

## Technical Notes

### Controls
- Click: Select unit / Move / Attack
- 1: Move mode
- 2: Snap shot mode
- 3: Aimed shot mode
- 4: Grenade mode
- Tab: Select next soldier
- K: Kneel/Stand
- Enter: End turn
- Q: Debug overlay

### GDD Features Implemented
All MVP features from the GDD have been implemented:
- 4 soldiers with TU system
- 3 alien types (Sectoid, Floater, Snakeman)
- Conventional weapons (Rifle with snap/aimed)
- Grenades with area damage
- Fog of war and line of sight
- Reaction fire
- Permadeath
- Win condition: Kill all aliens

### Combat Formulas
- Hit Chance = Soldier Accuracy × Shot Mode Accuracy × Modifiers
- Damage = Base Damage × Random(0.5 to 1.5)
- Final Damage = Max(1, Damage - Armor)
- Reaction Check = (Alien Reactions × Alien TU) vs (Unit Reactions × Unit TU)
