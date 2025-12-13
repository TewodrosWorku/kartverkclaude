# Sign Controls Fix - Rotate & Remove Buttons

## Problem

When clicking on placed traffic signs, the popup showed "Roter 90°" and "Fjern" buttons, but they didn't work.

## Root Cause

The popup was using inline `onclick` handlers with string HTML:
```javascript
// ❌ BROKEN - Inline onclick doesn't work properly with ES6 modules
onclick="window.rotateSign(${markerId})"
```

Issues:
1. Inline event handlers in dynamically created HTML don't always work reliably
2. ES6 module scope issues with global window functions
3. DOM elements created as strings instead of proper elements

## Solution

Changed from string-based HTML to proper DOM element creation with event listeners:

### Before (Broken):
```javascript
function createSignPopup(sign, markerId) {
    return `
        <div class="sign-popup">
            <button onclick="window.rotateSign(${markerId})">
                ↻ Roter 90°
            </button>
        </div>
    `;
}

marker.bindPopup(popupContent);
```

### After (Fixed):
```javascript
function createSignPopupElement(sign, markerId) {
    const container = document.createElement('div');
    const rotateBtn = document.createElement('button');

    rotateBtn.addEventListener('click', () => {
        rotateSign(markerId);
    });

    container.appendChild(rotateBtn);
    return container;
}

marker.on('popupopen', () => {
    const popupContainer = createSignPopupElement(sign, marker._leaflet_id);
    popup.setContent(popupContainer);
});
```

## Additional Fixes

### 1. Rotation Implementation
Standard Leaflet markers don't support `setRotationAngle()`, so we use CSS transform:

```javascript
export function rotateSign(markerId) {
    placedSign.rotation = (placedSign.rotation + 90) % 360;

    const icon = placedSign.marker.getElement();
    if (icon) {
        icon.style.transform = `rotate(${placedSign.rotation}deg)`;
        icon.style.transformOrigin = 'center center';
    }
}
```

### 2. Remove Sign Enhancement
Close popup before removing to avoid errors:

```javascript
export function removeSign(markerId) {
    if (placedSign.marker.isPopupOpen()) {
        placedSign.marker.closePopup();
    }

    map.removeLayer(placedSign.marker);
    signState.placedSigns.splice(index, 1);
}
```

### 3. Initial Rotation
Apply rotation when sign is placed (for restoring saved projects):

```javascript
if (rotation !== 0) {
    setTimeout(() => {
        const icon = marker.getElement();
        if (icon) {
            icon.style.transform = `rotate(${rotation}deg)`;
        }
    }, 0);
}
```

## Files Changed

✅ `js/sign-manager.js` - Complete rewrite of popup system

## Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| Popup creation | String HTML | DOM elements |
| Event binding | Inline onclick | addEventListener |
| Rotation method | setRotationAngle (doesn't exist) | CSS transform |
| Remove behavior | Direct removal | Close popup first |

## Testing

After this fix, you should be able to:

1. **Rotate signs:**
   - Click on a placed sign
   - Click "Roter 90°" button
   - ✅ Sign rotates 90 degrees
   - Click again to rotate further

2. **Remove signs:**
   - Click on a placed sign
   - Click "✕ Fjern" button
   - ✅ Sign disappears from map
   - ✅ Sign count updates

3. **Restore rotated signs:**
   - Rotate a sign
   - Save project
   - Load project
   - ✅ Sign appears with correct rotation

## Technical Details

### Why DOM Elements Instead of Strings?

1. **Event Listeners:** Proper event listeners are more reliable than inline handlers
2. **Scope:** Direct function calls work better than window.* references
3. **Timing:** Popup content is set when popup opens, ensuring DOM is ready

### Why CSS Transform for Rotation?

1. Leaflet markers don't have built-in rotation
2. CSS transform is browser-native and performant
3. Works with any marker icon (SVG, PNG, etc.)
4. Transform persists when saving/loading

## Status

✅ **FIXED** - Sign controls (rotate and remove) now work correctly

## Version

Updated in: v1.0.2 (or next release)
