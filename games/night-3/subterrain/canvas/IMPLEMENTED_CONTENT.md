# Implemented Content: Subterrain (Canvas)

## Weapons (5 total)
- [x] Fists
  - Damage: 5, Speed: 0.5s
  - Type: Melee, Range: 40px
  - Durability: Infinite
- [x] Shiv
  - Damage: 10, Speed: 0.4s
  - Type: Melee, Range: 45px
  - Durability: 20, Bleed: 20%
- [x] Pipe Club
  - Damage: 20, Speed: 1.0s
  - Type: Melee, Range: 50px
  - Durability: 30, Knockback: 30px
- [x] Stun Baton
  - Damage: 15, Speed: 0.7s
  - Type: Melee, Range: 45px
  - Durability: 25, Stun: 2s
- [x] Pistol
  - Damage: 15, Speed: 0.5s
  - Type: Ranged, Range: 400px
  - Durability: 100

## Crafting Recipes - Tier 1 (5 total)
- [x] Shiv
  - Materials: 2 Scrap
  - Time: 10 min
- [x] Pipe Club
  - Materials: 3 Scrap
  - Time: 15 min
- [x] Bandage
  - Materials: 2 Cloth
  - Time: 5 min
- [x] Torch
  - Materials: 1 Cloth, 1 Chemicals
  - Time: 10 min
- [x] Barricade
  - Materials: 5 Scrap
  - Time: 20 min

## Crafting Recipes - Tier 2 (5 total)
- [x] Pistol
  - Materials: 5 Scrap, 2 Electronics
  - Time: 30 min
- [x] Pistol Ammo x10
  - Materials: 2 Scrap, 1 Chemicals
  - Time: 10 min
- [x] Antidote
  - Materials: 3 Chemicals
  - Time: 15 min
- [x] Stun Baton
  - Materials: 3 Scrap, 2 Electronics, 1 Power Cell
  - Time: 25 min
- [x] Armor Vest
  - Materials: 4 Scrap, 3 Cloth
  - Time: 30 min

## Enemy Types (5 total)
- [x] Shambler
  - HP: 30, Damage: 10, Speed: 50
  - Attack Rate: 1.5s, Infection: +5
  - Behavior: Walks slowly, melee attack
- [x] Crawler
  - HP: 20, Damage: 8, Speed: 120
  - Attack Rate: 1.0s, Infection: +5
  - Behavior: Fast movement, lunges
- [x] Spitter
  - HP: 25, Damage: 15, Speed: 40
  - Attack Rate: 2.5s, Infection: +10
  - Behavior: Ranged acid attack, creates puddles
- [x] Brute
  - HP: 80, Damage: 25, Speed: 30
  - Attack Rate: 2.0s, Infection: +8
  - Behavior: Tanky, charges at player
- [x] Cocoon
  - HP: 50, Damage: 0, Speed: 0
  - Spawn Rate: 60s, Infection: +1/min (aura)
  - Behavior: Spawns shamblers

## Sectors (5 total)
- [x] Central Hub (15x15)
  - Power Cost: 0 (always on)
  - Facilities: Workbench, Bed, Storage Locker, Power Panel
  - Enemies: None (safe zone)
- [x] Storage Wing (20x20)
  - Power Cost: 100
  - Loot: Food, Water, Scrap, Cloth
  - Enemies: 4 (shamblers, crawlers)
- [x] Medical Bay (20x20)
  - Power Cost: 150
  - Loot: Medkits, Antidotes, Chemicals
  - Enemies: 4 (shamblers, spitters)
- [x] Research Lab (25x25)
  - Power Cost: 200
  - Loot: Electronics, Power Cells, Data Chip, Keycard
  - Enemies: 4 (crawlers, spitters, brute), 1 cocoon
- [x] Escape Pod (15x15)
  - Power Cost: 300
  - Requirement: Red Keycard
  - Enemies: 5 (mixed), 1 cocoon

## Consumable Items (4 total)
- [x] Canned Food
  - Effect: Hunger -30
- [x] Water Bottle
  - Effect: Thirst -40
- [x] Medkit
  - Effect: Health +30
- [x] Antidote
  - Effect: Infection -30

## Crafting Materials (5 total)
- [x] Scrap Metal
- [x] Cloth
- [x] Chemicals
- [x] Electronics
- [x] Power Cell

## Key Items (2 total)
- [x] Data Chip
  - Use: Unlocks Tier 2 recipes
  - Location: Research Lab
- [x] Red Keycard
  - Use: Opens Escape Pod door
  - Location: Research Lab

## Ground Pickups (3 types)
- [x] Health Pack
  - Effect: +15 HP
  - Visual: Red box with white cross
- [x] Ammo Box
  - Effect: +5 Ammo
  - Visual: Yellow box
- [x] Antidote Syringe
  - Effect: -15 Infection
  - Visual: Green syringe

## Facilities (6 total)
- [x] Workbench
  - Function: Crafting
  - Power: Not required
- [x] Bed
  - Function: Sleep (fatigue -30)
  - Power: Not required
- [x] Storage Locker
  - Function: Store items
  - Power: Not required
- [x] Power Panel
  - Function: Toggle sector power
  - Power: Not required
- [x] Medical Station
  - Function: Heal (+20 HP)
  - Power: Required
- [x] Research Terminal
  - Function: Use Data Chip
  - Power: Required

## Survival Meter Decay Rates
- Hunger: +0.1/sec (critical at 75)
- Thirst: +0.2/sec (critical at 75)
- Fatigue: +0.067/sec (critical at 75)
- Global Infection: +0.1/sec (game over at 100)

## Status Effects
- [x] Bleed (shiv, 2 damage/sec for 3s)
- [x] Stun (baton/brute wall, immobilized)
- [x] Slow (hunger 50+, 90% speed)
- [x] Weak (fatigue 50+, 80% damage)
- [x] Inaccurate (thirst 50+, 80% accuracy)

## Performance Ratings
### Death Ratings
- SURVIVOR: 15+ kills
- FIGHTER: 10+ kills
- STRUGGLER: 5+ kills
- VICTIM: <5 kills

### Victory Ratings
- S: 80+ efficiency
- A: 60+ efficiency
- B: 40+ efficiency
- C: 20+ efficiency
- D: <20 efficiency

## Tile Types (12 total)
- [x] Floor (diamond pattern)
- [x] Wall (dark)
- [x] Door (per sector type)
- [x] Workbench
- [x] Bed
- [x] Storage Locker
- [x] Power Panel
- [x] Medical Station
- [x] Research Terminal
- [x] Escape Pod
- [x] Container (lootable)

## Special Effects
- [x] Blood splatters (stored positions)
- [x] Acid puddles (3s duration, bubbles)
- [x] Hallucinations (50%+ infection)
- [x] Dodge particles (blue trails)
- [x] Muzzle flash (pistol)
- [x] Screen shake (combat)
- [x] Red damage flash
- [x] Green infection tint
