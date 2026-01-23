# Player Intent Map - Enter the Gungeon Clone

## Game Overview

**Game Type:** Roguelike Bullet-Hell Dungeon Crawler
**Win Condition:** Defeat the boss on the final floor (Floor 5: Forge)
**Core Loop:** Enter room -> Clear enemies -> Explore -> Find boss -> Defeat boss -> Descend -> Repeat

## Player Intents by State

### Title Screen
| Intent | Expected Behavior |
|--------|------------------|
| Start new run | Press Enter/Space to begin |
| View controls | Display controls/help (if available) |

### Gameplay - Exploration
| Intent | Expected Behavior |
|--------|------------------|
| Move around room | WASD moves player in 8 directions |
| Explore floor | Enter doors to adjacent rooms |
| Find treasure room | Locate and enter room with chests |
| Find shop | Locate and enter shop room |
| Find boss room | Locate door leading to boss |
| Open chest | Use key on locked chests, collect contents |
| Buy items | Spend shells in shop |

### Gameplay - Combat
| Intent | Expected Behavior |
|--------|------------------|
| Attack enemies | Click/hold mouse to fire toward cursor |
| Dodge bullets | Move away from incoming projectiles |
| Dodge roll | Press Space to roll with i-frames |
| Switch weapons | Scroll wheel or number keys to change gun |
| Reload weapon | Press R to reload, or auto-reload on empty |
| Use blank | Press Q to clear all bullets on screen |
| Take cover | Move behind obstacles/flipped tables |

### Gameplay - Resource Management
| Intent | Expected Behavior |
|--------|------------------|
| Collect health | Pick up hearts to restore HP |
| Collect ammo | Pick up ammo boxes to refill guns |
| Collect shells | Pick up currency from defeated enemies |
| Collect keys | Pick up keys for locked chests |
| Use active item | Press E to activate item (if charged) |

### Boss Fight
| Intent | Expected Behavior |
|--------|------------------|
| Learn attack patterns | Observe boss behavior during each phase |
| Avoid bullet patterns | Navigate through complex bullet hell patterns |
| Deal damage | Fire at boss while avoiding attacks |
| Use blanks wisely | Save blanks for emergency bullet clear |
| Survive phase transitions | Adapt to increasing difficulty per phase |

### Death Screen
| Intent | Expected Behavior |
|--------|------------------|
| View run stats | See kills, damage dealt, floors reached |
| Return to menu | Press Enter to restart |

## Game-Specific Intents (Gungeon Mechanics)

### Dodge Roll Mastery
| Intent | Expected Behavior |
|--------|------------------|
| Roll through bullets | I-frames (0.35s) allow passing through projectiles |
| Roll into enemies | Contact damage (3) when rolling into enemies |
| Roll for mobility | Quick repositioning across room |
| Cancel roll into fire | Cannot shoot during roll animation |

### Weapon Management
| Intent | Expected Behavior |
|--------|------------------|
| Conserve starter ammo | Starter guns have infinite ammo |
| Save good weapons | Use weaker guns first, save powerful ones |
| Match weapon to enemy | Use spread for groups, single for tough enemies |
| Time reloads | Reload between waves, not mid-combat |

### Blank Usage
| Intent | Expected Behavior |
|--------|------------------|
| Emergency clear | Use when surrounded by unavoidable bullets |
| Reveal secrets | Blank near cracked walls to find secrets |
| Stun enemies | Brief invincibility and enemy stun |
| Manage blank count | 2 blanks per floor, can carry up to 9 |

### Table Mechanics
| Intent | Expected Behavior |
|--------|------------------|
| Flip table for cover | Press E near table to flip it |
| Use cover strategically | Block bullets from one direction |
| Kick table | Push flipped table to damage enemies |

## Testing Implications

### Core Combat Tests
| Test Focus | What to Verify |
|------------|----------------|
| Movement responsiveness | 8-directional movement is smooth |
| Aiming accuracy | Bullets fire toward mouse cursor |
| Dodge roll timing | I-frames work correctly (0.35s) |
| Roll distance | Covers appropriate distance (4 tiles) |
| Enemy bullet patterns | Patterns are readable and dodgeable |
| Boss patterns | Each phase has distinct, learnable attacks |

### Progression Tests
| Test Focus | What to Verify |
|------------|----------------|
| Room clearing | Doors unlock after all enemies defeated |
| Floor generation | All room types spawn (combat, shop, treasure, boss) |
| Chest loot | Appropriate items for chest tier |
| Shop prices | Items purchasable with shells |
| Boss transitions | Phase changes at correct HP thresholds |

### Resource Tests
| Test Focus | What to Verify |
|------------|----------------|
| Ammo consumption | Non-starter weapons use ammo correctly |
| Health pickups | Hearts restore HP, capped at max |
| Shell drops | Enemies drop shells on death |
| Blank refresh | 2 blanks restored at floor start |
| Key usage | Keys consumed when opening locked chests |

### Visual Feedback Tests
| Test Focus | What to Verify |
|------------|----------------|
| Damage flash | Red flash when player hit |
| Hit markers | X markers when hitting enemies |
| Screen shake | Camera shake on damage/explosions |
| Particle effects | Muzzle flash, bullet impacts, death particles |
| UI clarity | Health, ammo, blanks clearly visible |

## State Diagram

```
[Title] --> [Playing: Room]
    |
    v
[Playing: Room] <--> [Playing: Combat] --> [Room Cleared]
    |                       |                    |
    |                       v                    v
    |              [Playing: Boss] ------> [Floor Complete]
    |                       |                    |
    |                       v                    v
    +-----> [Death] <-------+              [Next Floor]
                                                 |
                                                 v
                                           [Victory] (after Floor 5)
```

## Priority Test Scenarios

1. **Basic Combat Loop** - Enter room, defeat enemies, doors unlock
2. **Dodge Roll Mechanics** - Roll through bullets, verify i-frames
3. **Weapon Switching** - Change guns, verify ammo tracking
4. **Boss Fight** - Survive phase transitions, defeat boss
5. **Floor Progression** - Navigate multiple rooms, find boss
6. **Resource Management** - Use blanks, collect pickups correctly
