# Iterations Log: subterrain (Phaser)

## Summary
- Game builds and runs successfully
- Harness interface implemented
- Core survival horror mechanics verified

## Iteration 1-10: Added Missing Features

### Added Features
- [x] Map screen (M key) showing all 5 sectors
- [x] Map shows current location, power status
- [x] Map shows sector connections
- [x] Infection screen tint (green overlay at 25%+ infection)
- [x] Hallucination system at 50%+ infection
- [x] Fake enemies flicker and disappear
- [x] Quick slot item usage (1, 2, 3 keys)
- [x] Item consumption from inventory

### Bug Fixes
- Added proper item effect application
- Fixed item count decrement

## Verified Features
- [x] 4 survival meters (health, hunger, thirst, fatigue)
- [x] Personal infection meter
- [x] Global infection clock (0.1%/sec, ~17 min to 100%)
- [x] 5 sectors (Hub, Storage, Medical, Research, Escape Pod)
- [x] Power management system (500 units total)
- [x] 5 enemy types (Shambler, Crawler, Spitter, Brute, Cocoon)
- [x] Enemy AI (detection, pursuit, combat)
- [x] Room state persistence between visits
- [x] Correct spawn positions on room transition
- [x] Container looting system
- [x] Item collection and inventory
- [x] Hub facilities (Workbench, Bed, Power Panel, Storage)
- [x] Medical station (heals and cures infection)
- [x] Research terminal (unlocks tier 2)
- [x] Escape pod win condition
- [x] Red Keycard requirement
- [x] Stamina system for combat
- [x] Dodge mechanic
- [x] Weapon durability
- [x] Meter effects (speed/damage penalties)
- [x] Multiple death conditions (health, infection, global)
- [x] Time system (1 real second = 1 game minute)
- [x] **NEW** Map screen (M key)
- [x] **NEW** Infection screen effects
- [x] **NEW** Hallucinations at high infection
- [x] **NEW** Quick slot item usage

## Notes
- Power budget forces choices: Can't power all sectors (need 750, have 500)
- Optimal path: Storage (100) + Medical (150) + Research (200) = 450, then switch Research for Escape (300)
- Global infection creates urgency (~17 real minutes max)
- Screen turns green at 25%+ infection
- Hallucinations appear at 50%+ infection (random fake enemies)
- Press 1/2/3 to use first 3 inventory items

