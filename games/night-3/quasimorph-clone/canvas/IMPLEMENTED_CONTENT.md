# Implemented Content: Quasimorph Clone (Canvas)

## Weapons (7 Types)

### Standard Weapons
- [x] Pistol - 1 AP, 6 range, 75% accuracy, 15-20 damage
- [x] SMG - 1 AP, 5 range, 60% accuracy, 10-15 damage, 3-round burst
- [x] Shotgun - 2 AP, 3 range, 80% accuracy, 25-40 damage, 5 pellets
- [x] Combat Rifle - 2 AP, 10 range, 70% accuracy, 30-40 damage
- [x] Sniper Rifle - 2 AP, 15 range, 85% accuracy, 50-70 damage

### Heavy Weapons
- [x] Machine Gun - 2 AP, 7 range, 50% accuracy, 15-25 damage, 5-round burst
- [x] Flamethrower - 1 AP, 3 range, 95% accuracy, 10 DoT, cone AoE

## Ammo Types (6 Types)
- [x] 9mm - Pistols, SMGs
- [x] 7.62mm - Rifles
- [x] 12 Gauge - Shotguns
- [x] .50 Cal - Sniper, Heavy MG
- [x] Fuel Cells - Flamethrower
- [x] AP Rounds - +50% armor penetration
- [x] Incendiary Rounds - Fire DoT

## Enemies (11 Types)

### Human Enemies
- [x] Guard - 50 HP, 2 AP, pistol, patrols
- [x] Soldier - 75 HP, 2 AP, SMG, aggressive
- [x] Heavy - 120 HP, 2 AP, shotgun, slow
- [x] Sniper - 40 HP, 2 AP, rifle, long range
- [x] Officer - 60 HP, 3 AP, pistol, buffs allies

### Corrupted Enemies
- [x] Corrupted/Possessed - 80 HP, 3 AP, claws, fast
- [x] Corrupted Elite - 100 HP, 3 AP, stronger variant
- [x] Bloater - 150 HP, 1 AP, explodes on death
- [x] Stalker - 60 HP, 4 AP, ambush, poison
- [x] Screamer - 40 HP, 2 AP, stuns in radius
- [x] Brute - 200 HP, 2 AP, destroys cover

### Dimensional Horrors
- [x] Phase Walker - 100 HP, 3 AP, teleports, ignores armor

## Bosses (1 Type)
- [x] The Baron - 500 HP, 4 AP, multiple phases
  - Phase 1: Basic attacks
  - Phase 2: Summons minions
  - Phase 3: Enrage mode

## Consumables (12 Types)

### Medical
- [x] Bandage - Stop bleeding, heal light/moderate
- [x] Medkit - Heal severe, +30 HP
- [x] Surgery Kit - Heal critical wounds
- [x] Painkillers - Ignore wound penalties 5 turns
- [x] Antibiotics - Prevent/cure infection

### Combat
- [x] Stim Pack - +2 AP for 3 turns
- [x] Frag Grenade - 40 damage, 2-tile radius
- [x] Flashbang - Stun 2 turns
- [x] Smoke Grenade - Block LoS 3 turns

### Corruption
- [x] Cigarettes - -25 corruption
- [x] Alcohol - -50 corruption, -10% accuracy
- [x] Sedatives - -100 corruption, -1 AP
- [x] Psi-Blocker - -200 corruption

## Armor (3 Slots)

### Head Armor
- [x] Helmet - 10% protection
- [x] Gas Mask - Toxic immunity
- [x] Night Vision - +2 vision range

### Torso Armor
- [x] Basic Vest - 20% protection
- [x] Tactical Armor - 35% protection
- [x] Heavy Armor - 50% protection

### Leg Armor
- [x] Combat Pants - 10% protection
- [x] Exo-Legs - +1 movement
- [x] Stealth Boots - Silent movement

## Classes (2 Implemented)
- [x] Assault - Fire Transfer (+10% accuracy after kill)
- [x] Scout - Quick Draw (first shot costs 0 AP)
- [ ] Marksman
- [ ] Heavy
- [ ] Infiltrator
- [ ] Pyro

## Mercenaries (3 Implemented)
- [x] Grunt - Balanced starter
- [x] Veteran - +10% accuracy
- [x] Scrounger - +1 inventory slot
- [ ] Medic
- [ ] Demo Expert
- [ ] Ghost

## Room Types (7 Types)
- [x] Storage - Crates, loot
- [x] Barracks - Beds, enemies
- [x] Control - Terminals, objectives
- [x] Medical - Medkits, surgery
- [x] Armory - Weapons, ammo
- [x] Mess Hall - Rations
- [x] Engineering - Hazards, vents

## Hazards (3 Types)
- [x] Fire Tiles - Damage + DoT
- [x] Toxic Tiles - Poison
- [x] Electric Tiles - Stun chance

## Floor Types (3 Floors)
- [x] Floor 1 - Research (blue theme)
- [x] Floor 2 - Security (red theme)
- [x] Floor 3 - Engineering (orange theme)

## Interactive Objects
- [x] Doors (open/closed)
- [x] Locked Doors (require keycard)
- [x] Loot Containers
- [x] Terminals (hackable)
- [x] Cover Objects (half/full)
- [x] Explosive Barrels
- [x] Vents (traversable)
- [x] Extraction Zone

## Keycards (3 Colors)
- [x] Red Keycard
- [x] Blue Keycard
- [x] Yellow Keycard

## Corruption Thresholds (5 Levels)
- [x] 0-199: Normal
- [x] 200-399: Unease (10% transform)
- [x] 400-599: Spreading (25% transform, tint)
- [x] 600-799: Critical (50% transform, elites)
- [x] 800-999: Rapture (all transform, boss)
- [x] 1000: Breach (extraction blocked)

## Difficulty Modes (4 Levels)
- [x] Easy - +50% HP, slower corruption
- [x] Normal - Standard values
- [x] Hard - -25% HP, faster corruption
- [x] Nightmare - Permadeath
