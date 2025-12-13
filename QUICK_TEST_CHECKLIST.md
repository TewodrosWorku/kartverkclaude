# Quick Test Checklist - Nordfjordvegen Example

## 🎯 15-Minute Complete Test

### Before You Start
- [ ] Browser: Chrome/Firefox/Edge (latest version)
- [ ] Screen: Desktop (recommended for first test)
- [ ] Internet: Connected
- [ ] File: `index.html` opened

---

## Phase 1: Find Location (2 min)

```
1. Type "Nordfjordvegen" in search box
2. Select from dropdown
3. Map pans to location ✓

Alternative: Navigate manually to Sogn og Fjordane
```

---

## Phase 2: Select Road (1 min)

```
1. Click on the road
2. Blue line appears ✓
3. Popup shows road info ✓
4. Sidebar updates ✓
```

---

## Phase 3: Work Zone (2 min)

```
1. Click "Sett START" → Click on road → Green marker ✓
2. Click "Sett SLUTT" → Click on road → Red marker ✓
3. Red dots appear (20m/50m intervals) ✓
4. Status: "✓ Arbeidssone definert" ✓
```

**Test:** Drag a marker → dots regenerate ✓

---

## Phase 4: Place Signs (3 min)

```
1. Go to "Skilt" tab
2. Drag "142" (yellow triangle) to map ✓
3. Drag "50" speed sign to map ✓
4. Click on a sign → popup opens ✓
5. Click "Roter 90°" → sign rotates ✓
6. Click "✕ Fjern" → sign disappears ✓
```

**Place at least 3 signs for good test**

---

## Phase 5: Export (2 min)

```
1. Go to "Kart" tab
2. Zoom to show entire work area
3. Click "📥 Eksporter som bilde"
4. Wait for download ✓
5. Open PNG file → verify quality ✓
```

**Check:** Scale bar visible, signs clear, high resolution

---

## Phase 6: Save & Load (2 min)

```
1. Click "💾 Lagre prosjekt"
2. Name: "Test Nordfjordvegen"
3. Click OK ✓
4. Click "📄 Nytt prosjekt" → Everything clears ✓
5. Go to "Prosjekter" tab
6. Click "Åpne" on saved project ✓
7. Everything restores ✓
```

---

## Phase 7: Quick Feature Test (3 min)

### Distance Markers Toggle
```
[ ] Uncheck "Vis avstandsmarkører" → dots hide
[ ] Check again → dots reappear
```

### Snapping Toggle
```
[ ] Uncheck "Fest til vei"
[ ] Place marker OFF road → free placement
[ ] Check again → drag marker → snaps to road
```

### Keyboard Shortcuts
```
[ ] Ctrl+S → Save dialog
[ ] Ctrl+E → Export starts
[ ] Ctrl+N → New project dialog
```

### Project Management
```
[ ] Click "Dupliser" → copy created
[ ] Click "Slett" → confirm → copy deleted
```

---

## Phase 8: Browser Check (2 min)

```
[ ] Resize window narrow → mobile layout
[ ] Resize wide → desktop layout
[ ] All features still work
```

---

## ✅ Success Criteria

After 15 minutes, you should have:

✓ **Created** a complete work plan
✓ **Exported** a PNG image
✓ **Saved** a project
✓ **Loaded** the project successfully
✓ **Verified** all major features work

---

## 🚨 If Something Fails

| Problem | Quick Fix |
|---------|-----------|
| Road not found | Click closer to road center, zoom in |
| Distance markers missing | Check both markers placed, road selected |
| Signs don't rotate/remove | Refresh browser (Ctrl+Shift+R) |
| Export fails | Wait for tiles to load, try again |

---

## 📊 Quick Stats

- **Total Time:** 15 minutes
- **Actions:** ~30 steps
- **Features Tested:** 8 major areas
- **Expected Result:** Fully functional app

---

## What You'll Create

**Output Files:**
1. `avplan_2025-XX-XX.png` - Exported map image
2. Project in localStorage - "Test Nordfjordvegen"

**Verification:**
- Open PNG → Should see professional work plan
- Load project → Everything restored perfectly

---

## Next: Real-World Use

Once testing passes, you can:
1. Create actual arbeidsvarslingsplaner
2. Use for different roads across Norway
3. Export and share with team
4. Save multiple projects

---

**Version:** 1.0.2
**Status:** Ready to test! 🚀

See `TESTING_GUIDE.md` for detailed explanations.
