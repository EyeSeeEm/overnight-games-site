# Radiated Zone (Zero Sievert Clone) - Canvas Iterations

## Expand Passes (20 required)
1. Added WASD player movement with collision detection
2. Added mouse-aim shooting system (bullets go where mouse points)
3. Added 4 weapons: PM Pistol, Skorpion SMG, Pump Shotgun, AK-74
4. Added weapon stats (damage, fire rate, spread, range, mag size)
5. Added reloading system with timing
6. Added health and stamina bars
7. Added bleeding status effect (damage over time)
8. Added 5 enemy types: Wolf, Boar, Bandit Melee, Bandit Pistol, Bandit Rifle
9. Added enemy AI with patrol, alert, and combat states
10. Added enemy vision cones (90 degrees, like player)
11. Added procedural forest zone generation
12. Added 6 building POIs with names
13. Added loot containers with type-based spawning
14. Added extraction point win condition
15. Added extraction timer (3 seconds to extract)
16. Added tree obstacles with collision
17. Added medkit and bandage consumables
18. Added ammo drops and tracking per weapon type
19. Added score system (loot value + kills)
20. Added death/game over when health reaches 0

## Polish Passes (20 required)
1. Added screen shake on damage
2. Added invincibility frames with visual flicker
3. Added floating damage numbers
4. Added floating text for item pickups
5. Added blood particle effects on hits
6. Added blood pools on enemy death
7. Added muzzle flash on shooting
8. Added player vision cone visualization
9. Added stamina regen when not sprinting
10. Added enemy health bars when damaged
11. Added building labels that fade with distance
12. Added extraction zone pulsing indicator
13. Added extraction direction arrow in UI
14. Added weapon switch feedback
15. Added reload progress indicator
16. Added bleeding indicator on health bar
17. Added loot container searched state (darker)
18. Added control hints at bottom of screen
19. Added mini-map with explored areas
20. Added enemy dots on mini-map (only visible enemies)

## Refine Passes (20 required)
1. Matched reference post-apocalyptic color palette (muted greens/browns)
2. Added proper tree rendering with trunk and foliage
3. Refined building wall 3D effect
4. Added grass tile variation (checkerboard)
5. Refined fog of war system (explored vs visible)
6. Adjusted enemy spawn positions (near buildings for bandits)
7. Balanced loot ratio (2:1 healing to weapons as per GDD)
8. Adjusted enemy damage values
9. Refined player movement speed and sprint
10. Added proper ranged enemy behavior (maintain distance)
11. Refined melee enemy charge behavior
12. Added quick-use keys (1 for medkit, 2 for bandage)
13. Added weapon switching (3-6 keys)
14. Refined extraction zone visuals
15. Added raid time display
16. Added kill and loot value tracking
17. Refined debug overlay information
18. Added semi-auto vs auto-fire for weapons
19. Adjusted vision cone angle (90 degrees)
20. Refined collision margins for smoother movement

## Feature Verification Checklist
- [x] Game loads without errors
- [x] Player movement (WASD)
- [x] Mouse aiming (bullets go to cursor)
- [x] 4 weapons with different stats
- [x] 5 enemy types
- [x] Enemy vision cones
- [x] Health + Bleeding system
- [x] Procedural forest zone
- [x] Building POIs
- [x] Loot containers
- [x] Extraction point win condition
- [x] Score based on loot + kills
- [x] Debug overlay (Q key)
- [x] Mini-map
- [x] Stamina/Sprint system
- [x] Reload system
- [x] Screen shake effects
- [x] Blood effects

## Post-Mortem
### What Went Well
- Post-apocalyptic aesthetic matches reference
- Vision cone creates proper stealth/tactical feel
- Extraction mechanic adds tension
- Enemy AI feels responsive
- Multiple weapons provide variety
- Loot system encourages exploration

### What Went Wrong
- Could use more detailed sprites
- Only forest zone (MVP scope)
- No hideout between raids (MVP simplification)
- Could use more environmental hazards

### Time Spent
- Initial build: ~45 minutes
- Expand passes: ~25 minutes
- Polish passes: ~20 minutes
- Refine passes: ~15 minutes
- Total: ~105 minutes
