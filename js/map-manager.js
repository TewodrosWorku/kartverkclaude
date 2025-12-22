/**
 * Map Manager Module
 * Handles Leaflet map initialization, road selection, and display
 * @module map-manager
 */

import { findNearestRoad, getRoadDetails, getSpeedLimit, getADT, formatRoadReference, getRoadInfo, parseWKTToGeoJSON } from './nvdb-api.js';
import { TILE_SERVER_URL, MAP_CONFIG } from './config.js';

// Global map state
export const mapState = {
    map: null,
    selectedRoad: null,
    roadLayer: null,
    startMarker: null,
    endMarker: null,
    distanceMarkerLayer: null,
    distanceLabels: [], // Array of distance label markers
    mode: null, // 'setStart', 'setEnd', or null
    clickHandler: null
};

/**
 * Initialize Leaflet map
 * @returns {L.Map} Leaflet map instance
 */
export function initializeMap() {
    console.log('Initializing map...');

    // Create map with editable support
    const map = L.map('map', {
        center: [63.4305, 10.3951], // Trondheim, Norway
        zoom: 5,
        minZoom: 4,
        maxZoom: 21,  // Increased for better detail when placing signs/polygons
        editable: true
    });

    // Add Kartverket tile layer (configured in config.js)
    // IMPORTANT: Use tile proxy server for export functionality to work
    L.tileLayer(TILE_SERVER_URL, {
        attribution: MAP_CONFIG.attribution,
        maxZoom: 21,  // Increased for better detail
        maxNativeZoom: 18,  // Tiles only go to zoom 18, but allow upscaling
        crossOrigin: 'anonymous'  // Enable CORS when using proxy server
    }).addTo(map);

    // Verify editTools are available
    if (map.editTools) {
        console.log('✓ Leaflet.Editable initialized successfully');
    } else {
        console.error('✗ Leaflet.Editable not initialized - polygon editing will not work');
    }

    // Store map instance
    mapState.map = map;

    console.log('Map initialized successfully');
    return map;
}

/**
 * Setup map click handler
 */
export function setupMapClickHandler() {
    if (!mapState.map) {
        console.error('Map not initialized');
        return;
    }

    mapState.map.on('click', async (e) => {
        const { lat, lng } = e.latlng;

        // If in a specific mode, delegate to the mode's handler
        if (mapState.mode && mapState.clickHandler) {
            mapState.clickHandler(e.latlng);
            return;
        }

        // If no mode is active, do nothing (user must click "Velg vei" button)
        console.log('Click on map - no active mode');
    });

    console.log('Map click handler setup');
}

/**
 * Activate road selection mode
 */
export function activateRoadSelectionMode() {
    mapState.mode = 'selectRoad';
    mapState.clickHandler = handleRoadSelectionClick;

    // Update UI
    const selectRoadBtn = document.getElementById('selectRoadBtn');
    if (selectRoadBtn) {
        selectRoadBtn.classList.add('btn-success');
        selectRoadBtn.textContent = 'Klikk på vei...';
    }

    // Update status
    updateStatus('Klikk på kartet for å velge vei');

    console.log('Road selection mode activated');
}

/**
 * Handle road selection click
 * @param {L.LatLng} latlng - Clicked position
 */
async function handleRoadSelectionClick(latlng) {
    await selectRoadAtPoint(latlng.lat, latlng.lng);
    deactivateRoadSelectionMode();
}

/**
 * Deactivate road selection mode
 */
export function deactivateRoadSelectionMode() {
    mapState.mode = null;
    mapState.clickHandler = null;

    // Reset button state
    const selectRoadBtn = document.getElementById('selectRoadBtn');
    if (selectRoadBtn) {
        selectRoadBtn.classList.remove('btn-success');
        selectRoadBtn.textContent = 'Velg vei';
    }

    updateStatus('Klar');
}

