/**
 * Map Manager Module
 * Handles Leaflet map initialization, road selection, and display
 * @module map-manager
 */

import { findNearestRoad, getRoadDetails, formatRoadReference, parseWKTToGeoJSON } from './nvdb-api.js';

// Global map state
export const mapState = {
    map: null,
    selectedRoad: null,
    roadLayer: null,
    startMarker: null,
    endMarker: null,
    distanceMarkerLayer: null,
    mode: null, // 'setStart', 'setEnd', or null
    clickHandler: null
};

/**
 * Initialize Leaflet map
 * @returns {L.Map} Leaflet map instance
 */
export function initializeMap() {
    console.log('Initializing map...');

    // Create map
    const map = L.map('map', {
        center: [63.4305, 10.3951], // Trondheim, Norway
        zoom: 5,
        minZoom: 4,
        maxZoom: 19
    });

    // Add Kartverket tile layer
    L.tileLayer('https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png', {
        attribution: '© <a href="https://www.kartverket.no">Kartverket</a>',
        maxZoom: 19
    }).addTo(map);

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

        // If in work zone mode, this will be handled by work-zone.js
        if (mapState.mode === 'setStart' || mapState.mode === 'setEnd') {
            // Delegate to work zone handler (called from work-zone.js)
            if (mapState.clickHandler) {
                mapState.clickHandler(e.latlng);
            }
            return;
        }

        // Otherwise, select road at clicked location
        await selectRoadAtPoint(lat, lng);
    });

    console.log('Map click handler setup');
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

    // Find nearest road
    const roadData = await findNearestRoad(lat, lng, 50);

    if (!roadData) {
        alert('Ingen vei funnet her. Prøv å klikke nærmere en vei.');
        updateStatus('Ingen vei funnet');
        return;
    }

    // Get full road details
    const details = await getRoadDetails(roadData.veglenkesekvensid);

    if (!details) {
        alert('Kunne ikke hente veidata. Prøv igjen.');
        updateStatus('Feil ved henting av veidata');
        return;
    }

    // Parse geometry
    let geojson = null;
    if (details.geometri && details.geometri.wkt) {
        geojson = parseWKTToGeoJSON(details.geometri.wkt);
    }

    if (!geojson) {
        console.error('Could not parse road geometry');
        alert('Kunne ikke vise vei på kartet');
        return;
    }

    // Display road
    displayRoad(details, geojson);

    // Store selected road
    mapState.selectedRoad = {
        ...details,
        geojson: geojson
    };

    // Update UI
    const reference = formatRoadReference(details.vegsystemreferanse);
    document.getElementById('roadReference').textContent = reference;

    const kommune = details.kommune ? details.kommune[0]?.navn : 'Ukjent';
    document.getElementById('roadDetails').textContent = `Kommune: ${kommune}`;

    updateStatus(`Vei valgt: ${reference}`);
}

/**
 * Display road on map
 * @param {Object} roadData - Road data from NVDB
 * @param {Object} geojson - GeoJSON geometry
 */
export function displayRoad(roadData, geojson) {
    // Remove previous road layer
    if (mapState.roadLayer) {
        mapState.map.removeLayer(mapState.roadLayer);
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

    // Zoom to road
    mapState.map.fitBounds(roadLayer.getBounds(), {
        padding: [50, 50]
    });

    // Show road info popup
    showRoadInfoPopup(roadData, roadLayer);

    console.log('Road displayed on map');
}

/**
 * Show road information popup
 * @param {Object} roadData - Road data
 * @param {L.Layer} layer - Leaflet layer
 */
export function showRoadInfoPopup(roadData, layer) {
    const reference = formatRoadReference(roadData.vegsystemreferanse);
    const kategori = roadData.vegsystemreferanse?.vegsystem?.vegkategori || 'Ukjent';
    const kommune = roadData.kommune ? roadData.kommune[0]?.navn : 'Ukjent';

    // Calculate length if geometry available
    let lengthText = '';
    if (roadData.geometri) {
        lengthText = `<br><small>Geometri tilgjengelig</small>`;
    }

    const popupContent = `
        <div style="padding: 5px;">
            <strong style="font-size: 16px;">${reference}</strong><br>
            <small>Kategori: ${kategori}</small><br>
            <small>Kommune: ${kommune}</small>
            ${lengthText}
        </div>
    `;

    // Get center of layer bounds
    const center = layer.getBounds().getCenter();

    L.popup()
        .setLatLng(center)
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
    selectRoadAtPoint,
    displayRoad,
    clearSelectedRoad,
    getMap,
    getSelectedRoad,
    mapState
};
