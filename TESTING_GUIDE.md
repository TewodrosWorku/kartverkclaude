# AV-Plan Complete Testing Guide

## Real-World Test Scenario: Maintenance Work on Nordfjordvegen

This guide walks through creating a complete arbeidsvarslingsplan (work warning plan) for road maintenance.

---

## Step-by-Step Testing Procedure

### Phase 1: Setup and Navigation (2 minutes)

#### Step 1.1: Open the Application
```
✓ Open index.html in your browser
✓ Wait for map to load
✓ Verify you see Norway map with Kartverket tiles
✓ Check that sidebar is visible on the left
✓ Status bar should say "Klar" at the bottom
```

**Expected Result:** Clean map interface with 3 tabs (Kart, Skilt, Prosjekter)

---

#### Step 1.2: Find Nordfjordvegen
```
1. In the search box, type: "Nordfjordvegen"
2. Wait for autocomplete suggestions (300ms)
3. Click on an address like "Nordfjordvegen, Gloppen"
4. Map should pan to location
5. Red marker appears temporarily (disappears after 3 seconds)
```

**Expected Result:**
- ✅ Map centers on Nordfjordvegen area
- ✅ Zoom level around 15
- ✅ Can see the road clearly

**Alternative if search doesn't work:**
```
- Manual navigation:
  1. Zoom out using - button
  2. Navigate to Sogn og Fjordane county
  3. Find Gloppen municipality
  4. Zoom in on Nordfjordvegen
```

---

### Phase 2: Select the Road (1 minute)

#### Step 2.1: Click on the Road
```
1. Click directly on Nordfjordvegen (the road line)
2. Wait 1-2 seconds for NVDB API response
```

**Expected Result:**
- ✅ Road highlights in blue (thick blue line)
- ✅ Popup appears with road information
- ✅ Sidebar shows road reference (e.g., "Fv724" or similar)
- ✅ Console shows: "Finding nearest road to [lat, lon]"

**Popup should show:**
```
[Road Reference - e.g., "Fv724"]
Kategori: F (Fylkesvei)
Kommune: Gloppen (or similar)
```

**If it fails:**
```
- Check console for errors
- Try clicking closer to the center of the road
- Zoom in more and click again
```

---

### Phase 3: Define Work Zone (2 minutes)

#### Step 3.1: Set START Point
```
1. Click "Sett START" button (turns green)
2. Status bar says: "Klikk på kartet for å sette start"
3. Click on the road where work will START
4. Green marker appears
5. Button returns to normal state
```

**Expected Result:**
- ✅ Green circular marker on the road
- ✅ Tooltip says "Start arbeidssone"
- ✅ Marker can be dragged to adjust position
- ✅ Status: "⚠ Kun start eller slutt satt" (yellow)

---

#### Step 3.2: Set END Point
```
1. Click "Sett SLUTT" button (turns red)
2. Status bar says: "Klikk på kartet for å sette slutt"
3. Click on the road where work will END
   (Choose a point 200-500m away from START for good testing)
4. Red marker appears
5. Button returns to normal state
```

**Expected Result:**
- ✅ Red circular marker on the road
- ✅ Tooltip says "Slutt arbeidssone"
- ✅ Marker can be dragged
- ✅ Status: "✓ Arbeidssone definert" (green)

---

#### Step 3.3: Verify Distance Markers
```
After both markers are placed, automatic distance markers appear:
```

**Expected Result:**
- ✅ Small red dots appear every 20 meters
- ✅ Larger red dots with white border every 50 meters
- ✅ From START: markers go BACKWARD (opposite direction of END)
- ✅ From END: markers go FORWARD (opposite direction of START)
- ✅ Maximum 400m in each direction
- ✅ Markers follow road curvature (not straight line)

**How to verify:**
```
1. Hover over a marker
2. Tooltip shows: "20m fra start" or "50m fra slutt"
3. Count markers: should be ~20 markers if work zone is 400m
```

**Test marker adjustment:**
```
1. Drag the START marker to new position
2. All distance markers regenerate automatically
3. Drag END marker
4. Markers regenerate again
```

