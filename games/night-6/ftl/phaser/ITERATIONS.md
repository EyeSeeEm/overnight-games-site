# Iterations Log: ftl (Phaser)

## Summary
- Game builds and runs successfully
- Harness interface implemented
- Core FTL mechanics verified

## Iteration 1-10: Added Missing Features

### Added Features
- [x] Crew members with individual health and positions
- [x] Crew can be moved between rooms (C to select, click room)
- [x] Crew can repair damaged systems (R key)
- [x] Crew in piloting room required for evasion
- [x] Crew in medbay heals over time
- [x] Fire mechanics - weapons can start fires
- [x] Fire spreads between rooms
- [x] Fire damages crew in room
- [x] Fire damages systems in room
- [x] Crew fights fires (reduces duration)
- [x] System damage from hits
- [x] System targeting (click enemy rooms to target specific systems)
- [x] Damaged systems reduce effectiveness
- [x] Destroyed systems disable functions
- [x] Screen shake on hits and damage
- [x] Visual fire effects (room color flicker)
- [x] Crew status display showing health and location

### Bug Fixes
- Fixed weapon charge accounting for system damage
- Fixed shield recharge accounting for system damage
- Fixed evasion calculation with pilot requirement

## Verified Features
- [x] Pausable real-time combat (Space to toggle)
- [x] Power management system
- [x] Ship systems (shields, weapons, engines, oxygen, medbay)
- [x] Weapon charging and firing
- [x] Shield layers and recharge
- [x] Evasion based on engine power
- [x] Sector map with beacons
- [x] Jump/travel system (costs fuel)
- [x] Random events with choices
- [x] Combat against enemy ships
- [x] Scrap/resource economy
- [x] Multiple sectors progression
- [x] Rebel fleet advancement
- [x] Victory/defeat conditions
- [x] **NEW** Crew management system
- [x] **NEW** Fire/hazard mechanics
- [x] **NEW** System targeting and damage
- [x] **NEW** Screen shake feedback

## Notes
- 8 sectors to complete
- Multiple enemy types (scout, fighter, cruiser)
- Events include stores, distress signals, rewards
- Power distributed between systems using 1-3 keys
- C key cycles crew selection
- Click player ship rooms to move selected crew
- R key repairs systems (crew must be in room)
- Click enemy rooms to target specific systems
- F key fires all ready weapons at target
- Fire chance varies by weapon (missiles: 40%, heavy laser: 30%)
- Crew in medbay heals 6 HP/sec per power level
- Targeting enemy weapons system can disable their attacks
- Targeting enemy engines reduces their evasion

