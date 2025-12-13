# AV-Plan Implementation Plan for Claude CLI

## 🎯 Overview



## 🚀 Implementation Sequence

Each section below contains a **complete prompt** to give Claude CLI. The prompts are numbered and should be executed in order.

---

## PROMPT 1: Project Foundation & Structure

**Copy this entire prompt to Claude CLI:**

```
Create the foundational structure for AV-Plan, a Norwegian road work planning tool.

PROJECT CONTEXT:
- 100% frontend application (no backend)
- Uses NVDB API Les V4 for road data (https://nvdbapiles.atlas.vegvesen.no)
- Uses Geonorge for address search
- Uses Kartverket for map tiles
- Stores projects in localStorage
- Target users: Norwegian road workers creating arbeidsvarslingsplaner

TASK 1: Create index.html with:
- HTML5 boilerplate
- Meta tags for responsive design (viewport, charset)
- Title: "AV-Plan - Arbeidsvarslingsplan"
- Language: Norwegian (lang="no")
- CDN links for:
  * Leaflet 1.9.4 (CSS and JS)
  * Turf.js 6.x
  * html2canvas 1.4.1
- Links to local CSS files: css/main.css, css/components.css
- Complete UI structure with:
  * Sidebar with 3 tabs (Kart, Skilt, Prosjekter)
  * Map container div
  * Status bar at bottom
  * All buttons and form elements
- Script tags to load JS modules (app.js as module)

TASK 2: Create package.json with:
- Name: "avplan"
- Version: "1.0.0"
- Description: "Arbeidsvarslingsplan tool for Norwegian roads"
- Type: "module" (for ES6 imports)
- No dependencies (all CDN-based)

TASK 3: Create .gitignore:
- Ignore node_modules, .DS_Store, *.log
- Keep assets/ and data/ directories

TASK 4: Create README.md:
- Brief Norwegian description
- Quick start instructions
- Technology stack
- Data sources (NVDB, Kartverket, Geonorge)

REQUIREMENTS:
- Use semantic HTML5
- All text in Norwegian
- Mobile-friendly structure
- Professional, clean layout
- Include ARIA labels for accessibility

Generate all 4 files now.
```

---

## PROMPT 2: CSS Styling System

**Copy this to Claude CLI:**

```
Create a complete CSS styling system for AV-Plan with modern Norwegian design aesthetics.

CONTEXT:
- Target: Norwegian government workers and contractors
- Style: Professional, clean, functional (inspired by Statens vegvesen)
- Colors: Norwegian palette (blue primary, safety colors)
- Must work on desktop and mobile

TASK 1: Create css/main.css with:

1. CSS Variables:
   - Primary color: #0066cc (Norwegian blue)
   - Success: #28a745 (green)
   - Warning: #ffc107 (yellow)
   - Danger: #dc3545 (red)
   - Neutral: #6c757d (gray)
   - Background: #f8f9fa
   - Text: #212529
   - Border: #ddd
   - Spacing scale: xs(4px), sm(8px), md(15px), lg(20px)
   - Border radius: sm(4px), md(8px), lg(12px)
   - Shadows: sm, md, lg

2. Global Styles:
   - CSS reset (box-sizing, margin, padding)
   - Body: font-family (system fonts), no margin
   - Links: remove underline, proper hover states
   - Smooth scrolling

3. Layout:
   - Body: display flex (to position map and sidebar)
   - Map: 100vh height, flex-grow to fill space
   - Sidebar: 350px width on desktop, full width on mobile
   - Status bar: bottom-center positioning

4. Typography:
   - Base font: 14px
   - Headings: h1(20px), h2(18px), h3(16px)
   - Small text: 12px
   - Font weights: normal(400), medium(500), bold(700)

TASK 2: Create css/components.css with:

1. Sidebar Component:
   - White background
   - Box shadow for depth
   - Border radius: 8px
   - Padding: 15px
   - Max height: 90vh with scroll
   - Positioned absolute (top-left on desktop)
   - Z-index: 1000

2. Tab System:
   - Horizontal layout
   - Equal width tabs
   - Active tab: blue background, white text
   - Inactive: light gray, smooth transitions
   - 200ms ease transitions

3. Buttons:
   - Primary: blue background, white text
   - Secondary: gray background
   - Danger: red (for delete actions)
   - Toggle buttons: green (ON) or red (OFF)
   - Hover states: darker shade
   - Active state: slight scale down
   - Disabled state: gray, cursor not-allowed
   - Padding: 8px 12px
   - Border radius: 4px
   - Font size: 13px

4. Form Inputs:
   - Full width in container
   - Padding: 8px
   - Border: 1px solid #ddd
   - Border radius: 4px
   - Focus: blue border, subtle shadow
   - Placeholder: #999

5. Sign Grid:
   - CSS Grid: 4 columns
   - Gap: 8px
   - Sign items: 60x60px
   - Border: 2px solid #ddd
   - Hover: blue border, shadow
   - Cursor: grab

6. Project List Items:
   - Light gray background
   - 1px border, rounded
   - Padding: 10px
   - Margin: 8px vertical
   - Hover: subtle shadow
   - Title: bold 14px
   - Metadata: 12px gray text

7. Status Bar:
   - Fixed position bottom-center
   - White background
   - Rounded pill shape (border-radius: 20px)
   - Box shadow
   - Padding: 8px 16px
   - Small text: 13px
   - Transform: translateX(-50%) for centering

8. Responsive Design:
   - Media query: max-width 768px
   - Sidebar becomes full-width overlay
   - Sign grid: 3 columns on mobile
   - Buttons: larger touch targets (44px min height)
   - Status bar: compact version

REQUIREMENTS:
- Use CSS custom properties (variables)
- Mobile-first approach
- Smooth transitions (200-300ms)
- WCAG AA color contrast
- Print-friendly (hide controls when printing)
- No CSS frameworks (vanilla CSS)

Generate both CSS files now.
```

---

## PROMPT 3: NVDB API V4 Wrapper Module

**Copy this to Claude CLI:**

