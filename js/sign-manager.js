/**
 * Sign Manager Module
 * Handles traffic sign library, drag-and-drop, and placement
 * @module sign-manager
 */

import { getMap, getSelectedRoad } from './map-manager.js';
import { snapToRoad } from './work-zone.js';

// Custom Icon class that sets crossOrigin for canvas export
const CORSIcon = L.Icon.extend({
    _setIconStyles: function (img, name) {
        // Set crossOrigin BEFORE calling parent (before image loads)
        img.crossOrigin = 'anonymous';
        // Call parent method to set other styles
        L.Icon.prototype._setIconStyles.call(this, img, name);
    }
});

// Sign state
const signState = {
    library: null,
    placedSigns: [],
    snapEnabled: false,
    // Undo/Redo history
    history: [],
    historyIndex: -1,
    maxHistorySize: 10,
    isUndoRedoOperation: false // Flag to prevent recording undo/redo actions
};

/**
 * Add action to history for undo/redo
 * @param {Object} action - Action object with type and data
 */
function addToHistory(action) {
    // Don't record if this is an undo/redo operation
    if (signState.isUndoRedoOperation) {
        return;
    }

    // Remove any actions after current index (when undoing and then doing new action)
    signState.history = signState.history.slice(0, signState.historyIndex + 1);

    // Add new action
    signState.history.push(action);
    signState.historyIndex++;

    // Limit history size
    if (signState.history.length > signState.maxHistorySize) {
        signState.history.shift();
        signState.historyIndex--;
    }

    console.log(`History: ${signState.history.length} actions, index: ${signState.historyIndex}`);
}

/**
 * Undo last action
 */
export function undo() {
    if (signState.historyIndex < 0) {
        console.log('Nothing to undo');
        return;
    }

    signState.isUndoRedoOperation = true;

    const action = signState.history[signState.historyIndex];
    console.log('Undoing:', action.type);

    // Perform undo based on action type
    switch (action.type) {
        case 'add_sign':
            // Remove the sign
            removeSignInternal(action.data.id);
            break;

        case 'delete_sign':
            // Restore the sign
            restoreSign(action.data);
            break;

        case 'move_sign':
            // Move back to old position
            moveSignInternal(action.data.id, action.data.oldPosition);
            break;

        case 'rotate_sign':
            // Rotate back to old angle
            setSignRotation(action.data.id, action.data.oldRotation);
            break;

        case 'duplicate_sign':
            // Remove the duplicated sign
            removeSignInternal(action.data.newSignId);
            break;

        case 'add_polygon':
            // Remove the polygon
            removePolygon(action.data.id);
            break;

        case 'delete_polygon':
            // Restore the polygon
            restorePolygon(action.data);
            break;

        case 'add_polyline':
            // Remove the polyline
            removePolyline(action.data.id);
            break;

        case 'delete_polyline':
            // Restore the polyline
            restorePolyline(action.data);
            break;
    }

    signState.historyIndex--;
    signState.isUndoRedoOperation = false;

    console.log(`Undo complete. History index: ${signState.historyIndex}`);
}

/**
 * Redo last undone action
 */
export function redo() {
    if (signState.historyIndex >= signState.history.length - 1) {
        console.log('Nothing to redo');
        return;
    }

    signState.isUndoRedoOperation = true;
    signState.historyIndex++;

    const action = signState.history[signState.historyIndex];
    console.log('Redoing:', action.type);

    // Perform redo based on action type
    switch (action.type) {
        case 'add_sign':
            // Re-add the sign
            restoreSign(action.data);
            break;

        case 'delete_sign':
            // Remove the sign again
            removeSignInternal(action.data.id);
            break;

        case 'move_sign':
            // Move to new position
            moveSignInternal(action.data.id, action.data.newPosition);
            break;

        case 'rotate_sign':
            // Rotate to new angle
            setSignRotation(action.data.id, action.data.newRotation);
            break;

        case 'duplicate_sign':
            // Re-add the duplicated sign
            restoreSign(action.data);
            break;

        case 'add_polygon':
            // Re-add the polygon
            restorePolygon(action.data);
            break;

        case 'delete_polygon':
            // Remove the polygon again
            removePolygon(action.data.id);
            break;

        case 'add_polyline':
            // Re-add the polyline
            restorePolyline(action.data);
            break;

        case 'delete_polyline':
            // Remove the polyline again
            removePolyline(action.data.id);
            break;
    }

    signState.isUndoRedoOperation = false;

    console.log(`Redo complete. History index: ${signState.historyIndex}`);
}

