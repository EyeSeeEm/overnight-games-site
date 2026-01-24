# Tears of the Basement (Binding of Isaac Clone) - Canvas Iterations

## Expand Passes (20 required)
1. Initial build with player movement (WASD) and room system
2. Added arrow key shooting for tears (projectiles)
3. Added 13x7 tile grid room layout as per GDD
4. Added heart health system (red hearts, soul hearts)
5. Added HUD with hearts at top, resources on left
6. Added minimap with room discovery (fog of war)
7. Added room generation with connected rooms
8. Added door transitions between rooms
9. Added 7 enemy types: Fly, Pooter, Gaper, Mulligan, Clotty, Fatty, Host
10. Added boss battles: Monstro, Duke of Flies
11. Added item system with pedestals
12. Added 10 items: Sad Onion, Magic Mushroom, Pentagram, etc.
13. Added pickup system: hearts, coins, bombs, keys
14. Added tile types: rocks, poop, pits, fire, spikes
15. Added shop rooms with purchasable items
16. Added treasure rooms (locked, needs key)
17. Added bomb placement and explosion mechanic
18. Added 3 floor progression: Basement, Caves, Depths
19. Added trapdoor to next floor after boss
20. Added victory condition (defeat Mom's Heart on Depths)

## Polish Passes (20 required)
1. Improved Isaac character with crying face and big eyes
2. Added pupil tracking (eyes follow shoot/move direction)
3. Added crying tears animation when shooting
4. Improved enemy designs with eyes tracking player
5. Added enemy spawn animation (invulnerable during spawn)
6. Added boss HP bar at bottom of screen
7. Added item cosmetics (Spoon Bender headband, Polyphemus eye)
8. Added tear shine effect (white highlight)
9. Added slight gravity to tears (arc trajectory)
10. Added knockback when enemies are hit
11. Added invincibility frames with flashing
12. Added floor pattern with alternating tiles
13. Added door frame styling
14. Improved pickup visuals (heart shapes, bomb fuse)
15. Added pedestal glow effect
16. Added item name display with bobbing animation
17. Added enemy death drops
18. Added room clear reward drops
19. Improved poop rendering (swirl shape with face)
20. Added fire animation (flickering flames)

## Refine Passes (20 required)
1. Matched room color to reference (brown basement)
2. Matched wall frame color scheme
3. Matched heart rendering to reference style
4. Matched Isaac character proportions (big head, small body)
5. Matched HUD layout (hearts top, resources left, minimap right)
6. Added stats display (DMG, SPD, TEARS)
7. Matched floor name display at bottom
8. Added proper room type colors on minimap (yellow treasure, red boss)
9. Fixed controls: WASD move, Arrow keys shoot (as per GDD)
10. Added enemy behavior patterns (chase, shoot, host pop-up)
11. Added boss phase system (Monstro: hop, spit, jump)
12. Added homing tears (Spoon Bender)
13. Added piercing tears (Cupid's Arrow)
14. Added triple shot (Inner Eye)
15. Added large tears (Polyphemus)
16. Added enemy projectiles with proper collision
17. Added tile destruction (bombs destroy rocks/poop)
18. Improved room discovery (fog of war on minimap)
19. Added key requirement for treasure rooms
20. Fixed room persistence (cleared rooms stay cleared)

## Feature Verification Checklist
- [x] Player movement (WASD)
- [x] Arrow key shooting
- [x] 13x7 tile grid rooms
- [x] Heart health system
- [x] Soul hearts
- [x] HUD with hearts, resources, stats
- [x] Minimap with fog of war
- [x] 7 enemy types
- [x] 2 boss types (Monstro, Duke)
- [x] Item pedestals
- [x] 10 items with effects
- [x] Pickup system
- [x] Tile types (rock, poop, pit, fire, spikes)
- [x] Shop rooms
- [x] Treasure rooms (key locked)
- [x] Bomb mechanic
- [x] 3 floors (Basement, Caves, Depths)
- [x] Room transitions
- [x] Debug overlay (Q key)
- [x] Victory/defeat states

## Post-Mortem
### What Went Well
- Character and enemy designs match Isaac aesthetic
- Room-based exploration works correctly
- Item system with visual effects
- Boss battles with multiple phases
- HUD layout matches reference

### What Went Wrong
- Initial confusion about controls (fixed to WASD/Arrows)
- Room generation needed multiple iterations

### Time Spent
- Initial build: ~45 minutes
- Expand passes: ~50 minutes
- Polish passes: ~40 minutes
- Refine passes: ~35 minutes
- Total: ~170 minutes