```
Create a clean, production-ready JavaScript module for NVDB API Les V4 integration.

CONTEXT:
- NVDB API V4 base: https://nvdbapiles.atlas.vegvesen.no
- API is open (no authentication required for reading)
- Must include X-Client header for statistics
- All data is in Norwegian format
- Geometry is in WKT format (need conversion to GeoJSON)

TASK: Create js/nvdb-api.js as ES6 module

REQUIREMENTS:

1. Constants:
   - NVDB_BASE_URL = 'https://nvdbapiles.atlas.vegvesen.no'
   - API_VERSION = 'v4'
   - CLIENT_NAME = 'avplan-app'
   - REQUEST_TIMEOUT = 10000 (10 seconds)

2. Helper function: makeRequest(endpoint, params)
   - Build full URL with query parameters
   - Add headers: 'X-Client', 'Accept: application/json'
   - Implement timeout using AbortController
   - Handle fetch errors gracefully
   - Return null on error (don't throw)
   - Log errors to console

3. Function: findNearestRoad(lat, lon, maxDistance = 50)
   - Endpoint: /vegnett/api/v4/veg
   - Query params: lat, lon, maks_avstand
   - Returns: road object or null
   - Extract: veglenkesekvensid, vegsystemreferanse, geometry
   
4. Function: getRoadDetails(veglenkesekvensid)
   - Endpoint: /vegnett/api/v4/veglenkesekvenser/{id}
   - Query params: inkluder=geometri,vegsystemreferanse
   - Returns: full road data object with geometry in WKT
   
5. Function: formatRoadReference(vegsystemreferanse)
   - Input: vegsystemreferanse object from NVDB
   - Output: formatted string like "Ev6" or "Rv3 S12D3"
   - Handle missing data gracefully
   - Rules:
     * Category: E (Europa), R (Riks), F (Fylkes), K (Kommune), P (Privat)
     * Format: {kategori}v{nummer} or full with strekning/delstrekning
   
6. Function: parseWKTToGeoJSON(wkt)
   - Convert WKT string to GeoJSON
   - Handle POINT, LINESTRING, POLYGON
   - Use wellknown library (available globally from CDN)
   - Return GeoJSON object

ERROR HANDLING:
- Network errors → return null, log "Network error"
- Timeout errors → return null, log "Request timeout"
- Invalid response → return null, log "Invalid API response"
- Missing data → return null, log "No data found"

EXPORT:
Export all functions as named exports for ES6 import

DOCUMENTATION:
Include JSDoc comments for all functions with:
- @param tags
- @returns tags
- @example usage

CODE QUALITY:
- Use async/await (no callbacks)
- Use const/let (no var)
- Use template literals
- Use destructuring where appropriate
- Keep functions pure and testable

Generate the complete nvdb-api.js module now.
```

---

## PROMPT 4: Map Manager Core

**Copy this to Claude CLI:**

```
Create the core map management module using Leaflet and NVDB API V4.

CONTEXT:
- Leaflet 1.9.4 is loaded via CDN
- Kartverket provides Norwegian topographic tiles
- Map must integrate with NVDB API V4
- Users click map to select roads
- Selected road shown as blue line

TASK: Create js/map-manager.js as ES6 module

DEPENDENCIES:
import { findNearestRoad, getRoadDetails, formatRoadReference, parseWKTToGeoJSON } from './nvdb-api.js';

GLOBAL STATE OBJECT:
const mapState = {
    map: null,
    selectedRoad: null,
    roadLayer: null,
    startMarker: null,
    endMarker: null,
    distanceMarkerLayer: null,
    mode: null, // 'setStart', 'setEnd', or null
};

FUNCTIONS TO IMPLEMENT:

1. initializeMap()
   - Create Leaflet map: L.map('map')
   - Initial view: [63.4305, 10.3951], zoom 5
   - Min zoom: 4, max zoom: 19
   - Add Kartverket tile layer:
     * URL: https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png
     * Attribution: '© Kartverket'
   - Store in mapState.map
   - Return map instance

2. setupMapClickHandler()
   - Listen for map 'click' event
   - Get lat/lng from event
   - If mode is 'setStart' or 'setEnd', handle work zone marker (separate function)
   - Otherwise: select road at clicked location
   - Call selectRoadAtPoint(lat, lng)

3. async selectRoadAtPoint(lat, lng)
   - Call findNearestRoad(lat, lng)
   - If no road found: show alert "Ingen vei funnet her"
   - If found: call getRoadDetails(veglenkesekvensid)
   - Parse WKT geometry to GeoJSON
   - Call displayRoad(roadData, geojson)
   - Store in mapState.selectedRoad

4. displayRoad(roadData, geojson)
   - Remove previous roadLayer if exists
   - Create L.geoJSON layer with geojson
   - Style: { color: '#0066cc', weight: 6, opacity: 0.7 }
   - Add to map
   - Store in mapState.roadLayer
   - Call showRoadInfoPopup(roadData)

5. showRoadInfoPopup(roadData)
   - Format road reference using formatRoadReference()
   - Create popup HTML with:
     * Road reference (bold, large)
     * Category
     * Municipality (if available)
     * Length in meters
   - Position popup at center of road geometry
   - Open popup

6. clearSelectedRoad()
   - Remove roadLayer from map
   - Set mapState.selectedRoad = null
   - Set mapState.roadLayer = null

7. getMap()
   - Return mapState.map
   - Used by other modules to access map instance

8. getSelectedRoad()
   - Return mapState.selectedRoad
   - Used by other modules to access selected road

EVENT HANDLING:
- Map ready event
- Click event with mode detection
- Error handling for all async operations

INITIALIZATION:
- Call initializeMap() on module load
- Call setupMapClickHandler() after map ready

EXPORT:
Export all public functions:
- initializeMap
- selectRoadAtPoint  
- clearSelectedRoad
- getMap
- getSelectedRoad
- mapState (for access by other modules)

CODE QUALITY:
- Proper error handling with try-catch
- User-friendly error messages in Norwegian
- Console logging for debugging
- Clean up resources (remove layers before adding new)

Generate the complete map-manager.js module now.
```

---

## PROMPT 5: Address Search Integration

**Copy this to Claude CLI:**

