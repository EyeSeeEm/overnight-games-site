# Implemented Content: Subterrain (Phaser)

## Weapons (5)
- [x] Fists (5 damage, default, infinite durability)
- [x] Shiv (10 damage, 20% bleed chance, 20 durability)
- [x] Pipe Club (20 damage, knockback, 30 durability)
- [x] Stun Baton (15 damage, 2s stun, 25 durability)
- [x] Pistol (15 damage, ranged, 85% accuracy, 100 durability)

## Enemy Types (5)
- [x] Shambler (30 HP, 10 damage, slow, basic melee)
- [x] Crawler (20 HP, 8 damage, fast, lunge attack)
- [x] Spitter (25 HP, 15 damage, ranged acid)
- [x] Brute (80 HP, 25 damage, charge attack, wall stun)
- [x] Cocoon (50 HP, spawns shamblers, infection aura)

## Items - Consumables (7)
- [x] Canned Food (Hunger -30)
- [x] Water Bottle (Thirst -40)
- [x] Medkit (Health +30)
- [x] Antidote (Infection -30)
- [x] Bandage (craftable)
- [x] Torch (craftable)
- [x] Armor Vest (craftable, damage reduction)

## Items - Materials (5)
- [x] Scrap Metal (floor drop, crafting)
- [x] Cloth (floor drop, crafting)
- [x] Chemicals (floor drop, crafting)
- [x] Electronics (floor drop, tier 2 crafting)
- [x] Power Cell (tier 2 crafting)

## Items - Ammo (1)
- [x] Bullets (+10 per pickup)

## Items - Key Items (2)
- [x] Red Keycard (unlocks Escape Pod)
- [x] Data Chip (unlocks Tier 2 recipes)

## Status Effects (3)
- [x] Bleeding (2 damage/sec, 10s duration)
- [x] Stunned (cannot act, 2s duration)
- [x] Slowed (50% speed, 3s duration)

## Sectors (5)
- [x] Central Hub (15x15, safe, workbench, bed, power panel)
- [x] Storage Wing (20x20, 3-5 enemies, 10 containers)
- [x] Medical Bay (20x20, 3-5 enemies, medical station)
- [x] Research Lab (25x25, harder enemies, cocoon)
- [x] Escape Pod (15x15, final area, escape pod)

## Facilities (6)
- [x] Workbench (crafting)
- [x] Bed (fatigue -30)
- [x] Medical Station (health +20)
- [x] Escape Pod (victory)
- [x] Power Panel (toggle sector power)
- [x] Storage Locker

## Tile Types (12)
- [x] Floor (passable)
- [x] Wall (solid)
- [x] Door (sector transition)
- [x] Container (lootable)
- [x] Workbench
- [x] Bed
- [x] Medical Station
- [x] Escape Pod
- [x] Power Panel
- [x] Storage Locker
- [x] Hazard Fire (reserved)
- [x] Hazard Toxic (reserved)

## Crafting Recipes - Tier 1 (4)
- [x] Shiv (2 Scrap, 10 min)
- [x] Pipe Club (3 Scrap, 15 min)
- [x] Bandage (2 Cloth, 5 min)
- [x] Torch (1 Cloth + 1 Chemicals, 10 min)

## Crafting Recipes - Tier 2 (5)
- [x] Pistol (5 Scrap + 2 Electronics, 30 min)
- [x] Pistol Ammo x10 (2 Scrap + 1 Chemicals, 10 min)
- [x] Antidote (3 Chemicals, 15 min)
- [x] Stun Baton (3 Scrap + 2 Electronics + 1 Power Cell, 25 min)
- [x] Armor Vest (4 Scrap + 3 Cloth, 30 min)

## Loot Tables
### Storage Wing
- [x] Food (30%)
- [x] Water (30%)
- [x] Scrap (40%)

### Medical Bay
- [x] Medkit (50%)
- [x] Antidote (50%)

### Research Lab
- [x] Electronics (30%)
- [x] Data Chip (20%)
- [x] Keycard (20%)
- [x] Scrap (30%)

### Enemy Drops
- [x] Scrap (25%)
- [x] Cloth (18%)
- [x] Chemicals (18%)
- [x] Medkit (12%)
- [x] Food (8%)
- [x] Water (7%)
- [x] Antidote (5%)
- [x] Electronics (5%)
- [x] Bullets (2%)

## Floor Item Textures (9)
- [x] Medkit (red cross on green)
- [x] Scrap (brown box)
- [x] Cloth (gray fabric)
- [x] Chemicals (green vial)
- [x] Food (orange can)
- [x] Water (blue bottle)
- [x] Antidote (cyan vial)
- [x] Electronics (purple/gold circuit)
- [x] Bullets (brass rounds)

## UI Colors
- [x] Background: Dark gray (#0a0808)
- [x] Floor: Dark gray (#2a2828)
- [x] Diamond pattern (#323030)
- [x] Wall: Darker gray (#1a1818)
- [x] Blood: Red (#6a2020)
- [x] Acid blood: Green (#305a30)
- [x] Health bar: Red (#aa3030)
- [x] Hunger bar: Orange (#aa6a30)
- [x] Thirst bar: Blue (#3070aa)
- [x] Fatigue bar: Gray (#6a6a6a)
- [x] Infection bar: Green (#30aa40)
- [x] Global infection: Red (#ff4444)
- [x] Stamina bar: Green (#88aa88)
- [x] Weapon text: Blue (#aaaaff)

## Enemy Colors
- [x] Shambler: Tan (#6a5848)
- [x] Crawler: Brown (#5a4838)
- [x] Spitter: Green (#4a6a4a)
- [x] Spitter acid: Bright green (#6aaa5a)
- [x] Brute: Rust (#7a5848)
- [x] Cocoon: Orange (#aa6a30)
- [x] Charge indicator: Orange (#ff6600)
- [x] Stunned indicator: Yellow (#ffff00)

## Visual Effects (16)
- [x] Blood splatter (red/green circles)
- [x] Death burst particles
- [x] Healing particles (green rising)
- [x] Cure particles (cyan rising)
- [x] Loot sparkle (yellow radial)
- [x] Attack flash (white circle)
- [x] Muzzle flash (yellow/orange)
- [x] Damage flash screen overlay
- [x] Low health vignette pulse
- [x] Infection screen tint
- [x] Floor item bobbing animation
- [x] Dodge flicker effect
- [x] Brute charge tint
- [x] Stunned enemy tint
- [x] Bleeding enemy tint
- [x] Screen shake