/**
 * Clear undo/redo history
 * Useful when starting a new project or loading a saved project
 */
export function clearUndoHistory() {
    signState.history = [];
    signState.historyIndex = -1;
    console.log('Undo history cleared');
}

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
 * @param {string} searchQuery - Optional search filter
 */
function renderSignPalette(library, searchQuery = '') {
    if (!library) {
        console.error('No library to render');
        return;
    }

    const container = document.getElementById('signContainer');

    if (!container) {
        console.error('Sign container not found in DOM');
        return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Filter signs based on search query
    let filteredSigns = Object.values(library);
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredSigns = filteredSigns.filter(sign => {
            // Search in sign ID (e.g., "102_2")
            const idMatch = sign.id.toLowerCase().includes(query);
            // Search in sign name (e.g., "Farlige svinger")
            const nameMatch = sign.name.toLowerCase().includes(query);
            // Search in file path for number matches
            const fileMatch = sign.file.toLowerCase().includes(query);

            return idMatch || nameMatch || fileMatch;
        });
    }

    // Group signs by category
    const categories = {};
    filteredSigns.forEach(sign => {
        const cat = sign.category || 'Generelt';
        if (!categories[cat]) {
            categories[cat] = [];
        }
        categories[cat].push(sign);
    });

    // Show "no results" message if filtered list is empty
    if (filteredSigns.length === 0) {
        const noResults = document.createElement('div');
        noResults.style.padding = '20px';
        noResults.style.textAlign = 'center';
        noResults.style.color = '#666';
        noResults.textContent = `Ingen skilt funnet for "${searchQuery}"`;
        container.appendChild(noResults);
        return;
    }

    // Render each category
    Object.keys(categories).sort().forEach(categoryName => {
        // Create category section
        const categorySection = document.createElement('div');
        categorySection.className = 'sign-category';
        categorySection.style.marginBottom = '20px';

        // Category header
        const header = document.createElement('h4');
        header.textContent = `${categoryName} (${categories[categoryName].length})`;
        header.style.fontSize = '14px';
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '10px';
        header.style.color = '#333';
        categorySection.appendChild(header);

        // Signs grid
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
        grid.style.gap = '12px';

        categories[categoryName].forEach(sign => {
            const signItem = createSignItem(sign);
            grid.appendChild(signItem);
        });

        categorySection.appendChild(grid);
        container.appendChild(categorySection);
    });

    console.log(`Sign palette rendered: ${filteredSigns.length} of ${Object.keys(library).length} signs`);
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
    img.style.maxWidth = '100%';
    img.style.maxHeight = '60px';
    img.style.objectFit = 'contain';
    img.style.display = 'block';
    img.style.margin = '0 auto';
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

    // Record polygon placement in history
    addToHistory({
        type: 'add_polygon',
        data: {
            id: placedPolygon.id,
            signId: placedPolygon.signId,
            vertices: placedPolygon.vertices
        }
    });

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

    // Record deletion in history
    addToHistory({
        type: 'delete_polygon',
        data: {
            id: placedPolygon.id,
            signId: placedPolygon.signId,
            vertices: placedPolygon.vertices
        }
    });

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
 * Place a polyline (line) on the map
 * @param {string} signId - Sign ID from library
 * @param {L.LatLng} latlng - Starting position
 * @param {Array} vertices - Optional vertices for line restoration
 * @returns {Object|null} Placed polyline object
 */
function placePolyline(signId, latlng, vertices = null) {
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

    // Determine line weight based on sign type
    let weight;
    if (signId.includes('thin')) {
        weight = 4;
    } else if (signId.includes('medium')) {
        weight = 8;
    } else if (signId.includes('thick')) {
        weight = 12;
    } else {
        weight = 8; // default
    }

    // Create polyline coordinates
    let lineCoords;
    if (vertices && vertices.length >= 2) {
        // Restore existing line
        lineCoords = vertices;
    } else {
        // Create a default short line (will be edited by user)
        const offsetLat = 0.0001; // ~10m
        lineCoords = [
            [latlng.lat, latlng.lng],
            [latlng.lat + offsetLat, latlng.lng]
        ];
    }

    // Create editable polyline
    const polyline = L.polyline(lineCoords, {
        color: 'red',
        weight: weight,
        opacity: 1.0
    });

    // Create popup with delete option
    const popup = L.popup();
    polyline.bindPopup(popup);

    polyline.on('popupopen', () => {
        const popupContainer = createPolylinePopupElement(sign, polyline._leaflet_id);
        popup.setContent(popupContainer);
    });

    // Toggle editing on single click
    polyline.on('click', (e) => {
        L.DomEvent.stopPropagation(e); // Prevent map click

        if (polyline.editEnabled()) {
            // Disable editing
            polyline.disableEdit();
            console.log('Polyline editing disabled');
        } else {
            // Enable editing
            if (map.editTools) {
                polyline.enableEdit();
                console.log('Polyline editing enabled');
            }
        }
    });

    // Open popup on double-click
    polyline.on('dblclick', (e) => {
        L.DomEvent.stopPropagation(e); // Prevent map zoom
        polyline.openPopup(e.latlng);
    });

    // Add to map
    polyline.addTo(map);

    // Store in placed signs
    const placedPolyline = {
        id: polyline._leaflet_id,
        signId: signId,
        polyline: polyline,
        isPolyline: true,
        vertices: lineCoords
    };

    signState.placedSigns.push(placedPolyline);

    // Record polyline placement in history
    addToHistory({
        type: 'add_polyline',
        data: {
            id: placedPolyline.id,
            signId: placedPolyline.signId,
            vertices: placedPolyline.vertices
        }
    });

    // Update vertices when polyline is edited
    polyline.on('editable:vertex:dragend editable:vertex:deleted editable:vertex:new', () => {
        const latLngs = polyline.getLatLngs();
        placedPolyline.vertices = latLngs.map(ll => [ll.lat, ll.lng]);
    });

    // Update UI
    updateSignCount();

    console.log(`Placed polyline: ${sign.name} (weight: ${weight}px)`);
    return placedPolyline;
}

/**
 * Create popup content for a placed polyline
 * @param {Object} sign - Sign object
 * @param {number} polylineId - Leaflet polyline ID
 * @returns {HTMLElement} Popup element with event listeners
 */
function createPolylinePopupElement(sign, polylineId) {
    const placedPolyline = signState.placedSigns.find(s => s.id === polylineId);
    if (!placedPolyline) return document.createElement('div');

    const container = document.createElement('div');
    container.className = 'polyline-popup';
    container.style.minWidth = '200px';

    const title = document.createElement('strong');
    title.textContent = sign.name;
    title.style.display = 'block';
    title.style.marginBottom = '10px';
    container.appendChild(title);

    const info = document.createElement('p');
    info.innerHTML = '<strong>Tips:</strong> Klikk på linje for å aktivere/deaktivere punkter.<br><strong>Dobbeltklikk</strong> for å åpne denne menyen.';
    info.style.fontSize = '11px';
    info.style.marginBottom = '10px';
    info.style.color = '#666';
    container.appendChild(info);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Slett linje';
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.style.width = '100%';
    deleteBtn.addEventListener('click', () => {
        removePolyline(polylineId);
    });
    container.appendChild(deleteBtn);

    return container;
}

/**
 * Remove polyline from map
 * @param {number} polylineId - Leaflet polyline ID
 */
function removePolyline(polylineId) {
    const index = signState.placedSigns.findIndex(s => s.id === polylineId);
    if (index === -1) return;

    const placedPolyline = signState.placedSigns[index];

    // Record deletion in history
    addToHistory({
        type: 'delete_polyline',
        data: {
            id: placedPolyline.id,
            signId: placedPolyline.signId,
            vertices: placedPolyline.vertices
        }
    });

    // Remove from map
    if (placedPolyline.polyline) {
        getMap().removeLayer(placedPolyline.polyline);
    }

    // Remove from array
    signState.placedSigns.splice(index, 1);

    // Update UI
    updateSignCount();

    console.log('Polyline removed');
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

    // Check if this is a line sign
    if (signId.includes('line')) {
        return placePolyline(signId, latlng, vertices);
    }

    // Snap to road if enabled
    const road = getSelectedRoad();
    let finalLatLng = latlng;

    if (signState.snapEnabled && road) {
        finalLatLng = snapToRoad(latlng);
    }

    // Create custom icon
    // Both Markeringsskilt and trafikkskilt need explicit sizing for consistent positioning
    const isMarkeringsskilt = sign.category === 'Markeringsskilt';

    const iconOptions = {
        iconUrl: sign.file,
        popupAnchor: [0, -20],
        className: 'traffic-sign-marker' // Add custom class for styling
    };

    if (isMarkeringsskilt) {
        // Markeringsskilt - use natural SVG size (manually resized to ~32x32)
        // Only set anchor to prevent position drift at different zoom levels
        // Assumes SVGs are resized to approximately 32x32 pixels
        iconOptions.iconAnchor = [16, 16]; // Center anchor for 32x32 - prevents zoom drift
    } else {
        // Trafikkskilt - programmatic size control (too many to resize manually)
        iconOptions.iconSize = [32, 32];
        iconOptions.iconAnchor = [16, 16]; // Center anchor
    }

    const icon = new CORSIcon(iconOptions);

    // Create marker with tooltip for better user feedback
    const marker = L.marker(finalLatLng, {
        icon: icon,
        draggable: true,
        rotationAngle: rotation,
        title: sign.name
    });

    // Add tooltip that shows on hover
    marker.bindTooltip(sign.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -10],
        opacity: 0.9,
        className: 'sign-tooltip'
    });

    // Track old position for undo on drag start
    let dragStartPosition = null;
    marker.on('dragstart', () => {
        const placedSign = signState.placedSigns.find(s => s.id === marker._leaflet_id);
        if (placedSign) {
            dragStartPosition = { lat: placedSign.position.lat, lng: placedSign.position.lng };
        }
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
            const oldPos = dragStartPosition;
            const newPosObj = { lat: snappedPos.lat, lng: snappedPos.lng };

            // Record move in history if position actually changed
            if (oldPos && (oldPos.lat !== newPosObj.lat || oldPos.lng !== newPosObj.lng)) {
                addToHistory({
                    type: 'move_sign',
                    data: {
                        id: placedSign.id,
                        oldPosition: oldPos,
                        newPosition: newPosObj
                    }
                });
            }

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

    // Record sign placement in history
    addToHistory({
        type: 'add_sign',
        data: {
            id: placedSign.id,
            signId: placedSign.signId,
            position: [placedSign.position.lat, placedSign.position.lng],
            rotation: placedSign.rotation,
            customText: placedSign.customText || ''
        }
    });

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

    // Track old rotation for history
    let oldRotation = placedSign.rotation;

    // Update display while dragging
    rotationSlider.addEventListener('input', (e) => {
        const angle = parseInt(e.target.value);
        rotationLabel.textContent = `Rotasjon: ${angle}°`;
        setSignRotation(markerId, angle);
    });

    // Record history when user releases slider
    rotationSlider.addEventListener('change', (e) => {
        const newRotation = parseInt(e.target.value);
        if (oldRotation !== newRotation) {
            addToHistory({
                type: 'rotate_sign',
                data: {
                    id: markerId,
                    oldRotation: oldRotation,
                    newRotation: newRotation
                }
            });
            oldRotation = newRotation;
        }
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

    // Create duplicate button
    const duplicateBtn = document.createElement('button');
    duplicateBtn.className = 'btn btn-secondary';
    duplicateBtn.textContent = '⎘ Dupliser';
    duplicateBtn.style.flex = '1';
    duplicateBtn.style.padding = '5px';
    duplicateBtn.style.fontSize = '12px';
    duplicateBtn.addEventListener('click', () => {
        duplicateSign(markerId);
    });
    actionsDiv.appendChild(duplicateBtn);

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
 * Duplicate a placed sign
 * @param {number} markerId - Leaflet marker ID of the sign to duplicate
 * @returns {Object|null} New placed sign object
 */
export function duplicateSign(markerId) {
    const placedSign = signState.placedSigns.find(s => s.id === markerId);

    if (!placedSign) {
        console.error(`Sign not found: ${markerId}`);
        return null;
    }

    // Close the popup of the original sign
    if (placedSign.marker && placedSign.marker.isPopupOpen()) {
        placedSign.marker.closePopup();
    }

    // Calculate offset position (10 meters south)
    const offsetLat = -0.00009; // ~10m south
    const newLat = placedSign.position.lat + offsetLat;
    const newLng = placedSign.position.lng;
    const newPosition = L.latLng(newLat, newLng);

    // Create new sign with same properties
    const newSign = placeSign(
        placedSign.signId,
        newPosition,
        placedSign.rotation // Preserve rotation!
    );

    // Copy custom text if it exists
    if (newSign && placedSign.customText) {
        setSignCustomText(newSign.id, placedSign.customText);
    }

    // Record duplicate action in history
    if (newSign) {
        addToHistory({
            type: 'duplicate_sign',
            data: {
                newSignId: newSign.id,
                signId: newSign.signId,
                position: [newSign.position.lat, newSign.position.lng],
                rotation: newSign.rotation,
                customText: newSign.customText || ''
            }
        });
    }

    console.log(`Duplicated sign: ${placedSign.signId} with rotation ${placedSign.rotation}°`);
    return newSign;
}

/**
 * Internal function to remove sign without recording history
 * @param {number} markerId - Leaflet marker ID
 */
function removeSignInternal(markerId) {
    const index = signState.placedSigns.findIndex(s => s.id === markerId);
    if (index === -1) return;

    const placedSign = signState.placedSigns[index];

    // Close popup if open
    if (placedSign.marker && placedSign.marker.isPopupOpen()) {
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
}

/**
 * Restore a sign from saved state
 * @param {Object} signData - Saved sign data
 */
function restoreSign(signData) {
    const latlng = L.latLng(signData.position[0], signData.position[1]);
    const newSign = placeSign(signData.signId, latlng, signData.rotation || 0);

    // Restore custom text if it exists
    if (newSign && signData.customText) {
        setSignCustomText(newSign.id, signData.customText);
    }

    // Update the ID to match original if provided
    if (signData.id && newSign) {
        const placedSign = signState.placedSigns.find(s => s.id === newSign.id);
        if (placedSign) {
            placedSign.id = signData.id;
        }
    }
}

/**
 * Move a sign to a new position (internal, no history)
 * @param {number} markerId - Leaflet marker ID
 * @param {Object} position - New position {lat, lng}
 */
function moveSignInternal(markerId, position) {
    const placedSign = signState.placedSigns.find(s => s.id === markerId);
    if (!placedSign || !placedSign.marker) return;

    const latlng = L.latLng(position.lat, position.lng);
    placedSign.marker.setLatLng(latlng);
    placedSign.position = latlng;

    // Update text label position if exists
    if (placedSign.textLabel) {
        placedSign.textLabel.setLatLng(latlng);
    }
}

/**
 * Restore a polygon from saved state
 * @param {Object} polygonData - Saved polygon data
 */
function restorePolygon(polygonData) {
    const centerLat = polygonData.vertices.reduce((sum, v) => sum + v[0], 0) / polygonData.vertices.length;
    const centerLng = polygonData.vertices.reduce((sum, v) => sum + v[1], 0) / polygonData.vertices.length;
    const latlng = L.latLng(centerLat, centerLng);
    placePolygon(polygonData.signId, latlng, polygonData.vertices);
}

/**
 * Restore a polyline from saved state
 * @param {Object} polylineData - Saved polyline data
 */
function restorePolyline(polylineData) {
    const startLat = polylineData.vertices[0][0];
    const startLng = polylineData.vertices[0][1];
    const latlng = L.latLng(startLat, startLng);
    placePolyline(polylineData.signId, latlng, polylineData.vertices);
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

    // Record deletion in history before removing
    addToHistory({
        type: 'delete_sign',
        data: {
            id: placedSign.id,
            signId: placedSign.signId,
            position: [placedSign.position.lat, placedSign.position.lng],
            rotation: placedSign.rotation,
            customText: placedSign.customText || ''
        }
    });

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
        } else if (s.isPolyline) {
            // Polyline data
            return {
                signId: s.signId,
                isPolyline: true,
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

    // Remove all markers, text labels, polygons, and polylines
    signState.placedSigns.forEach(s => {
        if (s.isPolygon) {
            // Remove polygon
            if (map && s.polygon) {
                map.removeLayer(s.polygon);
            }
        } else if (s.isPolyline) {
            // Remove polyline
            if (map && s.polyline) {
                map.removeLayer(s.polyline);
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

    // Clear undo history and disable history tracking during restoration
    signState.history = [];
    signState.historyIndex = -1;
    signState.isUndoRedoOperation = true;

    signs.forEach(signData => {
        if (signData.isPolygon) {
            // Restore polygon with vertices
            const centerLat = signData.vertices.reduce((sum, v) => sum + v[0], 0) / signData.vertices.length;
            const centerLng = signData.vertices.reduce((sum, v) => sum + v[1], 0) / signData.vertices.length;
            const latlng = L.latLng(centerLat, centerLng);
            placeSign(signData.signId, latlng, 0, signData.vertices);
        } else if (signData.isPolyline) {
            // Restore polyline with vertices
            const startLat = signData.vertices[0][0];
            const startLng = signData.vertices[0][1];
            const latlng = L.latLng(startLat, startLng);
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

    // Re-enable history tracking
    signState.isUndoRedoOperation = false;

    console.log(`Restored ${signs.length} signs (undo history cleared)`);
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
 * Re-apply all sign rotations after zoom/move
 * Leaflet overwrites transform during zoom, so we need to restore rotations
 */
function reapplyAllRotations() {
    signState.placedSigns.forEach(placedSign => {
        // Skip polygons and polylines
        if (placedSign.isPolygon || placedSign.isPolyline) {
            return;
        }

        // Re-apply rotation if it's not 0
        if (placedSign.rotation !== 0 && placedSign.marker) {
            const icon = placedSign.marker.getElement();
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

    // Setup search functionality
    const searchInput = document.getElementById('signSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            renderSignPalette(library, query);
        });
        console.log('✓ Sign search initialized');
    }

    // Setup drop zone
    setupMapDropZone();

    // Setup zoom event handler to preserve rotations
    const map = getMap();
    if (map) {
        map.on('zoomend moveend', () => {
            // Re-apply rotations after zoom/pan completes
            reapplyAllRotations();
        });
        console.log('✓ Zoom event handler initialized');
    }

    // Setup keyboard shortcuts for undo/redo
    document.addEventListener('keydown', (e) => {
        // Ctrl+Z or Cmd+Z for undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        // Ctrl+Shift+Z or Ctrl+Y or Cmd+Shift+Z for redo
        else if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
                 ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
            e.preventDefault();
            redo();
        }
    });
    console.log('✓ Undo/redo keyboard shortcuts initialized (Ctrl+Z, Ctrl+Shift+Z)');

    // Make functions globally available (for compatibility)
    window.rotateSign = rotateSign;
    window.removeSign = removeSign;
    window.duplicateSign = duplicateSign;
    window.setSignRotation = setSignRotation;
    window.setSignCustomText = setSignCustomText;
    window.undo = undo;
    window.redo = redo;

    console.log('Sign manager initialized');
}

export default {
    initSignManager,
    placeSign,
    removeSign,
    duplicateSign,
    rotateSign,
    setSignRotation,
    setSignCustomText,
    getPlacedSigns,
    clearAllSigns,
    restoreSigns,
    undo,
    redo,
    clearUndoHistory
};