```
Create address search functionality using Geonorge API.

CONTEXT:
- Geonorge provides Norwegian address geocoding
- API endpoint: https://ws.geonorge.no/adresser/v1/sok
- Free, no authentication
- Results in Norwegian

TASK: Create js/address-search.js as ES6 module

DEPENDENCIES:
import { getMap } from './map-manager.js';

CONSTANTS:
- GEONORGE_API = 'https://ws.geonorge.no/adresser/v1/sok'
- DEBOUNCE_DELAY = 300 (milliseconds)

FUNCTIONS TO IMPLEMENT:

1. setupAddressSearch()
   - Get DOM elements: #searchInput, #searchBtn
   - Add click listener to search button
   - Add keypress listener (Enter key) to input
   - Add input listener with debouncing
   - Initialize autocomplete dropdown

2. debounce(func, delay)
   - Classic debounce implementation
   - Return debounced function
   - Used to delay API calls while typing

3. async searchAddress(query)
   - Validate query (min 3 characters)
   - Build URL: ${GEONORGE_API}?fuzzy=true&adresser=${encodeURIComponent(query)}
   - Fetch with timeout (10 seconds)
   - Parse JSON response
   - Extract: data.adresser array
   - Return array of addresses or empty array on error
   - Log errors to console

4. displaySearchResults(addresses)
   - Create or update dropdown element
   - Show top 5 results
   - Each result shows: adressetekst
   - Add click listeners to results
   - Position dropdown below search input
   - Style: white background, shadow, border

5. selectAddress(address)
   - Extract: representasjonspunkt (lat, lon)
   - Get map from getMap()
   - Pan to location: map.setView([lat, lon], 15)
   - Add temporary marker (red pin)
   - Remove marker after 3 seconds
   - Close dropdown
   - Clear search input (optional)

6. hideSearchResults()
   - Remove or hide dropdown
   - Called when clicking outside or after selection

7. handleSearchInput(event)
   - Get input value
   - If length >= 3: call searchAddress()
   - If length < 3: hideSearchResults()
   - Show loading indicator

8. handleSearchButton()
   - Get input value
   - Call searchAddress()
   - Display results or show "Ingen resultater"

UI ELEMENTS TO CREATE:
- Search results dropdown:
  * ID: searchResults
  * Position: absolute, below searchInput
  * Z-index: 1001
  * Max height: 300px with scroll
  * Each result: padding, hover effect

ERROR HANDLING:
- Network errors: show "Søk feilet, prøv igjen"
- No results: show "Ingen adresser funnet"
- Invalid input: show "Skriv minst 3 tegn"

KEYBOARD NAVIGATION:
- Arrow Up/Down: navigate results
- Enter: select highlighted result
- Escape: close dropdown

INITIALIZATION:
- Export init function: initAddressSearch()
- Call setupAddressSearch() in init

EXPORT:
Export initAddressSearch function

CODE QUALITY:
- Clean up event listeners on destroy
- Prevent memory leaks
- Accessible (ARIA labels)
- Mobile-friendly (touch events)

Generate the complete address-search.js module now.
```

---

## PROMPT 6: Work Zone Markers with Snapping

**Copy this to Claude CLI:**

```
Create work zone marker system with optional road snapping.

CONTEXT:
- Users set START and END markers for work zone
- Markers can snap to selected road or be placed freely
- Markers are draggable
- When markers move, distance markers regenerate

TASK: Create js/work-zone.js as ES6 module

DEPENDENCIES:
import { getMap, getSelectedRoad, mapState } from './map-manager.js';
import { updateDistanceMarkers } from './distance-markers.js';

STATE:
const workZoneState = {
    startMarker: null,
    endMarker: null,
    snapEnabled: true,
    mode: null // 'setStart', 'setEnd', or null
};

FUNCTIONS TO IMPLEMENT:

1. initWorkZone()
   - Get button elements: #startBtn, #endBtn, #clearZoneBtn
   - Add click listeners
   - Setup snap toggle: #snapToggle
   - Initialize marker styles

2. activateStartMode()
   - Set workZoneState.mode = 'setStart'
   - Highlight start button (add 'active' class)
   - Show instruction: "Klikk på kartet for å sette start"
   - Cursor changes to crosshair

3. activateEndMode()
   - Set workZoneState.mode = 'setEnd'
   - Highlight end button
   - Show instruction: "Klikk på kartet for å sette slutt"

4. handleMapClick(latlng)
   - Check workZoneState.mode
   - If 'setStart': call placeStartMarker(latlng)
   - If 'setEnd': call placeEndMarker(latlng)
   - Reset mode to null
   - Remove button highlights

5. placeStartMarker(latlng)
   - If snapEnabled AND road selected: snap to road
   - Remove existing start marker if present
   - Create L.marker with custom icon (green circle)
   - Make draggable
   - Add drag end listener → re-snap if enabled
   - Bind tooltip: "Start arbeidssone"
   - Add to map
   - Store in workZoneState.startMarker
   - Call updateDistanceMarkers()
   - Update UI status

6. placeEndMarker(latlng)
   - Similar to placeStartMarker but red color
   - Tooltip: "Slutt arbeidssone"
   - Store in workZoneState.endMarker

7. snapToRoad(latlng)
   - Get selected road geometry
   - If no road: return original latlng
   - Convert to turf.js format: [lng, lat]
   - Use turf.nearestPointOnLine(lineString, point)
   - Return snapped [lat, lng]

8. createMarkerIcon(color)
   - Create L.divIcon with custom HTML
   - Circle: 20px diameter
   - Background: color (green or red)
   - White border: 3px
   - Box shadow for depth
   - Return icon

9. clearWorkZone()
   - Remove startMarker from map
   - Remove endMarker from map
   - Set both to null in state
   - Clear distance markers
   - Update UI status

10. toggleSnapping(enabled)
    - Set workZoneState.snapEnabled = enabled
    - Update toggle button visual state
    - Show toast: "Snapping aktivert" / "Fri plassering"

11. getWorkZone()
    - Return object with start and end positions
    - Format: { start: [lat, lng], end: [lat, lng] }
    - Return null if either missing

12. updateZoneStatus()
    - Get #zoneStatus element
    - If both markers: "✓ Arbeidssone definert" (green)
    - If one marker: "⚠ Kun start eller slutt satt" (yellow)
    - If no markers: "Ingen arbeidssone definert" (gray)

MARKER DRAG HANDLING:
- On drag end: re-snap if enabled
- Regenerate distance markers
- Update status

EXPORT:
Export functions:
- initWorkZone
- handleMapClick
- getWorkZone
- toggleSnapping
- clearWorkZone
- workZoneState

CODE QUALITY:
- Handle edge cases (no road selected)
- Show warnings to user
- Clean animations
- Responsive on mobile

Generate the complete work-zone.js module now.
```

---

## PROMPT 7: Distance Markers Generator

**Copy this to Claude CLI:**

