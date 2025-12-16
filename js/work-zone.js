/**
 * Work Zone Module
 * Handles start and end markers for work zone with optional road snapping
 * @module work-zone
 */

import { getMap, getSelectedRoad, mapState as mapManagerState } from './map-manager.js';

// Work zone state
export const workZoneState = {
    startMarker: null,
    endMarker: null,
    snapEnabled: true,
    mode: null // 'setStart', 'setEnd', or null
};

// Reference to distance marker update function (will be set by app.js)
let updateDistanceMarkersCallback = null;

/**
 * Set callback for updating distance markers
 * @param {Function} callback - Function to call when markers change
 */
export function setDistanceMarkersCallback(callback) {
    updateDistanceMarkersCallback = callback;
}

/**
 * Calculate distance along sequence for a point
 * @param {L.LatLng} latlng - Point to calculate distance for
 * @returns {number|null} Distance in meters along sequence, or null if error
 */
export function calculateDistanceAlongSequence(latlng) {
    const road = getSelectedRoad();

    if (!road || !road.geojson) {
        return null;
    }

    try {
        // Convert latlng to turf point
        const point = turf.point([latlng.lng, latlng.lat]);

        // Convert road geometry to turf format
        let line;
        if (road.geojson.type === 'LineString') {
            line = turf.lineString(road.geojson.coordinates);
        } else if (road.geojson.type === 'MultiLineString') {
            // Flatten to single line
            const allCoords = road.geojson.coordinates.flat();
            line = turf.lineString(allCoords);
        } else if (road.geojson.type === 'FeatureCollection') {
            // Combine all features into one line
            const allCoords = [];
            road.geojson.features.forEach(feature => {
                if (feature.geometry.type === 'LineString') {
                    allCoords.push(...feature.geometry.coordinates);
                }
            });
            if (allCoords.length > 0) {
                line = turf.lineString(allCoords);
            } else {
                return null;
            }
        } else {
            return null;
        }

        // Find nearest point on line
        const snapped = turf.nearestPointOnLine(line, point);

        if (snapped && snapped.properties && snapped.properties.location !== undefined) {
            // location is in kilometers, convert to meters
            return Math.round(snapped.properties.location * 1000);
        }

        return null;

    } catch (error) {
        console.error('Error calculating distance along sequence:', error);
        return null;
    }
}

/**
 * Snap a point to the selected road
 * @param {L.LatLng} latlng - Point to snap
 * @returns {L.LatLng} Snapped point or original if no road selected
 */
export function snapToRoad(latlng) {
    const road = getSelectedRoad();

    if (!road || !road.geojson || !workZoneState.snapEnabled) {
        return latlng;
    }

    try {
        // Convert latlng to turf point
        const point = turf.point([latlng.lng, latlng.lat]);

        // Convert road geometry to turf format
        let line;
        if (road.geojson.type === 'LineString') {
            line = turf.lineString(road.geojson.coordinates);
        } else if (road.geojson.type === 'MultiLineString') {
            // Flatten to single line
            const allCoords = road.geojson.coordinates.flat();
            line = turf.lineString(allCoords);
        } else if (road.geojson.type === 'FeatureCollection') {
            // Combine all features into one line
            const allCoords = [];
            road.geojson.features.forEach(feature => {
                if (feature.geometry.type === 'LineString') {
                    allCoords.push(...feature.geometry.coordinates);
                }
            });
            if (allCoords.length > 0) {
                line = turf.lineString(allCoords);
            } else {
                console.log('Cannot snap to FeatureCollection - no coordinates');
                return latlng;
            }
        } else {
            console.log('Cannot snap to this geometry type');
            return latlng;
        }

        // Find nearest point on line
        const snapped = turf.nearestPointOnLine(line, point);

        if (snapped && snapped.geometry && snapped.geometry.coordinates) {
            return L.latLng(snapped.geometry.coordinates[1], snapped.geometry.coordinates[0]);
        }

        return latlng;

    } catch (error) {
        console.error('Error snapping to road:', error);
        return latlng;
    }
}

/**
 * Create custom marker icon
 * @param {string} color - Color for the marker
 * @returns {L.DivIcon} Leaflet div icon
 */
