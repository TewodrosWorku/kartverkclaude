/**
 * Distance Measurement Module
 * Allows users to measure distances on the map by clicking points
 * @module distance-measurement
 */

import { getMap } from './map-manager.js';

// State
const measurementState = {
    isActive: false,
    currentLine: null,
    currentPoints: [],
    finalizedLines: [],
    cursorTooltip: null,
    tempLineLayer: null,
    tempLabel: null
};

/**
 * Create cursor tooltip element
 */
function createCursorTooltip() {
    if (measurementState.cursorTooltip) {
        return;
    }

    const tooltip = document.createElement('div');
    tooltip.id = 'measurementCursorTooltip';
    tooltip.style.cssText = `
        position: fixed;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        z-index: 10000;
        display: none;
        white-space: nowrap;
    `;
    document.body.appendChild(tooltip);
    measurementState.cursorTooltip = tooltip;
}

/**
 * Update cursor tooltip position and text
 * @param {MouseEvent} e - Mouse event
 * @param {string} text - Tooltip text
 */
function updateCursorTooltip(e, text) {
    if (!measurementState.cursorTooltip) return;

    measurementState.cursorTooltip.textContent = text;
    measurementState.cursorTooltip.style.left = (e.clientX + 15) + 'px';
    measurementState.cursorTooltip.style.top = (e.clientY + 15) + 'px';
    measurementState.cursorTooltip.style.display = 'block';
}

/**
 * Hide cursor tooltip
 */
function hideCursorTooltip() {
    if (measurementState.cursorTooltip) {
        measurementState.cursorTooltip.style.display = 'none';
    }
}

/**
 * Calculate distance between two points in meters
 * @param {L.LatLng} point1 - First point
 * @param {L.LatLng} point2 - Second point
 * @returns {number} Distance in meters
 */
function calculateDistance(point1, point2) {
    return point1.distanceTo(point2);
}

/**
 * Calculate total distance for a line
 * @param {Array} points - Array of L.LatLng points
 * @returns {number} Total distance in meters
 */
function calculateTotalDistance(points) {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
        total += calculateDistance(points[i - 1], points[i]);
    }
    return total;
}

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance
 */
function formatDistance(meters) {
    if (meters < 1000) {
        return `${meters.toFixed(1)} m`;
    } else {
        return `${(meters / 1000).toFixed(2)} km`;
    }
}

/**
 * Start a new measurement
 * @param {L.LatLng} startPoint - Starting point
 */
function startMeasurement(startPoint) {
    measurementState.currentPoints = [startPoint];
    measurementState.currentLine = null;
}

/**
 * Update temporary line while dragging
 * @param {L.LatLng} currentPos - Current cursor position
 */
function updateTempLine(currentPos) {
    const map = getMap();
    if (!map || measurementState.currentPoints.length === 0) return;

    // Remove previous temp line and label
    if (measurementState.tempLineLayer) {
        map.removeLayer(measurementState.tempLineLayer);
    }
    if (measurementState.tempLabel) {
        map.removeLayer(measurementState.tempLabel);
    }

    // Create points array including cursor position
    const points = [...measurementState.currentPoints, currentPos];

    // Create dashed line
    const tempLine = L.polyline(points, {
        color: '#666',
        weight: 2,
        dashArray: '5, 10',
        opacity: 0.7
    });

    tempLine.addTo(map);
    measurementState.tempLineLayer = tempLine;

    // Calculate distance for current segment
    const lastPoint = measurementState.currentPoints[measurementState.currentPoints.length - 1];
    const segmentDistance = calculateDistance(lastPoint, currentPos);

    // Create distance label at midpoint of current segment
    const midLat = (lastPoint.lat + currentPos.lat) / 2;
    const midLng = (lastPoint.lng + currentPos.lng) / 2;

    const label = L.divIcon({
        className: 'measurement-label-temp',
        html: `<div style="
            background: white;
            border: 2px solid #666;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: bold;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">${formatDistance(segmentDistance)}</div>`,
        iconSize: null,
        iconAnchor: [-10, 25] // Offset label to the left and below to avoid cursor overlap
    });

    const labelMarker = L.marker([midLat, midLng], {
        icon: label,
        interactive: false
    });
    labelMarker.addTo(map);
    measurementState.tempLabel = labelMarker;
}

/**
 * Add waypoint to current measurement
 * @param {L.LatLng} point - Waypoint
 */
function addWaypoint(point) {
    measurementState.currentPoints.push(point);
}

/**
 * Finalize current measurement
 */