```
Create the distance marker system - THE MOST CRITICAL FEATURE.

CONTEXT:
- Every 20m: small red dot
- Every 50m: large red dot with white border
- From START: extend BACKWARD (opposite direction of END) up to 400m
- From END: extend FORWARD (opposite direction of START) up to 400m
- Markers follow road curvature (not straight line)
- Toggle visibility on/off
- Hidden during export

TASK: Create js/distance-markers.js as ES6 module

DEPENDENCIES:
import { getMap, getSelectedRoad } from './map-manager.js';
import { getWorkZone } from './work-zone.js';
// Note: turf.js is available globally from CDN

STATE:
const distanceMarkerState = {
    layer: null,
    visible: true,
    markers: []
};

FUNCTIONS TO IMPLEMENT:

1. generateDistanceMarkers()
   - Get work zone (start, end points)
   - Get selected road geometry
   - Validate: return if any missing
   - Convert road geometry to turf lineString
   - Calculate markers from START backward
   - Calculate markers from END forward
   - Return array of marker objects

2. calculateMarkersFromPoint(point, roadLine, direction, maxDistance)
   - point: [lat, lng]
   - roadLine: turf LineString
   - direction: 'backward' or 'forward'
   - maxDistance: 400 meters
   
   Algorithm:
   - Find point position on line using turf.nearestPointOnLine()
   - Get distance from line start using turf.length() with turf.lineSlice()
   - If direction 'backward': subtract distances (20m, 40m, ..., 400m)
   - If direction 'forward': add distances (20m, 40m, ..., 400m)
   - For each distance:
     * Check if within road bounds (0 to total length)
     * Use turf.along() to get point at distance
     * Create marker object: { position: [lng, lat], distance: meters, type: 'small'|'large', from: 'start'|'end' }
     * Type is 'large' if distance % 50 === 0, else 'small'
   - Return array of marker objects

3. renderDistanceMarkers(markers)
   - Clear existing layer
   - Create new L.layerGroup()
   - For each marker:
     * Create L.circleMarker()
     * Position: [marker.position[1], marker.position[0]] (lat, lng)
     * Radius: 6px if large, 3px if small
     * Fill color: '#ff0000'
     * Border color: '#ffffff' if large, '#ff0000' if small
     * Border weight: 2 if large, 1 if small
     * Fill opacity: 0.9
     * Class name: 'distance-marker' (for hiding during export)
     * Bind tooltip: "{distance}m fra {start/slutt}"
     * Add to layer group
   - Add layer to map
   - Store in distanceMarkerState.layer

4. updateDistanceMarkers()
   - Check if visible is false: return
   - Check if work zone complete: return if not
   - Check if road selected: return if not
   - Call generateDistanceMarkers()
   - Call renderDistanceMarkers(markers)
   - Store markers in state

5. toggleDistanceMarkers(visible)
   - Set distanceMarkerState.visible = visible
   - If visible: call updateDistanceMarkers()
   - If not visible: remove layer from map
   - Update toggle button UI

6. clearDistanceMarkers()
   - Remove layer from map if exists
   - Set layer to null
   - Clear markers array

7. hideForExport()
   - If layer exists: set opacity to 0
   - Don't remove from map (just hide)

8. showAfterExport()
   - If layer exists: restore opacity to 1

KEY ALGORITHM DETAILS:

For START marker going BACKWARD:
```
totalLineLength = turf.length(roadLine, {units: 'meters'})
startPointOnLine = turf.nearestPointOnLine(roadLine, [startLng, startLat])
startDistance = turf.length(
    turf.lineSlice(roadLine.geometry.coordinates[0], startPointOnLine, roadLine),
    {units: 'meters'}
)

for (distance = 20; distance <= 400; distance += 20) {
    distAlongLine = startDistance - distance  // BACKWARD
    if (distAlongLine >= 0) {
        point = turf.along(roadLine, distAlongLine/1000, {units: 'kilometers'})
        markers.push({ ... })
    }
}
```

For END marker going FORWARD:
```
endDistance = turf.length(
    turf.lineSlice(roadLine.geometry.coordinates[0], endPointOnLine, roadLine),
    {units: 'meters'}
)

for (distance = 20; distance <= 400; distance += 20) {
    distAlongLine = endDistance + distance  // FORWARD
    if (distAlongLine <= totalLineLength) {
        point = turf.along(roadLine, distAlongLine/1000, {units: 'kilometers'})
        markers.push({ ... })
    }
}
```

ERROR HANDLING:
- Road too short: only generate markers within bounds
- Start and end close together: handle overlapping
- Invalid geometry: log error, return empty array

EXPORT:
Export functions:
- updateDistanceMarkers
- toggleDistanceMarkers
- clearDistanceMarkers
- hideForExport
- showAfterExport

CODE QUALITY:
- Highly commented (this is complex geometry)
- Performance optimized (batch DOM updates)
- Clear variable names
- Unit tests for algorithms

Generate the complete distance-markers.js module now.
```

---

## PROMPT 8: Sign Library & Management

**Copy this to Claude CLI:**

```
Create sign library system with drag-and-drop placement.

CONTEXT:
- Traffic signs stored as SVG files
- User drags from palette to map
- Signs can be rotated, deleted, moved
- Optional snapping to road

TASK 1: Create data/sign-library.json

Structure:
{
    "sign_id": {
        "id": "142",
        "name": "Arbeid på vegen",
        "category": "warning",
        "file": "assets/signs/warning/142.svg",
        "description": "Temporary work warning",
        "keywords": ["arbeid", "work", "yellow"],
        "size": "900mm",
        "temporary": true,
        "common": true
    }
}

Include at least:
- Speed signs: 30, 40, 50, 60, 70, 80, 90, 110 (category: "speed")
- Warning signs: 142 (work), 204 (dangerous edge), 110 (unknown danger) (category: "warning")
- Prohibition signs: 306 (no overtaking), 308 (no entry) (category: "prohibition")
- Mark common ones with "common": true

TASK 2: Create js/sign-manager.js as ES6 module

DEPENDENCIES:
import { getMap, getSelectedRoad } from './map-manager.js';
import { snapToRoad } from './work-zone.js';

STATE:
const signState = {
    library: null,
    placedSigns: [],
    snapEnabled: true
};

FUNCTIONS TO IMPLEMENT:

1. async loadSignLibrary()
   - Fetch data/sign-library.json
   - Parse JSON
   - Store in signState.library
   - Return library object

2. initSignManager()
   - Call loadSignLibrary()
   - Setup sign palette rendering
   - Setup drag-and-drop event listeners
   - Setup map drop zone

3. renderSignPalette(library)
   - Get containers: #speedSigns, #warningSigns
   - Filter library by category
   - For each sign:
     * Create sign-item div
     * Add img with sign.file as src
     * Add label with sign.id
     * Make draggable (draggable="true")
     * Add dragstart listener
   - Append to appropriate container

4. handleSignDragStart(event, signId)
   - Set dataTransfer.effectAllowed = 'copy'
   - Set dataTransfer.setData('signId', signId)
   - Add dragging visual feedback

5. setupMapDropZone()
   - Listen for 'dragover' on map container
   - Prevent default (allows drop)
   - Listen for 'drop' on map
   - Get signId from dataTransfer
   - Get drop coordinates
   - Call placeSign(signId, latlng)

6. placeSign(signId, latlng, rotation = 0)
   - Get sign from library
   - If snapEnabled AND road selected: snap latlng
   - Create custom Leaflet icon:
     * iconUrl: sign.file
     * iconSize: [40, 40]
     * iconAnchor: [20, 20]
   - Create L.marker with icon
   - Make draggable
   - Set rotation if not 0
   - Bind popup with options:
     * Sign name
     * Rotate button
     * Delete button
   - Add to map
   - Store in signState.placedSigns array:
     {
         id: marker._leaflet_id,
         signId: signId,
         position: latlng,
         rotation: rotation,
         marker: marker
     }
   - Update sign count in UI

7. rotateSign(markerId)
   - Find sign in placedSigns
   - Increment rotation by 90°
   - Wrap at 360°
   - Update marker rotation (use setRotationAngle if available)
   - Update stored rotation

8. removeSign(markerId)
   - Find sign in placedSigns
   - Remove marker from map
   - Remove from placedSigns array
   - Update sign count

9. getPlacedSigns()
   - Return signState.placedSigns
   - Used by export and save functions

10. clearAllSigns()
    - Remove all markers from map
    - Clear placedSigns array
    - Update UI

11. rest

oreSigns(signs)
    - Used when loading project
    - For each sign: call placeSign()

DRAG EVENT HANDLERS:
- dragstart: set data
- dragover: allow drop
- drop: place sign

POPUP MENU:
Create HTML popup content:
```html
<div class="sign-popup">
    <strong>{sign.name}</strong>
    <div class="sign-actions">
        <button onclick="rotateSign('{markerId}')">↻ Roter 90°</button>
        <button onclick="removeSign('{markerId}')">✕ Fjern</button>
    </div>
