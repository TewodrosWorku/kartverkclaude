/**
 * Distance Markers Module
 * Generates distance markers every 20m and 50m along the road
 * THE MOST CRITICAL FEATURE
 * @module distance-markers
 */

import { getMap, getSelectedRoad } from './map-manager.js';
import { getWorkZone } from './work-zone.js';

// Distance marker state
const distanceMarkerState = {
    layer: null,
    visible: true,
    markers: []
};

/**
 * Generate distance markers based on work zone
 * @returns {Array} Array of marker objects
 */
function generateDistanceMarkers() {
    console.log('Generating distance markers...');

    const workZone = getWorkZone();
    const road = getSelectedRoad();

    // Validate requirements
    if (!workZone) {
        console.log('No work zone defined');
        return [];
    }

    if (!road || !road.geojson) {
        console.log('No road selected');
        return [];
    }

    try {
        // Convert road geometry to turf lineString
        let roadLine;
        if (road.geojson.type === 'LineString') {
            roadLine = turf.lineString(road.geojson.coordinates);
        } else if (road.geojson.type === 'MultiLineString') {
            // Use first linestring
            roadLine = turf.lineString(road.geojson.coordinates[0]);
        } else {
            console.error('Unsupported geometry type for distance markers');
            return [];
        }

        const markers = [];

        // Calculate markers from START backward
        const startMarkers = calculateMarkersFromPoint(
            workZone.start,
            roadLine,
            'backward',
            400
        );
        markers.push(...startMarkers);

        // Calculate markers from END forward
        const endMarkers = calculateMarkersFromPoint(
            workZone.end,
            roadLine,
            'forward',
            400
        );
        markers.push(...endMarkers);

        console.log(`Generated ${markers.length} distance markers`);
        return markers;

    } catch (error) {
        console.error('Error generating distance markers:', error);
        return [];
    }
}

/**
 * Calculate markers from a point in a direction along the road
 * @param {L.LatLng} point - Start or end point
 * @param {Object} roadLine - Turf lineString
 * @param {string} direction - 'backward' or 'forward'
 * @param {number} maxDistance - Maximum distance in meters (default: 400)
 * @returns {Array} Array of marker objects
 */
function calculateMarkersFromPoint(point, roadLine, direction, maxDistance) {
    const markers = [];

    try {
        // Convert point to turf format
        const turfPoint = turf.point([point.lng, point.lat]);

        // Find nearest point on line
        const nearestPoint = turf.nearestPointOnLine(roadLine, turfPoint);

        if (!nearestPoint || !nearestPoint.properties) {
            console.error('Could not find point on line');
            return markers;
        }

        // Get total line length
        const totalLength = turf.length(roadLine, { units: 'meters' });

        // Get distance along line for this point
        // We need to slice from start to this point to get the distance
        const startCoord = roadLine.geometry.coordinates[0];
        const pointDistance = turf.length(
            turf.lineSlice(
                turf.point(startCoord),
                nearestPoint,
                roadLine
            ),
            { units: 'meters' }
        );

        console.log(`Point is ${pointDistance.toFixed(1)}m along the road (total: ${totalLength.toFixed(1)}m)`);

        // Generate markers every 20m
        for (let distance = 20; distance <= maxDistance; distance += 20) {
            let distAlongLine;

            if (direction === 'backward') {
                distAlongLine = pointDistance - distance;
            } else { // forward
                distAlongLine = pointDistance + distance;
            }

            // Check if within road bounds
            if (distAlongLine < 0 || distAlongLine > totalLength) {
                continue;
            }

            // Get point at this distance
            const markerPoint = turf.along(roadLine, distAlongLine / 1000, { units: 'kilometers' });

            if (markerPoint && markerPoint.geometry && markerPoint.geometry.coordinates) {
                const type = (distance % 50 === 0) ? 'large' : 'small';
                const from = (direction === 'backward') ? 'start' : 'slutt';

                markers.push({
                    position: markerPoint.geometry.coordinates, // [lng, lat]
                    distance: distance,
                    type: type,
                    from: from
                });
            }
        }

    } catch (error) {
        console.error(`Error calculating ${direction} markers:`, error);
    }

    return markers;
}

