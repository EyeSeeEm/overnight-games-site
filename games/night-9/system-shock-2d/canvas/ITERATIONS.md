# System Shock 2D: Whispers of M.A.R.I.A. - Canvas Iterations

## Expand Passes (20 required)
1. Added WASD player movement with wall collision
2. Added mouse-aim twin-stick shooting system
3. Added melee combat with wrench (arc detection)
4. Added ranged combat with pistol (bullet physics)
5. Added health and energy meters with regen
6. Added 3 enemy types: Cyborg Drone, Cyborg Soldier, Mutant Crawler
7. Added enemy AI with patrol, alert, and combat states
8. Added 2 decks: Engineering (Deck 1) and Medical (Deck 2)
9. Added door system with keycards (yellow, red)
10. Added hacking mini-game with grid navigation
11. Added turret system (hostile/friendly when hacked)
12. Added container system with loot
13. Added item pickups (medpatch, medkit, bullets, shells, energycell)
14. Added M.A.R.I.A. antagonist system with voice lines
15. Added audio log collection system (5 logs)
16. Added shotgun weapon with spread
17. Added dodge roll with invincibility frames
18. Added flashlight toggle with energy cost
19. Added elevator transition between decks
20. Added escape pod win condition on Deck 2

## Polish Passes (20 required)
1. Added screen shake on damage and attacks
2. Added invincibility frames with visual flicker
3. Added floating damage numbers
4. Added floating text for item pickups
5. Added blood particle effects on hits
6. Added blood pools on enemy death
7. Added muzzle flash on ranged attacks
8. Added melee swing arc particles
9. Added dodge particle trail
10. Added enemy health bars when damaged
11. Added terminal screen glow effect
12. Added item bobbing animation
13. Added wall tile 3D effect (highlight/shadow)
14. Added floor grid pattern for industrial feel
15. Added fog of war system (unexplored areas dark)
16. Added ambient light sources with flicker
17. Added hazard effects (steam, sparks, radiation)
18. Added ambient particles for hazards
19. Added room labels that fade with distance
20. Added M.A.R.I.A. glitch effect during dialogue

## Refine Passes (20 required)
1. Matched reference dark sci-fi color palette (blues, grays, red accents)
2. Refined health bar with segment markers
3. Refined energy bar styling
4. Added proper UI background panels
5. Added interaction hint system showing [E] prompts
6. Refined enemy sprites (cyborg tech, mutant organic)
7. Added enemy red eye glow
8. Added proper mini-map with explored areas
9. Added keycard indicators on locked doors
10. Added deck name display in UI
11. Refined flashlight cone visibility (correct: visible INSIDE)
12. Adjusted enemy spawn positions by room function
13. Balanced weapon damage and fire rates
14. Refined collision detection margins
15. Added proper game over screen with M.A.R.I.A. quote
16. Added win screen with stats (kills, logs found)
17. Refined M.A.R.I.A. dialogue box styling
18. Added more M.A.R.I.A. voice lines for events
19. Added door open/close state visual feedback
20. Added control hints at bottom of screen

## Feature Verification Checklist
- [x] Game loads without errors
- [x] Player movement (WASD)
- [x] Mouse aiming (twin-stick style)
- [x] Melee attack with visual feedback
- [x] Ranged attack with muzzle flash
- [x] 3 enemy types (Drone, Soldier, Crawler)
- [x] Health/Energy meters
- [x] 2 decks (Engineering, Medical)
- [x] Door system with keycards
- [x] Hacking mini-game
- [x] Turret system (hackable)
- [x] Item pickups (auto-collect)
- [x] Container searching
- [x] M.A.R.I.A. antagonist dialogue
- [x] Audio logs (text)
- [x] Escape pod win condition
- [x] Death/game over condition
- [x] Debug overlay (Q key)
- [x] Flashlight toggle (F key)
- [x] Dodge roll (Space)
- [x] Screen shake on damage
- [x] Fog of war / vision system

## Post-Mortem
### What Went Well
- Dark sci-fi aesthetic matches System Shock feel
- M.A.R.I.A. dialogue adds atmosphere and menace
- Twin-stick controls feel responsive
- Hacking mini-game provides variety
- Fog of war creates tension
- Multiple enemy types with distinct behaviors

### What Went Wrong
- Could use more detailed sprite work
- Only 2 decks (MVP scope limits full 5-deck experience)
- No boss fights (MVP constraint)
- Audio would greatly enhance atmosphere

### Time Spent
- Initial build: ~40 minutes
- Expand passes: ~30 minutes
- Polish passes: ~25 minutes
- Refine passes: ~20 minutes
- Total: ~115 minutes