</div>
```

EXPORT:
Export functions:
- initSignManager
- placeSign
- removeSign
- rotateSign
- getPlacedSigns
- clearAllSigns
- restoreSigns

CODE QUALITY:
- Validate sign exists before placing
- Handle missing SVG files gracefully
- Show loading state while loading library
- Accessible (keyboard navigation for placed signs)

Generate sign-library.json and sign-manager.js now.
```

---

## PROMPT 9: Export System with Scale Bar

**Copy this to Claude CLI:**

```
Create high-quality export system with automatic scale bar generation.

CONTEXT:
- Uses html2canvas library (loaded via CDN)
- Captures map as PNG image
- Includes accurate scale bar
- Hides UI elements during capture
- 2x resolution for print quality

TASK: Create js/export.js as ES6 module

DEPENDENCIES:
import { getMap } from './map-manager.js';
import { hideForExport as hideMarkers, showAfterExport as showMarkers } from './distance-markers.js';
// Note: html2canvas is available globally from CDN

FUNCTIONS TO IMPLEMENT:

1. async exportMapImage(filename)
   - Get project name from state (or use 'avplan')
   - Generate filename: `${projectName}_${date}.png`
   - Show loading indicator
   - Call prepareMapForExport()
   - Create and add scale bar
   - Capture with html2canvas
   - Download image
   - Call restoreMapAfterExport()
   - Hide loading indicator

2. prepareMapForExport()
   - Hide sidebar: document.getElementById('sidebar').style.display = 'none'
   - Hide status bar: document.getElementById('statusBar').style.display = 'none'
   - Hide Leaflet controls: querySelectorAll('.leaflet-control')
   - Hide distance markers (call hideMarkers())
   - Keep: road line, work zone markers, signs

3. createScaleBar()
   - Get current map zoom level
   - Get center latitude
   - Calculate meters per pixel:
     ```
     metersPerPixel = 156543.03392 * cos(centerLat * PI / 180) / pow(2, zoom)
     ```
   - Target scale bar width: 200px
   - Calculate scale distance: metersPerPixel * 200
   - Round to nice number (50, 100, 200, 500, 1000, 2000, 5000, etc.)
   - Adjust actual pixel width to match rounded scale
   - Create HTML element with:
     * Position: absolute, bottom-left
     * White background, black border
     * Segmented bar (alternating black/white every 10m)
     * Text label showing distance
   - Return element

4. roundToNiceNumber(value)
   - Get magnitude: pow(10, floor(log10(value)))
   - Round: round(value / magnitude) * magnitude
   - Ensure result is 50, 100, 200, 500, 1000, etc.
   - Return rounded value

5. async captureMapImage()
   - Get map element
   - Configure html2canvas:
     ```javascript
     {
         scale: 2,              // 2x resolution
         useCORS: true,         // Allow external images
         backgroundColor: '#ffffff',
         logging: false,
         windowWidth: map.offsetWidth,
         windowHeight: map.offsetHeight
     }
     ```
   - Await html2canvas(mapElement, config)
   - Return canvas

6. downloadCanvas(canvas, filename)
   - Convert canvas to data URL
   - Create temporary <a> element
   - Set href to data URL
   - Set download attribute to filename
   - Trigger click
   - Remove element

7. restoreMapAfterExport()
   - Remove scale bar element
   - Show sidebar
   - Show status bar
   - Show Leaflet controls
   - Show distance markers (call showMarkers())

8. showLoadingIndicator(message)
   - Create overlay with spinner
   - Message: "Eksporterer..." or custom
   - Block user interaction
   - Return indicator element

9. hideLoadingIndicator(indicator)
   - Remove indicator from DOM

SCALE BAR HTML STRUCTURE:
```html
<div class="export-scale-bar" style="...">
    <div class="scale-bar-segments" style="...">
        <!-- Alternating black/white segments -->
    </div>
    <div class="scale-bar-label">
        {distance} m
    </div>
</div>
```

SCALE BAR CSS (inline):
```css
position: absolute;
bottom: 20px;
left: 20px;
background: white;
padding: 10px 15px;
border: 2px solid #333;
border-radius: 4px;
font-family: Arial, sans-serif;
font-size: 14px;
font-weight: bold;
z-index: 9999;
box-shadow: 0 2px 5px rgba(0,0,0,0.3);
```

ERROR HANDLING:
- html2canvas fails: show error "Eksport feilet"
- Timeout after 30 seconds
- Restore UI even if export fails

EXPORT:
Export function:
- exportMapImage

CODE QUALITY:
- Async/await for clean flow
- Proper cleanup in finally block
- User feedback at each step
- Test with large maps (memory considerations)

Generate the complete export.js module now.
```

---

## PROMPT 10: Project Management with localStorage

**Copy this to Claude CLI:**