/**
 * Select road at a point
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
export async function selectRoadAtPoint(lat, lng) {
    console.log(`Selecting road at [${lat}, ${lng}]`);

    // Update status
    updateStatus('Søker etter vei...');

    // Find nearest road (this gives us vegsystemreferanse and kommune)
    const roadData = await findNearestRoad(lat, lng, 50);

    if (!roadData) {
        alert('Ingen vei funnet her. Prøv å klikke nærmere en vei.');
        updateStatus('Ingen vei funnet');
        return;
    }

    // Get full road details (this gives us veglenker with geometry)
    const details = await getRoadDetails(roadData.veglenkesekvensid);

    if (!details) {
        alert('Kunne ikke hente veidata. Prøv igjen.');
        updateStatus('Feil ved henting av veidata');
        return;
    }

    // Merge the data: preserve vegsystemreferanse and kommune from posisjon call
    details.vegsystemreferanse = roadData.vegsystemreferanse;
    details.kommune = roadData.kommune;

    // Parse the sequence geometry
    // The API returns veglenker array, each with its own geometri
    let geojson = null;

    if (details.veglenker && Array.isArray(details.veglenker)) {
        console.log(`Processing ${details.veglenker.length} veglenker`);

        // Sort veglenker by startposisjon to ensure correct order
        const sortedVeglenker = [...details.veglenker].sort((a, b) => a.startposisjon - b.startposisjon);

        const geometries = [];
        for (const veglenke of sortedVeglenker) {
            if (veglenke.geometri && veglenke.geometri.wkt) {
                const srid = veglenke.geometri.srid || 5973;
                const geom = parseWKTToGeoJSON(veglenke.geometri.wkt, srid);
                if (geom) {
                    geometries.push(geom);
                }
            }
        }

        if (geometries.length === 1) {
            // Single geometry
            geojson = geometries[0];
        } else if (geometries.length > 1) {
            // Multiple geometries - combine into FeatureCollection
            geojson = {
                type: 'FeatureCollection',
                features: geometries.map(geom => ({
                    type: 'Feature',
                    geometry: geom,
                    properties: {}
                }))
            };
        }
    }

    if (!geojson) {
        console.error('Could not parse road geometry');
        alert('Kunne ikke vise vei på kartet');
        return;
    }

    console.log(`Displaying single road sequence: ${details.lengde || 0}m`);

    // Display road and show popup at click location
    displayRoad(details, geojson, lat, lng);

    // Store selected road
    mapState.selectedRoad = {
        ...details,
        geojson: geojson
    };

    // Update UI with detailed road information
    const reference = formatRoadReference(details.vegsystemreferanse);
    const roadInfo = getRoadInfo(details.vegsystemreferanse);

    console.log('Updating sidebar with road reference:', reference);
    console.log('Road info:', roadInfo);

    // Display main reference (kortform)
    const roadRefElement = document.getElementById('roadReference');
    if (roadRefElement) {
        roadRefElement.textContent = reference;
        console.log('✓ Sidebar roadReference updated');
    } else {
        console.error('✗ roadReference element not found');
    }

    // Display detailed information including sequence length
    let detailsHtml = '';
    if (roadInfo) {
        detailsHtml += `<strong>Kategori:</strong> ${roadInfo.kategoriNavn}<br>`;
        if (details.kommune) {
            detailsHtml += `<strong>Kommune:</strong> ${details.kommune}<br>`;
        }
        if (details.lengde) {
            detailsHtml += `<strong>Lengde:</strong> ${Math.round(details.lengde)}m<br>`;
        }
        detailsHtml += `<strong>ID:</strong> ${details.veglenkesekvensid}<br>`;
        if (roadInfo.trafikantgruppe) {
            const trafikantMap = {
                'K': 'Kjørende',
                'G': 'Gående og syklende'
            };
            detailsHtml += `<strong>Trafikantgruppe:</strong> ${trafikantMap[roadInfo.trafikantgruppe] || roadInfo.trafikantgruppe}<br>`;
        }
        if (roadInfo.retning) {
            detailsHtml += `<strong>Retning:</strong> ${roadInfo.retning}<br>`;
        }

        // Add placeholder for speed limit and ÅDT (will be fetched asynchronously)
        detailsHtml += `<strong>Fartsgrense:</strong> <span id="speedLimit">Henter...</span><br>`;
        detailsHtml += `<strong>ÅDT:</strong> <span id="adt">Henter...</span>`;
    } else if (details.kommune) {
        detailsHtml = `<strong>Kommune:</strong> ${details.kommune}`;
    }

    const roadDetailsElement = document.getElementById('roadDetails');
    if (roadDetailsElement) {
        roadDetailsElement.innerHTML = detailsHtml;
        console.log('✓ Sidebar roadDetails updated');
    } else {
        console.error('✗ roadDetails element not found');
    }

    // Fetch speed limit and ÅDT asynchronously
    fetchAdditionalRoadData(details.veglenkesekvensid);

    updateStatus(`Vei valgt: ${reference}`);
}

/**
 * Fetch additional road data (speed limit, ÅDT) asynchronously
 * @param {string} veglenkesekvensid - Road link sequence ID
 */
