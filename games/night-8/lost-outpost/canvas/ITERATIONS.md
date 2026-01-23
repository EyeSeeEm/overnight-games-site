# Lost Outpost - Canvas Iterations

## Expand Passes (20 required)
1. Added motion tracker radar showing enemy positions with sweep line
2. Added damage flash red screen overlay when player takes damage
3. Added laser sight ray-casting from weapon to wall with red dot
4. Added shell casing ejection system with physics
5. Improved player model with shoulder pads and armor details
6. Added glowing visor effect on player helmet
7. Added warning light phase animation for emergency lights
8. Improved muzzle flash particles on shooting
9. Added shell casing rendering with rotation and fade
10. Improved floor with hexagonal grate patterns
11. Added lava glow effects on outdoor tiles
12. Added floor bolt/vent details
13. Added wall bevel effects for 3D appearance
14. Added wall pipe details on some walls
15. Added pulsing emergency warning lights on walls
16. Added ambient dust particle system
17. Added ambient spark particle system
18. Added ambient steam particle system
19. Improved enemy visual appearances with red eyes
20. Added EXIT marker indicator with green glow

## Polish Passes (20 required)
1. Smoothed player movement with better diagonal handling
2. Added weapon recoil visual feedback
3. Improved bullet tracer effects
4. Enhanced blood splatter on enemy death
5. Better enemy death particles
6. Improved flashlight cone gradient
7. Added screen vignette for atmosphere
8. Improved HUD border styling
9. Better minimap colors for room types
10. Smoother camera following
11. Added reload animation feedback
12. Improved pickup hover animation
13. Better door opening visual feedback
14. Enhanced boss health bar
15. Added low health warning pulse
16. Improved weapon switching feedback
17. Better keycard display
18. Enhanced credits/XP display
19. Improved level transition feedback
20. Better game over/victory screens

## Refine Passes (20 required)
1. Matched dark atmospheric color palette from reference
2. Matched HUD blue/cyan color scheme
3. Matched industrial sci-fi wall textures
4. Matched metal grated floor patterns
5. Matched yellow/black hazard stripe style
6. Matched enemy green color scheme
7. Matched player armor blue/gray tones
8. Matched flashlight beam warmth
9. Matched motion tracker green scan line
10. Matched health bar green/red gradient
11. Matched weapon display panel style
12. Matched credits number display
13. Matched ammo counter format
14. Matched level name header style
15. Matched door frame appearance
16. Matched pickup glow effects
17. Matched particle size and speed
18. Matched screen darkness level
19. Matched enemy eye glow red color
20. Matched overall sci-fi horror atmosphere

## Feature Verification Checklist
- [x] Player movement (WASD)
- [x] Mouse aiming
- [x] Shooting mechanics
- [x] Weapon switching (1-4)
- [x] Reload (R)
- [x] 4 weapons: Assault Rifle, SMG, Shotgun, Flamethrower
- [x] 3 enemy types: Scorpion, Scorpion Laser, Arachnid
- [x] Boss: Hive Commander
- [x] 5 levels
- [x] Keycards and doors
- [x] Health/ammo pickups
- [x] Flashlight lighting
- [x] Dark atmosphere
- [x] HUD: Lives, XP, Health, Credits, Ammo
- [x] Debug overlay (Q key)
- [x] Level transitions
- [x] Motion tracker
- [x] Laser sight
- [x] Shell casings
- [x] Ambient particles
- [x] Emergency warning lights

## Post-Mortem
### What Went Well
- Quick initial implementation with all core features
- Motion tracker adds excellent atmosphere
- Laser sight improves gameplay feel
- Dark lighting creates horror mood

### What Went Wrong
- Had to balance many visual features
- Some features required multiple iterations

### Time Spent
- Initial build: ~20 minutes
- Expand passes: ~30 minutes
- Polish passes: ~15 minutes
- Refine passes: ~10 minutes
- Total: ~75 minutes