function createMarkerIcon(color) {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            width: 20px;
            height: 20px;
            background-color: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

/**
 * Place start marker
 * @param {L.LatLng} latlng - Position for marker
 */
export function placeStartMarker(latlng) {
    // Snap to road if enabled
    const snappedLatLng = snapToRoad(latlng);

    // Calculate distance along sequence
    const distanceAlongSeq = calculateDistanceAlongSequence(snappedLatLng);
    const road = getSelectedRoad();

    // Remove existing start marker
    if (workZoneState.startMarker) {
        getMap().removeLayer(workZoneState.startMarker);
    }

    // Create marker
    const marker = L.marker(snappedLatLng, {
        icon: createMarkerIcon('#28a745'), // Green
        draggable: true,
        title: 'Start arbeidssone'
    });

    // Store distance info on marker
    marker.distanceAlongSeq = distanceAlongSeq;
    marker.sequenceId = road ? road.veglenkesekvensid : null;

    // Add drag end listener
    marker.on('dragend', () => {
        const newPos = marker.getLatLng();
        const snappedPos = snapToRoad(newPos);
        marker.setLatLng(snappedPos);

        // Recalculate distance
        marker.distanceAlongSeq = calculateDistanceAlongSequence(snappedPos);

        // Update tooltip
        updateMarkerTooltip(marker, 'START');

        // Update distance markers
        if (updateDistanceMarkersCallback) {
            updateDistanceMarkersCallback();
        }

        updateZoneStatus();
    });

    // Bind tooltip with distance info
    updateMarkerTooltip(marker, 'START');

    // Add to map
    marker.addTo(getMap());
    workZoneState.startMarker = marker;

    // Update distance markers
    if (updateDistanceMarkersCallback) {
        updateDistanceMarkersCallback();
    }

    updateZoneStatus();
    console.log('Start marker placed');
}

/**
 * Update marker tooltip with distance information
 * @param {L.Marker} marker - Marker to update
 * @param {string} type - 'START' or 'SLUTT'
 */
function updateMarkerTooltip(marker, type) {
    const distanceAlongSeq = marker.distanceAlongSeq;
    const sequenceId = marker.sequenceId;
    const road = getSelectedRoad();
    const totalLength = road ? road.lengde : null;

    let tooltipText = type === 'START' ? 'START arbeidssone' : 'SLUTT arbeidssone';

    if (distanceAlongSeq !== null && distanceAlongSeq !== undefined) {
        tooltipText += `<br><strong>${distanceAlongSeq}m</strong> inn i sekvensen`;
        if (totalLength) {
            tooltipText += ` (av ${Math.round(totalLength)}m)`;
        }
    }

    if (sequenceId) {
        tooltipText += `<br><small>ID: ${sequenceId}</small>`;
    }

    marker.bindTooltip(tooltipText, {
        permanent: false,
        direction: 'top',
        className: 'workzone-marker-tooltip'
    });
}

/**
 * Place end marker
 * @param {L.LatLng} latlng - Position for marker
 */
export function placeEndMarker(latlng) {
    // Snap to road if enabled
    const snappedLatLng = snapToRoad(latlng);

    // Calculate distance along sequence
    const distanceAlongSeq = calculateDistanceAlongSequence(snappedLatLng);
    const road = getSelectedRoad();

    // Remove existing end marker
    if (workZoneState.endMarker) {
        getMap().removeLayer(workZoneState.endMarker);
    }

    // Create marker
    const marker = L.marker(snappedLatLng, {
        icon: createMarkerIcon('#dc3545'), // Red
        draggable: true,
        title: 'Slutt arbeidssone'
    });

    // Store distance info on marker
    marker.distanceAlongSeq = distanceAlongSeq;
    marker.sequenceId = road ? road.veglenkesekvensid : null;

    // Add drag end listener
    marker.on('dragend', () => {
        const newPos = marker.getLatLng();
        const snappedPos = snapToRoad(newPos);
        marker.setLatLng(snappedPos);

        // Recalculate distance
        marker.distanceAlongSeq = calculateDistanceAlongSequence(snappedPos);

        // Update tooltip
        updateMarkerTooltip(marker, 'SLUTT');

        // Update distance markers
        if (updateDistanceMarkersCallback) {
            updateDistanceMarkersCallback();
        }

        updateZoneStatus();
    });

    // Bind tooltip with distance info
    updateMarkerTooltip(marker, 'SLUTT');

    // Add to map
    marker.addTo(getMap());
    workZoneState.endMarker = marker;

    // Update distance markers
    if (updateDistanceMarkersCallback) {
        updateDistanceMarkersCallback();
    }

    updateZoneStatus();
    console.log('End marker placed');
}

/**
 * Activate start mode
 */
export function activateStartMode() {
    workZoneState.mode = 'setStart';
    mapManagerState.mode = 'setStart';

    // Set map click handler
    mapManagerState.clickHandler = handleMapClick;

    // Update UI
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.classList.add('btn-success');
        startBtn.textContent = 'Klikk på kartet...';
    }

    // Update status
    const statusText = document.getElementById('statusText');
    if (statusText) {
        statusText.textContent = 'Klikk på kartet for å sette start';
    }

    console.log('Start mode activated');
}

/**
 * Activate end mode
 */
export function activateEndMode() {
    workZoneState.mode = 'setEnd';
    mapManagerState.mode = 'setEnd';

    // Set map click handler
    mapManagerState.clickHandler = handleMapClick;

    // Update UI
    const endBtn = document.getElementById('endBtn');
    if (endBtn) {
        endBtn.classList.add('btn-danger');
        endBtn.textContent = 'Klikk på kartet...';
    }

    // Update status
    const statusText = document.getElementById('statusText');
    if (statusText) {
        statusText.textContent = 'Klikk på kartet for å sette slutt';
    }

    console.log('End mode activated');
}

/**
 * Handle map click in work zone mode
 * @param {L.LatLng} latlng - Clicked position
 */
