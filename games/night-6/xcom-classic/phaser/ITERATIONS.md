# Iterations Log: xcom-classic (Phaser)

## Summary
- Game builds and runs successfully
- Harness interface implemented
- Core tactical combat mechanics verified

## Iteration 1-10: Added Missing Features

### Added Features
- [x] Frag grenades with throwing mechanics (G key)
- [x] Grenade scatter based on throwing accuracy
- [x] Explosive damage with radius falloff
- [x] Screen shake on hits and explosions
- [x] Destructible terrain (walls, cover, doors become rubble)
- [x] Ammo tracking system with reload (R key)
- [x] Morale system - drops when allies die
- [x] Panic mechanic - panicked soldiers can't act
- [x] Improved UI showing ammo count and grenades
- [x] Morale display in soldier stats

### Bug Fixes
- Fixed weapon ammo not being consumed
- Added proper panic check before firing

## Verified Features
- [x] Time Units (TU) system for all actions
- [x] Multiple soldier squad (4-6 soldiers)
- [x] Soldier stats (TU, health, reactions, accuracy, bravery)
- [x] Three shot types (Snap, Aimed, Auto)
- [x] TU cost varies by shot type (25%, 80%, 35%)
- [x] Kneeling stance (+15% accuracy, costs TU)
- [x] Fog of war with line of sight
- [x] Reaction fire system
- [x] Multiple alien types (Sectoid, Floater, Muton)
- [x] Alien AI (patrol, detect, attack, pursue)
- [x] Procedural map generation (buildings, cover, debris)
- [x] Cover system (partial, full)
- [x] Turn-based combat (player/alien phases)
- [x] Damage calculation with armor
- [x] UI with action buttons and icons
- [x] Tooltips on hover
- [x] Health and TU bars for units
- [x] Victory condition (all aliens eliminated)
- [x] Defeat condition (all soldiers dead)
- [x] **NEW** Grenades with AOE damage
- [x] **NEW** Destructible terrain
- [x] **NEW** Ammo/reload system
- [x] **NEW** Morale and panic

## Notes
- 20x15 tile map with procedural generation
- 4 soldiers vs 4-6 aliens per mission
- Each soldier starts with 2 grenades
- Grenades do 50 damage with 3-tile radius
- Walls destroyed by explosions become rubble
- Morale drops 15-25 when ally dies
- Panic triggers at morale < 30 (modified by bravery)
- Ammo: Rifle 20, Pistol 12, Heavy Cannon 6
- Reload costs 15 TU

