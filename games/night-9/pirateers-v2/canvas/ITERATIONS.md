# Pirateers - Canvas Iterations

## Expand Passes (20 required)
1. Initial build with ship movement (A/D turn, W/S speed)
2. Added broadside cannon combat - fires from both sides
3. Added 4 enemy types: Merchant, Navy Sloop, Pirate Raider, Pirate Captain
4. Added enemy AI with patrol and attack states
5. Added cargo system with 11 cargo types (common, uncommon, rare)
6. Added gold and loot drops from destroyed enemies
7. Added 8 islands scattered across map
8. Added 5 ports at islands: Tortuga, Port Royal, Nassau, Havana, Kingston
9. Added port docking system (E key when nearby and stopped)
10. Added trade menu - sell cargo at ports
11. Added ship upgrade system (firepower upgrades)
12. Added day/night cycle with 120 second timer
13. Added fog of war system covering unexplored areas
14. Added minimap showing islands, ports, player, enemies
15. Added Pirate Captain as boss - defeating him wins the game
16. Added victory screen when boss defeated
17. Added game over screen when ship destroyed
18. Added cargo drops floating on water with sparkle effect
19. Added ship collision with islands
20. Added automatic ship repair at ports

## Polish Passes (20 required)
1. Added ship visual with hull, deck, sails, cannon ports
2. Added enemy health bars above ships
3. Added enemy name labels
4. Added boss crown visual for Pirate Captain
5. Added muzzle flash particles when firing
6. Added hit particles when cannonballs connect
7. Added death explosion particles for destroyed ships
8. Added floating gold text (+Xg) when enemy drops gold
9. Added cargo pickup text notification
10. Added wave patterns on water
11. Added water gradient around player
12. Added island visual with sand, grass, trees
13. Added port dock visual
14. Added "Press E to Dock" prompt when near port
15. Added reload indicator (FIRE! when ready)
16. Added speed indicator (STOP, SLOW, HALF, FULL)
17. Added cargo preview icons in bottom HUD
18. Added cannonball trails
19. Added camera zoom (1.5x) for better ship detail
20. Added day timer warning (red when < 30 seconds)

## Refine Passes (20 required)
1. Quick ship acceleration (200 units/sec) per feedback
2. Quick ship deceleration (300 units/sec) per feedback
3. Reduced top speed for better control per feedback
4. Camera zoomed in 1.5x per feedback
5. Added islands and ports per feedback (CRITICAL)
6. Added trading system at ports per feedback (CRITICAL)
7. Added cargo drops from all enemy types per feedback
8. Added always-visible HUD per feedback
9. Fixed enemy respawning after destruction (non-boss)
10. Fixed port price variation (70-130% of base)
11. Balanced enemy stats (HP, damage, speed)
12. Balanced cargo values by rarity tier
13. Fixed minimap enemy visibility (only in revealed areas)
14. Fixed collision detection with islands
15. Added port menu navigation (W/S select, SPACE confirm)
16. Added trade menu (SPACE sell one, A sell all)
17. Fixed day end - returns to center with cargo
18. Fixed ship destroyed - loses 25% cargo
19. Added upgrade cost scaling (100g per level)
20. Added debug overlay toggle (Q key)

## Feature Verification Checklist
- [x] Ship turning with A/D keys
- [x] Ship speed control with W/S keys
- [x] Broadside cannon fire (Space)
- [x] 4 enemy types with different behaviors
- [x] Pirate Captain boss (win condition)
- [x] Fog of war exploration
- [x] Minimap
- [x] Day timer (120 seconds)
- [x] Islands and ports
- [x] Port docking (E key)
- [x] Trading system at ports
- [x] Cargo drops from enemies
- [x] Gold drops from enemies
- [x] Ship upgrades
- [x] HUD with HP, speed, gold, cargo
- [x] Victory/Game Over screens
- [x] Debug overlay (Q key)
- [x] Quick acceleration/deceleration (feedback)
- [x] Zoomed camera (feedback)

## Post-Mortem
### What Went Well
- Broadside combat feels satisfying
- Fog of war creates exploration incentive
- Trading system adds economic depth
- Multiple enemy types create variety
- Minimap provides good situational awareness
- Port system encourages strategic planning

### What Went Wrong
- Initial ship physics too sluggish (fixed per feedback)
- Camera too zoomed out initially (fixed per feedback)
- Missing islands/ports in first version (fixed per feedback)

### Time Spent
- Initial build: ~50 minutes
- Expand passes: ~40 minutes
- Polish passes: ~30 minutes
- Refine passes: ~25 minutes
- Total: ~145 minutes
