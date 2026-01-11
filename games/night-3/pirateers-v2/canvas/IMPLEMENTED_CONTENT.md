# Implemented Content: Pirateers v2 (Canvas)

## Ship Types (1 player)
- [x] Player Ship
  - Armor: 100 HP
  - Speed: 100 units/sec
  - Firepower: 10 damage
  - Reload: 2 seconds
  - Cannons: 3 per side

## Enemy Types (6 total)
- [x] Merchant Ship
  - HP: 50, Speed: 60
  - Damage: 5, Gold: 30
  - Behavior: Flees from player
- [x] Navy Sloop
  - HP: 80, Speed: 100
  - Damage: 12, Gold: 40
  - Behavior: Attacks player
- [x] Pirate Raider
  - HP: 100, Speed: 120
  - Damage: 15, Gold: 55
  - Behavior: Aggressive attack
- [x] Navy Frigate
  - HP: 150, Speed: 80
  - Damage: 20, Gold: 80
  - Behavior: Heavy attack, appears day 5+
- [x] Pirate Captain
  - HP: 200, Speed: 90
  - Damage: 25, Gold: 120
  - Behavior: Boss enemy, appears day 7+
- [x] Ghost Ship
  - HP: 175, Speed: 110
  - Damage: 30, Gold: 100
  - Behavior: Special enemy, appears day 10+
  - Special: Faster reload (1.8s)

## Cargo Types (6 total)
- [x] Rum
- [x] Sugar
- [x] Spices
- [x] Silk
- [x] Tea
- [x] Coffee

## Ports (3 total)
- [x] Port Royal
- [x] Tortuga
- [x] Nassau

## World Elements
- [x] Islands (6-10 per world)
- [x] Ports (3 trading)
- [x] Ocean with swirl patterns
- [x] Forts (1-3 per day, after day 3)
- [ ] Shipwrecks
- [ ] Treasure locations

## Forts
- [x] Fort structure (stone base, walls, turret)
- [x] Fort HP (150 + 20 per day)
- [x] Fort damage (20 + 2 per day)
- [x] Fort range (300px)
- [x] Fort gold reward (100 + 15 per day)
- [x] Fort destruction effects

## Special Weapons (3 total)
- [x] Fireballs
  - Damage: 40, Charges: 5
  - Cost: 500 gold
  - Speed: 450, DOT: 5
- [x] Megashot
  - Damage: 80, Charges: 3
  - Cost: 750 gold
  - Speed: 300, Range: 1.5x
- [x] Chainshot
  - Damage: 25, Charges: 6
  - Cost: 400 gold
  - Speed: 400, Slows enemies

## Defensive Items (2 total)
- [x] Energy Cloak
  - Duration: 10 seconds
  - Cooldown: 60 seconds
  - Cost: 400 gold
  - Effect: Player invisible, attacks miss
- [x] Tortoise Shield
  - Duration: 8 seconds
  - Cooldown: 45 seconds
  - Cost: 350 gold
  - Effect: 50% damage reduction

## Quest Types (4 total)
- [x] Bounty Quest
  - "Sink {count} pirate ships"
  - Reward: 100 + day * 10 gold
- [x] Merchant Quest
  - "Sink {count} merchant ships"
  - Reward: 75 + day * 10 gold
- [x] Trade Quest
  - "Sell {count} cargo at ports"
  - Reward: 80 + day * 10 gold
- [x] Survive Quest
  - "Survive for {count} days"
  - Reward: 150 + day * 10 gold

## UI Screens
- [x] Title screen
- [x] Sailing (gameplay)
- [x] Ship destroyed stats
- [ ] Base phase
- [ ] Victory screen
- [ ] Shop/Upgrade

## Controls
- [x] W/↑ - Increase speed
- [x] S/↓ - Decrease speed
- [x] A/← - Turn left
- [x] D/→ - Turn right
- [x] Space - Fire cannons
- [x] E - Trade at port
- [x] Q - Debug mode
- [x] 1 - Energy Cloak
- [x] 2 - Tortoise Shield
- [x] F - Fire special weapon

## Kill Streak Messages
- [x] 3 kills: "TRIPLE SINK!"
- [x] 4 kills: "QUAD SINK!"
- [x] 5 kills: "RAMPAGE!"
- [x] 6+ kills: "ADMIRAL!/LEGENDARY!"

## Day Mechanics
- [x] Day duration: 180 seconds
- [x] Enemies scale with day (4 + day count)
- [x] Auto-repair at day end
- [x] Respawn at center
- [x] Forts appear from day 3

## Performance Ratings
- [x] DECKHAND: Default
- [x] SAILOR: 2+ ships sunk
- [x] CAPTAIN: 4+ ships sunk, 1+ crits
- [x] ADMIRAL: 6+ ships sunk, 3+ crits

## Enemy Spawn Weights by Day
- Day 1-4: Merchant 40%, Navy Sloop 30%, Pirate 30%
- Day 5+: +Navy Frigate 20%
- Day 7+: +Pirate Captain 15%
- Day 10+: +Ghost Ship 10%
