/**
 * Sign Manager Module
 * Handles traffic sign library, drag-and-drop, and placement
 * @module sign-manager
 */

import { getMap, getSelectedRoad } from './map-manager.js';
import { snapToRoad } from './work-zone.js';

// Sign state
const signState = {
    library: null,
    placedSigns: [],
    snapEnabled: true
};

/**
 * Load sign library from JSON
 * @returns {Promise<Object>} Sign library object
 */
async function loadSignLibrary() {
    try {
        const response = await fetch('data/sign-library.json');

        if (!response.ok) {
            console.error('Failed to load sign library');
            return null;
        }

        const library = await response.json();
        signState.library = library;

        console.log(`Loaded ${Object.keys(library).length} signs`);
        return library;

    } catch (error) {
        console.error('Error loading sign library:', error);
        return null;
    }
}

/**
 * Render sign palette in UI
 * @param {Object} library - Sign library object
 */
function renderSignPalette(library) {
    if (!library) {
        console.error('No library to render');
        return;
    }

    // Get containers
    const speedContainer = document.getElementById('speedSigns');
    const warningContainer = document.getElementById('warningSigns');
    const prohibitionContainer = document.getElementById('prohibitionSigns');

    // Clear existing content
    if (speedContainer) speedContainer.innerHTML = '';
    if (warningContainer) warningContainer.innerHTML = '';
    if (prohibitionContainer) prohibitionContainer.innerHTML = '';

    // Render each sign
    Object.values(library).forEach(sign => {
        const signItem = createSignItem(sign);

        // Add to appropriate container
        if (sign.category === 'speed' && speedContainer) {
            speedContainer.appendChild(signItem);
        } else if (sign.category === 'warning' && warningContainer) {
            warningContainer.appendChild(signItem);
        } else if (sign.category === 'prohibition' && prohibitionContainer) {
            prohibitionContainer.appendChild(signItem);
        }
    });

    console.log('Sign palette rendered');
}

/**
 * Create a sign item element for the palette
 * @param {Object} sign - Sign object
 * @returns {HTMLElement} Sign item element
 */
function createSignItem(sign) {
    const item = document.createElement('div');
    item.className = 'sign-item';
    item.draggable = true;
    item.setAttribute('data-sign-id', sign.id);
    item.setAttribute('role', 'listitem');
    item.setAttribute('aria-label', sign.name);

    // Create image
    const img = document.createElement('img');
    img.src = sign.file;
    img.alt = sign.name;
    img.draggable = false; // Prevent image drag, only container
    item.appendChild(img);

    // Create label
    const label = document.createElement('div');
    label.className = 'sign-label';
    label.textContent = sign.id;
    item.appendChild(label);

    // Add drag start listener
    item.addEventListener('dragstart', (e) => {
        handleSignDragStart(e, sign.id);
    });

    return item;
}

/**
 * Handle sign drag start
 * @param {DragEvent} event - Drag event
 * @param {string} signId - Sign ID
 */
function handleSignDragStart(event, signId) {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', signId);

    // Visual feedback
    event.target.style.opacity = '0.5';

    console.log(`Dragging sign: ${signId}`);
}

/**
 * Setup map as drop zone for signs
 */
function setupMapDropZone() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map element not found');
        return;
    }

    // Allow drop
    mapElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });

    // Handle drop
    mapElement.addEventListener('drop', (e) => {
        e.preventDefault();

        const signId = e.dataTransfer.getData('text/plain');
        if (!signId) return;

        // Get map coordinates from mouse position
        const map = getMap();
        if (!map) return;

        const latlng = map.mouseEventToLatLng(e);

        // Place sign
        placeSign(signId, latlng);
    });

    // Reset opacity after drag
    document.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('sign-item')) {
            e.target.style.opacity = '1';
        }
    });

    console.log('Map drop zone setup');
}

/**
 * Place a sign on the map
 * @param {string} signId - Sign ID from library
 * @param {L.LatLng} latlng - Position
 * @param {number} rotation - Rotation angle (default: 0)
 * @returns {Object|null} Placed sign object
 */
export function placeSign(signId, latlng, rotation = 0) {
    const sign = signState.library[signId];

    if (!sign) {
        console.error(`Sign not found: ${signId}`);
        return null;
    }

    // Snap to road if enabled
    const road = getSelectedRoad();
    let finalLatLng = latlng;

    if (signState.snapEnabled && road) {
        finalLatLng = snapToRoad(latlng);
    }

    // Create custom icon
    const icon = L.icon({
        iconUrl: sign.file,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });

    // Create marker
    const marker = L.marker(finalLatLng, {
        icon: icon,
        draggable: true,
        rotationAngle: rotation,
        title: sign.name
    });

    // Add drag end listener
    marker.on('dragend', () => {
        const newPos = marker.getLatLng();
        const snappedPos = signState.snapEnabled && road ? snapToRoad(newPos) : newPos;
        marker.setLatLng(snappedPos);

        // Update stored position
        const placedSign = signState.placedSigns.find(s => s.id === marker._leaflet_id);
        if (placedSign) {
            placedSign.position = snappedPos;
        }
    });

    // Create popup with options
    const popup = L.popup();
    marker.bindPopup(popup);

    // Set popup content when it opens (so event listeners work)
    marker.on('popupopen', () => {
        const popupContainer = createSignPopupElement(sign, marker._leaflet_id);
        popup.setContent(popupContainer);
    });

    // Add to map
    marker.addTo(getMap());

    // Apply initial rotation if specified
    if (rotation !== 0) {
        // Wait for marker to be added to DOM
        setTimeout(() => {
            const icon = marker.getElement();
            if (icon) {
                icon.style.transform = `rotate(${rotation}deg)`;
                icon.style.transformOrigin = 'center center';
            }
        }, 0);
    }

    // Store in placed signs
    const placedSign = {
        id: marker._leaflet_id,
        signId: signId,
        position: finalLatLng,
        rotation: rotation,
        marker: marker
    };

    signState.placedSigns.push(placedSign);

    // Update UI
    updateSignCount();

    console.log(`Placed sign: ${sign.name}`);
    return placedSign;
}

