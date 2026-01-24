# Binding of Isaac Clone - Improvements

## Issues Fixed (Night 9)

### Issue 1: Drops (coins etc) disappear when room cleared
- **Problem:** When leaving a room, all dropped pickups (coins, hearts from killed enemies) were lost.
- **Fix:**
  - Save all pickups to `roomContents[roomKey].pickups` before transitioning to new room (in `transitionToRoom()`)
  - Restore saved pickups when re-entering a room (in `renderRoom()`)
- **Verification:** Pickups now persist when leaving and re-entering rooms

### Issue 2: Half-heart display not implemented
- **Problem:** The heart UI showed only full hearts or empty hearts, no half-heart state.
- **Fix:**
  - Added new `heart_half` texture (left half filled, right half outline)
  - Modified `updateHearts()` to use `heart_half` texture when player has odd health value
- **Verification:** Hearts now properly display half-heart states

### Remaining Issues (Scope too large for single session)
- Poops should be destructible (would need tear-obstacle collision)
- Rooms need pre-planned layouts with enemy/rock/poop positions
- Implement actual Isaac level generation algorithm
- Heart UI positioning (top-right vs current top-left)

## Technical Details
- Pickups saved as: `{ x, y, type, texture }`
- Half-heart drawn using Graphics beginPath/fillPath for left side, strokePath for right outline
- Heart display logic: fullHearts from floor(health/2), halfHeart from health%2==1
