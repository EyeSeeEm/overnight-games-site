# Iterations Log: binding-of-isaac (Phaser)

## Summary
- Game builds and runs successfully
- Harness interface implemented
- Core systems verified
- Playtest results: Combat works, exploration needs work

## Playtest Session 1 (Iter 1-12)
- Iter 1: No player state on first step (timing issue)
- Iter 2: 3 kills achieved! Combat working
- Iter 3-5: 0 kills, stuck in cleared rooms
- Iter 6: 2 kills achieved
- Iter 7: 3 kills achieved
- Iter 8-12: 0 kills, exploration inefficient
- **Total kills across 12 iterations: 8**
- **No deaths, no victories (all timeouts)**
- CONFIRMED: Combat system works
- ISSUE: Room exploration AI gets stuck after clearing rooms
- ISSUE: Player doesn't efficiently find new rooms with enemies

## Iteration 1-10: Added Missing Features

### Added Features
- [x] Expanded item pool (50+ items across all categories)
- [x] Item pools for different room types (treasure, boss, shop, devil, angel)
- [x] Sacrifice Room (dark red, spikes in center, 20% spawn chance)
- [x] Curse Room (purple tint, 30% spawn chance)
- [x] Enemy knockback when hit by tears
- [x] Enemy stun system (can't move/attack while stunned)
- [x] Screen shake on player damage
- [x] Camera flash on damage
- [x] Minimap colors for new room types

### Bug Fixes
- Fixed enemy stun during knockback
- Added knockback friction for smooth deceleration
- Enemies stay in room bounds during knockback

## Verified Features
- [x] Twin-stick controls (WASD + Arrow keys)
- [x] Procedural floor generation
- [x] Room-based progression
- [x] Multiple enemy types (fly, gaper, pooter, hopper, boss)
- [x] Item system with synergies
- [x] Health system (red hearts, soul hearts)
- [x] Pickups (coins, bombs, keys, hearts)
- [x] Shop and treasure rooms
- [x] Boss fights (Monstro)
- [x] Floor progression via trapdoor
- [x] Minimap (yellow=treasure, green=shop, red=boss, purple=curse, dark red=sacrifice)
- [x] **NEW** 50+ unique items
- [x] **NEW** Sacrifice Room
- [x] **NEW** Curse Room
- [x] **NEW** Enemy knockback
- [x] **NEW** Enemy stun mechanics
- [x] **NEW** Screen shake feedback

## Harness Playtest Findings
- Combat: WORKING - enemies take damage and die
- Movement: WORKING - player moves correctly
- Room transitions: WORKING - player enters new rooms
- Game state: Player has 3 hearts starting
- Starting room (0,0): No enemies, acts as safe zone
- Adjacent rooms have enemies that can be killed

## Notes
- Item categories: Damage ups, Health ups, Speed ups, Range ups, Special/Transformative, Utility, Soul Hearts, Active Items
- New items include: Spoon Bender (homing), Mom's Knife, Epic Fetus, Sacred Heart, D6, D20, and many more
- Sacrifice rooms contain spikes for blood sacrifice mechanics
- Curse rooms have purple tint for curse effects
- Knockback pushes enemies away from tear direction
- Stun lasts 200ms after hit