/**
 * Create popup content for a placed sign as DOM element
 * @param {Object} sign - Sign object
 * @param {number} markerId - Leaflet marker ID
 * @returns {HTMLElement} Popup element with event listeners
 */
function createSignPopupElement(sign, markerId) {
    // Create container
    const container = document.createElement('div');
    container.className = 'sign-popup';

    // Create title
    const title = document.createElement('strong');
    title.textContent = sign.name;
    container.appendChild(title);

    // Create actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'sign-actions';

    // Create rotate button
    const rotateBtn = document.createElement('button');
    rotateBtn.className = 'btn btn-secondary';
    rotateBtn.textContent = '↻ Roter 90°';
    rotateBtn.addEventListener('click', () => {
        rotateSign(markerId);
    });
    actionsDiv.appendChild(rotateBtn);

    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-danger';
    removeBtn.textContent = '✕ Fjern';
    removeBtn.addEventListener('click', () => {
        removeSign(markerId);
    });
    actionsDiv.appendChild(removeBtn);

    container.appendChild(actionsDiv);

    return container;
}

/**
 * Rotate a placed sign
 * @param {number} markerId - Leaflet marker ID
 */
export function rotateSign(markerId) {
    const placedSign = signState.placedSigns.find(s => s.id === markerId);

    if (!placedSign) {
        console.error(`Sign not found: ${markerId}`);
        return;
    }

    // Increment rotation
    placedSign.rotation = (placedSign.rotation + 90) % 360;

    // Update marker icon rotation using CSS transform
    const icon = placedSign.marker.getElement();
    if (icon) {
        icon.style.transform = `rotate(${placedSign.rotation}deg)`;
        icon.style.transformOrigin = 'center center';
    }

    console.log(`Rotated sign to ${placedSign.rotation}°`);
}

/**
 * Remove a placed sign
 * @param {number} markerId - Leaflet marker ID
 */
export function removeSign(markerId) {
    const index = signState.placedSigns.findIndex(s => s.id === markerId);

    if (index === -1) {
        console.error(`Sign not found: ${markerId}`);
        return;
    }

    const placedSign = signState.placedSigns[index];

    // Close popup if open
    if (placedSign.marker.isPopupOpen()) {
        placedSign.marker.closePopup();
    }

    // Remove marker from map
    const map = getMap();
    if (map && placedSign.marker) {
        map.removeLayer(placedSign.marker);
    }

    // Remove from array
    signState.placedSigns.splice(index, 1);

    // Update UI
    updateSignCount();

    console.log(`Removed sign: ${markerId}`);
}

/**
 * Get all placed signs
 * @returns {Array} Array of placed sign objects
 */
export function getPlacedSigns() {
    return signState.placedSigns.map(s => ({
        signId: s.signId,
        position: [s.position.lat, s.position.lng],
        rotation: s.rotation
    }));
}

/**
 * Clear all placed signs
 */
export function clearAllSigns() {
    const map = getMap();

    // Remove all markers
    signState.placedSigns.forEach(s => {
        if (map && s.marker) {
            map.removeLayer(s.marker);
        }
    });

    // Clear array
    signState.placedSigns = [];

    // Update UI
    updateSignCount();

    console.log('All signs cleared');
}

/**
 * Restore signs from saved data
 * @param {Array} signs - Array of sign data
 */
export function restoreSigns(signs) {
    if (!Array.isArray(signs)) {
        console.error('Invalid signs data');
        return;
    }

    signs.forEach(signData => {
        const latlng = L.latLng(signData.position[0], signData.position[1]);
        placeSign(signData.signId, latlng, signData.rotation || 0);
    });

    console.log(`Restored ${signs.length} signs`);
}

/**
 * Update sign count in UI
 */
function updateSignCount() {
    const countElement = document.getElementById('signCount');
    if (countElement) {
        countElement.textContent = signState.placedSigns.length;
    }
}

/**
 * Initialize sign manager
 */
export async function initSignManager() {
    console.log('Initializing sign manager...');

    // Load sign library
    const library = await loadSignLibrary();

    if (!library) {
        console.error('Failed to initialize sign manager');
        return;
    }

    // Render palette
    renderSignPalette(library);

    // Setup drop zone
    setupMapDropZone();

    // Make functions globally available for popup buttons
    window.rotateSign = rotateSign;
    window.removeSign = removeSign;

    console.log('Sign manager initialized');
}

export default {
    initSignManager,
    placeSign,
    removeSign,
    rotateSign,
    getPlacedSigns,
    clearAllSigns,
    restoreSigns
};
