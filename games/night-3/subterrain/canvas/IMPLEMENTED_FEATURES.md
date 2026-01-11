# Implemented Features: Subterrain (Canvas)

## Core Mechanics
- [x] Player movement (WASD)
- [x] Mouse aim (player rotates toward cursor)
- [x] Melee attack (left-click)
- [x] Ranged attack with pistol
- [x] Dodge mechanic (right-click)
- [x] 0.3s invincibility frames during dodge
- [x] 1.5s dodge cooldown
- [x] Stamina cost for dodge (20)

## Survival Meters
- [x] Health (0-100, drains on damage)
- [x] Hunger (increases over time, speed penalty at 50/75)
- [x] Thirst (increases over time, accuracy penalty at 50/75)
- [x] Fatigue (increases over time, damage penalty at 50/75)
- [x] Infection (from enemies/environment, hallucinations at 50+)
- [x] Global infection timer (game over at 100%)

## Weapon System
- [x] Fists (5 damage, infinite durability)
- [x] Shiv (10 damage, 20 durability, 20% bleed chance)
- [x] Pipe Club (20 damage, 30 durability, knockback effect)
- [x] Stun Baton (15 damage, 25 durability, 2s stun)
- [x] Pistol (15 damage, ranged, requires ammo)
- [x] Weapon durability system
- [x] Weapon switching (5-9 keys)

## Crafting System
- [x] Workbench interaction (E key)
- [x] Tier 1 recipes available immediately
- [x] Tier 2 recipes (requires Data Chip unlock)
- [x] Material consumption
- [x] Crafting time (game time passes)
- [x] Recipe navigation (arrow keys)
- [x] Craft button (Enter/C)

## Enemy AI
- [x] Shambler (slow, melee)
- [x] Crawler (fast, low profile)
- [x] Spitter (ranged acid attack)
- [x] Brute (tanky, charges at player)
- [x] Cocoon (stationary, spawns shamblers)
- [x] Stun mechanic (brute hits wall)
- [x] Bleed mechanic (shiv)
- [x] Chase behavior
- [x] Detection range

## Brute Charge
- [x] Triggers at 100-300px range
- [x] 3x speed during charge
- [x] 1.5x damage on hit
- [x] 40px knockback on hit
- [x] Self-stun if hits wall
- [x] CHARGE! warning text

## Acid Puddles
- [x] Created by spitter projectiles
- [x] 2 damage/second in puddle
- [x] 2 infection/second in puddle
- [x] 3 second duration
- [x] Bubbling animation
- [x] Alpha fade on expiry

## Hallucination System
- [x] Spawns at 50%+ infection
- [x] Spawn rate increases with infection
- [x] Random enemy types appear
- [x] Flickering transparency
- [x] Fade out over time
- [x] Green screen tint at 75%+ infection

## Armor System
- [x] Armor Vest (25% damage reduction)
- [x] Applies to melee attacks
- [x] Applies to projectile attacks
- [x] Applies to brute charge

## Sector System
- [x] Central Hub (safe, facilities)
- [x] Storage Wing (basic loot)
- [x] Medical Bay (medical loot)
- [x] Research Lab (tech loot)
- [x] Escape Pod (win condition)
- [x] Door transitions between sectors
- [x] Room persistence across visits

## Power System
- [x] 500 unit generator capacity
- [x] Power costs per sector
- [x] Darkness overlay in unpowered sectors
- [x] Medical/Research facilities require power

## Items & Inventory
- [x] 20 slot inventory
- [x] Food (hunger -30)
- [x] Water (thirst -40)
- [x] Medkit (health +30)
- [x] Antidote (infection -30)
- [x] Scrap, Cloth, Chemicals (crafting materials)
- [x] Electronics, Power Cells (tier 2 materials)
- [x] Data Chip (unlocks tier 2)
- [x] Red Keycard (escape access)

## Ground Pickups
- [x] Health packs (+15 HP)
- [x] Ammo boxes (+5 ammo)
- [x] Antidote syringes (-15 infection)
- [x] Bobbing animation
- [x] Glow effect
- [x] Auto-pickup on walk

## UI Screens
- [x] Inventory screen (Tab)
- [x] Map screen (M)
- [x] Crafting screen (E at workbench)

## Inventory Screen
- [x] 5-column item grid
- [x] Colored item icons
- [x] Item names and counts
- [x] Equipped weapon info
- [x] Durability display
- [x] Ammo display
- [x] Armor status

## Map Screen
- [x] Facility layout visualization
- [x] Current sector highlight
- [x] Visited sectors shown
- [x] Power status display
- [x] Connection lines

## Crafting Screen
- [x] Recipe list with selection
- [x] Material requirements
- [x] Time display
- [x] Materials panel
- [x] Tier 2 unlock status

## Visual Effects
- [x] Blood splatters (static, no wiggle)
- [x] Acid puddles with bubbles
- [x] Particle system
- [x] Muzzle flash
- [x] Damage flash (red overlay)
- [x] Low health vignette
- [x] Infection screen tint
- [x] Screen shake
- [x] Floating damage numbers
- [x] Kill streak messages
- [x] Dodge particles (blue trails)

## HUD Elements
- [x] Health bar
- [x] Hunger/Thirst/Fatigue bars
- [x] Infection bar
- [x] Global infection counter
- [x] Quick slots (1-4)
- [x] Keycard indicator
- [x] Sector name
- [x] Time display
- [x] Controls hint

## Stats Tracking
- [x] Kill count
- [x] Damage dealt
- [x] Damage taken
- [x] Critical hits
- [x] Max kill streak
- [x] Containers looted
- [x] Items used
- [x] Sectors visited

## Game Over/Victory
- [x] Detailed stats display
- [x] Performance rating (death)
- [x] Efficiency rating (victory)
- [x] Press SPACE to restart

## Controls
- [x] WASD - Movement
- [x] Mouse - Aim
- [x] Left-click - Attack
- [x] Right-click - Dodge
- [x] E - Interact
- [x] 1-4 - Use items
- [x] 5-9 - Switch weapons
- [x] Tab - Inventory
- [x] M - Map
- [x] Q - Debug overlay
