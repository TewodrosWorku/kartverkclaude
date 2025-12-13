# Geonorge Address Search API Fix

## Problem

When searching for addresses (e.g., "Stavanger"), the application returned an error:
```
400 BAD REQUEST
https://ws.geonorge.no/adresser/v1/sok?fuzzy=true&adresser=Stavanger
```

## Root Cause

The search parameter name was incorrect:
```javascript
// ❌ INCORRECT (old code)
const url = `${GEONORGE_API}?fuzzy=true&adresser=${query}`;
```

The Geonorge API uses `sok` (Norwegian for "search") as the parameter name, not `adresser`.

## Solution

Updated to use the correct parameter name:
```javascript
// ✅ CORRECT (new code)
const url = `${GEONORGE_API}?fuzzy=true&sok=${query}`;
```

### Comparison:

| Old (Broken) | New (Fixed) |
|--------------|-------------|
| Parameter: `adresser=Stavanger` | Parameter: `sok=Stavanger` |
| Result: 400 Bad Request | Result: Returns address list |

## Files Changed

1. **js/address-search.js** - Fixed search parameter from `adresser` to `sok`
2. **test/validation.html** - Updated Geonorge API test

## Testing

After this fix, you should be able to:
- ✅ Type "Stavanger" in the search box
- ✅ See autocomplete suggestions appear
- ✅ Click on an address to pan the map to that location
- ✅ See a temporary red marker at the selected location

## Geonorge API Documentation

**Correct endpoint:**
```
GET https://ws.geonorge.no/adresser/v1/sok
```

**Parameters:**
- `sok`: Search query (address, place name, etc.)
- `fuzzy`: Enable fuzzy search (true/false)

**Example:**
```
https://ws.geonorge.no/adresser/v1/sok?fuzzy=true&sok=Stavanger
```

**Response format:**
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

## Status

✅ **FIXED** - Address search now works correctly with Geonorge API