```
Create project save/load system using browser localStorage.

CONTEXT:
- Save complete project state (road, signs, markers, settings)
- Load projects and restore full state
- List all saved projects
- Design allows easy migration to backend later

TASK: Create js/project-manager.js as ES6 module

DEPENDENCIES:
import { getMap, getSelectedRoad } from './map-manager.js';
import { getWorkZone, workZoneState } from './work-zone.js';
import { getPlacedSigns, restoreSigns } from './sign-manager.js';
import { updateDistanceMarkers } from './distance-markers.js';

STATE:
const projectState = {
    currentProject: null,
    settings: {
        snapToRoad: true,
        showDistanceMarkers: true
    }
};

PROJECT SCHEMA:
{
    id: number (timestamp),
    name: string,
    created: ISO date string,
    modified: ISO date string,
    
    metadata: {
        preparer: string,
        company: string,
        contact: string,
        roadReference: string
    },
    
    mapState: {
        center: [lat, lon],
        zoom: number
    },
    
    selectedRoad: {
        id: string,
        reference: string,
        geometry: GeoJSON object
    },
    
    workZone: {
        start: [lat, lon] or null,
        end: [lat, lon] or null
    },
    
    signs: [
        {
            signId: string,
            position: [lat, lon],
            rotation: number
        }
    ],
    
    settings: {
        snapToRoad: boolean,
        showDistanceMarkers: boolean
    }
}

FUNCTIONS TO IMPLEMENT:

1. saveProject(projectName, metadata = {})
   - Get current state from all modules
   - Create project object (see schema)
   - Generate ID if new (Date.now())
   - Set modified timestamp
   - Validate required fields
   - Store in localStorage: `avplan_${projectId}`
   - Update projectState.currentProject
   - Show success message
   - Return project object

2. loadProject(projectId)
   - Get from localStorage: `avplan_${projectId}`
   - Parse JSON
   - Validate structure
   - Call clearCurrentProject()
   - Restore map view: map.setView()
   - Restore selected road
   - Restore work zone markers
   - Restore signs
   - Restore settings
   - Update distance markers
   - Set projectState.currentProject
   - Show success message

3. listProjects()
   - Iterate through localStorage keys
   - Filter keys starting with 'avplan_'
   - Parse each project
   - Extract: id, name, modified, metadata
   - Sort by modified date (newest first)
   - Return array of project summaries

4. deleteProject(projectId)
   - Remove from localStorage: `avplan_${projectId}`
   - If current project: clear it
   - Show success message
   - Refresh project list UI

5. duplicateProject(projectId)
   - Load project data
   - Create new project with same data
   - Change name to "{original} (kopi)"
   - Generate new ID
   - Save as new project
   - Return new project

6. clearCurrentProject()
   - Clear map (remove all layers)
   - Reset all state to initial
   - Set currentProject to null

7. exportProjectAsJSON(projectId)
   - Get project from localStorage
   - Create Blob with JSON
   - Download as file
   - For backup purposes

8. importProjectFromJSON(jsonFile)
   - Read file
   - Parse JSON
   - Validate structure
   - Generate new ID
   - Save to localStorage
   - Show success message

9. getCurrentProject()
   - Return projectState.currentProject

10. updateProjectMetadata(metadata)
    - Update current project metadata
    - Save project
    - Don't change modified timestamp

11. isStorageAvailable()
    - Check localStorage availability
    - Check storage quota
    - Warn if near limit (> 80% used)
    - Return boolean

UI INTEGRATION FUNCTIONS:

12. renderProjectList()
    - Get #projectList element
    - Call listProjects()
    - Generate HTML for each project:
      ```html
      <div class="project-item" data-id="{id}">
          <div class="project-name">{name}</div>
          <div class="project-meta">
              {roadReference}<br>
              <small>Endret: {date}</small>
          </div>
          <div class="project-actions">
              <button onclick="loadProject({id})">Åpne</button>
              <button onclick="duplicateProject({id})">Dupliser</button>
              <button onclick="deleteProject({id})">Slett</button>
          </div>
      </div>
      ```
    - If no projects: show "Ingen lagrede prosjekter"

13. showSaveProjectDialog()
    - Show modal/prompt for project name
    - Optional: show metadata form (preparer, company)
    - On submit: call saveProject()
    - On cancel: close dialog

AUTO-SAVE:
14. setupAutoSave()
    - Auto-save every 2 minutes if project loaded
    - Don't prompt for name (use existing)
    - Silent save with indicator
    - Can be disabled in settings

ERROR HANDLING:
- localStorage full: warn user, suggest deleting old projects
- Corrupted data: log error, skip that project
- Missing dependencies: validate before save

EXPORT:
Export all public functions

CODE QUALITY:
- Validate all data before saving
- Handle localStorage quota errors
- Clean error messages in Norwegian
- Preserve data integrity

Generate the complete project-manager.js module now.
```

---

## PROMPT 11: Main Application Controller

**Copy this to Claude CLI:**

```
Create the main application controller that initializes and coordinates all modules.

CONTEXT:
- Entry point for the application
- Initializes all modules in correct order
- Sets up global event listeners
- Handles tab switching
- Manages application state

TASK: Create js/app.js as ES6 module

DEPENDENCIES:
import { initializeMap, setupMapClickHandler } from './map-manager.js';
import { initAddressSearch } from './address-search.js';
import { initWorkZone, handleMapClick as workZoneClick } from './work-zone.js';
import { updateDistanceMarkers, toggleDistanceMarkers } from './distance-markers.js';
import { initSignManager } from './sign-manager.js';
import { exportMapImage } from './export.js';
import { saveProject, loadProject, renderProjectList, showSaveProjectDialog } from './project-manager.js';

APPLICATION STATE:
const appState = {
    initialized: false,
    currentTab: 'map'
};

FUNCTIONS TO IMPLEMENT:

1. async initializeApplication()
   - Show loading screen
   - Initialize map
   - Initialize address search
   - Initialize work zone system
   - Initialize sign manager
   - Setup all event listeners
   - Setup tab system
   - Load project list
   - Hide loading screen
   - Set initialized = true
   - Log "AV-Plan ready"

2. setupEventListeners()
   - Map click handler (delegates to work zone or road selection)
   - Search button
   - Work zone buttons (start, end, clear)
   - Setting toggles (snap, markers)
   - Export button
   - Save project button
   - New project button
   - Tab switching
   - Window resize (redraw map)

3. setupTabSystem()
   - Get all .tab elements
   - Add click listeners
   - On tab click:
     * Remove 'active' from all tabs
     * Add 'active' to clicked tab
     * Hide all .tab-content
     * Show matching content
     * If 'projects' tab: refresh project list

4. switchTab(tabName)
   - Programmatic tab switching
   - Update appState.currentTab
   - Trigger same logic as click

5. handleMapClick(event)
   - Check if work zone mode active
   - If yes: delegate to workZoneClick()
   - If no: delegate to road selection
   - Update UI accordingly

6. setupSettingToggles()
   - Snap toggle button:
     * Click: toggle snap on/off
     * Update button visual (green/red)
     * Store in settings
   - Marker toggle button:
     * Click: call toggleDistanceMarkers()
     * Update button visual
     * Store in settings

7. setupExportButton()
   - Get #exportBtn
   - Click: call exportMapImage()
   - Show progress indicator
   - Handle success/error

8. setupSaveButton()
   - Get #saveProjectBtn
   - Click: call showSaveProjectDialog()
   - On save: refresh project list if on projects tab

9. setupNewProjectButton()
   - Get #newProjectBtn
   - Click: confirm if unsaved changes
   - Clear all state
   - Start fresh project

10. showLoadingScreen()
    - Create overlay with logo/spinner
    - Message: "Laster AV-Plan..."
    - Block interaction

11. hideLoadingScreen()
    - Fade out and remove overlay

12. handleError(error, context)
    - Log error to console
    - Show user-friendly message
    - Context: where error occurred
    - Don't crash app

13. updateUIStatus()
    - Update road name in status bar
    - Update sign count
    - Update work zone status
    - Called after state changes

INITIALIZATION SEQUENCE:
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeApplication();
    } catch (error) {
        handleError(error, 'initialization');
    }
});
```

