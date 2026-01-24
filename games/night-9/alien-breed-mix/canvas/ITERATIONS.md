# Station Breach (Alien Breed Mix) - Canvas Iterations

## Expand Passes (20 required)
1. Initial build with core gameplay: player movement, shooting, room system
2. Added vision cone raycasting for horror atmosphere (60 degrees, 350px range)
3. Added HUD matching original: 1UP, LIVES, AMMO, KEYS bars
4. Added minimap with room exploration tracking
5. Added debug overlay (Q key) with all game stats
6. Added door interaction system with keycard requirements
7. Added floating text popups for pickups
8. Added enemy types: Drone (spider-like), Brute (armored), Queen (boss)
9. Added weapon types: Pistol, Shotgun, Rifle, Flamethrower
10. Added ammo and health pickup system with visual feedback
11. Added explosive barrels with chain reaction explosions
12. Added screen shake effects for weapons and explosions
13. Added particle systems: muzzle flash, sparks, blood, fire, explosions
14. Added metallic floor tiles with rivets and industrial patterns
15. Added wall textures with panel details and warning stripes
16. Added brown crates with metal bands
17. Added keycard pickup with chip pattern
18. Added weapon pickups with glow effects
19. Added room labels (CARGO, STORAGE, MAINT, etc.)
20. Added 3 level structure: Cargo Bay, Engineering, Queen's Lair

## Polish Passes (20 required)
1. Improved player sprite with shoulder pads, backpack, helmet visor
2. Improved drone enemy with animated 8 legs and mandibles
3. Improved brute enemy with armored carapace and thick legs
4. Improved queen enemy with pulsing body and crown crests
5. Added enemy glowing eyes with shadow blur effect
6. Reduced screen shake by 50% as per GDD feedback
7. Added "out of ammo" message throttling (once per second)
8. Added door prompt "[SPACE] OPEN" when near doors
9. Added keycard indicator lights on locked doors
10. Added weapon-specific sprites on player character
11. Added smooth wall sliding for enemy movement
12. Added enemy facing direction visualization
13. Added health bars for damaged enemies
14. Added boss name label for Queen
15. Added bullet trails for projectiles
16. Improved explosion particles with glow effects
17. Added fire particles rising from explosions
18. Added barrel damage indicator when shot
19. Added "BOOM!" floating text on barrel explosions
20. Added chain reaction delay for multiple barrel explosions

## Refine Passes (20 required)
1. Matched floor color scheme to reference (brown/gray metallic)
2. Matched wall style to reference (dark gray panels)
3. Matched crate style to reference (orange/brown with bands)
4. Matched enemy color to reference (black spider-like)
5. Matched player color to reference (green armor, yellow visor)
6. Added orange warning stripes on some walls
7. Added rivet details on floor tiles
8. Added grate patterns on some floor tiles
9. Added door frames with proper blast door style
10. Matched HUD layout to reference (top bar with bars)
11. Added level names matching theme (CARGO BAY, ENGINEERING, etc.)
12. Added room variety (corridors, storage, hubs)
13. Improved vision overlay with proper raycasting
14. Added enemy knockback on hit (except brutes)
15. Added invincibility frames after player damage
16. Improved minimap with enemy dots
17. Added stamina system for sprinting
18. Added reload animation indicator
19. Added weapon switching with Tab key
20. Matched projectile colors to weapon types

## Feature Verification Checklist
- [x] Player movement (WASD)
- [x] Mouse aim toward cursor
- [x] Shooting mechanics (LMB)
- [x] Reload system (R key)
- [x] Multiple weapons (Pistol, Shotgun, Rifle, Flamethrower)
- [x] Enemy types (Drone, Brute, Queen)
- [x] Queen boss on Level 3
- [x] Room-based level design
- [x] Keycard progression (Blue keycard)
- [x] Vision cone raycasting (60 degrees)
- [x] HUD (health, ammo, keys) matching original
- [x] Minimap with room exploration
- [x] Debug overlay (Q key)
- [x] Floating text popups
- [x] 3 complete levels
- [x] Victory/defeat states
- [x] Explosive barrels
- [x] Screen shake effects
- [x] Particle effects

## Post-Mortem
### What Went Well
- Vision raycasting creates good horror atmosphere
- Spider-like enemies look authentic to Alien Breed
- Explosive barrels add tactical depth
- HUD matches original game style well
- Room-based exploration works as intended

### What Went Wrong
- Initial enemy designs were too simple
- Floor textures needed multiple iterations to match reference
- Vision overlay required careful optimization

### Time Spent
- Initial build: ~30 minutes
- Expand passes: ~45 minutes
- Polish passes: ~40 minutes
- Refine passes: ~35 minutes
- Total: ~150 minutes