async function fetchAdditionalRoadData(veglenkesekvensid) {
    // Fetch speed limit
    const speedLimit = await getSpeedLimit(veglenkesekvensid);
    const speedLimitElement = document.getElementById('speedLimit');
    if (speedLimitElement) {
        if (speedLimit) {
            speedLimitElement.textContent = `${speedLimit} km/h`;
        } else {
            speedLimitElement.textContent = 'Ikke tilgjengelig';
            speedLimitElement.style.fontStyle = 'italic';
            speedLimitElement.style.color = '#999';
        }
    }

    // Fetch ÅDT
    const adt = await getADT(veglenkesekvensid);
    const adtElement = document.getElementById('adt');
    if (adtElement) {
        if (adt) {
            // Format with thousands separator
            adtElement.textContent = adt.toLocaleString('no-NO');
        } else {
            adtElement.textContent = 'Ikke tilgjengelig';
            adtElement.style.fontStyle = 'italic';
            adtElement.style.color = '#999';
        }
    }
}

/**
 * Display road on map
 * @param {Object} roadData - Road data from NVDB
 * @param {Object} geojson - GeoJSON geometry
 * @param {number} clickLat - Latitude of click location (optional)
 * @param {number} clickLng - Longitude of click location (optional)
 */
export function displayRoad(roadData, geojson, clickLat = null, clickLng = null) {
    // Remove previous road layer
    if (mapState.roadLayer) {
        mapState.map.removeLayer(mapState.roadLayer);
    }

    // Remove previous distance labels
    if (mapState.distanceLabels && mapState.distanceLabels.length > 0) {
        mapState.distanceLabels.forEach(marker => {
            mapState.map.removeLayer(marker);
        });
        mapState.distanceLabels = [];
    }

    // Create GeoJSON layer
    const roadLayer = L.geoJSON(geojson, {
        style: {
            color: '#0066cc',
            weight: 6,
            opacity: 0.7
        }
    });

    // Add to map
    roadLayer.addTo(mapState.map);
    mapState.roadLayer = roadLayer;

    // Add distance labels to the road line
    addDistanceLabelsToRoad(roadData, geojson);

    // Zoom to road
    mapState.map.fitBounds(roadLayer.getBounds(), {
        padding: [50, 50]
    });

    // Show road info popup at click location (or center if no click provided)
    if (clickLat !== null && clickLng !== null) {
        showRoadInfoPopup(roadData, roadLayer, clickLat, clickLng);
    } else {
        // Use center of road bounds if no click location provided
        const center = roadLayer.getBounds().getCenter();
        showRoadInfoPopup(roadData, roadLayer, center.lat, center.lng);
    }

    console.log('Road displayed on map');
}

/**
 * Add distance labels along the road at 25m intervals
 * @param {Object} roadData - Road data from NVDB
 * @param {Object} geojson - GeoJSON geometry
 */
function addDistanceLabelsToRoad(roadData, geojson) {
    // Get the sequence length
    const totalLength = roadData.lengde || 0;

    if (totalLength === 0) {
        console.log('No road length available for labels');
        return;
    }

    console.log(`Adding distance labels for sequence of ${Math.round(totalLength)}m`);

    // Create a line from the geojson for label placement
    let roadLine;
    try {
        if (geojson.type === 'LineString') {
            roadLine = turf.lineString(geojson.coordinates);
        } else if (geojson.type === 'MultiLineString') {
            // Flatten multi-linestring to single line
            const allCoords = geojson.coordinates.flat();
            roadLine = turf.lineString(allCoords);
        } else if (geojson.type === 'FeatureCollection') {
            // Combine all features into one line
            const allCoords = [];
            geojson.features.forEach(feature => {
                if (feature.geometry.type === 'LineString') {
                    allCoords.push(...feature.geometry.coordinates);
                }
            });
            if (allCoords.length > 0) {
                roadLine = turf.lineString(allCoords);
            } else {
                console.log('No coordinates in FeatureCollection');
                return;
            }
        } else {
            console.log('Unsupported geometry type for labels');
            return;
        }

        // Calculate actual line length using turf
        const lineLength = turf.length(roadLine, { units: 'meters' });
        console.log(`Line geometry length: ${Math.round(lineLength)}m`);

        // Place labels every 25m
        for (let distance = 0; distance <= totalLength; distance += 25) {
            // Skip if distance exceeds line length
            if (distance > lineLength) {
                break;
            }

            // Get point at this distance along the line
            const point = turf.along(roadLine, distance / 1000, { units: 'kilometers' });

            if (point && point.geometry && point.geometry.coordinates) {
                const [lng, lat] = point.geometry.coordinates;

                // Create a divIcon with the distance label
                const label = L.divIcon({
                    className: 'distance-label',
                    html: `<div style="
                        background: white;
                        border: 2px solid #0066cc;
                        border-radius: 4px;
                        padding: 2px 6px;
                        font-size: 11px;
                        font-weight: bold;
                        color: #0066cc;
                        white-space: nowrap;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    ">${distance}m</div>`,
                    iconSize: [40, 20],
                    iconAnchor: [20, 10]
                });

                // Add marker with label to map
                const marker = L.marker([lat, lng], { icon: label });
                marker.addTo(mapState.map);

                // Store marker reference for cleanup (add to roadLayer)
                if (!mapState.distanceLabels) {
                    mapState.distanceLabels = [];
                }
                mapState.distanceLabels.push(marker);
            }
        }

        console.log(`Placed ${mapState.distanceLabels ? mapState.distanceLabels.length : 0} distance labels`);

    } catch (error) {
        console.error('Error adding distance labels:', error);
    }
}

