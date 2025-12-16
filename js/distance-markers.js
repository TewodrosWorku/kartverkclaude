/**
 * Distance Markers Module - DISABLED
 * This module is disabled because START and END markers are now independent.
 * Each marker shows its position along its own sequence.
 * @module distance-markers
 */

import { getMap, getSelectedRoad } from './map-manager.js';
import { getWorkZone } from './work-zone.js';

// Distance marker state - DISABLED
const distanceMarkerState = {
    layer: null,
    visible: false,
    markers: []
};

/**
 * Update distance markers - DISABLED (no-op)
 */
export function updateDistanceMarkers() {
    // Disabled - markers now show position along sequence instead
    console.log('Distance markers disabled');
}

/**
 * Toggle distance markers visibility - DISABLED (no-op)
 * @param {boolean} visible - Show or hide markers (ignored)
 */
export function toggleDistanceMarkers(visible) {
    // Disabled
    console.log('Distance markers toggle disabled');
}

/**
 * Clear distance markers from map - DISABLED (no-op)
 */
export function clearDistanceMarkers() {
    // Disabled - nothing to clear
}

/**
 * Hide markers for export - DISABLED (no-op)
 */
export function hideForExport() {
    // Disabled
}

/**
 * Show markers after export - DISABLED (no-op)
 */
export function showAfterExport() {
    // Disabled
}

/**
 * Get current state
 * @returns {Object} Current state (always disabled)
 */
export function getState() {
    return {
        visible: false,
        count: 0
    };
}

/**
 * Measure distance from click - DISABLED
 * @param {number} lat - Clicked latitude
 * @param {number} lng - Clicked longitude
 * @returns {null} Always returns null (disabled)
 */
export function measureDistanceFromClick(lat, lng) {
    // Disabled - this feature is no longer needed
    return null;
}

export default {
    updateDistanceMarkers,
    toggleDistanceMarkers,
    clearDistanceMarkers,
    hideForExport,
    showAfterExport,
    getState,
    measureDistanceFromClick
};