---

### Phase 4: Place Traffic Signs (3 minutes)

#### Step 4.1: Navigate to Signs Tab
```
1. Click "Skilt" tab at top
2. Verify sign palette loads
```

**Expected Result:**
- ✅ Speed limit signs visible (30, 40, 50, 60, 70, 80, 90, 110)
- ✅ Warning signs visible (142-Arbeid på vegen, etc.)
- ✅ Prohibition signs visible
- ✅ "Plasserte skilt: 0" at bottom

---

#### Step 4.2: Place Warning Sign (Work Ahead)
```
1. Find sign "142" (yellow triangle - Arbeid på vegen)
2. Click and hold on the sign
3. Drag to map at the START point
4. Release mouse button
```

**Expected Result:**
- ✅ Sign appears on map as 40x40px icon
- ✅ Sign snaps to road if "Fest til vei" is checked
- ✅ Sign count updates: "Plasserte skilt: 1"
- ✅ Console shows: "Placed sign: Arbeid på vegen"

---

#### Step 4.3: Test Sign Rotation
```
1. Click on the placed sign (142)
2. Popup opens with sign name and buttons
3. Click "↻ Roter 90°" button
4. Sign rotates 90 degrees
5. Click again - rotates to 180°
6. Click again - rotates to 270°
7. Click again - returns to 0°
```

**Expected Result:**
- ✅ Sign visibly rotates each time
- ✅ Rotation is smooth (CSS transform)
- ✅ Console shows: "Rotated sign to 90°"

---

#### Step 4.4: Place Speed Limit Sign
```
1. Go back to Skilt tab
2. Drag "50" speed limit sign to map
3. Place it ~50m before the work zone
4. Click on it to verify popup works
```

**Expected Result:**
- ✅ Sign appears with white circle and red border
- ✅ "50" is visible in center
- ✅ Sign count: "Plasserte skilt: 2"

---

#### Step 4.5: Place Additional Signs
```
For a complete test, place:
1. Speed limit "30" at work zone start
2. "Arbeid på vegen" (142) warning before work
3. "Farlig vegkant" (204) if needed
4. Speed limit "80" after work zone end
```

**Expected Result:**
- ✅ All signs appear on map
- ✅ Each can be clicked and controlled
- ✅ Sign count updates correctly

---

#### Step 4.6: Test Sign Removal
```
1. Click on any placed sign
2. Popup opens
3. Click "✕ Fjern" button
```

**Expected Result:**
- ✅ Popup closes
- ✅ Sign disappears from map
- ✅ Sign count decreases by 1
- ✅ Console shows: "Removed sign: [id]"

---

### Phase 5: Export the Plan (2 minutes)

#### Step 5.1: Return to Map View
```
1. Click "Kart" tab
2. Verify all elements are visible:
   - Blue road line
   - Green START marker
   - Red END marker
   - Distance markers (red dots)
   - All traffic signs
```

---

#### Step 5.2: Adjust Map View
```
1. Zoom out slightly so entire work zone is visible
2. Pan map to center the work area
3. Make sure all signs are in view
```

**Tip:** The exported image will capture exactly what you see in the map area.

---

#### Step 5.3: Export to PNG
```
1. Click "📥 Eksporter som bilde" button
2. Loading overlay appears: "Eksporterer kart..."
3. Wait 3-5 seconds
4. File downloads automatically
```

**Expected Result:**
- ✅ PNG file downloads: "avplan_YYYY-MM-DD.png"
- ✅ Image shows:
  - Road in blue
  - START and END markers
  - All traffic signs
  - Scale bar (bottom-left)
  - NO sidebar, NO controls, NO buttons
- ✅ High resolution (2x for print quality)

**Verify the export:**
```
1. Open downloaded PNG file
2. Check scale bar is accurate
3. Check all signs are visible
4. Check markers are clear
5. Zoom in - should be high quality
```

---

### Phase 6: Save the Project (2 minutes)

#### Step 6.1: Save Project
```
1. Click "💾 Lagre prosjekt" button
2. Prompt appears: "Skriv inn prosjektnavn:"
3. Type: "Nordfjordvegen vedlikehold 2025"
4. Click OK or press Enter
```

