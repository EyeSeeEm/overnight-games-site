# Zero Sievert Clone - Canvas Version - Iterations Log

## Iteration 1: Initial sprite-based version
- **Issue:** Used Kenney RPG sprites but tile positions were wrong - showed water instead of grass
- **Fix:** Needed correct tile positions in spritesheet

## Iteration 2: Sprite tile mapping attempt
- **Issue:** RPG spritesheet has different layout than expected, grass tiles at wrong positions
- **Fix:** Decided to switch to procedural texture generation

## Iteration 3: Procedural textures - base version
- **Issue:** Colors too bright, didn't match dark post-apocalyptic reference
- **Fix:** Adjusted color palette to darker greens (#2d4a28, #345530)

## Iteration 4: Forest environment
- **Issue:** Trees looked flat
- **Fix:** Added layered pine tree texture with 3 triangular layers and trunk

## Iteration 5: Building textures
- **Issue:** Buildings were plain colored rectangles
- **Fix:** Added wood plank lines to walls, tiled floor pattern

## Iteration 6: Rain effect
- **Issue:** No atmosphere matching reference's rainy scenes
- **Fix:** Added 400 rain drops with diagonal motion and wind effect

## Iteration 7: HUD styling
- **Issue:** HUD elements too simple
- **Fix:** Added proper HP bar with label, stamina bar with chevrons (>>>), minimap

## Iteration 8: Combat feedback
- **Issue:** Shooting felt weak
- **Fix:** Added muzzle flash particles, blood stains that persist and fade

## Iteration 9: Enemy variety
- **Issue:** All enemies looked the same
- **Fix:** Created distinct bandit (brown clothes, red bandana) and mutant (green body, red eyes) sprites

## Iteration 10: Extraction zone
- **Issue:** Extraction point not visible enough
- **Fix:** Added pulsing dashed circle with "EXTRACT" label

## Feature Verification Checklist (from GDD)
- [x] Top-down extraction shooter
- [x] WASD movement with sprint (shift)
- [x] Mouse aim and click to shoot
- [x] HP and stamina system
- [x] Bleeding status effect
- [x] Bandits (ranged enemies)
- [x] Mutants (melee enemies)
- [x] Loot containers with [E] LOOT prompt
- [x] Extraction zone goal
- [x] Minimap
- [x] Rain weather effect
- [x] Fullscreen canvas (1280x720 min)

## Post-Mortem

### What Went Well
- Procedural texture generation avoided spritesheet mapping issues
- Rain effect added significant atmosphere matching the reference
- Distinct bandit vs mutant visuals made combat readable
- Extraction zone with pulsing indicator was clear and satisfying
- Blood stains persisting then fading added weight to combat

### What Went Wrong
- Initial sprite approach failed - wrong tile positions in spritesheet
- Had to abandon sprites and switch to procedural generation mid-build
- Color palette needed several iterations to match dark post-apocalyptic feel
- Tree layering took multiple attempts to look natural

### Key Learnings
- Procedural texture generation is more reliable than external sprites
- Post-apocalyptic games need muted, dark color palettes
- Weather effects (rain) add enormous atmosphere for minimal code
- Extraction shooter needs clear goal marker - pulsing helps

### Time Spent
- Initial build: ~25 minutes
- Expand passes: ~30 minutes
- Polish passes: ~25 minutes
- Total: ~80 minutes

### Difficulty Rating
Medium - Core shooter mechanics straightforward, but matching the grim atmosphere required iteration
