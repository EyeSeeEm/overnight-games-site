# Player Intent Map - Star of Providence Clone

## Game Classification

| Property | Value |
|----------|-------|
| **Game Type** | Roguelike Bullet-Hell Shooter |
| **Win Condition** | Defeat final boss on Floor 6 (The Machine) |
| **Fail Condition** | HP reaches 0 (permadeath) |
| **Core Loop** | Enter floor > Clear rooms > Fight minibosses > Defeat floor boss > Collect reward > Descend |

## Player Intents by Game State

### Title Screen
| Intent | Expected Result |
|--------|-----------------|
| Start a new run | Game starts, player spawns in Floor 1 starting room |
| Select difficulty | Difficulty option changes (Mild/Normal/Intense/Sudden Death) |
| Select ship | Ship choice changes (affects stats and passive) |

### Gameplay - Room Navigation
| Intent | Expected Result |
|--------|-----------------|
| Move to explore the room | Ship moves in 8 directions, smooth 250px/s |
| Enter focus mode for precision | Speed reduces to 100px/s, smaller effective hitbox feel |
| Dash through bullets | I-frames for 0.15s, teleport 120px in input direction |
| Use bomb to clear screen | All enemy bullets destroyed, enemies damaged, brief invincibility |
| Exit through door | Transition to adjacent room (if door unlocked) |
| Open map | Minimap overlay shows explored floor layout |

### Gameplay - Combat
| Intent | Expected Result |
|--------|-----------------|
| Shoot at enemies | Projectiles fire from ship, consume ammo (except peashooter) |
| Kill enemy to build multiplier | Multiplier increases (+0.05 per kill, slower above 2.5x) |
| Collect debris from kills | Currency auto-collects, value multiplied by current multiplier |
| Avoid enemy bullets | Ship dodges, no damage taken |
| Take damage survival | HP decreases by 1 (or shields absorb), brief invincibility |

### Gameplay - Miniboss/Boss Rooms
| Intent | Expected Result |
|--------|-----------------|
| Defeat miniboss | Miniboss dies, rune barrier drops, reward spawns |
| Defeat floor boss | Boss dies, choice of +2 HP or +5% damage appears |
| Collect boss reward | Selected reward applied, floor exit portal spawns |
| Enter exit portal | Advance to next floor |

### Gameplay - Special Rooms
| Intent | Expected Result |
|--------|-----------------|
| Buy item from shop | Debris spent, item/weapon acquired |
| Select upgrade at terminal | One of 3 upgrade choices applied permanently |
| Collect weapon from trove | New weapon acquired (with keywords) |
| Open vault with key | High-quality rewards revealed |
| Trade at shrine | Sacrifice HP/debris/ammo for different benefit |
| Find secret room | Bomb wall opens path to bonus room |

### Gameplay - Resource Management
| Intent | Expected Result |
|--------|-----------------|
| Switch to better weapon | Weapon changes when walking over pickup |
| Manage ammo carefully | Fall back to peashooter when ammo depleted |
| Decide to salvage vs keep weapon | Bombing weapon on ground converts to debris |
| Use key strategically | Save for vault or spend on locked doors |

### Game Over / Victory
| Intent | Expected Result |
|--------|-----------------|
| View run summary | Stats displayed (floors, kills, time, debris) |
| Return to title | Game resets to title screen |

## Game-Specific Intents (Star of Providence Mechanics)

### Multiplier System
| Intent | Expected Result |
|--------|-----------------|
| Build multiplier for max debris | Kill enemies without taking damage, reach 3.0x |
| Maintain multiplier above 2.5x | Keep careful play for Magic cartridge bonuses |
| Accept multiplier loss on hit | -1.0x on damage, -0.5x with autobomb |

### Weapon Keywords
| Intent | Expected Result |
|--------|-----------------|
| Use Homing weapon against mobile enemies | Projectiles track targets |
| Use Triple spread for crowd control | 3 projectiles in spread pattern |
| Use High-Caliber for bosses | Slow but 3.5x damage, piercing |
| Use Freeze for enemy control | Slowed enemies easier to dodge |

### Ship Passives
| Intent | Expected Result |
|--------|-----------------|
| Play Tank for survivability | More HP, slower speed |
| Play Speedster for mobility | Fast movement, less HP |
| Play Bomber for bomb-focused play | More bombs, recharge faster |
| Play Glass Cannon for damage | High damage, low HP |
| Play Vampire for sustain | Heal on kills, lower max HP |
| Play Rogue for dash builds | Better dash, lower base stats |

### Blessings
| Intent | Expected Result |
|--------|-----------------|
| Use Flame blessing offensively | Fire trail damages enemies |
| Use Frost blessing defensively | Slowing aura around ship |
| Use Earth blessing for protection | Orbiting rocks block bullets |
| Use Storm blessing for passive damage | Random lightning strikes enemies |

### Cartridge Combos
| Intent | Expected Result |
|--------|-----------------|
| Stack Magic cartridges at 2.5x+ | Invincibility + damage + ammo efficiency |
| Use Ace of Diamonds for safety | Survive fatal hit with cooldown |
| Use Calculator for faster multiplier | 2x multiplier gain rate |
| Use Cloak for contact safety | Ignore contact damage from enemies |

## Testing Implications

| Feature | Test Method | Debug Commands |
|---------|-------------|----------------|
| Movement accuracy | Verify 250px/s normal, 100px/s focus | `getState()` for player position |
| Dash i-frames | Take damage during dash timing | `godMode(false)`, `spawnEnemy()` |
| Weapon switching | Pick up weapon, verify stats | `setWeapon()`, `spawnWeaponPickup()` |
| Keyword application | Add keyword, verify effect | `addKeyword()`, `listKeywords()` |
| Multiplier math | Kill enemies, check values | `setMultiplier()`, `getState()` |
| Boss phases | Damage boss, check phase transitions | `spawnBoss()`, `setHealth()` |
| Room generation | Multiple floor generations | `skipToLevel()`, `showFullMap()` |
| Shop pricing | Check items and costs | `enterShop()`, `getShopInventory()` |
| Upgrade effects | Apply upgrade, verify stat change | `giveUpgrade()`, `getState()` |
| Cartridge effects | Add cartridge, verify passive | `addCartridge()`, `getInventory()` |
| Blessing effects | Apply blessing, verify active | `applyBlessing()`, `getBlessing()` |
| Secret room discovery | Bomb walls, find secrets | `checkSecretWalls()`, `enterSecretRoom()` |
| Floor progression | Beat boss, use portal | `advanceFloor()`, `spawnExitPortal()` |
| Difficulty scaling | Change difficulty, verify enemy stats | `setDifficulty()`, `getDifficultyInfo()` |
| Ship passives | Select ship, verify stats | `setShip()`, `getShipInfo()` |

## Critical Paths to Test

1. **Full run completion**: Title > Floor 1-6 > Victory
2. **Combat loop**: Spawn enemy > Kill > Verify debris + multiplier
3. **Boss fight**: Spawn boss > Damage through phases > Collect reward
4. **Economy flow**: Earn debris > Shop purchase > Verify item
5. **Upgrade progression**: Find terminal > Select upgrade > Verify effect
6. **Weapon variety**: Test each weapon type fires correctly
7. **Keyword stacking**: Apply multiple keywords, verify combined effects
8. **Death and retry**: Take lethal damage > Game over > Restart
