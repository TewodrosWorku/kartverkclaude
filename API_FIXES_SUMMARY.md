# API Integration Fixes - Summary

This document summarizes all API integration fixes made to AV-Plan.

## Issues Fixed

### 1. NVDB API V4 - Road Selection ✅

**Problem:** 400 Bad Request when clicking on roads
```
Error: "Ukjente parametre: lat, lon, maks_avstand"
```

**Solution:** Changed from point-based search to bounding box search

| Before | After |
|--------|-------|
| Endpoint: `/vegnett/api/v4/veg` | Endpoint: `/vegnett/veglenkesekvenser/segmentert` |
| Params: `lat, lon, maks_avstand` | Params: `kartutsnitt, srid` |
| Direct point query | Bounding box + Turf.js distance calc |

**File:** `js/nvdb-api.js`

---

### 2. Geonorge API - Address Search ✅

**Problem:** 400 Bad Request when searching for addresses
```
Error: Bad request on ?fuzzy=true&adresser=Stavanger
```

**Solution:** Changed parameter name from `adresser` to `sok`

| Before | After |
|--------|-------|
| Parameter: `adresser=Stavanger` | Parameter: `sok=Stavanger` |
| Result: 400 error | Result: Address list returned |

**File:** `js/address-search.js`

---

## Correct API Usage

### NVDB API V4

**Endpoint:**
```
GET https://nvdbapiles.atlas.vegvesen.no/vegnett/veglenkesekvenser/segmentert
```

**Parameters:**
- `kartutsnitt`: WKT POLYGON string (bounding box)
- `srid`: Coordinate system (use `wgs84` for lat/lng)

**Example:**
```javascript
const kartutsnitt = 'POLYGON((10.39 63.43, 10.40 63.43, 10.40 63.44, 10.39 63.44, 10.39 63.43))';
const url = `/vegnett/veglenkesekvenser/segmentert?kartutsnitt=${kartutsnitt}&srid=wgs84`;
```

**Response:**
```json
{
  "objekter": [
    {
      "veglenkesekvensid": 123456,
      "vegsystemreferanse": {...},
      "geometri": { "wkt": "LINESTRING(...)" }
    }
  ]
}
```

---

### Geonorge Address API

**Endpoint:**
```
GET https://ws.geonorge.no/adresser/v1/sok
```

**Parameters:**
- `sok`: Search query (address or place name)
- `fuzzy`: Enable fuzzy matching (true/false)

**Example:**
```javascript
const url = 'https://ws.geonorge.no/adresser/v1/sok?fuzzy=true&sok=Stavanger';
```

**Response:**
```json
{
  "adresser": [
    {
      "adressetekst": "Kongsgata 1, 4001 Stavanger",
      "representasjonspunkt": {
        "lat": 58.9700,
        "lon": 5.7331
      }
    }
  ]
}
```

---

## Testing

### Manual Testing

1. **Road Selection:**
   - Open the app
   - Click on any road
   - ✅ Should highlight road in blue
   - ✅ Should show road info popup

2. **Address Search:**
   - Type "Stavanger" in search box
   - ✅ Should show autocomplete suggestions
   - Click on an address
   - ✅ Should pan to location with red marker

### Automated Testing

Run validation tests:
```bash
open test/validation.html
```

Expected results:
- ✅ NVDB API V4 Tilkobling - PASS
- ✅ Geonorge API - PASS

---

## Files Modified

1. ✅ `js/nvdb-api.js` - Fixed NVDB endpoint and parameters
2. ✅ `js/address-search.js` - Fixed Geonorge parameter
3. ✅ `test/validation.html` - Updated tests for both APIs
4. ✅ `docs/API_DOCUMENTATION.md` - Updated documentation
5. ✅ `docs/USER_GUIDE.md` - Clarified usage

---

## Documentation References

- **NVDB API:** https://nvdbapiles.atlas.vegvesen.no/dokumentasjon/
- **Geonorge API:** https://ws.geonorge.no/adresser/v1/
- **Kartverket WMTS:** https://www.kartverket.no/api-og-data/

---

## Status

✅ **ALL FIXED** - All API integrations and sign controls now work correctly

Date: 2025-01-XX
Version: 1.0.2

---

## Update v1.0.2 - Sign Controls

### 3. Sign Popup Controls - Rotate & Remove ✅

**Problem:** Buttons in sign popup (Roter 90°, Fjern) didn't work when clicked

**Solution:** Changed from inline onclick to proper DOM elements with event listeners

| Before | After |
|--------|-------|
| String HTML with onclick | DOM elements with addEventListener |
| setRotationAngle (doesn't exist) | CSS transform for rotation |
| Direct removal | Close popup before removing |

**File:** `js/sign-manager.js`

See `SIGN_CONTROLS_FIX.md` for detailed information.