**Expected Result:**
- ✅ Alert: "Prosjekt lagret!"
- ✅ Status bar: "Prosjekt lagret: Nordfjordvegen vedlikehold 2025"
- ✅ Console shows: "Project saved: Nordfjordvegen vedlikehold 2025"

---

#### Step 6.2: Verify Save
```
1. Click "Prosjekter" tab
2. Check project list
```

**Expected Result:**
- ✅ Your project appears in the list
- ✅ Shows project name
- ✅ Shows modification date
- ✅ Three buttons: Åpne, Dupliser, Slett

---

#### Step 6.3: Test New Project (Clear Current)
```
1. Click "📄 Nytt prosjekt" button
2. Confirm dialog: "Start nytt prosjekt?"
3. Click OK
```

**Expected Result:**
- ✅ Map clears
- ✅ All markers removed
- ✅ All signs removed
- ✅ Road deselected
- ✅ Sign count: 0
- ✅ Status: "Ingen arbeidssone definert"

---

#### Step 6.4: Load Saved Project
```
1. Go to "Prosjekter" tab
2. Find "Nordfjordvegen vedlikehold 2025"
3. Click "Åpne" button
4. Wait 1-2 seconds
```

**Expected Result:**
- ✅ Map pans to saved location
- ✅ Road highlights in blue
- ✅ START marker appears (green)
- ✅ END marker appears (red)
- ✅ All distance markers regenerate
- ✅ All traffic signs reappear
- ✅ Sign rotations preserved
- ✅ Status bar: "Prosjekt lastet: Nordfjordvegen vedlikehold 2025"

**Verify everything restored:**
```
1. Check road is selected
2. Check both work zone markers
3. Check distance markers present
4. Click on signs - rotation preserved
5. Sign count matches original
```

---

### Phase 7: Advanced Features Testing (3 minutes)

#### Step 7.1: Test Snapping Toggle
```
1. Uncheck "Fest til vei (snapping)"
2. Click "Sett START"
3. Click OFF the road (in a field)
4. Marker places exactly where you clicked
5. Check "Fest til vei" again
6. Drag marker - it snaps back to road
```

**Expected Result:**
- ✅ With snapping ON: markers stick to road
- ✅ With snapping OFF: free placement anywhere

---

#### Step 7.2: Test Distance Marker Toggle
```
1. Uncheck "Vis avstandsmarkører"
2. Distance markers disappear
3. Check it again
4. Distance markers reappear
```

**Expected Result:**
- ✅ Toggle works instantly
- ✅ Markers remember state
- ✅ Export respects this setting

---

#### Step 7.3: Test Keyboard Shortcuts
```
1. Press Ctrl+S (or Cmd+S on Mac)
   → Save project dialog appears
2. Press Ctrl+E
   → Export starts
3. Press Ctrl+N
   → New project confirmation appears
```

**Expected Result:**
- ✅ All keyboard shortcuts work
- ✅ Same as clicking buttons

---

#### Step 7.4: Test Project Management
```
1. In Prosjekter tab, click "Dupliser"
2. New project appears: "[name] (kopi)"
3. Click "Slett" on the copy
4. Confirm deletion
5. Copy disappears from list
```

**Expected Result:**
- ✅ Duplicate creates exact copy
- ✅ Delete removes from localStorage
- ✅ Original project unaffected

---

### Phase 8: Responsive Design Testing (2 minutes)

#### Step 8.1: Test Browser Resize
```
1. Make browser window narrow (< 768px)
2. Sidebar should stack on top
3. Sign grid reduces to 3 columns
4. Restore window width
5. Layout returns to desktop view
```

**Expected Result:**
- ✅ Mobile layout activates
- ✅ All features still accessible
- ✅ No horizontal scrolling

---

#### Step 8.2: Test Mobile/Tablet (if available)
```
1. Open on mobile device or use browser dev tools
2. Set viewport to mobile (375x667)
3. Test touch interactions
4. Drag signs with finger
5. Pinch to zoom map
```

