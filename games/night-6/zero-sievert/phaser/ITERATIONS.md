# Iterations Log: zero-sievert (Phaser)

## Summary
- Game builds and runs successfully
- Harness interface implemented
- Core extraction shooter mechanics verified

## Iteration 1-10: Added Missing Features

### Added Features
- [x] Radiation zones (4 per zone, reduces max HP when inside)
- [x] Grenade throwing (G key, 3 grenades, AOE damage with falloff)
- [x] ADS (Aim Down Sights) with RMB (60% accuracy improvement)
- [x] Flashlight toggle (F key, visible cone)
- [x] Damage direction indicator (red arc shows damage source)
- [x] Screen shake on taking damage
- [x] Accuracy affected by movement and sprinting
- [x] Grenade explosion visual effects
- [x] Self-damage from grenades if too close
- [x] UI shows radiation, ADS, flashlight, and grenade count

### Bug Fixes
- Fixed duplicate weapon text in UI
- Added proper radiation accumulation
- Added grenade friction for realistic throw

## Verified Features
- [x] Twin-stick shooter controls (WASD + mouse)
- [x] Multiple weapon types
- [x] Enemy AI (patrol, alert, combat states)
- [x] Multiple enemy types (bandits, ghouls, wildlife)
- [x] Loot containers with tiered loot tables
- [x] Extraction point mechanic
- [x] Health and stamina system
- [x] Bleeding status effect
- [x] Dodge roll with i-frames
- [x] Sprint mechanic
- [x] Reload system
- [x] Procedural zone generation
- [x] Death/extraction flow
- [x] **NEW** Radiation zones and status
- [x] **NEW** Grenade throwing
- [x] **NEW** ADS accuracy system
- [x] **NEW** Flashlight
- [x] **NEW** Damage direction indicators
- [x] **NEW** Screen shake feedback

## Notes
- Large 1600x1600 zone map
- Camera follows player
- Multiple extraction points per zone
- Persistent rubles across raids
- 4 radiation zones per map
- Grenades: 80 damage, 100px radius, 2 second fuse
- ADS reduces spread by 60%
- Moving increases spread by 30%
- Sprinting doubles spread
- Flashlight has 200px range, 30 degree cone

