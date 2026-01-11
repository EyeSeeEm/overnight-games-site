# Implemented Features: Quasimorph Clone (Canvas)

## Core Mechanics
- [x] Turn-based combat with AP system
- [x] Stance system (Sneak/Walk/Run with 2/4/6 AP)
- [x] Tile-based movement (1 AP per tile)
- [x] Click to shoot at enemies
- [x] Space to end turn
- [x] Auto-end turn at 0 AP when no visible enemies

## Combat System
- [x] Accuracy calculation (distance, cover, wounds)
- [x] Damage calculation with armor reduction
- [x] Cover system (half 25%, full 50% reduction)
- [x] Line of sight raycasting
- [x] Fog of war (unexplored areas hidden)
- [x] Critical hit system (15% chance, 2x damage)
- [x] Kill streak XP bonuses
- [x] Overwatch mechanic

## Weapon System
- [x] Multiple weapon types (Pistol, SMG, Shotgun, Rifle, Sniper, MG, Flamethrower)
- [x] Reload mechanic (R key, 1 AP)
- [x] Ammo types (9mm, 7.62mm, 12ga, .50cal, fuel cells)
- [x] Weapon switching (Q key)
- [x] Burst fire (SMG 3-round burst)
- [x] Pellet spread (Shotgun)
- [x] Weapon durability and jamming
- [x] AP and Incendiary ammo variants

## Wound System
- [x] 6 body parts (head, torso, arms, legs)
- [x] Wound effects (accuracy penalties, AP reduction)
- [x] Bleeding damage per turn
- [x] Wound treatment (Bandage, Medkit, Surgery Kit)
- [x] Painkillers for temporary relief

## Corruption System
- [x] Corruption meter (0-1000)
- [x] Corruption increases per turn and combat
- [x] Threshold 200: Enemy transform chance 10%
- [x] Threshold 400: Transform 25%, visual tint
- [x] Threshold 600: Transform 50%, elite spawns
- [x] Threshold 800: All transform, boss spawn
- [x] Threshold 1000: Extraction blocked
- [x] Corruption reduction items (Cigarettes, Alcohol, Sedatives, Psi-Blocker)

## Enemy System
- [x] 11 enemy types (Guard, Soldier, Heavy, Sniper, Officer, Corrupted, Elite, Bloater, Stalker, Screamer, Brute)
- [x] Enemy AI (patrol, alert, hunt states)
- [x] Alert levels (Unaware, Suspicious, Alert, Hunting)
- [x] Enemy attack animations
- [x] Enemy turn indicator
- [x] Phase Walker (high corruption)
- [x] Boss: The Baron (corruption 1000)

## Level Generation
- [x] Procedural room-based generation
- [x] Multi-floor (3 floors)
- [x] Doors between rooms
- [x] Cover objects (crates, pillars)
- [x] Extraction zone on final floor
- [x] Hazard tiles (fire, toxic)
- [x] Environmental hazards
- [x] Explosive barrels
- [x] Vent system

## Loot System
- [x] Loot containers in rooms
- [x] Random drops (weapons, ammo, items)
- [x] Terminal hacking for rewards
- [x] Quality tiers (Common, Uncommon, Rare, Epic)
- [x] Blueprint drops

## Items & Consumables
- [x] Bandage (heal light/moderate wounds)
- [x] Medkit (heal severe, +30 HP)
- [x] Stim Pack (+2 AP for 3 turns)
- [x] Frag Grenade (40 dmg, 2-tile radius)
- [x] Flashbang (stun 2 turns)
- [x] Smoke Grenade (block LoS 3 turns)
- [x] Surgery Kit (critical wounds)
- [x] Painkillers, Antibiotics

## Equipment System
- [x] Head armor slot
- [x] Torso armor slot
- [x] Leg armor slot
- [x] Armor damage reduction
- [x] Equipment durability
- [x] Repair kits

## Progression System
- [x] XP from kills
- [x] Level up (+10 HP, +2 armor)
- [x] Weapon skill leveling
- [x] Clone roster management
- [x] Class system (Assault, Scout)
- [x] Mercenary types (Grunt, Veteran, Scrounger)
- [x] Statistics tracking
- [x] Achievement system

## UI Elements
- [x] HP bar display
- [x] AP pips display
- [x] Stance indicator
- [x] Weapon name and ammo
- [x] Item counts
- [x] Armor value
- [x] Corruption meter
- [x] Floor indicator
- [x] Kill counter
- [x] Turn counter
- [x] XP bar
- [x] Minimap with enemy tracking
- [x] Action log
- [x] Hit chance on hover
- [x] Boss health bar
- [x] Enemy turn indicator

## Visual Effects
- [x] Muzzle flash particles
- [x] Blood splatter (red/purple)
- [x] Floating damage numbers
- [x] Screen shake
- [x] Corruption visual tint
- [x] Enemy health bars
- [x] Cover textures
- [x] Hazard effects
- [x] Terminal cursor
- [x] Extraction chevrons
- [x] Debug overlay (backtick)

## Stealth System
- [x] Sound detection
- [x] Vision cones
- [x] Alert decay
- [x] Patrol paths
- [x] Body disposal
- [x] Backstab mechanic

## Game States
- [x] Title/menu screen
- [x] Gameplay state
- [x] Player turn
- [x] Enemy turn
- [x] Game over screen
- [x] Victory screen

## Accessibility
- [x] Difficulty modes
- [x] Options menu
- [x] Keybinding menu
- [x] Performance mode
- [x] Tutorial hints

## Not Yet Implemented
- [ ] Full ship hub between missions
- [ ] Sound effects (framework only)
- [ ] Music (framework only)
- [ ] Full crafting system
- [ ] All 6 classes
- [ ] All 6 mercenary types
