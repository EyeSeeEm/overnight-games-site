# Bullet Dungeon (Enter the Gungeon Clone) - Phaser Version - Iterations Log

## Expand Passes (20 required)
1. Room-based procedural dungeon with Phaser tilemaps
2. Multiple weapon types using weapon data objects
3. Bullet patterns using angle calculations
4. Dodge roll with physics velocity burst
5. Health/armor with container system
6. Key inventory tracking
7. Coin physics with bounce
8. Ammo per weapon type
9. Enemy group with type data
10. Boss scene with phase tracking
11. Chest interaction with overlap
12. Floor scene transitions
13. Room clear event system
14. Enemy bullet groups with patterns
15. Weapon drop sprites
16. Shop scene with UI
17. Hidden room detection
18. Active item cooldown
19. Passive stat modifiers
20. Death scene with restart

## Polish Passes (20 required)
1. Gungeon color constants
2. Procedural bullet-kin textures
3. Gun sprite rotation to mouse
4. Particle emitter for muzzle flash
5. Shell casing particle physics
6. Bullet trail graphics
7. Camera shake integration
8. Dodge roll alpha/scale tween
9. Heart sprites in UI
10. Text-based ammo display
11. Minimap rendering
12. Floor text indicator
13. Enemy tint on damage
14. Blood particle emitter
15. Chest glow tween
16. Key sparkle particles
17. Coin bounce tween
18. Floating damage text
19. Scene fade transitions
20. Stats display on death

## Feature Verification Checklist (from GDD)
- [x] Top-down twin-stick shooter
- [x] Dodge roll mechanic
- [x] Multiple weapons
- [x] Bullet hell patterns
- [x] Room-based dungeon
- [x] Key/chest system
- [x] Hearts health system
- [x] Ammo management
- [x] Enemy variety
- [x] Minimap

## Post-Mortem

### What Went Well
- Phaser's arcade physics handled many bullets efficiently
- Tween system made dodge roll feel smooth
- Scene system cleanly separated game states
- Particle emitters added polish with minimal code
- Group recycling prevented memory issues

### What Went Wrong
- Initial mouse aiming had offset issues with camera
- Bullet group needed custom destroy to prevent orphans
- Boss phase transitions were tricky with state management
- Tilemap collision bounds didn't match visuals perfectly

### Key Learnings
- Use Phaser.Math.Angle.Between for mouse aiming
- Bullet groups need explicit cleanup on scene change
- Boss fights benefit from state machine pattern
- Always test tilemap collision bounds visually

### Time Spent
- Initial build: ~30 minutes
- Expand passes: ~35 minutes
- Polish passes: ~25 minutes
- Total: ~90 minutes

### Difficulty Rating
Hard - Bullet hell complexity plus Phaser's tilemap quirks
