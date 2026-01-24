# System Shock 2D: Whispers of M.A.R.I.A. - Phaser Iterations

## Expand Passes (20 required)
1. Added player sprite with armored suit and visor design
2. Added twin-stick controls (WASD movement + mouse aiming)
3. Added player rotation toward mouse cursor
4. Added 2 decks (Engineering + Medical) with room layouts
5. Added 3 enemy types: Cyborg Drone, Cyborg Soldier, Mutant Crawler
6. Added enemy behaviors: patrol, chase, ranged attack
7. Added enemy detection system (200px range triggers chase)
8. Added enemy alert timer for sustained pursuit
9. Added hackable doors with keycard requirements
10. Added hackable turrets that can be reprogrammed
11. Added hacking minigame with path-building puzzle
12. Added health and energy stats for player
13. Added pistol weapon with bullet projectiles
14. Added item pickup system (med patches, medkits, bullets)
15. Added keycard items (yellow, red) for door access
16. Added container/crate looting with random contents
17. Added elevator transitions between decks
18. Added escape pod win condition on Deck 2
19. Added sprint mechanic (SHIFT) with energy cost
20. Added flashlight toggle (F key) for vision cone

## Polish Passes (20 required)
1. Added dark sci-fi color scheme (blues, grays, cyans)
2. Added checkered floor tile pattern with grid lines
3. Added detailed wall tiles with metallic borders
4. Added vision cone lighting effect
5. Added entities dim when outside player's view cone
6. Added muzzle flash effect on shooting
7. Added screen shake when player takes damage
8. Added player tint flash when hit
9. Added enemy white flash when hit
10. Added floating damage numbers on hits
11. Added blood decal on enemy death
12. Added explosion effect on turret destruction
13. Added item bobbing animation
14. Added HUD panel with deck name display
15. Added health and energy bars with labels
16. Added weapon/ammo display on HUD
17. Added keycard collection display
18. Added minimap showing deck layout
19. Added minimap markers for player/enemies/objectives
20. Added controls hint display on HUD

## Refine Passes (20 required)
1. Matched dark atmospheric palette from reference screenshots
2. Improved vision cone to show things inside, hide things outside (correct implementation)
3. Added enemy detection and visibility based on view cone
4. Balanced Cyborg Drone HP (30) and damage (10)
5. Balanced Cyborg Soldier HP (60), damage (15), ranged behavior
6. Balanced Mutant Crawler HP (20), damage (8), fast speed (120)
7. Adjusted turret targeting range to 250px
8. Refined hacking minigame timer (10s doors, 15s turrets)
9. Added hack failure consequence (spawns enemy nearby)
10. Positioned elevator in Engineering deck (exits to Deck 2)
11. Positioned escape pod in Medical deck for victory
12. Added yellow keycard in Security Office (Deck 1)
13. Added red keycard in Medical deck
14. Locked escape pod door requiring yellow keycard
15. Added room type-specific container spawning
16. Refined energy regeneration (2/sec passive)
17. Refined sprint energy cost (5/sec)
18. Added game over screen with M.A.R.I.A. quote
19. Added victory screen with escape narrative
20. Added debug overlay (Q key) with all stats

## Feature Verification Checklist
- [x] Twin-stick controls (WASD + mouse aim)
- [x] Player rotation toward mouse
- [x] 2 decks: Engineering + Medical
- [x] 3 enemy types: Cyborg Drone, Cyborg Soldier, Mutant Crawler
- [x] Enemy patrol and chase behaviors
- [x] Cyborg Soldier ranged attack
- [x] 2 hackable objects: Doors, Turrets
- [x] Hacking minigame with path puzzle
- [x] Vision cone system (inside visible, outside hidden)
- [x] Health system with damage feedback
- [x] Energy system with sprint cost
- [x] Pistol weapon with ammo
- [x] Item pickups (medpatch, medkit, bullets, keycards)
- [x] Container looting
- [x] Keycard progression (yellow, red)
- [x] Elevator transitions between decks
- [x] Escape pod win condition
- [x] Minimap with room layout
- [x] Debug overlay (Q key)
- [x] Game over and victory screens

## Post-Mortem
### What Went Well
- Vision cone creates immersive "can't see behind you" tension
- Hacking minigame adds variety to gameplay
- Twin-stick controls feel responsive
- Enemy variety (ranged, melee, swarm) adds tactical depth
- Deck transition maintains progression feeling

### What Went Wrong
- Only 2 decks instead of full 5 for MVP
- No boss encounters for MVP scope
- Simplified hacking (path puzzle vs full grid)
- No audio logs (story element cut)
- No weapon variety (pistol only for MVP)

### Time Spent
- Initial build: ~45 minutes
- Expand passes: ~35 minutes
- Polish passes: ~30 minutes
- Refine passes: ~25 minutes
- Total: ~135 minutes
