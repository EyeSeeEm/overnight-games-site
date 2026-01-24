# Zero Sievert - Improvements

## Issues Fixed (Night 9)

### Issue 1: Game freezes after leaving main menu
- **Problem:** After pressing Enter to start the game from the menu, the game would appear frozen - nothing would respond to input.
- **Root Cause:** Same issue as dome-keeper. The `gamePaused` flag was initialized to `true` (line 63) and never set to `false` in `startGame()`. The keyboard handler only adds keys to `activeKeys` when `!gamePaused` (line 1082), so all movement keys were being ignored even though `gameState` was set to `'playing'`.
- **Fix:** Added `gamePaused = false;` at the beginning of `startGame()` function.
- **Verification:** Game now responds to WASD movement after starting from menu. Player can move around the map and interact with the game.

## Remaining Issues
- None

## Technical Details
- Flag: `gamePaused` (line 63) - controls whether key inputs are added to `activeKeys`
- Fix location: `startGame()` function (line 1118-1120)
- This is the same root cause as the dome-keeper movement bug
