# Iterations Log: system-shock-2d (Phaser)

## Summary
- Game builds and runs successfully
- Harness interface implemented
- Core systems verified

## Iteration 1-10: Added Missing Features

### Added Features
- [x] Status effects system (bleeding, shocked, irradiated)
- [x] Bleeding: deals 2 damage per second, lasts 10 seconds
- [x] Irradiated: deals 1 damage per 2 seconds, lasts 15 seconds
- [x] Shocked: reduces movement speed by 70%, lasts 3 seconds
- [x] Weapon durability/jamming system
- [x] Weapons degrade with use, jam when durability low
- [x] Jam chance increases as durability drops below 30%
- [x] Skill upgrade menu (U key)
- [x] Spend cyber modules to upgrade: Firearms, Melee, Hacking, Stealth, Endurance
- [x] Skill costs: 10, 20, 40, 80, 160 per level (max level 5)
- [x] Endurance upgrades increase max HP
- [x] Enemy knockback when shot
- [x] Enemy stun (150ms) after being hit
- [x] Boss enemies (Cyber Midwife, Rogue Protocol)
- [x] Boss in Engineering deck boss arena
- [x] Expanded M.A.R.I.A. dialogue system
- [x] Dialogue pools: combat, damage_taken, explore, hacking, boss_spawn
- [x] Crouching (Ctrl) reduces enemy detection range by 50%
- [x] UI shows status effects, weapon durability, cyber modules
- [x] New items: laser_pistol, energy_clip, anti_toxin, repair_kit, audio_log

### Bug Fixes
- Added knockback friction for smooth deceleration
- Enemies stay in bounds during knockback
- Boss enemies don't retreat when player moves away
- Fixed missing isBoss flag in spawn

## Verified Features
- [x] Player movement (WASD)
- [x] Twin-stick aiming (mouse)
- [x] Shooting and melee combat
- [x] Enemy AI (patrol, alert, chase, attack)
- [x] Hacking mini-game framework
- [x] Item pickups
- [x] Health/Energy system
- [x] M.A.R.I.A. taunts
- [x] Flashlight/vision system
- [x] Dodge roll with i-frames
- [x] Multiple enemy types
- [x] Deck system
- [x] **NEW** Status effects (bleeding, shocked, irradiated)
- [x] **NEW** Weapon durability and jamming
- [x] **NEW** Skill upgrade system
- [x] **NEW** Enemy knockback and stun
- [x] **NEW** Boss enemies
- [x] **NEW** Crouching stealth modifier

## Notes
- Status effects: Mutants can irradiate (30% chance), Crawlers/Assassins can cause bleeding (25%)
- Weapons degrade: Ranged -1 per shot, Melee -0.5 per hit
- Jam check at durability < 30: (30 - durability) / 100 chance
- Skill costs scale exponentially
- Boss: Cyber Midwife has 250 HP, 35 damage, triggers M.A.R.I.A. announcement
- Crouching halves detection range
- Knockback force: 80 units, 200ms duration with 0.9 friction