/**
 * Render distance markers on map
 * @param {Array} markers - Array of marker objects
 */
function renderDistanceMarkers(markers) {
    // Clear existing layer
    clearDistanceMarkers();

    if (markers.length === 0) {
        console.log('No markers to render');
        return;
    }

    // Create layer group
    const layerGroup = L.layerGroup();

    // Add each marker
    markers.forEach(marker => {
        const [lng, lat] = marker.position;

        // Determine style based on type
        const radius = marker.type === 'large' ? 6 : 3;
        const fillColor = '#ff0000';
        const color = marker.type === 'large' ? '#ffffff' : '#ff0000';
        const weight = marker.type === 'large' ? 2 : 1;

        // Create circle marker
        const circleMarker = L.circleMarker([lat, lng], {
            radius: radius,
            fillColor: fillColor,
            color: color,
            weight: weight,
            fillOpacity: 0.9,
            className: 'distance-marker'
        });

        // Bind tooltip
        circleMarker.bindTooltip(
            `${marker.distance}m fra ${marker.from}`,
            {
                permanent: false,
                direction: 'top',
                className: 'distance-marker-tooltip'
            }
        );

        // Add to layer group
        circleMarker.addTo(layerGroup);
    });

    // Add layer to map
    const map = getMap();
    if (map) {
        layerGroup.addTo(map);
        distanceMarkerState.layer = layerGroup;
        distanceMarkerState.markers = markers;

        console.log(`Rendered ${markers.length} distance markers`);
    }
}

/**
 * Update distance markers
 * Called when work zone changes
 */
export function updateDistanceMarkers() {
    if (!distanceMarkerState.visible) {
        console.log('Distance markers are hidden');
        return;
    }

    const workZone = getWorkZone();
    const road = getSelectedRoad();

    if (!workZone) {
        console.log('Cannot update: no work zone');
        clearDistanceMarkers();
        return;
    }

    if (!road) {
        console.log('Cannot update: no road selected');
        clearDistanceMarkers();
        return;
    }

    const markers = generateDistanceMarkers();
    renderDistanceMarkers(markers);
}

/**
 * Toggle distance markers visibility
 * @param {boolean} visible - Show or hide markers
 */
export function toggleDistanceMarkers(visible) {
    distanceMarkerState.visible = visible;

    if (visible) {
        updateDistanceMarkers();
        console.log('Distance markers shown');
    } else {
        clearDistanceMarkers();
        console.log('Distance markers hidden');
    }

    // Update toggle button UI
    const markerToggle = document.getElementById('markerToggle');
    if (markerToggle) {
        markerToggle.checked = visible;
    }
}

/**
 * Clear distance markers from map
 */
export function clearDistanceMarkers() {
    if (distanceMarkerState.layer) {
        const map = getMap();
        if (map) {
            map.removeLayer(distanceMarkerState.layer);
        }
        distanceMarkerState.layer = null;
        distanceMarkerState.markers = [];
    }
}

/**
 * Hide markers for export (set opacity to 0)
 */
export function hideForExport() {
    if (distanceMarkerState.layer) {
        distanceMarkerState.layer.eachLayer(layer => {
            if (layer.setStyle) {
                layer.setStyle({ fillOpacity: 0, opacity: 0 });
            }
        });
    }
}

/**
 * Show markers after export (restore opacity)
 */
export function showAfterExport() {
    if (distanceMarkerState.layer) {
        distanceMarkerState.layer.eachLayer(layer => {
            if (layer.setStyle) {
                layer.setStyle({ fillOpacity: 0.9, opacity: 1 });
            }
        });
    }
}

/**
 * Get current state
 * @returns {Object} Current state
 */
export function getState() {
    return {
        visible: distanceMarkerState.visible,
        count: distanceMarkerState.markers.length
    };
}

export default {
    updateDistanceMarkers,
    toggleDistanceMarkers,
    clearDistanceMarkers,
    hideForExport,
    showAfterExport,
    getState
};
