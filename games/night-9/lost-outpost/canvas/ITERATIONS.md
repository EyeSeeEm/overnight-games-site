# Lost Outpost - Canvas Iterations

## Expand Passes (20 required)
1. Initial build with player movement (8-directional WASD)
2. Added mouse aim system - player faces cursor direction
3. Added shooting mechanics with fire rate and magazine
4. Added reload mechanic (R key)
5. Added 4 weapons: Assault Rifle (starter), SMG, Shotgun, Flamethrower
6. Added weapon switching (1-4 number keys)
7. Added weapon unlock system - new weapons found in levels
8. Added 3 enemy types: Scorpion (melee), Scorpion Laser (ranged), Arachnid (tank)
9. Added enemy AI: patrol, chase, attack behaviors
10. Added 5 levels: Arrival, Engineering, Medical Bay, Cargo Hold, Hive Core
11. Added procedural room generation with corridors
12. Added keycard system for level progression
13. Added health pickup system (medkits)
14. Added ammo pickup system
15. Added cash/credit pickup system
16. Added 3 lives per level system
17. Added Hive Commander boss on level 5
18. Added boss phases (ranged, charge, spawn minions)
19. Added level transition system with stats screen
20. Added interact system (Space key) for doors and keycards

## Polish Passes (20 required)
1. Added flashlight cone visibility system (45 degree angle)
2. Dark atmosphere - only visible within flashlight cone
3. Added enemy visibility check - enemies only visible in light
4. Added player sprite with helmet and visor
5. Added weapon glow effect when firing
6. Added muzzle flash particles
7. Added bullet trail effects (red for player, green for enemy)
8. Added enemy glowing red eyes (visible in dark)
9. Added enemy health bars
10. Added hit particles when bullets connect
11. Added death particles when enemies die
12. Added screen flash on player damage
13. Added "RELOADING" indicator
14. Added floating damage numbers
15. Added level complete notification
16. Added boss health bar at bottom of screen
17. Added boss phase indicator
18. Added keycard pickup notification
19. Added weapon unlock notification
20. Added invincibility flash effect after taking damage

## Refine Passes (20 required)
1. Matched dark industrial sci-fi color palette (grays, blues)
2. Added metal floor tiles with grating pattern
3. Added yellow/black hazard stripe walls
4. Added room lighting variation (darker corridors)
5. Matched HUD layout to reference: lives, health bar, money
6. Added weapon info panel (name, ammo count)
7. Added level name indicator in HUD
8. Added keycard status indicator
9. Added minimap showing room layout
10. Fixed collision detection with walls
11. Fixed enemy pathfinding around obstacles
12. Added enemy spawn from vents/dark areas
13. Balanced weapon damage and fire rates
14. Balanced enemy HP and damage per level
15. Added level scaling (enemies stronger on later levels)
16. Fixed boss attack patterns timing
17. Added boss minion spawning during fight
18. Added flamethrower continuous damage effect
19. Fixed shotgun pellet spread pattern
20. Added debug overlay (Q key) showing all game state

## Feature Verification Checklist
- [x] Mouse aim - player faces cursor direction
- [x] 8-directional movement (WASD)
- [x] Shooting with left click
- [x] Reload (R key)
- [x] Weapon switching (1-4)
- [x] 4 weapons with different behaviors
- [x] 3 enemy types with different AI
- [x] 5 levels with progression
- [x] Hive Commander boss on level 5
- [x] Flashlight cone visibility
- [x] Keycard system
- [x] 3 lives per level
- [x] Health/ammo/cash pickups
- [x] Level transition screens
- [x] Dark atmosphere with limited visibility
- [x] Boss phases and attack patterns
- [x] Debug overlay (Q key)
- [x] Victory/Game Over screens

## Post-Mortem
### What Went Well
- Flashlight cone visibility creates tense atmosphere
- Enemy AI with patrol/chase states works well
- Boss fight has good variety with multiple phases
- Level progression with weapon unlocks feels rewarding
- Dark industrial aesthetic matches reference

### What Went Wrong
- Initial visibility system needed brightness adjustment
- Enemy spawning needed better positioning
- Boss HP needed balancing across phases

### Time Spent
- Initial build: ~45 minutes
- Expand passes: ~35 minutes
- Polish passes: ~30 minutes
- Refine passes: ~25 minutes
- Total: ~135 minutes