GLOBAL ERROR HANDLER:
```javascript
window.addEventListener('error', (event) => {
    handleError(event.error, 'global');
});

window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason, 'promise');
});
```

KEYBOARD SHORTCUTS:
14. setupKeyboardShortcuts()
    - Ctrl/Cmd + S: Save project
    - Ctrl/Cmd + E: Export
    - Ctrl/Cmd + N: New project
    - Escape: Cancel current mode
    - Tab: Switch between tabs

RESPONSIVE BEHAVIOR:
15. handleResize()
    - Debounce resize events
    - Invalidate map size: map.invalidateSize()
    - Adjust UI for mobile/desktop

EXPORT:
No exports needed (entry point)

CODE QUALITY:
- Graceful degradation if modules fail
- Clear initialization sequence
- Comprehensive error handling
- User feedback at every step

Generate the complete app.js module now.
```

---

## PROMPT 12: Placeholder Sign Generator

**Copy this to Claude CLI:**

```
Create placeholder SVG traffic signs until real ones are available.

CONTEXT:
- Need temporary signs for development and testing
- Generate Norwegian standard signs
- Save as SVG in proper directories

TASK: Create multiple SVG files

For each sign, create a simple, recognizable SVG.

SPEED LIMIT SIGNS (assets/signs/speed/):

File: 30.svg
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="white" stroke="red" stroke-width="4"/>
  <text x="50" y="70" text-anchor="middle" font-size="40" font-weight="bold" font-family="Arial" fill="black">30</text>
</svg>
```

Create similar for: 40, 50, 60, 70, 80, 90, 110

WARNING SIGNS (assets/signs/warning/):

File: 142.svg (Arbeid på vegen)
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <polygon points="50,5 95,90 5,90" fill="yellow" stroke="black" stroke-width="3"/>
  <text x="50" y="60" text-anchor="middle" font-size="45" font-family="Arial">⚠️</text>
</svg>
```

File: 204.svg (Farlig vegkant)
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <polygon points="50,5 95,90 5,90" fill="yellow" stroke="black" stroke-width="3"/>
  <text x="50" y="60" text-anchor="middle" font-size="35" font-family="Arial">⚡</text>
</svg>
```

File: 110.svg (Ukjent fare)
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <polygon points="50,5 95,90 5,90" fill="yellow" stroke="black" stroke-width="3"/>
  <text x="50" y="65" text-anchor="middle" font-size="50" font-weight="bold" font-family="Arial">!</text>
</svg>
```

PROHIBITION SIGNS (assets/signs/prohibition/):

File: 306.svg (Forbikjøring forbudt)
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="white" stroke="red" stroke-width="4"/>
  <line x1="20" y1="80" x2="80" y2="20" stroke="red" stroke-width="6"/>
  <path d="M 30 50 L 45 35 L 70 50" stroke="black" stroke-width="3" fill="none"/>
</svg>
```

File: 308.svg (Innkjøring forbudt)
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="white" stroke="red" stroke-width="4"/>
  <rect x="35" y="45" width="30" height="10" fill="red"/>
</svg>
```

Generate all SVG files with consistent styling:
- Clean, minimal design
- High contrast for visibility
- Proper viewBox for scaling
- Standard Norwegian sign colors

After generating, create a README in assets/signs/ explaining:
- These are placeholders
- Real signs should come from official source
- How to replace with official SVGs
```

---

## PROMPT 13: Testing & Validation Script

**Copy this to Claude CLI:**

```
Create a testing and validation script to verify the application works correctly.

CONTEXT:
- Manual testing checklist
- Automated validation where possible
- Tests NVDB API V4 connectivity
- Tests all core features

TASK: Create test/validation.html (standalone test page)

This HTML file should test all major features independently.

STRUCTURE:
<!DOCTYPE html>
<html>
<head>
    <title>AV-Plan Validation</title>
    <style>
        /* Clean test interface styling */
    </style>
</head>
<body>
    <h1>AV-Plan Validation Tests</h1>
    
    <div id="tests">
        <!-- Test results will appear here -->
    </div>
    
    <button id="runAllTests">Run All Tests</button>
    
    <script>
        // Test suite
    </script>
</body>
</html>

TESTS TO IMPLEMENT:

1. testNVDBAPIConnectivity()
   - Fetch: https://nvdbapiles.atlas.vegvesen.no/vegnett/api/v4/veg?lat=63.4305&lon=10.3951
   - Verify response is valid JSON
   - Verify veglenkesekvensid exists
   - Log: "✅ NVDB API V4 accessible" or "❌ NVDB API failed"

2. testGeonorgeAPI()
   - Fetch: https://ws.geonorge.no/adresser/v1/sok?fuzzy=true&adresser=Stavanger
   - Verify response contains addresses
   - Log result

3. testKartverketTiles()
   - Try to load one tile
   - Verify image loads
   - Log result

4. testLocalStorage()
   - Try to save test data
   - Try to read it back
   - Try to delete it
   - Verify all operations work
   - Check storage quota
   - Log result

5. testTurfJS()
   - Verify turf is loaded globally
   - Test turf.distance() function
   - Test turf.nearestPointOnLine()
   - Log result

6. testWellknown()
   - Verify wellknown is loaded
   - Test parsing WKT string
   - Log result

7. testHTML2Canvas()
   - Verify html2canvas is loaded
   - Try to capture a small div
   - Log result

8. testCORSHeaders()
   - Check if NVDB API returns proper CORS headers
   - Check Access-Control-Allow-Origin
   - Log result

9. testBrowserCompatibility()
   - Check ES6 support
   - Check Fetch API support
   - Check localStorage support
   - Check Canvas API support
   - Log browser info and capabilities

10. testResponsiveness()
    - Check viewport width
    - Log device type: mobile/tablet/desktop
    - Check touch support

VISUAL TEST RESULTS:
Display each test with:
- ✅ Green checkmark if passed
- ❌ Red X if failed
- ⚠️ Yellow warning if partial
- Execution time
- Error details if failed

AUTO-RUN ON LOAD:
Run all tests automatically when page loads.

EXPORT RESULTS:
Button to export test results as JSON for bug reports.

Generate the complete validation.html file now.
```

---

## PROMPT 14: Documentation & README

**Copy this to Claude CLI:**

```
Create comprehensive documentation for the AV-Plan project.