export function handleMapClick(latlng) {
    if (workZoneState.mode === 'setStart') {
        placeStartMarker(latlng);
        deactivateMode();
    } else if (workZoneState.mode === 'setEnd') {
        placeEndMarker(latlng);
        deactivateMode();
    }
}

/**
 * Deactivate work zone mode
 */
function deactivateMode() {
    workZoneState.mode = null;
    mapManagerState.mode = null;
    mapManagerState.clickHandler = null;

    // Reset button states
    const startBtn = document.getElementById('startBtn');
    const endBtn = document.getElementById('endBtn');

    if (startBtn) {
        startBtn.classList.remove('btn-success');
        startBtn.textContent = 'Sett START';
    }

    if (endBtn) {
        endBtn.classList.remove('btn-danger');
        endBtn.textContent = 'Sett SLUTT';
    }

    // Update status
    const statusText = document.getElementById('statusText');
    if (statusText) {
        statusText.textContent = 'Klar';
    }
}

/**
 * Clear work zone markers
 */
export function clearWorkZone() {
    if (workZoneState.startMarker) {
        getMap().removeLayer(workZoneState.startMarker);
        workZoneState.startMarker = null;
    }

    if (workZoneState.endMarker) {
        getMap().removeLayer(workZoneState.endMarker);
        workZoneState.endMarker = null;
    }

    // Clear distance markers
    if (updateDistanceMarkersCallback) {
        updateDistanceMarkersCallback();
    }

    updateZoneStatus();
    console.log('Work zone cleared');
}

/**
 * Toggle snapping
 * @param {boolean} enabled - Enable or disable snapping
 */
export function toggleSnapping(enabled) {
    workZoneState.snapEnabled = enabled;

    const message = enabled ? 'Snapping aktivert' : 'Fri plassering';
    console.log(message);

    // Update status
    const statusText = document.getElementById('statusText');
    if (statusText) {
        statusText.textContent = message;
    }
}

/**
 * Get work zone positions
 * @returns {Object|null} Object with start and end positions, or null
 */
export function getWorkZone() {
    if (!workZoneState.startMarker || !workZoneState.endMarker) {
        return null;
    }

    return {
        start: workZoneState.startMarker.getLatLng(),
        end: workZoneState.endMarker.getLatLng()
    };
}

/**
 * Update zone status in UI
 */
export function updateZoneStatus() {
    const zoneStatus = document.getElementById('zoneStatus');
    if (!zoneStatus) return;

    if (workZoneState.startMarker && workZoneState.endMarker) {
        const startDist = workZoneState.startMarker.distanceAlongSeq;
        const endDist = workZoneState.endMarker.distanceAlongSeq;

        let statusText = '✓ Arbeidssone definert';
        if (startDist !== null && startDist !== undefined) {
            statusText += `<br>START: ${startDist}m`;
        }
        if (endDist !== null && endDist !== undefined) {
            statusText += `<br>SLUTT: ${endDist}m`;
        }

        zoneStatus.innerHTML = statusText;
        zoneStatus.style.color = '#28a745';
    } else if (workZoneState.startMarker) {
        const startDist = workZoneState.startMarker.distanceAlongSeq;
        let statusText = '⚠ Kun START satt';
        if (startDist !== null && startDist !== undefined) {
            statusText += ` (${startDist}m)`;
        }
        zoneStatus.innerHTML = statusText;
        zoneStatus.style.color = '#ffc107';
    } else if (workZoneState.endMarker) {
        const endDist = workZoneState.endMarker.distanceAlongSeq;
        let statusText = '⚠ Kun SLUTT satt';
        if (endDist !== null && endDist !== undefined) {
            statusText += ` (${endDist}m)`;
        }
        zoneStatus.innerHTML = statusText;
        zoneStatus.style.color = '#ffc107';
    } else {
        zoneStatus.textContent = 'Ingen arbeidssone definert';
        zoneStatus.style.color = '#6c757d';
    }
}

/**
 * Initialize work zone module
 */
export function initWorkZone() {
    const startBtn = document.getElementById('startBtn');
    const endBtn = document.getElementById('endBtn');
    const clearZoneBtn = document.getElementById('clearZoneBtn');
    const snapToggle = document.getElementById('snapToggle');

    if (startBtn) {
        startBtn.addEventListener('click', activateStartMode);
    }

    if (endBtn) {
        endBtn.addEventListener('click', activateEndMode);
    }

    if (clearZoneBtn) {
        clearZoneBtn.addEventListener('click', clearWorkZone);
    }

    if (snapToggle) {
        snapToggle.addEventListener('change', (e) => {
            toggleSnapping(e.target.checked);
        });
    }

    console.log('Work zone module initialized');
}

export default {
    initWorkZone,
    activateStartMode,
    activateEndMode,
    handleMapClick,
    placeStartMarker,
    placeEndMarker,
    clearWorkZone,
    toggleSnapping,
    snapToRoad,
    getWorkZone,
    setDistanceMarkersCallback,
    calculateDistanceAlongSequence,
    workZoneState
};