function finalizeMeasurement() {
    const map = getMap();
    if (!map || measurementState.currentPoints.length < 2) return;

    // Remove temp line and label
    if (measurementState.tempLineLayer) {
        map.removeLayer(measurementState.tempLineLayer);
        measurementState.tempLineLayer = null;
    }
    if (measurementState.tempLabel) {
        map.removeLayer(measurementState.tempLabel);
        measurementState.tempLabel = null;
    }

    // Create solid green line
    const finalLine = L.polyline(measurementState.currentPoints, {
        color: '#28a745',
        weight: 3,
        opacity: 0.8
    });
    finalLine.addTo(map);

    // Calculate total distance
    const totalDistance = calculateTotalDistance(measurementState.currentPoints);

    // Create label at midpoint of entire line
    const bounds = finalLine.getBounds();
    const center = bounds.getCenter();

    const label = L.divIcon({
        className: 'measurement-label-final',
        html: `<div style="
            background: white;
            border: 2px solid #28a745;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: bold;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            color: #28a745;
        ">${formatDistance(totalDistance)}</div>`,
        iconSize: null,
        iconAnchor: [0, 0]
    });

    const labelMarker = L.marker(center, {
        icon: label,
        interactive: false
    });
    labelMarker.addTo(map);

    // Store finalized line
    measurementState.finalizedLines.push({
        line: finalLine,
        label: labelMarker,
        points: [...measurementState.currentPoints]
    });

    // Reset current measurement
    measurementState.currentPoints = [];
    measurementState.currentLine = null;
}

/**
 * Clear all measurements
 */
function clearAllMeasurements() {
    const map = getMap();
    if (!map) return;

    // Clear temp line and label
    if (measurementState.tempLineLayer) {
        map.removeLayer(measurementState.tempLineLayer);
        measurementState.tempLineLayer = null;
    }
    if (measurementState.tempLabel) {
        map.removeLayer(measurementState.tempLabel);
        measurementState.tempLabel = null;
    }

    // Clear finalized lines
    measurementState.finalizedLines.forEach(item => {
        map.removeLayer(item.line);
        map.removeLayer(item.label);
    });
    measurementState.finalizedLines = [];

    // Reset current measurement
    measurementState.currentPoints = [];
    measurementState.currentLine = null;
}

/**
 * Activate distance measurement tool
 */
export function activateMeasurement() {
    const map = getMap();
    if (!map) return;

    measurementState.isActive = true;

    // Update button state
    const btn = document.getElementById('measurementBtn');
    if (btn) {
        btn.classList.add('active', 'btn-primary');
    }

    // Create cursor tooltip
    createCursorTooltip();

    // Map click handler
    const handleMapClick = (e) => {
        if (!measurementState.isActive) return;

        if (measurementState.currentPoints.length === 0) {
            // Start new measurement
            startMeasurement(e.latlng);
        } else {
            // Add waypoint
            addWaypoint(e.latlng);
        }
    };

    // Map double-click handler
    const handleMapDblClick = (e) => {
        if (!measurementState.isActive) return;

        L.DomEvent.stop(e); // Prevent map zoom

        if (measurementState.currentPoints.length > 0) {
            // Add final point and finalize
            addWaypoint(e.latlng);
            finalizeMeasurement();
        }
    };

    // Map mousemove handler
    const handleMapMouseMove = (e) => {
        if (!measurementState.isActive) return;

        if (measurementState.currentPoints.length === 0) {
            // Show "Click to start" tooltip
            updateCursorTooltip(e.originalEvent, 'Trykk for å starte måling');
        } else {
            // Show "Double-click to finish" and update temp line
            updateCursorTooltip(e.originalEvent, 'Dobbelklik til å avslutte måling');
            updateTempLine(e.latlng);
        }
    };

    // Store handlers for cleanup
    measurementState.clickHandler = handleMapClick;
    measurementState.dblClickHandler = handleMapDblClick;
    measurementState.mouseMoveHandler = handleMapMouseMove;

    // Attach event listeners
    map.on('click', handleMapClick);
    map.on('dblclick', handleMapDblClick);
    map.on('mousemove', handleMapMouseMove);

    console.log('Distance measurement tool activated');
}

/**
 * Deactivate distance measurement tool
 */
export function deactivateMeasurement() {
    const map = getMap();
    if (!map) return;

    measurementState.isActive = false;

    // Update button state
    const btn = document.getElementById('measurementBtn');
    if (btn) {
        btn.classList.remove('active', 'btn-primary');
    }

    // Hide cursor tooltip
    hideCursorTooltip();

    // Remove event listeners
    if (measurementState.clickHandler) {
        map.off('click', measurementState.clickHandler);
    }
    if (measurementState.dblClickHandler) {
        map.off('dblclick', measurementState.dblClickHandler);
    }
    if (measurementState.mouseMoveHandler) {
        map.off('mousemove', measurementState.mouseMoveHandler);
    }

    // Clear all measurements
    clearAllMeasurements();

    console.log('Distance measurement tool deactivated');
}

/**
 * Toggle distance measurement tool
 */
export function toggleMeasurement() {
    if (measurementState.isActive) {
        deactivateMeasurement();
    } else {
        activateMeasurement();
    }
}

/**
 * Initialize distance measurement module
 */
export function initDistanceMeasurement() {
    const btn = document.getElementById('measurementBtn');
    if (btn) {
        btn.addEventListener('click', toggleMeasurement);
        console.log('Distance measurement module initialized');
    } else {
        console.error('Measurement button not found');
    }
}

export default {
    initDistanceMeasurement,
    activateMeasurement,
    deactivateMeasurement,
    toggleMeasurement
};
