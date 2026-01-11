# Implemented Content: Derelict Ship (Canvas)

## Enemy Types (6 total)
- [x] Crawler
  - HP: 30, Damage: 15, Speed: 80 px/s
  - Behavior: Patrol + chase
  - Size: 14px, Visual: Low body, orange eyes
- [x] Shambler
  - HP: 60, Damage: 25, Speed: 50 px/s
  - Behavior: Patrol + chase (slow)
  - Size: 16px, Visual: Upright, red eyes
- [x] Stalker
  - HP: 45, Damage: 20, Speed: 150 px/s
  - Behavior: Invisible when stationary, fast attacks
  - Size: 12px, Visual: Thin, purple eye
- [x] Bloater
  - HP: 100, Damage: 10, Speed: 40 px/s
  - Behavior: Explodes on death (40 dmg, 100px radius)
  - Size: 20px, Visual: Circular with pustules
- [x] Hunter
  - HP: 80, Damage: 35, Speed: 180 px/s
  - Behavior: Persistent chase, never gives up
  - Size: 18px, Visual: Large, bright red eyes
  - Drops: 50% Medkit (L) on death
- [x] Mimic
  - HP: 50, Damage: 30, Speed: 100 px/s
  - Behavior: Disguised as item until player approaches
  - Size: 14px, Visual: Looks like O2 canister

## Weapons - Melee (4 total)
- [x] Pipe
  - Damage: 20, Range: 45px, Speed: 1.0x
  - Starting weapon
- [x] Wrench
  - Damage: 25, Range: 50px, Speed: 0.8x
- [x] Fire Axe
  - Damage: 40, Range: 55px, Speed: 0.6x
- [x] Stun Baton
  - Damage: 15, Range: 40px, Speed: 1.2x
  - Special: 2 second stun on hit

## Weapons - Ranged (3 total)
- [x] Pistol
  - Damage: 25, Range: 400px, Mag: 12
  - Ammo: 9mm, Makes noise
- [x] Revolver
  - Damage: 45, Range: 450px, Mag: 6
  - Ammo: .44, Makes noise
- [x] Crossbow
  - Damage: 35, Range: 500px, Mag: 1
  - Ammo: Bolts, Silent

## Ammo Types (3 total)
- [x] 9mm - For Pistol
- [x] .44 - For Revolver
- [x] Bolts - For Crossbow

## Items - Health (4 total)
- [x] O2 Canister (S) - +25 O2
- [x] O2 Canister (L) - +50 O2
- [x] Medkit (S) - +30 HP
- [x] Medkit (L) - +60 HP

## Items - Ammo (3 total)
- [x] 9mm Ammo - +12 rounds
- [x] .44 Ammo - +6 rounds
- [x] Crossbow Bolts - +4 bolts

## Items - Combat (2 total)
- [x] Frag Grenade - Throwable explosive
- [x] Flare - Light source (stored)

## Items - Utility (1 total)
- [x] Stimpack - +50% speed for 15 seconds

## Item Drop Weights
- O2 Small: 25
- O2 Large: 10
- Medkit Small: 20
- Medkit Large: 8
- 9mm Ammo: 15
- .44 Ammo: 8
- Bolts: 5
- Stimpack: 3
- Flare: 5
- Grenade: 2

## Room Types (3 total)
- [x] Normal rooms (varied sizes 4-8 tiles)
- [x] Corridors (connecting rooms)
- [x] Escape pod room (exit point)
- [ ] Medical bay
- [ ] Engineering
- [ ] Cargo hold
- [ ] Research lab
- [ ] Command bridge

## Sectors (1 total)
- [x] Sector 1 (starting area)
- [ ] Sector 2 (Medical Bay)
- [ ] Sector 3 (Engineering)
- [ ] Sector 4 (Cargo Hold)
- [ ] Sector 5 (Research Lab)
- [ ] Sector 6 (Command Bridge)

## Enemy Spawn by Sector
- Sector 1-2: 70% Crawler, 30% Shambler
- Sector 3+: +25% Stalker chance
- Sector 4+: +20% Bloater chance
- Sector 5+: +15% Hunter chance
- Sector 6+: +10% Mimic chance

## Phases (2 total)
- [x] Derelict ship exploration
- [x] Spaceship asteroid escape
- [ ] Multi-ship exploration (meta-loop)

## UI Screens
- [x] Playing state (HUD)
- [x] Game over screen (with rating)
- [x] Victory screen (with efficiency rating)
- [x] Debug overlay
- [ ] Title screen
- [ ] Pause menu
- [ ] Power allocation screen
- [ ] Inventory screen

## Controls
- [x] WASD - Movement
- [x] Mouse - Aim
- [x] Left Click - Attack
- [x] E - Interact
- [x] F - Toggle flashlight
- [x] Shift - Run
- [x] Q - Debug mode
- [x] R - Reload
- [x] G - Throw grenade
- [x] 1 - Pipe
- [x] 2 - Wrench
- [x] 3 - Pistol
- [x] 4 - Crossbow

## Performance Ratings
### Game Over
- LOST: Default
- SURVIVOR: 2+ kills, 30+ seconds
- FIGHTER: 4+ kills, 100+ damage
- WARRIOR: 6+ kills, 2+ crits

### Victory
- D: Default
- C: 3+ kills, < 5 min
- B: 5+ kills, < 3 min
- A: 7+ kills, < 2 min, 3+ crits
- S: 8+ kills, < 1.5 min, 5+ crits
