# Implemented Features: zero-sievert-clone (canvas)

## Core Mechanics
- [x] Player movement (WASD 8-directional)
- [x] Mouse aiming (360 degrees)
- [x] Shooting (LMB)
- [x] Aim down sights (RMB) with accuracy bonus
- [x] Reload (R key)
- [x] Sprint (Shift) with stamina drain
- [x] Dodge roll (Space) with invincibility frames
- [x] Stamina system with regen
- [x] Interaction/looting (E key)
- [x] Inventory toggle (Tab)
- [x] Quick use items (1-4 keys)

## Combat Systems
- [x] Accuracy cone-based spread
- [x] Movement affects accuracy
- [x] Sprint affects accuracy
- [x] ADS improves accuracy
- [x] Bullet penetration values
- [x] Armor damage reduction
- [x] Distance-based damage (via range)
- [x] Weapon fire rate limiting
- [x] Magazine and reload system
- [x] Muzzle flash particles
- [x] Blood splatter particles
- [x] Damage numbers

## Health & Status
- [x] Health system
- [x] Stamina system
- [x] Bleeding status effect (2 HP/sec)
- [x] Heavy bleeding (3 HP/0.5sec)
- [x] Radiation system (reduces max HP)
- [x] Fracture (50% move speed)
- [x] Pain effects (affects accuracy/speed)
- [ ] Hunger system
- [ ] Infection

## Enemy AI
- [x] Patrol state (random wandering)
- [x] Alert state (investigate sound)
- [x] Combat state (chase and attack)
- [x] Line of sight checking
- [x] Vision range per enemy type
- [x] Gunshot alert nearby enemies
- [x] Melee and ranged attack types
- [x] Health bars
- [x] State indicators (green/yellow/red/purple dots)
- [x] Stagger on hit
- [x] Flee state (low HP retreat, purple indicator)
- [ ] Cover usage

## Weapons
- [x] PM Pistol (starter weapon)
- [x] Skorpion SMG (enemy drops)
- [x] Pump Shotgun (enemy drops)
- [x] AK-74 (enemy drops)
- [x] SKS (heavy bandit drops)
- [x] Mosin Nagant (heavy bandit drops)
- [x] Weapon switching (Q key)
- [x] Secondary weapon slot
- [ ] Weapon durability system
- [ ] Weapon jamming
- [ ] Weapon attachments

## Inventory & Items
- [x] Basic inventory system
- [x] Item pickup (E key)
- [x] Item stacking
- [x] Medical items (bandage, medkit, painkillers, antirad, splint)
- [x] Ammo types (9mm, 7.62, 12g, 54r)
- [x] Currency (rubles)
- [x] Materials (scrap, tech parts)
- [x] Food items
- [x] Weight system (affects movement)
- [x] Weight HUD indicator
- [ ] Grid-based inventory
- [ ] Secure container
- [ ] Backpack tiers

## Zone/Map
- [x] Procedural building placement
- [x] Collision with walls
- [x] Extraction points (4 per zone)
- [x] Extraction timer (5 seconds)
- [x] Fog of war (grid-based)
- [x] Vision radius with gradient
- [x] Enemy spawning
- [x] Loot container placement
- [x] Radiation zones/anomalies (glowing green)
- [ ] Multiple zones (Forest, Mall, etc.)
- [ ] Zone-specific POIs
- [ ] Environmental hazards

## Loot System
- [x] Loot containers (5 types)
- [x] Loot tables with weights
- [x] Ground loot pickup
- [x] Enemy drops on death
- [ ] Hidden stash detection (Scout perk)
- [ ] Key-locked containers

## UI/HUD
- [x] Health bar
- [x] Stamina bar
- [x] Status effect indicators
- [x] Weapon display
- [x] Ammo counter
- [x] Reload indicator
- [x] Minimap
- [x] Kill counter
- [x] Loot value counter
- [x] Rubles display
- [x] Dodge cooldown indicator
- [x] Extraction progress bar
- [x] Death screen with stats
- [x] Extraction success screen
- [x] Weight indicator (color-coded)
- [x] Compass/direction to nearest extract
- [x] Secondary weapon indicator
- [ ] Quest tracker

## Progression
- [x] Player XP and levels
- [x] Hunter perks (5 implemented)
- [ ] Weapon proficiency
- [ ] Weapon perks
- [ ] Trader system
- [ ] Quest system
- [ ] Zone unlock progression

## Hideout
- [ ] Bunker hub
- [ ] Module system
- [ ] Stash storage
- [ ] Crafting stations
- [ ] Sleeping/healing
- [ ] Module upgrades

## Save/Load
- [ ] LocalStorage persistence
- [ ] Auto-save on extraction
- [ ] Save statistics
- [ ] Export/import save

## Visual Effects
- [x] Muzzle flash
- [x] Blood particles
- [x] Bullet particles
- [x] Damage numbers
- [x] Screen shake (proportional to damage)
- [x] Blood decals (persistent)
- [ ] Bullet trails
- [ ] Explosion effects
- [ ] Extraction helicopter