/**
 * Show road information popup
 * @param {Object} roadData - Road data
 * @param {L.Layer} layer - Leaflet layer
 * @param {number} clickLat - Latitude of click location
 * @param {number} clickLng - Longitude of click location
 */
export function showRoadInfoPopup(roadData, layer, clickLat, clickLng) {
    const roadInfo = getRoadInfo(roadData.vegsystemreferanse);

    if (!roadInfo) {
        return;
    }

    const sequenceLength = roadData.lengde || 0;

    // Build popup content with detailed information
    const popupContent = `
        <div style="padding: 8px; min-width: 200px;">
            <strong style="font-size: 16px; color: #0066cc;">${roadInfo.kortform}</strong><br>
            <div style="margin-top: 8px; font-size: 13px;">
                <strong>Kategori:</strong> ${roadInfo.kategoriNavn}<br>
                ${roadData.kommune ? `<strong>Kommune:</strong> ${roadData.kommune}<br>` : ''}
                ${roadInfo.trafikantgruppe === 'K' ? '<strong>Type:</strong> Kjørende<br>' : ''}
                ${roadInfo.trafikantgruppe === 'G' ? '<strong>Type:</strong> Gående og syklende<br>' : ''}
                ${sequenceLength > 0 ? `<strong>Sekvens lengde:</strong> ${Math.round(sequenceLength)} m<br>` : ''}
                <strong>ID:</strong> ${roadData.veglenkesekvensid}<br>
                ${roadInfo.retning ? `<strong>Retning:</strong> ${roadInfo.retning}` : ''}
            </div>
        </div>
    `;

    // Show popup at click location
    L.popup({
        maxWidth: 300,
        closeButton: true
    })
        .setLatLng([clickLat, clickLng])
        .setContent(popupContent)
        .openOn(mapState.map);
}

/**
 * Clear selected road
 */
export function clearSelectedRoad() {
    if (mapState.roadLayer) {
        mapState.map.removeLayer(mapState.roadLayer);
        mapState.roadLayer = null;
    }

    mapState.selectedRoad = null;

    // Update UI
    document.getElementById('roadReference').textContent = 'Ingen vei valgt';
    document.getElementById('roadDetails').textContent = '';

    updateStatus('Vei fjernet');
}

/**
 * Toggle road layer visibility
 * @param {boolean} visible - Whether to show or hide the road layer
 */
export function toggleRoadLayer(visible) {
    if (!mapState.roadLayer) {
        console.log('No road layer to toggle');
        return;
    }

    if (visible) {
        // Show the road layer
        if (!mapState.map.hasLayer(mapState.roadLayer)) {
            mapState.roadLayer.addTo(mapState.map);
            console.log('Road layer shown');
        }
        // Show distance labels
        if (mapState.distanceLabels && mapState.distanceLabels.length > 0) {
            mapState.distanceLabels.forEach(marker => {
                if (!mapState.map.hasLayer(marker)) {
                    marker.addTo(mapState.map);
                }
            });
        }
    } else {
        // Hide the road layer
        if (mapState.map.hasLayer(mapState.roadLayer)) {
            mapState.map.removeLayer(mapState.roadLayer);
            console.log('Road layer hidden');
        }
        // Hide distance labels
        if (mapState.distanceLabels && mapState.distanceLabels.length > 0) {
            mapState.distanceLabels.forEach(marker => {
                if (mapState.map.hasLayer(marker)) {
                    mapState.map.removeLayer(marker);
                }
            });
        }
    }
}

/**
 * Get map instance
 * @returns {L.Map} Map instance
 */
export function getMap() {
    return mapState.map;
}

/**
 * Get selected road
 * @returns {Object|null} Selected road data
 */
export function getSelectedRoad() {
    return mapState.selectedRoad;
}

/**
 * Update status bar
 * @param {string} message - Status message
 */
function updateStatus(message) {
    const statusText = document.getElementById('statusText');
    if (statusText) {
        statusText.textContent = message;
    }
}

// Export all public functions
export default {
    initializeMap,
    setupMapClickHandler,
    activateRoadSelectionMode,
    deactivateRoadSelectionMode,
    selectRoadAtPoint,
    displayRoad,
    clearSelectedRoad,
    toggleRoadLayer,
    getMap,
    getSelectedRoad,
    mapState
};