TASK 1: Update README.md with complete information

Structure:

# AV-Plan - Arbeidsvarslingsplan for norske veier

[Brief Norwegian description - 2-3 sentences]

## 🚀 Kom i gang

### Forutsetninger
- Moderne nettleser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Internettforbindelse
- Ingen installasjon nødvendig

### Bruk
1. Åpne [URL til app]
2. Søk etter vei eller adresse
3. Klikk på kartet for å velge vei
4. Sett start og slutt for arbeidssone
5. Dra skilt til kartet
6. Eksporter som bilde

## 📋 Funksjoner

### Kart og veivalg
- Norske topografiske kart fra Kartverket
- Søk etter adresse eller sted (Geonorge)
- Klikk på vei for å velge (NVDB API V4)
- Viser vegreferanse (f.eks. "Ev6 S78D1 m450")

[Continue with all features...]

## 🛠️ Teknisk dokumentasjon

### Arkitektur
- 100% frontend (ingen backend)
- Vanilla JavaScript (ES6 modules)
- No build process required

### API-er
- **NVDB API Les V4**: https://nvdbapiles.atlas.vegvesen.no
  - Road network data
  - Road references
  - No authentication required
- **Geonorge**: https://ws.geonorge.no/adresser/v1/sok
  - Address geocoding
- **Kartverket**: https://cache.kartverket.no/v1/wmts/
  - Topographic map tiles

### Biblioteker (CDN)
- Leaflet 1.9.4 - Map rendering
- Turf.js 6.x - Geospatial calculations
- html2canvas 1.4.1 - Screenshot export

### Datamodell
[Document the project data structure]

### Filstruktur
```
avplan/
├── index.html
├── css/
│   ├── main.css
│   └── components.css
├── js/
│   ├── app.js
│   ├── nvdb-api.js
│   ├── map-manager.js
│   ├── address-search.js
│   ├── work-zone.js
│   ├── distance-markers.js
│   ├── sign-manager.js
│   ├── export.js
│   └── project-manager.js
├── assets/signs/
└── data/sign-library.json
```

## 🚀 Deployment

### GitHub Pages
```bash
# Commands to deploy
```

### Netlify
[Instructions]

### Vercel
[Instructions]

## 🧪 Testing

Run validation tests: Open `test/validation.html` in browser

Manual testing checklist:
- [ ] Search for road works
- [ ] Place markers
- [ ] Add signs
- [ ] Export image
- [ ] Save project
- [ ] Load project

## 📝 Bidra

Pull requests are welcome!

1. Fork prosjektet
2. Lag en feature branch
3. Commit endringene dine
4. Push til branchen
5. Åpne en Pull Request

## 📄 Lisens

Data fra NVDB er tilgjengelig under NLOD (Norsk lisens for offentlige data).

## 👥 Kontakt

[Your contact information]

---

TASK 2: Create docs/USER_GUIDE.md (Norwegian user guide)

Structure:
- Introduksjon
- Komme i gang
- Søke etter vei
- Sette arbeidssone
- Plassere skilt
- Eksportere
- Lagre og laste prosjekter
- Feilsøking
- Tips og triks

TASK 3: Create docs/API_DOCUMENTATION.md

Document all functions in all modules:
- Module purpose
- Public functions
- Parameters
- Return values
- Usage examples

TASK 4: Create CONTRIBUTING.md

Guidelines for contributors:
- Code style
- Commit message format
- Pull request process
- Testing requirements

Generate all documentation files now.
```

---

## PROMPT 15: Deployment Package

**Copy this to Claude CLI:**

```
Create deployment configuration and scripts for various hosting platforms.

TASK 1: Create .github/workflows/deploy.yml (GitHub Actions)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
          exclude_assets: '.github,README.md,docs,test'
```

TASK 2: Create netlify.toml

```toml
[build]
  publish = "."
  
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

TASK 3: Create vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

TASK 4: Create deploy.sh (deployment script)

```bash
#!/bin/bash

echo "🚀 Deploying AV-Plan..."

# Validate files exist
if [ ! -f "index.html" ]; then
    echo "❌ index.html not found"
    exit 1
fi

# Run tests
echo "🧪 Running validation..."
# Open test page in browser for manual verification
open test/validation.html

# Git operations
git add .
git commit -m "Deploy: $(date +'%Y-%m-%d %H:%M')"
git push origin main

echo "✅ Deployed successfully!"
echo "📦 GitHub Pages: https://yourusername.github.io/avplan/"
```

TASK 5: Create PRE_DEPLOY_CHECKLIST.md

```markdown
# Pre-Deployment Checklist

## Code Quality
- [ ] All ESLint errors fixed
- [ ] No console.errors in production code
- [ ] All TODOs resolved or documented

## Testing
- [ ] Manual testing completed
- [ ] All validation tests pass
- [ ] Tested on Chrome, Firefox, Safari
- [ ] Tested on mobile devices
- [ ] NVDB API V4 calls verified

## Assets
- [ ] All SVG signs present
- [ ] sign-library.json populated
- [ ] Images optimized
- [ ] No broken links

## Configuration
- [ ] API URLs correct (production endpoints)
- [ ] No development/debugging code
- [ ] Error messages user-friendly
- [ ] Norwegian text correct

## Documentation
- [ ] README.md updated
- [ ] User guide complete
- [ ] API docs accurate
- [ ] CHANGELOG.md updated

## Performance
- [ ] Page load < 3 seconds
- [ ] Map renders smoothly
- [ ] Export completes < 5 seconds
- [ ] No memory leaks

## Security
- [ ] No API keys in code
- [ ] localStorage data validated
- [ ] XSS protection in place
- [ ] External links validated

## Legal
- [ ] NVDB attribution present
- [ ] Kartverket attribution present
- [ ] License file included

Ready to deploy? ✅
```

Generate all deployment files now.
```

---

## ✅ Final Execution Sequence

Here's the exact order to run these prompts in Claude CLI:

```bash
# Navigate to project directory
cd avplan

# Run prompts in this exact order:
claude prompt-1   # Foundation
claude prompt-2   # CSS
claude prompt-3   # NVDB API
claude prompt-4   # Map Manager
claude prompt-5   # Address Search
claude prompt-6   # Work Zone
claude prompt-7   # Distance Markers
claude prompt-8   # Sign Manager
claude prompt-9   # Export System
claude prompt-10  # Project Manager
claude prompt-11  # App Controller
claude prompt-12  # Placeholder Signs
claude prompt-13  # Testing
claude prompt-14  # Documentation
claude prompt-15  # Deployment

# Test the application
open index.html

# Run validation tests
open test/validation.html

<!-- # Deploy
./deploy.sh -->
```

---

## 📊