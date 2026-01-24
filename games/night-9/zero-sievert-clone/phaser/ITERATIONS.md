# Zone Zero (Zero Sievert Clone) - Phaser Iterations

## Expand Passes (20 required)
1. Added player sprite with tactical gear design
2. Added 8-directional WASD movement
3. Added mouse aiming (360 degrees) with player rotation
4. Added sprinting mechanic (SHIFT) with stamina cost
5. Added 4 weapons: PM Pistol, Skorpion, Pump Shotgun, AK-74
6. Added weapon switching (1-4 number keys)
7. Added reload system with R key
8. Added magazine and reserve ammo tracking
9. Added 5 enemy types: Wolf, Boar, Bandit Melee, Bandit Pistol, Bandit Rifle
10. Added enemy patrol and chase behaviors
11. Added enemy vision cone system (can only detect player when facing them)
12. Added ranged enemy shooting
13. Added melee damage for wildlife and bandits
14. Added bleeding status effect from combat
15. Added procedural Forest zone generation
16. Added trees, bushes, dirt paths, buildings
17. Added loot containers (crates)
18. Added item drops: medkit, bandage, food, ammo types, money, weapons
19. Added extraction point with distance indicator
20. Added win condition (reach extraction)

## Polish Passes (20 required)
1. Added HP bar with red fill (matching reference style)
2. Added stamina bar with green fill and >>> indicator
3. Added bleeding warning indicator (flashing)
4. Added weapon info display (bottom left)
5. Added ammo counter with mag/reserve format
6. Added extraction distance and direction (top right)
7. Added loot value display
8. Added kill counter
9. Added game time tracker
10. Added [E] INTERACT prompt near interactables
11. Added floating damage numbers
12. Added muzzle flash effect on shooting
13. Added screen shake on firing
14. Added enemy white flash when hit
15. Added blood decals on enemy death
16. Added item bobbing animation
17. Added reloading indicator
18. Added weapon quick-slot hints
19. Added rain weather effect (30% chance)
20. Added vision cone light indicator

## Refine Passes (20 required)
1. Matched green/brown color palette from reference
2. Added shotgun pellet spread (8 pellets)
3. Added automatic fire for SMG and rifle
4. Balanced weapon damage values (pistol 18, SMG 14, shotgun 8x8, rifle 28)
5. Balanced fire rates (pistol 300ms, SMG 100ms, shotgun 800ms, rifle 150ms)
6. Added weapon spread/accuracy system
7. Balanced enemy HP (wolf 40, boar 80, bandits 60-80)
8. Added boar charge attack behavior
9. Implemented vision cone for player (enemies outside not visible)
10. Added enemy facing direction tracking
11. Set healing items spawn rate higher than weapons (2:1 ratio per GDD)
12. Positioned extraction point far from player start
13. Added kill score bonus (+50 per kill)
14. Added final score calculation on extraction
15. Refined stamina drain and regeneration rates
16. Added bleeding damage over time (2 HP/sec)
17. Added bandage/medkit stop bleeding
18. Refined crate loot tables
19. Added game over screen with raid stats
20. Added extraction success screen with score summary

## Feature Verification Checklist
- [x] Mouse aim toward cursor (CRITICAL - bullets go where mouse points)
- [x] Vision cone system (enemies outside not visible)
- [x] 1 zone: Forest with procedural generation
- [x] 4 weapons: PM Pistol, Skorpion, Pump Shotgun, AK-74
- [x] Health + bleeding status
- [x] Stamina for sprinting
- [x] 5 enemies: Wolf, Boar, Bandit Melee, Bandit Pistol, Bandit Rifle
- [x] Enemy vision cones (must face player to see)
- [x] Loot containers
- [x] Item pickups (healing, ammo, weapons, money)
- [x] Extraction point (always visible on map)
- [x] Win: High score based on loot + kills
- [x] Arcade loop: Spawn -> Loot -> Extract -> Score -> Restart
- [x] Reload system
- [x] Weapon switching
- [x] Debug overlay (Q key)
- [x] HP/Stamina HUD bars

## Post-Mortem
### What Went Well
- Mouse aiming feels responsive and accurate
- Vision cone creates stealth/tactical gameplay
- Procedural zone generation creates variety
- Enemy variety (melee/ranged/wildlife) adds challenge
- Extraction goal creates clear objective

### What Went Wrong
- No hideout/progression between raids (MVP scope)
- Simplified inventory (no grid system)
- No weapon attachments for MVP
- No quest system for MVP
- Rain effect could be more visible

### Time Spent
- Initial build: ~50 minutes
- Expand passes: ~35 minutes
- Polish passes: ~25 minutes
- Refine passes: ~25 minutes
- Total: ~135 minutes
