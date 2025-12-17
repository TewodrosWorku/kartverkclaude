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
 * Get category name from folder path
 * @param {string} path - Path like "fareskilt/cone.svg" or "cone.svg"
 * @returns {string} Category name or empty string
 */
function getCategoryFromPath(path) {
    const parts = path.split('/');
    if (parts.length > 1) {
        // Return folder name, capitalize first letter
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return '';
}

/**
 * Convert filename to display name
 * @param {string} filename - SVG filename (e.g., "fareskilt/traffic-cone.svg")
 * @returns {string} Display name (e.g., "Traffic Cone")
 */
function filenameToName(filename) {
    // Get just the filename without folder path
    const parts = filename.split('/');
    const nameWithExt = parts[parts.length - 1];

    // Remove .svg extension
    const name = nameWithExt.replace('.svg', '');

    // Replace hyphens and underscores with spaces
    const spacedName = name.replace(/[-_]/g, ' ');

    // Capitalize first letter of each word
    return spacedName.replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Load signs from directory index
 * @returns {Promise<Object>} Sign library object
 */
async function loadSignLibrary() {
    try {
        const response = await fetch('signs/index.json');

        if (!response.ok) {
            console.error('Failed to load sign index');
            return null;
        }

        const filenames = await response.json();

        // Build library object from filenames
        const library = {};
        filenames.forEach(filename => {
            // ID is the full path without .svg, using / as separator
            const id = filename.replace('.svg', '').replace(/\//g, '-');
            const category = getCategoryFromPath(filename);

            library[id] = {
                id: id,
                name: filenameToName(filename),
                file: `signs/${filename}`,
                category: category
            };
        });

        signState.library = library;

        console.log(`Loaded ${Object.keys(library).length} signs from signs/ folder`);
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

    // Find a sign container - try common IDs
    let container = document.getElementById('signPalette')
                 || document.getElementById('speedSigns')
                 || document.getElementById('warningSigns')
                 || document.getElementById('prohibitionSigns');

    if (!container) {
        console.error('No sign container found in DOM');
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Group signs by category
    const categories = {};
    Object.values(library).forEach(sign => {
        const cat = sign.category || 'Generelt';
        if (!categories[cat]) {
            categories[cat] = [];
        }
        categories[cat].push(sign);
    });

    // Render each category
    Object.keys(categories).sort().forEach(categoryName => {
        // Create category section
        const categorySection = document.createElement('div');
        categorySection.className = 'sign-category';
        categorySection.style.marginBottom = '20px';

        // Category header
        const header = document.createElement('h4');
        header.textContent = categoryName;
        header.style.fontSize = '14px';
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '10px';
        header.style.color = '#333';
        categorySection.appendChild(header);

        // Signs grid
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(80px, 1fr))';
        grid.style.gap = '10px';

        categories[categoryName].forEach(sign => {
            const signItem = createSignItem(sign);
            grid.appendChild(signItem);
        });

        categorySection.appendChild(grid);
        container.appendChild(categorySection);
    });

    console.log(`Sign palette rendered with ${Object.keys(library).length} signs in ${Object.keys(categories).length} categories`);
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
    label.textContent = sign.name;
    label.style.fontSize = '11px';
    label.style.textAlign = 'center';
    label.style.marginTop = '4px';
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
 * Place a polygon on the map
 * @param {string} signId - Sign ID from library
 * @param {L.LatLng} latlng - Center position
 * @param {Array} vertices - Optional vertices for polygon restoration
 * @returns {Object|null} Placed polygon object
 */
function placePolygon(signId, latlng, vertices = null) {
    const sign = signState.library[signId];

    if (!sign) {
        console.error(`Sign not found: ${signId}`);
        return null;
    }

    const map = getMap();
    if (!map) {
        console.error('Map not available');
        return null;
    }

    // Determine polygon color based on sign type
    let fillColor, strokeColor, strokeWidth;
    if (signId.includes('arbeidsomrade')) {
        // Orange for work zone
        fillColor = 'orange';
        strokeColor = 'black';
        strokeWidth = 3;
    } else if (signId.includes('sikring')) {
        // Red for traffic barrier - no border
        fillColor = 'red';
        strokeColor = 'red';
        strokeWidth = 0;
    } else {
        // Default
        fillColor = 'gray';
        strokeColor = 'black';
        strokeWidth = 3;
    }

    // Create polygon coordinates (default rectangle if no vertices provided)
    let polygonCoords;
    if (vertices && vertices.length >= 3) {
        polygonCoords = vertices;
    } else {
        // Create a default 50m x 30m rectangle centered at drop point
        const offsetLat = 0.00045; // ~50m in latitude
        const offsetLng = 0.00060; // ~30m in longitude (approximate, varies with latitude)

        polygonCoords = [
            [latlng.lat + offsetLat, latlng.lng - offsetLng],
            [latlng.lat + offsetLat, latlng.lng + offsetLng],
            [latlng.lat - offsetLat, latlng.lng + offsetLng],
            [latlng.lat - offsetLat, latlng.lng - offsetLng]
        ];
    }

    // Create editable polygon
    const polygon = L.polygon(polygonCoords, {
        color: strokeColor,
        weight: strokeWidth,
        fillColor: fillColor,
        fillOpacity: 1.0
    });

    // Create popup with delete option (for double-click)
    const popup = L.popup();
    polygon.bindPopup(popup);

    polygon.on('popupopen', () => {
        const popupContainer = createPolygonPopupElement(sign, polygon._leaflet_id);
        popup.setContent(popupContainer);
    });

    // Toggle editing on single click
    polygon.on('click', (e) => {
        L.DomEvent.stopPropagation(e); // Prevent map click

        if (polygon.editEnabled()) {
            // Disable editing
            polygon.disableEdit();
            console.log('Polygon editing disabled');
        } else {
            // Enable editing
            if (map.editTools) {
                polygon.enableEdit();
                console.log('Polygon editing enabled');
            }
        }
    });

    // Open popup on double-click
    polygon.on('dblclick', (e) => {
        L.DomEvent.stopPropagation(e); // Prevent map zoom
        polygon.openPopup(e.latlng);
    });

    // Add to map
    polygon.addTo(map);

    // Store in placed signs
    const placedPolygon = {
        id: polygon._leaflet_id,
        signId: signId,
        polygon: polygon,
        isPolygon: true,
        vertices: polygonCoords
    };

    signState.placedSigns.push(placedPolygon);

    // Update vertices when polygon is edited
    polygon.on('editable:vertex:dragend editable:vertex:deleted editable:vertex:new', () => {
        const latLngs = polygon.getLatLngs()[0];
        placedPolygon.vertices = latLngs.map(ll => [ll.lat, ll.lng]);
    });

    // Update UI
    updateSignCount();

    console.log(`Placed polygon: ${sign.name}`);
    return placedPolygon;
}

/**
 * Create popup content for a placed polygon
 * @param {Object} sign - Sign object
 * @param {number} polygonId - Leaflet polygon ID
 * @returns {HTMLElement} Popup element with event listeners
 */
function createPolygonPopupElement(sign, polygonId) {
    const placedPolygon = signState.placedSigns.find(s => s.id === polygonId);
    if (!placedPolygon) return document.createElement('div');

    const container = document.createElement('div');
    container.className = 'polygon-popup';
    container.style.minWidth = '200px';

    const title = document.createElement('strong');
    title.textContent = sign.name;
    title.style.display = 'block';
    title.style.marginBottom = '10px';
    container.appendChild(title);

    const info = document.createElement('p');
    info.innerHTML = '<strong>Tips:</strong> Klikk på polygon for å aktivere/deaktivere hjørner.<br><strong>Dobbeltklikk</strong> for å åpne denne menyen.';
    info.style.fontSize = '11px';
    info.style.marginBottom = '10px';
    info.style.color = '#666';
    container.appendChild(info);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Slett polygon';
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.style.width = '100%';
    deleteBtn.addEventListener('click', () => {
        removePolygon(polygonId);
    });
    container.appendChild(deleteBtn);

    return container;
}

/**
 * Remove polygon from map
 * @param {number} polygonId - Leaflet polygon ID
 */
function removePolygon(polygonId) {
    const index = signState.placedSigns.findIndex(s => s.id === polygonId);
    if (index === -1) return;

    const placedPolygon = signState.placedSigns[index];

    // Remove from map
    if (placedPolygon.polygon) {
        getMap().removeLayer(placedPolygon.polygon);
    }

    // Remove from array
    signState.placedSigns.splice(index, 1);

    // Update UI
    updateSignCount();

    console.log('Polygon removed');
}

/**
 * Place a sign on the map
 * @param {string} signId - Sign ID from library
 * @param {L.LatLng} latlng - Position
 * @param {number} rotation - Rotation angle (default: 0)
 * @param {Array} vertices - Optional vertices for polygon restoration
 * @returns {Object|null} Placed sign object
 */
export function placeSign(signId, latlng, rotation = 0, vertices = null) {
    const sign = signState.library[signId];

    if (!sign) {
        console.error(`Sign not found: ${signId}`);
        return null;
    }

    // Check if this is a polygon sign
    if (signId.includes('polygon')) {
        return placePolygon(signId, latlng, vertices);
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

    // Preserve rotation during drag
    marker.on('drag', () => {
        const placedSign = signState.placedSigns.find(s => s.id === marker._leaflet_id);
        if (placedSign && placedSign.rotation !== 0) {
            const icon = marker.getElement();
            if (icon) {
                // Get Leaflet's positioning transform
                const currentTransform = icon.style.transform || '';
                const translateMatch = currentTransform.match(/translate3d\([^)]+\)/);
                const translatePart = translateMatch ? translateMatch[0] : '';

                // Combine positioning with rotation
                if (translatePart) {
                    icon.style.transform = `${translatePart} rotate(${placedSign.rotation}deg)`;
                } else {
                    icon.style.transform = `rotate(${placedSign.rotation}deg)`;
                }
                icon.style.transformOrigin = 'center center';
            }
        }
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

            // Update text label position if it exists
            if (placedSign.textLabel) {
                placedSign.textLabel.setLatLng(snappedPos);
            }

            // Re-apply rotation after drag (preserve rotation during drag)
            setTimeout(() => {
                const icon = marker.getElement();
                if (icon && placedSign.rotation !== 0) {
                    // Get Leaflet's positioning transform
                    const currentTransform = icon.style.transform || '';
                    const translateMatch = currentTransform.match(/translate3d\([^)]+\)/);
                    const translatePart = translateMatch ? translateMatch[0] : '';

                    // Combine positioning with rotation
                    if (translatePart) {
                        icon.style.transform = `${translatePart} rotate(${placedSign.rotation}deg)`;
                    } else {
                        icon.style.transform = `rotate(${placedSign.rotation}deg)`;
                    }
                    icon.style.transformOrigin = 'center center';
                }
            }, 10);
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
                // Get Leaflet's positioning transform
                const currentTransform = icon.style.transform || '';
                const translateMatch = currentTransform.match(/translate3d\([^)]+\)/);
                const translatePart = translateMatch ? translateMatch[0] : '';

                // Combine positioning with rotation
                if (translatePart) {
                    icon.style.transform = `${translatePart} rotate(${rotation}deg)`;
                } else {
                    icon.style.transform = `rotate(${rotation}deg)`;
                }
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
        customText: '', // Custom text message
        marker: marker,
        textLabel: null // Will hold the text label overlay
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
    const placedSign = signState.placedSigns.find(s => s.id === markerId);
    if (!placedSign) return document.createElement('div');

    // Create container
    const container = document.createElement('div');
    container.className = 'sign-popup';
    container.style.minWidth = '220px';

    // Create title
    const title = document.createElement('strong');
    title.textContent = sign.name;
    title.style.display = 'block';
    title.style.marginBottom = '10px';
    container.appendChild(title);

    // Rotation control
    const rotationGroup = document.createElement('div');
    rotationGroup.style.marginBottom = '10px';

    const rotationLabel = document.createElement('label');
    rotationLabel.textContent = `Rotasjon: ${placedSign.rotation}°`;
    rotationLabel.style.display = 'block';
    rotationLabel.style.marginBottom = '5px';
    rotationLabel.style.fontSize = '12px';
    rotationGroup.appendChild(rotationLabel);

    const rotationSlider = document.createElement('input');
    rotationSlider.type = 'range';
    rotationSlider.min = '0';
    rotationSlider.max = '360';
    rotationSlider.value = placedSign.rotation;
    rotationSlider.style.width = '100%';
    rotationSlider.addEventListener('input', (e) => {
        const angle = parseInt(e.target.value);
        rotationLabel.textContent = `Rotasjon: ${angle}°`;
        setSignRotation(markerId, angle);
    });
    rotationGroup.appendChild(rotationSlider);

    container.appendChild(rotationGroup);

    // Custom text input
    const textGroup = document.createElement('div');
    textGroup.style.marginBottom = '10px';

    const textLabel = document.createElement('label');
    textLabel.textContent = 'Tilleggstekst:';
    textLabel.style.display = 'block';
    textLabel.style.marginBottom = '5px';
    textLabel.style.fontSize = '12px';
    textGroup.appendChild(textLabel);

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = placedSign.customText || '';
    textInput.placeholder = 'Skriv melding...';
    textInput.style.width = '100%';
    textInput.style.padding = '4px';
    textInput.style.fontSize = '12px';
    textInput.addEventListener('input', (e) => {
        setSignCustomText(markerId, e.target.value);
    });
    textGroup.appendChild(textInput);

    container.appendChild(textGroup);

    // Create actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'sign-actions';
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '5px';
    actionsDiv.style.marginTop = '10px';

    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-danger';
    removeBtn.textContent = '✕ Fjern';
    removeBtn.style.flex = '1';
    removeBtn.style.padding = '5px';
    removeBtn.style.fontSize = '12px';
    removeBtn.addEventListener('click', () => {
        removeSign(markerId);
    });
    actionsDiv.appendChild(removeBtn);

    container.appendChild(actionsDiv);

    return container;
}

/**
 * Set sign rotation to a specific angle
 * @param {number} markerId - Leaflet marker ID
 * @param {number} angle - Rotation angle (0-360)
 */
export function setSignRotation(markerId, angle) {
    const placedSign = signState.placedSigns.find(s => s.id === markerId);

    if (!placedSign) {
        console.error(`Sign not found: ${markerId}`);
        return;
    }

    // Update rotation
    placedSign.rotation = angle % 360;

    // Update marker icon rotation using CSS transform
    const icon = placedSign.marker.getElement();
    if (icon) {
        // Get existing Leaflet transform (for positioning)
        const currentTransform = icon.style.transform || '';

        // Extract translate values if they exist (Leaflet uses translate3d for positioning)
        const translateMatch = currentTransform.match(/translate3d\([^)]+\)/);
        const translatePart = translateMatch ? translateMatch[0] : '';

        // Combine Leaflet's positioning with our rotation
        if (translatePart) {
            icon.style.transform = `${translatePart} rotate(${placedSign.rotation}deg)`;
        } else {
            icon.style.transform = `rotate(${placedSign.rotation}deg)`;
        }
        icon.style.transformOrigin = 'center center';
    }
}

/**
 * Set custom text for a sign
 * @param {number} markerId - Leaflet marker ID
 * @param {string} text - Custom text message
 */
export function setSignCustomText(markerId, text) {
    const placedSign = signState.placedSigns.find(s => s.id === markerId);

    if (!placedSign) {
        console.error(`Sign not found: ${markerId}`);
        return;
    }

    // Update text
    placedSign.customText = text;

    // Remove old label if exists
    if (placedSign.textLabel) {
        const map = getMap();
        if (map) {
            map.removeLayer(placedSign.textLabel);
        }
        placedSign.textLabel = null;
    }

    // Add new label if text is not empty
    if (text && text.trim()) {
        const map = getMap();
        if (map) {
            // Create a divIcon for the text label
            const textIcon = L.divIcon({
                className: 'sign-text-label',
                html: `<div style="
                    background: white;
                    border: 2px solid #333;
                    border-radius: 4px;
                    padding: 4px 8px;
                    font-size: 12px;
                    font-weight: bold;
                    white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    text-align: center;
                ">${text}</div>`,
                iconSize: null,
                iconAnchor: [0, -45] // Position below the sign
            });

            // Create marker for text label at the same position as sign
            const textMarker = L.marker(placedSign.position, {
                icon: textIcon,
                interactive: false // Don't interfere with sign marker clicks
            });

            textMarker.addTo(map);
            placedSign.textLabel = textMarker;
        }
    }
}

/**
 * Rotate a placed sign (legacy - 90° increments)
 * @param {number} markerId - Leaflet marker ID
 */
export function rotateSign(markerId) {
    const placedSign = signState.placedSigns.find(s => s.id === markerId);

    if (!placedSign) {
        console.error(`Sign not found: ${markerId}`);
        return;
    }

    // Increment rotation by 90°
    const newRotation = (placedSign.rotation + 90) % 360;
    setSignRotation(markerId, newRotation);

    console.log(`Rotated sign to ${newRotation}°`);
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

    // Remove text label if exists
    if (placedSign.textLabel && map) {
        map.removeLayer(placedSign.textLabel);
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
    return signState.placedSigns.map(s => {
        if (s.isPolygon) {
            // Polygon data
            return {
                signId: s.signId,
                isPolygon: true,
                vertices: s.vertices
            };
        } else {
            // Regular sign data
            return {
                signId: s.signId,
                position: [s.position.lat, s.position.lng],
                rotation: s.rotation,
                customText: s.customText || ''
            };
        }
    });
}

/**
 * Clear all placed signs
 */
export function clearAllSigns() {
    const map = getMap();

    // Remove all markers, text labels, and polygons
    signState.placedSigns.forEach(s => {
        if (s.isPolygon) {
            // Remove polygon
            if (map && s.polygon) {
                map.removeLayer(s.polygon);
            }
        } else {
            // Remove marker and text label
            if (map && s.marker) {
                map.removeLayer(s.marker);
            }
            if (map && s.textLabel) {
                map.removeLayer(s.textLabel);
            }
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
        if (signData.isPolygon) {
            // Restore polygon with vertices
            const centerLat = signData.vertices.reduce((sum, v) => sum + v[0], 0) / signData.vertices.length;
            const centerLng = signData.vertices.reduce((sum, v) => sum + v[1], 0) / signData.vertices.length;
            const latlng = L.latLng(centerLat, centerLng);
            placeSign(signData.signId, latlng, 0, signData.vertices);
        } else {
            // Restore regular sign
            const latlng = L.latLng(signData.position[0], signData.position[1]);
            const placedSign = placeSign(signData.signId, latlng, signData.rotation || 0);

            // Restore custom text if it exists
            if (placedSign && signData.customText) {
                setSignCustomText(placedSign.id, signData.customText);
            }
        }
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

    // Make functions globally available (for compatibility)
    window.rotateSign = rotateSign;
    window.removeSign = removeSign;
    window.setSignRotation = setSignRotation;
    window.setSignCustomText = setSignCustomText;

    console.log('Sign manager initialized');
}

export default {
    initSignManager,
    placeSign,
    removeSign,
    rotateSign,
    setSignRotation,
    setSignCustomText,
    getPlacedSigns,
    clearAllSigns,
    restoreSigns
};