**Expected Result:**
- ✅ Touch targets are 44px minimum
- ✅ Drag and drop works with touch
- ✅ Map gestures work

---

## Complete Testing Checklist

### Core Functionality ✓
- [ ] Map loads with Kartverket tiles
- [ ] Address search works (Geonorge API)
- [ ] Road selection works (NVDB API V4)
- [ ] Road highlights in blue
- [ ] Road info shows in popup and sidebar

### Work Zone ✓
- [ ] START marker can be placed
- [ ] END marker can be placed
- [ ] Both markers are draggable
- [ ] Distance markers generate automatically
- [ ] Small dots every 20m
- [ ] Large dots every 50m
- [ ] Markers follow road curvature
- [ ] Backward from START (400m max)
- [ ] Forward from END (400m max)
- [ ] Markers regenerate when dragging markers

### Signs ✓
- [ ] Sign library loads
- [ ] All sign categories visible
- [ ] Drag and drop works
- [ ] Signs appear on map
- [ ] Sign count updates
- [ ] Click sign opens popup
- [ ] Rotate button works (90° increments)
- [ ] Remove button works
- [ ] Sign rotation persists
- [ ] Snapping works when enabled

### Export ✓
- [ ] Export button triggers export
- [ ] Loading indicator appears
- [ ] PNG file downloads
- [ ] Scale bar included
- [ ] UI elements hidden
- [ ] High resolution (2x)
- [ ] Filename includes date
- [ ] Image quality is good

### Project Management ✓
- [ ] Save project works
- [ ] Project appears in list
- [ ] Load project restores everything
- [ ] Duplicate creates copy
- [ ] Delete removes project
- [ ] New project clears workspace

### Settings & Controls ✓
- [ ] Snap toggle works
- [ ] Marker toggle works
- [ ] Tab switching works
- [ ] Keyboard shortcuts work
- [ ] Status bar updates

### Responsive Design ✓
- [ ] Works on desktop (1920x1080)
- [ ] Works on laptop (1366x768)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)

---

## Expected Timeline

| Phase | Time | Cumulative |
|-------|------|------------|
| Setup & Navigation | 2 min | 2 min |
| Select Road | 1 min | 3 min |
| Define Work Zone | 2 min | 5 min |
| Place Signs | 3 min | 8 min |
| Export Plan | 2 min | 10 min |
| Save/Load Project | 2 min | 12 min |
| Advanced Features | 3 min | 15 min |
| Responsive Testing | 2 min | 17 min |

**Total Testing Time:** ~15-20 minutes for complete coverage

---

## Troubleshooting Common Issues

### Issue: "Ingen vei funnet her"
**Solution:**
- Click closer to the road center line
- Zoom in more
- Try a different section of the road

### Issue: Distance markers don't appear
**Solution:**
- Check both START and END are placed
- Check a road is selected
- Check "Vis avstandsmarkører" is enabled
- Try dragging a marker to trigger regeneration

### Issue: Signs don't rotate/remove
**Solution:**
- Refresh browser (Ctrl+Shift+R)
- Clear cache
- Check console for JavaScript errors

### Issue: Export fails
**Solution:**
- Reduce map zoom level
- Wait for all tiles to load
- Check internet connection
- Try again after 5 seconds

---

## Success Criteria

After completing all tests, you should have:

✅ **Created** a complete arbeidsvarslingsplan for Nordfjordvegen
✅ **Exported** a high-quality PNG image with scale bar
✅ **Saved** a project that can be loaded later
✅ **Verified** all features work as expected
✅ **Confirmed** application is production-ready

---

## Next Steps After Testing

1. **Document any bugs** found during testing
2. **Share the exported PNG** to verify print quality
3. **Test with different roads** (E6, Rv7, local roads)
4. **Test in different browsers** (Chrome, Firefox, Safari, Edge)
5. **Consider deployment** to production server

---

**Happy Testing!** 🎉

If any step fails, refer to:
- `ALL_FIXES_COMPLETE.md` for troubleshooting
- `docs/USER_GUIDE.md` for detailed instructions
- Console logs for technical errors
