# Implemented Content: Lost Outpost (Phaser)

## Weapons
- [x] Assault Rifle (Rank 0, starting weapon)
  - Damage: 10
  - Fire rate: 150ms
  - Clip size: 30
- [x] SMG (Rank 5)
  - Damage: 6
  - Fire rate: 80ms
  - Clip size: 50
- [x] Shotgun (Rank 11)
  - Damage: 25
  - Fire rate: 600ms
  - Clip size: 8
  - 5 pellets
- [x] Pulse Rifle (Rank 16)
  - Damage: 15
  - Fire rate: 200ms
  - Clip size: 40
- [x] China Lake (Rank 20)
  - Damage: 50
  - Fire rate: 1000ms
  - Clip size: 6
- [x] Flamethrower (Rank 23)
  - Damage: 3
  - Fire rate: 30ms
  - Clip size: 100
- [x] Vulcan Minigun (Rank 26)
  - Damage: 8
  - Fire rate: 50ms
  - Clip size: 200

## Enemies
- [x] Normal Alien
  - Health: 30
  - Damage: 10
  - Speed: 80
  - XP: 100
- [x] Large Alien
  - Health: 60
  - Damage: 20
  - Speed: 60
  - XP: 200
- [x] Small Alien
  - Health: 15
  - Damage: 5
  - Speed: 120
  - XP: 50
- [x] Laser Alien (ranged)
  - Health: 25
  - Damage: 5 (melee) / 15 (projectile)
  - Speed: 50
  - XP: 150
- [x] Boss Alien
  - Health: 500
  - Damage: 30
  - Speed: 40
  - XP: 1000
  - 8-direction attack

## Pickups
- [x] Health Pack (+25 HP)
- [x] Ammo Pack (+50 ammo)
- [x] Credits (100 each)
- [x] Keycard (orange)

## Level Elements
- [x] Floor tiles (dark checker)
- [x] Wall tiles (gray)
- [x] Terminal (green screen)
- [x] Doors (locked/unlocked)
- [x] Exit zone (green)
- [ ] Destructible crates
- [ ] Explosive barrels

## UI Elements
- [x] Health bar (red)
- [x] Ammo counter (gold)
- [x] Credits (cyan)
- [x] Rank/XP (green)
- [x] Lives (red)
- [x] Motion tracker (green radar)
- [x] Kill counter
- [x] Keycard indicator
- [x] Level indicator
- [x] Pause menu

## Levels
- [x] Test Level (4 rooms + corridors)
- [ ] Level 1: Station Entry
- [ ] Level 2: Corridor Maze
- [ ] Level 3: Surface
- [ ] Levels 4-10: Campaign

## Visual Effects
- [x] Blood splatter (green particles)
- [x] Muzzle flash
- [x] Damage flash (red/green)
- [x] Rank up flash
- [x] Vignette lighting
- [x] Screen shake

## Characters (NEW)
- [x] Jameson
  - Title: Space Marine
  - Health: 100
  - Speed: 200
  - Bonus Damage: 0
  - Color: Blue (0x4444AA)
- [x] Lee
  - Title: Veteran Soldier
  - Health: 80
  - Speed: 220
  - Bonus Damage: +10
  - Color: Green (0x44AA44)

## Shop Items (NEW)
- [x] Medi-Pack (500c)
  - Restores 50 HP
- [x] Ammo Crate (300c)
  - +100 ammo
- [x] Armor Plating (2000c)
  - +25 Max HP (permanent)
- [x] Leg Servos (1500c)
  - +20% movement speed
- [x] FMJ Rounds (2500c)
  - +5 base damage

## Weapon Attachments (NEW)
- [x] Laser Sight (1000c)
  - -0.02 spread (better accuracy)
- [x] Extended Mag (1500c)
  - +10 clip size
- [x] Rapid Fire (2000c)
  - -20ms fire rate

## PDA Story Logs (NEW)
- [x] Emergency Alert
  - "Breach detected in sectors 4-7..."
- [x] Research Note
  - "Specimen behavior erratic..."
- [x] Last Message
  - "If anyone finds this..."
- [x] Security Log
  - "Keycard access revoked..."
- [x] Distress Call
  - "This is Lee. Ship crashed..."

## Campaign Progress (NEW)
- [x] 10 total levels
- [x] Level complete bonuses
  - Kill bonus: 10c per kill
  - Level bonus: 100c per level
  - Base bonus: 500c
- [x] State persistence
  - Credits carry over
  - XP/rank carry over
  - Upgrades carry over
- [x] Campaign complete screen

## Not Yet Implemented
- [ ] Swarm mode
- [ ] Multiple distinct level designs
- [ ] Environmental hazards
- [ ] Character selection screen
- [ ] Sound effects
