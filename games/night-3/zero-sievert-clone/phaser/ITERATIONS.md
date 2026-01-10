# Zero Sievert Clone - Phaser 3 Version - Iterations Log

## Iteration 1: Initial port from canvas
- **Issue:** Need to convert procedural texture generation to Phaser's graphics API
- **Fix:** Used Phaser.GameObjects.Graphics with generateTexture()

## Iteration 2: Physics setup
- **Issue:** Player movement felt floaty
- **Fix:** Used arcade physics with proper velocity handling

## Iteration 3: Tile collision
- **Issue:** Player passing through walls
- **Fix:** Created static physics group for wall/tree collisions

## Iteration 4: Enemy AI
- **Issue:** Enemies not pursuing player properly
- **Fix:** Implemented alert/patrol state with velocityFromRotation

## Iteration 5: Bullet system
- **Issue:** Bullets not hitting targets
- **Fix:** Added distance-based collision checks for both friendly and enemy bullets

## Iteration 6: Camera follow
- **Issue:** Camera jerky when following player
- **Fix:** Used startFollow with lerp values (0.1, 0.1) for smooth tracking

## Iteration 7: HUD rendering
- **Issue:** HUD not staying fixed on screen
- **Fix:** Set setScrollFactor(0) on HUD graphics and text

## Iteration 8: Rain effect
- **Issue:** Rain scrolling with camera
- **Fix:** Used screen-space coordinates with setScrollFactor(0)

## Iteration 9: Loot interaction
- **Issue:** Loot prompts appearing globally
- **Fix:** Added distance check and dynamic text creation/destruction

## Iteration 10: Scene management
- **Issue:** Game not properly restarting
- **Fix:** Created separate MenuScene, GameScene, WinScene, DeadScene

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
- [x] Phaser 3 CANVAS renderer for headless testing

## Post-Mortem

### What Went Well
- Phaser's arcade physics simplified collision detection
- Camera system with lerp made smooth tracking easy
- Scene separation (Menu, Game, Win, Dead) was clean architecture
- setScrollFactor(0) made HUD implementation straightforward
- generateTexture() avoided external asset dependencies

### What Went Wrong
- Initial floaty movement - needed to tune physics values
- Rain scrolling with camera required setScrollFactor fix
- Loot prompt text appearing globally before distance check
- Collision groups needed careful setup for walls/trees

### Key Learnings
- Always use setScrollFactor(0) for UI elements in Phaser
- velocityFromRotation is cleaner than manual trig for movement
- Separate scenes for game states is worth the setup cost
- Test camera follow early - it affects all gameplay feel

### Time Spent
- Initial build: ~30 minutes
- Expand passes: ~25 minutes
- Polish passes: ~25 minutes
- Total: ~80 minutes

### Difficulty Rating
Medium - Porting from Canvas to Phaser was mostly API translation with some physics quirks
