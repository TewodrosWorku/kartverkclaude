# Changelog

All notable changes to AV-Plan will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2025-01-XX

### Fixed
- **CRITICAL FIX**: NVDB API kartutsnitt parameter format and endpoints corrected
  - Fixed kartutsnitt from WKT POLYGON format to simple bounding box: `minLon,minLat,maxLon,maxLat`
  - Changed srid from `'wgs84'` to `'4326'` (EPSG code)
  - Fixed search endpoint to `/api/v4/veglenkesekvenser/segmentert` (added `/api/v4/` prefix)
  - Fixed details endpoint to `/api/v4/veglenkesekvenser/{id}` (restored `/api/v4/` prefix)
  - Road selection now works completely with correct API format

## [1.0.3] - 2025-01-XX

### Fixed
- **Partial fix**: Road details endpoint (later reverted in v1.0.4)
  - This version had incorrect endpoint format
  - See v1.0.4 for correct fix

## [1.0.2] - 2025-01-XX

### Fixed
- **FIX**: Sign control buttons (rotate and remove) now work correctly
  - Replaced inline onclick handlers with proper event listeners
  - Changed from string HTML to DOM element creation
  - Rotation now uses CSS transform (works with all browsers)
  - Remove button closes popup before deleting sign

## [1.0.1] - 2025-01-XX

### Fixed
- **CRITICAL FIX**: NVDB API V4 road selection now works correctly
  - Changed from invalid `/vegnett/api/v4/veg` endpoint to `/vegnett/veglenkesekvenser/segmentert`
  - Changed from point-based search to bounding box (kartutsnitt) search
  - Added Turf.js distance calculation to find closest road
- **FIX**: Geonorge address search now works correctly
  - Changed parameter from `adresser` to `sok`
  - Address autocomplete now displays correctly

### Changed
- Updated validation tests to use correct API endpoints
- Updated documentation to reflect correct API usage

## [1.0.0] - 2025-01-XX

### Added
- Initial release of AV-Plan
- NVDB API V4 integration for Norwegian road data
- Leaflet map integration with Kartverket tiles
- Geonorge address search
- Work zone markers (start/end) with road snapping
- Automatic distance markers every 20m and 50m
- Traffic sign library and drag-and-drop placement
- Export to PNG with automatic scale bar
- Project save/load using localStorage
- Responsive design for mobile and desktop
- Norwegian language UI
- Comprehensive user guide and API documentation
- Validation test suite

### Features
- **Map Integration**
  - Kartverket topographic maps
  - Click to select roads from NVDB
  - Address search with autocomplete
  - Zoom and pan controls

- **Work Zone Management**
  - Set start and end markers
  - Optional road snapping
  - Draggable markers
  - Automatic distance markers
  - 400m range in each direction

- **Traffic Signs**
  - Speed limit signs (30-110 km/t)
  - Warning signs (work, danger, edge)
  - Prohibition signs (overtaking, no entry)
  - Drag-and-drop placement
  - Rotation in 90° increments
  - Delete and move functionality

- **Export System**
  - High-quality PNG export (2x resolution)
  - Automatic scale bar generation
  - Clean output (no UI elements)
  - Downloadable file

- **Project Management**
  - Save projects to browser storage
  - Load and resume projects
  - Duplicate projects
  - Delete projects
  - Auto-save capability

### Technical
- 100% frontend (no backend required)
- Vanilla JavaScript (ES6 modules)
- No build process needed
- CDN-based dependencies
- localStorage for persistence

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Data Sources
- NVDB API Les V4 (Statens vegvesen)
- Kartverket WMTS
- Geonorge address API

---

## [Unreleased]

### Planned
- Print-optimized view
- Additional sign types
- Custom sign upload
- Project export/import as JSON
- Multi-language support
- Offline mode
- PDF export

---

## Release Notes

### Version 1.0.0
Initial public release of AV-Plan. This version provides all core functionality for creating arbeidsvarslingsplaner for Norwegian roads.

**Key Features:**
- Road selection from NVDB
- Work zone definition
- Distance markers
- Traffic sign placement
- Export to PNG
- Project management

**Known Limitations:**
- No backend (all data stored locally)
- Limited sign library
- No collaboration features
- No undo/redo

**Migration Notes:**
N/A (initial release)

---

For detailed changes, see the [commit history](https://github.com/yourusername/avplan/commits/).
