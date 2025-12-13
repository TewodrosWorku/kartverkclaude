# NVDB API V4 Fix - 2025-01-XX

## Problem

When clicking on the map to select a road, the application returned an error:
```
"Ukjente parametre: lat, lon, maks_avstand"
```

This was a **400 Bad Request** error from the NVDB API.

## Root Cause

The original implementation used incorrect endpoint and parameters for NVDB API V4:
```javascript
// ❌ INCORRECT (old code)
const data = await makeRequest('/vegnett/api/v4/veg', {
    lat: lat,
    lon: lon,
    maks_avstand: maxDistance
});
```

The NVDB API V4 **does not accept** these parameters. The `/veg` endpoint doesn't exist in V4.

## Solution

Updated to use the correct NVDB API V4 endpoint with bounding box search:

```javascript
// ✅ CORRECT (new code)
const kartutsnitt = `POLYGON((${minLon} ${minLat}, ${maxLon} ${minLat}, ${maxLon} ${maxLat}, ${minLon} ${maxLat}, ${minLon} ${minLat}))`;

const data = await makeRequest('/vegnett/veglenkesekvenser/segmentert', {
    kartutsnitt: kartutsnitt,
    srid: 'wgs84'
});
```

### How it works now:

1. **Create bounding box**: Convert the maxDistance (meters) to a geographic bounding box around the clicked point
2. **Query API**: Use `/vegnett/veglenkesekvenser/segmentert` endpoint with WKT POLYGON
3. **Get results**: API returns all roads within the bounding box in `data.objekter`
4. **Find closest**: Use Turf.js to calculate which road is closest to the clicked point
5. **Return road**: Return the closest road's data

### Key changes:

| Old (Broken) | New (Fixed) |
|--------------|-------------|
| Endpoint: `/vegnett/api/v4/veg` | Endpoint: `/vegnett/veglenkesekvenser/segmentert` |
| Params: `lat, lon, maks_avstand` | Params: `kartutsnitt, srid` |
| Returns single road | Returns array in `objekter` |
| Direct point search | Bounding box search + distance calc |

## Files Changed

1. **js/nvdb-api.js** - Fixed `findNearestRoad()` function
2. **test/validation.html** - Updated NVDB API test
3. **docs/API_DOCUMENTATION.md** - Updated documentation

## Testing

After this fix, you should be able to:
- ✅ Click on any road in Norway
- ✅ See the road highlighted in blue
- ✅ See road information in popup
- ✅ Select the road for work zone planning

## Verification

Run the validation tests:
1. Open `test/validation.html` in browser
2. Check that "NVDB API V4 Tilkobling" test passes
3. Test manually by clicking on a road in the map

## NVDB API V4 Documentation

Official documentation:
- Base URL: https://nvdbapiles.atlas.vegvesen.no
- API Docs: https://nvdbapiles.atlas.vegvesen.no/dokumentasjon/

### Correct V4 endpoint for spatial queries:
```
GET /vegnett/veglenkesekvenser/segmentert
```

**Required parameters:**
- `kartutsnitt`: WKT POLYGON defining search area
- `srid`: Coordinate system (use 'wgs84' for lat/lng)

**Response format:**
```json
{
  "objekter": [
    {
      "veglenkesekvensid": 123456,
      "vegsystemreferanse": {...},
      "geometri": {
        "wkt": "LINESTRING(...)"
      },
      "kommune": [...]
    }
  ]
}
```

## Status

✅ **FIXED** - Road selection now works correctly with NVDB API V4
