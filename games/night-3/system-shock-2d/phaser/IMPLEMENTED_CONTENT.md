# Implemented Content: System Shock 2D (Phaser)

## Weapons - Melee (4)
- [x] Wrench (15 damage, fast, infinite durability)
- [x] Pipe (20 damage, medium speed, knockback)
- [x] Stun Prod (10 damage, fast, 2s stun effect)
- [x] Laser Rapier (35 damage, fast, energy cost, bypasses armor)

## Weapons - Ranged Ballistic (3)
- [x] Pistol (12 damage, 12 mag, 0.3s fire rate)
- [x] Shotgun (8x6 pellets, 6 mag, 0.8s fire rate, spread)
- [x] SMG (8 damage, 30 mag, 0.1s fire rate, recoil)

## Weapons - Laser (2)
- [x] Laser Pistol (20 damage, 20 energy, 50% armor pen)
- [x] Laser Rifle (35 damage, 30 energy, 70% armor pen)

## Weapons - Explosive (1)
- [x] Grenade Launcher (80 damage, 1 mag, 80px blast radius)

## Ammo Types (4)
- [x] Bullets (pistol, SMG)
- [x] Shells (shotgun)
- [x] Energy (laser weapons, flashlight)
- [x] Grenades (grenade launcher, throwables)

## Enemy Types - Cyborgs (4)
- [x] Cyborg Drone (30 HP, melee, common)
- [x] Cyborg Soldier (60 HP, 5 armor, ranged/melee)
- [x] Cyborg Assassin (40 HP, stealth, cloaking)
- [x] Cyborg Heavy (120 HP, 15 armor, tank, slow)

## Enemy Types - Mutants (2)
- [x] Mutant Crawler (20 HP, fast swarm, can cause bleeding)
- [x] Mutant Brute (100 HP, 5 armor, charge attack)

## Enemy Types - Robots (2)
- [x] Maintenance Bot (40 HP, 10 armor, patrol, alerts)
- [x] Security Bot (80 HP, 15 armor, aggressive, dual laser)

## Status Effects (4)
- [x] Bleeding (2 HP/sec, 10s duration)
- [x] Shocked (0 speed, 0 attack, 3s duration)
- [x] Irradiated (0.33 HP/sec, 30s, stacks 3x)
- [x] Cloaked (invisible, 15s duration)

## Item Types (7)
- [x] Medkit (heals HP, red tint)
- [x] Bullets (yellow tint)
- [x] Shells (orange tint)
- [x] Energy Cells (cyan tint)
- [x] Grenades (green tint)
- [x] Scrap (grey tint, currency)
- [x] Cyber Modules (magenta tint, upgrades)

## Skills (6 categories)
- [x] Firearms (ranged damage)
- [x] Melee (melee damage)
- [x] Hacking (terminal hacking)
- [x] Repair (weapon maintenance)
- [x] Stealth (detection avoidance)
- [x] Endurance (health/stamina)

## Terrain Types (6)
- [x] Floor (walkable, light)
- [x] Floor Alt (walkable, dark)
- [x] Wall (blocked, blocks vision)
- [x] Door (openable)
- [x] Terminal (hackable)
- [x] Exit (victory condition)

## Map Elements
- [x] Procedural rooms (8-12 per map)
- [x] Connecting corridors
- [x] Random door placement (15% chance)
- [x] Random terminal placement (40% per room)
- [x] Deployment zone (first floor tile)
- [x] Exit zone (last room)

## Visual Elements
- [x] Player sprite (grey suit, visor, gun)
- [x] Cyborg sprite (brown, red eye)
- [x] Cyborg Heavy sprite (large, armored)
- [x] Cyborg Assassin sprite (dark blue, glowing)
- [x] Mutant Crawler sprite (green, multiple eyes)
- [x] Mutant Brute sprite (large green, red eyes)
- [x] Maintenance Bot sprite (boxy, green light)
- [x] Security Bot sprite (armored, red light)
- [x] Bullet sprite (yellow glow)
- [x] Laser sprite (cyan glow)
- [x] Item sprite (colored by type)
- [x] Exit sprite (green)

## UI Colors
- [x] Health: Red (#cc4040)
- [x] Energy: Blue (#4080cc)
- [x] Stamina: Yellow (#cccc40)
- [x] Messages: Green (#60cc80)
- [x] Active weapon: Green (#00ff00)
- [x] Secondary weapon: Grey (#aaaaaa)
- [x] Critical hit: Yellow (#ffff00)
- [x] Backstab: Orange (#ff8800)

## M.A.R.I.A. Messages
- [x] "Target acquired" (on detection)
- [x] "You dare access my systems?" (on hack)
- [x] "How predictable" (on death)
- [x] "I am eternal" (on victory)
- [x] Deck welcome message

## Performance Ratings
- [x] S (70%+ accuracy, <60s, 5+ crits)
- [x] A (55%+ accuracy, <90s, 3+ crits)
- [x] B (40%+ accuracy, <120s)
- [x] C (25%+ accuracy, <180s)
- [x] D (default)

## Death Ratings
- [x] COMMENDABLE (8+ kills, 50%+ acc, 2+ crits)
- [x] ACCEPTABLE (5+ kills, 30%+ acc)
- [x] POOR (3+ kills, 30s+ survived)
- [x] FAILURE (default)
