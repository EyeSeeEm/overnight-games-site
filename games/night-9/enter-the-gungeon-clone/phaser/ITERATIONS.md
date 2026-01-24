# Enter the Gungeon Clone - Phaser Iterations

## Expand Passes (20 required)
1. Added core twin-stick movement (WASD) and mouse aiming
2. Added dodge roll with i-frames (Space key)
3. Added 10 weapon types with different stats and behaviors
4. Added weapon switching with number keys 1-0
5. Added ammo system with magazine and reload mechanics
6. Added 10 enemy types with unique behaviors
7. Added 5 bullet patterns: single, spread3, spread6, cardinal, spiral
8. Added room-based procedural dungeon generation
9. Added 3 floors: Keep of the Lead Lord, Gungeon Proper, Forge
10. Added 3 bosses: Bullet King, Beholster, High Dragun
11. Added boss attack patterns (4 attacks each)
12. Added blanks to clear all enemy bullets
13. Added heart-based health system (6 HP = 3 hearts)
14. Added armor system for extra protection
15. Added pickups: shells (currency), ammo, health
16. Added room objects: pillars, crates, barrels, tables
17. Added explosive barrels that damage nearby enemies
18. Added enemy drops on death
19. Added splitting enemies (blobulon)
20. Added summoner enemies (gunjurer)

## Polish Passes (20 required)
1. Added HUD with heart display (full/half/empty)
2. Added blanks counter with icon
3. Added keys counter with icon
4. Added shells (currency) counter with icon
5. Added weapon name display at bottom
6. Added ammo counter (current/max)
7. Added floor name display at center top
8. Added room progress counter (Room X/Y)
9. Added muzzle flash effect on shooting
10. Added damage flash (red tint) when player hit
11. Added invincibility frames after damage
12. Added dodge roll visual (transparent, squashed sprite)
13. Added boss HP bar at bottom of boss room
14. Added enemy damage flash (white tint)
15. Added blank visual effect (expanding circle)
16. Added menu screen with controls
17. Added game over screen with stats
18. Added victory screen with run summary
19. Added door states (open when room cleared)
20. Added pickup spawning after room clear

## Refine Passes (20 required)
1. Floor tiles use dark blue-gray matching dungeon aesthetic
2. Walls have border style for visual distinction
3. Enemy sprites are bullet-shaped with faces
4. Boss sprites have unique appearances per boss
5. HUD positioned like reference (hearts top-left)
6. Weapon icons generated for each weapon type
7. Heart icons match iconic shape (full/half/empty)
8. Blank icons are blue circular bombs
9. Key icons are golden with proper shape
10. Shell icons are golden coins
11. Boss attack patterns match GDD descriptions
12. Dodge roll has proper i-frame timing (first half)
13. Weapon damage and fire rates balanced per tier
14. Enemy fire rates tuned for challenge
15. Room size matches GDD recommendations (25x15 tiles)
16. Boss HP values match GDD (600/800/1500)
17. Cover objects provide tactical options
18. Bullet speeds balanced for dodging
19. Debug overlay shows comprehensive game state
20. Floor progression increases difficulty

## Feature Verification Checklist
- [x] Twin-stick controls (WASD move, mouse aim)
- [x] Dodge roll with i-frames (Space)
- [x] 10 weapons with different stats
- [x] Weapon switching (1-0 keys)
- [x] Ammo and reload system
- [x] 10 enemy types
- [x] Multiple bullet patterns
- [x] Room-based dungeon generation
- [x] 3 floors with progression
- [x] 3 bosses with attack patterns
- [x] Blanks (E key)
- [x] Hearts health system
- [x] Armor
- [x] Currency (shells)
- [x] Keys
- [x] Room objects (cover)
- [x] Pickups (ammo, health, shells)
- [x] HUD with all elements
- [x] Debug overlay (Q key)
- [x] Menu screen
- [x] Victory/Game Over screens

## Post-Mortem
### What Went Well
- Twin-stick shooting feels responsive
- Dodge roll timing works well
- Boss patterns create bullet-hell challenge
- HUD shows all relevant information

### What Went Wrong
- Could add more weapon variety effects (homing, pierce)
- Minimap not implemented
- Could add chest/shop system

### Time Spent
- Initial build: ~60 minutes
- Expand passes: ~25 minutes
- Polish passes: ~15 minutes
- Refine passes: ~10 minutes
- Total: ~110 minutes
